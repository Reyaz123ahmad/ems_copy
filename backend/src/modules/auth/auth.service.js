import authRepository from './auth.repository.js';
import { comparePassword, hashPassword } from '../../security/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../security/jwt.js';
import env from '../../config/env.js';
import { AppError } from '../../utils/response.js';
import { resolveShiftForEmployee } from '../shifts/services/shift-resolver.service.js';
import { attendanceRules } from '../attendance/attendance.rules.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { attendanceService } from '../attendance/attendance.service.js';

// In-memory cache for fast user profile lookup (<0.1ms)
const meProfileCache = new Map();

export const authService = {
  /**
   * User login
   */
  async login({ email, password, userAgent, ipAddress }) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      await authRepository.createLoginLog({
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Invalid credentials'
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      await authRepository.createLoginLog({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: `Account status is ${user.status}`
      });
      throw new AppError(`Your account is ${user.status.toLowerCase()}. Please contact administrator.`, 403);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await authRepository.createLoginLog({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Incorrect password'
      });
      throw new AppError('Invalid email or password', 401);
    }

    // Determine primary role
    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: primaryRole,
      companyId: user.companyId,
      employeeId: user.employee?.id || null
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Asynchronously persist session, update last login, log success, and pre-warm cache on next tick
    const expiresAt = new Date(Date.now() + parseInt(env.JWT_REFRESH_EXPIRES_IN_DAYS, 10) * 86400000);
    setImmediate(() => {
      Promise.allSettled([
        authRepository.createSession({
          userId: user.id,
          refreshToken,
          userAgent,
          ipAddress,
          expiresAt
        }),
        authRepository.updateUser(user.id, { lastLoginAt: new Date() }),
        authRepository.createLoginLog({
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          status: 'SUCCESS'
        }),
        user.employee?.id ? attendanceRepository.findEmployeeWithBranch(user.employee.id) : Promise.resolve(),
        user.companyId ? attendanceRules.getCompanyAttendanceSettings(user.companyId) : Promise.resolve(),
        user.employee?.id ? resolveShiftForEmployee({ employeeId: user.employee.id, companyId: user.companyId }) : Promise.resolve(),
        user.companyId ? attendanceService.checkHoliday(user.companyId) : Promise.resolve(),
        user.employee?.id ? attendanceRepository.findTodayAttendance(user.employee.id) : Promise.resolve(),
        user.employee?.id && user.companyId
          ? attendanceRepository.findEmployeeCards(user.employee.id).then((cards) => {
              if (cards && cards.length > 0) {
                if (!global._cardLookupCache) global._cardLookupCache = new Map();
                cards.forEach((c) => {
                  global._cardLookupCache.set(`card:${user.companyId}:${c.cardNumber}`, { data: c, expiresAt: Date.now() + 300000 });
                });
              }
            })
          : Promise.resolve()
      ]).catch(() => {});
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      company: user.company,
      role: primaryRole,
      roles: user.userRoles?.map((ur) => ur.role?.name) || [primaryRole],
      employee: user.employee,
      twoFactorEnabled: false
    };

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken
    };
  },

  /**
   * User logout and invalidate session
   */
  async logout({ refreshToken }) {
    if (refreshToken) {
      await authRepository.deleteSession(refreshToken);
    }
    return { success: true };
  },

  /**
   * Refresh Access and Refresh tokens
   */
  async refreshTokens({ refreshToken }) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const session = await authRepository.findSessionByToken(refreshToken);

    if (!session || new Date() > session.expiresAt) {
      throw new AppError('Session has expired. Please sign in again.', 401);
    }

    const user = await authRepository.findUserById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User not found or inactive', 401);
    }

    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: primaryRole,
      companyId: user.companyId
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Rotate session
    await authRepository.deleteSession(refreshToken);
    const expiresAt = new Date(Date.now() + parseInt(env.JWT_REFRESH_EXPIRES_IN_DAYS, 10) * 86400000);
    await authRepository.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  /**
   * Get current authenticated user profile
   */
  async getMe({ userId }) {
    const cached = meProfileCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    const employee = user.employee || null;
    const photoUrl = employee?.photoUrl || null;
    const name = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : user.email.split('@')[0];

    const result = {
      id: user.id,
      email: user.email,
      name,
      phone: user.phone || employee?.phone || null,
      photoUrl,
      companyId: user.companyId,
      company: user.company,
      role: primaryRole,
      roles: user.userRoles?.map((ur) => ur.role?.name) || [primaryRole],
      employee: employee ? { ...employee, photoUrl } : null,
      twoFactorEnabled: false,
      createdAt: user.createdAt
    };

    meProfileCache.set(userId, { data: result, expiresAt: Date.now() + 60000 });
    return result;
  },

  /**
   * Change current user's password
   */
  async changePassword({ userId, oldPassword, newPassword }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await authRepository.updateUser(userId, { passwordHash: newHash });
    if (user.email) {
      authRepository.clearUserCache(user.email);
    }
    meProfileCache.delete(userId);
    await authRepository.deleteAllUserSessions(userId);

    return { success: true, message: 'Password updated successfully' };
  },

  /**
   * Direct password reset for authenticated user
   */
  async resetPasswordDirect({ userId, newPassword }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(userId, { passwordHash });
    if (user.email) {
      authRepository.clearUserCache(user.email);
    }
    meProfileCache.delete(userId);
    await authRepository.deleteAllUserSessions(userId);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  },

  /**
   * Reset password with email directly (DEV/TEST flow without OTP/email)
   */
  async resetPasswordWithEmail({ email, newPassword }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Do NOT reveal whether the email exists (avoid enumeration)
      return {
        success: true,
        message: 'If the email exists, the password has been reset.'
      };
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(user.id, { passwordHash });
    if (user.email) {
      authRepository.clearUserCache(user.email);
    }
    meProfileCache.delete(user.id);
    await authRepository.deleteAllUserSessions(user.id);

    return {
      success: true,
      message: 'Password has been reset. Please log in.'
    };
  }
};

export default authService;

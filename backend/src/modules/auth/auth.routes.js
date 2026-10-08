import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimit } from '../../middlewares/rateLimiter.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

// Public routes
router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authController.refresh);
router.post('/reset-password-with-email', authRateLimit, authController.resetPasswordWithEmail);

// Logout (can be called with or without auth token)
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticate, cacheResponse('cache:auth_me', 60), authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

// DEV: Direct password reset (no email, no OTP)
router.post('/reset-password-direct', authenticate, authController.resetPasswordDirect);

export default router;

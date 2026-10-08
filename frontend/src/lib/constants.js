export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    RESET_PASSWORD_DIRECT: '/auth/reset-password-direct',
    RESET_PASSWORD_WITH_EMAIL: '/auth/reset-password-with-email'
  },
  COMPANIES: {
    BASE: '/companies'
  },
  EMPLOYEES: {
    BASE: '/employees'
  },
  ATTENDANCE: {
    LOGS: '/attendance/logs',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    BREAKS: '/attendance/breaks',
    EMERGENCY: '/attendance/emergency'
  },
  LEAVES: {
    BASE: '/leaves',
    BALANCES: '/leaves/balances',
    TYPES: '/leaves/types'
  },
  PAYROLL: {
    RUNS: '/payroll/runs',
    SLIPS: '/payroll/slips'
  }
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CLIENT: 'CLIENT'
};

export const PLANS = {
  BASIC: 'Basic',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

export const FEATURES = {
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  OVERTIME: 'overtime',
  ASSETS: 'assets',
  CERTIFICATES: 'certificates',
  PROJECTS: 'projects',
  PERFORMANCE: 'performance'
};

export const ATTENDANCE_MODES = {
  FACE: 'FACE',
  CARD: 'CARD',
  FINGERPRINT: 'FINGERPRINT',
  GEOFENCE: 'GEOFENCE',
  HYBRID: 'HYBRID'
};

/**
 * Security Configuration
 * Constants and configuration for security features
 */

import { env } from './env.js';

/**
 * JWT Configuration
 */
export const jwtConfig = {
    access: {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: env.JWT_ACCESS_EXPIRY,
    },
    refresh: {
        secret: env.JWT_REFRESH_SECRET,
        expiresIn: env.JWT_REFRESH_EXPIRY,
    },
} as const;

/**
 * Password Hashing Configuration
 */
export const passwordConfig = {
    argon2: {
        type: 2, // Argon2id
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
    },
} as const;

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
    global: {
        max: env.RATE_LIMIT_MAX,
        timeWindow: env.RATE_LIMIT_WINDOW,
    },
    auth: {
        max: 5, // 5 attempts
        timeWindow: '15m',
    },
    api: {
        max: 100,
        timeWindow: '1m',
    },
} as const;

/**
 * CORS Configuration
 */
export const corsConfig = {
    origin: [
        env.CORS_ORIGIN,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://172.26.192.1:3000',
        'http://172.26.192.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'X-CSRF-Token', 'X-Device-ID', 'X-Request-Time', 'skip-auth'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours
} as const;

/**
 * Helmet Security Headers Configuration
 */
export const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
} as const;

/**
 * Input Validation Configuration
 */
export const validationConfig = {
    maxBodySize: env.MAX_FILE_SIZE,
    allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
} as const;

/**
 * Session Configuration
 */
export const sessionConfig = {
    maxDevices: 5, // Maximum devices per user
    deviceFingerprintLength: 64,
    sessionTimeout: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

/**
 * CSRF Configuration
 */
export const csrfConfig = {
    enabled: env.NODE_ENV === 'production',
    cookieName: 'csrf-token',
    headerName: 'X-CSRF-Token',
} as const;

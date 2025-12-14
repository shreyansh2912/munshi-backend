/**
 * Environment Configuration
 * Validates and exports type-safe environment variables using Zod
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable schema
 * All required variables must be defined, optional ones have defaults
 */
const envSchema = z.object({
    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
    APP_NAME: z.string().default('Munshi Backend'),
    API_VERSION: z.string().default('v1'),

    // Database - MySQL
    DATABASE_URL: z.string().url(),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().transform(Number).pipe(z.number()).default('3306'),
    DB_USER: z.string().default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().default('munshi'),

    // Database - MongoDB
    MONGODB_URI: z.string().url(),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform(Number).pipe(z.number()).default('6379'),
    REDIS_PASSWORD: z.string().optional(),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // Security
    BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
    RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number()).default('100'),
    RATE_LIMIT_WINDOW: z.string().default('15m'),
    CORS_ORIGIN: z.string().default('http://localhost:3001'),

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // File Upload
    MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number()).default('10485760'),
    UPLOAD_DIR: z.string().default('./uploads'),

    // BullMQ
    BULL_REDIS_HOST: z.string().default('localhost'),
    BULL_REDIS_PORT: z.string().transform(Number).pipe(z.number()).default('6379'),

    // Storage
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    APP_URL: z.string().default('http://localhost:3000'),

    // AWS S3 (optional, required if using S3)
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_BUCKET: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    AWS_URL: z.string().optional(),
});

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
            throw new Error(
                `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env file.`
            );
        }
        throw error;
    }
};

/**
 * Validated and type-safe environment configuration
 */
export const env = parseEnv();

/**
 * Type export for use in other modules
 */
export type Env = z.infer<typeof envSchema>;

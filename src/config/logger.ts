/**
 * Logger Configuration
 * Pino logger setup with environment-specific configuration
 */

import pino from 'pino';

import { env } from './env.js';

/**
 * Create logger instance with appropriate configuration
 * Development: Pretty-printed logs
 * Production: JSON logs for structured logging
 */
export const logger = pino({
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'development'
        ? {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        }
        : {}),
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        env: env.NODE_ENV,
        app: env.APP_NAME,
    },
});

/**
 * Create child logger with additional context
 * @param context - Additional context to add to all log messages
 * @returns Child logger instance
 */
export const createLogger = (context: Record<string, unknown>) => {
    return logger.child(context);
};

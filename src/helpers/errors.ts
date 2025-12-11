/**
 * Custom Error Classes
 * Application-specific error types for better error handling
 */

/**
 * Error codes enum for consistent error identification
 */
export enum ErrorCode {
    // General
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    BAD_REQUEST = 'BAD_REQUEST',

    // Validation
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',

    // Authentication
    UNAUTHORIZED = 'UNAUTHORIZED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    TOKEN_INVALID = 'TOKEN_INVALID',
    REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',

    // Authorization
    FORBIDDEN = 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

    // User
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Database
    DATABASE_ERROR = 'DATABASE_ERROR',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

    // File Upload
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

    // Business Logic
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: ErrorCode;
    public readonly details?: unknown;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number,
        errorCode: ErrorCode,
        details?: unknown,
        isOperational = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = isOperational;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, ErrorCode.VALIDATION_ERROR, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
    constructor(message: string, errorCode: ErrorCode = ErrorCode.UNAUTHORIZED, details?: unknown) {
        super(message, 401, errorCode, details);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 403, ErrorCode.FORBIDDEN, details);
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 404, ErrorCode.NOT_FOUND, details);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
    constructor(message: string, errorCode: ErrorCode = ErrorCode.DUPLICATE_ENTRY, details?: unknown) {
        super(message, 409, errorCode, details);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, details);
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/**
 * Check if error is an operational error
 */
export const isOperationalError = (error: Error): boolean => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};

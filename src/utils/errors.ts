/**
 * Custom Error Classes
 * 
 * Production-ready error handling with custom error types for different scenarios.
 * Provides consistent error messages and proper HTTP status codes.
 * 
 * @module utils/errors
 */

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

/**
 * Base application error class
 * 
 * All custom errors extend this class for consistent error handling.
 */
export class AppError extends Error {
    /** HTTP status code */
    public readonly statusCode: number;

    /** Error code for client identification */
    public readonly errorCode: string;

    /** Whether error details should be exposed to client */
    public readonly isOperational: boolean;

    /** Additional error details */
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        errorCode: string = 'INTERNAL_ERROR',
        isOperational: boolean = true,
        details?: any
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Validation Error
 * 
 * Thrown when data validation fails (400 Bad Request).
 * 
 * @example
 * ```ts
 * throw new ValidationError('Invalid email format', { email: 'Invalid format' });
 * ```
 */
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(message, 400, 'VALIDATION_ERROR', true, details);
    }
}

/**
 * Business Logic Validation Error
 * 
 * Thrown when business rules are violated (422 Unprocessable Entity).
 * 
 * @example
 * ```ts
 * throw new BusinessLogicError('Credit limit exceeded');
 * ```
 */
export class BusinessLogicError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 422, 'BUSINESS_LOGIC_ERROR', true, details);
    }
}

// ============================================================================
// RESOURCE ERRORS
// ============================================================================

/**
 * Not Found Error
 * 
 * Thrown when a requested resource doesn't exist (404 Not Found).
 * 
 * @example
 * ```ts
 * throw new NotFoundError('Customer', id);
 * ```
 */
export class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string | number) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;

        super(message, 404, 'NOT_FOUND', true);
    }
}

/**
 * Already Exists Error
 * 
 * Thrown when attempting to create a duplicate resource (409 Conflict).
 * 
 * @example
 * ```ts
 * throw new AlreadyExistsError('Customer', 'code', 'CUST001');
 * ```
 */
export class AlreadyExistsError extends AppError {
    constructor(resource: string, field: string, value: string) {
        const message = `${resource} with ${field} '${value}' already exists`;
        super(message, 409, 'ALREADY_EXISTS', true, { field, value });
    }
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Unauthorized Error
 * 
 * Thrown when authentication is required but not provided (401 Unauthorized).
 * 
 * @example
 * ```ts
 * throw new UnauthorizedError();
 * ```
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED', true);
    }
}

/**
 * Forbidden Error
 * 
 * Thrown when user lacks permissions (403 Forbidden).
 * 
 * @example
 * ```ts
 * throw new ForbiddenError('Admin access required');
 * ```
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'FORBIDDEN', true);
    }
}

/**
 * Invalid Credentials Error
 * 
 * Thrown when login credentials are incorrect (401 Unauthorized).
 * 
 * @example
 * ```ts
 * throw new InvalidCredentialsError();
 * ```
 */
export class InvalidCredentialsError extends AppError {
    constructor(message: string = 'Invalid email or password') {
        super(message, 401, 'INVALID_CREDENTIALS', true);
    }
}

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

/**
 * Database Error
 * 
 * Thrown when database operations fail (500 Internal Server Error).
 * 
 * @example
 * ```ts
 * throw new DatabaseError('Failed to connect to database', originalError);
 * ```
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(
            message,
            500,
            'DATABASE_ERROR',
            false, // Not operational - system issue
            originalError
        );
    }
}

/**
 * External Service Error
 * 
 * Thrown when external API calls fail (502 Bad Gateway).
 * 
 * @example
 * ```ts
 * throw new ExternalServiceError('Payment gateway', 'Timeout');
 * ```
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message: string) {
        super(
            `External service '${service}' error: ${message}`,
            502,
            'EXTERNAL_SERVICE_ERROR',
            true
        );
    }
}

// ============================================================================
// FILE & UPLOAD ERRORS
// ============================================================================

/**
 * File Upload Error
 * 
 * Thrown when file upload fails or file is invalid (400 Bad Request).
 * 
 * @example
 * ```ts
 * throw new FileUploadError('File size exceeds limit');
 * ```
 */
export class FileUploadError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'FILE_UPLOAD_ERROR', true, details);
    }
}

/**
 * Invalid File Type Error
 * 
 * Thrown when uploaded file type is not allowed (400 Bad Request).
 * 
 * @example
 * ```ts
 * throw new InvalidFileTypeError('image/jpeg', ['image/png', 'image/jpg']);
 * ```
 */
export class InvalidFileTypeError extends AppError {
    constructor(receivedType: string, allowedTypes: string[]) {
        super(
            `Invalid file type '${receivedType}'. Allowed types: ${allowedTypes.join(', ')}`,
            400,
            'INVALID_FILE_TYPE',
            true,
            { receivedType, allowedTypes }
        );
    }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate Limit Error
 * 
 * Thrown when rate limit is exceeded (429 Too Many Requests).
 * 
 * @example
 * ```ts
 * throw new RateLimitError(60);
 * ```
 */
export class RateLimitError extends AppError {
    constructor(retryAfter: number) {
        super(
            `Rate limit exceeded. Try again in ${retryAfter} seconds`,
            429,
            'RATE_LIMIT_EXCEEDED',
            true,
            { retryAfter }
        );
    }
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Check if error is an operational error
 * 
 * Operational errors are expected errors that should be handled gracefully.
 * Non-operational errors are programming errors that indicate bugs.
 * 
 * @param error - Error to check
 * @returns True if error is operational
 */
export function isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}

/**
 * Format error for client response
 * 
 * Strips sensitive information from errors in production.
 * 
 * @param error - Error to format
 * @param includeStack - Whether to include stack trace (dev only)
 * @returns Formatted error object
 */
export function formatErrorResponse(error: Error, includeStack: boolean = false) {
    if (error instanceof AppError) {
        return {
            success: false,
            statusCode: error.statusCode,
            errorCode: error.errorCode,
            message: error.message,
            details: error.details,
            ...(includeStack && { stack: error.stack }),
        };
    }

    // Unknown error - don't expose details in production
    return {
        success: false,
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        message: includeStack ? error.message : 'An unexpected error occurred',
        ...(includeStack && { stack: error.stack }),
    };
}

/**
 * Wrap async function with error handling
 * 
 * Catches errors and formats them properly.
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function
 */
export function catchAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: Parameters<T>) => {
        return Promise.resolve(fn(...args)).catch((error) => {
            throw error;
        });
    }) as T;
}

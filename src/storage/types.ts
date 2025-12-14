/**
 * Storage System - Type Definitions
 */

/**
 * File visibility options
 */
export enum Visibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
}

/**
 * Upload options for files
 */
export interface UploadOptions {
    visibility?: Visibility;
    mimeType?: string;
    metadata?: Record<string, string>;
}

/**
 * File metadata
 */
export interface FileMetadata {
    path: string;
    size: number;
    mimeType?: string;
    lastModified?: Date;
    visibility?: Visibility;
}

/**
 * Storage driver interface
 * All storage drivers must implement this interface
 */
export interface StorageDriver {
    /**
     * Store a file
     * @param path - File path within the storage
     * @param content - File content as Buffer
     * @param options - Upload options
     */
    put(path: string, content: Buffer, options?: UploadOptions): Promise<void>;

    /**
     * Get file content
     * @param path - File path
     * @returns File content as Buffer
     */
    get(path: string): Promise<Buffer>;

    /**
     * Check if file exists
     * @param path - File path
     * @returns True if file exists
     */
    exists(path: string): Promise<boolean>;

    /**
     * Delete a file
     * @param path - File path
     */
    delete(path: string): Promise<void>;

    /**
     * Get public URL for a file
     * @param path - File path
     * @returns Public URL
     */
    url(path: string): string;

    /**
     * Get temporary URL for a private file
     * @param path - File path
     * @param expiresIn - Expiration time in seconds
     * @returns Temporary URL
     */
    temporaryUrl(path: string, expiresIn: number): Promise<string>;

    /**
     * Set file visibility
     * @param path - File path
     * @param visibility - Public or private
     */
    setVisibility(path: string, visibility: Visibility): Promise<void>;

    /**
     * Get file metadata
     * @param path - File path
     * @returns File metadata
     */
    getMetadata(path: string): Promise<FileMetadata>;
}

/**
 * Storage disk configuration
 */
export interface DiskConfig {
    driver: 'local' | 's3';
    root?: string; // For local driver
    url?: string; // For local driver
    bucket?: string; // For S3
    region?: string; // For S3
    key?: string; // For S3
    secret?: string; // For S3
    visibility?: Visibility;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
    default: string;
    disks: Record<string, DiskConfig>;
}

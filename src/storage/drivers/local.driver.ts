/**
 * Local Filesystem Storage Driver
 * Stores files on the local disk with public/private directory support
 */

import fs from 'fs/promises';
import path from 'path';
import { StorageDriver, Visibility, UploadOptions, FileMetadata, DiskConfig } from '@storage/types.js';

export class LocalDriver implements StorageDriver {
    private root: string;
    private baseUrl: string;
    private defaultVisibility: Visibility;

    constructor(config: DiskConfig) {
        this.root = config.root || path.join(process.cwd(), 'storage', 'app');
        this.baseUrl = config.url || '';
        this.defaultVisibility = config.visibility || Visibility.PRIVATE;
    }

    /**
     * Get full file path
     */
    private getFullPath(filePath: string): string {
        return path.join(this.root, filePath);
    }

    /**
     * Ensure directory exists
     */
    private async ensureDirectory(filePath: string): Promise<void> {
        const directory = path.dirname(this.getFullPath(filePath));
        await fs.mkdir(directory, { recursive: true });
    }

    /**
     * Store a file
     */
    async put(filePath: string, content: Buffer, options?: UploadOptions): Promise<void> {
        await this.ensureDirectory(filePath);
        const fullPath = this.getFullPath(filePath);
        await fs.writeFile(fullPath, content);

        // If visibility is specified and different from default, we might want to move the file
        // For now, we'll just store it in the configured root
    }

    /**
     * Get file content
     */
    async get(filePath: string): Promise<Buffer> {
        const fullPath = this.getFullPath(filePath);

        try {
            return await fs.readFile(fullPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw error;
        }
    }

    /**
     * Check if file exists
     */
    async exists(filePath: string): Promise<boolean> {
        try {
            const fullPath = this.getFullPath(filePath);
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete a file
     */
    async delete(filePath: string): Promise<void> {
        const fullPath = this.getFullPath(filePath);

        try {
            await fs.unlink(fullPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
            // File doesn't exist, silently succeed
        }
    }

    /**
     * Get public URL for a file
     */
    url(filePath: string): string {
        // Remove leading slash if present
        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        return `${this.baseUrl}/${cleanPath}`;
    }

    /**
     * Get temporary URL for a private file
     * For local storage, this is the same as url() since we'll handle access via middleware
     */
    async temporaryUrl(filePath: string, expiresIn: number): Promise<string> {
        // For local storage, we return a URL with a token that the middleware will validate
        const timestamp = Date.now() + (expiresIn * 1000);
        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        return `${this.baseUrl}/${cleanPath}?expires=${timestamp}`;
    }

    /**
     * Set file visibility
     * For local storage, this would involve moving the file between public/private directories
     */
    async setVisibility(filePath: string, visibility: Visibility): Promise<void> {
        // For now, this is a no-op as visibility is determined by which disk (public/private) is used
        // In a more advanced implementation, we could move files between directories
    }

    /**
     * Get file metadata
     */
    async getMetadata(filePath: string): Promise<FileMetadata> {
        const fullPath = this.getFullPath(filePath);

        try {
            const stats = await fs.stat(fullPath);

            return {
                path: filePath,
                size: stats.size,
                lastModified: stats.mtime,
                visibility: this.defaultVisibility,
            };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw error;
        }
    }
}

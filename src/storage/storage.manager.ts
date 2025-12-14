/**
 * Storage Manager
 * Factory for creating and managing storage drivers (Laravel-style)
 */

import { StorageDriver, StorageConfig, DiskConfig } from './types.js';
import { LocalDriver } from './drivers/local.driver.js';
import { S3Driver } from './drivers/s3.driver.js';

export class StorageManager {
    private config: StorageConfig;
    private drivers: Map<string, StorageDriver> = new Map();

    constructor(config: StorageConfig) {
        this.config = config;
    }

    /**
     * Get a storage driver instance
     * @param name - Disk name (default uses config.default)
     * @returns Storage driver instance
     */
    disk(name?: string): StorageDriver {
        const diskName = name || this.config.default;

        // Return cached driver if exists
        if (this.drivers.has(diskName)) {
            return this.drivers.get(diskName)!;
        }

        // Get disk configuration
        const diskConfig = this.config.disks[diskName];
        if (!diskConfig) {
            throw new Error(`Disk "${diskName}" is not configured`);
        }

        // Create driver instance
        const driver = this.createDriver(diskConfig);

        // Cache the driver
        this.drivers.set(diskName, driver);

        return driver;
    }

    /**
     * Create a storage driver based on configuration
     */
    private createDriver(config: DiskConfig): StorageDriver {
        switch (config.driver) {
            case 'local':
                return new LocalDriver(config);

            case 's3':
                return new S3Driver(config);

            default:
                throw new Error(`Unsupported storage driver: ${config.driver}`);
        }
    }

    /**
     * Shorthand methods for default disk
     */
    async put(path: string, content: Buffer, options?: any): Promise<void> {
        return this.disk().put(path, content, options);
    }

    async get(path: string): Promise<Buffer> {
        return this.disk().get(path);
    }

    async exists(path: string): Promise<boolean> {
        return this.disk().exists(path);
    }

    async delete(path: string): Promise<void> {
        return this.disk().delete(path);
    }

    url(path: string): string {
        return this.disk().url(path);
    }

    async temporaryUrl(path: string, expiresIn: number): Promise<string> {
        return this.disk().temporaryUrl(path, expiresIn);
    }

    async setVisibility(path: string, visibility: any): Promise<void> {
        return this.disk().setVisibility(path, visibility);
    }

    async getMetadata(path: string): Promise<any> {
        return this.disk().getMetadata(path);
    }
}

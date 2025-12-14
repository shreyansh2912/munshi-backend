/**
 * Storage Configuration
 * Laravel-style file storage configuration
 */

import { StorageConfig, Visibility } from '@storage/types.js';
import { env } from '@config/env.js';
import path from 'path';

/**
 * Storage configuration
 */
export const storageConfig: StorageConfig = {
    // Default disk to use
    default: env.STORAGE_DRIVER || 'local',

    // Available disks
    disks: {
        // Local filesystem storage
        local: {
            driver: 'local',
            root: path.join(process.cwd(), 'storage', 'app', 'private'),
            url: `${env.APP_URL || 'http://localhost:3000'}/storage`,
            visibility: Visibility.PRIVATE,
        },

        // Public local filesystem storage
        public: {
            driver: 'local',
            root: path.join(process.cwd(), 'storage', 'app', 'public'),
            url: `${env.APP_URL || 'http://localhost:3000'}/storage/public`,
            visibility: Visibility.PUBLIC,
        },

        // AWS S3 storage
        s3: {
            driver: 's3',
            bucket: env.AWS_BUCKET || '',
            region: env.AWS_REGION || 'us-east-1',
            key: env.AWS_ACCESS_KEY_ID || '',
            secret: env.AWS_SECRET_ACCESS_KEY || '',
            ...(env.AWS_URL && { url: env.AWS_URL }),
            visibility: Visibility.PRIVATE,
        },
    },
};

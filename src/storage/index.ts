/**
 * Storage System Export
 * Singleton instance of storage manager
 */

import { StorageManager } from './storage.manager.js';
import { storageConfig } from '@config/storage.js';

/**
 * Singleton storage instance
 * Usage:
 *   import { storage } from '@storage';
 *   await storage.put('path/to/file.pdf', buffer);
 *   await storage.disk('s3').put('path/to/file.pdf', buffer);
 */
export const storage = new StorageManager(storageConfig);

// Export types and classes
export * from './types.js';
export { StorageManager } from './storage.manager.js';
export { LocalDriver } from './drivers/local.driver.js';
export { S3Driver } from './drivers/s3.driver.js';

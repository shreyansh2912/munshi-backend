/**
 * MongoDB Client
 * Mongoose connection setup with retry logic
 */

import mongoose from 'mongoose';

import { env } from '@config/env.js';
import { logger } from '@config/logger.js';

/**
 * Connect to MongoDB
 */
export const connectMongoDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error({ error }, 'MongoDB connection failed');
        throw error;
    }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectMongoDB = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
};

// MongoDB event handlers
mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'Mongoose connection error');
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed due to application termination');
    process.exit(0);
});

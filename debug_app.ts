
import { createApp } from './src/app.js';
import { logger } from './src/config/logger.js';
import fs from 'fs';

const log = (msg: string) => fs.appendFileSync('debug.log', msg + '\n');

log('Starting debug script...');

try {
    log('Calling createApp...');
    const app = await createApp();
    log('createApp successful!');
    await app.ready();
    log('App ready!');
} catch (error) {
    log('Debug script error: ' + error);
    if (error instanceof Error) {
        log('Stack: ' + error.stack);
    }
}

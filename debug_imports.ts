
import fs from 'fs';
const log = (msg: string) => fs.appendFileSync('debug_imports.log', msg + '\n');

log('Starting debug imports...');

try {
    log('Importing env...');
    await import('./src/config/env.js');
    log('Importing logger...');
    await import('./src/config/logger.js');
    log('Importing security...');
    await import('./src/config/security.js');
    log('Importing errorHandler...');
    await import('./src/middlewares/errorHandler.js');
    log('Importing ipLogger...');
    await import('./src/middlewares/ipLogger.js');
    log('Importing authRoutes...');
    await import('./src/modules/auth/auth.routes.js');
    log('Importing userRoutes...');
    await import('./src/modules/user/user.routes.js');
    log('Importing ledgerRoutes...');
    await import('./src/modules/ledger/ledger.routes.js');

    log('All imports successful!');
} catch (error) {
    log('Import error: ' + error);
}

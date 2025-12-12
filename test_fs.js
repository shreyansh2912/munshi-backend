
const fs = require('fs');
try {
    fs.appendFileSync('test_fs.log', 'Hello from test_fs.js\n');
    console.log('Write successful');
} catch (e) {
    console.error('Write failed:', e);
}

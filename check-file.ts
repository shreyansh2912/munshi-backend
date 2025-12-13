
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'src/db/schema/auth.ts');
console.log('Checking file:', p);
if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    if (content.includes('export const deviceFingerprints')) {
        console.log('FOUND');
    } else {
        console.log('NOT FOUND');
    }
} else {
    console.log('FILE NOT FOUND');
}

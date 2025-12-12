// Script to remove both $onUpdate AND .$type from all schema files
const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, 'src', 'db', 'schema');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));

console.log(`Found ${files.length} schema files`);

files.forEach(file => {
    const filePath = path.join(schemaDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Count issues before
    const onUpdateCount = (content.match(/\.\$onUpdate/g) || []).length;
    const typeCount = (content.match(/\.\$type</g) || []).length;

    // Remove $onUpdate calls - try multiple patterns
    content = content.replace(/\.\$onUpdate\([^)]*\)/g, '');
    content = content.replace(/\.\$onUpdate\(\(\)\s*=>\s*new\s+Date\(\)\)/g, '');

    // Remove .$type<...>() calls
    content = content.replace(/\.\$type<[^>]+>\(\)/g, '');

    fs.writeFileSync(filePath, content, 'utf8');

    const onUpdateAfter = (content.match(/\.\$onUpdate/g) || []).length;
    const typeAfter = (content.match(/\.\$type</g) || []).length;

    console.log(`${file}: Removed ${onUpdateCount - onUpdateAfter} $onUpdate, ${typeCount - typeAfter} $type`);
});

console.log('\nDone! All $onUpdate and $type modifiers removed.');

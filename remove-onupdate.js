// Script to remove $onUpdate from all schema files
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const schemaDir = path.join(__dirname, 'src', 'db', 'schema');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));

console.log(`Found ${files.length} schema files`);

files.forEach(file => {
    const filePath = path.join(schemaDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Count occurrences before
    const beforeCount = (content.match(/\.\$onUpdate/g) || []).length;

    // Remove $onUpdate calls
    content = content.replace(/\.\$onUpdate\([^)]+\)/g, '');

    //Count occurrences after
    const afterCount = (content.match(/\.\$onUpdate/g) || []).length;

    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`${file}: Removed ${beforeCount - afterCount} $onUpdate calls`);
});

console.log('Done!');

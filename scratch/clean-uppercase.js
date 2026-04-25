const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

walk('./src', (filePath) => {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove 'uppercase' como palavra inteira nas classes
        let newContent = content.replace(/\buppercase\b/g, '');
        // Remove text-transform: uppercase
        newContent = newContent.replace(/text-transform:\s*uppercase;?/gi, '');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Cleaned: ${filePath}`);
        }
    }
});

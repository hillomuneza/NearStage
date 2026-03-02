const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            replaceInDir(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('RIAPMS')) {
                console.log(`Updating branding in: ${filePath}`);
                // Replace RIAPMS with NearStage
                content = content.replace(/RIAPMS/g, 'NearStage');
                // Also handle the full name replacement if found
                content = content.replace(/Rwanda Internship & Academic Placement Management System/g, 'NearStage - Professional Internship & Placement Management System');
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}

console.log('Starting branding update...');
replaceInDir(directoryPath);
console.log('Branding update complete!');

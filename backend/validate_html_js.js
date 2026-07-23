const fs = require('fs');
const path = require('path');
const htmlPath = 'C:\\Projetos Antigravity\\Connect Web  Editor\\Tools\\monitor.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract script content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.log("No script tag found!");
    process.exit(1);
}
const js = scriptMatch[1];
const tempFile = path.join(__dirname, 'temp_check.js');
fs.writeFileSync(tempFile, js, 'utf8');

const { exec } = require('child_process');
exec(`node --check "${tempFile}"`, (err, stdout, stderr) => {
    if (err) {
        console.error("Syntax Error found!");
        console.error(stderr);
        const match = stderr.match(/temp_check\.js:(\d+)/);
        if (match) {
            const lineNum = parseInt(match[1], 10);
            const lines = html.split('\n');
            let scriptStartLine = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('<script>')) {
                    scriptStartLine = i + 1;
                    break;
                }
            }
            console.log(`Exact line in monitor.html: ${scriptStartLine + lineNum}`);
            for (let i = Math.max(0, scriptStartLine + lineNum - 3); i < Math.min(lines.length, scriptStartLine + lineNum + 3); i++) {
                console.log(`${i+1}: ${lines[i]}`);
            }
        }
    } else {
        console.log("Syntax is valid!");
    }
    fs.unlinkSync(tempFile);
});

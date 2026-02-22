const fs = require('fs');
const path = require('path');
console.log("Starting write test");
try {
    const file = path.join(__dirname, 'test_log.txt');
    fs.writeFileSync(file, 'Hello from test_write.js');
    console.log("File written to " + file);
} catch (e) {
    console.error("Write failed:", e);
}

const fs = require('fs');
const path = require('path');

function rmrf(dir) {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log('Deleted:', fullPath);
  } else {
    console.log('Not found (already clean):', fullPath);
  }
}

rmrf('.next');
rmrf('.turbo');
rmrf('node_modules/.cache');
console.log('Cache cleared successfully!');

const fs = require('fs');
const path = require('path');

const viewsDir = 'src/pages/console/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
  if (!content.includes('useQuery')) {
    // We will just report it for now to see what's left
    console.log(file + ' is not using useQuery');
  }
}

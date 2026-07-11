const fs = require('fs');
const path = require('path');

const viewsDir = 'src/pages/console/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
  let status = 'UNKNOWN';
  if (content.includes('fetch(') || content.includes('useQuery')) {
    status = 'REAL (fetches data internally)';
  } else if (content.includes('state.statsAdmin') || content.includes('state.products') || content.includes('state.ads') || content.includes('state.pendingKYC')) {
     status = 'REAL (from ConsolePro state)';
  } else if (content.includes('const [') && content.includes('useState([') || content.includes('const data = [') || content.includes('mock') || content.includes('fake')) {
    status = 'MOCK / STATIC';
  } else if (content.includes('En cours de développement')) {
    status = 'WIP / STATIC';
  } else if (content.length < 500) {
    status = 'TBD';
  } else {
    status = 'MOCK / STATIC (probably)';
  }
  console.log(`${file}: ${status}`);
}

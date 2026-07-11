const fs = require('fs');

let admin = fs.readFileSync('src/pages/AdminContentModeration.tsx', 'utf8');
admin = admin.replace(
  'return res.json();',
  'const data = await res.json();\n      return data.data || data;'
);
admin = admin.replace(
  'return res.json();',
  'const data = await res.json();\n      return data.data || data;'
);

fs.writeFileSync('src/pages/AdminContentModeration.tsx', admin);

let consolePro = fs.readFileSync('src/pages/ConsolePro.tsx', 'utf8');
consolePro = consolePro.replace(
  'const [pRes, tRes] = await Promise.all([',
  'const [pResRaw, tResRaw] = await Promise.all(['
).replace(
  'fetch(\'/api/products\'),',
  'fetch(\'/api/products\').then(r => r.json()),'
).replace(
  'fetch(\'/api/tenders\')',
  'fetch(\'/api/tenders\').then(r => r.json())'
);

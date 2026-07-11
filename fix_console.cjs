const fs = require('fs');

let consolePro = fs.readFileSync('src/pages/ConsolePro.tsx', 'utf8');

consolePro = consolePro.replace(
  'const data = await resProducts.json();',
  'let data = await resProducts.json();\n          if (data && data.data) data = data.data;'
);

consolePro = consolePro.replace(
  'const tData = await resTenders.json();',
  'let tData = await resTenders.json();\n          if (tData && tData.data) tData = tData.data;'
);

fs.writeFileSync('src/pages/ConsolePro.tsx', consolePro);

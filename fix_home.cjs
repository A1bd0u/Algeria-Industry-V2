const fs = require('fs');

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');
home = home.replace(
  'try { pData = await prodRes.json(); } catch(e){}',
  'try { const res = await prodRes.json(); pData = res.data || res; } catch(e){}'
);
fs.writeFileSync('src/pages/Home.tsx', home);

let exhibitors = fs.readFileSync('src/pages/Exhibitors.tsx', 'utf8');
exhibitors = exhibitors.replace(
  'const data = await res.json();',
  'let data = await res.json();\n        if (data && data.data) data = data.data;'
);
fs.writeFileSync('src/pages/Exhibitors.tsx', exhibitors);

let admin = fs.readFileSync('src/pages/AdminContentModeration.tsx', 'utf8');
admin = admin.replace(
  'let data = await res.json();',
  'let data = await res.json();\n      if (data && data.data) data = data.data;'
);
// wait, we need to check how many times it's used in AdminContentModeration.tsx

const fs = require('fs');

let dir = fs.readFileSync('src/pages/Directory.tsx', 'utf8');

dir = dir.replace(
  '           if (result.totalPages) setTotalPages(result.totalPages);\n           if (result.total) setTotalItems(result.total);',
  ''
);

fs.writeFileSync('src/pages/Directory.tsx', dir);

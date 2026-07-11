const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

code = code.replace(`            )}
            )}
            
            {/* Pagination */}`, `            )}
            {/* Pagination */}`);

fs.writeFileSync('src/pages/Products.tsx', code);

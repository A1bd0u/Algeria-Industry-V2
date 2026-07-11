const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

code = code.replace('        )}\n      </div>\n          {/* Report Modal */}', '        )}\n          {/* Report Modal */}');

fs.writeFileSync('src/pages/ProductDetail.tsx', code);

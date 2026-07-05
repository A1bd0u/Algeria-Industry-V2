const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
code = code.replace(`import AddProduct from '../components/AddProduct';`, `import AddProduct from '../pages/AddProduct';`);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Updated import");

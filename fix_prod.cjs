const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf-8');

code = code.replace(`        await fetch(\`/api/favorites/item/\${productId}\`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(f => f.item_id !== productId));`, `        await fetch(\`/api/favorites/\${isFav.id}\`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(f => f.item_id !== productId));`);

fs.writeFileSync('src/pages/Products.tsx', code);
console.log("Updated Products.tsx");

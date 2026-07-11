const fs = require('fs');
let file = fs.readFileSync('src/pages/Products.tsx', 'utf8');

file = file.replace(/Rejoignez 500\+ fournisseurs en Algérie/g, "{t('products.join_suppliers')}");
file = file.replace(/>\s*Précédent\s*<\/span>/g, ">{t('products.prev')}</span>");
file = file.replace(/>\s*Suivant\s*<\/span>/g, ">{t('products.next')}</span>");

fs.writeFileSync('src/pages/Products.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

file = file.replace(/>\s*Produits Similaires\s*<\/h2>/g, ">{t('products.similar')}</h2>");
file = file.replace(/>\s*Signaler un contenu inapproprié\s*<\/h3>/g, ">{t('products.report')}</h3>");
file = file.replace(/>\s*Aidez-nous à garder Algiers Industry sûr\. Pourquoi signalez-vous ce produit \?\s*<\/p>/g, ">{t('products.report_desc')}</p>");
file = file.replace(/>\s*Annuler\s*<\/button>/g, ">{t('products.cancel')}</button>");
file = file.replace(/>\s*Envoyer le signalement\s*<\/button>/g, ">{t('products.send_report')}</button>");

fs.writeFileSync('src/pages/ProductDetail.tsx', file);

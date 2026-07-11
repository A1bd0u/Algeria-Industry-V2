const fs = require('fs');
let file = fs.readFileSync('src/pages/Directory.tsx', 'utf8');

file = file.replace(/Une erreur s'est produite/g, "{t('common.error')}");
file = file.replace(/Impossible de charger les données\./g, "{t('common.error_desc')}");
file = file.replace(/>\s*Réessayer\s*<\/span>/g, ">{t('common.retry')}</span>");

fs.writeFileSync('src/pages/Directory.tsx', file);

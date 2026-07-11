const fs = require('fs');
let file = fs.readFileSync('src/pages/SearchResults.tsx', 'utf8');

file = file.replace(/Résultats pour/g, "{t('search.results_for')}");
file = file.replace(/Secteur \/ Catégorie/g, "{t('search.sector_cat')}");
file = file.replace(/Wilaya \(Région\)/g, "{t('search.region')}");
file = file.replace(/Booster votre visibilité \?/g, "{t('search.boost_vis')}");
file = file.replace(/"Toutes les données"/g, "t('common.all')");

fs.writeFileSync('src/pages/SearchResults.tsx', file);

const fs = require('fs');

const frPath = 'src/locales/fr.json';
const enPath = 'src/locales/en.json';
const arPath = 'src/locales/ar.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

fr.products.sourcing = "Sourcing Industriel";
fr.products.equipment_catalog = "Catalogue Équipements";
fr.products.filters = "Filtres";
fr.products.category = "Catégorie";
fr.products.all_categories = "Toutes les catégories";
fr.products.wilaya = "Wilaya";
fr.products.sales_type = "Type de vente";
fr.products.sell_machines = "Vendez vos machines";
fr.products.add_product = "Ajouter un produit";
fr.products.quotes = "Devis";
fr.products.hero_desc = "Explorez les meilleures technologies industrielles disponibles en Algérie. Comparez, demandez des devis et connectez-vous aux fournisseurs.";
fr.products.no_results = "Aucun produit trouvé.";

en.products.sourcing = "Industrial Sourcing";
en.products.equipment_catalog = "Equipment Catalog";
en.products.filters = "Filters";
en.products.category = "Category";
en.products.all_categories = "All Categories";
en.products.wilaya = "Wilaya (Region)";
en.products.sales_type = "Sales Type";
en.products.sell_machines = "Sell your machines";
en.products.add_product = "Add Product";
en.products.quotes = "Quotes";
en.products.hero_desc = "Explore the best industrial technologies available in Algeria. Compare, request quotes and connect with suppliers.";
en.products.no_results = "No products found.";

ar.products.sourcing = "التوريد الصناعي";
ar.products.equipment_catalog = "كتالوج المعدات";
ar.products.filters = "عوامل التصفية";
ar.products.category = "الفئة";
ar.products.all_categories = "جميع الفئات";
ar.products.wilaya = "الولاية";
ar.products.sales_type = "نوع البيع";
ar.products.sell_machines = "بيع آلاتك";
ar.products.add_product = "أضف منتجًا";
ar.products.quotes = "عروض أسعار";
ar.products.hero_desc = "استكشف أفضل التقنيات الصناعية المتاحة في الجزائر. قارن، واطلب عروض أسعار وتواصل مع الموردين.";
ar.products.no_results = "لم يتم العثور على منتجات.";


fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log('Translations updated.');

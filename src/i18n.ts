import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "nav": {
        "home": "Accueil",
        "directory": "Annuaire",
        "products": "Produits",
        "catalogues": "Catalogues",
        "rfq": "Appels d'offres",
        "news": "Actualités",
        "emagazine": "E-Magazine",
        "tenders": "Appels d'offres",
        "events": "Événements",
        "virtual_show": "Salons virtuels",
        "resources": "Ressources",
        "login": "Connexion",
        "register": "S'inscrire",
        "browse_industries": "Parcourir les Industries",
        "become_exposant": "Devenir Exposant"
      },
      "hero": {
        "title": "Connectez-vous à l'industrie",
        "subtitle": "La première plateforme B2B dédiée aux fournisseurs et acheteurs industriels en Algérie.",
        "search_placeholder": "Rechercher une entreprise, un produit...",
        "search_btn": "Rechercher"
      },
      "topbar": {
        "become_exhibitor": "DEVENIR EXPOSANT",
        "my_account": "MON COMPTE"
      },
      "categories": {
        "title": "Parcourir par catégorie",
        "all": "Tous",
        "agrifood": "Agroalimentaire",
        "btph": "BTPH",
        "chemistry": "Chimie & Pétrochimie",
        "energy": "Énergie & Mines",
        "pharma": "Industrie Pharmaceutique",
        "metallurgy": "Métallurgie & Mécanique",
        "plastics": "Plasturgie & Caoutchouc",
        "textile": "Textile & Cuir",
        "electronics": "Électronique & Électroménager",
        "auto": "Automobile & Transport",
        "renewable": "Énergies Renouvelables"
      },
      "home": {
        "trends": "TENDANCES INDUSTRIELLES",
        "trends_subtitle": "DURABILITÉ ET INNOVATION DANS L'INDUSTRIE",
        "featured_products": "Produits à la Une",
        "featured_subtitle": "Une sélection des meilleurs équipements disponibles actuellement.",
        "sectors": "Secteurs d'activité",
        "sectors_subtitle": "Explorez nos univers industriels spécialisés.",
        "stats_title": "L'Industrie en Chiffres",
        "partners": "Nos Partenaires de Confiance",
        "view_all": "Voir tous",
        "read_more": "VOIR PLUS DE PRODUITS"
      },
      "directory": {
        "title": "Annuaire des Industriels",
        "subtitle": "Répertoire officiel des acteurs économiques et industriels en Algérie.",
        "db_label": "Base de Données Industrielle",
        "search_params": "Paramètres de Recherche",
        "sector": "Secteur Stratégique",
        "region": "Localisation Géo-économique",
        "zones": "Zones Industrielles Clés",
        "iso_only": "Normes ISO Uniquement",
        "list_view": "Liste",
        "map_view": "Carte",
        "tech_sheet": "FICHE TECHNIQUE",
        "id_reg": "ID Registre",
        "workforce": "Effectif",
        "founded": "Fondation",
        "map_title": "Carte de l'Infrastructure Industrielle",
        "map_subtitle": "Localisation temps réel des pôles par wilaya",
        "headquarters": "Siège Social"
      },
      "products": {
        "title": "Catalogue Produits",
        "subtitle": "Explorez les équipements et machines de pointe pour votre industrie.",
        "filters_tech": "Filtres Techniques",
        "brands": "Marques Leaders",
        "availability": "Disponibilité",
        "in_stock": "En stock (Prêt à livrer)",
        "on_order": "Sur commande",
        "origin": "Origine de Fabrication",
        "made_in_dz": "Algérie (Made in DZ)",
        "international": "International",
        "reset": "Réinitialiser",
        "unit_price": "Prix Unitaire",
        "quote": "Devis",
        "none_found": "Aucun produit trouvé",
        "none_found_text": "Essayez d'ajuster vos filtres ou votre recherche.",
        "on_quote": "Sur devis"
      },
      "rfq": {
        "title": "Demande de Devis (RFQ)",
        "subtitle": "OPTIMISEZ VOS ACHATS INDUSTRIELS EN SOUMETTANT VOTRE DEMANDE DE COTATION À NOTRE RÉSEAU DE FOURNISSEURS QUALIFIÉS.",
        "label": "Sourcing Industriel",
        "company_info": "Informations Entreprise",
        "company_name": "Nom de l'entreprise",
        "industry_sector": "Secteur d'activité",
        "select": "SÉLECTIONNER",
        "contact_info": "Coordonnées du Responsable",
        "full_name": "Nom complet",
        "pro_email": "Email professionnel",
        "equipment_details": "Détails de l'Équipement",
        "product_name": "Nom du produit / machine",
        "quantity": "Quantité estimée",
        "tech_desc": "Description technique détaillée",
        "tech_desc_placeholder": "SPÉCIFICATIONS TECHNIQUES, NORMES, CERTIFICATIONS REQUISES...",
        "submit": "SOUMETTRE LA DEMANDE DE COTATION",
        "success_title": "Demande Envoyée",
        "success_text": "VOTRE DEMANDE DE DEVIS (RFQ) A ÉTÉ ENREGISTRÉE DANS NOTRE SYSTÈME TECHNIQUE. UN CONSEILLER PRENDRA CONTACT AVEC VOUS SOUS 24H.",
        "ref_label": "RÉFÉRENCE DE LA DEMANDE",
        "new_request": "NOUVELLE DEMANDE",
        "process_title": "Processus de Cotation",
        "help": "Besoin d'aide ?",
        "garantees": "Garanties B2B"
      },
      "blog": {
        "title": "Actualités Industrielles",
        "subtitle": "Restez informé des dernières tendances, innovations et évolutions réglementaires du secteur industriel algérien.",
        "newsletter_title": "Ne manquez aucune actualité",
        "newsletter_subtitle": "Inscrivez-vous à notre newsletter hebdomadaire pour recevoir le meilleur de l'industrie algérienne directement dans votre boîte mail.",
        "subscribe": "S'abonner gratuitement",
        "privacy_note": "En vous inscrivant, vous acceptez notre politique de confidentialité. Vous pouvez vous désabonner à tout moment.",
        "featured": "À la une",
        "read_time": "min de lecture"
      },
      "catalogues": {
        "title": "Catalogues Industriels",
        "subtitle": "Accédez aux fiches techniques, brochures et catalogues complets des principaux constructeurs et distributeurs industriels en Algérie.",
        "tech_doc": "Documentation Technique",
        "pages": "Pages",
        "size": "Taille",
        "date": "Date",
        "view": "Visualiser",
        "download": "Télécharger",
        "none_found": "Aucun catalogue trouvé",
        "none_found_text": "Ajustez vos critères de recherche technique."
      },
      "footer": {
        "about": "À Propos",
        "about_text": "PORTAIL TECHNIQUE DE RÉFÉRENCE POUR L'ÉCOSYSTÈME INDUSTRIEL ALGÉRIEN. CONNECTER, INNOVER ET DÉVELOPPER.",
        "links": "Liens Utiles",
        "support": "Support & Accompagnement",
        "contact": "Contactez-nous",
        "copyright": "© 2026 ALGERIA INDUSTRY REGISTRY"
      },
      "common": {
        "compare": "Comparer",
        "request_quote": "Demander un devis",
        "contact_supplier": "Contacter le fournisseur",
        "see_details": "Voir détails"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "directory": "Directory",
        "products": "Products",
        "catalogues": "Catalogues",
        "rfq": "Tenders",
        "news": "News",
        "emagazine": "E-Magazine",
        "tenders": "Tenders",
        "events": "Events",
        "virtual_show": "Virtual Shows",
        "resources": "Resources",
        "login": "Login",
        "register": "Register",
        "browse_industries": "Browse Industries",
        "become_exposant": "Become Exhibitor"
      },
      "hero": {
        "title": "Connect to the industry",
        "subtitle": "The leading B2B platform dedicated to industrial suppliers and buyers in Algeria.",
        "search_placeholder": "Search for a company, a product...",
        "search_btn": "Search"
      },
      "topbar": {
        "become_exhibitor": "BECOME EXHIBITOR",
        "my_account": "MY ACCOUNT"
      },
      "categories": {
        "title": "Browse by Category",
        "all": "All",
        "agrifood": "Agrifood",
        "btph": "BTPH (Building, Public Works, Hydraulics)",
        "chemistry": "Chemistry & Petrochemicals",
        "energy": "Energy & Mining",
        "pharma": "Pharmaceutical Industry",
        "metallurgy": "Metallurgy & Mechanics",
        "plastics": "Plastics & Rubber",
        "textile": "Textile & Leather",
        "electronics": "Electronics & Home Appliances",
        "auto": "Automotive & Transport",
        "renewable": "Renewable Energies"
      },
      "home": {
        "trends": "INDUSTRIAL TRENDS",
        "trends_subtitle": "SUSTAINABILITY AND INNOVATION IN INDUSTRY",
        "featured_products": "Featured Products",
        "featured_subtitle": "A selection of the best equipment currently available.",
        "sectors": "Activity Sectors",
        "sectors_subtitle": "Explore our specialized industrial universes.",
        "stats_title": "Industry in Figures",
        "partners": "Our Trusted Partners",
        "view_all": "View all",
        "read_more": "VIEW MORE PRODUCTS"
      },
      "directory": {
        "title": "Industrial Directory",
        "subtitle": "Official directory of economic and industrial actors in Algeria.",
        "db_label": "Industrial Database",
        "search_params": "Search Parameters",
        "sector": "Strategic Sector",
        "region": "Geo-economic Localization",
        "zones": "Key Industrial Zones",
        "iso_only": "ISO Standards Only",
        "list_view": "List",
        "map_view": "Map",
        "tech_sheet": "TECHNICAL SHEET",
        "id_reg": "Registry ID",
        "workforce": "Workforce",
        "founded": "Founded",
        "map_title": "Industrial Infrastructure Map",
        "map_subtitle": "Real-time localization of poles by wilaya",
        "headquarters": "Headquarters"
      },
      "products": {
        "title": "Products Catalogue",
        "subtitle": "Explore state-of-the-art equipment and machinery for your industry.",
        "filters_tech": "Technical Filters",
        "brands": "Leading Brands",
        "availability": "Availability",
        "in_stock": "In stock (Ready to deliver)",
        "on_order": "On order",
        "origin": "Manufacturing Origin",
        "made_in_dz": "Algeria (Made in DZ)",
        "international": "International",
        "reset": "Reset",
        "unit_price": "Unit Price",
        "quote": "Quote",
        "none_found": "No products found",
        "none_found_text": "Try adjusting your filters or search.",
        "on_quote": "On quote"
      },
      "rfq": {
        "title": "Request for Quote (RFQ)",
        "subtitle": "OPTIMIZE YOUR INDUSTRIAL PURCHASES BY SUBMITTING YOUR REQUEST FOR QUOTATION TO OUR NETWORK OF QUALIFIED SUPPLIERS.",
        "label": "Industrial Sourcing",
        "company_info": "Company Information",
        "company_name": "Company Name",
        "industry_sector": "Industry Sector",
        "select": "SELECT",
        "contact_info": "Contact Information",
        "full_name": "Full Name",
        "pro_email": "Professional Email",
        "equipment_details": "Equipment Details",
        "product_name": "Product / Machine Name",
        "quantity": "Estimated Quantity",
        "tech_desc": "Detailed Technical Description",
        "tech_desc_placeholder": "TECHNICAL SPECIFICATIONS, STANDARDS, REQUIRED CERTIFICATIONS...",
        "submit": "SUBMIT REQUEST FOR QUOTATION",
        "success_title": "Request Sent",
        "success_text": "YOUR REQUEST FOR QUOTATION (RFQ) HAS BEEN REGISTERED IN OUR TECHNICAL SYSTEM. A COUNSELOR WILL CONTACT YOU WITHIN 24H.",
        "ref_label": "REQUEST REFERENCE",
        "new_request": "NEW REQUEST",
        "process_title": "Quotation Process",
        "help": "Need Help?",
        "garantees": "B2B Guarantees"
      },
      "blog": {
        "title": "Industrial News",
        "subtitle": "Stay informed about the latest trends, innovations and regulatory developments in the Algerian industrial sector.",
        "newsletter_title": "Don't miss any news",
        "newsletter_subtitle": "Subscribe to our weekly newsletter to receive the best of Algerian industry directly in your mailbox.",
        "subscribe": "Subscribe for free",
        "privacy_note": "By registering, you accept our privacy policy. You can unsubscribe at any time.",
        "featured": "Featured",
        "read_time": "min read"
      },
      "catalogues": {
        "title": "Industrial Catalogues",
        "subtitle": "Access complete data sheets, brochures and catalogues from key industrial manufacturers and distributors in Algeria.",
        "tech_doc": "Technical Documentation",
        "pages": "Pages",
        "size": "Size",
        "date": "Date",
        "view": "View",
        "download": "Download",
        "none_found": "No catalogues found",
        "none_found_text": "Adjust your technical search criteria."
      },
      "footer": {
        "about": "About Us",
        "about_text": "TECHNICAL REFERENCE PORTAL FOR THE ALGERIAN INDUSTRIAL ECOSYSTEM. CONNECT, INNOVATE AND DEVELOP.",
        "links": "Quick Links",
        "support": "Support & Accompaniment",
        "contact": "Contact us",
        "copyright": "© 2026 ALGERIA INDUSTRY REGISTRY"
      },
      "common": {
        "compare": "Compare",
        "request_quote": "Request Quote",
        "contact_supplier": "Contact Supplier",
        "see_details": "See details"
      }
    }
  },
  ar: {
    translation: {
      "nav": {
        "home": "الرئيسية",
        "directory": "الدليل",
        "products": "المنتجات",
        "catalogues": "الكتالوجات",
        "rfq": "المناقصات",
        "news": "الأخبار",
        "emagazine": "المجلة الإلكترونية",
        "tenders": "المناقصات",
        "events": "الفعاليات",
        "virtual_show": "المعرض الافتراضية",
        "resources": "الموارد",
        "login": "تسجيل الدخول",
        "register": "تسجيل",
        "browse_industries": "تصفح الصناعات",
        "become_exposant": "كن عارضاً"
      },
      "hero": {
        "title": "تواصل مع الصناعة",
        "subtitle": "المنصة الرائدة للأعمال المخصصة للموردين والمشترين الصناعيين في الجزائر.",
        "search_placeholder": "ابحث عن شركة، منتج...",
        "search_btn": "بحث"
      },
      "topbar": {
        "become_exhibitor": "كن عارضًا",
        "my_account": "حسابي"
      },
      "categories": {
        "title": "تصفح حسب الفئة",
        "all": "الكل",
        "agrifood": "الصناعات الغذائية",
        "btph": "البناء والأشغال العمومية والري",
        "chemistry": "الكيمياء والبتروكيماويات",
        "energy": "الطاقة والمناجم",
        "pharma": "الصناعة الصيدلانية",
        "metallurgy": "التعدين والميكانيكا",
        "plastics": "البلاستيك والمطاط",
        "textile": "النسيج والجلود",
        "electronics": "الإلكترونيات والأجهزة المنزلية",
        "auto": "السيارات والنقل",
        "renewable": "الطاقات المتجددة"
      },
      "home": {
        "trends": "الاتجاهات الصناعية",
        "trends_subtitle": "الاستدامة والابتكار في الصناعة",
        "featured_products": "منتجات مختارة",
        "featured_subtitle": "مجموعة مختارة من أفضل المعدات المتاحة حاليًا.",
        "sectors": "قطاعات النشاط",
        "sectors_subtitle": "استكشف عوالمنا الصناعية المتخصصة.",
        "stats_title": "الصناعة في أرقام",
        "partners": "شركاؤنا الموثوق بهم",
        "view_all": "عرض الكل",
        "read_more": "عرض المزيد من المنتجات"
      },
      "directory": {
        "title": "دليل الصناعيين",
        "subtitle": "الدليل الرسمي للجهات الفاعلة الاقتصادية والصناعية في الجزائر.",
        "db_label": "قاعدة البيانات الصناعية",
        "search_params": "معايير البحث",
        "sector": "القطاع الاستراتيجي",
        "region": "الموقع الجيواقتصادي",
        "zones": "المناطق الصناعية الكبرى",
        "iso_only": "معايير ISO فقط",
        "list_view": "قائمة",
        "map_view": "خريطة",
        "tech_sheet": "البطاقة التقنية",
        "id_reg": "رقم السجل",
        "workforce": "عدد الموظفين",
        "founded": "التأسيس",
        "map_title": "خريطة البنية التحتية الصناعية",
        "map_subtitle": "تحديد مواقع الأقطاب في الوقت الفعلي حسب الولاية",
        "headquarters": "المقر الرئيسي"
      },
      "products": {
        "title": "كتالوج المنتجات",
        "subtitle": "اكتشف المعدات والآلات المتطورة لصناعتك.",
        "filters_tech": "الفلاتر التقنية",
        "brands": "العلامات التجارية الرائدة",
        "availability": "التوفر",
        "in_stock": "متوفر (جاهز للتسليم)",
        "on_order": "عند الطلب",
        "origin": "بلد المنشأ",
        "made_in_dz": "الجزائر (صنع في الجزائر)",
        "international": "دولي",
        "reset": "إعادة تعيين",
        "unit_price": "سعر الوحدة",
        "quote": "عرض سعر",
        "none_found": "لم يتم العثور على أي منتج",
        "none_found_text": "حاول ضبط الفلاتر أو البحث.",
        "on_quote": "عند الطلب"
      },
      "rfq": {
        "title": "طلب عرض سعر (RFQ)",
        "subtitle": "قم بتحسين مشترياتك الصناعية من خلال إرسال طلب عرض السعر الخاص بك إلى شبكتنا من الموردين المؤهلين.",
        "label": "التوريد الصناعي",
        "company_info": "معلومات الشركة",
        "company_name": "اسم الشركة",
        "industry_sector": "قطاع النشاط",
        "select": "اختيار",
        "contact_info": "معلومات الاتصال",
        "full_name": "الاسم الكامل",
        "pro_email": "البريد الإلكتروني المهني",
        "equipment_details": "تفاصيل المعدات",
        "product_name": "اسم المنتج / الآلة",
        "quantity": "الكمية المقدرة",
        "tech_desc": "وصف تقني مفصل",
        "tech_desc_placeholder": "المواصفات التقنية، المعايير، الشهادات المطلوبة...",
        "submit": "إرسال طلب عرض السعر",
        "success_title": "تم إرسال الطلب",
        "success_text": "تم تسجيل طلب عرض السعر (RFQ) الخاص بك في نظامنا التقني. سيتصل بك مستشار في غضون 24 ساعة.",
        "ref_label": "مرجع الطلب",
        "new_request": "طلب جديد",
        "process_title": "عملية التسعير",
        "help": "هل تحتاج لمساعدة؟",
        "garantees": "ضمانات B2B"
      },
      "blog": {
        "title": "الأخبار الصناعية",
        "subtitle": "ابق على اطلاع بآخر التوجهات والابتكارات والتطورات التنظيمية في القطاع الصناعي الجزائري.",
        "newsletter_title": "لا تفوت أي أخبار",
        "newsletter_subtitle": "اشترك في نشرتنا الإخبارية الأسبوعية لتصلك أفضل أخبار الصناعة الجزائرية مباشرة إلى صندوق بريدك.",
        "subscribe": "اشتراك مجاني",
        "privacy_note": "بالتسجيل، فإنك توافق على سياسة الخصوصية الخاصة بنا. يمكنك إلغاء الاشتراك في أي وقت.",
        "featured": "مميز",
        "read_time": "دقائق للقراءة"
      },
      "catalogues": {
        "title": "الكتالوجات الصناعية",
        "subtitle": "الوصول إلى البيانات التقنية والكتيبات والكتالوجات الكاملة من الشركات المصنعة والموزعين الصناعيين الرئيسيين في الجزائر.",
        "tech_doc": "التوثيق التقني",
        "pages": "صفحات",
        "size": "الحجم",
        "date": "التاريخ",
        "view": "عرض",
        "download": "تحميل",
        "none_found": "لم يتم العثور على كتالوجات",
        "none_found_text": "اضبط معايير البحث التقني الخاصة بك."
      },
      "footer": {
        "about": "حول المنصة",
        "about_text": "البوابة التقنية المرجعية للمنظومة الصناعية الجزائرية. تواصل، ابتكار وتطوير.",
        "links": "روابط سريعة",
        "support": "الدعم والمرافقة",
        "contact": "اتصل بنا",
        "copyright": "© ٢٠٢٦ سجل الصناعة الجزائري"
      },
      "common": {
        "compare": "مقارنة",
        "request_quote": "طلب اقتراح سعر",
        "contact_supplier": "الاتصال بالمورد",
        "see_details": "عرض التفاصيل"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

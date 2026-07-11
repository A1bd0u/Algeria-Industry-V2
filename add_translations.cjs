const fs = require('fs');

const frPath = 'src/locales/fr.json';
const enPath = 'src/locales/en.json';
const arPath = 'src/locales/ar.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  faq: {
    title: "Questions Fréquentes",
    subtitle: "Support Industriel",
    need_help: "Besoin d'aide personnalisée ?",
    help_desc: "Nos experts industriels sont à votre disposition.",
    call_expert: "Appel Expert",
    send_ticket: "Envoyer Ticket",
    search_placeholder: "Rechercher une question...",
    q1: "Comment fonctionne le salon virtuel ?",
    a1: "Notre salon virtuel utilise une interface immersive 2.5D qui vous permet de naviguer entre différents halls thématiques. Vous pouvez cliquer sur un stand pour voir les machines en détail, télécharger des catalogues et discuter en direct avec les exposants.",
    q2: "Le site est-il gratuit pour les visiteurs ?",
    a2: "Oui, l'accès au catalogue et la visite du salon virtuel sont totalement gratuits pour tous les professionnels. Une inscription est toutefois nécessaire pour contacter les exposants ou sauvegarder des favoris.",
    q3: "Comment ajouter mes produits au catalogue ?",
    a3: "Une fois votre abonnement Premium ou Business activé, rendez-vous dans votre Dashboard section 'Mes Produits'. Vous pourrez y importer vos fiches techniques et photos.",
    q4: "Quelles sont les options de paiement ?",
    a4: "Nous acceptons les virements bancaires (RIB), le paiement par CIB/Edahabia, et les chèques de banque pour les entreprises locales.",
    cat_general: "Général",
    cat_exhibitor: "Exposants"
  },
  kyc: {
    status_pending: "En attente",
    status_approved: "Approuvé",
    status_rejected: "Rejeté",
    upload_title: "Vérification de l'Entreprise (KYC)",
    upload_desc: "Conformément à nos CGU, nous devons vérifier la légitimité de votre entreprise pour délivrer le badge \"Fournisseur Vérifié\".",
    sector: "Secteur d'Activité Principal",
    legal_docs: "Documents Légaux (PDF/Image)",
    upload_btn: "Uploader",
    sending: "Envoi en cours...",
    submit_dossier: "Soumettre le Dossier",
    success_title: "Demande Envoyée",
    success_desc: "Votre dossier est maintenant en cours de vérification par nos agents. Vous recevrez une notification d'ici 24h à 48h.",
    admin_title: "Revue KYC : ",
    reject: "Rejeter",
    approve: "Valider",
    company_name: "Raison sociale",
    description: "Description",
    name: "Nom",
    email: "Email",
    no_docs: "Aucun document attaché.",
    select_doc: "Sélectionnez un document",
    reject_reason: "Motif du rejet *"
  },
  ads: {
    title: "Espace Publicitaire",
    success: "Demande Envoyée !",
    company_name: "Nom de l'entreprise *",
    contact: "Contact *",
    email: "Email Pro *",
    phone: "Téléphone *",
    placement: "Emplacement Souhaité *",
    details: "Détails de la campagne (Optionnel)",
    upload_design: "Uploader votre design (Image)",
    click_drop: "Cliquez ou glissez votre image ici",
    formats: "Formats acceptés: JPG, PNG, WEBP (Max 5MB)",
    error_send: "Une erreur est survenue lors de l'envoi. Veuillez réessayer plus tard.",
    send_request: "Envoyer la Demande",
    why_advertise: "Pourquoi annoncer sur Algeria Industry ?"
  },
  products: {
    similar: "Produits Similaires",
    report: "Signaler un contenu inapproprié",
    report_desc: "Aidez-nous à garder Algiers Industry sûr. Pourquoi signalez-vous ce produit ?",
    cancel: "Annuler",
    send_report: "Envoyer le signalement",
    join_suppliers: "Rejoignez 500+ fournisseurs en Algérie",
    prev: "Précédent",
    next: "Suivant"
  },
  search: {
    results_for: "Résultats pour",
    sector_cat: "Secteur / Catégorie",
    region: "Wilaya (Région)",
    boost_vis: "Booster votre visibilité ?"
  }
};

const newKeysEn = {
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Industrial Support",
    need_help: "Need personalized help?",
    help_desc: "Our industrial experts are at your disposal.",
    call_expert: "Call an Expert",
    send_ticket: "Send Ticket",
    search_placeholder: "Search for a question...",
    q1: "How does the virtual exhibition work?",
    a1: "Our virtual exhibition uses an immersive 2.5D interface allowing you to navigate between different thematic halls. You can click on a stand to see machines in detail, download catalogs and chat live with exhibitors.",
    q2: "Is the site free for visitors?",
    a2: "Yes, access to the catalog and the virtual exhibition is completely free for all professionals. Registration is required to contact exhibitors or save favorites.",
    q3: "How to add my products to the catalog?",
    a3: "Once your Premium or Business subscription is activated, go to your Dashboard 'My Products' section. You can import your technical sheets and photos there.",
    q4: "What are the payment options?",
    a4: "We accept bank transfers, CIB/Edahabia payments, and bank checks for local companies.",
    cat_general: "General",
    cat_exhibitor: "Exhibitors"
  },
  kyc: {
    status_pending: "Pending",
    status_approved: "Approved",
    status_rejected: "Rejected",
    upload_title: "Company Verification (KYC)",
    upload_desc: "In accordance with our T&Cs, we must verify the legitimacy of your company to issue the \"Verified Supplier\" badge.",
    sector: "Main Business Sector",
    legal_docs: "Legal Documents (PDF/Image)",
    upload_btn: "Upload",
    sending: "Sending...",
    submit_dossier: "Submit File",
    success_title: "Request Sent",
    success_desc: "Your file is now being verified by our agents. You will receive a notification within 24h to 48h.",
    admin_title: "KYC Review: ",
    reject: "Reject",
    approve: "Approve",
    company_name: "Company Name",
    description: "Description",
    name: "Name",
    email: "Email",
    no_docs: "No documents attached.",
    select_doc: "Select a document",
    reject_reason: "Reason for rejection *"
  },
  ads: {
    title: "Advertising Space",
    success: "Request Sent!",
    company_name: "Company Name *",
    contact: "Contact *",
    email: "Professional Email *",
    phone: "Phone *",
    placement: "Desired Placement *",
    details: "Campaign Details (Optional)",
    upload_design: "Upload your design (Image)",
    click_drop: "Click or drag your image here",
    formats: "Accepted formats: JPG, PNG, WEBP (Max 5MB)",
    error_send: "An error occurred while sending. Please try again later.",
    send_request: "Send Request",
    why_advertise: "Why advertise on Algeria Industry?"
  },
  products: {
    similar: "Similar Products",
    report: "Report inappropriate content",
    report_desc: "Help us keep Algiers Industry safe. Why are you reporting this product?",
    cancel: "Cancel",
    send_report: "Send Report",
    join_suppliers: "Join 500+ suppliers in Algeria",
    prev: "Previous",
    next: "Next"
  },
  search: {
    results_for: "Results for",
    sector_cat: "Sector / Category",
    region: "Region (Wilaya)",
    boost_vis: "Boost your visibility?"
  }
};

const newKeysAr = {
  faq: {
    title: "أسئلة مكررة",
    subtitle: "الدعم الصناعي",
    need_help: "بحاجة إلى مساعدة شخصية؟",
    help_desc: "خبراؤنا الصناعيون تحت تصرفكم.",
    call_expert: "اتصل بخبير",
    send_ticket: "إرسال تذكرة",
    search_placeholder: "ابحث عن سؤال...",
    q1: "كيف يعمل المعرض الافتراضي؟",
    a1: "يستخدم معرضنا الافتراضي واجهة 2.5D غامرة تتيح لك التنقل بين قاعات العرض المختلفة. يمكنك النقر على جناح لرؤية الآلات بالتفصيل وتنزيل الكتالوجات والدردشة مباشرة مع العارضين.",
    q2: "هل الموقع مجاني للزوار؟",
    a2: "نعم، الوصول إلى الكتالوج وزيارة المعرض الافتراضي مجاني تمامًا لجميع المحترفين. التسجيل مطلوب للتواصل مع العارضين أو حفظ المفضلة.",
    q3: "كيف أضيف منتجاتي إلى الكتالوج؟",
    a3: "بمجرد تفعيل اشتراكك المميز أو التجاري، انتقل إلى قسم 'منتجاتي' في لوحة التحكم. يمكنك استيراد أوراقك التقنية والصور هناك.",
    q4: "ما هي خيارات الدفع؟",
    a4: "نقبل التحويلات البنكية، الدفع عبر CIB/الذهبية، والشيكات البنكية للشركات المحلية.",
    cat_general: "عام",
    cat_exhibitor: "العارضون"
  },
  kyc: {
    status_pending: "قيد الانتظار",
    status_approved: "مقبول",
    status_rejected: "مرفوض",
    upload_title: "التحقق من الشركة (KYC)",
    upload_desc: "وفقًا لشروطنا وأحكامنا، يجب علينا التحقق من شرعية شركتك لإصدار شارة \"مورد معتمد\".",
    sector: "قطاع النشاط الرئيسي",
    legal_docs: "المستندات القانونية (PDF/صورة)",
    upload_btn: "رفع",
    sending: "جاري الإرسال...",
    submit_dossier: "تقديم الملف",
    success_title: "تم إرسال الطلب",
    success_desc: "ملفك الآن قيد التحقق من قبل وكلائنا. ستتلقى إشعارًا في غضون 24 إلى 48 ساعة.",
    admin_title: "مراجعة KYC: ",
    reject: "رفض",
    approve: "موافقة",
    company_name: "اسم الشركة",
    description: "الوصف",
    name: "الاسم",
    email: "البريد الإلكتروني",
    no_docs: "لا توجد مستندات مرفقة.",
    select_doc: "اختر مستندًا",
    reject_reason: "سبب الرفض *"
  },
  ads: {
    title: "مساحة إعلانية",
    success: "تم إرسال الطلب!",
    company_name: "اسم الشركة *",
    contact: "جهة الاتصال *",
    email: "البريد المهني *",
    phone: "الهاتف *",
    placement: "الموضع المطلوب *",
    details: "تفاصيل الحملة (اختياري)",
    upload_design: "ارفع تصميمك (صورة)",
    click_drop: "انقر أو اسحب صورتك هنا",
    formats: "الصيغ المقبولة: JPG, PNG, WEBP (كحد أقصى 5 ميجابايت)",
    error_send: "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى لاحقًا.",
    send_request: "إرسال الطلب",
    why_advertise: "لماذا تعلن على الصناعة الجزائرية؟"
  },
  products: {
    similar: "منتجات مشابهة",
    report: "الإبلاغ عن محتوى غير لائق",
    report_desc: "ساعدنا في الحفاظ على أمان الصناعة الجزائرية. لماذا تبلغ عن هذا المنتج؟",
    cancel: "إلغاء",
    send_report: "إرسال بلاغ",
    join_suppliers: "انضم إلى أكثر من 500 مورد في الجزائر",
    prev: "السابق",
    next: "التالي"
  },
  search: {
    results_for: "نتائج بحث لـ",
    sector_cat: "القطاع / الفئة",
    region: "الولاية (المنطقة)",
    boost_vis: "عزز رؤيتك؟"
  }
};

Object.assign(fr, newKeys);
Object.assign(en, newKeysEn);
Object.assign(ar, newKeysAr);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log('Translations updated.');

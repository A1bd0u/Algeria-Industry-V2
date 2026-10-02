import { LEGAL, SITE_NAME } from '../config/site';

// Conditions générales de vente des abonnements fournisseurs (version
// TERMS_VERSION côté serveur : 2026-10). Les identifiants de l'éditeur
// proviennent de VITE_LEGAL_* ; un champ non renseigné reste « à compléter ».
const v = (value: string, pending: string) => value || pending;

type Section = { title: string; paragraphs: string[] };
type Cgv = { title: string; version: string; intro: string; seller: string[]; sections: Section[] };

const sellerLines = (pending: string, labels: [string, string, string, string, string]) => [
  `${labels[0]} : ${v(LEGAL.companyName, pending)}${LEGAL.companyForm ? ` (${LEGAL.companyForm})` : ''}`,
  `${labels[1]} : ${v(LEGAL.address, pending)}`,
  `${labels[2]} : ${v(LEGAL.rc, pending)}`,
  `${labels[3]} : ${v(LEGAL.nif, pending)}`,
  `${labels[4]} : ${v(LEGAL.email, pending)}${LEGAL.phone ? ` · ${LEGAL.phone}` : ''}`,
];

export const cgvContent: Record<'fr' | 'en' | 'ar', Cgv> = {
  fr: {
    title: 'Conditions générales de vente',
    version: 'Version du 2 octobre 2026',
    intro: `Les présentes conditions générales de vente (CGV) s'appliquent aux abonnements payants proposés aux entreprises sur ${SITE_NAME}. Elles complètent les conditions générales d'utilisation. Toute souscription vaut acceptation des CGV en vigueur à sa date, que le client confirme en cochant la case prévue à cet effet.`,
    seller: sellerLines('[à compléter]', ['Vendeur', 'Siège', 'Registre du commerce', 'NIF', 'Contact']),
    sections: [
      {
        title: '1. Clients',
        paragraphs: [
          "Les abonnements sont réservés aux professionnels titulaires d'une fiche entreprise sur la plateforme, dont le dossier de vérification (registre du commerce et NIF) a été déposé. Le client agit pour les besoins de son activité professionnelle.",
        ],
      },
      {
        title: '2. Offres et prix',
        paragraphs: [
          "Trois offres sont proposées : Gratuit (0 DA), Basic (18 000 DA par an) et Pro (29 900 DA par an). Les prix sont exprimés en dinars algériens, toutes taxes comprises (TVA 19 % incluse).",
          "Le contenu de chaque offre (nombre de produits, de photos par produit, de catalogues PDF, niveau de statistiques et délai du support) est celui décrit sur la page Tarifs à la date de la souscription.",
          "L'offre « membre fondateur » est attribuée gratuitement, pour 12 mois, aux entreprises qui remplissent les conditions annoncées sur la page Tarifs. Elle ne donne lieu à aucun paiement.",
        ],
      },
      {
        title: '3. Souscription et facture',
        paragraphs: [
          "Le client souscrit depuis l'onglet « Abonnement » de son tableau de bord. Une facture est alors émise au prix officiel de l'offre et adressée par e-mail. Une seule facture en attente peut exister par offre.",
          "Tant qu'elle n'est pas réglée, la facture peut être annulée par le client sans frais.",
        ],
      },
      {
        title: '4. Paiement',
        paragraphs: [
          "Le règlement se fait par virement bancaire (RIB et référence de facture indiqués dans l'espace client), par chèque ou, lorsqu'il est proposé, en ligne par carte CIB ou Edahabia. Le paiement en ligne est traité par un prestataire de paiement agréé ; aucune donnée de carte n'est conservée par la plateforme.",
          "En cas de virement, le client peut déposer son justificatif depuis son espace pour accélérer l'activation.",
        ],
      },
      {
        title: '5. Activation et durée',
        paragraphs: [
          "L'abonnement est activé dès réception du paiement, pour une durée de 12 mois. Une souscription effectuée pendant un abonnement en cours prend effet à la fin de celui-ci.",
          "L'abonnement n'est pas reconduit tacitement. Le client est prévenu par e-mail 30 jours puis 7 jours avant l'échéance. À l'échéance, les limites de l'offre gratuite s'appliquent de nouveau ; les contenus du client sont conservés.",
        ],
      },
      {
        title: '6. Remboursement',
        paragraphs: [
          "Le service est fourni dès l'activation. Il n'est donc pas remboursable, sauf inexécution imputable au vendeur : dans ce cas, le client est remboursé au prorata de la période non servie.",
        ],
      },
      {
        title: '7. Obligations du client',
        paragraphs: [
          "Le client garantit l'exactitude des informations de sa fiche, la conformité des produits présentés à la réglementation algérienne et la licéité des contenus publiés (textes, photos, catalogues). Il est seul responsable des offres qu'il présente et des transactions conclues avec les acheteurs.",
        ],
      },
      {
        title: '8. Suspension',
        paragraphs: [
          "En cas de manquement aux CGU ou aux présentes CGV, le vendeur peut, après mise en demeure restée sans effet pendant 8 jours, suspendre l'abonnement. En cas de fraude ou de contenu manifestement illicite, la suspension peut être immédiate. Une suspension pour manquement du client ne donne lieu à aucun remboursement.",
        ],
      },
      {
        title: '9. Responsabilité',
        paragraphs: [
          `${SITE_NAME} est une plateforme de mise en relation : le vendeur n'est pas partie aux contrats conclus entre fournisseurs et acheteurs. Il est tenu d'une obligation de moyens quant à la disponibilité du service, qui peut être interrompu pour maintenance.`,
          "Sauf faute lourde, la responsabilité du vendeur est limitée au montant payé par le client au titre de l'abonnement en cours.",
        ],
      },
      {
        title: '10. Données personnelles',
        paragraphs: [
          "Les données nécessaires à la facturation sont traitées conformément à la loi n° 18-07 et à la politique de confidentialité de la plateforme.",
        ],
      },
      {
        title: '11. Droit applicable et litiges',
        paragraphs: [
          "Les présentes CGV sont soumises au droit algérien, notamment à la loi n° 18-05 relative au commerce électronique. En cas de différend, les parties recherchent d'abord une solution amiable pendant 30 jours. À défaut, le litige est porté devant le tribunal compétent du siège du vendeur.",
        ],
      },
      {
        title: '12. Modification',
        paragraphs: [
          "Le vendeur peut modifier les CGV. La version acceptée lors de la souscription reste applicable jusqu'à l'échéance de l'abonnement correspondant.",
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Sale',
    version: 'Version of 2 October 2026',
    intro: `These terms of sale apply to the paid subscriptions offered to companies on ${SITE_NAME}. They supplement the terms of use. Every subscription constitutes acceptance of the terms in force on its date, which the customer confirms by ticking the dedicated box.`,
    seller: sellerLines('[to be completed]', ['Seller', 'Registered office', 'Commercial register', 'Tax ID (NIF)', 'Contact']),
    sections: [
      {
        title: '1. Customers',
        paragraphs: [
          'Subscriptions are reserved for businesses that hold a company profile on the platform and have submitted their verification file (commercial register and tax ID). The customer acts for the purposes of its business.',
        ],
      },
      {
        title: '2. Plans and prices',
        paragraphs: [
          'Three plans are offered: Free (DZD 0), Basic (DZD 18,000 per year) and Pro (DZD 29,900 per year). Prices are in Algerian dinars, all taxes included (19% VAT).',
          'The content of each plan (number of products, photos per product, PDF catalogues, statistics level and support response time) is the one described on the Pricing page on the date of subscription.',
          'The "founding member" offer is granted free of charge for 12 months to companies meeting the conditions stated on the Pricing page. It involves no payment.',
        ],
      },
      {
        title: '3. Subscription and invoice',
        paragraphs: [
          'The customer subscribes from the "Subscription" tab of its dashboard. An invoice is then issued at the official price of the plan and sent by e-mail. Only one pending invoice may exist per plan.',
          'Until it is paid, the invoice can be cancelled by the customer at no cost.',
        ],
      },
      {
        title: '4. Payment',
        paragraphs: [
          'Payment is made by bank transfer (bank details and invoice reference shown in the customer area), by cheque or, when available, online by CIB or Edahabia card. Online payment is processed by an approved payment provider; no card data is stored by the platform.',
          'For transfers, the customer can upload proof of payment from its account to speed up activation.',
        ],
      },
      {
        title: '5. Activation and term',
        paragraphs: [
          'The subscription is activated upon receipt of payment, for 12 months. A subscription taken out during a current subscription starts when that one ends.',
          'The subscription does not renew automatically. The customer is notified by e-mail 30 days and 7 days before expiry. On expiry, the limits of the Free plan apply again; the customer\'s content is kept.',
        ],
      },
      {
        title: '6. Refunds',
        paragraphs: [
          'The service is provided from activation and is therefore not refundable, except in the event of non-performance attributable to the seller, in which case the customer is refunded pro rata for the period not served.',
        ],
      },
      {
        title: '7. Customer obligations',
        paragraphs: [
          'The customer guarantees the accuracy of its profile, the compliance of the products presented with Algerian regulations and the lawfulness of the content published (texts, photos, catalogues). It is solely responsible for its offers and for the transactions concluded with buyers.',
        ],
      },
      {
        title: '8. Suspension',
        paragraphs: [
          'In the event of a breach of the terms of use or of these terms, the seller may suspend the subscription after a formal notice that remains unanswered for 8 days. In the event of fraud or manifestly unlawful content, suspension may be immediate. A suspension due to the customer\'s breach gives no right to a refund.',
        ],
      },
      {
        title: '9. Liability',
        paragraphs: [
          `${SITE_NAME} is a matchmaking platform: the seller is not a party to the contracts concluded between suppliers and buyers. It has a best-efforts obligation regarding the availability of the service, which may be interrupted for maintenance.`,
          'Except in the event of gross negligence, the seller\'s liability is limited to the amount paid by the customer for the current subscription.',
        ],
      },
      {
        title: '10. Personal data',
        paragraphs: [
          'Data required for invoicing is processed in accordance with Law No. 18-07 and the platform\'s privacy policy.',
        ],
      },
      {
        title: '11. Governing law and disputes',
        paragraphs: [
          'These terms are governed by Algerian law, in particular Law No. 18-05 on electronic commerce. In the event of a dispute, the parties first seek an amicable solution for 30 days. Failing that, the dispute is brought before the competent court of the seller\'s registered office.',
        ],
      },
      {
        title: '12. Changes',
        paragraphs: [
          'The seller may amend these terms. The version accepted at subscription remains applicable until the end of the corresponding subscription.',
        ],
      },
    ],
  },
  ar: {
    title: 'الشروط العامة للبيع',
    version: 'نسخة 2 أكتوبر 2026',
    intro: `تسري هذه الشروط العامة للبيع على الاشتراكات المدفوعة المقترحة على المؤسسات في منصة ${SITE_NAME}، وهي مكمّلة للشروط العامة للاستخدام. ويُعدّ كل اشتراك قبولًا للشروط السارية في تاريخه، ويؤكّد الزبون ذلك بتحديد الخانة المخصّصة لهذا الغرض.`,
    seller: sellerLines('[يُستكمل لاحقًا]', ['البائع', 'المقر', 'السجل التجاري', 'رقم التعريف الجبائي', 'الاتصال']),
    sections: [
      {
        title: '1. الزبائن',
        paragraphs: [
          'الاشتراكات مخصّصة للمهنيين الذين يملكون صفحة مؤسسة على المنصة وأودعوا ملف التحقق (السجل التجاري ورقم التعريف الجبائي). ويتصرّف الزبون لأغراض نشاطه المهني.',
        ],
      },
      {
        title: '2. العروض والأسعار',
        paragraphs: [
          'تُقترح ثلاثة عروض: مجاني (0 دج)، أساسي (18 000 دج سنويًا) واحترافي (29 900 دج سنويًا). الأسعار بالدينار الجزائري وتشمل جميع الرسوم (الرسم على القيمة المضافة 19 %).',
          'محتوى كل عرض (عدد المنتجات وعدد الصور لكل منتج وعدد كتالوجات PDF ومستوى الإحصائيات ومدة الرد من الدعم) هو المحتوى الموصوف في صفحة الأسعار في تاريخ الاشتراك.',
          'يُمنح عرض «العضو المؤسس» مجانًا لمدة 12 شهرًا للمؤسسات التي تستوفي الشروط المعلنة في صفحة الأسعار، ولا يترتب عليه أي دفع.',
        ],
      },
      {
        title: '3. الاشتراك والفاتورة',
        paragraphs: [
          'يشترك الزبون من تبويب «الاشتراك» في لوحة التحكم، فتصدر فاتورة بالسعر الرسمي للعرض وتُرسل بالبريد الإلكتروني. ولا يمكن أن توجد إلا فاتورة واحدة قيد الانتظار لكل عرض.',
          'يمكن للزبون إلغاء الفاتورة دون أي مصاريف ما دامت غير مسدّدة.',
        ],
      },
      {
        title: '4. الدفع',
        paragraphs: [
          'يتم الدفع بتحويل بنكي (الهوية البنكية ومرجع الفاتورة معروضان في فضاء الزبون) أو بصك أو، عند توفّره، عبر الإنترنت ببطاقة CIB أو الذهبية. تتم معالجة الدفع الإلكتروني من طرف مزوّد دفع معتمد، ولا تحتفظ المنصة بأي بيانات للبطاقة.',
          'في حالة التحويل، يمكن للزبون إيداع إثبات الدفع من فضائه لتسريع التفعيل.',
        ],
      },
      {
        title: '5. التفعيل والمدة',
        paragraphs: [
          'يُفعَّل الاشتراك فور استلام الدفع لمدة 12 شهرًا. ويبدأ الاشتراك المُبرم خلال اشتراك جارٍ عند انتهاء هذا الأخير.',
          'لا يتجدّد الاشتراك تلقائيًا. ويُنبَّه الزبون بالبريد الإلكتروني قبل 30 يومًا ثم 7 أيام من تاريخ الانتهاء. وعند الانتهاء تُطبَّق حدود العرض المجاني من جديد مع الاحتفاظ بمحتويات الزبون.',
        ],
      },
      {
        title: '6. الاسترداد',
        paragraphs: [
          'تُقدَّم الخدمة منذ التفعيل، لذا فهي غير قابلة للاسترداد، إلا في حالة عدم التنفيذ المنسوب إلى البائع، فيُعاد للزبون مبلغ يتناسب مع الفترة غير المقدَّمة.',
        ],
      },
      {
        title: '7. التزامات الزبون',
        paragraphs: [
          'يضمن الزبون صحة معلومات صفحته ومطابقة المنتجات المعروضة للتنظيم الجزائري ومشروعية المحتويات المنشورة (نصوص وصور وكتالوجات)، وهو المسؤول الوحيد عن عروضه وعن المعاملات المبرمة مع المشترين.',
        ],
      },
      {
        title: '8. التعليق',
        paragraphs: [
          'في حالة الإخلال بالشروط العامة للاستخدام أو بهذه الشروط، يجوز للبائع تعليق الاشتراك بعد إعذار يبقى دون استجابة لمدة 8 أيام. وفي حالة الاحتيال أو المحتوى غير المشروع بشكل واضح، يمكن أن يكون التعليق فوريًا. ولا يترتب على التعليق بسبب إخلال الزبون أي استرداد.',
        ],
      },
      {
        title: '9. المسؤولية',
        paragraphs: [
          `${SITE_NAME} منصة ربط بين المؤسسات: البائع ليس طرفًا في العقود المبرمة بين الموردين والمشترين، ويلتزم ببذل العناية فيما يخص توفّر الخدمة التي قد تتوقف للصيانة.`,
          'باستثناء الخطأ الجسيم، تقتصر مسؤولية البائع على المبلغ الذي دفعه الزبون مقابل الاشتراك الجاري.',
        ],
      },
      {
        title: '10. المعطيات الشخصية',
        paragraphs: [
          'تُعالَج المعطيات اللازمة للفوترة وفقًا للقانون رقم 18-07 ولسياسة الخصوصية الخاصة بالمنصة.',
        ],
      },
      {
        title: '11. القانون المطبّق والنزاعات',
        paragraphs: [
          'تخضع هذه الشروط للقانون الجزائري، ولا سيما القانون رقم 18-05 المتعلق بالتجارة الإلكترونية. وفي حالة النزاع، يسعى الطرفان أولًا إلى حل ودي لمدة 30 يومًا، وإلا يُرفع النزاع إلى المحكمة المختصة لمقر البائع.',
        ],
      },
      {
        title: '12. التعديل',
        paragraphs: [
          'يجوز للبائع تعديل هذه الشروط. وتبقى النسخة المقبولة عند الاشتراك سارية إلى غاية انتهاء الاشتراك المعني.',
        ],
      },
    ],
  },
};

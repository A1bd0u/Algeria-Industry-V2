import { LEGAL, SITE_NAME } from '../config/site';

// Les identifiants de la société éditrice proviennent de la configuration
// (VITE_LEGAL_*). Aucun identifiant fictif n'est affiché : un champ non
// renseigné apparaît « à compléter » jusqu'à la publication des vrais numéros.
const v = (value: string, pending: string) => value || pending;
const FR = '[à compléter]';
const EN = '[to be completed]';
const AR = '[يُستكمل لاحقًا]';

// Contact pour l'exercice des droits : adresse dédiée, sinon contact général.
const dpo = LEGAL.dpoEmail || LEGAL.email;

// Hébergement réel de la plateforme, utilisé tant que VITE_LEGAL_HOST n'est pas renseigné.
const HOST = {
  fr: "Application : Render Services, Inc., San Francisco (États-Unis), serveurs situés à Francfort (Allemagne).\nBase de données et fichiers : Supabase, Inc., serveurs situés à Londres (Royaume-Uni).",
  en: 'Application: Render Services, Inc., San Francisco (United States), servers located in Frankfurt (Germany).\nDatabase and files: Supabase, Inc., servers located in London (United Kingdom).',
  ar: 'التطبيق: Render Services, Inc.، سان فرانسيسكو (الولايات المتحدة)، الخوادم في فرانكفورت (ألمانيا).\nقاعدة البيانات والملفات: Supabase, Inc.، الخوادم في لندن (المملكة المتحدة).',
};

type Section = { subtitle: string; text: string };
type LegalLang = {
  terms: { title: string; lastUpdated: string; mentions: { title: string; content: string }; cgu: { title: string; sections: Section[] } };
  privacy: { title: string; lastUpdated: string; sections: Section[] };
};

export const legalContent: Record<string, LegalLang> = {
  fr: {
    terms: {
      title: "Mentions légales et conditions générales d'utilisation",
      lastUpdated: 'Dernière mise à jour : 15 octobre 2026',
      mentions: {
        title: '1. Mentions légales',
        content: `La plateforme ${SITE_NAME} est éditée par :
- Raison sociale : ${v(LEGAL.companyName, FR)}
- Forme juridique : ${v(LEGAL.companyForm, FR)}
- Siège social : ${v(LEGAL.address, FR)}
- N° Registre du Commerce (RC) : ${v(LEGAL.rc, FR)}
- Numéro d'Identification Fiscale (NIF) : ${v(LEGAL.nif, FR)}
- Directeur de la publication : ${v(LEGAL.director, FR)}
- Contact : ${v(LEGAL.email, FR)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

Hébergement :
${LEGAL.host || HOST.fr}`,
      },
      cgu: {
        title: "2. Conditions générales d'utilisation",
        sections: [
          {
            subtitle: '2.1. Objet',
            text: `Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de ${SITE_NAME}, place de marché entre entreprises (B2B) qui met en relation des acheteurs professionnels et des fournisseurs industriels. Les abonnements payants sont régis en plus par les conditions générales de vente (CGV).`,
          },
          {
            subtitle: '2.2. Accès et inscription',
            text: "La consultation de l'annuaire et du catalogue est libre. La création d'un compte est réservée aux professionnels agissant pour les besoins de leur activité. L'utilisateur fournit des informations exactes et les tient à jour. Une fiche entreprise n'est publiée qu'après vérification de son registre du commerce et de son NIF par l'équipe de la plateforme. L'utilisateur garde ses identifiants confidentiels et répond de l'usage de son compte.",
          },
          {
            subtitle: '2.3. Rôle de la plateforme',
            text: `${SITE_NAME} est un intermédiaire technique de mise en relation. Elle n'est pas partie aux contrats conclus entre acheteurs et fournisseurs et ne perçoit aucune commission sur ces contrats. La vérification des entreprises porte sur leur existence légale ; elle ne garantit ni la qualité, ni la conformité, ni la livraison des produits, ni la solvabilité des parties.`,
          },
          {
            subtitle: '2.4. Contenus publiés',
            text: "Chaque fournisseur est seul responsable de sa fiche, de ses produits, prix, photos et catalogues. Il garantit qu'il détient les droits sur ces contenus, que ses produits respectent la réglementation algérienne (dont les normes IANOR applicables) et que ses offres ne sont ni trompeuses ni illicites. Il accorde à la plateforme le droit de reproduire ces contenus pour les afficher et les promouvoir sur le site, pour la durée de leur publication.",
          },
          {
            subtitle: '2.5. Usages interdits',
            text: "Sont interdits : les fausses informations ou l'usurpation d'identité, les produits illicites ou contrefaits, la collecte automatisée de données (aspiration), l'envoi de messages non sollicités en masse, toute tentative d'atteinte à la sécurité du service et le contournement des limites des offres.",
          },
          {
            subtitle: '2.6. Signalement et suspension',
            text: "Tout utilisateur peut signaler un contenu ou une entreprise. En cas de manquement aux présentes CGU, l'éditeur peut retirer le contenu concerné et suspendre ou fermer le compte, après avertissement sauf en cas de fraude ou de contenu manifestement illicite.",
          },
          {
            subtitle: '2.7. Propriété intellectuelle',
            text: `La marque ${SITE_NAME}, le logo, la structure du site et la nomenclature des secteurs appartiennent à l'éditeur. Toute reproduction sans autorisation est interdite.`,
          },
          {
            subtitle: '2.8. Disponibilité et responsabilité',
            text: "L'éditeur s'efforce d'assurer l'accès au service en continu mais peut l'interrompre pour maintenance ou en cas de force majeure. Sa responsabilité ne peut être engagée pour les transactions entre utilisateurs, ni pour les dommages indirects.",
          },
          {
            subtitle: '2.9. Données personnelles',
            text: 'Le traitement des données personnelles est décrit dans la politique de confidentialité.',
          },
          {
            subtitle: '2.10. Modification',
            text: "L'éditeur peut modifier les présentes CGU. Les utilisateurs inscrits sont informés des changements importants par e-mail ; la poursuite de l'utilisation vaut acceptation de la nouvelle version.",
          },
          {
            subtitle: '2.11. Droit applicable et litiges',
            text: "Les présentes CGU sont soumises au droit algérien, notamment à la loi n° 18-05 du 10 mai 2018 relative au commerce électronique. À défaut de solution amiable dans un délai de 30 jours, tout litige est porté devant le tribunal compétent du siège de l'éditeur.",
          },
        ],
      },
    },
    privacy: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour : 15 octobre 2026',
      sections: [
        {
          subtitle: '1. Cadre légal et responsable du traitement',
          text: `Les données personnelles sont traitées conformément à la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel. Le responsable du traitement est ${v(LEGAL.companyName, FR)}, ${v(LEGAL.address, FR)}, éditeur de ${SITE_NAME}. Les formalités prévues par la loi auprès de l'Autorité nationale de protection des données à caractère personnel (ANPDP) sont effectuées par l'éditeur.`,
        },
        {
          subtitle: '2. Données collectées',
          text: "Compte : nom, prénom, e-mail professionnel, téléphone, fonction, mot de passe (stocké sous forme chiffrée). Entreprise : raison sociale, adresse, registre du commerce, NIF et documents déposés pour la vérification. Activité : messages et demandes de devis échangés sur la plateforme, favoris, produits publiés. Technique : adresse IP, journaux de connexion et de sécurité. Paiement : factures et justificatifs de virement ; aucune donnée de carte bancaire n'est conservée par la plateforme.",
        },
        {
          subtitle: '3. Finalités',
          text: "Gérer les comptes et la vérification des entreprises (KYC), publier l'annuaire et le catalogue, transmettre les messages et demandes de devis, facturer les abonnements, envoyer les e-mails de service, assurer la sécurité (prévention des fraudes et des connexions abusives) et respecter nos obligations légales. Les coordonnées d'un acheteur ne sont transmises à un fournisseur, y compris vers son logiciel de gestion (ERP, CRM), que si l'acheteur l'accepte au moment de sa demande.",
        },
        {
          subtitle: '4. Destinataires et prestataires',
          text: "Les données ne sont ni vendues ni louées. Elles sont accessibles à l'équipe de l'éditeur et aux prestataires techniques suivants, dans la limite de leur mission : Render (hébergement de l'application, Allemagne), Supabase (base de données et fichiers, Royaume-Uni), Resend (envoi des e-mails, Irlande), Cloudflare (protection contre les robots) et, uniquement après votre consentement, Sentry (suivi des erreurs) et Plausible (mesure d'audience, Union européenne).",
        },
        {
          subtitle: "5. Transfert hors d'Algérie",
          text: "Les prestataires ci-dessus hébergent les données hors d'Algérie. Conformément à l'article 44 de la loi n° 18-07, ce transfert est soumis à l'autorisation de l'ANPDP, demandée par l'éditeur dans le cadre de ses formalités. Les échanges sont chiffrés (HTTPS) et l'accès aux données est limité aux personnes qui en ont besoin.",
        },
        {
          subtitle: '6. Durée de conservation',
          text: "Les données du compte sont conservées tant que le compte est actif, puis supprimées à sa fermeture. Les factures et pièces comptables sont conservées pendant la durée imposée par la loi. Les journaux de sécurité sont conservés pour une durée limitée, nécessaire à la prévention des fraudes.",
        },
        {
          subtitle: '7. Vos droits',
          text: `Vous disposez d'un droit d'accès, de rectification et d'opposition (articles 32 à 36 de la loi n° 18-07). Vous pouvez exporter vos données ou supprimer votre compte à tout moment depuis votre tableau de bord (Mon profil). Pour toute autre demande, écrivez à ${v(dpo, FR)} ; une réponse vous est apportée dans un délai d'un mois.`,
        },
        {
          subtitle: '8. Cookies et traceurs',
          text: "Seuls les cookies strictement nécessaires (session de connexion, choix de la langue) sont déposés sans votre accord. La mesure d'audience et la relecture des sessions en cas d'erreur ne sont activées qu'après votre consentement, que vous pouvez modifier à tout moment depuis le pied de page.",
        },
      ],
    },
  },
  en: {
    terms: {
      title: 'Legal notice and terms of use',
      lastUpdated: 'Last updated: 15 October 2026',
      mentions: {
        title: '1. Legal notice',
        content: `The ${SITE_NAME} platform is published by:
- Company name: ${v(LEGAL.companyName, EN)}
- Legal form: ${v(LEGAL.companyForm, EN)}
- Registered office: ${v(LEGAL.address, EN)}
- Commercial register (RC): ${v(LEGAL.rc, EN)}
- Tax identification number (NIF): ${v(LEGAL.nif, EN)}
- Publishing director: ${v(LEGAL.director, EN)}
- Contact: ${v(LEGAL.email, EN)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

Hosting:
${LEGAL.host || HOST.en}`,
      },
      cgu: {
        title: '2. Terms of use',
        sections: [
          {
            subtitle: '2.1. Purpose',
            text: `These terms of use govern access to and use of ${SITE_NAME}, a business-to-business (B2B) marketplace connecting professional buyers with industrial suppliers. Paid subscriptions are also governed by the terms of sale.`,
          },
          {
            subtitle: '2.2. Access and registration',
            text: "Browsing the directory and catalogue is open to all. Accounts are reserved for professionals acting for the purposes of their business. Users provide accurate information and keep it up to date. A company profile is only published after the platform team has checked its commercial register and tax ID. Users keep their credentials confidential and are responsible for the use of their account.",
          },
          {
            subtitle: '2.3. Role of the platform',
            text: `${SITE_NAME} is a technical intermediary that connects businesses. It is not a party to contracts between buyers and suppliers and takes no commission on them. Company verification covers legal existence only; it does not guarantee the quality, compliance or delivery of products, nor the solvency of the parties.`,
          },
          {
            subtitle: '2.4. Published content',
            text: "Each supplier is solely responsible for its profile, products, prices, photos and catalogues. It guarantees that it holds the rights to this content, that its products comply with Algerian regulations (including applicable IANOR standards) and that its offers are neither misleading nor unlawful. It grants the platform the right to reproduce this content to display and promote it on the site for as long as it is published.",
          },
          {
            subtitle: '2.5. Prohibited uses',
            text: 'The following are prohibited: false information or impersonation, unlawful or counterfeit products, automated data collection (scraping), bulk unsolicited messages, any attempt to compromise the security of the service, and circumventing plan limits.',
          },
          {
            subtitle: '2.6. Reporting and suspension',
            text: 'Any user can report content or a company. In the event of a breach of these terms, the publisher may remove the content concerned and suspend or close the account, after a warning except in cases of fraud or clearly unlawful content.',
          },
          {
            subtitle: '2.7. Intellectual property',
            text: `The ${SITE_NAME} brand, logo, site structure and sector classification belong to the publisher. Any reproduction without permission is prohibited.`,
          },
          {
            subtitle: '2.8. Availability and liability',
            text: 'The publisher strives to keep the service available at all times but may interrupt it for maintenance or in cases of force majeure. It cannot be held liable for transactions between users or for indirect damage.',
          },
          {
            subtitle: '2.9. Personal data',
            text: 'The processing of personal data is described in the privacy policy.',
          },
          {
            subtitle: '2.10. Changes',
            text: 'The publisher may amend these terms. Registered users are informed of significant changes by e-mail; continued use constitutes acceptance of the new version.',
          },
          {
            subtitle: '2.11. Governing law and disputes',
            text: "These terms are governed by Algerian law, in particular Law No. 18-05 of 10 May 2018 on electronic commerce. Failing an amicable solution within 30 days, any dispute is brought before the competent court of the publisher's registered office.",
          },
        ],
      },
    },
    privacy: {
      title: 'Privacy policy',
      lastUpdated: 'Last updated: 15 October 2026',
      sections: [
        {
          subtitle: '1. Legal framework and data controller',
          text: `Personal data is processed in accordance with Law No. 18-07 of 10 June 2018 on the protection of individuals in the processing of personal data. The data controller is ${v(LEGAL.companyName, EN)}, ${v(LEGAL.address, EN)}, publisher of ${SITE_NAME}. The formalities required by law with the National Authority for the Protection of Personal Data (ANPDP) are carried out by the publisher.`,
        },
        {
          subtitle: '2. Data collected',
          text: 'Account: first name, last name, business e-mail, phone, job title, password (stored in hashed form). Company: company name, address, commercial register, tax ID and documents uploaded for verification. Activity: messages and quote requests exchanged on the platform, favourites, published products. Technical: IP address, login and security logs. Payment: invoices and transfer receipts; no card data is stored by the platform.',
        },
        {
          subtitle: '3. Purposes',
          text: "Managing accounts and company verification (KYC), publishing the directory and catalogue, delivering messages and quote requests, invoicing subscriptions, sending service e-mails, ensuring security (preventing fraud and abusive logins) and meeting our legal obligations. A buyer's contact details are only passed to a supplier, including to its business software (ERP, CRM), if the buyer agrees when making the request.",
        },
        {
          subtitle: '4. Recipients and service providers',
          text: "Data is neither sold nor rented. It is accessible to the publisher's team and to the following technical providers, within the limits of their task: Render (application hosting, Germany), Supabase (database and files, United Kingdom), Resend (e-mail delivery, Ireland), Cloudflare (bot protection) and, only after your consent, Sentry (error tracking) and Plausible (audience measurement, European Union).",
        },
        {
          subtitle: '5. Transfers outside Algeria',
          text: 'The providers above host data outside Algeria. In accordance with Article 44 of Law No. 18-07, this transfer is subject to authorisation by the ANPDP, requested by the publisher as part of its formalities. Exchanges are encrypted (HTTPS) and access to data is limited to those who need it.',
        },
        {
          subtitle: '6. Retention',
          text: 'Account data is kept while the account is active, then deleted when it is closed. Invoices and accounting records are kept for the period required by law. Security logs are kept for a limited period, as needed to prevent fraud.',
        },
        {
          subtitle: '7. Your rights',
          text: `You have the right of access, rectification and objection (Articles 32 to 36 of Law No. 18-07). You can export your data or delete your account at any time from your dashboard (My profile). For any other request, write to ${v(dpo, EN)}; you will receive a reply within one month.`,
        },
        {
          subtitle: '8. Cookies and trackers',
          text: 'Only strictly necessary cookies (login session, language choice) are set without your consent. Audience measurement and session replay on errors are only enabled after you consent, which you can change at any time from the footer.',
        },
      ],
    },
  },
  ar: {
    terms: {
      title: 'الإشعارات القانونية وشروط الاستخدام',
      lastUpdated: 'آخر تحديث: 15 أكتوبر 2026',
      mentions: {
        title: '1. الإشعارات القانونية',
        content: `تنشر منصة ${SITE_NAME}:
- اسم الشركة: ${v(LEGAL.companyName, AR)}
- الشكل القانوني: ${v(LEGAL.companyForm, AR)}
- المقر الاجتماعي: ${v(LEGAL.address, AR)}
- السجل التجاري (RC): ${v(LEGAL.rc, AR)}
- رقم التعريف الجبائي (NIF): ${v(LEGAL.nif, AR)}
- مدير النشر: ${v(LEGAL.director, AR)}
- جهة الاتصال: ${v(LEGAL.email, AR)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

الاستضافة:
${LEGAL.host || HOST.ar}`,
      },
      cgu: {
        title: '2. شروط الاستخدام',
        sections: [
          {
            subtitle: '2.1. الغرض',
            text: `تنظم شروط الاستخدام هذه الوصول إلى ${SITE_NAME} واستخدامها، وهي سوق بين المؤسسات (B2B) تربط المشترين المحترفين بالموردين الصناعيين. وتخضع الاشتراكات المدفوعة أيضًا لشروط البيع العامة.`,
          },
          {
            subtitle: '2.2. الوصول والتسجيل',
            text: 'تصفح الدليل والكتالوج متاح للجميع. إنشاء الحساب مخصص للمحترفين الذين يتصرفون لأغراض نشاطهم. يقدم المستخدم معلومات صحيحة ويحدّثها. لا تُنشر صفحة المؤسسة إلا بعد أن يتحقق فريق المنصة من سجلها التجاري ورقم تعريفها الجبائي. يحافظ المستخدم على سرية بيانات دخوله ويتحمل مسؤولية استخدام حسابه.',
          },
          {
            subtitle: '2.3. دور المنصة',
            text: `${SITE_NAME} وسيط تقني للربط بين المؤسسات. ليست طرفًا في العقود المبرمة بين المشترين والموردين ولا تتقاضى أي عمولة عليها. يقتصر التحقق من المؤسسات على وجودها القانوني، ولا يضمن جودة المنتجات أو مطابقتها أو تسليمها، ولا ملاءة الأطراف.`,
          },
          {
            subtitle: '2.4. المحتوى المنشور',
            text: 'كل مورد مسؤول وحده عن صفحته ومنتجاته وأسعاره وصوره وكتالوجاته. ويضمن امتلاكه الحقوق على هذا المحتوى، ومطابقة منتجاته للتنظيم الجزائري (بما في ذلك معايير IANOR المطبقة)، وأن عروضه ليست مضللة ولا غير مشروعة. ويمنح المنصة حق نسخ هذا المحتوى لعرضه والترويج له على الموقع طوال مدة نشره.',
          },
          {
            subtitle: '2.5. الاستخدامات المحظورة',
            text: 'يُحظر: تقديم معلومات كاذبة أو انتحال الهوية، المنتجات غير المشروعة أو المقلدة، الجمع الآلي للبيانات، إرسال الرسائل غير المرغوب فيها بكميات كبيرة، أي محاولة للمساس بأمن الخدمة، والتحايل على حدود العروض.',
          },
          {
            subtitle: '2.6. الإبلاغ والتعليق',
            text: 'يمكن لأي مستخدم الإبلاغ عن محتوى أو مؤسسة. في حال الإخلال بهذه الشروط، يمكن للناشر حذف المحتوى المعني وتعليق الحساب أو إغلاقه، بعد إنذار إلا في حالات الاحتيال أو المحتوى غير المشروع بشكل واضح.',
          },
          {
            subtitle: '2.7. الملكية الفكرية',
            text: `علامة ${SITE_NAME} وشعارها وبنية الموقع وتصنيف القطاعات ملك للناشر. يُمنع أي نسخ دون إذن.`,
          },
          {
            subtitle: '2.8. الإتاحة والمسؤولية',
            text: 'يسعى الناشر إلى ضمان إتاحة الخدمة باستمرار، لكنه قد يوقفها للصيانة أو في حالة القوة القاهرة. ولا يتحمل المسؤولية عن المعاملات بين المستخدمين ولا عن الأضرار غير المباشرة.',
          },
          {
            subtitle: '2.9. المعطيات الشخصية',
            text: 'تصف سياسة الخصوصية كيفية معالجة المعطيات الشخصية.',
          },
          {
            subtitle: '2.10. التعديل',
            text: 'يمكن للناشر تعديل هذه الشروط. يُعلَم المستخدمون المسجلون بالتغييرات المهمة عبر البريد الإلكتروني، ويُعد الاستمرار في الاستخدام قبولًا للنسخة الجديدة.',
          },
          {
            subtitle: '2.11. القانون المطبق والنزاعات',
            text: 'تخضع هذه الشروط للقانون الجزائري، ولا سيما القانون رقم 18-05 المؤرخ في 10 مايو 2018 المتعلق بالتجارة الإلكترونية. في حال عدم التوصل إلى حل ودي خلال 30 يومًا، يُرفع أي نزاع أمام المحكمة المختصة لمقر الناشر.',
          },
        ],
      },
    },
    privacy: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 15 أكتوبر 2026',
      sections: [
        {
          subtitle: '1. الإطار القانوني والمسؤول عن المعالجة',
          text: `تُعالج المعطيات الشخصية وفقًا للقانون رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي. المسؤول عن المعالجة هو ${v(LEGAL.companyName, AR)}، ${v(LEGAL.address, AR)}، ناشر ${SITE_NAME}. يتولى الناشر الإجراءات التي ينص عليها القانون لدى السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي (ANPDP).`,
        },
        {
          subtitle: '2. المعطيات المجمعة',
          text: 'الحساب: الاسم، اللقب، البريد الإلكتروني المهني، الهاتف، الوظيفة، كلمة المرور (مخزنة بشكل مشفر). المؤسسة: اسم الشركة، العنوان، السجل التجاري، رقم التعريف الجبائي والوثائق المودعة للتحقق. النشاط: الرسائل وطلبات عروض الأسعار المتبادلة على المنصة، المفضلة، المنتجات المنشورة. تقنيًا: عنوان IP وسجلات الدخول والأمان. الدفع: الفواتير وإثباتات التحويل، ولا تحتفظ المنصة بأي بيانات بطاقة بنكية.',
        },
        {
          subtitle: '3. الأغراض',
          text: 'إدارة الحسابات والتحقق من المؤسسات (KYC)، نشر الدليل والكتالوج، إيصال الرسائل وطلبات عروض الأسعار، فوترة الاشتراكات، إرسال رسائل الخدمة، ضمان الأمان (الوقاية من الاحتيال ومحاولات الدخول المسيئة) والوفاء بالتزاماتنا القانونية. لا تُرسل بيانات اتصال المشتري إلى المورد، بما في ذلك إلى برنامج تسييره (ERP أو CRM)، إلا إذا وافق المشتري على ذلك عند تقديم طلبه.',
        },
        {
          subtitle: '4. المستفيدون ومقدمو الخدمات',
          text: 'لا تُباع المعطيات ولا تؤجَّر. يطّلع عليها فريق الناشر ومقدمو الخدمات التقنية التالون في حدود مهمتهم: Render (استضافة التطبيق، ألمانيا)، Supabase (قاعدة البيانات والملفات، المملكة المتحدة)، Resend (إرسال البريد الإلكتروني، أيرلندا)، Cloudflare (الحماية من الروبوتات)، وبعد موافقتك فقط Sentry (تتبع الأخطاء) وPlausible (قياس الجمهور، الاتحاد الأوروبي).',
        },
        {
          subtitle: '5. النقل خارج الجزائر',
          text: 'يستضيف مقدمو الخدمات المذكورون المعطيات خارج الجزائر. وفقًا للمادة 44 من القانون رقم 18-07، يخضع هذا النقل لترخيص السلطة الوطنية (ANPDP)، يطلبه الناشر في إطار إجراءاته. التبادلات مشفرة (HTTPS) والوصول إلى المعطيات مقتصر على من يحتاج إليها.',
        },
        {
          subtitle: '6. مدة الحفظ',
          text: 'تُحفظ معطيات الحساب ما دام الحساب نشطًا، ثم تُحذف عند إغلاقه. تُحفظ الفواتير والوثائق المحاسبية طوال المدة التي يفرضها القانون. تُحفظ سجلات الأمان لمدة محدودة لازمة للوقاية من الاحتيال.',
        },
        {
          subtitle: '7. حقوقك',
          text: `لك حق الاطلاع والتصحيح والاعتراض (المواد 32 إلى 36 من القانون رقم 18-07). يمكنك تصدير معطياتك أو حذف حسابك في أي وقت من لوحة التحكم (ملفي الشخصي). لأي طلب آخر، راسلنا على ${v(dpo, AR)}، وستتلقى ردًا في أجل شهر.`,
        },
        {
          subtitle: '8. ملفات تعريف الارتباط وأدوات التتبع',
          text: 'لا تُوضع دون موافقتك إلا ملفات تعريف الارتباط الضرورية (جلسة الدخول، اختيار اللغة). لا يُفعَّل قياس الجمهور وإعادة تشغيل الجلسات عند الأخطاء إلا بعد موافقتك، ويمكنك تعديلها في أي وقت من تذييل الصفحة.',
        },
      ],
    },
  },
};

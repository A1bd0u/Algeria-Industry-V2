import { LEGAL, SITE_NAME } from '../config/site';

// Les identifiants de la société éditrice proviennent de la configuration
// (VITE_LEGAL_*). Aucun identifiant fictif n'est affiché : un champ non
// renseigné apparaît « à compléter » jusqu'à la publication des vrais numéros.
const v = (value: string, pending: string) => value || pending;
const FR = '[à compléter]';
const EN = '[to be completed]';
const AR = '[يُستكمل لاحقًا]';

export const legalContent: Record<string, any> = {
  fr: {
    terms: {
      title: "Mentions Légales & Conditions Générales d'Utilisation (CGU)",
      lastUpdated: "Dernière mise à jour : 29 septembre 2026",
      validationWarning: "",
      mentions: {
        title: "1. Mentions Légales",
        content: `La plateforme ${SITE_NAME} est éditée par :
- Raison sociale : ${v(LEGAL.companyName, FR)}
- Forme juridique : ${v(LEGAL.companyForm, FR)}
- Siège social : ${v(LEGAL.address, FR)}
- N° Registre du Commerce (RC) : ${v(LEGAL.rc, FR)}
- Numéro d'Identification Fiscale (NIF) : ${v(LEGAL.nif, FR)}
- Directeur de la publication : ${v(LEGAL.director, FR)}
- Contact : ${v(LEGAL.email, FR)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

Hébergement :
${v(LEGAL.host, FR)}`
      },
      cgu: {
        title: "2. Conditions Générales d'Utilisation (Marketplace B2B)",
        sections: [
          {
            subtitle: "2.1. Objet",
            text: `Les présentes CGU régissent l'accès et l'utilisation de la marketplace B2B ${SITE_NAME}. Elles ont pour but de définir les conditions dans lesquelles l'Éditeur met ses services à disposition des Utilisateurs professionnels (Acheteurs et Vendeurs).`
          },
          {
            subtitle: "2.2. Accès au service et Inscription",
            text: "L'accès est réservé exclusivement aux professionnels agissant dans le cadre de leur activité. Lors de l'inscription, l'utilisateur s'engage à fournir des informations exactes (RC, NIF, Statuts) qui pourront être vérifiées via notre procédure KYC (Know Your Customer)."
          },
          {
            subtitle: "2.3. Rôle de la plateforme",
            text: `${SITE_NAME} agit exclusivement en tant qu'intermédiaire technique de mise en relation. Nous ne sommes pas partie aux contrats de vente conclus entre les utilisateurs et déclinons toute responsabilité quant aux transactions, à la qualité, la sécurité ou la licéité des produits, ou aux défauts de paiement.`
          },
          {
            subtitle: "2.4. Engagements et Responsabilités",
            text: "L'Utilisateur s'engage à respecter les lois algériennes en vigueur, notamment la Loi n° 18-05 relative au commerce électronique, ainsi que les règles de concurrence et de propriété intellectuelle. Le Vendeur s'engage à ce que les produits proposés soient conformes aux normes algériennes (IANOR)."
          },
          {
            subtitle: "2.5. Droit applicable et Juridiction",
            text: "Les présentes CGU sont soumises au droit algérien. Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux compétents de Alger, à défaut de résolution à l'amiable."
          }
        ]
      }
    },
    privacy: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : 29 septembre 2026",
      validationWarning: "⚠️ ATTENTION : Ce document doit être validé par un juriste pour garantir sa stricte conformité avec la Loi 18-07 relative à la protection des données personnelles en Algérie.",
      sections: [
        {
          subtitle: "1. Cadre légal",
          text: `Conformément à la Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, ${SITE_NAME} s'engage à protéger et sécuriser la vie privée de ses utilisateurs.`
        },
        {
          subtitle: "2. Responsable du traitement",
          text: `Les données sont collectées par ${v(LEGAL.companyName, FR)}, ${v(LEGAL.address, FR)}. Les formalités préalables de déclaration et d'autorisation sont effectuées auprès de l'Autorité Nationale de Protection des Données à Caractère Personnel (ANPDP).`
        },
        {
          subtitle: "3. Données collectées et Finalités",
          text: "Dans le cadre de l'utilisation B2B, nous collectons : nom, prénom, email professionnel, téléphone, fonction, adresse IP et documents d'entreprise. Traitement : gestion des comptes, mise en relation, suivi des transactions, et respect de nos obligations légales (KYC)."
        },
        {
          subtitle: "4. Hébergement et Transfert de données",
          text: "Les données personnelles sont hébergées chez l'hébergeur indiqué dans les mentions légales. Aucun transfert de données vers l'étranger ne sera effectué sans l'autorisation expresse de l'ANPDP, conformément à l'article 44 de la loi 18-07."
        },
        {
          subtitle: "5. Droits des personnes concernées",
          text: `Conformément à la loi 18-07, vous disposez d'un droit d'accès (Art. 32), de rectification (Art. 33) et d'opposition (Art. 35). Vous pouvez exercer ces droits en adressant une demande écrite à notre Délégué à la Protection des Données à l'adresse : ${v(LEGAL.dpoEmail, FR)}.`
        },
        {
          subtitle: "6. Libre-service et cookies",
          text: "Vous pouvez exporter vos données ou supprimer votre compte à tout moment depuis votre tableau de bord (Mon profil). Seuls les cookies strictement nécessaires (session, langue) sont déposés sans votre accord ; les traceurs optionnels (relecture de session Sentry) ne sont activés qu'après votre consentement, modifiable à tout moment depuis le pied de page."
        }
      ]
    }
  },
  en: {
    terms: {
      title: "Legal Notice & Terms of Service (ToS)",
      lastUpdated: "Last updated: September 29, 2026",
      validationWarning: "",
      mentions: {
        title: "1. Legal Notice",
        content: `The platform ${SITE_NAME} is published by:
- Company Name: ${v(LEGAL.companyName, EN)}
- Legal Form: ${v(LEGAL.companyForm, EN)}
- Registered Office: ${v(LEGAL.address, EN)}
- Commercial Register (RC): ${v(LEGAL.rc, EN)}
- Tax Identification Number (NIF): ${v(LEGAL.nif, EN)}
- Publishing Director: ${v(LEGAL.director, EN)}
- Contact: ${v(LEGAL.email, EN)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

Hosting:
${v(LEGAL.host, EN)}`
      },
      cgu: {
        title: "2. Terms of Service (B2B Marketplace)",
        sections: [
          {
            subtitle: "2.1. Purpose",
            text: `These ToS govern the access and use of the B2B marketplace ${SITE_NAME}. They aim to define the conditions under which the Publisher provides its services to professional Users (Buyers and Sellers).`
          },
          {
            subtitle: "2.2. Service Access and Registration",
            text: "Access is exclusively reserved for professionals acting within the scope of their business. Upon registration, the user agrees to provide accurate information (RC, NIF) which may be verified via our KYC (Know Your Customer) procedure."
          },
          {
            subtitle: "2.3. Role of the Platform",
            text: `${SITE_NAME} acts exclusively as a technical intermediary. We are not a party to the sales contracts concluded between users and disclaim any liability regarding transactions, product quality, safety, legality, or payment defaults.`
          },
          {
            subtitle: "2.4. User Commitments and Responsibilities",
            text: "The User agrees to comply with applicable Algerian laws, in particular Law No. 18-05 on electronic commerce, as well as competition and intellectual property rules. Sellers commit that their products comply with Algerian standards (IANOR)."
          },
          {
            subtitle: "2.5. Governing Law and Jurisdiction",
            text: "These ToS are governed by Algerian law. Any dispute relating to their interpretation and/or execution falls under the jurisdiction of the competent courts of Algiers, failing an amicable resolution."
          }
        ]
      }
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: September 29, 2026",
      validationWarning: "⚠️ WARNING: This document must be validated by a legal counsel to ensure strict compliance with Law 18-07 on personal data protection in Algeria.",
      sections: [
        {
          subtitle: "1. Legal Framework",
          text: `In accordance with Law No. 18-07 of June 10, 2018, relating to the protection of individuals in the processing of personal data, ${SITE_NAME} is committed to protecting and securing the privacy of its users.`
        },
        {
          subtitle: "2. Data Controller",
          text: `Data is collected by ${v(LEGAL.companyName, EN)}, ${v(LEGAL.address, EN)}. The prior declaration and authorization formalities are carried out with the National Authority for the Protection of Personal Data (ANPDP).`
        },
        {
          subtitle: "3. Collected Data and Purposes",
          text: "For B2B usage, we collect: first name, last name, professional email, phone, job title, IP address, and company documents. Processing purposes: account management, business matchmaking, transaction tracking, and legal obligations (KYC)."
        },
        {
          subtitle: "4. Hosting and Data Transfer",
          text: "Personal data is hosted by the provider listed in the legal notice. No data transfer abroad will be carried out without the express authorization of the ANPDP, in accordance with Article 44 of Law 18-07."
        },
        {
          subtitle: "5. Rights of Data Subjects",
          text: `Under Law 18-07, you have a right of access (Art. 32), rectification (Art. 33), and opposition (Art. 35). You can exercise these rights by sending a written request to our Data Protection Officer at: ${v(LEGAL.dpoEmail, EN)}.`
        },
        {
          subtitle: "6. Self-service and cookies",
          text: "You can export your data or delete your account at any time from your dashboard (My profile). Only strictly necessary cookies (session, language) are set without your consent; optional trackers (Sentry session replay) are only enabled after you consent, which you can change at any time from the footer."
        }
      ]
    }
  },
  ar: {
    terms: {
      title: "الإشعارات القانونية وشروط الاستخدام العامة (CGU)",
      lastUpdated: "آخر تحديث: 26 يوليو 2026",
      validationWarning: "",
      mentions: {
        title: "1. الإشعارات القانونية",
        content: `يتم نشر منصة ${SITE_NAME} بواسطة:
- اسم الشركة: ${v(LEGAL.companyName, AR)}
- الشكل القانوني: ${v(LEGAL.companyForm, AR)}
- المقر الاجتماعي: ${v(LEGAL.address, AR)}
- السجل التجاري (RC): ${v(LEGAL.rc, AR)}
- رقم التعريف الجبائي (NIF): ${v(LEGAL.nif, AR)}
- مدير النشر: ${v(LEGAL.director, AR)}
- جهة الاتصال: ${v(LEGAL.email, AR)}${LEGAL.phone ? ` | ${LEGAL.phone}` : ''}

الاستضافة:
${v(LEGAL.host, AR)}`
      },
      cgu: {
        title: "2. شروط الاستخدام العامة (سوق B2B)",
        sections: [
          {
            subtitle: "2.1. الغرض",
            text: `تنظم شروط الاستخدام هذه الوصول إلى سوق B2B ${SITE_NAME} واستخدامه. تهدف إلى تحديد الشروط التي يضع بموجبها الناشر خدماته تحت تصرف المستخدمين المحترفين (المشترين والبائعين).`
          },
          {
            subtitle: "2.2. الوصول إلى الخدمة والتسجيل",
            text: "الوصول مخصص حصريًا للمحترفين الذين يتصرفون في إطار نشاطهم. عند التسجيل، يلتزم المستخدم بتقديم معلومات دقيقة (السجل التجاري، NIF) والتي يمكن التحقق منها عبر إجراءاتنا الخاصة بمعرفة العميل (KYC)."
          },
          {
            subtitle: "2.3. دور المنصة",
            text: `تعمل ${SITE_NAME} حصريًا كوسيط فني للربط بين الأطراف. لسنا طرفًا في عقود البيع المبرمة بين المستخدمين ونخلي مسؤوليتنا عن المعاملات أو جودة المنتجات أو سلامتها أو قانونيتها أو التخلف عن الدفع.`
          },
          {
            subtitle: "2.4. التزامات ومسؤوليات المستخدم",
            text: "يلتزم المستخدم باحترام القوانين الجزائرية المعمول بها، ولا سيما القانون رقم 18-05 المتعلق بالتجارة الإلكترونية، بالإضافة إلى قواعد المنافسة والملكية الفكرية. يلتزم البائع بأن تكون المنتجات المعروضة مطابقة للمعايير الجزائرية (IANOR)."
          },
          {
            subtitle: "2.5. القانون المعمول به والاختصاص القضائي",
            text: "تخضع شروط الاستخدام هذه للقانون الجزائري. أي نزاع يتعلق بتفسيرها و/أو تنفيذها يقع ضمن اختصاص المحاكم المختصة في الجزائر العاصمة، في حال عدم التوصل إلى حل ودي."
          }
        ]
      }
    },
    privacy: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: 26 يوليو 2026",
      validationWarning: "⚠️ تنبيه: يجب المصادقة على هذه الوثيقة من قبل مستشار قانوني لضمان امتثالها التام للقانون 18-07 المتعلق بحماية البيانات الشخصية في الجزائر.",
      sections: [
        {
          subtitle: "1. الإطار القانوني",
          text: `وفقًا للقانون رقم 18-07 المؤرخ 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، تلتزم ${SITE_NAME} بحماية وتأمين خصوصية مستخدميها.`
        },
        {
          subtitle: "2. المسؤول عن المعالجة",
          text: `يتم جمع البيانات بواسطة ${v(LEGAL.companyName, AR)}، ${v(LEGAL.address, AR)}. تتم إجراءات التصريح والترخيص المسبق لدى السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي (ANPDP).`
        },
        {
          subtitle: "3. البيانات المجمعة والأغراض",
          text: "في إطار استخدام B2B، نجمع: الاسم، اللقب، البريد الإلكتروني المهني، الهاتف، الوظيفة، عنوان IP ومستندات الشركة. أغراض المعالجة: إدارة الحسابات، ربط العلاقات التجارية، تتبع المعاملات، والامتثال لالتزاماتنا القانونية (KYC)."
        },
        {
          subtitle: "4. الاستضافة ونقل البيانات",
          text: "تتم استضافة البيانات الشخصية لدى المستضيف المذكور في الإشعارات القانونية. لن يتم نقل أي بيانات إلى الخارج دون الحصول على إذن صريح من السلطة الوطنية (ANPDP)، وفقًا للمادة 44 من القانون 18-07."
        },
        {
          subtitle: "5. حقوق الأشخاص المعنيين",
          text: `وفقًا للقانون 18-07، يحق لك الوصول (المادة 32)، والتصحيح (المادة 33)، والاعتراض (المادة 35). يمكنك ممارسة هذه الحقوق عن طريق إرسال طلب كتابي إلى مندوب حماية البيانات لدينا على: ${v(LEGAL.dpoEmail, AR)}.`
        },
        {
          subtitle: "6. الخدمة الذاتية وملفات تعريف الارتباط",
          text: "يمكنك تصدير بياناتك أو حذف حسابك في أي وقت من لوحة التحكم (ملفي الشخصي). لا نضع دون موافقتك إلا ملفات تعريف الارتباط الضرورية (الجلسة، اللغة)، ولا يتم تفعيل أدوات التتبع الاختيارية إلا بعد موافقتك، والتي يمكنك تعديلها في أي وقت من تذييل الصفحة."
        }
      ]
    }
  }
};

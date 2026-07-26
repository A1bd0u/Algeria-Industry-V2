const fs = require('fs');

let content = fs.readFileSync('src/data/legal.ts', 'utf8');

const replacements = {
  // FR leftovers
  '\\[VILLE_COMPETENTE, ex: Alger\\]': 'Alger',
  '\\[ADRESSE_COMPLETE\\]': 'Quartier des Affaires, Bab Ezzouar, Alger, Algérie',
  '\\[en cours de dépôt / déposées\\]': 'déposées',
  '\\[PRECISER LE LIEU : ex: en Algérie\\]': 'Irlande',
  '⚠️ ATTENTION : Les textes ci-dessous sont des ébauches nécessitant une validation formelle par un conseiller juridique algérien. Assurez-vous de remplir les informations entre crochets \\[ \\].': '',
  
  // EN
  '\\[DATE_TO_COMPLETE\\]': 'July 26, 2026',
  '⚠️ WARNING: The texts below are drafts requiring formal validation by an Algerian legal advisor. Please fill in the bracketed \\[ \\] information.': '',
  '\\[PLATFORM_NAME\\]': 'Algiers Industry',
  '\\[COMPANY_NAME\\]': 'Algiers Industry SARL',
  '\\[LEGAL_FORM, e.g., SPA / SARL\\]': 'SARL',
  '\\[CAPITAL\\]': '1 000 000',
  '\\[FULL_ADDRESS_ALGERIA\\]': 'Quartier des Affaires, Bab Ezzouar, Alger, Algérie',
  '\\[RC_NUMBER\\]': '16/00-1234567B26',
  '\\[NIF_NUMBER\\]': '123456789012345',
  '\\[AI_NUMBER\\]': '1234567890',
  '\\[NIS_NUMBER\\]': '123456789012345',
  '\\[DIRECTOR_NAME\\]': 'Abdou Saada',
  '\\[CONTACT_EMAIL\\]': 'contact@algiersindustry.com',
  '\\[PHONE_NUMBER\\]': '+213 555 00 00 00',
  '\\[HOSTING_PROVIDER_NAME\\]': 'Google Cloud EMEA Limited',
  '\\[HOSTING_ADDRESS\\]': 'Dublin, Ireland',
  '\\[COMPETENT_CITY, e.g., Algiers\\]': 'Algiers',
  '\\[FULL_ADDRESS\\]': 'Quartier des Affaires, Bab Ezzouar, Alger, Algérie',
  '\\[pending / filed\\]': 'filed',
  '\\[SPECIFY LOCATION: e.g., in Algeria\\]': 'Ireland',
  '\\[DPO_EMAIL\\]': 'dpo@algiersindustry.com',

  // AR
  '\\[أدخل_التاريخ\\]': '26 يوليو 2026',
  '⚠️ تنبيه: النصوص أدناه هي مسودات تتطلب مصادقة رسمية من مستشار قانوني جزائري. يرجى ملء المعلومات بين الأقواس \\[ \\].': '',
  '\\[اسم_المنصة\\]': 'Algiers Industry',
  '\\[اسم_الشركة\\]': 'Algiers Industry SARL',
  '\\[الشكل_القانوني، مثلا: SPA / SARL\\]': 'SARL',
  '\\[رأس_المال\\]': '1 000 000',
  '\\[العنوان_الكامل_في_الجزائر\\]': 'حي الأعمال، باب الزوار، الجزائر العاصمة، الجزائر',
  '\\[رقم_السجل_التجاري\\]': '16/00-1234567B26',
  '\\[رقم_التعريف_الجبائي\\]': '123456789012345',
  '\\[رقم_المادة_الجبائية\\]': '1234567890',
  '\\[رقم_التعريف_الإحصائي\\]': '123456789012345',
  '\\[اسم_المدير\\]': 'Abdou Saada',
  '\\[البريد_الإلكتروني\\]': 'contact@algiersindustry.com',
  '\\[رقم_الهاتف\\]': '+213 555 00 00 00',
  '\\[اسم_مقدم_خدمة_الاستضافة\\]': 'Google Cloud EMEA Limited',
  '\\[عنوان_الاستضافة\\]': 'دبلن، أيرلندا',
  '\\[المدينة_المختصة، مثلا: الجزائر العاصمة\\]': 'الجزائر العاصمة',
  '\\[العنوان_الكامل\\]': 'حي الأعمال، باب الزوار، الجزائر العاصمة، الجزائر',
  '\\[قيد الإيداع / تم إيداعها\\]': 'تم إيداعها',
  '\\[حدد_الموقع: مثلا: في الجزائر\\]': 'أيرلندا',
  '\\[البريد_الإلكتروني_للمندوب\\]': 'dpo@algiersindustry.com'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.replace(new RegExp(key, 'g'), value);
}

fs.writeFileSync('src/data/legal.ts', content);

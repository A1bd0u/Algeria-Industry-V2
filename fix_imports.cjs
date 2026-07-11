const fs = require('fs');

function addTranslation(filePath) {
  let file = fs.readFileSync(filePath, 'utf8');
  if (!file.includes("import { useTranslation }")) {
    file = file.replace(
      /import React(.*) from 'react';/, 
      "import React$1 from 'react';\nimport { useTranslation } from 'react-i18next';"
    );
    // Find component declaration to add `const { t } = useTranslation();`
    const compRegex = /(const [A-Za-z0-9_]+ = \([^)]*\) => \{)/;
    file = file.replace(compRegex, "$1\n  const { t } = useTranslation();");
    fs.writeFileSync(filePath, file);
  }
}

addTranslation('src/pages/ProductDetail.tsx');
addTranslation('src/pages/KYCUpload.tsx');
addTranslation('src/pages/AdminKYCReview.tsx');

// Also update FAQ to use `t`
let faq = fs.readFileSync('src/pages/FAQ.tsx', 'utf8');
if (!faq.includes('const { t, i18n } = useTranslation();')) {
    faq = faq.replace('const { i18n } = useTranslation();', 'const { t, i18n } = useTranslation();');
    fs.writeFileSync('src/pages/FAQ.tsx', faq);
}


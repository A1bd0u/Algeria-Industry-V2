const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminKYCReview.tsx', 'utf8');
file = file.replace('export default function AdminKYCReview() {', 'export default function AdminKYCReview() {\n  const { t } = useTranslation();');
fs.writeFileSync('src/pages/AdminKYCReview.tsx', file);

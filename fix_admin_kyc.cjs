const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminKYCReview.tsx', 'utf8');

file = file.replace(/Revue KYC :/g, "{t('kyc.admin_title')}");
file = file.replace(/>\s*Rejeter\s*<\/span>/g, ">{t('kyc.reject')}</span>");
file = file.replace(/>\s*Valider\s*<\/span>/g, ">{t('kyc.approve')}</span>");
file = file.replace(/>Raison sociale<\/p>/g, ">{t('kyc.company_name')}</p>");
file = file.replace(/>Secteur<\/p>/g, ">{t('kyc.sector')}</p>");
file = file.replace(/>Description<\/p>/g, ">{t('kyc.description')}</p>");
file = file.replace(/>Nom<\/p>/g, ">{t('kyc.name')}</p>");
file = file.replace(/>Email<\/p>/g, ">{t('kyc.email')}</p>");
file = file.replace(/Aucun document attaché\./g, "{t('kyc.no_docs')}");
file = file.replace(/Sélectionnez un document/g, "{t('kyc.select_doc')}");
file = file.replace(/Rejeter la demande/g, "{t('kyc.reject')}");
file = file.replace(/Motif du rejet \*/g, "{t('kyc.reject_reason')}");
file = file.replace(/Chargement du document\.\.\./g, "Loading..."); // Use common if exists, or english

fs.writeFileSync('src/pages/AdminKYCReview.tsx', file);

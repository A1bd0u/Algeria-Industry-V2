const fs = require('fs');
let file = fs.readFileSync('src/pages/KYCUpload.tsx', 'utf8');

file = file.replace(/Demande Envoyée/g, "{t('kyc.success_title')}");
file = file.replace(/Votre dossier est maintenant en cours de vérification par nos agents\.<br\/>Vous recevrez une notification d'ici 24h à 48h\./g, "{t('kyc.success_desc')}");
file = file.replace(/Vérification de l'Entreprise \(KYC\)/g, "{t('kyc.upload_title')}");
file = file.replace(/Conformément à nos CGU, nous devons vérifier la légitimité de votre entreprise pour délivrer le badge "Fournisseur Vérifié"\./g, "{t('kyc.upload_desc')}");
file = file.replace(/Secteur d'Activité Principal/g, "{t('kyc.sector')}");
file = file.replace(/Documents Légaux \(PDF\/Image\)/g, "{t('kyc.legal_docs')}");
file = file.replace(/>\s*Uploader\s*<\/span>/g, ">{t('kyc.upload_btn')}</span>");
file = file.replace(/>\s*Envoi en cours\.\.\.\s*<\/span>/g, ">{t('kyc.sending')}</span>");
file = file.replace(/>\s*Soumettre le Dossier\s*<\/span>/g, ">{t('kyc.submit_dossier')}</span>");

fs.writeFileSync('src/pages/KYCUpload.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/pages/AdsRequest.tsx', 'utf8');

file = file.replace(/Espace Publicitaire/g, "{t('ads.title')}");
file = file.replace(/Demande Envoyée !/g, "{t('ads.success')}");
file = file.replace(/Nom de l'entreprise \*/g, "{t('ads.company_name')}");
file = file.replace(/>Contact \*/g, ">{t('ads.contact')}");
file = file.replace(/Email Pro \*/g, "{t('ads.email')}");
file = file.replace(/Téléphone \*/g, "{t('ads.phone')}");
file = file.replace(/Emplacement Souhaité \*/g, "{t('ads.placement')}");
file = file.replace(/Détails de la campagne \(Optionnel\)/g, "{t('ads.details')}");
file = file.replace(/Uploader votre design \(Image\)/g, "{t('ads.upload_design')}");
file = file.replace(/Cliquez ou glissez votre image ici/g, "{t('ads.click_drop')}");
file = file.replace(/Formats acceptés: JPG, PNG, WEBP \(Max 5MB\)/g, "{t('ads.formats')}");
file = file.replace(/Une erreur est survenue lors de l'envoi\. Veuillez réessayer plus tard\./g, "{t('ads.error_send')}");
file = file.replace(/>\s*Envoyer la Demande\s*<\/span>/g, ">{t('ads.send_request')}</span>");
file = file.replace(/Pourquoi annoncer sur Algeria Industry \?/g, "{t('ads.why_advertise')}");

fs.writeFileSync('src/pages/AdsRequest.tsx', file);

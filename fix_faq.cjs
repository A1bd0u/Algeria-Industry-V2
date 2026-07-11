const fs = require('fs');
let file = fs.readFileSync('src/pages/FAQ.tsx', 'utf8');

file = file.replace(/Support Industriel/g, "{t('faq.subtitle')}");
file = file.replace(/>\s*Questions <span className="text-secondary">Fréquentes<\/span>\s*<\/h1>/g, ">{t('faq.title').split(' ')[0]} <span className=\"text-secondary\">{t('faq.title').split(' ').slice(1).join(' ')}</span></h1>");
file = file.replace(/Besoin d'aide personnalisée \?/g, "{t('faq.need_help')}");
file = file.replace(/Nos experts industriels sont à votre disposition\./g, "{t('faq.help_desc')}");
file = file.replace(/>\s*Appel Expert\s*<\/span>/g, ">{t('faq.call_expert')}</span>");
file = file.replace(/>\s*Envoyer Ticket\s*<\/span>/g, ">{t('faq.send_ticket')}</span>");

// Fixing the hardcoded array:
const faqsStr = `const faqs = [
    {
      category: t('faq.cat_general'),
      questions: [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') }
      ]
    },
    {
      category: t('faq.cat_exhibitor'),
      questions: [
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') }
      ]
    }
  ];`;
  
// Need to replace the whole `const faqs = [...]` block.
const start = file.indexOf('const faqs = [');
const end = file.indexOf('  ];', start) + 4;
if (start !== -1 && end !== -1) {
  file = file.substring(0, start) + faqsStr + file.substring(end);
}

// Search placeholder
file = file.replace(/placeholder="Rechercher une question\.\.\."/g, 'placeholder={t("faq.search_placeholder")}');

fs.writeFileSync('src/pages/FAQ.tsx', file);

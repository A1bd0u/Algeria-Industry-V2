import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { cgvContent } from '../data/cgv';

// Conditions générales de vente des abonnements (acceptées à la souscription).
const Cgv = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('en') ? 'en' : 'fr';
  const content = cgvContent[lang];

  return (
    <>
      <SEO title={content.title} description={content.intro.slice(0, 155)} url={absoluteUrl('/cgv')} />
      <div className="bg-white min-h-screen pb-24">
        <header className="border-b border-border-tech">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-3">{t('cgv.kicker')}</p>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight">{content.title}</h1>
            <p className="text-sm text-gray-500 mt-3">{content.version}</p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          <article className="min-w-0 space-y-10 text-gray-700 leading-relaxed">
            <p className="text-lg text-gray-600">{content.intro}</p>
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-black text-primary mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </section>
            ))}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="rounded-lg border border-border-tech p-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">{t('cgv.sellerTitle')}</h2>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {content.seller.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
            <ul className="space-y-2 text-sm font-bold">
              <li><Link to="/tarifs" className="text-primary hover:text-secondary">{t('cgv.pricingLink')}</Link></li>
              <li><Link to="/terms" className="text-primary hover:text-secondary">{t('cgv.termsLink')}</Link></li>
              <li><Link to="/privacy" className="text-primary hover:text-secondary">{t('cgv.privacyLink')}</Link></li>
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Cgv;

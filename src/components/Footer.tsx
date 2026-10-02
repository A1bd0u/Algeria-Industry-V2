import type React from 'react';
import { ChevronRight, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { SUPPORT, telHref } from '../config/site';
import { OPEN_COOKIE_SETTINGS_EVENT } from './CookieBanner';
import Logo from './ui/Logo';

const FooterLink = ({ to, children, accent = false }: { to: string; children: React.ReactNode; accent?: boolean }) => (
  <li>
    <Link to={to} className={cn('flex items-center gap-2 transition-colors', accent ? 'text-secondary hover:text-white' : 'hover:text-secondary')}>
      <ChevronRight className="h-3 w-3 shrink-0 rtl:rotate-180" aria-hidden="true" />
      <span>{children}</span>
    </Link>
  </li>
);

const FooterTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-8">
    <div className="w-4 h-[2px] bg-secondary" />
    <h4 className="text-xs font-black uppercase tracking-wider text-white">{children}</h4>
  </div>
);

const Footer = () => {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-[#1a1a1a] text-white pt-20 pb-10 border-t-4 border-secondary relative overflow-hidden", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20">
          <div>
            <Logo className="mb-8" />
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('footer.about_text')}
            </p>
          </div>

          <div>
            <FooterTitle>{t('footer.platform')}</FooterTitle>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              <FooterLink to="/directory">{t('nav.suppliers')}</FooterLink>
              <FooterLink to="/products">{t('nav.products')}</FooterLink>
              <FooterLink to="/catalogues">{t('nav.catalogues')}</FooterLink>
              <FooterLink to="/compare">{t('footer.compare')}</FooterLink>
              <FooterLink to="/tarifs">{t('nav.pricing')}</FooterLink>
              <FooterLink to="/register?role=fournisseur" accent>{t('nav.become_exposant')}</FooterLink>
              <FooterLink to="/ads-request" accent>{t('footer.advertise')}</FooterLink>
            </ul>
          </div>

          <div>
            <FooterTitle>{t('nav.resources')}</FooterTitle>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              <FooterLink to="/resources">{t('footer.resourceCenter')}</FooterLink>
              <FooterLink to="/blog">{t('nav.news')}</FooterLink>
              <FooterLink to="/events">{t('nav.events')}</FooterLink>
              <FooterLink to="/faq">{t('faq.title')}</FooterLink>
            </ul>
          </div>

          <div>
            <FooterTitle>{t('footer.contactTitle')}</FooterTitle>
            <ul className="space-y-5 text-xs font-bold uppercase tracking-wider text-gray-500">
              {SUPPORT.phone && (
                <li className="flex items-center gap-4">
                  <Phone className="h-4 w-4 text-secondary shrink-0" />
                  <a href={telHref(SUPPORT.phone)} dir="ltr" className="font-mono hover:text-secondary">{SUPPORT.phone}</a>
                </li>
              )}
              {SUPPORT.email && (
                <li className="flex items-center gap-4">
                  <Mail className="h-4 w-4 text-secondary shrink-0" />
                  <a href={`mailto:${SUPPORT.email}`} className="lowercase font-mono hover:text-secondary">{SUPPORT.email}</a>
                </li>
              )}
              <li className="flex items-center gap-4">
                <MapPin className="h-4 w-4 text-secondary shrink-0" />
                <Link to="/contact" className="hover:text-secondary">{t('footer.contact')}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
          <p>© {year} Algeria Industry</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/terms" className="hover:text-white transition-colors">{t('footer.legal')}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))} className="hover:text-white transition-colors uppercase">{t('footer.cookies')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

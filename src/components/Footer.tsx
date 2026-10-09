import type React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { SUPPORT, telHref } from '../config/site';
import { OPEN_COOKIE_SETTINGS_EVENT } from './CookieBanner';
import Logo from './ui/Logo';

const FooterLink = ({ to, children, accent = false }: { to: string; children: React.ReactNode; accent?: boolean }) => (
  <li>
    <Link to={to} className={cn('transition-colors', accent ? 'text-secondary hover:text-white' : 'hover:text-white')}>
      {children}
    </Link>
  </li>
);

const FooterTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold text-white mb-4">{children}</h2>
);

const Footer = () => {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-[#1a1a1a] text-white pt-14 pb-8", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Logo className="mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('footer.about_text')}
            </p>
          </div>

          <div>
            <FooterTitle>{t('footer.platform')}</FooterTitle>
            <ul className="space-y-2.5 text-sm text-gray-400">
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
            <ul className="space-y-2.5 text-sm text-gray-400">
              <FooterLink to="/resources">{t('footer.resourceCenter')}</FooterLink>
              <FooterLink to="/blog">{t('nav.news')}</FooterLink>
              <FooterLink to="/events">{t('nav.events')}</FooterLink>
              <FooterLink to="/faq">{t('faq.title')}</FooterLink>
            </ul>
          </div>

          <div>
            <FooterTitle>{t('footer.contactTitle')}</FooterTitle>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {SUPPORT.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-secondary shrink-0" />
                  <a href={telHref(SUPPORT.phone)} dir="ltr" className="font-mono hover:text-secondary">{SUPPORT.phone}</a>
                </li>
              )}
              {SUPPORT.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-secondary shrink-0" />
                  <a href={`mailto:${SUPPORT.email}`} className="lowercase font-mono hover:text-secondary">{SUPPORT.email}</a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-secondary shrink-0" />
                <Link to="/contact" className="hover:text-secondary">{t('footer.contact')}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {year} Industigo</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/terms" className="hover:text-white transition-colors">{t('footer.legal')}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
            <Link to="/cgv" className="hover:text-white transition-colors">{t('footer.cgv')}</Link>
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))} className="hover:text-white transition-colors">{t('footer.cookies')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

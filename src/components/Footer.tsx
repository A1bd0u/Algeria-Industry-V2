import { Building2, Facebook, Linkedin, Mail, MapPin, Phone, ShieldCheck, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Footer = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <footer className={cn("bg-[#1a1a1a] text-white pt-20 pb-10 border-t-4 border-secondary relative overflow-hidden", i18n.language === 'ar' && "font-arabic")}>
      {/* Technical Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-16 mb-20", i18n.language === 'ar' && "md:flex md:flex-row-reverse md:justify-between")}>
          {/* Brand */}
          <div className={cn("col-span-1 md:col-span-1", i18n.language === 'ar' && "text-right")}>
            <div className={cn("flex items-center space-x-3 mb-8", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
              <div className="bg-secondary p-1.5 rounded-sm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-none">ALGERIA</span>
                <span className="text-xl font-black tracking-tighter leading-none text-secondary">INDUSTRY</span>
              </div>
            </div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">
              {t('footer.about_text')}
            </p>
            <div className={cn("flex items-center space-x-2 text-success", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CERTIFIED B2B PLATFORM</span>
            </div>
          </div>

          {/* Links */}
          <div className={i18n.language === 'ar' ? "text-right" : ""}>
            <div className={cn("flex items-center space-x-2 mb-8", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
              <div className="w-4 h-[2px] bg-secondary" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">{i18n.language === 'ar' ? 'التنقل' : 'Navigation'}</h4>
            </div>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <li><Link to="/exhibitors" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{i18n.language === 'ar' ? 'العارضين' : 'Exposants'}</span></Link></li>
              <li><Link to="/products" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{t('nav.products')}</span></Link></li>
              <li><Link to="/tarifs" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{i18n.language === 'ar' ? 'الأسعار' : 'Tarifs'}</span></Link></li>
              <li><Link to="/compare" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{i18n.language === 'ar' ? 'مقارنة الحلول' : 'Comparer Solutions'}</span></Link></li>
              <li><Link to="/become-exhibitor" className={cn("text-secondary hover:text-white transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{t('topbar.become_exhibitor')}</span></Link></li>
              <li><Link to="/ads-request" className={cn("text-secondary hover:text-white transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{i18n.language === 'ar' ? 'مساحة إعلانية' : 'Espace Pub'}</span></Link></li>
              <li className="pt-4 mt-4 border-t border-white/10"><Link to="/extranet" className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-all">{t('nav.console_pro')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className={i18n.language === 'ar' ? "text-right" : ""}>
            <div className={cn("flex items-center space-x-2 mb-8", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
              <div className="w-4 h-[2px] bg-secondary" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">{t('nav.resources')}</h4>
            </div>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <li><Link to="/resources" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{i18n.language === 'ar' ? 'مركز التوثيق' : 'Centre de documentation'}</span></Link></li>
              <li><Link to="/faq" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>F.A.Q</span></Link></li>
              <li><Link to="/blog" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{t('nav.news')}</span></Link></li>
              <li><Link to="/contact" className={cn("hover:text-secondary transition-colors flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}><span>{i18n.language === 'ar' ? '<' : '>'}</span> <span>{t('footer.contact')}</span></Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={i18n.language === 'ar' ? "text-right" : ""}>
            <div className={cn("flex items-center space-x-2 mb-8", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
              <div className="w-4 h-[2px] bg-secondary" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">{i18n.language === 'ar' ? 'مركز الاتصال' : 'Contact Center'}</h4>
            </div>
            <ul className="space-y-5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <li className={cn("flex items-start space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                <MapPin className="h-4 w-4 text-secondary mt-0.5" />
                <span className="leading-relaxed">{i18n.language === 'ar' ? 'الجزائر العاصمة، الجزائر' : 'ALGER, ALGÉRIE'}<br/>{i18n.language === 'ar' ? 'المنطقة الصناعية الرويبة' : 'ZONE INDUSTRIELLE ROUIBA'}</span>
              </li>
              <li className={cn("flex items-center space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                <Phone className="h-4 w-4 text-secondary" />
                <span className="font-mono">+213 (0) 21 XX XX XX</span>
              </li>
              <li className={cn("flex items-center space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                <Mail className="h-4 w-4 text-secondary" />
                <span className="lowercase font-mono">contact@algeria-industry.dz</span>
              </li>
            </ul>
            <div className={cn("flex space-x-3 mt-10", i18n.language === 'ar' && "space-x-reverse justify-end")}>
              {[Linkedin, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" onClick={(e) => e.preventDefault()} className="bg-white/5 p-2.5 border border-white/10 hover:bg-secondary hover:border-secondary transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500", i18n.language === 'ar' && "md:flex-row-reverse")}>
          <div className={cn("flex items-center space-x-4", i18n.language === 'ar' && "space-x-reverse")}>
            <p>{t('footer.copyright')}</p>
            <span className="text-white/10">|</span>
            <p>BUILD VERSION: 2.5.0-STABLE</p>
          </div>
          <div className={cn("flex space-x-8 mt-6 md:mt-0", i18n.language === 'ar' && "space-x-reverse")}>
            <Link to="/terms" className="hover:text-white transition-colors">{i18n.language === 'ar' ? 'إشعارات قانونية' : 'Mentions légales'}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{i18n.language === 'ar' ? 'الخصوصية' : 'Confidentialité'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

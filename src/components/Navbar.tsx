import { Award, BookOpen, ChevronDown, ChevronRight, Component, FileText, Globe, HardHat, Library, LogOut, Menu, Newspaper, Package, Search, Settings, ShieldCheck, Truck, UserCircle, Wrench, X, Zap, Beaker, Pill, Recycle, Shirt, Cpu, Car, Leaf } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { cn } from '../lib/utils';
import SearchModal from './SearchModal';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const profileMenuItems = [
    { label: t('nav.my_profile'), path: '/dashboard', icon: UserCircle },
    { label: t('nav.subscription'), path: '/subscriptions', icon: Award },
    { label: t('nav.favorites'), path: '/favorites', icon: Zap },
    { label: t('nav.requests'), path: '/dashboard?tab=orders', icon: FileText },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/gb.png' },
    { code: 'ar', name: 'العربية', flag: 'https://flagcdn.com/w20/dz.png' }
  ];

  const currentLang = languages.find(l => i18n.language?.startsWith(l.code)) || languages[0];

  const navItems = [
    { name: t('nav.products'), path: '/products', hasMega: true, icon: Package },
    { name: i18n.language === 'ar' ? 'العارضين' : 'Exposants', path: '/exhibitors', icon: BookOpen },
    { name: t('nav.news'), path: '/blog', icon: Newspaper },
    { name: t('nav.resources'), path: '/resources', icon: Library },
    { name: i18n.language === 'ar' ? 'الأسعار' : 'Tarifs', path: '/tarifs', icon: Award },
  ];

  const categories = [
    { name: t('categories.agrifood'), val: 'Agroalimentaire', icon: Package },
    { name: t('categories.btph'), val: 'BTPH', icon: HardHat },
    { name: t('categories.chemistry'), val: 'Chimie & Pétrochimie', icon: Beaker },
    { name: t('categories.energy'), val: 'Énergie & Mines', icon: Zap },
    { name: t('categories.pharma'), val: 'Industrie Pharmaceutique', icon: Pill },
    { name: t('categories.metallurgy'), val: 'Métallurgie & Mécanique', icon: Wrench },
    { name: t('categories.plastics'), val: 'Plasturgie & Caoutchouc', icon: Recycle },
    { name: t('categories.textile'), val: 'Textile & Cuir', icon: Shirt },
    { name: t('categories.electronics'), val: 'Électronique & Électroménager', icon: Cpu },
    { name: t('categories.auto'), val: 'Automobile & Transport', icon: Car },
    { name: t('categories.renewable'), val: 'Énergies Renouvelables', icon: Leaf },
  ];

  return (
    <nav className={cn("bg-[#1a1a1a] text-white sticky top-0 z-50 border-b border-white/[0.05] shadow-2xl", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn("flex justify-between h-24 items-center gap-4 lg:gap-6", i18n.language === 'ar' && "flex-row-reverse")}>
          <div className={cn("flex items-center space-x-4 lg:space-x-6", i18n.language === 'ar' && "space-x-reverse")}>
            {/* Logo */}
            <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-3 group min-w-max">
              <div className="w-11 h-11 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-lg">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div className={cn("hidden lg:block", i18n.language === 'ar' && "text-end")}>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20 leading-none">ALGERIA</span>
                <p className="text-base font-black uppercase tracking-tight text-white leading-none mt-0.5 group-hover:text-secondary transition-colors">INDUSTRY</p>
              </div>
            </Link>

            {/* Search Bar - Re-added and polished */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "hidden xl:flex items-center space-x-3 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all w-48 2xl:w-[280px] group/search shrink-0",
                i18n.language === 'ar' && "flex-row-reverse space-x-reverse"
              )}
            >
              <Search className="h-3.5 w-3.5 text-white/20 group-hover/search:text-secondary transition-colors" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">RECHERCHER...</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className={cn("hidden lg:flex items-center space-x-0.5", i18n.language === 'ar' && "space-x-reverse")}>
            {navItems.map((item) => (
              <div 
                key={item.path}
                className="relative h-14 flex items-center"
                onMouseEnter={() => item.hasMega && setShowMegaMenu(true)}
                onMouseLeave={() => item.hasMega && setShowMegaMenu(false)}
              >
                <Link
                  to={item.path}
                  className={cn(
                    "px-2.5 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] transition-all duration-300 flex items-center space-x-2 uppercase group relative",
                    location.pathname === item.path 
                      ? "bg-white text-[#1a1a1a] shadow-lg" 
                      : "bg-white/[0.05] text-white/90 hover:bg-white/[0.1] hover:text-white border border-white/5",
                    i18n.language === 'ar' && "font-bold tracking-normal text-xs"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-all duration-500 group-hover:scale-125", location.pathname === item.path ? "text-[#1a1a1a] scale-110" : "text-secondary/60 group-hover:text-secondary")} />
                  <span className="relative z-10 uppercase">{item.name}</span>
                  {item.hasMega && <ChevronDown className={cn("h-3 w-3 transition-transform duration-300 ms-1", location.pathname === item.path ? "text-[#1a1a1a]" : "group-hover:text-secondary", showMegaMenu && "rotate-180")} />}
                </Link>


                {/* Mega Menu */}
                <AnimatePresence>
                  {item.hasMega && showMegaMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "absolute top-full w-[400px] bg-[#222] text-white shadow-2xl border border-white/10 overflow-hidden rounded-2xl mt-2",
                        i18n.language === 'ar' ? "end-0" : "start-0"
                      )}
                    >
                      <div className="p-2">
                        <div className={cn("px-4 py-2 mb-1", i18n.language === 'ar' && "text-end")}>
                           <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{t('nav.browse_industries')}</p>
                        </div>
                        <div className="grid grid-cols-1">
                            {categories.map((cat, idx) => (
                              <Link
                                key={idx}
                                to={`/products?category=${encodeURIComponent(cat.val)}`}
                                onClick={() => setShowMegaMenu(false)}
                                className={cn(
                                  "flex items-center justify-between px-5 py-3 hover:bg-white/5 rounded-xl transition-colors group",
                                  i18n.language === 'ar' && "flex-row-reverse"
                                )}
                              >
                                <div className={cn("flex items-center space-x-3", i18n.language === 'ar' && "space-x-reverse")}>
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                                    <cat.icon className="h-4 w-4 text-white/20 group-hover:text-secondary" />
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-bold text-white/60 group-hover:text-secondary uppercase tracking-wider",
                                    i18n.language === 'ar' && "text-sm"
                                  )}>{cat.name}</span>
                                </div>
                                <ChevronRight className={cn(
                                  "h-3 w-3 text-white/10 group-hover:text-secondary transition-transform",
                                  i18n.language === 'ar' ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"
                                )} />
                              </Link>
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="h-8 w-[1px] bg-white/5 mx-2 hidden lg:block" />

            {/* Become Exhibitor Button */}
            <Link 
              to="/become-exhibitor" 
              className="relative group px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center space-x-2 bg-secondary text-white hover:bg-secondary/90 shadow-lg shrink-0"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className={cn(i18n.language === 'ar' && "text-xs font-bold")}>{t('nav.become_exposant')}</span>
            </Link>

            <div className="flex items-center space-x-2 ms-1 ps-1 border-l border-white/5 shrink-0">
              {/* Language Selector */}
              <div 
                className="relative group/lang py-2"
                onMouseLeave={() => setShowLang(false)}
              >
                <button 
                  onClick={() => setShowLang(!showLang)}
                  className="flex items-center space-x-2 transition-all text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white cursor-pointer"
                >
                  <img src={currentLang.flag} alt={currentLang.code} className="w-4 h-auto rounded-[2px] opacity-60 group-hover/lang:opacity-100 transition-opacity" />
                  <span className="text-[9px] hidden xl:inline">{currentLang.name.substring(0, 3)}</span>
                  <ChevronDown className={cn("h-3 w-3 text-secondary/40 group-hover/lang:text-secondary transition-all", showLang && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showLang && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full end-0 mt-1 bg-[#222] border border-white/10 shadow-2xl min-w-[140px] rounded-xl overflow-hidden z-[60]"
                    >
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { 
                            i18n.changeLanguage(lang.code); 
                            setShowLang(false); 
                          }}
                          className={cn(
                            "flex items-center space-x-3 w-full px-4 py-3 hover:bg-white/5 text-[9px] font-bold uppercase transition-colors",
                            i18n.language === lang.code ? "text-secondary bg-white/5" : "text-white/60"
                          )}
                        >
                          <img src={lang.flag} alt={lang.code} className="w-4 h-auto rounded-sm" />
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Link with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-secondary/10 hover:border-secondary/20 hover:text-secondary transition-all group/profile ms-2"
                >
                  <UserCircle className={cn("h-5 w-5 transition-colors", isProfileOpen ? "text-secondary" : "text-white/40 group-hover/profile:text-secondary")} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "absolute top-full mt-4 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-50",
                        i18n.language === 'ar' ? "start-0" : "end-0"
                      )}
                    >
                      <div className="p-4 mb-2 bg-white/5 rounded-xl border border-white/5">
                        {isAuthenticated ? (
                          <>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{user?.name}</p>
                            <p className="text-[9px] text-white/40 font-bold uppercase truncate">{user?.company}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{i18n.language === 'ar' ? 'مساحة العمل' : 'Espace Industriel'}</p>
                            <p className="text-[9px] text-white/40 font-bold uppercase">{i18n.language === 'ar' ? 'إدارة نشاطك الصناعي' : 'Gérez votre activité'}</p>
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {profileMenuItems.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.path}
                            className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-xs font-bold text-white/80 hover:text-white transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="h-4 w-4 text-white/20 group-hover:text-secondary transition-colors" />
                              <span className={cn(i18n.language === 'ar' && "me-3 ms-0")}>{item.label}</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-white/5 group-hover:text-secondary transition-all group-hover:translate-x-1" />
                          </Link>
                        ))}
                      </div>

                      <div className="mt-2 p-2 bg-gradient-to-t from-white/[0.02] to-transparent rounded-xl border-t border-white/5">
                        {!isAuthenticated ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              to="/login"
                              className="flex items-center justify-center py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-secondary uppercase tracking-widest transition-all"
                            >
                              {i18n.language === 'ar' ? 'دخول' : 'Connexion'}
                            </Link>
                            <Link
                              to="/register"
                              className="flex items-center justify-center py-3 rounded-xl bg-secondary text-white hover:bg-secondary/90 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                            >
                              {i18n.language === 'ar' ? 'تسجيل' : 'Inscription'}
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-3 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest transition-all group/logout"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{t('nav.logout')}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-secondary focus:outline-none p-2 bg-white/5 rounded-lg"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#111] border-t border-white/5"
          >
            <div className="px-4 pt-4 pb-12 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    location.pathname === item.path ? "bg-white text-primary" : "text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/become-exhibitor"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-4 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-secondary text-white shadow-xl"
                >
                  <Zap className="h-4 w-4" />
                  <span>{t('nav.become_exposant')}</span>
                </Link>

                <div className="bg-white/5 rounded-[24px] p-3 border border-white/5 shadow-2xl">
                  <div className="p-3 mb-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{i18n.language === 'ar' ? 'مساحة العمل' : 'Espace Membre'}</span>
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {profileMenuItems.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-[9px] font-black uppercase tracking-wider text-white transition-all border border-white/5 active:scale-95"
                      >
                        <item.icon className="h-6 w-6 text-secondary mb-3 opacity-80" />
                        <span className="text-center leading-tight opacity-60">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-4 bg-white/5 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-secondary border border-white/5"
                    >
                      {i18n.language === 'ar' ? 'دخول' : 'Connexion'}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-4 bg-secondary rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
                    >
                      {i18n.language === 'ar' ? 'تسجيل' : 'Inscription'}
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between px-4">
                 <div className="flex space-x-4">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          i18n.language === lang.code ? "bg-secondary text-white" : "bg-white/5 text-white/40"
                        )}
                      >
                        <span className="text-[10px] font-black">{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                 </div>
                 <div className="flex space-x-2">
                    {['DZD', 'EUR', 'USD'].map(curr => (
                      <button
                        key={curr}
                        onClick={() => { setCurrency(curr as any); setIsOpen(false); }}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                          currency === curr ? "bg-white/10 text-secondary" : "text-white/40"
                        )}
                      >
                        {curr}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;


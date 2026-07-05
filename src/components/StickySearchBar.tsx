import { Camera, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import SearchModal from './SearchModal';

const StickySearchBar = () => {
  const { t, i18n } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="sticky top-24 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex items-center space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
            <div className="flex-1 relative group">
              <div className={cn(
                "absolute inset-y-0 flex items-center pointer-events-none text-gray-400 group-focus-within:text-secondary transition-colors",
                i18n.language === 'ar' ? "end-0 pe-6" : "start-0 ps-6"
              )}>
                <Search className="h-5 w-5" />
              </div>
              <button
                onClick={() => setIsSearchOpen(true)}
                className={cn(
                  "w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 text-sm font-medium text-gray-400 hover:bg-white hover:border-secondary/30 hover:shadow-lg transition-all text-start",
                  i18n.language === 'ar' ? "pe-14 ps-32 text-end" : "ps-14 pe-32 text-start"
                )}
              >
                <span className="hidden sm:inline">{t('hero.search_placeholder')}</span>
                <span className="sm:hidden">{t('hero.search_btn')}...</span>
              </button>
              
              <div className={cn(
                "absolute inset-y-0 flex items-center space-x-2",
                i18n.language === 'ar' ? "start-0 ps-2 space-x-reverse" : "end-0 pe-2"
              )}>
                 <button className="p-2 text-gray-300 hover:text-secondary transition-colors" title="Recherche par image" onClick={(e) => { e.preventDefault(); const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.click(); }}>
                    <Camera className="h-5 w-5" />
                 </button>
                 <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="bg-secondary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg"
                 >
                    {t('hero.search_btn')}
                 </button>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-6">
               <div className={cn("flex items-center space-x-2 border-gray-200", i18n.language === 'ar' ? "border-r pe-6" : "border-l ps-6")}>
                 <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                    {i18n.language === 'ar' ? '١٢.٥ ألف منتج عبر الإنترنت' : '12.5k Produits en ligne'}
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default StickySearchBar;

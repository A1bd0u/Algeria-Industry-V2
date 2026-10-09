import { ChevronDown, ChevronUp, Columns, GitCompare, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { moreToCompareHref, useComparison } from '../context/ComparisonContext';
import { useTranslation } from 'react-i18next';

const ComparisonBar = () => {
  const { comparedProducts, removeFromCompare, clearCompare } = useComparison();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  // Barre fermée pour la sélection en cours : elle revient dès que la sélection
  // change (produit ajouté ou retiré). La sélection, elle, est conservée.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const { pathname } = useLocation();
  const selectionKey = comparedProducts.map((p) => p.id).join(',');

  // Sur la page de comparaison, la barre ferait doublon et masquerait le tableau.
  if (comparedProducts.length === 0 || pathname === '/compare' || closedFor === selectionKey) return null;

  const close = () => {
    setIsExpanded(false);
    setClosedFor(selectionKey);
  };
  // Choisir d'autres produits : catalogue du secteur du premier produit comparé.
  const moreHref = moreToCompareHref(comparedProducts[0]?.category);

  return (
    <div className="fixed bottom-20 lg:bottom-24 start-1/2 -translate-x-1/2 z-[9999] w-full max-w-4xl px-4">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center space-x-3">
                <Columns className="h-6 w-6 text-secondary" />
                <h3 className="font-black tracking-widest text-sm">{t('compare.title')}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsExpanded(false)}
                  aria-label={t('compare.collapse')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
                <button
                  onClick={close}
                  aria-label={t('compare.closeBar')}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-x-auto no-scrollbar">
              <div className="flex space-x-6 min-w-max">
                {comparedProducts.map((product) => (
                  <div key={product.id} className="w-64 flex flex-col">
                    <div className="relative group mb-6">
                      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-4">
                        <img src={product.image} alt={product.name} className="max-h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <button 
                        onClick={() => removeFromCompare(product.id)}
                        aria-label={t('compare.remove')}
                        className="absolute -top-2 -end-2 bg-white text-error p-1.5 rounded-full shadow-lg hover:scale-110 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-6">
                      <p className="text-xs font-black text-secondary uppercase tracking-widest mb-1">{product.brand}</p>
                      <h4 className="text-sm font-bold text-primary line-clamp-2 h-10 leading-tight">{product.name}</h4>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="border-b border-gray-50 pb-2">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-tight mb-0.5">{key}</p>
                          <p className="text-xs text-primary font-bold">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {comparedProducts.length < 4 && (
                  <Link
                    to={moreHref}
                    onClick={() => setIsExpanded(false)}
                    className="w-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-8 hover:border-secondary hover:text-secondary transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-center">{t('compare.addAnother')}</p>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button 
                onClick={clearCompare}
                className="text-xs font-black text-gray-500 hover:text-error uppercase tracking-wider transition-colors"
              >
                {t('compare.clear')}
              </button>
              <Link to="/compare" className="btn-primary px-8 py-3 rounded-2xl flex items-center space-x-3 group">
                <span className="text-xs font-black uppercase tracking-widest">{t('compare.requestQuote')}</span>
                <ChevronUp className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
          <motion.button
            layoutId="compare-bar"
            onClick={() => setIsExpanded(true)}
            className="bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-6 border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center space-x-3 pe-4 border-r border-white/10">
              <div className="relative">
                <GitCompare className="h-6 w-6 text-secondary" />
                <span className="absolute -top-2 -end-2 bg-secondary text-white text-xs font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary">
                  {comparedProducts.length}
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider">{t('compare.open')}</span>
            </div>
            
            <div className="flex -space-x-3 overflow-hidden">
              {comparedProducts.map((product) => (
                <div key={product.id} className="w-10 h-10 rounded-xl bg-white p-1.5 border-2 border-primary overflow-hidden">
                  <img src={product.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            
            <ChevronUp className="h-5 w-5 text-gray-500 animate-bounce" />
          </motion.button>
          <button
            type="button"
            onClick={close}
            aria-label={t('compare.closeBar')}
            title={t('compare.closeBar')}
            className="h-10 w-10 shrink-0 rounded-full bg-primary text-white shadow-2xl border border-white/10 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonBar;

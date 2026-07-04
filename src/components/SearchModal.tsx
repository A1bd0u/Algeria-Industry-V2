import { ArrowRight, Building2, FileText, Package, Search, TrendingUp, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'product' | 'company' | 'tender';
  title: string;
  subtitle: string;
  category: string;
}

const SearchModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results: SearchResult[] = ([
    { id: '1', type: 'product', title: 'Pompe Hydraulique P3', subtitle: 'Global Industry', category: 'Hydraulique' },
    { id: '2', type: 'company', title: 'Sonatrach', subtitle: 'Alger, Algérie', category: 'Énergie' },
  ] as const).filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) || 
    r.subtitle.toLowerCase().includes(query.toLowerCase())
  ) as SearchResult[];

  const getIcon = (type: string) => {
    switch(type) {
      case 'product': return Package;
      case 'company': return Building2;
      default: return Search;
    }
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
    switch(result.type) {
      case 'product': navigate(`/products/${result.id}`); break;
      case 'company': navigate(`/directory/${result.id}`); break;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10"
          >
            <form onSubmit={handleSearchSubmit} className="p-6 border-b border-gray-100 flex items-center space-x-4">
              <Search className="h-6 w-6 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Rechercher un produit ou une entreprise..." 
                className="flex-1 bg-transparent border-none outline-none text-lg text-primary font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </form>

            <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {query.length === 0 ? (
                <div className="py-8 px-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-2">Recherches Populaires</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Pompes Industrielles', 'Solaire Algérie', 'Maintenance', 'Tuyauterie'].map((term) => (
                      <button 
                        key={term}
                        onClick={() => setQuery(term)}
                        className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left group"
                      >
                        <TrendingUp className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-bold text-primary group-hover:text-secondary">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-4">Résultats ({results.length})</p>
                   {results.map((result) => {
                     const Icon = getIcon(result.type);
                     return (
                       <button 
                         key={result.id}
                         onClick={() => handleSelect(result)}
                         className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-primary/5 transition-all text-left group"
                       >
                         <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-white transition-colors">
                            <Icon className="h-5 w-5 text-primary" />
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center space-x-2">
                               <span className="text-[8px] font-black uppercase tracking-widest text-secondary">{result.type}</span>
                               <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">•</span>
                               <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{result.category}</span>
                            </div>
                            <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">{result.title}</p>
                            <p className="text-xs text-gray-500">{result.subtitle}</p>
                         </div>
                         <ArrowRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-secondary transition-all" />
                       </button>
                     );
                   })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun résultat pour "{query}"</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                   <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-400">ESC</kbd>
                   <span className="text-[10px] text-gray-400 font-bold uppercase">Quitter</span>
                </div>
                <div className="flex items-center space-x-1">
                   <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-400">↵</kbd>
                   <span className="text-[10px] text-gray-400 font-bold uppercase">Sélectionner</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Algeria Industry Search v2.0</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;

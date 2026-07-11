import {
  ArrowLeft,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';
import { cn } from '../lib/utils';

const Compare = () => {
  const { items, removeItem, clearComparison } = useComparison();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-bg pt-40 pb-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
          <Scale className="h-10 w-10 text-gray-200" />
        </div>
        <h2 className="text-3xl font-black text-primary uppercase tracking-tighter mb-4">Comparaison vide</h2>
        <p className="text-gray-400 font-medium max-w-xs mb-8 uppercase text-[10px] tracking-widest">
          Ajoutez des produits au comparateur pour voir les différences techniques.
        </p>
        <Link to="/products" className="btn-primary px-12 py-4 rounded-xl text-xs font-black uppercase tracking-widest">
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="text-[10px] font-black uppercase tracking-widest">Continuer le sourcing</span>
            </button>
            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter italic">
              Comparer les <span className="text-secondary">Solutions</span>
            </h1>
          </div>
          <button 
            onClick={clearComparison}
            className="flex items-center space-x-2 text-red-500 hover:text-red-600 font-black text-[10px] uppercase tracking-widest px-6 py-3 bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="h-4 w-4" />
            <span>Tout Vider</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 shadow-2xl overflow-x-auto no-scrollbar rounded-[32px]">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="p-8 text-start bg-gray-50/50 w-64 shrink-0">
                  <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">Spécifications</span>
                </th>
                {items.map((product) => (
                  <th key={product.id} className="p-8 text-start relative min-w-[280px]">
                    <button 
                      onClick={() => removeItem(product.id)}
                      className="absolute top-4 end-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 mb-6 border border-gray-100">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">{product.brand}</p>
                    <h3 className="text-primary font-black uppercase tracking-tighter leading-tight mb-4">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-black text-primary uppercase">{product.price}</span>
                      <button className="p-3 bg-primary text-white rounded-xl hover:bg-secondary transition-all shadow-lg" onClick={(e) => { e.preventDefault(); window.print(); }}>
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { label: 'Origine', key: 'origin' },
                { label: 'Disponibilité', key: 'availability' },
                { label: 'Garantie', key: 'warranty' },
                { label: 'État', key: 'condition' },
                { label: 'Vérification', key: 'verified' },
                { label: 'Livraison', key: 'delivery' }
              ].map((spec, i) => (
                <tr key={i} className="border-b border-gray-50 group hover:bg-gray-50/30 transition-colors">
                  <td className="p-8 bg-gray-50/30 font-black text-primary text-[10px] uppercase tracking-widest">
                    {spec.label}
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-8 font-medium text-gray-500 uppercase text-[11px] tracking-wider">
                      {spec.key === 'verified' ? (
                        <div className="flex items-center text-emerald-500 font-black">
                          <ShieldCheck className="h-4 w-4 me-2" />
                          <span>OUI</span>
                        </div>
                      ) : (
                        product[spec.key as keyof typeof product] || 'Standard'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Bottom */}
        <div className="mt-20 bg-primary p-12 text-white text-center rounded-[48px] relative overflow-hidden">
          <div className="absolute top-0 start-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 10px)', backgroundSize: '20px 20px' }} />
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 relative z-10">Optimisez votre Par Industriel</h2>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] mb-10 text-xs relative z-10">Demandez un devis groupé pour ces configurations</p>
          <button className="bg-secondary px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all relative z-10" onClick={(e) => { e.preventDefault(); alert("Vos demandes de devis ont été envoyées aux fournisseurs."); }}>
            Devis Comparatif Express
          </button>
        </div>
      </div>
    </div>
  );
};

export default Compare;

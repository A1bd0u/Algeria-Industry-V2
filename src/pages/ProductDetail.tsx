import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  GitCompare,
  Globe,
  Heart,
  Layers,
  MessageSquare,
  Share2,
  ShieldCheck,
  Star,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { Product as IProduct, useComparison } from '../context/ComparisonContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { cn, extractIdFromSlug } from '../lib/utils';

const ProductDetail = () => {
  const [activeTab, setActiveTab] = React.useState('description');
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { comparedProducts, addToCompare, removeFromCompare } = useComparison();
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleReport = async () => {
    if (!isAuthenticated) {
       alert("Vous devez être connecté pour signaler un produit.");
       return;
    }
    if (!reportReason.trim()) {
       alert("Veuillez saisir un motif");
       return;
    }
    try {
      const res = await fetch(`/api/products/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        alert("Le produit a été signalé avec succès. Merci.");
        setShowReport(false);
        setReportReason("");
      } else {
        alert("Erreur lors du signalement");
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          setIsFavorite(data.some((f: any) => f.item_id === id));
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        // We'll mock the rest since there's no /api/products/:id explicitly defined
        const res = await fetch('/api/products');
        if (res.ok) {
           const data = await res.json();
           const p = data.find((p: any) => p.id === id);
           if (p) {
             setProduct({
               id: p.id,
               name: p.name,
               category: p.category || p.cat || 'Équipement',
               brand: p.brand || p.owner_id || 'Entreprise',
               company: p.brand || p.owner_id || "Algeria Systems",
               price: typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '') || '0') : (p.price || 850000),
               rating: 4.8,
               reviews: 24,
               stock: 'En Stock',
               image: p.file_url || p.image || `https://picsum.photos/seed/${p.id}/800/800`,
               images: [p.file_url || p.image || `https://picsum.photos/seed/${p.id}/800/800`, `https://picsum.photos/seed/${p.id}-2/800/800`, `https://picsum.photos/seed/${p.id}-3/800/800`],
               description: p.description || "Un équipement de haute performance...",
               features: p.features || ['Précision', 'Fiabilité', 'Facile à intégrer'],
               specs: {
                 'Catégorie': p.category || p.cat || 'Standard',
                 'Région': p.region || 'Alger'
               }
             });
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    fetchFavoriteStatus();
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await fetch(`/api/favorites/item/${id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: 'product', item_id: id })
        });
        if (res.ok) {
          setIsFavorite(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isCompared = product && comparedProducts.find(p => p.id === product.id);

  const toggleCompare = () => {
    if (!product) return;
    if (isCompared) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product as unknown as IProduct);
    }
  };

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs / Back */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Retour au catalogue</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm relative group">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-contain p-12"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 right-6 flex flex-col space-y-3">
                <button 
                  className={cn(
                    "bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg transition-colors",
                    isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  )} 
                  onClick={(e) => { e.preventDefault(); toggleFavorite(); }}
                >
                  <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                </button>
                <button className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-gray-400 hover:text-primary transition-colors" onClick={(e) => { 
                  e.preventDefault(); 
                  if (navigator.share) {
                    navigator.share({ title: document.title, url: window.location.href }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Lien copié dans le presse-papier !");
                  }
                }}>
                  <Share2 className="h-5 w-5" />
                </button>
                <button onClick={() => setShowReport(true)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 hover:border-red-200 transition-all group relative">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Signaler</span>
                </button>

              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "aspect-square rounded-2xl border-2 overflow-hidden bg-white transition-all",
                    activeImage === i ? "border-secondary scale-95 shadow-inner" : "border-gray-100 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover p-2" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="tech-label">{product.category}</span>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold text-primary">{product.rating}</span>
                  <span className="text-gray-400 text-xs">({product.reviews} avis)</span>
                </div>
              </div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-tight mb-2">
                {product.name}
              </h1>
              <p className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Fabricant : {product.company}</span>
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cotation actuelle</p>
                  <p className="text-4xl font-mono font-black text-primary tracking-tighter">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-success/10 text-success text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {product.stock}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Référence : XP-2026-DZ</p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/contact?subject=${encodeURIComponent('Devis pour ' + product.name)}`)}
                  className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center space-x-3 text-lg group"
                >
                  <FileText className="h-6 w-6" />
                  <span>DEMANDER UN DEVIS PROFESSIONNEL</span>
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={toggleCompare}
                    className={cn(
                      "flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all border",
                      isCompared 
                        ? "bg-secondary/10 border-secondary text-secondary" 
                        : "bg-neutral-bg text-primary border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <GitCompare className="h-5 w-5" />
                    <span>{isCompared ? "Comparé" : "Comparer"}</span>
                  </button>
                  <button className="bg-neutral-bg text-primary py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-gray-100 transition-all border border-gray-100" onClick={(e) => { 
                    e.preventDefault(); 
                    window.location.href = `mailto:contact@${product.company.toLowerCase().replace(/ /g, '')}.com?subject=Contact à propos de ${product.name}`;
                  }}>
                    <MessageSquare className="h-5 w-5" />
                    <span>Contact Direct</span>
                  </button>
                  <button 
                    onClick={toggleCompare}
                    className={cn(
                      "py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border",
                      isCompared 
                        ? "bg-secondary text-white border-secondary shadow-lg" 
                        : "bg-neutral-bg text-primary border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <Layers className="h-5 w-5" />
                    <span>{isCompared ? "Comparé" : "Comparer"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garantie</p>
                  <p className="text-sm font-bold text-primary">5 Ans Constructeur</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Livraison</p>
                  <p className="text-sm font-bold text-primary">Sur toute l'Algérie</p>
                </div>
              </div>
            </div>

            {/* Tabs for detailed content */}
            <div className="space-y-6">
              <div className="flex space-x-8 border-b border-gray-200">
                <button className={`pb-4 border-b-2 ${activeTab === 'description' ? 'border-secondary text-primary' : 'border-transparent text-gray-400 hover:text-primary'} text-sm font-black uppercase tracking-widest transition-all`} onClick={() => setActiveTab('description')}>Description</button>
                <button className={`pb-4 border-b-2 ${activeTab === 'specs' ? 'border-secondary text-primary' : 'border-transparent text-gray-400 hover:text-primary'} text-sm font-black uppercase tracking-widest transition-all`} onClick={() => setActiveTab('specs')}>Spécifications</button>
                <button className={`pb-4 border-b-2 ${activeTab === 'downloads' ? 'border-secondary text-primary' : 'border-transparent text-gray-400 hover:text-primary'} text-sm font-black uppercase tracking-widest transition-all`} onClick={() => setActiveTab('downloads')}>Téléchargements</button>
              </div>
              
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p>Description détaillée du produit {product.name} par {product.company}. Conçu pour les professionnels exigeants, ce produit offre une fiabilité exceptionnelle et des performances de pointe dans son domaine d'application.</p>
                </div>
              )}
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(product.specs).map(([key, val], i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</span>
                      <span className="text-sm font-bold text-primary">{val as string}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'downloads' && (
                <div className="space-y-3">
                  <button onClick={() => {
                     const a = document.createElement('a');
                     a.href = URL.createObjectURL(new Blob(['Fiche PDF'], {type: 'application/pdf'}));
                     a.download = `fiche_${product.name.toLowerCase().replace(/ /g, '_')}.pdf`;
                     a.click();
                  }} className="flex items-center space-x-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left w-full">
                     <span className="bg-primary/5 p-2 rounded-lg text-primary">📄</span>
                     <div>
                       <p className="text-sm font-bold text-primary">Manuel d'utilisation</p>
                       <p className="text-[10px] text-gray-400 uppercase tracking-widest">PDF - 2.4 MB</p>
                     </div>
                  </button>
                </div>
              )}
            </div>
  
          </div>
        </div>
      </div>
    
      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary mb-2 flex items-center"><AlertTriangle className="h-5 w-5 text-red-500 mr-2" /> Signaler un contenu inapproprié</h3>
            <p className="text-sm text-gray-500 mb-6">Aidez-nous à garder Algiers Industry sûr. Pourquoi signalez-vous ce produit ?</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex: Contrefaçon, contenu trompeur, images inappropriées..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm outline-none transition-all resize-none h-32 mb-6"
            ></textarea>
            <div className="flex space-x-3">
              <button onClick={() => setShowReport(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handleReport} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">Envoyer le signalement</button>
            </div>
          </div>
        </div>
      )}

</div>
  );
};

export default ProductDetail;

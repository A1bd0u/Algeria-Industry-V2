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
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { Product as IProduct, useComparison } from '../context/ComparisonContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { cn, extractIdFromSlug, generateSlugUrl } from '../lib/utils';
import axios from 'axios';
import { categoryLabel } from '../data/productCategories';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../lib/apiError';

const ProductDetail = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('description');
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { comparedProducts, addToCompare, removeFromCompare } = useComparison();
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleReport = async () => {
    if (!isAuthenticated) {
       toast.info(t('products.detail.reportLogin'));
       return;
    }
    if (!reportReason.trim()) {
       toast.error(t('products.detail.reportReasonRequired'));
       return;
    }
    try {
      await axios.post(`/api/products/${id}/report`, { reason: reportReason });
      toast.success(t('products.detail.reportSent'));
      setShowReport(false);
      setReportReason("");
    } catch (e: any) {
      toast.error(e?.response ? apiErrorMessage(e.response.data, 'products.detail.reportError') : t('common.networkError'));
    }
  };

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await axios.get('/api/favorites');
        if (res.status === 200) {
          const fav = res.data.find((f: any) => f.item_id === id);
          if (fav) setFavoriteId(fav.id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data.product);
        setSimilarProducts(res.data.similar || []);
      } catch (err: any) {
        console.error(err);
        if (err.response && err.response.status === 404) {
          setError('notFound');
        } else {
          setError('loadError');
        }
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
      if (favoriteId) {
        await axios.delete(`/api/favorites/${favoriteId}`);
        setFavoriteId(null);
      } else {
        const res = await axios.post('/api/favorites', {
          item_type: 'product',
          item_id: id
        });
        if (res.status === 200 || res.status === 201) {
          setFavoriteId(res.data.id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(t('products.detail.favoriteError'));
    }
  };

  const isCompared = product && comparedProducts.find(p => p.id === product.id);

  const toggleCompare = () => {
    if (!product) return;
    if (isCompared) {
      removeFromCompare(product.id);
    } else {
      if (comparedProducts.length >= 4) {
        toast.info(t('products.detail.compareFull'));
        return;
      }
      addToCompare({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.companyName || '',
        image: product.images?.[0] || '',
        priceValue: product.priceValue || null,
        sellerId: product.sellerId || null,
        companyVerified: Boolean(product.companyVerified),
        specs: product.specs || {},
      } as IProduct);
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t(`products.detail.${error || 'notFound'}`)}</h2>
        <button onClick={() => navigate('/products')} className="text-primary hover:underline font-medium">
          {t('products.detail.backToProducts')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      <div className="w-full max-w-none px-4 sm:px-8 md:px-12 lg:px-16 py-8">
        {/* Breadcrumbs / Back */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          <span className="text-xs font-black uppercase tracking-widest">{t('products.detail.backToCatalog')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm relative group">
              {product.images.length > 0 ? (
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={product.images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-12"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <img src="/favicon.svg" alt="" className="h-20 w-20 opacity-30 mb-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{t('products.detail.noImage')}</span>
                </div>
              )}
              <div className="absolute top-6 end-6 flex flex-col space-y-3">
                <button 
                  className={cn(
                    "bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg transition-colors",
                    favoriteId !== null ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  )} 
                  onClick={(e) => { e.preventDefault(); toggleFavorite(); }}
                  aria-label={t('products.detail.favorite')}
                  aria-pressed={favoriteId !== null}
                >
                  <Heart className="h-5 w-5" fill={favoriteId ? "currentColor" : "none"} />
                </button>
                <button className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-gray-400 hover:text-primary transition-colors" onClick={(e) => { 
                  e.preventDefault(); 
                  if (navigator.share) {
                    navigator.share({ title: document.title, url: window.location.href }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => toast.success(t('common.linkCopied')))
                      .catch(() => toast.error(t('common.networkError')));
                  }
                }} aria-label={t('products.detail.share')}>
                  <Share2 className="h-5 w-5" />
                </button>
                <button onClick={() => setShowReport(true)} aria-label={t('products.detail.reportShort')} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 hover:border-red-200 transition-all group relative">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{t('products.detail.reportShort')}</span>
                </button>

              </div>
            </div>
            
            {product.images.length > 1 && <div className="grid grid-cols-3 gap-4">
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
            </div>}
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="tech-label">{categoryLabel(t, product.category)}</span>
                {product.companyVerified && (
                  <span className="flex items-center space-x-1 text-success text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('products.detail.verifiedCompany')}</span>
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-tight mb-2">
                {product.name}
              </h1>
              {product.companyName && (
                <p className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  {product.companyId ? (
                    <a href={`/directory/${generateSlugUrl(product.companyName, product.companyId)}`} className="hover:underline">{t('products.detail.supplier', { name: product.companyName })}</a>
                  ) : (
                    <span>{t('products.detail.supplier', { name: product.companyName })}</span>
                  )}
                </p>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('products.detail.indicativePrice')}</p>
                  <p className="text-4xl font-mono font-black text-primary tracking-tighter">
                    {product.priceValue ? formatPrice(product.priceValue) : t('common.onQuote')}
                  </p>
                </div>
                {product.reference_id && (
                  <div className="text-end">
                    <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">{t('products.detail.reference', { ref: product.reference_id })}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/contact?subject=${encodeURIComponent(t('products.detail.quoteSubject', { name: product.name }))}`)}
                  className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center space-x-3 text-lg group"
                >
                  <FileText className="h-6 w-6" />
                  <span className="uppercase">{t('products.detail.requestQuote')}</span>
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all rtl:rotate-180" />
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
                    <span>{isCompared ? t('products.detail.compared') : t('common.compare')}</span>
                  </button>
                  {product.sellerId && product.sellerId !== user?.id && (
                    <button className="bg-neutral-bg text-primary py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-gray-100 transition-all border border-gray-100" onClick={(e) => {
                      e.preventDefault();
                      if (!isAuthenticated) {
                        navigate(`/login?redirect=${encodeURIComponent(`/dashboard?tab=messages&to=${product.sellerId}`)}`);
                        return;
                      }
                      navigate(`/dashboard?tab=messages&to=${product.sellerId}`);
                    }}>
                      <MessageSquare className="h-5 w-5" />
                      <span>{t('common.contact_supplier')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs for detailed content */}
            <div className="space-y-6">
              <div className="flex space-x-8 border-b border-gray-200">
                <button className={`pb-4 border-b-2 ${activeTab === 'description' ? 'border-secondary text-primary' : 'border-transparent text-gray-400 hover:text-primary'} text-sm font-black uppercase tracking-widest transition-all`} onClick={() => setActiveTab('description')}>{t('products.detail.description')}</button>
                <button className={`pb-4 border-b-2 ${activeTab === 'specs' ? 'border-secondary text-primary' : 'border-transparent text-gray-400 hover:text-primary'} text-sm font-black uppercase tracking-widest transition-all`} onClick={() => setActiveTab('specs')}>{t('products.detail.specs')}</button>
              </div>
              
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none text-gray-600">
                  {product.description
                    ? <p className="whitespace-pre-line">{product.description}</p>
                    : <p className="text-gray-400">{t('products.detail.noDescription')}</p>}
                  {product.features?.length > 0 && (
                    <ul className="mt-4 list-disc ps-5">
                      {product.features.map((f: string) => <li key={f}>{f}</li>)}
                    </ul>
                  )}
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
            </div>
  
          </div>
        </div>
      </div>
        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-primary mb-8 uppercase tracking-tight">{t('products.similar')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer" onClick={() => {
                  navigate(`/products/${generateSlugUrl(p.name, p.id)}`);
                  window.scrollTo(0, 0);
                }}>
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                    {p.file_url
                      ? <img src={p.file_url} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center"><img src="/favicon.svg" alt="" className="h-12 w-12 opacity-20" /></div>}
                  </div>
                  {p.companyName && <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{p.companyName}</p>}
                  <h3 className="text-lg font-bold text-primary leading-tight mb-2 flex-1">{p.name}</h3>
                  <p className="text-xl font-black text-secondary">{Number(p.price) > 0 ? formatPrice(Number(p.price)) : t('common.onQuote')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
          {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-bold text-primary mb-2 flex items-center"><AlertTriangle className="h-5 w-5 text-red-500 me-2" />{t('products.report')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('products.report_desc')}</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t('products.detail.reportPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm outline-none transition-all resize-none h-32 mb-6"
            ></textarea>
            <div className="flex space-x-3">
              <button onClick={() => setShowReport(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">{t('products.cancel')}</button>
              <button onClick={handleReport} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">{t('products.send_report')}</button>
            </div>
          </div>
        </div>
      )}

</div>
  );
};

export default ProductDetail;

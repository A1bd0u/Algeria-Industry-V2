import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Lightbulb, Loader2, Star, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { productCategories } from '../data/productCategories';
import { ApiError, apiErrorMessage } from '../lib/apiError';
import { cn } from '../lib/utils';

interface AddProductProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

const STORAGE_KEY = 'addProductFormDraft';
const EMPTY = { name: '', category: '', price: '', description: '' };
const SQUARE = 1200;

// Mise au carré sans rogner : l'image est centrée sur un fond blanc de
// 1200 × 1200 px, pour des vignettes homogènes dans tout le catalogue.
const toSquare = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(SQUARE / img.width, SQUARE / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const side = Math.max(w, h, 600);
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas')); return; }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/jpeg', 0.88);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
  img.src = url;
});

const AddProduct: React.FC<AddProductProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [maxImages, setMaxImages] = useState(2);
  const [uploading, setUploading] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Ouverture : produit à modifier, sinon brouillon local.
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        price: initialData.price ?? '',
        description: initialData.description || '',
      });
      const gallery = Array.isArray(initialData.images) && initialData.images.length
        ? initialData.images
        : [initialData.file_url || initialData.image].filter(Boolean);
      setImages(gallery);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        setFormData(saved?.formData || EMPTY);
        setImages(Array.isArray(saved?.images) ? saved.images : []);
      } catch {
        setFormData(EMPTY);
        setImages([]);
      }
    }
    // Nombre d'images autorisé par l'offre (2, 5 ou 10).
    fetch('/api/subscriptions/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.limits?.imagesPerProduct) setMaxImages(d.limits.imagesPerProduct); })
      .catch(() => {});
  }, [isOpen, initialData]);

  // Brouillon d'un nouveau produit.
  useEffect(() => {
    if (isOpen && !initialData) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, images })); } catch { /* stockage indisponible */ }
    }
  }, [formData, images, isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadOne = async (file: File): Promise<string> => {
    const square = await toSquare(file).catch(() => file);
    const data = new FormData();
    data.append('file', square, file.name.replace(/\.[^.]+$/, '') + '.jpg');
    const res = await fetch('/api/upload?bucket=product-images', { method: 'POST', body: data });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) throw new ApiError(body, 'addProduct.uploadError');
    return body.url;
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f: File) => f.type.startsWith('image/')) as File[];
    e.target.value = '';
    if (!files.length) return;
    const room = maxImages - images.length;
    if (room <= 0) {
      setError(t('addProduct.imagesLimit', { count: maxImages }));
      return;
    }
    if (files.length > room) setError(t('addProduct.imagesLimit', { count: maxImages }));
    else setError('');
    const batch = files.slice(0, room);
    setUploading(batch.length);
    for (const file of batch) {
      try {
        const url = await uploadOne(file);
        setImages((prev) => (prev.length < maxImages ? [...prev, url] : prev));
      } catch (err: any) {
        setError(err.message || t('addProduct.uploadError'));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const move = (index: number, delta: number) => setImages((prev) => {
    const next = [...prev];
    const target = index + delta;
    if (target < 0 || target >= next.length) return prev;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError(t('addProduct.photoRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    const price = String(formData.price).replace(/\s/g, '');
    const payload = {
      ...formData,
      price: price === '' ? null : price,
      images,
      file_url: images[0],
    };
    try {
      const res = await fetch(initialData ? `/api/products/${initialData.id}` : '/api/products', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(data, 'addProduct.saveError');
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* rien */ }
      setFormData(EMPTY);
      setImages([]);
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || apiErrorMessage({}, 'addProduct.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const field = 'w-full rounded-xl border border-border-tech bg-white px-4 py-3 text-sm outline-none focus:border-secondary';
  const label = 'text-sm font-bold text-primary';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-tech px-6 py-4">
              <div>
                <h3 id="add-product-title" className="text-xl font-black text-primary">{initialData ? t('addProduct.titleEdit') : t('addProduct.titleNew')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('addProduct.subtitle')}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('addProduct.close')} className="p-2 text-gray-500 hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium" role="alert">{error}</div>}

              {/* Photos */}
              <section>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className={label}>{t('addProduct.photos')} *</p>
                  <p className="text-xs text-gray-500">
                    {t('addProduct.photosCount', { count: images.length, max: maxImages })}
                    {maxImages < 10 && <> · <Link to="/tarifs" className="text-secondary font-bold hover:underline">{t('addProduct.morePhotos')}</Link></>}
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((url, i) => (
                    <div key={url} className={cn('group relative aspect-square overflow-hidden rounded-xl border bg-white', i === 0 ? 'border-secondary ring-2 ring-secondary/30' : 'border-border-tech')}>
                      <img src={url} alt="" className="h-full w-full object-contain" />
                      {i === 0 && (
                        <span className="absolute top-1.5 start-1.5 inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <Star className="h-3 w-3" aria-hidden="true" /> {t('addProduct.mainPhoto')}
                        </span>
                      )}
                      <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('addProduct.moveBefore')} className="rounded bg-white/90 p-1 shadow disabled:opacity-30">
                          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        </button>
                        <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} aria-label={t('addProduct.removePhoto')} className="rounded bg-white/90 p-1 text-red-500 shadow">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={t('addProduct.moveAfter')} className="rounded bg-white/90 p-1 shadow disabled:opacity-30">
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: uploading }).map((_, i) => (
                    <div key={`up-${i}`} className="aspect-square rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ))}
                  {images.length + uploading < maxImages && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-neutral-bg flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                      <span className="text-xs font-bold text-center px-1">{t('addProduct.addPhotos')}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={handleFiles} disabled={isLoading} />
                    </label>
                  )}
                </div>
                <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{t('addProduct.photoTips')}</p>
                </div>
              </section>

              <div className="space-y-1.5">
                <label htmlFor="product_name" className={label}>{t('addProduct.name')} *</label>
                <input id="product_name" name="name" required minLength={2} maxLength={200} type="text" value={formData.name} onChange={handleChange}
                  placeholder={t('addProduct.namePlaceholder')} className={field} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="product_category" className={label}>{t('addProduct.category')} *</label>
                  <select id="product_category" name="category" required value={formData.category} onChange={handleChange} className={cn(field, 'cursor-pointer')}>
                    <option value="" disabled>{t('addProduct.selectCategory')}</option>
                    {productCategories.map((group) => (
                      <optgroup key={group.id} label={t(`productCategories.${group.id}`)}>
                        {group.subCategories.map((sub) => (
                          <option key={sub.id} value={sub.name}>{t(`productCategories.${sub.id}`)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="product_price" className={label}>{t('addProduct.price')}</label>
                  <input id="product_price" name="price" type="text" inputMode="numeric" value={formData.price} onChange={handleChange}
                    placeholder={t('addProduct.pricePlaceholder')} className={field} />
                  <p className="text-xs text-gray-500">{t('addProduct.priceHint')}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="product_description" className={label}>{t('addProduct.description')}</label>
                <textarea id="product_description" name="description" rows={5} maxLength={10000} value={formData.description} onChange={handleChange}
                  placeholder={t('addProduct.descriptionPlaceholder')} className={cn(field, 'resize-y')} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost sm:w-auto">{t('addProduct.cancel')}</button>
                <button type="submit" disabled={isLoading || uploading > 0} className="btn-primary flex-1 py-3">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {initialData ? t('addProduct.update') : t('addProduct.add')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddProduct;

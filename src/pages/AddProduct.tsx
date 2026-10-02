import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { productCategories } from '../data/productCategories';
import { ApiError, apiErrorMessage } from '../lib/apiError';

interface AddProductProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

const STORAGE_KEY = 'addProductFormDraft';


const AddProduct: React.FC<AddProductProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData || {
    name: '',
    category: '',
    price: '',
    description: ''
  });
  const [fileUrl, setFileUrl] = useState<string | null>(initialData?.file_url || initialData?.image || null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger le brouillon
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
         setFormData({ name: initialData.name || '', category: initialData.category || '', price: initialData.price || '', description: initialData.description || '' });
         setFileUrl(initialData.file_url || initialData.image || null);
      } else {
         const saved = localStorage.getItem(STORAGE_KEY);
         if (saved) {
           setFormData(JSON.parse(saved));
         } else {
           setFormData({ name: '', category: '', price: '', description: '' });
         }
         setFileUrl(null);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
             setFormData(parsed.formData || { name: '', category: '', price: '', description: '' });
             if (parsed.fileUrl) setFileUrl(parsed.fileUrl);
          }
        } catch(e) {}
      }
    }
  }, [initialData]);

  // Sauvegarder le brouillon
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, fileUrl }));
    }
  }, [formData, fileUrl, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const xhr = new XMLHttpRequest();
    const data = new FormData();
    data.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(percentCompleted);
      }
    });

    xhr.addEventListener('load', () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          setFileUrl(response.url);
          setUploadProgress(100);
        } catch(err) {
          setError(t('addProduct.uploadParseError'));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          setError(apiErrorMessage(response, 'addProduct.uploadError'));
        } catch {
          setError(t('addProduct.uploadError'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      setIsUploading(false);
      setError(t('auth.networkError'));
    });

    xhr.open('POST', '/api/upload?bucket=product-images');
    // Assuming auth is handled via cookies which are sent automatically, if JWT in header is needed, add it here.
    xhr.send(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = {
      ...formData,
      file_url: fileUrl,
    };

    try {
      const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
      const method = initialData ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data, 'addProduct.saveError');
      }
      const addedProd = await res.json();
      
      // Clear draft on success
      localStorage.removeItem(STORAGE_KEY);
      setFormData({ name: '', category: '', price: '', description: '' });
      setFileUrl(null);
      
      onSuccess(addedProd);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-primary tracking-tighter">{initialData ? t('addProduct.titleEdit') : t('addProduct.titleNew')}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{t('addProduct.subtitle')}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t('addProduct.close')} className="p-3 text-gray-500 hover:text-primary transition-all">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="product_name" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('addProduct.name')}</label>
              <input 
                id="product_name"
                name="name"
                required
                type="text" 
                value={formData.name}
                onChange={handleChange}
                placeholder={t('addProduct.namePlaceholder')} 
                className="w-full bg-gray-50 border-none px-8 py-5 rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-secondary/20 transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="product_category" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('addProduct.category')}</label>
                <select 
                  id="product_category"
                  name="category" 
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  <option value="" disabled>{t('addProduct.selectCategory')}</option>
                  {productCategories.map(group => (
                    <optgroup key={group.id} label={t(`productCategories.${group.id}`)}>
                      {group.subCategories.map((sub: any) => (
                        <option key={sub.id} value={sub.name}>{t(`productCategories.${sub.id}`)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="product_price" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('addProduct.price')}</label>
                <input 
                  id="product_price"
                  name="price" 
                  required 
                  type="text" 
                  value={formData.price}
                  onChange={handleChange}
                  placeholder={t('addProduct.pricePlaceholder')} 
                  className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold outline-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="product_description" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('addProduct.description')}</label>
              <textarea 
                id="product_description"
                name="description"
                rows={4} 
                value={formData.description}
                onChange={handleChange}
                placeholder={t('addProduct.descriptionPlaceholder')} 
                className="w-full bg-gray-50 border-none px-8 py-6 rounded-2xl text-sm font-medium outline-none resize-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-primary uppercase tracking-widest italic">{t('addProduct.file')}</label>
              <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center relative hover:bg-gray-100 transition-colors">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileUpload} 
                  disabled={isUploading || isLoading} 
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 text-primary mb-3 animate-spin" />
                    <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                      <div className="bg-secondary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">{uploadProgress}%</span>
                  </div>
                ) : fileUrl ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                    <div className="text-emerald-600 font-black text-sm tracking-widest break-all">
                      {t('addProduct.fileAdded', { name: fileUrl.split('-').pop() })}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{t('addProduct.clickToReplace')}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('addProduct.dropHere')}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button 
                type="submit"
                disabled={isLoading || isUploading}
                className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-secondary transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{initialData ? t('addProduct.update') : t('addProduct.add')}</span>}
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="px-8 border border-gray-100 text-gray-500 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-primary transition-all"
              >
                {t('addProduct.cancel')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddProduct;

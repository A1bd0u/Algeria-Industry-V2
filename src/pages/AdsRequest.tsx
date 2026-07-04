import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Mail, Phone, Building, User, Info, CheckCircle2, AlertCircle, Upload, FileImage, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const AdsRequest = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<{
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    placement: string;
    message: string;
    designFile: File | null;
  }>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    placement: 'homepage_banner',
    message: '',
    designFile: null
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        placement: 'homepage_banner',
        message: '',
        designFile: null
      });
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, designFile: e.target.files![0] }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, designFile: null }));
  };

  const adPlacements = [
    { id: 'homepage_banner', label: 'Slide d\'accueil (Hero Slider)', price: 'Sur devis' }
  ];

  return (
    <div className="bg-neutral-bg min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Megaphone className="h-5 w-5" />
            <span className="font-bold text-sm uppercase tracking-widest">Espace Publicitaire</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-6">
            Boostez Votre Visibilité
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Touchez les professionnels de l'industrie avec nos solutions publicitaires ciblées. Remplissez le formulaire ci-dessous pour être recontacté par notre équipe commerciale.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100"
        >
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-2xl font-black text-primary mb-4">Demande Envoyée !</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Notre équipe commerciale a bien reçu votre demande d'espace publicitaire. Nous vous contacterons dans les plus brefs délais.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="btn-primary py-4 px-8"
              >
                Nouvelle demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nom de l'entreprise *</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="Votre entreprise"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Contact *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="Nom et prénom"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Pro *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="email@entreprise.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="+213 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Emplacement Souhaité *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {adPlacements.map((placement) => (
                    <label 
                      key={placement.id}
                      className={cn(
                        "relative flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all",
                        formData.placement === placement.id 
                          ? "border-secondary bg-secondary/5" 
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="placement" 
                        value={placement.id}
                        checked={formData.placement === placement.id}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-bold text-primary mb-1">{placement.label}</span>
                      <span className="text-sm text-gray-500">{placement.price}</span>
                      
                      {formData.placement === placement.id && (
                        <div className="absolute top-4 right-4 text-secondary">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Détails de la campagne (Optionnel)</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none resize-none"
                  placeholder="Décrivez vos objectifs, la durée souhaitée..."
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Uploader votre design (Image)</label>
                {!formData.designFile ? (
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-bold text-gray-900 mb-1">Cliquez ou glissez votre image ici</p>
                      <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileImage className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 line-clamp-1">{formData.designFile.name}</p>
                        <p className="text-xs text-gray-500">{(formData.designFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeFile}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start space-x-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>Une erreur est survenue lors de l'envoi. Veuillez réessayer plus tard.</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full btn-primary py-5 flex items-center justify-center space-x-3 disabled:opacity-70"
              >
                {status === 'submitting' ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Megaphone className="h-5 w-5" />
                    <span>Envoyer la Demande</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
        
        {/* Info Box */}
        <div className="mt-12 bg-white/50 border border-gray-200/50 p-6 rounded-2xl flex items-start space-x-4">
           <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
           <div>
             <h4 className="font-bold text-primary mb-2">Pourquoi annoncer sur Algeria Industry ?</h4>
             <p className="text-sm text-gray-600 leading-relaxed">
               Notre plateforme regroupe la plus grande communauté de professionnels de l'industrie en Algérie. En diffusant vos bannières sur nos espaces, vous touchez directement les décideurs (acheteurs, fournisseurs, investisseurs).
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdsRequest;

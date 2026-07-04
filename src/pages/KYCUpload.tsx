import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, FileText, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KYCUpload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activity, setActivity] = useState('');
  const [files, setFiles] = useState<{type: string, file: File | null, url?: string, uploading: boolean}>([
    { type: 'RC', file: null, uploading: false },
    { type: 'NIF', file: null, uploading: false },
    { type: 'NIS', file: null, uploading: false },
    { type: 'RIB', file: null, uploading: false },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // if (!user) navigate('/login');

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    
    // update local state
    const newFiles = [...files];
    newFiles[index].file = selectedFile;
    newFiles[index].uploading = true;
    setFiles(newFiles);

    // upload
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        let errText = await res.text();
        throw new Error('Erreur upload: ' + res.status + ' ' + errText);
      }
      const data = await res.json();
      
      const updatedFiles = [...files];
      updatedFiles[index].url = data.url;
      updatedFiles[index].uploading = false;
      setFiles(updatedFiles);
    } catch (err) {
      console.error(err);
      const updatedFiles = [...files];
      updatedFiles[index].uploading = false;
      updatedFiles[index].file = null; 
      setFiles(updatedFiles);
      setError("Erreur lors de l'upload d'un fichier.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.some(f => !f.url)) {
       setError("Veuillez uploader tous les documents requis.");
       return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      const payloadFiles = files.map(f => ({ type: f.type, url: f.url }));
      const res = await fetch('/api/kyc/submit', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ activity, files: payloadFiles })
      });
      
      if (!res.ok) {
         const d = await res.json();
         throw new Error(d.error || "Erreur de soumission");
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-neutral-bg py-12 px-4 flex justify-center pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full"
      >
         <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-primary mb-6 text-sm font-bold transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
         </button>
         
         <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Building2 className="h-40 w-40" />
            </div>

            {success ? (
               <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                  <div className="mx-auto w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
                     <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-black text-primary uppercase tracking-tighter mb-4">Demande Envoyée</h2>
                  <p className="text-gray-500 font-medium">Votre dossier est maintenant en cours de vérification par nos agents.<br/>Vous recevrez une notification d'ici 24h à 48h.</p>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="relative z-10">
                  <div className="mb-10">
                     <h1 className="text-3xl font-black text-primary uppercase tracking-tighter mb-4">Vérification de l'Entreprise (KYC)</h1>
                     <p className="text-gray-500 font-medium">Conformément à nos CGU, nous devons vérifier la légitimité de votre entreprise pour délivrer le badge "Fournisseur Vérifié".</p>
                  </div>

                  {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center text-sm font-bold">
                       <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
                       {error}
                    </div>
                  )}

                  <div className="space-y-8">
                     <div>
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3">Secteur d'Activité Principal</label>
                        <input 
                          type="text" 
                          required
                          value={activity}
                          onChange={(e) => setActivity(e.target.value)}
                          placeholder="Ex: Construction, Énergie, Informatique..."
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none"
                        />
                     </div>

                     <div className="pt-6 border-t border-gray-100">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-6">Documents Légaux (PDF/Image)</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {files.map((f, i) => (
                              <div key={f.type} className="border border-gray-200 rounded-2xl p-5 hover:border-secondary transition-colors relative group">
                                 <div className="flex justify-between items-center mb-4">
                                     <div className="flex items-center space-x-3 text-primary">
                                       <FileText className="h-5 w-5 opacity-50" />
                                       <span className="font-black uppercase font-bold text-sm tracking-widest">{f.type}</span>
                                     </div>
                                     {f.url && <CheckCircle2 className="h-5 w-5 text-success" />}
                                 </div>
                                 <div className="relative h-12 w-full bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center">
                                    <input 
                                      type="file" 
                                      accept="application/pdf,image/*"
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                      onChange={(e) => handleFileChange(i, e)}
                                    />
                                    {f.uploading ? (
                                       <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                    ) : f.file ? (
                                       <span className="text-xs font-bold text-primary truncate px-4">{f.file.name}</span>
                                    ) : (
                                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center"><Upload className="h-4 w-4 mr-2" /> Uploader</span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <button 
                       type="submit" 
                       disabled={isSubmitting || files.some(f => !f.url)}
                       className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center space-x-3 text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                     >
                        {isSubmitting ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> <span>Envoi en cours...</span></>
                        ) : (
                          <><CheckCircle2 className="h-5 w-5" /> <span>Soumettre le Dossier</span></>
                        )}
                     </button>
                  </div>
               </form>
            )}
         </div>
      </motion.div>
    </div>
  );
};

export default KYCUpload;

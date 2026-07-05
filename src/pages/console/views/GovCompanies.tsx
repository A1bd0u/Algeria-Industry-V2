/* eslint-disable */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { 
  Building2, CheckCircle, FileText, X, AlertTriangle, ArrowRight, Maximize, Minimize
} from 'lucide-react';

export default function GovCompanies({ state }: { state: any }) {
  const {
    pendingKYC, approvedKYC, handleApproveKYC, handleRejectKYC, showNotify
  } = state;

  // Modals state
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  
  // Review state
  const [reviewingKyc, setReviewingKyc] = useState<any | null>(null);
  const [reviewDocUrl, setReviewDocUrl] = useState<string | null>(null);
  const [isFullScreenDoc, setIsFullScreenDoc] = useState(false);
  
  // Reject state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectName, setRejectName] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      showNotify("Veuillez saisir un motif de rejet", "error");
      return;
    }
    if (rejectId) {
      handleRejectKYC(rejectId, rejectName, rejectReason);
    }
    setRejectId(null);
    setRejectReason("");
    setRejectName("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Vérifications KYC <span className="text-secondary">({pendingKYC.length} En attente)</span></h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Validation des documents légaux pour le badge "Verified Solution"</p>
        </div>
        <div className="flex space-x-2">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            {approvedKYC.length} Validés ce jour
          </div>
        </div>
      </div>
      
      
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden pb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom entreprise</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Propriétaire (email)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date soumission</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documents</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {pendingKYC.length > 0 ? (
                  [...pendingKYC].sort((a: any, b: any) => {
                    const dateA = new Date(a.date || a.created_at || 0).getTime();
                    const dateB = new Date(b.date || b.created_at || 0).getTime();
                    return dateA - dateB;
                  }).map((c: any) => (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-primary">{c.name || c.company_name || 'ENTREPRISE'}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600">
                              En attente
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 font-medium">{c.user_email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 font-medium">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : (c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : 'N/A')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {c.docsList && c.docsList.length > 0 ? c.docsList.map((d: any) => (
                            <button
                              key={d.document_type}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedDocUrl(d.file_url);
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-secondary hover:text-white text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center space-x-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span>{d.document_type}</span>
                            </button>
                          )) : (
                            <span className="text-[10px] text-gray-400 italic">Aucun</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <button
                          onClick={(e) => { e.preventDefault(); window.location.href = '/extranet/kyc/' + c.id; }}
                          className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-2 w-full max-w-[120px] ms-auto"
                        >
                          <span>Examiner</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Toutes les demandes ont été traitées</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDocUrl && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDocUrl(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-black text-primary uppercase tracking-tighter">Visionneuse de Document</h3>
                <button onClick={() => setSelectedDocUrl(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 bg-gray-100 relative overflow-hidden">
                {selectedDocUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedDocUrl} className="w-full h-full border-none" title="Document PDF" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img src={selectedDocUrl} alt="Document KYC" className="max-w-full max-h-full object-contain shadow-md rounded-xl" />
                  </div>
                )}
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                <a href={selectedDocUrl} target="_blank" rel="noreferrer" className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                  Ouvrir dans un nouvel onglet
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Review KYC Modal (Split Screen) */}
      <AnimatePresence>
        {reviewingKyc && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex bg-white"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full h-full flex flex-col md:flex-row overflow-hidden relative"
            >
              {/* Left Pane: Info & Actions */}
              <div className={`w-full md:w-[400px] bg-white border-r border-gray-100 flex flex-col relative z-10 flex-shrink-0 ${isFullScreenDoc ? 'hidden' : ''}`}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-primary uppercase tracking-tighter">Revue KYC</h3>
                  <button onClick={() => { setReviewingKyc(null); setIsFullScreenDoc(false); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 mb-4">
                      En attente
                    </span>
                    <h4 className="text-2xl font-black text-primary uppercase tracking-tighter mb-1">{reviewingKyc.name || reviewingKyc.company_name || 'ENTREPRISE'}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Soumis le {reviewingKyc.date ? new Date(reviewingKyc.date).toLocaleDateString('fr-FR') : (reviewingKyc.created_at ? new Date(reviewingKyc.created_at).toLocaleDateString('fr-FR') : 'N/A')}
                    </p>
                  </div>
                  
                  <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Informations de l'entreprise</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dénomination</p>
                        <p className="text-sm font-medium text-gray-700">{reviewingKyc.name || reviewingKyc.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Secteur d'activité</p>
                        <p className="text-sm font-medium text-gray-700">{reviewingKyc.activity || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registre Commerce (RC)</p>
                        <p className="text-sm font-medium text-gray-700 font-mono">{reviewingKyc.company_details?.rc || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Identifiant Fiscal (NIF)</p>
                        <p className="text-sm font-medium text-gray-700 font-mono">{reviewingKyc.company_details?.nif || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Informations du propriétaire</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom Complet</p>
                        <p className="text-sm font-medium text-gray-700">{reviewingKyc.user_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Adresse Email</p>
                        <p className="text-sm font-medium text-gray-700">{reviewingKyc.user_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3">Documents à vérifier</p>
                    <div className="flex flex-col gap-2">
                      {reviewingKyc.docsList && reviewingKyc.docsList.length > 0 ? reviewingKyc.docsList.map((d: any) => (
                        <button 
                          key={d.document_type} 
                          onClick={() => setReviewDocUrl(d.file_url)}
                          className={`px-4 py-3 border rounded-xl flex items-center justify-between group/doc transition-all w-full text-start ${reviewDocUrl === d.file_url ? 'bg-secondary/5 border-secondary/20' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-secondary/30'}`}
                        >
                          <div className="flex items-center space-x-3">
                             <FileText className={`h-4 w-4 ${reviewDocUrl === d.file_url ? 'text-secondary' : 'text-gray-400 group-hover/doc:text-secondary'}`} />
                             <span className={`text-[10px] font-black uppercase ${reviewDocUrl === d.file_url ? 'text-secondary' : 'text-primary'}`}>{d.document_type}</span>
                          </div>
                          {reviewDocUrl === d.file_url && <span className="w-2 h-2 rounded-full bg-secondary"></span>}
                        </button>
                      )) : (
                        <p className="text-[10px] text-gray-500 italic">Aucun document fourni</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex space-x-3">
                  <button
                    onClick={() => {
                       handleApproveKYC(reviewingKyc.id, reviewingKyc.name || reviewingKyc.company_name);
                       setReviewingKyc(null); setIsFullScreenDoc(false);
                    }}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approuver</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectId(reviewingKyc.id);
                      setRejectName(reviewingKyc.name || reviewingKyc.company_name);
                      setReviewingKyc(null); setIsFullScreenDoc(false); // Close review modal to show reject modal
                    }}
                    className="flex-1 bg-white border border-red-200 text-red-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Rejeter</span>
                  </button>
                </div>
              </div>
              
              {/* Right Pane: Document Viewer */}
              <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
                {reviewDocUrl ? (
                  <>
                    <div className={`flex-1 w-full h-full transition-all ${isFullScreenDoc ? 'p-0' : 'p-4 md:p-8'}`}>
                       <div className={`w-full h-full bg-white shadow-sm border border-gray-200 overflow-hidden ${isFullScreenDoc ? 'rounded-none' : 'rounded-2xl'}`}>
                         {reviewDocUrl.toLowerCase().endsWith('.pdf') ? (
                           <iframe src={reviewDocUrl} className="w-full h-full border-none" title="Document PDF" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center overflow-auto p-4 bg-gray-50">
                             <img src={reviewDocUrl} alt="Document KYC" className="max-w-full max-h-full object-contain shadow-md rounded-xl" />
                           </div>
                         )}
                       </div>
                    </div>
                    <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center px-4 md:px-8 shadow-sm relative z-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Aperçu du document</p>
                      <div className="flex space-x-3 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setIsFullScreenDoc(!isFullScreenDoc)}
                          className="px-4 py-2 bg-gray-100 text-gray-600 hover:text-primary hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2"
                        >
                          {isFullScreenDoc ? (
                            <>
                              <Minimize className="h-4 w-4" />
                              <span className="hidden sm:inline">Quitter plein écran</span>
                            </>
                          ) : (
                            <>
                              <Maximize className="h-4 w-4" />
                              <span className="hidden sm:inline">Plein écran</span>
                            </>
                          )}
                        </button>
                        <a href={reviewDocUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center space-x-2">
                          <span className="hidden sm:inline">Nouvel onglet</span>
                          <FileText className="h-4 w-4 sm:hidden" />
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                     <FileText className="h-16 w-16 mb-4 opacity-20" />
                     <p className="text-xs font-black uppercase tracking-widest">Aucun document sélectionné</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">Rejeter la demande</h3>
              <p className="text-xs text-gray-500 mb-6 font-medium">
                Vous êtes sur le point de rejeter la demande de <strong className="text-primary">{rejectName}</strong>. Veuillez indiquer le motif de ce refus. Un email lui sera envoyé.
              </p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">Motif du rejet *</label>
                  <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Le registre de commerce est illisible, veuillez renvoyer un scan clair..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-xs font-medium text-primary outline-none transition-all resize-none h-32"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setRejectId(null);
                    setRejectReason("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/20"
                >
                  Confirmer le refus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

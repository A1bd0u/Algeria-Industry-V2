import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, Download, Building2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AdminKYCReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // PDF viewer state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  useEffect(() => {
    fetchKYCDetails();
  }, [id]);

  const fetchKYCDetails = async () => {
    try {
      const res = await fetch('/api/kyc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      const currentKyc = data.find((k: any) => k.id === id);
      if (!currentKyc) {
        throw new Error('Demande KYC non trouvée');
      }
      setKyc(currentKyc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/kyc/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Erreur lors de la validation');
      navigate('/extranet');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Veuillez saisir un motif de rejet');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/kyc/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (!res.ok) throw new Error('Erreur lors du rejet');
      navigate('/extranet');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (error || !kyc) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-red-500 font-bold">{error || "Non trouvé"}</div></div>;
  }

  const activeDoc = kyc.docsList?.[activeDocIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/extranet')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-primary uppercase tracking-tight">Revue KYC : {kyc.name}</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kyc.company_details?.activity_sector || 'Secteur non spécifié'}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowRejectModal(true)}
            className="px-6 py-2.5 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-100 transition-colors flex items-center space-x-2"
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4" />
            <span>Rejeter</span>
          </button>
          <button 
            onClick={handleApprove}
            className="px-6 py-2.5 bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-green-600 transition-colors shadow-md flex items-center space-x-2"
            disabled={isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Valider</span>
          </button>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane : Infos */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-200 bg-white p-8">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* Company Info */}
            <section>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                <Building2 className="h-4 w-4 me-2" />
                Informations de l'entreprise
              </h2>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Raison sociale</p>
                  <p className="text-lg font-black text-primary">{kyc.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Secteur</p>
                    <p className="font-medium text-gray-800">{kyc.company_details?.activity_sector || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">NIF</p>
                    <p className="font-medium text-gray-800">{kyc.company_details?.nif || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">RC</p>
                    <p className="font-medium text-gray-800">{kyc.company_details?.rc || 'Non renseigné'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Description</p>
                  <p className="text-sm text-gray-600 mt-1">{kyc.company_details?.description || 'Aucune description'}</p>
                </div>
              </div>
            </section>

            {/* Submitter Info */}
            <section>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                <User className="h-4 w-4 me-2" />
                Soumis par
              </h2>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Nom</p>
                  <p className="font-medium text-gray-800">{kyc.user_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                  <p className="font-medium text-gray-800">{kyc.user_email}</p>
                </div>
              </div>
            </section>

            {/* Documents List */}
            <section>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                <FileText className="h-4 w-4 me-2" />
                Documents fournis
              </h2>
              <div className="space-y-3">
                {kyc.docsList?.length > 0 ? (
                  kyc.docsList.map((doc: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveDocIndex(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        activeDocIndex === idx 
                          ? 'bg-secondary/5 border-secondary text-secondary' 
                          : 'bg-white border-gray-200 hover:border-secondary hover:shadow-sm text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5" />
                        <span className="font-bold">{doc.document_type}</span>
                      </div>
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun document attaché.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Pane : Document Viewer */}
        <div className="w-1/2 bg-gray-200 relative flex flex-col items-center overflow-auto p-8">
          {activeDoc ? (
            activeDoc.file_url.toLowerCase().endsWith('.pdf') ? (
              <div className="bg-white p-4 shadow-xl rounded-xl">
                <Document
                  file={activeDoc.file_url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">Chargement du document...</div>}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={true} 
                    renderAnnotationLayer={true} 
                    width={500}
                  />
                </Document>
                {numPages && numPages > 1 && (
                  <div className="mt-4 flex items-center justify-center space-x-4">
                    <button 
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber(p => p - 1)}
                      className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Page {pageNumber} sur {numPages}
                    </span>
                    <button 
                      disabled={pageNumber >= numPages}
                      onClick={() => setPageNumber(p => p + 1)}
                      className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img src={activeDoc.file_url} alt="Document" className="max-w-full max-h-full shadow-2xl rounded-xl object-contain" />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez un document</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">Rejeter la demande</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
              Veuillez indiquer le motif du refus pour <strong className="text-primary">{kyc.name}</strong>. Ce motif lui sera communiqué par email.
            </p>
            
            <div className="mb-8">
              <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">Motif du rejet *</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Le document est illisible..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm outline-none transition-all resize-none h-32"
              />
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
                disabled={isSubmitting || !rejectReason.trim()}
              >
                Confirmer le rejet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

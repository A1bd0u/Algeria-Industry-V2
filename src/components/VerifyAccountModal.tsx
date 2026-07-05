import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerifyAccountModal() {
  const { user, verifyCode, resendCode, logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  if (!user || user.emailVerified) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyCode(user.email, code);
    } catch (err: any) {
      setError(err.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setError('');
    setResendLoading(true);
    try {
      await resendCode(user.email);
      setResendMessage('Un nouveau code a été envoyé ! (Vérifiez la console ou simulez la réception)');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-lg w-full rounded-none shadow-2xl overflow-hidden"
      >
        <div className="bg-secondary p-8 text-center relative overflow-hidden">
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
             <Smartphone className="h-8 w-8 text-white" />
           </div>
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Vérification Requise</h2>
           <p className="text-white/80 text-xs font-bold leading-relaxed uppercase tracking-widest">
              Sécurisez votre compte {user.role} avant de continuer
           </p>
        </div>

        <div className="p-8 space-y-6">
           <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs font-bold flex items-center border border-emerald-100 uppercase tracking-widest text-center justify-center">
             <Mail className="h-4 w-4 me-2" />
             Un code à 6 chiffres a été envoyé à {user.email}
           </div>

           {error && (
             <div className="bg-red-50 text-red-500 p-4 text-xs font-bold border border-red-100 text-center uppercase">
                {error}
             </div>
           )}

           {resendMessage && (
             <div className="bg-blue-50 text-blue-500 p-4 text-xs font-bold border border-blue-100 text-center uppercase">
                {resendMessage}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code de vérification</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 border border-gray-100 px-6 py-4 text-2xl tracking-[0.5em] font-mono text-center outline-none focus:border-secondary transition-all"
                  placeholder="000000"
                  required
                />
             </div>

             <div className="flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading || code.length !== 6}
                  className="w-full bg-primary text-white py-5 flex items-center justify-center space-x-3 hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center">
                    {loading ? 'Vérification...' : 'Confirmer mon compte'}
                  </span>
                  {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                </button>
             </div>
           </form>

           <div className="flex items-center justify-between pt-6 border-t border-gray-100">
             <button 
               onClick={handleResend} 
               disabled={resendLoading}
               className="text-[10px] font-black text-secondary hover:text-primary uppercase tracking-widest flex items-center transition-colors disabled:opacity-50"
             >
               <RefreshCw className={`h-3 w-3 me-2 ${resendLoading ? 'animate-spin' : ''}`} />
               {resendLoading ? 'Envoi...' : 'Renvoyer le code'}
             </button>

             <button 
               onClick={logout} 
               className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-colors"
             >
               Se déconnecter
             </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

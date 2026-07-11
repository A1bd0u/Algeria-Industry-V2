import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function VerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || user.isVerified || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Code renvoyé avec succès.');
      } else {
        setMessage(data.error || 'Erreur lors du renvoi du code.');
      }
    } catch (err) {
      setMessage('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 text-yellow-800 px-4 py-3 shadow-sm border-b border-yellow-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span>
            <strong>Votre email n'est pas vérifié.</strong> Veuillez vérifier votre boîte de réception pour valider votre compte et débloquer toutes les fonctionnalités.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className="text-xs font-medium bg-yellow-100 px-2 py-1 rounded">{message}</span>}
          <button
            onClick={handleResend}
            disabled={loading}
            className="whitespace-nowrap px-4 py-1.5 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Envoi...' : 'Renvoyer le code'}
          </button>
        </div>
      </div>
    </div>
  );
}

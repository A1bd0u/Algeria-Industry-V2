import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, Loader2, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../lib/apiError';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }
    
    // Mêmes règles que le serveur (10 caractères, une lettre, un chiffre).
    if (password.length < 10) {
      setError(t('auth.validation.passwordMin'));
      return;
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      setError(t('auth.validation.passwordLetter'));
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(t('auth.validation.passwordDigit'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t('auth.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-neutral-bg px-4 py-12">
         <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{t('auth.reset.missingToken')}</h2>
            <Link to="/forgot-password" className="text-secondary hover:underline font-bold">{t('auth.reset.backToRequest')}</Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-bg px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary">{t('auth.reset.title')}</h2>
            <p className="text-gray-500 mt-2">{t('auth.reset.subtitle')}</p>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-primary">{t('auth.reset.doneTitle')}</h3>
              <p className="text-gray-500 mb-8">{t('auth.reset.doneText')}</p>
              
              <Link to="/login" className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg">
                <span>{t('auth.reset.goToLogin')}</span>
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.reset.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input 
                    id="new-password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full ps-10 pe-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.reset.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input 
                    id="confirm-password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full ps-10 pe-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t('auth.reset.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.reset.submit')}</span>
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

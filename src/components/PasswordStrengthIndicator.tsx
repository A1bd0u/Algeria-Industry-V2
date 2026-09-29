import React from 'react';
import { useTranslation } from 'react-i18next';

export const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  
  // 10 caractères : minimum exigé par le serveur.
  const hasMinLength = password.length >= 10;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  
  // Bonus pour caractères spéciaux ou longueur supplémentaire
  if (password.length >= 14) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'auth.strength.weak', color: 'bg-red-500' };
  if (score === 3 || score === 4) return { score, label: 'auth.strength.medium', color: 'bg-yellow-500' };
  return { score, label: 'auth.strength.strong', color: 'bg-green-500' };
};

export const PasswordStrengthIndicator = ({ password }: { password?: string }) => {
  const { t } = useTranslation();
  const { score, label, color } = getPasswordStrength(password || '');

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 font-medium">{t('auth.strength.title')}</span>
        <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>{t(label)}</span>
      </div>
      <div className="flex space-x-1 h-1.5">
        <div className={`flex-1 rounded-full ${score >= 1 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 3 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 5 ? color : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
};

import React from 'react';

export const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  
  // Bonus pour caractères spéciaux ou longueur supplémentaire
  if (password.length > 10) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score === 3 || score === 4) return { score, label: 'Moyen', color: 'bg-yellow-500' };
  return { score, label: 'Fort', color: 'bg-green-500' };
};

export const PasswordStrengthIndicator = ({ password }: { password?: string }) => {
  const { score, label, color } = getPasswordStrength(password || '');

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 font-medium">Force du mot de passe</span>
        <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>{label}</span>
      </div>
      <div className="flex space-x-1 h-1.5">
        <div className={`flex-1 rounded-full ${score >= 1 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 3 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 5 ? color : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
};

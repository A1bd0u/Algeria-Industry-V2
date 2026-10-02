import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError } from '../lib/apiError';
import { goal } from '../lib/analytics';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  company_id?: string | null;
  role: 'acheteur' | 'fournisseur' | 'admin' | 'exposant';
  // Vrai uniquement si le dossier KYC est approuvé.
  isVerified: boolean;
  emailVerified?: boolean;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  companyStatus?: string | null;
  mfaEnabled?: boolean;
  // Admin sans double authentification : console bloquée jusqu'à l'activation.
  mfaSetupRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Renvoie null quand un code de double authentification est attendu.
  login: (email: string, password: string, captchaToken: string) => Promise<User | null>;
  verifyMfa: (code: string) => Promise<User>;
  register: (userData: Partial<User> & { password?: string; captchaToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  resendCode: (email: string, captchaToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check user session on app load
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Erreur lors de la récupération de la session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const login = async (email: string, password: string, captchaToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, captchaToken })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(errorData, 'auth.login.invalid');
      }

      const data = await res.json();
      if (data.mfaRequired) {
        return null;
      }
      setUser(data.user);
      return data.user as User;
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement de la session:', err);
    }
  };

  const register = async (userData: Partial<User> & { password?: string; captchaToken?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          company: userData.company,
          role: userData.role,
          password: userData.password,
          captchaToken: userData.captchaToken
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(errorData);
      }
      goal('Inscription', { role: String(userData.role || 'acheteur') });
      // Pas de session à ce stade : elle s'ouvre après vérification du code e-mail.
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (code: string) => {
    const res = await fetch('/api/auth/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(data, 'auth.mfa.invalid');
    }
    setUser(data.user);
    return data.user as User;
  };

  const verifyCode = async (email: string, code: string) => {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData, 'auth.verify.invalid');
    }
    // Le serveur ouvre la session et renvoie le profil à jour.
    const data = await res.json().catch(() => ({}));
    if (data?.user) {
      setUser(data.user);
    } else {
      await refreshUser();
    }
  };

  const resendCode = async (email: string, captchaToken: string) => {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, captchaToken })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData, 'auth.verify.resendError');
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (err) {
      console.warn('Erreur lors de la déconnexion sur le serveur', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, register, logout, verifyCode, resendCode, refreshUser, setUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

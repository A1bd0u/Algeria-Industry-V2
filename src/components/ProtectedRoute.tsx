import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('acheteur' | 'fournisseur' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Polished loading screen during session recovery
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-bg">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute w-10 h-10 border-4 border-primary/10 border-b-primary rounded-full animate-spin [animation-duration:1.5s]"></div>
        </div>
        <p className="mt-6 text-[11px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
          Récupération de session sécurisée...
        </p>
      </div>
    );
  }

  // Not authenticated? Redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role verification (if requested)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6h.01M5.93 19.36l12.14-12.14m-12.14 0l12.14 12.14" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Accès Non Autorisé</h2>
          <p className="text-sm text-gray-500 font-medium mb-6">
            Votre compte ({user.role}) ne possède pas les privilèges requis pour accéder à cette interface.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

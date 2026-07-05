import React, { useEffect, useState } from 'react';
import { Heart, Package, Building2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


const Favorites = () => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isLoadingAuth) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const removeFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites(favorites.filter(f => f.id !== id));
        alert("Retiré des favoris");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || isLoadingAuth) {
    return <div className="min-h-screen pt-32 pb-20 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-bg pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-secondary mb-4"
          >
            <Heart className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mes Sauvegardes</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase italic mb-6">Mes Favoris</h1>
          <p className="text-gray-500 font-medium max-w-2xl">
            Retrouvez ici tous les produits et entreprises que vous avez sauvegardés.
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <Heart className="h-16 w-16 text-gray-200 mb-6" />
            <h2 className="text-xl font-black text-primary uppercase italic mb-2">Aucun favori</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Vous n'avez pas encore ajouté d'éléments à vos favoris. Explorez notre catalogue pour sauvegarder des produits.
            </p>
            <Link to="/products" className="bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-secondary transition-all">
              Explorer le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <motion.div 
                key={fav.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all flex flex-col relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    {fav.item_type === 'product' && fav.image ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                         <img src={fav.image} alt={fav.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        {fav.item_type === 'product' ? <Package className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-black text-primary uppercase italic line-clamp-1">{fav.name || `Favori (${fav.reference_id || fav.item_id.substring(0,8)})`}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{fav.category || fav.item_type}</p>
                      <p className="text-[10px] font-mono text-gray-400 uppercase mt-1 tracking-widest">
                         {fav.reference_id ? `REF: ${fav.reference_id}` : `ID: ${fav.item_id.substring(0,8)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex gap-3">
                  <Link 
                    to={fav.item_type === 'product' ? `/products/${fav.item_id}` : `/directory/${fav.item_id}`}
                    className="flex-1 text-center bg-gray-50 text-primary py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    Voir Détails
                  </Link>
                  <button 
                    onClick={() => removeFavorite(fav.id)}
                    className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { 
  Building2, CheckCircle, ChevronRight, ChevronLeft,
  Filter, MoreVertical, Plus, Search, ShieldCheck, Trash, Users, X, AlertTriangle
} from 'lucide-react';

export default function GovUsers({ state }: { state: any }) {
  const { showNotify, profile } = state;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [dateFilter, setDateFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  // Actions Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Format Status
  const getStatus = (role: string) => {
    if (role && role.endsWith('_suspended')) return 'Suspendu';
    return 'Actif';
  };
  
  const getDisplayRole = (role: string) => {
    if (!role) return 'Aucun';
    return role.replace('_suspended', '');
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showNotify("Rôle mis à jour avec succès", "success");
        fetchUsers();
        setActiveMenuId(null);
      } else {
        showNotify("Erreur lors de la mise à jour", "error");
      }
    } catch (e) {
      showNotify("Erreur serveur", "error");
    }
  };

  const handleUpdateStatus = async (userId: string, action: 'suspend' | 'reactivate') => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showNotify(action === 'suspend' ? "Utilisateur suspendu" : "Utilisateur réactivé", "success");
        fetchUsers();
        setActiveMenuId(null);
      } else {
        showNotify("Erreur lors de l'opération", "error");
      }
    } catch (e) {
      showNotify("Erreur serveur", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotify("Utilisateur supprimé avec succès", "success");
        fetchUsers();
      } else {
        showNotify("Erreur lors de la suppression", "error");
      }
    } catch (e) {
      showNotify("Erreur serveur", "error");
    }
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/details`);
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (user: any) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  // Close menus when clicking outside (simple hack: close on global click)
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.company && u.company.toLowerCase().includes(search.toLowerCase()));
      
    const matchesRole = roleFilter === 'Tous' || getDisplayRole(u.role) === roleFilter;
    const matchesStatus = statusFilter === 'Tous' || getStatus(u.role) === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'Tous' && u.created_at) {
      const created = new Date(u.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "Aujourd'hui") matchesDate = diffDays <= 1;
      else if (dateFilter === "7 derniers jours") matchesDate = diffDays <= 7;
      else if (dateFilter === "30 derniers jours") matchesDate = diffDays <= 30;
      else if (dateFilter === "Cette année") matchesDate = created.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const availableRoles = ['acheteur', 'fournisseur', 'exposant', 'admin'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Base Utilisateurs</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gérez les accès et les rôles des {users.length} membres</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, entreprise..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full ps-12 pe-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-xs font-bold text-primary outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-secondary text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
          >
            <option value="Tous">Tous les rôles</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-secondary text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">Actifs</option>
            <option value="Suspendu">Suspendus</option>
          </select>
          
          <select 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-secondary text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
          >
            <option value="Tous">Toutes les dates</option>
            <option value="Aujourd'hui">Aujourd'hui</option>
            <option value="7 derniers jours">7 derniers jours</option>
            <option value="30 derniers jours">30 derniers jours</option>
            <option value="Cette année">Cette année</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-start">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entreprise</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Chargement...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, i) => {
                  const roleStr = getDisplayRole(u.role);
                  const statusStr = getStatus(u.role);
                  const isSuspended = statusStr === 'Suspendu';
                  
                  return (
                    <tr key={u.id || i} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleRowClick(u)}>
                      <td className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white uppercase text-sm",
                            isSuspended ? "bg-red-200" : "bg-primary"
                          )}>
                            {u.name ? u.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className={cn("text-xs font-black uppercase", isSuspended ? "text-gray-400 line-through" : "text-primary")}>{u.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-xs font-bold text-primary">
                        {u.company || '-'}
                      </td>
                      <td className="p-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          roleStr === 'admin' ? "bg-purple-100 text-purple-700" :
                          roleStr === 'acheteur' ? "bg-blue-100 text-blue-700" :
                          roleStr === 'fournisseur' ? "bg-emerald-100 text-emerald-700" :
                          roleStr === 'exposant' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {roleStr}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={cn(
                          "flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest",
                          isSuspended ? "text-red-500" : "text-emerald-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", isSuspended ? "bg-red-500" : "bg-emerald-500")} />
                          <span>{statusStr}</span>
                        </span>
                      </td>
                      <td className="p-6 text-end relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === u.id ? null : u.id);
                          }}
                          className="p-2 text-gray-400 hover:text-primary transition-colors bg-white rounded-lg hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {/* Actions Dropdown */}
                        <AnimatePresence>
                          {activeMenuId === u.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute end-6 top-14 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden text-start"
                            >
                              <div className="p-2 border-b border-gray-50">
                                <p className="px-3 py-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">Changer le rôle</p>
                                {availableRoles.map(r => (
                                  <button
                                    key={r}
                                    onClick={() => handleUpdateRole(u.id, isSuspended ? r + '_suspended' : r)}
                                    className={cn(
                                      "w-full text-start px-3 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors",
                                      roleStr === r ? "bg-primary/5 text-primary" : "text-gray-500 hover:bg-gray-50"
                                    )}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                              <div className="p-2">
                                <p className="px-3 py-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">Statut</p>
                                {isSuspended ? (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'reactivate')}
                                    className="w-full flex items-center space-x-2 text-start px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Réactiver compte</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'suspend')}
                                    className="w-full flex items-center space-x-2 text-start px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Suspendre compte</span>
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserToDelete(u.id);
                                    setIsDeleteConfirmOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="mt-1 w-full flex items-center space-x-2 text-start px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash className="h-3 w-3" />
                                  <span>Supprimer compte</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-50 hover:text-primary hover:border-gray-200 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-50 hover:text-primary hover:border-gray-200 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-primary uppercase italic mb-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 font-medium mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action supprimera également toutes les données associées (entreprises, produits, messages) et ne peut pas être annulée.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold uppercase text-xs hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setUserDetails(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                className="absolute top-6 end-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-8 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-black text-white text-2xl uppercase">
                  {selectedUser.name ? selectedUser.name.charAt(0) : '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary uppercase italic">{selectedUser.name}</h2>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{selectedUser.email}</p>
                </div>
              </div>

              {!userDetails ? (
                <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">Chargement des détails...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profil */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Informations Profil</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Rôle</span>
                        <p className="text-sm font-black text-primary uppercase">{getDisplayRole(userDetails.profile.role)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Statut</span>
                        <p className={cn("text-sm font-black uppercase", userDetails.profile.role.endsWith('_suspended') ? "text-red-500" : "text-emerald-500")}>
                          {userDetails.profile.role.endsWith('_suspended') ? 'Suspendu' : 'Actif'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Date d'inscription</span>
                        <p className="text-sm font-bold text-primary">{new Date(userDetails.profile.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Entreprises */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Entreprises Associées ({userDetails.companies.length})</h3>
                    <div className="space-y-3">
                      {userDetails.companies.length === 0 ? (
                        <p className="text-xs text-gray-400 font-bold">Aucune entreprise</p>
                      ) : (
                        userDetails.companies.map((c: any) => (
                          <div key={c.id} className="bg-gray-50 p-4 rounded-2xl">
                            <p className="text-sm font-black text-primary uppercase">{c.name}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">RC: {c.rc || '-'} | NIF: {c.nif || '-'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Statistiques Activité */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Statistiques d'Activité</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <p className="text-2xl font-black text-blue-600">{userDetails.products.length}</p>
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Produits au catalogue</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-2xl">
                        <p className="text-2xl font-black text-purple-600">{userDetails.messages.length}</p>
                        <p className="text-[10px] font-bold text-purple-800 uppercase tracking-widest">Messages échangés</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

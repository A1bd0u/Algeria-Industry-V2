import fs from 'fs';

let content = fs.readFileSync('src/pages/console/views/GovUsers.tsx', 'utf-8');

// 1. Items per page
content = content.replace('const itemsPerPage = 10;', 'const itemsPerPage = 20;');

// 2. Date filter state
content = content.replace(
  "const [statusFilter, setStatusFilter] = useState('Tous');",
  "const [statusFilter, setStatusFilter] = useState('Tous');\n  const [dateFilter, setDateFilter] = useState('Tous');\n  const [selectedUser, setSelectedUser] = useState<any>(null);\n  const [userDetails, setUserDetails] = useState<any>(null);\n  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);\n  const [userToDelete, setUserToDelete] = useState<string | null>(null);"
);

// 3. User actions handling
content = content.replace(
  "// Filtering",
  `
  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(\`/api/users/\${userId}\`, { method: 'DELETE' });
      if (res.ok) {
        showNotify("Utilisateur supprimé", "success");
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
      const res = await fetch(\`/api/users/\${userId}/details\`);
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

  // Filtering`
);

// 4. Filtering logic
content = content.replace(
  "return matchesSearch && matchesRole && matchesStatus;",
  `    let matchesDate = true;
    if (dateFilter !== 'Tous' && u.created_at) {
      const created = new Date(u.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'Aujourd\\'hui') matchesDate = diffDays <= 1;
      else if (dateFilter === '7 jours') matchesDate = diffDays <= 7;
      else if (dateFilter === '30 jours') matchesDate = diffDays <= 30;
      else if (dateFilter === 'Cette année') matchesDate = created.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDate;`
);

// 5. Add Date Filter Dropdown
content = content.replace(
  `<option value="Suspendu">Suspendus</option>
          </select>
        </div>`,
  `<option value="Suspendu">Suspendus</option>
          </select>

          <select 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-secondary text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
          >
            <option value="Tous">Toutes les dates</option>
            <option value="Aujourd'hui">Aujourd'hui</option>
            <option value="7 jours">7 derniers jours</option>
            <option value="30 jours">30 derniers jours</option>
            <option value="Cette année">Cette année</option>
          </select>
        </div>`
);

// 6. Delete Action Button in Menu
content = content.replace(
  `<button
                                    onClick={() => handleUpdateStatus(u.id, 'suspend')}
                                    className="w-full flex items-center space-x-2 text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Suspendre compte</span>
                                  </button>
                                )}`,
  `<button
                                    onClick={() => handleUpdateStatus(u.id, 'suspend')}
                                    className="w-full flex items-center space-x-2 text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Suspendre compte</span>
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    setUserToDelete(u.id);
                                    setIsDeleteConfirmOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="mt-1 w-full flex items-center space-x-2 text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash className="h-3 w-3" />
                                  <span>Supprimer compte</span>
                                </button>
                              }`
);

// 7. Modals
content = content.replace(
  `</motion.div>
  );
}`,
  `
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
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
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
}`
);

// 8. onClick handler for the table row
content = content.replace(
  `                    <tr key={u.id || i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6">`,
  `                    <tr key={u.id || i} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleRowClick(u)}>
                      <td className="p-6">`
);

fs.writeFileSync('src/pages/console/views/GovUsers.tsx', content);

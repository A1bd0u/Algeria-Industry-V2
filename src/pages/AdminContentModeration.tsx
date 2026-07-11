import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AdminContentModeration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; type: 'product' | 'tender' } | null>(null);

  // Fetch Products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.data || data;
    }
  });

  // Fetch Tenders
  const { data: tenders = [], isLoading: loadingTenders } = useQuery({
    queryKey: ['admin-tenders'],
    queryFn: async () => {
      const res = await fetch('/api/tenders');
      if (!res.ok) throw new Error('Failed to fetch tenders');
      const data = await res.json();
      return data.data || data;
    }
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, type, currentStatus }: { id: string, type: 'product' | 'tender', currentStatus: string }) => {
      let newStatus = '';
      if (type === 'product') {
        newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus }) // we need to check if /api/products/:id supports status only update.
          // Wait, typically PUT replaces. Let's use the full object or see if a specific status route exists.
        });
        if (!res.ok) throw new Error('Failed to update product');
      } else {
        newStatus = currentStatus === 'open' ? 'closed' : 'open';
        const res = await fetch(`/api/tenders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Failed to update tender');
      }
      return { id, type, newStatus };
    },
    onMutate: async (variables) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['admin-products'] });
      await queryClient.cancelQueries({ queryKey: ['admin-tenders'] });

      const prevProducts = queryClient.getQueryData(['admin-products']);
      const prevTenders = queryClient.getQueryData(['admin-tenders']);

      if (variables.type === 'product') {
        queryClient.setQueryData(['admin-products'], (old: any[]) =>
          old?.map(p => p.id === variables.id ? { ...p, status: variables.currentStatus === 'active' ? 'inactive' : 'active' } : p)
        );
      } else {
        queryClient.setQueryData(['admin-tenders'], (old: any[]) =>
          old?.map(t => t.id === variables.id ? { ...t, status: variables.currentStatus === 'open' ? 'closed' : 'open' } : t)
        );
      }

      return { prevProducts, prevTenders };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-products'], context?.prevProducts);
      queryClient.setQueryData(['admin-tenders'], context?.prevTenders);
      alert(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'product' | 'tender' }) => {
      const endpoint = type === 'product' ? `/api/products/${id}` : `/api/tenders/${id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      return { id, type };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['admin-products'] });
      await queryClient.cancelQueries({ queryKey: ['admin-tenders'] });
      
      const prevProducts = queryClient.getQueryData(['admin-products']);
      const prevTenders = queryClient.getQueryData(['admin-tenders']);

      if (variables.type === 'product') {
        queryClient.setQueryData(['admin-products'], (old: any[]) => old?.filter(p => p.id !== variables.id));
      } else {
        queryClient.setQueryData(['admin-tenders'], (old: any[]) => old?.filter(t => t.id !== variables.id));
      }

      return { prevProducts, prevTenders };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-products'], context?.prevProducts);
      queryClient.setQueryData(['admin-tenders'], context?.prevTenders);
      alert(err.message);
    },
    onSettled: () => {
      setDeleteModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
    }
  });

  const combinedData = useMemo(() => {
    const formattedProducts = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: 'product' as const,
      status: p.status || 'active',
      created_at: p.created_at
    }));

    const formattedTenders = tenders.map((t: any) => ({
      id: t.id,
      name: t.title,
      type: 'tender' as const,
      status: t.status || 'open',
      created_at: t.created_at
    }));

    return [...formattedProducts, ...formattedTenders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }, [products, tenders]);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'ID / Nom',
      cell: info => (
        <div>
          <p className="font-bold text-primary">{info.getValue()}</p>
          <p className="text-[9px] text-gray-400 font-mono mt-1">{info.row.original.id}</p>
        </div>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => (
        <span className={cn(
          "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
          info.getValue() === 'product' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
        )}>
          {info.getValue() === 'product' ? 'Produit' : 'Appel d\'offres'}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Statut',
      cell: info => {
        const itemType = info.row.original.type;
        const isActive = itemType === 'product' ? info.getValue() === 'active' : info.getValue() === 'open';
        
        return (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleStatusMutation.mutate({ id: info.row.original.id, type: itemType, currentStatus: info.getValue() })}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                isActive ? "bg-secondary" : "bg-gray-300"
              )}
            >
              <span className="sr-only">Toggle status</span>
              <span
                className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                  isActive ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isActive ? "text-secondary" : "text-gray-400"
            )}>
              {isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button
          onClick={() => setDeleteModal({ isOpen: true, id: info.row.original.id, type: info.row.original.type })}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    })
  ], [toggleStatusMutation]);

  const table = useReactTable({
    data: combinedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center space-x-4 sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate('/extranet')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-black text-primary uppercase tracking-tight">Modération du contenu</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">50 derniers ajouts</p>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {loadingProducts || loadingTenders ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setDeleteModal(null)}
                className="absolute top-4 end-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">Supprimer ce contenu ?</h3>
              <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
                Cette action est irréversible. Le {deleteModal.type === 'product' ? 'produit' : 'appel d\'offres'} sera définitivement supprimé de la plateforme.
              </p>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 py-3 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteMutation.mutate({ id: deleteModal.id, type: deleteModal.type })}
                  className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-md flex justify-center items-center"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

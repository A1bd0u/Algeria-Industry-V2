import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

// Nombre de messages reçus non lus, pour les pastilles du menu.
// La messagerie invalide la clé 'messages-unread' quand une conversation est lue.
export function useUnreadMessages(): number {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<{ count: number }>({
    queryKey: ['messages-unread'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count');
      if (!res.ok) throw new Error('Compteur indisponible');
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  return isAuthenticated ? data?.count || 0 : 0;
}

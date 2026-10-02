import { Building2, Home, MessageSquare, Package, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// Barre d'onglets en bas d'écran sur mobile : les cinq destinations
// principales restent à portée de pouce.
const MobileTabBar = () => {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const { isAuthenticated } = useAuth();
  const messagesPath = '/dashboard?tab=messages';

  const tabs = [
    { to: '/', label: t('nav.home'), icon: Home, active: pathname === '/' },
    { to: '/products', label: t('nav.products'), icon: Package, active: pathname.startsWith('/products') },
    { to: '/directory', label: t('nav.suppliers'), icon: Building2, active: pathname.startsWith('/directory') },
    {
      to: isAuthenticated ? messagesPath : `/login?redirect=${encodeURIComponent(messagesPath)}`,
      label: t('messages.title'),
      icon: MessageSquare,
      active: pathname === '/dashboard' && search.includes('tab=messages'),
    },
    {
      to: isAuthenticated ? '/dashboard' : '/login',
      label: isAuthenticated ? t('nav.my_profile') : t('nav.login'),
      icon: UserCircle,
      active: (pathname === '/dashboard' && !search.includes('tab=messages')) || pathname === '/login',
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      aria-label={t('nav.mobileTabs')}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              to={tab.to}
              aria-current={tab.active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-16 text-[10px] leading-tight font-bold transition-colors',
                tab.active ? 'text-secondary' : 'text-gray-500 hover:text-primary'
              )}
            >
              <tab.icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full px-0.5 text-center">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileTabBar;

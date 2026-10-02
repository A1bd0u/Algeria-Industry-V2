import { cn } from '../../lib/utils';

// Logo de la marque : même dessin que l'icône d'onglet (public/favicon.svg),
// repris dans la navigation, le pied de page et les e-mails.
export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="12" fill="#1a1a1a" />
    <path d="M14 50 L28 14 H36 L50 50 H41 L38 41 H26 L23 50 Z M29 33 H35 L32 24 Z" fill="#ffffff" />
    <rect x="14" y="54" width="36" height="4" fill="#ff6b00" />
  </svg>
);

interface LogoProps {
  className?: string;
  // Fond sombre (navigation, pied de page) ou clair.
  tone?: 'dark' | 'light';
  compact?: boolean;
}

const Logo = ({ className, tone = 'dark', compact = false }: LogoProps) => (
  <span className={cn('inline-flex items-center gap-3', className)}>
    <LogoMark className={cn('h-10 w-10', tone === 'dark' && 'ring-1 ring-white/15 rounded-xl')} />
    {!compact && (
      <span className="flex flex-col leading-none" dir="ltr">
        <span className={cn('text-[15px] font-black tracking-tight', tone === 'dark' ? 'text-white' : 'text-primary')}>Algeria</span>
        <span className="text-[15px] font-black tracking-tight text-secondary">Industry</span>
      </span>
    )}
  </span>
);

export default Logo;

import { cn } from '../../lib/utils';

// Logo icomexpo : un « i » dont le point est un produit posé sur un socle de présentoir (« expo »),
// sur un carré orange, la couleur de la marque. Même dessin que l'icône d'onglet (public/favicon.svg)
// et les icônes d'application (public/icon-*.png).
export const BRAND_ORANGE = '#ff6b00';

export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="14" fill={BRAND_ORANGE} />
    <rect x="25.5" y="10" width="13" height="13" rx="3" fill="#ffffff" />
    <rect x="26.5" y="27" width="11" height="20" rx="2.5" fill="#ffffff" />
    <rect x="16" y="46" width="32" height="7" rx="3.5" fill="#ffffff" />
  </svg>
);

interface LogoProps {
  className?: string;
  // Fond sombre (navigation, pied de page) ou clair.
  tone?: 'dark' | 'light';
  compact?: boolean;
}

const Logo = ({ className, tone = 'dark', compact = false }: LogoProps) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <LogoMark className={cn('h-10 w-10', tone === 'dark' && 'ring-1 ring-white/15 rounded-[10px]')} />
    {!compact && (
      <span
        dir="ltr"
        // Orange plus clair sur fond sombre, plus foncé sur fond clair (contraste AA).
        className={cn('text-[22px] font-black tracking-[-0.03em] leading-none', tone === 'dark' ? 'text-[#ff7a1a]' : 'text-[#c44700]')}
      >
        icomexpo
      </span>
    )}
  </span>
);

export default Logo;

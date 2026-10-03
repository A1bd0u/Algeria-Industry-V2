import { cn } from '../../lib/utils';

// Logo Industigo : un « i » dont le point est une flèche qui avance (« go »),
// sur un carré orange, la couleur de la marque. Même dessin que l'icône d'onglet (public/favicon.svg)
// et les icônes d'application (public/icon-*.png).
export const BRAND_ORANGE = '#ff6b00';

export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="14" fill={BRAND_ORANGE} />
    <rect x="22" y="31" width="11" height="22" rx="2.5" fill="#ffffff" />
    <path d="M22 11h11l10 8.5L33 28H22l7.5-8.5z" fill="#ffffff" />
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
        industigo
      </span>
    )}
  </span>
);

export default Logo;

import type { ReactNode } from 'react';

// Pictogrammes dessinés pour la plateforme : trait fin, aplat orange léger,
// vocabulaire industriel (lingots, engrenage, écrou, casque, carton, carte de
// l'Algérie). Le trait suit `currentColor`, l'aplat la couleur d'accent.

type IconProps = { className?: string; title?: string };

const ACCENT = 'fill-secondary/20';

const Svg = ({ className, title, children }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
  >
    {title && <title>{title}</title>}
    {children}
  </svg>
);

// Engrenage à 8 dents calculé une fois.
const GEAR_PATH = (() => {
  const teeth = 8;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i * 2 * Math.PI) / teeth;
    const step = (2 * Math.PI) / teeth;
    const at = (r: number, angle: number) => `${(12 + r * Math.cos(angle)).toFixed(2)} ${(12 + r * Math.sin(angle)).toFixed(2)}`;
    pts.push(at(7, a - step * 0.32), at(9.4, a - step * 0.18), at(9.4, a + step * 0.18), at(7, a + step * 0.32));
  }
  return `M${pts.join('L')}Z`;
})();

/** A — Matières premières : lingots empilés. */
export const RawMaterialsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.2 13 8.7 7.5h6.6l1.5 5.5Z" className={ACCENT} />
    <path d="M2.5 18.5 4 13h7l1.5 5.5Z" />
    <path d="M11.5 18.5 13 13h7l1.5 5.5Z" />
    <path d="M7.2 13 8.7 7.5h6.6l1.5 5.5M2 21h20" />
  </Svg>
);

/** B — Équipements et machines : engrenage. */
export const MachineryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={GEAR_PATH} className={ACCENT} />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </Svg>
);

/** C — Composants et pièces : écrou hexagonal. */
export const ComponentsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M12 3.5 19.4 7.75v8.5L12 20.5l-7.4-4.25v-8.5ZM8.4 12a3.6 3.6 0 1 0 7.2 0 3.6 3.6 0 1 0-7.2 0Z"
      fillRule="evenodd"
      className={ACCENT}
    />
    <circle cx="12" cy="12" r="3.6" />
  </Svg>
);

/** D — Services aux entreprises : casque de chantier. */
export const ServicesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 15.5V14a7.5 7.5 0 0 1 15 0v1.5Z" className={ACCENT} />
    <path d="M10 6.8V5.5h4v1.3M10 6.8V12M14 6.8V12" />
    <path d="M2.5 15.5h19v1.2a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8Z" />
  </Svg>
);

/** E — Consommables et fournitures : carton scellé. */
export const SuppliesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 20 7.5 12 12 4 7.5Z" className={ACCENT} />
    <path d="M4 7.5v9L12 21l8-4.5v-9M12 12v9" />
    <path d="m8 5.25 8 4.5v3.4" />
  </Svg>
);

/** Registre du commerce vérifié : document et sceau. */
export const VerifiedRegistryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H5.5v18H11M14 3l4 4v5" />
    <path d="M14 3v4h4M8.5 10h6.5M8.5 13.5h4" />
    <circle cx="16.5" cy="17.5" r="4" className="fill-white" />
    <circle cx="16.5" cy="17.5" r="4" className={ACCENT} />
    <path d="m14.8 17.6 1.2 1.2 2.3-2.5" />
  </Svg>
);

/** Vitrine gratuite : boutique. */
export const StorefrontIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 9 5 4h14l2 5Z" className={ACCENT} />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 11.5V20h14v-8.5M10 20v-5h4v5" />
  </Svg>
);

/** 58 wilayas : silhouette de l'Algérie, repère sur Alger. */
export const AlgeriaMapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M8.2 5.3 11.2 4l1.9-.3 5.3-.1-.2 2.3-.8 1.2 1.8 2.9.4 3.4 2 2.9-5.8 3.9-1.5.3-8.6-5.6L2 12.7v-1.3l4.8-1.4 2.3-1.8-.5-1.2Z"
      className={ACCENT}
    />
    <circle cx="13.2" cy="5.4" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

/** Trois langues : bulles latine et arabe. */
export const LanguagesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 3h8A2 2 0 0 1 14.5 5v5a2 2 0 0 1-2 2H7l-3 2.5V12a2 2 0 0 1-1.5-2V5a2 2 0 0 1 2-2Z" />
    <path d="M11.5 10h8a2 2 0 0 1 2 2v5a2 2 0 0 1-1.5 2v2.5L17 19h-5.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" className="fill-white" />
    <path d="M11.5 10h8a2 2 0 0 1 2 2v5a2 2 0 0 1-1.5 2v2.5L17 19h-5.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" className={ACCENT} />
    <path d="m6.3 9.5 2.2-5 2.2 5M7.1 7.8h2.8" />
    <path d="M17.8 13c-.2 1.3-1 2.4-2.4 2.4-.9 0-1.4-.5-1.4-1.1 0-.7.6-1.1 1.3-1.1h2.5" />
  </Svg>
);

const SECTOR_ICONS: Record<string, (p: IconProps) => ReturnType<typeof Svg>> = {
  A: RawMaterialsIcon,
  B: MachineryIcon,
  C: ComponentsIcon,
  D: ServicesIcon,
  E: SuppliesIcon,
};

/** Pictogramme d'un grand secteur (A à E). */
export const SectorIcon = ({ id, ...p }: IconProps & { id: string }) => {
  const Icon = SECTOR_ICONS[id] || SuppliesIcon;
  return <Icon {...p} />;
};

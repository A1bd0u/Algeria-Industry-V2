import type { ReactNode } from 'react';

// Pictogrammes dessinés pour la plateforme : trait fin, aplat orange léger,
// vocabulaire industriel (épi, grue, derrick, engrenage, fiole, puce, écran,
// camion, carte de l'Algérie). Le trait suit `currentColor`, l'aplat la couleur d'accent.

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

/** A — Agroalimentaire et agriculture : épi de blé. */
export const AgriFoodIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21V8" />
    <path d="M12 8c-2.4-.6-3.6-2.4-3.6-4.8 2.4.6 3.6 2.4 3.6 4.8ZM12 8c2.4-.6 3.6-2.4 3.6-4.8-2.4.6-3.6 2.4-3.6 4.8Z" className={ACCENT} />
    <path d="M12 13c-2.4-.6-3.6-2.4-3.6-4.8 2.4.6 3.6 2.4 3.6 4.8ZM12 13c2.4-.6 3.6-2.4 3.6-4.8-2.4.6-3.6 2.4-3.6 4.8Z" />
    <path d="M12 18c-2.4-.6-3.6-2.4-3.6-4.8 2.4.6 3.6 2.4 3.6 4.8ZM12 18c2.4-.6 3.6-2.4 3.6-4.8-2.4.6-3.6 2.4-3.6 4.8Z" />
  </Svg>
);

/** B — BTP et matériaux : mur de briques et grue. */
export const ConstructionIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 15h9v6H3Z" className={ACCENT} />
    <path d="M3 15h9v6H3ZM3 18h9M7.5 15v3M5 18v3M10 18v3" />
    <path d="M16 21V4h-1.5M16 4h5.5M16 4l-3 3.5h8.5M19 7.5v3" />
    <path d="M18 10.5h2v1.8h-2Z" />
  </Svg>
);

/** C — Énergie, mines et hydrocarbures : derrick et éclair. */
export const EnergyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8.5 3-4 18M8.5 3l4 18M6.6 11h3.8M5.5 16h6" />
    <path d="M3 21h11" />
    <path d="m17.5 6-2.5 5h3.5L16 17" className={ACCENT} />
    <path d="m17.5 6-2.5 5h3.5L16 17" />
  </Svg>
);

/** D — Mécanique, métallurgie et machines : engrenage. */
export const MachineryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={GEAR_PATH} className={ACCENT} />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </Svg>
);

/** E — Chimie, plasturgie et pharmacie : fiole. */
export const ChemistryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.2 15.5h11.6l1.6 3a1.6 1.6 0 0 1-1.4 2.5H6a1.6 1.6 0 0 1-1.4-2.5Z" className={ACCENT} />
    <path d="M9.5 3h5M10.5 3v6.2L4.6 18.5A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.4-2.5L13.5 9.2V3" />
    <path d="M10 18h.01M14 17.5h.01" />
  </Svg>
);

/** F — Électrique, électronique et automatisme : puce. */
export const ElectronicsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 9h6v6H9Z" className={ACCENT} />
    <path d="M6 6h12v12H6ZM9 9h6v6H9Z" />
    <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
  </Svg>
);

/** G — Numérique et technologies : écran et balises de code. */
export const DigitalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 4.5h18v11.5H3Z" className={ACCENT} />
    <path d="M3 4.5h18v11.5H3ZM9 20h6M12 16v4" />
    <path d="m9.5 8-2.5 2.2 2.5 2.3M14.5 8l2.5 2.2-2.5 2.3" />
  </Svg>
);

/** H — Services, logistique et emballage : camion. */
export const LogisticsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 6h11v10h-11Z" className={ACCENT} />
    <path d="M2.5 6h11v10h-11ZM13.5 9.5h4l3 3.5v3h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" className="fill-white" />
    <circle cx="17" cy="17.5" r="1.8" className="fill-white" />
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
  A: AgriFoodIcon,
  B: ConstructionIcon,
  C: EnergyIcon,
  D: MachineryIcon,
  E: ChemistryIcon,
  F: ElectronicsIcon,
  G: DigitalIcon,
  H: LogisticsIcon,
};

/** Pictogramme d'un grand secteur (A à H). */
export const SectorIcon = ({ id, ...p }: IconProps & { id: string }) => {
  const Icon = SECTOR_ICONS[id] || LogisticsIcon;
  return <Icon {...p} />;
};

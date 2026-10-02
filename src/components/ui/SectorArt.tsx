import type { ReactElement } from 'react';
import { cn } from '../../lib/utils';

// Illustrations au trait des cinq secteurs (style plan technique), en
// currentColor : elles prennent la couleur du conteneur et restent légères.
// Décoratives : masquées aux lecteurs d'écran.

const gearTeeth = (cx: number, cy: number, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r + 8);
    const y2 = cy + Math.sin(a) * (r + 8);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={6} strokeLinecap="round" />;
  });

const ART: Record<string, ReactElement> = {
  // Matières premières : bobine d'acier et profilés
  A: (
    <>
      <circle cx="140" cy="62" r="34" />
      <circle cx="140" cy="62" r="22" />
      <circle cx="140" cy="62" r="8" />
      <path d="M20 92h80M20 100h80M28 92v8M92 92v8" />
      <path d="M24 62h56v8H24zM44 54h16v24H44z" />
      <path d="M20 30h50l10 10H30z" />
    </>
  ),
  // Machines : engrenage et presse
  B: (
    <>
      <circle cx="62" cy="62" r="26" />
      <circle cx="62" cy="62" r="9" />
      {gearTeeth(62, 62, 26, 10)}
      <path d="M118 22h56v12h-56zM132 34v30M160 34v30M124 64h44v14h-44zM112 96h68" />
      <path d="M146 78v10" strokeDasharray="3 4" />
    </>
  ),
  // Composants : circuit et roulement
  C: (
    <>
      <rect x="26" y="34" width="56" height="56" rx="6" />
      <rect x="40" y="48" width="28" height="28" rx="3" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M${34 + i * 13} 34v-10M${34 + i * 13} 90v10M26 ${42 + i * 13}h-10M82 ${42 + i * 13}h10`} />
        </g>
      ))}
      <circle cx="146" cy="62" r="32" />
      <circle cx="146" cy="62" r="14" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={146 + Math.cos(a) * 23} cy={62 + Math.sin(a) * 23} r="4" />;
      })}
    </>
  ),
  // Services et logistique : camion et itinéraire
  D: (
    <>
      <path d="M18 40h82v42H18zM100 54h28l16 16v12h-44z" />
      <circle cx="42" cy="88" r="9" />
      <circle cx="122" cy="88" r="9" />
      <path d="M10 104h170" strokeDasharray="10 8" />
      <circle cx="170" cy="30" r="10" />
      <path d="M170 40v14M150 30h-12" />
    </>
  ),
  // Consommables : casque et clé
  E: (
    <>
      <path d="M22 80c0-26 18-44 42-44s42 18 42 44" />
      <path d="M14 80h100v8H14zM64 36v-8M48 42l-4-8M80 42l4-8" />
      <path d="M134 96l34-34" strokeWidth={8} strokeLinecap="round" />
      <path d="M160 42a14 14 0 1 0 14 22l-8-8 4-8 8 2a14 14 0 0 0-18-8z" />
    </>
  ),
};

const SectorArt = ({ group, className }: { group: string; className?: string }) => (
  <svg
    viewBox="0 0 190 120"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={cn('pointer-events-none', className)}
  >
    {ART[group] || ART.B}
  </svg>
);

export default SectorArt;

import type React from 'react';
import { cn } from '../../lib/utils';

// État vide illustré : un dessin au trait, un titre, une explication et une
// action claire, à la place d'un simple texte gris.

type Illustration = 'search' | 'box' | 'messages' | 'heart' | 'document';

const DRAWINGS: Record<Illustration, React.ReactNode> = {
  search: (
    <>
      <circle cx="70" cy="58" r="30" />
      <path d="M92 80l26 26" strokeWidth={8} strokeLinecap="round" />
      <path d="M56 50h28M56 62h18" />
    </>
  ),
  box: (
    <>
      <path d="M40 48l50-20 50 20-50 20z" />
      <path d="M40 48v46l50 20 50-20V48M90 68v46" />
      <path d="M65 38l50 20" strokeDasharray="4 5" />
    </>
  ),
  messages: (
    <>
      <path d="M32 34h70a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H58l-18 14V84h-8a8 8 0 0 1-8-8V42a8 8 0 0 1 8-8z" />
      <path d="M118 56h22a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8h-6v12l-14-12h-16" />
      <path d="M46 52h46M46 64h30" />
    </>
  ),
  heart: (
    <>
      <path d="M90 108S44 82 44 54a22 22 0 0 1 46-10 22 22 0 0 1 46 10c0 28-46 54-46 54z" />
      <path d="M150 30l6 6M150 36l6-6M30 92l5 5M30 97l5-5" />
    </>
  ),
  document: (
    <>
      <path d="M58 24h48l22 22v70H58z" />
      <path d="M106 24v22h22M72 64h42M72 78h42M72 92h28" />
    </>
  ),
};

interface EmptyStateProps {
  illustration?: Illustration;
  title: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ illustration = 'search', title, text, children, className }) => (
  <div className={cn('rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center', className)}>
    <div className="relative mx-auto mb-6 h-28 w-44">
      <div className="absolute inset-x-6 bottom-0 h-16 rounded-full bg-secondary/10 blur-xl" />
      <svg viewBox="0 0 180 130" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round"
        className="relative h-full w-full text-secondary" aria-hidden="true" focusable="false">
        {DRAWINGS[illustration]}
      </svg>
    </div>
    <h2 className="text-xl font-black text-primary mb-2">{title}</h2>
    {text && <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">{text}</p>}
    {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
  </div>
);

export default EmptyState;

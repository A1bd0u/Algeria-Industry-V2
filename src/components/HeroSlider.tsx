import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, ChevronLeft, ChevronRight, Megaphone, Pause, Play, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAdTargeting } from '../context/AdTargetingContext';
import type { AdPlacement } from '../data/adPlacements';
import { cn } from '../lib/utils';

// Bandeau publicitaire : annonces publiées depuis la console admin et ciblant
// la page (groupe de pages et catégories produit). Sans annonce, il présente la
// plateforme (inscription, offre fondateur, emplacement publicitaire), sur
// l'accueil seulement. Grand format sur l'accueil, compact ailleurs. Une
// annonce est soit un modèle (textes posés sur un visuel), soit une bannière
// image affichée telle quelle.

interface Ad {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  mobile_image_url?: string | null;
  display_mode?: 'template' | 'banner' | null;
  logo_url?: string | null;
  brand_name?: string | null;
  cta_label?: string | null;
  url?: string | null;
}

interface SlideView {
  key: string;
  adId?: string;
  title: string;
  subtitle?: string;
  image?: string;
  mobileImage?: string;
  banner?: boolean;
  logo?: string;
  brand?: string;
  cta: string;
  href?: string;
  icon?: React.ElementType;
  tint: string;
}

const AUTOPLAY_MS = 7000;

const isExternal = (href: string) => /^https?:\/\//.test(href);

const trackClick = (adId: string) => {
  const url = `/api/campaigns/${adId}/click`;
  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch {
    // sendBeacon indisponible : repli sur fetch.
  }
  fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
};

// Bannière image : visuel complet (textes inclus), version mobile facultative,
// toute la surface est cliquable. Le texte alternatif est le titre de l'annonce.
const BannerImage: React.FC<{ slide: SlideView; eager: boolean; sponsored: string; onClick: () => void }> = ({
  slide, eager, sponsored, onClick,
}) => {
  const picture = (
    <picture>
      {slide.mobileImage && <source media="(max-width: 767px)" srcSet={slide.mobileImage} />}
      <img
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
  const badge = (
    <span className="absolute top-2 start-2 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
      {sponsored}
    </span>
  );
  if (!slide.href) return <>{picture}{badge}</>;
  return isExternal(slide.href) ? (
    <a href={slide.href} target="_blank" rel="noopener noreferrer sponsored" onClick={onClick} className="absolute inset-0 block">
      {picture}{badge}
    </a>
  ) : (
    <Link to={slide.href} onClick={onClick} className="absolute inset-0 block">
      {picture}{badge}
    </Link>
  );
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HeroSlider: React.FC<{ placement: AdPlacement }> = ({ placement }) => {
  const { t } = useTranslation();
  const categories = useAdTargeting();
  const compact = placement !== 'home';
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<number | null>(null);

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ['ads', placement, categories.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({ placement });
      if (categories.length) params.set('categories', categories.join(','));
      const res = await fetch(`/api/campaigns?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
    // Garde l'annonce affichée pendant le rechargement (changement de page).
    placeholderData: (previous) => previous,
  });

  const slides: SlideView[] = ads.length > 0
    ? ads.map((ad) => ({
        key: ad.id,
        adId: ad.id,
        title: ad.title,
        subtitle: ad.subtitle || undefined,
        image: ad.image_url || undefined,
        mobileImage: ad.mobile_image_url || undefined,
        banner: ad.display_mode === 'banner' && Boolean(ad.image_url),
        logo: ad.logo_url || undefined,
        brand: ad.brand_name || undefined,
        cta: ad.cta_label || t('slides.learnMore'),
        href: ad.url || undefined,
        tint: 'from-primary to-accent',
      }))
    : [
        { key: 'listing', title: t('slides.listing.title'), subtitle: t('slides.listing.subtitle'), cta: t('slides.listing.cta'), href: '/register', icon: Building2, tint: 'from-primary to-accent' },
        { key: 'founder', title: t('slides.founder.title'), subtitle: t('slides.founder.subtitle'), cta: t('slides.founder.cta'), href: '/tarifs', icon: Sparkles, tint: 'from-primary to-[#3a1d00]' },
        { key: 'advertise', title: t('slides.advertise.title'), subtitle: t('slides.advertise.subtitle'), cta: t('slides.advertise.cta'), href: '/ads-request', icon: Megaphone, tint: 'from-accent to-primary' },
      ];

  const count = slides.length;
  const index = count ? current % count : 0;
  const slide = slides[index];
  const isAd = Boolean(slide?.adId);

  const go = useCallback((delta: number) => setCurrent((c) => (c + delta + count) % count), [count]);

  useEffect(() => {
    if (paused || hovered || count < 2) return;
    const timer = window.setInterval(() => setCurrent((c) => (c + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, hovered, count]);

  // Sans annonceur, l'auto-promotion d'Industigo n'occupe que l'accueil : sur
  // les autres pages, le bandeau n'apparaît que pour une annonce payante.
  if (!slide || (compact && ads.length === 0)) return null;

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    // En RTL, glisser vers la gauche ramène à l'annonce précédente.
    const rtl = document.documentElement.dir === 'rtl';
    go((dx < 0) !== rtl ? 1 : -1);
  };

  const ctaClass = cn(
    'inline-flex items-center gap-2 bg-secondary text-white rounded-lg text-sm font-bold hover:bg-white hover:text-primary transition-colors whitespace-nowrap',
    compact ? 'px-3 py-1.5' : 'px-4 py-2 md:px-5 md:py-2.5',
  );
  const ctaContent = (
    <>
      {slide.cta}
      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
    </>
  );
  const onCta = () => { if (slide.adId) trackClick(slide.adId); };

  const Icon = slide.icon;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('slides.label')}
      // Proportions des bannières image : accueil 5:1 (16:9 sur mobile), autres
      // pages 8:1 (3:1 sur mobile). Voir BANNER_FORMATS.
      className={cn(
        'relative w-full overflow-hidden bg-primary',
        compact
          ? 'aspect-[3/1] md:aspect-[8/1] md:min-h-[112px] max-h-[260px]'
          : 'aspect-[16/9] md:aspect-[5/1] md:min-h-[200px] max-h-[420px]',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={slide.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn('absolute inset-0 bg-gradient-to-r', slide.tint)}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${count}`}
        >
          {slide.banner ? (
            <BannerImage slide={slide} eager={index === 0} sponsored={t('slides.sponsored')} onClick={onCta} />
          ) : (<>
          {slide.image && (
            <>
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              {/* Voile pour garder le texte lisible sur n'importe quel visuel. */}
              <div className="absolute inset-0 bg-black/65 md:bg-transparent md:bg-gradient-to-r md:rtl:bg-gradient-to-l from-black/80 via-black/50 to-black/10" />
            </>
          )}
          {!slide.image && (
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
          )}

          <div className={cn(
            'relative h-full max-w-7xl mx-auto px-4 sm:px-6 md:px-16 flex items-center',
            compact ? 'pb-5 md:pb-0 gap-4' : 'pb-7 md:pb-4 gap-8',
          )}>
            <div className={cn('flex-1 min-w-0 text-white', compact && 'md:flex md:items-center md:gap-6')}>
              <div className={cn('min-w-0', compact && 'md:flex-1')}>
              <div className={cn('flex items-center gap-2', compact ? 'mb-1' : 'mb-2')}>
                {isAd ? (
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur px-2 py-0.5 rounded">
                    {t('slides.sponsored')}
                  </span>
                ) : Icon && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/90">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                {slide.brand && <span className="text-sm font-bold text-white/90 truncate">{slide.brand}</span>}
              </div>
              <h2 className={cn(
                'font-black tracking-tight leading-tight',
                compact ? 'text-base md:text-xl line-clamp-1' : 'text-xl md:text-3xl line-clamp-2',
              )}>{slide.title}</h2>
              {slide.subtitle && (
                <p className={cn(
                  'text-white/80 max-w-xl',
                  compact ? 'max-md:hidden mt-0.5 text-sm line-clamp-1' : 'mt-1.5 text-sm md:text-base line-clamp-2',
                )}>{slide.subtitle}</p>
              )}
              </div>
              {slide.href && (
                <div className={compact ? 'mt-2 md:mt-0 shrink-0' : 'mt-3 md:mt-4'}>
                  {isExternal(slide.href) ? (
                    <a href={slide.href} target="_blank" rel="noopener noreferrer sponsored" onClick={onCta} className={ctaClass}>
                      {ctaContent}
                    </a>
                  ) : (
                    <Link to={slide.href} onClick={onCta} className={ctaClass}>
                      {ctaContent}
                    </Link>
                  )}
                </div>
              )}
            </div>

            {slide.logo && (
              <div className={cn(
                'hidden md:flex shrink-0 items-center justify-center bg-white shadow-xl',
                compact ? 'h-16 w-28 rounded-xl p-2.5' : 'h-24 w-40 lg:h-28 lg:w-48 rounded-2xl p-4',
              )}>
                <img src={slide.logo} alt={slide.brand || ''} className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            )}
          </div>
          </>)}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('slides.prev')}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 start-3 h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/50 transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('slides.next')}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 end-3 h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/50 transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>

          <div className={cn('absolute inset-x-0 z-10 flex items-center justify-center gap-2', compact ? 'bottom-0.5' : 'bottom-3')}>
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={t('slides.goTo', { n: i + 1 })}
                aria-current={i === index}
                className="p-1.5"
              >
                <span className={cn('block h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-secondary' : 'w-1.5 bg-white/50 hover:bg-white/80')} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? t('slides.play') : t('slides.pause')}
              className="ms-1 p-1 text-white/70 hover:text-white"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;

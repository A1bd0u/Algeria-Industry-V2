import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slide } from '../constants/slides';
import { cn } from '../lib/utils';

interface HeroSliderProps {
  slides: Slide[];
}

const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [dynamicSlides, setDynamicSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          // Filter ads that are validated
          const activeAds = data.filter((ad: any) => 
            ['Actif', 'published', 'approuvée', 'Approuvé'].includes(ad.status)
          );
          
          const formattedSlides: Slide[] = activeAds.map((ad: any) => ({
            id: ad.id,
            bgGradient: ad.bg_gradient || 'from-primary to-primary/90',
            productImg: ad.image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
            title: ad.title,
            subtitle: ad.subtitle || 'Espace Publicitaire',
            description: ad.description || ad.objective || 'Découvrez les offres de nos partenaires.',
            brandLogo: ad.brand_logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=100',
            brandName: ad.brand_name || 'Partenaire',
            brandTagline: ad.brand_tagline || 'Sponsor Premium'
          }));
          setDynamicSlides(formattedSlides);
        }
      } catch (err) {
        console.error("Failed to fetch ads", err);
      }
    };
    fetchAds();
  }, []);

  const displaySlides = dynamicSlides.length > 0 ? [...dynamicSlides, ...slides] : slides;

  useEffect(() => {
    setCurrent(0); // Reset current slide when slides change
    if (!displaySlides || displaySlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const next = () => setCurrent((prev) => (prev + 1) % displaySlides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);

  if (!displaySlides || displaySlides.length === 0) return null;

  // Safely get the current slide to avoid "undefined" errors during transitions
  const activeSlide = displaySlides[current] || displaySlides[0];

  return (
    <div className={cn("relative h-[150px] md:h-[180px] w-full overflow-hidden bg-primary border-b border-border-tech", i18n.language === 'ar' && "font-arabic")}>
      {/* Technical Grid Background Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeSlide.id}-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={cn(
            "absolute inset-0 bg-gradient-to-r flex items-center",
            activeSlide.bgGradient
          )}
        >
          <div className={cn(
            "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-20",
            i18n.language === 'ar' && "lg:flex lg:flex-row-reverse"
          )}>
            
            {/* Left Content: Product */}
            <div className={cn("flex items-center space-x-12", i18n.language === 'ar' && "flex-row-reverse space-x-reverse text-right")}>
              <motion.div 
                initial={{ x: i18n.language === 'ar' ? 50 : -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="hidden md:block w-24 h-32 lg:w-32 lg:h-40 flex-shrink-0 bg-white/5 backdrop-blur-sm p-3 border border-white/10"
              >
                <img 
                  src={activeSlide.productImg} 
                  alt={activeSlide.title} 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="text-white">
                <motion.div
                  initial={{ opacity: 0, x: i18n.language === 'ar' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn("flex items-center space-x-2 mb-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">
                    {i18n.language === 'ar' ? 'المواصفات الفنية' : 'Technical Specification'}
                  </span>
                  <div className="h-[1px] w-8 bg-secondary" />
                </motion.div>
                <motion.h2 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter mb-1 uppercase"
                >
                  {activeSlide.title}
                </motion.h2>
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-md md:text-lg font-bold text-white/90 mb-2 font-mono tracking-tighter line-clamp-1"
                >
                  {activeSlide.subtitle}
                </motion.h3>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs font-medium text-white/60 uppercase tracking-widest max-w-sm leading-relaxed hidden lg:block"
                >
                  {activeSlide.description}
                </motion.p>
              </div>
            </div>

            {/* Right Content: Brand */}
            <motion.div 
              initial={{ x: i18n.language === 'ar' ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={cn(
                "hidden lg:flex flex-col items-center text-white border-white/10",
                i18n.language === 'ar' ? "lg:items-start border-r pr-12 pl-0" : "lg:items-end border-l pl-12"
              )}
            >
              <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/10 mb-4">
                <img 
                  src={activeSlide.brandLogo} 
                  alt={activeSlide.brandName} 
                  className="h-8 w-auto brightness-0 invert opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-2xl font-black tracking-tighter mb-1 uppercase">{activeSlide.brandName}</h4>
              <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em]">{activeSlide.brandTagline}</p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Counter (Technical Style) */}
      <div className={cn("absolute bottom-6 z-30 flex items-baseline space-x-2 text-white/40 font-mono", i18n.language === 'ar' ? "left-10 space-x-reverse" : "right-10")}>
        <span className="text-xl font-black text-white">{(current + 1).toString().padStart(2, '0')}</span>
        <span className="text-[10px]">/</span>
        <span className="text-[10px]">{displaySlides.length.toString().padStart(2, '0')}</span>
      </div>

      {/* Navigation Dots */}
      {displaySlides.length > 1 && (
        <div className={cn("absolute bottom-6 flex space-x-2 z-30", i18n.language === 'ar' ? "right-10 space-x-reverse" : "left-10")}>
          {displaySlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1 transition-all duration-500",
                current === i ? "bg-secondary w-8" : "bg-white/20 w-4 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button 
            onClick={prev}
            className={cn("absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 text-white hover:bg-black/30 transition-all z-20", i18n.language === 'ar' ? "right-4" : "left-4")}
          >
            {i18n.language === 'ar' ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          </button>
          <button 
            onClick={next}
            className={cn("absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 text-white hover:bg-black/30 transition-all z-20", i18n.language === 'ar' ? "left-4" : "right-4")}
          >
            {i18n.language === 'ar' ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
        </>
      )}
    </div>
  );
};

export default HeroSlider;

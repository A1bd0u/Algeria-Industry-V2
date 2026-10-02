import { AlertCircle, Calendar, CalendarX, MapPin, Ticket, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import { EventSkeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import { currentLocale } from '../lib/format';

// Agenda publié par l'équipe (table events : titre, description, date, lieu,
// organisateur). Les événements passés restent consultables à part.
interface EventRow {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
  location?: string | null;
  organizer?: string | null;
}

const formatEventDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(currentLocale(), {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn',
      } as Intl.DateTimeFormatOptions)
    : '';

const Events = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error();
        setEvents(await res.json());
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPast = (e: EventRow) => Boolean(e.date && new Date(e.date) < startOfToday);
  const visible = events
    .filter((e) => (view === 'past' ? isPast(e) : !isPast(e)))
    .sort((a, b) => {
      const diff = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      return view === 'past' ? -diff : diff;
    });

  return (
    <PageTransition>
      <div className="bg-neutral-bg min-h-screen pb-20">
        <section className="bg-primary py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold mb-4">
              {t('events.titleStart')} <span className="text-secondary">{t('events.titleHighlight')}</span>
            </h1>
            <p className="text-white/80 text-lg max-w-xl">{t('events.subtitle')}</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="inline-flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-12" role="tablist">
            {(['upcoming', 'past'] as const).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                  view === key ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-primary'
                )}
              >
                {t(`events.${key}`)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => <EventSkeleton key={i} />)}
            </div>
          ) : hasError ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <p className="text-sm font-bold text-red-500">{t('events.loadError')}</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <CalendarX className="h-10 w-10 text-gray-300 mb-4" />
              <p className="font-bold text-primary">{view === 'past' ? t('events.noPast') : t('events.noUpcoming')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {visible.map((event, i) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col"
                >
                  <h2 className="text-xl font-bold text-primary mb-4 leading-tight">{event.title}</h2>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {event.date && (
                      <p className="flex items-center gap-3"><Calendar className="h-4 w-4 text-secondary shrink-0" /><span className="font-medium">{formatEventDate(event.date)}</span></p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-secondary shrink-0" /><span className="font-medium">{event.location}</span></p>
                    )}
                    {event.organizer && (
                      <p className="flex items-center gap-3"><User className="h-4 w-4 text-secondary shrink-0" /><span className="font-medium">{t('events.organizer', { name: event.organizer })}</span></p>
                    )}
                  </div>
                  {event.description && <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{event.description}</p>}
                </motion.article>
              ))}
            </div>
          )}

          <section className="mt-24 border-2 border-dashed border-gray-200 p-12 rounded-2xl text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center text-primary mx-auto mb-6">
              <Ticket className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4">{t('events.submitTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-8">{t('events.submitText')}</p>
            <Link to="/contact" className="inline-flex bg-white border border-primary text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all">
              {t('events.submitButton')}
            </Link>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Events;

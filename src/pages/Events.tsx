import {
  AlertCircle,
  Bell,
  Calendar,
  ChevronRight, Clock,
  ExternalLink,
  Filter,
  MapPin,
  Ticket
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import PageTransition from '../components/PageTransition';
import { cn } from '../lib/utils';

import { EventSkeleton } from '../components/Skeleton';

const Events = () => {
  const [activeType, setActiveType] = useState('Tous');
  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error("Erreur de récupération des événements");
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesType = activeType === 'Tous' || event.type === activeType;
    return matchesType;
  });

  return (
    <PageTransition>
      <div className="bg-neutral-bg min-h-screen pb-20">
        {/* Header */}
        <section className="bg-primary py-16 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <h1 className="text-4xl font-extrabold mb-4">Agenda des <span className="text-secondary">Événements</span></h1>
                <p className="text-primary-foreground/80 text-lg max-w-xl">
                  Ne manquez aucun rendez-vous majeur de l'industrie algérienne : salons, forums et webinaires.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              {['Tous', 'Physique', 'En ligne'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                    activeType === type 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-gray-500 hover:text-primary"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                <Filter className="h-4 w-4" />
                <span>Plus de filtres</span>
              </button>
              <button className="flex items-center space-x-2 text-sm font-bold text-secondary hover:underline" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                <Calendar className="h-4 w-4" />
                <span>Vue calendrier</span>
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {[1, 2, 3, 4].map(i => <EventSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center">
               <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
               <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredEvents.map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col md:flex-row"
              >
                <div className="md:w-2/5 h-48 md:h-auto overflow-hidden relative">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md",
                      event.type === 'Physique' ? "bg-primary/80 text-white" : "bg-secondary/80 text-white"
                    )}>
                      {event.type}
                    </span>
                  </div>
                </div>
                <div className="md:w-3/5 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                      {event.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded uppercase",
                      event.status === 'Ouvert' ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                    )}>
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-4 group-hover:text-secondary transition-colors leading-tight">
                    {event.title}
                  </h3>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-secondary" />
                      <span className="font-medium">{event.date}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-secondary" />
                        <span className="font-medium">{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span className="font-medium truncate">{event.location}</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                    <button className="text-primary font-bold text-sm flex items-center space-x-1 hover:translate-x-1 transition-transform" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                      <span>Détails</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="btn-primary py-2 px-6 rounded-xl text-xs" onClick={(e) => { e.preventDefault(); alert("Inscription confirmée et ajoutée à votre calendrier !"); }}>
                      S'inscrire
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}

          {/* Organizer CTA */}
          <section className="mt-24 bg-neutral-bg border-2 border-dashed border-gray-200 p-12 rounded-[40px] text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center text-primary mx-auto mb-6">
              <Ticket className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4">Vous organisez un événement industriel ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-8">
              Faites connaître votre salon, conférence ou webinaire à toute la communauté Algeria Industry.
            </p>
            <button className="bg-white border border-primary text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all flex items-center space-x-2 mx-auto" onClick={(e) => { e.preventDefault(); alert("Redirection vers la billetterie..."); }}>
              <span>Soumettre un événement</span>
              <ExternalLink className="h-5 w-5" />
            </button>
          </section>

          {/* Reminder Section */}
          <section className="mt-12 bg-white p-8 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/10 p-3 rounded-xl text-secondary">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-primary">Alerte Événements</h4>
                <p className="text-sm text-gray-400">Recevez une notification 24h avant chaque événement qui vous intéresse.</p>
              </div>
            </div>
            <button className="text-secondary font-bold text-sm hover:underline" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
              Activer les notifications
            </button>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Events;

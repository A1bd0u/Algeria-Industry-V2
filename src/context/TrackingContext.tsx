import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface BrowserProfile {
  browser: string;
  os: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  currentTimezone: string;
  online: boolean;
  ipAddress?: string;
}

export interface PageVisit {
  path: string;
  title: string;
  enterTime: string;
  exitTime?: string;
  durationMs?: number;
  scrollDepth: number; // max scroll percentage reached
}

export interface UserEvent {
  type: string;
  targetId?: string;
  targetTag: string;
  targetText: string;
  timestamp: string;
  currentPath: string;
}

interface TrackingContextType {
  profile: BrowserProfile;
  visits: PageVisit[];
  events: UserEvent[];
  sessionStart: string;
  totalTimeSpentSec: number;
  logCustomEvent: (type: string, targetTag: string, targetText: string, targetId?: string) => void;
  clearLogs: () => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

// Helper function to detect Browser & OS from userAgent
function getBrowserAndOS() {
  const ua = navigator.userAgent;
  let browser = 'Inconnu';
  let os = 'Inconnu';

  // Detect OS
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  // Detect Browser
  if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Browser';
  else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
  else if (ua.indexOf('Trident') !== -1) browser = 'Internet Explorer';
  else if (ua.indexOf('Edge') !== -1 || ua.indexOf('Edg') !== -1) browser = 'Microsoft Edge';
  else if (ua.indexOf('Chrome') !== -1) browser = 'Google Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Apple Safari';

  return { browser, os };
}

export const TrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [sessionStart] = useState<string>(() => {
    const saved = localStorage.getItem('track_session_start');
    if (saved) return saved;
    const now = new Date().toISOString();
    localStorage.setItem('track_session_start', now);
    return now;
  });

  const [profile, setProfile] = useState<BrowserProfile>(() => {
    const { browser, os } = getBrowserAndOS();
    return {
      browser,
      os,
      language: navigator.language || 'fr',
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      online: navigator.onLine,
      ipAddress: 'Détection...',
    };
  });

  // Fetch public IP dynamically on mount
  useEffect(() => {
    let active = true;
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          if (active && data && data.ip) {
            setProfile(prev => ({
              ...prev,
              ipAddress: data.ip
            }));
          }
        }
      } catch (err) {
        console.warn('Erreur lors de la récupération de l’adresse IP:', err);
        if (active) {
          setProfile(prev => ({
            ...prev,
            ipAddress: 'Non détectée (Bloqué ou Hors-ligne)'
          }));
        }
      }
    };
    fetchIp();
    return () => {
      active = false;
    };
  }, []);

  const [visits, setVisits] = useState<PageVisit[]>(() => {
    const saved = localStorage.getItem('track_visits');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<UserEvent[]>(() => {
    const saved = localStorage.getItem('track_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [totalTimeSpentSec, setTotalTimeSpentSec] = useState<number>(0);

  // Dynamically update online status and screen dimension changes
  useEffect(() => {
    const handleResize = () => {
      setProfile(prev => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      }));
    };

    const handleStatusChange = () => {
      setProfile(prev => ({
        ...prev,
        online: navigator.onLine
      }));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Compute total time spent active in the app
  useEffect(() => {
    const start = new Date(sessionStart).getTime();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setTotalTimeSpentSec(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  // Handle route page tracking
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const pageTitle = document.title || 'Portail Industriel';
    const timestampStr = new Date().toISOString();

    // 1. Mark previous visit exit time & duration
    setVisits(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        const lastIndex = updated.length - 1;
        const last = updated[lastIndex];
        if (!last.exitTime) {
          last.exitTime = timestampStr;
          const duration = Date.now() - new Date(last.enterTime).getTime();
          last.durationMs = duration;
        }
      }

      // Add new page visit
      const newVisit: PageVisit = {
        path: currentPath,
        title: pageTitle,
        enterTime: timestampStr,
        scrollDepth: 0
      };

      const final = [...updated, newVisit];
      localStorage.setItem('track_visits', JSON.stringify(final));
      return final;
    });

  }, [location]);

  // Handle Scroll Depth Tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percentage = Math.min(100, Math.round((scrollTop / docHeight) * 100));

      setVisits(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (percentage > last.scrollDepth) {
          last.scrollDepth = percentage;
          localStorage.setItem('track_visits', JSON.stringify(updated));
        }
        return updated;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  // Global Click Interceptor / Custom Event Logger
  const logCustomEvent = (type: string, targetTag: string, targetText: string, targetId?: string) => {
    const newEvent: UserEvent = {
      type,
      targetId,
      targetTag,
      targetText: targetText.substring(0, 50).trim(),
      timestamp: new Date().toISOString(),
      currentPath: location.pathname
    };

    setEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 200); // keep last 200 events
      localStorage.setItem('track_events', JSON.stringify(updated));
      return updated;
    });
  };

  // Intercept all physical clicks on links, buttons and inputs to automatically track user interactions
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactiveEl = target.closest('button, a, input, select, textarea');
      
      if (interactiveEl) {
        const tag = interactiveEl.tagName.toLowerCase();
        let text = interactiveEl.textContent || '';
        
        if (tag === 'input') {
          const input = interactiveEl as HTMLInputElement;
          text = input.placeholder || input.name || input.type;
        }
        
        logCustomEvent(
          'click',
          tag,
          text || 'Interaction sans texte',
          interactiveEl.id || undefined
        );
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [location]);

  const clearLogs = () => {
    localStorage.removeItem('track_visits');
    localStorage.removeItem('track_events');
    localStorage.removeItem('track_session_start');
    setVisits([]);
    setEvents([]);
  };

  return (
    <TrackingContext.Provider value={{
      profile,
      visits,
      events,
      sessionStart,
      totalTimeSpentSec,
      logCustomEvent,
      clearLogs
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

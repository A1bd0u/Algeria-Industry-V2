import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

// Le tracking maison (IP via un service tiers, clics enregistrés sans
// consentement) a été retiré. La mesure d'audience passera par un outil
// sans cookie (Plausible ou Umami auto-hébergé), chargé après consentement.
export default function GovTelemetry(_props: { state: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm text-center"
    >
      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-6" />
      <h2 className="text-xl font-black text-primary uppercase italic mb-2">Mesure d'audience</h2>
      <p className="text-sm text-gray-500 max-w-lg mx-auto">
        La télémétrie interne a été désactivée pour respecter la loi 18-07. La mesure d'audience
        sera assurée par un outil sans cookie (Plausible ou Umami), activé après consentement.
      </p>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function GovModeration({ state }: { state: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-secondary/10 rounded-[32px] flex items-center justify-center mb-8">
        <ShieldCheck className="h-10 w-10 text-secondary" />
      </div>
      <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic mb-4">Nouvelle Interface de Modération</h3>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center max-w-md mb-8">
        La modération des contenus a été déplacée vers une nouvelle interface dédiée plus performante avec un tableau récapitulatif.
      </p>
      <button 
        onClick={(e) => { e.preventDefault(); window.location.href = '/extranet/moderation'; }}
        className="px-8 py-4 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary-dark transition-all shadow-xl flex items-center space-x-3"
      >
        <span>Ouvrir la modération</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

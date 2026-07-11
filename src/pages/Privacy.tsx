import { Database, Eye, FileSearch, Lock, ShieldAlert, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { legalContent } from '../data/legal';

const Privacy = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('ar') || i18n.language?.startsWith('en')) ? i18n.language : 'fr';
  const content = legalContent[lang].privacy;

  return (
    <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      {/* Header section */}
      <section className="bg-primary pt-32 pb-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-6 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
          >
            <Lock className="h-5 w-5 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{lang === 'ar' ? 'خصوصية البيانات' : lang === 'en' ? 'Data Privacy' : 'Confidentialité des Données'}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter leading-tight"
          >
            {content.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm font-bold uppercase tracking-widest"
          >
            {content.lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white p-8 md:p-12 border border-gray-100 shadow-2xl space-y-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          <div className="p-4 bg-orange-50 border-l-4 border-orange-500 text-orange-800 text-sm font-medium rounded-r-md">
            {content.validationWarning}
          </div>

          <div className={cn("space-y-8 text-gray-600 leading-relaxed text-sm font-medium", lang === 'ar' ? 'pe-4' : 'ps-4')}>
            {content.sections.map((section: any, idx: number) => {
              const icons = [Database, Eye, ShieldAlert, Lock, UserCheck, FileSearch];
              const Icon = icons[idx % icons.length];
              return (
                <div key={idx} className="space-y-4 pt-6 first:pt-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black text-primary uppercase tracking-tight">{section.subtitle}</h2>
                  </div>
                  <div className={cn("text-gray-600 leading-relaxed text-sm font-medium", lang === 'ar' ? 'pe-16' : 'ps-16')}>
                    <p>{section.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center pb-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
            {lang === 'ar' ? 'متوافق مع القوانين' : lang === 'en' ? 'Compliant with Laws' : 'Certifié Conforme - Conformité Légale'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Privacy;

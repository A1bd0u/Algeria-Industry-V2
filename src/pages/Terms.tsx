import { AlertCircle, Building2, FileText, Gavel, Scale, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const Terms = () => {
  const { i18n } = useTranslation();

  return (
    <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language === 'ar' && "font-arabic")}>
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
            <Gavel className="h-5 w-5 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cadre Juridique</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter leading-none"
          >
            {i18n.language === 'ar' ? 'إشعارات قانونية' : 'Mentions Légales'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm font-bold uppercase tracking-widest"
          >
            Dernière mise à jour : 28 Avril 2024
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white p-8 md:p-16 border border-gray-100 shadow-2xl space-y-12">
          {/* Section 1: Publisher */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">1. Éditeur de la Plateforme</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                La plateforme <strong>Algeria Industry</strong> est éditée par la société :
              </p>
              <ul className="space-y-2 border-l-2 border-secondary pl-6 py-2">
                <li><strong>Dénomination sociale :</strong> ALGERIA INDUSTRY SOLUTIONS SPA</li>
                <li><strong>Capital social :</strong> 10.000.000 DZD</li>
                <li><strong>Siège social :</strong> Zone Industrielle Rouiba, Alger, Algérie</li>
                <li><strong>Registre du Commerce :</strong> 16/00-XXXXXXX B 21</li>
                <li><strong>NIF :</strong> 0021XXXXXXXXXXX</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Hosting */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">2. Hébergement</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Le site est hébergé sur des serveurs hautement sécurisés situés en Algérie (Secteur National) et conformes aux standards ISO 27001 :
              </p>
              <p className="p-4 bg-neutral-bg border-l-4 border-primary italic">
                Algeria Telecom Cloud Services<br/>
                Direction des Services Entreprises<br/>
                Alger, Algérie.
              </p>
            </div>
          </div>

          {/* Section 3: Intellectual Property */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">3. Propriété Intellectuelle</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                L'ensemble de ce site (structure, design, logos, textes, bases de données, codes techniques) est la propriété exclusive de ALGERIA INDUSTRY SOLUTIONS.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
              </p>
            </div>
          </div>

          {/* Section 4: Responsibility */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">4. Responsabilité</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Algeria Industry agit en tant que tiers de confiance B2B. L'éditeur ne peut être tenu responsable :
              </p>
              <ul className="list-disc space-y-2 pl-4">
                <li>De l'exactitude des informations fournies par les entreprises exposantes.</li>
                <li>Des dommages directs ou indirects résultant de l'utilisation de la plateforme.</li>
                <li>Des éventuels litiges commerciaux entre utilisateurs mis en relation via le portail.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Cookies */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">5. Utilisation de Cookies</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Notre plateforme utilise des cookies techniques nécessaires à son bon fonctionnement (maintien de session, préférences linguistiques, comparateur de produits).
              </p>
              <p>
                En naviguant sur ce portail, vous acceptez l'utilisation de ces outils essentiels à l'expérience industrielle connectée.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
            Certifié Conforme - Département Conformité Algérie Industrie
          </p>
        </div>
      </section>
    </div>
  );
};

export default Terms;

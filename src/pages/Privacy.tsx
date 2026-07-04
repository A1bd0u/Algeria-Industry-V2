import { Database, Eye, FileSearch, Lock, ShieldAlert, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const Privacy = () => {
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
            <Lock className="h-5 w-5 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Confidentialité Industrielle</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter leading-none"
          >
            {i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Politique de Confidentialité'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm font-bold uppercase tracking-widest"
          >
            Norme Algerie-Cyber-Safety-2024
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white p-8 md:p-16 border border-gray-100 shadow-2xl space-y-12">
          {/* Introduction */}
          <div className="bg-primary/5 p-6 border-l-4 border-secondary">
            <p className="text-gray-700 text-sm italic leading-relaxed">
              Chez <strong>Algeria Industry</strong>, nous comprenons que vos données industrielles sont stratégiques. Cette politique détaille comment nous protégeons l'intégrité et la confidentialité de vos informations.
            </p>
          </div>

          {/* Section 1: Data Collection */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">1. Collecte des Données Professionnelles</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Nous collectons uniquement les données nécessaires à votre activité sur la plateforme :
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong>Informations d'Entreprise :</strong> Nom, NIF/RC, localisation, effectifs.</li>
                <li><strong>Coordonnées Professionnelles :</strong> Nom des responsables, emails corporate, numéros de téléphone.</li>
                <li><strong>Données Techniques :</strong> Spécifications produits, catalogues, appels d'offres émis.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Data Usage */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">2. Finalités du Traitement</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Vos informations sont traitées exclusivement pour :
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>La mise en relation acheteur/fournisseur.</li>
                <li>La verification du statut certifiée ISO des entreprises.</li>
                <li>L'envoi d'alertes personnalisées sur les nouveaux appels d'offres.</li>
                <li>L'analyse statistique anonymisée de l'industrie nationale.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Data Security */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">3. Sécurité et Chiffrement</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Nous appliquons des mesures de sécurité de grade industriel :
              </p>
              <p className="bg-neutral-bg p-4 rounded-xl border border-gray-100 font-mono text-[11px]">
                - Chiffrement SSL/TLS 256 bits pour tous les transferts.<br/>
                - Hachage sécurisé des mots de passe (Argon2ID).<br/>
                - Pare-feux applicatifs (WAF) surveillés 24/7.<br/>
                - Sauvegardes redondantes géographiquement sur le territoire national.
              </p>
            </div>
          </div>

          {/* Section 4: Data Rights */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <UserCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">4. Vos Droits</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Conformément à la Loi 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vous disposez d'un droit :
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>D'accès à l'ensemble de vos données stockées.</li>
                <li>De rectification des informations erronées.</li>
                <li>D'opposition à la réception de communications marketing.</li>
                <li>De suppression définitive de votre compte extranet.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Contact */}
          <div className="space-y-6 pt-12 border-t border-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary">
                <FileSearch className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">5. Contact DPO</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-600 leading-relaxed text-sm font-medium">
              <p>
                Pour toute question ou exercice de vos droits, contactez notre Délégué à la Protection des Données :
              </p>
              <div className="flex flex-col space-y-2 text-primary font-bold">
                <a href="mailto:privacy@algeria-industry.dz" className="hover:text-secondary transition-colors underline decoration-secondary">privacy@algeria-industry.dz</a>
                <span>Objet : Demande RGPD / Loi 18-07</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;

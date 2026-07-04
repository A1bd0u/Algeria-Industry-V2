import {
  BookOpen,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  GraduationCap,
  Newspaper, PlayCircle,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Resources = () => {
  const categories = [
    { name: "Guides & Articles", icon: BookOpen, count: 124 },
    { name: "Études de cas", icon: FileText, count: 42 },
    { name: "Formations", icon: GraduationCap, count: 15 },
    { name: "Réglementation", icon: Gavel, count: 86 },
  ];

  const articles = [
    {
      title: "Guide de l'investissement industriel en Algérie 2026",
      desc: "Tout ce qu'il faut savoir sur les nouvelles lois d'investissement et les avantages fiscaux.",
      category: "Réglementation",
      date: "12 Mars 2026",
      image: "https://picsum.photos/seed/guide/400/250"
    },
    {
      title: "Optimisation de la chaîne logistique : Cas Sonatrach",
      desc: "Comment le leader de l'énergie a réduit ses coûts de transport de 15% en un an.",
      category: "Études de cas",
      date: "05 Mars 2026",
      image: "https://picsum.photos/seed/case/400/250"
    },
    {
      title: "Introduction à l'Industrie 4.0 pour les PME",
      desc: "Les premières étapes pour digitaliser votre production sans investissements massifs.",
      category: "Guides",
      date: "28 Fév 2026",
      image: "https://picsum.photos/seed/industry4/400/250"
    }
  ];

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      {/* Header */}
      <div className="bg-primary py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 -skew-x-12 transform translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Centre de Ressources</h1>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Accédez à une bibliothèque complète de connaissances pour booster votre expertise industrielle.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((cat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center space-x-4 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className="bg-primary/5 p-4 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <cat.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-primary">{cat.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{cat.count} documents</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Articles */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-primary flex items-center space-x-2">
                  <Newspaper className="h-6 w-6 text-secondary" />
                  <span>Dernières publications</span>
                </h2>
                <Link to="/blog" className="text-sm font-bold text-secondary hover:underline flex items-center space-x-1">
                  <span>Voir tout</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article, i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                    <div className="h-48 overflow-hidden relative">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 mb-2 uppercase">
                        <Clock className="h-3 w-3" />
                        <span>{article.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-primary mb-3 group-hover:text-secondary transition-colors leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-6">
                        {article.desc}
                      </p>
                      <Link to="/blog/1" className="text-primary font-bold text-sm flex items-center space-x-1 hover:translate-x-1 transition-transform">
                        <span>Lire la suite</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* E-Learning Section */}
            <section className="bg-secondary p-10 rounded-[40px] text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <GraduationCap className="h-64 w-64" />
              </div>
              <div className="relative z-10 max-w-lg">
                <h2 className="text-3xl font-bold mb-4">E-Learning Industriel</h2>
                <p className="text-white/80 mb-8">
                  Développez les compétences de vos équipes avec nos modules de formation certifiants conçus par des experts.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={(e) => { e.preventDefault(); window.scrollTo({top: window.innerHeight, behavior: 'smooth'}); }} className="bg-white text-secondary px-8 py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-all flex items-center space-x-2">
                    <PlayCircle className="h-5 w-5" />
                    <span>Explorer les cours</span>
                  </button>
                  <button onClick={(e) => { e.preventDefault(); alert("Ouverture de la brochure d'information des formations..."); }} className="bg-white/10 border border-white/20 px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center">
                    En savoir plus
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Regulations & Downloads */}
          <aside className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-primary text-lg mb-6 flex items-center space-x-2">
                <Gavel className="h-5 w-5 text-secondary" />
                <span>Réglementation</span>
              </h3>
              <div className="space-y-4">
                {[
                  "Loi sur l'investissement 2025",
                  "Guide des incitations ANDI",
                  "Normes de sécurité industrielle",
                  "Régime douanier pour l'import"
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => {
                        e.preventDefault();
                        alert("Téléchargement lancé...");
                    }} 
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer text-left"
                  >
                    <span className="text-sm text-gray-600 font-medium group-hover:text-primary">{item}</span>
                    <Download className="h-4 w-4 text-gray-300 group-hover:text-secondary" />
                  </button>
                ))}
              </div>
              <Link to="/blog" className="w-full mt-6 py-3 border border-primary/10 rounded-xl text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                Voir tous les textes de loi
              </Link>
            </div>

            <div className="bg-neutral-bg p-8 rounded-3xl border border-gray-200 border-dashed text-center">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-4" />
              <h4 className="font-bold text-gray-500 mb-2">Besoin d'un guide spécifique ?</h4>
              <p className="text-xs text-gray-400 mb-6">Nos experts peuvent rédiger des études de marché sur mesure.</p>
              <Link to="/contact" className="text-secondary font-bold text-sm flex items-center justify-center space-x-1 mx-auto hover:translate-x-1 transition-transform">
                <span>Contactez un expert</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Resources;

import { Upload, XCircle, CheckCircle, Clock,
  AlertCircle,
  Award,
  Building2,
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Share2,
  ShieldCheck, Star,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ProfileSkeleton } from '../components/Skeleton';
import { cn, generateSlugUrl, extractIdFromSlug } from '../lib/utils';
import SEO from '../components/SEO';

const CompanyProfile = () => {
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isOwner = user?.company_id === id;
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (searchParams.get('writeReview') === 'true') {
      setShowReviewForm(true);
    }
  }, [searchParams]);

  // Sub-pages (sections) states
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'catalogues' | 'news_events'>('about');
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [cataloguesLoading, setCataloguesLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setKycUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload?bucket=kyc-documents', {
        method: 'POST',
        headers: {
           'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur upload');
      }
      const data = await res.json();
      const fileUrl = data.url;

      // Submit KYC request
      const kycRes = await fetch('/api/kyc/submit', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
         },
         body: JSON.stringify({
            activity: company.activity_sector || 'Non spécifié',
            files: [{ type, url: fileUrl }]
         })
      });

      if (!kycRes.ok) {
        const d = await kycRes.json();
        throw new Error(d.error || 'Erreur soumission KYC');
      }

      setUploadSuccess(`Document ${type} soumis avec succès.`);
      setCompany(prev => ({...prev, status: 'pending'}));
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setKycUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await fetch(`/api/companies/${id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewError("Vous devez être connecté pour laisser un avis.");
      return;
    }
    setReviewError('');
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/companies/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue.");
      }

      const publishedReview = await res.json();
      setReviews(prev => [publishedReview, ...prev]);
      setNewComment('');
      setNewRating(5);
      setShowReviewForm(false);
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchCatalogues = async () => {
    try {
      setCataloguesLoading(true);
      const res = await fetch(`/api/catalogues`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((cat: any) => cat.company_id === id);
        setCatalogues(filtered);
      }
    } catch (err) {
      console.error("Error fetching catalogues:", err);
    } finally {
      setCataloguesLoading(false);
    }
  };

  const fetchArticles = async (companyName: string, companyFullName: string) => {
    try {
      setArticlesLoading(true);
      const res = await fetch(`/api/articles`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((art: any) => 
          (art.author && (
            art.author.toLowerCase().includes(companyName.toLowerCase()) || 
            art.author.toLowerCase().includes(companyFullName.toLowerCase()) ||
            companyName.toLowerCase().includes(art.author.toLowerCase())
          ))
        );
        setArticles(filtered);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchEvents = async (companyName: string, companyFullName: string) => {
    try {
      setEventsLoading(true);
      const res = await fetch(`/api/events`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((evt: any) => 
          (evt.organizer && (
            evt.organizer.toLowerCase().includes(companyName.toLowerCase()) ||
            evt.organizer.toLowerCase().includes(companyFullName.toLowerCase()) ||
            companyName.toLowerCase().includes(evt.organizer.toLowerCase())
          ))
        );
        setEvents(filtered);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/companies/${id}`);
        if (!res.ok) {
           throw new Error("Entreprise introuvable");
        }
        
        const companyData = await res.json();
        
        // Use real data, provide safe fallback for images
        const data = {
          ...companyData,
          logo: `https://picsum.photos/seed/${companyData.id}/200/200`,
          banner: `https://picsum.photos/seed/${companyData.id}-banner/1200/400`,
          // ensure arrays and properties exist to avoid UI crash
          certifications: companyData.certifications || [],
          products: companyData.products || []
        };

        setCompany(data);
        fetchCatalogues();
        fetchArticles(data.name, data.fullName || data.name);
        fetchEvents(data.name, data.fullName || data.name);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCompany();
      fetchReviews();
    }
  }, [id]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col items-center justify-center p-4">
         <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
         <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-6">{error || "Entreprise introuvable"}</p>
         <button onClick={() => navigate('/directory')} className="btn-primary">Retour à l'annuaire</button>
      </div>
    );
  }

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : (company?.rating || '4.5');

  return (
    <>
      {company && (
        <SEO 
          title={company.name} 
          description={company.description}
          url={`https://votre-domaine.dz/directory/${generateSlugUrl(company.name, company.id)}`}
          image={company.logo}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": company.name,
            "description": company.description,
            "logo": company.logo,
            "url": `https://votre-domaine.dz/directory/${generateSlugUrl(company.name, company.id)}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": company.region || company.address?.split(',')[1] || "Algérie",
              "addressCountry": "DZ"
            }
          }}
        />
      )}
    <div className="bg-neutral-bg min-h-screen pb-20 pt-2 md:pt-3">
      <div className="w-full max-w-none px-4 sm:px-8 md:px-12 lg:px-16 relative z-10">
        
        {/* Navigation par Onglets (Sous-pages) */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-2 md:p-2.5 mb-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-max">
            {[
              { id: 'about', label: 'Présentation', icon: Building2 },
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'catalogues', label: 'Catalogues', icon: BookOpen },
              { id: 'news_events', label: 'Actualités & Salons', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 py-2 px-3.5 md:px-5 rounded-lg md:rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer",
                    active 
                      ? "bg-secondary text-white shadow-md shadow-secondary/20 scale-[1.01]" 
                      : "text-black hover:text-black hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full space-y-6">
          
          {/* Main Content */}
          <div className="w-full space-y-6">

            {/* Onglet 1 : Présentation */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pt-2 pb-6 md:pt-3 md:pb-10 px-4 md:px-8 space-y-6">
                
                {/* Fiche d'identité de l'entreprise */}
                <div className="bg-neutral-bg rounded-xl p-5 md:p-6 border border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left block: Logo & Basic identity */}
                  <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left justify-between border-b lg:border-b-0 lg:border-e border-gray-200/60 lg:pe-8 pb-6 lg:pb-0">
                    <div className="space-y-4 w-full flex flex-col items-center lg:items-start">
                      <div className="w-28 h-28 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden">
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-1">
                          <h1 className="text-2xl font-bold text-primary">{company.name}</h1>
                          {company.certified && <ShieldCheck className="h-6 w-6 text-success" />}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{company.sector}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-bold ms-1 text-gray-700">{avgRating}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{totalReviews} {totalReviews > 1 ? 'Avis' : 'Avis'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                      <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={cn(
                          "flex items-center justify-center space-x-2 py-3 rounded-lg border transition-all font-bold text-sm cursor-pointer",
                          isFavorite ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                        <span>{isFavorite ? "Favori" : "Suivre"}</span>
                      </button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        if (navigator.share) {
                          navigator.share({
                            title: document.title,
                            url: window.location.href
                          }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Lien copié dans le presse-papier !");
                        }
                      }} className="flex items-center justify-center space-x-2 py-3 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer">
                        <Share2 className="h-4 w-4" />
                        <span>Partager</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle & Right block: Contact Info and Contact CTA */}
                  <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Localisation</p>
                          <p className="text-sm text-gray-700 leading-relaxed font-semibold">{company.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Globe className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Site Web</p>
                          <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-bold hover:underline flex items-center space-x-1">
                            <span>{company.website}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                          <p className="text-sm text-gray-700 font-bold">{company.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                          <p className="text-sm text-gray-700 font-bold">{company.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Certifications inside presentation block */}
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        {company.certifications && company.certifications.map(cert => (
                          <span key={cert} className="bg-success/10 text-success px-2.5 py-1 rounded-lg text-[10px] font-black border border-success/20 uppercase tracking-wider">
                            {cert}
                          </span>
                        ))}
                      </div>

                      <button onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `mailto:${company.email}?subject=Demande de contact`;
                      }} className="w-full sm:w-auto btn-primary py-3.5 px-6 rounded-lg flex items-center justify-center space-x-2 shadow-lg text-sm font-black uppercase tracking-wider cursor-pointer">
                        <MessageSquare className="h-5 w-5" />
                        <span>Contacter l'entreprise</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Présentation */}
                <section>
                  <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-secondary" />
                    À propos de l'entreprise
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-lg font-medium">
                    {company.description}
                  </p>
                </section>

                {/* Stats / Effectif & Fondation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-neutral-bg p-6 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4 text-primary">
                      <Users className="h-6 w-6" />
                      <h4 className="font-bold">Effectif</h4>
                    </div>
                    <p className="text-2xl font-black text-primary">{company.employees || "Non spécifié"}</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold">Collaborateurs en Algérie</p>
                  </div>
                  <div className="bg-neutral-bg p-6 rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4 text-primary">
                      <Calendar className="h-6 w-6" />
                      <h4 className="font-bold">Fondation</h4>
                    </div>
                    <p className="text-2xl font-black text-primary">{company.founded || "Non spécifiée"}</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold">Année de création</p>
                  </div>
                </div>

                {/* Informations Légales */}
                <section>
                  <h2 className="text-2xl font-bold text-primary mb-6">Informations Légales</h2>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-50">
                          <td className="px-6 py-4 font-bold text-gray-400 w-1/3">Dénomination</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{company.fullName || company.name}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="px-6 py-4 font-bold text-gray-400">R.C</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{company.rc || "Non renseigné"}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="px-6 py-4 font-bold text-gray-400">N.I.F</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{company.nif || "Non renseigné"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* Onglet 2 : Produits */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pt-4 pb-8 md:pt-6 md:pb-12 px-6 md:px-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <Package className="h-6 w-6 text-secondary" />
                      Catalogue Produits
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Découvrez la gamme de produits proposée par {company.name}.</p>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!company.products || company.products.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/20 col-span-full">
                      <Package className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucun produit disponible</p>
                      <p className="text-xs text-gray-500 mt-1">Cette entreprise n'a pas encore ajouté de produits.</p>
                    </div>
                  ) : (
                    company.products.map((product: any) => (
                      <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} key={product.id} className="flex items-center p-5 rounded-xl border border-gray-100 hover:border-secondary/20 hover:shadow-md transition-all group bg-white relative">
                        <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-100 group-hover:scale-105 transition-transform overflow-hidden">
                          {product.file_url ? (
                            <img src={product.file_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-10 w-10" />
                          )}
                        </div>
                        <div className="ms-5 flex-1 pr-6">
                          <h4 className="font-bold text-primary group-hover:text-secondary transition-colors text-base line-clamp-1">{product.name}</h4>
                          <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">{product.category}</span>
                          {product.price ? (
                            <p className="text-sm font-black text-primary mt-2">{product.price} DZD</p>
                          ) : (
                            <p className="text-xs text-gray-400 font-bold mt-2">Sur devis</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary transition-colors absolute end-4 top-1/2 -translate-y-1/2 rtl:rotate-180" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
                   {/* Onglet 3 : Catalogue (Documents) */}
            {activeTab === 'catalogues' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pt-4 pb-8 md:pt-6 md:pb-12 px-6 md:px-10 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-secondary" />
                    Catalogues PDF & Brochures
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Téléchargez ou visualisez les catalogues officiels de {company.name}.</p>
                </div>
 
                {cataloguesLoading ? (
                  <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement des catalogues...</div>
                ) : catalogues.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun catalogue disponible</p>
                    <p className="text-xs text-gray-500 mt-1">Aucun document n'a été publié par cette entreprise.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {catalogues.map((catalogue: any) => (
                      <div key={catalogue.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-secondary/20 hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                            <FileText className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-primary text-base mb-1">{catalogue.title}</h4>
                          <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed">{catalogue.description}</p>
                        </div>
                        <a 
                          href={catalogue.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-50 border border-gray-100 text-primary font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-secondary hover:text-white hover:border-secondary transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>Télécharger le PDF</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Onglet 4 : Actualités & Salons */}
            {activeTab === 'news_events' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section Actualités */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <FileText className="h-6 w-6 text-secondary" />
                      Actualités & Communiqués
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Suivez les dernières nouvelles de {company.name}.</p>
                  </div>
 
                  {articlesLoading ? (
                    <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement...</div>
                  ) : articles.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                      <FileText className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucune actualité disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {articles.map((article: any) => (
                        <Link 
                          to={`/blog/${article.id}`} 
                          key={article.id} 
                          className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-secondary/20 hover:shadow-md transition-all flex flex-col group"
                        >
                          <div className="h-36 bg-gray-100 relative overflow-hidden">
                            {article.image_url ? (
                              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <FileText className="h-10 w-10" />
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                            <div>
                              <span className="text-[10px] font-black uppercase text-secondary tracking-widest block mb-1">
                                {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <h4 className="font-bold text-primary text-sm group-hover:text-secondary transition-colors line-clamp-2">{article.title}</h4>
                              <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">{article.content}</p>
                            </div>
                            <span className="text-[11px] font-bold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                              <span>Lire la suite</span>
                              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Salons & Événements */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-secondary" />
                      Salons & Événements
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Découvrez les expositions et salons professionnels de {company.name}.</p>
                  </div>

                  {eventsLoading ? (
                    <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement...</div>
                  ) : events.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                      <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucun salon disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((evt: any) => (
                        <div key={evt.id} className="bg-white border border-gray-100 p-5 rounded-xl hover:border-secondary/20 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex gap-3 items-start">
                            <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 flex flex-col items-center justify-center font-black flex-shrink-0">
                              <span className="text-base leading-none">{new Date(evt.date).getDate()}</span>
                              <span className="text-[9px] uppercase leading-none tracking-wider mt-0.5">
                                {new Date(evt.date).toLocaleDateString('fr-FR', { month: 'short' })}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="inline-block bg-success/10 text-success text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">{evt.status}</span>
                              <h4 className="font-bold text-primary text-sm">{evt.title}</h4>
                              <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">{evt.description}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 font-bold mt-1.5">
                                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {evt.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Système d'avis / Commentaires et étoiles */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 md:p-12 space-y-8">
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                  <span>Avis & Évaluations ({totalReviews})</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Découvrez ce que les autres utilisateurs pensent de {company.name}.</p>
              </div>

              {/* Note globale et répartition */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="text-center md:border-e border-gray-200/60 md:pe-8">
                  <p className="text-5xl font-black text-primary leading-none mb-2">{avgRating}</p>
                  <div className="flex justify-center text-yellow-500 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-5 w-5",
                          s <= Math.round(parseFloat(avgRating)) ? "fill-current" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Note Moyenne</p>
                </div>

                <div className="col-span-2 space-y-2 md:ps-4">
                  {[5, 4, 3, 2, 1].map((starsCount) => {
                    const count = reviews.filter(r => r.rating === starsCount).length;
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={starsCount} className="flex items-center text-sm">
                        <span className="w-12 font-bold text-gray-500 flex items-center">{starsCount} <Star className="h-3 w-3 ms-1 text-yellow-500 fill-current" /></span>
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden mx-3">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-8 text-end font-bold text-gray-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Liste des avis & Formulaire fusionnés */}
              <div className="space-y-6 mt-8 border-t border-gray-100 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-bold text-primary text-lg flex items-center gap-2">
                    <span>Avis des utilisateurs ({totalReviews})</span>
                  </h3>
                  {!showReviewForm && (
                    user ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="btn-secondary px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm hover:scale-105 transition-all text-white flex items-center gap-1.5 self-start sm:self-auto animate-in fade-in duration-200"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Laisser mon avis
                      </button>
                    ) : (
                      <Link
                        to={`/login?redirect=${encodeURIComponent(window.location.pathname + '?writeReview=true')}`}
                        className="btn-secondary px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm hover:scale-105 transition-all text-white flex items-center gap-1.5 self-start sm:self-auto animate-in fade-in duration-200"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Laisser mon avis
                      </Link>
                    )
                  )}
                </div>

                {/* Formulaire d'ajout d'avis (conditionnel / fusionné) */}
                {showReviewForm && (
                  <div className="bg-gray-50/30 p-6 md:p-8 rounded-xl border border-gray-100/80 relative animate-in fade-in slide-in-from-top-4 duration-300">
                    <button 
                      onClick={() => setShowReviewForm(false)}
                      className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Fermer"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                    
                    {user ? (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-2">Laisser mon avis</h4>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Votre note</label>
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = hoveredRating !== null ? star <= hoveredRating : star <= newRating;
                              return (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setNewRating(star)}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  onMouseLeave={() => setHoveredRating(null)}
                                  className="focus:outline-none p-1 transition-all hover:scale-110"
                                >
                                  <Star
                                    className={cn(
                                      "h-8 w-8 transition-colors",
                                      active ? "text-yellow-500 fill-current" : "text-gray-300"
                                    )}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="review-comment" className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Votre commentaire</label>
                          <textarea
                            id="review-comment"
                            rows={4}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Qu'avez-vous pensé des services de cette entreprise ? Partagez votre expérience..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none text-sm transition-all"
                            required
                          ></textarea>
                        </div>

                        {reviewError && (
                          <p className="text-red-500 text-xs font-bold uppercase tracking-wider">{reviewError}</p>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="btn-primary py-3 px-6 rounded-lg flex items-center space-x-2 disabled:opacity-50 text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
                          >
                            <span>{submittingReview ? "Publication..." : "Publier l'avis"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="px-5 py-3 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 font-medium mb-4">Vous devez être connecté pour donner votre avis sur cette entreprise.</p>
                        <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + '?writeReview=true')}`} className="btn-secondary inline-block px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl shadow">Laisser mon avis</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Liste des avis */}
                {reviewsLoading ? (
                  <div className="py-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement des avis...</div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                    <Star className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun avis pour le moment</p>
                    <p className="text-xs text-gray-500 mt-1">Soyez le premier à partager votre expérience !</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reviews.map((review) => (
                      <div key={review.id} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 items-start">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center font-black text-lg uppercase flex-shrink-0 shadow-sm">
                          {review.user?.name ? review.user.name.charAt(0) : '?'}
                        </div>
                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-primary text-sm uppercase">{review.user?.name || 'Utilisateur'}</h4>
                              <p className="text-[10px] font-bold text-gray-400 tracking-wider">
                                {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex text-yellow-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "h-4 w-4",
                                    s <= review.rating ? "fill-current" : "text-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Download Brochure CTA */}
            <div className="bg-primary p-10 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Brochure Corporate</h3>
                <p className="text-primary-foreground/80 text-sm">Téléchargez la présentation complète des activités de {company.name}.</p>
              </div>
              <button onClick={(e) => {
      e.preventDefault();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['Brochure'], {type: 'application/pdf'}));
      a.download = `brochure_${company.name.toLowerCase().replace(/ /g, '_')}.pdf`;
      a.click();
    }} className="bg-secondary text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-all shadow-xl relative z-10 inline-flex">
                <Download className="h-5 w-5" />
                <span>Télécharger (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CompanyProfile;

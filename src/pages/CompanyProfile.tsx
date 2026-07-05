import { Upload, XCircle, CheckCircle, Clock,
  AlertCircle,
  Award,
  Building2,
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
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProfileSkeleton } from '../components/Skeleton';
import { cn, generateSlugUrl, extractIdFromSlug } from '../lib/utils';

const CompanyProfile = () => {
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'tenders'>('about');
  
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isOwner = user?.company_id === id;
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

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

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/companies/${id}`).catch(() => null);
        let data: any = { id: id, name: "Entreprise ID " + id, activity_sector: "Industrie" }; // Mock fallback base
        
        if (res && res.ok) {
           data = await res.json();
        }
        
        // Mock some dynamic data for the view
        data = {
          ...data,
          fullName: data.name + " Algérie",
          sector: data.activity_sector || "Énergie / Hydrocarbures",
          region: "Alger",
          address: "123 Rue de l'Industrie, Alger",
          website: `www.${data.name?.toLowerCase().replace(/\s+/g,'')}.com`,
          email: `contact@${data.name?.toLowerCase().replace(/\s+/g,'')}.dz`,
          phone: "+213 21 00 00 00",
          description: data.description || "Leader de la construction mécanique. Aucune description fournie.",
          certified: Math.random() > 0.5,
          certifications: ["ISO 9001", "ISO 14001"],
          employees: "1,000+",
          founded: "2010",
          rating: 4.8,
          reviews: 120,
          logo: `https://picsum.photos/seed/${data.id}/200/200`,
          banner: `https://picsum.photos/seed/${data.id}-banner/1200/400`,
          products: [
             { id: 101, name: "Produit A", category: "Équipement" },
             { id: 102, name: "Produit B", category: "Outillage" }
          ]
        };

        setCompany(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchCompany();
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

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      {/* Banner */}
      <div className="h-64 md:h-80 relative overflow-hidden">
        <img src={company.banner} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar - Profile Info */}
          <aside className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-lg mx-auto -mt-24 border-4 border-white overflow-hidden mb-6">
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-primary">{company.name}</h1>
                  {company.certified && <ShieldCheck className="h-6 w-6 text-success" />}
                </div>
                <p className="text-sm text-gray-500 mb-6 font-medium">{company.sector}</p>
                
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold ms-1 text-gray-700">{company.rating}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{company.reviews} Avis</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={cn(
                      "flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all font-bold text-sm",
                      isFavorite ? "bg-red-50 border-red-100 text-red-500" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
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
    }} className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100 transition-all font-bold text-sm">
                    <Share2 className="h-4 w-4" />
                    <span>Partager</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-50 p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Localisation</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{company.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Globe className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Site Web</p>
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-bold hover:underline flex items-center space-x-1">
                      <span>{company.website}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                    <p className="text-sm text-gray-700 font-bold">{company.phone}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm text-gray-700 font-bold">{company.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-primary/5 border-t border-gray-50">
                <button onClick={(e) => {
      e.preventDefault();
      window.location.href = `mailto:contact@${company.name.toLowerCase().replace(/ /g, '')}.com?subject=Demande de contact`;
    }} className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg">
                  <MessageSquare className="h-5 w-5" />
                  <span>Contacter l'entreprise</span>
                </button>
              </div>
            </div>

            {/* Certifications Card */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-primary mb-6 flex items-center space-x-2">
                <Award className="h-5 w-5 text-secondary" />
                <span>Certifications</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {company.certifications.map(cert => (
                  <span key={cert} className="bg-success/10 text-success px-3 py-1.5 rounded-lg text-xs font-bold border border-success/20">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Tabs */}
          <div className="flex-1 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {[
                  { id: 'about', name: 'À propos', icon: Building2 },
                  { id: 'products', name: 'Catalogue Produits', icon: Package },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-5 text-sm font-bold flex items-center justify-center space-x-2 transition-all border-b-2",
                      activeTab === tab.id ? "border-secondary text-secondary" : "border-transparent text-gray-400 hover:text-primary"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>

              <div className="p-8 md:p-12">
                {activeTab === 'about' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                    <section>
                      <h2 className="text-2xl font-bold text-primary mb-4">Présentation</h2>
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {company.description}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-neutral-bg p-6 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4 text-primary">
                          <Users className="h-6 w-6" />
                          <h4 className="font-bold">Effectif</h4>
                        </div>
                        <p className="text-2xl font-black text-primary">{company.employees}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-bold">Collaborateurs en Algérie</p>
                      </div>
                      <div className="bg-neutral-bg p-6 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4 text-primary">
                          <Calendar className="h-6 w-6" />
                          <h4 className="font-bold">Fondation</h4>
                        </div>
                        <p className="text-2xl font-black text-primary">{company.founded}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-bold">Année de création</p>
                      </div>
                    </div>


                    <section className="mt-10 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                          <ShieldCheck className="h-6 w-6 text-secondary" />
                          Vérification KYC
                        </h2>
                        {company.status === 'approved' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 font-bold uppercase tracking-widest text-[10px] rounded-full border border-green-200">
                            Vérifié
                          </span>
                        )}
                        {company.status === 'pending' && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold uppercase tracking-widest text-[10px] rounded-full border border-yellow-200">
                            En attente
                          </span>
                        )}
                        {company.status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 font-bold uppercase tracking-widest text-[10px] rounded-full border border-red-200">
                            Rejeté
                          </span>
                        )}
                        {(!company.status || company.status === 'unverified') && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 font-bold uppercase tracking-widest text-[10px] rounded-full border border-gray-200">
                            Non soumis
                          </span>
                        )}
                      </div>

                      {isOwner && company.status === 'rejected' && company.rejection_reason && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 me-3 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-red-800">Motif du rejet</h4>
                              <p className="text-sm text-red-600 mt-1">{company.rejection_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isOwner && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500 mb-4">
                            Veuillez télécharger vos documents légaux pour vérifier votre entreprise et obtenir le badge "Vérifié". Les formats acceptés sont PDF, JPG et PNG.
                          </p>

                          {uploadError && <div className="text-red-500 text-sm font-bold">{uploadError}</div>}
                          {uploadSuccess && <div className="text-green-500 text-sm font-bold">{uploadSuccess}</div>}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                              <FileText className="h-8 w-8 text-gray-400 mb-2" />
                              <h4 className="font-bold text-sm text-primary mb-1">Registre de Commerce (RC)</h4>
                              <label className="mt-2 cursor-pointer inline-flex items-center space-x-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-secondary-dark transition-all">
                                {kycUploading ? <Upload className="h-4 w-4 animate-bounce" /> : <Upload className="h-4 w-4" />}
                                <span>Uploader RC</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleKycUpload(e, 'RC')} disabled={kycUploading} />
                              </label>
                            </div>

                            <div className="p-4 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                              <FileText className="h-8 w-8 text-gray-400 mb-2" />
                              <h4 className="font-bold text-sm text-primary mb-1">NIF</h4>
                              <label className="mt-2 cursor-pointer inline-flex items-center space-x-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-secondary-dark transition-all">
                                {kycUploading ? <Upload className="h-4 w-4 animate-bounce" /> : <Upload className="h-4 w-4" />}
                                <span>Uploader NIF</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleKycUpload(e, 'NIF')} disabled={kycUploading} />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-primary mb-6">Informations Légales</h2>
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-50">
                              <td className="px-6 py-4 font-bold text-gray-400 w-1/3">Dénomination</td>
                              <td className="px-6 py-4 text-gray-700 font-medium">{company.fullName}</td>
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
                  </motion.div>
                )}

                {activeTab === 'products' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-primary">Catalogue de l'entreprise</h2>
                      <Link to="/products" className="text-sm font-bold text-secondary hover:underline">Voir tout le catalogue</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.products.map(product => (
                        <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} key={product.id} className="flex items-center p-4 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all group cursor-pointer">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-300">
                            <Package className="h-8 w-8" />
                          </div>
                          <div className="ms-4 flex-1">
                            <h4 className="font-bold text-primary group-hover:text-secondary transition-colors">{product.name}</h4>
                            <p className="text-xs text-gray-400 uppercase font-bold">{product.category}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Download Brochure CTA */}
            <div className="bg-primary p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
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
    }} className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 transition-all shadow-xl relative z-10 inline-flex">
                <Download className="h-5 w-5" />
                <span>Télécharger (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;

import { ExternalLink, Info } from 'lucide-react';
import React from 'react';
import { cn } from '../lib/utils';

interface AdSpaceProps {
  type: 'horizontal' | 'vertical' | 'square';
  imageUrl?: string;
  title?: string;
  description?: string;
  link?: string;
  className?: string;
  isSponsor?: boolean;
}

const AdSpace: React.FC<AdSpaceProps> = ({ 
  type, 
  imageUrl, 
  title, 
  description, 
  link = "#", 
  className,
  isSponsor = true
}) => {
  const baseStyles = "relative overflow-hidden rounded-2xl transition-all hover:shadow-lg border border-gray-100 group";
  
  const typeStyles = {
    horizontal: "w-full h-32 md:h-40",
    vertical: "w-full aspect-[3/4]",
    square: "w-full aspect-square"
  };

  return (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(baseStyles, typeStyles[type], className)}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title || "Publicité"} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Espace Publicitaire
          </div>
          {title && <h4 className="text-primary font-bold mb-1">{title}</h4>}
          {description && <p className="text-xs text-gray-400 line-clamp-2">{description}</p>}
        </div>
      )}
      
      {/* Overlay info */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {isSponsor && (
          <span className="bg-black/20 backdrop-blur-md text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
            Sponsorisé
          </span>
        )}
        <div className="bg-white/20 backdrop-blur-md p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
      
      {/* Ad Label */}
      <div className="absolute bottom-2 left-2">
        <div className="flex items-center space-x-1 text-[8px] text-white/40 bg-black/5 px-1.5 py-0.5 rounded">
          <Info className="h-2 w-2" />
          <span>Annonce</span>
        </div>
      </div>
    </a>
  );
};

export default AdSpace;


import React, { useState } from 'react';
import { SoftPowerInfluence as InfluenceInfo } from '../types';
import { Star, ExternalLink, MapPin, Briefcase, Link, RefreshCw, Search } from 'lucide-react';
import GenerativeImage from './GenerativeImage';

interface SoftPowerInfluenceProps {
  influenceInfo: InfluenceInfo;
  onRefresh?: () => Promise<void>;
}

const SoftPowerInfluence: React.FC<SoftPowerInfluenceProps> = ({ influenceInfo, onRefresh }) => {
  const { name, field, country, presentation, impact, reasonForTrending, imageUrl, reference, ocpLink } = influenceInfo;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (!influenceInfo) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4" />
            Influence & Soft Power
        </h2>
        {onRefresh && (
            <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                title="Actualiser pour une nouvelle proposition"
            >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
        )}
      </div>
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-start transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
        <div className="md:w-1/3 flex-shrink-0 bg-gray-50 aspect-square relative group overflow-hidden">
           <GenerativeImage 
                src={imageUrl}
                alt={`Portrait de ${name}`}
                prompt={`A professional, high-quality magazine portrait of a business or political figure named ${name} from ${country}. Industry: ${field}. Neutral studio background.`}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                enableAutoGeneration={false} 
           />
           
           {/* Aesthetic Search Button Overlay */}
           <a 
               href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + " " + country)}`}
               target="_blank" 
               rel="noopener noreferrer"
               className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]"
               title="Rechercher la photo réelle sur Google"
           >
               <div className="bg-white/20 p-3 rounded-full border border-white/50 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                   <Search className="w-8 h-8 text-white drop-shadow-md" />
               </div>
           </a>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{field}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{country}</div>
            </div>
            
            {presentation && (
              <p className="mt-4 text-sm text-gray-700 leading-relaxed border-l-2 border-slate-200 pl-3 italic">
                {presentation}
              </p>
            )}

            <div className="mt-5 space-y-4">
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">Impact Stratégique</h4>
                    <p className="text-sm text-gray-600">{impact}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-gray-800 text-sm">Tendance Actuelle</h4>
                    <p className="text-sm text-gray-600">{reasonForTrending}</p>
                </div>
                {ocpLink && (
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <Link className="w-4 h-4 text-green-700" />
                            Lien Potentiel avec l'Écosystème OCP
                        </h4>
                        <p className="text-sm text-gray-700 mt-1 bg-green-50 border-l-2 border-green-300 p-3 rounded-r-md">{ocpLink}</p>
                    </div>
                )}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <a 
              href={reference.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline font-semibold"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span>Source : {reference.source}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoftPowerInfluence;

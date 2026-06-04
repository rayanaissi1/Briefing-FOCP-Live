
import React, { useState, useEffect } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';
import { Image, Loader, RefreshCw, Wand2, User, Search } from 'lucide-react';

interface GenerativeImageProps {
  src?: string;
  alt: string;
  prompt: string;
  className?: string;
  aspectRatio?: string; // "16:9" | "1:1" | "4:3"
  enableAutoGeneration?: boolean; // Générer automatiquement si src est manquant/cassé
}

const GenerativeImage: React.FC<GenerativeImageProps> = ({ 
  src, 
  alt, 
  prompt, 
  className = "", 
  aspectRatio = "16:9",
  enableAutoGeneration = true 
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);

  // Si la prop src change (nouvelle donnée), on réinitialise
  useEffect(() => {
    setCurrentSrc(src || null);
    setHasError(false);
    setGenerationAttempted(false);
  }, [src]);

  // Auto-génération si pas de source ou si l'image source est cassée
  useEffect(() => {
    if (enableAutoGeneration && !currentSrc && !isGenerating && !generationAttempted) {
      handleGenerate();
    }
  }, [currentSrc, enableAutoGeneration]);

  const handleImageError = () => {
    // Si l'image source (réelle) plante, on bascule en mode erreur pour déclencher l'auto-génération
    if (!generationAttempted && enableAutoGeneration) {
        handleGenerate();
    } else {
        setHasError(true);
    }
  };

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setIsGenerating(true);
    setHasError(false);
    setGenerationAttempted(true);

    try {
      // On enrichit un peu le prompt pour assurer la qualité
      const enhancedPrompt = `Photorealistic image, high quality, journalistic style: ${prompt}`;
      const newImageUrl = await generateImageFromPrompt(enhancedPrompt);
      setCurrentSrc(newImageUrl);
    } catch (err) {
      console.error("Erreur de génération d'image:", err);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container d'affichage */}
      <div className="w-full h-full flex items-center justify-center">
        {isGenerating ? (
            <div className="flex flex-col items-center text-gray-500 animate-pulse p-4">
                <Loader className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs font-medium">Création IA...</span>
            </div>
        ) : currentSrc && !hasError ? (
            <img 
                src={currentSrc} 
                alt={alt} 
                className="w-full h-full object-cover"
                onError={handleImageError}
            />
        ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4 text-center">
                <div className="relative mb-2">
                    <User className="w-10 h-10 opacity-40" />
                    <Search className="w-4 h-4 absolute bottom-0 right-0 opacity-60 bg-slate-100 rounded-full" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Rechercher</span>
            </div>
        )}
      </div>

      {/* Bouton de génération / régénération */}
      {(!isGenerating) && (
        <button
          onClick={handleGenerate}
          title="Générer une alternative avec l'IA"
          className={`absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-indigo-600 text-white backdrop-blur-sm transition-all duration-300 shadow-lg z-10 
            ${isHovered || !currentSrc ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}
        >
          {generationAttempted || currentSrc ? (
             <RefreshCw className="w-4 h-4" />
          ) : (
             <Wand2 className="w-4 h-4" />
          )}
        </button>
      )}
      
      {/* Badge IA si généré */}
      {generationAttempted && currentSrc && !isGenerating && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-bold uppercase rounded backdrop-blur-md pointer-events-none">
            Généré par IA
        </span>
      )}
    </div>
  );
};

export default GenerativeImage;

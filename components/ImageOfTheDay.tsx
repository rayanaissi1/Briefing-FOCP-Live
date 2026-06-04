
import React from 'react';
import { ImageOfTheDay as ImageInfo } from '../types';
import { Camera, ExternalLink } from 'lucide-react';
import GenerativeImage from './GenerativeImage';

interface ImageOfTheDayProps {
  imageInfo: ImageInfo;
}

const ImageOfTheDay: React.FC<ImageOfTheDayProps> = ({ imageInfo }) => {
  if (!imageInfo) return null;
  
  const { imageUrl, commentary, reference } = imageInfo;

  return (
    <div className="mb-8 animate-fade-in">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            L'Image du Jour
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="w-full flex-shrink-0 bg-gray-50 aspect-video">
                <GenerativeImage 
                    src={imageUrl}
                    alt={reference.title || "Image de l'actualité"}
                    prompt={`News photography showing: ${reference.title}. Context: ${commentary}`}
                    className="w-full h-full"
                />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{reference.title}</h3>
                     <a 
                        href={reference.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 hover:underline font-semibold mt-2"
                    >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span>Source : {reference.source}</span>
                    </a>
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analyse</h4>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{commentary}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ImageOfTheDay;

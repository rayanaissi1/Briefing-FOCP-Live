
import React from 'react';
import { VideoOfTheDay as VideoInfo } from '../types';
import { Film, ExternalLink } from 'lucide-react';
import GenerativeImage from './GenerativeImage';

interface VideoOfTheDayProps {
  videoInfo: VideoInfo;
}

// Liste des IDs YouTube connus pour être des "Rickrolls" ou des placeholders musicaux fréquents
const BLOCKED_VIDEO_IDS = [
    'dQw4w9WgXcQ', // Never Gonna Give You Up
    'oHg5SJYRHA0', // Another version
    'cvh0nX08nRw', // Another version
    'j5a0jTc9S10', // Another version
];

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Regex to capture video ID from various YouTube URL formats
    const youtubeRegex = /(?:v=|vi\/|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    
    if (!match || !match[1]) {
        return null;
    }

    const videoId = match[1];

    if (BLOCKED_VIDEO_IDS.includes(videoId)) {
        return null;
    }

    // Use the privacy-enhanced mode URL to prevent common embedding issues.
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

const VideoOfTheDay: React.FC<VideoOfTheDayProps> = ({ videoInfo }) => {
  if (!videoInfo) return null;
  
  const { videoUrl, title, commentary, reference, posterImagePrompt } = videoInfo;
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="mb-8 animate-fade-in">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
            <Film className="w-4 h-4" />
            La Vidéo du Jour
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            {embedUrl ? (
                <div className="aspect-video bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    ></iframe>
                </div>
            ) : (
                <div className="aspect-video w-full">
                    {/* Fallback : Générer une image représentative si la vidéo manque */}
                    <GenerativeImage 
                        alt={title}
                        prompt={posterImagePrompt || `A cinematic thumbnail image representing: ${title}. Corporate, industrial or economic context in Africa.`}
                        className="w-full h-full"
                    />
                </div>
            )}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{title}</h3>
                    <div className="mt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analyse</h4>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{commentary}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
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

export default VideoOfTheDay;

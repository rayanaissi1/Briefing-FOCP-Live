
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AfricanHeritage as HeritageInfo, ExpandedHeritageInfo } from '../types';
import { Landmark, ExternalLink, Loader, BookOpen, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { expandHeritageInfo } from '../services/geminiService';
import Modal from './Modal';
import GenerativeImage from './GenerativeImage';

interface AfricanHeritageProps {
  heritageInfo: HeritageInfo;
}

const AfricanHeritage: React.FC<AfricanHeritageProps> = ({ heritageInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<ExpandedHeritageInfo | null>(null);
  const [expansionError, setExpansionError] = useState<string | null>(null);

  const handleLearnMore = async () => {
    setIsModalOpen(true);
    if (expandedInfo && !expansionError) return;

    setIsExpanding(true);
    setExpansionError(null);
    try {
      const data = await expandHeritageInfo(heritageInfo.title, heritageInfo.description);
      setExpandedInfo(data);
    } catch (err) {
      setExpansionError("Impossible de charger les informations détaillées. Veuillez réessayer plus tard.");
    } finally {
      setIsExpanding(false);
    }
  };

  if (!heritageInfo) return null;

  return (
    <>
      <div className="mb-8 animate-fade-in">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Héritage Africain
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-start">
          <div className="md:w-1/2 lg:w-2/5 flex-shrink-0 bg-gray-50 aspect-video md:aspect-auto self-stretch">
            <GenerativeImage 
                src="" // Souvent pas d'image source pour l'héritage, on force la génération
                alt={heritageInfo.title}
                prompt={heritageInfo.imagePrompt || `Historical illustration of ${heritageInfo.title} in Africa, detailed, cinematic lighting.`}
                className="w-full h-full"
                enableAutoGeneration={true}
            />
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">{heritageInfo.title}</h3>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{heritageInfo.description}</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <button 
                  onClick={handleLearnMore}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Savoir plus sur le sujet
                </button>
                <a 
                  href={heritageInfo.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span>Source : {heritageInfo.source}</span>
                </a>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={heritageInfo.title}>
        {isExpanding ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="mt-4 text-gray-600">Recherche d'informations détaillées...</p>
          </div>
        ) : expansionError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="mt-4 font-semibold text-red-700">{expansionError}</p>
            <button
                onClick={handleLearnMore}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
            >
                <RefreshCw className="w-4 h-4" />
                Réessayer
            </button>
          </div>
        ) : expandedInfo && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Analyse Détaillée</h3>
              <ReactMarkdown
                className="prose prose-sm max-w-none text-gray-700"
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                }}
              >
                {expandedInfo.detailedDescription}
              </ReactMarkdown>
            </div>
            {expandedInfo.bookRecommendations && expandedInfo.bookRecommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Suggestions de Lecture
                </h3>
                <ul className="space-y-3">
                  {expandedInfo.bookRecommendations.map((book, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3" />
                          {book.author}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default AfricanHeritage;

import React from 'react';
import { StrategicArticle as StrategicArticleType } from '../types';
import { FileText, ExternalLink } from 'lucide-react';

interface StrategicArticleProps {
  article: StrategicArticleType;
}

const StrategicArticle: React.FC<StrategicArticleProps> = ({ article }) => {
  if (!article) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <FileText className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Analyse Presse Stratégique</h2>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">{article.title}</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{article.analysis}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a 
            href={article.reference.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Lire l'article source ({article.reference.source})
          </a>
        </div>
      </div>
    </div>
  );
};

export default StrategicArticle;

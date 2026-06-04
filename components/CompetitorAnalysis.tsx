import React from 'react';
import { CompetitorNews } from '../types';
import { Swords, Globe, ExternalLink, TrendingUp, ShieldCheck } from 'lucide-react';

interface CompetitorAnalysisProps {
  news: CompetitorNews[];
}

const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({ news }) => {
  if (!news || news.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
          <Swords className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Analyse Concurrentielle Mondiale</h2>
          <p className="text-sm text-gray-500">Mouvements stratégiques des acteurs majeurs (Mosaic, Nutrien, Yara, Ma'aden...)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
            <div className="p-5 flex-grow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {item.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">{item.companyName}</h3>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {item.headquarters}
                        </span>
                    </div>
                </div>
                {item.sourceQuality && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                        <ShieldCheck className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-medium text-gray-500">{item.sourceQuality.split(' - ')[0]}</span>
                    </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{item.newsTitle}</h4>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.newsSummary}</p>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-1">Impact Stratégique</span>
                        <p className="text-xs text-blue-800 leading-relaxed">{item.strategicImpact}</p>
                    </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 rounded-b-xl flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium truncate max-w-[60%]">{item.reference.source}</span>
                <a 
                    href={item.reference.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                    Lire l'article <ExternalLink className="w-3 h-3" />
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetitorAnalysis;

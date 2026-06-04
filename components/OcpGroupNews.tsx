import React from 'react';
import { OcpNewsItem } from '../types';
import { Newspaper, ExternalLink, Factory, Briefcase, GraduationCap, Building, Zap } from 'lucide-react';

interface OcpGroupNewsProps {
  news: OcpNewsItem[];
}

const categoryIcons = {
  'Sites Industriels': Factory,
  'Filiales': Briefcase,
  'Écosystème UM6P': GraduationCap,
  'Gouvernance': Building,
  'Projets & Initiatives': Zap,
};

const OcpGroupNews: React.FC<OcpGroupNewsProps> = ({ news }) => {
  if (!news || news.length === 0) {
    return null; // Don't render the section if there is no news
  }

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
        <Newspaper className="w-4 h-4" />
        Salle de Presse | OCP Groupe & Écosystème
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => {
          const Icon = categoryIcons[item.category] || Newspaper;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col p-6 h-full transition-all hover:shadow-lg hover:border-green-200">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-800 uppercase">{item.category}</p>
                    <h3 className="font-bold text-gray-700 text-sm">{item.entityName}</h3>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 leading-tight">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{item.summary}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <a 
                  href={item.reference.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span>Source : {item.reference.source}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OcpGroupNews;
import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { GroundingSource } from '../types';

interface FooterProps {
  sources?: GroundingSource[];
}

const Footer: React.FC<FooterProps> = ({ sources }) => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {sources && sources.length > 0 && (
          <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900">Sources vérifiées par Google Search</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {sources.map((source, idx) => {
                    try {
                        const domain = new URL(source.url).hostname.replace('www.', '');
                        return (
                            <a 
                                key={idx} 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex items-start gap-2"
                            >
                                <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400 group-hover:text-blue-700 transition-colors" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-blue-700 group-hover:underline truncate" title={source.title}>
                                        {source.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {domain}
                                    </p>
                                </div>
                            </a>
                        );
                    } catch (e) {
                        return null;
                    }
                })}
             </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Fondation OCP - Intelligence Stratégique | Direction Agriculture Résiliente</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Système opérationnel</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
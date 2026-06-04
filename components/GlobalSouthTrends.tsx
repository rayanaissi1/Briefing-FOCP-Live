import React from 'react';
import { GlobalSouthTrend } from '../types';
import { Globe, TrendingUp, Users, Cpu, Leaf, MoreHorizontal, Scale, ExternalLink } from 'lucide-react';

interface GlobalSouthTrendsProps {
  trends: GlobalSouthTrend[];
}

const getCategoryIcon = (category: string) => {
    if (!category) return <MoreHorizontal className="w-4 h-4 text-gray-600" />;
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('politique')) return <Scale className="w-4 h-4 text-purple-600" />;
    if (lowerCat.includes('économie') || lowerCat.includes('economie')) return <TrendingUp className="w-4 h-4 text-blue-600" />;
    if (lowerCat.includes('social')) return <Users className="w-4 h-4 text-orange-600" />;
    if (lowerCat.includes('technologie')) return <Cpu className="w-4 h-4 text-cyan-600" />;
    if (lowerCat.includes('environnement') || lowerCat.includes('climat')) return <Leaf className="w-4 h-4 text-green-600" />;
    return <MoreHorizontal className="w-4 h-4 text-gray-600" />;
};

const GlobalSouthTrends: React.FC<GlobalSouthTrendsProps> = ({ trends }) => {
  if (!trends || trends.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
            <Globe className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Focus Pays du Sud</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trends.map((countryTrend, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-orange-50 to-white px-5 py-3 border-b border-orange-100 flex items-center gap-3">
                <img 
                    src={countryTrend.flagImageUrl} 
                    alt={`Drapeau ${countryTrend.country}`} 
                    className="w-8 h-6 object-cover rounded shadow-sm"
                    referrerPolicy="no-referrer"
                />
                <h3 className="font-bold text-gray-900">{countryTrend.country}</h3>
            </div>
            
            <div className="p-5 space-y-6">
                {countryTrend.trends.map((trend, tIndex) => (
                    <div key={tIndex} className="relative pl-4 border-l-2 border-gray-100 hover:border-orange-300 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                            {getCategoryIcon(trend.category)}
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{trend.category}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">{trend.title}</h4>
                        <ul className="space-y-1.5 mb-3">
                            {trend.points && trend.points.map((point, pIndex) => (
                                <li key={pIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                        <a 
                            href={trend.reference.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span>Source : {trend.reference.source}</span>
                        </a>
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalSouthTrends;

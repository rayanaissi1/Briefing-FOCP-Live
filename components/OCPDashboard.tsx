import React from 'react';
import { OcpKeyFigures } from '../types';
import { BarChart3, Users, Factory, DollarSign, Newspaper, ExternalLink, TrendingUp } from 'lucide-react';

interface OCPDashboardProps {
  data: OcpKeyFigures;
}

const StatCard = ({ icon: Icon, label, value, subtext }: { icon: any, label: string, value: string, subtext?: string }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-green-50 rounded-lg text-green-700">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const OCPDashboard: React.FC<OCPDashboardProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-600 rounded-lg shadow-sm">
                <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Tableau de Bord Groupe OCP</h2>
                <p className="text-sm text-gray-500">Indicateurs clés de performance & Actualités Corporate</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={DollarSign} label="Chiffre d'Affaires" value={data.turnover} subtext="Dernier exercice" />
            <StatCard icon={TrendingUp} label="EBITDA" value={data.ebitda} subtext="Marge opérationnelle" />
            <StatCard icon={Factory} label="Investissement" value={data.investment} subtext="CAPEX" />
            <StatCard icon={Users} label="Collaborateurs" value={data.employees} subtext="Effectif total" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-green-600" />
                Dernières Actualités Confirmées
            </h3>
            <div className="space-y-4">
                {data.confirmedNews && data.confirmedNews.map((news, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div>
                            <span className="text-xs font-semibold text-green-600 mb-1 block">{news.date} • {news.source}</span>
                            <h4 className="text-sm font-medium text-gray-900">{news.title}</h4>
                        </div>
                        {news.url && (
                            <a 
                                href={news.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                            >
                                Lire <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default OCPDashboard;

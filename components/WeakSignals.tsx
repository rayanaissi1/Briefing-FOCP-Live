import React from 'react';
import { WeakSignal } from '../types';
import { Radar, ExternalLink, Clock, Zap, ShieldCheck } from 'lucide-react';

interface WeakSignalsProps {
  signals: WeakSignal[];
}

const ConfidenceBadge: React.FC<{ level: 'low' | 'medium' | 'high' }> = ({ level }) => {
    const config = {
        low: { text: 'Faible', color: 'bg-yellow-100 text-yellow-800' },
        medium: { text: 'Moyen', color: 'bg-orange-100 text-orange-800' },
        high: { text: 'Élevé', color: 'bg-green-100 text-green-800' },
    };
    const current = config[level];
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${current.color}`}>{current.text}</span>;
};

const WeakSignals: React.FC<WeakSignalsProps> = ({ signals }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
        <Radar className="w-4 h-4" />
        Signaux Faibles & Tendances Émergentes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map((signal, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col p-6 h-full transition-all hover:shadow-lg hover:border-indigo-200">
            <div className="flex-grow">
              <h3 className="font-bold text-gray-900 leading-tight">"{signal.signal}"</h3>
              
              <div className="mt-4">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3 h-3"/>
                    Impact Potentiel
                </h4>
                <p className="text-sm text-gray-600 mt-1">{signal.potentialImpact}</p>
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Horizon: <span className="font-bold text-gray-700">{signal.timescale}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Confiance: <ConfidenceBadge level={signal.confidenceLevel} />
                </div>
              </div>
              <a 
                href={signal.reference.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline font-semibold"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span>Source : {signal.reference.source}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeakSignals;
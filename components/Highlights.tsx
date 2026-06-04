import React from 'react';
import { Highlight } from '../types';
import { Heart, Megaphone } from 'lucide-react';

interface HighlightsProps {
  highlights: Highlight[];
}

const HighlightCard: React.FC<{ highlight: Highlight }> = ({ highlight }) => {
    const isCoeur = highlight.type === 'coeur';
    
    const config = {
        coeur: {
            Icon: Heart,
            title: "Coup de Cœur Afrique",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            iconColor: "text-green-600",
            iconBgColor: "bg-green-100",
        },
        gueule: {
            Icon: Megaphone,
            title: "Coup de Gueule",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            iconColor: "text-red-600",
            iconBgColor: "bg-red-100",
        }
    };

    const current = config[highlight.type];

    return (
        <div className={`p-6 rounded-xl border ${current.bgColor} ${current.borderColor} flex flex-col`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${current.iconBgColor}`}>
                    <current.Icon className={`w-6 h-6 ${current.iconColor}`} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{current.title}</h3>
                    <p className="text-sm font-semibold text-gray-500">{highlight.country}</p>
                </div>
            </div>
            <div className="mt-4 pl-14">
                <p className="text-base font-semibold text-gray-900">"{highlight.title}"</p>
                <p className="text-sm text-gray-600 mt-1">{highlight.details}</p>
            </div>
        </div>
    );
};

const Highlights: React.FC<HighlightsProps> = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;

  const coupDeCoeur = highlights.find(h => h.type === 'coeur');
  const coupDeGueule = highlights.find(h => h.type === 'gueule');

  return (
    <div className="mb-8 animate-fade-in">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3">Les Points Clés du Jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coupDeCoeur && <HighlightCard highlight={coupDeCoeur} />}
            {coupDeGueule && <HighlightCard highlight={coupDeGueule} />}
        </div>
    </div>
  );
};

export default Highlights;
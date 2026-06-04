
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { StrategicMove } from '../types';
import { Briefcase, ExternalLink, MapPin, Building, Calendar, FileText, Building2, Globe, RefreshCw, Search } from 'lucide-react';
import GenerativeImage from './GenerativeImage';

interface StrategicMovesProps {
  moves: StrategicMove[];
  onRefreshOCP?: () => Promise<void>;
  onRefreshInternational?: () => Promise<void>;
}

const OCP_ENTITY_MAP: Record<string, string> = {
    'ocp africa': 'OCP Africa',
    'ocp nutricrops': 'OCP Nutricrops',
    'ocp solutions': 'OCP Solutions',
    'ocp maintenance solutions': 'OCP Maintenance Solutions (OCP MS)',
    'phosboucraa': 'Phosboucraa',
    'um6p': 'Université Mohammed VI Polytechnique (UM6P)',
    'fondation ocp': 'Fondation OCP',
    'innovx': 'InnovX',
    'um6p ventures': 'UM6P Ventures',
    'africa business school': 'Africa Business School (ABS)',
    '1337': '1337',
    'youcode': 'YouCode',
    'agriedge': 'AgriEdge',
    'jesa': 'JESA',
    'imacid': 'IMACID',
    'emaphos': 'EMAPHOS',
    'ocp': 'Groupe OCP (Gouvernance)',
};

const OCP_ECOSYSTEM_KEYWORDS = Object.keys(OCP_ENTITY_MAP);

const MoveItem: React.FC<{ move: StrategicMove }> = ({ move }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-lg hover:border-blue-200 mt-12">
        <div className="flex items-start gap-5">
            <div className="flex-shrink-0 -mt-10 relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-gray-50 to-gray-200 relative ring-1 ring-gray-200">
                    <GenerativeImage
                        src={move.imageUrl}
                        alt={`Portrait de ${move.personName}`}
                        prompt={`Professional Linkedin style headshot of ${move.personName}, ${move.newRole} at ${move.company}. White background, business attire.`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        enableAutoGeneration={false}
                    />
                    
                    {/* Aesthetic Search Button Overlay */}
                    <a 
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(move.personName + " " + move.company)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]"
                        title="Rechercher la photo réelle sur Google"
                    >
                        <div className="bg-white/20 p-2 rounded-full border border-white/50 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Search className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                    </a>
                </div>
            </div>
            <div className='flex-grow'>
                <p className="font-bold text-lg text-gray-900">{move.personName}</p>
                <p className="text-sm font-semibold text-blue-700">{move.newRole}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <div className="flex items-center gap-1.5"><Building className="w-3 h-3"/>{move.company}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/>{move.country}</div>
                </div>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
             <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                    <span className="font-semibold">Date de nomination :</span> {move.appointmentDate}
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Parcours & Expérience
                </h4>
                <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown
                        components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                            p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                        }}
                    >
                        {move.background}
                    </ReactMarkdown>
                </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
                <a 
                    href={move.reference.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span>Source</span>
                </a>
                {move.linkedinUrl && (
                    <a 
                        href={move.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium"
                    >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        <span>LinkedIn</span>
                    </a>
                )}
            </div>
        </div>
    </div>
  );
};


const StrategicMoves: React.FC<StrategicMovesProps> = ({ moves, onRefreshOCP, onRefreshInternational }) => {
  const [refreshingOCP, setRefreshingOCP] = useState(false);
  const [refreshingIntl, setRefreshingIntl] = useState(false);

  const handleRefreshOCP = async () => {
    if (onRefreshOCP) {
      setRefreshingOCP(true);
      try {
        await onRefreshOCP();
      } finally {
        setRefreshingOCP(false);
      }
    }
  };

  const handleRefreshIntl = async () => {
    if (onRefreshInternational) {
        setRefreshingIntl(true);
        try {
            await onRefreshInternational();
        } finally {
            setRefreshingIntl(false);
        }
    }
  };

  if (!moves || moves.length === 0) return null;

  const initialAcc: { ocpMoves: StrategicMove[]; externalMoves: StrategicMove[] } = {
    ocpMoves: [],
    externalMoves: []
  };

  const { ocpMoves, externalMoves } = moves.reduce(
    (acc, move) => {
      const isOcp = OCP_ECOSYSTEM_KEYWORDS.some(keyword =>
        move.company.toLowerCase().includes(keyword)
      );
      if (isOcp) {
        acc.ocpMoves.push(move);
      } else {
        acc.externalMoves.push(move);
      }
      return acc;
    },
    initialAcc
  );

  const initialGrouped: Record<string, StrategicMove[]> = {};

  const groupedOcpMoves = ocpMoves.reduce((acc, move) => {
    let assignedEntity = OCP_ENTITY_MAP['ocp']; // Default category
    let longestMatch = '';

    for (const keyword of OCP_ECOSYSTEM_KEYWORDS) {
        if (move.company.toLowerCase().includes(keyword) && keyword.length > longestMatch.length) {
            longestMatch = keyword;
        }
    }
    
    if (longestMatch && OCP_ENTITY_MAP[longestMatch]) {
        assignedEntity = OCP_ENTITY_MAP[longestMatch];
    }
    
    if (!acc[assignedEntity]) {
        acc[assignedEntity] = [];
    }
    acc[assignedEntity].push(move);

    return acc;
  }, initialGrouped);

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Mouvements Stratégiques (Nominations C-Suite)
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* OCP Column */}
          <div className={`transition-opacity duration-300 ${refreshingOCP ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center justify-between pb-2 border-b-2 border-green-500">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-600"/>
                    Écosystème OCP
                </h3>
                {onRefreshOCP && (
                    <button 
                        onClick={handleRefreshOCP} 
                        disabled={refreshingOCP}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                        title="Actualiser nominations OCP"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshingOCP ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>
            
            {Object.keys(groupedOcpMoves).length > 0 ? (
                Object.entries(groupedOcpMoves).map(([entityName, entityMoves]) => (
                    <div key={entityName} className="mt-6">
                        <h4 className="text-md font-semibold text-gray-700 border-l-4 border-green-400 pl-3 mb-2">{entityName}</h4>
                        {(entityMoves as StrategicMove[]).map((move, index) => <MoveItem key={`ocp-${entityName}-${index}`} move={move} />)}
                    </div>
                ))
            ) : (
                <p className="text-sm text-gray-500 italic mt-4">Aucune nomination interne significative détectée.</p>
            )}
          </div>

          {/* International Column */}
          <div className={`transition-opacity duration-300 ${refreshingIntl ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600"/>
                    Nominations à l'International
                </h3>
                {onRefreshInternational && (
                    <button 
                        onClick={handleRefreshIntl} 
                        disabled={refreshingIntl}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                        title="Actualiser nominations Internationales"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshingIntl ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

             {externalMoves.length > 0 ? (
                externalMoves.map((move, index) => <MoveItem key={`ext-${index}`} move={move} />)
            ) : (
                <p className="text-sm text-gray-500 italic mt-4">Aucune nomination externe significative détectée.</p>
            )}
          </div>
      </div>
    </div>
  );
};

export default StrategicMoves;

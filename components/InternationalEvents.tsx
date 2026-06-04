import React, { useState } from 'react';
import { InternationalEvent, AnnualEvent } from '../types';
import { CalendarDays, MapPin, CalendarRange, Sprout, Globe, Factory, Leaf, Landmark, Flag, Users, ExternalLink, RefreshCw, Search } from 'lucide-react';

interface InternationalEventsProps {
  events: InternationalEvent[];
  annualEvents?: AnnualEvent[];
  onRefreshInternational?: () => Promise<void>;
  onRefreshAnnual?: () => Promise<void>;
}

const ThemeIcon: React.FC<{ theme: string }> = ({ theme }) => {
    // ... (ThemeIcon logic remains same)
    const t = theme.toLowerCase();
    
    // Environment / Agriculture
    if (t.includes('sol') || t.includes('terre') || t.includes('agri')) return <Sprout className="w-4 h-4 text-green-600" />;
    if (t.includes('muraille') || t.includes('verte') || t.includes('forêt') || t.includes('biodiv')) return <Leaf className="w-4 h-4 text-emerald-600" />;
    if (t.includes('carbone') || t.includes('industrie') || t.includes('finance')) return <Factory className="w-4 h-4 text-gray-600" />;
    
    // International Orgs & Politics
    if (t.includes('cop') || t.includes('climat')) return <Globe className="w-4 h-4 text-blue-600" />;
    if (t.includes('onu') || t.includes('un ') || t.includes('nations unies')) return <Landmark className="w-4 h-4 text-blue-800" />;
    if (t.includes('union africaine') || t.includes('ua ') || t.includes('au ')) return <Flag className="w-4 h-4 text-yellow-600" />;
    if (t.includes('forum') || t.includes('sommet')) return <Users className="w-4 h-4 text-purple-600" />;

    return <Globe className="w-4 h-4 text-slate-500" />;
};

const InternationalEvents: React.FC<InternationalEventsProps> = ({ events, annualEvents, onRefreshInternational, onRefreshAnnual }) => {
  const [refreshingIntl, setRefreshingIntl] = useState(false);
  const [refreshingAnnual, setRefreshingAnnual] = useState(false);

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

  const handleRefreshAnnual = async () => {
    if (onRefreshAnnual) {
        setRefreshingAnnual(true);
        try {
            await onRefreshAnnual();
        } finally {
            setRefreshingAnnual(false);
        }
    }
  };

  if ((!events || events.length === 0) && (!annualEvents || annualEvents.length === 0)) return null;

  return (
    <div className="mb-8 animate-fade-in">
        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Agenda International & Stratégique
        </h2>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonne 1 : Actualités Hebdo */}
            <div className={`space-y-4 transition-opacity duration-300 ${refreshingIntl ? 'opacity-50' : 'opacity-100'}`}>
                 <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600"/>
                        Cette Semaine
                    </h3>
                    {onRefreshInternational && (
                        <button 
                            onClick={handleRefreshIntl} 
                            disabled={refreshingIntl}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                            title="Actualiser les événements de la semaine"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingIntl ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>

                {events && events.map((event, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 h-auto group">
                        <div className="p-2 bg-blue-50 rounded-lg mt-1 flex-shrink-0">
                            <CalendarDays className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className='flex-grow'>
                            <a 
                                href={`https://www.google.com/search?q=${encodeURIComponent(event.name + " " + event.date)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-gray-800 text-sm hover:text-blue-600 hover:underline flex items-center gap-1"
                                title="Rechercher sur Google"
                            >
                                {event.name}
                                <Search className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </a>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-blue-700">{event.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                                    <MapPin className="w-3 h-3"/>
                                    <span>{event.location}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                        </div>
                    </div>
                ))}
                {(!events || events.length === 0) && <p className="text-sm text-gray-500 italic">Aucun événement cette semaine.</p>}
            </div>

            {/* Colonne 2 : Agenda Annuel */}
            <div className={`space-y-4 transition-opacity duration-300 ${refreshingAnnual ? 'opacity-50' : 'opacity-100'}`}>
                 <div className="flex items-center justify-between pb-2 border-b-2 border-green-600">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-green-700"/>
                        Agenda Stratégique Annuel (Phare)
                    </h3>
                    {onRefreshAnnual && (
                        <button 
                            onClick={handleRefreshAnnual} 
                            disabled={refreshingAnnual}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                            title="Actualiser l'agenda annuel"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingAnnual ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>

                {annualEvents && annualEvents.map((event, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex items-start gap-4 h-auto group">
                        <div className="p-2 bg-green-50 rounded-lg mt-1 flex-shrink-0">
                            <ThemeIcon theme={event.theme} />
                        </div>
                        <div className='flex-grow'>
                             <div className="flex justify-between items-start">
                                <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(event.name + " " + event.dateRange)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-gray-800 text-sm hover:text-green-600 hover:underline flex items-center gap-1"
                                    title="Rechercher sur Google"
                                >
                                    {event.name}
                                    <Search className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </a>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 ml-2 whitespace-nowrap">
                                    {event.theme}
                                </span>
                             </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <CalendarRange className="w-3 h-3"/>
                                    <span className="font-semibold text-green-700">{event.dateRange}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                    <MapPin className="w-3 h-3"/>
                                    <span>{event.location}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                            {/* @ts-ignore */}
                            {event.url && (
                                <a 
                                    /* @ts-ignore */
                                    href={event.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline mt-2"
                                >
                                    Site Officiel <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
                 {(!annualEvents || annualEvents.length === 0) && <p className="text-sm text-gray-500 italic">Aucun événement majeur identifié pour le reste de l'année.</p>}
            </div>
        </div>
    </div>
  );
};

export default InternationalEvents;
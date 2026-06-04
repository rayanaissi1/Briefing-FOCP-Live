import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FOCUS_COUNTRIES } from '../constants';
import { generateCountryFocus } from '../services/geminiService';
import { CountryFocusData, LoadingState } from '../types';
import { 
    Map, Loader, AlertTriangle, Shield, CloudSun, Vote, UserCheck, 
    Building2, ExternalLink, Sprout, Gavel, FileText, Target, 
    Info, Factory, RefreshCw, BookOpen, Users, Plus, X
} from 'lucide-react';

const SectionHeader: React.FC<{ icon: React.ElementType; title: string; className?: string }> = ({ icon: Icon, title, className = '' }) => (
    <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 ${className}`}>
        <Icon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">{title}</h3>
    </div>
);

const DataRow: React.FC<{ label: string; value: string; isMarkdown?: boolean }> = ({ label, value, isMarkdown = false }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-xs font-semibold text-gray-500 uppercase w-full sm:w-1/3 flex-shrink-0">{label}</span>
        <div className="text-sm text-gray-800 font-medium w-full sm:w-2/3 text-left sm:text-right">
            {isMarkdown ? (
                <ReactMarkdown 
                    className="prose prose-sm max-w-none text-gray-800 text-left sm:text-right"
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-gray-400" {...props} />,
                        p: ({node, ...props}) => <p className="m-0" {...props} />
                    }}
                >
                    {value || ''}
                </ReactMarkdown>
            ) : (
                value || '-'
            )}
        </div>
    </div>
);

interface CountryReport {
    id: number;
    country: string;
    loadingState: LoadingState;
    data: CountryFocusData | null;
    error: string | null;
}

const CountryFocus: React.FC = () => {
    const [selectedCountry, setSelectedCountry] = useState(FOCUS_COUNTRIES[0]);
    const [reports, setReports] = useState<CountryReport[]>([]);

    const handleAddCountry = async () => {
        const newId = Date.now();
        const countryToFetch = selectedCountry;
        
        setReports(prev => [{ id: newId, country: countryToFetch, loadingState: LoadingState.LOADING, data: null, error: null }, ...prev]);
        
        try {
            const data = await generateCountryFocus(countryToFetch);
            setReports(prev => prev.map(r => r.id === newId ? { ...r, loadingState: LoadingState.SUCCESS, data } : r));
        } catch (err) {
            setReports(prev => prev.map(r => r.id === newId ? { ...r, loadingState: LoadingState.ERROR, error: `Impossible de générer le focus pour ${countryToFetch}.` } : r));
        }
    };

    const handleRemoveReport = (id: number) => {
        setReports(prev => prev.filter(r => r.id !== id));
    };

    const handleRetry = async (id: number, country: string) => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, loadingState: LoadingState.LOADING, error: null } : r));
        try {
            const data = await generateCountryFocus(country);
            setReports(prev => prev.map(r => r.id === id ? { ...r, loadingState: LoadingState.SUCCESS, data } : r));
        } catch (err) {
            setReports(prev => prev.map(r => r.id === id ? { ...r, loadingState: LoadingState.ERROR, error: `Impossible de générer le focus pour ${country}.` } : r));
        }
    };

    const renderReport = (report: CountryReport) => {
        if (report.loadingState === LoadingState.LOADING) {
            return (
                <div key={report.id} className="mt-6 space-y-6 animate-pulse relative bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
                        <button onClick={() => handleRemoveReport(report.id)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            );
        }

        if (report.loadingState === LoadingState.ERROR) {
            return (
                <div key={report.id} className="mt-6 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center relative">
                    <button onClick={() => handleRemoveReport(report.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button>
                    <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
                    <p className="font-bold text-lg mb-2">Erreur de génération ({report.country})</p>
                    <p className="mb-4">{report.error}</p>
                    <button
                        onClick={() => handleRetry(report.id, report.country)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Réessayer
                    </button>
                </div>
            );
        }

        if (!report.data) return null;
        const focusData = report.data;

        return (
            <div key={report.id} className="mt-8 space-y-6 animate-fade-in-up relative bg-slate-50/50 p-4 sm:p-6 rounded-3xl border border-slate-200">
                <button 
                    onClick={() => handleRemoveReport(report.id)} 
                    className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                    title="Fermer ce focus"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* HEADER & IDENTITY */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <img 
                        src={focusData.flagUrl} 
                        alt={`Drapeau ${focusData.countryName}`} 
                        className="w-32 h-auto rounded-lg shadow-md border border-gray-100 object-cover"
                    />
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-4 pr-10">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{focusData.countryName}</h2>
                                <p className="text-gray-500 text-sm">{focusData.identity.officialName}</p>
                            </div>
                            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Fiche Pays FOCP
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                            <DataRow label="Capitale" value={focusData.identity.capital} />
                            <DataRow label="Région" value={focusData.identity.region} />
                            <DataRow label="Population" value={focusData.identity.population} />
                            <DataRow label="PIB" value={focusData.identity.gdp} />
                            <DataRow label="PIB Agricole" value={focusData.identity.agGdpPercent} />
                            <DataRow label="Monnaie" value={focusData.identity.currency} />
                            <DataRow label="Langues" value={focusData.identity.officialLanguages} />
                            <DataRow label="Régime" value={focusData.identity.politicalRegime} />
                            <DataRow label="Stabilité" value={focusData.identity.politicalStabilityIndex} />
                            <DataRow label="Corruption" value={focusData.identity.corruptionIndex} />
                        </div>
                    </div>
                </div>

                {/* EXECUTIVE SUMMARY & FOCP INDICATORS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                        <SectionHeader icon={FileText} title="Synthèse Exécutive" />
                        <div className="space-y-3 text-sm text-gray-700">
                            <p><span className="font-bold text-indigo-900">Priorité Stratégique :</span> {focusData.executiveSummary.priorityLevel}</p>
                            <div className="border-l-2 border-red-200 pl-3">
                                <span className="font-bold text-red-800 block mb-1">Risques Majeurs :</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-700">{focusData.executiveSummary.majorRisks}</ReactMarkdown>
                            </div>
                            <div className="border-l-2 border-green-200 pl-3">
                                <span className="font-bold text-green-800 block mb-1">Opportunités :</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-700">{focusData.executiveSummary.opportunities}</ReactMarkdown>
                            </div>
                            <div className="border-l-2 border-amber-200 pl-3">
                                <span className="font-bold text-amber-800 block mb-1">Points de Vigilance :</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-700">{focusData.executiveSummary.watchPoints}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <SectionHeader icon={Target} title="Indicateurs FOCP" />
                        <div className="space-y-2">
                            <DataRow label="Dépendance Import" value={focusData.focpIndicators.importDependency} />
                            <DataRow label="Potentiel Croissance" value={focusData.focpIndicators.growthPotential} />
                            <DataRow label="Risque Climat" value={focusData.focpIndicators.climateRisk} />
                            <DataRow label="Sensibilité Prix" value={focusData.focpIndicators.fertilizerSensitivity} />
                            <div className="pt-2 mt-2 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Opportunités Coop.</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-800 leading-snug">{focusData.focpIndicators.coopOpportunities}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 2. PROFIL AGRICOLE */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <SectionHeader icon={Sprout} title="Profil Agricole Stratégique" />
                        <div className="space-y-2">
                            <DataRow label="Pop. Active Agri" value={focusData.agriculturalProfile.activePopulationInAg} />
                            <DataRow label="Pop. Rurale" value={focusData.agriculturalProfile.ruralPopulation} />
                            <DataRow label="Cultures Principales" value={focusData.agriculturalProfile.mainCrops} isMarkdown />
                            <DataRow label="Surface Cultivable" value={focusData.agriculturalProfile.arableLand} />
                            <DataRow label="Irrigation" value={focusData.agriculturalProfile.irrigationLevel} />
                            <DataRow label="Mécanisation" value={focusData.agriculturalProfile.mechanizationLevel} />
                            <DataRow label="Dépendance Alim." value={focusData.agriculturalProfile.foodImportDependency} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Vulnérabilité Climatique</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-800">{focusData.agriculturalProfile.climateVulnerability}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* 3. MARCHÉ DES ENGRAIS */}
                    <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm ring-1 ring-blue-50">
                        <SectionHeader icon={Factory} title="Marché des Engrais (Prioritaire)" className="text-blue-800" />
                        <div className="space-y-2">
                            <DataRow label="Consommation" value={focusData.fertilizerMarket.annualConsumption} />
                            <DataRow label="Importations" value={focusData.fertilizerMarket.imports} isMarkdown />
                            <DataRow label="Production Locale" value={focusData.fertilizerMarket.localProduction} isMarkdown />
                            <DataRow label="Subventions" value={focusData.fertilizerMarket.subsidies} isMarkdown />
                            <DataRow label="Acteurs Clés" value={focusData.fertilizerMarket.dominantPlayers} isMarkdown />
                            <DataRow label="Sensibilité Prix" value={focusData.fertilizerMarket.priceSensitivity} />
                            <DataRow label="Tendance Récente" value={focusData.fertilizerMarket.recentTrend} />
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-xs font-bold text-blue-800 uppercase block mb-1">Présence OCP</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-blue-900">{focusData.fertilizerMarket.ocpPresence}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* 4. POLITIQUE AGRICOLE */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <SectionHeader icon={Gavel} title="Politique Agricole" />
                        <div className="space-y-2">
                            <DataRow label="Stratégie" value={focusData.agriculturalPolicy.strategyName} />
                            <DataRow label="Lancement" value={focusData.agriculturalPolicy.launchYear} />
                            <DataRow label="Orientation" value={focusData.agriculturalPolicy.tradeOrientation} />
                            <DataRow label="Accès Financement" value={focusData.agriculturalPolicy.accessToFinance} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Objectifs</span>
                                <ReactMarkdown className="prose prose-sm max-w-none text-gray-800">{focusData.agriculturalPolicy.objectives}</ReactMarkdown>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Réformes & Subventions</span>
                                <p className="text-sm text-gray-800">{focusData.agriculturalPolicy.recentReforms} / {focusData.agriculturalPolicy.subsidiesPrograms}</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. CLIMAT & ENVIRONNEMENT */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <SectionHeader icon={CloudSun} title="Climat & Risques" />
                        <div className="space-y-2">
                            <DataRow label="Climat Dominant" value={focusData.climateAndEnv.dominantClimate} />
                            <DataRow label="Pluviométrie" value={focusData.climateAndEnv.rainfallTrend} />
                            <DataRow label="Stress Hydrique" value={focusData.climateAndEnv.waterStress} />
                            <DataRow label="Risque Sécheresse" value={focusData.climateAndEnv.droughtRisk} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Impact Agricole</span>
                                <p className="text-sm text-gray-800">{focusData.climateAndEnv.agImpact}</p>
                            </div>
                        </div>
                    </div>

                    {/* 6. SÉCURITÉ & GÉOPOLITIQUE */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <SectionHeader icon={Shield} title="Sécurité & Géopolitique" />
                        <div className="space-y-2">
                            <DataRow label="Niveau Stabilité" value={focusData.securityAndGeopolitics.stabilityLevel} />
                            <DataRow label="Position Régionale" value={focusData.securityAndGeopolitics.regionalPosition} />
                            <DataRow label="Dépendance Énergie" value={focusData.securityAndGeopolitics.energyDependency} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Conflits & Risques</span>
                                <p className="text-sm text-gray-800">{focusData.securityAndGeopolitics.conflicts}</p>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Logistique Agricole</span>
                                <p className="text-sm text-gray-800">{focusData.securityAndGeopolitics.logisticsRisks}</p>
                            </div>
                        </div>
                    </div>

                    {/* 7. GOUVERNANCE & 8. POLITIQUE */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <SectionHeader icon={Users} title="Gouvernance Agricole" />
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs font-bold text-gray-500 uppercase block">Ministre Agriculture</span>
                                    <p className="font-bold text-gray-900">{focusData.agriculturalGovernance.ministerAg.name}</p>
                                    <p className="text-xs text-gray-500 mb-1">Nomination: {focusData.agriculturalGovernance.ministerAg.nominationDate}</p>
                                    <p className="text-xs text-gray-700 italic">{focusData.agriculturalGovernance.ministerAg.bio}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs font-bold text-gray-500 uppercase block">Ministre Environnement</span>
                                    <p className="font-bold text-gray-900">{focusData.agriculturalGovernance.ministerEnv.name}</p>
                                    <p className="text-xs text-gray-500 mb-1">Nomination: {focusData.agriculturalGovernance.ministerEnv.nominationDate}</p>
                                    <p className="text-xs text-gray-700 italic">{focusData.agriculturalGovernance.ministerEnv.bio}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <SectionHeader icon={Vote} title="Calendrier Politique" />
                            <DataRow label="Prochaine Élection" value={focusData.politicalCalendar.nextElection} />
                            <DataRow label="Élections Locales" value={focusData.politicalCalendar.localElections} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Impact sur Politique Agricole</span>
                                <p className="text-sm text-gray-800">{focusData.politicalCalendar.impactOnAg}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LATEST NEWS */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <SectionHeader icon={BookOpen} title="Dernières Actualités" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {focusData.latestNews.map((news, i) => (
                            <a 
                                key={i} 
                                href={news.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all group"
                            >
                                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 mb-2 line-clamp-2">{news.title}</h4>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{news.source}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold uppercase text-gray-700 tracking-wider flex items-center gap-2">
                        <Map className="w-5 h-5 text-indigo-600" />
                        Focus Pays du Sud
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Analyse stratégique détaillée et structurée. Vous pouvez ajouter plusieurs pays pour les comparer.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="block w-full sm:w-48 px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700"
                    >
                        {FOCUS_COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddCountry}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter
                    </button>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 mt-6">
                    <Map className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium text-lg text-gray-600">Sélectionnez un pays et cliquez sur Ajouter</p>
                    <p className="text-sm text-gray-400">Génère une fiche pays complète pour la veille stratégique.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reports.map(renderReport)}
                </div>
            )}
        </div>
    );
};

export default CountryFocus;
import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AlertsTable from "./components/AlertsTable";
import BriefingCard from "./components/BriefingCard";
import CommodityPrices from "./components/CommodityPrices";
import Highlights from "./components/Highlights";
import CountryFocus from "./components/CountryFocus";
import OcpGroupNews from "./components/OcpGroupNews";
import InternationalEvents from "./components/InternationalEvents";
import ImageOfTheDay from "./components/ImageOfTheDay";
import VideoOfTheDay from "./components/VideoOfTheDay";
import GlobalSouthTrends from "./components/GlobalSouthTrends";
import AfricanHeritage from "./components/AfricanHeritage";
import SoftPowerInfluence from "./components/SoftPowerInfluence";
import StrategicMoves from "./components/StrategicMoves";
import WeakSignals from "./components/WeakSignals";
import StrategicArticle from "./components/StrategicArticle";
import OCPDashboard from "./components/OCPDashboard";
import CompetitorAnalysis from "./components/CompetitorAnalysis";
import {
  generateDashboardCore,
  refreshBriefingSection,
} from "./services/geminiService";
import { BriefingData, LoadingState } from "./types";
import { showBriefingReadyNotification } from "./utils/notifications";
import {
  Globe,
  AlertOctagon,
  Building2,
  FlaskConical,
  Globe2,
  Shield,
  Swords,
  Leaf,
  RefreshCw,
} from "lucide-react";

// Configuration pour les cartes de briefing qui se chargeront dynamiquement
const briefingSections = [
  {
    type: "marocNews",
    title: "Actualités Maroc",
    icon: Building2,
    colorClass: "bg-red-100",
    borderColorClass: "border-red-500",
  },
  {
    type: "ocpEcosystem",
    title: "Écosystème OCP",
    icon: FlaskConical,
    colorClass: "bg-green-100",
    borderColorClass: "border-green-500",
  },
  {
    type: "competitorAnalysis",
    title: "Analyse Concurrentielle",
    icon: Swords,
    colorClass: "bg-blue-100",
    borderColorClass: "border-blue-500",
  },
  {
    type: "africaHorizon",
    title: "Horizon Afrique",
    icon: Globe2,
    colorClass: "bg-yellow-100",
    borderColorClass: "border-yellow-500",
  },
  {
    type: "geopoliticsAfrica",
    title: "Géopolitique Africaine",
    icon: Shield,
    colorClass: "bg-purple-100",
    borderColorClass: "border-purple-500",
  },
  {
    type: "environmentalIssues",
    title: "Enjeux Environnementaux",
    icon: Leaf,
    colorClass: "bg-teal-100",
    borderColorClass: "border-teal-500",
  },
];

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(
    LoadingState.IDLE,
  );
  const [dashboardData, setDashboardData] =
    useState<Partial<BriefingData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTrigger, setGenerationTrigger] = useState(0);

  const handleGenerate = async () => {
    setLoadingState(LoadingState.LOADING);
    setDashboardData(null);
    setError(null);
    try {
      const data = await generateDashboardCore(new Date());
      setDashboardData(data);
      setLoadingState(LoadingState.SUCCESS);
      // Guard against undefined date to satisfy TypeScript string parameter
      if (data.date) showBriefingReadyNotification(data.date);
      setGenerationTrigger((prev) => prev + 1); // Déclenche le re-chargement des cartes
    } catch (err) {
      console.error(err);
      setError(
        "Impossible de générer le briefing. L'IA a peut-être renvoyé une réponse invalide ou votre quota gratuit est atteint. Veuillez patienter et réessayer.",
      );
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleRefreshSection = async (
    section:
      | "softPowerInfluence"
      | "strategicMoves"
      | "strategicMoves-OCP"
      | "strategicMoves-International"
      | "internationalEvents"
      | "annualStrategicEvents",
  ) => {
    try {
      const newData = await refreshBriefingSection(section);
      setDashboardData((prev) => {
        if (!prev) return prev;

        if (
          section === "strategicMoves-OCP" ||
          section === "strategicMoves-International"
        ) {
          const currentMoves = prev.strategicMoves || [];
          const isOcpRefresh = section === "strategicMoves-OCP";

          const OCP_KEYWORDS = [
            "ocp",
            "um6p",
            "jesa",
            "phosboucraa",
            "innovx",
            "1337",
            "youcode",
            "agriedge",
            "imacid",
            "emaphos",
          ];

          const keptMoves = currentMoves.filter((move) => {
            const isOcp = OCP_KEYWORDS.some((k) =>
              move.company.toLowerCase().includes(k),
            );
            return isOcpRefresh ? !isOcp : isOcp;
          });

          return {
            ...prev,
            strategicMoves: [
              ...keptMoves,
              ...(Array.isArray(newData) ? newData : [newData]),
            ],
          };
        }

        return {
          ...prev,
          [section]: newData,
        };
      });
    } catch (error) {
      console.error(`Error refreshing ${section}:`, error);
    }
  };

  // FIX: Suppression du useEffect qui lançait la génération automatiquement au démarrage
  // L'utilisateur devra cliquer sur "Générer" manuellement, ce qui sauve les quotas API !

  const renderContent = () => {
    switch (loadingState) {
      case LoadingState.LOADING:
        return (
          <div className="space-y-8 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-40 bg-gray-200 rounded-xl"></div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        );
      case LoadingState.SUCCESS:
        if (!dashboardData) return null;
        return (
          <div className="space-y-8">
            <div className="animate-fade-in-up">
              {dashboardData.alerts && (
                <AlertsTable alerts={dashboardData.alerts} />
              )}
              {dashboardData.commodityPrices && (
                <CommodityPrices
                  prices={dashboardData.commodityPrices}
                  marketAnalysis={dashboardData.marketAnalysis}
                />
              )}
              {dashboardData.ocpKeyFigures && (
                <OCPDashboard data={dashboardData.ocpKeyFigures} />
              )}
              {dashboardData.highlights && (
                <Highlights highlights={dashboardData.highlights} />
              )}
              {dashboardData.strategicArticle && (
                <StrategicArticle article={dashboardData.strategicArticle} />
              )}
              <CountryFocus />
              {dashboardData.ocpGroupNews && (
                <OcpGroupNews news={dashboardData.ocpGroupNews} />
              )}
              {dashboardData.competitorNews && (
                <CompetitorAnalysis news={dashboardData.competitorNews} />
              )}
              {dashboardData.weakSignals && (
                <WeakSignals signals={dashboardData.weakSignals} />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {dashboardData.imageOfTheDay && (
                  <ImageOfTheDay imageInfo={dashboardData.imageOfTheDay} />
                )}
                {dashboardData.videoOfTheDay && (
                  <VideoOfTheDay videoInfo={dashboardData.videoOfTheDay} />
                )}
              </div>
              {dashboardData.africanHeritage && (
                <AfricanHeritage heritageInfo={dashboardData.africanHeritage} />
              )}
              {dashboardData.softPowerInfluence && (
                <SoftPowerInfluence
                  influenceInfo={dashboardData.softPowerInfluence}
                  onRefresh={() => handleRefreshSection("softPowerInfluence")}
                />
              )}
              {dashboardData.strategicMoves && (
                <StrategicMoves
                  moves={dashboardData.strategicMoves}
                  onRefreshOCP={() =>
                    handleRefreshSection("strategicMoves-OCP")
                  }
                  onRefreshInternational={() =>
                    handleRefreshSection("strategicMoves-International")
                  }
                />
              )}
              {dashboardData.internationalEvents && (
                <InternationalEvents
                  events={dashboardData.internationalEvents}
                  annualEvents={dashboardData.annualStrategicEvents}
                  onRefreshInternational={() =>
                    handleRefreshSection("internationalEvents")
                  }
                  onRefreshAnnual={() =>
                    handleRefreshSection("annualStrategicEvents")
                  }
                />
              )}
              {dashboardData.globalSouthTrends && (
                <GlobalSouthTrends trends={dashboardData.globalSouthTrends} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {briefingSections.map((section, index) => (
                  <BriefingCard
                    key={section.type}
                    sectionType={section.type}
                    title={section.title}
                    icon={section.icon}
                    colorClass={section.colorClass}
                    borderColorClass={section.borderColorClass}
                    trigger={generationTrigger}
                    loadIndex={index}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case LoadingState.ERROR:
        return (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3" />
            <p className="font-bold text-lg">Erreur Système</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Relancer l'analyse
            </button>
          </div>
        );
      case LoadingState.IDLE:
      default:
        return (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center p-6 bg-slate-100 rounded-full mb-4">
              <Globe className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700">
              Prêt à générer le briefing quotidien
            </h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Cliquez sur le bouton "Générer le Briefing" en haut à droite pour
              lancer l'analyse IA des actualités stratégiques.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onGenerate={handleGenerate}
        isLoading={loadingState === LoadingState.LOADING}
        currentDate={
          dashboardData?.date ||
          new Date().toLocaleString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
        }
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {renderContent()}
      </main>

      <Footer sources={dashboardData?.groundingSources} />
    </div>
  );
};

export default App;

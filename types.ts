
export interface BriefingPoint {
  subTitle: string;
  details: string;
  references: ArticleReference[];
  verificationNeeded?: string;
}

export interface ArticleReference {
  title: string;
  source: string;
  url: string;
}

export interface BriefingSection {
  title: string;
  content: BriefingPoint[] | null;
}

export interface Alert {
  sector: string;
  event: string;
  impact: string;
  severity: 'high' | 'medium' | 'low';
  references?: ArticleReference[];
}

export interface CommodityPrice {
    name: string;
    price: string;
    unit: string; // e.g. "$/tonne"
    change: string; // e.g., "+1.5%" or "-0.8%"
    lastYearPrice: string; // Price one year ago
    evolution: string; // e.g., "+12% vs Y-1"
    trend: 'up' | 'down' | 'stable';
    analysis?: string;
}

export interface OcpKeyFigures {
    turnover: string; // Chiffre d'affaires (e.g. "91 Mrd MAD")
    ebitda: string; // EBITDA (e.g. "30 Mrd MAD")
    investment: string; // Investissement (e.g. "20 Mrd MAD")
    employees: string; // Nombre d'employés (e.g. "20 000+")
    productionCapacity: string; // Capacité de production (e.g. "12 Mt Engrais")
    confirmedNews: {
        date: string;
        title: string;
        source: string;
        url?: string;
    }[]; 
}

export interface Highlight {
  type: 'coeur' | 'gueule';
  country: string;
  title: string;
  details: string;
}

export interface InternationalEvent {
    name: string;
    date: string;
    location: string;
    description: string;
}

export interface AnnualEvent {
    name: string;
    dateRange: string;
    location: string;
    theme: string; // e.g., "Santé des Sols", "Grande Muraille Verte", "Marché Carbone"
    description: string;
    url?: string; // New field
}

export interface ImageOfTheDay {
    imageUrl: string;
    commentary: string;
    reference: ArticleReference;
}

export interface VideoOfTheDay {
    videoUrl: string;
    title: string;
    commentary: string;
    reference: ArticleReference;
    posterImagePrompt?: string;
}

export interface GlobalSouthTrend {
  country: string;
  flagImageUrl: string;
  trends: {
    category: 'Politique' | 'Économie' | 'Social' | 'Technologie' | 'Environnement' | 'Autre';
    title: string;
    points: string[]; // Changed from details string to points array for bullet points
    reference: ArticleReference;
  }[];
}

export interface AfricanHeritage {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  imagePrompt: string; // For generating an evocative image
}

export interface SoftPowerInfluence {
  name: string;
  field: string; // Business, Science, Culture, Politique
  country: string;
  presentation: string;
  impact: string;
  reasonForTrending: string;
  imageUrl: string; // URL for a real photo of the person
  reference: ArticleReference;
  ocpLink?: string; // Potential link with OCP Group/Foundation
}

export interface StrategicMove {
  personName: string;
  newRole: string;
  company: string;
  country: string;
  appointmentDate: string;
  background: string;
  imageUrl?: string;
  linkedinUrl?: string; // New field
  reference: ArticleReference;
}

export interface WeakSignal {
    signal: string;
    potentialImpact: string;
    timescale: string; // e.g., "6-12 mois"
    confidenceLevel: 'low' | 'medium' | 'high';
    reference: ArticleReference;
}

export interface BookRecommendation {
  title: string;
  author: string;
}

export interface ExpandedHeritageInfo {
  detailedDescription: string;
  bookRecommendations: BookRecommendation[];
}

export interface CountryFocusData {
  countryName: string;
  flagUrl: string;
  identity: {
    officialName: string;
    capital: string;
    region: string;
    population: string;
    gdp: string;
    agGdpPercent: string;
    officialLanguages: string;
    currency: string;
    politicalRegime: string;
    politicalStabilityIndex: string;
    corruptionIndex: string;
  };
  agriculturalProfile: {
    activePopulationInAg: string;
    ruralPopulation: string;
    mainCrops: string;
    arableLand: string;
    irrigationLevel: string;
    mechanizationLevel: string;
    foodImportDependency: string;
    climateVulnerability: string;
  };
  fertilizerMarket: {
    annualConsumption: string;
    imports: string;
    localProduction: string;
    subsidies: string;
    dominantPlayers: string;
    priceSensitivity: string;
    recentTrend: string;
    ocpPresence: string;
  };
  agriculturalPolicy: {
    strategyName: string;
    launchYear: string;
    objectives: string;
    recentReforms: string;
    subsidiesPrograms: string;
    accessToFinance: string;
    tradeOrientation: string;
  };
  climateAndEnv: {
    dominantClimate: string;
    rainfallTrend: string;
    waterStress: string;
    droughtRisk: string;
    recentExtremeEvents: string;
    agImpact: string;
  };
  securityAndGeopolitics: {
    stabilityLevel: string;
    conflicts: string;
    logisticsRisks: string;
    energyDependency: string;
    regionalPosition: string;
  };
  agriculturalGovernance: {
    ministerAg: {
      name: string;
      nominationDate: string;
      bio: string;
    };
    ministerEnv: {
      name: string;
      nominationDate: string;
      bio: string;
    };
  };
  politicalCalendar: {
    nextElection: string;
    localElections: string;
    recentElections: string;
    impactOnAg: string;
  };
  focpIndicators: {
    importDependency: string;
    growthPotential: string;
    climateRisk: string;
    fertilizerSensitivity: string;
    coopOpportunities: string;
  };
  executiveSummary: {
    priorityLevel: string;
    majorRisks: string;
    opportunities: string;
    watchPoints: string;
  };
  latestNews: ArticleReference[];
}

export interface OcpNewsItem {
  entityName: string;
  category: 'Sites Industriels' | 'Filiales' | 'Écosystème UM6P' | 'Gouvernance' | 'Projets & Initiatives';
  title: string;
  summary: string;
  reference: ArticleReference;
}

export interface GroundingSource {
  url: string;
  title: string;
  content?: string;
}

export interface StrategicArticle {
  title: string;
  analysis: string;
  reference: ArticleReference;
}

export interface CompetitorNews {
  companyName: string;
  headquarters: string; // e.g., "USA", "Russie", "Chine"
  newsTitle: string;
  newsSummary: string;
  strategicImpact: string; // Impact sur le marché ou OCP
  sourceQuality?: string; // e.g. "Haute - Rapport Officiel", "Moyenne - Presse Généraliste"
  reference: ArticleReference;
}

export interface BriefingData {
  date: string;
  alerts: Alert[];
  commodityPrices: CommodityPrice[];
  marketAnalysis?: string;
  ocpKeyFigures?: OcpKeyFigures;
  highlights: Highlight[];
  strategicArticle?: StrategicArticle;
  internationalEvents: InternationalEvent[];
  annualStrategicEvents: AnnualEvent[];
  imageOfTheDay: ImageOfTheDay;
  videoOfTheDay: VideoOfTheDay;
  globalSouthTrends: GlobalSouthTrend[];
  africanHeritage: AfricanHeritage;
  softPowerInfluence: SoftPowerInfluence;
  strategicMoves: StrategicMove[];
  weakSignals: WeakSignal[];
  ocpGroupNews: OcpNewsItem[];
  competitorNews: CompetitorNews[]; // New field for detailed competitor analysis
  marocNews: BriefingSection;
  ocpEcosystem: BriefingSection;
  africaHorizon: BriefingSection;
  geopoliticsAfrica: BriefingSection;
  competitorAnalysis: BriefingSection; // Keep this for the section text if needed, or replace/augment
  environmentalIssues: BriefingSection;
  groundingSources?: GroundingSource[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

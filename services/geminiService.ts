/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "../constants";
import {
  BriefingData,
  GroundingSource,
  ExpandedHeritageInfo,
  CountryFocusData,
  BriefingSection,
} from "../types";

// ─────────────────────────────────────────────
// CLIENT INITIALIZATION (GROQ & GEMINI)
// ─────────────────────────────────────────────

let geminiAi: GoogleGenAI;
let groqClient: Groq;

function getGeminiClient(): GoogleGenAI {
  if (!geminiAi) {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      console.warn(
        "VITE_API_KEY (Gemini) est introuvable. La génération d'images échouera.",
      );
    }
    geminiAi = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return geminiAi;
}

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "La variable VITE_GROQ_API_KEY est introuvable. Vérifiez votre fichier .env ou Netlify.",
      );
    }
    // dangerouslyAllowBrowser est requis pour utiliser Groq côté client (Vite/React)
    groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqClient;
}

// ─────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────

class SmartRateLimiter {
  private queue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  // Intervalle réduit car Groq est plus permissif, mais on garde une sécurité
  private readonly minIntervalMs = 1000;

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch {
          // Each task handles its own error via the enqueue wrapper
        }
        await new Promise((r) => setTimeout(r, this.minIntervalMs));
      }
    }

    this.isProcessing = false;
  }
}

const apiLimiter = new SmartRateLimiter();

// ─────────────────────────────────────────────
// GROQ GENERATOR HELPER
// Utilise LLaMA 3 via Groq pour générer du JSON strict
// ─────────────────────────────────────────────

async function groqGenerate<T>(
  prompt: string,
  schema: object,
  systemInstruction?: string,
): Promise<T> {
  const client = getGroqClient();
  const sysMsg =
    systemInstruction || SYSTEM_PROMPT || "Tu es un expert stratégique FOCP.";

  // Injection du schéma dans le prompt pour forcer la structure
  const fullPrompt = `${prompt}\n\nIMPORTANT : Tu dois impérativement répondre UNIQUEMENT par un objet JSON valide. La structure de ton JSON doit strictement correspondre au schéma suivant :\n${JSON.stringify(schema)}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile", // Modèle ultra-rapide et intelligent
    messages: [
      { role: "system", content: sysMsg },
      { role: "user", content: fullPrompt },
    ],
    response_format: { type: "json_object" }, // Force Groq à renvoyer un JSON parsable
    temperature: 0.2, // Température basse pour la stabilité des données
  });

  const jsonText = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(jsonText) as T;
  } catch (e) {
    console.error("[groqGenerate] JSON parse error:", e, "\nRaw:", jsonText);
    throw new Error("Invalid JSON response from Groq AI.");
  }
}

// ─────────────────────────────────────────────
// COMMON SCHEMAS
// ─────────────────────────────────────────────

const articleReferenceSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    source: { type: Type.STRING },
    url: {
      type: Type.STRING,
      description:
        "URL complète et directe de l'article source, pas la page d'accueil.",
    },
  },
  required: ["title", "source", "url"],
};

// ─────────────────────────────────────────────
// BRIEFING SCHEMAS
// ─────────────────────────────────────────────

const briefingPointSchema = {
  type: Type.OBJECT,
  properties: {
    subTitle: { type: Type.STRING },
    details: { type: Type.STRING },
    references: { type: Type.ARRAY, items: articleReferenceSchema },
    verificationNeeded: {
      type: Type.STRING,
      description:
        "Points nécessitant une vérification croisée ou basés sur une source unique/moins fiable.",
    },
  },
  required: ["subTitle", "details", "references"],
};

export const briefingSectionSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.ARRAY, items: briefingPointSchema },
  },
  required: ["title", "content"],
};

const commodityPriceSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    price: { type: Type.STRING },
    unit: {
      type: Type.STRING,
      description: "Unité de mesure (ex: $/tonne, c/bu).",
    },
    change: { type: Type.STRING },
    lastYearPrice: {
      type: Type.STRING,
      description: "Prix il y a un an (N-1).",
    },
    evolution: {
      type: Type.STRING,
      description: "Évolution sur un an (ex: +12%).",
    },
    trend: { type: Type.STRING, enum: ["up", "down", "stable"] },
    analysis: {
      type: Type.STRING,
      description:
        "Variation récente, facteurs explicatifs et corrélation avec le marché agricole.",
    },
  },
  required: [
    "name",
    "price",
    "unit",
    "change",
    "lastYearPrice",
    "evolution",
    "trend",
  ],
};

const highlightSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["coeur", "gueule"] },
    country: { type: Type.STRING },
    title: { type: Type.STRING },
    details: { type: Type.STRING },
  },
  required: ["type", "country", "title", "details"],
};

const internationalEventSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    date: { type: Type.STRING },
    location: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ["name", "date", "location", "description"],
};

const annualEventSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    dateRange: {
      type: Type.STRING,
      description: "Date précise ou mois (ex: '12-15 Novembre 2024')",
    },
    location: { type: Type.STRING },
    theme: {
      type: Type.STRING,
      description:
        "Thématique principale : Agriculture, Sol, Climat, Mangrove, Fertilisation, Afrique, Eau, Biodiversité.",
    },
    description: { type: Type.STRING },
    url: { type: Type.STRING, description: "Site officiel de l'événement." },
  },
  required: ["name", "dateRange", "location", "theme", "description"],
};

const imageOfTheDaySchema = {
  type: Type.OBJECT,
  properties: {
    imageUrl: { type: Type.STRING },
    commentary: { type: Type.STRING },
    reference: articleReferenceSchema,
  },
  required: ["imageUrl", "commentary", "reference"],
};

const videoOfTheDaySchema = {
  type: Type.OBJECT,
  properties: {
    videoUrl: { type: Type.STRING },
    title: { type: Type.STRING },
    commentary: { type: Type.STRING },
    reference: articleReferenceSchema,
    posterImagePrompt: {
      type: Type.STRING,
      description:
        "Prompt détaillé pour générer une image d'affiche cinématique représentant le sujet de la vidéo.",
    },
  },
  required: [
    "videoUrl",
    "title",
    "commentary",
    "reference",
    "posterImagePrompt",
  ],
};

const globalSouthTrendSchema = {
  type: Type.OBJECT,
  properties: {
    country: { type: Type.STRING },
    flagImageUrl: { type: Type.STRING },
    trends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: [
              "Politique",
              "Économie",
              "Social",
              "Technologie",
              "Environnement",
              "Autre",
            ],
          },
          title: { type: Type.STRING },
          points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste de points clés clairs et concis.",
          },
          reference: articleReferenceSchema,
        },
        required: ["category", "title", "points", "reference"],
      },
    },
  },
  required: ["country", "flagImageUrl", "trends"],
};

const africanHeritageSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    source: { type: Type.STRING },
    sourceUrl: { type: Type.STRING },
    imagePrompt: { type: Type.STRING },
  },
  required: ["title", "description", "source", "sourceUrl", "imagePrompt"],
};

const softPowerInfluenceSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    field: { type: Type.STRING },
    country: { type: Type.STRING },
    presentation: { type: Type.STRING },
    impact: { type: Type.STRING },
    reasonForTrending: { type: Type.STRING },
    imageUrl: { type: Type.STRING },
    reference: articleReferenceSchema,
    ocpLink: { type: Type.STRING },
  },
  required: [
    "name",
    "field",
    "country",
    "presentation",
    "impact",
    "reasonForTrending",
    "imageUrl",
    "reference",
  ],
};

const strategicMoveSchema = {
  type: Type.OBJECT,
  properties: {
    personName: { type: Type.STRING },
    newRole: { type: Type.STRING },
    company: { type: Type.STRING },
    country: { type: Type.STRING },
    appointmentDate: { type: Type.STRING },
    background: { type: Type.STRING },
    imageUrl: { type: Type.STRING },
    linkedinUrl: { type: Type.STRING },
    reference: articleReferenceSchema,
  },
  required: [
    "personName",
    "newRole",
    "company",
    "country",
    "appointmentDate",
    "background",
    "reference",
  ],
};

const weakSignalSchema = {
  type: Type.OBJECT,
  properties: {
    signal: { type: Type.STRING },
    potentialImpact: { type: Type.STRING },
    timescale: { type: Type.STRING },
    confidenceLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
    reference: articleReferenceSchema,
  },
  required: [
    "signal",
    "potentialImpact",
    "timescale",
    "confidenceLevel",
    "reference",
  ],
};

const ocpNewsItemSchema = {
  type: Type.OBJECT,
  properties: {
    entityName: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: [
        "Sites Industriels",
        "Filiales",
        "Écosystème UM6P",
        "Gouvernance",
        "Projets & Initiatives",
      ],
    },
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    reference: articleReferenceSchema,
  },
  required: ["entityName", "category", "title", "summary", "reference"],
};

const strategicArticleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    reference: articleReferenceSchema,
  },
  required: ["title", "analysis", "reference"],
};

const ocpKeyFiguresSchema = {
  type: Type.OBJECT,
  properties: {
    turnover: { type: Type.STRING },
    ebitda: { type: Type.STRING },
    investment: { type: Type.STRING },
    employees: { type: Type.STRING },
    productionCapacity: { type: Type.STRING },
    confirmedNews: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["date", "title", "source"],
      },
    },
  },
  required: [
    "turnover",
    "ebitda",
    "investment",
    "employees",
    "productionCapacity",
    "confirmedNews",
  ],
};

const competitorNewsSchema = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING },
    headquarters: { type: Type.STRING },
    newsTitle: { type: Type.STRING },
    newsSummary: { type: Type.STRING },
    strategicImpact: { type: Type.STRING },
    sourceQuality: { type: Type.STRING },
    reference: articleReferenceSchema,
  },
  required: [
    "companyName",
    "headquarters",
    "newsTitle",
    "newsSummary",
    "strategicImpact",
    "reference",
  ],
};

const briefingDataCoreSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    alerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sector: { type: Type.STRING },
          event: { type: Type.STRING },
          impact: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
          references: { type: Type.ARRAY, items: articleReferenceSchema },
        },
        required: ["sector", "event", "impact", "severity"],
      },
    },
    commodityPrices: { type: Type.ARRAY, items: commodityPriceSchema },
    marketAnalysis: { type: Type.STRING },
    ocpKeyFigures: ocpKeyFiguresSchema,
    highlights: { type: Type.ARRAY, items: highlightSchema },
    strategicArticle: strategicArticleSchema,
    internationalEvents: { type: Type.ARRAY, items: internationalEventSchema },
    annualStrategicEvents: { type: Type.ARRAY, items: annualEventSchema },
    imageOfTheDay: imageOfTheDaySchema,
    videoOfTheDay: videoOfTheDaySchema,
    globalSouthTrends: { type: Type.ARRAY, items: globalSouthTrendSchema },
    africanHeritage: africanHeritageSchema,
    softPowerInfluence: softPowerInfluenceSchema,
    strategicMoves: { type: Type.ARRAY, items: strategicMoveSchema },
    weakSignals: { type: Type.ARRAY, items: weakSignalSchema },
    ocpGroupNews: { type: Type.ARRAY, items: ocpNewsItemSchema },
    competitorNews: { type: Type.ARRAY, items: competitorNewsSchema },
  },
  required: [
    "date",
    "alerts",
    "commodityPrices",
    "marketAnalysis",
    "ocpKeyFigures",
    "highlights",
    "strategicArticle",
    "internationalEvents",
    "annualStrategicEvents",
    "imageOfTheDay",
    "videoOfTheDay",
    "globalSouthTrends",
    "africanHeritage",
    "softPowerInfluence",
    "strategicMoves",
    "weakSignals",
    "ocpGroupNews",
    "competitorNews",
  ],
};

// ─────────────────────────────────────────────
// REFRESH SECTION SCHEMAS
// ─────────────────────────────────────────────

type RefreshSectionKey =
  | "softPowerInfluence"
  | "strategicMoves"
  | "strategicMoves-OCP"
  | "strategicMoves-International"
  | "internationalEvents"
  | "annualStrategicEvents";

const refreshSectionConfig: Record<
  RefreshSectionKey,
  { searchPrompt: string; schema: object }
> = {
  softPowerInfluence: {
    searchPrompt: `Agis en tant qu'analyste. Génère des informations stratégiques structurées sur des personnalités africaines ou du Sud Global exerçant une influence majeure.`,
    schema: softPowerInfluenceSchema,
  },
  strategicMoves: {
    searchPrompt: `Génère des données structurées sur les récentes nominations C-Suite (PDG, DG, Directeurs) dans le secteur des engrais et de l'agro-industrie mondiale.`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  "strategicMoves-OCP": {
    searchPrompt: `Génère des données structurées sur les récentes nominations C-Suite au sein du Groupe OCP et de son écosystème (UM6P, filiales).`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  "strategicMoves-International": {
    searchPrompt: `Génère des données structurées sur les récentes nominations C-Suite chez les principaux concurrents internationaux du Groupe OCP (Mosaic, Nutrien, Yara, etc.).`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  internationalEvents: {
    searchPrompt: `Dresse la liste structurée des conférences et sommets internationaux imminents liés à l'agriculture, aux engrais et à l'Afrique.`,
    schema: { type: Type.ARRAY, items: internationalEventSchema },
  },
  annualStrategicEvents: {
    searchPrompt: `Dresse la liste structurée des grands événements stratégiques annuels majeurs dans les domaines de l'agriculture et de la biodiversité.`,
    schema: { type: Type.ARRAY, items: annualEventSchema },
  },
};

// ─────────────────────────────────────────────
// EXPORTED FUNCTIONS
// ─────────────────────────────────────────────

export const refreshBriefingSection = async (
  sectionKey: RefreshSectionKey,
): Promise<unknown> => {
  return apiLimiter.enqueue(async () => {
    const config = refreshSectionConfig[sectionKey];
    if (!config) throw new Error(`Unknown section key: ${sectionKey}`);

    return groqGenerate(config.searchPrompt, config.schema);
  });
};

export const generateDashboardCore = async (
  date: Date,
): Promise<Partial<BriefingData>> => {
  const formattedDate = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `Génère une analyse de veille stratégique complète pour la date du ${formattedDate}.
  Couvre les prix des matières premières, les actualités du Groupe OCP, des concurrents internationaux, et les événements géopolitiques majeurs.`;

  return groqGenerate<Partial<BriefingData>>(prompt, briefingDataCoreSchema);
};

export const generateBriefingSection = async (
  sectionType: string,
): Promise<BriefingSection> => {
  return apiLimiter.enqueue(async () => {
    const prompt = `Génère le contenu analytique détaillé pour la thématique de briefing suivante : "${sectionType}".`;
    return groqGenerate<BriefingSection>(prompt, briefingSectionSchema);
  });
};

/**
 * Generate an image from a text prompt via Gemini image generation.
 * (Groq does not support image generation, so we keep Gemini just for this)
 */
export const generateImageFromPrompt = async (
  prompt: string,
): Promise<string> => {
  return apiLimiter.enqueue(async () => {
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        // @ts-ignore: imageConfig not yet in official types
        imageConfig: { aspectRatio: "16:9" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image was generated.");
  });
};

// ─────────────────────────────────────────────
// AFRICAN HERITAGE EXPANSION
// ─────────────────────────────────────────────

const bookRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    author: { type: Type.STRING },
  },
  required: ["title", "author"],
};

const expandedHeritageInfoSchema = {
  type: Type.OBJECT,
  properties: {
    detailedDescription: { type: Type.STRING },
    bookRecommendations: {
      type: Type.ARRAY,
      items: bookRecommendationSchema,
    },
  },
  required: ["detailedDescription", "bookRecommendations"],
};

export const expandHeritageInfo = async (
  title: string,
  description: string,
): Promise<ExpandedHeritageInfo> => {
  return apiLimiter.enqueue(async () => {
    const prompt = `Développe les informations historiques sur le sujet suivant du patrimoine africain : "${title}". Description initiale : "${description}".`;
    return groqGenerate<ExpandedHeritageInfo>(
      prompt,
      expandedHeritageInfoSchema,
    );
  });
};

// ─────────────────────────────────────────────
// COUNTRY FOCUS
// ─────────────────────────────────────────────

const countryFocusDataSchema = {
  type: Type.OBJECT,
  properties: {
    countryName: { type: Type.STRING },
    flagUrl: { type: Type.STRING },
    identity: {
      type: Type.OBJECT,
      properties: {
        officialName: { type: Type.STRING },
        capital: { type: Type.STRING },
        region: { type: Type.STRING },
        population: { type: Type.STRING },
        gdp: { type: Type.STRING },
        agGdpPercent: { type: Type.STRING },
        officialLanguages: { type: Type.STRING },
        currency: { type: Type.STRING },
        politicalRegime: { type: Type.STRING },
        politicalStabilityIndex: { type: Type.STRING },
        corruptionIndex: { type: Type.STRING },
      },
      required: [
        "officialName",
        "capital",
        "region",
        "population",
        "gdp",
        "agGdpPercent",
        "officialLanguages",
        "currency",
        "politicalRegime",
        "politicalStabilityIndex",
        "corruptionIndex",
      ],
    },
    agriculturalProfile: {
      type: Type.OBJECT,
      properties: {
        activePopulationInAg: { type: Type.STRING },
        ruralPopulation: { type: Type.STRING },
        mainCrops: { type: Type.STRING },
        arableLand: { type: Type.STRING },
        irrigationLevel: { type: Type.STRING },
        mechanizationLevel: { type: Type.STRING },
        foodImportDependency: { type: Type.STRING },
        climateVulnerability: { type: Type.STRING },
      },
      required: [
        "activePopulationInAg",
        "ruralPopulation",
        "mainCrops",
        "arableLand",
        "irrigationLevel",
        "mechanizationLevel",
        "foodImportDependency",
        "climateVulnerability",
      ],
    },
    fertilizerMarket: {
      type: Type.OBJECT,
      properties: {
        annualConsumption: { type: Type.STRING },
        imports: { type: Type.STRING },
        localProduction: { type: Type.STRING },
        subsidies: { type: Type.STRING },
        dominantPlayers: { type: Type.STRING },
        priceSensitivity: { type: Type.STRING },
        recentTrend: { type: Type.STRING },
        ocpPresence: { type: Type.STRING },
      },
      required: [
        "annualConsumption",
        "imports",
        "localProduction",
        "subsidies",
        "dominantPlayers",
        "priceSensitivity",
        "recentTrend",
        "ocpPresence",
      ],
    },
    agriculturalPolicy: {
      type: Type.OBJECT,
      properties: {
        strategyName: { type: Type.STRING },
        launchYear: { type: Type.STRING },
        objectives: { type: Type.STRING },
        recentReforms: { type: Type.STRING },
        subsidiesPrograms: { type: Type.STRING },
        accessToFinance: { type: Type.STRING },
        tradeOrientation: { type: Type.STRING },
      },
      required: [
        "strategyName",
        "launchYear",
        "objectives",
        "recentReforms",
        "subsidiesPrograms",
        "accessToFinance",
        "tradeOrientation",
      ],
    },
    climateAndEnv: {
      type: Type.OBJECT,
      properties: {
        dominantClimate: { type: Type.STRING },
        rainfallTrend: { type: Type.STRING },
        waterStress: { type: Type.STRING },
        droughtRisk: { type: Type.STRING },
        recentExtremeEvents: { type: Type.STRING },
        agImpact: { type: Type.STRING },
      },
      required: [
        "dominantClimate",
        "rainfallTrend",
        "waterStress",
        "droughtRisk",
        "recentExtremeEvents",
        "agImpact",
      ],
    },
    securityAndGeopolitics: {
      type: Type.OBJECT,
      properties: {
        stabilityLevel: { type: Type.STRING },
        conflicts: { type: Type.STRING },
        logisticsRisks: { type: Type.STRING },
        energyDependency: { type: Type.STRING },
        regionalPosition: { type: Type.STRING },
      },
      required: [
        "stabilityLevel",
        "conflicts",
        "logisticsRisks",
        "energyDependency",
        "regionalPosition",
      ],
    },
    agriculturalGovernance: {
      type: Type.OBJECT,
      properties: {
        ministerAg: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            nominationDate: { type: Type.STRING },
            bio: { type: Type.STRING },
          },
          required: ["name", "nominationDate", "bio"],
        },
        ministerEnv: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            nominationDate: { type: Type.STRING },
            bio: { type: Type.STRING },
          },
          required: ["name", "nominationDate", "bio"],
        },
      },
      required: ["ministerAg", "ministerEnv"],
    },
    politicalCalendar: {
      type: Type.OBJECT,
      properties: {
        nextElection: { type: Type.STRING },
        localElections: { type: Type.STRING },
        recentElections: { type: Type.STRING },
        impactOnAg: { type: Type.STRING },
      },
      required: [
        "nextElection",
        "localElections",
        "recentElections",
        "impactOnAg",
      ],
    },
    focpIndicators: {
      type: Type.OBJECT,
      properties: {
        importDependency: { type: Type.STRING },
        growthPotential: { type: Type.STRING },
        climateRisk: { type: Type.STRING },
        fertilizerSensitivity: { type: Type.STRING },
        coopOpportunities: { type: Type.STRING },
      },
      required: [
        "importDependency",
        "growthPotential",
        "climateRisk",
        "fertilizerSensitivity",
        "coopOpportunities",
      ],
    },
    executiveSummary: {
      type: Type.OBJECT,
      properties: {
        priorityLevel: { type: Type.STRING },
        majorRisks: { type: Type.STRING },
        opportunities: { type: Type.STRING },
        watchPoints: { type: Type.STRING },
      },
      required: ["priorityLevel", "majorRisks", "opportunities", "watchPoints"],
    },
    latestNews: { type: Type.ARRAY, items: articleReferenceSchema },
  },
  required: [
    "countryName",
    "flagUrl",
    "identity",
    "agriculturalProfile",
    "fertilizerMarket",
    "agriculturalPolicy",
    "climateAndEnv",
    "securityAndGeopolitics",
    "agriculturalGovernance",
    "politicalCalendar",
    "focpIndicators",
    "executiveSummary",
    "latestNews",
  ],
};

export const generateCountryFocus = async (
  countryName: string,
): Promise<CountryFocusData> => {
  return apiLimiter.enqueue(async () => {
    const prompt = `Génère une fiche pays détaillée pour : ${countryName}, couvrant les indicateurs agricoles, politiques et économiques.`;
    return groqGenerate<CountryFocusData>(prompt, countryFocusDataSchema);
  });
};

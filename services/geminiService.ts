/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import {
  BriefingData,
  GroundingSource,
  ExpandedHeritageInfo,
  CountryFocusData,
  BriefingSection,
} from "../types";

// ─────────────────────────────────────────────
// CLIENT INITIALIZATION (GEMINI)
// ─────────────────────────────────────────────

let ai: GoogleGenAI;

function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error("La variable VITE_API_KEY est introuvable.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return ai;
}

// ─────────────────────────────────────────────
// RATE LIMITER ULTRA-SÉCURISÉ
// ─────────────────────────────────────────────

class SmartRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  // FREIN MAJEUR : 8000ms = 8 secondes entre chaque requête.
  // Cela garantit un maximum de 7.5 requêtes par minute (loin de la limite de 20).
  private minIntervalMs = 8000;

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          console.error("Task failed in queue", e);
        }
        // Attente forcée avant de lancer la prochaine requête
        await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs));
      }
    }

    this.isProcessing = false;
  }
}

const apiLimiter = new SmartRateLimiter();

// ─────────────────────────────────────────────
// UTILS : EXTRACTEUR JSON ROBUSTE
// ─────────────────────────────────────────────

const extractCleanJson = (text: string): string => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) return match[1].trim();
  return text.trim();
};

// ─────────────────────────────────────────────
// COMMON SCHEMAS
// ─────────────────────────────────────────────

const articleReferenceSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    source: { type: Type.STRING },
    url: { type: Type.STRING, description: "URL directe" },
  },
  required: ["title", "source", "url"],
};

const briefingPointSchema = {
  type: Type.OBJECT,
  properties: {
    subTitle: { type: Type.STRING },
    details: { type: Type.STRING },
    references: { type: Type.ARRAY, items: articleReferenceSchema },
    verificationNeeded: { type: Type.STRING },
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
    unit: { type: Type.STRING },
    change: { type: Type.STRING },
    lastYearPrice: { type: Type.STRING },
    evolution: { type: Type.STRING },
    trend: { type: Type.STRING, enum: ["up", "down", "stable"] },
    analysis: { type: Type.STRING },
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
    dateRange: { type: Type.STRING },
    location: { type: Type.STRING },
    theme: { type: Type.STRING },
    description: { type: Type.STRING },
    url: { type: Type.STRING },
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
    posterImagePrompt: { type: Type.STRING },
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
          points: { type: Type.ARRAY, items: { type: Type.STRING } },
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

export const countryFocusDataSchema = {
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

// ─────────────────────────────────────────────
// EXPORTED API FUNCTIONS (TOUTES DANS LA FILE D'ATTENTE)
// ─────────────────────────────────────────────

export const generateDashboardCore = async (
  date: Date,
): Promise<Partial<BriefingData>> => {
  // L'appel principal fait maintenant la queue comme le reste pour éviter le blocage initial
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    const formattedDate = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `Génère les données principales du tableau de bord pour la date : ${formattedDate}.
    IMPORTANT : Tu DOIS faire des recherches sur internet pour avoir les informations exactes, réelles et les plus récentes (surtout pour les actualités OCP, concurrents et prix matières premières).
    RÈGLE ABSOLUE DE FORMATAGE : Tu dois répondre UNIQUEMENT par un objet JSON valide qui respecte scrupuleusement la structure suivante. Ne rajoute aucun texte ni balise autour.
    Structure attendue : ${JSON.stringify(briefingDataCoreSchema)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = extractCleanJson(response.text || "");

    try {
      const data = JSON.parse(jsonText);
      const groundingChunks = (response.candidates?.[0] as any)
        ?.groundingMetadata?.groundingChunks;
      const sources: GroundingSource[] = [];
      if (groundingChunks) {
        for (const chunk of groundingChunks) {
          if (chunk.web)
            sources.push({ url: chunk.web.uri, title: chunk.web.title });
        }
      }
      return { ...data, groundingSources: sources };
    } catch (e) {
      console.error("Failed to parse core briefing JSON:", e);
      throw new Error("Invalid JSON response from AI for core briefing.");
    }
  });
};

export const generateBriefingSection = async (
  sectionType: string,
): Promise<BriefingSection> => {
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    const prompt = `Génère UNIQUEMENT la section de briefing détaillée pour "${sectionType}".
    IMPORTANT : Fais des recherches sur internet pour sourcer tes informations avec des faits réels. Réponds UNIQUEMENT par un objet JSON valide respectant cette structure exacte, sans aucun texte autour :
    ${JSON.stringify(briefingSectionSchema)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = extractCleanJson(response.text || "");
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error(`Failed to parse section JSON for ${sectionType}:`, e);
      throw new Error(
        `Invalid JSON response from AI for section ${sectionType}.`,
      );
    }
  });
};

export const refreshBriefingSection = async (
  sectionKey:
    | "softPowerInfluence"
    | "strategicMoves"
    | "strategicMoves-OCP"
    | "strategicMoves-International"
    | "internationalEvents"
    | "annualStrategicEvents",
): Promise<any> => {
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    let basePrompt = "";
    let schema = null;

    if (sectionKey === "softPowerInfluence") {
      basePrompt = `Génère une NOUVELLE proposition pour la section "Influence & Soft Power".`;
      schema = softPowerInfluenceSchema;
    } else if (sectionKey === "strategicMoves") {
      basePrompt = `Génère une NOUVELLE liste de "Mouvements Stratégiques" (Nominations C-Suite).`;
      schema = { type: Type.ARRAY, items: strategicMoveSchema };
    } else if (sectionKey === "strategicMoves-OCP") {
      basePrompt = `Génère une NOUVELLE liste de "Mouvements Stratégiques" UNIQUEMENT pour l'Écosystème OCP.`;
      schema = { type: Type.ARRAY, items: strategicMoveSchema };
    } else if (sectionKey === "strategicMoves-International") {
      basePrompt = `Génère une NOUVELLE liste de "Mouvements Stratégiques" UNIQUEMENT pour les concurrents internationaux.`;
      schema = { type: Type.ARRAY, items: strategicMoveSchema };
    } else if (sectionKey === "internationalEvents") {
      basePrompt = `Génère une NOUVELLE liste d'événements internationaux pour les semaines à venir.`;
      schema = { type: Type.ARRAY, items: internationalEventSchema };
    } else if (sectionKey === "annualStrategicEvents") {
      basePrompt = `Génère une NOUVELLE liste d'événements stratégiques majeurs pour l'année.`;
      schema = { type: Type.ARRAY, items: annualEventSchema };
    }

    const prompt = `${basePrompt} \n\nIMPORTANT : Tu DOIS utiliser l'outil de recherche Google pour trouver de vraies informations d'actualité. RÈGLE ABSOLUE : Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, suivant ce schéma : ${JSON.stringify(schema)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = extractCleanJson(response.text || "");
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error(`Failed to parse refresh JSON for ${sectionKey}:`, e);
      throw new Error(`Invalid JSON response from AI for ${sectionKey}.`);
    }
  });
};

export const generateCountryFocus = async (
  countryName: string,
): Promise<CountryFocusData> => {
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    const prompt = `Génère une FICHE PAYS détaillée pour : ${countryName}.
    IMPORTANT : Utilise internet pour trouver les chiffres exacts et réels. RÈGLE ABSOLUE : Réponds UNIQUEMENT par un objet JSON valide sans texte autour, selon ce schéma :
    ${JSON.stringify(countryFocusDataSchema)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = extractCleanJson(response.text || "");
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error(
        `Failed to parse country focus JSON for ${countryName}:`,
        e,
      );
      throw new Error(
        `Invalid JSON response from AI for country focus: ${countryName}.`,
      );
    }
  });
};

export const generateImageFromPrompt = async (
  prompt: string,
): Promise<string> => {
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        // @ts-ignore
        imageConfig: { aspectRatio: "16:9" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image was generated.");
  });
};

export const expandHeritageInfo = async (
  title: string,
  description: string,
): Promise<ExpandedHeritageInfo> => {
  return apiLimiter.enqueue(async () => {
    const ai = getClient();
    const prompt = `Développe les informations sur le sujet suivant : "${title}", dont la description initiale est : "${description}".
    RÈGLE ABSOLUE : Réponds UNIQUEMENT au format JSON valide selon la structure indiquée.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detailedDescription: { type: Type.STRING },
            bookRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  author: { type: Type.STRING },
                },
                required: ["title", "author"],
              },
            },
          },
          required: ["detailedDescription", "bookRecommendations"],
        },
      },
    });

    const jsonText = extractCleanJson(response.text || "");
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse expanded heritage info JSON:", e);
      throw new Error("Invalid JSON response from AI for heritage info.");
    }
  });
};

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
// CLIENT INITIALIZATION
// ─────────────────────────────────────────────

let ai: GoogleGenAI;

function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "La variable VITE_API_KEY est introuvable. Vérifiez votre fichier .env ou les variables Netlify.",
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// ─────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────

class SmartRateLimiter {
  private queue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private readonly minIntervalMs = 2500;

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
// TWO-STEP HELPER
// Gemini does NOT allow googleSearch + responseMimeType: "application/json"
// simultaneously. We solve this with two sequential calls:
//   1. Search call  → grounding + raw text (no JSON constraint)
//   2. Struct call  → parse raw text into strict JSON schema (no tools)
// ─────────────────────────────────────────────

async function twoStepGenerate<T>(
  searchPrompt: string,
  structPrompt: (rawText: string) => string,
  schema: object,
  systemInstruction?: string,
): Promise<T> {
  const client = getClient();

  // ── Step 1: grounded search (no JSON mode) ──────────────────────────────
  const searchResponse = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: searchPrompt }] }],
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = (searchResponse.text ?? "").trim();

  // ── Step 2: structured output (no tools) ────────────────────────────────
  const structResponse = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: structPrompt(rawText) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const jsonText = (structResponse.text ?? "").trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch (e) {
    console.error("[twoStepGenerate] JSON parse error:", e, "\nRaw:", jsonText);
    throw new Error("Invalid JSON response from AI.");
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
    unit: { type: Type.STRING, description: "Unité de mesure (ex: $/tonne, c/bu)." },
    change: { type: Type.STRING },
    lastYearPrice: { type: Type.STRING, description: "Prix il y a un an (N-1)." },
    evolution: { type: Type.STRING, description: "Évolution sur un an (ex: +12%)." },
    trend: { type: Type.STRING, enum: ["up", "down", "stable"] },
    analysis: {
      type: Type.STRING,
      description:
        "Variation récente, facteurs explicatifs et corrélation avec le marché agricole.",
    },
  },
  required: ["name", "price", "unit", "change", "lastYearPrice", "evolution", "trend"],
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
  required: ["videoUrl", "title", "commentary", "reference", "posterImagePrompt"],
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
            enum: ["Politique", "Économie", "Social", "Technologie", "Environnement", "Autre"],
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
    "name", "field", "country", "presentation",
    "impact", "reasonForTrending", "imageUrl", "reference",
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
    "personName", "newRole", "company", "country",
    "appointmentDate", "background", "reference",
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
  required: ["signal", "potentialImpact", "timescale", "confidenceLevel", "reference"],
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
    "turnover", "ebitda", "investment",
    "employees", "productionCapacity", "confirmedNews",
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
    "companyName", "headquarters", "newsTitle",
    "newsSummary", "strategicImpact", "reference",
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
    "date", "alerts", "commodityPrices", "marketAnalysis", "ocpKeyFigures",
    "highlights", "strategicArticle", "internationalEvents", "annualStrategicEvents",
    "imageOfTheDay", "videoOfTheDay", "globalSouthTrends", "africanHeritage",
    "softPowerInfluence", "strategicMoves", "weakSignals", "ocpGroupNews", "competitorNews",
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
    searchPrompt: `Recherche les dernières actualités sur des personnalités africaines ou du Sud Global
      qui exercent une influence remarquable dans des domaines comme la culture, la diplomatie,
      la technologie, l'agriculture ou l'économie. Inclus leur nom, pays, domaine d'influence,
      et les raisons pour lesquelles ils sont en tendance.`,
    schema: softPowerInfluenceSchema,
  },
  strategicMoves: {
    searchPrompt: `Recherche les toutes dernières nominations C-Suite (PDG, DG, Directeurs) dans
      le secteur des engrais, de l'agriculture et de l'agro-industrie à l'échelle mondiale.
      Inclus le nom, la société, le pays, la date de nomination et le parcours de la personne.`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  "strategicMoves-OCP": {
    searchPrompt: `Recherche les toutes dernières nominations C-Suite au sein du Groupe OCP et de
      son écosystème (OCP SA, UM6P, filiales, partenariats). Inclus le nom, la société, le pays,
      la date de nomination et le parcours de la personne.`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  "strategicMoves-International": {
    searchPrompt: `Recherche les toutes dernières nominations C-Suite chez les principaux concurrents
      internationaux du Groupe OCP : Mosaic, Nutrien, Yara, PhosAgro, ICL, CF Industries, etc.
      Inclus le nom, la société, le pays, la date de nomination et le parcours de la personne.`,
    schema: { type: Type.ARRAY, items: strategicMoveSchema },
  },
  internationalEvents: {
    searchPrompt: `Recherche les conférences, sommets et événements internationaux à venir cette semaine
      ou dans les prochaines semaines, liés à l'agriculture, aux engrais, au développement durable,
      à la sécurité alimentaire et à l'Afrique. Inclus le nom, la date, le lieu et une description.`,
    schema: { type: Type.ARRAY, items: internationalEventSchema },
  },
  annualStrategicEvents: {
    searchPrompt: `Recherche les grands événements stratégiques annuels de l'année en cours ou de l'année
      prochaine dans les domaines : Agriculture, Sol, Climat, Mangrove, Fertilisation, Afrique, Eau,
      Biodiversité. Inclus le nom, les dates, le lieu, la thématique et le site officiel.`,
    schema: { type: Type.ARRAY, items: annualEventSchema },
  },
};

// ─────────────────────────────────────────────
// EXPORTED FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Refresh a specific briefing section using the two-step pattern.
 */
export const refreshBriefingSection = async (
  sectionKey: RefreshSectionKey,
): Promise<unknown> => {
  return apiLimiter.enqueue(async () => {
    const config = refreshSectionConfig[sectionKey];
    if (!config) throw new Error(`Unknown section key: ${sectionKey}`);

    return twoStepGenerate(
      config.searchPrompt,
      (raw) =>
        `Sur la base des informations suivantes récupérées en temps réel :\n\n${raw}\n\n` +
        `Structure ces données selon le schéma JSON demandé. ` +
        `Ne génère que des données bien sourcées et vérifiables.`,
      config.schema,
      SYSTEM_PROMPT,
    );
  });
};

/**
 * Generate the full dashboard core data using the two-step pattern.
 */
export const generateDashboardCore = async (
  date: Date,
): Promise<Partial<BriefingData>> => {
  const formattedDate = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const searchPrompt =
    `Effectue une veille complète et à jour pour la date du ${formattedDate}. ` +
    `Couvre les sujets suivants : ` +
    `(1) Alertes et risques majeurs pour le secteur agricole et des engrais, ` +
    `(2) Prix des matières premières agricoles (blé, maïs, soja, phosphate, urée, DAP, MOP, soufre, ammoniaque), ` +
    `(3) Actualités du Groupe OCP (chiffres clés, contrats, projets), ` +
    `(4) Actualités des concurrents internationaux (Mosaic, Nutrien, Yara, PhosAgro, ICL), ` +
    `(5) Événements géopolitiques et tendances du Sud Global impactant l'agriculture, ` +
    `(6) Signaux faibles et tendances émergentes, ` +
    `(7) Personnalités africaines en vue (soft power), ` +
    `(8) Patrimoine africain à mettre en lumière, ` +
    `(9) Image et vidéo du jour liées à l'agriculture ou à l'Afrique.`;

  const data = await twoStepGenerate<Partial<BriefingData>>(
    searchPrompt,
    (raw) =>
      `${SYSTEM_PROMPT}\n\n` +
      `Sur la base des informations de veille suivantes récupérées en temps réel :\n\n${raw}\n\n` +
      `Génère le tableau de bord complet au format JSON pour la date du ${formattedDate}. ` +
      `Assure-toi que toutes les données sont bien sourcées et correspondent à la date indiquée.`,
    briefingDataCoreSchema,
  );

  return data;
};

/**
 * Generate a single detailed briefing section using the two-step pattern.
 */
export const generateBriefingSection = async (
  sectionType: string,
): Promise<BriefingSection> => {
  return apiLimiter.enqueue(async () => {
    const searchPrompt =
      `Effectue une recherche approfondie et à jour sur le sujet suivant pour un briefing stratégique : ` +
      `"${sectionType}". ` +
      `Trouve des informations récentes, bien sourcées, avec des faits vérifiables, ` +
      `des chiffres clés et des références d'articles.`;

    return twoStepGenerate<BriefingSection>(
      searchPrompt,
      (raw) =>
        `${SYSTEM_PROMPT}\n\n` +
        `Sur la base des informations suivantes récupérées en temps réel :\n\n${raw}\n\n` +
        `Structure ces données en une section de briefing détaillée pour "${sectionType}". ` +
        `Fournis le titre de la section et un contenu clair, sourcé et structuré.`,
      briefingSectionSchema,
    );
  });
};

/**
 * Generate an image from a text prompt via Gemini image generation.
 * Note: image generation does not support grounding — single call only.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  return apiLimiter.enqueue(async () => {
    const client = getClient();

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

/**
 * Expand a heritage entry with deeper context and book recommendations.
 * Uses a single structured call (no grounding needed — context provided inline).
 */
export const expandHeritageInfo = async (
  title: string,
  description: string,
): Promise<ExpandedHeritageInfo> => {
  return apiLimiter.enqueue(async () => {
    const client = getClient();

    const prompt =
      `Développe les informations sur le sujet du patrimoine africain suivant.\n\n` +
      `Titre : "${title}"\n` +
      `Description initiale : "${description}"\n\n` +
      `Fournis une description détaillée et enrichie, ainsi que des recommandations de livres.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: expandedHeritageInfoSchema,
      },
    });

    const jsonText = (response.text ?? "").trim();
    try {
      return JSON.parse(jsonText) as ExpandedHeritageInfo;
    } catch (e) {
      console.error("[expandHeritageInfo] JSON parse error:", e);
      throw new Error("Invalid JSON response from AI for heritage info.");
    }
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
        "officialName", "capital", "region", "population", "gdp",
        "agGdpPercent", "officialLanguages", "currency", "politicalRegime",
        "politicalStabilityIndex", "corruptionIndex",
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
        "activePopulationInAg", "ruralPopulation", "mainCrops", "arableLand",
        "irrigationLevel", "mechanizationLevel", "foodImportDependency", "climateVulnerability",
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
        "annualConsumption", "imports", "localProduction", "subsidies",
        "dominantPlayers", "priceSensitivity", "recentTrend", "ocpPresence",
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
        "strategyName", "launchYear", "objectives", "recentReforms",
        "subsidiesPrograms", "accessToFinance", "tradeOrientation",
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
        "dominantClimate", "rainfallTrend", "waterStress",
        "droughtRisk", "recentExtremeEvents", "agImpact",
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
        "stabilityLevel", "conflicts", "logisticsRisks",
        "energyDependency", "regionalPosition",
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
      required: ["nextElection", "localElections", "recentElections", "impactOnAg"],
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
        "importDependency", "growthPotential", "climateRisk",
        "fertilizerSensitivity", "coopOpportunities",
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
    "countryName", "flagUrl", "identity", "agriculturalProfile", "fertilizerMarket",
    "agriculturalPolicy", "climateAndEnv", "securityAndGeopolitics", "agriculturalGovernance",
    "politicalCalendar", "focpIndicators", "executiveSummary", "latestNews",
  ],
};

/**
 * Generate a full country focus report using the two-step pattern.
 */
export const generateCountryFocus = async (
  countryName: string,
): Promise<CountryFocusData> => {
  return apiLimiter.enqueue(async () => {
    const searchPrompt =
      `Effectue une veille complète sur ${countryName} pour produire une fiche pays stratégique (FOCP). ` +
      `Couvre : identité du pays, profil agricole, marché des engrais, politique agricole, ` +
      `climat et environnement, sécurité et géopolitique, gouvernance agricole (ministres), ` +
      `calendrier politique, indicateurs FOCP et actualités récentes.`;

    return twoStepGenerate<CountryFocusData>(
      searchPrompt,
      (raw) =>
        `Sur la base des informations de veille suivantes pour ${countryName} :\n\n${raw}\n\n` +
        `Génère la fiche pays FOCP complète et structurée au format JSON. ` +
        `Assure-toi que toutes les données sont précises, récentes et bien sourcées.`,
      countryFocusDataSchema,
    );
  });
};
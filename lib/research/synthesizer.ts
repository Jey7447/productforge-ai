import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getResearchModel } from "@/lib/ai/provider";
import type { ResearchInput } from "./types";

const MAX_EVIDENCE_ITEMS = 48;
const MAX_EXCERPT_CHARS = 3500;

const evidenceSchema = z.object({
  sourceId: z.string(),
  claim: z.string().min(1).max(500),
  strength: z.enum(["strong", "moderate", "weak"]),
});

export const researchSynthesisSchema = z.object({
  executiveSummary: z.string().min(1).max(2500),
  demandSignals: z.array(z.string().min(1).max(600)).max(8),
  painPoints: z.array(z.string().min(1).max(600)).max(10),
  existingSolutions: z.array(z.string().min(1).max(600)).max(10),
  monetizationSignals: z.array(z.string().min(1).max(600)).max(8),
  competitionGaps: z.array(z.string().min(1).max(600)).max(8),
  underservedNeeds: z.array(z.string().min(1).max(600)).max(8),
  contradictions: z.array(z.string().min(1).max(600)).max(8),
  keyEvidence: z.array(evidenceSchema).max(16),
  evidenceQuality: z.object({
    coverage: z.number().int().min(0).max(100),
    sourceDiversity: z.number().int().min(0).max(100),
    recency: z.number().int().min(0).max(100),
    agreement: z.number().int().min(0).max(100),
    overall: z.number().int().min(0).max(100),
  }),
  researchGaps: z.array(z.string().min(1).max(500)).max(8),
});

export type ResearchSynthesis = z.infer<typeof researchSynthesisSchema>;

type EvidenceRow = {
  id: string;
  research_query_id: string | null;
  source_url: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
  snippet: string | null;
  content_excerpt: string | null;
  published_at: string | null;
  relevance_score: number | null;
  credibility_score: number | null;
};

type QueryRow = {
  id: string;
  provider: string;
  query: string;
  purpose: string | null;
};

function compactEvidence(row: EvidenceRow) {
  return {
    id: row.id,
    purpose: row.source_type,
    domain: row.source_domain,
    title: row.title,
    url: row.source_url,
    publishedAt: row.published_at,
    relevanceScore: row.relevance_score,
    credibilityScore: row.credibility_score,
    excerpt: (row.content_excerpt || row.snippet || "").slice(0, MAX_EXCERPT_CHARS),
  };
}

function cleanText(value: string | null | undefined, fallback: string) {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text : fallback;
}

function sourceClaim(row: EvidenceRow) {
  const excerpt = cleanText(row.content_excerpt || row.snippet, "No detailed excerpt was returned.");
  return `${cleanText(row.title, row.source_domain || "Research source")}: ${excerpt.slice(0, 420)}`;
}

function fallbackSynthesis(evidenceRows: EvidenceRow[], queryRows: QueryRow[], input: ResearchInput): ResearchSynthesis {
  const sorted = [...evidenceRows].sort((a, b) =>
    ((b.credibility_score ?? 50) + (b.relevance_score ?? 50)) -
    ((a.credibility_score ?? 50) + (a.relevance_score ?? 50)),
  );
  const selected = sorted.slice(0, 16);
  const domains = new Set(evidenceRows.map((row) => row.source_domain).filter(Boolean));
  const purposes = new Set(evidenceRows.map((row) => row.source_type).filter(Boolean));
  const recentCount = evidenceRows.filter((row) => row.published_at && Date.now() - new Date(row.published_at).getTime() < 1000 * 60 * 60 * 24 * 730).length;
  const averageCredibility = evidenceRows.length
    ? evidenceRows.reduce((sum, row) => sum + (row.credibility_score ?? 50), 0) / evidenceRows.length
    : 0;
  const coverage = Math.min(100, evidenceRows.length * 8);
  const sourceDiversity = Math.min(100, domains.size * 20 + purposes.size * 10);
  const recency = evidenceRows.length ? Math.round((recentCount / evidenceRows.length) * 100) : 0;
  const agreement = 55;
  const overall = Math.round(coverage * 0.30 + sourceDiversity * 0.20 + recency * 0.15 + agreement * 0.15 + averageCredibility * 0.20);

  const context = cleanText(input.audience, "the stated target audience");
  const problem = cleanText(input.problems, "the problem described in the project brief");
  const productTypes = input.preferredProductTypes?.length ? input.preferredProductTypes.join(", ") : "digital products";

  const keyEvidence = selected.map((row, index) => ({
    sourceId: row.id,
    claim: sourceClaim(row),
    strength: index < 4 ? "strong" : index < 9 ? "moderate" : "weak",
  } as const));

  const demandSignals = selected.filter((row) => /demand|search|question|review|buy|purchase|request|need|problem|complaint/i.test(`${row.source_type} ${row.title} ${row.content_excerpt}`)).slice(0, 8).map(sourceClaim);
  const painPoints = selected.filter((row) => /problem|pain|challenge|difficult|frustrat|issue|struggle|lack|confus/i.test(`${row.title} ${row.content_excerpt}`)).slice(0, 10).map(sourceClaim);
  const existingSolutions = selected.filter((row) => /solution|tool|course|guide|software|platform|product|service|alternative/i.test(`${row.title} ${row.content_excerpt}`)).slice(0, 10).map(sourceClaim);
  const monetizationSignals = selected.filter((row) => /price|paid|cost|buy|purchase|subscription|premium|course|fee|market/i.test(`${row.title} ${row.content_excerpt}`)).slice(0, 8).map(sourceClaim);
  const competitionGaps = selected.filter((row) => /alternative|limitation|missing|lack|issue|complaint|better|improv|not available/i.test(`${row.title} ${row.content_excerpt}`)).slice(0, 8).map(sourceClaim);
  const underservedNeeds = selected.filter((row) => /need|want|request|missing|lack|specific|student|beginner|advanced|workflow/i.test(`${row.title} ${row.content_excerpt}`)).slice(0, 8).map(sourceClaim);

  return {
    executiveSummary: `Evidence-only synthesis for ${input.name}. The collected sources provide ${evidenceRows.length} evidence items across ${domains.size || 1} domains and ${queryRows.length} planned research queries. The strongest recurring signals should be treated as hypotheses around ${problem} for ${context}, with ${productTypes} as possible delivery formats. No profitability claim is made because this fallback does not infer facts beyond the collected evidence.`,
    demandSignals: demandSignals.length ? demandSignals : selected.slice(0, 5).map(sourceClaim),
    painPoints: painPoints.length ? painPoints : [problem, ...selected.slice(0, 4).map(sourceClaim)],
    existingSolutions: existingSolutions.length ? existingSolutions : selected.slice(0, 6).map(sourceClaim),
    monetizationSignals,
    competitionGaps,
    underservedNeeds: underservedNeeds.length ? underservedNeeds : [context, problem],
    contradictions: [],
    keyEvidence,
    evidenceQuality: { coverage, sourceDiversity, recency, agreement, overall },
    researchGaps: [
      "Willingness to pay has not been directly established unless the collected sources contain explicit purchase or pricing signals.",
      "The fallback cannot reliably distinguish correlation from causation in qualitative source material.",
      "Customer interviews or direct validation are still needed before treating the strongest opportunity as validated.",
    ],
  };
}

export async function synthesizeResearchRun(
  researchRunId: string,
  input: ResearchInput,
): Promise<ResearchSynthesis> {
  const supabase = await createClient();

  const [{ data: evidence, error: evidenceError }, { data: queries, error: queriesError }] = await Promise.all([
    supabase
      .from("research_evidence")
      .select("id,research_query_id,source_url,source_domain,source_type,title,snippet,content_excerpt,published_at,relevance_score,credibility_score")
      .eq("research_run_id", researchRunId)
      .order("credibility_score", { ascending: false, nullsFirst: false })
      .order("relevance_score", { ascending: false, nullsFirst: false })
      .limit(MAX_EVIDENCE_ITEMS),
    supabase
      .from("research_queries")
      .select("id,provider,query,purpose")
      .eq("research_run_id", researchRunId)
      .order("created_at", { ascending: true }),
  ]);

  if (evidenceError) throw new Error(`Unable to load research evidence: ${evidenceError.message}`);
  if (queriesError) throw new Error(`Unable to load research queries: ${queriesError.message}`);

  const evidenceRows = (evidence ?? []) as EvidenceRow[];
  const queryRows = (queries ?? []) as QueryRow[];

  if (!evidenceRows.length) {
    throw new Error("Research synthesis requires at least one evidence source.");
  }

  const evidencePacket = evidenceRows.map(compactEvidence);
  const queryPacket = queryRows.map((query) => ({
    id: query.id,
    provider: query.provider,
    purpose: query.purpose,
    query: query.query,
  }));

  try {
    const { object } = await generateObject({
      model: getResearchModel(),
      schema: researchSynthesisSchema,
      system: `You are ProductForge's evidence synthesis analyst.

Your job is to analyze web research evidence and produce a disciplined market-research synthesis for digital-product opportunity discovery.

Rules:
1. Treat the supplied evidence as the only factual source. Do not invent facts, statistics, customer quotes, market sizes, prices, trends, or competitors.
2. Distinguish observations from interpretations. If evidence is weak or indirect, say so.
3. Never describe an opportunity as guaranteed profitable. Use language such as signal, indication, evidence, gap, or hypothesis.
4. Do not infer demand merely because a topic exists online. Look for repeated problems, active discussions, searches, purchases, reviews, comparisons, or other concrete signals present in the evidence.
5. Preserve disagreement. If sources conflict, record the contradiction rather than averaging it away.
6. Key evidence must reference only source IDs supplied in the evidence packet.
7. Evidence-quality scores must reflect the supplied evidence coverage, diversity, recency, and agreement—not the model's confidence in its own answer.
8. Keep the synthesis useful for a later opportunity-generation and scoring stage. Do not generate the final ranked product opportunities yet.`,
      prompt: `Analyze this ProductForge research run.\n\nPROJECT CONTEXT\nName: ${input.name}\nStarting point: ${input.startingPoint}\nInterests: ${(input.interests ?? []).join(", ") || "Not provided"}\nExpertise: ${input.expertise || "Not provided"}\nAudience: ${input.audience || "Not provided"}\nProblems: ${input.problems || "Not provided"}\nGoals: ${input.goals || "Not provided"}\nPreferred product types: ${(input.preferredProductTypes ?? []).join(", ") || "Not provided"}\nPriority goal: ${input.priorityGoal || "Not provided"}\nAdditional context: ${input.additionalContext || "Not provided"}\n\nRESEARCH QUERIES\n${JSON.stringify(queryPacket, null, 2)}\n\nEVIDENCE\n${JSON.stringify(evidencePacket, null, 2)}\n\nProduce a concise but substantive synthesis. Every key evidence item must include a sourceId from the supplied evidence. Research gaps should identify what cannot yet be established from the collected evidence and should guide later validation.`
    });

    return object;
  } catch (error) {
    console.warn("AI synthesis unavailable; using evidence-only fallback.", error);
    return fallbackSynthesis(evidenceRows, queryRows, input);
  }
}

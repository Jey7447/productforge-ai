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
    prompt: `Analyze this ProductForge research run.

PROJECT CONTEXT
Name: ${input.name}
Starting point: ${input.startingPoint}
Interests: ${(input.interests ?? []).join(", ") || "Not provided"}
Expertise: ${input.expertise || "Not provided"}
Audience: ${input.audience || "Not provided"}
Problems: ${input.problems || "Not provided"}
Goals: ${input.goals || "Not provided"}
Preferred product types: ${(input.preferredProductTypes ?? []).join(", ") || "Not provided"}
Priority goal: ${input.priorityGoal || "Not provided"}
Additional context: ${input.additionalContext || "Not provided"}

RESEARCH QUERIES
${JSON.stringify(queryPacket, null, 2)}

EVIDENCE
${JSON.stringify(evidencePacket, null, 2)}

Produce a concise but substantive synthesis. Every key evidence item must include a sourceId from the supplied evidence. Research gaps should identify what cannot yet be established from the collected evidence and should guide later validation.`
  });

  return object;
}

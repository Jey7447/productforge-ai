import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getResearchModel } from "@/lib/ai/provider";
import type { ResearchInput } from "./types";
import type { ResearchSynthesis } from "./synthesizer";

const OPPORTUNITY_COUNT = 8;
const MAX_EVIDENCE_ITEMS = 48;
const MAX_EXCERPT_CHARS = 2200;

const scoreSchema = z.object({
  demand: z.number().int().min(0).max(100),
  problemIntensity: z.number().int().min(0).max(100),
  competitionGap: z.number().int().min(0).max(100),
  monetization: z.number().int().min(0).max(100),
  specificity: z.number().int().min(0).max(100),
  buildability: z.number().int().min(0).max(100),
});

const opportunitySchema = z.object({
  title: z.string().min(1).max(180),
  niche: z.string().min(1).max(180),
  targetAudience: z.string().min(1).max(300),
  problem: z.string().min(1).max(600),
  proposedProduct: z.string().min(1).max(600),
  productType: z.string().min(1).max(120),
  rationale: z.string().min(1).max(1200),
  estimatedPriceMin: z.number().min(0).max(100000),
  estimatedPriceMax: z.number().min(0).max(100000),
  evidence: z.array(z.object({
    sourceId: z.string(),
    claim: z.string().min(1).max(500),
  })).min(2).max(8),
  scoreRationales: z.object({
    demand: z.string().min(1).max(500),
    problemIntensity: z.string().min(1).max(500),
    competitionGap: z.string().min(1).max(500),
    monetization: z.string().min(1).max(500),
    specificity: z.string().min(1).max(500),
    buildability: z.string().min(1).max(500),
  }),
  scores: scoreSchema,
});

const opportunitiesSchema = z.object({
  opportunities: z.array(opportunitySchema).min(5).max(10),
});

export type GeneratedOpportunity = z.infer<typeof opportunitySchema>;

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateOpportunityScore(scores: z.infer<typeof scoreSchema>) {
  return clamp(
    scores.demand * 0.25 +
      scores.problemIntensity * 0.20 +
      scores.competitionGap * 0.20 +
      scores.monetization * 0.15 +
      scores.specificity * 0.10 +
      scores.buildability * 0.10,
  );
}

type EvidenceRow = {
  id: string;
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

function confidenceForOpportunity(
  opportunity: GeneratedOpportunity,
  evidenceById: Map<string, EvidenceRow>,
  evidenceQuality: ResearchSynthesis["evidenceQuality"],
) {
  const rows = opportunity.evidence
    .map((item) => evidenceById.get(item.sourceId))
    .filter((row): row is EvidenceRow => Boolean(row));

  const sourceCountScore = Math.min(100, (rows.length / 4) * 100);
  const domains = new Set(rows.map((row) => row.source_domain).filter(Boolean));
  const diversityScore = Math.min(100, (domains.size / 3) * 100);
  const credibility = rows.length
    ? rows.reduce((sum, row) => sum + (row.credibility_score ?? 50), 0) / rows.length
    : 0;

  return clamp(
    evidenceQuality.overall * 0.40 +
      sourceCountScore * 0.30 +
      diversityScore * 0.20 +
      credibility * 0.10,
  );
}

export async function generateAndStoreOpportunities(
  projectId: string,
  researchRunId: string,
  searchId: string,
  input: ResearchInput,
  synthesis: ResearchSynthesis,
) {
  const supabase = await createClient();

  const { data: evidence, error: evidenceError } = await supabase
    .from("research_evidence")
    .select("id,source_url,source_domain,source_type,title,snippet,content_excerpt,published_at,relevance_score,credibility_score")
    .eq("research_run_id", researchRunId)
    .order("credibility_score", { ascending: false, nullsFirst: false })
    .order("relevance_score", { ascending: false, nullsFirst: false })
    .limit(MAX_EVIDENCE_ITEMS);

  if (evidenceError) throw new Error(`Unable to load evidence for opportunity generation: ${evidenceError.message}`);

  const evidenceRows = (evidence ?? []) as EvidenceRow[];
  if (!evidenceRows.length) throw new Error("Opportunity generation requires research evidence.");

  const evidenceById = new Map(evidenceRows.map((row) => [row.id, row]));
  const evidencePacket = evidenceRows.map(compactEvidence);

  const { object } = await generateObject({
    model: getResearchModel(),
    schema: opportunitiesSchema,
    system: `You are ProductForge's opportunity strategist.

Generate digital-product opportunity hypotheses from supplied research evidence. The goal is not to invent attractive ideas; it is to translate repeated, evidence-backed problems and gaps into specific, buildable product opportunities.

Rules:
1. Treat supplied evidence as the only factual source. Do not invent statistics, customer quotes, competitors, prices, market sizes, trends, or demand.
2. An opportunity must be traceable to at least two supplied evidence sources. Use only valid source IDs.
3. Prefer specific audiences and concrete problems over broad niches.
4. Existing competition is not automatically bad. Score the competition gap based on evidence of limitations, complaints, underserved segments, or meaningful differentiation opportunities.
5. Price fields are hypotheses, not market facts. If pricing evidence is weak, keep the range conservative and explain that it is an estimate.
6. Score each dimension from 0-100 using only the supplied evidence and the defined rubric.
7. Do not calculate or provide an overall score. ProductForge calculates the weighted overall score separately.
8. Do not call anything guaranteed profitable. Use opportunity, signal, hypothesis, evidence, or potential.
9. Produce distinct opportunities rather than eight variations of the same idea.

SCORING RUBRIC
- Demand: strength and repetition of concrete demand signals in the evidence.
- Problem intensity: evidence that the problem is painful, frequent, costly, urgent, or frustrating.
- Competition gap: evidence that current solutions leave meaningful gaps for this audience/problem.
- Monetization: evidence of willingness to pay, existing spending, paid alternatives, or a clear economic value proposition.
- Specificity: how precisely the opportunity identifies a customer, problem, and use case.
- Buildability: how realistically a small creator/team could produce the proposed digital product using the stated format and available information.`,
    prompt: `Create ${OPPORTUNITY_COUNT} distinct ProductForge opportunities.

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

RESEARCH SYNTHESIS
${JSON.stringify(synthesis, null, 2)}

EVIDENCE PACKET
${JSON.stringify(evidencePacket, null, 2)}

Return opportunities that are directly supported by the evidence. Each evidence item must paraphrase a concrete claim from the supplied source and use its exact source ID.`
  });

  const valid = object.opportunities.filter((opportunity) =>
    opportunity.evidence.every((item) => evidenceById.has(item.sourceId)),
  );

  if (valid.length < 5) {
    throw new Error("Opportunity generation returned too few opportunities with valid evidence references.");
  }

  const ranked = valid.map((opportunity) => {
    const overallScore = calculateOpportunityScore(opportunity.scores);
    const confidenceScore = confidenceForOpportunity(opportunity, evidenceById, synthesis.evidenceQuality);
    const evidenceSummary = {
      sources: opportunity.evidence,
      scoreRationales: opportunity.scoreRationales,
      confidenceBasis: {
        evidenceQuality: synthesis.evidenceQuality,
        sourceCount: opportunity.evidence.length,
      },
    };

    return { opportunity, overallScore, confidenceScore, evidenceSummary };
  }).sort((a, b) => b.overallScore - a.overallScore);

  const inserted = [];

  for (const item of ranked) {
    const priceMin = Math.min(item.opportunity.estimatedPriceMin, item.opportunity.estimatedPriceMax);
    const priceMax = Math.max(item.opportunity.estimatedPriceMin, item.opportunity.estimatedPriceMax);

    const { data: opportunity, error: opportunityError } = await supabase
      .from("opportunities")
      .insert({
        search_id: searchId,
        project_id: projectId,
        title: item.opportunity.title,
        niche: item.opportunity.niche,
        target_audience: item.opportunity.targetAudience,
        problem: item.opportunity.problem,
        proposed_product: item.opportunity.proposedProduct,
        product_type: item.opportunity.productType,
        rationale: item.opportunity.rationale,
        demand_score: item.opportunity.scores.demand,
        problem_intensity_score: item.opportunity.scores.problemIntensity,
        competition_gap_score: item.opportunity.scores.competitionGap,
        monetization_score: item.opportunity.scores.monetization,
        specificity_score: item.opportunity.scores.specificity,
        buildability_score: item.opportunity.scores.buildability,
        opportunity_score: item.overallScore,
        estimated_price_min: priceMin,
        estimated_price_max: priceMax,
        confidence_score: item.confidenceScore,
        evidence_summary: item.evidenceSummary,
        status: "discovered",
      })
      .select("id")
      .single();

    if (opportunityError || !opportunity) {
      throw new Error(opportunityError?.message ?? "Unable to store generated opportunity");
    }

    const { error: scoreError } = await supabase.from("opportunity_scores").insert({
      opportunity_id: opportunity.id,
      demand_score: item.opportunity.scores.demand,
      problem_intensity_score: item.opportunity.scores.problemIntensity,
      competition_gap_score: item.opportunity.scores.competitionGap,
      monetization_score: item.opportunity.scores.monetization,
      specificity_score: item.opportunity.scores.specificity,
      buildability_score: item.opportunity.scores.buildability,
      overall_score: item.overallScore,
      confidence_score: item.confidenceScore,
      scoring_version: "v1",
      rationale: item.opportunity.rationale,
      evidence_summary: item.evidenceSummary,
    });

    if (scoreError) throw new Error(`Unable to store opportunity score: ${scoreError.message}`);

    inserted.push({
      id: opportunity.id,
      title: item.opportunity.title,
      opportunityScore: item.overallScore,
      confidenceScore: item.confidenceScore,
    });
  }

  return inserted;
}

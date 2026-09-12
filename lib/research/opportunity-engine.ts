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
  evidence: z.array(z.object({ sourceId: z.string(), claim: z.string().min(1).max(500) })).min(2).max(8),
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

const opportunitiesSchema = z.object({ opportunities: z.array(opportunitySchema).min(5).max(10) });
export type GeneratedOpportunity = z.infer<typeof opportunitySchema>;

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

export function calculateOpportunityScore(scores: z.infer<typeof scoreSchema>) {
  return clamp(scores.demand * 0.25 + scores.problemIntensity * 0.20 + scores.competitionGap * 0.20 + scores.monetization * 0.15 + scores.specificity * 0.10 + scores.buildability * 0.10);
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
  return { id: row.id, purpose: row.source_type, domain: row.source_domain, title: row.title, url: row.source_url, publishedAt: row.published_at, relevanceScore: row.relevance_score, credibilityScore: row.credibility_score, excerpt: (row.content_excerpt || row.snippet || "").slice(0, MAX_EXCERPT_CHARS) };
}

function confidenceForOpportunity(opportunity: GeneratedOpportunity, evidenceById: Map<string, EvidenceRow>, evidenceQuality: ResearchSynthesis["evidenceQuality"]) {
  const rows = opportunity.evidence.map((item) => evidenceById.get(item.sourceId)).filter((row): row is EvidenceRow => Boolean(row));
  const sourceCountScore = Math.min(100, (rows.length / 4) * 100);
  const domains = new Set(rows.map((row) => row.source_domain).filter(Boolean));
  const diversityScore = Math.min(100, (domains.size / 3) * 100);
  const credibility = rows.length ? rows.reduce((sum, row) => sum + (row.credibility_score ?? 50), 0) / rows.length : 0;
  return clamp(evidenceQuality.overall * 0.40 + sourceCountScore * 0.30 + diversityScore * 0.20 + credibility * 0.10);
}

function clean(value: string | undefined, fallback: string) {
  const text = value?.replace(/\s+/g, " ").trim();
  return text || fallback;
}

function claim(row: EvidenceRow) {
  return `${row.title || row.source_domain || "Research source"}: ${(row.content_excerpt || row.snippet || "").replace(/\s+/g, " ").slice(0, 360)}`;
}

function fallbackOpportunities(input: ResearchInput, synthesis: ResearchSynthesis, evidenceRows: EvidenceRow[]): GeneratedOpportunity[] {
  const usableEvidence = evidenceRows.filter((row) => row.id);
  if (usableEvidence.length < 2) throw new Error("Evidence-only opportunity generation requires at least two evidence sources.");

  const audience = clean(input.audience, "the target audience identified in the research");
  const topic = clean(input.interests?.filter(Boolean)[0], clean(input.name, "the researched topic"));
  const fallbackProblem = clean(input.problems, synthesis.painPoints[0] || "a recurring problem identified in the research");
  const base = Math.max(35, Math.min(88, synthesis.evidenceQuality.overall));
  const pool = [
    ...synthesis.painPoints,
    ...synthesis.underservedNeeds,
    ...synthesis.competitionGaps,
    ...synthesis.demandSignals,
    ...synthesis.monetizationSignals,
    ...synthesis.existingSolutions,
  ].map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean);

  const uniqueSignals = Array.from(new Set(pool));
  const sourceSignals = usableEvidence.map(claim);
  const angleTemplates = [
    ["Pain-to-Workflow", "workflow system", "Turn the most recurring research-backed pain into a repeatable workflow."],
    ["Underserved Segment", "specialist toolkit", "Serve a narrower need or audience segment identified as underserved."],
    ["Gap-Focused Solution", "gap-focused guide", "Address a documented limitation or gap in existing solutions."],
    ["Demand Capture", "action toolkit", "Package a repeated demand signal into a concrete action-oriented product."],
    ["Decision Support", "decision guide", "Help the audience make a recurring decision highlighted by the research."],
    ["Implementation System", "implementation system", "Help the audience move from knowing what to do to actually implementing it."],
    ["Reference / Practice", "reference and practice kit", "Create a practical reference or practice resource around a repeated information need."],
    ["Outcome Accelerator", "outcome-focused program", "Reduce friction around the most important outcome implied by the research."],
  ] as const;

  return angleTemplates.map(([label, format, description], index) => {
    const signal = uniqueSignals[index % Math.max(1, uniqueSignals.length)] || fallbackProblem;
    const first = usableEvidence[(index * 2) % usableEvidence.length];
    const second = usableEvidence[(index * 2 + 1) % usableEvidence.length];
    const demand = clamp(base + [6, 2, 1, 5, 0, 3, -1, 2][index]);
    const problemIntensity = clamp(base + [6, 8, 3, 1, 5, 4, 2, 6][index]);
    const competitionGap = clamp(base + [1, 5, 10, 3, 6, 7, 4, 5][index]);
    const monetization = clamp(base - 7 + [4, 1, 4, 5, 3, 2, 0, 5][index]);
    const specificity = clamp(base + 4 + (index % 3) * 2);
    const buildability = clamp(82 + [0, -2, -4, 1, -3, -5, -1, -6][index]);
    const problem = signal || fallbackProblem;
    const product = `${description} ${clean(problem, fallbackProblem)}`;

    return {
      title: `${label}: ${topic}`,
      niche: `${audience} · ${topic}`,
      targetAudience: audience,
      problem,
      proposedProduct: `A ${format} for ${audience.toLowerCase()} focused on ${product.toLowerCase()}`,
      productType: format,
      rationale: `Evidence-only hypothesis built from collected research. This is a distinct problem/job angle, not merely a different packaging format. Supporting signals: ${claim(first)} ${claim(second)}`,
      estimatedPriceMin: 10 + index * 2,
      estimatedPriceMax: 30 + index * 4,
      evidence: [
        { sourceId: first.id, claim: claim(first) },
        { sourceId: second.id, claim: claim(second) },
      ],
      scoreRationales: {
        demand: `Based on the research evidence quality (${synthesis.evidenceQuality.overall}/100) and the selected demand-related signal; direct demand still requires validation.`,
        problemIntensity: `Anchored to a distinct research signal rather than a generic product-format variation.`,
        competitionGap: `Treated as a hypothesis from documented gaps, underserved needs, or solution limitations; not a claim that competition is absent.`,
        monetization: `Willingness to pay remains a hypothesis unless the collected evidence explicitly supports it.`,
        specificity: `The direction identifies the project audience and a distinct job/problem angle.`,
        buildability: `A focused ${format} can be scoped into a testable first version without requiring a large product build.`,
      },
      scores: { demand, problemIntensity, competitionGap, monetization, specificity, buildability },
    };
  });
}

async function storeOpportunities(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, searchId: string, synthesis: ResearchSynthesis, evidenceRows: EvidenceRow[], opportunities: GeneratedOpportunity[]) {
  const evidenceById = new Map(evidenceRows.map((row) => [row.id, row]));
  const ranked = opportunities.map((opportunity) => {
    const overallScore = calculateOpportunityScore(opportunity.scores);
    const confidenceScore = confidenceForOpportunity(opportunity, evidenceById, synthesis.evidenceQuality);
    const evidenceSummary = { sources: opportunity.evidence, scoreRationales: opportunity.scoreRationales, confidenceBasis: { evidenceQuality: synthesis.evidenceQuality, sourceCount: opportunity.evidence.length } };
    return { opportunity, overallScore, confidenceScore, evidenceSummary };
  }).sort((a, b) => b.overallScore - a.overallScore);

  const inserted = [];
  for (const item of ranked) {
    const priceMin = Math.min(item.opportunity.estimatedPriceMin, item.opportunity.estimatedPriceMax);
    const priceMax = Math.max(item.opportunity.estimatedPriceMin, item.opportunity.estimatedPriceMax);
    const { data: opportunity, error: opportunityError } = await supabase.from("opportunities").insert({
      search_id: searchId, project_id: projectId, title: item.opportunity.title, niche: item.opportunity.niche,
      target_audience: item.opportunity.targetAudience, problem: item.opportunity.problem, proposed_product: item.opportunity.proposedProduct,
      product_type: item.opportunity.productType, rationale: item.opportunity.rationale,
      demand_score: item.opportunity.scores.demand, problem_intensity_score: item.opportunity.scores.problemIntensity,
      competition_gap_score: item.opportunity.scores.competitionGap, monetization_score: item.opportunity.scores.monetization,
      specificity_score: item.opportunity.scores.specificity, buildability_score: item.opportunity.scores.buildability,
      opportunity_score: item.overallScore, estimated_price_min: priceMin, estimated_price_max: priceMax,
      confidence_score: item.confidenceScore, evidence_summary: item.evidenceSummary, status: "discovered",
    }).select("id").single();
    if (opportunityError || !opportunity) throw new Error(opportunityError?.message ?? "Unable to store generated opportunity");

    const { error: scoreError } = await supabase.from("opportunity_scores").insert({
      opportunity_id: opportunity.id, demand_score: item.opportunity.scores.demand, problem_intensity_score: item.opportunity.scores.problemIntensity,
      competition_gap_score: item.opportunity.scores.competitionGap, monetization_score: item.opportunity.scores.monetization,
      specificity_score: item.opportunity.scores.specificity, buildability_score: item.opportunity.scores.buildability,
      overall_score: item.overallScore, confidence_score: item.confidenceScore, scoring_version: "v1",
      rationale: item.opportunity.rationale, evidence_summary: item.evidenceSummary,
    });
    if (scoreError) throw new Error(`Unable to store opportunity score: ${scoreError.message}`);
    inserted.push({ id: opportunity.id, title: item.opportunity.title, opportunityScore: item.overallScore, confidenceScore: item.confidenceScore });
  }
  return inserted;
}

export async function generateAndStoreOpportunities(projectId: string, researchRunId: string, searchId: string, input: ResearchInput, synthesis: ResearchSynthesis) {
  const supabase = await createClient();
  const { data: evidence, error: evidenceError } = await supabase.from("research_evidence")
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
  let opportunities: GeneratedOpportunity[];

  try {
    const { object } = await generateObject({
      model: getResearchModel(),
      schema: opportunitiesSchema,
      system: `You are ProductForge's opportunity strategist.

Generate digital-product opportunity hypotheses from supplied research evidence. Translate evidence-backed problems, jobs, gaps, underserved needs and demand signals into specific, buildable opportunities.

Rules:
1. Use supplied evidence as the only factual source. Never invent statistics, customer quotes, competitors, prices, market sizes, trends, or demand.
2. Every opportunity must cite at least two supplied evidence sources using exact source IDs.
3. Produce genuinely distinct opportunities. The eight outputs must differ primarily by CUSTOMER JOB / PROBLEM / UNDERSERVED NEED / COMPETITIVE GAP, not by renaming the same product as a playbook, toolkit, workbook, guide, template pack, library, etc.
4. Do not create multiple opportunities for the same audience + problem simply by changing the format.
5. Prefer specific audiences and concrete jobs over broad niches.
6. Existing competition is not automatically bad. Only claim a gap when evidence supports limitations, complaints, underserved segments, or a meaningful differentiation opportunity.
7. Price fields are hypotheses, not market facts.
8. Score each dimension 0-100 from the supplied evidence.
9. Do not calculate an overall score; ProductForge calculates it separately.
10. Never call anything guaranteed profitable.
11. If the evidence supports fewer than eight genuinely distinct opportunities, return fewer rather than manufacturing variants. Return at least five only when five distinct opportunities are actually supported.

SCORING RUBRIC
- Demand: strength and repetition of concrete demand signals.
- Problem intensity: evidence that the problem is painful, frequent, costly, urgent, or frustrating.
- Competition gap: evidence that current solutions leave meaningful gaps.
- Monetization: evidence of willingness to pay, existing spending, paid alternatives, or clear economic value.
- Specificity: precision of customer, problem, and use case.
- Buildability: realistic scope for a small creator/team.`,
      prompt: `Create up to ${OPPORTUNITY_COUNT} genuinely distinct ProductForge opportunities from the research below.

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

Before finalizing, check every pair of opportunities: if two have substantially the same audience, problem and job, merge them and replace one with a genuinely different evidence-backed angle. Product format alone is never enough to make an opportunity distinct.

Every evidence item must paraphrase a concrete claim from the supplied source and use its exact source ID.`,
    });
    opportunities = object.opportunities.filter((opportunity) => opportunity.evidence.every((item) => evidenceById.has(item.sourceId)));
    if (opportunities.length < 5) throw new Error("Opportunity generation returned fewer than five evidence-grounded distinct opportunities.");
  } catch (error) {
    console.warn("AI opportunity generation unavailable; using evidence-only fallback.", error);
    opportunities = fallbackOpportunities(input, synthesis, evidenceRows);
  }

  return storeOpportunities(supabase, projectId, searchId, synthesis, evidenceRows, opportunities);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Opportunity = {
  id: string;
  title: string;
  target_audience: string | null;
  problem: string | null;
  proposed_product: string | null;
  opportunity_score: number | null;
  confidence_score: number | null;
  demand_score: number | null;
  problem_intensity_score: number | null;
  competition_gap_score: number | null;
  monetization_score: number | null;
  specificity_score: number | null;
  buildability_score: number | null;
};

type Evidence = {
  id: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
};

function n(value: number | null) {
  return Math.round(Number(value ?? 0));
}

function strengthsFor(opportunity: Opportunity) {
  const strengths: string[] = [];
  const dimensions = [
    ["Demand signal", n(opportunity.demand_score)],
    ["Problem severity", n(opportunity.problem_intensity_score)],
    ["Competition gap", n(opportunity.competition_gap_score)],
    ["Monetization signal", n(opportunity.monetization_score)],
    ["Specificity", n(opportunity.specificity_score)],
    ["Buildability", n(opportunity.buildability_score)],
  ] as const;

  for (const [label, value] of dimensions.filter(([, value]) => value >= 70).slice(0, 4)) {
    strengths.push(`${label} is a strong research signal (${value}/100).`);
  }
  if (opportunity.target_audience) strengths.push(`The target audience is defined: ${opportunity.target_audience}.`);
  if (opportunity.proposed_product) strengths.push("The research points to a concrete product direction rather than an abstract topic.");
  return strengths.length ? strengths : ["The opportunity has enough research signal to justify a structured validation test."];
}

function risksFor(opportunity: Opportunity) {
  const risks: string[] = [];
  const dimensions = [
    ["demand", n(opportunity.demand_score)],
    ["problem severity", n(opportunity.problem_intensity_score)],
    ["competition gap", n(opportunity.competition_gap_score)],
    ["monetization", n(opportunity.monetization_score)],
    ["specificity", n(opportunity.specificity_score)],
    ["buildability", n(opportunity.buildability_score)],
  ] as const;

  for (const [label, value] of dimensions.filter(([, value]) => value < 60).slice(0, 4)) {
    risks.push(`The ${label} signal is not yet strong enough (${value}/100).`);
  }
  if (!opportunity.target_audience) risks.push("The target audience is not specific enough yet.");
  if (!opportunity.problem) risks.push("The core problem statement needs stronger specificity before testing.");
  return risks.length ? risks : ["No major scoring weakness was detected; willingness to pay still needs real-world confirmation."];
}

function disproofFindings(opportunity: Opportunity) {
  return [
    `If target users do not consistently describe the stated problem as important, the opportunity should be refined or rejected.`,
    `If comparable solutions satisfy users without a meaningful unmet need, the competition-gap thesis is weakened.`,
    `If qualified users show little willingness to pay for the proposed outcome, the monetization thesis is disproved.`,
  ];
}

function recommendedChanges(opportunity: Opportunity) {
  const changes: string[] = [];
  if (n(opportunity.demand_score) < 70) changes.push("Narrow the audience and test demand with a focused message.");
  if (n(opportunity.problem_intensity_score) < 70) changes.push("Interview target users to verify the problem is frequent, costly, or frustrating enough to solve.");
  if (n(opportunity.competition_gap_score) < 70) changes.push("Map the strongest existing alternatives and identify one concrete underserved use case.");
  if (n(opportunity.monetization_score) < 70) changes.push("Test willingness to pay before investing in a full product build.");
  if (n(opportunity.specificity_score) < 70) changes.push("Make the promise narrower and outcome-focused.");
  if (!changes.length) changes.push("Run a small audience test, gather direct feedback, and confirm willingness to pay before building the full product.");
  return changes.join(" ");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string; opportunityId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project } = await supabase
    .from("projects")
    .select("id,name")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const opportunityQuery = supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score")
    .eq("project_id", project.id);

  const { data: opportunity, error: opportunityError } = body.opportunityId
    ? await opportunityQuery.eq("id", body.opportunityId).single()
    : await opportunityQuery.order("opportunity_score", { ascending: false }).limit(1).maybeSingle();

  if (opportunityError || !opportunity) {
    return NextResponse.json({ error: "No researched opportunity is available to validate yet. Complete research first." }, { status: 400 });
  }

  const typedOpportunity = opportunity as Opportunity;
  const { data: evidence, count } = await supabase
    .from("research_evidence")
    .select("id,source_domain,source_type,title", { count: "exact" })
    .eq("opportunity_id", typedOpportunity.id)
    .limit(100);

  const evidenceRows = (evidence ?? []) as Evidence[];
  const sourceDomains = new Set(evidenceRows.map((row) => row.source_domain).filter(Boolean));
  const sourceTypes = new Set(evidenceRows.map((row) => row.source_type).filter(Boolean));
  const overall = n(typedOpportunity.opportunity_score);
  const confidence = n(typedOpportunity.confidence_score);

  const decision: "proceed" | "refine" | "abandon" = overall >= 75 && confidence >= 65
    ? "proceed"
    : overall >= 50 && confidence >= 40
      ? "refine"
      : "abandon";

  const evidenceSummary = `Based on ${count ?? evidenceRows.length} linked evidence records across ${sourceDomains.size} source domain${sourceDomains.size === 1 ? "" : "s"} and ${sourceTypes.size} source type${sourceTypes.size === 1 ? "" : "s"}. Opportunity score: ${overall}/100. Research confidence: ${confidence}/100. This is a decision aid, not a guarantee of demand or revenue.`;

  const { data: report, error: reportError } = await supabase
    .from("validation_reports")
    .insert({
      project_id: project.id,
      opportunity_id: typedOpportunity.id,
      decision,
      confidence_score: confidence,
      strengths: strengthsFor(typedOpportunity),
      risks: risksFor(typedOpportunity),
      disproof_findings: disproofFindings(typedOpportunity),
      evidence_summary: evidenceSummary,
      recommended_changes: recommendedChanges(typedOpportunity),
    })
    .select("id,decision,confidence_score,strengths,risks,disproof_findings,evidence_summary,recommended_changes,created_at")
    .single();

  if (reportError || !report) return NextResponse.json({ error: reportError?.message ?? "Unable to save validation report" }, { status: 500 });

  const projectUpdate = await supabase
    .from("projects")
    .update({ status: "validated", current_stage: 3, updated_at: new Date().toISOString() })
    .eq("id", project.id);

  if (projectUpdate.error) return NextResponse.json({ error: projectUpdate.error.message }, { status: 500 });

  return NextResponse.json({ report, opportunityId: typedOpportunity.id }, { status: 201 });
}

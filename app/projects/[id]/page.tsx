import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResearchButton } from "@/components/research-button";

type Synthesis = {
  executiveSummary?: string;
  demandSignals?: string[];
  painPoints?: string[];
  existingSolutions?: string[];
  monetizationSignals?: string[];
  competitionGaps?: string[];
  underservedNeeds?: string[];
  contradictions?: string[];
  researchGaps?: string[];
  evidenceQuality?: {
    coverage?: number;
    sourceDiversity?: number;
    recency?: number;
    agreement?: number;
    overall?: number;
  };
};

type Opportunity = {
  id: string;
  title: string;
  niche: string;
  target_audience: string | null;
  problem: string | null;
  proposed_product: string | null;
  product_type: string | null;
  rationale: string | null;
  demand_score: number | null;
  problem_intensity_score: number | null;
  competition_gap_score: number | null;
  monetization_score: number | null;
  specificity_score: number | null;
  buildability_score: number | null;
  opportunity_score: number | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  confidence_score: number | null;
  evidence_summary: {
    sources?: Array<{ sourceId?: string; claim?: string }>;
    scoreRationales?: Record<string, string>;
    confidenceBasis?: { sourceCount?: number };
  } | null;
};

type Evidence = {
  id: string;
  source_url: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
  snippet: string | null;
};

function score(value: number | null | undefined) {
  return Math.round(value ?? 0);
}

function scoreLabel(value: number | null | undefined) {
  const numeric = score(value);
  if (numeric >= 80) return "Strong";
  if (numeric >= 60) return "Promising";
  if (numeric >= 40) return "Mixed";
  return "Weak";
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const numeric = score(value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{numeric}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${numeric}%` }} />
      </div>
    </div>
  );
}

function SignalList({ items, empty }: { items?: string[]; empty: string }) {
  if (!items?.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,status,current_stage,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!project) notFound();

  const { data: inputs } = await supabase
    .from("project_inputs")
    .select("problems,goals,additional_context")
    .eq("project_id", id)
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: latestRun } = await supabase
    .from("research_runs")
    .select("id,status,stage,metadata,opportunity_search_id,created_at,completed_at,error_message")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: evidenceCount } = await supabase
    .from("research_evidence")
    .select("id", { count: "exact", head: true })
    .eq("research_run_id", latestRun?.id ?? "00000000-0000-0000-0000-000000000000");

  const { data: evidenceRows } = latestRun?.id
    ? await supabase
        .from("research_evidence")
        .select("id,source_url,source_domain,source_type,title,snippet")
        .eq("research_run_id", latestRun.id)
        .order("credibility_score", { ascending: false, nullsFirst: false })
        .limit(12)
    : { data: [] };

  const { data: opportunityRows } = latestRun?.opportunity_search_id
    ? await supabase
        .from("opportunities")
        .select("id,title,niche,target_audience,problem,proposed_product,product_type,rationale,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score,opportunity_score,estimated_price_min,estimated_price_max,confidence_score,evidence_summary")
        .eq("search_id", latestRun.opportunity_search_id)
        .order("opportunity_score", { ascending: false })
        .limit(10)
    : { data: [] };

  const synthesis = ((latestRun?.metadata as { synthesis?: Synthesis } | null)?.synthesis ?? {}) as Synthesis;
  const opportunities = (opportunityRows ?? []) as Opportunity[];
  const evidence = (evidenceRows ?? []) as Evidence[];
  const isComplete = latestRun?.status === "completed" && opportunities.length > 0;
  const evidenceQuality = synthesis.evidenceQuality?.overall ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Projects</Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900">{project.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Research workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{isComplete ? "Opportunity landscape" : "Research your opportunity"}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {isComplete
                ? "Evidence-backed signals, gaps and product opportunities generated from your research run."
                : "ProductForge searches the market before recommending what you could build."}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm capitalize text-slate-600">{project.status}</span>
        </div>

        {!isComplete && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Your starting point</p>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{inputs?.[0]?.problems || inputs?.[0]?.goals || "No starting point saved."}</p>
                {latestRun && (
                  <p className="mt-4 text-sm text-slate-500">Latest run: <span className="capitalize">{latestRun.status}</span> · <span className="capitalize">{latestRun.stage?.replaceAll("_", " ")}</span></p>
                )}
              </div>
              <ResearchButton projectId={project.id} />
            </div>
            {latestRun?.status === "failed" && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{latestRun.error_message}</div>
            )}
          </section>
        )}

        {isComplete && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Evidence quality</p>
                <div className="mt-3 flex items-end gap-2"><span className="text-4xl font-semibold text-slate-950">{score(evidenceQuality)}</span><span className="mb-1.5 text-sm text-slate-500">/ 100</span></div>
                <p className="mt-2 text-sm text-slate-500">{scoreLabel(evidenceQuality)} evidence confidence</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Opportunities</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{opportunities.length}</p>
                <p className="mt-2 text-sm text-slate-500">Evidence-backed hypotheses generated</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Evidence sources</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{evidenceCount ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500">Sources collected for this run</p>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Synthesis</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">What the research is telling us</h2>
                </div>
                <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 md:inline-flex">Evidence first</span>
              </div>
              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">{synthesis.executiveSummary || "No synthesis summary is available."}</p>
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Demand</p>
                <h2 className="mb-5 mt-1 text-xl font-semibold">Demand signals</h2>
                <SignalList items={synthesis.demandSignals} empty="No strong demand signals were established." />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Problems</p>
                <h2 className="mb-5 mt-1 text-xl font-semibold">Pain points</h2>
                <SignalList items={synthesis.painPoints} empty="No pain points were established." />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Market</p>
                <h2 className="mb-5 mt-1 text-xl font-semibold">Competition gaps</h2>
                <SignalList items={synthesis.competitionGaps} empty="No meaningful competition gaps were established." />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Opportunity</p>
                <h2 className="mb-5 mt-1 text-xl font-semibold">Underserved needs</h2>
                <SignalList items={synthesis.underservedNeeds} empty="No underserved needs were established." />
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Ranked by evidence</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Top opportunities</h2>
                </div>
                <p className="text-sm text-slate-500">Opportunity score is not a profit guarantee.</p>
              </div>

              <div className="space-y-5">
                {opportunities.map((opportunity, index) => {
                  const sourceIds = opportunity.evidence_summary?.sources?.map((source) => source.sourceId).filter(Boolean) ?? [];
                  const opportunityEvidence = evidence.filter((item) => sourceIds.includes(item.id));
                  return (
                    <article key={opportunity.id} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">#{index + 1}</span>
                            {opportunity.product_type && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{opportunity.product_type}</span>}
                          </div>
                          <h3 className="mt-3 text-2xl font-semibold text-slate-950">{opportunity.title}</h3>
                          <p className="mt-2 text-sm font-medium text-slate-500">{opportunity.niche}</p>
                          <p className="mt-4 max-w-3xl text-slate-700 leading-7">{opportunity.problem}</p>
                          {opportunity.proposed_product && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Proposed product</p><p className="mt-1 text-sm leading-6 text-slate-700">{opportunity.proposed_product}</p></div>}
                        </div>
                        <div className="shrink-0 rounded-2xl border border-slate-200 p-5 lg:w-44">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Opportunity</p>
                          <p className="mt-1 text-4xl font-semibold text-slate-950">{score(opportunity.opportunity_score)}</p>
                          <p className="text-xs text-slate-500">/ 100</p>
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confidence</p>
                            <p className="mt-1 text-lg font-semibold text-slate-800">{score(opportunity.confidence_score)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 grid gap-x-8 gap-y-5 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
                        <ScoreBar label="Demand · 25%" value={opportunity.demand_score} />
                        <ScoreBar label="Problem intensity · 20%" value={opportunity.problem_intensity_score} />
                        <ScoreBar label="Competition gap · 20%" value={opportunity.competition_gap_score} />
                        <ScoreBar label="Monetization · 15%" value={opportunity.monetization_score} />
                        <ScoreBar label="Specificity · 10%" value={opportunity.specificity_score} />
                        <ScoreBar label="Buildability · 10%" value={opportunity.buildability_score} />
                      </div>

                      <div className="mt-7 border-t border-slate-100 pt-6">
                        <details>
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">Why ProductForge ranked this opportunity</summary>
                          <div className="mt-5 grid gap-6 lg:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rationale</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{opportunity.rationale || "No rationale available."}</p>
                              {opportunity.estimated_price_min !== null && opportunity.estimated_price_max !== null && (
                                <p className="mt-4 text-sm text-slate-600">Estimated price hypothesis: <span className="font-semibold text-slate-800">{opportunity.estimated_price_min}–{opportunity.estimated_price_max}</span></p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Supporting evidence</p>
                              <div className="mt-3 space-y-3">
                                {opportunityEvidence.length ? opportunityEvidence.map((item) => (
                                  <a key={item.id} href={item.source_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 p-3 hover:border-slate-400">
                                    <p className="text-sm font-medium text-slate-800">{item.title || item.source_domain || "Research source"}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.snippet || "Open source"}</p>
                                  </a>
                                )) : <p className="text-sm text-slate-500">Evidence references are stored with this opportunity.</p>}
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">What we still need to validate</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Research gaps</h2>
                <div className="mt-5"><SignalList items={synthesis.researchGaps} empty="No research gaps were recorded." /></div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Evidence quality</p>
                <h2 className="mt-1 text-xl font-semibold">How strong is the evidence?</h2>
                <div className="mt-5 space-y-4">
                  <ScoreBar label="Coverage" value={synthesis.evidenceQuality?.coverage ?? 0} />
                  <ScoreBar label="Source diversity" value={synthesis.evidenceQuality?.sourceDiversity ?? 0} />
                  <ScoreBar label="Recency" value={synthesis.evidenceQuality?.recency ?? 0} />
                  <ScoreBar label="Agreement" value={synthesis.evidenceQuality?.agreement ?? 0} />
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Source explorer</p>
                  <h2 className="mt-1 text-xl font-semibold">Research sources</h2>
                </div>
                <span className="text-sm text-slate-500">Showing up to 12</span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {evidence.map((item) => (
                  <a key={item.id} href={item.source_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-4 hover:border-slate-400">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-400">{item.source_domain || "source"}</span><span className="text-xs capitalize text-slate-400">{item.source_type?.replaceAll("_", " ")}</span></div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{item.title || item.source_url}</p>
                    {item.snippet && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.snippet}</p>}
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";
import { OpportunityEvidence } from "@/components/opportunity-evidence";

type EvidenceSummary = {
  sources?: Array<{ sourceId?: string; claim?: string }>;
  scoreRationales?: Record<string, string>;
  confidenceBasis?: { sourceCount?: number };
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
  opportunity_score: number | null;
  confidence_score: number | null;
  demand_score: number | null;
  problem_intensity_score: number | null;
  competition_gap_score: number | null;
  monetization_score: number | null;
  specificity_score: number | null;
  buildability_score: number | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  evidence_summary: EvidenceSummary | string | null;
};

type Evidence = {
  id: string;
  source_url: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
  snippet: string | null;
  relevance_score: number | null;
  credibility_score: number | null;
};

function parseEvidenceSummary(value: EvidenceSummary | string | null | undefined): EvidenceSummary | null {
  if (!value) return null;
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as EvidenceSummary;
  } catch {
    return null;
  }
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,niche,target_audience,problem,proposed_product,product_type,rationale,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score,estimated_price_min,estimated_price_max,evidence_summary")
    .eq("project_id", id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedOpportunity = opportunity as Opportunity | null;
  const evidenceSummary = parseEvidenceSummary(typedOpportunity?.evidence_summary);
  let evidence: Evidence[] = [];

  if (typedOpportunity) {
    const sourceIds = evidenceSummary?.sources?.map((source) => source.sourceId).filter((sourceId): sourceId is string => Boolean(sourceId)) ?? [];

    if (sourceIds.length) {
      const { data: linkedRows } = await supabase
        .from("research_evidence")
        .select("id,source_url,source_domain,source_type,title,snippet,relevance_score,credibility_score")
        .in("id", sourceIds)
        .order("relevance_score", { ascending: false });
      evidence = (linkedRows ?? []) as Evidence[];
    }

    if (!evidence.length) {
      const { data: run } = await supabase
        .from("research_runs")
        .select("id")
        .eq("project_id", id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (run) {
        const { data: runEvidence } = await supabase
          .from("research_evidence")
          .select("id,source_url,source_domain,source_type,title,snippet,relevance_score,credibility_score")
          .eq("research_run_id", run.id)
          .order("relevance_score", { ascending: false })
          .limit(8);
        evidence = (runEvidence ?? []) as Evidence[];
      }
    }
  }

  const score = Math.round(Number(typedOpportunity?.opportunity_score ?? 0));
  const confidence = Math.round(Number(typedOpportunity?.confidence_score ?? 0));
  const metrics = [
    ["Demand", typedOpportunity?.demand_score],
    ["Problem intensity", typedOpportunity?.problem_intensity_score],
    ["Competition gap", typedOpportunity?.competition_gap_score],
    ["Monetization", typedOpportunity?.monetization_score],
    ["Specificity", typedOpportunity?.specificity_score],
    ["Buildability", typedOpportunity?.buildability_score],
  ] as const;

  return (
    <StageShell projectId={id} projectName={project.name} active="Opportunity">
      <div className="pt-8">
        <p className="pf-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">02 · Opportunity intelligence</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="pf-display max-w-4xl text-5xl font-semibold leading-[.91] sm:text-6xl">{typedOpportunity?.title ?? "Find the strongest opportunity."}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#707069]">{typedOpportunity?.problem ?? "ProductForge will rank the strongest product opportunities after successful research."}</p>
          </div>
          {typedOpportunity && <div className="pf-glow relative overflow-hidden rounded-[30px] bg-[#171714] p-6 text-white shadow-[0_24px_60px_rgba(21,21,19,.16)]">
            <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#d9f06a]/15 blur-3xl" />
            <div className="relative flex items-center justify-between gap-5">
              <div><p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-white/45">Opportunity score</p><p className="pf-display mt-2 text-5xl font-semibold text-[#d9f06a]">{score}<span className="text-lg text-white/35">/100</span></p><p className="pf-mono mt-2 text-[9px] uppercase tracking-[.12em] text-white/40">{confidence}% evidence confidence</p></div>
              <div className="relative grid h-24 w-24 place-items-center rounded-full border border-white/10"><div className="absolute inset-2 rounded-full" style={{ background: `conic-gradient(#d9f06a ${score * 3.6}deg, rgba(255,255,255,.07) 0deg)` }} /><div className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-[#171714]"><span className="pf-mono text-[10px] text-white/70">SIGNAL</span></div></div>
            </div>
          </div>}
        </div>

        {!typedOpportunity ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8"><p className="text-lg font-semibold">No opportunity has been generated yet.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707069]">Complete the research stage first. ProductForge will use collected market evidence to generate and rank distinct product opportunities here.</p><Link href={`/projects/${id}`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Back to research →</Link></section>
        ) : (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <section className="pf-card pf-card-hover rounded-[30px] p-7">
                <div className="flex items-center justify-between"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">The hypothesis</p><span className="pf-mono rounded-full bg-[#eef5cf] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#596b00]">Rank 01</span></div>
                <h2 className="pf-display mt-3 text-3xl font-semibold">What could be built</h2>
                <p className="mt-5 text-sm leading-7 text-[#5f5f58]">{typedOpportunity.proposed_product ?? "The research engine did not record a product concept."}</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f4f4f0] p-4"><p className="pf-mono text-[9px] uppercase tracking-[.12em] text-[#999991]">Audience</p><p className="mt-2 text-sm font-semibold">{typedOpportunity.target_audience ?? "Defined from research"}</p></div><div className="rounded-2xl bg-[#f4f4f0] p-4"><p className="pf-mono text-[9px] uppercase tracking-[.12em] text-[#999991]">Product type</p><p className="mt-2 text-sm font-semibold">{typedOpportunity.product_type ?? "Digital product"}</p></div></div>
              </section>
              <section className="pf-card pf-glow rounded-[30px] bg-[#ecece6] p-7">
                <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Signal profile</p>
                <div className="mt-5 space-y-4">{metrics.map(([label, value], index) => { const numeric = Math.round(Number(value ?? 0)); return <div key={label}><div className="flex items-end justify-between"><span className="text-xs text-[#73736d]">{label}</span><span className="pf-mono text-[10px] font-semibold">{String(numeric).padStart(2, "0")}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#171714] transition-all" style={{ width: `${numeric}%`, animationDelay: `${index * 80}ms` }} /></div></div>; })}</div>
              </section>
            </div>

            <OpportunityEvidence evidence={evidence} summary={evidenceSummary} />

            <section className="pf-card mt-4 overflow-hidden rounded-[30px] p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Decision surface</p><h2 className="pf-display mt-2 text-3xl font-semibold">Six signals. One opportunity.</h2></div><p className="max-w-md text-xs leading-5 text-[#77776f]">The score is a research-based estimate, not a promise. Confidence describes the strength of the evidence behind the estimate.</p></div>
              <div className="mt-7 grid gap-2 md:grid-cols-6">{metrics.map(([label, value], index) => { const numeric = Math.round(Number(value ?? 0)); return <div key={label} className="rounded-2xl border border-[#e4e4dd] bg-[#f7f7f3] p-4"><span className="pf-mono text-[8px] text-[#aaa9a1]">0{index + 1}</span><div className="mt-8 text-2xl font-semibold">{numeric}</div><p className="mt-1 text-[10px] leading-4 text-[#73736d]">{label}</p></div>; })}</div>
            </section>
            <div className="mt-5 flex flex-wrap justify-end gap-3"><Link href={`/projects/${id}`} className="rounded-full border border-[#d5d5cd] bg-white px-5 py-3 text-sm font-semibold">Back to research</Link><Link href={`/projects/${id}/validate`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">Validate this opportunity →</Link></div>
          </>
        )}
      </div>
    </StageShell>
  );
}

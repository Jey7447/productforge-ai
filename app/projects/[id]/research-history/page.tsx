import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";

type ResearchRun = {
  id: string;
  status: string;
  stage: string | null;
  metadata: { synthesis?: { evidenceQuality?: { overall?: number } } } | null;
  opportunity_search_id: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type RunSummary = ResearchRun & {
  evidenceCount: number;
  opportunityCount: number;
  topOpportunity: { title: string; opportunity_score: number | null; confidence_score: number | null } | null;
  evidenceQuality: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function delta(current: number, previous: number) {
  const value = current - previous;
  return `${value > 0 ? "+" : ""}${value}`;
}

function Delta({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const value = current - previous;
  return <span className={value > 0 ? "text-[#5f7c00]" : value < 0 ? "text-[#b42318]" : "text-[#73736d]"}>{delta(current, previous)}{suffix}</span>;
}

export default async function ResearchHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: runs } = await supabase
    .from("research_runs")
    .select("id,status,stage,metadata,opportunity_search_id,created_at,completed_at,error_message")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const summaries: RunSummary[] = await Promise.all((runs ?? []).map(async (run) => {
    const typedRun = run as ResearchRun;
    const evidenceResult = await supabase
      .from("research_evidence")
      .select("id", { count: "exact", head: true })
      .eq("research_run_id", typedRun.id);

    let opportunityCount = 0;
    let topOpportunity: RunSummary["topOpportunity"] = null;

    if (typedRun.opportunity_search_id) {
      const opportunityCountResult = await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("search_id", typedRun.opportunity_search_id);
      opportunityCount = opportunityCountResult.count ?? 0;

      const topResult = await supabase
        .from("opportunities")
        .select("title,opportunity_score,confidence_score")
        .eq("search_id", typedRun.opportunity_search_id)
        .order("opportunity_score", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      topOpportunity = topResult.data ?? null;
    }

    return {
      ...typedRun,
      evidenceCount: evidenceResult.count ?? 0,
      opportunityCount,
      topOpportunity,
      evidenceQuality: Math.round(typedRun.metadata?.synthesis?.evidenceQuality?.overall ?? 0),
    };
  }));

  const completedRuns = summaries.filter((run) => run.status === "completed");
  const latest = completedRuns[0] ?? summaries[0] ?? null;
  const previous = completedRuns[1] ?? null;

  return (
    <StageShell projectId={id} projectName={project.name} active="Research" hideResearchExplorer>
      <div className="pt-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">Research intelligence</p>
            <h1 className="pf-display mt-3 text-5xl font-semibold leading-[.94] sm:text-6xl">Research history</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">See how ProductForge's evidence base and opportunity landscape change from one research run to the next.</p>
          </div>
          <Link href={`/projects/${id}`} className="pf-lift w-fit rounded-full border border-[#d2d2ca] bg-white px-5 py-3 text-xs font-bold shadow-sm transition hover:border-[#aaa9a0]">← Latest workspace</Link>
        </div>

        {latest && previous && (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-[#171714] p-7 text-white sm:p-9">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="pf-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#c9e83f]">Run comparison</p>
                <h2 className="mt-2 text-2xl font-semibold">What changed since the previous run?</h2>
                <p className="mt-2 text-sm text-white/60">{formatDate(previous.created_at)} → {formatDate(latest.created_at)}</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">Evidence before conclusions</span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Evidence", latest.evidenceCount, previous.evidenceCount, ""],
                ["Opportunities", latest.opportunityCount, previous.opportunityCount, ""],
                ["Evidence quality", latest.evidenceQuality, previous.evidenceQuality, ""],
                ["Top opportunity", latest.topOpportunity?.opportunity_score ?? 0, previous.topOpportunity?.opportunity_score ?? 0, ""],
                ["Confidence", latest.topOpportunity?.confidence_score ?? 0, previous.topOpportunity?.confidence_score ?? 0, "%"],
              ].map(([label, current, old, suffix]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{current}{suffix}</p>
                  <p className="mt-1 text-xs text-white/50">Previous {old}{suffix} · <Delta current={Number(current)} previous={Number(old)} suffix={String(suffix)} /></p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[#d9f06a] p-5 text-[#171714]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#687900]">Opportunity movement</p>
              <p className="mt-2 text-lg font-semibold">{latest.topOpportunity?.title ?? "No ranked opportunity"}</p>
              <p className="mt-1 text-sm leading-6 text-[#4f4f49]">
                {previous.topOpportunity?.title ? `Previous leader: ${previous.topOpportunity.title}. ` : "No previous ranked opportunity was available. "}
                Treat score movement as a research signal, not proof that demand or profitability has changed.
              </p>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Run archive</p>
              <h2 className="mt-1 text-2xl font-semibold">Every research run</h2>
            </div>
            <span className="rounded-full border border-[#deded7] bg-white px-3 py-1.5 text-xs font-semibold text-[#73736d]">{summaries.length} saved</span>
          </div>

          {!summaries.length ? (
            <div className="rounded-[26px] border border-[#deded7] bg-white p-8 text-sm text-[#73736d]">No research runs have been saved yet.</div>
          ) : (
            <div className="space-y-4">
              {summaries.map((run, index) => (
                <article key={run.id} className={`rounded-[26px] border p-6 ${index === 0 ? "border-[#c9e83f] bg-[#fbfff0]" : "border-[#deded7] bg-white"}`}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171714] text-xs font-bold text-[#c9e83f]">#{summaries.length - index}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{index === 0 ? "Latest research run" : `Research run ${summaries.length - index}`}</h3>
                          <span className="rounded-full bg-[#f1f1ed] px-2.5 py-1 text-[10px] font-bold capitalize text-[#73736d]">{run.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#73736d]">{formatDate(run.created_at)} · {run.stage?.replaceAll("_", " ") ?? "unknown stage"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
                      <div><p className="text-[9px] font-bold uppercase tracking-wider text-[#999991]">Evidence</p><p className="mt-1 font-semibold">{run.evidenceCount}</p></div>
                      <div><p className="text-[9px] font-bold uppercase tracking-wider text-[#999991]">Opportunities</p><p className="mt-1 font-semibold">{run.opportunityCount}</p></div>
                      <div><p className="text-[9px] font-bold uppercase tracking-wider text-[#999991]">Quality</p><p className="mt-1 font-semibold">{run.evidenceQuality}/100</p></div>
                    </div>
                  </div>

                  {run.topOpportunity && (
                    <div className="mt-5 grid gap-4 border-t border-[#ededed] pt-5 md:grid-cols-[1fr_auto] md:items-center">
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#999991]">Top opportunity</p><p className="mt-1 font-semibold">{run.topOpportunity.title}</p></div>
                      <div className="flex gap-5 text-sm"><span><span className="text-[#999991]">Score </span><strong>{Math.round(run.topOpportunity.opportunity_score ?? 0)}</strong></span><span><span className="text-[#999991]">Confidence </span><strong>{Math.round(run.topOpportunity.confidence_score ?? 0)}%</strong></span></div>
                    </div>
                  )}

                  {run.error_message && <p className="mt-4 rounded-xl bg-[#fff0ee] p-3 text-sm text-[#b42318]">{run.error_message}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[26px] border border-[#deded7] bg-white p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Why this matters</p>
          <h2 className="mt-2 text-2xl font-semibold">Research should become a learning loop.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#73736d]">A new run does not automatically make an opportunity better or worse. ProductForge keeps the history so you can distinguish a genuine change in the evidence from normal variation between searches.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#4f4f49]"><span className="rounded-full bg-[#f5f5f2] px-3 py-2">Research</span><span>→</span><span className="rounded-full bg-[#f5f5f2] px-3 py-2">Compare</span><span>→</span><span className="rounded-full bg-[#f5f5f2] px-3 py-2">Validate</span><span>→</span><span className="rounded-full bg-[#f5f5f2] px-3 py-2">Learn</span></div>
        </section>
      </div>
    </StageShell>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";
import { ValidationButton } from "@/components/validation-button";

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
  status: string;
};

type Report = {
  id: string;
  decision: "proceed" | "refine" | "abandon" | null;
  confidence_score: number | null;
  strengths: string[];
  risks: string[];
  disproof_findings: string[];
  evidence_summary: string | null;
  recommended_changes: string | null;
};

function score(value: number | null | undefined) { return Math.round(Number(value ?? 0)); }
function decisionLabel(decision: Report["decision"]) {
  if (decision === "proceed") return "Proceed to a focused build";
  if (decision === "refine") return "Refine before building";
  if (decision === "abandon") return "Do not build this version yet";
  return "Awaiting validation";
}
function decisionClass(decision: Report["decision"]) {
  if (decision === "proceed") return "bg-[#d9f06a] text-[#171714]";
  if (decision === "refine") return "bg-[#fff1b8] text-[#5d4b00]";
  return "bg-[#eeeae6] text-[#5f5b56]";
}
function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-[#73736d]">{empty}</p>;
  return <ul className="space-y-3">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-[#565650]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#171714]" /><span>{item}</span></li>)}</ul>;
}

const assumptions = [
  { number: "01", title: "The problem is real", body: "Qualified people recognize the problem without needing a long explanation." },
  { number: "02", title: "The problem is important", body: "The problem happens often enough, or hurts enough, to justify a solution." },
  { number: "03", title: "The promise is differentiated", body: "The proposed product gives the audience a meaningful reason to choose it over alternatives." },
  { number: "04", title: "People will pay", body: "The target audience shows a credible willingness to pay for the proposed outcome." },
];

const experiments = [
  { label: "Customer conversations", threshold: "5–10 qualified conversations; look for repeated, unprompted problem language." },
  { label: "Promise test", threshold: "A focused landing/message test that produces meaningful interest from the intended audience." },
  { label: "Alternative test", threshold: "Document what people use today and identify a specific reason they would switch." },
  { label: "Willingness-to-pay test", threshold: "Ask for a concrete commitment, preorder, paid pilot, or other real buying signal where appropriate." },
];

export default async function ValidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: selectedOpportunity } = await supabase.from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score,status")
    .eq("project_id", id).eq("status", "selected").maybeSingle();

  const { data: topOpportunity } = selectedOpportunity ? { data: null } : await supabase.from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score,status")
    .eq("project_id", id).order("opportunity_score", { ascending: false }).limit(1).maybeSingle();

  const opportunity = selectedOpportunity ?? topOpportunity;

  const { data: report } = opportunity ? await supabase.from("validation_reports")
    .select("id,decision,confidence_score,strengths,risks,disproof_findings,evidence_summary,recommended_changes")
    .eq("project_id", id).eq("opportunity_id", opportunity.id).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };

  const typedOpportunity = opportunity as Opportunity | null;
  const typedReport = report as Report | null;
  const checks = typedOpportunity ? [
    ["Market demand", typedOpportunity.demand_score], ["Problem severity", typedOpportunity.problem_intensity_score], ["Competition gap", typedOpportunity.competition_gap_score], ["Monetization signal", typedOpportunity.monetization_score], ["Specificity", typedOpportunity.specificity_score], ["Buildability", typedOpportunity.buildability_score],
  ] as const : [];

  return (
    <StageShell projectId={id} projectName={project.name} active="Validate">
      <div className="pt-8 pb-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="pf-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">03 · Validation</p>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Pressure-test the opportunity.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#73736d]">Research tells us where the signal is. Validation asks whether real people confirm the problem, the promise, the alternatives and the buying case.</p>
          </div>
          {typedOpportunity && <ValidationButton projectId={id} opportunityId={typedOpportunity.id} />}
        </div>

        {!typedOpportunity ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="pf-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Validation locked</p>
            <h2 className="mt-3 text-2xl font-semibold">Research is required before validation.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">Run the research stage and select an opportunity before creating a validation decision.</p>
            <Link href={`/projects/${id}`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Back to research →</Link>
          </section>
        ) : (
          <>
            <section className="mt-8 overflow-hidden rounded-[32px] border border-[#deded7] bg-white">
              <div className="grid lg:grid-cols-[1.1fr_.9fr]">
                <div className="p-7 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pf-mono rounded-full bg-[#eef5cf] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#596b00]">{typedOpportunity.status === "selected" ? "Selected opportunity" : "Current leader"}</span>
                    <span className="pf-mono rounded-full bg-[#f5f5f1] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#77776f]">{score(typedOpportunity.confidence_score)}% research confidence</span>
                  </div>
                  <h2 className="pf-display mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl">{typedOpportunity.title}</h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e5e57]">{typedOpportunity.problem || "No problem statement recorded."}</p>
                  <div className="mt-6 rounded-2xl bg-[#f5f5f1] p-5">
                    <p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#999991]">Proposed product</p>
                    <p className="mt-2 text-sm leading-6 text-[#4f4f49]">{typedOpportunity.proposed_product || "No product direction recorded."}</p>
                  </div>
                </div>
                <div className="bg-[#171714] p-7 text-white sm:p-8">
                  <p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-white/40">Validation thesis</p>
                  <p className="mt-3 text-2xl font-semibold leading-tight">Can this specific audience recognize the problem and choose this specific solution?</p>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Opportunity</p><p className="mt-2 text-2xl font-semibold text-[#d9f06a]">{score(typedOpportunity.opportunity_score)}</p></div>
                    <div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Confidence</p><p className="mt-2 text-2xl font-semibold">{score(typedOpportunity.confidence_score)}%</p></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-[30px] border border-[#deded7] bg-white p-7 sm:p-8">
                <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">What must be true</p>
                <h2 className="mt-2 text-2xl font-semibold">Four assumptions to pressure-test.</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {assumptions.map((item) => <div key={item.number} className="rounded-2xl border border-[#e4e4dd] bg-[#fafaf7] p-5"><span className="pf-mono text-[9px] font-bold text-[#999991]">{item.number}</span><h3 className="mt-5 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-[#73736d]">{item.body}</p></div>)}
                </div>
              </div>
              <div className="rounded-[30px] bg-[#ecece6] p-7 sm:p-8">
                <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Research baseline</p>
                <h2 className="mt-2 text-2xl font-semibold">Where the current signal stands.</h2>
                <div className="mt-6 space-y-4">
                  {checks.map(([label, value]) => { const numeric = score(value); return <div key={label}><div className="flex justify-between text-xs"><span className="text-[#73736d]">{label}</span><span className="font-semibold">{numeric}/100</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${numeric}%` }} /></div></div>; })}
                </div>
                <p className="mt-6 rounded-2xl bg-white/70 p-4 text-xs leading-5 text-[#73736d]">These scores identify assumptions to test. They are not proof of customer demand or revenue.</p>
              </div>
            </section>

            <section className="mt-5 rounded-[30px] border border-[#deded7] bg-white p-7 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Validation experiments</p><h2 className="mt-2 text-2xl font-semibold">Collect behavior, not just opinions.</h2></div><span className="rounded-full bg-[#fff1b8] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#6b5b00]">Directional framework</span></div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {experiments.map((experiment, index) => <div key={experiment.label} className="group rounded-2xl border border-[#e4e4dd] p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#171714] text-[9px] font-bold text-[#d9f06a]">0{index + 1}</span><div><h3 className="text-sm font-semibold">{experiment.label}</h3><p className="mt-2 text-xs leading-5 text-[#73736d]">{experiment.threshold}</p></div></div></div>)}
              </div>
            </section>

            {typedReport ? (
              <section className="mt-5 space-y-5">
                <div className="overflow-hidden rounded-[32px] border border-[#deded7] bg-white">
                  <div className="flex flex-col justify-between gap-5 p-7 sm:p-8 md:flex-row md:items-center"><div><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Validation decision</p><h2 className="pf-display mt-2 text-3xl font-semibold sm:text-4xl">{decisionLabel(typedReport.decision)}</h2><p className="mt-3 text-sm text-[#73736d]">Confidence in the underlying research: {score(typedReport.confidence_score)}/100</p></div><span className={`w-fit rounded-full px-4 py-2 text-sm font-bold capitalize ${decisionClass(typedReport.decision)}`}>{typedReport.decision ?? "pending"}</span></div>
                  <div className="border-t border-[#ededed] bg-[#f7f7f3] p-7 sm:p-8"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#999991]">Decision basis</p><p className="mt-3 max-w-4xl text-sm leading-7 text-[#565650]">{typedReport.evidence_summary}</p></div>
                </div>
                <div className="grid gap-5 lg:grid-cols-3"><div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Supporting evidence</p><h3 className="mb-5 mt-2 text-xl font-semibold">What looks strong</h3><List items={typedReport.strengths ?? []} empty="No strengths recorded." /></div><div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Uncertainty</p><h3 className="mb-5 mt-2 text-xl font-semibold">What could go wrong</h3><List items={typedReport.risks ?? []} empty="No major risks recorded." /></div><div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Disproof tests</p><h3 className="mb-5 mt-2 text-xl font-semibold">What would change our mind</h3><List items={typedReport.disproof_findings ?? []} empty="No disproof tests recorded." /></div></div>
                <div className="rounded-[30px] bg-[#d9f06a] p-7 sm:p-8"><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#58620e]">Recommended next move</p><h3 className="mt-2 text-2xl font-semibold text-[#171714]">{typedReport.decision === "refine" ? "Test the weakest assumption before you build." : typedReport.decision === "proceed" ? "Build the smallest useful version." : "Do not build this version yet."}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-[#41431f]">{typedReport.recommended_changes}</p><div className="mt-6 flex flex-wrap gap-3">{typedReport.decision === "refine" ? <Link href={`/projects/${id}/refine`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open refinement lab →</Link> : typedReport.decision === "proceed" ? <Link href={`/projects/${id}/build`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product builder →</Link> : null}<ValidationButton projectId={id} opportunityId={typedOpportunity.id} /><Link href={`/projects/${id}/opportunity`} className="rounded-full border border-[#171714]/20 px-5 py-3 text-sm font-semibold text-[#171714]">Review opportunity</Link></div></div>
              </section>
            ) : (
              <section className="mt-5 overflow-hidden rounded-[32px] bg-[#171714] p-7 text-white sm:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div><p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Ready to validate</p><h2 className="pf-display mt-2 text-3xl font-semibold sm:text-4xl">Turn the research into a decision.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Generate a deterministic validation report from this exact selected opportunity. No additional AI generation call is required.</p></div><div className="shrink-0"><ValidationButton projectId={id} opportunityId={typedOpportunity.id} /></div></div>
                <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[.05] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Input</p><p className="mt-2 text-sm font-semibold">Selected opportunity</p></div><div className="rounded-2xl bg-white/[.05] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Method</p><p className="mt-2 text-sm font-semibold">Evidence + six signals</p></div><div className="rounded-2xl bg-white/[.05] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Output</p><p className="mt-2 text-sm font-semibold">Proceed · Refine · Abandon</p></div></div>
              </section>
            )}
          </>
        )}
      </div>
    </StageShell>
  );
}

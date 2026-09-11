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

function score(value: number | null) {
  return Math.round(Number(value ?? 0));
}

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
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-[#565650]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#171714]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ValidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id,name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!project) notFound();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score")
    .eq("project_id", id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: report } = opportunity
    ? await supabase
        .from("validation_reports")
        .select("id,decision,confidence_score,strengths,risks,disproof_findings,evidence_summary,recommended_changes")
        .eq("project_id", id)
        .eq("opportunity_id", opportunity.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const typedOpportunity = opportunity as Opportunity | null;
  const typedReport = report as Report | null;
  const checks = typedOpportunity
    ? [
        ["Market demand", typedOpportunity.demand_score],
        ["Problem severity", typedOpportunity.problem_intensity_score],
        ["Competition gap", typedOpportunity.competition_gap_score],
        ["Monetization signal", typedOpportunity.monetization_score],
        ["Specificity", typedOpportunity.specificity_score],
        ["Buildability", typedOpportunity.buildability_score],
      ] as const
    : [];

  return (
    <StageShell projectId={id} projectName={project.name} active="Validate">
      <div className="pt-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">03 · Validation</p>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Pressure-test the opportunity.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">
              Turn the strongest research signals into a decision framework. ProductForge highlights what supports the idea, what is weak, and what could disprove it.
            </p>
          </div>
          {!typedReport && typedOpportunity && <ValidationButton projectId={id} />}
        </div>

        {!typedOpportunity ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">Research is required before validation.</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">Run the research stage first so validation is grounded in actual market evidence.</p>
            <Link href={`/projects/${id}`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Back to research →</Link>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-[30px] border border-[#deded7] bg-white p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Leading opportunity</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#171714]">{typedOpportunity.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">{typedOpportunity.problem || "No problem statement recorded."}</p>
                  </div>
                  <div className="rounded-2xl bg-[#171714] px-5 py-4 text-white">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/45">Opportunity</p>
                    <p className="mt-1 text-3xl font-semibold">{score(typedOpportunity.opportunity_score)}</p>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  {checks.map(([label, value]) => {
                    const numeric = score(value);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{numeric}/100</span></div>
                        <div className="mt-2 h-2 rounded-full bg-[#ecece6]"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${numeric}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[30px] bg-[#171714] p-7 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Validation principle</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight">A strong score is a starting point, not proof.</h2>
                <p className="mt-5 text-sm leading-7 text-white/60">The next question is whether real people recognize the problem, want the promised outcome, and would choose this solution over alternatives.</p>
                <div className="mt-7 space-y-3">
                  {["Talk to the target audience", "Test the core promise", "Compare alternatives", "Confirm willingness to pay", "Define the smallest useful product"].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm"><span className="text-[#d9f06a]">□</span><span className="text-white/70">{item}</span></div>
                  ))}
                </div>
              </div>
            </section>

            {typedReport ? (
              <section className="mt-5 space-y-5">
                <div className="rounded-[30px] border border-[#deded7] bg-white p-7">
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Validation decision</p>
                      <h2 className="mt-2 text-3xl font-semibold">{decisionLabel(typedReport.decision)}</h2>
                      <p className="mt-2 text-sm text-[#73736d]">Confidence in the underlying research: {score(typedReport.confidence_score)}/100</p>
                    </div>
                    <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold capitalize ${decisionClass(typedReport.decision)}`}>{typedReport.decision ?? "pending"}</span>
                  </div>
                  <p className="mt-6 rounded-2xl bg-[#f6f6f1] p-5 text-sm leading-7 text-[#565650]">{typedReport.evidence_summary}</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Supporting evidence</p><h3 className="mb-5 mt-2 text-xl font-semibold">What looks strong</h3><List items={typedReport.strengths ?? []} empty="No strengths recorded." /></div>
                  <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Uncertainty</p><h3 className="mb-5 mt-2 text-xl font-semibold">What could go wrong</h3><List items={typedReport.risks ?? []} empty="No major risks recorded." /></div>
                  <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Disproof tests</p><h3 className="mb-5 mt-2 text-xl font-semibold">What would change our mind</h3><List items={typedReport.disproof_findings ?? []} empty="No disproof tests recorded." /></div>
                </div>

                <div className="rounded-[30px] bg-[#d9f06a] p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#58620e]">Recommended next move</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#171714]">Before you build, test the weakest assumption.</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#41431f]">{typedReport.recommended_changes}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/projects/${id}/build`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product plan →</Link>
                    <Link href={`/projects/${id}`} className="rounded-full border border-[#171714]/20 px-5 py-3 text-sm font-semibold text-[#171714]">Review research</Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mt-5 rounded-[30px] border border-dashed border-[#cfcfc6] bg-[#fafaf7] p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Ready to validate</p>
                <h2 className="mt-2 text-2xl font-semibold">Generate the evidence-based decision report.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">This step uses the existing research and scores; it does not require another AI generation call.</p>
                <div className="mt-5"><ValidationButton projectId={id} /></div>
              </section>
            )}
          </>
        )}
      </div>
    </StageShell>
  );
}

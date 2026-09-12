import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";
import { CreateRefinementTestButton } from "@/components/create-refinement-test-button";
import { RefinementActions } from "@/components/refinement-actions";

type Report = {
  id: string;
  decision: "proceed" | "refine" | "abandon" | null;
  confidence_score: number | null;
  recommended_changes: string | null;
};

type Test = {
  id: string;
  test_type: string;
  hypothesis: string;
  test_plan: string;
  success_criteria: string;
  status: "planned" | "in_progress" | "passed" | "failed";
  notes: string | null;
  outcome: string | null;
};

function statusLabel(status: Test["status"]) {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Needs another test";
  if (status === "in_progress") return "In progress";
  return "Planned";
}

export default async function RefinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,monetization_score,competition_gap_score")
    .eq("project_id", id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: report } = opportunity
    ? await supabase.from("validation_reports").select("id,decision,confidence_score,recommended_changes").eq("project_id", id).eq("opportunity_id", opportunity.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  if (!opportunity || !report) redirect(`/projects/${id}/validate`);
  const typedReport = report as Report;

  const { data: test } = await supabase.from("validation_tests").select("id,test_type,hypothesis,test_plan,success_criteria,status,notes,outcome").eq("project_id", id).eq("opportunity_id", opportunity.id).eq("validation_report_id", typedReport.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const typedTest = test as Test | null;

  return (
    <StageShell projectId={id} projectName={project.name} active="Validate">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">Refinement lab</p>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Test the assumption before you build.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Validation says this opportunity has promise, but one assumption still needs real-world evidence. Run the smallest useful test before committing to the build.</p>
          </div>
          <span className="rounded-full bg-[#fff1b8] px-4 py-2 text-xs font-bold text-[#5d4b00]">Refinement required</span>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[30px] bg-[#171714] p-7 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Opportunity under test</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">{opportunity.title}</h2>
            <p className="mt-4 text-sm leading-7 text-white/60">{opportunity.problem || "The problem statement from research will be tested with the target audience."}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/[.06] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">Audience</p><p className="mt-1 text-sm font-semibold text-white/85">{opportunity.target_audience || "Research-defined audience"}</p></div>
              <div className="rounded-2xl bg-white/[.06] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">Proposed product</p><p className="mt-1 text-sm font-semibold text-white/85">{opportunity.proposed_product || "Digital product"}</p></div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#deded7] bg-white p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Why refine?</p>
            <h2 className="mt-3 text-2xl font-semibold">The score is promising, but not enough to justify a full build.</h2>
            <p className="mt-4 text-sm leading-7 text-[#73736d]">{typedReport.recommended_changes || "Test the weakest assumption with qualified users before building."}</p>
            <div className="mt-6 rounded-2xl bg-[#f5f5f2] p-4"><p className="text-[10px] uppercase tracking-wider text-[#999991]">Research confidence</p><p className="mt-1 text-2xl font-semibold">{Math.round(Number(typedReport.confidence_score ?? 0))}/100</p></div>
          </div>
        </section>

        {!typedTest ? (
          <section className="mt-5 rounded-[30px] border border-dashed border-[#cfcfc6] bg-[#fafaf7] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Step 1 · Design the test</p>
            <h2 className="mt-2 text-2xl font-semibold">Turn the weakest assumption into a measurable test.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#73736d]">ProductForge will choose a focused test from the current score profile. No AI generation call is required.</p>
            <div className="mt-6"><CreateRefinementTestButton projectId={id} /></div>
          </section>
        ) : (
          <section className="mt-5 rounded-[30px] border border-[#deded7] bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Step 2 · Run and record</p><h2 className="mt-2 text-2xl font-semibold">{typedTest.hypothesis}</h2></div>
              <span className={`rounded-full px-4 py-2 text-xs font-bold ${typedTest.status === "passed" ? "bg-[#d9f06a] text-[#171714]" : typedTest.status === "failed" ? "bg-[#fbe9e7] text-red-700" : "bg-[#f5f5f2] text-[#73736d]"}`}>{statusLabel(typedTest.status)}</span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#f5f5f2] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">Test plan</p><p className="mt-2 text-sm leading-7 text-[#565650]">{typedTest.test_plan}</p></div>
              <div className="rounded-2xl bg-[#f5f5f2] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">Success criteria</p><p className="mt-2 text-sm leading-7 text-[#565650]">{typedTest.success_criteria}</p></div>
            </div>
            {typedTest.status === "passed" ? (
              <div className="mt-6 rounded-2xl bg-[#d9f06a] p-5"><p className="text-sm font-semibold">Refinement passed. The Build stage is now unlocked.</p><Link href={`/projects/${id}/build`} className="mt-4 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product builder →</Link></div>
            ) : (
              <RefinementActions testId={typedTest.id} projectId={id} status={typedTest.status} />
            )}
          </section>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/projects/${id}/validate`} className="rounded-full border border-[#d8d8d0] bg-white px-5 py-3 text-sm font-semibold text-[#171714]">← Back to validation</Link>
          {typedTest?.status === "passed" && <Link href={`/projects/${id}/build`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Continue to build →</Link>}
        </div>
      </div>
    </StageShell>
  );
}

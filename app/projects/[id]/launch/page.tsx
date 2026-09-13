import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LaunchWorkspace } from "@/components/launch-workspace";
import { LaunchLearningWorkspace } from "@/components/launch-learning";
import { StageShell } from "@/components/stage-shell";

type Product = { id: string; name: string; tagline: string | null; promise: string | null };
type LaunchPlan = { id: string; status: string; plan: Record<string, any> };
type Opportunity = { id: string; status: string };
type ValidationReport = { id: string; decision: "proceed" | "refine" | "abandon" | null };

type LaunchDiagnosis = {
  headline: string;
  signal: string;
  bottleneck: string;
  recommendation: string;
  nextExperiment: string;
  metrics: string[];
};

export default async function LaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id,name,tagline,promise")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const typedProduct = product as Product | null;

  // Launch is downstream of validation. Resolve the same selected opportunity
  // used by Build, with a legacy top-score fallback for older projects.
  const { data: selectedOpportunity } = await supabase
    .from("opportunities")
    .select("id,status")
    .eq("project_id", id)
    .eq("status", "selected")
    .limit(1)
    .maybeSingle();

  const { data: fallbackOpportunity } = !selectedOpportunity
    ? await supabase
        .from("opportunities")
        .select("id,status")
        .eq("project_id", id)
        .order("opportunity_score", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const opportunity = (selectedOpportunity ?? fallbackOpportunity) as Opportunity | null;
  let validationReport: ValidationReport | null = null;
  let refinementPassed = false;

  if (opportunity?.id) {
    const { data: report } = await supabase
      .from("validation_reports")
      .select("id,decision")
      .eq("project_id", id)
      .eq("opportunity_id", opportunity.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    validationReport = report as ValidationReport | null;

    if (validationReport?.decision === "refine") {
      const { data: refinementTest } = await supabase
        .from("validation_tests")
        .select("id,status")
        .eq("project_id", id)
        .eq("opportunity_id", opportunity.id)
        .eq("validation_report_id", validationReport.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      refinementPassed = refinementTest?.status === "passed";
    }
  }

  const validationReady = validationReport?.decision === "proceed"
    || (validationReport?.decision === "refine" && refinementPassed);

  const { data: launchPlan } = await supabase
    .from("launch_plans")
    .select("id,status,plan")
    .eq("project_id", id)
    .maybeSingle();

  // Always reconcile the displayed evidence with the latest completed
  // research run. This prevents a previously generated launch plan from
  // showing stale "0 evidence" even when research has since completed.
  let reconciledPlan = launchPlan as LaunchPlan | null;
  if (reconciledPlan) {
    const { data: latestRun } = await supabase
      .from("research_runs")
      .select("id")
      .eq("project_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun?.id) {
      const { count: evidenceCount } = await supabase
        .from("research_evidence")
        .select("id", { count: "exact", head: true })
        .eq("research_run_id", latestRun.id);

      const { data: domainRows } = await supabase
        .from("research_evidence")
        .select("source_domain")
        .eq("research_run_id", latestRun.id)
        .not("source_domain", "is", null);

      const sourceDomains = Array.from(new Set((domainRows ?? []).map((row) => row.source_domain).filter(Boolean))) as string[];
      const liveCount = evidenceCount ?? 0;

      reconciledPlan = {
        ...reconciledPlan,
        plan: {
          ...reconciledPlan.plan,
          evidence: {
            ...(reconciledPlan.plan?.evidence ?? {}),
            evidenceCount: liveCount,
            sourceDomains,
            note: liveCount
              ? `Launch recommendations are grounded in ${liveCount} research evidence item${liveCount === 1 ? "" : "s"}${sourceDomains.length ? ` across ${sourceDomains.length} source domain${sourceDomains.length === 1 ? "" : "s"}` : ""}.`
              : "No completed research evidence was available, so this plan should be treated as a starting hypothesis.",
          },
        },
      };
    }
  }

  const initialLearning = reconciledPlan?.plan?.launchLearning ?? null;
  const initialDiagnosis = (reconciledPlan?.plan?.launchDiagnosis ?? null) as LaunchDiagnosis | null;

  return (
    <StageShell projectId={id} projectName={project.name} active="Launch">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">05 · Launch advisor</p>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Take the product to market.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Turn the validated opportunity and finished product into a focused launch hypothesis, channel plan, offer, checklist, and learning loop.</p>
          </div>
          <span className="rounded-full bg-[#dff77a] px-4 py-2 text-xs font-bold text-[#171714]">{reconciledPlan && validationReady ? "Launch plan ready" : "Validation required"}</span>
        </div>

        {!typedProduct ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">A product blueprint is required before launch planning.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Complete validation and create the product blueprint first. The launch advisor should work from a real product rather than an unvalidated idea.</p>
            <Link href={`/projects/${id}/build`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product builder →</Link>
          </section>
        ) : !validationReady ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">Validation must pass before launch planning.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">
              Launch strategy must be grounded in a validated opportunity. Generate the validation report first; if the decision is Refine, complete the required refinement test before returning here.
            </p>
            <Link href={`/projects/${id}/validate`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open validation →</Link>
          </section>
        ) : (
          <>
            <LaunchWorkspace projectId={id} product={typedProduct} initialPlan={reconciledPlan} />
            {reconciledPlan && (
              <div className="mt-5">
                <LaunchLearningWorkspace projectId={id} initialLearning={initialLearning} initialDiagnosis={initialDiagnosis} />
              </div>
            )}
          </>
        )}
      </div>
    </StageShell>
  );
}

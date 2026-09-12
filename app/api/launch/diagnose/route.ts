import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type LaunchLearning = {
  qualifiedReached?: string;
  salesPageVisits?: string;
  interested?: string;
  purchases?: string;
  objections?: string;
  positiveSignals?: string;
  userOutcomes?: string;
  learning?: string;
  decision?: string;
  nextAction?: string;
};

type Diagnosis = {
  headline: string;
  signal: string;
  bottleneck: string;
  recommendation: string;
  nextExperiment: string;
  metrics: string[];
};

function numberFrom(value: string | undefined) {
  if (!value?.trim()) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function diagnose(input: LaunchLearning): Diagnosis {
  const reached = numberFrom(input.qualifiedReached);
  const visits = numberFrom(input.salesPageVisits);
  const interested = numberFrom(input.interested);
  const responses = numberFrom(input.purchases);

  const metrics: string[] = [];
  if (reached != null && visits != null && reached > 0) {
    metrics.push(`Sales-page reach rate: ${Math.round((visits / reached) * 100)}%`);
  }
  if (visits != null && interested != null && visits > 0) {
    metrics.push(`Interest rate from sales-page visits: ${Math.round((interested / visits) * 100)}%`);
  }
  if (interested != null && responses != null && interested > 0) {
    metrics.push(`Response-to-interest rate: ${Math.round((responses / interested) * 100)}%`);
  }

  let signal = "The current launch log contains qualitative evidence, but not enough numeric data to identify a reliable funnel pattern.";
  let bottleneck = "Evidence gap";
  let recommendation = "Keep recording real audience responses before making a major product or channel change. Separate what was observed from what you think caused it.";
  let nextExperiment = "Run one small, controlled launch test and record qualified reach, page visits, interest, objections, and concrete commitments separately.";

  if (reached != null && visits != null && reached > 0 && visits / reached < 0.2) {
    signal = "People were reached, but relatively few moved to the sales page.";
    bottleneck = "Reach-to-offer transition";
    recommendation = "Investigate whether the audience understands the problem and offer strongly enough to take the next step. Improve the message or call to action before changing the product.";
    nextExperiment = "Test two problem-led messages with the same audience and compare the proportion that moves from qualified reach to the offer page.";
  } else if (visits != null && interested != null && visits > 0 && interested / visits < 0.2) {
    signal = "The offer is receiving attention, but relatively little recorded interest is following the page visit.";
    bottleneck = "Offer clarity or positioning";
    recommendation = "Clarify the specific problem, promised outcome, product scope, and proof. Treat low interest as a positioning signal rather than immediately rebuilding the product.";
    nextExperiment = "Create a clearer outcome-led offer and sample, then compare qualified interest against the current version.";
  } else if (interested != null && responses != null && interested > 0 && responses / interested < 0.1) {
    signal = "Interest is being recorded, but few interested people are taking the concrete next step.";
    bottleneck = "Offer, price, or trust";
    recommendation = "Review objections, perceived value, proof, scope, and the price hypothesis. Do not assume price is the cause unless the recorded evidence supports it.";
    nextExperiment = "Keep the product constant and test one change to the offer or price hypothesis with a comparable audience segment.";
  } else if (responses != null && responses > 0) {
    signal = "The launch log contains a concrete response signal.";
    bottleneck = "What happens after the first response";
    recommendation = "Study who responded, why they responded, whether they used the product, and what outcome they experienced before scaling acquisition.";
    nextExperiment = "Repeat the strongest-performing launch path with a small comparable group and measure whether the response repeats.";
  }

  if (hasText(input.objections) && !hasText(input.positiveSignals)) {
    bottleneck = "Objections need investigation";
    recommendation = "Cluster the objections into themes and address the most repeated one first. Avoid changing several parts of the offer at once.";
    nextExperiment = "Test one response to the most common objection with a small group and record whether the objection changes.";
  }

  if (input.decision === "change_channel") {
    bottleneck = "Channel fit";
    recommendation = "Treat reach as the working hypothesis. Test a channel where the target audience already discusses the validated problem, while keeping the offer stable enough to compare results.";
    nextExperiment = "Run the same offer in one new audience space and compare qualified reach, interest, and concrete response with the previous channel.";
  } else if (input.decision === "improve_offer") {
    bottleneck = "Offer improvement";
    recommendation = "Use the recorded objections and positive signals to change one part of the positioning, proof, scope, or price hypothesis at a time.";
    nextExperiment = "Test one revised offer against the previous version and record the difference in qualified interest and concrete commitments.";
  } else if (input.decision === "refine_product") {
    bottleneck = "Product experience";
    recommendation = "Use observed user outcomes and friction to identify the smallest product change that could improve the validated outcome.";
    nextExperiment = "Make one focused product improvement, give it to a small comparable group, and record the resulting outcome and completion behavior.";
  } else if (input.decision === "pause") {
    bottleneck = "Insufficient evidence to continue";
    recommendation = "Pause further build or acquisition work until the evidence explains whether the problem, audience, offer, or channel is the weak point.";
    nextExperiment = "Run a small diagnostic conversation or response test aimed at the specific uncertainty before investing more effort.";
  }

  if (hasText(input.userOutcomes) && hasText(input.positiveSignals)) {
    signal += " Qualitative signals and observed outcomes have also been recorded, which should guide the next test.";
  }

  return { headline: "Launch diagnosis", signal, bottleneck, recommendation, nextExperiment, metrics };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string; launchLearning?: LaunchLearning } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!body.launchLearning || typeof body.launchLearning !== "object") {
    return NextResponse.json({ error: "launchLearning is required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const diagnosis = diagnose(body.launchLearning);

  const { data: launchPlan, error: planError } = await supabase
    .from("launch_plans")
    .select("id,plan")
    .eq("project_id", project.id)
    .maybeSingle();

  if (planError) return NextResponse.json({ error: `Unable to load launch plan: ${planError.message}` }, { status: 500 });
  if (!launchPlan) return NextResponse.json({ error: "Launch plan not found" }, { status: 404 });

  const currentPlan = (launchPlan.plan ?? {}) as Record<string, unknown>;
  const updatedPlan = { ...currentPlan, launchDiagnosis: diagnosis };

  const { data, error } = await supabase
    .from("launch_plans")
    .update({ plan: updatedPlan })
    .eq("id", launchPlan.id)
    .select("id,plan,status")
    .single();

  if (error || !data) return NextResponse.json({ error: `Unable to save launch diagnosis: ${error?.message ?? "Unknown error"}` }, { status: 500 });

  return NextResponse.json({ diagnosis, plan: data.plan, status: data.status });
}

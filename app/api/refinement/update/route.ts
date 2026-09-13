import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateSignal(testType: string, sample: number, confirmations: number, positives: number, commitments: number, negatives: number) {
  const sampleScore = sample >= (testType === "willingness_to_pay" ? 5 : 3) ? 20 : (sample / (testType === "willingness_to_pay" ? 5 : 3)) * 20;
  const confirmationScore = sample ? (confirmations / sample) * 30 : 0;
  const positiveScore = sample ? (positives / sample) * (testType === "willingness_to_pay" ? 15 : 25) : 0;
  const commitmentScore = sample ? (commitments / sample) * (testType === "willingness_to_pay" ? 35 : 25) : 0;
  const negativePenalty = sample ? Math.min(15, (negatives / sample) * 15) : 0;
  const score = clamp(sampleScore + confirmationScore + positiveScore + commitmentScore - negativePenalty);
  const thresholdMet = testType === "willingness_to_pay"
    ? sample >= 5 && confirmations >= 3 && commitments >= 2
    : sample >= 3 && confirmations >= 2 && positives >= 2;
  const summary = thresholdMet
    ? `Strong enough signal for this test: ${confirmations}/${sample} confirmed the problem and ${commitments}/${sample} produced a concrete commitment or switch signal.`
    : `The current evidence is not yet strong enough: ${confirmations}/${sample || 0} confirmed the problem and ${commitments}/${sample || 0} produced a concrete commitment or switch signal.`;
  return { score, thresholdMet, summary };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    testId?: string; projectId?: string; status?: "in_progress" | "passed" | "failed";
    notes?: string; outcome?: string; sampleSize?: number | null; problemConfirmations?: number | null;
    positiveSignals?: number | null; commitmentSignals?: number | null; negativeSignals?: number | null;
  } | null;
  if (!body?.testId || !body.projectId || !body.status) return NextResponse.json({ error: "testId, projectId and status are required" }, { status: 400 });

  const { data: project } = await supabase.from("projects").select("id").eq("id", body.projectId).eq("user_id", user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: test } = await supabase.from("validation_tests").select("id,project_id,test_type,status").eq("id", body.testId).eq("project_id", body.projectId).single();
  if (!test) return NextResponse.json({ error: "Validation test not found" }, { status: 404 });

  const sample = Number(body.sampleSize ?? 0);
  const confirmations = Number(body.problemConfirmations ?? 0);
  const positives = Number(body.positiveSignals ?? 0);
  const commitments = Number(body.commitmentSignals ?? 0);
  const negatives = Number(body.negativeSignals ?? 0);
  if ([sample, confirmations, positives, commitments, negatives].some((value) => !Number.isFinite(value) || value < 0)) return NextResponse.json({ error: "Evidence counts must be non-negative numbers." }, { status: 400 });
  if ([confirmations, positives, commitments, negatives].some((value) => value > sample)) return NextResponse.json({ error: "Evidence counts cannot exceed the number of people tested." }, { status: 400 });

  let nextStatus = body.status;
  let validationScore: number | null = null;
  let signalSummary: string | null = null;
  let failedThreshold = false;

  if (body.status === "passed") {
    if (!body.notes?.trim() || !body.outcome?.trim()) return NextResponse.json({ error: "Record what you learned and the outcome before evaluating the evidence." }, { status: 400 });
    if (sample < 1) return NextResponse.json({ error: "Enter the number of people tested before evaluating the evidence." }, { status: 400 });
    const signal = calculateSignal(test.test_type, sample, confirmations, positives, commitments, negatives);
    validationScore = signal.score;
    signalSummary = signal.summary;
    if (!signal.thresholdMet) {
      nextStatus = "failed";
      failedThreshold = true;
    }
  }

  const { data: updated, error } = await supabase.from("validation_tests").update({
    status: nextStatus,
    notes: body.notes?.trim() || null,
    outcome: body.outcome?.trim() || null,
    sample_size: sample || null,
    problem_confirmations: confirmations || null,
    positive_signals: positives || null,
    commitment_signals: commitments || null,
    negative_signals: negatives || null,
    validation_score: validationScore,
    signal_summary: signalSummary,
  }).eq("id", body.testId).select("id,status,test_type,validation_score,signal_summary").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (nextStatus === "passed") {
    await supabase.from("projects").update({ current_stage: 4, status: "building" }).eq("id", body.projectId).eq("user_id", user.id);
  }

  if (failedThreshold) return NextResponse.json({ error: `${signalSummary} The test has been recorded as needing another iteration rather than unlocking Build.`, test: updated }, { status: 422 });
  return NextResponse.json({ test: updated });
}

"use client";

import { useState } from "react";

export function RefinementActions({
  testId,
  projectId,
  status,
  testType,
  initialNotes = "",
  initialOutcome = "",
  initialSampleSize = null,
  initialProblemConfirmations = null,
  initialPositiveSignals = null,
  initialCommitmentSignals = null,
  initialNegativeSignals = null,
  initialValidationScore = null,
  initialSignalSummary = "",
}: {
  testId: string;
  projectId: string;
  status: string;
  testType: string;
  initialNotes?: string;
  initialOutcome?: string;
  initialSampleSize?: number | null;
  initialProblemConfirmations?: number | null;
  initialPositiveSignals?: number | null;
  initialCommitmentSignals?: number | null;
  initialNegativeSignals?: number | null;
  initialValidationScore?: number | null;
  initialSignalSummary?: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [outcome, setOutcome] = useState(initialOutcome);
  const [sampleSize, setSampleSize] = useState(initialSampleSize?.toString() ?? "");
  const [problemConfirmations, setProblemConfirmations] = useState(initialProblemConfirmations?.toString() ?? "");
  const [positiveSignals, setPositiveSignals] = useState(initialPositiveSignals?.toString() ?? "");
  const [commitmentSignals, setCommitmentSignals] = useState(initialCommitmentSignals?.toString() ?? "");
  const [negativeSignals, setNegativeSignals] = useState(initialNegativeSignals?.toString() ?? "");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [signalSummary, setSignalSummary] = useState(initialSignalSummary);
  const [validationScore, setValidationScore] = useState<number | null>(initialValidationScore);
  const isWillingnessToPay = testType === "willingness_to_pay";

  async function updateTest(nextStatus: "in_progress" | "passed" | "failed") {
    const trimmedNotes = notes.trim();
    const trimmedOutcome = outcome.trim();
    const sample = Number(sampleSize);
    const confirmations = Number(problemConfirmations);
    const positives = Number(positiveSignals);
    const commitments = Number(commitmentSignals);
    const negatives = Number(negativeSignals || 0);

    if (nextStatus === "passed") {
      if (!trimmedNotes || !trimmedOutcome) { setMessage("Record what you learned and the outcome before evaluating the evidence."); return; }
      if (!Number.isFinite(sample) || sample < 1 || !Number.isFinite(confirmations) || confirmations < 0 || confirmations > sample) { setMessage("Enter a valid sample size and number of people who confirmed the problem."); return; }
      if (!Number.isFinite(positives) || positives < 0 || positives > sample || !Number.isFinite(commitments) || commitments < 0 || commitments > sample) { setMessage("Enter valid positive-signal and commitment counts."); return; }
    }
    if (nextStatus === "failed" && !trimmedOutcome) { setMessage("Record the test outcome before marking the test as failed."); return; }

    setRunning(true); setMessage("");
    try {
      const response = await fetch("/api/refinement/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, projectId, status: nextStatus, notes: trimmedNotes, outcome: trimmedOutcome, sampleSize: Number.isFinite(sample) ? sample : null, problemConfirmations: Number.isFinite(confirmations) ? confirmations : null, positiveSignals: Number.isFinite(positives) ? positives : null, commitmentSignals: Number.isFinite(commitments) ? commitments : null, negativeSignals: Number.isFinite(negatives) ? negatives : 0 }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.test?.validation_score != null) setValidationScore(Number(data.test.validation_score));
      if (data.test?.signal_summary) setSignalSummary(data.test.signal_summary);
      if (!response.ok) {
        if (data.test?.status === "failed") window.setTimeout(() => window.location.reload(), 700);
        throw new Error(data.error ?? "Could not update the test.");
      }
      setMessage(nextStatus === "passed" ? "Evidence evaluated. Build is now unlocked." : nextStatus === "failed" ? "Test recorded as failed. Use the learning to define the next iteration." : "Test marked in progress.");
      if (nextStatus === "passed") window.location.href = `/projects/${projectId}/build`;
      else window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update the test."); }
    finally { setRunning(false); }
  }

  const inputsLocked = running || status === "passed";
  const canFail = !running && status !== "failed" && status !== "passed";

  return (
    <div className="mt-6 rounded-2xl bg-[#f5f5f2] p-5">
      <div className="mb-5 rounded-2xl border border-[#deded7] bg-white p-4">
        <div className="flex items-start justify-between gap-4"><div><p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">Evidence capture</p><p className="mt-2 text-xs leading-5 text-[#73736d]">Enter counts from the real-world test. ProductForge evaluates the evidence instead of treating a button click as proof.</p></div>{validationScore !== null && <div className="shrink-0 text-right"><p className="pf-mono text-[9px] uppercase tracking-[.14em] text-[#999991]">Signal</p><p className="mt-1 text-2xl font-semibold">{Math.round(validationScore)}/100</p></div>}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <NumberField label="People tested" value={sampleSize} onChange={setSampleSize} disabled={inputsLocked} />
          <NumberField label="Confirmed problem" value={problemConfirmations} onChange={setProblemConfirmations} disabled={inputsLocked} />
          <NumberField label={isWillingnessToPay ? "Buying interest" : "Repeated gap"} value={positiveSignals} onChange={setPositiveSignals} disabled={inputsLocked} />
          <NumberField label={isWillingnessToPay ? "Concrete commitments" : "Switch signals"} value={commitmentSignals} onChange={setCommitmentSignals} disabled={inputsLocked} />
          <NumberField label="Negative signals" value={negativeSignals} onChange={setNegativeSignals} disabled={inputsLocked} />
        </div>
        {signalSummary && <p className="mt-4 rounded-xl bg-[#eef5cf] p-3 text-xs leading-5 text-[#4e5c00]">{signalSummary}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="pf-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">What did you learn?</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={inputsLocked} placeholder="Record interviews, responses, objections, commitments, or other evidence." className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#deded7] bg-white p-3 text-sm text-[#171714] outline-none placeholder:text-[#aaa9a1] focus:border-[#171714] disabled:cursor-not-allowed disabled:bg-[#eeeeea]" /></label>
        <label className="block"><span className="pf-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">Outcome</span><textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} disabled={inputsLocked} placeholder="Summarize the result against the success criteria." className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#deded7] bg-white p-3 text-sm text-[#171714] outline-none placeholder:text-[#aaa9a1] focus:border-[#171714] disabled:cursor-not-allowed disabled:bg-[#eeeeea]" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={inputsLocked} onClick={() => updateTest("in_progress")} className="rounded-full border border-[#d8d8d0] bg-white px-4 py-2 text-xs font-semibold text-[#171714] disabled:cursor-not-allowed disabled:opacity-50">Mark in progress</button><button disabled={inputsLocked} onClick={() => updateTest("passed")} className="rounded-full bg-[#171714] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Evaluate evidence → Unlock build</button><button disabled={!canFail} onClick={() => updateTest("failed")} className="rounded-full border border-[#e3b8b3] bg-white px-4 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Fail / refine again</button></div>
      <p className="mt-3 text-xs leading-5 text-[#73736d]">Build unlocks only after evidence is recorded and the evidence meets the test threshold.</p>
      {message && <p className="mt-2 text-xs font-semibold leading-5 text-[#5d5b55]">{message}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="block"><span className="text-[10px] font-semibold text-[#73736d]">{label}</span><input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-1 w-full rounded-xl border border-[#deded7] bg-[#fafaf7] px-3 py-2 text-sm outline-none focus:border-[#171714] disabled:opacity-60" /></label>;
}

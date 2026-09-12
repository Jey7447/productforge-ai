"use client";

import { useState } from "react";

type LaunchLearning = {
  qualifiedReached: string;
  salesPageVisits: string;
  interested: string;
  purchases: string;
  objections: string;
  positiveSignals: string;
  userOutcomes: string;
  learning: string;
  decision: string;
  nextAction: string;
};

type Diagnosis = {
  headline: string;
  signal: string;
  bottleneck: string;
  recommendation: string;
  nextExperiment: string;
  metrics: string[];
};

type Props = {
  projectId: string;
  initialLearning?: Partial<LaunchLearning> | null;
  initialDiagnosis?: Diagnosis | null;
};

const defaults: LaunchLearning = {
  qualifiedReached: "",
  salesPageVisits: "",
  interested: "",
  purchases: "",
  objections: "",
  positiveSignals: "",
  userOutcomes: "",
  learning: "",
  decision: "",
  nextAction: "",
};

function normalize(value: Partial<LaunchLearning> | null | undefined): LaunchLearning {
  return { ...defaults, ...(value ?? {}) };
}

export function LaunchLearningWorkspace({ projectId, initialLearning, initialDiagnosis }: Props) {
  const [values, setValues] = useState<LaunchLearning>(() => normalize(initialLearning));
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(initialDiagnosis ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof LaunchLearning, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setDiagnosis(null);
    setError("");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/launch/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, launchLearning: values }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error ?? "Could not save launch results.");
        return;
      }

      setValues(normalize(payload.plan?.launchLearning));
      setSaved(true);

      const diagnosisResponse = await fetch("/api/launch/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, launchLearning: values }),
      });
      const diagnosisPayload = await diagnosisResponse.json().catch(() => ({}));

      if (diagnosisResponse.ok && diagnosisPayload.diagnosis) {
        setDiagnosis(diagnosisPayload.diagnosis);
      } else if (!diagnosisResponse.ok) {
        setError(diagnosisPayload.error ?? "Results were saved, but the launch diagnosis could not be generated.");
      }
    } catch {
      setError("Could not save launch results. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[30px] border border-[#deded7] bg-white p-7 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">Launch results · learning loop</p>
          <h2 className="pf-display mt-2 text-3xl font-semibold">What actually happened?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#73736d]">
            Replace launch assumptions with observed audience response. Record what happened, what people said, and what should change next. Leave fields blank until you have real evidence.
          </p>
        </div>
        <span className="pf-mono rounded-full bg-[#f5f5f2] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#73736d]">Evidence log</span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Qualified people reached" value={values.qualifiedReached} onChange={(v) => update("qualifiedReached", v)} />
        <Metric label="Sales-page visits" value={values.salesPageVisits} onChange={(v) => update("salesPageVisits", v)} />
        <Metric label="People interested" value={values.interested} onChange={(v) => update("interested", v)} />
        <Metric label="Purchases / commitments" value={values.purchases} onChange={(v) => update("purchases", v)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Field label="Common objections" hint="What repeatedly made people hesitate, decline, or ask questions?" value={values.objections} onChange={(v) => update("objections", v)} />
        <Field label="Positive signals" hint="What language, reactions, or behaviors suggested genuine interest?" value={values.positiveSignals} onChange={(v) => update("positiveSignals", v)} />
        <Field label="Observed user outcomes" hint="What changed for people who actually used or reviewed the product?" value={values.userOutcomes} onChange={(v) => update("userOutcomes", v)} />
        <Field label="What did you learn?" hint="Summarize the strongest evidence and the assumption it changed." value={values.learning} onChange={(v) => update("learning", v)} />
      </div>

      <div className="mt-6 rounded-[24px] bg-[#171714] p-6 text-white sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#d9f06a]">Next decision</p>
            <h3 className="pf-display mt-2 text-2xl font-semibold">Turn evidence into the next move.</h3>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/55">Do not choose a positive outcome just because the launch was completed. Base the decision on what you actually observed.</p>
          </div>
          <select value={values.decision} onChange={(event) => update("decision", event.target.value)} className="rounded-full border border-white/10 bg-white/[.06] px-4 py-3 text-xs font-semibold text-white outline-none focus:border-[#d9f06a]">
            <option value="" className="text-black">Choose a decision</option>
            <option value="repeat" className="text-black">Repeat — evidence is encouraging</option>
            <option value="improve_offer" className="text-black">Improve offer — positioning or price needs work</option>
            <option value="change_channel" className="text-black">Change channel — reach is the weak point</option>
            <option value="refine_product" className="text-black">Refine product — product feedback is the weak point</option>
            <option value="pause" className="text-black">Pause — evidence does not justify continuing</option>
          </select>
        </div>
        <label className="mt-5 block">
          <span className="pf-mono text-[9px] uppercase tracking-[.16em] text-white/40">Next action</span>
          <textarea value={values.nextAction} onChange={(event) => update("nextAction", event.target.value)} rows={3} placeholder="What will you do next, based on the evidence?" className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#d9f06a]/60" />
        </label>
      </div>

      {diagnosis && <LaunchDiagnosis diagnosis={diagnosis} />}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving results…" : "Save launch results →"}
        </button>
        {saved && <span className="text-xs font-semibold text-[#697500]">Saved to this project.</span>}
        {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
      </div>
    </section>
  );
}

function LaunchDiagnosis({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[24px] border border-[#dfe8a4] bg-[#f0ff86]">
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-6 sm:p-7">
          <p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#697500]">Evidence analysis</p>
          <h3 className="pf-display mt-2 text-2xl font-semibold">{diagnosis.headline}</h3>
          <p className="mt-3 text-sm leading-6 text-[#4f5428]">{diagnosis.signal}</p>
          {diagnosis.metrics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {diagnosis.metrics.map((metric) => <span key={metric} className="rounded-full border border-[#cfdc72] bg-white/35 px-3 py-2 text-[11px] font-semibold text-[#555a2a]">{metric}</span>)}
            </div>
          )}
        </div>
        <div className="bg-white/45 p-6 sm:p-7">
          <div>
            <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#8a8a82]">Working bottleneck</p>
            <p className="mt-1 text-lg font-semibold">{diagnosis.bottleneck}</p>
          </div>
          <div className="mt-5">
            <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#8a8a82]">Recommended next move</p>
            <p className="mt-1 text-sm leading-6 text-[#4f5428]">{diagnosis.recommendation}</p>
          </div>
          <div className="mt-5 rounded-2xl bg-[#171714] p-4 text-white">
            <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#d9f06a]">Next experiment</p>
            <p className="mt-1 text-sm leading-6 text-white/75">{diagnosis.nextExperiment}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[#cfdc72] px-6 py-3 text-[10px] leading-5 text-[#697500] sm:px-7">
        This is a directional diagnosis from the evidence you recorded. It is a hypothesis for the next test, not proof of causation or future results.
      </div>
    </div>
  );
}

function Metric({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-2xl bg-[#f5f5f2] p-4">
      <span className="pf-mono block text-[9px] uppercase tracking-[.14em] text-[#8a8a82]">{label}</span>
      <input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} placeholder="—" className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-[#c7c7c0]" />
    </label>
  );
}

function Field({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-2xl border border-[#e5e5de] bg-[#fafaf8] p-5">
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-[#8a8a82]">{hint}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-4 w-full resize-y rounded-xl border border-[#e1e1da] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#b8c63e]" />
    </label>
  );
}

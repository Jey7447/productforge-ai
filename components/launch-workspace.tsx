"use client";

import Link from "next/link";
import { useState } from "react";

type Product = { id: string; name: string; tagline: string | null; promise: string | null };
type LaunchPlan = { id: string; status: string; plan: Record<string, any> };

function LaunchSignalVisual({ evidenceCount }: { evidenceCount: number }) {
  return (
    <div className="pf-scan-panel relative mt-7 overflow-hidden rounded-[24px] border border-white/10 bg-white/[.035] p-4 sm:p-5">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="relative flex items-center justify-between gap-4">
        <div><p className="pf-mono text-[9px] uppercase tracking-[.16em] text-white/35">Launch signal map</p><p className="mt-1 text-xs font-semibold text-white/75">Evidence → audience → offer → response</p></div>
        <span className="pf-mono rounded-full border border-white/10 px-2 py-1 text-[9px] text-[#d9f06a]">{evidenceCount} signals</span>
      </div>
      <div className="relative mt-4 h-[126px] overflow-hidden rounded-2xl border border-white/10 bg-black/10">
        <svg viewBox="0 0 520 126" className="h-full w-full" fill="none" aria-hidden="true" preserveAspectRatio="none">
          <path d="M22 91C94 91 102 39 174 39S252 89 322 89 402 25 498 25" stroke="rgba(217,240,106,.72)" strokeWidth="1.5" strokeDasharray="4 6" />
          <path d="M22 90L174 39L322 89L498 25" stroke="rgba(255,255,255,.16)" strokeWidth="1" />
          <circle cx="22" cy="91" r="5" fill="#d9f06a" /><circle cx="174" cy="39" r="5" fill="#fff" /><circle cx="322" cy="89" r="5" fill="#d9f06a" /><circle cx="498" cy="25" r="6" fill="#fff" />
          <circle cx="22" cy="91" r="12" stroke="rgba(217,240,106,.25)" className="pf-pulse" /><circle cx="322" cy="89" r="13" stroke="rgba(217,240,106,.22)" className="pf-pulse" />
          <g opacity=".5"><path d="M92 110V98M106 110V84M120 110V94M386 110V92M400 110V75M414 110V88M428 110V68" stroke="rgba(255,255,255,.28)" strokeWidth="2" strokeLinecap="round" /></g>
        </svg>
        <div className="pf-mono absolute bottom-2 left-3 text-[8px] text-white/30">RESEARCH</div><div className="pf-mono absolute bottom-2 left-[31%] text-[8px] text-white/30">AUDIENCE</div><div className="pf-mono absolute bottom-2 left-[58%] text-[8px] text-white/30">OFFER</div><div className="pf-mono absolute right-3 top-2 text-[8px] text-white/30">RESPONSE</div>
      </div>
    </div>
  );
}

export function LaunchWorkspace({ projectId, product, initialPlan }: { projectId: string; product: Product; initialPlan: LaunchPlan | null }) {
  const [plan, setPlan] = useState<LaunchPlan | null>(initialPlan);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const items = initialPlan?.plan?.checklist;
    if (!Array.isArray(items)) return {};
    return Object.fromEntries(items.map((item: any, index: number) => [String(index), Boolean(item.done)]));
  });

  async function generatePlan() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/launch/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.error ?? "Could not create the launch plan."); return; }
      setPlan(payload);
      setCompleted(Object.fromEntries((payload.plan?.checklist ?? []).map((item: any, index: number) => [String(index), Boolean(item.done)])));
    } catch { setError("Could not reach the launch advisor. Try again."); } finally { setRunning(false); }
  }

  const data = plan?.plan;
  const checklist = Array.isArray(data?.checklist) ? data.checklist : [];
  const channels = Array.isArray(data?.channels) ? data.channels : [];
  const timeline = Array.isArray(data?.fourteenDayPlan) ? data.fourteenDayPlan : [];
  const metrics = Array.isArray(data?.metrics) ? data.metrics : [];

  if (!plan) {
    return (
      <section className="pf-glow mt-8 overflow-hidden rounded-[32px] border border-[#deded7] bg-white">
        <div className="grid lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-8 sm:p-10"><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">Launch architect</p><h2 className="pf-display mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Build a launch plan from the evidence, not guesswork.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-[#73736d]">ProductForge will connect the validated problem, product promise, audience, research evidence, and pricing hypothesis into a practical first-launch plan.</p><button type="button" onClick={generatePlan} disabled={running} className="mt-7 rounded-full bg-[#171714] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">{running ? "Building launch plan…" : "Build launch plan →"}</button>{error && <p className="mt-3 text-xs leading-5 text-red-600">{error}</p>}</div>
          <aside className="bg-[#171714] p-8 text-white sm:p-10"><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Launch brief</p><h3 className="pf-display mt-3 text-3xl font-semibold">{product.name}</h3><p className="mt-3 text-sm leading-6 text-white/55">{product.tagline || "Evidence-grounded product blueprint"}</p><div className="mt-8 rounded-2xl bg-[#dff77a] p-5 text-[#171714]"><p className="pf-mono text-[10px] font-semibold uppercase tracking-wider text-[#58620e]">Promise</p><p className="mt-2 text-sm font-semibold leading-6">{product.promise || "A practical outcome for the validated audience."}</p></div><div className="mt-3 rounded-2xl bg-white/[.06] p-5"><p className="pf-mono text-[10px] uppercase tracking-wider text-white/40">Next</p><p className="mt-2 text-sm font-semibold">Audience → message → channel → offer → learning loop</p></div></aside>
        </div>
      </section>
    );
  }

  function toggleChecklist(index: number) { setCompleted((current) => ({ ...current, [String(index)]: !current[String(index)] })); }
  const doneCount = checklist.filter((_: any, index: number) => completed[String(index)]).length;
  const evidenceCount = Number(data?.evidence?.evidenceCount ?? 0);

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#deded7] bg-white/75 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3"><span className="pf-pulse h-2 w-2 rounded-full bg-[#9ab100]" /><span className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#73736d]">Launch plan / {evidenceCount} evidence signals</span></div>
        <button type="button" onClick={generatePlan} disabled={running} className="rounded-full border border-[#d5d5cd] bg-white px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-[#bdbdb4] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{running ? "Refreshing…" : "Refresh plan ↻"}</button>
      </div>
      {error && <p className="px-1 text-xs leading-5 text-red-600">{error}</p>}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="pf-glow relative overflow-hidden rounded-[30px] bg-[#171714] p-8 text-white sm:p-9"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/[.05]" /><div className="pf-orbit absolute -right-[104px] -top-[104px] h-72 w-72 rounded-full border border-dashed border-[#d9f06a]/15" /><div className="relative z-10"><div className="flex items-start justify-between gap-6"><div><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Launch thesis</p><h2 className="pf-display mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{data?.positioning?.headline || product.name}</h2></div><span className="pf-mono hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[9px] text-white/45 sm:inline-flex">SIGNAL / 05</span></div><p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">{data?.positioning?.message}</p><LaunchSignalVisual evidenceCount={evidenceCount} /><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[10px] uppercase tracking-wider text-white/35">Audience</p><p className="mt-2 text-xs font-semibold leading-5">{data?.audience?.primary}</p></div><div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[10px] uppercase tracking-wider text-white/35">Format</p><p className="mt-2 text-xs font-semibold leading-5">{data?.launchOffer?.format}</p></div><div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[10px] uppercase tracking-wider text-white/35">Evidence</p><p className="mt-2 text-xs font-semibold leading-5">{evidenceCount} items</p></div></div></div></div>
        <div className="pf-lift rounded-[30px] bg-[#dff77a] p-8 text-[#171714] sm:p-9"><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#58620e]">Price hypothesis</p><p className="pf-display mt-3 text-4xl font-semibold">{data?.pricing?.hypothesis}</p><p className="mt-4 text-sm leading-6 text-[#4d531e]">{data?.pricing?.rule}</p><div className="mt-7 rounded-2xl bg-white/60 p-5"><p className="pf-mono text-[10px] uppercase tracking-wider text-[#73736d]">Evidence note</p><p className="mt-2 text-xs leading-5 text-[#41431f]">{data?.evidence?.note}</p></div><div className="mt-7 flex items-center gap-3 text-xs font-semibold text-[#4d531e]"><span className="pf-pulse h-2 w-2 rounded-full bg-[#171714]" /> Treat this number as a testable hypothesis.</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="pf-card pf-card-hover rounded-[30px] p-7"><div className="flex items-end justify-between gap-4"><div><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">Where to start</p><h2 className="pf-display mt-2 text-2xl font-semibold">First channels</h2></div><span className="pf-mono rounded-full bg-[#f5f5f2] px-3 py-2 text-[10px] font-semibold">{channels.length} channels</span></div><div className="mt-6 space-y-3">{channels.map((channel: any, index: number) => <article key={channel.name} className="group rounded-2xl border border-[#e5e5de] bg-[#fafaf8] p-5 transition hover:-translate-y-0.5 hover:border-[#c9c9c0] hover:shadow-md"><div className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#171714] text-[10px] font-bold text-[#d9f06a] transition group-hover:scale-105">0{index + 1}</span><div><h3 className="text-sm font-semibold">{channel.name}</h3><p className="mt-2 text-xs leading-5 text-[#73736d]">{channel.why}</p><p className="mt-3 text-xs font-semibold leading-5 text-[#41413c]">First move: {channel.firstAction}</p></div></div></article>)}</div></div>
        <div className="pf-card pf-card-hover rounded-[30px] p-7"><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">The offer</p><h2 className="pf-display mt-2 text-2xl font-semibold">Make the value obvious.</h2><p className="mt-3 text-sm leading-6 text-[#73736d]">{data?.launchOffer?.promise}</p><div className="mt-6 space-y-2">{(data?.launchOffer?.assets ?? []).map((asset: string, index: number) => <div key={asset} className="group flex items-start gap-3 rounded-xl bg-[#f5f5f2] p-4 transition hover:bg-[#edf6bf]"><span className="pf-mono mt-0.5 text-xs font-bold text-[#9b9b92]">0{index + 1}</span><span className="text-xs font-semibold leading-5">{asset}</span></div>)}</div><div className="mt-5 rounded-2xl bg-[#171714] p-5 text-white"><p className="pf-mono text-[10px] uppercase tracking-wider text-white/35">Proof rule</p><p className="mt-2 text-xs leading-5 text-white/60">{data?.positioning?.proofRule}</p></div></div>
      </section>

      <section className="pf-card pf-card-hover rounded-[30px] p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">14-day launch sequence</p><h2 className="pf-display mt-2 text-3xl font-semibold">Learn before you scale.</h2></div><span className="rounded-full bg-[#dff77a] px-3 py-2 text-xs font-bold">{timeline.length} phases</span></div><div className="pf-signal-line mt-7" /><div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{timeline.map((item: any, index: number) => <article key={item.days} className="group relative overflow-hidden rounded-2xl bg-[#f5f5f2] p-5 transition hover:-translate-y-1 hover:shadow-md"><span className="absolute right-4 top-4 text-4xl font-bold text-[#e3e3dc] transition group-hover:text-[#d9f06a]">0{index + 1}</span><p className="pf-mono text-[10px] font-bold uppercase tracking-wider text-[#8a8a82]">Days {item.days}</p><h3 className="pf-display mt-2 text-lg font-semibold">{item.focus}</h3><p className="mt-2 max-w-[85%] text-xs leading-6 text-[#73736d]">{item.action}</p></article>)}</div></section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[30px] bg-[#171714] p-7 text-white"><div className="flex items-end justify-between gap-4"><div><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Launch checklist</p><h2 className="pf-display mt-2 text-2xl font-semibold">Ship the first version.</h2></div><span className="pf-mono text-xs font-bold text-[#d9f06a]">{doneCount}/{checklist.length}</span></div><div className="mt-6 space-y-2">{checklist.map((item: any, index: number) => { const done = Boolean(completed[String(index)]); return <button key={item.item} type="button" onClick={() => toggleChecklist(index)} className="group flex w-full items-center gap-3 rounded-xl bg-white/[.06] p-4 text-left transition hover:bg-white/[.1]"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold transition ${done ? "border-[#d9f06a] bg-[#d9f06a] text-[#171714]" : "border-white/20 text-white/30 group-hover:border-[#d9f06a]/60"}`}>{done ? "✓" : index + 1}</span><span className={`text-xs leading-5 ${done ? "text-white/35 line-through" : "text-white/75"}`}>{item.item}</span></button>; })}</div></div><div className="pf-lift rounded-[30px] bg-[#dff77a] p-7 text-[#171714]"><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#58620e]">What to measure</p><h2 className="pf-display mt-2 text-2xl font-semibold">Real response beats vanity metrics.</h2><div className="mt-6 space-y-2">{metrics.map((metric: string, index: number) => <div key={metric} className="flex items-center gap-3 rounded-xl bg-white/55 px-4 py-3 text-xs font-semibold"><span className="pf-mono text-[9px] text-[#7d842f]">0{index + 1}</span>{metric}</div>)}</div></div></section>

      <section className="pf-card rounded-[30px] p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a82]">Next loop</p><h2 className="pf-display mt-2 text-2xl font-semibold">{data?.nextLoop}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">This plan is a launch hypothesis. Replace assumptions with real audience response and keep the evidence attached to the next ProductForge decision.</p></div><Link href={`/projects/${projectId}/build`} className="inline-flex shrink-0 rounded-full border border-[#d5d5cd] px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[#bdbdb4] hover:bg-white">← Product builder</Link></div></section>
    </div>
  );
}

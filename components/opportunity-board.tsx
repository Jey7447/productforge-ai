"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type EvidenceSummary = {
  sources?: Array<{ sourceId?: string; claim?: string }>;
  scoreRationales?: Record<string, string>;
  confidenceBasis?: { sourceCount?: number };
};

type Opportunity = {
  id: string;
  title: string;
  niche: string;
  target_audience: string | null;
  problem: string | null;
  proposed_product: string | null;
  product_type: string | null;
  rationale: string | null;
  opportunity_score: number | null;
  confidence_score: number | null;
  demand_score: number | null;
  problem_intensity_score: number | null;
  competition_gap_score: number | null;
  monetization_score: number | null;
  specificity_score: number | null;
  buildability_score: number | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  evidence_summary: EvidenceSummary | string | null;
  status: string;
};

const dimensions: [string, keyof Opportunity][] = [
  ["Demand", "demand_score"],
  ["Problem", "problem_intensity_score"],
  ["Gap", "competition_gap_score"],
  ["Monetization", "monetization_score"],
  ["Specificity", "specificity_score"],
  ["Buildability", "buildability_score"],
];

function score(value: number | null) {
  return Math.round(Number(value ?? 0));
}

function parseEvidenceSummary(value: EvidenceSummary | string | null | undefined): EvidenceSummary | null {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as EvidenceSummary;
  } catch {
    return null;
  }
}

function tokens(value: string | null | undefined) {
  const stop = new Set([
    "the", "and", "for", "with", "from", "that", "this", "your", "their", "into", "how", "what", "are", "you", "digital", "product", "guide", "tool", "system", "step", "steps",
  ]);
  return new Set(
    (value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stop.has(token)),
  );
}

function similarity(a: Opportunity, b: Opportunity) {
  const left = tokens(`${a.title} ${a.problem ?? ""} ${a.proposed_product ?? ""}`);
  const right = tokens(`${b.title} ${b.problem ?? ""} ${b.proposed_product ?? ""}`);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / Math.max(1, Math.min(left.size, right.size));
}

function evidenceCount(item: Opportunity) {
  const parsed = parseEvidenceSummary(item.evidence_summary);
  return parsed?.confidenceBasis?.sourceCount ?? parsed?.sources?.length ?? 0;
}

function strongestDimension(item: Opportunity) {
  return dimensions.reduce(
    (best, current) => score(item[current[1]] as number | null) > best.value
      ? { label: current[0], value: score(item[current[1]] as number | null) }
      : best,
    { label: "Signal", value: 0 },
  );
}

function weakestDimension(item: Opportunity) {
  return dimensions.reduce(
    (worst, current) => score(item[current[1]] as number | null) < worst.value
      ? { label: current[0], value: score(item[current[1]] as number | null) }
      : worst,
    { label: "Buildability", value: 101 },
  );
}

export function OpportunityBoard({ projectId, opportunities: initial }: { projectId: string; opportunities: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(initial[0]?.id ?? null);

  const duplicateMap = useMemo(() => {
    const map = new Map<string, { index: number; title: string }[]>();
    opportunities.forEach((item, index) => {
      const matches = opportunities
        .map((other, otherIndex) => ({ other, otherIndex, value: similarity(item, other) }))
        .filter(({ otherIndex, value }) => otherIndex !== index && value >= 0.58)
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)
        .map(({ other, otherIndex }) => ({ index: otherIndex + 1, title: other.title }));
      if (matches.length) map.set(item.id, matches);
    });
    return map;
  }, [opportunities]);

  async function act(opportunityId: string, action: "select" | "shortlist") {
    if (busy) return;
    setBusy(`${opportunityId}:${action}`);
    setMessage("");
    try {
      const response = await fetch("/api/opportunity/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, opportunityId, action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not update opportunity.");
      setOpportunities((current) => current.map((item) => {
        if (action === "select") {
          if (item.id === opportunityId) return { ...item, status: "selected" };
          if (item.status === "selected") return { ...item, status: "shortlisted" };
        }
        if (item.id === opportunityId) return { ...item, status: data.status };
        return item;
      }));
      setAnalysisId(opportunityId);
      setMessage(action === "select" ? "Opportunity selected. Validation will use this opportunity." : data.status === "shortlisted" ? "Added to shortlist." : "Removed from shortlist.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update opportunity.");
    } finally {
      setBusy(null);
    }
  }

  const selected = opportunities.find((item) => item.status === "selected");
  const shortlisted = opportunities.filter((item) => item.status === "shortlisted").length;
  const analysisItem = opportunities.find((item) => item.id === analysisId) ?? selected ?? opportunities[0] ?? null;
  const analysisIndex = analysisItem ? opportunities.findIndex((item) => item.id === analysisItem.id) + 1 : 0;
  const analysisDuplicate = analysisItem ? duplicateMap.get(analysisItem.id)?.[0] : undefined;
  const strong = analysisItem ? strongestDimension(analysisItem) : null;
  const weak = analysisItem ? weakestDimension(analysisItem) : null;
  const analysisEvidence = analysisItem ? evidenceCount(analysisItem) : 0;
  const parsedAnalysisEvidence = analysisItem ? parseEvidenceSummary(analysisItem.evidence_summary) : null;

  return (
    <div className="mt-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Opportunity board</p>
          <h2 className="pf-display mt-2 text-4xl font-semibold">Compare the landscape.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736d]">ProductForge surfaced {opportunities.length} opportunities. Shortlist promising directions, inspect the decision signals, then select one to pressure-test.</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[#deded7] bg-white px-3 py-2">{shortlisted} shortlisted</span>
          <span className="rounded-full border border-[#deded7] bg-white px-3 py-2">{selected ? "1 selected" : "No selection"}</span>
        </div>
      </div>

      {message && <div className="mt-4 rounded-2xl border border-[#dfe7ad] bg-[#f5f8dc] px-4 py-3 text-xs text-[#59620f]">{message}</div>}

      {selected && (
        <div className="mt-5 rounded-[24px] bg-[#d9f06a] p-5">
          <p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#59620f]">Selected opportunity</p>
          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div><h3 className="text-xl font-semibold">{selected.title}</h3><p className="mt-1 text-xs text-[#4f541f]">Score {score(selected.opportunity_score)} · Confidence {score(selected.confidence_score)}%</p></div>
            <Link href={`/projects/${projectId}/validate`} className="w-fit rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Validate selected →</Link>
          </div>
        </div>
      )}

      {analysisItem && (
        <section className="mt-5 overflow-hidden rounded-[28px] border border-[#dcdcd4] bg-[#171714] text-white shadow-[0_20px_55px_rgba(21,21,19,.12)]">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="relative overflow-hidden p-6 sm:p-7">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#d9f06a]/10 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Decision analysis · #{String(analysisIndex).padStart(2, "0")}</span>
                  {analysisItem.status === "selected" && <span className="rounded-full bg-[#d9f06a] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#171714]">Selected</span>}
                </div>
                <h3 className="pf-display mt-3 max-w-2xl text-3xl font-semibold">{analysisItem.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{analysisItem.rationale || analysisItem.proposed_product || analysisItem.problem || "This direction is grounded in the collected research signals."}</p>
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Strongest signal</p><p className="mt-2 text-lg font-semibold text-[#d9f06a]">{strong?.value}/100</p><p className="mt-1 text-[10px] text-white/45">{strong?.label}</p></div>
                  <div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Evidence</p><p className="mt-2 text-lg font-semibold">{analysisEvidence || "—"}</p><p className="mt-1 text-[10px] text-white/45">linked source signals</p></div>
                  <div className="rounded-2xl bg-white/[.06] p-4"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-white/35">Buildability</p><p className="mt-2 text-lg font-semibold">{score(analysisItem.buildability_score)}/100</p><p className="mt-1 text-[10px] text-white/45">scope fit</p></div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.035] p-6 sm:p-7 lg:border-l lg:border-t-0">
              <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-white/40">Decision notes</p>
              <div className="mt-5 space-y-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#d9f06a]">Why it has leverage</p><p className="mt-1 text-xs leading-5 text-white/60">{strong?.label} is the strongest signal at {strong?.value}/100, giving this direction its clearest advantage in the current research set.</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">Main risk</p><p className="mt-1 text-xs leading-5 text-white/60">{weak?.label} is the weakest dimension at {weak?.value}/100. Treat that as the first assumption to pressure-test rather than hiding it behind the overall score.</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">Differentiation check</p><p className="mt-1 text-xs leading-5 text-white/60">{analysisDuplicate ? `This looks close to #${String(analysisDuplicate.index).padStart(2, "0")} “${analysisDuplicate.title}”. Compare the audience, problem and product format carefully before treating both as separate bets.` : "No strong near-duplicate was detected from the current title, problem and product wording."}</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">Evidence basis</p><p className="mt-1 text-xs leading-5 text-white/60">{analysisEvidence ? `${analysisEvidence} linked source signal${analysisEvidence === 1 ? "" : "s"} support this opportunity${parsedAnalysisEvidence?.confidenceBasis?.sourceCount ? `; confidence uses ${parsedAnalysisEvidence.confidenceBasis.sourceCount} source${parsedAnalysisEvidence.confidenceBasis.sourceCount === 1 ? "" : "s"}.` : "."}` : "No opportunity-specific source count is recorded here; inspect the evidence explorer before relying on this direction."}</p></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-5 space-y-3">
        {opportunities.map((item, index) => {
          const isSelected = item.status === "selected";
          const isShortlisted = item.status === "shortlisted";
          const isAnalyzed = item.id === analysisItem?.id;
          const duplicate = duplicateMap.get(item.id)?.[0];
          return (
            <article key={item.id} className={`rounded-[26px] border p-5 transition ${isAnalyzed ? "border-[#cfdc70] shadow-[0_12px_40px_rgba(180,210,50,.08)]" : "border-[#deded7]"} ${isSelected ? "bg-[#fbfff0]" : "bg-white hover:-translate-y-0.5 hover:shadow-lg"}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#171714] text-xs font-bold text-[#d9f06a]">{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="pf-mono text-[8px] uppercase tracking-[.15em] text-[#999991]">{item.niche}</span>{isSelected && <span className="rounded-full bg-[#d9f06a] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em]">Selected</span>}{isShortlisted && <span className="rounded-full bg-[#eef5cf] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#596b00]">Shortlisted</span>}{duplicate && <span className="rounded-full bg-[#f2f2ed] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#77776f]">Near duplicate</span>}</div>
                    <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#73736d]">{item.problem || item.proposed_product || "No problem statement recorded."}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#696961]"><span className="rounded-full bg-[#f4f4f0] px-3 py-1.5">{item.target_audience || "Audience defined by research"}</span><span className="rounded-full bg-[#f4f4f0] px-3 py-1.5">{item.product_type || "Digital product"}</span></div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 lg:w-[250px] lg:justify-end">
                  <div className="text-right"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-[#999991]">Opportunity</p><p className="pf-display text-4xl font-semibold">{score(item.opportunity_score)}</p><p className="text-[10px] text-[#77776f]">{score(item.confidence_score)}% confidence</p></div>
                  <div className="flex flex-col gap-2"><button type="button" disabled={!!busy} onClick={() => setAnalysisId(item.id)} className="rounded-full border border-[#d5d5cd] bg-white px-3 py-2 text-[10px] font-semibold disabled:opacity-50">{isAnalyzed ? "Analyzing" : "Analyze"}</button><button type="button" disabled={!!busy} onClick={() => act(item.id, "shortlist")} className="rounded-full border border-[#d5d5cd] bg-white px-3 py-2 text-[10px] font-semibold disabled:opacity-50">{isShortlisted ? "Remove" : "Shortlist"}</button><button type="button" disabled={!!busy || isSelected} onClick={() => act(item.id, "select")} className="rounded-full bg-[#171714] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-40">{isSelected ? "Selected" : "Select"}</button></div>
                </div>
              </div>
              <div className="mt-5 grid gap-2 border-t border-[#ecece6] pt-4 sm:grid-cols-3 lg:grid-cols-6">
                {dimensions.map(([label, key]) => <div key={label}><div className="flex justify-between text-[9px] text-[#888880]"><span>{label}</span><span className="font-semibold text-[#44443f]">{score(item[key] as number | null)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eeeeea]"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${score(item[key] as number | null)}%` }} /></div></div>)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

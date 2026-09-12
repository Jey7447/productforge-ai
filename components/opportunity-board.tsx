"use client";

import { useState } from "react";
import Link from "next/link";

type Opportunity = {
  id: string;
  title: string;
  niche: string;
  target_audience: string | null;
  problem: string | null;
  proposed_product: string | null;
  product_type: string | null;
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

const dimensions: [string, keyof Opportunity][] = [
  ["Demand", "demand_score"],
  ["Problem", "problem_intensity_score"],
  ["Gap", "competition_gap_score"],
  ["Monetization", "monetization_score"],
  ["Specificity", "specificity_score"],
  ["Buildability", "buildability_score"],
];

function score(value: number | null) { return Math.round(Number(value ?? 0)); }

export function OpportunityBoard({ projectId, opportunities: initial }: { projectId: string; opportunities: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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
      setMessage(action === "select" ? "Opportunity selected. Validation will use this opportunity." : data.status === "shortlisted" ? "Added to shortlist." : "Removed from shortlist.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update opportunity.");
    } finally { setBusy(null); }
  }

  const selected = opportunities.find((item) => item.status === "selected");
  const shortlisted = opportunities.filter((item) => item.status === "shortlisted").length;

  return (
    <div className="mt-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Opportunity board</p>
          <h2 className="pf-display mt-2 text-4xl font-semibold">Compare the landscape.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736d]">ProductForge surfaced {opportunities.length} distinct opportunities. Shortlist promising directions, then select the one you want to pressure-test.</p>
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

      <div className="mt-5 space-y-3">
        {opportunities.map((item, index) => {
          const isSelected = item.status === "selected";
          const isShortlisted = item.status === "shortlisted";
          return (
            <article key={item.id} className={`rounded-[26px] border p-5 transition ${isSelected ? "border-[#cbe64d] bg-[#fbfff0] shadow-[0_12px_40px_rgba(180,210,50,.12)]" : "border-[#deded7] bg-white hover:-translate-y-0.5 hover:shadow-lg"}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#171714] text-xs font-bold text-[#d9f06a]">{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="pf-mono text-[8px] uppercase tracking-[.15em] text-[#999991]">{item.niche}</span>{isSelected && <span className="rounded-full bg-[#d9f06a] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em]">Selected</span>}{isShortlisted && <span className="rounded-full bg-[#eef5cf] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#596b00]">Shortlisted</span>}</div>
                    <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#73736d]">{item.problem || item.proposed_product || "No problem statement recorded."}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#696961]"><span className="rounded-full bg-[#f4f4f0] px-3 py-1.5">{item.target_audience || "Audience defined by research"}</span><span className="rounded-full bg-[#f4f4f0] px-3 py-1.5">{item.product_type || "Digital product"}</span></div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 lg:w-[250px] lg:justify-end">
                  <div className="text-right"><p className="pf-mono text-[8px] uppercase tracking-[.14em] text-[#999991]">Opportunity</p><p className="pf-display text-4xl font-semibold">{score(item.opportunity_score)}</p><p className="text-[10px] text-[#77776f]">{score(item.confidence_score)}% confidence</p></div>
                  <div className="flex flex-col gap-2"><button type="button" disabled={!!busy} onClick={() => act(item.id, "shortlist")} className="rounded-full border border-[#d5d5cd] bg-white px-3 py-2 text-[10px] font-semibold disabled:opacity-50">{isShortlisted ? "Remove" : "Shortlist"}</button><button type="button" disabled={!!busy || isSelected} onClick={() => act(item.id, "select")} className="rounded-full bg-[#171714] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-40">{isSelected ? "Selected" : "Select"}</button></div>
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

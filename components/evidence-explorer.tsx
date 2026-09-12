"use client";

import { useMemo, useState } from "react";

type Evidence = {
  id: string;
  source_url: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
  snippet: string | null;
  relevance_score?: number | null;
  credibility_score?: number | null;
};

export function EvidenceExplorer({ evidence }: { evidence: Evidence[] }) {
  const [filter, setFilter] = useState("ALL");
  const types = useMemo(() => ["ALL", ...Array.from(new Set(evidence.map((item) => (item.source_type || "WEB").toUpperCase()))).slice(0, 5)], [evidence]);
  const visible = filter === "ALL" ? evidence : evidence.filter((item) => (item.source_type || "WEB").toUpperCase() === filter);

  if (!evidence.length) return null;

  return (
    <section className="mt-10" aria-label="Evidence explorer">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pf-mono text-[9px] font-semibold tracking-[.18em] text-[#8a8a82]">EVIDENCE EXPLORER</p>
          <h2 className="pf-display mt-1 text-3xl font-semibold tracking-[-.04em]">See what the decision is built on.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Sources are ranked by the research engine. Open the original source to inspect the evidence yourself.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setFilter(type)} className={`pf-mono rounded-full border px-3 py-1.5 text-[8px] font-semibold tracking-[.08em] transition ${filter === type ? "border-[#171714] bg-[#171714] text-white" : "border-[#dcdcd4] bg-white text-[#73736d] hover:border-[#aaa9a0]"}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((item, index) => {
          const relevance = Math.round(item.relevance_score ?? 0);
          const credibility = Math.round(item.credibility_score ?? 0);
          const domain = item.source_domain || (() => { try { return new URL(item.source_url).hostname.replace(/^www\./, ""); } catch { return "web source"; } })();
          return (
            <article key={item.id} className="pf-card-hover group rounded-[24px] border border-[#deded7] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#171714] text-[#d9f06a]"><span className="pf-mono text-[9px] font-bold">{String(index + 1).padStart(2, "0")}</span></span>
                  <div className="min-w-0"><p className="pf-mono truncate text-[8px] font-semibold uppercase tracking-[.1em] text-[#999991]">{domain}</p><p className="mt-0.5 text-[10px] font-medium text-[#73736d]">{(item.source_type || "Web source").replaceAll("_", " ")}</p></div>
                </div>
                <a href={item.source_url} target="_blank" rel="noreferrer" className="pf-focus shrink-0 rounded-full border border-[#deded7] px-2.5 py-1.5 text-[10px] font-semibold text-[#4f4f49] transition group-hover:border-[#aaa9a0]">Open ↗</a>
              </div>
              <h3 className="mt-4 line-clamp-2 text-lg font-semibold leading-6">{item.title || "Untitled source"}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#73736d]">{item.snippet || "No source excerpt was captured for this result."}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#ededed] pt-4">
                <div><p className="pf-mono text-[8px] uppercase tracking-[.12em] text-[#999991]">Relevance</p><p className="mt-1 text-sm font-semibold">{relevance}<span className="ml-1 text-[10px] font-normal text-[#999991]">/100</span></p></div>
                <div><p className="pf-mono text-[8px] uppercase tracking-[.12em] text-[#999991]">Credibility</p><p className="mt-1 text-sm font-semibold">{credibility}<span className="ml-1 text-[10px] font-normal text-[#999991]">/100</span></p></div>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#eeeeea]"><div className="h-full rounded-full bg-[#d9f06a] transition-all duration-700" style={{ width: `${Math.max(4, Math.min(100, (relevance + credibility) / 2))}%` }} /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

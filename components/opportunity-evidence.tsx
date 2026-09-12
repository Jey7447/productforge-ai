type EvidenceItem = {
  id: string;
  source_url: string;
  source_domain: string | null;
  source_type: string | null;
  title: string | null;
  snippet: string | null;
  relevance_score: number | null;
  credibility_score: number | null;
};

type EvidenceSummary = {
  sources?: Array<{ sourceId?: string; claim?: string }>;
  scoreRationales?: Record<string, string>;
  confidenceBasis?: { sourceCount?: number };
} | null;

function pct(value: number | null) {
  return Math.max(0, Math.min(100, Math.round(Number(value ?? 0))));
}

function label(value: number | null) {
  const n = pct(value);
  if (n >= 80) return "Strong";
  if (n >= 60) return "Useful";
  if (n >= 40) return "Mixed";
  return "Weak";
}

export function OpportunityEvidence({
  evidence,
  summary,
}: {
  evidence: EvidenceItem[];
  summary: EvidenceSummary;
}) {
  const sourceClaims = summary?.sources ?? [];
  const rationales = summary?.scoreRationales ?? {};

  if (!evidence.length && !Object.keys(rationales).length) return null;

  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const linkedEvidence = sourceClaims
    .map((source) => ({ source, evidence: source.sourceId ? evidenceById.get(source.sourceId) : undefined }))
    .filter((item) => item.evidence);

  const dimensions = [
    ["Demand", "demand"],
    ["Problem intensity", "problemIntensity"],
    ["Competition gap", "competitionGap"],
    ["Monetization", "monetization"],
    ["Specificity", "specificity"],
    ["Buildability", "buildability"],
  ] as const;

  return (
    <section className="pf-card mt-5 overflow-hidden rounded-[30px]">
      <div className="border-b border-[#e6e6df] bg-[#f8f8f4] p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="pf-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Evidence trace</p>
            <h2 className="pf-display mt-2 text-3xl font-semibold">Why this opportunity scored this way.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736d]">
              Follow the evidence behind the opportunity instead of taking the score on faith. Each signal below is paired with the research rationale when available.
            </p>
          </div>
          <span className="pf-mono w-fit rounded-full border border-[#dcdcd4] bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-[#73736d]">
            {summary?.confidenceBasis?.sourceCount ?? evidence.length} linked source{(summary?.confidenceBasis?.sourceCount ?? evidence.length) === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid gap-7 p-7 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#999991]">Score reasoning</p>
          <div className="mt-4 space-y-3">
            {dimensions.map(([name, key], index) => (
              <div key={key} className="rounded-2xl border border-[#e4e4dd] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="pf-mono text-[8px] text-[#aaa9a1]">0{index + 1}</span>
                    <span className="text-sm font-semibold">{name}</span>
                  </div>
                  <span className="pf-mono rounded-full bg-[#f4f4f0] px-2 py-1 text-[8px] font-semibold text-[#73736d]">
                    {rationales[key] ? "EVIDENCE" : "SCORE"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#73736d]">
                  {rationales[key] ?? "No dimension-specific rationale was recorded for this signal."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="pf-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#999991]">Supporting sources</p>
            <span className="text-[10px] text-[#999991]">Relevance · credibility</span>
          </div>

          <div className="mt-4 space-y-3">
            {(linkedEvidence.length ? linkedEvidence : evidence.slice(0, 6).map((item) => ({ source: { claim: undefined }, evidence: item }))).map(({ source, evidence: item }, index) => {
              if (!item) return null;
              const relevance = pct(item.relevance_score);
              const credibility = pct(item.credibility_score);
              return (
                <article key={item.id} className="rounded-2xl border border-[#e4e4dd] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#bdbdb4] hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#171714] pf-mono text-[8px] font-bold text-[#d9f06a]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pf-mono text-[8px] font-semibold uppercase tracking-[.1em] text-[#999991]">{item.source_domain ?? "source"}</span>
                        {item.source_type && <span className="rounded-full bg-[#f4f4f0] px-2 py-0.5 text-[8px] font-semibold text-[#73736d]">{item.source_type}</span>}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold leading-5">{item.title ?? "Research source"}</h3>
                      {source.claim && <p className="mt-2 text-xs font-medium leading-5 text-[#4f4f49]">Supports: {source.claim}</p>}
                      {item.snippet && <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#888880]">{item.snippet}</p>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div><div className="flex justify-between text-[9px]"><span className="text-[#999991]">Relevance</span><span className="font-semibold">{relevance} · {label(item.relevance_score)}</span></div><div className="mt-1 h-1.5 rounded-full bg-[#eeeeea]"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${relevance}%` }} /></div></div>
                    <div><div className="flex justify-between text-[9px]"><span className="text-[#999991]">Credibility</span><span className="font-semibold">{credibility} · {label(item.credibility_score)}</span></div><div className="mt-1 h-1.5 rounded-full bg-[#eeeeea]"><div className="h-full rounded-full bg-[#d9f06a]" style={{ width: `${credibility}%` }} /></div></div>
                  </div>
                  <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-[#d6d6ce] bg-white px-3 py-1.5 text-[10px] font-semibold transition hover:border-[#a9a9a0]">Open source ↗</a>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

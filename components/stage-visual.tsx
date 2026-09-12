"use client";

const stageData = {
  Research: {
    eyebrow: "SIGNAL FIELD",
    title: "Collect signals before conclusions.",
    nodes: ["SEARCH", "SOURCES", "EVIDENCE", "SYNTHESIS"],
    caption: "Signals become evidence, then evidence becomes a decision.",
  },
  Opportunity: {
    eyebrow: "OPPORTUNITY FIELD",
    title: "Six signals converge on one decision.",
    nodes: ["DEMAND", "PAIN", "GAP", "VALUE"],
    caption: "Demand, intensity, gaps and buildability form the opportunity signal.",
  },
  Validate: {
    eyebrow: "VALIDATION FIELD",
    title: "Turn assumptions into testable questions.",
    nodes: ["HYPOTHESIS", "TEST", "RESPONSE", "DECISION"],
    caption: "Replace assumptions with observable responses before committing further.",
  },
  Build: {
    eyebrow: "PRODUCT FIELD",
    title: "Shape evidence into a usable product.",
    nodes: ["PROMISE", "MODULES", "PRACTICE", "PRODUCT"],
    caption: "A validated opportunity becomes a structured, editable product system.",
  },
  Launch: {
    eyebrow: "LAUNCH FIELD",
    title: "Move from offer to real response.",
    nodes: ["AUDIENCE", "MESSAGE", "CHANNEL", "RESPONSE"],
    caption: "Launch is another evidence loop: reach, response, learning, improve.",
  },
} as const;

export type StageName = keyof typeof stageData;

type StageVisualProps = {
  active: StageName;
  evidenceCount?: number;
  opportunityCount?: number;
};

export function StageVisual({ active, evidenceCount = 0, opportunityCount = 0 }: StageVisualProps) {
  const data = stageData[active];

  return (
    <section aria-label={`${active} visual overview`} className="pf-stage-visual group relative mt-5 overflow-hidden rounded-[26px] border border-[#dcdcd4] bg-[#171714] text-white">
      <div className="absolute inset-0 pf-grid-dark opacity-40" />
      <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#d9f06a]/15 blur-3xl transition duration-700 group-hover:scale-125" />
      <div className="absolute -left-24 -bottom-32 h-48 w-48 rounded-full bg-[#d9f06a]/10 blur-3xl" />
      <div className="relative grid min-h-[168px] gap-6 p-5 sm:p-6 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="pf-pulse h-1.5 w-1.5 rounded-full bg-[#d9f06a]" />
            <p className="pf-mono text-[9px] font-semibold tracking-[.18em] text-[#d9f06a]">{data.eyebrow}</p>
          </div>
          <h2 className="pf-display mt-2 max-w-md text-xl font-semibold leading-tight sm:text-2xl">{data.title}</h2>
          <p className="mt-2 max-w-md text-[11px] leading-5 text-white/45">{data.caption}</p>
          {active === "Research" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pf-mono rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[8px] text-white/55">{evidenceCount} EVIDENCE</span>
              <span className="pf-mono rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[8px] text-white/55">{opportunityCount} OPPORTUNITIES</span>
            </div>
          )}
        </div>

        <div className="relative min-h-[108px]">
          <div className="absolute left-[7%] right-[7%] top-[31%] h-px bg-white/15" />
          <div className="pf-signal-travel absolute left-[7%] top-[calc(31%-2px)] h-1 w-12 rounded-full bg-[#d9f06a] shadow-[0_0_18px_rgba(217,240,106,.5)]" />
          <div className="absolute left-[7%] right-[7%] top-[31%] flex justify-between">
            {data.nodes.slice(0, -1).map((node) => <span key={node} className="h-1.5 w-1.5 -translate-y-[2px] rounded-full bg-white/25" />)}
          </div>
          <div className="flex h-full items-start justify-between gap-2 sm:gap-3">
            {data.nodes.map((node, index) => (
              <div key={node} className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className={`pf-stage-node grid h-14 w-14 place-items-center rounded-full border transition duration-500 group-hover:scale-105 ${index === data.nodes.length - 1 ? "border-[#d9f06a] bg-[#d9f06a] text-[#171714] shadow-[0_0_30px_rgba(217,240,106,.12)]" : "border-white/20 bg-[#22221f] text-white"}`}>
                  <span className="pf-mono text-[8px] font-bold">0{index + 1}</span>
                </div>
                <span className="pf-mono max-w-full truncate text-[8px] font-semibold tracking-[.12em] text-white/50">{node}</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between text-[8px] text-white/25">
            <span className="pf-mono">INPUT</span>
            <span className="pf-mono">SIGNAL FLOW</span>
            <span className="pf-mono">DECISION</span>
          </div>
        </div>
      </div>
    </section>
  );
}

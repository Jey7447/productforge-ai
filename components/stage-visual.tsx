"use client";

const stageData = {
  Research: {
    eyebrow: "SIGNAL FIELD",
    title: "Collect signals before conclusions.",
    nodes: ["SEARCH", "SOURCES", "EVIDENCE", "SYNTHESIS"],
  },
  Opportunity: {
    eyebrow: "OPPORTUNITY FIELD",
    title: "Six signals converge on one decision.",
    nodes: ["DEMAND", "PAIN", "GAP", "VALUE"],
  },
  Validate: {
    eyebrow: "VALIDATION FIELD",
    title: "Turn assumptions into testable questions.",
    nodes: ["HYPOTHESIS", "TEST", "RESPONSE", "DECISION"],
  },
  Build: {
    eyebrow: "PRODUCT FIELD",
    title: "Shape evidence into a usable product.",
    nodes: ["PROMISE", "MODULES", "PRACTICE", "PRODUCT"],
  },
  Launch: {
    eyebrow: "LAUNCH FIELD",
    title: "Move from offer to real response.",
    nodes: ["AUDIENCE", "MESSAGE", "CHANNEL", "RESPONSE"],
  },
} as const;

export type StageName = keyof typeof stageData;

export function StageVisual({ active }: { active: StageName }) {
  const data = stageData[active];

  return (
    <section aria-label={`${active} visual overview`} className="pf-stage-visual relative mt-5 overflow-hidden rounded-[26px] border border-[#dcdcd4] bg-[#171714] text-white">
      <div className="absolute inset-0 pf-grid-dark opacity-40" />
      <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#d9f06a]/15 blur-3xl" />
      <div className="relative grid min-h-[150px] gap-6 p-5 sm:grid-cols-[.8fr_1.2fr] sm:items-center sm:p-6 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="pf-mono text-[9px] font-semibold tracking-[.18em] text-[#d9f06a]">{data.eyebrow}</p>
          <h2 className="pf-display mt-2 max-w-md text-xl font-semibold leading-tight sm:text-2xl">{data.title}</h2>
        </div>

        <div className="relative flex items-center justify-between gap-1 sm:gap-3">
          <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-white/15" />
          {data.nodes.map((node, index) => (
            <div key={node} className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className={`pf-stage-node grid h-11 w-11 place-items-center rounded-full border ${index === data.nodes.length - 1 ? "border-[#d9f06a] bg-[#d9f06a] text-[#171714]" : "border-white/20 bg-[#22221f] text-white"}`}>
                <span className="pf-mono text-[8px] font-bold">0{index + 1}</span>
              </div>
              <span className="pf-mono max-w-full truncate text-[8px] font-semibold tracking-[.12em] text-white/50">{node}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

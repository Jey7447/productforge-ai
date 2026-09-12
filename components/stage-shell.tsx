import Link from "next/link";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { StageVisual, type StageName } from "@/components/stage-visual";

const stages = [
  ["Research", ""] as const,
  ["Opportunity", "/opportunity"] as const,
  ["Validate", "/validate"] as const,
  ["Build", "/build"] as const,
  ["Launch", "/launch"] as const,
];

export async function StageShell({
  projectId,
  projectName,
  active,
  children,
}: {
  projectId: string;
  projectName: string;
  active: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("current_stage")
    .eq("id", projectId)
    .maybeSingle();

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();

  const { data: latestRun } = await supabase
    .from("research_runs")
    .select("id,opportunity_search_id")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: evidenceCount } = latestRun?.id
    ? await supabase
        .from("research_evidence")
        .select("id", { count: "exact", head: true })
        .eq("research_run_id", latestRun.id)
    : { count: 0 };

  const { count: opportunityCount } = latestRun?.opportunity_search_id
    ? await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("search_id", latestRun.opportunity_search_id)
    : { count: 0 };

  const currentStage = Math.min(Math.max(Number(project?.current_stage ?? 1), 1), stages.length);
  const launchAvailable = Boolean(product);
  const stageName = stages.some(([label]) => label === active) ? active as StageName : "Research";

  return (
    <main className="pf-shell text-[#151513]">
      <header className="sticky top-0 z-30 border-b border-[#dcdcd4]/80 bg-[#f4f4f0]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <Brand href="/dashboard" />
            <span className="hidden text-[#c7c7bf] sm:block">/</span>
            <span className="hidden max-w-56 truncate text-xs font-semibold text-[#62625c] sm:block">{projectName}</span>
          </div>
          <Link href={`/projects/${projectId}`} className="pf-lift rounded-full border border-[#d2d2ca] bg-white/85 px-4 py-2 text-xs font-semibold shadow-sm transition hover:border-[#aaa9a0]">
            Research workspace ↗
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-10">
        <nav aria-label="Project stages" className="flex gap-2 overflow-x-auto pb-1">
          {stages.map(([label, suffix], index) => {
            const stageNumber = index + 1;
            const isActive = active === label;
            const isCompleted = stageNumber < currentStage;
            const isLaunchUnlocked = stageNumber === 5 && launchAvailable;
            const isLocked = stageNumber > currentStage && !isLaunchUnlocked;
            const number = String(stageNumber).padStart(2, "0");

            if (isLocked) {
              return (
                <span key={label} aria-disabled="true" title={`Complete stage ${currentStage} before opening ${label}.`} className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e1e1d9] bg-[#ecece7] px-4 py-2 text-[11px] font-semibold text-[#aaa9a1]">
                  <span className="pf-mono">{number}</span><span>· {label}</span><span aria-hidden="true" className="text-[9px]">🔒</span>
                </span>
              );
            }

            return (
              <Link key={label} href={`/projects/${projectId}${suffix}`} aria-current={isActive ? "step" : undefined} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-bold transition ${isActive ? "bg-[#151513] text-white shadow-[0_8px_22px_rgba(21,21,19,.14)]" : "border border-[#d3d3cb] bg-white/80 text-[#6f6f68] hover:-translate-y-0.5 hover:border-[#aeadA5] hover:text-[#151513]"}`}>
                <span className="pf-mono text-[10px]">{number}</span><span>· {label}</span>
                {isCompleted && !isActive && <span aria-hidden="true" className="text-[10px]">✓</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-[#96968e]">
          <span className="pf-pulse h-1.5 w-1.5 rounded-full bg-[#c9e83f]" />
          <span className="pf-mono">STAGE {String(currentStage).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</span>
          <span>·</span>
          <span>{stages[currentStage - 1][0]} in progress</span>
        </div>

        <StageVisual active={stageName} evidenceCount={evidenceCount ?? 0} opportunityCount={opportunityCount ?? 0} />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10">{children}</div>
    </main>
  );
}

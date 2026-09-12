import Link from "next/link";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

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

  const currentStage = Math.min(Math.max(Number(project?.current_stage ?? 1), 1), stages.length);
  const launchAvailable = Boolean(product);

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#171714]">
      <header className="sticky top-0 z-30 border-b border-[#deded7] bg-[#f5f5f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-5">
            <Brand href="/dashboard" />
            <span className="hidden text-[#c6c6be] sm:block">/</span>
            <span className="hidden max-w-48 truncate text-sm font-medium sm:block">{projectName}</span>
          </div>
          <Link href={`/projects/${projectId}`} className="rounded-full border border-[#d5d5cd] bg-white px-4 py-2 text-xs font-semibold transition hover:border-[#bdbdb4]">Research workspace ↗</Link>
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
                <span key={label} aria-disabled="true" title={`Complete stage ${currentStage} before opening ${label}.`} className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e2e2db] bg-[#eeeee9] px-4 py-2 text-xs font-semibold text-[#aaa9a1]">
                  <span>{number} · {label}</span>
                  <span aria-hidden="true" className="text-[10px]">🔒</span>
                </span>
              );
            }

            return (
              <Link key={label} href={`/projects/${projectId}${suffix}`} aria-current={isActive ? "step" : undefined} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${isActive ? "bg-[#171714] text-white" : "border border-[#d8d8d0] bg-white text-[#73736d] hover:border-[#bdbdb4] hover:text-[#171714]"}`}>
                <span>{number} · {label}</span>
                {isCompleted && !isActive && <span aria-hidden="true" className="text-[10px]">✓</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#96968e]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d9f06a]" />
          <span>Stage {currentStage} of {stages.length}</span>
          <span>·</span>
          <span>{stages[currentStage - 1][0]} in progress</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10">{children}</div>
    </main>
  );
}

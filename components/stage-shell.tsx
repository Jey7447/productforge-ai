import Link from "next/link";
import { Brand } from "@/components/brand";

const stages = [
  ["Research", ""],
  ["Opportunity", "/opportunity"],
  ["Validate", "/validate"],
  ["Build", "/build"],
  ["Launch", "/launch"],
];

export function StageShell({ projectId, projectName, active, children }: { projectId: string; projectName: string; active: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#171714]">
      <header className="sticky top-0 z-30 border-b border-[#deded7] bg-[#f5f5f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-5"><Brand href="/dashboard" /><span className="hidden text-[#c6c6be] sm:block">/</span><span className="hidden max-w-48 truncate text-sm font-medium sm:block">{projectName}</span></div>
          <Link href={`/projects/${projectId}`} className="rounded-full border border-[#d5d5cd] bg-white px-4 py-2 text-xs font-semibold transition hover:border-[#bdbdb4]">Research workspace ↗</Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-10"><div className="flex gap-2 overflow-x-auto pb-1">{stages.map(([label, suffix], index) => <Link key={label} href={`/projects/${projectId}${suffix}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${active === label ? "bg-[#171714] text-white" : "border border-[#d8d8d0] bg-white text-[#73736d] hover:text-[#171714]"}`}>{String(index + 1).padStart(2,"0")} · {label}</Link>)}</div></div>
      <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10">{children}</div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Brand } from "@/components/brand";

const stageLabels = ["Research", "Opportunity", "Validate", "Build", "Launch"];
const stageRoutes = ["", "/opportunity", "/validate", "/build", "/launch"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: projects } = await supabase.from("projects").select("id,name,status,created_at,current_stage").order("created_at", { ascending: false }).limit(6);
  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";
  const currentProject = projects?.[0] ?? null;
  const currentStage = currentProject ? Math.min(Math.max(Number(currentProject.current_stage ?? 1), 1), 5) : 1;
  const nextStepLabel = currentProject ? stageLabels[currentStage - 1] : "Discover";
  const nextStepHref = currentProject ? `/projects/${currentProject.id}${stageRoutes[currentStage - 1]}` : "/projects/new";
  const researchHref = currentProject ? `/projects/${currentProject.id}` : "/projects/new";

  return (
    <main className="pf-shell min-h-screen text-[#171714]">
      <header className="sticky top-0 z-30 border-b border-[#deded7]/80 bg-[#f4f4f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand href="/dashboard" />
          <div className="flex items-center gap-2">
            <Link href="/projects/new" className="pf-focus rounded-full bg-[#171714] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">New project →</Link>
            <form action={logout}><button className="pf-focus rounded-full px-4 py-2.5 text-sm text-[#707069] transition hover:bg-white hover:text-[#171714]">Log out</button></form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <section className="pf-glow relative overflow-hidden rounded-[34px] border border-[#dcdcd4] bg-[#e9e9e2] p-7 sm:p-10 lg:p-12">
          <div className="pf-grid absolute inset-0 opacity-70" />
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#d9f06a]/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_.82fr] lg:items-end">
            <div>
              <p className="pf-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#77776f]">Workspace / signal desk</p>
              <h1 className="pf-display mt-4 max-w-3xl text-5xl font-semibold leading-[.91] sm:text-6xl lg:text-7xl">Good to see you, {firstName}.</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#66665f] sm:text-base">Ideas, research runs and product opportunities — organized from first signal to launch.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="pf-pill rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em]">Evidence first</span>
                <span className="pf-pill rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em]">Research → launch</span>
              </div>
            </div>
            <div className="relative hidden min-h-[190px] lg:block">
              <div className="absolute inset-5 rounded-[28px] border border-[#c9c9c0] bg-white/55 backdrop-blur-sm" />
              <div className="absolute inset-0 p-7">
                <div className="flex items-center justify-between"><span className="pf-mono text-[9px] uppercase tracking-[.16em] text-[#8a8a82]">ProductForge loop</span><span className="pf-pulse h-2 w-2 rounded-full bg-[#9ab100]" /></div>
                <div className="mt-7 flex items-center justify-between gap-2">
                  {stageLabels.map((label, index) => <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[10px] font-bold ${index < 2 ? "border-[#171714] bg-[#171714] text-[#d9f06a]" : "border-[#cfcfc7] bg-white text-[#77776f]"}`}>{String(index + 1).padStart(2, "0")}</div>
                    {index < stageLabels.length - 1 && <div className="pf-signal-line flex-1" />}
                  </div>)}
                </div>
                <div className="mt-3 flex justify-between pl-1 pr-0 text-[9px] font-semibold text-[#77776f]"><span>Research</span><span>Launch</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link href="#projects" className="pf-card pf-card-hover group rounded-[26px] p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(21,21,19,.08)]">
            <div className="flex items-start justify-between">
              <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#999991]">Projects</p>
              <span className="text-sm text-[#aaa9a1] transition group-hover:translate-x-1 group-hover:text-[#171714]">↗</span>
            </div>
            <p className="pf-display mt-5 text-3xl font-semibold tracking-tight">{projects?.length ?? 0}</p>
            <p className="mt-1 text-xs text-[#707069]">Active workspaces · view projects</p>
          </Link>

          <Link href={researchHref} className="pf-card pf-card-hover group rounded-[26px] p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(21,21,19,.08)]">
            <div className="flex items-start justify-between">
              <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#999991]">Research mode</p>
              <span className="text-sm text-[#aaa9a1] transition group-hover:translate-x-1 group-hover:text-[#171714]">↗</span>
            </div>
            <p className="pf-display mt-5 text-3xl font-semibold tracking-tight">Evidence</p>
            <p className="mt-1 text-xs text-[#707069]">{currentProject ? `Open ${currentProject.name} research` : "Start evidence-backed research"}</p>
          </Link>

          <Link href={nextStepHref} className="pf-card pf-card-hover group rounded-[26px] p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(21,21,19,.08)]">
            <div className="flex items-start justify-between">
              <p className="pf-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#999991]">Next step</p>
              <span className="text-sm text-[#aaa9a1] transition group-hover:translate-x-1 group-hover:text-[#171714]">↗</span>
            </div>
            <p className="pf-display mt-5 text-3xl font-semibold tracking-tight">{nextStepLabel}</p>
            <p className="mt-1 text-xs text-[#707069]">{currentProject ? `Continue ${currentProject.name}` : "Create your first project"}</p>
          </Link>
        </div>

        <section id="projects" className="mt-12 scroll-mt-28">
          <div className="flex items-end justify-between gap-4"><div><p className="pf-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">Your projects</p><h2 className="pf-display mt-2 text-3xl font-semibold sm:text-4xl">Where ideas become products.</h2></div><span className="pf-mono hidden text-[9px] uppercase tracking-[.14em] text-[#aaa9a1] sm:block">06 max / active view</span></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.length ? projects.map((project) => {
              const projectStage = Math.min(Math.max(Number(project.current_stage ?? 1), 1), 5);
              return <Link key={project.id} href={`/projects/${project.id}`} className="pf-card-hover group rounded-[28px] border border-[#dcdcd4] bg-white p-6">
                <div className="flex items-start justify-between"><span className="pf-mono rounded-full bg-[#f0f0eb] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-[#66665f]">{project.status ?? "Draft"}</span><span className="text-lg text-[#aaa9a1] transition group-hover:translate-x-1 group-hover:text-[#171714]">↗</span></div>
                <h3 className="mt-9 text-xl font-semibold tracking-tight">{project.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#707069]">Continue research, inspect evidence and explore the strongest opportunities.</p>
                <div className="mt-7 flex items-center gap-1.5">{stageLabels.map((label, index) => <span key={label} title={label} className={`h-1.5 flex-1 rounded-full ${index < projectStage ? "bg-[#171714]" : "bg-[#e7e7e0]"}`} />)}</div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-[#8a8a82]"><span>Stage {String(projectStage).padStart(2, "0")} / 05</span><span>{stageLabels[projectStage - 1]}</span></div>
              </Link>;
            }) : <div className="col-span-full rounded-[30px] border border-dashed border-[#cfcfc7] bg-white p-12 text-center"><div className="pf-pulse mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef5cf] text-xl">✦</div><h2 className="mt-5 text-xl font-semibold">Find your first opportunity</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#707069]">Start with a skill, audience, problem or market. ProductForge will turn it into a structured research workflow.</p><Link href="/projects/new" className="mt-6 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Create project →</Link></div>}
          </div>
        </section>
      </div>
    </main>
  );
}

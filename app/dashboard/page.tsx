import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,status,created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#171714]">
      <header className="border-b border-[#deded7] bg-[#f5f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171714] text-sm font-bold text-[#d9f06a]">PF</span>
            ProductForge
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/projects/new" className="hidden rounded-full border border-[#d4d4cc] bg-white px-4 py-2.5 text-sm font-medium transition hover:border-[#bdbdb4] sm:block">New project</Link>
            <form action={logout}>
              <button className="rounded-full px-4 py-2.5 text-sm text-[#73736d] transition hover:bg-white hover:text-[#171714]">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a8a82]">Workspace</p>
            <h1 className="pf-display mt-3 text-5xl font-semibold tracking-tight">Good to see you, {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#73736d]">Your product ideas, research runs and opportunities in one place.</p>
          </div>
          <Link href="/projects/new" className="inline-flex items-center justify-center rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Start a new project <span className="ml-2">↗</span></Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Projects", projects?.length ?? 0, "Active research workspaces"],
            ["Research mode", "Evidence", "Recommendations are grounded in sources"],
            ["Next step", projects?.length ? "Research" : "Discover", projects?.length ? "Open a project and continue" : "Create your first opportunity"],
          ].map(([label, value, description]) => (
            <div key={label} className="rounded-[24px] border border-[#deded7] bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#999991]">{label}</p>
              <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-[#73736d]">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a8a82]">Your workspace</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Projects</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.length ? projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="pf-card-hover group rounded-[28px] border border-[#deded7] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full bg-[#f0f0eb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#66665f]">{project.status ?? "Draft"}</span>
                  <span className="text-lg text-[#9a9a91] transition group-hover:translate-x-1">↗</span>
                </div>
                <h3 className="mt-10 text-xl font-semibold leading-tight tracking-tight">{project.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#73736d]">Continue research, review evidence and explore the strongest product opportunities.</p>
                <div className="mt-8 border-t border-[#ededE7] pt-4 text-xs font-medium text-[#8a8a82]">Open workspace</div>
              </Link>
            )) : (
              <div className="col-span-full rounded-[28px] border border-dashed border-[#cfcfc7] bg-white p-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef5cf] text-xl">✦</div>
                <h2 className="mt-5 text-xl font-semibold">Find your first opportunity</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#73736d]">Start with your skills, audience or a problem you care about. ProductForge will turn that starting point into a research plan.</p>
                <Link href="/projects/new" className="mt-6 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Create project</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

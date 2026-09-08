import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: projects } = await supabase.from("projects").select("id,name,status,created_at").order("created_at", { ascending: false }).limit(6);
  return <main className="min-h-screen bg-[#f7f8fa]"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/dashboard" className="text-lg font-semibold">ProductForge AI</Link><form action={logout}><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Log out</button></form></div></header><div className="mx-auto max-w-7xl px-6 py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your projects</h1></div><Link href="/projects/new" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">New project</Link></div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{projects?.length ? projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300"><p className="text-xs uppercase tracking-wider text-slate-400">{project.status ?? 'Draft'}</p><h2 className="mt-3 text-lg font-semibold">{project.name}</h2><p className="mt-6 text-sm text-slate-500">Open project →</p></Link>) : <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-semibold">Find your first opportunity</h2><p className="mx-auto mt-2 max-w-lg text-slate-600">Create a project and ProductForge will turn your starting point into a structured research plan.</p><Link href="/projects/new" className="mt-6 inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">Create project</Link></div>}</div></div></main>;
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: project } = await supabase.from("projects").select("id,name,status,created_at").eq("id", id).single();
  if (!project) notFound();
  const { data: inputs } = await supabase.from("project_inputs").select("content").eq("project_id", id).order("created_at", { ascending: true }).limit(1);
  return <main className="min-h-screen bg-[#f7f8fa]"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5"><Link href="/dashboard" className="text-sm text-slate-500">← Projects</Link><span className="text-slate-300">/</span><span className="font-semibold">{project.name}</span></div></header><div className="mx-auto max-w-5xl px-6 py-10"><div className="rounded-3xl border border-slate-200 bg-white p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-wider text-slate-400">Research project</p><h1 className="mt-2 text-3xl font-semibold">{project.name}</h1></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-600">{project.status}</span></div><div className="mt-8 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Starting point</p><p className="mt-2 leading-7 text-slate-700">{inputs?.[0]?.content ?? "No starting point saved."}</p></div><div className="mt-8 border-t border-slate-100 pt-8"><h2 className="text-xl font-semibold">Opportunity research</h2><p className="mt-2 max-w-2xl text-slate-600">The next step will turn this starting point into search queries, collect market evidence and rank potential opportunities.</p><button disabled className="mt-5 rounded-xl bg-slate-200 px-5 py-3 text-sm font-medium text-slate-500">Research engine coming next</button></div></div></div></main>;
}

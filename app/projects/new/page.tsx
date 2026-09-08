import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <main className="min-h-screen bg-[#f7f8fa] px-6 py-16"><div className="mx-auto max-w-2xl"><p className="text-sm font-medium text-slate-500">New project</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">What should we explore?</h1><p className="mt-3 text-lg text-slate-600">You do not need a finished idea. Give ProductForge a starting point and the research engine will narrow it down.</p><form action={createProject} className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white p-8"><div><label htmlFor="name" className="mb-2 block font-medium">Project name</label><input id="name" name="name" required placeholder="e.g. Consultant toolkit ideas" className="w-full rounded-xl border border-slate-200 px-4 py-3" /></div><div><label htmlFor="startingPoint" className="mb-2 block font-medium">Starting point</label><textarea id="startingPoint" name="startingPoint" required rows={6} placeholder="Describe an audience, skill, industry, problem, or idea you want to investigate..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3" /></div><button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-medium text-white">Create research project</button></form></div></main>;
}

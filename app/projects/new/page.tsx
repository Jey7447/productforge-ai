import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const errorMessage = params.error;

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#171714]">
      <header className="border-b border-[#deded7]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171714] text-sm font-bold text-[#d9f06a]">PF</span>
            ProductForge
          </Link>
          <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm text-[#73736d] transition hover:bg-white">Back to projects</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <div className="lg:sticky lg:top-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a8a82]">01 · Discovery</p>
            <h1 className="pf-display mt-4 text-5xl font-semibold leading-[.95] sm:text-6xl">What should we explore?</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#73736d]">You do not need a finished idea. Give ProductForge a starting point and the research engine will narrow it down using real market evidence.</p>

            <div className="mt-10 rounded-[24px] border border-[#deded7] bg-[#ecece6] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a8a82]">Good starting points</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#5f5f58]">
                <li>• A problem you repeatedly see people struggle with</li>
                <li>• A skill or subject you understand well</li>
                <li>• A specific audience you want to help</li>
                <li>• An existing idea you want to pressure-test</li>
              </ul>
            </div>
          </div>

          <div>
            {errorMessage && (
              <div className="mb-5 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                <p className="font-semibold">We could not create the project.</p>
                <p className="mt-1 break-words">{errorMessage}</p>
              </div>
            )}

            <form action={createProject} className="rounded-[32px] border border-[#deded7] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">Project name</label>
                <input id="name" name="name" required placeholder="e.g. Engineering student productivity" className="w-full rounded-2xl border border-[#d8d8d0] bg-[#fafaf8] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a2a29a] focus:border-[#8f8f86] focus:bg-white" />
              </div>

              <div className="mt-7">
                <label htmlFor="startingPoint" className="mb-2 block text-sm font-semibold">Your starting point</label>
                <textarea id="startingPoint" name="startingPoint" required rows={8} placeholder="Tell us about the audience, skill, industry, problem or idea you want to investigate..." className="w-full resize-none rounded-2xl border border-[#d8d8d0] bg-[#fafaf8] px-4 py-4 text-sm leading-7 outline-none transition placeholder:text-[#a2a29a] focus:border-[#8f8f86] focus:bg-white" />
                <p className="mt-2 text-xs text-[#92928a]">Do not worry about getting this perfect. Research is what comes next.</p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#ededE7] pt-6">
                <p className="hidden max-w-xs text-xs leading-5 text-[#8a8a82] sm:block">We will use this context to plan searches and organize the evidence.</p>
                <button className="ml-auto rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Create research project <span className="ml-2">↗</span></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

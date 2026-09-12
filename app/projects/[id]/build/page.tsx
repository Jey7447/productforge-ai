import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";
import { BuildButton } from "@/components/build-button";

type Product = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  format: string | null;
  target_audience: string | null;
  promise: string | null;
  status: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  learning_outcome: string | null;
  position: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  learning_objective: string | null;
  position: number;
};

type Exercise = {
  id: string;
  module_id: string;
  title: string;
  instructions: string | null;
  completion_criteria: string | null;
};

type Worksheet = {
  id: string;
  module_id: string;
  title: string;
  content: { purpose?: string; prompts?: string[] } | null;
};

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: opportunity } = await supabase.from("opportunities").select("id,title,proposed_product,product_type,target_audience,problem").eq("project_id", id).order("opportunity_score", { ascending: false }).limit(1).maybeSingle();

  const { data: validation } = opportunity
    ? await supabase.from("validation_reports").select("id,decision,confidence_score").eq("project_id", id).eq("opportunity_id", opportunity.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const { data: refinementTest } = opportunity && validation?.decision === "refine"
    ? await supabase.from("validation_tests").select("id,status").eq("project_id", id).eq("opportunity_id", opportunity.id).eq("validation_report_id", validation.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const { data: product } = await supabase.from("products").select("id,name,tagline,description,format,target_audience,promise,status").eq("project_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const typedProduct = product as Product | null;

  const { data: moduleRows } = typedProduct
    ? await supabase.from("modules").select("id,title,description,learning_outcome,position").eq("product_id", typedProduct.id).order("position", { ascending: true })
    : { data: [] };
  const modules = (moduleRows ?? []) as Module[];

  const moduleIds = modules.map((module) => module.id);
  const [{ data: lessonRows }, { data: exerciseRows }, { data: worksheetRows }] = moduleIds.length
    ? await Promise.all([
        supabase.from("lessons").select("id,module_id,title,content,learning_objective,position").in("module_id", moduleIds).order("position", { ascending: true }),
        supabase.from("exercises").select("id,module_id,title,instructions,completion_criteria").in("module_id", moduleIds).order("position", { ascending: true }),
        supabase.from("worksheets").select("id,module_id,title,content").in("module_id", moduleIds).order("position", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const lessons = (lessonRows ?? []) as Lesson[];
  const exercises = (exerciseRows ?? []) as Exercise[];
  const worksheets = (worksheetRows ?? []) as Worksheet[];
  const validatedToBuild = validation?.decision === "proceed" || (validation?.decision === "refine" && refinementTest?.status === "passed");
  const needsRefinement = validation?.decision === "refine" && refinementTest?.status !== "passed";
  const ready = Boolean(typedProduct && modules.length);
  const buildUnlocked = Boolean(validatedToBuild && !ready);

  const moduleContent = modules.map((module) => ({
    module,
    lessons: lessons.filter((lesson) => lesson.module_id === module.id),
    exercise: exercises.find((exercise) => exercise.module_id === module.id),
    worksheet: worksheets.find((worksheet) => worksheet.module_id === module.id),
  }));

  return (
    <StageShell projectId={id} projectName={project.name} active="Build">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">04 · Product builder</p>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Build the product around the evidence.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Turn the validated opportunity into a structured product blueprint with a clear promise, audience, modules, lessons, exercises, and worksheets.</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-xs font-bold ${ready ? "bg-[#dff77a] text-[#171714]" : buildUnlocked ? "bg-[#dff77a] text-[#171714]" : needsRefinement ? "bg-[#fff1b8] text-[#5d4b00]" : "border border-[#deded7] bg-white text-[#73736d]"}`}>
            {ready ? "Blueprint created" : buildUnlocked ? "Ready to build" : needsRefinement ? "Refinement required" : "Awaiting validation"}
          </span>
        </div>

        {buildUnlocked && !typedProduct && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dce88b] bg-[#f5fbd7] px-5 py-4 text-sm text-[#41431f]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#171714] text-xs font-bold text-[#dff77a]">✓</span>
            <span><strong>Validation passed.</strong> The refinement test is complete and Build is unlocked.</span>
          </div>
        )}

        {!opportunity ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8"><p className="text-lg font-semibold">Research is required before building.</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">ProductForge needs a researched opportunity before it can create a product blueprint.</p><Link href={`/projects/${id}`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Back to research →</Link></section>
        ) : !validation ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8"><p className="text-lg font-semibold">Validation is required before building.</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">Pressure-test the opportunity first so the product blueprint is based on an explicit validation decision.</p><Link href={`/projects/${id}/validate`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open validation →</Link></section>
        ) : validation.decision === "abandon" ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8"><p className="text-lg font-semibold">This opportunity is not ready to build.</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">Validation recommends not building this version yet. Review the evidence and refine or select another opportunity before creating a product.</p><Link href={`/projects/${id}/validate`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Review validation →</Link></section>
        ) : needsRefinement ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <aside className="rounded-[30px] bg-[#171714] p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Validation outcome</p><h2 className="mt-3 text-2xl font-semibold">Refine before building.</h2><p className="mt-4 text-sm leading-6 text-white/60">The opportunity has promise, but validation identified an assumption that needs real-world testing before a full product build.</p></aside>
            <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Next build gate</p><h2 className="mt-2 text-3xl font-semibold">Complete the refinement test first.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#73736d]">ProductForge will not let a promising score turn into a premature build. Run the focused validation test, record what you learned, and pass it only when the evidence meets the success criteria.</p><div className="mt-7 rounded-2xl bg-[#fff8dc] p-5"><p className="text-sm font-semibold text-[#5d4b00]">Build is locked until the refinement test passes.</p><p className="mt-2 text-xs leading-5 text-[#73642b]">Current test status: {refinementTest?.status ?? "not created"}.</p></div><Link href={`/projects/${id}/refine`} className="mt-6 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open refinement lab →</Link></div>
          </section>
        ) : !validatedToBuild ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8"><p className="text-lg font-semibold">This opportunity is not ready to build.</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#73736d]">Complete the validation requirements before creating a product blueprint.</p><Link href={`/projects/${id}/validate`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Review validation →</Link></section>
        ) : !typedProduct ? (
          <section className="mt-8 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <aside className="rounded-[30px] bg-[#171714] p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Validated opportunity</p><h2 className="mt-3 text-2xl font-semibold">{opportunity.title}</h2><p className="mt-4 text-sm leading-6 text-white/60">{opportunity.problem || "The validated problem will anchor the product."}</p><div className="mt-8 rounded-2xl bg-white/[.06] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">Proposed direction</p><p className="mt-1 text-sm font-semibold">{opportunity.proposed_product || "Digital product"}</p></div></aside>
            <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">AI product architect</p><h2 className="mt-2 text-3xl font-semibold">Create the first evidence-grounded blueprint.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#73736d]">ProductForge will use the validated opportunity and its research evidence to design the product promise, scope, modules, lessons, exercises, and worksheets. This is the first real content-generation layer of the builder.</p><div className="mt-7 rounded-2xl bg-[#f5f5f2] p-5"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Audience</p><p className="mt-1 text-sm font-semibold">{opportunity.target_audience || "Defined by research"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Format</p><p className="mt-1 text-sm font-semibold">{opportunity.product_type || "Digital product"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Output</p><p className="mt-1 text-sm font-semibold">4–6 modules + practice</p></div></div></div><div className="mt-6"><BuildButton projectId={id} /></div></div>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 lg:grid-cols-[.82fr_1.18fr]">
              <aside className="rounded-[30px] bg-[#171714] p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Product concept</p><h2 className="mt-3 text-3xl font-semibold">{typedProduct.name}</h2><p className="mt-2 text-sm font-medium text-[#d9f06a]">{typedProduct.tagline}</p><p className="mt-5 text-sm leading-7 text-white/60">{typedProduct.description}</p><div className="mt-8 rounded-2xl bg-white/[.06] p-5"><p className="text-[10px] uppercase tracking-wider text-white/40">Product promise</p><p className="mt-2 text-sm leading-6 text-white/80">{typedProduct.promise}</p></div></aside>
              <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Blueprint architecture</p><h2 className="mt-2 text-2xl font-semibold">A complete first version</h2></div><span className="rounded-full bg-[#dff77a] px-3 py-2 text-xs font-bold text-[#171714]">{modules.length} modules · {lessons.length} lessons</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{moduleContent.map(({ module, lessons: moduleLessons }) => <div key={module.id} className="rounded-2xl bg-[#f5f5f2] p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#999991]">{String(module.position).padStart(2, "0")}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-[#999991]">{moduleLessons.length} lessons</span></div><h3 className="mt-3 text-lg font-semibold">{module.title}</h3><p className="mt-2 text-xs leading-5 text-[#73736d]">{module.learning_outcome}</p></div>)}</div></div>
            </section>

            <section className="mt-5 rounded-[30px] border border-[#deded7] bg-white p-7">
              <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Curriculum</p><h2 className="mt-2 text-3xl font-semibold">Inside the product</h2></div><p className="max-w-md text-right text-xs leading-5 text-[#73736d]">Every module connects explanation to practice, so the blueprint can become a finished product rather than a collection of topics.</p></div>
              <div className="mt-7 space-y-4">
                {moduleContent.map(({ module, lessons: moduleLessons, exercise, worksheet }) => (
                  <article key={module.id} className="overflow-hidden rounded-[24px] border border-[#e5e5de]">
                    <div className="bg-[#fafaf8] p-6"><div className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#171714] text-xs font-bold text-[#d9f06a]">{String(module.position).padStart(2, "0")}</span><div><h3 className="text-xl font-semibold">{module.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#73736d]">{module.description}</p><p className="mt-3 text-xs font-semibold text-[#565650]">Outcome: {module.learning_outcome}</p></div></div></div>
                    <div className="grid gap-px bg-[#e5e5de] lg:grid-cols-[1.25fr_.75fr]">
                      <div className="space-y-px bg-[#e5e5de]">{moduleLessons.map((lesson) => <div key={lesson.id} className="bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#999991]">Lesson {lesson.position}</p><h4 className="mt-2 text-base font-semibold">{lesson.title}</h4><p className="mt-2 text-xs font-medium text-[#565650]">Objective: {lesson.learning_objective}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#73736d]">{lesson.content}</p></div>)}</div>
                      <div className="space-y-px bg-[#e5e5de]"><div className="bg-[#171714] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Practice</p><h4 className="mt-2 text-base font-semibold">{exercise?.title || "Practical exercise"}</h4><p className="mt-3 text-xs leading-5 text-white/60">{exercise?.instructions}</p><div className="mt-4 rounded-xl bg-white/[.06] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">Completion criteria</p><p className="mt-2 text-xs leading-5 text-white/75">{exercise?.completion_criteria}</p></div></div><div className="bg-[#dff77a] p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#58620e]">Worksheet</p><h4 className="mt-2 text-base font-semibold">{worksheet?.title || "Application worksheet"}</h4><p className="mt-2 text-xs leading-5 text-[#41431f]">{worksheet?.content?.purpose}</p><div className="mt-4 space-y-2">{(worksheet?.content?.prompts ?? []).map((prompt, index) => <div key={`${worksheet?.id ?? module.id}-${index}`} className="rounded-xl bg-white/60 px-3 py-2 text-xs font-medium text-[#41431f]">{index + 1}. {prompt}</div>)}</div></div></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-[30px] bg-[#d9f06a] p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#58620e]">Blueprint complete</p><h2 className="mt-2 text-3xl font-semibold">The structure is built. Next comes packaging and launch.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#41431f]">The product now has a research-grounded promise, curriculum architecture, lessons, practical exercises, and worksheets. The next layer is turning this blueprint into polished deliverables and a launch plan.</p><div className="mt-6 flex flex-wrap gap-3"><Link href={`/projects/${id}/launch`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open launch advisor →</Link><Link href={`/projects/${id}/validate`} className="rounded-full border border-[#171714]/20 px-5 py-3 text-sm font-semibold text-[#171714]">Review validation</Link></div></section>
          </>
        )}
      </div>
    </StageShell>
  );
}

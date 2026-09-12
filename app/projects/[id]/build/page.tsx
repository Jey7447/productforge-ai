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
  const { data: moduleRows } = typedProduct ? await supabase.from("modules").select("id,title,description,learning_outcome,position").eq("product_id", typedProduct.id).order("position", { ascending: true }) : { data: [] };
  const modules = (moduleRows ?? []) as Module[];
  const ready = Boolean(typedProduct && modules.length);
  const validatedToBuild = validation?.decision === "proceed" || (validation?.decision === "refine" && refinementTest?.status === "passed");
  const needsRefinement = validation?.decision === "refine" && refinementTest?.status !== "passed";

  return (
    <StageShell projectId={id} projectName={project.name} active="Build">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">04 · Product builder</p>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Build the product around the evidence.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Turn the validated opportunity into a structured product blueprint with a clear promise, audience, modules, lessons, exercises, and worksheets.</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-xs font-bold ${ready ? "bg-[#dff77a] text-[#171714]" : needsRefinement ? "bg-[#fff1b8] text-[#5d4b00]" : "border border-[#deded7] bg-white text-[#73736d]"}`}>
            {ready ? "Blueprint created" : needsRefinement ? "Refinement required" : "Awaiting validation"}
          </span>
        </div>

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
            <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Next build step</p><h2 className="mt-2 text-3xl font-semibold">Create the first product blueprint.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#73736d]">ProductForge will create the product record and a structured four-module foundation. This first pass is deterministic and grounded in the opportunity; AI-assisted expansion can be added later.</p><div className="mt-7 rounded-2xl bg-[#f5f5f2] p-5"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Audience</p><p className="mt-1 text-sm font-semibold">{opportunity.target_audience || "Defined by research"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Format</p><p className="mt-1 text-sm font-semibold">{opportunity.product_type || "Digital product"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[#999991]">Foundation</p><p className="mt-1 text-sm font-semibold">4 modules + practice</p></div></div></div><div className="mt-6"><BuildButton projectId={id} /></div></div>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
              <aside className="rounded-[30px] bg-[#171714] p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Product concept</p><h2 className="mt-3 text-2xl font-semibold">{typedProduct.name}</h2><p className="mt-2 text-sm font-medium text-[#d9f06a]">{typedProduct.tagline}</p><p className="mt-4 text-sm leading-6 text-white/60">{typedProduct.description}</p><div className="mt-8 rounded-2xl bg-white/[.06] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">Product promise</p><p className="mt-2 text-sm leading-6 text-white/80">{typedProduct.promise}</p></div></aside>
              <div className="rounded-[30px] border border-[#deded7] bg-white p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Product structure</p><h2 className="mt-2 text-2xl font-semibold">Suggested modules</h2></div><span className="rounded-full bg-[#f5f5f2] px-3 py-2 text-xs font-semibold">{modules.length} modules</span></div><div className="mt-6 space-y-3">{modules.map((module) => <article key={module.id} className="pf-card-hover rounded-2xl border border-[#e5e5de] bg-[#fafaf8] p-5"><div className="flex gap-4"><span className="text-xs font-bold text-[#999991]">{String(module.position).padStart(2, "0")}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{module.title}</h3><p className="mt-1 text-xs leading-5 text-[#73736d]">{module.description}</p><p className="mt-3 text-xs font-medium text-[#565650]">Outcome: {module.learning_outcome}</p></div></div></article>)}</div></div>
            </section>
            <section className="mt-5 rounded-[30px] bg-[#d9f06a] p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#58620e]">Blueprint status</p><h2 className="mt-2 text-2xl font-semibold">The foundation is built. Now make it yours.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#41431f]">The database now contains the product, module, lesson, exercise, and worksheet structure. The next layer is editing, expanding content, and packaging the finished product for launch.</p><div className="mt-6 flex flex-wrap gap-3"><Link href={`/projects/${id}/launch`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open launch advisor →</Link><Link href={`/projects/${id}/validate`} className="rounded-full border border-[#171714]/20 px-5 py-3 text-sm font-semibold text-[#171714]">Review validation</Link></div></section>
          </>
        )}
      </div>
    </StageShell>
  );
}

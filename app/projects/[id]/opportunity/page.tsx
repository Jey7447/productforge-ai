import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,niche,target_audience,problem,proposed_product,product_type,rationale,opportunity_score,confidence_score,demand_score,problem_intensity_score,competition_gap_score,monetization_score,specificity_score,buildability_score,estimated_price_min,estimated_price_max")
    .eq("project_id", id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const score = Math.round(Number(opportunity?.opportunity_score ?? 0));
  const confidence = Math.round(Number(opportunity?.confidence_score ?? 0));
  const metrics = [
    ["Demand", opportunity?.demand_score],
    ["Problem intensity", opportunity?.problem_intensity_score],
    ["Competition gap", opportunity?.competition_gap_score],
    ["Monetization", opportunity?.monetization_score],
    ["Specificity", opportunity?.specificity_score],
    ["Buildability", opportunity?.buildability_score],
  ] as const;

  return (
    <StageShell projectId={id} projectName={project.name} active="Opportunity">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">02 · Opportunity detail</p>
        <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="pf-display max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">
              {opportunity?.title ?? "Find the strongest opportunity."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">
              {opportunity?.problem ?? "ProductForge will rank the strongest product opportunities after successful research."}
            </p>
          </div>
          {opportunity && (
            <div className="rounded-[28px] bg-[#171714] p-5 text-white lg:min-w-52">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Opportunity score</p>
              <p className="mt-2 text-5xl font-semibold text-[#d9f06a]">{score}<span className="text-lg text-white/40">/100</span></p>
              <p className="mt-2 text-xs text-white/45">{confidence}% confidence</p>
            </div>
          )}
        </div>

        {!opportunity ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">No opportunity has been generated yet.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">
              Complete the research stage first. ProductForge will use collected market evidence to generate and rank distinct product opportunities here.
            </p>
            <Link href={`/projects/${id}`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">
              Back to research →
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-[30px] border border-[#deded7] bg-white p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">The hypothesis</p>
                <h2 className="mt-2 text-2xl font-semibold">What could be built</h2>
                <p className="mt-5 text-sm leading-7 text-[#5f5f58]">{opportunity.proposed_product ?? "The research engine did not record a product concept."}</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f5f5f2] p-4"><p className="text-[10px] uppercase tracking-wider text-[#999991]">Audience</p><p className="mt-2 text-sm font-semibold">{opportunity.target_audience ?? "Defined from research"}</p></div>
                  <div className="rounded-2xl bg-[#f5f5f2] p-4"><p className="text-[10px] uppercase tracking-wider text-[#999991]">Product type</p><p className="mt-2 text-sm font-semibold">{opportunity.product_type ?? "Digital product"}</p></div>
                </div>
              </section>
              <section className="rounded-[30px] border border-[#deded7] bg-[#ecece6] p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Score breakdown</p>
                <div className="mt-5 space-y-4">
                  {metrics.map(([label, value]) => {
                    const numeric = Math.round(Number(value ?? 0));
                    return <div key={label}><div className="flex justify-between text-xs"><span className="text-[#73736d]">{label}</span><b>{numeric}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${numeric}%` }} /></div></div>;
                  })}
                </div>
              </section>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Link href={`/projects/${id}`} className="rounded-full border border-[#d5d5cd] bg-white px-5 py-3 text-sm font-semibold">Back to research</Link>
              <Link href={`/projects/${id}/validate`} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Validate this opportunity →</Link>
            </div>
          </>
        )}
      </div>
    </StageShell>
  );
}

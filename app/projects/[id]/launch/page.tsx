import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LaunchWorkspace } from "@/components/launch-workspace";
import { StageShell } from "@/components/stage-shell";

type Product = { id: string; name: string; tagline: string | null; promise: string | null };

type LaunchPlan = { id: string; status: string; plan: Record<string, unknown> };

export default async function LaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id,name,tagline,promise")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const typedProduct = product as Product | null;

  const { data: launchPlan } = await supabase
    .from("launch_plans")
    .select("id,status,plan")
    .eq("project_id", id)
    .maybeSingle();

  return (
    <StageShell projectId={id} projectName={project.name} active="Launch">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">05 · Launch advisor</p>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Take the product to market.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Turn the validated opportunity and finished product into a focused launch hypothesis, channel plan, offer, checklist, and learning loop.</p>
          </div>
          <span className="rounded-full bg-[#dff77a] px-4 py-2 text-xs font-bold text-[#171714]">{launchPlan ? "Launch plan ready" : "Ready to plan"}</span>
        </div>

        {!typedProduct ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">A product blueprint is required before launch planning.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Complete validation and create the product blueprint first. The launch advisor should work from a real product rather than an unvalidated idea.</p>
            <Link href={`/projects/${id}/build`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product builder →</Link>
          </section>
        ) : (
          <LaunchWorkspace projectId={id} product={typedProduct} initialPlan={launchPlan as LaunchPlan | null} />
        )}
      </div>
    </StageShell>
  );
}

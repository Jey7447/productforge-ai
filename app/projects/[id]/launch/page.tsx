import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StageShell } from "@/components/stage-shell";

type Product = { id: string; name: string; tagline: string | null };

const launchBlocks = [
  ["Go-to-market strategy", "Choose the first audience, channel and message based on the strongest research signals."],
  ["Target audience", "Define who needs the product most and where they already look for solutions."],
  ["Pricing strategy", "Set a testable price hypothesis and learn from real buyer response."],
  ["Launch checklist", "Prepare the offer, landing page, content, outreach and feedback loop."],
  ["Growth loop", "Capture results after launch and feed them back into product decisions."],
];

export default async function LaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!project) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id,name,tagline")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("title,estimated_price_min,estimated_price_max")
    .eq("project_id", id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedProduct = product as Product | null;

  return (
    <StageShell projectId={id} projectName={project.name} active="Launch">
      <div className="pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">05 · Launch advisor</p>
        <h1 className="pf-display mt-3 max-w-4xl text-5xl font-semibold leading-[.94] sm:text-6xl">Take the product to market.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#73736d]">Launch guidance will stay connected to the opportunity, audience and evidence that shaped the product.</p>

        {!typedProduct ? (
          <section className="mt-8 rounded-[30px] border border-[#deded7] bg-white p-8">
            <p className="text-lg font-semibold">A product blueprint is required before launch planning.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Complete validation and create the product blueprint first. The launch advisor should work from a real product rather than an unvalidated idea.</p>
            <Link href={`/projects/${id}/build`} className="mt-5 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Open product builder →</Link>
          </section>
        ) : (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-3">
                {launchBlocks.map(([title, desc], i) => (
                  <article key={title} className="pf-card-hover rounded-[26px] border border-[#deded7] bg-white p-6">
                    <div className="flex items-start gap-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#171714] text-xs font-bold text-[#d9f06a]">0{i + 1}</span>
                      <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#73736d]">{desc}</p></div>
                      <span className="ml-auto text-[#b0b0a7]">↗</span>
                    </div>
                  </article>
                ))}
              </div>
              <aside className="rounded-[30px] bg-[#dff77a] p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#536400]">Launch brief</p>
                <h2 className="mt-3 text-2xl font-semibold">{typedProduct.name}</h2>
                <p className="mt-2 text-sm font-medium text-[#536400]">{typedProduct.tagline}</p>
                <div className="mt-8 rounded-2xl bg-white/70 p-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#73736d]">Price hypothesis</p>
                  <p className="mt-2 text-3xl font-semibold">{opportunity?.estimated_price_min != null ? `${opportunity.estimated_price_min} – ${opportunity.estimated_price_max ?? opportunity.estimated_price_min}` : "To be researched"}</p>
                </div>
                <div className="mt-3 rounded-2xl bg-[#171714] p-5 text-white"><p className="text-sm font-semibold">Research → Product → Launch</p><p className="mt-2 text-xs leading-5 text-white/50">The final advisor will connect messaging and channels to the evidence behind this product.</p></div>
              </aside>
            </div>

            <div className="mt-8 rounded-[30px] bg-[#171714] p-8 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">The long-term loop</p>
              <h2 className="pf-display mt-3 max-w-3xl text-4xl font-semibold">Launch. Learn. Improve. Repeat.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">ProductForge is designed to keep market learning attached to the next product decision.</p>
            </div>
            <div className="mt-5 flex justify-end"><Link href={`/projects/${id}/build`} className="rounded-full border border-[#d5d5cd] bg-white px-5 py-3 text-sm font-semibold">← Product builder</Link></div>
          </>
        )}
      </div>
    </StageShell>
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type EvidenceRow = {
  source_domain: string | null;
  title: string | null;
  snippet: string | null;
  content_excerpt: string | null;
  credibility_score: number | null;
  relevance_score: number | null;
};

function clean(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Number(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project } = await supabase
    .from("projects")
    .select("id,name")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: product } = await supabase
    .from("products")
    .select("id,name,tagline,description,format,target_audience,promise")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "Create the product blueprint before generating a launch plan." }, { status: 400 });

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,problem,proposed_product,target_audience,product_type,estimated_price_min,estimated_price_max,confidence_score,opportunity_score")
    .eq("project_id", project.id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestRun, error: latestRunError } = await supabase
    .from("research_runs")
    .select("id")
    .eq("project_id", project.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRunError) return NextResponse.json({ error: `Unable to locate completed research: ${latestRunError.message}` }, { status: 500 });

  let rows: EvidenceRow[] = [];
  let evidenceCount = 0;
  let domains: string[] = [];

  if (opportunity?.id) {
    const { data: opportunityEvidence, error: evidenceError } = await supabase
      .from("research_evidence")
      .select("source_domain,title,snippet,content_excerpt,credibility_score,relevance_score")
      .eq("opportunity_id", opportunity.id)
      .order("relevance_score", { ascending: false, nullsFirst: false })
      .limit(20);
    if (evidenceError) return NextResponse.json({ error: `Unable to load launch evidence: ${evidenceError.message}` }, { status: 500 });
    rows = (opportunityEvidence ?? []) as EvidenceRow[];
  }

  if (!rows.length && latestRun?.id) {
    const { data: runEvidence, error: runEvidenceError, count: runEvidenceCount } = await supabase
      .from("research_evidence")
      .select("source_domain,title,snippet,content_excerpt,credibility_score,relevance_score", { count: "exact" })
      .eq("research_run_id", latestRun.id)
      .order("relevance_score", { ascending: false, nullsFirst: false })
      .limit(20);
    if (runEvidenceError) return NextResponse.json({ error: `Unable to load completed research evidence: ${runEvidenceError.message}` }, { status: 500 });
    rows = (runEvidence ?? []) as EvidenceRow[];
    evidenceCount = runEvidenceCount ?? 0;
  }

  if (!evidenceCount && latestRun?.id) {
    const { count: exactCount, error: countError } = await supabase
      .from("research_evidence")
      .select("id", { count: "exact", head: true })
      .eq("research_run_id", latestRun.id);
    if (countError) return NextResponse.json({ error: `Unable to count research evidence: ${countError.message}` }, { status: 500 });
    evidenceCount = exactCount ?? 0;
  }

  if (!evidenceCount) evidenceCount = rows.length;
  domains = Array.from(new Set(rows.map((row) => row.source_domain).filter(Boolean))) as string[];

  if (latestRun?.id) {
    const { data: runDomains, error: domainError } = await supabase
      .from("research_evidence")
      .select("source_domain")
      .eq("research_run_id", latestRun.id)
      .not("source_domain", "is", null);
    if (domainError) return NextResponse.json({ error: `Unable to summarize research domains: ${domainError.message}` }, { status: 500 });
    domains = Array.from(new Set((runDomains ?? []).map((row) => row.source_domain).filter(Boolean))) as string[];
  }

  const audience = clean(product.target_audience || opportunity?.target_audience, "the target audience identified in the research");
  const problem = clean(opportunity?.problem, "the validated problem");
  const productName = clean(product.name, "the product");
  const productFormat = clean(product.format || opportunity?.product_type, "digital product");
  const minPrice = money(opportunity?.estimated_price_min);
  const maxPrice = money(opportunity?.estimated_price_max);

  const plan = {
    evidence: {
      evidenceCount,
      sourceDomains: domains,
      note: evidenceCount
        ? `Launch recommendations are grounded in ${evidenceCount} research evidence item${evidenceCount === 1 ? "" : "s"}${domains.length ? ` across ${domains.length} source domain${domains.length === 1 ? "" : "s"}` : ""}.`
        : "No completed research evidence was available, so this plan should be treated as a starting hypothesis.",
    },
    audience: {
      primary: audience,
      problem: sentence(problem),
      buyerTrigger: `The audience is most likely to act when the cost of the current problem feels immediate and the first step toward a solution is concrete. Position ${productName} around solving the validated problem rather than around a broad topic.`,
    },
    positioning: {
      headline: clean(product.tagline, `A focused ${productFormat.toLowerCase()} for ${audience}`),
      message: `For ${audience} who struggle with ${problem.toLowerCase()}, ${productName} provides a focused, practical path toward a clearer outcome without adding unnecessary complexity.`,
      proofRule: "Use real user outcomes, demonstrations, testimonials, or research evidence as proof. Do not invent testimonials, statistics, urgency, or guarantees.",
    },
    channels: [
      { name: "Problem-led educational content", why: "Start where the audience already experiences the problem. Teach one small part of the method, then invite the reader to use the full product.", firstAction: `Create three short pieces explaining different angles of ${problem.toLowerCase()} and end each with one practical action from the product.` },
      { name: "Community conversations", why: "Use relevant communities as listening and feedback environments rather than dropping promotional links.", firstAction: `Identify communities where ${audience} already discusses the validated problem. Answer questions with useful guidance and record recurring objections or language.` },
      { name: "Direct audience outreach", why: "A first launch benefits from direct learning before scaling acquisition.", firstAction: `Invite a small, relevant group of people who fit the audience to review the offer or try the product, then ask what made them interested, hesitant, or confused.` },
    ],
    pricing: {
      hypothesis: minPrice != null ? `${minPrice}${maxPrice != null ? ` – ${maxPrice}` : ""}` : "Test a price after a small buyer-response experiment.",
      rule: "Treat price as a hypothesis, not a fact. Test willingness to pay with real audience response and compare conversion, objections, and perceived value.",
    },
    launchOffer: {
      coreOffer: productName,
      format: productFormat,
      promise: clean(product.promise, `Help ${audience} make practical progress on the validated problem.`),
      assets: ["A focused sales page with the problem, outcome, method, scope, and proof", "A short product preview or sample lesson", "Three problem-led educational posts", "A simple feedback form or interview script", "A clear call to action with the tested price hypothesis"],
    },
    checklist: [
      { item: "Clarify the one-sentence offer", done: false },
      { item: "Create the sales page and product preview", done: false },
      { item: "Prepare three problem-led educational pieces", done: false },
      { item: "Choose two communities or audience spaces to learn from", done: false },
      { item: "Invite a small first cohort or set of reviewers", done: false },
      { item: "Collect objections, questions, and outcome evidence", done: false },
      { item: "Review conversion and feedback before scaling", done: false },
    ],
    fourteenDayPlan: [
      { days: "1–2", focus: "Offer", action: "Write the positioning statement, define the audience, and finish the sales-page structure." },
      { days: "3–4", focus: "Proof", action: "Prepare a product preview and demonstrate the method with one useful example." },
      { days: "5–7", focus: "Learning", action: "Publish problem-led content and have genuine conversations with people in the target audience." },
      { days: "8–10", focus: "First launch", action: "Invite a small relevant audience to buy, review, or test the product using the price hypothesis." },
      { days: "11–12", focus: "Feedback", action: "Collect objections, questions, completion friction, and evidence of useful outcomes." },
      { days: "13–14", focus: "Improve", action: "Update the offer and product based on observed evidence, then decide whether to repeat, refine, or change channel." },
    ],
    metrics: ["Qualified people reached", "Sales-page visits", "Offer-to-purchase conversion", "Common objections", "Product completion or usage", "Observed user outcomes", "Repeat interest or referrals"],
    nextLoop: "Launch → observe real response → capture evidence → improve the offer/product → repeat.",
  };

  // Refreshing the plan must not erase real launch progress or recorded
  // learning. The generated strategy can change; the user's evidence log
  // belongs to the project and is therefore carried forward.
  const { data: existing } = await supabase
    .from("launch_plans")
    .select("id,plan")
    .eq("project_id", project.id)
    .maybeSingle();

  const existingPlan = (existing?.plan ?? {}) as Record<string, any>;
  if (Array.isArray(existingPlan.checklist)) plan.checklist = existingPlan.checklist;
  if (existingPlan.launchLearning && typeof existingPlan.launchLearning === "object") {
    plan.launchLearning = existingPlan.launchLearning;
  }

  const payload = { project_id: project.id, product_id: product.id, opportunity_id: opportunity?.id ?? null, status: "ready", plan };
  const result = existing
    ? await supabase.from("launch_plans").update(payload).eq("id", existing.id).select("id,plan,status").single()
    : await supabase.from("launch_plans").insert(payload).select("id,plan,status").single();

  if (result.error || !result.data) return NextResponse.json({ error: `Unable to save launch plan: ${result.error?.message ?? "Unknown error"}` }, { status: 500 });

  await supabase.from("projects").update({ current_stage: 5 }).eq("id", project.id).eq("user_id", user.id);
  return NextResponse.json({ created: !existing, ...result.data });
}

function sentence(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return !trimmed ? "" : /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Opportunity = {
  id: string;
  title: string;
  target_audience: string | null;
  problem: string | null;
  proposed_product: string | null;
  product_type: string | null;
};

type ValidationReport = { id: string; decision: "proceed" | "refine" | "abandon" | null };
type EvidenceRow = { id: string; source_domain: string | null; title: string | null; content_excerpt: string | null; snippet: string | null; credibility_score: number | null; relevance_score: number | null };
type ModuleBlueprint = {
  title: string;
  description: string;
  learningOutcome: string;
  lessons: { title: string; objective: string; content: string }[];
  exercise: { title: string; instructions: string; completionCriteria: string };
  worksheet: { title: string; purpose: string; prompts: string[] };
};

function clean(value: string | null | undefined, fallback: string) { const normalized = value?.trim(); return normalized || fallback; }
function sentence(value: string) { const trimmed = value.trim().replace(/\s+/g, " "); return !trimmed ? "" : /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`; }

function buildBlueprint(opportunity: Opportunity, evidence: EvidenceRow[]) {
  const audience = clean(opportunity.target_audience, "the target audience identified in the research");
  const problem = clean(opportunity.problem, "the problem identified during validation");
  const proposedProduct = clean(opportunity.proposed_product, "a focused digital guide");
  const productType = clean(opportunity.product_type, "digital guide");
  const title = clean(opportunity.title, "Validated Opportunity");
  const modules: ModuleBlueprint[] = [
    { title: "Define the real problem", description: `Turn the validated problem into a precise starting point for ${audience}.`, learningOutcome: "A clear problem statement, target-user context, and desired outcome.", lessons: [{ title: "Clarify the problem", objective: `Separate the core problem from symptoms for ${audience}.`, content: `Start with the validated problem: ${sentence(problem)}\n\nMap the situation before recommending solutions. Identify the task, friction point, and observable outcome. Keep factual claims inside the research boundary.` }, { title: "Define the outcome", objective: "Translate the problem into a concrete result.", content: `Define a practical before-and-after state tied to ${sentence(proposedProduct)} The outcome should be observable and useful without unsupported promises.` }], exercise: { title: "Problem-to-outcome map", instructions: "Create a one-page map covering the target user, current problem, root friction, desired observable outcome, and one assumption that still needs testing.", completionCriteria: "The map contains one focused audience, problem, root friction, outcome, and testable assumption." }, worksheet: { title: "Problem clarity worksheet", purpose: "Turn the validated opportunity into a focused product brief.", prompts: ["Who specifically is this product for?", "What problem are they trying to solve?", "What is the clearest sign that the problem is happening?", "What would useful improvement look like?", "Which assumption still needs testing?"] } },
    { title: "Build the core method", description: `Create the smallest repeatable method that helps ${audience} move toward the desired outcome.`, learningOutcome: "A simple sequence of actions with clear outputs.", lessons: [{ title: "Choose the essential steps", objective: "Reduce the solution to the smallest useful sequence.", content: `Start from the desired outcome and work backward. For ${title}, keep only actions that materially contribute to solving the validated problem.` }, { title: "Make the method usable", objective: "Convert the method into instructions a real user can follow.", content: `For each step, specify what to do, when to do it, what to look for, and what to produce. Fit the method to ${productType}.` }], exercise: { title: "Draft the minimum viable method", instructions: "Write a 4–7 step method. For every step, specify the action, expected output, and one likely point of confusion. Remove steps that do not support the target outcome.", completionCriteria: "A complete 4–7 step sequence exists with a concrete output for every step." }, worksheet: { title: "Method design worksheet", purpose: "Turn the opportunity into a repeatable process.", prompts: ["What is the first action?", "What must be true before the next step?", "What output should each step produce?", "Where is the process likely to stall?", "Which step can be simplified?"] } },
    { title: "Practice the method", description: "Move from explanation to guided application so the user produces real work.", learningOutcome: "A completed first application with friction points identified.", lessons: [{ title: "Apply it to a real task", objective: "Use the method on a realistic task from the user's context.", content: "Choose a task that closely matches the validated problem. Work through the method one step at a time and record the decisions made." }, { title: "Review the result", objective: "Evaluate the first attempt against observable criteria.", content: "Compare the result with the outcome defined earlier. Identify what worked, what remained incomplete, and where the user experienced friction." }], exercise: { title: "Complete a guided application", instructions: "Choose one real task related to the validated problem. Complete the method from start to finish, recording decisions, questions, friction points, and the resulting output.", completionCriteria: "One real task is completed using the method and the main friction points are recorded." }, worksheet: { title: "Guided practice sheet", purpose: "Capture the first practical application and make improvement visible.", prompts: ["What task are you applying the method to?", "What did you do at each step?", "Where did you hesitate or get stuck?", "What result did you produce?", "What would you change next time?"] } },
    { title: "Strengthen the workflow", description: `Turn the first application into a repeatable workflow for ${audience}.`, learningOutcome: "A personalized workflow with checkpoints and a review loop.", lessons: [{ title: "Remove avoidable friction", objective: "Identify unnecessary effort, confusion, or sequencing problems.", content: "Review the first application for unclear instructions, missing preparation, unnecessary steps, or difficult-to-evaluate results. Prioritize friction that affects the validated outcome." }, { title: "Create checkpoints", objective: "Add simple checks that show whether the workflow is working.", content: "For each major stage, define a checkpoint that tells the user whether the input is ready, the expected output exists, or a correction is needed." }], exercise: { title: "Design the repeatable workflow", instructions: "Rewrite the core method as a workflow with preparation, actionable steps, checkpoints, and a final review. Keep only elements that materially support the validated outcome.", completionCriteria: "The workflow includes preparation, actionable steps, at least three checkpoints, and a final review." }, worksheet: { title: "Workflow optimization worksheet", purpose: "Make the product's method easier to repeat consistently.", prompts: ["What should be prepared first?", "Which step creates the most friction?", "What checkpoint says continue?", "What checkpoint says correct course?", "What can be simplified?"] } },
    { title: "Turn progress into a system", description: "Finish with an implementation plan that helps the user continue after the initial product experience.", learningOutcome: "A practical implementation plan and improvement loop.", lessons: [{ title: "Create the implementation plan", objective: "Turn the workflow into a realistic short-term action plan.", content: "Build a plan around the user's actual context. Select the smallest set of actions that can demonstrate progress toward the validated outcome." }, { title: "Review, learn, improve", objective: "Establish a lightweight loop for continued improvement.", content: "Use a simple loop: apply the method, observe the result, identify friction, adjust the workflow, and repeat." }], exercise: { title: "Build the implementation plan", instructions: "Create a short plan covering the first action, repeatable routine, checkpoints, review step, and evidence that would indicate progress on the original problem.", completionCriteria: "A concrete plan exists with actions, checkpoints, and a review loop tied to the original outcome." }, worksheet: { title: "Implementation and review worksheet", purpose: "Convert the product into a repeatable improvement system.", prompts: ["What is the first action?", "What will you repeat?", "What evidence will show progress?", "What will you change if progress stalls?", "What should you review next?"] } },
  ];
  const domains = Array.from(new Set(evidence.map((item) => item.source_domain).filter(Boolean)));
  return { name: title, tagline: `A focused ${productType.toLowerCase()} for ${audience}`, description: `A practical first-version product built around the validated opportunity: ${sentence(problem)}${evidence.length ? ` Grounded in ${evidence.length} research evidence item${evidence.length === 1 ? "" : "s"}${domains.length ? ` across ${domains.length} source domain${domains.length === 1 ? "" : "s"}` : ""}.` : ""}`, format: productType, targetAudience: audience, promise: `Help ${audience} move from ${problem.toLowerCase()} toward a clear, practical outcome using a focused method they can apply and repeat.`, modules };
}

async function loadEvidence(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, opportunityId: string) {
  const { data, error } = await supabase.from("research_evidence").select("id,source_domain,title,content_excerpt,snippet,credibility_score,relevance_score").eq("opportunity_id", opportunityId).order("credibility_score", { ascending: false, nullsFirst: false }).limit(30);
  if (error) throw new Error(`Unable to load opportunity evidence: ${error.message}`);
  if (data?.length) return data as EvidenceRow[];
  const { data: latestRun, error: latestRunError } = await supabase.from("research_runs").select("id").eq("project_id", projectId).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latestRunError) throw new Error(`Unable to locate completed research: ${latestRunError.message}`);
  if (!latestRun) return [];
  const { data: fallback, error: fallbackError } = await supabase.from("research_evidence").select("id,source_domain,title,content_excerpt,snippet,credibility_score,relevance_score").eq("research_run_id", latestRun.id).order("credibility_score", { ascending: false, nullsFirst: false }).limit(30);
  if (fallbackError) throw new Error(`Unable to load research evidence: ${fallbackError.message}`);
  return (fallback ?? []) as EvidenceRow[];
}

async function removePartialProduct(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data: modules } = await supabase.from("modules").select("id").eq("product_id", productId);
  const moduleIds = (modules ?? []).map((module) => module.id);
  if (moduleIds.length) {
    await supabase.from("exercises").delete().in("module_id", moduleIds);
    await supabase.from("worksheets").delete().in("module_id", moduleIds);
    await supabase.from("lessons").delete().in("module_id", moduleIds);
    await supabase.from("modules").delete().in("id", moduleIds);
  }
  await supabase.from("products").delete().eq("id", productId);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project, error: projectError } = await supabase.from("projects").select("id,name").eq("id", body.projectId).eq("user_id", user.id).single();
  if (projectError || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // The selected opportunity is authoritative. Legacy projects fall back to the leader.
  const { data: selectedOpportunity } = await supabase.from("opportunities").select("id,title,target_audience,problem,proposed_product,product_type").eq("project_id", project.id).eq("status", "selected").limit(1).maybeSingle();
  const { data: fallbackOpportunity } = !selectedOpportunity ? await supabase.from("opportunities").select("id,title,target_audience,problem,proposed_product,product_type").eq("project_id", project.id).order("opportunity_score", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const opportunity = selectedOpportunity ?? fallbackOpportunity;
  if (!opportunity) return NextResponse.json({ error: "Complete research before building a product blueprint." }, { status: 400 });

  const { data: validation, error: validationError } = await supabase.from("validation_reports").select("id,decision").eq("project_id", project.id).eq("opportunity_id", opportunity.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (validationError) return NextResponse.json({ error: `Unable to load validation: ${validationError.message}` }, { status: 500 });
  if (!validation) return NextResponse.json({ error: "Validate the opportunity before generating a product blueprint." }, { status: 400 });
  const typedValidation = validation as ValidationReport;
  if (typedValidation.decision === "abandon") return NextResponse.json({ error: "This opportunity was marked for abandonment. Refine or select another opportunity before building." }, { status: 400 });

  let refinementPassed = false;
  if (typedValidation.decision === "refine") {
    const { data: refinementTest, error: refinementError } = await supabase.from("validation_tests").select("id,status").eq("project_id", project.id).eq("opportunity_id", opportunity.id).eq("validation_report_id", typedValidation.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (refinementError) return NextResponse.json({ error: `Unable to verify refinement test: ${refinementError.message}` }, { status: 500 });
    refinementPassed = refinementTest?.status === "passed";
  }
  if (typedValidation.decision !== "proceed" && !refinementPassed) return NextResponse.json({ error: "The opportunity must pass validation before a product blueprint can be generated." }, { status: 400 });

  const { data: existingProduct } = await supabase.from("products").select("id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingProduct) {
    const { count } = await supabase.from("modules").select("id", { count: "exact", head: true }).eq("product_id", existingProduct.id);
    if ((count ?? 0) > 0) return NextResponse.json({ productId: existingProduct.id, created: false });
    await removePartialProduct(supabase, existingProduct.id);
  }

  const evidence = await loadEvidence(supabase, project.id, opportunity.id);
  if (!evidence.length) return NextResponse.json({ error: "Product generation requires research evidence for the selected opportunity." }, { status: 400 });

  const blueprint = buildBlueprint(opportunity as Opportunity, evidence);
  const { data: product, error: productError } = await supabase.from("products").insert({ project_id: project.id, name: blueprint.name, tagline: blueprint.tagline, description: blueprint.description, format: blueprint.format, target_audience: blueprint.targetAudience, promise: blueprint.promise, status: "in_progress" }).select("id").single();
  if (productError || !product) return NextResponse.json({ error: productError?.message ?? "Unable to create product blueprint" }, { status: 500 });

  try {
    let lessonCount = 0;
    for (const [moduleIndex, moduleBlueprint] of blueprint.modules.entries()) {
      const { data: module, error: moduleError } = await supabase.from("modules").insert({ product_id: product.id, title: moduleBlueprint.title, description: moduleBlueprint.description, learning_outcome: moduleBlueprint.learningOutcome, position: moduleIndex + 1 }).select("id").single();
      if (moduleError || !module) throw new Error(moduleError?.message ?? "Unable to create product module");
      for (const [lessonIndex, lessonBlueprint] of moduleBlueprint.lessons.entries()) {
        const { data: lesson, error: lessonError } = await supabase.from("lessons").insert({ module_id: module.id, title: lessonBlueprint.title, content: lessonBlueprint.content, learning_objective: lessonBlueprint.objective, position: lessonIndex + 1 }).select("id").single();
        if (lessonError || !lesson) throw new Error(lessonError?.message ?? "Unable to create product lesson");
        lessonCount += 1;
        if (lessonIndex === 0) {
          const { error: exerciseError } = await supabase.from("exercises").insert({ module_id: module.id, lesson_id: lesson.id, title: moduleBlueprint.exercise.title, instructions: moduleBlueprint.exercise.instructions, completion_criteria: moduleBlueprint.exercise.completionCriteria, position: 1 });
          if (exerciseError) throw new Error(exerciseError.message);
          const { error: worksheetError } = await supabase.from("worksheets").insert({ module_id: module.id, lesson_id: lesson.id, title: moduleBlueprint.worksheet.title, content: { purpose: moduleBlueprint.worksheet.purpose, prompts: moduleBlueprint.worksheet.prompts }, position: 1 });
          if (worksheetError) throw new Error(worksheetError.message);
        }
      }
    }
    const { error: projectUpdateError } = await supabase.from("projects").update({ status: "building", current_stage: 4, updated_at: new Date().toISOString() }).eq("id", project.id);
    if (projectUpdateError) throw new Error(projectUpdateError.message);
    return NextResponse.json({ productId: product.id, created: true, moduleCount: blueprint.modules.length, lessonCount });
  } catch (error) {
    await removePartialProduct(supabase, product.id).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Evidence-grounded blueprint generation failed" }, { status: 500 });
  }
}

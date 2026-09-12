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

type ValidationReport = {
  id: string;
  decision: "proceed" | "refine" | "abandon" | null;
  recommended_changes: string | null;
};

type EvidenceRow = {
  id: string;
  source_domain: string | null;
  title: string | null;
  content_excerpt: string | null;
  snippet: string | null;
  credibility_score: number | null;
  relevance_score: number | null;
};

type Lesson = { title: string; objective: string; content: string };
type ModuleBlueprint = {
  title: string;
  description: string;
  learningOutcome: string;
  lessons: Lesson[];
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
    { title: "Define the real problem", description: `Turn the validated problem into a precise starting point for ${audience}. Focus on the difficulty uncovered by the research.`, learningOutcome: "A clear problem statement, target-user context, and desired outcome.", lessons: [{ title: "What is actually getting in the way?", objective: `Separate the core problem from symptoms for ${audience}.`, content: `Start with the validated problem: ${sentence(problem)}\n\nMap the situation before recommending solutions. Identify the task, where the process breaks down, and what a useful outcome would look like. Keep the analysis specific to the audience rather than expanding into a broad topic overview.\n\nUse the research evidence collected by ProductForge as the boundary for factual claims. If a point is not supported by evidence, treat it as an assumption to test.` }, { title: "Set the outcome", objective: "Translate the problem into a concrete result the learner can work toward.", content: `Define a practical before-and-after state tied to ${sentence(proposedProduct)} The starting state describes the difficulty; the ending state describes an observable improvement. Keep the outcome specific enough to guide the exercises without making unsupported promises.` }], exercise: { title: "Write the problem-to-outcome map", instructions: "Create a one-page map with four parts: target user, current problem, root friction, and desired observable outcome. Use the validated opportunity as your starting evidence. Add one assumption that still needs to be tested.", completionCriteria: "The map names one audience, one focused problem, one root friction, one observable outcome, and one testable assumption." }, worksheet: { title: "Problem clarity worksheet", purpose: "Turn the validated opportunity into a focused product brief.", prompts: ["Who specifically is this product for?", "What problem are they trying to solve?", "What is the clearest sign that the problem is happening?", "What would a useful improvement look like?", "Which assumption still needs to be tested?"] } },
    { title: "Build the core method", description: `Create the smallest repeatable method that helps ${audience} move from the validated problem toward the desired outcome.`, learningOutcome: "A simple step-by-step method that can be followed and improved.", lessons: [{ title: "Choose the essential steps", objective: "Reduce the solution to the smallest useful sequence.", content: `Design a short sequence rather than a collection of disconnected tips. Start with the outcome from Module 1, then work backward to identify the few actions required to reach it. For a first version of ${title}, each step should have a clear purpose, input, and output.` }, { title: "Make the method usable", objective: "Convert the method into instructions a real user can follow.", content: `For each step, explain what to do, when to do it, what to look for, and what to produce. The method should fit the proposed format (${productType}) and remain realistic for a first product.` }], exercise: { title: "Draft the minimum viable method", instructions: "Write a 4–7 step method for solving the validated problem. For every step, add the action, expected output, and one common point of confusion. Remove steps that do not directly contribute to the target outcome.", completionCriteria: "A complete sequence exists with 4–7 actionable steps and a concrete output for each step." }, worksheet: { title: "Method design worksheet", purpose: "Turn the product idea into a repeatable process.", prompts: ["What is the first action the user should take?", "What must be true before the next step begins?", "What output should each step produce?", "Where is the process most likely to stall?", "Which step can be simplified or removed?"] } },
    { title: "Practice the method", description: "Move from explanation to guided application so the user produces real work instead of only consuming information.", learningOutcome: "A completed first application with feedback points identified.", lessons: [{ title: "Follow the method on a real task", objective: "Apply the core method to a realistic task from the target user's context.", content: "Select one task that closely matches the validated problem. Work through the method one step at a time and record the decisions made. The goal is to expose where instructions are clear and where they need improvement." }, { title: "Review the first result", objective: "Evaluate the first attempt against observable criteria.", content: "Review the result using the outcome defined earlier. Identify what was completed, what remains incomplete, and what caused friction. Turn each issue into either a correction to the user's process or a revision to the product instructions." }], exercise: { title: "Complete a guided application", instructions: "Choose one real task related to the validated problem. Complete the core method from start to finish, recording decisions and any point where you needed clarification. Finish with a short review of what worked and what did not.", completionCriteria: "One real task is completed using the method, with decisions and friction points recorded." }, worksheet: { title: "Guided practice sheet", purpose: "Capture the first practical application and make improvement visible.", prompts: ["What task are you applying the method to?", "What did you do at each step?", "Where did you hesitate or get stuck?", "What result did you produce?", "What would you change on the next attempt?"] } },
    { title: "Strengthen the workflow", description: `Turn the first application into a repeatable workflow that fits ${audience}'s real constraints and routines.`, learningOutcome: "A personalized workflow with checkpoints and a repeatable routine.", lessons: [{ title: "Remove avoidable friction", objective: "Identify workflow elements that create unnecessary effort or confusion.", content: "Review the first application for unclear instructions, unnecessary steps, missing preparation, poor sequencing, or difficult-to-evaluate results. Prioritize friction that most directly affects the validated outcome." }, { title: "Create checkpoints", objective: "Add simple checks that show whether the workflow is working.", content: "For each major stage, define a small checkpoint. A checkpoint should answer a useful question such as whether the input is ready, the expected output was produced, or the result is good enough to continue." }], exercise: { title: "Design the repeatable workflow", instructions: "Take the method from Module 2 and the experience from Module 3. Rewrite it as a repeatable workflow with preparation, core steps, checkpoints, and a final review. Keep only elements that materially support the validated outcome.", completionCriteria: "The workflow includes preparation, actionable steps, at least three checkpoints, and a final review." }, worksheet: { title: "Workflow optimization worksheet", purpose: "Make the product's method easier to repeat consistently.", prompts: ["What should be prepared before starting?", "Which step creates the most friction?", "What checkpoint tells you to continue?", "What checkpoint tells you to correct course?", "What can be made simpler without weakening the outcome?"] } },
    { title: "Turn progress into a system", description: "Finish with an implementation plan that helps the user continue using the product after the initial learning experience.", learningOutcome: "A practical implementation plan and a next-step loop for continued improvement.", lessons: [{ title: "Create the first implementation plan", objective: "Turn the workflow into a realistic short-term action plan.", content: "Build a plan around the target user's actual context rather than an idealized schedule. Select the smallest set of actions that can demonstrate progress toward the validated outcome." }, { title: "Review, learn, improve", objective: "Establish a simple loop for measuring progress and improving the workflow.", content: "Establish a lightweight review loop: apply the method, observe the result, identify friction, adjust the workflow, and repeat. Keep the loop focused on the user's stated outcome and avoid unsupported performance or financial promises." }], exercise: { title: "Build the implementation plan", instructions: "Create a short implementation plan covering the first action, repeatable routine, checkpoint schedule, and review step. Define what evidence would convince you that the workflow is helping with the original problem.", completionCriteria: "A concrete implementation plan exists with actions, checkpoints, and a review loop tied to the original outcome." }, worksheet: { title: "Implementation and review worksheet", purpose: "Convert the product into a repeatable improvement system.", prompts: ["What is the first action you will take?", "What will you repeat and how often?", "What evidence will show progress?", "What will you change if progress stalls?", "What is the next problem this workflow should help you solve?"] } },
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
  const { data: moduleRows, error: moduleLoadError } = await supabase.from("modules").select("id").eq("product_id", productId);
  if (moduleLoadError) throw new Error(`Unable to inspect partial product: ${moduleLoadError.message}`);
  const moduleIds = (moduleRows ?? []).map((module) => module.id);
  if (moduleIds.length) {
    const { error: exerciseError } = await supabase.from("exercises").delete().in("module_id", moduleIds); if (exerciseError) throw new Error(`Unable to clean up exercises: ${exerciseError.message}`);
    const { error: worksheetError } = await supabase.from("worksheets").delete().in("module_id", moduleIds); if (worksheetError) throw new Error(`Unable to clean up worksheets: ${worksheetError.message}`);
    const { error: lessonError } = await supabase.from("lessons").delete().in("module_id", moduleIds); if (lessonError) throw new Error(`Unable to clean up lessons: ${lessonError.message}`);
    const { error: moduleError } = await supabase.from("modules").delete().in("id", moduleIds); if (moduleError) throw new Error(`Unable to clean up modules: ${moduleError.message}`);
  }
  const { error: productError } = await supabase.from("products").delete().eq("id", productId); if (productError) throw new Error(`Unable to clean up product: ${productError.message}`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  const { data: project, error: projectError } = await supabase.from("projects").select("id,name").eq("id", body.projectId).eq("user_id", user.id).single();
  if (projectError || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const { data: opportunity, error: opportunityError } = await supabase.from("opportunities").select("id,title,target_audience,problem,proposed_product,product_type").eq("project_id", project.id).order("opportunity_score", { ascending: false }).limit(1).maybeSingle();
  if (opportunityError) return NextResponse.json({ error: `Unable to load opportunity: ${opportunityError.message}` }, { status: 500 });
  if (!opportunity) return NextResponse.json({ error: "Complete research before building a product blueprint." }, { status: 400 });
  const { data: validation, error: validationError } = await supabase.from("validation_reports").select("id,decision,recommended_changes").eq("project_id", project.id).eq("opportunity_id", opportunity.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (validationError) return NextResponse.json({ error: `Unable to load validation: ${validationError.message}` }, { status: 500 });
  if (!validation) return NextResponse.json({ error: "Validate the opportunity before generating a product blueprint." }, { status: 400 });
  const typedValidation = validation as ValidationReport;
  let refinementPassed = false;
  if (typedValidation.decision === "refine") {
    const { data: refinementTest, error: refinementError } = await supabase.from("validation_tests").select("id,status").eq("project_id", project.id).eq("opportunity_id", opportunity.id).eq("validation_report_id", typedValidation.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (refinementError) return NextResponse.json({ error: `Unable to verify refinement test: ${refinementError.message}` }, { status: 500 });
    refinementPassed = refinementTest?.status === "passed";
  }
  if (typedValidation.decision === "abandon") return NextResponse.json({ error: "This opportunity was marked for abandonment. Refine or select another opportunity before building." }, { status: 400 });
  if (typedValidation.decision !== "proceed" && !refinementPassed) return NextResponse.json({ error: "The opportunity must pass validation before a product blueprint can be generated." }, { status: 400 });
  const { data: existingProduct, error: existingProductError } = await supabase.from("products").select("id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingProductError) return NextResponse.json({ error: `Unable to verify existing product: ${existingProductError.message}` }, { status: 500 });
  if (existingProduct) {
    const { count: moduleCount, error: moduleCountError } = await supabase.from("modules").select("id", { count: "exact", head: true }).eq("product_id", existingProduct.id);
    if (moduleCountError) return NextResponse.json({ error: `Unable to verify existing product: ${moduleCountError.message}` }, { status: 500 });
    if ((moduleCount ?? 0) > 0) return NextResponse.json({ productId: existingProduct.id, created: false, mode: "existing" });
    try { await removePartialProduct(supabase, existingProduct.id); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clean up an interrupted product generation." }, { status: 500 }); }
  }
  let createdProductId: string | null = null;
  try {
    const evidence = await loadEvidence(supabase, project.id, opportunity.id);
    if (!evidence.length) return NextResponse.json({ error: "Product generation requires research evidence for the selected opportunity." }, { status: 400 });
    const blueprint = buildBlueprint(opportunity as Opportunity, evidence);
    const { data: product, error: productError } = await supabase.from("products").insert({ project_id: project.id, name: blueprint.name, tagline: blueprint.tagline, description: blueprint.description, format: blueprint.format, target_audience: blueprint.targetAudience, promise: blueprint.promise, status: "in_progress" }).select("id").single();
    if (productError || !product) throw new Error(productError?.message ?? "Unable to create product blueprint");
    createdProductId = product.id;
    for (const [moduleIndex, moduleBlueprint] of blueprint.modules.entries()) {
      const { data: module, error: moduleError } = await supabase.from("modules").insert({ product_id: product.id, title: moduleBlueprint.title, description: moduleBlueprint.description, learning_outcome: moduleBlueprint.learningOutcome, position: moduleIndex + 1 }).select("id").single();
      if (moduleError || !module) throw new Error(moduleError?.message ?? "Unable to create product module");
      for (const [lessonIndex, lessonBlueprint] of moduleBlueprint.lessons.entries()) {
        const { data: lesson, error: lessonError } = await supabase.from("lessons").insert({ module_id: module.id, title: lessonBlueprint.title, content: lessonBlueprint.content, learning_objective: lessonBlueprint.objective, position: lessonIndex + 1 }).select("id").single();
        if (lessonError || !lesson) throw new Error(lessonError?.message ?? "Unable to create product lesson");
        if (lessonIndex === 0) {
          const { error: exerciseError } = await supabase.from("exercises").insert({ module_id: module.id, lesson_id: lesson.id, title: moduleBlueprint.exercise.title, instructions: moduleBlueprint.exercise.instructions, completion_criteria: moduleBlueprint.exercise.completionCriteria, position: 1 });
          if (exerciseError) throw new Error(exerciseError.message);
          const { error: worksheetError } = await supabase.from("worksheets").insert({ module_id: module.id, lesson_id: lesson.id, title: moduleBlueprint.worksheet.title, content: { purpose: moduleBlueprint.worksheet.purpose, prompts: moduleBlueprint.worksheet.prompts }, position: 1 });
          if (worksheetError) throw new Error(worksheetError.message);
        }
      }
    }
    const { error: projectUpdateError } = await supabase.from("projects").update({ status: "building", current_stage: 5 }).eq("id", project.id).eq("user_id", user.id);
    if (projectUpdateError) throw new Error(`Unable to update project state: ${projectUpdateError.message}`);
    return NextResponse.json({ productId: product.id, created: true, mode: "evidence-grounded-fallback", moduleCount: blueprint.modules.length, lessonCount: blueprint.modules.reduce((count, item) => count + item.lessons.length, 0), evidenceCount: evidence.length });
  } catch (error) {
    if (createdProductId) { try { await removePartialProduct(supabase, createdProductId); } catch { /* Preserve original error. */ } }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the evidence-grounded starter blueprint." }, { status: 500 });
  }
}

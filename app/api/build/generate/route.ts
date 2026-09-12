import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResearchModel } from "@/lib/ai/provider";

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

const lessonSchema = z.object({
  title: z.string().min(3).max(160),
  objective: z.string().min(10).max(500),
  content: z.string().min(80).max(5000),
});

const moduleSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(20).max(700),
  learningOutcome: z.string().min(10).max(500),
  lessons: z.array(lessonSchema).min(1).max(3),
  exercise: z.object({
    title: z.string().min(3).max(160),
    instructions: z.string().min(30).max(1800),
    completionCriteria: z.string().min(20).max(600),
  }),
  worksheet: z.object({
    title: z.string().min(3).max(160),
    purpose: z.string().min(20).max(500),
    prompts: z.array(z.string().min(5).max(300)).min(3).max(8),
  }),
});

const blueprintSchema = z.object({
  name: z.string().min(3).max(180),
  tagline: z.string().min(10).max(240),
  description: z.string().min(30).max(1200),
  format: z.string().min(3).max(120),
  targetAudience: z.string().min(10).max(500),
  promise: z.string().min(20).max(500),
  modules: z.array(moduleSchema).min(4).max(6),
});

async function loadEvidence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  opportunityId: string,
) {
  const { data, error } = await supabase
    .from("research_evidence")
    .select(
      "id,source_domain,title,source_url,content_excerpt,snippet,credibility_score,relevance_score",
    )
    .eq("opportunity_id", opportunityId)
    .order("credibility_score", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) throw new Error(`Unable to load opportunity evidence: ${error.message}`);
  if (data?.length) return data;

  const { data: latestRun, error: latestRunError } = await supabase
    .from("research_runs")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRunError) throw new Error(`Unable to locate completed research: ${latestRunError.message}`);
  if (!latestRun) return [];

  const { data: fallback, error: fallbackError } = await supabase
    .from("research_evidence")
    .select(
      "id,source_domain,title,source_url,content_excerpt,snippet,credibility_score,relevance_score",
    )
    .eq("research_run_id", latestRun.id)
    .order("credibility_score", { ascending: false, nullsFirst: false })
    .limit(30);

  if (fallbackError) throw new Error(`Unable to load research evidence: ${fallbackError.message}`);
  return fallback ?? [];
}

async function removePartialProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
) {
  const { data: moduleRows, error: moduleLoadError } = await supabase
    .from("modules")
    .select("id")
    .eq("product_id", productId);

  if (moduleLoadError) throw new Error(`Unable to inspect partial product: ${moduleLoadError.message}`);

  const moduleIds = (moduleRows ?? []).map((module) => module.id);

  if (moduleIds.length) {
    const { error: exerciseError } = await supabase
      .from("exercises")
      .delete()
      .in("module_id", moduleIds);
    if (exerciseError) throw new Error(`Unable to clean up exercises: ${exerciseError.message}`);

    const { error: worksheetError } = await supabase
      .from("worksheets")
      .delete()
      .in("module_id", moduleIds);
    if (worksheetError) throw new Error(`Unable to clean up worksheets: ${worksheetError.message}`);

    const { error: lessonError } = await supabase
      .from("lessons")
      .delete()
      .in("module_id", moduleIds);
    if (lessonError) throw new Error(`Unable to clean up lessons: ${lessonError.message}`);

    const { error: moduleError } = await supabase
      .from("modules")
      .delete()
      .in("id", moduleIds);
    if (moduleError) throw new Error(`Unable to clean up modules: ${moduleError.message}`);
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  if (productError) throw new Error(`Unable to clean up product: ${productError.message}`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { projectId?: string } | null;
  if (!body?.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id,name")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,product_type")
    .eq("project_id", project.id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!opportunity) {
    return NextResponse.json(
      { error: "Complete research before building a product blueprint." },
      { status: 400 },
    );
  }

  const typedOpportunity = opportunity as Opportunity;

  const { data: validation } = await supabase
    .from("validation_reports")
    .select("id,decision,recommended_changes")
    .eq("project_id", project.id)
    .eq("opportunity_id", typedOpportunity.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!validation) {
    return NextResponse.json(
      { error: "Validate the opportunity before generating a product blueprint." },
      { status: 400 },
    );
  }

  const typedValidation = validation as ValidationReport;
  if (typedValidation.decision === "abandon") {
    return NextResponse.json(
      {
        error:
          "This opportunity was marked for abandonment. Refine or select another opportunity before building.",
      },
      { status: 400 },
    );
  }

  let refinementPassed = false;
  if (typedValidation.decision === "refine") {
    const { data: refinementTest, error: refinementError } = await supabase
      .from("validation_tests")
      .select("id,status")
      .eq("project_id", project.id)
      .eq("opportunity_id", typedOpportunity.id)
      .eq("validation_report_id", typedValidation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (refinementError) {
      return NextResponse.json(
        { error: `Unable to verify refinement test: ${refinementError.message}` },
        { status: 500 },
      );
    }

    refinementPassed = refinementTest?.status === "passed";
  }

  const validationPassed = typedValidation.decision === "proceed" || refinementPassed;
  if (!validationPassed) {
    return NextResponse.json(
      { error: "The opportunity must pass validation before a product blueprint can be generated." },
      { status: 400 },
    );
  }

  // A completed product is idempotent. A product with no modules is treated as
  // an interrupted previous generation and is safely removed before retrying.
  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingProduct) {
    const { count: moduleCount, error: moduleCountError } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("product_id", existingProduct.id);

    if (moduleCountError) {
      return NextResponse.json(
        { error: `Unable to verify existing product: ${moduleCountError.message}` },
        { status: 500 },
      );
    }

    if ((moduleCount ?? 0) > 0) {
      return NextResponse.json({ productId: existingProduct.id, created: false });
    }

    try {
      await removePartialProduct(supabase, existingProduct.id);
    } catch (cleanupError) {
      return NextResponse.json(
        {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : "Unable to clean up an interrupted product generation.",
        },
        { status: 500 },
      );
    }
  }

  const evidence = await loadEvidence(supabase, project.id, typedOpportunity.id);
  if (!evidence.length) {
    return NextResponse.json(
      { error: "Product generation requires research evidence for the selected opportunity." },
      { status: 400 },
    );
  }

  const evidencePacket = evidence.map((item) => ({
    id: item.id,
    domain: item.source_domain,
    title: item.title,
    url: item.source_url,
    excerpt: (item.content_excerpt || item.snippet || "").slice(0, 1800),
    credibility: item.credibility_score,
    relevance: item.relevance_score,
  }));

  let createdProductId: string | null = null;

  try {
    const { object: blueprint } = await generateObject({
      model: getResearchModel(),
      schema: blueprintSchema,
      system: `You are ProductForge's product architect. Build a practical digital-product blueprint from a validated opportunity.

Rules:
1. The opportunity, validation report, and supplied research evidence are the factual foundation. Do not invent market facts, statistics, customer quotes, competitors, prices, or demand claims.
2. Create a product that directly addresses the validated problem and target audience. Do not drift into a generic product about the broad topic.
3. The product must have a clear transformation: starting state -> method -> concrete outcome.
4. Make modules progressive. Each module should have 1–3 lessons, one practical exercise, and one worksheet.
5. Lessons must be actionable and specific enough that a real creator could expand them into finished content.
6. Exercises must produce observable work, decisions, or outputs—not vague reflection.
7. Worksheets must contain useful prompts that map to the exercise and the module outcome.
8. Treat the validation report as a constraint. Incorporate its recommended changes where relevant.
9. Do not claim the product is guaranteed to sell or make money.
10. Keep the scope realistic for a first digital-product version.
11. Prefer a focused first version over a bloated curriculum.`,
      prompt: `Create the first evidence-grounded ProductForge blueprint.

PROJECT
Name: ${project.name}

VALIDATED OPPORTUNITY
Title: ${typedOpportunity.title}
Audience: ${typedOpportunity.target_audience || "Not explicitly defined"}
Problem: ${typedOpportunity.problem || "Not explicitly defined"}
Proposed product: ${typedOpportunity.proposed_product || "Not specified"}
Product type: ${typedOpportunity.product_type || "Digital product"}

VALIDATION
Decision: ${typedValidation.decision}
Refinement passed: ${refinementPassed ? "Yes" : "No"}
Recommended changes: ${typedValidation.recommended_changes || "None recorded"}

RESEARCH EVIDENCE
${JSON.stringify(evidencePacket, null, 2)}

Return a cohesive product blueprint. Use the evidence to sharpen the audience, promise, scope, and practical sequence. Do not cite or quote sources in the product copy; the ProductForge interface will keep the research record alongside the blueprint.`,
    });

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        project_id: project.id,
        name: blueprint.name,
        tagline: blueprint.tagline,
        description: blueprint.description,
        format: blueprint.format,
        target_audience: blueprint.targetAudience,
        promise: blueprint.promise,
        status: "in_progress",
      })
      .select("id,name,tagline,description,format,target_audience,promise,status")
      .single();

    if (productError || !product) {
      throw new Error(productError?.message ?? "Unable to create product blueprint");
    }

    createdProductId = product.id;

    for (const [moduleIndex, moduleBlueprint] of blueprint.modules.entries()) {
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .insert({
          product_id: product.id,
          title: moduleBlueprint.title,
          description: moduleBlueprint.description,
          learning_outcome: moduleBlueprint.learningOutcome,
          position: moduleIndex + 1,
        })
        .select("id")
        .single();

      if (moduleError || !module) {
        throw new Error(moduleError?.message ?? "Unable to create product module");
      }

      for (const [lessonIndex, lessonBlueprint] of moduleBlueprint.lessons.entries()) {
        const { data: lesson, error: lessonError } = await supabase
          .from("lessons")
          .insert({
            module_id: module.id,
            title: lessonBlueprint.title,
            content: lessonBlueprint.content,
            learning_objective: lessonBlueprint.objective,
            position: lessonIndex + 1,
          })
          .select("id")
          .single();

        if (lessonError || !lesson) {
          throw new Error(lessonError?.message ?? "Unable to create product lesson");
        }

        if (lessonIndex === 0) {
          const { error: exerciseError } = await supabase.from("exercises").insert({
            module_id: module.id,
            lesson_id: lesson.id,
            title: moduleBlueprint.exercise.title,
            instructions: moduleBlueprint.exercise.instructions,
            completion_criteria: moduleBlueprint.exercise.completionCriteria,
            position: 1,
          });
          if (exerciseError) throw new Error(exerciseError.message);

          const { error: worksheetError } = await supabase.from("worksheets").insert({
            module_id: module.id,
            lesson_id: lesson.id,
            title: moduleBlueprint.worksheet.title,
            content: {
              purpose: moduleBlueprint.worksheet.purpose,
              prompts: moduleBlueprint.worksheet.prompts,
            },
            position: 1,
          });
          if (worksheetError) throw new Error(worksheetError.message);
        }
      }
    }

    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: "building", current_stage: 4, updated_at: new Date().toISOString() })
      .eq("id", project.id);

    if (projectError) throw new Error(projectError.message);

    return NextResponse.json({
      productId: product.id,
      created: true,
      moduleCount: blueprint.modules.length,
      lessonCount: blueprint.modules.reduce((sum, item) => sum + item.lessons.length, 0),
    });
  } catch (error) {
    let cleanupMessage = "";

    if (createdProductId) {
      try {
        await removePartialProduct(supabase, createdProductId);
      } catch (cleanupError) {
        cleanupMessage = ` Cleanup also failed: ${
          cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error"
        }`;
      }
    }

    return NextResponse.json(
      {
        error: `${error instanceof Error ? error.message : "Product blueprint generation failed"}.${cleanupMessage}`,
      },
      { status: 500 },
    );
  }
}

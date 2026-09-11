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
  decision: "proceed" | "refine" | "abandon" | null;
  recommended_changes: string | null;
};

const moduleTemplates = [
  {
    position: 1,
    title: "Understand the problem",
    description: "Build shared context around the problem, why it matters, and what commonly gets in the way.",
    learning_outcome: "The learner can recognize the core problem and explain why it matters.",
    lesson: "Problem framing and the current-state diagnosis",
    lessonObjective: "Identify the learner's current situation, pain points, and desired outcome.",
    exercise: "Write a one-page problem diagnosis for a real situation.",
    worksheet: "Current-state problem map",
  },
  {
    position: 2,
    title: "Apply the core framework",
    description: "Turn the validated insight into a repeatable method the audience can follow.",
    learning_outcome: "The learner can apply the core method to a real problem.",
    lesson: "The step-by-step framework",
    lessonObjective: "Apply each stage of the framework in the correct sequence.",
    exercise: "Work through the framework using one real example.",
    worksheet: "Framework implementation canvas",
  },
  {
    position: 3,
    title: "Practice the transformation",
    description: "Move from explanation to guided practice with examples, decisions, and implementation.",
    learning_outcome: "The learner can use the method independently on a realistic case.",
    lesson: "Guided implementation and common mistakes",
    lessonObjective: "Complete the process while avoiding the most common failure points.",
    exercise: "Complete a practical case study and compare the result with the success criteria.",
    worksheet: "Implementation checklist",
  },
  {
    position: 4,
    title: "Make it repeatable",
    description: "Create a lightweight system, toolkit, and next-step plan that supports continued use.",
    learning_outcome: "The learner leaves with a repeatable process and concrete next actions.",
    lesson: "Personal workflow, toolkit, and next steps",
    lessonObjective: "Turn the method into a repeatable routine that can be improved over time.",
    exercise: "Create a 7-day implementation plan and define one success metric.",
    worksheet: "Action plan and progress tracker",
  },
];

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

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,product_type")
    .eq("project_id", project.id)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!opportunity) {
    return NextResponse.json({ error: "Complete research before building a product blueprint." }, { status: 400 });
  }

  const typedOpportunity = opportunity as Opportunity;

  const { data: validation } = await supabase
    .from("validation_reports")
    .select("decision,recommended_changes")
    .eq("project_id", project.id)
    .eq("opportunity_id", typedOpportunity.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!validation) {
    return NextResponse.json({ error: "Validate the opportunity before generating a product blueprint." }, { status: 400 });
  }

  const typedValidation = validation as ValidationReport;
  if (typedValidation.decision === "abandon") {
    return NextResponse.json({ error: "This opportunity was marked for abandonment. Refine or select another opportunity before building." }, { status: 400 });
  }

  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingProduct) {
    return NextResponse.json({ productId: existingProduct.id, created: false });
  }

  const productName = typedOpportunity.proposed_product || typedOpportunity.title;
  const promise = typedOpportunity.problem
    ? `Help ${typedOpportunity.target_audience || "the target audience"} move from ${typedOpportunity.problem.toLowerCase()} to a practical, repeatable outcome.`
    : `Help ${typedOpportunity.target_audience || "the target audience"} achieve a clear, practical outcome with a structured method.`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      project_id: project.id,
      name: productName,
      tagline: `A practical system for ${typedOpportunity.target_audience || "the target audience"}`,
      description: typedOpportunity.proposed_product || typedOpportunity.title,
      format: typedOpportunity.product_type || "Digital product",
      target_audience: typedOpportunity.target_audience,
      promise,
      status: "in_progress",
    })
    .select("id,name,tagline,description,format,target_audience,promise,status")
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: productError?.message ?? "Unable to create product blueprint" }, { status: 500 });
  }

  for (const template of moduleTemplates) {
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .insert({
        product_id: product.id,
        title: template.title,
        description: template.description,
        learning_outcome: template.learning_outcome,
        position: template.position,
      })
      .select("id")
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: moduleError?.message ?? "Unable to create product module" }, { status: 500 });
    }

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .insert({
        module_id: module.id,
        title: template.lesson,
        content: `This lesson should connect the validated problem — ${typedOpportunity.problem || "the audience's core problem"} — to the practical method introduced in this module.`,
        learning_objective: template.lessonObjective,
        position: 1,
      })
      .select("id")
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: lessonError?.message ?? "Unable to create product lesson" }, { status: 500 });
    }

    const { error: exerciseError } = await supabase.from("exercises").insert({
      module_id: module.id,
      lesson_id: lesson.id,
      title: template.exercise,
      instructions: `Complete this exercise using the context of ${typedOpportunity.title}. Focus on a real situation rather than a hypothetical answer.`,
      completion_criteria: "A concrete answer, decision, or implementation plan that can be reviewed against the lesson objective.",
      position: 1,
    });

    if (exerciseError) return NextResponse.json({ error: exerciseError.message }, { status: 500 });

    const { error: worksheetError } = await supabase.from("worksheets").insert({
      module_id: module.id,
      lesson_id: lesson.id,
      title: template.worksheet,
      content: {
        purpose: "Apply the lesson to the learner's real situation.",
        prompts: ["Current situation", "Desired outcome", "Key actions", "Evidence of progress", "Next step"],
      },
      position: 1,
    });

    if (worksheetError) return NextResponse.json({ error: worksheetError.message }, { status: 500 });
  }

  const { error: projectError } = await supabase
    .from("projects")
    .update({ status: "building", current_stage: 4, updated_at: new Date().toISOString() })
    .eq("id", project.id);

  if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });

  return NextResponse.json({ productId: product.id, created: true, moduleCount: moduleTemplates.length });
}

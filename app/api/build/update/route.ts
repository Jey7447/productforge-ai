import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = ["product", "module", "lesson", "exercise", "worksheet"] as const;
type EntityType = (typeof allowedTypes)[number];

type Body = {
  projectId?: string;
  type?: EntityType;
  id?: string;
  fields?: Record<string, unknown>;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function ownsProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, userId: string) {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  return Boolean(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Body | null;
  if (!body?.projectId || !body.type || !body.id || !allowedTypes.includes(body.type) || !body.fields) {
    return NextResponse.json({ error: "projectId, type, id and fields are required" }, { status: 400 });
  }

  if (!(await ownsProject(supabase, body.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const fields = body.fields;
  let table: "products" | "modules" | "lessons" | "exercises" | "worksheets";
  let allowedFields: string[];

  if (body.type === "product") {
    table = "products";
    allowedFields = ["name", "tagline", "description", "format", "target_audience", "promise"];
    const { data } = await supabase.from("products").select("id").eq("id", body.id).eq("project_id", body.projectId).single();
    if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } else if (body.type === "module") {
    table = "modules";
    allowedFields = ["title", "description", "learning_outcome"];
    const { data: module } = await supabase.from("modules").select("id,product_id").eq("id", body.id).single();
    if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });
    const { data: product } = await supabase.from("products").select("id").eq("id", module.product_id).eq("project_id", body.projectId).single();
    if (!product) return NextResponse.json({ error: "Module not found" }, { status: 404 });
  } else if (body.type === "lesson") {
    table = "lessons";
    allowedFields = ["title", "content", "learning_objective"];
    const { data: lesson } = await supabase.from("lessons").select("id,module_id").eq("id", body.id).single();
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    const { data: module } = await supabase.from("modules").select("id,product_id").eq("id", lesson.module_id).single();
    if (!module) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    const { data: product } = await supabase.from("products").select("id").eq("id", module.product_id).eq("project_id", body.projectId).single();
    if (!product) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  } else if (body.type === "exercise") {
    table = "exercises";
    allowedFields = ["title", "instructions", "completion_criteria"];
    const { data: exercise } = await supabase.from("exercises").select("id,module_id").eq("id", body.id).single();
    if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    const { data: module } = await supabase.from("modules").select("id,product_id").eq("id", exercise.module_id).single();
    if (!module) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    const { data: product } = await supabase.from("products").select("id").eq("id", module.product_id).eq("project_id", body.projectId).single();
    if (!product) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  } else {
    table = "worksheets";
    allowedFields = ["title", "content"];
    const { data: worksheet } = await supabase.from("worksheets").select("id,module_id").eq("id", body.id).single();
    if (!worksheet) return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    const { data: module } = await supabase.from("modules").select("id,product_id").eq("id", worksheet.module_id).single();
    if (!module) return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    const { data: product } = await supabase.from("products").select("id").eq("id", module.product_id).eq("project_id", body.projectId).single();
    if (!product) return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (!(key in fields)) continue;

    if (body.type === "worksheet" && key === "content") {
      if (typeof fields[key] !== "object" || fields[key] === null || Array.isArray(fields[key])) {
        return NextResponse.json({ error: "Worksheet content must be an object" }, { status: 400 });
      }

      const content = fields[key] as Record<string, unknown>;
      update.content = {
        purpose: cleanString(content.purpose),
        prompts: Array.isArray(content.prompts)
          ? content.prompts
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      };
    } else {
      update[key] = cleanString(fields[key]);
    }
  }

  if (!Object.keys(update).length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });

  const { data, error } = await supabase
    .from(table)
    .update(update)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    testId?: string;
    projectId?: string;
    status?: "in_progress" | "passed" | "failed";
    notes?: string;
    outcome?: string;
  } | null;

  if (!body?.testId || !body.projectId || !body.status) {
    return NextResponse.json({ error: "testId, projectId and status are required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: test } = await supabase
    .from("validation_tests")
    .select("id,project_id")
    .eq("id", body.testId)
    .eq("project_id", body.projectId)
    .single();
  if (!test) return NextResponse.json({ error: "Validation test not found" }, { status: 404 });

  const { data: updated, error } = await supabase
    .from("validation_tests")
    .update({ status: body.status, notes: body.notes?.trim() || null, outcome: body.outcome?.trim() || null })
    .eq("id", body.testId)
    .select("id,status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "passed") {
    await supabase.from("projects").update({ current_stage: 4, status: "building" }).eq("id", body.projectId).eq("user_id", user.id);
  }

  return NextResponse.json({ test: updated });
}

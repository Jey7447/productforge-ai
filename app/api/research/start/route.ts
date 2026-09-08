import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runResearch } from "@/lib/research/run";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project } = await supabase.from("projects").select("id,name").eq("id", body.projectId).eq("user_id", user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: input } = await supabase.from("project_inputs").select("interests,expertise,audience,problems,goals,preferred_product_types,priority_goal,additional_context").eq("project_id", project.id).order("created_at", { ascending: false }).limit(1).single();
  if (!input) return NextResponse.json({ error: "Project input not found" }, { status: 400 });

  try {
    const result = await runResearch(body.projectId, { projectId: body.projectId, name: project.name, startingPoint: [input.problems, input.goals, input.additional_context].filter(Boolean).join("; ") || project.name, ...input });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Research failed" }, { status: 500 });
  }
}

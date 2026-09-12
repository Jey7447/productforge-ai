import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string; opportunityId?: string; action?: "select" | "shortlist" } | null;
  if (!body?.projectId || !body?.opportunityId || !body.action) {
    return NextResponse.json({ error: "projectId, opportunityId and action are required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,status")
    .eq("id", body.opportunityId)
    .eq("project_id", project.id)
    .single();
  if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  if (body.action === "select") {
    const { error: clearError } = await supabase
      .from("opportunities")
      .update({ status: "shortlisted" })
      .eq("project_id", project.id)
      .eq("status", "selected");
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 });

    const { error } = await supabase
      .from("opportunities")
      .update({ status: "selected" })
      .eq("id", opportunity.id)
      .eq("project_id", project.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "selected" });
  }

  const nextStatus = opportunity.status === "shortlisted" ? "discovered" : "shortlisted";
  const { error } = await supabase
    .from("opportunities")
    .update({ status: nextStatus })
    .eq("id", opportunity.id)
    .eq("project_id", project.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: nextStatus });
}

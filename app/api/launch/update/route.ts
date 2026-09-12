import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    projectId?: string;
    checklist?: Array<{ item?: string; done?: boolean }>;
  } | null;

  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!Array.isArray(body.checklist)) return NextResponse.json({ error: "checklist is required" }, { status: 400 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: launchPlan, error: planError } = await supabase
    .from("launch_plans")
    .select("id,plan")
    .eq("project_id", project.id)
    .maybeSingle();

  if (planError) return NextResponse.json({ error: `Unable to load launch plan: ${planError.message}` }, { status: 500 });
  if (!launchPlan) return NextResponse.json({ error: "Launch plan not found" }, { status: 404 });

  const currentPlan = (launchPlan.plan ?? {}) as Record<string, unknown>;
  const currentChecklist = Array.isArray(currentPlan.checklist) ? currentPlan.checklist : [];
  const previousDone = new Map<string, boolean>();

  for (const entry of currentChecklist) {
    if (!entry || typeof entry !== "object") continue;
    const item = (entry as { item?: unknown }).item;
    const done = (entry as { done?: unknown }).done;
    if (typeof item === "string") previousDone.set(item, Boolean(done));
  }

  const checklist = body.checklist.map((entry) => ({
    item: typeof entry.item === "string" ? entry.item.trim() : "",
    done: Boolean(entry.done),
  })).filter((entry) => entry.item);

  const mergedChecklist = checklist.map((entry) => ({
    ...entry,
    done: previousDone.has(entry.item) ? entry.done : entry.done,
  }));

  const updatedPlan = {
    ...currentPlan,
    checklist: mergedChecklist,
  };

  const { data, error } = await supabase
    .from("launch_plans")
    .update({ plan: updatedPlan })
    .eq("id", launchPlan.id)
    .select("id,plan,status")
    .single();

  if (error || !data) return NextResponse.json({ error: `Unable to save launch checklist: ${error?.message ?? "Unknown error"}` }, { status: 500 });

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type LaunchLearning = {
  qualifiedReached?: string;
  salesPageVisits?: string;
  interested?: string;
  purchases?: string;
  objections?: string;
  positiveSignals?: string;
  userOutcomes?: string;
  learning?: string;
  decision?: string;
  nextAction?: string;
};

const emptyLaunchLearning: LaunchLearning = {
  qualifiedReached: "",
  salesPageVisits: "",
  interested: "",
  purchases: "",
  objections: "",
  positiveSignals: "",
  userOutcomes: "",
  learning: "",
  decision: "",
  nextAction: "",
};

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    projectId?: string;
    checklist?: Array<{ item?: string; done?: boolean }>;
    launchLearning?: LaunchLearning;
    resetLaunchLearning?: boolean;
  } | null;

  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!Array.isArray(body.checklist) && !body.launchLearning && !body.resetLaunchLearning) {
    return NextResponse.json({ error: "checklist, launchLearning, or resetLaunchLearning is required" }, { status: 400 });
  }

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
  const updatedPlan: Record<string, unknown> = { ...currentPlan };

  if (body.resetLaunchLearning) {
    updatedPlan.launchLearning = emptyLaunchLearning;
    delete updatedPlan.launchDiagnosis;
  }

  if (Array.isArray(body.checklist)) {
    const checklist = body.checklist
      .map((entry) => ({
        item: typeof entry.item === "string" ? entry.item.trim() : "",
        done: Boolean(entry.done),
      }))
      .filter((entry) => entry.item);
    updatedPlan.checklist = checklist;
  }

  if (body.launchLearning && typeof body.launchLearning === "object") {
    updatedPlan.launchLearning = {
      ...(typeof currentPlan.launchLearning === "object" && currentPlan.launchLearning !== null ? currentPlan.launchLearning : {}),
      ...body.launchLearning,
    };
  }

  const { data, error } = await supabase
    .from("launch_plans")
    .update({ plan: updatedPlan })
    .eq("id", launchPlan.id)
    .select("id,plan,status")
    .single();

  if (error || !data) return NextResponse.json({ error: `Unable to save launch plan: ${error?.message ?? "Unknown error"}` }, { status: 500 });

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project } = await supabase.from("projects").select("id").eq("id", body.projectId).eq("user_id", user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,target_audience,problem,proposed_product,monetization_score,competition_gap_score")
    .eq("project_id", body.projectId)
    .order("opportunity_score", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!opportunity) return NextResponse.json({ error: "Research an opportunity before refining it." }, { status: 400 });

  const { data: report } = await supabase
    .from("validation_reports")
    .select("id,decision,recommended_changes")
    .eq("project_id", body.projectId)
    .eq("opportunity_id", opportunity.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: "Generate a validation report before refining the opportunity." }, { status: 400 });

  const { data: existing } = await supabase
    .from("validation_tests")
    .select("id,status")
    .eq("project_id", body.projectId)
    .eq("opportunity_id", opportunity.id)
    .eq("validation_report_id", report.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ test: existing });

  const monetization = Number(opportunity.monetization_score ?? 0);
  const competition = Number(opportunity.competition_gap_score ?? 0);
  const weakest = monetization <= competition ? "willingness to pay" : "the uniqueness of the unmet need";
  const testPlan = weakest === "willingness to pay"
    ? "Speak with 5–10 people who match the target audience. Show the concrete outcome and proposed format, then ask what they currently use, what the problem costs them, and whether they would pay for this solution. Record objections and any concrete commitment signals."
    : "Map 3–5 alternatives the target audience already uses. Compare the promised outcome, workflow, price, and missing use case. Identify one specific job the alternatives do not serve well."
  const success = weakest === "willingness to pay"
    ? "At least 3 qualified people independently describe the problem as important and at least 2 show credible willingness to pay or take a concrete next step."
    : "A repeatable underserved use case is found across multiple qualified users, with no existing alternative clearly solving it end-to-end."

  const { data: test, error } = await supabase.from("validation_tests").insert({
    project_id: body.projectId,
    opportunity_id: opportunity.id,
    validation_report_id: report.id,
    test_type: weakest === "willingness to pay" ? "willingness_to_pay" : "alternative_gap",
    hypothesis: `The opportunity's weakest assumption — ${weakest} — will hold for the defined target audience.`,
    test_plan: testPlan,
    success_criteria: success,
    status: "planned",
  }).select("id,test_type,hypothesis,test_plan,success_criteria,status,notes,outcome").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test });
}

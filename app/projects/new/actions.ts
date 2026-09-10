"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const startingPoint = String(formData.get("startingPoint") ?? "").trim();

  if (!name || !startingPoint) {
    redirect("/projects/new?error=Please%20complete%20both%20fields");
  }

  // current_stage is constrained by the database to 1–8, so a new project
  // starts at stage 1 (Discovery/Research), not 0.
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      status: "draft",
      current_stage: 1,
    })
    .select("id")
    .single();

  if (error || !project) {
    redirect(
      `/projects/new?error=${encodeURIComponent(
        error?.message ?? "Unable to create project",
      )}`,
    );
  }

  const { error: inputError } = await supabase.from("project_inputs").insert({
    project_id: project.id,
    interests: [],
    expertise: null,
    audience: null,
    problems: startingPoint,
    goals: null,
    preferred_product_types: [],
    priority_goal: null,
    additional_context: null,
  });

  if (inputError) {
    // Avoid leaving an orphaned project behind if its initial input cannot be saved.
    await supabase.from("projects").delete().eq("id", project.id).eq("user_id", user.id);
    redirect(`/projects/new?error=${encodeURIComponent(inputError.message)}`);
  }

  redirect(`/projects/${project.id}`);
}

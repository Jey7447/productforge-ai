"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const startingPoint = String(formData.get("startingPoint") ?? "").trim();
  if (!name || !startingPoint) redirect("/projects/new");
  const { data: project, error } = await supabase.from("projects").insert({ user_id: user.id, name, status: "draft" }).select("id").single();
  if (error || !project) redirect(`/projects/new?error=${encodeURIComponent(error?.message ?? "Unable to create project")}`);
  await supabase.from("project_inputs").insert({ project_id: project.id, input_type: "starting_point", content: startingPoint });
  redirect(`/projects/${project.id}`);
}

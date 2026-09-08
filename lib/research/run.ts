import { createClient } from "@/lib/supabase/server";
import { buildResearchPlan } from "./planner";
import { ExaProvider } from "./providers/exa";
import type { ResearchInput } from "./types";

function domainFromUrl(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function credibilityForDomain(domain: string | null) {
  if (!domain) return 50;
  if (/\.gov$|\.edu$|\.ac\./.test(domain)) return 90;
  if (/reuters\.com|ft\.com|forbes\.com|hbr\.org|mckinsey\.com/.test(domain)) return 85;
  if (/reddit\.com|quora\.com|stackoverflow\.com/.test(domain)) return 70;
  return 65;
}

export async function runResearch(projectId: string, input: ResearchInput) {
  const supabase = await createClient();
  const provider = new ExaProvider();
  const plan = buildResearchPlan(input);

  const { data: run, error: runError } = await supabase.from("research_runs").insert({ project_id: projectId, status: "running", stage: "query_planning", metadata: { provider: provider.name, query_count: plan.length } }).select("id").single();
  if (runError || !run) throw new Error(runError?.message ?? "Unable to create research run");

  const { data: search, error: searchError } = await supabase.from("opportunity_searches").insert({ project_id: projectId, status: "running", query_context: input }).select("id").single();
  if (searchError || !search) throw new Error(searchError?.message ?? "Unable to create opportunity search");
  await supabase.from("research_runs").update({ opportunity_search_id: search.id, stage: "searching", started_at: new Date().toISOString() }).eq("id", run.id);

  try {
    const queryRows = await Promise.all(plan.map(async (item) => {
      const { data, error } = await supabase.from("research_queries").insert({ research_run_id: run.id, provider: provider.name, query: item.query, purpose: item.purpose, status: "running" }).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "Unable to create research query");
      return { ...item, id: data.id };
    }));

    await supabase.from("research_runs").update({ stage: "collecting_evidence" }).eq("id", run.id);

    const allEvidence: Array<Record<string, unknown>> = [];
    await Promise.all(queryRows.map(async (query) => {
      try {
        const results = await provider.search(query.query);
        await supabase.from("research_queries").update({ status: "completed", result_count: results.length, executed_at: new Date().toISOString() }).eq("id", query.id);
        for (const result of results) {
          const domain = domainFromUrl(result.url);
          const excerpt = result.highlights?.join(" ") || result.summary || result.text?.slice(0, 2500) || null;
          allEvidence.push({ research_run_id: run.id, research_query_id: query.id, source_url: result.url, source_domain: domain, source_type: query.purpose, title: result.title ?? null, snippet: result.summary ?? null, content_excerpt: excerpt, published_at: result.publishedDate ?? null, retrieved_at: new Date().toISOString(), relevance_score: 75, credibility_score: credibilityForDomain(domain), metadata: { author: result.author ?? null, purpose: query.purpose, provider: provider.name } });
        }
      } catch (error) {
        await supabase.from("research_queries").update({ status: "failed", executed_at: new Date().toISOString() }).eq("id", query.id);
        throw error;
      }
    }));

    const uniqueEvidence = Array.from(new Map(allEvidence.map((item) => [item.source_url, item])).values());
    if (uniqueEvidence.length) {
      const { error } = await supabase.from("research_evidence").insert(uniqueEvidence);
      if (error) throw new Error(error.message);
    }

    await supabase.from("research_runs").update({ status: "completed", stage: "evidence_collected", completed_at: new Date().toISOString(), metadata: { provider: provider.name, query_count: plan.length, evidence_count: uniqueEvidence.length } }).eq("id", run.id);
    await supabase.from("opportunity_searches").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", search.id);
    await supabase.from("projects").update({ status: "researching", current_stage: 1 }).eq("id", projectId);
    return { runId: run.id, searchId: search.id, evidenceCount: uniqueEvidence.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    await supabase.from("research_runs").update({ status: "failed", stage: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", run.id);
    await supabase.from("opportunity_searches").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", search.id);
    throw error;
  }
}

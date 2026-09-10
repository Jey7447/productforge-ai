import type { ResearchInput, ResearchQueryPlan } from "./types";

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function buildResearchPlan(input: ResearchInput): ResearchQueryPlan[] {
  const audience = clean(input.audience) || "people in this market";
  const startingPoint = clean(input.startingPoint);
  const expertise = clean(input.expertise);
  const problems = clean(input.problems);
  const productTypes = input.preferredProductTypes?.filter(Boolean).join(", ");
  const context = [
    startingPoint,
    expertise && `expertise: ${expertise}`,
    problems && `problems: ${problems}`,
    productTypes && `product formats: ${productTypes}`,
  ]
    .filter(Boolean)
    .join("; ");

  const plan: ResearchQueryPlan[] = [
    { purpose: "demand", query: `${audience} ${startingPoint} demand trends needs search interest` },
    { purpose: "pain_points", query: `${audience} ${startingPoint} problems frustrations challenges "how do I"` },
    { purpose: "existing_solutions", query: `${audience} ${startingPoint} existing tools courses templates guides solutions` },
    { purpose: "monetization", query: `${audience} ${startingPoint} pay for pricing cost budget software course template` },
    { purpose: "competition_gap", query: `${audience} ${startingPoint} alternatives competitors limitations complaints reviews` },
    { purpose: "underserved", query: `${audience} ${startingPoint} underserved niche overlooked unmet needs specific segment` },
  ];

  return plan.map((item): ResearchQueryPlan => ({
    ...item,
    query: `${item.query} ${context}`.trim(),
  }));
}

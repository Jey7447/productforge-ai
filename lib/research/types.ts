export type ResearchPurpose = "demand" | "pain_points" | "existing_solutions" | "monetization" | "competition_gap" | "underserved";

export interface ResearchInput {
  projectId: string;
  name: string;
  startingPoint: string;
  interests?: string[];
  expertise?: string | null;
  audience?: string | null;
  problems?: string | null;
  goals?: string | null;
  preferredProductTypes?: string[];
  priorityGoal?: string | null;
  additionalContext?: string | null;
}

export interface ResearchQueryPlan {
  query: string;
  purpose: ResearchPurpose;
}

export interface SearchResult {
  title?: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export interface ResearchProvider {
  name: string;
  search(query: string): Promise<SearchResult[]>;
}

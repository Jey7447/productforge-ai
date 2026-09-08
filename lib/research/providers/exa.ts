import type { ResearchProvider, SearchResult } from "../types";

interface ExaResponse { results?: Array<Record<string, unknown>>; }

export class ExaProvider implements ResearchProvider {
  name = "exa";

  async search(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) throw new Error("EXA_API_KEY is not configured.");

    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        query,
        type: "auto",
        numResults: 8,
        contents: { text: { maxCharacters: 5000 }, highlights: { maxCharacters: 2500 }, summary: true },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Exa search failed (${response.status}): ${message.slice(0, 500)}`);
    }

    const data = (await response.json()) as ExaResponse;
    return (data.results ?? []).map((item) => ({
      title: typeof item.title === "string" ? item.title : undefined,
      url: typeof item.url === "string" ? item.url : "",
      publishedDate: typeof item.publishedDate === "string" ? item.publishedDate : undefined,
      author: typeof item.author === "string" ? item.author : undefined,
      text: typeof item.text === "string" ? item.text.slice(0, 5000) : undefined,
      highlights: Array.isArray(item.highlights) ? item.highlights.filter((v): v is string => typeof v === "string").slice(0, 5) : undefined,
      summary: typeof item.summary === "string" ? item.summary : undefined,
    })).filter((item) => item.url);
  }
}

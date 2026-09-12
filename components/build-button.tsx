"use client";

import { useState } from "react";

export function BuildButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function generateBlueprint() {
    setRunning(true);
    setError(false);
    setMessage("Architecting the product from the validated opportunity and research evidence…");

    try {
      const response = await fetch("/api/build/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json().catch(() => ({}));
      const aiError = typeof data.error === "string" ? data.error : "";
      const aiUnavailable =
        response.status >= 500 &&
        /credits|quota|no credits|AI_APICallError|openai|model/i.test(aiError);

      if (!response.ok && aiUnavailable) {
        setError(false);
        setMessage("AI generation is unavailable. Creating an evidence-grounded starter blueprint instead…");

        const fallbackResponse = await fetch("/api/build/fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        const fallbackData = await fallbackResponse.json().catch(() => ({}));

        if (!fallbackResponse.ok) {
          setError(true);
          setMessage(
            fallbackData.error
              ? `AI generation is unavailable, and the fallback could not complete: ${fallbackData.error}`
              : "AI generation is unavailable, and the evidence-grounded fallback could not complete.",
          );
          return;
        }

        setMessage(
          `Starter blueprint created from the research evidence: ${fallbackData.moduleCount ?? 0} modules and ${fallbackData.lessonCount ?? 0} lessons.`,
        );
        window.location.reload();
        return;
      }

      if (!response.ok) {
        setError(true);
        setMessage(aiError || "The product blueprint could not be generated.");
        return;
      }

      setMessage(
        data.created
          ? `Blueprint created: ${data.moduleCount ?? 0} modules and ${data.lessonCount ?? 0} lessons.`
          : "Product blueprint already exists.",
      );
      window.location.reload();
    } catch {
      setError(true);
      setMessage("Could not reach the product builder. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={generateBlueprint}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-full bg-[#d9f06a] px-5 py-3 text-sm font-bold text-[#171714] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Building blueprint…" : "Generate product blueprint →"}
      </button>
      {message && <p className={`mt-3 text-xs leading-5 ${error ? "text-red-600" : "text-[#73736d]"}`}>{message}</p>}
    </div>
  );
}

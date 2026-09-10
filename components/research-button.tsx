"use client";

import { useState } from "react";

type Status = "idle" | "running" | "done" | "error";

function friendlyResearchError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("no credits remaining") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("quota") ||
    normalized.includes("billing")
  ) {
    return "The research run reached the AI provider, but the API account has no available credits. No code change is needed for this error."
  }

  if (normalized.includes("gpt-5.5") || normalized.includes("model") && normalized.includes("does not exist")) {
    return "This run reported an outdated model configuration. Refresh the page and try again after confirming the current AI model setting."
  }

  return message || "Research failed. Please refresh the page and try again.";
}

export function ResearchButton({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function startResearch() {
    if (status === "running") return;

    setStatus("running");
    setMessage("Planning searches and collecting evidence…");

    try {
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(friendlyResearchError(data.error ?? "Research failed."));
        return;
      }

      setStatus("done");
      setMessage(`Research complete. ${data.evidenceCount ?? 0} evidence sources collected.`);
      window.location.reload();
    } catch (error) {
      setStatus("error");
      setMessage(
        friendlyResearchError(
          error instanceof Error ? error.message : "Unable to reach the research service."
        )
      );
    }
  }

  function refreshWorkspace() {
    window.location.reload();
  }

  return (
    <div>
      <button
        onClick={startResearch}
        disabled={status === "running"}
        className="inline-flex items-center gap-2 rounded-full bg-[#d9f06a] px-5 py-3 text-sm font-bold text-[#171714] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "running" ? "Researching…" : "Start research →"}
      </button>

      {message && (
        <div className="mt-4 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p
            className={`text-xs leading-5 ${
              status === "error" ? "text-red-300" : "text-white/60"
            }`}
          >
            {message}
          </p>
          {status === "error" && (
            <button
              type="button"
              onClick={refreshWorkspace}
              className="mt-3 text-xs font-semibold text-[#d9f06a] underline underline-offset-4 transition hover:text-white"
            >
              Refresh research workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}

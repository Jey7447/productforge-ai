"use client";

import { useState } from "react";

export function NewResearchButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function startNewResearch() {
    if (running) return;

    const confirmed = window.confirm(
      "Start a new research run? Your previous research will remain saved as history, while ProductForge collects fresh evidence and generates a new opportunity landscape."
    );

    if (!confirmed) return;

    setRunning(true);
    setMessage("Collecting fresh evidence and rebuilding the opportunity landscape…");

    try {
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRunning(false);
        setMessage(data.error ?? "The new research run could not be started.");
        return;
      }

      setMessage(`New research complete. ${data.evidenceCount ?? 0} evidence sources collected.`);
      window.location.reload();
    } catch {
      setRunning(false);
      setMessage("Could not reach the research service. Refresh the page and try again.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={startNewResearch}
        disabled={running}
        className="pf-lift inline-flex items-center gap-2 rounded-full border border-[#d2d2ca] bg-white px-4 py-2 text-xs font-semibold shadow-sm transition hover:border-[#aaa9a0] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Researching…" : "Run new research ↻"}
      </button>
      {message && <span className="hidden max-w-xs text-xs text-[#73736d] lg:inline">{message}</span>}
    </div>
  );
}

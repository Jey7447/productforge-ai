"use client";

import { useState } from "react";

export function CreateRefinementTestButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function createTest() {
    if (running) return;
    setRunning(true);
    setMessage("");
    try {
      const response = await fetch("/api/refinement/create-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not create the refinement test.");
      setMessage(data.reused ? "The current refinement test is already ready. Showing it…" : "Test created. Opening the test workspace…");
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the refinement test.");
      setRunning(false);
    }
  }

  return (
    <div>
      <button onClick={createTest} disabled={running} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
        {running ? "Preparing test…" : "Create refinement test →"}
      </button>
      {message && <p className="mt-3 text-xs text-[#73736d]">{message}</p>}
    </div>
  );
}

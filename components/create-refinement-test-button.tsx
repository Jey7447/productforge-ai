"use client";

import { useState } from "react";

export function CreateRefinementTestButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function createTest() {
    setRunning(true);
    setMessage("");
    try {
      const response = await fetch("/api/refinement/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not create the refinement test.");
      window.location.reload();
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
      {message && <p className="mt-3 text-xs text-red-600">{message}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";

export function BuildButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function generateBlueprint() {
    setRunning(true);
    setError(false);
    setMessage("Turning the validated opportunity into a product blueprint…");

    try {
      const response = await fetch("/api/build/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(true);
        setMessage(data.error ?? "The product blueprint could not be generated.");
        return;
      }

      setMessage(data.created ? "Product blueprint created." : "Product blueprint already exists.");
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
        {running ? "Building…" : "Generate product blueprint →"}
      </button>
      {message && <p className={`mt-3 text-xs leading-5 ${error ? "text-red-600" : "text-[#73736d]"}`}>{message}</p>}
    </div>
  );
}

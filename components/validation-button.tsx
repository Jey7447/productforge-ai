"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ValidationButton({ projectId, opportunityId }: { projectId: string; opportunityId?: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function generateValidation() {
    if (running) return;

    setRunning(true);
    setMessage("Turning the selected research signals into a validation scorecard…");
    setError(false);

    try {
      const response = await fetch("/api/validation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, opportunityId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(true);
        setMessage(data.error ?? "Validation could not be generated.");
        return;
      }

      setMessage(data.reused ? "Validation report already exists. Showing the latest decision…" : "Validation complete. Showing the decision report…");

      // Re-fetch the Server Component so the saved report appears immediately,
      // without a full browser reload. Then move the user to the decision area.
      router.refresh();
      window.setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      }, 500);
    } catch {
      setError(true);
      setMessage("Could not reach the validation service. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        onClick={generateValidation}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-full bg-[#d9f06a] px-5 py-3 text-sm font-bold text-[#171714] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Validating…" : "Generate validation →"}
      </button>
      {message && (
        <p className={`mt-3 text-xs leading-5 ${error ? "text-red-600" : "text-[#73736d]"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

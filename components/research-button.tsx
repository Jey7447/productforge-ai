"use client";

import { useState } from "react";

export function ResearchButton({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startResearch() {
    setStatus("running");
    setMessage("Planning searches and collecting evidence…");
    const response = await fetch("/api/research/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Research failed.");
      return;
    }
    setStatus("done");
    setMessage(`Research complete. ${data.evidenceCount ?? 0} evidence sources collected.`);
    window.location.reload();
  }

  return <div><button onClick={startResearch} disabled={status === "running"} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{status === "running" ? "Researching…" : "Start research"}</button>{message && <p className={`mt-3 text-sm ${status === "error" ? "text-red-600" : "text-slate-500"}`}>{message}</p>}</div>;
}

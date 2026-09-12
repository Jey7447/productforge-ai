"use client";

import { useState } from "react";

type NextStatus = "in_progress" | "passed" | "failed";

export function RefinementActions({ testId, projectId, status }: { testId: string; projectId: string; status: string }) {
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function updateTest(nextStatus: NextStatus) {
    const trimmedNotes = notes.trim();
    const trimmedOutcome = outcome.trim();

    if (nextStatus === "passed" && (!trimmedNotes || !trimmedOutcome)) {
      setMessage("To unlock Build, record what you learned and summarize the outcome against the success criteria.");
      return;
    }

    if (nextStatus === "failed" && !trimmedOutcome) {
      setMessage("Record the test outcome before marking the test as failed.");
      return;
    }

    setRunning(true);
    setMessage("");
    try {
      const response = await fetch("/api/refinement/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          projectId,
          status: nextStatus,
          notes: trimmedNotes,
          outcome: trimmedOutcome,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not update the test.");
      setMessage(
        nextStatus === "passed"
          ? "Test passed. Build is now unlocked."
          : nextStatus === "failed"
            ? "Test failed. Review the evidence before building."
            : "Test marked in progress."
      );
      if (nextStatus === "passed") window.location.href = `/projects/${projectId}/build`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the test.");
    } finally {
      setRunning(false);
    }
  }

  const inputsLocked = running || status === "passed";
  const canPass = !inputsLocked;
  const canFail = !running && status !== "failed" && status !== "passed";

  return (
    <div className="mt-6 rounded-2xl bg-[#f5f5f2] p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">What did you learn?</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={inputsLocked}
            placeholder="Record interviews, responses, sign-ups, objections, or other evidence."
            className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#deded7] bg-white p-3 text-sm text-[#171714] outline-none placeholder:text-[#aaa9a1] focus:border-[#171714] disabled:cursor-not-allowed disabled:bg-[#eeeeea]"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a8a82]">Outcome</span>
          <textarea
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            disabled={inputsLocked}
            placeholder="Summarize the result against the success criteria."
            className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#deded7] bg-white p-3 text-sm text-[#171714] outline-none placeholder:text-[#aaa9a1] focus:border-[#171714] disabled:cursor-not-allowed disabled:bg-[#eeeeea]"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={inputsLocked}
          onClick={() => updateTest("in_progress")}
          className="rounded-full border border-[#d8d8d0] bg-white px-4 py-2 text-xs font-semibold text-[#171714] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark in progress
        </button>
        <button
          disabled={!canPass}
          onClick={() => updateTest("passed")}
          className="rounded-full bg-[#171714] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pass test → Unlock build
        </button>
        <button
          disabled={!canFail}
          onClick={() => updateTest("failed")}
          className="rounded-full border border-[#e3b8b3] bg-white px-4 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Fail / refine again
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#73736d]">
        Build unlocks only after you record evidence and an outcome. ProductForge does not treat an unchecked test as proof.
      </p>
      {message && <p className="mt-2 text-xs font-semibold leading-5 text-[#5d5b55]">{message}</p>}
    </div>
  );
}

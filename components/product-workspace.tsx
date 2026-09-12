"use client";

import Link from "next/link";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  format: string | null;
  target_audience: string | null;
  promise: string | null;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  learning_outcome: string | null;
  position: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  learning_objective: string | null;
  position: number;
};

type Exercise = {
  id: string;
  module_id: string;
  title: string;
  instructions: string | null;
  completion_criteria: string | null;
};

type Worksheet = {
  id: string;
  module_id: string;
  title: string;
  content: { purpose?: string; prompts?: string[] } | null;
};

export function ProductWorkspace({
  projectId,
  product,
  modules,
  lessons,
  exercises,
  worksheets,
}: {
  projectId: string;
  product: Product;
  modules: Module[];
  lessons: Lesson[];
  exercises: Exercise[];
  worksheets: Worksheet[];
}) {
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id ?? "");
  const [activeLessonId, setActiveLessonId] = useState("");

  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0];
  const moduleLessons = lessons.filter((lesson) => lesson.module_id === activeModule?.id);
  const activeLesson = moduleLessons.find((lesson) => lesson.id === activeLessonId) ?? moduleLessons[0];
  const exercise = exercises.find((item) => item.module_id === activeModule?.id);
  const worksheet = worksheets.find((item) => item.module_id === activeModule?.id);

  function selectModule(moduleId: string) {
    setActiveModuleId(moduleId);
    setActiveLessonId("");
  }

  if (!activeModule) return null;

  return (
    <div className="mt-8 space-y-5">
      <section className="grid gap-4 lg:grid-cols-[.78fr_1.22fr]">
        <aside className="rounded-[30px] bg-[#171714] p-7 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Product concept</p>
          <h2 className="mt-3 text-3xl font-semibold">{product.name}</h2>
          <p className="mt-2 text-sm font-medium text-[#d9f06a]">{product.tagline || "Evidence-grounded product blueprint"}</p>
          <p className="mt-5 text-sm leading-7 text-white/60">{product.description}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/[.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Audience</p>
              <p className="mt-2 text-xs leading-5 text-white/80">{product.target_audience || "Defined by research"}</p>
            </div>
            <div className="rounded-2xl bg-white/[.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Format</p>
              <p className="mt-2 text-xs leading-5 text-white/80">{product.format || "Digital product"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-[#d9f06a] p-4 text-[#171714]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#58620e]">Promise</p>
            <p className="mt-2 text-xs leading-5 font-semibold">{product.promise}</p>
          </div>
        </aside>

        <div className="rounded-[30px] border border-[#deded7] bg-white p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Builder workspace</p>
              <h2 className="mt-2 text-3xl font-semibold">Shape the curriculum.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736d]">Choose a module to inspect its lessons, practical work, and worksheet. The workspace keeps the entire blueprint visible without turning the builder into a long document.</p>
            </div>
            <span className="rounded-full bg-[#dff77a] px-3 py-2 text-xs font-bold text-[#171714]">{modules.length} modules · {lessons.length} lessons</span>
          </div>

          <div className="mt-7 grid gap-2 md:grid-cols-2">
            {modules.map((module) => {
              const count = lessons.filter((lesson) => lesson.module_id === module.id).length;
              const active = module.id === activeModule.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => selectModule(module.id)}
                  className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#171714] bg-[#171714] text-white shadow-md" : "border-[#e5e5de] bg-[#fafaf8] text-[#171714] hover:-translate-y-0.5 hover:border-[#bdbdb5]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-bold ${active ? "text-[#d9f06a]" : "text-[#999991]"}`}>{String(module.position).padStart(2, "0")}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-white/45" : "text-[#999991]"}`}>{count} lessons</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{module.title}</p>
                  <p className={`mt-2 text-xs leading-5 ${active ? "text-white/55" : "text-[#73736d]"}`}>{module.learning_outcome}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#deded7] bg-white">
        <div className="border-b border-[#e5e5de] bg-[#fafaf8] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Module {String(activeModule.position).padStart(2, "0")}</p>
              <h2 className="mt-2 text-3xl font-semibold">{activeModule.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#73736d]">{activeModule.description}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-[#e5e5de]">
              <p className="text-[10px] uppercase tracking-wider text-[#999991]">Learning outcome</p>
              <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-[#41413c]">{activeModule.learning_outcome}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <nav className="border-b border-[#e5e5de] bg-[#f5f5f2] p-4 lg:border-b-0 lg:border-r">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#999991]">Lessons</p>
            <div className="space-y-1">
              {moduleLessons.map((lesson) => {
                const active = lesson.id === activeLesson?.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full rounded-xl p-3 text-left transition ${active ? "bg-white shadow-sm ring-1 ring-[#deded7]" : "hover:bg-white/70"}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#999991]">Lesson {lesson.position}</span>
                    <span className="mt-1 block text-sm font-semibold text-[#171714]">{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 p-7">
            {activeLesson ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#999991]">Lesson {activeLesson.position}</p>
                <h3 className="mt-2 text-2xl font-semibold">{activeLesson.title}</h3>
                <div className="mt-5 rounded-2xl bg-[#f5f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#999991]">Objective</p>
                  <p className="mt-2 text-sm leading-6 font-medium text-[#41413c]">{activeLesson.learning_objective}</p>
                </div>
                <div className="mt-6 whitespace-pre-line text-sm leading-7 text-[#5f5f58]">{activeLesson.content}</div>
              </div>
            ) : (
              <p className="text-sm text-[#73736d]">This module has no lessons yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[30px] bg-[#171714] p-7 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Practice</p>
          <h3 className="mt-2 text-2xl font-semibold">{exercise?.title || "Practical exercise"}</h3>
          <p className="mt-4 text-sm leading-7 text-white/60">{exercise?.instructions || "A practical exercise will be added for this module."}</p>
          <div className="mt-6 rounded-2xl bg-white/[.06] p-5">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Completion criteria</p>
            <p className="mt-2 text-xs leading-6 text-white/75">{exercise?.completion_criteria || "Complete the exercise and produce the expected output."}</p>
          </div>
        </div>

        <div className="rounded-[30px] bg-[#dff77a] p-7 text-[#171714]">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#58620e]">Worksheet</p>
          <h3 className="mt-2 text-2xl font-semibold">{worksheet?.title || "Application worksheet"}</h3>
          <p className="mt-4 text-sm leading-7 text-[#41431f]">{worksheet?.content?.purpose || "Use this worksheet to turn the module into concrete work."}</p>
          <div className="mt-6 space-y-2">
            {(worksheet?.content?.prompts ?? []).map((prompt, index) => (
              <div key={`${worksheet?.id ?? activeModule.id}-${index}`} className="rounded-xl bg-white/60 px-4 py-3 text-xs font-medium leading-5 text-[#41431f]">
                <span className="mr-2 font-bold">{index + 1}.</span>{prompt}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#deded7] bg-white p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Next stage</p>
            <h2 className="mt-2 text-2xl font-semibold">The blueprint is ready for packaging and launch planning.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Keep the research, product promise, and curriculum together as you move into the launch advisor.</p>
          </div>
          <Link href={`/projects/${projectId}/launch`} className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
            Open launch advisor →
          </Link>
        </div>
      </section>
    </div>
  );
}

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

type EditableText = {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function EditableTextField({ label, value, multiline = false, onChange }: EditableText) {
  const className = "mt-2 w-full rounded-2xl border border-[#deded7] bg-[#fafaf8] px-4 py-3 text-sm leading-6 text-[#171714] outline-none transition placeholder:text-[#aaa9a1] focus:border-[#171714] focus:bg-white";
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a8a82]">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} className={className} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

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
  const [productState, setProductState] = useState<Product>(product);
  const [moduleState, setModuleState] = useState<Module[]>(modules);
  const [lessonState, setLessonState] = useState<Lesson[]>(lessons);
  const [exerciseState, setExerciseState] = useState<Exercise[]>(exercises);
  const [worksheetState, setWorksheetState] = useState<Worksheet[]>(worksheets);
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id ?? "");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [editing, setEditing] = useState<"product" | "module" | "lesson" | "exercise" | "worksheet" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  const activeModule = moduleState.find((module) => module.id === activeModuleId) ?? moduleState[0];
  const moduleLessons = lessonState.filter((lesson) => lesson.module_id === activeModule?.id);
  const activeLesson = moduleLessons.find((lesson) => lesson.id === activeLessonId) ?? moduleLessons[0];
  const exercise = exerciseState.find((item) => item.module_id === activeModule?.id);
  const worksheet = worksheetState.find((item) => item.module_id === activeModule?.id);

  function selectModule(moduleId: string) {
    setActiveModuleId(moduleId);
    setActiveLessonId("");
    setEditing(null);
    setSaveMessage("");
  }

  function startEdit(type: NonNullable<typeof editing>) {
    setEditing(type);
    setSaveMessage("");
    setSaveError(false);

    if (type === "product") {
      window.setTimeout(() => {
        document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  function cancelEdit() {
    setEditing(null);
    setSaveMessage("");
  }

  async function save(type: NonNullable<typeof editing>, id: string, fields: Record<string, unknown>, apply: (data: any) => void) {
    setSaving(true);
    setSaveMessage("");
    setSaveError(false);
    try {
      const response = await fetch("/api/build/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type, id, fields }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSaveError(true);
        setSaveMessage(payload.error ?? "Could not save your changes.");
        return;
      }
      apply(payload.data);
      setEditing(null);
      setSaveMessage("Saved");
    } catch {
      setSaveError(true);
      setSaveMessage("Could not reach the builder. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProduct() {
    await save("product", productState.id, {
      name: productState.name,
      tagline: productState.tagline,
      description: productState.description,
      format: productState.format,
      target_audience: productState.target_audience,
      promise: productState.promise,
    }, (data) => setProductState(data));
  }

  if (!activeModule) return null;

  return (
    <div className="mt-8 space-y-5">
      {saveMessage && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${saveError ? "border-red-200 bg-red-50 text-red-700" : "border-[#dce88b] bg-[#f5fbd7] text-[#41431f]"}`}>
          {saveMessage}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[.78fr_1.22fr]">
        <aside className="rounded-[30px] bg-[#171714] p-7 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Product concept</p>
              <h2 className="mt-3 text-3xl font-semibold">{productState.name}</h2>
              <p className="mt-2 text-sm font-medium text-[#d9f06a]">{productState.tagline || "Evidence-grounded product blueprint"}</p>
            </div>
            <button type="button" onClick={() => startEdit("product")} className="relative z-10 cursor-pointer rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white">Edit product</button>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/60">{productState.description}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/[.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Audience</p>
              <p className="mt-2 text-xs leading-5 text-white/80">{productState.target_audience || "Defined by research"}</p>
            </div>
            <div className="rounded-2xl bg-white/[.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Format</p>
              <p className="mt-2 text-xs leading-5 text-white/80">{productState.format || "Digital product"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-[#d9f06a] p-4 text-[#171714]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#58620e]">Promise</p>
            <p className="mt-2 text-xs leading-5 font-semibold">{productState.promise}</p>
          </div>
        </aside>

        <div className="rounded-[30px] border border-[#deded7] bg-white p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Builder workspace</p>
              <h2 className="mt-2 text-3xl font-semibold">Shape the curriculum.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736d]">Edit the generated blueprint directly. Your changes are saved to the ProductForge project and remain connected to the validated opportunity.</p>
            </div>
            <span className="rounded-full bg-[#dff77a] px-3 py-2 text-xs font-bold text-[#171714]">{moduleState.length} modules · {lessonState.length} lessons</span>
          </div>

          <div className="mt-7 grid gap-2 md:grid-cols-2">
            {moduleState.map((module) => {
              const count = lessonState.filter((lesson) => lesson.module_id === module.id).length;
              const active = module.id === activeModule.id;
              return (
                <button key={module.id} type="button" onClick={() => selectModule(module.id)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#171714] bg-[#171714] text-white shadow-md" : "border-[#e5e5de] bg-[#fafaf8] text-[#171714] hover:-translate-y-0.5 hover:border-[#bdbdb5]"}`}>
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

      {editing === "product" && (
        <section id="product-editor" className="scroll-mt-24 rounded-[30px] border-2 border-[#171714] bg-white p-7 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Edit product</p><h3 className="mt-2 text-2xl font-semibold">Product concept</h3></div>
            <button type="button" onClick={cancelEdit} className="text-xs font-semibold text-[#73736d]">Cancel</button>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <EditableTextField label="Name" value={productState.name} onChange={(value) => setProductState({ ...productState, name: value })} />
            <EditableTextField label="Tagline" value={productState.tagline ?? ""} onChange={(value) => setProductState({ ...productState, tagline: value })} />
            <EditableTextField label="Format" value={productState.format ?? ""} onChange={(value) => setProductState({ ...productState, format: value })} />
            <EditableTextField label="Target audience" value={productState.target_audience ?? ""} onChange={(value) => setProductState({ ...productState, target_audience: value })} multiline />
            <EditableTextField label="Description" value={productState.description ?? ""} onChange={(value) => setProductState({ ...productState, description: value })} multiline />
            <EditableTextField label="Promise" value={productState.promise ?? ""} onChange={(value) => setProductState({ ...productState, promise: value })} multiline />
          </div>
          <div className="mt-6 flex items-center gap-3"><button type="button" disabled={saving} onClick={saveProduct} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save product"}</button><span className="text-xs text-[#999991]">Saved changes update the project immediately.</span></div>
        </section>
      )}

      <section className="overflow-hidden rounded-[30px] border border-[#deded7] bg-white">
        <div className="border-b border-[#e5e5de] bg-[#fafaf8] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Module {String(activeModule.position).padStart(2, "0")}</p>
              <h2 className="mt-2 text-3xl font-semibold">{activeModule.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#73736d]">{activeModule.description}</p>
            </div>
            <button type="button" onClick={() => startEdit("module")} className="rounded-full border border-[#deded7] px-4 py-2 text-xs font-bold text-[#41413c] transition hover:border-[#171714]">Edit module</button>
          </div>
        </div>

        {editing === "module" && (
          <div className="border-b border-[#e5e5de] bg-[#f5f5f2] p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <EditableTextField label="Module title" value={activeModule.title} onChange={(value) => setModuleState(moduleState.map((item) => item.id === activeModule.id ? { ...item, title: value } : item))} />
              <EditableTextField label="Learning outcome" value={activeModule.learning_outcome ?? ""} onChange={(value) => setModuleState(moduleState.map((item) => item.id === activeModule.id ? { ...item, learning_outcome: value } : item))} multiline />
              <div className="md:col-span-2"><EditableTextField label="Description" value={activeModule.description ?? ""} onChange={(value) => setModuleState(moduleState.map((item) => item.id === activeModule.id ? { ...item, description: value } : item))} multiline /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={saving} onClick={() => save("module", activeModule.id, { title: activeModule.title, description: activeModule.description, learning_outcome: activeModule.learning_outcome }, (data) => setModuleState(moduleState.map((item) => item.id === activeModule.id ? data : item)))} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save module"}</button>
              <button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-[#73736d]">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <nav className="border-b border-[#e5e5de] bg-[#f5f5f2] p-4 lg:border-b-0 lg:border-r">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#999991]">Lessons</p>
            <div className="space-y-1">
              {moduleLessons.map((lesson) => {
                const active = lesson.id === activeLesson?.id;
                return <button key={lesson.id} type="button" onClick={() => { setActiveLessonId(lesson.id); setEditing(null); }} className={`w-full rounded-xl p-3 text-left transition ${active ? "bg-white shadow-sm ring-1 ring-[#deded7]" : "hover:bg-white/70"}`}><span className="text-[10px] font-bold uppercase tracking-wider text-[#999991]">Lesson {lesson.position}</span><span className="mt-1 block text-sm font-semibold text-[#171714]">{lesson.title}</span></button>;
              })}
            </div>
          </nav>

          <div className="min-w-0 p-7">
            {activeLesson ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#999991]">Lesson {activeLesson.position}</p><h3 className="mt-2 text-2xl font-semibold">{activeLesson.title}</h3></div>
                  <button type="button" onClick={() => startEdit("lesson")} className="rounded-full border border-[#deded7] px-4 py-2 text-xs font-bold text-[#41413c]">Edit lesson</button>
                </div>

                {editing === "lesson" ? (
                  <div className="mt-6 rounded-2xl bg-[#f5f5f2] p-5">
                    <div className="space-y-5">
                      <EditableTextField label="Lesson title" value={activeLesson.title} onChange={(value) => setLessonState(lessonState.map((item) => item.id === activeLesson.id ? { ...item, title: value } : item))} />
                      <EditableTextField label="Learning objective" value={activeLesson.learning_objective ?? ""} onChange={(value) => setLessonState(lessonState.map((item) => item.id === activeLesson.id ? { ...item, learning_objective: value } : item))} multiline />
                      <EditableTextField label="Lesson content" value={activeLesson.content ?? ""} onChange={(value) => setLessonState(lessonState.map((item) => item.id === activeLesson.id ? { ...item, content: value } : item))} multiline />
                    </div>
                    <div className="mt-5 flex gap-3"><button type="button" disabled={saving} onClick={() => save("lesson", activeLesson.id, { title: activeLesson.title, content: activeLesson.content, learning_objective: activeLesson.learning_objective }, (data) => setLessonState(lessonState.map((item) => item.id === activeLesson.id ? data : item)))} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save lesson"}</button><button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-[#73736d]">Cancel</button></div>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 rounded-2xl bg-[#f5f5f2] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#999991]">Objective</p><p className="mt-2 text-sm leading-6 font-medium text-[#41413c]">{activeLesson.learning_objective}</p></div>
                    <div className="mt-6 whitespace-pre-line text-sm leading-7 text-[#5f5f58]">{activeLesson.content}</div>
                  </>
                )}
              </div>
            ) : <p className="text-sm text-[#73736d]">This module has no lessons yet.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[30px] bg-[#171714] p-7 text-white">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Practice</p><h3 className="mt-2 text-2xl font-semibold">{exercise?.title || "Practical exercise"}</h3></div>{exercise && <button type="button" onClick={() => startEdit("exercise")} className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/65">Edit</button>}</div>
          {editing === "exercise" && exercise ? (
            <div className="mt-6 space-y-5 rounded-2xl bg-white/[.05] p-5">
              <EditableTextField label="Exercise title" value={exercise.title} onChange={(value) => setExerciseState(exerciseState.map((item) => item.id === exercise.id ? { ...item, title: value } : item))} />
              <EditableTextField label="Instructions" value={exercise.instructions ?? ""} onChange={(value) => setExerciseState(exerciseState.map((item) => item.id === exercise.id ? { ...item, instructions: value } : item))} multiline />
              <EditableTextField label="Completion criteria" value={exercise.completion_criteria ?? ""} onChange={(value) => setExerciseState(exerciseState.map((item) => item.id === exercise.id ? { ...item, completion_criteria: value } : item))} multiline />
              <div className="flex gap-3"><button type="button" disabled={saving} onClick={() => save("exercise", exercise.id, { title: exercise.title, instructions: exercise.instructions, completion_criteria: exercise.completion_criteria }, (data) => setExerciseState(exerciseState.map((item) => item.id === exercise.id ? data : item)))} className="rounded-full bg-[#d9f06a] px-5 py-3 text-sm font-bold text-[#171714] disabled:opacity-50">{saving ? "Saving…" : "Save exercise"}</button><button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-white/60">Cancel</button></div>
            </div>
          ) : <><p className="mt-4 text-sm leading-7 text-white/60">{exercise?.instructions || "A practical exercise will be added for this module."}</p><div className="mt-6 rounded-2xl bg-white/[.06] p-5"><p className="text-[10px] uppercase tracking-wider text-white/40">Completion criteria</p><p className="mt-2 text-xs leading-6 text-white/75">{exercise?.completion_criteria || "Complete the exercise and produce the expected output."}</p></div></>}
        </div>

        <div className="rounded-[30px] bg-[#dff77a] p-7 text-[#171714]">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#58620e]">Worksheet</p><h3 className="mt-2 text-2xl font-semibold">{worksheet?.title || "Application worksheet"}</h3></div>{worksheet && <button type="button" onClick={() => startEdit("worksheet")} className="rounded-full border border-[#aab957] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#41431f]">Edit</button>}</div>
          {editing === "worksheet" && worksheet ? (
            <div className="mt-6 space-y-5 rounded-2xl bg-white/35 p-5">
              <EditableTextField label="Worksheet title" value={worksheet.title} onChange={(value) => setWorksheetState(worksheetState.map((item) => item.id === worksheet.id ? { ...item, title: value } : item))} />
              <EditableTextField label="Purpose" value={worksheet.content?.purpose ?? ""} onChange={(value) => setWorksheetState(worksheetState.map((item) => item.id === worksheet.id ? { ...item, content: { ...(item.content ?? {}), purpose: value } } : item))} multiline />
              <label className="block"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#58620e]">Prompts</span><textarea value={(worksheet.content?.prompts ?? []).join("\n")} onChange={(event) => setWorksheetState(worksheetState.map((item) => item.id === worksheet.id ? { ...item, content: { ...(item.content ?? {}), prompts: event.target.value.split("\n").map((prompt) => prompt.trim()).filter(Boolean) } } : item))} rows={7} className="mt-2 w-full rounded-2xl border border-[#b9c964] bg-white/70 px-4 py-3 text-sm leading-6 outline-none focus:border-[#171714]" /><span className="mt-1 block text-[10px] text-[#58620e]">One prompt per line.</span></label>
              <div className="flex gap-3"><button type="button" disabled={saving} onClick={() => save("worksheet", worksheet.id, { title: worksheet.title, content: worksheet.content }, (data) => setWorksheetState(worksheetState.map((item) => item.id === worksheet.id ? data : item)))} className="rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save worksheet"}</button><button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-[#41431f]">Cancel</button></div>
            </div>
          ) : <><p className="mt-4 text-sm leading-7 text-[#41431f]">{worksheet?.content?.purpose || "Use this worksheet to turn the module into concrete work."}</p><div className="mt-6 space-y-2">{(worksheet?.content?.prompts ?? []).map((prompt, index) => <div key={`${worksheet?.id ?? activeModule.id}-${index}`} className="rounded-xl bg-white/60 px-4 py-3 text-xs font-medium leading-5 text-[#41431f]"><span className="mr-2 font-bold">{index + 1}.</span>{prompt}</div>)}</div></>}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#deded7] bg-white p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a8a82]">Next stage</p><h2 className="mt-2 text-2xl font-semibold">The product is shaped. Now plan how it reaches its audience.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#73736d]">Keep the research, product promise, and curriculum together as you move into the launch advisor.</p></div>
          <Link href={`/projects/${projectId}/launch`} className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">Open launch advisor →</Link>
        </div>
      </section>
    </div>
  );
}

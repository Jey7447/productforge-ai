import { Brand, ProductForgeMark } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f5f2] px-4 py-4 text-[#171714] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1440px] flex-col overflow-hidden rounded-[32px] border border-[#deded7] bg-white lg:grid lg:grid-cols-[1fr_.8fr]">
        <div className="flex flex-col p-6 sm:p-10 lg:p-14">
          <Brand />
          <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
        </div>
        <aside className="relative hidden overflow-hidden bg-[#171714] p-10 text-white lg:block">
          <div className="pf-grid absolute inset-0 opacity-10" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/55">ProductForge workspace</span>
              <h2 className="pf-display mt-8 max-w-xl text-6xl font-semibold leading-[.92]">Find the gap.<br />Build what matters.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/50">Research demand, understand pain, compare competition and turn the strongest opportunity into a product plan.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[.04] p-5">
              <div className="flex items-center gap-3"><ProductForgeMark /><div><p className="text-sm font-semibold">Evidence first</p><p className="text-xs text-white/45">Sources stay attached to the insight.</p></div></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

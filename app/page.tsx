import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-semibold tracking-tight">ProductForge AI</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white">Log in</Link>
          <Link href="/signup" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">Get started</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">Research-backed product discovery</div>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">Find product opportunities worth building.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">ProductForge AI researches demand, customer problems, competition and monetization signals, then turns the evidence into ranked digital-product opportunities.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-slate-950 px-6 py-3 font-medium text-white">Find an opportunity</Link>
            <a href="#how-it-works" className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium">See how it works</a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><span className="font-semibold">Opportunity analysis</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">High confidence</span></div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Opportunity</p><h2 className="mt-1 text-xl font-semibold">Client onboarding toolkit for solo consultants</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[['Demand','84'],['Problem intensity','91'],['Competition gap','78'],['Buildability','93']].map(([label,value]) => <div key={label} className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
            </div>
            <div className="mt-4 rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs text-slate-300">Overall opportunity score</p><p className="mt-1 text-3xl font-semibold">85/100</p></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-6 py-20"><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">How it works</p><h2 className="mt-3 text-3xl font-semibold">Evidence first. AI second.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[['01','Tell us what you know','Start with your skills, audience, interests or a market you want to explore.'],['02','Research the market','ProductForge gathers and organizes evidence around demand, pain points and existing solutions.'],['03','Choose what to build','Compare scored opportunities, validate the strongest idea and turn it into a product plan.']].map(([n,t,d]) => <div key={n} className="rounded-2xl border border-slate-200 p-6"><span className="text-sm text-slate-400">{n}</span><h3 className="mt-8 text-lg font-semibold">{t}</h3><p className="mt-2 leading-7 text-slate-600">{d}</p></div>)}</div></div></section>
    </main>
  );
}

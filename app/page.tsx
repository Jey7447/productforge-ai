import Link from "next/link";
import { Brand, ProductForgeMark } from "@/components/brand";

const opportunities = [
  { type: "STUDY SYSTEM", title: "Technical exam prep kit for engineering students", meta: "High demand · Clear pain", score: "91", tone: "bg-[#e7f3a2]" },
  { type: "CREATOR TOOL", title: "Content planning workspace for solo educators", meta: "Low competition · Buildable", score: "86", tone: "bg-[#f1ddd0]" },
  { type: "BUSINESS KIT", title: "Client onboarding system for freelance consultants", meta: "Strong monetization · Specific", score: "84", tone: "bg-[#dfe8f1]" },
];

const stages = [
  ["01", "Discover", "Find real problems and underserved audiences."],
  ["02", "Research", "Gather market evidence before making a recommendation."],
  ["03", "Validate", "Pressure-test demand, competition and monetization signals."],
  ["04", "Build", "Turn the strongest opportunity into a structured product."],
  ["05", "Launch", "Get a practical go-to-market plan tied to the research."],
];

const features = [
  ["Evidence layer", "See the sources, claims and signals behind each opportunity."],
  ["Opportunity scoring", "Compare demand, pain, competition gap, monetization, specificity and buildability."],
  ["Product blueprint", "Move from a validated opportunity into modules, lessons, exercises and resources."],
  ["Launch advisor", "Turn research into positioning, channels, pricing, launch tasks and growth experiments."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f2] text-[#171714]">
      <header className="sticky top-0 z-40 border-b border-[#deded7]/80 bg-[#f5f5f2]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand />
          <div className="hidden items-center gap-8 text-[13px] font-medium text-[#73736d] lg:flex">
            <a href="#explore" className="transition hover:text-[#171714]">Explore</a>
            <a href="#how-it-works" className="transition hover:text-[#171714]">How it works</a>
            <a href="#why" className="transition hover:text-[#171714]">Why ProductForge</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-white">Log in</Link>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#171714] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">Get started <span>↗</span></Link>
          </div>
        </nav>
      </header>

      <section className="relative mx-3 mt-3 overflow-hidden rounded-[34px] border border-[#deded7] bg-[#ecece6] sm:mx-5 lg:mx-8">
        <div className="pf-grid absolute inset-0 opacity-80" />
        <div className="relative mx-auto max-w-[1440px] px-6 pb-12 pt-14 sm:px-10 sm:pt-16 lg:px-16 lg:pb-16 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-14">
            <div>
              <div className="pf-pill mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66665f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9ab100]" /> Research-backed product discovery
              </div>
              <h1 className="pf-display max-w-3xl text-[58px] font-semibold leading-[.9] tracking-[-.06em] sm:text-7xl lg:text-[84px] xl:text-[96px]">
                Find the gap.<br /><span className="relative inline-block"><span className="absolute inset-x-[-.04em] bottom-[.04em] h-[.26em] -rotate-1 rounded-full bg-[#d9f06a]" /><span className="relative">Build the product.</span></span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-[#66665f] sm:text-base">
                ProductForge turns real market evidence into digital-product opportunities you can understand, validate and build — without pretending an AI opinion is proof of demand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex items-center gap-3 rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">Start researching <span>→</span></Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-[#cfcfc7] bg-white/80 px-6 py-3.5 text-sm font-semibold transition hover:bg-white">◉ <span>See how it works</span></a>
              </div>
              <div className="mt-9 grid max-w-xl grid-cols-3 border-y border-[#d7d7cf] py-4">
                {[["6", "scoring signals"], ["2+", "evidence / idea"], ["1", "research loop"]].map(([value, label]) => (
                  <div key={label} className="border-r border-[#d7d7cf] px-3 first:pl-0 last:border-0">
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#85857d]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[460px] lg:min-h-[500px]">
              <div className="absolute -right-8 top-4 h-40 w-40 rounded-full bg-[#d9f06a]/30 blur-3xl" />
              <div className="absolute left-2 top-14 hidden -rotate-6 rounded-2xl border border-[#cfcfc7] bg-white/90 px-4 py-3 text-xs shadow-sm sm:block">
                <span className="font-semibold">Real ideas.</span><br />Real data.<br /><span className="font-semibold">Real products.</span>
              </div>
              <div className="absolute right-0 top-8 w-[94%] rotate-[2deg] rounded-[24px] border border-[#bdbdb5] bg-[#20201d] p-2 shadow-[0_35px_70px_rgba(23,23,20,.2)] sm:right-3">
                <div className="rounded-[18px] bg-[#f7f7f3] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#deded7] pb-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold"><ProductForgeMark className="h-6 w-6" /> Research workspace</div>
                    <span className="rounded-full bg-[#eef5cf] px-2 py-1 text-[9px] font-bold text-[#536400]">Evidence first</span>
                  </div>
                  <div className="grid gap-4 pt-5 sm:grid-cols-[1.2fr_.8fr]">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#999991]">Top opportunity</p>
                      <h2 className="mt-2 text-lg font-bold leading-tight sm:text-2xl">Engineering exam prep system for difficult technical courses</h2>
                      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#dff07d] px-2.5 py-1 text-[9px] font-bold">High demand</span><span className="rounded-full bg-[#e7e7e0] px-2.5 py-1 text-[9px] font-bold">Clear pain</span><span className="rounded-full bg-[#e7e7e0] px-2.5 py-1 text-[9px] font-bold">Buildable</span></div>
                      <div className="mt-6 flex items-end gap-2"><div className="text-4xl font-bold tracking-tight">91</div><div className="pb-1 text-[10px] text-[#85857d]">/100 opportunity score</div></div>
                    </div>
                    <div className="rounded-2xl border border-[#deded7] bg-white p-3">
                      {[['Demand','92'],['Problem','95'],['Competition gap','84'],['Buildability','90']].map(([label,value]) => <div key={label} className="border-b border-[#eeeeea] py-2.5 last:border-0"><div className="flex justify-between text-[9px] text-[#85857d]"><span>{label}</span><b className="text-[#171714]">{value}</b></div><div className="mt-1.5 h-1.5 rounded-full bg-[#eeeeea]"><div className="h-full rounded-full bg-[#171714]" style={{ width: `${value}%` }} /></div></div>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 left-0 w-56 rounded-[20px] border border-[#d1d1c9] bg-white p-4 shadow-xl sm:left-3">
                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#999991]">Research status</p>
                <div className="mt-3 space-y-2 text-[10px] font-medium"><p>✓ Query planning</p><p>✓ Searching the web</p><p className="text-[#536400]">● Collecting evidence</p><p className="text-[#aaa9a1]">○ Scoring opportunities</p></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ecece6]"><div className="h-full w-[68%] rounded-full bg-[#171714]" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">How ProductForge works</p><h2 className="pf-display mt-3 max-w-3xl text-4xl font-semibold sm:text-6xl">From insight to income.<br />Five deliberate steps.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#73736d]">The product is not just an idea generator. It is a research-to-launch workflow.</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {stages.map(([number, title, description], index) => <article key={number} className={`pf-card pf-card-hover rounded-[26px] p-5 ${index === 1 ? "bg-[#eef5cf]" : ""}`}><span className="text-[10px] font-bold tracking-[.18em] text-[#9a9a91]">{number}</span><div className="mt-12"><div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-[#d8d8d0] bg-white text-sm">{["⌁","◫","◒","◇","↗"][index]}</div><h3 className="text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 text-xs leading-5 text-[#73736d]">{description}</p></div></article>)}
        </div>
      </section>

      <section id="explore" className="border-y border-[#deded7] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">The evidence layer</p><h2 className="pf-display mt-4 text-4xl font-semibold sm:text-6xl">AI should explain itself.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#73736d]">ProductForge separates evidence from interpretation. Sources become inputs to synthesis, scoring and recommendations — so you can inspect why an opportunity ranked where it did.</p><Link href="/signup" className="mt-7 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Explore your market →</Link></div>
            <div className="grid gap-3 sm:grid-cols-2">{features.map(([title, description], index) => <article key={title} className="pf-card pf-card-hover rounded-[26px] p-6"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171714] text-sm text-[#d9f06a]">0{index + 1}</span><span className="text-xl text-[#b0b0a7]">↗</span></div><h3 className="mt-12 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#73736d]">{description}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="rounded-[32px] bg-[#dff77a] p-6 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536400]">Featured opportunities · illustrative</p><h2 className="pf-display mt-4 text-4xl font-semibold sm:text-5xl">Real signals.<br />Useful hypotheses.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-[#536400]">Examples show the shape of the output. Your workspace will use the evidence collected for your own market.</p><Link href="/signup" className="mt-7 inline-flex rounded-full bg-[#171714] px-5 py-3 text-sm font-semibold text-white">Find my opportunities →</Link></div>
            <div className="grid gap-3 sm:grid-cols-3">{opportunities.map((item) => <article key={item.title} className="rounded-[24px] border border-black/10 bg-white p-4 shadow-sm"><div className={`mb-4 h-24 rounded-[18px] ${item.tone} p-3`}><div className="flex h-full items-end justify-between"><div className="h-10 w-16 rounded-lg border border-black/10 bg-white/60" /><div className="flex items-end gap-1">{[30,50,38,68,58].map((height, i) => <span key={i} className="w-1.5 rounded-full bg-[#171714]/80" style={{ height }} />)}</div></div></div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#999991]">{item.type}</p><h3 className="mt-2 text-sm font-semibold leading-5">{item.title}</h3><div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-[#f0f0eb] px-2 py-1 text-[9px] font-bold">{item.meta}</span><b className="text-lg">{item.score}</b></div></article>)}</div>
          </div>
        </div>
      </section>

      <section id="why" className="border-t border-[#deded7] bg-[#171714] text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/45">One product loop</p><h2 className="pf-display mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">Research → Validate → Build → Launch → Learn.</h2></div><p className="max-w-sm text-sm leading-6 text-white/55">Your product does not stop at a generated outline. ProductForge is designed to keep the research attached to what you build next.</p></div>
          <div className="mt-12 grid overflow-hidden rounded-[28px] border border-white/10 sm:grid-cols-4">{[["Research","Collect evidence"],["Validate","Pressure-test"],["Build","Create the product"],["Launch","Take it to market"]].map(([title,desc], i) => <div key={title} className="border-b border-white/10 bg-white/[.035] p-6 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="text-xs text-white/35">0{i+1}</span><h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm text-white/50">{desc}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24"><div className="rounded-[32px] border border-[#deded7] bg-white p-8 text-center sm:p-14"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">Ready when you are</p><h2 className="pf-display mx-auto mt-4 max-w-3xl text-5xl font-semibold sm:text-7xl">Stop guessing.<br />Start researching.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#73736d]">Give ProductForge a problem, audience, skill or market. We will turn that starting point into a research workflow.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white">Create your first project →</Link><Link href="/login" className="rounded-full border border-[#d2d2ca] px-6 py-3.5 text-sm font-semibold">Log in</Link></div></div></section>

      <footer className="border-t border-[#deded7]"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 text-xs text-[#85857d] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16"><Brand /><div className="flex flex-wrap gap-5"><span>Product</span><span>Research</span><span>Validation</span><span>Launch</span><span>Support</span></div><span>© {new Date().getFullYear()} ProductForge</span></div></footer>
    </main>
  );
}

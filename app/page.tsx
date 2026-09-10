import Link from "next/link";

const opportunities = [
  { type: "STUDY SYSTEM", title: "Technical exam prep kit for engineering students", meta: "High demand · Clear pain", score: "91", tone: "bg-[#e7f3a2]" },
  { type: "CREATOR TOOL", title: "Content planning workspace for solo educators", meta: "Low competition · Buildable", score: "86", tone: "bg-[#f1ddd0]" },
  { type: "BUSINESS KIT", title: "Client onboarding system for freelance consultants", meta: "Strong monetization · Specific", score: "84", tone: "bg-[#dfe8f1]" },
];

const steps = [
  ["01", "Start with a problem", "Tell ProductForge what you know, who you want to help, or what market you want to explore."],
  ["02", "Research the evidence", "We organize demand signals, customer pain, existing solutions and market gaps before scoring anything."],
  ["03", "Build with confidence", "Compare opportunities, validate the strongest one, create the product and plan how to launch it."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f2] text-[#171714]">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171714] text-sm font-bold text-[#d9f06a]">PF</span>
          <span>ProductForge</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-[#73736d] md:flex">
          <a href="#explore" className="transition hover:text-[#171714]">Explore</a>
          <a href="#how-it-works" className="transition hover:text-[#171714]">How it works</a>
          <a href="#why" className="transition hover:text-[#171714]">Why ProductForge</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-white">Log in</Link>
          <Link href="/signup" className="rounded-full bg-[#171714] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">Get started</Link>
        </div>
      </nav>

      <section className="pf-grid relative mx-3 overflow-hidden rounded-[32px] border border-[#deded7] bg-[#ecece6] sm:mx-5 lg:mx-8">
        <div className="mx-auto max-w-[1440px] px-6 pb-20 pt-16 sm:px-10 sm:pt-20 lg:px-16 lg:pb-28 lg:pt-24">
          <div className="max-w-4xl">
            <div className="pf-pill mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#5e5e58]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8ca400]" /> Research-backed product discovery
            </div>
            <h1 className="pf-display max-w-5xl text-5xl font-semibold leading-[0.94] sm:text-7xl lg:text-[92px]">
              Find the gap.<br />Build the product.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-[#66665f] sm:text-lg">
              ProductForge turns real market evidence into digital-product opportunities you can understand, validate and build — without guessing what people will pay for.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Find an opportunity <span className="ml-2">↗</span></Link>
              <a href="#how-it-works" className="rounded-full border border-[#cfcfc7] bg-white/70 px-6 py-3.5 text-sm font-semibold transition hover:bg-white">See how it works</a>
            </div>
          </div>

          <div className="mt-16 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-[28px] border border-[#d7d7cf] bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8a82]">Live opportunity board</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">What could be worth building?</h2>
                </div>
                <span className="rounded-full bg-[#eef5cf] px-3 py-1.5 text-xs font-semibold text-[#536400]">Evidence first</span>
              </div>
              <div className="mt-6 space-y-3">
                {opportunities.map((item) => (
                  <div key={item.title} className="pf-card-hover rounded-2xl border border-[#e2e2db] bg-[#fafaf8] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.16em] text-[#8a8a82]">{item.type}</p>
                        <h3 className="mt-2 max-w-lg text-sm font-semibold leading-5 sm:text-base">{item.title}</h3>
                        <p className="mt-2 text-xs text-[#77776f]">{item.meta}</p>
                      </div>
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                        <span className="text-lg font-bold">{item.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-[#171714] p-6 text-white sm:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Opportunity analysis</p>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70">Example</span>
              </div>
              <div className="mt-12">
                <p className="text-sm text-white/45">Top signal</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Engineering exam prep system for difficult technical courses</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/55">A research-backed opportunity assembled from demand, pain-point, competition and buildability signals.</p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-2">
                {["Demand", "Problem", "Competition gap", "Buildability"].map((label, i) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[11px] text-white/40">{label}</p>
                    <p className="mt-1 text-xl font-semibold">{[92, 95, 84, 90][i]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#d9f06a] px-5 py-4 text-[#171714]">
                <span className="text-sm font-semibold">Opportunity score</span>
                <span className="text-2xl font-bold">91/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a8a82]">Explore the workflow</p>
            <h2 className="pf-display mt-3 max-w-2xl text-4xl font-semibold sm:text-5xl">From vague idea to a product you can defend.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#73736d]">Every recommendation is designed to show the evidence behind the opportunity, not just an AI-generated opinion.</p>
        </div>

        <div id="how-it-works" className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <article key={number} className="pf-card pf-card-hover min-h-64 rounded-[28px] p-6 sm:p-7">
              <span className="text-xs font-bold tracking-[0.15em] text-[#9a9a91]">{number}</span>
              <div className="mt-16">
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#73736d]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="why" className="border-t border-[#deded7] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a8a82]">The ProductForge loop</p>
              <h2 className="pf-display mt-4 text-4xl font-semibold sm:text-5xl">Research → Build → Launch → Learn.</h2>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-[#deded7] bg-[#deded7] sm:grid-cols-4">
              {["Research", "Validate", "Create", "Launch"].map((item, i) => (
                <div key={item} className="bg-[#fafaf8] p-5 sm:p-6">
                  <span className="text-xs text-[#9a9a91]">0{i + 1}</span>
                  <p className="mt-8 font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-8 text-xs text-[#85857d] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <span>© {new Date().getFullYear()} ProductForge AI</span>
        <span>Research-backed digital product discovery.</span>
      </footer>
    </main>
  );
}

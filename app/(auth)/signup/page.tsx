import Link from "next/link";
import { signup } from "../actions";

type SignupPageProps = { searchParams?: Promise<{ error?: string }> };

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  return (
    <section className="w-full">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">01 · Start here</p>
      <h1 className="pf-display mt-3 text-5xl font-semibold tracking-tight">Build your first idea.</h1>
      <p className="mt-4 text-sm leading-6 text-[#73736d]">Create a workspace and let ProductForge turn your starting point into evidence-backed opportunities.</p>
      {params.error ? <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div> : null}
      <form action={signup} className="mt-8 space-y-5 rounded-[28px] border border-[#deded7] bg-[#fafaf8] p-6 sm:p-7">
        <div><label htmlFor="name" className="mb-2 block text-sm font-semibold">Name</label><input id="name" name="name" type="text" required autoComplete="name" className="pf-focus w-full rounded-2xl border border-[#d8d8d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#8f8f86]" /></div>
        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="pf-focus w-full rounded-2xl border border-[#d8d8d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#8f8f86]" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label><input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="pf-focus w-full rounded-2xl border border-[#d8d8d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#8f8f86]" /></div>
        <button className="w-full rounded-full bg-[#171714] px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">Create account →</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#73736d]">Already have an account? <Link href="/login" className="font-semibold text-[#171714]">Log in</Link></p>
    </section>
  );
}

import Link from "next/link";
import { login } from "../actions";

type LoginPageProps = { searchParams?: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  return (
    <section className="w-full">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a8a82]">Welcome back</p>
      <h1 className="pf-display mt-3 text-5xl font-semibold tracking-tight">Continue building.</h1>
      <p className="mt-4 text-sm leading-6 text-[#73736d]">Log in to return to your ProductForge research workspace.</p>
      {params.error ? <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div> : null}
      {params.message ? <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.message}</div> : null}
      <form action={login} className="mt-8 space-y-5 rounded-[28px] border border-[#deded7] bg-[#fafaf8] p-6 sm:p-7">
        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="pf-focus w-full rounded-2xl border border-[#d8d8d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#8f8f86]" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label><input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" className="pf-focus w-full rounded-2xl border border-[#d8d8d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#8f8f86]" /></div>
        <button className="w-full rounded-full bg-[#171714] px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">Log in →</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#73736d]">New to ProductForge? <Link href="/signup" className="font-semibold text-[#171714]">Create an account</Link></p>
    </section>
  );
}

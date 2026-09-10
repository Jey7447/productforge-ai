import Link from "next/link";

export default async function VerifySignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const email = params.email?.trim();

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
        ✉
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Check your email
      </h1>

      <p className="mx-auto mt-3 max-w-md text-slate-600">
        We&apos;ve sent a verification link to
        {email ? (
          <span className="font-medium text-slate-950"> {email}</span>
        ) : (
          " your email address"
        )}
        . Click the link in that email to verify your account.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
        <p className="text-sm font-medium text-slate-950">What happens next?</p>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>1. Open the ProductForge verification email.</li>
          <li>2. Click the verification link.</li>
          <li>3. You&apos;ll be taken back to ProductForge and signed in.</li>
        </ol>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Can&apos;t find the email? Check your spam or junk folder.
      </p>

      <Link
        href="/login"
        className="mt-8 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-medium text-white"
      >
        Back to login
      </Link>
    </section>
  );
}

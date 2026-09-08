import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f7f8fa] px-6 py-8"><Link href="/" className="text-lg font-semibold tracking-tight">ProductForge AI</Link><div className="mx-auto flex min-h-[80vh] max-w-md items-center">{children}</div></main>;
}

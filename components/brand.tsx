import Link from "next/link";

export function ProductForgeMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[#171714] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" className="h-[72%] w-[72%]" fill="none">
        <path d="M10 27V9h8.2c5.1 0 8.1 2.4 8.1 6.7 0 4.1-3 6.5-8.1 6.5H14" stroke="#d9f06a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.3 16.1h7.1" stroke="#d9f06a" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Brand({ href = "/", dark = false }: { href?: string; dark?: boolean }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em] ${dark ? "text-white" : "text-[#171714]"}`}>
      <ProductForgeMark />
      <span>ProductForge</span>
    </Link>
  );
}

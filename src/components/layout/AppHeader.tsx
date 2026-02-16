import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          CdxGuabiruba
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="underline-offset-4 hover:underline">
            Dashboard
          </Link>
          <Link href="/login" className="underline-offset-4 hover:underline">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

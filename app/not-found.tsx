import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-ink">Nicht gefunden</h1>
      <Link className="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" href="/">
        Zurueck
      </Link>
    </main>
  );
}


"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function readErrorMessage(response: Response): Promise<string> {
    const contentType = response.headers.get("content-type") ?? "";

    try {
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as { message?: string };
        return data.message ?? "Login gagal.";
      }

      const text = await response.text();
      return text || "Login gagal.";
    } catch {
      return "Login gagal.";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md p-6 shadow-float sm:p-8 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-brand-700">FrontOne & Azana Style Madura</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Login To Your Account</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
          <input
            id="username"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
            <label htmlFor="password" className="sr-only">
              Password
            </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Kembali ke daftar data
        </Link>
      </section>
    </main>
  );
}

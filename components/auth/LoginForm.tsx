"use client";

import { useState } from "react";
import { APP_NAME } from "@/lib/config";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.error ?? "Could not sign in.");
        setPending(false);
        return;
      }
      // Full reload so the server component picks up the new session cookie.
      window.location.href = "/";
    } catch {
      setError("Could not reach the server.");
      setPending(false);
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-panel p-7 shadow-[var(--shadow-card)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-deep to-accent text-base font-bold text-white"
          >
            C
          </span>
          <div>
            <h1 className="text-base font-semibold leading-tight text-text">{APP_NAME}</h1>
            <p className="text-xs text-mute">Admin sign in</p>
          </div>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-mute">
          Username
          <input
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-mute">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-accent-deep px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-mute">
          Seven admin accounts, all with equal rights. Ask another admin if you need your password
          reset.
        </p>
      </form>
    </main>
  );
}

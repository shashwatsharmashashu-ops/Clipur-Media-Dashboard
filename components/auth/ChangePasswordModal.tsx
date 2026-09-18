"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

/** Lets an admin rotate their own password. Seeded passwords are changeable. */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setError("New password must be at least 10 characters.");
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not change the password.");
      return;
    }
    showToast("Password changed");
    onClose();
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/25 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow-pop)]"
      >
        <h3 id="change-password-title" className="text-lg font-semibold text-text">
          Change password
        </h3>
        <p className="mt-1 text-xs text-mute">
          Signs out your other sessions. Minimum 10 characters.
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-mute">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-mute">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-mute">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            className={fieldClass}
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-xs text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-mute hover:text-accent-deep"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent-deep px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-60"
          >
            {pending ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}

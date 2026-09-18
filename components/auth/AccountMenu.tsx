"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminUser } from "@/lib/types";
import ChangePasswordModal from "./ChangePasswordModal";

/** Signed-in admin badge with password change and sign out. */
export default function AccountMenu({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-2 py-1.5 text-sm font-medium text-text transition-colors hover:border-accent"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-bold uppercase text-accent-deep"
          >
            {user.username.slice(0, 1)}
          </span>
          <span className="capitalize">{user.username}</span>
          <span aria-hidden="true" className="text-mute">
            ▾
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-[var(--shadow-pop)]"
          >
            <p className="px-3 py-2 text-xs text-mute">
              Signed in as <span className="font-semibold capitalize text-text">{user.username}</span>
              <br />
              Full admin — everything editable.
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setChanging(true);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface"
            >
              Change password
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {changing && <ChangePasswordModal onClose={() => setChanging(false)} />}
    </>
  );
}

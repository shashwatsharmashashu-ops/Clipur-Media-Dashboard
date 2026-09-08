"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Toast {
  id: number;
  message: string;
}

interface ToastValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const TOAST_MS = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message }]);
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, TOAST_MS);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast-in pointer-events-auto flex items-center gap-2 rounded-full border border-accent/40 bg-panel px-4 py-2 text-sm font-medium text-accent-deep shadow-[var(--shadow-pop)]"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent-deep"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5 6.5 12 13 4.5" />
              </svg>
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

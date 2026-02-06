import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function makeId() {
  return Math.random().toString(16).slice(2);
}

/**
 * PUBLIC_INTERFACE
 * Toast provider for app-wide notifications.
 */
export function ToastProvider({ children }) {
  /** Provides pushToast/removeToast to descendants. */
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = makeId();
    const item = {
      id,
      type: toast.type || "info", // info | success | error
      title: toast.title || "Notice",
      message: toast.message || "",
      timeoutMs: typeof toast.timeoutMs === "number" ? toast.timeoutMs : 4000,
    };
    setToasts((prev) => [item, ...prev]);

    if (item.timeoutMs > 0) {
      window.setTimeout(() => removeToast(id), item.timeoutMs);
    }
    return id;
  }, [removeToast]);

  const api = useMemo(() => ({ toasts, pushToast, removeToast }), [toasts, pushToast, removeToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="tp-toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className="tp-toast" role="status">
            <p className="tp-toast-title">
              {t.title}{" "}
              <span
                className={[
                  "tp-badge",
                  t.type === "success"
                    ? "tp-badge-success"
                    : t.type === "error"
                      ? "tp-badge-error"
                      : "tp-badge-info",
                ].join(" ")}
              >
                {t.type.toUpperCase()}
              </span>
            </p>
            {t.message ? <p className="tp-toast-message">{t.message}</p> : null}
            <div className="tp-toast-row">
              <button className="tp-btn tp-btn-ghost" onClick={() => removeToast(t.id)}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * Hook to access toasts.
 */
export function useToasts() {
  /** Returns { pushToast, removeToast, toasts }. */
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToasts must be used within <ToastProvider />");
  }
  return ctx;
}

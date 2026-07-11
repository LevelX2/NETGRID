"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { KeyRound, LoaderCircle, LogOut, ShieldCheck, X } from "lucide-react";

export type MaintenanceAuthStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "uninitialized"
  | "error";

export type MaintenanceAuthController = {
  status: MaintenanceAuthStatus;
  message: string;
  request(path: string, init?: RequestInit): Promise<Response>;
  login(password: string): Promise<void>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  reauthenticate(password: string): Promise<void>;
  retry(): void;
};

type AuthPayload = {
  csrfToken?: string;
  error?: { code?: string; message?: string };
};

export function useMaintenanceAuth(
  serverHttp: string,
): MaintenanceAuthController {
  const [status, setStatus] = useState<MaintenanceAuthStatus>("checking");
  const [message, setMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    let closed = false;
    setStatus("checking");
    setMessage("");
    fetch(`${serverHttp}/api/storage/maintenance/auth/session`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => ({
        response,
        payload: (await response.json()) as AuthPayload,
      }))
      .then(({ response, payload }) => {
        if (closed) return;
        if (response.ok && payload.csrfToken) {
          setCsrfToken(payload.csrfToken);
          setStatus("authenticated");
          return;
        }
        setCsrfToken("");
        if (
          response.status === 503 &&
          payload.error?.code === "maintenance_auth_uninitialized"
        ) {
          setStatus("uninitialized");
          setMessage(
            payload.error.message ??
              "Maintenance-Authentifizierung ist noch nicht initialisiert.",
          );
          return;
        }
        if (response.status === 401) {
          setStatus("unauthenticated");
          return;
        }
        setStatus("error");
        setMessage(
          payload.error?.message ??
            "Maintenance-Anmeldung konnte nicht geprüft werden.",
        );
      })
      .catch((error) => {
        if (closed) return;
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Maintenance-Backend ist nicht erreichbar.",
        );
      });
    return () => {
      closed = true;
    };
  }, [serverHttp, checkVersion]);

  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      if (!csrfToken)
        throw new Error(
          "Die Maintenance-Sitzung hat keinen gültigen CSRF-Nachweis. Bitte neu anmelden.",
        );
      headers.set("x-netgrid-csrf", csrfToken);
    }
    const response = await fetch(`${serverHttp}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
    if (response.status === 401) {
      setCsrfToken("");
      setStatus("unauthenticated");
    }
    return response;
  };

  const login = async (password: string) => {
    const response = await fetch(
      `${serverHttp}/api/storage/maintenance/auth/login`,
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );
    const payload = (await response.json()) as AuthPayload;
    if (!response.ok || !payload.csrfToken)
      throw new Error(
        payload.error?.message ?? "Maintenance-Anmeldung ist fehlgeschlagen.",
      );
    setCsrfToken(payload.csrfToken);
    setMessage("");
    setStatus("authenticated");
  };

  const logout = async () => {
    const response = await request("/api/storage/maintenance/auth/logout", {
      method: "POST",
    });
    if (!response.ok) {
      const payload = (await response.json()) as AuthPayload;
      throw new Error(
        payload.error?.message ?? "Abmeldung ist fehlgeschlagen.",
      );
    }
    setCsrfToken("");
    setStatus("unauthenticated");
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const response = await request("/api/storage/maintenance/auth/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = (await response.json()) as AuthPayload;
    if (!response.ok)
      throw new Error(
        payload.error?.message ??
          "Maintenance-Passwort konnte nicht geändert werden.",
      );
    setCsrfToken("");
    setStatus("unauthenticated");
  };

  const reauthenticate = async (password: string) => {
    const response = await request(
      "/api/storage/maintenance/auth/reauthenticate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );
    const payload = (await response.json()) as AuthPayload;
    if (!response.ok)
      throw new Error(
        payload.error?.message ?? "Passwortbestätigung ist fehlgeschlagen.",
      );
  };

  return {
    status,
    message,
    request,
    login,
    logout,
    changePassword,
    reauthenticate,
    retry: () => setCheckVersion((current) => current + 1),
  };
}

export function MaintenanceAuthBoundary({
  auth,
  title = "Maintenance Control Plane",
}: {
  auth: MaintenanceAuthController;
  title?: string;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.login(password);
      setPassword("");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Maintenance-Anmeldung ist fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={authShell}>
      <section style={authCard}>
        <div style={authIcon}>
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <div>
          <h1 style={authTitle}>{title}</h1>
          <p style={authText}>
            Administrativer Zugriff ist von Match- und Spielersitzungen
            getrennt.
          </p>
        </div>
        {auth.status === "checking" ? (
          <p style={authStatus}>
            <LoaderCircle size={17} aria-hidden="true" /> Sitzung wird geprüft …
          </p>
        ) : null}
        {auth.status === "uninitialized" ? (
          <div style={authNotice}>
            <strong>Lokales Betreiber-Setup erforderlich</strong>
            <p style={authText}>{auth.message}</p>
            <code>
              corepack pnpm maintenance:auth bootstrap --password-stdin
            </code>
            <button type="button" style={authButton} onClick={auth.retry}>
              Erneut prüfen
            </button>
          </div>
        ) : null}
        {auth.status === "error" ? (
          <div style={authError}>
            <p>{auth.message}</p>
            <button type="button" style={authButton} onClick={auth.retry}>
              Erneut prüfen
            </button>
          </div>
        ) : null}
        {auth.status === "unauthenticated" ? (
          <form style={authForm} onSubmit={(event) => void submit(event)}>
            <input
              type="text"
              autoComplete="username"
              value="maintenance-admin"
              readOnly
              hidden
            />
            <label style={authField}>
              Maintenance-Passwort
              <input
                autoFocus
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={authInput}
              />
            </label>
            {error ? <p style={authError}>{error}</p> : null}
            <button
              type="submit"
              style={authPrimaryButton}
              disabled={busy || !password}
            >
              {busy ? "Anmeldung läuft …" : "Anmelden"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export function MaintenanceSecurityControls({
  auth,
  children,
}: {
  auth: MaintenanceAuthController;
  children?: ReactNode;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await auth.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Passwortänderung ist fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={securityControls}>
      {children}
      <details style={securityDetails}>
        <summary style={securitySummary}>
          <KeyRound size={15} aria-hidden="true" /> Passwort ändern
        </summary>
        <form
          style={securityForm}
          onSubmit={(event) => void changePassword(event)}
        >
          <input
            type="text"
            autoComplete="username"
            value="maintenance-admin"
            readOnly
            hidden
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Aktuelles Passwort"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            style={securityInput}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Neues Passwort (mind. 12 Zeichen)"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            style={securityInput}
          />
          {message ? <small style={securityMessage}>{message}</small> : null}
          <button
            type="submit"
            style={authButton}
            disabled={busy || !currentPassword || !newPassword}
          >
            {busy ? "Ändert …" : "Passwort ändern"}
          </button>
        </form>
      </details>
      <button
        type="button"
        style={authButton}
        onClick={() => void auth.logout()}
      >
        <LogOut size={15} aria-hidden="true" /> Abmelden
      </button>
    </div>
  );
}

export function MaintenanceReauthenticationDialog({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onConfirm(password);
      setPassword("");
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Passwortbestätigung ist fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={dialogBackdrop} role="presentation">
      <section
        style={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-reauth-title"
      >
        <button
          type="button"
          style={dialogClose}
          onClick={onCancel}
          aria-label="Schließen"
        >
          <X size={18} />
        </button>
        <KeyRound size={26} aria-hidden="true" />
        <h2 id="maintenance-reauth-title" style={authTitle}>
          Passwort bestätigen
        </h2>
        <p style={authText}>{label}</p>
        <form style={authForm} onSubmit={(event) => void submit(event)}>
          <input
            type="text"
            autoComplete="username"
            value="maintenance-admin"
            readOnly
            hidden
          />
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={authInput}
          />
          {error ? <p style={authError}>{error}</p> : null}
          <div style={dialogActions}>
            <button type="button" style={authButton} onClick={onCancel}>
              Abbrechen
            </button>
            <button
              type="submit"
              style={authPrimaryButton}
              disabled={busy || !password}
            >
              {busy ? "Prüft …" : "Bestätigen"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const authShell: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "1.5rem",
  background: "#eef3f8",
  color: "#102033",
};
const authCard: CSSProperties = {
  width: "min(100%, 460px)",
  display: "grid",
  gap: "1rem",
  padding: "1.35rem",
  border: "1px solid #c7d4e2",
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 18px 50px rgba(16, 32, 51, 0.12)",
};
const authIcon: CSSProperties = {
  width: 48,
  height: 48,
  display: "grid",
  placeItems: "center",
  borderRadius: 12,
  color: "#155c3c",
  background: "#e5f5ed",
};
const authTitle: CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  color: "#102033",
};
const authText: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#42576b",
  lineHeight: 1.5,
};
const authStatus: CSSProperties = {
  margin: 0,
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  color: "#42576b",
};
const authNotice: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  padding: "0.9rem",
  border: "1px solid #d7c791",
  borderRadius: 8,
  background: "#fffaf0",
};
const authError: CSSProperties = {
  margin: 0,
  padding: "0.7rem",
  border: "1px solid #f3b5b5",
  borderRadius: 8,
  background: "#fff5f5",
  color: "#9b1c1c",
};
const authForm: CSSProperties = { display: "grid", gap: "0.8rem" };
const authField: CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  fontSize: "0.88rem",
  color: "#42576b",
};
const authInput: CSSProperties = {
  minHeight: 42,
  border: "1px solid #9db0c3",
  borderRadius: 7,
  padding: "0.55rem 0.65rem",
  background: "#fff",
  color: "#102033",
};
const authButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.35rem",
  border: "1px solid #9db0c3",
  background: "#fff",
  color: "#102033",
  borderRadius: 7,
  padding: "0.5rem 0.7rem",
  cursor: "pointer",
};
const authPrimaryButton: CSSProperties = {
  ...authButton,
  borderColor: "#2f74b5",
  background: "#2f74b5",
  color: "#fff",
};
const securityControls: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.5rem",
  flexWrap: "wrap",
};
const securityDetails: CSSProperties = { position: "relative" };
const securitySummary: CSSProperties = { ...authButton, listStyle: "none" };
const securityForm: CSSProperties = {
  position: "absolute",
  zIndex: 20,
  right: 0,
  top: "calc(100% + 0.45rem)",
  width: 300,
  display: "grid",
  gap: "0.55rem",
  padding: "0.75rem",
  border: "1px solid #c7d4e2",
  borderRadius: 8,
  background: "#fff",
  boxShadow: "0 12px 32px rgba(16, 32, 51, 0.18)",
};
const securityInput: CSSProperties = { ...authInput, minHeight: 36 };
const securityMessage: CSSProperties = { color: "#9b1c1c" };
const dialogBackdrop: CSSProperties = {
  position: "fixed",
  zIndex: 1000,
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: "1rem",
  background: "rgba(7, 18, 29, 0.56)",
};
const dialog: CSSProperties = {
  position: "relative",
  width: "min(100%, 420px)",
  display: "grid",
  gap: "0.8rem",
  padding: "1.2rem",
  borderRadius: 12,
  background: "#fff",
  color: "#102033",
  boxShadow: "0 22px 70px rgba(0, 0, 0, 0.3)",
};
const dialogClose: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  border: 0,
  borderRadius: 7,
  background: "transparent",
  color: "#42576b",
  cursor: "pointer",
};
const dialogActions: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
};

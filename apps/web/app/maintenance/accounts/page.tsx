"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, Users } from "lucide-react";
import { useTranslations } from "use-intl/react";
import {
  MaintenanceReauthenticationDialog,
  MaintenancePasswordInput,
  useMaintenanceSession,
} from "../../maintenance-auth-ui";

type AccountMode = "invite_only" | "simple" | "protected";
type ManagedAccount = {
  accountId: string;
  loginName: string;
  displayName: string;
  status: "active" | "disabled" | "deleted";
  role: "user" | "admin";
};
type AccessPayload = {
  policy: { mode: AccountMode; source: "configured_default" | "persisted" };
  accounts: ManagedAccount[];
};

export default function MaintenanceAccountsPage() {
  const t = useTranslations("Maintenance.accounts");
  const passwordText = useTranslations("Account.panel");
  const auth = useMaintenanceSession();
  const [data, setData] = useState<AccessPayload | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sensitiveAction, setSensitiveAction] = useState<{
    label: string;
    run: () => Promise<void>;
  } | null>(null);

  const load = async () => {
    setError("");
    const response = await auth.request(
      "/api/storage/maintenance/accounts/access-policy",
      { cache: "no-store" },
    );
    const payload = (await response.json()) as AccessPayload & {
      error?: { message?: string };
    };
    if (!response.ok)
      throw new Error(payload.error?.message ?? t("loadFailed"));
    setData(payload);
    return payload;
  };

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    void load().catch((loadError) =>
      setError(
        loadError instanceof Error ? loadError.message : t("loadFailed"),
      ),
    );
    // The authenticated transition is the load boundary. Mutations refresh explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  const applyMode = async (mode: "simple" | "protected") => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const credentials =
        mode === "protected"
          ? activeAccounts.map((account) => ({
              accountId: account.accountId,
              password: passwords[account.accountId] ?? "",
            }))
          : undefined;
      const response = await auth.request(
        "/api/storage/maintenance/accounts/access-policy",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode, credentials }),
        },
      );
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (!response.ok)
        throw new Error(describeError(payload.error, t("changeFailed")));
      setPasswords({});
      setVisiblePasswords({});
      const refreshed = await load();
      if (refreshed.policy.mode !== mode) throw new Error(t("modeNotSaved"));
      setNotice(t("modeChanged"));
    } catch (changeError) {
      setError(
        changeError instanceof Error ? changeError.message : t("changeFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (account: ManagedAccount) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await auth.request(
        `/api/storage/maintenance/accounts/${encodeURIComponent(account.accountId)}/password`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            newPassword: resetPasswords[account.accountId] ?? "",
          }),
        },
      );
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (!response.ok)
        throw new Error(describeError(payload.error, t("resetFailed")));
      setResetPasswords((current) => ({ ...current, [account.accountId]: "" }));
      setNotice(t("passwordReset", { name: account.displayName }));
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : t("resetFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const activeAccounts =
    data?.accounts.filter((account) => account.status === "active") ?? [];
  const describeError = (
    failure: { code?: string; message?: string } | undefined,
    message: string,
  ) => {
    const key = (
      [
        "account_password_too_short",
        "account_password_too_long",
        "account_password_blocked",
        "account_access_mode_credentials_incomplete",
        "account_access_mode_accounts_changed",
        "account_access_mode_unchanged",
      ] as const
    ).find((code) => code === failure?.code);
    return key
      ? t(`errors.${key}`)
      : `${failure?.message ?? message}${failure?.code ? ` (${failure.code})` : ""}`;
  };
  const validatePasswords = (
    accounts: ManagedAccount[],
    values: Record<string, string>,
  ) => {
    const invalid = accounts.find((account) => {
      const length = Array.from(
        (values[account.accountId] ?? "").normalize("NFC"),
      ).length;
      return length < 15 || length > 256;
    });
    setNotice("");
    setError(
      invalid
        ? t("invalidPasswordFor", {
            name: invalid.displayName,
            login: invalid.loginName,
          })
        : "",
    );
    return !invalid;
  };
  return (
    <main style={pageShell}>
      <div style={page}>
        <header style={header}>
          <div>
            <h1 style={heading}>
              <Users size={24} aria-hidden="true" /> {t("title")}
            </h1>
            <p style={muted}>{t("subtitle")}</p>
          </div>
        </header>

        {sensitiveAction ? (
          <MaintenanceReauthenticationDialog
            label={sensitiveAction.label}
            onCancel={() => setSensitiveAction(null)}
            onConfirm={async (password) => {
              await auth.reauthenticate(password);
              const action = sensitiveAction;
              setSensitiveAction(null);
              await action.run();
            }}
          />
        ) : null}
        {error ? (
          <p role="alert" style={errorBox}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" style={noticeBox}>
            {notice}
          </p>
        ) : null}
        {busy ? <p role="status">{t("saving")}</p> : null}

        <section style={panel}>
          <h2 style={subheading}>
            <ShieldCheck size={20} /> {t("modeTitle")}
          </h2>
          <p style={muted}>
            {data ? t(`mode.${data.policy.mode}`) : t("loading")}
          </p>
          <p style={muted}>{t("namesHelp")}</p>
          {activeAccounts.map((account) => (
            <p key={account.accountId}>
              <strong>{account.displayName}</strong> · {t("loginName")}:{" "}
              <code>{account.loginName}</code>
            </p>
          ))}
          {data && data.policy.mode !== "protected" ? (
            <div style={stack}>
              <p>{t("protectedHelp")}</p>
              <p style={muted}>{t("passwordRequirements")}</p>
              {activeAccounts.map((account) => (
                <div key={account.accountId} style={field}>
                  <label htmlFor={`initial-password-${account.accountId}`}>
                    {t("initialPassword", { name: account.displayName })} ·{" "}
                    {t("loginName")}: {account.loginName}
                  </label>
                  <span style={{ display: "flex", gap: 6, minWidth: 0 }}>
                    <input
                      id={`initial-password-${account.accountId}`}
                      style={{ flex: 1, minWidth: 0 }}
                      autoComplete="new-password"
                      disabled={busy}
                      onChange={(event) =>
                        setPasswords((current) => ({
                          ...current,
                          [account.accountId]: event.target.value,
                        }))
                      }
                      type={
                        visiblePasswords[account.accountId]
                          ? "text"
                          : "password"
                      }
                      value={passwords[account.accountId] ?? ""}
                    />
                    <button
                      type="button"
                      style={button}
                      disabled={busy}
                      aria-label={`${passwordText(visiblePasswords[account.accountId] ? "hidePassword" : "showPassword")} · ${account.displayName}`}
                      title={passwordText(
                        visiblePasswords[account.accountId]
                          ? "hidePassword"
                          : "showPassword",
                      )}
                      aria-pressed={
                        visiblePasswords[account.accountId] === true
                      }
                      aria-controls={`initial-password-${account.accountId}`}
                      onClick={() =>
                        setVisiblePasswords((current) => ({
                          ...current,
                          [account.accountId]: !current[account.accountId],
                        }))
                      }
                    >
                      {visiblePasswords[account.accountId] ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </span>
                </div>
              ))}
              <button
                disabled={busy || !data}
                onClick={() => {
                  if (!validatePasswords(activeAccounts, passwords)) return;
                  setSensitiveAction({
                    label: t("enableProtected"),
                    run: () => applyMode("protected"),
                  });
                }}
                style={primaryButton}
                type="button"
              >
                {t("enableProtected")}
              </button>
            </div>
          ) : null}
          {data && data.policy.mode !== "simple" ? (
            <div style={stack}>
              <p>{t("simpleWarning")}</p>
              <button
                disabled={busy}
                onClick={() =>
                  setSensitiveAction({
                    label: t("enableSimple"),
                    run: () => applyMode("simple"),
                  })
                }
                style={button}
                type="button"
              >
                {t("enableSimple")}
              </button>
            </div>
          ) : null}
        </section>

        {data?.policy.mode === "protected" ? (
          <section style={panel}>
            <h2 style={subheading}>
              <KeyRound size={20} /> {t("passwordsTitle")}
            </h2>
            <p style={muted}>{t("passwordsHelp")}</p>
            <p style={muted}>{t("passwordRequirements")}</p>
            {activeAccounts.map((account) => (
              <div key={account.accountId} style={accountRow}>
                <div>
                  <strong>{account.displayName}</strong>
                  <br />
                  <span style={muted}>
                    {t("loginName")}: {account.loginName}
                  </span>
                </div>
                <MaintenancePasswordInput
                  aria-label={t("newPasswordFor", {
                    name: account.displayName,
                  })}
                  autoComplete="new-password"
                  disabled={busy}
                  onChange={(event) =>
                    setResetPasswords((current) => ({
                      ...current,
                      [account.accountId]: event.target.value,
                    }))
                  }
                  placeholder={t("newPassword")}
                  value={resetPasswords[account.accountId] ?? ""}
                />
                <button
                  disabled={busy || !(resetPasswords[account.accountId] ?? "")}
                  onClick={() => {
                    if (!validatePasswords([account], resetPasswords)) return;
                    setSensitiveAction({
                      label: t("resetFor", { name: account.displayName }),
                      run: () => resetPassword(account),
                    });
                  }}
                  style={button}
                  type="button"
                >
                  {t("reset")}
                </button>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

const pageShell: CSSProperties = { color: "var(--text)" };
const page: CSSProperties = { display: "grid", gap: "1rem", minWidth: 0 };
const header: CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};
const heading: CSSProperties = {
  fontSize: "1.55rem",
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: 0,
};
const subheading: CSSProperties = { ...heading, fontSize: 20 };
const muted: CSSProperties = { color: "var(--muted)" };
const panel: CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 14,
  background: "var(--panel)",
  padding: 20,
};
const stack: CSSProperties = { display: "grid", gap: 12 };
const field: CSSProperties = { display: "grid", gap: 6 };
const accountRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(160px, 1fr) minmax(220px, 1fr) auto",
  gap: 12,
  alignItems: "center",
  padding: "12px 0",
  borderTop: "1px solid var(--line)",
};
const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--button-bg)",
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};
const primaryButton: CSSProperties = {
  ...button,
  background: "var(--primary-bg)",
  borderColor: "var(--primary-border)",
  width: "fit-content",
};
const errorBox: CSSProperties = {
  ...panel,
  borderColor: "var(--danger)",
  color: "var(--danger)",
};
const noticeBox: CSSProperties = {
  ...panel,
  borderColor: "var(--ok)",
  color: "var(--ok)",
};

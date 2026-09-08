"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, KeyRound, ShieldCheck, Users } from "lucide-react";
import { useTranslations } from "use-intl/react";
import {
  MaintenanceAuthBoundary,
  MaintenanceReauthenticationDialog,
  MaintenanceSecurityControls,
  useMaintenanceAuth,
} from "../../maintenance-auth-ui";
import { resolveMaintenanceServerHttp } from "../../maintenance";

import { configuredServerHttp } from "../../../lib/server-endpoint";

type AccountMode = "invite_only" | "simple" | "protected";
type ManagedAccount = {
  accountId: string;
  loginName: string;
  displayName: string;
  status: "active" | "disabled" | "deleted";
  role: "user" | "admin";
};
type AccessPayload = {
  policy: { mode: AccountMode; source: "configured" | "persisted" };
  accounts: ManagedAccount[];
};

export default function MaintenanceAccountsPage() {
  const t = useTranslations("Maintenance.accounts");
  const [serverHttp] = useState(() =>
    resolveMaintenanceServerHttp(
      configuredServerHttp(),
      typeof window === "undefined" ? undefined : window.location.hostname,
    ),
  );
  const auth = useMaintenanceAuth(serverHttp);
  const [data, setData] = useState<AccessPayload | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
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
          ? (data?.accounts ?? []).map((account) => ({
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
        error?: { message?: string };
      };
      if (!response.ok)
        throw new Error(payload.error?.message ?? t("changeFailed"));
      setPasswords({});
      setNotice(t("modeChanged"));
      await load();
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
        error?: { message?: string };
      };
      if (!response.ok)
        throw new Error(payload.error?.message ?? t("resetFailed"));
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

  if (auth.status !== "authenticated")
    return <MaintenanceAuthBoundary auth={auth} title={t("title")} />;

  const activeAccounts =
    data?.accounts.filter((account) => account.status === "active") ?? [];
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
          <MaintenanceSecurityControls auth={auth}>
            <a href="/maintenance" style={button}>
              <ArrowLeft size={16} /> {t("back")}
            </a>
          </MaintenanceSecurityControls>
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
        {error ? <p style={errorBox}>{error}</p> : null}
        {notice ? <p style={noticeBox}>{notice}</p> : null}

        <section style={panel}>
          <h2 style={subheading}>
            <ShieldCheck size={20} /> {t("modeTitle")}
          </h2>
          <p style={muted}>
            {data ? t(`mode.${data.policy.mode}`) : t("loading")}
          </p>
          {data?.policy.mode !== "protected" ? (
            <div style={stack}>
              <p>{t("protectedHelp")}</p>
              {activeAccounts.map((account) => (
                <label key={account.accountId} style={field}>
                  {t("initialPassword", { name: account.displayName })}
                  <input
                    minLength={15}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        [account.accountId]: event.target.value,
                      }))
                    }
                    type="password"
                    value={passwords[account.accountId] ?? ""}
                  />
                </label>
              ))}
              <button
                disabled={busy || !data}
                onClick={() =>
                  setSensitiveAction({
                    label: t("enableProtected"),
                    run: () => applyMode("protected"),
                  })
                }
                style={primaryButton}
                type="button"
              >
                {t("enableProtected")}
              </button>
            </div>
          ) : (
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
          )}
        </section>

        {data?.policy.mode === "protected" ? (
          <section style={panel}>
            <h2 style={subheading}>
              <KeyRound size={20} /> {t("passwordsTitle")}
            </h2>
            <p style={muted}>{t("passwordsHelp")}</p>
            {activeAccounts.map((account) => (
              <div key={account.accountId} style={accountRow}>
                <div>
                  <strong>{account.displayName}</strong>
                  <br />
                  <span style={muted}>{account.loginName}</span>
                </div>
                <input
                  aria-label={t("newPasswordFor", {
                    name: account.displayName,
                  })}
                  minLength={15}
                  onChange={(event) =>
                    setResetPasswords((current) => ({
                      ...current,
                      [account.accountId]: event.target.value,
                    }))
                  }
                  placeholder={t("newPassword")}
                  type="password"
                  value={resetPasswords[account.accountId] ?? ""}
                />
                <button
                  disabled={busy || !(resetPasswords[account.accountId] ?? "")}
                  onClick={() =>
                    setSensitiveAction({
                      label: t("resetFor", { name: account.displayName }),
                      run: () => resetPassword(account),
                    })
                  }
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

const pageShell: CSSProperties = {
  minHeight: "100vh",
  padding: "32px 20px",
  background: "#09111f",
  color: "#edf4ff",
};
const page: CSSProperties = {
  width: "min(100%, 980px)",
  margin: "0 auto",
  display: "grid",
  gap: 20,
};
const header: CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};
const heading: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: 0,
};
const subheading: CSSProperties = { ...heading, fontSize: 20 };
const muted: CSSProperties = { color: "#aabbd1" };
const panel: CSSProperties = {
  border: "1px solid #30445f",
  borderRadius: 14,
  background: "#111d2e",
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
  borderTop: "1px solid #30445f",
};
const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid #57708d",
  background: "#17283d",
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};
const primaryButton: CSSProperties = {
  ...button,
  background: "#1f6feb",
  borderColor: "#388bfd",
  width: "fit-content",
};
const errorBox: CSSProperties = {
  ...panel,
  borderColor: "#a94a55",
  color: "#ffb8c0",
};
const noticeBox: CSSProperties = {
  ...panel,
  borderColor: "#3d8b61",
  color: "#a8f0c2",
};

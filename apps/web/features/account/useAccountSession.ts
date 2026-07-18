"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptAccountInvite,
  acceptAccountReset,
  changeAccountPassword,
  createAccountInvite,
  createAccountReset,
  loginAccount,
  logoutAccount,
  restoreAccountSession,
  revokeAllAccountSessions,
  type AccountSelf,
  type AccountSessionSelf,
} from "./account-client";

export type AccountSessionState = {
  status: "loading" | "guest" | "authenticated";
  account: AccountSelf | null;
  session: AccountSessionSelf | null;
  error: string;
  busy: boolean;
};

export function useAccountSession() {
  const [state, setState] = useState<AccountSessionState>({ status: "loading", account: null, session: null, error: "", busy: false });
  const [csrfToken, setCsrfToken] = useState("");

  const becomeGuest = useCallback((error = "") => {
    setCsrfToken("");
    setState({ status: "guest", account: null, session: null, error, busy: false });
  }, []);

  useEffect(() => {
    let active = true;
    void restoreAccountSession()
      .then((payload) => {
        if (!active) return;
        setCsrfToken(payload.csrfToken);
        setState({ status: "authenticated", account: payload.account, session: payload.session, error: "", busy: false });
      })
      .catch(() => {
        if (active) becomeGuest();
      });
    return () => { active = false; };
  }, [becomeGuest]);

  const runSessionStart = useCallback(async (operation: () => ReturnType<typeof loginAccount>) => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      const payload = await operation();
      setCsrfToken(payload.csrfToken);
      setState({ status: "authenticated", account: payload.account, session: payload.session, error: "", busy: false });
      return true;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error instanceof Error ? error.message : "Die Account-Anfrage ist fehlgeschlagen." }));
      return false;
    }
  }, []);

  const login = useCallback((loginName: string, password: string) => runSessionStart(() => loginAccount({ loginName, password, deviceLabel: browserDeviceLabel() })), [runSessionStart]);
  const acceptInvite = useCallback((inviteToken: string, password: string) => runSessionStart(() => acceptAccountInvite({ inviteToken, password, deviceLabel: browserDeviceLabel() })), [runSessionStart]);

  const acceptReset = useCallback(async (resetToken: string, newPassword: string) => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      await acceptAccountReset({ resetToken, newPassword });
      becomeGuest("Passwort zurückgesetzt. Du kannst dich jetzt anmelden.");
      return true;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error instanceof Error ? error.message : "Das Passwort konnte nicht zurückgesetzt werden." }));
      return false;
    }
  }, [becomeGuest]);

  const logout = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try { await logoutAccount(csrfToken); } finally { becomeGuest(); }
  }, [becomeGuest, csrfToken]);

  const revokeAll = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try { await revokeAllAccountSessions(csrfToken); } finally { becomeGuest(); }
  }, [becomeGuest, csrfToken]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      await changeAccountPassword({ currentPassword, newPassword, csrfToken });
      becomeGuest("Passwort geändert. Bitte melde dich erneut an.");
      return true;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error instanceof Error ? error.message : "Das Passwort konnte nicht geändert werden." }));
      return false;
    }
  }, [becomeGuest, csrfToken]);

  const createInvite = useCallback(async (loginName: string, displayName: string) => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      const created = await createAccountInvite({ loginName, displayName, csrfToken });
      setState((current) => ({ ...current, busy: false }));
      return created;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error instanceof Error ? error.message : "Die Einladung konnte nicht erstellt werden." }));
      return null;
    }
  }, [csrfToken]);

  const createReset = useCallback(async (loginName: string) => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      const created = await createAccountReset({ loginName, csrfToken });
      setState((current) => ({ ...current, busy: false }));
      return created;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error instanceof Error ? error.message : "Der Resetlink konnte nicht erstellt werden." }));
      return null;
    }
  }, [csrfToken]);

  return { ...state, login, acceptInvite, acceptReset, logout, revokeAll, changePassword, createInvite, createReset };
}

function browserDeviceLabel(): string {
  return typeof navigator === "undefined" ? "Browser" : `Browser · ${navigator.platform || "unbekannt"}`;
}

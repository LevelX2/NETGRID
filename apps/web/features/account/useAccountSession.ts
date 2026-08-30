"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "use-intl/react";
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
  const t = useTranslations("Account.session");
  const [state, setState] = useState<AccountSessionState>({
    status: "loading",
    account: null,
    session: null,
    error: "",
    busy: false,
  });
  const [csrfToken, setCsrfToken] = useState("");

  const becomeGuest = useCallback((error = "") => {
    setCsrfToken("");
    setState({
      status: "guest",
      account: null,
      session: null,
      error,
      busy: false,
    });
  }, []);

  useEffect(() => {
    let active = true;
    void restoreAccountSession()
      .then((payload) => {
        if (!active) return;
        setCsrfToken(payload.csrfToken);
        setState({
          status: "authenticated",
          account: payload.account,
          session: payload.session,
          error: "",
          busy: false,
        });
      })
      .catch(() => {
        if (active) becomeGuest();
      });
    return () => {
      active = false;
    };
  }, [becomeGuest]);

  const runSessionStart = useCallback(
    async (operation: () => ReturnType<typeof loginAccount>) => {
      setState((current) => ({ ...current, busy: true, error: "" }));
      try {
        const payload = await operation();
        setCsrfToken(payload.csrfToken);
        setState({
          status: "authenticated",
          account: payload.account,
          session: payload.session,
          error: "",
          busy: false,
        });
        return true;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error: error instanceof Error ? error.message : t("requestFailed"),
        }));
        return false;
      }
    },
    [t],
  );

  const login = useCallback(
    (loginName: string, password: string) =>
      runSessionStart(() =>
        loginAccount({
          loginName,
          password,
          deviceLabel: browserDeviceLabel(t("unknownDevice")),
        }),
      ),
    [runSessionStart, t],
  );
  const acceptInvite = useCallback(
    (inviteToken: string, password: string) =>
      runSessionStart(() =>
        acceptAccountInvite({
          inviteToken,
          password,
          deviceLabel: browserDeviceLabel(t("unknownDevice")),
        }),
      ),
    [runSessionStart, t],
  );

  const acceptReset = useCallback(
    async (resetToken: string, newPassword: string) => {
      setState((current) => ({ ...current, busy: true, error: "" }));
      try {
        await acceptAccountReset({ resetToken, newPassword });
        becomeGuest(t("passwordResetSuccess"));
        return true;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error:
            error instanceof Error ? error.message : t("passwordResetFailed"),
        }));
        return false;
      }
    },
    [becomeGuest, t],
  );

  const logout = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      await logoutAccount(csrfToken);
      becomeGuest();
      return true;
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : t("logoutFailed"),
      }));
      return false;
    }
  }, [becomeGuest, csrfToken, t]);

  const revokeAll = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      await revokeAllAccountSessions(csrfToken);
      becomeGuest();
      return true;
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : t("logoutAllFailed"),
      }));
      return false;
    }
  }, [becomeGuest, csrfToken, t]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((current) => ({ ...current, busy: true, error: "" }));
      try {
        await changeAccountPassword({
          currentPassword,
          newPassword,
          csrfToken,
        });
        becomeGuest(t("passwordChangedSuccess"));
        return true;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error:
            error instanceof Error ? error.message : t("passwordChangeFailed"),
        }));
        return false;
      }
    },
    [becomeGuest, csrfToken, t],
  );

  const createInvite = useCallback(
    async (loginName: string, displayName: string) => {
      setState((current) => ({ ...current, busy: true, error: "" }));
      try {
        const created = await createAccountInvite({
          loginName,
          displayName,
          csrfToken,
        });
        setState((current) => ({ ...current, busy: false }));
        return created;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error: error instanceof Error ? error.message : t("inviteFailed"),
        }));
        return null;
      }
    },
    [csrfToken, t],
  );

  const createReset = useCallback(
    async (loginName: string) => {
      setState((current) => ({ ...current, busy: true, error: "" }));
      try {
        const created = await createAccountReset({ loginName, csrfToken });
        setState((current) => ({ ...current, busy: false }));
        return created;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error: error instanceof Error ? error.message : t("resetLinkFailed"),
        }));
        return null;
      }
    },
    [csrfToken, t],
  );

  return {
    ...state,
    csrfToken,
    login,
    acceptInvite,
    acceptReset,
    logout,
    revokeAll,
    changePassword,
    createInvite,
    createReset,
  };
}

function browserDeviceLabel(unknownDevice: string): string {
  return typeof navigator === "undefined"
    ? "Browser"
    : `Browser · ${navigator.platform || unknownDevice}`;
}

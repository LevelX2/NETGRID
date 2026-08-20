"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "use-intl/react";
import { formatAppDateTime } from "../../i18n/format";
import {
  inviteTokenFromLocation,
  resetTokenFromLocation,
} from "./account-client";
import type { ReturnTypeOfUseAccountSession } from "./account-types";
import { AccountStatisticsPanel } from "./AccountStatisticsPanel";

export function AccountPanel({
  accountSession,
}: {
  accountSession: ReturnTypeOfUseAccountSession;
}) {
  const locale = useLocale();
  const t = useTranslations("Account.panel");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminLoginName, setAdminLoginName] = useState("");
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [issuedLink, setIssuedLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteToken(inviteTokenFromLocation(window.location.search));
      setResetToken(resetTokenFromLocation(window.location.search));
    }
  }, []);

  if (accountSession.status === "loading") {
    return (
      <section className="accountPanel">
        <p className="muted">{t("loading")}</p>
      </section>
    );
  }

  if (accountSession.account) {
    const submitPassword = async (event: FormEvent) => {
      event.preventDefault();
      if (await accountSession.changePassword(currentPassword, newPassword)) {
        setCurrentPassword("");
        setNewPassword("");
      }
    };
    return (
      <section className="accountPanel">
        <div className="accountPanelHeader">
          <div>
            <p className="eyebrow">{t("signedIn")}</p>
            <h2>{accountSession.account.displayName}</h2>
          </div>
          <div className="accountHeaderActions">
            <span className="accountRoleBadge">
              {accountSession.account.role === "admin" ? t("admin") : t("player")}
            </span>
            <button
              className="button"
              disabled={accountSession.busy}
              onClick={() => void accountSession.logout()}
              type="button"
            >
              {t("logout")}
            </button>
          </div>
        </div>
        <details className="accountSegment" open>
          <summary>{t("account")}</summary>
          <div className="accountSegmentContent">
            <dl className="accountFacts">
              <div>
                <dt>{t("loginName")}</dt>
                <dd>{accountSession.account.loginName}</dd>
              </div>
              <div>
                <dt>{t("authentication")}</dt>
                <dd>
                  {accountSession.session?.authStrength === "password"
                    ? t("password")
                    : accountSession.session?.authStrength}
                </dd>
              </div>
              <div>
                <dt>{t("sessionValidUntil")}</dt>
                <dd>{formatDate(accountSession.session?.expiresAt, locale)}</dd>
              </div>
            </dl>
          </div>
        </details>
        <details className="accountSegment" open>
          <summary>{t("statistics")}</summary>
          <div className="accountSegmentContent">
            <AccountStatisticsPanel
              accountId={accountSession.account.accountId}
            />
          </div>
        </details>
        {accountSession.error ? (
          <p className="notice">{accountSession.error}</p>
        ) : null}
        <details className="accountSegment">
          <summary>{t("security")}</summary>
          <div className="accountSegmentContent">
            <div className="accountActions">
              <button
                className="button"
                disabled={accountSession.busy}
                onClick={() => void accountSession.revokeAll()}
                type="button"
              >
                {t("logoutAll")}
              </button>
            </div>
            <form
              className="accountForm"
              onSubmit={(event) => void submitPassword(event)}
            >
              <h3>{t("changePassword")}</h3>
              <label>
                {t("currentPassword")}
                <input
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label>
                {t("newPassword")}
                <input
                  autoComplete="new-password"
                  minLength={15}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
              </label>
              <small>
                {t("passwordHelp")}
              </small>
              <button
                className="button primary"
                disabled={accountSession.busy}
                type="submit"
              >
                {t("changePassword")}
              </button>
            </form>
          </div>
        </details>
        {accountSession.account.role === "admin" ? (
          <details className="accountSegment">
            <summary>{t("administration")}</summary>
            <div className="accountSegmentContent accountFormGrid">
              <form
              className="accountForm"
              onSubmit={(event) => {
                event.preventDefault();
                void accountSession
                  .createInvite(adminLoginName, adminDisplayName)
                  .then((created) => {
                    if (created)
                      setIssuedLink(
                        `${window.location.origin}/?invite=${encodeURIComponent(created.inviteToken)}`,
                      );
                  });
              }}
            >
              <h3>{t("inviteAccount")}</h3>
              <label>
                {t("loginName")}
                <input
                  onChange={(event) => setAdminLoginName(event.target.value)}
                  required
                  value={adminLoginName}
                />
              </label>
              <label>
                {t("displayName")}
                <input
                  onChange={(event) => setAdminDisplayName(event.target.value)}
                  required
                  value={adminDisplayName}
                />
              </label>
              <button
                className="button primary"
                disabled={accountSession.busy}
                type="submit"
              >
                {t("createInviteLink")}
              </button>
              </form>
              <form
              className="accountForm"
              onSubmit={(event) => {
                event.preventDefault();
                void accountSession
                  .createReset(adminLoginName)
                  .then((created) => {
                    if (created)
                      setIssuedLink(
                        `${window.location.origin}/?reset=${encodeURIComponent(created.resetToken)}`,
                      );
                  });
              }}
            >
              <h3>{t("passwordReset")}</h3>
              <label>
                {t("loginName")}
                <input
                  onChange={(event) => setAdminLoginName(event.target.value)}
                  required
                  value={adminLoginName}
                />
              </label>
              <small>
                {t("resetLinkHelp")}
              </small>
              <button
                className="button"
                disabled={accountSession.busy}
                type="submit"
              >
                {t("createResetLink")}
              </button>
              </form>
            </div>
          </details>
        ) : null}
        {issuedLink ? (
          <label className="accountIssuedLink">
            {t("oneTimeLink")}
            <input readOnly value={issuedLink} />
          </label>
        ) : null}
      </section>
    );
  }

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (await accountSession.login(loginName, password)) setPassword("");
  };
  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (await accountSession.acceptInvite(inviteToken, invitePassword))
      setInvitePassword("");
  };
  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    if (await accountSession.acceptReset(resetToken, resetPassword))
      setResetPassword("");
  };
  return (
    <section className="accountPanel">
      <div className="accountPanelHeader">
        <div>
          <p className="eyebrow">{t("profile")}</p>
          <h2>{t("guestOrAccount")}</h2>
        </div>
      </div>
      {accountSession.error ? (
        <p className="notice">{accountSession.error}</p>
      ) : null}
      <details className="accountSegment" open>
        <summary>{t("guestAndLogin")}</summary>
        <div className="accountSegmentContent">
          <p className="muted">
            {t("guestHelp")}
          </p>
          <form
          className="accountForm"
          onSubmit={(event) => void submitLogin(event)}
        >
          <h3>{t("login")}</h3>
          <label>
            {t("loginName")}
            <input
              autoComplete="username"
              onChange={(event) => setLoginName(event.target.value)}
              required
              value={loginName}
            />
          </label>
          <label>
            {t("password")}
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="button primary"
            disabled={accountSession.busy}
            type="submit"
          >
            {t("login")}
          </button>
          </form>
        </div>
      </details>
      <details className="accountSegment" open={Boolean(inviteToken)}>
        <summary>{t("activateAccount")}</summary>
        <div className="accountSegmentContent">
          <form
          className="accountForm"
          onSubmit={(event) => void submitInvite(event)}
        >
          <h3>{t("acceptInvite")}</h3>
          <label>
            {t("inviteCode")}
            <input
              autoComplete="off"
              onChange={(event) => setInviteToken(event.target.value)}
              required
              value={inviteToken}
            />
          </label>
          <label>
            {t("newPassword")}
            <input
              autoComplete="new-password"
              minLength={15}
              onChange={(event) => setInvitePassword(event.target.value)}
              required
              type="password"
              value={invitePassword}
            />
          </label>
          <small>
            {t("inviteHelp")}
          </small>
          <button
            className="button primary"
            disabled={accountSession.busy}
            type="submit"
          >
            {t("activateAccount")}
          </button>
          </form>
        </div>
      </details>
      {resetToken ? (
        <details className="accountSegment" open>
          <summary>{t("resetPassword")}</summary>
          <div className="accountSegmentContent">
          <form
            className="accountForm"
            onSubmit={(event) => void submitReset(event)}
          >
            <h3>{t("resetPassword")}</h3>
            <label>
              {t("resetCode")}
              <input
                autoComplete="off"
                onChange={(event) => setResetToken(event.target.value)}
                required
                value={resetToken}
              />
            </label>
            <label>
              {t("newPassword")}
              <input
                autoComplete="new-password"
                minLength={15}
                onChange={(event) => setResetPassword(event.target.value)}
                required
                type="password"
                value={resetPassword}
              />
            </label>
            <button
              className="button primary"
              disabled={accountSession.busy}
              type="submit"
            >
              {t("setNewPassword")}
            </button>
            </form>
          </div>
        </details>
      ) : null}
    </section>
  );
}

function formatDate(
  value: string | undefined,
  locale: "de" | "en",
): string {
  if (!value) return "–";
  return formatAppDateTime(value, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

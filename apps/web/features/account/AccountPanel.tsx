"use client";

import { useEffect, useState, type FormEvent } from "react";
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
        <p className="muted">Account-Sitzung wird geprüft …</p>
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
            <p className="eyebrow">Angemeldeter Account</p>
            <h2>{accountSession.account.displayName}</h2>
          </div>
          <div className="accountHeaderActions">
            <span className="accountRoleBadge">
              {accountSession.account.role === "admin" ? "Admin" : "Spieler"}
            </span>
            <button
              className="button"
              disabled={accountSession.busy}
              onClick={() => void accountSession.logout()}
              type="button"
            >
              Abmelden
            </button>
          </div>
        </div>
        <details className="accountSegment" open>
          <summary>Account</summary>
          <div className="accountSegmentContent">
            <dl className="accountFacts">
              <div>
                <dt>Anmeldename</dt>
                <dd>{accountSession.account.loginName}</dd>
              </div>
              <div>
                <dt>Anmeldung</dt>
                <dd>
                  {accountSession.session?.authStrength === "password"
                    ? "Passwort"
                    : accountSession.session?.authStrength}
                </dd>
              </div>
              <div>
                <dt>Sitzung gültig bis</dt>
                <dd>{formatDate(accountSession.session?.expiresAt)}</dd>
              </div>
            </dl>
          </div>
        </details>
        <details className="accountSegment" open>
          <summary>Spielstatistik</summary>
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
          <summary>Sicherheit</summary>
          <div className="accountSegmentContent">
            <div className="accountActions">
              <button
                className="button"
                disabled={accountSession.busy}
                onClick={() => void accountSession.revokeAll()}
                type="button"
              >
                Alle Geräte abmelden
              </button>
            </div>
            <form
              className="accountForm"
              onSubmit={(event) => void submitPassword(event)}
            >
              <h3>Passwort ändern</h3>
              <label>
                Aktuelles Passwort
                <input
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label>
                Neues Passwort
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
                Mindestens 15 Zeichen; nach der Änderung werden alle Sitzungen
                beendet.
              </small>
              <button
                className="button primary"
                disabled={accountSession.busy}
                type="submit"
              >
                Passwort ändern
              </button>
            </form>
          </div>
        </details>
        {accountSession.account.role === "admin" ? (
          <details className="accountSegment">
            <summary>Administration</summary>
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
              <h3>Account einladen</h3>
              <label>
                Anmeldename
                <input
                  onChange={(event) => setAdminLoginName(event.target.value)}
                  required
                  value={adminLoginName}
                />
              </label>
              <label>
                Anzeigename
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
                Einladungslink erzeugen
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
              <h3>Passwort-Reset</h3>
              <label>
                Anmeldename
                <input
                  onChange={(event) => setAdminLoginName(event.target.value)}
                  required
                  value={adminLoginName}
                />
              </label>
              <small>
                Der Link ist standardmäßig zwei Stunden gültig und nur einmal
                verwendbar.
              </small>
              <button
                className="button"
                disabled={accountSession.busy}
                type="submit"
              >
                Resetlink erzeugen
              </button>
              </form>
            </div>
          </details>
        ) : null}
        {issuedLink ? (
          <label className="accountIssuedLink">
            Einmaliger Link
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
          <p className="eyebrow">Benutzerprofil</p>
          <h2>Gast oder Account</h2>
        </div>
      </div>
      {accountSession.error ? (
        <p className="notice">{accountSession.error}</p>
      ) : null}
      <details className="accountSegment" open>
        <summary>Gastmodus und Anmeldung</summary>
        <div className="accountSegmentContent">
          <p className="muted">
            Ohne Anmeldung bleibt NETGRID im lokalen Gastmodus. Mit Account
            stehen persönliche Server-Decks und die eigene Spielstatistik zur
            Verfügung.
          </p>
          <form
          className="accountForm"
          onSubmit={(event) => void submitLogin(event)}
        >
          <h3>Anmelden</h3>
          <label>
            Anmeldename
            <input
              autoComplete="username"
              onChange={(event) => setLoginName(event.target.value)}
              required
              value={loginName}
            />
          </label>
          <label>
            Passwort
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
            Anmelden
          </button>
          </form>
        </div>
      </details>
      <details className="accountSegment" open={Boolean(inviteToken)}>
        <summary>Account aktivieren</summary>
        <div className="accountSegmentContent">
          <form
          className="accountForm"
          onSubmit={(event) => void submitInvite(event)}
        >
          <h3>Einladung annehmen</h3>
          <label>
            Einladungscode
            <input
              autoComplete="off"
              onChange={(event) => setInviteToken(event.target.value)}
              required
              value={inviteToken}
            />
          </label>
          <label>
            Neues Passwort
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
            Accounts werden in dieser Alpha nur durch eine Admin-Einladung
            angelegt.
          </small>
          <button
            className="button primary"
            disabled={accountSession.busy}
            type="submit"
          >
            Account aktivieren
          </button>
          </form>
        </div>
      </details>
      {resetToken ? (
        <details className="accountSegment" open>
          <summary>Passwort zurücksetzen</summary>
          <div className="accountSegmentContent">
          <form
            className="accountForm"
            onSubmit={(event) => void submitReset(event)}
          >
            <h3>Passwort zurücksetzen</h3>
            <label>
              Resetcode
              <input
                autoComplete="off"
                onChange={(event) => setResetToken(event.target.value)}
                required
                value={resetToken}
              />
            </label>
            <label>
              Neues Passwort
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
              Neues Passwort setzen
            </button>
            </form>
          </div>
        </details>
      ) : null}
    </section>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const ACCOUNT_SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

export type AccountSelf = {
  accountId: string;
  loginName: string;
  displayName: string;
  status: "active" | "disabled" | "deleted";
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
};

export type AccountSessionSelf = {
  sessionId: string;
  accountId: string;
  authStrength: "password" | "passkey" | "mfa";
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  deviceLabel?: string;
};

export type AccountSessionPayload = {
  account: AccountSelf;
  session: AccountSessionSelf;
  csrfToken: string;
};

export class AccountClientError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "AccountClientError";
  }
}

export type AccountFetch = typeof fetch;

export function restoreAccountSession(fetcher: AccountFetch = fetch): Promise<AccountSessionPayload> {
  return accountRequest(fetcher, "/api/account/session", { method: "GET" });
}

export function loginAccount(input: { loginName: string; password: string; deviceLabel?: string }, fetcher: AccountFetch = fetch): Promise<AccountSessionPayload> {
  return accountRequest(fetcher, "/api/account/login", { method: "POST", body: JSON.stringify(input) });
}

export function acceptAccountInvite(input: { inviteToken: string; password: string; deviceLabel?: string }, fetcher: AccountFetch = fetch): Promise<AccountSessionPayload> {
  return accountRequest(fetcher, `/api/account/invites/${encodeURIComponent(input.inviteToken)}/accept`, {
    method: "POST",
    body: JSON.stringify({ password: input.password, ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {}) }),
  });
}

export function acceptAccountReset(input: { resetToken: string; newPassword: string }, fetcher: AccountFetch = fetch): Promise<{ ok: true; sessionsRevoked: true }> {
  return accountRequest(fetcher, `/api/account/resets/${encodeURIComponent(input.resetToken)}/accept`, {
    method: "POST",
    body: JSON.stringify({ newPassword: input.newPassword }),
  });
}

export function logoutAccount(csrfToken: string, fetcher: AccountFetch = fetch): Promise<{ ok: true }> {
  return accountRequest(fetcher, "/api/account/logout", mutation(csrfToken));
}

export function revokeAllAccountSessions(csrfToken: string, fetcher: AccountFetch = fetch): Promise<{ ok: true; revoked: number }> {
  return accountRequest(fetcher, "/api/account/sessions/revoke-all", mutation(csrfToken));
}

export function changeAccountPassword(input: { currentPassword: string; newPassword: string; csrfToken: string }, fetcher: AccountFetch = fetch): Promise<{ ok: true; sessionsRevoked: true }> {
  return accountRequest(fetcher, "/api/account/password", {
    ...mutation(input.csrfToken),
    body: JSON.stringify({ currentPassword: input.currentPassword, newPassword: input.newPassword }),
  });
}

export function createAccountInvite(input: { loginName: string; displayName: string; csrfToken: string }, fetcher: AccountFetch = fetch): Promise<{
  inviteToken: string;
  invite: { loginName: string; displayName: string; expiresAt: string };
}> {
  return accountRequest(fetcher, "/api/account/admin/invites", {
    ...mutation(input.csrfToken),
    body: JSON.stringify({ loginName: input.loginName, displayName: input.displayName }),
  });
}

export function createAccountReset(input: { loginName: string; csrfToken: string }, fetcher: AccountFetch = fetch): Promise<{ resetToken: string; expiresAt: string }> {
  return accountRequest(fetcher, "/api/account/admin/resets", {
    ...mutation(input.csrfToken),
    body: JSON.stringify({ loginName: input.loginName }),
  });
}

export function inviteTokenFromLocation(search: string): string {
  return new URLSearchParams(search).get("invite")?.trim() ?? "";
}

export function resetTokenFromLocation(search: string): string {
  return new URLSearchParams(search).get("reset")?.trim() ?? "";
}

function mutation(csrfToken: string): RequestInit {
  return { method: "POST", headers: { "x-netgrid-csrf": csrfToken } };
}

async function accountRequest<T>(fetcher: AccountFetch, path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set("content-type", "application/json");
  const response = await fetcher(`${ACCOUNT_SERVER_HTTP}${path}`, { ...init, headers, credentials: "include" });
  const payload = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
  if (!response.ok) {
    throw new AccountClientError(payload.error?.code ?? "account_request_failed", payload.error?.message ?? "Die Account-Anfrage ist fehlgeschlagen.", response.status);
  }
  return payload as T;
}

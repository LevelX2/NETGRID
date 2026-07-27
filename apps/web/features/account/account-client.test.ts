import { describe, expect, it, vi } from "vitest";
import {
  changeAccountPassword,
  inviteTokenFromLocation,
  loadAccountActivePublicMatchIds,
  loginAccount,
  rejoinAccountPublicMatch,
  resetTokenFromLocation,
  restoreAccountSession,
} from "./account-client";

describe("account client", () => {
  it("uses credential cookies and keeps the session token outside the JavaScript contract", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            account: {
              accountId: "acct_1",
              loginName: "runner",
              displayName: "Runner",
              status: "active",
              role: "user",
              createdAt: "2026-07-18T00:00:00.000Z",
              updatedAt: "2026-07-18T00:00:00.000Z",
            },
            session: {
              sessionId: "sess_1",
              accountId: "acct_1",
              authStrength: "password",
              createdAt: "2026-07-18T00:00:00.000Z",
              lastSeenAt: "2026-07-18T00:00:00.000Z",
              expiresAt: "2026-08-01T00:00:00.000Z",
            },
            csrfToken: "csrf-only-in-memory",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    ) as unknown as typeof fetch;

    const payload = await loginAccount(
      { loginName: "runner", password: "lange passphrase" },
      fetcher,
    );
    expect(payload).not.toHaveProperty("sessionToken");
    const [, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
  });

  it("restores stable CSRF through the cookie session and sends it only as a mutation header", async () => {
    const fetcher = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        if (init?.method === "GET")
          return new Response(
            JSON.stringify({
              account: {},
              session: {},
              csrfToken: "stable-session-csrf",
            }),
            { status: 200 },
          );
        return new Response(
          JSON.stringify({ ok: true, sessionsRevoked: true }),
          { status: 200 },
        );
      },
    ) as unknown as typeof fetch;
    expect((await restoreAccountSession(fetcher)).csrfToken).toBe(
      "stable-session-csrf",
    );
    await changeAccountPassword(
      {
        currentPassword: "old",
        newPassword: "new",
        csrfToken: "stable-session-csrf",
      },
      fetcher,
    );
    const [, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls[1] as [string, RequestInit];
    expect(new Headers(init.headers).get("x-netgrid-csrf")).toBe(
      "stable-session-csrf",
    );
    expect(JSON.stringify(init)).not.toContain("ng_account_session");
  });

  it("parses invite links and preserves neutral server errors", async () => {
    expect(inviteTokenFromLocation("?invite=abc%20123&matchId=ignored")).toBe(
      "abc 123",
    );
    expect(resetTokenFromLocation("?reset=reset%2Ftoken")).toBe("reset/token");
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "account_invalid_credentials",
              message: "Anmeldename oder Passwort ist nicht korrekt.",
            },
          }),
          { status: 401 },
        ),
    ) as unknown as typeof fetch;
    await expect(
      loginAccount({ loginName: "runner", password: "wrong" }, fetcher),
    ).rejects.toEqual(
      expect.objectContaining({
        code: "account_invalid_credentials",
        status: 401,
      }),
    );
  });

  it("uses the private account endpoints for match recovery and sends CSRF only on rejoin", async () => {
    const fetcher = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Response(
          JSON.stringify(
            init?.method === "GET"
              ? {
                  schemaVersion: "netgrid-account-active-public-match-ids-v1",
                  generatedAt: "2026-07-27T10:00:00.000Z",
                  matchIds: ["match_own"],
                }
              : {
                  matchId: "match_own",
                  isPublic: true,
                  side: "runner",
                  sessionToken: "new-session-token",
                  reconnectToken: "new-reconnect-token",
                  webSocketUrl: "ws://127.0.0.1:8787/ws",
                  legalActions: [],
                  matchVersion: 4,
                },
          ),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;
    await expect(loadAccountActivePublicMatchIds(fetcher)).resolves.toEqual(
      expect.objectContaining({ matchIds: ["match_own"] }),
    );
    await rejoinAccountPublicMatch(
      { matchId: "match_own", csrfToken: "account-csrf" },
      fetcher,
    );
    const [getUrl, getInit] = (fetcher as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [string, RequestInit];
    const [postUrl, postInit] = (fetcher as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[1] as [string, RequestInit];
    expect(getUrl).toContain("/api/account/active-public-match-ids");
    expect(getInit.method).toBe("GET");
    expect(new Headers(getInit.headers).get("x-netgrid-csrf")).toBeNull();
    expect(postUrl).toContain("/api/account/matches/match_own/rejoin");
    expect(new Headers(postInit.headers).get("x-netgrid-csrf")).toBe(
      "account-csrf",
    );
  });
});

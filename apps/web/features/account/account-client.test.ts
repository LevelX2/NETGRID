import { describe, expect, it, vi } from "vitest";
import { changeAccountPassword, inviteTokenFromLocation, loginAccount, resetTokenFromLocation, restoreAccountSession } from "./account-client";

describe("account client", () => {
  it("uses credential cookies and keeps the session token outside the JavaScript contract", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      account: { accountId: "acct_1", loginName: "runner", displayName: "Runner", status: "active", role: "user", createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z" },
      session: { sessionId: "sess_1", accountId: "acct_1", authStrength: "password", createdAt: "2026-07-18T00:00:00.000Z", lastSeenAt: "2026-07-18T00:00:00.000Z", expiresAt: "2026-08-01T00:00:00.000Z" },
      csrfToken: "csrf-only-in-memory",
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;

    const payload = await loginAccount({ loginName: "runner", password: "lange passphrase" }, fetcher);
    expect(payload).not.toHaveProperty("sessionToken");
    const [, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
  });

  it("restores CSRF through the cookie session and sends it only as a mutation header", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "GET") return new Response(JSON.stringify({ account: {}, session: {}, csrfToken: "rotated-csrf" }), { status: 200 });
      return new Response(JSON.stringify({ ok: true, sessionsRevoked: true }), { status: 200 });
    }) as unknown as typeof fetch;
    expect((await restoreAccountSession(fetcher)).csrfToken).toBe("rotated-csrf");
    await changeAccountPassword({ currentPassword: "old", newPassword: "new", csrfToken: "rotated-csrf" }, fetcher);
    const [, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[1] as [string, RequestInit];
    expect(new Headers(init.headers).get("x-netgrid-csrf")).toBe("rotated-csrf");
    expect(JSON.stringify(init)).not.toContain("ng_account_session");
  });

  it("parses invite links and preserves neutral server errors", async () => {
    expect(inviteTokenFromLocation("?invite=abc%20123&matchId=ignored")).toBe("abc 123");
    expect(resetTokenFromLocation("?reset=reset%2Ftoken")).toBe("reset/token");
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: { code: "account_invalid_credentials", message: "Anmeldename oder Passwort ist nicht korrekt." } }), { status: 401 })) as unknown as typeof fetch;
    await expect(loginAccount({ loginName: "runner", password: "wrong" }, fetcher)).rejects.toEqual(expect.objectContaining({ code: "account_invalid_credentials", status: 401 }));
  });
});

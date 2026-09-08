import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configuredServerHttp,
  SERVER_ENDPOINT_ATTRIBUTE,
  validateServerOrigin,
} from "./server-endpoint";
import { gamebookDownloadTarget } from "../features/match-start/public-match-navigation";
import { resolveMaintenanceServerHttp } from "../app/maintenance";
import { loadStandardDecks } from "../features/account/account-deck-client";
import { fetchPublicMatches } from "./client-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("runtime browser server endpoint", () => {
  it("reads runtime changes after module import and ignores the build-time public variable", () => {
    vi.stubEnv("NETGRID_RUNTIME_PROFILE", "release");
    vi.stubEnv("NEXT_PUBLIC_NETGRID_SERVER_URL", "http://127.0.0.1:8787");
    vi.stubEnv("NETGRID_SERVER_BASE_URL", "http://127.0.0.1:32142");
    expect(configuredServerHttp()).toBe("http://127.0.0.1:32142");
    vi.stubEnv("NETGRID_SERVER_BASE_URL", "http://192.168.1.4:32144");
    expect(configuredServerHttp()).toBe("http://192.168.1.4:32144");
  });

  it("requires explicit configuration in release", () => {
    vi.stubEnv("NETGRID_RUNTIME_PROFILE", "release");
    vi.stubEnv("NETGRID_SERVER_BASE_URL", undefined);
    expect(configuredServerHttp).toThrow("web_server_origin_missing");
  });

  it("projects the installed endpoint to callers and keeps Maintenance loopback-only with its custom port", () => {
    vi.stubGlobal("window", {});
    const getAttribute = vi.fn(() => "http://192.168.1.4:32142");
    vi.stubGlobal("document", { documentElement: { getAttribute } });
    expect(gamebookDownloadTarget("test", "de")).toBe(
      "http://192.168.1.4:32142/api/replays/test/gamebook?locale=de",
    );
    expect(getAttribute).toHaveBeenCalledWith(SERVER_ENDPOINT_ATTRIBUTE);
    expect(
      resolveMaintenanceServerHttp(configuredServerHttp(), "127.0.0.1"),
    ).toBe("http://127.0.0.1:32142");
  });

  it("never falls back to a build or environment URL when the browser projection is absent", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      documentElement: { getAttribute: () => null },
    });
    vi.stubEnv("NETGRID_SERVER_BASE_URL", "http://127.0.0.1:8787");
    expect(configuredServerHttp).toThrow("web_server_origin_missing");
  });

  it("uses the projected port for actual account and game API requests", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      documentElement: { getAttribute: () => "http://127.0.0.1:32142" },
    });
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            catalog: { decks: [], snapshots: [] },
            matches: [],
          }),
        ),
    );
    vi.stubGlobal("fetch", fetcher);
    await loadStandardDecks();
    await fetchPublicMatches();
    expect(fetcher.mock.calls.map((call) => (call as unknown[])[0])).toEqual([
      "http://127.0.0.1:32142/api/decks/standards",
      "http://127.0.0.1:32142/api/public/matches",
    ]);
  });

  it.each([
    "",
    "not a URL",
    "file:///test",
    "https://user:secret@example.com",
    "http://localhost/api",
    "http://localhost?token=secret",
    "http://localhost#secret",
  ])("rejects invalid or non-public origin %s", (value) => {
    expect(() => validateServerOrigin(value)).toThrow(/web_server_origin_/);
  });
});

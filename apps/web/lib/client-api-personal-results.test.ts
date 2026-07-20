import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPersonalRecentGameResults } from "./client-api";

describe("personal recent results client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the authenticated account endpoint with cookies", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            schemaVersion: "netgrid-personal-recent-results-v1",
            generatedAt: "2026-07-20T12:00:00.000Z",
            results: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetcher);

    const response = await fetchPersonalRecentGameResults();

    expect(response.results).toEqual([]);
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8787/api/account/recent-results?limit=20",
      { cache: "no-store", credentials: "include" },
    );
  });
});

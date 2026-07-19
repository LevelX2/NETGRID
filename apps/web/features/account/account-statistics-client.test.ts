import { describe, expect, it, vi } from "vitest";
import { loadAccountMatchHistory, loadAccountStatistics } from "./account-statistics-client";

describe("account statistics client", () => {
  it("loads private filters with credential cookies and cursor pagination", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("match-history")) return new Response(JSON.stringify({ schemaVersion: "netgrid-account-match-history-v1", statisticsSince: "2026-07-19T00:00:00.000Z", generatedAt: "2026-07-19T01:00:00.000Z", entries: [] }), { status: 200 });
      return new Response(JSON.stringify({ schemaVersion: "netgrid-account-statistics-v1", statisticsSince: "2026-07-19T00:00:00.000Z", generatedAt: "2026-07-19T01:00:00.000Z", period: "30d", filters: {}, totals: {}, bySide: {}, byOpponentKind: {}, byMode: {}, byMatchFormat: {}, series: {} }), { status: 200 });
    }) as unknown as typeof fetch;

    await loadAccountStatistics({ period: "30d", side: "runner", opponentKind: "ai", matchMode: "human_runner_vs_corp_ai" }, fetcher);
    await loadAccountMatchHistory({ period: "30d", side: "runner", opponentKind: "ai", matchMode: "human_runner_vs_corp_ai" }, { cursor: "result_1", limit: 10 }, fetcher);

    const [statisticsUrl, statisticsInit] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const [historyUrl, historyInit] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[1] as [string, RequestInit];
    expect(statisticsUrl).toContain("/api/account/statistics?period=30d&side=runner&opponentKind=ai&matchMode=human_runner_vs_corp_ai");
    expect(historyUrl).toContain("/api/account/match-history?period=30d&side=runner&opponentKind=ai&matchMode=human_runner_vs_corp_ai&limit=10&cursor=result_1");
    expect(statisticsInit.credentials).toBe("include");
    expect(historyInit.credentials).toBe("include");
    expect(statisticsInit.method).toBe("GET");
  });
});

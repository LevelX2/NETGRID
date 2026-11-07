import { describe, expect, it, vi } from "vitest";
import { fetchJoinCardPool } from "./join-card-pool";

const pools = [
  "originalset",
  "originalset_classic",
  "originalset_proteus",
  "originalset_classic_proteus",
] as const;
const signal = () => new AbortController().signal;
function responder(payload: unknown, status = 200) {
  return vi.fn(
    async () => new Response(JSON.stringify(payload), { status }),
  ) as unknown as typeof fetch;
}

describe("invitation-owned deck pool", () => {
  it.each(pools)("loads the validated invitation pool %s", async (cardPool) => {
    const fetcher = responder({
      matchId: "match/one",
      status: "pending",
      cardPool,
    });
    const abort = signal();
    await expect(
      fetchJoinCardPool("match/one", "join-token", abort, fetcher),
    ).resolves.toBe(cardPool);
    const [url, init] = vi.mocked(fetcher).mock.calls[0]!;
    expect(String(url)).toContain(
      "/api/matches/match%2Fone/join-info?token=join-token",
    );
    expect(init).toMatchObject({
      cache: "no-store",
      credentials: "include",
      signal: abort,
    });
  });

  it.each([
    [{ matchId: "other", cardPool: "originalset" }, "join_info_match_mismatch"],
    [{ matchId: "one" }, "join_info_card_pool_missing"],
    [{ matchId: "one", cardPool: "all_cards" }, "join_info_card_pool_invalid"],
    [{ code: "invalid_token" }, "invalid_token"],
    [
      {
        code: "server_operation_failed",
        diagnosticCode: "join_info_card_pool_missing",
      },
      "join_info_card_pool_missing",
    ],
    [null, "join_info_response_invalid"],
  ])(
    "rejects unusable metadata without borrowing a local pool: %j",
    async (body, code) => {
      await expect(
        fetchJoinCardPool("one", "token", signal(), responder(body)),
      ).rejects.toMatchObject({ code, owner: "match_join_info" });
    },
  );

  it("rejects an unsuccessful HTTP response even with a plausible body", async () => {
    await expect(
      fetchJoinCardPool(
        "one",
        "token",
        signal(),
        responder({ matchId: "one", cardPool: "originalset" }, 503),
      ),
    ).rejects.toMatchObject({ code: "join_info_request_failed" });
  });

  it("supports tokenless open-LAN metadata and rejects malformed JSON", async () => {
    const fetcher = responder({
      matchId: "one",
      cardPool: "originalset_proteus",
    });
    await expect(fetchJoinCardPool("one", "", signal(), fetcher)).resolves.toBe(
      "originalset_proteus",
    );
    expect(
      new URL(String(vi.mocked(fetcher).mock.calls[0]![0])).searchParams.has(
        "token",
      ),
    ).toBe(false);
    const malformed = vi.fn(
      async () => new Response("{"),
    ) as unknown as typeof fetch;
    await expect(
      fetchJoinCardPool("one", "", signal(), malformed),
    ).rejects.toMatchObject({ code: "join_info_response_invalid" });
  });
});

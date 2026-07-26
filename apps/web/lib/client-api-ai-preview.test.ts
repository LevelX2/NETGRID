import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiSidePayload } from "@netgrid/shared";
import type { SessionInfo } from "../app/session-recovery";
import { fetchAiDecisionPreview } from "./client-api";

const session: SessionInfo = {
  matchId: "match_ai_preview",
  side: "runner",
  sessionToken: "runner-session",
  reconnectToken: "runner-reconnect",
  webSocketUrl: "ws://127.0.0.1:8787",
  displayName: "Runner",
  mode: "human_runner_vs_corp_ai",
};

const payload = {
  matchVersion: 7,
  playerView: { stateVersion: 12 },
} as ApiSidePayload;

const safePreview = {
  matchId: session.matchId,
  matchVersion: 7,
  stateVersion: 12,
  requestedBy: "runner",
  side: "runner",
  generatedAt: "2026-07-26T09:00:00.000Z",
  actionId: "runner.gain_credit",
  actionType: "gain_credit",
  actionLabel: "1 Credit nehmen",
  reasonCode: "test.safe_preview",
  explanation: "Die eigene Seite würde einen Credit nehmen.",
  fallbackUsed: false,
  detail: {},
};

describe("human-side AI preview client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests only the authenticated human side and hands only the preview object to the UI", async () => {
    const hiddenSentinel = "VERDECKTE_KORP_HQ_SENTINELKARTE";
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            ok: true,
            preview: safePreview,
            payload: {
              hiddenOpponentCardTitle: hiddenSentinel,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetcher);

    const preview = await fetchAiDecisionPreview(session, payload);

    const request = fetcher.mock.calls[0];
    expect(request?.[0]).toBe(
      "http://127.0.0.1:8787/api/matches/match_ai_preview/ai-preview",
    );
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      side: "runner",
      targetSide: "runner",
      knownStateVersion: 12,
      knownMatchVersion: 7,
    });
    expect(preview).toEqual(safePreview);
    expect(JSON.stringify(preview)).not.toContain(hiddenSentinel);
  });

  it("blocks the retired private-hand preview schema before it can reach the overlay", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: true,
              preview: {
                ...safePreview,
                detail: {
                  aiPrivateHandPreview: {
                    schemaVersion: "ai-private-hand-preview-v1",
                    cards: [
                      {
                        instanceId: "corp_hidden_sentinel_1",
                        title: "Verdeckte Korp-Sentinelkarte",
                      },
                    ],
                  },
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    await expect(fetchAiDecisionPreview(session, payload)).rejects.toThrow(
      "Redaktionsprüfung",
    );
  });
});

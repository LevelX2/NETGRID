import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  decisionAnalysisUrl,
  loadDecisionReplayFixture,
  parseAiDecisionReplayExportArgs,
  validatedReplayFixtureFromDecisionAnalysis,
  writeDecisionReplayFixture,
} from "./export-ai-decision-replay-fixture";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("AI decision replay fixture export", () => {
  it("extracts an exact validated replay without turning the observed action into an expectation", () => {
    const payload = decisionAnalysisPayload();

    const fixture = validatedReplayFixtureFromDecisionAnalysis(payload, {
      matchId: "match_d602f9af7bf40b06",
      decisionIndex: 42,
    });

    expect(fixture).toEqual(payload.checkpointReplay);
    expect(fixture).not.toHaveProperty("expectation");
    expect(fixture.input).toMatchObject({
      matchId: "match_d602f9af7bf40b06",
      side: "corp",
    });
  });

  it("fails closed when replay provenance or any binding validation is unavailable", () => {
    const unavailable = decisionAnalysisPayload();
    unavailable.checkpointReplay.provenance = "unavailable";
    unavailable.checkpointReplay.reason =
      "historical_checkpoint_replay_context_unavailable";
    expect(() =>
      validatedReplayFixtureFromDecisionAnalysis(unavailable, {
        matchId: "match_d602f9af7bf40b06",
        decisionIndex: 42,
      }),
    ).toThrow(
      "decision_checkpoint_replay_unavailable:historical_checkpoint_replay_context_unavailable",
    );

    const invalid = decisionAnalysisPayload();
    invalid.checkpointReplay.validation.sideSafeInput = false;
    expect(() =>
      validatedReplayFixtureFromDecisionAnalysis(invalid, {
        matchId: "match_d602f9af7bf40b06",
        decisionIndex: 42,
      }),
    ).toThrow("decision_checkpoint_validation_failed:sideSafeInput");
  });

  it("rejects mismatched match, decision, state and observed-action bindings", () => {
    const cases: Array<
      [string, (payload: ReturnType<typeof decisionAnalysisPayload>) => void]
    > = [
      [
        "decision_analysis_match_binding_mismatch",
        (payload) => {
          payload.decision.matchId = "match_0000000000000000";
        },
      ],
      [
        "decision_analysis_index_binding_mismatch",
        (payload) => {
          payload.decision.decisionIndex = 41;
        },
      ],
      [
        "decision_checkpoint_player_view_state_binding_mismatch",
        (payload) => {
          payload.checkpointReplay.input.playerView.stateVersion = 99;
        },
      ],
      [
        "decision_checkpoint_observed_action_not_legal",
        (payload) => {
          payload.decision.selectedActionId = "corp.missing";
        },
      ],
    ];

    for (const [errorCode, mutate] of cases) {
      const payload = decisionAnalysisPayload();
      mutate(payload);
      expect(() =>
        validatedReplayFixtureFromDecisionAnalysis(payload, {
          matchId: "match_d602f9af7bf40b06",
          decisionIndex: 42,
        }),
      ).toThrow(errorCode);
    }
  });

  it("builds exactly one URL-encoded loopback GET target and rejects remote bases", () => {
    const url = decisionAnalysisUrl("http://127.0.0.1:8787", {
      matchId: "match_d602f9af7bf40b06",
      decisionIndex: 42,
    });
    expect(url.href).toBe(
      "http://127.0.0.1:8787/api/storage/maintenance/analysis/matches/match_d602f9af7bf40b06/decisions/42",
    );
    expect(() =>
      decisionAnalysisUrl("https://example.test", {
        matchId: "match_d602f9af7bf40b06",
        decisionIndex: 42,
      }),
    ).toThrow("maintenance_analysis_base_url_must_be_local_loopback");
  });

  it("loads the detail endpoint exactly once with a read-only GET", async () => {
    const calls: Array<{ url: string; method: string | undefined }> = [];
    const result = await loadDecisionReplayFixture({
      serverBaseUrl: "http://127.0.0.1:8787",
      request: {
        matchId: "match_d602f9af7bf40b06",
        decisionIndex: 42,
      },
      fetchImplementation: async (
        input: string | URL | Request,
        init?: RequestInit,
      ) => {
        calls.push({ url: String(input), method: init?.method });
        return new Response(JSON.stringify(decisionAnalysisPayload()), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    expect(calls).toEqual([
      {
        url: "http://127.0.0.1:8787/api/storage/maintenance/analysis/matches/match_d602f9af7bf40b06/decisions/42",
        method: "GET",
      },
    ]);
    expect(result.observedActionId).toBe("corp.install.remote-ice");
  });

  it("writes the validated JSON with exclusive creation semantics", () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-checkpoint-export-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "nested", "fixture.json");
    const fixture = validatedReplayFixtureFromDecisionAnalysis(
      decisionAnalysisPayload(),
      {
        matchId: "match_d602f9af7bf40b06",
        decisionIndex: 42,
      },
    );

    expect(writeDecisionReplayFixture(outputPath, fixture)).toBe(outputPath);
    expect(JSON.parse(readFileSync(outputPath, "utf8"))).toEqual(fixture);
    expect(() => writeDecisionReplayFixture(outputPath, fixture)).toThrow();
  });

  it("parses the explicit match, decision and output contract", () => {
    expect(
      parseAiDecisionReplayExportArgs([
        "--",
        "--match-id",
        "match_d602f9af7bf40b06",
        "--decision-index",
        "42",
        "--out",
        "data/scenarios/ai-decision-checkpoints/cp-d602-remote.json",
      ]),
    ).toMatchObject({
      matchId: "match_d602f9af7bf40b06",
      decisionIndex: 42,
      outputPath: "data/scenarios/ai-decision-checkpoints/cp-d602-remote.json",
    });
  });
});

function decisionAnalysisPayload(): {
  schemaVersion: string;
  decision: {
    matchId: string;
    decisionIndex: number;
    selectedActionId: string;
  };
  checkpointReplay: {
    schemaVersion: string;
    provenance: string;
    reason?: string;
    actor: string;
    stateVersion: number;
    stateHash: string;
    input: {
      matchId: string;
      side: string;
      playerView: {
        side: string;
        stateVersion: number;
        timingPoint: string;
      };
      legalActions: Array<{
        actionId: string;
        side: string;
        type: string;
      }>;
    };
    runtime: { schemaVersion: string };
    validation: Record<string, boolean>;
  };
} {
  return {
    schemaVersion: "netgrid-decision-analysis-context-v4",
    decision: {
      matchId: "match_d602f9af7bf40b06",
      decisionIndex: 42,
      selectedActionId: "corp.install.remote-ice",
    },
    checkpointReplay: {
      schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1",
      provenance: "reconstructed_from_persisted_decision_sources",
      actor: "corp",
      stateVersion: 73,
      stateHash: "fnv1a:checkpoint",
      input: {
        matchId: "match_d602f9af7bf40b06",
        side: "corp",
        playerView: {
          side: "corp",
          stateVersion: 73,
          timingPoint: "corp_action.main",
        },
        legalActions: [
          {
            actionId: "corp.install.remote-ice",
            side: "corp",
            type: "install.card",
          },
        ],
      },
      runtime: {
        schemaVersion: "ai-runtime-checkpoint-v1",
      },
      validation: {
        snapshotHashMatches: true,
        sideSafeInput: true,
        inputMatchesActor: true,
        inputMatchesStateVersion: true,
        legalActionSetMatchesHistoricalAudit: true,
        actorStateMatchesHistoricalSnapshot: true,
        publicEventPrefixComplete: true,
        deckConsumersMatchPersistedProjection: true,
        humanPrivateHandExcluded: true,
      },
    },
  };
}

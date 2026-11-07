import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";

import visibleAgendaRezD7Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d249-01-rez-visible-agenda-asp-d7.json";
import overtimeScoreD9Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9475-01-continue-overtime-score-d9.json";
import hardenRdOrDevelopAssetD43Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9475-02-harden-rd-or-develop-asset-d43.json";
import hardenRdOrDevelopAssetD47Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9475-03-harden-rd-or-develop-asset-d47.json";
import terminalDataWallRezD52Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9475-04-rez-data-wall-terminal-rd-d52.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("d249 and 9475 Corp remediation checkpoints", () => {
  it.each([
    ["rezzes Asp for the visible agenda remote", visibleAgendaRezD7Json],
    ["uses Night Shift to find needed R&D defense", overtimeScoreD9Json],
    [
      "hardens pressured R&D or develops the installed counter asset at D43",
      hardenRdOrDevelopAssetD43Json,
    ],
    [
      "hardens terminally pressured R&D or develops the installed counter asset at D47",
      hardenRdOrDevelopAssetD47Json,
    ],
    ["rezzes Data Wall for terminal R&D access", terminalDataWallRezD52Json],
  ])("%s", (_label, json) => {
    const checkpoint = fixture(json);
    if (json === overtimeScoreD9Json) {
      checkpoint.expectation.acceptableActions = [
        {
          actionId:
            "corp.play_operation.corp_onr_v1_295_night-shift_1.corp_onr_v1_295_night-shift_1.onr_v1_295_night-shift:abilities_on_play_gain_credits",
        },
      ];
    }
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    if (json === overtimeScoreD9Json) {
      const state = checkpoint.engine.testOnlyGameState;
      const next = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: result.decision!.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(next.ok).toBe(true);
      if (!next.ok) throw Error(JSON.stringify(next.error));
      expect(next.state.corp.credits).toBe(state.corp.credits + 2);
      expect(next.state.corp.clicks).toBe(state.corp.clicks - 1);
      expect(next.state.corp.hq).toHaveLength(state.corp.hq.length);
      expect(next.state.corp.rd).toHaveLength(state.corp.rd.length - 1);
    }
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

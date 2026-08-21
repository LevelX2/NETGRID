import { describe, expect, it } from "vitest";

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
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

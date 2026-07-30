import { describe, expect, it } from "vitest";

import openingDefenseControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-00-opening-central-defense-control-d3.json";
import turn7AgendaDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-01-turn7-agenda-defense-d23.json";
import turn9AgendaDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-02-turn9-agenda-defense-d28.json";
import markedAccountsDiscardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-03-marked-accounts-discard-d32.json";
import conditionalUpgradeDiscardControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-04-conditional-upgrade-discard-control-d26.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import {
  runAiDecisionCheckpoint,
  type AiDecisionCheckpointRunResult,
} from "./checkpoint-runner";

describe("match 5F7924 Corp agenda, defense and discard checkpoints", () => {
  it("keeps the coherent opening central-defense line", () => {
    expectCheckpointToPass(openingDefenseControlJson);
  });

  it("starts the bound agenda-defense line with two actions after Efficiency Experts", () => {
    expectCheckpointToPass(turn7AgendaDefenseJson);
  });

  it("starts the bound agenda-defense line instead of taking three neutral credits", () => {
    expectCheckpointToPass(turn9AgendaDefenseJson);
  });

  it("retains Marked Accounts and discards one of three Jack Attacks", () => {
    expectCheckpointToPass(markedAccountsDiscardJson);
  });

  it("still discards the inactive conditional damage upgrade", () => {
    expectCheckpointToPass(conditionalUpgradeDiscardControlJson);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(value: unknown): void {
  const result = runAiDecisionCheckpoint(fixture(value));
  expect(result.ok, diagnostic(result)).toBe(true);
}

function diagnostic(result: AiDecisionCheckpointRunResult): string {
  return JSON.stringify({
    code: result.code,
    message: result.message,
    selectedActionId: result.selectedAction?.actionId,
    selectedActionType: result.selectedAction?.type,
    selectedChoices: result.decision?.selectedChoices,
    planKind: result.decision?.decisionDebug?.planKind,
    planFirst: result.decision?.decisionDebug?.planFirstDecision,
  });
}

import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-431-upgrade-rez-reserve-d7.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpExactCardRezSupportAssessment } from "../../corp/defense/defense-run-response";

it("preserves the only funded ICE instead of buying support for an unrezable target", () => {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  expect(input.playerView.own.credits).toBe(8);
  expect(input.playerView.own.clicks).toBe(0);
  const ice = input.playerView.servers.find((s) => s.id === "rd")!.ice[0]!;
  expect(ice.effectiveRezCostQuote).toMatchObject({
    complete: true,
    finalCredits: 8,
    expiresAtStateVersion: 6,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.end_turn");
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
  ).toBe("corp.complete_turn");
});

it.each([
  ["funded", true],
  ["free", true],
  ["rezzed", true],
  ["insufficient", false],
  ["stale", false],
  ["missing", false],
  ["wrong_target", false],
  ["additional_cost", false],
] as const)(
  "retains exact support funding boundaries: %s",
  (variant, expected) => {
    const input = structuredClone(checkpointJson)
      .input as unknown as AiDecisionInputWithDeckCapabilities;
    const server = input.playerView.servers.find((s) => s.id === "rd")!;
    const ice = server.ice[0]!;
    const quote = ice.effectiveRezCostQuote!;
    if (!quote.complete) throw Error("complete fixture quote required");
    const action = input.legalActions.find((a) => a.type === "rez_card")!;
    if (variant === "funded") input.playerView.own.credits = 10;
    if (variant === "free") action.costs = [{ credits: 0 }];
    if (variant === "rezzed") ice.rezzed = true;
    if (variant === "stale") {
      input.playerView.own.credits = 10;
      quote.expiresAtStateVersion--;
    }
    if (variant === "missing") {
      input.playerView.own.credits = 10;
      delete ice.effectiveRezCostQuote;
    }
    if (variant === "wrong_target") {
      input.playerView.own.credits = 10;
      quote.cardId = "another-ice";
    }
    if (variant === "additional_cost") {
      input.playerView.own.credits = 10;
      quote.mandatoryAdditionalCosts.agendaPoints = 1;
    }
    const candidate = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
    }).find((c) => c.actionId === action.actionId)!;
    expect(
      corpExactCardRezSupportAssessment(input, candidate, server.root[0]!, "rd")
        ?.productive,
    ).toBe(expected);
  },
);

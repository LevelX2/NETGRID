import { afterEach, expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-735-r1-g20-d300.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpFloodInstallCreatesCombinedTerminalExposure } from "../../corp/score/score-flood-exposure";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = capture as unknown as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
const agendaId = "corp_onr_v1_196_corporate-war_2";
afterEach(resetResidentPlanPortfolioMemory);

function fixture() {
  const input = structuredClone(checkpoint.input);
  const agenda = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === agendaId,
  )!;
  const install = input.legalActions.find(
    (action) =>
      action.source === agendaId && action.payload?.serverId === "new_remote",
  )!;
  return { input, agenda, install };
}

it("holds the new naked agenda when the best funded existing ICE still permits the first steal", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const { input, agenda, install } = fixture();
  expect(
    corpFloodInstallCreatesCombinedTerminalExposure(
      input,
      agenda,
      "new_remote",
      install.actionId,
    ),
  ).toBe(true);
  if (!input.ownDeckSnapshot) throw new Error("Deck snapshot missing");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).not.toBe(install.actionId);
});

it.each([
  [
    "two steals stay below the win target",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.agendaPoints = 0;
    },
  ],
  [
    "the existing remote really stops the runner",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.credits = 0;
    },
  ],
  [
    "one Runner run remains",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.runnerNextTurnCreditClicks = 0;
    },
  ],
] as const)("does not infer a paid terminal pair when %s", (_name, adjust) => {
  const { input, agenda, install } = fixture();
  adjust(input);
  expect(
    corpFloodInstallCreatesCombinedTerminalExposure(
      input,
      agenda,
      "new_remote",
      install.actionId,
    ),
  ).toBe(false);
});

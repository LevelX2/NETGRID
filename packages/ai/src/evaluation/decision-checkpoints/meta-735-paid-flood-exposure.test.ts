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
const fetalId = "corp_onr_proteus_004_fetal-ai_1";
const brokerId = "runner_onr_v1_154_broker_3";
afterEach(resetResidentPlanPortfolioMemory);

function fixture(sourceId = agendaId) {
  const input = structuredClone(checkpoint.input);
  const agenda = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === sourceId,
  )!;
  const install = input.legalActions.find(
    (action) =>
      action.source === sourceId && action.payload?.serverId === "new_remote",
  )!;
  return { input, agenda, install };
}

it("holds the new naked agenda when the best funded existing ICE still permits the first steal", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const { input } = fixture();
  const bareAgendaInstalls = input.legalActions.filter(
    (action) =>
      action.type === "install_card" &&
      action.payload?.serverId === "new_remote" &&
      input.playerView.own.gripOrHq.some(
        (card) => card.instanceId === action.source && card.type === "agenda",
      ),
  );
  expect(bareAgendaInstalls).toHaveLength(4);
  for (const install of bareAgendaInstalls) {
    const agenda = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === install.source,
    )!;
    expect(
      corpFloodInstallCreatesCombinedTerminalExposure(
        input,
        agenda,
        "new_remote",
        install.actionId,
      ),
    ).toBe(true);
  }
  if (!input.ownDeckSnapshot) throw new Error("Deck snapshot missing");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(bareAgendaInstalls.map((action) => action.actionId)).not.toContain(
    decision.actionId,
  );
});

it.each([
  [
    "the visible bank has no credits for the extra steal cost",
    (input: AiDecisionInputWithDeckCapabilities) => {
      const broker = input.playerView.opponent.rig!.find(
        (card) => card.instanceId === brokerId,
      )!;
      expect(broker.counters?.bit).toBe(6);
      broker.counters = { ...broker.counters, bit: 0 };
    },
  ],
  [
    "the current hand cannot take the on-access damage",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.handCount = 1;
    },
  ],
] as const)(
  "keeps the Fetal AI exposure uncertain when %s",
  (_name, adjust) => {
    const { input, agenda, install } = fixture(fetalId);
    adjust(input);
    expect(
      corpFloodInstallCreatesCombinedTerminalExposure(
        input,
        agenda,
        "new_remote",
        install.actionId,
      ),
    ).toBe(false);
  },
);

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

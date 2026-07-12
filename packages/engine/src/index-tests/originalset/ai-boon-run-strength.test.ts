import { describe, expect, it } from "vitest";

import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "../../index";
import {
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  apply,
  installRunnerProgramForTest,
  mustAction,
  putCorpIceOnServer,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const AI_BOON = "onr_v1_002_ai-boon";
const CREDIT_BLOCKS = "onr_proteus_017_credit-blocks";

function aiBoonStrengthGame(seed: string) {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...ONR_V1_1_2K_RUNNER_DECK,
        id: `${seed}_runner`,
        name: "AI Boon Run Strength Runner",
        cards: [{ id: AI_BOON, quantity: 1 }, ...ONR_V1_1_2K_RUNNER_DECK.cards],
      },
      corpDeck: {
        ...ONR_V1_1_2K_CORP_DECK,
        id: `${seed}_corp`,
        name: "AI Boon Run Strength Corp",
        cards: [
          { id: CREDIT_BLOCKS, quantity: 1 },
          ...ONR_V1_1_2K_CORP_DECK.cards,
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
}

function encounterCreditBlocksAtRunStrength(requestedStrength: number) {
  let state = aiBoonStrengthGame(`ai-boon-run-strength-${requestedStrength}`);
  state.runner.credits = 20;
  state.corp.credits = 20;
  const breakerId = installRunnerProgramForTest(state, AI_BOON);
  const iceId = putCorpIceOnServer(state, "rd", CREDIT_BLOCKS);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  if (!state.run) throw new Error("Run wurde nicht gestartet.");
  state.run.runStartRandomStrengthByBreaker = {
    [breakerId]: requestedStrength,
  };
  state.run.runStartRandomStrength = requestedStrength;
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      action.source === iceId &&
      action.payload?.selectedSubtypesAfterRez === "sentry",
  );
  return { state, breakerId, iceId };
}

describe("AI Boon run strength", () => {
  it("uses the d6 result itself as run base strength", () => {
    let state = aiBoonStrengthGame("ai-boon-d6-is-run-strength");
    state.runner.credits = 20;
    state.corp.credits = 20;
    const breakerId = installRunnerProgramForTest(state, AI_BOON);
    putCorpIceOnServer(state, "rd", CREDIT_BLOCKS);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    const dieRoll = Number(state.eventLog.at(-1)?.publicPayload.v1921DieRoll);
    expect(dieRoll).toBeGreaterThanOrEqual(1);
    expect(dieRoll).toBeLessThanOrEqual(6);
    expect(state.run?.runStartRandomStrengthByBreaker?.[breakerId]).toBe(
      dieRoll,
    );
    expect(state.eventLog.at(-1)?.publicPayload.runStartRandomStrength).toBe(
      dieRoll,
    );
  });

  it("offers pump before break at strength 2 and accepts the break after pumping", () => {
    let { state, breakerId, iceId } = encounterCreditBlocksAtRunStrength(2);

    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === breakerId,
      )?.strength,
    ).toBe(2);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === breakerId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === breakerId,
    );

    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === breakerId,
      )?.strength,
    ).toBe(3);
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === breakerId &&
        action.payload?.iceId === iceId,
    );
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "ai-boon-break-after-pump",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts the Credit Blocks break from the stored run strength 5", () => {
    const { state, breakerId, iceId } = encounterCreditBlocksAtRunStrength(5);
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === breakerId &&
        action.payload?.iceId === iceId,
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "ai-boon-break-at-run-strength-five",
    });

    expect(result.ok).toBe(true);
  });
});

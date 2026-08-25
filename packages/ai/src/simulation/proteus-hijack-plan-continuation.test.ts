import {
  applyAction,
  createGameAfterSetup,
  getPlayerView,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { chooseAiAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";

const HIJACK = "onr_proteus_110_hijack";
const INSTALL_TARGET = "onr_proteus_151_sunburst-cranial-interface";

describe("Proteus Hijack plan continuation", () => {
  it("keeps the prebound private install choice in the same development executor", () => {
    const runnerDeck = deck("proteus_runner_hq_virus_derez_2026_05_25");
    const state = hijackState(
      runnerDeck,
      deck("proteus_corp_antibody_tax_2026_05_25"),
    );
    const hijackId = runnerCard(state, HIJACK).instanceId;
    const targetId = runnerCard(state, INSTALL_TARGET).instanceId;
    const planInstance = `plan:runner.develop_board_and_hand:card%3A${hijackId}`;
    const ownDeckSnapshot = deckSnapshot(runnerDeck);

    resetResidentPlanPortfolioMemory();
    const fullPlayInput = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot,
      decisionId: `${state.matchId}:play-hijack`,
      profileId: "proteus-hijack-plan-continuation",
    });
    const quotedHijackAction = fullPlayInput.legalActions.find(
      (action) =>
        action.type === "play_event" && action.payload?.cardId === hijackId,
    );
    if (!quotedHijackAction) throw new Error("Missing quoted Hijack action");
    // This regression covers plan ownership and the bound resolution only.
    // Recompute the planner identity for the focused real Engine action so
    // unrelated turn arbitration cannot move the fixture away from Hijack.
    const playInput = {
      ...fullPlayInput,
      legalActions: [quotedHijackAction],
      planningStateIdentity: buildPlanningStateIdentity({
        ...fullPlayInput,
        legalActions: [quotedHijackAction],
      }),
    };
    const playDecision = chooseAiAction(playInput);
    const playAction = playInput.legalActions.find(
      (action) => action.actionId === playDecision.actionId,
    );
    expect(playAction).toMatchObject({
      type: "play_event",
      payload: {
        cardId: hijackId,
        runnerEventInstallChoiceQuoteSelectableTargetIds: targetId,
      },
    });
    expect(playDecision).toMatchObject({
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.develop_board_and_hand" },
    });
    expect(playDecision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_executor:${planInstance}`,
        `plan_first_root:${planInstance}`,
      ]),
    );

    const playResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: playDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-hijack-plan-continuation:play",
    });
    if (!playResult.ok) throw new Error(playResult.error.message);
    const choiceState = playResult.state;
    const choiceInput = buildAiDecisionInput(choiceState, "runner", {
      ownDeckSnapshot,
      decisionId: `${state.matchId}:resolve-hijack`,
      profileId: "proteus-hijack-plan-continuation",
    });
    const choiceDecision = chooseAiAction(choiceInput);
    const choiceAction = choiceInput.legalActions.find(
      (action) => action.actionId === choiceDecision.actionId,
    );

    expect(choiceAction).toMatchObject({
      type: "resolve_choice",
      side: "runner",
    });
    expect(choiceDecision).toMatchObject({
      actionId: choiceAction?.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.develop_board_and_hand" },
    });
    expect(choiceDecision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_executor:${planInstance}`,
        `plan_first_root:${planInstance}`,
        "plan_step_capability:resolve_bound_event_install_choice",
      ]),
    );
    expect(
      choiceInput.playerView.pendingChoice?.continuation,
    ).toMatchObject({
      family: "runner_grip_install_with_temporary_credits",
      originActionId: playDecision.actionId,
      sourceCardInstanceId: hijackId,
      sourceCardDefinitionId: HIJACK,
      sourceCapabilityKey:
        "install_grip_program_or_hardware_with_temp_credits",
      createdAtStateVersion: choiceState.stateVersion,
    });
    expect(choiceDecision.selectedChoices).toEqual({
      choiceId: choiceInput.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [
        choiceInput.playerView.pendingChoice?.options.find(
          (option) => option.value === targetId,
        )?.id,
      ],
    });
    expect(getPlayerView(choiceState, "corp").pendingChoice).toBeUndefined();
  });
});

function hijackState(
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
): GameState {
  const state = createGameAfterSetup({
    matchId: "proteus-hijack-plan-continuation",
    seed: "proteus-hijack-plan-continuation",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  const hijack = runnerCard(state, HIJACK);
  const target = runnerCard(state, INSTALL_TARGET);
  const runnerCardIds = [
    ...state.runner.grip,
    ...state.runner.stack,
    ...state.runner.heap,
  ];

  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 3;
  state.runner.grip = [hijack.instanceId, target.instanceId];
  state.runner.stack = runnerCardIds.filter(
    (cardId) =>
      cardId !== hijack.instanceId &&
      cardId !== target.instanceId,
  );
  state.runner.heap = [];
  state.runner.rig.programs = [];
  state.runner.rig.hardware = [];
  state.runner.rig.resources = [];
  state.runner.memoryUsed = 0;
  for (const cardId of runnerCardIds) {
    const card = state.cardInstances[cardId]!;
    card.zone = {
      side: "runner",
      zone:
        cardId === hijack.instanceId || cardId === target.instanceId
          ? "grip"
          : "stack",
    };
    card.faceup = false;
    card.rezzed = false;
  }
  return state;
}

function runnerCard(state: GameState, definitionId: string) {
  const card = Object.values(state.cardInstances).find(
    (candidate) =>
      candidate.owner === "runner" &&
      candidate.definitionId === definitionId,
  );
  if (!card) throw new Error(`Missing Runner card ${definitionId}`);
  return card;
}

function deckSnapshot(
  deckDefinition: DeckDefinition,
): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-hijack-continuation`,
    sourceDeckId: deckDefinition.id,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return structuredClone(result);
}

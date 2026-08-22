import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type {
  CardInstanceId,
  DeckDefinition,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { chooseRunnerAction } from "../index";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";

const CRASH_EVERETT = "onr_v1_157_crash-everett-inventive-fixer";
const CITY_SURVEILLANCE = "onr_v1_313_city-surveillance";

describe("Crash Everett draw-plan continuation", () => {
  it("resolves the private replacement choice under the exact preceding Runner executor", () => {
    resetResidentPlanPortfolioMemory();
    const runnerDeck = deck("proteus_runner_rd_bad_publicity_2026_05_25");
    const corpDeck = deck("proteus_corp_region_fast_score_2026_05_25");
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "crash-everett-plan-continuation",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    const crashId = moveRunnerCardToGrip(state, CRASH_EVERETT);
    state = applyLegal(
      state,
      "runner",
      getLegalActions(state, "runner").find(
        (action) =>
          action.type === "install_card" && action.payload?.cardId === crashId,
      ),
    );

    const drawInput = withOnlyActionType(
      decisionInput(state, runnerDeck, "draw"),
      "draw_card",
    );
    const drawDecision = chooseRunnerAction(drawInput);
    const drawStateVersion = state.stateVersion;
    state = applyDecision(state, "runner", drawDecision);

    const choiceInput = decisionInput(state, runnerDeck, "choice");
    const residentAtChoice = residentPlanPortfolioSnapshot(choiceInput);
    const choiceDecision = chooseRunnerAction(choiceInput);
    const drawExecutor = (drawDecision.evidence ?? []).find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );
    const choiceExecutor = (choiceDecision.evidence ?? []).find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );

    expect({
      stateContinuation: state.pendingChoice?.continuation,
      continuation: choiceInput.playerView.pendingChoice?.continuation,
      residentAtChoice,
    }).toMatchObject({
      continuation: {
        family: "runner_hidden_draw_keep_or_top_replacement",
        originActionId: drawDecision.actionId,
      },
      stateContinuation: {
        family: "runner_hidden_draw_keep_or_top_replacement",
        originActionId: drawDecision.actionId,
      },
      residentAtChoice: {
        side: "runner",
        stateVersion: drawStateVersion,
        selectedActionOrigin: {
          selectedActionId: drawDecision.actionId,
          selectedAtStateVersion: drawStateVersion,
        },
      },
    });
    expect(drawDecision).toMatchObject({
      actionId: expect.stringContaining("runner.draw"),
      fallbackUsed: false,
    });
    expect(choiceDecision).toMatchObject({
      actionId: "runner.resolve_choice",
      reasonCode: drawDecision.reasonCode,
      fallbackUsed: false,
    });
    expect(drawExecutor).toBeDefined();
    expect(choiceExecutor).toBe(drawExecutor);
    expect(choiceInput.playerView.pendingChoice?.continuation).toMatchObject({
      family: "runner_hidden_draw_keep_or_top_replacement",
      originActionId: drawDecision.actionId,
      sourceCardDefinitionId: CRASH_EVERETT,
      createdAtStateVersion: state.stateVersion,
    });
    expect(
      choiceInput.playerView.pendingChoice?.options.every(
        (option) => option.card?.known && option.card.definitionId,
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("preserves the draw-plan origin through mandatory draw-tax choices", () => {
    resetResidentPlanPortfolioMemory();
    const runnerDeck = deck("proteus_runner_rd_bad_publicity_2026_05_25");
    const baseCorpDeck = deck("proteus_corp_region_fast_score_2026_05_25");
    const corpDeck: DeckDefinition = {
      ...baseCorpDeck,
      id: `${baseCorpDeck.id}_with_city_surveillance`,
      cards: [
        ...baseCorpDeck.cards,
        { id: CITY_SURVEILLANCE, quantity: 1 },
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "crash-everett-plan-continuation-with-draw-tax",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    const crashId = moveRunnerCardToGrip(state, CRASH_EVERETT);
    state = applyLegal(
      state,
      "runner",
      getLegalActions(state, "runner").find(
        (action) =>
          action.type === "install_card" && action.payload?.cardId === crashId,
      ),
    );
    moveCorpCardToRemoteAndRez(state, CITY_SURVEILLANCE);

    const drawInput = withOnlyActionType(
      decisionInput(state, runnerDeck, "taxed-draw"),
      "draw_card",
    );
    const drawDecision = chooseRunnerAction(drawInput);
    const drawStateVersion = state.stateVersion;
    state = applyDecision(state, "runner", drawDecision);

    let drawTaxChoiceCount = 0;
    while (state.pendingChoice?.source.startsWith("runner_draw.draw_tax:")) {
      const taxInput = decisionInput(
        state,
        runnerDeck,
        `draw-tax-${drawTaxChoiceCount + 1}`,
      );
      const taxDecision = chooseRunnerAction(taxInput);
      expect(taxDecision).toMatchObject({
        actionId: "runner.resolve_choice",
        fallbackUsed: false,
      });
      state = applyDecision(state, "runner", taxDecision);
      drawTaxChoiceCount += 1;
    }

    const choiceInput = decisionInput(state, runnerDeck, "taxed-choice");
    const residentAtChoice = residentPlanPortfolioSnapshot(choiceInput);
    const choiceDecision = chooseRunnerAction(choiceInput);
    const drawExecutor = (drawDecision.evidence ?? []).find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );
    const choiceExecutor = (choiceDecision.evidence ?? []).find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );

    expect(drawTaxChoiceCount).toBe(2);
    expect(choiceInput.playerView.pendingChoice?.continuation).toMatchObject({
      family: "runner_hidden_draw_keep_or_top_replacement",
      originActionId: drawDecision.actionId,
      sourceCardDefinitionId: CRASH_EVERETT,
    });
    expect(residentAtChoice).toMatchObject({
      side: "runner",
      stateVersion: drawStateVersion,
      selectedActionOrigin: {
        selectedActionId: drawDecision.actionId,
        selectedAtStateVersion: drawStateVersion,
      },
    });
    expect(choiceDecision).toMatchObject({
      actionId: "runner.resolve_choice",
      reasonCode: drawDecision.reasonCode,
      fallbackUsed: false,
    });
    expect(choiceDecision.selectedChoices?.selectedOptionIds).toHaveLength(1);
    expect(drawExecutor).toBeDefined();
    expect(choiceExecutor).toBe(drawExecutor);
  });
});

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return result;
}

function snapshot(deckDefinition: DeckDefinition): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-snapshot`,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}

function decisionInput(
  state: GameState,
  runnerDeck: DeckDefinition,
  suffix: string,
) {
  return buildAiDecisionInput(state, "runner", {
    decisionId: `crash-everett:${suffix}:${state.stateVersion}`,
    profileId: "crash-everett-plan-continuation",
    ownDeckSnapshot: snapshot(runnerDeck),
  });
}

function withOnlyActionType(
  input: ReturnType<typeof decisionInput>,
  type: LegalAction["type"],
): ReturnType<typeof decisionInput> {
  const legalActions = input.legalActions.filter(
    (action) => action.type === type,
  );
  if (legalActions.length !== 1) {
    throw new Error(`Expected exactly one ${type} action.`);
  }
  return {
    ...input,
    legalActions,
    playerView: {
      ...input.playerView,
      legalActions,
    },
  };
}

function toRunnerTurn(state: GameState): GameState {
  let next = applyLegal(
    state,
    "corp",
    getLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    ),
  );
  next = applyLegal(
    next,
    "corp",
    getLegalActions(next, "corp").find((action) => action.type === "end_turn"),
  );
  while (next.pendingChoice?.side === "corp") {
    next = applyLegal(
      next,
      "corp",
      getLegalActions(next, "corp").find(
        (action) => action.type === "resolve_choice",
      ),
    );
  }
  return next;
}

function moveRunnerCardToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing ${definitionId}.`);
  const [cardId, card] = entry;
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  state.runner.grip.unshift(cardId);
  state.cardInstances[cardId] = {
    ...card,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return cardId;
}

function moveCorpCardToRemoteAndRez(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing ${definitionId}.`);
  const [cardId, card] = entry;
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  let remote = state.corp.servers.find((server) => server.id === "remote_1");
  if (!remote) {
    remote = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(remote);
  }
  remote.root.push(cardId);
  state.cardInstances[cardId] = {
    ...card,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: true,
    rezzed: true,
  };
  return cardId;
}

function applyDecision(
  state: GameState,
  side: Side,
  decision: ReturnType<typeof chooseRunnerAction>,
): GameState {
  if (!decision.actionId) throw new Error("AI decision has no actionId.");
  return applyLegal(
    state,
    side,
    getLegalActions(state, side).find(
      (action) => action.actionId === decision.actionId,
    ),
    decision.selectedChoices,
  );
}

function applyLegal(
  state: GameState,
  side: Side,
  action: LegalAction | undefined,
  selectedChoices?: ReturnType<typeof chooseRunnerAction>["selectedChoices"],
): GameState {
  if (!action) throw new Error(`Missing ${side} fixture action.`);
  const resolvedChoices =
    selectedChoices ??
    (action.type === "resolve_choice" && state.pendingChoice
      ? {
          choiceId: state.pendingChoice.choiceId,
          selectedOptionIds: [String(state.pendingChoice.options[0]?.id)],
        }
      : undefined);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(resolvedChoices ? { selectedChoices: resolvedChoices } : {}),
    idempotencyKey: `${side}:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

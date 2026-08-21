import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type AiDecision,
  type CardInstanceId,
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { selectedCorpHardwareTrashChoiceOptionIds } from "./corp-hardware-trash-choice";
import {
  buildBoundedCorpPunishRouteRequests,
  withDecisionLocalCorpPunishRouteQuotes,
} from "./corp-punish-route-quote-input";

const POWER_GRID = "onr_v1_299_power-grid-overload";
const POWER_GRID_CAPABILITY_ID = `${POWER_GRID}:corp_utility_installed_hardware_trash_by_counter`;
const RD_INTERFACE = "onr_v1_139_r-and-d-interface";
const SIMPLE_HARDWARE = "simple_setup_hardware";
const CYBERNETICS = "onr_v1_127_full-body-conversion";
const UMBRELLA_POLICY = "onr_v1_186_umbrella-policy";

const CORP_DECK = withCards(DEMO_DECKS.demo_corp_001, "power-grid-quote-corp", [
  POWER_GRID,
]);
const RUNNER_DECK = withCards(
  DEMO_DECKS.demo_runner_001,
  "power-grid-quote-runner",
  [RD_INTERFACE, SIMPLE_HARDWARE, CYBERNETICS, UMBRELLA_POLICY],
);

describe("Power Grid decision-local real-Engine punish quote", () => {
  it("executes the exact X=1 LegalAction and resolves a real X<N target choice deterministically", () => {
    let state = powerGridState("power-grid-execute", 3, {
      hardware: [RD_INTERFACE, SIMPLE_HARDWARE, CYBERNETICS],
    });
    const input = decisionInput(state);
    const actions = powerGridActions(input.legalActions);
    expect(
      actions.map((action) => action.payload?.hardwareTrashByCounterTrashCount),
    ).toEqual([0, 1, 2]);
    const [request] = buildBoundedCorpPunishRouteRequests(input);
    if (!request) throw new Error("Missing executable Power Grid request.");
    expect(request.steps[0]?.currentLegalActionId).toBe(actions[1]!.actionId);
    const rawQuote = quoteCorpPunishRoute(state, request);
    if (rawQuote.ok && !rawQuote.quote.complete) {
      throw new Error(
        `Unexpected incomplete quote: ${rawQuote.quote.incompleteReasons.join(",")}`,
      );
    }
    expect(rawQuote).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        steps: [
          {
            currentLegalAction: { actionId: actions[1]!.actionId },
          },
        ],
      },
    });
    const xTwoRequest = structuredClone(request);
    xTwoRequest.steps[0]!.currentLegalActionId = actions[2]!.actionId;
    const xTwoQuote = quoteCorpPunishRoute(state, xTwoRequest);
    expect(xTwoQuote).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        totalActionCredits: 2,
        steps: [
          {
            credits: 2,
            currentLegalAction: { actionId: actions[2]!.actionId },
            hardwareTrashProjection: {
              selectedX: 2,
              legalMaximumX: 2,
            },
          },
        ],
      },
    });

    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = powerGridRoute(quoted);
    expect(route).toMatchObject({
      complete: true,
      totalClicks: 1,
      totalActionCredits: 1,
      guarantee: "guaranteed",
      responseKnowledge: "public_exact",
      steps: [
        {
          kind: "hardware_trash",
          sourceCapabilityId: POWER_GRID_CAPABILITY_ID,
          credits: 1,
          currentLegalAction: { actionId: actions[1]!.actionId },
          hardwareTrashProjection: {
            kind: "installed_runner_hardware",
            targetKnowledge: "public_exact",
            eligibleTargetCount: 2,
            excludedSubtype: "cybernetics",
            minimumX: 0,
            selectedX: 1,
            legalMaximumX: 2,
            creditsPerX: 1,
            preventionKnowledge: "none_visible",
          },
        },
      ],
    });
    expect(
      route?.steps[0]?.hardwareTrashProjection?.eligibleTargetInstanceIds,
    ).toHaveLength(2);

    const playDecision = chooseCorpAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(playDecision.actionId).toBe(actions[1]!.actionId);
    expect(playDecision.fallbackUsed).toBe(false);
    state = applyDecision(state, playDecision);

    const choice = state.pendingChoice;
    expect(choice).toMatchObject({
      side: "corp",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "public",
    });
    expect(choice?.options).toHaveLength(2);
    const expectedOptionId = choice?.options
      .map((option) => option.id)
      .sort()[0];
    if (!expectedOptionId) throw new Error("Missing hardware choice option.");
    const choiceInput = decisionInput(state);
    expect(choiceInput.playerView.pendingChoice?.selectionOrdering).toBe(
      "ordered",
    );
    const choiceAction = choiceInput.legalActions.find(
      (action) => action.type === "resolve_choice",
    );
    if (!choice || !choiceAction) throw new Error("Missing hardware choice.");
    expect(
      selectedCorpHardwareTrashChoiceOptionIds(
        choiceInput,
        choiceAction,
        choice,
        choice.options,
      ),
    ).toEqual([expectedOptionId]);

    const choiceDecision = chooseCorpAction(decisionInput(state), {
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(decisionActionType(state, choiceDecision)).toBe("resolve_choice");
    expect(choiceDecision.selectedChoices).toEqual({
      choiceId: choice?.choiceId,
      selectedOptionIds: [expectedOptionId],
    });
    const hardwareBefore = state.runner.rig.hardware.length;
    state = applyDecision(state, choiceDecision);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.rig.hardware).toHaveLength(hardwareBefore - 1);
  });

  it("funds an exact one-credit gap under the punish parent, then re-quotes, plays and resolves the choice", () => {
    let state = powerGridState("power-grid-funding", 0, {
      hardware: [RD_INTERFACE, SIMPLE_HARDWARE],
    });
    const initialInput = decisionInput(state);
    expect(
      powerGridActions(initialInput.legalActions).map(
        (action) => action.payload?.hardwareTrashByCounterTrashCount,
      ),
    ).toEqual([0]);

    const initialQuoted = withDecisionLocalCorpPunishRouteQuotes(
      initialInput,
      (request) => quoteCorpPunishRoute(state, request),
    );
    const fundingRoute = powerGridRoute(initialQuoted);
    expect(fundingRoute).toMatchObject({
      complete: true,
      totalActionCredits: 1,
      responsePaymentEnvelope: {
        corpCreditsAvailable: 0,
        totalCorpCredits: { minimum: 1, maximum: 1 },
      },
      steps: [
        {
          kind: "hardware_trash",
          credits: 1,
          hardwareTrashProjection: {
            selectedX: 1,
            legalMaximumX: 1,
            eligibleTargetCount: 2,
          },
        },
      ],
    });
    expect(fundingRoute?.steps[0]).not.toHaveProperty("currentLegalAction");
    expect(
      fundingRoute?.requestEcho.steps[0]?.currentLegalActionId,
    ).toBeUndefined();

    const fundingDecision = chooseCorpAction(initialInput, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(decisionActionType(state, fundingDecision)).toBe("gain_credit");
    expect(fundingDecision.evidence).toContain(
      "plan_priority_delegated_from:plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
    );
    expect(JSON.stringify(fundingDecision.decisionDebug)).toContain(
      "|module:corp.punish_campaign|phase:fund",
    );
    state = applyDecision(state, fundingDecision);

    const fundedInput = decisionInput(state);
    const fundedActions = powerGridActions(fundedInput.legalActions);
    expect(
      fundedActions.map(
        (action) => action.payload?.hardwareTrashByCounterTrashCount,
      ),
    ).toEqual([0, 1]);
    const playDecision = chooseCorpAction(fundedInput, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(playDecision.actionId).toBe(fundedActions[1]!.actionId);
    state = applyDecision(state, playDecision);
    const choiceDecision = chooseCorpAction(decisionInput(state), {
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(decisionActionType(state, choiceDecision)).toBe("resolve_choice");
    expect(choiceDecision.selectedChoices?.selectedOptionIds).toHaveLength(1);
    state = applyDecision(state, choiceDecision);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("fails closed for no tag, no eligible target, stale state and visible trash prevention", () => {
    const untagged = powerGridState("power-grid-no-tag", 1, {
      hardware: [RD_INTERFACE],
      runnerTags: 0,
    });
    const untaggedCallback = vi.fn((request) =>
      quoteCorpPunishRoute(untagged, request),
    );
    expect(
      withDecisionLocalCorpPunishRouteQuotes(
        decisionInput(untagged),
        untaggedCallback,
      ).playerView.corpPunishRouteQuoteSet,
    ).toBeUndefined();
    expect(untaggedCallback).not.toHaveBeenCalled();

    const noTarget = powerGridState("power-grid-no-target", 1, {
      hardware: [CYBERNETICS],
    });
    const noTargetQuoted = withDecisionLocalCorpPunishRouteQuotes(
      decisionInput(noTarget),
      (request) => quoteCorpPunishRoute(noTarget, request),
    );
    expect(noTargetQuoted.playerView.corpPunishRouteQuoteSet).toMatchObject({
      complete: false,
      incompleteReasons: ["source_condition_unsatisfied"],
      routes: [],
    });

    const current = powerGridState("power-grid-stale", 1, {
      hardware: [RD_INTERFACE],
    });
    const [request] = buildBoundedCorpPunishRouteRequests(
      decisionInput(current),
    );
    if (!request) throw new Error("Missing Power Grid quote request.");
    expect(
      quoteCorpPunishRoute(current, {
        ...request,
        stateVersion: request.stateVersion - 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    const prevented = powerGridState("power-grid-prevention", 1, {
      hardware: [RD_INTERFACE],
      resources: [UMBRELLA_POLICY],
    });
    const preventedQuoted = withDecisionLocalCorpPunishRouteQuotes(
      decisionInput(prevented),
      (quoteRequest) => quoteCorpPunishRoute(prevented, quoteRequest),
    );
    expect(preventedQuoted.playerView.corpPunishRouteQuoteSet).toMatchObject({
      complete: false,
      incompleteReasons: ["trash_prevention_quote_incomplete"],
      routes: [],
    });

    const corrupted = powerGridState("power-grid-corrupt-target", 1, {
      hardware: [RD_INTERFACE],
    });
    const [corruptRequest] = buildBoundedCorpPunishRouteRequests(
      decisionInput(corrupted),
    );
    if (!corruptRequest) throw new Error("Missing corruption probe request.");
    corrupted.runner.rig.hardware.push(
      "missing-hardware-instance" as CardInstanceId,
    );
    expect(quoteCorpPunishRoute(corrupted, corruptRequest)).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["target_quote_incomplete"],
      },
    });
  });

  it.each([
    "current action drift",
    "capability drift",
    "target envelope drift",
  ] as const)("rejects %s at the actor-private DTO boundary", (drift) => {
    const state = powerGridState(`power-grid-dto-${drift}`, 3, {
      hardware: [RD_INTERFACE, SIMPLE_HARDWARE],
    });
    const input = decisionInput(state);
    const actions = powerGridActions(input.legalActions);
    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) => {
      const result = quoteCorpPunishRoute(state, request);
      if (!result.ok || !result.quote.complete) return result;
      const forged = structuredClone(result);
      const head = forged.quote.steps[0]!;
      if (drift === "current action drift") {
        head.currentLegalAction!.actionId = actions[2]!.actionId;
      } else if (drift === "capability drift") {
        head.sourceCapabilityId = "ability:on_play:0";
      } else {
        head.hardwareTrashProjection!.eligibleTargetCount += 1;
      }
      return forged;
    });
    expect(quoted.playerView.corpPunishRouteQuoteSet).toBeUndefined();
  });
});

function powerGridState(
  seed: string,
  corpCredits: number,
  options: {
    hardware: readonly string[];
    resources?: readonly string[];
    runnerTags?: number;
  },
): GameState {
  const setup = createGameAfterSetup({
    seed,
    agendaPointsToWin: 7,
    corpDeck: CORP_DECK,
    runnerDeck: RUNNER_DECK,
  });
  const state = applyLegal(
    setup,
    getLegalActions(setup, "corp").find(
      (action) => action.type === "mandatory_draw",
    ),
  );
  state.corp.hq.slice().forEach((cardId) => moveCorpCardToRd(state, cardId));
  moveCorpCardToHq(state, POWER_GRID);
  options.hardware.forEach((definitionId) =>
    installRunnerCard(state, definitionId, "hardware"),
  );
  options.resources?.forEach((definitionId) =>
    installRunnerCard(state, definitionId, "resource"),
  );
  state.corp.credits = corpCredits;
  state.runner.tags = options.runnerTags ?? 1;
  return state;
}

function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `power-grid-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "power-grid-quote-corp",
    ownDeckSnapshot: snapshot(CORP_DECK),
  });
}

function powerGridRoute(input: ReturnType<typeof decisionInput>) {
  return input.playerView.corpPunishRouteQuoteSet?.routes.find(
    (route) => route.steps[0]?.sourceCapabilityId === POWER_GRID_CAPABILITY_ID,
  );
}

function powerGridActions(actions: readonly LegalAction[]): LegalAction[] {
  return actions
    .filter(
      (action) =>
        action.type === "play_operation" &&
        Number.isSafeInteger(action.payload?.hardwareTrashByCounterTrashCount),
    )
    .sort(
      (left, right) =>
        Number(left.payload?.hardwareTrashByCounterTrashCount) -
        Number(right.payload?.hardwareTrashByCounterTrashCount),
    );
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  if (typeof decision.actionId !== "string") {
    throw new Error("Expected a direct LegalAction decision.");
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `corp:${state.stateVersion}:${decision.actionId}`,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function decisionActionType(
  state: GameState,
  decision: AiDecision,
): LegalAction["type"] | undefined {
  return getLegalActions(state, "corp").find(
    (action) => action.actionId === decision.actionId,
  )?.type;
}

function applyLegal(
  state: GameState,
  action: LegalAction | undefined,
): GameState {
  if (!action) throw new Error("Missing legal action.");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `corp:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function installRunnerCard(
  state: GameState,
  definitionId: string,
  zone: "hardware" | "resource",
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, instance]) => instance.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing Runner card ${definitionId}.`);
  const cardId = entry[0] as CardInstanceId;
  removeCardEverywhere(state, cardId);
  const target =
    zone === "hardware"
      ? state.runner.rig.hardware
      : state.runner.rig.resources;
  target.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return cardId;
}

function moveCorpCardToHq(state: GameState, definitionId: string): void {
  const entry = Object.entries(state.cardInstances).find(
    ([, instance]) => instance.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing Corp card ${definitionId}.`);
  const cardId = entry[0] as CardInstanceId;
  removeCardEverywhere(state, cardId);
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
}

function moveCorpCardToRd(state: GameState, cardId: CardInstanceId): void {
  removeCardEverywhere(state, cardId);
  state.corp.rd.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
}

function removeCardEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
}

function withCards(
  base: DeckDefinition,
  id: string,
  additions: readonly string[],
): DeckDefinition {
  return {
    ...base,
    id,
    name: id,
    cards: [
      ...base.cards,
      ...additions.map((cardId) => ({ id: cardId, quantity: 1 })),
    ],
  };
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

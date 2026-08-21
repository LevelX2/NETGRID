import {
  applyAction,
  createGame,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseCorpAction, chooseRunnerAction } from "../index";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import type { AiDeckStrategyProfile } from "../deck-doctrine-strategy";
import { corpUpgradePlacementExclusion } from "../runtime/corp-upgrade-placement";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { RealEngineFixtureBuilder } from "./real-engine-fixture-builder";

describe("hardened decision contracts on real Engine inputs", () => {
  beforeEach(() => {
    resetResidentPlanPortfolioMemory();
  });

  it("mulligans the historical non-executable Manhunt hand through the real setup contract", () => {
    let state = createGame({
      seed: "contract-manhunt-opening",
      agendaPointsToWin: 7,
      corpDeck: CORP_DECK,
    });
    state = apply(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    RealEngineFixtureBuilder.forState(state)
      .withCorpHqSize(0)
      .withCorpCardInHq("onr_v1_285_closed-accounts")
      .withCorpCardInHq("onr_v1_313_city-surveillance")
      .withCorpCardInHq("onr_v1_283_audit-of-call-records")
      .withCorpCardInHq("onr_v1_302_scorched-earth")
      .withCorpCardInHq("onr_v1_304_systematic-layoffs");
    const baseInput = decisionInput(state, "corp", CORP_DECK);
    const generatedStrategyProfile = (
      baseInput as typeof baseInput & {
        ownDeckStrategyProfile?: AiDeckStrategyProfile;
      }
    ).ownDeckStrategyProfile;
    const input = {
      ...baseInput,
      difficulty: "hard" as const,
      ownDeckStrategyProfile: {
        ...generatedStrategyProfile!,
        primaryStrategies: [
          "corp.fast_advance",
          "corp.tag_trace_punish",
          "corp.damage_kill",
        ],
        secondaryStrategies: [],
        warnings: [],
      },
    };

    const decision = chooseCorpAction(input);

    expect(input.playerView.pendingChoice?.source).toBe("setup.mulligan");
    expect(input.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(input.legalActions[0]?.actionId);
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["mulligan"],
    });
  });

  it("keeps a capability-recognized universal breaker without changing setup action ownership", () => {
    const state = createGame({
      seed: "contract-runner-capability-breaker-opening",
      agendaPointsToWin: 7,
      runnerDeck: RUNNER_CAPABILITY_OPENING_DECK,
    });
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip("onr_v1_039_krash")
      .withRunnerCardInGrip("onr_v1_080_core-command-jettison-ice")
      .withRunnerCardInGrip("onr_v1_105_priority-wreck")
      .withRunnerCardInGrip("onr_v1_165_junkyard-bbs")
      .withRunnerCardInGrip("onr_v1_145_wutech-mem-chip");
    const input = decisionInput(
      state,
      "runner",
      RUNNER_CAPABILITY_OPENING_DECK,
    );

    const decision = chooseRunnerAction(input);

    expect(input.playerView.pendingChoice).toMatchObject({
      source: "setup.mulligan",
      stateVersion: 0,
    });
    expect(input.legalActions).toHaveLength(1);
    expect(decision).toMatchObject({
      actionId: input.legalActions[0]?.actionId,
      reasonCode: "plan_first.engine_window",
      selectedChoices: {
        choiceId: input.playerView.pendingChoice?.choiceId,
        selectedOptionIds: ["keep"],
      },
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      lane: "engine_window",
      rootPlanInstanceId: "rules",
      leafExecutorInstanceId: "rules.window_resolution",
      engineWindowAction: {
        actionId: input.legalActions[0]?.actionId,
      },
    });
  });

  it("defers Rasmin until HQ has ICE, then admits its plan without overriding global defense", () => {
    const withoutIce = corpMainState("contract-rasmin-without-ice");
    RealEngineFixtureBuilder.forState(withoutIce)
      .withCorpHqSize(0)
      .withCorpCardInHq("onr_proteus_070_rasmin-bridger")
      .withCorpCredits(8);
    const withoutIceInput = decisionInput(withoutIce, "corp", CORP_DECK);
    const rasminWithoutIce = installAction(
      withoutIceInput,
      "onr_proteus_070_rasmin-bridger",
      "hq",
    );
    const deferred = chooseCorpAction(withoutIceInput);

    expect(deferred.actionId).not.toBe(rasminWithoutIce.actionId);
    expect(
      corpUpgradePlacementExclusion(
        upgradePlacementParams(withoutIceInput, rasminWithoutIce),
      ),
    ).toMatchObject({
      key: "corp_upgrade_ice_support_without_ice",
    });

    const withIce = corpMainState("contract-rasmin-with-ice");
    RealEngineFixtureBuilder.forState(withIce)
      .withCorpHqSize(0)
      .withCorpCardInHq("onr_proteus_070_rasmin-bridger")
      .withCorpIceOnServer("hq", "simple_barrier_ice")
      .withCorpIceOnServer("rd", "simple_code_gate_ice")
      .withCorpCredits(8);
    const withIceInput = decisionInput(withIce, "corp", CORP_DECK);
    const rasminWithIce = installAction(
      withIceInput,
      "onr_proteus_070_rasmin-bridger",
      "hq",
    );
    const eligible = chooseCorpAction(withIceInput);

    expect(
      withIceInput.legalActions.find(
        (action) => action.actionId === eligible.actionId,
      )?.type,
    ).toBe("draw_card");
    expect(eligible.actionId).not.toBe(rasminWithIce.actionId);
    expect(
      eligible.decisionDebug?.detailSections?.find(
        (section) => section.id === "plan_portfolio",
      )?.items,
    ).toContain(
      "plan:corp.defend_servers:server-defense-portfolio|evidence:corp_missing_concrete_defense_draw:rd|source:visible_state",
    );
  });

  it("allows Research Bunker placement only for an active Research agenda without granting free action authority", () => {
    const inactive = corpMainState("contract-region-inactive");
    RealEngineFixtureBuilder.forState(inactive)
      .withCorpHqSize(0)
      .withCorpCardInHq("onr_proteus_072_research-bunker")
      .withCorpRemoteRoot("remote_1", "onr_proteus_065_networked-center", 0, {
        faceup: true,
        rezzed: true,
      })
      .withCorpCredits(8);
    const inactiveInput = decisionInput(inactive, "corp", CORP_DECK);
    const inactiveInstall = installAction(
      inactiveInput,
      "onr_proteus_072_research-bunker",
      "remote_1",
    );
    const inactiveDecision = chooseCorpAction(inactiveInput);
    expect(inactiveDecision.actionId).not.toBe(inactiveInstall.actionId);
    expect(
      corpUpgradePlacementExclusion(
        upgradePlacementParams(inactiveInput, inactiveInstall),
      ),
    ).toMatchObject({
      key: "corp_upgrade_region_replacement_without_marginal_value",
    });

    const active = corpMainState("contract-region-active");
    RealEngineFixtureBuilder.forState(active)
      .withCorpHqSize(0)
      .withCorpCardInHq("onr_proteus_072_research-bunker")
      .withCorpRemoteRoot("remote_1", "onr_proteus_065_networked-center", 0, {
        faceup: true,
        rezzed: true,
      })
      .withCorpRemoteRoot("remote_1", "onr_proteus_001_ai-board-member", 0, {
        faceup: true,
        rezzed: false,
      })
      .withCorpCredits(8);
    const activeInput = decisionInput(active, "corp", CORP_DECK);
    const activeInstall = installAction(
      activeInput,
      "onr_proteus_072_research-bunker",
      "remote_1",
    );
    const activeDecision = chooseCorpAction(activeInput);
    expect(activeDecision.actionId).not.toBe(activeInstall.actionId);
    expect(
      corpUpgradePlacementExclusion(
        upgradePlacementParams(activeInput, activeInstall),
      ),
    ).toBeUndefined();
    expect(
      activeDecision.decisionDebug?.actionAlternatives
        ?.find((entry) => entry.actionId === activeInstall.actionId)
        ?.whyNot?.some((entry) =>
          entry.startsWith("explicitly_nonproductive:"),
        ),
    ).toBe(true);
  });

  it("resolves the mandatory-draw Strategic Planning Group choice through the Corp hand plan", () => {
    let state = createGameAfterSetup({
      seed: "contract-strategic-planning-group-mandatory-draw",
      agendaPointsToWin: 7,
      corpDeck: CORP_DECK,
    });
    RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot(
      "remote_1",
      "onr_classic_025_strategic-planning-group",
      0,
      { faceup: true, rezzed: true },
    );
    const retainedAgendaId = putCorpCardOnTopOfRd(state, "simple_agenda");
    const drawnOperationId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const input = decisionInput(state, "corp", CORP_DECK);

    expect(input.playerView.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_cards",
      source: expect.stringMatching(
        /^card_implementation\.strategic_planning_group_draw:/,
      ),
    });
    expect(
      input.playerView.pendingChoice?.options.map((option) => option.value),
    ).toEqual(expect.arrayContaining([retainedAgendaId, drawnOperationId]));

    const decision = chooseCorpAction(input);
    expect(decision).toMatchObject({
      actionId: input.legalActions[0]?.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.hand_and_agenda_management",
        "plan_step_capability:draw_filter_window",
      ]),
    );
    const selectedOptionIds = Array.isArray(
      decision.selectedChoices?.selectedOptionIds,
    )
      ? decision.selectedChoices.selectedOptionIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const selectedOption = input.playerView.pendingChoice?.options.find(
      (option) => selectedOptionIds.includes(option.id),
    );
    expect([retainedAgendaId, drawnOperationId]).toContain(
      selectedOption?.value,
    );
    const selectedCardId = String(selectedOption?.value);
    const retainedCardId =
      selectedCardId === retainedAgendaId ? drawnOperationId : retainedAgendaId;

    state = applyDecision(state, "corp", decision);
    expect(state.corp.rd.at(-1)).toBe(selectedCardId);
    expect(state.corp.hq).toContain(retainedCardId);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("keeps the Corporate Shuffle draw filter and follow-up HQ choice in the exact Corp hand-plan sequence", () => {
    let state = createGameAfterSetup({
      seed: "contract-strategic-planning-group-corporate-shuffle",
      agendaPointsToWin: 7,
      corpDeck: CORP_DECK,
    });
    RealEngineFixtureBuilder.forState(state).withCorpCardInHq(
      "onr_classic_017_corporate-shuffle",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot(
      "remote_1",
      "onr_classic_025_strategic-planning-group",
      0,
      { faceup: true, rezzed: true },
    );
    state.corp.maxHandSize = 100;
    const corporateShuffleId = state.corp.hq.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_classic_017_corporate-shuffle",
    );
    expect(corporateShuffleId).toBeDefined();

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.source === corporateShuffleId,
    );
    const drawFilterInput = decisionInput(state, "corp", CORP_DECK);
    expect(drawFilterInput.playerView.pendingChoice).toMatchObject({
      source: expect.stringMatching(
        /^card_implementation\.strategic_planning_group_draw:/,
      ),
    });
    expect(drawFilterInput.playerView.pendingChoice?.options).toHaveLength(6);

    const drawFilterDecision = chooseCorpAction(drawFilterInput);
    expect(drawFilterDecision).toMatchObject({
      actionId: drawFilterInput.legalActions[0]?.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(drawFilterDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.hand_and_agenda_management",
        "plan_step_capability:draw_filter_window",
      ]),
    );
    expect(
      drawFilterDecision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.hand_and_agenda_management",
      executionState: "executor",
    });

    state = applyDecision(state, "corp", drawFilterDecision);
    const hqShuffleInput = decisionInput(state, "corp", CORP_DECK);
    expect(hqShuffleInput.playerView.pendingChoice?.source).toMatch(
      /^classic\.corporate_shuffle_hq_to_rd:/,
    );
    const hqShuffleDecision = chooseCorpAction(hqShuffleInput);
    expect(hqShuffleDecision).toMatchObject({
      actionId: hqShuffleInput.legalActions[0]?.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(hqShuffleDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.hand_and_agenda_management",
        "plan_step_capability:hq_shuffle_window",
      ]),
    );
    expect(
      hqShuffleDecision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.hand_and_agenda_management",
      executionState: "executor",
    });

    state = applyDecision(state, "corp", hqShuffleDecision);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("installs missing Code Gate coverage before a second Wall-breaker variant", () => {
    const state = runnerTurnState("contract-breaker-variant");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(0)
      .withRunnerCredits(10)
      .withRunnerProgramInstalled("onr_v1_047_pile-driver")
      .withRunnerCardInGrip("onr_v1_021_dwarf")
      .withRunnerCardInGrip("onr_v1_016_cyfermaster")
      .withRezzedCorpIceOnServer("rd", "simple_code_gate_ice");
    const input = decisionInput(state, "runner", RUNNER_DECK);
    const cyfermaster = installAction(input, "onr_v1_016_cyfermaster");
    const dwarf = installAction(input, "onr_v1_021_dwarf");
    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe(cyfermaster.actionId);
    expect(decision.actionId).not.toBe(dwarf.actionId);
  });
});

const CORP_DECK = deck(DEMO_DECKS.demo_corp_001, "contract-corp-deck", [
  "onr_proteus_070_rasmin-bridger",
  "onr_proteus_065_networked-center",
  "onr_proteus_072_research-bunker",
  "onr_proteus_001_ai-board-member",
  "onr_v1_285_closed-accounts",
  "onr_v1_313_city-surveillance",
  "onr_v1_283_audit-of-call-records",
  "onr_v1_302_scorched-earth",
  "onr_v1_304_systematic-layoffs",
  "onr_classic_025_strategic-planning-group",
  "onr_classic_017_corporate-shuffle",
]);
const RUNNER_DECK = deck(DEMO_DECKS.demo_runner_001, "contract-runner-deck", [
  "onr_v1_047_pile-driver",
  "onr_v1_021_dwarf",
  "onr_v1_016_cyfermaster",
]);
const RUNNER_CAPABILITY_OPENING_DECK: DeckDefinition = {
  id: "contract-runner-capability-opening-deck",
  name: "contract-runner-capability-opening-deck",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_039_krash", quantity: 2 },
    { id: "onr_v1_080_core-command-jettison-ice", quantity: 1 },
    { id: "onr_v1_105_priority-wreck", quantity: 1 },
    { id: "onr_v1_165_junkyard-bbs", quantity: 1 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 1 },
  ],
};

function corpMainState(seed: string): GameState {
  return apply(
    createGameAfterSetup({ seed, agendaPointsToWin: 7, corpDeck: CORP_DECK }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
}

function runnerTurnState(seed: string): GameState {
  let state = apply(
    createGameAfterSetup({
      seed,
      agendaPointsToWin: 7,
      runnerDeck: RUNNER_DECK,
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state = apply(state, "corp", (action) => action.type === "end_turn");
  while (state.pendingChoice?.side === "corp") {
    state = apply(state, "corp", (action) => action.type === "resolve_choice");
  }
  return state;
}

function decisionInput(state: GameState, side: Side, ownDeck: DeckDefinition) {
  return buildAiDecisionInput(state, side, {
    decisionId: `decision-contract:${state.matchId}:${state.stateVersion}`,
    profileId: `decision-contract-${side}`,
    ownDeckSnapshot: snapshot(ownDeck),
  });
}

function installAction(
  input: ReturnType<typeof decisionInput>,
  definitionId: string,
  serverId?: string,
): LegalAction {
  const card = input.playerView.own.gripOrHq.find(
    (candidate) => candidate.definitionId === definitionId,
  );
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "install_card" &&
      candidate.payload?.cardId === card?.instanceId &&
      (serverId === undefined || candidate.payload?.serverId === serverId),
  );
  if (!action) {
    throw new Error(
      `Missing install action for ${definitionId} on ${serverId ?? "runner rig"}: ${JSON.stringify({ card, legalActions: input.legalActions })}`,
    );
  }
  return action;
}

function upgradePlacementParams(
  input: ReturnType<typeof decisionInput>,
  action: LegalAction,
) {
  const cardId = action.payload?.cardId;
  const sourceCard = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === cardId,
  );
  const candidate = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  })[0];
  return {
    input,
    action,
    roles: [],
    actionSemanticCandidate: candidate,
    sourceCard,
    serverId:
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
  };
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error(`Missing ${side} fixture action`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(action.type === "resolve_choice" && state.pendingChoice
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice.choiceId,
            selectedOptionIds: [String(state.pendingChoice.options[0]?.id)],
          },
        }
      : {}),
    idempotencyKey: `${side}:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyDecision(
  state: GameState,
  side: Side,
  decision: ReturnType<typeof chooseCorpAction>,
): GameState {
  if (!decision.actionId) throw new Error("AI decision has no actionId");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
    idempotencyKey: `${side}:${state.stateVersion}:${decision.actionId}:ai`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function putCorpCardOnTopOfRd(state: GameState, definitionId: string): string {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing ${definitionId}`);
  const [id, card] = entry;
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...card,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function deck(
  base: DeckDefinition,
  id: string,
  additions: string[],
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

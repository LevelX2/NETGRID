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
import { resetTacticalPlanMemory } from "../tactical-plans";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { RealEngineFixtureBuilder } from "./real-engine-fixture-builder";

describe("hardened decision contracts on real Engine inputs", () => {
  beforeEach(() => {
    resetTacticalPlanMemory();
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
      "plan:corp.defend_servers:server-defense-portfolio|evidence:corp_defense_support_install:hq:corp_upgrade_install_placement_fit:reserve_after_action:0|source:visible_state",
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
        ?.whyNot?.some((entry) => entry.startsWith("not_selected_by_plan:")),
    ).toBe(true);
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
]);
const RUNNER_DECK = deck(DEMO_DECKS.demo_runner_001, "contract-runner-deck", [
  "onr_v1_047_pile-driver",
  "onr_v1_021_dwarf",
  "onr_v1_016_cyfermaster",
]);

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

import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type StateHash,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  publicContextForAction,
  type PublicContextForActionDependencies,
} from "../../public-context";
import { createGame } from "../create-game";
import { buildEventWithHost, type BuildEventHost } from "./build-event";

const WEB_AI_CONTRACT_FIELDS = [
  "actor",
  "actionType",
  "label",
  "sourceDefinitionId",
  "targetCardDefinitionId",
  "serverLabel",
  "hiddenZoneAction",
  "temporaryCreditsProvided",
  "temporaryCreditsSpent",
  "temporaryCreditsRemaining",
  "damageResolved",
  "damageType",
  "traceId",
  "randomPurpose",
] as const;

describe("PublicContext golden payload gate", () => {
  it("pins final BuildEvent base, action identity, run, encounter and ice fields", () => {
    const previous = goldenState("public-context-base-event");
    previous.runner.clicks = 4;
    const next = structuredClone(previous);
    next.stateVersion = previous.stateVersion + 1;
    const run: NonNullable<GameState["run"]> = {
      runId: "run_public_context_golden",
      attackedServerId: "rd",
      phase: "approach_ice",
      accessCount: 3,
      position: { kind: "server", serverId: "rd" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
    };
    next.run = run;
    const legalAction = goldenAction({
      actionId: "golden:start_run:rd",
      side: "runner",
      type: "start_run",
      label: "Run on R&D",
      costs: [{ clicks: 1 }],
      payload: {
        serverId: "rd",
        targetIceDefinitionId: "simple_agenda",
        encounterTaxSource: "onr_v1_222_ball-and-chain",
      },
    });

    const event = buildEventWithHost(
      buildEventHost(),
      previous.stateVersion,
      next.stateVersion,
      "fnv1a:public-context-golden" as StateHash,
      previous,
      next,
      legalAction,
      playerActionFor(previous, legalAction),
    );

    expectGoldenPayload(event.publicPayload, {
      actionCostClicks: 1,
      actionType: "start_run",
      actor: "runner",
      baseAccessCount: 2,
      effectiveAccessCount: 3,
      effectKind: "run",
      installedAccessBonus: 1,
      label: "Run on R&D",
      runPhase: "approach_ice",
      serverLabel: "R&D",
      targetIceDefinitionId: "simple_agenda",
      targets: {
        serverLabel: "R&D",
        targetIceDefinitionId: "simple_agenda",
      },
      turnActionOrdinalEnd: 1,
      turnActionOrdinalStart: 1,
      visibility: {
        class: "public",
      },
    });
  });

  it("pins card source, target, access, breach, steal and trash context fields", () => {
    const state = goldenState("public-context-access");
    addCorpRootCard(state, "corp_root_agenda", "simple_agenda", "remote_1");
    const context = goldenContext(
      state,
      goldenAction({
        actionId: "golden:access-card:root",
        side: "runner",
        type: "access_card",
        label: "Access remote root",
        payload: {
          accessedCardId: "corp_root_agenda",
          ambushDefinitionId: "simple_agenda",
          baseAccessCount: 1,
          cardDefinitionId: "simple_agenda",
          effectiveAccessCount: 2,
          installedAccessBonus: 1,
          publicRevealDefinitionId: "simple_agenda",
          publicRevealKind: "breach",
          serverId: "remote_1",
          sourceDefinitionId: "simple_economy_event",
          stealCost: 2,
          targetCardDefinitionId: "simple_agenda",
          targetIceDefinitionId: "simple_agenda",
          trashCostPaid: 3,
        },
      }),
    );

    expectGoldenPayload(context, {
      accessedArea: "root",
      accessedCardPositionKey: "root:0",
      accessedIndex: 0,
      ambushDefinitionId: "simple_agenda",
      baseAccessCount: 1,
      cardDefinitionId: "simple_agenda",
      effectiveAccessCount: 2,
      installedAccessBonus: 1,
      publicRevealDefinitionId: "simple_agenda",
      publicRevealKind: "breach",
      revealKind: "breach",
      serverLabel: "Remote 1",
      sourceDefinitionId: "simple_economy_event",
      stealCost: 2,
      targetCardDefinitionId: "simple_agenda",
      targetIceDefinitionId: "simple_agenda",
    });
  });

  it("exposes runner event runs as public chronicle context", () => {
    const state = goldenState("public-context-runner-event-run");
    addCorpRootCard(state, "corp_root_remote_1", "simple_agenda", "remote_1");
    const context = goldenContext(
      state,
      goldenAction({
        actionId: "golden:play-event:run",
        side: "runner",
        type: "play_event",
        label: "Disgruntled Ice Technician auf Remote 1",
        source: "runner_event",
        payload: {
          cardId: "runner_event",
          runnerEventRun: true,
          serverId: "remote_1",
        },
      }),
    );

    expectGoldenPayload(context, {
      runnerEventRun: true,
      serverLabel: "Remote 1",
    });
  });

  it("pins trace context and trace-success follow-up fields", () => {
    const context = goldenContext(
      goldenState("public-context-trace"),
      goldenAction({
        actionId: "golden:resolve-choice:trace",
        side: "corp",
        type: "resolve_choice",
        label: "Resolve trace",
        payload: {
          baseLinkUsed: true,
          baseLinkValue: 1,
          baseTraceStrength: 4,
          choiceId: "trace_golden_choice",
          choiceKind: "select_option",
          choiceVisibility: "public",
          corpBid: 2,
          corpBidMax: 5,
          creditsGained: 1,
          damageCannotBePrevented: true,
          runnerBid: 1,
          runnerLink: 2,
          sourceDefinitionId: "simple_agenda",
          tagsAdded: 1,
          traceBaseLinkCostPaid: 1,
          traceBaseLinkSourceDefinitionId: "simple_economy_event",
          traceBidLimit: 6,
          traceId: "trace_public_context_golden",
          traceStep: "result",
          traceSuccessEffect: "tag",
          traceSuccessful: true,
          trashedCardDefinitionId: "simple_economy_event",
          trashedCardType: "program",
        },
      }),
    );

    expectGoldenPayload(context, {
      baseLinkUsed: true,
      baseLinkValue: 1,
      baseTraceStrength: 4,
      choiceId: "trace_golden_choice",
      choiceKind: "select_option",
      corpBid: 2,
      corpBidMax: 5,
      creditsGained: 1,
      damageCannotBePrevented: true,
      runnerBid: 1,
      runnerLink: 2,
      sourceDefinitionId: "simple_agenda",
      tagsAdded: 1,
      traceBaseLinkCostPaid: 1,
      traceBaseLinkSourceDefinitionId: "simple_economy_event",
      traceBidLimit: 6,
      traceId: "trace_public_context_golden",
      traceStep: "result",
      traceSuccessEffect: "tag",
      traceSuccessful: true,
      trashedCardDefinitionId: "simple_economy_event",
      trashedCardType: "program",
    });
  });

  it("pins damage, prevention, replacement and flatline context fields", () => {
    const context = goldenContext(
      goldenState("public-context-damage"),
      goldenAction({
        actionId: "golden:resolve-choice:damage",
        side: "runner",
        type: "resolve_choice",
        label: "Resolve damage prevention",
        payload: {
          affectedSide: "runner",
          baseDamageAmount: 3,
          cardsTrashed: 2,
          choiceId: "damage_replacement_golden_choice",
          choiceKind: "select_option",
          choiceVisibility: "public",
          damageAmount: 2,
          damageResolved: true,
          damageType: "net",
          eventModificationKind: "damage",
          eventModificationOutcome: "opened",
          eventModificationWindowId: "event_modification_golden",
          eventModificationWindowOpened: true,
          finalAmount: 2,
          flatline: false,
          originalEventId: "event_damage_original",
          originalEventType: "damage",
          preventableDamage: true,
          preventedAmount: 1,
          replacementCandidateCount: 1,
          replacementOutcome: "declined",
          replacementWindowId: "replacement_golden",
          replacementWindowOpened: true,
          unpreventableDamage: false,
        },
      }),
    );

    expectGoldenPayload(context, {
      affectedSide: "runner",
      baseDamageAmount: 3,
      cardsTrashed: 2,
      choiceId: "damage_replacement_golden_choice",
      choiceKind: "select_option",
      damageAmount: 2,
      damageResolved: true,
      damageType: "net",
      eventModificationKind: "damage",
      eventModificationOutcome: "opened",
      eventModificationWindowId: "event_modification_golden",
      eventModificationWindowOpened: true,
      finalAmount: 2,
      flatline: false,
      candidateCount: undefined,
      imminentEventId: undefined,
      imminentEventType: undefined,
      originalEventId: "event_damage_original",
      originalEventType: "damage",
      preventableDamage: true,
      preventedAmount: 1,
      redactedKind: "replacement",
      replacementCandidateCount: 1,
      replacementOutcome: "declined",
      replacementWindowId: "replacement_golden",
      replacementWindowOpened: true,
      unpreventableDamage: false,
    });
  });

  it("pins hidden-zone, search, arrange, nonsearch and temporary-credit fields", () => {
    const context = goldenContext(
      goldenState("public-context-hidden-zone"),
      goldenAction({
        actionId: "golden:hidden-zone:search",
        side: "runner",
        type: "resolve_choice",
        label: "Resolve hidden-zone search",
        payload: {
          arrangedCount: 2,
          choiceKind: "select_cards",
          choiceVisibility: "hidden_info_barrier",
          hiddenZoneAction: "search_stack",
          hiddenZoneBarrier: true,
          privateLookCount: 3,
          privateLookZone: "hq",
          randomCounterAfter: 8,
          randomDrawRecordPurpose: "v190.random.golden.hq_discard",
          redactedKind: "hidden_zone",
          searchDestination: "grip",
          searchReveal: "public",
          selectedCount: 1,
          shownCardDefinitionIds: "simple_economy_event|simple_agenda",
          temporaryCreditsProvided: 9,
          temporaryCreditsRemaining: 5,
          temporaryCreditsSpent: 4,
        },
      }),
    );

    expectGoldenPayload(context, {
      arrangedCount: 2,
      choiceKind: "select_cards",
      choiceVisibility: "hidden_info_barrier",
      hiddenZoneAction: "search_stack",
      hiddenZoneBarrier: true,
      privateLookCount: 3,
      privateLookZone: "hq",
      randomCounterAfter: 8,
      randomDrawRecordPurpose: "v190.random.golden.hq_discard",
      redactedKind: "hidden_zone",
      searchDestination: "grip",
      searchReveal: "public",
      selectedCount: 1,
      shownCardDefinitionIds: "simple_economy_event|simple_agenda",
      temporaryCreditsProvided: 9,
      temporaryCreditsRemaining: 5,
      temporaryCreditsSpent: 4,
    });
  });

  it("pins special-zone and control-change context fields", () => {
    const setAsideContext = goldenContext(
      goldenState("public-context-special-zone"),
      goldenAction({
        actionId: "golden:special-zone:set-aside",
        side: "corp",
        type: "move_to_set_aside",
        label: "Move to set aside",
        payload: {
          specialZone: "set_aside",
          specialZoneReason: "onr_v1_101_mit_west_tier",
          specialZoneVisibility: "side_private",
        },
      }),
    );
    const controlContext = goldenContext(
      goldenState("public-context-control-change"),
      goldenAction({
        actionId: "golden:control-change",
        side: "runner",
        type: "change_card_control",
        label: "Change control",
        payload: {
          controlChangeReason: "golden_control_change",
          newController: "runner",
          oldController: "corp",
        },
      }),
    );

    expectGoldenPayload(setAsideContext, {
      redactedKind: "special_zone",
      specialZone: "set_aside",
      specialZoneReason: "onr_v1_101_mit_west_tier",
      specialZoneVisibility: "side_private",
    });
    expectGoldenPayload(controlContext, {
      controlChangeReason: "golden_control_change",
      newController: "runner",
      oldController: "corp",
      ownershipChanged: false,
      redactedKind: "control_change",
    });
  });

  it("pins public choice, secret-spend and Secret Spend Compare fields", () => {
    const context = goldenContext(
      goldenState("public-context-secret-choice"),
      goldenAction({
        actionId: "golden:resolve-choice:secret-spend",
        side: "runner",
        type: "resolve_choice",
        label: "Reveal secret spend",
        payload: {
          choiceId: "secret_spend_compare_golden",
          choiceKind: "select_option",
          choiceVisibility: "public",
          secretSpendCorp: 1,
          secretSpendRevealed: true,
          secretSpendRunner: 2,
          sourceDefinitionId: "onr_v1_272_too-many-doors",
          secretSpendEndRun: true,
        },
      }),
    );

    expectGoldenPayload(context, {
      choiceId: "secret_spend_compare_golden",
      choiceKind: "select_option",
      secretSpendCorp: 1,
      secretSpendRevealed: true,
      secretSpendRunner: 2,
      sourceDefinitionId: "onr_v1_272_too-many-doors",
      secretSpendEndRun: true,
    });
  });

  it("pins CardImplementation, legacy ability, payment, hosted-credit and random fields", () => {
    const context = goldenContext(
      goldenState("public-context-legacy-random"),
      goldenAction({
        actionId: "golden:legacy:random",
        side: "runner",
        type: "install_card",
        label: "Resolve legacy ability",
        payload: {
          agendaAbility: "v1919_scored_agenda_reveal_rd_top",
          cardImplementationAbility: "golden_card_implementation",
          cardImplementationAbilityIndex: 1,
          cardImplementationAbilityTiming: "paid_ability",
          corpCreditsAfter: 7,
          gainedCredits: 3,
          hostedCreditsAfter: 2,
          randomCounterAfter: 15,
          randomPurpose: "v1921.die.public-context-golden",
          recurringCreditsLoaded: 2,
          resourceAbility: "short_term_contract",
          runnerCreditsAfter: 9,
          sourceDefinitionId: "simple_economy_event",
          sourceTrashed: true,
          targetCardDefinitionId: "simple_agenda",
          targetIceDefinitionId: "simple_agenda",
          v1917AssetAbility: "spinn_public_relations",
          v1919RunnerEventAbility: "future_agenda_point_forfeit",
          v1920AssetAbility: "newsgroup_taunting",
          v1921DieRoll: 4,
          v1921RunnerProgramAbility: "ai_boon",
          v1921RunnerResourceAbility: "quest_for_cattekin",
          runnerUtilityAbility: "trash_fully_broken_passed_ice",
          sourceAbilityExhausted: true,
        },
      }),
    );

    expectGoldenPayload(context, {
      agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      cardImplementationAbility: "golden_card_implementation",
      cardImplementationAbilityIndex: 1,
      cardImplementationAbilityTiming: "paid_ability",
      corpCreditsAfter: 7,
      gainedCredits: 3,
      hostedCreditsAfter: 2,
      randomCounterAfter: 15,
      randomPurpose: "v1921.die.public-context-golden",
      recurringCreditsLoaded: 2,
      resourceAbility: "short_term_contract",
      runnerCreditsAfter: 9,
      sourceDefinitionId: "simple_economy_event",
      sourceTrashed: true,
      targetCardDefinitionId: "simple_agenda",
      targetIceDefinitionId: "simple_agenda",
      v1917AssetAbility: "spinn_public_relations",
      v1919RunnerEventAbility: "future_agenda_point_forfeit",
      v1920AssetAbility: "newsgroup_taunting",
      v1921DieRoll: 4,
      v1921RunnerProgramAbility: "ai_boon",
      v1921RunnerResourceAbility: "quest_for_cattekin",
      runnerUtilityAbility: "trash_fully_broken_passed_ice",
      sourceAbilityExhausted: true,
      zoneLabel: "Rig",
    });
  });

  it("keeps Web, Chronicle and AI DTO contract fields represented by the golden set", () => {
    // Fields read by Chronicle/ActionBoard/AI DTO; keep in sync with STATUS-8.
    const pinned = new Set([
      ...Object.keys(
        goldenContext(
          goldenState("public-context-contract-hidden-zone"),
          goldenAction({
            actionId: "golden:contract:hidden-zone",
            side: "runner",
            type: "resolve_choice",
            label: "Contract hidden-zone field list",
            payload: {
              choiceKind: "select_cards",
              hiddenZoneAction: "search_stack",
              hiddenZoneBarrier: true,
              temporaryCreditsProvided: 1,
              temporaryCreditsRemaining: 0,
              temporaryCreditsSpent: 1,
            },
          }),
        ),
      ),
      ...Object.keys(
        goldenContext(
          goldenState("public-context-contract-trace-damage"),
          goldenAction({
            actionId: "golden:contract:trace-damage",
            side: "corp",
            type: "resolve_choice",
            label: "Contract trace damage field list",
            payload: {
              choiceKind: "select_option",
              damageResolved: true,
              damageType: "net",
              sourceDefinitionId: "simple_agenda",
              targetCardDefinitionId: "simple_economy_event",
              traceId: "trace_contract_golden",
            },
          }),
        ),
      ),
      ...Object.keys(
        buildEventWithHost(
          buildEventHost(),
          1,
          2,
          "fnv1a:contract-golden" as StateHash,
          goldenState("public-context-contract-before"),
          goldenState("public-context-contract-after"),
          goldenAction({
            actionId: "golden:contract:random",
            side: "runner",
            type: "trigger_ability",
            label: "Contract random field list",
            payload: {
              randomPurpose: "v1921.die.contract",
              serverLabel: "HQ",
              sourceDefinitionId: "simple_economy_event",
              v1921DieRoll: 2,
              v1921RunnerProgramAbility: "ai_boon",
            },
          }),
          {
            matchId: "match_public_context_contract",
            side: "runner",
            actionId: "golden:contract:random",
            clientKnownStateVersion: 1,
          },
        ).publicPayload,
      ),
    ]);

    for (const field of WEB_AI_CONTRACT_FIELDS) {
      expect(pinned.has(field), field).toBe(true);
    }
  });
});

function goldenState(seed: string): GameState {
  return createGame({ seed, setupMode: "completed" });
}

function goldenAction(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "golden:action",
    side: "runner",
    type: "trigger_ability",
    label: "Golden action",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}

function goldenContext(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  return publicContextForAction(state, legalAction, goldenDeps());
}

function buildEventHost(): BuildEventHost {
  return {
    publicContext: {
      publicContextForAction,
      deps: goldenDeps({
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 1,
      }),
    },
    constants: {
      badPublicityLossThreshold: 7,
    },
  };
}

function goldenDeps(
  overrides: Partial<PublicContextForActionDependencies> = {},
): PublicContextForActionDependencies {
  return {
    agendaPointsForScoredCard: () => 2,
    cardCounter: () => 0,
    cardStrengthModifier: () => 0,
    creditCostForAction: () => 0,
    definitionFor: (state, id) => definitionFor(state, id),
    pumpAmountForLegalAction: () => 0,
    runnerHqAccessBonus: () => 0,
    v1915InstalledAccessBonus: () => 0,
    ...overrides,
  };
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const definitionId = state.cardInstances[id]?.definitionId ?? id;
  const definition = DEMO_CARDS_BY_ID[definitionId];
  if (!definition) throw new Error(`Missing test definition: ${definitionId}`);
  return definition;
}

function addCorpRootCard(
  state: GameState,
  cardId: CardInstanceId,
  definitionId: string,
  serverId: "remote_1",
): void {
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    state.corp.servers.push({
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [cardId],
    });
    return;
  }
  server.root = [cardId, ...server.root.filter((id) => id !== cardId)];
}

function playerActionFor(
  state: GameState,
  legalAction: LegalAction,
): PlayerAction {
  return {
    matchId: state.matchId,
    side: legalAction.side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}

function expectGoldenPayload(
  payload: Record<string, unknown>,
  expected: Record<string, unknown>,
): void {
  expectPublicPayloadIsSideSafe(payload);
  expect(Object.keys(payload).sort()).toEqual(Object.keys(expected).sort());
  expect(stablePayloadSnapshot(payload)).toEqual(stablePayloadSnapshot(expected));
}

function stablePayloadSnapshot(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map((entry) => stablePayloadSnapshot(entry));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stablePayloadSnapshot(entry)]),
  );
}

function expectPublicPayloadIsSideSafe(payload: Record<string, unknown>): void {
  const keys = collectObjectKeys(payload);
  for (const forbidden of [
    "privatePayload",
    "cardInstances",
    "fullGameState",
    "decklist",
    "deckList",
    "deckContents",
    "opponentHand",
    "opponentHq",
    "hqContents",
    "rdContents",
    "rndContents",
    "stackContents",
    "handContents",
    "sessionToken",
    "reconnectToken",
    "joinToken",
    "tokenHash",
  ]) {
    expect(keys.has(forbidden), forbidden).toBe(false);
  }
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) collectObjectKeys(entry, keys);
    return keys;
  }
  if (!isPlainObject(value)) return keys;
  for (const [key, entry] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(entry, keys);
  }
  return keys;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

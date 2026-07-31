import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import { expect } from "vitest";
import { evaluateRunnerHandDevelopment } from "./runner-hand-development";
import {
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
  type RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
import type { DeckCapabilityProfile } from "./deck-capabilities";

export function runnerInput(params: {
  credits: number;
  clicks?: number;
  hand: VisibleCard[];
  heap?: VisibleCard[];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  memoryUsed?: number;
  memoryLimit?: number;
  servers?: PlayerView["servers"];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: params.clicks ?? 3,
      agendaPoints: 0,
      gripOrHq: params.hand,
      stackOrRdCount: 20,
      heapOrArchives: params.heap ?? [],
      scoreArea: [],
      rig: params.rig ?? [],
      ...(params.memoryUsed !== undefined
        ? { memoryUsed: params.memoryUsed }
        : {}),
      ...(params.memoryLimit !== undefined
        ? { memoryLimit: params.memoryLimit }
        : {}),
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers ?? [],
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-hand-development-test",
    decisionId: "runner-hand-development-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

export function breakerVariantDeckCapabilities(): DeckCapabilityProfile {
  const state = (coverage: string, installed: boolean) => ({
    coverage,
    inDeckKnown: true,
    inHand: false,
    installed,
    searchableNow: false,
    drawOnly: false,
    missing: false,
    bestKnownCards: [],
    blockers: [],
  });
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [
        {
          cardId: "onr_v1_021_dwarf",
          title: "Dwarf",
          coverage: ["wall"],
          breakCost: 1,
          pumpCost: 1,
          risks: [],
          restrictions: [],
          quantityKnownInDeck: 2,
          locations: ["in_hand"],
          confidence: "high",
          evidence: ["test_deck_variant"],
        },
        {
          cardId: "onr_v1_047_pile-driver",
          title: "Pile Driver",
          coverage: ["wall"],
          breakCost: 3,
          pumpCost: 1,
          risks: ["stealth_loss"],
          restrictions: [],
          quantityKnownInDeck: 2,
          locations: ["installed"],
          confidence: "high",
          evidence: ["test_deck_variant"],
        },
      ],
      breakerCoverageMatrix: {
        wall: state("wall", true),
        code_gate: state("code_gate", true),
        sentry: state("sentry", true),
        ap: state("ap", false),
        trace: state("trace", false),
        universal: state("universal", false),
        subtype_limited: state("subtype_limited", false),
        special: state("special", false),
      },
      searchAccess: {
        tools: [],
        canSearchProgramsNow: false,
        canSearchBreakersNow: false,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryUsed: 1,
        memoryLimit: 4,
        memoryAvailable: 3,
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 0,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 2,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test_breaker_variant_profile"],
  } as DeckCapabilityProfile;
}

export function strategicIntent(
  overrides: Partial<
    Pick<
      RunnerStrategicIntentProfile,
      | "executionStyle"
      | "setupEngine"
      | "pressureVectors"
      | "engineProviders"
      | "engineDependencies"
      | "engineLineIds"
      | "developmentTendencies"
      | "planContributions"
    >
  > = {},
): RunnerStrategicIntentProfile {
  return {
    schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
    side: "runner",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "runner.steal_agendas_default",
    ...(overrides.executionStyle
      ? { executionStyle: overrides.executionStyle }
      : {}),
    setupEngine: overrides.setupEngine ?? [],
    ...(overrides.engineProviders
      ? { engineProviders: overrides.engineProviders }
      : {}),
    ...(overrides.engineDependencies
      ? { engineDependencies: overrides.engineDependencies }
      : {}),
    ...(overrides.engineLineIds
      ? { engineLineIds: overrides.engineLineIds }
      : {}),
    ...(overrides.developmentTendencies
      ? { developmentTendencies: overrides.developmentTendencies }
      : {}),
    ...(overrides.planContributions
      ? { planContributions: overrides.planContributions }
      : {}),
    pressureVectors: overrides.pressureVectors ?? [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "medium",
    evidence: ["test_strategic_intent"],
  };
}

export function installAction(
  actionId: string,
  card: VisibleCard,
  creditCost: number,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "install_card",
    label: `Install ${card.title ?? card.instanceId}`,
    source: card.instanceId,
    timingPoint: "runner_action.main",
    costs: [
      { clicks: 1 },
      ...(creditCost > 0 ? [{ credits: creditCost }] : []),
    ],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: {
      cardId: card.instanceId,
      ...(card.definitionId ? { cardDefinitionId: card.definitionId } : {}),
    },
  };
}

export function playEventAction(
  actionId: string,
  card: VisibleCard,
  creditCost: number,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "play_event",
    label: `Play ${card.title ?? card.instanceId}`,
    source: card.instanceId,
    timingPoint: "runner_action.main",
    costs: [
      { clicks: 1 },
      ...(creditCost > 0 ? [{ credits: creditCost }] : []),
    ],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: {
      cardId: card.instanceId,
      ...(card.definitionId ? { cardDefinitionId: card.definitionId } : {}),
    },
  };
}

export function startRunAction(
  actionId: string,
  serverId: string,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

export function visibleIdentity(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

export function visibleCard(
  instanceId: string,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "known" | "owner" | "controller"
  >,
): VisibleCard {
  return {
    instanceId,
    owner: "runner",
    controller: "runner",
    known: true,
    ...overrides,
  };
}

export function findByInstance(
  evaluations: ReturnType<typeof evaluateRunnerHandDevelopment>,
  instanceId: string,
) {
  const evaluation = evaluations.find(
    (candidate) => candidate.cardInstanceId === instanceId,
  );
  expect(evaluation).toBeDefined();
  return evaluation!;
}

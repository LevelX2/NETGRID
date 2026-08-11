import { chooseRunnerAction } from "./index";
import type { AiDeckStrategyProfile } from "./deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import type { SemanticRuntimeChoice } from "./runtime/semantic-runtime-types";
import {
  CURRENT_RULES_BASELINE,
  type AiDecisionInput,
  type AiDifficulty,
  type LegalAction,
  type PlayerView,
  type PublicGameEvent,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "./plans/turn-planning-contracts";
import { withEffectiveRunQuote } from "./effective-run-quote.test-support";

export function aiInput(
  side: Side,
  legalActions: LegalAction[],
): AiDecisionInput {
  for (const action of legalActions) action.expiresAtStateVersion = 1;
  const input: AiDecisionInput = {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal" satisfies AiDifficulty,
    seed: "semantic-runtime-cutover-test",
    decisionId: `semantic-runtime-cutover:${side}`,
    actionNumber: 1,
    profileId: `${side}-semantic-runtime-cutover-test`,
  };
  Object.assign(input, {
    planningRulesContext: buildPlanningRulesContext({
      rulesBaseline: CURRENT_RULES_BASELINE,
      formatProfileId: "semantic-runtime-cutover-test",
      cardPoolSnapshotId: "semantic-runtime-cutover-test",
    }),
    planningStateIdentity: buildPlanningStateIdentity(input),
  });
  return input;
}

export function playerView(
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    turnSerial: 0,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: identityCard(ownSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identityCard(opponentSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

export function runnerWallCoverageInput(
  actions: LegalAction[],
): AiDecisionInput {
  const input = aiInput("runner", actions);
  input.playerView.own.rig = [];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        withEffectiveRunQuote(
          visibleCard("simple_barrier_ice", "corp", "ice", {
            title: "Simple Barrier ICE",
            rezzed: true,
            strength: 3,
            subtypes: ["Wall"],
          }),
          {
            effectiveStrength: 3,
            subroutines: [
              {
                id: "simple_barrier_ice-end-the-run",
                type: "end_the_run",
                sourceDefinitionId: "simple_barrier_ice",
                sourceTitle: "Simple Barrier ICE",
              },
            ],
          },
        ),
      ],
      [visibleCard("simple_agenda", "corp", "agenda")],
    ),
  ];
  attachOwnDeckSnapshot(input, {
    deckSnapshotId: "runner-wall-coverage-fixture",
    side: "runner",
    cards: [{ cardId: "onr_v1_047_pile-driver", quantity: 1 }],
  });
  return input;
}

export function attachOwnDeckSnapshot(
  input: AiDecisionInput,
  ownDeckSnapshot: AiDeckStrategyDeckSnapshot,
): void {
  Object.assign(input, { ownDeckSnapshot });
}

export function identityCard(side: Side): VisibleCard {
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
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "owner" | "controller" | "type" | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

export function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

export function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  label: string,
  cost: { credits: number; clicks?: number },
  options: {
    source?: LegalAction["source"];
    payload?: LegalAction["payload"];
    visibility?: LegalAction["visibility"];
  } = {},
): LegalAction {
  const source =
    options.source ?? (type === "end_turn" ? "game_rule" : "basic_action");
  const canonicalAbilityId =
    typeof options.payload?.cardImplementationAbilityId === "string"
      ? options.payload.cardImplementationAbilityId
      : undefined;
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [
      ((type === "gain_credit" &&
        (options.source === undefined || options.source === "basic_action")) ||
        (type === "activated_card_ability" &&
          canonicalAbilityId !== undefined)) &&
      cost.clicks === undefined
        ? { ...cost, clicks: 1 }
        : cost,
    ],
    targetRequirements: [],
    visibility: options.visibility ?? "public",
    expiresAtStateVersion: 2,
    ...(canonicalAbilityId !== undefined && typeof source === "string"
      ? {
          abilityRef: {
            sourceCardInstanceId: source,
            sourceAbilityId: canonicalAbilityId,
          },
        }
      : {}),
  };
  if (options.payload) action.payload = options.payload;
  return action;
}

export function semanticRuntimeChoice(
  action: LegalAction,
  score: number,
  reasonCode: string,
): SemanticRuntimeChoice {
  return {
    action,
    scopeId: reasonCode,
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
    ],
    reasonCode,
    explanation: reasonCode,
    evidence: [`choice:${action.actionId}`],
  };
}

export function safeRuntimeRunTarget(actionId: string, targetServerId: string) {
  const targetKind = targetServerId === "rd" ? "rd" : "hq";
  const payoff = {
    immediateAccessValue: 20,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId,
    targetKind,
    accessServerId: targetServerId,
    accessTargetKind: targetKind,
    actionId,
    accessPayoff: "fresh",
    knownAccessState: "fresh",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    pathCost: 0,
    routeQuote: {
      reachability: "guaranteed_access" as const,
      knownCost: 0,
      guaranteedKnownCost: 0,
      availableCredits: 4,
      fundingGap: 0,
      unknownIceCount: 0,
      effects: [],
      conditionalReasons: [],
      evidence: [
        "route_reachability:guaranteed_access",
        "route_funding_gap:0",
        "route_unknown_ice_count:0",
      ],
    },
    creditsAfterRun: 4,
    runCommitment: "full_path" as const,
    stealOrTrashAffordable: "unknown",
    installedRunPayoff: payoff,
    runActionPayoff: payoff,
    runActionProjection: {
      actionId,
      actionType: "start_run",
      targetServerId,
      targetKind,
      accessServerId: targetServerId,
      structure: "direct_start_run",
      accessPayoffSignals: [],
      constraintSignals: [],
      riskSignals: [],
      noNoisyBreakers: false,
      bypassFirstIce: false,
      projectionStatus: "concrete_target",
      evidence: ["test_projection"],
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: "run_now",
    score: 100,
    evidence: ["test_safe_access"],
  };
}

export function runtimeRunnerStrategyProfile(): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: "runtime-runner-strategy",
    side: "runner",
    cardCount: 4,
    primaryStrategies: ["runner.rnd_pressure"],
    secondaryStrategies: [],
    strategyScores: {
      "runner.rnd_pressure": {
        anchorScore: 80,
        supportScore: 80,
        finalScore: 80,
        confidence: "high",
        supportGaps: [],
        runtimeStatus: "productive",
        runtimeBlockers: [],
        anchorEvidence: [
          {
            cardId: "onr_v1_081_custodial-position",
            quantity: 2,
            source: "derivedStrategyAnchor",
            strategyId: "runner.rnd_pressure",
            reason: "test",
          },
        ],
        supportEvidence: [],
      },
    },
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "effective-ai-hints:legacy-json+generated-card-spec-v1",
      plannerEffect: "strategic_intent_input",
    },
  };
}

export function tacticalDebugItems(
  decision: ReturnType<typeof chooseRunnerAction>,
): string[] {
  return (
    decision.decisionDebug?.detailSections?.flatMap(
      (section) => section.items,
    ) ?? []
  );
}

export function rdAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId,
    },
  };
}

export function publicEvent(
  eventId: string,
  actionType: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

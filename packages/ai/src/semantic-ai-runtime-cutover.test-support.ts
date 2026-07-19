import { chooseRunnerAction } from "./index";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import type { AiDeckStrategyProfile } from "./deck-doctrine-strategy";
import type { SemanticRuntimeDependencies } from "./runtime/semantic-runtime";
import type { SemanticRuntimeChoice } from "./runtime/semantic-runtime-types";
import type {
  AiDecisionInput,
  AiDifficulty,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

export function aiInput(
  side: Side,
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
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
}

export function playerView(
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
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
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ],
      [visibleCard("simple_agenda", "corp", "agenda")],
    ),
  ];
  return input;
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
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [cost],
    targetRequirements: [],
    visibility: options.visibility ?? "public",
    expiresAtStateVersion: 2,
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
    creditsAfterRun: 4,
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
      activeHints: "data/ai/ai-card-hints-active.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

export function semanticRuntimeDependenciesWithoutRunTargetEvaluation(
  choices: SemanticRuntimeChoice[],
  options: {
    initiallySelectedActionId: string;
    goal?: {
      goalId: string;
      family: string;
      priority: number;
      urgency: string;
      source: string;
      evidence: string[];
    };
    rememberedActions?: string[];
    observedTacticalGoals?: string[];
  },
): Partial<SemanticRuntimeDependencies> {
  return {
    semanticRuntimeChoices: () => choices,
    semanticRuntimeChoiceIsReactive: () => false,
    buildActionSemanticCandidates,
    getTacticalPlanMemorySnapshot: () => undefined,
    deckCapabilitiesForInput: () => ({}) as any,
    runnerStrategicIntentForInput: () => ({}) as any,
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () =>
      ({
        recommendation: "build_economy",
        fundingNeed: "credits",
        evidence: ["test_economy_posture"],
      }) as any,
    buildRunnerTacticalGoals: () =>
      [
        options.goal ?? {
          goalId: "runner.build_economy_base",
          family: "economy",
          priority: 940,
          urgency: "high",
          source: "economy_posture",
          evidence: ["test_goal:economy"],
        },
      ] as any,
    evaluateTacticalPlans: (context) => {
      options.observedTacticalGoals?.push(
        ...(context.tacticalGoals?.map((goal) => goal.goalId) ?? []),
      );
      return {
        planAlternatives: [],
        blockedPlans: [],
      };
    },
    bestSemanticRuntimeChoice: () =>
      choices.find(
        (choice) =>
          choice.action.actionId === options.initiallySelectedActionId,
      ),
    bestSemanticRuntimeChoiceForTacticalPlanOverride: () => undefined,
    tacticalPlanMappedChoice: () => ({}),
    runnerSelfDamageImmediateWinSemanticChoice: () => undefined,
    semanticRuntimeChoiceWithEvidence: (choice, options) => ({
      ...choice,
      evidence: [...choice.evidence, ...options.evidence],
      ...(options.minimumScore !== undefined
        ? { score: Math.max(choice.score, options.minimumScore) }
        : {}),
      ...(options.reasonCode ? { reasonCode: options.reasonCode } : {}),
      ...(options.explanation ? { explanation: options.explanation } : {}),
    }),
    tacticalPlanMappingOverrideEvidence: () => [],
    tacticalPlanRuntimeAlignedToChoice: () => ({
      planAlternatives: [],
      blockedPlans: [],
    }),
    runnerRunOnlyActionAdjustedSemanticChoice: (
      _input,
      rankedChoices,
      selectedChoice,
    ) => ({
      choice: selectedChoice,
      rankedChoices: [...rankedChoices],
    }),
    semanticRuntimeCoverageSelectionDebug: () => undefined,
    selectedChoicesForDecision: () => undefined,
    rememberTacticalPlanRuntime: (_input, _result, selectedAction) => {
      options.rememberedActions?.push(selectedAction.actionId);
      return undefined;
    },
    scrubEvidence: (evidence) => evidence,
    semanticRuntimeDecisionDebug: () =>
      ({
        schemaVersion: "ai-decision-debug-v1",
        aiLevel: 2,
      }) as any,
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

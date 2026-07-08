import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type CounterCreditUse,
  type LegalAction,
  type ServerId,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { RUNTIME_CARDS } from "../ai-hints";
import type {
  RunnerRunTargetEvaluation,
  RunnerRunTargetKind,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type {
  RunnerRunAccessIntent,
  RunnerRunBudget,
  RunnerRunObjective,
  RunnerRunPlan,
  RunnerRunPlanOrigin,
  RunnerRunPlanServerId,
} from "./runner-run-plan-types";
import { quoteRunnerRunPath } from "./runner-run-plan-path-quote";

export function createRunnerRunPlanForSelectedAction(params: {
  input: AiDecisionInput;
  selectedAction: LegalAction;
  runnerRunTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
  runnerTacticalGoals?: readonly RunnerTacticalGoal[];
  runnerStrategicIntent?: RunnerStrategicIntentProfile;
  actionSemanticCandidates?: readonly ActionSemanticCandidate[];
}): RunnerRunPlan | undefined {
  const { input, selectedAction } = params;
  if (input.side !== "runner" || selectedAction.side !== "runner") {
    return undefined;
  }
  const targetEvaluation = runnerRunTargetEvaluationForSelectedAction({
    action: selectedAction,
    evaluations: params.runnerRunTargetEvaluations ?? [],
  });
  const payloadTargetServerId = runnerRunPlanTargetServerId(selectedAction);
  if (
    !runnerRunStartActionCanCreatePlan(
      selectedAction,
      targetEvaluation,
      payloadTargetServerId,
    )
  ) {
    return undefined;
  }
  const targetServerId =
    payloadTargetServerId ??
    runnerRunPlanTargetServerIdFromEvaluation(targetEvaluation);
  if (!targetServerId) return undefined;
  const matchingTargetEvaluation =
    runnerRunTargetEvaluationForAction({
      action: selectedAction,
      targetServerId,
      evaluations: params.runnerRunTargetEvaluations ?? [],
    }) ?? targetEvaluation;
  const targetKind =
    matchingTargetEvaluation?.accessTargetKind ??
    targetKindForServerId(targetServerId);
  if (!targetKind) return undefined;
  const expectedValue = Math.max(0, matchingTargetEvaluation?.score ?? 0);
  const expectedAccessCount = matchingTargetEvaluation?.multiaccessAvailable
    ? 2
    : 1;
  const objective = runnerRunObjectiveFor({
    targetKind,
    expectedValue,
    expectedAccessCount,
    evaluation: matchingTargetEvaluation,
  });
  const accessReserve = runnerRunAccessReserveForStealOrTrash({
    input,
    targetServerId,
    evaluation: matchingTargetEvaluation,
  });
  const accessIntent = runnerRunAccessIntentFor({
    targetServerId,
    expectedAccessCount,
    evaluation: matchingTargetEvaluation,
    reserveForStealOrTrash: accessReserve.reserveForStealOrTrash,
  });
  const now = input.playerView.stateVersion;
  const pathCost = Math.max(0, matchingTargetEvaluation?.pathCost ?? 0);
  const creditsAfterRun =
    matchingTargetEvaluation?.creditsAfterRun ??
    input.playerView.own.credits - pathCost;
  const actionCandidate = params.actionSemanticCandidates?.find(
    (candidate) => candidate.actionId === selectedAction.actionId,
  );
  const maxSpendThisRun = numberPayloadValue(selectedAction, "spendLimit");
  const specialCreditBudget = runnerRunSpecialCreditBudget({
    input,
    selectedAction,
    actionCandidate,
  });
  const matchingGoals = (params.runnerTacticalGoals ?? []).filter(
    (goal) =>
      goal.targetServerId === undefined ||
      goal.targetServerId === targetServerId,
  );
  const plan: RunnerRunPlan = {
    id: [
      "runner_run_plan",
      input.decisionId,
      selectedAction.actionId,
      targetServerId,
    ].join(":"),
    side: "runner",
    lifecycle: "created",
    origin: runnerRunPlanOriginFor(selectedAction),
    objective,
    targetServer: { id: targetServerId },
    accessIntent,
    runStartActionId: selectedAction.actionId,
    sourceTacticalGoalIds: matchingGoals.map((goal) => goal.goalId),
    sourceStrategyEvidence: [
      ...(params.runnerStrategicIntent?.evidence ?? []).slice(0, 8),
      ...matchingGoals.flatMap((goal) => goal.evidence.slice(0, 2)),
    ],
    budget: {
      availableCredits: input.playerView.own.credits,
      runOnlyCredits: specialCreditBudget.runOnlyCredits,
      recurringBreakerCredits: specialCreditBudget.recurringBreakerCredits,
      recurringKillerCredits: specialCreditBudget.recurringKillerCredits,
      recurringLinkCredits: specialCreditBudget.recurringLinkCredits,
      stealthCredits: specialCreditBudget.stealthCredits,
      nonNoisyBreakerCredits: specialCreditBudget.nonNoisyBreakerCredits,
      ...(maxSpendThisRun !== undefined ? { maxSpendThisRun } : {}),
      reservedCreditsAfterRun: 0,
      reservedCreditsForSteal: accessReserve.reservedCreditsForSteal,
      reservedCreditsForTrash: accessReserve.reservedCreditsForTrash,
      damageSafetyReserve: {
        minimumGripAfterRun: 0,
        preventionCreditsReserved: 0,
        evidence: [],
      },
      tagSafetyReserve: {
        minimumCreditsAfterTags: 0,
        expectedTagCount:
          matchingTargetEvaluation?.expectedTagsFromVisibleIce ?? 0,
        evidence: [],
      },
    },
    reserve: {
      minimumCreditsAfterRun: 0,
      minimumGripAfterRun: 0,
      preserveStealOrTrashCredits: accessIntent.reserveForStealOrTrash,
      evidence: [...accessReserve.evidence, ...specialCreditBudget.evidence],
    },
    pathQuote: {
      server: targetServerId,
      quoteStatus: matchingTargetEvaluation ? "partially_known" : "unknown",
      iceQuotes: [],
      totalKnownCost: pathCost,
      expectedUnknownCost: 0,
      expectedRemainingCredits: creditsAfterRun,
      reserveViolation: creditsAfterRun < 0,
      canReachAccess: matchingTargetEvaluation?.pathPassability === "reachable",
      ...(matchingTargetEvaluation &&
      matchingTargetEvaluation.pathPassability !== "reachable"
        ? { cannotReachReason: matchingTargetEvaluation.pathPassability }
        : {}),
      requiredSequences: [],
    },
    revalidation: {
      status: "valid",
      reasons: ["run_plan_created_from_selected_run_action"],
      checkedAtStateVersion: now,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [
      { kind: "legal_action", ref: selectedAction.actionId },
      ...(actionCandidate
        ? [
            {
              kind: "action_semantic_candidate" as const,
              ref: actionCandidate.semanticActionType,
            },
          ]
        : []),
    ],
    debug: {
      summary: `RunPlan ${objective.kind} auf ${targetServerId}`,
      items: [
        `objective:${objective.kind}`,
        `target:${targetServerId}`,
        `origin:${runnerRunPlanOriginFor(selectedAction)}`,
        ...specialCreditBudget.evidence,
        ...(matchingTargetEvaluation
          ? [
              `run_target_recommendation:${matchingTargetEvaluation.recommendation}`,
              `run_target_path:${matchingTargetEvaluation.pathPassability}`,
              `run_target_payoff:${matchingTargetEvaluation.accessPayoff}`,
              `run_target_access_reserve:${accessReserve.reserveForStealOrTrash}`,
            ]
          : ["run_target_evaluation:missing"]),
      ],
    },
    createdAtStateVersion: now,
    updatedAtStateVersion: now,
  };
  return {
    ...plan,
    pathQuote: quoteRunnerRunPath(input, plan),
  };
}

function runnerRunStartActionCanCreatePlan(
  action: LegalAction,
  targetEvaluation: RunnerRunTargetEvaluation | undefined,
  payloadTargetServerId: RunnerRunPlanServerId | undefined,
): boolean {
  if (targetEvaluation) return true;
  if (action.type === "start_run") return true;
  if (!payloadTargetServerId) return false;
  return runnerRunPlanPayloadTargetActionTypes.has(action.type);
}

const runnerRunPlanPayloadTargetActionTypes = new Set<LegalAction["type"]>([
  "play_event",
  "activated_card_ability",
  "resolve_choice",
]);

function runnerRunPlanTargetServerId(
  action: LegalAction,
): RunnerRunPlanServerId | undefined {
  for (const key of [
    "serverId",
    "targetServerId",
    "runServerId",
    "selectedServerId",
  ]) {
    const value = action.payload?.[key];
    if (typeof value === "string" && isRunnerRunPlanServerId(value)) {
      return value;
    }
  }
  return undefined;
}

function isRunnerRunPlanServerId(
  value: string,
): value is RunnerRunPlanServerId {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    /^remote_\d+$/.test(value)
  );
}

function runnerRunPlanTargetServerIdFromEvaluation(
  evaluation: RunnerRunTargetEvaluation | undefined,
): RunnerRunPlanServerId | undefined {
  if (!evaluation) return undefined;
  return isRunnerRunPlanServerId(evaluation.targetServerId)
    ? evaluation.targetServerId
    : undefined;
}

function runnerRunTargetEvaluationForSelectedAction(params: {
  action: LegalAction;
  evaluations: readonly RunnerRunTargetEvaluation[];
}): RunnerRunTargetEvaluation | undefined {
  return params.evaluations.find(
    (evaluation) =>
      evaluation.actionId === params.action.actionId &&
      isRunnerRunPlanServerId(evaluation.targetServerId),
  );
}

function targetKindForServerId(
  serverId: ServerId,
): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function runnerRunTargetEvaluationForAction(params: {
  action: LegalAction;
  targetServerId: RunnerRunPlanServerId;
  evaluations: readonly RunnerRunTargetEvaluation[];
}): RunnerRunTargetEvaluation | undefined {
  return (
    params.evaluations.find(
      (evaluation) =>
        evaluation.actionId === params.action.actionId &&
        evaluation.targetServerId === params.targetServerId,
    ) ??
    params.evaluations.find(
      (evaluation) => evaluation.targetServerId === params.targetServerId,
    )
  );
}

function runnerRunObjectiveFor(params: {
  targetKind: RunnerRunTargetKind;
  expectedValue: number;
  expectedAccessCount: number;
  evaluation: RunnerRunTargetEvaluation | undefined;
}): RunnerRunObjective {
  const payoff = params.evaluation?.accessPayoff;
  if (params.targetKind === "rd") {
    if (params.expectedAccessCount > 1) {
      return {
        kind: "access_rnd_multi",
        expectedValue: params.expectedValue,
        expectedAccessCount: params.expectedAccessCount,
      };
    }
    return { kind: "access_rnd_top", expectedValue: params.expectedValue };
  }
  if (params.targetKind === "hq") {
    if (params.expectedAccessCount > 1) {
      return {
        kind: "access_hq_multi",
        expectedValue: params.expectedValue,
        expectedAccessCount: params.expectedAccessCount,
      };
    }
    return { kind: "access_hq_card", expectedValue: params.expectedValue };
  }
  if (params.targetKind === "archives") {
    return { kind: "access_archives", expectedValue: params.expectedValue };
  }
  if (payoff === "agenda" || payoff === "score_threat") {
    return {
      kind: "contest_remote_agenda",
      urgency: params.evaluation?.scoreThreat ? 100 : params.expectedValue,
    };
  }
  if (payoff === "trash_affordable" || payoff === "trash_unaffordable") {
    return {
      kind: "trash_asset_or_upgrade",
      maxTrashCost: payoff === "trash_affordable" ? Number.MAX_SAFE_INTEGER : 0,
      expectedValue: params.expectedValue,
    };
  }
  if (payoff === "access_bonus") {
    return {
      kind: "run_card_effect",
      effectId: "access_bonus",
      replacesAccess: false,
    };
  }
  return {
    kind: "probe_unknown_ice",
    riskBudget: {
      maxCreditLoss: Math.max(0, params.evaluation?.pathCost ?? 0),
      maxDamage: 0,
      allowEndTheRun: true,
      evidence: ["run_objective:probe_unknown_ice"],
    },
  };
}

function runnerRunAccessIntentFor(params: {
  targetServerId: RunnerRunPlanServerId;
  expectedAccessCount: number;
  evaluation: RunnerRunTargetEvaluation | undefined;
  reserveForStealOrTrash: number;
}): RunnerRunAccessIntent {
  const payoff = params.evaluation?.accessPayoff;
  return {
    server: params.targetServerId,
    expectedAccessCount: params.expectedAccessCount,
    stealAgendaPolicy:
      payoff === "agenda" || payoff === "score_threat"
        ? "must_steal"
        : "steal_if_affordable",
    trashPolicy:
      payoff === "trash_unaffordable"
        ? "must_trash_target"
        : payoff === "known_low_value"
          ? "decline_low_value"
          : "trash_if_value_positive",
    reserveForStealOrTrash: params.reserveForStealOrTrash,
  };
}

type RunnerRunAccessReserveQuote = {
  reserveForStealOrTrash: number;
  reservedCreditsForSteal: number;
  reservedCreditsForTrash: number;
  evidence: string[];
};

function runnerRunAccessReserveForStealOrTrash(params: {
  input: AiDecisionInput;
  targetServerId: RunnerRunPlanServerId;
  evaluation: RunnerRunTargetEvaluation | undefined;
}): RunnerRunAccessReserveQuote {
  const payoff = params.evaluation?.accessPayoff;
  if (payoff === "trash_affordable" || payoff === "trash_unaffordable") {
    const trashReserve =
      evidenceNumberValue(params.evaluation?.evidence, [
        "known_remote_root_trash_cost",
        "rnd_known_top_trash_cost",
        "rnd_known_sequence_trash_cost",
      ]) ??
      cheapestKnownRemoteTrashCost(params.input, params.targetServerId) ??
      0;
    return {
      reserveForStealOrTrash: trashReserve,
      reservedCreditsForSteal: 0,
      reservedCreditsForTrash: trashReserve,
      evidence:
        trashReserve > 0
          ? [
              `runner_run_plan_reserve_trash_cost:${trashReserve}`,
              `runner_run_plan_reserve_payoff:${payoff}`,
            ]
          : [`runner_run_plan_reserve_trash_cost:unknown_or_zero`],
    };
  }

  if (payoff === "agenda" || payoff === "score_threat") {
    return {
      reserveForStealOrTrash: 0,
      reservedCreditsForSteal: 0,
      reservedCreditsForTrash: 0,
      evidence: ["runner_run_plan_reserve_steal_cost:unknown_or_zero"],
    };
  }

  return {
    reserveForStealOrTrash: 0,
    reservedCreditsForSteal: 0,
    reservedCreditsForTrash: 0,
    evidence: [],
  };
}

function cheapestKnownRemoteTrashCost(
  input: AiDecisionInput,
  targetServerId: RunnerRunPlanServerId,
): number | undefined {
  if (!targetServerId.startsWith("remote_")) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const costs = (server?.root ?? [])
    .filter((card) => card.known !== false)
    .map((card) => {
      const type = card.type ?? cardDefinitionType(card.definitionId);
      if (type !== "asset" && type !== "upgrade") return undefined;
      return card.trashCost ?? cardDefinitionTrashCost(card.definitionId);
    })
    .filter((cost): cost is number => cost !== undefined)
    .map((cost) => Math.max(0, Math.floor(cost)))
    .sort((left, right) => left - right);
  return costs[0];
}

function evidenceNumberValue(
  evidence: readonly string[] | undefined,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const prefix = `${key}:`;
    const entry = evidence?.find((candidate) => candidate.startsWith(prefix));
    if (!entry) continue;
    const value = Number(entry.slice(prefix.length));
    if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
  }
  return undefined;
}

function cardDefinitionTrashCost(
  definitionId: string | undefined,
): number | undefined {
  if (!definitionId) return undefined;
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[definitionId]?.trashCost
  );
}

function cardDefinitionType(
  definitionId: string | undefined,
): string | undefined {
  if (!definitionId) return undefined;
  return (
    RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type
  );
}

function runnerRunPlanOriginFor(action: LegalAction): RunnerRunPlanOrigin {
  if (action.payload?.bonusRunNoClick === true) return "followup_run";
  if (action.source !== "basic_action") return "card_initiated_run";
  return "basic_start_run";
}

function numberPayloadValue(
  action: LegalAction,
  key: string,
): number | undefined {
  const value = action.payload?.[key];
  return typeof value === "number" ? value : undefined;
}

type RunnerRunSpecialCreditBudgetQuote = Pick<
  RunnerRunBudget,
  | "runOnlyCredits"
  | "recurringBreakerCredits"
  | "recurringKillerCredits"
  | "recurringLinkCredits"
  | "stealthCredits"
  | "nonNoisyBreakerCredits"
> & { evidence: string[] };

function runnerRunSpecialCreditBudget(params: {
  input: AiDecisionInput;
  selectedAction: LegalAction;
  actionCandidate: ActionSemanticCandidate | undefined;
}): RunnerRunSpecialCreditBudgetQuote {
  const payload = params.selectedAction.payload ?? {};
  const payloadRunOnlyCredits =
    numberPayloadValueForKeys(params.selectedAction, [
      "runOnlyCredits",
      "runCredits",
      "temporaryRunCredits",
      "badPublicityCredits",
    ]) ?? 0;
  const badPublicityCredits = Math.max(
    0,
    Math.floor(visibleBadPublicityCredits(params.input)),
  );
  const runOnlyCredits = Math.max(payloadRunOnlyCredits, badPublicityCredits);
  const rigCredits = runnerRigSpecialCreditBudget(params.input);
  const candidateTemporaryCredits = Math.max(
    0,
    Math.floor(
      params.actionCandidate?.costProfile.temporaryCredits?.provided ??
        params.actionCandidate?.costProfile.temporaryCredits?.budget ??
        0,
    ),
  );
  const quote = {
    runOnlyCredits: Math.max(runOnlyCredits, candidateTemporaryCredits),
    recurringBreakerCredits: Math.max(
      rigCredits.recurringBreakerCredits,
      numberPayloadValueFromRecord(payload, [
        "recurringBreakerCredits",
        "recurringIcebreakerCredits",
        "breakerRecurringCredits",
      ]) ?? 0,
    ),
    recurringKillerCredits: Math.max(
      rigCredits.recurringKillerCredits,
      numberPayloadValueFromRecord(payload, [
        "recurringKillerCredits",
        "killerRecurringCredits",
      ]) ?? 0,
    ),
    recurringLinkCredits: Math.max(
      rigCredits.recurringLinkCredits,
      numberPayloadValueFromRecord(payload, [
        "recurringLinkCredits",
        "linkRecurringCredits",
      ]) ?? 0,
    ),
    stealthCredits: Math.max(
      rigCredits.stealthCredits,
      numberPayloadValueFromRecord(payload, ["stealthCredits"]) ?? 0,
    ),
    nonNoisyBreakerCredits: Math.max(
      rigCredits.nonNoisyBreakerCredits,
      numberPayloadValueFromRecord(payload, [
        "nonNoisyBreakerCredits",
        "noNoisyBreakerCredits",
      ]) ?? 0,
    ),
  };
  return {
    ...quote,
    evidence: runnerRunSpecialCreditBudgetEvidence(quote),
  };
}

function runnerRigSpecialCreditBudget(
  input: AiDecisionInput,
): Omit<RunnerRunSpecialCreditBudgetQuote, "runOnlyCredits" | "evidence"> {
  const rig = input.playerView.own.rig ?? [];
  return rig.reduce(
    (budget, card) => {
      for (const display of card.counterDisplays ?? []) {
        const amount = Math.max(0, Math.floor(display.amount));
        if (amount <= 0) continue;
        const pool = display.creditPool;
        if (!pool) continue;
        const uses = new Set(pool.uses ?? []);
        const recurring =
          pool.kind === "recurring_credit" ||
          display.displayKind === "recurring_credit";
        if (recurring && uses.has("using_icebreaker_during_run")) {
          budget.recurringBreakerCredits += amount;
        }
        if (recurring && uses.has("using_killer_during_run")) {
          budget.recurringKillerCredits += amount;
        }
        if (recurring && uses.has("increase_link")) {
          budget.recurringLinkCredits += amount;
        }
        if (uses.has("using_icebreaker_during_run_non_noisy")) {
          budget.nonNoisyBreakerCredits += amount;
        }
        if (visibleCardLooksStealthCreditSource(card, uses)) {
          budget.stealthCredits += amount;
        }
      }
      return budget;
    },
    {
      recurringBreakerCredits: 0,
      recurringKillerCredits: 0,
      recurringLinkCredits: 0,
      stealthCredits: 0,
      nonNoisyBreakerCredits: 0,
    },
  );
}

function visibleBadPublicityCredits(input: AiDecisionInput): number {
  const ownBadPublicity = (input.playerView.own as { badPublicity?: unknown })
    .badPublicity;
  const opponentBadPublicity = (
    input.playerView.opponent as { badPublicity?: unknown }
  ).badPublicity;
  for (const value of [ownBadPublicity, opponentBadPublicity]) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function visibleCardLooksStealthCreditSource(
  card: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>[number],
  uses: ReadonlySet<CounterCreditUse>,
): boolean {
  if (uses.has("using_icebreaker_during_run_non_noisy")) return true;
  return (card.subtypes ?? []).some(
    (subtype) => subtype.toLocaleLowerCase("en-US") === "stealth",
  );
}

function runnerRunSpecialCreditBudgetEvidence(
  quote: Omit<RunnerRunSpecialCreditBudgetQuote, "evidence">,
): string[] {
  return [
    quote.runOnlyCredits > 0
      ? `runner_run_plan_budget_run_only:${quote.runOnlyCredits}`
      : undefined,
    quote.recurringBreakerCredits > 0
      ? `runner_run_plan_budget_recurring_breaker:${quote.recurringBreakerCredits}`
      : undefined,
    quote.recurringKillerCredits > 0
      ? `runner_run_plan_budget_recurring_killer:${quote.recurringKillerCredits}`
      : undefined,
    quote.recurringLinkCredits > 0
      ? `runner_run_plan_budget_recurring_link:${quote.recurringLinkCredits}`
      : undefined,
    quote.stealthCredits > 0
      ? `runner_run_plan_budget_stealth:${quote.stealthCredits}`
      : undefined,
    quote.nonNoisyBreakerCredits > 0
      ? `runner_run_plan_budget_non_noisy_breaker:${quote.nonNoisyBreakerCredits}`
      : undefined,
  ].filter((entry): entry is string => entry !== undefined);
}

function numberPayloadValueForKeys(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  return numberPayloadValueFromRecord(action.payload ?? {}, keys);
}

function numberPayloadValueFromRecord(
  payload: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }
  }
  return undefined;
}

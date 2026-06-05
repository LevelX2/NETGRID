import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";

export const TACTICAL_PLAN_SCHEMA_VERSION = "tactical-plan-v1" as const;

export type PlanLifecycle =
  | "proposed"
  | "active"
  | "blocked"
  | "progressing"
  | "satisfied"
  | "failed"
  | "expired";

export type TacticalPlanType =
  | "runner.obtain_breaker_coverage"
  | "runner.contest_remote"
  | "runner.opportunistic_central_run"
  | "runner.build_credit_bank"
  | "runner.cash_out_credit_bank"
  | "corp.create_score_window"
  | "corp.build_credit_bank"
  | "corp.rez_defense";

export type PlanStepKind =
  | "install_breaker"
  | "draw_for_answer"
  | "search_for_answer"
  | "gain_credits"
  | "build_bank_counter"
  | "cash_out_bank"
  | "run_target"
  | "probe_central"
  | "rez_outer_ice"
  | "advance_score_card"
  | "score_agenda";

export type PlanMappingStatus =
  | "unmapped"
  | "matched"
  | "blocked_no_legal_action"
  | "blocked_missing_capability"
  | "blocked_too_expensive"
  | "blocked_timing"
  | "defer_to_reactive_window";

export type RequiredCapabilityKind =
  | "breaker_coverage"
  | "credits"
  | "card_draw"
  | "card_search"
  | "server_access"
  | "bank_capacity"
  | "bank_payout"
  | "remote_protection"
  | "agenda_score_window"
  | "rez_window";

export type RequiredCapability = {
  capabilityId: string;
  kind: RequiredCapabilityKind;
  side: Side;
  target?: PlanTarget;
  minimumCredits?: number;
  evidence: string[];
};

export type PlanBlockerKind =
  | "missing_breaker_coverage"
  | "missing_credits"
  | "missing_legal_action"
  | "missing_remote_protection"
  | "timing_window_unavailable"
  | "reactive_window";

export type PlanBlocker = {
  blockerId: string;
  kind: PlanBlockerKind;
  severity: "soft" | "hard";
  target?: PlanTarget;
  removalStepKind?: PlanStepKind;
  evidence: string[];
};

export type PlanTarget = {
  kind: "server" | "card" | "ice" | "capability" | "bank";
  id: string;
  label?: string;
};

export type PlanScoreBreakdown = {
  key: string;
  label: string;
  value: number;
  reason: string;
};

export type PlanStep = {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds: string[];
  rationale: string[];
};

export type TacticalPlan = {
  schemaVersion: typeof TACTICAL_PLAN_SCHEMA_VERSION;
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities: RequiredCapability[];
  blockers: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps: PlanStep[];
  evidence: string[];
  scoreBreakdown: PlanScoreBreakdown[];
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
};

export type TacticalPlanBuildContext = {
  input: AiDecisionInput;
  candidates?: readonly ActionSemanticCandidate[];
  previousPlan?: TacticalPlanSnapshot;
};

export type TacticalPlanSnapshot = Pick<
  TacticalPlan,
  "planId" | "type" | "status" | "target"
>;

export type PlanStepMappingResult = {
  plan: TacticalPlan;
  step: PlanStep;
  status: PlanMappingStatus;
  actionCandidateIds: string[];
  legalActions: LegalAction[];
  rationale: string[];
};

export type TacticalPlanRuntimeResult = {
  planAlternatives: TacticalPlan[];
  blockedPlans: TacticalPlan[];
  selectedPlan?: TacticalPlan;
  selectedStep?: PlanStep;
  selectedMapping?: PlanStepMappingResult;
};

export function buildTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  return context.input.side === "runner"
    ? buildRunnerTacticalPlans(context)
    : buildCorpTacticalPlans(context);
}

export function evaluateTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlanRuntimeResult {
  const planAlternatives = rankTacticalPlans(buildTacticalPlans(context));
  const blockedPlans = planAlternatives.filter((plan) => plan.status === "blocked");
  const candidates = context.candidates ?? [];
  for (const plan of planAlternatives) {
    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      context.input,
    );
    if (mapping.status === "matched" && mapping.legalActions.length > 0) {
      return {
        planAlternatives,
        blockedPlans,
        selectedPlan: plan,
        selectedStep: mapping.step,
        selectedMapping: mapping,
      };
    }
  }
  return {
    planAlternatives,
    blockedPlans,
  };
}

export function mapPlanStepToLegalActions(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): PlanStepMappingResult {
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const matchedCandidateIds = candidates
    .filter((candidate) =>
      candidateMatchesStep(
        plan,
        step,
        candidate,
        legalActionsById.get(candidate.actionId),
      ),
    )
    .map((candidate) => candidate.actionId);
  const legalActions = matchedCandidateIds
    .map((actionId) => legalActionsById.get(actionId))
    .filter((action): action is LegalAction => Boolean(action));
  const status = mappingStatusForStep(step, legalActions);
  return {
    plan,
    step: {
      ...step,
      mappingStatus: status,
      actionCandidateIds: matchedCandidateIds,
    },
    status,
    actionCandidateIds: matchedCandidateIds,
    legalActions,
    rationale: [
      ...step.rationale,
      `mapped_candidate_count:${matchedCandidateIds.length}`,
      `mapped_legal_action_count:${legalActions.length}`,
    ],
  };
}

function mappingStatusForStep(
  step: PlanStep,
  legalActions: readonly LegalAction[],
): PlanMappingStatus {
  if (legalActions.length > 0) return "matched";
  if (
    step.requiredCapabilities.some(
      (capability) =>
        capability.kind === "breaker_coverage" ||
        capability.kind === "remote_protection" ||
        capability.kind === "bank_payout",
    )
  ) {
    return "blocked_missing_capability";
  }
  return "blocked_no_legal_action";
}

function candidateMatchesStep(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
): boolean {
  if (!action) return false;
  if (candidate.actorSide !== plan.side) return false;
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return false;
  }
  if (step.desiredActionSemantics.includes(candidate.semanticActionType)) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.actionTacticSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.cardContextSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  return actionTypeMatchesStep(step, candidate.actionType) &&
    candidateTargetMatchesPlan(plan, candidate, action) &&
    bankStepMatchesCandidate(step, candidate, action);
}

function actionTypeMatchesStep(step: PlanStep, actionType: string): boolean {
  switch (step.kind) {
    case "install_breaker":
      return actionType === "install_card";
    case "draw_for_answer":
      return actionType === "draw_card";
    case "search_for_answer":
      return (
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "play_event" ||
        actionType === "draw_card"
      );
    case "gain_credits":
      return actionType === "gain_credit";
    case "build_bank_counter":
    case "cash_out_bank":
      return actionType === "trigger_ability" || actionType === "activated_card_ability";
    case "run_target":
    case "probe_central":
      return actionType === "start_run";
    case "rez_outer_ice":
      return actionType === "rez_ice";
    case "advance_score_card":
      return actionType === "advance_card";
    case "score_agenda":
      return actionType === "score_agenda";
  }
}

function candidateTargetMatchesPlan(
  plan: TacticalPlan,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (!plan.target) return true;
  if (plan.target.kind !== "server") return true;
  const payloadServerId = actionServerId(action);
  if (payloadServerId) return payloadServerId === plan.target.id;
  const selectedServer = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server",
  );
  if (selectedServer) return selectedServer.targetId === plan.target.id;
  return !candidate.legalActionRef.originalPayloadKeys.includes("serverId");
}

function bankStepMatchesCandidate(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (step.kind !== "build_bank_counter" && step.kind !== "cash_out_bank") {
    return true;
  }
  const evidence = candidate.evidence.join(" ").toLowerCase();
  const signals = [
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    candidate.semanticActionType,
  ].join(" ").toLowerCase();
  const label = action.label.toLowerCase();
  if (step.kind === "build_bank_counter") {
    return (
      label.includes("auf broker legen") ||
      label.includes("put") && label.includes("bank") ||
      evidence.includes("auf broker legen") ||
      signals.includes("bank") ||
      signals.includes("counter_bank") ||
      signals.includes("temporary_resource_bank")
    );
  }
  return (
    label.includes("von broker nehmen") ||
    label.includes("take") && label.includes("bank") ||
    evidence.includes("von broker nehmen") ||
    signals.includes("cash") ||
    signals.includes("payout") ||
    signals.includes("bank")
  );
}

function buildRunnerTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const remoteRunActions = input.legalActions.filter(
    (action) => action.type === "start_run" && isRemoteServer(actionServerId(action)),
  );
  const blockedRemoteRuns = remoteRunActions.filter((action) =>
    remoteRunNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  for (const action of blockedRemoteRuns) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        priority: 920,
        horizonTurns: 2,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `missing_breaker_coverage:${serverId}`,
            kind: "missing_breaker_coverage",
            severity: "soft",
            target: { kind: "server", id: serverId },
            removalStepKind: "search_for_answer",
            evidence: ["visible rezzed ICE path and no visible breaker coverage"],
          },
        ],
        currentStep: createPlanStep({
          stepId: `runner.obtain_breaker_coverage:${serverId}`,
          kind: "search_for_answer",
          desiredActionSemantics: [
            "card_ability.trigger",
            "card_ability.unknown",
            "play.runner_event",
            "draw.card",
          ],
          rationale: ["remote contest is blocked until breaker coverage is improved"],
        }),
        evidence: [`blocked_remote_run_action:${action.actionId}`],
        scoreBreakdown: [
          {
            key: "remote_contest_blocked",
            label: "Remote contest blocked",
            value: 920,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.obtain_breaker_coverage:${serverId}`,
        side: "runner",
        type: "runner.obtain_breaker_coverage",
        status: "active",
        priority: 940,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        requiredCapabilities: [
          {
            capabilityId: `breaker_coverage:${serverId}`,
            kind: "breaker_coverage",
            side: "runner",
            target: { kind: "server", id: serverId },
            evidence: ["required to resume blocked remote contest"],
          },
        ],
        currentStep: runnerBreakerCoverageStep(input, serverId),
        nextSteps: [
          createPlanStep({
            stepId: `runner.contest_remote:${serverId}`,
            kind: "run_target",
            desiredActionSemantics: ["run.start"],
            rationale: ["return to the blocked remote after coverage improves"],
          }),
        ],
        evidence: [`unblocks_plan:runner.contest_remote:${serverId}`],
        scoreBreakdown: [
          {
            key: "unblocks_remote_contest",
            label: "Unblocks remote contest",
            value: 940,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId || blockedRemoteRuns.includes(action)) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "active",
        priority: 820,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: ["remote run is legal and no visible coverage blocker was detected"],
        }),
        evidence: [`remote_run_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter(
    (candidate) =>
      candidate.type === "start_run" && isCentralServer(actionServerId(candidate)),
  )) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "active",
        priority: serverId === "rd" ? 760 : 740,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: createPlanStep({
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: ["central pressure remains available while blocked plans wait"],
        }),
        evidence: [`central_run_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  if (bankBuildActions.length > 0 && input.playerView.own.credits >= 4) {
    plans.push(
      createTacticalPlan({
        planId: "runner.build_credit_bank",
        side: "runner",
        type: "runner.build_credit_bank",
        status: "active",
        priority: 700,
        horizonTurns: 2,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:runner",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          rationale: ["credits are stable enough to bank for later plan execution"],
        }),
        evidence: bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
        stateVersion,
      }),
    );
  }
  const bankPayoutActions = input.legalActions.filter(isBankPayoutAction);
  if (bankPayoutActions.length > 0 && input.playerView.own.credits <= 3) {
    plans.push(
      createTacticalPlan({
        planId: "runner.cash_out_credit_bank",
        side: "runner",
        type: "runner.cash_out_credit_bank",
        status: "active",
        priority: 880,
        horizonTurns: 1,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "cash_out_bank:runner",
          kind: "cash_out_bank",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          rationale: ["low credits make stored bank credits immediately useful"],
        }),
        evidence: bankPayoutActions.map((action) => `bank_payout_action:${action.actionId}`),
        stateVersion,
      }),
    );
  }
  return plans;
}

function buildCorpTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  for (const action of input.legalActions.filter((candidate) => candidate.type === "score_agenda")) {
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: 980,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `score_agenda:${action.actionId}`,
          kind: "score_agenda",
          desiredActionSemantics: ["score.agenda"],
          rationale: ["agenda score action is already legal"],
        }),
        evidence: [`score_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "advance_card")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    if (
      serverId &&
      !remoteIsProtected(input.playerView, serverId) &&
      !advanceCompletesScore(input.playerView, action) &&
      corpHasSafeScoreAlternative(input, action)
    ) {
      continue;
    }
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: serverId && remoteIsProtected(input.playerView, serverId) ? 900 : 760,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        currentStep: createPlanStep({
          stepId: `advance_score_card:${action.actionId}`,
          kind: "advance_score_card",
          desiredActionSemantics: ["score.advance_card"],
          rationale: ["advance action progresses a visible score window"],
        }),
        evidence: [`advance_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "rez_ice")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    plans.push(
      createTacticalPlan({
        planId: `corp.rez_defense:${action.actionId}`,
        side: "corp",
        type: "corp.rez_defense",
        status: "active",
        priority: 930,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        currentStep: createPlanStep({
          stepId: `rez_outer_ice:${action.actionId}`,
          kind: "rez_outer_ice",
          desiredActionSemantics: ["corp_window.rez"],
          rationale: ["rez window can turn existing ICE into defense"],
        }),
        evidence: [`rez_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  if (bankBuildActions.length > 0 && input.playerView.own.credits >= 4) {
    plans.push(
      createTacticalPlan({
        planId: "corp.build_credit_bank",
        side: "corp",
        type: "corp.build_credit_bank",
        status: "active",
        priority: 690,
        horizonTurns: 2,
        target: { kind: "bank", id: "corp_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:corp",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          rationale: ["corp can bank spare credits for future score or rez windows"],
        }),
        evidence: bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
        stateVersion,
      }),
    );
  }
  return plans;
}

function runnerBreakerCoverageStep(
  input: AiDecisionInput,
  serverId: string,
): PlanStep {
  if (input.legalActions.some(isBreakerInstallAction(input.playerView))) {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      rationale: ["visible install action can add breaker coverage"],
    });
  }
  if (
    input.legalActions.some(
      (action) =>
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability" ||
        action.type === "play_event",
    )
  ) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
        "draw.card",
      ],
      rationale: ["search or event actions may find the missing breaker answer"],
    });
  }
  if (input.legalActions.some((action) => action.type === "draw_card")) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: ["draw.card"],
      rationale: ["drawing is the safest available path toward a breaker answer"],
    });
  }
  return createPlanStep({
    stepId: `gain_credits:${serverId}`,
    kind: "gain_credits",
    desiredActionSemantics: ["economy.gain_credit"],
    rationale: ["no answer action is visible; credits preserve future options"],
  });
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isRemoteServer(serverId: string | undefined): boolean {
  return serverId?.startsWith("remote_") === true;
}

function isCentralServer(serverId: string | undefined): boolean {
  return serverId === "hq" || serverId === "rd";
}

function remoteRunNeedsBreakerCoverage(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId) return false;
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server) return false;
  const knownRezzedIce = server.ice.some((ice) => ice.known && ice.rezzed === true);
  if (!knownRezzedIce) return false;
  return !runnerHasVisibleBreaker(playerView);
}

function runnerHasVisibleBreaker(playerView: PlayerView): boolean {
  return (playerView.own.rig ?? []).some(cardLooksLikeBreaker);
}

function isBreakerInstallAction(playerView: PlayerView) {
  return (action: LegalAction): boolean => {
    if (action.type !== "install_card") return false;
    const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
    return sourceCard ? cardLooksLikeBreaker(sourceCard) : /breaker/i.test(action.label);
  };
}

function cardLooksLikeBreaker(card: VisibleCard): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) => /breaker|icebreaker/i.test(subtype)) ||
      /breaker|icebreaker/i.test(card.title ?? "") ||
      /breaker|icebreaker/i.test(card.definitionId ?? ""))
  );
}

function isBankBuildAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    label.includes("auf broker legen") ||
    (label.includes("put") && label.includes("bank")) ||
    (label.includes("bank") && label.includes("counter"))
  );
}

function isBankPayoutAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    label.includes("von broker nehmen") ||
    (label.includes("take") && label.includes("bank")) ||
    (label.includes("cash") && label.includes("bank"))
  );
}

function visibleSourceServerId(
  playerView: PlayerView,
  action: LegalAction,
): string | undefined {
  const source = String(action.source);
  for (const server of playerView.servers) {
    if (
      server.root.some((card) => card.instanceId === source) ||
      server.ice.some((card) => card.instanceId === source)
    ) {
      return server.id;
    }
  }
  return undefined;
}

function visibleCardByInstanceId(
  playerView: PlayerView,
  instanceId: string,
): VisibleCard | undefined {
  const ownCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
  ];
  const serverCards = playerView.servers.flatMap((server) => [
    ...server.ice,
    ...server.root,
  ]);
  return [...ownCards, ...serverCards].find(
    (card) => card.instanceId === instanceId,
  );
}

function remoteIsProtected(playerView: PlayerView, serverId: string): boolean {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return (server?.ice.length ?? 0) > 0;
}

function advanceCompletesScore(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
  if (!sourceCard) return false;
  const currentAdvancement = sourceCard.advancementCounters ?? 0;
  const requirement = sourceCard.advancementRequirement;
  return requirement !== undefined && currentAdvancement + 1 >= requirement;
}

function corpHasSafeScoreAlternative(
  input: AiDecisionInput,
  actionToSkip: LegalAction,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== actionToSkip.actionId &&
      (action.type === "gain_credit" ||
        action.type === "draw_card" ||
        action.type === "install_card" ||
        action.type === "rez_ice" ||
        action.type === "score_agenda"),
  );
}

export function createPlanStep(params: {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities?: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds?: string[];
  rationale?: string[];
}): PlanStep {
  return {
    stepId: params.stepId,
    kind: params.kind,
    desiredActionSemantics: [...params.desiredActionSemantics],
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    ...(params.mappingStatus ? { mappingStatus: params.mappingStatus } : {}),
    actionCandidateIds: [...(params.actionCandidateIds ?? [])],
    rationale: [...(params.rationale ?? [])],
  };
}

export function createTacticalPlan(params: {
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status?: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities?: RequiredCapability[];
  blockers?: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps?: PlanStep[];
  evidence?: string[];
  scoreBreakdown?: PlanScoreBreakdown[];
  stateVersion: number;
}): TacticalPlan {
  const blockers = [...(params.blockers ?? [])];
  const status = params.status ?? (blockers.length > 0 ? "blocked" : "proposed");
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    planId: params.planId,
    side: params.side,
    type: params.type,
    status,
    priority: params.priority,
    horizonTurns: params.horizonTurns,
    ...(params.target ? { target: params.target } : {}),
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    blockers,
    currentStep: params.currentStep,
    nextSteps: [...(params.nextSteps ?? [])],
    evidence: [...(params.evidence ?? [])],
    scoreBreakdown: [...(params.scoreBreakdown ?? [])],
    createdAtStateVersion: params.stateVersion,
    updatedAtStateVersion: params.stateVersion,
  };
}

export function rankTacticalPlans(plans: readonly TacticalPlan[]): TacticalPlan[] {
  return [...plans].sort(
    (left, right) =>
      planStatusRank(right.status) - planStatusRank(left.status) ||
      right.priority - left.priority ||
      left.planId.localeCompare(right.planId),
  );
}

function planStatusRank(status: PlanLifecycle): number {
  switch (status) {
    case "active":
      return 6;
    case "progressing":
      return 5;
    case "proposed":
      return 4;
    case "blocked":
      return 3;
    case "satisfied":
      return 2;
    case "expired":
      return 1;
    case "failed":
      return 0;
  }
}

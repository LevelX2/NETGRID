import type { Side } from "@netgrid/shared";
import {
  assertValidPlanInstance,
  deduplicatePlanProposals,
  instantiatePlanProposal,
  planProposalKey,
} from "./plan-instance";
import type {
  PlanInstance,
  PlanProgress,
  PlanProposal,
} from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  assertTurnPlanCommitment,
  type TurnPlanCommitment,
  type TurnPlanExecutionLease,
} from "./turn-plan-commitment";

export const RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION =
  "resident-plan-portfolio-v2" as const;

export type PlanPortfolioTransitionReason =
  | "discovered"
  | "retained"
  | "executor_selected"
  | "preempted_by_higher_class"
  | "preempted_by_validated_value"
  | "resumed_after_preemption"
  | "outcome_progress"
  | "outcome_no_progress"
  | "completed"
  | "invalidated"
  | "stale_ttl_expired"
  | "target_disappeared"
  | "module_version_evicted";

export type PlanPortfolioTransition = {
  instanceId: string;
  stateVersion: number;
  reason: PlanPortfolioTransitionReason;
  fromExecutionState?: PlanInstance["executionState"];
  toExecutionState?: PlanInstance["executionState"];
  detailCode: string;
};

export type CompletedPlanRecord = {
  instanceId: string;
  moduleId: PlanInstance["moduleId"];
  dedupeKey: string;
  terminalViability: "completed" | "abandoned";
  terminalAtStateVersion: number;
  retainUntilStateVersion: number;
  finalProgress: PlanProgress;
};

export const RESIDENT_CORP_CAMPAIGN_SCHEMA_VERSION =
  "resident-corp-campaign-v1" as const;

export type ResidentCorpCampaignPublicOutcome = {
  outcomeId: string;
  eventId: string;
  eventType: string;
  stateVersionAfter: number;
  kind:
    | "run_declared"
    | "run_completed"
    | "rez_window_opened"
    | "rez_window_resolved"
    | "corp_rez"
    | "trace_started"
    | "trace_resolved"
    | "prevention_window_opened"
    | "prevention_window_resolved"
    | "ambush_triggered"
    | "ambush_resolved"
    | "access_resolved"
    | "card_trashed"
    | "remote_compromised";
  actor?: Side;
  targetServerId?: string;
  targetCardInstanceId?: string;
  milestoneId: string;
  origin: "public_event" | "visible_state_derivation";
  evidenceCode: string;
};

export type ResidentCorpCampaign = {
  schemaVersion: typeof RESIDENT_CORP_CAMPAIGN_SCHEMA_VERSION;
  campaignId: string;
  kind: "agenda" | "defense" | "opening_rush";
  status:
    | "awaiting_opponent_outcome"
    | "continuable"
    | "blocked"
    | "completed"
    | "abandoned";
  origin: {
    rootPlanInstanceId: string;
    moduleId: "corp.score_agenda" | "corp.defend_servers";
    targetServerId?: string;
    targetCardInstanceId?: string;
    openingRushOpportunityKey?: string;
  };
  milestoneId: string;
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
  observedThroughStateVersion: number;
  requote: {
    status:
      | "current"
      | "awaiting_next_own_turn"
      | "required_now"
      | "not_applicable";
    reasonCode: string;
    lastQuotedAtStateVersion?: number;
  };
  reaction: {
    status: "idle" | "paused" | "resumable" | "expired" | "terminal";
    openWindowKinds: Array<"rez" | "trace" | "prevention" | "ambush">;
    deadline: "none" | "current_run_end" | "next_own_turn";
    claimDisposition: "active" | "reserved" | "requote_required" | "released";
    reasonCode: string;
    lastTransitionAtStateVersion: number;
  };
  publicOutcomes: ResidentCorpCampaignPublicOutcome[];
  evidenceCodes: string[];
};

export type ResidentPlanPortfolio = {
  schemaVersion: typeof RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION;
  side: Side;
  stateVersion: number;
  rootForegroundInstanceId?: string;
  executorInstanceId?: string;
  instances: PlanInstance[];
  completionHistory: CompletedPlanRecord[];
  transitions: PlanPortfolioTransition[];
  campaigns?: ResidentCorpCampaign[];
  turnPlanCommitment?: TurnPlanCommitment;
  turnPlanExecutionLease?: TurnPlanExecutionLease;
  selectedActionOrigin?: ResidentSelectedActionOrigin;
};

export type ResidentSelectedActionOrigin = Readonly<{
  rootPlanInstanceId: string;
  executorInstanceId: string;
  selectedActionId: string;
  selectedAtStateVersion: number;
}> &
  (
    | Readonly<{
        immediateChoicePolicy: "trash_lowest_visible_drawn_card";
      }>
    | Readonly<{
        immediateChoicePolicy: "select_bound_corp_archives_cards_to_hq";
        sourceCardInstanceId: string;
        sourceCardDefinitionId: string;
        selectionMode: "one" | "all";
        eligibleArchiveCardInstanceIds: string[];
        selectedArchiveCardInstanceIds: string[];
      }>
    | Readonly<{
        immediateChoicePolicy: "resolve_runner_run_start_order";
        sourceStepId: string;
        sourceActionType: "start_run";
      }>
    | Readonly<{
        immediateChoicePolicy: "resolve_runner_vacuum_link_rewind";
        sourceStepId: string;
        sourceActionType: "continue_run";
        sourceCardInstanceId: string;
        sourceCardDefinitionId: string;
      }>
    | Readonly<{
        immediateChoicePolicy: "resolve_runner_program_trash_before_install";
        sourceCardInstanceId: string;
        requiredMemoryToFree: number;
        selectedCards: Array<{
          cardInstanceId: string;
          memoryCost: number;
        }>;
      }>
  );

export type ReconcileResidentPlanPortfolioParams = {
  side: Side;
  stateVersion: number;
  timingPoint: string;
  proposals: readonly PlanProposal[];
  previous?: ResidentPlanPortfolio;
  selectedExecutorInstanceId?: string;
  selectionReason?:
    | "executor_selected"
    | "preempted_by_higher_class"
    | "preempted_by_validated_value";
};

export type PlanOutcomeReceipt = {
  planInstanceId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  progress:
    | "progress"
    | "no_progress"
    | "regression"
    | "completed"
    | "invalidated";
  progressValue: number;
  milestoneAfter: string;
  reasonCode: string;
};

export function reconcileResidentPlanPortfolio(
  params: ReconcileResidentPlanPortfolioParams,
): ResidentPlanPortfolio {
  assertPortfolioInput(params);
  const proposals = deduplicatePlanProposals(
    params.proposals,
    params.stateVersion,
  );
  const wrongSideProposal = proposals.find(
    (proposal) => proposal.side !== params.side,
  );
  if (wrongSideProposal) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: params.side,
      stateVersion: params.stateVersion,
      timingPoint: params.timingPoint,
      legalActionTypes: [],
      owner: "plan_registry",
      removalCondition:
        "A side-specific scheduler may reconcile only proposals for its own side.",
      planInstanceId: `proposal:${wrongSideProposal.moduleId}:${wrongSideProposal.dedupeKey}`,
    });
  }
  const previousInstances = new Map(
    (params.previous?.instances ?? []).map((instance) => [
      planProposalKey(instance),
      structuredClone(instance),
    ]),
  );
  const proposalKeys = new Set(proposals.map(planProposalKey));
  const transitions: PlanPortfolioTransition[] = [];
  const nextInstances: PlanInstance[] = [];

  for (const proposal of proposals) {
    const key = planProposalKey(proposal);
    const previous = previousInstances.get(key);
    if (!previous) {
      const created = instantiatePlanProposal(proposal, params.stateVersion);
      nextInstances.push(created);
      transitions.push(
        transition(created, params.stateVersion, "discovered", "new_proposal"),
      );
      continue;
    }
    if (previous.moduleVersion !== proposal.moduleVersion) {
      transitions.push(
        transition(
          previous,
          params.stateVersion,
          "module_version_evicted",
          "module_contract_changed",
        ),
      );
      const replaced = instantiatePlanProposal(proposal, params.stateVersion);
      nextInstances.push(replaced);
      transitions.push(
        transition(
          replaced,
          params.stateVersion,
          "discovered",
          "replacement_instance",
        ),
      );
      continue;
    }
    const retained = refreshFromProposal(
      previous,
      proposal,
      params.stateVersion,
    );
    nextInstances.push(retained);
    transitions.push(
      transition(
        retained,
        params.stateVersion,
        "retained",
        "proposal_still_relevant",
      ),
    );
  }

  for (const [key, previous] of previousInstances) {
    if (proposalKeys.has(key)) continue;
    const retention = retentionDecision(previous, params.stateVersion);
    if (retention.retain) {
      nextInstances.push({
        ...structuredClone(previous),
        viability: "dormant",
        portfolioRole: "unassigned",
        executionState: "idle",
      });
      transitions.push(
        transition(previous, params.stateVersion, "retained", retention.code),
      );
    } else {
      transitions.push(
        transition(
          previous,
          params.stateVersion,
          retention.reason,
          retention.code,
        ),
      );
    }
  }

  let portfolio: ResidentPlanPortfolio = {
    schemaVersion: RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION,
    side: params.side,
    stateVersion: params.stateVersion,
    instances: stableInstances(nextInstances),
    completionHistory: pruneHistory(
      params.previous?.completionHistory ?? [],
      params.stateVersion,
    ),
    transitions,
    ...(params.previous?.campaigns
      ? { campaigns: structuredClone(params.previous.campaigns) }
      : {}),
    ...(params.previous?.turnPlanCommitment
      ? {
          turnPlanCommitment: structuredClone(
            params.previous.turnPlanCommitment,
          ),
        }
      : {}),
    ...(params.previous?.turnPlanExecutionLease
      ? {
          turnPlanExecutionLease: structuredClone(
            params.previous.turnPlanExecutionLease,
          ),
        }
      : {}),
  };
  portfolio = assignExecutor(
    portfolio,
    params.selectedExecutorInstanceId,
    params.selectionReason ?? "executor_selected",
    params.timingPoint,
  );
  assertResidentPlanPortfolio(portfolio, params.timingPoint);
  return portfolio;
}

export function applyPlanOutcomeReceipt(
  portfolio: ResidentPlanPortfolio,
  receipt: PlanOutcomeReceipt,
  timingPoint: string,
): ResidentPlanPortfolio {
  assertNoActionReference(receipt, portfolio, timingPoint);
  if (
    receipt.stateVersionBefore !== portfolio.stateVersion ||
    receipt.stateVersionAfter <= receipt.stateVersionBefore
  ) {
    throw portfolioFailure(
      "stale_or_future_action_reference",
      portfolio,
      timingPoint,
      receipt.planInstanceId,
      "Apply only an outcome observed directly after the portfolio state.",
    );
  }
  const instance = portfolio.instances.find(
    (candidate) => candidate.instanceId === receipt.planInstanceId,
  );
  if (!instance) {
    throw portfolioFailure(
      "invalid_plan_identity",
      portfolio,
      timingPoint,
      receipt.planInstanceId,
      "Apply outcomes only to resident plan instances.",
    );
  }

  const updated = structuredClone(instance);
  updated.updatedAtStateVersion = receipt.stateVersionAfter;
  updated.milestone = receipt.milestoneAfter;
  updated.progress = {
    status: receipt.progress,
    value: receipt.progressValue,
    milestone: receipt.milestoneAfter,
    reasonCode: receipt.reasonCode,
  };
  if (receipt.progress === "progress" || receipt.progress === "completed") {
    updated.lastProductiveAtStateVersion = receipt.stateVersionAfter;
  }

  const terminal =
    receipt.progress === "completed" || receipt.progress === "invalidated";
  updated.viability = terminal
    ? receipt.progress === "completed"
      ? "completed"
      : "abandoned"
    : updated.viability;
  updated.executionState = terminal ? "idle" : updated.executionState;
  updated.portfolioRole = terminal ? "unassigned" : updated.portfolioRole;
  if (terminal) {
    updated.openNeedIds = [];
    delete updated.commitmentId;
  }
  assertValidPlanInstance(updated);

  const history = terminal
    ? [
        ...portfolio.completionHistory,
        completedRecord(updated, receipt.stateVersionAfter),
      ]
    : portfolio.completionHistory;
  const next: ResidentPlanPortfolio = {
    ...portfolio,
    stateVersion: receipt.stateVersionAfter,
    instances: terminal
      ? portfolio.instances.filter(
          (candidate) => candidate.instanceId !== updated.instanceId,
        )
      : portfolio.instances.map((candidate) =>
          candidate.instanceId === updated.instanceId ? updated : candidate,
        ),
    completionHistory: pruneHistory(history, receipt.stateVersionAfter),
    transitions: [
      ...portfolio.transitions,
      transition(
        updated,
        receipt.stateVersionAfter,
        receipt.progress === "completed"
          ? "completed"
          : receipt.progress === "invalidated"
            ? "invalidated"
            : receipt.progress === "no_progress"
              ? "outcome_no_progress"
              : "outcome_progress",
        receipt.reasonCode,
      ),
    ],
  };
  if (portfolio.executorInstanceId === updated.instanceId && terminal) {
    delete next.executorInstanceId;
  }
  if (portfolio.rootForegroundInstanceId === updated.instanceId && terminal) {
    delete next.rootForegroundInstanceId;
  }
  assertResidentPlanPortfolio(next, timingPoint);
  return next;
}

export function assertResidentPlanPortfolio(
  portfolio: ResidentPlanPortfolio,
  timingPoint: string,
): void {
  const executors = portfolio.instances.filter(
    (instance) => instance.executionState === "executor",
  );
  const ids = new Set(
    portfolio.instances.map((instance) => instance.instanceId),
  );
  const duplicateCount = portfolio.instances.length - ids.size;
  const executor = portfolio.executorInstanceId
    ? portfolio.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )
    : undefined;
  if (
    portfolio.schemaVersion !== RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION ||
    duplicateCount > 0 ||
    executors.length > 1 ||
    (portfolio.executorInstanceId !== undefined &&
      (executors.length !== 1 || !executor)) ||
    (executor !== undefined && executor.executionState !== "executor")
  ) {
    throw portfolioFailure(
      "executor_invariant_broken",
      portfolio,
      timingPoint,
      portfolio.executorInstanceId,
      "Keep stable unique instances and assign at most one ready leaf executor.",
    );
  }
  for (const instance of portfolio.instances) assertValidPlanInstance(instance);
  if (portfolio.campaigns) {
    const campaignIds = new Set(
      portfolio.campaigns.map((campaign) => campaign.campaignId),
    );
    if (
      campaignIds.size !== portfolio.campaigns.length ||
      portfolio.campaigns.some(
        (campaign) =>
          campaign.schemaVersion !== RESIDENT_CORP_CAMPAIGN_SCHEMA_VERSION ||
          campaign.campaignId.trim().length === 0 ||
          campaign.origin.rootPlanInstanceId.trim().length === 0 ||
          campaign.milestoneId.trim().length === 0 ||
          campaign.createdAtStateVersion > campaign.updatedAtStateVersion ||
          campaign.updatedAtStateVersion > portfolio.stateVersion ||
          campaign.observedThroughStateVersion > portfolio.stateVersion ||
          campaign.reaction.lastTransitionAtStateVersion >
            portfolio.stateVersion ||
          new Set(campaign.reaction.openWindowKinds).size !==
            campaign.reaction.openWindowKinds.length ||
          recursiveKeys(campaign).some((key) =>
            key.toLocaleLowerCase("en-US").includes("actionid"),
          ),
      )
    ) {
      throw portfolioFailure(
        "executor_invariant_broken",
        portfolio,
        timingPoint,
        portfolio.executorInstanceId,
        "Keep resident Corp campaigns unique, state-bound and free of current or future action identifiers.",
      );
    }
  }
  if (portfolio.turnPlanCommitment) {
    assertTurnPlanCommitment(portfolio.turnPlanCommitment);
    const lease = portfolio.turnPlanExecutionLease;
    if (
      lease &&
      (lease.commitmentId !== portfolio.turnPlanCommitment.commitmentId ||
        lease.sourcePlanId !== portfolio.turnPlanCommitment.sourcePlanId ||
        lease.stateIdentity.stateVersion > portfolio.stateVersion)
    ) {
      throw portfolioFailure(
        "executor_invariant_broken",
        portfolio,
        timingPoint,
        portfolio.executorInstanceId,
        "Keep a pending TurnPlan execution lease bound to the persisted commitment and no later than the current portfolio state.",
      );
    }
  } else if (portfolio.turnPlanExecutionLease) {
    throw portfolioFailure(
      "executor_invariant_broken",
      portfolio,
      timingPoint,
      portfolio.executorInstanceId,
      "Persist a TurnPlan execution lease only together with its commitment.",
    );
  }
  const selectedActionOrigin = portfolio.selectedActionOrigin;
  if (selectedActionOrigin) {
    const root = portfolio.instances.find(
      (instance) =>
        instance.instanceId === selectedActionOrigin.rootPlanInstanceId,
    );
    const executor = portfolio.instances.find(
      (instance) =>
        instance.instanceId === selectedActionOrigin.executorInstanceId,
    );
    const originPolicyValid =
      selectedActionOrigin.immediateChoicePolicy ===
        "trash_lowest_visible_drawn_card" ||
      (selectedActionOrigin.immediateChoicePolicy ===
        "resolve_runner_run_start_order" &&
        selectedActionOrigin.sourceStepId.trim().length > 0 &&
        selectedActionOrigin.sourceActionType === "start_run") ||
      (selectedActionOrigin.immediateChoicePolicy ===
        "resolve_runner_vacuum_link_rewind" &&
        selectedActionOrigin.sourceStepId.trim().length > 0 &&
        selectedActionOrigin.sourceActionType === "continue_run" &&
        selectedActionOrigin.sourceCardInstanceId.trim().length > 0 &&
        selectedActionOrigin.sourceCardDefinitionId ===
          "onr_v1_275_vacuum-link") ||
      (selectedActionOrigin.immediateChoicePolicy ===
        "resolve_runner_program_trash_before_install" &&
        selectedActionOrigin.sourceCardInstanceId.trim().length > 0 &&
        Number.isInteger(selectedActionOrigin.requiredMemoryToFree) &&
        selectedActionOrigin.requiredMemoryToFree > 0 &&
        selectedActionOrigin.selectedCards.length > 0 &&
        new Set(
          selectedActionOrigin.selectedCards.map(
            (card) => card.cardInstanceId,
          ),
        ).size === selectedActionOrigin.selectedCards.length &&
        selectedActionOrigin.selectedCards.every(
          (card) =>
            card.cardInstanceId.trim().length > 0 &&
            Number.isInteger(card.memoryCost) &&
            card.memoryCost > 0,
        ) &&
        selectedActionOrigin.selectedCards.reduce(
          (total, card) => total + card.memoryCost,
          0,
        ) >= selectedActionOrigin.requiredMemoryToFree) ||
      (selectedActionOrigin.immediateChoicePolicy ===
        "select_bound_corp_archives_cards_to_hq" &&
        selectedActionOrigin.sourceCardInstanceId.trim().length > 0 &&
        selectedActionOrigin.sourceCardDefinitionId.trim().length > 0 &&
        (selectedActionOrigin.selectionMode === "one" ||
          selectedActionOrigin.selectionMode === "all") &&
        selectedActionOrigin.eligibleArchiveCardInstanceIds.length > 0 &&
        new Set(selectedActionOrigin.eligibleArchiveCardInstanceIds).size ===
          selectedActionOrigin.eligibleArchiveCardInstanceIds.length &&
        selectedActionOrigin.selectedArchiveCardInstanceIds.length > 0 &&
        new Set(selectedActionOrigin.selectedArchiveCardInstanceIds).size ===
          selectedActionOrigin.selectedArchiveCardInstanceIds.length &&
        selectedActionOrigin.selectedArchiveCardInstanceIds.every((cardId) =>
          selectedActionOrigin.eligibleArchiveCardInstanceIds.includes(cardId),
        ) &&
        (selectedActionOrigin.selectionMode !== "one" ||
          selectedActionOrigin.selectedArchiveCardInstanceIds.length === 1) &&
        (selectedActionOrigin.selectionMode !== "all" ||
          selectedActionOrigin.selectedArchiveCardInstanceIds.length ===
            selectedActionOrigin.eligibleArchiveCardInstanceIds.length));
    if (
      selectedActionOrigin.selectedActionId.trim().length === 0 ||
      selectedActionOrigin.selectedAtStateVersion !== portfolio.stateVersion ||
      !originPolicyValid ||
      !root ||
      !executor ||
      portfolio.rootForegroundInstanceId !== root.instanceId ||
      portfolio.executorInstanceId !== executor.instanceId ||
      executor.executionState !== "executor"
    ) {
      throw portfolioFailure(
        "executor_invariant_broken",
        portfolio,
        timingPoint,
        selectedActionOrigin.executorInstanceId,
        "Bind a possible immediate choice only to the exact current root, executor, selected action and state version.",
      );
    }
  }
}

export function selectResidentPlanPortfolioExecutor(params: {
  portfolio: ResidentPlanPortfolio;
  selectedExecutorInstanceId: string;
  timingPoint: string;
  reason: "executor_selected" | "preempted_by_validated_value";
}): ResidentPlanPortfolio {
  const selected = assignExecutor(
    structuredClone(params.portfolio),
    params.selectedExecutorInstanceId,
    params.reason,
    params.timingPoint,
  );
  assertResidentPlanPortfolio(selected, params.timingPoint);
  return selected;
}

function assignExecutor(
  portfolio: ResidentPlanPortfolio,
  selectedId: string | undefined,
  reason: NonNullable<ReconcileResidentPlanPortfolioParams["selectionReason"]>,
  timingPoint: string,
): ResidentPlanPortfolio {
  const previousExecutorId = portfolio.instances.find(
    (instance) => instance.executionState === "executor",
  )?.instanceId;
  if (!selectedId) {
    return {
      ...portfolio,
      instances: portfolio.instances.map(clearAssignment),
    };
  }
  const selected = portfolio.instances.find(
    (instance) => instance.instanceId === selectedId,
  );
  if (!selected || selected.viability !== "ready") {
    throw portfolioFailure(
      "executor_invariant_broken",
      portfolio,
      timingPoint,
      selectedId,
      "Select exactly one resident ready plan as executor.",
    );
  }
  const rootId = rootAncestorId(selected, portfolio.instances);
  const transitions = [...portfolio.transitions];
  const instances = portfolio.instances.map((instance) => {
    const before = instance.executionState;
    const next = structuredClone(instance);
    if (instance.instanceId === selectedId) {
      next.executionState = "executor";
      next.portfolioRole =
        instance.instanceId === rootId ? "foreground" : "background";
      if (before === "preempted") {
        transitions.push(
          transition(
            next,
            portfolio.stateVersion,
            "resumed_after_preemption",
            "selected_again",
            before,
            next.executionState,
          ),
        );
      } else if (before !== "executor") {
        transitions.push(
          transition(
            next,
            portfolio.stateVersion,
            reason,
            "validated_scheduler_selection",
            before,
            next.executionState,
          ),
        );
      }
    } else if (
      instance.executionState === "executor" ||
      (previousExecutorId === instance.instanceId &&
        instance.instanceId !== selectedId)
    ) {
      next.executionState =
        instance.viability === "ready" ? "preempted" : "idle";
      next.portfolioRole =
        instance.executionClass === "urgent_response"
          ? "response_candidate"
          : "background";
      transitions.push(
        transition(
          next,
          portfolio.stateVersion,
          reason,
          "scheduler_changed_executor",
          before,
          next.executionState,
        ),
      );
    } else {
      next.executionState =
        instance.executionState === "preempted" ? "preempted" : "idle";
      next.portfolioRole =
        instance.instanceId === rootId
          ? "foreground"
          : instance.executionClass === "urgent_response"
            ? "response_candidate"
            : "background";
    }
    assertValidPlanInstance(next);
    return next;
  });
  return {
    ...portfolio,
    rootForegroundInstanceId: rootId,
    executorInstanceId: selectedId,
    instances,
    transitions,
  };
}

function clearAssignment(instance: PlanInstance): PlanInstance {
  const next = structuredClone(instance);
  next.executionState = "idle";
  next.portfolioRole =
    next.executionClass === "urgent_response"
      ? "response_candidate"
      : "background";
  return next;
}

function rootAncestorId(
  selected: PlanInstance,
  instances: readonly PlanInstance[],
): string {
  const byId = new Map(
    instances.map((instance) => [instance.instanceId, instance]),
  );
  const visited = new Set<string>();
  let current = selected;
  while (current.parentInstanceId) {
    if (visited.has(current.instanceId)) break;
    visited.add(current.instanceId);
    const parent = byId.get(current.parentInstanceId);
    if (!parent) break;
    current = parent;
  }
  return current.instanceId;
}

function refreshFromProposal(
  instance: PlanInstance,
  proposal: PlanProposal,
  stateVersion: number,
): PlanInstance {
  const next = structuredClone(instance);
  next.strategyLineIds = [...new Set(proposal.strategyLineIds)].sort();
  next.executionClass = proposal.executionClass;
  next.viability = proposal.initialViability;
  next.persistencePolicy = proposal.persistencePolicy;
  next.retentionPolicy = structuredClone(proposal.retentionPolicy);
  if (proposal.target) next.target = structuredClone(proposal.target);
  else delete next.target;
  if (proposal.parentInstanceId)
    next.parentInstanceId = proposal.parentInstanceId;
  else delete next.parentInstanceId;
  if (proposal.parentNeedId !== undefined)
    next.parentNeedId = proposal.parentNeedId;
  else delete next.parentNeedId;
  next.phase = proposal.phase;
  next.milestone = proposal.milestone;
  next.moduleState = structuredClone(proposal.moduleState);
  next.blockers = structuredClone(proposal.blockers);
  if (proposal.initialViability !== "ready") next.openNeedIds = [];
  next.resumeConditions = structuredClone(proposal.resumeConditions);
  next.completionConditions = structuredClone(proposal.completionConditions);
  next.abandonmentConditions = structuredClone(proposal.abandonmentConditions);
  if (proposal.cadence) next.cadence = structuredClone(proposal.cadence);
  else delete next.cadence;
  next.evidenceRefs = structuredClone(proposal.evidenceRefs);
  next.updatedAtStateVersion = stateVersion;
  if (next.viability !== "ready") next.executionState = "idle";
  assertValidPlanInstance(next);
  return next;
}

function retentionDecision(
  instance: PlanInstance,
  stateVersion: number,
):
  | { retain: true; code: string }
  | {
      retain: false;
      code: string;
      reason: "stale_ttl_expired" | "target_disappeared";
    } {
  if (
    (instance.openNeedIds.length > 0 &&
      instance.retentionPolicy.protectedWhileNeedOpen) ||
    (instance.commitmentId && instance.retentionPolicy.protectedWhileCommitted)
  ) {
    return { retain: true, code: "retention_protected" };
  }
  if (instance.target && instance.retentionPolicy.abandonWhenTargetMissing) {
    return {
      retain: false,
      code: "proposal_missing_target_contract",
      reason: "target_disappeared",
    };
  }
  const ttl =
    instance.viability === "blocked"
      ? instance.retentionPolicy.blockedStateVersionTtl
      : instance.retentionPolicy.dormantStateVersionTtl;
  if (stateVersion - instance.updatedAtStateVersion <= ttl) {
    return { retain: true, code: "within_stale_ttl" };
  }
  return {
    retain: false,
    code: "stale_ttl_elapsed",
    reason: "stale_ttl_expired",
  };
}

function completedRecord(
  instance: PlanInstance,
  stateVersion: number,
): CompletedPlanRecord {
  return {
    instanceId: instance.instanceId,
    moduleId: instance.moduleId,
    dedupeKey: instance.dedupeKey,
    terminalViability:
      instance.viability === "completed" ? "completed" : "abandoned",
    terminalAtStateVersion: stateVersion,
    retainUntilStateVersion:
      stateVersion + instance.retentionPolicy.completedHistoryStateVersionTtl,
    finalProgress: structuredClone(instance.progress),
  };
}

function pruneHistory(
  history: readonly CompletedPlanRecord[],
  stateVersion: number,
): CompletedPlanRecord[] {
  return history
    .filter((record) => record.retainUntilStateVersion >= stateVersion)
    .map((record) => structuredClone(record))
    .sort(
      (left, right) =>
        left.terminalAtStateVersion - right.terminalAtStateVersion ||
        left.instanceId.localeCompare(right.instanceId),
    );
}

function stableInstances(instances: readonly PlanInstance[]): PlanInstance[] {
  return [...instances]
    .map((instance) => structuredClone(instance))
    .sort((left, right) => left.instanceId.localeCompare(right.instanceId));
}

function transition(
  instance: PlanInstance,
  stateVersion: number,
  reason: PlanPortfolioTransitionReason,
  detailCode: string,
  fromExecutionState?: PlanInstance["executionState"],
  toExecutionState?: PlanInstance["executionState"],
): PlanPortfolioTransition {
  return {
    instanceId: instance.instanceId,
    stateVersion,
    reason,
    ...(fromExecutionState ? { fromExecutionState } : {}),
    ...(toExecutionState ? { toExecutionState } : {}),
    detailCode,
  };
}

function assertPortfolioInput(
  params: ReconcileResidentPlanPortfolioParams,
): void {
  if (
    params.previous &&
    (params.previous.schemaVersion !== RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION ||
      params.previous.side !== params.side ||
      params.previous.stateVersion > params.stateVersion)
  ) {
    throw portfolioFailure(
      "invalid_plan_identity",
      {
        schemaVersion: RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION,
        side: params.side,
        stateVersion: params.stateVersion,
        instances: [],
        completionHistory: [],
        transitions: [],
      },
      params.timingPoint,
      undefined,
      "Discard legacy or future portfolio snapshots instead of migrating them.",
    );
  }
}

function assertNoActionReference(
  receipt: PlanOutcomeReceipt,
  portfolio: ResidentPlanPortfolio,
  timingPoint: string,
): void {
  const keys = recursiveKeys(receipt);
  if (!keys.some((key) => key.toLocaleLowerCase("en-US").includes("actionid")))
    return;
  throw portfolioFailure(
    "executor_invariant_broken",
    portfolio,
    timingPoint,
    receipt.planInstanceId,
    "Derive plan progress from semantic outcome receipts, never action ids.",
  );
}

function recursiveKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...recursiveKeys(nested),
  ]);
}

function portfolioFailure(
  code:
    | "invalid_plan_identity"
    | "executor_invariant_broken"
    | "stale_or_future_action_reference",
  portfolio: ResidentPlanPortfolio,
  timingPoint: string,
  planInstanceId: string | undefined,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure(code, {
    side: portfolio.side,
    stateVersion: portfolio.stateVersion,
    timingPoint,
    legalActionTypes: [],
    owner: "plan_registry",
    removalCondition,
    ...(planInstanceId ? { planInstanceId } : {}),
    candidateCount: portfolio.instances.length,
  });
}

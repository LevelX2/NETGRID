import type { AiDecisionInput, Side } from "@netgrid/shared";
import type {
  PlanStepKind,
  PlanTarget,
  TacticalPlan,
  TacticalPlanType,
} from "./tactical-plan-types";

export const PLAN_PORTFOLIO_SCHEMA_VERSION = "plan-portfolio-v1" as const;

export type PlanExecutionClass =
  | "reactive_interrupt"
  | "bounded_sequence"
  | "recurring_cycle"
  | "development_project";

export type PlanPortfolioRole =
  | "reactive_interrupt"
  | "foreground"
  | "background";

export type PlanPortfolioLifecycle =
  | "active"
  | "dormant"
  | "blocked"
  | "suspended"
  | "ready"
  | "completed"
  | "abandoned";

export type PlanPortfolioPlanType = TacticalPlanType;

export type PlanPortfolioEntry = {
  portfolioEntryId: string;
  sourcePlanId: string;
  planType: PlanPortfolioPlanType;
  side: Side;
  executionClass: PlanExecutionClass;
  role: PlanPortfolioRole;
  lifecycle: PlanPortfolioLifecycle;
  priority: number;
  target?: PlanTarget;
  parentEntryId?: string;
  supportsEntryIds: string[];
  milestone: string;
  progress: number;
  selectedStepKind?: PlanStepKind;
  actionCandidateIds: string[];
  cadence: {
    turnKey: string;
    maxActionsPerTurn: number;
    actionsUsedThisTurn: number;
    lastProgressTurnKey?: string;
  };
  resourceReservation: {
    credits: number;
    clicks: number;
  };
  updatedAtStateVersion: number;
  evidence: string[];
};

export type PlanPortfolioSnapshot = {
  schemaVersion: typeof PLAN_PORTFOLIO_SCHEMA_VERSION;
  side: Side;
  profileId: string;
  stateVersion: number;
  turnKey: string;
  interrupt?: PlanPortfolioEntry;
  foreground?: PlanPortfolioEntry;
  backgrounds: PlanPortfolioEntry[];
  rejectedEntryIds: string[];
  evidence: string[];
};

export type BuildPlanPortfolioParams = {
  input: AiDecisionInput;
  tacticalPlans: readonly TacticalPlan[];
  previous?: PlanPortfolioSnapshot;
  turnKey?: string;
};

export type PlanActionContributionKind =
  | "progress"
  | "enable"
  | "fund"
  | "protect"
  | "convert"
  | "complete";

export type PlanActionContribution = {
  actionId: string;
  portfolioEntryId: string;
  contributionKind: PlanActionContributionKind;
  value: number;
  milestoneAfter?: string;
  evidence: string[];
};

export type PlanActionContributionScore = {
  actionId: string;
  totalValue: number;
  interruptValue: number;
  foregroundValue: number;
  backgroundValue: number;
  multiPlanBonus: number;
  contributionCount: number;
  portfolioEntryIds: string[];
  evidence: string[];
};

const MAX_BACKGROUND_PROJECTS = 2;
const BACKGROUND_CONTRIBUTION_CAP = 600;
const MULTI_PLAN_ACTION_BONUS = 80;

export function buildPlanPortfolio(
  params: BuildPlanPortfolioParams,
): PlanPortfolioSnapshot {
  const turnKey = params.turnKey ?? planPortfolioTurnKey(params.input);
  const previous = validPreviousPortfolio(params.input, params.previous);
  const currentEntries = params.tacticalPlans
    .filter(planEligibleForPortfolio)
    .map((plan) => {
      const previousEntry = findPreviousEntry(previous, plan);
      return adaptTacticalPlanToPortfolioEntry({
        plan,
        turnKey,
        ...(previousEntry ? { previousEntry } : {}),
      });
    });
  const interrupt = currentEntries
    .filter((entry) => entry.role === "reactive_interrupt")
    .sort(comparePortfolioEntries)[0];
  const foreground = currentEntries
    .filter((entry) => entry.role === "foreground")
    .sort(comparePortfolioEntries)[0];
  const currentBackgrounds = currentEntries.filter(
    (entry) => entry.role === "background",
  );
  const carriedBackgrounds = (previous?.backgrounds ?? [])
    .filter(
      (entry) =>
        !currentBackgrounds.some(
          (current) => current.portfolioEntryId === entry.portfolioEntryId,
        ) &&
        entry.lifecycle !== "completed" &&
        entry.lifecycle !== "abandoned",
    )
    .map((entry) => carryDormantBackground(entry, turnKey));
  const rankedBackgrounds = [...currentBackgrounds, ...carriedBackgrounds].sort(
    comparePortfolioEntries,
  );
  const backgrounds = rankedBackgrounds
    .slice(0, MAX_BACKGROUND_PROJECTS)
    .map((entry) =>
      interrupt ? suspendPortfolioEntry(entry, interrupt) : resumeEntry(entry),
    );
  const selectedForeground = foreground
    ? interrupt
      ? suspendPortfolioEntry(foreground, interrupt)
      : resumeEntry(foreground)
    : undefined;
  const snapshot: PlanPortfolioSnapshot = {
    schemaVersion: PLAN_PORTFOLIO_SCHEMA_VERSION,
    side: params.input.side,
    profileId: params.input.profileId,
    stateVersion: params.input.playerView.stateVersion,
    turnKey,
    ...(interrupt ? { interrupt: resumeEntry(interrupt) } : {}),
    ...(selectedForeground ? { foreground: selectedForeground } : {}),
    backgrounds,
    rejectedEntryIds: rankedBackgrounds
      .slice(MAX_BACKGROUND_PROJECTS)
      .map((entry) => entry.portfolioEntryId),
    evidence: [
      "plan_portfolio_source:tactical_plan_adapter",
      `plan_portfolio_interrupt:${interrupt?.planType ?? "none"}`,
      `plan_portfolio_foreground:${foreground?.planType ?? "none"}`,
      `plan_portfolio_backgrounds:${
        backgrounds.map((entry) => entry.planType).join("|") || "none"
      }`,
      `plan_portfolio_rejected:${Math.max(
        0,
        rankedBackgrounds.length - MAX_BACKGROUND_PROJECTS,
      )}`,
    ],
  };
  return snapshot;
}

export function planPortfolioTurnKey(input: AiDecisionInput): string {
  const byId = new Map(
    [...input.playerView.publicEvents, ...input.eventTail].map((event) => [
      event.eventId,
      event,
    ]),
  );
  const history = [...byId.values()].sort(
    (left, right) =>
      left.stateVersionAfter - right.stateVersionAfter ||
      left.eventId.localeCompare(right.eventId),
  );
  const turnStarts = history.filter((event) => {
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (input.side === "corp") {
      return actionType === "mandatory_draw" && actor === "corp";
    }
    return actionType === "end_turn" && actor === "corp";
  }).length;
  return `${input.side}:turn:${turnStarts}`;
}

export function advancePlanPortfolioForSelectedAction(
  portfolio: PlanPortfolioSnapshot,
  selectedActionId: string,
): PlanPortfolioSnapshot {
  const advance = (entry: PlanPortfolioEntry): PlanPortfolioEntry => {
    if (!entry.actionCandidateIds.includes(selectedActionId)) return entry;
    return {
      ...entry,
      lifecycle: entry.lifecycle === "suspended" ? "suspended" : "active",
      progress: Math.min(1, entry.progress + 0.1),
      cadence: {
        ...entry.cadence,
        actionsUsedThisTurn: entry.cadence.actionsUsedThisTurn + 1,
        lastProgressTurnKey: portfolio.turnKey,
      },
      evidence: [
        ...entry.evidence,
        `plan_portfolio_action_progress:${selectedActionId}`,
      ],
    };
  };
  return {
    ...portfolio,
    ...(portfolio.interrupt ? { interrupt: advance(portfolio.interrupt) } : {}),
    ...(portfolio.foreground
      ? { foreground: advance(portfolio.foreground) }
      : {}),
    backgrounds: portfolio.backgrounds.map(advance),
    evidence: [
      ...portfolio.evidence,
      `plan_portfolio_selected_action:${selectedActionId}`,
    ],
  };
}

export function planPortfolioEntryForPlan(
  portfolio: PlanPortfolioSnapshot,
  plan: TacticalPlan,
): PlanPortfolioEntry | undefined {
  const entryId = tacticalPlanPortfolioEntryId(plan);
  return allPortfolioEntries(portfolio).find(
    (entry) => entry.portfolioEntryId === entryId,
  );
}

export function planPortfolioEntryCanAct(entry: PlanPortfolioEntry): boolean {
  if (
    entry.lifecycle === "suspended" ||
    entry.lifecycle === "completed" ||
    entry.lifecycle === "abandoned" ||
    entry.lifecycle === "blocked"
  ) {
    return false;
  }
  return (
    entry.role !== "background" ||
    entry.cadence.actionsUsedThisTurn < entry.cadence.maxActionsPerTurn
  );
}

export function buildPlanPortfolioActionContributions(
  portfolio: PlanPortfolioSnapshot,
): PlanActionContribution[] {
  return allPortfolioEntries(portfolio).flatMap((entry) => {
    if (!planPortfolioEntryCanAct(entry)) return [];
    const roleValue =
      entry.role === "reactive_interrupt"
        ? 1_000
        : entry.role === "foreground"
          ? 800
          : 300;
    return entry.actionCandidateIds.map((actionId) => ({
      actionId,
      portfolioEntryId: entry.portfolioEntryId,
      contributionKind: "progress" as const,
      value: roleValue + Math.min(150, Math.max(0, entry.priority) / 10),
      milestoneAfter: entry.milestone,
      evidence: [
        `plan_contribution_role:${entry.role}`,
        `plan_contribution_plan:${entry.planType}`,
      ],
    }));
  });
}

export function redactedPlanActionContributionFacts(
  scores: readonly PlanActionContributionScore[],
): string[] {
  return scores
    .slice(0, 8)
    .flatMap((score) => [
      `plan_action_contribution:${score.actionId}:${Math.round(score.totalValue)}`,
      `plan_action_contribution_entries:${score.actionId}:${score.portfolioEntryIds.join("|")}`,
      `plan_action_contribution_multi_plan:${score.actionId}:${score.multiPlanBonus > 0}`,
    ]);
}

export function tacticalPlanExecutionClass(
  type: TacticalPlanType,
): PlanExecutionClass {
  switch (type) {
    case "runner.clear_tags_or_survive":
    case "runner.convert_success_window":
    case "runner.survival_defense":
    case "corp.rez_defense":
      return "reactive_interrupt";
    case "runner.build_credit_bank":
    case "corp.activate_persistent_economy":
    case "corp.build_credit_bank":
      return "recurring_cycle";
    case "corp.establish_scoring_remote":
      return "development_project";
    case "runner.obtain_breaker_coverage":
    case "runner.contest_remote":
    case "runner.opportunistic_central_run":
    case "runner.restore_hand_buffer":
    case "runner.develop_hand_card":
    case "runner.play_best_hand_card":
    case "runner.build_credit_base":
    case "runner.cash_out_credit_bank":
    case "corp.create_score_window":
    case "corp.develop_finite_economy":
    case "corp.apply_punish_pressure":
      return "bounded_sequence";
  }
}

export function portfolioRoleForExecutionClass(
  executionClass: PlanExecutionClass,
): PlanPortfolioRole {
  switch (executionClass) {
    case "reactive_interrupt":
      return "reactive_interrupt";
    case "bounded_sequence":
      return "foreground";
    case "recurring_cycle":
    case "development_project":
      return "background";
  }
}

export function adaptTacticalPlanToPortfolioEntry(params: {
  plan: TacticalPlan;
  turnKey: string;
  previousEntry?: PlanPortfolioEntry;
}): PlanPortfolioEntry {
  const executionClass = tacticalPlanExecutionClass(params.plan.type);
  const role = portfolioRoleForExecutionClass(executionClass);
  const sameTurn = params.previousEntry?.cadence.turnKey === params.turnKey;
  const actionsUsedThisTurn = sameTurn
    ? (params.previousEntry?.cadence.actionsUsedThisTurn ?? 0)
    : 0;
  return {
    portfolioEntryId: tacticalPlanPortfolioEntryId(params.plan),
    sourcePlanId: params.plan.planId,
    planType: params.plan.type,
    side: params.plan.side,
    executionClass,
    role,
    lifecycle: portfolioLifecycleForPlan(params.plan),
    priority: params.plan.priority,
    ...(params.plan.target ? { target: params.plan.target } : {}),
    supportsEntryIds: [],
    milestone: params.plan.currentStep.kind,
    progress: portfolioProgressForPlan(params.plan),
    selectedStepKind: params.plan.currentStep.kind,
    actionCandidateIds: [...params.plan.currentStep.actionCandidateIds].sort(),
    cadence: {
      turnKey: params.turnKey,
      maxActionsPerTurn: role === "background" ? 1 : 4,
      actionsUsedThisTurn,
      ...(params.previousEntry?.cadence.lastProgressTurnKey
        ? {
            lastProgressTurnKey:
              params.previousEntry.cadence.lastProgressTurnKey,
          }
        : {}),
    },
    resourceReservation: {
      credits: Math.max(
        0,
        ...params.plan.requiredCapabilities.map(
          (capability) => capability.minimumCredits ?? 0,
        ),
      ),
      clicks:
        params.plan.currentStep.followupBudget?.requiredFollowupActions ?? 0,
    },
    updatedAtStateVersion: params.plan.updatedAtStateVersion,
    evidence: [
      `plan_portfolio_source_plan:${params.plan.planId}`,
      `plan_portfolio_execution_class:${executionClass}`,
      `plan_portfolio_role:${role}`,
      `plan_portfolio_lifecycle:${portfolioLifecycleForPlan(params.plan)}`,
      ...(params.previousEntry
        ? [
            `plan_portfolio_previous_entry:${params.previousEntry.portfolioEntryId}`,
          ]
        : []),
    ],
  };
}

export function aggregatePlanActionContributions(params: {
  portfolio: PlanPortfolioSnapshot;
  contributions: readonly PlanActionContribution[];
}): PlanActionContributionScore[] {
  const entries = portfolioEntryMap(params.portfolio);
  const byAction = new Map<string, PlanActionContribution[]>();
  for (const contribution of params.contributions) {
    if (!entries.has(contribution.portfolioEntryId)) continue;
    const actionContributions = byAction.get(contribution.actionId) ?? [];
    actionContributions.push(contribution);
    byAction.set(contribution.actionId, actionContributions);
  }
  return [...byAction.entries()]
    .map(([actionId, contributions]) => {
      const byRole = (role: PlanPortfolioRole) =>
        contributions.filter(
          (contribution) =>
            entries.get(contribution.portfolioEntryId)?.role === role,
        );
      const interruptValue = maximumContributionValue(
        byRole("reactive_interrupt"),
      );
      const foregroundValue = maximumContributionValue(byRole("foreground"));
      const backgroundValue = Math.min(
        BACKGROUND_CONTRIBUTION_CAP,
        byRole("background").reduce(
          (sum, contribution) => sum + contribution.value,
          0,
        ),
      );
      const portfolioEntryIds = uniqueStrings(
        contributions.map((contribution) => contribution.portfolioEntryId),
      ).sort();
      const multiPlanBonus =
        portfolioEntryIds.length > 1 ? MULTI_PLAN_ACTION_BONUS : 0;
      return {
        actionId,
        totalValue:
          interruptValue + foregroundValue + backgroundValue + multiPlanBonus,
        interruptValue,
        foregroundValue,
        backgroundValue,
        multiPlanBonus,
        contributionCount: contributions.length,
        portfolioEntryIds,
        evidence: uniqueStrings(
          contributions.flatMap((contribution) => [
            `plan_contribution:${contribution.portfolioEntryId}:${contribution.contributionKind}:${contribution.value}`,
            ...contribution.evidence,
          ]),
        ),
      } satisfies PlanActionContributionScore;
    })
    .sort(
      (left, right) =>
        right.totalValue - left.totalValue ||
        left.actionId.localeCompare(right.actionId),
    );
}

export function redactedPlanPortfolioFacts(
  portfolio: PlanPortfolioSnapshot,
): string[] {
  return [
    `plan_portfolio_interrupt:${portfolio.interrupt?.planType ?? "none"}`,
    `plan_portfolio_foreground:${portfolio.foreground?.planType ?? "none"}`,
    `plan_portfolio_backgrounds:${
      portfolio.backgrounds.map((entry) => entry.planType).join("|") || "none"
    }`,
    `plan_portfolio_background_lifecycles:${
      portfolio.backgrounds
        .map((entry) => `${entry.planType}=${entry.lifecycle}`)
        .join("|") || "none"
    }`,
    `plan_portfolio_rejected_count:${portfolio.rejectedEntryIds.length}`,
  ];
}

function planEligibleForPortfolio(plan: TacticalPlan): boolean {
  return !["expired", "failed", "satisfied", "abandoned"].includes(plan.status);
}

function tacticalPlanPortfolioEntryId(plan: TacticalPlan): string {
  const target = plan.target
    ? `${plan.target.kind}:${plan.target.id}`
    : "untargeted";
  return `${plan.type}:${target}`;
}

function portfolioLifecycleForPlan(plan: TacticalPlan): PlanPortfolioLifecycle {
  switch (plan.status) {
    case "blocked":
      return "blocked";
    case "satisfied":
      return "completed";
    case "abandoned":
    case "failed":
    case "expired":
      return "abandoned";
    case "proposed":
      return "dormant";
    case "active":
    case "progressing":
      return "active";
  }
}

function portfolioProgressForPlan(plan: TacticalPlan): number {
  switch (plan.status) {
    case "satisfied":
      return 1;
    case "progressing":
      return 0.5;
    case "active":
      return 0.25;
    default:
      return 0;
  }
}

function findPreviousEntry(
  previous: PlanPortfolioSnapshot | undefined,
  plan: TacticalPlan,
): PlanPortfolioEntry | undefined {
  const entryId = tacticalPlanPortfolioEntryId(plan);
  return allPortfolioEntries(previous).find(
    (entry) => entry.portfolioEntryId === entryId,
  );
}

function allPortfolioEntries(
  portfolio: PlanPortfolioSnapshot | undefined,
): PlanPortfolioEntry[] {
  if (!portfolio) return [];
  return [
    ...(portfolio.interrupt ? [portfolio.interrupt] : []),
    ...(portfolio.foreground ? [portfolio.foreground] : []),
    ...portfolio.backgrounds,
  ];
}

function portfolioEntryMap(
  portfolio: PlanPortfolioSnapshot,
): Map<string, PlanPortfolioEntry> {
  return new Map(
    allPortfolioEntries(portfolio).map((entry) => [
      entry.portfolioEntryId,
      entry,
    ]),
  );
}

function carryDormantBackground(
  entry: PlanPortfolioEntry,
  turnKey: string,
): PlanPortfolioEntry {
  const sameTurn = entry.cadence.turnKey === turnKey;
  return {
    ...entry,
    lifecycle: "dormant",
    cadence: {
      ...entry.cadence,
      turnKey,
      actionsUsedThisTurn: sameTurn ? entry.cadence.actionsUsedThisTurn : 0,
    },
    evidence: [
      ...entry.evidence,
      "plan_portfolio_carried_without_current_action:true",
    ],
  };
}

function suspendPortfolioEntry(
  entry: PlanPortfolioEntry,
  interrupt: PlanPortfolioEntry,
): PlanPortfolioEntry {
  return {
    ...entry,
    lifecycle: "suspended",
    evidence: [
      ...entry.evidence,
      `plan_portfolio_suspended_by:${interrupt.planType}`,
    ],
  };
}

function resumeEntry(entry: PlanPortfolioEntry): PlanPortfolioEntry {
  if (entry.lifecycle !== "suspended") return entry;
  return {
    ...entry,
    lifecycle: "active",
    evidence: [...entry.evidence, "plan_portfolio_resumed:true"],
  };
}

function comparePortfolioEntries(
  left: PlanPortfolioEntry,
  right: PlanPortfolioEntry,
): number {
  return (
    lifecycleRank(right.lifecycle) - lifecycleRank(left.lifecycle) ||
    right.priority - left.priority ||
    right.progress - left.progress ||
    left.portfolioEntryId.localeCompare(right.portfolioEntryId)
  );
}

function lifecycleRank(lifecycle: PlanPortfolioLifecycle): number {
  switch (lifecycle) {
    case "active":
      return 6;
    case "ready":
      return 5;
    case "suspended":
      return 4;
    case "dormant":
      return 3;
    case "blocked":
      return 2;
    case "completed":
      return 1;
    case "abandoned":
      return 0;
  }
}

function validPreviousPortfolio(
  input: AiDecisionInput,
  previous: PlanPortfolioSnapshot | undefined,
): PlanPortfolioSnapshot | undefined {
  if (!previous) return undefined;
  if (previous.side !== input.side || previous.profileId !== input.profileId) {
    return undefined;
  }
  if (previous.stateVersion > input.playerView.stateVersion) return undefined;
  return previous;
}

function maximumContributionValue(
  contributions: readonly PlanActionContribution[],
): number {
  return Math.max(
    0,
    ...contributions.map((contribution) => contribution.value),
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

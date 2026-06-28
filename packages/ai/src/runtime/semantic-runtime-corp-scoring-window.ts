import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpScoringWindowKind =
  | "none"
  | "unsafe"
  | "temporary_safe"
  | "durable";

export type CorpScoringWindowHorizon =
  | "immediate"
  | "next_turn"
  | "slow"
  | "unknown";

export type CorpScoringWindowNextStep =
  | "score"
  | "advance"
  | "install_agenda"
  | "build_remote_ice"
  | "gain_credit"
  | "none";

export type CorpScoringWindowAssessment = {
  serverId: string;
  windowKind: CorpScoringWindowKind;
  runnerCanContestNow: boolean;
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  runnerCanContestBeforeScore: boolean;
  runnerCanReachAccessBeforeScore: boolean;
  agendaStealRelevantBeforeScore: boolean;
  missingVisibleBreakerCoverage: boolean;
  corpCanRezRelevantIce: boolean;
  scoreHorizon: CorpScoringWindowHorizon;
  runnerExposureCreditActions: number;
  recommendedNextStep: CorpScoringWindowNextStep;
  evidence: string[];
};

export type SemanticRuntimeCorpScoringWindowDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  actionCreditCost: (action: LegalAction) => number;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
  actionSourceCard?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
};

export function semanticRuntimeCorpScoringWindowAssessment<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  roles: string[] = [],
): CorpScoringWindowAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId) || !serverId) {
    return undefined;
  }
  const scoreLineAction =
    action.type === "score_agenda" ||
    ((action.type === "install_card" || action.type === "advance_card") &&
      dependencies.actionIsScoreLine(input, action, roles));
  const remoteIceInstall =
    action.type === "install_card" && action.payload?.placement === "ice";
  if (!scoreLineAction && !remoteIceInstall) return undefined;

  const server = dependencies.server(input, serverId);
  const projectedServer = projectedRemoteServerForAction(
    input,
    action,
    server,
    dependencies,
  );
  const scoreHorizon = scoringWindowHorizon(
    input,
    action,
    dependencies,
  );
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const rezBudget = scoringWindowRezBudget(
    projectedServer,
    creditsAfterAction,
    dependencies,
  );
  const access = scoringWindowAccessAssessment(input, projectedServer);
  const runnerExposureCreditActions = scoringWindowRunnerExposureCreditActions(
    input,
    scoreHorizon,
    scoreLineAction,
  );
  const exposureAccess =
    runnerExposureCreditActions > 0
      ? scoringWindowAccessAssessment(
          input,
          projectedServer,
          runnerExposureCreditActions,
        )
      : access;
  const hasScorePressure =
    scoreLineAction ||
    semanticRuntimeCorpHasAgendaInHq(input) ||
    dependencies.remoteHasScoreLine(server);
  const centralPressure = semanticRuntimeCorpCentralPressure(input);
  const existingWindow = strongestExistingScoringRemote(input, dependencies);
  const immediateScore =
    action.type === "score_agenda" ||
    dependencies.advanceCompletesScore(input, action);
  const runnerCanContestNow =
    !immediateScore &&
    access.runnerCanReachAccessNow &&
    access.agendaStealRelevantNow;
  const runnerCanContestBeforeScore =
    !immediateScore &&
    exposureAccess.runnerCanReachAccessNow &&
    exposureAccess.agendaStealRelevantNow;

  const windowKind = scoringWindowKind({
    action,
    access,
    centralPressure,
    exposureAccess,
    existingWindow,
    hasScorePressure,
    immediateScore,
    projectedServer,
    rezBudget,
    runnerCanContestBeforeScore,
    scoreLineAction,
  });
  const recommendedNextStep = scoringWindowRecommendedNextStep({
    action,
    hasScorePressure,
    projectedServer,
    windowKind,
    rezBudget,
    runnerCanContestBeforeScore,
    centralPressure,
  });

  return {
    serverId,
    windowKind,
    runnerCanContestNow,
    runnerCanReachAccessNow: access.runnerCanReachAccessNow,
    agendaStealRelevantNow: access.agendaStealRelevantNow,
    runnerCanContestBeforeScore,
    runnerCanReachAccessBeforeScore: exposureAccess.runnerCanReachAccessNow,
    agendaStealRelevantBeforeScore: exposureAccess.agendaStealRelevantNow,
    missingVisibleBreakerCoverage: access.missingVisibleBreakerCoverage,
    corpCanRezRelevantIce: rezBudget.corpCanRezRelevantIce,
    scoreHorizon,
    runnerExposureCreditActions,
    recommendedNextStep,
    evidence: [
      "corp_scoring_window:assessed",
      `server:${serverId}`,
      `window_kind:${windowKind}`,
      `score_horizon:${scoreHorizon}`,
      `runner_can_contest_now:${runnerCanContestNow}`,
      `runner_can_reach_access_now:${access.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_now:${access.agendaStealRelevantNow}`,
      `runner_can_contest_before_score:${runnerCanContestBeforeScore}`,
      `runner_can_reach_access_before_score:${exposureAccess.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_before_score:${exposureAccess.agendaStealRelevantNow}`,
      `runner_exposure_credit_actions:${runnerExposureCreditActions}`,
      `missing_visible_installed_coverage:${access.missingVisibleBreakerCoverage}`,
      `corp_can_rez_relevant_ice:${rezBudget.corpCanRezRelevantIce}`,
      `corp_can_rez_full_path:${rezBudget.corpCanRezFullPath}`,
      `remote_effective_ice_count:${access.effectiveIceCount}`,
      `remote_affordable_ice_count:${rezBudget.affordableIceCount}`,
      `visible_runner_contest_credits:${access.visibleRunnerContestCredits}`,
      `visible_runner_exposure_contest_credits:${exposureAccess.visibleRunnerContestCredits}`,
      `central_pressure:${centralPressure}`,
      `existing_scoring_remote:${existingWindow}`,
      `recommended_next_step:${recommendedNextStep}`,
      ...access.evidence,
      ...(runnerExposureCreditActions > 0
        ? exposureAccess.evidence.map((entry) => `exposure_${entry}`)
        : []),
      ...rezBudget.evidence,
    ],
  };
}

function projectedRemoteServerForAction<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  server: TServer | undefined,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpServerLike | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return server;
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  if (!sourceCard || sourceCard.type !== "ice") return server;
  return {
    id: server?.id ?? dependencies.actionServerId(input, action) ?? "remote_1",
    ice: [...(server?.ice ?? []), sourceCard],
    root: [...(server?.root ?? [])],
  };
}

function scoringWindowHorizon<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowHorizon {
  if (action.type === "score_agenda") return "immediate";
  if (dependencies.advanceCompletesScore(input, action)) return "immediate";
  if (action.type === "advance_card") return "next_turn";
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    return "unknown";
  }
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  const requirement = sourceCard?.advancementRequirement;
  if (typeof requirement !== "number") return "unknown";
  return requirement <= 3 ? "next_turn" : "slow";
}

function scoringWindowAccessAssessment(
  input: AiDecisionInput,
  server: CorpServerLike | undefined,
  extraRunnerCredits = 0,
): {
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  missingVisibleBreakerCoverage: boolean;
  effectiveIceCount: number;
  unmodeledIceCount: number;
  visibleRunnerIcebreakerCount: number;
  visibleRunnerContestCredits: number;
  evidence: string[];
} {
  const visibleRunnerBaseContestCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []);
  const visibleRunnerExtraCredits = Math.max(
    0,
    Math.floor(extraRunnerCredits),
  );
  const visibleRunnerContestCredits =
    visibleRunnerBaseContestCredits + visibleRunnerExtraCredits;
  const visibleRunnerIcebreakerCount = visibleRunnerInstalledIcebreakerCount(
    input.playerView.opponent.rig ?? [],
  );
  if (!server || server.ice.length === 0) {
    return {
      runnerCanReachAccessNow: true,
      agendaStealRelevantNow: true,
      missingVisibleBreakerCoverage: false,
      effectiveIceCount: 0,
      unmodeledIceCount: 0,
      visibleRunnerIcebreakerCount,
      visibleRunnerContestCredits,
      evidence: [
        "remote_access:unprotected",
        `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
        `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
      ],
    };
  }
  const projectedIce = server.ice.map((ice) => ({
    ...ice,
    known: ice.known !== false,
    rezzed: true,
  }));
  const assessment = assessKnownRezzedIcePath(
    projectedIce,
    input.playerView.opponent.rig ?? [],
    visibleRunnerContestCredits,
    [...server.root],
  );
  const unmodeledIceCount = projectedIce.filter(
    (ice) => !iceHasModeledRunImpact(ice),
  ).length;
  const unmodeledBlocksVisibleAccess =
    unmodeledIceCount > 0 && visibleRunnerIcebreakerCount === 0;
  const runnerCanReachAccessNow =
    !unmodeledBlocksVisibleAccess &&
    assessment.canReachAccess &&
    assessment.creditsAfterPath >= 0;
  const hazardPenalty = assessment.visibleIceHazardPenalty ?? 0;
  const agendaStealRelevantNow =
    runnerCanReachAccessNow &&
    hazardPenalty < 600 &&
    assessment.creditsAfterPath >= 0;
  const missingVisibleBreakerCoverage =
    assessment.knownPathBlockedByMissingCoverage ||
    assessment.noAccessReason === "missing_breaker_coverage" ||
    (assessment.missingCoverage?.length ?? 0) > 0;
  return {
    runnerCanReachAccessNow,
    agendaStealRelevantNow,
    missingVisibleBreakerCoverage,
    effectiveIceCount: assessment.assessedKnownIceCount,
    unmodeledIceCount,
    visibleRunnerIcebreakerCount,
    visibleRunnerContestCredits,
    evidence: [
      `remote_access:assessed_known_ice:${assessment.assessedKnownIceCount}`,
      `remote_access:can_reach:${assessment.canReachAccess}`,
      `remote_access:credits_after_path:${assessment.creditsAfterPath}`,
      `remote_access:unmodeled_ice_count:${unmodeledIceCount}`,
      `remote_access:unmodeled_blocks_visible_access:${unmodeledBlocksVisibleAccess}`,
      `visible_runner_icebreaker_count:${visibleRunnerIcebreakerCount}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`remote_access:visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`remote_access:no_access_reason:${assessment.noAccessReason}`]
        : []),
      `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
      `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
    ],
  };
}

function scoringWindowRunnerExposureCreditActions(
  input: AiDecisionInput,
  scoreHorizon: CorpScoringWindowHorizon,
  scoreLineAction: boolean,
): number {
  if (!scoreLineAction || scoreHorizon === "immediate") return 0;
  if (scoreHorizon !== "next_turn" && scoreHorizon !== "slow") return 0;
  const visibleClicks = input.playerView.opponent.clicks;
  const availableRunnerClicks =
    typeof visibleClicks === "number" && Number.isFinite(visibleClicks)
      ? Math.max(0, Math.floor(visibleClicks))
      : 4;
  return Math.max(3, availableRunnerClicks - 1);
}

function scoringWindowRezBudget<TServer extends CorpServerLike>(
  server: CorpServerLike | undefined,
  creditsAfterAction: number,
  dependencies: Pick<
    SemanticRuntimeCorpScoringWindowDependencies<TServer>,
    "visibleIceRezCost"
  >,
): {
  corpCanRezRelevantIce: boolean;
  corpCanRezFullPath: boolean;
  affordableIceCount: number;
  evidence: string[];
} {
  if (!server || server.ice.length === 0) {
    return {
      corpCanRezRelevantIce: false,
      corpCanRezFullPath: false,
      affordableIceCount: 0,
      evidence: ["remote_rez_budget:no_ice"],
    };
  }
  const rezCosts = server.ice.map((ice) =>
    ice.rezzed === true
      ? 0
      : Math.max(0, dependencies.visibleIceRezCost(ice) ?? 2),
  );
  const affordableIceCount = rezCosts.filter(
    (cost) => cost <= Math.max(0, creditsAfterAction),
  ).length;
  const minimumRezCost = Math.min(...rezCosts);
  const totalRezCost = rezCosts.reduce((sum, cost) => sum + cost, 0);
  return {
    corpCanRezRelevantIce: creditsAfterAction >= minimumRezCost,
    corpCanRezFullPath: creditsAfterAction >= totalRezCost,
    affordableIceCount,
    evidence: [
      `remote_rez_budget:credits_after_action:${creditsAfterAction}`,
      `remote_rez_budget:min_rez_cost:${minimumRezCost}`,
      `remote_rez_budget:full_path_rez_cost:${totalRezCost}`,
    ],
  };
}

function scoringWindowKind(params: {
  action: LegalAction;
  access: ReturnType<typeof scoringWindowAccessAssessment>;
  centralPressure: boolean;
  exposureAccess: ReturnType<typeof scoringWindowAccessAssessment>;
  existingWindow: CorpScoringWindowKind;
  hasScorePressure: boolean;
  immediateScore: boolean;
  projectedServer: CorpServerLike | undefined;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerCanContestBeforeScore: boolean;
  scoreLineAction: boolean;
}): CorpScoringWindowKind {
  if (params.immediateScore) return "durable";
  if (!params.projectedServer || params.projectedServer.ice.length === 0) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    !params.rezBudget.corpCanRezRelevantIce ||
    params.access.agendaStealRelevantNow
  ) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (params.runnerCanContestBeforeScore) {
    return params.scoreLineAction ? "unsafe" : "none";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    (params.existingWindow === "durable" ||
      params.existingWindow === "temporary_safe") &&
    !remoteContainsScoreLine(params.projectedServer)
  ) {
    return "none";
  }
  if (
    params.projectedServer.ice.length >= 2 &&
    params.access.unmodeledIceCount === 0 &&
    params.rezBudget.corpCanRezFullPath &&
    !params.exposureAccess.runnerCanReachAccessNow
  ) {
    return "durable";
  }
  if (
    params.hasScorePressure &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.exposureAccess.runnerCanReachAccessNow &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.unmodeledIceCount > 0 &&
    params.exposureAccess.visibleRunnerIcebreakerCount === 0 &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.hasScorePressure &&
    params.exposureAccess.missingVisibleBreakerCoverage &&
    params.rezBudget.corpCanRezRelevantIce &&
    !params.centralPressure
  ) {
    return "temporary_safe";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    params.existingWindow !== "durable" &&
    params.existingWindow !== "temporary_safe"
  ) {
    return "temporary_safe";
  }
  return params.scoreLineAction ? "unsafe" : "none";
}

function remoteContainsScoreLine(server: CorpServerLike | undefined): boolean {
  return (
    server?.root.some(
      (card) =>
        (card.known && card.type === "agenda") ||
        (card.advancementCounters ?? 0) > 0,
    ) === true
  );
}

function scoringWindowRecommendedNextStep(params: {
  action: LegalAction;
  hasScorePressure: boolean;
  projectedServer: CorpServerLike | undefined;
  windowKind: CorpScoringWindowKind;
  rezBudget: ReturnType<typeof scoringWindowRezBudget>;
  runnerCanContestBeforeScore: boolean;
  centralPressure: boolean;
}): CorpScoringWindowNextStep {
  if (params.windowKind === "durable" && params.action.type === "score_agenda") {
    return "score";
  }
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "advance_card"
  ) {
    return "advance";
  }
  if (
    (params.windowKind === "temporary_safe" ||
      params.windowKind === "durable") &&
    params.action.type === "install_card" &&
    params.action.payload?.placement !== "ice"
  ) {
    return "install_agenda";
  }
  if (
    params.action.type === "install_card" &&
    params.action.payload?.placement === "ice" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    params.windowKind !== "none"
  ) {
    return "build_remote_ice";
  }
  const remoteHasIce = (params.projectedServer?.ice.length ?? 0) > 0;
  if (
    params.windowKind === "unsafe" &&
    params.hasScorePressure &&
    !params.centralPressure &&
    (!remoteHasIce ||
      (params.runnerCanContestBeforeScore &&
        params.rezBudget.corpCanRezRelevantIce))
  ) {
    return "build_remote_ice";
  }
  if (!params.rezBudget.corpCanRezRelevantIce) return "gain_credit";
  return "none";
}

function strongestExistingScoringRemote<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
): CorpScoringWindowKind {
  let strongest: CorpScoringWindowKind = "none";
  for (const server of input.playerView.servers) {
    if (!dependencies.isRemoteServerTarget(server.id)) continue;
    const candidate = dependencies.server(input, server.id);
    if (
      !dependencies.remoteHasScoreLine(candidate) &&
      !semanticRuntimeCorpHasAgendaInHq(input)
    ) {
      continue;
    }
    const access = scoringWindowAccessAssessment(input, candidate);
    const rezBudget = scoringWindowRezBudget(
      candidate,
      input.playerView.own.credits,
      dependencies,
    );
    const kind = scoringWindowKind({
      action: {
        actionId: "existing_remote_capacity",
        label: "existing_remote_capacity",
        type: "install_card",
        side: "corp",
        source: "game_rule",
        timingPoint: "corp_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "private_to_actor",
        expiresAtStateVersion: input.playerView.stateVersion,
        payload: { placement: "ice" },
      } as unknown as LegalAction,
      access,
      centralPressure: false,
      exposureAccess: access,
      existingWindow: "none",
      hasScorePressure: true,
      immediateScore: false,
      projectedServer: candidate,
      rezBudget,
      runnerCanContestBeforeScore:
        access.runnerCanReachAccessNow && access.agendaStealRelevantNow,
      scoreLineAction: false,
    });
    if (kind === "durable") return "durable";
    if (kind === "temporary_safe") strongest = "temporary_safe";
  }
  return strongest;
}

function semanticRuntimeCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

function semanticRuntimeCorpCentralPressure(input: AiDecisionInput): boolean {
  const runnerCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []);
  const agendaInHq = semanticRuntimeCorpHasAgendaInHq(input);
  const hq = input.playerView.servers.find((server) => server.id === "hq");
  const rd = input.playerView.servers.find((server) => server.id === "rd");
  const hqInsufficientlyProtected = (hq?.ice.length ?? 0) === 0;
  const rdInsufficientlyProtected = (rd?.ice.length ?? 0) === 0;
  const hqRunOrAccessEvents = centralRunOrAccessEventCount(input, "hq");
  const rdRunOrAccessEvents = centralRunOrAccessEventCount(input, "rd");
  return (
    (agendaInHq && hqInsufficientlyProtected && runnerCredits >= 1) ||
    (hqInsufficientlyProtected &&
      runnerCredits >= 2 &&
      (hqRunOrAccessEvents >= 3 ||
        visibleRunnerCentralMultiaccess(input, "hq"))) ||
    (rdInsufficientlyProtected &&
      runnerCredits >= 4 &&
      (rdRunOrAccessEvents >= 2 || visibleRunnerCentralMultiaccess(input, "rd")))
  );
}

function centralRunOrAccessEventCount(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): number {
  const eventsById = new Map(
    [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])].map(
      (event) => [event.eventId, event],
    ),
  );
  return [...eventsById.values()].filter((event) => {
    const payload = event.publicPayload;
    const actor =
      typeof payload.actor === "string" ? payload.actor : undefined;
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    return (
      actor === "runner" &&
      (actionType === "start_run" || actionType === "access_card") &&
      normalizedCentralServerId(
        typeof payload.serverId === "string" ? payload.serverId : undefined,
      ) === serverId
    );
  }).length;
}

function normalizedCentralServerId(value: string | undefined): "hq" | "rd" | undefined {
  if (!value) return undefined;
  const normalized = value.toLocaleLowerCase("en-US");
  if (normalized === "hq") return "hq";
  if (normalized === "rd") return "rd";
  return undefined;
}

function visibleRunnerCentralMultiaccess(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return (input.playerView.opponent.rig ?? []).some((card) => {
    if (card.known === false) return false;
    const normalizedText = `${card.title ?? ""} ${card.rulesText ?? ""} ${
      card.definitionId ?? ""
    }`.toLocaleLowerCase("en-US");
    if (
      !(
        normalizedText.includes("multiaccess") ||
        normalizedText.includes("additional card") ||
        normalizedText.includes("access 1 additional")
      )
    ) {
      return false;
    }
    if (serverId === "hq") return normalizedText.includes("hq");
    return (
      normalizedText.includes("r&d") ||
      normalizedText.includes("rnd") ||
      normalizedText.includes("rd")
    );
  });
}

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
}

function visibleRunnerInstalledIcebreakerCount(
  rig: readonly VisibleCard[],
): number {
  return rig.filter(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      (card.subtypes ?? []).some(
        (subtype) => subtype.toLocaleLowerCase("en-US") === "icebreaker",
      ),
  ).length;
}

function iceHasModeledRunImpact(ice: VisibleCard): boolean {
  if (ice.effectiveRunQuote) return true;
  const definitionId = ice.definitionId;
  if (!definitionId) return false;
  return (
    RUNTIME_CARDS[definitionId] !== undefined ||
    DEMO_CARDS_BY_ID[definitionId] !== undefined
  );
}

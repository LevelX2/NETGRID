import runnerPlanProfilesData from "../../../data/ai/runner-plan-profiles-1.4.1.json";
import { AI_DECISION_DEBUG_SCHEMA_VERSION, DEMO_CARDS_BY_ID, type AiDeckDoctrineProfile, type AiDecision, type AiDecisionActionAlternative, type AiDecisionDebug, type AiDecisionInput, type AiDecisionRankedAlternative, type AiDecisionScoreComponent, type AiDifficulty, type LegalAction, type PublicGameEvent, type Side, type VisibleCard } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import { beliefDebugSummary, reconstructBeliefState, type BeliefState, type KnownHqHandMemory, type RndTopFreshnessMemory } from "./belief-state";
import { assessKnownRezzedIcePath, canBreakerDefinitionBreakIce, iceHasEndTheRun, serverIdFromEvent } from "./visible-run-analysis";

export type RunnerPlanKind =
  | "pressure_rnd"
  | "pressure_hq"
  | "contest_remote"
  | "build_rig"
  | "recover_economy"
  | "draw_for_answers"
  | "trash_asset"
  | "safe_probe_run";

export type RunnerPlanStep = {
  stepId: string;
  actionId: string;
  actionType: LegalAction["type"];
  targetServerId?: string;
  roleTags: string[];
};

export type RunnerPlanCandidate = {
  planId: string;
  kind: RunnerPlanKind;
  legalActionIds: string[];
  steps: RunnerPlanStep[];
  visibleBenefits: string[];
  visibleRisks: string[];
  uncertainty: string[];
  requiredRoles: string[];
};

export type RunnerPlanScore = {
  planId: string;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  scoreBreakdown: AiDecisionScoreComponent[];
};

export type RunnerPlanDebug = AiDecisionDebug & {
  aiLevel: 2;
  schemaVersion: typeof AI_DECISION_DEBUG_SCHEMA_VERSION;
  planId: string;
  planKind: RunnerPlanKind | "fallback";
  selectedActionType: LegalAction["type"] | "none";
  score: number;
  confidence: number;
  visibleReasons: string[];
  uncertainty: string[];
  evidence: string[];
  fallbackUsed: boolean;
  seed: string;
  profileId: string;
  timeBudgetMs: number;
  timeoutUsed: boolean;
  memoryVersion?: string;
  facts?: string[];
  hypotheses?: string[];
  invalidations?: string[];
  beliefUncertainty?: string[];
  opponentModel?: Record<string, unknown>;
  ownDeckDoctrine?: {
    schemaVersion: string;
    side: Side;
    confidence: number;
    archetypeTags: string[];
    riskFlags: string[];
  };
  doctrinePlanWeight?: number;
};

export type RunnerPlanDecision = {
  selectedPlanId: string;
  selectedActionId: string;
  selectedActionType: LegalAction["type"] | "none";
  fallbackUsed: boolean;
  score: RunnerPlanScore;
  debug: RunnerPlanDebug;
};

export type RunnerPlanEvaluatorResult = {
  score: number;
  reasons: string[];
  evidence: string[];
};

type RunnerPlanProfile = {
  profileId: string;
  legacyProfileIds: string[];
  side: "runner";
  difficulty: AiDifficulty;
  timeBudgetMs: number;
  planBreadth: number;
  riskTolerance: number;
  weights: Record<"runnerRig" | "runCost" | "serverAccessValue" | "remoteThreat" | "corpScoringThreat", number>;
};

type RunnerFeatures = {
  credits: number;
  clicks: number;
  tags: number;
  citySurveillanceSourceCount: number;
  memoryRemaining: number;
  handCount: number;
  rigRoles: Set<string>;
  handRoles: Set<string>;
  serverFeatures: Map<string, { iceCount: number; rootCount: number; knownRootCount: number; rezzedIceCount: number; advancedRootCount: number }>;
  blockedRunServers: Set<string>;
  visibleRunBreakCosts: Map<string, number>;
};
type RunnerServerFeatures = RunnerFeatures["serverFeatures"] extends Map<string, infer Server> ? Server : never;
type VisibleBreakerPressure = {
  blockedServerIds: Set<string>;
  matchingGripBreakerCount: number;
  matchingInstallActionIds: Set<string>;
  missingAnswerCount: number;
};
type RunnerTwoTurnRunIntent = {
  targetServerId: string;
  thresholdCredits: number;
  visibleBreakCost: number;
  creditsNeeded: number;
  ready: boolean;
  stateKey: string;
};

type CitySurveillanceDrawProjection = {
  sourceCount: number;
  creditsPaid: number;
  tagsAdded: number;
  decision: "pay" | "tag" | "none";
};

type InstalledEconomyActionKind = "direct_payout" | "pool_build" | "pool_payout" | "side_economy";

type InstalledEconomyActionAssessment = {
  kind: InstalledEconomyActionKind;
  immediateGain: number;
  netCredits: number;
  storedCredits: number;
  futurePoolAfter: number;
  ability: string;
};

type ShellTradersActionKind = "prepare" | "remove_counter";

type ShellTradersActionAssessment = {
  kind: ShellTradersActionKind;
  shellCounters: number;
  targetDefinitionId?: string;
  targetRoles: string[];
  immediateInstall: boolean;
  sourceVisible: boolean;
  directInstallAvailable: boolean;
  directInstallRemainingCredits?: number;
  directInstallUrgency: number;
};

type ShellTradersBacklog = {
  preparedCount: number;
  nearInstallCount: number;
  totalShellCounters: number;
};

const AI_HINTS = createAiHintsByCard();
const RUNNER_PLAN_PROFILES = runnerPlanProfilesData.profiles as RunnerPlanProfile[];
const PLAN_ACTION_TYPES = new Set<LegalAction["type"]>(["start_run", "jack_out", "continue_run", "install_card", "play_event", "trigger_ability", "activated_card_ability", "gain_credit", "draw_card", "trash_accessed_card"]);

export function hasRunnerPlanAction(input: AiDecisionInput): boolean {
  return input.side === "runner" && input.legalActions.some((action) => PLAN_ACTION_TYPES.has(action.type) && ((action.type !== "trigger_ability" && action.type !== "activated_card_ability") || Boolean(classifyInstalledEconomyAction(input, action)) || Boolean(classifyShellTradersAction(input, action))));
}

export function chooseRunnerPlanAction(input: AiDecisionInput, fallbackDecision: AiDecision, options: { timeBudgetMs?: number } = {}): AiDecision {
  const planDecision = chooseRunnerPlanDecision(input, options);
  if (planDecision.fallbackUsed || !planDecision.selectedActionId) {
    return {
      ...fallbackDecision,
      decisionDebug: planDecision.debug,
      timeoutUsed: planDecision.debug.timeoutUsed || Boolean(fallbackDecision.timeoutUsed)
    };
  }
  const action = input.legalActions.find((candidate) => candidate.actionId === planDecision.selectedActionId);
  if (!action) {
    return {
      ...fallbackDecision,
      decisionDebug: fallbackDebug(input, fallbackDecision, "no_legal_selected_action", options.timeBudgetMs),
      timeoutUsed: Boolean(fallbackDecision.timeoutUsed)
    };
  }
  return {
    actionId: action.actionId,
    reasonCode: `runner.plan.${planDecision.debug.planKind}`,
    explanation: explanationForPlan(planDecision.debug.planKind),
    consideredActionIds: input.legalActions.map((candidate) => candidate.actionId).sort(),
    fallbackUsed: false,
    confidence: planDecision.score.confidence,
    evidence: scrubPlanEvidence(planDecision.score.evidence),
    decisionDebug: planDecision.debug,
    timeoutUsed: planDecision.debug.timeoutUsed,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason: `runner.plan.${planDecision.debug.planKind}`
  };
}

export function chooseRunnerPlanDecision(input: AiDecisionInput, options: { timeBudgetMs?: number } = {}): RunnerPlanDecision {
  const profile = runnerPlanProfile(input);
  const beliefState = reconstructBeliefState(input);
  const timeBudgetMs = options.timeBudgetMs ?? profile.timeBudgetMs;
  if (timeBudgetMs <= 0) return fallbackPlanDecision(input, "time_budget_exhausted", timeBudgetMs, true, beliefState);
  const candidates = generateRunnerPlanCandidates(input).slice(0, profile.planBreadth);
  if (candidates.length === 0) return fallbackPlanDecision(input, "no_plan_candidate", timeBudgetMs, false, beliefState);
  const scored = candidates
    .map((candidate) => ({ candidate, score: evaluateRunnerPlan(input, candidate, beliefState) }))
    .sort((left, right) => right.score.score - left.score.score || left.candidate.planId.localeCompare(right.candidate.planId));
  const selected = scored[0];
  if (!selected) return fallbackPlanDecision(input, "no_scored_plan", timeBudgetMs, false, beliefState);
  const action = selectPlanAction(input, selected.candidate);
  if (!action) return fallbackPlanDecision(input, "plan_without_legal_action", timeBudgetMs, false, beliefState);
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, selected.candidate.kind);
  return {
    selectedPlanId: selected.candidate.planId,
    selectedActionId: action.actionId,
    selectedActionType: action.type,
    fallbackUsed: false,
    score: selected.score,
    debug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      summary: explanationForPlan(selected.candidate.kind),
      planId: selected.candidate.planId,
      planKind: selected.candidate.kind,
      selectedActionType: action.type,
      score: selected.score.score,
      confidence: selected.score.confidence,
      visibleReasons: selected.score.reasons,
      rankedAlternatives: rankedRunnerAlternatives(input, scored, selected.candidate.planId),
      actionAlternatives: runnerActionAlternativesForPlan(input, selected.candidate, action.actionId),
      scoreBreakdown: selected.score.scoreBreakdown,
      whyNot: [],
      longTermPlan: longTermPlanForRunner(input, selected.candidate.kind),
      warnings: selected.candidate.visibleRisks.slice(0, 4),
      detailSections: runnerDetailSections(selected.candidate, selected.score),
      uncertainty: selected.candidate.uncertainty,
      evidence: scrubPlanEvidence(selected.score.evidence),
      fallbackUsed: false,
      seed: input.seed,
      profileId: profile.profileId,
      timeBudgetMs,
      timeoutUsed: false,
      memoryVersion: String(beliefSummary.memoryVersion ?? ""),
      facts: toStringArray(beliefSummary.facts),
      hypotheses: toStringArray(beliefSummary.hypotheses),
      invalidations: toStringArray(beliefSummary.invalidations),
      beliefUncertainty: toStringArray(beliefSummary.uncertainty),
      ...(opponentModel ? { opponentModel } : {}),
      ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight } : {})
    }
  };
}

export function generateRunnerPlanCandidates(input: AiDecisionInput): RunnerPlanCandidate[] {
  if (input.side !== "runner") return [];
  const features = extractRunnerFeatures(input);
  const actions = input.legalActions.slice().sort(compareAction);
  return [
    buildCandidate(input, "pressure_rnd", actions.filter((action) => action.type === "start_run" && action.payload?.serverId === "rd")),
    buildCandidate(input, "pressure_hq", actions.filter((action) => action.type === "start_run" && action.payload?.serverId === "hq")),
    buildCandidate(
      input,
      "contest_remote",
      actions.filter((action) => action.type === "start_run" && typeof action.payload?.serverId === "string" && action.payload.serverId.startsWith("remote_") && (features.serverFeatures.get(action.payload.serverId)?.rootCount ?? 0) > 0)
    ),
    buildCandidate(
      input,
      "build_rig",
      actions.filter(
        (action) =>
          (action.type === "install_card" && rolesForAction(input, action).some((role) => role.startsWith("breaker_") || role === "memory" || role === "setup" || role === "build_rig")) ||
          Boolean(classifyShellTradersAction(input, action))
      )
    ),
    buildCandidate(
      input,
      "recover_economy",
      actions.filter(
        (action) =>
          action.type === "gain_credit" ||
          (action.type === "play_event" && rolesForAction(input, action).some((role) => role === "economy" || role === "tempo")) ||
          Boolean(classifyInstalledEconomyAction(input, action))
      )
    ),
    buildCandidate(
      input,
      "draw_for_answers",
      actions.filter((action) => action.type === "draw_card" || (action.type === "play_event" && rolesForAction(input, action).some((role) => role === "draw" || role === "setup")))
    ),
    buildCandidate(input, "trash_asset", actions.filter((action) => action.type === "trash_accessed_card")),
    buildCandidate(
      input,
      "safe_probe_run",
      actions.filter(
        (action) =>
          action.type === "jack_out" ||
          action.type === "continue_run" ||
          (action.type === "start_run" && (action.payload?.serverId === "archives" || isLowInformationRunTarget(features, String(action.payload?.serverId ?? ""))))
      )
    )
  ].filter((candidate): candidate is RunnerPlanCandidate => candidate !== null);
}

export function evaluateRunnerPlan(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanScore {
  const profile = runnerPlanProfile(input);
  const rig = evaluateRunnerRig(input, candidate);
  const runCost = estimateRunCost(input, candidate);
  const access = evaluateServerAccessValue(input, candidate, beliefState);
  const remote = evaluateRemoteThreat(input, candidate, beliefState);
  const corpThreat = evaluateCorpScoringThreat(input, candidate, beliefState);
  const earlyTurn = evaluateRunnerEarlyTurnDoctrine(input, candidate);
  const breakerPlan = evaluateVisibleBreakerPlan(input, candidate);
  const twoTurnIntent = evaluateRunnerTwoTurnRunIntent(input, candidate);
  const citySurveillanceDrawRisk = evaluateCitySurveillanceDrawRisk(
    input,
    candidate,
  );
  const installedEconomy = evaluateInstalledEconomyActions(input, candidate);
  const shellTraders = evaluateShellTradersActions(input, candidate);
  const doctrinePlanWeight = doctrinePlanWeightFor(input, candidate.kind);
  const easyRunPenalty = input.difficulty === "easy" && isRunPlan(candidate.kind) ? 260 : 0;
  const score =
    baseScoreForPlan(candidate.kind) +
    doctrinePlanWeight +
    earlyTurn.score +
    rig.score * profile.weights.runnerRig +
    runCost.score * profile.weights.runCost +
    access.score * profile.weights.serverAccessValue +
    remote.score * profile.weights.remoteThreat +
    corpThreat.score * profile.weights.corpScoringThreat +
    breakerPlan.score +
    twoTurnIntent.score +
    citySurveillanceDrawRisk.score +
    installedEconomy.score +
    shellTraders.score -
    visibleRiskPenalty(candidate, profile.riskTolerance) -
    easyRunPenalty;
  return {
    planId: candidate.planId,
    score: roundScore(score),
    confidence: confidence(score, candidate.legalActionIds.length),
    reasons: sortedUnique([...earlyTurn.reasons, ...rig.reasons, ...runCost.reasons, ...access.reasons, ...remote.reasons, ...corpThreat.reasons, ...breakerPlan.reasons, ...twoTurnIntent.reasons, ...citySurveillanceDrawRisk.reasons, ...installedEconomy.reasons, ...shellTraders.reasons]).slice(0, 6),
    scoreBreakdown: scoreComponents([
      ["base", "Grundplan", baseScoreForPlan(candidate.kind), 1, `plan:${candidate.kind}`],
      ["doctrine", "Deck-Doctrine", doctrinePlanWeight, 1, "doctrine_plan_weight"],
      ["earlyTurn", "Frühe Zugphase", earlyTurn.score, 1, firstReason(earlyTurn.reasons)],
      ["runnerRig", "Runner-Rig", rig.score * profile.weights.runnerRig, profile.weights.runnerRig, firstReason(rig.reasons)],
      ["runCost", "Run-Kosten", runCost.score * profile.weights.runCost, profile.weights.runCost, firstReason(runCost.reasons)],
      ["serverAccessValue", "Serverwert", access.score * profile.weights.serverAccessValue, profile.weights.serverAccessValue, firstReason(access.reasons)],
      ["remoteThreat", "Remote-Druck", remote.score * profile.weights.remoteThreat, profile.weights.remoteThreat, firstReason(remote.reasons)],
      ["corpScoringThreat", "Corp-Scoring-Gefahr", corpThreat.score * profile.weights.corpScoringThreat, profile.weights.corpScoringThreat, firstReason(corpThreat.reasons)],
      ["breakerPlan", "Breaker-Plan", breakerPlan.score, 1, firstReason(breakerPlan.reasons)],
      ["twoTurnIntent", "Zwei-Zug-Absicht", twoTurnIntent.score, 1, firstReason(twoTurnIntent.reasons)],
      ["citySurveillance", "City-Surveillance-Risiko", citySurveillanceDrawRisk.score, 1, firstReason(citySurveillanceDrawRisk.reasons)],
      ["installedEconomy", "Installierte Economy", installedEconomy.score, 1, firstReason(installedEconomy.reasons)],
      ["shellTraders", "Shell Traders", shellTraders.score, 1, firstReason(shellTraders.reasons)],
      ["visibleRisk", "Sichtbares Risiko", -visibleRiskPenalty(candidate, profile.riskTolerance), 1, firstReason(candidate.visibleRisks)],
      ["easyRunPenalty", "Easy-Run-Bremse", -easyRunPenalty, 1, easyRunPenalty > 0 ? "easy_run_penalty" : undefined]
    ]),
    evidence: scrubPlanEvidence([
      `plan:${candidate.kind}`,
      `difficulty:${input.difficulty}`,
      `doctrine_plan_weight:${doctrinePlanWeight}`,
      ...(input.ownDeckDoctrine ? [`doctrine:${input.ownDeckDoctrine.archetypeTags.slice(0, 3).join(",") || "neutral"}`] : ["doctrine:neutral"]),
      ...candidate.visibleBenefits,
      ...installedEconomy.evidence,
      ...shellTraders.evidence,
      ...twoTurnIntent.evidence,
      ...citySurveillanceDrawRisk.evidence,
      ...rig.evidence,
      ...runCost.evidence,
      ...access.evidence,
      ...remote.evidence,
      ...corpThreat.evidence,
      ...earlyTurn.evidence,
      ...breakerPlan.evidence,
      `belief_version:${beliefState.version}`,
      ...(beliefState.runnerOpponentModel ? [`belief_credit_reserve:${beliefState.runnerOpponentModel.corpCreditReserveInterpretation}`] : [])
    ])
  };
}

function evaluateRunnerTwoTurnRunIntent(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const intent = inferRunnerTwoTurnRunIntent(input);
  if (!intent) return { score: 0, reasons: [], evidence: [] };
  const target = targetServerId(input, candidate);
  const targetsIntent = target === intent.targetServerId;
  let score = 0;
  const reasons: string[] = [];
  if (!intent.ready && candidate.kind === "recover_economy") {
    score += intent.creditsNeeded <= 1 ? 280 : 180;
    reasons.push("two_turn_run_intent_economy_threshold");
  }
  if (!intent.ready && candidate.kind === "draw_for_answers" && input.playerView.own.gripOrHq.length < 3) {
    score += 90;
    reasons.push("two_turn_run_intent_preserve_options");
  }
  if (!intent.ready && targetsIntent && isRunPlan(candidate.kind)) {
    score -= 210;
    reasons.push("two_turn_run_intent_setup_before_run");
  }
  if (intent.ready && targetsIntent && isRunPlan(candidate.kind)) {
    score += 300;
    reasons.push("two_turn_run_intent_ready_for_target");
  }
  if (intent.ready && candidate.kind === "recover_economy") {
    score -= 120;
    reasons.push("two_turn_run_intent_stop_building");
  }
  return {
    score,
    reasons,
    evidence: [
      `two_turn_run_intent_target:${intent.targetServerId}`,
      `two_turn_run_intent_ready:${intent.ready}`,
      `two_turn_run_intent_threshold:${intent.thresholdCredits}`,
      `two_turn_run_intent_credits_needed:${intent.creditsNeeded}`,
      `two_turn_run_intent_visible_break_cost:${intent.visibleBreakCost}`,
      `two_turn_run_intent_state:${intent.stateKey}`,
      "two_turn_run_intent_lifetime:single_decision",
      "two_turn_run_intent_invalidates_on:target_credits_visible_ice_breakers"
    ]
  };
}

function evaluateCitySurveillanceDrawRisk(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "draw_for_answers")
    return { score: 0, reasons: [], evidence: [] };
  const projection = bestCitySurveillanceDrawProjection(input, candidate);
  if (projection.sourceCount <= 0) {
    return { score: 0, reasons: [], evidence: ["city_surveillance_draw_tax:false"] };
  }

  let penalty = projection.creditsPaid * 185 + projection.tagsAdded * 620;
  if (projection.creditsPaid > 0 && input.playerView.own.credits <= projection.creditsPaid + 1)
    penalty += 120;
  if (projection.tagsAdded > 0 && input.playerView.own.tags > 0)
    penalty += Math.min(360, input.playerView.own.tags * 20);

  return {
    score: -penalty,
    reasons: [
      projection.tagsAdded > 0
        ? "city_surveillance_draw_would_add_tag"
        : "city_surveillance_draw_tax_paid",
    ],
    evidence: [
      "city_surveillance_draw_tax:true",
      `city_surveillance_sources:${projection.sourceCount}`,
      `city_surveillance_decision:${projection.decision}`,
      `city_surveillance_projected_credits:${projection.creditsPaid}`,
      `city_surveillance_projected_tags:${projection.tagsAdded}`,
      `tags:${input.playerView.own.tags}`,
      `credits:${input.playerView.own.credits}`,
    ],
  };
}

function bestCitySurveillanceDrawProjection(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
): CitySurveillanceDrawProjection {
  const projections = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter(
      (action): action is LegalAction =>
        action !== undefined && action.type === "draw_card",
    )
    .map(citySurveillanceDrawProjectionForAction)
    .filter((projection) => projection.sourceCount > 0)
    .sort(
      (left, right) =>
        left.tagsAdded - right.tagsAdded ||
        left.creditsPaid - right.creditsPaid ||
        left.decision.localeCompare(right.decision),
    );
  return (
    projections[0] ?? {
      sourceCount: 0,
      creditsPaid: 0,
      tagsAdded: 0,
      decision: "none",
    }
  );
}

function citySurveillanceDrawProjectionForAction(
  action: LegalAction,
): CitySurveillanceDrawProjection {
  const sourceCount = Number(action.payload?.citySurveillanceSourceCount ?? 0);
  if (!Number.isFinite(sourceCount) || sourceCount <= 0) {
    return { sourceCount: 0, creditsPaid: 0, tagsAdded: 0, decision: "none" };
  }
  const creditsPaid = Number(
    action.payload?.citySurveillanceProjectedCreditsPaid ?? 0,
  );
  const tagsAdded = Number(action.payload?.citySurveillanceProjectedTagsAdded ?? 0);
  const decision =
    action.payload?.citySurveillanceDrawDecision === "pay" ? "pay" : "tag";
  return {
    sourceCount,
    creditsPaid: Number.isFinite(creditsPaid) ? creditsPaid : 0,
    tagsAdded: Number.isFinite(tagsAdded) ? tagsAdded : 0,
    decision,
  };
}

function inferRunnerTwoTurnRunIntent(input: AiDecisionInput): RunnerTwoTurnRunIntent | undefined {
  if (input.side !== "runner" || input.playerView.phase !== "runner_action_phase") return undefined;
  const features = extractRunnerFeatures(input);
  const visibleBreakerRoles = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).sort();
  if (visibleBreakerRoles.length === 0) return undefined;
  const legalRunTargets = new Set(
    input.legalActions
      .filter((action) => action.type === "start_run" && typeof action.payload?.serverId === "string")
      .map((action) => String(action.payload?.serverId))
  );
  const candidates = [...legalRunTargets]
    .map((serverId) => {
      const server = features.serverFeatures.get(serverId);
      const visibleBreakCost = features.visibleRunBreakCosts.get(serverId);
      if (!server || visibleBreakCost === undefined || visibleBreakCost <= 0) return undefined;
      if (!isStrategicTwoTurnRunTarget(serverId, server)) return undefined;
      const thresholdCredits = Math.max(1, Math.ceil(visibleBreakCost));
      const creditsNeeded = Math.max(0, thresholdCredits - features.credits);
      const ready = creditsNeeded === 0;
      if (!ready && creditsNeeded > 3) return undefined;
      return {
        intent: {
          targetServerId: serverId,
          thresholdCredits,
          visibleBreakCost,
          creditsNeeded,
          ready,
          stateKey: [
            serverId,
            `credits:${features.credits}`,
            `break:${visibleBreakCost}`,
            `ice:${server.iceCount}`,
            `rezzed:${server.rezzedIceCount}`,
            `rig:${visibleBreakerRoles.join(",") || "none"}`
          ].join("|")
        },
        priority: twoTurnRunTargetPriority(serverId, server) + (ready ? 40 : Math.max(0, 4 - creditsNeeded) * 20) - visibleBreakCost * 4
      };
    })
    .filter((candidate): candidate is { intent: RunnerTwoTurnRunIntent; priority: number } => Boolean(candidate))
    .sort((left, right) => right.priority - left.priority || left.intent.targetServerId.localeCompare(right.intent.targetServerId));
  return candidates[0]?.intent;
}

function isStrategicTwoTurnRunTarget(serverId: string, server: RunnerServerFeatures): boolean {
  if (serverId === "rd" || serverId === "hq") return true;
  return serverId.startsWith("remote_") && server.rootCount > 0;
}

function twoTurnRunTargetPriority(serverId: string, server: RunnerServerFeatures): number {
  if (serverId.startsWith("remote_")) return 120 + server.rootCount * 35 + server.advancedRootCount * 45;
  if (serverId === "rd") return 100;
  if (serverId === "hq") return 85;
  if (serverId === "archives") return 35;
  return 0;
}

function evaluateVisibleBreakerPlan(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const pressure = assessVisibleBreakerPressure(input);
  const target = targetServerId(input, candidate);
  if (pressure.blockedServerIds.size === 0) {
    return { score: 0, reasons: [], evidence: ["visible_breaker_pressure:false"] };
  }
  let score = 0;
  const reasons: string[] = [];
  if (candidate.kind === "build_rig") {
    if (candidate.legalActionIds.some((actionId) => pressure.matchingInstallActionIds.has(actionId))) {
      score += 320;
      reasons.push("visible_matching_breaker_install_available");
    } else if (pressure.matchingGripBreakerCount > 0) {
      score += 120;
      reasons.push("visible_matching_breaker_in_grip");
    }
  }
  if (candidate.kind === "recover_economy" && pressure.matchingGripBreakerCount > 0 && pressure.matchingInstallActionIds.size === 0 && input.playerView.own.credits < 4) {
    score += 190;
    reasons.push("visible_matching_breaker_needs_credits");
  }
  if (candidate.kind === "draw_for_answers" && pressure.matchingGripBreakerCount === 0 && pressure.missingAnswerCount > 0) {
    score += 210;
    reasons.push("visible_blocker_needs_draw_or_search");
  }
  if (target && pressure.blockedServerIds.has(target) && isRunPlan(candidate.kind)) {
    score -= 180;
    reasons.push("visible_blocker_requires_intermediate_plan");
  }
  return {
    score,
    reasons,
    evidence: [
      `visible_breaker_pressure:true`,
      `visible_blocked_servers:${pressure.blockedServerIds.size}`,
      `matching_grip_breakers:${pressure.matchingGripBreakerCount}`,
      `matching_install_actions:${pressure.matchingInstallActionIds.size}`,
      `missing_breaker_answers:${pressure.missingAnswerCount}`,
      `visible_breaker_target:${target ?? "none"}`
    ]
  };
}

export function evaluateRunnerEarlyTurnDoctrine(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const doctrine = input.ownDeckDoctrine;
  if (!doctrine || doctrine.side !== "runner") {
    return { score: 0, reasons: [], evidence: ["early_turn_doctrine:none"] };
  }
  const earlyTurn = isEarlyRunnerTurn(input);
  const features = extractRunnerFeatures(input);
  const rigBreakerCount = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).length;
  const handBreakerCount = [...features.handRoles].filter((role) => role.startsWith("breaker_")).length;
  const handEconomyCount = [...features.handRoles].filter((role) => role === "economy" || role === "tempo" || role === "draw").length;
  const target = targetServerId(input, candidate);
  const visibleIce = target ? (features.serverFeatures.get(target)?.iceCount ?? 0) : 0;
  const tags = doctrine.archetypeTags.slice(0, 3);
  const tagSet = new Set(tags);
  let score = 0;
  const reasons: string[] = [];

  if (earlyTurn && tagSet.has("rig_builder")) {
    if (candidate.kind === "build_rig" && rigBreakerCount === 0 && handBreakerCount > 0) {
      score += 70;
      reasons.push("early_rig_builder_setup");
    }
    if (candidate.kind === "recover_economy" && features.credits < 4) {
      score += 45;
      reasons.push("early_rig_builder_credit_floor");
    }
    if ((candidate.kind === "pressure_rnd" || candidate.kind === "pressure_hq") && rigBreakerCount === 0 && (visibleIce > 0 || features.credits < 4)) {
      score -= 50;
      reasons.push("early_rig_builder_pressure_not_ready");
    }
  }

  if (earlyTurn && tagSet.has("economy_dense")) {
    if (candidate.kind === "recover_economy" && (features.credits < 5 || handEconomyCount > 0)) {
      score += 55;
      reasons.push("early_economy_dense_reserve");
    }
    if (candidate.kind === "draw_for_answers" && handBreakerCount === 0) {
      score += 25;
      reasons.push("early_economy_dense_find_setup");
    }
    if (isRunPlan(candidate.kind) && rigBreakerCount === 0 && features.credits < 4) {
      score -= 35;
      reasons.push("early_economy_dense_run_paced");
    }
  }

  if (earlyTurn && tagSet.has("rnd_pressure") && candidate.kind === "pressure_rnd") {
    const pressureReady = features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(pressureReady ? "early_rnd_pressure_ready" : "early_rnd_pressure_not_ready");
  }
  if (earlyTurn && tagSet.has("hq_pressure") && candidate.kind === "pressure_hq") {
    const pressureReady = features.credits >= 3 && (rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 40 : -50;
    reasons.push(pressureReady ? "early_hq_pressure_ready" : "early_hq_pressure_not_ready");
  }
  if (earlyTurn && tagSet.has("remote_contest") && candidate.kind === "contest_remote") {
    const server = target ? features.serverFeatures.get(target) : undefined;
    const pressureReady = features.credits >= 3 && ((server?.advancedRootCount ?? 0) > 0 || rigBreakerCount > 0 || visibleIce === 0);
    score += pressureReady ? 35 : -45;
    reasons.push(pressureReady ? "early_remote_contest_ready" : "early_remote_contest_not_ready");
  }

  return {
    score,
    reasons,
    evidence: [
      `early_turn:${earlyTurn}`,
      `early_turn_doctrine:${tags.join(",") || "neutral"}`,
      `early_turn_score:${score}`,
      `early_rig_breakers:${rigBreakerCount}`,
      `early_hand_breakers:${handBreakerCount}`,
      `early_hand_economy:${handEconomyCount}`,
      `early_credits:${features.credits}`,
      `early_visible_ice:${visibleIce}`
    ]
  };
}

export function evaluateRunnerRig(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const breakerCount = [...features.rigRoles].filter((role) => role.startsWith("breaker_")).length;
  const handBreakerRoles = [...features.handRoles].filter((role) => role.startsWith("breaker_"));
  const reservePenalty = candidate.kind === "build_rig" ? lowReserveInstallPenalty(input, candidate, features.credits) : 0;
  const centralPressurePenalty = centralPressureWithoutRigPenalty(input, candidate, features, breakerCount);
  const score =
    candidate.kind === "build_rig"
      ? 150 + Math.max(0, 3 - breakerCount) * 45 + (features.memoryRemaining <= 1 ? 35 : 0) - reservePenalty
      : isRunPlan(candidate.kind)
        ? breakerCount * 30 - Math.max(0, 2 - features.credits) * 30 - centralPressurePenalty
        : handBreakerRoles.length * 8;
  return {
    score,
    reasons: sortedUnique([
      breakerCount > 0 ? "visible_rig_has_breaker_roles" : "visible_rig_incomplete",
      ...(reservePenalty > 0 ? ["credit_reserve_after_install_low"] : []),
      ...(centralPressurePenalty > 0 ? ["central_pressure_underprepared"] : [])
    ]),
    evidence: [
      `rig_breakers:${breakerCount}`,
      `hand_breaker_roles:${handBreakerRoles.length}`,
      `memory_remaining:${features.memoryRemaining}`,
      `credits:${features.credits}`,
      `central_pressure_penalty:${centralPressurePenalty}`
    ]
  };
}

function centralPressureWithoutRigPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, features: RunnerFeatures, breakerCount: number): number {
  if (candidate.kind !== "pressure_rnd" && candidate.kind !== "pressure_hq") return 0;
  if (input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2) return 0;
  const target = targetServerId(input, candidate);
  if (target !== "rd" && target !== "hq") return 0;
  const centralIceCount = features.serverFeatures.get(target)?.iceCount ?? 0;
  if (breakerCount === 0) {
    if (features.credits <= 1) return 240;
    if (features.credits === 2) return 180;
    if (features.credits === 3) return centralIceCount > 0 ? 230 : 120;
    return 0;
  }
  if (features.credits <= 1) return centralIceCount > 0 ? 230 : 170;
  if (features.credits === 2) return 70;
  return 0;
}

export function estimateRunCost(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const visibleBreakCost = target ? features.visibleRunBreakCosts.get(target) : undefined;
  const rezzedIce = server?.rezzedIceCount ?? 0;
  const breakCostPressure = visibleBreakCost === undefined ? 0 : visibleBreakCost * 18 + Math.max(0, visibleBreakCost - features.credits) * 55;
  const score = candidate.kind === "recover_economy" ? (features.credits < 4 ? 120 : 40) : blocked ? -520 : Math.max(-180, 90 - rezzedIce * 55 - Math.max(0, 3 - features.credits) * 35 - breakCostPressure);
  return {
    score,
    reasons: blocked ? ["run_blocked_by_visible_rezzed_ice", "visible_ice_unaffordable_to_break"] : ["run_cost_from_visible_ice"],
    evidence: [
      `target:${target ?? "none"}`,
      `rezzed_ice:${rezzedIce}`,
      `blocked:${blocked}`,
      `credit_reserve:${features.credits}`,
      `visible_etr_break_cost:${visibleBreakCost ?? "unavailable"}`
    ]
  };
}

export function evaluateServerAccessValue(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const history = publicServerMentions(input, target);
  const freshness = beliefState.runnerOpponentModel?.rndTopFreshness;
  const hqHandMemory = beliefState.runnerOpponentModel?.hqHandMemory;
  const blocked = target && isRunPlan(candidate.kind) ? features.blockedRunServers.has(target) : false;
  const staleArchivesPenalty = staleArchivesRepeatPenalty(input, target, server);
  const evidence = [
    `target:${target ?? "none"}`,
    `ice_count:${server?.iceCount ?? 0}`,
    `root_count:${server?.rootCount ?? 0}`,
    `known_root_count:${server?.knownRootCount ?? 0}`,
    `server_history:${history}`,
    `rnd_freshness:${freshness?.freshness ?? "unknown"}`,
    `hq_hand_known:${hqHandMemory?.allCardsKnown === true ? "all" : hqHandMemory && hqHandMemory.knownCount > 0 ? "partial" : "unknown"}`,
    `hq_known_count:${hqHandMemory?.knownCount ?? 0}`,
    `hq_hand_count:${hqHandMemory?.handCount ?? input.playerView.opponent.handCount}`
  ];
  if (blocked) {
    return {
      score: -160,
      reasons: ["visible_run_path_blocked"],
      evidence
    };
  }
  const staleRndPenalty = staleKnownRndPlanPenalty(candidate, target, freshness);
  const lowValueKnownHq = isKnownLowValueHqHand(input, target, hqHandMemory);
  const staleHqPenalty =
    target === "hq" && (candidate.kind === "pressure_hq" || candidate.kind === "safe_probe_run") && lowValueKnownHq ? (candidate.kind === "pressure_hq" ? 430 : 230) : 0;
  const recentCentralPenalty = recentCentralPressurePenalty(input, candidate, target);
  const remoteRootAffordabilityPenalty = knownRemoteRootTrashAffordabilityPenalty(input, candidate, target, features);
  evidence.push(`recent_central_penalty:${recentCentralPenalty}`);
  const score =
    candidate.kind === "pressure_rnd"
      ? 135 + history * 10 - staleRndPenalty - recentCentralPenalty
    : candidate.kind === "pressure_hq"
        ? 110 + Math.max(0, 5 - input.playerView.opponent.handCount) * 4 + history * 8 - staleHqPenalty - recentCentralPenalty
      : candidate.kind === "contest_remote"
          ? 90 + (server?.rootCount ?? 0) * 55 + (server?.advancedRootCount ?? 0) * 35 - remoteRootAffordabilityPenalty.penalty
      : candidate.kind === "trash_asset"
        ? 150
      : candidate.kind === "safe_probe_run"
        ? 55 - staleRndPenalty * 0.4 - staleHqPenalty * 0.4 - staleArchivesPenalty
        : 0;
  const reasons = [
    "server_value_from_visible_projection",
    ...(staleRndPenalty > 0 ? ["known_rnd_top_not_fresh"] : []),
    ...(staleHqPenalty > 0 ? ["known_hq_hand_low_value"] : []),
    ...(recentCentralPenalty > 0 ? ["recent_central_pressure_repeated"] : []),
    ...(staleArchivesPenalty > 0 ? ["known_archives_access_not_fresh"] : []),
    ...remoteRootAffordabilityPenalty.reasons
  ];
  return {
    score,
    reasons,
    evidence: [...evidence, ...remoteRootAffordabilityPenalty.evidence]
  };
}

function knownRemoteRootTrashAffordabilityPenalty(
  input: AiDecisionInput,
  candidate: RunnerPlanCandidate,
  target: string | undefined,
  features: RunnerFeatures
): { penalty: number; reasons: string[]; evidence: string[] } {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) return { penalty: 0, reasons: [], evidence: [] };
  const server = input.playerView.servers.find((candidateServer) => candidateServer.id === target);
  if (!server || server.root.length === 0) return { penalty: 0, reasons: [], evidence: [] };
  const unknownRootCount = server.root.filter((card) => !card.known).length;
  if (unknownRootCount > 0) {
    return {
      penalty: 0,
      reasons: ["known_remote_root_affordability_deferred_for_unknown_root"],
      evidence: [`known_remote_root_unknown_count:${unknownRootCount}`]
    };
  }
  const trashableRoots = server.root.filter((card) => isTrashableKnownRemoteRoot(card));
  if (trashableRoots.length === 0) return { penalty: 0, reasons: [], evidence: [] };
  if (server.root.some((card) => card.type === "agenda" || (card.advancementCounters ?? 0) > 0)) {
    return {
      penalty: 0,
      reasons: ["known_remote_root_other_access_value"],
      evidence: [`known_remote_root_trashable_count:${trashableRoots.length}`]
    };
  }
  const trashCosts = trashableRoots.map((card) => remoteRootTrashCost(card)).filter((cost): cost is number => cost !== undefined);
  if (trashCosts.length === 0) return { penalty: 0, reasons: [], evidence: [] };
  const cheapestTrashCost = Math.min(...trashCosts);
  const visibleBreakCost = features.visibleRunBreakCosts.get(target) ?? 0;
  const creditsAfterVisibleIce = input.playerView.own.credits - visibleBreakCost;
  const affordable = creditsAfterVisibleIce >= cheapestTrashCost;
  return {
    penalty: affordable ? 0 : 780,
    reasons: [affordable ? "known_remote_root_trash_affordable_after_ice" : "known_remote_root_trash_unaffordable_after_ice"],
    evidence: [
      `known_remote_root_trash_cost:${cheapestTrashCost}`,
      `known_remote_root_visible_break_cost:${visibleBreakCost}`,
      `known_remote_root_credits_after_ice:${creditsAfterVisibleIce}`,
      `known_remote_root_trash_affordable:${affordable}`
    ]
  };
}

function isTrashableKnownRemoteRoot(card: VisibleCard): boolean {
  return card.known && (card.type === "asset" || card.type === "upgrade") && remoteRootTrashCost(card) !== undefined;
}

function remoteRootTrashCost(card: VisibleCard): number | undefined {
  if (!card.known || !card.definitionId) return undefined;
  return card.trashCost ?? RUNTIME_CARDS[card.definitionId]?.numeric.trashCost ?? DEMO_CARDS_BY_ID[card.definitionId]?.trashCost;
}

function staleKnownRndPlanPenalty(candidate: RunnerPlanCandidate, target: string | undefined, freshness: RndTopFreshnessMemory | undefined): number {
  if (target !== "rd" || (candidate.kind !== "pressure_rnd" && candidate.kind !== "safe_probe_run") || freshness?.freshness !== "stale_known_same_top") return 0;
  // This is a preference penalty, not a legality gate: the Runner has side-safe public evidence that the same R&D top card is still known,
  // so ordinary economy/draw plans should beat another identical access unless another evaluator contributes a concrete advantage.
  return candidate.kind === "pressure_rnd" ? 540 : 260;
}

function recentCentralPressurePenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined): number {
  if ((candidate.kind !== "pressure_hq" && candidate.kind !== "pressure_rnd") || (target !== "hq" && target !== "rd")) return 0;
  const history = mergedPublicHistory(input);
  const lastSameCentralRun = findLastIndex(
    history,
    (event) => serverIdFromEvent(event) === target && (event.publicPayload.actionType === "start_run" || event.type === "run_started")
  );
  if (lastSameCentralRun < 0) return 0;
  const last = history[lastSameCentralRun];
  if (!last) return 0;
  const currentVersion = input.playerView.stateVersion;
  const distance = currentVersion - eventVersion(last);
  if (distance > 8) return 0;
  return target === "hq" ? 170 : 140;
}

function staleArchivesRepeatPenalty(input: AiDecisionInput, target: string | undefined, server: RunnerServerFeatures | undefined): number {
  if (target !== "archives" || !server) return 0;
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastIndex(history, (event) => isArchivesAccessEvent(event));
  const visibleArchivesCards =
    input.playerView.servers.find((candidate) => candidate.id === "archives")?.root ?? [];
  const archivesCardCount = input.playerView.opponent.discardCount;
  const hiddenArchivesCount = Math.max(0, archivesCardCount - visibleArchivesCards.length);
  const allVisibleArchivesLowValue =
    visibleArchivesCards.length > 0 &&
    visibleArchivesCards.every(
      (card) =>
        card.known &&
        card.definitionId &&
        isLowValueKnownArchivesAccessCard(card.definitionId),
    );
  if (lastArchivesAccessIndex < 0) {
    if (archivesCardCount === 0) return 260;
    if (hiddenArchivesCount === 0 && allVisibleArchivesLowValue) return 520;
    return 0;
  }
  if (history.slice(lastArchivesAccessIndex + 1).some((event) => eventMayChangeArchives(event))) return 0;
  if (hiddenArchivesCount > 0) return 0;
  const lastArchivesAccess = history[lastArchivesAccessIndex];
  if (!lastArchivesAccess) return 0;
  const accessedDefinitionId = stringPayloadValue(lastArchivesAccess, "cardDefinitionId");
  const visibleArchivesDefinitions = new Set(visibleArchivesCards.map((card) => card.definitionId).filter((definitionId): definitionId is string => Boolean(definitionId)));
  if (accessedDefinitionId && !visibleArchivesDefinitions.has(accessedDefinitionId)) return 0;
  if (visibleArchivesCards.length > 0 && visibleArchivesCards.every((card) => card.known && card.definitionId)) {
    return visibleArchivesCards.every((card) => isLowValueKnownArchivesAccessCard(card.definitionId!)) ? 640 : 0;
  }
  if (!accessedDefinitionId) return 0;
  return isLowValueKnownArchivesAccessCard(accessedDefinitionId) ? 360 : 0;
}

function mergedPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort((left, right) => eventVersion(left) - eventVersion(right));
}

function findLastIndex<T>(values: T[], predicate: (value: T) => boolean): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

function isArchivesAccessEvent(event: PublicGameEvent): boolean {
  return event.publicPayload.actionType === "access_card" && serverIdFromEvent(event) === "archives";
}

function eventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (payload.discardZone === "archives" || payload.hiddenZoneAction === "discard_phase") return true;
  const actionType = typeof payload.actionType === "string" ? payload.actionType : event.type;
  return actionType === "trash_accessed_card" || actionType === "trash_card" || actionType === "play_operation";
}

function stringPayloadValue(event: PublicGameEvent, key: string): string | undefined {
  const value = event.publicPayload[key];
  return typeof value === "string" ? value : undefined;
}

function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number" ? event.stateVersionAfter : 0;
}

function isKnownLowValueHqHand(input: AiDecisionInput, target: string | undefined, hqHandMemory: KnownHqHandMemory | undefined): boolean {
  if (target !== "hq" || !hqHandMemory?.allCardsKnown || hqHandMemory.knownDefinitions.length === 0) return false;
  return hqHandMemory.knownDefinitions.every((definitionId) => isLowValueKnownHqAccessCard(definitionId, input.playerView.own.credits));
}

function isLowValueKnownHqAccessCard(definitionId: string, runnerCredits: number): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost = runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost) return false;
  return true;
}

function isLowValueKnownArchivesAccessCard(definitionId: string): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  return Boolean(type && type !== "agenda");
}

export function evaluateRemoteThreat(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const features = extractRunnerFeatures(input);
  const target = targetServerId(input, candidate);
  const server = target ? features.serverFeatures.get(target) : undefined;
  const blocked = target ? features.blockedRunServers.has(target) : false;
  const remoteThreat = target?.startsWith("remote_") ? (server?.rootCount ?? 0) * 40 + (server?.advancedRootCount ?? 0) * 55 : 0;
  const lowReserveRemotePenalty = lowReserveRemoteContestPenalty(input, candidate, target, server);
  const recentRemotePenalty = recentRemoteContestPenalty(input, candidate, target);
  const remoteBeliefBoost =
    target?.startsWith("remote_")
      ? Math.round(
          (beliefState.runnerOpponentModel?.remoteCardBelief
            .filter((belief) => belief.serverId === target)
            .reduce((sum, belief) => sum + belief.confidence * 25, 0) ?? 0)
        )
      : 0;
  if (candidate.kind === "contest_remote" && blocked) {
    return {
      score: -90,
      reasons: ["remote_threat_unreachable_by_visible_ice"],
      evidence: [
        `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
        `advanced_roots:${server?.advancedRootCount ?? 0}`,
        `remote_belief_boost:${remoteBeliefBoost}`,
        `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
        `recent_remote_penalty:${recentRemotePenalty}`
      ]
    };
  }
  return {
    score: candidate.kind === "contest_remote" ? remoteThreat + 80 + remoteBeliefBoost - lowReserveRemotePenalty - recentRemotePenalty : candidate.kind === "safe_probe_run" ? Math.min(30, remoteThreat) : 0,
    reasons: sortedUnique([
      remoteThreat > 0 ? "remote_threat_visible" : "remote_threat_uncertain",
      ...(lowReserveRemotePenalty > 0 ? ["remote_contest_credit_reserve_low"] : []),
      ...(recentRemotePenalty > 0 ? ["recent_remote_contest_repeated"] : [])
    ]),
    evidence: [
      `remote_target:${target?.startsWith("remote_") ? target : "none"}`,
      `advanced_roots:${server?.advancedRootCount ?? 0}`,
      `remote_belief_boost:${remoteBeliefBoost}`,
      `low_reserve_remote_penalty:${lowReserveRemotePenalty}`,
      `recent_remote_penalty:${recentRemotePenalty}`
    ]
  };
}

function lowReserveRemoteContestPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined, server: RunnerServerFeatures | undefined): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) return 0;
  if (input.playerView.own.credits > 1) return 0;
  if ((server?.advancedRootCount ?? 0) > 0) return 0;
  if (input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 2) return 0;
  return 260;
}

function recentRemoteContestPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, target: string | undefined): number {
  if (candidate.kind !== "contest_remote" || !target?.startsWith("remote_")) return 0;
  const history = mergedPublicHistory(input);
  const lastSameRemoteRun = findLastIndex(
    history,
    (event) => serverIdFromEvent(event) === target && (event.publicPayload.actionType === "start_run" || event.type === "run_started")
  );
  if (lastSameRemoteRun < 0) return 0;
  const last = history[lastSameRemoteRun];
  if (!last) return 0;
  const distance = input.playerView.stateVersion - eventVersion(last);
  if (distance > 8) return 0;
  return recentSameRemoteJackOutWithoutAccess(history, lastSameRemoteRun, target) ? 620 : 180;
}

function recentSameRemoteJackOutWithoutAccess(history: PublicGameEvent[], startIndex: number, target: string): boolean {
  const afterStart = history.slice(startIndex + 1);
  const jackOutIndex = afterStart.findIndex((event) => {
    const actionType = typeof event.publicPayload.actionType === "string" ? event.publicPayload.actionType : event.type;
    if (actionType !== "jack_out") return false;
    const eventServerId = serverIdFromEvent(event);
    return eventServerId === undefined || eventServerId === target;
  });
  if (jackOutIndex < 0) return false;
  const beforeJackOut = afterStart.slice(0, jackOutIndex);
  if (beforeJackOut.some((event) => serverIdFromEvent(event) === target && event.publicPayload.actionType === "access_card")) return false;
  return !afterStart.slice(jackOutIndex + 1).some((event) => eventMayRefreshRemoteRun(event, target));
}

function eventMayRefreshRemoteRun(event: PublicGameEvent, target: string): boolean {
  const actionType = typeof event.publicPayload.actionType === "string" ? event.publicPayload.actionType : event.type;
  if (actionType === "access_card" && serverIdFromEvent(event) === target) return true;
  return (
    actionType === "gain_credit" ||
    actionType === "draw_card" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "trigger_ability" ||
    actionType === "rez_ice"
  );
}

export function evaluateCorpScoringThreat(input: AiDecisionInput, candidate: RunnerPlanCandidate, beliefState: BeliefState = reconstructBeliefState(input)): RunnerPlanEvaluatorResult {
  const corpAgenda = input.playerView.opponent.agendaPoints;
  const toWin = input.playerView.agendaPointsToWin;
  const pressureNeeded = toWin - corpAgenda <= 3;
  const scoringTrend = beliefState.runnerOpponentModel?.corpPlanEstimate.scoring ?? 0;
  const score = candidate.kind === "contest_remote" && pressureNeeded ? 80 + scoringTrend * 35 : isRunPlan(candidate.kind) && pressureNeeded ? 35 + scoringTrend * 20 : 0;
  return {
    score,
    reasons: pressureNeeded ? ["corp_near_scoring_threshold"] : ["corp_scoring_threshold_not_immediate"],
    evidence: [`corp_agenda:${corpAgenda}`, `agenda_to_win:${toWin}`, `corp_credits:${input.playerView.opponent.credits}`, `corp_scoring_trend:${round(scoringTrend)}`]
  };
}

export function runnerPlanUsesOnlyAiSupportedCards(input: AiDecisionInput, candidate: RunnerPlanCandidate): boolean {
  return candidate.legalActionIds.every((actionId) => {
    const action = input.legalActions.find((legalAction) => legalAction.actionId === actionId);
    if (!action || action.source === "basic_action" || action.source === "game_rule") return true;
    const card = findVisibleCard(input, action.source);
    return card ? isAiSupportedCard(card.definitionId) : true;
  });
}

function evaluateInstalledEconomyActions(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "recover_economy") return { score: 0, reasons: [], evidence: [] };
  const assessments = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .map((action) => (action ? classifyInstalledEconomyAction(input, action) : undefined))
    .filter((assessment): assessment is InstalledEconomyActionAssessment => Boolean(assessment));
  if (assessments.length === 0) return { score: 0, reasons: [], evidence: ["installed_economy:false"] };
  let score = 0;
  const reasons: string[] = [];
  const payout = assessments
    .filter((assessment) => assessment.kind === "direct_payout" || assessment.kind === "pool_payout")
    .sort((left, right) => right.netCredits - left.netCredits || right.immediateGain - left.immediateGain || left.ability.localeCompare(right.ability))[0];
  const poolBuild = assessments
    .filter((assessment) => assessment.kind === "pool_build")
    .sort((left, right) => right.futurePoolAfter - left.futurePoolAfter || left.ability.localeCompare(right.ability))[0];

  if (payout) {
    score += 90 + Math.max(0, payout.netCredits - 1) * 45 + (input.playerView.own.credits < 4 ? 120 : 35);
    reasons.push(payout.kind === "pool_payout" ? "installed_economy_pool_payout" : "installed_economy_direct_payout");
  }
  if (poolBuild) {
    if (input.playerView.own.credits < 4) {
      score -= 80;
      reasons.push("installed_economy_pool_build_deferred_for_credit_need");
    } else {
      score += 45 + Math.min(80, poolBuild.futurePoolAfter * 8);
      reasons.push("installed_economy_pool_build_future_value");
    }
  }

  const best = payout ?? poolBuild ?? assessments[0]!;
  return {
    score,
    reasons,
    evidence: [
      "installed_economy:true",
      `installed_economy_kind:${best.kind}`,
      `installed_economy_immediate_gain:${best.immediateGain}`,
      `installed_economy_net_credits:${best.netCredits}`,
      `installed_economy_stored_credits:${best.storedCredits}`,
      `installed_economy_future_pool_after:${best.futurePoolAfter}`,
      `economy_need:${input.playerView.own.credits < 4 ? "acute" : "stable"}`
    ]
  };
}

function evaluateShellTradersActions(input: AiDecisionInput, candidate: RunnerPlanCandidate): RunnerPlanEvaluatorResult {
  if (candidate.kind !== "build_rig") return { score: 0, reasons: [], evidence: [] };
  const assessments = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .map((action) => (action ? classifyShellTradersAction(input, action) : undefined))
    .filter((assessment): assessment is ShellTradersActionAssessment => Boolean(assessment));
  if (assessments.length === 0) return { score: 0, reasons: [], evidence: ["shell_traders:false"] };
  const backlog = shellTradersBacklog(input);

  const prepare = assessments
    .filter((assessment) => assessment.kind === "prepare")
    .sort((left, right) => shellTradersTargetValue(right) - shellTradersTargetValue(left) || left.shellCounters - right.shellCounters)[0];
  const remove = assessments
    .filter((assessment) => assessment.kind === "remove_counter")
    .sort(
      (left, right) =>
        Number(right.immediateInstall) - Number(left.immediateInstall) ||
        shellTradersTargetValue(right) - shellTradersTargetValue(left) ||
        left.shellCounters - right.shellCounters
    )[0];
  const preparePenalty = prepare ? shellTradersPrepareBacklogPenalty(input, backlog, remove, prepare) : 0;
  const prepareScore = prepare ? 165 + shellTradersTargetValue(prepare) + Math.max(0, 4 - input.playerView.own.credits) * 20 - preparePenalty : Number.NEGATIVE_INFINITY;
  const removeScore = remove ? (remove.immediateInstall ? 230 : 125 + Math.max(0, 4 - remove.shellCounters) * 12) + Math.min(85, shellTradersTargetValue(remove) / 2) : Number.NEGATIVE_INFINITY;
  const best = removeScore >= prepareScore ? remove ?? prepare ?? assessments[0]! : prepare ?? remove ?? assessments[0]!;
  const score = Math.max(prepareScore, removeScore, 0);
  const reasons = sortedUnique([
    ...(best.kind === "prepare" ? ["shell_traders_prepare_build_rig"] : [best.immediateInstall ? "shell_traders_finish_install" : "shell_traders_progress_counter"]),
    ...(prepare && preparePenalty > 0 ? ["shell_traders_prepare_backlog_limited"] : []),
    ...(backlog.preparedCount >= 2 ? ["shell_traders_backlog_present"] : []),
    ...(remove?.immediateInstall ? ["shell_traders_immediate_install_available"] : [])
  ]);

  return {
    score,
    reasons,
    evidence: [
      "shell_traders:true",
      `shell_traders_kind:${best.kind}`,
      `shell_traders_prepare_actions:${assessments.filter((assessment) => assessment.kind === "prepare").length}`,
      `shell_traders_remove_actions:${assessments.filter((assessment) => assessment.kind === "remove_counter").length}`,
      `shell_traders_backlog:${backlog.preparedCount}`,
      `shell_traders_near_install:${backlog.nearInstallCount}`,
      `shell_traders_total_counters:${backlog.totalShellCounters}`,
      `shell_traders_prepare_score:${Number.isFinite(prepareScore) ? round(prepareScore) : "none"}`,
      `shell_traders_remove_score:${Number.isFinite(removeScore) ? round(removeScore) : "none"}`,
      `shell_traders_prepare_backlog_penalty:${preparePenalty}`,
      `shell_traders_immediate_install:${best.immediateInstall}`,
      `shell_traders_direct_install_available:${best.directInstallAvailable}`,
      `shell_traders_direct_install_urgency:${best.directInstallUrgency}`,
      `shell_traders_target_roles:${best.targetRoles.slice(0, 3).join(",") || "unknown"}`,
      `shell_traders_shell_counters:${best.shellCounters}`,
      `shell_traders_source_visible:${best.sourceVisible}`
    ]
  };
}

function shellTradersBacklog(input: AiDecisionInput): ShellTradersBacklog {
  const preparedCards = input.playerView.specialZones?.setAside.filter((card) => card.known && card.owner === "runner" && card.counters?.shell !== undefined) ?? [];
  return {
    preparedCount: preparedCards.length,
    nearInstallCount: preparedCards.filter((card) => Math.max(0, card.counters?.shell ?? 0) <= 1).length,
    totalShellCounters: preparedCards.reduce((sum, card) => sum + Math.max(0, card.counters?.shell ?? 0), 0)
  };
}

function shellTradersPrepareBacklogPenalty(
  input: AiDecisionInput,
  backlog: ShellTradersBacklog,
  remove: ShellTradersActionAssessment | undefined,
  prepare?: ShellTradersActionAssessment
): number {
  let penalty = 0;
  if (backlog.preparedCount >= 2) penalty += 180 + Math.max(0, backlog.preparedCount - 2) * 45;
  else if (backlog.preparedCount === 1) penalty += 55;
  if (remove?.immediateInstall) penalty += 110;
  if (backlog.nearInstallCount > 0) penalty += backlog.nearInstallCount * 35;
  if (input.playerView.own.credits <= 1 && backlog.preparedCount >= 2) penalty += 55;
  if (prepare?.directInstallAvailable) penalty += shellTradersDirectInstallPreparePenalty(prepare);
  return penalty;
}

function classifyShellTradersAction(input: AiDecisionInput, action: LegalAction): ShellTradersActionAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner" || action.type !== "trigger_ability") return undefined;
  if (action.source === "basic_action" || action.source === "game_rule") return undefined;
  const ability = action.payload?.shellTradersAbility;
  if (ability !== "set_aside_from_grip" && ability !== "remove_shell_counter") return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  const sourceVisible = Boolean(sourceCard && input.playerView.own.rig?.some((card) => card.instanceId === sourceCard.instanceId && card.known));
  if (!sourceVisible) return undefined;

  const targetCardId = typeof action.payload?.targetCardId === "string" ? action.payload.targetCardId : "";
  const targetDefinitionId =
    typeof action.payload?.targetCardDefinitionId === "string"
      ? action.payload.targetCardDefinitionId
      : findVisibleCard(input, targetCardId)?.definitionId;
  const targetRoles = rolesForCardId(targetDefinitionId);
  const directInstall = ability === "set_aside_from_grip" ? shellTradersDirectInstallAction(input, targetCardId) : undefined;
  const directInstallRemainingCredits = directInstall ? input.playerView.own.credits - actionCreditCost(directInstall) : undefined;
  const directInstallUrgency = directInstall ? shellTradersDirectInstallUrgency(input, targetRoles, directInstallRemainingCredits ?? 0) : 0;
  const shellCounters = Math.max(0, numberPayload(action, "shellCounterAmount"), numberPayload(action, "remainingCountersBefore"), numberPayload(action, "remainingCounters"));
  const immediateInstall = ability === "remove_shell_counter" && shellCounters <= 1;
  return {
    kind: ability === "set_aside_from_grip" ? "prepare" : "remove_counter",
    shellCounters,
    ...(targetDefinitionId ? { targetDefinitionId } : {}),
    targetRoles,
    immediateInstall,
    sourceVisible,
    directInstallAvailable: Boolean(directInstall),
    ...(directInstallRemainingCredits !== undefined ? { directInstallRemainingCredits } : {}),
    directInstallUrgency
  };
}

function shellTradersTargetValue(assessment: ShellTradersActionAssessment): number {
  let value = 0;
  if (assessment.targetRoles.some((role) => role.startsWith("breaker_"))) value += 105;
  if (assessment.targetRoles.includes("memory") || assessment.targetRoles.includes("memory_support")) value += 55;
  if (assessment.targetRoles.includes("setup") || assessment.targetRoles.includes("build_rig")) value += 45;
  if (assessment.targetRoles.includes("economy") || assessment.targetRoles.includes("tempo")) value += 20;
  value += Math.min(60, assessment.shellCounters * 10);
  return value;
}

function shellTradersDirectInstallAction(input: AiDecisionInput, targetCardId: string): LegalAction | undefined {
  if (!targetCardId) return undefined;
  return input.legalActions.find((action) => action.type === "install_card" && action.source === targetCardId);
}

function shellTradersDirectInstallUrgency(input: AiDecisionInput, roles: string[], remainingCredits: number): number {
  const features = extractRunnerFeatures(input);
  let urgency = 0;
  if (roles.some((role) => role.startsWith("breaker_") && !features.rigRoles.has(role))) urgency += 145;
  if (roles.some((role) => role.startsWith("breaker_") && features.rigRoles.has(role))) urgency -= 25;
  if (roles.includes("memory") || roles.includes("memory_support")) urgency += features.memoryRemaining <= 1 ? 110 : 25;
  if (roles.includes("setup") || roles.includes("build_rig")) urgency += features.rigRoles.size === 0 ? 45 : 15;
  if (roles.includes("economy") || roles.includes("tempo")) urgency += input.playerView.own.credits < 4 ? 55 : 15;
  if (remainingCredits >= 2) urgency += 45;
  else if (remainingCredits < 1) urgency -= 35;
  return Math.max(0, urgency);
}

function shellTradersDirectInstallPreparePenalty(assessment: ShellTradersActionAssessment): number {
  if (!assessment.directInstallAvailable) return 0;
  let penalty = 35 + Math.min(170, assessment.directInstallUrgency);
  if ((assessment.directInstallRemainingCredits ?? 0) >= 2) penalty += 35;
  return penalty;
}

function classifyInstalledEconomyAction(input: AiDecisionInput, action: LegalAction): InstalledEconomyActionAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner" || (action.type !== "trigger_ability" && action.type !== "activated_card_ability")) return undefined;
  if (action.source === "basic_action" || action.source === "game_rule") return undefined;
  const sourceCard = findVisibleCard(input, action.source);
  if (!sourceCard || !input.playerView.own.rig?.some((card) => card.instanceId === sourceCard.instanceId && card.known)) return undefined;
  const ability = runnerInstalledEconomyAbilityId(action, sourceCard);
  const roles = rolesForCardId(sourceCard.definitionId);
  const storedCredits = Math.max(0, sourceCard.counters?.power ?? sourceCard.counters?.bit ?? sourceCard.counters?.recurring_credit ?? 0);
  const activatedGain = activatedRunnerEconomyCreditGain(action, sourceCard, storedCredits);
  const activatedBuild = activatedRunnerEconomyCreditBuild(action, sourceCard);
  const immediateGain = Math.max(0, activatedGain, numberPayload(action, "gainCreditsAmount"), numberPayload(action, "gainedCredits"), numberPayload(action, "amount"), numberPayload(action, "removePowerCounterAmount"));
  const addedCounters = Math.max(0, activatedBuild, numberPayload(action, "addCounterAmount"), numberPayload(action, "addedCounterAmount"));
  const removedCounters = Math.max(0, activatedGain, numberPayload(action, "removePowerCounterAmount"), numberPayload(action, "removeCounterAmount"), numberPayload(action, "removedCounterAmount"));
  const futurePoolAfter = Math.max(storedCredits, storedCredits + addedCounters - removedCounters);
  const netCredits = immediateGain - actionCreditCost(action);

  if (ability === "broker_load_credits") {
    const cost = actionCreditCost(action);
    return { kind: "pool_build", immediateGain: 0, netCredits: cost > 0 ? -cost : 0, storedCredits, futurePoolAfter, ability };
  }
  if (ability === "broker_take_credits") {
    const brokerGain = Math.max(immediateGain, storedCredits);
    return { kind: "pool_payout", immediateGain: brokerGain, netCredits: brokerGain - actionCreditCost(action), storedCredits, futurePoolAfter: 0, ability };
  }
  if (ability === "short_term_contract_take_credits") {
    return { kind: "direct_payout", immediateGain, netCredits, storedCredits, futurePoolAfter: Math.max(0, storedCredits - Math.max(removedCounters, immediateGain)), ability };
  }
  if (immediateGain > 0 && (removedCounters > 0 || storedCredits > 0)) {
    return { kind: "pool_payout", immediateGain, netCredits, storedCredits, futurePoolAfter: Math.max(0, futurePoolAfter), ability: ability || "counter_payout" };
  }
  if (immediateGain > 0) {
    return { kind: "direct_payout", immediateGain, netCredits, storedCredits, futurePoolAfter, ability: ability || "credit_payout" };
  }
  if (addedCounters > 0 && (ability || roles.some((role) => role.includes("economy")))) {
    const cost = actionCreditCost(action);
    return { kind: "pool_build", immediateGain: 0, netCredits: cost > 0 ? -cost : 0, storedCredits, futurePoolAfter, ability: ability || "counter_build" };
  }
  if (roles.some((role) => role.includes("economy")) && ability) {
    return { kind: "side_economy", immediateGain: 0, netCredits: -actionCreditCost(action), storedCredits, futurePoolAfter, ability };
  }
  return undefined;
}

function runnerInstalledEconomyAbilityId(action: LegalAction, sourceCard: VisibleCard): string {
  if (typeof action.payload?.resourceAbility === "string") return action.payload.resourceAbility;
  if (action.type !== "activated_card_ability") return "";
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (sourceCard.definitionId === "onr_v1_154_broker") {
    if (/auf Broker legen/i.test(label)) return "broker_load_credits";
    if (/von Broker nehmen/i.test(label)) return "broker_take_credits";
  }
  if (
    sourceCard.definitionId === "onr_v1_178_short-term-contract" &&
    /Credits?\s+nehmen/i.test(label)
  )
    return "short_term_contract_take_credits";
  return "";
}

function activatedRunnerEconomyCreditGain(
  action: LegalAction,
  sourceCard: VisibleCard,
  storedCredits: number,
): number {
  if (action.type !== "activated_card_ability") return 0;
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (
    sourceCard.definitionId === "onr_v1_154_broker" &&
    /von Broker nehmen/i.test(label)
  )
    return storedCredits;
  const match = /(\d+)\s+Credits?\s+nehmen/i.exec(label);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(storedCredits, amount);
}

function activatedRunnerEconomyCreditBuild(
  action: LegalAction,
  sourceCard: VisibleCard,
): number {
  if (action.type !== "activated_card_ability") return 0;
  const label =
    typeof action.payload?.cardImplementationAbilityLabel === "string"
      ? action.payload.cardImplementationAbilityLabel
      : action.label;
  if (
    sourceCard.definitionId !== "onr_v1_154_broker" ||
    !/auf Broker legen/i.test(label)
  )
    return 0;
  const match = /(\d+)\s+Credits?/i.exec(label);
  const amount = Number(match?.[1] ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function buildCandidate(input: AiDecisionInput, kind: RunnerPlanKind, actions: LegalAction[]): RunnerPlanCandidate | null {
  const legalActions = actions.filter((action) => action.side === "runner" && PLAN_ACTION_TYPES.has(action.type));
  if (legalActions.length === 0) return null;
  const steps = legalActions.map((action, index) => ({
    stepId: `${kind}:step:${index + 1}`,
    actionId: action.actionId,
    actionType: action.type,
    ...(typeof action.payload?.serverId === "string" ? { targetServerId: action.payload.serverId } : {}),
    roleTags: rolesForAction(input, action)
  }));
  const requiredRoles = sortedUnique(steps.flatMap((step) => step.roleTags));
  return {
    planId: `${kind}:${legalActions.map((action) => action.actionId).sort().join("|")}`,
    kind,
    legalActionIds: legalActions.map((action) => action.actionId).sort(),
    steps,
    visibleBenefits: visibleBenefitsForPlan(kind),
    visibleRisks: visibleRisksForPlan(kind, requiredRoles),
    uncertainty: uncertaintyForPlan(kind),
    requiredRoles
  };
}

function selectPlanAction(input: AiDecisionInput, candidate: RunnerPlanCandidate): LegalAction | undefined {
  return candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action))
    .sort((left, right) => actionPriority(candidate.kind, right, input) - actionPriority(candidate.kind, left, input) || compareAction(left, right))[0];
}

function runnerActionAlternativesForPlan(input: AiDecisionInput, candidate: RunnerPlanCandidate, selectedActionId: string): AiDecisionActionAlternative[] {
  return candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => Boolean(action))
    .map((action) => ({
      action,
      priority: actionPriority(candidate.kind, action, input)
    }))
    .sort((left, right) => right.priority - left.priority || compareAction(left.action, right.action))
    .slice(0, 8)
    .map((entry, index) => runnerActionAlternativeForAction(input, candidate.kind, entry.action, entry.priority, entry.action.actionId === selectedActionId, index + 1));
}

function runnerActionAlternativeForAction(
  input: AiDecisionInput,
  kind: RunnerPlanKind,
  action: LegalAction,
  priority: number,
  selected: boolean,
  rank: number
): AiDecisionActionAlternative {
  const sourceCard = action.source !== "basic_action" && action.source !== "game_rule" ? findVisibleCard(input, action.source) : undefined;
  const sourceTitle = sourceCard && isDebugPublicSourceCard(input, sourceCard.instanceId) ? sourceCard.title : undefined;
  const installedEconomy = classifyInstalledEconomyAction(input, action);
  const economyNeed = input.playerView.own.credits < 4 ? "acute" : "stable";
  const economy =
    kind === "recover_economy" && action.type === "gain_credit"
      ? {
          economyKind: "basic_credit",
          immediateGain: 1,
          netCredits: 1,
          storedCredits: 0,
          futurePoolAfter: 0,
          economyNeed
        }
      : installedEconomy
        ? {
            economyKind: installedEconomy.kind,
            ability: installedEconomy.ability,
            immediateGain: installedEconomy.immediateGain,
            netCredits: installedEconomy.netCredits,
            storedCredits: installedEconomy.storedCredits,
            futurePoolAfter: installedEconomy.futurePoolAfter,
            economyNeed
          }
        : undefined;
  return {
    rank,
    actionId: action.actionId,
    actionType: action.type,
    label: sourceTitle || action.source === "basic_action" || action.source === "game_rule" ? action.label : action.type,
    source: sourceCard ? (sourceTitle ? "visible_card" : "private_card") : action.source,
    ...(sourceTitle ? { sourceTitle } : {}),
    selected,
    priority: roundScore(priority),
    ...(selected ? { whyChosen: runnerActionWhy(input, action, installedEconomy, true) } : { whyNot: runnerActionWhy(input, action, installedEconomy, false) }),
    ...(economy ? { economy } : {})
  };
}

function isDebugPublicSourceCard(input: AiDecisionInput, instanceId: string): boolean {
  const ownPublicCards = [
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ? [input.playerView.own.rig] : []),
    ...input.playerView.servers.map((server) => [...server.ice, ...server.root])
  ];
  const opponentPublicCards = [
    input.playerView.opponent.scoreArea,
    ...(input.playerView.opponent.rig ? [input.playerView.opponent.rig] : [])
  ];
  return [...ownPublicCards, ...opponentPublicCards].some((cards) => cards.some((card) => card.instanceId === instanceId && card.known));
}

function runnerActionWhy(input: AiDecisionInput, action: LegalAction, installedEconomy: InstalledEconomyActionAssessment | undefined, selected: boolean): string[] {
  if (selected) return ["selected_action"];
  if (action.type === "gain_credit") return ["basic_credit_lower_action_priority"];
  if (!installedEconomy) return ["lower_action_priority"];
  if (installedEconomy.kind === "pool_build") {
    return input.playerView.own.credits < 4 ? ["pool_build_deferred_for_credit_need"] : ["pool_build_future_value_below_selected_action"];
  }
  if (installedEconomy.kind === "pool_payout") return ["pool_payout_lower_action_priority"];
  if (installedEconomy.kind === "direct_payout") return ["direct_payout_lower_action_priority"];
  return ["side_economy_lower_action_priority"];
}

function actionPriority(kind: RunnerPlanKind, action: LegalAction, input: AiDecisionInput): number {
  const reachedAccessMovement = runnerReachedAccessMovement(input);
  const affordableMovement = runnerCanAffordCurrentMovementIce(input);
  if (kind === "trash_asset" && action.type === "trash_accessed_card") return 100;
  if ((kind === "pressure_rnd" || kind === "pressure_hq" || kind === "contest_remote" || kind === "safe_probe_run") && action.type === "start_run") return 90;
  if (kind === "safe_probe_run" && action.type === "continue_run") return reachedAccessMovement || affordableMovement ? 92 : 70;
  if (kind === "safe_probe_run" && action.type === "jack_out") return reachedAccessMovement || affordableMovement ? 30 : 88;
  if (kind === "build_rig" && action.type === "install_card") return runnerInstallPriority(input, action);
  if (kind === "build_rig" && (action.type === "trigger_ability" || action.type === "activated_card_ability")) return runnerShellTradersPriority(input, action);
  if (kind === "recover_economy" && action.type === "play_event") return 80;
  if (kind === "recover_economy" && (action.type === "trigger_ability" || action.type === "activated_card_ability")) return runnerInstalledEconomyPriority(input, action);
  if (kind === "recover_economy" && action.type === "gain_credit") return 65;
  if (kind === "draw_for_answers" && action.type === "play_event") return 70;
  if (kind === "draw_for_answers" && action.type === "draw_card") return 60;
  return 10;
}

function runnerReachedAccessMovement(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  return (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run?.phase === "movement" &&
    run.position?.kind === "server"
  );
}

function runnerCanAffordCurrentMovementIce(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  if (
    input.playerView.timingPoint !== "run.jack_out_window" ||
    run?.phase !== "movement" ||
    run.position?.kind !== "ice"
  )
    return false;
  const server = input.playerView.servers.find((candidate) => candidate.id === run.position?.serverId);
  const ice = server?.ice[run.position.iceIndex];
  if (!ice?.known || ice.rezzed !== true) return false;
  return !assessKnownRezzedIcePath([ice], input.playerView.own.rig ?? [], input.playerView.own.credits).blocked;
}

function extractRunnerFeatures(input: AiDecisionInput): RunnerFeatures {
  const rigCards = input.playerView.own.rig ?? [];
  const rigRoles = new Set(rigCards.flatMap((card) => rolesForCardId(card.definitionId)));
  const handRoles = new Set(input.playerView.own.gripOrHq.flatMap((card) => rolesForCardId(card.definitionId)));
  const serverFeatures = new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        rezzedIceCount: server.ice.filter((card) => card.rezzed === true).length,
        advancedRootCount: server.root.filter((card) => (card.advancementCounters ?? 0) > 0).length
      }
    ])
  );
  const blockedRunServers = new Set<string>();
  const visibleRunBreakCosts = new Map<string, number>();
  for (const server of input.playerView.servers) {
    const assessment = assessKnownRezzedIcePath(server.ice, rigCards, input.playerView.own.credits);
    if (assessment.visibleBreakCost !== undefined) visibleRunBreakCosts.set(server.id, assessment.visibleBreakCost);
    if (assessment.blocked) blockedRunServers.add(server.id);
  }
  return {
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    citySurveillanceSourceCount: visibleCitySurveillanceSourceCount(input),
    memoryRemaining: (input.playerView.own.memoryLimit ?? 0) - (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    handRoles,
    serverFeatures,
    blockedRunServers,
    visibleRunBreakCosts
  };
}

function rolesForAction(input: AiDecisionInput, action: LegalAction): string[] {
  if (action.source === "basic_action" || action.source === "game_rule") return [];
  const visible = findVisibleCard(input, action.source);
  return rolesForCardId(visible?.definitionId);
}

function findVisibleCard(input: AiDecisionInput, instanceId: string): VisibleCard | undefined {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root])
  ];
  return zones.flat().find((card) => card.instanceId === instanceId && card.known);
}

function visibleCitySurveillanceSourceCount(input: AiDecisionInput): number {
  return input.playerView.servers.reduce(
    (count, server) =>
      count +
      server.root.filter(
        (card) =>
          card.known &&
          card.rezzed === true &&
          card.definitionId === "onr_v1_313_city-surveillance",
      ).length,
    0,
  );
}

function rolesForCardId(cardId: string | undefined): string[] {
  if (!cardId || !isAiSupportedCard(cardId)) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  return sortedUnique([...(roleRecord?.roles ?? []), ...(hint?.roles ?? []), ...(hint?.planRoles ?? [])]);
}

function lowReserveInstallPenalty(input: AiDecisionInput, candidate: RunnerPlanCandidate, credits: number): number {
  const installActions = candidate.legalActionIds
    .map((actionId) => input.legalActions.find((action) => action.actionId === actionId))
    .filter((action): action is LegalAction => action?.type === "install_card");
  if (installActions.length === 0) return 0;
  const bestRemainingCredits = Math.max(...installActions.map((action) => credits - actionCreditCost(action)));
  return bestRemainingCredits < 2 ? 460 : 0;
}

function runnerInstallPriority(input: AiDecisionInput, action: LegalAction): number {
  const features = extractRunnerFeatures(input);
  const breakerPressure = assessVisibleBreakerPressure(input);
  const roles = rolesForAction(input, action);
  const remainingCredits = features.credits - actionCreditCost(action);
  let priority = 85;
  if (breakerPressure.matchingInstallActionIds.has(action.actionId)) priority += 120;
  if (roles.some((role) => role.startsWith("breaker_") && !features.rigRoles.has(role))) priority += 45;
  if (roles.includes("memory") || roles.includes("memory_support")) priority += features.memoryRemaining <= 1 ? 70 : 20;
  if (roles.includes("efficient_breaker")) priority += 12;
  if (roles.includes("flex_breaker")) priority += 10;
  if (remainingCredits >= 2) priority += 15;
  if (remainingCredits < 2) priority -= 55;
  if (roles.some((role) => role.startsWith("breaker_") && features.rigRoles.has(role))) priority -= 18;
  return priority;
}

function runnerInstalledEconomyPriority(input: AiDecisionInput, action: LegalAction): number {
  const assessment = classifyInstalledEconomyAction(input, action);
  if (!assessment) return 10;
  if (assessment.kind === "pool_payout") return 88 + Math.max(0, assessment.netCredits - 1) * 8;
  if (assessment.kind === "direct_payout") return 84 + Math.max(0, assessment.netCredits - 1) * 7;
  if (assessment.kind === "pool_build") return input.playerView.own.credits < 4 ? 42 : 68 + Math.min(20, assessment.futurePoolAfter * 2);
  return input.playerView.own.credits < 4 ? 35 : 58;
}

function runnerShellTradersPriority(input: AiDecisionInput, action: LegalAction): number {
  const assessment = classifyShellTradersAction(input, action);
  if (!assessment) return 10;
  if (assessment.kind === "remove_counter") {
    return assessment.immediateInstall ? 132 : 86 + Math.max(0, 4 - assessment.shellCounters) * 5;
  }
  const backlog = shellTradersBacklog(input);
  const hasImmediateRemove = input.legalActions.some((candidate) => classifyShellTradersAction(input, candidate)?.immediateInstall === true);
  const backlogPenalty = shellTradersPrepareBacklogPenalty(input, backlog, hasImmediateRemove ? { ...assessment, kind: "remove_counter", immediateInstall: true } : undefined, assessment);
  return 96 + Math.min(35, shellTradersTargetValue(assessment) / 5) + Math.max(0, 4 - input.playerView.own.credits) * 5 - Math.min(90, Math.round(backlogPenalty / 4));
}

function assessVisibleBreakerPressure(input: AiDecisionInput): VisibleBreakerPressure {
  const rigCards = input.playerView.own.rig ?? [];
  const gripCards = input.playerView.own.gripOrHq.filter((card) => card.known && card.definitionId);
  const missingIceDefinitionIds = new Set<string>();
  const blockedServerIds = new Set<string>();
  for (const server of input.playerView.servers) {
    if (!isStrategicBreakerTarget(server)) continue;
    const assessment = assessKnownRezzedIcePath(server.ice, rigCards, input.playerView.own.credits);
    if (!assessment.blocked) continue;
    const missingDefinitions = server.ice
      .filter((ice) => ice.known && ice.rezzed === true && ice.definitionId && iceHasEndTheRun(ice.definitionId))
      .map((ice) => ice.definitionId!)
      .filter((definitionId) => !rigCards.some((card) => card.definitionId && canBreakerDefinitionBreakIce(card.definitionId, definitionId)));
    if (missingDefinitions.length === 0) continue;
    blockedServerIds.add(server.id);
    for (const definitionId of missingDefinitions) missingIceDefinitionIds.add(definitionId);
  }
  const matchingGripBreakers = gripCards.filter((card) =>
    [...missingIceDefinitionIds].some((iceDefinitionId) => canBreakerDefinitionBreakIce(card.definitionId!, iceDefinitionId))
  );
  const matchingGripIds = new Set(matchingGripBreakers.map((card) => card.instanceId));
  const matchingInstallActionIds = new Set(
    input.legalActions
      .filter((action) => action.type === "install_card" && typeof action.source === "string" && matchingGripIds.has(action.source))
      .map((action) => action.actionId)
  );
  return {
    blockedServerIds,
    matchingGripBreakerCount: matchingGripBreakers.length,
    matchingInstallActionIds,
    missingAnswerCount: matchingGripBreakers.length === 0 ? missingIceDefinitionIds.size : 0
  };
}

function isStrategicBreakerTarget(server: AiDecisionInput["playerView"]["servers"][number]): boolean {
  if (server.id === "rd" || server.id === "hq") return true;
  return server.id.startsWith("remote_") && server.root.length > 0;
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (Number.isFinite(cost.credits) ? cost.credits ?? 0 : 0), 0);
}

function numberPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isAiSupportedCard(cardId: string | undefined): boolean {
  return Boolean(cardId && RUNTIME_CARDS[cardId]?.statuses.ai_supported === true);
}

function runnerPlanProfile(input: AiDecisionInput): RunnerPlanProfile {
  return (
    RUNNER_PLAN_PROFILES.find((profile) => profile.profileId === input.profileId || profile.legacyProfileIds.includes(input.profileId)) ??
    RUNNER_PLAN_PROFILES.find((profile) => profile.difficulty === input.difficulty) ??
    RUNNER_PLAN_PROFILES[1]!
  );
}

function targetServerId(input: AiDecisionInput, candidate: RunnerPlanCandidate): string | undefined {
  for (const actionId of candidate.legalActionIds) {
    const action = input.legalActions.find((legalAction) => legalAction.actionId === actionId);
    if (typeof action?.payload?.serverId === "string") return action.payload.serverId;
  }
  return undefined;
}

function publicServerMentions(input: AiDecisionInput, serverId: string | undefined): number {
  if (!serverId) return 0;
  return input.eventTail.filter((event) => serverIdFromEvent(event) === serverId).length;
}

function isLowInformationRunTarget(features: RunnerFeatures, serverId: string): boolean {
  const server = features.serverFeatures.get(serverId);
  if (!server) return false;
  return server.iceCount <= 1 && server.rootCount === 0;
}

function fallbackPlanDecision(input: AiDecisionInput, reason: string, timeBudgetMs: number, timeoutUsed: boolean, beliefState: BeliefState): RunnerPlanDecision {
  const fallbackAction = input.legalActions.slice().sort(compareAction)[0];
  return {
    selectedPlanId: "fallback",
    selectedActionId: fallbackAction?.actionId ?? "",
    selectedActionType: fallbackAction?.type ?? "none",
    fallbackUsed: true,
    score: { planId: "fallback", score: 0, confidence: 0.2, reasons: [reason], evidence: [reason], scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]) },
    debug: fallbackDebug(input, undefined, reason, timeBudgetMs, timeoutUsed, beliefState)
  };
}

function fallbackDebug(
  input: AiDecisionInput,
  fallbackDecision: AiDecision | undefined,
  reason: string,
  timeBudgetMs: number | undefined,
  timeoutUsed = false,
  beliefState: BeliefState = reconstructBeliefState(input)
): RunnerPlanDebug {
  const fallbackAction = fallbackDecision ? input.legalActions.find((action) => action.actionId === fallbackDecision.actionId) : input.legalActions.slice().sort(compareAction)[0];
  const beliefSummary = beliefDebugSummary(beliefState);
  const opponentModel = toRecord(beliefSummary.runnerOpponentModel);
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 2,
    summary: "Der Runner nutzt einen legalen Fallback.",
    planId: "fallback",
    planKind: "fallback",
    selectedActionType: fallbackAction?.type ?? "none",
    score: 0,
    confidence: fallbackDecision?.confidence ?? 0.2,
    visibleReasons: [reason],
    rankedAlternatives: [
      {
        rank: 1,
        planId: "fallback",
        planKind: "fallback",
        selectedActionType: fallbackAction?.type ?? "none",
        summary: "Legal fallback action",
        score: 0,
        confidence: fallbackDecision?.confidence ?? 0.2,
        visibleReasons: [reason],
        scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
        whyNot: [],
        warnings: ["fallback_used"]
      }
    ],
    scoreBreakdown: scoreComponents([["fallback", "Fallback", 0, 1, reason]]),
    whyNot: [reason],
    longTermPlan: longTermPlanForRunner(input, "fallback"),
    warnings: ["fallback_used"],
    detailSections: [{ id: "fallback", title: "Fallback", items: [reason] }],
    uncertainty: ["unknown_corp_cards_remain_unknown"],
    evidence: scrubPlanEvidence([reason]),
    fallbackUsed: true,
    seed: input.seed,
    profileId: runnerPlanProfile(input).profileId,
    timeBudgetMs: timeBudgetMs ?? runnerPlanProfile(input).timeBudgetMs,
    timeoutUsed,
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    invalidations: toStringArray(beliefSummary.invalidations),
    beliefUncertainty: toStringArray(beliefSummary.uncertainty),
    ...(opponentModel ? { opponentModel } : {}),
    ...(input.ownDeckDoctrine ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine), doctrinePlanWeight: 0 } : {})
  };
}

type ScoreComponentInput = [key: string, label: string, value: number, weight?: number | undefined, reason?: string | undefined];

function scoreComponents(inputs: ScoreComponentInput[]): AiDecisionScoreComponent[] {
  return inputs
    .filter(([, , value], index) => index === 0 || value !== 0)
    .map(([key, label, value, weight, reason]) => ({
      key,
      label,
      value: roundScore(value),
      ...(weight !== undefined ? { weight: round(weight) } : {}),
      ...(reason ? { reason } : {})
    }))
    .slice(0, 16);
}

function firstReason(reasons: string[]): string | undefined {
  return reasons.find((reason) => reason.length > 0);
}

function rankedRunnerAlternatives(
  input: AiDecisionInput,
  scored: Array<{ candidate: RunnerPlanCandidate; score: RunnerPlanScore }>,
  selectedPlanId: string
): AiDecisionRankedAlternative[] {
  const selectedScore = scored.find((entry) => entry.candidate.planId === selectedPlanId)?.score.score ?? scored[0]?.score.score ?? 0;
  return scored.slice(0, 5).map((entry, index) => {
    const representativeAction = selectPlanAction(input, entry.candidate);
    return {
      rank: index + 1,
      planId: entry.candidate.planId,
      planKind: entry.candidate.kind,
      selectedActionType: representativeAction?.type ?? entry.candidate.steps[0]?.actionType ?? "none",
      summary: explanationForPlan(entry.candidate.kind),
      score: entry.score.score,
      confidence: entry.score.confidence,
      visibleReasons: entry.score.reasons.slice(0, 4),
      scoreBreakdown: entry.score.scoreBreakdown.slice(0, 8),
      whyNot: alternativeWhyNot(entry.candidate, entry.score, selectedScore, entry.candidate.planId === selectedPlanId),
      warnings: entry.candidate.visibleRisks.slice(0, 3)
    };
  });
}

function alternativeWhyNot(candidate: RunnerPlanCandidate, score: RunnerPlanScore, selectedScore: number, isSelected: boolean): string[] {
  if (isSelected) return ["selected_plan"];
  const delta = roundScore(selectedScore - score.score);
  return sortedUnique([
    ...(delta > 0 ? [`lower_score_by:${delta}`] : []),
    ...candidate.visibleRisks.slice(0, 2),
    ...candidate.uncertainty.slice(0, 2),
    ...score.reasons.slice(0, 3)
  ]).slice(0, 6);
}

function longTermPlanForRunner(input: AiDecisionInput, kind: RunnerPlanKind | "fallback"): string[] {
  return sortedUnique([
    `active_plan:${kind}`,
    ...(input.ownDeckDoctrine?.side === "runner" ? input.ownDeckDoctrine.archetypeTags.slice(0, 3).map((tag) => `doctrine:${tag}`) : ["doctrine:neutral"]),
    ...(input.ownDeckDoctrine?.side === "runner" ? input.ownDeckDoctrine.riskFlags.slice(0, 2).map((flag) => `risk_flag:${flag}`) : [])
  ]).slice(0, 6);
}

function runnerDetailSections(candidate: RunnerPlanCandidate, score: RunnerPlanScore): NonNullable<RunnerPlanDebug["detailSections"]> {
  return [
    { id: "visible_reasons", title: "Sichtbare Gründe", items: score.reasons.slice(0, 6) },
    { id: "evidence", title: "Evidence", items: scrubPlanEvidence(score.evidence).slice(0, 8) },
    { id: "uncertainty", title: "Unsicherheit", items: candidate.uncertainty.slice(0, 6) }
  ].filter((section) => section.items.length > 0);
}

function baseScoreForPlan(kind: RunnerPlanKind): number {
  switch (kind) {
    case "pressure_rnd":
      return 300;
    case "pressure_hq":
      return 270;
    case "contest_remote":
      return 295;
    case "build_rig":
      return 255;
    case "recover_economy":
      return 230;
    case "draw_for_answers":
      return 215;
    case "trash_asset":
      return 360;
    case "safe_probe_run":
      return 185;
  }
}

function doctrinePlanWeightFor(input: AiDecisionInput, kind: RunnerPlanKind): number {
  const profile = input.ownDeckDoctrine;
  if (!profile || profile.side !== "runner") return 0;
  const raw = profile.planWeights[kind] ?? 0;
  const confidence = Number.isFinite(profile.confidence) ? profile.confidence : 0.5;
  return Math.round(raw * Math.max(0.25, Math.min(1, confidence)));
}

function deckDoctrineDebug(profile: AiDeckDoctrineProfile): NonNullable<RunnerPlanDebug["ownDeckDoctrine"]> {
  return {
    schemaVersion: profile.schemaVersion,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 3),
    riskFlags: profile.riskFlags.slice(0, 5)
  };
}

function visibleBenefitsForPlan(kind: RunnerPlanKind): string[] {
  switch (kind) {
    case "pressure_rnd":
      return ["benefit:rd_pressure"];
    case "pressure_hq":
      return ["benefit:hq_pressure"];
    case "contest_remote":
      return ["benefit:remote_contest"];
    case "build_rig":
      return ["benefit:rig_setup"];
    case "recover_economy":
      return ["benefit:credit_reserve"];
    case "draw_for_answers":
      return ["benefit:more_options"];
    case "trash_asset":
      return ["benefit:remove_visible_threat"];
    case "safe_probe_run":
      return ["benefit:low_commitment_information"];
  }
}

function visibleRisksForPlan(kind: RunnerPlanKind, roles: string[]): string[] {
  const risks: string[] = [];
  if (isRunPlan(kind)) risks.push("risk:unknown_server_contents");
  if (kind === "build_rig" && roles.length === 0) risks.push("risk:no_ai_role");
  return risks;
}

function uncertaintyForPlan(kind: RunnerPlanKind): string[] {
  return isRunPlan(kind) ? ["unknown_corp_cards_remain_unknown", "unrezzed_ice_identity_not_assumed"] : ["hidden_corp_information_not_used"];
}

function isRunPlan(kind: RunnerPlanKind): boolean {
  return kind === "pressure_rnd" || kind === "pressure_hq" || kind === "contest_remote" || kind === "safe_probe_run";
}

function isEarlyRunnerTurn(input: AiDecisionInput): boolean {
  if (input.playerView.phase !== "runner_action_phase" || input.playerView.activeSide !== "runner") return false;
  const scoredAgendaCount = input.playerView.own.scoreArea.length + input.playerView.opponent.scoreArea.length;
  return input.actionNumber <= 12 && scoredAgendaCount === 0;
}

function visibleRiskPenalty(candidate: RunnerPlanCandidate, riskTolerance: number): number {
  return candidate.visibleRisks.length * 35 * (1 - riskTolerance);
}

function explanationForPlan(kind: RunnerPlanDebug["planKind"]): string {
  switch (kind) {
    case "pressure_rnd":
      return "Der Runner erzeugt R&D-Druck, ohne verdeckte Kartentitel anzunehmen.";
    case "pressure_hq":
      return "Der Runner erzeugt HQ-Druck auf Basis sichtbarer Lage und Unsicherheit.";
    case "contest_remote":
      return "Der Runner contestet einen sichtbaren Remote-Druckpunkt.";
    case "build_rig":
      return "Der Runner verbessert sein sichtbares Rig.";
    case "recover_economy":
      return "Der Runner schützt seine Credit-Reserve statt eines schlechten Runs.";
    case "draw_for_answers":
      return "Der Runner zieht nach sichtbaren Antworten.";
    case "trash_asset":
      return "Der Runner entfernt ein sichtbar zugreifbares Trash-Ziel.";
    case "safe_probe_run":
      return "Der Runner wählt einen vorsichtigen Probe-Run mit dokumentierter Unsicherheit.";
    case "fallback":
      return "Der Runner nutzt einen legalen Fallback.";
  }
}

function scrubPlanEvidence(evidence: string[]): string[] {
  const forbidden = ["cardInstances", "privatePayload", "sessionToken", "reconnectToken", "joinToken", "tokenHash", "fullGameState", "FullState", "corp_simple_"];
  return evidence.filter((entry) => !forbidden.some((needle) => entry.includes(needle))).slice(0, 18);
}

function confidence(score: number, actionCount: number): number {
  return Math.max(0.15, Math.min(0.98, round(score / 1000 + Math.min(actionCount, 3) * 0.03)));
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}

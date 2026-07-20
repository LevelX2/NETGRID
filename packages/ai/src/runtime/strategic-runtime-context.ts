import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
  PlayerView,
  Side,
} from "@netgrid/shared";
import type {
  BreakerCoverageKind,
  CoverageState,
  DeckCapabilityProfile,
} from "../deck-capabilities";
import type { AiDeckStrategyProfile } from "../deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { actionProvidesCredits } from "../actions/action-effect-classification";
import type {
  StrategicIntentFamily,
  StrategicReserveRequirement,
  StrategicRoleStatus,
  StrategicRoleStatusSnapshot,
  StrategicStrategyPortfolio,
  StrategicStrategyPortfolioCandidate,
  StrategicTargetVector,
} from "../strategic-intent-state";
import {
  classifyTagPunishLegalActionFromOntology,
  type StructuredTagPunishLegalActionAssessment,
} from "../tag-punish-ontology-consumer";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { assessRunnerBreakerDevelopment } from "../runner-breaker-development";
import { strategicFamilyForStrategyId } from "../strategy-runtime-registry";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { assessCorpScorelineFeasibility } from "./corp-scoreline-feasibility";

export type StrategicRuntimeContext = {
  roleStatuses: StrategicRoleStatusSnapshot[];
  targetVector: StrategicTargetVector;
  reserveRequirement: StrategicReserveRequirement;
  strategyPortfolio: StrategicStrategyPortfolio;
};

export type BuildStrategicRuntimeContextParams = {
  side: Side;
  playerView: PlayerView;
  legalActions: readonly LegalAction[];
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
  deckSnapshot?: AiDeckStrategyDeckSnapshot;
};

export function buildStrategicRuntimeContext(
  params: BuildStrategicRuntimeContextParams,
): StrategicRuntimeContext {
  const strategyPortfolio = buildRuntimeStrategyPortfolio(params);
  const strategyId = strategyPortfolio.activeStrategyId;
  const family = strategyId
    ? strategicFamilyForStrategyId(strategyId)
    : "neutral";
  const activeCandidate = strategyPortfolio.productiveCandidates.find(
    (candidate) => candidate.strategyId === strategyId,
  );
  const roleStatuses =
    activeCandidate?.roleStatuses ?? roleStatusesForFamily(params, family);
  return {
    roleStatuses,
    targetVector:
      activeCandidate?.targetVector ??
      targetVectorForFamily(params, family, strategyId),
    reserveRequirement:
      activeCandidate?.reserve ?? reserveRequirementForFamily(params, family),
    strategyPortfolio,
  };
}

function buildRuntimeStrategyPortfolio(
  params: BuildStrategicRuntimeContextParams,
): StrategicStrategyPortfolio {
  const profile = params.strategyProfile;
  if (!profile || profile.side !== params.side) {
    return {
      activeSelectionReason: "no_strategy_profile",
      productiveCandidates: [],
      blockedCandidates: [],
      evidence: ["strategy_portfolio:no_strategy_profile"],
    };
  }
  const candidateIds = uniqueStrings([
    ...profile.primaryStrategies,
    ...profile.secondaryStrategies,
  ]);
  const candidateIdSet = new Set(candidateIds);
  const profileCandidates = candidateIds
    .map((strategyId) => runtimePortfolioCandidate(params, strategyId))
    .filter(
      (candidate): candidate is StrategicStrategyPortfolioCandidate =>
        candidate !== undefined,
    );
  const completedSetupPressureCandidate = runnerCompletedSetupPressureCandidate(
    params,
    profileCandidates,
  );
  const runtimeCandidates = completedSetupPressureCandidate
    ? [
        ...profileCandidates.filter(
          (candidate) =>
            candidate.strategyId !== completedSetupPressureCandidate.strategyId,
        ),
        completedSetupPressureCandidate,
      ]
    : profileCandidates;
  const runtimeCandidateIdSet = new Set(
    runtimeCandidates.map((candidate) => candidate.strategyId),
  );
  const productiveCandidates = runtimeCandidates
    .filter(
      (candidate): candidate is StrategicStrategyPortfolioCandidate =>
        candidate.runtimeStatus === "productive",
    )
    .sort(
      (left, right) =>
        right.selectionScore - left.selectionScore ||
        right.score.final - left.score.final ||
        right.score.anchor - left.score.anchor ||
        left.strategyId.localeCompare(right.strategyId),
    );
  const blockedCandidates = [
    ...runtimeCandidates.filter(
      (candidate) => candidate.runtimeStatus !== "productive",
    ),
    ...Object.keys(profile.strategyScores)
      .filter(
        (strategyId) =>
          !candidateIdSet.has(strategyId) &&
          !runtimeCandidateIdSet.has(strategyId),
      )
      .map((strategyId) =>
        runtimePortfolioCandidate(params, strategyId, "blocked"),
      )
      .filter(
        (candidate): candidate is StrategicStrategyPortfolioCandidate =>
          candidate !== undefined && candidate.runtimeStatus !== "productive",
      ),
  ]
    .sort(
      (left, right) =>
        right.score.final - left.score.final ||
        left.strategyId.localeCompare(right.strategyId),
    )
    .slice(0, 8);
  const active = productiveCandidates[0];
  return {
    ...(active ? { activeStrategyId: active.strategyId } : {}),
    activeSelectionReason: active
      ? "highest_runtime_portfolio_score"
      : "no_productive_strategy_candidate",
    productiveCandidates,
    blockedCandidates,
    evidence: [
      "strategy_portfolio:runtime_context",
      `strategy_portfolio_productive_count:${productiveCandidates.length}`,
      `strategy_portfolio_blocked_count:${blockedCandidates.length}`,
      ...(active ? [`strategy_portfolio_active:${active.strategyId}`] : []),
    ],
  };
}

function runnerCompletedSetupPressureCandidate(
  params: BuildStrategicRuntimeContextParams,
  candidates: readonly StrategicStrategyPortfolioCandidate[],
): StrategicStrategyPortfolioCandidate | undefined {
  if (params.side !== "runner") return undefined;
  const completedSetup = candidates
    .filter(
      (candidate) =>
        candidate.runtimeStatus === "productive" &&
        candidate.family === "runner_setup" &&
        candidate.roleStatuses.length > 0 &&
        candidate.roleStatuses.every((role) => role.status === "active"),
    )
    .sort(
      (left, right) =>
        right.selectionScore - left.selectionScore ||
        left.strategyId.localeCompare(right.strategyId),
    )[0];
  if (!completedSetup) return undefined;
  const centralTargets = legalRunTargets(params.legalActions).filter(
    isCentralServer,
  );
  const targetId = centralTargets.includes("rd") ? "rd" : centralTargets[0];
  if (!targetId) return undefined;
  const strategyId =
    targetId === "hq" ? "runner.hq_pressure" : "runner.rnd_pressure";
  const matchpoint =
    params.playerView.own.agendaPoints >=
      params.playerView.agendaPointsToWin - 2 ||
    params.playerView.opponent.agendaPoints >=
      params.playerView.agendaPointsToWin - 1;
  const transitionBonus = matchpoint ? 52 : 32;
  const breakerDevelopment = assessRunnerBreakerDevelopment(
    params.deckCapabilities,
  );
  const selectionFloor = Math.max(
    ...candidates.map((candidate) => candidate.selectionScore),
  );
  return {
    ...completedSetup,
    strategyId,
    family: "runner_central_pressure",
    candidateRole: "secondary",
    runtimeStatus: "productive",
    runtimeBlockers: [],
    selectionScore: selectionFloor + transitionBonus,
    targetVector: {
      kind: "central",
      targetId,
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `target_legal_run:${centralTargets.join("|")}`,
        "runner_setup_complete_pressure_transition:true",
      ],
    },
    reserve: reserveRequirementForFamily(params, "runner_central_pressure"),
    evidence: [
      ...completedSetup.evidence,
      "runtime_transition:runner_setup_complete",
      `runtime_transition_from:${completedSetup.strategyId}`,
      `runtime_transition_to:${strategyId}`,
      `runtime_transition_matchpoint:${matchpoint}`,
      `runtime_transition_bonus:${transitionBonus}`,
      ...breakerDevelopment.evidence,
    ],
  };
}

function runtimePortfolioCandidate(
  params: BuildStrategicRuntimeContextParams,
  strategyId: string,
  forcedRole?: StrategicStrategyPortfolioCandidate["candidateRole"],
): StrategicStrategyPortfolioCandidate | undefined {
  const profile = params.strategyProfile;
  const score = profile?.strategyScores[strategyId];
  if (!profile || !score) return undefined;
  const family = strategicFamilyForStrategyId(strategyId);
  const roleStatuses = roleStatusesForFamily(params, family);
  const targetVector = targetVectorForFamily(params, family, strategyId);
  const reserve = reserveRequirementForFamily(params, family);
  const scorelineFeasibility = scorelineFeasibilityForFamily(params, family);
  const scorelineUnreachable = scorelineFeasibility?.feasible === false;
  const runtimeStatus = scorelineUnreachable
    ? "blocked"
    : (score.runtimeStatus ?? "legacy_unspecified");
  const runtimeBlockers = uniqueStrings([
    ...(score.runtimeBlockers ?? []),
    ...(scorelineUnreachable
      ? ["hard_runtime_blocker:scoreline_unreachable"]
      : []),
  ]).sort();
  const primaryStrategySet = new Set(profile.primaryStrategies);
  const selectionScore =
    score.finalScore +
    roleReadinessBonus(roleStatuses) +
    targetOpportunityBonus(targetVector) +
    reserveReadinessBonus(reserve) +
    candidateRoleBonus(profile, strategyId);
  return {
    strategyId,
    family,
    candidateRole:
      forcedRole ??
      (primaryStrategySet.has(strategyId) ? "primary" : "secondary"),
    runtimeStatus,
    runtimeBlockers,
    confidence: score.confidence,
    score: {
      anchor: score.anchorScore,
      support: score.supportScore,
      final: score.finalScore,
    },
    selectionScore,
    roleStatuses,
    targetVector,
    reserve,
    evidence: [
      "portfolio_candidate:runtime_context",
      `strategy:${strategyId}`,
      `runtime_status:${runtimeStatus}`,
      `final:${score.finalScore}`,
      `anchor:${score.anchorScore}`,
      `selection_score:${roundScore(selectionScore)}`,
      `role_bonus:${roleReadinessBonus(roleStatuses)}`,
      `target_bonus:${targetOpportunityBonus(targetVector)}`,
      `reserve_bonus:${reserveReadinessBonus(reserve)}`,
      ...(scorelineFeasibility
        ? [
            `scoreline_feasible:${scorelineFeasibility.feasible}`,
            `scoreline_total_agenda_points:${scorelineFeasibility.totalAgendaPoints}`,
            `scoreline_max_reachable_points:${scorelineFeasibility.maxReachablePoints}`,
          ]
        : []),
    ],
  };
}

function roleReadinessBonus(
  roleStatuses: readonly StrategicRoleStatusSnapshot[],
): number {
  if (roleStatuses.length === 0) return 0;
  return roleStatuses.reduce((sum, role) => {
    switch (role.status) {
      case "active":
        return sum + 18;
      case "visible":
        return sum + 12;
      case "installable":
        return sum + 8;
      case "in_deck_unseen":
        return sum + 2;
      case "conditional":
        return sum + 1;
      case "temporarily_unavailable":
        return sum - 8;
      case "absent":
        return sum - 25;
      default:
        return sum;
    }
  }, 0);
}

export function targetOpportunityBonus(
  targetVector: StrategicTargetVector,
): number {
  if (
    targetVector.kind === "scoreline" &&
    targetVectorEvidenceHasFlag(targetVector, "legal_score:true")
  ) {
    return 30;
  }
  if (
    targetVector.kind === "scoreline" &&
    targetVectorEvidenceHasFlag(targetVector, "legal_advance:true")
  ) {
    return 14;
  }
  if (
    (targetVector.kind === "tag" || targetVector.kind === "damage") &&
    !targetVectorEvidenceHasFlag(
      targetVector,
      "target_reason:no_visible_semantic",
    )
  ) {
    return 18;
  }
  if (
    (targetVector.kind === "central" || targetVector.kind === "remote") &&
    !targetVectorEvidenceHasFlag(targetVector, "target_legal_run:none")
  ) {
    return 10;
  }
  if (targetVector.kind === "coverage" || targetVector.kind === "economy") {
    return 4;
  }
  return 0;
}

function targetVectorEvidenceHasFlag(
  targetVector: StrategicTargetVector,
  flag: string,
): boolean {
  const targetVectorEvidenceSet = new Set(targetVector.evidence);
  return targetVectorEvidenceSet.has(flag);
}

function reserveReadinessBonus(reserve: StrategicReserveRequirement): number {
  if (reserve.kind === "none") return 0;
  return reserve.satisfied ? 4 : -10;
}

function candidateRoleBonus(
  profile: AiDeckStrategyProfile,
  strategyId: string,
): number {
  const primaryStrategySet = new Set(profile.primaryStrategies);
  return primaryStrategySet.has(strategyId) ? 2 : 0;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function roleStatusesForFamily(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): StrategicRoleStatusSnapshot[] {
  const roles =
    params.side === "runner"
      ? runnerRoleStatuses(params, family)
      : corpRoleStatuses(params, family);
  return roles.sort((left, right) => left.roleId.localeCompare(right.roleId));
}

function runnerRoleStatuses(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): StrategicRoleStatusSnapshot[] {
  if (
    family === "runner_central_pressure" ||
    family === "runner_remote_contest" ||
    family === "runner_remote_trash" ||
    family === "runner_setup" ||
    family === "runner_tempo"
  ) {
    return runnerCoverageRoles(params);
  }
  if (family === "runner_survival") {
    return [
      roleStatus(
        "runner.survival_action",
        runnerSurvivalStatus(params),
        "player_view",
        [
          `legal_draw:${hasLegalAction(params.legalActions, "draw_card")}`,
          `legal_remove_tag:${hasLegalAction(params.legalActions, "remove_tag")}`,
          `runner_tags:${params.playerView.own.tags}`,
        ],
      ),
    ];
  }
  return [];
}

function runnerCoverageRoles(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatusSnapshot[] {
  const matrix = params.deckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return [];
  const conditionalCoverageKinds = runnerConditionalCoverageKinds(
    params.strategyProfile,
  );
  const coverageKinds: BreakerCoverageKind[] = ["wall", "code_gate", "sentry"];
  return coverageKinds.map((coverage) =>
    roleStatus(
      `runner.breaker.${coverage}`,
      coverageStatus(matrix[coverage], conditionalCoverageKinds.has(coverage)),
      "capability",
      [
        `coverage:${coverage}`,
        `installed:${matrix[coverage].installed}`,
        `in_hand:${matrix[coverage].inHand}`,
        `in_deck:${matrix[coverage].inDeckKnown}`,
        `searchable_now:${matrix[coverage].searchableNow}`,
        `missing:${matrix[coverage].missing}`,
        `conditional_access:${conditionalCoverageKinds.has(coverage)}`,
      ],
    ),
  );
}

function coverageStatus(
  state: CoverageState,
  conditionalAccess: boolean,
): StrategicRoleStatus {
  if (state.installed) return "active";
  if (state.inHand) return "installable";
  if (state.searchableNow || state.inDeckKnown || state.drawOnly) {
    return "in_deck_unseen";
  }
  if (state.missing) return conditionalAccess ? "conditional" : "absent";
  return "unknown";
}

function runnerConditionalCoverageKinds(
  strategyProfile: AiDeckStrategyProfile | undefined,
): Set<BreakerCoverageKind> {
  const result = new Set<BreakerCoverageKind>();
  for (const score of Object.values(strategyProfile?.strategyScores ?? {})) {
    if (score.runtimeStatus !== "productive") continue;
    for (const kind of ["wall", "code_gate", "sentry"] as const) {
      if (score.supportGaps.includes(`conditional_${kind}_access_path`)) {
        result.add(kind);
      }
    }
  }
  return result;
}

function runnerSurvivalStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (
    hasLegalAction(params.legalActions, "draw_card") ||
    hasLegalAction(params.legalActions, "remove_tag") ||
    hasLegalAction(params.legalActions, "jack_out")
  ) {
    return "active";
  }
  return "unknown";
}

function corpRoleStatuses(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): StrategicRoleStatusSnapshot[] {
  switch (family) {
    case "corp_scoreline":
    case "corp_fast_advance":
    case "corp_action_tempo":
    case "corp_overadvance":
      return [
        roleStatus(
          "corp.score_window",
          corpScoreWindowStatus(params),
          "player_view",
          [
            `legal_score:${hasLegalAction(params.legalActions, "score_agenda")}`,
            `legal_advance:${hasLegalAction(params.legalActions, "advance_card")}`,
            `remote_with_agenda:${remoteWithVisibleAgenda(params.playerView)}`,
          ],
        ),
      ];
    case "corp_draw_engine":
    case "corp_recycle_engine":
      return [
        roleStatus(
          family === "corp_draw_engine"
            ? "corp.draw_engine"
            : "corp.recycle_engine",
          corpEngineStatus(params, family),
          "player_view",
          [
            `legal_draw:${hasLegalAction(params.legalActions, "draw_card")}`,
            `legal_trigger:${hasLegalAction(params.legalActions, "trigger_ability")}`,
            `legal_activated:${hasLegalAction(params.legalActions, "activated_card_ability")}`,
            `legal_strategy_engine:${hasLegalStrategyAction(params, family === "corp_draw_engine" ? "corp.draw_engine" : "corp.deck_recycle_engine")}`,
          ],
        ),
      ];
    case "corp_ice_tax":
    case "corp_central_defense":
      return [
        roleStatus(
          "corp.ice_defense",
          corpIceDefenseStatus(params),
          "capability",
          [
            `legal_install_ice:${hasInstallIceAction(params.legalActions)}`,
            `visible_ice:${visibleCorpIceCount(params.playerView)}`,
            `ice_known:${params.deckCapabilities?.corp?.rezReserveProfile.iceKnownInDeck ?? 0}`,
          ],
        ),
      ];
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return [
        roleStatus("corp.economy", corpEconomyStatus(params), "capability", [
          `legal_gain_credit:${hasLegalCreditAction(params.legalActions)}`,
          `bank_tools:${params.deckCapabilities?.corp?.economyBankTools.length ?? 0}`,
          `rez_economy_tools:${params.deckCapabilities?.corp?.rezReserveProfile.rezEconomyToolsKnown ?? 0}`,
        ]),
      ];
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
    case "corp_ambush":
      return [
        roleStatus(
          "corp.punish_window",
          corpPunishStatus(params),
          "player_view",
          [
            `runner_tags:${params.playerView.opponent.tags}`,
            `legal_punish_payoff:${corpPunishAssessments(params).some((assessment) => assessment.playablePayoff)}`,
            `legal_tag_source:${corpPunishAssessments(params).some((assessment) => assessment.isTagSource || assessment.isTraceTagSource)}`,
            `blocked_payoff_missing_tag:${corpPunishAssessments(params).some((assessment) => assessment.blockedByMissingTag)}`,
          ],
        ),
      ];
    default:
      return [];
  }
}

function corpEngineStatus(
  params: BuildStrategicRuntimeContextParams,
  family: Extract<
    StrategicIntentFamily,
    "corp_draw_engine" | "corp_recycle_engine"
  >,
): StrategicRoleStatus {
  if (
    (family === "corp_draw_engine" &&
      hasLegalAction(params.legalActions, "draw_card")) ||
    hasLegalStrategyAction(
      params,
      family === "corp_draw_engine"
        ? "corp.draw_engine"
        : "corp.deck_recycle_engine",
    )
  ) {
    return "active";
  }
  return "in_deck_unseen";
}

function corpScoreWindowStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (hasLegalAction(params.legalActions, "score_agenda")) return "active";
  if (
    hasLegalAction(params.legalActions, "advance_card") ||
    remoteWithVisibleAgenda(params.playerView)
  ) {
    return "visible";
  }
  if (
    (params.deckCapabilities?.corp?.scorePlanProfile.scoreSupportToolsKnown ??
      0) > 0
  ) {
    return "in_deck_unseen";
  }
  return "unknown";
}

function corpIceDefenseStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (visibleCorpIceCount(params.playerView) > 0) return "visible";
  if (hasInstallIceAction(params.legalActions)) return "installable";
  if (
    (params.deckCapabilities?.corp?.rezReserveProfile.iceKnownInDeck ?? 0) > 0
  ) {
    return "in_deck_unseen";
  }
  return "absent";
}

function corpEconomyStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (hasLegalCreditAction(params.legalActions)) return "active";
  if ((params.deckCapabilities?.corp?.economyBankTools.length ?? 0) > 0) {
    return "installable";
  }
  if (
    (params.deckCapabilities?.corp?.rezReserveProfile.rezEconomyToolsKnown ??
      0) > 0
  ) {
    return "in_deck_unseen";
  }
  return "unknown";
}

function corpPunishStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  const assessments = corpPunishAssessments(params);
  if (assessments.some((assessment) => assessment.playablePayoff)) {
    return "active";
  }
  if (
    assessments.some(
      (assessment) => assessment.isTagSource || assessment.isTraceTagSource,
    )
  ) {
    return "visible";
  }
  if (assessments.some((assessment) => assessment.blockedByMissingTag)) {
    return "temporarily_unavailable";
  }
  const punishProfile = params.strategyProfile?.corpProfile?.punishProfile;
  if (
    punishProfile &&
    (punishProfile.tagSources > 0 ||
      punishProfile.tagPayoff > 0 ||
      punishProfile.damagePayoff > 0 ||
      punishProfile.traceDensity > 0)
  ) {
    return "in_deck_unseen";
  }
  return "in_deck_unseen";
}

function targetVectorForFamily(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
  strategyId: string | undefined,
): StrategicTargetVector {
  if (!strategyId || family === "neutral") {
    return {
      kind: "none",
      evidence: [
        "target_source:runtime_context",
        "target_reason:no_productive_strategy",
      ],
    };
  }
  if (params.side === "runner") {
    return runnerTargetVector(params, family, strategyId);
  }
  return corpTargetVector(params, family, strategyId);
}

function runnerTargetVector(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
  strategyId: string,
): StrategicTargetVector {
  if (family === "runner_central_pressure" || family === "runner_tempo") {
    const preferred = strategyId === "runner.hq_pressure" ? "hq" : "rd";
    const targetId =
      legalRunTargets(params.legalActions).find(
        (target) => target === preferred,
      ) ??
      legalRunTargets(params.legalActions).find(isCentralServer) ??
      preferred;
    return {
      kind: "central",
      targetId,
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `target_legal_run:${legalRunTargets(params.legalActions).join("|") || "none"}`,
      ],
    };
  }
  if (family === "runner_remote_contest" || family === "runner_remote_trash") {
    const remoteRun = legalRunTargets(params.legalActions).find(isRemoteServer);
    const visibleRemote = params.playerView.servers.find((server) =>
      isRemoteServer(server.id),
    )?.id;
    return {
      kind: "remote",
      targetId: remoteRun ?? visibleRemote ?? "best_visible_remote",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `target_legal_run:${legalRunTargets(params.legalActions).join("|") || "none"}`,
      ],
    };
  }
  if (family === "runner_setup") {
    return {
      kind: "coverage",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
      ],
    };
  }
  if (family === "runner_survival") {
    return {
      kind: "survival",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
      ],
    };
  }
  return {
    kind: "none",
    evidence: ["target_source:runtime_context", `target_unknown:${strategyId}`],
  };
}

function corpTargetVector(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
  strategyId: string,
): StrategicTargetVector {
  if (
    family === "corp_scoreline" ||
    family === "corp_fast_advance" ||
    family === "corp_action_tempo" ||
    family === "corp_overadvance"
  ) {
    const feasibility = scorelineFeasibilityForFamily(params, family);
    return {
      kind: "scoreline",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `legal_score:${hasLegalAction(params.legalActions, "score_agenda")}`,
        `legal_advance:${hasLegalAction(params.legalActions, "advance_card")}`,
        ...(feasibility
          ? [
              `scoreline_feasible:${feasibility.feasible}`,
              `scoreline_max_reachable_points:${feasibility.maxReachablePoints}`,
            ]
          : []),
      ],
    };
  }
  if (family === "corp_central_defense" || family === "corp_ice_tax") {
    return {
      kind: "coverage",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `visible_ice:${visibleCorpIceCount(params.playerView)}`,
      ],
    };
  }
  if (family === "corp_tag_trace_punish") {
    const assessments = corpPunishAssessments(params);
    const punishProfile = params.strategyProfile?.corpProfile?.punishProfile;
    const deckHasCompleteTagDamageLine = Boolean(
      punishProfile &&
      punishProfile.tagSources > 0 &&
      (punishProfile.tagPayoff > 0 || punishProfile.damagePayoff > 0),
    );
    if (
      !assessments.some(
        (assessment) =>
          assessment.playablePayoff ||
          assessment.isTagSource ||
          assessment.isTraceTagSource,
      ) &&
      !deckHasCompleteTagDamageLine
    ) {
      return {
        kind: "none",
        evidence: [
          "target_source:runtime_context",
          `target_strategy:${strategyId}`,
          "target_reason:no_visible_semantic_punish_basis",
        ],
      };
    }
    return {
      kind: "tag",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `runner_tags:${params.playerView.opponent.tags}`,
        `semantic_punish_actions:${assessments.length}`,
        `deck_complete_tag_damage_line:${deckHasCompleteTagDamageLine}`,
      ],
    };
  }
  if (family === "corp_damage_kill" || family === "corp_ambush") {
    const assessments = corpPunishAssessments(params);
    const punishProfile = params.strategyProfile?.corpProfile?.punishProfile;
    const deckHasCompleteTagDamageLine = Boolean(
      punishProfile &&
      punishProfile.tagSources > 0 &&
      punishProfile.damagePayoff > 0,
    );
    if (
      !assessments.some((assessment) => assessment.playablePayoff) &&
      !deckHasCompleteTagDamageLine
    ) {
      return {
        kind: "none",
        evidence: [
          "target_source:runtime_context",
          `target_strategy:${strategyId}`,
          "target_reason:no_visible_semantic_damage_closeout",
        ],
      };
    }
    return {
      kind: "damage",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `semantic_punish_actions:${assessments.length}`,
        `deck_complete_tag_damage_line:${deckHasCompleteTagDamageLine}`,
      ],
    };
  }
  if (family === "corp_asset_economy" || family === "corp_economy_reserve") {
    return {
      kind: "economy",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
      ],
    };
  }
  if (family === "corp_draw_engine" || family === "corp_recycle_engine") {
    return {
      kind: "none",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        "target_mode:engine",
      ],
    };
  }
  return {
    kind: "none",
    evidence: ["target_source:runtime_context", `target_unknown:${strategyId}`],
  };
}

function scorelineFeasibilityForFamily(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): ReturnType<typeof assessCorpScorelineFeasibility> {
  if (
    params.side !== "corp" ||
    ![
      "corp_scoreline",
      "corp_fast_advance",
      "corp_action_tempo",
      "corp_overadvance",
    ].includes(family) ||
    !params.deckSnapshot
  ) {
    return undefined;
  }
  return assessCorpScorelineFeasibility(params);
}

function reserveRequirementForFamily(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): StrategicReserveRequirement {
  const required = Math.max(
    defaultReserveCreditsForFamily(family),
    cheapestRelevantActionCost(params, family) ?? 0,
  );
  if (required <= 0) {
    return {
      kind: "none",
      required: 0,
      satisfied: true,
      evidence: ["reserve_source:runtime_context", "reserve:none"],
    };
  }
  const available = params.playerView.own.credits;
  return {
    kind: "credits",
    required,
    available,
    satisfied: available >= required,
    evidence: [
      "reserve_source:runtime_context",
      `reserve_family:${family}`,
      `reserve_required:${required}`,
      `reserve_available:${available}`,
      `relevant_action_min_cost:${cheapestRelevantActionCost(params, family) ?? "none"}`,
    ],
  };
}

function defaultReserveCreditsForFamily(family: StrategicIntentFamily): number {
  switch (family) {
    case "runner_central_pressure":
    case "runner_remote_contest":
    case "runner_remote_trash":
      return 4;
    case "corp_scoreline":
    case "corp_fast_advance":
    case "corp_overadvance":
    case "corp_ice_tax":
      return 5;
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
      return 6;
    default:
      return 0;
  }
}

function cheapestRelevantActionCost(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): number | undefined {
  const costs = params.legalActions
    .filter((action) => actionMatchesFamily(action, family, params))
    .map(actionCreditCost);
  if (costs.length === 0) return undefined;
  return Math.min(...costs);
}

function actionMatchesFamily(
  action: LegalAction,
  family: StrategicIntentFamily,
  params: BuildStrategicRuntimeContextParams,
): boolean {
  switch (family) {
    case "runner_central_pressure":
    case "runner_remote_contest":
    case "runner_remote_trash":
    case "runner_tempo":
      return (
        action.type === "start_run" || action.type === "trash_accessed_card"
      );
    case "runner_setup":
      return action.type === "install_card" || action.type === "play_event";
    case "runner_survival":
      return action.type === "draw_card" || action.type === "remove_tag";
    case "corp_scoreline":
    case "corp_fast_advance":
    case "corp_action_tempo":
      return (
        action.type === "score_agenda" ||
        actionSupportsStrategy(params, action, "corp.action_tempo")
      );
    case "corp_overadvance":
      return action.type === "score_agenda" || action.type === "advance_card";
    case "corp_draw_engine":
      return (
        action.type === "draw_card" ||
        actionSupportsStrategy(params, action, "corp.draw_engine")
      );
    case "corp_recycle_engine":
      return actionSupportsStrategy(params, action, "corp.deck_recycle_engine");
    case "corp_ice_tax":
    case "corp_central_defense":
      return action.type === "rez_ice" || hasInstallIcePayload(action);
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return (
        actionProvidesCredits(action) ||
        action.type === "rez_ice" ||
        action.type === "rez_card"
      );
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
    case "corp_ambush":
      return false;
    default:
      return false;
  }
}

function hasLegalStrategyAction(
  params: BuildStrategicRuntimeContextParams,
  strategyId: string,
): boolean {
  return params.legalActions.some((action) =>
    actionSupportsStrategy(params, action, strategyId),
  );
}

function actionSupportsStrategy(
  params: BuildStrategicRuntimeContextParams,
  action: LegalAction,
  strategyId: string,
): boolean {
  const definitionId = sourceDefinitionIdForAction(
    action,
    visibleSourceDefinitionsByInstanceId(params.playerView),
  );
  if (!definitionId) return false;
  const profile = buildActionCardSemanticProfilesByDefinitionId()[definitionId];
  return Boolean(
    profile?.strategySupport?.some(
      (support) => support.strategyId === strategyId,
    ) || profile?.compatibilitySignals?.includes(`line_support:${strategyId}`),
  );
}

function corpPunishAssessments(
  params: BuildStrategicRuntimeContextParams,
): StructuredTagPunishLegalActionAssessment[] {
  const visibleDefinitions = visibleSourceDefinitionsByInstanceId(
    params.playerView,
  );
  return params.legalActions
    .map((action) =>
      classifyTagPunishLegalActionFromOntology(
        action,
        sourceDefinitionIdForAction(action, visibleDefinitions),
        { runnerTagged: params.playerView.opponent.tags > 0 },
      ),
    )
    .filter(
      (assessment): assessment is StructuredTagPunishLegalActionAssessment =>
        assessment !== undefined,
    );
}

function sourceDefinitionIdForAction(
  action: LegalAction,
  visibleDefinitions: Readonly<Record<CardInstanceId, CardDefinitionId>>,
): CardDefinitionId | undefined {
  const payloadSourceDefinitionId =
    stringPayload(action, "sourceDefinitionId") ??
    stringPayload(action, "sourceCardDefinitionId");
  if (payloadSourceDefinitionId !== undefined) return payloadSourceDefinitionId;
  const sourceCardInstanceId =
    action.abilityRef?.sourceCardInstanceId ??
    stringPayload(action, "sourceCardId") ??
    (action.source !== "basic_action" && action.source !== "game_rule"
      ? action.source
      : undefined);
  return sourceCardInstanceId !== undefined
    ? visibleDefinitions[sourceCardInstanceId]
    : undefined;
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function roleStatus(
  roleId: string,
  status: StrategicRoleStatus,
  source: StrategicRoleStatusSnapshot["source"],
  evidence: readonly string[],
): StrategicRoleStatusSnapshot {
  return {
    roleId,
    status,
    source,
    evidence: [...evidence],
  };
}

function hasLegalAction(
  legalActions: readonly LegalAction[],
  type: LegalAction["type"],
): boolean {
  return legalActions.some((action) => action.type === type);
}

function hasLegalCreditAction(legalActions: readonly LegalAction[]): boolean {
  return legalActions.some(actionProvidesCredits);
}

function hasInstallIceAction(legalActions: readonly LegalAction[]): boolean {
  return legalActions.some(hasInstallIcePayload);
}

function hasInstallIcePayload(action: LegalAction): boolean {
  return action.type === "install_card" && action.payload?.placement === "ice";
}

function legalRunTargets(legalActions: readonly LegalAction[]): string[] {
  return legalActions
    .filter((action) => action.type === "start_run")
    .map(serverIdFromAction)
    .filter((serverId): serverId is string => Boolean(serverId));
}

function serverIdFromAction(action: LegalAction): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
}

function isCentralServer(serverId: string): boolean {
  return serverId === "hq" || serverId === "rd" || serverId === "archives";
}

function isRemoteServer(serverId: string): boolean {
  return serverId.startsWith("remote_");
}

function remoteWithVisibleAgenda(playerView: PlayerView): boolean {
  return playerView.servers.some(
    (server) =>
      isRemoteServer(server.id) &&
      server.root.some(
        (card) => card.type === "agenda" && card.known !== false,
      ),
  );
}

function visibleCorpIceCount(playerView: PlayerView): number {
  return playerView.servers.reduce(
    (sum, server) =>
      sum + server.ice.filter((card) => card.known !== false).length,
    0,
  );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => {
    const credits = (cost as { credits?: unknown }).credits;
    return sum + (typeof credits === "number" ? Math.max(0, credits) : 0);
  }, 0);
}

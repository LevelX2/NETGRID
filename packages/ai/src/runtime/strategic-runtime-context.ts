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
import type {
  AiDeckStrategyProfile,
  DeckStrategyScore,
} from "../deck-doctrine-strategy";
import type {
  StrategicIntentFamily,
  StrategicReserveRequirement,
  StrategicRoleStatus,
  StrategicRoleStatusSnapshot,
  StrategicTargetVector,
} from "../strategic-intent-state";
import {
  classifyTagPunishLegalActionFromOntology,
  type StructuredTagPunishLegalActionAssessment,
} from "../tag-punish-ontology-consumer";

export type StrategicRuntimeContext = {
  roleStatuses: StrategicRoleStatusSnapshot[];
  targetVector: StrategicTargetVector;
  reserveRequirement: StrategicReserveRequirement;
};

export type BuildStrategicRuntimeContextParams = {
  side: Side;
  playerView: PlayerView;
  legalActions: readonly LegalAction[];
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
};

export function buildStrategicRuntimeContext(
  params: BuildStrategicRuntimeContextParams,
): StrategicRuntimeContext {
  const strategyId = productivePrimaryStrategyId(params.strategyProfile);
  const family = strategyId ? strategicFamilyForStrategy(strategyId) : "neutral";
  const roleStatuses = roleStatusesForFamily(params, family);
  return {
    roleStatuses,
    targetVector: targetVectorForFamily(params, family, strategyId),
    reserveRequirement: reserveRequirementForFamily(params, family),
  };
}

function productivePrimaryStrategyId(
  profile: AiDeckStrategyProfile | undefined,
): string | undefined {
  if (!profile) return undefined;
  return profile.primaryStrategies.find((strategyId) =>
    scoreHasProductiveAnchor(profile.strategyScores[strategyId]),
  );
}

function scoreHasProductiveAnchor(score: DeckStrategyScore | undefined): boolean {
  return Boolean(
    score &&
      score.runtimeStatus === "productive" &&
      score.anchorScore > 0 &&
      score.anchorEvidence.length > 0,
  );
}

function strategicFamilyForStrategy(strategyId: string): StrategicIntentFamily {
  switch (strategyId) {
    case "runner.rig_first":
    case "runner.economy_first":
    case "runner.search.breaker":
      return "runner_setup";
    case "runner.rnd_pressure":
    case "runner.hq_pressure":
    case "runner.interface_closeout":
      return "runner_central_pressure";
    case "runner.remote_contest":
      return "runner_remote_contest";
    case "runner.remote_trash":
      return "runner_remote_trash";
    case "runner.survival_defense":
      return "runner_survival";
    case "runner.run_event_tempo":
      return "runner_tempo";
    case "corp.remote_scoring":
    case "corp.rush_score":
      return "corp_scoreline";
    case "corp.fast_advance":
      return "corp_fast_advance";
    case "corp.ice_tax_glacier":
      return "corp_ice_tax";
    case "corp.central_stabilize":
      return "corp_central_defense";
    case "corp.asset_economy":
      return "corp_asset_economy";
    case "corp.tag_trace_punish":
      return "corp_tag_trace_punish";
    case "corp.damage_kill":
      return "corp_damage_kill";
    case "corp.ambush_bluff":
      return "corp_ambush";
    case "corp.economy_rez_reserve":
      return "corp_economy_reserve";
    default:
      return "unknown";
  }
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
      roleStatus("runner.survival_action", runnerSurvivalStatus(params), "player_view", [
        `legal_draw:${hasLegalAction(params.legalActions, "draw_card")}`,
        `legal_remove_tag:${hasLegalAction(params.legalActions, "remove_tag")}`,
        `runner_tags:${params.playerView.own.tags}`,
      ]),
    ];
  }
  return [];
}

function runnerCoverageRoles(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatusSnapshot[] {
  const matrix = params.deckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return [];
  const coverageKinds: BreakerCoverageKind[] = ["wall", "code_gate", "sentry"];
  return coverageKinds.map((coverage) =>
    roleStatus(
      `runner.breaker.${coverage}`,
      coverageStatus(matrix[coverage]),
      "capability",
      [
        `coverage:${coverage}`,
        `installed:${matrix[coverage].installed}`,
        `in_hand:${matrix[coverage].inHand}`,
        `in_deck:${matrix[coverage].inDeckKnown}`,
        `searchable_now:${matrix[coverage].searchableNow}`,
        `missing:${matrix[coverage].missing}`,
      ],
    ),
  );
}

function coverageStatus(state: CoverageState): StrategicRoleStatus {
  if (state.installed) return "active";
  if (state.inHand) return "installable";
  if (state.searchableNow || state.inDeckKnown || state.drawOnly) {
    return "in_deck_unseen";
  }
  if (state.missing) return "absent";
  return "unknown";
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
      return [
        roleStatus("corp.score_window", corpScoreWindowStatus(params), "player_view", [
          `legal_score:${hasLegalAction(params.legalActions, "score_agenda")}`,
          `legal_advance:${hasLegalAction(params.legalActions, "advance_card")}`,
          `remote_with_agenda:${remoteWithVisibleAgenda(params.playerView)}`,
        ]),
      ];
    case "corp_ice_tax":
    case "corp_central_defense":
      return [
        roleStatus("corp.ice_defense", corpIceDefenseStatus(params), "capability", [
          `legal_install_ice:${hasInstallIceAction(params.legalActions)}`,
          `visible_ice:${visibleCorpIceCount(params.playerView)}`,
          `ice_known:${params.deckCapabilities?.corp?.rezReserveProfile.iceKnownInDeck ?? 0}`,
        ]),
      ];
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return [
        roleStatus("corp.economy", corpEconomyStatus(params), "capability", [
          `legal_gain_credit:${hasLegalAction(params.legalActions, "gain_credit")}`,
          `bank_tools:${params.deckCapabilities?.corp?.economyBankTools.length ?? 0}`,
          `rez_economy_tools:${params.deckCapabilities?.corp?.rezReserveProfile.rezEconomyToolsKnown ?? 0}`,
        ]),
      ];
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
    case "corp_ambush":
      return [
        roleStatus("corp.punish_window", corpPunishStatus(params), "player_view", [
          `runner_tags:${params.playerView.opponent.tags}`,
          `legal_punish_payoff:${corpPunishAssessments(params).some((assessment) => assessment.playablePayoff)}`,
          `legal_tag_source:${corpPunishAssessments(params).some((assessment) => assessment.isTagSource || assessment.isTraceTagSource)}`,
          `blocked_payoff_missing_tag:${corpPunishAssessments(params).some((assessment) => assessment.blockedByMissingTag)}`,
        ]),
      ];
    default:
      return [];
  }
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
  if ((params.deckCapabilities?.corp?.scorePlanProfile.scoreSupportToolsKnown ?? 0) > 0) {
    return "in_deck_unseen";
  }
  return "unknown";
}

function corpIceDefenseStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (visibleCorpIceCount(params.playerView) > 0) return "visible";
  if (hasInstallIceAction(params.legalActions)) return "installable";
  if ((params.deckCapabilities?.corp?.rezReserveProfile.iceKnownInDeck ?? 0) > 0) {
    return "in_deck_unseen";
  }
  return "absent";
}

function corpEconomyStatus(
  params: BuildStrategicRuntimeContextParams,
): StrategicRoleStatus {
  if (hasLegalAction(params.legalActions, "gain_credit")) return "active";
  if ((params.deckCapabilities?.corp?.economyBankTools.length ?? 0) > 0) {
    return "installable";
  }
  if ((params.deckCapabilities?.corp?.rezReserveProfile.rezEconomyToolsKnown ?? 0) > 0) {
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
      evidence: ["target_source:runtime_context", "target_reason:no_productive_strategy"],
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
      legalRunTargets(params.legalActions).find((target) => target === preferred) ??
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
      evidence: ["target_source:runtime_context", `target_strategy:${strategyId}`],
    };
  }
  if (family === "runner_survival") {
    return {
      kind: "survival",
      evidence: ["target_source:runtime_context", `target_strategy:${strategyId}`],
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
  if (family === "corp_scoreline" || family === "corp_fast_advance") {
    return {
      kind: "scoreline",
      evidence: [
        "target_source:runtime_context",
        `target_strategy:${strategyId}`,
        `legal_score:${hasLegalAction(params.legalActions, "score_agenda")}`,
        `legal_advance:${hasLegalAction(params.legalActions, "advance_card")}`,
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
    if (
      !assessments.some(
        (assessment) =>
          assessment.playablePayoff ||
          assessment.isTagSource ||
          assessment.isTraceTagSource,
      )
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
      ],
    };
  }
  if (family === "corp_damage_kill" || family === "corp_ambush") {
    const assessments = corpPunishAssessments(params);
    if (!assessments.some((assessment) => assessment.playablePayoff)) {
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
      ],
    };
  }
  if (family === "corp_asset_economy" || family === "corp_economy_reserve") {
    return {
      kind: "economy",
      evidence: ["target_source:runtime_context", `target_strategy:${strategyId}`],
    };
  }
  return {
    kind: "none",
    evidence: ["target_source:runtime_context", `target_unknown:${strategyId}`],
  };
}

function reserveRequirementForFamily(
  params: BuildStrategicRuntimeContextParams,
  family: StrategicIntentFamily,
): StrategicReserveRequirement {
  const required = Math.max(
    defaultReserveCreditsForFamily(family),
    cheapestRelevantActionCost(params.legalActions, family) ?? 0,
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
      `relevant_action_min_cost:${cheapestRelevantActionCost(params.legalActions, family) ?? "none"}`,
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
  legalActions: readonly LegalAction[],
  family: StrategicIntentFamily,
): number | undefined {
  const costs = legalActions
    .filter((action) => actionMatchesFamily(action, family))
    .map(actionCreditCost);
  if (costs.length === 0) return undefined;
  return Math.min(...costs);
}

function actionMatchesFamily(
  action: LegalAction,
  family: StrategicIntentFamily,
): boolean {
  switch (family) {
    case "runner_central_pressure":
    case "runner_remote_contest":
    case "runner_remote_trash":
    case "runner_tempo":
      return action.type === "start_run" || action.type === "trash_accessed_card";
    case "runner_setup":
      return action.type === "install_card" || action.type === "play_event";
    case "runner_survival":
      return action.type === "draw_card" || action.type === "remove_tag";
    case "corp_scoreline":
    case "corp_fast_advance":
      return action.type === "score_agenda" || action.type === "advance_card";
    case "corp_ice_tax":
    case "corp_central_defense":
      return action.type === "rez_ice" || hasInstallIcePayload(action);
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return action.type === "gain_credit" || action.type === "rez_ice";
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
    case "corp_ambush":
      return false;
    default:
      return false;
  }
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
      (
        assessment,
      ): assessment is StructuredTagPunishLegalActionAssessment =>
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

function visibleSourceDefinitionsByInstanceId(
  playerView: PlayerView,
): Readonly<Record<CardInstanceId, CardDefinitionId>> {
  const entries = [
    playerView.own.identity,
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...playerView.own.scoreArea,
    ...(playerView.own.rig ?? []),
  ]
    .filter(
      (
        card,
      ): card is typeof card & {
        instanceId: CardInstanceId;
        definitionId: CardDefinitionId;
      } => card.known && card.definitionId !== undefined,
    )
    .map((card) => [card.instanceId, card.definitionId] as const);
  return Object.fromEntries(entries) as Record<
    CardInstanceId,
    CardDefinitionId
  >;
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
      server.root.some((card) => card.type === "agenda" && card.known !== false),
  );
}

function visibleCorpIceCount(playerView: PlayerView): number {
  return playerView.servers.reduce(
    (sum, server) => sum + server.ice.filter((card) => card.known !== false).length,
    0,
  );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => {
    const credits = (cost as { credits?: unknown }).credits;
    return sum + (typeof credits === "number" ? Math.max(0, credits) : 0);
  }, 0);
}

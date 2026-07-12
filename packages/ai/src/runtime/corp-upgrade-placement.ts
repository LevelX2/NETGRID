import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { createAiHintsByCard } from "../ai-hints";
import { visibleCardDefinition } from "./card-definition-lookup";
import { rolesMatch } from "./role-match";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type CorpUpgradePlacementParams = {
  input: AiDecisionInput;
  action: LegalAction;
  roles: readonly string[];
  actionSemanticCandidate: ActionSemanticCandidate | undefined;
  sourceCard: VisibleCard | undefined;
  serverId: string | undefined;
};

const BASIC_INSTALL_SIGNALS = new Set([
  "install.card",
  "setup.install",
  "setup.coverage",
]);
const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpUpgradePlacementAssessment = {
  recommendation: "allow" | "defer";
  reason:
    | "placement_has_current_value"
    | "ice_support_without_ice"
    | "region_replacement_without_marginal_value"
    | "region_replacement_adds_active_utility";
  candidateActiveUtility: string[];
  replacedActiveUtility: string[];
  marginalUtility: string[];
  evidence: string[];
};

export function corpUpgradePlacementAssessment(
  params: CorpUpgradePlacementParams,
): CorpUpgradePlacementAssessment | undefined {
  if (
    params.action.type !== "install_card" ||
    params.action.payload?.placement !== "root" ||
    !sourceLooksLikeUpgrade(params)
  ) {
    return undefined;
  }
  const signals = semanticSignals(params.actionSemanticCandidate);
  const server = visibleServer(params.input, params.serverId);
  if (hasIceSupportSignal(signals) && (server?.ice.length ?? 0) === 0) {
    return placementAssessment({
      recommendation: "defer",
      reason: "ice_support_without_ice",
      evidence: [
        "placement_contract:ice_support_requires_installed_ice",
        `server:${params.serverId ?? "none"}`,
      ],
    });
  }
  if (params.action.payload?.regionReplacementWarning === true) {
    return regionReplacementAssessment(params, signals, server);
  }
  return placementAssessment({
    recommendation: "allow",
    reason: "placement_has_current_value",
    candidateActiveUtility: activeUpgradeUtility(signals, params.serverId, server),
    evidence: ["placement_contract:no_defer_condition"],
  });
}

export function corpUpgradePlacementExclusion(
  params: CorpUpgradePlacementParams,
): SemanticRuntimeExclusion | undefined {
  const assessment = corpUpgradePlacementAssessment(params);
  if (!assessment || assessment.recommendation === "allow") return undefined;
  return {
    key: `corp_upgrade_${assessment.reason}`,
    label: assessment.reason === "ice_support_without_ice"
      ? "Upgrade benötigt zuerst ICE"
      : "Regionsersatz ohne belegten Mehrwert",
    reason: assessment.evidence.join("|"),
  };
}

export function corpUpgradeInstallPlacementComponent(
  params: CorpUpgradePlacementParams,
): AiDecisionScoreComponent | undefined {
  if (
    params.action.type !== "install_card" ||
    params.action.payload?.placement !== "root"
  ) {
    return undefined;
  }
  if (!sourceLooksLikeUpgrade(params)) return undefined;

  // Region replacement is governed by the placement contract. Applying the
  // generic upgrade score as well would mix semantic eligibility with ranking.
  if (params.action.payload?.regionReplacementWarning === true) {
    return undefined;
  }

  const signals = semanticSignals(params.actionSemanticCandidate);
  const meaningfulSignals = [...signals].filter(
    (signal) => !BASIC_INSTALL_SIGNALS.has(signal),
  );
  const server = visibleServer(params.input, params.serverId);
  const evidence = baseEvidence(params, meaningfulSignals);

  if (
    hasSignal(signals, "remote.agenda_difficulty_discount") ||
    hasSignal(signals, "score.agenda_difficulty_discount")
  ) {
    return agendaDifficultyPlacementComponent(params.serverId, server, evidence);
  }

  if (hasSignal(signals, "condition.during_hq_run")) {
    return hqOnlyPlacementComponent(params.serverId, evidence);
  }

  if (hasSignal(signals, "access.corp_central_access_reduction")) {
    return centralAccessPlacementComponent(params.serverId, evidence);
  }

  if (hasSignal(signals, "remote.capacity_support")) {
    return remoteCapacityPlacementComponent(params.serverId, server, evidence);
  }

  if (hasIceSupportSignal(signals)) {
    return iceSupportPlacementComponent(params.serverId, server, evidence);
  }

  if (
    params.actionSemanticCandidate !== undefined &&
    meaningfulSignals.length === 0
  ) {
    return {
      key: "corp_upgrade_install_placement_defer",
      label: "Upgrade-Placement vertagen",
      value: -900,
      reason: [...evidence, "defer_reason:no_upgrade_tactic_signal"].join("|"),
    };
  }

  return undefined;
}

export function corpRegionReplacementComponent(
  params: CorpUpgradePlacementParams,
): AiDecisionScoreComponent | undefined {
  if (params.action.payload?.regionReplacementWarning !== true) return undefined;
  const assessment = corpUpgradePlacementAssessment(params);
  if (!assessment) return undefined;
  return {
    key: assessment.recommendation === "allow"
      ? "corp_upgrade_region_replacement_value"
      : "corp_upgrade_region_replacement_defer",
    label: assessment.recommendation === "allow"
      ? "Regionsersatz mit Mehrwert"
      : "Regionsersatz vertagen",
    value: 0,
    reason: assessment.evidence.join("|"),
  };
}

function agendaDifficultyPlacementComponent(
  serverId: string | undefined,
  server: VisibleCorpServer | undefined,
  evidence: string[],
): AiDecisionScoreComponent {
  if (!isRemoteServerId(serverId)) {
    return {
      key: "corp_upgrade_install_placement_mismatch",
      label: "Upgrade-Zielserver unpassend",
      value: -5200,
      reason: [
        ...evidence,
        "mismatch:agenda_difficulty_requires_remote_scoring_fort",
      ].join("|"),
    };
  }

  if (serverHasScorelineRoot(server)) {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 1600,
      reason: [
        ...evidence,
        "fit:agenda_difficulty_active_scoreline_remote",
      ].join("|"),
    };
  }

  if (server !== undefined && server.root.length === 0 && server.ice.length > 0) {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 850,
      reason: [
        ...evidence,
        "fit:agenda_difficulty_prepared_score_remote",
        `ice_count:${server.ice.length}`,
      ].join("|"),
    };
  }

  return {
    key: "corp_upgrade_install_placement_defer",
    label: "Upgrade-Placement vertagen",
    value: -1700,
    reason: [
      ...evidence,
      "defer_reason:no_scoring_remote_payoff",
      `server_found:${server !== undefined}`,
    ].join("|"),
  };
}

function hqOnlyPlacementComponent(
  serverId: string | undefined,
  evidence: string[],
): AiDecisionScoreComponent {
  if (serverId === "hq") {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 1100,
      reason: [...evidence, "fit:hq_run_condition"].join("|"),
    };
  }
  return {
    key: "corp_upgrade_install_placement_mismatch",
    label: "Upgrade-Zielserver unpassend",
    value: -5000,
    reason: [...evidence, "mismatch:requires_hq_run"].join("|"),
  };
}

function centralAccessPlacementComponent(
  serverId: string | undefined,
  evidence: string[],
): AiDecisionScoreComponent {
  if (serverId === "hq" || serverId === "rd") {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 1000,
      reason: [...evidence, "fit:central_access_reduction"].join("|"),
    };
  }
  return {
    key: "corp_upgrade_install_placement_mismatch",
    label: "Upgrade-Zielserver unpassend",
    value: -4800,
    reason: [...evidence, "mismatch:requires_hq_or_rd"].join("|"),
  };
}

function remoteCapacityPlacementComponent(
  serverId: string | undefined,
  server: VisibleCorpServer | undefined,
  evidence: string[],
): AiDecisionScoreComponent {
  if (!isRemoteServerId(serverId)) {
    return {
      key: "corp_upgrade_install_placement_mismatch",
      label: "Upgrade-Zielserver unpassend",
      value: -3600,
      reason: [...evidence, "mismatch:remote_capacity_on_central"].join("|"),
    };
  }
  if (server !== undefined && (server.root.length > 0 || server.ice.length > 0)) {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 650,
      reason: [
        ...evidence,
        "fit:remote_capacity_existing_remote_pipeline",
        `root_count:${server.root.length}`,
        `ice_count:${server.ice.length}`,
      ].join("|"),
    };
  }
  return {
    key: "corp_upgrade_install_placement_defer",
    label: "Upgrade-Placement vertagen",
    value: -900,
    reason: [...evidence, "defer_reason:no_remote_capacity_payoff"].join("|"),
  };
}

function iceSupportPlacementComponent(
  serverId: string | undefined,
  server: VisibleCorpServer | undefined,
  evidence: string[],
): AiDecisionScoreComponent {
  if (serverId === undefined || serverId === "new_remote") {
    return {
      key: "corp_upgrade_install_placement_defer",
      label: "Upgrade-Placement vertagen",
      value: -900,
      reason: [...evidence, "defer_reason:no_existing_ice_fort"].join("|"),
    };
  }
  if (server !== undefined && server.ice.length > 0) {
    return {
      key: "corp_upgrade_install_placement_fit",
      label: "Upgrade-Zielserver passend",
      value: 750,
      reason: [
        ...evidence,
        "fit:ice_support_existing_ice",
        `ice_count:${server.ice.length}`,
      ].join("|"),
    };
  }
  return {
    key: "corp_upgrade_install_placement_defer",
    label: "Upgrade-Placement vertagen",
    value: 0,
    reason: [...evidence, "defer_reason:ice_support_without_ice"].join("|"),
  };
}

function regionReplacementAssessment(
  params: CorpUpgradePlacementParams,
  candidateSignals: ReadonlySet<string>,
  server: VisibleCorpServer | undefined,
): CorpUpgradePlacementAssessment {
  const replacedRegion = server?.root.find((card) =>
    card.instanceId !== params.sourceCard?.instanceId && cardIsRegion(card),
  );
  const candidateActiveUtility = activeUpgradeUtility(
    candidateSignals,
    params.serverId,
    server,
  );
  const replacedActiveUtility = activeUpgradeUtility(
    signalsForVisibleCard(replacedRegion),
    params.serverId,
    server,
  );
  const replacedUtility = new Set(replacedActiveUtility);
  const marginalUtility = candidateActiveUtility.filter(
    (utility) => !replacedUtility.has(utility),
  );
  const recommendation = marginalUtility.length > 0 ? "allow" : "defer";
  return placementAssessment({
    recommendation,
    reason: recommendation === "allow"
      ? "region_replacement_adds_active_utility"
      : "region_replacement_without_marginal_value",
    candidateActiveUtility,
    replacedActiveUtility,
    marginalUtility,
    evidence: [
      "region_replacement_warning:true",
      `card:${params.sourceCard?.definitionId ?? params.actionSemanticCandidate?.sourceDefinitionId ?? "unknown"}`,
      `server:${params.serverId ?? "none"}`,
      `replaced_region:${replacedRegion?.definitionId ?? "unknown"}`,
    ],
  });
}

function placementAssessment(params: {
  recommendation: CorpUpgradePlacementAssessment["recommendation"];
  reason: CorpUpgradePlacementAssessment["reason"];
  candidateActiveUtility?: string[];
  replacedActiveUtility?: string[];
  marginalUtility?: string[];
  evidence: string[];
}): CorpUpgradePlacementAssessment {
  const candidateActiveUtility = params.candidateActiveUtility ?? [];
  const replacedActiveUtility = params.replacedActiveUtility ?? [];
  const marginalUtility = params.marginalUtility ?? [];
  return {
    recommendation: params.recommendation,
    reason: params.reason,
    candidateActiveUtility,
    replacedActiveUtility,
    marginalUtility,
    evidence: [
      `placement_recommendation:${params.recommendation}`,
      `placement_reason:${params.reason}`,
      `candidate_active_utility:${candidateActiveUtility.join(",") || "none"}`,
      `replaced_active_utility:${replacedActiveUtility.join(",") || "none"}`,
      `marginal_utility:${marginalUtility.join(",") || "none"}`,
      ...params.evidence,
    ],
  };
}

function cardIsRegion(card: VisibleCard): boolean {
  const definition = visibleCardDefinition(card);
  return [...(card.subtypes ?? []), ...(definition?.subtypes ?? [])]
    .some((subtype) => normalizedToken(subtype) === "region");
}

function signalsForVisibleCard(card: VisibleCard | undefined): Set<string> {
  if (!card?.definitionId) return new Set();
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  if (!hint) return new Set();
  return new Set([
    ...(hint.effects ?? []).flatMap((effect) => [
      effect.kind,
      ...("target" in effect && typeof effect.target === "string"
        ? [effect.target]
        : []),
    ]),
    ...(hint.strategySupportPairs ?? []).flatMap((support) => [
      support.strategyId,
      support.role,
      ...support.evidence,
    ]),
    ...(hint.lineSupport ?? []),
  ]);
}

function activeUpgradeUtility(
  signals: ReadonlySet<string>,
  serverId: string | undefined,
  server: VisibleCorpServer | undefined,
): string[] {
  if (!serverId || !server) return [];
  const utility = new Set<string>();
  const agendas = server.root.filter((card) =>
    card.known !== false &&
    (card.type === "agenda" || visibleCardDefinition(card)?.type === "agenda"),
  );
  const agendaSubtypes = new Set(
    agendas.flatMap((card) => [
      ...(card.subtypes ?? []),
      ...(visibleCardDefinition(card)?.subtypes ?? []),
    ]).map(normalizedToken),
  );
  const specificDifficultySignals = [...signals].filter((signal) => {
    const match = /^score\.([a-z0-9_]+)_difficulty_discount$/.exec(signal);
    return Boolean(match && match[1] !== "agenda");
  });
  for (const signal of specificDifficultySignals) {
    const category = signal.slice("score.".length, -"_difficulty_discount".length);
    if (agendas.length > 0 && agendaSubtypes.has(category)) utility.add(signal);
  }
  if (
    agendas.length > 0 &&
    specificDifficultySignals.length === 0 &&
    (signals.has("score.agenda_difficulty_discount") ||
      signals.has("remote.agenda_difficulty_discount"))
  ) {
    utility.add("score.agenda_difficulty_discount");
  }
  if (
    server.ice.length > 0 &&
    [...signals].some((signal) =>
      signal.startsWith("ice.corp_") ||
      signal === "run.corp_pay_or_end_run" ||
      signal.startsWith("tax.runner_") ||
      signal === "remote.scoring_protection",
    )
  ) {
    utility.add("ice_supported_run_defense");
  }
  if (
    (serverId === "hq" || serverId === "rd") &&
    signals.has("access.corp_central_access_reduction")
  ) {
    utility.add("central_access_reduction");
  }
  if (
    serverId.startsWith("remote_") &&
    (server.root.length > 0 || server.ice.length > 0) &&
    signals.has("remote.capacity_support")
  ) {
    utility.add("remote_capacity_support");
  }
  return [...utility].sort();
}

function normalizedToken(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sourceLooksLikeUpgrade(params: CorpUpgradePlacementParams): boolean {
  const definition = params.sourceCard
    ? visibleCardDefinition(params.sourceCard)
    : undefined;
  const payloadCardType =
    typeof params.action.payload?.cardType === "string"
      ? params.action.payload.cardType
      : typeof params.action.payload?.targetCardType === "string"
        ? params.action.payload.targetCardType
        : undefined;
  return (
    params.sourceCard?.type === "upgrade" ||
    definition?.type === "upgrade" ||
    payloadCardType === "upgrade" ||
    rolesMatch(params.roles, ["upgrade"])
  );
}

function semanticSignals(
  candidate: ActionSemanticCandidate | undefined,
): ReadonlySet<string> {
  if (!candidate) return new Set();
  return new Set([
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...(candidate.compatibilitySignals ?? []),
    ...candidate.strategySupport.flatMap((support) => [
      support.strategyId,
      support.role,
      support.evidence,
    ]),
  ]);
}

function hasSignal(signals: ReadonlySet<string>, signal: string): boolean {
  return signals.has(signal);
}

function hasIceSupportSignal(signals: ReadonlySet<string>): boolean {
  return [...signals].some(
    (signal) =>
      signal.startsWith("ice.corp_") ||
      signal === "run.corp_pay_or_end_run" ||
      signal === "ice.corp_strength_support" ||
      signal === "ice.corp_rez_discount" ||
      signal === "ice.corp_install_discount" ||
      signal === "ice.corp_ice_swap",
  );
}

function visibleServer(
  input: AiDecisionInput,
  serverId: string | undefined,
): VisibleCorpServer | undefined {
  if (serverId === undefined || serverId === "new_remote") return undefined;
  return input.playerView.servers.find((server) => server.id === serverId);
}

function isRemoteServerId(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}

function serverHasScorelineRoot(server: VisibleCorpServer | undefined): boolean {
  return (
    server?.root.some((card) => {
      if (card.known === false) return false;
      const definition = visibleCardDefinition(card);
      return (
        card.type === "agenda" ||
        definition?.type === "agenda" ||
        typeof card.advancementRequirement === "number" ||
        typeof definition?.advancementRequirement === "number" ||
        (card.advancementCounters ?? 0) > 0
      );
    }) === true
  );
}

function baseEvidence(
  params: CorpUpgradePlacementParams,
  meaningfulSignals: readonly string[],
): string[] {
  const definition = params.sourceCard
    ? visibleCardDefinition(params.sourceCard)
    : undefined;
  const sourceDefinitionId =
    params.sourceCard?.definitionId ??
    params.actionSemanticCandidate?.sourceDefinitionId ??
    "unknown";
  return [
    "upgrade_install_placement:true",
    `card:${sourceDefinitionId}`,
    `server:${params.serverId ?? "none"}`,
    `source_type:${params.sourceCard?.type ?? definition?.type ?? "unknown"}`,
    `signals:${meaningfulSignals.length > 0 ? meaningfulSignals.join(",") : "none"}`,
  ];
}

import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { visibleCardDefinition } from "./card-definition-lookup";
import { rolesMatch } from "./role-match";

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
    value: -700,
    reason: [...evidence, "defer_reason:ice_support_without_ice"].join("|"),
  };
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

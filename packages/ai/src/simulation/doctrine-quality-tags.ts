import {
  DEMO_CARDS_BY_ID,
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import type {
  AiSimulationSummary,
} from "../index";
import { FORBIDDEN_AI_INPUT_FIELDS } from "../runtime/ai-decision-input";
import { countValue as countTag, sortedUnique } from "../runtime/collection";
import {
  DOCTRINE_QUALITY_METRIC_NAMES,
  sumDoctrineMetrics,
} from "./simulation-metric-aggregation";

type CentralRunActionSequenceEntry = {
  side?: string;
  actionType?: string;
  targetServerId?: string;
  reasonCode: string;
};

type DoctrineQualityTagFeatures = {
  serverFeaturesById: Map<string, { iceCount?: number; rootCount?: number }>;
  rigRoles: Set<string>;
};

type DoctrineQualityTagDependencies = {
  extractFeatures: (input: AiDecisionInput) => DoctrineQualityTagFeatures;
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export type AiDoctrineQualityMetrics = {
  nakedAgendaInstalls: number;
  agendaFloodExposure: number;
  scoreWindowMissed: number;
  remoteOverbuild: number;
  economyStall: number;
  repeatedLowValueCentralRun: number;
  rigStall: number;
  assetTrashNeglect: number;
};

export type AiDoctrineQualityMetricName = keyof AiDoctrineQualityMetrics;
export type AiDoctrineQualityDelta = AiDoctrineQualityMetrics;

export type AiDoctrineQualityCaseExample = {
  metric: AiDoctrineQualityMetricName;
  seed: string;
  actionIndex: number;
  stateVersionBefore: number;
  side: Side;
  actionType: LegalAction["type"];
  reasonCode: string;
  targetServerId?: string;
  qualityTags: string[];
};

export type AiDoctrineQualityCaseAnalysis = {
  version: "ai-deck-doctrine-case-analysis-v1";
  maxExamplesPerMetric: number;
  totals: AiDoctrineQualityMetrics;
  examples: Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]>;
  redactionSafe: boolean;
};

export type AiDoctrineQualityGateThresholds = {
  maxCandidateIllegalActions: number;
  maxCandidateReplayFailures: number;
  maxTimeoutRateDelta: number;
  maxFallbackRateDelta: number;
  maxNakedAgendaInstallDelta: number;
  maxScoreWindowMissedDelta: number;
  maxEconomyStallDelta: number;
  maxRepeatedLowValueCentralRunDelta: number;
};

export type AiDoctrineQualityGateResult = {
  accepted: boolean;
  thresholds: AiDoctrineQualityGateThresholds;
  hardFailures: string[];
  warnings: string[];
};

export function qualityTagsForActionWithDependencies(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  dependencies: DoctrineQualityTagDependencies,
): string[] {
  const tags: string[] = [];
  const features = dependencies.extractFeatures(input);
  const sourceCard =
    action.source === "basic_action" || action.source === "game_rule"
      ? undefined
      : dependencies.findVisibleCard(input, action.source);
  const sourceDefinition = sourceCard?.definitionId
    ? DEMO_CARDS_BY_ID[sourceCard.definitionId]
    : undefined;
  const targetServerId =
    typeof action.payload?.serverId === "string"
      ? action.payload.serverId
      : undefined;
  const targetServer = targetServerId
    ? features.serverFeaturesById.get(targetServerId)
    : undefined;
  const agendaInHand = input.playerView.own.gripOrHq.filter(
    (card) =>
      card.definitionId &&
      DEMO_CARDS_BY_ID[card.definitionId]?.type === "agenda",
  ).length;
  const legalScoreAvailable =
    input.side === "corp" &&
    input.legalActions.some((candidate) => candidate.type === "score_agenda");
  const legalTrashAvailable =
    input.side === "runner" &&
    input.legalActions.some(
      (candidate) => candidate.type === "trash_accessed_card",
    );
  const lowCredits = input.playerView.own.credits <= 1;
  const economyAction =
    action.type === "gain_credit" ||
    ((action.type === "play_event" || action.type === "play_operation") &&
      dependencies
        .rolesForAction(input, action)
        .some((role) => role.includes("economy") || role === "tempo"));
  const economyStallExempt = isEconomyStallExemptAction(
    input,
    action,
    decision,
  );
  const visibleRemoteContest =
    targetServerId?.startsWith("remote_") === true &&
    (targetServer?.rootCount ?? 0) > 0;

  if (
    input.side === "corp" &&
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    sourceDefinition?.type === "agenda"
  ) {
    if (
      targetServerId === "new_remote" ||
      ((targetServer?.iceCount ?? 0) === 0 &&
        (targetServer?.rootCount ?? 0) === 0)
    )
      tags.push("naked_agenda_install");
  }
  if (
    input.side === "corp" &&
    agendaInHand >= 3 &&
    !isAgendaFloodExposureExemptAction(action, decision, sourceDefinition)
  )
    tags.push("agenda_flood_exposure");
  if (legalScoreAvailable && action.type !== "score_agenda")
    tags.push("score_window_missed");
  if (
    input.side === "corp" &&
    action.type === "install_card" &&
    targetServerId?.startsWith("remote_") &&
    ((action.payload?.placement === "ice" &&
      (targetServer?.iceCount ?? 0) >= 2) ||
      (action.payload?.placement !== "ice" &&
        (targetServer?.rootCount ?? 0) >= 2))
  ) {
    tags.push("remote_overbuild");
  }
  if (lowCredits && !economyAction && !economyStallExempt)
    tags.push("economy_stall");
  if (
    input.side === "runner" &&
    features.rigRoles.size === 0 &&
    action.type === "start_run" &&
    !visibleRemoteContest &&
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 2
  )
    tags.push("rig_stall");
  if (legalTrashAvailable && action.type !== "trash_accessed_card")
    tags.push("asset_trash_neglect");
  if (decision.timeoutUsed) tags.push("timeout");
  if (decision.fallbackUsed) tags.push("fallback");
  return sortedUnique(tags);
}

export function isEconomyStallExemptAction(
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "resolve_choice"
  )
    return true;
  if (input.side !== "runner") return false;
  return (
    action.type === "pump_breaker" ||
    action.type === "break_subroutine" ||
    action.type === "continue_run" ||
    action.type === "access_card" ||
    action.type === "steal_agenda"
  );
}

export function isAgendaFloodExposureExemptAction(
  action: LegalAction,
  decision: AiDecision,
  sourceDefinition?: { type?: string },
): boolean {
  if (decision.fallbackUsed) return true;
  if (decision.reasonCode.endsWith(".recover_economy")) return true;
  if (
    decision.reasonCode.endsWith(".protect_hq") ||
    decision.reasonCode.endsWith(".protect_rnd")
  )
    return true;
  if (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    sourceDefinition?.type !== "agenda"
  )
    return true;
  return (
    action.type === "mandatory_draw" ||
    action.type === "end_turn" ||
    action.type === "decline_rez" ||
    action.type === "rez_ice" ||
    action.type === "resolve_choice"
  );
}

export function repeatedLowValueCentralRunTags(
  actionSequence: readonly CentralRunActionSequenceEntry[],
): string[] {
  const tags: string[] = [];
  const lastCentralRunByServer = new Map<string, number>();
  for (const [index, entry] of actionSequence.entries()) {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      !entry.targetServerId ||
      !["rd", "hq", "archives"].includes(entry.targetServerId)
    )
      continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (
      previous !== undefined &&
      index - previous <= 4 &&
      !entry.reasonCode.includes("contest") &&
      !entry.reasonCode.includes("trash")
    )
      tags.push("repeated_low_value_central_run");
    lastCentralRunByServer.set(entry.targetServerId, index);
  }
  return tags;
}

export function doctrineMetricsFor(tags: string[]): AiDoctrineQualityMetrics {
  return {
    nakedAgendaInstalls: countTag(tags, "naked_agenda_install"),
    agendaFloodExposure: countTag(tags, "agenda_flood_exposure"),
    scoreWindowMissed: countTag(tags, "score_window_missed"),
    remoteOverbuild: countTag(tags, "remote_overbuild"),
    economyStall: countTag(tags, "economy_stall"),
    repeatedLowValueCentralRun: countTag(
      tags,
      "repeated_low_value_central_run",
    ),
    rigStall: countTag(tags, "rig_stall"),
    assetTrashNeglect: countTag(tags, "asset_trash_neglect"),
  };
}

export function summarizeDoctrineQualityMetrics(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiDoctrineQualityMetrics {
  return doctrineMetricsFor([
    ...actionSequence.flatMap((entry) => entry.qualityTags),
    ...repeatedLowValueCentralRunTags(actionSequence),
  ]);
}

export function emptyDoctrineCaseExamples(): Record<
  AiDoctrineQualityMetricName,
  AiDoctrineQualityCaseExample[]
> {
  return DOCTRINE_QUALITY_METRIC_NAMES.reduce(
    (examples, metric) => ({
      ...examples,
      [metric]: [],
    }),
    {} as Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]>,
  );
}

export function doctrineMetricForQualityTag(
  tag: string,
): AiDoctrineQualityMetricName | undefined {
  switch (tag) {
    case "naked_agenda_install":
      return "nakedAgendaInstalls";
    case "agenda_flood_exposure":
      return "agendaFloodExposure";
    case "score_window_missed":
      return "scoreWindowMissed";
    case "remote_overbuild":
      return "remoteOverbuild";
    case "economy_stall":
      return "economyStall";
    case "rig_stall":
      return "rigStall";
    case "asset_trash_neglect":
      return "assetTrashNeglect";
    default:
      return undefined;
  }
}

export function collectRepeatedLowValueCentralRunExamples(
  summary: AiSimulationSummary,
  examples: Record<AiDoctrineQualityMetricName, AiDoctrineQualityCaseExample[]>,
  maxExamplesPerMetric: number,
): void {
  const metric: AiDoctrineQualityMetricName = "repeatedLowValueCentralRun";
  const lastCentralRunByServer = new Map<string, number>();
  for (const [actionIndex, entry] of summary.actionSequence.entries()) {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      !entry.targetServerId ||
      !["rd", "hq", "archives"].includes(entry.targetServerId)
    )
      continue;
    const previous = lastCentralRunByServer.get(entry.targetServerId);
    if (
      previous !== undefined &&
      actionIndex - previous <= 4 &&
      !entry.reasonCode.includes("contest") &&
      !entry.reasonCode.includes("trash") &&
      examples[metric].length < maxExamplesPerMetric
    ) {
      examples[metric].push(
        doctrineCaseExample(summary.seed, actionIndex, entry, metric),
      );
    }
    lastCentralRunByServer.set(entry.targetServerId, actionIndex);
  }
}

export function doctrineCaseExample(
  seed: string,
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
  metric: AiDoctrineQualityMetricName,
): AiDoctrineQualityCaseExample {
  return {
    metric,
    seed,
    actionIndex,
    stateVersionBefore: entry.stateVersionBefore,
    side: entry.side,
    actionType: entry.actionType,
    reasonCode: entry.reasonCode,
    ...(entry.targetServerId ? { targetServerId: entry.targetServerId } : {}),
    qualityTags: entry.qualityTags.slice().sort(),
  };
}

export function isRedactionSafeCaseAnalysis(
  analysis: AiDoctrineQualityCaseAnalysis,
): boolean {
  const serialized = JSON.stringify(analysis);
  return !FORBIDDEN_AI_INPUT_FIELDS.some((needle) =>
    serialized.includes(needle),
  );
}

export function analyzeDoctrineQualityCases(
  summaries: AiSimulationSummary[],
  options: { maxExamplesPerMetric?: number } = {},
): AiDoctrineQualityCaseAnalysis {
  const maxExamplesPerMetric = options.maxExamplesPerMetric ?? 3;
  const examples = emptyDoctrineCaseExamples();
  for (const summary of summaries) {
    for (const [actionIndex, entry] of summary.actionSequence.entries()) {
      for (const tag of entry.qualityTags) {
        const metric = doctrineMetricForQualityTag(tag);
        if (!metric || examples[metric].length >= maxExamplesPerMetric)
          continue;
        examples[metric].push(
          doctrineCaseExample(summary.seed, actionIndex, entry, metric),
        );
      }
    }
    collectRepeatedLowValueCentralRunExamples(
      summary,
      examples,
      maxExamplesPerMetric,
    );
  }
  const analysis: AiDoctrineQualityCaseAnalysis = {
    version: "ai-deck-doctrine-case-analysis-v1",
    maxExamplesPerMetric,
    totals: sumDoctrineMetrics(
      summaries.map((summary) => summary.metrics.doctrine),
    ),
    examples,
    redactionSafe: true,
  };
  return {
    ...analysis,
    redactionSafe: isRedactionSafeCaseAnalysis(analysis),
  };
}

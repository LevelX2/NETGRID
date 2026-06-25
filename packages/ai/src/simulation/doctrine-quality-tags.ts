import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import type {
  AiDoctrineQualityCaseExample,
  AiDoctrineQualityMetricName,
  AiDoctrineQualityMetrics,
  AiSimulationSummary,
} from "../index";
import { countValue as countTag } from "../runtime/collection";
import { DOCTRINE_QUALITY_METRIC_NAMES } from "./simulation-metric-aggregation";

type CentralRunActionSequenceEntry = {
  side?: string;
  actionType?: string;
  targetServerId?: string;
  reasonCode: string;
};

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

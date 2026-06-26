import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import { reconstructBeliefState } from "../belief-state";
import { isLowValueKnownAccessCard } from "../runtime/runner-low-value-known-access-card";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  definitionTypeForMetrics,
  trashCostForDefinitionForMetrics,
} from "./card-metric-lookup";
import { visibleBreakCostForKnownIceDefinition } from "./visible-break-cost-metric";

export function runnerKnownCardPositionDiagnosticsForMetrics(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const belief = reconstructBeliefState(input);
  const memory = belief.runnerOpponentModel?.knownPositionMemory ?? [];
  const hqMemory = belief.runnerOpponentModel?.hqHandMemory;
  const invalidationText = [
    ...(belief.runnerOpponentModel?.rndTopFreshness.invalidationReasons ?? []),
    ...(hqMemory?.invalidationReasons ?? []),
  ].join("|");
  const knownRemote = memory.filter(
    (entry) =>
      entry.zone.startsWith("remote_") && entry.positionKey.startsWith("root:"),
  );
  const knownRemoteAgendas = knownRemote.filter(
    (entry) => definitionTypeForMetrics(entry.definitionId) === "agenda",
  );
  const knownRemoteTrashable = knownRemote.filter((entry) => {
    const type = definitionTypeForMetrics(entry.definitionId);
    return (
      (type === "asset" || type === "upgrade") &&
      trashCostForDefinitionForMetrics(entry.definitionId) !== undefined
    );
  });
  const knownUnrezzedIce = memory.filter((entry) =>
    entry.positionKey.startsWith("ice:"),
  );
  const runTarget =
    action.type === "start_run"
      ? (targetServerId ??
        (typeof action.payload?.serverId === "string"
          ? action.payload.serverId
          : undefined))
      : undefined;
  const targetKnownRemote = runTarget
    ? knownRemote.filter((entry) => entry.zone === runTarget)
    : [];
  const targetKnownUnrezzedIce = runTarget
    ? knownUnrezzedIce.filter((entry) => entry.zone === runTarget)
    : [];
  const runCostAdjusted = targetKnownUnrezzedIce.reduce(
    (sum, entry) =>
      sum + visibleBreakCostForKnownIceDefinition(input, entry.definitionId),
    0,
  );
  const hqKnownFromRndDraw =
    hqMemory?.invalidationReasons.some((reason) =>
      reason.includes("known_rnd_top_moved_to_hq"),
    ) ?? false;
  const hqKnownAgendaFromRnd =
    hqKnownFromRndDraw &&
    (hqMemory?.knownDefinitions ?? []).some(
      (definitionId) => definitionTypeForMetrics(definitionId) === "agenda",
    );
  const rndFreshness = belief.runnerOpponentModel?.rndTopFreshness;
  const rndTopRemoved = rndFreshness?.freshness === "fresh_after_top_removed";
  const rndKnownTopAgenda =
    rndFreshness?.knownTopDefinitionId !== undefined &&
    definitionTypeForMetrics(rndFreshness.knownTopDefinitionId) === "agenda";
  const rndKnownTopNonAgenda =
    rndFreshness?.knownTopDefinitionId !== undefined && !rndKnownTopAgenda;
  const rndStaleKnownTop = rndFreshness?.freshness === "stale_known_same_top";
  const isRndRun = action.type === "start_run" && runTarget === "rd";
  const rndFreshOpportunity =
    rndTopRemoved ||
    rndKnownTopAgenda ||
    rndFreshness?.freshenedByRunnerAccess === true;
  return {
    ...(memory.some(
      (entry) => entry.zone === "rd" && entry.positionKey === "top",
    )
      ? { knownRndTopCard: true }
      : {}),
    ...(invalidationText.includes("known_rnd_top_moved_to_hq")
      ? { knownRndTopMovedToHq: true, hqKnownFromRndDraw: true }
      : {}),
    ...(invalidationText.includes("corp_draw_from_rd") ||
    invalidationText.includes("shuffle_changed_rd_top") ||
    invalidationText.includes("arrange_changed_rd_top") ||
    invalidationText.includes("swap_changed_rd_top")
      ? { knownRndTopInvalidated: true }
      : {}),
    ...(action.type === "start_run" &&
    runTarget === "hq" &&
    hqKnownAgendaFromRnd
      ? { hqRunBoostedByRndToHqAgenda: true }
      : {}),
    ...(action.type === "start_run" &&
    runTarget === "hq" &&
    hqKnownFromRndDraw &&
    !hqKnownAgendaFromRnd
      ? { hqRunSuppressedByRndToHqNonAgenda: true }
      : {}),
    ...([
      "steal_agenda",
      "trash_accessed_card",
      "move_to_removed_from_game",
      "move_to_set_aside",
    ].includes(action.type) && targetServerId === "rd"
      ? { rndAccessRemovedTopCard: true }
      : {}),
    ...(action.type === "steal_agenda" && targetServerId === "rd"
      ? { rndAccessStoleAgenda: true }
      : {}),
    ...(action.type === "trash_accessed_card" && targetServerId === "rd"
      ? { rndAccessTrashedCard: true }
      : {}),
    ...(action.type === "access_card" &&
    targetServerId === "rd" &&
    !input.legalActions.some(
      (candidate) =>
        candidate.type === "steal_agenda" ||
        candidate.type === "trash_accessed_card",
    )
      ? { rndAccessLeftTopCardUnchanged: true }
      : {}),
    ...(rndFreshness?.freshenedByRunnerAccess === true
      ? { rndTopFreshenedByRunnerAccess: true }
      : {}),
    ...(rndFreshness?.invalidationReasons.some((reason) =>
      reason.includes("rd_known_top_sequence_advanced"),
    )
      ? {
          rndKnownTopAdvancedAfterAccess: true,
          rndKnownTopSequenceAdvanced: true,
        }
      : {}),
    ...(isRndRun && rndTopRemoved ? { rndRepeatRunAfterTopRemoved: true } : {}),
    ...(isRndRun && rndStaleKnownTop
      ? { rndRepeatRunAfterTopUnchanged: true }
      : {}),
    ...(isRndRun && rndTopRemoved
      ? { rndRepeatRunBoostedByFreshTop: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop
      ? { rndRepeatRunSuppressedBecauseKnownStaleTop: true }
      : {}),
    ...(isRndRun && rndKnownTopAgenda
      ? { rndRepeatRunBoostedByKnownAgendaTop: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop && rndKnownTopNonAgenda
      ? { rndRepeatRunSuppressedBecauseKnownNonAgendaTop: true }
      : {}),
    ...(rndFreshOpportunity ? { rndFreshTopPressureOpportunity: true } : {}),
    ...(isRndRun && rndFreshOpportunity
      ? { rndFreshTopPressureTaken: true }
      : {}),
    ...(rndFreshOpportunity && !isRndRun
      ? { rndFreshTopPressureSkipped: true }
      : {}),
    ...(isRndRun && rndStaleKnownTop && rndKnownTopNonAgenda
      ? {
          rndStaleTopRepeatMistake: true,
          rndAccessNoValueRepeatStale: true,
        }
      : {}),
    ...(rndTopRemoved &&
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <= 2
      ? { rndCloseoutOpportunityAfterTopRemoved: true }
      : {}),
    ...(knownRemote.length > 0 ? { knownRemoteCards: knownRemote.length } : {}),
    ...(knownRemoteAgendas.length > 0
      ? { knownRemoteAgendas: knownRemoteAgendas.length }
      : {}),
    ...(knownRemoteTrashable.length > 0
      ? { knownRemoteTrashableCards: knownRemoteTrashable.length }
      : {}),
    ...(knownRemote.length > 0
      ? { remoteMemoryRetainedAfterAccess: true }
      : {}),
    ...(invalidationText.includes("remote_state_changed") ||
    memory.some((entry) =>
      entry.invalidatedBy.some(
        (reason) => reason.includes("install") || reason.includes("move"),
      ),
    )
      ? { remoteMemoryInvalidatedByInstallOrMove: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some(
      (entry) => definitionTypeForMetrics(entry.definitionId) === "agenda",
    )
      ? { remoteRunBoostedByKnownRemoteAgenda: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some((entry) =>
      isLowValueKnownAccessCard(
        entry.definitionId,
        input.playerView.own.credits,
      ),
    )
      ? { remoteRunSuppressedByKnownLowValueRemote: true }
      : {}),
    ...(action.type === "start_run" &&
    targetKnownRemote.some((entry) => {
      const type = definitionTypeForMetrics(entry.definitionId);
      return (
        (type === "asset" || type === "upgrade") &&
        trashCostForDefinitionForMetrics(entry.definitionId) !== undefined
      );
    })
      ? { remoteTrashBoostedByKnownRemoteTrashable: true }
      : {}),
    ...(knownUnrezzedIce.length > 0
      ? {
          knownUnrezzedIceFromExpose: knownUnrezzedIce.length,
          knownUnrezzedIceRetained: true,
        }
      : {}),
    ...(invalidationText.includes("conceal") ||
    invalidationText.includes("reorder")
      ? { knownUnrezzedIceInvalidated: true }
      : {}),
    ...(runCostAdjusted > 0
      ? { runCostAdjustedByKnownUnrezzedIce: runCostAdjusted }
      : {}),
    ...(action.type === "jack_out" && knownUnrezzedIce.length > 0
      ? { jackOutInfluencedByKnownUnrezzedIce: true }
      : {}),
    ...(action.type === "install_card" && knownUnrezzedIce.length > 0
      ? { rigPlanInfluencedByKnownUnrezzedIce: true }
      : {}),
  };
}

import { type AiDecisionInput } from "@netgrid/shared";

import { reconstructBeliefState } from "../belief-state";
import { isLowValueKnownAccessCard } from "../runtime/runner-low-value-known-access-card";
import { roundNumber as round } from "../runtime/number-rounding";
import { eventMayChangeHqPressure as aiEventMayChangeHqPressure } from "../runtime/public-event-history";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  agendaPointsForMetrics,
  definitionTypeForMetrics,
} from "./card-metric-lookup";
import { isRepeatedLowValueCentralRunForMetrics } from "./central-run-history";

export function runnerHqMemoryDiagnosticsForMetrics(
  input: AiDecisionInput,
  centralRun: boolean,
  centralTarget: "hq" | "rd" | "archives" | undefined,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  const memory =
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory;
  if (!memory) return {};
  const knownAgendaDefinitions = memory.knownDefinitions.filter(
    (definitionId) => definitionTypeForMetrics(definitionId) === "agenda",
  );
  const knownAgendaPoints = knownAgendaDefinitions.reduce(
    (sum, definitionId) => sum + agendaPointsForMetrics(definitionId),
    0,
  );
  const knownNonAgendaCount =
    memory.knownDefinitions.length - knownAgendaDefinitions.length;
  const unknownCount = Math.max(0, memory.handCount - memory.knownCount);
  const knownFraction =
    memory.handCount > 0 ? round(memory.knownCount / memory.handCount) : 0;
  const fullyKnownNoAgenda =
    memory.allCardsKnown &&
    memory.knownCount > 0 &&
    knownAgendaDefinitions.length === 0 &&
    memory.knownDefinitions.every((definitionId) =>
      isLowValueKnownAccessCard(definitionId, input.playerView.own.credits),
    );
  const knownCardValue =
    centralRun && centralTarget === "hq"
      ? knownAgendaDefinitions.length * 520 + knownAgendaPoints * 80
      : 0;
  const unknownCardValue =
    centralRun && centralTarget === "hq" ? Math.min(140, unknownCount * 55) : 0;
  return {
    hqKnownCards: memory.knownCount,
    hqUnknownCards: unknownCount,
    hqKnownFraction: knownFraction,
    ...(memory.allCardsKnown ? { hqFullyKnown: true } : {}),
    hqKnownAgendaCount: knownAgendaDefinitions.length,
    hqKnownNonAgendaCount: knownNonAgendaCount,
    hqKnownAgendaPoints: knownAgendaPoints,
    ...runnerHqMemoryInvalidationFlags(memory.invalidationReasons),
    ...(knownCardValue > 0 ? { hqRunValueFromKnownCards: knownCardValue } : {}),
    ...(unknownCardValue > 0
      ? { hqRunValueFromUnknownCards: unknownCardValue }
      : {}),
    ...(centralRun && centralTarget === "hq" && fullyKnownNoAgenda
      ? { hqRunSuppressedBecauseFullyKnownNoAgenda: true }
      : {}),
    ...(centralRun &&
    centralTarget === "hq" &&
    knownAgendaDefinitions.length > 0
      ? { hqRunBoostedBecauseKnownAgenda: true }
      : {}),
    ...(centralRun && centralTarget === "hq" && unknownCount > 0
      ? { hqRunBoostedBecauseUnknownCardsRemain: true }
      : {}),
    ...(centralRun &&
    centralTarget === "hq" &&
    isRepeatedLowValueCentralRunForMetrics(input, "hq") &&
    !input.eventTail.some(aiEventMayChangeHqPressure)
      ? { hqRunRepeatedWithoutNewHqInfo: true }
      : {}),
  };
}

export function runnerHqMemoryInvalidationFlags(
  invalidationReasons: readonly string[],
): Partial<AiSimulationSummary["actionSequence"][number]> {
  return {
    ...(invalidationReasons.includes("corp_draw_added_unknown_hq_card")
      ? { hqMemoryInvalidatedByDraw: true }
      : {}),
    ...(invalidationReasons.includes("known_hq_card_installed") ||
    invalidationReasons.includes("corp_installed_hidden_hq_card")
      ? { hqMemoryInvalidatedByInstall: true }
      : {}),
    ...(invalidationReasons.includes("known_hq_card_played") ||
    invalidationReasons.includes("corp_played_unknown_hq_card")
      ? { hqMemoryInvalidatedByPlay: true }
      : {}),
    ...(invalidationReasons.includes("corp_discarded_hq_card")
      ? { hqMemoryInvalidatedByDiscard: true }
      : {}),
    ...(invalidationReasons.includes("shuffle_changed_hq_hand") ||
    invalidationReasons.includes("arrange_changed_hq_hand") ||
    invalidationReasons.includes("swap_changed_hq_hand")
      ? { hqMemoryInvalidatedByShuffleOrReorder: true }
      : {}),
  };
}

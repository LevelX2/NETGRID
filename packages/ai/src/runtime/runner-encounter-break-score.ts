import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import {
  isEndRunSubroutine,
  isImmediateSafetyThreatSubroutine,
} from "./encounter-subroutine";
import { currentEncounteredIceCard } from "./current-encounter";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";

export function runnerEncounterBreakScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  if (input.side !== "runner" || action.type !== "break_subroutine") {
    return [];
  }
  const breakIndexes = breakSubroutineIndexesForAction(action);
  if (breakIndexes.size <= 0) return [];

  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines ?? [];
  const targetSubroutines = [...breakIndexes]
    .map((index) => subroutines[index])
    .filter((subroutine): subroutine is NonNullable<typeof subroutine> =>
      Boolean(subroutine),
    );
  const immediateThreatCount = targetSubroutines.filter(
    isImmediateSafetyThreatSubroutine,
  ).length;
  const endRunCount = targetSubroutines.filter(isEndRunSubroutine).length;
  const extraSubroutineCount = Math.max(0, breakIndexes.size - 1);
  const value =
    immediateThreatCount * 500 + endRunCount * 600 + extraSubroutineCount * 90;
  if (value <= 0) return [];
  return [
    {
      key: "runner_encounter_break_targets",
      label: "Encounter-Break-Ziele",
      value,
      reason: [
        `indexes:${[...breakIndexes].sort((left, right) => left - right).join(",")}`,
        `immediate_threats:${immediateThreatCount}`,
        `end_run:${endRunCount}`,
        `extra_subroutines:${extraSubroutineCount}`,
      ].join("|"),
    },
  ];
}

import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

export function visibleBreakCostForKnownIceDefinition(
  input: AiDecisionInput,
  definitionId: string,
): number {
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!definition) return 0;
  const assessment = assessKnownRezzedIcePath(
    [
      {
        instanceId: `known_unrezzed_${definitionId}`,
        known: true,
        definitionId,
        type: "ice",
        subtypes: definition.subtypes ?? [],
        rezzed: true,
        strength: definition.strength,
        subroutines: definition.subroutines ?? [],
        owner: "corp",
        controller: "corp",
      } as VisibleCard,
    ],
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
  );
  return assessment.visibleBreakCost ?? 0;
}

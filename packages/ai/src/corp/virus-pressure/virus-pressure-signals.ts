import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpVirusPressureSignal } from "./virus-pressure-types";
import { assessCorpPurgeImpact } from "./corp-purge-impact";

export function buildCorpVirusPressureSignals(
  input: AiDecisionInput,
): CorpVirusPressureSignal[] {
  if (input.side !== "corp") return [];
  const { stateVersion } = input.playerView;
  return input.legalActions.flatMap((action): CorpVirusPressureSignal[] => {
    if (
      !actionMatchesCurrentDecision(input, action) ||
      (action.type !== "purge_virus_counters" &&
        action.type !== "purge_runner_virus_counters")
    )
      return [];
    const impact = assessCorpPurgeImpact(input, action, {
      primary: "low_value",
      severity: "low",
    });
    if (!impact) return [];
    const { activeCounterTotal, recurringActionLoss, clickCost, component } =
      impact;
    return [
      {
        pressureId: `visible-virus-pressure:${action.actionId}`,
        actionId: action.actionId,
        stateVersion,
        actionCost: clickCost,
        virusCounters: activeCounterTotal,
        strategicDamage: activeCounterTotal + recurringActionLoss * 3,
        critical: activeCounterTotal >= 3 || recurringActionLoss > 0,
        purgeUseful: component.value > 0,
        evidenceCode: "visible_runner_virus_counters",
      },
    ];
  });
}

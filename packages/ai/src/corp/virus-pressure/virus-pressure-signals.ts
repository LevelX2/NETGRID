import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpVirusPressureSignal } from "./virus-pressure-types";
import {
  corpPurgeHasVisibleStrategicPressure,
  corpPurgeRecurringActionLoss,
} from "./corp-purge-impact";
export function buildCorpVirusPressureSignals(
  input: AiDecisionInput,
): CorpVirusPressureSignal[] {
  const purgeAction = input.legalActions.find(
    (action) =>
      action.type === "purge_virus_counters" ||
      action.type === "purge_runner_virus_counters",
  );
  const visibleVirusCounters = visibleRunnerVirusCounters(input);
  const virusPressure: CorpVirusPressureSignal[] = purgeAction
    ? [
        {
          pressureId: "visible-virus-pressure",
          virusCounters: visibleVirusCounters,
          strategicDamage:
            visibleVirusCounters +
            corpPurgeRecurringActionLoss(input, purgeAction) * 3,
          critical:
            visibleVirusCounters >= 3 ||
            corpPurgeRecurringActionLoss(input, purgeAction) > 0,
          purgeUseful: corpPurgeHasVisibleStrategicPressure(input, purgeAction),
          evidenceCode: "visible_runner_virus_counters",
        },
      ]
    : [];
  return virusPressure;
}

function visibleRunnerVirusCounters(input: AiDecisionInput): number {
  const installedCounters = (input.playerView.opponent.rig ?? []).reduce(
    (sum, card) => sum + (card.counters?.virus ?? 0),
    0,
  );
  const identityCounters =
    input.playerView.own.identity.counterDisplays?.reduce((sum, display) => {
      if (display.displayKind !== "virus") return sum;
      const amount = Math.max(0, Math.floor(display.amount ?? 0));
      const activeThreshold =
        display.counterType === "highlighter" ||
        display.counterType === "garbage" ||
        display.counterType === "cascade" ||
        display.counterType === "crumble"
          ? 2
          : 1;
      return amount >= activeThreshold ? sum + amount : sum;
    }, 0) ?? 0;
  return installedCounters + identityCounters;
}

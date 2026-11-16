import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { CorpIcePortfolioMetricKey } from "./corp-ice-portfolio-types";
import {
  countCorpMultiIceInstallOrderFutureEffectDead,
  countCorpMultiIceInstallOrderOptimized,
} from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";

export function summarizeCorpIcePortfolioMetrics(
  summaries: AiSimulationSummary[],
): Pick<AiMatchProgressionMetrics, CorpIcePortfolioMetricKey> {
  const entries = summaries.flatMap((summary) => summary.actionSequence);
  const numericValues = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number[] =>
    entries
      .map((entry) => entry[key])
      .filter((value): value is number => typeof value === "number");
  const maxNumber = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => {
    let maximum: number | undefined;
    for (const entry of entries) {
      const value = entry[key];
      if (typeof value === "number")
        maximum = maximum === undefined ? value : Math.max(maximum, value);
    }
    return maximum ?? 0;
  };
  const averageMetric = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => averageNumber(numericValues(key));
  const count = (
    key: keyof AiSimulationSummary["actionSequence"][number],
  ): number => entries.filter((entry) => entry[key] === true).length;
  return {
    corpHqIceCount: maxNumber("corpHqIceCount"),
    corpRndIceCount: maxNumber("corpRndIceCount"),
    corpArchivesIceCount: maxNumber("corpArchivesIceCount"),
    corpRemoteIceCount: maxNumber("corpRemoteIceCount"),
    corpHqUnrezzedIceCount: maxNumber("corpHqUnrezzedIceCount"),
    corpRndUnrezzedIceCount: maxNumber("corpRndUnrezzedIceCount"),
    corpCentralIceCount: maxNumber("corpCentralIceCount"),
    corpCentralUnrezzedIceCount: maxNumber("corpCentralUnrezzedIceCount"),
    corpCentralIceInstalled: count("corpCentralIceInstalled"),
    corpHqIceInstalled: count("corpHqIceInstalled"),
    corpRndIceInstalled: count("corpRndIceInstalled"),
    corpArchivesIceInstalled: count("corpArchivesIceInstalled"),
    corpRemoteIceInstalled: count("corpRemoteIceInstalled"),
    corpHqOverIced: count("corpHqOverIced"),
    corpRndOverIced: count("corpRndOverIced"),
    corpCentralOverIced: count("corpCentralOverIced"),
    corpCentralOverIcedWithoutPressure: count(
      "corpCentralOverIcedWithoutPressure",
    ),
    corpCentralOverIcedWithLowRezReserve: count(
      "corpCentralOverIcedWithLowRezReserve",
    ),
    corpHqFifthIceInstalled: count("corpHqFifthIceInstalled"),
    corpCentralIceDiminishingReturnInstall: count(
      "corpCentralIceDiminishingReturnInstall",
    ),
    corpCentralIceInstallSuppressedByDiminishingReturns: count(
      "corpCentralIceInstallSuppressedByDiminishingReturns",
    ),
    corpCentralIceInstallPenalizedByDiminishingReturns: count(
      "corpCentralIceInstallPenalizedByDiminishingReturns",
    ),
    corpRezReserveCredits: averageMetric("corpRezReserveCredits"),
    corpRezReserveDeficit: maxNumber("corpRezReserveDeficit"),
    corpInstalledIceWithoutRezReserve: count(
      "corpInstalledIceWithoutRezReserve",
    ),
    corpInstalledCentralIceWithoutRezReserve: count(
      "corpInstalledCentralIceWithoutRezReserve",
    ),
    corpInstalledRemoteIceWithoutRezReserve: count(
      "corpInstalledRemoteIceWithoutRezReserve",
    ),
    corpCanRezAtLeastOneCentralIce: count("corpCanRezAtLeastOneCentralIce"),
    corpCanRezAtLeastOneRemoteIce: count("corpCanRezAtLeastOneRemoteIce"),
    corpCannotRezAnyNewlyInstalledIce: count(
      "corpCannotRezAnyNewlyInstalledIce",
    ),
    corpCreditsBelowCheapestRelevantRez: count(
      "corpCreditsBelowCheapestRelevantRez",
    ),
    corpCreditsBelowEstimatedCentralRezNeed: count(
      "corpCreditsBelowEstimatedCentralRezNeed",
    ),
    corpHqProtectionJustifiedByAgendaFlood: count(
      "corpHqProtectionJustifiedByAgendaFlood",
    ),
    corpHqProtectionJustifiedByRunnerPressure: count(
      "corpHqProtectionJustifiedByRunnerPressure",
    ),
    corpRndProtectionJustifiedByRunnerPressure: count(
      "corpRndProtectionJustifiedByRunnerPressure",
    ),
    corpCentralOverIceBlockedByRunnerPressure: count(
      "corpCentralOverIceBlockedByRunnerPressure",
    ),
    corpCentralOverIceBlockedByAgendaFlood: count(
      "corpCentralOverIceBlockedByAgendaFlood",
    ),
    corpCentralOverIceBlockedByNoRemotePlan: count(
      "corpCentralOverIceBlockedByNoRemotePlan",
    ),
    corpRemoteScoringUnderbuiltWhileCentralsOverIced: count(
      "corpRemoteScoringUnderbuiltWhileCentralsOverIced",
    ),
    corpReadyRemoteExists: count("corpReadyRemoteExists"),
    corpAgendaInHqWithReadyRemote: count("corpAgendaInHqWithReadyRemote"),
    corpAgendaInHqWithoutReadyRemote: count("corpAgendaInHqWithoutReadyRemote"),
    corpExtraCentralIceChosenOverReadyRemoteBuild: count(
      "corpExtraCentralIceChosenOverReadyRemoteBuild",
    ),
    corpExtraCentralIceChosenOverEconomy: count(
      "corpExtraCentralIceChosenOverEconomy",
    ),
    corpExtraCentralIceChosenOverRezReserve: count(
      "corpExtraCentralIceChosenOverRezReserve",
    ),
    corpExtraCentralIceChosenOverAgendaInstall: count(
      "corpExtraCentralIceChosenOverAgendaInstall",
    ),
    corpExtraCentralIceChosenOverAdvanceOrScore: count(
      "corpExtraCentralIceChosenOverAdvanceOrScore",
    ),
    corpIcePortfolioFixGateEligible: count("corpIcePortfolioFixGateEligible"),
    corpIcePortfolioFixGateSuspiciousCentralOverIce: count(
      "corpIcePortfolioFixGateSuspiciousCentralOverIce",
    ),
    corpIcePortfolioFixGateBlockedByAgendaFlood: count(
      "corpIcePortfolioFixGateBlockedByAgendaFlood",
    ),
    corpIcePortfolioFixGateBlockedByRunnerCentralPressure: count(
      "corpIcePortfolioFixGateBlockedByRunnerCentralPressure",
    ),
    corpIcePortfolioFixGateBlockedByNoRemotePlan: count(
      "corpIcePortfolioFixGateBlockedByNoRemotePlan",
    ),
    corpIcePortfolioFixGateBlockedByEmergencyProtection: count(
      "corpIcePortfolioFixGateBlockedByEmergencyProtection",
    ),
  };
}

export function summarizeCorpFutureRunIceMetrics(
  summaries: readonly AiSimulationSummary[],
  actionSequence: AiSimulationSummary["actionSequence"],
) {
  const corpFutureRunIceEntries = actionSequence.filter(
    (entry) => entry.corpFutureRunIceInstalled === true,
  );
  return {
    corpFutureRunIceInstallOpportunities: actionSequence.filter(
      (entry) => entry.corpFutureRunIceInstallOpportunity === true,
    ).length,
    corpFutureRunIceInstalled: corpFutureRunIceEntries.length,
    corpFutureRunIceInstalledAsInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsInnermost === true,
    ).length,
    corpFutureRunIceInstalledAsOutermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsOutermost === true,
    ).length,
    corpFutureRunIceInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithLaterIce === true,
    ).length,
    corpFutureRunIceInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithoutLaterIce === true,
    ).length,
    corpFutureRunIceInstalledOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledFirstOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledFirstOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledAfterInnerIceExists:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpFutureRunIceInstalledAfterInnerIceExists === true,
      ).length,
    corpFutureRunIceInstalledAsDeadEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsDeadEffect === true,
    ).length,
    corpFutureRunIceInstalledAsLiveEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsLiveEffect === true,
    ).length,
    corpNextIceEffectInstalledLast: corpFutureRunIceEntries.filter(
      (entry) => entry.corpNextIceEffectInstalledLast === true,
    ).length,
    corpIceOrderFutureEffectDead: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectDead === true,
    ).length,
    corpIceOrderFutureEffectLive: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectLive === true,
    ).length,
    corpMultiIceInstallOrderFutureEffectDead: summaries.reduce(
      (sum, summary) =>
        sum +
        countCorpMultiIceInstallOrderFutureEffectDead(summary.actionSequence),
      0,
    ),
    corpMultiIceInstallOrderOptimized: summaries.reduce(
      (sum, summary) =>
        sum + countCorpMultiIceInstallOrderOptimized(summary.actionSequence),
      0,
    ),
    corpBallAndChainInstalledInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledInnermost === true,
    ).length,
    corpBallAndChainInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithoutLaterIce === true,
    ).length,
    corpBallAndChainInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithLaterIce === true,
    ).length,
    corpCanisInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpCanisInstalledWithoutLaterIce === true,
    ).length,
    corpBolterOrDataDartsInstalledWithoutNextIce:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpBolterOrDataDartsInstalledWithoutNextIce === true,
      ).length,
  };
}

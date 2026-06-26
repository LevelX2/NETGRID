import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { CorpIcePortfolioMetricKey } from "./corp-ice-portfolio-types";
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
    const values = numericValues(key);
    return values.length > 0 ? Math.max(...values) : 0;
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

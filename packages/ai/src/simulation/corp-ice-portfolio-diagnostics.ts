import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import { assessCorpIcePortfolioAction } from "../legacy/legacy-entrypoints";
import { isRemoteServerTarget } from "../runtime/server-target";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function corpIcePortfolioDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
): Partial<AiSimulationSummary["actionSequence"][number]> {
  if (input.side !== "corp" || action.side !== "corp") return {};
  const assessment = assessCorpIcePortfolioAction(input, action);
  const centralInstall =
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    (assessment.serverId === "hq" ||
      assessment.serverId === "rd" ||
      assessment.serverId === "archives");
  const remoteInstall =
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    typeof action.payload.serverId === "string" &&
    isRemoteServerTarget(action.payload.serverId);
  return {
    corpHqIceCount: assessment.hqIceCountBefore,
    corpRndIceCount: assessment.rndIceCountBefore,
    corpArchivesIceCount: assessment.archivesIceCountBefore,
    corpRemoteIceCount: assessment.remoteIceCountBefore,
    corpHqUnrezzedIceCount: assessment.hqUnrezzedIceCountBefore,
    corpRndUnrezzedIceCount: assessment.rndUnrezzedIceCountBefore,
    corpCentralIceCount: assessment.centralIceCountBefore,
    corpCentralUnrezzedIceCount: assessment.centralUnrezzedIceCountBefore,
    ...(centralInstall ? { corpCentralIceInstalled: true } : {}),
    ...(assessment.serverId === "hq" && centralInstall
      ? { corpHqIceInstalled: true }
      : {}),
    ...(assessment.serverId === "rd" && centralInstall
      ? { corpRndIceInstalled: true }
      : {}),
    ...(assessment.serverId === "archives" && centralInstall
      ? { corpArchivesIceInstalled: true }
      : {}),
    ...(remoteInstall ? { corpRemoteIceInstalled: true } : {}),
    ...(assessment.hqOverIced ? { corpHqOverIced: true } : {}),
    ...(assessment.rndOverIced ? { corpRndOverIced: true } : {}),
    ...(assessment.centralOverIced ? { corpCentralOverIced: true } : {}),
    ...(assessment.centralOverIcedWithoutPressure
      ? { corpCentralOverIcedWithoutPressure: true }
      : {}),
    ...(assessment.centralOverIcedWithLowRezReserve
      ? { corpCentralOverIcedWithLowRezReserve: true }
      : {}),
    ...(assessment.hqFifthIceInstalled
      ? { corpHqFifthIceInstalled: true }
      : {}),
    ...(assessment.centralIceDiminishingReturnInstall
      ? { corpCentralIceDiminishingReturnInstall: true }
      : {}),
    ...(assessment.centralIceInstallSuppressedByDiminishingReturns
      ? { corpCentralIceInstallSuppressedByDiminishingReturns: true }
      : {}),
    ...(assessment.centralIceInstallPenalizedByDiminishingReturns
      ? { corpCentralIceInstallPenalizedByDiminishingReturns: true }
      : {}),
    corpRezReserveCredits: assessment.corpCredits,
    corpRezReserveDeficit: assessment.rezReserveDeficit,
    ...(assessment.installedIceWithoutRezReserve
      ? { corpInstalledIceWithoutRezReserve: true }
      : {}),
    ...(assessment.installedCentralIceWithoutRezReserve
      ? { corpInstalledCentralIceWithoutRezReserve: true }
      : {}),
    ...(assessment.installedRemoteIceWithoutRezReserve
      ? { corpInstalledRemoteIceWithoutRezReserve: true }
      : {}),
    ...(assessment.canRezAtLeastOneCentralIce
      ? { corpCanRezAtLeastOneCentralIce: true }
      : {}),
    ...(assessment.canRezAtLeastOneRemoteIce
      ? { corpCanRezAtLeastOneRemoteIce: true }
      : {}),
    ...(assessment.cannotRezNewlyInstalledIce
      ? { corpCannotRezAnyNewlyInstalledIce: true }
      : {}),
    ...(assessment.creditsBelowCheapestRelevantRez
      ? { corpCreditsBelowCheapestRelevantRez: true }
      : {}),
    ...(assessment.creditsBelowEstimatedCentralRezNeed
      ? { corpCreditsBelowEstimatedCentralRezNeed: true }
      : {}),
    ...(assessment.hqProtectionJustifiedByAgendaFlood
      ? { corpHqProtectionJustifiedByAgendaFlood: true }
      : {}),
    ...(assessment.hqProtectionJustifiedByRunnerPressure
      ? { corpHqProtectionJustifiedByRunnerPressure: true }
      : {}),
    ...(assessment.rndProtectionJustifiedByRunnerPressure
      ? { corpRndProtectionJustifiedByRunnerPressure: true }
      : {}),
    ...(assessment.centralOverIceBlockedByRunnerPressure
      ? { corpCentralOverIceBlockedByRunnerPressure: true }
      : {}),
    ...(assessment.centralOverIceBlockedByAgendaFlood
      ? { corpCentralOverIceBlockedByAgendaFlood: true }
      : {}),
    ...(assessment.centralOverIceBlockedByNoRemotePlan
      ? { corpCentralOverIceBlockedByNoRemotePlan: true }
      : {}),
    ...(assessment.remoteScoringUnderbuiltWhileCentralsOverIced
      ? { corpRemoteScoringUnderbuiltWhileCentralsOverIced: true }
      : {}),
    ...(assessment.readyRemoteExists ? { corpReadyRemoteExists: true } : {}),
    ...(assessment.agendaInHqWithReadyRemote
      ? { corpAgendaInHqWithReadyRemote: true }
      : {}),
    ...(assessment.agendaInHqWithoutReadyRemote
      ? { corpAgendaInHqWithoutReadyRemote: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverReadyRemoteBuild
      ? { corpExtraCentralIceChosenOverReadyRemoteBuild: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverEconomy
      ? { corpExtraCentralIceChosenOverEconomy: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverRezReserve
      ? { corpExtraCentralIceChosenOverRezReserve: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverAgendaInstall
      ? { corpExtraCentralIceChosenOverAgendaInstall: true }
      : {}),
    ...(assessment.extraCentralIceChosenOverAdvanceOrScore
      ? { corpExtraCentralIceChosenOverAdvanceOrScore: true }
      : {}),
    ...(assessment.fixGateEligible
      ? { corpIcePortfolioFixGateEligible: true }
      : {}),
    ...(assessment.fixGateSuspiciousCentralOverIce
      ? { corpIcePortfolioFixGateSuspiciousCentralOverIce: true }
      : {}),
    ...(assessment.fixGateBlockedByAgendaFlood
      ? { corpIcePortfolioFixGateBlockedByAgendaFlood: true }
      : {}),
    ...(assessment.fixGateBlockedByRunnerCentralPressure
      ? { corpIcePortfolioFixGateBlockedByRunnerCentralPressure: true }
      : {}),
    ...(assessment.fixGateBlockedByNoRemotePlan
      ? { corpIcePortfolioFixGateBlockedByNoRemotePlan: true }
      : {}),
    ...(assessment.fixGateBlockedByEmergencyProtection
      ? { corpIcePortfolioFixGateBlockedByEmergencyProtection: true }
      : {}),
    corpIcePortfolioEvidence: assessment.evidence,
  };
}

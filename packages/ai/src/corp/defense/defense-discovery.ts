import { corpProgramTrashDefenseSignals } from "./program-trash-signal";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  corpCandidateProjectsCardDraw,
  exactCurrentBasicCorpDrawCandidate,
} from "../../runtime/corp-draw-action-facts";
import {
  corpMissingConcreteDefenseDrawNeed,
  corpMissingConcreteScoreDefenseDrawNeed,
  corpOptionalDrawAttemptedInEventTailThisTurn,
} from "../../runtime/corp-economy/corp-defensive-draw";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { corpRestrictedRezPreparationCandidates } from "../../runtime/corp-restricted-credit-reserve";
import { technicalIdCompare, turnKey } from "../../runtime/runtime-identifiers";
import {
  candidateIsVisibleCorpIceInstall,
  candidateTargetIds,
  isCorpInstallServerId,
  isServerId,
  requireVisibleCandidateSource,
  serverForInstalledCard,
  visibleKnownCardType,
} from "../../runtime/visible-action-facts";
import { archivesHasVisibleKnownAgenda } from "../../runtime/visible-server-agenda-facts";
import { corpDrawCandidatePreservesHandCapacity } from "../hand-management/hand-overflow";
import { corpScoreFundingMilestone } from "../score/corp-score-funding";
import { corpScorePriorityClass } from "../score/corp-score-priority";
import {
  compareCorpScoreProtectionProjects,
  corpScoreHorizonCertificationIsCurrent,
} from "../score/score-project-signals";
import {
  corpScoreProjectNeedsProtectionMaturity,
  corpScoreProtectionIsSatisfied,
  corpScoreRemainingAdvancementClicks,
} from "../score/score-protection-needs";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import {
  corpGlobalDefenseInstallRoute,
  corpQualitativeIceStagingSignal,
} from "./corp-defense-domain-signals";
import { corpRemoteHasBoundedStagedIce } from "./corp-defense-layer-certification";
import { assessCorpExactIceRezAgainstScoreReserves } from "./corp-defense-score-reserve";
import { corpRestrictedRezDefenseSignals } from "./corp-restricted-rez-defense";
import { corpIceInstallCostSupportSignals } from "./corp-ice-install-cost-support";
import {
  corpScoreProtectionHasMaterialImmediateLiquidityAlternative,
  corpScoreProtectionInstallRouteScan,
  corpScoreProtectionStagingInstallSignal,
} from "./corp-score-protection-routes";
import { corpAgendaPurgeDefenseChoiceSignal } from "./defense-choice-signals";
import {
  CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
  corpCardRoutePreservesScoreReserve,
  corpDefensiveUpgradePlacement,
  corpLayeredIceStagingParent,
  corpResidentDelayedSuccessDefenseSignals,
  corpSelectedCentralDirectInstallRouteState,
  corpTerminalCentralRezReserveSignals,
  corpTurnCommitmentContainsExactAgendaAdvance,
  mergeDefenseSignals,
} from "./defense-discovery-support";
import {
  corpResidentCentralDefenseHqHoldState,
  corpResidentDefenseDrawAttempt,
} from "./defense-memory";
import {
  corpExactCardRezSupportAssessment,
  corpFutureEncounterRezSupportAssessment,
  corpIceRezSupportOperationSignal,
  corpPostPassIceLifecycleDefenseSignal,
  corpRezEstablishesPersistentDefenseSupport,
  corpRunDefenseAbilityAssessment,
  corpVisibleHandHasActionIceRezSupport,
} from "./defense-run-response";

export function buildCorpDefenseNeeds({
  input,
  terminalRezReserveSignals,
  candidates,
  scoreProjects,
  centralDefenseAllocation,
  exactScoreProtectionInstallActionIds,
  remoteProjects,
  deferredLastClickScoreProject,
  exactLastClickLiquidityHeadAvailable,
  selectedScoreProtectionSignals,
  scorePlanPrecedesRedundantCapacityDefense,
  scoreProtectionProjects,
  exactExecutableScoreProjectAvailable,
  ambushes,
  defenseDrawSignals,
  consumedDefenseDrawSignals,
  agendaPurgeDefenseChoice,
  classicDeflectorDefenseChoice,
}: {
  input: AiDecisionInput;
  terminalRezReserveSignals: CorpGenericDefenseSignal[];
  candidates: readonly ActionSemanticCandidate[];
  scoreProjects: CorpScoreProjectSignal[];
  centralDefenseAllocation: CorpCentralDefenseAllocation | undefined;
  exactScoreProtectionInstallActionIds: Set<string>;
  remoteProjects: CorpCorePlanDomain["remoteProjects"];
  deferredLastClickScoreProject: CorpScoreProjectSignal | undefined;
  exactLastClickLiquidityHeadAvailable: boolean;
  selectedScoreProtectionSignals: CorpDefenseSignal[];
  scorePlanPrecedesRedundantCapacityDefense: (serverId: "hq" | "rd") => boolean;
  scoreProtectionProjects: CorpScoreProjectSignal[];
  exactExecutableScoreProjectAvailable: boolean;
  ambushes: CorpPlanDomain["ambushes"];
  defenseDrawSignals: CorpDefenseSignal[];
  consumedDefenseDrawSignals: CorpDefenseSignal[];
  agendaPurgeDefenseChoice: CorpGenericDefenseSignal | undefined;
  classicDeflectorDefenseChoice: CorpGenericDefenseSignal | undefined;
}) {
  const mergedDefenseNeeds: CorpCorePlanDomain["defenseNeeds"] =
    mergeDefenseSignals([
      ...corpResidentDelayedSuccessDefenseSignals(input),
      ...terminalRezReserveSignals,
      ...candidates.flatMap((candidate): CorpDefenseSignal[] => {
        const postPassIceLifecycle = corpPostPassIceLifecycleDefenseSignal(
          input,
          candidate,
        );
        if (postPassIceLifecycle) return [postPassIceLifecycle];
        const defensiveUpgradePlacement = corpDefensiveUpgradePlacement(
          input,
          candidate,
          scoreProjects,
          centralDefenseAllocation,
        );
        if (defensiveUpgradePlacement?.signal) {
          return [defensiveUpgradePlacement.signal];
        }
        const iceRezSupport = corpIceRezSupportOperationSignal(
          input,
          candidate,
          centralDefenseAllocation,
          scoreProjects,
        );
        if (iceRezSupport) return [iceRezSupport];
        if (candidateIsVisibleCorpIceInstall(input, candidate)) {
          if (exactScoreProtectionInstallActionIds.has(candidate.actionId)) {
            return [];
          }
          const serverId = candidateTargetIds(candidate).find(
            isCorpInstallServerId,
          );
          if (!serverId || !candidate.sourceDefinitionId) return [];
          const residentRemoteProtectionProject = remoteProjects.find(
            (project) =>
              project.need?.capability === "improve_remote_protection_path",
          );
          if (
            serverId.startsWith("remote_") &&
            residentRemoteProtectionProject !== undefined &&
            residentRemoteProtectionProject.serverId !== serverId
          ) {
            return [];
          }
          const route = corpGlobalDefenseInstallRoute(
            input,
            candidate,
            serverId,
            centralDefenseAllocation,
            CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
          );
          const remoteProtectionParent =
            residentRemoteProtectionProject?.serverId === serverId
              ? residentRemoteProtectionProject
              : undefined;
          const boundRemoteProtectionParent =
            remoteProtectionParent && candidate.sourceCardInstanceId
              ? remoteProtectionParent
              : undefined;
          if (
            route?.progressKind === "agenda_capacity_defense_conversion" &&
            deferredLastClickScoreProject !== undefined &&
            exactLastClickLiquidityHeadAvailable
          ) {
            return [];
          }
          const selectedScoreProtectionPrecedesAdditionalCentralLayer =
            (serverId === "hq" || serverId === "rd") &&
            selectedScoreProtectionSignals.length > 0 &&
            !(
              centralDefenseAllocation?.status === "known" &&
              centralDefenseAllocation.selectedServerId === serverId &&
              centralDefenseAllocation.evidence[serverId].threat === "material"
            ) &&
            (() => {
              const installedIceCount =
                input.playerView.servers.find(
                  (server) => server.id === serverId,
                )?.ice.length ?? 0;
              const centralThreat =
                centralDefenseAllocation?.status === "known"
                  ? centralDefenseAllocation.evidence[serverId].threat
                  : undefined;
              return (
                installedIceCount > 0 &&
                centralThreat !== "terminal" &&
                (centralThreat !== "acute" || installedIceCount >= 3)
              );
            })() &&
            centralDefenseAllocation?.status === "known" &&
            centralDefenseAllocation.evidence[serverId].threat !== "terminal";
          if (
            (serverId === "hq" || serverId === "rd") &&
            ((scorePlanPrecedesRedundantCapacityDefense(serverId) &&
              route?.progressKind === "agenda_capacity_defense_conversion") ||
              selectedScoreProtectionPrecedesAdditionalCentralLayer)
          ) {
            return [];
          }
          if (!route) {
            const layeredRemoteParent = corpLayeredIceStagingParent(
              scoreProtectionProjects,
              remoteProjects,
              serverId,
              corpScoreProtectionHasMaterialImmediateLiquidityAlternative(
                input,
                candidates,
              ),
              exactExecutableScoreProjectAvailable,
            );
            const coherentScorePlanPrecedesQualitativeStaging =
              (serverId === "hq" || serverId === "rd") &&
              scorePlanPrecedesRedundantCapacityDefense(serverId);
            const boundScoreProtectionPrecedesQualitativeStaging =
              selectedScoreProtectionSignals.length > 0;
            const protectedScoreProjectPrecedesQualitativeStaging =
              layeredRemoteParent === undefined &&
              scoreProjects.some(
                (project) =>
                  project.feasible &&
                  project.serverId !== undefined &&
                  project.serverId !== "new_remote" &&
                  corpScoreProtectionIsSatisfied(input, project),
              );
            const exactAlternativeExists = candidates.some(
              (alternative) =>
                alternative.actionId !== candidate.actionId &&
                candidateIsVisibleCorpIceInstall(input, alternative) &&
                candidateTargetIds(alternative).includes(serverId) &&
                corpGlobalDefenseInstallRoute(
                  input,
                  alternative,
                  serverId,
                  centralDefenseAllocation,
                  CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
                ) !== undefined,
            );
            const exactBoundDefenseAlternativeExists =
              input.playerView.servers.some(
                (candidateServer) =>
                  candidateServer.id === serverId &&
                  candidateServer.ice.length > 0,
              ) &&
              candidates.some((alternative) => {
                if (
                  alternative.actionId === candidate.actionId ||
                  !candidateIsVisibleCorpIceInstall(input, alternative)
                ) {
                  return false;
                }
                const alternativeServerId = candidateTargetIds(
                  alternative,
                ).find(isCorpInstallServerId);
                return (
                  alternativeServerId !== undefined &&
                  alternativeServerId !== serverId &&
                  corpGlobalDefenseInstallRoute(
                    input,
                    alternative,
                    alternativeServerId,
                    centralDefenseAllocation,
                    CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
                  ) !== undefined
                );
              });
            const qualitativeStaging =
              exactAlternativeExists ||
              (exactBoundDefenseAlternativeExists &&
                layeredRemoteParent === undefined) ||
              coherentScorePlanPrecedesQualitativeStaging ||
              boundScoreProtectionPrecedesQualitativeStaging ||
              protectedScoreProjectPrecedesQualitativeStaging
                ? undefined
                : corpQualitativeIceStagingSignal(
                    input,
                    candidate,
                    serverId,
                    centralDefenseAllocation,
                    CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
                    layeredRemoteParent,
                  );
            return qualitativeStaging ? [qualitativeStaging] : [];
          }
          const targetCentralThreat =
            centralDefenseAllocation?.status === "known" &&
            (serverId === "hq" || serverId === "rd")
              ? centralDefenseAllocation.evidence[serverId].threat
              : undefined;
          const targetCentralMissingCoverage =
            (serverId === "hq" || serverId === "rd") &&
            input.playerView.servers.some(
              (server) => server.id === serverId && server.ice.length === 0,
            );
          const selectedCentralServerId =
            centralDefenseAllocation?.status === "known"
              ? centralDefenseAllocation.selectedServerId
              : undefined;
          const selectedCentralServerHasNoRezzedIce =
            selectedCentralServerId !== undefined &&
            input.playerView.servers.some(
              (server) =>
                server.id === selectedCentralServerId &&
                server.ice.every((ice) => ice.rezzed !== true),
            );
          const boundedFallbackCoveragePressure =
            targetCentralMissingCoverage &&
            selectedCentralServerId !== undefined &&
            serverId !== selectedCentralServerId &&
            centralDefenseAllocation?.status === "known" &&
            centralDefenseAllocation.evidence[selectedCentralServerId]
              .threat === "material" &&
            selectedCentralServerHasNoRezzedIce;
          const centralPressure =
            serverId === "hq" || serverId === "rd"
              ? targetCentralThreat === "acute" ||
                targetCentralThreat === "terminal" ||
                (targetCentralThreat === "material" &&
                  (targetCentralMissingCoverage ||
                    selectedCentralServerId === serverId))
                ? targetCentralThreat
                : boundedFallbackCoveragePressure
                  ? "material"
                  : undefined
              : undefined;
          const visibleAgendaExposure =
            serverId === "archives" && archivesHasVisibleKnownAgenda(input);
          const unfundedOrdinaryCentralStaging =
            (serverId === "hq" || serverId === "rd") &&
            input.playerView.own.credits === 0 &&
            (route.rezFundingGap ?? 0) > 0 &&
            targetCentralThreat === undefined &&
            !visibleAgendaExposure &&
            !scoreProjects.some(
              (project) =>
                project.feasible ||
                project.terminalScore ||
                project.conversion?.runnerStealIsMatchpoint === true,
            );
          if (unfundedOrdinaryCentralStaging) return [];
          const terminalCentralInstallIsImmediatelyRelevant =
            centralPressure === "terminal" &&
            (route.progressKind === "engine_certified_access" ||
              (typeof route.rezFundingGap === "number" &&
                route.rezFundingGap <= 3) ||
              input.playerView.servers.some(
                (server) => server.id === serverId && server.ice.length < 3,
              ));
          return [
            {
              kind: "generic",
              defenseId: `install:${serverId}:${candidate.actionId}`,
              serverId,
              phase: boundRemoteProtectionParent
                ? ("install_defense_support" as const)
                : ("install_ice" as const),
              sourceDefinitionIds: [candidate.sourceDefinitionId],
              actionIds: [candidate.actionId],
              ...(boundRemoteProtectionParent?.need
                ? {
                    parentKind: "remote" as const,
                    parentProjectId: boundRemoteProtectionParent.projectId,
                    parentNeedId: boundRemoteProtectionParent.need.needId,
                    sourceCardInstanceId: candidate.sourceCardInstanceId,
                  }
                : {}),
              urgent:
                terminalCentralInstallIsImmediatelyRelevant ||
                visibleAgendaExposure,
              ...(centralPressure ? { centralPressure } : {}),
              ...(centralPressure === undefined &&
              route.progressKind === "scoreline_central_tax_allocation"
                ? { centralPressure: "material" as const }
                : {}),
              immediateInstallSupport:
                route.disposition === "productive" &&
                route.progressKind === "staged_central_defense" &&
                route.rezFundingGap > 0 &&
                corpVisibleHandHasActionIceRezSupport(input),
              installRoute: route,
              value:
                route.progressKind === "engine_certified_access"
                  ? 12
                  : route.progressKind === "funded_structured_central_defense"
                    ? 11
                    : route.progressKind === "scoreline_central_tax_allocation"
                      ? 10
                      : route.progressKind === "score_material_capacity_release"
                        ? 10
                        : route.progressKind ===
                            "agenda_capacity_defense_conversion"
                          ? 10
                          : route.progressKind === "staged_central_defense"
                            ? 9
                            : 1,
              evidenceCode:
                route.disposition === "funding_only"
                  ? `corp_defense_exact_route_funding_required:${serverId}:${candidate.actionId}`
                  : route.progressKind === "scoreline_central_tax_allocation"
                    ? `corp_scoreline_central_tax_allocation:${serverId}:${candidate.actionId}`
                    : route.progressKind === "score_material_capacity_release"
                      ? `corp_score_material_capacity_release:${serverId}:${candidate.actionId}`
                      : route.progressKind ===
                          "agenda_capacity_defense_conversion"
                        ? `corp_agenda_capacity_defense_conversion:${serverId}:${candidate.actionId}`
                        : route.progressKind === "staged_central_defense"
                          ? `corp_staged_central_defense:${serverId}:${candidate.actionId}:rez_gap_${route.rezFundingGap}`
                          : visibleAgendaExposure
                            ? "engine_certified_visible_agenda_exposure_defense"
                            : "engine_certified_global_defense_access_probability_reduced",
            },
          ];
        }
        if (candidate.semanticActionType === "corp_window.rez") {
          const visibleSource = requireVisibleCandidateSource(input, candidate);
          const targetId = candidate.sourceCardInstanceId;
          const rezServerId =
            (targetId ? serverForInstalledCard(input, targetId) : undefined) ??
            candidateTargetIds(candidate).find(isServerId) ??
            input.playerView.run?.attackedServerId ??
            "unknown";
          const sourceType = visibleKnownCardType(input, visibleSource);
          const persistentDefenseSupport =
            sourceType === "upgrade" &&
            corpRezEstablishesPersistentDefenseSupport(
              input,
              candidate,
              rezServerId,
            );
          const futureEncounterDefenseSupport =
            sourceType === "upgrade" && visibleSource
              ? corpFutureEncounterRezSupportAssessment(
                  input,
                  candidate,
                  visibleSource,
                  rezServerId,
                )
              : undefined;
          const exactCardRezSupportWithoutReserve =
            sourceType !== "ice"
              ? corpExactCardRezSupportAssessment(
                  input,
                  candidate,
                  visibleSource,
                  rezServerId,
                )
              : undefined;
          const exactCardRezReserve = exactCardRezSupportWithoutReserve
            ? corpCardRoutePreservesScoreReserve(
                input,
                candidate,
                rezServerId,
                scoreProjects,
              )
            : undefined;
          const exactCardRezSupport =
            exactCardRezSupportWithoutReserve?.productive === true &&
            exactCardRezReserve?.preservesReserve !== true
              ? {
                  ...exactCardRezSupportWithoutReserve,
                  productive: false,
                  value: 0,
                  evidenceCode: `corp_rez_exact_card_support_breaks_score_reserve:${exactCardRezReserve?.requiredCreditsAfterAction ?? "unknown"}`,
                }
              : exactCardRezSupportWithoutReserve;
          if (
            sourceType !== "ice" &&
            !persistentDefenseSupport &&
            futureEncounterDefenseSupport?.productive !== true &&
            exactCardRezSupport?.productive !== true
          ) {
            return [];
          }
          if (persistentDefenseSupport)
            return [
              {
                kind: "generic",
                defenseId: `rez-defense-support:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: false,
                rezWindowVerdict: "productive" as const,
                value: 120,
                evidenceCode: "corp_rez_persistent_server_defense_support",
              },
            ];
          if (futureEncounterDefenseSupport?.productive)
            return [
              {
                kind: "generic",
                defenseId: `rez-future-encounter-support:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: true,
                rezWindowVerdict: "productive" as const,
                value: 140,
                evidenceCode: futureEncounterDefenseSupport.evidenceCode,
              },
            ];
          if (exactCardRezSupport?.productive)
            return [
              {
                kind: "generic",
                defenseId: `rez-exact-card-support:${targetId ?? candidate.actionId}`,
                serverId: exactCardRezSupport.serverId,
                phase: "rez_response" as const,
                sourceDefinitionIds: visibleSource.definitionId
                  ? [visibleSource.definitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: input.playerView.run !== undefined,
                rezWindowVerdict: "productive" as const,
                value: exactCardRezSupport.value,
                evidenceCode: exactCardRezSupport.evidenceCode,
              },
            ];
          const exactIceRezRoute =
            sourceType === "ice"
              ? projectExactCorpIceRezRoute({
                  input,
                  candidate,
                  sourceCard: visibleSource,
                  targetServerId: rezServerId,
                  bluffDefenseNeed: ambushes.find(
                    (ambush) =>
                      ambush.serverId === rezServerId &&
                      ambush.defenseNeed?.iceInstanceId ===
                        visibleSource.instanceId,
                  )?.defenseNeed,
                })
              : undefined;
          const scoreReserveAdmission = exactIceRezRoute
            ? assessCorpExactIceRezAgainstScoreReserves({
                input,
                route: exactIceRezRoute,
                scoreProjects,
              })
            : undefined;
          const productiveIceRezRoute =
            exactIceRezRoute && scoreReserveAdmission?.preservesReserve
              ? exactIceRezRoute
              : undefined;
          if (sourceType === "ice" && !productiveIceRezRoute) {
            return [
              {
                kind: "generic",
                defenseId: `rez-nonproductive:${targetId ?? candidate.actionId}`,
                serverId: rezServerId,
                phase: "rez_response" as const,
                sourceDefinitionIds: candidate.sourceDefinitionId
                  ? [candidate.sourceDefinitionId]
                  : [],
                actionIds: [candidate.actionId],
                ...(targetId ? { targetIceInstanceId: targetId } : {}),
                urgent: false,
                rezWindowVerdict: "nonproductive" as const,
                ...(scoreReserveAdmission
                  ? { rezReserveAssessment: scoreReserveAdmission }
                  : {}),
                value: 0,
                evidenceCode: exactIceRezRoute
                  ? `corp_ice_rez_preserves_score_reserve_required:${scoreReserveAdmission?.requiredCreditsAfterRez ?? "unknown"}:opportunity:${scoreReserveAdmission?.opportunity.reason}:protected_servers:${scoreReserveAdmission?.opportunity.claims.map((c) => `${c.serverId}=${c.credits}`).join(",")}:unknown:${scoreReserveAdmission?.opportunity.unknownServerIds.join(",")}`
                  : "corp_ice_rez_resource_exchange_unknown",
              },
            ];
          }
          return [
            {
              kind: "generic",
              defenseId: `rez:${targetId ?? "unknown"}:${candidate.actionId}`,
              serverId: rezServerId,
              phase: "rez_response" as const,
              sourceDefinitionIds: candidate.sourceDefinitionId
                ? [candidate.sourceDefinitionId]
                : [],
              actionIds: [candidate.actionId],
              ...(targetId ? { targetIceInstanceId: targetId } : {}),
              urgent: input.playerView.run !== undefined,
              ...(scoreReserveAdmission
                ? { rezReserveAssessment: scoreReserveAdmission }
                : {}),
              ...(productiveIceRezRoute
                ? { rezRoute: productiveIceRezRoute }
                : {}),
              rezWindowVerdict: productiveIceRezRoute
                ? ("productive" as const)
                : ("open" as const),
              value: productiveIceRezRoute ? 1 : 0,
              evidenceCode: productiveIceRezRoute
                ? productiveIceRezRoute.routeKind === "trace_access_block"
                  ? `engine_certified_ice_rez_trace_access_block:${rezServerId}:${candidate.actionId}`
                  : productiveIceRezRoute.routeKind === "access_reduction"
                    ? `engine_certified_ice_rez_access_reduction:${rezServerId}:${candidate.actionId}`
                    : productiveIceRezRoute.routeKind ===
                        "exact_resource_exchange"
                      ? productiveIceRezRoute.resourceExchange
                          ?.layeredCentralPathTax === true
                        ? `engine_certified_ice_rez_layered_central_path_tax:${rezServerId}:tax_${productiveIceRezRoute.resourceExchange.runnerNormalCreditsLostOnAccessPath}:other_rezzed_${productiveIceRezRoute.resourceExchange.otherRezzedIceCount ?? 0}:${candidate.actionId}`
                        : `engine_certified_ice_rez_exact_resource_exchange:${rezServerId}:${candidate.actionId}`
                      : productiveIceRezRoute.routeKind ===
                          "free_persistent_defense"
                        ? `engine_certified_ice_rez_free_persistent_defense:${rezServerId}:${candidate.actionId}`
                        : productiveIceRezRoute.routeKind ===
                            "known_access_path_tax"
                          ? `engine_certified_ice_rez_known_access_path_tax:${rezServerId}:${productiveIceRezRoute.knownAccessPathTax ?? 0}:${candidate.actionId}`
                          : `engine_certified_ice_rez_qualitative_encounter_defense:${rezServerId}:${candidate.actionId}`
                : "visible_non_ice_rez_window",
            },
          ];
        }
        if (candidate.semanticActionType === "corp_window.decline_rez") {
          return [
            {
              kind: "generic",
              defenseId: `decline-rez:${candidate.actionId}`,
              serverId: input.playerView.run?.attackedServerId ?? "unknown",
              phase: "decline_rez" as const,
              sourceDefinitionIds: [],
              actionIds: [candidate.actionId],
              urgent: false,
              value: 0,
              evidenceCode: "visible_rez_window_decline",
            },
          ];
        }
        if (
          candidate.actionType === "continue_run" &&
          input.playerView.timingPoint === "run.encounter_ice" &&
          input.legalActions.some(
            (action) =>
              action.actionId === candidate.actionId &&
              action.side === "corp" &&
              action.source === "game_rule",
          )
        ) {
          return [
            {
              kind: "generic",
              defenseId: `pass-encounter:${candidate.actionId}`,
              serverId: input.playerView.run!.attackedServerId,
              phase: "pass_encounter" as const,
              sourceDefinitionIds: [],
              actionIds: [candidate.actionId],
              urgent: true,
              value: 0,
              evidenceCode: "corp_paid_encounter_window_pass",
            },
          ];
        }
        if (
          candidate.actionType === "activated_card_ability" ||
          candidate.semanticActionType === "card_ability.trigger" ||
          candidate.semanticActionType === "run.end_by_corp"
        ) {
          const assessment = corpRunDefenseAbilityAssessment(input, candidate);
          if (assessment?.productive) {
            return [
              {
                kind: "generic",
                defenseId: `activate-run-defense:${candidate.actionId}`,
                serverId: assessment.serverId,
                phase: "activate_run_defense" as const,
                sourceDefinitionIds: candidate.sourceDefinitionId
                  ? [candidate.sourceDefinitionId]
                  : [],
                actionIds: [candidate.actionId],
                urgent: true,
                value: assessment.value,
                evidenceCode: assessment.evidenceCode,
              },
            ];
          }
        }
        return [];
      }),
      ...selectedScoreProtectionSignals,
      ...corpRestrictedRezDefenseSignals(input, scoreProjects),
      ...defenseDrawSignals,
      ...consumedDefenseDrawSignals,
      ...(agendaPurgeDefenseChoice ? [agendaPurgeDefenseChoice] : []),
      ...(classicDeflectorDefenseChoice ? [classicDeflectorDefenseChoice] : []),
      ...corpProgramTrashDefenseSignals(input, candidates),
    ]);
  const genuineCurrentDefenseThreat = mergedDefenseNeeds.some(
    (signal) =>
      signal.kind === "generic" &&
      signal.urgent &&
      (signal.phase === "activate_run_defense" ||
        (signal.phase === "rez_response" &&
          signal.rezWindowVerdict === "productive")),
  );
  const defenseNeeds: CorpCorePlanDomain["defenseNeeds"] =
    mergedDefenseNeeds.map((signal) =>
      signal.kind === "generic" && signal.phase === "decline_rez"
        ? {
            ...signal,
            urgent: genuineCurrentDefenseThreat,
            evidenceCode: genuineCurrentDefenseThreat
              ? "visible_rez_window_decline_with_genuine_defense_threat"
              : [
                  "visible_rez_window_decline_without_defense_threat",
                  ...mergedDefenseNeeds.flatMap((need) =>
                    need.kind === "generic" &&
                    need.phase === "rez_response" &&
                    need.rezWindowVerdict === "nonproductive" &&
                    (need.rezReserveAssessment?.opportunity.reason ===
                      "funded_alternative_protection" ||
                      need.rezReserveAssessment?.opportunity.reason ===
                        "assessment_unknown")
                      ? [need.evidenceCode]
                      : [],
                  ),
                ].join(";"),
          }
        : signal,
    );
  defenseNeeds.push(
    ...corpIceInstallCostSupportSignals(input, candidates, defenseNeeds),
  );
  return { defenseNeeds };
}

export function buildCorpDefenseProtectionSignals({
  scoreProjects,
  input,
  residentScoreAgendaInstanceId,
  candidates,
  centralDefenseAllocation,
  previous,
  residentDrawAttempt,
  eventDrawAttempted,
  currentTurnKey,
  defenseDrawAttemptConsumed,
}: {
  scoreProjects: CorpScoreProjectSignal[];
  input: AiDecisionInput;
  residentScoreAgendaInstanceId: string | undefined;
  candidates: readonly ActionSemanticCandidate[];
  centralDefenseAllocation: CorpCentralDefenseAllocation | undefined;
  previous: ResidentPlanPortfolio | undefined;
  residentDrawAttempt: ReturnType<typeof corpResidentDefenseDrawAttempt>;
  eventDrawAttempted: boolean;
  currentTurnKey: string;
  defenseDrawAttemptConsumed: boolean;
}) {
  const scoreProtectionProjects = scoreProjects
    .filter(
      (project) =>
        project.terminalDefense === undefined &&
        !(
          project.routeAssessment ===
          "corp_resident_score_parent_dominates_sibling_route"
        ) &&
        project.protectionNeed !== undefined &&
        !corpScoreHorizonCertificationIsCurrent(input, project) &&
        (!corpScoreProtectionIsSatisfied(input, project) ||
          corpScoreProjectNeedsProtectionMaturity(project)) &&
        !(
          project.phase === "install_agenda" &&
          project.agendaInstanceId === residentScoreAgendaInstanceId &&
          project.serverId !== undefined &&
          project.serverId !== "new_remote" &&
          corpRemoteHasBoundedStagedIce(
            input,
            project.serverId,
            project.agendaPoints,
            corpScoreRemainingAdvancementClicks(input, project),
          )
        ),
    )
    .sort(compareCorpScoreProtectionProjects);
  const scoreProtectionRouteScans = scoreProtectionProjects.map((project) => ({
    project,
    scan: corpScoreProtectionInstallRouteScan(input, candidates, project),
  }));
  const hasResidentScoreProtectionProject = scoreProtectionProjects.some(
    (project) =>
      project.serverId !== undefined &&
      project.serverId !== "new_remote" &&
      project.phase !== "install_agenda" &&
      project.feasible,
  );
  for (const { project, scan } of scoreProtectionRouteScans) {
    // A future agenda in a not-yet-created remote must not preempt an
    // existing, resident score project. Without a resident project it remains
    // a valid score-protection route in its own right.
    if (
      project.serverId === "new_remote" &&
      hasResidentScoreProtectionProject
    ) {
      continue;
    }
    if (
      (project.fundingGap ?? 0) === 0 &&
      scan.fundingGap !== undefined &&
      scan.fundingGap > 0
    ) {
      project.fundingGap = scan.fundingGap;
      project.routeAssessment = "corp_score_protection_funding_gap";
      project.evidenceCode = `corp_score_protection_funding_gap:${project.serverId ?? "unbound"}:${scan.fundingGap}`;
    }
  }
  for (const project of scoreProjects) {
    const milestone = corpScoreFundingMilestone(
      project,
      input.playerView.own.credits,
    );
    if (milestone) project.fundingMilestone = milestone;
    else delete project.fundingMilestone;
  }
  const coherentScoreHandConversionAvailable =
    input.playerView.own.clicks >= 3 &&
    scoreProjects.some(
      (project) =>
        project.phase === "install_agenda" &&
        project.actionIds?.some((actionId) => {
          const action = input.legalActions.find(
            (legalAction) => legalAction.actionId === actionId,
          );
          const sourceCard = input.playerView.own.gripOrHq.find(
            (card) => card.instanceId === action?.source,
          );
          return (
            action?.type === "install_card" &&
            action.expiresAtStateVersion === input.playerView.stateVersion &&
            sourceCard?.known === true &&
            sourceCard.type === "agenda"
          );
        }) === true,
    );
  const exactExecutableScoreProjectAvailable = scoreProjects.some(
    (project) =>
      project.feasible &&
      project.actionIds?.some((actionId) =>
        input.legalActions.some(
          (action) =>
            action.actionId === actionId &&
            action.expiresAtStateVersion === input.playerView.stateVersion,
        ),
      ) === true,
  );
  const scorePlanPrecedesRedundantCapacityDefense = (
    serverId: "hq" | "rd",
  ): boolean =>
    (coherentScoreHandConversionAvailable ||
      exactExecutableScoreProjectAvailable) &&
    (input.playerView.servers.find((server) => server.id === serverId)?.ice
      .length ?? 0) > 0;
  const agendaCapacityDefenseConversionAvailable = candidates.some(
    (candidate) => {
      if (!candidateIsVisibleCorpIceInstall(input, candidate)) return false;
      const serverId = candidateTargetIds(candidate).find(
        isCorpInstallServerId,
      );
      if (serverId !== "hq" && serverId !== "rd") return false;
      if (scorePlanPrecedesRedundantCapacityDefense(serverId)) return false;
      return (
        corpGlobalDefenseInstallRoute(
          input,
          candidate,
          serverId,
          centralDefenseAllocation,
          CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
        )?.progressKind === "agenda_capacity_defense_conversion"
      );
    },
  );
  const selectedCentralDirectInstallRouteState =
    corpSelectedCentralDirectInstallRouteState(
      input,
      candidates,
      centralDefenseAllocation,
    );
  const selectedScoreProtectionSignals: CorpDefenseSignal[] =
    scoreProjects.flatMap((project) => {
      const defense = project.terminalDefense;
      const install = defense?.install;
      return defense && install
        ? [
            {
              kind: "score_protection_terminal_install" as const,
              defenseId: `terminal-protection:${project.projectId}:${install.actionId}`,
              serverId: defense.serverId,
              phase:
                install.placement === "ice"
                  ? ("install_ice" as const)
                  : ("install_defense_support" as const),
              parentProjectId: project.projectId,
              parentNeedId: defense.need.needId,
              delegatedPriorityClass: corpScorePriorityClass(project),
              actionId: install.actionId,
              sourceCardInstanceId: install.sourceCardInstanceId,
              sourceDefinitionId: install.sourceDefinitionId,
              evidenceCode: project.evidenceCode,
            },
          ]
        : [];
    });
  for (const { project, scan } of scoreProtectionRouteScans) {
    if (
      project.serverId === "new_remote" &&
      hasResidentScoreProtectionProject
    ) {
      continue;
    }
    if (
      project.feasible &&
      project.phase === "install_agenda" &&
      project.uncertainty?.currentActionScope === "exact_install_only" &&
      (project.fundingGap ?? 0) === 0
    ) {
      continue;
    }
    if (scan.productiveRoutes.length > 0) {
      selectedScoreProtectionSignals.push(
        ...scan.productiveRoutes.map(({ candidate, projection }) => ({
          kind: "score_protection_install" as const,
          defenseId: `score-protection-install:${project.projectId}:${candidate.actionId}`,
          serverId: projection.targetServerId,
          phase: "install_ice" as const,
          parentProjectId: project.projectId,
          parentNeedId: project.protectionNeed!.needId,
          delegatedPriorityClass: corpScorePriorityClass(project),
          actionId: candidate.actionId,
          sourceCardInstanceId: projection.sourceCardInstanceId,
          sourceDefinitionId: projection.sourceDefinitionId,
          effect: projection.effect,
          runnerAccessSuccessProbability:
            projection.after.protection.runnerAccessSuccessProbability,
          totalInstallAndRezCredits:
            projection.installCredits +
            projection.selectedRezCosts.reduce(
              (sum, selected) => sum + selected.credits,
              0,
            ),
          projection,
          evidenceCode: `score_protection_${projection.effect}:${project.projectId}:${projection.targetServerId}`,
        })),
      );
      break;
    }
    const stagingInstallSignal = candidates
      .flatMap((candidate) => {
        const signal = corpScoreProtectionStagingInstallSignal(
          input,
          candidate,
          project,
          scan,
          candidates,
        );
        if (!signal) return [];
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === signal.actionId,
        );
        const installCreditCost =
          action?.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ??
          Number.MAX_SAFE_INTEGER;
        const rezCreditCost =
          action?.payload?.postInstallRezQuoteComplete === true &&
          typeof action.payload.postInstallRezQuoteFinalCredits === "number"
            ? action.payload.postInstallRezQuoteFinalCredits
            : Number.MAX_SAFE_INTEGER;
        return [
          {
            signal,
            totalStagingCreditCost: installCreditCost + rezCreditCost,
          },
        ];
      })
      .sort(
        (left, right) =>
          left.totalStagingCreditCost - right.totalStagingCreditCost ||
          technicalIdCompare(left.signal.actionId, right.signal.actionId),
      )[0]?.signal;
    if (stagingInstallSignal) {
      selectedScoreProtectionSignals.push(stagingInstallSignal);
      break;
    }
    const protectionNeed = project.protectionNeed;
    if (!protectionNeed) continue;
    const drawSignals: CorpDefenseSignal[] = candidates.flatMap((candidate) => {
      if (!corpCandidateProjectsCardDraw(candidate)) return [];
      if (
        !corpDrawCandidatePreservesHandCapacity(input, candidate) &&
        candidate.semanticActionType !== "draw.card"
      ) {
        return [];
      }
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action) return [];
      const clickCost = candidate.costProfile.clickCost;
      const cardsDrawn = candidate.economyProjection?.cardsDrawn;
      const netHandDelta = candidate.economyProjection?.netHandDelta;
      const drawActionProjection = exactCurrentBasicCorpDrawCandidate(
        input,
        candidate,
      )
        ? ({
            knowledge: "known" as const,
            actionId: candidate.actionId,
            observedAtStateVersion: input.playerView.stateVersion,
            clickCost: 1,
            cardsDrawn: 1,
            netHandDelta: 1,
          } as const)
        : Number.isSafeInteger(clickCost) &&
            (clickCost ?? -1) >= 0 &&
            Number.isSafeInteger(cardsDrawn) &&
            (cardsDrawn ?? 0) > 0 &&
            Number.isSafeInteger(netHandDelta) &&
            (netHandDelta ?? -1) >= 0
          ? ({
              knowledge: "known" as const,
              actionId: candidate.actionId,
              observedAtStateVersion: input.playerView.stateVersion,
              clickCost: clickCost!,
              cardsDrawn: cardsDrawn!,
              netHandDelta: netHandDelta!,
            } as const)
          : ({ knowledge: "unknown" as const } as const);
      const deterministicParentContinuationActionId =
        project.phase === "advance_agenda" &&
        corpTurnCommitmentContainsExactAgendaAdvance(previous, project)
          ? project.actionIds?.find((actionId) =>
              input.legalActions.some(
                (legalAction) =>
                  legalAction.actionId === actionId &&
                  legalAction.type === "advance_card" &&
                  legalAction.expiresAtStateVersion ===
                    input.playerView.stateVersion,
              ),
            )
          : undefined;
      const need = corpMissingConcreteScoreDefenseDrawNeed({
        input,
        action,
        protectionNeed,
        directInstallRouteState: scan.directInstallRouteState,
        drawActionProjection,
        agendaCapacityDefenseConversionAvailable,
        ...(deterministicParentContinuationActionId
          ? {
              deterministicParentContinuationActionId,
            }
          : {}),
        attemptState: {
          residentAttemptedThisTurn: residentDrawAttempt !== undefined,
          eventTailAttemptedThisTurn: eventDrawAttempted,
        },
      });
      if (!need) return [];
      return [
        {
          kind: "score_protection_draw",
          defenseId: need.needId,
          serverId: need.serverId,
          phase: "draw_for_ice",
          parentProjectId: need.parentProjectId,
          parentNeedId: protectionNeed.needId,
          delegatedPriorityClass: corpScorePriorityClass(project),
          actionId: candidate.actionId,
          cleanupReplacementDraw: need.cleanupReplacementDraw,
          drawAttemptState: {
            turnKey: currentTurnKey,
            remainingAttempts: 1,
          },
          evidenceCode: `score_plan_requires_effective_ice_draw:${need.parentProjectId}:${need.serverId}`,
        },
      ];
    });
    if (drawSignals.length > 0) {
      selectedScoreProtectionSignals.push(...drawSignals);
      break;
    }
  }
  const terminalRezReserveSignals = corpTerminalCentralRezReserveSignals(
    input,
    centralDefenseAllocation,
    candidates,
  );
  const terminalRezPreparations = terminalRezReserveSignals.flatMap((need) =>
    need.targetIceInstanceId && need.rezReserveNeed
      ? corpRestrictedRezPreparationCandidates(input, candidates, {
          targetIceInstanceId: need.targetIceInstanceId,
          targetServerId: need.serverId,
          requiredRezCredits: need.rezReserveNeed.requiredCredits,
        })
      : [],
  );
  const defenseDrawSignals: CorpDefenseSignal[] = candidates.flatMap(
    (candidate) => {
      if (defenseDrawAttemptConsumed) return [];
      if (!corpCandidateProjectsCardDraw(candidate)) return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action) return [];
      const need = corpMissingConcreteDefenseDrawNeed(
        input,
        action,
        undefined,
        centralDefenseAllocation,
        selectedCentralDirectInstallRouteState,
        terminalRezPreparations,
      );
      if (!need) return [];
      return [
        {
          kind: "generic",
          defenseId: `draw-for-ice:${need.serverId}`,
          serverId: need.serverId,
          phase: "draw_for_ice" as const,
          sourceDefinitionIds: [],
          actionIds: [candidate.actionId],
          urgent: need.urgent,
          centralPressure: need.centralPressure,
          value: need.planValue,
          evidenceCode: `corp_missing_concrete_defense_draw:${need.serverId}`,
          drawAttemptState: {
            turnKey: currentTurnKey,
            remainingAttempts: 1,
          },
        },
      ];
    },
  );
  const exactScoreProtectionInstallActionIds = new Set(
    selectedScoreProtectionSignals.flatMap((signal) =>
      signal.kind === "score_protection_terminal_install" ||
      signal.kind === "score_protection_install" ||
      signal.kind === "score_protection_staging_install"
        ? [signal.actionId]
        : [],
    ),
  );
  return {
    terminalRezReserveSignals,
    exactScoreProtectionInstallActionIds,
    selectedScoreProtectionSignals,
    scorePlanPrecedesRedundantCapacityDefense,
    scoreProtectionProjects,
    exactExecutableScoreProjectAvailable,
    defenseDrawSignals,
  };
}

export function prepareCorpDefenseDiscovery({
  input,
  previous,
  candidates,
}: {
  input: AiDecisionInput;
  previous: ResidentPlanPortfolio | undefined;
  candidates: readonly ActionSemanticCandidate[];
}) {
  const currentTurnKey = turnKey(input);
  const centralDefenseHqHoldState = corpResidentCentralDefenseHqHoldState(
    previous,
    input,
  );
  const centralDefenseHqHoldCadence = centralDefenseHqHoldState.cadence;
  const centralDefenseHqHoldSelection = centralDefenseHqHoldState.selection;
  const centralDefenseAllocation = allocateCorpCentralDefenseFromAiFacts({
    input,
    hqHoldCadence: centralDefenseHqHoldCadence,
  });
  const agendaPurgeDefenseChoice = corpAgendaPurgeDefenseChoiceSignal(
    input,
    candidates,
    centralDefenseAllocation,
  );
  const residentDrawAttempt = corpResidentDefenseDrawAttempt(previous, input);
  const eventDrawAttempted =
    corpOptionalDrawAttemptedInEventTailThisTurn(input);
  const defenseDrawAttemptConsumed =
    residentDrawAttempt !== undefined || eventDrawAttempted;
  const consumedDefenseDrawSignals: CorpDefenseSignal[] =
    defenseDrawAttemptConsumed
      ? [
          {
            kind: "generic",
            defenseId: `optional-draw-attempt:${currentTurnKey}`,
            serverId: residentDrawAttempt?.serverId ?? "unknown",
            phase: "draw_for_ice",
            sourceDefinitionIds: [],
            actionIds: [],
            urgent: false,
            value: 0,
            evidenceCode:
              residentDrawAttempt !== undefined
                ? "corp_optional_defense_draw_attempt_resident"
                : "corp_optional_defense_draw_attempt_event_validation",
            drawAttemptState: {
              turnKey: currentTurnKey,
              remainingAttempts: 0,
              selectedAtStateVersion:
                residentDrawAttempt?.selectedAtStateVersion ??
                Math.max(0, input.playerView.stateVersion - 1),
            },
          },
        ]
      : [];
  return {
    centralDefenseAllocation,
    residentDrawAttempt,
    eventDrawAttempted,
    currentTurnKey,
    defenseDrawAttemptConsumed,
    consumedDefenseDrawSignals,
    agendaPurgeDefenseChoice,
    centralDefenseHqHoldCadence,
    centralDefenseHqHoldSelection,
  };
}
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";

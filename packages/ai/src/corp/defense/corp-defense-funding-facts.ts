import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { knownInstallRouteHasUsefulEffectBlockedByFunding } from "./corp-defense-domain-signals";
import {
  corpGenericDefensePriorityClass,
  genericDefenseFundingRequirement,
} from "../../plans/corp-defense-funding-contract";
import {
  corpEconomyCandidateHasExecutablePayload,
  immediateCorpLiquidCreditGain,
} from "../economy/economy-routes";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { corpRestrictedRezPreparationCandidates } from "../../runtime/corp-restricted-credit-reserve";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpBasicCreditsDominatedByCurrentScore } from "../score/score-conditional-credit-funding";
import { corpScoreRestoresRezReserveBeforeRunnerTurn } from "../score/score-reserve-restoration";

export function corpDefenseReserveNeeds(
  input: AiDecisionInput,
  defenseNeeds: readonly CorpDefenseSignal[],
  immediateFundingActionIds: string[],
  candidates: readonly ActionSemanticCandidate[],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpCorePlanDomain["economyNeeds"] {
  const dominatedCredits = corpBasicCreditsDominatedByCurrentScore(
    input,
    candidates,
    scoreProjects,
  );
  const retainedFundingActionIds = immediateFundingActionIds.filter(
    (actionId) => !dominatedCredits.has(actionId),
  );
  const priorityRank = { P2: 2, P3: 3, P5: 5, P6: 6 } as const;
  const productivePriorities = defenseNeeds.flatMap((need) =>
    need.kind === "generic" &&
    need.phase === "install_ice" &&
    need.installRoute?.disposition === "productive" &&
    need.installRoute.projection.effect !== "no_progress"
      ? [{ need, priority: corpGenericDefensePriorityClass([need]) }]
      : [],
  );
  return defenseNeeds.flatMap((need): CorpCorePlanDomain["economyNeeds"] => {
    if (need.kind !== "generic") return [];
    if (need.restrictedRezFunding) {
      return [
        {
          kind: "parent_funding" as const,
          needId: `defense-restricted-funding:${need.defenseId}`,
          parentNeedId: need.defenseId,
          parentPlanInstanceId: planInstanceIdForProposal({
            moduleId: "corp.defend_servers",
            dedupeKey: "server-defense-portfolio",
          }),
          gap: need.restrictedRezFunding.gap,
          actionIds: need.restrictedRezFunding.quotes.map(
            (quote) => quote.request.payoutActionId,
          ),
          restrictedCreditFunding: need.restrictedRezFunding.quotes,
          parentPriorityClass: corpGenericDefensePriorityClass([need]),
          immediateDefenseConversion: true,
          urgentForScore: false,
          evidenceCode: need.evidenceCode,
        },
      ];
    }
    const fundingPriority = corpGenericDefensePriorityClass([need]);
    const stagedInstallFundingActionIds =
      need.phase === "install_ice" &&
      need.installRoute?.disposition === "productive" &&
      !need.installRoute.projection.funded
        ? retainedFundingActionIds.filter((actionId) => {
            const candidate = candidates.find((c) => c.actionId === actionId);
            const requirement = genericDefenseFundingRequirement(need);
            const clicks = candidate?.economyProjection?.clickCost;
            return (
              candidate !== undefined &&
              requirement !== undefined &&
              candidate.economyProjection?.reliability === "guaranteed" &&
              typeof clicks === "number" &&
              Number.isSafeInteger(clicks) &&
              clicks >= 0 &&
              clicks + need.installRoute!.projection.installClicks <=
                input.playerView.own.clicks &&
              immediateCorpLiquidCreditGain(candidate) >= requirement.gap &&
              corpEconomyCandidateHasExecutablePayload(input, candidate)
            );
          })
        : [];
    if (
      productivePriorities.some(
        (entry) =>
          !(stagedInstallFundingActionIds.length > 0 && entry.need === need) &&
          priorityRank[entry.priority] <= priorityRank[fundingPriority],
      )
    ) {
      return [];
    }
    const installProjection =
      need.phase === "install_ice" &&
      need.installRoute !== undefined &&
      ((need.installRoute.disposition === "funding_only" &&
        knownInstallRouteHasUsefulEffectBlockedByFunding(
          need.installRoute.projection,
        )) ||
        stagedInstallFundingActionIds.length > 0)
        ? need.installRoute.projection
        : undefined;
    const reserve =
      need.phase === "fund_rez_reserve" ? need.rezReserveNeed : undefined;
    const gap =
      (installProjection
        ? genericDefenseFundingRequirement(need)?.gap
        : undefined) ?? reserve?.fundingGap;
    const targetCredits =
      (reserve
        ? reserve.requiredCredits - (reserve.storedRestrictedCredits ?? 0)
        : undefined) ??
      (typeof gap === "number"
        ? input.playerView.own.credits + gap
        : undefined);
    const iceInstanceId =
      installProjection?.sourceCardInstanceId ?? need.targetIceInstanceId;
    if (
      typeof gap !== "number" ||
      !Number.isSafeInteger(gap) ||
      gap <= 0 ||
      typeof targetCredits !== "number" ||
      !Number.isSafeInteger(targetCredits) ||
      !iceInstanceId
    ) {
      return [];
    }
    // The reserve is needed at the next Runner window. Revalidate after
    // every real score step; its future payout cannot fund current costs.
    if (
      reserve?.observedAtStateVersion === input.playerView.stateVersion &&
      corpScoreRestoresRezReserveBeforeRunnerTurn(
        input,
        scoreProjects,
        targetCredits,
      )
    )
      return [];
    const restrictedCreditPreparations = reserve
      ? corpRestrictedRezPreparationCandidates(input, candidates, {
          targetIceInstanceId: iceInstanceId,
          targetServerId: need.serverId,
          requiredRezCredits: reserve.requiredCredits,
        })
      : [];
    const fundingActionIds =
      stagedInstallFundingActionIds.length > 0
        ? stagedInstallFundingActionIds
        : restrictedCreditPreparations.length > 0
          ? immediateFundingActionIds
          : retainedFundingActionIds;
    // Remaining clicks do not imply a current funding head: a mandatory
    // choice can suspend all credit actions inside corp_action.main.
    if (
      fundingActionIds.length === 0 &&
      restrictedCreditPreparations.length === 0
    )
      return [];
    if (dominatedCredits.size > 0 && fundingActionIds.length === 0) return [];
    return [
      {
        kind: "parent_funding",
        needId: `defense-reserve:${need.serverId}:${iceInstanceId}`,
        gap,
        actionIds: fundingActionIds,
        ...(restrictedCreditPreparations.length > 0
          ? { restrictedCreditPreparations }
          : {}),
        immediateDefenseConversion: true,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
        }),
        parentNeedId: need.defenseId,
        parentPriorityClass: fundingPriority,
        incrementalDefenseReserve: {
          targetCredits,
          serverId: need.serverId,
          iceInstanceId,
        },
        urgentForScore: false,
        evidenceCode: need.evidenceCode,
      },
    ];
  });
}

import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { currentCorpCreditObligation } from "../../plans/corp-credit-obligation";
import { corpTurnLiquidityDevelopmentNeed } from "./economy-domain-signals";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { uniqueBy } from "../../runtime/collection";
import { corpCandidatePreservesVoluntaryDrawHorizon } from "../../runtime/corp-draw-action-facts";
import { turnKey } from "../../runtime/runtime-identifiers";
import {
  assessCorpEconomyFundingRoute,
  corpEconomyActionIsOwned,
  corpEconomyCandidateHasExecutablePayload,
} from "./economy-routes";
import {
  corpEconomyDevelopmentCampaigns,
  corpImmediateOperationEconomyConversions,
  corpImmediateOperationThresholdPreparations,
  corpOptionalActionCapacityConversions,
  corpRequiredEconomyNeeds,
  corpVisibleCardEconomyWithdrawals,
} from "./economy-signals";

export function corpEconomyFundingActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): { immediateFundingActionIds: string[]; terminalFundingActionIds: string[] } {
  const executableFundingCandidates = candidates.filter(
    (candidate) =>
      corpEconomyActionIsOwned(candidate) &&
      corpEconomyCandidateHasExecutablePayload(input, candidate),
  );
  const immediateFundingActionIds = executableFundingCandidates
    .filter((candidate) =>
      corpCandidatePreservesVoluntaryDrawHorizon(input, candidate),
    )
    .map((candidate) => candidate.actionId);
  const terminalFundingActionIds = executableFundingCandidates.map(
    (candidate) => candidate.actionId,
  );
  return { immediateFundingActionIds, terminalFundingActionIds };
}

export function buildCorpEconomySignals({
  input,
  candidates,
  scoreProjects,
  defenseNeeds,
  remoteProjects,
  ambushes,
  punishCampaigns,
  immediateFundingActionIds,
  terminalFundingActionIds,
  previous,
  currentTurnKey,
  deferredLastClickScoreProject,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  scoreProjects: CorpCorePlanDomain["scoreProjects"];
  defenseNeeds: CorpCorePlanDomain["defenseNeeds"];
  remoteProjects: CorpCorePlanDomain["remoteProjects"];
  ambushes: CorpPlanDomain["ambushes"];
  punishCampaigns: CorpPlanDomain["punishCampaigns"];
  immediateFundingActionIds: string[];
  terminalFundingActionIds: string[];
  previous: ResidentPlanPortfolio | undefined;
  currentTurnKey: string;
  deferredLastClickScoreProject: CorpScoreProjectSignal | undefined;
}): CorpCorePlanDomain["economyNeeds"] {
  const requiredEconomyNeeds = corpRequiredEconomyNeeds(
    input,
    scoreProjects,
    defenseNeeds,
    remoteProjects,
    ambushes,
    punishCampaigns,
    immediateFundingActionIds,
    terminalFundingActionIds,
    candidates,
  );
  const operationThresholdPreparations =
    corpImmediateOperationThresholdPreparations(input, candidates);
  const genericTurnLiquidityDevelopment =
    operationThresholdPreparations.length === 0
      ? corpTurnLiquidityDevelopmentNeed(
          input,
          candidates,
          previous,
          currentTurnKey,
          {
            // Required needs can belong to inactive or currently
            // unmaterialized plans. Residual capacity remains discoverable;
            // the progress-root coverage contract rejects it fail-closed if
            // it would actually mask an active blocked Score/Remote root.
            admitResidualCapacity: true,
          },
        )
      : undefined;
  const turnLiquidityDevelopment =
    genericTurnLiquidityDevelopment && deferredLastClickScoreProject
      ? {
          ...genericTurnLiquidityDevelopment,
          evidenceCode: deferredLastClickScoreProject.evidenceCode,
        }
      : genericTurnLiquidityDevelopment;
  const unboundEconomyNeeds: CorpCorePlanDomain["economyNeeds"] = uniqueBy(
    [
      ...requiredEconomyNeeds,
      ...((): CorpCorePlanDomain["economyNeeds"] => {
        const due = currentCorpCreditObligation(input);
        if (due === undefined || input.playerView.own.credits >= due) return [];
        return [
          {
            kind: "reserve",
            needId: `mandatory-credit-obligation:${currentTurnKey}`,
            targetCredits: due,
            gap: due - input.playerView.own.credits,
            actionIds: terminalFundingActionIds.filter((id) =>
              candidates.some(
                (candidate) =>
                  candidate.actionId === id &&
                  candidate.economyProjection?.reliability === "guaranteed",
              ),
            ),
            priorityClass: "P1",
            mandatoryCreditObligation: {
              creditsDue: due,
              stateVersion: input.playerView.stateVersion,
            },
            urgentForScore: false,
            evidenceCode: "corp_engine_quoted_terminal_credit_obligation",
          },
        ];
      })(),
      ...(turnLiquidityDevelopment ? [turnLiquidityDevelopment] : []),
      ...operationThresholdPreparations,
      ...corpImmediateOperationEconomyConversions(input, candidates),
      ...corpVisibleCardEconomyWithdrawals(input, candidates),
      ...corpOptionalActionCapacityConversions(input, candidates),
      ...corpEconomyDevelopmentCampaigns(input, candidates, scoreProjects),
    ],
    (signal) => signal.needId,
  );
  const economyNeeds: CorpCorePlanDomain["economyNeeds"] =
    unboundEconomyNeeds.map((signal) => {
      if (signal.kind === "parent_funding" && signal.restrictedCreditFunding)
        return signal;
      if (
        signal.kind === "develop_campaign" ||
        signal.kind === "convert_immediate_operation" ||
        signal.kind === "convert_visible_card_payout" ||
        signal.kind === "prepare_immediate_operation" ||
        signal.kind === "develop_liquidity" ||
        signal.kind === "resolve_start_rez_choice" ||
        signal.kind === "resolve_optional_action_capacity_offer"
      )
        return signal;
      const fundingRouteAssessment = assessCorpEconomyFundingRoute(
        {
          input,
          actionCandidates: candidates,
          turnKey: turnKey(input),
        },
        signal,
      );
      return {
        ...signal,
        actionIds: [
          ...(fundingRouteAssessment.headActionId
            ? [fundingRouteAssessment.headActionId]
            : []),
          ...(signal.kind === "parent_funding"
            ? (signal.restrictedCreditPreparations ?? []).map(
                (preparation) => preparation.actionId,
              )
            : []),
        ],
        fundingRouteAssessment,
      };
    });
  return economyNeeds;
}

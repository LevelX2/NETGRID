import { corpEconomyCandidateHasExecutablePayload } from "../economy/economy-routes";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";

import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { uniqueBy } from "../../runtime/collection";
import { corpHostedCreditBankProfile } from "../../runtime/corp-canonical-card-facts";
import { corpCandidateProjectsCardDraw } from "../../runtime/corp-draw-action-facts";
import {
  corpReservedScoreServerIds,
  CorpScoreAccelerationSetupBinding,
} from "../../runtime/corp-scoreline/score-hand-support";
import {
  candidateIsVisibleCorpAgendaInstall,
  candidateIsVisibleCorpIceInstall,
} from "../../runtime/visible-action-facts";
import { corpDefinitionSupportsPunishPlan } from "../punish/punish-signals";
import {
  corpDrawCandidatePreservesHandCapacity,
  corpHqOverflowCandidateIsExactCurrentConversion,
  corpHqOverflowResolutionSignal,
} from "./hand-overflow";

export function corpEmptyRdDrawOperationDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (
    corpEconomyCandidateHasExecutablePayload(input, candidate) ||
    candidate.actionType !== "play_operation" ||
    !candidate.sourceDefinitionId ||
    CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId]?.type !== "operation"
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const drawCardsAmount = Number(action?.payload?.drawCardsAmount ?? 0);
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const definitionRequiresDraw =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "draw" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true;
  return drawCardsAmount > 0 && definitionRequiresDraw
    ? `corp_empty_rd_draw_operation_has_no_executable_payload:${candidate.sourceDefinitionId}`
    : undefined;
}

function corpCardDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
  economyNeeds: CorpCorePlanDomain["economyNeeds"],
  defenseDispositionActionIds: ReadonlySet<string>,
  scoreSetupBinding: CorpScoreAccelerationSetupBinding | undefined,
  scoreProjects: readonly CorpScoreProjectSignal[],
  hasDefensePlacement: (candidate: ActionSemanticCandidate) => boolean,
): CorpPlanDomain["handManagement"] {
  const reservedScoreServerIds = corpReservedScoreServerIds(
    input,
    scoreProjects,
  );
  return uniqueBy(
    candidates.flatMap((candidate): CorpPlanDomain["handManagement"] => {
      if (defenseDispositionActionIds.has(candidate.actionId)) {
        return [];
      }
      const exactOverflowConversion =
        input.playerView.own.gripOrHq.length >
          input.playerView.own.maxHandSize &&
        corpHqOverflowCandidateIsExactCurrentConversion(
          input,
          candidate,
          reservedScoreServerIds,
        );
      if (
        !candidate.sourceDefinitionId ||
        !candidate.sourceCardInstanceId ||
        (![
          "install.card",
          "play.corp_operation",
          "card_ability.trigger",
          "economy.gain_credit",
          "draw.card",
        ].includes(candidate.semanticActionType) &&
          !exactOverflowConversion)
      ) {
        return [];
      }
      if (corpEmptyRdDrawOperationDispositionEvidence(input, candidate)) {
        return [];
      }
      if (
        candidate.actionCapacityProjection?.kind === "future_recurring_gain"
      ) {
        return [];
      }
      if (
        corpCandidateProjectsCardDraw(candidate) &&
        !corpDrawCandidatePreservesHandCapacity(input, candidate)
      ) {
        return [];
      }
      const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
      const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
      const sourceCard = input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      );
      if (!sourceCard) return [];
      if (hasDefensePlacement(candidate)) return [];
      const ownedByPunishPlan = corpDefinitionSupportsPunishPlan(
        candidate.sourceDefinitionId,
      );
      const economyRole =
        hint?.roles?.includes("economy") === true ||
        hint?.planRoles?.includes("remote_asset_economy") === true ||
        corpHostedCreditBankProfile(candidate.sourceDefinitionId) !==
          undefined ||
        hint?.effects?.some((effect) =>
          [
            "economy",
            "action_economy",
            "start_of_turn_economy",
            "recurring_economy",
          ].includes(effect.kind),
        ) === true;
      const ownedByEconomyPlan = economyNeeds.some(
        (signal) =>
          (signal.kind === "develop_campaign" ||
            signal.kind === "convert_immediate_operation" ||
            signal.kind === "convert_visible_card_payout" ||
            signal.kind === "prepare_immediate_operation") &&
          signal.actionIds.includes(candidate.actionId),
      );
      if (
        roles.some((role) => role.includes("ambush")) ||
        candidateIsVisibleCorpAgendaInstall(input, candidate) ||
        ownedByEconomyPlan ||
        ownedByPunishPlan
      ) {
        return [];
      }
      if (exactOverflowConversion) {
        return [
          {
            handPlanId: `overflow-admissible:${candidate.sourceCardInstanceId}:${candidate.actionId}`,
            phase: "develop_card" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            sourceInstanceId: candidate.sourceCardInstanceId,
            actionIds: [candidate.actionId],
            exactActionRoute: true,
            agendaCount,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            concretePurposeCode:
              "Expose this exact known non-agenda hand conversion only to the finite HQ-overflow parent.",
            value: Math.max(
              economyRole ? 40 : 10,
              (candidate.economyProjection?.netLiquidCreditGain ?? 0) * 10,
            ),
            evidenceCode: `corp_hq_overflow_admissible_current_conversion:${candidate.sourceDefinitionId}`,
          },
        ];
      }
      if (candidateIsVisibleCorpIceInstall(input, candidate)) {
        return [];
      }
      if (
        scoreSetupBinding?.setupNeed.actionId === candidate.actionId &&
        scoreSetupBinding.setupNeed.sourceCardInstanceId ===
          candidate.sourceCardInstanceId &&
        scoreSetupBinding.setupNeed.sourceDefinitionId ===
          candidate.sourceDefinitionId
      ) {
        const parentPlanInstanceId = planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: scoreSetupBinding.parent.projectId,
        });
        return [
          {
            handPlanId: scoreSetupBinding.setupNeed.needId,
            parentPlanInstanceId,
            parentNeedId: scoreSetupBinding.setupNeed.needId,
            phase: "develop_card" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            sourceInstanceId: candidate.sourceCardInstanceId,
            actionIds: [candidate.actionId],
            exactActionRoute: true,
            agendaCount,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            concretePurposeCode: `Install ${candidate.sourceDefinitionId} as the exact current setup step for score parent ${scoreSetupBinding.parent.projectId}, then observe and revalidate.`,
            priorityClass: "P5" as const,
            value: 100,
            evidenceCode: `corp_score_acceleration_campaign_setup:${candidate.sourceDefinitionId}:${scoreSetupBinding.parent.projectId}`,
          },
        ];
      }
      return [];
    }),
    (signal) => signal.handPlanId,
  );
}

export function buildCorpHandManagementSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  ownAgendas: number,
  economyNeeds: CorpCorePlanDomain["economyNeeds"],
  defenseDispositionActionIds: ReadonlySet<string>,
  scoreSetupBinding: CorpScoreAccelerationSetupBinding | undefined,
  scoreProjects: readonly CorpScoreProjectSignal[],
  previous: ResidentPlanPortfolio | undefined,
  hasDefensePlacement: (candidate: ActionSemanticCandidate) => boolean,
): CorpPlanDomain["handManagement"] {
  const cardDevelopmentSignals = corpCardDevelopmentSignals(
    input,
    candidates,
    ownAgendas,
    economyNeeds,
    defenseDispositionActionIds,
    scoreSetupBinding,
    scoreProjects,
    hasDefensePlacement,
  );
  const hqOverflowResolution = corpHqOverflowResolutionSignal(
    input,
    candidates,
    ownAgendas,
    previous,
    cardDevelopmentSignals,
    scoreProjects,
  );
  const hqOverflowActionIds = new Set(hqOverflowResolution?.actionIds ?? []);
  const handManagement: CorpPlanDomain["handManagement"] = [
    ...(hqOverflowResolution ? [hqOverflowResolution] : []),
    ...cardDevelopmentSignals.filter(
      (signal) =>
        !signal.evidenceCode.startsWith(
          "corp_hq_overflow_admissible_current_conversion:",
        ) &&
        !signal.actionIds?.some((actionId) =>
          hqOverflowActionIds.has(actionId),
        ),
    ),
  ];
  return handManagement;
}

import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { semanticRuntimeCorpEffectiveDefenseContext } from "../semantic-runtime-corp-effective-defense";
import { type CorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
} from "../corp-upgrade-placement";
import { rolesMatch } from "../role-match";
import type { SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import { corpConditionalScoreEconomyComponent } from "./semantic-runtime-corp-score-conditional-economy";
import {
  corpSameTurnScoreCloseoutComponent,
  corpScoreableAgendaAdvancePenaltyComponent,
  visibleSourceCardForAction,
  semanticRuntimeCorpActionCreditCost,
} from "./semantic-runtime-corp-score-action-economy";
import {
  corpHqAgendaReliefScorelineContext,
  corpNonAgendaRootBlocksScoreRemoteComponent,
  corpPunishPrimarySpeculativeScorelineDampenComponent,
} from "./semantic-runtime-corp-score-hq-pressure";
import {
  corpDownstreamRezReserveAssessment,
  corpInstallServerId,
  corpPostPassIceLifecycleComponent,
  corpRootRezTimingComponent,
} from "./semantic-runtime-corp-score-ice-components";
import {
  addCorpScoringWindowEvidenceComponent,
  corpPersistentInstallDiscountSequenceComponent,
} from "./semantic-runtime-corp-score-install-sequencing";
import { corpExistingScoreRemotePipelineComponent } from "./semantic-runtime-corp-score-active-remote";
import {
  corpCentralOvericeRemoteUnderbuildComponent,
  corpLowValueInstallDeferComponent,
  corpMatchpointHqProtectionComponent,
  corpReserveScoreComponent,
} from "./semantic-runtime-corp-score-scoreline-components";

export function corpActionFamilyScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: CorpBoardTriage,
  activeScoreRemoteFunding: AiDecisionScoreComponent | undefined,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  if (action.type === "score_agenda") {
    components.push({
      key: "corp_score_available_agenda",
      label: "Agenda punkten",
      value: 1200,
      reason: "score_agenda",
    });
    const conditionalScoreEconomy = corpConditionalScoreEconomyComponent(
      input,
      action,
    );
    if (conditionalScoreEconomy) components.push(conditionalScoreEconomy);
    const safetyGate = dependencies.corpScoreNowSafetyGate(input, action);
    if (!safetyGate.allowed) {
      components.push({
        key: "corp_scoreline_safety_gate_blocks_doctrine",
        label: "Scoreline-Safety",
        value: -900,
        reason: safetyGate.evidence.join("|"),
      });
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
  }
  if (action.type === "advance_card") {
    components.push({
      key: "corp_advance_score_line",
      label: "Advance-Linie",
      value: 600,
      reason: "advance_card",
    });
    const remoteScore = dependencies.corpAdvanceRemoteScore(input, action);
    if (remoteScore !== 0) {
      components.push({
        key: "corp_advance_remote_context",
        label: "Remote-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_penalty",
          "Remote-Rez-Floor",
          -2400,
          rezFloor.evidence,
        ),
      );
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
    const sameTurnCloseout = corpSameTurnScoreCloseoutComponent(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
    );
    if (sameTurnCloseout) components.push(sameTurnCloseout);
    const scoreableAdvancePenalty = corpScoreableAgendaAdvancePenaltyComponent(
      input,
      action,
    );
    if (scoreableAdvancePenalty) components.push(scoreableAdvancePenalty);
  }
  if (action.type === "rez_ice" || action.type === "rez_card") {
    const rezCost = semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    );
    components.push({
      key: "corp_rez_affordability",
      label: "Rez-Kosten zahlbar",
      value: credits >= rezCost ? 750 : -1200,
      reason: `credits:${credits};cost:${rezCost}`,
    });
    const sourceCard = visibleSourceCardForAction(input, action);
    const persistentInstallDiscountSequence =
      corpPersistentInstallDiscountSequenceComponent(
        input,
        action,
        sourceCard,
        actionSemanticCandidate,
        dependencies,
        boardTriageState,
      );
    if (persistentInstallDiscountSequence) {
      components.push(persistentInstallDiscountSequence);
    }
    const rootRezTiming = corpRootRezTimingComponent(input, action, sourceCard);
    if (rootRezTiming) components.push(rootRezTiming);
    const effectiveDefense =
      !sourceCard || sourceCard.type === "ice"
        ? semanticRuntimeCorpEffectiveDefenseContext(
            input,
            action,
            actionSemanticCandidate,
            { actionCreditCost: dependencies.actionCreditCost },
          )
        : undefined;
    if (
      effectiveDefense?.hasImmediateStopPotential ||
      effectiveDefense?.hasMeaningfulTaxOrDamage
    ) {
      components.push({
        key: "corp_effective_defense_rez_value",
        label: "Wirksame Rez-Verteidigung",
        value: effectiveDefense.hasImmediateStopPotential ? 900 : 450,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.postRezAbilityAffordable === true) {
      components.push({
        key: "corp_effective_defense_post_rez_budget",
        label: "Post-Rez-Fähigkeitsbudget",
        value: effectiveDefense.requiresPostRezPaidAbility ? 350 : 0,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.zeroEffectRisk) {
      components.push({
        key: "corp_effective_defense_zero_effect_risk",
        label: "Rez ohne wirksame Verteidigung",
        value: -2600,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (
      effectiveDefense &&
      corpRezHasNegativeMarginalExchange(
        input,
        action,
        effectiveDefense,
        boardTriageState,
      )
    ) {
      components.push({
        key: "corp_effective_defense_negative_exchange",
        label: "Negativer marginaler Rez-Tausch",
        value: -3000,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    const downstreamReserve = corpDownstreamRezReserveAssessment(
      input,
      action,
      actionSemanticCandidate,
      dependencies,
      effectiveDefense,
    );
    if (downstreamReserve) components.push(downstreamReserve);
  }
  if (action.type === "decline_rez" && scopeId === "simple_rez") {
    const rezAlternatives = input.legalActions
      .filter((candidate) => candidate.type === "rez_ice")
      .map((candidate) => ({
        action: candidate,
        context: semanticRuntimeCorpEffectiveDefenseContext(
          input,
          candidate,
          undefined,
          { actionCreditCost: dependencies.actionCreditCost },
        ),
      }))
      .filter(
        (
          entry,
        ): entry is {
          action: LegalAction;
          context: NonNullable<typeof entry.context>;
        } => Boolean(entry.context),
      );
    if (
      rezAlternatives.length > 0 &&
      rezAlternatives.every(
        ({ action: rezAction, context }) =>
          context.zeroEffectRisk ||
          corpRezHasNegativeMarginalExchange(
            input,
            rezAction,
            context,
            boardTriageState,
          ),
      )
    ) {
      components.push({
        key: "corp_decline_inefficient_rez_value",
        label: "Ineffizientes Rez ablehnen",
        value: 1400,
        reason: rezAlternatives
          .flatMap(({ context }) => context.evidence)
          .join("|"),
      });
    }
  }
  const postPassIceLifecycle = corpPostPassIceLifecycleComponent(action);
  if (postPassIceLifecycle) components.push(postPassIceLifecycle);
  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    const upgradePlacement = corpUpgradeInstallPlacementComponent({
      input,
      action,
      roles,
      actionSemanticCandidate,
      sourceCard: visibleSourceCardForAction(input, action),
      serverId: corpInstallServerId(action),
    });
    if (upgradePlacement) components.push(upgradePlacement);
    const regionReplacement = corpRegionReplacementComponent({
      input,
      action,
      roles,
      actionSemanticCandidate,
      sourceCard: visibleSourceCardForAction(input, action),
      serverId: corpInstallServerId(action),
    });
    if (regionReplacement) components.push(regionReplacement);
    if (dependencies.corpActionIsScoreLine(input, action, roles)) {
      components.push({
        key: "corp_install_score_line",
        label: "Scoring-Aufbau",
        value: 550,
        reason: "score_line",
      });
      const punishPrimaryDampen =
        corpPunishPrimarySpeculativeScorelineDampenComponent(
          input,
          action,
          dependencies,
          roles,
          boardTriageState,
        );
      if (punishPrimaryDampen) components.push(punishPrimaryDampen);
    }
    const hqAgendaRelief = corpHqAgendaReliefScorelineContext(
      input,
      action,
      dependencies,
      roles,
      boardTriageState,
    );
    if (
      action.payload?.placement === "ice" ||
      rolesMatch(roles, ["ice", "protect"])
    ) {
      components.push({
        key: "corp_install_protection",
        label: "Schutz-Aufbau",
        value: 650,
        reason: "protect_role",
      });
    }
    const matchpointHqProtection = corpMatchpointHqProtectionComponent(
      input,
      action,
    );
    if (matchpointHqProtection) components.push(matchpointHqProtection);
    if (rolesMatch(roles, ["economy"])) {
      components.push({
        key: "corp_install_economy",
        label: "Economy-Aufbau",
        value: 500,
        reason: "economy_role",
      });
    }
    const remoteScore = dependencies.corpInstallRemoteScore(
      input,
      action,
      roles,
      actionSemanticCandidate,
    );
    if (remoteScore !== 0) {
      const adjustedRemoteScore = hqAgendaRelief
        ? Math.max(remoteScore, -350)
        : remoteScore;
      components.push({
        key: "corp_install_remote_context",
        label: "Installations-Kontext",
        value: adjustedRemoteScore,
        reason: hqAgendaRelief
          ? `${scopeId}|${hqAgendaRelief.evidence.join("|")}|remote_context_floor:-350`
          : scopeId,
      });
    }
    const rootPayloadPlan = corpNonAgendaRootBlocksScoreRemoteComponent(
      input,
      action,
      dependencies,
      roles,
    );
    if (rootPayloadPlan) components.push(rootPayloadPlan);
    const scoreRemotePipeline = corpExistingScoreRemotePipelineComponent(
      input,
      action,
      dependencies,
      roles,
      boardTriageState,
    );
    if (scoreRemotePipeline) components.push(scoreRemotePipeline);
    const lowValueInstallDefer = corpLowValueInstallDeferComponent(
      input,
      action,
      dependencies,
      roles,
      boardTriageState,
    );
    if (lowValueInstallDefer) components.push(lowValueInstallDefer);
    const centralOvericeRemoteUnderbuild =
      corpCentralOvericeRemoteUnderbuildComponent(
        input,
        action,
        boardTriageState,
      );
    if (centralOvericeRemoteUnderbuild) {
      components.push(centralOvericeRemoteUnderbuild);
    }
    if (hqAgendaRelief) components.push(hqAgendaRelief.component);
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action, roles),
    );
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_penalty",
          "Remote-Rez-Floor",
          -2400,
          rezFloor.evidence,
        ),
      );
    }
    const centralRezFloor = dependencies.corpCentralRezReserveAssessment(
      input,
      action,
    );
    if (centralRezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_central_rez_floor_penalty",
          "Zentrale Rez-Reserve",
          -4200,
          centralRezFloor.evidence,
        ),
      );
      components.push({
        key: "corp_central_unrezzable_ice_install_stop",
        label: "Unrezzbare Zentral-ICE-Installation",
        value: -500,
        reason: centralRezFloor.evidence.join("|"),
      });
    }
  }
  return components;
}

function corpRezHasNegativeMarginalExchange(
  input: AiDecisionInput,
  action: LegalAction,
  context: NonNullable<
    ReturnType<typeof semanticRuntimeCorpEffectiveDefenseContext>
  >,
  boardTriageState: CorpBoardTriage,
): boolean {
  if (
    context.hasImmediateStopPotential ||
    context.visibleBreakCost === undefined ||
    context.runnerCanAffordVisibleBreak !== true ||
    context.rezCost <= context.visibleBreakCost + context.rezCreditGain
  ) {
    return false;
  }
  const serverId = input.playerView.servers.find((server) =>
    server.ice.some((card) => card.instanceId === action.source),
  )?.id;
  const protectsCurrentPriority =
    serverId !== undefined &&
    boardTriageState.targetServerId === serverId &&
    (boardTriageState.severity === "high" ||
      boardTriageState.severity === "critical");
  return !protectsCurrentPriority;
}

export function corpActionCanResolveProfiledTrace(
  action: LegalAction,
): boolean {
  return !(
    action.type === "install_card" ||
    action.type === "advance_card" ||
    action.type === "score_agenda" ||
    action.type === "gain_credit" ||
    action.type === "draw_card" ||
    action.type === "end_turn"
  );
}

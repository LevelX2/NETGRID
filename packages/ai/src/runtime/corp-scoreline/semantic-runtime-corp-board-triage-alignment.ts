import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
} from "./semantic-runtime-corp-board-triage-contracts";
import {
  actionBuildsScoreRemote,
  actionCreatesPurgeActionDebt,
  actionDistractsFromCentralProtection,
  actionHasVisibleDrawSource,
  actionIsExpensiveNonProtection,
  actionIsOffTargetInstall,
  actionIsUnfundedTargetProtectionInstall,
  actionProvidesEconomy,
  actionRelievesHqAgendaPressureViaSafeRemote,
  actionServerIdForAction,
  actionUsesVisibleMatchpointAgenda,
  corpBoardTriageMismatchComponentValue,
  legalEconomyActionExists,
  normalizedCorpBoardTriageValue,
  triageIsActiveScorelineLock,
  triageIsEmergencyHqAgendaRemoteConversion,
  triageIsLastViableDeckoutMatchpoint,
  triageNeedsFunding,
  triageReason,
} from "./semantic-runtime-corp-board-triage-actions";
import {
  actionAcceleratesScoreline,
  actionClosesScoreNow,
  actionDelaysForcedScoreline,
  actionDelaysProtectedScoreRemote,
  actionKeepsSideSafeSameTurnScoreCloseoutForAction,
  actionProtectsServer,
  actionPushesConcreteAgendaScoreline,
  actionPushesUnsafeScoreline,
  sameTargetRezIsDefinitelyBad,
  sameTargetRezMissesCriticalCentralStop,
} from "./semantic-runtime-corp-board-triage-policies";

const TRIAGE_ALIGNMENT_BONUS = 850;
const TRIAGE_MISMATCH_HIGH = -4200;
const TRIAGE_MISMATCH_MEDIUM = -2200;

export function semanticRuntimeCorpBoardTriageActionComponentForTriage<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  triage: CorpBoardTriage,
): AiDecisionScoreComponent | undefined {
  if (triage.primary === "low_value") return undefined;
  const actionServerId = actionServerIdForAction(input, action);
  const alignment = corpBoardTriageActionAlignment(
    input,
    action,
    actionServerId,
    triage,
    dependencies,
    actionSemanticCandidate,
  );
  if (alignment === "match") {
    const rawValue =
      triage.severity === "critical"
        ? TRIAGE_ALIGNMENT_BONUS + 350
        : TRIAGE_ALIGNMENT_BONUS;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    return {
      key: "corp_board_triage_alignment",
      label: "Corp-Board-Triage",
      value: normalizedValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "match",
        rawValue,
        normalizedValue,
      ),
    };
  }
  if (alignment === "mismatch") {
    const rawValue =
      triage.severity === "low" || triage.severity === "medium"
        ? TRIAGE_MISMATCH_MEDIUM
        : TRIAGE_MISMATCH_HIGH;
    const normalizedValue = normalizedCorpBoardTriageValue(rawValue);
    const componentValue = corpBoardTriageMismatchComponentValue(
      input,
      triage,
      normalizedValue,
      action,
      actionServerId,
    );
    return {
      key: "corp_board_triage_mismatch",
      label: "Corp-Board-Triage",
      value: componentValue,
      reason: triageReason(
        triage,
        action,
        actionServerId,
        "mismatch",
        rawValue,
        normalizedValue,
        componentValue,
      ),
    };
  }
  return {
    key: "corp_board_triage_context",
    label: "Corp-Board-Triage",
    value: 0,
    reason: triageReason(triage, action, actionServerId, "neutral"),
  };
}

function corpBoardTriageActionAlignment<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): "match" | "mismatch" | "neutral" {
  switch (triage.primary) {
    case "score_now":
      return actionClosesScoreNow(input, action, dependencies) ||
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
        ? "match"
        : "mismatch";
    case "force_scoreline_clock": {
      const activeScorelineLock = triageIsActiveScorelineLock(triage);
      const emergencyRemoteConversion =
        triageIsEmergencyHqAgendaRemoteConversion(triage);
      const lastViableDeckoutMatchpoint =
        triageIsLastViableDeckoutMatchpoint(triage);
      const needsFunding =
        triage.requiredRezFloor !== undefined &&
        triage.currentCredits !== undefined &&
        triage.currentCredits < triage.requiredRezFloor;
      const legalEconomyAvailable = legalEconomyActionExists(input);
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionAcceleratesScoreline(actionSemanticCandidate) &&
        (!needsFunding || !legalEconomyAvailable)
      ) {
        return "match";
      }
      if (actionHasVisibleDrawSource(input, action, actionSemanticCandidate)) {
        return "mismatch";
      }
      if (
        actionPushesConcreteAgendaScoreline(input, action, dependencies) &&
        triage.targetServerId &&
        actionServerId &&
        actionServerId !== triage.targetServerId
      ) {
        return "mismatch";
      }
      if (actionPushesConcreteAgendaScoreline(input, action, dependencies)) {
        if (
          lastViableDeckoutMatchpoint &&
          actionUsesVisibleMatchpointAgenda(input, action) &&
          (!triage.targetServerId || actionServerId === triage.targetServerId)
        ) {
          return "match";
        }
        if (needsFunding && legalEconomyAvailable) {
          return "mismatch";
        }
        if (
          emergencyRemoteConversion &&
          (!triage.targetServerId || actionServerId === triage.targetServerId)
        ) {
          return "match";
        }
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return activeScorelineLock ? "mismatch" : "match";
      }
      if (
        needsFunding &&
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return lastViableDeckoutMatchpoint ? "mismatch" : "match";
      }
      return actionDelaysForcedScoreline(
        input,
        action,
        actionServerId,
        triage,
        dependencies,
        actionSemanticCandidate,
      )
        ? "mismatch"
        : "neutral";
    }
    case "protect_score_remote":
      if (
        actionKeepsSideSafeSameTurnScoreCloseoutForAction(
          input,
          action,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        actionServerId === triage.targetServerId &&
        (triage.severity === "high" || triage.severity === "critical")
      ) {
        const projectedProtection = dependencies.corpScoringWindowAssessment?.(
          input,
          action,
          dependencies.rolesForAction(input, action),
        );
        if (
          projectedProtection &&
          (projectedProtection.windowKind === "durable" ||
            projectedProtection.windowKind === "temporary_safe") &&
          !projectedProtection.runnerCanReachAccessBeforeScore &&
          !projectedProtection.runnerCanContestBeforeScore &&
          projectedProtection.corpCanRezRelevantIce !== false &&
          projectedProtection.corpCanRezFullPathWithDynamicReserve !== false
        ) {
          return "match";
        }
        return "mismatch";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage) ||
        actionDelaysProtectedScoreRemote(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
        ? "mismatch"
        : "neutral";
    case "fund_score_remote":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      if (
        triageNeedsFunding(triage) &&
        legalEconomyActionExists(input) &&
        actionIsUnfundedTargetProtectionInstall(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
        )
      ) {
        return "mismatch";
      }
      return actionCreatesPurgeActionDebt(action) ||
        actionPushesUnsafeScoreline(input, action, dependencies) ||
        actionIsOffTargetInstall(action, actionServerId, triage) ||
        actionIsExpensiveNonProtection(action, actionServerId, triage)
        ? "mismatch"
        : "neutral";
    case "protect_hq":
    case "protect_rd":
      if (
        triage.evidence.includes(
          "corp_board_triage_central_override:first_layer_before_speculative_remote",
        ) &&
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        actionRelievesHqAgendaPressureViaSafeRemote(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
        )
      ) {
        return "match";
      }
      if (
        actionProtectsServer(
          input,
          action,
          actionServerId,
          triage,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        actionServerId === triage.targetServerId &&
        (triage.severity === "high" || triage.severity === "critical")
      ) {
        return "mismatch";
      }
      if (
        action.type === "rez_ice" &&
        actionServerId === triage.targetServerId
      ) {
        return sameTargetRezIsDefinitelyBad(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        ) ||
          sameTargetRezMissesCriticalCentralStop(
            input,
            action,
            triage,
            dependencies,
            actionSemanticCandidate,
          )
          ? "mismatch"
          : "neutral";
      }
      return actionDistractsFromCentralProtection(
        action,
        actionServerId,
        triage,
      )
        ? "mismatch"
        : "neutral";
    case "recover_economy":
      if (
        actionProvidesEconomy(
          input,
          action,
          dependencies,
          actionSemanticCandidate,
        )
      ) {
        return "match";
      }
      if (action.type === "draw_card" && !legalEconomyActionExists(input)) {
        return "match";
      }
      return action.type === "advance_card" || action.type === "install_card"
        ? "mismatch"
        : "neutral";
    case "setup_score_remote":
      if (
        (action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          actionServerId === triage.targetServerId &&
          dependencies.corpActionIsScoreLine(
            input,
            action,
            dependencies.rolesForAction(input, action),
          )) ||
        actionBuildsScoreRemote({
          action,
          roles: dependencies.rolesForAction(input, action),
          serverId: actionServerId,
        })
      ) {
        return "match";
      }
      if (
        action.type === "install_card" &&
        actionServerId !== undefined &&
        actionServerId !== triage.targetServerId
      ) {
        return "mismatch";
      }
      return actionServerId === "archives" ? "mismatch" : "neutral";
    case "low_value":
      return "neutral";
  }
}

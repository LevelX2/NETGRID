import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunWindowSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerDefenseSignals } from "./defense-types";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerRunHasExactUrgency } from "../../run-analysis/runner-plan-run-funding";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import { runnerDrawProjectionFor } from "../../actions/action-economy-projection";
export function runnerDefenseSupportDispositions(
  defense: RunnerDefenseSignals,
  candidates: readonly ActionSemanticCandidate[],
  optionalProgramTrashInstallDispositionActionIds: ReadonlySet<string>,
): PlanActionDisposition[] {
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) =>
    result.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  for (const actionId of defense.defenseSupportRejectedInstallActionIds ?? []) {
    if (optionalProgramTrashInstallDispositionActionIds.has(actionId)) {
      continue;
    }
    add(
      actionId,
      "runner.defense_and_recovery",
      "runner_defense_support_install_deferred_no_current_need_or_constraint",
    );
  }
  if ((defense.defenseSupportInstallActionIds?.length ?? 0) > 0) {
    for (const candidate of candidates) {
      const evidenceCode =
        candidate.semanticActionType === "tag.remove"
          ? "runner_tag_removal_deferred_for_defense_support_install"
          : candidate.semanticActionType === "counter.remove_trace_tag" ||
              candidate.semanticActionType === "counter.remove_runner_hazard"
            ? "runner_persistent_hazard_counter_deferred_for_defense_support_install"
            : undefined;
      if (!evidenceCode) {
        continue;
      }
      add(candidate.actionId, "runner.defense_and_recovery", evidenceCode);
    }
  }
  return result;
}

export function runnerDefenseSafetyDispositions(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  signals: RunnerDefenseSignals;
  runWindows: readonly RunnerRunWindowSignal[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  terminalActionIds: ReadonlySet<string>;
  alreadyClassifiedActionIds: ReadonlySet<string>;
}): PlanActionDisposition[] {
  const {
    input,
    candidates,
    signals,
    runWindows,
    runTargets,
    terminalActionIds,
    alreadyClassifiedActionIds,
  } = params;
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) =>
    result.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  if (
    signals.optionalRunEnablesNextCorpPunish ||
    signals.nextCorpTurnGripPreservation
  ) {
    for (const candidate of candidates) {
      const id = candidate.actionId;
      if (
        alreadyClassifiedActionIds.has(id) ||
        terminalActionIds.has(id) ||
        signals.nextCorpTurnTagProtectionActionIds?.includes(id) ||
        (signals.defenseSupportInstallActionIds?.includes(id) &&
          !input.playerView.own.gripOrHq.some(
            (card) =>
              card.instanceId === candidate.sourceCardInstanceId &&
              (card.maxHandSizeBonus ?? 0) > 0,
          )) ||
        runWindows.some(
          (window) =>
            window.actionAssessments?.[id]?.binding ===
            "engine_restricted_run_sequence",
        )
      )
        continue;
      const targets = runTargets.filter((target) => target.actionId === id);
      if (targets.some((target) => runnerRunHasExactUrgency(input, target)))
        continue;
      if (
        signals.optionalRunEnablesNextCorpPunish &&
        targets.some(
          (target) =>
            target.recommendation === "run_if_free" ||
            target.runCommitment === "probe_only" ||
            target.accessPayoff === "known_low_value",
        )
      ) {
        add(
          id,
          "runner.defense_and_recovery",
          "runner_optional_run_would_enable_known_next_corp_turn_flatline",
        );
      } else if (runnerNextCorpTurnGripBlocksAction(input, candidate, signals)) {
        add(
          id,
          "runner.defense_and_recovery",
          "runner_last_action_would_lose_next_corp_turn_hand_buffer",
        );
      }
    }
  }
  if (signals.forgoUnsafeRunCapacity) {
    for (const candidate of candidates) {
      if (candidate.semanticActionType !== "run.start") continue;
      if (
        runWindows.some(
          (signal) =>
            signal.actionAssessments?.[candidate.actionId]?.binding ===
            "engine_restricted_run_sequence",
        )
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_restricted_run_capacity_below_required_hand_buffer",
      );
    }
  }
  for (const actionId of signals.confirmedDamageTaxedDrawActionIds ?? []) {
    if (alreadyClassifiedActionIds.has(actionId)) continue;
    add(
      actionId,
      "runner.defense_and_recovery",
      "runner_confirmed_damage_draw_tax_tag_unsafe",
    );
  }
  if (
    signals.activeTags > 0 &&
    (signals.tagClearFundingNeed !== undefined ||
      candidates.some(
        (candidate) => candidate.semanticActionType === "tag.remove",
      ))
  ) {
    for (const candidate of candidates) {
      if (
        candidate.semanticActionType !== "counter.remove_trace_tag" &&
        candidate.semanticActionType !== "counter.remove_runner_hazard"
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_persistent_hazard_counter_deferred_until_active_tag_removed",
      );
    }
  }
  return result;
}

export function runnerNextCorpTurnGripBlocksAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  signals: RunnerDefenseSignals,
): boolean {
  return (
    signals.nextCorpTurnGripPreservation === true &&
    signals.nextCorpTurnBufferTarget !== undefined &&
    signals.handSize + handDeltaForVoluntaryAction(input, candidate) <
      signals.nextCorpTurnBufferTarget
  );
}

function handDeltaForVoluntaryAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): number {
  const sourceInGrip = input.playerView.own.gripOrHq.some(
    (card) => card.instanceId === candidate.sourceCardInstanceId,
  );
  const handCardSpent =
    sourceInGrip &&
    (candidate.actionType === "install_card" ||
      candidate.actionType === "play_event")
      ? 1
      : 0;
  const projection = candidate.economyProjection;
  const action = input.legalActions.find(
    (legal) => legal.actionId === candidate.actionId,
  );
  // An exact search-to-Grip play opens a mandatory one-card selection. The
  // native offer certifies a target exists. This move is outside draw taxes.
  const searchReturn =
    handCardSpent === 1 &&
    action !== undefined &&
    isBoundSingleStackSearchPlay(input, candidate, action)
      ? 1
      : 0;
  const safeDraw =
    projection !== undefined &&
    (candidate.semanticActionType === "draw.card" ||
      projection.timing === "immediate") &&
    projection.reliability === "guaranteed"
      ? ((action && runnerDrawProjectionFor(action)?.projectedNetHandDelta) ??
        projection.netHandDelta + projection.cardsConsumed)
      : 0;
  let selfDamage = 0;
  for (const cost of candidate.costProfile.selfDamage ?? []) {
    if (typeof cost.amount !== "number") return -Infinity;
    selfDamage += cost.amount;
  }
  if (safeDraw <= 0) return searchReturn - handCardSpent - selfDamage;
  return (
    (action &&
    runnerDrawTaxLiabilityProjection(input, action, candidate)
      .projectedTagsAdded === 0
      ? safeDraw
      : 0) -
    handCardSpent -
    selfDamage
  );
}

function isBoundSingleStackSearchPlay(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  const { sourceCardInstanceId, sourceDefinitionId, abilityId, abilityKey } =
    candidate;
  if (
    action.type !== "play_event" ||
    action.side !== input.side ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.source !== sourceCardInstanceId ||
    candidate.abilityBindingMethod !== "canonical_capability_id" ||
    !sourceDefinitionId ||
    !abilityKey ||
    abilityId !== `${sourceDefinitionId}:${abilityKey}` ||
    action.abilityRef?.sourceCardInstanceId !== sourceCardInstanceId ||
    action.abilityRef?.sourceAbilityId !== abilityId ||
    !input.playerView.own.gripOrHq.some(
      (card) =>
        card.known &&
        card.instanceId === sourceCardInstanceId &&
        card.definitionId === sourceDefinitionId,
    )
  ) {
    return false;
  }
  const ability = cardSpecPlanningCardByDefinitionId(
    sourceDefinitionId,
  )?.planning.engine.abilities?.find((entry) => entry.capabilityKey === abilityKey);
  return (
    ability?.kind === "on_play" &&
    ability.effects.length === 1 &&
    ability.effects[0]?.kind === "search_stack_to_grip"
  );
}

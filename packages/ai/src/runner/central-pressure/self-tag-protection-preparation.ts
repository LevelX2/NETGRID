import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerPressureSignal } from "../../plans/runner-tactical-plan-contracts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import {
  assessRunnerRunAfterAccessPreparation,
  type RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { runnerCentralPressureRunCandidates } from "./central-pressure-plan-module";
import type {
  RunnerDefenseSignals,
  RunnerSelfTagPreventionNeed,
} from "../defense-recovery/defense-types";

function finiteOneTagCosts(card: VisibleCard): number[] {
  if (!card.known || !card.definitionId) return [];
  return (
    cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
      .tagPreventionSources ?? []
  ).flatMap((source) => {
    if (source.kind !== "avoid_tag" || source.amount !== 1) return [];
    if (source.cost.kind === "trash_source") return [0];
    return source.cost.kind === "credit_and_trash_source"
      ? [source.cost.amount]
      : [];
  });
}

/** Central publishes an exact preparation need; Defense owns its installation.
 * Only the cheaper complete same-turn line is admitted, with no speculative
 * future tag, new run authority or card-name exception. */
export function bindRunnerCentralSelfTagProtection(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  centralPressure: RunnerPressureSignal[];
  defense: RunnerDefenseSignals;
}): { centralPressure: RunnerPressureSignal[]; defense: RunnerDefenseSignals } {
  const { input, candidates, runTargets, centralPressure, defense } = params;
  const view = input.playerView;
  if (
    input.side !== "runner" ||
    view.run ||
    view.timingPoint !== "runner_action.main" ||
    view.own.tags > 0 ||
    defense.pendingDamage > 0 ||
    defense.damagePreventionNeeded ||
    defense.handSize < defense.minimumHandBuffer ||
    defense.tagClearFundingNeed ||
    defense.reactionReserveNeed ||
    defense.persistentHazardCounterRemovalAvailable ||
    defense.persistentHazardCounterFundingNeed ||
    defense.gripDamageReplacementBinding ||
    defense.discardChoiceBinding ||
    (defense.defenseSupportInstallActionIds?.length ?? 0) > 0
  )
    return { centralPressure, defense };
  const needs: RunnerSelfTagPreventionNeed[] = [];
  for (const parent of centralPressure) {
    if (
      !parent.reachable ||
      parent.priorityClass !== "P4" ||
      parent.routePreparation ||
      parent.supportNeedId ||
      parent.marginalValue <= 0
    )
      continue;
    const head = runnerCentralPressureRunCandidates(
      input,
      candidates,
      parent,
      runTargets,
    ).sort(
      (a, b) =>
        b.stepValue - a.stepValue ||
        a.candidate.actionId.localeCompare(b.candidate.actionId),
    )[0];
    const target = runTargets.find(
      (t) => t.actionId === head?.candidate.actionId,
    );
    if (
      !target ||
      !parent.runActionIds?.includes(target.actionId) ||
      (parent.runActionExclusions?.[target.actionId]?.length ?? 0) > 0 ||
      target.pathPassability !== "reachable" ||
      target.recommendation !== "run_now" ||
      target.unknownUnrezzedIceCount !== 0 ||
      (target.unavoidableVisibleIceHazardCount ?? 0) > 0
    )
      continue;
    if (
      (target.runActionProjection.accessReplacementRequiresCorpCredits ||
        target.runActionProjection
          .successfulRunRunnerCreditGainRequiresOpponentCredits) &&
      view.opponent.credits <= 0
    )
      continue;
    const server = view.servers.find((s) => s.id === target.targetServerId);
    if (!server || server.ice.some((ice) => !ice.known || !ice.rezzed))
      continue;
    const run = candidates.find((c) => c.actionId === target.actionId);
    const tags = run?.functionalEffects?.filter(
      (e) =>
        e.kind === "tag" &&
        e.scope === "runner" &&
        e.timing === "successful_run",
    );
    if (!run || tags?.length !== 1 || tags[0]?.amount !== 1) continue;
    const routes = input.legalActions
      .flatMap((install) => {
        const installCandidate = candidates.find(
          (c) => c.actionId === install.actionId,
        );
        if (
          install.type !== "install_card" ||
          install.side !== "runner" ||
          install.expiresAtStateVersion !== view.stateVersion ||
          install.timingPoint !== view.timingPoint ||
          install.choiceRequirements?.length ||
          !installCandidate ||
          installCandidate.costProfile.costKnownStatus !== "known" ||
          installCandidate.costProfile.additionalCosts.length > 0 ||
          (installCandidate.costProfile.selfDamage?.length ?? 0) > 0 ||
          (installCandidate.costProfile.selfTag ?? 0) > 0
        )
          return [];
        const source = view.own.gripOrHq.find(
          (c) => c.instanceId === install.source,
        );
        if (!source?.definitionId) return [];
        const credits = install.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
        const clicks = install.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
        if (
          !Number.isSafeInteger(credits) ||
          credits < 0 ||
          !Number.isSafeInteger(clicks) ||
          clicks < 0 ||
          clicks > 1
        )
          return [];
        return finiteOneTagCosts(source).flatMap((reactionCredits) => {
          const creditSaving = 2 - credits - reactionCredits;
          if (
            creditSaving <= 0 ||
            (view.own.rig ?? []).some((c) =>
              finiteOneTagCosts(c).some(
                (cost) => cost <= credits + reactionCredits,
              ),
            )
          )
            return [];
          const quote = assessRunnerRunAfterAccessPreparation({
            input,
            preparationActionId: install.actionId,
            runActionId: target.actionId,
            targetServerId: target.targetServerId,
          });
          const after = quote?.target,
            reserve = after?.prerunReserveQuote;
          const nativeRun = input.legalActions.find(
            (a) => a.actionId === target.actionId,
          );
          if (
            !quote ||
            !after ||
            !reserve ||
            !nativeRun ||
            after.pathPassability !== "reachable" ||
            after.recommendation !== "run_now" ||
            reserve.status === "blocked" ||
            after.creditsAfterRun < reactionCredits + reserve.requiredCredits ||
            quote.input.playerView.own.clicks <
              nativeRun.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) ||
            // Installation and event both leave the grip before access.
            quote.input.playerView.own.gripOrHq.length -
              (run.actionType === "play_event" ? 1 : 0) <
              Math.max(defense.minimumHandBuffer, reserve.requiredHandBuffer)
          )
            return [];
          return [{ install, source, creditSaving }];
        });
      })
      .sort(
        (a, b) =>
          b.creditSaving - a.creditSaving ||
          a.install.actionId.localeCompare(b.install.actionId),
      );
    const best = routes[0];
    if (!best) continue;
    needs.push({
      needId: `central-self-tag-prevention:${parent.pressureId}:${best.source.instanceId}`,
      parentPlanInstanceId: planInstanceIdForProposal({
        moduleId: "runner.pressure_central",
        dedupeKey: parent.pressureId,
      }),
      stateVersion: view.stateVersion,
      serverId: parent.serverId,
      runActionId: target.actionId,
      installActionId: best.install.actionId,
      sourceCardInstanceId: best.source.instanceId,
      sourceDefinitionId: best.source.definitionId!,
      creditSaving: best.creditSaving,
      parentValue: parent.marginalValue,
    });
  }
  const need = needs.sort(
    (a, b) =>
      b.parentValue - a.parentValue ||
      b.creditSaving - a.creditSaving ||
      a.needId.localeCompare(b.needId),
  )[0];
  if (!need) return { centralPressure, defense };
  return {
    centralPressure: centralPressure.map((parent) =>
      parent.serverId === need.serverId
        ? {
            ...parent,
            reachable: false,
            supportNeedId: need.needId,
            selfTagPreventionNeed: need,
            evidenceCode:
              "runner_central_same_turn_self_tag_prevention_required",
          }
        : parent,
    ),
    defense: {
      ...defense,
      selfTagPreventionNeed: need,
      defenseSupportInstallActionIds: [need.installActionId],
      defenseSupportRejectedInstallActionIds: (
        defense.defenseSupportRejectedInstallActionIds ?? []
      ).filter((id) => id !== need.installActionId),
      defenseSupportInstallValues: {
        ...defense.defenseSupportInstallValues,
        [need.installActionId]: need.parentValue,
      },
      evidenceCodes: [
        "runner_bound_self_tag_prevention_install",
        ...defense.evidenceCodes,
      ],
    },
  };
}

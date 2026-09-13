import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import {
  assessRandomBreakOrDamageRiskForVisibleRunPath,
  randomBreakOrDamageRiskCanCarryRunPath,
} from "../actions/risk-action-projection";
import { projectKnownRemoteTrashCommitment } from "../decision/known-remote-access-commitment";
import {
  isVisiblePayEndRunSubroutine,
  isVisibleDirectDamageSubroutine,
} from "../run-analysis/visible-subroutine-semantics";
import { currentEncounterUnbrokenSubroutineIndexes } from "./current-encounter";
import { currentEncounterRequiresDamagePreservingBreak } from "./current-encounter-damage";
import { runnerRigAfterEncounter } from "./runner-rig-after-encounter";
import { encounterRunRemainderEffectAssessment } from "./runner-run-remainder-effect-assessment";
import {
  isEndRunSubroutine,
  isUnacceptableImmediateSafetyThreatSubroutine,
  type VisibleEncounterSubroutine,
} from "./encounter-subroutine";
import {
  runnerEncounterPaymentForAction,
  spendRunnerEncounterActionCost,
  spendRunnerEncounterGeneralCost,
} from "./runner-encounter-credit-budget";
import type {
  RunnerEncounterActionConstraint,
  RunnerEncounterBreakAccessAssessment,
} from "./runner-encounter-action-exclusion";

type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;
type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerAccessPathContextDependencies = {
  breakSubroutineIndexesForAction: (action: LegalAction) => Set<number>;
  currentEncounteredIceCard: (
    input: AiDecisionInput,
  ) => VisibleCard | undefined;
  actionCreditCost: (action: LegalAction) => number;
  estimatedEncounterBreakCost: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  knownIcePathReason: (
    assessment: KnownIcePathAssessment,
    serverId: string,
  ) => string;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  definitionType: (definitionId: string) => string | undefined;
  remoteRootTrashCost: (
    card: VisibleServer["root"][number],
  ) => number | undefined;
};

export function createRunnerAccessPathContext(
  dependencies: RunnerAccessPathContextDependencies,
): {
  breakAccessPathAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEncounterBreakAccessAssessment;
  encounterRemotePayoffAfterBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ) => {
    blocksBreak: boolean;
    evidence: string[];
    constraint?: RunnerEncounterActionConstraint;
  };
} {
  const encounterRemotePayoffAfterBreakAssessment = (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ): {
    blocksBreak: boolean;
    evidence: string[];
    constraint?: RunnerEncounterActionConstraint;
  } => {
    if (!dependencies.isRemoteServerTarget(server.id))
      return { blocksBreak: false, evidence: [] };
    if (targetSubroutines.length <= 0)
      return { blocksBreak: false, evidence: [] };
    if (remainingCurrentEndRunAfterBreak > 0)
      return { blocksBreak: false, evidence: [] };
    if (
      targetSubroutines.some((subroutine) =>
        isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine),
      ) ||
      (currentEncounterRequiresDamagePreservingBreak(input) &&
        targetSubroutines.some(
          (subroutine) =>
            isVisibleDirectDamageSubroutine(subroutine) &&
            (subroutine.amount ?? 0) > 0,
        ))
    )
      return { blocksBreak: false, evidence: [] };
    if (!targetSubroutines.every(isEndRunSubroutine))
      return { blocksBreak: false, evidence: [] };

    const evidenceBase = [
      "encounter_remote_payoff_check:true",
      "encounter_remote_payoff_blocked:true",
      `encounter_remote_target:${server.id}`,
      `encounter_credits_after_access_path:${creditsAfterAccessPath}`,
    ];
    if (server.root.length === 0)
      return {
        blocksBreak: true,
        evidence: [...evidenceBase, "encounter_remote_payoff:no_root"],
      };

    const unknownRootCount = server.root.filter(
      (card) => !card.known || typeof card.definitionId !== "string",
    ).length;
    if (unknownRootCount > 0) return { blocksBreak: false, evidence: [] };

    const hasKnownAgenda = server.root.some((card) => {
      const definitionId = card.definitionId;
      return (
        card.known &&
        (card.type === "agenda" ||
          (definitionId !== undefined &&
            dependencies.definitionType(definitionId) === "agenda"))
      );
    });
    if (hasKnownAgenda) return { blocksBreak: false, evidence: [] };

    const hasAdvancedKnownRoot = server.root.some(
      (card) => card.known && (card.advancementCounters ?? 0) > 0,
    );
    if (hasAdvancedKnownRoot) return { blocksBreak: false, evidence: [] };

    const trashableRoots = server.root
      .flatMap((card) => {
        const type = card.definitionId
          ? dependencies.definitionType(card.definitionId)
          : card.type;
        const trashCost = dependencies.remoteRootTrashCost(card);
        return (type === "asset" || type === "upgrade") &&
          trashCost !== undefined &&
          card.definitionId
          ? [{ card, definitionId: card.definitionId, type, trashCost }]
          : [];
      })
      .sort(
        (left, right) =>
          left.trashCost - right.trashCost ||
          left.card.instanceId.localeCompare(right.card.instanceId),
      );
    const cheapestTrashRoot = trashableRoots[0];
    if (!cheapestTrashRoot)
      return {
        blocksBreak: true,
        evidence: [...evidenceBase, "encounter_remote_payoff:known_low_value"],
      };

    const trashProjection = projectKnownRemoteTrashCommitment(input, {
      serverId: server.id,
      definitionId: cheapestTrashRoot.definitionId,
      rootType: cheapestTrashRoot.type,
      trashCost: cheapestTrashRoot.trashCost,
      creditsAfterPath: creditsAfterAccessPath,
      visibleCard: cheapestTrashRoot.card,
    });
    if (!trashProjection.knownNoCurrentPayoff)
      return { blocksBreak: false, evidence: [] };

    return {
      blocksBreak: true,
      evidence: [
        ...evidenceBase,
        "encounter_remote_payoff:known_no_current_payoff",
        `encounter_remote_root_trash_cost:${cheapestTrashRoot.trashCost}`,
        `encounter_remote_trash_decision:${trashProjection.accessDecision}`,
        ...(trashProjection.declineReason
          ? [
              `encounter_remote_trash_decline_reason:${trashProjection.declineReason}`,
            ]
          : []),
      ],
      ...(trashProjection.declineReason === "reserve_would_break"
        ? { constraint: "remote_payoff_reserve" as const }
        : {}),
    };
  };

  const breakAccessPathAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerEncounterBreakAccessAssessment => {
    // Payment windows resume an already selected break. They expose no ordinary
    // encounter continuation; the cost-continuation owner validates the exact
    // original action, window and plan binding before it can execute.
    if (action.payload?.runnerCostPenaltySupportContinuation === true) {
      return {
        canPreserveAccessPath: true,
        evidence: ["break_access_path_owned_by_bound_payment_continuation"],
      };
    }
    const run = input.playerView.run;
    if (run?.position?.kind !== "ice")
      return { canPreserveAccessPath: true, evidence: [] };
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === run.position?.serverId,
    );
    if (!server) return { canPreserveAccessPath: true, evidence: [] };

    const breakIndexes = dependencies.breakSubroutineIndexesForAction(action);
    const quote =
      dependencies.currentEncounteredIceCard(input)?.effectiveRunQuote;
    const targetSubroutines = [...breakIndexes]
      .map((index) => quote?.subroutines[index])
      .filter((subroutine): subroutine is NonNullable<typeof subroutine> =>
        Boolean(subroutine),
      );
    if (
      targetSubroutines.some((subroutine) =>
        isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine),
      ) ||
      (currentEncounterRequiresDamagePreservingBreak(input) &&
        targetSubroutines.some(
          (subroutine) =>
            isVisibleDirectDamageSubroutine(subroutine) &&
            (subroutine.amount ?? 0) > 0,
        ))
    )
      return {
        canPreserveAccessPath: true,
        evidence: ["break_preserves_immediate_safety:true"],
      };

    const breakPayment = runnerEncounterPaymentForAction(input, action);
    const unbrokenIndexes = currentEncounterUnbrokenSubroutineIndexes(input);
    const remainingSubroutinesAfterBreak =
      quote && breakIndexes.size > 0
        ? quote.subroutines.filter(
            (_, index) =>
              unbrokenIndexes.has(index) && !breakIndexes.has(index),
          )
        : [];
    const remainingHardEndRunAfterBreak = remainingSubroutinesAfterBreak.filter(
      (subroutine) =>
        isEndRunSubroutine(subroutine) &&
        !isVisiblePayEndRunSubroutine(subroutine),
    ).length;
    const remainingPayEndRunSubroutines = remainingSubroutinesAfterBreak.filter(
      isVisiblePayEndRunSubroutine,
    );
    const remainingPayEndRunCost = remainingPayEndRunSubroutines.reduce(
      (sum, subroutine) =>
        sum + Math.max(0, Math.floor(subroutine.amount ?? 0)),
      0,
    );
    const conditionalEndRunPayment = spendRunnerEncounterGeneralCost(
      breakPayment.budget,
      remainingPayEndRunCost,
    );
    const budgetAfterBreak = conditionalEndRunPayment.affordable
      ? conditionalEndRunPayment.budget
      : breakPayment.budget;
    const creditsAfterBreak = budgetAfterBreak.credits;
    const remainingCurrentEndRunAfterBreak =
      remainingHardEndRunAfterBreak +
      (conditionalEndRunPayment.affordable
        ? 0
        : remainingPayEndRunSubroutines.length);
    const currentEncounterContinue = input.legalActions.find(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.payload?.encounterContinue === true,
    );
    if (
      currentEncounterContinue?.payload?.encounterWillEndRun === true &&
      remainingCurrentEndRunAfterBreak > 0 &&
      !spendRunnerEncounterActionCost({
        input,
        action,
        budget: budgetAfterBreak,
        cost: dependencies.estimatedEncounterBreakCost(input, action) ?? 1,
      }).affordable
    )
      return {
        canPreserveAccessPath: false,
        evidence: [
          "break_cannot_clear_current_ice:true",
          `break_credits_after:${creditsAfterBreak}`,
          `break_remaining_current_end_run:${remainingCurrentEndRunAfterBreak}`,
          `break_remaining_pay_end_run_cost:${remainingPayEndRunCost}`,
          `break_remaining_pay_end_run_affordable:${conditionalEndRunPayment.affordable}`,
        ],
      };

    const futureIce = server.ice.slice(0, Math.max(0, run.position.iceIndex));
    const futureRig = runnerRigAfterEncounter(input.playerView.own.rig ?? []);
    const remainingForcedIndexes = new Set(
      quote?.subroutines.flatMap((subroutine, index) => {
        if (!unbrokenIndexes.has(index) || breakIndexes.has(index)) return [];
        if (
          isEndRunSubroutine(subroutine) &&
          !isVisiblePayEndRunSubroutine(subroutine)
        )
          return [index];
        if (
          !subroutine.unbrokenRunEffect ||
          isVisibleDirectDamageSubroutine(subroutine)
        )
          return [];
        const boundBreak = input.legalActions.find(
          (candidate) =>
            candidate.type === "break_subroutine" &&
            dependencies.breakSubroutineIndexesForAction(candidate).has(index),
        );
        return boundBreak &&
          encounterRunRemainderEffectAssessment(input, boundBreak).mustBreak
          ? [index]
          : [];
      }) ?? [],
    );
    if (futureIce.length > 0 && remainingForcedIndexes.size > 0) {
      // Current forced breaks and the inner path consume the same pools.
      // This is a cost projection over current Engine actions, not an executor.
      const pending = [
        {
          remaining: remainingForcedIndexes,
          unbroken: new Set(
            [...unbrokenIndexes].filter((index) => !breakIndexes.has(index)),
          ),
          budget: budgetAfterBreak,
        },
      ];
      const visited = new Set<string>();
      let payableContinuation = false;
      while (pending.length > 0 && !payableContinuation) {
        const state = pending.pop()!;
        const key = JSON.stringify([
          [...state.remaining].sort((a, b) => a - b),
          [...state.unbroken].sort((a, b) => a - b),
          state.budget,
        ]);
        if (visited.has(key)) continue;
        visited.add(key);
        if (state.remaining.size === 0) {
          payableContinuation = dependencies.assessKnownRezzedIcePath(
            futureIce,
            futureRig,
            state.budget,
            server.root,
            input.playerView.opponent.credits,
          ).canReachAccess;
          continue;
        }
        for (const candidate of input.legalActions) {
          if (
            candidate.type !== "break_subroutine" ||
            candidate.choiceRequirements?.length
          )
            continue;
          const indexes =
            dependencies.breakSubroutineIndexesForAction(candidate);
          if (
            ![...indexes].some((index) => state.remaining.has(index)) ||
            [...indexes].some((index) => !state.unbroken.has(index))
          )
            continue;
          const payment = spendRunnerEncounterActionCost({
            input,
            action: candidate,
            budget: state.budget,
            cost: dependencies.actionCreditCost(candidate),
          });
          if (!payment.affordable) continue;
          pending.push({
            remaining: new Set(
              [...state.remaining].filter((index) => !indexes.has(index)),
            ),
            unbroken: new Set(
              [...state.unbroken].filter((index) => !indexes.has(index)),
            ),
            budget: payment.budget,
          });
        }
      }
      if (!payableContinuation)
        return {
          canPreserveAccessPath: false,
          evidence: [
            "break_current_and_future_path_exceed_shared_budget:true",
            `break_remaining_forced_indexes:${[...remainingForcedIndexes].join(",")}`,
          ],
        };
    }
    if (futureIce.length <= 0) {
      const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
        input,
        server,
        targetSubroutines,
        creditsAfterBreak,
        remainingCurrentEndRunAfterBreak,
      );
      if (remotePayoff.blocksBreak)
        return {
          canPreserveAccessPath: false,
          evidence: remotePayoff.evidence,
          ...(remotePayoff.constraint
            ? { constraint: remotePayoff.constraint }
            : {}),
        };
      return {
        canPreserveAccessPath: true,
        evidence: [`break_credits_after:${creditsAfterBreak}`],
      };
    }

    const pathAssessment = dependencies.assessKnownRezzedIcePath(
      futureIce,
      futureRig,
      budgetAfterBreak,
      server.root,
    );
    if (
      pathAssessment.assessedKnownIceCount <= 0 ||
      pathAssessment.canReachAccess
    ) {
      const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
        input,
        server,
        targetSubroutines,
        pathAssessment.creditsAfterPath,
        remainingCurrentEndRunAfterBreak,
      );
      if (remotePayoff.blocksBreak)
        return {
          canPreserveAccessPath: false,
          evidence: [
            ...remotePayoff.evidence,
            dependencies.knownIcePathReason(pathAssessment, server.id),
          ],
          ...(remotePayoff.constraint
            ? { constraint: remotePayoff.constraint }
            : {}),
        };
      return {
        canPreserveAccessPath: true,
        evidence: [
          `break_credits_after:${creditsAfterBreak}`,
          dependencies.knownIcePathReason(pathAssessment, server.id),
        ],
      };
    }
    const conditionalFuturePath =
      assessRandomBreakOrDamageRiskForVisibleRunPath(input, {
        targetServerId: server.id,
        visibleIce: futureIce,
      });
    if (randomBreakOrDamageRiskCanCarryRunPath(conditionalFuturePath)) {
      const remotePayoff = encounterRemotePayoffAfterBreakAssessment(
        input,
        server,
        targetSubroutines,
        creditsAfterBreak,
        remainingCurrentEndRunAfterBreak,
      );
      if (remotePayoff.blocksBreak) {
        return {
          canPreserveAccessPath: false,
          evidence: remotePayoff.evidence,
          ...(remotePayoff.constraint
            ? { constraint: remotePayoff.constraint }
            : {}),
        };
      }
      return {
        canPreserveAccessPath: true,
        evidence: [
          "break_preserves_conditional_random_break_path:true",
          `break_credits_after:${creditsAfterBreak}`,
          dependencies.knownIcePathReason(pathAssessment, server.id),
        ],
      };
    }
    return {
      canPreserveAccessPath: false,
      evidence: [
        "break_future_path_blocked_after_cost:true",
        `break_credits_after:${creditsAfterBreak}`,
        dependencies.knownIcePathReason(pathAssessment, server.id),
      ],
    };
  };

  return {
    breakAccessPathAssessment,
    encounterRemotePayoffAfterBreakAssessment,
  };
}

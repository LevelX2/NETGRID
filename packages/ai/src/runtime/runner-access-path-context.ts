import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { projectKnownRemoteTrashCommitment } from "../decision/known-remote-access-commitment";
import {
  isEndRunSubroutine,
  isUnacceptableImmediateSafetyThreatSubroutine,
  type VisibleEncounterSubroutine,
} from "./encounter-subroutine";
import {
  runnerEncounterPaymentForAction,
  spendRunnerEncounterActionCost,
} from "./runner-encounter-credit-budget";

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
  ) => { canPreserveAccessPath: boolean; evidence: string[] };
  encounterRemotePayoffAfterBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ) => { blocksBreak: boolean; evidence: string[] };
} {
  const encounterRemotePayoffAfterBreakAssessment = (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ): { blocksBreak: boolean; evidence: string[] } => {
    if (!dependencies.isRemoteServerTarget(server.id))
      return { blocksBreak: false, evidence: [] };
    if (targetSubroutines.length <= 0)
      return { blocksBreak: false, evidence: [] };
    if (remainingCurrentEndRunAfterBreak > 0)
      return { blocksBreak: false, evidence: [] };
    if (
      targetSubroutines.some((subroutine) =>
        isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine),
      )
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
    };
  };

  const breakAccessPathAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): { canPreserveAccessPath: boolean; evidence: string[] } => {
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
      )
    )
      return {
        canPreserveAccessPath: true,
        evidence: ["break_preserves_immediate_safety:true"],
      };

    const breakPayment = runnerEncounterPaymentForAction(input, action);
    const creditsAfterBreak = breakPayment.creditsAfterPayment;
    const remainingCurrentEndRunAfterBreak =
      quote && breakIndexes.size > 0
        ? quote.subroutines.filter(
            (subroutine, index) =>
              isEndRunSubroutine(subroutine) && !breakIndexes.has(index),
          ).length
        : 0;
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
        budget: breakPayment.budget,
        cost: dependencies.estimatedEncounterBreakCost(input, action) ?? 1,
      }).affordable
    )
      return {
        canPreserveAccessPath: false,
        evidence: [
          "break_cannot_clear_current_ice:true",
          `break_credits_after:${creditsAfterBreak}`,
          `break_remaining_current_end_run:${remainingCurrentEndRunAfterBreak}`,
        ],
      };

    const futureIce = server.ice.slice(0, Math.max(0, run.position.iceIndex));
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
        };
      return {
        canPreserveAccessPath: true,
        evidence: [`break_credits_after:${creditsAfterBreak}`],
      };
    }

    const pathAssessment = dependencies.assessKnownRezzedIcePath(
      futureIce,
      input.playerView.own.rig ?? [],
      breakPayment.budget,
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
        };
      return {
        canPreserveAccessPath: true,
        evidence: [
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

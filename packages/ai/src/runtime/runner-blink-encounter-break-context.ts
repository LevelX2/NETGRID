import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type {
  BlinkRiskAssessment,
  BlinkRiskPayoffOverride,
  RandomBreakOrDamageRiskProfile,
} from "../runner-run-target-evaluation";
import type { VisibleEncounterSubroutine } from "./encounter-subroutine";

export type RunnerBlinkEncounterBreakContextDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
  randomBreakOrDamageRiskProfileForDefinitionId: (
    definitionId: string | undefined,
  ) => RandomBreakOrDamageRiskProfile | undefined;
  breakSubroutineIndexesForAction: (action: LegalAction) => Set<number>;
  encounteredSubroutines: (
    input: AiDecisionInput,
  ) => readonly VisibleEncounterSubroutine[];
  buildBlinkRiskAssessment: (params: {
    currentHandCount: number;
    handAfterActionCost: number;
    blinkUsesLikely: number;
    visibleSubroutinesLikely: number;
    payoffOverride: BlinkRiskPayoffOverride;
    stableCoverageAvailable: boolean;
    context: "encounter_break";
    riskProfile?: RandomBreakOrDamageRiskProfile;
    evidence?: readonly string[];
  }) => BlinkRiskAssessment;
  isImmediateSafetyThreatSubroutine: (
    subroutine: VisibleEncounterSubroutine,
  ) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  visibleRootIsKnownAgenda: (
    card: AiDecisionInput["playerView"]["servers"][number]["root"][number],
  ) => boolean;
};

export function createRunnerBlinkEncounterBreakContext(
  dependencies: RunnerBlinkEncounterBreakContextDependencies,
): {
  blinkRiskAssessmentForEncounterBreak: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => BlinkRiskAssessment | undefined;
} {
  function blinkRiskAssessmentForEncounterBreak(
    input: AiDecisionInput,
    action: LegalAction,
  ): BlinkRiskAssessment | undefined {
    if (input.side !== "runner" || action.type !== "break_subroutine") {
      return undefined;
    }
    const riskProfile =
      dependencies.randomBreakOrDamageRiskProfileForDefinitionId(
        dependencies.sourceDefinitionIdForAction(input, action),
      );
    if (!riskProfile) return undefined;
    const breakIndexes = dependencies.breakSubroutineIndexesForAction(action);
    const encounteredSubroutines = dependencies.encounteredSubroutines(input);
    const targetSubroutines = [...breakIndexes]
      .map((index) => encounteredSubroutines[index])
      .filter((subroutine): subroutine is VisibleEncounterSubroutine =>
        Boolean(subroutine),
      );
    const currentHandCount = input.playerView.own.gripOrHq.length;
    const visibleSubroutinesLikely = Math.max(
      1,
      breakIndexes.size || targetSubroutines.length,
    );
    const stableCoverageAvailable = stableBreakAlternativeForBlinkAction(
      input,
      action,
    );
    const payoffOverride = blinkEncounterPayoffOverride(
      input,
      targetSubroutines,
    );

    return dependencies.buildBlinkRiskAssessment({
      currentHandCount,
      handAfterActionCost: currentHandCount,
      blinkUsesLikely: visibleSubroutinesLikely,
      visibleSubroutinesLikely,
      payoffOverride,
      stableCoverageAvailable,
      context: "encounter_break",
      riskProfile,
      evidence: [
        "blinkBreakAction:true",
        `blinkBreakSubroutineCount:${visibleSubroutinesLikely}`,
        `blinkBreakStableAlternative:${stableCoverageAvailable}`,
        `blinkBreakPayoffOverride:${payoffOverride}`,
        ...(input.playerView.run?.position?.serverId
          ? [`blinkBreakServer:${input.playerView.run.position.serverId}`]
          : []),
      ],
    });
  }

  function stableBreakAlternativeForBlinkAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const targetIceId =
      typeof action.payload?.iceId === "string" ? action.payload.iceId : "";
    const targetIndexes = dependencies.breakSubroutineIndexesForAction(action);
    return input.legalActions.some((candidate) => {
      if (
        candidate.actionId === action.actionId ||
        candidate.type !== "break_subroutine" ||
        dependencies.randomBreakOrDamageRiskProfileForDefinitionId(
          dependencies.sourceDefinitionIdForAction(input, candidate),
        ) !== undefined
      ) {
        return false;
      }
      if (
        targetIceId &&
        typeof candidate.payload?.iceId === "string" &&
        candidate.payload.iceId !== targetIceId
      ) {
        return false;
      }
      const candidateIndexes =
        dependencies.breakSubroutineIndexesForAction(candidate);
      if (targetIndexes.size === 0 || candidateIndexes.size === 0)
        return true;
      return [...targetIndexes].some((index) => candidateIndexes.has(index));
    });
  }

  function blinkEncounterPayoffOverride(
    input: AiDecisionInput,
    targetSubroutines: VisibleEncounterSubroutine[],
  ): BlinkRiskPayoffOverride {
    if (
      targetSubroutines.some(dependencies.isImmediateSafetyThreatSubroutine)
    ) {
      return "survival";
    }
    const run = input.playerView.run;
    const server =
      run?.position?.kind === "ice"
        ? input.playerView.servers.find(
            (candidate) => candidate.id === run.position?.serverId,
          )
        : undefined;
    if (!server || !dependencies.isRemoteServerTarget(server.id))
      return "none";
    if (server.root.some(dependencies.visibleRootIsKnownAgenda))
      return "known_agenda";
    if (
      server.root.some(
        (card) => card.known && (card.advancementCounters ?? 0) > 0,
      )
    ) {
      return "remote_score_threat";
    }
    return "none";
  }

  return { blinkRiskAssessmentForEncounterBreak };
}

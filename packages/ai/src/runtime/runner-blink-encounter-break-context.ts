import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { projectRunnerVisibleIceDamage } from "../runner-damage-threat-assessment";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
} from "./current-encounter";

import type {
  RandomBreakOrDamageRiskAssessment,
  RandomBreakOrDamageRiskPayoffOverride,
  RandomBreakOrDamageRiskProfile,
} from "../runner-run-target-evaluation";
import type { VisibleEncounterSubroutine } from "./encounter-subroutine";

export type RunnerRandomBreakOrDamageEncounterContextDependencies = {
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
  buildRandomBreakOrDamageRiskAssessment: (params: {
    currentHandCount: number;
    handAfterActionCost: number;
    randomBreakUsesLikely: number;
    visibleSubroutinesLikely: number;
    payoffOverride: RandomBreakOrDamageRiskPayoffOverride;
    stableCoverageAvailable: boolean;
    context: "encounter_break";
    riskProfile: RandomBreakOrDamageRiskProfile;
    unbrokenEncounterDamageLikely?: number;
    certainLossRescue?: true;
    evidence?: readonly string[];
  }) => RandomBreakOrDamageRiskAssessment;
  isImmediateSafetyThreatSubroutine: (
    subroutine: VisibleEncounterSubroutine,
  ) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  visibleRootIsKnownAgenda: (
    card: AiDecisionInput["playerView"]["servers"][number]["root"][number],
  ) => boolean;
};

export function createRunnerRandomBreakOrDamageEncounterContext(
  dependencies: RunnerRandomBreakOrDamageEncounterContextDependencies,
): {
  randomBreakOrDamageRiskAssessmentForEncounterBreak: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RandomBreakOrDamageRiskAssessment | undefined;
} {
  function randomBreakOrDamageRiskAssessmentForEncounterBreak(
    input: AiDecisionInput,
    action: LegalAction,
  ): RandomBreakOrDamageRiskAssessment | undefined {
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
    const stableCoverageAvailable = stableBreakAlternativeForRandomBreakAction(
      input,
      action,
    );
    const payoffOverride = randomBreakEncounterPayoffOverride(
      input,
      targetSubroutines,
    );
    const unbrokenEncounterDamageLikely = unbrokenEncounterSubroutines(
      input,
      action,
      encounteredSubroutines,
    ).reduce(
      (sum, subroutine) => sum + visibleDirectDamageAmount(subroutine),
      0,
    );

    return dependencies.buildRandomBreakOrDamageRiskAssessment({
      currentHandCount,
      handAfterActionCost: currentHandCount,
      randomBreakUsesLikely: visibleSubroutinesLikely,
      visibleSubroutinesLikely,
      payoffOverride,
      stableCoverageAvailable,
      context: "encounter_break",
      riskProfile,
      unbrokenEncounterDamageLikely,
      ...(randomBreakHasSurvivingBranchAgainstCertainLoss(
        input,
        action,
        breakIndexes,
        encounteredSubroutines,
        riskProfile,
      )
        ? { certainLossRescue: true as const }
        : {}),
      evidence: [
        "randomBreakDamageAction:true",
        `randomBreakDamageSubroutineCount:${visibleSubroutinesLikely}`,
        `randomBreakDamageStableAlternative:${stableCoverageAvailable}`,
        `randomBreakDamagePayoffOverride:${payoffOverride}`,
        `randomBreakDamageUnbrokenEncounterDamageLikely:${unbrokenEncounterDamageLikely}`,
        ...(input.playerView.run?.position?.serverId
          ? [
              `randomBreakDamageServer:${input.playerView.run.position.serverId}`,
            ]
          : []),
      ],
    });
  }

  function stableBreakAlternativeForRandomBreakAction(
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
      if (targetIndexes.size === 0 || candidateIndexes.size === 0) return true;
      return [...targetIndexes].some((index) => candidateIndexes.has(index));
    });
  }

  function randomBreakEncounterPayoffOverride(
    input: AiDecisionInput,
    targetSubroutines: VisibleEncounterSubroutine[],
  ): RandomBreakOrDamageRiskPayoffOverride {
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
    if (!server || !dependencies.isRemoteServerTarget(server.id)) return "none";
    if (server.root.some(dependencies.visibleRootIsKnownAgenda))
      return "known_agenda";
    if (server.root.some((card) => (card.advancementCounters ?? 0) > 0)) {
      return "remote_score_threat";
    }
    return "none";
  }

  return { randomBreakOrDamageRiskAssessmentForEncounterBreak };
}

function unbrokenEncounterSubroutines(
  input: AiDecisionInput,
  action: LegalAction,
  subroutines: readonly VisibleEncounterSubroutine[],
): readonly VisibleEncounterSubroutine[] {
  // A failed attempt leaves every currently open subroutine unresolved, not
  // only its selected target. The Engine's continuation quote identifies that
  // exact remainder; printed ICE text would count previously broken damage.
  if (
    !subroutines.some((subroutine) => visibleDirectDamageAmount(subroutine) > 0)
  )
    return [];
  const continuation = input.legalActions.find(
    (candidate) =>
      candidate.type === "continue_run" &&
      candidate.payload?.encounterContinue === true,
  );
  const quotedIds = continuation?.payload?.encounterSubroutineIds;
  const ids =
    typeof quotedIds === "string" ? quotedIds.split(",").filter(Boolean) : [];
  if (
    typeof quotedIds !== "string" ||
    new Set(ids).size !== ids.length ||
    ids.length !== continuation?.payload?.unbrokenSubroutineCount ||
    ids.some((id) => !subroutines.some((subroutine) => subroutine.id === id))
  ) {
    throw Object.assign(
      new Error(
        "Invalid Engine-bound remaining encounter subroutines for random-break risk.",
      ),
      {
        name: "EncounterRiskProjectionError",
        code: "invalid_remaining_encounter_subroutines",
        owner: "runner.convert_run_window",
        actionId: action.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    );
  }
  const unbroken = new Set(ids);
  return subroutines.filter((subroutine) => unbroken.has(subroutine.id));
}

function visibleDirectDamageAmount(
  subroutine: VisibleEncounterSubroutine,
): number {
  const type = subroutine.type.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  const directDamage =
    type === "brain_damage" ||
    type === "core_damage" ||
    type === "do_brain_damage" ||
    type === "do_core_damage" ||
    type === "do_damage" ||
    typeof damageTypeValue === "string";
  if (!directDamage) return 0;
  return Math.max(0, Math.floor(subroutine.amount ?? 1));
}

/** Compare the same forced encounter continuation with a successful exact
 * damage break. A possible rescue may be risky when declining it loses with
 * certainty; this never admits a new run or overrides an available safe exit. */
function randomBreakHasSurvivingBranchAgainstCertainLoss(
  input: AiDecisionInput,
  action: LegalAction,
  targets: ReadonlySet<number>,
  subroutines: readonly VisibleEncounterSubroutine[],
  profile: RandomBreakOrDamageRiskProfile,
): boolean {
  const ice = currentEncounteredIceCard(input);
  const continuation = input.legalActions.find(
    (a) => a.type === "continue_run" && a.payload?.encounterContinue === true,
  );
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    !ice?.effectiveRunQuote ||
    action.payload?.iceId !== ice.instanceId ||
    targets.size === 0 ||
    profile.successProbabilityPerAttempt <= 0 ||
    profile.successProbabilityPerAttempt > 1 ||
    currentEncounterRequiresFullBreak(input) ||
    continuation?.payload?.encounterWillEndRun !== true ||
    continuation.choiceRequirements?.length ||
    continuation.costs.some((c) => (c.credits ?? 0) > 0) ||
    input.legalActions.some(
      (a) => a.type !== "continue_run" && a.type !== "break_subroutine",
    ) ||
    [...targets].some((i) => subroutines[i]?.type !== "do_damage")
  )
    return false;
  const remaining = unbrokenEncounterSubroutines(input, action, subroutines);
  if (
    !remaining.length ||
    remaining.some((s) => s.type !== "do_damage" && s.type !== "end_the_run")
  )
    return false;
  const remainingIce = {
    ...ice,
    effectiveRunQuote: {
      ...ice.effectiveRunQuote,
      subroutines: [...remaining],
    },
  };
  const options = {
    assumeUnbrokenSubroutines: true as const,
    requiredHandFloor: 0,
  };
  const before = projectRunnerVisibleIceDamage(input, [remainingIce], options);
  const certainLoss =
    before.projectedDamage > input.playerView.own.gripOrHq.length ||
    input.playerView.own.maxHandSize - before.projectedCoreDamage < 0;
  if (!certainLoss) return false;
  const brokenIds = [...targets].map((i) => subroutines[i]!.id);
  if (brokenIds.some((id) => !remaining.some((s) => s.id === id))) return false;
  const success = projectRunnerVisibleIceDamage(input, [remainingIce], {
    ...options,
    paidSubroutineBreaks: brokenIds.map((subroutineId) => ({
      iceInstanceId: ice.instanceId,
      subroutineId,
    })),
  });
  return (
    success.projectedDamage <= input.playerView.own.gripOrHq.length &&
    input.playerView.own.maxHandSize - success.projectedCoreDamage >= 0
  );
}

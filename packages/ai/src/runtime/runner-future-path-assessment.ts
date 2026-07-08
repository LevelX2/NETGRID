import type {
  AiDecisionInput,
  VisibleCard,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";

import {
  assessKnownRezzedIcePath,
  cardDefinitionStrength,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

type UnbrokenRunEffectEntry = {
  effect: NonNullable<
    NonNullable<
      VisibleCard["effectiveRunQuote"]
    >["subroutines"][number]["unbrokenRunEffect"]
  >;
};

export function currentRunFuturePathAssessment(
  input: AiDecisionInput,
  effects: UnbrokenRunEffectEntry[] = [],
): { blocked: boolean; visibleBreakCost?: number } {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return { blocked: false };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  if (!server) return { blocked: false };
  const futureIce = server.ice
    .slice(0, Math.max(0, run.position.iceIndex))
    .map((ice) => projectFutureIceForUnbrokenEffects(ice, effects));
  const assessment = assessKnownRezzedIcePath(
    futureIce,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server.root,
  );
  const encounterTax = effects.reduce((sum, { effect }) => {
    const perIce = Math.max(0, Math.floor(effect.addsFutureEncounterCost ?? 0));
    return (
      sum + perIce * futureIce.filter((ice) => ice.known && ice.rezzed).length
    );
  }, 0);
  const visibleBreakCost = (assessment.visibleBreakCost ?? 0) + encounterTax;
  return {
    blocked: assessment.blocked || assessment.creditsAfterPath < encounterTax,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
  };
}

export function projectFutureIceForUnbrokenEffects(
  ice: VisibleCard,
  effects: UnbrokenRunEffectEntry[],
): VisibleCard {
  if (!ice.known || ice.rezzed !== true || !ice.definitionId) return ice;
  const quote = ice.effectiveRunQuote;
  const baseQuote: VisibleEffectiveIceRunQuote = quote ?? {
    iceInstanceId: ice.instanceId,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      DEMO_CARDS_BY_ID[ice.definitionId]?.subroutines?.map((subroutine) => ({
        id: subroutine.id,
        type: subroutine.type,
        ...(subroutine.amount !== undefined
          ? { amount: subroutine.amount }
          : {}),
        ...(subroutine.breakTags
          ? { breakTags: subroutine.breakTags.slice() }
          : {}),
      })) ?? [],
  };
  let effectiveStrength = baseQuote.effectiveStrength;
  let breakSubroutineAdditionalCostPerSubroutine =
    baseQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
  const subroutines = baseQuote.subroutines.map((subroutine) => ({
    ...subroutine,
  }));
  for (const { effect } of effects) {
    const addedEndTheRun = Math.max(
      0,
      Math.floor(effect.addsFutureEndTheRunSubroutines ?? 0),
    );
    for (let index = 0; index < addedEndTheRun; index += 1) {
      subroutines.push({
        id: `visible_projection.future_end_the_run.${index + 1}`,
        type: "end_the_run",
      });
    }
    effectiveStrength += Math.max(
      0,
      Math.floor(effect.increasesFutureIceStrength ?? 0),
    );
    breakSubroutineAdditionalCostPerSubroutine += Math.max(
      0,
      Math.floor(effect.increasesFutureBreakCostPerSubroutine ?? 0),
    );
  }
  return {
    ...ice,
    effectiveRunQuote: {
      ...baseQuote,
      effectiveStrength,
      subroutines,
      ...(breakSubroutineAdditionalCostPerSubroutine > 0
        ? { breakSubroutineAdditionalCostPerSubroutine }
        : {}),
    },
  };
}

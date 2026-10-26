import { visibleBreakerEncounterQuote } from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { visibleCorpIceDefenseProfile } from "../../runtime/semantic-runtime-corp-effective-defense";

/** Sufficient proof that this installed, fixed ICE adds neither stop nor tax.
 * Unknown or additional effects never certify a free break. */
export function corpInstalledIceHasFreeFullBreak(
  input: AiDecisionInput,
  ice: VisibleCard,
  serverId: string,
): boolean {
  const post = ice.effectivePostRezRunQuote;
  const defense = visibleCorpIceDefenseProfile(ice);
  if (
    !ice.known ||
    !ice.definitionId ||
    ice.rezzed ||
    defense.hasMeaningfulTaxOrDamage ||
    defense.hasEncounterDisruption ||
    post?.complete !== true ||
    post.context !== "installed_post_rez" ||
    post.cardId !== ice.instanceId ||
    post.iceDefinitionId !== ice.definitionId ||
    post.targetServerId !== serverId ||
    post.projectedServerId !== serverId ||
    post.expiresAtStateVersion !== input.playerView.stateVersion
  )
    return false;
  const run = post.effectiveRunQuote;
  if (
    run.iceInstanceId !== ice.instanceId ||
    run.iceDefinitionId !== ice.definitionId ||
    run.subroutines.length === 0 ||
    run.subroutines.some((subroutine) => subroutine.type !== "end_the_run") ||
    (run.conditionalEncounterEffects?.length ?? 0) > 0 ||
    (run.breakSubroutineAdditionalCostPerSubroutine ?? 0) !== 0
  )
    return false;
  return (input.playerView.opponent.rig ?? []).some((breaker) => {
    if (
      !breaker.known ||
      !breaker.definitionId ||
      breaker.rezzed !== true ||
      !Number.isFinite(breaker.strength)
    )
      return false;
    const quote = visibleBreakerEncounterQuote({
      breakerDefinitionId: breaker.definitionId,
      breakerInstanceId: breaker.instanceId,
      breakerStrength: breaker.strength!,
      ...(breaker.selectedTargetCardId
        ? { selectedTargetCardId: breaker.selectedTargetCardId }
        : {}),
      ...(breaker.selectedSubtype
        ? { selectedSubtype: breaker.selectedSubtype }
        : {}),
      ...(breaker.randomRunStrengthState
        ? { randomRunStrengthState: breaker.randomRunStrengthState }
        : {}),
      iceDefinitionId: ice.definitionId!,
      iceInstanceId: ice.instanceId,
      ...(ice.subtypes ? { iceSubtypes: ice.subtypes } : {}),
      subroutines: run.subroutines,
    });
    if (
      !quote ||
      quote.randomRunStrength ||
      quote.stateChangesAfterUse.length > 0 ||
      quote.effectiveStrength < (run.encounterStrength ?? run.effectiveStrength)
    )
      return false;
    const freeIndexes = new Set(
      quote.breakOptions
        .filter(
          (option) =>
            option.creditCost === 0 && option.consequences.length === 0,
        )
        .flatMap((option) => option.breakableSubroutineIndexes),
    );
    return run.subroutines.every((_, index) => freeIndexes.has(index));
  });
}

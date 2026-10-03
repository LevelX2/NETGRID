import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

/** Quotes only a pure fixed-cost activation on an owned installed source.
 * The current rez is an Engine action; the later activation is rematerialized.
 */
export function corpInstalledAdvancementPreparations(input: AiDecisionInput) {
  if (
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main"
  )
    return [];
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) => {
      if (
        !card.known ||
        card.owner !== "corp" ||
        card.controller !== "corp" ||
        card.rezzed !== false ||
        !card.definitionId
      )
        return [];
      const planning = cardSpecPlanningCardByDefinitionId(
        card.definitionId,
      )?.planning;
      if (planning?.side !== "corp" || planning.cardType !== "asset") return [];
      const rez = input.legalActions.find(
        (a) =>
          a.side === "corp" &&
          a.type === "rez_card" &&
          a.source === card.instanceId &&
          a.payload?.cardId === card.instanceId &&
          a.payload?.serverId === server.id &&
          a.expiresAtStateVersion === input.playerView.stateVersion,
      );
      if (
        !rez ||
        rez.targetRequirements.length ||
        (rez.choiceRequirements?.length ?? 0) > 0
      )
        return [];
      const rezCredits = exactCredits(rez);
      if (rezCredits === undefined) return [];
      return (planning.engine.abilities ?? []).flatMap((ability) => {
        const effect = ability.effects[0];
        if (
          ability.kind !== "activated" ||
          ability.timing !== "corp_main" ||
          ability.condition ||
          ability.limit !== undefined ||
          ability.effects.length !== 1 ||
          effect?.kind !== "distribute_advancement_counters" ||
          effect.target !== "installed_advanceable_cards" ||
          effect.distribution !== "single_target" ||
          !Number.isSafeInteger(effect.amount) ||
          effect.amount <= 0
        )
          return [];
        if (
          ability.costs.length !== 2 ||
          ability.costs.filter((c) => c.kind === "action" && c.amount === 1)
            .length !== 1 ||
          ability.costs.filter(
            (c) =>
              c.kind === "credit" &&
              Number.isSafeInteger(c.amount) &&
              c.amount >= 0,
          ).length !== 1
        )
          return [];
        const cost = ability.costs.find((c) => c.kind === "credit")!;
        if (cost.kind !== "credit") return [];
        return [
          {
            action: rez,
            rezCredits,
            sourceCardId: card.instanceId,
            amount: effect.amount,
            clickCost: 1,
            creditCost: cost.amount,
            capabilityId: String(ability.capabilityKey),
            repeatable: true as const,
          },
        ];
      });
    }),
  );
}
function exactCredits(action: LegalAction): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    if (
      Object.keys(cost).some((k) => k !== "credits") ||
      !Number.isSafeInteger(cost.credits) ||
      cost.credits! < 0
    )
      return undefined;
    total += cost.credits!;
  }
  return total;
}

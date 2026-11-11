import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import { visibleCardIsAgenda } from "../../runtime/visible-action-facts";
import { requireVisibleAgendaPoints } from "../../runtime/visible-agenda-facts";

function isPlainStealableAgenda(input: AiDecisionInput, card: VisibleCard): boolean {
  if (!visibleCardIsAgenda(input, card) || !card.definitionId) return false;
  const spec = cardSpecPlanningCardByDefinitionId(card.definitionId);
  return (
    spec !== undefined &&
    !spec.planning.engine.selfStealCosts?.length &&
    !spec.planning.engine.accessEffects?.some(
      (effect) => effect.kind === "on_access" && effect.sourceZones.includes("installed"),
    )
  );
}

/** A narrow exact exposure bound for the emergency installation exception.
 * Each currently bare one-agenda remote is accessible with a separate base run.
 * An ICE, other root card, or special on-access/steal cost needs its usual quote. */
export function corpFloodInstallCreatesCombinedTerminalExposure(
  input: AiDecisionInput,
  agenda: VisibleCard,
  serverId: string | undefined,
): boolean {
  const view = input.playerView;
  // The Engine already reserves one run in this public next-turn click budget.
  const otherRunSlots = view.runnerNextTurnCreditClicks;
  if (
    !serverId ||
    !isFiniteNonNegativeInteger(otherRunSlots) ||
    otherRunSlots === 0 ||
    !isPlainStealableAgenda(input, agenda)
  )
    return false;
  if (serverId !== "new_remote") {
    const target = view.servers.find((server) => server.id === serverId);
    if (!target || target.ice.length !== 0 || target.root.length !== 0)
      return false;
  }

  const otherOpenAgendaPoints = view.servers
    .flatMap((server) => {
      if (
        server.id === serverId ||
        !server.id.startsWith("remote_") ||
        server.ice.length !== 0 ||
        server.root.length !== 1
      )
        return [];
      const exposed = server.root[0]!;
      return isPlainStealableAgenda(input, exposed)
        ? [requireVisibleAgendaPoints(input, exposed)]
        : [];
    })
    .sort((left, right) => right - left)
    .slice(0, otherRunSlots);
  return (
    otherOpenAgendaPoints.length > 0 &&
    view.opponent.agendaPoints +
      requireVisibleAgendaPoints(input, agenda) +
      otherOpenAgendaPoints.reduce((total, points) => total + points, 0) >=
      view.agendaPointsToWin
  );
}

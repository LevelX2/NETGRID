import type { GameState, LegalAction, VisibleCard } from "@netgrid/shared";
import { agendaPoints, visibleCorpCard } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import { projectInstalledCorpIceRezCost } from "../payment";
import { spendCorpAgendaPoints } from "../state/corp-agenda-point-cost";
import { projectFixedCorpIcePostRezState } from "./fixed-ice-post-rez-state";
import { visibleCorpIcePostRezRunQuote } from "./visible-post-rez-run-quote";

/** Exact relocation and, where necessary, fixed affordable follow-up rez.
 * Unprojected lifecycle work or another unrezzed path layer stays unquoted. */
export function visibleMobileIceMoveQuote(
  state: GameState,
  action: LegalAction,
): string | undefined {
  const sourceId = action.source;
  const origin = state.corp.servers.find((s) => s.ice.includes(sourceId));
  const target = state.corp.servers.find(
    (s) => s.id === action.payload?.targetServerId,
  );
  const source = state.cardInstances[sourceId];
  if (
    !origin ||
    !target ||
    !source ||
    origin.id === target.id ||
    action.payload?.fortRunWindowAbility !==
      "move_self_to_outermost_position_on_other_fort"
  )
    return undefined;
  const credits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const path = (current: GameState): VisibleCard[] | undefined => {
    const fort = current.corp.servers.find((s) => s.id === target.id)!;
    const cards: (VisibleCard | undefined)[] = fort.ice.map((id) => {
      if (!current.cardInstances[id]?.rezzed) return undefined;
      const card = visibleCorpCard(current, id, "corp", "ice");
      const quote = card
        ? visibleEffectiveIceRunQuote(current, id, card)
        : undefined;
      return card && quote ? { ...card, effectiveRunQuote: quote } : undefined;
    });
    return cards.every((c): c is VisibleCard => c !== undefined)
      ? cards
      : undefined;
  };
  const before = path(state);
  if (!before) return undefined;
  const projected = structuredClone(state);
  projected.corp.servers.find((s) => s.id === origin.id)!.ice =
    origin.ice.filter((id) => id !== sourceId);
  projected.corp.servers.find((s) => s.id === target.id)!.ice.push(sourceId);
  projected.cardInstances[sourceId]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: target.id,
  };
  projected.corp.credits -= credits;
  if (projected.run?.attackedServerId === target.id) {
    projected.run.position = {
      kind: "ice",
      serverId: target.id,
      iceIndex: target.ice.length,
    };
    projected.run.approachedIceId = sourceId;
    delete projected.run.encounteredIceId;
  }
  let defenseState = projected;
  let rezCredits = 0,
    mandatoryAgendaPoints = 0;
  if (!source.rezzed) {
    const rez = projectInstalledCorpIceRezCost(projected, sourceId);
    if (!rez?.complete || rez.costKind !== "fixed") return undefined;
    rezCredits = rez.finalCredits;
    mandatoryAgendaPoints = rez.mandatoryAdditionalCosts.agendaPoints;
    if (
      projected.corp.credits < rezCredits ||
      agendaPoints(projected, "corp") < mandatoryAgendaPoints
    )
      return undefined;
    projected.corp.credits -= rezCredits;
    if (mandatoryAgendaPoints > 0)
      spendCorpAgendaPoints(projected, mandatoryAgendaPoints);
    const visible = visibleCorpCard(projected, sourceId, "corp", "ice");
    const runQuote = visibleCorpIcePostRezRunQuote(
      projected,
      sourceId,
      visible,
    );
    if (!runQuote?.complete) return undefined;
    const rezzed = projectFixedCorpIcePostRezState(projected, sourceId);
    if (!rezzed) return undefined;
    defenseState = rezzed;
  }
  const after = path(defenseState);
  if (!after) return undefined;
  return JSON.stringify({
    schemaVersion: "corp-mobile-ice-move-v2",
    stateVersion: state.stateVersion,
    actionId: action.actionId,
    sourceIceInstanceId: sourceId,
    sourceServerId: origin.id,
    targetServerId: target.id,
    corpCreditsAfterMove: state.corp.credits - credits,
    continuation: {
      requiresRez: !source.rezzed,
      rezCredits,
      mandatoryAgendaPoints,
      corpCreditsAfterDefense: defenseState.corp.credits,
      corpAgendaPointsAfterDefense: agendaPoints(defenseState, "corp"),
    },
    beforeIce: before,
    afterIce: after,
  });
}

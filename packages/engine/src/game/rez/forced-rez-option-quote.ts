import type {
  CardInstanceId,
  CorpForcedIceRezChoiceQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { agendaPoints, visibleOwnCard } from "../view/card-view";
import { visibleEffectiveIceRunQuote } from "../view/visible-run-quote";
import { rezCard, type RezCardHost } from "./rez-card";

/** Execute the already canonical variant on a private clone. The quote makes
 * no LegalAction and never advances the real payment, lifecycle or RNG. */
export function projectForcedIceRezOptionQuote(
  state: GameState,
  iceId: CardInstanceId,
  action: LegalAction,
  binding: { choiceId: string; choiceSource: string; optionId: string },
  hostForState: (state: GameState) => RezCardHost,
): CorpForcedIceRezChoiceQuote {
  const projected = structuredClone(state);
  delete projected.pendingChoice;
  const projectedAction = structuredClone(action);
  const creditsBeforeRez = state.corp.credits;
  const agendaPointsBeforeRez = agendaPoints(state, "corp");
  const rezCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  rezCard(hostForState(projected), iceId, false, projectedAction, {
    runContinuation: "none",
  });
  const card = visibleOwnCard(projected, iceId);
  const effectiveRunQuote = visibleEffectiveIceRunQuote(projected, iceId, card);
  const agendaPointsAfterRez = agendaPoints(projected, "corp");
  const server = state.corp.servers.find((server) =>
    server.ice.includes(iceId),
  );
  if (
    !server ||
    !card.definitionId ||
    !card.subtypes ||
    !effectiveRunQuote ||
    projected.pendingChoice ||
    projected.randomCounter !== state.randomCounter ||
    projected.corp.credits !== creditsBeforeRez - rezCredits ||
    agendaPointsAfterRez > agendaPointsBeforeRez
  )
    throw new Error("forced_ice_rez_option_projection_incomplete");
  return {
    schemaVersion: 1,
    ...binding,
    stateVersion: state.stateVersion + 1,
    iceInstanceId: iceId,
    iceDefinitionId: card.definitionId,
    serverId: server.id,
    rezActionId: action.actionId,
    rezCredits,
    mandatoryAgendaPointCost: agendaPointsBeforeRez - agendaPointsAfterRez,
    creditsBeforeRez,
    creditsAfterRez: projected.corp.credits,
    agendaPointsBeforeRez,
    agendaPointsAfterRez,
    effectiveSubtypes: [...card.subtypes],
    effectiveRunQuote,
  };
}

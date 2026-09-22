import {
  CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION,
  type LegalAction,
  type PlayerView,
} from "@netgrid/shared";
import { PlanResolutionFailure } from "./plan-resolution-failure";

/** Destination-bound Engine difficulty; HQ difficulty does not include a region. */
export function corpAgendaInstallRequirement(
  view: PlayerView,
  action: LegalAction,
  agendaCardId: string,
  serverId: string,
): number {
  const payload = action.payload;
  const requirement =
    payload?.agendaInstallScoreHorizonQuoteAdvancementRequirement;
  if (
    action.side !== "corp" ||
    action.type !== "install_card" ||
    payload?.placement !== "root" ||
    action.source !== agendaCardId ||
    payload.cardId !== agendaCardId ||
    payload.serverId !== serverId ||
    action.expiresAtStateVersion !== view.stateVersion ||
    payload.agendaInstallScoreHorizonQuoteSchemaVersion !==
      CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION ||
    payload.agendaInstallScoreHorizonQuoteCardId !== agendaCardId ||
    payload.agendaInstallScoreHorizonQuoteTargetServerId !== serverId ||
    payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion !==
      view.stateVersion ||
    typeof requirement !== "number" ||
    !Number.isSafeInteger(requirement) ||
    requirement < 0
  ) {
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: "corp",
      stateVersion: view.stateVersion,
      timingPoint: view.timingPoint,
      legalActionTypes: [action.type],
      unresolvedActionIds: [action.actionId],
      owner: "rules_contract",
      removalCondition: `Provide a current agenda install difficulty quote for ${agendaCardId} on ${serverId}.`,
    });
  }
  // Horizon completeness concerns next-turn clicks, not the quoted difficulty.
  return requirement;
}

import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID } from "../../mechanics/public-payload-schema";
import { serverChoiceDisplayLabel } from "../view/server-view";
import type { PublicContextForActionDependencies } from "./public-context-dependencies";

export function applyPublicInstallContext(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
  cardId: CardInstanceId | undefined,
  deps: Pick<PublicContextForActionDependencies, "definitionFor">,
): void {
  if (legalAction.type === "install_card") {
    const definition =
      legalAction.side === "runner" && cardId
        ? deps.definitionFor(state, cardId)
        : undefined;
    if (
      legalAction.payload?.placement === "ice" ||
      legalAction.payload?.placement === "root"
    ) {
      context.installPlacement = legalAction.payload.placement;
    }
    context.zoneLabel =
      legalAction.side === "runner"
        ? definition?.type === "resource"
          ? "Resource"
          : "Rig"
        : legalAction.payload?.placement === "ice"
          ? "ICE"
          : "Remote";
    if (
      legalAction.side === "runner" &&
      legalAction.payload?.runnerProgramTrashBeforeInstall === true
    ) {
      context.abilityId = RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID;
      context.effectKind = "install_card";
      if (definition) {
        context.sourceDefinitionId = definition.id;
        context.installedProgramDefinitionId = definition.id;
      }
      if (legalAction.payload.runnerProgramTrashChoiceOpened === true)
        context.installDeferredForMemory = true;
    }
    if (legalAction.payload?.hiddenRunnerResourceInstall === true) {
      // Hidden Runner resources expose only a stable slot identity at install
      // time; the actual card identity remains private until a reveal path runs.
      context.redactedKind = "hidden_runner_resource";
      context.hiddenRunnerResourceInstall = true;
      if (typeof legalAction.payload.hiddenResourceSlotId === "string")
        context.hiddenResourceSlotId = legalAction.payload.hiddenResourceSlotId;
    }
    for (const key of [
      "agendaPointCostPaid",
      "deckUniqueReplacement",
      "forfeitedAgendaCardId",
      "spentAgendaCardId",
      "iceInstallBaseCost",
      "iceInstallAdditionalCost",
      "iceInstallIncreaseSourceDefinitionIds",
      "iceInstallReduction",
      "iceInstallReductionSourceDefinitionIds",
      "iceInstallTotalCost",
      "installCostPaid",
      "runnerInstallNormalCreditsPaid",
      "runnerInstallHostedCreditsPaid",
      "runnerInstallRecurringCreditsPaid",
      "runnerInstallTemporaryCreditsPaid",
      "runnerInstallPaymentSourceDefinitionIds",
      "recurringCreditsLoaded",
      "rootReplacement",
      "replacedRootCardType",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    const selectedCardId = legalAction.payload?.selectedCardId;
    const selectedTargetIsPublic = (legalAction.targetRequirements ?? []).some(
      (requirement) =>
        requirement.kind === "card" && requirement.visibility === "public",
    );
    const selectedTargetId =
      typeof selectedCardId === "string" && selectedTargetIsPublic
        ? selectedCardId
        : undefined;
    const selectedTarget = selectedTargetId
      ? state.cardInstances[selectedTargetId]
      : undefined;
    const selectedTargetZone = selectedTarget?.zone;
    if (
      selectedTarget !== undefined &&
      selectedTargetId !== undefined &&
      selectedTargetZone?.side === "corp" &&
      selectedTargetZone.zone === "serverIce"
    ) {
      const server = state.corp.servers.find(
        (candidate) => candidate.id === selectedTargetZone.serverId,
      );
      const icePosition = server?.ice.indexOf(selectedTargetId);
      const serverLabel = serverChoiceDisplayLabel(
        state,
        selectedTargetZone.serverId,
      );
      context.selectedTargetServerLabel = serverLabel;
      if (icePosition !== undefined && icePosition >= 0)
        context.selectedTargetIcePosition = icePosition + 1;
      if (selectedTarget.rezzed) {
        context.selectedTargetLabel = deps.definitionFor(
          state,
          selectedTargetId,
        ).title;
      }
    }
  }
}

import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export function buildRunnerProgramTrashBeforeInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
  target?:
    | { kind: "installed_ice"; selectedCardId: CardInstanceId }
    | { kind: "icebreaker_subtype"; selectedSubtype: string },
): LegalAction {
  const targetPayload =
    target?.kind === "installed_ice"
      ? { selectedCardId: target.selectedCardId }
      : target?.kind === "icebreaker_subtype"
        ? { selectedSubtype: target.selectedSubtype }
        : {};
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${definition.title} mit Programmtrash installieren`,
    cardId,
    [{ clicks: 1, credits: definition.installCost ?? 0 }],
    { cardId, ...targetPayload, runnerProgramTrashBeforeInstall: true },
    target?.kind === "installed_ice"
      ? {
          targetRequirements: [
            {
              id: "targetIce",
              kind: "card",
              side: "corp",
              zoneScope: ["corp.servers.ice"],
              visibility: "public",
            },
          ],
        }
      : {},
  );
}

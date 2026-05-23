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
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${definition.title} mit Programmtrash installieren`,
    cardId,
    [{ clicks: 1, credits: definition.installCost ?? 0 }],
    { cardId, runnerProgramTrashBeforeInstall: true },
  );
}

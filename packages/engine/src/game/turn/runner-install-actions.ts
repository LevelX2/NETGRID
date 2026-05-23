import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export function buildRunnerProgramInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${definition.title} installieren`,
    cardId,
    [{ clicks: 1, credits: definition.installCost ?? 0 }],
    { cardId },
  );
}

export function buildRunnerHardwareInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${definition.title} installieren`,
    cardId,
    [{ clicks: 1, credits: definition.installCost ?? 0 }],
    { cardId },
  );
}

export function buildRunnerResourceInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${definition.title} installieren`,
    cardId,
    [{ clicks: 1, credits: definition.installCost ?? 0 }],
    { cardId },
    {
      targetRequirements: [
        {
          id: "resourceCard",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.grip"],
          visibility: "known_to_actor",
        },
      ],
    },
  );
}

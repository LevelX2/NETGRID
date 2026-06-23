import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerInstallToHostActionInput = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  hostCardId: CardInstanceId;
  hostTitle: string;
};

function runnerInstallToHostPayload(
  input: RunnerInstallToHostActionInput,
  overlayInstall = false,
): NonNullable<LegalAction["payload"]> {
  return {
    cardId: input.cardId,
    hostOnCardId: input.hostCardId,
    ...(overlayInstall ? { programOverlayInstallRequested: true } : {}),
  };
}

export function buildRunnerHostedProgramInstallAction(
  state: GameState,
  input: RunnerInstallToHostActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${input.definition.title} in ${input.hostTitle} hosten`,
    input.cardId,
    [{ clicks: 1, credits: input.definition.installCost ?? 0 }],
    runnerInstallToHostPayload(input),
    {
      targetRequirements: [
        {
          id: "hostProgram",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.rig.programs"],
          visibility: "public",
        },
      ],
    },
  );
}

export function buildRunnerZetatechOverlayInstallAction(
  state: GameState,
  input: RunnerInstallToHostActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${input.definition.title} \u00fcber ${input.hostTitle} installieren`,
    input.cardId,
    [{ clicks: 1, credits: input.definition.installCost ?? 0 }],
    runnerInstallToHostPayload(input, true),
    {
      targetRequirements: [
        {
          id: "programOverlayHost",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.rig.programs"],
          visibility: "public",
        },
      ],
    },
  );
}

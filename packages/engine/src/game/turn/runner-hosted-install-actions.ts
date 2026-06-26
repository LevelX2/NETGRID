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
): NonNullable<LegalAction["payload"]> {
  return {
    cardId: input.cardId,
    hostOnCardId: input.hostCardId,
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

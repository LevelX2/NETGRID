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
  const hostZoneScope = runnerHostZoneScope(state, input.hostCardId);
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
          zoneScope: [hostZoneScope],
          targetCardRef: input.hostCardId,
          visibility: "public",
        },
      ],
    },
  );
}

function runnerHostZoneScope(
  state: GameState,
  hostCardId: CardInstanceId,
): "runner.rig.programs" | "runner.rig.hardware" {
  const inPrograms = state.runner.rig.programs.includes(hostCardId);
  const inHardware = state.runner.rig.hardware.includes(hostCardId);
  if (inPrograms === inHardware)
    throw new Error("runtime_invalid_runner_program_install_host_binding");
  return inPrograms ? "runner.rig.programs" : "runner.rig.hardware";
}

import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { buildLegalAction, type LegalActionMetadata } from "./action-builders";

export type RunnerInstallGripTargetId = "hardwareCard" | "resourceCard";

export type RunnerAgendaPointInstallActionInput = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  installAgendaPointCost: number;
  forfeitAgendaCardId: CardInstanceId;
  targetRequirementId: RunnerInstallGripTargetId;
};

export type RunnerSelectedServerInstallActionInput = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  selectedServerId: Exclude<ServerId, "new_remote">;
  selectedServerLabel: string;
};

function runnerGripTargetMetadata(
  targetRequirementId: RunnerInstallGripTargetId,
): LegalActionMetadata {
  return {
    targetRequirements: [
      {
        id: targetRequirementId,
        kind: "card",
        side: "runner",
        zoneScope: ["runner.grip"],
        visibility: "known_to_actor",
      },
    ],
  };
}

export function buildRunnerAgendaPointInstallAction(
  state: GameState,
  input: RunnerAgendaPointInstallActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${input.definition.title} installieren`,
    input.cardId,
    [{ clicks: 1, credits: input.definition.installCost ?? 0 }],
    {
      cardId: input.cardId,
      installAgendaPointCost: input.installAgendaPointCost,
      forfeitAgendaCardId: input.forfeitAgendaCardId,
      installCostReason: "card_implementation_agenda_point_cost",
    },
    runnerGripTargetMetadata(input.targetRequirementId),
  );
}

export function buildRunnerSelectedServerInstallAction(
  state: GameState,
  input: RunnerSelectedServerInstallActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "install_card",
    `${input.definition.title} auf ${input.selectedServerLabel} ausrichten`,
    input.cardId,
    [{ clicks: 1, credits: input.definition.installCost ?? 0 }],
    {
      cardId: input.cardId,
      selectedServerId: input.selectedServerId,
      selectedServerLabel: input.selectedServerLabel,
    },
    runnerGripTargetMetadata("resourceCard"),
  );
}

import type {
  CardDefinition,
  CardInstanceId,
  ServerId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildRunnerAgendaPointInstallAction,
  buildRunnerSelectedServerInstallAction,
} from "./runner-install-context-actions";

function runnerCardDefinition(
  id: string,
  type: CardDefinition["type"],
  title: string,
  installCost: number,
): CardDefinition {
  return {
    id,
    title,
    side: "runner",
    type,
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost,
    rulesText: "",
    mechanics: [],
  };
}

describe("runner install context action builders", () => {
  it("builds the stable agenda-point install action without mutating state", () => {
    const state = createGame({
      seed: "arch-11-runner-agenda-point-install",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "runner_agenda_point_hardware" as CardInstanceId;
    const forfeitAgendaCardId = "runner_scored_agenda" as CardInstanceId;

    const action = buildRunnerAgendaPointInstallAction(state, {
      cardId,
      definition: runnerCardDefinition(
        cardId,
        "hardware",
        "Agenda Cost Hardware",
        3,
      ),
      installAgendaPointCost: 1,
      forfeitAgendaCardId,
      targetRequirementId: "hardwareCard",
    });

    expect(action).toMatchObject({
      actionId:
        "runner.install_card.runner_agenda_point_hardware.runner_agenda_point_hardware",
      side: "runner",
      type: "install_card",
      label: "Agenda Cost Hardware installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 3 }],
      payload: {
        cardId,
        installAgendaPointCost: 1,
        forfeitAgendaCardId,
        installCostReason: "card_implementation_agenda_point_cost",
      },
      targetRequirements: [
        {
          id: "hardwareCard",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.grip"],
          visibility: "known_to_actor",
        },
      ],
      visibility: "public",
    });
    expect(state).toEqual(before);
  });

  it("builds the stable selected-server install action without mutating state", () => {
    const state = createGame({
      seed: "arch-11-runner-selected-server-install",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "runner_data_fort_resource" as CardInstanceId;

    const action = buildRunnerSelectedServerInstallAction(state, {
      cardId,
      definition: runnerCardDefinition(
        cardId,
        "resource",
        "Data Fort Resource",
        2,
      ),
      selectedServerId: "rd" as Exclude<ServerId, "new_remote">,
      selectedServerLabel: "R&D",
    });

    expect(action).toMatchObject({
      actionId:
        "runner.install_card.runner_data_fort_resource.rd.runner_data_fort_resource",
      side: "runner",
      type: "install_card",
      label: "Data Fort Resource auf R&D ausrichten",
      source: cardId,
      costs: [{ clicks: 1, credits: 2 }],
      payload: {
        cardId,
        selectedServerId: "rd",
        selectedServerLabel: "R&D",
      },
      targetRequirements: [
        {
          id: "resourceCard",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.grip"],
          visibility: "known_to_actor",
        },
      ],
      visibility: "public",
    });
    expect(state).toEqual(before);
  });
});

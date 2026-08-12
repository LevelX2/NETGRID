import type { CardDefinition, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildRunnerHardwareInstallAction,
  buildRunnerProgramInstallAction,
  buildRunnerResourceInstallAction,
} from "./runner-install-actions";

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

describe("runner install main actions", () => {
  it("builds a simple Runner program install action with stable ID and payload", () => {
    const state = createGame({
      seed: "arch-6-runner-program-install",
      setupMode: "completed",
    });
    const cardId = "runner_program_test" as CardInstanceId;

    expect(
      buildRunnerProgramInstallAction(
        state,
        cardId,
        runnerCardDefinition(cardId, "program", "Test Program", 2),
      ),
    ).toMatchObject({
      actionId: "runner.install_card.runner_program_test.runner_program_test",
      side: "runner",
      type: "install_card",
      label: "Test Program installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 2 }],
      payload: { cardId },
      targetRequirements: [],
      visibility: "public",
    });
  });

  it("quotes a canonical on-install credit gain on the resource LegalAction", () => {
    const game = createGame({
      seed: "arch-6-runner-resource-install-credit-quote",
      setupMode: "completed",
    });
    expect(
      buildRunnerResourceInstallAction(
        game,
        "loan-instance" as never,
        runnerCardDefinition(
          "onr_v1_168_loan-from-chiba",
          "resource",
          "Credit Exchange",
          0,
        ),
      ).payload,
    ).toMatchObject({
      cardId: "loan-instance",
      gainCreditsAmount: 12,
    });
  });

  it("builds a simple Runner hardware install action with stable ID and payload", () => {
    const state = createGame({
      seed: "arch-6-runner-hardware-install",
      setupMode: "completed",
    });
    const cardId = "runner_hardware_test" as CardInstanceId;

    expect(
      buildRunnerHardwareInstallAction(
        state,
        cardId,
        runnerCardDefinition(cardId, "hardware", "Test Hardware", 3),
      ),
    ).toMatchObject({
      actionId: "runner.install_card.runner_hardware_test.runner_hardware_test",
      side: "runner",
      type: "install_card",
      label: "Test Hardware installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 3 }],
      payload: { cardId },
      targetRequirements: [],
      visibility: "public",
    });
  });

  it("builds a simple Runner resource install action with grip target metadata", () => {
    const state = createGame({
      seed: "arch-6-runner-resource-install",
      setupMode: "completed",
    });
    const cardId = "runner_resource_test" as CardInstanceId;

    expect(
      buildRunnerResourceInstallAction(
        state,
        cardId,
        runnerCardDefinition(cardId, "resource", "Test Resource", 1),
      ),
    ).toMatchObject({
      actionId: "runner.install_card.runner_resource_test.runner_resource_test",
      side: "runner",
      type: "install_card",
      label: "Test Resource installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 1 }],
      payload: { cardId },
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
  });
});

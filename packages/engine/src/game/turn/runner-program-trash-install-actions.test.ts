import type { CardDefinition, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildRunnerProgramTrashBeforeInstallAction } from "./runner-program-trash-install-actions";

function runnerProgramDefinition(
  id: string,
  title: string,
  installCost: number,
): CardDefinition {
  return {
    id,
    title,
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost,
    memoryCost: 1,
    rulesText: "",
    mechanics: [],
  };
}

describe("runner program trash install action builder", () => {
  it("builds the stable Runner program-trash install action without mutating state", () => {
    const state = createGame({
      seed: "arch-9-runner-program-trash-install",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "runner_program_trash_target" as CardInstanceId;

    const action = buildRunnerProgramTrashBeforeInstallAction(
      state,
      cardId,
      runnerProgramDefinition(cardId, "Test Program", 2),
    );

    expect(action).toMatchObject({
      actionId:
        "runner.install_card.runner_program_trash_target.runner_program_trash_target.runner_program_trash_before_install",
      side: "runner",
      type: "install_card",
      label: "Test Program mit Programmtrash installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 2 }],
      payload: { cardId, runnerProgramTrashBeforeInstall: true },
      targetRequirements: [],
      visibility: "public",
    });
    expect(action.payload?.targetCardId).toBeUndefined();
    expect(state).toEqual(before);
  });
});

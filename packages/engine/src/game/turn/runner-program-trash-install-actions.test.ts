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

  it("binds an installed ICE target into the program-trash install action", () => {
    const state = createGame({
      seed: "arch-9-runner-program-trash-install-ice-target",
      setupMode: "completed",
    });
    const cardId = "runner_program_trash_target" as CardInstanceId;
    const targetIceId = "corp_target_ice" as CardInstanceId;

    const action = buildRunnerProgramTrashBeforeInstallAction(
      state,
      cardId,
      runnerProgramDefinition(cardId, "Test Program", 2),
      { kind: "installed_ice", selectedCardId: targetIceId },
    );

    expect(action.actionId).toContain(`.${targetIceId}.`);
    expect(action.actionId).toMatch(/runner_program_trash_before_install$/);
    expect(action.payload).toMatchObject({
      cardId,
      selectedCardId: targetIceId,
      runnerProgramTrashBeforeInstall: true,
    });
    expect(action.targetRequirements).toEqual([
      {
        id: "targetIce",
        kind: "card",
        side: "corp",
        zoneScope: ["corp.servers.ice"],
        visibility: "public",
      },
    ]);
  });

  it("binds an icebreaker subtype into the program-trash install action", () => {
    const state = createGame({
      seed: "arch-9-runner-program-trash-install-subtype",
      setupMode: "completed",
    });
    const cardId = "runner_program_trash_target" as CardInstanceId;

    const action = buildRunnerProgramTrashBeforeInstallAction(
      state,
      cardId,
      runnerProgramDefinition(cardId, "Test Program", 2),
      { kind: "icebreaker_subtype", selectedSubtype: "wall" },
    );

    expect(action.actionId).toContain(".wall.");
    expect(action.actionId).toMatch(/runner_program_trash_before_install$/);
    expect(action.payload).toMatchObject({
      cardId,
      selectedSubtype: "wall",
      runnerProgramTrashBeforeInstall: true,
    });
    expect(action.targetRequirements).toEqual([]);
  });
});

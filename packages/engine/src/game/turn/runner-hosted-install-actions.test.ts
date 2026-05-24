import type { CardDefinition, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildRunnerHostedProgramInstallAction,
  buildRunnerZetatechOverlayInstallAction,
} from "./runner-hosted-install-actions";

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

describe("runner hosted install action builders", () => {
  it("builds the stable daemon-hosted install action without mutating state", () => {
    const state = createGame({
      seed: "arch-10-runner-hosted-install",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "runner_hosted_program" as CardInstanceId;
    const hostCardId = "runner_daemon_host" as CardInstanceId;

    const action = buildRunnerHostedProgramInstallAction(state, {
      cardId,
      definition: runnerProgramDefinition(cardId, "Hosted Program", 3),
      hostCardId,
      hostTitle: "Daemon Host",
    });

    expect(action).toMatchObject({
      actionId:
        "runner.install_card.runner_hosted_program.runner_hosted_program.runner_daemon_host",
      side: "runner",
      type: "install_card",
      label: "Hosted Program in Daemon Host hosten",
      source: cardId,
      costs: [{ clicks: 1, credits: 3 }],
      payload: { cardId, hostOnCardId: hostCardId },
      targetRequirements: [
        {
          id: "hostProgram",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.rig.programs"],
          visibility: "public",
        },
      ],
      visibility: "public",
    });
    expect(action.payload?.v1922ZetatechOverlayInstall).toBeUndefined();
    expect(state).toEqual(before);
  });

  it("builds the stable Zetatech overlay install action without mutating state", () => {
    const state = createGame({
      seed: "arch-10-runner-overlay-install",
      setupMode: "completed",
    });
    const before = structuredClone(state);
    const cardId = "runner_overlay_program" as CardInstanceId;
    const hostCardId = "zetatech_host" as CardInstanceId;

    const action = buildRunnerZetatechOverlayInstallAction(state, {
      cardId,
      definition: runnerProgramDefinition(cardId, "Overlay Program", 2),
      hostCardId,
      hostTitle: "Zetatech Software Installer",
    });

    expect(action).toMatchObject({
      actionId:
        "runner.install_card.runner_overlay_program.runner_overlay_program.zetatech_host",
      side: "runner",
      type: "install_card",
      label: "Overlay Program \u00fcber Zetatech Software Installer installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 2 }],
      payload: {
        cardId,
        hostOnCardId: hostCardId,
        v1922ZetatechOverlayInstall: true,
      },
      targetRequirements: [
        {
          id: "zetatechOverlayHost",
          kind: "card",
          side: "runner",
          zoneScope: ["runner.rig.programs"],
          visibility: "public",
        },
      ],
      visibility: "public",
    });
    expect(state).toEqual(before);
  });
});

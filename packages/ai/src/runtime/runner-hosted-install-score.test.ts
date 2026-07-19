import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerHostedInstallScoreComponent } from "./runner-hosted-install-score";

describe("runnerHostedInstallScoreComponent", () => {
  it("rewards a legal install onto hosted recurring breaker economy", () => {
    const action = hostedInstallAction();

    expect(runnerHostedInstallScoreComponent(input(), action)).toMatchObject({
      key: "runner_hosted_breaker_economy_install",
      value: 1600,
    });
  });

  it("does not reward an ordinary unhosted install", () => {
    const action = hostedInstallAction();
    action.actionId = "runner.install_card.krash.krash";

    expect(runnerHostedInstallScoreComponent(input(), action)).toBeUndefined();
  });

  it("rewards host setup when a breaker can be installed immediately after it", () => {
    const hostInstall = installAction("eurocorpse", 6);
    const breakerInstall = installAction("krash", 3);
    const current = {
      side: "runner",
      legalActions: [hostInstall, breakerInstall],
      playerView: {
        own: {
          credits: 20,
          clicks: 2,
          gripOrHq: [
            {
              instanceId: "eurocorpse",
              definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
              known: true,
            },
            {
              instanceId: "krash",
              definitionId: "onr_v1_039_krash",
              subtypes: ["icebreaker"],
              known: true,
            },
          ],
          rig: [],
        },
      },
    } as unknown as AiDecisionInput;

    expect(
      runnerHostedInstallScoreComponent(current, hostInstall),
    ).toMatchObject({
      key: "runner_hosted_breaker_economy_setup",
      value: 900,
    });
  });

  it("does not treat icebreaker support as a hostable breaker", () => {
    const hostInstall = installAction("eurocorpse", 6);
    const supportInstall = installAction("cortical", 3);
    const current = {
      side: "runner",
      legalActions: [hostInstall, supportInstall],
      playerView: {
        own: {
          credits: 20,
          clicks: 2,
          gripOrHq: [
            {
              instanceId: "eurocorpse",
              definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
              known: true,
            },
            {
              instanceId: "cortical",
              definitionId: "onr_proteus_134_cortical-cybermodem",
              known: true,
            },
          ],
          rig: [],
        },
      },
    } as unknown as AiDecisionInput;

    expect(
      runnerHostedInstallScoreComponent(current, hostInstall),
    ).toBeUndefined();
  });
});

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        gripOrHq: Array.from({ length: 5 }, (_, index) => ({
          instanceId: `grip-${index}`,
          known: true,
        })),
        maxHandSize: 5,
        rig: [
          {
            instanceId: "eurocorpse-1",
            definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
            known: true,
          },
        ],
      },
    },
  } as unknown as AiDecisionInput;
}

function hostedInstallAction(): LegalAction {
  return {
    actionId: "runner.install_card.krash.krash.eurocorpse-1",
    side: "runner",
    type: "install_card",
    source: "krash",
    costs: [{ clicks: 1, credits: 3 }],
  } as LegalAction;
}

function installAction(source: string, credits: number): LegalAction {
  return {
    actionId: `runner.install_card.${source}.${source}`,
    side: "runner",
    type: "install_card",
    source,
    costs: [{ clicks: 1, credits }],
  } as LegalAction;
}

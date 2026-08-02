import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import { persistentDevelopmentActionProjection } from "./persistent-development-action";

describe("persistentDevelopmentActionProjection", () => {
  it("projects direct and program-displacement installs onto the installed card", () => {
    expect(
      persistentDevelopmentActionProjection(
        action("install_card", "program-hand", {
          cardId: "program-hand",
          runnerProgramTrashBeforeInstall: true,
        }),
      ),
    ).toMatchObject({
      route: "direct_install",
      targetCardId: "program-hand",
      developsGripCard: true,
      appliesInstallFitNow: true,
    });
  });

  it("supports both delayed-install payload names through the shared helper", () => {
    for (const payload of [
      { delayedInstallAbility: "set_aside_from_grip" },
      { delayedInstallAbility: "set_aside_from_grip" },
    ]) {
      expect(
        persistentDevelopmentActionProjection(
          action("trigger_ability", "shell-traders", {
            ...payload,
            targetCardId: "program-hand",
          }),
        ),
      ).toMatchObject({
        route: "prepare_delayed_install",
        targetCardId: "program-hand",
        appliesInstallFitNow: true,
      });
    }
  });

  it("does not classify unrelated target actions as card development", () => {
    expect(
      persistentDevelopmentActionProjection(
        action("activated_card_ability", "damage-shield", {
          targetCardId: "program-hand",
        }),
      ),
    ).toBeUndefined();
  });
});

function action(
  type: LegalAction["type"],
  source: string,
  payload: NonNullable<LegalAction["payload"]>,
): LegalAction {
  return {
    actionId: `${type}:${source}`,
    side: "runner",
    type,
    label: `${type}:${source}`,
    source,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload,
  };
}

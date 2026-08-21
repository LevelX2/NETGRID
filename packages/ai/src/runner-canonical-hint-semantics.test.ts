import { describe, expect, it } from "vitest";

import type { AiHintStructuredEffect } from "./hint-ontology";
import {
  runnerEffectsProvideDamagePrevention,
  runnerEffectsProvideBreakerCredits,
  runnerEffectsProvideExposeInformation,
  runnerEffectsProvideMultiaccess,
  runnerEffectsProvideNonNoisyBreakerCredits,
  runnerEffectsProvideSearch,
  runnerEffectsProvideTagPrevention,
  runnerEffectsProvideTopTrashRecovery,
  runnerTargetProfilesProvideSearch,
} from "./runner-canonical-hint-semantics";

function effect(
  value: Partial<AiHintStructuredEffect> &
    Pick<AiHintStructuredEffect, "kind" | "timing" | "scope">,
): AiHintStructuredEffect {
  return value;
}

describe("canonical Runner hint semantics", () => {
  it("recognizes exact expose and top-trash-recovery facts", () => {
    expect(
      runnerEffectsProvideExposeInformation([
        effect({ kind: "expose_info", timing: "action", scope: "server" }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideTopTrashRecovery([
        effect({
          kind: "card_recovery",
          timing: "action",
          scope: "heap",
          resource: "cards",
          target: "move_top_trash_to_grip",
        }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideSearch([
        effect({ kind: "search", timing: "action", scope: "stack" }),
      ]),
    ).toBe(true);

    expect(
      runnerEffectsProvideExposeInformation([
        effect({ kind: "topdeck_info", timing: "persistent", scope: "rnd" }),
      ]),
    ).toBe(false);
    expect(
      runnerEffectsProvideTopTrashRecovery([
        effect({
          kind: "card_recovery",
          timing: "action",
          scope: "heap",
          target: "choose_any_heap_card",
        }),
      ]),
    ).toBe(false);
    expect(
      runnerEffectsProvideSearch([
        effect({ kind: "draw", timing: "action", scope: "runner" }),
      ]),
    ).toBe(false);
  });

  it("recognizes canonical search-install target profiles without treating arbitrary targets as search", () => {
    expect(
      runnerTargetProfilesProvideSearch([
        {
          schemaVersion: "target-profile-v1",
          kind: "search_install_target",
          timing: "activated_ability",
          targetType: "program",
          purpose: "repair_current_rig_gap",
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ]),
    ).toBe(true);
    expect(
      runnerTargetProfilesProvideSearch([
        {
          schemaVersion: "target-profile-v1",
          kind: "use_target",
          timing: "activated_ability",
          targetType: "card",
          purpose: "choose_installed_card",
          hiddenInfoPolicy: "visible_or_known_only",
        },
      ]),
    ).toBe(false);
  });

  it("keeps multiaccess bound to the canonical target server", () => {
    const effects = [
      effect({ kind: "multiaccess", timing: "successful_run", scope: "rnd" }),
    ];
    expect(runnerEffectsProvideMultiaccess(effects, "rd")).toBe(true);
    expect(runnerEffectsProvideMultiaccess(effects, "hq")).toBe(false);
    expect(
      runnerEffectsProvideMultiaccess([
        effect({ kind: "topdeck_info", timing: "persistent", scope: "rnd" }),
      ]),
    ).toBe(false);
  });

  it("distinguishes non-noisy breaker credits from generic recurring credits", () => {
    expect(
      runnerEffectsProvideBreakerCredits([
        effect({
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "icebreaker",
        }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideNonNoisyBreakerCredits([
        effect({
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "non_noisy_icebreaker",
        }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideNonNoisyBreakerCredits([
        effect({
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "link",
        }),
      ]),
    ).toBe(false);
    expect(
      runnerEffectsProvideBreakerCredits([
        effect({
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "link",
        }),
      ]),
    ).toBe(false);
    expect(
      runnerEffectsProvideBreakerCredits([
        effect({
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "killer",
        }),
      ]),
    ).toBe(true);
  });

  it("shares exact damage- and tag-prevention predicates without broad role matches", () => {
    expect(
      runnerEffectsProvideDamagePrevention([
        effect({
          kind: "net_damage_prevention",
          timing: "prevention_window",
          scope: "runner",
        }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideTagPrevention([
        effect({
          kind: "tag_prevention",
          timing: "prevention_window",
          scope: "runner",
        }),
      ]),
    ).toBe(true);
    expect(
      runnerEffectsProvideDamagePrevention([
        effect({ kind: "damage", timing: "on_access", scope: "runner" }),
      ]),
    ).toBe(false);
    expect(
      runnerEffectsProvideTagPrevention([
        effect({ kind: "tag", timing: "action", scope: "runner" }),
      ]),
    ).toBe(false);
  });
});

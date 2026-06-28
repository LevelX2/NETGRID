import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "./runner-visible-breaker-coverage";

describe("visibleBreakerRoles", () => {
  it("derives breaker roles from visible subtypes instead of demo definition ids", () => {
    expect(
      visibleBreakerRoles(visibleProgram("custom-fracter", ["Icebreaker", "Fracter"])),
    ).toEqual(["fracter"]);
    expect(visibleBreakerRoles(visibleProgram("simple_fracter", []))).toEqual([]);
    expect(visibleBreakerRoles(visibleProgram("generic-breaker", ["Icebreaker"]))).toEqual([
      "icebreaker",
    ]);
  });
});

describe("visibleBreakerCardCanAddressIce", () => {
  it("matches structured breaker roles without accepting substring noise", () => {
    expect(canAddress(["support_icebreaker"], "Wall")).toBe(true);
    expect(canAddress(["icebreakerish_noise"], "Wall")).toBe(false);

    expect(canAddress(["support_fracter"], "Barrier")).toBe(true);
    expect(canAddress(["fracterish_noise"], "Barrier")).toBe(false);
    expect(canAddress(["support_fracter"], "Firewall", "Fracter support.")).toBe(
      false,
    );

    expect(canAddress(["support_decoder"], "Code Gate")).toBe(true);
    expect(canAddress(["decoderish_noise"], "Code Gate")).toBe(false);

    expect(canAddress(["support_killer"], "Sentry")).toBe(true);
    expect(canAddress(["killerish_noise"], "Sentry")).toBe(false);
  });
});

function visibleProgram(
  definitionId: string,
  subtypes: string[],
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "program",
    known: true,
    owner: "runner",
    controller: "runner",
    subtypes,
  };
}

function canAddress(
  roles: readonly string[],
  iceText: string,
  breakerText = "Break one ice subroutine.",
): boolean {
  return visibleBreakerCardCanAddressIce(
    visibleProgram("semantic-breaker", ["Icebreaker"]),
    visibleProgram("visible-ice", []),
    {
      visibleBreakerRoles: () => roles,
      visibleCardText: (card) =>
        card.definitionId === "visible-ice"
          ? `${iceText}. End the run.`
          : breakerText,
    },
  );
}

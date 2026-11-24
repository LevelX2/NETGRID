import { describe, expect, it } from "vitest";
import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type { CardDefinitionId, VisibleCard } from "@netgrid/shared";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "./runner-visible-breaker-coverage";

describe("visibleBreakerRoles", () => {
  it("derives breaker roles from visible subtypes instead of demo definition ids", () => {
    expect(
      visibleBreakerRoles(
        visibleProgram(syntheticCardDefinitionId("custom-fracter"), ["Icebreaker", "Fracter"]),
      ),
    ).toEqual(["fracter"]);
    expect(visibleBreakerRoles(visibleProgram(597, []))).toEqual(
      [],
    );
    expect(
      visibleBreakerRoles(visibleProgram(syntheticCardDefinitionId("generic-breaker"), ["Icebreaker"])),
    ).toEqual(["icebreaker"]);
    expect(
      visibleBreakerRoles(
        visibleProgram(syntheticCardDefinitionId("spaced-killer"), [" Icebreaker ", " Killer "]),
      ),
    ).toEqual(["killer"]);
    expect(
      visibleBreakerRoles(
        visibleProgram(syntheticCardDefinitionId("classic-worm"), ["Icebreaker", "Worm"]),
      ),
    ).toEqual(["fracter"]);
  });
});

describe("visibleBreakerCardCanAddressIce", () => {
  it("matches structured breaker roles without accepting substring noise", () => {
    expect(canAddress(["support_icebreaker"], "Wall")).toBe(true);
    expect(canAddress(["icebreakerish_noise"], "Wall")).toBe(false);

    expect(canAddress(["support_fracter"], "Barrier")).toBe(true);
    expect(canAddress(["fracterish_noise"], "Barrier")).toBe(false);
    expect(
      canAddress(["support_fracter"], "Firewall", "Fracter support."),
    ).toBe(false);

    expect(canAddress(["support_decoder"], "Code Gate")).toBe(true);
    expect(canAddress(["decoderish_noise"], "Code Gate")).toBe(false);

    expect(canAddress(["support_killer"], "Sentry")).toBe(true);
    expect(canAddress(["killerish_noise"], "Sentry")).toBe(false);
  });

  it("uses visible breaker text for wall coverage when subtype roles are generic", () => {
    expect(
      canAddress(
        ["icebreaker"],
        "Wall. End the run.",
        "[1]: Break wall subroutine. [2]: +3 strength.",
      ),
    ).toBe(true);
  });

  it("treats an effective structured ICE subtype as authoritative over alternate rules text", () => {
    const pileDriver = visibleProgram(syntheticCardDefinitionId("pile-driver"), ["Icebreaker"]);
    const creditBlocksId = syntheticCardDefinitionId("credit-blocks");
    const creditBlocks = {
      ...visibleProgram(creditBlocksId, ["Sentry"]),
      type: "ice" as const,
      title: "Credit Blocks",
    };
    const visibleText = (card: VisibleCard) =>
      card.definitionId === creditBlocksId
        ? "Sentry. End the run. May become a wall instead of a sentry."
        : "Break up to four wall subroutines on a single piece of ICE.";

    expect(
      visibleBreakerCardCanAddressIce(pileDriver, creditBlocks, {
        visibleBreakerRoles,
        visibleCardText: visibleText,
      }),
    ).toBe(false);
    expect(
      visibleBreakerCardCanAddressIce(
        pileDriver,
        { ...creditBlocks, subtypes: ["Wall"] },
        { visibleBreakerRoles, visibleCardText: visibleText },
      ),
    ).toBe(true);
  });
});

function visibleProgram(definitionId: CardDefinitionId, subtypes: string[]): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: String(definitionId),
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
  const iceDefinitionId = syntheticCardDefinitionId("visible-ice");
  return visibleBreakerCardCanAddressIce(
    visibleProgram(syntheticCardDefinitionId("semantic-breaker"), ["Icebreaker"]),
    visibleProgram(iceDefinitionId, []),
    {
      visibleBreakerRoles: () => roles,
      visibleCardText: (card) =>
        card.definitionId === iceDefinitionId
          ? `${iceText}. End the run.`
          : breakerText,
    },
  );
}

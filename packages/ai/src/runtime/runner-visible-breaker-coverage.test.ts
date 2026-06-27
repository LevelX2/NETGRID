import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { visibleBreakerRoles } from "./runner-visible-breaker-coverage";

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

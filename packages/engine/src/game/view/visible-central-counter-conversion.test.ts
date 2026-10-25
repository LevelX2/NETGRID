import { describe, expect, it } from "vitest";
import type { PlayerView } from "@netgrid/shared";
import { quoteLastCentralCounterConversion } from "./visible-central-counter-conversion";
const definition = "onr_proteus_099_viral-pipeline";
function pools(hq = 1, rd = 1, archives = 0): PlayerView["servers"] {
  return (
    [
      ["hq", "socket_hq", hq],
      ["rd", "socket_rd", rd],
      ["archives", "socket_archives", archives],
    ] as const
  ).map(([id, counterType, amount]) => ({
    id,
    label: id,
    ice: [],
    root: [],
    counterDisplays:
      amount > 0
        ? [
            {
              id: counterType,
              amount,
              displayKind: "virus" as const,
              label: counterType,
              ariaLabel: counterType,
              counterType,
              usageHint: "status_marker" as const,
            },
          ]
        : [],
  }));
}
describe("public last-central-counter rule quote", () => {
  it("quotes the missing Archives success and its actual next-turn effect", () => {
    expect(
      quoteLastCentralCounterConversion(definition, pools(), "archives"),
    ).toEqual({
      complete: true,
      definitionId: definition,
      missingServerId: "archives",
      counterType: "pipe",
      nextCorpTurnActionsDenied: 1,
    });
  });
  it.each([
    [0, 1, 0],
    [1, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
  ])("requires exactly the last missing server (%s,%s,%s)", (hq, rd, a) => {
    expect(
      quoteLastCentralCounterConversion(
        definition,
        pools(hq, rd, a),
        "archives",
      ).complete,
    ).toBe(false);
  });
  it("does not invent an unsupported source or a counter on the wrong central", () => {
    expect(
      quoteLastCentralCounterConversion("onr_v1_039_krash", pools(), "archives")
        .complete,
    ).toBe(false);
    expect(
      quoteLastCentralCounterConversion(definition, pools(), "hq").complete,
    ).toBe(false);
  });
  it("rejects malformed public counters and does not mutate its input", () => {
    const servers = pools(),
      before = JSON.stringify(servers);
    quoteLastCentralCounterConversion(definition, servers, "archives");
    expect(JSON.stringify(servers)).toBe(before);
    servers[0]!.counterDisplays![0]!.amount = -1;
    expect(
      quoteLastCentralCounterConversion(definition, servers, "archives"),
    ).toEqual({ complete: false, reason: "invalid_public_counter" });
  });
});

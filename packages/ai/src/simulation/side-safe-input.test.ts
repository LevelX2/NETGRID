import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { assertAiInputIsSideSafe } from "./side-safe-input";

describe("assertAiInputIsSideSafe", () => {
  it("rejects forbidden hidden-input field tokens", () => {
    expect(
      assertAiInputIsSideSafe({
        cardInstances: {},
      } as unknown as AiDecisionInput),
    ).toBe(false);
  });

  it("bounds forbidden field detection to exact tokens", () => {
    expect(
      assertAiInputIsSideSafe({
        cardInstancesish: {},
        privatePayloadish: "visible test noise",
      } as unknown as AiDecisionInput),
    ).toBe(true);
  });

  it("rejects forbidden tokens in nested string values and arrays", () => {
    expect(
      assertAiInputIsSideSafe({
        playerView: {
          publicEvents: [{ publicPayload: "visible/privatePayload/value" }],
        },
      } as unknown as AiDecisionInput),
    ).toBe(false);
  });

  it("scans shared history objects once without weakening marker checks", () => {
    const publicEvent = {
      eventId: "safe-event",
      publicPayload: { note: "visible" },
    };
    expect(
      assertAiInputIsSideSafe({
        playerView: { publicEvents: [publicEvent] },
        eventTail: [publicEvent],
      } as unknown as AiDecisionInput),
    ).toBe(true);

    const forbiddenEvent = {
      eventId: "unsafe-event",
      publicPayload: { note: "sessionToken" },
    };
    expect(
      assertAiInputIsSideSafe({
        playerView: { publicEvents: [forbiddenEvent] },
        eventTail: [forbiddenEvent],
      } as unknown as AiDecisionInput),
    ).toBe(false);
  });

  it("fails closed for cyclic structures", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() =>
      assertAiInputIsSideSafe(cyclic as unknown as AiDecisionInput),
    ).toThrow(/Cyclic value/);
  });

  it("checks values exposed through JSON serialization hooks", () => {
    expect(
      assertAiInputIsSideSafe({
        playerView: {
          toJSON: () => ({ fullGameState: {} }),
        },
      } as unknown as AiDecisionInput),
    ).toBe(false);
    expect(
      assertAiInputIsSideSafe({
        note: new String("joinToken"),
      } as unknown as AiDecisionInput),
    ).toBe(false);
  });
});

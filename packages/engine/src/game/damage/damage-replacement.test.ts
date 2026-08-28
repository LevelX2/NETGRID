import type {
  GameState,
  ImminentEvent,
  ReplacementCandidate,
  ReplacementWindow,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { replacementChoice } from "./damage-replacement";

describe("damage replacement choice", () => {
  it("offers every applicable replacement candidate plus one explicit decline", () => {
    const candidates = [
      candidate("replacement_a", 82),
      candidate("replacement_b", 80),
    ];
    const window = {
      windowId: "window_1",
      originalEventId: "damage_1",
      eventType: "damage",
      candidates,
      consumedCandidateIds: [],
      createdAtStateVersion: 4,
      optional: true,
    } as ReplacementWindow;
    const event = {
      eventId: "damage_1",
      eventType: "damage",
      affectedSide: "runner",
      payload: { amount: 5, damageType: "meat" },
    } as unknown as ImminentEvent;

    const choice = replacementChoice({} as GameState, window, event, 4);

    expect(choice.options.map((option) => option.id)).toEqual([
      "pass",
      "replacement_a",
      "replacement_b",
    ]);
    expect(choice.options[1]?.metadata).not.toHaveProperty("cardTitle");
    expect(choice.options[2]?.metadata).not.toHaveProperty("cardTitle");
  });
});

function candidate(
  candidateId: string,
  priority: number,
): ReplacementCandidate {
  return {
    candidateId,
    controller: "runner",
    sourceRef: { kind: "test_harness", label: candidateId },
    replacesEventType: "damage",
    replacementEventType: "add_tag",
    priority,
    visibility: "hidden_info_barrier",
    optional: true,
    tagAmount: 1,
  };
}

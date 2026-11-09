import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../input-dto";
import { reconstructBeliefState } from "../belief-state";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep692-gypsy-public-hq-storage.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  checkpoint: { input: AiDecisionInputWithDeckCapabilities };
  enginePublicEvent: PublicGameEvent;
};
function project(change?: "not_stored" | "no_identity" | "private_sentinels") {
  const input = structuredClone(saved.checkpoint.input),
    event = structuredClone(saved.enginePublicEvent);
  if (change === "not_stored") event.publicPayload.agendaStoredInHq = false;
  if (change === "no_identity")
    delete event.publicPayload.storedAgendaDefinitionId;
  if (change === "private_sentinels") {
    event.publicPayload.privateHqOrder = ["private_sentinel_card"];
    event.publicPayload.privateHumanHand = "private_sentinel_hand";
  }
  const replace = (e: PublicGameEvent) =>
    e.eventId === event.eventId ? event : e;
  const params = {
    ...input,
    playerView: {
      ...input.playerView,
      publicEvents: input.playerView.publicEvents.map(replace),
    },
    eventTail: input.eventTail.map(replace),
  };
  return { ...input, ...buildAiDecisionInputDto(params) };
}
it("retains the two published HQ-storage facts through the real native DTO boundary", () => {
  const input = project(),
    event = input.playerView.publicEvents.find((e) => e.eventId === "evt_105");
  expect(event?.publicPayload).toMatchObject({
    agendaStoredInHq: true,
    storedAgendaDefinitionId: "onr_v1_212_priority-requisition",
  });
  expect(
    input.eventTail.find((e) => e.eventId === "evt_105")?.publicPayload,
  ).toMatchObject({
    agendaStoredInHq: true,
    storedAgendaDefinitionId: "onr_v1_212_priority-requisition",
  });
});
it("lets the existing belief owner learn the agenda that the Engine publicly moved to HQ", () => {
  const memory =
    reconstructBeliefState(project()).runnerOpponentModel?.hqHandMemory;
  expect(memory?.knownDefinitions).toContain("onr_v1_212_priority-requisition");
  expect(memory?.invalidationReasons).toContain(
    "gypsy_known_agenda_stored_in_hq:evt_105",
  );
});
it.each(["not_stored", "no_identity"] as const)(
  "does not invent a stored HQ agenda from incomplete public evidence: %s",
  (boundary) => {
    expect(
      reconstructBeliefState(project(boundary)).runnerOpponentModel
        ?.hqHandMemory?.knownDefinitions,
    ).not.toContain("onr_v1_212_priority-requisition");
  },
);
it("retains public knowledge while rejecting unrelated private hand and deck identities", () => {
  const input = project("private_sentinels"),
    serialized = JSON.stringify(input);
  expect(serialized.includes("private_sentinel")).toBe(false);
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory
      ?.knownDefinitions,
  ).toContain("onr_v1_212_priority-requisition");
});

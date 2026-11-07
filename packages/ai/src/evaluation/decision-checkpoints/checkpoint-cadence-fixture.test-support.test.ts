import type { PublicGameEvent } from "@netgrid/shared";
import { expect, it } from "vitest";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

function capture(
  events: Array<Pick<PublicGameEvent, "type" | "publicPayload">>,
) {
  return {
    checkpointId: "cadence-component",
    engine: {
      eventPrefix: events.map((event, index) => ({
        ...event,
        eventId: `evt_${index}`,
        stateVersionBefore: index,
        stateVersionAfter: index + 1,
        stateHashAfter: "fnv1a:00000000",
      })),
    },
  } as unknown as AiDecisionCheckpointV1;
}

it("binds the canonical fixed-central event run after a completed different run", () => {
  const checkpoint = capture([
    { type: "start_run", publicPayload: { actor: "runner", serverId: "rd" } },
    { type: "jack_out", publicPayload: { actor: "runner" } },
    {
      type: "play_event",
      publicPayload: {
        actor: "runner",
        cardDefinitionId: "onr_proteus_101_all-hands",
        serverLabel: "HQ",
      },
    },
    {
      type: "access_card",
      publicPayload: { actor: "runner", serverLabel: "HQ" },
    },
  ]);
  bindHistoricalRunEventCadence(checkpoint);
  expect(checkpoint.engine.eventPrefix[3]!).toMatchObject({
    turnSerial: 0,
    publicPayload: { serverId: "hq", targets: { serverId: "hq" } },
  });
});

it("does not carry a run origin through a recorded jack-out", () => {
  expect(() =>
    bindHistoricalRunEventCadence(
      capture([
        {
          type: "start_run",
          publicPayload: { actor: "runner", serverId: "rd" },
        },
        { type: "jack_out", publicPayload: { actor: "runner" } },
        {
          type: "access_card",
          publicPayload: { actor: "runner", serverId: "rd" },
        },
      ]),
    ),
  ).toThrow("checkpoint_access_without_run_origin");
});

it("rejects a fixed-central event recorded for a different server", () => {
  expect(() =>
    bindHistoricalRunEventCadence(
      capture([
        {
          type: "play_event",
          publicPayload: {
            actor: "runner",
            cardDefinitionId: "onr_proteus_101_all-hands",
            serverLabel: "R&D",
          },
        },
        {
          type: "access_card",
          publicPayload: { actor: "runner", serverId: "rd" },
        },
      ]),
    ),
  ).toThrow("checkpoint_access_without_run_origin");
});

it("does not infer an origin from a chosen-target event without its resolved run facts", () => {
  expect(() =>
    bindHistoricalRunEventCadence(
      capture([
        {
          type: "play_event",
          publicPayload: {
            actor: "runner",
            cardDefinitionId: "onr_v1_094_inside-job",
            serverLabel: "HQ",
          },
        },
        {
          type: "access_card",
          publicPayload: { actor: "runner", serverId: "hq" },
        },
      ]),
    ),
  ).toThrow("checkpoint_access_without_run_origin");
});

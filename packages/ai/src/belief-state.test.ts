import type {
  AiDecisionInput,
  PlayerView,
  PublicGameEvent,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { reconstructBeliefState } from "./belief-state";

describe("belief-state R&D top freshness", () => {
  it("forgets a single known R&D top card after the Runner trashes it with public origin context", () => {
    const accessEvent = publicEvent("evt_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
      title: "South African Mining Corp",
    });
    const trashEvent = publicEvent("evt_2", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverLabel: "R&D",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
      title: "South African Mining Corp",
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, trashEvent]),
    );
    const freshness = belief.runnerOpponentModel?.rndTopFreshness;

    expect(freshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      knownToRunner: true,
      freshenedByRunnerAccess: true,
    });
    expect(freshness?.knownTopDefinitionId).toBeUndefined();
    expect(freshness?.knownSequenceDefinitionIds).toBeUndefined();
    expect(freshness?.invalidationReasons).toContain(
      "rd_access_removed_top_card:evt_2",
    );
  });
});

function runnerInput(events: PublicGameEvent[]): AiDecisionInput {
  const playerView = {
    stateVersion: events.at(-1)?.stateVersionAfter ?? 0,
    own: { gripOrHq: [] },
    opponent: { handCount: 0 },
    servers: [],
    publicEvents: events,
  } as unknown as PlayerView;

  return {
    side: "runner",
    playerView,
    eventTail: events,
    legalActions: [],
    difficulty: "normal",
    seed: "belief-rd-trash-origin",
    decisionId: "belief-rd-trash-origin",
    actionNumber: 1,
    profileId: "test",
  };
}

function publicEvent(
  eventId: string,
  type: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload,
  } as PublicGameEvent;
}

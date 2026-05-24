import type { CardDefinitionId, CardInstance, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  refreshRunnerStackCardZones,
  shuffleRunnerStackAndRefreshZones,
} from "./runner-stack-shuffle";

function instance(
  id: CardInstanceId,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    instanceId: id,
    definitionId: `${id}_definition` as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone,
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
    counters: {},
  };
}

describe("runner stack shuffle boundary", () => {
  it("refreshes only provided runner stack card zones", () => {
    const stackCard = "stack_card" as CardInstanceId;
    const otherCard = "other_card" as CardInstanceId;
    const cardInstances: Record<CardInstanceId, CardInstance> = {
      [stackCard]: instance(stackCard, { side: "runner", zone: "grip" }),
      [otherCard]: instance(otherCard, { side: "runner", zone: "heap" }),
    };

    const result = refreshRunnerStackCardZones({
      stack: [stackCard],
      cardInstances,
    });

    expect(result).toEqual({ updatedCardIds: [stackCard] });
    expect(cardInstances[stackCard]?.zone).toEqual({
      side: "runner",
      zone: "stack",
    });
    expect(cardInstances[otherCard]?.zone).toEqual({
      side: "runner",
      zone: "heap",
    });
  });

  it("uses the provided shuffle callback and preserves the returned order", () => {
    const first = "first" as CardInstanceId;
    const second = "second" as CardInstanceId;
    const cardInstances: Record<CardInstanceId, CardInstance> = {
      [first]: instance(first, { side: "runner", zone: "stack" }),
      [second]: instance(second, { side: "runner", zone: "grip" }),
    };
    const callbackInputs: CardInstanceId[][] = [];

    const result = shuffleRunnerStackAndRefreshZones({
      stack: [first, second],
      cardInstances,
      shuffle: (stack) => {
        callbackInputs.push([...stack]);
        return [second, first];
      },
    });

    expect(callbackInputs).toEqual([[first, second]]);
    expect(result).toEqual({
      shuffledStack: [second, first],
      updatedCardIds: [second, first],
      shufflePerformed: true,
    });
    expect(cardInstances[first]?.zone).toEqual({
      side: "runner",
      zone: "stack",
    });
    expect(cardInstances[second]?.zone).toEqual({
      side: "runner",
      zone: "stack",
    });
  });
});

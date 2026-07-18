import { describe, expect, it } from "vitest";

import { scoringWindowHorizon } from "./semantic-runtime-corp-scoring-window-projection";
import {
  agendaCard,
  corpAction,
  corpInput,
  protectedCentralServers,
  remoteServer,
  testDependencies,
  wallIce,
} from "../semantic-runtime-corp-scoring-window.test-support";

describe("scoringWindowHorizon", () => {
  it("classifies an advance with five counters still needed as slow", () => {
    const agenda = agendaCard("slow-agenda", {
      advancementCounters: 0,
      advancementRequirement: 6,
    });
    const action = advanceAction(agenda.instanceId);
    const input = scorelineInput(agenda, 1);

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "slow",
    );
  });

  it("uses next-turn only when one normal Corp turn can finish advancing", () => {
    const agenda = agendaCard("next-turn-agenda", {
      advancementCounters: 2,
      advancementRequirement: 6,
    });
    const action = advanceAction(agenda.instanceId);
    const input = scorelineInput(agenda, 1);

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "next_turn",
    );
  });

  it("keeps non-completing same-turn advance lines in the next-turn horizon", () => {
    const agenda = agendaCard("same-turn-agenda", {
      advancementCounters: 4,
      advancementRequirement: 6,
    });
    const action = advanceAction(agenda.instanceId);
    const input = scorelineInput(agenda, 2);

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "next_turn",
    );
  });
});

function advanceAction(cardId: string) {
  return corpAction(
    `advance-${cardId}`,
    "advance_card",
    { cardId, serverId: "remote_1" },
    cardId,
  );
}

function scorelineInput(
  agenda: ReturnType<typeof agendaCard>,
  ownClicks: number,
) {
  return corpInput({
    ownClicks,
    servers: protectedCentralServers([
      remoteServer(
        "remote_1",
        [wallIce("remote-wall", { rezzed: true })],
        [agenda],
      ),
    ]),
  });
}

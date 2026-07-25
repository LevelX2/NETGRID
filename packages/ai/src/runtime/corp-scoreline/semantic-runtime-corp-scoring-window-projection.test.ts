import { describe, expect, it } from "vitest";

import {
  scoringWindowHorizon,
  scoringWindowRezBudget,
} from "./semantic-runtime-corp-scoring-window-projection";
import {
  agendaCard,
  corpAction,
  corpInput,
  operationCard,
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

  it("uses the actual five-action pool for a four-advance install closeout", () => {
    const agenda = agendaCard("four-advance-agenda", {
      advancementRequirement: 4,
    });
    const action = corpAction(
      "install-four-advance-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );
    const input = corpInput({
      ownClicks: 5,
      hq: [agenda],
      servers: protectedCentralServers([remoteServer("remote_1", [])]),
    });

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "immediate",
    );
  });

  it("uses an explicit operation play cost for an in-turn advancement burst", () => {
    const agenda = agendaCard("projected-burst-agenda", {
      advancementRequirement: 4,
    });
    const action = corpAction(
      "install-projected-burst-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );
    const consultants = operationCard("project-consultants", {
      definitionId: "onr_v1_300_project-consultants",
      playCost: { kind: "fixed", credits: 12 },
    });
    const input = corpInput({
      ownClicks: 3,
      ownCredits: 12,
      hq: [agenda, consultants],
      servers: protectedCentralServers([remoteServer("remote_1", [])]),
    });

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "immediate",
    );
  });

  it("does not invent a free advancement operation without a play-cost model", () => {
    const agenda = agendaCard("unmodeled-burst-agenda", {
      advancementRequirement: 4,
    });
    const action = corpAction(
      "install-unmodeled-burst-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );
    const consultants = operationCard("project-consultants", {
      definitionId: "onr_v1_300_project-consultants",
    });
    const input = corpInput({
      ownClicks: 3,
      ownCredits: 12,
      hq: [agenda, consultants],
      servers: protectedCentralServers([remoteServer("remote_1", [])]),
    });

    expect(scoringWindowHorizon(input, action, testDependencies())).toBe(
      "slow",
    );
  });
});

describe("scoringWindowRezBudget", () => {
  it.each([
    ["missing", (ice: any) => delete ice.effectiveRezCostQuote],
    [
      "incomplete",
      (ice: any) => {
        ice.effectiveRezCostQuote = {
          context: "installed",
          complete: false,
          cardId: ice.instanceId,
          targetServerId: "remote_1",
          projectedServerId: "remote_1",
          expiresAtStateVersion: 1,
        };
      },
    ],
    [
      "stale",
      (ice: any) => {
        ice.effectiveRezCostQuote.expiresAtStateVersion = 0;
      },
    ],
    [
      "mandatory additional cost",
      (ice: any) => {
        ice.effectiveRezCostQuote.mandatoryAdditionalCosts.agendaPoints = 1;
      },
    ],
  ])(
    "fails closed for a %s installed ICE rez quote",
    (_label, corruptQuote) => {
      const input = corpInput({
        ownCredits: 5,
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall")]),
        ]),
      });
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === "remote_1",
      )!;
      corruptQuote(server.ice[0]);

      expect(scoringWindowRezBudget(input, server, 5)).toMatchObject({
        knowledge: "unknown",
        corpCanRezRelevantIce: false,
        corpCanRezFullPath: false,
        affordableIceCount: 0,
        evidence: expect.arrayContaining([
          "remote_rez_budget:knowledge:unknown",
          "remote_rez_budget:unknown_installed_rez_quote:remote-wall",
        ]),
      });
    },
  );

  it.each([
    ["NaN credits", Number.NaN, 0],
    ["infinite credits", Number.POSITIVE_INFINITY, 0],
    ["negative credits", -1, 0],
    ["fractional credits", 1.5, 0],
    ["unsafe-integer credits", Number.MAX_SAFE_INTEGER + 1, 0],
    ["NaN reserve", 5, Number.NaN],
    ["infinite reserve", 5, Number.POSITIVE_INFINITY],
    ["negative reserve", 5, -1],
    ["fractional reserve", 5, 0.5],
    ["unsafe-integer reserve", 5, Number.MAX_SAFE_INTEGER + 1],
  ])(
    "does not clamp or round %s",
    (_label, creditsAfterAction, reserve) => {
      const input = corpInput({
        ownCredits: 5,
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall")]),
        ]),
      });
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === "remote_1",
      )!;

      expect(
        scoringWindowRezBudget(
          input,
          server,
          creditsAfterAction,
          reserve,
        ),
      ).toMatchObject({
        knowledge: "unknown",
        corpCanRezRelevantIce: false,
        corpCanRezFullPath: false,
        evidence: expect.arrayContaining([
          "remote_rez_budget:knowledge:unknown",
          "remote_rez_budget:invalid_credit_input",
        ]),
      });
    },
  );

  it("does not count zero-cost or already rezzed ICE as newly affordable when the reserve exceeds credits", () => {
    const input = corpInput({
      ownCredits: 2,
      servers: protectedCentralServers([
        remoteServer("remote_1", [
          wallIce("rezzed-wall", { rezzed: true, rezCost: 0 }),
          wallIce("free-unrezzed-wall", { rezCost: 0 }),
        ]),
      ]),
    });
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    )!;

    expect(scoringWindowRezBudget(input, server, 2, 3)).toMatchObject({
      knowledge: "known",
      affordableIceCount: 0,
      affordableRelevantIceCount: 0,
      affordableDurableRelevantIceCount: 0,
      corpCanRezRelevantIce: false,
      corpCanRezFullPath: false,
      evidence: expect.arrayContaining([
        "remote_rez_budget:credits_after_pre_exposure_reserve:-1",
      ]),
    });
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

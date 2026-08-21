import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import {
  runnerArchivesHasQualifiedHiddenPayoff,
  runnerArchivesScoreComponents,
  runnerArchivesSpeculativeProbeDisposition,
} from "./runner-archives-score";

describe("runnerArchivesScoreComponents", () => {
  it("does not treat a lone hidden card as a concrete information plan", () => {
    const input = aiInput({ hiddenArchives: 1, corpDeckCount: 14 });

    expect(components(input)).toEqual([]);
    expect(runnerArchivesHasQualifiedHiddenPayoff(input)).toBe(false);
  });

  it("admits an ordinary probe in exactly one replay-stable bucket out of eight", () => {
    const inputs = Array.from({ length: 64 }, (_value, index) => {
      const input = aiInput({ hiddenArchives: 1, corpDeckCount: 14 });
      input.seed = `archives-probe-seed-${index}`;
      return input;
    });
    const admitted = inputs.find(
      (input) => runnerArchivesSpeculativeProbeDisposition(input).admitted,
    );
    const declined = inputs.find(
      (input) => !runnerArchivesSpeculativeProbeDisposition(input).admitted,
    );
    expect(admitted).toBeDefined();
    expect(declined).toBeDefined();
    expect(runnerArchivesSpeculativeProbeDisposition(admitted!)).toMatchObject({
      admitted: true,
      bucket: 0,
    });
    expect(components(admitted!)).toEqual([
      expect.objectContaining({
        key: "runner_archives_hidden_information",
        value: 35,
        reason: expect.stringContaining(
          "archives_hidden_information_qualified:seeded_one_in_eight_probe",
        ),
      }),
    ]);
    expect(components(declined!)).toEqual([]);
    expect(runnerArchivesSpeculativeProbeDisposition(admitted!)).toEqual(
      runnerArchivesSpeculativeProbeDisposition(admitted!),
    );
  });

  it("values hidden Archives cards while Corp R&D is under pressure", () => {
    const input = aiInput({ hiddenArchives: 1, corpDeckCount: 6 });

    expect(components(input)).toEqual([
      expect.objectContaining({
        key: "runner_archives_hidden_information",
        value: 260,
        reason: expect.stringContaining("archives_corp_deck_pressure:true"),
      }),
    ]);
  });

  it("qualifies hidden Archives information when the Runner is at matchpoint", () => {
    const input = aiInput({ hiddenArchives: 1, corpDeckCount: 14 });
    input.playerView.own.agendaPoints = 6;

    expect(components(input)).toEqual([
      expect.objectContaining({
        key: "runner_archives_hidden_information",
        value: 420,
        reason: expect.stringContaining("archives_runner_matchpoint:true"),
      }),
    ]);

    const twoPointsAway = aiInput({ hiddenArchives: 1, corpDeckCount: 14 });
    twoPointsAway.playerView.own.agendaPoints = 5;
    expect(runnerArchivesHasQualifiedHiddenPayoff(twoPointsAway)).toBe(false);
    expect(components(twoPointsAway)).toEqual([]);
  });

  it("values a still-unseen random HQ discard", () => {
    const randomDiscard = publicEvent(3, {
      actor: "corp",
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_random_discard",
    });
    const input = aiInput({
      hiddenArchives: 1,
      corpDeckCount: 14,
      publicEvents: [randomDiscard],
    });

    expect(components(input)).toEqual([
      expect.objectContaining({
        key: "runner_archives_hidden_information",
        value: 480,
        reason: expect.stringContaining("archives_random_discard_unseen:true"),
      }),
    ]);
  });

  it("admits a large hidden Archives accumulation as a low-value information plan", () => {
    const input = aiInput({ hiddenArchives: 10, corpDeckCount: 14 });

    expect(runnerArchivesHasQualifiedHiddenPayoff(input)).toBe(true);
    expect(components(input)).toEqual([
      expect.objectContaining({
        key: "runner_archives_hidden_information",
        value: 120,
        reason: expect.stringContaining(
          "archives_hidden_information_qualified:large_hidden_accumulation",
        ),
      }),
    ]);
  });

  it("does not invent an Archives information plan without hidden cards", () => {
    const input = aiInput({ hiddenArchives: 0, corpDeckCount: 14 });

    expect(runnerArchivesHasQualifiedHiddenPayoff(input)).toBe(false);
  });

  it("keeps a visible Archives agenda as an unconditional payoff", () => {
    const input = aiInput({ hiddenArchives: 0, corpDeckCount: 14 });
    archives(input).root = [card("agenda", "agenda")];
    input.playerView.opponent.discardCount = 1;

    expect(components(input)).toEqual([
      expect.objectContaining({
        key: "runner_archives_visible_agenda",
        value: 1250,
      }),
    ]);
  });

  it("does not project runner Archives payoff across actor boundaries", () => {
    const corpInput = aiInput({ hiddenArchives: 10, corpDeckCount: 6 });
    corpInput.side = "corp";

    expect(components(corpInput)).toEqual([]);
    expect(runnerArchivesHasQualifiedHiddenPayoff(corpInput)).toBe(false);

    const runnerInput = aiInput({ hiddenArchives: 10, corpDeckCount: 6 });
    const corpAction = { ...startRunArchives(), side: "corp" } as LegalAction;
    expect(
      runnerArchivesScoreComponents(
        runnerInput,
        corpAction,
        archives(runnerInput),
        {
          evaluationForAction: () => ({ accessServerId: "archives" }),
          definitionType: () => "operation",
        },
      ),
    ).toEqual([]);
  });
});

function components(input: AiDecisionInput) {
  return runnerArchivesScoreComponents(
    input,
    startRunArchives(),
    archives(input),
    {
      evaluationForAction: (_input, action) => ({
        accessServerId: action.payload?.serverId === "hq" ? "hq" : "archives",
        pathPassability: "reachable",
      }),
      definitionType: (definitionId) =>
        definitionId === "agenda" ? "agenda" : "operation",
    },
  );
}

function aiInput(params: {
  hiddenArchives: number;
  corpDeckCount: number;
  publicEvents?: PublicGameEvent[];
}): AiDecisionInput {
  const archiveRoot = Array.from({ length: 3 }, (_value, index) =>
    card(`known-operation-${index}`, "operation"),
  );
  const legalActions = [
    startRunArchives(),
    gainCredit(),
    drawCard(),
    endTurn(),
  ];
  const playerView: PlayerView = {
    stateVersion: 5,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: card("runner-identity", "identity", "runner"),
      credits: 5,
      clicks: 1,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: card("corp-identity", "identity", "corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: params.corpDeckCount,
      discardCount: archiveRoot.length + params.hiddenArchives,
      scoreArea: [],
    },
    servers: [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: archiveRoot },
    ],
    publicEvents: params.publicEvents ?? [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.publicEvents ?? [],
    legalActions,
    difficulty: "normal",
    seed: "runner-archives-score-test",
    decisionId: "runner-archives-score-test",
    actionNumber: 5,
    profileId: "runner-archives-score-test",
  };
}

function archives(input: AiDecisionInput) {
  return input.playerView.servers.find((server) => server.id === "archives")!;
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  side: "runner" | "corp" = "corp",
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    type,
    owner: side,
    controller: side,
    known: true,
  };
}

function startRunArchives(): LegalAction {
  return action("runner.start_run.archives", "start_run", {
    serverId: "archives",
  });
}

function gainCredit(): LegalAction {
  return action("runner.gain_credit", "gain_credit");
}

function drawCard(): LegalAction {
  return action("runner.draw_card", "draw_card");
}

function endTurn(): LegalAction {
  return action("runner.end_turn", "end_turn");
}

function action(
  actionId: string,
  type: LegalAction["type"],
  payload?: LegalAction["payload"],
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: type === "end_turn" ? "game_rule" : "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 5,
    ...(payload ? { payload } : {}),
  };
}

function publicEvent(
  stateVersionAfter: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId: `event-${stateVersionAfter}`,
    type: String(publicPayload.actionType ?? "resolve_choice"),
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${String(stateVersionAfter).padStart(8, "0")}`,
    publicPayload,
  };
}

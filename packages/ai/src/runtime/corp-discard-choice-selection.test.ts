import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { selectedCorpDiscardChoiceOptionIds } from "./corp-discard-choice-selection";

describe("selectedCorpDiscardChoiceOptionIds", () => {
  it("counts existing Archives agendas before discarding another agenda at matchpoint", () => {
    const input = discardInput(
      [agenda("agenda-1", 2), operation("operation-1")],
      {
        runnerAgendaPoints: 4,
        count: 1,
        archivesCards: [agenda("already-in-archives", 2)],
      },
    );
    const choice = input.playerView.pendingChoice!;
    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_input, candidate) => ({
        total: candidate.type === "agenda" ? -1_000 : 0,
        planDisposition: "redundant",
      }),
    );
    expect(selection).toMatchObject({
      selectedOptionIds: ["option-operation-1"],
      exposedAgendaPoints: 0,
      terminalAgendaExposure: false,
    });
  });

  it("keeps an immediate terminal Archives exposure ahead of a protected nonagenda route", () => {
    const input = discardInput(
      [agenda("agenda-1", 2), operation("operation-1")],
      {
        runnerAgendaPoints: 4,
        count: 1,
        archivesCards: [agenda("already-in-archives", 2)],
      },
    );
    const choice = input.playerView.pendingChoice!;
    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_input, candidate) => ({
        total: 0,
        planDisposition:
          candidate.type === "agenda" ? "redundant" : "current_plan_route",
      }),
    );
    expect(selection?.selectedOptionIds).toEqual(["option-operation-1"]);
  });

  it("recomputes the whole exposed batch together with the existing Archives points", () => {
    const input = discardInput(
      [agenda("agenda-1", 2), agenda("agenda-2", 2), operation("operation-1")],
      {
        runnerAgendaPoints: 2,
        count: 2,
        archivesCards: [agenda("already-in-archives", 2)],
      },
    );
    const choice = input.playerView.pendingChoice!;
    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_input, candidate) => ({
        total: candidate.type === "agenda" ? -1_000 : 0,
        planDisposition: "redundant",
      }),
    );
    expect(selection).toMatchObject({
      selectedOptionIds: ["option-agenda-1", "option-operation-1"],
      exposedAgendaPoints: 2,
      terminalAgendaExposure: false,
    });
  });

  it("fails closed when an existing reachable Archives agenda has unknown points", () => {
    const unknown = {
      ...agenda("unknown-existing", 2),
      definitionId: "unknown-existing-definition",
    } satisfies VisibleCard;
    delete (unknown as VisibleCard).agendaPoints;
    const input = discardInput(
      [agenda("agenda-1", 2), operation("operation-1")],
      { count: 1, archivesCards: [unknown] },
    );
    const choice = input.playerView.pendingChoice!;
    expect(
      selectedCorpDiscardChoiceOptionIds(input, choice, choice.options, () => ({
        total: 0,
      })),
    ).toBeUndefined();
  });

  it("keeps the aggregate discard batch from exposing matchpoint in open Archives", () => {
    const cards = [
      agenda("agenda-1", 2),
      agenda("agenda-2", 2),
      operation("operation-1"),
      operation("operation-2"),
    ];
    const input = discardInput(cards, { runnerAgendaPoints: 4 });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) => ({
        total: candidate.type === "agenda" ? 100 : 0,
        planDisposition: "redundant",
      }),
    );

    expect(selection).toMatchObject({
      selectedOptionIds: ["option-operation-1", "option-operation-2"],
      archivesReachable: true,
      exposedAgendaPoints: 0,
      terminalAgendaExposure: false,
    });
  });

  it("does not turn agenda protection into a hard ban when the alternative belongs to the current plan", () => {
    const cards = [agenda("agenda-1", 2), operation("operation-1")];
    const input = discardInput(cards, { runnerAgendaPoints: 4, count: 1 });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) =>
        candidate.type === "agenda"
          ? { total: 0, planDisposition: "redundant" }
          : { total: -1_000, planDisposition: "current_plan_route" },
    );

    expect(selection?.selectedOptionIds).toEqual(["option-agenda-1"]);
    expect(selection?.terminalAgendaExposure).toBe(false);
  });

  it("allows an otherwise low-value agenda discard when Archives is not immediately reachable", () => {
    const cards = [agenda("agenda-1", 2), operation("operation-1")];
    const input = discardInput(cards, {
      runnerAgendaPoints: 4,
      count: 1,
      archivesIce: [ice("archives-ice")],
    });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) => ({
        total: candidate.type === "agenda" ? 0 : 500,
        planDisposition: "redundant",
      }),
    );

    expect(selection).toMatchObject({
      selectedOptionIds: ["option-agenda-1"],
      archivesReachable: false,
      exposedAgendaPoints: 2,
      terminalAgendaExposure: false,
    });
  });

  it("fails closed when an agenda in the exact batch has no known point value", () => {
    const unknownAgenda = {
      ...agenda("agenda-unknown", 2),
      agendaPoints: undefined,
      definitionId: "unknown-agenda-definition",
    } as unknown as VisibleCard;
    const input = discardInput([unknownAgenda, operation("operation-1")], {
      count: 1,
    });
    const choice = input.playerView.pendingChoice!;

    expect(
      selectedCorpDiscardChoiceOptionIds(input, choice, choice.options, () => ({
        total: 0,
      })),
    ).toBeUndefined();
  });
});

describe("funded Archives exposure (SP-798)", () => {
  it.each([
    { name: "payable Mastermind", reachable: true, selected: "Minotaur" },
    {
      name: "missing breaker",
      rig: false,
      reachable: false,
      selected: "Corporate War",
    },
    {
      name: "unpayable break",
      runnerCredits: 1,
      reachable: false,
      selected: "Corporate War",
    },
    {
      name: "unfunded rez",
      corpCredits: 6,
      reachable: false,
      selected: "Corporate War",
    },
    {
      name: "missing post-rez quote",
      missingQuote: true,
      reachable: false,
      selected: "Corporate War",
    },
    {
      name: "nonterminal points",
      runnerMatchpoint: false,
      reachable: true,
      selected: "Corporate War",
    },
  ])("binds the legal discard with $name", (testCase) => {
    const input = engineArchivesDiscardInput(testCase);
    const choice = input.playerView.pendingChoice!;
    const action = input.legalActions.find((a) => a.type === "resolve_choice");
    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_input, card) => ({ total: card.type === "agenda" ? 0 : 500 }),
    );
    const expected = choice.options
      .filter((option) => option.label === testCase.selected)
      .sort((a, b) => a.id.localeCompare(b.id, "de"))[0];
    expect(selection).toMatchObject({
      selectedOptionIds: [expected?.id],
      archivesReachable: testCase.reachable,
      terminalAgendaExposure: false,
    });
    expect(action?.choiceRequirements?.[0]).toMatchObject({
      choiceId: choice.choiceId,
      optionIds: expect.arrayContaining([expected?.id]),
    });
    expect(action?.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  });
});

function engineArchivesDiscardInput(options: {
  rig?: boolean;
  runnerCredits?: number;
  corpCredits?: number;
  missingQuote?: boolean;
  runnerMatchpoint?: boolean;
}): AiDecisionInput {
  const state = createGame({
    seed: "sp-798-archives-discard",
    setupMode: "completed",
    runnerDeck: {
      id: "archives-test-runner",
      name: "Archives test Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [{ id: "onr_v1_039_krash", quantity: 6 }],
    },
    corpDeck: {
      id: "archives-test-corp",
      name: "Archives test Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_proteus_030_mastermind", quantity: 1 },
        { id: "onr_v1_196_corporate-war", quantity: 4 },
        { id: "onr_v1_203_hostile-takeover", quantity: 1 },
        { id: "onr_proteus_031_minotaur", quantity: 3 },
      ],
    },
  });
  const card = (definitionId: string) =>
    Object.values(state.cardInstances).find(
      (c) => c.definitionId === definitionId,
    )!;
  const mastermind = card("onr_proteus_030_mastermind");
  const hostile = card("onr_v1_203_hostile-takeover");
  const scored = card("onr_v1_196_corporate-war");
  const archives = state.corp.servers.find((s) => s.id === "archives")!;
  const outsideHq = new Set([
    mastermind.instanceId,
    hostile.instanceId,
    scored.instanceId,
  ]);
  state.corp.hq = [...state.corp.hq, ...state.corp.rd].filter(
    (id) => !outsideHq.has(id),
  );
  state.corp.rd = [];
  for (const id of state.corp.hq)
    state.cardInstances[id]!.zone = { side: "corp", zone: "hq" };
  archives.ice.push(mastermind.instanceId);
  mastermind.zone = { side: "corp", zone: "serverIce", serverId: "archives" };
  state.corp.archives.push(hostile.instanceId);
  hostile.zone = { side: "corp", zone: "archives" };
  state.runner.scoreArea.push(scored.instanceId);
  scored.zone = { side: "runner", zone: "scoreArea" };
  scored.faceup = true;
  if (options.runnerMatchpoint === false) scored.agendaPointsSpent = 1;
  if (options.rig !== false) {
    const krash = card("onr_v1_039_krash");
    state.runner.stack = state.runner.stack.filter(
      (id) => id !== krash.instanceId,
    );
    state.runner.grip = state.runner.grip.filter(
      (id) => id !== krash.instanceId,
    );
    state.runner.rig.programs.push(krash.instanceId);
    state.runner.memoryUsed = 1;
    krash.zone = { side: "runner", zone: "rig" };
    krash.faceup = true;
    krash.rezzed = true;
  }
  state.corp.credits = options.corpCredits ?? 22;
  state.runner.credits = options.runnerCredits ?? 7;
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 0;
  const endTurn = getLegalActions(state, "corp").find(
    (a) => a.type === "end_turn",
  )!;
  const resolved = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: endTurn.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!resolved.ok) throw new Error(JSON.stringify(resolved.error));
  const playerView = getPlayerView(resolved.state, "corp");
  if (options.missingQuote) {
    const ice = playerView.servers.find((s) => s.id === "archives")!.ice[0]!;
    delete ice.effectivePostRezRunQuote;
  }
  return {
    side: "corp",
    playerView,
    legalActions: getLegalActions(resolved.state, "corp"),
    eventTail: playerView.publicEvents,
    difficulty: "hard",
    seed: state.seed,
    decisionId: "sp-798-archives-discard",
    actionNumber: resolved.state.stateVersion,
    profileId: "corp-ai-v0.9-hard",
  };
}

function agenda(instanceId: string, agendaPoints: number): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "agenda",
    agendaPoints,
    known: true,
  } as VisibleCard;
}

function operation(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "operation",
    known: true,
  } as VisibleCard;
}

function ice(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "ice",
    known: true,
  } as VisibleCard;
}

function discardInput(
  cards: VisibleCard[],
  options: {
    count?: number;
    runnerAgendaPoints?: number;
    archivesIce?: VisibleCard[];
    archivesCards?: VisibleCard[];
  } = {},
): AiDecisionInput {
  const count = options.count ?? 2;
  return {
    side: "corp",
    playerView: {
      own: { gripOrHq: cards, heapOrArchives: options.archivesCards ?? [] },
      opponent: { agendaPoints: options.runnerAgendaPoints ?? 0 },
      agendaPointsToWin: 7,
      servers: [
        {
          id: "archives",
          label: "Archives",
          ice: options.archivesIce ?? [],
          root: [],
        },
      ],
      pendingChoice: {
        choiceId: "corp-discard-test",
        kind: "select_cards",
        side: "corp",
        source: "discard_phase",
        minSelections: count,
        maxSelections: count,
        options: cards.map((candidate) => ({
          id: `option-${candidate.instanceId}`,
          label: candidate.title ?? candidate.instanceId,
          value: candidate.instanceId,
        })),
      },
    },
  } as unknown as AiDecisionInput;
}

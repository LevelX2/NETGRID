import { afterEach, describe, expect, it } from "vitest";

import { chooseCorpAction, chooseRunnerAction } from "./index";
import type {
  AiDecisionInput,
  AiDifficulty,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("Semantic AI runtime cutover", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  afterEach(() => {
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
  });

  it("uses semantic runtime as the live runner decision by default", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("remove-tag", "runner", "remove_tag", "Remove tag", {
        credits: 2,
      }),
    ]);
    input.playerView.own.tags = 1;

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("remove-tag");
    expect(decision.reasonCode).toBe("runner.semantic.tag_removal");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_default:true",
        "semantic_runtime_scope:tag_removal",
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("uses semantic runtime as the live corp decision by default", () => {
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("score", "corp", "score_agenda", "Score agenda", {
        credits: 0,
      }),
    ]);

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("score");
    expect(decision.reasonCode).toBe("corp.semantic.simple_score_advance");
    expect(decision.evidence).toContain("semantic_runtime_default:true");
    expect(decision.fallbackUsed).toBe(false);
  });

  it("prefers central ICE protection over another empty remote shell", () => {
    const input = aiInput("corp", [
      legalAction(
        "build-empty-new-remote",
        "corp",
        "install_card",
        "Install ICE protecting a new remote",
        { credits: 0 },
        {
          source: "ice-for-new-remote",
          payload: { placement: "ice", serverId: "new_remote" },
        },
      ),
      legalAction(
        "protect-rd",
        "corp",
        "install_card",
        "Install ICE protecting R&D",
        { credits: 0 },
        { source: "ice-for-rd", payload: { placement: "ice", serverId: "rd" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("ice-for-new-remote", "corp", "ice"),
      visibleCard("ice-for-rd", "corp", "ice"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("remote-ice-1", "corp", "ice")]),
      server("remote_2", [visibleCard("remote-ice-2", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("protect-rd");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_empty_remote_count:2",
        "corp_remote_risk:present",
        "corp_protection:central_ice",
      ]),
    );
  });

  it("defers a new naked remote agenda install when safe alternatives are legal", () => {
    const input = aiInput("corp", [
      legalAction(
        "install-new-remote-agenda",
        "corp",
        "install_card",
        "Install agenda in a new remote",
        { credits: 0 },
        {
          source: "agenda-in-hq",
          payload: { placement: "root", serverId: "new_remote" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-in-hq", "corp", "agenda", {
        advancementRequirement: 3,
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:unsafe_score_action_available",
        "corp_safe_alternative:economy",
      ]),
    );
  });

  it("does not advance a naked remote score line when safe alternatives are legal", () => {
    const remoteAgenda = visibleCard("remote-agenda", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-naked-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [remoteAgenda]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:naked_score_line_present",
        "corp_safe_alternative:economy",
      ]),
    );
  });

  it("keeps a protected remote score line selectable", () => {
    const remoteAgenda = visibleCard("protected-remote-agenda", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-protected-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [visibleCard("remote-protection-ice", "corp", "ice")],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("advance-protected-agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["corp_remote_protection:protected"]),
    );
  });

  it("keeps legacy available only through the explicit runtime kill switch", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("remove-tag", "runner", "remove_tag", "Remove tag", {
        credits: 2,
      }),
    ]);
    input.playerView.own.tags = 1;

    const decision = chooseRunnerAction(input);

    expect(decision.reasonCode).not.toContain(".semantic.");
    expect(decision.evidence).toContain("semantic_runtime_force_legacy");
  });
});

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal" satisfies AiDifficulty,
    seed: "semantic-runtime-cutover-test",
    decisionId: `semantic-runtime-cutover:${side}`,
    actionNumber: 1,
    profileId: `${side}-semantic-runtime-cutover-test`,
  };
}

function playerView(side: Side, legalActions: LegalAction[]): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: identityCard(ownSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identityCard(opponentSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function identityCard(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    | "instanceId"
    | "definitionId"
    | "title"
    | "owner"
    | "controller"
    | "type"
    | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  label: string,
  cost: { credits: number },
  options: {
    source?: LegalAction["source"];
    payload?: LegalAction["payload"];
    visibility?: LegalAction["visibility"];
  } = {},
): LegalAction {
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [cost],
    targetRequirements: [],
    visibility: options.visibility ?? "public",
    expiresAtStateVersion: 2,
  };
  if (options.payload) action.payload = options.payload;
  return action;
}

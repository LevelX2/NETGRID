import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildRunnerRemoteTrashAccessContext } from "./remote-trash-access-context";

describe("buildRunnerRemoteTrashAccessContext", () => {
  it("treats free accessed net-damage ambushes as high-impact trash targets", () => {
    const trash = accessAction("trash-setup", "trash_accessed_card", {
      accessTrashTotalCost: 0,
    });
    const decline = accessAction("decline-setup", "decline_trash");
    const input = runnerAccessInput({
      accessedCard: setupAmbush(),
      legalActions: [trash, decline],
      attackedServerId: "hq",
      credits: 3,
    });

    const trashContext = buildRunnerRemoteTrashAccessContext(input, trash, 2);
    const declineContext = buildRunnerRemoteTrashAccessContext(input, decline, 2);

    expect(trashContext).toMatchObject({
      trashable: true,
      relevant: true,
      affordableRelevant: true,
      highImpact: true,
      role: "ambush",
      trashCost: 0,
      generalCreditCost: 0,
      centralAccess: true,
    });
    expect(declineContext).toMatchObject({
      skippedAffordableRelevant: true,
      highImpact: true,
      role: "ambush",
    });
    expect(trashContext.evidence).toEqual(
      expect.arrayContaining([
        "access_trash_scope:central",
        "remote_trash_role:ambush",
        "remote_trash_cost:0",
      ]),
    );
  });
});

function runnerAccessInput(params: {
  accessedCard: VisibleCard;
  legalActions: LegalAction[];
  attackedServerId: string;
  credits: number;
}): AiDecisionInput {
  const playerView: PlayerView = {
    side: "runner",
    stateVersion: 1,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "access.resolve_card",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: 2,
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
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 3,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
    run: {
      attackedServerId: params.attackedServerId,
      accessedCard: params.accessedCard,
    },
  } as unknown as PlayerView;
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "remote-trash-access-context-test",
    decisionId: "remote-trash-access-context-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function accessAction(
  actionId: string,
  type: "trash_accessed_card" | "decline_trash",
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "game_rule",
    timingPoint: "access.resolve_card",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function setupAmbush(): VisibleCard {
  return {
    instanceId: "setup-accessed",
    definitionId: "onr_v1_340_setup",
    title: "Setup!",
    owner: "corp",
    controller: "corp",
    type: "asset",
    known: true,
    trashCost: 0,
  };
}

function visibleIdentity(side: "runner" | "corp"): VisibleCard {
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

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { runnerAccessTrashScoreComponents } from "./runner-access-trash-score";

describe("runnerAccessTrashScoreComponents", () => {
  it("penalizes declining a free accessed ambush trash target", () => {
    const decline = accessAction("decline-setup", "decline_trash");
    const components = runnerAccessTrashScoreComponents(
      runnerInput([decline]),
      decline,
      {
        trashAccessContext: () => ({
          trashable: true,
          affordableRelevant: true,
          highImpact: true,
          trashCost: 0,
          generalCreditCost: 0,
          creditsAfterGeneralTrash: 3,
          reserveTarget: 2,
          deferredByBudget: false,
          centralAccess: true,
          accessServerId: "hq",
          targetType: "asset_node",
          role: "ambush",
        }),
      },
    );

    expect(components).toContainEqual(
      expect.objectContaining({
        key: "runner_decline_relevant_trash",
        value: -1800,
        reason: "ambush",
      }),
    );
  });

  it("does not treat an installed central-root card as low Corp investment", () => {
    const trash = accessAction("trash-root", "trash_accessed_card");
    const current = runnerInput([trash]);
    current.playerView.own.credits = 18;

    const components = runnerAccessTrashScoreComponents(current, trash, {
      trashAccessContext: () => ({
        trashable: true,
        affordableRelevant: true,
        highImpact: true,
        trashCost: 2,
        generalCreditCost: 2,
        creditsAfterGeneralTrash: 16,
        reserveTarget: 4,
        deferredByBudget: false,
        centralAccess: true,
        installedRootAccess: true,
        accessServerId: "hq",
        targetType: "upgrade",
        role: "tag_punish",
      }),
    });

    expect(components.map((component) => component.key)).not.toContain(
      "runner_central_access_trash_low_corp_investment",
    );
    expect(components).toContainEqual(
      expect.objectContaining({
        key: "runner_trash_affordability",
        value: 220,
      }),
    );
  });

  it("protects the central economy-trash reserve at Corp matchpoint", () => {
    const trash = accessAction("trash-economy", "trash_accessed_card");
    const decline = accessAction("decline-economy", "decline_trash");
    const current = runnerInput([trash, decline]);
    current.playerView.own.credits = 5;
    current.playerView.opponent.agendaPoints = 6;
    const context = {
      trashable: true,
      affordableRelevant: true,
      highImpact: true,
      trashCost: 3,
      generalCreditCost: 3,
      creditsAfterGeneralTrash: 2,
      reserveTarget: 4,
      deferredByBudget: false,
      centralAccess: true,
      accessServerId: "rd",
      targetType: "asset",
      role: "economy",
    } as const;

    expect(
      runnerAccessTrashScoreComponents(current, trash, {
        trashAccessContext: () => context,
      }),
    ).toContainEqual(
      expect.objectContaining({
        key: "runner_matchpoint_central_economy_trash_reserve",
        value: -3200,
      }),
    );
    expect(
      runnerAccessTrashScoreComponents(current, decline, {
        trashAccessContext: () => context,
      }),
    ).toContainEqual(
      expect.objectContaining({
        key: "runner_decline_matchpoint_central_economy_trash",
        value: 2400,
      }),
    );
  });

  it("does not protect the reserve when central trash leaves a real surplus", () => {
    const trash = accessAction("trash-economy", "trash_accessed_card");
    const current = runnerInput([trash]);
    current.playerView.own.credits = 12;
    current.playerView.opponent.agendaPoints = 6;
    const components = runnerAccessTrashScoreComponents(current, trash, {
      trashAccessContext: () => ({
        trashable: true,
        affordableRelevant: true,
        highImpact: true,
        trashCost: 3,
        generalCreditCost: 3,
        creditsAfterGeneralTrash: 9,
        reserveTarget: 4,
        deferredByBudget: false,
        centralAccess: true,
        accessServerId: "rd",
        targetType: "asset",
        role: "economy",
      }),
    });

    expect(components.map((component) => component.key)).not.toContain(
      "runner_matchpoint_central_economy_trash_reserve",
    );
  });

  it("does not protect a run reserve without a remaining run click", () => {
    const trash = accessAction("trash-economy", "trash_accessed_card");
    const current = runnerInput([trash]);
    current.playerView.own.credits = 5;
    current.playerView.own.clicks = 0;
    current.playerView.opponent.agendaPoints = 6;

    expect(
      runnerAccessTrashScoreComponents(current, trash, {
        trashAccessContext: () => economyContext(),
      }).map((component) => component.key),
    ).not.toContain("runner_matchpoint_central_economy_trash_reserve");
  });

  it("does not protect a run reserve when no server has visible access payoff", () => {
    const trash = accessAction("trash-economy", "trash_accessed_card");
    const current = runnerInput([trash]);
    current.playerView.own.credits = 5;
    current.playerView.opponent.agendaPoints = 6;
    current.playerView.opponent.handCount = 0;
    current.playerView.opponent.deckCount = 0;
    current.playerView.servers = [];

    expect(
      runnerAccessTrashScoreComponents(current, trash, {
        trashAccessContext: () => economyContext(),
      }).map((component) => component.key),
    ).not.toContain("runner_matchpoint_central_economy_trash_reserve");
  });

  it("does not preserve the reserve over high remaining finite-pool economy", () => {
    const trash = accessAction("trash-economy", "trash_accessed_card");
    const current = runnerInput([trash]);
    current.playerView.own.credits = 5;
    current.playerView.opponent.agendaPoints = 6;

    expect(
      runnerAccessTrashScoreComponents(current, trash, {
        trashAccessContext: () => ({
          ...economyContext(),
          finitePoolEconomy: true,
          corpValueRemaining: 9,
        }),
      }).map((component) => component.key),
    ).not.toContain("runner_matchpoint_central_economy_trash_reserve");
  });
});

function economyContext() {
  return {
    trashable: true,
    affordableRelevant: true,
    highImpact: true,
    trashCost: 3,
    generalCreditCost: 3,
    creditsAfterGeneralTrash: 2,
    reserveTarget: 4,
    deferredByBudget: false,
    centralAccess: true,
    accessServerId: "rd",
    targetType: "asset",
    role: "economy",
  } as const;
}

function runnerInput(legalActions: LegalAction[]): AiDecisionInput {
  const playerView: PlayerView = {
    side: "runner",
    stateVersion: 1,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "access.resolve_card",
    own: {
      identity: visibleIdentity("runner"),
      credits: 3,
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
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-access-trash-score-test",
    decisionId: "runner-access-trash-score-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function accessAction(
  actionId: string,
  type: "trash_accessed_card" | "decline_trash",
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

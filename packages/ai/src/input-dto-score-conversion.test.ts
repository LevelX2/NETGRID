import { describe, expect, it } from "vitest";
import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { buildAiDecisionInputDto } from "./input-dto";

describe("AI input DTO score-conversion contract", () => {
  it("preserves exact public score-conversion capabilities and drops unknown payload data", () => {
    const action = conversionAction();
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "score-conversion-dto",
      decisionId: "score-conversion-dto:corp:1",
      actionNumber: 1,
      profileId: "score-conversion-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("preserves side-safe hosted-credit and run-action semantics", () => {
    const action = runnerSemanticAction();
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-action-semantics-dto",
      decisionId: "runner-action-semantics-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-action-semantics-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("preserves actor-visible self-damage costs and prevention status", () => {
    const action = runnerSemanticAction();
    action.payload = {
      ...action.payload,
      xValue: 2,
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-self-damage-dto",
      decisionId: "runner-self-damage-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-self-damage-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      xValue: 2,
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    });
  });

  it("preserves the public selected-server binding for server-tax installs", () => {
    const action = runnerSemanticAction();
    action.payload = {
      ...action.payload,
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
      privateSelectedCardId: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-selected-server-dto",
      decisionId: "runner-selected-server-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-selected-server-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateSelectedCardId",
    );
  });

  it("preserves actor-visible encounter subroutine targets", () => {
    const action = runnerSemanticAction();
    action.type = "break_subroutine";
    action.payload = {
      ...action.payload,
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
      privateEncounterProbe: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-encounter-target-dto",
      decisionId: "runner-encounter-target-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-encounter-target-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateEncounterProbe",
    );
  });

  it("preserves public remote-root structure without exposing card identities", () => {
    const action = runnerSemanticAction();
    const events: PublicGameEvent[] = [
      publicEvent("install", {
        actor: "corp",
        actionType: "install_card",
        serverLabel: "Remote 1",
        installPlacement: "root",
        rootReplacement: "asset_to_agenda",
        replacedRootCardType: "asset",
        replacedRootCardId: "must-not-cross-dto",
      }),
      publicEvent("score", {
        actor: "corp",
        actionType: "score_agenda",
        targets: {
          scoredFromServerId: "remote-1",
          scoredCardId: "must-not-cross-dto",
        },
      }),
    ];
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: events,
      legalActions: [action],
      difficulty: "normal",
      seed: "remote-root-structure-dto",
      decisionId: "remote-root-structure-dto:runner:1",
      actionNumber: 1,
      profileId: "remote-root-structure-dto-test",
    });

    expect(input.eventTail[0]?.publicPayload).toMatchObject({
      rootReplacement: "asset_to_agenda",
      replacedRootCardType: "asset",
    });
    expect(input.eventTail[0]?.publicPayload).not.toHaveProperty(
      "replacedRootCardId",
    );
    expect(input.eventTail[1]?.publicPayload.targets).toEqual({
      scoredFromServerId: "remote-1",
    });
  });
});

function publicEvent(
  eventId: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "game_event"),
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `hash-${eventId}`,
    publicPayload,
  };
}

function conversionAction(): LegalAction {
  return {
    actionId: "corp.score-conversion.move",
    side: "corp",
    type: "activated_card_ability",
    label: "Advancement-Counter bewegen",
    source: "corp-conversion-source",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "corp-conversion-source",
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
      privateProbe: "must-not-cross-dto",
    },
  };
}

function runnerSemanticAction(): LegalAction {
  return {
    actionId: "runner.hosted-credit.build",
    side: "runner",
    type: "activated_card_ability",
    label: "Credit-Bank laden",
    source: "runner-bank",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "runner-bank",
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
      privateProbe: "must-not-cross-dto",
    },
  };
}

function playerView(
  action: LegalAction,
  side: "corp" | "runner" = "corp",
): PlayerView {
  const corpIdentity = identity("corp");
  const runnerIdentity = identity("runner");
  return {
    side,
    stateVersion: 1,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    activeSide: side,
    phase: "action",
    own: {
      identity: side === "corp" ? corpIdentity : runnerIdentity,
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 40,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: side === "corp" ? runnerIdentity : corpIdentity,
      credits: 5,
      clicks: 4,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      coreDamage: 0,
      deckCount: 40,
      discardCount: 0,
      discardCards: [],
      scoreArea: [],
      rig: [],
      memoryUsed: 0,
      memoryLimit: 4,
    },
    servers: [],
    publicEvents: [],
    legalActions: [action],
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function identity(side: "corp" | "runner"): VisibleCard {
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

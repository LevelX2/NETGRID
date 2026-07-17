import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import { runnerDamageThreatAssessment } from "./runner-damage-threat-assessment";
import { runnerHandBufferNeedScoreComponent } from "./runtime/runner-hand-buffer-need";

describe("runner damage threat model v2 red evidence", () => {
  it("does not treat Runner self-damage as Corp damage-deck evidence", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 3,
        turnSerial: 8,
        events: [
          event("runner-self-damage", 31, 8, {
            actor: "runner",
            actionType: "core_damage",
            damageType: "core",
            damageAmount: 1,
            sourceDefinitionId: "onr_v1_093_if-you-want-it-done-right",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "none",
        resolvedCorpDamageEvents: 0,
      },
      flatlineRisk: { level: "none" },
    });
  });

  it("separates a fully prevented Corp damage attempt from resolved damage", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 3,
        turnSerial: 8,
        events: [
          event("prevented-corp-damage", 31, 8, {
            actor: "corp",
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 0,
            damageResolved: true,
            sourceDefinitionId: "onr_v1_340_setup",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "suspected",
        resolvedCorpDamageEvents: 0,
        attemptedCorpDamageEvents: 1,
      },
      flatlineRisk: {
        level: "suspected",
        recentResolvedCorpDamageEvents: 0,
      },
    });
  });

  it("does not promote an unprofiled generic trace event to damage belief", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 3,
        turnSerial: 8,
        events: [
          event("generic-trace", 31, 8, {
            actor: "corp",
            actionType: "trace",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: { level: "none" },
      flatlineRisk: { level: "none" },
    });
  });

  it("confirms deck belief from independent visible delivery and payoff", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        turnSerial: 8,
        events: [
          event("seen-chance-observation", 27, 7, {
            actor: "runner",
            actionType: "access_card",
            cardDefinitionId: "onr_v1_284_chance-observation",
          }),
          event("seen-urban-renewal", 29, 7, {
            actor: "runner",
            actionType: "access_card",
            cardDefinitionId: "onr_v1_307_urban-renewal",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "confirmed",
        visibleDeliverySourceCount: 1,
        visibleDamagePayoffCount: 1,
      },
    });
  });

  it("keeps confirmed deck knowledge while acute risk decays by turns", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        turnSerial: 12,
        events: [
          event("resolved-corp-damage", 18, 6, {
            actor: "corp",
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 2,
            damageResolved: true,
            sourceDefinitionId: "onr_v1_340_setup",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "confirmed",
        resolvedCorpDamageEvents: 1,
      },
      flatlineRisk: {
        level: "suspected",
        turnsSinceLatestResolvedCorpDamage: 6,
        recentResolvedCorpDamageEvents: 0,
      },
    });
  });

  it("caps the durable hand target at the effective maximum", () => {
    const current = input({
      handCount: 2,
      maxHandSize: 2,
      credits: 6,
      clicks: 1,
      turnSerial: 8,
      events: [
        event("resolved-core-damage", 31, 8, {
          actor: "corp",
          actionType: "core_damage",
          damageType: "core",
          damageAmount: 3,
          damageResolved: true,
          sourceDefinitionId: "onr_v1_258_neural-blade",
        }),
      ],
    });

    expect(runnerDamageThreatAssessment(current)).toMatchObject({
      flatlineRisk: {
        level: "confirmed",
        recommendedHandFloor: 2,
        handBufferHeadroom: 0,
      },
    });
    expect(
      runnerHandBufferNeedScoreComponent(current, {
        actionId: "draw",
        side: "runner",
        type: "draw_card",
        label: "Draw",
        source: "basic_action",
        timingPoint: "runner_action.main",
        costs: [{ clicks: 1 }],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: current.playerView.stateVersion,
      }),
    ).toBeUndefined();
  });

  it("allows a temporary overdraw only before a concrete risky run", () => {
    const current = input({
      handCount: 2,
      maxHandSize: 2,
      credits: 6,
      clicks: 2,
      turnSerial: 8,
      events: [
        event("resolved-net-damage", 31, 8, {
          actor: "corp",
          actionType: "net_damage",
          damageType: "net",
          damageAmount: 1,
          damageResolved: true,
          sourceDefinitionId: "onr_v1_258_neural-blade",
        }),
      ],
    });
    current.playerView.servers[1]!.ice = [
      {
        instanceId: "unknown-rd-ice",
        owner: "corp",
        controller: "corp",
        known: false,
        rezzed: false,
      } as VisibleCard,
    ];
    const drawAction = basicAction(current, "draw", "draw_card");
    const runAction = {
      ...basicAction(current, "run-rd", "start_run"),
      payload: { serverId: "rd" },
    } as LegalAction;
    current.legalActions = [drawAction, runAction];

    expect(
      runnerHandBufferNeedScoreComponent(current, drawAction),
    ).toMatchObject({
      key: "runner_hand_buffer_need",
      reason: expect.stringContaining("buffer_mode:temporary_before_risky_run"),
    });
  });

  it("does not overdraw when an immediate agenda score is legal", () => {
    const current = input({
      handCount: 2,
      maxHandSize: 2,
      credits: 6,
      clicks: 2,
      turnSerial: 8,
      events: [
        event("resolved-net-damage", 31, 8, {
          actor: "corp",
          actionType: "net_damage",
          damageType: "net",
          damageAmount: 1,
          damageResolved: true,
          sourceDefinitionId: "onr_v1_258_neural-blade",
        }),
      ],
    });
    current.playerView.servers[1]!.ice = [
      {
        instanceId: "unknown-rd-ice",
        owner: "corp",
        controller: "corp",
        known: false,
        rezzed: false,
      } as VisibleCard,
    ];
    const drawAction = basicAction(current, "draw", "draw_card");
    const runAction = {
      ...basicAction(current, "run-rd", "start_run"),
      payload: { serverId: "rd" },
    } as LegalAction;
    const scoreAction = {
      ...basicAction(current, "score-agenda", "activated_card_ability"),
      payload: { cardImplementationScoresSourceAsAgenda: true },
    } as LegalAction;
    current.legalActions = [drawAction, runAction, scoreAction];

    expect(
      runnerHandBufferNeedScoreComponent(current, drawAction),
    ).toBeUndefined();
  });
});

function basicAction(
  current: AiDecisionInput,
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: current.playerView.stateVersion,
  } as LegalAction;
}

function input(params: {
  handCount: number;
  turnSerial: number;
  events?: readonly PublicGameEvent[];
  maxHandSize?: number;
  credits?: number;
  clicks?: number;
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 40,
      turnSerial: params.turnSerial,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "action",
      own: {
        identity: card("runner-identity", "identity", "runner"),
        credits: params.credits ?? 5,
        clicks: params.clicks ?? 4,
        agendaPoints: 0,
        gripOrHq: Array.from({ length: params.handCount }, (_, index) =>
          card(`runner-hand-${index}`, "event", "runner"),
        ),
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        maxHandSize: params.maxHandSize ?? 5,
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
        deckCount: 20,
        discardCount: 0,
        discardCards: [],
        scoreArea: [],
        rig: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [...(params.events ?? [])],
      legalActions: [],
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    profileId: "runner-ai-v2-red-evidence",
    difficulty: "hard",
    seed: "runner-damage-threat-model-v2",
    decisionId: "runner-damage-threat-model-v2.1",
    actionNumber: 1,
  } as unknown as AiDecisionInput;
}

function event(
  eventId: string,
  stateVersionAfter: number,
  turnSerial: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "game_event"),
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    turnSerial,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  } as PublicGameEvent;
}

function card(
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  owner: "corp" | "runner",
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    owner,
    controller: owner,
    type,
    known: true,
  } as VisibleCard;
}

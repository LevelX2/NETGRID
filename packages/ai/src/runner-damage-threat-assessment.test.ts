import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import {
  runnerDamageLockedHandScoreComponents,
  runnerDamageThreatAssessment,
  runnerKnownAccessDamageScoreComponent,
} from "./runner-damage-threat-assessment";

describe("runnerDamageThreatAssessment", () => {
  it("raises a warning from a previously revealed trace-tag operation", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        stateVersion: 12,
        events: [
          event("seen-chance-observation", 10, {
            actionType: "access_card",
            cardDefinitionId: "onr_v1_284_chance-observation",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "suspected",
        visibleDeliverySourceCount: 1,
        signalScore: 1,
      },
      flatlineRisk: { level: "suspected", recommendedHandFloor: 2 },
    });
    expect(assessment.deckBelief.signalKinds).toContain("trace_tag_source");
  });

  it("confirms deck belief without keeping an inactive window acute", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        stateVersion: 14,
        events: [
          event("seen-chance-observation", 10, {
            actionType: "access_card",
            cardDefinitionId: "onr_v1_284_chance-observation",
          }),
          event("seen-urban-renewal", 12, {
            actionType: "access_card",
            cardDefinitionId: "onr_v1_307_urban-renewal",
          }),
        ],
      }),
    );

    expect(assessment).toMatchObject({
      deckBelief: {
        level: "confirmed",
        visibleDamageSourceCount: 1,
        visibleDeliverySourceCount: 1,
        visibleDamagePayoffCount: 1,
      },
      flatlineRisk: {
        level: "suspected",
        recommendedHandFloor: 2,
      },
    });
    expect(assessment.deckBelief.signalKinds).toEqual(
      expect.arrayContaining([
        "damage_delivery_combo",
        "damage_source",
        "punish_payoff",
        "trace_tag_source",
      ]),
    );
  });

  it("does not infer punish cards from unknown opponent hand slots", () => {
    expect(
      runnerDamageThreatAssessment(
        input({ handCount: 4, stateVersion: 14, opponentHandCount: 5 }),
      ),
    ).toMatchObject({
      deckBelief: { level: "none", signalScore: 0 },
      flatlineRisk: { level: "none" },
    });
  });

  it("does not turn a tag by itself into damage evidence", () => {
    const tagged = input({ handCount: 1, stateVersion: 14 });
    tagged.playerView.own.tags = 1;

    expect(runnerDamageThreatAssessment(tagged)).toMatchObject({
      deckBelief: { level: "none", signalScore: 0 },
      flatlineRisk: { level: "none", recommendedHandFloor: 1 },
    });
  });

  it("does not mistake generic trace ice plus a non-damage access ambush for a damage deck", () => {
    expect(
      runnerDamageThreatAssessment(
        input({
          handCount: 1,
          stateVersion: 14,
          servers: [
            {
              id: "remote_1",
              ice: [
                card({
                  definitionId: "onr_v1_264_rex",
                  type: "ice",
                  rezzed: true,
                }),
              ],
              root: [
                card({
                  definitionId: "onr_v1_315_corprunners-shattered-remains",
                  type: "asset",
                  rezzed: true,
                }),
              ],
            },
          ],
        }),
      ),
    ).toMatchObject({
      deckBelief: {
        level: "none",
        visibleDamageSourceCount: 0,
        visibleDeliverySourceCount: 0,
        independentSignalDefinitionCount: 0,
        signalScore: 0,
      },
      flatlineRisk: { level: "none" },
    });
  });

  it("treats recent visible damage at empty hand as critical survival pressure", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 0,
        stateVersion: 39,
        events: [
          event("setup-net-damage", 32, {
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 2,
            sourceTitle: "Setup!",
          }),
        ],
        servers: [
          {
            id: "rd",
            ice: [card({ definitionId: "rd-ice", type: "ice", rezzed: false })],
            root: [],
          },
        ],
      }),
    );

    expect(assessment).toMatchObject({
      flatlineRisk: {
        level: "critical",
        handCount: 0,
        recommendedHandFloor: 3,
        criticalRunSuppression: true,
      },
    });
    expect(assessment.flatlineRisk.riskyRunServerIds).toEqual(["rd"]);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_flatline_risk_level:critical",
        "runner_flatline_risk_risky_servers:rd",
      ]),
    );
  });

  it("decays stale one-off damage evidence below confirmed pressure", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        stateVersion: 40,
        events: [
          event("old-net-damage", 2, {
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 1,
            sourceTitle: "Old trace",
          }),
        ],
      }),
    );

    expect(assessment.flatlineRisk.level).toBe("suspected");
    expect(assessment.flatlineRisk.recommendedHandFloor).toBe(2);
    expect(assessment.flatlineRisk.criticalRunSuppression).toBe(false);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_damage_deck_belief_level:confirmed",
        "runner_flatline_risk_level:suspected",
        "runner_flatline_risk_legacy_state_distance:38",
      ]),
    );
  });

  it("penalizes continuing into the sole known advanced access-damage ambush", () => {
    const continueRun: LegalAction = {
      actionId: "continue-run",
      side: "runner",
      type: "continue_run",
      label: "Continue",
      source: "game_rule",
      timingPoint: "run.jack_out_window",
      costs: [],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 25,
    };
    const current = input({
      handCount: 4,
      stateVersion: 25,
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [
            card({
              definitionId: "onr_v1_346_vacant-soulkiller",
              type: "asset",
              rezzed: true,
              advancementCounters: 2,
            }),
          ],
        },
      ],
    });
    current.playerView.timingPoint = "run.jack_out_window";
    current.playerView.run = {
      attackedServerId: "remote_1",
      phase: "movement",
      position: { kind: "server", serverId: "remote_1" },
      successful: false,
    };

    expect(runnerKnownAccessDamageScoreComponent(current, continueRun)).toEqual(
      expect.objectContaining({
        key: "runner_known_access_damage_ambush",
        value: -2600,
      }),
    );
  });

  it("prefers liquid reaction reserve when core damage locks the last-click hand buffer", () => {
    const current = input({
      handCount: 3,
      maxHandSize: 3,
      credits: 6,
      clicks: 1,
      stateVersion: 39,
      events: [
        event("recent-core-damage", 37, {
          actionType: "core_damage",
          damageType: "core",
          damageAmount: 2,
        }),
      ],
    });
    const gain = action("gain", "gain_credit", "basic_action");
    const draw = action("draw", "draw_card", "basic_action");
    const install = action(
      "install",
      "install_card",
      current.playerView.own.gripOrHq[0]!.instanceId,
    );

    expect(runnerDamageThreatAssessment(current)).toMatchObject({
      flatlineRisk: {
        level: "confirmed",
        effectiveMaxHandSize: 3,
        handBufferHeadroom: 0,
      },
    });
    expect(runnerDamageLockedHandScoreComponents(current, gain)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_damage_locked_hand_reaction_reserve",
          value: 650,
        }),
      ]),
    );
    expect(runnerDamageLockedHandScoreComponents(current, draw)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_damage_locked_hand_last_click_draw",
          value: -450,
        }),
      ]),
    );
    expect(runnerDamageLockedHandScoreComponents(current, install)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_damage_locked_hand_install_spend",
          value: -1000,
        }),
      ]),
    );
  });

  it("does not suppress an immediate breaker installation at the same locked hand floor", () => {
    const current = input({
      handCount: 3,
      maxHandSize: 3,
      credits: 6,
      clicks: 1,
      stateVersion: 39,
      events: [
        event("recent-core-damage", 37, {
          actionType: "core_damage",
          damageType: "core",
          damageAmount: 2,
        }),
      ],
    });
    current.playerView.own.gripOrHq[0] = card({
      definitionId: "onr_v1_039_krash",
      type: "program",
    });
    const installKrash = action(
      "install-krash",
      "install_card",
      current.playerView.own.gripOrHq[0].instanceId,
    );

    expect(
      runnerDamageLockedHandScoreComponents(current, installKrash),
    ).toEqual([]);
  });
});

function input(params: {
  handCount: number;
  stateVersion: number;
  events?: readonly PublicGameEvent[];
  opponentHandCount?: number;
  maxHandSize?: number;
  credits?: number;
  clicks?: number;
  servers?: Array<{
    id: string;
    ice: VisibleCard[];
    root: VisibleCard[];
  }>;
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: params.stateVersion,
      own: {
        gripOrHq: Array.from({ length: params.handCount }, (_, index) =>
          card({ definitionId: `hand-${index}`, type: "event" }),
        ),
        heapOrArchives: [],
        rig: [],
        scoreArea: [],
        credits: params.credits ?? 0,
        clicks: params.clicks ?? 4,
        maxHandSize: params.maxHandSize ?? 5,
      },
      opponent: {
        identity: card({ definitionId: "corp-identity", type: "identity" }),
        handCount: params.opponentHandCount ?? 5,
      },
      servers: (params.servers ?? []).map((server) => ({
        id: server.id,
        label: server.id,
        ice: server.ice,
        root: server.root,
      })),
      publicEvents: [...(params.events ?? [])],
    },
    eventTail: [],
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function card(params: {
  definitionId: string;
  type: NonNullable<VisibleCard["type"]>;
  rezzed?: boolean;
  advancementCounters?: number;
}): VisibleCard {
  return {
    instanceId: `${params.definitionId}-instance`,
    definitionId: params.definitionId,
    title: params.definitionId,
    owner: "corp",
    controller: "corp",
    type: params.type,
    known: true,
    ...(params.rezzed !== undefined ? { rezzed: params.rezzed } : {}),
    ...(params.advancementCounters !== undefined
      ? { advancementCounters: params.advancementCounters }
      : {}),
  } as VisibleCard;
}

function action(
  actionId: string,
  type: LegalAction["type"],
  source: string,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 39,
  };
}

function event(
  eventId: string,
  stateVersionAfter: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "corp_action"),
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: { actor: publicPayload.actor ?? "corp", ...publicPayload },
  } as PublicGameEvent;
}

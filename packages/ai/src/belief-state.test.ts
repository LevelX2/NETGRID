import type {
  AiDecisionInput,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  beliefUncertaintyConsumerFacts,
  hiddenZoneActionEventFamily,
  normalizedBeliefUncertaintyValue,
  reconstructBeliefState,
} from "./belief-state";

describe("belief-state hidden zone action classification", () => {
  it("normalizes belief uncertainty into the scoring consumer scale", () => {
    expect(normalizedBeliefUncertaintyValue(0)).toBe(0);
    expect(normalizedBeliefUncertaintyValue(-25)).toBe(-25);
    expect(normalizedBeliefUncertaintyValue(-150)).toBe(-100);
    expect(normalizedBeliefUncertaintyValue(150)).toBe(100);
  });

  it("matches hidden-zone action markers by bounded terms", () => {
    expect(hiddenZoneActionEventFamily("corp_rd_shuffle")).toBe("shuffle");
    expect(hiddenZoneActionEventFamily("new_blood_conceal_reorder_installed_ice")).toBe(
      "arrange",
    );
    expect(hiddenZoneActionEventFamily("p3_33_private_look")).toBe("reveal");
  });

  it("ignores hidden-zone action substring noise", () => {
    expect(hiddenZoneActionEventFamily("reshuffleish_noise")).toBeUndefined();
    expect(hiddenZoneActionEventFamily("concealment_noise")).toBeUndefined();
    expect(hiddenZoneActionEventFamily("private_lookish_noise")).toBeUndefined();
  });
});

describe("belief-state R&D top freshness", () => {
  it("forgets a single known R&D top card after the Runner trashes it with public origin context", () => {
    const accessEvent = publicEvent("evt_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
      title: "South African Mining Corp",
    });
    const trashEvent = publicEvent("evt_2", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "rd",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
      title: "South African Mining Corp",
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, trashEvent]),
    );
    const freshness = belief.runnerOpponentModel?.rndTopFreshness;

    expect(freshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      knownToRunner: true,
      freshenedByRunnerAccess: true,
    });
    expect(freshness?.knownTopDefinitionId).toBeUndefined();
    expect(freshness?.knownSequenceDefinitionIds).toBeUndefined();
    expect(freshness?.invalidationReasons).toContain(
      "rd_access_removed_top_card:evt_2",
    );
  });

  it("ignores label-only R&D server text for top-card freshness", () => {
    const accessEvent = publicEvent("evt_label_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });
    const trashEvent = publicEvent("evt_label_2", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverLabel: "R&D",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, trashEvent]),
    );

    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.invalidationReasons ?? [],
    ).not.toContain("rd_access_removed_top_card:evt_label_2");
  });
});

describe("belief-state HQ hand memory retention", () => {
  it("keeps known safe HQ ICE after an unknown draw and unrelated known operation play", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_237_data-wall",
    ]);
    const unknownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const playedDrawnOperation = publicEvent("evt_play", "play_operation", 3, {
      actor: "corp",
      actionType: "play_operation",
      serverId: "hq",
      cardDefinitionId: "onr_v1_281_accounts-receivable",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, unknownDraw, playedDrawnOperation], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
      knownDefinitions: [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
      ],
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({
          definitionId: "onr_v1_230_cortical-scanner",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "onr_v1_237_data-wall",
          count: 1,
        }),
      ]),
    });
  });

  it("keeps a hidden ICE install candidate group after a draw without collapsing to memory none", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_237_data-wall",
    ]);
    const unknownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const hiddenIceInstall = publicEvent("evt_install", "install_card", 3, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "ice",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, unknownDraw, hiddenIceInstall], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownDefinitions: [],
      knownCount: 0,
      allCardsKnown: false,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 1,
      candidateGroups: [
        expect.objectContaining({
          reason: "hidden_ice_install_candidates",
          serverId: "remote_1",
          installPlacement: "ice",
          candidateDefinitions: expect.arrayContaining([
            { definitionId: "onr_v1_230_cortical-scanner", count: 1 },
            { definitionId: "onr_v1_237_data-wall", count: 1 },
          ]),
        }),
      ],
    });
  });

  it("ignores malformed remote ids for hidden install candidate groups", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_237_data-wall",
    ]);
    const unknownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const malformedRemoteInstall = publicEvent("evt_install", "install_card", 3, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1_noise",
      installPlacement: "ice",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, unknownDraw, malformedRemoteInstall], 2),
    );

    expect(
      belief.runnerOpponentModel?.hqHandMemory?.ledger.candidateGroups[0],
    ).toMatchObject({ serverId: "remote_1_noise" });
    expect(belief.runnerOpponentModel?.hiddenRemoteCandidateMemory).toEqual([]);
  });

  it("does not count accessed HQ root upgrades as HQ hand cards", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "simple_economy_operation",
      "simple_economy_asset",
      "simple_upgrade",
    ]);
    const hiddenHqRootInstall = publicEvent("evt_install_hq_root", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverId: "hq",
      installPlacement: "root",
    });
    const accessedHqRootUpgrade = publicEvent("evt_access_hq_root", "access_card", 3, {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      serverLabel: "HQ",
      cardDefinitionId: "simple_upgrade",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, hiddenHqRootInstall, accessedHqRootUpgrade], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(hqMemory?.knownDefinitions).toEqual(
      expect.arrayContaining([
        "simple_economy_operation",
        "simple_economy_asset",
      ]),
    );
    expect(hqMemory?.knownDefinitions).not.toContain("simple_upgrade");
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({ definitionId: "simple_economy_operation" }),
        expect.objectContaining({ definitionId: "simple_economy_asset" }),
      ]),
    });
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "hq",
        positionKey: "root:0",
        definitionId: "simple_upgrade",
      }),
    );
  });

  it("hard-invalidates HQ memory on hidden-zone reorder", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_237_data-wall",
    ]);
    const reorder = publicEvent("evt_reorder", "resolve_choice", 2, {
      actor: "corp",
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_shuffle",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, reorder], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      knownDefinitions: [],
      knownCount: 0,
      allCardsKnown: false,
    });
    expect(hqMemory?.ledger).toMatchObject({
      safeDefinitions: [],
      unknownRestCount: 2,
      candidateGroups: [],
    });
    expect(hqMemory?.invalidationReasons.join("|")).toContain(
      "shuffle_changed_hq_hand:evt_reorder",
    );
  });
});

describe("belief-state known position memory", () => {
  it("does not retain remote root cards that are currently visible in the board view", () => {
    const remoteAccess = publicEvent("evt_remote_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "remote_1",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_upgrade",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });
    const input = runnerInput([remoteAccess]);
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [visibleCard("simple_upgrade", "corp", "upgrade")],
      },
    ];

    const belief = reconstructBeliefState(input);

    expect(belief.knownPositionMemory ?? []).toEqual([]);
    expect(belief.runnerOpponentModel?.knownPositionMemory).toEqual([]);
  });

  it("retains remote root memory while the current board position is not visible", () => {
    const remoteAccess = publicEvent("evt_remote_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "remote_1",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_upgrade",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });

    const belief = reconstructBeliefState(runnerInput([remoteAccess]));

    expect(belief.knownPositionMemory?.[0]).toMatchObject({
      zone: "remote_1",
      positionKey: "root:0",
      definitionId: "simple_upgrade",
    });
  });
});

describe("belief-state remote hypothesis invalidations", () => {
  it("exposes side-safe uncertainty consumer facts without changing uncertainty entries", () => {
    const input = runnerInput([]);
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [{ known: false }],
        root: [{ known: false }],
      },
    ] as unknown as PlayerView["servers"];

    const belief = reconstructBeliefState(input);

    expect(belief.uncertainty).toEqual(
      expect.arrayContaining([
        "unknown_opponent_hand_or_hidden_zones",
        "unknown_remote_cards_remain_hypotheses",
        "unrezzed_ice_titles_remain_unknown",
      ]),
    );
    expect(beliefUncertaintyConsumerFacts(belief)).toEqual([
      "belief_uncertainty_count:3",
      "belief_uncertainty_raw_value:-75",
      "belief_uncertainty_normalized_value:-75",
    ]);
  });

  it("matches invalidation entries by bounded remote server id", () => {
    const remote10Advance = publicEvent("evt_remote_10_advance", "advance_card", 1, {
      actor: "corp",
      actionType: "advance_card",
      serverId: "remote_10",
    });
    const input = runnerInput([remote10Advance]);
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [{ known: false }],
      },
    ] as unknown as PlayerView["servers"];

    const belief = reconstructBeliefState(input);
    const remoteRootHypothesis = belief.entries.find(
      (entry) => entry.subject === "remote_card_hypothesis:remote_1:unknown_root",
    );

    expect(belief.invalidationLog).toContain(
      "remote_state_changed:evt_remote_10_advance:remote_10",
    );
    expect(remoteRootHypothesis?.invalidatedBy).toEqual([]);
  });
});

describe("belief-state reveal kind classification", () => {
  it("uses structured revealKind and ignores definition id reveal text", () => {
    const structuredExpose = publicEvent(
      "evt_structured_expose",
      "resolve_choice",
      1,
      {
        actor: "runner",
        actionType: "resolve_choice",
        revealKind: "expose",
        cardDefinitionId: "neutral-card",
      },
    );
    const idOnlyExpose = publicEvent(
      "evt_id_only_expose",
      "resolve_choice",
      2,
      {
        actor: "runner",
        actionType: "resolve_choice",
        cardDefinitionId: "custom-expose-tool",
      },
    );
    const breachKind = publicEvent("evt_breach_kind", "resolve_choice", 3, {
      actor: "runner",
      actionType: "resolve_choice",
      revealKind: "breach",
      cardDefinitionId: "custom-reveal-tool",
    });

    const classifications = reconstructBeliefState(
      runnerInput([structuredExpose, idOnlyExpose, breachKind]),
    ).eventClassifications;

    expect(
      classifications.find((entry) => entry.eventId === "evt_structured_expose")
        ?.family,
    ).toBe("expose");
    expect(
      classifications.find((entry) => entry.eventId === "evt_id_only_expose")
        ?.family,
    ).toBe("other");
    expect(
      classifications.find((entry) => entry.eventId === "evt_breach_kind")
        ?.family,
    ).toBe("other");
  });
});

function runnerInput(
  events: PublicGameEvent[],
  opponentHandCount = 0,
): AiDecisionInput {
  const playerView = {
    stateVersion: events.at(-1)?.stateVersionAfter ?? 0,
    own: { gripOrHq: [] },
    opponent: { handCount: opponentHandCount },
    servers: [],
    publicEvents: events,
  } as unknown as PlayerView;

  return {
    side: "runner",
    playerView,
    eventTail: events,
    legalActions: [],
    difficulty: "normal",
    seed: "belief-rd-trash-origin",
    decisionId: "belief-rd-trash-origin",
    actionNumber: 1,
    profileId: "test",
  };
}

function hqPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownHqDefinitionIds: string[],
): PublicGameEvent {
  return publicEvent(eventId, "resolve_choice", stateVersionBefore, {
    actor: "runner",
    actionType: "resolve_choice",
    hiddenZoneAction: "p3_33_private_look",
    privateLookZone: "hq",
    privateLookCount: knownHqDefinitionIds.length,
    knownHqDefinitionIds,
  });
}

function publicEvent(
  eventId: string,
  type: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash_${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload,
  } as PublicGameEvent;
}

function visibleCard(
  definitionId: string,
  owner: "runner" | "corp",
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: `${definitionId}_instance`,
    definitionId,
    title: definitionId,
    type,
    known: true,
    owner,
    controller: owner,
  };
}

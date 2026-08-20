import type {
  AiDecisionInput,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  beliefUncertaintyConsumerFacts,
  hiddenZoneMutationEventFamily,
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

  it("classifies explicit hidden-zone mutations", () => {
    expect(
      hiddenZoneMutationEventFamily({
        kind: "shuffle",
        affectedCardCount: 4,
        contentsChanged: false,
        orderChanged: true,
        changesHq: false,
        changesRd: true,
      }),
    ).toBe("shuffle");
    expect(
      hiddenZoneMutationEventFamily({
        kind: "reorder",
        affectedCardCount: 2,
        contentsChanged: false,
        orderChanged: true,
        changesHq: false,
        changesRd: true,
      }),
    ).toBe("arrange");
  });

  it("does not classify opaque hidden-zone action IDs", () => {
    expect(hiddenZoneMutationEventFamily(undefined)).toBeUndefined();
  });
});

describe("belief-state revealed opponent ownership", () => {
  it("does not classify the Runner's own searched card as an opponent card", () => {
    const ownSearchResult = publicEvent(
      "evt_runner_search",
      "resolve_choice",
      1,
      {
        actor: "runner",
        actionType: "resolve_choice",
        hiddenZoneAction: "p3_37_search_stack_to_grip",
        cardDefinitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
        revealKind: "reveal",
        publicRevealKind: "reveal",
        publicRevealDefinitionId: "onr_v1_047_pile-driver",
      },
    );
    const opponentAccess = publicEvent("evt_corp_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "onr_v1_206_marine-arcology",
      title: "Marine Arcology",
    });

    const revealedOpponentSubjects = reconstructBeliefState(
      runnerInput([ownSearchResult, opponentAccess]),
    )
      .entries.filter((entry) => entry.kind === "revealed_opponent_fact")
      .map((entry) => entry.subject);

    expect(revealedOpponentSubjects).toContain(
      "revealed_opponent_card:onr_v1_206_marine-arcology",
    );
    expect(revealedOpponentSubjects).not.toContain(
      "revealed_opponent_card:onr_v1_047_pile-driver",
    );
  });
});

describe("belief-state R&D top freshness", () => {
  it("advances a five-card private-look sequence over consecutive Corp draws", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      "simple_economy_operation",
      "simple_agenda",
      "simple_economy_asset",
      "simple_upgrade",
      "simple_barrier_ice",
    ]);
    const firstDraw = publicEvent("evt_draw_1", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const secondDraw = publicEvent("evt_draw_2", "draw_card", 3, {
      actor: "corp",
      actionType: "draw_card",
    });

    const belief = reconstructBeliefState(
      runnerInput([look, firstDraw, secondDraw], 2),
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_economy_asset",
      knownSequenceDefinitionIds: [
        "simple_economy_asset",
        "simple_upgrade",
        "simple_barrier_ice",
      ],
    });
    expect(belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions).toEqual([
      "simple_economy_operation",
      "simple_agenda",
    ]);
    expect(belief.runnerOpponentModel?.knownPositionMemory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          zone: "rd",
          positionKey: "top",
          definitionId: "simple_economy_asset",
        }),
        expect.objectContaining({
          zone: "rd",
          positionKey: "top:1",
          definitionId: "simple_upgrade",
        }),
      ]),
    );
  });

  it("keeps the remaining private-look sequence after an accessed top card is removed", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      "simple_economy_asset",
      "simple_agenda",
      "simple_upgrade",
    ]);
    const access = publicEvent("evt_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "simple_economy_asset",
    });
    const trash = publicEvent("evt_trash", "trash_accessed_card", 3, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "rd",
      cardDefinitionId: "simple_economy_asset",
    });

    const belief = reconstructBeliefState(runnerInput([look, access, trash]));

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_agenda",
      knownSequenceDefinitionIds: ["simple_agenda", "simple_upgrade"],
      freshenedByRunnerAccess: true,
    });
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "rd",
        positionKey: "top",
        definitionId: "simple_agenda",
      }),
    );
  });

  it("moves the next known R&D card into HQ after the accessed top card was stolen", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      "simple_agenda",
      "simple_economy_operation",
      "simple_upgrade",
    ]);
    const access = publicEvent("evt_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "simple_agenda",
    });
    const steal = publicEvent("evt_steal", "steal_agenda", 3, {
      actor: "runner",
      actionType: "steal_agenda",
      serverId: "rd",
      cardDefinitionId: "simple_agenda",
    });
    const draw = publicEvent("evt_draw", "mandatory_draw", 4, {
      actor: "corp",
      actionType: "mandatory_draw",
    });

    const belief = reconstructBeliefState(
      runnerInput([look, access, steal, draw], 1),
    );

    expect(belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions).toEqual([
      "simple_economy_operation",
    ]);
    expect(
      belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions,
    ).not.toContain("simple_agenda");
    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_upgrade",
      knownSequenceDefinitionIds: ["simple_upgrade"],
    });
  });

  it("invalidates R&D order on an R&D shuffle while retaining cards already drawn into HQ", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      "simple_economy_operation",
      "simple_agenda",
      "simple_upgrade",
    ]);
    const draw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const shuffle = publicEvent("evt_rd_shuffle", "resolve_choice", 3, {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "rd",
      hiddenZoneAction: "corp_rd_shuffle",
      hiddenZoneMutationKind: "shuffle",
      hiddenZoneAffectedCardCount: 20,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: true,
    });

    const belief = reconstructBeliefState(
      runnerInput([look, draw, shuffle], 1),
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "invalidated",
      knownToRunner: false,
    });
    expect(
      belief.runnerOpponentModel?.knownPositionMemory?.filter(
        (entry) => entry.zone === "rd",
      ),
    ).toEqual([]);
    expect(belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions).toEqual([
      "simple_economy_operation",
    ]);
  });

  it("invalidates R&D order on an R&D reorder but not on an HQ reorder", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      "simple_economy_operation",
      "simple_agenda",
    ]);
    const hqReorder = publicEvent("evt_hq_reorder", "resolve_choice", 2, {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "hq",
      hiddenZoneAction: "hq_reorder",
      hiddenZoneMutationKind: "reorder",
      hiddenZoneAffectedCardCount: 2,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: true,
      hiddenZoneChangesRd: false,
    });
    const beforeRdReorder = reconstructBeliefState(
      runnerInput([look, hqReorder]),
    );
    const rdReorder = publicEvent("evt_rd_reorder", "resolve_choice", 3, {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "rd",
      hiddenZoneAction: "rd_reorder",
      hiddenZoneMutationKind: "reorder",
      hiddenZoneAffectedCardCount: 2,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: true,
    });
    const afterRdReorder = reconstructBeliefState(
      runnerInput([look, hqReorder, rdReorder]),
    );

    expect(
      beforeRdReorder.runnerOpponentModel?.rndTopFreshness
        .knownSequenceDefinitionIds,
    ).toEqual(["simple_economy_operation", "simple_agenda"]);
    expect(afterRdReorder.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "invalidated",
      knownToRunner: false,
    });
  });

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

  it("forgets a known R&D top card after the Runner steals it with engine-style label-only origin context", () => {
    const accessEvent = publicEvent("evt_label_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });
    const stealEvent = publicEvent("evt_label_2", "steal_agenda", 2, {
      actor: "runner",
      actionType: "steal_agenda",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, stealEvent]),
    );
    const freshness = belief.runnerOpponentModel?.rndTopFreshness;

    expect(freshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      knownToRunner: true,
      freshenedByRunnerAccess: true,
    });
    expect(freshness?.knownTopDefinitionId).toBeUndefined();
    expect(freshness?.invalidationReasons).toContain(
      "rd_access_removed_top_card:evt_label_2",
    );
  });

  it("does not treat label-only R&D text on unrelated events as top-card removal", () => {
    const accessEvent = publicEvent("evt_label_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });
    const unrelatedEvent = publicEvent("evt_label_noise", "gain_credit", 2, {
      actor: "runner",
      actionType: "gain_credit",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, unrelatedEvent]),
    );
    const freshness = belief.runnerOpponentModel?.rndTopFreshness;

    expect(freshness?.freshness).toBe("stale_known_same_top");
    expect(freshness?.knownTopDefinitionId).toBe(
      "onr_v1_343_south-african-mining-corp",
    );
    expect(freshness?.invalidationReasons).not.toContain(
      "rd_access_removed_top_card:evt_label_noise",
    );
  });
});

describe("belief-state HQ hand memory retention", () => {
  it("reconciles only the hidden install bound to the revealed position", () => {
    const firstAccess = publicEvent("evt_access_data_wall", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: "onr_v1_238_data-wall-2-0",
    });
    const firstInstall = publicEvent("evt_install_a", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:a",
    });
    const secondAccess = publicEvent("evt_access_cortical", "access_card", 3, {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: "onr_v1_230_cortical-scanner",
    });
    const secondInstall = publicEvent("evt_install_b", "install_card", 4, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:b",
    });
    const secondRez = publicEvent("evt_rez_b", "rez_ice", 5, {
      actor: "corp",
      actionType: "rez_ice",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:b",
      rezzedCardDefinitionId: "onr_v1_230_cortical-scanner",
    });

    const belief = reconstructBeliefState(
      runnerInput(
        [firstAccess, firstInstall, secondAccess, secondInstall, secondRez],
        0,
      ),
    );

    expect(
      belief.runnerOpponentModel?.hqHandMemory.ledger.candidateGroups,
    ).toEqual([
      expect.objectContaining({
        sourceEventId: "evt_install_a",
        installedPositionKey: "installed-position-v1:a",
      }),
    ]);
    expect(belief.runnerOpponentModel?.hiddenRemoteCandidateMemory).toEqual([
      expect.objectContaining({
        sourceEventId: "evt_install_a",
        installedPositionKey: "installed-position-v1:a",
      }),
    ]);
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "installed-position-v1:b",
        definitionId: "onr_v1_230_cortical-scanner",
      }),
    );

    const trashedSecondPosition = publicEvent(
      "evt_trash_b",
      "trash_accessed_card",
      6,
      {
        actor: "runner",
        actionType: "trash_accessed_card",
        serverId: "remote_1",
        installedPositionKey: "installed-position-v1:b",
        cardDefinitionId: "onr_v1_230_cortical-scanner",
      },
    );
    const afterTrash = reconstructBeliefState(
      runnerInput(
        [
          firstAccess,
          firstInstall,
          secondAccess,
          secondInstall,
          secondRez,
          trashedSecondPosition,
        ],
        0,
      ),
    );
    expect(
      afterTrash.runnerOpponentModel?.knownPositionMemory,
    ).not.toContainEqual(
      expect.objectContaining({ positionKey: "installed-position-v1:b" }),
    );
  });

  it("retains count-safe ambiguity after an unknown Corp discard", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_304_systematic-layoffs",
    ]);
    const hiddenDiscard = publicEvent(
      "evt_hidden_discard",
      "resolve_choice",
      2,
      {
        actor: "corp",
        actionType: "resolve_choice",
        discardCount: 1,
        discardResolved: true,
      },
    );

    const memory = reconstructBeliefState(
      runnerInput([hqLook, hiddenDiscard], 1),
    ).runnerOpponentModel?.hqHandMemory;

    expect(memory).toMatchObject({
      handCount: 1,
      knownDefinitions: [],
      knownCount: 0,
      ledger: {
        unknownRestCount: 0,
        candidateGroups: [
          expect.objectContaining({
            reason: "unknown_hq_departure_candidates",
            candidateCount: 2,
            departureCount: 1,
            candidateDefinitions: expect.arrayContaining([
              { definitionId: "onr_v1_230_cortical-scanner", count: 1 },
              { definitionId: "onr_v1_304_systematic-layoffs", count: 1 },
            ]),
          }),
        ],
      },
    });
    expect(memory?.invalidationReasons).toContain(
      "corp_discarded_hq_card:evt_hidden_discard",
    );
  });

  it("moves a known R&D top card into HQ on Corp draw and removes it when played", () => {
    const rdAccess = publicEvent("evt_rd_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "simple_economy_operation",
    });
    const knownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const playedOperation = publicEvent("evt_play", "play_operation", 3, {
      actor: "corp",
      actionType: "play_operation",
      sourceDefinitionId: "simple_economy_operation",
    });

    const afterDraw = reconstructBeliefState(
      runnerInput([rdAccess, knownDraw], 1),
    ).runnerOpponentModel?.hqHandMemory;
    const afterPlay = reconstructBeliefState(
      runnerInput([rdAccess, knownDraw, playedOperation], 0),
    ).runnerOpponentModel?.hqHandMemory;

    expect(afterDraw).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_economy_operation"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(afterDraw?.invalidationReasons).toContain(
      "known_rnd_top_moved_to_hq:evt_rd_access->evt_draw",
    );
    expect(afterPlay).toMatchObject({
      handCount: 0,
      knownDefinitions: [],
      knownCount: 0,
    });
    expect(afterPlay?.invalidationReasons).toContain(
      "known_hq_card_played:evt_play",
    );
  });

  it("remembers an agenda that Gypsy Schedule Analyzer stores in HQ", () => {
    const gypsyResolution = publicEvent(
      "evt_gypsy_resolution",
      "resolve_choice",
      1,
      {
        actor: "runner",
        actionType: "resolve_choice",
        hiddenZoneAction:
          "gypsy_schedule_analyzer_reveal_rd_until_agenda",
        agendaStoredInHq: true,
        storedAgendaDefinitionId: "onr_v1_220_tycho-extension",
        revealedAgendaDefinitionIds: "onr_v1_220_tycho-extension",
      },
    );

    const memory = reconstructBeliefState(
      runnerInput([gypsyResolution], 6),
    ).runnerOpponentModel?.hqHandMemory;

    expect(memory).toMatchObject({
      handCount: 6,
      knownDefinitions: ["onr_v1_220_tycho-extension"],
      knownCount: 1,
      allCardsKnown: false,
      ledger: {
        unknownRestCount: 5,
        safeDefinitions: [
          expect.objectContaining({
            definitionId: "onr_v1_220_tycho-extension",
            count: 1,
          }),
        ],
      },
    });
    expect(memory?.invalidationReasons).toContain(
      "gypsy_known_agenda_stored_in_hq:evt_gypsy_resolution",
    );
  });

  it("keeps a known R&D-drawn operation in HQ after an unrelated hidden ICE install", () => {
    const rdAccess = publicEvent("evt_rd_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: "simple_economy_operation",
    });
    const knownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
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
      runnerInput([rdAccess, knownDraw, hiddenIceInstall], 1),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_economy_operation"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [
        expect.objectContaining({
          reason: "hidden_ice_install_unknown_candidates",
          candidateCount: 0,
          unknownCandidateCount: 1,
          departureCount: 1,
        }),
      ],
      safeDefinitions: [
        expect.objectContaining({
          definitionId: "simple_economy_operation",
          count: 1,
        }),
      ],
    });
  });

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
      knownDefinitions: ["onr_v1_230_cortical-scanner", "onr_v1_237_data-wall"],
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
    const malformedRemoteInstall = publicEvent(
      "evt_install",
      "install_card",
      3,
      {
        actor: "corp",
        actionType: "install_card",
        serverId: "remote_1_noise",
        installPlacement: "ice",
      },
    );

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
    const hiddenHqRootInstall = publicEvent(
      "evt_install_hq_root",
      "install_card",
      2,
      {
        actor: "corp",
        actionType: "install_card",
        serverId: "hq",
        installPlacement: "root",
      },
    );
    const accessedHqRootUpgrade = publicEvent(
      "evt_access_hq_root",
      "access_card",
      3,
      {
        actor: "runner",
        actionType: "access_card",
        serverId: "hq",
        serverLabel: "HQ",
        cardDefinitionId: "simple_upgrade",
        accessedCardPositionKey: "root:0",
        accessedArea: "root",
        accessedIndex: 0,
      },
    );

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
      hiddenZoneAction: "opaque_ability_id",
      hiddenZoneMutationKind: "shuffle",
      hiddenZoneAffectedCardCount: 2,
      hiddenZoneContentsChanged: true,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: true,
      hiddenZoneChangesRd: false,
    });

    const belief = reconstructBeliefState(runnerInput([hqLook, reorder], 2));
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

  it("retains HQ memory when a shuffle-named ability moves no cards", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_v1_230_cortical-scanner",
      "onr_v1_237_data-wall",
    ]);
    const noOp = publicEvent("evt_noop", "resolve_choice", 2, {
      actor: "corp",
      actionType: "resolve_choice",
      hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
      hiddenZoneMutationKind: "shuffle",
      hiddenZoneAffectedCardCount: 0,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: false,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: false,
    });

    const belief = reconstructBeliefState(runnerInput([hqLook, noOp], 2));

    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      knownDefinitions: [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
      ],
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(
      belief.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).not.toContain("shuffle_changed_hq_hand");
  });

  it("treats a current single-card HQ access as complete despite stale candidates", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "simple_economy_asset",
      "simple_upgrade",
    ]);
    const hiddenRootInstall = publicEvent(
      "evt_hidden_install",
      "install_card",
      2,
      {
        actor: "corp",
        actionType: "install_card",
        serverId: "remote_1",
        installPlacement: "root",
      },
    );
    const currentHqAccess = publicEvent("evt_hq_access", "access_card", 3, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "HQ",
      cardDefinitionId: "onr_v1_297_overtime-incentives",
      title: "Overtime Incentives",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, hiddenRootInstall, currentHqAccess], 1),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["onr_v1_297_overtime-incentives"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: [
        expect.objectContaining({
          definitionId: "onr_v1_297_overtime-incentives",
          count: 1,
        }),
      ],
    });
  });

  it("removes trashed accessed HQ cards when the event only exposes a server label", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_proteus_062_lesley-major",
      "onr_v1_297_overtime-incentives",
      "onr_v1_340_setup",
    ]);
    const trashAccessedHqCard = publicEvent(
      "evt_hq_trash",
      "trash_accessed_card",
      2,
      {
        actor: "runner",
        actionType: "trash_accessed_card",
        serverLabel: "HQ",
        cardDefinitionId: "onr_proteus_062_lesley-major",
        title: "Lesley Major",
      },
    );

    const belief = reconstructBeliefState(
      runnerInput([hqLook, trashAccessedHqCard], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(hqMemory?.knownDefinitions).toEqual(
      expect.arrayContaining([
        "onr_v1_297_overtime-incentives",
        "onr_v1_340_setup",
      ]),
    );
    expect(hqMemory?.knownDefinitions).not.toContain(
      "onr_proteus_062_lesley-major",
    );
    expect(hqMemory?.invalidationReasons).toContain(
      "known_hq_card_trash:evt_hq_trash",
    );
  });

  it("invalidates complete HQ hand memory when a later HQ access contradicts it", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      "onr_proteus_062_lesley-major",
      "onr_v1_297_overtime-incentives",
      "onr_v1_340_setup",
      "onr_v1_304_systematic-layoffs",
    ]);
    const contradictingHqAccess = publicEvent(
      "evt_hq_access_data_wall",
      "access_card",
      2,
      {
        actor: "runner",
        actionType: "access_card",
        serverLabel: "HQ",
        cardDefinitionId: "onr_v1_238_data-wall-2-0",
        title: "Data Wall 2.0",
      },
    );

    const belief = reconstructBeliefState(
      runnerInput([hqLook, contradictingHqAccess], 4),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 4,
      knownDefinitions: ["onr_v1_238_data-wall-2-0"],
      knownCount: 1,
      allCardsKnown: false,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 3,
      candidateGroups: [],
      safeDefinitions: [
        expect.objectContaining({
          definitionId: "onr_v1_238_data-wall-2-0",
          count: 1,
        }),
      ],
    });
    expect(hqMemory?.invalidationReasons).toContain(
      "belief_warning:hq_all_known_contradiction:evt_hq_access_data_wall",
    );
    expect(belief.uncertainty).toContain(
      "belief_warning:hq_all_known_contradiction",
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

  it("invalidates accessed remote root memory after the Corp scores from that server", () => {
    const remoteAccess = publicEvent("evt_remote_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "remote_1",
      serverLabel: "Remote 1",
      cardDefinitionId: "onr_v1_194_corporate-downsizing",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });
    const score = publicEvent("evt_remote_score", "score_agenda", 2, {
      actor: "corp",
      actionType: "score_agenda",
      targets: { scoredFromServerId: "remote_1" },
    });

    const belief = reconstructBeliefState(runnerInput([remoteAccess, score]));

    expect(belief.knownPositionMemory ?? []).not.toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "root:0",
      }),
    );
    expect(
      belief.runnerOpponentModel?.knownPositionMemory ?? [],
    ).not.toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "root:0",
      }),
    );
  });

  it("keeps the match-b763978b remote root memory across an unrelated hidden Corp discard", () => {
    const remoteAccess = publicEvent("evt_remote_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "remote_2",
      serverLabel: "Remote 2",
      cardDefinitionId: "onr_classic_023_shock-treatment",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });
    const hiddenCorpDiscard = publicEvent(
      "evt_corp_discard",
      "resolve_choice",
      2,
      {
        actor: "corp",
        actionType: "resolve_choice",
        choiceKind: "select_cards",
        discardResolved: true,
        discardSide: "corp",
        discardZone: "archives",
        redactedKind: "hidden_zone",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "discard_phase",
      },
    );

    const belief = reconstructBeliefState(
      runnerInput([remoteAccess, hiddenCorpDiscard]),
    );

    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "remote_2",
        positionKey: "root:0",
        definitionId: "onr_classic_023_shock-treatment",
      }),
    );
  });
});

describe("belief-state public remote root type deductions", () => {
  it("deduces upgrade-only roots after a public asset-to-agenda replacement is scored", () => {
    const events = remoteUpgradeOnlyHistory();
    const input = runnerInput(events);
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [{ instanceId: "hidden_upgrade", known: false }],
      },
    ] as unknown as PlayerView["servers"];

    const belief = reconstructBeliefState(input);

    expect(belief.runnerOpponentModel?.remoteRootTypeDeductions).toEqual([
      expect.objectContaining({
        serverId: "remote_1",
        unknownRootCount: 1,
        candidateTypes: ["upgrade"],
        confidence: 1,
        sourceEventIds: ["evt_replacement", "evt_score"],
      }),
    ]);
    expect(belief.runnerOpponentModel?.remoteCardBelief).toEqual([]);
    expect(belief.entries).toContainEqual(
      expect.objectContaining({
        kind: "public_fact",
        subject: "remote_root_type_deduction:remote_1:upgrade_only:1",
      }),
    );
  });

  it("keeps the root type unknown after a later public root install", () => {
    const events = [
      ...remoteUpgradeOnlyHistory(),
      publicEvent("evt_new_root", "install_card", 5, {
        actor: "corp",
        actionType: "install_card",
        serverLabel: "Remote 1",
        installPlacement: "root",
      }),
    ];
    const input = runnerInput(events);
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [{ instanceId: "hidden_new_root", known: false }],
      },
    ] as unknown as PlayerView["servers"];

    const belief = reconstructBeliefState(input);

    expect(belief.runnerOpponentModel?.remoteRootTypeDeductions).toEqual([]);
    expect(belief.runnerOpponentModel?.remoteCardBelief).toEqual([
      expect.objectContaining({
        serverId: "remote_1",
        hypothesis: "unknown_remote_card",
      }),
    ]);
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
    const remote10Advance = publicEvent(
      "evt_remote_10_advance",
      "advance_card",
      1,
      {
        actor: "corp",
        actionType: "advance_card",
        serverId: "remote_10",
      },
    );
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
      (entry) =>
        entry.subject === "remote_card_hypothesis:remote_1:unknown_root",
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

function remoteUpgradeOnlyHistory(): PublicGameEvent[] {
  return [
    publicEvent("evt_first_root", "install_card", 1, {
      actor: "corp",
      actionType: "install_card",
      serverLabel: "Remote 1",
      installPlacement: "root",
    }),
    publicEvent("evt_second_root", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverLabel: "Remote 1",
      installPlacement: "root",
    }),
    publicEvent("evt_replacement", "install_card", 3, {
      actor: "corp",
      actionType: "install_card",
      serverLabel: "Remote 1",
      installPlacement: "root",
      rootReplacement: "asset_to_agenda",
      replacedRootCardType: "asset",
    }),
    publicEvent("evt_score", "score_agenda", 4, {
      actor: "corp",
      actionType: "score_agenda",
      targets: { scoredFromServerId: "remote_1" },
      cardDefinitionId: "onr_v1_193_corporate-coup",
    }),
  ];
}

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

function rndPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownRndDefinitionIds: string[],
): PublicGameEvent {
  return publicEvent(eventId, "resolve_choice", stateVersionBefore, {
    actor: "runner",
    actionType: "resolve_choice",
    hiddenZoneAction: "p3_33_private_look",
    privateLookZone: "rd",
    privateLookCount: knownRndDefinitionIds.length,
    knownRndDefinitionIds,
    knownRndTopDefinitionId: knownRndDefinitionIds[0],
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

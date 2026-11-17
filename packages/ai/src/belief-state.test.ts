import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
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
        cardDefinitionId: 259,
        title: "Pile Driver",
        revealKind: "reveal",
        publicRevealKind: "reveal",
        publicRevealDefinitionId: 259,
      },
    );
    const opponentAccess = publicEvent("evt_corp_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 418,
      title: "Marine Arcology",
    });

    const revealedOpponentSubjects = reconstructBeliefState(
      runnerInput([ownSearchResult, opponentAccess]),
    )
      .entries.filter((entry) => entry.kind === "revealed_opponent_fact")
      .map((entry) => entry.subject);

    expect(revealedOpponentSubjects).toContain(
      "revealed_opponent_card:418",
    );
    expect(revealedOpponentSubjects).not.toContain(
      "revealed_opponent_card:259",
    );
  });
});

describe("belief-state R&D top freshness", () => {
  it("moves the entire observed multi-card Corp draw into HQ in one event", () => {
    const observed = rndPrivateLookEvent("evt_rd_look", 1, [
      596,
      596,
      588,
    ]);
    const draw = publicEvent("evt_draw_two", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
      corpRdDrawnToHqCount: 2,
    });
    const belief = reconstructBeliefState(runnerInput([observed, draw], 2));
    expect(belief.rndTopFreshness).toMatchObject({
      knownSequenceDefinitionIds: [588],
    });
    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      allCardsKnown: true,
      knownDefinitions: [596, 596],
    });
  });

  it("drops exact R&D order when a draw opens an unresolved replacement", () => {
    const observed = rndPrivateLookEvent("evt_rd_look", 1, [588]);
    const draw = publicEvent("evt_draw_pending", "draw_card", 2, {
      actor: "corp",
      actionType: "draw_card",
      corpRdDrawOrderUnresolved: true,
    });
    const belief = reconstructBeliefState(runnerInput([observed, draw], 1));
    expect(belief.rndTopFreshness?.knownTopDefinitionId).toBeUndefined();
    expect(belief.runnerOpponentModel?.hqHandMemory.knownDefinitions).toEqual([]);
  });

  it("keeps R&D root accesses and removals separate from the deck sequence", () => {
    const deckLook = rndPrivateLookEvent("evt_rd_look", 1, [588]);
    const rootContext = {
      actor: "runner",
      serverId: "rd",
      cardDefinitionId: 606,
      installPlacement: "root",
      installedPositionKey: "installed-position-v1:upgrade",
      accessIndex: 0,
    };
    const rootAccess = publicEvent("evt_rd_root_access", "access_card", 2, {
      ...rootContext,
      actionType: "access_card",
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
    });
    const rootTrash = publicEvent("evt_rd_root_trash", "trash_accessed_card", 3, {
      ...rootContext,
      actionType: "trash_accessed_card",
    });
    const beforeTrash = reconstructBeliefState(runnerInput([deckLook, rootAccess]));
    expect(beforeTrash.knownPositionMemory).toContainEqual(
      expect.objectContaining({ zone: "rd", positionKey: "root:0", definitionId: 606 }),
    );
    const afterTrash = reconstructBeliefState(runnerInput([deckLook, rootAccess, rootTrash]));
    expect(afterTrash.rndTopFreshness).toMatchObject({
      knownSequenceDefinitionIds: [588],
      knownTopDefinitionId: 588,
    });
    expect(afterTrash.knownPositionMemory).not.toContainEqual(
      expect.objectContaining({ zone: "rd", positionKey: "root:0" }),
    );
  });

  it("retains the HQ hand copy when the Runner trashes a same-definition upgrade from the root", () => {
    const hand = hqPrivateLookEvent("evt_hq_look", 1, [606, 588]);
    const rootTrash = publicEvent("evt_hq_root_trash", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "hq",
      installPlacement: "root",
      installedPositionKey: "installed-position-v1:upgrade",
      cardDefinitionId: 606,
    });
    const belief = reconstructBeliefState(runnerInput([hand, rootTrash], 2));
    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      allCardsKnown: true,
      knownDefinitions: [606, 588],
    });
  });

  it("retains the ordered non-stolen remainder of a five-card R&D multiaccess after the Corp draw", () => {
    const accessedDefinitions = [
      596,
      588,
      90,
      599,
      507,
    ];
    const events: PublicGameEvent[] = [];
    let stateVersion = 0;
    for (const [
      accessIndex,
      cardDefinitionId,
    ] of accessedDefinitions.entries()) {
      events.push(
        publicEvent(`evt_access_${accessIndex}`, "access_card", stateVersion, {
          actor: "runner",
          actionType: "access_card",
          serverId: "rd",
          cardDefinitionId,
          accessIndex,
          effectiveAccessCount: accessedDefinitions.length,
        }),
      );
      stateVersion += 1;
      if (accessIndex === 1 || accessIndex === 3) {
        events.push(
          publicEvent(
            `evt_steal_${accessIndex}`,
            "steal_agenda",
            stateVersion,
            {
              actor: "runner",
              actionType: "steal_agenda",
              serverId: "rd",
              cardDefinitionId,
              accessIndex,
            },
          ),
        );
        stateVersion += 1;
      }
    }
    events.push(
      publicEvent("evt_corp_draw", "mandatory_draw", stateVersion, {
        actor: "corp",
        actionType: "mandatory_draw",
      }),
    );

    const belief = reconstructBeliefState(runnerInput(events, 1));

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: 90,
      knownSequenceDefinitionIds: [
        90,
        507,
      ],
    });
    expect(
      belief.runnerOpponentModel?.knownPositionMemory.filter(
        (entry) => entry.zone === "rd",
      ),
    ).toEqual([
      expect.objectContaining({
        positionKey: "top",
        definitionId: 90,
      }),
      expect.objectContaining({
        positionKey: "top:1",
        definitionId: 507,
      }),
    ]);
    expect(belief.runnerOpponentModel?.hqHandMemory.knownDefinitions).toContain(
      596,
    );
    expect(
      belief.runnerOpponentModel?.hqHandMemory.knownDefinitions,
    ).not.toContain(507);
  });

  it("drops an unconfirmed known R&D suffix when a new access contradicts its prefix", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      596,
      588,
      606,
    ]);
    const contradictoryAccess = publicEvent(
      "evt_contradictory_access",
      "access_card",
      2,
      {
        actor: "runner",
        actionType: "access_card",
        serverId: "rd",
        cardDefinitionId: 589,
        accessIndex: 0,
        effectiveAccessCount: 1,
      },
    );

    const freshness = reconstructBeliefState(
      runnerInput([look, contradictoryAccess]),
    ).runnerOpponentModel?.rndTopFreshness;

    expect(freshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownSequenceDefinitionIds: [589],
    });
    expect(freshness?.invalidationReasons).toContain(
      "rd_known_sequence_prefix_changed:4:0",
    );
  });

  it("does not remove a remembered R&D card without an exact access-index binding", () => {
    const access = publicEvent("evt_unbound_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 594,
    });
    const trash = publicEvent("evt_unbound_trash", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "rd",
      cardDefinitionId: 594,
    });

    const freshness = reconstructBeliefState(runnerInput([access, trash]))
      .runnerOpponentModel?.rndTopFreshness;

    expect(freshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownSequenceDefinitionIds: [594],
    });
    expect(freshness?.invalidationReasons).toEqual(
      expect.arrayContaining([
        "rd_access_sequence_binding_unavailable:3",
        "rd_access_removal_binding_unavailable:4",
      ]),
    );
  });

  it("advances a five-card private-look sequence over consecutive Corp draws", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      596,
      588,
      594,
      606,
      589,
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
      knownTopDefinitionId: 594,
      knownSequenceDefinitionIds: [
        594,
        606,
        589,
      ],
    });
    expect(belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions).toEqual([
      596,
      588,
    ]);
    expect(belief.runnerOpponentModel?.knownPositionMemory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          zone: "rd",
          positionKey: "top",
          definitionId: 594,
        }),
        expect.objectContaining({
          zone: "rd",
          positionKey: "top:1",
          definitionId: 606,
        }),
      ]),
    );
  });

  it("keeps the remaining private-look sequence after an accessed top card is removed", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      594,
      588,
      606,
    ]);
    const access = publicEvent("evt_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 594,
      accessIndex: 0,
      effectiveAccessCount: 1,
    });
    const trash = publicEvent("evt_trash", "trash_accessed_card", 3, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "rd",
      cardDefinitionId: 594,
      accessIndex: 0,
    });

    const belief = reconstructBeliefState(runnerInput([look, access, trash]));

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: 588,
      knownSequenceDefinitionIds: [588, 606],
      freshenedByRunnerAccess: true,
    });
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "rd",
        positionKey: "top",
        definitionId: 588,
      }),
    );
  });

  it("moves the next known R&D card into HQ after the accessed top card was stolen", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      588,
      596,
      606,
    ]);
    const access = publicEvent("evt_access", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 588,
      accessIndex: 0,
      effectiveAccessCount: 1,
    });
    const steal = publicEvent("evt_steal", "steal_agenda", 3, {
      actor: "runner",
      actionType: "steal_agenda",
      serverId: "rd",
      cardDefinitionId: 588,
      accessIndex: 0,
    });
    const draw = publicEvent("evt_draw", "mandatory_draw", 4, {
      actor: "corp",
      actionType: "mandatory_draw",
    });

    const belief = reconstructBeliefState(
      runnerInput([look, access, steal, draw], 1),
    );

    expect(belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions).toEqual([
      596,
    ]);
    expect(
      belief.runnerOpponentModel?.hqHandMemory?.knownDefinitions,
    ).not.toContain(588);
    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: 606,
      knownSequenceDefinitionIds: [606],
    });
  });

  it("invalidates R&D order on an R&D shuffle while retaining cards already drawn into HQ", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      596,
      588,
      606,
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
      596,
    ]);
  });

  it("invalidates R&D order on an R&D reorder but not on an HQ reorder", () => {
    const look = rndPrivateLookEvent("evt_rd_look", 1, [
      596,
      588,
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
    ).toEqual([596, 588]);
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
      cardDefinitionId: 555,
      title: "South African Mining Corp",
      accessIndex: 0,
      effectiveAccessCount: 1,
    });
    const trashEvent = publicEvent("evt_2", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverId: "rd",
      cardDefinitionId: 555,
      title: "South African Mining Corp",
      accessIndex: 0,
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
      "rd_access_removed_top_card:4",
    );
  });

  it("forgets a known R&D top card after the Runner steals it with engine-style label-only origin context", () => {
    const accessEvent = publicEvent("evt_label_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: 555,
      accessIndex: 0,
      effectiveAccessCount: 1,
    });
    const stealEvent = publicEvent("evt_label_2", "steal_agenda", 2, {
      actor: "runner",
      actionType: "steal_agenda",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: 555,
      accessIndex: 0,
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
      "rd_access_removed_top_card:4",
    );
  });

  it("does not treat label-only R&D text on unrelated events as top-card removal", () => {
    const accessEvent = publicEvent("evt_label_1", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: 555,
    });
    const unrelatedEvent = publicEvent("evt_label_noise", "gain_credit", 2, {
      actor: "runner",
      actionType: "gain_credit",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: 555,
    });

    const belief = reconstructBeliefState(
      runnerInput([accessEvent, unrelatedEvent]),
    );
    const freshness = belief.runnerOpponentModel?.rndTopFreshness;

    expect(freshness?.freshness).toBe("stale_known_same_top");
    expect(freshness?.knownTopDefinitionId).toBe(
      555,
    );
    expect(freshness?.invalidationReasons).not.toContain(
      "rd_access_removed_top_card:4",
    );
  });
});

describe("belief-state HQ hand memory retention", () => {
  it("uses HQ size at hidden installation even when the hand later shrinks", () => {
    const look = hqPrivateLookEvent("evt_look", 1, [
      588,
      606,
    ]);
    const draw = publicEvent("evt_draw", "draw_card", 2, {
      actor: "corp",
      actionType: "draw_card",
      corpRdDrawnToHqCount: 1,
    });
    const install = publicEvent("evt_install", "install_card", 3, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "root",
      corpHqCountBefore: 3,
      corpHqCountAfter: 2,
    });
    const operation = publicEvent("evt_play", "play_operation", 4, {
      actor: "corp",
      actionType: "play_operation",
      cardDefinitionId: 596,
      corpHqCountBefore: 2,
      corpHqCountAfter: 1,
    });
    const model = reconstructBeliefState(runnerInput([look, draw, install, operation], 1)).runnerOpponentModel;
    expect(model?.hiddenRemoteCandidateMemory).toMatchObject([
      { serverId: "remote_1", unknownCandidateCount: 1, exhaustive: false },
    ]);
  });

  it("reconciles only the hidden install bound to the revealed position", () => {
    const firstAccess = publicEvent("evt_access_data_wall", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: 450,
    });
    const firstInstall = publicEvent("evt_install_a", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:a",
      corpHqCountBefore: 2,
    });
    const secondAccess = publicEvent("evt_access_cortical", "access_card", 3, {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: 442,
    });
    const secondInstall = publicEvent("evt_install_b", "install_card", 4, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:b",
      corpHqCountBefore: 1,
    });
    const secondRez = publicEvent("evt_rez_b", "rez_ice", 5, {
      actor: "corp",
      actionType: "rez_ice",
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: "installed-position-v1:b",
      rezzedCardDefinitionId: 442,
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
        sourceEventId: 4,
        installedPositionKey: "installed-position-v1:a",
      }),
    ]);
    expect(belief.runnerOpponentModel?.hiddenRemoteCandidateMemory).toEqual([
      expect.objectContaining({
        sourceEventId: 4,
        installedPositionKey: "installed-position-v1:a",
      }),
    ]);
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "installed-position-v1:b",
        definitionId: 442,
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
        cardDefinitionId: 442,
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
      442,
      516,
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
      corpHqCountBefore: 2,
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
              { definitionId: 442, count: 1 },
              { definitionId: 516, count: 1 },
            ]),
          }),
        ],
      },
    });
    expect(memory?.invalidationReasons).toContain(
      "corp_discarded_hq_card:4",
    );
  });

  it("moves a known R&D top card into HQ on Corp draw and removes it when played", () => {
    const rdAccess = publicEvent("evt_rd_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 596,
    });
    const knownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const playedOperation = publicEvent("evt_play", "play_operation", 3, {
      actor: "corp",
      actionType: "play_operation",
      sourceDefinitionId: 596,
    });

    const afterDraw = reconstructBeliefState(
      runnerInput([rdAccess, knownDraw], 1),
    ).runnerOpponentModel?.hqHandMemory;
    const afterPlay = reconstructBeliefState(
      runnerInput([rdAccess, knownDraw, playedOperation], 0),
    ).runnerOpponentModel?.hqHandMemory;

    expect(afterDraw).toMatchObject({
      handCount: 1,
      knownDefinitions: [596],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(afterDraw?.invalidationReasons).toContain(
      `known_rnd_top_moved_to_hq:${rdAccess.eventId}->${knownDraw.eventId}`,
    );
    expect(afterPlay).toMatchObject({
      handCount: 0,
      knownDefinitions: [],
      knownCount: 0,
    });
    expect(afterPlay?.invalidationReasons).toContain(
      `known_hq_card_played:${playedOperation.eventId}`,
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
        hiddenZoneAction: "gypsy_schedule_analyzer_reveal_rd_until_agenda",
        agendaStoredInHq: true,
        storedAgendaDefinitionId: 432,
        revealedAgendaDefinitionIds: 432,
      },
    );

    const memory = reconstructBeliefState(runnerInput([gypsyResolution], 6))
      .runnerOpponentModel?.hqHandMemory;

    expect(memory).toMatchObject({
      handCount: 6,
      knownDefinitions: [432],
      knownCount: 1,
      allCardsKnown: false,
      ledger: {
        unknownRestCount: 5,
        safeDefinitions: [
          expect.objectContaining({
            definitionId: 432,
            count: 1,
          }),
        ],
      },
    });
    expect(memory?.invalidationReasons).toContain(
      "gypsy_known_agenda_stored_in_hq:3",
    );
  });

  it("keeps a known R&D-drawn operation in HQ after an unrelated hidden ICE install", () => {
    const rdAccess = publicEvent("evt_rd_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId: 596,
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
      corpHqCountBefore: 2,
    });

    const belief = reconstructBeliefState(
      runnerInput([rdAccess, knownDraw, hiddenIceInstall], 1),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: [596],
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
          definitionId: 596,
          count: 1,
        }),
      ],
    });
  });

  it("keeps known safe HQ ICE after an unknown draw and unrelated known operation play", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      442,
      449,
    ]);
    const unknownDraw = publicEvent("evt_draw", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });
    const playedDrawnOperation = publicEvent("evt_play", "play_operation", 3, {
      actor: "corp",
      actionType: "play_operation",
      serverId: "hq",
      cardDefinitionId: 493,
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, unknownDraw, playedDrawnOperation], 2),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
      knownDefinitions: [442, 449],
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({
          definitionId: 442,
          count: 1,
        }),
        expect.objectContaining({
          definitionId: 449,
          count: 1,
        }),
      ]),
    });
  });

  it("keeps a hidden ICE install candidate group after a draw without collapsing to memory none", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      442,
      449,
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
      corpHqCountBefore: 3,
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
            { definitionId: 442, count: 1 },
            { definitionId: 449, count: 1 },
          ]),
        }),
      ],
    });
  });

  it("ignores malformed remote ids for hidden install candidate groups", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      442,
      449,
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
      corpHqCountBefore: 3,
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
      596,
      594,
      606,
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
      corpHqCountBefore: 3,
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
        cardDefinitionId: 606,
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
        596,
        594,
      ]),
    );
    expect(hqMemory?.knownDefinitions).not.toContain(606);
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({ definitionId: 596 }),
        expect.objectContaining({ definitionId: 594 }),
      ]),
    });
    expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
      expect.objectContaining({
        zone: "hq",
        positionKey: "root:0",
        definitionId: 606,
      }),
    );
  });

  it("hard-invalidates HQ memory on hidden-zone reorder", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      442,
      449,
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
      "shuffle_changed_hq_hand:4",
    );
  });

  it("retains HQ memory when a shuffle-named ability moves no cards", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      442,
      449,
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
      knownDefinitions: [442, 449],
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(
      belief.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).not.toContain("shuffle_changed_hq_hand");
  });

  it("treats a current single-card HQ access as complete despite stale candidates", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      594,
      606,
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
      corpHqCountBefore: 2,
      },
    );
    const currentHqAccess = publicEvent("evt_hq_access", "access_card", 3, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "HQ",
      cardDefinitionId: 509,
      title: "Overtime Incentives",
    });

    const belief = reconstructBeliefState(
      runnerInput([hqLook, hiddenRootInstall, currentHqAccess], 1),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: [509],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: [
        expect.objectContaining({
          definitionId: 509,
          count: 1,
        }),
      ],
    });
  });

  it("removes trashed accessed HQ cards when the event only exposes a server label", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      120,
      509,
      552,
    ]);
    const trashAccessedHqCard = publicEvent(
      "evt_hq_trash",
      "trash_accessed_card",
      2,
      {
        actor: "runner",
        actionType: "trash_accessed_card",
        serverLabel: "HQ",
        cardDefinitionId: 120,
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
        509,
        552,
      ]),
    );
    expect(hqMemory?.knownDefinitions).not.toContain(
      120,
    );
    expect(hqMemory?.invalidationReasons).toContain(
      "known_hq_card_trash:4",
    );
  });

  it("invalidates complete HQ hand memory when a later HQ access contradicts it", () => {
    const hqLook = hqPrivateLookEvent("evt_hq_look", 1, [
      120,
      509,
      552,
      516,
    ]);
    const contradictingHqAccess = publicEvent(
      "evt_hq_access_data_wall",
      "access_card",
      2,
      {
        actor: "runner",
        actionType: "access_card",
        serverLabel: "HQ",
        cardDefinitionId: 450,
        title: "Data Wall 2.0",
      },
    );

    const belief = reconstructBeliefState(
      runnerInput([hqLook, contradictingHqAccess], 4),
    );
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory).toMatchObject({
      handCount: 4,
      knownDefinitions: [450],
      knownCount: 1,
      allCardsKnown: false,
    });
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 3,
      candidateGroups: [],
      safeDefinitions: [
        expect.objectContaining({
          definitionId: 450,
          count: 1,
        }),
      ],
    });
    expect(hqMemory?.invalidationReasons).toContain(
      "belief_warning:hq_all_known_contradiction:4",
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
      cardDefinitionId: 606,
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
        root: [visibleCard(606, "corp", "upgrade")],
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
      cardDefinitionId: 606,
      accessedCardPositionKey: "root:0",
      accessedArea: "root",
      accessedIndex: 0,
    });

    const belief = reconstructBeliefState(runnerInput([remoteAccess]));

    expect(belief.knownPositionMemory?.[0]).toMatchObject({
      zone: "remote_1",
      positionKey: "root:0",
      definitionId: 606,
    });
  });

  it("invalidates accessed remote root memory after the Corp scores from that server", () => {
    const remoteAccess = publicEvent("evt_remote_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverId: "remote_1",
      serverLabel: "Remote 1",
      cardDefinitionId: 406,
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
      cardDefinitionId: 27,
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
        definitionId: 27,
      }),
    );
  });
});

describe("Corp memory of Runner-known installed cards", () => {
  const exposed = publicEvent("evt_expose_trap", "resolve_choice", 1, {
    actor: "runner",
    actionType: "resolve_choice",
    publicRevealKind: "expose",
    publicRevealDefinitionId: 557,
    exposedCardDefinitionId: 557,
    exposedServerId: "remote_1",
    exposedArea: "root",
    exposedIndex: 0,
    exposedPositionKey: "root:0",
  });
  const persistentExposureStarted = publicEvent(
    "evt_persistent_exposure_started",
    "trigger_ability",
    1,
    {
      actor: "runner",
      actionType: "trigger_ability",
      abilityId: "successful_run_fort_counter_expose",
      exposedServerId: "remote_1",
      exposureThreshold: 1,
      exposureActive: true,
      counterMutations: [
        {
          schemaVersion: "public-counter-mutation-v1",
          operation: "add",
          counterType: "spy",
          scope: { kind: "server", serverId: "remote_1" },
          before: 0,
          amount: 1,
          after: 1,
        },
      ],
    },
  );
  const persistentExposureEnded = publicEvent(
    "evt_persistent_exposure_ended",
    "trigger_ability",
    3,
    {
      actor: "corp",
      actionType: "trigger_ability",
      serverId: "remote_1",
      counterMutations: [
        {
          schemaVersion: "public-counter-mutation-v1",
          operation: "remove",
          counterType: "spy",
          scope: { kind: "server", serverId: "remote_1" },
          before: 1,
          amount: 1,
          after: 0,
        },
      ],
      publicVisibilityTransitions: [
        {
          kind: "counter_threshold_identity_visibility_ended",
          counterType: "spy",
          scope: { kind: "server", serverId: "remote_1" },
          activeAtOrAbove: 1,
          before: 1,
          after: 0,
          cards: [
            {
              definitionId: 557,
              serverId: "remote_1",
              area: "root",
              positionKey: "root:0",
            },
          ],
        },
      ],
    },
  );

  it("binds a successful exact expose to the current Corp card instance", () => {
    const belief = reconstructBeliefState(corpInput([exposed]));
    expect(belief.corpOpponentModel?.runnerKnownCorpCardMemory).toEqual([
      expect.objectContaining({
        cardInstanceId: "trap-1",
        definitionId: 557,
        serverId: "remote_1",
        area: "root",
        positionKey: "root:0",
        learnedBy: "expose",
        sourceEventId: 3,
      }),
    ]);
  });

  it("treats every current card on an actively exposed server as Runner-known", () => {
    const nextTurn = publicEvent("evt_next_turn", "mandatory_draw", 2, {
      actor: "corp",
      actionType: "mandatory_draw",
    });

    expect(
      reconstructBeliefState(corpInput([persistentExposureStarted, nextTurn]))
        .corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([
      expect.objectContaining({
        cardInstanceId: "trap-1",
        definitionId: 557,
        serverId: "remote_1",
        positionKey: "root:0",
        learnedBy: "persistent_exposure",
        sourceEventId: 3,
      }),
    ]);
  });

  it("keeps persistent exposure active when a removal stays above threshold", () => {
    const secondCounter = publicEvent(
      "evt_second_counter",
      "trigger_ability",
      2,
      {
        actor: "runner",
        actionType: "trigger_ability",
        abilityId: "successful_run_fort_counter_expose",
        exposedServerId: "remote_1",
        exposureThreshold: 1,
        exposureActive: true,
        counterMutations: [
          {
            operation: "add",
            counterType: "spy",
            scope: { kind: "server", serverId: "remote_1" },
            before: 1,
            amount: 1,
            after: 2,
          },
        ],
      },
    );
    const removeOne = publicEvent("evt_remove_one", "trigger_ability", 3, {
      actor: "corp",
      actionType: "trigger_ability",
      serverId: "remote_1",
      counterMutations: [
        {
          operation: "remove",
          counterType: "spy",
          scope: { kind: "server", serverId: "remote_1" },
          before: 2,
          amount: 1,
          after: 1,
        },
      ],
    });

    expect(
      reconstructBeliefState(
        corpInput([persistentExposureStarted, secondCounter, removeOne]),
      ).corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([
      expect.objectContaining({
        cardInstanceId: "trap-1",
        learnedBy: "persistent_exposure",
      }),
    ]);
  });

  it("moves the last public identities into historical position memory when exposure ends", () => {
    expect(
      reconstructBeliefState(
        corpInput([persistentExposureStarted, persistentExposureEnded]),
      ).corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([
      expect.objectContaining({
        cardInstanceId: "trap-1",
        definitionId: 557,
        positionKey: "root:0",
        learnedBy: "persistent_exposure",
        sourceEventId: 5,
      }),
    ]);
  });

  it("does not invent historical identities when a threshold ends without a snapshot", () => {
    const removalWithoutSnapshot = publicEvent(
      "evt_persistent_exposure_removed_without_snapshot",
      "trigger_ability",
      3,
      {
        actor: "corp",
        actionType: "trigger_ability",
        serverId: "remote_1",
        counterMutations: [
          {
            operation: "remove",
            counterType: "spy",
            scope: { kind: "server", serverId: "remote_1" },
            before: 1,
            amount: 1,
            after: 0,
          },
        ],
      },
    );

    expect(
      reconstructBeliefState(
        corpInput([persistentExposureStarted, removalWithoutSnapshot]),
      ).corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([]);
  });

  it("invalidates the ended-exposure snapshot after replacement and hidden reinstall", () => {
    const returned = publicEvent(
      "evt_return_after_exposure",
      "gain_credit",
      4,
      {
        actor: "corp",
        actionType: "gain_credit",
        serverId: "remote_1",
        v1951CorpUtilityAbility: "corp_installed_card_to_hq",
        hiddenZoneAction: "corp_installed_card_to_hq",
        targetCardId: "trap-1",
      },
    );
    const reinstalled = publicEvent("evt_hidden_reinstall", "install_card", 5, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "root",
    });

    expect(
      reconstructBeliefState(
        corpInput(
          [
            persistentExposureStarted,
            persistentExposureEnded,
            returned,
            reinstalled,
          ],
          "trap-2",
        ),
      ).corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([]);
  });

  it("does not learn from a prevented expose attempt", () => {
    const prevented = publicEvent("evt_expose_prevented", "resolve_choice", 1, {
      actor: "corp",
      actionType: "resolve_choice",
      exposePreventionDecision: "use",
      publicRevealKind: "expose",
      publicRevealDefinitionId: 557,
      exposedCardDefinitionId: 557,
      exposedServerId: "remote_1",
      exposedArea: "root",
      exposedIndex: 0,
      exposedPositionKey: "root:0",
    });
    expect(
      reconstructBeliefState(corpInput([prevented])).corpOpponentModel
        ?.runnerKnownCorpCardMemory,
    ).toEqual([]);
  });

  it("binds an exact installed Remote access to the current Corp card", () => {
    const accessed = publicEvent("evt_access_trap", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      cardDefinitionId: 557,
      serverId: "remote_1",
      accessedArea: "root",
      accessedIndex: 0,
      accessedCardPositionKey: "root:0",
    });
    expect(
      reconstructBeliefState(corpInput([accessed])).corpOpponentModel
        ?.runnerKnownCorpCardMemory,
    ).toEqual([
      expect.objectContaining({
        cardInstanceId: "trap-1",
        learnedBy: "access",
        sourceEventId: 3,
      }),
    ]);
  });

  it("survives an unrelated server mutation and ordinary turn history", () => {
    const otherInstall = publicEvent("evt_other_install", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_2",
      installPlacement: "root",
    });
    const credit = publicEvent("evt_credit", "gain_credit", 3, {
      actor: "corp",
      actionType: "gain_credit",
    });
    expect(
      reconstructBeliefState(corpInput([exposed, otherInstall, credit]))
        .corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toHaveLength(1);
  });

  it("invalidates replacement or installation at the same root area", () => {
    const replacement = publicEvent("evt_replace", "install_card", 2, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "root",
    });
    expect(
      reconstructBeliefState(corpInput([exposed, replacement]))
        .corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([]);
  });

  it("invalidates Cowboy return and does not transfer knowledge to reinstall", () => {
    const returned = publicEvent("evt_return", "gain_credit", 2, {
      actor: "corp",
      actionType: "gain_credit",
      serverId: "remote_1",
      v1951CorpUtilityAbility: "corp_installed_card_to_hq",
      hiddenZoneAction: "corp_installed_card_to_hq",
      targetCardId: "trap-1",
    });
    const reinstalled = publicEvent("evt_reinstall", "install_card", 3, {
      actor: "corp",
      actionType: "install_card",
      serverId: "remote_1",
      installPlacement: "root",
    });
    expect(
      reconstructBeliefState(
        corpInput([exposed, returned, reinstalled], "trap-2"),
      ).corpOpponentModel?.runnerKnownCorpCardMemory,
    ).toEqual([]);
  });

  it("keeps an independent known card when an exact Cowboy target is returned", () => {
    const otherExposed = publicEvent("evt_expose_other", "resolve_choice", 2, {
      actor: "runner",
      actionType: "resolve_choice",
      publicRevealKind: "expose",
      publicRevealDefinitionId: syntheticCardDefinitionId("other_asset"),
      exposedCardDefinitionId: syntheticCardDefinitionId("other_asset"),
      exposedServerId: "remote_2",
      exposedArea: "root",
      exposedIndex: 0,
      exposedPositionKey: "root:0",
    });
    const returned = publicEvent("evt_return_exact", "gain_credit", 3, {
      actor: "corp",
      actionType: "gain_credit",
      v1951CorpUtilityAbility: "corp_installed_card_to_hq",
      hiddenZoneAction: "corp_installed_card_to_hq",
      targetCardId: "trap-1",
    });
    const input = corpInput([exposed, otherExposed, returned], "trap-1", {
      root: [],
      ice: [],
    });
    input.playerView.servers.find(
      (candidate) => candidate.id === "remote_2",
    )!.root = [visibleCard("other_asset", "corp", "asset")];

    expect(
      reconstructBeliefState(input).corpOpponentModel
        ?.runnerKnownCorpCardMemory,
    ).toEqual([
      expect.objectContaining({
        cardInstanceId: "other_asset_instance",
        serverId: "remote_2",
        sourceEventId: 4,
      }),
    ]);
  });

  it("keeps publicly known ICE through derez at the same position", () => {
    const rez = publicEvent("evt_rez_ice", "rez_ice", 1, {
      actor: "corp",
      actionType: "rez_ice",
      serverId: "remote_1",
      cardDefinitionId: 589,
    });
    const belief = reconstructBeliefState(
      corpInput([rez], "trap-1", {
        root: [],
        ice: [
          {
            ...visibleCard(589, "corp", "ice"),
            instanceId: "ice-1",
            rezzed: false,
          },
        ],
      }),
    );
    expect(belief.corpOpponentModel?.runnerKnownCorpCardMemory).toContainEqual(
      expect.objectContaining({
        cardInstanceId: "ice-1",
        positionKey: "ice:0",
        learnedBy: "public_rez",
      }),
    );
  });

  it("invalidates exact ICE identity after conceal and reorder", () => {
    const rez = publicEvent("evt_rez_ice", "rez_ice", 1, {
      actor: "corp",
      actionType: "rez_ice",
      serverId: "remote_1",
      cardDefinitionId: 589,
    });
    const conceal = publicEvent("evt_conceal", "resolve_choice", 2, {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "remote_1",
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      hiddenZoneMutationKind: "reorder",
      hiddenZoneAffectedCardCount: 1,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: false,
    });
    const belief = reconstructBeliefState(
      corpInput([rez, conceal], "trap-1", {
        root: [],
        ice: [
          {
            ...visibleCard(589, "corp", "ice"),
            instanceId: "ice-1",
            rezzed: false,
          },
        ],
      }),
    );
    expect(belief.corpOpponentModel?.runnerKnownCorpCardMemory).toEqual([]);
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
        sourceEventIds: [5,6],
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
      "remote_state_changed:3:remote_10",
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
        cardDefinitionId: syntheticCardDefinitionId("neutral-card"),
      },
    );
    const idOnlyExpose = publicEvent(
      "evt_id_only_expose",
      "resolve_choice",
      2,
      {
        actor: "runner",
        actionType: "resolve_choice",
        cardDefinitionId: syntheticCardDefinitionId("custom-expose-tool"),
      },
    );
    const breachKind = publicEvent("evt_breach_kind", "resolve_choice", 3, {
      actor: "runner",
      actionType: "resolve_choice",
      revealKind: "breach",
      cardDefinitionId: syntheticCardDefinitionId("custom-reveal-tool"),
    });

    const classifications = reconstructBeliefState(
      runnerInput([structuredExpose, idOnlyExpose, breachKind]),
    ).eventClassifications;

    expect(
      classifications.find((entry) => entry.eventId === 3)
        ?.family,
    ).toBe("expose");
    expect(
      classifications.find((entry) => entry.eventId === 4)
        ?.family,
    ).toBe("other");
    expect(
      classifications.find((entry) => entry.eventId === 5)
        ?.family,
    ).toBe("other");
  });
});

describe("installed-source trash inside an activated ability", () => {
  it.each(["source", "other", "none"])(
    "reconciles only a publicly identified departing source: %s",
    (variant) => {
      const source = 521;
      const upgrade = 578;
      const events = [source, upgrade].map((definitionId, index) =>
        publicEvent(`root_${index}`, "access_card", index, {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          installPlacement: "root",
          accessedArea: "root",
          accessedCardPositionKey: `root:${index}`,
          installedPositionKey: `installed-position-v1:root${index}`,
          cardDefinitionId: definitionId,
        }),
      );
      events.push(
        publicEvent("cash", "activated_card_ability", 2, {
          actor: "corp",
          actionType: "activated_card_ability",
          serverId: "remote_1",
          installPlacement: "root",
          installedPositionKey: "installed-position-v1:root0",
          sourceDefinitionId: source,
          gainCreditsAmount: 2,
          ...(variant === "none"
            ? {}
            : {
                trashedCardDefinitionId:
                  variant === "source" ? source : "different-source",
              }),
        }),
      );
      const belief = reconstructBeliefState(runnerInput(events));
      const roots = belief.knownPositionMemory!.filter((m) =>
        /^root:/.test(m.positionKey),
      );
      expect(roots.map((m) => [m.positionKey, m.definitionId])).toEqual(
        variant === "source"
          ? [["root:0", upgrade]]
          : [
              ["root:0", source],
              ["root:1", upgrade],
            ],
      );
      // Cashflow remains an ability event; it must not become a phantom HQ departure.
      expect(belief.eventClassifications.at(-1)?.family).toBe("other");
    },
  );
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
      cardDefinitionId: 405,
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

function corpInput(
  events: PublicGameEvent[],
  rootInstanceId = "trap-1",
  serverCards?: { root: VisibleCard[]; ice: VisibleCard[] },
): AiDecisionInput {
  const trap = {
    ...visibleCard(557, "corp", "asset"),
    instanceId: rootInstanceId,
    rezzed: false,
    advancementCounters: 0,
  };
  const playerView = {
    side: "corp",
    stateVersion: events.at(-1)?.stateVersionAfter ?? 0,
    own: { credits: 5, clicks: 3, gripOrHq: [], tags: 0 },
    opponent: {
      credits: 5,
      clicks: 3,
      handCount: 3,
      tags: 0,
      rig: [],
    },
    servers: [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: serverCards?.ice ?? [],
        root: serverCards?.root ?? [trap],
      },
      { id: "remote_2", label: "Remote 2", ice: [], root: [] },
    ],
    publicEvents: events,
  } as unknown as PlayerView;
  return {
    side: "corp",
    playerView,
    eventTail: events,
    legalActions: [],
    difficulty: "normal",
    seed: "corp-runner-known-card-memory",
    decisionId: "corp-runner-known-card-memory",
    actionNumber: 1,
    profileId: "test",
  };
}

function hqPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownHqDefinitionIds: number[],
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
  knownRndDefinitionIds: number[],
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
  eventLabel: string,
  type: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId: stateVersionBefore + 2,
    type,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash_${eventLabel}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      // These synthetic draw events represent ordinary one-card draws unless
      // the case supplies a different Engine observation.
      ...(publicPayload.actor === "corp" &&
      (type === "mandatory_draw" || type === "draw_card")
        ? { corpRdDrawnToHqCount: 1 }
        : {}),
      ...publicPayload,
    },
  } as PublicGameEvent;
}

function visibleCard(
  definition: number | string,
  owner: "runner" | "corp",
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: `${definition}_instance`,
    definitionId: typeof definition === "number" ? definition : syntheticCardDefinitionId(definition),
    title: String(definition),
    type,
    known: true,
    owner,
    controller: owner,
  };
}

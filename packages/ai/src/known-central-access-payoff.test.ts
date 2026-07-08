import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { BeliefState, RunnerOpponentModel } from "./belief-state";
import {
  evaluateKnownCentralAccessPayoff,
  hqMemoryInvalidationReasonMatches,
} from "./known-central-access-payoff";

describe("known central access payoff HQ knownness", () => {
  it("does not treat ledger-only hidden install candidates as missing HQ memory", () => {
    const payoff = evaluateKnownCentralAccessPayoff(
      aiInput({ handCount: 1 }),
      "hq",
      beliefWithHqMemory({
        handCount: 1,
        knownDefinitions: [],
        unknownRestCount: 0,
        candidateGroups: [
          {
            groupId: "candidate-hidden-ice",
            reason: "hidden_ice_install_candidates",
            sourceEventId: "evt_install",
            serverId: "remote_1",
            installPlacement: "ice",
            candidateDefinitions: [
              { definitionId: "onr_v1_230_cortical-scanner", count: 1 },
              { definitionId: "onr_v1_237_data-wall", count: 1 },
            ],
            candidateCount: 2,
            unknownCandidateCount: 0,
            departureCount: 1,
            basis: ["install_placement:ice"],
          },
        ],
      }),
    );

    expect(payoff.payoff).toBe("unknown");
    expect(payoff.penalty).toBeGreaterThan(0);
    expect(payoff.evidence).not.toContain("hq_hand_memory:none");
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "hq_candidate_group_count:1",
        "hq_unknown_rest_count:0",
        "hq_knownness_payoff:mostly_known_low_value",
      ]),
    );
  });

  it("keeps a high-known low-value HQ hand unknown but penalized", () => {
    const payoff = evaluateKnownCentralAccessPayoff(
      aiInput({ handCount: 5 }),
      "hq",
      beliefWithHqMemory({
        handCount: 5,
        knownDefinitions: [
          "onr_v1_230_cortical-scanner",
          "onr_v1_237_data-wall",
          "onr_v1_281_accounts-receivable",
          "simple_economy_operation",
        ],
        unknownRestCount: 1,
      }),
    );

    expect(payoff).toMatchObject({
      payoff: "unknown",
      knownNoCurrentPayoff: false,
    });
    expect(payoff.penalty).toBeGreaterThan(0);
    expect(payoff.reasons).toContain("hq_mostly_known_low_value");
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "hq_hand_known_count:4",
        "hq_hand_count:5",
        "hq_known_fraction:0.8",
        "hq_unknown_access_chance_estimate:0.2",
        "hq_knownness_payoff:mostly_known_low_value",
      ]),
    );
  });

  it("does not apply the low-value penalty when candidate groups may contain an agenda", () => {
    const payoff = evaluateKnownCentralAccessPayoff(
      aiInput({ handCount: 2 }),
      "hq",
      beliefWithHqMemory({
        handCount: 2,
        knownDefinitions: ["simple_economy_operation"],
        unknownRestCount: 0,
        candidateGroups: [
          {
            groupId: "candidate-hidden-root",
            reason: "hidden_root_install_candidates",
            sourceEventId: "evt_install",
            serverId: "remote_1",
            installPlacement: "root",
            candidateDefinitions: [
              { definitionId: "simple_agenda", count: 1 },
              { definitionId: "simple_economy_asset", count: 1 },
            ],
            candidateCount: 2,
            unknownCandidateCount: 0,
            departureCount: 1,
            basis: ["install_placement:root"],
          },
        ],
      }),
    );

    expect(payoff).toMatchObject({
      payoff: "unknown",
      penalty: 0,
    });
    expect(payoff.evidence).toContain(
      "hq_knownness_payoff:candidate_possible_payoff",
    );
  });

  it("suppresses a repeated HQ run after the only current HQ card was accessed", () => {
    const hqLook = publicEvent("evt_hq_look", "resolve_choice", 1, {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: 2,
      knownHqDefinitionIds: ["simple_economy_asset", "simple_upgrade"],
    });
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
    const input = aiInput({
      handCount: 1,
      publicEvents: [hqLook, hiddenRootInstall, currentHqAccess],
    });

    const payoff = evaluateKnownCentralAccessPayoff(input, "hq");

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
      penalty: 640,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_hq_hand_low_value",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "central_memory_payoff:known",
        "hq_hand_known_count:1",
        "hq_hand_count:1",
        "hq_all_cards_known:true",
        "hq_unknown_rest_count:0",
        "hq_knownness_payoff:mostly_known_low_value",
        "hq_run_suppressed_by_fully_known_low_value_hand:true",
      ]),
    );
  });

  it("does not keep trashed HQ assets or upgrades as affordable trash payoff", () => {
    const hqLook = publicEvent("evt_hq_look", "resolve_choice", 1, {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: 3,
      knownHqDefinitionIds: [
        "onr_proteus_062_lesley-major",
        "onr_v1_297_overtime-incentives",
        "onr_v1_340_setup",
      ],
    });
    const trashLesley = publicEvent("evt_trash_lesley", "trash_accessed_card", 2, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverLabel: "HQ",
      cardDefinitionId: "onr_proteus_062_lesley-major",
      title: "Lesley Major",
    });
    const trashSetup = publicEvent("evt_trash_setup", "trash_accessed_card", 3, {
      actor: "runner",
      actionType: "trash_accessed_card",
      serverLabel: "HQ",
      cardDefinitionId: "onr_v1_340_setup",
      title: "Setup!",
    });
    const input = aiInput({
      credits: 6,
      handCount: 1,
      publicEvents: [hqLook, trashLesley, trashSetup],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-hq", "hq")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(input, "hq");

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_hq_hand_low_value",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "hq_hand_known_count:1",
        "hq_hand_count:1",
        "hq_known_trash_payoff_count:0",
        "central_memory_payoff:known_low_value",
      ]),
    );
    expect(payoff.evidence).not.toContain("central_memory_payoff:trash_affordable");
  });

  it("suppresses a repeated R&D run after the Runner declined the known top trash", () => {
    const rdAccess = publicEvent("evt_rd_bbs_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      title: "BBS Whispering Campaign",
    });
    const declineTrash = publicEvent("evt_rd_bbs_decline", "decline_trash", 2, {
      actor: "runner",
      actionType: "decline_trash",
    });
    const input = aiInput({
      handCount: 1,
      publicEvents: [rdAccess, declineTrash],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(input, "rd");

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
      penalty: 700,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_rnd_top_declined_trash_same_top",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "rnd_freshness:stale_known_same_top",
        "rnd_known_top_definition:onr_v1_309_bbs-whispering-campaign",
        "rnd_known_top_trash_affordable:true",
        "rd_run_suppressed_by_recent_declined_trash:true",
        "central_memory_payoff:known_low_value",
      ]),
    );
  });

  it("suppresses a repeated R&D run when trashing the known top would drain the reserve", () => {
    const rdAccess = publicEvent("evt_rd_bbs_access", "access_card", 1, {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "R&D",
      targets: { serverLabel: "R&D" },
      cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      title: "BBS Whispering Campaign",
    });
    const input = aiInput({
      handCount: 1,
      credits: 4,
      publicEvents: [rdAccess],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(input, "rd");

    expect(payoff).toMatchObject({
      payoff: "trash_unaffordable",
      knownNoCurrentPayoff: true,
      penalty: 700,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_rnd_top_trash_reserve_unsafe",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "rnd_known_top_trash_affordable:true",
        "rnd_known_top_credits_after_trash:0",
        "rnd_known_top_trash_reserve_floor:2",
        "rd_run_suppressed_by_known_trash_reserve:true",
        "central_memory_payoff:trash_unaffordable",
      ]),
    );
  });

  it("suppresses an R&D multiaccess plan when every known accessible card has no payoff", () => {
    const input = aiInput({
      handCount: 1,
      rig: [
        visibleInstalledRunnerCard(
          "onr_v1_139_r-and-d-interface",
          "hardware",
        ),
      ],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(
      input,
      "rd",
      beliefWithRndMemory({
        lastKnownAccessEventId: "evt_rd_private_look",
        knownToRunner: true,
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "simple_economy_operation",
        knownTopIsAgenda: false,
        knownSequenceDefinitionIds: [
          "simple_economy_operation",
          "simple_barrier_ice",
        ],
        freshenedByRunnerAccess: false,
        invalidationReasons: [],
      }),
    );

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
      penalty: 760,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_rnd_access_sequence_low_value_stale",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "rnd_known_access_depth_estimate:2",
        "rnd_known_sequence_evaluated_count:2",
        "central_memory_payoff:known_low_value",
        "rd_run_suppressed_by_known_sequence_no_payoff:true",
      ]),
    );
    expect(payoff.evidence).not.toContain("central_memory_payoff:access_bonus");
  });

  it("keeps R&D multiaccess pressure when the known accessible sequence contains an agenda", () => {
    const input = aiInput({
      handCount: 1,
      rig: [
        visibleInstalledRunnerCard(
          "onr_v1_139_r-and-d-interface",
          "hardware",
        ),
      ],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(
      input,
      "rd",
      beliefWithRndMemory({
        lastKnownAccessEventId: "evt_rd_private_look",
        knownToRunner: true,
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "simple_economy_operation",
        knownTopIsAgenda: false,
        knownSequenceDefinitionIds: [
          "simple_economy_operation",
          "simple_agenda",
        ],
        freshenedByRunnerAccess: false,
        invalidationReasons: [],
      }),
    );

    expect(payoff).toMatchObject({
      payoff: "agenda",
      knownNoCurrentPayoff: false,
      score: 520,
      penalty: 0,
    });
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "rnd_known_access_depth_estimate:2",
        "rnd_known_sequence_evaluated_count:2",
        "rnd_known_sequence_agenda_definition:simple_agenda",
        "central_memory_payoff:agenda",
        "rd_run_boosted_by_known_sequence_agenda:true",
      ]),
    );
  });

  it("does not treat R&D information tools as installed R&D multiaccess", () => {
    const input = aiInput({
      handCount: 1,
      rig: [
        visibleInstalledRunnerCard(
          "onr_v1_024_expert-schedule-analyzer",
          "program",
        ),
      ],
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const payoff = evaluateKnownCentralAccessPayoff(
      input,
      "rd",
      beliefWithRndMemory({
        lastKnownAccessEventId: "evt_rd_private_look",
        knownToRunner: true,
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "simple_economy_operation",
        knownTopIsAgenda: false,
        knownSequenceDefinitionIds: [
          "simple_economy_operation",
          "simple_agenda",
        ],
        freshenedByRunnerAccess: false,
        invalidationReasons: [],
      }),
    );

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
      penalty: 640,
    });
    expect(payoff.reasons).toEqual(
      expect.arrayContaining([
        "known_rnd_top_low_value_stale",
        "central_known_no_current_payoff",
      ]),
    );
    expect(payoff.evidence).not.toEqual(
      expect.arrayContaining([
        "rnd_known_access_depth_estimate:2",
        "rnd_known_sequence_agenda_definition:simple_agenda",
      ]),
    );
  });

  it("matches HQ memory invalidation reasons by exact reason code", () => {
    expect(
      hqMemoryInvalidationReasonMatches(
        "corp_draw_added_unknown_hq_card:evt_1",
        ["corp_draw_added_unknown_hq_card"],
      ),
    ).toBe(true);
    expect(
      hqMemoryInvalidationReasonMatches("shuffle_changed_hq_hand", [
        "shuffle_changed_hq_hand",
      ]),
    ).toBe(true);
    expect(
      [
        "corp_draw_added_unknown_hq_cardish_noise:evt_1",
        "not_corp_installed_hidden_hq_card_noise",
        "shuffle_changed_hq_handish_noise",
      ].some((reason) =>
        hqMemoryInvalidationReasonMatches(reason, [
          "corp_draw_added_unknown_hq_card",
          "corp_installed_hidden_hq_card",
          "shuffle_changed_hq_hand",
        ]),
      ),
    ).toBe(false);
  });
});

function aiInput(params: {
  handCount: number;
  credits?: number;
  rig?: VisibleCard[];
  publicEvents?: PublicGameEvent[];
  legalActions?: LegalAction[];
  servers?: PlayerView["servers"];
}): AiDecisionInput {
  const legalActions = params.legalActions ?? [runAction("run-hq", "hq")];
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits ?? 6,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: params.handCount,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers ?? [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: params.publicEvents ?? [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.publicEvents ?? [],
    legalActions,
    difficulty: "normal",
    seed: "known-central-hq-knownness-test",
    decisionId: "known-central-hq-knownness-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
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

function beliefWithHqMemory(params: {
  handCount: number;
  knownDefinitions: string[];
  unknownRestCount: number;
  candidateGroups?: RunnerOpponentModel["hqHandMemory"]["ledger"]["candidateGroups"];
}): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-invalidated-rd",
    knownToRunner: false,
    freshness: "invalidated",
    invalidationReasons: [],
  };
  const safeDefinitions = params.knownDefinitions.map((definitionId) => ({
    definitionId,
    count: 1,
    sourceEventIds: ["test-hq-look"],
  }));
  return {
    side: "runner",
    version: "belief-test",
    entries: [],
    assumptions: [],
    uncertainty: [],
    invalidationLog: [],
    eventClassifications: [],
    runnerOpponentModel: {
      corpPlanEstimate: {
        scoring: 0,
        economy: 0,
        protection: 0,
      },
      remoteCardBelief: [],
      unrezzedIceRiskModel: [],
      hqAgendaDensityEstimate: 0,
      rndValueEstimate: 0,
      corpCreditReserveInterpretation: "medium",
      rndTopFreshness,
      knownPositionMemory: [],
      hqHandMemory: {
        handCount: params.handCount,
        knownDefinitions: params.knownDefinitions,
        knownCount: params.knownDefinitions.length,
        allCardsKnown:
          params.knownDefinitions.length === params.handCount &&
          params.unknownRestCount === 0 &&
          (params.candidateGroups?.length ?? 0) === 0,
        sourceEventIds: ["test-hq-look"],
        invalidationReasons: [],
        ledger: {
          safeDefinitions,
          unknownRestCount: params.unknownRestCount,
          candidateGroups: params.candidateGroups ?? [],
          sourceEventIds: ["test-hq-look"],
          invalidationReasons: [],
        },
      },
      hiddenRemoteCandidateMemory: [],
    },
    rndTopFreshness,
    knownPositionMemory: [],
  };
}

function beliefWithRndMemory(
  rndTopFreshness: RunnerOpponentModel["rndTopFreshness"],
): BeliefState {
  const base = beliefWithHqMemory({
    handCount: 0,
    knownDefinitions: [],
    unknownRestCount: 0,
  });
  return {
    ...base,
    runnerOpponentModel: {
      ...base.runnerOpponentModel!,
      rndTopFreshness,
    },
    rndTopFreshness,
  };
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function visibleInstalledRunnerCard(
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId: `${definitionId}_installed`,
    definitionId,
    title: definitionId,
    owner: "runner",
    controller: "runner",
    type,
    known: true,
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

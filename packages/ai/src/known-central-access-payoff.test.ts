import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
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
  rig?: VisibleCard[];
}): AiDecisionInput {
  const legalActions = [runAction("run-hq", "hq")];
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 6,
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
    seed: "known-central-hq-knownness-test",
    decisionId: "known-central-hq-knownness-test:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
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

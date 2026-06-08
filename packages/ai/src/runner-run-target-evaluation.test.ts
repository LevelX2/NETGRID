import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import type { BeliefState, RunnerOpponentModel } from "./belief-state";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
import {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";

describe("Runner RunTargetEvaluation + EconomyPosture", () => {
  it("recommends an unknown reachable R&D run", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
  });

  it("suppresses R&D when the top card is stale known low value and no multiaccess is present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_281_accounts-receivable",
      }),
    });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: false,
      recommendation: "do_not_run_now",
    });
  });

  it("uses installed HQ multiaccess hints to upgrade HQ pressure", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected R&D evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(evaluation.installedRunPayoff).toMatchObject({
      immediateAccessValue: 90,
      multiaccessAvailable: true,
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:hq:multiaccess");
  });

  it("recognizes R&D multiaccess from structured hints beyond the legacy fallback list", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
      rig: [
        visibleCard("highlighter", {
          definitionId: "onr_proteus_090_highlighter",
          title: "Highlighter",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "installed_run_payoff:rd:multiaccess",
        "installed_run_payoff:rd:successful_run_counter",
      ]),
    );
  });

  it("uses installed HQ access-trash hints without exposing hidden cards", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("crumble", {
          definitionId: "onr_proteus_084_crumble",
          title: "Crumble",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      recommendation: "run_now",
    });
    expect(evaluation.installedRunPayoff.immediateAccessValue).toBeGreaterThan(0);
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "installed_run_payoff:hq:access_trash",
        "installed_run_payoff:hq:purge_tax",
      ]),
    );
    expect(evaluation.evidence.join("\n")).not.toMatch(
      /hidden|privatePayload|fullState|cardInstances/i,
    );
  });

  it("keeps known-low R&D damped even when installed R&D payoff exists", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
      rig: [
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_281_accounts-receivable",
      }),
    });
    if (!evaluation) throw new Error("Expected R&D evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: true,
      recommendation: "do_not_run_now",
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:rd:multiaccess");
  });

  it("ranks HQ payoff above neutral R&D when only HQ Interface is installed", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("hq");
    expect(evaluations[0]?.evidence).toContain(
      "installed_run_payoff:hq:multiaccess",
    );
    expect(evaluations[1]?.targetServerId).toBe("rd");
  });

  it("ranks R&D payoff above neutral HQ when only R&D Interface is installed", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("rd");
    expect(evaluations[0]?.evidence).toContain(
      "installed_run_payoff:rd:multiaccess",
    );
    expect(evaluations[1]?.targetServerId).toBe("hq");
  });

  it("keeps HQ and R&D installed payoffs visible when both are present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });
    const hq = evaluations.find((evaluation) => evaluation.targetServerId === "hq");
    const rd = evaluations.find((evaluation) => evaluation.targetServerId === "rd");

    expect(hq?.accessPayoff).toBe("access_bonus");
    expect(rd?.accessPayoff).toBe("access_bonus");
    expect(hq?.evidence).toContain("installed_run_payoff:hq:multiaccess");
    expect(rd?.evidence).toContain("installed_run_payoff:rd:multiaccess");
  });

  it("lets a known R&D agenda beat installed HQ multiaccess pressure", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_203_hostile-takeover",
        knownTopIsAgenda: true,
      }),
    });

    expect(evaluations[0]?.targetServerId).toBe("rd");
    expect(evaluations[0]?.accessPayoff).toBe("agenda");
    expect(evaluations[1]?.targetServerId).toBe("hq");
  });

  it("lets a remote score threat oversteer central future payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq"),
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        runAction("run-remote-1", "remote_1"),
      ],
      rig: [
        visibleCard("boardwalk", {
          definitionId: "onr_v1_008_boardwalk",
          title: "Boardwalk",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("remote_1");
    expect(evaluations[0]?.accessPayoff).toBe("score_threat");
    expect(evaluations[1]?.targetServerId).toBe("hq");
    expect(evaluations[1]?.evidence).toContain(
      "installed_run_payoff:hq:future_hq_info",
    );
  });

  it("does not turn an unreachable payoff target into a legal run choice", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq", {
          ice: [
            visibleCard("hq-wall", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:hq:multiaccess");
  });

  it("suppresses HQ when every HQ card is known and has no current access payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
    });
    input.playerView.opponent.handCount = 2;

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq([
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
      ]),
    });
    const hqEvaluation = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );

    expect(hqEvaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
    expect(hqEvaluation?.evidence).toContain("central_memory_payoff:known");
    expect(hqEvaluation?.evidence).toContain("hq_all_cards_known:true");
  });

  it("downranks HQ when four of five cards are known low value and no multiaccess is present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
    });

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(
        [
          "onr_v1_230_cortical-scanner",
          "onr_v1_237_data-wall",
          "onr_v1_281_accounts-receivable",
          "simple_economy_operation",
        ],
        { handCount: 5, unknownRestCount: 1 },
      ),
    });
    const hq = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );
    const rd = evaluations.find(
      (evaluation) => evaluation.targetServerId === "rd",
    );
    if (!hq || !rd) throw new Error("Expected central evaluations");

    expect(hq).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "run_if_free",
    });
    expect(hq.score).toBeLessThan(rd.score);
    expect(evidenceNumber(hq.evidence, "access_payoff_score_adjustment")).toBeLessThan(0);
    expect(hq.evidence).toEqual(
      expect.arrayContaining([
        "hq_hand_known_count:4",
        "hq_hand_count:5",
        "hq_known_fraction:0.8",
        "hq_unknown_fraction:0.2",
        "hq_known_low_value_count:4",
        "hq_knownness_payoff:mostly_known_low_value",
      ]),
    );
  });

  it("keeps HQ attractive as unknown when only one of five cards is known", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(["onr_v1_237_data-wall"], {
        handCount: 5,
        unknownRestCount: 4,
      }),
    });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "run_if_free",
    });
    expect(evidenceNumber(evaluation.evidence, "access_payoff_score_adjustment")).toBe(0);
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "hq_known_fraction:0.2",
        "hq_unknown_fraction:0.8",
        "hq_knownness_payoff:meaningful_unknown_rest",
      ]),
    );
  });

  it("reduces but keeps the high-known HQ low-value penalty when HQ multiaccess is installed", () => {
    const baseParams = {
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    };
    const beliefState = beliefWithKnownHq(
      [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
        "onr_v1_281_accounts-receivable",
        "simple_economy_operation",
      ],
      { handCount: 5, unknownRestCount: 1 },
    );
    const [withoutMultiaccess] = evaluateRunnerRunTargets({
      input: aiInput(baseParams),
      beliefState,
    });
    const [withMultiaccess] = evaluateRunnerRunTargets({
      input: aiInput({
        ...baseParams,
        rig: [
          visibleCard("hq-interface", {
            definitionId: "onr_v1_129_hq-interface",
            title: "HQ Interface",
            type: "hardware",
          }),
        ],
      }),
      beliefState,
    });
    if (!withoutMultiaccess || !withMultiaccess) {
      throw new Error("Expected HQ evaluations");
    }

    const noMultiPenalty = Math.abs(
      evidenceNumber(withoutMultiaccess.evidence, "access_payoff_score_adjustment"),
    );
    const multiPenalty = Math.abs(
      evidenceNumber(withMultiaccess.evidence, "access_payoff_score_adjustment"),
    );

    expect(withoutMultiaccess).toMatchObject({
      accessPayoff: "unknown",
      multiaccessAvailable: false,
    });
    expect(withMultiaccess).toMatchObject({
      accessPayoff: "access_bonus",
      knownAccessState: "unknown",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(multiPenalty).toBeGreaterThan(0);
    expect(multiPenalty).toBeLessThan(noMultiPenalty);
    expect(withMultiaccess.evidence).toEqual(
      expect.arrayContaining([
        "hq_access_depth_estimate:2",
        "hq_unknown_access_chance_estimate:0.4",
        "hq_knownness_payoff:mostly_known_low_value",
        "installed_run_payoff:hq:multiaccess",
      ]),
    );
  });

  it("suppresses a known remote root with no current access payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              definitionId: "onr_v1_281_accounts-receivable",
              type: "operation",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
  });

  it("turns a remote score threat behind visible unbreakable ICE into find-breaker setup", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          ice: [
            visibleCard("remote-ice-1", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
  });

  it("prefers economy when credits are below the run floor and no high payoff exists", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture).toMatchObject({
      minimumCreditFloor: 2,
      fundingNeed: true,
      recommendation: "build_economy",
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("builds a creditbase funding need for useful hand cards blocked by credits", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        developmentRole: "access_payoff",
        availability: "missing_credits",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 4,
          missingCredits: 4,
          reason: "cannot_pay",
        },
      }),
    ];

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations,
    });
    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations,
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 0,
      desiredCreditReserve: 4,
      fundingNeed: true,
      usefulHandCardsBlockedByCredits: 1,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "useful_now",
      installOrPlayCost: 4,
      missingCredits: 4,
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("allows setup spending at five credits when a useful hand card is legal", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "memory_support",
          availability: "legal_now",
          currentNeed: "setup",
          priority: 620,
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 5,
      fundingNeed: false,
      usefulHandCardsAffordableNow: 1,
      recommendation: "allow_setup_spend",
      economyPriority: "low",
    });
    expect(posture.recommendation).toBe("stable");
  });

  it("raises contest reserve when a visible remote score threat exists", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-remote-2", "remote_2"),
        gainCreditAction("gain-credit"),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      phase: "late_contest",
      remoteScoreThreat: "urgent",
      contestReserve: 8,
      desiredCreditReserve: 8,
      belowReserveNow: true,
      canContestIfFunded: true,
    });
    expect(posture.creditBasePlan).toMatchObject({
      recommendation: "build_credit_base",
      economyPriority: "high",
      fundingNeed: true,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "remote_score_threat:urgent",
        "contest_reserve:8",
        "desired_credit_reserve:8",
      ]),
    );
  });

  it("keeps creditbase conservative when hand development only finds unknown or low-value cards", () => {
    const input = aiInput({
      credits: 4,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "unknown",
          availability: "missing_credits",
          currentNeed: "none",
          strategicFit: "weak",
          priority: 800,
          fundingNeed: {
            installOrPlayCost: 6,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      fundingNeed: false,
      usefulHandCardsBlockedByCredits: 0,
      recommendation: "preserve_reserve",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toBeUndefined();
  });

  it("funds unknown remote score-threat pressure when below contest reserve", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "access_payoff",
          availability: "missing_credits",
          currentNeed: "useful_now",
          priority: 650,
          fundingNeed: {
            installOrPlayCost: 4,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
    });
  });
});

function aiInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  eventTail?: PublicGameEvent[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
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
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers,
    publicEvents: params.eventTail ?? [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.eventTail ?? [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-target-test",
    decisionId: "runner-run-target-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  overrides: Partial<PlayerView["servers"][number]> = {},
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root: [],
    ...overrides,
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

function gainCreditAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "gain_credit",
    label: "Gain credit",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function visibleIdentity(side: Side): VisibleCard {
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

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}

function handDevelopmentEvaluation(
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: "runner-hand-card",
    availability: "missing_credits",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 600,
    deferReason: "missing_credits",
    evidence: ["source:own_runner_hand"],
    ...overrides,
  };
}

function evidenceNumber(evidence: string[], key: string): number {
  const prefix = `${key}:`;
  const raw = evidence.find((entry) => entry.startsWith(prefix))?.slice(
    prefix.length,
  );
  const value = raw !== undefined ? Number(raw) : Number.NaN;
  if (!Number.isFinite(value)) {
    throw new Error(`Missing numeric evidence for ${key}`);
  }
  return value;
}

function beliefWithRndTop(params: {
  freshness: RunnerOpponentModel["rndTopFreshness"]["freshness"];
  knownTopDefinitionId?: string;
  knownTopIsAgenda?: boolean;
}): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-access-rd",
    knownToRunner: true,
    freshness: params.freshness,
    ...(params.knownTopDefinitionId
      ? { knownTopDefinitionId: params.knownTopDefinitionId }
      : {}),
    ...(params.knownTopIsAgenda !== undefined
      ? { knownTopIsAgenda: params.knownTopIsAgenda }
      : {}),
    invalidationReasons: [],
  };
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
        handCount: 5,
        knownDefinitions: [],
        knownCount: 0,
        allCardsKnown: false,
        sourceEventIds: [],
        invalidationReasons: [],
        ledger: {
          safeDefinitions: [],
          unknownRestCount: 5,
          candidateGroups: [],
          sourceEventIds: [],
          invalidationReasons: [],
        },
      },
      hiddenRemoteCandidateMemory: [],
    },
    rndTopFreshness,
    knownPositionMemory: [],
  };
}

function beliefWithKnownHq(
  knownDefinitions: string[],
  options: {
    handCount?: number;
    unknownRestCount?: number;
  } = {},
): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-invalidated-rd",
    knownToRunner: false,
    freshness: "invalidated",
    invalidationReasons: [],
  };
  const safeDefinitions = knownDefinitions.map((definitionId) => ({
    definitionId,
    count: 1,
    sourceEventIds: ["test-hq-look"],
  }));
  const handCount = options.handCount ?? knownDefinitions.length;
  const unknownRestCount = options.unknownRestCount ??
    Math.max(0, handCount - knownDefinitions.length);
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
        handCount,
        knownDefinitions,
        knownCount: knownDefinitions.length,
        allCardsKnown:
          handCount > 0 &&
          knownDefinitions.length === handCount &&
          unknownRestCount === 0,
        sourceEventIds: ["test-hq-look"],
        invalidationReasons: [],
        ledger: {
          safeDefinitions,
          unknownRestCount,
          candidateGroups: [],
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

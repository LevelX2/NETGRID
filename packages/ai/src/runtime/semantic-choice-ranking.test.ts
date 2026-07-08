import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  tacticalPlanMappedChoice,
} from "./semantic-choice-ranking";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { PlanStepMappingResult } from "../tactical-plans";

describe("tacticalPlanMappedChoice", () => {
  it("keeps runner plan mapping over a clear off-plan semantic run gap", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7645), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7645),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.scoreGap).toBe(620);
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:semantic_choice_blocked",
        "tactical_plan_mapping_override_blocked:true",
        "tactical_plan_override_blocked_reason:runner_plan_controller",
      ]),
    );
  });

  it("ranks only plan-compatible mapped actions inside the selected plan", () => {
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const economyEvent = legalAction("economy-event", "play_event");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(economyEvent, 1440), choice(basicCredit, 90)],
      creditBaseMapping([basicCredit, economyEvent]),
      choice(economyEvent, 1440),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("economy-event");
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:plan_mapping_selected",
      ]),
    );
  });

  it("keeps best-hand-card plan mapping over off-plan basic credit", () => {
    const install = legalAction("install-economy", "install_card");
    const gain = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(gain, 2500), choice(install, 80)],
      bestHandCardMapping([install]),
      choice(gain, 2500),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-economy");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("keeps coverage-plan mapping for close semantic run gaps", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7600), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7600),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:semantic_choice_blocked",
      ]),
    );
  });

  it("keeps direct coverage answers even with a clear semantic run gap", () => {
    const prepare = legalAction("prepare-shell-traders", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 8200), choice(prepare, 6200)],
      coverageMapping([prepare]),
      choice(run, 8200),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-shell-traders");
    expect(result.overrideChoice).toBeUndefined();
  });

  it("lets explicit runner economy commitments interrupt generic central pressure", () => {
    const broker = legalAction("broker-load", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const brokerChoice = choice(broker, 2400, [
      ...scoreComponentEvidence("runner_bank_investment_commitment"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [brokerChoice, choice(run, 950)],
      centralRunMapping([run]),
      brokerChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("broker-load");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBeUndefined();
  });

  it("lets no-run economy setup hold interrupt generic central pressure", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const gainChoice = choice(gain, 1300, [
      ...scoreComponentEvidence("runner_no_run_economy_setup_hold"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [gainChoice, choice(run, -1000)],
      centralRunMapping([run]),
      gainChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBeUndefined();
  });

  it("does not let economy commitments bypass coverage-plan dominance", () => {
    const prepare = legalAction("prepare-shell-traders", "trigger_ability");
    const broker = legalAction("broker-load", "trigger_ability");
    const brokerChoice = choice(broker, 8200, [
      ...scoreComponentEvidence("runner_bank_investment_commitment"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [brokerChoice, choice(prepare, 0)],
      coverageMapping([prepare]),
      brokerChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-shell-traders");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("broker-load");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets known-agenda runs override mapped coverage setup events", () => {
    const bodyweight = legalAction("bodyweight", "play_event");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const urgentRun = choice(run, 2703, [
      ...scoreComponentEvidence("runner_goal_fit_reachable_run"),
      ...scoreComponentEvidence("runner_hq_known_agenda"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [urgentRun, choice(bodyweight, 1328)],
      coverageMapping([bodyweight]),
      urgentRun,
    );

    expect(result.overrideChoice?.action.actionId).toBe("run-hq");
    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-hq");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("bodyweight");
  });

  it("lets fresh R&D agenda-pressure runs override mapped coverage setup events", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const urgentRun = choice(run, 2603, [
      ...scoreComponentEvidence("runner_goal_fit_reachable_run"),
      ...scoreComponentEvidence("runner_rnd_fresh_memory"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [urgentRun, choice(draw, 1328)],
      coverageMapping([draw]),
      urgentRun,
    );

    expect(result.overrideChoice?.action.actionId).toBe("run-rd");
    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("draw");
  });

  it("keeps runner coverage plan mapping even when its mapped score is nonpositive", () => {
    const prepare = legalAction("prepare-stale", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7800), choice(prepare, 0)],
      coverageMapping([prepare]),
      choice(run, 7800),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-stale");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.scoreGap).toBe(7800);
  });

  it("does not let strategic action fit bypass runner plan dominance", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 7425, strategicEvidence("exact")),
        choice(gain, 7025),
      ],
      coverageMapping([gain]),
      choice(run, 7425, strategicEvidence("exact")),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
  });

  it("protects a strategic mapped action from a nonstrategic medium score gap", () => {
    const mappedRun = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 7785),
        choice(mappedRun, 7025, strategicEvidence("exact")),
      ],
      remoteContestMapping([mappedRun]),
      choice(run, 7785),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_override_blocked:true",
        "tactical_plan_override_blocked_reason:runner_plan_controller",
        "tactical_plan_mapping_score_gap_threshold:Infinity",
      ]),
    );
  });

  it("lets semantic ranking override a mapped Corp action that conflicts with board triage", () => {
    const mappedInstall = legalAction("install-remote-ice", "install_card", {
      serverId: "remote_1",
      placement: "ice",
    });
    const economy = legalAction("burst-economy", "play_operation");
    const mappedChoice = choice(mappedInstall, 1169, [
      ...strategicEvidence("exact"),
      ...scoreComponentEvidence("corp_board_triage_mismatch"),
    ]);
    const economyChoice = choice(economy, 1839, [
      ...scoreComponentEvidence("corp_board_triage_context"),
    ]);

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [economyChoice, mappedChoice],
      remoteContestMapping([mappedInstall]),
      economyChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("burst-economy");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-remote-ice",
    );
    expect(result.overrideReason).toBe("corp_board_triage_mismatch_yield");
    expect(result.scoreGap).toBe(670);
    expect(result.overrideThreshold).toBe(900);
  });

  it("uses a wider override gap for kind-level strategic fit", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 7485, strategicEvidence("kind")),
        choice(gain, 7025),
      ],
      coverageMapping([gain]),
      choice(run, 7485, strategicEvidence("kind")),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideThreshold).toBe(480);
  });

  it("uses structured history server ids and ignores label-only repeat-run history", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const labelOnly = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverLabel: "R&D" })]),
      [choice(gain, 7125), choice(run, 7025)],
      remoteContestMapping([run]),
      choice(gain, 7125),
    );
    const structured = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(gain, 7125), choice(run, 7025)],
      remoteContestMapping([run]),
      choice(gain, 7125),
    );

    expect(labelOnly.outcome).toBe("semantic_choice_blocked");
    expect(labelOnly.choice?.action.actionId).toBe("run-rd");
    expect(structured.outcome).toBe("semantic_choice_selected");
    expect(structured.choice?.action.actionId).toBe("gain");
    expect(structured.overrideReason).toBe("repeated_run_mapping_yield");
  });

  it("keeps score-threat remote contest funding over off-plan Archives runs", () => {
    const gain = legalAction("gain", "gain_credit");
    const archives = legalAction("run-archives", "start_run", {
      serverId: "archives",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(archives, 1359), choice(gain, 79)],
      remoteContestMapping([gain], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      choice(archives, 1359),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-archives");
    expect(result.overrideBlockedReason).toBe("remote_contest_plan_mapping");
    expect(result.overrideThreshold).toBe(3000);
  });

  it("keeps score-threat remote contest over off-plan coverage search", () => {
    const runRemote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const shortCircuit = legalAction("short-circuit", "trigger_ability");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(shortCircuit, 1427), choice(runRemote, -497)],
      remoteContestMapping([runRemote], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      choice(shortCircuit, 1427),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("short-circuit");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });
});

function choice(
  action: LegalAction,
  score: number,
  evidence: string[] = [],
): SemanticRuntimeChoice {
  return {
    action,
    scopeId:
      action.type === "start_run"
        ? "simple_hq_or_rnd_pressure"
        : "basic_economy_draw",
    score,
    reasonCode: `runner.semantic.${action.type}`,
    explanation: action.label,
    evidence,
  };
}

function strategicEvidence(targetMatch: "exact" | "kind"): string[] {
  return [
    "semantic_strategic_action_fit:true",
    `strategic_action_fit_target_match:${targetMatch}`,
  ];
}

function scoreComponentEvidence(key: string): string[] {
  return [`semantic_score_component:${key}`];
}

function coverageMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.obtain_breaker_coverage", legalActions);
}

function creditBaseMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.build_credit_base", legalActions);
}

function centralRunMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.opportunistic_central_run", legalActions);
}

function bestHandCardMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.play_best_hand_card", legalActions, {
    stepKind: "install_development_card",
  });
}

function remoteContestMapping(
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
  } = {},
): PlanStepMappingResult {
  return planMapping("runner.contest_remote", legalActions, overrides);
}

function planMapping(
  type: string,
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
    stepKind?: PlanStepMappingResult["step"]["kind"];
  } = {},
): PlanStepMappingResult {
  const stepKind = overrides.stepKind ?? "gain_credits";
  return {
    status: "matched",
    plan: {
      planId: `${type}:remote_1`,
      side: "runner",
      type,
      status: "active",
      priority: overrides.priority ?? 100,
      horizonTurns: 1,
      target: { kind: "server", id: "remote_1" },
      requiredCapabilities: [],
      currentStep: {
        stepId: "gain_for_breaker",
        kind: stepKind,
        desiredActionSemantics: ["economy.gain_credit"],
        requiredCapabilities: [],
        rationale: [],
      },
      evidence: overrides.evidence ?? [],
      scoreBreakdown: [],
      stateVersion: 1,
    },
    step: {
      stepId: "gain_for_breaker",
      kind: stepKind,
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [],
      rationale: [],
    },
    legalActions,
    actionCandidateIds: legalActions.map((action) => action.actionId),
    rationale: [],
  } as unknown as PlanStepMappingResult;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function aiInput(
  eventTail: AiDecisionInput["eventTail"] = [],
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
        stateVersion: 20,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: {
          instanceId: "runner",
          definitionId: "runner",
          title: "Runner",
          owner: "runner",
          controller: "runner",
          type: "identity",
          known: true,
        },
        credits: 3,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "corp",
          definitionId: "corp",
          title: "Corp",
          owner: "corp",
          controller: "corp",
          type: "identity",
          known: true,
        },
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail,
    legalActions: [],
    difficulty: "normal",
    seed: "semantic-choice-ranking-test",
    decisionId: "semantic-choice-ranking-test",
    actionNumber: 1,
    profileId: "semantic-choice-ranking-test",
  };
}

function runEvent(
  payload: Record<string, unknown>,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: `event-${JSON.stringify(payload)}`,
    type: "start_run",
    stateVersionBefore: 18,
    stateVersionAfter: 19,
    stateHashAfter: "test-hash",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      ...payload,
    },
  } as AiDecisionInput["eventTail"][number];
}

import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import {
  corpPunishCandidates,
  corpScoreWindowBlockers,
  corpScoreWindowCurrentStep,
} from "./tactical-plan-corp-helpers";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("corpPunishCandidates", () => {
  it("matches structured punish signals without substring noise", () => {
    const structuredTag = candidate("structured-tag", {
      actionTacticSignals: ["tag.source"],
    });
    const structuredPunish = candidate("structured-punish", {
      actionTacticSignals: ["punish.payoff"],
    });
    const compoundPunish = candidate("compound-punish", {
      actionTacticSignals: ["visible_punish_payoff"],
    });
    const compoundFlatline = candidate("compound-flatline", {
      actionTacticSignals: ["score_flatline_window"],
    });
    const noise = candidate("noise", {
      actionTacticSignals: [
        "tagalong.source",
        "punishment_noise",
        "pre_punishment_support",
        "flatliner",
      ],
    });
    const strategyOnly = candidate("strategy-only", {
      strategySupport: [
        {
          strategyId: "corp.tag_trace_punish",
          role: "support",
          confidence: "high",
          evidence: "deck supports punish",
        },
      ],
      evidence: ["strategic_action_fit:corp.tag_trace_punish"],
    } as Partial<ActionSemanticCandidate>);
    const installOnly = candidate("install-only", {
      actionType: "install_card",
      actionTacticSignals: ["damage.payoff"],
    });

    expect(
      corpPunishCandidates(
        {
          candidates: [
            structuredTag,
            structuredPunish,
            compoundPunish,
            compoundFlatline,
            noise,
            strategyOnly,
            installOnly,
          ],
        } as unknown as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ).map((entry) => entry.actionId),
    ).toEqual([
      "structured-tag",
      "structured-punish",
      "compound-punish",
      "compound-flatline",
    ]);
  });

  it("does not create a punish plan from a last-click trace without payoff", () => {
    const traceOnly = candidate("trace-only", {
      actionTacticSignals: ["trace.source", "tag.source"],
    });
    const traceDamage = candidate("trace-damage", {
      actionTacticSignals: ["trace.source", "tag.source", "damage.payoff"],
    });
    const agenda = corpCard("remote-agenda", { type: "agenda" });
    const input = corpScoreInput({
      credits: 6,
      clicks: 1,
      agenda,
      legalActions: [],
    });

    expect(
      corpPunishCandidates(
        {
          input,
          candidates: [traceOnly, traceDamage],
        } as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ).map((entry) => entry.actionId),
    ).toEqual(["trace-damage"]);
  });

  it("does not protect Closed Accounts when the tagged Runner has no credits", () => {
    const closedAccounts = candidate("closed-accounts", {
      sourceDefinitionId: "onr_v1_285_closed-accounts",
      actionTacticSignals: ["punish.payoff"],
    });
    const input = corpScoreInput({
      credits: 6,
      clicks: 2,
      agenda: corpCard("remote-agenda", { type: "agenda" }),
      legalActions: [],
    });
    input.playerView.opponent.credits = 0;
    input.playerView.opponent.tags = 1;

    expect(
      corpPunishCandidates(
        {
          input,
          candidates: [closedAccounts],
        } as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ),
    ).toEqual([]);

    input.playerView.opponent.credits = 3;
    expect(
      corpPunishCandidates(
        {
          input,
          candidates: [closedAccounts],
        } as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ).map((entry) => entry.actionId),
    ).toEqual(["closed-accounts"]);
  });
});

describe("corpScoreWindowBlockers", () => {
  it("binds an unblocked advance step to the concrete advance action", () => {
    const advance = corpAction("advance-specific-agenda", "remote-agenda");

    expect(corpScoreWindowCurrentStep(advance, [])).toMatchObject({
      kind: "advance_score_card",
      actionCandidateIds: [advance.actionId],
    });
  });

  it("blocks non-closing scoreline advances when the scoreline window needs funding", () => {
    const agenda = corpCard("remote-agenda", {
      advancementRequirement: 5,
      advancementCounters: 1,
    });
    const advance = corpAction("advance-remote-agenda", agenda.instanceId);
    const input = corpScoreInput({
      credits: 5,
      clicks: 3,
      agenda,
      legalActions: [advance],
    });

    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      advance,
      scorelineAssessment({
        actionId: advance.actionId,
        blockedByCredits: true,
      }),
    );

    expect(blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "missing_rez_reserve",
          severity: "soft",
          removalStepKind: "build_rez_reserve",
          evidence: expect.arrayContaining([
            "corp_scoreline_recommended_next_step:fund_scoreline",
            "scoreline_funding_path_blocks_advance:true",
          ]),
        }),
      ]),
    );
    expect(corpScoreWindowCurrentStep(advance, blockers)).toMatchObject({
      kind: "build_rez_reserve",
    });
  });

  it("does not block scoreline advances that keep a same-turn closeout reachable", () => {
    const agenda = corpCard("remote-agenda", {
      advancementRequirement: 3,
      advancementCounters: 1,
    });
    const advance = corpAction("advance-remote-agenda", agenda.instanceId);
    const input = corpScoreInput({
      credits: 3,
      clicks: 3,
      agenda,
      legalActions: [advance],
    });

    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      advance,
      scorelineAssessment({
        actionId: advance.actionId,
        blockedByCredits: true,
      }),
    );

    expect(blockers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "missing_rez_reserve" }),
      ]),
    );
  });

  it("does not let rezzed-only contestability override funded pre-score protection", () => {
    const agenda = corpCard("remote-agenda", {
      advancementRequirement: 4,
      advancementCounters: 0,
    });
    const advance = corpAction("advance-remote-agenda", agenda.instanceId);
    const input = corpScoreInput({
      credits: 37,
      clicks: 3,
      agenda,
      legalActions: [advance],
    });
    input.playerView.opponent.credits = 12;
    input.playerView.servers[0]!.ice[0]!.effectiveRunQuote = {
      iceInstanceId: "remote-ice",
      iceDefinitionId: "remote-ice",
      effectiveStrength: 0,
      subroutines: [],
    };
    const sourceAssessment = scorelineAssessment({
      actionId: advance.actionId,
      blockedByCredits: false,
      recommendedNextStep: "advance_agenda",
      blockers: [],
      scoringWindow: {
        runnerCanContestBeforeScore: false,
        runnerCanReachAccessBeforeScore: false,
        agendaStealRelevantBeforeScore: false,
        agendaStealSeverity: "normal",
        corpCanRezRelevantIce: true,
        corpCanRezFullPathWithDynamicReserve: true,
      },
    });

    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      advance,
      sourceAssessment,
    );

    expect(blockers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "score_window_contestable" }),
      ]),
    );
    expect(corpScoreWindowCurrentStep(advance, blockers, input)).toMatchObject({
      kind: "advance_score_card",
      actionCandidateIds: [advance.actionId],
    });
  });

  it("binds source scoreline safety blockers to remote protection before agenda exposure", () => {
    const agenda = corpCard("political-overthrow", {
      advancementRequirement: 9,
      advancementCounters: 0,
      agendaPoints: 6,
    });
    const install = {
      ...corpAction("install-political-overthrow", agenda.instanceId),
      type: "install_card" as const,
      payload: { placement: "root", serverId: "remote_1" },
    } as LegalAction;
    const draw = {
      ...corpAction("draw-protection", "game_rule"),
      type: "draw_card" as const,
      source: "game_rule",
      payload: {},
    } as LegalAction;
    const input = corpScoreInput({
      credits: 5,
      clicks: 3,
      agenda,
      legalActions: [install, draw],
    });
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.opponent.agendaPoints = 4;

    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      install,
      scorelineAssessment({
        actionId: install.actionId,
        blockedByCredits: false,
        recommendedNextStep: "protect_remote",
        blockers: ["unsafe_remote", "runner_contest"],
        evidence: ["agenda_steal_severity:game_ending", "score_horizon:slow"],
      }),
    );
    const step = corpScoreWindowCurrentStep(install, blockers, input);

    expect(blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "score_window_contestable",
          severity: "hard",
          evidence: expect.arrayContaining([
            "scoreline_source_safety_gate:true",
            "scoreline_source_blocker:unsafe_remote",
            "scoreline_source_blocker:runner_contest",
            "agenda_steal_severity:game_ending",
            "score_horizon:slow",
          ]),
        }),
      ]),
    );
    expect(step.kind).toBe("find_remote_protection");
    expect(step.actionCandidateIds).toEqual(["draw-protection"]);
    expect(step.actionCandidateIds).not.toContain(install.actionId);
  });

  it("does not treat printed ICE cost as an affordable protection quote", () => {
    const agenda = corpCard("political-overthrow", {
      advancementRequirement: 9,
      agendaPoints: 6,
    });
    const installAgenda = {
      ...corpAction("install-political-overthrow", agenda.instanceId),
      type: "install_card" as const,
      payload: { placement: "root", serverId: "remote_1" },
    } as LegalAction;
    const huntingPack = corpCard("hunting-pack", {
      definitionId: "onr_proteus_026_hunting-pack",
      title: "Hunting Pack",
      type: "ice",
      rezCost: 1,
      strength: 4,
      subtypes: ["bloodhound", "sentry"],
      rulesText:
        "For each rezzed piece of ice installed outside Hunting Pack, add a Trace 5 tag subroutine.",
    });
    const installHuntingPack = {
      ...corpAction("install-hunting-pack", huntingPack.instanceId),
      type: "install_card" as const,
      costs: [{ clicks: 1 }, { credits: 1 }],
      payload: { placement: "ice", serverId: "remote_1" },
    } as LegalAction;
    const draw = {
      ...corpAction("draw-protection", "game_rule"),
      type: "draw_card" as const,
      source: "game_rule",
      costs: [{ clicks: 1 }],
      payload: {},
    } as LegalAction;
    const input = corpScoreInput({
      credits: 8,
      clicks: 1,
      agenda,
      legalActions: [installAgenda, installHuntingPack, draw],
    });
    input.playerView.own.gripOrHq = [agenda, huntingPack];

    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      installAgenda,
      scorelineAssessment({
        actionId: installAgenda.actionId,
        blockedByCredits: false,
        recommendedNextStep: "protect_remote",
        blockers: ["unsafe_remote", "runner_contest"],
      }),
    );
    const step = corpScoreWindowCurrentStep(installAgenda, blockers, input);

    expect(step).toMatchObject({
      kind: "find_remote_protection",
      actionCandidateIds: [draw.actionId],
      rationale: [
        "find protection that the visible Runner rig cannot nullify",
      ],
    });
  });

  it("keeps a real protection-acquisition route distinct from funding-only draw", () => {
    const agenda = corpCard("political-overthrow", {
      advancementRequirement: 9,
      agendaPoints: 6,
    });
    const installAgenda = {
      ...corpAction("install-political-overthrow", agenda.instanceId),
      type: "install_card" as const,
      payload: { placement: "root", serverId: "remote_1" },
    } as LegalAction;
    const draw = {
      ...corpAction("draw-protection", "game_rule"),
      type: "draw_card" as const,
      source: "game_rule",
      costs: [{ clicks: 1 }],
      payload: {},
    } as LegalAction;
    const input = corpScoreInput({
      credits: 8,
      clicks: 1,
      agenda,
      legalActions: [installAgenda, draw],
    });
    const blockers = corpScoreWindowBlockers(
      input,
      "remote_1",
      installAgenda,
      scorelineAssessment({
        actionId: installAgenda.actionId,
        blockedByCredits: false,
        recommendedNextStep: "protect_remote",
        blockers: ["unsafe_remote", "runner_contest"],
      }),
    );

    expect(
      corpScoreWindowCurrentStep(installAgenda, blockers, input),
    ).toMatchObject({
      kind: "find_remote_protection",
      actionCandidateIds: [draw.actionId],
      desiredActionSemantics: ["draw.card", "search.deck"],
    });
  });
});

function candidate(
  actionId: string,
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "trigger_ability",
    actorSide: "corp",
    visibilityScope: "public",
    legalActionRef: {
      actionId,
      actionType: "trigger_ability",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "unbound",
    semanticActionType: "card_ability.unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
    timingProfile: { timingPoint: "corp_action.main", window: "main_action" },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "partial",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}

function corpScoreInput(params: {
  credits: number;
  clicks: number;
  agenda: VisibleCard;
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    actorSide: "corp",
    legalActions: params.legalActions,
    playerView: {
      side: "corp",
      legalActions: params.legalActions,
      own: {
        identity: corpCard("corp-identity", { type: "identity" }),
        credits: params.credits,
        clicks: params.clicks,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        rig: [],
        scoreArea: [],
      },
      opponent: {
        credits: 4,
        clicks: 4,
        agendaPoints: 0,
        rig: [],
        scoreArea: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [
            corpCard("remote-ice", {
              type: "ice",
              rezzed: true,
              rulesText: "End the run.",
            }),
          ],
          root: [params.agenda],
        },
      ],
      publicEvents: [],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function corpAction(actionId: string, source: string): LegalAction {
  return {
    actionId,
    side: "corp",
    type: "advance_card",
    label: actionId,
    source,
    costs: [{ credits: 1 }],
    payload: { serverId: "remote_1" },
  } as unknown as LegalAction;
}

function corpCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    owner: "corp",
    side: "corp",
    type: "agenda",
    counterDisplays: [],
    ...overrides,
  } as VisibleCard;
}

function scorelineAssessment(params: {
  actionId: string;
  blockedByCredits: boolean;
  recommendedNextStep?: string;
  blockers?: string[];
  evidence?: string[];
  scoringWindow?: NonNullable<
    TacticalPlanBuildContext["corpScorelineWindowAssessment"]
  >["paths"][number]["scoringWindow"];
}): TacticalPlanBuildContext["corpScorelineWindowAssessment"] {
  const recommendedNextStep = params.recommendedNextStep ?? "fund_scoreline";
  const blockers = params.blockers ?? ["credits"];
  const evidence = params.evidence ?? ["test_scoreline_funding_path"];
  return {
    recommendedNextStep,
    blockedByCredits: params.blockedByCredits,
    bestPath: {
      actionId: params.actionId,
      serverId: "remote_1",
      recommendedNextStep,
      blockers,
      ...(params.scoringWindow ? { scoringWindow: params.scoringWindow } : {}),
      evidence,
    },
    paths: [
      {
        actionId: params.actionId,
        serverId: "remote_1",
        recommendedNextStep,
        blockers,
        ...(params.scoringWindow
          ? { scoringWindow: params.scoringWindow }
          : {}),
        evidence,
      },
    ],
    evidence: ["test_scoreline_window"],
  };
}

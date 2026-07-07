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
});

describe("corpScoreWindowBlockers", () => {
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
}): TacticalPlanBuildContext["corpScorelineWindowAssessment"] {
  return {
    recommendedNextStep: "fund_scoreline",
    blockedByCredits: params.blockedByCredits,
    bestPath: {
      actionId: params.actionId,
      serverId: "remote_1",
      recommendedNextStep: "fund_scoreline",
      blockers: ["credits"],
      evidence: ["test_scoreline_funding_path"],
    },
    paths: [
      {
        actionId: params.actionId,
        serverId: "remote_1",
        recommendedNextStep: "fund_scoreline",
        blockers: ["credits"],
        evidence: ["test_scoreline_funding_path"],
      },
    ],
    evidence: ["test_scoreline_window"],
  };
}

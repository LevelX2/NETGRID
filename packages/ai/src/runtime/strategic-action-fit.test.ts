import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView, Side } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { semanticRuntimeStrategicActionFitEvidence } from "./strategic-action-fit";
import { buildStrategicIntentState } from "../strategic-intent-state";
import type { AiDeckStrategyProfile, DeckStrategyScore } from "../deck-doctrine-strategy";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";

describe("semanticRuntimeStrategicActionFitEvidence", () => {
  it("requires exact central target fit when StrategicIntent names a server", () => {
    const rdRun = action("run-rd", "runner", "start_run", { serverId: "rd" });
    const hqRun = action("run-hq", "runner", "start_run", { serverId: "hq" });
    const input = aiInput("runner", [rdRun, hqRun], 6, {
      targetId: "rd",
      availableCredits: 6,
    });

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        rdRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_target_match:exact",
      ]),
    );
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        hqRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual([]);
  });

  it("does not add pressure fit while the strategy is in fund phase", () => {
    const rdRun = action("run-rd", "runner", "start_run", { serverId: "rd" });
    const input = aiInput("runner", [rdRun], 1, {
      targetId: "rd",
      availableCredits: 1,
    });

    expect(input.ownStrategicIntentState?.phase).toBe("fund");
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        rdRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual([]);
  });

  it("uses visible source economy evidence and ignores label-only economy text", () => {
    const labelOnly = action("label-only-economy", "corp", "install_card");
    labelOnly.label = "Install economy bank asset";
    labelOnly.source = "missing-source";
    const sourced = action("sourced-economy", "corp", "install_card");
    sourced.label = "Install asset";
    sourced.source = "economy-asset";
    const noisySource = action("noisy-economy", "corp", "install_card");
    noisySource.label = "Install upgrade";
    noisySource.source = "creditor-bankish";
    const input = corpStrategicInput([labelOnly, sourced, noisySource], [
      {
        instanceId: "economy-asset",
        definitionId: "custom-economy-asset",
        title: "Neutral Asset",
        rulesText: "Gain credits when used.",
        type: "asset",
        known: true,
        owner: "corp",
        controller: "corp",
      },
      {
        instanceId: "creditor-bankish",
        definitionId: "custom-creditor-bankish",
        title: "Creditor Bankish",
        rulesText: "Gainish creditsish when used.",
        type: "upgrade",
        known: true,
        owner: "corp",
        controller: "corp",
      },
    ]);

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        labelOnly,
        "corp.semantic.install_asset",
      ),
    ).toEqual([]);
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        sourced,
        "corp.semantic.install_asset",
      ),
    ).toEqual(
      expect.arrayContaining([
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_family:corp_asset_economy",
      ]),
    );
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        noisySource,
        "corp.semantic.install_asset",
      ),
    ).toEqual([]);
  });

  it("does not treat scored shuffle-draw as strategic credit economy", () => {
    const basicCredit = action("basic-credit", "corp", "gain_credit");
    const shuffleDraw = action("shuffle-draw", "corp", "gain_credit", {
      agendaAbility: "hq_archives_shuffle_draw",
    });
    const input = corpStrategicInput([basicCredit, shuffleDraw], []);

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        basicCredit,
        "corp.semantic.economy",
      ),
    ).toEqual(
      expect.arrayContaining([
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_family:corp_asset_economy",
        "strategic_action_fit_target_match:kind",
      ]),
    );
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        shuffleDraw,
        "corp.semantic.economy",
      ),
    ).toEqual([]);
  });

  it("matches runner setup scopes by token instead of substring", () => {
    const actionWithNoIntrinsicSetupFit = action(
      "remove-tag",
      "runner",
      "remove_tag",
    );
    const input = strategicInput(
      "runner",
      [actionWithNoIntrinsicSetupFit],
      "runner_setup",
      "runner.rig_first",
      "none",
      4,
    );

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        actionWithNoIntrinsicSetupFit,
        "runner.semantic.setup",
      ),
    ).toEqual(expect.arrayContaining(["semantic_strategic_action_fit:true"]));
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        actionWithNoIntrinsicSetupFit,
        "runner.semantic.prepsetupflow",
      ),
    ).toEqual([]);
  });

  it("matches corp tag-source punish scopes by token instead of substring", () => {
    const tagSource = action("tag-source", "corp", "trigger_ability");
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [tagSource],
      observerSide: "corp",
      stateVersion: 1,
    });
    if (!candidate) throw new Error("expected tag-source candidate");
    const taggedCandidate = {
      ...candidate,
      actionTacticSignals: ["tag.source"],
    };
    const input = strategicInput(
      "corp",
      [tagSource],
      "corp_tag_trace_punish",
      "corp.tag_trace_punish",
      "none",
      7,
    );

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        tagSource,
        "corp.semantic.tag",
        taggedCandidate,
      ),
    ).toEqual(expect.arrayContaining(["semantic_strategic_action_fit:true"]));
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        tagSource,
        "corp.semantic.tagalong_noise",
        taggedCandidate,
      ),
    ).toEqual([]);
  });
});

function aiInput(
  side: Side,
  legalActions: LegalAction[],
  credits: number,
  params: {
    targetId: string;
    availableCredits: number;
  },
): AiDecisionInputWithDeckCapabilities {
  const input: AiDecisionInput = {
    side,
    playerView: playerView(side, credits),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "strategic-action-fit-test",
    decisionId: "strategic-action-fit-test",
    actionNumber: 1,
    profileId: "strategic-action-fit-test",
  };
  return {
    ...input,
    ownStrategicIntentState: buildStrategicIntentState({
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      strategyProfile: strategyProfile(),
      availableCredits: params.availableCredits,
      targetVector: {
        kind: "central",
        targetId: params.targetId,
        evidence: ["test:target"],
      },
    }),
  };
}

function strategyProfile(): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: "strategic-action-fit-test",
    side: "runner",
    cardCount: 6,
    strategyScores: {
      "runner.rnd_pressure": score("runner.rnd_pressure"),
    },
    primaryStrategies: ["runner.rnd_pressure"],
    secondaryStrategies: [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function corpStrategicInput(
  legalActions: LegalAction[],
  gripOrHq: PlayerView["own"]["gripOrHq"],
): AiDecisionInputWithDeckCapabilities {
  const baseView = playerView("corp", 7);
  const input: AiDecisionInput = {
    side: "corp",
    playerView: {
      ...baseView,
      own: {
        ...baseView.own,
        gripOrHq,
      },
      opponent: {
        ...baseView.opponent,
        identity: visibleIdentity("runner"),
      },
      legalActions,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "strategic-action-fit-test",
    decisionId: "strategic-action-fit-test",
    actionNumber: 1,
    profileId: "strategic-action-fit-test",
  };
  return {
    ...input,
    ownStrategicIntentState: {
      side: "corp",
      stateVersion: 1,
      primaryStrategy: {
        strategyId: "corp.asset_economy",
        family: "corp_asset_economy",
      },
      phase: "convert",
      targetVector: {
        kind: "economy",
        evidence: ["test:economy"],
      },
      availableCredits: 7,
      blockers: [],
      evidence: [],
    } as unknown as NonNullable<
      AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
    >,
  } as AiDecisionInputWithDeckCapabilities;
}

function strategicInput(
  side: Side,
  legalActions: LegalAction[],
  family: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >["primaryStrategy"]["family"],
  strategyId: string,
  targetKind: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >["targetVector"]["kind"],
  credits: number,
): AiDecisionInputWithDeckCapabilities {
  const baseView = playerView(side, credits);
  const input: AiDecisionInput = {
    side,
    playerView: {
      ...baseView,
      opponent: {
        ...baseView.opponent,
        tags: 0,
      },
      legalActions,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "strategic-action-fit-test",
    decisionId: "strategic-action-fit-test",
    actionNumber: 1,
    profileId: "strategic-action-fit-test",
  };
  return {
    ...input,
    ownStrategicIntentState: {
      side,
      stateVersion: 1,
      primaryStrategy: {
        strategyId,
        family,
      },
      phase: "convert",
      targetVector: {
        kind: targetKind,
        evidence: [`test:${targetKind}`],
      },
      availableCredits: credits,
      blockers: [],
      evidence: [],
    } as unknown as NonNullable<
      AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
    >,
  } as AiDecisionInputWithDeckCapabilities;
}

function score(strategyId: string): DeckStrategyScore {
  return {
    anchorScore: 80,
    supportScore: 80,
    finalScore: 80,
    confidence: "high",
    runtimeStatus: "productive",
    runtimeBlockers: [],
    supportGaps: [],
    anchorEvidence: [
      {
        cardId: "fixture-anchor",
        quantity: 1,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "test",
      },
    ],
    supportEvidence: [],
  };
}

function action(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function playerView(side: Side, credits: number): PlayerView {
  return {
    side,
    stateVersion: 1,
    activeSide: side,
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity(side),
      credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
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
  } as PlayerView;
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
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

import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { RemoteDoctrineProfile } from "../remote-doctrine-profile";
import type { PlanPortfolioSnapshot } from "./plan-portfolio";
import { assessCorpRemoteProject } from "./corp-remote-project-assessment";
import { buildCorpRemoteProjectPlans } from "./tactical-plan-corp-remote-project";

describe("Corp scoring remote development project", () => {
  it("binds effective ICE installation to a strategy-required scoring remote", () => {
    const ice = card("remote-wall", "simple_barrier_ice", "ice", {
      rezCost: 2,
      rulesText: "End the run.",
      subtypes: ["Barrier"],
    });
    const installRemote = action("install-remote-wall", "install_card", ice, {
      placement: "ice",
      serverId: "remote_1",
    });
    const installHq = action("install-hq-wall", "install_card", ice, {
      placement: "ice",
      serverId: "hq",
    });
    const input = corpInput({ hq: [ice], actions: [installRemote, installHq] });

    const plans = buildCorpRemoteProjectPlans({
      input,
      remoteDoctrine: doctrine("primary", "glacier", ["scoreline"]),
    });

    expect(plans).toEqual([
      expect.objectContaining({
        type: "corp.establish_scoring_remote",
        target: { kind: "server", id: "remote_1" },
        status: "progressing",
        currentStep: expect.objectContaining({
          kind: "protect_remote",
          actionCandidateIds: ["install-remote-wall"],
        }),
      }),
    ]);
    expect(JSON.stringify(plans)).toContain(
      "remote_project_target_band:glacier",
    );
  });

  it("retains the bound remote across turns instead of chasing the thickest server", () => {
    const input = corpInput({
      remote1Ice: [],
      remote2Ice: [
        card("remote-2-a", "simple_barrier_ice", "ice"),
        card("remote-2-b", "simple_barrier_ice", "ice"),
      ],
      actions: [action("draw", "draw_card")],
    });
    const previousPlanPortfolio = previousPortfolio("remote_1");

    const [plan] = buildCorpRemoteProjectPlans({
      input,
      remoteDoctrine: doctrine("primary", "taxing", ["scoreline"]),
      previousPlanPortfolio,
    });

    expect(plan?.target?.id).toBe("remote_1");
    expect(plan?.currentStep.kind).toBe("find_remote_protection");
    expect(plan?.currentStep.actionCandidateIds).toEqual(["draw"]);
  });

  it("does not invent a long remote project for fast advance or pure asset economy", () => {
    const input = corpInput({ actions: [action("gain", "gain_credit")] });

    expect(
      buildCorpRemoteProjectPlans({
        input,
        remoteDoctrine: doctrine("opportunistic", "none", ["scoreline"], 0),
      }),
    ).toEqual([]);
    expect(
      buildCorpRemoteProjectPlans({
        input,
        remoteDoctrine: doctrine("supporting", "light", ["asset_economy"]),
      }),
    ).toEqual([]);
  });

  it("measures a glacier by visible path cost and Runner recovery, not ICE count alone", () => {
    const walls = ["a", "b", "c"].map((suffix) =>
      card(`wall-${suffix}`, "simple_barrier_ice", "ice", {
        rezzed: true,
        subtypes: ["Barrier"],
      }),
    );
    const input = corpInput({ remote1Ice: walls, actions: [] });
    input.playerView.opponent.credits = 0;
    input.playerView.opponent.rig = [
      card("runner-fracter", "simple_fracter", "program", {
        owner: "runner",
        controller: "runner",
        subtypes: ["Icebreaker", "Fracter"],
      }),
    ];
    const assessment = assessCorpRemoteProject({
      input,
      serverId: "remote_1",
      doctrine: doctrine("primary", "glacier", ["scoreline"]),
    });

    expect(assessment.installedIceCount).toBe(3);
    expect(assessment.estimatedRunnerRecoveryTurns).toBeGreaterThanOrEqual(3);
    expect(assessment.band).toBe("glacier");
    expect(assessment.targetMet).toBe(true);
  });
});

function doctrine(
  dependency: RemoteDoctrineProfile["dependency"],
  protectionTarget: RemoteDoctrineProfile["protectionTarget"],
  purposes: RemoteDoctrineProfile["purposes"],
  backgroundActionsPerTurn = 1,
): RemoteDoctrineProfile {
  return {
    schemaVersion: "remote-doctrine-profile-v1",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "plan_portfolio",
    },
    dependency,
    purposes,
    protectionTarget,
    buildTiming: "prebuild",
    investmentBudget: {
      maxTargetRemotes: 1,
      maxIceBeforePayload: 4,
      backgroundActionsPerTurn,
      targetRecoveryTurns: protectionTarget === "glacier" ? 3 : 2,
    },
    confidence: "high",
    evidence: [],
  };
}

function previousPortfolio(serverId: string): PlanPortfolioSnapshot {
  return {
    schemaVersion: "plan-portfolio-v1",
    side: "corp",
    profileId: "remote-project-test",
    stateVersion: 1,
    turnKey: "corp:turn:1",
    backgrounds: [
      {
        portfolioEntryId: `corp.establish_scoring_remote:server:${serverId}`,
        sourcePlanId: `corp.establish_scoring_remote:${serverId}`,
        planType: "corp.establish_scoring_remote",
        side: "corp",
        executionClass: "development_project",
        role: "background",
        lifecycle: "dormant",
        priority: 690,
        target: { kind: "server", id: serverId },
        supportsEntryIds: [],
        milestone: "protect_remote",
        progress: 0.25,
        selectedStepKind: "protect_remote",
        actionCandidateIds: [],
        cadence: {
          turnKey: "corp:turn:1",
          maxActionsPerTurn: 1,
          actionsUsedThisTurn: 0,
        },
        resourceReservation: { credits: 0, clicks: 0 },
        updatedAtStateVersion: 1,
        evidence: [],
      },
    ],
    rejectedEntryIds: [],
    evidence: [],
  };
}

function corpInput(params: {
  hq?: VisibleCard[];
  remote1Ice?: VisibleCard[];
  remote2Ice?: VisibleCard[];
  actions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", "corp_identity_001", "identity"),
        credits: 8,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: params.hq ?? [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "runner_identity_001", "identity", {
          owner: "runner",
          controller: "runner",
        }),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
        {
          id: "remote_1",
          label: "Remote 1",
          ice: params.remote1Ice ?? [],
          root: [],
        },
        {
          id: "remote_2",
          label: "Remote 2",
          ice: params.remote2Ice ?? [],
          root: [],
        },
      ],
      publicEvents: [],
      legalActions: params.actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: params.actions,
    difficulty: "normal",
    seed: "remote-project-test",
    decisionId: "remote-project-test",
    actionNumber: 1,
    profileId: "remote-project-test",
  } as AiDecisionInput;
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  } as VisibleCard;
}

function action(
  actionId: string,
  type: LegalAction["type"],
  source?: VisibleCard,
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    ...(source ? { source: source.instanceId } : {}),
    payload: { ...(source ? { cardId: source.instanceId } : {}), ...payload },
    costs: [{ clicks: 1, credits: 0 }],
    stateVersion: 1,
    expiresAtStateVersion: 1,
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    targetRequirements: [],
  } as unknown as LegalAction;
}

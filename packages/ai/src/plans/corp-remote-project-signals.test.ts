import { describe, expect, it, vi } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecisionInput,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { buildCorpScoringRemoteDiscovery } from "../corp/scoring-remote/scoring-remote-discovery";
import type { RemoteDoctrineProfile } from "../remote-doctrine-profile";
import { buildCorpScoringRemoteProjectSignals } from "../corp/scoring-remote/scoring-remote-signals";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";

describe("resident Corp scoring remote project", () => {
  it.each([
    ["classic_blind", "blocked", "payload_ready"],
    ["modern_open", "reachable", "harden_to_protection_target"],
  ] as const)(
    "quotes the real Remote Rex path in %s",
    (traceRulesProfile, accessStatus, phase) => {
      const agenda = 419;
      const rex = 476;
      const deck = ORIGINALSET_DEFAULT_DECKS.corp;
      const corpDeck = {
        ...deck,
        cards: [
          ...deck.cards.filter(({ id }) => id !== agenda && id !== rex),
          { id: agenda, quantity: 1 },
          { id: rex, quantity: 1 },
        ],
      };
      const setup = createGameAfterSetup({
        seed: "remote-rex-trace-profile",
        traceRulesProfile,
        corpDeck,
        runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
      });
      const draw = getLegalActions(setup, "corp").find(
        (action) => action.type === "mandatory_draw",
      )!;
      const opening = applyAction(setup, {
        matchId: setup.matchId,
        side: "corp",
        actionId: draw.actionId,
        clientKnownStateVersion: setup.stateVersion,
      });
      if (!opening.ok) throw new Error(opening.error.message);
      const state = opening.state;
      state.turnSerial = 8;
      state.corp.servers.push({
        id: "r1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      });
      RealEngineFixtureBuilder.forState(state)
        .withCorpCardInHq(agenda)
        .withRezzedCorpIceOnServer("r1", rex)
        .withCorpCredits(1)
        .withRunnerCredits(5);
      const currentInput = {
        ...buildAiDecisionInput(state, "corp", {
          ownDeckSnapshot: {
            deckSnapshotId: corpDeck.id,
            side: "corp",
            cards: corpDeck.cards.map(({ id, quantity }) => ({
              cardId: id,
              quantity,
            })),
          },
        }),
        ownRemoteDoctrineProfile: doctrine({ protectionTarget: "glacier" }),
      };
      const { playerView } = currentInput;
      expect(playerView.traceRulesProfile).toBe(traceRulesProfile);
      const [signal] = buildCorpScoringRemoteDiscovery({
        input: currentInput,
        previous: undefined,
        scoreProjects: [],
        ambushes: [],
        availableRemoteRezCredits: 1,
      });
      expect(signal).toMatchObject({
        projectId: "strategic-score-remote",
        serverId: "r1",
        phase,
        maturity: {
          knowledge: "known",
          observedAtStateVersion: playerView.stateVersion,
          fundedPath: { accessStatus },
          stagedPath: { accessStatus },
        },
      });
    },
  );
  it("rebinds the executed TurnPlanner defense install and consumes its cadence once", () => {
    const { currentInput, previous } = executedRemoteInstall();
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: currentInput,
      previous,
      remoteDoctrine: doctrine(),
      scoreProjects: [],
      assessMaturityForServer: () => undefined,
    });
    expect(signal).toMatchObject({
      serverId: "r2",
      target: { status: "bound", targetBindingRevision: 1 },
      cadence: { actionsUsed: 1, open: false },
    });
  });

  it.each([
    "stale_lease",
    "different_node",
    "different_parent",
    "missing_event",
    "different_server",
  ])("does not accept a remote execution receipt with %s", (mismatch) => {
    const { currentInput, previous } = executedRemoteInstall();
    if (mismatch === "stale_lease")
      previous.turnPlanExecutionLease!.currentBinding.stateVersion = 8;
    if (mismatch === "different_node")
      previous.turnPlanExecutionLease!.nodeId = "other";
    if (mismatch === "different_parent")
      previous.instances[1]!.parentInstanceId = "other";
    if (mismatch === "missing_event") currentInput.eventTail = [];
    if (mismatch === "different_server")
      currentInput.eventTail![0]!.publicPayload!.serverId = "r3";
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: currentInput,
      previous,
      remoteDoctrine: doctrine(),
      scoreProjects: [],
      assessMaturityForServer: () => undefined,
    });
    expect(signal).toMatchObject({
      serverId: "new_remote",
      cadence: { actionsUsed: 0 },
    });
  });

  it.each([
    ["none dependency", doctrine({ dependency: "none" })],
    ["no protection", doctrine({ protectionTarget: "none" })],
    ["no cadence", doctrine({ backgroundActionsPerTurn: 0 })],
    ["no score purpose", doctrine({ purposes: ["asset_economy"] })],
  ])("does not quote a remote with %s", (_name, remoteDoctrine) => {
    const assessMaturityForServer = vi.fn();
    expect(
      buildCorpScoringRemoteProjectSignals({
        input: input(),
        remoteDoctrine,
        scoreProjects: [],
        assessMaturityForServer,
      }),
    ).toEqual([]);
    expect(assessMaturityForServer).not.toHaveBeenCalled();
  });

  it("does not quote a resident remote during the opening", () => {
    const currentInput = input();
    currentInput.playerView.turnSerial = 4;
    const assessMaturityForServer = vi.fn();
    expect(
      buildCorpScoringRemoteProjectSignals({
        input: currentInput,
        remoteDoctrine: doctrine(),
        scoreProjects: [],
        assessMaturityForServer,
      }),
    ).toEqual([]);
    expect(assessMaturityForServer).not.toHaveBeenCalled();
  });

  it("re-emits one stable prebuild project and prefers a partially built empty remote", () => {
    const assessMaturityForServer = vi.fn((serverId: string) =>
      serverId === "r2"
        ? {
            knowledge: "known" as const,
            observedAtStateVersion: 10,
            policyVersion: "corp-remote-protection-v1" as const,
            fundedPath: pathQuote(),
            stagedPath: pathQuote(),
            targetBand: "taxing" as const,
            fundedTargetReached: false,
            stagedTargetReached: false,
            selectedFundedRezIceIds: [],
            minimumSatisfyingStagedIceIds: [],
          }
        : undefined,
    );
    const signals = buildCorpScoringRemoteProjectSignals({
      input: input(),
      remoteDoctrine: doctrine(),
      scoreProjects: [],
      assessMaturityForServer,
    });
    expect(assessMaturityForServer).toHaveBeenCalledTimes(1);
    expect(assessMaturityForServer).toHaveBeenCalledWith("r2", "taxing");
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      projectId: "strategic-score-remote",
      serverId: "r2",
      phase: "harden_to_protection_target",
      need: { capability: "improve_remote_protection_path" },
    });
  });

  it("leases a payload-ready remote to Score without publishing a second need", () => {
    const ready = {
      knowledge: "known" as const,
      observedAtStateVersion: 10,
      policyVersion: "corp-remote-protection-v1" as const,
      fundedPath: pathQuote(),
      stagedPath: pathQuote(),
      targetBand: "taxing" as const,
      fundedTargetReached: true,
      stagedTargetReached: true,
      selectedFundedRezIceIds: ["ice-1"],
      minimumSatisfyingStagedIceIds: ["ice-1"],
    };
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: input(),
      remoteDoctrine: doctrine(),
      scoreProjects: [
        {
          projectId: "score-1",
          serverId: "r2",
          agendaInstanceId: "a",
          feasible: true,
        },
      ],
      assessMaturityForServer: (serverId) =>
        serverId === "r2" ? ready : undefined,
    });
    expect(signal?.phase).toBe("leased_to_score_project");
    expect(signal?.need).toBeUndefined();
  });

  it("keeps a blocked hypothetical score route unleased and trusts Engine agenda capacity on an occupied root", () => {
    const currentInput = input();
    currentInput.playerView.servers = currentInput.playerView.servers.map(
      (server) =>
        server.id === "r2"
          ? { ...server, root: [{ instanceId: "upgrade", known: true }] }
          : server,
    );
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: currentInput,
      remoteDoctrine: doctrine(),
      scoreProjects: [
        {
          projectId: "blocked-score",
          serverId: "r2",
          agendaInstanceId: "agenda-in-hq",
          feasible: false,
        },
      ],
      assessMaturityForServer: () => undefined,
    });

    expect(signal).toMatchObject({
      serverId: "r2",
      phase: "assessment_unknown",
    });
  });

  it("admits an on-demand score consumer whose only blocker is bound remote protection", () => {
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: input(),
      remoteDoctrine: doctrine({ buildTiming: "on_demand" }),
      scoreProjects: [
        {
          projectId: "score-agenda-1",
          serverId: "r2",
          agendaInstanceId: "agenda-in-hq",
          protectionNeed: {
            needId: "score-protection:score-agenda-1:r2:revision-4",
            parentProjectId: "score-agenda-1",
            targetServerId: "r2",
            observedAtStateVersion: 10,
          },
          feasible: false,
        },
      ],
      assessMaturityForServer: () => undefined,
    });

    expect(signal).toMatchObject({
      serverId: "r2",
      phase: "leased_to_score_project",
      need: {
        needId: "remote-hardening:strategic-score-remote:0",
        capability: "improve_remote_protection_path",
        targetServerId: "r2",
      },
      consumerSupport: {
        kind: "awaiting_remote_protection",
        agendaInstanceId: "agenda-in-hq",
        targetServerId: "r2",
        protectionNeedId: "score-protection:score-agenda-1:r2:revision-4",
      },
    });
  });

  it("keeps the score lease identity stable across a turn-only state change", () => {
    const scoreProject = (observedAtStateVersion: number) => ({
      projectId: "score-agenda-1",
      serverId: "r2",
      agendaInstanceId: "agenda-in-hq",
      protectionNeed: {
        needId: "score-protection:score-agenda-1:r2:revision-4",
        parentProjectId: "score-agenda-1",
        targetServerId: "r2",
        observedAtStateVersion,
      },
      feasible: false,
    });
    const [first] = buildCorpScoringRemoteProjectSignals({
      input: input(),
      remoteDoctrine: doctrine({ buildTiming: "on_demand" }),
      scoreProjects: [scoreProject(10)],
      assessMaturityForServer: () => undefined,
    });
    const nextInput = input();
    nextInput.playerView.stateVersion = 11;
    nextInput.playerView.turnSerial = 9;
    nextInput.legalActions = nextInput.legalActions.map((action) => ({
      ...action,
      expiresAtStateVersion: 11,
    }));
    const previous = {
      stateVersion: 10,
      instances: [
        {
          moduleId: "corp.establish_scoring_remote",
          dedupeKey: "strategic-score-remote",
          moduleState: { kind: "remote", signal: first },
        },
      ],
    } as unknown as ResidentPlanPortfolio;
    const [second] = buildCorpScoringRemoteProjectSignals({
      input: nextInput,
      previous,
      remoteDoctrine: doctrine({ buildTiming: "on_demand" }),
      scoreProjects: [scoreProject(11)],
      assessMaturityForServer: () => undefined,
    });

    expect(second?.target.targetBindingRevision).toBe(
      first?.target.targetBindingRevision,
    );
    expect(second?.scoreLeaseId).toBe(first?.scoreLeaseId);
    expect(second?.scoreLeaseId).not.toContain("corp:9");
    expect(second?.scoreLeaseId).not.toContain(":11:");
  });
});

function executedRemoteInstall() {
  const currentInput = input();
  currentInput.playerView.own.gripOrHq = [];
  currentInput.legalActions = [];
  currentInput.eventTail = [
    {
      eventId: 11,
      type: "install_card",
      stateVersionBefore: 9,
      stateVersionAfter: 10,
      stateHashAfter: "fnv1a:remote-installed",
      publicPayload: {
        actor: "corp",
        actionType: "install_card",
        installPlacement: "ice",
        serverId: "r2",
      },
    },
  ] as AiDecisionInput["eventTail"];
  const rootId = "plan:corp.establish_scoring_remote:strategic-score-remote";
  const previous = {
    side: "corp",
    stateVersion: 9,
    executorInstanceId: "defense",
    rootForegroundInstanceId: rootId,
    instances: [
      {
        instanceId: rootId,
        moduleId: "corp.establish_scoring_remote",
        dedupeKey: "strategic-score-remote",
        moduleState: {
          kind: "remote",
          signal: {
            serverId: "new_remote",
            target: { status: "unbound", targetBindingRevision: 0 },
            cadence: { turnKey: "corp:8", actionsUsed: 0 },
          },
        },
      },
      {
        instanceId: "defense",
        moduleId: "corp.defend_servers",
        parentInstanceId: rootId,
        moduleState: {
          kind: "defense",
          signals: [
            {
              parentKind: "remote",
              parentProjectId: "strategic-score-remote",
              serverId: "new_remote",
              sourceCardInstanceId: "ice-1",
              actionIds: ["install-ice"],
            },
          ],
        },
      },
    ],
    turnPlanCommitment: {
      commitmentId: "commitment",
      sourcePlanId: "plan",
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases: [
        {
          phaseId: "phase",
          root: { planInstanceId: rootId },
          nodes: [
            {
              nodeId: "node",
              invocation: {
                routeKey: "route",
                semanticActionType: "install.card",
                sourceCardInstanceId: "ice-1",
              },
            },
          ],
        },
      ],
    },
    turnPlanExecutionLease: {
      commitmentId: "commitment",
      sourcePlanId: "plan",
      phaseId: "phase",
      nodeId: "node",
      routeKey: "route",
      actionType: "install_card",
      stateIdentity: { stateVersion: 9 },
      currentBinding: { stateVersion: 9, actionId: "install-ice" },
    },
  } as unknown as ResidentPlanPortfolio;
  return { currentInput, previous };
}

function doctrine(
  overrides: {
    dependency?: RemoteDoctrineProfile["dependency"];
    protectionTarget?: RemoteDoctrineProfile["protectionTarget"];
    purposes?: RemoteDoctrineProfile["purposes"];
    backgroundActionsPerTurn?: number;
    buildTiming?: RemoteDoctrineProfile["buildTiming"];
  } = {},
): RemoteDoctrineProfile {
  return {
    schemaVersion: "remote-doctrine-profile-v2",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "plan_portfolio",
    },
    dependency: overrides.dependency ?? "primary",
    purposes: overrides.purposes ?? ["scoreline"],
    protectionTarget: overrides.protectionTarget ?? "taxing",
    buildTiming: overrides.buildTiming ?? "prebuild",
    investmentBudget: {
      maxTargetRemotes: 1,
      maxIceBeforePayload: 3,
      backgroundActionsPerTurn: overrides.backgroundActionsPerTurn ?? 1,
      targetRecoveryTurns: 2,
    },
    confidence: "high",
    evidence: [],
  };
}

function input(): AiDecisionInput {
  return {
    side: "corp",
    actionNumber: 10,
    playerView: {
      stateVersion: 10,
      turnSerial: 8,
      own: {
        gripOrHq: [{ instanceId: "agenda-in-hq", known: true, type: "agenda" }],
      },
      servers: [
        { id: "hq", ice: [], root: [] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
        { id: "r1", ice: [], root: [{ instanceId: "asset" }] },
        { id: "r2", ice: [{ instanceId: "ice-1" }], root: [] },
      ],
    },
    legalActions: [
      {
        actionId: "install-agenda-remote-2",
        side: "corp",
        type: "install_card",
        source: "agenda-in-hq",
        expiresAtStateVersion: 10,
        payload: { placement: "root", serverId: "r2" },
      },
    ],
  } as unknown as AiDecisionInput;
}

function pathQuote() {
  return {
    accessStatus: "reachable" as const,
    generalCreditsBefore: 10,
    generalCreditsAfter: 10,
    generalCreditTax: 0,
    restrictedCreditsSpent: { breaker: 0, stealth: 0, hosted: 0, other: 0 },
    futureClicksLost: 0,
    hazards: {
      unavoidableDamage: 0,
      expectedTags: 0,
      programTrashPressure: false,
      runLockOrActionTax: false,
      preventsFutureBreaking: false,
    },
    conditionalAccessReasons: [],
    conditionalRiskReasons: [],
  };
}

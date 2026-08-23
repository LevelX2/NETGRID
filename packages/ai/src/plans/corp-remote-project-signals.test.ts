import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import type { RemoteDoctrineProfile } from "../remote-doctrine-profile";
import { buildCorpScoringRemoteProjectSignals } from "./corp-remote-project-signals";

describe("resident Corp scoring remote project", () => {
  it.each([
    ["none dependency", doctrine({ dependency: "none" })],
    ["no protection", doctrine({ protectionTarget: "none" })],
    ["no cadence", doctrine({ backgroundActionsPerTurn: 0 })],
    ["no score purpose", doctrine({ purposes: ["asset_economy"] })],
  ])("does not admit %s", (_name, remoteDoctrine) => {
    expect(
      buildCorpScoringRemoteProjectSignals({
        input: input(),
        remoteDoctrine,
        scoreProjects: [],
        maturityByServerId: new Map(),
      }),
    ).toEqual([]);
  });

  it("re-emits one stable prebuild project and prefers a partially built empty remote", () => {
    const signals = buildCorpScoringRemoteProjectSignals({
      input: input(),
      remoteDoctrine: doctrine(),
      scoreProjects: [],
      maturityByServerId: new Map([
        [
          "remote_2",
          {
            knowledge: "known",
            observedAtStateVersion: 10,
            policyVersion: "corp-remote-protection-v1",
            fundedPath: pathQuote(),
            stagedPath: pathQuote(),
            targetBand: "taxing",
            fundedTargetReached: false,
            stagedTargetReached: false,
            selectedFundedRezIceIds: [],
            minimumSatisfyingStagedIceIds: [],
          },
        ],
      ]),
    });
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      projectId: "strategic-score-remote",
      serverId: "remote_2",
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
          serverId: "remote_2",
          agendaInstanceId: "a",
          feasible: true,
        },
      ],
      maturityByServerId: new Map([["remote_2", ready]]),
    });
    expect(signal?.phase).toBe("leased_to_score_project");
    expect(signal?.need).toBeUndefined();
  });

  it("keeps a blocked hypothetical score route unleased and trusts Engine agenda capacity on an occupied root", () => {
    const currentInput = input();
    currentInput.playerView.servers = currentInput.playerView.servers.map(
      (server) =>
        server.id === "remote_2"
          ? { ...server, root: [{ instanceId: "upgrade", known: true }] }
          : server,
    );
    const [signal] = buildCorpScoringRemoteProjectSignals({
      input: currentInput,
      remoteDoctrine: doctrine(),
      scoreProjects: [
        {
          projectId: "blocked-score",
          serverId: "remote_2",
          agendaInstanceId: "agenda-in-hq",
          feasible: false,
        },
      ],
      maturityByServerId: new Map(),
    });

    expect(signal).toMatchObject({
      serverId: "remote_2",
      phase: "assessment_unknown",
    });
  });
});

function doctrine(
  overrides: {
    dependency?: RemoteDoctrineProfile["dependency"];
    protectionTarget?: RemoteDoctrineProfile["protectionTarget"];
    purposes?: RemoteDoctrineProfile["purposes"];
    backgroundActionsPerTurn?: number;
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
    buildTiming: "prebuild",
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
        { id: "remote_1", ice: [], root: [{ instanceId: "asset" }] },
        { id: "remote_2", ice: [{ instanceId: "ice-1" }], root: [] },
      ],
    },
    legalActions: [
      {
        actionId: "install-agenda-remote-2",
        side: "corp",
        type: "install_card",
        source: "agenda-in-hq",
        expiresAtStateVersion: 10,
        payload: { placement: "root", serverId: "remote_2" },
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

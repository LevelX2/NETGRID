import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import {
  CORP_OPENING_RUSH_SCHEMA_VERSION,
  assessCorpOpeningRush,
} from "./corp-opening-rush";

describe("Corp opening rush admission", () => {
  it("is stable for one opportunity and varies across match seeds", () => {
    const decisions = Array.from({ length: 40 }, (_, index) =>
      assess(`opening-seed-${index}`),
    );
    const qualified = decisions.filter(
      (decision) => decision?.status === "qualified",
    );

    expect(qualified.length).toBe(40);
    expect(
      qualified.some(
        (decision) =>
          decision?.status === "qualified" &&
          decision.admission === "accepted",
      ),
    ).toBe(true);
    expect(
      qualified.some(
        (decision) =>
          decision?.status === "qualified" &&
          decision.admission === "declined",
      ),
    ).toBe(true);

    const first = assess("opening-seed-stable");
    const repeated = assess("opening-seed-stable", {
      actionNumber: 99,
      stateVersion: 9,
    });
    expect(repeated).toEqual(first);
    expect(first).toMatchObject({
      status: "qualified",
      acceptancePercent: 50,
      quote: {
        schemaVersion: CORP_OPENING_RUSH_SCHEMA_VERSION,
        opportunityKey: "opening-rush:2:agenda-1:remote_1",
        firstContestTurnSerial: 3,
        runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
      },
    });
  });

  it("blocks a public Shell-Traders breaker staged for delayed install", () => {
    const decision = assess("staged-breaker", {
      stagedBreaker: true,
    });

    expect(decision).toEqual(
      expect.objectContaining({
        status: "blocked",
        reason: "public_staged_breaker",
      }),
    );
    expect(JSON.stringify(decision)).toContain("rent-i-con");
  });

  it("blocks late, excessive-risk, unknown, reserve-breaking, and acute-central lines", () => {
    expect(assess("late", { turnSerial: 6 })).toMatchObject({
      status: "blocked",
      reason: "outside_opening_window",
    });
    expect(
      assess("too-risky", {
        accessProbability: { numerator: 3, denominator: 4 },
      }),
    ).toMatchObject({
      status: "blocked",
      reason: "risk_above_opening_ceiling",
    });
    expect(assess("unknown", { unknownProtection: true })).toMatchObject({
      status: "blocked",
      reason: "unknown_protection_projection",
    });
    expect(assess("reserve", { preservesReserve: false })).toMatchObject({
      status: "blocked",
      reason: "score_reserve_not_preserved",
    });
    expect(assess("central", { centralThreat: "acute" })).toMatchObject({
      status: "blocked",
      reason: "acute_central_threat",
    });
  });
});

function assess(
  seed: string,
  options: {
    turnSerial?: number;
    actionNumber?: number;
    stateVersion?: number;
    stagedBreaker?: boolean;
    unknownProtection?: boolean;
    preservesReserve?: boolean;
    accessProbability?: { numerator: number; denominator: number };
    centralThreat?: "none" | "acute";
  } = {},
) {
  const stateVersion = options.stateVersion ?? 1;
  const accessProbability = options.accessProbability ?? {
    numerator: 1,
    denominator: 2,
  };
  const input = {
    side: "corp",
    seed,
    actionNumber: options.actionNumber ?? 1,
    playerView: {
      stateVersion,
      turnSerial: options.turnSerial ?? 2,
      servers: [
        { id: "hq", ice: [], root: [] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
        {
          id: "remote_1",
          ice: [{ instanceId: "ice-1", known: true }],
          root: [],
        },
      ],
      specialZones: {
        setAside: options.stagedBreaker
          ? [
              {
                instanceId: "rent-i-con",
                definitionId: "onr_classic_031_rent-i-con",
                known: true,
              },
            ]
          : [],
      },
    },
  } as unknown as AiDecisionInput;
  const project = {
    projectId: "agenda:agenda-1:remote_1",
    agendaInstanceId: "agenda-1",
    agendaDefinitionId: "onr_v1_189_artificial-security-directors",
    serverId: "remote_1",
    actionIds: ["install-agenda"],
    phase: "install_agenda",
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: false,
    protectionNeed: {
      needId: "score-protection:agenda:agenda-1:remote_1",
      parentProjectId: "agenda:agenda-1:remote_1",
      targetServerId: "remote_1",
      observedAtStateVersion: stateVersion,
      objective: {
        kind: "funded_remote_access_risk",
        maximumRunnerAccessSuccessProbability: {
          numerator: 1,
          denominator: 4,
        },
        policySource: "corp_score_default_strict_access_risk",
      },
      scoreReserve: {
        creditBreakdown: [
          { reserveId: "score_action:install-agenda", credits: 0 },
          { reserveId: "remaining_advancement:agenda-1", credits: 3 },
        ],
        hardClickReserve: 0,
      },
      baseline: options.unknownProtection
        ? {
            knowledge: "unknown",
            availableCorpCredits: 5,
            availableCorpClicks: 3,
            totalScoreReserveCredits: 3,
            hardClickReserve: 0,
            fundedProtection: false,
            evidence: [],
            unknownReason: "missing_rez_cost_quote",
          }
        : {
            knowledge: "known",
            availableCorpCredits: 5,
            availableCorpClicks: 3,
            totalScoreReserveCredits: 3,
            hardClickReserve: 0,
            fundedProtection: false,
            evidence: [],
            scoreReserveFingerprint: "score-reserve",
            protection: {
              knowledge: "known",
              maximumRunnerAccessSuccessProbability: {
                numerator: 1,
                denominator: 4,
              },
              runnerAccessSuccessProbability: accessProbability,
              protectsScore: false,
              requiredRandomBreakSuccesses: 1,
              randomBreaks: [
                {
                  iceInstanceId: "ice-1",
                  iceDefinitionId: "onr_v1_238_data-wall-2-0",
                  breakerInstanceId: "blink",
                  breakerDefinitionId: "onr_v1_007_blink",
                  attempts: 1,
                  successProbabilityPerAttempt: {
                    numerator: 1,
                    denominator: 2,
                  },
                  combinedSuccessProbability: {
                    numerator: 1,
                    denominator: 2,
                  },
                },
              ],
              runnerCreditsRemainingOnBestAccessPath: 0,
              evidence: [],
            },
            selectedRezCosts: [],
            totalSelectedRezCost: 0,
            creditsAfterDefense: options.preservesReserve === false ? -1 : 2,
            clicksAfterDefense: 2,
            preservesScoreCreditReserve:
              options.preservesReserve !== false,
            preservesHardClickReserve: true,
          },
    },
  } as unknown as Parameters<typeof assessCorpOpeningRush>[0]["project"];
  const candidate = {
    actionId: "install-agenda",
    actionType: "install_card",
    sourceKind: "card",
    sourceCardInstanceId: "agenda-1",
    semanticActionType: "install.card",
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
  } as unknown as ActionSemanticCandidate;
  return assessCorpOpeningRush({
    input,
    project,
    candidate,
    centralDefenseAllocation: centralAllocation(
      options.centralThreat ?? "none",
    ),
  });
}

function centralAllocation(
  threat: "none" | "acute",
): CorpCentralDefenseAllocation {
  const evidence = {
    threat,
    expectedAgendaLoss: { numerator: 0, denominator: 1 },
    expectedTrashableLoss: { numerator: 0, denominator: 1 },
    accessibleCardCount: 1,
    isMultiaccess: false,
    recentRunOrAccessEvents: 0,
    recentSuccessfulAccessRunnerTurns: 0,
    serverBoundEffectIds: [],
  } as const;
  return {
    status: "known",
    selectedServerId: "hq",
    evidence: { hq: evidence, rd: evidence },
    canonicalNearTieCandidateServerIds: ["hq", "rd"],
    hqHold: { status: "ineligible" },
  };
}

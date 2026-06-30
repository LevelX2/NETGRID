import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  normalizedCorpBoardTriageValue,
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
  type CorpBoardTriageDependencies,
} from "./semantic-runtime-corp-board-triage";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

describe("semantic runtime corp board triage", () => {
  it("normalizes boardstate triage values into the AI-COMPLETE-17 consumer scale", () => {
    expect(normalizedCorpBoardTriageValue(0)).toBe(0);
    expect(normalizedCorpBoardTriageValue(850)).toBe(17);
    expect(normalizedCorpBoardTriageValue(1200)).toBe(24);
    expect(normalizedCorpBoardTriageValue(-2200)).toBe(-44);
    expect(normalizedCorpBoardTriageValue(-4200)).toBe(-84);
    expect(normalizedCorpBoardTriageValue(7000)).toBe(100);
  });

  it("treats purge as a hard mismatch while a critical scoring remote needs protection", () => {
    const purge = corpAction("purge", "purge_runner_virus_counters");
    const scoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const input = corpInput({
      legalActions: [scoreline, purge],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });

    const component = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      purge,
      testDependencies({
        scoringWindowByActionId: {
          [scoreline.actionId]: scoringWindow({
            serverId: "remote_1",
            windowKind: "unsafe",
            agendaStealSeverity: "game_ending",
            recommendedNextStep: "build_remote_ice",
          }),
        },
      }),
    );

    expect(component).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(component?.reason).toContain("triage_primary:protect_score_remote");
    expect(component?.reason).toContain("triage_action:purge_runner_virus_counters");
  });

  it("lets critical repeated R&D pressure override remote-protection triage", () => {
    const purge = corpAction("purge", "purge_runner_virus_counters");
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const rdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [rdVirusCard("highlighter")],
      legalActions: [remoteScoreline, rdIce, purge],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          agendaStealSeverity: "game_ending",
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const purgeComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      purge,
      dependencies,
    );
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_central_override:critical_before_remote",
    );
    expect(purgeComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });
});

function corpInput(overrides: {
  legalActions: LegalAction[];
  servers: AiDecisionInput["playerView"]["servers"];
  runnerAgendaPoints?: number;
  runnerRig?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: overrides.legalActions,
    eventTail: overrides.eventTail ?? [],
    playerView: {
      stateVersion: 1,
      own: {
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        stackOrRdCount: 20,
      },
      opponent: {
        credits: 4,
        clicks: 4,
        agendaPoints: overrides.runnerAgendaPoints ?? 0,
        rig: overrides.runnerRig ?? [],
        scoreArea: [],
      },
      publicEvents: [],
      servers: overrides.servers,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function testDependencies(options: {
  scoringWindowByActionId?: Record<string, CorpScoringWindowAssessment>;
} = {}): CorpBoardTriageDependencies<"test"> {
  return {
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: [] }),
    corpActionIsScoreLine: (_input, action) =>
      action.actionId.includes("scoreline") || action.type === "advance_card",
    corpAdvanceCompletesScore: () => false,
    corpScoringWindowAssessment: (_input, action) =>
      options.scoringWindowByActionId?.[action.actionId],
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpHasRemoteInstability: () => false,
  };
}

function scoringWindow(
  overrides: Partial<CorpScoringWindowAssessment>,
): CorpScoringWindowAssessment {
  return {
    serverId: "remote_1",
    windowKind: "unsafe",
    runnerCanContestNow: true,
    runnerCanReachAccessNow: true,
    agendaStealRelevantNow: true,
    runnerCanContestBeforeScore: true,
    runnerCanReachAccessBeforeScore: true,
    agendaStealRelevantBeforeScore: true,
    agendaPointsAtRisk: 2,
    runnerAgendaPointsAfterSteal: 7,
    agendaStealSeverity: "game_ending",
    missingVisibleBreakerCoverage: false,
    corpCanRezRelevantIce: true,
    affordableDurableRelevantIceCount: 0,
    dynamicProtectionWeaknessCount: 1,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: false,
    scoreHorizon: "next_turn",
    runnerExposureCreditActions: 3,
    recommendedNextStep: "build_remote_ice",
    evidence: ["test_scoring_window"],
    ...overrides,
  };
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    type,
    side: "corp",
    label: actionId,
    source: "basic_action",
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function centralServer(
  id: "hq" | "rd",
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id.toUpperCase(), ice: [...ice], root: [] };
}

function remoteServer(
  id: `remote_${number}`,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id, ice: [...ice], root: [...root] };
}

function agendaCard(): VisibleCard {
  return {
    instanceId: "remote-agenda",
    known: true,
    type: "agenda",
    owner: "corp",
    advancementRequirement: 3,
    advancementCounters: 1,
    agendaPoints: 2,
  } as VisibleCard;
}

function iceCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    owner: "corp",
    definitionId: "simple_barrier_ice",
    rezCost: 2,
  } as VisibleCard;
}

function rdVirusCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    owner: "runner",
    title: "Highlighter",
    rulesText:
      "After each successful run on R&D, give the Corp a Highlighter counter. Each counter after the first allows you to access an additional card from R&D.",
  } as VisibleCard;
}

function publicCentralEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverId: "hq" | "rd",
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType,
      serverId,
    },
  };
}

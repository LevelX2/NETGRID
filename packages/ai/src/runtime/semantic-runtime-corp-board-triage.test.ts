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
    expect(component?.reason).toContain(
      "triage_action:purge_runner_virus_counters",
    );
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
      "corp_board_triage_central_override:pre_score_rd_exposure",
    );
    expect(purgeComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not override an active scoreline when R&D already has effective stop ICE", () => {
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const rdIce = corpAction("install-rd-extra-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [rdVirusCard("highlighter")],
      legalActions: [remoteScoreline, rdIce, remoteIce],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [
          iceCard("rd-stop-1", { rezzed: false }),
          iceCard("rd-stop-2", { rezzed: false }),
          iceCard("rd-stop-3", { rezzed: false }),
        ]),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "near_win",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_primary:protect_score_remote",
    );
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("aligns same-target R&D rez under critical protect-rd triage", () => {
    const rdRez = corpRezIceAction("rez-rd-quandary", "rd-ice", 2);
    const declineRez = corpAction("decline-rez", "decline_rez");
    const input = corpInput({
      runnerAgendaPoints: 5,
      legalActions: [rdRez, declineRez],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [
          iceCard("rd-ice", {
            definitionId: "onr_v1_261_quandary",
            title: "Quandary",
          }),
        ]),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rezComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdRez,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(rezComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rezComponent?.reason).toContain("triage_action:rez_ice");
    expect(rezComponent?.reason).toContain("triage_action_server:rd");
  });

  it("aligns same-target R&D tax rez when visible breaker coverage still pays through ETR", () => {
    const rdRez = corpRezIceAction("rez-rd-wall", "rd-wall", 3);
    const declineRez = corpAction("decline-rez", "decline_rez");
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [earlyWormBreaker()],
      legalActions: [rdRez, declineRez],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [
          iceCard("rd-wall", {
            definitionId: "onr_v1_279_wall-of-static",
            title: "Wall of Static",
            subtypes: ["wall"],
          }),
        ]),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rezComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdRez,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(rezComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rezComponent?.reason).toContain("triage_action:rez_ice");
    expect(rezComponent?.reason).toContain("triage_action_server:rd");
  });

  it("treats end-turn as a mismatch while critical central protection is unresolved", () => {
    const endTurn = corpAction("end-turn", "end_turn");
    const rdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const input = corpInput({
      runnerAgendaPoints: 5,
      legalActions: [endTurn, rdIce],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const endTurnComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      endTurn,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(endTurnComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(endTurnComponent?.reason).toContain("triage_action:end_turn");
  });

  it("protects open HQ before forcing remote scoreline when HQ agenda flood has runner exposure", () => {
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
      legalActions: [remoteAgenda, hqIce],
      servers: [
        centralServer("hq", []),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      severity: "critical",
      targetServerId: "hq",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_central_override:unprotected_hq_before_runner_exposure",
    );
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("protects HQ with visibly covered ICE before forcing remote scoreline", () => {
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
      runnerRig: [fracterBreaker()],
      legalActions: [remoteAgenda, hqIce],
      servers: [
        centralServer("hq", [
          iceCard("hq-wall", {
            title: "Wall of Static",
            definitionId: "onr_v1_279_wall-of-static",
            rezzed: true,
            subtypes: ["Wall"],
            rulesText: "End the run.",
          }),
        ]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      severity: "critical",
      targetServerId: "hq",
    });
    expect(triage.evidence).toContain("corp_hq_ice_count:1");
    expect(triage.evidence).toContain("corp_hq_effective_stop_ice:false");
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("funds instead of forcing a game-ending accessible emergency remote", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 4)],
      corpCredits: 2,
      runnerAgendaPoints: 4,
      legalActions: [remoteAgenda, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          runnerCanContestNow: true,
          runnerCanReachAccessNow: true,
          agendaStealRelevantNow: true,
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 8,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_hq_agenda_emergency_remote_conversion:true",
    );
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });
});

function corpInput(overrides: {
  legalActions: LegalAction[];
  servers: AiDecisionInput["playerView"]["servers"];
  corpHq?: VisibleCard[];
  corpCredits?: number;
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
        credits: overrides.corpCredits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: overrides.corpHq ?? [],
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

function testDependencies(
  options: {
    scoringWindowByActionId?: Record<string, CorpScoringWindowAssessment>;
  } = {},
): CorpBoardTriageDependencies<"test"> {
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

function corpRezIceAction(
  actionId: string,
  source: string,
  rezCost: number,
): LegalAction {
  return {
    actionId,
    type: "rez_ice",
    side: "corp",
    label: actionId,
    source,
    costs: [{ credits: rezCost }],
    payload: { rezCostPaid: rezCost },
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

function agendaCard(
  instanceId = "remote-agenda",
  agendaPoints = 2,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "agenda",
    owner: "corp",
    advancementRequirement: 3,
    advancementCounters: 1,
    agendaPoints,
  } as VisibleCard;
}

function iceCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    owner: "corp",
    definitionId: "simple_barrier_ice",
    rezCost: 2,
    ...overrides,
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

function earlyWormBreaker(): VisibleCard {
  return {
    instanceId: "early-worm",
    known: true,
    type: "program",
    owner: "runner",
    title: "Early Worm",
    definitionId: "onr_classic_027_early-worm",
    subtypes: ["Icebreaker", "Worm"],
  } as VisibleCard;
}

function fracterBreaker(): VisibleCard {
  return {
    instanceId: "runner-fracter",
    known: true,
    type: "program",
    owner: "runner",
    title: "Runner Fracter",
    subtypes: ["Icebreaker", "Fracter"],
    rulesText: "Break wall subroutines.",
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

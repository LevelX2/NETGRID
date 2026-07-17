import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";

import { semanticRuntimeCorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import {
  agendaCard,
  assess,
  blankIce,
  brokerResource,
  bugZapperIce,
  centralIce,
  centralServer,
  classicWallIce,
  corpAction,
  corpInput,
  dogPileIce,
  earlyWormBreaker,
  findVisibleCard,
  genericIce,
  hunterTraceTagIce,
  huntingPackIce,
  mastermindIce,
  mobileBarricadeIce,
  newsgroupFilter,
  operationCard,
  protectedCentralServers,
  publicEvent,
  publicLabelEvent,
  remoteEvent,
  remoteServer,
  runnerCentralPressureCard,
  server,
  simpleFracter,
  simpleKiller,
  testDependencies,
  wallIce,
} from "../semantic-runtime-corp-scoring-window.test-support";

const DEFINITION_BACKED_AGENDA_ID =
  "test_definition_backed_score_window_agenda";

describe("semanticRuntimeCorpScoringWindowAssessment protection", () => {
  afterEach(() => {
    delete CARD_DEFINITIONS_BY_ID[DEFINITION_BACKED_AGENDA_ID];
  });

  it("treats remote ICE as the next score-window step when it removes before-score contestability", () => {
    const agenda = agendaCard("remote-agenda", {
      advancementCounters: 1,
      advancementRequirement: 4,
    });
    const iceToInstall = wallIce("second-remote-wall", { rezCost: 2 });
    const action = corpAction(
      "install-second-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      iceToInstall.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 2,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [iceToInstall],
        servers: protectedCentralServers([
          remoteServer(
            "remote_1",
            [wallIce("remote-wall", { rezzed: true, rezCost: 0 })],
            [agenda],
          ),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      runnerCanContestBeforeScore: false,
      recommendedNextStep: "build_remote_ice",
    });
  });

  it("lets acute HQ pressure override a temporary remote score window", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda],
        servers: [
          centralServer("hq", []),
          centralServer("rd", [centralIce("rd-ice")]),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      missingVisibleBreakerCoverage: true,
    });
    expect(assessment?.evidence).toContain("central_pressure:true");
  });

  it("treats agenda-heavy HQ with visibly breakable ICE as acute central pressure", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 8,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [agenda],
        servers: [
          centralServer("hq", [
            wallIce("hq-wall", { rezzed: true, rezCost: 0 }),
          ]),
          centralServer("rd", [centralIce("rd-ice")]),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      missingVisibleBreakerCoverage: false,
    });
    expect(assessment?.evidence).toContain("central_pressure:true");
  });

  it("lets acute R&D run history override a temporary remote score window", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda],
        eventTail: [
          publicEvent("rd-run-1", "start_run", "rd"),
          publicEvent("rd-access-1", "access_card", "rd"),
        ],
        servers: [
          centralServer("hq", [centralIce("hq-ice")]),
          centralServer("rd", []),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      missingVisibleBreakerCoverage: true,
    });
    expect(assessment?.evidence).toContain("central_pressure:true");
  });

  it("counts label-only R&D run history as acute central pressure", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda],
        eventTail: [
          publicLabelEvent("rd-label-run-1", "start_run", "R&D"),
          publicLabelEvent("rd-label-access-1", "access_card", "R&D"),
        ],
        servers: [
          centralServer("hq", [centralIce("hq-ice")]),
          centralServer("rd", []),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      missingVisibleBreakerCoverage: true,
    });
    expect(assessment?.evidence).toContain("central_pressure:true");
  });

  it("does not treat an empty R&D with credits alone as acute central pressure", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 4,
        hq: [agenda],
        servers: [
          centralServer("hq", [centralIce("hq-ice")]),
          centralServer("rd", []),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      missingVisibleBreakerCoverage: true,
    });
    expect(assessment?.evidence).toContain("central_pressure:false");
  });

  it("bounds visible central multiaccess text to exact tokens", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );
    const servers = [
      centralServer("hq", [centralIce("hq-ice")]),
      centralServer("rd", []),
      remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
    ];

    const noiseAssessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 4,
        runnerRig: [
          runnerCentralPressureCard(
            "runner-noise",
            "multiaccessory R&Dish pressure",
          ),
        ],
        hq: [agenda],
        servers,
      }),
      action,
    );
    const positiveAssessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 4,
        runnerRig: [
          runnerCentralPressureCard(
            "runner-positive",
            "multiaccess R&D pressure",
          ),
        ],
        hq: [agenda],
        servers,
      }),
      action,
    );

    expect(noiseAssessment).toMatchObject({
      windowKind: "temporary_safe",
      missingVisibleBreakerCoverage: true,
    });
    expect(noiseAssessment?.evidence).toContain("central_pressure:false");
    expect(positiveAssessment).toMatchObject({
      windowKind: "unsafe",
      missingVisibleBreakerCoverage: true,
    });
    expect(positiveAssessment?.evidence).toContain("central_pressure:true");
  });

  it("classifies multiple affordable relevant ice as a durable scoring remote", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 6,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezCost: 2 }),
            wallIce("remote-wall-2", { rezCost: 2 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      corpCanRezRelevantIce: true,
      runnerCanContestNow: false,
    });
  });

  it("does not call a delayed scoreline durable when rich runner exposure only lacks visible coverage", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 6,
        runnerCredits: 10,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezCost: 2 }),
            wallIce("remote-wall-2", { rezCost: 2 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: true,
      affordableDurableRelevantIceCount: 2,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toContain("delayed_score_exposure_risk:true");
  });

  it("prefers funding when the Corp cannot pay the relevant remote rez", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 1,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 4 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      corpCanRezRelevantIce: false,
      recommendedNextStep: "gain_credit",
    });
  });

  it("does not call multiple unaffordable ice durable", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 2,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezCost: 5 }),
            wallIce("remote-wall-2", { rezCost: 5 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment?.windowKind).not.toBe("durable");
    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      corpCanRezRelevantIce: false,
    });
  });

  it("does not use cheap irrelevant ice as the remote rez floor", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 2,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            blankIce("blank-remote-ice", { rezCost: 0 }),
            wallIce("relevant-remote-wall", { rezCost: 5 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      corpCanRezRelevantIce: false,
      recommendedNextStep: "gain_credit",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_relevant_ice_count:1",
        "remote_affordable_relevant_ice_count:0",
        "remote_rez_budget:min_relevant_rez_cost:5",
      ]),
    );
  });

  it("does not promote solo position-scaling ICE to durable protection", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [dogPileIce("solo-dog-pile")]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      corpCanRezRelevantIce: true,
    });
    expect(assessment?.windowKind).not.toBe("durable");
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_relevant_ice_count:1",
        "remote_durable_relevant_ice_count:0",
        "remote_weak_position_scaling_ice_count:1",
      ]),
    );
  });

  it("does not promote Bug Zapper plus Mastermind to durable protection without stable outside support", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 6,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            bugZapperIce("bug-zapper"),
            mastermindIce("mastermind"),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment?.windowKind).not.toBe("durable");
    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      affordableDurableRelevantIceCount: 0,
      dynamicProtectionWeaknessCount: 2,
    });
  });

  it("treats static ICE added to a dynamic-only remote as a concrete scoring-window improvement", () => {
    const agenda = agendaCard("agenda-in-hq");
    const iceToInstall = wallIce("static-remote-wall", { rezCost: 2 });
    const action = corpAction(
      "install-static-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      iceToInstall.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 6,
        hq: [agenda, iceToInstall],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            bugZapperIce("bug-zapper"),
            mastermindIce("mastermind"),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      recommendedNextStep: "build_remote_ice",
      affordableDurableRelevantIceCount: 1,
      dynamicProtectionWeaknessCount: 2,
    });
  });

  it("marks solo Dog Pile unsafe when visible killer coverage and credits can access", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 6,
        runnerRig: [simpleKiller("runner-killer")],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [dogPileIce("solo-dog-pile")]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanReachAccessNow: true,
      agendaStealRelevantNow: true,
      runnerCanContestNow: true,
    });
  });

  it("does not give generic remote-ice build value when a scoring remote already works", () => {
    const agenda = agendaCard("agenda-in-hq");
    const iceToInstall = wallIce("new-remote-wall", { rezCost: 2 });
    const action = corpAction(
      "install-remote-2-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_2",
      },
      iceToInstall.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda, iceToInstall],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 2 })]),
          remoteServer("remote_2", []),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "none",
      recommendedNextStep: "none",
    });
  });

  it("allows second remote ICE when it upgrades a temporary scoring remote to durable", () => {
    const agenda = agendaCard("agenda-in-hq");
    const iceToInstall = wallIce("second-remote-wall", { rezCost: 2 });
    const action = corpAction(
      "install-second-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      iceToInstall.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 6,
        runnerCredits: 9,
        hq: [agenda, iceToInstall],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 2 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      recommendedNextStep: "build_remote_ice",
    });
  });

  it("does not create remote-ice spam without agenda pressure or a scoreline", () => {
    const iceToInstall = wallIce("new-remote-wall", { rezCost: 2 });
    const action = corpAction(
      "install-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      iceToInstall.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [iceToInstall],
        servers: protectedCentralServers([remoteServer("remote_1", [])]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "none",
      recommendedNextStep: "none",
    });
  });

  it("marks a game-ending non-immediate dynamic-ICE scoreline unsafe", () => {
    const agenda = agendaCard("game-ending-agenda", {
      agendaPoints: 3,
      advancementRequirement: 3,
    });
    const action = corpAction(
      "install-game-ending-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 2,
        runnerAgendaPoints: 4,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            huntingPackIce("hunting-pack"),
            mobileBarricadeIce("mobile-barricade"),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      runnerCanContestBeforeScore: false,
      agendaPointsAtRisk: 3,
      runnerAgendaPointsAfterSteal: 7,
      agendaStealSeverity: "game_ending",
      recommendedNextStep: "gain_credit",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "agenda_steal_severity:game_ending",
        "remote_dynamic_protection_weakness_count:2",
        "remote_dynamic_protection_reserve:1",
        "corp_can_rez_full_path_with_dynamic_reserve:false",
      ]),
    );
  });

  it("keeps a game-ending static ETR window temporary when no visible coverage can contest", () => {
    const agenda = agendaCard("game-ending-static-agenda", {
      agendaPoints: 3,
      advancementRequirement: 3,
    });
    const action = corpAction(
      "install-game-ending-static-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 3,
        runnerAgendaPoints: 4,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 2 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      missingVisibleBreakerCoverage: true,
      agendaStealSeverity: "game_ending",
      recommendedNextStep: "install_agenda",
    });
    expect(assessment?.evidence).toContain(
      "remote_dynamic_protection_weakness_count:0",
    );
  });

  it("does not count reachable trace ICE as durable scoring protection", () => {
    const agenda = agendaCard("reachable-hazard-agenda", {
      agendaPoints: 2,
      advancementRequirement: 3,
    });
    const action = corpAction(
      "install-hazard-protected-agenda",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 4,
        runnerCredits: 6,
        runnerAgendaPoints: 5,
        runnerRig: [simpleKiller("runner-killer")],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            hunterTraceTagIce("remote-hunter", { rezCost: 2 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanReachAccessBeforeScore: true,
      corpCanRezRelevantIce: true,
      affordableDurableRelevantIceCount: 0,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_rez_budget:relevant_ice_count:1",
        "remote_rez_budget:durable_relevant_ice_count:0",
      ]),
    );
  });
});

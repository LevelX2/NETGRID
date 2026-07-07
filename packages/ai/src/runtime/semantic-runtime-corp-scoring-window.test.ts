import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";

import { semanticRuntimeCorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

const DEFINITION_BACKED_AGENDA_ID =
  "test_definition_backed_score_window_agenda";

describe("semanticRuntimeCorpScoringWindowAssessment", () => {
  afterEach(() => {
    delete DEMO_CARDS_BY_ID[DEFINITION_BACKED_AGENDA_ID];
  });

  it("allows an unprotected remote scoreline when the score completes before runner exposure", () => {
    const agenda = agendaCard("remote-agenda", {
      advancementCounters: 2,
      advancementRequirement: 3,
    });
    const action = corpAction(
      "advance-score-now",
      "advance_card",
      {
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        servers: [
          centralServer("hq", [centralIce("hq-ice")]),
          centralServer("rd", [centralIce("rd-ice")]),
          remoteServer("remote_1", [], [agenda]),
        ],
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      scoreHorizon: "immediate",
      runnerCanContestNow: false,
      recommendedNextStep: "advance",
    });
  });

  it("treats a one-ice remote as temporarily safe when no installed visible coverage can break it", () => {
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
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      missingVisibleBreakerCoverage: true,
      corpCanRezRelevantIce: true,
      runnerCanContestNow: false,
      recommendedNextStep: "install_agenda",
    });
  });

  it("reserves same-turn advance credits before calling a one-ice advance safe", () => {
    const agenda = agendaCard("agenda-in-remote", {
      advancementRequirement: 3,
    });
    const action = corpAction(
      "advance-agenda-with-thin-rez-floor",
      "advance_card",
      {
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 4,
        servers: protectedCentralServers([
          remoteServer(
            "remote_1",
            [wallIce("remote-wall", { rezCost: 3 })],
            [agenda],
          ),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: true,
      corpCanRezRelevantIce: false,
      runnerCanContestBeforeScore: false,
      recommendedNextStep: "gain_credit",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "pre_exposure_advancement_credit_reserve:2",
        "remote_rez_budget:pre_exposure_advancement_credit_reserve:2",
        "remote_rez_budget:credits_after_pre_exposure_reserve:2",
        "remote_rez_budget:min_relevant_rez_cost:3",
      ]),
    );
  });

  it("downgrades delayed one-ice agenda installs when rich runner exposure exists", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-delayed-agenda",
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
        runnerCredits: 9,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: true,
      runnerCanContestBeforeScore: false,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toContain("delayed_score_exposure_risk:true");
  });

  it("allows an unprotected remote install when remaining Corp clicks can close before runner exposure", () => {
    const agenda = agendaCard("agenda-in-hq", {
      advancementRequirement: 2,
    });
    const action = corpAction(
      "install-immediate-agenda",
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
        ownClicks: 4,
        runnerCredits: 9,
        hq: [agenda],
        servers: protectedCentralServers([remoteServer("remote_1", [])]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      scoreHorizon: "immediate",
      runnerCanContestNow: false,
      recommendedNextStep: "install_agenda",
    });
  });

  it("recognizes visible in-turn advancement bursts as immediate score windows", () => {
    const agenda = agendaCard("agenda-in-hq", {
      advancementRequirement: 3,
    });
    const projectConsultants = operationCard("project-consultants", {
      definitionId: "onr_v1_300_project-consultants",
      title: "Project Consultants",
      cost: 10,
      rulesText:
        "Add four advancement counters to any combination of installed cards that can be advanced.",
    });
    const action = corpAction(
      "install-burst-closeout-agenda",
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
        ownCredits: 10,
        ownClicks: 3,
        runnerCredits: 9,
        hq: [agenda, projectConsultants],
        servers: protectedCentralServers([remoteServer("remote_1", [])]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      scoreHorizon: "immediate",
      runnerCanContestNow: false,
      recommendedNextStep: "install_agenda",
    });
  });

  it("bounds visible in-turn advancement burst text to exact tokens", () => {
    const agenda = agendaCard("agenda-in-hq", {
      advancementRequirement: 3,
    });
    const counterfeitConsultants = operationCard("counterfeit-consultants", {
      title: "Counterfeit Consultants",
      cost: 10,
      rulesText:
        "Add four advancement counterfeits to any combination of installed cards.",
    });
    const action = corpAction(
      "install-noise-agenda",
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
        ownCredits: 10,
        ownClicks: 3,
        runnerCredits: 9,
        hq: [agenda, counterfeitConsultants],
        servers: protectedCentralServers([remoteServer("remote_1", [])]),
      }),
      action,
    );

    expect(assessment?.scoreHorizon).not.toBe("immediate");
  });

  it("treats unmodeled generic remote ice as temporary only when no breaker is installed", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "advance-generic-protected-agenda",
      "advance_card",
      {
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer(
            "remote_1",
            [genericIce("remote-protection-ice")],
            [agenda],
          ),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      runnerCanContestNow: false,
      recommendedNextStep: "advance",
    });
    expect(assessment?.evidence).toContain(
      "remote_access:unmodeled_ice_count:1",
    );
  });

  it("marks the same one-ice remote unsafe when visible coverage and credits can access it", () => {
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
        runnerCredits: 10,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
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

  it("counts visible recurring run credits as runner contest resources", () => {
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
        runnerCredits: 0,
        runnerRig: [simpleFracter("runner-fracter", 5)],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 3 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanContestNow: true,
    });
    expect(assessment?.evidence).toContain("visible_runner_contest_credits:5");
  });

  it("counts visible pre-run stored credit take actions before runner exposure", () => {
    const agenda = agendaCard("game-ending-agenda", {
      agendaPoints: 2,
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
        ownCredits: 5,
        runnerCredits: 10,
        runnerAgendaPoints: 5,
        runnerRig: [
          simpleFracter("runner-fracter"),
          brokerResource("broker", 6),
        ],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezzed: true, rezCost: 0 }),
            wallIce("remote-wall-2", { rezzed: true, rezCost: 0 }),
            wallIce("remote-wall-3", { rezzed: true, rezCost: 0 }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanReachAccessNow: false,
      runnerCanReachAccessBeforeScore: true,
      runnerCanContestBeforeScore: true,
      agendaStealSeverity: "game_ending",
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "visible_runner_exposure_contest_credits:18",
        "exposure_visible_runner_pre_run_credit_take_bonus:5",
      ]),
    );
  });

  it("marks non-immediate scorelines unsafe when runner can fund access before the next score chance", () => {
    const agenda = agendaCard("remote-agenda", {
      advancementCounters: 1,
      advancementRequirement: 4,
    });
    const action = corpAction(
      "advance-remote-agenda",
      "advance_card",
      {
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 2,
        runnerRig: [simpleFracter("runner-fracter")],
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
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      runnerCanContestNow: false,
      runnerCanContestBeforeScore: true,
      runnerCanReachAccessBeforeScore: true,
      agendaStealRelevantBeforeScore: true,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "runner_exposure_credit_actions:3",
        "visible_runner_contest_credits:2",
        "visible_runner_exposure_contest_credits:5",
      ]),
    );
  });

  it("uses definition-backed advancement requirements for runner exposure before score", () => {
    DEMO_CARDS_BY_ID[DEFINITION_BACKED_AGENDA_ID] = {
      id: DEFINITION_BACKED_AGENDA_ID,
      title: "Definition Backed Agenda",
      side: "corp",
      type: "agenda",
      subtypes: [],
      implementationStatus: "playable_mvp",
      advancementRequirement: 3,
      agendaPoints: 2,
      rulesText:
        "Synthetic agenda whose visible card omits advancementRequirement.",
      mechanics: ["agenda", "test_fixture"],
    } satisfies CardDefinition;
    const agenda = {
      ...agendaCard("definition-backed-agenda"),
      definitionId: DEFINITION_BACKED_AGENDA_ID,
      advancementRequirement: undefined,
      agendaPoints: undefined,
    } as unknown as VisibleCard;
    const action = corpAction(
      "install-definition-backed-agenda",
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
        runnerCredits: 2,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall", { rezzed: true, rezCost: 0 }),
          ]),
        ]),
      }),
      action,
    );

    expect(agenda.advancementRequirement).toBeUndefined();
    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      runnerCanReachAccessNow: false,
      runnerCanReachAccessBeforeScore: true,
      runnerCanContestBeforeScore: true,
      agendaPointsAtRisk: 2,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "runner_exposure_credit_actions:3",
        "visible_runner_contest_credits:2",
        "visible_runner_exposure_contest_credits:5",
        "agenda_points_at_risk:2",
      ]),
    );
  });

  it("marks delayed wall scorelines contestable when visible worm coverage can fund access before score", () => {
    const agenda = agendaCard("remote-classic-agenda", {
      advancementCounters: 1,
      advancementRequirement: 4,
    });
    const action = corpAction(
      "advance-classic-wall-agenda",
      "advance_card",
      {
        serverId: "remote_1",
      },
      agenda.instanceId,
    );

    const assessment = assess(
      corpInput({
        ownCredits: 5,
        runnerCredits: 0,
        runnerRig: [earlyWormBreaker("runner-worm")],
        servers: protectedCentralServers([
          remoteServer(
            "remote_1",
            [
              classicWallIce("remote-classic-wall", {
                rezzed: true,
                rezCost: 0,
              }),
            ],
            [agenda],
          ),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: false,
      runnerCanReachAccessNow: false,
      runnerCanReachAccessBeforeScore: true,
      runnerCanContestBeforeScore: true,
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "runner_exposure_credit_actions:3",
        "visible_runner_exposure_contest_credits:3",
        "exposure_remote_access:visible_break_cost:3",
      ]),
    );
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

function assess(input: AiDecisionInput, action: LegalAction) {
  return semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    testDependencies(),
  );
}

function corpInput(overrides: {
  ownCredits?: number;
  ownClicks?: number;
  runnerCredits?: number;
  runnerAgendaPoints?: number;
  agendaPointsToWin?: number;
  runnerRig?: VisibleCard[];
  hq?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
  servers: AiDecisionInput["playerView"]["servers"];
}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    eventTail: overrides.eventTail ?? [],
    playerView: {
      own: {
        credits: overrides.ownCredits ?? 5,
        clicks: overrides.ownClicks ?? 3,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        scoreArea: [],
      },
      opponent: {
        credits: overrides.runnerCredits ?? 4,
        clicks: 4,
        agendaPoints: overrides.runnerAgendaPoints ?? 0,
        rig: overrides.runnerRig ?? [],
        scoreArea: [],
      },
      servers: overrides.servers,
      publicEvents: [],
      agendaPointsToWin: overrides.agendaPointsToWin ?? 7,
    },
  } as unknown as AiDecisionInput;
}

function publicEvent(
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

function publicLabelEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverLabel: "HQ" | "R&D",
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
      serverLabel,
    },
  };
}

function protectedCentralServers(
  remotes: AiDecisionInput["playerView"]["servers"],
): AiDecisionInput["playerView"]["servers"] {
  return [
    centralServer("hq", [centralIce("hq-ice")]),
    centralServer("rd", [centralIce("rd-ice")]),
    ...remotes,
  ];
}

function centralServer(
  id: "hq" | "rd",
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return server(id, ice, []);
}

function remoteServer(
  id: string,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return server(id, ice, root);
}

function server(
  id: string,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id: id as AiDecisionInput["playerView"]["servers"][number]["id"],
    label: id,
    ice: [...ice],
    root: [...root],
  };
}

function agendaCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "agenda",
    advancementRequirement: 3,
    advancementCounters: 0,
    agendaPoints: 2,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

function operationCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "operation",
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

function wallIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "simple_barrier_ice",
    subtypes: ["Barrier"],
    rezzed: false,
    rezCost: 3,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

function classicWallIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Crystal Wall",
    definitionId: "onr_v1_232_crystal-wall",
    subtypes: ["Wall"],
    rezzed: false,
    rezCost: 4,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

function centralIce(instanceId: string): VisibleCard {
  return wallIce(instanceId, { rezCost: 1 });
}

function genericIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: instanceId,
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

function blankIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "blank_remote_ice",
    rezzed: false,
    rezCost: 0,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "blank_remote_ice",
      effectiveStrength: 0,
      subroutines: [],
    },
    ...overrides,
  } as unknown as VisibleCard;
}

function hunterTraceTagIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Hunter",
    definitionId: "onr_v1_249_hunter",
    subtypes: ["Sentry", "Bloodhound"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          amount: 5,
        },
      ],
    },
    ...overrides,
  } as unknown as VisibleCard;
}

function dogPileIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "onr_proteus_021_dog-pile",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

function bugZapperIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Bug Zapper",
    definitionId: "onr_proteus_012_bug-zapper",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

function mastermindIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Mastermind",
    definitionId: "onr_proteus_030_mastermind",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

function huntingPackIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Hunting Pack",
    definitionId: "onr_proteus_026_hunting-pack",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 1,
    owner: "corp",
  } as VisibleCard;
}

function mobileBarricadeIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Mobile Barricade",
    definitionId: "onr_proteus_033_mobile-barricade",
    subtypes: ["Barrier"],
    rezzed: false,
    rezCost: 1,
    owner: "corp",
  } as VisibleCard;
}

function simpleFracter(
  instanceId: string,
  recurringRunCredits = 0,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    definitionId: "simple_fracter",
    subtypes: ["Icebreaker", "Fracter"],
    owner: "runner",
    ...(recurringRunCredits > 0
      ? {
          counterDisplays: [
            {
              id: `${instanceId}-recurring`,
              amount: recurringRunCredits,
              displayKind: "recurring_credit",
              label: "Recurring credits",
              ariaLabel: "Recurring credits",
              counterType: "recurring_credit",
              creditPool: {
                kind: "recurring_credit",
                uses: ["using_icebreaker_during_run"],
              },
            },
          ],
        }
      : {}),
  } as VisibleCard;
}

function earlyWormBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    title: "Early Worm",
    definitionId: "onr_classic_027_early-worm",
    subtypes: ["Icebreaker", "Worm"],
    owner: "runner",
  } as VisibleCard;
}

function simpleKiller(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    definitionId: "simple_killer",
    subtypes: ["Icebreaker", "Killer"],
    owner: "runner",
  } as VisibleCard;
}

function brokerResource(
  instanceId: string,
  hostedCredits: number,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "resource",
    title: "Broker",
    definitionId: "onr_v1_154_broker",
    rulesText:
      "A: Put 3 credits from the bank on Broker. A: Take all the bits from Broker.",
    owner: "runner",
    counterDisplays: [
      {
        id: `${instanceId}-bits`,
        amount: hostedCredits,
        displayKind: "stored_credits",
        label: "Bits",
        ariaLabel: "Bits",
        counterType: "bit",
      },
    ],
  } as VisibleCard;
}

function runnerCentralPressureCard(
  instanceId: string,
  rulesText: string,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    title: instanceId,
    definitionId: instanceId,
    rulesText,
    owner: "runner",
  } as VisibleCard;
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"],
  source = "basic_action",
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    source,
    payload,
  } as unknown as LegalAction;
}

function testDependencies() {
  return {
    actionServerId: (_input: AiDecisionInput, action: LegalAction) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    server: (input: AiDecisionInput, serverId: string | undefined) =>
      input.playerView.servers.find((candidate) => candidate.id === serverId),
    actionCreditCost: () => 0,
    actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => {
      const source = findVisibleCard(input, String(action.source));
      return source?.type === "agenda" || action.payload?.cardType === "agenda";
    },
    advanceCompletesScore: (input: AiDecisionInput, action: LegalAction) => {
      if (action.type !== "advance_card") return false;
      const source = findVisibleCard(input, String(action.source));
      return (
        source?.type === "agenda" &&
        typeof source.advancementRequirement === "number" &&
        (source.advancementCounters ?? 0) + 1 >= source.advancementRequirement
      );
    },
    remoteHasScoreLine: (
      server: AiDecisionInput["playerView"]["servers"][number] | undefined,
    ) =>
      server?.root.some(
        (card) =>
          (card.known && card.type === "agenda") ||
          (card.advancementCounters ?? 0) > 0,
      ) === true,
    isRemoteServerTarget: (serverId: string | undefined) =>
      serverId?.startsWith("remote_") === true,
    visibleIceRezCost: (card: VisibleCard) => card.rezCost,
    actionSourceCard: (input: AiDecisionInput, action: LegalAction) =>
      findVisibleCard(input, String(action.source)),
  };
}

function findVisibleCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  for (const card of input.playerView.own.gripOrHq) {
    if (card.instanceId === instanceId) return card;
  }
  for (const server of input.playerView.servers) {
    for (const card of [...server.ice, ...server.root]) {
      if (card.instanceId === instanceId) return card;
    }
  }
  return undefined;
}

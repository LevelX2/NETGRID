import {
  type ResolvedCardDefinition,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

const testDefinitionAuthority = vi.hoisted(() => ({
  byId: {} as Record<string, ResolvedCardDefinition>,
}));

vi.mock("../card-definition-compatibility", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../card-definition-compatibility")>();
  Object.assign(testDefinitionAuthority.byId, actual.CARD_DEFINITIONS_BY_ID);
  return {
    ...actual,
    CARD_DEFINITIONS_BY_ID: testDefinitionAuthority.byId,
  };
});

import { semanticRuntimeCorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
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
} from "./semantic-runtime-corp-scoring-window.test-support";

const DEFINITION_BACKED_AGENDA_ID =
  "test_definition_backed_score_window_agenda";

describe("semanticRuntimeCorpScoringWindowAssessment", () => {
  afterEach(() => {
    delete testDefinitionAuthority.byId[DEFINITION_BACKED_AGENDA_ID];
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
      missingVisibleBreakerCoverage: false,
      corpCanRezRelevantIce: false,
      runnerCanContestBeforeScore: true,
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

  it("keeps delayed one-ice agenda installs temporary-safe when rich runner credits lack coverage", () => {
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
      windowKind: "temporary_safe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: true,
      runnerCanContestBeforeScore: false,
      recommendedNextStep: "install_agenda",
    });
    expect(assessment?.evidence).toContain("delayed_score_exposure_risk:false");
  });

  it("projects visible repeatable action economy across the runner exposure window", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-agenda-against-action-economy",
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
        runnerRig: [
          simpleFracter("runner-fracter"),
          newsgroupFilter("runner-action-economy"),
        ],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall", { rezzed: true })]),
        ]),
      }),
      action,
    );

    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "runner_exposure_credit_actions:3",
        "runner_exposure_credits:6",
        "visible_runner_exposure_contest_credits:6",
      ]),
    );
    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      recommendedNextStep: "build_remote_ice",
    });
  });

  it("keeps an observed successful remote access authoritative for an unchanged rezzed path", () => {
    const agenda = agendaCard("game-ending-agenda", { agendaPoints: 3 });
    const action = corpAction(
      "install-after-observed-remote-access",
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
        runnerCredits: 0,
        runnerAgendaPoints: 5,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [agenda],
        eventTail: [
          remoteEvent("evt-remote-access", "access_card", 20, {
            actor: "runner",
            serverLabel: "Remote 1",
          }),
        ],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezzed: true }),
            wallIce("remote-wall-2", { rezzed: true }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanReachAccessBeforeScore: true,
      agendaStealRelevantBeforeScore: true,
      agendaStealSeverity: "game_ending",
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toContain(
      "exposure_corp_remote_observed_reachability:true",
    );
  });

  it("invalidates observed remote reachability after new ICE changes the path", () => {
    const agenda = agendaCard("agenda-in-hq");
    const action = corpAction(
      "install-after-remote-path-change",
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
        ownCredits: 8,
        runnerCredits: 0,
        runnerRig: [simpleFracter("runner-fracter")],
        hq: [agenda],
        eventTail: [
          remoteEvent("evt-remote-access", "access_card", 20, {
            actor: "runner",
            serverLabel: "Remote 1",
          }),
          remoteEvent("evt-new-remote-ice", "install_card", 24, {
            actor: "corp",
            serverLabel: "Remote 1",
            installPlacement: "ice",
          }),
        ],
        servers: protectedCentralServers([
          remoteServer("remote_1", [
            wallIce("remote-wall-1", { rezzed: true }),
            wallIce("remote-wall-2", { rezzed: true }),
            wallIce("new-remote-wall", { rezzed: true }),
          ]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      runnerCanReachAccessBeforeScore: false,
      agendaStealRelevantBeforeScore: false,
    });
    expect(assessment?.evidence).toContain(
      "exposure_corp_remote_observed_reachability_invalidated:install_card",
    );
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

  it("does not charge a click for scoring after a visible two-counter burst", () => {
    const agenda = agendaCard("project-zurich", {
      definitionId: "onr_proteus_008_project-zurich",
      advancementRequirement: 3,
    });
    const systematicLayoffs = operationCard("systematic-layoffs", {
      definitionId: "onr_v1_304_systematic-layoffs",
      title: "Systematic Layoffs",
      cost: 5,
      rulesText:
        "Add two advancement counters to any combination of installed cards that can be advanced.",
    });
    const action = corpAction(
      "install-systematic-closeout-agenda",
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
        ownCredits: 9,
        ownClicks: 3,
        runnerCredits: 9,
        hq: [agenda, systematicLayoffs],
        servers: protectedCentralServers([remoteServer("remote_1", [])]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "durable",
      scoreHorizon: "immediate",
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

  it("fails closed when generic remote ICE has no Engine post-rez quote", () => {
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
      windowKind: "unsafe",
      runnerCanContestNow: true,
      recommendedNextStep: "gain_credit",
    });
    expect(assessment?.evidence).toContain(
      "post_rez_remote_access:unmodeled_ice_count:1",
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
    testDefinitionAuthority.byId[DEFINITION_BACKED_AGENDA_ID] = {
      id: DEFINITION_BACKED_AGENDA_ID,
      title: "Definition Backed Agenda",
      side: "corp",
      type: "agenda",
      playCost: null,
      subtypes: [],
      implementationStatus: "playable_mvp",
      advancementRequirement: 3,
      agendaPoints: 2,
      numeric: {
        cost: null,
        installCost: null,
        memoryCost: null,
        strength: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 3,
        agendaPoints: 2,
      },
      strengthModel: { kind: "not_applicable" },
      rulesText:
        "Synthetic agenda whose visible card omits advancementRequirement.",
      mechanics: ["agenda", "test_fixture"],
    };
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
});

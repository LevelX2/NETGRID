import { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import {
  scoringWindowAccessAssessment,
  scoringWindowPostRezProtectionAssessment,
} from "./semantic-runtime-corp-scoring-window-runner-pressure";
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

describe("semanticRuntimeCorpScoringWindowAssessment protection", () => {
  it("separates current access from Engine-certified fixed post-rez protection", () => {
    const input = corpInput({
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer("remote_1", [wallIce("remote-fixed-wall")]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(scoringWindowAccessAssessment(input, remote)).toMatchObject({
      runnerCanReachAccessNow: true,
      effectiveIceCount: 0,
    });
    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: false,
      effectiveIceCount: 1,
      missingVisibleBreakerCoverage: true,
      unmodeledIceCount: 0,
    });
  });

  it("does not turn an incomplete post-rez quote into hypothetical protection", () => {
    const {
      effectiveRunQuote: _currentStateQuote,
      ...dynamicIceWithoutCurrentQuote
    } = wallIce("remote-dynamic-wall");
    const dynamicIce: VisibleCard = {
      ...dynamicIceWithoutCurrentQuote,
      effectivePostRezRunQuote: {
        context: "installed_post_rez",
        cardId: "remote-dynamic-wall",
        iceDefinitionId: "simple_barrier_ice",
        targetServerId: "remote_1",
        projectedServerId: "remote_1",
        expiresAtStateVersion: 1,
        complete: false,
        reason: "variable_rez_choice_required",
      },
    };
    const input = corpInput({
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer("remote_1", [dynamicIce]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: true,
      effectiveIceCount: 0,
      unmodeledIceCount: 1,
    });
  });

  it("does not spend projected rez budget on inert ICE or activate an unaffordable ETR", () => {
    const input = corpInput({
      ownCredits: 2,
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer("remote_1", [
          blankIce("cheap-inert-ice", { rezCost: 0 }),
          wallIce("unaffordable-etr", { rezCost: 5 }),
        ]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: true,
      effectiveIceCount: 0,
      unmodeledIceCount: 0,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:unfunded:unaffordable-etr",
        "corp_post_rez_budget:financed_ice_count:0",
      ]),
    });
  });

  it("activates only the jointly financeable ICE subset in encounter order", () => {
    const input = corpInput({
      ownCredits: 4,
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer("remote_1", [
          wallIce("inner-wall", { rezCost: 3 }),
          wallIce("outer-wall", { rezCost: 3 }),
        ]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: false,
      effectiveIceCount: 1,
      unmodeledIceCount: 0,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:financed:outer-wall",
        "corp_post_rez_budget:not_selected:inner-wall",
        "corp_post_rez_budget:selection:exact_subset",
        "corp_post_rez_budget:financed_ice_count:1",
      ]),
    });
  });

  it("selects a cheaper blocking inner ICE over an expensive reachable outer ICE", () => {
    const input = corpInput({
      ownCredits: 4,
      runnerCredits: 5,
      runnerRig: [simpleKiller("runner-killer")],
      servers: protectedCentralServers([
        remoteServer("remote_1", [
          wallIce("inner-blocking-wall", { rezCost: 2 }),
          hunterTraceTagIce("outer-reachable-trace", { rezCost: 4 }),
        ]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: false,
      effectiveIceCount: 1,
      unmodeledIceCount: 0,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:selection:exact_subset",
        "corp_post_rez_budget:financed:inner-blocking-wall",
        "corp_post_rez_budget:not_selected:outer-reachable-trace",
        "corp_post_rez_budget:financed_ice_count:1",
        "corp_post_rez_budget:remaining:2",
      ]),
    });
  });

  it("fails closed instead of partially activating more than twelve rez candidates", () => {
    const input = corpInput({
      ownCredits: 100,
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer(
          "remote_1",
          Array.from({ length: 13 }, (_, index) =>
            wallIce(`exact-subset-wall-${index}`, { rezCost: 1 }),
          ),
        ),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    const assessment = scoringWindowPostRezProtectionAssessment(input, remote);

    expect(assessment).toMatchObject({
      runnerCanReachAccessNow: true,
      effectiveIceCount: 0,
      unmodeledIceCount: 13,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:selection:exact_subset",
        "corp_post_rez_budget:selection_incomplete:search_space_exceeded",
        "corp_post_rez_budget:maximum_exact_candidates:12",
        "corp_post_rez_budget:candidate_count:13",
        "corp_post_rez_budget:financed_ice_count:0",
      ]),
    });
    expect(assessment.evidence).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^corp_post_rez_budget:financed:/),
      ]),
    );
  });

  it("keeps current rezzed ICE active without consuming post-rez budget", () => {
    const input = corpInput({
      ownCredits: 0,
      runnerCredits: 5,
      servers: protectedCentralServers([
        remoteServer("remote_1", [
          wallIce("already-rezzed-wall", { rezzed: true, rezCost: 5 }),
        ]),
      ]),
    });
    const remote = input.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(
      scoringWindowPostRezProtectionAssessment(input, remote),
    ).toMatchObject({
      runnerCanReachAccessNow: false,
      effectiveIceCount: 1,
      unmodeledIceCount: 0,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:financed_ice_count:0",
      ]),
    });
  });

  it("does not count unaffordable central ICE as post-rez protection", () => {
    const input = corpInput({
      ownCredits: 1,
      runnerCredits: 5,
      servers: [
        centralServer("hq", [wallIce("unaffordable-hq-wall", { rezCost: 4 })]),
        centralServer("rd", []),
      ],
    });
    const hq = input.playerView.servers.find(
      (candidate) => candidate.id === "hq",
    );

    expect(scoringWindowPostRezProtectionAssessment(input, hq)).toMatchObject({
      runnerCanReachAccessNow: true,
      effectiveIceCount: 0,
      unmodeledIceCount: 0,
      evidence: expect.arrayContaining([
        "corp_post_rez_budget:unfunded:unaffordable-hq-wall",
      ]),
    });
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
      windowKind: "none",
      runnerCanContestBeforeScore: false,
      recommendedNextStep: "none",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_rez_budget:knowledge:unknown",
        "remote_rez_budget:unknown_installed_rez_quote:second-remote-wall",
      ]),
    );
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

  it("keeps agenda-heavy HQ pressure active behind unaffordable ICE", () => {
    const agenda = agendaCard("agenda-behind-unaffordable-hq-ice");
    const action = corpAction(
      "install-agenda-behind-unaffordable-hq-ice",
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
        runnerCredits: 5,
        hq: [agenda],
        servers: [
          centralServer("hq", [
            wallIce("unaffordable-hq-wall", { rezCost: 4 }),
          ]),
          centralServer("rd", []),
          remoteServer("remote_1", [wallIce("remote-wall", { rezCost: 1 })]),
        ],
      }),
      action,
    );

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

  it("keeps a delayed scoreline temporary-safe when rich runner credits lack visible coverage", () => {
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
          remoteServer("remote_1", [wallIce("remote-wall-1", { rezCost: 2 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "temporary_safe",
      scoreHorizon: "next_turn",
      missingVisibleBreakerCoverage: true,
      affordableDurableRelevantIceCount: 1,
      recommendedNextStep: "install_agenda",
    });
    expect(assessment?.evidence).toContain("delayed_score_exposure_risk:false");
  });

  it("keeps a delayed scoreline unsafe when visible breaker coverage can contest", () => {
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
        runnerRig: [simpleFracter("visible-runner-fracter")],
        hq: [agenda],
        servers: protectedCentralServers([
          remoteServer("remote_1", [wallIce("remote-wall-1", { rezCost: 2 })]),
        ]),
      }),
      action,
    );

    expect(assessment).toMatchObject({
      windowKind: "unsafe",
      runnerCanContestBeforeScore: true,
      runnerCanReachAccessBeforeScore: true,
      recommendedNextStep: "none",
    });
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

  it("fails closed for solo position-scaling ICE without a post-rez quote", () => {
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
      windowKind: "unsafe",
      corpCanRezRelevantIce: false,
    });
    expect(assessment?.windowKind).not.toBe("durable");
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_relevant_ice_count:0",
        "remote_durable_relevant_ice_count:0",
        "remote_weak_position_scaling_ice_count:0",
        "post_rez_remote_access:unmodeled_ice_count:1",
      ]),
    );
  });

  it("does not infer dynamic protection from Bug Zapper and Mastermind definitions", () => {
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
      windowKind: "unsafe",
      affordableDurableRelevantIceCount: 0,
      dynamicProtectionWeaknessCount: 0,
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
      windowKind: "none",
      recommendedNextStep: "none",
      affordableDurableRelevantIceCount: 0,
      dynamicProtectionWeaknessCount: 0,
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_rez_budget:knowledge:unknown",
        "remote_rez_budget:unknown_installed_rez_quote:static-remote-wall",
      ]),
    );
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
      windowKind: "none",
      recommendedNextStep: "none",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "remote_rez_budget:knowledge:unknown",
        "remote_rez_budget:unknown_installed_rez_quote:second-remote-wall",
      ]),
    );
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
      runnerCanContestBeforeScore: true,
      agendaPointsAtRisk: 3,
      runnerAgendaPointsAfterSteal: 7,
      agendaStealSeverity: "game_ending",
      recommendedNextStep: "build_remote_ice",
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "agenda_steal_severity:game_ending",
        "remote_dynamic_protection_weakness_count:0",
        "remote_dynamic_protection_reserve:0",
        "post_rez_remote_access:unmodeled_ice_count:2",
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

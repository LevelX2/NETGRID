import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

describe("semanticRuntimeCorpScoringWindowAssessment", () => {
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
  runnerCredits?: number;
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
        clicks: 3,
        gripOrHq: overrides.hq ?? [],
      },
      opponent: {
        credits: overrides.runnerCredits ?? 4,
        rig: overrides.runnerRig ?? [],
      },
      servers: overrides.servers,
      publicEvents: [],
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

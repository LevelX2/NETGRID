import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  createSemanticRuntimeCorpCentralRezContext,
} from "./semantic-runtime-corp-central-rez-context";

describe("createSemanticRuntimeCorpCentralRezContext", () => {
  it("flags R&D rez funding need when visible central pressure meets unrezzed ICE", () => {
    const context = testContext();
    const input = corpInput({
      credits: 2,
      events: rdPressureEvents(),
      servers: [
        server("hq"),
        server("rd", [corpCard("rd-ice", "ice", { rezzed: false, rezCost: 3 })]),
        server("archives"),
      ],
    });

    expect(context.semanticRuntimeCorpHasCentralRezFloorFundingNeed(input)).toBe(
      true,
    );
  });

  it("does not create R&D funding bias without visible central pressure", () => {
    const context = testContext();
    const input = corpInput({
      credits: 2,
      servers: [
        server("hq"),
        server("rd", [corpCard("rd-ice", "ice", { rezzed: false, rezCost: 3 })]),
        server("archives"),
      ],
    });

    expect(context.semanticRuntimeCorpHasCentralRezFloorFundingNeed(input)).toBe(
      false,
    );
  });

  it("counts label-only central pressure events", () => {
    const context = testContext();
    const input = corpInput({
      credits: 2,
      events: [
        publicEvent("label-rd-run", "start_run", 1, {
          actor: "runner",
          actionType: "start_run",
          serverLabel: "R&D",
        }),
        publicEvent("label-rd-access", "access_card", 2, {
          actor: "runner",
          actionType: "access_card",
          serverLabel: "R&D",
        }),
      ],
      servers: [
        server("hq"),
        server("rd", [corpCard("rd-ice", "ice", { rezzed: false, rezCost: 3 })]),
        server("archives"),
      ],
    });

    expect(context.semanticRuntimeCorpHasCentralRezFloorFundingNeed(input)).toBe(
      true,
    );
  });

  it("treats visible R&D Interface as R&D pressure before the next run", () => {
    const context = testContext();
    const input = corpInput({
      credits: 2,
      runnerRig: [
        runnerCard("rd-interface", "hardware", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
        }),
      ],
      servers: [
        server("hq"),
        server("rd", [corpCard("rd-ice", "ice", { rezzed: false, rezCost: 3 })]),
        server("archives"),
      ],
    });

    expect(context.semanticRuntimeCorpHasCentralRezFloorFundingNeed(input)).toBe(
      true,
    );
  });

  it("penalizes R&D ICE installs that cannot be rezzed under R&D pressure", () => {
    const ice = corpCard("new-rd-ice", "ice", { rezCost: 4 });
    const action = installIceAction(ice, "rd");
    const context = testContext();
    const assessment = context.semanticRuntimeCorpCentralRezReserveAssessment(
      corpInput({
        credits: 2,
        gripOrHq: [ice],
        events: rdPressureEvents(),
      }),
      action,
    );

    expect(assessment).toEqual(
      expect.objectContaining({
        serverId: "rd",
        rezFloor: 4,
        creditsAfterAction: 2,
        blockedByFloor: true,
      }),
    );
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "corp_central_pressure_server:rd",
        "corp_central_pressure_active:true",
        "central_rez_reserve_below_floor:true",
      ]),
    );
  });
});

function testContext() {
  return createSemanticRuntimeCorpCentralRezContext({
    actionCreditCost: () => 0,
    actionServerId: (_input, action) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    actionSourceCard: (input, action) =>
      input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === action.source,
      ),
    sourceDefinitionIdForAction: (input, action) =>
      input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === action.source,
      )?.definitionId,
  });
}

function corpInput(options: {
  credits?: number;
  gripOrHq?: VisibleCard[];
  runnerRig?: VisibleCard[];
  servers?: PlayerView["servers"];
  events?: PublicGameEvent[];
} = {}): AiDecisionInput {
  const events = options.events ?? [];
  return {
    side: "corp",
    legalActions: [],
    eventTail: events,
    playerView: {
      side: "corp",
      own: {
        credits: options.credits ?? 4,
        gripOrHq: options.gripOrHq ?? [],
      },
      opponent: {
        credits: 4,
        rig: options.runnerRig ?? [],
      },
      servers: options.servers ?? [
        server("hq"),
        server("rd"),
        server("archives"),
      ],
      publicEvents: events,
    },
  } as unknown as AiDecisionInput;
}

function rdPressureEvents(): PublicGameEvent[] {
  return [
    publicEvent("rd-run-1", "start_run", 1, {
      actor: "runner",
      actionType: "start_run",
      serverId: "rd",
    }),
    publicEvent("rd-access-1", "access_card", 2, {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
    }),
  ];
}

function publicEvent(
  eventId: string,
  type: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `hash:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function corpCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: "corp",
    controller: "corp",
    type,
    known: true,
    ...overrides,
  };
}

function runnerCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: "runner",
    controller: "runner",
    type,
    known: true,
    ...overrides,
  };
}

function installIceAction(
  ice: VisibleCard,
  serverId: "hq" | "rd",
): LegalAction {
  return {
    actionId: `install-${serverId}-ice`,
    side: "corp",
    type: "install_card",
    label: "Install central ICE",
    source: ice.instanceId,
    costs: [],
    payload: {
      placement: "ice",
      serverId,
    },
  } as unknown as LegalAction;
}

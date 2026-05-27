import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicContextForAction } from "../../public-context";
import { buildEventWithHost } from "./build-event";
import {
  createEventContextHostComposition,
  type EventContextHostCompositionHost,
} from "./event-context-hosts";

const BREAKER_ID = "breaker_1" as CardInstanceId;

function state(): GameState {
  return {
    matchId: "match_1",
    stateVersion: 1,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 1,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [BREAKER_ID], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {
      [BREAKER_ID]: {
        id: BREAKER_ID,
        definitionId: "breaker_definition",
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig", section: "programs" },
        faceup: true,
        rezzed: true,
        strengthModifier: 0,
      },
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function legalAction(type: LegalAction["type"] = "pump_breaker"): LegalAction {
  return {
    actionId: `test.${type}`,
    type,
    label: type,
    side: "runner",
    source: "game_rule",
    stateVersion: 1,
    timingPoint: "run.encounter",
    costs: [],
    payload: { breakerId: BREAKER_ID },
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  } as unknown as LegalAction;
}

function hostFor(): EventContextHostCompositionHost {
  return {
    cards: {
      agendaPointsForScoredCard: () => 2,
      cardCounter: () => 0,
      definitionFor: () =>
        ({
          id: "breaker_definition",
          title: "Breaker",
          side: "runner",
          type: "program",
          strength: 2,
        }) as CardDefinition,
      hostedProgramStrengthModifier: () => 4,
      mustInstance: (instances, cardId) => {
        const instance = instances[cardId];
        if (!instance) throw new Error("missing instance");
        return instance;
      },
    },
    publicContext: {
      creditCostForAction: () => 3,
      pumpAmountForLegalAction: () => 1,
    },
    callbacks: {
      breachStateHost: (targetState) => ({ state: targetState }) as never,
      installedAccessBonusForServer: () => 0,
      runnerHqAccessBonusForBreach: () => 0,
    },
    constants: {
      badPublicityLossThreshold: 7,
    },
  };
}

describe("event-context-hosts", () => {
  it("does not import from index or contain public payload field logic", () => {
    const source = readFileSync(
      new URL("./event-context-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("sourceDefinitionId");
    expect(source).not.toContain("privatePayload");
  });

  it("creates PublicContext deps and a BuildEventHost that uses them", () => {
    const composition = createEventContextHostComposition(hostFor());
    const currentState = state();
    const action = legalAction();

    expect(composition.buildEventHost.publicContext.publicContextForAction).toBe(
      publicContextForAction,
    );
    expect(composition.buildEventHost.publicContext.deps).toBe(
      composition.publicContextDeps,
    );

    const context =
      composition.buildEventHost.publicContext.publicContextForAction(
        currentState,
        action,
        composition.buildEventHost.publicContext.deps,
      );

    expect(context).toMatchObject({
      pumpBreakerCreditCost: 3,
      pumpStrengthAmount: 1,
      breakerStrengthAfter: 6,
    });
  });

  it("keeps BuildEvent constants wired without rebuilding event payloads", () => {
    const currentState = state();
    const previousState = {
      ...currentState,
      corp: { ...currentState.corp, badPublicity: 6 },
    } as GameState;
    const afterState = {
      ...currentState,
      gameEndReason: "bad_publicity_7",
      corp: { ...currentState.corp, badPublicity: 7 },
    } as GameState;
    const action = legalAction("gain_credit");
    const composition = createEventContextHostComposition(hostFor());

    const event = buildEventWithHost(
      composition.buildEventHost,
      1,
      2,
      "hash_after",
      previousState,
      afterState,
      action,
      {
        actionId: action.actionId,
        side: "runner",
        matchId: "match_1",
        clientKnownStateVersion: 1,
      },
    );

    expect(event.publicPayload.badPublicityThreshold).toBe(7);
    expect(event.publicPayload.corpBadPublicityBefore).toBe(6);
    expect(event.publicPayload.corpBadPublicityAfter).toBe(7);
  });

  it("fails clearly when a required host group is missing", () => {
    expect(() =>
      createEventContextHostComposition({
        ...hostFor(),
        cards: undefined,
      } as unknown as EventContextHostCompositionHost),
    ).toThrow("EventContextHostCompositionHost.cards ist erforderlich.");
  });
});

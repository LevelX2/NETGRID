import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { eventVisibilityForAction } from "./game/events/build-event";
import { publicContextForAction } from "./public-context";

describe("publicContextForAction", () => {
  it("publishes the structured server id for start-run history", () => {
    const state = {
      run: { attackedServerId: "rd", accessCount: 1 },
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "start_run",
      payload: { serverId: "rd" },
    } as unknown as LegalAction;

    expect(
      publicContextForAction(state, action, {
        agendaPointsForScoredCard: () => 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () => {
          throw new Error("not needed");
        },
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      }),
    ).toMatchObject({
      serverId: "rd",
    });
  });

  it("forwards Corp install placement without exposing hidden card identity", () => {
    const state = {
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "corp",
      type: "install_card",
      source: "hidden_ice",
      payload: {
        cardId: "hidden_ice",
        serverId: "remote_1",
        placement: "ice",
      },
    } as unknown as LegalAction;

    const context = publicContextForAction(state, action, {
      agendaPointsForScoredCard: () => 0,
      cardCounter: () => 0,
      cardStrengthModifier: () => 0,
      creditCostForAction: () => 0,
      definitionFor: () => {
        throw new Error("hidden install identity must not be read");
      },
      pumpAmountForLegalAction: () => 0,
      runnerHqAccessBonus: () => 0,
      v1915InstalledAccessBonus: () => 0,
    });

    expect(context).toMatchObject({
      installPlacement: "ice",
      zoneLabel: "ICE",
    });
    expect(context).not.toHaveProperty("cardDefinitionId");
    expect(context).not.toHaveProperty("title");
  });

  it("forwards access index and Highlighter access context", () => {
    const state = {
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      type: "access_card",
      payload: {
        accessIndex: 1,
        baseAccessCount: 1,
        installedAccessBonus: 2,
        effectiveAccessCount: 3,
        highlighterCounterCount: 3,
        highlighterAccessBonus: 2,
      },
    } as unknown as LegalAction;

    expect(
      publicContextForAction(state, action, {
        agendaPointsForScoredCard: () => 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () => {
          throw new Error("not needed");
        },
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      }),
    ).toMatchObject({
      accessIndex: 1,
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
      highlighterCounterCount: 3,
      highlighterAccessBonus: 2,
    });
  });

  it("publishes a paid Classic Deflector redirect without ICE instance details", () => {
    const state = {
      corp: {
        servers: [
          {
            id: "remote_1",
            kind: "remote",
            label: "Remote 1",
            ice: ["outer_rezzed_ice"],
            root: [],
          },
        ],
      },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "corp",
      type: "resolve_choice",
      payload: {
        choiceVisibility: "public",
        classicDeflector: true,
        sourceDefinitionId: "onr_classic_010_entrapment",
        deflectedRun: true,
        redirectedServerId: "remote_1",
        redirectedToIceId: "outer_rezzed_ice",
        redirectedToRezzedIce: true,
        lastPassedIceId: "hidden_inner_ice",
        paidCredits: 2,
        corpCreditsAfter: 3,
      },
    } as unknown as LegalAction;

    const context = publicContextForAction(state, action, {
      agendaPointsForScoredCard: () => 0,
      cardCounter: () => 0,
      cardStrengthModifier: () => 0,
      creditCostForAction: () => 0,
      definitionFor: () => {
        throw new Error("not needed");
      },
      pumpAmountForLegalAction: () => 0,
      runnerHqAccessBonus: () => 0,
      v1915InstalledAccessBonus: () => 0,
    });

    expect(context).toMatchObject({
      classicDeflector: true,
      sourceDefinitionId: "onr_classic_010_entrapment",
      deflectedRun: true,
      selectedServerId: "remote_1",
      selectedServerLabel: "Remote 1",
      redirectedToRezzedIce: true,
      paidCredits: 2,
      corpCreditsAfter: 3,
    });
    expect(context).not.toHaveProperty("redirectedToIceId");
    expect(context).not.toHaveProperty("lastPassedIceId");
    expect(eventVisibilityForAction(action)).toBe("public");
  });
});

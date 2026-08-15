import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { eventVisibilityForAction } from "./game/events/build-event";
import {
  publicContextForAction,
  publicInstalledPositionContext,
} from "./public-context";

describe("publicContextForAction", () => {
  it("redacts Blind Trace bids and payment sources until both sides commit", () => {
    const state = {
      traceRulesProfile: "classic_blind",
      trace: {
        traceRulesProfile: "classic_blind",
        corpBid: 2,
        bidsRevealed: false,
      },
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "corp",
      type: "resolve_choice",
      payload: {
        traceId: "trace_hidden",
        traceStep: "corp_bid",
        traceLimit: 3,
        effectiveTraceLimit: 3,
        corpBid: 2,
        traceValue: 2,
        corpCreditBid: 1,
        recurringTraceCreditPoolSpent: 1,
        temporaryTraceCreditsSourceDefinitionId: "secret_trace_pool",
      },
    } as unknown as LegalAction;

    const context = publicContextForAction(state, action, traceTestDeps());

    expect(context).toMatchObject({
      traceRulesProfile: "classic_blind",
      traceBidsRevealed: false,
      traceBidCommittedSide: "corp",
      traceId: "trace_hidden",
      traceLimit: 3,
    });
    expect(context).not.toHaveProperty("corpBid");
    expect(context).not.toHaveProperty("traceValue");
    expect(context).not.toHaveProperty("corpCreditBid");
    expect(context).not.toHaveProperty("recurringTraceCreditPoolSpent");
    expect(JSON.stringify(context)).not.toContain("secret_trace_pool");
  });

  it("publishes both Blind Trace bids after the common reveal", () => {
    const state = {
      traceRulesProfile: "classic_blind_corp_ties",
      trace: {
        traceRulesProfile: "classic_blind_corp_ties",
        corpBid: 2,
        runnerBid: 1,
        runnerStrength: 2,
        bidsRevealed: true,
      },
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "resolve_choice",
      payload: {
        traceId: "trace_revealed",
        traceStep: "runner_bid",
        corpBid: 2,
        traceValue: 2,
        runnerBid: 1,
        runnerStrength: 2,
        traceBidsRevealed: true,
      },
    } as unknown as LegalAction;

    expect(
      publicContextForAction(state, action, traceTestDeps()),
    ).toMatchObject({
      traceRulesProfile: "classic_blind_corp_ties",
      traceBidsRevealed: true,
      corpBid: 2,
      traceValue: 2,
      runnerBid: 1,
      runnerStrength: 2,
    });
  });
  it("publishes the aggregate Runner agenda total after a steal", () => {
    const state = {
      corp: { servers: [], scoreArea: [] },
      runner: { scoreArea: ["previous-agenda", "stolen-agenda"] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "steal_agenda",
      payload: { cardId: "stolen-agenda" },
    } as unknown as LegalAction;
    const points = new Map([
      ["previous-agenda", 2],
      ["stolen-agenda", 3],
    ]);

    expect(
      publicContextForAction(state, action, {
        agendaPointsForScoredCard: (_state, cardId) => points.get(cardId) ?? 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () => ({ type: "agenda", agendaPoints: 3 }) as never,
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      }),
    ).toMatchObject({ agendaPoints: 3, totalAgendaPoints: 5 });
  });

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

  it("publishes the requested public draw count for suspended draw sequences", () => {
    const state = {
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "play_event",
      payload: {
        drawCardsAmount: 5,
        drawnCount: 1,
        drawTaxSourceCount: 1,
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
      drawCardsAmount: 5,
      drawnCount: 1,
      drawTaxSourceCount: 1,
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

  it("binds hidden installs and later rez events to opaque stable positions", () => {
    const beforeInstall = {
      corp: { servers: [{ id: "remote_1", ice: [], root: [] }] },
      cardInstances: {
        hidden_ice_a: { zone: { side: "corp", zone: "hand" } },
        hidden_ice_b: { zone: { side: "corp", zone: "hand" } },
      },
    } as unknown as GameState;
    const afterInstall = {
      corp: {
        servers: [
          {
            id: "remote_1",
            ice: ["hidden_ice_a", "hidden_ice_b"],
            root: [],
          },
        ],
      },
      cardInstances: {
        hidden_ice_a: {
          zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
        },
        hidden_ice_b: {
          zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
        },
      },
    } as unknown as GameState;
    const installAction = {
      side: "corp",
      type: "install_card",
      payload: { cardId: "hidden_ice_a" },
    } as unknown as LegalAction;
    const rezAction = {
      side: "corp",
      type: "rez_ice",
      payload: { cardId: "hidden_ice_a" },
    } as unknown as LegalAction;
    const otherInstallAction = {
      side: "corp",
      type: "install_card",
      payload: { cardId: "hidden_ice_b" },
    } as unknown as LegalAction;
    const afterTrash = {
      ...afterInstall,
      cardInstances: {
        ...afterInstall.cardInstances,
        hidden_ice_a: { zone: { side: "corp", zone: "discard" } },
      },
    } as unknown as GameState;
    const trashAction = {
      side: "runner",
      type: "trash_accessed_card",
      payload: { accessedCardId: "hidden_ice_a" },
    } as unknown as LegalAction;

    const installed = publicInstalledPositionContext(
      beforeInstall,
      afterInstall,
      installAction,
    );
    const rezzed = publicInstalledPositionContext(
      afterInstall,
      afterInstall,
      rezAction,
    );
    const other = publicInstalledPositionContext(
      beforeInstall,
      afterInstall,
      otherInstallAction,
    );
    const trashed = publicInstalledPositionContext(
      afterInstall,
      afterTrash,
      trashAction,
    );

    expect(installed).toMatchObject({
      serverId: "remote_1",
      installPlacement: "ice",
      installedPositionKey: expect.stringMatching(/^installed-position-v1:/),
    });
    expect(rezzed.installedPositionKey).toBe(installed.installedPositionKey);
    expect(trashed.installedPositionKey).toBe(installed.installedPositionKey);
    expect(other.installedPositionKey).not.toBe(installed.installedPositionKey);
    expect(JSON.stringify(installed)).not.toMatch(/hidden_ice|definition/i);
  });

  it("publishes a rezzed public install target with server and ICE position", () => {
    const state = {
      corp: {
        servers: [{ id: "hq", label: "HQ", ice: ["coyote", "mastermind"] }],
      },
      cardInstances: {
        mastermind: {
          rezzed: true,
          zone: { side: "corp", zone: "serverIce", serverId: "hq" },
        },
      },
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "install_card",
      payload: { cardId: "black-widow", selectedCardId: "mastermind" },
      targetRequirements: [
        { id: "targetIce", kind: "card", side: "corp", visibility: "public" },
      ],
    } as unknown as LegalAction;

    expect(
      publicContextForAction(state, action, {
        agendaPointsForScoredCard: () => 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () => ({ title: "Mastermind" }) as never,
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      }),
    ).toMatchObject({
      selectedTargetLabel: "Mastermind",
      selectedTargetServerLabel: "HQ",
      selectedTargetIcePosition: 2,
    });
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

  it("forwards approved public expose ids without a singular private target id", () => {
    const state = {
      corp: { servers: [] },
      cardInstances: {},
    } as unknown as GameState;
    const action = {
      side: "runner",
      type: "resolve_choice",
      payload: {
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_card_review",
        publicRevealKind: "expose",
        publicRevealDefinitionId: "simple_upgrade",
        sourceDefinitionId: "onr_v1_058_seeya",
        exposedServerId: "remote_2",
        exposedServerLabel: "Remote 2",
        exposedArea: "root",
        exposedIndex: 1,
        exposedPositionKey: "root:1",
        exposedCardInstanceId: "secret_upgrade_instance",
        exposedCardInstanceIds: "public_upgrade_instance,public_ice_instance",
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
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_review",
      publicRevealKind: "expose",
      publicRevealDefinitionId: "simple_upgrade",
      sourceDefinitionId: "onr_v1_058_seeya",
      exposedServerId: "remote_2",
      exposedServerLabel: "Remote 2",
      exposedArea: "root",
      exposedIndex: 1,
      exposedCardInstanceIds: "public_upgrade_instance,public_ice_instance",
    });
    expect(context).not.toHaveProperty("exposedPositionKey");
    expect(context).not.toHaveProperty("exposedCardInstanceId");
    expect(JSON.stringify(context)).not.toContain("secret_upgrade_instance");
  });
});

function traceTestDeps() {
  return {
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
  };
}

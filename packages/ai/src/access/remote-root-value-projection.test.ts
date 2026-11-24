import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import { projectRemoteRootValue } from "./remote-root-value-projection";

describe("remote root value projection", () => {
  it("projects finite economy pools from explicit finite economy semantics", () => {
    expect(
      projectRemoteRootValue({
        definitionId: 538,
        roles: ["campaign", "economy"],
        effects: [{ kind: "economy", scope: "corp", finite: true }],
        visibleCard: {
          instanceId: "holovid",
          known: true,
          definitionId: 538,
          title: "Holovid Campaign",
          type: "asset",
          counters: { bit: 5 },
        },
        valueHints: { remoteRootValue: 3 },
      }),
    ).toMatchObject({
      kind: "finite_economy_pool",
      finitePoolValueRemaining: 5,
      finitePoolDepleted: false,
      valueScore: 3,
    });
  });

  it("ignores unrelated value numbers in remote-root valuation", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("typed-root-value"),
        roles: ["ambush"],
        valueHints: { damage: 15 },
      }),
    ).toMatchObject({
      kind: "ambush",
      valueScore: 0,
    });

    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("typed-root-value"),
        roles: ["ambush"],
        valueHints: { damage: 15, remoteRootValue: 4 },
      }),
    ).toMatchObject({
      kind: "ambush",
      valueScore: 4,
    });
  });

  it("does not treat recurring credits as finite pools", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("recurring-economy"),
        roles: ["economy"],
        visibleCard: {
          instanceId: "recurring",
          known: true,
          definitionId: syntheticCardDefinitionId("recurring-economy"),
          type: "asset",
          counters: { recurring_credit: 3 },
        },
      }),
    ).toMatchObject({
      kind: "recurring_economy",
      finitePoolValueRemaining: 0,
      finitePoolDepleted: false,
    });
  });

  it("keeps bit counters without economy semantics non-economic", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("bit-counter-non-economy"),
        roles: ["ambush"],
        visibleCard: {
          instanceId: "ambush",
          known: true,
          definitionId: syntheticCardDefinitionId("bit-counter-non-economy"),
          type: "asset",
          counters: { bit: 2 },
        },
      }),
    ).toMatchObject({
      kind: "ambush",
      finitePoolValueRemaining: 0,
      finitePoolDepleted: false,
    });
  });

  it("does not infer finite economy from asset type alone", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("plain-asset"),
        visibleCard: {
          instanceId: "plain",
          known: true,
          definitionId: syntheticCardDefinitionId("plain-asset"),
          type: "asset",
        },
      }),
    ).toMatchObject({
      kind: "unknown",
      finitePoolValueRemaining: 0,
    });
  });

  it("does not mark finite economy semantics depleted without a visible pool counter", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("campaign-with-hidden-pool"),
        roles: ["campaign", "economy"],
        effects: [{ kind: "economy", scope: "corp", finite: true }],
        visibleCard: {
          instanceId: "campaign",
          known: true,
          definitionId: syntheticCardDefinitionId("campaign-with-hidden-pool"),
          type: "asset",
        },
      }),
    ).toMatchObject({
      kind: "campaign_drip",
      finitePoolValueRemaining: 0,
      finitePoolDepleted: false,
    });
  });

  it("bounds role text classification by role tokens", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("remote-role-noise"),
        roles: [
          "campaigner_noise",
          "engineer_noise",
          "ambusher_noise",
          "scoring_protectionish_noise",
        ],
      }),
    ).toMatchObject({
      kind: "unknown",
    });

    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("remote-role-structured"),
        roles: ["agenda_protection"],
      }),
    ).toMatchObject({
      kind: "scoring_protection",
    });
  });

  it("keeps the parts of compound roles on the same annotation", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("unrelated-roles"),
        roles: ["economy", "pool_control", "agenda", "protection_averse"],
        visibleCard: {
          instanceId: "pool",
          known: true,
          counters: { bit: 1 },
        },
      }).kind,
    ).toBe("non_economy_counter");
  });

  it("projects typed advancement-transfer support as score acceleration", () => {
    expect(
      projectRemoteRootValue({
        definitionId: syntheticCardDefinitionId("typed-counter-transfer-engine"),
        roles: ["asset", "economy"],
        effects: [
          {
            kind: "advance",
            scope: "installed_card",
            resource: "advancement_counters",
            target: "advance.counter_transfer",
            finite: true,
          },
        ],
        functionSignals: [
          "advance.counter_manipulation",
          "score.fast_advance_support",
        ],
        lineSupport: ["corp.fast_advance"],
        strategicRoles: ["scoring_tool"],
        valueHints: { remoteRootValue: 1 },
      }),
    ).toMatchObject({
      kind: "score_acceleration",
      valueScore: 4,
      finitePoolDepleted: false,
    });
  });
});

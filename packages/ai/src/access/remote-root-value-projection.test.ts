import { describe, expect, it } from "vitest";
import { projectRemoteRootValue } from "./remote-root-value-projection";

describe("remote root value projection", () => {
  it("projects finite economy pools from explicit finite economy semantics", () => {
    expect(
      projectRemoteRootValue({
        definitionId: "onr_v1_326_holovid-campaign",
        roles: ["campaign", "economy"],
        effects: [{ kind: "economy", scope: "corp", finite: true }],
        visibleCard: {
          instanceId: "holovid",
          known: true,
          definitionId: "onr_v1_326_holovid-campaign",
          title: "Holovid Campaign",
          type: "asset",
          counters: { bit: 5 },
        },
        valueHints: { economy: 3 },
      }),
    ).toMatchObject({
      kind: "finite_economy_pool",
      finitePoolValueRemaining: 5,
      finitePoolDepleted: false,
      valueScore: 3,
    });
  });

  it("does not treat recurring credits as finite pools", () => {
    expect(
      projectRemoteRootValue({
        definitionId: "recurring-economy",
        roles: ["economy"],
        visibleCard: {
          instanceId: "recurring",
          known: true,
          definitionId: "recurring-economy",
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
        definitionId: "bit-counter-non-economy",
        roles: ["ambush"],
        visibleCard: {
          instanceId: "ambush",
          known: true,
          definitionId: "bit-counter-non-economy",
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
        definitionId: "plain-asset",
        visibleCard: {
          instanceId: "plain",
          known: true,
          definitionId: "plain-asset",
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
        definitionId: "campaign-with-hidden-pool",
        roles: ["campaign", "economy"],
        effects: [{ kind: "economy", scope: "corp", finite: true }],
        visibleCard: {
          instanceId: "campaign",
          known: true,
          definitionId: "campaign-with-hidden-pool",
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
        definitionId: "remote-role-noise",
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
        definitionId: "remote-role-structured",
        roles: ["agenda_protection"],
      }),
    ).toMatchObject({
      kind: "scoring_protection",
    });
  });
});

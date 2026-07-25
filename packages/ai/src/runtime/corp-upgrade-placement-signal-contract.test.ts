import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
  corpUpgradePlacementAssessment,
  corpUpgradePlacementExclusion,
} from "./corp-upgrade-placement";

const AGENDA_DIFFICULTY_UPGRADES = [
  "onr_v1_374_washington-d-c-city-grid",
  "onr_proteus_065_networked-center",
  "onr_proteus_072_research-bunker",
  "onr_proteus_077_weapons-depot",
] as const;

describe("Corp upgrade placement signal contract", () => {
  it.each(AGENDA_DIFFICULTY_UPGRADES)(
    "carries the active hint for %s through projection into the central mismatch score",
    (definitionId) => {
      const component = placementComponent(definitionId, "hq");

      expect(component).toEqual(
        expect.objectContaining({
          key: "corp_upgrade_install_placement_mismatch",
          value: -5200,
          reason: expect.stringContaining(
            "mismatch:agenda_difficulty_requires_remote_scoring_fort",
          ),
        }),
      );
      expect(component?.reason).toContain(`card:${definitionId}`);
    },
  );

  it.each(AGENDA_DIFFICULTY_UPGRADES)(
    "gives %s positive fit on a prepared scoring remote",
    (definitionId) => {
      const component = placementComponent(definitionId, "remote_1", {
        remoteIce: [visibleCard("remote-ice", "simple_ice", "ice")],
      });

      expect(component).toEqual(
        expect.objectContaining({
          key: "corp_upgrade_install_placement_fit",
          value: 850,
          reason: expect.stringContaining(
            "fit:agenda_difficulty_prepared_score_remote",
          ),
        }),
      );
    },
  );

  it("gives Research Bunker its strongest fit on an active scoreline remote", () => {
    const component = placementComponent(
      "onr_proteus_072_research-bunker",
      "remote_1",
      {
        remoteRoot: [
          visibleCard("remote-agenda", "simple_agenda", "agenda", {
            advancementRequirement: 3,
          }),
        ],
      },
    );

    expect(component).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1600,
        reason: expect.stringContaining(
          "fit:agenda_difficulty_active_scoreline_remote",
        ),
      }),
    );
  });

  it("keeps Panic Button as an HQ-only counterexample", () => {
    expect(
      placementComponent("onr_proteus_067_panic-button", "hq"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1100,
        reason: expect.stringContaining("fit:hq_run_condition"),
      }),
    );
    expect(
      placementComponent("onr_proteus_067_panic-button", "remote_1"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_mismatch",
        value: -5000,
        reason: expect.stringContaining("mismatch:requires_hq_run"),
      }),
    );
  });

  it("defers Dr. Dreff until the Engine certifies a concrete future encounter route", () => {
    expect(
      placementComponent("onr_v1_358_dr-dreff", "hq"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_defer",
        value: -900,
        reason: expect.stringContaining(
          "defer_reason:dr_dreff_requires_engine_certified_future_encounter_route",
        ),
      }),
    );
  });

  it("keeps Simon Francisco on HQ or R&D as a central counterexample", () => {
    expect(
      placementComponent("onr_proteus_073_simon-francisco", "rd"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1000,
        reason: expect.stringContaining("fit:central_access_reduction"),
      }),
    );
    expect(
      placementComponent("onr_proteus_073_simon-francisco", "remote_1"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_mismatch",
        value: -4800,
        reason: expect.stringContaining("mismatch:requires_hq_or_rd"),
      }),
    );
  });

  it("defers pass-ICE tax upgrades until their fort actually has ICE", () => {
    const deferred = placementComponent(
      "onr_proteus_070_rasmin-bridger",
      "hq",
    );
    expect(deferred).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_defer",
        reason: expect.stringContaining("defer_reason:ice_support_without_ice"),
      }),
    );
    expect(deferred?.value).toBeLessThan(0);
    expect(
      placementComponent("onr_proteus_070_rasmin-bridger", "hq", {
        hqIce: [visibleCard("hq-ice", "simple_ice", "ice")],
      }),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 750,
        reason: expect.stringContaining("fit:ice_support_existing_ice"),
      }),
    );
  });

  it("defers a region replacement without active marginal utility", () => {
    const replacement = placementScenario(
      "onr_proteus_072_research-bunker",
      "remote_1",
      {
        regionReplacementWarning: true,
        remoteIce: [visibleCard("remote-ice", "simple_ice", "ice")],
        remoteRoot: [
          visibleCard(
            "networked-center-installed",
            "onr_proteus_065_networked-center",
            "upgrade",
            { subtypes: ["region"] },
          ),
        ],
      },
    );

    expect(corpRegionReplacementComponent(replacement)).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_region_replacement_defer",
        value: 0,
        reason: expect.stringContaining(
          "placement_reason:region_replacement_without_marginal_value",
        ),
      }),
    );
    expect(corpUpgradePlacementExclusion(replacement)).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_region_replacement_without_marginal_value",
      }),
    );
    expect(corpUpgradeInstallPlacementComponent(replacement)).toBeUndefined();
  });

  it("allows a region replacement that activates the current agenda category", () => {
    const replacement = placementScenario(
      "onr_proteus_072_research-bunker",
      "remote_1",
      {
        regionReplacementWarning: true,
        remoteRoot: [
          visibleCard(
            "networked-center-installed",
            "onr_proteus_065_networked-center",
            "upgrade",
            { subtypes: ["region"] },
          ),
          visibleCard("research-agenda", "research-agenda", "agenda", {
            subtypes: ["research"],
          }),
        ],
      },
    );

    expect(corpUpgradePlacementAssessment(replacement)).toMatchObject({
      recommendation: "allow",
      reason: "region_replacement_adds_active_utility",
      marginalUtility: ["score.research_difficulty_discount"],
    });
    expect(corpUpgradePlacementExclusion(replacement)).toBeUndefined();
  });
});

function placementComponent(
  definitionId: string,
  serverId: "hq" | "rd" | "remote_1",
  options: {
    regionReplacementWarning?: boolean;
    hqIce?: VisibleCard[];
    remoteIce?: VisibleCard[];
    remoteRoot?: VisibleCard[];
  } = {},
) {
  return corpUpgradeInstallPlacementComponent(
    placementScenario(definitionId, serverId, options),
  );
}

function placementScenario(
  definitionId: string,
  serverId: "hq" | "rd" | "remote_1",
  options: {
    regionReplacementWarning?: boolean;
    hqIce?: VisibleCard[];
    remoteIce?: VisibleCard[];
    remoteRoot?: VisibleCard[];
  } = {},
) {
  const sourceCard = visibleCard(
    `${definitionId}-instance`,
    definitionId,
    "upgrade",
  );
  const action: LegalAction = {
    actionId: `corp.install_card.${sourceCard.instanceId}.${serverId}`,
    side: "corp",
    type: "install_card",
    label: `Karte in ${serverId} installieren`,
    source: sourceCard.instanceId,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      cardId: sourceCard.instanceId,
      serverId,
      placement: "root",
      effectKind: "install_card",
      ...(options.regionReplacementWarning
        ? { regionReplacementWarning: true }
        : {}),
    },
  };
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    stateVersion: 1,
    visibleSourceDefinitionsByInstanceId: {
      [sourceCard.instanceId]: definitionId,
    },
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  if (!candidate) throw new Error("Expected projected install candidate");

  return {
    input: {
      playerView: {
        servers: [
          { id: "hq", label: "HQ", ice: options.hqIce ?? [], root: [] },
          { id: "rd", label: "R&D", ice: [], root: [] },
          { id: "archives", label: "Archives", ice: [], root: [] },
          {
            id: "remote_1",
            label: "Remote 1",
            ice: options.remoteIce ?? [],
            root: options.remoteRoot ?? [],
          },
        ],
      },
    } as unknown as AiDecisionInput,
    action,
    roles: ["upgrade"],
    actionSemanticCandidate: candidate,
    sourceCard,
    serverId,
  };
}

function visibleCard(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  extra: Omit<
    Partial<VisibleCard>,
    "instanceId" | "definitionId" | "known" | "title" | "type"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    known: true,
    title: definitionId,
    type,
    rezzed: false,
    advancementCounters: 0,
    ...extra,
  };
}

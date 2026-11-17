import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type {
  AiDecisionInput,
  CardDefinitionId,
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
  586,
  123,
  130,
  135,
] as const;
const SIMPLE_ICE_ID = syntheticCardDefinitionId("simple_ice");
const TEST_AGENDA_ID = syntheticCardDefinitionId("test-agenda");

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
      for (const serverId of ["hq", "rd"] as const) {
        for (const regionReplacementWarning of [false, true]) {
          expect(
            corpUpgradePlacementAssessment(
              placementScenario(definitionId, serverId, {
                regionReplacementWarning,
              }),
            ),
          ).toMatchObject({
            recommendation: "defer",
            reason: "agenda_difficulty_requires_remote_scoring_fort",
          });
        }
      }
    },
  );

  it.each([
    [586, "research"],
    [123, "gray_ops"],
    [130, "research"],
    [135, "black_ops"],
  ] as const)(
    "gives %s positive fit on a prepared scoring remote",
    (definitionId, agendaSubtype) => {
      const agenda = eligibleAgenda(agendaSubtype);
      const options = {
        remoteIce: [visibleCard("remote-ice", SIMPLE_ICE_ID, "ice")],
        hqAgendas: [agenda],
        agendaInstalls: [agendaInstall(agenda)],
      };
      const component = placementComponent(definitionId, "r1", {
        ...options,
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
      expect(
        corpUpgradePlacementAssessment(
          placementScenario(definitionId, "r1", {
            ...options,
          }),
        )?.recommendation,
      ).toBe("allow");
    },
  );

  it("gives Research Bunker its strongest fit on an active scoreline remote", () => {
    const component = placementComponent(
      130,
      "r1",
      {
        remoteRoot: [
          visibleCard("remote-agenda", 588, "agenda", {
            advancementRequirement: 3,
            subtypes: ["research"],
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

  it("places an agenda-steal tax only beside a visible agenda", () => {
    const active = placementComponent(578, "r1", {
      remoteRoot: [
        visibleCard("remote-agenda", 588, "agenda", {
          advancementRequirement: 3,
        }),
      ],
    });
    const empty = placementComponent(578, "r1");

    expect(active).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1900,
        reason: expect.stringContaining(
          "fit:agenda_steal_tax_active_scoreline_remote",
        ),
      }),
    );
    expect(empty).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_defer",
        value: -2100,
        reason: expect.stringContaining(
          "defer_reason:no_visible_agenda_for_steal_tax",
        ),
      }),
    );
  });

  it("recognizes a same-fort agenda-steal tax as useful on central servers", () => {
    expect(placementComponent(578, "rd")).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1700,
        reason: expect.stringContaining("fit:central_agenda_steal_tax"),
      }),
    );
  });

  it("keeps Panic Button as an HQ-only counterexample", () => {
    expect(placementComponent(125, "hq")).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1100,
        reason: expect.stringContaining("fit:hq_run_condition"),
      }),
    );
    expect(
      placementComponent(125, "r1"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_mismatch",
        value: -5000,
        reason: expect.stringContaining("mismatch:requires_hq_run"),
      }),
    );
  });

  it("defers Dr. Dreff until the Engine certifies a concrete future encounter route", () => {
    expect(placementComponent(570, "hq")).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_defer",
        value: -900,
        reason: expect.stringContaining(
          "defer_reason:future_encounter_support_requires_engine_certified_route",
        ),
      }),
    );
  });

  it("keeps Simon Francisco on HQ or R&D as a central counterexample", () => {
    expect(placementComponent(131, "rd")).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_fit",
        value: 1000,
        reason: expect.stringContaining("fit:central_access_reduction"),
      }),
    );
    expect(
      placementComponent(131, "r1"),
    ).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_mismatch",
        value: -4800,
        reason: expect.stringContaining("mismatch:requires_hq_or_rd"),
      }),
    );
  });

  it("defers pass-ICE tax upgrades until their fort actually has ICE", () => {
    const deferred = placementComponent(128, "hq");
    expect(deferred).toEqual(
      expect.objectContaining({
        key: "corp_upgrade_install_placement_defer",
        reason: expect.stringContaining("defer_reason:ice_support_without_ice"),
      }),
    );
    expect(deferred?.value).toBeLessThan(0);
    expect(
      placementComponent(128, "hq", {
        hqIce: [visibleCard("hq-ice", SIMPLE_ICE_ID, "ice")],
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
      130,
      "r1",
      {
        regionReplacementWarning: true,
        remoteIce: [visibleCard("remote-ice", SIMPLE_ICE_ID, "ice")],
        remoteRoot: [
          visibleCard(
            "research-bunker-installed",
            130,
            "upgrade",
            { subtypes: ["region"] },
          ),
          eligibleAgenda("research"),
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
      130,
      "r1",
      {
        regionReplacementWarning: true,
        remoteRoot: [
          visibleCard(
            "networked-center-installed",
            123,
            "upgrade",
            { subtypes: ["region"] },
          ),
          visibleCard("research-agenda", TEST_AGENDA_ID, "agenda", {
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

  it.each(AGENDA_DIFFICULTY_UPGRADES.slice(1))(
    "defers %s with no compatible current agenda despite installed ICE",
    (definitionId) => {
      const scenario = placementScenario(definitionId, "r1", {
        remoteIce: [visibleCard("ice", SIMPLE_ICE_ID, "ice")],
      });
      expect(corpUpgradePlacementAssessment(scenario)).toMatchObject({
        recommendation: "defer",
        reason: "agenda_difficulty_without_eligible_agenda",
      });
      expect(corpUpgradeInstallPlacementComponent(scenario)?.value).toBe(-1700);
      expect(corpUpgradePlacementExclusion(scenario)?.key).toBe(
        "corp_upgrade_agenda_difficulty_without_eligible_agenda",
      );
    },
  );

  it.each(["wrong_category", "unknown", "missing_action", "wrong_source", "wrong_fort", "stale", "wrong_timing"])(
    "does not invent prepared Weapons Depot support from %s",
    (variant) => {
      const agenda = eligibleAgenda("black_ops");
      const action = agendaInstall(agenda);
      if (variant === "wrong_category") agenda.subtypes = ["research"];
      if (variant === "unknown") agenda.known = false;
      if (variant === "wrong_source") action.source = "another-agenda";
      if (variant === "wrong_fort") action.payload!.serverId = "r2";
      if (variant === "stale") action.expiresAtStateVersion = 0;
      if (variant === "wrong_timing") action.timingPoint = "corp_discard.select_cards";
      const scenario = placementScenario(135, "r1", {
        remoteIce: [visibleCard("ice", SIMPLE_ICE_ID, "ice")],
        hqAgendas: [agenda],
        agendaInstalls: variant === "missing_action" ? [] : [action],
      });
      expect(corpUpgradePlacementAssessment(scenario)?.recommendation).toBe("defer");
    },
  );

  it("does not treat an advanced ambush as an active Agenda discount target", () => {
    const component = placementComponent(AGENDA_DIFFICULTY_UPGRADES[0], "r1", {
      remoteIce: [visibleCard("ice", SIMPLE_ICE_ID, "ice")],
      remoteRoot: [
        visibleCard("ambush", 560, "asset", {
          advancementCounters: 2,
        }),
      ],
    });
    expect(component?.value).toBe(-1700);
    expect(component?.reason).toContain("defer_reason:no_scoring_remote_payoff");
  });

  it("preserves unrestricted Washington prepared support without a held agenda", () => {
    expect(placementComponent(AGENDA_DIFFICULTY_UPGRADES[0], "r1", {
      remoteIce: [visibleCard("ice", SIMPLE_ICE_ID, "ice")],
    })?.value).toBe(850);
  });
});

function eligibleAgenda(subtype: "research" | "gray_ops" | "black_ops"): VisibleCard {
  return visibleCard("eligible-agenda", TEST_AGENDA_ID, "agenda", {
    subtypes: [subtype],
  });
}

function agendaInstall(card: VisibleCard): LegalAction {
  return {
    actionId: `corp.install_card.${card.instanceId}.r1`, side: "corp",
    type: "install_card", label: "Agenda installieren", source: card.instanceId,
    timingPoint: "corp_action.main", costs: [{ clicks: 1 }], targetRequirements: [],
    visibility: "private_to_actor", expiresAtStateVersion: 1,
    payload: { cardId: card.instanceId, serverId: "r1", placement: "root" },
  };
}

function placementComponent(
  definitionId: CardDefinitionId,
  serverId: "hq" | "rd" | "r1",
  options: {
    regionReplacementWarning?: boolean;
    hqIce?: VisibleCard[];
    remoteIce?: VisibleCard[];
    remoteRoot?: VisibleCard[];
    hqAgendas?: VisibleCard[];
    agendaInstalls?: LegalAction[];
  } = {},
) {
  return corpUpgradeInstallPlacementComponent(
    placementScenario(definitionId, serverId, options),
  );
}

function placementScenario(
  definitionId: CardDefinitionId,
  serverId: "hq" | "rd" | "r1",
  options: {
    regionReplacementWarning?: boolean;
    hqIce?: VisibleCard[];
    remoteIce?: VisibleCard[];
    remoteRoot?: VisibleCard[];
    hqAgendas?: VisibleCard[];
    agendaInstalls?: LegalAction[];
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
      side: "corp",
      playerView: {
        timingPoint: "corp_action.main",
        stateVersion: 1,
        own: { gripOrHq: options.hqAgendas ?? [] },
        servers: [
          { id: "hq", label: "HQ", ice: options.hqIce ?? [], root: [] },
          { id: "rd", label: "R&D", ice: [], root: [] },
          { id: "archives", label: "Archives", ice: [], root: [] },
          {
            id: "r1",
            label: "Remote 1",
            ice: options.remoteIce ?? [],
            root: options.remoteRoot ?? [],
          },
        ],
      },
      legalActions: [action, ...(options.agendaInstalls ?? [])],
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
  definitionId: CardDefinitionId,
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
    title: instanceId,
    type,
    rezzed: false,
    advancementCounters: 0,
    ...extra,
  };
}

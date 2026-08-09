import { describe, expect, it } from "vitest";
import {
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  ACTIVE_CARD_SUPPORT_AI_GROUPS,
  ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS,
  CardSpecSupportError,
  deriveCardSpecSupportEntry,
  resolveCatalogSetName,
  validateLoadedCardSets,
} from "./card-set-loader";
import {
  buildAiApprovedCardIds,
  buildRuntimeCardIds,
  findDuplicateAiApprovalCards,
  findDuplicateRuntimeGateCards,
} from "./gate-evidence";

describe("card support evidence projections", () => {
  it("projects runtime and AI batches from active support data", () => {
    expect(
      buildRuntimeCardIds(ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS).slice().sort(),
    ).toEqual(activeRuntimeCardIds.slice().sort());
    expect(
      buildAiApprovedCardIds(ACTIVE_CARD_SUPPORT_AI_GROUPS).slice().sort(),
    ).toEqual(activeAiApprovedCardIds.slice().sort());
  });

  it("keeps card support projections duplicate-free", () => {
    expect(
      findDuplicateRuntimeGateCards(ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS),
    ).toEqual([]);
    expect(findDuplicateAiApprovalCards(ACTIVE_CARD_SUPPORT_AI_GROUPS)).toEqual(
      [],
    );
  });

  it("derives CardSpec support only from bound registry and scenario evidence", () => {
    const cardId = "onr_v1_154_broker";
    const entry = deriveCardSpecSupportEntry(
      cardId,
      "originalset-v1",
      {
        cardDefinitionId: cardId,
        validationStatus: "valid",
        runtimeProjectionStatus: "playable_mvp",
        planningProjectionStatus: "available",
        releaseEligibilityStatus: "active",
      },
      new Set([cardId]),
    );

    expect(entry.statuses).toEqual({
      imported: true,
      validated: true,
      catalog_ready: true,
      implemented: true,
      engine_supported: true,
      playable: true,
      human_playable: true,
      ai_supported: true,
      deck_legal: true,
      format_legal: true,
      blocked: false,
    });
    expect(entry.support.coverage).toEqual([
      "card_spec_registry",
      "runtime_projection",
      "planning_projection",
      "scenario",
    ]);
    expect(entry.support.coverage).not.toEqual(
      expect.arrayContaining([
        "unit_test",
        "visibility",
        "replay_statehash",
        "wrong_side_revalidation",
      ]),
    );
  });

  it("fails closed for missing, mismatched or absent CardSpec support evidence", () => {
    const cardId = "onr_v1_154_broker";
    const evidence = {
      cardDefinitionId: cardId,
      validationStatus: "valid" as const,
      runtimeProjectionStatus: "playable_mvp" as const,
      planningProjectionStatus: "available" as const,
      releaseEligibilityStatus: "active" as const,
    };

    expectCardSpecSupportFailure(
      () =>
        deriveCardSpecSupportEntry(
          cardId,
          "originalset-v1",
          undefined,
          new Set([cardId]),
        ),
      "missing_registry_evidence",
      cardId,
    );
    expectCardSpecSupportFailure(
      () =>
        deriveCardSpecSupportEntry(
          cardId,
          "originalset-v1",
          { ...evidence, cardDefinitionId: "wrong" },
          new Set([cardId]),
        ),
      "mismatched_registry_evidence",
      cardId,
    );
    expectCardSpecSupportFailure(
      () =>
        deriveCardSpecSupportEntry(
          cardId,
          "originalset-v1",
          evidence,
          new Set(),
        ),
      "missing_ai_scenario_evidence",
      cardId,
    );
  });

  it("keeps SetSpec naming authoritative over drifting legacy card fields", () => {
    expect(
      resolveCatalogSetName(
        {
          cardId: "onr_v1_154_broker",
          setId: "originalset-v1",
          setName: "stale legacy name",
        },
        { setName: "Original Netrunner CCG" },
      ),
    ).toBe("Original Netrunner CCG");
  });

  it("keeps ineligible publication blocked without demanding AI scenario evidence", () => {
    const entry = deriveCardSpecSupportEntry(
      "experimental_card",
      "experimental_set",
      {
        cardDefinitionId: "experimental_card",
        validationStatus: "valid",
        runtimeProjectionStatus: "playable_mvp",
        planningProjectionStatus: "available",
        releaseEligibilityStatus: "ineligible",
      },
      new Set(),
    );
    expect(entry.statuses.playable).toBe(false);
    expect(entry.statuses.ai_supported).toBe(false);
    expect(entry.statuses.blocked).toBe(true);
    expect(entry.blockReasons).toEqual(["publication_not_release_eligible"]);
    expect(entry.support.scenarioRefs).toEqual([]);
  });

  it("retains the legacy aiHintRef requirement", () => {
    const errors = validateLoadedCardSets([
      {
        set: {
          schemaVersion: "card-set-v1",
          setId: "legacy",
          cards: [
            {
              cardId: "legacy_event",
              setId: "legacy",
              title: "Legacy Event",
              side: "runner",
              type: "event",
              subtypes: [],
              numeric: {
                cost: 0,
                installCost: null,
                memoryCost: null,
                strength: null,
                rezCost: null,
                trashCost: null,
                advancementRequirement: null,
                agendaPoints: null,
              },
              text: "",
              displayOnlyText: true,
            },
          ],
        },
        support: {
          schemaVersion: "card-support-v1",
          setId: "legacy",
          cards: [
            {
              cardId: "legacy_event",
              setId: "legacy",
              statuses: {
                human_playable: true,
                deck_legal: true,
                ai_supported: true,
              },
              support: {
                resolverRef: "engine:legacy_event",
                coverage: [],
                aiHintRef: null,
                scenarioRefs: ["legacy#scenario"],
              },
            },
          ],
        },
      },
    ]);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("ai_supported needs aiHintRef"),
      ]),
    );
  });
});

function expectCardSpecSupportFailure(
  run: () => unknown,
  code: CardSpecSupportError["code"],
  cardDefinitionId: string,
): void {
  try {
    run();
    throw new Error("Expected CardSpec support derivation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(CardSpecSupportError);
    if (!(error instanceof CardSpecSupportError)) return;
    expect(error.code).toBe(code);
    expect(error.cardDefinitionId).toBe(cardDefinitionId);
  }
}

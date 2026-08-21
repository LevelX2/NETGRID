import type {
  CatalogCard,
  CatalogCardType,
  CatalogNumericFields,
} from "@netgrid/catalog";
import { CARD_DEFINITIONS_BY_ID } from "./card-definition-compatibility";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "./ai-hints";

describe("AI card definition completeness", () => {
  it("requires every playable runtime card to have one matching authoritative physical type", () => {
    const invalid = Object.entries(RUNTIME_CARDS)
      .filter(
        ([, runtimeCard]) =>
          runtimeCard.statuses.engine_supported ||
          runtimeCard.statuses.ai_supported ||
          runtimeCard.statuses.playable,
      )
      .flatMap(([definitionId, runtimeCard]) => {
        const authoritative = CARD_DEFINITIONS_BY_ID[definitionId];
        return authoritative?.type &&
          runtimeCard.type &&
          authoritative.type === physicalRuntimeType(runtimeCard.type)
          ? []
          : [
              {
                definitionId,
                runtimeType: runtimeCard.type,
                physicalRuntimeType: physicalRuntimeType(runtimeCard.type),
                authoritativeType: authoritative?.type,
              },
            ];
      });

    expect(invalid).toEqual([]);
  });

  it("requires every active AI hint to bind the same authoritative type", () => {
    const invalid = [...AI_HINTS_BY_CARD].flatMap(([definitionId, hint]) => {
      const authoritative = CARD_DEFINITIONS_BY_ID[definitionId];
      return authoritative?.type &&
        hint.cardType &&
        authoritative.type === hint.cardType
        ? []
        : [
            {
              definitionId,
              hintType: hint.cardType,
              authoritativeType: authoritative?.type,
            },
          ];
    });

    expect(invalid).toEqual([]);
  });

  it("requires the complete type-dependent numeric contract on every playable card", () => {
    const invalid = playableRuntimeCards().flatMap((card) =>
      numericContractErrors(card),
    );

    expect(invalid).toEqual([]);
  });

  it("keeps authoritative Shared numeric and strength models aligned with Catalog", () => {
    const invalid = playableRuntimeCards().flatMap<object>((runtimeCard) => {
      const authoritative = CARD_DEFINITIONS_BY_ID[runtimeCard.catalogCardId];
      if (!authoritative) {
        return [
          {
            definitionId: runtimeCard.catalogCardId,
            reason: "missing_authoritative_definition",
          },
        ];
      }
      return authoritative.type === physicalRuntimeType(runtimeCard.type) &&
        JSON.stringify(authoritative.numeric) ===
          JSON.stringify(runtimeCard.numeric) &&
        JSON.stringify(authoritative.strengthModel) ===
          JSON.stringify(runtimeCard.strengthModel)
        ? []
        : [
            {
              definitionId: runtimeCard.catalogCardId,
              runtimeType: runtimeCard.type,
              authoritativeType: authoritative.type,
              runtimeNumeric: runtimeCard.numeric,
              authoritativeNumeric: authoritative.numeric,
              runtimeStrengthModel: runtimeCard.strengthModel,
              authoritativeStrengthModel: authoritative.strengthModel,
            },
          ];
    });

    expect(invalid).toEqual([]);
  });
});

const NUMERIC_FIELDS = [
  "cost",
  "installCost",
  "memoryCost",
  "strength",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
] as const satisfies readonly (keyof CatalogNumericFields)[];

const ALLOWED_NUMERIC_FIELDS: Record<
  CatalogCardType,
  readonly (keyof CatalogNumericFields)[]
> = {
  identity: [],
  event: ["cost"],
  operation: ["cost"],
  program: ["installCost", "memoryCost", "strength"],
  hardware: ["installCost"],
  resource: ["installCost"],
  agenda: ["advancementRequirement", "agendaPoints"],
  asset: ["rezCost", "trashCost"],
  upgrade: ["rezCost", "trashCost"],
  ice: ["rezCost", "strength"],
};

const REQUIRED_NUMERIC_FIELDS: Partial<
  Record<CatalogCardType, readonly (keyof CatalogNumericFields)[]>
> = {
  program: ["installCost", "memoryCost"],
  hardware: ["installCost"],
  resource: ["installCost"],
  agenda: ["advancementRequirement", "agendaPoints"],
  asset: ["rezCost", "trashCost"],
  upgrade: ["rezCost", "trashCost"],
  ice: ["rezCost"],
};

function playableRuntimeCards(): CatalogCard[] {
  return Object.values(RUNTIME_CARDS).filter(
    (card) =>
      card.statuses.engine_supported ||
      card.statuses.ai_supported ||
      card.statuses.playable,
  );
}

function numericContractErrors(card: CatalogCard): object[] {
  const errors: object[] = [];
  const type = physicalRuntimeType(card.type);
  const allowed = new Set(ALLOWED_NUMERIC_FIELDS[type]);
  for (const field of NUMERIC_FIELDS) {
    const value = card.numeric[field];
    if (
      value !== null &&
      (!Number.isFinite(value) || !Number.isInteger(value) || value < 0)
    ) {
      errors.push({
        definitionId: card.catalogCardId,
        field,
        value,
        reason: "not_non_negative_finite_integer",
      });
    }
    if (value !== null && !allowed.has(field)) {
      errors.push({
        definitionId: card.catalogCardId,
        type,
        field,
        value,
        reason: "field_not_applicable_must_be_null",
      });
    }
  }
  for (const field of REQUIRED_NUMERIC_FIELDS[type] ?? []) {
    if (card.numeric[field] === null) {
      errors.push({
        definitionId: card.catalogCardId,
        type,
        field,
        reason: "required_field_is_null",
      });
    }
  }

  const isPlayCard = type === "event" || type === "operation";
  if (!isPlayCard) {
    if (card.playCost !== null || card.numeric.cost !== null) {
      errors.push({
        definitionId: card.catalogCardId,
        reason: "non_play_card_has_play_cost",
      });
    }
  } else if (card.playCost === null) {
    errors.push({
      definitionId: card.catalogCardId,
      reason: "play_card_has_no_play_cost",
    });
  } else if (card.playCost.kind === "fixed") {
    if (card.numeric.cost !== card.playCost.credits) {
      errors.push({
        definitionId: card.catalogCardId,
        reason: "fixed_play_cost_mismatch",
      });
    }
  } else if (card.numeric.cost !== null) {
    errors.push({
      definitionId: card.catalogCardId,
      reason: "variable_and_fixed_play_cost_contradiction",
    });
  }

  const strengthRelevant =
    type === "ice" ||
    (type === "program" && card.subtypes.includes("icebreaker"));
  if (strengthRelevant) {
    if (
      card.strengthModel.kind === "not_applicable" ||
      (card.strengthModel.kind === "fixed" &&
        card.strengthModel.value !== card.numeric.strength) ||
      (card.strengthModel.kind !== "fixed" && card.numeric.strength !== null)
    ) {
      errors.push({
        definitionId: card.catalogCardId,
        reason: "invalid_strength_model",
        strength: card.numeric.strength,
        strengthModel: card.strengthModel,
      });
    }
  } else if (
    card.numeric.strength !== null ||
    card.strengthModel.kind !== "not_applicable"
  ) {
    errors.push({
      definitionId: card.catalogCardId,
      reason: "non_applicable_strength_not_explicit",
      strength: card.numeric.strength,
      strengthModel: card.strengthModel,
    });
  }
  return errors;
}

function physicalRuntimeType(runtimeType: string): CatalogCardType {
  if (runtimeType.startsWith("hardware-")) return "hardware";
  return runtimeType as CatalogCardType;
}

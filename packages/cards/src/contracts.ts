import type { CardDefinitionId, CardType, Side } from "@netgrid/shared";
import type { CardMechanicalSpec } from "./engine/card-mechanical-contracts";
import type { CardPlanningAnnotations } from "./planning-annotations";
import type { CapabilityKey } from "./capability-identity";

export type CardSpec = {
  schemaVersion: "card-spec-v1";
  identity: CardIdentitySpec;
  text: CanonicalCardTextSpec;
  rules: CardRulesSpec;
  engine: CardMechanicalSpec;
  planningAnnotations?: CardPlanningAnnotations;
  printings: readonly PrintingSpec[];
  publication: CardPublicationSpec;
};

export type CardIdentitySpec = {
  cardDefinitionId: CardDefinitionId;
  title: string;
  side: Side;
  cardType: CardType;
};

export type CanonicalCardTextSpec = {
  schemaVersion: "canonical-card-text-v1";
  rulesText: string;
  flavorText?: string;
  reminderText?: string;
  markCounterDisplay?: {
    id: string;
    label: string;
    ariaLabelName: string;
  };
  capabilityText?: readonly CapabilityTextSpec[];
};

export type CapabilityTextSpec = {
  capabilityKey: CapabilityKey;
  actionLabel: string;
};

/** Closed provenance only; executable semantics belong exclusively to engine. */
export type CardRulesSpec = {
  schemaVersion: "card-rules-v1";
  references: readonly CardRuleReferenceSpec[];
};

export type CardRuleReferenceSpec = {
  source: "comprehensive_rules" | "card_text" | "project_ruling";
  reference: string;
  note?: string;
};

export type PrintingId = string;
export type SetId = string;

export type PrintingSpec = {
  schemaVersion: "printing-spec-v1";
  printingId: PrintingId;
  setId: SetId;
  collectorNumber?: string;
  rarity?: string;
  variant?: string;
  faceTextOverride?: string;
};

export type CardPublicationSpec =
  | {
      schemaVersion: "card-publication-v1";
      status: "active";
      blockReason?: never;
      catalogBlockReason?: never;
    }
  | {
      schemaVersion: "card-publication-v1";
      status: "experimental";
      blockReason?: never;
      /** Optional catalog-only diagnostic; never implies runtime support. */
      catalogBlockReason?: string;
    }
  | {
      schemaVersion: "card-publication-v1";
      status: "disabled";
      blockReason: string;
      catalogBlockReason?: never;
    };

export type SetSpec = {
  schemaVersion: "set-spec-v1";
  setId: SetId;
  name: string;
  code?: string;
  sortOrder: number;
  publication: SetPublicationSpec;
};

export type SetPublicationSpec =
  | {
      status: "active" | "experimental";
      blockReason?: never;
    }
  | {
      status: "disabled";
      blockReason: string;
    };

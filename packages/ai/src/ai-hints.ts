import { createRuntimeCardsById } from "@netgrid/catalog";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import type { Side } from "@netgrid/shared";
import type { AiHintOntologyExtension } from "./hint-ontology";

export type CardRole = {
  cardId: string;
  side: Side;
  cardType?: string;
  roles: string[];
  riskTags?: string[];
};

export type AiCardHint = AiHintOntologyExtension & {
  cardId: string;
  side: Side;
  cardType?: string;
  roles: string[];
  planRoles: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  valueHints?: AiRuntimeValueHints;
  manualNotes?: string[];
  strategicNotes?: string[];
  descriptorGaps?: string[];
  opponentSignals?: Array<
    Record<string, unknown> & { visibleEvidenceOnly: true }
  >;
};

export type AiRuntimeValueHintKey =
  | "damage"
  | "economy"
  | "installCreditGain"
  | "leavePlayPayCost"
  | "remoteRootValue"
  | "startOfTurnCreditLoss";

export type AiRuntimeValueHints = Partial<
  Record<AiRuntimeValueHintKey, number>
>;

export const CARD_ROLES_BY_CARD = new Map(
  (cardRoleManifestData.cards as CardRole[]).map((card) => [card.cardId, card]),
);
export const RUNTIME_CARDS = createRuntimeCardsById();

export function createAiHintsByCard(): Map<string, AiCardHint> {
  return new Map(
    (activeAiHintsData.cards as AiCardHint[]).map((hint) => [
      hint.cardId,
      hint,
    ]),
  );
}

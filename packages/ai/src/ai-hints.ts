import { createRuntimeCardsById } from "@netgrid/catalog";
import cardRoleManifestData from "../../../data/ai/card-role-manifest-0.9.json";
import compiledAiHintsData from "../../../data/ai/ai-card-hints-compiled.json";
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
  valueHints?: Record<string, number>;
  runtimeCompiledHintPilot?: true;
  manualNotes?: string[];
  strategicNotes?: string[];
};

export const CARD_ROLES_BY_CARD = new Map(
  (cardRoleManifestData.cards as CardRole[]).map((card) => [card.cardId, card]),
);
export const RUNTIME_CARDS = createRuntimeCardsById();

export function createAiHintsByCard(): Map<string, AiCardHint> {
  return new Map(
    (compiledAiHintsData.cards as AiCardHint[]).map((hint) => [
      hint.cardId,
      hint,
    ]),
  );
}

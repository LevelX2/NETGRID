import { createRuntimeCardsById } from "@netgrid/catalog";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import type { Side } from "@netgrid/shared";
import type { AiHintOntologyExtension } from "./hint-ontology";

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

export const AI_HINTS_BY_CARD = new Map(
  (activeAiHintsData.cards as AiCardHint[]).map((hint) => [hint.cardId, hint]),
);
export const RUNTIME_CARDS = createRuntimeCardsById();

export function createAiHintsByCard(): Map<string, AiCardHint> {
  return new Map(AI_HINTS_BY_CARD);
}

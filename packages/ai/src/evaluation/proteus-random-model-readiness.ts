import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export const PROTEUS_RANDOM_MODEL_READINESS_VERSION =
  "proteus-random-model-readiness-v0" as const;

export type ProteusRandomModelReadinessStatus =
  | "needs_random_outcome_model"
  | "ready_for_report_only_annotation";

export type ProteusRandomModelReadinessCard = {
  cardName: string;
  model: "random_outcome_model";
  status: ProteusRandomModelReadinessStatus;
  deterministicRuntimeAllowed: false;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  requiredModelEvidence: string[];
};

export type ProteusRandomModelReadinessReport = {
  version: typeof PROTEUS_RANDOM_MODEL_READINESS_VERSION;
  scope: "proteus_random_model_readiness_report_only";
  model: "random_outcome_model";
  cardCount: number;
  cards: ProteusRandomModelReadinessCard[];
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildProteusRandomModelReadinessReport(
  cardNames: readonly string[] = [
    "AI Board Member",
    "Bargain with Viacox",
    "Quest for Cattekin",
    "Playful AI",
    "Roadblock",
    "Rio de Janeiro City Grid",
  ],
): ProteusRandomModelReadinessReport {
  const cards = [...new Set(cardNames)].sort().map(randomReadinessCard);
  const report: ProteusRandomModelReadinessReport = {
    version: PROTEUS_RANDOM_MODEL_READINESS_VERSION,
    scope: "proteus_random_model_readiness_report_only",
    model: "random_outcome_model",
    cardCount: cards.length,
    cards,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "proteus_random_model_readiness:report_only",
      "model:random_outcome_model",
      `card_count:${cards.length}`,
      "deterministic_runtime_allowed:false",
      "productive_use_allowed:false",
    ],
  };
  assertSemanticObjectSideSafe(report, "ProteusRandomModelReadinessReport");
  return report;
}

function randomReadinessCard(cardName: string): ProteusRandomModelReadinessCard {
  return {
    cardName,
    model: "random_outcome_model",
    status: "needs_random_outcome_model",
    deterministicRuntimeAllowed: false,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    requiredModelEvidence: [
      `card:${cardName}`,
      "random_outcome_model_required:true",
      "seeded_replay_contract_required:true",
      "runtime_consumer:none",
    ],
  };
}

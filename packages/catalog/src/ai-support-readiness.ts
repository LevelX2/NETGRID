import readinessData from "../../../data/ai/card-set-ai-readiness-v1.json";

export const AI_SUPPORT_READINESS_STAGES = [
  "hint_ready",
  "selected_ai_playtest_ready",
  "default_pool_ready",
] as const;

export type AiSupportReadinessStage =
  (typeof AI_SUPPORT_READINESS_STAGES)[number];

export type AiSupportReadinessStageState = {
  ready: boolean;
  reason: string;
};

export type CardSetAiReadiness = {
  setId: string;
  technicalEligibilityStatus: "ai_supported";
  highestApprovedStage: AiSupportReadinessStage;
  stages: Record<AiSupportReadinessStage, AiSupportReadinessStageState>;
  evidence: {
    cardCount: number;
    aiSupportedCardCount: number;
    activeHintCount: number;
    compiledHintCount: number;
    uniqueScenarioRefCount: number;
    humanReviewedHintCount: number;
    strategyCoveredHintCount: number;
    benchmarkCoveredHintCount: number;
    selectedDeckSmoke: boolean;
    aiDeckPoolSnapshotCount: number;
  };
  removalConditions: string[];
};

export type AiSupportReadinessContract = {
  schemaVersion: "netgrid.ai-support-readiness.v1";
  readinessId: string;
  sets: CardSetAiReadiness[];
};

const activeReadinessContract = validateReadinessContract(
  readinessData as unknown,
);

export function activeAiSupportReadinessContract(): AiSupportReadinessContract {
  return structuredClone(activeReadinessContract);
}

export function aiSupportReadinessForSet(
  setId: string,
): CardSetAiReadiness | undefined {
  const readiness = activeReadinessContract.sets.find(
    (candidate) => candidate.setId === setId,
  );
  return readiness ? structuredClone(readiness) : undefined;
}

export function aiSupportStageReady(
  setId: string,
  stage: AiSupportReadinessStage,
): boolean {
  return aiSupportReadinessForSet(setId)?.stages[stage].ready === true;
}

function validateReadinessContract(value: unknown): AiSupportReadinessContract {
  if (!isRecord(value)) throw new Error("ai_support_readiness_invalid");
  if (value.schemaVersion !== "netgrid.ai-support-readiness.v1") {
    throw new Error("ai_support_readiness_schema_unsupported");
  }
  if (typeof value.readinessId !== "string" || !Array.isArray(value.sets)) {
    throw new Error("ai_support_readiness_invalid");
  }

  const sets = value.sets.map(validateSetReadiness);
  if (new Set(sets.map((entry) => entry.setId)).size !== sets.length) {
    throw new Error("ai_support_readiness_duplicate_set");
  }
  return {
    schemaVersion: value.schemaVersion,
    readinessId: value.readinessId,
    sets,
  };
}

function validateSetReadiness(value: unknown): CardSetAiReadiness {
  if (
    !isRecord(value) ||
    !isRecord(value.stages) ||
    !isRecord(value.evidence)
  ) {
    throw new Error("ai_support_readiness_set_invalid");
  }
  const stageValues = value.stages;
  const evidenceValues = value.evidence;
  if (
    typeof value.setId !== "string" ||
    value.technicalEligibilityStatus !== "ai_supported" ||
    !isReadinessStage(value.highestApprovedStage) ||
    !Array.isArray(value.removalConditions) ||
    !value.removalConditions.every((entry) => typeof entry === "string")
  ) {
    throw new Error("ai_support_readiness_set_invalid");
  }

  const stages = Object.fromEntries(
    AI_SUPPORT_READINESS_STAGES.map((stage) => {
      const state = stageValues[stage];
      if (
        !isRecord(state) ||
        typeof state.ready !== "boolean" ||
        typeof state.reason !== "string"
      ) {
        throw new Error("ai_support_readiness_stage_invalid");
      }
      return [stage, { ready: state.ready, reason: state.reason }];
    }),
  ) as Record<AiSupportReadinessStage, AiSupportReadinessStageState>;

  const approvedIndex = AI_SUPPORT_READINESS_STAGES.indexOf(
    value.highestApprovedStage,
  );
  AI_SUPPORT_READINESS_STAGES.forEach((stage, index) => {
    if (stages[stage].ready !== index <= approvedIndex) {
      throw new Error("ai_support_readiness_stage_order_invalid");
    }
  });

  const evidenceKeys = [
    "cardCount",
    "aiSupportedCardCount",
    "activeHintCount",
    "compiledHintCount",
    "uniqueScenarioRefCount",
    "humanReviewedHintCount",
    "strategyCoveredHintCount",
    "benchmarkCoveredHintCount",
    "aiDeckPoolSnapshotCount",
  ] as const;
  const numericEvidence = Object.fromEntries(
    evidenceKeys.map((key) => [
      key,
      readNonNegativeIntegerEvidence(evidenceValues, key),
    ]),
  ) as Record<(typeof evidenceKeys)[number], number>;
  if (typeof evidenceValues.selectedDeckSmoke !== "boolean") {
    throw new Error("ai_support_readiness_evidence_invalid");
  }

  return {
    setId: value.setId,
    technicalEligibilityStatus: value.technicalEligibilityStatus,
    highestApprovedStage: value.highestApprovedStage,
    stages,
    evidence: {
      ...numericEvidence,
      selectedDeckSmoke: evidenceValues.selectedDeckSmoke,
    },
    removalConditions: [...value.removalConditions],
  };
}

function readNonNegativeIntegerEvidence(
  evidence: Record<string, unknown>,
  key: string,
): number {
  const value = evidence[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("ai_support_readiness_evidence_invalid");
  }
  return value;
}

function isReadinessStage(value: unknown): value is AiSupportReadinessStage {
  return (
    typeof value === "string" &&
    (AI_SUPPORT_READINESS_STAGES as readonly string[]).includes(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

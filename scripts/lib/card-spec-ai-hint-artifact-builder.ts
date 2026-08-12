import { fingerprint } from "../../packages/cards/src/index";
import {
  cardSpecRuntimeDefinitionIds,
  cardSpecSourceRefs,
  CS06_CARD_DEFINITION_IDS,
} from "../../packages/cards/src/engine/index";
import { cardSpecPlanningCards } from "../../packages/cards/src/planning/index";
import { format } from "prettier";

import aiSupportScenarioData from "../../data/scenarios/card-support-ai-supported-current.json";
import {
  CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type CardSpecAiHintArtifact,
} from "../../packages/ai/src/ai-hint-contracts";
import { deriveCardSpecAiHint } from "../../packages/ai/src/card-spec-ai-hint-compiler";

export {
  CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  type CardSpecAiHintArtifact,
} from "../../packages/ai/src/ai-hint-contracts";

type PlanningEntry = ReturnType<typeof cardSpecPlanningCards>[number];

type AiSupportScenarioPack = {
  schemaVersion: string;
  scenarioPackId: string;
  status: string;
  scenarios: Array<{
    id: string;
    coversCards: string[];
  }>;
};

export function buildCardSpecAiHintArtifact(options?: {
  entries?: readonly PlanningEntry[];
  scenarioPack?: AiSupportScenarioPack;
}): CardSpecAiHintArtifact {
  const canonicalEntries = cardSpecPlanningCards();
  const entries = options?.entries ?? canonicalEntries;
  const scenarioPack = options?.scenarioPack ?? aiSupportScenarioData;
  const activeIds = new Set(cardSpecRuntimeDefinitionIds());
  const cs06Ids = new Set<string>(CS06_CARD_DEFINITION_IDS);
  const sourceRefs = cardSpecSourceRefs();
  const classicIds = sourceRefs
    .filter(
      (ref) =>
        ref.sourcePath.includes("/specs/classic/") &&
        activeIds.has(ref.cardDefinitionId),
    )
    .map((ref) => ref.cardDefinitionId);
  const testsetIds = sourceRefs
    .filter(
      (ref) =>
        ref.sourcePath.includes("/specs/testset/") &&
        activeIds.has(ref.cardDefinitionId),
    )
    .map((ref) => ref.cardDefinitionId);
  const proteusIds = sourceRefs
    .filter(
      (ref) =>
        ref.sourcePath.includes("/specs/proteus/") &&
        activeIds.has(ref.cardDefinitionId) &&
        !cs06Ids.has(ref.cardDefinitionId),
    )
    .map((ref) => ref.cardDefinitionId);
  const originalsetIds = sourceRefs
    .filter(
      (ref) =>
        ref.sourcePath.includes("/specs/originalset-v1/") &&
        activeIds.has(ref.cardDefinitionId) &&
        !cs06Ids.has(ref.cardDefinitionId),
    )
    .map((ref) => ref.cardDefinitionId);
  const expectedIds = [
    ...CS06_CARD_DEFINITION_IDS,
    ...testsetIds,
    ...classicIds,
    ...proteusIds,
    ...originalsetIds,
  ].sort(compareText);
  if (
    CS06_CARD_DEFINITION_IDS.length !== 10 ||
    testsetIds.length !== 36 ||
    classicIds.length !== 54 ||
    proteusIds.length !== 151 ||
    originalsetIds.length !== 367 ||
    expectedIds.length !== 618 ||
    new Set(expectedIds).size !== 618
  )
    throw new Error(
      `card_spec_ai_hint_artifact_expected_partition_mismatch: cs06=${CS06_CARD_DEFINITION_IDS.length},testset=${testsetIds.length},classic=${classicIds.length},proteus=${proteusIds.length},originalset=${originalsetIds.length},total=${expectedIds.length}`,
    );
  assertExactIds(
    "card_spec_ai_hint_artifact_runtime_partition",
    [...activeIds].sort(compareText),
    expectedIds,
  );
  const actualIds = entries
    .map((entry) => entry.definition.id)
    .sort(compareText);
  assertExactIds("card_spec_ai_hint_artifact_input", actualIds, expectedIds);

  const scenario = scenarioPack.scenarios.find(
    (candidate) => candidate.id === "active_card_support_ai_supported",
  );
  if (scenarioPack.status !== "ai_supported" || scenario === undefined)
    throw new Error("card_spec_ai_hint_artifact_missing_support_scenario");
  for (const cardId of expectedIds)
    if (!scenario.coversCards.includes(cardId))
      throw new Error(`card_spec_ai_hint_artifact_missing_support: ${cardId}`);

  const evidenceInput = {
    schemaVersion: scenarioPack.schemaVersion,
    scenarioPackId: scenarioPack.scenarioPackId,
    status: scenarioPack.status,
    scenario: {
      id: scenario.id,
      coversCards: [...scenario.coversCards].sort(compareText),
    },
  };
  const cards = [...entries]
    .sort((left, right) => compareText(left.definition.id, right.definition.id))
    .map((entry) => ({
      cardId: entry.definition.id,
      cardRulesFingerprint: entry.planning.cardRulesFingerprint,
      planningAnnotationsFingerprint:
        entry.planning.planningAnnotationsFingerprint,
      hint: deriveCardSpecAiHint(entry),
    }));

  return {
    schemaVersion: CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
    compilerVersion: CARD_SPEC_AI_HINT_COMPILER_VERSION,
    evidence: {
      scenarioPackId: scenarioPack.scenarioPackId,
      scenarioId: scenario.id,
      status: "ai_supported",
      fingerprint: fingerprint("card-spec-ai-hint-evidence-v2", evidenceInput),
    },
    cardIds: expectedIds,
    cards,
  };
}

export async function serializeCardSpecAiHintArtifact(
  artifact = buildCardSpecAiHintArtifact(),
): Promise<string> {
  return format(JSON.stringify(artifact), { parser: "json" });
}

function assertExactIds(
  field: string,
  actual: readonly string[],
  expected: readonly string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  )
    throw new Error(`${field}_mismatch: ${actual.join(",")}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

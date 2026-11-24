import type { CardDefinitionId } from "../../packages/shared/src/index";
import { fingerprint } from "../../packages/cards/src/index";
import { cardSpecRuntimeDefinitionIds } from "../../packages/cards/src/engine/index";
import { listPlanningCardsWithFacts } from "../../packages/cards/src/planning/index";
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

type PlanningEntry = ReturnType<typeof listPlanningCardsWithFacts>[number];

type AiSupportScenarioPack = {
  schemaVersion: string;
  scenarioPackId: string;
  status: string;
  scenarios: Array<{
    id: string;
    coversCards: CardDefinitionId[];
  }>;
};

export function buildCardSpecAiHintArtifact(options?: {
  entries?: readonly PlanningEntry[];
  scenarioPack?: AiSupportScenarioPack;
}): CardSpecAiHintArtifact {
  const canonicalEntries = listPlanningCardsWithFacts();
  const entries = options?.entries ?? canonicalEntries;
  const scenarioPack = options?.scenarioPack ?? aiSupportScenarioData;
  const expectedIds = [...cardSpecRuntimeDefinitionIds()].sort(compareCardIds);
  const actualIds = entries.map((entry) => entry.facts.id).sort(compareCardIds);
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
      coversCards: [...scenario.coversCards].sort(compareCardIds),
    },
  };
  const cards = [...entries]
    .sort((left, right) => compareCardIds(left.facts.id, right.facts.id))
    .map((entry) => ({
      cardId: entry.facts.id,
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
  actual: readonly CardDefinitionId[],
  expected: readonly CardDefinitionId[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  )
    throw new Error(`${field}_mismatch: ${actual.join(",")}`);
}

function compareCardIds(
  left: CardDefinitionId,
  right: CardDefinitionId,
): number {
  return left - right;
}

import { fingerprint } from "../../packages/cards/src/index";
import {
  CS06_CARD_DEFINITION_IDS,
  cs06PlanningCards,
} from "../../packages/cards/src/planning/index";

import aiSupportScenarioData from "../../data/scenarios/card-support-ai-supported-current.json";
import {
  CS06_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  CS06_AI_HINT_COMPILER_VERSION,
  type Cs06AiHintArtifact,
} from "../../packages/ai/src/ai-hint-contracts";
import { deriveCs06AiHint } from "../../packages/ai/src/cs06-ai-hint-compiler";

export {
  CS06_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  type Cs06AiHintArtifact,
} from "../../packages/ai/src/ai-hint-contracts";

type PlanningEntry = ReturnType<typeof cs06PlanningCards>[number];

type AiSupportScenarioPack = {
  schemaVersion: string;
  scenarioPackId: string;
  status: string;
  scenarios: Array<{
    id: string;
    coversCards: string[];
  }>;
};

export function buildCs06AiHintArtifact(options?: {
  entries?: readonly PlanningEntry[];
  scenarioPack?: AiSupportScenarioPack;
}): Cs06AiHintArtifact {
  const entries = options?.entries ?? cs06PlanningCards();
  const scenarioPack = options?.scenarioPack ?? aiSupportScenarioData;
  const expectedIds = [...CS06_CARD_DEFINITION_IDS].sort(compareText);
  const actualIds = entries
    .map((entry) => entry.definition.id)
    .sort(compareText);
  assertExactIds("cs06_ai_hint_artifact_input", actualIds, expectedIds);

  const scenario = scenarioPack.scenarios.find(
    (candidate) => candidate.id === "active_card_support_ai_supported",
  );
  if (scenarioPack.status !== "ai_supported" || scenario === undefined)
    throw new Error("cs06_ai_hint_artifact_missing_support_scenario");
  for (const cardId of expectedIds)
    if (!scenario.coversCards.includes(cardId))
      throw new Error(`cs06_ai_hint_artifact_missing_support: ${cardId}`);

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
      hint: deriveCs06AiHint(entry),
    }));

  return {
    schemaVersion: CS06_AI_HINT_ARTIFACT_SCHEMA_VERSION,
    compilerVersion: CS06_AI_HINT_COMPILER_VERSION,
    evidence: {
      scenarioPackId: scenarioPack.scenarioPackId,
      scenarioId: scenario.id,
      status: "ai_supported",
      fingerprint: fingerprint("cs06-ai-hint-evidence-v1", evidenceInput),
    },
    cardIds: expectedIds,
    cards,
  };
}

export function serializeCs06AiHintArtifact(
  artifact = buildCs06AiHintArtifact(),
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "../packages/ai/src/ai-hints";
import { buildActionSemanticCandidates } from "../packages/ai/src/action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../packages/ai/src/actions/action-card-semantic-profiles";
import { buildDeckCapabilityProfile } from "../packages/ai/src/deck-capabilities";
import { buildDeckStrategyProfile } from "../packages/ai/src/deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "../packages/ai/src/deck-strategy-snapshot";
import type { AiDecisionCheckpointV1 } from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-runner";
import { CARD_IMPLEMENTATIONS_BY_DEFINITION_ID } from "../packages/engine/src/card-implementations/registry";
import { CARD_DEFINITIONS_BY_ID } from "../packages/shared/src/card-definitions";

type JsonRecord = Record<string, unknown>;

type Finding = {
  kind: string;
  cardId?: string;
  [key: string]: unknown;
};

const FIELD_CONSUMER_CONTRACTS: Readonly<Record<string, readonly string[]>> = {
  actionCapacityProfiles: [
    "action-card-semantic-profiles",
    "legal-action-capacity-contract",
    "action-capacity-runtime-scoring",
  ],
  actionStrategySupportPairs: [
    "action-card-semantic-profiles",
    "strategic-action-fit",
  ],
  actionTacticSignals: [
    "action-card-semantic-profiles",
    "semantic-runtime-scoring",
  ],
  aiSupportStatus: ["ai-approval-gates"],
  breakerProfile: [
    "breaker-ontology-consumer",
    "deck-capabilities",
    "run-path-quote",
  ],
  cardId: ["hint-definition-join"],
  cardType: ["hint-definition-join", "hint-metadata-gate"],
  conditions: ["action-card-semantic-profiles", "semantic-hard-gates"],
  costProfile: [
    "breaker-ontology-consumer",
    "deck-doctrine-strategy",
    "trace-bid-assessment",
  ],
  effects: [
    "deck-capabilities",
    "action-card-semantic-profiles",
    "runtime-value-consumers",
  ],
  functionSignals: ["deck-doctrine-strategy"],
  lineSupport: ["deck-doctrine-strategy", "action-card-semantic-profiles"],
  manualNotes: ["ai-hint-inspector"],
  planRoles: ["deck-capabilities", "deck-doctrine-strategy", "tactical-plans"],
  quality: ["hint-quality-gate", "deck-hint-consumer-audit"],
  requiredMechanics: ["hint-metadata-gate", "card-support-gates"],
  riskTags: ["action-card-semantic-profiles", "semantic-risk-consumers"],
  roles: ["deck-capabilities", "deck-doctrine-card-roles", "tactical-plans"],
  scenarioRefs: ["hint-metadata-gate", "scenario-coverage"],
  side: ["hint-definition-join", "hint-metadata-gate"],
  strategicRole: ["deck-doctrine-strategy", "action-card-semantic-profiles"],
  strategySupportPairs: [
    "deck-opening-hand",
    "deck-doctrine-strategy",
  ],
  strategyAnchors: ["deck-doctrine-strategy"],
  tacticSignals: ["action-card-semantic-profiles"],
  targetProfiles: ["action-card-semantic-profiles", "target-choice-semantics"],
  valueHints: ["runtime-value-consumers", "deck-opening-hand"],
  remoteRole: [
    "deck-doctrine-strategy",
    "remote-role-ontology-consumer",
  ],
};

const args = process.argv.slice(2);
const checkpointArgument = optionValue("--checkpoint");
if (!checkpointArgument) {
  throw new Error(
    "Usage: tsx scripts/audit-ai-deck-hint-consumers.ts --checkpoint <checkpoint.json> [--exclude-card-id <cardId>]... [--write <report.json>]",
  );
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const checkpointPath = path.resolve(repoRoot, checkpointArgument);
const excludedCardIds = new Set(optionValues("--exclude-card-id"));
const checkpoint = readJson(
  checkpointPath,
) as unknown as AiDecisionCheckpointV1;
const capturedSnapshot = checkpoint.deckSnapshot as AiDeckStrategyDeckSnapshot;
if (!capturedSnapshot?.cards || !Array.isArray(capturedSnapshot.cards)) {
  throw new Error(`Checkpoint has no deckSnapshot.cards: ${checkpointPath}`);
}
const deckSnapshot: AiDeckStrategyDeckSnapshot = {
  ...capturedSnapshot,
  cards: capturedSnapshot.cards.filter(
    (card) => !excludedCardIds.has(card.cardId),
  ),
};

const blockingFindings: Finding[] = [];
const warnings: Finding[] = [];
const checkpointResult = runAiDecisionCheckpoint(structuredClone(checkpoint));
if (
  !checkpointResult.ok ||
  !checkpointResult.decision ||
  !checkpointResult.selectedAction
) {
  blockingFindings.push({
    kind: "checkpoint_behavior_failed",
    code: checkpointResult.code ?? null,
    message: checkpointResult.message,
  });
}

const input = checkpointResult.input;
const capabilityProfile = buildDeckCapabilityProfile({
  side: deckSnapshot.side,
  playerView: input.playerView,
  legalActions: input.legalActions,
  deckSnapshot,
});
const strategyProfile = buildDeckStrategyProfile(deckSnapshot);
const visibleDefinitionsByInstanceId = Object.fromEntries(
  visibleCards(input.playerView)
    .filter((card) => typeof card.definitionId === "string")
    .map((card) => [card.instanceId, card.definitionId]),
);
const semanticCandidates = buildActionSemanticCandidates({
  legalActions: input.legalActions,
  observerSide: input.side,
  stateVersion: input.playerView.stateVersion,
  visibleSourceDefinitionsByInstanceId: visibleDefinitionsByInstanceId,
  cardSemanticProfilesByDefinitionId:
    buildActionCardSemanticProfilesByDefinitionId(),
});

const cards = deckSnapshot.cards.map(({ cardId, quantity }) => {
  const hint = AI_HINTS_BY_CARD.get(cardId) as JsonRecord | undefined;
  const runtimeCard = RUNTIME_CARDS[cardId];
  const sharedDefinition = CARD_DEFINITIONS_BY_ID[cardId];
  const implementation = CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[cardId];
  if (!hint) {
    blockingFindings.push({ cardId, kind: "missing_active_hint" });
  }
  if (!runtimeCard || !sharedDefinition) {
    blockingFindings.push({
      cardId,
      kind: "missing_card_definition",
      runtimeCardPresent: Boolean(runtimeCard),
      sharedDefinitionPresent: Boolean(sharedDefinition),
    });
  }
  if (hint && hint.side !== deckSnapshot.side) {
    blockingFindings.push({
      cardId,
      kind: "deck_side_mismatch",
      expectedSide: deckSnapshot.side,
      actualSide: hint.side,
    });
  }
  if (hint && runtimeCard && hint.cardType !== runtimeCard.type) {
    blockingFindings.push({
      cardId,
      kind: "hint_card_type_mismatch",
      expectedCardType: runtimeCard.type,
      actualCardType: hint.cardType ?? null,
    });
  }
  const quality = objectValue(hint?.quality);
  if (
    hint &&
    (quality?.hintReviewed !== true || quality.needsHumanReview === true)
  ) {
    blockingFindings.push({
      cardId,
      kind: "hint_not_fully_reviewed",
      hintReviewed: quality?.hintReviewed ?? null,
      needsHumanReview: quality?.needsHumanReview ?? null,
    });
  }

  const populatedFields = hint ? Object.keys(hint).sort() : [];
  const fieldsWithoutConsumerContract = populatedFields.filter(
    (field) => !FIELD_CONSUMER_CONTRACTS[field],
  );
  if (fieldsWithoutConsumerContract.length > 0) {
    blockingFindings.push({
      cardId,
      kind: "hint_field_without_consumer_contract",
      fields: fieldsWithoutConsumerContract,
    });
  }

  const implementationContract = inspectImplementationContract(
    cardId,
    hint,
    implementation as unknown as JsonRecord | undefined,
    blockingFindings,
  );
  const cardCandidates = semanticCandidates.filter(
    (candidate) => candidate.sourceDefinitionId === cardId,
  );
  const bankTool = [
    ...(capabilityProfile.runner?.economyBankTools ?? []),
    ...(capabilityProfile.corp?.economyBankTools ?? []),
  ].find((tool) => tool.cardId === cardId);

  return {
    cardId,
    title: runtimeCard?.title ?? sharedDefinition?.title ?? cardId,
    quantity,
    hint: {
      present: Boolean(hint),
      reviewed:
        quality?.hintReviewed === true && quality.needsHumanReview !== true,
      side: hint?.side ?? null,
      cardType: hint?.cardType ?? null,
      populatedFields,
      consumerContracts: Object.fromEntries(
        populatedFields.flatMap((field) =>
          FIELD_CONSUMER_CONTRACTS[field]
            ? [[field, FIELD_CONSUMER_CONTRACTS[field]]]
            : [],
        ),
      ),
    },
    implementation: implementationContract,
    consumers: {
      semanticCandidateActionIds: cardCandidates.map(
        (candidate) => candidate.actionId,
      ),
      semanticSignals: uniqueStrings(
        cardCandidates.flatMap((candidate) => candidate.actionTacticSignals),
      ),
      bankTool: bankTool ?? null,
    },
  };
});

validateBankBindings(capabilityProfile, input, blockingFindings);
validateSelectedDecision(
  checkpointResult,
  semanticCandidates,
  capabilityProfile,
  blockingFindings,
);

const selectedCandidate = semanticCandidates.find(
  (candidate) => candidate.actionId === checkpointResult.decision?.actionId,
);
const selectedDefinitionId = selectedCandidate?.sourceDefinitionId ?? null;
const report = {
  schemaVersion: "ai-deck-hint-consumer-audit-v2",
  semanticSource: "data/ai/ai-card-hints-active.json",
  checkpoint: {
    path: relativeRepoPath(checkpointPath),
    checkpointId: checkpoint.checkpointId,
    matchId: checkpoint.source.matchId,
    behaviorPassed: checkpointResult.ok,
  },
  scope: {
    side: deckSnapshot.side,
    capturedUniqueCards: capturedSnapshot.cards.length,
    auditedUniqueCards: deckSnapshot.cards.length,
    auditedCardCount: deckSnapshot.cards.reduce(
      (sum, card) => sum + card.quantity,
      0,
    ),
    excludedCardIds: [...excludedCardIds].sort(),
  },
  cards,
  consumers: {
    capabilityProfile: {
      searchTools:
        capabilityProfile.runner?.searchAccess.tools.map(
          (tool) => tool.cardId,
        ) ?? [],
      bankTools: [
        ...(capabilityProfile.runner?.economyBankTools ?? []),
        ...(capabilityProfile.corp?.economyBankTools ?? []),
      ],
    },
    strategyProfile: {
      primaryStrategies: strategyProfile.primaryStrategies,
      secondaryStrategies: strategyProfile.secondaryStrategies,
      functionSignalCounts: strategyProfile.functionSignalCounts,
    },
    decision: {
      actionId: checkpointResult.decision?.actionId ?? null,
      sourceDefinitionId: selectedDefinitionId,
      legal: Boolean(checkpointResult.selectedAction),
      semanticCandidatePresent: Boolean(selectedCandidate),
      scoreBreakdown:
        checkpointResult.decision?.decisionDebug?.scoreBreakdown ?? [],
      decisionChain:
        checkpointResult.decision?.decisionDebug?.decisionChain ?? null,
    },
  },
  result: {
    status: blockingFindings.length === 0 ? "ok" : "failed",
    blockingFindingCount: blockingFindings.length,
    warningCount: warnings.length,
  },
  blockingFindings,
  warnings,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
const writeArgument = optionValue("--write");
if (writeArgument) {
  const reportPath = path.resolve(repoRoot, writeArgument);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, serialized, "utf8");
}
process.stdout.write(serialized);
if (blockingFindings.length > 0) process.exitCode = 1;

function inspectImplementationContract(
  cardId: string,
  hint: JsonRecord | undefined,
  implementation: JsonRecord | undefined,
  findings: Finding[],
): JsonRecord {
  const abilities = arrayValue(implementation?.abilities).filter(isJsonRecord);
  const engineEffects = abilities.flatMap((ability) =>
    arrayValue(ability.effects).filter(isJsonRecord),
  );
  const effectKinds = uniqueStrings(engineEffects.map((effect) => effect.kind));
  const limits = abilities
    .map((ability) => objectValue(ability.limit))
    .filter((limit): limit is JsonRecord => Boolean(limit));
  const hintEffects = arrayValue(hint?.effects).filter(isJsonRecord);
  const hintFunctionSignals = stringSet(hint?.functionSignals);
  const hintEffectKinds = stringSet(hintEffects.map((effect) => effect.kind));

  const addHostedEffects = engineEffects.filter(
    (effect) => effect.kind === "add_hosted_credits",
  );
  if (addHostedEffects.length > 0) {
    const amounts = addHostedEffects
      .map((effect) => effect.amount)
      .filter((amount): amount is number => typeof amount === "number");
    const finitePoolEffects = hintEffects.filter(
      (effect) => effect.kind === "finite_economy_pool",
    );
    const bankLoadEffects = hintEffects.filter(
      (effect) =>
        effect.kind === "counter_economy" &&
        effect.economyMode === "bank_load" &&
        effect.resource === "credits",
    );
    const hintHostedCreditAddAmounts = [
      ...finitePoolEffects,
      ...bankLoadEffects,
    ]
      .map((effect) => effect.amount)
      .filter((amount): amount is number => typeof amount === "number");
    const hasFinitePoolContract =
      finitePoolEffects.length > 0 &&
      hintFunctionSignals.has("economy.finite_pool") &&
      hintEffectKinds.has("finite_economy_pool");
    const hasBankLoadContract =
      bankLoadEffects.length > 0 &&
      hintFunctionSignals.has("economy.counter") &&
      hintEffectKinds.has("counter_economy");
    if (
      !hintFunctionSignals.has("economy.temporary_resource_bank") ||
      (!hasFinitePoolContract && !hasBankLoadContract) ||
      !amounts.every((amount) =>
        hintHostedCreditAddAmounts.includes(amount),
      )
    ) {
      findings.push({
        cardId,
        kind: "hosted_credit_add_hint_mismatch",
        engineAmounts: amounts,
        hintHostedCreditAddAmounts,
      });
    }
  }
  const takeHostedEffects = engineEffects.filter(
    (effect) => effect.kind === "take_hosted_credits",
  );
  if (takeHostedEffects.length > 0) {
    const modes = uniqueStrings(takeHostedEffects.map((effect) => effect.mode));
    if (
      !hintFunctionSignals.has("economy.temporary_resource_bank") ||
      !hintFunctionSignals.has("economy.action") ||
      !hintEffectKinds.has("action_economy")
    ) {
      findings.push({
        cardId,
        kind: "hosted_credit_take_hint_mismatch",
        engineModes: modes,
      });
    }
  }
  return {
    present: Boolean(implementation),
    abilityCount: abilities.length,
    effectKinds,
    limits,
    hostedCreditContractChecked:
      addHostedEffects.length > 0 || takeHostedEffects.length > 0,
  };
}

function validateBankBindings(
  capabilityProfile: ReturnType<typeof buildDeckCapabilityProfile>,
  input: typeof checkpointResult.input,
  findings: Finding[],
): void {
  const tools = [
    ...(capabilityProfile.runner?.economyBankTools ?? []),
    ...(capabilityProfile.corp?.economyBankTools ?? []),
  ];
  for (const tool of tools) {
    const visibleInstanceIds = new Set(
      visibleCards(input.playerView)
        .filter((card) => card.definitionId === tool.cardId)
        .map((card) => card.instanceId),
    );
    const expectedBuildActionIds = input.legalActions
      .filter(
        (action) =>
          visibleInstanceIds.has(String(action.source)) &&
          action.payload?.cardImplementationAddsHostedCredits === true,
      )
      .map((action) => action.actionId)
      .sort();
    const expectedCashOutActionIds = input.legalActions
      .filter(
        (action) =>
          visibleInstanceIds.has(String(action.source)) &&
          action.payload?.cardImplementationTakesHostedCredits === true,
      )
      .map((action) => action.actionId)
      .sort();
    if (
      stableJson(tool.buildActionIds) !== stableJson(expectedBuildActionIds) ||
      stableJson(tool.cashOutActionIds) !== stableJson(expectedCashOutActionIds)
    ) {
      findings.push({
        cardId: tool.cardId,
        kind: "bank_legal_action_binding_mismatch",
        actualBuildActionIds: tool.buildActionIds,
        expectedBuildActionIds,
        actualCashOutActionIds: tool.cashOutActionIds,
        expectedCashOutActionIds,
      });
    }
  }
}

function validateSelectedDecision(
  checkpointResult: ReturnType<typeof runAiDecisionCheckpoint>,
  candidates: ReturnType<typeof buildActionSemanticCandidates>,
  capabilityProfile: ReturnType<typeof buildDeckCapabilityProfile>,
  findings: Finding[],
): void {
  const actionId = checkpointResult.decision?.actionId;
  if (!actionId) return;
  const candidate = candidates.find((entry) => entry.actionId === actionId);
  if (!candidate) {
    findings.push({
      kind: "selected_action_without_semantic_candidate",
      actionId,
    });
    return;
  }
  const selectedIsCashOut =
    checkpointResult.selectedAction?.payload
      ?.cardImplementationTakesHostedCredits === true;
  if (!selectedIsCashOut) return;
  const tools = [
    ...(capabilityProfile.runner?.economyBankTools ?? []),
    ...(capabilityProfile.corp?.economyBankTools ?? []),
  ];
  const tool = tools.find((entry) => entry.cashOutActionIds.includes(actionId));
  const hasCashOutScore =
    checkpointResult.decision?.decisionDebug?.scoreBreakdown?.some(
      (component) => component.key === "runner_bank_cashout_gate",
    ) ?? false;
  if (
    !tool ||
    tool.cardId !== candidate.sourceDefinitionId ||
    !hasCashOutScore
  ) {
    findings.push({
      cardId: candidate.sourceDefinitionId,
      kind: "selected_bank_cashout_consumer_chain_incomplete",
      actionId,
      capabilityBound: Boolean(tool),
      semanticSourceDefinitionId: candidate.sourceDefinitionId ?? null,
      cashOutScorePresent: hasCashOutScore,
    });
  }
}

function visibleCards(playerView: typeof checkpointResult.input.playerView) {
  return [
    ...playerView.own.gripOrHq,
    ...(playerView.own.rig ?? []),
    ...playerView.own.heapOrArchives,
    ...playerView.own.scoreArea,
    ...playerView.servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
}

function optionValue(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function optionValues(name: string): string[] {
  return args.flatMap((arg, index) =>
    arg === name && args[index + 1] ? [args[index + 1]] : [],
  );
}

function readJson(filePath: string): JsonRecord {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonRecord;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function objectValue(value: unknown): JsonRecord | undefined {
  return isJsonRecord(value) ? value : undefined;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringSet(value: unknown): Set<string> {
  return new Set(
    arrayValue(value).filter(
      (entry): entry is string => typeof entry === "string",
    ),
  );
}

function uniqueStrings(values: readonly unknown[]): string[] {
  return [
    ...new Set(
      values.filter((value): value is string => typeof value === "string"),
    ),
  ].sort();
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function relativeRepoPath(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

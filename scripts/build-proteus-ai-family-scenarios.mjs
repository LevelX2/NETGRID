import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRelative =
  "data/scenarios/proteus-ai-family-decision-smokes-v1.json";
const outputPath = path.join(root, outputRelative);
const shouldWrite = process.argv.includes("--write");
const shouldCheck = process.argv.includes("--check");
const inventory = await readJson(
  "data/ai/proteus-ai-readiness-inventory-v1.json",
);

const specs = {
  access_ambush: {
    modelAssertions: ["access_risk_projected", "decline_or_pay_cost_bounded"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/bad-publicity.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/run-access-decision-model.test.ts"],
  },
  bad_publicity: {
    modelAssertions: [
      "visible_threshold_evaluated",
      "hidden_count_not_invented",
    ],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/bad-publicity.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/random-bad-publicity-model.test.ts"],
  },
  baseline: {
    modelAssertions: ["legal_action_only", "neutral_fallback_available"],
    engineEvidence: [
      "packages/engine/src/card-implementations/coverage.test.ts",
    ],
    aiEvidence: ["packages/ai/src/action-semantic-candidate.test.ts"],
  },
  complex_multi_ability: {
    modelAssertions: ["ability_binding_explicit", "follow_up_state_preserved"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/rule-contract-baseline-utilities.test.ts",
    ],
    aiEvidence: ["packages/ai/src/action-semantic-candidate.test.ts"],
  },
  hidden_resource: {
    modelAssertions: [
      "own_private_constraint_only",
      "opponent_identity_invariant",
    ],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/hidden-resource-virus-model.test.ts"],
  },
  random_outcome: {
    modelAssertions: ["future_outcome_not_predicted", "seed_replay_stable"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/random-dice-encounter-suite.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/random-bad-publicity-model.test.ts"],
  },
  run_modification: {
    modelAssertions: ["run_modifier_projected", "unknown_remote_preserved"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/run-access-decision-model.test.ts"],
  },
  target_choice: {
    modelAssertions: ["legal_target_only", "negative_choice_reason_present"],
    engineEvidence: [
      "packages/engine/src/game/choices/choice-validation.test.ts",
    ],
    aiEvidence: ["packages/ai/src/decision/target-choice-shadow.test.ts"],
  },
  temporary_action: {
    modelAssertions: ["duration_projected", "action_debt_expiry_projected"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/action-cost-timing.test.ts"],
  },
  virus_counter: {
    modelAssertions: ["runner_virus_separate", "corp_antibody_separate"],
    engineEvidence: [
      "packages/engine/src/game/counters/proteus-antibody-access.test.ts",
      "packages/engine/src/index-tests/proteus/rule-contract-baseline-utilities.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/hidden-resource-virus-model.test.ts"],
  },
  x_cost: {
    modelAssertions: ["legal_x_bounds_only", "post_action_reserve_projected"],
    engineEvidence: [
      "packages/engine/src/index-tests/proteus/variable-ice.test.ts",
    ],
    aiEvidence: ["packages/ai/src/actions/action-cost-timing.test.ts"],
  },
};

const scenarios = Object.entries(specs)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([family, spec]) => ({
    id: `proteus_${family}`,
    family,
    cards: inventory.cards
      .filter(
        (card) => card.primaryFamily === family && card.pilotDeckIds.length > 0,
      )
      .map((card) => card.cardId)
      .sort(),
    positiveDecisionAssertions: spec.modelAssertions,
    negativeDecisionAssertions: [
      "never_submit_non_legal_action",
      "never_cross_hidden_info_boundary",
      "never_invent_unprovided_cost_target_timing_or_outcome",
    ],
    engineEvidence: spec.engineEvidence,
    aiEvidence: spec.aiEvidence,
  }));

for (const scenario of scenarios) {
  assert(scenario.cards.length > 0, `No pilot cards for ${scenario.family}.`);
  for (const evidencePath of [
    ...scenario.engineEvidence,
    ...scenario.aiEvidence,
  ]) {
    await access(path.join(root, evidencePath));
  }
}

const pack = {
  schemaVersion: "netgrid.proteus-ai-family-scenarios.v1",
  scenarioPackId: "proteus-ai-family-decision-smokes-v1",
  asOf: "2026-07-09",
  status: "implemented_for_selected_deck_pilot",
  sourceInventory: "data/ai/proteus-ai-readiness-inventory-v1.json",
  invariants: {
    rulesEngineOnlyLegalActions: true,
    hiddenStateInvariance: true,
    deterministicReplayAndStateHash: true,
    futureRandomOutcomeAccess: false,
    cardTextParsingAllowed: false,
  },
  summary: {
    familyCount: scenarios.length,
    coveredPilotCardCount: scenarios.reduce(
      (sum, scenario) => sum + scenario.cards.length,
      0,
    ),
  },
  scenarios,
};

const serialized = `${JSON.stringify(pack, null, 2)}\n`;
if (shouldWrite) {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`Wrote ${outputRelative}.`);
} else if (shouldCheck) {
  const current = JSON.parse(await readFile(outputPath, "utf8"));
  assert(
    JSON.stringify(current) === JSON.stringify(pack),
    "Proteus family scenario pack is stale. Run build:proteus-ai-family-scenarios.",
  );
  console.log(
    `Proteus family scenarios current: ${scenarios.length} families, ${pack.summary.coveredPilotCardCount} pilot cards.`,
  );
} else {
  process.stdout.write(serialized);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

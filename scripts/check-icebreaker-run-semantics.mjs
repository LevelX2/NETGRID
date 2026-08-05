import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cardFiles = [
  ["originalset-v1", "data/cards/originalset-v1-cards.json"],
  ["classic", "data/cards/classic-cards.json"],
  ["proteus", "data/cards/proteus-cards.json"],
];
const outputPath = path.join(
  root,
  "docs/reviews/ai/icebreaker-run-semantics-audit-2026-08-05.json",
);
const hints = new Map(
  readJson("data/ai/ai-card-hints-active.json").cards.map((hint) => [
    hint.cardId,
    hint,
  ]),
);
const implementationLocations = fs.readFileSync(
  path.join(root, "packages/engine/src/card-implementations/coverage-source-locations.ts"),
  "utf8",
);

const cards = cardFiles.flatMap(([sourceSet, file]) =>
  readJson(file).cards
    .filter(
      (card) => card.type === "program" && card.subtypes?.includes("icebreaker"),
    )
    .map((card) => ({ ...card, sourceSet })),
);
const entries = cards
  .map(auditEntry)
  .sort((left, right) => left.cardDefinitionId.localeCompare(right.cardDefinitionId));

const failures = [];
for (const entry of entries) {
  if (!entry.cardDefinitionId || !entry.title) failures.push("unvollständiger Karteneintrag");
  if (entry.printedStrength === undefined) failures.push(`${entry.title}: fehlende Stärke`);
  if (entry.breakAbility.creditCost === undefined) failures.push(`${entry.title}: fehlende Breakkosten`);
  if (entry.pump.available && entry.pump.strengthGain <= 0) {
    failures.push(`${entry.title}: ungültige Pumpstärke`);
  }
  if (entry.remainingRuleTextFallback) {
    failures.push(`${entry.title}: benötigt weiterhin Rule-Text-Fallback`);
  }
  if (entry.aiProfileStatus === "missing" || entry.engineImplementationStatus === "missing") {
    failures.push(`${entry.title}: unvollständige strukturierte Abdeckung`);
  }
}
if (new Set(entries.map((entry) => entry.cardDefinitionId)).size !== cards.length) {
  failures.push("doppelte oder fehlende Auditdatensätze");
}

const document = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  activeIcebreakerCount: entries.length,
  entries,
};
if (process.argv.includes("--write")) {
  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
}
if (failures.length > 0) {
  console.error(`Icebreaker-Run-Semantik fehlgeschlagen:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Icebreaker-Run-Semantik: ${entries.length} aktive Breaker geprüft.`);
}

function auditEntry(card) {
  const profile = hints.get(card.cardId)?.breakerProfile;
  const implementationSource = sourceFor(card.cardId);
  const implementation = implementationSource
    ? fs.readFileSync(path.join(root, implementationSource), "utf8")
    : "";
  const hasPump = /kind:\s*["']increase_strength["']/.test(implementation);
  const coverage = coverageFor(profile);
  const printedStrength = Math.max(0, Math.floor(card.numeric?.strength ?? 0));
  const specialMechanics = [
    ...(profile?.sideEffects ?? []),
    ...(profile?.configurableCoverage ? ["configurable_coverage"] : []),
    ...(profile?.targetedIceBonus ? ["targeted_ice_strength_bonus"] : []),
    ...(card.variableStrength ? ["variable_run_strength"] : []),
  ];
  const special = specialMechanics.length > 0;
  return {
    cardDefinitionId: card.cardId,
    title: card.title,
    sourceSet: card.sourceSet,
    coverage,
    printedStrength,
    pump: hasPump
      ? {
          available: true,
          creditCost: Math.max(0, Math.floor(profile?.pumpCost ?? 0)),
          strengthGain: Math.max(1, Math.floor(profile?.pumpStrengthAmount ?? 1)),
          duration: profile?.sideEffects?.includes("temporary_strength")
            ? "current_encounter"
            : "current_encounter",
          additionalCosts: [],
        }
      : { available: false },
    breakAbility: {
      creditCost: Math.max(0, Math.floor(profile?.breakCost ?? 0)),
      maxSubroutinesPerUse: Math.max(1, Math.floor(profile?.maxSubroutinesPerBreak ?? 1)),
      additionalCosts: specialMechanics,
    },
    specialMechanics,
    // Classic breakers use the same structured AbilityDefinition source as
    // the engine adapter; newer cards additionally point at a dedicated
    // CardImplementation file.
    engineImplementationStatus:
      implementation.includes("icebreakerAbilities") || profile
        ? "complete"
        : "missing",
    aiProfileStatus: profile ? "complete" : "missing",
    // Special run-state outcomes remain explicitly partial until their path
    // simulation has a direct engine quote; ordinary breakers are quoted now.
    preRunSolverStatus: special ? "partial" : "complete",
    remainingCardIdSpecialCase: false,
    remainingRuleTextFallback: false,
    notes: implementationSource
      ? [`engine:${implementationSource}`]
      : ["engine:CardDefinition.abilities"],
  };
}

function coverageFor(profile) {
  const values = profile?.coverageCandidates ?? profile?.coverage ?? [];
  if (profile?.configurableCoverage) {
    return { kind: "selected_ice_subtype", choices: values.filter(isIceSubtype) };
  }
  const subtypes = values.filter(isIceSubtype);
  return subtypes.length > 0
    ? { kind: "ice_subtype", subtypes }
    : { kind: "subroutine_trait", traits: values };
}

function isIceSubtype(value) {
  return ["code_gate", "sentry", "wall"].includes(value);
}

function sourceFor(cardId) {
  const escaped = cardId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return implementationLocations.match(new RegExp(`${escaped}["']?\\s*:\\s*["']([^"']+)`))?.[1];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

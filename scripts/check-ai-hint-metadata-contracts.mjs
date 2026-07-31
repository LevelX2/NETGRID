#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
  );
}

function openingPairIsConsumed(pair) {
  return (
    pair.strategyId === "corp.fast_advance" ||
    (pair.strategyId === "corp.tag_trace_punish" &&
      ["enabler", "punish_payoff", "win_condition"].includes(pair.role)) ||
    (pair.strategyId === "corp.damage_kill" &&
      ["punish_payoff", "win_condition"].includes(pair.role))
  );
}

function validateFocusedDecisionTest(cardId, reference, hardErrors) {
  if (typeof reference !== "string") return false;
  const separatorIndex = reference.indexOf("::");
  const relativePath = reference.slice(0, separatorIndex).trim();
  const testTitle = reference.slice(separatorIndex + 2).trim();
  if (
    separatorIndex <= 0 ||
    relativePath.length === 0 ||
    testTitle.length === 0 ||
    path.isAbsolute(relativePath) ||
    !relativePath.endsWith(".test.ts")
  ) {
    hardErrors.push({
      kind: "invalid_focused_decision_test_reference",
      cardId,
      reference,
    });
    return true;
  }

  const absolutePath = path.resolve(REPO_ROOT, relativePath);
  const repositoryRelativePath = path.relative(REPO_ROOT, absolutePath);
  if (
    repositoryRelativePath.startsWith(`..${path.sep}`) ||
    repositoryRelativePath === ".."
  ) {
    hardErrors.push({
      kind: "invalid_focused_decision_test_reference",
      cardId,
      reference,
    });
    return true;
  }
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    hardErrors.push({
      kind: "missing_focused_decision_test_file",
      cardId,
      reference,
    });
    return true;
  }
  if (!fs.readFileSync(absolutePath, "utf8").includes(testTitle)) {
    hardErrors.push({
      kind: "missing_focused_decision_test_title",
      cardId,
      reference,
    });
  }
  return true;
}

export function buildAiHintMetadataContractReport() {
  const hints = readJson("data/ai/ai-card-hints-active.json");
  const contract = readJson("data/ai/ai-hint-metadata-contract-v1.json");
  const allowedValueKeys = new Set(contract.valueHints?.runtimeKeys ?? []);
  const runtimeMechanics = new Set(
    contract.requiredMechanics?.runtimeKeys ?? [],
  );
  const hardErrors = [];
  let valueHintAssignmentCount = 0;
  let runtimePairCount = 0;
  let evidenceOnlyPairCount = 0;
  let runtimeMechanicCount = 0;
  let evidenceOnlyMechanicCount = 0;
  let evidenceOnlyScenarioRefCount = 0;
  let focusedDecisionTestCount = 0;

  for (const card of hints.cards ?? []) {
    for (const [key, value] of Object.entries(card.valueHints ?? {})) {
      valueHintAssignmentCount += 1;
      if (!allowedValueKeys.has(key)) {
        hardErrors.push({
          kind: "untyped_value_hint",
          cardId: card.cardId,
          key,
        });
      }
      if (typeof value !== "number" || !Number.isFinite(value)) {
        hardErrors.push({
          kind: "invalid_value_hint",
          cardId: card.cardId,
          key,
        });
      }
      if (
        key === contract.valueHints?.remoteRootKey &&
        !(
          card.side === "corp" &&
          (card.cardType === "asset" || card.cardType === "upgrade")
        )
      ) {
        hardErrors.push({
          kind: "remote_root_value_on_non_root_card",
          cardId: card.cardId,
          key,
        });
      }
    }

    for (const pair of card.strategySupportPairs ?? []) {
      if (openingPairIsConsumed(pair) || card.cardType === "upgrade") {
        runtimePairCount += 1;
      } else {
        evidenceOnlyPairCount += 1;
      }
    }

    for (const mechanic of card.requiredMechanics ?? []) {
      if (runtimeMechanics.has(mechanic)) runtimeMechanicCount += 1;
      else evidenceOnlyMechanicCount += 1;
    }
    evidenceOnlyScenarioRefCount += (card.scenarioRefs ?? []).length;
    if (
      validateFocusedDecisionTest(
        card.cardId,
        card.quality?.focusedDecisionTest,
        hardErrors,
      )
    ) {
      focusedDecisionTestCount += 1;
    }
  }

  return {
    schemaVersion: "ai-hint-metadata-contract-report-v1",
    status: hardErrors.length === 0 ? "pass" : "fail",
    hardErrorCount: hardErrors.length,
    summary: {
      valueHintAssignmentCount,
      runtimePairCount,
      evidenceOnlyPairCount,
      runtimeMechanicCount,
      evidenceOnlyMechanicCount,
      evidenceOnlyScenarioRefCount,
      focusedDecisionTestCount,
    },
    hardErrors,
  };
}

const report = buildAiHintMetadataContractReport();
const json = process.argv.includes("--json");
if (process.argv.slice(2).some((arg) => arg !== "--json")) {
  throw new Error(`Unknown argument: ${process.argv.slice(2).join(" ")}`);
}
console.log(json ? JSON.stringify(report) : JSON.stringify(report, null, 2));
if (report.hardErrorCount > 0) process.exitCode = 1;

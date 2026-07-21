#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const ECONOMY_EFFECT_KINDS = new Set([
  "economy",
  "counter_economy",
  "action_economy",
  "finite_economy_pool",
  "start_of_turn_economy",
  "recurring_economy",
  "advanceable_economy",
  "agenda_reveal_economy",
  "trace_credit",
  "trash_credit",
  "install_discount",
  "rez_discount",
]);

const IMMEDIATE_SELF_LIQUID_KINDS = new Set([
  "economy",
  "counter_economy",
  "action_economy",
]);

const IMMEDIATE_TIMINGS = new Set(["action", "scored_activated"]);

const RESTRICTED_RESOURCES = new Set([
  "trash_credits",
  "run_credits",
  "advancement_counters",
]);

const RAW_GAIN_CREDIT_COMPARISON =
  /action\.type\s*[!=]==?\s*["']gain_credit["']|["']gain_credit["']\s*[!=]==?\s*action\.type/g;

const TARGET_CARD_IDS = [
  "onr_v1_193_corporate-coup",
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_154_broker",
];

const SCORED_AGENDA_ACTION_CONTRACTS = new Map([
  ["onr_v1_193_corporate-coup", 3],
  ["onr_v1_195_corporate-retreat", 2],
  ["onr_v1_206_marine-arcology", 3],
  ["onr_v1_209_political-coup", 3],
  ["onr_v1_210_political-overthrow", 3],
]);

export function buildAiEconomyContractAudit() {
  const hints = readJson("data/ai/ai-card-hints-active.json");
  const hintCards = Array.isArray(hints.cards) ? hints.cards : [];
  const sourceFiles = sourceFilesUnder("packages/ai/src");
  const rawGainCreditConsumers = sourceFiles
    .flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      const matches = [...source.matchAll(RAW_GAIN_CREDIT_COMPARISON)];
      return matches.length > 0
        ? [
            {
              file: relativePath(filePath),
              production: !filePath.endsWith(".test.ts"),
              comparisons: matches.length,
            },
          ]
        : [];
    })
    .sort((left, right) => left.file.localeCompare(right.file));

  const cardsWithBroadEconomy = [];
  const cardsWithFixedImmediateSelfLiquid = [];
  const cardsWithDynamicImmediateSelfLiquid = [];
  const cardsWithAutomaticOrTriggeredEconomy = [];
  const cardsWithRestrictedOrDiscountEconomy = [];
  const cardsWithPotentialOverlappingEffects = [];
  const effectOccurrencesByKind = new Map();

  for (const card of hintCards) {
    const effects = arrayValue(card.effects).filter(
      (effect) =>
        isRecord(effect) &&
        (ECONOMY_EFFECT_KINDS.has(effect.kind) ||
          effect.resource === "credits" ||
          effect.resource === "trash_credits"),
    );
    if (effects.length === 0) continue;

    cardsWithBroadEconomy.push(card.cardId);
    for (const effect of effects) {
      effectOccurrencesByKind.set(
        effect.kind,
        (effectOccurrencesByKind.get(effect.kind) ?? 0) + 1,
      );
    }

    const immediateSelfLiquid = effects.filter(
      (effect) =>
        IMMEDIATE_SELF_LIQUID_KINDS.has(effect.kind) &&
        IMMEDIATE_TIMINGS.has(effect.timing) &&
        effect.scope === card.side &&
        effect.resource === "credits",
    );
    if (immediateSelfLiquid.some((effect) => finiteNumber(effect.amount))) {
      cardsWithFixedImmediateSelfLiquid.push(card.cardId);
    }
    if (immediateSelfLiquid.some((effect) => !finiteNumber(effect.amount))) {
      cardsWithDynamicImmediateSelfLiquid.push(card.cardId);
    }
    if (
      effects.some(
        (effect) =>
          [
            "start_of_turn_economy",
            "recurring_economy",
            "agenda_reveal_economy",
          ].includes(effect.kind) ||
          ["start_of_turn", "turn_start", "when_scored"].includes(
            effect.timing,
          ),
      )
    ) {
      cardsWithAutomaticOrTriggeredEconomy.push(card.cardId);
    }
    if (
      effects.some(
        (effect) =>
          RESTRICTED_RESOURCES.has(effect.resource) ||
          [
            "install_discount",
            "rez_discount",
            "trash_credit",
            "trace_credit",
          ].includes(effect.kind),
      )
    ) {
      cardsWithRestrictedOrDiscountEconomy.push(card.cardId);
    }

    const overlapKeys = new Map();
    for (const effect of effects) {
      const key = stableJson([
        effect.timing ?? null,
        effect.scope ?? null,
        effect.resource ?? null,
        finiteNumber(effect.amount) ? effect.amount : null,
        effect.target ?? null,
      ]);
      overlapKeys.set(key, [...(overlapKeys.get(key) ?? []), effect.kind]);
    }
    const overlaps = [...overlapKeys.entries()]
      .filter(([, kinds]) => kinds.length > 1)
      .map(([key, kinds]) => ({ key, kinds: [...new Set(kinds)].sort() }));
    if (overlaps.length > 0) {
      cardsWithPotentialOverlappingEffects.push({
        cardId: card.cardId,
        overlaps,
      });
    }
  }

  const targetCards = Object.fromEntries(
    TARGET_CARD_IDS.map((cardId) => {
      const card = hintCards.find((candidate) => candidate.cardId === cardId);
      return [
        cardId,
        card
          ? {
              side: card.side,
              cardType: card.cardType,
              roles: arrayValue(card.roles),
              planRoles: arrayValue(card.planRoles),
              riskTags: arrayValue(card.riskTags),
              effects: arrayValue(card.effects),
            }
          : null,
      ];
    }),
  );
  const targetContractViolations = economyContractViolations(hintCards);

  return {
    schemaVersion: "ai-economy-contract-audit-v1",
    source: "data/ai/ai-card-hints-active.json",
    counts: {
      hintCards: hintCards.length,
      cardsWithBroadEconomy: cardsWithBroadEconomy.length,
      cardsWithFixedImmediateSelfLiquid:
        cardsWithFixedImmediateSelfLiquid.length,
      cardsWithDynamicImmediateSelfLiquid:
        cardsWithDynamicImmediateSelfLiquid.length,
      cardsWithAutomaticOrTriggeredEconomy:
        cardsWithAutomaticOrTriggeredEconomy.length,
      cardsWithRestrictedOrDiscountEconomy:
        cardsWithRestrictedOrDiscountEconomy.length,
      cardsWithPotentialOverlappingEffects:
        cardsWithPotentialOverlappingEffects.length,
      rawGainCreditProductionConsumers: rawGainCreditConsumers.filter(
        (entry) => entry.production,
      ).length,
      rawGainCreditTestConsumers: rawGainCreditConsumers.filter(
        (entry) => !entry.production,
      ).length,
      targetContractViolations: targetContractViolations.length,
    },
    effectOccurrencesByKind: Object.fromEntries(
      [...effectOccurrencesByKind.entries()].sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      ),
    ),
    classifications: {
      cardsWithBroadEconomy: cardsWithBroadEconomy.sort(),
      cardsWithFixedImmediateSelfLiquid:
        cardsWithFixedImmediateSelfLiquid.sort(),
      cardsWithDynamicImmediateSelfLiquid:
        cardsWithDynamicImmediateSelfLiquid.sort(),
      cardsWithAutomaticOrTriggeredEconomy:
        cardsWithAutomaticOrTriggeredEconomy.sort(),
      cardsWithRestrictedOrDiscountEconomy:
        cardsWithRestrictedOrDiscountEconomy.sort(),
    },
    findings: {
      cardsWithPotentialOverlappingEffects,
      rawGainCreditConsumers,
      targetContractViolations,
    },
    targetCards,
  };
}

function economyContractViolations(hintCards) {
  const violations = [];
  const cardsById = new Map(hintCards.map((card) => [card.cardId, card]));

  for (const [cardId, amount] of SCORED_AGENDA_ACTION_CONTRACTS) {
    const card = cardsById.get(cardId);
    if (!card) {
      violations.push(`${cardId}: missing hint`);
      continue;
    }
    const effects = arrayValue(card.effects);
    const payouts = effects.filter(
      (effect) =>
        effect.kind === "action_economy" &&
        effect.timing === "scored_activated" &&
        effect.scope === "corp" &&
        effect.resource === "credits" &&
        effect.amount === amount &&
        effect.economyMode === "liquid_payout",
    );
    if (payouts.length !== 1) {
      violations.push(
        `${cardId}: expected one ${amount}-credit liquid scored action, found ${payouts.length}`,
      );
    }
    const legacyPayouts = effects.filter(
      (effect) =>
        ["economy", "counter_economy"].includes(effect.kind) &&
        effect.timing === "scored_activated" &&
        effect.scope === "corp" &&
        effect.resource === "credits",
    );
    if (legacyPayouts.length > 0) {
      violations.push(
        `${cardId}: legacy scored economy effects overlap the action payout`,
      );
    }
  }

  requireFixedPool(
    cardsById,
    violations,
    "onr_v1_193_corporate-coup",
    15,
    "score_area",
    "when_scored",
  );
  requireFixedPool(
    cardsById,
    violations,
    "onr_v1_209_political-coup",
    12,
    "score_area",
    "when_scored",
  );
  requireFixedPool(
    cardsById,
    violations,
    "onr_v1_309_bbs-whispering-campaign",
    16,
    "remote",
    "action",
  );

  const bbs = cardsById.get("onr_v1_309_bbs-whispering-campaign");
  if (bbs) {
    const bbsPayouts = arrayValue(bbs.effects).filter(
      (effect) =>
        effect.kind === "action_economy" &&
        effect.amount === 2 &&
        effect.economyMode === "liquid_payout" &&
        effect.scope === "corp" &&
        effect.timing === "action",
    );
    if (bbsPayouts.length !== 1) {
      violations.push(
        `onr_v1_309_bbs-whispering-campaign: expected one 2-credit liquid action, found ${bbsPayouts.length}`,
      );
    }
    const overlappingPayouts = arrayValue(bbs.effects).filter(
      (effect) =>
        ["economy", "counter_economy"].includes(effect.kind) &&
        effect.resource === "credits" &&
        effect.scope === "corp" &&
        effect.timing === "action",
    );
    if (overlappingPayouts.length > 0) {
      violations.push(
        "onr_v1_309_bbs-whispering-campaign: overlapping legacy payout effects remain",
      );
    }
  }

  const broker = cardsById.get("onr_v1_154_broker");
  if (!broker) {
    violations.push("onr_v1_154_broker: missing hint");
  } else {
    const effects = arrayValue(broker.effects);
    if (
      !effects.some(
        (effect) =>
          effect.kind === "counter_economy" &&
          effect.amount === 3 &&
          effect.economyMode === "bank_load" &&
          effect.target === "economy.bank_load",
      )
    ) {
      violations.push("onr_v1_154_broker: missing 3-credit bank-load action");
    }
    if (
      !effects.some(
        (effect) =>
          effect.kind === "action_economy" &&
          effect.amountKind === "all_available" &&
          effect.economyMode === "bank_cashout" &&
          effect.target === "economy.bank_cashout_all",
      )
    ) {
      violations.push("onr_v1_154_broker: missing all-available bank cashout");
    }
    if (effects.some((effect) => effect.kind === "finite_economy_pool")) {
      violations.push(
        "onr_v1_154_broker: voluntary bank must not be a finite economy pool",
      );
    }
  }

  return violations;
}

function requireFixedPool(
  cardsById,
  violations,
  cardId,
  amount,
  scope,
  timing,
) {
  const card = cardsById.get(cardId);
  if (!card) return;
  const matchingPools = arrayValue(card.effects).filter(
    (effect) =>
      effect.kind === "finite_economy_pool" &&
      effect.amount === amount &&
      effect.economyMode === "fixed_pool" &&
      effect.resource === "credits" &&
      effect.scope === scope &&
      effect.timing === timing,
  );
  if (matchingPools.length !== 1) {
    violations.push(
      `${cardId}: expected one fixed ${amount}-credit pool, found ${matchingPools.length}`,
    );
  }
}

function readJson(relativeFilePath) {
  return JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, relativeFilePath), "utf8"),
  );
}

function sourceFilesUnder(relativeDirectory) {
  const result = [];
  const pending = [path.join(REPO_ROOT, relativeDirectory)];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        result.push(entryPath);
      }
    }
  }
  return result;
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).replaceAll("\\", "/");
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function stableJson(value) {
  return JSON.stringify(value);
}

function printSummary(report) {
  console.log("AI economy contract audit");
  for (const [key, value] of Object.entries(report.counts)) {
    console.log(`${key}: ${value}`);
  }
  console.log("target cards:");
  for (const [cardId, card] of Object.entries(report.targetCards)) {
    console.log(
      `- ${cardId}: ${card ? arrayValue(card.effects).length : "missing"} effects`,
    );
  }
  if (report.findings.targetContractViolations.length > 0) {
    console.log("target contract violations:");
    for (const violation of report.findings.targetContractViolations) {
      console.log(`- ${violation}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = buildAiEconomyContractAudit();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printSummary(report);
  }
  if (
    process.argv.includes("--check") &&
    report.findings.targetContractViolations.length > 0
  ) {
    process.exitCode = 1;
  }
}

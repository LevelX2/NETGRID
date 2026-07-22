#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const ACTION_EFFECT_KINDS = new Set([
  "extra_action",
  "action_penalty",
  "forgo_actions",
]);

const TARGET_CARD_IDS = [
  "onr_v1_117_valu-pak-software-bundle",
  "onr_v1_171_preying-mantis",
  "onr_v1_172_quest-for-cattekin",
  "onr_v1_187_wilson-weeflerunner-apprentice",
  "onr_v1_192_corporate-boon",
  "onr_v1_218_subsidiary-branch",
  "onr_v1_297_overtime-incentives",
  "onr_v1_289_edgerunner-inc-temps",
  "onr_v1_331_nevinyrral",
  "onr_v1_334_pacifica-regional-ai",
  "onr_proteus_046_corporate-guard-r-temps",
  "onr_proteus_131_bargain-with-viacox",
];

const EXTRA_ACTION_CONTRACTS = [
  {
    cardId: "onr_v1_192_corporate-boon",
    amount: 1,
    scope: "corp",
    timing: "scored_activated",
  },
  {
    cardId: "onr_v1_218_subsidiary-branch",
    amount: 1,
    scope: "corp",
    timing: "start_of_turn",
  },
  {
    cardId: "onr_v1_297_overtime-incentives",
    amount: 2,
    scope: "corp",
    timing: "action",
  },
  {
    cardId: "onr_v1_331_nevinyrral",
    amount: 1,
    scope: "corp",
    timing: "action",
  },
  {
    cardId: "onr_v1_334_pacifica-regional-ai",
    amount: 1,
    scope: "corp",
    timing: "action",
  },
];

const ACTION_CAPACITY_PROFILE_CONTRACTS = [
  {
    cardId: "onr_v1_117_valu-pak-software-bundle",
    class: "restricted_gain",
    amount: 5,
    restriction: "program_install_only",
    sourceResource: "source_card",
  },
  {
    cardId: "onr_v1_172_quest-for-cattekin",
    class: "random_gain",
    amount: 1,
    restriction: "random_action",
    sourceResource: "die_roll",
  },
  {
    cardId: "onr_v1_187_wilson-weeflerunner-apprentice",
    class: "restricted_gain",
    amount: 1,
    restriction: "run_only",
    sourceResource: "source_card",
  },
  {
    cardId: "onr_v1_192_corporate-boon",
    class: "finite_bank",
    amount: 1,
    restriction: "unrestricted",
    sourceResource: "counter",
  },
  {
    cardId: "onr_v1_289_edgerunner-inc-temps",
    class: "restricted_gain",
    amount: 3,
    restriction: "install_only",
    sourceResource: "source_card",
  },
  {
    cardId: "onr_v1_297_overtime-incentives",
    class: "immediate_gain",
    amount: 2,
    restriction: "unrestricted",
    sourceResource: "source_card",
  },
  {
    cardId: "onr_v1_334_pacifica-regional-ai",
    class: "finite_bank",
    amount: 1,
    restriction: "unrestricted",
    sourceResource: "advancement_counter",
  },
  {
    cardId: "onr_proteus_046_corporate-guard-r-temps",
    class: "future_recurring_gain",
    amount: 1,
    restriction: "unrestricted",
    sourceResource: "credits_x",
  },
  {
    cardId: "onr_proteus_131_bargain-with-viacox",
    class: "mandatory_gain",
    amount: 1,
    restriction: "mandatory_random_action",
    sourceResource: "die_roll",
  },
  {
    cardId: "onr_v1_078_arasaka-owns-you",
    class: "action_debt",
    amount: 4,
    restriction: "unrestricted",
    sourceResource: "replacement_effect",
  },
];

const DIRECT_CLICK_MUTATION =
  /(?:state|host\.state)\.(corp|runner)\.clicks\s*\+=/g;
const NARROW_ACTION_GAIN_FIELD = /scoreConversionActionGainAmount/g;
const RULES_TEXT_ACTION_PARSER =
  /(?:corpExtraActionGainFromRulesText|rulesText[^\n]{0,120}(?:extra|gain)[ _-]?actions?)/gi;

export function buildAiActionCapacityContractAudit() {
  const hints = readJson("data/ai/ai-card-hints-active.json");
  const hintCards = Array.isArray(hints.cards) ? hints.cards : [];
  const aiSourceFiles = sourceFilesUnder("packages/ai/src");
  const engineSourceFiles = sourceFilesUnder("packages/engine/src");

  const cardsWithActionCapacity = [];
  const cardsWithFixedImmediateActionGain = [];
  const cardsWithDynamicImmediateActionGain = [];
  const cardsWithRecurringOrFutureActionGain = [];
  const cardsWithRestrictedRandomOrMandatoryActions = [];
  const cardsWithActionDebtOrLoss = [];
  const cardsWithActionCostOrLock = [];
  const unprofiledActionEffectCards = [];
  const effectOccurrencesByKind = new Map();

  for (const card of hintCards) {
    const effects = actionEffects(card);
    const profiles = actionCapacityProfiles(card);
    if (effects.length > 0 && profiles.length === 0)
      unprofiledActionEffectCards.push(card.cardId);
    if (profiles.length === 0) continue;

    cardsWithActionCapacity.push(card.cardId);
    for (const effect of effects) {
      const kind = effect.kind ?? "resource_actions";
      effectOccurrencesByKind.set(
        kind,
        (effectOccurrencesByKind.get(kind) ?? 0) + 1,
      );
    }

    const immediateGains = profiles.filter(
      (profile) =>
        ["immediate_gain", "finite_bank", "restricted_gain"].includes(
          profile.class,
        ) &&
        ["immediate", "scored_activated", "on_rez"].includes(profile.timing),
    );
    if (
      immediateGains.some(
        (profile) =>
          profile.amountKind === "fixed" && finiteNumber(profile.amount),
      )
    ) {
      cardsWithFixedImmediateActionGain.push(card.cardId);
    }
    if (
      immediateGains.some(
        (profile) =>
          profile.amountKind !== "fixed" || !finiteNumber(profile.amount),
      )
    ) {
      cardsWithDynamicImmediateActionGain.push(card.cardId);
    }
    if (
      profiles.some((profile) =>
        ["recurring_gain", "future_recurring_gain"].includes(profile.class),
      )
    ) {
      cardsWithRecurringOrFutureActionGain.push(card.cardId);
    }
    if (
      profiles.some((profile) =>
        ["restricted_gain", "random_gain", "mandatory_gain"].includes(
          profile.class,
        ),
      )
    ) {
      cardsWithRestrictedRandomOrMandatoryActions.push(card.cardId);
    }
    if (
      profiles.some((profile) =>
        ["action_debt", "action_loss"].includes(profile.class),
      )
    ) {
      cardsWithActionDebtOrLoss.push(card.cardId);
    }
    if (
      profiles.some((profile) =>
        ["action_cost", "action_lock"].includes(profile.class),
      )
    )
      cardsWithActionCostOrLock.push(card.cardId);
  }

  const directEngineClickMutations = sourceMatches(
    engineSourceFiles,
    DIRECT_CLICK_MUTATION,
  );
  const narrowActionGainConsumers = sourceMatches(
    aiSourceFiles,
    NARROW_ACTION_GAIN_FIELD,
  );
  const rulesTextActionParsers = sourceMatches(
    aiSourceFiles,
    RULES_TEXT_ACTION_PARSER,
  );
  const targetContractViolations = actionContractViolations(hintCards);

  return {
    schemaVersion: "ai-action-capacity-contract-audit-v1",
    source: "data/ai/ai-card-hints-active.json",
    counts: {
      hintCards: hintCards.length,
      cardsWithActionCapacity: unique(cardsWithActionCapacity).length,
      cardsWithFixedImmediateActionGain: unique(
        cardsWithFixedImmediateActionGain,
      ).length,
      cardsWithDynamicImmediateActionGain: unique(
        cardsWithDynamicImmediateActionGain,
      ).length,
      cardsWithRecurringOrFutureActionGain: unique(
        cardsWithRecurringOrFutureActionGain,
      ).length,
      cardsWithRestrictedRandomOrMandatoryActions: unique(
        cardsWithRestrictedRandomOrMandatoryActions,
      ).length,
      cardsWithActionDebtOrLoss: unique(cardsWithActionDebtOrLoss).length,
      cardsWithActionCostOrLock: unique(cardsWithActionCostOrLock).length,
      unprofiledActionEffectCards: unique(unprofiledActionEffectCards).length,
      directEngineClickMutationFiles: directEngineClickMutations.length,
      narrowActionGainProductionConsumers: narrowActionGainConsumers.filter(
        (entry) => entry.production,
      ).length,
      rulesTextActionProductionParsers: rulesTextActionParsers.filter(
        (entry) => entry.production,
      ).length,
      targetContractViolations: targetContractViolations.length,
    },
    effectOccurrencesByKind: Object.fromEntries(
      [...effectOccurrencesByKind.entries()].sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      ),
    ),
    classifications: {
      cardsWithActionCapacity: unique(cardsWithActionCapacity),
      cardsWithFixedImmediateActionGain: unique(
        cardsWithFixedImmediateActionGain,
      ),
      cardsWithDynamicImmediateActionGain: unique(
        cardsWithDynamicImmediateActionGain,
      ),
      cardsWithRecurringOrFutureActionGain: unique(
        cardsWithRecurringOrFutureActionGain,
      ),
      cardsWithRestrictedRandomOrMandatoryActions: unique(
        cardsWithRestrictedRandomOrMandatoryActions,
      ),
      cardsWithActionDebtOrLoss: unique(cardsWithActionDebtOrLoss),
      cardsWithActionCostOrLock: unique(cardsWithActionCostOrLock),
    },
    findings: {
      directEngineClickMutations,
      narrowActionGainConsumers,
      rulesTextActionParsers,
      targetContractViolations,
      unprofiledActionEffectCards: unique(unprofiledActionEffectCards),
    },
    targetCards: Object.fromEntries(
      TARGET_CARD_IDS.map((cardId) => {
        const card = hintCards.find((candidate) => candidate.cardId === cardId);
        return [
          cardId,
          card
            ? {
                side: card.side,
                cardType: card.cardType,
                effects: actionEffects(card),
                actionCapacityProfiles: actionCapacityProfiles(card),
                signals: cardSignals(card).filter(actionCapacitySignal),
              }
            : null,
        ];
      }),
    ),
  };
}

function actionContractViolations(hintCards) {
  const violations = [];
  const cardsById = new Map(hintCards.map((card) => [card.cardId, card]));
  for (const contract of EXTRA_ACTION_CONTRACTS) {
    const card = cardsById.get(contract.cardId);
    if (!card) {
      violations.push(`${contract.cardId}: missing hint`);
      continue;
    }
    const matching = actionEffects(card).filter(
      (effect) =>
        effect.kind === "extra_action" &&
        effect.resource === "actions" &&
        effect.amount === contract.amount &&
        effect.scope === contract.scope &&
        effect.timing === contract.timing,
    );
    if (matching.length !== 1) {
      violations.push(
        `${contract.cardId}: expected one ${contract.amount}-action ${contract.timing} effect, found ${matching.length}`,
      );
    }
  }
  for (const contract of ACTION_CAPACITY_PROFILE_CONTRACTS) {
    const card = cardsById.get(contract.cardId);
    if (!card) {
      violations.push(`${contract.cardId}: missing hint`);
      continue;
    }
    const matching = actionCapacityProfiles(card).filter(
      (profile) =>
        profile.class === contract.class &&
        profile.amount === contract.amount &&
        profile.amountKind === "fixed" &&
        profile.restriction === contract.restriction &&
        profile.sourceResource === contract.sourceResource,
    );
    if (matching.length !== 1)
      violations.push(
        `${contract.cardId}: expected one ${contract.class} profile with amount ${contract.amount}, found ${matching.length}`,
      );
  }
  return violations;
}

function actionEffects(card) {
  return arrayValue(card.effects).filter((effect) => {
    if (!isRecord(effect)) return false;
    if (effect.kind === "extra_action" || effect.kind === "forgo_actions")
      return true;
    if (effect.resource !== "actions") return false;
    return ACTION_EFFECT_KINDS.has(effect.kind) || effect.kind === "run_lock";
  });
}

function actionCapacityProfiles(card) {
  return arrayValue(card.actionCapacityProfiles).filter(isRecord);
}

function cardSignals(card) {
  return [
    ...arrayValue(card.actionTacticSignals),
    ...arrayValue(card.functionSignals),
    ...arrayValue(card.tacticSignals),
    ...arrayValue(card.riskTags),
    ...arrayValue(card.requiredMechanics),
  ].filter((value) => typeof value === "string");
}

function actionCapacitySignal(signal) {
  return /extra_action|action_debt|action_loss|forgo_actions|install_only_action|gain_run_only_action|action\.corp_/.test(
    signal.toLowerCase(),
  );
}

function sourceMatches(files, pattern) {
  return files
    .flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      const matches = [
        ...source.matchAll(new RegExp(pattern.source, pattern.flags)),
      ];
      return matches.length > 0
        ? [
            {
              file: relativePath(filePath),
              production: !filePath.endsWith(".test.ts"),
              matches: matches.length,
            },
          ]
        : [];
    })
    .sort((left, right) => left.file.localeCompare(right.file));
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
      if (entry.isDirectory()) pending.push(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".ts"))
        result.push(entryPath);
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

function unique(values) {
  return [...new Set(values)].sort();
}

function printSummary(report) {
  console.log("AI action-capacity contract audit");
  for (const [key, value] of Object.entries(report.counts)) {
    console.log(`${key}: ${value}`);
  }
  if (report.findings.targetContractViolations.length > 0) {
    console.log("target contract violations:");
    for (const violation of report.findings.targetContractViolations) {
      console.log(`- ${violation}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = buildAiActionCapacityContractAudit();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printSummary(report);
  }
  if (
    process.argv.includes("--check") &&
    (report.findings.targetContractViolations.length > 0 ||
      report.findings.unprofiledActionEffectCards.length > 0 ||
      report.counts.narrowActionGainProductionConsumers > 0 ||
      report.counts.rulesTextActionProductionParsers > 0)
  ) {
    process.exitCode = 1;
  }
}

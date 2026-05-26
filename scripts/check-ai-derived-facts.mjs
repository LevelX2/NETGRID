#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DEFAULT_PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const STABLE_REVIEW_DATE = "2026-05-25";

const KNOWN_EFFECT_KINDS = new Set([
  "economy",
  "draw",
  "damage",
  "tag",
  "trace",
  "run_tax",
  "breaker",
  "search",
  "remote_protection",
  "score_acceleration",
  "trash_credit",
  "multiaccess",
  "topdeck_info",
  "zone_shuffle",
  "extra_action",
  "counter_economy",
  "scored_agenda_action",
  "future_run_effect",
  "future_encounter_effect",
  "access_replacement",
  "install_discount",
  "rez_discount",
  "program_trash",
  "hardware_trash",
  "resource_trash",
  "tag_punish_payoff",
  "tag_source",
]);

const KNOWN_TIMINGS = new Set([
  "action",
  "scored_activated",
  "when_scored",
  "start_of_turn",
  "during_run",
  "on_access",
  "persistent",
  "encounter",
  "successful_run",
  "trace_success",
  "corp_turn",
  "runner_turn",
]);

const KNOWN_SCOPES = new Set([
  "runner",
  "corp",
  "fort",
  "server",
  "ice",
  "hq",
  "rnd",
  "archives",
  "remote",
  "score_area",
  "installed_card",
  "accessed_card",
  "run_path",
]);

const KNOWN_RESOURCES = new Set([
  "credits",
  "cards",
  "actions",
  "tags",
  "damage",
  "advancement_counters",
  "trash_credits",
  "memory",
  "link",
  "counters",
  "strength",
  "subroutines",
]);

const KNOWN_CONDITIONS = new Set([
  "requires_runner_tagged",
  "requires_successful_run",
  "requires_known_ice",
  "requires_agenda_in_remote",
  "requires_trace_success",
  "requires_during_run",
  "requires_scored_agenda",
  "requires_accessed_card",
  "requires_remote_server",
  "requires_hq_pressure",
  "requires_rnd_pressure",
  "requires_installed_program",
  "requires_missing_breaker_coverage",
]);

const KNOWN_BREAKER_COVERAGES = new Set([
  "wall",
  "sentry",
  "code_gate",
  "ap",
  "trace",
  "watchdog",
  "black_ice",
  "universal",
  "unknown_special",
]);

const KNOWN_BREAKER_SIDE_EFFECTS = new Set([
  "forgo_actions",
  "stealth_loss",
  "random_failure",
  "ends_run_after_use",
  "credit_intensive_pump",
  "program_trash_risk",
  "temporary_strength",
  "once_per_subroutine",
]);

const KNOWN_REMOTE_ROLES = new Set([
  "scoring_protection",
  "bait",
  "asset_economy",
  "run_tax",
  "remote_capacity",
  "ambush",
  "tax_fort",
  "ice_modifier",
  "agenda_steal_tax",
]);

const KNOWN_TARGET_ZONES = new Set(["stack", "stack_top"]);

const KNOWN_TARGET_CARD_TYPES = new Set([
  "agenda",
  "asset",
  "event",
  "hardware",
  "ice",
  "operation",
  "program",
  "resource",
  "upgrade",
]);

const KNOWN_TARGET_INSTALL_COSTS = new Set(["free", "normal"]);

const HIDDEN_INFO_RISK_FIELDS = new Set([
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
]);

const CRYSTAL_PALACE_DENYLIST = new Set([
  "economy",
  "counter",
  "power_counter",
  "remote_upgrade_economy",
]);

export function buildDerivedFactsReport(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const hintsPath = resolvePath(
    repoRoot,
    options.hintsPath ?? DEFAULT_HINTS_PATH,
  );
  const pilotCardsPath = resolvePath(
    repoRoot,
    options.pilotCardsPath ?? DEFAULT_PILOT_CARDS_PATH,
  );
  const hints = readJson(hintsPath).cards ?? [];
  const pilotCardsPayload = readJson(pilotCardsPath);
  const pilotCards = pilotCardsPayload.cards ?? [];
  const hintsById = new Map(hints.map((hint) => [hint.cardId, hint]));

  const hardErrors = [];
  const hardConflicts = [];
  const warnings = [];

  const cards = pilotCards.map((pilotCard) => {
    const hint = hintsById.get(pilotCard.cardId);
    const implementationPath = pilotCard.implementationPath;
    const absolutePath = resolvePath(repoRoot, implementationPath);
    const implementationFound = fs.existsSync(absolutePath);
    const implementationText = implementationFound
      ? fs.readFileSync(absolutePath, "utf8")
      : "";
    const derivedFacts = implementationFound
      ? deriveFromImplementation(pilotCard, implementationText, hint)
      : emptyDerivedFacts("Implementation file not found.");
    const manualOntologySummary = summarizeManualOntology(hint);
    const overlap = compareFacts(derivedFacts, manualOntologySummary);
    const descriptorGaps = descriptorGapsForCard(derivedFacts, overlap);
    const cardWarnings = warningsForCard({
      pilotCard,
      derivedFacts,
      manualOntologySummary,
      overlap,
      descriptorGaps,
    });
    const confidence = confidenceForDerivedFacts(derivedFacts);
    const derivedKindKeys = derivedKindSet(derivedFacts);
    const hasDerivedFacts = derivedKindKeys.size > 0;
    const missingManualOverlay = [
      ...overlap.generatedOnly,
      ...overlap.manualOnly,
      ...derivedFacts.needsManualOverlayReasons,
    ].sort();

    if (!implementationFound) {
      hardErrors.push({
        kind: "missing_implementation",
        cardId: pilotCard.cardId,
        message: `Pilot card implementation not found: ${implementationPath}`,
      });
      if (hint) {
        hardErrors.push({
          kind: "active_pilot_hint_without_implementation",
          cardId: pilotCard.cardId,
          message:
            "Active pilot card has an AI hint but no implementation file.",
        });
      }
    }

    if (pilotCard.expectedDerivableKinds?.length > 0 && !hasDerivedFacts) {
      hardErrors.push({
        kind: "no_basic_facts_for_derivable_card",
        cardId: pilotCard.cardId,
        message:
          "Pilot card is marked derivable but no basic fact was derived.",
      });
    }

    for (const expectedKind of pilotCard.expectedDerivableKinds ?? []) {
      if (!derivedKindKeys.has(expectedKind)) {
        hardErrors.push({
          kind: "missing_expected_derivable_kind",
          cardId: pilotCard.cardId,
          message: `Expected derived kind missing: ${expectedKind}`,
        });
      }
    }

    const validationErrors = validateDerivedFacts(derivedFacts).map(
      (issue) => ({
        ...issue,
        cardId: pilotCard.cardId,
      }),
    );
    hardErrors.push(...validationErrors);

    const hiddenInfoErrors = findHiddenInfoRiskFields(derivedFacts).map(
      (pathValue) => ({
        kind: "hidden_info_field",
        cardId: pilotCard.cardId,
        message: `Generated facts contain hidden-info field ${pathValue}.`,
      }),
    );
    hardErrors.push(...hiddenInfoErrors);

    const crystalPalaceConflict = crystalPalaceHardConflict(
      pilotCard.cardId,
      derivedFacts,
      manualOntologySummary,
    );
    if (crystalPalaceConflict) {
      hardConflicts.push(crystalPalaceConflict);
      hardErrors.push(crystalPalaceConflict);
    }

    if (
      Boolean(pilotCard.expectedManualOverlayNeeded) !==
      missingManualOverlay.length > 0
    ) {
      warnings.push({
        kind: "manual_overlay_expectation_mismatch",
        cardId: pilotCard.cardId,
        message:
          "Pilot metadata expectedManualOverlayNeeded differs from generated comparison.",
      });
    }

    warnings.push(
      ...cardWarnings.map((warning) => ({
        ...warning,
        cardId: pilotCard.cardId,
      })),
    );

    return {
      cardId: pilotCard.cardId,
      title: pilotCard.title,
      implementationPath,
      implementationFound,
      expectedDerivableKinds: [...(pilotCard.expectedDerivableKinds ?? [])],
      expectedManualOverlayNeeded: Boolean(
        pilotCard.expectedManualOverlayNeeded,
      ),
      rationale: pilotCard.rationale,
      derivedFacts,
      manualOntologySummary,
      overlap,
      missingManualOverlay,
      descriptorGaps,
      confidence,
      warnings: cardWarnings,
    };
  });

  const report = {
    schemaVersion: "ai-derived-basic-facts-gate-v1",
    generatedAt: STABLE_REVIEW_DATE,
    source: {
      hintsPath: relativePath(repoRoot, hintsPath),
      pilotCardsPath: relativePath(repoRoot, pilotCardsPath),
      derivationMode:
        "read-only CardImplementation text/descriptor scan; no runtime, planner, or strategy consumption",
    },
    pilotCardCount: cards.length,
    implementationFoundCount: cards.filter((card) => card.implementationFound)
      .length,
    cardsWithDerivedFacts: cards.filter(
      (card) => derivedKindSet(card.derivedFacts).size > 0,
    ).length,
    cardsWithManualOntologyOverlap: cards.filter(
      (card) => card.overlap.matches.length > 0,
    ).length,
    cardsNeedingManualOverlay: cards.filter(
      (card) => card.missingManualOverlay.length > 0,
    ).length,
    effectKindCounts: countKinds(
      cards.flatMap((card) =>
        card.derivedFacts.effects.map((effect) => effect.kind),
      ),
    ),
    conditionKindCounts: countKinds(
      cards.flatMap((card) =>
        card.derivedFacts.conditions.map((condition) => condition.kind),
      ),
    ),
    hardErrorCount: hardErrors.length,
    hardErrors,
    hardConflicts,
    warningCount: warnings.length,
    warnings: warnings.sort(compareIssues),
    cards,
  };

  return sortReport(report);
}

export function serializeReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function checkDerivedFactsReport(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const reportPath = resolvePath(
    repoRoot,
    options.reportPath ?? DEFAULT_REPORT_PATH,
  );
  const reportA = buildDerivedFactsReport({ ...options, repoRoot });
  const reportB = buildDerivedFactsReport({ ...options, repoRoot });
  const serialized = serializeReport(reportA);
  const deterministic = serialized === serializeReport(reportB);
  const hardErrors = [...reportA.hardErrors];
  if (!deterministic) {
    hardErrors.push({
      kind: "nondeterministic_report",
      message: "Generated report differs across two same-process builds.",
    });
  }
  let matchesCommittedReport = true;
  if (options.check) {
    if (!fs.existsSync(reportPath)) {
      matchesCommittedReport = false;
      hardErrors.push({
        kind: "missing_committed_report",
        message: `Missing report: ${relativePath(repoRoot, reportPath)}`,
      });
    } else {
      const existing = `${JSON.stringify(readJson(reportPath), null, 2)}\n`;
      if (existing !== serialized) {
        matchesCommittedReport = false;
        hardErrors.push({
          kind: "stale_committed_report",
          message: `Generated report differs from ${relativePath(
            repoRoot,
            reportPath,
          )}`,
        });
      }
    }
  }
  return {
    report: {
      ...reportA,
      hardErrors,
      hardErrorCount: hardErrors.length,
    },
    serialized,
    deterministic,
    matchesCommittedReport,
    reportPath,
  };
}

export function runCli(argv = process.argv.slice(2), defaults = {}) {
  const args = parseArgs(argv, defaults);
  const result = checkDerivedFactsReport({
    reportPath: args.reportPath,
    check: args.check,
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(result.reportPath), { recursive: true });
    fs.writeFileSync(result.reportPath, result.serialized);
  }

  if (args.json) {
    process.stdout.write(result.serialized);
  } else {
    process.stdout.write(summaryLine(result.report));
    for (const error of result.report.hardErrors) {
      process.stdout.write(`ERROR ${error.kind} ${error.cardId ?? ""}\n`);
    }
    for (const warning of result.report.warnings) {
      process.stdout.write(`WARN ${warning.kind} ${warning.cardId ?? ""}\n`);
    }
  }

  if (result.report.hardErrorCount > 0) process.exitCode = 1;
  return result;
}

function emptyDerivedFacts(reason) {
  return {
    effects: [],
    conditions: [],
    costProfile: {},
    derivationNotes: [],
    needsManualOverlayReasons: [reason],
  };
}

function deriveFromImplementation(card, implementationText, hint) {
  const facts = {
    effects: [],
    conditions: [],
    costProfile: {},
    derivationNotes: [],
    needsManualOverlayReasons: [],
  };

  const isAgenda = hint?.cardType === "agenda";

  if (isAgenda && /kind:\s*"activated"/.test(implementationText)) {
    addEffect(facts, {
      kind: "scored_agenda_action",
      timing: "scored_activated",
      scope: "score_area",
      source: "implementation.abilities.activated.score_area",
    });
    addCondition(facts, {
      kind: "requires_scored_agenda",
      source: "implementation.cardType.agenda.activated",
    });
  }

  if (/kind:\s*"gain_credits"/.test(implementationText)) {
    addEffect(facts, {
      kind: "economy",
      timing: isAgenda ? "scored_activated" : "action",
      scope: hint?.side ?? "corp",
      resource: "credits",
      amount: amountNear(implementationText, "gain_credits"),
      source: "implementation.effect.gain_credits",
    });
  }

  if (/kind:\s*"take_hosted_credits"/.test(implementationText)) {
    addEffect(facts, {
      kind: "counter_economy",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "corp",
      resource: "credits",
      amount: amountNear(implementationText, "take_hosted_credits"),
      source: "implementation.effect.take_hosted_credits",
    });
  }

  if (/kind:\s*"draw_cards"/.test(implementationText)) {
    addEffect(facts, {
      kind: "draw",
      timing: isAgenda ? "scored_activated" : "action",
      scope: hint?.side ?? "runner",
      resource: "cards",
      amount: amountNear(implementationText, "draw_cards"),
      source: "implementation.effect.draw_cards",
    });
  }

  if (isEmployeeEmpowermentStartOfTurnDraw(card, implementationText)) {
    addEffect(facts, {
      kind: "draw",
      timing: "start_of_turn",
      scope: "corp",
      resource: "cards",
      amount: 1,
      source: "implementation.card_text.start_of_turn.draw",
    });
    facts.derivationNotes.push(
      "Employee Empowerment start-of-turn draw is optional in card text; this read-only fact records the mechanical draw class, not a mandatory runtime trigger.",
    );
  }

  if (/kind:\s*"gain_actions"/.test(implementationText)) {
    addEffect(facts, {
      kind: "extra_action",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "corp",
      resource: "actions",
      amount: amountNear(implementationText, "gain_actions"),
      source: "implementation.effect.gain_actions",
    });
  }

  if (/kind:\s*"trace"/.test(implementationText)) {
    addEffect(facts, {
      kind: "trace",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "corp",
      source: "implementation.effect.trace",
    });
    if (/kind:\s*"add_tags"/.test(implementationText)) {
      addEffect(facts, {
        kind: "tag_source",
        timing: isAgenda ? "scored_activated" : "trace_success",
        scope: "runner",
        resource: "tags",
        amount: amountNear(implementationText, "add_tags"),
        source: "implementation.effect.trace.onSuccess.add_tags",
      });
      addCondition(facts, {
        kind: "requires_trace_success",
        source: "implementation.effect.trace.onSuccess",
      });
    }
  }

  if (/condition:\s*\{\s*kind:\s*"runner_is_tagged"/.test(implementationText)) {
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.condition.runner_is_tagged",
    });
  }

  if (/kind:\s*"damage"/.test(implementationText)) {
    addEffect(facts, {
      kind: "damage",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "runner",
      resource: "damage",
      amount: amountNear(implementationText, "damage"),
      source: "implementation.effect.damage",
    });
    if (/runner_is_tagged/.test(implementationText)) {
      addEffect(facts, {
        kind: "tag_punish_payoff",
        timing: isAgenda ? "scored_activated" : "action",
        scope: "runner",
        resource: "damage",
        source: "implementation.condition.runner_is_tagged.effect.damage",
      });
    }
  }

  if (/kind:\s*"lose_credits"/.test(implementationText)) {
    addEffect(facts, {
      kind: "counter_economy",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "runner",
      resource: "credits",
      source: "implementation.effect.lose_credits",
    });
    if (/runner_is_tagged/.test(implementationText)) {
      addEffect(facts, {
        kind: "tag_punish_payoff",
        timing: "action",
        scope: "runner",
        resource: "credits",
        source: "implementation.condition.runner_is_tagged.effect.lose_credits",
      });
    }
  }

  if (/icebreakerAbilities:\s*\[/.test(implementationText)) {
    const coverage = [];
    for (const subtype of ["wall", "sentry", "code_gate", "ap", "trace"]) {
      if (
        new RegExp(`subtype:\\s*"${subtype.replace("_", "[-_ ]?")}"`).test(
          implementationText,
        )
      ) {
        coverage.push(subtype);
      }
    }
    if (/matches:\s*\{\s*kind:\s*"any"/.test(implementationText)) {
      coverage.push("universal");
    }
    const breakCost = amountNear(implementationText, "break_subroutine");
    const pumpCost = amountNear(implementationText, "increase_strength");
    facts.breakerProfile = {
      coverage: coverage.length > 0 ? coverage : ["unknown_special"],
      pumpCost,
      breakCost,
      confidence: coverage.length > 0 ? "high" : "medium",
      source: "implementation.icebreakerAbilities",
    };
    addEffect(facts, {
      kind: "breaker",
      timing: "persistent",
      scope: "runner",
      source: "implementation.icebreakerAbilities",
    });
    if (/forgo your next/i.test(implementationText)) {
      facts.breakerProfile.sideEffects = ["forgo_actions"];
      facts.breakerProfile.confidence = "medium";
      facts.derivationNotes.push(
        "Future action debt is represented as the structured breaker side effect forgo_actions; no planner/runtime consumption is implied.",
      );
    }
  }

  if (/restrictedHostedCreditSource/.test(implementationText)) {
    addEffect(facts, {
      kind: "trash_credit",
      timing: "persistent",
      scope: "runner",
      resource: "trash_credits",
      source: "implementation.restrictedHostedCreditSource",
    });
  }

  if (
    /kind:\s*"search_stack_install"/.test(implementationText) ||
    /kind:\s*"look_top_stack_show_to_corp_then_install_matching"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "search",
      timing: /timing:\s*"during_run"/.test(implementationText)
        ? "during_run"
        : "action",
      scope: "runner",
      source: /search_stack_install/.test(implementationText)
        ? "implementation.effect.search_stack_install"
        : "implementation.effect.look_top_stack_show_to_corp_then_install_matching",
    });
    if (/timing:\s*"during_run"/.test(implementationText)) {
      addCondition(facts, {
        kind: "requires_during_run",
        source: "implementation.ability.timing.during_run",
      });
    }
    if (/kind:\s*"search_stack_install"/.test(implementationText)) {
      addTargetProfile(facts, {
        zone: "stack",
        targetCardType: valueNear(implementationText, "filter") ?? "program",
        installsTarget: true,
        installCost: valueNear(implementationText, "installCost"),
        shuffleAfter: /shuffleAfterwards:\s*true/.test(implementationText),
        source: "implementation.effect.search_stack_install",
      });
    }
  }

  if (
    /look_top_stack_show_to_corp_then_install_matching/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "topdeck_info",
      timing: "during_run",
      scope: "runner",
      resource: "cards",
      amount: amountNear(
        implementationText,
        "look_top_stack_show_to_corp_then_install_matching",
      ),
      source:
        "implementation.effect.look_top_stack_show_to_corp_then_install_matching",
    });
    addEffect(facts, {
      kind: "install_discount",
      timing: "during_run",
      scope: "runner",
      source:
        "implementation.effect.look_top_stack_show_to_corp_then_install_matching.installCost",
    });
    addTargetProfile(facts, {
      zone: "stack_top",
      lookCount: countNear(
        implementationText,
        "look_top_stack_show_to_corp_then_install_matching",
      ),
      targetCardType:
        arrayFirstNear(implementationText, "allowedTypes") ?? "program",
      installsTarget: true,
      installCost: valueNear(implementationText, "installCost"),
      shuffleAfter: /shuffleAfterwards:\s*true/.test(implementationText),
      showToOpponent: true,
      oncePerRun: /only once each run/i.test(implementationText),
      source:
        "implementation.effect.look_top_stack_show_to_corp_then_install_matching",
    });
  }

  if (/private_look_top_rd/.test(implementationText)) {
    addEffect(facts, {
      kind: "topdeck_info",
      timing: /successfulRunAccessReplacement/.test(implementationText)
        ? "successful_run"
        : "start_of_turn",
      scope: "rnd",
      resource: "cards",
      source: "implementation.effect.private_look_top_rd",
    });
  }

  if (/successfulRunAccessReplacement/.test(implementationText)) {
    addEffect(facts, {
      kind: "access_replacement",
      timing: "successful_run",
      scope: "rnd",
      source: "implementation.successfulRunAccessReplacement",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.successfulRunAccessReplacement",
    });
  }

  if (/run_duration_/.test(implementationText)) {
    addEffect(facts, {
      kind: "future_run_effect",
      timing: "encounter",
      scope: "run_path",
      confidence: "medium",
      source: "implementation.printedSubroutines.run_duration",
    });
    addCondition(facts, {
      kind: "requires_during_run",
      source: "implementation.printedSubroutines.run_duration",
    });
    if (/run_duration_break_subroutine_cost/.test(implementationText)) {
      addEffect(facts, {
        kind: "run_tax",
        timing: "encounter",
        scope: "run_path",
        resource: "credits",
        confidence: "medium",
        source:
          "implementation.printedSubroutines.run_duration_break_subroutine_cost",
      });
    }
    if (/run_duration_jack_out_cost/.test(implementationText)) {
      addEffect(facts, {
        kind: "run_tax",
        timing: "encounter",
        scope: "run_path",
        resource: "credits",
        amount: amountNear(implementationText, "run_duration_jack_out_cost"),
        confidence: "medium",
        source: "implementation.printedSubroutines.run_duration_jack_out_cost",
      });
    }
    if (/run_duration_trash_program/.test(implementationText)) {
      addEffect(facts, {
        kind: "program_trash",
        timing: "encounter",
        scope: "runner",
        confidence: "medium",
        source: "implementation.printedSubroutines.run_duration_trash_program",
      });
    }
    if (/run_duration_additional_subroutine/.test(implementationText)) {
      addEffect(facts, {
        kind: "remote_protection",
        timing: "encounter",
        scope: "run_path",
        confidence: "medium",
        source:
          "implementation.printedSubroutines.run_duration_additional_subroutine",
      });
    }
  }

  if (/kind:\s*"break_subroutine_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "run_tax",
      timing: "persistent",
      scope: "fort",
      resource: "credits",
      amount: amountNear(implementationText, "break_subroutine_cost"),
      source: "implementation.modifiers.break_subroutine_cost",
    });
    facts.remoteRole = {
      kind: "run_tax",
      threatLevel: "medium",
      serverScope: "fort",
      confidence: "high",
      source: "implementation.modifiers.break_subroutine_cost",
    };
  }

  if (/kind:\s*"steal_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "run_tax",
      timing: "on_access",
      scope: "accessed_card",
      resource: "credits",
      amount: amountNear(implementationText, "steal_cost"),
      source: "implementation.modifiers.steal_cost",
    });
    addCondition(facts, {
      kind: "requires_accessed_card",
      source: "implementation.modifiers.steal_cost.appliesTo.agenda",
    });
    facts.remoteRole = {
      kind: "agenda_steal_tax",
      threatLevel: "high",
      serverScope: "remote",
      confidence: "high",
      source: "implementation.modifiers.steal_cost",
    };
  }

  if (/activeWhile:\s*"rezzed"/.test(implementationText)) {
    facts.derivationNotes.push(
      "Active board-state still belongs to engine/runtime; derived facts only describe the mechanical class.",
    );
  }

  facts.effects = uniqueBy(
    facts.effects,
    (effect) =>
      `${effect.kind}:${effect.timing ?? ""}:${effect.scope ?? ""}:${
        effect.resource ?? ""
      }`,
  ).sort(compareByKindTimingScope);
  facts.conditions = uniqueBy(
    facts.conditions,
    (condition) => condition.kind,
  ).sort((a, b) => a.kind.localeCompare(b.kind));
  if (facts.breakerProfile?.coverage) facts.breakerProfile.coverage.sort();
  if (facts.breakerProfile?.sideEffects)
    facts.breakerProfile.sideEffects.sort();
  if (facts.targetProfiles) {
    facts.targetProfiles = uniqueBy(
      facts.targetProfiles,
      (targetProfile) =>
        `${targetProfile.zone ?? ""}:${targetProfile.targetCardType ?? ""}:${
          targetProfile.installsTarget ?? ""
        }:${targetProfile.lookCount ?? ""}`,
    ).sort((a, b) =>
      `${a.zone ?? ""}:${a.targetCardType ?? ""}`.localeCompare(
        `${b.zone ?? ""}:${b.targetCardType ?? ""}`,
      ),
    );
  }

  return facts;
}

function isEmployeeEmpowermentStartOfTurnDraw(card, implementationText) {
  return (
    card.cardId === "onr_v1_199_employee-empowerment" &&
    /You may choose to draw an additional card at the start of each of your turns\./.test(
      implementationText,
    )
  );
}

function addEffect(facts, effect) {
  facts.effects.push({
    confidence: "high",
    ...effect,
  });
}

function addCondition(facts, condition) {
  facts.conditions.push({
    confidence: "high",
    ...condition,
  });
}

function addTargetProfile(facts, targetProfile) {
  facts.targetProfiles ??= [];
  facts.targetProfiles.push(targetProfile);
}

function summarizeManualOntology(hint) {
  return {
    hintPresent: Boolean(hint),
    side: hint?.side,
    cardType: hint?.cardType,
    roles: [...(hint?.roles ?? [])].sort(),
    planRoles: [...(hint?.planRoles ?? [])].sort(),
    effects: (hint?.effects ?? [])
      .map((effect) => ({
        kind: effect.kind,
        timing: effect.timing,
        scope: effect.scope,
        resource: effect.resource,
        amount: effect.amount,
      }))
      .sort(compareByKindTimingScope),
    conditions: (hint?.conditions ?? [])
      .map((condition) => ({ kind: condition.kind }))
      .sort((a, b) => a.kind.localeCompare(b.kind)),
    costProfile: hint?.costProfile,
    breakerProfile: normalizeBreakerProfile(hint?.breakerProfile),
    remoteRole: hint?.remoteRole
      ? {
          kind: hint.remoteRole.kind,
          threatLevel: hint.remoteRole.threatLevel,
          serverScope: hint.remoteRole.serverScope,
        }
      : undefined,
    lineSupport: [...(hint?.lineSupport ?? [])].sort(),
    quality: hint?.quality
      ? {
          hintReviewed: hint.quality.hintReviewed,
          strategyCovered: hint.quality.strategyCovered,
          benchmarkCovered: hint.quality.benchmarkCovered,
          confidence: hint.quality.confidence,
          needsHumanReview: hint.quality.needsHumanReview,
        }
      : undefined,
  };
}

function normalizeBreakerProfile(profile) {
  if (!profile) return undefined;
  return {
    coverage: [...(profile.coverage ?? [])].sort(),
    baseStrength: profile.baseStrength,
    pumpCost: profile.pumpCost,
    breakCost: profile.breakCost,
    sideEffects: [...(profile.sideEffects ?? [])].sort(),
    restrictions: [...(profile.restrictions ?? [])].sort(),
  };
}

function compareFacts(derived, manual) {
  const manualEffects = new Set(manual.effects.map((effect) => effect.kind));
  const derivedEffects = new Set(derived.effects.map((effect) => effect.kind));
  const manualConditions = new Set(
    manual.conditions.map((condition) => condition.kind),
  );
  const derivedConditions = new Set(
    derived.conditions.map((condition) => condition.kind),
  );
  const manualCoverage = new Set(manual.breakerProfile?.coverage ?? []);
  const derivedCoverage = new Set(derived.breakerProfile?.coverage ?? []);
  const manualBreakerSideEffects = new Set(
    manual.breakerProfile?.sideEffects ?? [],
  );
  const derivedBreakerSideEffects = new Set(
    derived.breakerProfile?.sideEffects ?? [],
  );
  const manualRemoteRole = manual.remoteRole?.kind;
  const derivedRemoteRole = derived.remoteRole?.kind;

  const generatedOnly = [];
  const manualOnly = [];
  const matches = [];

  for (const kind of derivedEffects) {
    if (manualEffects.has(kind)) matches.push(`effect:${kind}`);
    else if (!derivedEffectIsSelfDescribing(kind, derived)) {
      generatedOnly.push(`effect:${kind}`);
    }
  }
  for (const kind of manualEffects) {
    if (
      !derivedEffects.has(kind) &&
      !derivedCoversManualEffect(kind, derived)
    ) {
      manualOnly.push(`effect:${kind}`);
    } else if (!derivedEffects.has(kind)) {
      matches.push(`effect:${kind}`);
    }
  }

  for (const kind of derivedConditions) {
    if (manualConditions.has(kind)) matches.push(`condition:${kind}`);
    else generatedOnly.push(`condition:${kind}`);
  }
  for (const kind of manualConditions) {
    if (
      !derivedConditions.has(kind) &&
      !derivedCoversManualCondition(kind, derived)
    ) {
      manualOnly.push(`condition:${kind}`);
    } else if (!derivedConditions.has(kind)) {
      matches.push(`condition:${kind}`);
    }
  }

  for (const coverage of derivedCoverage) {
    if (manualCoverage.has(coverage))
      matches.push(`breakerCoverage:${coverage}`);
    else generatedOnly.push(`breakerCoverage:${coverage}`);
  }
  for (const coverage of manualCoverage) {
    if (!derivedCoverage.has(coverage))
      manualOnly.push(`breakerCoverage:${coverage}`);
  }

  for (const sideEffect of derivedBreakerSideEffects) {
    if (manualBreakerSideEffects.has(sideEffect)) {
      matches.push(`breakerSideEffect:${sideEffect}`);
    } else {
      generatedOnly.push(`breakerSideEffect:${sideEffect}`);
    }
  }
  for (const sideEffect of manualBreakerSideEffects) {
    if (!derivedBreakerSideEffects.has(sideEffect)) {
      manualOnly.push(`breakerSideEffect:${sideEffect}`);
    }
  }

  if (derivedRemoteRole || manualRemoteRole) {
    if (derivedRemoteRole === manualRemoteRole) {
      matches.push(`remoteRole:${derivedRemoteRole}`);
    } else {
      if (derivedRemoteRole)
        generatedOnly.push(`remoteRole:${derivedRemoteRole}`);
      if (manualRemoteRole) manualOnly.push(`remoteRole:${manualRemoteRole}`);
    }
  }

  return {
    matches: matches.sort(),
    generatedOnly: generatedOnly.sort(),
    manualOnly: manualOnly.sort(),
  };
}

function derivedCoversManualEffect(kind, derived) {
  if (kind === "tag") {
    return derived.effects.some((effect) => effect.kind === "tag_source");
  }
  return false;
}

function derivedCoversManualCondition(kind, derived) {
  if (kind === "requires_installed_program") {
    return (derived.targetProfiles ?? []).some(
      (profile) =>
        profile.installsTarget === true && profile.targetCardType === "program",
    );
  }
  return false;
}

function derivedEffectIsSelfDescribing(kind, derived) {
  if (kind === "topdeck_info") {
    return (derived.targetProfiles ?? []).some(
      (profile) => profile.zone === "stack_top" && profile.showToOpponent,
    );
  }
  return false;
}

function descriptorGapsForCard(derivedFacts, overlap) {
  const gaps = [];
  if (derivedFacts.needsManualOverlayReasons.length > 0) {
    gaps.push(...derivedFacts.needsManualOverlayReasons);
  }
  if (
    derivedFacts.effects.some((effect) => effect.kind === "future_run_effect")
  ) {
    gaps.push(
      "Future-run/future-encounter semantics are currently coarse derived facts and remain state-dependent at runtime.",
    );
  }
  if (
    derivedFacts.effects.some((effect) => effect.kind === "search") &&
    !derivedFacts.targetProfiles &&
    (overlap.generatedOnly.length > 0 || overlap.manualOnly.length > 0)
  ) {
    gaps.push(
      "Search/topdeck target granularity is not fully expressible in the current ontology comparison.",
    );
  }
  const manualOnlyStrategic = overlap.manualOnly.filter(isStrategicManualOnly);
  const manualOnlyNonStrategic = overlap.manualOnly.filter(
    (item) => !isStrategicManualOnly(item),
  );
  if (manualOnlyStrategic.length > 0) {
    gaps.push(
      `Intentionally manual strategic overlay is not derived: ${manualOnlyStrategic.join(", ")}.`,
    );
  }
  if (manualOnlyNonStrategic.length > 0) {
    gaps.push("Manual ontology contains fields not currently derivable.");
  }
  if (overlap.generatedOnly.length > 0) {
    gaps.push(
      "Generated facts contain fields not currently mirrored manually.",
    );
  }
  return [...new Set(gaps)].sort();
}

function isStrategicManualOnly(item) {
  return new Set([
    "condition:requires_rnd_pressure",
    "condition:requires_successful_run",
    "effect:remote_protection",
  ]).has(item);
}

function warningsForCard({
  pilotCard,
  derivedFacts,
  manualOntologySummary,
  overlap,
  descriptorGaps,
}) {
  const warnings = [];
  for (const item of overlap.generatedOnly) {
    warnings.push({
      kind: "generated_fact_without_manual_match",
      message: `Generated ${item} has no manual ontology match.`,
    });
  }
  for (const item of overlap.manualOnly) {
    warnings.push({
      kind: "manual_ontology_without_generated_match",
      message: `Manual ${item} has no generated basic fact match.`,
    });
  }
  for (const gap of descriptorGaps) {
    warnings.push({
      kind: "descriptor_or_overlay_gap",
      message: gap,
    });
  }
  if (
    confidenceForDerivedFacts(derivedFacts) !==
    (manualOntologySummary.quality?.confidence ?? "high")
  ) {
    warnings.push({
      kind: "confidence_mismatch",
      message: `Generated confidence ${confidenceForDerivedFacts(
        derivedFacts,
      )} differs from manual confidence ${
        manualOntologySummary.quality?.confidence ?? "high"
      }.`,
    });
  }
  if (usesTextScanDerivation(derivedFacts)) {
    warnings.push({
      kind: "text_pattern_derivation",
      message:
        "Derived facts come from a read-only text/descriptor scan; no TS descriptor import is used in this gate.",
    });
  }
  if (
    pilotCard.expectedManualOverlayNeeded &&
    descriptorGaps.length === 0 &&
    overlap.generatedOnly.length === 0 &&
    overlap.manualOnly.length === 0
  ) {
    warnings.push({
      kind: "complex_card_human_review",
      message:
        "Pilot metadata marks this card as needing manual overlay or descriptor review.",
    });
  }
  return uniqueBy(
    warnings,
    (warning) => `${warning.kind}:${warning.message}`,
  ).sort(compareIssues);
}

function usesTextScanDerivation(derivedFacts) {
  return [
    ...derivedFacts.effects.map((effect) => effect.source),
    ...derivedFacts.conditions.map((condition) => condition.source),
    derivedFacts.breakerProfile?.source,
    derivedFacts.remoteRole?.source,
  ].some(
    (source) =>
      typeof source === "string" && source.startsWith("implementation."),
  );
}

function validateDerivedFacts(derivedFacts) {
  const issues = [];
  for (const [index, effect] of derivedFacts.effects.entries()) {
    validateKnown(
      effect.kind,
      KNOWN_EFFECT_KINDS,
      `effects[${index}].kind`,
      "unknown_effect_kind",
      issues,
    );
    validateKnown(
      effect.timing,
      KNOWN_TIMINGS,
      `effects[${index}].timing`,
      "unknown_effect_timing",
      issues,
    );
    validateKnown(
      effect.scope,
      KNOWN_SCOPES,
      `effects[${index}].scope`,
      "unknown_effect_scope",
      issues,
    );
    if (effect.resource !== undefined) {
      validateKnown(
        effect.resource,
        KNOWN_RESOURCES,
        `effects[${index}].resource`,
        "unknown_effect_resource",
        issues,
      );
    }
  }
  for (const [index, condition] of derivedFacts.conditions.entries()) {
    validateKnown(
      condition.kind,
      KNOWN_CONDITIONS,
      `conditions[${index}].kind`,
      "unknown_condition_kind",
      issues,
    );
  }
  for (const [index, coverage] of (
    derivedFacts.breakerProfile?.coverage ?? []
  ).entries()) {
    validateKnown(
      coverage,
      KNOWN_BREAKER_COVERAGES,
      `breakerProfile.coverage[${index}]`,
      "unknown_breaker_coverage",
      issues,
    );
  }
  for (const [index, sideEffect] of (
    derivedFacts.breakerProfile?.sideEffects ?? []
  ).entries()) {
    validateKnown(
      sideEffect,
      KNOWN_BREAKER_SIDE_EFFECTS,
      `breakerProfile.sideEffects[${index}]`,
      "unknown_breaker_side_effect",
      issues,
    );
  }
  if (derivedFacts.remoteRole) {
    validateKnown(
      derivedFacts.remoteRole.kind,
      KNOWN_REMOTE_ROLES,
      "remoteRole.kind",
      "unknown_remote_role",
      issues,
    );
  }
  for (const [index, targetProfile] of (
    derivedFacts.targetProfiles ?? []
  ).entries()) {
    validateKnown(
      targetProfile.zone,
      KNOWN_TARGET_ZONES,
      `targetProfiles[${index}].zone`,
      "unknown_target_zone",
      issues,
    );
    if (targetProfile.targetCardType !== undefined) {
      validateKnown(
        targetProfile.targetCardType,
        KNOWN_TARGET_CARD_TYPES,
        `targetProfiles[${index}].targetCardType`,
        "unknown_target_card_type",
        issues,
      );
    }
    if (targetProfile.installCost !== undefined) {
      validateKnown(
        targetProfile.installCost,
        KNOWN_TARGET_INSTALL_COSTS,
        `targetProfiles[${index}].installCost`,
        "unknown_target_install_cost",
        issues,
      );
    }
    for (const field of [
      "installsTarget",
      "shuffleAfter",
      "showToOpponent",
      "oncePerRun",
    ]) {
      if (
        targetProfile[field] !== undefined &&
        typeof targetProfile[field] !== "boolean"
      ) {
        issues.push({
          kind: "invalid_target_profile_shape",
          message: `Expected boolean at targetProfiles[${index}].${field}.`,
        });
      }
    }
    if (
      targetProfile.lookCount !== undefined &&
      (!Number.isFinite(targetProfile.lookCount) || targetProfile.lookCount < 1)
    ) {
      issues.push({
        kind: "invalid_target_profile_shape",
        message: `Expected positive number at targetProfiles[${index}].lookCount.`,
      });
    }
  }
  return issues;
}

function validateKnown(value, knownValues, fieldPath, kind, issues) {
  if (!knownValues.has(value)) {
    issues.push({
      kind,
      message: `Unknown ontology value at ${fieldPath}: ${String(value)}`,
    });
  }
}

function findHiddenInfoRiskFields(input, pathValue = "$") {
  const hits = [];
  if (Array.isArray(input)) {
    input.forEach((value, index) => {
      hits.push(...findHiddenInfoRiskFields(value, `${pathValue}[${index}]`));
    });
    return hits;
  }
  if (!input || typeof input !== "object") return hits;
  for (const [key, value] of Object.entries(input)) {
    if (HIDDEN_INFO_RISK_FIELDS.has(key)) hits.push(`${pathValue}.${key}`);
    hits.push(...findHiddenInfoRiskFields(value, `${pathValue}.${key}`));
  }
  return hits;
}

function crystalPalaceHardConflict(cardId, derivedFacts, manual) {
  if (cardId !== "onr_v1_355_crystal-palace-station-grid") return undefined;
  const generatedRunTax = derivedFacts.effects.some(
    (effect) => effect.kind === "run_tax",
  );
  if (!generatedRunTax) return undefined;
  const manualValues = [
    ...manual.roles,
    ...manual.planRoles,
    ...manual.effects.map((effect) => effect.kind),
  ];
  const denied = manualValues.filter((value) =>
    CRYSTAL_PALACE_DENYLIST.has(value),
  );
  if (denied.length === 0) return undefined;
  return {
    kind: "crystal_palace_semantic_conflict",
    cardId,
    message: `Generated run_tax conflicts with manual Economy/Counter overlay: ${denied.join(", ")}`,
  };
}

function derivedKindSet(derivedFacts) {
  return new Set([
    ...derivedFacts.effects.map((effect) => `effect:${effect.kind}`),
    ...derivedFacts.conditions.map(
      (condition) => `condition:${condition.kind}`,
    ),
    ...(derivedFacts.breakerProfile?.coverage ?? []).map(
      (coverage) => `breakerCoverage:${coverage}`,
    ),
    ...(derivedFacts.remoteRole
      ? [`remoteRole:${derivedFacts.remoteRole.kind}`]
      : []),
  ]);
}

function confidenceForDerivedFacts(derivedFacts) {
  const values = [
    ...derivedFacts.effects.map((effect) => effect.confidence),
    ...derivedFacts.conditions.map((condition) => condition.confidence),
    derivedFacts.breakerProfile?.confidence,
    derivedFacts.remoteRole?.confidence,
  ].filter(Boolean);
  if (values.includes("low")) return "low";
  if (values.includes("medium")) return "medium";
  return "high";
}

function amountNear(text, kind) {
  const match = text.match(
    new RegExp(`kind:\\s*"${kind}"[\\s\\S]{0,240}?amount:\\s*(\\d+)`),
  );
  return match ? Number(match[1]) : undefined;
}

function countNear(text, kind) {
  const match = text.match(
    new RegExp(`kind:\\s*"${kind}"[\\s\\S]{0,240}?count:\\s*(\\d+)`),
  );
  return match ? Number(match[1]) : undefined;
}

function valueNear(text, field) {
  const match = text.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  return match?.[1];
}

function arrayFirstNear(text, field) {
  const match = text.match(new RegExp(`${field}:\\s*\\[\\s*"([^"]+)"`));
  return match?.[1];
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countKinds(values) {
  const counts = values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function sortReport(report) {
  return {
    ...report,
    hardErrors: [...report.hardErrors].sort(compareIssues),
    hardConflicts: [...report.hardConflicts].sort(compareIssues),
    warnings: [...report.warnings].sort(compareIssues),
    cards: [...report.cards].sort((a, b) => a.cardId.localeCompare(b.cardId)),
  };
}

function compareIssues(a, b) {
  return (
    String(a.cardId ?? "").localeCompare(String(b.cardId ?? "")) ||
    String(a.kind ?? "").localeCompare(String(b.kind ?? "")) ||
    String(a.message ?? "").localeCompare(String(b.message ?? ""))
  );
}

function compareByKindTimingScope(a, b) {
  return (
    String(a.kind ?? "").localeCompare(String(b.kind ?? "")) ||
    String(a.timing ?? "").localeCompare(String(b.timing ?? "")) ||
    String(a.scope ?? "").localeCompare(String(b.scope ?? ""))
  );
}

function summaryLine(report) {
  return (
    [
      `AI_DERIVED_FACTS ${report.hardErrorCount === 0 ? "OK" : "FAIL"}`,
      `pilotCards=${report.pilotCardCount}`,
      `implementations=${report.implementationFoundCount}`,
      `derivedFacts=${report.cardsWithDerivedFacts}`,
      `overlaps=${report.cardsWithManualOntologyOverlap}`,
      `manualOverlay=${report.cardsNeedingManualOverlay}`,
      `errors=${report.hardErrorCount}`,
      `warnings=${report.warningCount}`,
    ].join(" ") + "\n"
  );
}

function parseArgs(argv, defaults) {
  const args = {
    check: false,
    write: false,
    json: false,
    pilotOnly: false,
    reportPath: defaults.defaultReportPath ?? DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") args.check = true;
    else if (arg === "--write") args.write = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--pilot-only") args.pilotOnly = true;
    else if (arg === "--report") args.reportPath = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolvePath(repoRoot, candidate) {
  return path.isAbsolute(candidate)
    ? candidate
    : path.join(repoRoot, candidate);
}

function relativePath(repoRoot, candidate) {
  return path.relative(repoRoot, candidate).replaceAll("\\", "/");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}

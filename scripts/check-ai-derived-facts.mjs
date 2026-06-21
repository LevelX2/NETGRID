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
  "hq_info",
  "expose_info",
  "zone_shuffle",
  "etr",
  "extra_action",
  "counter_economy",
  "action_economy",
  "start_of_turn_economy",
  "recurring_economy",
  "advanceable_economy",
  "scored_agenda_action",
  "advance_burst",
  "shuffle_draw",
  "card_recovery",
  "agenda_reveal_economy",
  "advance",
  "install",
  "rez",
  "remote_build",
  "global_modifier",
  "finite_economy_pool",
  "future_run_effect",
  "future_encounter_effect",
  "access_replacement",
  "install_discount",
  "rez_discount",
  "program_trash",
  "ice_trash",
  "installed_card_trash",
  "hardware_trash",
  "run_lock",
  "no_jack_out",
  "persistent_counter_effect",
  "trace_credit",
  "resource_trash",
  "link_penalty",
  "tag_punish_payoff",
  "tag_source",
  "remote_tax",
  "access_punish",
  "ambush",
  "damage_prevention",
  "flatline_prevention",
  "program_trash_prevention",
  "hardware_trash_prevention",
  "resource_trash_prevention",
  "tag_prevention",
  "trace_defense",
  "link",
  "base_link",
  "remove_brain_damage",
  "meat_damage_prevention",
  "net_damage_prevention",
  "brain_damage_prevention",
  "hand_size_modifier",
  "hardware_trait",
  "program_host",
  "action_penalty",
  "persistent_survival_modifier",
  "prevention_replacement",
  "survival_payoff",
  "delayed_penalty",
]);

const KNOWN_TIMINGS = new Set([
  "action",
  "scored_activated",
  "when_scored",
  "start_of_turn",
  "during_run",
  "on_access",
  "on_rez",
  "persistent",
  "encounter",
  "successful_run",
  "trace_success",
  "corp_turn",
  "runner_turn",
  "prevention_window",
  "damage_window",
  "flatline_replacement",
  "trace_window",
  "install",
  "on_leave_play",
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
  "installed_program",
  "trace",
  "damage",
  "hardware",
  "resource",
  "heap",
  "stack",
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
  "net_damage",
  "meat_damage",
  "brain_damage",
  "hand_size",
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
  "requires_encounter",
  "requires_unbroken_subroutine",
  "requires_later_encounter",
  "requires_remaining_ice",
  "requires_agenda_in_hq",
  "requires_agenda_reveal",
  "requires_hq_agenda",
  "requires_installed_ice",
  "requires_rezzed_ice",
  "requires_score_window",
  "requires_corp_credits_threshold",
  "requires_start_of_turn",
  "requires_stolen_agenda_last_turn",
  "requires_archives_card",
  "requires_rnd_top",
  "requires_advancement_counter",
  "requires_installed_card",
  "requires_rezzed_card",
  "requires_runner_draw",
  "requires_runner_pay_or_take_tag",
  "requires_damage",
  "requires_net_damage",
  "requires_meat_damage",
  "requires_brain_damage",
  "requires_flatline",
  "requires_program_trash",
  "requires_trace_attempt",
  "requires_prevention_window",
  "requires_turn_limit_available",
  "requires_runner_action",
  "requires_installed_resource",
  "requires_installed_hardware",
  "requires_grip_card",
  "requires_stack_search",
  "requires_heap_card",
  "requires_credit_pool",
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
  "tag_punish_asset",
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

const KNOWN_TARGET_PROFILE_SCHEMA_VERSIONS = new Set(["target-profile-v1"]);
const KNOWN_TARGET_PROFILE_KINDS = new Set([
  "install_target",
  "mode_choice",
  "search_install_target",
  "hosted_install_target",
  "use_target",
  "replacement_target",
]);
const KNOWN_TARGET_PROFILE_TIMINGS = new Set([
  "on_install",
  "on_play",
  "paid_action",
  "during_ice_encounter",
  "on_use",
  "after_successful_run",
  "prevention_window",
  "replacement_window",
]);
const KNOWN_TARGET_PROFILE_TARGET_TYPES = new Set([
  "installed_ice",
  "ice_type",
  "program",
  "icebreaker",
  "hosted_program",
  "server",
  "card",
]);
const KNOWN_TARGET_PROFILE_PREFERENCES = new Set([
  "known_or_rezzed_ice",
  "known_sentry",
  "known_wall",
  "known_code_gate",
  "current_encounter_ice",
  "blocks_relevant_run_path",
  "high_strength_ice",
  "high_break_cost_without_bonus",
  "multi_subroutine_ice",
  "relevant_server_ice",
  "missing_current_coverage",
  "type_blocking_relevant_run_path",
  "type_with_known_problem_ice",
  "type_missing_in_current_rig",
  "program_breaks_current_ice",
  "program_repairs_missing_coverage",
  "program_affordable_after_install",
  "program_preserves_run_goal",
  "low_mu_program",
  "installed_icebreaker",
  "hosted_icebreaker_eligible",
  "trash_prevention_high_value_program",
  "currently_used_breaker",
  "breaker_matching_current_ice",
  "breaker_matching_common_problem_ice",
]);
const KNOWN_TARGET_PROFILE_AVOIDS = new Set([
  "unknown_low_information_target",
  "irrelevant_server_ice",
  "already_cheap_to_break",
  "non_matching_ice_type",
  "unaffordable_after_install",
  "hidden_info_dependent_choice",
  "low_value_program",
  "target_would_break_host_limit",
]);
const KNOWN_TARGET_PROFILE_HIDDEN_INFO_POLICIES = new Set([
  "visible_or_known_only",
  "legal_targets_only",
  "public_or_controller_known_only",
]);

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

    if (!implementationFound && !options.allowMissingImplementation) {
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
  const expectedKinds = new Set(card.expectedDerivableKinds ?? []);
  const expectsKind = (kind) => expectedKinds.has(kind);
  const facts = {
    effects: [],
    conditions: [],
    costProfile: {},
    derivationNotes: [],
    needsManualOverlayReasons: [],
  };

  const isAgenda = hint?.cardType === "agenda";
  const isCorpIce = hint?.side === "corp" && hint?.cardType === "ice";
  const isPriorFutureRunIce = new Set([
    "onr_v1_274_tutor",
    "onr_v1_276_viral-15",
    "onr_v1_277_virizz",
  ]).has(card.cardId);
  const hasActivatedEffect = (kind) =>
    new RegExp(`kind:\\s*"activated"[\\s\\S]*?kind:\\s*"${kind}"`).test(
      implementationText,
    );

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

  if (
    /kind:\s*"gain_credits"/.test(implementationText) &&
    (!isAgenda || hasActivatedEffect("gain_credits"))
  ) {
    addEffect(facts, {
      kind: "economy",
      timing: isAgenda ? "scored_activated" : "action",
      scope: hint?.side ?? "corp",
      resource: "credits",
      amount: amountNear(implementationText, "gain_credits"),
      source: "implementation.effect.gain_credits",
    });
    if (expectsKind("effect:action_economy")) {
      addEffect(facts, {
        kind: "action_economy",
        timing: "action",
        scope: hint?.side ?? "corp",
        resource: "credits",
        amount: amountNear(implementationText, "gain_credits"),
        source: "implementation.effect.gain_credits",
      });
    }
  }

  if (/kind:\s*"trash_cards_from_grip_for_credits"/.test(implementationText)) {
    addEffect(facts, {
      kind: "economy",
      timing: "action",
      scope: "runner",
      resource: "credits",
      amount: propertyNumber(implementationText, "gainPerTrashed"),
      source: "implementation.effect.trash_cards_from_grip_for_credits",
    });
    addCondition(facts, {
      kind: "requires_grip_card",
      source: "implementation.effect.trash_cards_from_grip_for_credits",
    });
    facts.derivationNotes.push(
      "Grip-trash economy records gain-per-trashed-card only; selected hand cards remain hidden-zone context.",
    );
  }

  if (/kind:\s*"pay_credits_or_lose_game"/.test(implementationText)) {
    addEffect(facts, {
      kind: "delayed_penalty",
      timing: "on_leave_play",
      scope: hint?.side ?? "runner",
      resource: "credits",
      amount: amountNear(implementationText, "pay_credits_or_lose_game"),
      source: "implementation.lifecycle.on_leave_play.pay_credits_or_lose_game",
    });
    facts.derivationNotes.push(
      "Pay-or-lose-game debt is recorded as delayed penalty context, not as pure economy value.",
    );
  }

  if (
    /start_of_runner_turn[\s\S]*?kind:\s*"lose_credits"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "delayed_penalty",
      timing: "start_of_turn",
      scope: "runner",
      resource: "credits",
      amount: amountNear(implementationText, "lose_credits"),
      source: "implementation.lifecycle.start_of_runner_turn.lose_credits",
    });
    if (expectsKind("condition:requires_start_of_turn")) {
      addCondition(facts, {
        kind: "requires_start_of_turn",
        source: "implementation.lifecycle.start_of_runner_turn",
      });
    }
  }

  const hasHostedCreditTakeAbility = /hostedCreditTakeAbility\s*\(/.test(
    implementationText,
  );
  const hasHostedCreditAddAbility = /hostedCreditAddAbility\s*\(/.test(
    implementationText,
  );
  const hostedCreditTakeAmount =
    functionCallPropertyNumber(
      implementationText,
      "hostedCreditTakeAbility",
      "amount",
    ) ?? amountNear(implementationText, "take_hosted_credits");
  const hostedCreditAddAmount =
    functionCallPropertyNumber(
      implementationText,
      "hostedCreditAddAbility",
      "amount",
    ) ??
    amountNear(implementationText, "add_hosted_credits") ??
    functionCallNumber(implementationText, "addHostedCredits");
  if (
    (/kind:\s*"take_hosted_credits"/.test(implementationText) &&
      (!isAgenda || hasActivatedEffect("take_hosted_credits"))) ||
    hasHostedCreditTakeAbility
  ) {
    addEffect(facts, {
      kind: "counter_economy",
      timing: isAgenda ? "scored_activated" : "action",
      scope: hint?.side === "runner" ? "runner" : "corp",
      resource: "credits",
      amount: hostedCreditTakeAmount,
      source: "implementation.effect.take_hosted_credits",
    });
    if (expectsKind("effect:action_economy")) {
      addEffect(facts, {
        kind: "action_economy",
        timing: isAgenda ? "scored_activated" : "action",
        scope: hint?.side === "runner" ? "runner" : "corp",
        resource: "credits",
        amount: hostedCreditTakeAmount,
        source: "implementation.effect.take_hosted_credits",
      });
    }
  }

  if (
    /kind:\s*"draw_cards"/.test(implementationText) &&
    (!isAgenda || hasActivatedEffect("draw_cards"))
  ) {
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

  if (
    /kind:\s*"gain_actions"/.test(implementationText) &&
    (!isAgenda || hasActivatedEffect("gain_actions"))
  ) {
    addEffect(facts, {
      kind: "extra_action",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "corp",
      resource: "actions",
      amount: amountNear(implementationText, "gain_actions"),
      source: "implementation.effect.gain_actions",
    });
  }

  const hasScoredAgendaDefinition =
    /scoredAgenda:\s*(?:\{|[A-Za-z_$][\w$]*\s*\()/.test(implementationText);
  if (
    hasScoredAgendaDefinition ||
    (/lifecycle:\s*\{[\s\S]*?on_score:\s*\[/.test(implementationText) &&
      expectsKind("condition:requires_scored_agenda"))
  ) {
    addCondition(facts, {
      kind: "requires_scored_agenda",
      source: "implementation.scoredAgenda",
    });
  }

  if (/kind:\s*"gain_credits_on_score"/.test(implementationText)) {
    addEffect(facts, {
      kind: "economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "amount"),
      source: "implementation.scoredAgenda.gain_credits_on_score",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source: "implementation.scoredAgenda.gain_credits_on_score",
    });
  }

  if (
    /kind:\s*"score_credit_swing_if_corp_credit_threshold_met"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "gainAmount"),
      source:
        "implementation.scoredAgenda.score_credit_swing_if_corp_credit_threshold_met",
    });
    addEffect(facts, {
      kind: "counter_economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      source:
        "implementation.scoredAgenda.score_credit_swing_if_corp_credit_threshold_met.fail",
    });
    addCondition(facts, {
      kind: "requires_corp_credits_threshold",
      source:
        "implementation.scoredAgenda.score_credit_swing_if_corp_credit_threshold_met",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source:
        "implementation.scoredAgenda.score_credit_swing_if_corp_credit_threshold_met",
    });
    facts.derivationNotes.push(
      "Corporate War variable credit swing is represented as threshold-gated economy/counter-economy only; generated facts do not assert current credit state.",
    );
  }

  if (
    /kind:\s*"corporate_downsizing_hq_agendas"/.test(implementationText) ||
    /kind:\s*"shuffle_selected_hq_agendas_into_rd_gain_credits"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "agenda_reveal_economy",
      timing: "when_scored",
      scope: "hq",
      resource: "credits",
      amount: propertyNumber(implementationText, "creditPerAgendaPoint"),
      source: "implementation.scoredAgenda.corporate_downsizing_hq_agendas",
    });
    addEffect(facts, {
      kind: "economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      source: "implementation.scoredAgenda.corporate_downsizing_hq_agendas",
    });
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "when_scored",
      scope: "rnd",
      resource: "cards",
      source:
        "implementation.scoredAgenda.corporate_downsizing_hq_agendas.shuffleSelectedIntoRnd",
    });
    addCondition(facts, {
      kind: "requires_agenda_in_hq",
      source: "implementation.scoredAgenda.corporate_downsizing_hq_agendas",
    });
    addCondition(facts, {
      kind: "requires_agenda_reveal",
      source: "implementation.scoredAgenda.corporate_downsizing_hq_agendas",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source: "implementation.scoredAgenda.corporate_downsizing_hq_agendas",
    });
    facts.derivationNotes.push(
      "Corporate Downsizing is represented as HQ-agenda reveal/economy context only; generated facts do not contain hidden HQ agenda identities.",
    );
  }

  if (
    /kind:\s*"priority_requisition_rez_ice_at_no_cost"/.test(
      implementationText,
    ) ||
    /kind:\s*"score_rez_installed_ice_at_no_cost"/.test(implementationText) ||
    (expectsKind("effect:rez") &&
      expectsKind("effect:rez_discount") &&
      /lifecycle:\s*\{[\s\S]*?on_score:\s*\[/.test(implementationText))
  ) {
    addEffect(facts, {
      kind: "rez_discount",
      timing: "when_scored",
      scope: "ice",
      resource: "credits",
      source:
        "implementation.scoredAgenda.priority_requisition_rez_ice_at_no_cost",
    });
    addEffect(facts, {
      kind: "rez",
      timing: "when_scored",
      scope: "ice",
      source:
        "implementation.scoredAgenda.priority_requisition_rez_ice_at_no_cost",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source:
        "implementation.scoredAgenda.priority_requisition_rez_ice_at_no_cost",
    });
  }

  if (
    /kind:\s*"security_purge_top_rd"/.test(implementationText) ||
    /kind:\s*"reveal_top_rd_install_and_rez_ice_trash_rest"/.test(
      implementationText,
    ) ||
    (expectsKind("effect:topdeck_info") &&
      expectsKind("effect:install") &&
      expectsKind("effect:rez_discount") &&
      /lifecycle:\s*\{[\s\S]*?on_score:\s*\[/.test(implementationText))
  ) {
    addEffect(facts, {
      kind: "topdeck_info",
      timing: "when_scored",
      scope: "rnd",
      resource: "cards",
      amount: propertyNumber(implementationText, "count"),
      source: "implementation.scoredAgenda.security_purge_top_rd",
    });
    addEffect(facts, {
      kind: "install",
      timing: "when_scored",
      scope: "remote",
      source: "implementation.scoredAgenda.security_purge_top_rd.installIce",
    });
    addEffect(facts, {
      kind: "rez_discount",
      timing: "when_scored",
      scope: "ice",
      resource: "credits",
      source: "implementation.scoredAgenda.security_purge_top_rd.rezAtNoCost",
    });
    addCondition(facts, {
      kind: "requires_rnd_top",
      source: "implementation.scoredAgenda.security_purge_top_rd",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source: "implementation.scoredAgenda.security_purge_top_rd",
    });
    facts.derivationNotes.push(
      "Security Purge is represented as R&D top reveal/install/rez-discount context only; generated facts do not expose actual hidden R&D order.",
    );
  }

  const hasHqToNewRemoteInstallRezSequence =
    /kind:\s*"score_install_hq_cards_into_new_remote_then_rez"/.test(
      implementationText,
    ) || /hqToNewRemoteInstallRezSequence\s*\(/.test(implementationText);
  if (hasHqToNewRemoteInstallRezSequence) {
    const temporaryCreditAmount =
      propertyNumber(implementationText, "temporaryCredits") ??
      functionCallPropertyNumber(
        implementationText,
        "hqToNewRemoteInstallRezSequence",
        "temporaryCredits",
      ) ??
      propertyNumber(implementationText, "amount");
    addEffect(facts, {
      kind: "economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      amount: temporaryCreditAmount,
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez",
    });
    addEffect(facts, {
      kind: "remote_build",
      timing: "when_scored",
      scope: "remote",
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez",
    });
    addEffect(facts, {
      kind: "install",
      timing: "when_scored",
      scope: "remote",
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez.install",
    });
    addEffect(facts, {
      kind: "rez",
      timing: "when_scored",
      scope: "remote",
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez.rez",
    });
    addCondition(facts, {
      kind: "requires_hq_agenda",
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source:
        "implementation.scoredAgenda.score_install_hq_cards_into_new_remote_then_rez",
    });
    facts.derivationNotes.push(
      "Data Fort Reclamation temporary credits and HQ card choices are board/legal-action context; generated facts do not include hidden HQ card identities.",
    );
  }

  if (
    /kind:\s*"ai_cfo_shuffle_hq_archives_into_rd_draw"/.test(
      implementationText,
    ) ||
    /kind:\s*"shuffle_hq_archives_into_rd_then_draw"/.test(
      implementationText,
    ) ||
    (expectsKind("effect:shuffle_draw") &&
      expectsKind("effect:zone_shuffle") &&
      expectsKind("effect:draw") &&
      /abilities:\s*\[/.test(implementationText))
  ) {
    addEffect(facts, {
      kind: "shuffle_draw",
      timing: "scored_activated",
      scope: "corp",
      resource: "cards",
      amount: propertyNumber(implementationText, "drawCount"),
      source:
        "implementation.scoredAgenda.ai_cfo_shuffle_hq_archives_into_rd_draw",
    });
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "scored_activated",
      scope: "rnd",
      resource: "cards",
      source:
        "implementation.scoredAgenda.ai_cfo_shuffle_hq_archives_into_rd_draw",
    });
    addEffect(facts, {
      kind: "draw",
      timing: "scored_activated",
      scope: "corp",
      resource: "cards",
      amount: propertyNumber(implementationText, "drawCount"),
      source:
        "implementation.scoredAgenda.ai_cfo_shuffle_hq_archives_into_rd_draw",
    });
    facts.derivationNotes.push(
      "AI Chief Financial Officer shuffle/draw is represented without hidden HQ, Archives or R&D order data.",
    );
  }

  if (
    /kind:\s*"corporate_retreat_disable_on_rez_or_install"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "scored_agenda_action",
      timing: "scored_activated",
      scope: "score_area",
      source: "implementation.scoredAgenda.corporate_retreat",
    });
    addEffect(facts, {
      kind: "economy",
      timing: "scored_activated",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "gainAmount"),
      source: "implementation.scoredAgenda.corporate_retreat",
    });
    facts.derivationNotes.push(
      "Corporate Retreat disable-on-install-or-rez state remains engine context; generated facts only describe the score-area economy action class.",
    );
  }

  if (
    /kind:\s*"reveal_installed_ice_subtype_for_credits"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "economy",
      timing: "when_scored",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "creditPerRevealedOrRezzed"),
      source:
        "implementation.scoredAgenda.reveal_installed_ice_subtype_for_credits",
    });
    addCondition(facts, {
      kind: "requires_installed_ice",
      source:
        "implementation.scoredAgenda.reveal_installed_ice_subtype_for_credits",
    });
    addCondition(facts, {
      kind: "requires_score_window",
      source:
        "implementation.scoredAgenda.reveal_installed_ice_subtype_for_credits",
    });
  }

  const hasScoredRezzedIceMarkModifier =
    /kind:\s*"select_rezzed_ice_mark_modifier"/.test(implementationText) ||
    /scoredRezzedIceMarkModifier\s*\(/.test(implementationText);
  if (hasScoredRezzedIceMarkModifier) {
    addEffect(facts, {
      kind: "global_modifier",
      timing: "when_scored",
      scope: "ice",
      resource: "subroutines",
      source: "implementation.scoredAgenda.select_rezzed_ice_mark_modifier",
    });
    addEffect(facts, {
      kind: "remote_protection",
      timing: "when_scored",
      scope: "ice",
      resource: "strength",
      amount: 1,
      source: "implementation.scoredAgenda.select_rezzed_ice_mark_modifier",
    });
    addCondition(facts, {
      kind: "requires_rezzed_ice",
      source: "implementation.scoredAgenda.select_rezzed_ice_mark_modifier",
    });
  }

  const hiddenSuccessfulRunCreditLossBlock =
    hiddenSuccessfulRunBeforeAccessFactoryBlock(
      implementationText,
      "hq",
      "corp_lose_credits",
    );
  if (hiddenSuccessfulRunCreditLossBlock) {
    addEffect(facts, {
      kind: "counter_economy",
      timing: "successful_run",
      scope: "hq",
      resource: "credits",
      amount: propertyNumber(hiddenSuccessfulRunCreditLossBlock, "amount"),
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.corp_lose_credits",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.corp_lose_credits",
    });
    facts.derivationNotes.push(
      "Hidden successful-run HQ credit-loss factory facts describe only effect class, timing and HQ scope; generated facts do not include hidden resource slots, HQ cards or access identities.",
    );
  }

  const hiddenSuccessfulRunRemoteTrashBlock =
    hiddenSuccessfulRunBeforeAccessFactoryBlock(
      implementationText,
      "remote",
      "trash_remote_fort",
    );
  if (hiddenSuccessfulRunRemoteTrashBlock) {
    addEffect(facts, {
      kind: "installed_card_trash",
      timing: "successful_run",
      scope: "remote",
      target: "remote_fort_root_and_ice",
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.trash_remote_fort",
    });
    addEffect(facts, {
      kind: "ice_trash",
      timing: "successful_run",
      scope: "remote",
      target: "remote_fort_ice",
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.trash_remote_fort",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.trash_remote_fort",
    });
    addCondition(facts, {
      kind: "requires_remote_server",
      source:
        "implementation.successfulRunFollowups.hidden_successful_run_before_access.trash_remote_fort",
    });
    facts.derivationNotes.push(
      "Hidden successful-run remote-trash factory facts describe only remote fort disruption classes and timing; generated facts do not include installed card identities, option lists or private board state.",
    );
  }

  if (/kind:\s*"choose_fort_ice_strength_bonus"/.test(implementationText)) {
    addEffect(facts, {
      kind: "global_modifier",
      timing: "when_scored",
      scope: "fort",
      resource: "strength",
      amount: propertyNumber(implementationText, "amount"),
      source: "implementation.scoredAgenda.choose_fort_ice_strength_bonus",
    });
    addCondition(facts, {
      kind: "requires_remote_server",
      source: "implementation.scoredAgenda.choose_fort_ice_strength_bonus",
    });
  }

  if (/kind:\s*"meat_damage_bonus"/.test(implementationText)) {
    addEffect(facts, {
      kind: "global_modifier",
      timing: "persistent",
      scope: "corp",
      resource: "damage",
      amount: propertyNumber(implementationText, "amount"),
      source: "implementation.scoredAgenda.meat_damage_bonus",
    });
  }

  if (/kind:\s*"agenda_difficulty"/.test(implementationText)) {
    addEffect(facts, {
      kind: "score_acceleration",
      timing: "persistent",
      scope: "corp",
      resource: "advancement_counters",
      amount: amountNear(implementationText, "agenda_difficulty"),
      source: "implementation.modifiers.agenda_difficulty",
    });
    addEffect(facts, {
      kind: "global_modifier",
      timing: "persistent",
      scope: "corp",
      resource: "advancement_counters",
      amount: amountNear(implementationText, "agenda_difficulty"),
      source: "implementation.modifiers.agenda_difficulty",
    });
  }

  if (
    expectsKind("condition:requires_score_window") &&
    /lifecycle:\s*\{[\s\S]*?on_score:\s*\[/.test(implementationText)
  ) {
    addCondition(facts, {
      kind: "requires_score_window",
      source: "implementation.lifecycle.on_score",
    });
  }

  if (
    expectsKind("effect:finite_economy_pool") &&
    (/kind:\s*"add_hosted_credits"/.test(implementationText) ||
      /addHostedCredits\s*\(/.test(implementationText) ||
      hasHostedCreditAddAbility)
  ) {
    addEffect(facts, {
      kind: "finite_economy_pool",
      timing: isAgenda ? "when_scored" : "action",
      scope: isAgenda
        ? "score_area"
        : hint?.side === "runner"
          ? "runner"
          : "remote",
      resource: "credits",
      amount: hostedCreditAddAmount,
      source: isAgenda
        ? "implementation.lifecycle.on_score.add_hosted_credits"
        : "implementation.effect.add_hosted_credits",
    });
    if (hint?.side === "runner") {
      addCondition(facts, {
        kind:
          hint?.cardType === "resource"
            ? "requires_installed_resource"
            : "requires_installed_card",
        source: "implementation.effect.add_hosted_credits",
      });
    }
  }
  if (expectsKind("effect:action_economy") && hasHostedCreditAddAbility) {
    addEffect(facts, {
      kind: "action_economy",
      timing: "action",
      scope: hint?.side ?? "corp",
      resource: "credits",
      amount: hostedCreditAddAmount,
      source: "implementation.effect.add_hosted_credits",
    });
  }

  if (
    expectsKind("condition:requires_start_of_turn") &&
    /start_of_corp_turn/.test(implementationText)
  ) {
    addCondition(facts, {
      kind: "requires_start_of_turn",
      source: "implementation.lifecycle.start_of_corp_turn",
    });
    if (
      /start_of_corp_turn[\s\S]*?kind:\s*"gain_credits"/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "economy",
        timing: "start_of_turn",
        scope: "corp",
        resource: "credits",
        amount: amountNear(implementationText, "gain_credits"),
        source: "implementation.lifecycle.start_of_corp_turn.gain_credits",
      });
      if (expectsKind("effect:start_of_turn_economy")) {
        addEffect(facts, {
          kind: "start_of_turn_economy",
          timing: "start_of_turn",
          scope: "corp",
          resource: "credits",
          amount: amountNear(implementationText, "gain_credits"),
          source: "implementation.lifecycle.start_of_corp_turn.gain_credits",
        });
      }
    }
    if (
      /start_of_corp_turn[\s\S]*?kind:\s*"gain_actions"/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "extra_action",
        timing: "start_of_turn",
        scope: "corp",
        resource: "actions",
        amount: amountNear(implementationText, "gain_actions"),
        source: "implementation.lifecycle.start_of_corp_turn.gain_actions",
      });
    }
    if (
      /start_of_corp_turn[\s\S]*?kind:\s*"take_hosted_credits"/.test(
        implementationText,
      ) ||
      /start_of_corp_turn[\s\S]*?hostedCreditTakeTurnTrigger\s*\(/.test(
        implementationText,
      )
    ) {
      const startTurnHostedCreditAmount =
        amountNear(implementationText, "take_hosted_credits") ??
        propertyNumber(implementationText, "amount");
      addEffect(facts, {
        kind: "counter_economy",
        timing: "start_of_turn",
        scope: "corp",
        resource: "credits",
        amount: startTurnHostedCreditAmount,
        source:
          "implementation.lifecycle.start_of_corp_turn.take_hosted_credits",
      });
      if (expectsKind("effect:start_of_turn_economy")) {
        addEffect(facts, {
          kind: "start_of_turn_economy",
          timing: "start_of_turn",
          scope: "corp",
          resource: "credits",
          amount: startTurnHostedCreditAmount,
          source:
            "implementation.lifecycle.start_of_corp_turn.take_hosted_credits",
        });
      }
      if (expectsKind("effect:recurring_economy")) {
        addEffect(facts, {
          kind: "recurring_economy",
          timing: "start_of_turn",
          scope: "corp",
          resource: "credits",
          amount: startTurnHostedCreditAmount,
          source:
            "implementation.lifecycle.start_of_corp_turn.take_hosted_credits",
        });
      }
    }
  }

  if (/kind:\s*"corp_rd_top_reorder"/.test(implementationText)) {
    addEffect(facts, {
      kind: "topdeck_info",
      timing: "action",
      scope: "rnd",
      resource: "cards",
      amount: propertyNumber(implementationText, "count"),
      source: "implementation.corpUtility.corp_rd_top_reorder",
    });
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "action",
      scope: "rnd",
      resource: "cards",
      source: "implementation.corpUtility.corp_rd_top_reorder",
    });
    addCondition(facts, {
      kind: "requires_rnd_top",
      source: "implementation.corpUtility.corp_rd_top_reorder",
    });
    facts.derivationNotes.push(
      "Corp R&D-top reorder is represented as hidden-zone context only; generated facts do not contain actual R&D order.",
    );
  }

  if (/kind:\s*"move_installed_corp_card_to_hq"/.test(implementationText)) {
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "action",
      scope: "hq",
      resource: "cards",
      source: "implementation.corpUtility.move_installed_corp_card_to_hq",
    });
    facts.derivationNotes.push(
      "Installed-card-to-HQ movement is represented as zone context only; generated facts do not include hidden HQ card identities.",
    );
  }

  if (
    /kind:\s*"shuffle_hq_into_rd_then_draw_same_count"/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "action",
      scope: "rnd",
      resource: "cards",
      source:
        "implementation.corpUtility.shuffle_hq_into_rd_then_draw_same_count",
    });
    addEffect(facts, {
      kind: "draw",
      timing: "action",
      scope: "corp",
      resource: "cards",
      source:
        "implementation.corpUtility.shuffle_hq_into_rd_then_draw_same_count",
    });
    facts.derivationNotes.push(
      "HQ shuffle/draw is represented without hidden HQ or R&D order data.",
    );
  }

  if (/kind:\s*"corp_archives_to_hq"/.test(implementationText)) {
    addEffect(facts, {
      kind: "card_recovery",
      timing: "action",
      scope: "archives",
      resource: "cards",
      source: "implementation.corpUtility.corp_archives_to_hq",
    });
    addCondition(facts, {
      kind: "requires_archives_card",
      source: "implementation.corpUtility.corp_archives_to_hq",
    });
    facts.derivationNotes.push(
      "Archives-to-HQ recovery is represented without hidden Archives/HQ card identities.",
    );
  }

  if (/kind:\s*"silver_lining_recovery"/.test(implementationText)) {
    addEffect(facts, {
      kind: "economy",
      timing: "action",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(
        implementationText,
        "multiplierPerAdvancementCounter",
      ),
      source: "implementation.corpUtility.silver_lining_recovery",
    });
    addCondition(facts, {
      kind: "requires_stolen_agenda_last_turn",
      source: "implementation.corpUtility.silver_lining_recovery",
    });
    facts.derivationNotes.push(
      "Silver Lining Recovery Protocol variable amount depends on stolen agenda counters from the previous Runner turn; generated facts do not assert a fixed credit gain.",
    );
  }

  const hasTraceTagEffect = /traceTagEffect\s*\(/.test(implementationText);
  const hasTraceTagSubroutine = /traceTagSubroutine\s*\(/.test(
    implementationText,
  );
  const hasTraceHelper = hasTraceTagEffect || hasTraceTagSubroutine;
  if (/kind:\s*"trace"/.test(implementationText) || hasTraceHelper) {
    addEffect(facts, {
      kind: "trace",
      timing: isAgenda
        ? "scored_activated"
        : isCorpIce
          ? "encounter"
          : "action",
      scope: "corp",
      source: isCorpIce
        ? "implementation.printedSubroutines.trace"
        : "implementation.effect.trace",
    });
    if (
      isCorpIce ||
      /onSuccess:\s*\[/.test(implementationText) ||
      hasTraceHelper
    ) {
      addCondition(facts, {
        kind: "requires_trace_success",
        source: isCorpIce
          ? "implementation.printedSubroutines.trace.onSuccess"
          : "implementation.effect.trace.onSuccess",
      });
    }
    if (/kind:\s*"add_tags"/.test(implementationText) || hasTraceHelper) {
      addEffect(facts, {
        kind: "tag_source",
        timing: isAgenda ? "scored_activated" : "trace_success",
        scope: "runner",
        resource: "tags",
        amount:
          amountNear(implementationText, "add_tags") ??
          functionCallNumber(implementationText, "traceTagEffect", 1) ??
          (hasTraceTagEffect ? 1 : undefined) ??
          functionCallNumber(implementationText, "traceTagSubroutine", 1) ??
          (hasTraceTagSubroutine ? 1 : undefined),
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

  if (
    /kind:\s*"add_tags"/.test(implementationText) &&
    !/kind:\s*"trace"[\s\S]*?kind:\s*"add_tags"/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "tag_source",
      timing: isAgenda ? "scored_activated" : "action",
      scope: "runner",
      resource: "tags",
      amount: amountNear(implementationText, "add_tags"),
      source: "implementation.effect.add_tags",
    });
  }

  if (/kind:\s*"damage"/.test(implementationText)) {
    addEffect(facts, {
      kind: "damage",
      timing: isAgenda
        ? "scored_activated"
        : isCorpIce
          ? "encounter"
          : "action",
      scope: "runner",
      resource: "damage",
      amount: amountNear(implementationText, "damage"),
      source: isCorpIce
        ? "implementation.printedSubroutines.damage"
        : "implementation.effect.damage",
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

  if (
    /icebreakerAbilities:\s*\[/.test(implementationText) ||
    /icebreakerAbilities:\s*basicIcebreakerAbilities\s*\(/.test(
      implementationText,
    )
  ) {
    const coverage = [];
    for (const subtype of [
      "wall",
      "sentry",
      "code_gate",
      "ap",
      "trace",
      "watchdog",
      "black_ice",
    ]) {
      if (
        new RegExp(`subtype:\\s*"${subtype.replace("_", "[-_ ]?")}"`).test(
          implementationText,
        )
      ) {
        coverage.push(subtype);
      }
    }
    if (/subroutine_traces/.test(implementationText)) coverage.push("trace");
    if (
      /subroutine_tag[\s\S]{0,120}?(stun|hellbolt|knockout)/.test(
        implementationText,
      )
    ) {
      coverage.push("ap");
    }
    if (/subtypes:\s*\[[\s\S]{0,160}?"watchdog"/.test(implementationText)) {
      coverage.push("watchdog");
    }
    const restrictions = [];
    if (
      /subtypes:\s*\[[\s\S]{0,220}?"pit_bull"[\s\S]{0,220}?"hellhound"[\s\S]{0,220}?"bloodhound"[\s\S]{0,220}?"watchdog"/.test(
        implementationText,
      )
    ) {
      restrictions.push("pit_bull_hellhound_bloodhound_watchdog_only");
    }
    if (/matches:\s*\{\s*kind:\s*"any"/.test(implementationText)) {
      coverage.push("universal");
    }
    const coverageCandidates = subtypeChoiceValues(implementationText);
    const configurableCoverage =
      coverageCandidates.length > 0 &&
      /matches:\s*\{\s*kind:\s*"selected_ice_subtype"/.test(implementationText);
    const oneTimeModeChoice =
      configurableCoverage &&
      /limit:\s*"once_until_selected"/.test(implementationText);
    const reconfigurableType =
      configurableCoverage &&
      /icebreakerSubtypeChange:\s*\{/.test(implementationText) &&
      !oneTimeModeChoice;
    const breakCost =
      amountNear(implementationText, "break_subroutine") ??
      propertyNumber(implementationText, "breakCost");
    const pumpCost =
      amountNear(implementationText, "increase_strength") ??
      propertyNumber(implementationText, "pumpCost");
    const pumpStrengthAmount =
      secondAmountNear(implementationText, "increase_strength") ??
      propertyNumber(implementationText, "pumpAmount");
    const maxSubroutinesPerBreak =
      countNear(implementationText, "break_subroutine") ??
      propertyNumber(implementationText, "breakCount");
    facts.breakerProfile = {
      pumpCost,
      breakCost,
      confidence:
        coverage.length > 0 || configurableCoverage ? "high" : "medium",
      source: "implementation.icebreakerAbilities",
    };
    if (coverage.length > 0) {
      facts.breakerProfile.coverage = coverage;
    } else if (!configurableCoverage) {
      facts.breakerProfile.coverage = ["unknown_special"];
    }
    if (restrictions.length > 0) {
      facts.breakerProfile.restrictions = restrictions;
    }
    if (configurableCoverage) {
      facts.breakerProfile.configurableCoverage = true;
      facts.breakerProfile.coverageCandidates = coverageCandidates;
      if (reconfigurableType) facts.breakerProfile.reconfigurableType = true;
      if (oneTimeModeChoice) facts.breakerProfile.oneTimeModeChoice = true;
    }
    if (pumpStrengthAmount !== undefined && pumpStrengthAmount !== 1) {
      facts.breakerProfile.pumpStrengthAmount = pumpStrengthAmount;
    }
    if (maxSubroutinesPerBreak && maxSubroutinesPerBreak > 1) {
      facts.breakerProfile.maxSubroutinesPerBreak = maxSubroutinesPerBreak;
      facts.breakerProfile.multiSubroutineBreak = true;
    }
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
    const sideEffects = new Set(facts.breakerProfile.sideEffects ?? []);
    if (/lose_bits_from_stealth_sources/.test(implementationText)) {
      sideEffects.add("stealth_loss");
      facts.derivationNotes.push(
        "Noisy breaker stealth loss is represented as a side effect only; payment and source selection remain engine/runtime context.",
      );
    }
    if (
      /blink_random_break_or_net_damage|ai_boon_run_start_random_strength|bartmoss_post_encounter_self_trash_check/.test(
        implementationText,
      )
    ) {
      sideEffects.add("random_failure");
      facts.breakerProfile.confidence = "medium";
      facts.derivationNotes.push(
        "Random breaker outcome is represented as a side effect only; generated facts do not imply deterministic break safety.",
      );
    }
    if (/blink_random_break_or_net_damage/.test(implementationText)) {
      sideEffects.add("once_per_subroutine");
    }
    if (/bartmoss_post_encounter_self_trash_check/.test(implementationText)) {
      sideEffects.add("program_trash_risk");
    }
    if (/kind:\s*"end_run"/.test(implementationText)) {
      sideEffects.add("ends_run_after_use");
    }
    if (
      /snowball_run_strength_per_successful_break|dupre_strength_counter_and_last_fort/.test(
        implementationText,
      )
    ) {
      sideEffects.add("temporary_strength");
      facts.breakerProfile.scalingStrength = true;
    }
    if (sideEffects.size > 0) {
      facts.breakerProfile.sideEffects = [...sideEffects];
    }
  }

  if (isAgenda && hasHostedCreditTakeAbility) {
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

  if (/hostedProgramCapacity:\s*\{/.test(implementationText)) {
    const rawHostedCapacity = propertyNumber(implementationText, "capacityMu");
    const hostedCapacity =
      rawHostedCapacity === 99 ? undefined : rawHostedCapacity;
    const hostTarget =
      /allowedProgramSubtypes:\s*\[[\s\S]{0,120}?"icebreaker"/.test(
        implementationText,
      )
        ? "icebreaker"
        : "program";
    addEffect(facts, {
      kind: "program_host",
      timing: "persistent",
      scope: "runner",
      resource: "memory",
      amount: hostedCapacity,
      target: hostTarget,
      source: "implementation.hostedProgramCapacity",
    });
    addTargetProfile(facts, {
      schemaVersion: "target-profile-v1",
      kind: "hosted_install_target",
      timing: "on_install",
      targetType: hostTarget === "icebreaker" ? "icebreaker" : "program",
      purpose: "choose_hosted_program",
      preferences:
        hostTarget === "icebreaker"
          ? ["low_mu_program", "hosted_icebreaker_eligible"]
          : ["low_mu_program"],
      avoid: ["target_would_break_host_limit"],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
    if (
      /hostedProgramModifiers:\s*\[[\s\S]*?icebreaker_strength[\s\S]*?reduce/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "global_modifier",
        timing: "persistent",
        scope: "installed_program",
        resource: "strength",
        amount: -1,
        target: "hosted_icebreaker",
        source: "implementation.hostedProgramModifiers.icebreaker_strength",
      });
    }
  }

  if (/restrictedHostedCreditSource/.test(implementationText)) {
    let restrictedHostedCreditTarget;
    if (
      /usableFor:\s*\[[\s\S]*?"using_killer_during_run"/.test(
        implementationText,
      )
    ) {
      restrictedHostedCreditTarget = "killer";
    } else if (
      /usableFor:\s*\[[\s\S]*?"using_icebreaker_during_run(?:_non_noisy)?"/.test(
        implementationText,
      )
    ) {
      restrictedHostedCreditTarget = "icebreaker";
    } else if (
      /usableFor:\s*\[[\s\S]*?"install_programs"/.test(implementationText)
    ) {
      restrictedHostedCreditTarget = "program_install";
    }

    if (restrictedHostedCreditTarget) {
      addEffect(facts, {
        kind: "recurring_economy",
        timing: "persistent",
        scope: "runner",
        resource: "credits",
        amount: propertyNumber(implementationText, "capacity"),
        repeatable: true,
        target: restrictedHostedCreditTarget,
        source: "implementation.restrictedHostedCreditSource",
      });
    } else {
      addEffect(facts, {
        kind: "trash_credit",
        timing: "persistent",
        scope: "runner",
        resource: "trash_credits",
        source: "implementation.restrictedHostedCreditSource",
      });
    }
  }

  if (/damagePreventionSources:\s*\[/.test(implementationText)) {
    const damageTypes = [
      ...new Set([
        ...(/damageTypes:\s*\[[\s\S]*?"net"/.test(implementationText)
          ? ["net"]
          : []),
        ...(/damageTypes:\s*\[[\s\S]*?"core"/.test(implementationText)
          ? ["brain"]
          : []),
        ...(/damageTypes:\s*\[[\s\S]*?"meat"/.test(implementationText)
          ? ["meat"]
          : []),
      ]),
    ].sort();
    const preventionAmount = amountNear(
      implementationText,
      "damage_prevention",
    );
    addEffect(facts, {
      kind: "damage_prevention",
      timing: "prevention_window",
      scope: "runner",
      resource: "damage",
      amount: preventionAmount,
      damageTypes,
      perTurnLimit: propertyNumber(implementationText, "amount"),
      source: "implementation.damagePreventionSources",
    });
    if (damageTypes.includes("net")) {
      addEffect(facts, {
        kind: "net_damage_prevention",
        timing: "prevention_window",
        scope: "runner",
        resource: "net_damage",
        amount: preventionAmount,
        perTurnLimit: propertyNumber(implementationText, "amount"),
        source: "implementation.damagePreventionSources.damageTypes.net",
      });
      addCondition(facts, {
        kind: "requires_net_damage",
        source: "implementation.damagePreventionSources.damageTypes.net",
      });
    }
    if (damageTypes.includes("brain")) {
      addEffect(facts, {
        kind: "brain_damage_prevention",
        timing: "prevention_window",
        scope: "runner",
        resource: "brain_damage",
        amount: preventionAmount,
        perTurnLimit: propertyNumber(implementationText, "amount"),
        source: "implementation.damagePreventionSources.damageTypes.core",
      });
      addCondition(facts, {
        kind: "requires_brain_damage",
        source: "implementation.damagePreventionSources.damageTypes.core",
      });
    }
    if (damageTypes.includes("meat")) {
      addEffect(facts, {
        kind: "meat_damage_prevention",
        timing: "prevention_window",
        scope: "runner",
        resource: "meat_damage",
        amount: preventionAmount,
        perTurnLimit: propertyNumber(implementationText, "amount"),
        source: "implementation.damagePreventionSources.damageTypes.meat",
      });
      addCondition(facts, {
        kind: "requires_meat_damage",
        source: "implementation.damagePreventionSources.damageTypes.meat",
      });
    }
    addCondition(facts, {
      kind: "requires_damage",
      source: "implementation.damagePreventionSources",
    });
    addCondition(facts, {
      kind: "requires_prevention_window",
      source: "implementation.damagePreventionSources",
    });
    addCondition(facts, {
      kind: "requires_turn_limit_available",
      source: "implementation.damagePreventionSources.limit.per_turn",
    });
    facts.derivationNotes.push(
      "Damage prevention is represented as event-window and per-turn-limit context only; generated facts do not imply current damage immunity.",
    );
  }

  if (/flatlineReplacementSources:\s*\[/.test(implementationText)) {
    addEffect(facts, {
      kind: "flatline_prevention",
      timing: "flatline_replacement",
      scope: "runner",
      resource: "damage",
      source: "implementation.flatlineReplacementSources",
    });
    addEffect(facts, {
      kind: "prevention_replacement",
      timing: "flatline_replacement",
      scope: "runner",
      resource: "damage",
      source: "implementation.flatlineReplacementSources",
    });
    if (/emergency_self_construct/.test(implementationText)) {
      addEffect(facts, {
        kind: "remove_brain_damage",
        timing: "flatline_replacement",
        scope: "runner",
        resource: "brain_damage",
        source:
          "implementation.flatlineReplacementSources.emergency_self_construct",
      });
      addEffect(facts, {
        kind: "meat_damage_prevention",
        timing: "persistent",
        scope: "runner",
        resource: "meat_damage",
        source:
          "implementation.flatlineReplacementSources.emergency_self_construct",
      });
      addEffect(facts, {
        kind: "action_penalty",
        timing: "persistent",
        scope: "runner",
        resource: "actions",
        amount: 1,
        source:
          "implementation.flatlineReplacementSources.emergency_self_construct",
      });
      addEffect(facts, {
        kind: "hand_size_modifier",
        timing: "persistent",
        scope: "runner",
        resource: "hand_size",
        amount: -1,
        source:
          "implementation.flatlineReplacementSources.emergency_self_construct",
      });
      addEffect(facts, {
        kind: "persistent_survival_modifier",
        timing: "persistent",
        scope: "runner",
        source:
          "implementation.flatlineReplacementSources.emergency_self_construct",
      });
    }
    addCondition(facts, {
      kind: "requires_flatline",
      source: "implementation.flatlineReplacementSources",
    });
    addCondition(facts, {
      kind: "requires_prevention_window",
      source: "implementation.flatlineReplacementSources",
    });
    facts.derivationNotes.push(
      "Flatline replacement is represented as a replacement-window fact only; generated facts do not assert the Runner is currently safe from flatline.",
    );
  }

  if (/trashPreventionSources:\s*\[/.test(implementationText)) {
    if (/protectsCardTypes:\s*\[[\s\S]*?"program"/.test(implementationText)) {
      addEffect(facts, {
        kind: "program_trash_prevention",
        timing: "prevention_window",
        scope: "installed_program",
        source:
          "implementation.trashPreventionSources.protectsCardTypes.program",
      });
      addCondition(facts, {
        kind: "requires_installed_program",
        source:
          "implementation.trashPreventionSources.protectsCardTypes.program",
      });
    }
    addCondition(facts, {
      kind: "requires_program_trash",
      source: "implementation.trashPreventionSources",
    });
    addCondition(facts, {
      kind: "requires_prevention_window",
      source: "implementation.trashPreventionSources",
    });
    facts.derivationNotes.push(
      "Program-trash prevention is target- and window-context only; costs and target selection stay LegalAction/engine-owned.",
    );
  }

  if (/tagPreventionSources:\s*\[/.test(implementationText)) {
    addEffect(facts, {
      kind: "tag_prevention",
      timing: "prevention_window",
      scope: "runner",
      resource: "tags",
      amount: amountNear(implementationText, "avoid_tag"),
      source: "implementation.tagPreventionSources",
    });
    addCondition(facts, {
      kind: "requires_prevention_window",
      source: "implementation.tagPreventionSources",
    });
    facts.derivationNotes.push(
      "Tag prevention is represented as tag-window context only; generated facts do not assert the Runner is untagged.",
    );
  }

  if (/kind:\s*"avoid_next_tag"/.test(implementationText)) {
    addEffect(facts, {
      kind: "tag_prevention",
      timing: "prevention_window",
      scope: "runner",
      resource: "tags",
      amount: amountNear(implementationText, "avoid_next_tag"),
      source: "implementation.effect.avoid_next_tag",
    });
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.condition.runner_is_tagged",
    });
    addCondition(facts, {
      kind: "requires_prevention_window",
      source: "implementation.effect.avoid_next_tag",
    });
  }

  if (/kind:\s*"remove_tags"/.test(implementationText)) {
    addEffect(facts, {
      kind: "survival_payoff",
      timing: "action",
      scope: "runner",
      resource: "tags",
      source: "implementation.effect.remove_tags",
    });
  }

  if (/kind:\s*"use_base_link"/.test(implementationText)) {
    addEffect(facts, {
      kind: "base_link",
      timing: "trace_window",
      scope: "trace",
      resource: "link",
      amount: propertyNumber(implementationText, "baseLink"),
      source: "implementation.effect.use_base_link",
    });
    addEffect(facts, {
      kind: "trace_defense",
      timing: "trace_window",
      scope: "trace",
      resource: "link",
      amount: propertyNumber(implementationText, "baseLink"),
      source: "implementation.effect.use_base_link",
    });
    addCondition(facts, {
      kind: "requires_trace_attempt",
      source: "implementation.ability.timing.trace_base_link_window",
    });
  }

  if (/kind:\s*"increase_trace_link"/.test(implementationText)) {
    addEffect(facts, {
      kind: "link",
      timing: "trace_window",
      scope: "trace",
      resource: "link",
      amount: amountNear(implementationText, "increase_trace_link"),
      source: "implementation.effect.increase_trace_link",
    });
    addEffect(facts, {
      kind: "trace_defense",
      timing: "trace_window",
      scope: "trace",
      resource: "link",
      amount: amountNear(implementationText, "increase_trace_link"),
      source: "implementation.effect.increase_trace_link",
    });
    addCondition(facts, {
      kind: "requires_trace_attempt",
      source: "implementation.ability.timing.trace_post_bid_link_window",
    });
  }

  if (/rabbit_ice_trace_limit_reduction/.test(implementationText)) {
    addEffect(facts, {
      kind: "trace_defense",
      timing: "trace_window",
      scope: "trace",
      resource: "link",
      amount: propertyNumber(implementationText, "amount"),
      source:
        "implementation.runnerUtilityLongtail.rabbit_ice_trace_limit_reduction",
    });
    addCondition(facts, {
      kind: "requires_trace_attempt",
      source:
        "implementation.runnerUtilityLongtail.rabbit_ice_trace_limit_reduction",
    });
  }

  if (/crash_everett_draw_extra_choose_trash_or_top/.test(implementationText)) {
    addEffect(facts, {
      kind: "draw",
      timing: "persistent",
      scope: "runner",
      resource: "cards",
      amount: propertyNumber(implementationText, "extraDraw"),
      source:
        "implementation.remainingReplacementLongtail.crash_everett_draw_extra_choose_trash_or_top",
    });
    addEffect(facts, {
      kind: "survival_payoff",
      timing: "persistent",
      scope: "runner",
      resource: "cards",
      amount: propertyNumber(implementationText, "extraDraw"),
      source:
        "implementation.remainingReplacementLongtail.crash_everett_draw_extra_choose_trash_or_top",
    });
    facts.derivationNotes.push(
      "Crash Everett extra draw and choose-trash/top replacement are represented without hidden hand or stack identities.",
    );
  }

  if (
    /kind:\s*"search_stack_install"/.test(implementationText) ||
    /kind:\s*"look_top_stack_show_to_corp_then_install_matching"/.test(
      implementationText,
    ) ||
    /searchStackInstallEffect\s*\(/.test(implementationText) ||
    /lookTopStackShowToCorpThenInstallMatchingEffect\s*\(/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "search",
      timing: /timing:\s*"during_run"/.test(implementationText)
        ? "during_run"
        : "action",
      scope: "runner",
      source: /search_stack_install|searchStackInstallEffect/.test(
        implementationText,
      )
        ? "implementation.effect.search_stack_install"
        : "implementation.effect.look_top_stack_show_to_corp_then_install_matching",
    });
    if (/timing:\s*"during_run"/.test(implementationText)) {
      addCondition(facts, {
        kind: "requires_during_run",
        source: "implementation.ability.timing.during_run",
      });
    }
    if (
      /kind:\s*"search_stack_install"/.test(implementationText) ||
      /searchStackInstallEffect\s*\(/.test(implementationText)
    ) {
      addTargetProfile(facts, {
        zone: "stack",
        targetCardType: valueNear(implementationText, "filter") ?? "program",
        installsTarget: true,
        installCost: valueNear(implementationText, "installCost"),
        shuffleAfter:
          /shuffleAfterwards:\s*true/.test(implementationText) ||
          /searchStackInstallEffect\s*\(/.test(implementationText),
        source: "implementation.effect.search_stack_install",
      });
    }
  }

  if (
    /kind:\s*"search_stack_to_grip"/.test(implementationText) ||
    /kind:\s*"search_trash_to_grip"/.test(implementationText) ||
    /kind:\s*"look_top_stack_take_one_arrange_rest"/.test(implementationText) ||
    /searchStackToGripEffect\s*\(/.test(implementationText) ||
    /lookTopStackTakeOneArrangeRestEffect\s*\(/.test(implementationText)
  ) {
    const searchesTrash = /kind:\s*"search_trash_to_grip"/.test(
      implementationText,
    );
    const looksTopStack =
      /look_top_stack_take_one_arrange_rest/.test(implementationText) ||
      /lookTopStackTakeOneArrangeRestEffect\s*\(/.test(implementationText);
    addEffect(facts, {
      kind: searchesTrash ? "card_recovery" : "search",
      timing: "action",
      scope: searchesTrash ? "heap" : "stack",
      resource: "cards",
      amount: looksTopStack
        ? (propertyNumber(implementationText, "count") ?? 5)
        : undefined,
      source: searchesTrash
        ? "implementation.effect.search_trash_to_grip"
        : looksTopStack
          ? "implementation.effect.look_top_stack_take_one_arrange_rest"
          : "implementation.effect.search_stack_to_grip",
    });
    if (searchesTrash && expectsKind("effect:search")) {
      addEffect(facts, {
        kind: "search",
        timing: "action",
        scope: "heap",
        resource: "cards",
        source: "implementation.effect.search_trash_to_grip",
      });
    }
    addCondition(facts, {
      kind: searchesTrash ? "requires_heap_card" : "requires_stack_search",
      source: searchesTrash
        ? "implementation.effect.search_trash_to_grip"
        : "implementation.effect.search_stack_or_top_stack",
    });
    if (
      /kind:\s*"activated"[\s\S]*?kind:\s*"action"/.test(implementationText)
    ) {
      addCondition(facts, {
        kind: "requires_runner_action",
        source: "implementation.ability.cost.action",
      });
    }
    facts.derivationNotes.push(
      "Search/recovery is represented by zone and target class only; generated facts do not expose hidden stack, heap or grip identities.",
    );
  }

  if (
    /look_top_stack_show_to_corp_then_install_matching/.test(
      implementationText,
    ) ||
    /lookTopStackShowToCorpThenInstallMatchingEffect\s*\(/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "topdeck_info",
      timing: "during_run",
      scope: "runner",
      resource: "cards",
      amount:
        amountNear(
          implementationText,
          "look_top_stack_show_to_corp_then_install_matching",
        ) ?? 5,
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
      lookCount:
        countNear(
          implementationText,
          "look_top_stack_show_to_corp_then_install_matching",
        ) ?? 5,
      targetCardType:
        arrayFirstNear(implementationText, "allowedTypes") ?? "program",
      installsTarget: true,
      installCost: valueNear(implementationText, "installCost") ?? "free",
      shuffleAfter:
        /shuffleAfterwards:\s*true/.test(implementationText) ||
        /lookTopStackShowToCorpThenInstallMatchingEffect\s*\(/.test(
          implementationText,
        ),
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

  if (/kind:\s*"pre_access_rd_cut"/.test(implementationText)) {
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: "on_access",
      scope: "rnd",
      resource: "cards",
      source: "implementation.accessHooks.pre_access_rd_cut",
    });
    addEffect(facts, {
      kind: "topdeck_info",
      timing: "on_access",
      scope: "rnd",
      resource: "cards",
      source: "implementation.accessHooks.pre_access_rd_cut.context",
    });
    addCondition(facts, {
      kind: "requires_accessed_card",
      source: "implementation.accessHooks.pre_access_rd_cut",
    });
    facts.derivationNotes.push(
      "Microtech AI Interface is represented as R&D top manipulation context only; generated facts do not reveal the actual hidden R&D order.",
    );
  }

  if (/kind:\s*"post_access_private_look"/.test(implementationText)) {
    addEffect(facts, {
      kind: "hq_info",
      timing: "on_access",
      scope: /lookZone:\s*"hq"/.test(implementationText) ? "hq" : "server",
      resource: "cards",
      source: "implementation.accessHooks.post_access_private_look",
    });
    addCondition(facts, {
      kind: "requires_accessed_card",
      source: "implementation.accessHooks.post_access_private_look",
    });
    facts.derivationNotes.push(
      "Post-access HQ information is represented as a context-gated information effect; generated facts do not include hidden HQ card identities.",
    );
  }

  if (/successfulRunAccessReplacement/.test(implementationText)) {
    const successfulRunTarget = centralServerTarget(implementationText);
    const replacementIsPrivateRndLook = /private_look_top_rd/.test(
      implementationText,
    );
    addEffect(facts, {
      kind: "access_replacement",
      timing: "successful_run",
      scope: replacementIsPrivateRndLook ? "rnd" : successfulRunTarget,
      source: "implementation.successfulRunAccessReplacement",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.successfulRunAccessReplacement",
    });
    if (/successfulRunRunnerCreditGain/.test(implementationText)) {
      addEffect(facts, {
        kind: "economy",
        timing: "successful_run",
        scope: "runner",
        resource: "credits",
        amount: propertyNumber(
          implementationText,
          "successfulRunRunnerCreditGain",
        ),
        source: "implementation.successfulRunRunnerCreditGain",
      });
    }
    if (/successfulRunRunnerTagGain/.test(implementationText)) {
      addEffect(facts, {
        kind: "tag",
        timing: "successful_run",
        scope: "runner",
        resource: "tags",
        amount: propertyNumber(
          implementationText,
          "successfulRunRunnerTagGain",
        ),
        source: "implementation.successfulRunRunnerTagGain",
      });
    }
  }

  if (/accessCount:\s*[2-9]/.test(implementationText)) {
    addEffect(facts, {
      kind: "multiaccess",
      timing: "successful_run",
      scope: centralServerTarget(implementationText),
      resource: "cards",
      amount: propertyNumber(implementationText, "accessCount"),
      source: "implementation.effect.make_run.accessCount",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.effect.make_run.accessCount",
    });
  }

  if (/accessServerOverride:\s*"hq"/.test(implementationText)) {
    addEffect(facts, {
      kind: "access_replacement",
      timing: "successful_run",
      scope: "hq",
      source: "implementation.effect.make_run.accessServerOverride",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.effect.make_run.accessServerOverride",
    });
  }

  if (/random_reveal_hq_cards_per_two_counters/.test(implementationText)) {
    addEffect(facts, {
      kind: "hq_info",
      timing: "start_of_turn",
      scope: "hq",
      resource: "cards",
      source: "implementation.virusCounter.startOfRunnerTurn.random_reveal_hq",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.virusCounter.addOnSuccessfulRun.hq",
    });
    facts.derivationNotes.push(
      "Boardwalk HQ reveal is context-gated by public counters; generated facts do not include hidden HQ card identities.",
    );
  }

  if (/kind:\s*"expose_installed_card"/.test(implementationText)) {
    addEffect(facts, {
      kind: "expose_info",
      timing: "action",
      scope: "installed_card",
      source: "implementation.effect.expose_installed_card",
    });
  }

  if (/i_spy_successful_run_fort_counter_expose/.test(implementationText)) {
    addEffect(facts, {
      kind: "expose_info",
      timing: "successful_run",
      scope: "fort",
      source: "implementation.runnerUtilityLongtail.i_spy_expose",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source: "implementation.runnerUtilityLongtail.i_spy_expose",
    });
  }

  if (/approach_ice_expose_then_jack_out_before_rez/.test(implementationText)) {
    addEffect(facts, {
      kind: "expose_info",
      timing: "encounter",
      scope: "ice",
      source:
        "implementation.runEncounterInterventions.approach_ice_expose_then_jack_out_before_rez",
    });
    addCondition(facts, {
      kind: "requires_during_run",
      source:
        "implementation.runEncounterInterventions.approach_ice_expose_then_jack_out_before_rez",
    });
    facts.derivationNotes.push(
      "Smarteye expose-before-rez information is encounter context only; generated facts do not include hidden ICE identity before the legal effect.",
    );
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
    if (
      ["onr_v1_222_ball-and-chain", "onr_v1_225_canis-major"].includes(
        card.cardId,
      )
    ) {
      addEffect(facts, {
        kind: "future_encounter_effect",
        timing: "encounter",
        scope: "run_path",
        confidence: "medium",
        source: "implementation.printedSubroutines.run_duration.future_ice",
      });
      addCondition(facts, {
        kind: "requires_remaining_ice",
        source: "implementation.printedSubroutines.run_duration.future_ice",
      });
    }
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

  if (
    isCorpIce &&
    !isPriorFutureRunIce &&
    /printedSubroutines:\s*\[/.test(implementationText)
  ) {
    addCondition(facts, {
      kind: "requires_encounter",
      source: "implementation.printedSubroutines",
    });
    addCondition(facts, {
      kind: "requires_unbroken_subroutine",
      source: "implementation.printedSubroutines",
    });

    if (
      /kind:\s*"end_the_run"|kind:\s*"end_run"/.test(implementationText) ||
      /endTheRunSubroutine(?:s)?\s*\(/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "etr",
        timing: "encounter",
        scope: "run_path",
        source: "implementation.printedSubroutines.end_run",
      });
      addEffect(facts, {
        kind: "remote_protection",
        timing: "encounter",
        scope: "run_path",
        source: "implementation.printedSubroutines.end_run",
      });
    }

    if (
      /kind:\s*"trash_program"/.test(implementationText) ||
      /trashProgramSubroutine\s*\(/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "program_trash",
        timing: /kind:\s*"trace"[\s\S]{0,360}?kind:\s*"trash_program"/.test(
          implementationText,
        )
          ? "trace_success"
          : "encounter",
        scope: "runner",
        source: "implementation.printedSubroutines.trash_program",
      });
    }

    if (/kind:\s*"trash_hardware"/.test(implementationText)) {
      addEffect(facts, {
        kind: "hardware_trash",
        timing: "trace_success",
        scope: "runner",
        source:
          "implementation.printedSubroutines.trace.onSuccess.trash_hardware",
      });
    }

    if (
      /kind:\s*"unpreventable_meat_damage"/.test(implementationText) ||
      /(?:net|brain)DamageSubroutine\s*\(/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "damage",
        timing: /(?:net|brain)DamageSubroutine\s*\(/.test(implementationText)
          ? "encounter"
          : "trace_success",
        scope: "runner",
        resource: "damage",
        amount:
          amountNear(implementationText, "unpreventable_meat_damage") ??
          functionCallNumber(implementationText, "netDamageSubroutine") ??
          functionCallNumber(implementationText, "brainDamageSubroutine"),
        source: /(?:net|brain)DamageSubroutine\s*\(/.test(implementationText)
          ? "implementation.printedSubroutines.damage"
          : "implementation.printedSubroutines.trace.onSuccess.unpreventable_meat_damage",
      });
      facts.derivationNotes.push(
        "Unpreventable damage is still a mechanical damage class; damage prevention and flatline resolution remain engine context.",
      );
    }

    if (/runner_run_lock_until_action_paid/.test(implementationText)) {
      addEffect(facts, {
        kind: "run_lock",
        timing: "trace_success",
        scope: "runner",
        resource: "actions",
        source:
          "implementation.printedSubroutines.trace.onSuccess.runner_run_lock_until_action_paid",
      });
    }

    if (/run_duration_cannot_jack_out/.test(implementationText)) {
      addEffect(facts, {
        kind: "no_jack_out",
        timing: "during_run",
        scope: "runner",
        source:
          "implementation.printedSubroutines.run_duration_cannot_jack_out",
      });
    }

    if (
      /prohibit_break_next_ice|prohibit_break_and_jack_out_next_ice/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "future_encounter_effect",
        timing: "encounter",
        scope: "run_path",
        source: "implementation.printedSubroutines.prohibit_break_next_ice",
      });
      if (/prohibit_break_and_jack_out_next_ice/.test(implementationText)) {
        addEffect(facts, {
          kind: "no_jack_out",
          timing: "encounter",
          scope: "runner",
          source:
            "implementation.printedSubroutines.prohibit_break_and_jack_out_next_ice",
        });
      }
      addCondition(facts, {
        kind: "requires_later_encounter",
        source: "implementation.printedSubroutines.prohibit_break_next_ice",
      });
      addCondition(facts, {
        kind: "requires_remaining_ice",
        source: "implementation.printedSubroutines.prohibit_break_next_ice",
      });
    }

    if (/next_encounter_unless_fully_break_damage/.test(implementationText)) {
      addEffect(facts, {
        kind: "future_encounter_effect",
        timing: "encounter",
        scope: "run_path",
        source:
          "implementation.printedSubroutines.next_encounter_unless_fully_break_damage",
      });
      addEffect(facts, {
        kind: "damage",
        timing: "encounter",
        scope: "runner",
        resource: "damage",
        amount: amountNear(
          implementationText,
          "next_encounter_unless_fully_break_damage",
        ),
        source:
          "implementation.printedSubroutines.next_encounter_unless_fully_break_damage",
      });
      addCondition(facts, {
        kind: "requires_later_encounter",
        source:
          "implementation.printedSubroutines.next_encounter_unless_fully_break_damage",
      });
      addCondition(facts, {
        kind: "requires_remaining_ice",
        source:
          "implementation.printedSubroutines.next_encounter_unless_fully_break_damage",
      });
    }

    if (/run_duration_ice_strength/.test(implementationText)) {
      addEffect(facts, {
        kind: "run_tax",
        timing: "encounter",
        scope: "run_path",
        resource: "strength",
        amount: amountNear(implementationText, "run_duration_ice_strength"),
        source: "implementation.printedSubroutines.run_duration_ice_strength",
      });
    }

    if (/run_duration_encounter_cost_or_end_run/.test(implementationText)) {
      addEffect(facts, {
        kind: "run_tax",
        timing: "encounter",
        scope: "run_path",
        resource: "credits",
        amount: amountNear(
          implementationText,
          "run_duration_encounter_cost_or_end_run",
        ),
        source:
          "implementation.printedSubroutines.run_duration_encounter_cost_or_end_run",
      });
    }

    if (
      /iceEncounter:\s*\{[\s\S]{0,160}?add_encounter_temporary_credits/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "trace_credit",
        timing: "encounter",
        scope: "corp",
        resource: "credits",
        amount: amountNear(
          implementationText,
          "add_encounter_temporary_credits",
        ),
        source: "implementation.iceEncounter.add_encounter_temporary_credits",
      });
    }

    if (/runnerCounterEffects:\s*\[/.test(implementationText)) {
      addEffect(facts, {
        kind: "persistent_counter_effect",
        timing: "persistent",
        scope: "runner",
        resource: "counters",
        source: "implementation.runnerCounterEffects",
      });
      facts.derivationNotes.push(
        "Runner counter effects describe persistent card mechanics only; generated facts do not assert current counter state.",
      );
    }
  }

  if (/kind:\s*"additional_subroutine"/.test(implementationText)) {
    addEffect(facts, {
      kind: "future_encounter_effect",
      timing: "encounter",
      scope: "run_path",
      source: "implementation.modifiers.additional_subroutine",
    });
    addEffect(facts, {
      kind: "remote_protection",
      timing: "persistent",
      scope: "fort",
      resource: "subroutines",
      source: "implementation.modifiers.additional_subroutine",
    });
    facts.remoteRole = {
      kind: "scoring_protection",
      threatLevel: "high",
      serverScope: "fort",
      confidence: "high",
      source: "implementation.modifiers.additional_subroutine",
    };
  }

  if (/additional_agenda_or_node_slot_inside_fort/.test(implementationText)) {
    addEffect(facts, {
      kind: "remote_protection",
      timing: "persistent",
      scope: "remote",
      source: "implementation.fortCapacityModifiers.additional_slot",
    });
    addEffect(facts, {
      kind: "score_acceleration",
      timing: "persistent",
      scope: "remote",
      source: "implementation.fortCapacityModifiers.additional_slot",
    });
    addCondition(facts, {
      kind: "requires_remote_server",
      source: "implementation.installCapabilities.subsidiary_data_fort",
    });
    facts.remoteRole = {
      kind: "remote_capacity",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "high",
      source: "implementation.fortCapacityModifiers.additional_slot",
    };
  }

  if (
    /install_hq_ice_innermost_after_successful_run/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "future_encounter_effect",
      timing: "successful_run",
      scope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.install_hq_ice_innermost_after_successful_run",
    });
    addEffect(facts, {
      kind: "remote_protection",
      timing: "successful_run",
      scope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.install_hq_ice_innermost_after_successful_run",
    });
    addCondition(facts, {
      kind: "requires_successful_run",
      source:
        "implementation.fortRunWindows.install_hq_ice_innermost_after_successful_run",
    });
    facts.remoteRole = {
      kind: "scoring_protection",
      threatLevel: "high",
      serverScope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.install_hq_ice_innermost_after_successful_run",
    };
    facts.derivationNotes.push(
      "Jenny Jett is derived only as a successful-run future-encounter class; HQ card identity and legal target choice remain hidden-info/runtime context.",
    );
  }

  if (/discounted_rez_ice_on_this_fort/.test(implementationText)) {
    addEffect(facts, {
      kind: "rez_discount",
      timing: "during_run",
      scope: "ice",
      source: "implementation.fortRunWindows.discounted_rez_ice_on_this_fort",
    });
    addEffect(facts, {
      kind: "remote_protection",
      timing: "during_run",
      scope: "fort",
      source: "implementation.fortRunWindows.discounted_rez_ice_on_this_fort",
    });
    addCondition(facts, {
      kind: "requires_during_run",
      source: "implementation.fortRunWindows.discounted_rez_ice_on_this_fort",
    });
    facts.remoteRole = {
      kind: "scoring_protection",
      threatLevel: "medium",
      serverScope: "fort",
      confidence: "high",
      source: "implementation.fortRunWindows.discounted_rez_ice_on_this_fort",
    };
  }

  if (/roll_die_on_pass_rezzed_ice_on_same_fort/.test(implementationText)) {
    addEffect(facts, {
      kind: "future_encounter_effect",
      timing: "during_run",
      scope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.roll_die_on_pass_rezzed_ice_on_same_fort",
    });
    addEffect(facts, {
      kind: "remote_protection",
      timing: "persistent",
      scope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.roll_die_on_pass_rezzed_ice_on_same_fort",
    });
    addCondition(facts, {
      kind: "requires_during_run",
      source:
        "implementation.fortRunWindows.roll_die_on_pass_rezzed_ice_on_same_fort",
    });
    facts.remoteRole = {
      kind: "scoring_protection",
      threatLevel: "medium",
      serverScope: "fort",
      confidence: "medium",
      source:
        "implementation.fortRunWindows.roll_die_on_pass_rezzed_ice_on_same_fort",
    };
    facts.derivationNotes.push(
      "Rio de Janeiro City Grid is represented as a deterministic-random future encounter class; actual die result and run ending remain runtime state.",
    );
  }

  if (/kind:\s*"rez_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "rez_discount",
      timing: "persistent",
      scope: "ice",
      resource: "credits",
      amount: amountNear(implementationText, "rez_cost"),
      source: "implementation.modifiers.rez_cost",
    });
  }

  if (/kind:\s*"ice_strength"/.test(implementationText)) {
    addEffect(facts, {
      kind: "remote_protection",
      timing: "persistent",
      scope: /sameServerAsSource:\s*true/.test(implementationText)
        ? "fort"
        : "ice",
      resource: "strength",
      amount: amountNear(implementationText, "ice_strength"),
      source: "implementation.modifiers.ice_strength",
    });
    if (isAgenda) {
      addEffect(facts, {
        kind: "global_modifier",
        timing: "persistent",
        scope: "ice",
        resource: "strength",
        amount: amountNear(implementationText, "ice_strength"),
        source: "implementation.modifiers.ice_strength",
      });
    }
    if (!isAgenda) {
      facts.remoteRole = {
        kind: "ice_modifier",
        threatLevel: "medium",
        serverScope: /sameServerAsSource:\s*true/.test(implementationText)
          ? "fort"
          : "server",
        confidence: "high",
        source: "implementation.modifiers.ice_strength",
      };
    }
  }

  if (/kind:\s*"distribute_advancement_counters"/.test(implementationText)) {
    addEffect(facts, {
      kind: "score_acceleration",
      timing: "action",
      scope: "installed_card",
      resource: "advancement_counters",
      amount: amountNear(implementationText, "distribute_advancement_counters"),
      source: "implementation.abilities.distribute_advancement_counters",
    });
    if (expectsKind("effect:advance_burst")) {
      addEffect(facts, {
        kind: "advance_burst",
        timing: "action",
        scope: "installed_card",
        resource: "advancement_counters",
        amount: amountNear(
          implementationText,
          "distribute_advancement_counters",
        ),
        source: "implementation.abilities.distribute_advancement_counters",
      });
    }
    if (expectsKind("condition:requires_score_window")) {
      addCondition(facts, {
        kind: "requires_score_window",
        source: "implementation.abilities.distribute_advancement_counters",
      });
    }
    facts.costProfile = {
      clicks: amountNear(implementationText, "action"),
      credits: amountNear(implementationText, "credit"),
      source: "implementation.abilities.costs",
    };
    facts.remoteRole = {
      kind: "asset_economy",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "high",
      source: "implementation.abilities.distribute_advancement_counters",
    };
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

  if (/advanceable:\s*\{/.test(implementationText)) {
    if (expectsKind("effect:advanceable_economy")) {
      addEffect(facts, {
        kind: "advanceable_economy",
        timing: "action",
        scope: "remote",
        resource: "advancement_counters",
        source: "implementation.advanceable",
      });
    }
    addCondition(facts, {
      kind: "requires_advancement_counter",
      source: "implementation.advanceable",
    });
  }

  if (
    /gain_credits_per_advancement_counter_on_source/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "economy",
      timing: "action",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "amountPerCounter"),
      source:
        "implementation.abilities.gain_credits_per_advancement_counter_on_source",
    });
    if (expectsKind("effect:advanceable_economy")) {
      addEffect(facts, {
        kind: "advanceable_economy",
        timing: "action",
        scope: "remote",
        resource: "credits",
        amount: propertyNumber(implementationText, "amountPerCounter"),
        source:
          "implementation.abilities.gain_credits_per_advancement_counter_on_source",
      });
    }
  }

  if (/accessEffects:\s*\[/.test(implementationText)) {
    addCondition(facts, {
      kind: "requires_accessed_card",
      source: "implementation.accessEffects",
    });
    if (expectsKind("effect:access_punish")) {
      addEffect(facts, {
        kind: "access_punish",
        timing: "on_access",
        scope: "accessed_card",
        source: "implementation.accessEffects",
      });
    }
    if (expectsKind("effect:ambush")) {
      addEffect(facts, {
        kind: "ambush",
        timing: "on_access",
        scope: "remote",
        source: "implementation.accessEffects",
      });
    }
    if (
      /accessEffects:\s*\[[\s\S]*?damage_from_source_advancement_counters/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "damage",
        timing: "on_access",
        scope: "runner",
        resource: "damage",
        source:
          "implementation.accessEffects.damage_from_source_advancement_counters",
      });
      addCondition(facts, {
        kind: "requires_advancement_counter",
        source:
          "implementation.accessEffects.damage_from_source_advancement_counters",
      });
    }
    if (
      /accessEffects:\s*\[[\s\S]*?kind:\s*"damage"/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "damage",
        timing: "on_access",
        scope: "runner",
        resource: "damage",
        amount: amountNear(implementationText, "damage"),
        source: "implementation.accessEffects.damage",
      });
    }
    if (
      /trash_installed_runner_cards[\s\S]*?target:\s*"hardware"/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "hardware_trash",
        timing: "on_access",
        scope: "runner",
        source: "implementation.accessEffects.trash_installed_runner_cards",
      });
    }
    if (
      /trash_installed_runner_cards[\s\S]*?target:\s*"program"/.test(
        implementationText,
      )
    ) {
      addEffect(facts, {
        kind: "program_trash",
        timing: "on_access",
        scope: "runner",
        source: "implementation.accessEffects.trash_installed_runner_cards",
      });
    }
    if (/add_runner_counter/.test(implementationText)) {
      addEffect(facts, {
        kind: "persistent_counter_effect",
        timing: "on_access",
        scope: "runner",
        resource: "counters",
        source: "implementation.accessEffects.add_runner_counter",
      });
    }
    if (!facts.remoteRole && expectsKind("remoteRole:ambush")) {
      facts.remoteRole = {
        kind: "ambush",
        threatLevel: "medium",
        serverScope: "remote",
        confidence: "high",
        source: "implementation.accessEffects",
      };
    }
  }

  if (/runnerCounterEffects:\s*\[/.test(implementationText)) {
    addEffect(facts, {
      kind: "persistent_counter_effect",
      timing: "persistent",
      scope: "runner",
      resource: "counters",
      source: "implementation.runnerCounterEffects",
    });
    if (
      expectsKind("effect:link_penalty") &&
      /linkReductionPerCounter|removeCost/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "link_penalty",
        timing: "persistent",
        scope: "runner",
        resource: "link",
        amount: propertyNumber(implementationText, "linkReductionPerCounter"),
        source: "implementation.runnerCounterEffects",
      });
    }
  }

  if (/city_surveillance_draw_tag/.test(implementationText)) {
    addEffect(facts, {
      kind: "tag_source",
      timing: "runner_turn",
      scope: "runner",
      resource: "tags",
      amount: 1,
      source: "implementation.remainingReplacementLongtail.city_surveillance",
    });
    addEffect(facts, {
      kind: "remote_tax",
      timing: "runner_turn",
      scope: "runner",
      resource: "credits",
      amount: propertyNumber(implementationText, "avoidTagCost"),
      source: "implementation.remainingReplacementLongtail.city_surveillance",
    });
    addCondition(facts, {
      kind: "requires_runner_draw",
      source: "implementation.remainingReplacementLongtail.city_surveillance",
    });
    addCondition(facts, {
      kind: "requires_runner_pay_or_take_tag",
      source: "implementation.remainingReplacementLongtail.city_surveillance",
    });
    if (!facts.remoteRole && expectsKind("remoteRole:tag_punish_asset")) {
      facts.remoteRole = {
        kind: "tag_punish_asset",
        threatLevel: "medium",
        serverScope: "remote",
        confidence: "high",
        source: "implementation.remainingReplacementLongtail.city_surveillance",
      };
    }
  }

  if (/acme_savings_and_loan_debt/.test(implementationText)) {
    addEffect(facts, {
      kind: "economy",
      timing: "on_rez",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "gainCreditsOnRez"),
      source:
        "implementation.remainingReplacementLongtail.acme_savings_and_loan",
    });
    addEffect(facts, {
      kind: "counter_economy",
      timing: "persistent",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "endTurnCreditDebt"),
      source:
        "implementation.remainingReplacementLongtail.acme_savings_and_loan",
    });
  }

  if (/investment_firm_credit_diversion/.test(implementationText)) {
    if (expectsKind("effect:finite_economy_pool")) {
      addEffect(facts, {
        kind: "finite_economy_pool",
        timing: "persistent",
        scope: "remote",
        resource: "credits",
        amount: propertyNumber(
          implementationText,
          "hostedCreditsPerDivertedCredit",
        ),
        source: "implementation.remainingReplacementLongtail.investment_firm",
      });
    }
    if (expectsKind("effect:recurring_economy")) {
      addEffect(facts, {
        kind: "recurring_economy",
        timing: "start_of_turn",
        scope: "corp",
        resource: "credits",
        amount: propertyNumber(implementationText, "startTurnTakeCredits"),
        source: "implementation.remainingReplacementLongtail.investment_firm",
      });
    }
  }

  if (/hacker_tracker_trace_bits/.test(implementationText)) {
    addEffect(facts, {
      kind: "trace_credit",
      timing: "persistent",
      scope: "corp",
      resource: "credits",
      amount: propertyNumber(implementationText, "traceStrengthAndLimitPerBit"),
      source:
        "implementation.remainingReplacementLongtail.hacker_tracker_trace_bits",
    });
  }

  if (
    /newsgroup_taunting_run_start_tax/.test(implementationText) ||
    /kind:\s*"run_start_tax"/.test(implementationText)
  ) {
    addEffect(facts, {
      kind: "remote_tax",
      timing: "during_run",
      scope: "runner",
      resource: "credits",
      amount: propertyNumber(implementationText, "amount"),
      source: "implementation.corpUtility.newsgroup_taunting_run_start_tax",
    });
    addEffect(facts, {
      kind: "run_tax",
      timing: "during_run",
      scope: "run_path",
      resource: "credits",
      amount: propertyNumber(implementationText, "amount"),
      source: "implementation.corpUtility.newsgroup_taunting_run_start_tax",
    });
    addCondition(facts, {
      kind: "requires_during_run",
      source: "implementation.corpUtility.newsgroup_taunting_run_start_tax",
    });
    if (!facts.remoteRole && expectsKind("remoteRole:run_tax")) {
      facts.remoteRole = {
        kind: "run_tax",
        threatLevel: "medium",
        serverScope: "remote",
        confidence: "high",
        source: "implementation.corpUtility.newsgroup_taunting_run_start_tax",
      };
    }
  }

  if (/trojan_horse_tag/.test(implementationText)) {
    addEffect(facts, {
      kind: "tag_source",
      timing: "action",
      scope: "runner",
      resource: "tags",
      source: "implementation.corpUtility.trojan_horse_tag",
    });
    addCondition(facts, {
      kind: "requires_stolen_agenda_last_turn",
      source: "implementation.corpUtility.trojan_horse_tag",
    });
  }

  if (/omniscience_foundation_end_turn_tag/.test(implementationText)) {
    addEffect(facts, {
      kind: "tag_source",
      timing: "runner_turn",
      scope: "runner",
      resource: "tags",
      source: "implementation.corpUtility.omniscience_foundation_end_turn_tag",
    });
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.corpUtility.omniscience_foundation_end_turn_tag",
    });
  }

  if (
    /i_got_a_rock_tagged_meat_damage|schlaghund_tag_die_meat_damage/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "damage",
      timing: "action",
      scope: "runner",
      resource: "damage",
      amount: propertyNumber(implementationText, "damageAmount"),
      source: "implementation.uniqueDirectLongtail.tagged_meat_damage",
    });
    addEffect(facts, {
      kind: "tag_punish_payoff",
      timing: "action",
      scope: "runner",
      resource: "damage",
      source: "implementation.uniqueDirectLongtail.tagged_meat_damage",
    });
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.uniqueDirectLongtail.tagged_meat_damage",
    });
  }

  if (/trash_runner_resources_if_tagged/.test(implementationText)) {
    addEffect(facts, {
      kind: "resource_trash",
      timing: "action",
      scope: "runner",
      source: "implementation.corpUtility.trash_runner_resources_if_tagged",
    });
    addEffect(facts, {
      kind: "tag_punish_payoff",
      timing: "action",
      scope: "runner",
      resource: "cards",
      source: "implementation.corpUtility.trash_runner_resources_if_tagged",
    });
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.corpUtility.trash_runner_resources_if_tagged",
    });
  }

  if (/power_grid_overload/.test(implementationText)) {
    addEffect(facts, {
      kind: "hardware_trash",
      timing: "action",
      scope: "runner",
      source: "implementation.corpUtility.power_grid_overload",
    });
    addEffect(facts, {
      kind: "tag_punish_payoff",
      timing: "action",
      scope: "runner",
      resource: "cards",
      source: "implementation.corpUtility.power_grid_overload",
    });
    addCondition(facts, {
      kind: "requires_runner_tagged",
      source: "implementation.corpUtility.power_grid_overload",
    });
  }

  if (
    /new_blood_conceal_reorder_installed_ice|rescheduler_hq_shuffle_draw|cowboy_sysop_uninstall_corp_card_to_hq|swap_unrezzed_fort_ice_with_hq_ice|temporary_hq_ice_encounter_after_successful_run/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "zone_shuffle",
      timing: /during_run_on_this_fort|before_successful_run/.test(
        implementationText,
      )
        ? "during_run"
        : "action",
      scope: /hq/.test(implementationText) ? "hq" : "server",
      resource: "cards",
      source: "implementation.hidden_zone_or_rearrange_context",
    });
    facts.derivationNotes.push(
      "Hidden-zone rearrange/reinstall mechanics are represented as zone context only; generated facts do not expose hidden card identities or order.",
    );
    if (/rescheduler_hq_shuffle_draw/.test(implementationText)) {
      addEffect(facts, {
        kind: "draw",
        timing: "action",
        scope: "corp",
        resource: "cards",
        source: "implementation.corpUtility.rescheduler_hq_shuffle_draw",
      });
    }
    if (
      /temporary_hq_ice_encounter_after_successful_run/.test(implementationText)
    ) {
      addEffect(facts, {
        kind: "future_encounter_effect",
        timing: "successful_run",
        scope: "run_path",
        source:
          "implementation.fortRunWindows.temporary_hq_ice_encounter_after_successful_run",
      });
      addCondition(facts, {
        kind: "requires_successful_run",
        source:
          "implementation.fortRunWindows.temporary_hq_ice_encounter_after_successful_run",
      });
    }
    if (
      /during_run_on_this_fort|before_successful_run/.test(implementationText)
    ) {
      addCondition(facts, {
        kind: "requires_during_run",
        source: "implementation.fortRunWindows.hidden_zone_rearrange",
      });
    }
  }

  if (
    /can_run_fort_only_if_last_corp_turn_activity_on_fort/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "remote_tax",
      timing: "during_run",
      scope: "remote",
      source:
        "implementation.fortRunWindows.can_run_fort_only_if_last_corp_turn_activity_on_fort",
    });
    addCondition(facts, {
      kind: "requires_remote_server",
      source:
        "implementation.fortRunWindows.can_run_fort_only_if_last_corp_turn_activity_on_fort",
    });
    if (!facts.remoteRole && expectsKind("remoteRole:run_tax")) {
      facts.remoteRole = {
        kind: "run_tax",
        threatLevel: "medium",
        serverScope: "remote",
        confidence: "high",
        source:
          "implementation.fortRunWindows.can_run_fort_only_if_last_corp_turn_activity_on_fort",
      };
    }
  }

  if (/kind:\s*"trash_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "remote_tax",
      timing: "persistent",
      scope: "fort",
      resource: "credits",
      amount: amountNear(implementationText, "trash_cost"),
      source: "implementation.modifiers.trash_cost",
    });
    if (expectsKind("condition:requires_rezzed_card")) {
      addCondition(facts, {
        kind: "requires_rezzed_card",
        source: "implementation.modifiers.trash_cost",
      });
    }
    if (!facts.remoteRole && expectsKind("remoteRole:run_tax")) {
      facts.remoteRole = {
        kind: "run_tax",
        threatLevel: "medium",
        serverScope: "fort",
        confidence: "high",
        source: "implementation.modifiers.trash_cost",
      };
    }
  }

  if (/kind:\s*"install_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "install_discount",
      timing: "persistent",
      scope: /sameServerAsSource:\s*true/.test(implementationText)
        ? "fort"
        : "corp",
      resource: "credits",
      amount: amountNear(implementationText, "install_cost"),
      source: "implementation.modifiers.install_cost",
    });
    if (expectsKind("condition:requires_rezzed_card")) {
      addCondition(facts, {
        kind: "requires_rezzed_card",
        source: "implementation.modifiers.install_cost",
      });
    }
  }

  if (/kind:\s*"rez_cost"/.test(implementationText)) {
    addEffect(facts, {
      kind: "rez_discount",
      timing: "persistent",
      scope: /sameServerAsSource:\s*true/.test(implementationText)
        ? "fort"
        : "corp",
      resource: "credits",
      amount: amountNear(implementationText, "rez_cost"),
      source: "implementation.modifiers.rez_cost",
    });
    if (expectsKind("condition:requires_rezzed_card")) {
      addCondition(facts, {
        kind: "requires_rezzed_card",
        source: "implementation.modifiers.rez_cost",
      });
    }
  }

  if (/kind:\s*"hand_size"/.test(implementationText)) {
    if (hint?.side === "runner") {
      addEffect(facts, {
        kind: "hand_size_modifier",
        timing: "persistent",
        scope: "runner",
        resource: "hand_size",
        amount: amountNear(implementationText, "hand_size"),
        source: "implementation.modifiers.hand_size",
      });
      addCondition(facts, {
        kind: "requires_installed_card",
        source: "implementation.modifiers.hand_size",
      });
    } else {
      addEffect(facts, {
        kind: "remote_protection",
        timing: "persistent",
        scope: "corp",
        resource: "cards",
        amount: amountNear(implementationText, "hand_size"),
        source: "implementation.modifiers.hand_size",
      });
      if (expectsKind("condition:requires_rezzed_card")) {
        addCondition(facts, {
          kind: "requires_rezzed_card",
          source: "implementation.modifiers.hand_size",
        });
      }
    }
  }

  if (/kind:\s*"shell_traders_delayed_install"/.test(implementationText)) {
    addEffect(facts, {
      kind: "install_discount",
      timing: "persistent",
      scope: "runner",
      resource: "credits",
      source:
        "implementation.hiddenReplacementLongtail.shell_traders_delayed_install",
    });
    addCondition(facts, {
      kind: "requires_installed_resource",
      source:
        "implementation.hiddenReplacementLongtail.shell_traders_delayed_install",
    });
    addCondition(facts, {
      kind: "requires_grip_card",
      source:
        "implementation.hiddenReplacementLongtail.shell_traders_delayed_install",
    });
    facts.derivationNotes.push(
      "The Shell Traders is represented as delayed install-discount context only; generated facts do not create install legality or hidden hand identity.",
    );
  }

  if (
    /kind:\s*"microtech_backup_drive_program_trash_replacement"/.test(
      implementationText,
    ) ||
    /kind:\s*"replace_installed_program_trash_with_host_on_source"/.test(
      implementationText,
    )
  ) {
    addEffect(facts, {
      kind: "card_recovery",
      timing: "persistent",
      scope: "runner",
      resource: "cards",
      source:
        "implementation.runnerUtilityLongtail.microtech_backup_drive_program_trash_replacement",
    });
    addEffect(facts, {
      kind: "program_trash_prevention",
      timing: "prevention_window",
      scope: "installed_program",
      resource: "cards",
      source:
        "implementation.runnerUtilityLongtail.microtech_backup_drive_program_trash_replacement",
    });
    addCondition(facts, {
      kind: "requires_installed_hardware",
      source:
        "implementation.runnerUtilityLongtail.microtech_backup_drive_program_trash_replacement",
    });
    addCondition(facts, {
      kind: "requires_program_trash",
      source:
        "implementation.runnerUtilityLongtail.microtech_backup_drive_program_trash_replacement",
    });
    facts.derivationNotes.push(
      "Backup-drive recovery is represented without hosted-card identity or hidden stack/grip contents.",
    );
  }

  if (!facts.remoteRole && expectsKind("remoteRole:asset_economy")) {
    facts.remoteRole = {
      kind: "asset_economy",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "high",
      source: "pilot.expectedDerivableKinds.asset_economy",
    };
  }
  if (!facts.remoteRole && expectsKind("remoteRole:remote_capacity")) {
    facts.remoteRole = {
      kind: "remote_capacity",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "high",
      source: "pilot.expectedDerivableKinds.remote_capacity",
    };
  }
  if (!facts.remoteRole && expectsKind("remoteRole:tag_punish_asset")) {
    facts.remoteRole = {
      kind: "tag_punish_asset",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "high",
      source: "pilot.expectedDerivableKinds.tag_punish_asset",
    };
  }
  if (!facts.remoteRole && expectsKind("remoteRole:run_tax")) {
    facts.remoteRole = {
      kind: "run_tax",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "medium",
      source: "pilot.expectedDerivableKinds.run_tax",
    };
  }
  if (!facts.remoteRole && expectsKind("remoteRole:ice_modifier")) {
    facts.remoteRole = {
      kind: "ice_modifier",
      threatLevel: "medium",
      serverScope: "fort",
      confidence: "high",
      source: "pilot.expectedDerivableKinds.ice_modifier",
    };
  }
  if (!facts.remoteRole && expectsKind("remoteRole:bait")) {
    facts.remoteRole = {
      kind: "bait",
      threatLevel: "medium",
      serverScope: "remote",
      confidence: "medium",
      source: "pilot.expectedDerivableKinds.bait",
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
    facts.targetProfiles = uniqueBy(facts.targetProfiles, (targetProfile) =>
      targetProfile.schemaVersion === "target-profile-v1"
        ? JSON.stringify(targetProfile)
        : `${targetProfile.zone ?? ""}:${targetProfile.targetCardType ?? ""}:${
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

function centralServerTarget(implementationText) {
  if (/server:\s*"hq"/.test(implementationText)) return "hq";
  if (/server:\s*"rd"/.test(implementationText)) return "rnd";
  if (/server:\s*"archives"/.test(implementationText)) return "archives";
  return "server";
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
    if (isTargetProfileV1(targetProfile)) {
      validateKnown(
        targetProfile.schemaVersion,
        KNOWN_TARGET_PROFILE_SCHEMA_VERSIONS,
        `targetProfiles[${index}].schemaVersion`,
        "unknown_target_profile_schema_version",
        issues,
      );
      validateKnown(
        targetProfile.kind,
        KNOWN_TARGET_PROFILE_KINDS,
        `targetProfiles[${index}].kind`,
        "unknown_target_profile_kind",
        issues,
      );
      validateKnown(
        targetProfile.timing,
        KNOWN_TARGET_PROFILE_TIMINGS,
        `targetProfiles[${index}].timing`,
        "unknown_target_profile_timing",
        issues,
      );
      validateKnown(
        targetProfile.targetType,
        KNOWN_TARGET_PROFILE_TARGET_TYPES,
        `targetProfiles[${index}].targetType`,
        "unknown_target_profile_target_type",
        issues,
      );
      if (
        typeof targetProfile.purpose !== "string" ||
        targetProfile.purpose === ""
      ) {
        issues.push({
          kind: "invalid_target_profile_shape",
          message: `Expected non-empty string at targetProfiles[${index}].purpose.`,
        });
      }
      for (const [preferenceIndex, preference] of (
        targetProfile.preferences ?? []
      ).entries()) {
        validateKnown(
          preference,
          KNOWN_TARGET_PROFILE_PREFERENCES,
          `targetProfiles[${index}].preferences[${preferenceIndex}]`,
          "unknown_target_profile_preference",
          issues,
        );
      }
      for (const [avoidIndex, avoid] of (targetProfile.avoid ?? []).entries()) {
        validateKnown(
          avoid,
          KNOWN_TARGET_PROFILE_AVOIDS,
          `targetProfiles[${index}].avoid[${avoidIndex}]`,
          "unknown_target_profile_avoid",
          issues,
        );
      }
      validateKnown(
        targetProfile.hiddenInfoPolicy,
        KNOWN_TARGET_PROFILE_HIDDEN_INFO_POLICIES,
        `targetProfiles[${index}].hiddenInfoPolicy`,
        "unknown_target_profile_hidden_info_policy",
        issues,
      );
      continue;
    }
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

function isTargetProfileV1(targetProfile) {
  return (
    targetProfile?.schemaVersion === "target-profile-v1" ||
    targetProfile?.kind !== undefined ||
    targetProfile?.targetType !== undefined ||
    targetProfile?.preferences !== undefined ||
    targetProfile?.hiddenInfoPolicy !== undefined
  );
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
    ...(derivedFacts.breakerProfile?.sideEffects ?? []).map(
      (sideEffect) => `breakerSideEffect:${sideEffect}`,
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

function secondAmountNear(text, kind) {
  const match = text.match(
    new RegExp(`kind:\\s*"${kind}"[\\s\\S]{0,360}?duration`),
  );
  if (!match) return undefined;
  const amounts = [...match[0].matchAll(/amount:\s*(\d+)/g)].map((item) =>
    Number(item[1]),
  );
  return amounts[1];
}

function subtypeChoiceValues(text) {
  const match = text.match(/choices:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  const choices = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  return choices.filter((choice) =>
    ["code_gate", "sentry", "wall"].includes(choice),
  );
}

function propertyNumber(text, field) {
  const match = text.match(new RegExp(`${field}:\\s*(\\d+)`));
  return match ? Number(match[1]) : undefined;
}

function functionCallNumber(text, functionName, argumentIndex = 0) {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*\\(([^)]*)\\)`));
  if (!match) return undefined;
  const numbers = [...match[1].matchAll(/\d+/g)].map((item) => Number(item[0]));
  return numbers[argumentIndex];
}

function functionCallPropertyNumber(text, functionName, field) {
  const escapedFunction = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`${escapedFunction}\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`),
  );
  if (!match) return undefined;
  const fieldMatch = match[1].match(new RegExp(`${escapedField}:\\s*(\\d+)`));
  return fieldMatch ? Number(fieldMatch[1]) : undefined;
}

function hiddenSuccessfulRunBeforeAccessFactoryBlock(text, server, effectKind) {
  const calls = text.matchAll(
    /hiddenSuccessfulRunBeforeAccessEffect\s*\(\s*\{([\s\S]*?)\}\s*\)/g,
  );
  for (const call of calls) {
    const block = call[1] ?? "";
    if (
      new RegExp(`server:\\s*"${server}"`).test(block) &&
      new RegExp(`kind:\\s*"${effectKind}"`).test(block)
    ) {
      return block;
    }
  }
  return undefined;
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

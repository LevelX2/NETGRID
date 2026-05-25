#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const hintsPath = path.join(repoRoot, "data/ai/ai-card-hints-active.json");
const outputPath = path.join(
  repoRoot,
  "docs/reviews/ai/ai-derived-basic-facts-prototype-2026-05-25.json",
);

const pilotCards = [
  {
    cardId: "onr_v1_037_japanese-water-torture",
    title: "Japanese Water Torture",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/japanese-water-torture.ts",
  },
  {
    cardId: "onr_v1_039_krash",
    title: "Krash",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/krash.ts",
  },
  {
    cardId: "onr_v1_059_self-modifying-code",
    title: "Self-Modifying Code",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/self-modifying-code.ts",
  },
  {
    cardId: "onr_v1_043_mystery-box",
    title: "Mystery Box",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/mystery-box.ts",
  },
  {
    cardId: "onr_v1_048_poltergeist",
    title: "Poltergeist",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/poltergeist.ts",
  },
  {
    cardId: "onr_v1_057_scatter-shot",
    title: "Scatter Shot",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/scatter-shot.ts",
  },
  {
    cardId: "onr_v1_050_r-and-d-protocol-files",
    title: "R&D-Protocol Files",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/r-d-protocol-files.ts",
  },
  {
    cardId: "onr_v1_017_deep-thought",
    title: "Deep Thought",
    path: "packages/engine/src/card-implementations/onr-v1/runner/programs/deep-thought.ts",
  },
  {
    cardId: "onr_v1_210_political-overthrow",
    title: "Political Overthrow",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/political-overthrow.ts",
  },
  {
    cardId: "onr_v1_193_corporate-coup",
    title: "Corporate Coup",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-coup.ts",
  },
  {
    cardId: "onr_v1_192_corporate-boon",
    title: "Corporate Boon",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-boon.ts",
  },
  {
    cardId: "onr_v1_199_employee-empowerment",
    title: "Employee Empowerment",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/employee-empowerment.ts",
  },
  {
    cardId: "onr_v1_207_netwatch-operations-office",
    title: "Netwatch Operations Office",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/netwatch-operations-office.ts",
  },
  {
    cardId: "onr_v1_208_on-call-solo-team",
    title: "On-Call Solo Team",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/on-call-solo-team.ts",
  },
  {
    cardId: "onr_v1_217_strike-force-kali",
    title: "Strike Force Kali",
    path: "packages/engine/src/card-implementations/onr-v1/corp/agendas/strike-force-kali.ts",
  },
  {
    cardId: "onr_v1_274_tutor",
    title: "Tutor",
    path: "packages/engine/src/card-implementations/onr-v1/corp/ice/tutor.ts",
  },
  {
    cardId: "onr_v1_277_virizz",
    title: "Virizz",
    path: "packages/engine/src/card-implementations/onr-v1/corp/ice/virizz.ts",
  },
  {
    cardId: "onr_v1_276_viral-15",
    title: "Viral 15",
    path: "packages/engine/src/card-implementations/onr-v1/corp/ice/viral-15.ts",
  },
  {
    cardId: "onr_v1_355_crystal-palace-station-grid",
    title: "Crystal Palace Station Grid",
    path: "packages/engine/src/card-implementations/onr-v1/corp/upgrades/crystal-palace-station-grid.ts",
  },
  {
    cardId: "onr_v1_366_red-herrings",
    title: "Red Herrings",
    path: "packages/engine/src/card-implementations/onr-v1/corp/upgrades/red-herrings.ts",
  },
  {
    cardId: "onr_v1_302_scorched-earth",
    title: "Scorched Earth",
    path: "packages/engine/src/card-implementations/onr-v1/corp/operations/scorched-earth.ts",
  },
  {
    cardId: "onr_v1_285_closed-accounts",
    title: "Closed Accounts",
    path: "packages/engine/src/card-implementations/onr-v1/corp/operations/closed-accounts.ts",
  },
  {
    cardId: "onr_v1_283_audit-of-call-records",
    title: "Audit of Call Records",
    path: "packages/engine/src/card-implementations/onr-v1/corp/operations/audit-of-call-records.ts",
  },
  {
    cardId: "onr_v1_284_chance-observation",
    title: "Chance Observation",
    path: "packages/engine/src/card-implementations/onr-v1/corp/operations/chance-observation.ts",
  },
];

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const check = args.has("--check");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function amountNear(text, kind) {
  const match = text.match(
    new RegExp(`kind:\\s*"${kind}"[\\s\\S]{0,240}?amount:\\s*(\\d+)`),
  );
  return match ? Number(match[1]) : undefined;
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

function deriveFromImplementation(card, implementationText, hint) {
  const facts = {
    effects: [],
    conditions: [],
    costProfile: {},
    breakerProfile: undefined,
    remoteRole: undefined,
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
      facts.needsManualOverlayReasons.push(
        "Japanese-Water-Torture-style future action debt is visible in text/comment but not in a structured resolver field.",
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
        source:
          "implementation.printedSubroutines.run_duration_break_subroutine_cost",
      });
    }
    if (/run_duration_trash_program/.test(implementationText)) {
      addEffect(facts, {
        kind: "program_trash",
        timing: "encounter",
        scope: "runner",
        source: "implementation.printedSubroutines.run_duration_trash_program",
      });
    }
    if (/run_duration_additional_subroutine/.test(implementationText)) {
      addEffect(facts, {
        kind: "remote_protection",
        timing: "encounter",
        scope: "run_path",
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
      timing: "persistent",
      scope: "remote",
      resource: "credits",
      amount: amountNear(implementationText, "steal_cost"),
      source: "implementation.modifiers.steal_cost",
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
  );
  facts.conditions = uniqueBy(facts.conditions, (condition) => condition.kind);

  return facts;
}

function manualOntology(hint) {
  return {
    effects: (hint?.effects ?? []).map((effect) => ({
      kind: effect.kind,
      timing: effect.timing,
      scope: effect.scope,
      resource: effect.resource,
      amount: effect.amount,
    })),
    conditions: (hint?.conditions ?? []).map((condition) => ({
      kind: condition.kind,
    })),
    costProfile: hint?.costProfile,
    breakerProfile: hint?.breakerProfile,
    remoteRole: hint?.remoteRole,
    lineSupport: hint?.lineSupport ?? [],
    quality: hint?.quality,
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
  const manualRemoteRole = manual.remoteRole?.kind;
  const derivedRemoteRole = derived.remoteRole?.kind;

  const derivedOnly = [];
  const manualOnly = [];
  const matches = [];

  for (const kind of derivedEffects) {
    if (manualEffects.has(kind)) matches.push(`effect:${kind}`);
    else derivedOnly.push(`effect:${kind}`);
  }
  for (const kind of manualEffects) {
    if (!derivedEffects.has(kind)) manualOnly.push(`effect:${kind}`);
  }

  for (const kind of derivedConditions) {
    if (manualConditions.has(kind)) matches.push(`condition:${kind}`);
    else derivedOnly.push(`condition:${kind}`);
  }
  for (const kind of manualConditions) {
    if (!derivedConditions.has(kind)) manualOnly.push(`condition:${kind}`);
  }

  for (const coverage of derivedCoverage) {
    if (manualCoverage.has(coverage))
      matches.push(`breakerCoverage:${coverage}`);
    else derivedOnly.push(`breakerCoverage:${coverage}`);
  }
  for (const coverage of manualCoverage) {
    if (!derivedCoverage.has(coverage))
      manualOnly.push(`breakerCoverage:${coverage}`);
  }

  if (derivedRemoteRole || manualRemoteRole) {
    if (derivedRemoteRole === manualRemoteRole) {
      matches.push(`remoteRole:${derivedRemoteRole}`);
    } else {
      if (derivedRemoteRole)
        derivedOnly.push(`remoteRole:${derivedRemoteRole}`);
      if (manualRemoteRole) manualOnly.push(`remoteRole:${manualRemoteRole}`);
    }
  }

  return {
    matches,
    derivedOnly,
    manualOnly,
  };
}

function buildReport() {
  const hints = readJson(hintsPath).cards;
  const hintsById = new Map(hints.map((hint) => [hint.cardId, hint]));
  const cards = pilotCards.map((card) => {
    const absolutePath = path.join(repoRoot, card.path);
    const hint = hintsById.get(card.cardId);
    const implementationExists = fs.existsSync(absolutePath);
    const implementationText = implementationExists
      ? fs.readFileSync(absolutePath, "utf8")
      : "";
    const derived = implementationExists
      ? deriveFromImplementation(card, implementationText, hint)
      : {
          effects: [],
          conditions: [],
          derivationNotes: [],
          needsManualOverlayReasons: ["Implementation file not found."],
        };
    const manual = manualOntology(hint);
    const comparison = compareFacts(derived, manual);
    return {
      cardId: card.cardId,
      title: card.title,
      side: hint?.side,
      cardType: hint?.cardType,
      implementationPath: card.path,
      implementationExists,
      derivedBasicFacts: derived,
      manualOntology: manual,
      comparison,
      needsManualOverlay:
        derived.needsManualOverlayReasons.length > 0 ||
        comparison.manualOnly.length > 0 ||
        comparison.derivedOnly.length > 0,
    };
  });

  const aggregate = {
    generatedAt: "2026-05-25",
    prototypeScope:
      "Read-only pilot comparing mechanically derived basic AI facts against manual ontology fields.",
    pilotCards: cards.length,
    implementationFilesFound: cards.filter((card) => card.implementationExists)
      .length,
    cardsWithDerivedFacts: cards.filter(
      (card) =>
        card.derivedBasicFacts.effects.length > 0 ||
        card.derivedBasicFacts.conditions.length > 0 ||
        card.derivedBasicFacts.breakerProfile ||
        card.derivedBasicFacts.remoteRole,
    ).length,
    cardsWithExactOrPartialMatches: cards.filter(
      (card) => card.comparison.matches.length > 0,
    ).length,
    cardsNeedingManualOverlay: cards.filter((card) => card.needsManualOverlay)
      .length,
    derivedEffectKinds: countKinds(
      cards.flatMap((card) =>
        card.derivedBasicFacts.effects.map((effect) => effect.kind),
      ),
    ),
    derivedConditionKinds: countKinds(
      cards.flatMap((card) =>
        card.derivedBasicFacts.conditions.map((condition) => condition.kind),
      ),
    ),
  };

  return {
    schemaVersion: 1,
    aggregate,
    cards,
  };
}

function countKinds(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (write) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
}

if (check) {
  if (!fs.existsSync(outputPath)) {
    console.error(
      `Missing generated report: ${path.relative(repoRoot, outputPath)}`,
    );
    process.exit(1);
  }
  const existing = JSON.stringify(readJson(outputPath), null, 2);
  const expected = JSON.stringify(report, null, 2);
  if (existing !== expected) {
    console.error(
      `Generated report is stale: ${path.relative(repoRoot, outputPath)}`,
    );
    process.exit(1);
  }
}

console.log(
  JSON.stringify(
    {
      pilotCards: report.aggregate.pilotCards,
      implementationFilesFound: report.aggregate.implementationFilesFound,
      cardsWithDerivedFacts: report.aggregate.cardsWithDerivedFacts,
      cardsWithExactOrPartialMatches:
        report.aggregate.cardsWithExactOrPartialMatches,
      cardsNeedingManualOverlay: report.aggregate.cardsNeedingManualOverlay,
      output: path.relative(repoRoot, outputPath),
      wroteReport: write,
      checkedReport: check,
    },
    null,
    2,
  ),
);

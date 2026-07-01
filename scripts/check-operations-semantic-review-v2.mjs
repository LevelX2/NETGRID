import fs from "node:fs";

const REVIEW_PATH =
  "docs/reviews/ai/operations-semantic-review-v2-input-2026-07-01.md";
const HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const HINT_ONTOLOGY_PATH = "packages/ai/src/hint-ontology.ts";

const FORBIDDEN_PRODUCTIVE_STRATEGIES = new Set([
  "corp.action_tempo",
  "corp.overadvance_value",
  "corp.deck_recycle_engine",
]);

const KNOWN_PAIR_ROLES = new Set([
  "payoff_anchor",
  "engine_anchor",
  "enabler",
  "support_tool",
  "utility",
  "defensive_tool",
  "emergency_tool",
  "win_condition",
  "tax_tool",
  "punish_payoff",
  "scoring_tool",
]);

const ROLE_TOKEN_TO_ROLE = new Map(
  Object.entries({
    recovery_enabler: "enabler",
    trace_tag_source: "enabler",
    tag_snowball_followup: "enabler",
    tag_source_enabler: "enabler",
    disruption_tool: "support_tool",
  }),
);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sameArray(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseSignals(text) {
  if (!text || text.trim() === "keine") return [];
  return text
    .split(",")
    .map((value) => value.trim().replace(/`/g, ""))
    .filter((value) => value && value !== "keine" && !value.includes("?"));
}

function parsePairs(text) {
  const result = { pairs: [], candidates: [] };
  if (!text || text.trim() === "keine") return result;

  for (const rawSegment of text.split(";")) {
    const segment = rawSegment.trim();
    if (!segment) continue;
    if (/candidate:/i.test(segment)) {
      result.candidates.push(
        segment.replace(/^.*candidate:/i, "candidate:").trim(),
      );
      continue;
    }
    if (/keine bestätigte Pair-Zuordnung/i.test(segment)) continue;

    const match = segment.match(
      /^(corp\.[a-z0-9_.-]+)\s*->\s*([^/\s]+)\/([^()]+?)\s*\((low|medium|high)\)$/,
    );
    assert(match, `Kann StrategySupportPair nicht parsen: ${segment}`);
    const [, strategyId, reviewRole, roleDetailRaw, confidence] = match;
    const role = KNOWN_PAIR_ROLES.has(reviewRole)
      ? reviewRole
      : ROLE_TOKEN_TO_ROLE.get(reviewRole);
    assert(role, `Unbekannter Review-v2-Rollentoken: ${reviewRole}`);
    result.pairs.push({
      strategyId,
      role,
      roleDetail: roleDetailRaw.trim().replace(/\s+/g, "_"),
      confidence,
      reviewRole,
    });
  }
  return result;
}

function parseReview() {
  const md = fs.readFileSync(REVIEW_PATH, "utf8");
  const sections = md.split(/\n### /).slice(1).map((section) => `### ${section}`);
  const entries = [];
  for (const section of sections) {
    const header = section.match(/^### (.+?) \(`([^`]+)`\)/);
    if (!header) continue;
    const status = section.match(
      /Review-Status: \*\*(.+?)\*\*; Priorität: \*\*(.+?)\*\*; Bucket: `([^`]+)`/,
    );
    const tactic = section.match(/- Taktiksignale: ([^\n]+)/);
    const pairs = parsePairs(
      section.match(/- StrategySupportPairs: ([^\n]+)/)?.[1],
    );
    entries.push({
      title: header[1],
      cardId: header[2],
      reviewStatus: status?.[1],
      priority: status?.[2],
      bucket: status?.[3],
      tacticSignals: parseSignals(tactic?.[1]),
      strategySupportPairs: pairs.pairs,
      candidates: pairs.candidates,
    });
  }
  return entries;
}

function countBy(entries, field) {
  return entries.reduce((acc, entry) => {
    acc[entry[field]] = (acc[entry[field]] ?? 0) + 1;
    return acc;
  }, {});
}

function pairComparable(pair) {
  return {
    strategyId: pair.strategyId,
    role: pair.role,
    roleDetail: pair.roleDetail,
    confidence: pair.confidence,
  };
}

function sortedJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function main() {
  const reviewEntries = parseReview();
  assert(reviewEntries.length === 38, `Erwartet 38 Reviews, hat ${reviewEntries.length}`);
  assert(
    JSON.stringify(countBy(reviewEntries, "reviewStatus")) ===
      JSON.stringify({ ändern: 19, "kleine Änderung": 13, behalten: 6 }),
    "Review-Status-Counts weichen von Review v2 ab.",
  );
  assert(
    JSON.stringify(countBy(reviewEntries, "priority")) ===
      JSON.stringify({ medium: 14, high: 16, low: 8 }),
    "Priority-Counts weichen von Review v2 ab.",
  );

  const hints = readJson(HINTS_PATH).cards;
  const hintsById = new Map(hints.map((hint) => [hint.cardId, hint]));
  const signalCatalog = new Set(
    readJson(TACTIC_SIGNAL_PATH).signals.map((signal) => signal.signalId),
  );
  const ontologySource = fs.readFileSync(HINT_ONTOLOGY_PATH, "utf8");

  const requiredConditionKinds = [
    "requires_installed_advanceable_card",
    "requires_runner_attempted_run_last_turn",
    "requires_runner_attempted_multiple_runs_last_turn",
    "requires_runner_attempted_run_this_game",
    "requires_runner_trashed_node_last_turn",
    "requires_runner_installed_resource_last_turn",
  ];
  for (const kind of requiredConditionKinds) {
    assert(
      ontologySource.includes(`"${kind}"`),
      `Condition kind fehlt in Hint-Ontologie: ${kind}`,
    );
  }

  let confirmedPairCount = 0;
  let candidateCount = 0;
  for (const entry of reviewEntries) {
    const hint = hintsById.get(entry.cardId);
    assert(hint, `Aktiver Hint fehlt: ${entry.cardId}`);
    assert(
      sameArray(hint.tacticSignals ?? [], entry.tacticSignals),
      `${entry.cardId}: tacticSignals entsprechen nicht Review v2.\nIst: ${(hint.tacticSignals ?? []).join(", ")}\nSoll: ${entry.tacticSignals.join(", ")}`,
    );
    for (const signal of hint.tacticSignals ?? []) {
      assert(signalCatalog.has(signal), `${entry.cardId}: Signal fehlt im Katalog: ${signal}`);
    }

    const actualPairs = (hint.strategySupportPairs ?? []).map(pairComparable);
    const expectedPairs = entry.strategySupportPairs.map(pairComparable);
    assert(
      actualPairs.map(sortedJson).sort().join("\n") ===
        expectedPairs.map(sortedJson).sort().join("\n"),
      `${entry.cardId}: StrategySupportPairs entsprechen nicht Review v2.`,
    );
    confirmedPairCount += actualPairs.length;
    candidateCount += entry.candidates.length;

    for (const pair of hint.strategySupportPairs ?? []) {
      assert(KNOWN_PAIR_ROLES.has(pair.role), `${entry.cardId}: unbekannte Pair-Rolle ${pair.role}`);
      assert(
        !FORBIDDEN_PRODUCTIVE_STRATEGIES.has(pair.strategyId),
        `${entry.cardId}: forbidden productive strategy ${pair.strategyId}`,
      );
    }
    for (const strategyId of hint.lineSupport ?? []) {
      assert(
        !FORBIDDEN_PRODUCTIVE_STRATEGIES.has(strategyId),
        `${entry.cardId}: forbidden lineSupport ${strategyId}`,
      );
    }
    if (entry.strategySupportPairs.length === 0) {
      assert((hint.lineSupport ?? []).length === 0, `${entry.cardId}: support-only lineSupport muss leer sein.`);
      assert((hint.strategicRole ?? []).length === 0, `${entry.cardId}: support-only strategicRole muss leer sein.`);
    } else {
      assert(
        sameArray(hint.lineSupport ?? [], unique(entry.strategySupportPairs.map((pair) => pair.strategyId))),
        `${entry.cardId}: lineSupport spiegelt Pairs nicht.`,
      );
      assert(
        sameArray(hint.strategicRole ?? [], unique(entry.strategySupportPairs.map((pair) => pair.role))),
        `${entry.cardId}: strategicRole spiegelt Pairs nicht.`,
      );
    }
    if (entry.candidates.length > 0) {
      assert(
        (hint.manualNotes ?? []).some((note) => note.includes("Strategy candidate/deferred")),
        `${entry.cardId}: candidate/deferred-Hinweis fehlt.`,
      );
    }
  }

  assert(confirmedPairCount === 29, `Erwartet 29 bestätigte Pairs, hat ${confirmedPairCount}`);
  assert(candidateCount === 6, `Erwartet 6 Kandidaten, hat ${candidateCount}`);

  const corporateShuffle = hintsById.get("onr_classic_017_corporate-shuffle");
  assert((corporateShuffle.strategySupportPairs ?? []).length === 0, "Corporate Shuffle darf kein Pair haben.");
  assert(
    !(corporateShuffle.lineSupport ?? []).includes("corp.deck_recycle_engine"),
    "Corporate Shuffle darf nicht corp.deck_recycle_engine tragen.",
  );

  for (const cardId of [
    "onr_v1_292_management-shake-up",
    "onr_v1_300_project-consultants",
    "onr_v1_304_systematic-layoffs",
  ]) {
    const hint = hintsById.get(cardId);
    assert(
      !(hint.lineSupport ?? []).includes("corp.overadvance_value"),
      `${cardId}: corp.overadvance_value darf nicht produktiv gesetzt sein.`,
    );
    assert(
      (hint.strategySupportPairs ?? []).every(
        (pair) => !(pair.evidence ?? []).includes("advance.overadvance_support"),
      ),
      `${cardId}: overadvance_support darf keine bestätigte Fast-Advance-Evidence sein.`,
    );
  }

  for (const cardId of [
    "onr_v1_289_edgerunner-inc-temps",
    "onr_v1_297_overtime-incentives",
    "onr_proteus_046_corporate-guard-r-temps",
  ]) {
    const hint = hintsById.get(cardId);
    assert((hint.strategySupportPairs ?? []).length === 0, `${cardId}: action tempo bleibt candidate/deferred.`);
    assert(
      (hint.manualNotes ?? []).some((note) => note.includes("corp.action_tempo")),
      `${cardId}: corp.action_tempo candidate note fehlt.`,
    );
  }

  const powerGrid = hintsById.get("onr_v1_299_power-grid-overload");
  assert(powerGrid.tacticSignals.includes("target.runner_hardware_trash"), "Power Grid Overload braucht target.runner_hardware_trash.");
  assert(powerGrid.tacticSignals.includes("tag.runner_hardware_trash_payoff"), "Power Grid Overload braucht tag.runner_hardware_trash_payoff.");
  assert(!powerGrid.tacticSignals.includes("hardware.trash_payoff"), "Power Grid Overload darf hardware.trash_payoff nicht behalten.");

  const manhunt = hintsById.get("onr_proteus_050_manhunt");
  const manhuntTagEffect = (manhunt.effects ?? []).find(
    (effect) => effect.kind === "tag_source" && effect.timing === "trace_success",
  );
  assert(manhuntTagEffect?.target === "tags_equal_successful_trace_margin", "Manhunt muss Trace-Marge als Tag-Anzahl markieren.");
  assert(manhuntTagEffect.amount === undefined, "Manhunt darf nicht amount=1 als statische Tag-Anzahl behalten.");

  const rentToOwn = hintsById.get("onr_proteus_051_rent-to-own-contract");
  assert(!rentToOwn.tacticSignals.includes("ice.corp_deferred_rez"), "Rent-to-Own darf nicht ice.corp_deferred_rez tragen.");
  assert(rentToOwn.tacticSignals.includes("ice.corp_free_rez"), "Rent-to-Own braucht ice.corp_free_rez.");
  assert(rentToOwn.tacticSignals.includes("risk.deferred_rez_payment_liability"), "Rent-to-Own braucht deferred payment liability.");

  const dataSifters = hintsById.get("onr_proteus_048_data-sifters");
  assert(
    (dataSifters.conditions ?? []).some((condition) => condition.kind === "requires_runner_trashed_node_last_turn"),
    "Data Sifters braucht requires_runner_trashed_node_last_turn.",
  );

  const summary = {
    checkedOperations: reviewEntries.length,
    statusCounts: countBy(reviewEntries, "reviewStatus"),
    priorityCounts: countBy(reviewEntries, "priority"),
    confirmedStrategySupportPairs: confirmedPairCount,
    candidateDeferredPairs: candidateCount,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();

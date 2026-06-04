import fs from "node:fs";

const mdPath =
  "docs/reviews/ai/ai043-r-readiness-audit-decision-2026-06-04.md";
const jsonPath =
  "docs/reviews/ai/ai043-r-readiness-audit-decision-2026-06-04.json";
const ai042Path =
  "docs/reviews/ai/ai042-action-semantics-coverage-report-2026-06-04.json";
const ai043Path =
  "docs/reviews/ai/ai043-diagnostic-doctrine-goal-bridge-handoff-2026-06-04.json";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`AI043-R check failed: ${message}`);
  process.exit(1);
}

const md = read(mdPath);
const decision = JSON.parse(read(jsonPath));
const ai042 = JSON.parse(read(ai042Path));
const ai043 = JSON.parse(read(ai043Path));

if (decision.step !== "AI043-R") fail("JSON step must be AI043-R");
if (decision.status !== "skipped_as_redundant")
  fail("AI043-R must be skipped as redundant");
if (ai042.step !== "AI042" || ai043.step !== "AI043")
  fail("AI042/AI043 source reports must be present");
if (ai042.runtimeConsumerStatus !== "none" || ai043.runtimeConsumerStatus !== "none")
  fail("source reports must have no runtime consumer");
if (ai042.totalLegalActions !== 32) fail("AI042 totalLegalActions must be 32");
if (ai042.gates.neutralProjectionCoveragePercent !== 100)
  fail("AI042 neutral coverage must be 100 percent");
if (ai042.unknownActions.length !== 0) fail("AI042 unknownActions must be empty");

for (const zeroGate of [
  "hiddenInfoLeaks",
  "runtimeBehaviorChanges",
  "actionSelectionChanges",
  "plannerConsumers",
  "scoringConsumers",
]) {
  if (ai042.gates[zeroGate] !== 0) fail(`AI042 gate must be zero: ${zeroGate}`);
}

for (const requiredGap of [
  "target_context_unavailable",
  "ability_unresolved",
  "card_semantics_unavailable",
]) {
  if (
    !ai042.topGapCategories.some((entry) => entry.category === requiredGap) ||
    !decision.requiredEvidenceConfirmed.topGapCategories.includes(requiredGap)
  ) {
    fail(`required gap missing: ${requiredGap}`);
  }
}

for (const requiredField of [
  "DeckDoctrine v2",
  "TacticalGoal generation",
  "Action-to-goal matching",
  "Shadow-only fixtures",
]) {
  if (
    !ai043.fieldReadinessMatrix.some(
      (entry) => entry.nextField === requiredField,
    ) ||
    !decision.requiredEvidenceConfirmed.handoffFollowUpFields.includes(
      requiredField,
    )
  ) {
    fail(`required handoff field missing: ${requiredField}`);
  }
}

for (const [flag, value] of Object.entries(decision.noEffectFlags ?? {})) {
  if (value !== false) fail(`No-effect flag must be false: ${flag}`);
}

for (const forbidden of [
  "productive scoring",
  "numeric action scores",
  "ranked alternatives",
  "action selection",
  "planner weights",
  "runtime consumer",
  "hidden-info projection",
  "legality generation",
]) {
  if (!decision.forbiddenInThisDecisionConfirmedAbsent.includes(forbidden)) {
    fail(`forbidden confirmation missing: ${forbidden}`);
  }
}

for (const requiredText of [
  "Status: `skipped_as_redundant`",
  "32-`LegalAction`-Korpus",
  "kein Scoring",
  "keine Action-Auswahl",
  "keine Runtime-Anbindung",
  "keine Hidden-Info-Projektion",
]) {
  if (!md.includes(requiredText)) fail(`Markdown decision missing: ${requiredText}`);
}

console.log("AI043_R_READINESS_AUDIT_DECISION OK skipped_as_redundant");

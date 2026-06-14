import type {
  SelfplayDecisionSnapshotPromotionCategory,
  SelfplayDecisionSnapshotPromotionQueueEntry,
} from "../evaluation/selfplay-decision-snapshot-mining";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export type SelfplayPromotionActivityCandidate = {
  fileName: string;
  title: string;
  category: SelfplayDecisionSnapshotPromotionCategory;
  snapshotId: string;
  scenarioHint: string;
  markdown: string;
  writeAllowed: false;
  evidence: string[];
};

export function formatSelfplayPromotionActivityCandidates(
  queue: readonly SelfplayDecisionSnapshotPromotionQueueEntry[],
): SelfplayPromotionActivityCandidate[] {
  const candidates = queue.map(activityCandidateFromQueueEntry);
  assertSemanticObjectSideSafe(candidates, "SelfplayPromotionActivityCandidates");
  return candidates;
}

function activityCandidateFromQueueEntry(
  entry: SelfplayDecisionSnapshotPromotionQueueEntry,
): SelfplayPromotionActivityCandidate {
  const slug = slugify(`${entry.category}-${entry.scenarioHint}-${entry.snapshotId}`);
  const title = `Selfplay Promotion: ${entry.scenarioHint}`;
  const candidate: SelfplayPromotionActivityCandidate = {
    fileName: `docs/activities/inbox/${slug}.md`,
    title,
    category: entry.category,
    snapshotId: entry.snapshotId,
    scenarioHint: entry.scenarioHint,
    markdown: [
      `# ${title}`,
      "",
      "Status: `candidate`",
      "",
      `Quelle: \`${entry.snapshotId}\``,
      "",
      "## Kategorie",
      "",
      `\`${entry.category}\``,
      "",
      "## Aufgabe",
      "",
      activityBody(entry),
      "",
      "## Evidence",
      "",
      ...entry.evidence.map((evidence) => `- \`${evidence}\``),
      "",
      "## Grenzen",
      "",
      "- Dieser Formatter schreibt keine Dateien.",
      "- Der Vorschlag ist report-only und braucht manuelle Triage.",
    ].join("\n"),
    writeAllowed: false,
    evidence: [
      "selfplay_promotion_activity_candidate:report_only",
      `category:${entry.category}`,
      `snapshot:${entry.snapshotId}`,
      "write_allowed:false",
    ],
  };
  assertSemanticObjectSideSafe(candidate, "SelfplayPromotionActivityCandidate");
  return candidate;
}

function activityBody(entry: SelfplayDecisionSnapshotPromotionQueueEntry): string {
  switch (entry.category) {
    case "promote_to_real_engine_corpus":
      return "Prüfen, ob der Snapshot als Real-Engine-Corpus-Regressionsfall nachgebaut werden kann.";
    case "promote_to_snapshot_suite":
      return "Prüfen, ob der Snapshot als dauerhafter Decision-Snapshot-Test geeignet ist.";
    case "defer_missing_engine_state":
      return "Engine-State oder redaktionell sichere LegalAction-Alternativen fehlen; zuerst Repro-Kontext klären.";
    case "defer_target_choice_gap":
      return "TargetChoice-Diagnose ergänzen, bevor der Snapshot produktiv promoted wird.";
    case "defer_doctrine_gap":
      return "DoctrineGoal-/ActionFit-Lücke prüfen und als kleines Semantikpaket schneiden.";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

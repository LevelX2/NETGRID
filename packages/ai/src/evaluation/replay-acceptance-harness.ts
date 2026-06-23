import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";
import type {
  ReplayDecisionCase,
  ReplayDecisionCaseExtractionReport,
} from "./replay-decision-case-extraction";
import type { ReplayDecisionCandidateClusterReport } from "./replay-decision-case-clustering";

export const REPLAY_ACCEPTANCE_HARNESS_SCHEMA_VERSION =
  "replay-acceptance-harness-v1" as const;

export type ReplayAcceptanceStatus =
  | "accepted"
  | "implemented_but_acceptance_incomplete"
  | "blocked";

export type ReplayAcceptanceHarnessOptions = {
  runId: string;
  fixedPattern?: {
    selectedActionType: string;
    selectedPlanKind: string;
    challengerActionType: string;
    challengerPlanKind: string;
  };
  portableReproFixtures?: number;
  currentAiHoldoutEvaluated?: boolean;
  fullAiTestGreen?: boolean;
};

export type ReplayAcceptanceHarnessReport = {
  schemaVersion: typeof REPLAY_ACCEPTANCE_HARNESS_SCHEMA_VERSION;
  scope: "ai_replay_acceptance_hygiene";
  runId: string;
  status: ReplayAcceptanceStatus;
  aggregate: {
    sourceCases: number;
    discoveryCases: number;
    holdoutCases: number;
    candidateClusters: number;
    selectedClusterForRepro?: string;
    historicalFixedPatternHoldoutCases: number;
    portableReproFixtures: number;
  };
  gates: {
    extractionRedactionPassed: boolean;
    clusteringRedactionPassed: boolean;
    extractionNoRuntimeEffect: boolean;
    clusteringNoRuntimeEffect: boolean;
    productiveUseDisabled: boolean;
    holdoutIgnoredDuringClustering: boolean;
    currentAiHoldoutEvaluated: boolean;
    portableReproAvailable: boolean;
    fullAiTestGreen: boolean;
  };
  conclusions: string[];
  noRuntimeEffect: true;
  productiveUseAllowed: false;
};

export function buildReplayAcceptanceHarnessReport(
  extraction: ReplayDecisionCaseExtractionReport,
  clustering: ReplayDecisionCandidateClusterReport,
  options: ReplayAcceptanceHarnessOptions,
): ReplayAcceptanceHarnessReport {
  const historicalFixedPatternHoldoutCases = options.fixedPattern
    ? countHistoricalPatternHoldoutCases(extraction.cases, options.fixedPattern)
    : 0;
  const portableReproFixtures = options.portableReproFixtures ?? 0;
  const gates = {
    extractionRedactionPassed: extraction.redactionStatus === "passed",
    clusteringRedactionPassed: clustering.redactionStatus === "passed",
    extractionNoRuntimeEffect: extraction.noRuntimeEffect === true,
    clusteringNoRuntimeEffect: clustering.noRuntimeEffect === true,
    productiveUseDisabled:
      extraction.productiveUseAllowed === false &&
      clustering.productiveUseAllowed === false,
    holdoutIgnoredDuringClustering:
      clustering.aggregate.holdoutCasesIgnored ===
      extraction.aggregate.holdoutCases,
    currentAiHoldoutEvaluated: options.currentAiHoldoutEvaluated === true,
    portableReproAvailable: portableReproFixtures > 0,
    fullAiTestGreen: options.fullAiTestGreen === true,
  };
  const status = acceptanceStatus(gates);
  const report: ReplayAcceptanceHarnessReport = {
    schemaVersion: REPLAY_ACCEPTANCE_HARNESS_SCHEMA_VERSION,
    scope: "ai_replay_acceptance_hygiene",
    runId: safeText(options.runId),
    status,
    aggregate: {
      sourceCases: extraction.aggregate.cases,
      discoveryCases: extraction.aggregate.discoveryCases,
      holdoutCases: extraction.aggregate.holdoutCases,
      candidateClusters: clustering.aggregate.clusters,
      ...(clustering.selectedClusterForRepro
        ? { selectedClusterForRepro: clustering.selectedClusterForRepro }
        : {}),
      historicalFixedPatternHoldoutCases,
      portableReproFixtures,
    },
    gates,
    conclusions: conclusions(status, gates, historicalFixedPatternHoldoutCases),
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
  assertSemanticObjectSideSafe(report, "ReplayAcceptanceHarnessReport");
  return report;
}

export function renderReplayAcceptanceHarnessMarkdown(
  report: ReplayAcceptanceHarnessReport,
): string {
  return `# KI-Replay-Acceptance-Harness

Run-ID: \`${report.runId}\`

Status: \`${report.status}\`

## Aggregate

| Metrik | Wert |
| --- | ---: |
| Source-Cases | ${report.aggregate.sourceCases} |
| Discovery-Cases | ${report.aggregate.discoveryCases} |
| Holdout-Cases | ${report.aggregate.holdoutCases} |
| Candidate-Cluster | ${report.aggregate.candidateClusters} |
| Historische Holdout-Faelle des Fix-Musters | ${report.aggregate.historicalFixedPatternHoldoutCases} |
| Portable Repro-Fixtures | ${report.aggregate.portableReproFixtures} |

## Gates

${gateRows(report.gates)}

## Schlussfolgerungen

${report.conclusions.map((entry) => `- ${entry}`).join("\n")}
`;
}

function acceptanceStatus(
  gates: ReplayAcceptanceHarnessReport["gates"],
): ReplayAcceptanceStatus {
  const hardSafetyGates =
    gates.extractionRedactionPassed &&
    gates.clusteringRedactionPassed &&
    gates.extractionNoRuntimeEffect &&
    gates.clusteringNoRuntimeEffect &&
    gates.productiveUseDisabled &&
    gates.holdoutIgnoredDuringClustering;
  if (!hardSafetyGates) return "blocked";
  if (
    gates.currentAiHoldoutEvaluated &&
    gates.portableReproAvailable &&
    gates.fullAiTestGreen
  ) {
    return "accepted";
  }
  return "implemented_but_acceptance_incomplete";
}

function countHistoricalPatternHoldoutCases(
  cases: readonly ReplayDecisionCase[],
  pattern: NonNullable<ReplayAcceptanceHarnessOptions["fixedPattern"]>,
): number {
  return cases.filter((entry) => {
    if (entry.split !== "holdout") return false;
    const challenger = entry.observables.rankedAlternatives[0];
    return (
      entry.decision.selectedActionType === pattern.selectedActionType &&
      (entry.decision.planKind ?? "none") === pattern.selectedPlanKind &&
      challenger?.selectedActionType === pattern.challengerActionType &&
      (challenger.planKind ?? "none") === pattern.challengerPlanKind
    );
  }).length;
}

function conclusions(
  status: ReplayAcceptanceStatus,
  gates: ReplayAcceptanceHarnessReport["gates"],
  historicalFixedPatternHoldoutCases: number,
): string[] {
  const result = [
    `Historische Holdout-Pattern-Recurrence: ${historicalFixedPatternHoldoutCases}.`,
  ];
  if (!gates.currentAiHoldoutEvaluated) {
    result.push(
      "Die aktuelle KI wurde noch nicht auf denselben Holdout-DecisionPoints ausgefuehrt.",
    );
  }
  if (!gates.portableReproAvailable) {
    result.push(
      "Ein repository-seitig portables Same-State-Repro-Fixture fehlt noch.",
    );
  }
  if (!gates.fullAiTestGreen) {
    result.push("Der vollstaendige AI-Testlauf ist nicht als gruen belegt.");
  }
  result.push(
    status === "accepted"
      ? "Alle Acceptance-Gates sind belegt."
      : "Der korrekte Status ist Iteration implementiert, Abnahme unvollstaendig.",
  );
  return result;
}

function gateRows(gates: ReplayAcceptanceHarnessReport["gates"]): string {
  return Object.entries(gates)
    .map(([key, value]) => `| \`${key}\` | ${value ? "ja" : "nein"} |`)
    .join("\n")
    .replace(/^/, "| Gate | Erfuellt |\n| --- | --- |\n");
}

function safeText(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 80) || "latest";
}

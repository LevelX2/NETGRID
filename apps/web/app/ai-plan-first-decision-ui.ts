import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiPlanFirstDecisionDebug,
  sanitizeAiDecisionDebug,
} from "@netgrid/shared";

export function parseAiPlanFirstDecisionDebug(
  value: unknown,
): AiPlanFirstDecisionDebug | undefined {
  return sanitizeAiDecisionDebug({
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 0,
    planFirstDecision: value,
  })?.planFirstDecision;
}

export function aiPlanFirstPriorityLabel(
  priority: AiPlanFirstDecisionDebug["priority"],
): string {
  if (!priority) return "Engine-/Pflichtfenster";
  const labels: Record<
    NonNullable<AiPlanFirstDecisionDebug["priority"]>["effectiveClass"],
    string
  > = {
    P1: "P1 · Sieg sichern oder Niederlage abwenden",
    P2: "P2 · Akute Gefahr abwehren",
    P3: "P3 · Zeitkritische Chance nutzen",
    P4: "P4 · Hauptplan voranbringen",
    P5: "P5 · Gewählten Plan vorbereiten oder unterstützen",
    P6:
      priority.p6Contract === "temporary_bounded_liquidity_transition"
        ? "P6 · Eng befristeter Liquiditätsübergang"
        : priority.p6Contract === "turn_completion"
          ? "P6 · Strukturell belegter Zugabschluss"
          : "P6 · Enger endlicher Planvertrag",
  };
  return labels[priority.effectiveClass];
}

export function aiPlanFirstQuoteStatusLabel(
  status: AiPlanFirstDecisionDebug["engineQuoteEvidence"]["status"],
): string {
  if (status === "certified") return "Engine-zertifizierte Evidence vorhanden";
  if (status === "unknown") return "Unknown · keine Schätzung, fail-closed";
  return "Keine Quote-Evidence für diesen Step transportiert";
}

export function aiPlanFirstIntentFitLabel(
  intentFit:
    | NonNullable<AiPlanFirstDecisionDebug["priority"]>["intentFit"]
    | undefined,
): string {
  if (intentFit === "aligned") return "Intent-konform";
  if (intentFit === "tactical_override")
    return "Diagnostischer taktischer Override mit aktueller Evidence";
  if (intentFit === "none") return "Kein Intent-Fit";
  return "Nicht ausgewiesen";
}

export function aiPlanFirstDispositionSummary(
  decision: AiPlanFirstDecisionDebug,
): {
  explicitlyNonproductive: number;
  unknown: number;
} {
  return decision.dispositions.reduce(
    (summary, disposition) => {
      if (disposition.disposition === "assessment_unknown") {
        summary.unknown += 1;
      } else {
        summary.explicitlyNonproductive += 1;
      }
      return summary;
    },
    { explicitlyNonproductive: 0, unknown: 0 },
  );
}

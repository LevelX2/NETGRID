import { AlertTriangle, Brain, Check, ChevronDown, ChevronUp, Clipboard, Move, PanelTopClose } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { aiDecisionDebugHqHandRows } from "../../app/ai-decision-debug-ui";
import {
  aiTraceActionRows,
  aiTraceDebugGapNotes,
  aiTraceDoctrineRows,
  aiTraceMetaRows,
  aiTracePlanLabel,
  aiTraceScoreRows,
  aiTraceTitle,
  findForbiddenMaintenanceMarkers,
  safeStringList,
  type MaintenanceAiTraceDetail
} from "../../app/maintenance";
import { copyTextToClipboard } from "../../lib/clipboard";
import { clampOverlayPosition, type OverlayPositionPreference } from "../../lib/overlay-position";
import type { AiDecisionPreview } from "../../lib/client-api";

export type AiDecisionDebugOverlayStatus = "off" | "activating" | "waiting" | "live" | "error";

type RunOverlayPositionPreference = OverlayPositionPreference;
type AiDecisionDebugExportStatus = "idle" | "copied" | "copy_failed" | "blocked";

export function FloatingAiDecisionDebugOverlay({
  position,
  status,
  error,
  preview,
  previewError,
  trace,
  traceCount,
  onPosition,
  onClose
}: {
  position: RunOverlayPositionPreference;
  status: AiDecisionDebugOverlayStatus;
  error: string;
  preview: AiDecisionPreview | null;
  previewError: string;
  trace: MaintenanceAiTraceDetail | null;
  traceCount: number;
  onPosition(position: RunOverlayPositionPreference): void;
  onClose(): void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [exportStatus, setExportStatus] = useState<AiDecisionDebugExportStatus>("idle");

  useEffect(() => {
    if (position.kind !== "custom") return;
    const clampToViewport = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const next = clampOverlayPosition(position.xPercent, position.yPercent, window.innerWidth, window.innerHeight, rect.width, rect.height);
      if (next.kind !== "custom" || next.xPercent !== position.xPercent || next.yPercent !== position.yPercent) onPosition(next);
    };
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [position, onPosition]);
  useEffect(() => {
    if (exportStatus === "idle") return;
    const timeout = window.setTimeout(() => setExportStatus("idle"), 2400);
    return () => window.clearTimeout(timeout);
  }, [exportStatus]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const positionStyle: CSSProperties = position.kind === "custom" ? { left: `${position.xPercent}%`, top: `${position.yPercent}%`, transform: "none" } : {};
  const statusText = preview ? aiDecisionDebugPreviewHeaderStatusLabel(preview) : aiDecisionDebugStatusLabel(status, traceCount);
  const windowClassName = `aiDecisionDebugWindow ${collapsed ? "is-collapsed" : ""}`;
  const exportTrace = preview ? aiDecisionPreviewAsTrace(preview) : trace;
  const exportMode: "trace" | "preview" = preview ? "preview" : "trace";
  const exportButtonTitle = aiDecisionDebugHeaderExportTitle(exportStatus, Boolean(exportTrace));
  const copyAiDecisionDebugJson = async () => {
    if (!exportTrace) {
      setExportStatus("copy_failed");
      return;
    }
    try {
      const copied = await copyTextToClipboard(serializeAiDecisionDebugVisibleJsonExport(exportTrace, exportMode, new Date().toISOString()));
      setExportStatus(copied ? "copied" : "copy_failed");
    } catch {
      setExportStatus("blocked");
    }
  };

  const overlay = (
    <div ref={overlayRef} className={`aiDecisionDebugOverlay ${position.kind === "custom" ? "custom" : ""}`} style={positionStyle} data-testid="ai-decision-debug-overlay">
      <section className={windowClassName} aria-label="KI-Bewertung">
        <div
          className="aiDecisionDebugHead actionPanelFloatingDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title="KI-Bewertungsfenster verschieben"
          aria-label="KI-Bewertungsfenster verschieben"
        >
          <div className="aiDecisionDebugTitle">
            <Brain size={16} aria-hidden="true" />
            <strong>KI-Bewertung</strong>
            <span>{statusText}</span>
          </div>
          <div className="actionPanelFloatingControls">
            <Move size={14} aria-hidden="true" />
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={copyAiDecisionDebugJson}
              disabled={!exportTrace}
              aria-label={exportButtonTitle}
              title={exportButtonTitle}
            >
              {exportStatus === "copied" ? <Check size={14} /> : exportStatus === "blocked" || exportStatus === "copy_failed" ? <AlertTriangle size={14} /> : <Clipboard size={14} />}
            </button>
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setCollapsed((current) => !current)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "KI-Bewertungsfenster ausklappen" : "KI-Bewertungsfenster einklappen"}
              title={collapsed ? "Ausklappen" : "Einklappen"}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
              aria-label="KI-Bewertungsfenster ausblenden"
              title="Ausblenden"
            >
              <PanelTopClose size={14} />
            </button>
          </div>
        </div>
        <div className="aiDecisionDebugBody" hidden={collapsed}>
          <AiDecisionDebugOverlayBody status={status} error={error} preview={preview} previewError={previewError} trace={trace} />
        </div>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}

function AiDecisionDebugOverlayBody({
  status,
  error,
  preview,
  previewError,
  trace
}: {
  status: AiDecisionDebugOverlayStatus;
  error: string;
  preview: AiDecisionPreview | null;
  previewError: string;
  trace: MaintenanceAiTraceDetail | null;
}) {
  if (preview) {
    return <AiDecisionDebugTraceView trace={aiDecisionPreviewAsTrace(preview)} mode="preview" />;
  }
  if (previewError) {
    return <p className="aiDecisionDebugNotice error" role="alert">{previewError}</p>;
  }
  if (status === "error") {
    return <p className="aiDecisionDebugNotice error" role="alert">{error || "KI-Trace konnte nicht geladen werden."}</p>;
  }
  if (!trace) {
    return <p className="aiDecisionDebugNotice" role="status">{status === "activating" ? "KI-Trace wird aktiviert." : "Warte auf die nächste KI-Entscheidung."}</p>;
  }
  return <AiDecisionDebugTraceView trace={trace} />;
}

function aiDecisionPreviewAsTrace(preview: AiDecisionPreview): MaintenanceAiTraceDetail {
  const score = typeof preview.detail.score === "number" ? preview.detail.score : undefined;
  const confidence = typeof preview.detail.confidence === "number" ? preview.detail.confidence : preview.confidence;
  const planKind = typeof preview.detail.planKind === "string" ? preview.detail.planKind : undefined;
  return {
    traceId: `ai_preview_${preview.matchId}_${preview.stateVersion}`,
    matchId: preview.matchId,
    eventId: "preview",
    stateVersion: preview.stateVersion,
    matchVersion: preview.matchVersion,
    side: preview.side,
    turn: preview.stateVersion,
    decisionIndex: 0,
    selectedActionId: preview.actionId,
    selectedActionType: preview.actionType,
    ...(planKind ? { planKind } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
    createdAt: preview.generatedAt,
    schemaVersion: "ai-decision-preview-v1",
    meta: {},
    detail: {
      ...preview.detail,
      selectedActionId: preview.actionId,
      selectedActionType: preview.actionType,
      debugSelectionMatchesApplied: true,
      summary: preview.explanation
    }
  };
}

function aiDecisionPreviewTitle(trace: MaintenanceAiTraceDetail): string {
  const side = trace.side === "runner" ? "Runner" : "Korp";
  return `Nächster KI-Schritt · ${side} · ${aiDecisionTraceSelectedActionLabel(trace)}`;
}

function aiDecisionDebugPreviewHeaderStatusLabel(preview: AiDecisionPreview): string {
  const currentStep = aiDecisionDebugPlanLayer(preview.detail).summaryRows.find(([label]) => label === "Aktueller Schritt")?.[1];
  return preview.actionLabel || currentStep || String(preview.actionType);
}

function aiDecisionTraceSelectedActionLabel(trace: MaintenanceAiTraceDetail): string {
  const action = trace.detail.selectedActionType ?? trace.selectedActionType ?? "KI-Aktion";
  const label = aiDecisionDebugRecordList(trace.detail.actionAlternatives).find((entry) => entry.actionId === trace.selectedActionId)?.label;
  return String(label ?? action);
}

function AiDecisionDebugTraceView({ trace, mode = "trace" }: { trace: MaintenanceAiTraceDetail; mode?: "trace" | "preview" }) {
  const detail = trace.detail;
  const metaRows = aiDecisionDebugOverlayMetaRows(trace, mode);
  const actionRows = aiTraceActionRows(detail, mode === "preview" ? 32 : 8);
  const rankedAlternatives = aiDecisionDebugRecordList(detail.rankedAlternatives).slice(0, mode === "preview" ? 12 : 4);
  const scoreRows = aiTraceScoreRows(detail, 8);
  const doctrineRows = aiTraceDoctrineRows(detail);
  const notes = aiTraceDebugGapNotes(detail).slice(0, 3);
  const statusWarnings = [
    ...(detail.fallbackUsed === true ? ["Fallback genutzt"] : []),
    ...(detail.timeoutUsed === true ? ["Timeout genutzt"] : [])
  ];
  const visibleReasons = safeStringList(detail.visibleReasons, 5);
  const relevantExclusions = safeStringList(detail.whyNot, 5).filter(aiDecisionDebugIsCurrentWhyNot);
  const title = mode === "preview" ? aiDecisionPreviewTitle(trace) : aiTraceTitle(trace);
  return (
    <div className="aiDecisionDebugContent">
      <div className="aiDecisionDebugTraceHead">
        <strong>{title}</strong>
        <span>{new Date(trace.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </div>
      <AiDecisionDebugRows rows={metaRows} />
      <AiDecisionDebugChips title="Hinweise" items={statusWarnings} tone="warning" />
      <AiDecisionDebugChips title="Gründe" items={visibleReasons} />
      <AiDecisionDebugChips title="Ausschlüsse" items={relevantExclusions} />
      <AiDecisionDebugPlanLayer detail={detail} defaultOpen />
      {actionRows.length > 0 ? (
        <AiDecisionDebugCollapsibleSection title={mode === "preview" ? "LegalAction-Ebene" : "Action-Level-Ranking"} defaultOpen>
          <div className="aiDecisionDebugActions">
            {actionRows.map((action) => (
              <div className={`aiDecisionDebugAction ${action.selected ? "selected" : ""} ${action.excluded ? "excluded" : ""}`} key={action.key}>
                <div>
                  <strong>#{action.rank} {action.label}</strong>
                  <span>
                    {action.excluded
                      ? "Ausgeschlossen"
                      : `${action.selected ? (mode === "preview" ? "geplant" : "ausgeführt") : action.debugSelected ? "Debug-Auswahl" : "Alternative"} · Priorität ${action.priority}`}
                  </span>
                </div>
                <p>{action.reason}</p>
                {action.metrics.length > 0 ? <div className="aiDecisionDebugChipRow">{action.metrics.map((metric) => <span key={metric}>{metric}</span>)}</div> : null}
                {action.scoreRows.length > 0 ? (
                  <details className="aiDecisionDebugActionDetails">
                    <summary>Score-Faktoren</summary>
                    <AiDecisionDebugRows rows={action.scoreRows} />
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        </AiDecisionDebugCollapsibleSection>
      ) : null}
      {rankedAlternatives.length > 0 ? (
        <AiDecisionDebugCollapsibleSection title="Semantic-Action-Ranking" defaultOpen={false}>
          <div className="aiDecisionDebugCompactList">
            {rankedAlternatives.map((alternative, index) => (
              <div key={`${String(alternative.planId ?? alternative.planKind ?? "plan")}-${index}`}>
                <span>#{String(alternative.rank ?? index + 1)} {aiDecisionDebugSemanticRankingLabel(alternative)}</span>
                <strong>{typeof alternative.score === "number" ? alternative.score.toFixed(2) : "-"}</strong>
              </div>
            ))}
          </div>
        </AiDecisionDebugCollapsibleSection>
      ) : null}
      {scoreRows.length > 0 ? (
        <AiDecisionDebugCollapsibleSection title="Score-Komponenten" defaultOpen>
          <AiDecisionDebugRows rows={scoreRows} />
        </AiDecisionDebugCollapsibleSection>
      ) : null}
      {doctrineRows.length > 0 ? (
        <AiDecisionDebugCollapsibleSection title="Deck-Doctrine" defaultOpen={false}>
          <AiDecisionDebugRows rows={doctrineRows} />
        </AiDecisionDebugCollapsibleSection>
      ) : null}
      <AiDecisionDebugMemory detail={detail} />
      <AiDecisionDebugPrivateHand detail={detail} />
      <AiDecisionDebugChips title="Folgepunkte" items={notes} tone="muted" />
    </div>
  );
}

function serializeAiDecisionDebugVisibleJsonExport(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
  exportedAt: string,
): string {
  const detail = trace.detail;
  const actionRows = aiTraceActionRows(detail, mode === "preview" ? 32 : 8);
  const rankedAlternatives = aiDecisionDebugRecordList(detail.rankedAlternatives).slice(0, mode === "preview" ? 12 : 4);
  const planLayer = aiDecisionDebugPlanLayer(detail);
  const memory = aiDecisionDebugMemoryExport(detail);
  const privateHand = aiDecisionDebugPrivateHandExport(detail);
  const payload = {
    schemaVersion: "netgrid-ai-decision-display-export-v1",
    redaction: "client-visible-ai-decision-debug-projection",
    exportedAt,
    mode,
    source: {
      traceId: trace.traceId,
      matchId: trace.matchId,
      eventId: trace.eventId,
      stateVersion: trace.stateVersion,
      matchVersion: trace.matchVersion,
      side: trace.side,
      turn: trace.turn,
      decisionIndex: trace.decisionIndex,
      selectedActionId: trace.selectedActionId,
      selectedActionType: trace.selectedActionType,
      planKind: trace.planKind,
      score: trace.score,
      confidence: trace.confidence,
      createdAt: trace.createdAt,
      sourceSchemaVersion: trace.schemaVersion,
    },
    display: {
      title: mode === "preview" ? aiDecisionPreviewTitle(trace) : aiTraceTitle(trace),
      metaRows: aiDecisionDebugOverlayMetaRows(trace, mode),
      warnings: [
        ...(detail.fallbackUsed === true ? ["Fallback genutzt"] : []),
        ...(detail.timeoutUsed === true ? ["Timeout genutzt"] : []),
      ],
      reasons: safeStringList(detail.visibleReasons, 5),
      exclusions: safeStringList(detail.whyNot, 5).filter(aiDecisionDebugIsCurrentWhyNot),
      planLayer: {
        summaryRows: planLayer.summaryRows,
        plans: planLayer.entries.map(aiDecisionDebugPlanExport),
        rawDiagnostic: planLayer.fallbackItems,
      },
      actionRanking: actionRows.map((action) => ({
        rank: action.rank,
        label: action.label,
        selected: action.selected,
        debugSelected: action.debugSelected,
        excluded: action.excluded,
        source: action.source,
        priority: action.priority,
        metrics: action.metrics,
        reason: action.reason,
        scoreRows: action.scoreRows,
      })),
      semanticActionRanking: rankedAlternatives.map((alternative, index) => ({
        rank: typeof alternative.rank === "number" ? alternative.rank : index + 1,
        label: aiDecisionDebugSemanticRankingLabel(alternative),
        score: typeof alternative.score === "number" ? alternative.score : undefined,
      })),
      scoreRows: aiTraceScoreRows(detail, 8),
      doctrineRows: aiTraceDoctrineRows(detail),
      memory,
      privateHand,
      followUpNotes: aiTraceDebugGapNotes(detail).slice(0, 3),
    },
  };
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  if (findForbiddenMaintenanceMarkers(output).length > 0) throw new Error("ai_decision_debug_export_redaction_failed");
  return output;
}

function aiDecisionDebugPlanExport(plan: AiDecisionDebugPlanEntry) {
  const titleUsesTarget = aiDecisionDebugPlanTitleUsesTarget(plan);
  return {
    rank: plan.rank,
    title: aiDecisionDebugPlanTitle(plan),
    secondary: aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget),
    selected: plan.selected,
    status: plan.status ? aiDecisionDebugPlanStatusLabel(plan.status) : undefined,
    step: plan.step ? aiDecisionDebugPlanStepLabel(plan.step, plan) : undefined,
    blockers: plan.blockers.map(aiDecisionDebugPlanBlockerLabel),
    capabilities: plan.capabilities.map(aiDecisionDebugPlanCapabilityLabel),
    unblocks: plan.unblocks.map(aiDecisionDebugPlanReferenceLabel),
    scores: plan.scores,
  };
}

function aiDecisionDebugMemoryExport(detail: Record<string, unknown>) {
  return {
    rows: aiDecisionDebugMemoryRows(detail),
    facts: aiDecisionDebugMemoryChipList(detail.facts, 6),
    hypotheses: aiDecisionDebugMemoryHypothesisChipList(detail, 6),
    uncertainty: aiDecisionDebugMemoryChipList(detail.beliefUncertainty, 4),
    invalidations: aiDecisionDebugMemoryChipList(detail.invalidations, 5),
  };
}

function aiDecisionDebugHeaderExportTitle(status: AiDecisionDebugExportStatus, available: boolean): string {
  if (!available) return "Noch keine KI-Bewertung für JSON-Export verfügbar";
  switch (status) {
    case "idle":
      return "KI-Bewertung als JSON kopieren";
    case "copied":
      return "JSON kopiert";
    case "copy_failed":
      return "Kopieren fehlgeschlagen";
    case "blocked":
      return "Export durch Redaktionsprüfung blockiert";
  }
}

const AI_DECISION_DEBUG_OVERLAY_META_LABELS = new Set([
  "Entscheidung",
  "Ausgeführt",
  "Debug-Auswahl",
  "Debug-Kopplung",
  "Plan",
  "Score"
]);

function aiDecisionDebugOverlayMetaRows(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
): Array<[string, string]> {
  const hiddenPreviewLabels = new Set(["Entscheidung", "Ausgeführt"]);
  return aiTraceMetaRows(trace)
    .filter(([label]) => AI_DECISION_DEBUG_OVERLAY_META_LABELS.has(label))
    .filter(([label]) => mode !== "preview" || !hiddenPreviewLabels.has(label));
}

function aiDecisionDebugIsCurrentWhyNot(item: string): boolean {
  return !item.startsWith("legacy_reference_") && item !== "semantic_runtime_actual_differs_from_legacy_debug";
}

type AiDecisionDebugPlanEntry = {
  rank: number;
  id: string;
  type: string;
  target?: string;
  targetLabel?: string;
  targetRole?: string;
  cardType?: string;
  priority?: number;
  status?: string;
  step?: string;
  selected: boolean;
  blockers: string[];
  capabilities: string[];
  unblocks: string[];
  scores: Array<[string, string]>;
};

const AI_DECISION_DEBUG_TACTICAL_PLAN_ITEM_LIMIT = Number.MAX_SAFE_INTEGER;

function aiDecisionDebugSemanticRankingLabel(alternative: Record<string, unknown>): string {
  const actionLabel = aiDecisionDebugActionTypeLabel(
    typeof alternative.selectedActionType === "string" ? alternative.selectedActionType : undefined,
  );
  const planLabel = typeof alternative.planKind === "string" ? aiTracePlanLabel(alternative.planKind) : "";
  if (actionLabel && planLabel && actionLabel !== planLabel) return `${actionLabel} · ${planLabel}`;
  return actionLabel || planLabel || "Plan";
}

function aiDecisionDebugActionTypeLabel(actionType: string | undefined): string {
  const labels: Record<string, string> = {
    access_card: "Karte accessen",
    advance_card: "Karte advancen",
    break_subroutine: "Subroutine brechen",
    continue_run: "Run fortsetzen",
    decline_rez: "Nicht rezzen",
    decline_trash: "Nicht trashen",
    draw_card: "Karte ziehen",
    end_turn: "Zug beenden",
    gain_credit: "1 Credit nehmen",
    install_card: "Karte installieren",
    jack_out: "Ausloggen",
    mandatory_draw: "Pflichtkarte ziehen",
    play_event: "Event spielen",
    play_operation: "Operation spielen",
    pump_breaker: "Breaker pumpen",
    remove_tag: "Tag entfernen",
    rez_ice: "ICE rezzen",
    resolve_choice: "Auswahl treffen",
    score_agenda: "Agenda punkten",
    start_run: "Run starten",
    steal_agenda: "Agenda stehlen",
    trash_accessed_card: "Karte trashen",
    trash_resource: "Resource trashen",
    trigger_ability: "Fähigkeit nutzen",
  };
  return actionType ? labels[actionType] ?? actionType : "";
}

function AiDecisionDebugPrivateHand({ detail }: { detail: Record<string, unknown> }) {
  const privateHand = aiDecisionDebugPrivateHandExport(detail);
  if (privateHand.cards.length === 0) {
    const rows = privateHand.rows;
    if (rows.length === 0) return null;
    return (
      <AiDecisionDebugCollapsibleSection title="KI-Privathand" defaultOpen={false}>
        <AiDecisionDebugRows rows={rows} />
      </AiDecisionDebugCollapsibleSection>
    );
  }
  return (
    <AiDecisionDebugCollapsibleSection title="KI-Privathand" defaultOpen={false}>
      <AiDecisionDebugRows rows={privateHand.rows} />
      <div className="aiDecisionDebugActions">
        {privateHand.cards.map((card) => {
          return (
            <div className="aiDecisionDebugAction" key={card.key}>
              <div>
                <strong>#{card.rank} {card.title}</strong>
                <span>{card.meta}</span>
              </div>
              {card.rulesText ? <p><strong>Regeltext:</strong> {card.rulesText}</p> : null}
              {card.legalActions.length > 0 ? (
                <p>{card.legalActions.join(" · ")}</p>
              ) : (
                <p>Keine aktuelle LegalAction aus dieser Handkarte.</p>
              )}
            </div>
          );
        })}
      </div>
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugPrivateHandExport(detail: Record<string, unknown>): {
  rows: Array<[string, string]>;
  cards: Array<{
    key: string;
    rank: number;
    title: string;
    meta: string;
    rulesText: string;
    legalActions: string[];
  }>;
} {
  const preview = aiDecisionDebugRecord(detail.aiPrivateHandPreview);
  if (!preview) return { rows: aiDecisionDebugPrivateHandMissingRows(detail), cards: [] };
  const cards = aiDecisionDebugRecordList(preview.cards);
  const rows: Array<[string, string]> = [
    ["Seite", preview.side === "runner" ? "Runner" : preview.side === "corp" ? "Korp" : String(preview.side ?? "-")],
    ["Credits", String(preview.credits ?? "-")],
    ["Handkarten", String(preview.handCount ?? cards.length)],
    ["Sichtbarkeit", preview.visibility === "preview_only_not_persisted" ? "nur Vorschau, nicht gespeichert" : String(preview.visibility ?? "-")]
  ];
  return {
    rows,
    cards: cards.map((card, index) => {
      const title = typeof card.title === "string" ? card.title : typeof card.definitionId === "string" ? card.definitionId : `Karte ${index + 1}`;
      const type = typeof card.type === "string" ? card.type : "unknown";
      const cost = typeof card.playCost === "number" ? `${card.playCost} Kosten` : "Kosten ?";
      const availability = aiDecisionDebugPrivateHandAvailabilityLabel(card.availability, card.missingCredits);
      const legalActions = aiDecisionDebugRecordList(card.legalActions).map((action) => {
        const label = typeof action.label === "string" ? action.label : aiDecisionDebugActionTypeLabel(typeof action.actionType === "string" ? action.actionType : undefined);
        const creditCost = typeof action.creditCost === "number" ? ` (${action.creditCost} Credits)` : "";
        return `${label}${creditCost}`;
      });
      return {
        key: `${String(card.instanceId ?? title)}:${index}`,
        rank: index + 1,
        title,
        meta: [type, cost, availability].join(" · "),
        rulesText: typeof card.rulesText === "string" ? card.rulesText : "",
        legalActions
      };
    })
  };
}

function aiDecisionDebugPrivateHandMissingRows(detail: Record<string, unknown>): Array<[string, string]> {
  const memoryItems = aiDecisionDebugDetailSectionItems(detail, "semantic_memory", 64);
  const ownHandVisibility = aiDecisionDebugTagValue(memoryItems, "own_hand_content_visibility");
  if (ownHandVisibility !== "preview_private_section") return [];
  const ownHandCount = aiDecisionDebugTagValue(memoryItems, "own_hand_count");
  const rows: Array<[string, string]> = [
    ["Status", "in diesem gespeicherten Trace nicht enthalten"],
    ["Sichtbarkeit", "nur in der aktuellen Nächster-Schritt-Vorschau, nicht in Logs oder Replays"]
  ];
  if (ownHandCount) rows.unshift(["Handkarten", `${ownHandCount} Karten`]);
  return rows;
}

function aiDecisionDebugPrivateHandAvailabilityLabel(availability: unknown, missingCredits: unknown): string {
  if (availability === "legal_now") return "jetzt legal";
  if (availability === "missing_credits") return typeof missingCredits === "number" ? `${missingCredits} Credits fehlen` : "Credits fehlen";
  if (availability === "not_legal_now") return "jetzt nicht legal";
  return String(availability ?? "unbekannt");
}

function AiDecisionDebugPlanLayer({ detail, defaultOpen = true }: { detail: Record<string, unknown>; defaultOpen?: boolean }) {
  const planLayer = aiDecisionDebugPlanLayer(detail);
  if (planLayer.summaryRows.length === 0 && planLayer.entries.length === 0 && planLayer.fallbackItems.length === 0) return null;
  return (
    <AiDecisionDebugCollapsibleSection title="Planebene" defaultOpen={defaultOpen}>
      {planLayer.summaryRows.length > 0 ? <AiDecisionDebugRows rows={planLayer.summaryRows} /> : null}
      {planLayer.entries.length > 0 ? (
        <div className="aiDecisionDebugPlanList">
          {planLayer.entries.map((plan) => {
            const titleUsesTarget = aiDecisionDebugPlanTitleUsesTarget(plan);
            return (
              <div className={`aiDecisionDebugPlanCard ${plan.selected ? "selected" : ""} ${plan.status === "blocked" ? "blocked" : ""}`} key={`${plan.rank}:${plan.id}`}>
                <div>
                  <strong>#{plan.rank} {aiDecisionDebugPlanTitle(plan)}</strong>
                  <span>
                    {[
                      aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget),
                      plan.priority !== undefined ? `Priorität ${plan.priority.toFixed(0)}` : undefined,
                      aiDecisionDebugPlanStatusLabel(plan.status)
                    ].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {plan.step ? <p>Nächster Schritt: {aiDecisionDebugPlanStepLabel(plan.step, plan)}</p> : null}
                {plan.unblocks.length > 0 ? (
                  <p>Bereitet vor: {plan.unblocks.map((unblockedPlan) => aiDecisionDebugPlanReferenceLabel(unblockedPlan)).join(", ")}</p>
                ) : null}
                {plan.blockers.length > 0 ? (
                  <div className="aiDecisionDebugChipRow">
                    {plan.blockers.map((blocker) => <span key={blocker}>Blocker: {aiDecisionDebugPlanBlockerLabel(blocker)}</span>)}
                  </div>
                ) : null}
                {plan.capabilities.length > 0 ? (
                  <div className="aiDecisionDebugChipRow muted">
                    {plan.capabilities.slice(0, 4).map((capability) => <span key={capability}>{aiDecisionDebugPlanCapabilityLabel(capability)}</span>)}
                  </div>
                ) : null}
                {plan.scores.length > 0 ? (
                  <details className="aiDecisionDebugActionDetails">
                    <summary>Plan-Score</summary>
                    <AiDecisionDebugRows rows={plan.scores} />
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {planLayer.fallbackItems.length > 0 ? <AiDecisionDebugChips title="Rohdiagnose" items={planLayer.fallbackItems} tone="muted" /> : null}
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugPlanLayer(detail: Record<string, unknown>): {
  summaryRows: Array<[string, string]>;
  entries: AiDecisionDebugPlanEntry[];
  fallbackItems: string[];
} {
  const longTermPlan = safeStringList(detail.longTermPlan, 12);
  const tacticalPlanItems = aiDecisionDebugDetailSectionItems(detail, "tactical_plan", AI_DECISION_DEBUG_TACTICAL_PLAN_ITEM_LIMIT);
  const items = uniqueDisplayStrings([...longTermPlan, ...tacticalPlanItems]);
  const entries = items
    .map(aiDecisionDebugParsePlanEntry)
    .filter((entry): entry is AiDecisionDebugPlanEntry => Boolean(entry))
    .sort((left, right) => left.rank - right.rank);
  const selectedEntry = entries.find((entry) => entry.selected);
  const selectedType = selectedEntry?.type ?? aiDecisionDebugTagValue(items, "selected_plan_type") ?? aiDecisionDebugTagValue(items, "tactical_plan_type");
  const selectedStatus = selectedEntry?.status ?? aiDecisionDebugTagValue(items, "selected_plan_status");
  const selectedStep = selectedEntry?.step ?? aiDecisionDebugTagValue(items, "selected_step_kind") ?? aiDecisionDebugTagValue(items, "tactical_step");
  const selectedPriority = selectedEntry?.priority !== undefined ? ` · Priorität ${selectedEntry.priority.toFixed(0)}` : "";
  const previousType = aiDecisionDebugTagValue(items, "previous_plan_type");
  const previousStatus = aiDecisionDebugTagValue(items, "previous_plan_status");
  const previousTtl = aiDecisionDebugTagValue(items, "previous_plan_ttl");
  const planProgression = aiDecisionDebugTagValue(items, "plan_progression_reason");
  const whyAbandoned = aiDecisionDebugTagValue(items, "why_plan_abandoned");
  const mapping = aiDecisionDebugTagValue(items, "selected_step_mapping");
  const mappedActions = aiDecisionDebugTagValue(items, "mapped_legal_actions");
  const alternativeCount = aiDecisionDebugTagValue(items, "plan_alternative_count");
  const blockedCount = aiDecisionDebugTagValue(items, "blocked_plan_count");
  const summaryRows: Array<[string, string]> = [];
  if (selectedType) {
    const selectedPlanLabel = selectedEntry ? aiDecisionDebugPlanTitle(selectedEntry) : aiTracePlanLabel(selectedType);
    summaryRows.push([
      "Ausgewählter Plan",
      [
        selectedPlanLabel,
        selectedEntry
          ? aiDecisionDebugPlanSecondaryLabel(selectedEntry, aiDecisionDebugPlanTitleUsesTarget(selectedEntry))
          : undefined,
        selectedStatus ? aiDecisionDebugPlanStatusLabel(selectedStatus) : undefined
      ].filter(Boolean).join(" · ") + selectedPriority
    ]);
  }
  if (selectedStep) summaryRows.push(["Aktueller Schritt", aiDecisionDebugPlanStepLabel(selectedStep, selectedEntry)]);
  if (mapping || mappedActions) {
    const actionCount = mappedActions ? mappedActions.split("|").filter(Boolean).length : 0;
    summaryRows.push(["Step-Mapping", `${mapping ? aiDecisionDebugPlanMappingLabel(mapping) : "-"}${actionCount > 0 ? ` · ${actionCount} LegalAction${actionCount === 1 ? "" : "s"}` : ""}`]);
  }
  if (previousType && previousType !== "none") {
    summaryRows.push([
      "Vorheriger Plan",
      [
        aiTracePlanLabel(previousType),
        previousStatus ? aiDecisionDebugPlanStatusLabel(previousStatus) : undefined,
        previousTtl ? `TTL ${previousTtl}` : undefined
      ].filter(Boolean).join(" · ")
    ]);
  }
  if (planProgression) summaryRows.push(["Fortschreibung", aiDecisionDebugPlanProgressionLabel(planProgression)]);
  if (whyAbandoned) summaryRows.push(["Verworfen", whyAbandoned]);
  if (alternativeCount || blockedCount) summaryRows.push(["Plan-Kandidaten", `${alternativeCount ?? entries.length} bewertet · ${blockedCount ?? entries.filter((entry) => entry.status === "blocked").length} blockiert (aktuell nicht ausführbar)`]);
  const fallbackItems = entries.length === 0
    ? items.filter((item) => !item.startsWith("plan_rank|")).slice(0, 16)
    : [];
  return { summaryRows, entries, fallbackItems };
}

function aiDecisionDebugParsePlanEntry(item: string): AiDecisionDebugPlanEntry | undefined {
  if (!item.startsWith("plan_rank|")) return undefined;
  const fields = new Map<string, string>();
  for (const part of item.split("|").slice(1)) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    fields.set(part.slice(0, separator), part.slice(separator + 1));
  }
  const rank = aiDecisionDebugNumber(fields.get("rank")) ?? 0;
  const id = fields.get("id") ?? `plan-${rank}`;
  const type = fields.get("type") ?? "Plan";
  const target = fields.get("target") || undefined;
  const targetLabel = fields.get("target_label") || undefined;
  const targetRole = fields.get("target_role") || undefined;
  const cardType = fields.get("card_type") || undefined;
  const priority = aiDecisionDebugNumber(fields.get("priority"));
  const status = fields.get("status") || undefined;
  const step = fields.get("step") || undefined;
  return {
    rank,
    id,
    type,
    ...(target ? { target } : {}),
    ...(targetLabel ? { targetLabel } : {}),
    ...(targetRole ? { targetRole } : {}),
    ...(cardType ? { cardType } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(status ? { status } : {}),
    ...(step ? { step } : {}),
    selected: fields.get("selected") === "true",
    blockers: aiDecisionDebugCsv(fields.get("blockers")),
    capabilities: aiDecisionDebugCsv(fields.get("capabilities")),
    unblocks: aiDecisionDebugCsv(fields.get("unblocks")),
    scores: aiDecisionDebugScoreCsv(fields.get("scores"))
  };
}

function aiDecisionDebugTagValue(items: string[], key: string): string | undefined {
  const prefix = `${key}:`;
  const item = items.find((candidate) => candidate.startsWith(prefix));
  return item ? item.slice(prefix.length) : undefined;
}

function aiDecisionDebugNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function uniqueDisplayStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function aiDecisionDebugCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function aiDecisionDebugScoreCsv(value: string | undefined): Array<[string, string]> {
  if (!value) return [];
  return value.split(",").map((entry): [string, string] | undefined => {
    const separator = entry.lastIndexOf(":");
    if (separator <= 0) return undefined;
    return [entry.slice(0, separator), entry.slice(separator + 1)];
  }).filter((entry): entry is [string, string] => Boolean(entry));
}

function aiDecisionDebugPlanTitle(plan: AiDecisionDebugPlanEntry): string {
  if (plan.type === "runner.obtain_breaker_coverage") {
    const targetRun = aiDecisionDebugPlanTargetRunNoun(plan);
    const coverage = plan.capabilities[0]
      ? aiDecisionDebugPlanCapabilityLabel(plan.capabilities[0])
      : "Breaker-Abdeckung";
    return targetRun ? `${targetRun} vorbereiten: ${coverage}` : `Breaker-Abdeckung vorbereiten: ${coverage}`;
  }
  if (plan.type === "runner.develop_hand_card") {
    const cardLabel = aiDecisionDebugPlanTargetLabel(plan);
    return cardLabel ? `Handkarte entwickeln: ${cardLabel}` : aiTracePlanLabel(plan.type);
  }
  const targetRun = aiDecisionDebugPlanTargetRunAction(plan);
  if (
    targetRun &&
    (plan.type === "runner.contest_remote" ||
      plan.type === "runner.opportunistic_central_run")
  ) {
    return targetRun;
  }
  return aiTracePlanLabel(plan.type);
}

function aiDecisionDebugPlanTitleUsesTarget(plan: AiDecisionDebugPlanEntry): boolean {
  return Boolean(
    ((plan.type === "runner.contest_remote" ||
      plan.type === "runner.opportunistic_central_run") &&
      aiDecisionDebugPlanTargetRunAction(plan)) ||
    (plan.type === "runner.obtain_breaker_coverage" &&
      aiDecisionDebugPlanTargetRunNoun(plan)) ||
    (plan.type === "runner.develop_hand_card" &&
      Boolean(aiDecisionDebugPlanTargetLabel(plan))),
  );
}

function aiDecisionDebugPlanSecondaryLabel(
  plan: AiDecisionDebugPlanEntry,
  titleUsesTarget: boolean,
): string | undefined {
  if (plan.type === "runner.develop_hand_card") {
    return aiDecisionDebugPlanTargetRoleLabel(plan) || undefined;
  }
  return titleUsesTarget ? undefined : aiDecisionDebugPlanTargetLabel(plan) || undefined;
}

function aiDecisionDebugPlanReferenceLabel(planId: string): string {
  const separator = planId.indexOf(":");
  const type = separator >= 0 ? planId.slice(0, separator) : planId;
  const targetId = separator >= 0 ? planId.slice(separator + 1) : "";
  const target = targetId ? `server:${targetId}` : undefined;
  return aiDecisionDebugPlanTitle({
    rank: 0,
    id: planId,
    type,
    ...(target ? { target } : {}),
    selected: false,
    blockers: [],
    capabilities: [],
    unblocks: [],
    scores: []
  });
}

function aiDecisionDebugPlanTargetRunAction(plan: AiDecisionDebugPlanEntry | undefined): string {
  const targetLabel = aiDecisionDebugPlanServerTargetLabel(plan);
  if (!targetLabel) return "";
  return `Run auf ${targetLabel} prüfen`;
}

function aiDecisionDebugPlanTargetRunNoun(plan: AiDecisionDebugPlanEntry | undefined): string {
  const targetLabel = aiDecisionDebugPlanServerTargetLabel(plan);
  if (!targetLabel) return "";
  return `${targetLabel}-Run`;
}

function aiDecisionDebugPlanServerTargetLabel(plan: AiDecisionDebugPlanEntry | undefined): string {
  if (!plan?.target) return "";
  const [kind, id = plan.target] = plan.target.split(":");
  if (kind !== "server") return "";
  if (id === "hq") return "HQ";
  if (id === "rd") return "R&D";
  if (id === "archives") return "Archive";
  if (id.startsWith("remote_")) return `Remote ${id.slice("remote_".length)}`;
  return id;
}

function aiDecisionDebugPlanTargetLabel(plan: AiDecisionDebugPlanEntry): string {
  if (plan.targetLabel) {
    return plan.target?.startsWith("card:")
      ? plan.targetLabel
      : aiDecisionDebugPlanTargetValueLabel(plan.targetLabel);
  }
  if (!plan.target) return "";
  const [kind, id = plan.target] = plan.target.split(":");
  if (kind === "server") return aiDecisionDebugPlanServerTargetLabel(plan);
  if (kind === "capability" && id === "runner_credit_base") return "Credits";
  if (kind === "bank" && id === "runner_credit_bank") return "Credit-Bank";
  return id;
}

function aiDecisionDebugPlanTargetRoleLabel(plan: AiDecisionDebugPlanEntry): string {
  return plan.targetRole ? aiDecisionDebugPlanTargetValueLabel(plan.targetRole) : "";
}

function aiDecisionDebugPlanTargetValueLabel(value: string): string {
  const labels: Record<string, string> = {
    access_payoff: "Zugriffswert",
    economy: "Wirtschaft",
    breaker: "Breaker",
    memory: "Speicher",
    protection: "Schutz",
    tempo: "Tempo"
  };
  return labels[value] ?? value;
}

function aiDecisionDebugPlanStatusLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    abandoned: "verworfen",
    active: "aktiv",
    blocked: "blockiert",
    expired: "abgelaufen",
    failed: "fehlgeschlagen",
    progressing: "wird fortgeführt",
    proposed: "Kandidat",
    satisfied: "erfüllt"
  };
  return value ? labels[value] ?? value : "-";
}

function aiDecisionDebugPlanStepLabel(value: string, plan?: AiDecisionDebugPlanEntry): string {
  const runTarget = aiDecisionDebugPlanTargetRunAction(plan);
  const coverage = plan?.capabilities[0]
    ? aiDecisionDebugPlanCapabilityLabel(plan.capabilities[0])
    : "";
  const handCard = plan?.type === "runner.develop_hand_card"
    ? aiDecisionDebugPlanTargetLabel(plan)
    : "";
  const developmentVerb = aiDecisionDebugDevelopmentCardVerb(plan);
  const labels: Record<string, string> = {
    advance_score_card: "Score-Karte advancen",
    build_bank_counter: "Credit-Bank aufbauen",
    cash_out_bank: "Credit-Bank auszahlen",
    draw_for_answer: coverage ? `Karten ziehen, um ${coverage} zu finden` : "Karten ziehen, um Antwort zu finden",
    gain_credits: "Credits nehmen",
    install_development_card: handCard ? `${handCard} ${developmentVerb}` : `Handkarte ${developmentVerb}`,
    install_breaker: coverage ? `${coverage} installieren` : "Breaker installieren",
    probe_central: "Zentralserver-Run prüfen",
    rez_outer_ice: "äußeres ICE rezzen",
    run_target: runTarget || "Run auf Zielserver prüfen",
    score_agenda: "Agenda punkten",
    search_for_answer: coverage ? `Suchkarte für ${coverage} nutzen` : "Such-/Antwortkarte nutzen",
    setup_search_engine: coverage ? `Such-Engine für ${coverage} installieren` : "Such-Engine installieren"
  };
  if (value === "probe_central" && runTarget) return runTarget;
  return labels[value] ?? value;
}

function aiDecisionDebugDevelopmentCardVerb(plan?: AiDecisionDebugPlanEntry): "installieren" | "spielen" | "nutzen" {
  const cardType = plan?.cardType?.toLowerCase();
  if (cardType === "event" || cardType === "prep") return "spielen";
  if (cardType === "operation") return "spielen";
  return "installieren";
}

function aiDecisionDebugPlanMappingLabel(value: string): string {
  const labels: Record<string, string> = {
    blocked_missing_capability: "blockiert: Voraussetzung fehlt",
    blocked_no_legal_action: "blockiert: keine LegalAction",
    blocked_timing: "blockiert: falsches Timing",
    blocked_too_expensive: "blockiert: zu teuer",
    defer_to_reactive_window: "reaktives Fenster",
    matched: "gemappt",
    unmapped: "nicht gemappt"
  };
  return labels[value] ?? value;
}

function aiDecisionDebugPlanProgressionLabel(value: string): string {
  const labels: Record<string, string> = {
    continued_previous_plan: "vorheriger Plan fortgesetzt",
    previous_central_probe_ttl_expired: "Zentralserver-Probe abgelaufen, zurück zum Blockerplan",
    previous_plan_considered: "vorheriger Plan wurde berücksichtigt",
    selected_new_plan: "neuer Plan gewählt"
  };
  return labels[value] ?? value;
}

function aiDecisionDebugPlanBlockerLabel(value: string): string {
  const labels: Record<string, string> = {
    breaker_present_but_mu_blocked: "Speicher für Breaker fehlt",
    breaker_present_but_unaffordable: "Breaker zu teuer",
    coverage_not_in_deck: "passende Breaker-Abdeckung nicht im Deck",
    missing_breaker_coverage: "Breaker-Abdeckung fehlt",
    missing_code_gate_coverage: "Code-Gate-Breaker fehlt",
    missing_credits: "Credits fehlen",
    missing_legal_action: "keine passende LegalAction",
    missing_mu: "Speicher fehlt",
    missing_remote_protection: "Remote-Schutz fehlt",
    missing_sentry_coverage: "Sentry-Breaker fehlt",
    missing_trace_coverage: "Trace-Breaker fehlt",
    missing_wall_coverage: "Wall-Breaker fehlt",
    reactive_window: "reaktives Fenster",
    search_target_not_available: "Suchziel nicht direkt verfügbar",
    target_unreachable: "Ziel nicht erreichbar",
    timing_window_unavailable: "Timingfenster fehlt"
  };
  return labels[value] ?? value;
}

function aiDecisionDebugPlanCapabilityLabel(value: string): string {
  const labels: Record<string, string> = {
    agenda_score_window: "Score-Fenster",
    bank_capacity: "Bank-Kapazität",
    bank_payout: "Bank-Auszahlung",
    breaker_ap: "AP-Breaker",
    breaker_code_gate: "Code-Gate-Breaker",
    breaker_coverage: "Breaker-Abdeckung",
    breaker_sentry: "Sentry-Breaker",
    breaker_trace: "Trace-Breaker",
    breaker_universal: "Universal-Breaker",
    breaker_wall: "Wall-Breaker",
    card_draw: "Karten ziehen",
    card_search: "Kartensuche",
    credits: "Credits",
    remote_protection: "Remote-Schutz",
    rez_window: "Rez-Fenster",
    server_access: "Serverzugriff"
  };
  return labels[value] ?? value;
}

function AiDecisionDebugCollapsibleSection({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="aiDecisionDebugSection aiDecisionDebugCollapsible" open={defaultOpen}>
      <summary><strong>{title}</strong></summary>
      {children}
    </details>
  );
}

function AiDecisionDebugCollapsibleChips({
  title,
  items,
  tone = "default",
  defaultOpen = true
}: {
  title: string;
  items: string[];
  tone?: "default" | "warning" | "muted";
  defaultOpen?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <AiDecisionDebugCollapsibleSection title={title} defaultOpen={defaultOpen}>
      <div className={`aiDecisionDebugSection ${tone}`}>
        <div className="aiDecisionDebugChipRow">
          {items.map((item, index) => <span key={`${item}:${index}`}>{item}</span>)}
        </div>
      </div>
    </AiDecisionDebugCollapsibleSection>
  );
}

function AiDecisionDebugRows({ rows }: { rows: Array<[string, string]> }) {
  if (rows.length === 0) return null;
  return (
    <div className="aiDecisionDebugRows">
      {rows.map(([label, value]) => (
        <div key={`${label}:${value}`}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function AiDecisionDebugMemory({ detail }: { detail: Record<string, unknown> }) {
  const rows = aiDecisionDebugMemoryRows(detail);
  const facts = aiDecisionDebugMemoryChipList(detail.facts, 6);
  const hypotheses = aiDecisionDebugMemoryHypothesisChipList(detail, 6);
  const uncertainty = aiDecisionDebugMemoryChipList(detail.beliefUncertainty, 4);
  const invalidations = aiDecisionDebugMemoryChipList(detail.invalidations, 5);
  if (rows.length === 0 && facts.length === 0 && hypotheses.length === 0 && uncertainty.length === 0 && invalidations.length === 0) return null;
  return (
    <details className="aiDecisionDebugSection aiDecisionMemoryDetails">
      <summary>KI-Speicher</summary>
      <AiDecisionDebugRows rows={rows} />
      <AiDecisionDebugChips title="Bekannt" items={facts} tone="muted" />
      <AiDecisionDebugChips title="Hypothesen" items={hypotheses} tone="muted" />
      <AiDecisionDebugChips title="Unsicherheit" items={uncertainty} tone="muted" />
      <AiDecisionDebugChips title="Invalidierungen" items={invalidations} tone="muted" />
    </details>
  );
}

function aiDecisionDebugMemoryRows(detail: Record<string, unknown>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  if (typeof detail.memoryVersion === "string") rows.push(["Version", detail.memoryVersion]);
  const memoryItems = aiDecisionDebugDetailSectionItems(detail, "semantic_memory", 64);
  const ownHandCount = aiDecisionDebugTagValue(memoryItems, "own_hand_count");
  const ownHandVisibility = aiDecisionDebugTagValue(memoryItems, "own_hand_content_visibility");
  const ownHandLegalActions = aiDecisionDebugTagValue(memoryItems, "own_hand_current_legal_actions");
  if (ownHandCount) {
    rows.push([
      "KI-eigene Hand",
      [
        `${ownHandCount} Karten`,
        ownHandLegalActions ? `${ownHandLegalActions} aktuelle LegalActions aus der Hand` : undefined,
        ownHandVisibility === "preview_private_section" ? "Details in KI-Privathand" : ownHandVisibility
      ].filter(Boolean).join(" · ")
    ]);
  }
  if (aiDecisionDebugTagValue(memoryItems, "own_hand_future_play_plan_model") === "not_modelled") {
    rows.push([
      "Handkarten-Planung",
      "unbezahlbare Zukunftskarten noch nicht als eigener Plan modelliert"
    ]);
  }
  const model = aiDecisionDebugRecord(detail.opponentModel);
  if (!model) return rows;
  const rnd = aiDecisionDebugRecord(model.rndTopFreshness);
  if (rnd) {
    const rawFreshness = typeof rnd.freshness === "string" ? rnd.freshness : undefined;
    const knownTop = aiDecisionDebugCardLabel(aiDecisionDebugRecord(rnd.knownTopCard));
    const sequence = aiDecisionDebugPositionCardList(rnd.knownSequence, 6);
    const freshness =
      rawFreshness === "fresh_after_top_removed" && knownTop
        ? "Sequenz vorgerückt"
        : rawFreshness
          ? aiDecisionDebugRndFreshnessLabel(rawFreshness)
          : "-";
    const known =
      rawFreshness === "fresh_after_top_removed" && !knownTop && !sequence
        ? "neue Topkarte unbekannt"
        : rnd.knownToRunner === true
          ? "bekannt"
          : "nicht bekannt";
    rows.push(["R&D-Top-Wissen", `${knownTop ? `${knownTop} · ` : ""}${freshness} · ${known}`]);
    if (sequence) rows.push(["R&D-Sequenz", sequence]);
  }
  const hq = aiDecisionDebugRecord(model.hqHandMemory);
  if (hq) {
    rows.push(...aiDecisionDebugHqHandRows(hq));
  }
  const knownPositions = aiDecisionDebugPositionCardList(model.knownPositionMemory, 6);
  if (knownPositions) {
    rows.push(["Positionswissen", knownPositions]);
  } else if (typeof model.knownPositionMemoryCount === "number") {
    rows.push(["Positionswissen", model.knownPositionMemoryCount === 0 ? "keine" : String(model.knownPositionMemoryCount)]);
  }
  const remoteBeliefs = Array.isArray(model.remoteCardBelief) ? model.remoteCardBelief.length : undefined;
  if (remoteBeliefs !== undefined) rows.push(["Remote-Hypothesen", remoteBeliefs === 0 ? "keine" : String(remoteBeliefs)]);
  const remoteCandidates = aiDecisionDebugRecordList(model.hiddenRemoteCandidateMemory);
  if (remoteCandidates.length > 0) {
    rows.push([
      "Remote-Kandidaten",
      remoteCandidates
        .slice(0, 3)
        .map((entry) => {
          const candidates = aiDecisionDebugCardList(entry.candidateCards, 5) || `${String(entry.candidateCount ?? 0)} Kandidaten`;
          const scope = entry.exhaustive === true ? "vollständig" : "offen";
          return `${String(entry.serverId ?? "remote")}: ${candidates} · ${scope} · ${String(entry.agendaCandidateCount ?? 0)} Agenda · ${String(entry.relevantTrashCandidateCount ?? 0)} Trash`;
        })
        .join(" · ")
    ]);
  }
  const runnerAggression = aiDecisionDebugRecord(model.runnerAggressionMemory);
  if (runnerAggression) {
    rows.push([
      "Runner-Runs",
      `${String(runnerAggression.runEvents ?? 0)} gesamt · ${String(runnerAggression.centralRuns ?? 0)} zentral · ${String(runnerAggression.remoteRuns ?? 0)} remote`
    ]);
  }
  const threat = aiDecisionDebugRecord(model.runnerThreatModel);
  if (threat) {
    rows.push([
      "Runner-Druck",
      `HQ ${aiDecisionDebugPercent(threat.hqPressure)} · R&D ${aiDecisionDebugPercent(threat.rndPressure)} · Remote ${aiDecisionDebugPercent(threat.remotePressure)}`
    ]);
  }
  if (typeof model.hqAgendaDensityEstimate === "number") rows.push(["HQ-Agenda-Heuristik", `${aiDecisionDebugPercent(model.hqAgendaDensityEstimate)} · grobe Schätzung`]);
  if (typeof model.rndValueEstimate === "number") rows.push(["R&D-Zugriffsheuristik", `${aiDecisionDebugPercent(model.rndValueEstimate)} · grobe Schätzung`]);
  if (typeof model.corpCreditReserveInterpretation === "string") rows.push(["Korp-Creditreserve", model.corpCreditReserveInterpretation]);
  return rows;
}

function aiDecisionDebugMemoryChipList(value: unknown, limit: number): string[] {
  return uniqueDisplayStrings(safeStringList(value, 32).map(aiDecisionDebugMemoryChipLabel)).slice(0, limit);
}

function aiDecisionDebugMemoryHypothesisChipList(detail: Record<string, unknown>, limit: number): string[] {
  const hasStructuredHqHandMemory = Boolean(aiDecisionDebugRecord(aiDecisionDebugRecord(detail.opponentModel)?.hqHandMemory));
  return uniqueDisplayStrings(
    safeStringList(detail.hypotheses, 32)
      .filter((value) => !(hasStructuredHqHandMemory && value.startsWith("opponent_hidden_hand_cards:")))
      .map(aiDecisionDebugMemoryChipLabel)
  ).slice(0, limit);
}

function aiDecisionDebugMemoryChipLabel(value: string): string {
  if (value.startsWith("revealed_opponent_card:")) return `Gesehene Karte: ${value.slice("revealed_opponent_card:".length)}`;
  if (value.startsWith("public_card:")) {
    const [, server = "Server", title = "Karte"] = value.split(":");
    return `Offene Karte ${aiDecisionDebugServerLabel(server)}: ${title}`;
  }
  if (value.startsWith("server_shape:")) {
    const parts = value.split(":");
    const server = aiDecisionDebugServerLabel(parts[1] ?? "Server");
    const ice = parts[3] ?? "?";
    const root = parts[5] ?? "?";
    return `Serverform ${server}: ${ice} ICE, ${root} Root`;
  }
  if (value.startsWith("remote_card_hypothesis:")) {
    const parts = value.split(":");
    return `Remote-Hypothese ${aiDecisionDebugServerLabel(parts[1] ?? "Remote")}: ${parts[2] ?? "unbekannte Karte"}`;
  }
  if (value.startsWith("unrezzed_ice_risk:")) {
    const parts = value.split(":");
    const score = parts[3] ? ` (${Math.round(Number(parts[3]) * 100)}%)` : "";
    return `Unrezzed-ICE-Risiko ${aiDecisionDebugServerLabel(parts[1] ?? "Server")}${score}`;
  }
  if (value.startsWith("opponent_hidden_hand_cards:")) {
    const rawCount = value.slice("opponent_hidden_hand_cards:".length).split(":")[0] ?? "";
    return `${rawCount} unbekannte gegnerische Handkarten`;
  }
  const labels: Record<string, string> = {
    corp_draw_event: "Korp hat gezogen",
    known_projection_only: "nur bekannte Projektion",
    remote_state_changed: "Remote-Zustand geändert",
    unknown_opponent_hand_or_hidden_zones: "unbekannte Hand oder Hidden-Zonen",
    unknown_remote_cards_remain_hypotheses: "Remote-Hypothesen bleiben unsicher",
    unrezzed_ice_titles_remain_unknown: "unrezzed ICE-Titel unbekannt"
  };
  const parts = value.split(":");
  const key = parts[0] ?? "";
  const suffix = parts[1];
  return suffix && labels[key] ? `${labels[key]}: ${suffix}` : labels[value] ?? value;
}

function aiDecisionDebugRndFreshnessLabel(value: string): string {
  const labels: Record<string, string> = {
    fresh: "frisch",
    fresh_known_same_top: "frisch bekannte Topkarte",
    fresh_after_top_removed: "Topkarte entfernt",
    invalidated: "invalidiert",
    stale_known_same_top: "alte bekannte Topkarte",
    unknown: "unbekannt"
  };
  return labels[value] ?? value;
}

function aiDecisionDebugServerLabel(value: string): string {
  if (value === "hq") return "HQ";
  if (value === "rd") return "R&D";
  if (value === "archives") return "Archive";
  if (value.startsWith("remote_")) return `Remote ${value.slice("remote_".length)}`;
  return value;
}

function aiDecisionDebugCardLabel(entry: Record<string, unknown> | undefined): string {
  if (!entry) return "";
  return typeof entry.title === "string"
    ? entry.title
    : typeof entry.definitionId === "string"
      ? entry.definitionId
      : "";
}

function aiDecisionDebugCardList(value: unknown, limit: number): string {
  const entries = aiDecisionDebugRecordList(value).slice(0, limit);
  if (entries.length === 0) return "";
  const labels = entries.map((entry) => {
    const label = aiDecisionDebugCardLabel(entry) || "?";
    const count = typeof entry.count === "number" && entry.count > 1 ? ` x${entry.count}` : "";
    const type = typeof entry.type === "string" ? ` (${entry.type})` : "";
    return `${label}${count}${type}`;
  });
  const remainder = aiDecisionDebugRecordList(value).length - entries.length;
  return remainder > 0 ? `${labels.join(", ")} +${remainder}` : labels.join(", ");
}

function aiDecisionDebugPositionCardList(value: unknown, limit: number): string {
  const entries = aiDecisionDebugNormalizePositionCardList(aiDecisionDebugRecordList(value)).slice(0, limit);
  if (entries.length === 0) return "";
  const labels = entries.map((entry) => {
    const position =
      typeof entry.position === "string"
        ? entry.position
        : [entry.zone, entry.positionKey].filter((part): part is string => typeof part === "string" && part.length > 0).join("/");
    const label = aiDecisionDebugCardLabel(entry) || "?";
    return position ? `${position}: ${label}` : label;
  });
  const remainder = aiDecisionDebugNormalizePositionCardList(aiDecisionDebugRecordList(value)).length - entries.length;
  return remainder > 0 ? `${labels.join(" · ")} · +${remainder}` : labels.join(" · ");
}

function aiDecisionDebugNormalizePositionCardList(entries: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const preciseRemoteCards = new Set(
    entries
      .filter((entry) => {
        const zone = typeof entry.zone === "string" ? entry.zone : "";
        const positionKey = typeof entry.positionKey === "string" ? entry.positionKey : "";
        return zone.startsWith("remote_") && positionKey !== "installed";
      })
      .map((entry) => `${String(entry.zone)}:${aiDecisionDebugCardLabel(entry)}`)
  );
  const result = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const zone = typeof entry.zone === "string" ? entry.zone : "";
    const positionKey = typeof entry.positionKey === "string" ? entry.positionKey : "";
    const label = aiDecisionDebugCardLabel(entry);
    if (zone.startsWith("remote_") && positionKey === "installed" && preciseRemoteCards.has(`${zone}:${label}`)) {
      continue;
    }
    const displayPosition = typeof entry.position === "string" ? entry.position : [zone, positionKey].filter(Boolean).join("/");
    result.set(`${displayPosition}:${label}`, entry);
  }
  return [...result.values()];
}

function aiDecisionDebugRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function aiDecisionDebugPercent(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "-";
}

function AiDecisionDebugChips({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warning" | "muted" }) {
  if (items.length === 0) return null;
  return (
    <div className={`aiDecisionDebugSection ${tone}`}>
      <strong>{title}</strong>
      <div className="aiDecisionDebugChipRow">
        {items.map((item, index) => <span key={`${item}:${index}`}>{item}</span>)}
      </div>
    </div>
  );
}

function aiDecisionDebugDetailSectionItems(detail: Record<string, unknown>, sectionId: string, limit: number): string[] {
  const section = aiDecisionDebugRecordList(detail.detailSections).find((entry) => entry.id === sectionId);
  return safeStringList(section?.items, limit);
}

function aiDecisionDebugRecordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function aiDecisionDebugStatusLabel(status: AiDecisionDebugOverlayStatus, traceCount: number): string {
  if (status === "activating") return "Aktivierung";
  if (status === "waiting") return traceCount > 0 ? `${traceCount} geladen` : "Wartet";
  if (status === "live") return traceCount > 0 ? `${traceCount} Traces` : "Live";
  if (status === "error") return "Fehler";
  return "Aus";
}

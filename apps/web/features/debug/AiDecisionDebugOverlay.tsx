import {
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Move,
  PanelTopClose,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import type { AiPlanFirstDecisionDebug } from "@netgrid/shared";

import {
  aiDecisionDebugDeckStrategySummary,
  aiDecisionDebugHqHandRows,
} from "../../app/ai-decision-debug-ui";
import { serializeAiPlanFirstDecisionVisibleJsonExport } from "../../app/ai-plan-first-decision-export";
import {
  aiPlanFirstDispositionSummary,
  aiPlanFirstIntentFitLabel,
  aiPlanFirstPriorityLabel,
  aiPlanFirstQuoteStatusLabel,
  aiPlanFirstSelectionAuthorityLabel,
  aiPlanFirstStepLabel,
  aiTurnPlanningModeLabel,
  parseAiPlanFirstDecisionDebug,
} from "../../app/ai-plan-first-decision-ui";
import {
  aiTraceActionRows,
  aiTraceDebugGapNotes,
  aiTraceMetaRows,
  aiTracePlanLabel,
  aiTraceScoreRows,
  aiTraceTitle,
  safeStringList,
  type MaintenanceAiTraceDetail,
  type MaintenanceAiTraceActionRow,
} from "../../app/maintenance";
import { copyTextToClipboard } from "../../lib/clipboard";
import {
  clampOverlayPosition,
  type OverlayPositionPreference,
} from "../../lib/overlay-position";

export type AiDecisionDebugOverlayStatus =
  | "off"
  | "activating"
  | "waiting"
  | "live"
  | "error";

type RunOverlayPositionPreference = OverlayPositionPreference;
type AiDecisionDebugExportStatus =
  | "idle"
  | "copied"
  | "copy_failed"
  | "blocked";

export function FloatingAiDecisionDebugOverlay({
  position,
  status,
  error,
  trace,
  traceCount,
  onPosition,
  onClose,
}: {
  position: RunOverlayPositionPreference;
  status: AiDecisionDebugOverlayStatus;
  error: string;
  trace: MaintenanceAiTraceDetail | null;
  traceCount: number;
  onPosition(position: RunOverlayPositionPreference): void;
  onClose(): void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [exportStatus, setExportStatus] =
    useState<AiDecisionDebugExportStatus>("idle");

  useEffect(() => {
    if (position.kind !== "custom") return;
    const clampToViewport = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const next = clampOverlayPosition(
        position.xPercent,
        position.yPercent,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height,
      );
      if (
        next.kind !== "custom" ||
        next.xPercent !== position.xPercent ||
        next.yPercent !== position.yPercent
      )
        onPosition(next);
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
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
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
        rect.height,
      ),
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const positionStyle: CSSProperties =
    position.kind === "custom"
      ? {
          left: `${position.xPercent}%`,
          top: `${position.yPercent}%`,
          transform: "none",
        }
      : {};
  const exportTrace = trace;
  const exportMode: "trace" = "trace";
  const statusText = exportTrace
    ? aiDecisionDebugWindowHeaderStatusLabel(exportTrace, exportMode)
    : aiDecisionDebugStatusLabel(status, traceCount);
  const windowClassName = `aiDecisionDebugWindow ${collapsed ? "is-collapsed" : ""}`;
  const exportButtonTitle = aiDecisionDebugHeaderExportTitle(
    exportStatus,
    Boolean(exportTrace),
  );
  const copyAiDecisionDebugJson = async () => {
    if (!exportTrace) {
      setExportStatus("copy_failed");
      return;
    }
    try {
      const copied = await copyTextToClipboard(
        serializeAiDecisionDebugVisibleJsonExport(
          exportTrace,
          exportMode,
          new Date().toISOString(),
        ),
      );
      setExportStatus(copied ? "copied" : "copy_failed");
    } catch {
      setExportStatus("blocked");
    }
  };

  const overlay = (
    <div
      ref={overlayRef}
      className={`aiDecisionDebugOverlay ${position.kind === "custom" ? "custom" : ""}`}
      style={positionStyle}
      data-testid="ai-decision-debug-overlay"
    >
      <section className={windowClassName} aria-label="KI-Entscheidung">
        <div
          className="aiDecisionDebugHead actionPanelFloatingDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title="KI-Entscheidungsfenster verschieben"
          aria-label="KI-Entscheidungsfenster verschieben"
        >
          <div className="aiDecisionDebugTitle">
            <Brain size={16} aria-hidden="true" />
            <strong>KI-Entscheidung</strong>
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
              {exportStatus === "copied" ? (
                <Check size={14} />
              ) : exportStatus === "blocked" ||
                exportStatus === "copy_failed" ? (
                <AlertTriangle size={14} />
              ) : (
                <Clipboard size={14} />
              )}
            </button>
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setCollapsed((current) => !current)}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? "KI-Entscheidungsfenster ausklappen"
                  : "KI-Entscheidungsfenster einklappen"
              }
              title={collapsed ? "Ausklappen" : "Einklappen"}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
              aria-label="KI-Entscheidungsfenster ausblenden"
              title="Ausblenden"
            >
              <PanelTopClose size={14} />
            </button>
          </div>
        </div>
        <div className="aiDecisionDebugBody" hidden={collapsed}>
          <AiDecisionDebugOverlayBody
            status={status}
            error={error}
            trace={trace}
          />
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
  trace,
}: {
  status: AiDecisionDebugOverlayStatus;
  error: string;
  trace: MaintenanceAiTraceDetail | null;
}) {
  if (status === "error") {
    return (
      <p className="aiDecisionDebugNotice error" role="alert">
        {error || "KI-Trace konnte nicht geladen werden."}
      </p>
    );
  }
  if (trace) return <AiDecisionDebugTraceView trace={trace} />;
  return (
    <p className="aiDecisionDebugNotice" role="status">
      Warte auf die vorbereitete nächste KI-Entscheidung.
    </p>
  );
}

function aiDecisionTraceSelectedActionLabel(
  trace: MaintenanceAiTraceDetail,
): string {
  const action =
    trace.detail.selectedActionType ?? trace.selectedActionType ?? "KI-Aktion";
  const label = aiDecisionDebugRecordList(trace.detail.actionAlternatives).find(
    (entry) => entry.actionId === trace.selectedActionId,
  )?.label;
  return String(label ?? action);
}

function aiDecisionDebugWindowHeaderStatusLabel(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
): string {
  const planFirstDecision = parseAiPlanFirstDecisionDebug(
    trace.detail.planFirstDecision,
  );
  const actionLabel = aiDecisionTraceSelectedActionLabel(trace);
  if (!planFirstDecision) return `${actionLabel} · Plan-first-Daten fehlen`;
  if (planFirstDecision.lane === "engine_window") {
    return `${actionLabel} · Engine-/Pflichtfenster`;
  }
  return [
    actionLabel,
    planFirstDecision.selectedPlan
      ? aiTracePlanLabel(planFirstDecision.selectedPlan.moduleId)
      : undefined,
    planFirstDecision.priority?.effectiveClass,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function AiDecisionDebugTraceView({
  trace,
  mode = "trace",
}: {
  trace: MaintenanceAiTraceDetail;
  mode?: "trace" | "preview";
}) {
  const decision = parseAiPlanFirstDecisionDebug(
    trace.detail.planFirstDecision,
  );
  if (!decision) {
    return (
      <div className="aiDecisionDebugContent">
        <AiDecisionDebugCollapsibleSection
          title="Plan-first-Vertrag fehlt"
          summary="Fail-closed"
          defaultOpen
        >
          <p className="aiDecisionDebugNotice error" role="alert">
            Diese Diagnose enthält keinen aktuellen Plan-first-Vertrag.
            Unstrukturierte Alt-Diagnosen und Score-Rankings werden nicht
            angezeigt.
          </p>
          <AiDecisionDebugRows
            rows={[
              [
                "Gewählte LegalAction",
                aiDecisionTraceSelectedActionLabel(trace),
              ],
              ["Action-ID", trace.selectedActionId ?? "-"],
              ["StateVersion", String(trace.stateVersion)],
            ]}
          />
        </AiDecisionDebugCollapsibleSection>
      </div>
    );
  }
  return (
    <AiDecisionDebugPlanFirstTraceView
      trace={trace}
      mode={mode}
      decision={decision}
    />
  );
}

function AiDecisionDebugPlanFirstTraceView({
  trace,
  mode,
  decision,
}: {
  trace: MaintenanceAiTraceDetail;
  mode: "trace" | "preview";
  decision: AiPlanFirstDecisionDebug;
}) {
  const detail = trace.detail;
  const actionLabel = aiDecisionTraceSelectedActionLabel(trace);
  const selectedPlan = decision.selectedPlan;
  const priorityLabel = aiPlanFirstPriorityLabel(decision.priority);
  const dispositionSummary = aiPlanFirstDispositionSummary(decision);
  const nextActionRows: Array<[string, string]> = [
    ...(selectedPlan
      ? ([
          ["Plan", aiTracePlanLabel(selectedPlan.moduleId)],
          ["Priorität", priorityLabel],
        ] as Array<[string, string]>)
      : []),
    ...(decision.route?.stepId
      ? ([
          [
            "Aktueller Schritt",
            aiDecisionDebugPlanStepLabel(decision.route.stepId),
          ],
        ] as Array<[string, string]>)
      : []),
  ];
  const technicalDecisionRows: Array<[string, string]> = [
    [
      "Entscheidungsquelle",
      aiPlanFirstSelectionAuthorityLabel(decision.selectionAuthority),
    ],
    ...(selectedPlan
      ? ([
          ["Plan-ID", selectedPlan.instanceId],
          [
            "Root → ausführender Plan",
            `${decision.rootPlanInstanceId} → ${decision.leafExecutorInstanceId}`,
          ],
        ] as Array<[string, string]>)
      : []),
    ...(decision.route
      ? ([
          [
            "Gebundene Route",
            `${decision.route.semanticActionType} → ${decision.route.actionId}`,
          ],
        ] as Array<[string, string]>)
      : []),
    ...(selectedPlan?.parentInstanceId
      ? ([["Parent", selectedPlan.parentInstanceId]] as Array<[string, string]>)
      : []),
    ...(selectedPlan?.parentNeedId || decision.priority?.parentNeedId
      ? ([
          [
            "Gebundener Need",
            selectedPlan?.parentNeedId ??
              decision.priority?.parentNeedId ??
              "-",
          ],
        ] as Array<[string, string]>)
      : []),
    ...(decision.engineQuoteEvidence.status !== "not_reported"
      ? ([
          [
            "Engine-Quote",
            aiPlanFirstQuoteStatusLabel(decision.engineQuoteEvidence.status),
          ],
        ] as Array<[string, string]>)
      : []),
  ];
  const unknownDispositions = decision.dispositions
    .filter((entry) => entry.disposition === "assessment_unknown")
    .map(
      (entry) =>
        `${entry.actionId} · ${entry.ownerModuleId} · ${entry.evidenceCode}`,
    );
  const nonproductiveDispositions = decision.dispositions
    .filter((entry) => entry.disposition === "explicitly_nonproductive")
    .map(
      (entry) =>
        `${entry.actionId} · ${entry.ownerModuleId} · ${entry.evidenceCode}`,
    );
  const alternativeWhyNot = aiDecisionDebugRecordList(detail.actionAlternatives)
    .filter((alternative) => alternative.selected !== true)
    .flatMap((alternative) =>
      safeStringList(alternative.whyNot, 3).map(
        (reason) => `${String(alternative.actionId ?? "-")} · ${reason}`,
      ),
    )
    .slice(0, 16);

  return (
    <div className="aiDecisionDebugContent">
      <AiDecisionDebugCollapsibleSection
        title="Nächste Aktion"
        summary={actionLabel}
        defaultOpen
      >
        {mode === "preview" ? (
          <p className="aiDecisionDebugNotice" role="status">
            <strong>Read-only KI-Vorschlag, keine Regelentscheidung.</strong>{" "}
            Das residente Planportfolio wird durch die Vorschau nicht
            fortgeschrieben.
          </p>
        ) : null}
        <AiDecisionDebugRows rows={nextActionRows} />
        {decision.priority?.effectiveClass === "P6" ? (
          <p className="aiDecisionDebugNotice">
            P6 gilt ausschließlich für den ausgewiesenen engen, endlichen
            Abschluss- oder befristeten Übergangsvertrag. Es entsteht keine
            allgemeine Auffangkategorie.
          </p>
        ) : null}
        {decision.engineQuoteEvidence.status === "unknown" ||
        dispositionSummary.unknown > 0 ? (
          <p className="aiDecisionDebugNotice error" role="status">
            Unknown bleibt fail-closed: Die betroffenen Actionpfade tragen keine
            positive Routenbehauptung und beweisen weder Routenausschöpfung noch
            Zugabschluss.
          </p>
        ) : null}
        {detail.fallbackUsed === true || detail.timeoutUsed === true ? (
          <p className="aiDecisionDebugNotice error" role="alert">
            Vertragsabweichung: Der Trace meldet{" "}
            {detail.fallbackUsed === true ? "einen Fallback" : "einen Timeout"}.
            Die Plan-first-Erklärung erfindet dafür keine Ersatzsemantik.
          </p>
        ) : null}
      </AiDecisionDebugCollapsibleSection>

      {decision.portfolio.length > 0 ? (
        <AiDecisionDebugCollapsibleSection
          title="Welche Pläne verfolgt die KI?"
          summary={`${decision.portfolio.length} aktive Planinstanzen · ausgewählt: ${selectedPlan ? aiTracePlanLabel(selectedPlan.moduleId) : "keine"}`}
          defaultOpen={false}
        >
          <div className="aiDecisionDebugCompactList">
            {decision.portfolio.map((plan) => {
              const selected = plan.instanceId === selectedPlan?.instanceId;
              return (
                <div key={plan.instanceId}>
                  <span>
                    {aiTracePlanLabel(plan.moduleId)} · {plan.phase} ·{" "}
                    {plan.viability}
                  </span>
                  <strong>
                    {plan.instanceId === decision.leafExecutorInstanceId
                      ? "führt diese Aktion aus"
                      : plan.instanceId === decision.rootPlanInstanceId
                        ? "übergeordneter Plan"
                        : "begleitender Plan"}
                  </strong>
                  {selected ? (
                    <AiDecisionDebugRows
                      rows={[
                        ["Bleibt als Ziel", plan.persistencePolicy],
                        ["Stand im Plan", `${plan.phase} · ${plan.milestone}`],
                        [
                          "Benötigt noch",
                          plan.openNeedIds.length > 0
                            ? plan.openNeedIds.join(", ")
                            : "nichts",
                        ],
                      ]}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </AiDecisionDebugCollapsibleSection>
      ) : null}

      {decision.turnPlanning ? (
        <AiDecisionDebugCollapsibleSection
          title="Zugplanung"
          summary={`${decision.turnPlanning.selectedLine.phases.length} Phase(n) · ${aiTurnPlanningStopReasonLabel(decision.turnPlanning.selectedLine.stopReason)}`}
          defaultOpen
        >
          <AiDecisionDebugRows
            rows={[
              [
                "Betriebsart",
                aiTurnPlanningModeLabel(decision.turnPlanning.mode),
              ],
              ["Zug", decision.turnPlanning.turnKey],
              ["Gewählte Linie", decision.turnPlanning.selectedLine.lineId],
              [
                "Planungsende",
                aiTurnPlanningStopReasonLabel(
                  decision.turnPlanning.selectedLine.stopReason,
                ),
              ],
              [
                "Cursor",
                `Phase ${decision.turnPlanning.selectedLine.cursor.phaseIndex + 1}, Schritt ${decision.turnPlanning.selectedLine.cursor.nodeIndex + 1}`,
              ],
              [
                "Projizierter Zustand",
                decision.turnPlanning.selectedLine.projectedFrameKey,
              ],
            ]}
          />
          {decision.turnPlanning.shadowComparison ? (
            <>
              <h4>
                {decision.turnPlanning.mode === "cutover"
                  ? "Vergleich mit alter Einzelaktionsauswahl"
                  : "Shadow-Vergleich"}
              </h4>
              <AiDecisionDebugRows
                rows={[
                  [
                    decision.turnPlanning.mode === "cutover"
                      ? "Alte Einzelaktionsauswahl"
                      : "Produktive Aktion",
                    decision.turnPlanning.shadowComparison.liveActionId,
                  ],
                  [
                    decision.turnPlanning.mode === "cutover"
                      ? "Verbindliche Zugplan-Aktion"
                      : "Shadow-Aktion",
                    decision.turnPlanning.shadowComparison.shadowActionId ??
                      "keine vollständige Shadow-Linie",
                  ],
                  [
                    "Ergebnis",
                    aiTurnShadowComparisonLabel(
                      decision.turnPlanning.shadowComparison.comparisonClass,
                    ),
                  ],
                  [
                    "Begrenzte Ein-Schritt-Baseline",
                    decision.turnPlanning.shadowComparison
                      .boundedBaselineActionId ?? "nicht verfügbar",
                  ],
                  [
                    "Zwei-Schritt-Suche änderte den Head",
                    decision.turnPlanning.shadowComparison.twoStepChangedHead
                      ? "ja"
                      : "nein",
                  ],
                ]}
              />
            </>
          ) : null}
          {decision.turnPlanning.campaigns?.length ? (
            <>
              <h4>Kampagnen über den Gegnerzug</h4>
              <div className="aiDecisionDebugCompactList">
                {decision.turnPlanning.campaigns.map((campaign) => (
                  <div key={campaign.campaignId}>
                    <span>
                      {campaign.campaignId} · {campaign.kind}
                    </span>
                    <strong>
                      {aiTurnCampaignStatusLabel(campaign.status)} ·{" "}
                      {campaign.requoteStatus}
                    </strong>
                    <AiDecisionDebugRows
                      rows={[
                        ["Root", campaign.rootPlanInstanceId],
                        ["Meilenstein", campaign.milestoneId],
                        [
                          "Ziel",
                          campaign.targetServerId ??
                            campaign.targetCardInstanceId ??
                            "kein Einzelziel",
                        ],
                        ["Requote", campaign.requoteReasonCode],
                        [
                          "Öffentliche Outcomes",
                          String(campaign.publicOutcomes.length),
                        ],
                      ]}
                    />
                    <AiDecisionDebugChips
                      title="Outcome-Rückführung"
                      items={campaign.publicOutcomes.map(
                        (outcome) =>
                          `${outcome.kind} · ${outcome.eventId} · ${outcome.milestoneId}`,
                      )}
                      tone="muted"
                    />
                    <AiDecisionDebugChips
                      title="Kampagnen-Evidence"
                      items={campaign.evidenceCodes}
                      tone="muted"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {decision.turnPlanning.coverage ? (
            <>
              <h4>Planabdeckung und Suche</h4>
              <AiDecisionDebugRows
                rows={[
                  [
                    "Coverage",
                    `${decision.turnPlanning.coverage.status === "pass" ? "vollständig" : "unvollständig"} · ${decision.turnPlanning.coverage.coveragePercent}%`,
                  ],
                  [
                    "Aktionsklassen",
                    `${decision.turnPlanning.coverage.productiveActionCount} produktiv · ${decision.turnPlanning.coverage.explicitlyNonproductiveActionCount} nicht produktiv · ${decision.turnPlanning.coverage.assessmentUnknownActionCount} unbekannt · ${decision.turnPlanning.coverage.engineWindowActionCount} Engine`,
                  ],
                  [
                    "Lücken/Konflikte",
                    `${decision.turnPlanning.coverage.missingActionCount}/${decision.turnPlanning.coverage.conflictingActionCount}`,
                  ],
                  [
                    "Heads/Linien",
                    decision.turnPlanning.search
                      ? `${decision.turnPlanning.search.headCount}/${decision.turnPlanning.search.lineCount}`
                      : "nicht ausgewiesen",
                  ],
                  [
                    "Suchknoten/Partitionen",
                    decision.turnPlanning.search
                      ? `${decision.turnPlanning.search.expandedNodeCount}/${decision.turnPlanning.search.protectedPartitionCount}`
                      : "nicht ausgewiesen",
                  ],
                  [
                    "Suchbudget",
                    decision.turnPlanning.search
                      ? `Tiefe ${decision.turnPlanning.search.maximumDepth} · Knoten ${decision.turnPlanning.search.maximumExpandedNodes} · Äste ${decision.turnPlanning.search.maximumBranchesPerPartition} · Pareto ${decision.turnPlanning.search.maximumParetoLinesPerPartition}`
                      : "nicht ausgewiesen",
                  ],
                ]}
              />
              <AiDecisionDebugChips
                title="Coverage-Befunde"
                items={[
                  ...decision.turnPlanning.coverage.issueCodes,
                  ...decision.turnPlanning.coverage.missingActionIds.map(
                    (actionId) => `ohne Owner: ${actionId}`,
                  ),
                  ...decision.turnPlanning.coverage.conflictingActionIds.map(
                    (actionId) => `Owner-Konflikt: ${actionId}`,
                  ),
                ]}
                tone={
                  decision.turnPlanning.coverage.status === "pass"
                    ? "muted"
                    : "warning"
                }
              />
            </>
          ) : null}
          {decision.turnPlanning.consideredLines?.length ? (
            <>
              <h4>Verglichene Zuglinien</h4>
              <div className="aiDecisionDebugCompactList">
                {decision.turnPlanning.consideredLines.map((line) => (
                  <div key={line.lineId}>
                    <span>
                      {line.firstActionId} · {line.stepCount} Schritt(e)
                    </span>
                    <strong>
                      Wert {line.scalarValue} ·{" "}
                      {aiTurnPlanningStopReasonLabel(line.stopReason)}
                    </strong>
                    <AiDecisionDebugRows
                      rows={[
                        ["Root", line.rootPlanInstanceId],
                        [
                          "Verletzte Pflichten",
                          String(line.violatedObligationCount),
                        ],
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <div className="aiDecisionDebugCompactList">
            {decision.turnPlanning.selectedLine.phases.map((phase, index) => (
              <div key={phase.phaseId}>
                <span>
                  Phase {index + 1} · {aiTracePlanLabel(phase.rootModuleId)}
                </span>
                <strong>{phase.completionCode}</strong>
                <AiDecisionDebugRows
                  rows={[
                    ["Root-Plan", phase.rootPlanInstanceId],
                    ["Herkunft", phase.rootProvenance],
                    ["Übergang", phase.transitionKind],
                    [
                      "Geplante Schritte",
                      phase.nodes
                        .map(
                          (node) =>
                            `${node.semanticActionType}${node.boundaryAfter ? ` → ${node.boundaryAfter}` : ""}`,
                        )
                        .join(" · "),
                    ],
                    [
                      "Support-Bindungen",
                      phase.supportBindings.length > 0
                        ? phase.supportBindings
                            .map(
                              (binding) =>
                                `${binding.planInstanceId} → ${binding.parentNeedId}`,
                            )
                            .join(" · ")
                        : "keine",
                    ],
                  ]}
                />
              </div>
            ))}
          </div>
          {decision.turnPlanning.commitment ? (
            <>
              <h4>Planbindung und Ausführung</h4>
              <AiDecisionDebugRows
                rows={[
                  ["Commitment", decision.turnPlanning.commitment.commitmentId],
                  [
                    "Status",
                    aiTurnCommitmentStatusLabel(
                      decision.turnPlanning.commitment.status,
                    ),
                  ],
                  [
                    "Commitment-Cursor",
                    `Phase ${decision.turnPlanning.commitment.cursor.phaseIndex + 1} (${decision.turnPlanning.commitment.cursor.phaseId}), Schritt ${decision.turnPlanning.commitment.cursor.nodeIndex + 1} (${decision.turnPlanning.commitment.cursor.nodeId})`,
                  ],
                  [
                    "Phase Entry",
                    `${aiTurnPhaseEntryStatusLabel(decision.turnPlanning.commitment.phaseEntry.status)} · ${decision.turnPlanning.commitment.phaseEntry.reasonCode}`,
                  ],
                  [
                    "Rematerialisierung",
                    `${aiTurnRematerializationStatusLabel(decision.turnPlanning.commitment.rematerialization.status)}${decision.turnPlanning.commitment.rematerialization.actionId ? ` · ${decision.turnPlanning.commitment.rematerialization.actionId}` : ""}${decision.turnPlanning.commitment.rematerialization.reasonCode ? ` · ${decision.turnPlanning.commitment.rematerialization.reasonCode}` : ""}`,
                  ],
                  [
                    "Beobachtungsklasse",
                    decision.turnPlanning.commitment.observationClass ??
                      "noch nicht klassifiziert",
                  ],
                  [
                    "Replan-Grund",
                    decision.turnPlanning.commitment.replanReason ??
                      "kein Replan",
                  ],
                ]}
              />
            </>
          ) : null}
          {decision.turnPlanning.boundary ? (
            <AiDecisionDebugRows
              rows={[
                ["Beobachtungsgrenze", decision.turnPlanning.boundary.kind],
                [
                  "Restwertbasis",
                  decision.turnPlanning.boundary.residualTurnValueBasis,
                ],
                [
                  "Restoptionen",
                  `${decision.turnPlanning.boundary.optionalityMinimum}–${decision.turnPlanning.boundary.optionalityMaximum} ${decision.turnPlanning.boundary.optionalityUnit}`,
                ],
              ]}
            />
          ) : null}
          {decision.turnPlanning.agendaComparison ? (
            <>
              <AiDecisionDebugRows
                rows={[
                  [
                    "Agenda-Familie",
                    decision.turnPlanning.agendaComparison.selectedFamily
                      ? aiAgendaLineFamilyLabel(
                          decision.turnPlanning.agendaComparison.selectedFamily,
                        )
                      : "Engine-Auswahl ausstehend",
                  ],
                  [
                    "Auswahlgrund",
                    decision.turnPlanning.agendaComparison.selectionReason,
                  ],
                  [
                    "Rush-Mischentscheidung",
                    decision.turnPlanning.agendaComparison.randomizationEligible
                      ? "zulässig und opportunity-gebunden"
                      : "nicht zulässig oder klare Präferenz",
                  ],
                  [
                    "Opportunity",
                    decision.turnPlanning.agendaComparison.opportunityKey,
                  ],
                ]}
              />
              <div className="aiDecisionDebugCompactList">
                {decision.turnPlanning.agendaComparison.lines.map((line) => (
                  <div key={line.lineId}>
                    <span>{aiAgendaLineFamilyLabel(line.family)}</span>
                    <strong>
                      Wert {line.expectedValue} · Worst Case{" "}
                      {line.worstCaseFloor}
                    </strong>
                    <AiDecisionDebugRows
                      rows={[
                        ["Aktionen", String(line.actionCount)],
                        ["Agenda", String(line.agendaProgress)],
                        ["Defense", String(line.defense)],
                        ["Economy", String(line.economy)],
                        ["Risiko", String(line.risk)],
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {decision.turnPlanning.defenseComparison ? (
            <>
              <h4>Defense-/Economy-Linien</h4>
              <div className="aiDecisionDebugCompactList">
                {decision.turnPlanning.defenseComparison.lines.map((line) => (
                  <div key={line.lineId}>
                    <span>
                      {line.targetServerId} ·{" "}
                      {aiDefenseLineDispositionLabel(line.disposition)}
                    </span>
                    <strong>
                      Wert {line.totalValue} ·{" "}
                      {line.rezReadyAfterLine
                        ? "danach rezbereit"
                        : "Rez-Finanzierung noch offen"}
                    </strong>
                    <AiDecisionDebugRows
                      rows={[
                        ["Aktionen", String(line.actionCount)],
                        [
                          "Funding-Gap",
                          `${line.fundingGapBefore} → ${line.fundingGapAfter}`,
                        ],
                        ["Defense", String(line.defenseValue)],
                        ["Economy", String(line.economyValue)],
                        ["Bluffwert", String(line.bluffValue)],
                      ]}
                    />
                  </div>
                ))}
              </div>
              <AiDecisionDebugChips
                title="Verworfene Defense-Linien"
                items={decision.turnPlanning.defenseComparison.rejected.map(
                  (entry) =>
                    `${entry.defenseId}${entry.actionId ? ` · ${entry.actionId}` : ""} · ${entry.reasonCode}`,
                )}
                tone="muted"
              />
            </>
          ) : null}
          <AiDecisionDebugChips
            title="Beschnittene Linien"
            items={decision.turnPlanning.pruneEvents.map(
              (entry) => `${entry.candidateId} · ${entry.reasonCode}`,
            )}
            tone="muted"
          />
          <AiDecisionDebugChips
            title="Planungs-Evidence"
            items={decision.turnPlanning.evidenceCodes}
            tone="muted"
          />
        </AiDecisionDebugCollapsibleSection>
      ) : null}

      <AiDecisionDebugCollapsibleSection
        title="Warum passt das gerade?"
        summary="Strategische Einordnung · entscheidet die Aktion nicht allein"
        defaultOpen={false}
      >
        <p className="aiDecisionDebugNotice">
          Die Signale zeigen, welche Ziele oder Gefahren die KI gerade sieht.
          Sie erklären den Kontext; die konkrete Aktion kommt weiterhin aus der
          ausgewählten Planinstanz und einer legalen Engine-Route.
        </p>
        <AiDecisionDebugRows
          rows={[
            [
              "Strategic Intent",
              decision.strategicContext.primaryStrategyId ??
                "Nicht ausgewiesen",
            ],
            [
              "Intent-Phase",
              decision.strategicContext.phase ?? "Nicht ausgewiesen",
            ],
            [
              "Intent-Fit",
              aiPlanFirstIntentFitLabel(decision.strategicContext.intentFit),
            ],
          ]}
        />
        <AiDecisionDebugChips
          title="Aktuelle Goal-/Threat-Signale"
          items={decision.strategicContext.signals.map(
            (signal) =>
              `${signal.kind}/${signal.scope} · ${signal.planModuleId} · ${signal.evidenceCode} · ${signal.guarantee}`,
          )}
          tone="muted"
        />
      </AiDecisionDebugCollapsibleSection>

      <AiDecisionDebugMemory detail={detail} />
      <AiDecisionDebugPrivateHand detail={detail} />

      <AiDecisionDebugCollapsibleSection
        title="Technische Prüfung und Alternativen"
        summary={`${dispositionSummary.explicitlyNonproductive} verworfen · ${dispositionSummary.unknown} unklar`}
        defaultOpen={false}
      >
        <AiDecisionDebugRows
          rows={[
            ...technicalDecisionRows,
            [
              "Quote-Status",
              aiPlanFirstQuoteStatusLabel(decision.engineQuoteEvidence.status),
            ],
            [
              "Priority-Validierung",
              decision.priority?.validationReasonCodes.join(", ") ??
                "Engine-/Pflichtfenster",
            ],
          ]}
        />
        <AiDecisionDebugChips
          title="Engine-Quote-Evidence"
          items={decision.engineQuoteEvidence.evidenceCodes}
          tone={
            decision.engineQuoteEvidence.status === "unknown"
              ? "warning"
              : "muted"
          }
        />
        <AiDecisionDebugChips
          title="Assessment-Evidence"
          items={decision.assessmentEvidenceCodes}
          tone="muted"
        />
        <AiDecisionDebugChips
          title="Unknown · fail-closed"
          items={unknownDispositions}
          tone="warning"
        />
        <AiDecisionDebugChips
          title="Explizit nichtproduktive Route Heads"
          items={nonproductiveDispositions}
          tone="muted"
        />
        <AiDecisionDebugChips
          title="whyNot der übrigen LegalActions"
          items={alternativeWhyNot}
          tone="muted"
        />
      </AiDecisionDebugCollapsibleSection>
    </div>
  );
}

function aiAgendaLineFamilyLabel(
  family: "pure_rush" | "combined_rush" | "safe_setup",
): string {
  if (family === "pure_rush") return "Reiner Rush";
  if (family === "combined_rush") return "Kombinierter Rush";
  return "Sicherer Aufbau";
}

function aiDefenseLineDispositionLabel(
  disposition:
    | "install_rez_ready"
    | "fund_then_install"
    | "stage_for_later_rez"
    | "bounded_bluff"
    | "draw_for_ice",
): string {
  if (disposition === "install_rez_ready")
    return "ICE installieren, Rezreserve steht";
  if (disposition === "fund_then_install")
    return "zuerst finanzieren, dann ICE installieren";
  if (disposition === "stage_for_later_rez")
    return "ICE jetzt vorbereiten, später rezzen";
  if (disposition === "draw_for_ice")
    return "ICE suchen, danach Restzug neu planen";
  return "begrenzter Bluff innerhalb des Defense-Plans";
}

function aiTurnPlanningStopReasonLabel(
  value: NonNullable<
    AiPlanFirstDecisionDebug["turnPlanning"]
  >["selectedLine"]["stopReason"],
): string {
  switch (value) {
    case "projected_turn_end":
      return "Zugende vollständig projiziert";
    case "observation_boundary":
      return "Beobachtungsgrenze, danach Neuplanung";
    case "projection_not_supported":
      return "weitere Projektion noch nicht unterstützt";
    case "projected_plan_discovery_required":
      return "neue Planermittlung erforderlich";
    case "bounded_search_horizon":
      return "begrenzter Suchhorizont erreicht";
  }
}

function aiTurnShadowComparisonLabel(
  value: NonNullable<
    NonNullable<AiPlanFirstDecisionDebug["turnPlanning"]>["shadowComparison"]
  >["comparisonClass"],
): string {
  switch (value) {
    case "agreement":
      return "Livepolicy und Shadow wählen dieselbe Aktion";
    case "two_step_changes_head":
      return "die Zwei-Schritt-Suche ändert die erste Aktion";
    case "different_current_head":
      return "abweichende aktuelle Aktion";
    case "no_shadow_line":
      return "keine vollständige Shadow-Linie";
  }
}

function aiTurnCampaignStatusLabel(
  value: NonNullable<
    NonNullable<AiPlanFirstDecisionDebug["turnPlanning"]>["campaigns"]
  >[number]["status"],
): string {
  switch (value) {
    case "awaiting_opponent_outcome":
      return "wartet auf Gegnerzug";
    case "continuable":
      return "fortsetzbar";
    case "blocked":
      return "blockiert";
    case "completed":
      return "abgeschlossen";
    case "abandoned":
      return "beendet";
  }
}

function aiTurnCommitmentStatusLabel(
  value: NonNullable<
    NonNullable<AiPlanFirstDecisionDebug["turnPlanning"]>["commitment"]
  >["status"],
): string {
  switch (value) {
    case "prospective":
      return "nur vorgeschlagen, noch nicht gebunden";
    case "active":
      return "aktiv gebunden";
    case "awaiting_observation":
      return "wartet auf Beobachtung";
    case "completed":
      return "abgeschlossen";
    case "replanned":
      return "durch Neuplanung ersetzt";
    case "invalidated":
      return "invalidiert";
  }
}

function aiTurnPhaseEntryStatusLabel(
  value: NonNullable<
    NonNullable<AiPlanFirstDecisionDebug["turnPlanning"]>["commitment"]
  >["phaseEntry"]["status"],
): string {
  switch (value) {
    case "projection_only":
      return "nur Projektion";
    case "validated":
      return "validiert";
    case "pending":
      return "Validierung ausstehend";
    case "invalid":
      return "ungültig";
  }
}

function aiTurnRematerializationStatusLabel(
  value: NonNullable<
    NonNullable<AiPlanFirstDecisionDebug["turnPlanning"]>["commitment"]
  >["rematerialization"]["status"],
): string {
  switch (value) {
    case "not_attempted":
      return "noch nicht versucht";
    case "executable":
      return "aktuell ausführbar gebunden";
    case "replan_required":
      return "Neuplanung erforderlich";
  }
}

function AiDecisionDebugLegacyTraceView({
  trace,
  mode = "trace",
}: {
  trace: MaintenanceAiTraceDetail;
  mode?: "trace" | "preview";
}) {
  const detail = trace.detail;
  const metaRows = aiDecisionDebugOverlayMetaRows(trace, mode);
  const actionRows = aiTraceActionRows(detail, mode === "preview" ? 32 : 8);
  const planFocusActionRows =
    mode === "preview" ? actionRows : aiTraceActionRows(detail, 32);
  const rankedAlternatives = aiDecisionDebugRecordList(
    detail.rankedAlternatives,
  ).slice(0, mode === "preview" ? 12 : 4);
  const scoreRows = aiTraceScoreRows(detail, 8);
  const notes = aiTraceDebugGapNotes(detail).slice(0, 3);
  const planLayer = aiDecisionDebugPlanLayer(detail);
  const overviewSummary = aiDecisionDebugOverviewSummary(
    metaRows,
    planLayer,
    detail,
  );
  const statusWarnings = [
    ...(detail.fallbackUsed === true ? ["Fallback genutzt"] : []),
    ...(detail.timeoutUsed === true ? ["Timeout genutzt"] : []),
  ];
  const visibleReasons = safeStringList(detail.visibleReasons, 5);
  const relevantExclusions = safeStringList(detail.whyNot, 5).filter(
    aiDecisionDebugIsCurrentWhyNot,
  );
  const title = aiTraceTitle(trace);
  return (
    <div className="aiDecisionDebugContent">
      <AiDecisionDebugCollapsibleSection
        title="Übersicht"
        summary={overviewSummary}
        defaultOpen
      >
        {mode === "preview" ? (
          <p className="aiDecisionDebugNotice" role="status">
            <strong>Read-only KI-Vorschlag, keine Regelentscheidung.</strong>{" "}
            Frische Übernahme ohne persistentes KI-Memory · Profil{" "}
            {String(detail.advisorProfileId ?? "human-advisor")}
          </p>
        ) : null}
        <div className="aiDecisionDebugTraceHead">
          <strong>{title}</strong>
          <span>
            {new Date(trace.createdAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        <AiDecisionDebugSelectedPlanOverview
          planLayer={planLayer}
          actionRows={planFocusActionRows}
          metaRows={metaRows}
          selectedScoreRows={scoreRows}
        />
        <AiDecisionDebugCollapsibleChips
          title="Hinweise"
          items={statusWarnings}
          tone="warning"
          defaultOpen={false}
        />
        <AiDecisionDebugCollapsibleChips
          title="Gründe"
          items={visibleReasons}
          defaultOpen={false}
        />
        <AiDecisionDebugCollapsibleChips
          title="Ausschlüsse"
          items={relevantExclusions}
          defaultOpen={false}
        />
      </AiDecisionDebugCollapsibleSection>
      <AiDecisionDebugPlanLayer
        detail={detail}
        planLayer={planLayer}
        defaultOpen
      />
      <AiDecisionDebugRunPlan detail={detail} />
      <AiDecisionDebugDeckStrategy detail={detail} />
      {actionRows.length > 0 ? (
        <AiDecisionDebugCollapsibleSection
          title={
            mode === "preview" ? "LegalAction-Ebene" : "Action-Level-Ranking"
          }
          summary={aiDecisionDebugActionLevelSummary(actionRows, mode)}
          defaultOpen
        >
          <div className="aiDecisionDebugActions">
            {actionRows.map((action) => (
              <div
                className={`aiDecisionDebugAction ${action.selected ? "selected" : ""} ${action.excluded ? "excluded" : ""}`}
                key={action.key}
              >
                <div>
                  <strong>
                    #{action.rank} {action.label}
                  </strong>
                  <span>
                    {action.excluded
                      ? "Ausgeschlossen"
                      : `${action.selected ? (mode === "preview" ? "geplant" : "ausgeführt") : action.debugSelected ? "Debug-Auswahl" : "Alternative"} · Priorität ${action.priority}`}
                  </span>
                </div>
                <p>{action.reason}</p>
                {action.metrics.length > 0 ? (
                  <div className="aiDecisionDebugChipRow">
                    {action.metrics.map((metric) => (
                      <span key={metric}>{metric}</span>
                    ))}
                  </div>
                ) : null}
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
        <AiDecisionDebugCollapsibleSection
          title="Semantic-Action-Ranking"
          summary={`${rankedAlternatives.length} Einträge`}
          defaultOpen={false}
        >
          <div className="aiDecisionDebugCompactList">
            {rankedAlternatives.map((alternative, index) => (
              <div
                key={`${String(alternative.planId ?? alternative.planKind ?? "plan")}-${index}`}
              >
                <span>
                  #{String(alternative.rank ?? index + 1)}{" "}
                  {aiDecisionDebugSemanticRankingLabel(alternative)}
                </span>
                <strong>
                  {typeof alternative.score === "number"
                    ? alternative.score.toFixed(2)
                    : "-"}
                </strong>
              </div>
            ))}
          </div>
        </AiDecisionDebugCollapsibleSection>
      ) : null}
      <AiDecisionDebugMemory detail={detail} />
      <AiDecisionDebugPrivateHand detail={detail} />
      <AiDecisionDebugChips title="Folgepunkte" items={notes} tone="muted" />
    </div>
  );
}

export function serializeAiDecisionDebugVisibleJsonExport(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
  exportedAt: string,
): string {
  return serializeAiPlanFirstDecisionVisibleJsonExport(trace, mode, exportedAt);
}

function aiDecisionDebugPlanExport(plan: AiDecisionDebugPlanEntry) {
  const titleUsesTarget = aiDecisionDebugPlanTitleUsesTarget(plan);
  return {
    rank: plan.rank,
    title: aiDecisionDebugPlanTitle(plan),
    secondary: aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget),
    selected: plan.selected,
    status: plan.status
      ? aiDecisionDebugPlanStatusLabel(plan.status)
      : undefined,
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

function aiDecisionDebugHeaderExportTitle(
  status: AiDecisionDebugExportStatus,
  available: boolean,
): string {
  if (!available) return "Noch keine KI-Entscheidung für JSON-Export verfügbar";
  switch (status) {
    case "idle":
      return "KI-Entscheidung als JSON kopieren";
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
  "Score",
]);

function aiDecisionDebugOverlayMetaRows(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
): Array<[string, string]> {
  const hiddenPreviewLabels = new Set(["Entscheidung", "Ausgeführt"]);
  return aiTraceMetaRows(trace)
    .filter(([label]) => AI_DECISION_DEBUG_OVERLAY_META_LABELS.has(label))
    .filter(([label]) => mode !== "preview" || !hiddenPreviewLabels.has(label))
    .map(([label, value]) =>
      label === "Score" ? ["Action-Rohscore", value] : [label, value],
    );
}

function aiDecisionDebugIsCurrentWhyNot(item: string): boolean {
  return (
    !item.startsWith("legacy_reference_") &&
    item !== "semantic_runtime_actual_differs_from_legacy_debug"
  );
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

type AiDecisionDebugPlanLayerView = {
  summaryRows: Array<[string, string]>;
  entries: AiDecisionDebugPlanEntry[];
  fallbackItems: string[];
  mappedActionIds: string[];
  evaluatedPlanCount?: number;
  blockedPlanCount?: number;
};

const AI_DECISION_DEBUG_TACTICAL_PLAN_ITEM_LIMIT = Number.MAX_SAFE_INTEGER;

type AiDecisionDebugPlanCandidateCounts = {
  evaluated: number;
  active: number;
  blocked: number;
  abandoned: number;
  terminal: number;
  hidden: number;
};

function aiDecisionDebugMetaRowValue(
  rows: Array<[string, string]>,
  label: string,
): string | undefined {
  return rows.find(([rowLabel]) => rowLabel === label)?.[1];
}

function aiDecisionDebugOverviewSummary(
  metaRows: Array<[string, string]>,
  planLayer: AiDecisionDebugPlanLayerView,
  detail: Record<string, unknown>,
): string {
  const selectedPlan = planLayer.entries.find((entry) => entry.selected);
  const planLabel =
    selectedPlan !== undefined
      ? aiDecisionDebugPlanTitle(selectedPlan)
      : aiDecisionDebugMetaRowValue(metaRows, "Plan");
  const planScoreLabel =
    selectedPlan !== undefined
      ? aiDecisionDebugPlanScoreLabel(selectedPlan)
      : undefined;
  const actionScoreLabel = aiDecisionDebugOverlayScoreValue(metaRows);
  const fallbackActionScore =
    planScoreLabel === undefined && actionScoreLabel && actionScoreLabel !== "-"
      ? `${aiDecisionDebugOverlayScoreLabel(metaRows)} ${actionScoreLabel}`
      : undefined;
  const parts = uniqueDisplayStrings(
    [
      planLabel && planLabel !== "-" ? planLabel : undefined,
      planScoreLabel,
      fallbackActionScore,
      aiDecisionDebugPlanCandidateSummary(planLayer),
    ].filter((part): part is string => Boolean(part)),
  );
  return parts.join(" · ");
}

function aiDecisionDebugOverlayScoreValue(
  rows: Array<[string, string]>,
): string | undefined {
  return (
    aiDecisionDebugMetaRowValue(rows, "Action-Rohscore") ??
    aiDecisionDebugMetaRowValue(rows, "Score")
  );
}

function aiDecisionDebugOverlayScoreLabel(
  rows: Array<[string, string]>,
): string {
  return aiDecisionDebugMetaRowValue(rows, "Action-Rohscore") !== undefined
    ? "Action-Rohscore"
    : "Score";
}

function aiDecisionDebugHandSummary(
  detail: Record<string, unknown>,
): string | undefined {
  const handCount = aiDecisionDebugMetaRowValue(
    aiDecisionDebugPrivateHandExport(detail).rows,
    "Handkarten",
  );
  if (!handCount || handCount === "-") return undefined;
  return handCount.includes("Karte") ? handCount : `${handCount} Handkarten`;
}

function aiDecisionDebugPlanCandidateSummary(
  planLayer: AiDecisionDebugPlanLayerView,
): string | undefined {
  const counts = aiDecisionDebugPlanCandidateCounts({
    entries: planLayer.entries,
    evaluatedPlanCount: planLayer.evaluatedPlanCount,
    blockedPlanCount: planLayer.blockedPlanCount,
  });
  if (counts.evaluated > 0) {
    return aiDecisionDebugPlanCandidateSummaryText(counts);
  }
  return aiDecisionDebugMetaRowValue(
    planLayer.summaryRows,
    "Plan-Kandidaten",
  )?.replace(/\s*\(.*\)\s*$/, "");
}

function aiDecisionDebugPlanCandidateCounts(params: {
  entries: readonly AiDecisionDebugPlanEntry[];
  evaluatedPlanCount: number | undefined;
  blockedPlanCount: number | undefined;
}): AiDecisionDebugPlanCandidateCounts {
  const evaluatedPlans = Math.max(
    params.evaluatedPlanCount ?? 0,
    params.entries.length,
  );
  const visibleActivePlans = params.entries.filter((entry) =>
    aiDecisionDebugPlanStatusIsActive(entry.status),
  ).length;
  const visibleBlockedPlans = params.entries.filter(
    (entry) => entry.status === "blocked",
  ).length;
  const visibleAbandonedPlans = params.entries.filter(
    (entry) => entry.status === "abandoned",
  ).length;
  const visibleTerminalPlans = params.entries.filter((entry) =>
    aiDecisionDebugPlanStatusIsTerminal(entry.status),
  ).length;
  const blockedPlans = params.blockedPlanCount ?? visibleBlockedPlans;
  return {
    evaluated: evaluatedPlans,
    active:
      params.entries.length > 0
        ? visibleActivePlans
        : Math.max(0, evaluatedPlans - blockedPlans),
    blocked: blockedPlans,
    abandoned: visibleAbandonedPlans,
    terminal: visibleTerminalPlans,
    hidden: Math.max(0, evaluatedPlans - params.entries.length),
  };
}

function aiDecisionDebugPlanCandidateSummaryText(
  counts: AiDecisionDebugPlanCandidateCounts,
): string {
  return [
    `${counts.evaluated} bewertet`,
    `${counts.active} aktiv/möglich`,
    counts.blocked > 0 ? `${counts.blocked} blockiert` : undefined,
    counts.abandoned > 0 ? `${counts.abandoned} verworfen` : undefined,
    counts.terminal > 0 ? `${counts.terminal} abgeschlossen` : undefined,
    counts.hidden > 0 ? `${counts.hidden} ohne Rangdetails` : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function aiDecisionDebugPlanStatusIsActive(
  status: string | undefined,
): boolean {
  return (
    status === undefined ||
    status === "active" ||
    status === "progressing" ||
    status === "proposed"
  );
}

function aiDecisionDebugPlanStatusIsTerminal(
  status: string | undefined,
): boolean {
  return status === "failed" || status === "expired" || status === "satisfied";
}

function aiDecisionDebugPlanLayerSummary(
  planLayer: AiDecisionDebugPlanLayerView,
): string {
  const selectedPlan = planLayer.entries.find((entry) => entry.selected);
  const selectedLabel =
    selectedPlan !== undefined
      ? [
          aiDecisionDebugPlanTitle(selectedPlan),
          aiDecisionDebugPlanScoreLabel(selectedPlan),
        ]
          .filter(Boolean)
          .join(" · ")
      : aiDecisionDebugMetaRowValue(planLayer.summaryRows, "Ausgewählter Plan");
  return uniqueDisplayStrings(
    [selectedLabel, aiDecisionDebugPlanCandidateSummary(planLayer)].filter(
      (part): part is string => Boolean(part),
    ),
  ).join(" · ");
}

function AiDecisionDebugSelectedPlanOverview({
  planLayer,
  actionRows,
  metaRows,
  selectedScoreRows,
}: {
  planLayer: AiDecisionDebugPlanLayerView;
  actionRows: MaintenanceAiTraceActionRow[];
  metaRows: Array<[string, string]>;
  selectedScoreRows: Array<[string, string]>;
}) {
  const selectedPlan = planLayer.entries.find((entry) => entry.selected);
  const planActions = aiDecisionDebugPlanRelevantActions(planLayer, actionRows);
  const selectedAction =
    planActions.find((action) => action.selected) ??
    actionRows.find((action) => action.selected);
  if (!selectedPlan && planActions.length === 0) {
    return <AiDecisionDebugRows rows={metaRows} />;
  }
  const titleUsesTarget = selectedPlan
    ? aiDecisionDebugPlanTitleUsesTarget(selectedPlan)
    : false;
  const selectedPlanRows = selectedPlan
    ? aiDecisionDebugSelectedPlanRows(
        selectedPlan,
        planLayer,
        titleUsesTarget,
        selectedAction,
      )
    : metaRows;
  return (
    <div className="aiDecisionDebugPlanFocus">
      <details className="aiDecisionDebugPlanFocusCard" open>
        <summary>
          <strong>Ausgewählter Plan</strong>
          <span>
            {selectedPlan
              ? [
                  aiDecisionDebugPlanTitle(selectedPlan),
                  aiDecisionDebugPlanScoreLabel(selectedPlan),
                  aiDecisionDebugPlanStatusLabel(selectedPlan.status),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : (aiDecisionDebugMetaRowValue(metaRows, "Plan") ?? "-")}
          </span>
        </summary>
        <AiDecisionDebugRows rows={selectedPlanRows} />
        {selectedPlan?.scores.length ? (
          <details className="aiDecisionDebugActionDetails">
            <summary>
              Planbewertung {aiDecisionDebugPlanScoreLabel(selectedPlan) ?? ""}
            </summary>
            <AiDecisionDebugRows rows={selectedPlan.scores} />
          </details>
        ) : null}
      </details>
      <details className="aiDecisionDebugPlanActions" open>
        <summary className="aiDecisionDebugPlanActionsTitle">
          <strong>Planrelevante Aktionen</strong>
          <span>
            {planActions.length > 0
              ? `${planActions.length} bewertete LegalAction${planActions.length === 1 ? "" : "s"}`
              : "keine gemappte LegalAction im Debug-Ranking"}
          </span>
        </summary>
        {planActions.length > 0 ? (
          <div className="aiDecisionDebugActions">
            {planActions.map((action) => (
              <AiDecisionDebugPlanActionCard
                action={action}
                planLayer={planLayer}
                scoreRows={
                  action.selected && action.scoreRows.length === 0
                    ? selectedScoreRows
                    : action.scoreRows
                }
                key={`plan-action:${action.key}`}
              />
            ))}
          </div>
        ) : (
          <p className="aiDecisionDebugPlanFocusEmpty">
            Der ausgewählte Plan hat in diesem Snapshot keine sichtbare
            LegalAction gemappt oder bewertet.
          </p>
        )}
      </details>
    </div>
  );
}

function AiDecisionDebugPlanActionCard({
  action,
  planLayer,
  scoreRows,
}: {
  action: MaintenanceAiTraceActionRow;
  planLayer: AiDecisionDebugPlanLayerView;
  scoreRows: Array<[string, string]>;
}) {
  return (
    <div
      className={`aiDecisionDebugAction ${action.selected ? "selected" : ""} ${action.excluded ? "excluded" : ""}`}
    >
      <div>
        <strong>
          #{action.rank} {action.label}
        </strong>
        <span>{aiDecisionDebugPlanActionRelation(action, planLayer)}</span>
      </div>
      <AiDecisionDebugRows rows={aiDecisionDebugPlanActionRows(action)} />
      {scoreRows.length > 0 ? (
        <details className="aiDecisionDebugActionDetails">
          <summary>
            {action.score !== undefined
              ? `Action-Score ${action.score} aufklappen`
              : "Action-Score aufklappen"}
          </summary>
          <AiDecisionDebugRows rows={scoreRows} />
        </details>
      ) : null}
      <p>{aiDecisionDebugPlanActionReasonLabel(action.reason)}</p>
    </div>
  );
}

function aiDecisionDebugSelectedPlanRows(
  plan: AiDecisionDebugPlanEntry,
  planLayer: AiDecisionDebugPlanLayerView,
  titleUsesTarget: boolean,
  selectedAction: MaintenanceAiTraceActionRow | undefined,
): Array<[string, string]> {
  return [
    ["Plan", aiDecisionDebugPlanTitle(plan)],
    ["Planbewertung", aiDecisionDebugPlanScoreLabel(plan) ?? "-"],
    ["Status", aiDecisionDebugPlanStatusLabel(plan.status)],
    ...(selectedAction
      ? ([
          [
            "Ausgelöste Action",
            aiDecisionDebugSelectedActionSummary(selectedAction),
          ],
        ] as Array<[string, string]>)
      : []),
    ...(plan.step
      ? ([
          ["Aktueller Schritt", aiDecisionDebugPlanStepLabel(plan.step, plan)],
        ] as Array<[string, string]>)
      : []),
    ...(aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget)
      ? ([
          [
            titleUsesTarget ? "Rolle" : "Ziel",
            aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget) ?? "",
          ],
        ] as Array<[string, string]>)
      : []),
    ...(planLayer.mappedActionIds.length > 0
      ? ([
          ["Gemappte LegalActions", String(planLayer.mappedActionIds.length)],
        ] as Array<[string, string]>)
      : []),
    ...aiDecisionDebugPlanSummaryRows(planLayer, [
      "Step-Mapping",
      "Vorheriger Plan",
      "Fortschreibung",
    ]),
  ];
}

function aiDecisionDebugSelectedActionSummary(
  action: MaintenanceAiTraceActionRow,
): string {
  return [
    action.label,
    action.score ? `Action-Score ${action.score}` : undefined,
    action.priority !== "-" ? `Planangepasst ${action.priority}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function aiDecisionDebugPlanSummaryRows(
  planLayer: AiDecisionDebugPlanLayerView,
  labels: string[],
): Array<[string, string]> {
  const labelSet = new Set(labels);
  return planLayer.summaryRows.filter(([label]) => labelSet.has(label));
}

function aiDecisionDebugPlanRelevantActions(
  planLayer: AiDecisionDebugPlanLayerView,
  actionRows: MaintenanceAiTraceActionRow[],
): MaintenanceAiTraceActionRow[] {
  const mappedActionIds = new Set(planLayer.mappedActionIds);
  return actionRows.filter(
    (action) =>
      mappedActionIds.has(action.actionId) ||
      action.selected ||
      action.debugSelected ||
      aiDecisionDebugActionHasSelectedPlanScore(action),
  );
}

function aiDecisionDebugActionHasSelectedPlanScore(
  action: MaintenanceAiTraceActionRow,
): boolean {
  return action.scoreRows.some(([label]) => label === "Plan-Auswahl");
}

function aiDecisionDebugPlanActionRelation(
  action: MaintenanceAiTraceActionRow,
  planLayer: AiDecisionDebugPlanLayerView,
): string {
  if (action.excluded) return "ausgeschlossen";
  if (action.selected) return "gewählte Planaktion";
  if (planLayer.mappedActionIds.includes(action.actionId))
    return "vom Plan gemappt";
  if (action.debugSelected) return "Debug-Auswahl";
  return "planrelevant";
}

function aiDecisionDebugPlanActionRows(
  action: MaintenanceAiTraceActionRow,
): Array<[string, string]> {
  const visibleComponentScore =
    aiDecisionDebugActionVisibleComponentScore(action);
  const planAdjustment = aiDecisionDebugActionPlanAdjustment(action);
  return [
    ...(action.score !== undefined
      ? ([["Semantischer Action-Score", action.score]] as Array<
          [string, string]
        >)
      : []),
    ...(action.score === undefined && visibleComponentScore !== undefined
      ? ([
          [
            "Sichtbare Action-Komponenten",
            aiDecisionDebugFormatScore(visibleComponentScore),
          ],
        ] as Array<[string, string]>)
      : []),
    ...(planAdjustment !== undefined
      ? ([
          [
            aiDecisionDebugPlanAdjustmentLabel(action),
            aiDecisionDebugFormatScore(planAdjustment),
          ],
        ] as Array<[string, string]>)
      : []),
    ["Planangepasster Action-Score", action.priority],
    [
      "Action-Typ",
      aiDecisionDebugActionTypeLabel(action.actionType) || action.actionType,
    ],
    ["Quelle", action.source],
  ];
}

function aiDecisionDebugActionVisibleComponentScore(
  action: MaintenanceAiTraceActionRow,
): number | undefined {
  const rawValues = action.scoreRows
    .filter(([label]) => !aiDecisionDebugScoreRowIsPlanAdjustment(label))
    .map(([, value]) => aiDecisionDebugScoreValue(value))
    .filter((value): value is number => value !== undefined);
  if (rawValues.length === 0) return undefined;
  return rawValues.reduce((sum, value) => sum + value, 0);
}

function aiDecisionDebugActionPlanAdjustment(
  action: MaintenanceAiTraceActionRow,
): number | undefined {
  const row = action.scoreRows.find(([label]) =>
    aiDecisionDebugScoreRowIsPlanAdjustment(label),
  );
  return row ? aiDecisionDebugScoreValue(row[1]) : undefined;
}

function aiDecisionDebugPlanAdjustmentLabel(
  action: MaintenanceAiTraceActionRow,
): string {
  return action.scoreRows.some(([label]) => label === "Plan-Auswahl")
    ? "Plan-Zuschlag"
    : "Plan-Abgleich";
}

function aiDecisionDebugScoreRowIsPlanAdjustment(label: string): boolean {
  return label === "Plan-Auswahl" || label === "Plan-Abgleich";
}

function aiDecisionDebugScoreValue(value: string): number | undefined {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function aiDecisionDebugPlanActionReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    selected_by_plan_mapping: "vom ausgewählten Plan ausgewählt",
    plan_mismatch: "nicht Teil des aktuell ausgewählten Plans",
  };
  return labels[reason] ?? reason;
}

function aiDecisionDebugPlanScoreLabel(
  plan: AiDecisionDebugPlanEntry,
): string | undefined {
  if (plan.priority === undefined) return undefined;
  return `Bewertung ${aiDecisionDebugFormatScore(plan.priority)}`;
}

function aiDecisionDebugFormatScore(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function aiDecisionDebugSemanticRankingLabel(
  alternative: Record<string, unknown>,
): string {
  const actionLabel = aiDecisionDebugActionTypeLabel(
    typeof alternative.selectedActionType === "string"
      ? alternative.selectedActionType
      : undefined,
  );
  const planLabel =
    typeof alternative.planKind === "string"
      ? aiTracePlanLabel(alternative.planKind)
      : "";
  if (actionLabel && planLabel && actionLabel !== planLabel)
    return `${actionLabel} · ${planLabel}`;
  return actionLabel || planLabel || "Plan";
}

function aiDecisionDebugActionTypeLabel(
  actionType: string | undefined,
): string {
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
  return actionType ? (labels[actionType] ?? actionType) : "";
}

function aiDecisionDebugActionLevelSummary(
  actionRows: MaintenanceAiTraceActionRow[],
  mode: "trace" | "preview",
): string {
  const selectedAction = actionRows.find((action) => action.selected);
  return [
    `${actionRows.length} bewertet`,
    selectedAction
      ? `${mode === "preview" ? "geplant" : "ausgeführt"} #${selectedAction.rank}`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function aiDecisionDebugDeckStrategyHeaderSummary(
  summary: ReturnType<typeof aiDecisionDebugDeckStrategySummary>,
): string {
  return [
    `${summary.rows.length} Werte`,
    summary.blockers.length > 0
      ? `${summary.blockers.length} Blocker`
      : undefined,
    summary.warnings.length > 0
      ? `${summary.warnings.length} Warnungen`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function aiDecisionDebugPrivateHandHeaderSummary(
  privateHand: ReturnType<typeof aiDecisionDebugPrivateHandExport>,
): string {
  const handCount =
    aiDecisionDebugMetaRowValue(privateHand.rows, "Handkarten") ??
    String(privateHand.cards.length);
  return [
    `${handCount} Handkarten`,
    privateHand.cards.length > 0
      ? `${privateHand.cards.length} Details`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function AiDecisionDebugDeckStrategy({
  detail,
}: {
  detail: Record<string, unknown>;
}) {
  const summary = aiDecisionDebugDeckStrategySummary(detail);
  if (
    summary.rows.length === 0 &&
    summary.blockers.length === 0 &&
    summary.warnings.length === 0
  )
    return null;
  return (
    <AiDecisionDebugCollapsibleSection
      title="Deckstrategie"
      summary={aiDecisionDebugDeckStrategyHeaderSummary(summary)}
      defaultOpen={false}
    >
      <AiDecisionDebugRows rows={summary.rows} />
      <AiDecisionDebugChips
        title="Strategie-Blocker"
        items={summary.blockers}
        tone="warning"
      />
      <AiDecisionDebugChips
        title="Profilwarnungen"
        items={summary.warnings}
        tone="muted"
      />
    </AiDecisionDebugCollapsibleSection>
  );
}

function AiDecisionDebugPrivateHand({
  detail,
}: {
  detail: Record<string, unknown>;
}) {
  const privateHands = aiDecisionDebugPrivateHandsExports(detail);
  if (privateHands.length === 0) return null;
  return (
    <AiDecisionDebugCollapsibleSection
      title={
        privateHands.length > 1
          ? "Vollständige Karten beider Seiten"
          : "Aktuelle Hand der KI"
      }
      summary={privateHands
        .map(
          (hand) =>
            `${hand.sideLabel}: ${hand.cards.length} Karte${hand.cards.length === 1 ? "" : "n"}`,
        )
        .join(" · ")}
      defaultOpen
    >
      {privateHands.map((privateHand) => (
        <div key={privateHand.sideLabel}>
          <h4>{privateHand.sideLabel}</h4>
          <AiDecisionDebugRows rows={privateHand.rows} />
          <div className="aiDecisionDebugActions">
            {privateHand.cards.map((card) => (
              <div className="aiDecisionDebugAction" key={card.key}>
                <div>
                  <strong>
                    #{card.rank} {card.title}
                  </strong>
                  <span>{card.meta}</span>
                </div>
                {card.rulesText ? (
                  <p>
                    <strong>Regeltext:</strong> {card.rulesText}
                  </p>
                ) : null}
                {card.legalActions.length > 0 ? (
                  <p>{card.legalActions.join(" · ")}</p>
                ) : (
                  <p>Keine aktuelle LegalAction aus dieser Handkarte.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugPrivateHandsExports(
  detail: Record<string, unknown>,
): Array<
  ReturnType<typeof aiDecisionDebugPrivateHandExport> & { sideLabel: string }
> {
  const completePreview = aiDecisionDebugRecord(
    detail.developerPrivateHandsPreview,
  );
  const completeHands = completePreview
    ? aiDecisionDebugRecordList(completePreview.hands)
    : [];
  if (completeHands.length > 0) {
    return completeHands.map((preview) => ({
      ...aiDecisionDebugPrivateHandExportFromPreview(preview),
      sideLabel:
        preview.side === "corp"
          ? "Korp"
          : preview.side === "runner"
            ? "Runner"
            : String(preview.side ?? "Unbekannte Seite"),
    }));
  }
  const fallback = aiDecisionDebugPrivateHandExport(detail);
  if (fallback.cards.length === 0 && fallback.rows.length === 0) return [];
  return [{ ...fallback, sideLabel: "KI" }];
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
  if (!preview)
    return { rows: aiDecisionDebugPrivateHandMissingRows(detail), cards: [] };
  return aiDecisionDebugPrivateHandExportFromPreview(preview);
}

function aiDecisionDebugPrivateHandExportFromPreview(
  preview: Record<string, unknown>,
): ReturnType<typeof aiDecisionDebugPrivateHandExport> {
  const cards = aiDecisionDebugRecordList(preview.cards);
  const rows: Array<[string, string]> = [
    [
      "Seite",
      preview.side === "runner"
        ? "Runner"
        : preview.side === "corp"
          ? "Korp"
          : String(preview.side ?? "-"),
    ],
    ["Credits", String(preview.credits ?? "-")],
    ["Handkarten", String(preview.handCount ?? cards.length)],
    [
      "Sichtbarkeit",
      preview.visibility === "preview_only_not_persisted"
        ? "nur Vorschau, nicht gespeichert"
        : String(preview.visibility ?? "-"),
    ],
  ];
  return {
    rows,
    cards: cards.map((card, index) => {
      const title =
        typeof card.title === "string"
          ? card.title
          : typeof card.definitionId === "string"
            ? card.definitionId
            : `Karte ${index + 1}`;
      const type = typeof card.type === "string" ? card.type : "unknown";
      const cost =
        typeof card.playCost === "number"
          ? `${card.playCost} Kosten`
          : "Kosten ?";
      const availability = aiDecisionDebugPrivateHandAvailabilityLabel(
        card.availability,
        card.missingCredits,
      );
      const legalActions = aiDecisionDebugRecordList(card.legalActions).map(
        (action) => {
          const label =
            typeof action.label === "string"
              ? action.label
              : aiDecisionDebugActionTypeLabel(
                  typeof action.actionType === "string"
                    ? action.actionType
                    : undefined,
                );
          const creditCost =
            typeof action.creditCost === "number"
              ? ` (${action.creditCost} Credits)`
              : "";
          return `${label}${creditCost}`;
        },
      );
      return {
        key: `${String(card.instanceId ?? title)}:${index}`,
        rank: index + 1,
        title,
        meta: [type, cost, availability].join(" · "),
        rulesText: typeof card.rulesText === "string" ? card.rulesText : "",
        legalActions,
      };
    }),
  };
}

function AiDecisionDebugRunPlan({
  detail,
}: {
  detail: Record<string, unknown>;
}) {
  const items = aiDecisionDebugDetailSectionItems(
    detail,
    "runner_run_plan",
    64,
  );
  if (items.length === 0) return null;
  const rows = aiDecisionDebugRunPlanRows(items);
  const chips = aiDecisionDebugRunPlanChips(items);
  return (
    <AiDecisionDebugCollapsibleSection
      title="Runner-RunPlan"
      summary={`${rows.length} Werte · ${chips.length} Signale`}
      defaultOpen
    >
      <AiDecisionDebugRows rows={rows} />
      <AiDecisionDebugChips
        title="RunPlan-Signale"
        items={chips}
        tone="muted"
      />
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugRunPlanExport(detail: Record<string, unknown>) {
  const items = aiDecisionDebugDetailSectionItems(
    detail,
    "runner_run_plan",
    64,
  );
  return {
    rows: aiDecisionDebugRunPlanRows(items),
    signals: aiDecisionDebugRunPlanChips(items),
  };
}

function aiDecisionDebugRunPlanRows(items: string[]): Array<[string, string]> {
  if (items.length === 0) return [];
  const lifecycle = aiDecisionDebugTagValue(items, "runner_run_plan_lifecycle");
  const revalidation = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_revalidation",
  );
  const knownCost = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_path_quote_total_known_cost",
  );
  const remaining = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_path_quote_expected_remaining",
  );
  const canReach = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_path_quote_can_reach",
  );
  const sequenceCost = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_sequence_cost",
  );
  const requiredSubroutines = aiDecisionDebugTagValue(
    items,
    "required_subroutine_indexes",
  );
  const directBreak = aiDecisionDebugTagValue(
    items,
    "current_encounter_direct_break_sequence",
  );
  const pumpBreak = aiDecisionDebugTagValue(
    items,
    "current_encounter_pump_break_sequence",
  );
  const rows: Array<[string, string]> = [];
  const id = aiDecisionDebugTagValue(items, "runner_run_plan_id");
  if (id) rows.push(["Plan-ID", id]);
  const target = aiDecisionDebugTagValue(items, "runner_run_plan_target");
  const objective = aiDecisionDebugTagValue(items, "runner_run_plan_objective");
  if (target || objective)
    rows.push([
      "Ziel",
      [target ? aiDecisionDebugServerLabel(target) : undefined, objective]
        .filter(Boolean)
        .join(" · "),
    ]);
  if (lifecycle || revalidation)
    rows.push([
      "Status",
      [lifecycle, revalidation ? `Revalidation ${revalidation}` : undefined]
        .filter(Boolean)
        .join(" · "),
    ]);
  const available = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_budget_available",
  );
  const reserve = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_budget_reserved",
  );
  const accessReserve =
    aiDecisionDebugTagValue(items, "runner_run_plan_access_reserve") ?? reserve;
  if (available || reserve || remaining)
    rows.push([
      "Budget",
      [
        `verfügbar ${available ?? "-"}`,
        `Steal/Trash-Reserve ${accessReserve ?? "-"}`,
        `nach Pfad ${remaining ?? "-"}`,
      ].join(" · "),
    ]);
  const purposeCredits = [
    [
      "Run-only",
      aiDecisionDebugTagValue(items, "runner_run_plan_budget_run_only"),
    ],
    [
      "Breaker",
      aiDecisionDebugTagValue(
        items,
        "runner_run_plan_budget_recurring_breaker",
      ),
    ],
    [
      "Killer",
      aiDecisionDebugTagValue(items, "runner_run_plan_budget_recurring_killer"),
    ],
    [
      "Link",
      aiDecisionDebugTagValue(items, "runner_run_plan_budget_recurring_link"),
    ],
    [
      "Stealth",
      aiDecisionDebugTagValue(items, "runner_run_plan_budget_stealth"),
    ],
    [
      "Non-noisy",
      aiDecisionDebugTagValue(
        items,
        "runner_run_plan_budget_non_noisy_breaker",
      ),
    ],
    ["Max", aiDecisionDebugTagValue(items, "runner_run_plan_budget_max_spend")],
  ]
    .filter(([, value]) => value !== undefined)
    .map(([label, value]) => `${label} ${value}`);
  if (purposeCredits.length > 0)
    rows.push(["Zweckcredits", purposeCredits.join(" · ")]);
  const quoteStatus = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_path_quote_status",
  );
  if (quoteStatus || knownCost || canReach)
    rows.push([
      "PathQuote",
      [
        `Status ${quoteStatus ?? "-"}`,
        `Kosten ${knownCost ?? "-"}`,
        `erreichbar ${canReach ?? "-"}`,
      ].join(" · "),
    ]);
  const cannotReach = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_path_quote_cannot_reach",
  );
  if (cannotReach) rows.push(["Blocker", cannotReach]);
  if (requiredSubroutines)
    rows.push([
      "Pflicht-Breaks",
      aiDecisionDebugSubroutineIndexesLabel(requiredSubroutines),
    ]);
  if (directBreak === "true" || pumpBreak === "true" || sequenceCost) {
    rows.push([
      "Break-Sequenz",
      [
        directBreak === "true" ? "direkter Break" : undefined,
        pumpBreak === "true" ? "Pump + Break" : undefined,
        sequenceCost ? `Kosten ${sequenceCost}` : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  const obligation = aiDecisionDebugTagValue(
    items,
    "runner_run_plan_current_obligation",
  );
  if (obligation) rows.push(["Obligation", obligation]);
  return rows;
}

function aiDecisionDebugRunPlanChips(items: string[]): string[] {
  return uniqueDisplayStrings(
    items
      .filter(
        (item) =>
          item.startsWith("runner_run_plan_sequence_") ||
          item.startsWith("runner_run_plan_access_") ||
          item.startsWith("runner_run_plan_budget_") ||
          item.startsWith("runner_run_plan_abort_") ||
          item.startsWith("current_encounter_") ||
          item.startsWith("required_subroutine_indexes:") ||
          item.startsWith("break_action_count:") ||
          item.startsWith("pump_required_count:") ||
          item.startsWith("pump_total_cost:") ||
          item.startsWith("break_estimated_cost_after_pump:"),
      )
      .slice(0, 12),
  );
}

function aiDecisionDebugSubroutineIndexesLabel(value: string): string {
  const indexes = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (indexes.length === 0) return "-";
  return indexes.map((index) => `Subroutine #${index}`).join(", ");
}

function aiDecisionDebugPrivateHandMissingRows(
  detail: Record<string, unknown>,
): Array<[string, string]> {
  const memoryItems = aiDecisionDebugDetailSectionItems(
    detail,
    "semantic_memory",
    64,
  );
  const ownHandVisibility = aiDecisionDebugTagValue(
    memoryItems,
    "own_hand_content_visibility",
  );
  if (ownHandVisibility !== "preview_private_section") return [];
  const ownHandCount = aiDecisionDebugTagValue(memoryItems, "own_hand_count");
  const rows: Array<[string, string]> = [
    ["Status", "in diesem gespeicherten Trace nicht enthalten"],
    [
      "Sichtbarkeit",
      "nur in der aktuellen Nächster-Schritt-Vorschau, nicht in Logs oder Replays",
    ],
  ];
  if (ownHandCount) rows.unshift(["Handkarten", `${ownHandCount} Karten`]);
  return rows;
}

function aiDecisionDebugPrivateHandAvailabilityLabel(
  availability: unknown,
  missingCredits: unknown,
): string {
  if (availability === "legal_now") return "jetzt legal";
  if (availability === "missing_credits")
    return typeof missingCredits === "number"
      ? `${missingCredits} Credits fehlen`
      : "Credits fehlen";
  if (availability === "not_legal_now") return "jetzt nicht legal";
  return String(availability ?? "unbekannt");
}

function AiDecisionDebugPlanLayer({
  detail,
  planLayer: providedPlanLayer,
  defaultOpen = true,
}: {
  detail: Record<string, unknown>;
  planLayer?: AiDecisionDebugPlanLayerView;
  defaultOpen?: boolean;
}) {
  const planLayer = providedPlanLayer ?? aiDecisionDebugPlanLayer(detail);
  if (
    planLayer.summaryRows.length === 0 &&
    planLayer.entries.length === 0 &&
    planLayer.fallbackItems.length === 0
  )
    return null;
  return (
    <AiDecisionDebugCollapsibleSection
      title="Planebene"
      summary={aiDecisionDebugPlanLayerSummary(planLayer)}
      defaultOpen={defaultOpen}
    >
      {planLayer.summaryRows.length > 0 ? (
        <AiDecisionDebugRows rows={planLayer.summaryRows} />
      ) : null}
      {planLayer.entries.length > 0 ? (
        <div className="aiDecisionDebugPlanList">
          {planLayer.entries.map((plan) => {
            const titleUsesTarget = aiDecisionDebugPlanTitleUsesTarget(plan);
            return (
              <div
                className={`aiDecisionDebugPlanCard ${plan.selected ? "selected" : ""} ${plan.status === "blocked" ? "blocked" : ""}`}
                key={`${plan.rank}:${plan.id}`}
              >
                <div>
                  <strong>
                    #{plan.rank} {aiDecisionDebugPlanTitle(plan)}
                  </strong>
                  <span>
                    {[
                      aiDecisionDebugPlanSecondaryLabel(plan, titleUsesTarget),
                      aiDecisionDebugPlanScoreLabel(plan),
                      aiDecisionDebugPlanStatusLabel(plan.status),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                {plan.step ? (
                  <p>
                    Nächster Schritt:{" "}
                    {aiDecisionDebugPlanStepLabel(plan.step, plan)}
                  </p>
                ) : null}
                {plan.unblocks.length > 0 ? (
                  <p>
                    Bereitet vor:{" "}
                    {plan.unblocks
                      .map((unblockedPlan) =>
                        aiDecisionDebugPlanReferenceLabel(unblockedPlan),
                      )
                      .join(", ")}
                  </p>
                ) : null}
                {plan.blockers.length > 0 ? (
                  <div className="aiDecisionDebugChipRow">
                    {plan.blockers.map((blocker) => (
                      <span key={blocker}>
                        Blocker: {aiDecisionDebugPlanBlockerLabel(blocker)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {plan.capabilities.length > 0 ? (
                  <div className="aiDecisionDebugChipRow muted">
                    {plan.capabilities.slice(0, 4).map((capability) => (
                      <span key={capability}>
                        {aiDecisionDebugPlanCapabilityLabel(capability)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {plan.scores.length > 0 ? (
                  <details className="aiDecisionDebugActionDetails" open>
                    <summary>Bewertungsfaktoren</summary>
                    <AiDecisionDebugRows rows={plan.scores} />
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {planLayer.fallbackItems.length > 0 ? (
        <AiDecisionDebugChips
          title="Rohdiagnose"
          items={planLayer.fallbackItems}
          tone="muted"
        />
      ) : null}
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugPlanLayer(
  detail: Record<string, unknown>,
): AiDecisionDebugPlanLayerView {
  const longTermPlan = safeStringList(detail.longTermPlan, 12);
  const tacticalPlanItems = aiDecisionDebugDetailSectionItems(
    detail,
    "tactical_plan",
    AI_DECISION_DEBUG_TACTICAL_PLAN_ITEM_LIMIT,
  );
  const items = uniqueDisplayStrings([...longTermPlan, ...tacticalPlanItems]);
  const entries = items
    .map(aiDecisionDebugParsePlanEntry)
    .filter((entry): entry is AiDecisionDebugPlanEntry => Boolean(entry))
    .sort((left, right) => left.rank - right.rank);
  const selectedEntry = entries.find((entry) => entry.selected);
  const selectedType =
    selectedEntry?.type ??
    aiDecisionDebugTagValue(items, "selected_plan_type") ??
    aiDecisionDebugTagValue(items, "tactical_plan_type");
  const selectedStatus =
    selectedEntry?.status ??
    aiDecisionDebugTagValue(items, "selected_plan_status");
  const selectedStep =
    selectedEntry?.step ??
    aiDecisionDebugTagValue(items, "selected_step_kind") ??
    aiDecisionDebugTagValue(items, "tactical_step");
  const selectedScoreLabel =
    selectedEntry !== undefined
      ? aiDecisionDebugPlanScoreLabel(selectedEntry)
      : undefined;
  const selectedPriority = selectedScoreLabel ? ` · ${selectedScoreLabel}` : "";
  const previousType = aiDecisionDebugTagValue(items, "previous_plan_type");
  const previousStatus = aiDecisionDebugTagValue(items, "previous_plan_status");
  const previousTtl = aiDecisionDebugTagValue(items, "previous_plan_ttl");
  const planProgression = aiDecisionDebugTagValue(
    items,
    "plan_progression_reason",
  );
  const whyAbandoned = aiDecisionDebugTagValue(items, "why_plan_abandoned");
  const mapping = aiDecisionDebugTagValue(items, "selected_step_mapping");
  const mappedActions = aiDecisionDebugTagValue(items, "mapped_legal_actions");
  const alternativeCount = aiDecisionDebugTagValue(
    items,
    "plan_alternative_count",
  );
  const blockedCount = aiDecisionDebugTagValue(items, "blocked_plan_count");
  const evaluatedPlanCount = aiDecisionDebugNumber(alternativeCount);
  const blockedPlanCount = aiDecisionDebugNumber(blockedCount);
  const visibleBlockedPlanCount = entries.filter(
    (entry) => entry.status === "blocked",
  ).length;
  const candidateCount = evaluatedPlanCount ?? entries.length;
  const unavailablePlanCount = blockedPlanCount ?? visibleBlockedPlanCount;
  const candidateCounts = aiDecisionDebugPlanCandidateCounts({
    entries,
    evaluatedPlanCount,
    blockedPlanCount,
  });
  const summaryRows: Array<[string, string]> = [];
  if (selectedType) {
    const selectedPlanLabel = selectedEntry
      ? aiDecisionDebugPlanTitle(selectedEntry)
      : aiTracePlanLabel(selectedType);
    summaryRows.push([
      "Ausgewählter Plan",
      [
        selectedPlanLabel,
        selectedEntry
          ? aiDecisionDebugPlanSecondaryLabel(
              selectedEntry,
              aiDecisionDebugPlanTitleUsesTarget(selectedEntry),
            )
          : undefined,
        selectedStatus
          ? aiDecisionDebugPlanStatusLabel(selectedStatus)
          : undefined,
      ]
        .filter(Boolean)
        .join(" · ") + selectedPriority,
    ]);
  }
  if (selectedStep)
    summaryRows.push([
      "Aktueller Schritt",
      aiDecisionDebugPlanStepLabel(selectedStep, selectedEntry),
    ]);
  if (mapping || mappedActions) {
    const actionCount = mappedActions
      ? mappedActions.split("|").filter(Boolean).length
      : 0;
    summaryRows.push([
      "Step-Mapping",
      `${mapping ? aiDecisionDebugPlanMappingLabel(mapping) : "-"}${actionCount > 0 ? ` · ${actionCount} LegalAction${actionCount === 1 ? "" : "s"}` : ""}`,
    ]);
  }
  if (previousType && previousType !== "none") {
    summaryRows.push([
      "Vorheriger Plan",
      [
        aiTracePlanLabel(previousType),
        previousStatus
          ? aiDecisionDebugPlanStatusLabel(previousStatus)
          : undefined,
        previousTtl ? `TTL ${previousTtl}` : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  if (planProgression)
    summaryRows.push([
      "Fortschreibung",
      aiDecisionDebugPlanProgressionLabel(planProgression),
    ]);
  if (whyAbandoned) summaryRows.push(["Verworfen", whyAbandoned]);
  if (candidateCount > 0 || unavailablePlanCount > 0)
    summaryRows.push([
      "Plan-Kandidaten",
      aiDecisionDebugPlanCandidateSummaryText(candidateCounts),
    ]);
  if (candidateCount > entries.length) {
    summaryRows.push([
      "Planliste",
      `${entries.length} von ${candidateCount} Rangdetails sichtbar`,
    ]);
  }
  const fallbackItems =
    entries.length === 0
      ? items.filter((item) => !item.startsWith("plan_rank|")).slice(0, 16)
      : [];
  return {
    summaryRows,
    entries,
    fallbackItems,
    mappedActionIds: mappedActions?.split("|").filter(Boolean) ?? [],
    ...(evaluatedPlanCount !== undefined ? { evaluatedPlanCount } : {}),
    ...(blockedPlanCount !== undefined ? { blockedPlanCount } : {}),
  };
}

function aiDecisionDebugParsePlanEntry(
  item: string,
): AiDecisionDebugPlanEntry | undefined {
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
    scores: aiDecisionDebugScoreCsv(fields.get("scores")),
  };
}

function aiDecisionDebugTagValue(
  items: string[],
  key: string,
): string | undefined {
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
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function aiDecisionDebugScoreCsv(
  value: string | undefined,
): Array<[string, string]> {
  if (!value) return [];
  return value
    .split(",")
    .map((entry): [string, string] | undefined => {
      const separator = entry.lastIndexOf(":");
      if (separator <= 0) return undefined;
      return [entry.slice(0, separator), entry.slice(separator + 1)];
    })
    .filter((entry): entry is [string, string] => Boolean(entry));
}

function aiDecisionDebugPlanTitle(plan: AiDecisionDebugPlanEntry): string {
  if (plan.type === "runner.obtain_breaker_coverage") {
    const targetRun = aiDecisionDebugPlanTargetRunNoun(plan);
    const coverage = plan.capabilities[0]
      ? aiDecisionDebugPlanCapabilityLabel(plan.capabilities[0])
      : "Breaker-Abdeckung";
    return targetRun
      ? `${targetRun} vorbereiten: ${coverage}`
      : `Breaker-Abdeckung vorbereiten: ${coverage}`;
  }
  if (plan.type === "runner.play_best_hand_card") {
    const cardLabel = aiDecisionDebugPlanTargetLabel(plan);
    return cardLabel
      ? `Beste Handkarte spielen: ${cardLabel}`
      : aiTracePlanLabel(plan.type);
  }
  if (plan.type === "runner.develop_hand_card") {
    const cardLabel = aiDecisionDebugPlanTargetLabel(plan);
    return cardLabel
      ? `Handkarte entwickeln: ${cardLabel}`
      : aiTracePlanLabel(plan.type);
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

function aiDecisionDebugPlanTitleUsesTarget(
  plan: AiDecisionDebugPlanEntry,
): boolean {
  return Boolean(
    ((plan.type === "runner.contest_remote" ||
      plan.type === "runner.opportunistic_central_run") &&
      aiDecisionDebugPlanTargetRunAction(plan)) ||
    (plan.type === "runner.obtain_breaker_coverage" &&
      aiDecisionDebugPlanTargetRunNoun(plan)) ||
    ((plan.type === "runner.develop_hand_card" ||
      plan.type === "runner.play_best_hand_card") &&
      Boolean(aiDecisionDebugPlanTargetLabel(plan))),
  );
}

function aiDecisionDebugPlanSecondaryLabel(
  plan: AiDecisionDebugPlanEntry,
  titleUsesTarget: boolean,
): string | undefined {
  if (
    plan.type === "runner.develop_hand_card" ||
    plan.type === "runner.play_best_hand_card"
  ) {
    return aiDecisionDebugPlanTargetRoleLabel(plan) || undefined;
  }
  return titleUsesTarget
    ? undefined
    : aiDecisionDebugPlanTargetLabel(plan) || undefined;
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
    scores: [],
  });
}

function aiDecisionDebugPlanTargetRunAction(
  plan: AiDecisionDebugPlanEntry | undefined,
): string {
  const targetLabel = aiDecisionDebugPlanServerTargetLabel(plan);
  if (!targetLabel) return "";
  return `Run auf ${targetLabel} prüfen`;
}

function aiDecisionDebugPlanTargetRunNoun(
  plan: AiDecisionDebugPlanEntry | undefined,
): string {
  const targetLabel = aiDecisionDebugPlanServerTargetLabel(plan);
  if (!targetLabel) return "";
  return `${targetLabel}-Run`;
}

function aiDecisionDebugPlanServerTargetLabel(
  plan: AiDecisionDebugPlanEntry | undefined,
): string {
  if (!plan?.target) return "";
  const [kind, id = plan.target] = plan.target.split(":");
  if (kind !== "server") return "";
  if (id === "hq") return "HQ";
  if (id === "rd") return "R&D";
  if (id === "archives") return "Archive";
  if (id.startsWith("remote_")) return `Remote ${id.slice("remote_".length)}`;
  return id;
}

function aiDecisionDebugPlanTargetLabel(
  plan: AiDecisionDebugPlanEntry,
): string {
  if (plan.targetLabel) {
    return plan.target?.startsWith("card:")
      ? plan.targetLabel
      : aiDecisionDebugPlanTargetValueLabel(plan.targetLabel);
  }
  if (!plan.target) return "";
  const [kind, id = plan.target] = plan.target.split(":");
  if (kind === "server") return aiDecisionDebugPlanServerTargetLabel(plan);
  if (kind === "capability" && id === "runner_credit_base") return "Credits";
  if (kind === "capability" && id === "runner_tag_clear")
    return "Tags entfernen";
  if (kind === "bank" && id === "runner_credit_bank") return "Credit-Bank";
  return id;
}

function aiDecisionDebugPlanTargetRoleLabel(
  plan: AiDecisionDebugPlanEntry,
): string {
  return plan.targetRole
    ? aiDecisionDebugPlanTargetValueLabel(plan.targetRole)
    : "";
}

function aiDecisionDebugPlanTargetValueLabel(value: string): string {
  const labels: Record<string, string> = {
    access_payoff: "Zugriffswert",
    economy: "Wirtschaft",
    breaker: "Breaker",
    memory: "Speicher",
    protection: "Schutz",
    tempo: "Tempo",
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
    satisfied: "erfüllt",
  };
  return value ? (labels[value] ?? value) : "-";
}

function aiDecisionDebugPlanStepLabel(
  value: string,
  plan?: AiDecisionDebugPlanEntry,
): string {
  const runTarget = aiDecisionDebugPlanTargetRunAction(plan);
  const coverage = plan?.capabilities[0]
    ? aiDecisionDebugPlanCapabilityLabel(plan.capabilities[0])
    : "";
  const handCard =
    plan?.type === "runner.develop_hand_card" ||
    plan?.type === "runner.play_best_hand_card"
      ? aiDecisionDebugPlanTargetLabel(plan)
      : "";
  const developmentVerb = aiDecisionDebugDevelopmentCardVerb(plan);
  const labels: Record<string, string> = {
    advance_score_card: "Score-Karte advancen",
    build_bank_counter: "Credit-Bank aufbauen",
    cash_out_bank: "Credit-Bank auszahlen",
    clear_tags: "Tags entfernen",
    convert_success_window: "Run-Erfolg nutzen",
    draw_for_answer: coverage
      ? `Karten ziehen, um ${coverage} zu finden`
      : "Karten ziehen, um Antwort zu finden",
    gain_credits: "Credits nehmen",
    install_development_card: handCard
      ? `${handCard} ${developmentVerb}`
      : `Handkarte ${developmentVerb}`,
    install_breaker: coverage
      ? `${coverage} installieren`
      : "Breaker installieren",
    probe_central: "Zentralserver-Run prüfen",
    rez_outer_ice: "äußeres ICE rezzen",
    run_target: runTarget || "Run auf Zielserver prüfen",
    score_agenda: "Agenda punkten",
    search_for_answer: coverage
      ? `Suchkarte für ${coverage} nutzen`
      : "Such-/Antwortkarte nutzen",
    setup_search_engine: coverage
      ? `Such-Engine für ${coverage} installieren`
      : "Such-Engine installieren",
  };
  if (value === "probe_central" && runTarget) return runTarget;
  return labels[value] ?? aiPlanFirstStepLabel(value);
}

function aiDecisionDebugDevelopmentCardVerb(
  plan?: AiDecisionDebugPlanEntry,
): "installieren" | "spielen" | "nutzen" {
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
    unmapped: "nicht gemappt",
  };
  return labels[value] ?? value;
}

function aiDecisionDebugPlanProgressionLabel(value: string): string {
  const labels: Record<string, string> = {
    continued_previous_plan: "vorheriger Plan fortgesetzt",
    previous_central_probe_ttl_expired:
      "Zentralserver-Probe abgelaufen, zurück zum Blockerplan",
    previous_plan_considered: "vorheriger Plan wurde berücksichtigt",
    selected_new_plan: "neuer Plan gewählt",
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
    timing_window_unavailable: "Timingfenster fehlt",
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
    server_access: "Serverzugriff",
    tag_clear: "Tags entfernen",
  };
  return labels[value] ?? value;
}

function AiDecisionDebugCollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = true,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="aiDecisionDebugSection aiDecisionDebugCollapsible"
      open={defaultOpen}
    >
      <summary>
        <strong>{title}</strong>
        {summary ? (
          <span className="aiDecisionDebugSectionSummary">{summary}</span>
        ) : null}
      </summary>
      {children}
    </details>
  );
}

function AiDecisionDebugCollapsibleChips({
  title,
  items,
  tone = "default",
  defaultOpen = true,
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
          {items.map((item, index) => (
            <span key={`${item}:${index}`}>{item}</span>
          ))}
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

function AiDecisionDebugMemory({
  detail,
}: {
  detail: Record<string, unknown>;
}) {
  const rows = aiDecisionDebugMemoryRows(detail);
  const facts = aiDecisionDebugMemoryChipList(detail.facts, 6);
  const hypotheses = aiDecisionDebugMemoryHypothesisChipList(detail, 6);
  const uncertainty = aiDecisionDebugMemoryChipList(
    detail.beliefUncertainty,
    4,
  );
  const invalidations = aiDecisionDebugMemoryChipList(detail.invalidations, 5);
  if (
    rows.length === 0 &&
    facts.length === 0 &&
    hypotheses.length === 0 &&
    uncertainty.length === 0 &&
    invalidations.length === 0
  )
    return null;
  return (
    <AiDecisionDebugCollapsibleSection
      title="Was weiß die KI?"
      summary={aiDecisionDebugMemoryHeaderSummary({
        facts,
        hypotheses,
        uncertainty,
        invalidations,
      })}
      defaultOpen
    >
      <AiDecisionDebugRows rows={rows} />
      <AiDecisionDebugChips title="Bekannt" items={facts} tone="muted" />
      <AiDecisionDebugChips
        title="Hypothesen"
        items={hypotheses}
        tone="muted"
      />
      <AiDecisionDebugChips
        title="Unsicherheit"
        items={uncertainty}
        tone="muted"
      />
      <AiDecisionDebugChips
        title="Invalidierungen"
        items={invalidations}
        tone="muted"
      />
    </AiDecisionDebugCollapsibleSection>
  );
}

function aiDecisionDebugMemoryHeaderSummary({
  facts,
  hypotheses,
  uncertainty,
  invalidations,
}: {
  facts: string[];
  hypotheses: string[];
  uncertainty: string[];
  invalidations: string[];
}): string {
  return [
    facts.length > 0 ? `${facts.length} bekannt` : undefined,
    hypotheses.length > 0 ? `${hypotheses.length} Hypothesen` : undefined,
    uncertainty.length > 0 ? `${uncertainty.length} unsicher` : undefined,
    invalidations.length > 0
      ? `${invalidations.length} Invalidierungen`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function aiDecisionDebugMemoryRows(
  detail: Record<string, unknown>,
): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const memoryItems = aiDecisionDebugDetailSectionItems(
    detail,
    "semantic_memory",
    64,
  );
  const ownHandCount = aiDecisionDebugTagValue(memoryItems, "own_hand_count");
  const ownHandVisibility = aiDecisionDebugTagValue(
    memoryItems,
    "own_hand_content_visibility",
  );
  const ownHandLegalActions = aiDecisionDebugTagValue(
    memoryItems,
    "own_hand_current_legal_actions",
  );
  if (ownHandCount) {
    rows.push([
      "KI-eigene Hand",
      [
        `${ownHandCount} Karten`,
        ownHandLegalActions
          ? `${ownHandLegalActions} aktuelle LegalActions aus der Hand`
          : undefined,
        ownHandVisibility === "preview_private_section"
          ? "Details in KI-Privathand"
          : ownHandVisibility,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  if (
    aiDecisionDebugTagValue(memoryItems, "own_hand_future_play_plan_model") ===
    "not_modelled"
  ) {
    rows.push([
      "Handkarten-Planung",
      "unbezahlbare Zukunftskarten noch nicht als eigener Plan modelliert",
    ]);
  }
  const model = aiDecisionDebugRecord(detail.opponentModel);
  if (!model) return rows;
  const rnd = aiDecisionDebugRecord(model.rndTopFreshness);
  if (rnd) {
    const rawFreshness =
      typeof rnd.freshness === "string" ? rnd.freshness : undefined;
    const knownTop = aiDecisionDebugCardLabel(
      aiDecisionDebugRecord(rnd.knownTopCard),
    );
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
    rows.push([
      "R&D-Top-Wissen",
      `${knownTop ? `${knownTop} · ` : ""}${freshness} · ${known}`,
    ]);
    if (sequence) rows.push(["R&D-Sequenz", sequence]);
  }
  const hq = aiDecisionDebugRecord(model.hqHandMemory);
  if (hq) {
    rows.push(...aiDecisionDebugHqHandRows(hq));
  }
  const knownPositions = aiDecisionDebugPositionCardList(
    model.knownPositionMemory,
    6,
  );
  if (knownPositions) {
    rows.push(["Positionswissen", knownPositions]);
  } else if (typeof model.knownPositionMemoryCount === "number") {
    rows.push([
      "Positionswissen",
      model.knownPositionMemoryCount === 0
        ? "keine"
        : String(model.knownPositionMemoryCount),
    ]);
  }
  const remoteBeliefs = Array.isArray(model.remoteCardBelief)
    ? model.remoteCardBelief.length
    : undefined;
  if (remoteBeliefs !== undefined)
    rows.push([
      "Remote-Hypothesen",
      remoteBeliefs === 0 ? "keine" : String(remoteBeliefs),
    ]);
  const remoteCandidates = aiDecisionDebugRecordList(
    model.hiddenRemoteCandidateMemory,
  );
  if (remoteCandidates.length > 0) {
    rows.push([
      "Remote-Kandidaten",
      remoteCandidates
        .slice(0, 3)
        .map((entry) => {
          const candidates =
            aiDecisionDebugCardList(entry.candidateCards, 5) ||
            `${String(entry.candidateCount ?? 0)} Kandidaten`;
          const scope = entry.exhaustive === true ? "vollständig" : "offen";
          return `${String(entry.serverId ?? "remote")}: ${candidates} · ${scope} · ${String(entry.agendaCandidateCount ?? 0)} Agenda · ${String(entry.relevantTrashCandidateCount ?? 0)} Trash`;
        })
        .join(" · "),
    ]);
  }
  const runnerAggression = aiDecisionDebugRecord(model.runnerAggressionMemory);
  if (runnerAggression) {
    rows.push([
      "Runner-Runs",
      `${String(runnerAggression.runEvents ?? 0)} gesamt · ${String(runnerAggression.centralRuns ?? 0)} zentral · ${String(runnerAggression.remoteRuns ?? 0)} remote`,
    ]);
  }
  const threat = aiDecisionDebugRecord(model.runnerThreatModel);
  if (threat) {
    rows.push([
      "Runner-Druck",
      `HQ ${aiDecisionDebugPercent(threat.hqPressure)} · R&D ${aiDecisionDebugPercent(threat.rndPressure)} · Remote ${aiDecisionDebugPercent(threat.remotePressure)}`,
    ]);
  }
  if (typeof model.hqAgendaDensityEstimate === "number")
    rows.push([
      "HQ-Agenda-Heuristik",
      `${aiDecisionDebugPercent(model.hqAgendaDensityEstimate)} · grobe Schätzung`,
    ]);
  if (typeof model.rndValueEstimate === "number")
    rows.push([
      "R&D-Zugriffsheuristik",
      `${aiDecisionDebugPercent(model.rndValueEstimate)} · grobe Schätzung`,
    ]);
  if (typeof model.corpCreditReserveInterpretation === "string")
    rows.push(["Korp-Creditreserve", model.corpCreditReserveInterpretation]);
  return rows;
}

function aiDecisionDebugMemoryChipList(
  value: unknown,
  limit: number,
): string[] {
  return uniqueDisplayStrings(
    safeStringList(value, 32).map(aiDecisionDebugMemoryChipLabel),
  ).slice(0, limit);
}

function aiDecisionDebugMemoryHypothesisChipList(
  detail: Record<string, unknown>,
  limit: number,
): string[] {
  const hasStructuredHqHandMemory = Boolean(
    aiDecisionDebugRecord(
      aiDecisionDebugRecord(detail.opponentModel)?.hqHandMemory,
    ),
  );
  return uniqueDisplayStrings(
    safeStringList(detail.hypotheses, 32)
      .filter(
        (value) =>
          !(
            hasStructuredHqHandMemory &&
            value.startsWith("opponent_hidden_hand_cards:")
          ),
      )
      .map(aiDecisionDebugMemoryChipLabel),
  ).slice(0, limit);
}

function aiDecisionDebugMemoryChipLabel(value: string): string {
  if (value.startsWith("revealed_opponent_card:"))
    return `Gesehene Karte: ${value.slice("revealed_opponent_card:".length)}`;
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
    const rawCount =
      value.slice("opponent_hidden_hand_cards:".length).split(":")[0] ?? "";
    return `${rawCount} unbekannte gegnerische Handkarten`;
  }
  const labels: Record<string, string> = {
    corp_draw_event: "Korp hat gezogen",
    known_projection_only: "nur bekannte Projektion",
    remote_state_changed: "Remote-Zustand geändert",
    unknown_opponent_hand_or_hidden_zones: "unbekannte Hand oder Hidden-Zonen",
    unknown_remote_cards_remain_hypotheses:
      "Remote-Hypothesen bleiben unsicher",
    unrezzed_ice_titles_remain_unknown: "unrezzed ICE-Titel unbekannt",
  };
  const parts = value.split(":");
  const key = parts[0] ?? "";
  const suffix = parts[1];
  return suffix && labels[key]
    ? `${labels[key]}: ${suffix}`
    : (labels[value] ?? value);
}

function aiDecisionDebugRndFreshnessLabel(value: string): string {
  const labels: Record<string, string> = {
    fresh: "frisch",
    fresh_known_same_top: "frisch bekannte Topkarte",
    fresh_after_top_removed: "Topkarte entfernt",
    invalidated: "invalidiert",
    stale_known_same_top: "alte bekannte Topkarte",
    unknown: "unbekannt",
  };
  return labels[value] ?? value;
}

function aiDecisionDebugServerLabel(value: string): string {
  if (value === "hq") return "HQ";
  if (value === "rd") return "R&D";
  if (value === "archives") return "Archive";
  if (value.startsWith("remote_"))
    return `Remote ${value.slice("remote_".length)}`;
  return value;
}

function aiDecisionDebugCardLabel(
  entry: Record<string, unknown> | undefined,
): string {
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
    const count =
      typeof entry.count === "number" && entry.count > 1
        ? ` x${entry.count}`
        : "";
    const type = typeof entry.type === "string" ? ` (${entry.type})` : "";
    return `${label}${count}${type}`;
  });
  const remainder = aiDecisionDebugRecordList(value).length - entries.length;
  return remainder > 0
    ? `${labels.join(", ")} +${remainder}`
    : labels.join(", ");
}

function aiDecisionDebugPositionCardList(
  value: unknown,
  limit: number,
): string {
  const entries = aiDecisionDebugNormalizePositionCardList(
    aiDecisionDebugRecordList(value),
  ).slice(0, limit);
  if (entries.length === 0) return "";
  const labels = entries.map((entry) => {
    const position =
      typeof entry.position === "string"
        ? entry.position
        : [entry.zone, entry.positionKey]
            .filter(
              (part): part is string =>
                typeof part === "string" && part.length > 0,
            )
            .join("/");
    const label = aiDecisionDebugCardLabel(entry) || "?";
    return position ? `${position}: ${label}` : label;
  });
  const remainder =
    aiDecisionDebugNormalizePositionCardList(aiDecisionDebugRecordList(value))
      .length - entries.length;
  return remainder > 0
    ? `${labels.join(" · ")} · +${remainder}`
    : labels.join(" · ");
}

function aiDecisionDebugNormalizePositionCardList(
  entries: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const preciseRemoteCards = new Set(
    entries
      .filter((entry) => {
        const zone = typeof entry.zone === "string" ? entry.zone : "";
        const positionKey =
          typeof entry.positionKey === "string" ? entry.positionKey : "";
        return zone.startsWith("remote_") && positionKey !== "installed";
      })
      .map(
        (entry) => `${String(entry.zone)}:${aiDecisionDebugCardLabel(entry)}`,
      ),
  );
  const result = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const zone = typeof entry.zone === "string" ? entry.zone : "";
    const positionKey =
      typeof entry.positionKey === "string" ? entry.positionKey : "";
    const label = aiDecisionDebugCardLabel(entry);
    if (
      zone.startsWith("remote_") &&
      positionKey === "installed" &&
      preciseRemoteCards.has(`${zone}:${label}`)
    ) {
      continue;
    }
    const displayPosition =
      typeof entry.position === "string"
        ? entry.position
        : [zone, positionKey].filter(Boolean).join("/");
    result.set(`${displayPosition}:${label}`, entry);
  }
  return [...result.values()];
}

function aiDecisionDebugRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function aiDecisionDebugPercent(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value * 100)}%`
    : "-";
}

function AiDecisionDebugChips({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warning" | "muted";
}) {
  if (items.length === 0) return null;
  return (
    <div className={`aiDecisionDebugSection ${tone}`}>
      <strong>{title}</strong>
      <div className="aiDecisionDebugChipRow">
        {items.map((item, index) => (
          <span key={`${item}:${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function aiDecisionDebugDetailSectionItems(
  detail: Record<string, unknown>,
  sectionId: string,
  limit: number,
): string[] {
  const section = aiDecisionDebugRecordList(detail.detailSections).find(
    (entry) => entry.id === sectionId,
  );
  return safeStringList(section?.items, limit);
}

function aiDecisionDebugRecordList(
  value: unknown,
): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> =>
    Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
  );
}

function aiDecisionDebugStatusLabel(
  status: AiDecisionDebugOverlayStatus,
  traceCount: number,
): string {
  if (status === "activating") return "Aktivierung";
  if (status === "waiting")
    return traceCount > 0 ? `${traceCount} geladen` : "Wartet";
  if (status === "live")
    return traceCount > 0 ? `${traceCount} KI-Trace` : "Live";
  if (status === "error") return "Fehler";
  return "Aus";
}

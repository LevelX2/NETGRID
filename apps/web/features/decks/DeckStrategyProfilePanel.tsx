import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { copyTextToClipboard } from "../../lib/clipboard";
import { downloadTextFile } from "../../lib/download";
import { useAiDetailInformationSetting } from "../settings/ai-detail-information-setting";
import {
  readDeckStrategyProfileOpen,
  writeDeckStrategyProfileOpen,
} from "./deck-strategy-profile-state";
import {
  deckStrategyEvidenceKey,
  deckStrategyProfileEntryKey,
  deckStrategyProfileJsonExportFileName,
  formatDeckStrategyValue,
  formatStrategyScore,
  scoreWidthPercent,
  serializeDeckStrategyProfileJsonExport,
  strategyStatusLabel,
  strategyStatusTone,
  type DeckStrategyProfileEntry,
  type DeckStrategyProfileEvidenceGroup,
  type DeckStrategyProfileRunnerStrategicIntentViewer,
  type DeckStrategyProfileSection,
  type DeckStrategyProfileViewer,
  type DeckStrategyProfileViewerResponse,
} from "../../app/deck-strategy-profile-ui";

const DECK_STRATEGY_PROFILE_EXPLANATION =
  "Interne, nur lokal sichtbare KI-Analyse des aktuellen Decks. Aktive Strategieeingaben und rein diagnostische Alt- und Erklärdaten sind ausdrücklich getrennt; die Anzeige verändert weder Deck noch KI-Verhalten.";

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Korp";
}

export function DeckStrategyProfilePanel({
  response,
  loading,
}: {
  response: DeckStrategyProfileViewerResponse | null;
  loading: boolean;
}) {
  const [aiDetailInformationEnabled] = useAiDetailInformationSetting();
  const [isOpen, setIsOpen] = useState(false);
  const viewer = response?.status === "available" ? response.viewer : null;
  const unavailableReason =
    response?.status === "unavailable" ? response.reason : null;
  useEffect(() => {
    setIsOpen(
      readDeckStrategyProfileOpen(
        typeof window === "undefined" ? null : window.sessionStorage,
      ),
    );
  }, []);
  if (!aiDetailInformationEnabled) return null;

  const togglePanel = () => {
    setIsOpen((current) => {
      const next = !current;
      writeDeckStrategyProfileOpen(
        typeof window === "undefined" ? null : window.sessionStorage,
        next,
      );
      return next;
    });
  };

  return (
    <section
      className={`deckStrategyPanel ${viewer ? "" : "is-unavailable"}`}
      data-testid="deck-strategy-profile"
    >
      <div className="deckStrategyHeader">
        <div>
          <h3 title={DECK_STRATEGY_PROFILE_EXPLANATION}>
            <Bot size={16} />
            Diagnostisches KI-Deckprofil
          </h3>
          <p className="meta">
            {viewer
              ? `${sideLabel(viewer.side)} · ${viewer.cardCount} Karten · Diagnostisch · Keine direkte Planungswirkung`
              : loading
                ? "Analyse läuft"
                : "Diagnostisches KI-Deckprofil"}
          </p>
        </div>
        <button
          className="button iconOnly"
          type="button"
          aria-expanded={isOpen}
          aria-label={
            isOpen ? "KI-Deckprofil einklappen" : "KI-Deckprofil ausklappen"
          }
          title={DECK_STRATEGY_PROFILE_EXPLANATION}
          onClick={togglePanel}
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isOpen ? (
        viewer ? (
          <DeckStrategyProfileViewerPanel viewer={viewer} loading={loading} />
        ) : (
          <div className="deckStrategyUnavailable">
            <p className="notice">
              <AlertTriangle size={15} />
              KI-Deckprofil nicht verfügbar
            </p>
            <small>
              {loading
                ? "Deckprofil wird berechnet."
                : (unavailableReason ??
                  "Deckprofil konnte nicht berechnet werden")}
            </small>
          </div>
        )
      ) : null}
    </section>
  );
}

type DeckStrategyProfileExportStatus =
  | "idle"
  | "copied"
  | "copy_failed"
  | "downloaded"
  | "download_failed";

function DeckStrategyProfileViewerPanel({
  viewer,
  loading,
}: {
  viewer: DeckStrategyProfileViewer;
  loading: boolean;
}) {
  const primaryRows = viewer.strategies.filter(
    (strategy) =>
      strategy.status === "primary" || strategy.status === "secondary",
  );
  const fallbackRows =
    primaryRows.length > 0 ? primaryRows : viewer.strategies.slice(0, 3);
  const lowRows = viewer.strategies.filter(
    (strategy) => !fallbackRows.includes(strategy),
  );
  const exportJson = useMemo(
    () => serializeDeckStrategyProfileJsonExport(viewer),
    [viewer],
  );
  const exportFileName = useMemo(
    () => deckStrategyProfileJsonExportFileName(viewer),
    [viewer],
  );
  const [exportStatus, setExportStatus] =
    useState<DeckStrategyProfileExportStatus>("idle");
  useEffect(() => {
    if (exportStatus === "idle") return;
    const timeout = window.setTimeout(() => setExportStatus("idle"), 2400);
    return () => window.clearTimeout(timeout);
  }, [exportStatus]);
  const copyProfileJson = async () => {
    const copied = await copyTextToClipboard(exportJson);
    setExportStatus(copied ? "copied" : "copy_failed");
  };
  const downloadProfileJson = () => {
    const downloaded = downloadTextFile(
      exportFileName,
      exportJson,
      "application/json;charset=utf-8",
    );
    setExportStatus(downloaded ? "downloaded" : "download_failed");
  };
  const exportStatusLabel = deckStrategyProfileExportStatusLabel(exportStatus);
  return (
    <div className="deckStrategyContent" aria-busy={loading}>
      <div className="deckStrategyStatusGrid">
        {viewer.statusEntries.map((entry, index) => (
          <DeckStrategyEntryBadge
            entry={entry}
            key={deckStrategyProfileEntryKey("status", entry, index)}
          />
        ))}
      </div>
      <p className="deckStrategyDiagnosticNotice">{viewer.diagnosticNotice}</p>
      <DeckRunnerStrategicIntentSection intent={viewer.runnerStrategicIntent} />
      <div className="deckStrategyExportBar">
        <div className="deckStrategyExportTitle">
          <Download size={15} />
          <strong>JSON-Export</strong>
          <small>{exportFileName}</small>
        </div>
        <div className="deckStrategyExportActions">
          <button
            className="button"
            type="button"
            onClick={copyProfileJson}
            disabled={loading}
          >
            {exportStatus === "copied" ? (
              <Check size={14} />
            ) : (
              <Clipboard size={14} />
            )}
            JSON kopieren
          </button>
          <button
            className="button"
            type="button"
            onClick={downloadProfileJson}
            disabled={loading}
          >
            <Download size={14} />
            JSON speichern
          </button>
        </div>
        {exportStatusLabel ? (
          <small
            className={`deckStrategyExportStatus ${exportStatus.includes("failed") ? "bad" : "ok"}`}
            role="status"
            aria-live="polite"
          >
            {exportStatusLabel}
          </small>
        ) : null}
      </div>
      <DeckStrategyRows
        title="Strategien (diagnostisch)"
        strategies={fallbackRows}
        prominent
      />
      {lowRows.length > 0 ? (
        <details className="deckStrategyDetails">
          <summary>Weitere Strategien ({lowRows.length})</summary>
          <DeckStrategyRows title="" strategies={lowRows} />
        </details>
      ) : null}
      <DeckStrategySections
        title={viewer.sideProfileTitle}
        sections={viewer.sideProfileGroups}
      />
      <DeckStrategyEvidenceGroups groups={viewer.evidenceGroups} />
      <DeckStrategyFlatEntries
        title="Taktiksignale (Anzahl der Funktionssignale)"
        entries={viewer.functionSignalCounts}
        emptyText="Keine Funktionssignale."
      />
      {viewer.legacySignalGroups.length > 0 ? (
        <details className="deckStrategyDetails legacy">
          <summary>
            Alt- und Migrationssignale ({viewer.legacySignalGroups.length})
          </summary>
          <p className="meta">
            Altdaten-Signale werden getrennt gezählt und sind nicht Teil der
            neuen Zielsemantik.
          </p>
          <DeckStrategySections
            title="Altdaten und Migration"
            sections={viewer.legacySignalGroups}
          />
        </details>
      ) : null}
      <DeckStrategyWarnings warnings={viewer.warnings} />
    </div>
  );
}

function deckStrategyProfileExportStatusLabel(
  status: DeckStrategyProfileExportStatus,
): string | null {
  switch (status) {
    case "idle":
      return null;
    case "copied":
      return "JSON kopiert";
    case "copy_failed":
      return "Kopieren fehlgeschlagen";
    case "downloaded":
      return "JSON-Datei erstellt";
    case "download_failed":
      return "Download nicht möglich";
  }
}

function DeckRunnerStrategicIntentSection({
  intent,
}: {
  intent: DeckStrategyProfileRunnerStrategicIntentViewer | undefined;
}) {
  if (!intent) return null;
  return (
    <section className="deckStrategySection deckRunnerStrategicIntent">
      <h4>{intent.title}</h4>
      <p className="deckStrategyDiagnosticNotice">{intent.notice}</p>
      <div className="deckStrategyStatusGrid">
        {intent.statusEntries.map((entry, index) => (
          <DeckStrategyEntryBadge
            entry={entry}
            key={deckStrategyProfileEntryKey(
              "runner-intent-status",
              entry,
              index,
            )}
          />
        ))}
      </div>
      <DeckStrategySections
        title="Laufzeitnahe Interpretation"
        sections={intent.sections}
      />
      <DeckStrategyFlatEntries
        title="Redigierte Quellenhinweise"
        entries={intent.evidence}
        emptyText="Keine redigierten Belege."
      />
    </section>
  );
}

function DeckStrategyRows({
  title,
  strategies,
  prominent = false,
}: {
  title: string;
  strategies: DeckStrategyProfileViewer["strategies"];
  prominent?: boolean;
}) {
  if (strategies.length === 0) return null;
  return (
    <section className={`deckStrategySection ${prominent ? "prominent" : ""}`}>
      {title ? <h4>{title}</h4> : null}
      <div className="deckStrategyRows">
        {strategies.map((strategy) => (
          <article
            className={`deckStrategyRow status-${strategy.status}`}
            key={strategy.strategyId}
          >
            <div className="deckStrategyRowHead">
              <div>
                <strong>{strategy.strategyId}</strong>
                <span>{strategy.label}</span>
              </div>
              <span
                className={`deckStrategyStatus tone-${strategyStatusTone(strategy.status)}`}
              >
                {strategyStatusLabel(strategy.status)}
              </span>
            </div>
            {strategy.description ? <p>{strategy.description}</p> : null}
            <div className="deckStrategyScoreGrid">
              <DeckStrategyScoreBar
                label="Gesamt"
                value={strategy.finalScore}
              />
              <DeckStrategyScoreBar
                label="Anker"
                value={strategy.anchorScore}
              />
              <DeckStrategyScoreBar
                label="Unterstützung"
                value={strategy.supportScore}
              />
            </div>
            <div className="deckStrategyRowMeta">
              <span>
                Sicherheit {formatDeckStrategyValue(strategy.confidence)}
              </span>
              <span>Belege {strategy.evidenceCount}</span>
              <span>Lücken {strategy.gapCount}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeckStrategyScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="deckStrategyScore">
      <span>
        {label} <strong>{formatStrategyScore(value)}</strong>
      </span>
      <span className="deckStrategyScoreTrack" aria-hidden="true">
        <span
          className="deckStrategyScoreFill"
          style={{ width: scoreWidthPercent(value) }}
        />
      </span>
    </span>
  );
}

function DeckStrategySections({
  title,
  sections,
}: {
  title: string;
  sections: DeckStrategyProfileSection[];
}) {
  return (
    <section className="deckStrategySection">
      <h4>{title}</h4>
      {sections.length > 0 ? (
        <div className="deckStrategySectionGrid">
          {sections.map((section) => (
            <section className="deckStrategyMetricGroup" key={section.key}>
              <h5>{section.title}</h5>
              <DeckStrategyEntryList
                entries={section.entries}
                emptyText={section.emptyText ?? "Keine Daten."}
                sectionKey={section.key}
              />
            </section>
          ))}
        </div>
      ) : (
        <p className="meta">Keine Profildaten.</p>
      )}
    </section>
  );
}

function DeckStrategyEvidenceGroups({
  groups,
}: {
  groups: DeckStrategyProfileEvidenceGroup[];
}) {
  return (
    <section className="deckStrategySection">
      <h4>Strategiebelege und Lücken</h4>
      {groups.length > 0 ? (
        <div className="deckStrategyEvidenceGroups">
          {groups.map((group, index) => (
            <details
              className="deckStrategyEvidenceGroup"
              open={index < 2}
              key={group.strategyId}
            >
              <summary>
                <span>{group.strategyId}</span>
                <small>
                  {group.anchorEvidence.length} Anker ·{" "}
                  {group.supportEvidence.length} Unterstützung ·{" "}
                  {group.supportGaps.length} Lücken
                </small>
              </summary>
              {group.description ? (
                <p className="meta">{group.description}</p>
              ) : null}
              <div className="deckStrategyEvidenceColumns">
                <section>
                  <h5>Ankerbelege</h5>
                  {group.anchorEvidence.length > 0 ? (
                    <div className="deckStrategyEvidenceList">
                      {group.anchorEvidence.map((entry, entryIndex) => (
                        <span
                          className="deckStrategyEvidenceItem"
                          key={deckStrategyEvidenceKey(
                            group.strategyId,
                            entry.source,
                            entry.cardId,
                            entryIndex,
                          )}
                        >
                          <strong>{entry.cardTitle}</strong>
                          <small>
                            {entry.quantity}x · {entry.signal ?? entry.source}
                            {entry.role ? ` · ${entry.role}` : ""}
                          </small>
                          <small>{entry.reason}</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="meta">Keine Ankerbelege.</p>
                  )}
                </section>
                <section>
                  <h5>Unterstützungsbelege</h5>
                  {group.supportEvidence.length > 0 ? (
                    <div className="deckStrategyEvidenceList">
                      {group.supportEvidence.map((entry, entryIndex) => (
                        <span
                          className="deckStrategyEvidenceItem"
                          key={deckStrategyEvidenceKey(
                            group.strategyId,
                            "support",
                            entry.signal,
                            entryIndex,
                          )}
                        >
                          <strong>{entry.signal}</strong>
                          <small>
                            {formatDeckStrategyValue(entry.category)} ·{" "}
                            {entry.count} Karten
                          </small>
                          <small>{entry.exampleCards.join(", ")}</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="meta">Keine Unterstützungsbelege.</p>
                  )}
                </section>
                <section>
                  <h5>Unterstützungslücken</h5>
                  {group.supportGaps.length > 0 ? (
                    <div className="deckStrategyEvidenceList">
                      {group.supportGaps.map((gap, gapIndex) => (
                        <span
                          className={`deckStrategyEvidenceItem tone-${gap.tone}`}
                          key={deckStrategyEvidenceKey(
                            group.strategyId,
                            "gap",
                            gap.gapName,
                            gapIndex,
                          )}
                        >
                          <strong>{gap.gapName}</strong>
                          <small>{gap.strategyId}</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="meta">Keine Unterstützungslücken.</p>
                  )}
                </section>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="meta">Keine Beleggruppen.</p>
      )}
    </section>
  );
}

function DeckStrategyFlatEntries({
  title,
  entries,
  emptyText,
}: {
  title: string;
  entries: DeckStrategyProfileEntry[];
  emptyText: string;
}) {
  return (
    <section className="deckStrategySection">
      <h4>{title}</h4>
      <DeckStrategyEntryList
        entries={entries}
        emptyText={emptyText}
        sectionKey={title}
      />
    </section>
  );
}

function DeckStrategyEntryList({
  entries,
  emptyText,
  sectionKey,
}: {
  entries: DeckStrategyProfileEntry[];
  emptyText: string;
  sectionKey: string;
}) {
  if (entries.length === 0) return <p className="meta">{emptyText}</p>;
  return (
    <div className="deckStrategyEntryList">
      {entries.map((entry, index) => (
        <DeckStrategyEntryBadge
          entry={entry}
          key={deckStrategyProfileEntryKey(sectionKey, entry, index)}
        />
      ))}
    </div>
  );
}

function DeckStrategyEntryBadge({
  entry,
}: {
  entry: DeckStrategyProfileEntry;
}) {
  return (
    <span className={`deckStrategyEntry tone-${entry.tone}`}>
      <span>{entry.label}</span>
      <strong>{entry.value}</strong>
      {entry.detail ? <small>{entry.detail}</small> : null}
    </span>
  );
}

function DeckStrategyWarnings({
  warnings,
}: {
  warnings: DeckStrategyProfileViewer["warnings"];
}) {
  return (
    <section className="deckStrategySection">
      <h4>Prüfpunkte und Hinweise</h4>
      {warnings.length > 0 ? (
        <div className="deckStrategyEntryList">
          {warnings.map((warning, index) => (
            <span
              className={`deckStrategyEntry tone-${warning.tone}`}
              key={`${warning.label}-${index}-${warning.value}`}
            >
              <span>{warning.label}</span>
              <strong>{formatDeckStrategyValue(warning.value)}</strong>
            </span>
          ))}
        </div>
      ) : (
        <p className="meta">Keine Warnungen.</p>
      )}
    </section>
  );
}

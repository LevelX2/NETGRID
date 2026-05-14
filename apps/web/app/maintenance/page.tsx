"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Database, Eye, ListFilter, RefreshCcw, ShieldCheck } from "lucide-react";
import {
  buildMaintenanceMatchQuery,
  EMPTY_MAINTENANCE_FILTERS,
  findForbiddenMaintenanceMarkers,
  formatAge,
  formatBytes,
  modeLabel,
  participantsLabel,
  resolveMaintenanceServerHttp,
  statusLabel,
  type MaintenanceFilters,
  type MaintenanceMatchDetail,
  type MaintenanceMatchEntry,
  type MaintenanceSummary
} from "../maintenance";

const CONFIGURED_SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

export default function MaintenancePage() {
  const [serverHttp] = useState(() => resolveMaintenanceServerHttp(CONFIGURED_SERVER_HTTP, typeof window === "undefined" ? undefined : window.location.hostname));
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);
  const [matches, setMatches] = useState<MaintenanceMatchEntry[]>([]);
  const [detail, setDetail] = useState<MaintenanceMatchDetail | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [filters, setFilters] = useState<MaintenanceFilters>(EMPTY_MAINTENANCE_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/summary`);
    const payload = (await response.json()) as MaintenanceSummary | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Wartungsdaten konnten nicht geladen werden." : "Wartungsdaten konnten nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Wartungsdaten wurden wegen Redaktionsprüfung blockiert.");
    setSummary(payload as MaintenanceSummary);
  };

  const loadMatches = async (nextFilters = filters) => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/matches${buildMaintenanceMatchQuery(nextFilters)}`);
    const payload = (await response.json()) as { matches?: MaintenanceMatchEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "Matchliste konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Matchliste wurde wegen Redaktionsprüfung blockiert.");
    const nextMatches = payload.matches ?? [];
    setMatches(nextMatches);
    if (!selectedMatchId && nextMatches[0]) setSelectedMatchId(nextMatches[0].matchId);
  };

  const loadDetail = async (matchId: string) => {
    if (!matchId) {
      setDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}/api/storage/maintenance/matches/${encodeURIComponent(matchId)}`);
    const payload = (await response.json()) as MaintenanceMatchDetail | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Matchdetail konnte nicht geladen werden." : "Matchdetail konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Matchdetail wurde wegen Redaktionsprüfung blockiert.");
    setDetail(payload as MaintenanceMatchDetail);
  };

  const refresh = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadSummary(), loadMatches(nextFilters)]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Wartungsdaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    let closed = false;
    if (!selectedMatchId) {
      setDetail(null);
      return;
    }
    setError("");
    loadDetail(selectedMatchId)
      .catch((detailError) => {
        if (!closed) setError(detailError instanceof Error ? detailError.message : "Matchdetail konnte nicht geladen werden.");
      });
    return () => {
      closed = true;
    };
  }, [selectedMatchId]);

  const statusRows = useMemo(() => Object.entries(summary?.matchCountsByStatus ?? {}).sort(([a], [b]) => a.localeCompare(b)), [summary]);
  const modeRows = useMemo(() => Object.entries(summary?.matchCountsByMode ?? {}).sort(([a], [b]) => a.localeCompare(b)), [summary]);

  const applyFilters = () => void refresh(filters);

  return (
    <main style={page}>
      <header style={header}>
        <div style={headerTitle}>
          <Database size={24} aria-hidden="true" />
          <div>
            <h1 style={h1}>Storage Maintenance</h1>
            <p style={subtle}>Backend 0.5 · lokale read-only Wartungsansicht</p>
          </div>
        </div>
        <button type="button" style={button} onClick={() => void refresh()} disabled={loading} title="Aktualisieren">
          <RefreshCcw size={16} aria-hidden="true" />
          Aktualisieren
        </button>
      </header>

      {error ? <p style={errorBox}>{error}</p> : null}

      {summary ? (
        <>
          <section style={grid4}>
            <Metric label="DB-Größe" value={formatBytes(summary.database.fileSizeBytes)} />
            <Metric label="Matches" value={String(summary.matchCount)} />
            <Metric label="Terminal" value={String(summary.terminalCount)} />
            <Metric label="Nicht-terminal" value={String(summary.nonTerminalCount)} />
          </section>

          <section style={twoCols}>
            <Panel title="Statusverteilung">
              <MiniRows rows={statusRows.map(([key, value]) => [statusLabel(key), String(value)])} />
            </Panel>
            <Panel title="Modusverteilung">
              <MiniRows rows={modeRows.map(([key, value]) => [modeLabel(key), String(value)])} />
            </Panel>
          </section>

          <section style={twoCols}>
            <Panel title="Tabellen und Payloads">
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Bereich</th>
                      <th style={th}>Zeilen</th>
                      <th style={th}>Größe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.tableSizes.map((row) => (
                      <tr key={row.key}>
                        <td style={td}>{row.label}</td>
                        <td style={td}>{row.rowCount}</td>
                        <td style={td}>{formatBytes(row.approximatePayloadBytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="Größte Matches">
              <MiniRows rows={summary.largestMatches.slice(0, 6).map((match) => [shortId(match.matchId), formatBytes(match.sizes.approximateTotalBytes)])} />
            </Panel>
          </section>
        </>
      ) : null}

      <section style={panel}>
        <div style={panelHeader}>
          <h2 style={h2}>
            <ListFilter size={18} aria-hidden="true" />
            Matchliste
          </h2>
          <button type="button" style={button} onClick={applyFilters} disabled={loading} title="Filter anwenden">
            <Eye size={16} aria-hidden="true" />
            Anwenden
          </button>
        </div>
        <div style={filtersGrid}>
          <Select label="Status" value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={statusOptions} />
          <Select label="Terminal" value={filters.terminal} onChange={(terminal) => setFilters((current) => ({ ...current, terminal: terminal as MaintenanceFilters["terminal"] }))} options={terminalOptions} />
          <Select label="Modus" value={filters.mode} onChange={(mode) => setFilters((current) => ({ ...current, mode }))} options={modeOptions} />
          <Input label="Älter als Tage" value={filters.olderThanDays} onChange={(olderThanDays) => setFilters((current) => ({ ...current, olderThanDays }))} />
          <Input label="Größer als MiB" value={filters.largerThanMiB} onChange={(largerThanMiB) => setFilters((current) => ({ ...current, largerThanMiB }))} />
        </div>
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Match</th>
                <th style={th}>Status</th>
                <th style={th}>Modus</th>
                <th style={th}>Beteiligte</th>
                <th style={th}>Alter</th>
                <th style={th}>Version</th>
                <th style={th}>Events</th>
                <th style={th}>Snapshots</th>
                <th style={th}>Größe</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.matchId} style={selectedMatchId === match.matchId ? selectedRow : undefined} onClick={() => setSelectedMatchId(match.matchId)}>
                  <td style={td}><code>{shortId(match.matchId)}</code></td>
                  <td style={td}>{statusLabel(match.status)}</td>
                  <td style={td}>{modeLabel(match.mode)}</td>
                  <td style={td}>{participantsLabel(match.participants)}</td>
                  <td style={td}>{formatAge(match.ageSeconds)}</td>
                  <td style={td}>{match.stateVersion ?? "-"} / {match.matchVersion}</td>
                  <td style={td}>{match.eventCount}</td>
                  <td style={td}>{match.snapshotCount}</td>
                  <td style={td}>{formatBytes(match.sizes.approximateTotalBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail ? (
        <section style={panel}>
          <div style={panelHeader}>
            <h2 style={h2}>
              <ShieldCheck size={18} aria-hidden="true" />
              Matchdetail
            </h2>
            <code>{detail.matchId}</code>
          </div>
          <div style={detailGrid}>
            <Metric label="Status" value={statusLabel(detail.status)} />
            <Metric label="Modus" value={modeLabel(detail.mode)} />
            <Metric label="State / Match" value={`${detail.stateVersion ?? "-"} / ${detail.matchVersion}`} />
            <Metric label="Größe" value={formatBytes(detail.sizes.approximateTotalBytes)} />
            <Metric label="Events" value={String(detail.eventCount)} />
            <Metric label="Snapshots" value={String(detail.snapshotCount)} />
          </div>
          <MiniRows
            rows={[
              ["Erstellt", new Date(detail.createdAt).toLocaleString("de-DE")],
              ["Aktualisiert", new Date(detail.updatedAt).toLocaleString("de-DE")],
              ["Beteiligte", participantsLabel(detail.participants)],
              ["Match-Record", formatBytes(detail.sizes.matchRecordBytes)],
              ["Aktueller Zustand", formatBytes(detail.sizes.gameStateBytes)],
              ["Events", formatBytes(detail.sizes.eventPayloadBytes)],
              ["Snapshots", formatBytes(detail.sizes.stateSnapshotBytes)],
              ["Deck-Snapshot-Blöcke", formatBytes(detail.sizes.deckSnapshotBytes)],
              ["Cleanup", detail.cleanupAssessment.reason]
            ]}
          />
        </section>
      ) : null}

      <section style={disabledPanel}>
        <h2 style={h2}>Cleanup</h2>
        <p style={subtle}>Noch nicht aktiv. Dieser erste Schnitt bleibt read-only; Löschen wird erst nach vollständigem Backup-, Dry-Run- und Restore-Gate freigeschaltet.</p>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metric}>
      <span style={metricLabel}>{label}</span>
      <strong style={metricValue}>{value}</strong>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function MiniRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div style={miniRows}>
      {rows.length === 0 ? <span style={subtle}>Keine Daten</span> : null}
      {rows.map(([label, value]) => (
        <div key={`${label}:${value}`} style={miniRow}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={input}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="numeric" style={input} />
    </label>
  );
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 12)}…${value.slice(-4)}` : value;
}

const statusOptions: Array<[string, string]> = [
  ["", "Alle"],
  ["pending", "Lobby offen"],
  ["waiting_for_runner", "Wartet auf Runner"],
  ["waiting_for_corp", "Wartet auf Korp"],
  ["waiting_for_joiner_decks", "Wartet auf Deckwahl"],
  ["ready_check", "Bereitschaft"],
  ["countdown", "Countdown"],
  ["active", "Aktiv"],
  ["cancelled", "Abgebrochen"],
  ["abandoned", "Verlassen"],
  ["forfeited", "Aufgegeben"],
  ["finished", "Beendet"]
];

const terminalOptions: Array<[string, string]> = [
  ["all", "Alle"],
  ["false", "Nicht-terminal"],
  ["true", "Terminal"]
];

const modeOptions: Array<[string, string]> = [
  ["", "Alle"],
  ["human_vs_human", "Mensch gegen Mensch"],
  ["human_runner_vs_corp_ai", "Runner gegen Korp-KI"],
  ["human_corp_vs_runner_ai", "Korp gegen Runner-KI"]
];

const page: CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "1.25rem", display: "grid", gap: "1rem", color: "#102033" };
const header: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" };
const headerTitle: CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem" };
const h1: CSSProperties = { margin: 0, fontSize: "1.55rem", letterSpacing: 0 };
const h2: CSSProperties = { margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", letterSpacing: 0 };
const subtle: CSSProperties = { margin: 0, color: "#526273", fontSize: "0.92rem" };
const button: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4rem", border: "1px solid #bac7d5", background: "#fff", color: "#102033", borderRadius: 6, padding: "0.5rem 0.7rem", cursor: "pointer" };
const grid4: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" };
const twoCols: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.75rem" };
const panel: CSSProperties = { border: "1px solid #d8e0e8", borderRadius: 8, padding: "0.85rem", background: "#fff", display: "grid", gap: "0.75rem" };
const disabledPanel: CSSProperties = { ...panel, background: "#f6f8fb" };
const panelHeader: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" };
const metric: CSSProperties = { border: "1px solid #d8e0e8", borderRadius: 8, padding: "0.75rem", background: "#fff", display: "grid", gap: "0.25rem", minWidth: 0 };
const metricLabel: CSSProperties = { color: "#526273", fontSize: "0.8rem" };
const metricValue: CSSProperties = { fontSize: "1.15rem", overflowWrap: "anywhere" };
const miniRows: CSSProperties = { display: "grid", gap: "0.35rem" };
const miniRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid #edf1f5", padding: "0.2rem 0" };
const tableWrap: CSSProperties = { overflowX: "auto" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 820 };
const th: CSSProperties = { textAlign: "left", fontSize: "0.8rem", color: "#526273", borderBottom: "1px solid #cbd5e1", padding: "0.45rem 0.5rem", whiteSpace: "nowrap" };
const td: CSSProperties = { borderBottom: "1px solid #edf1f5", padding: "0.45rem 0.5rem", verticalAlign: "top", fontSize: "0.86rem" };
const selectedRow: CSSProperties = { background: "#eef6ff", cursor: "pointer" };
const filtersGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" };
const field: CSSProperties = { display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: "#526273" };
const input: CSSProperties = { minHeight: 34, border: "1px solid #bac7d5", borderRadius: 6, padding: "0.35rem 0.45rem", background: "#fff", color: "#102033" };
const detailGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" };
const errorBox: CSSProperties = { margin: 0, border: "1px solid #f3b5b5", background: "#fff5f5", color: "#9b1c1c", borderRadius: 8, padding: "0.7rem" };

"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Bot, CheckCircle2, Download, LoaderCircle, RefreshCcw } from "lucide-react";
import {
  aiTraceActionRows,
  aiTraceMetaRows,
  aiTraceTitle,
  buildMaintenanceAiTraceEnablePath,
  buildMaintenanceAiTraceIndexPath,
  buildMaintenanceAiTraceNdjsonExport,
  findForbiddenMaintenanceMarkers,
  latestMaintenanceAiTraceId,
  mergeMaintenanceAiTraceIndex,
  mergeMaintenanceAiTraceMatches,
  modeLabel,
  resolveMaintenanceServerHttp,
  safeStringList,
  statusLabel,
  type MaintenanceAiTraceDetail,
  type MaintenanceAiTraceIndexEntry,
  type MaintenanceAiTraceMatchEntry,
  type MaintenanceMatchDetail
} from "../../maintenance";

const CONFIGURED_SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

export default function AiTraceMaintenancePage() {
  const [serverHttp] = useState(() => resolveMaintenanceServerHttp(CONFIGURED_SERVER_HTTP, typeof window === "undefined" ? undefined : window.location.hostname));
  const [matches, setMatches] = useState<MaintenanceAiTraceMatchEntry[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<MaintenanceMatchDetail | null>(null);
  const [traceIndex, setTraceIndex] = useState<MaintenanceAiTraceIndexEntry[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState("");
  const [traceDetail, setTraceDetail] = useState<MaintenanceAiTraceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activationLoading, setActivationLoading] = useState(false);
  const [liveFollow, setLiveFollow] = useState(true);
  const [followPaused, setFollowPaused] = useState(false);
  const [clientHydrated, setClientHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const matchesById = useMemo(() => new Map(matches.map((match) => [match.matchId, match])), [matches]);
  const selectedTraceMatch = matchesById.get(selectedMatchId);
  const selectedMatchCanEnable = Boolean(selectedMatchDetail && !selectedMatchDetail.terminal && selectedMatchDetail.mode !== "human_vs_human" && !selectedTraceMatch);
  const hydratedDisabled = (disabled: boolean) => (clientHydrated && disabled ? true : undefined);

  const loadTraceMatches = async (preserveMatch?: MaintenanceAiTraceMatchEntry) => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/ai-decision-traces/matches`, { cache: "no-store" });
    const payload = (await response.json()) as { matches?: MaintenanceAiTraceMatchEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Matches konnten nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Matches wurden wegen Redaktionsprüfung blockiert.");
    const nextMatches = preserveMatch ? mergeMaintenanceAiTraceMatches(payload.matches ?? [], [preserveMatch]) : payload.matches ?? [];
    setMatches(nextMatches);
    setSelectedMatchId((current) => current || initialMatchId() || (nextMatches[0]?.matchId ?? ""));
  };

  const loadMatchDetail = async (matchId: string) => {
    if (!matchId) {
      setSelectedMatchDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}/api/storage/maintenance/matches/${encodeURIComponent(matchId)}`, { cache: "no-store" });
    const payload = (await response.json()) as MaintenanceMatchDetail | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Matchdetail konnte nicht geladen werden." : "Matchdetail konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Matchdetail wurde wegen Redaktionsprüfung blockiert.");
    setSelectedMatchDetail(payload as MaintenanceMatchDetail);
  };

  const loadTraceIndex = async (matchId: string) => {
    if (!matchId) {
      setTraceIndex([]);
      setSelectedTraceId("");
      setTraceDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceIndexPath(matchId)}`, { cache: "no-store" });
    const payload = (await response.json()) as { traces?: MaintenanceAiTraceIndexEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Timeline konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Timeline wurde wegen Redaktionsprüfung blockiert.");
    const traces = payload.traces ?? [];
    setTraceIndex(traces);
    setSelectedTraceId((current) => current && traces.some((trace) => trace.traceId === current) ? current : latestMaintenanceAiTraceId(traces));
  };

  const pollTraceUpdates = async (matchId: string) => {
    const afterDecisionIndex = traceIndex.at(-1)?.decisionIndex;
    const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceIndexPath(matchId, afterDecisionIndex)}`, { cache: "no-store" });
    const payload = (await response.json()) as { traces?: MaintenanceAiTraceIndexEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Live-Follow konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Live-Follow wurde wegen Redaktionsprüfung blockiert.");
    const incoming = payload.traces ?? [];
    if (incoming.length === 0) return;
    setTraceIndex((current) => mergeMaintenanceAiTraceIndex(current, incoming));
    setSelectedTraceId(latestMaintenanceAiTraceId(incoming));
    await loadTraceMatches();
  };

  const loadTraceDetail = async (traceId: string) => {
    if (!traceId) {
      setTraceDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}/api/storage/maintenance/ai-decision-traces/${encodeURIComponent(traceId)}`, { cache: "no-store" });
    const payload = (await response.json()) as MaintenanceAiTraceDetail | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "KI-Trace-Detail konnte nicht geladen werden." : "KI-Trace-Detail konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Detail wurde wegen Redaktionsprüfung blockiert.");
    setTraceDetail(payload as MaintenanceAiTraceDetail);
  };

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      await loadTraceMatches();
      const matchId = selectedMatchId || initialMatchId();
      if (matchId) await Promise.allSettled([loadMatchDetail(matchId), loadTraceIndex(matchId)]);
      setNotice("KI-Trace-Daten geladen.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "KI-Trace-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const enableSelectedMatch = async () => {
    if (!selectedMatchId) return;
    setActivationLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceEnablePath(selectedMatchId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "detailed" })
      });
      const payload = (await response.json()) as { match?: MaintenanceAiTraceMatchEntry; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "KI-Tracing konnte nicht aktiviert werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("KI-Trace-Aktivierung wurde wegen Redaktionsprüfung blockiert.");
      if (!payload.match) throw new Error("KI-Tracing wurde aktiviert, aber die Wartungsantwort enthielt keinen Matchstatus.");
      setMatches((current) => mergeMaintenanceAiTraceMatches(current, [payload.match!]));
      setNotice(`KI-Tracing ist für Match ${shortId(selectedMatchId)} aktiv.`);
      await Promise.allSettled([loadTraceMatches(payload.match), loadTraceIndex(selectedMatchId), loadMatchDetail(selectedMatchId)]);
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "KI-Tracing konnte nicht aktiviert werden.");
    } finally {
      setActivationLoading(false);
    }
  };

  const exportTraceIndex = () => {
    if (!selectedMatchId || traceIndex.length === 0) return;
    const output = buildMaintenanceAiTraceNdjsonExport({ matchId: selectedMatchId, generatedAt: new Date().toISOString(), traces: traceIndex });
    const blob = new Blob([output], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `netgrid-ai-traces-${selectedMatchId}.ndjson`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setClientHydrated(true);
  }, []);

  useEffect(() => {
    setSelectedMatchId(initialMatchId());
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    setFollowPaused(false);
    setError("");
    void Promise.allSettled([loadMatchDetail(selectedMatchId), loadTraceIndex(selectedMatchId)]).then((results) => {
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (rejected) setError(rejected.reason instanceof Error ? rejected.reason.message : "KI-Trace konnte nicht geladen werden.");
    });
  }, [selectedMatchId]);

  useEffect(() => {
    if (!selectedTraceId) {
      setTraceDetail(null);
      return;
    }
    void loadTraceDetail(selectedTraceId).catch((detailError) => setError(detailError instanceof Error ? detailError.message : "KI-Trace-Detail konnte nicht geladen werden."));
  }, [selectedTraceId]);

  useEffect(() => {
    if (!selectedMatchId || !liveFollow || followPaused) return;
    let closed = false;
    const timer = window.setInterval(() => {
      pollTraceUpdates(selectedMatchId).catch((pollError) => {
        if (!closed) setError(pollError instanceof Error ? pollError.message : "KI-Trace-Live-Follow konnte nicht geladen werden.");
      });
    }, 1500);
    return () => {
      closed = true;
      window.clearInterval(timer);
    };
  }, [selectedMatchId, liveFollow, followPaused, traceIndex]);

  return (
    <main style={pageShell}>
      <div style={page}>
        <header style={header}>
          <div style={headerTitle}>
            <Bot size={24} aria-hidden="true" />
            <div>
              <h1 style={h1}>KI-Trace</h1>
              <p style={subtle}>Separate Live-Ansicht für KI-Entscheidungen.</p>
            </div>
          </div>
          <div style={buttonRow}>
            <a href="/maintenance" style={linkButton}>Storage Maintenance</a>
            <button type="button" style={button} onClick={() => void refresh()} disabled={hydratedDisabled(loading)}>
              {loading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <RefreshCcw size={16} aria-hidden="true" />}
              {loading ? "Lädt" : "Aktualisieren"}
            </button>
          </div>
        </header>

        {notice ? <p style={successBox} role="status"><CheckCircle2 size={16} aria-hidden="true" />{notice}</p> : null}
        {error ? <p style={errorBox} role="alert">{error}</p> : null}

        <section style={traceLayout}>
          <aside style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={h2}>Matches</h2>
                <p style={subtle}>{matches.length === 0 ? "Noch kein aktivierter Trace." : `${matches.length} Trace-Matches`}</p>
              </div>
              <button type="button" style={button} onClick={() => void loadTraceMatches().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "KI-Trace-Matches konnten nicht geladen werden."))}>
                <RefreshCcw size={16} aria-hidden="true" />
              </button>
            </div>
            <MatchJump selectedMatchId={selectedMatchId} clientHydrated={clientHydrated} onSelect={setSelectedMatchId} />
            {selectedMatchCanEnable ? (
              <button type="button" style={button} onClick={() => void enableSelectedMatch()} disabled={hydratedDisabled(activationLoading)}>
                {activationLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <Bot size={16} aria-hidden="true" />}
                {activationLoading ? "Aktiviert" : "Trace für dieses Match aktivieren"}
              </button>
            ) : null}
            <div style={traceList}>
              {matches.map((match) => (
                <button key={match.matchId} type="button" style={selectedMatchId === match.matchId ? traceItemSelected : traceItem} onClick={() => setSelectedMatchId(match.matchId)}>
                  <span><code>{shortId(match.matchId)}</code> · {modeLabel(match.mode)}</span>
                  <strong>{match.traceCount}</strong>
                  <small>{match.lastTraceAt ? new Date(match.lastTraceAt).toLocaleString("de-DE") : `aktiv · ${match.aiTraceMode}`}</small>
                </button>
              ))}
            </div>
          </aside>

          <section style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={h2}>Timeline</h2>
                <p style={subtle}>{selectedMatchId ? `${shortId(selectedMatchId)} · ${selectedMatchDetail ? `${statusLabel(selectedMatchDetail.status)} · ${modeLabel(selectedMatchDetail.mode)}` : "Match wird geladen"}` : "Kein Match ausgewählt"}</p>
              </div>
              <div style={buttonRow}>
                <button type="button" style={button} onClick={() => setLiveFollow((current) => !current)}>
                  <Bot size={16} aria-hidden="true" />
                  {liveFollow ? "Live an" : "Live aus"}
                </button>
                <button type="button" style={button} onClick={() => setFollowPaused((current) => !current)} disabled={hydratedDisabled(!liveFollow)}>
                  {followPaused ? "Fortsetzen" : "Pausieren"}
                </button>
                <button type="button" style={button} onClick={exportTraceIndex} disabled={hydratedDisabled(!selectedMatchId || traceIndex.length === 0)}>
                  <Download size={16} aria-hidden="true" />
                  Export
                </button>
              </div>
            </div>
            {selectedMatchId && !selectedTraceMatch && !selectedMatchCanEnable ? <p style={infoBox}>Für dieses Match ist noch kein KI-Trace bekannt oder es ist nicht aktivierbar.</p> : null}
            {selectedTraceMatch?.traceCount === 0 ? <p style={infoBox}>KI-Tracing ist aktiv; die nächste KI-Entscheidung erscheint hier automatisch.</p> : null}
            <div style={traceListWide}>
              {traceIndex.map((trace) => (
                <button key={trace.traceId} type="button" style={selectedTraceId === trace.traceId ? traceItemSelected : traceItem} onClick={() => { setSelectedTraceId(trace.traceId); if (trace.traceId !== latestMaintenanceAiTraceId(traceIndex)) setFollowPaused(true); }}>
                  <span>{aiTraceTitle(trace)}</span>
                  <small>State {trace.stateVersion} · {trace.confidence === undefined ? "Vertrauen -" : `${Math.round(trace.confidence * 100)}%`}</small>
                </button>
              ))}
            </div>
            {traceDetail ? <AiTraceDetailView trace={traceDetail} /> : null}
          </section>
        </section>
      </div>
    </main>
  );
}

function MatchJump({ selectedMatchId, clientHydrated, onSelect }: { selectedMatchId: string; clientHydrated: boolean; onSelect: (matchId: string) => void }) {
  const [draft, setDraft] = useState(selectedMatchId);
  useEffect(() => setDraft(selectedMatchId), [selectedMatchId]);
  return (
    <form style={jumpForm} onSubmit={(event) => { event.preventDefault(); onSelect(draft.trim()); }}>
      <label style={field}>
        Match-ID
        <input value={draft} onChange={(event) => setDraft(event.target.value)} style={input} />
      </label>
      <button type="submit" style={button} disabled={clientHydrated && !draft.trim() ? true : undefined}>Öffnen</button>
    </form>
  );
}

function AiTraceDetailView({ trace }: { trace: MaintenanceAiTraceDetail }) {
  const detail = trace.detail;
  const alternatives = recordList(detail.rankedAlternatives).slice(0, 5);
  const actionRows = aiTraceActionRows(detail);
  const scoreBreakdown = recordList(detail.scoreBreakdown).slice(0, 16);
  const detailSections = recordList(detail.detailSections).slice(0, 8);
  return (
    <div style={detailPanel}>
      <div style={panelHeader}>
        <div>
          <h3 style={h3}>{aiTraceTitle(trace)}</h3>
          <p style={subtle}>{typeof detail.summary === "string" ? detail.summary : trace.eventId}</p>
        </div>
        <code>{shortId(trace.traceId)}</code>
      </div>
      <div style={detailGrid}>
        {aiTraceMetaRows(trace).map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </div>
      <TraceSection title="Warnmarker" items={[...safeStringList(detail.warnings), ...(detail.fallbackUsed === true ? ["fallback"] : []), ...(detail.timeoutUsed === true ? ["timeout"] : [])]} />
      <TraceSection title="Sichtbare Gründe" items={safeStringList(detail.visibleReasons)} />
      <TraceSection title="Langfristplan" items={safeStringList(detail.longTermPlan)} />
      {actionRows.length > 0 ? (
        <details style={traceDetails} open>
          <summary>Action-Level</summary>
          <div style={traceCardGrid}>
            {actionRows.map((action) => (
              <div key={action.key} style={action.selected ? traceActionCardSelected : traceActionCard}>
                <div style={traceActionHeader}>
                  <strong>#{action.rank} · {action.label}</strong>
                  <span style={action.selected ? traceSelectedPill : traceMutedPill}>{action.selected ? "ausgeführt" : action.debugSelected ? "Debug-Auswahl" : "Alternative"}</span>
                </div>
                <MiniRows rows={[["Quelle", action.source], ["Priority", action.priority], ["Grund", action.reason]]} />
                {action.metrics.length > 0 ? <TraceSection title="Kennzahlen" items={action.metrics} compact /> : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
      <details style={traceDetails} open>
        <summary>Top-Alternativen</summary>
        {alternatives.length === 0 ? <p style={subtle}>Keine Alternativen im Trace.</p> : null}
        <div style={traceCardGrid}>
          {alternatives.map((alternative, index) => (
            <div key={`${String(alternative.planId ?? "alt")}-${index}`} style={traceCard}>
              <strong>#{String(alternative.rank ?? index + 1)} · {String(alternative.planKind ?? alternative.selectedActionType ?? "Alternative")}</strong>
              <span>{typeof alternative.score === "number" ? `Score ${alternative.score}` : "Score -"}</span>
              <TraceSection title="Warum nicht" items={safeStringList(alternative.whyNot, 4)} compact />
            </div>
          ))}
        </div>
      </details>
      <details style={traceDetails}>
        <summary>Score-Komponenten</summary>
        {scoreBreakdown.length === 0 ? <p style={subtle}>Keine Score-Komponenten im Trace.</p> : null}
        <MiniRows rows={scoreBreakdown.map((component) => [String(component.label ?? component.key ?? "Komponente"), typeof component.value === "number" ? component.value.toFixed(2) : String(component.value ?? "-")])} />
      </details>
      {detailSections.map((section) => (
        <TraceSection key={String(section.id ?? section.title)} title={String(section.title ?? section.id ?? "Detail")} items={safeStringList(section.items, 12)} collapsible />
      ))}
    </div>
  );
}

function TraceSection({ title, items, compact = false, collapsible = false }: { title: string; items: string[]; compact?: boolean; collapsible?: boolean }) {
  if (items.length === 0) return null;
  const content = <div style={compact ? traceChipsCompact : traceChips}>{items.map((item) => <span key={item} style={traceChip}>{item}</span>)}</div>;
  if (collapsible) return <details style={traceDetails}><summary>{title}</summary>{content}</details>;
  return <div style={traceSection}><strong>{title}</strong>{content}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={metric}><span style={metricLabel}>{label}</span><strong style={metricValue}>{value}</strong></div>;
}

function MiniRows({ rows }: { rows: Array<[string, string]> }) {
  return <div style={miniRows}>{rows.map(([label, value]) => <div key={`${label}:${value}`} style={miniRow}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function recordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function initialMatchId(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("matchId")?.trim() ?? "";
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 12)}…${value.slice(-4)}` : value;
}

const pageShell: CSSProperties = { minHeight: "100vh", background: "#eef3f8", color: "#102033", boxSizing: "border-box" };
const page: CSSProperties = { maxWidth: 1440, margin: "0 auto", padding: "1.25rem", display: "grid", gap: "1rem", color: "#102033" };
const header: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", color: "#0f2538" };
const headerTitle: CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem" };
const h1: CSSProperties = { margin: 0, fontSize: "1.55rem", letterSpacing: 0 };
const h2: CSSProperties = { margin: 0, fontSize: "1rem", letterSpacing: 0, color: "#0f2538" };
const h3: CSSProperties = { margin: 0, fontSize: "0.95rem", letterSpacing: 0, color: "#0f2538" };
const subtle: CSSProperties = { margin: 0, color: "#42576b", fontSize: "0.92rem" };
const button: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", border: "1px solid #9db0c3", background: "#fff", color: "#102033", borderRadius: 6, padding: "0.5rem 0.7rem", cursor: "pointer", textDecoration: "none" };
const linkButton: CSSProperties = { ...button };
const buttonRow: CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const traceLayout: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)", gap: "0.85rem", alignItems: "start" };
const panel: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 8, padding: "0.85rem", background: "#fff", display: "grid", gap: "0.75rem", color: "#102033", minWidth: 0 };
const detailPanel: CSSProperties = { ...panel, background: "#fbfdff" };
const panelHeader: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" };
const traceList: CSSProperties = { display: "grid", gap: "0.45rem", maxHeight: "calc(100vh - 310px)", overflowY: "auto" };
const traceListWide: CSSProperties = { ...traceList, maxHeight: 280 };
const traceItem: CSSProperties = { display: "grid", gridTemplateColumns: "1fr auto", gap: "0.2rem 0.75rem", textAlign: "left", border: "1px solid #cbd8e6", background: "#fff", color: "#102033", borderRadius: 6, padding: "0.55rem", cursor: "pointer" };
const traceItemSelected: CSSProperties = { ...traceItem, border: "1px solid #2f74b5", background: "#eef6ff" };
const errorBox: CSSProperties = { margin: 0, border: "1px solid #f3b5b5", background: "#fff5f5", color: "#9b1c1c", borderRadius: 8, padding: "0.7rem" };
const successBox: CSSProperties = { margin: 0, border: "1px solid #9bc9b4", background: "#f3fbf7", color: "#155c3c", borderRadius: 8, padding: "0.7rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.45rem" };
const infoBox: CSSProperties = { margin: 0, border: "1px solid #9db0c3", background: "#f6fbff", color: "#153654", borderRadius: 8, padding: "0.7rem", fontSize: "0.9rem" };
const spinIcon: CSSProperties = { flex: "0 0 auto" };
const field: CSSProperties = { display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: "#42576b" };
const input: CSSProperties = { minHeight: 34, border: "1px solid #9db0c3", borderRadius: 6, padding: "0.35rem 0.45rem", background: "#fff", color: "#102033" };
const jumpForm: CSSProperties = { display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "end" };
const detailGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" };
const metric: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 8, padding: "0.65rem", background: "#fff", display: "grid", gap: "0.25rem", minWidth: 0, color: "#102033" };
const metricLabel: CSSProperties = { color: "#42576b", fontSize: "0.8rem" };
const metricValue: CSSProperties = { fontSize: "1rem", overflowWrap: "anywhere", color: "#0f2538" };
const miniRows: CSSProperties = { display: "grid", gap: "0.35rem" };
const miniRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid #edf1f5", padding: "0.2rem 0" };
const traceDetails: CSSProperties = { border: "1px solid #d7e1eb", borderRadius: 6, padding: "0.55rem", background: "#fff" };
const traceSection: CSSProperties = { display: "grid", gap: "0.35rem" };
const traceChips: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.35rem" };
const traceChipsCompact: CSSProperties = { ...traceChips, gap: "0.25rem" };
const traceChip: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 999, padding: "0.15rem 0.45rem", background: "#f6f9fc", fontSize: "0.78rem", color: "#24394d" };
const traceCardGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.5rem", marginTop: "0.5rem" };
const traceCard: CSSProperties = { display: "grid", gap: "0.35rem", border: "1px solid #d7e1eb", borderRadius: 6, padding: "0.55rem", background: "#fbfdff" };
const traceActionCard: CSSProperties = { ...traceCard, minWidth: 0 };
const traceActionCardSelected: CSSProperties = { ...traceActionCard, border: "1px solid #2f74b5", background: "#eef6ff" };
const traceActionHeader: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", minWidth: 0 };
const traceSelectedPill: CSSProperties = { border: "1px solid #2f74b5", borderRadius: 999, padding: "0.1rem 0.45rem", background: "#dcefff", color: "#12466f", fontSize: "0.74rem", fontWeight: 700 };
const traceMutedPill: CSSProperties = { ...traceSelectedPill, border: "1px solid #c7d4e2", background: "#f6f9fc", color: "#42576b" };

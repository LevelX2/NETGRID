"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Side } from "@netgrid/shared";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

type ReplayPerspective = Side | "local_analysis";
type ReplayExportPerspective = Side;

type ReplayIndexEntry = {
  replayId: string;
  matchId: string;
  status: string;
  matchMode: string;
  matchFormat: string;
  createdAt: string;
  updatedAt: string;
  winner?: string;
  finalStateHash: string;
  replayOk: boolean;
  participantNames: {
    runner?: string;
    corp?: string;
  };
};

type ReplayStateHashCheck = {
  ok: boolean;
  expected: string;
  actual?: string;
  reason?: string;
};

type ReplayTimelineStep = {
  eventId: string;
  index: number;
  side?: Side;
  actionType: string;
  timingPoint: string;
  label: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  stateHashCheck: ReplayStateHashCheck;
  hiddenInfoBarrier: boolean;
  eventFamily: string;
  learningHint: string;
  decisionDebug?: Record<string, unknown>;
};

type ReplayView = {
  replayId: string;
  matchId: string;
  perspective: ReplayPerspective;
  metadata: ReplayIndexEntry;
  timeline: ReplayTimelineStep[];
  replayErrors: string[];
  randomDrawRecords: Array<{ counter: number; purpose: string; valueHash: string }>;
  exploitSuggestions: Array<{ candidateId: string; eventId: string; reason: string; status: "review_suggestion" }>;
  localAnalysis: boolean;
};

type ReplayExportArtifact = {
  version: "1.5.0";
  exportedAt: string;
  perspective: ReplayExportPerspective;
  replay: ReplayView;
};

export default function ReplayPage() {
  const [index, setIndex] = useState<ReplayIndexEntry[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [perspective, setPerspective] = useState<ReplayPerspective>("runner");
  const [replay, setReplay] = useState<ReplayView | null>(null);
  const [exportArtifact, setExportArtifact] = useState<ReplayExportArtifact | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let closed = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${SERVER_HTTP}/api/replays`);
        const payload = (await response.json()) as { replays?: ReplayIndexEntry[]; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message ?? "Replay-Index konnte nicht geladen werden.");
        if (closed) return;
        const entries = payload.replays ?? [];
        setIndex(entries);
        if (!selectedMatchId && entries[0]) setSelectedMatchId(entries[0].matchId);
      } catch (loadError) {
        if (closed) return;
        setError(loadError instanceof Error ? loadError.message : "Replay-Index konnte nicht geladen werden.");
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void load();
    return () => {
      closed = true;
    };
  }, []);

  useEffect(() => {
    let closed = false;
    if (!selectedMatchId) {
      setReplay(null);
      return;
    }
    const loadReplay = async () => {
      setLoading(true);
      setError("");
      setExportArtifact(null);
      try {
        const response = await fetch(`${SERVER_HTTP}/api/replays/${encodeURIComponent(selectedMatchId)}?perspective=${perspective}`);
        const payload = (await response.json()) as ReplayView | { error?: { message?: string } };
        if (!response.ok) {
          const errorPayload = payload as { error?: { message?: string } };
          throw new Error(errorPayload.error?.message ?? "Replay konnte nicht geladen werden.");
        }
        if (!closed) setReplay(payload as ReplayView);
      } catch (loadError) {
        if (closed) return;
        setReplay(null);
        setError(loadError instanceof Error ? loadError.message : "Replay konnte nicht geladen werden.");
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void loadReplay();
    return () => {
      closed = true;
    };
  }, [selectedMatchId, perspective]);

  const keyMoments = useMemo(() => {
    const steps = replay?.timeline ?? [];
    const firstBarrier = steps.find((step) => step.hiddenInfoBarrier)?.eventId;
    const firstRun = steps.find((step) => step.eventFamily === "run_and_access")?.eventId;
    const firstAgenda = steps.find((step) => step.eventFamily === "agenda")?.eventId;
    return { firstBarrier, firstRun, firstAgenda };
  }, [replay]);

  const jumpToEvent = (eventId?: string) => {
    if (!eventId) return;
    const target = document.getElementById(`step-${eventId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const exportReplay = async (exportPerspective: ReplayExportPerspective) => {
    if (!selectedMatchId) return;
    setError("");
    try {
      const response = await fetch(`${SERVER_HTTP}/api/replays/${encodeURIComponent(selectedMatchId)}/export?perspective=${exportPerspective}`);
      const payload = (await response.json()) as ReplayExportArtifact | { error?: { message?: string } };
      if (!response.ok) {
        const errorPayload = payload as { error?: { message?: string } };
        throw new Error(errorPayload.error?.message ?? "Replay-Export fehlgeschlagen.");
      }
      setExportArtifact(payload as ReplayExportArtifact);
    } catch (exportError) {
      setExportArtifact(null);
      setError(exportError instanceof Error ? exportError.message : "Replay-Export fehlgeschlagen.");
    }
  };

  return (
    <main style={{ margin: "0 auto", maxWidth: 1200, padding: "1.25rem", display: "grid", gap: "1rem" }}>
      <header style={{ display: "grid", gap: "0.35rem" }}>
        <h1 style={{ margin: 0 }}>Private Replays</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Lokale Replay-Ansicht mit Perspektive, StateHash-Prüfung und Analysehinweisen.</p>
      </header>

      <section style={{ display: "grid", gap: "0.6rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Replay
            <select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)} disabled={index.length === 0}>
              {index.length === 0 ? <option value="">Keine Replays</option> : null}
              {index.map((entry) => (
                <option key={entry.replayId} value={entry.matchId}>
                  {entry.matchId} · {new Date(entry.updatedAt).toLocaleString("de-DE")}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Perspektive
            <select value={perspective} onChange={(event) => setPerspective(event.target.value as ReplayPerspective)} disabled={!selectedMatchId}>
              <option value="runner">Runner</option>
              <option value="corp">Korp</option>
              <option value="local_analysis">Lokale Analyse</option>
            </select>
          </label>
          <button type="button" onClick={() => exportReplay("runner")} disabled={!selectedMatchId}>
            Export Runner
          </button>
          <button type="button" onClick={() => exportReplay("corp")} disabled={!selectedMatchId}>
            Export Korp
          </button>
        </div>
        {error ? <p style={{ margin: 0, color: "#b42318" }}>{error}</p> : null}
        {loading ? <p style={{ margin: 0 }}>Lade Replay-Daten…</p> : null}
      </section>

      {replay ? (
        <section style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button type="button" onClick={() => jumpToEvent(keyMoments.firstBarrier)} disabled={!keyMoments.firstBarrier}>
              Zur ersten Hidden-Info-Barriere
            </button>
            <button type="button" onClick={() => jumpToEvent(keyMoments.firstRun)} disabled={!keyMoments.firstRun}>
              Zum ersten Run
            </button>
            <button type="button" onClick={() => jumpToEvent(keyMoments.firstAgenda)} disabled={!keyMoments.firstAgenda}>
              Zum ersten Agenda-Moment
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={cellHead}>#</th>
                  <th style={cellHead}>Seite</th>
                  <th style={cellHead}>Aktion</th>
                  <th style={cellHead}>Timing</th>
                  <th style={cellHead}>State</th>
                  <th style={cellHead}>StateHash</th>
                  <th style={cellHead}>Barriere</th>
                  <th style={cellHead}>Hinweis</th>
                </tr>
              </thead>
              <tbody>
                {replay.timeline.map((step) => (
                  <tr key={step.eventId} id={`step-${step.eventId}`}>
                    <td style={cellData}>{step.index + 1}</td>
                    <td style={cellData}>{step.side === "runner" ? "Runner" : step.side === "corp" ? "Korp" : "-"}</td>
                    <td style={cellData}>{step.label}</td>
                    <td style={cellData}>{step.timingPoint}</td>
                    <td style={cellData}>
                      {step.stateVersionBefore} → {step.stateVersionAfter}
                    </td>
                    <td style={cellData}>
                      <code>{step.stateHashCheck.ok ? "ok" : "abweichend"}</code>
                    </td>
                    <td style={cellData}>{step.hiddenInfoBarrier ? "ja" : "nein"}</td>
                    <td style={cellData}>{step.learningHint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>RandomDrawRecords</summary>
            <pre style={pre}>{JSON.stringify(replay.randomDrawRecords, null, 2)}</pre>
          </details>
          <details>
            <summary>Exploit-Kandidaten (Review-Vorschlag)</summary>
            <pre style={pre}>{JSON.stringify(replay.exploitSuggestions, null, 2)}</pre>
          </details>
          <details>
            <summary>Replay-Fehler</summary>
            <pre style={pre}>{JSON.stringify(replay.replayErrors, null, 2)}</pre>
          </details>
        </section>
      ) : null}

      {exportArtifact ? (
        <section style={{ display: "grid", gap: "0.5rem" }}>
          <h2 style={{ margin: 0 }}>Export</h2>
          <textarea value={JSON.stringify(exportArtifact, null, 2)} readOnly style={{ minHeight: 220, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }} />
        </section>
      ) : null}
    </main>
  );
}

const cellHead: CSSProperties = {
  borderBottom: "1px solid #cbd5e1",
  padding: "0.4rem 0.5rem",
  textAlign: "left",
  fontSize: "0.85rem"
};

const cellData: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "0.4rem 0.5rem",
  verticalAlign: "top",
  fontSize: "0.85rem"
};

const pre: CSSProperties = {
  margin: 0,
  overflowX: "auto",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "0.5rem"
};

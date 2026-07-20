"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SERVER_HTTP =
  process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

type SideSummary = {
  credits: number;
  clicks: number;
  agendaPoints: number;
  tags: number;
  scoredCount: number;
  discardCount: number;
  hiddenGripOrHqCount: number;
  hiddenDrawPileCount: number;
};

type InstalledSlot =
  | { slot: number; visibility: "hidden" }
  | { slot: number; visibility: "public"; rezzed: boolean };

type SpectatorProjection = {
  schemaVersion: "SpectatorProjectionV1";
  match: { matchId: string; status: string; matchVersion: number };
  cursor: { eventCursor: number; stateVersion: number };
  board: {
    activeSide: "runner" | "corp";
    phase: string;
    runner: SideSummary;
    corp: SideSummary;
    servers: Array<{
      id: string;
      label: string;
      iceSlots: InstalledSlot[];
      rootSlots: InstalledSlot[];
    }>;
  };
  events: Array<{
    eventId: string;
    type: string;
    stateVersionAfter: number;
    eventFamily: string;
  }>;
};

export default function SpectatePage() {
  const [matchId, setMatchId] = useState("");
  const [projection, setProjection] = useState<SpectatorProjection>();
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedMatchId = new URLSearchParams(window.location.search).get(
      "matchId",
    );
    if (!requestedMatchId) {
      setError("Es wurde kein Spiel ausgewählt.");
      return;
    }
    setMatchId(requestedMatchId);

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(
          `${SERVER_HTTP}/api/public/matches/${encodeURIComponent(requestedMatchId)}/spectator`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          if (!cancelled)
            setError("Das laufende öffentliche Spiel ist nicht verfügbar.");
          return;
        }
        const next = (await response.json()) as SpectatorProjection;
        if (!cancelled) {
          setProjection(next);
          setError("");
        }
      } catch {
        if (!cancelled)
          setError("Der Multiplayer-Server ist nicht erreichbar.");
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 24 }}>
      <header
        style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
      >
        <div>
          <p style={{ margin: 0, opacity: 0.7 }}>Live-Zuschaueransicht</p>
          <h1 style={{ marginTop: 4 }}>Öffentliches Spiel</h1>
          {matchId ? <code>{matchId}</code> : null}
        </div>
        <Link href="/">Zurück zur Übersicht</Link>
      </header>

      {error ? (
        <section style={panelStyle} role="status">
          <p>{error}</p>
          {matchId ? (
            <Link href={`/replays?matchId=${encodeURIComponent(matchId)}`}>
              Replay prüfen
            </Link>
          ) : null}
        </section>
      ) : null}

      {!projection && !error ? <p>Spiel wird geladen …</p> : null}

      {projection ? (
        <>
          <section style={{ ...panelStyle, marginTop: 24 }}>
            <strong>
              Zug: {sideLabel(projection.board.activeSide)} · Phase:{" "}
              {projection.board.phase}
            </strong>
            <small style={{ display: "block", marginTop: 6, opacity: 0.7 }}>
              Stand {projection.cursor.stateVersion} · wird automatisch
              aktualisiert
            </small>
          </section>

          <section style={twoColumnStyle}>
            <SidePanel label="Runner" side={projection.board.runner} />
            <SidePanel label="Corp" side={projection.board.corp} />
          </section>

          <section style={{ ...panelStyle, marginTop: 16 }}>
            <h2>Corp-Server</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {projection.board.servers.map((server) => (
                <article key={server.id} style={innerPanelStyle}>
                  <strong>{server.label}</strong>
                  <p>ICE: {slotLabels(server.iceSlots)}</p>
                  <p>Root: {slotLabels(server.rootSlots)}</p>
                </article>
              ))}
            </div>
          </section>

          <section style={{ ...panelStyle, marginTop: 16 }}>
            <h2>Letzte öffentliche Ereignisse</h2>
            {projection.events.length === 0 ? (
              <p>Noch keine Ereignisse.</p>
            ) : (
              <ol>
                {[...projection.events].reverse().map((event) => (
                  <li key={event.eventId}>
                    {event.eventFamily} · Stand {event.stateVersionAfter}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function SidePanel({ label, side }: { label: string; side: SideSummary }) {
  return (
    <article style={panelStyle}>
      <h2>{label}</h2>
      <p>
        Credits: {side.credits} · Klicks: {side.clicks}
      </p>
      <p>
        Agenda-Punkte: {side.agendaPoints} · Gewertet: {side.scoredCount}
      </p>
      <p>
        Handkarten: {side.hiddenGripOrHqCount} · Nachziehstapel:{" "}
        {side.hiddenDrawPileCount}
      </p>
      <p>
        Ablage: {side.discardCount}
        {label === "Runner" ? ` · Tags: ${side.tags}` : ""}
      </p>
    </article>
  );
}

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Corp";
}

function slotLabels(slots: InstalledSlot[]): string {
  if (slots.length === 0) return "leer";
  return slots
    .map((slot) =>
      slot.visibility === "hidden"
        ? "verdeckte Karte"
        : slot.rezzed
          ? "offene Karte (rezzed)"
          : "offene Karte",
    )
    .join(", ");
}

const panelStyle = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 12,
  padding: 18,
  background: "rgba(255,255,255,0.04)",
} as const;

const innerPanelStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: 12,
} as const;

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginTop: 16,
} as const;

"use client";

import type {
  ApiReplayAnalysisCard,
  ApiReplayAnalysisFrame,
} from "@netgrid/shared";

import {
  opponentParticipant,
  type ReplayParticipant,
} from "./replay-player-model";

export function ReplayBoard({
  frame,
  perspective,
  opponentHandOpen,
  onCloseOpponentHand,
}: {
  frame: ApiReplayAnalysisFrame;
  perspective: ReplayParticipant;
  opponentHandOpen: boolean;
  onCloseOpponentHand(): void;
}) {
  const viewer = frame.participants[perspective];
  const opponent = frame.participants[opponentParticipant(perspective)];

  return (
    <section style={boardShell} aria-label="Replay-Spielbrett">
      <div style={statusRow}>
        <strong>
          Perspektive: {viewer.displayName} · {sideLabel(viewer.side)}
        </strong>
        <span>
          Aktiver Spieler: {sideLabel(frame.activeSide)} · {frame.phase}
        </span>
      </div>

      <div style={sideGrid}>
        <SideSummary
          label="Corp"
          values={[
            `${frame.corp.credits} Credits`,
            `${frame.corp.clicks} Klicks`,
            `${frame.corp.badPublicity} Bad Publicity`,
            `${frame.corp.deckCount} Karten in R&D`,
          ]}
          handCount={frame.corp.hand.length}
        />
        <SideSummary
          label="Runner"
          values={[
            `${frame.runner.credits} Credits`,
            `${frame.runner.clicks} Klicks`,
            `${frame.runner.tags} Tags`,
            `${frame.runner.deckCount} Karten im Stack`,
          ]}
          handCount={frame.runner.hand.length}
        />
      </div>

      <section style={zonePanel}>
        <h2 style={heading}>Corp-Server</h2>
        <div style={serverGrid}>
          {frame.corp.servers.map((server) => (
            <article key={server.id} style={serverPanel}>
              <strong>{server.label}</strong>
              <CardRow label="ICE" cards={server.ice} empty="Kein ICE" />
              <CardRow label="Root" cards={server.root} empty="Leer" />
            </article>
          ))}
        </div>
      </section>

      <section style={zonePanel}>
        <h2 style={heading}>Runner-Rig</h2>
        <CardRow
          label="Programme"
          cards={frame.runner.rig.programs}
          empty="Keine Programme"
        />
        <CardRow
          label="Hardware"
          cards={frame.runner.rig.hardware}
          empty="Keine Hardware"
        />
        <CardRow
          label="Ressourcen"
          cards={frame.runner.rig.resources}
          empty="Keine Ressourcen"
        />
      </section>

      <section style={zonePanel}>
        <h2 style={heading}>Deine Hand · {viewer.displayName}</h2>
        <div style={cardGrid} data-testid="replay-viewer-hand">
          {viewer.hand.map((card) => (
            <ReplayCard key={card.instanceId} card={card} />
          ))}
          {viewer.hand.length === 0 ? <span>Keine Handkarten</span> : null}
        </div>
      </section>

      {opponentHandOpen ? (
        <aside
          style={opponentWindow}
          aria-label={`Gegnerhand von ${opponent.displayName}`}
          data-testid="replay-opponent-hand-window"
        >
          <div style={opponentHeader}>
            <div>
              <strong>Gegnerhand</strong>
              <small style={{ display: "block", opacity: 0.75 }}>
                {opponent.displayName} · {sideLabel(opponent.side)}
              </small>
            </div>
            <button type="button" onClick={onCloseOpponentHand}>
              Schließen
            </button>
          </div>
          <div style={cardGrid}>
            {opponent.hand.map((card) => (
              <ReplayCard key={card.instanceId} card={card} />
            ))}
            {opponent.hand.length === 0 ? <span>Keine Handkarten</span> : null}
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function SideSummary({
  label,
  values,
  handCount,
}: {
  label: string;
  values: string[];
  handCount: number;
}) {
  return (
    <article style={sidePanel}>
      <h2 style={heading}>{label}</h2>
      <p style={{ margin: 0 }}>{values.join(" · ")}</p>
      <small>{handCount} Handkarten</small>
    </article>
  );
}

function CardRow({
  label,
  cards,
  empty,
}: {
  label: string;
  cards: ApiReplayAnalysisCard[];
  empty: string;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <small style={{ opacity: 0.72 }}>{label}</small>
      <div style={cardGrid}>
        {cards.map((card) => (
          <ReplayCard key={card.instanceId} card={card} />
        ))}
        {cards.length === 0 ? (
          <span style={{ opacity: 0.65 }}>{empty}</span>
        ) : null}
      </div>
    </div>
  );
}

function ReplayCard({ card }: { card: ApiReplayAnalysisCard }) {
  return (
    <article style={cardStyle} title={card.definitionId}>
      <strong>{card.title}</strong>
      <small>
        {card.cardType}
        {card.rezzed &&
        (card.cardType === "ice" ||
          card.cardType === "asset" ||
          card.cardType === "upgrade")
          ? " · rezzed"
          : ""}
        {card.advancementCounters > 0
          ? ` · ${card.advancementCounters} Advancement`
          : ""}
      </small>
    </article>
  );
}

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Corp";
}

const boardShell = {
  display: "grid",
  gap: 16,
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 14,
  padding: 18,
  background: "rgba(5,12,24,0.78)",
} as const;

const statusRow = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 12,
} as const;

const sideGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
} as const;

const sidePanel = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: 14,
  display: "grid",
  gap: 8,
} as const;

const zonePanel = {
  display: "grid",
  gap: 12,
  borderTop: "1px solid rgba(255,255,255,0.1)",
  paddingTop: 14,
} as const;

const serverGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
} as const;

const serverPanel = {
  display: "grid",
  gap: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 9,
  padding: 12,
} as const;

const cardGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
} as const;

const cardStyle = {
  display: "grid",
  gap: 5,
  width: 150,
  minHeight: 66,
  border: "1px solid rgba(123,206,255,0.35)",
  borderRadius: 8,
  padding: 10,
  background: "rgba(22,50,78,0.72)",
} as const;

const opponentWindow = {
  position: "fixed",
  zIndex: 50,
  top: 86,
  right: 22,
  width: "min(520px, calc(100vw - 44px))",
  maxHeight: "calc(100vh - 110px)",
  overflowY: "auto",
  display: "grid",
  gap: 14,
  border: "1px solid rgba(123,206,255,0.7)",
  borderRadius: 12,
  padding: 16,
  background: "rgba(5,12,24,0.97)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
} as const;

const opponentHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
} as const;

const heading = { margin: 0 } as const;

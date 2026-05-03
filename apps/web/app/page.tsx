"use client";

import { Bot, Coins, Cpu, Play, RotateCcw, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { LegalAction, PlayerView, VisibleCard } from "@netrunner/shared";

type ClientPayload = {
  view: PlayerView;
  canRunCorp: boolean;
  error?: string;
};

export default function Page() {
  const [seed, setSeed] = useState("mvp-0.1-web-demo");
  const [payload, setPayload] = useState<ClientPayload | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/game", { cache: "no-store" });
    setPayload((await response.json()) as ClientPayload);
  };

  const postGame = async (body: unknown) => {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    setPayload((await response.json()) as ClientPayload);
  };

  const runAction = (action: LegalAction) => {
    if (!payload) return;
    void postGame({
      kind: "runner_action",
      actionId: action.actionId,
      stateVersion: payload.view.stateVersion
    });
  };

  const runCorp = () => void postGame({ kind: "corp_step" });
  const reset = () => void postGame({ kind: "new", seed });

  if (!payload) {
    return (
      <main className="app">
        <header className="topbar">
          <div className="brand">
            <div className="mark">
              <Sparkles size={18} />
            </div>
            <div>
              <h1>Netrunner MVP 0.1</h1>
              <p>Runner vs Corp-KI</p>
            </div>
          </div>
        </header>
      </main>
    );
  }

  const runnerView = payload.view;

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark">
            <Sparkles size={18} />
          </div>
          <div>
            <h1>Netrunner MVP 0.1</h1>
            <p>Runner vs Corp-KI</p>
          </div>
        </div>
        <div className="toolbar">
          <input className="seed" value={seed} onChange={(event) => setSeed(event.target.value)} aria-label="Seed" />
          <button className="button" onClick={reset} title="Neues Spiel">
            <RotateCcw size={16} />
            Neu
          </button>
          <button className="button corp" onClick={runCorp} disabled={!payload.canRunCorp} title="Corp ausführen">
            <Bot size={16} />
            Corp
          </button>
        </div>
      </header>

      <div className="main">
        <aside className="column panel">
          <PlayerPanel view={runnerView} title="Runner" tone="runner" />
          <section className="section">
            <h2>Aktionen</h2>
            <div className="actions">
              {runnerView.legalActions.map((action) => (
                <button className="button actionButton primary" key={action.actionId} onClick={() => runAction(action)} disabled={Boolean(runnerView.winner)}>
                  <Play size={15} />
                  {action.label}
                </button>
              ))}
              {runnerView.legalActions.length === 0 ? <p className="meta">Keine Runner-Aktion im aktuellen Fenster.</p> : null}
            </div>
          </section>
        </aside>

        <section className="board">
          {runnerView.run ? (
            <div className="runBar">
              <Shield size={18} />
              <span>
                Run auf <strong>{runnerView.run.attackedServerId}</strong> · {runnerView.run.phase}
              </span>
            </div>
          ) : null}
          {runnerView.winner ? (
            <div className="runBar">
              <Cpu size={18} />
              <span className="winner">{runnerView.winner === "runner" ? "Runner" : runnerView.winner === "corp" ? "Corp" : "Draw"} gewinnt.</span>
            </div>
          ) : null}
          <div className="serverGrid">
            {runnerView.servers.map((server) => (
              <article className="server" key={server.id}>
                <h3>{server.label}</h3>
                <div className="laneLabel">ICE</div>
                <div className="lane">{server.ice.map((card) => <Card key={card.instanceId} card={card} compact />)}</div>
                <div className="laneLabel">Root</div>
                <div className="lane">{server.root.map((card) => <Card key={card.instanceId} card={card} compact />)}</div>
              </article>
            ))}
          </div>
          <section className="section panel" style={{ marginTop: 14 }}>
            <h2>Grip</h2>
            <div className="cards">{runnerView.own.gripOrHq.map((card) => <Card key={card.instanceId} card={card} />)}</div>
          </section>
          <section className="section panel" style={{ marginTop: 14 }}>
            <h2>Rig</h2>
            <div className="cards">{runnerView.own.rig?.map((card) => <Card key={card.instanceId} card={card} />)}</div>
          </section>
        </section>

        <aside className="log panel">
          <section className="section">
            <h2>Corp</h2>
            <div className="stats">
              <div className="stat">
                <strong>{runnerView.opponent.credits}</strong>
                <span>Credits</span>
              </div>
              <div className="stat">
                <strong>{runnerView.opponent.clicks}</strong>
                <span>Clicks</span>
              </div>
              <div className="stat">
                <strong>{runnerView.opponent.agendaPoints}</strong>
                <span>Agenda</span>
              </div>
            </div>
            <p className="meta" style={{ marginTop: 10, color: "var(--corp)" }}>
              {payload.canRunCorp ? "Aktiv" : "Wartet"} · {runnerView.timingPoint}
            </p>
          </section>
          <section className="section">
            <h2>EventLog</h2>
            <div className="events">
              {runnerView.publicEvents
                .slice()
                .reverse()
                .map((event) => (
                  <div className="event" key={event.eventId}>
                    <strong>{String(event.publicPayload.label ?? event.type)}</strong>
                    <small>
                      v{event.stateVersionAfter} · {event.stateHashAfter}
                    </small>
                  </div>
                ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function PlayerPanel({ view, title, tone }: { view: PlayerView; title: string; tone: "runner" | "corp" }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="stats">
        <div className="stat">
          <strong>{view.own.credits}</strong>
          <span>Credits</span>
        </div>
        <div className="stat">
          <strong>{view.own.clicks}</strong>
          <span>Clicks</span>
        </div>
        <div className="stat">
          <strong>{view.own.agendaPoints}</strong>
          <span>Agenda</span>
        </div>
      </div>
      <p className="meta" style={{ marginTop: 10, color: tone === "runner" ? "var(--runner)" : "var(--corp)" }}>
        {view.activeSide === tone ? "Aktiv" : "Wartet"} · {view.timingPoint}
      </p>
    </section>
  );
}

function Card({ card, compact = false }: { card: VisibleCard; compact?: boolean }) {
  const typeClass = card.type ? ` ${card.type}` : "";
  return (
    <div className={`card${card.known ? typeClass : " hidden"}`}>
      <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>
      {!compact ? <span className="cardMeta">{card.known ? [card.type, card.subtypes?.join(" / ")].filter(Boolean).join(" · ") : "Hidden"}</span> : null}
      {card.advancementCounters ? <span className="cardMeta">Adv: {card.advancementCounters}</span> : null}
      {card.strength !== undefined ? <span className="cardMeta">Stärke {card.strength}</span> : null}
    </div>
  );
}

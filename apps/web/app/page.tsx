"use client";

import { Bot, Coins, Cpu, Play, RotateCcw, Shield, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { chooseCorpAction } from "@netrunner/ai";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netrunner/engine";
import type { GameState, LegalAction, PlayerView, VisibleCard } from "@netrunner/shared";

function makeGame(seed: string): GameState {
  let state = createGame({ seed, matchId: "web-local-demo" });
  const mandatory = getLegalActions(state, "corp").find((action) => action.type === "mandatory_draw");
  if (mandatory) {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion
    });
    if (result.ok) state = result.state;
  }
  return state;
}

export default function Page() {
  const [seed, setSeed] = useState("mvp-0.1-web-demo");
  const [state, setState] = useState<GameState>(() => makeGame("mvp-0.1-web-demo"));
  const runnerView = useMemo(() => getPlayerView(state, "runner"), [state]);
  const corpView = useMemo(() => getPlayerView(state, "corp"), [state]);

  const runAction = (action: LegalAction) => {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: action.side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: `web-${state.stateVersion}-${action.actionId}`
    });
    if (result.ok) setState(result.state);
  };

  const runCorp = () => {
    const legalActions = getLegalActions(state, "corp");
    if (legalActions.length === 0) return;
    const decision = chooseCorpAction({
      side: "corp",
      playerView: corpView,
      publicEventLog: corpView.publicEvents,
      legalActions,
      difficulty: "easy",
      seed: state.seed
    });
    const action = legalActions.find((candidate) => candidate.actionId === decision.actionId);
    if (action) runAction(action);
  };

  const reset = () => setState(makeGame(seed));

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
          <button className="button corp" onClick={runCorp} disabled={state.activeSide !== "corp" || Boolean(state.winner)} title="Corp ausführen">
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
                <button className="button actionButton primary" key={action.actionId} onClick={() => runAction(action)} disabled={Boolean(state.winner)}>
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
          {state.winner ? (
            <div className="runBar">
              <Cpu size={18} />
              <span className="winner">{state.winner === "runner" ? "Runner" : state.winner === "corp" ? "Corp" : "Draw"} gewinnt.</span>
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
          <PlayerPanel view={corpView} title="Corp" tone="corp" />
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

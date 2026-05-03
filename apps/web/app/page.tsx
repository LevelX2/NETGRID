"use client";

import { Bot, Cable, Check, Clipboard, Link2, ListFilter, Play, RotateCcw, Search, Shield, Sparkles, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard, Winner } from "@netrunner/shared";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETRUNNER_SERVER_URL ?? "http://127.0.0.1:8787";
const SESSION_KEY = "netrunner-mvp-0-3-session";

type MatchStatus = "waiting_for_runner" | "waiting_for_corp" | "active" | "finished";
type GameMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai" | "ai_vs_ai";
type AiDifficulty = "easy" | "normal" | "hard";

type ClientPayload = {
  matchId: string;
  matchStatus: MatchStatus;
  matchVersion: number;
  side: Side;
  playerView: PlayerView;
  legalActions: LegalAction[];
  eventTail: PublicGameEvent[];
  opponentStatus: { side: Side; connected: boolean };
  pendingUndo?: {
    undoRequestId: string;
    requestedBy: Side;
    targetEventId: string;
    reason?: string;
    needsResponse: boolean;
  };
  winner?: Winner;
  finalStateHash?: string;
};

type SessionInfo = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  joinUrl?: string;
  displayName: string;
};

type ServerMessage =
  | { type: "state_update"; payload: { matchStatus: MatchStatus; matchVersion: number; playerView: PlayerView } }
  | { type: "legal_actions"; payload: { legalActions: LegalAction[] } }
  | { type: "event_log_update"; payload: { events: PublicGameEvent[] } }
  | { type: "opponent_status"; payload: ClientPayload["opponentStatus"] }
  | { type: "undo_request"; payload: NonNullable<ClientPayload["pendingUndo"]> }
  | { type: "match_finished"; payload: { winner: Winner; finalStateHash: string } }
  | { type: "error"; payload: { code: string; message: string; playerView?: PlayerView } }
  | { type: "action_receipt"; payload: { accepted: boolean; stateVersionAfter: number; errorCode?: string } }
  | { type: "choice_request"; payload: { choice: null } }
  | { type: "pong"; payload: { serverTime: number } };

type CreateMatchResponse = {
  matchId: string;
  hostSide: Side;
  hostSessionToken: string;
  hostReconnectToken: string;
  joinUrl?: string;
  webSocketUrl: string;
  mode: Exclude<GameMode, "ai_vs_ai">;
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
};

type JoinMatchResponse = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  playerView: PlayerView;
  legalActions: LegalAction[];
  matchVersion: number;
  eventTail?: PublicGameEvent[];
  error?: { message: string };
};

type AiSimulationSummary = {
  seed: string;
  winner: Winner | "action_limit_reached";
  actions: number;
  turns: number;
  finalStateHash: string;
  replayOk: boolean;
  errors: string[];
};

type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "playable" | "deck_legal" | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  faction: string;
  setId: string;
  statuses: CatalogStatuses;
  blockReasons: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null>;
  engineCardId: string | null;
};

type CatalogListResponse = {
  snapshotId: string;
  snapshotHash: string;
  cards: CatalogCardSummary[];
  filters: {
    sides: Side[];
    types: string[];
    statuses: CatalogStatusKey[];
  };
  summary: Partial<Record<CatalogStatusKey, number>>;
};

const CATALOG_STATUS_LABELS: Record<CatalogStatusKey, string> = {
  imported: "imported",
  validated: "validated",
  catalog_ready: "catalog_ready",
  implemented: "implemented",
  playable: "playable",
  deck_legal: "deck_legal",
  blocked: "blocked"
};

export default function Page() {
  const [mode, setMode] = useState<"host" | "join">("host");
  const [gameMode, setGameMode] = useState<GameMode>("human_vs_human");
  const [runnerDifficulty, setRunnerDifficulty] = useState<AiDifficulty>("normal");
  const [corpDifficulty, setCorpDifficulty] = useState<AiDifficulty>("normal");
  const [displayName, setDisplayName] = useState("Runner");
  const [hostSide, setHostSide] = useState<Side | "random">("runner");
  const [seed, setSeed] = useState("mvp-0.3-ai-demo");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<ClientPayload | null>(null);
  const [simulation, setSimulation] = useState<AiSimulationSummary | null>(null);
  const [connection, setConnection] = useState<"offline" | "connecting" | "online">("offline");
  const [notice, setNotice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatusKey | "all">("all");
  const [catalogCards, setCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<CatalogListResponse["filters"] | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<Partial<Record<CatalogStatusKey, number>>>({});
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [catalogDetail, setCatalogDetail] = useState<CatalogCardDetail | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const token = params.get("joinToken");
    if (matchId && token) {
      setMode("join");
      setJoinMatchId(matchId);
      setJoinToken(token);
      setDisplayName("Runner");
      return;
    }
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as SessionInfo;
    setSession(parsed);
    void bootstrap(parsed).then((bootstrapped) => {
      if (bootstrapped) setPayload(bootstrapped);
      else setNotice("Session konnte nicht geladen werden.");
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    connectWebSocket(session);
    return () => socketRef.current?.close();
  }, [session?.matchId, session?.sessionToken]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
    if (catalogSide !== "all") params.set("side", catalogSide);
    if (catalogStatus !== "all") params.set("status", catalogStatus);
    void fetch(`/api/cards/catalog?${params.toString()}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => {
        setCatalogCards(data.cards ?? []);
        setCatalogFilters(data.filters ?? null);
        setCatalogSummary(data.summary ?? {});
        setSelectedCatalogId((current) => (current && data.cards?.some((card) => card.catalogCardId === current) ? current : data.cards?.[0]?.catalogCardId ?? null));
      })
      .catch(() => {
        setCatalogCards([]);
        setCatalogFilters(null);
        setCatalogSummary({});
        setSelectedCatalogId(null);
      });
  }, [catalogSearch, catalogSide, catalogStatus]);

  useEffect(() => {
    if (!selectedCatalogId) {
      setCatalogDetail(null);
      return;
    }
    void fetch(`/api/cards/catalog/${encodeURIComponent(selectedCatalogId)}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
      .then((data) => setCatalogDetail(data.card ?? null))
      .catch(() => setCatalogDetail(null));
  }, [selectedCatalogId]);

  const activeView = payload?.playerView;
  const latestEventId = payload?.eventTail.at(-1)?.eventId;
  const canReconnect = Boolean(session?.reconnectToken);

  const createMatch = async () => {
    setNotice("");
    setSimulation(null);
    if (gameMode === "ai_vs_ai") {
      await runSimulation();
      return;
    }
    const created = await postJson<CreateMatchResponse>("/api/matches", {
      hostSide: gameMode === "human_runner_vs_corp_ai" ? "runner" : gameMode === "human_corp_vs_runner_ai" ? "corp" : hostSide,
      displayName,
      seed,
      mode: gameMode,
      runnerDifficulty,
      corpDifficulty
    });
    const nextSession: SessionInfo = {
      matchId: created.matchId,
      side: created.hostSide,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
      webSocketUrl: created.webSocketUrl,
      displayName,
      ...(created.joinUrl ? { joinUrl: created.joinUrl } : {})
    };
    persistSession(nextSession);
    setSession(nextSession);
    setPayload(fromInitialResponse(created, created.hostSide));
    setNotice("Match erstellt.");
  };

  const runSimulation = async () => {
    setNotice("");
    const result = await postJson<{ summary: AiSimulationSummary }>("/api/simulations/ai-vs-ai", {
      seed,
      runnerDifficulty,
      corpDifficulty,
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
      maxActions: 120
    });
    setSimulation(result.summary);
    setNotice("Simulation abgeschlossen.");
  };

  const joinMatch = async () => {
    setNotice("");
    const joined = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(joinMatchId)}/join`, {
      token: joinToken,
      displayName
    });
    if (joined.error) {
      setNotice(joined.error.message);
      return;
    }
    const nextSession: SessionInfo = {
      matchId: joined.matchId,
      side: joined.side,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
      webSocketUrl: joined.webSocketUrl,
      displayName
    };
    persistSession(nextSession);
    setSession(nextSession);
    setPayload(fromJoinedResponse(joined));
    setNotice("Beigetreten.");
  };

  const reconnect = async () => {
    if (!session || !canReconnect) return;
    const reconnected = await postJson<JoinMatchResponse>(`/api/matches/${encodeURIComponent(session.matchId)}/reconnect`, {
      side: session.side,
      reconnectToken: session.reconnectToken,
      displayName: session.displayName
    });
    if (reconnected.error) {
      setNotice(reconnected.error.message);
      return;
    }
    const nextSession = {
      ...session,
      sessionToken: reconnected.sessionToken,
      reconnectToken: reconnected.reconnectToken,
      webSocketUrl: reconnected.webSocketUrl
    };
    persistSession(nextSession);
    setSession(nextSession);
    setPayload(fromJoinedResponse(reconnected));
    setNotice("Reconnect abgeschlossen.");
  };

  const submitAction = (action: LegalAction) => {
    if (!session || !payload || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "submit_action",
        payload: {
          matchId: session.matchId,
          side: session.side,
          actionId: action.actionId,
          clientKnownStateVersion: payload.playerView.stateVersion,
          idempotencyKey: `${session.side}-${payload.playerView.stateVersion}-${action.actionId}-${crypto.randomUUID()}`
        }
      })
    );
  };

  const requestUndo = () => {
    if (!latestEventId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "request_undo", payload: { targetEventId: latestEventId } }));
  };

  const resolveUndo = (accepted: boolean) => {
    if (!payload?.pendingUndo || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: accepted ? "accept_undo" : "decline_undo",
        payload: { undoRequestId: payload.pendingUndo.undoRequestId }
      })
    );
  };

  const leaveMatch = () => {
    socketRef.current?.close();
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPayload(null);
    setSimulation(null);
    setConnection("offline");
    setNotice("");
  };

  const copyJoinLink = async () => {
    if (!session?.joinUrl) return;
    await navigator.clipboard.writeText(session.joinUrl);
    setNotice("Join-Link kopiert.");
  };

  function connectWebSocket(nextSession: SessionInfo) {
    setConnection("connecting");
    socketRef.current?.close();
    const socket = new WebSocket(nextSession.webSocketUrl);
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setConnection("online");
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: nextSession.matchId,
            side: nextSession.side,
            sessionToken: nextSession.sessionToken
          }
        })
      );
    };
    socket.onclose = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onerror = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onmessage = (event) => {
      if (socketRef.current === socket) applyServerMessage(JSON.parse(event.data as string) as ServerMessage);
    };
  }

  function applyServerMessage(message: ServerMessage) {
    if (message.type === "state_update") {
      setPayload((current) => {
        if (!current) return null;
        const next = {
          ...current,
          matchStatus: message.payload.matchStatus,
          matchVersion: message.payload.matchVersion,
          playerView: message.payload.playerView
        };
        if (message.payload.playerView.winner) return { ...next, winner: message.payload.playerView.winner };
        const { winner: _winner, finalStateHash: _finalStateHash, ...withoutWinner } = next;
        return withoutWinner;
      });
      return;
    }
    if (message.type === "legal_actions") {
      setPayload((current) => (current ? { ...current, legalActions: message.payload.legalActions } : current));
      return;
    }
    if (message.type === "event_log_update") {
      setPayload((current) => (current ? { ...current, eventTail: message.payload.events } : current));
      return;
    }
    if (message.type === "opponent_status") {
      setPayload((current) => (current ? { ...current, opponentStatus: message.payload } : current));
      return;
    }
    if (message.type === "undo_request") {
      setPayload((current) => (current ? { ...current, pendingUndo: message.payload } : current));
      return;
    }
    if (message.type === "match_finished") {
      setPayload((current) => (current ? { ...current, winner: message.payload.winner, finalStateHash: message.payload.finalStateHash, matchStatus: "finished" } : current));
      return;
    }
    if (message.type === "error") {
      setNotice(message.payload.message);
      if (message.payload.playerView) {
        setPayload((current) => (current ? { ...current, playerView: message.payload.playerView!, legalActions: message.payload.playerView!.legalActions } : current));
      }
    }
  }

  const statusText = useMemo(() => {
    if (!session) return "Kein Match";
    if (connection === "online") return "Verbunden";
    if (connection === "connecting") return "Verbindet";
    return "Offline";
  }, [connection, session]);

  if (!session || !payload || !activeView) {
    return (
      <main className="app">
        <header className="topbar">
          <Brand subtitle="Private Matches und KI-Simulation" />
          <ConnectionBadge text={statusText} state={connection} />
        </header>
        <div className="setup">
          <section className="setupPanel">
            <div className="tabs">
              <button className={`tab ${mode === "host" ? "active" : ""}`} onClick={() => setMode("host")}>
                Host
              </button>
              <button className={`tab ${mode === "join" ? "active" : ""}`} onClick={() => setMode("join")}>
                Join
              </button>
            </div>

            {mode === "host" ? (
              <div className="formGrid">
                <label>
                  Modus
                  <select value={gameMode} onChange={(event) => setGameMode(event.target.value as GameMode)}>
                    <option value="human_vs_human">Human vs Human</option>
                    <option value="human_runner_vs_corp_ai">Runner vs Corp-KI</option>
                    <option value="human_corp_vs_runner_ai">Corp vs Runner-KI</option>
                    <option value="ai_vs_ai">KI vs KI</option>
                  </select>
                </label>
                <label>
                  Name
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
                {gameMode === "human_vs_human" ? (
                  <label>
                    Seite
                    <select value={hostSide} onChange={(event) => setHostSide(event.target.value as Side | "random")}>
                      <option value="runner">Runner</option>
                      <option value="corp">Corp</option>
                      <option value="random">Random</option>
                    </select>
                  </label>
                ) : null}
                {gameMode === "human_corp_vs_runner_ai" || gameMode === "ai_vs_ai" ? (
                  <label>
                    Runner-KI
                    <select value={runnerDifficulty} onChange={(event) => setRunnerDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                {gameMode === "human_runner_vs_corp_ai" || gameMode === "ai_vs_ai" ? (
                  <label>
                    Corp-KI
                    <select value={corpDifficulty} onChange={(event) => setCorpDifficulty(event.target.value as AiDifficulty)}>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  Seed
                  <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                </label>
                <button className="button primary wide" onClick={createMatch}>
                  {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
                  {gameMode === "ai_vs_ai" ? "Simulation starten" : "Match erstellen"}
                </button>
                {simulation ? <SimulationResult summary={simulation} /> : null}
              </div>
            ) : (
              <div className="formGrid">
                <label>
                  Name
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
                <label>
                  Match
                  <input value={joinMatchId} onChange={(event) => setJoinMatchId(event.target.value)} />
                </label>
                <label>
                  Token
                  <input value={joinToken} onChange={(event) => setJoinToken(event.target.value)} />
                </label>
                <button className="button primary wide" onClick={joinMatch} disabled={!joinMatchId || !joinToken}>
                  <Link2 size={16} />
                  Beitreten
                </button>
              </div>
            )}
            {notice ? <p className="notice">{notice}</p> : null}
          </section>
          <CatalogPanel
            cards={catalogCards}
            detail={catalogDetail}
            filters={catalogFilters}
            search={catalogSearch}
            side={catalogSide}
            status={catalogStatus}
            summary={catalogSummary}
            selectedId={selectedCatalogId}
            onSearch={setCatalogSearch}
            onSide={setCatalogSide}
            onStatus={setCatalogStatus}
            onSelect={setSelectedCatalogId}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <Brand subtitle={`MVP 0.3 · ${session.side === "runner" ? "Runner" : "Corp"}`} />
        <div className="toolbar">
          <ConnectionBadge text={statusText} state={connection} />
          {session.joinUrl ? (
            <button className="button" onClick={copyJoinLink} title="Join-Link kopieren">
              <Clipboard size={16} />
              Link
            </button>
          ) : null}
          <button className="button" onClick={reconnect} disabled={!canReconnect} title="Reconnect">
            <Cable size={16} />
            Reconnect
          </button>
          <button className="button" onClick={leaveMatch} title="Match verlassen">
            <RotateCcw size={16} />
            Neu
          </button>
        </div>
      </header>

      <div className="matchStrip">
        <span>{payload.matchStatus}</span>
        <span>Match {payload.matchId}</span>
        <span>Version {payload.matchVersion}</span>
        <span>{notice}</span>
      </div>

      <div className="main">
        <aside className="column panel">
          <PlayerPanel view={activeView} title={session.side === "runner" ? "Runner" : "Corp"} />
          <section className="section">
            <h2>Aktionen</h2>
            <div className="actions">
              {payload.legalActions.map((action) => (
                <button className="button actionButton primary" key={action.actionId} onClick={() => submitAction(action)} disabled={Boolean(payload.winner) || connection !== "online"}>
                  <Play size={15} />
                  {action.label}
                </button>
              ))}
              {payload.legalActions.length === 0 ? <p className="meta">Keine Aktion im aktuellen Fenster.</p> : null}
            </div>
          </section>
          <section className="section">
            <h2>Undo</h2>
            {payload.pendingUndo?.needsResponse ? (
              <div className="undoBox">
                <p className="meta">{payload.pendingUndo.requestedBy === "runner" ? "Runner" : "Corp"} fragt Undo an.</p>
                <div className="splitButtons">
                  <button className="button primary" onClick={() => resolveUndo(true)}>
                    <Check size={15} />
                    OK
                  </button>
                  <button className="button" onClick={() => resolveUndo(false)}>
                    <X size={15} />
                    Nein
                  </button>
                </div>
              </div>
            ) : (
              <button className="button wide" onClick={requestUndo} disabled={!latestEventId || connection !== "online"}>
                <RotateCcw size={15} />
                Undo
              </button>
            )}
          </section>
        </aside>

        <section className="board">
          {activeView.run ? (
            <div className="runBar">
              <Shield size={18} />
              <span>
                Run auf <strong>{activeView.run.attackedServerId}</strong> · {activeView.run.phase}
              </span>
            </div>
          ) : null}
          {payload.winner ? (
            <div className="runBar">
              <Sparkles size={18} />
              <span className="winner">
                {payload.winner === "runner" ? "Runner" : payload.winner === "corp" ? "Corp" : "Draw"} gewinnt.
              </span>
            </div>
          ) : null}
          <div className="serverGrid">
            {activeView.servers.map((server) => (
              <article className="server" key={server.id}>
                <h3>{server.label}</h3>
                <div className="laneLabel">ICE</div>
                <div className="lane">{server.ice.map((card) => <Card key={card.instanceId} card={card} compact />)}</div>
                <div className="laneLabel">Root</div>
                <div className="lane">{server.root.map((card) => <Card key={card.instanceId} card={card} compact />)}</div>
              </article>
            ))}
          </div>
          <section className="section panel boardSection">
            <h2>{session.side === "runner" ? "Grip" : "HQ"}</h2>
            <div className="cards">{activeView.own.gripOrHq.map((card) => <Card key={card.instanceId} card={card} />)}</div>
          </section>
          {activeView.own.rig ? (
            <section className="section panel boardSection">
              <h2>Rig</h2>
              <div className="cards">{activeView.own.rig.map((card) => <Card key={card.instanceId} card={card} />)}</div>
            </section>
          ) : null}
        </section>

        <aside className="log panel">
          <section className="section">
            <h2>Gegenseite</h2>
            <div className="stats">
              <Stat label="Credits" value={activeView.opponent.credits} />
              <Stat label="Clicks" value={activeView.opponent.clicks} />
              <Stat label="Agenda" value={activeView.opponent.agendaPoints} />
            </div>
            <p className="meta statusLine">{payload.opponentStatus.connected ? "Verbunden" : "Offline"} · {activeView.timingPoint}</p>
          </section>
          <section className="section">
            <h2>EventLog</h2>
            <div className="events">
              {payload.eventTail
                .slice()
                .reverse()
                .map((event) => (
                  <div className="event" key={event.eventId}>
                    <strong>{String(event.publicPayload.label ?? event.type)}</strong>
                    {event.publicPayload.aiReasonCode ? <span>{String(event.publicPayload.aiReasonCode)}</span> : null}
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

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <div className="mark">
        <Sparkles size={18} />
      </div>
      <div>
        <h1>Netrunner</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function CatalogPanel({
  cards,
  detail,
  filters,
  search,
  side,
  status,
  summary,
  selectedId,
  onSearch,
  onSide,
  onStatus,
  onSelect
}: {
  cards: CatalogCardSummary[];
  detail: CatalogCardDetail | null;
  filters: CatalogListResponse["filters"] | null;
  search: string;
  side: Side | "all";
  status: CatalogStatusKey | "all";
  summary: Partial<Record<CatalogStatusKey, number>>;
  selectedId: string | null;
  onSearch(value: string): void;
  onSide(value: Side | "all"): void;
  onStatus(value: CatalogStatusKey | "all"): void;
  onSelect(value: string): void;
}) {
  return (
    <section className="catalogPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>Katalog</h2>
          <p className="meta">
            {cards.length} Karten · {summary.playable ?? 0} playable · {summary.blocked ?? 0} blocked
          </p>
        </div>
        <ListFilter size={18} />
      </div>
      <div className="catalogControls">
        <label className="searchBox">
          <Search size={16} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Suche" />
        </label>
        <label>
          Seite
          <select value={side} onChange={(event) => onSide(event.target.value as Side | "all")}>
            <option value="all">Alle</option>
            {(filters?.sides ?? ["runner", "corp"]).map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => onStatus(event.target.value as CatalogStatusKey | "all")}>
            <option value="all">Alle</option>
            {(filters?.statuses ?? Object.keys(CATALOG_STATUS_LABELS)).map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalogLayout">
        <div className="catalogList">
          {cards.map((card) => (
            <button className={`catalogItem ${selectedId === card.catalogCardId ? "active" : ""}`} key={card.catalogCardId} onClick={() => onSelect(card.catalogCardId)}>
              <strong>{card.title}</strong>
              <span>
                {card.side} · {card.type}
              </span>
              <StatusBadges statuses={card.statuses} compact />
            </button>
          ))}
          {cards.length === 0 ? <p className="meta catalogEmpty">Keine Treffer.</p> : null}
        </div>
        <article className="catalogDetail">
          {detail ? (
            <>
              <div className="catalogDetailHead">
                <div>
                  <h3>{detail.title}</h3>
                  <p className="meta">
                    {detail.side} · {detail.type} · {detail.setName} #{detail.collectorNumber}
                  </p>
                </div>
                <span className={`sideBadge ${detail.side}`}>{detail.side}</span>
              </div>
              <StatusBadges statuses={detail.statuses} />
              <p className="catalogText">{detail.text}</p>
              <div className="catalogMetaGrid">
                {Object.entries(detail.numeric)
                  .filter(([, value]) => value !== null)
                  .map(([key, value]) => (
                    <span key={key}>
                      <strong>{value}</strong>
                      {key}
                    </span>
                  ))}
                <span>
                  <strong>{detail.engineCardId ? "ja" : "nein"}</strong>
                  engine
                </span>
              </div>
              {detail.blockReasons.length > 0 ? <p className="notice catalogNotice">{detail.blockReasons.join(" ")}</p> : null}
            </>
          ) : (
            <p className="meta">Keine Karte ausgewählt.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function StatusBadges({ statuses, compact = false }: { statuses: CatalogStatuses; compact?: boolean }) {
  return (
    <div className={`statusBadges ${compact ? "compact" : ""}`}>
      {Object.entries(CATALOG_STATUS_LABELS)
        .filter(([key]) => statuses[key as CatalogStatusKey])
        .map(([key, label]) => (
          <span className={`statusBadge ${key}`} key={key}>
            {label}
          </span>
        ))}
    </div>
  );
}

function ConnectionBadge({ text, state }: { text: string; state: "offline" | "connecting" | "online" }) {
  return <span className={`connection ${state}`}>{text}</span>;
}

function PlayerPanel({ view, title }: { view: PlayerView; title: string }) {
  const visibleTags = view.side === "runner" ? view.own.tags : view.opponent.tags;
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="stats">
        <Stat label="Credits" value={view.own.credits} />
        <Stat label="Clicks" value={view.own.clicks} />
        <Stat label="Agenda" value={view.own.agendaPoints} />
        <Stat label="Tags" value={visibleTags} />
      </div>
      <p className="meta statusLine">{view.activeSide === view.side ? "Aktiv" : "Wartet"} · {view.timingPoint}</p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SimulationResult({ summary }: { summary: AiSimulationSummary }) {
  return (
    <div className="simulationResult">
      <div className="stats">
        <Stat label="Actions" value={summary.actions} />
        <Stat label="Turns" value={summary.turns} />
      </div>
      <p className="meta statusLine">
        {summary.winner === "action_limit_reached" ? "Limit erreicht" : `${summary.winner === "runner" ? "Runner" : summary.winner === "corp" ? "Corp" : "Draw"} gewinnt`}
        {" · "}
        {summary.replayOk ? "Replay ok" : "Replay prüfen"}
      </p>
      <p className="meta hashLine">{summary.finalStateHash}</p>
      {summary.errors.length > 0 ? <p className="notice">{summary.errors.join(", ")}</p> : null}
    </div>
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

function fromInitialResponse(response: CreateMatchResponse, side: Side): ClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: response.mode === "human_vs_human" ? (response.hostSide === "runner" ? "waiting_for_corp" : "waiting_for_runner") : "active",
    matchVersion: response.matchVersion,
    side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.playerView.publicEvents,
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: response.mode !== "human_vs_human" },
    ...(response.playerView.winner ? { winner: response.playerView.winner } : {})
  };
}

function fromJoinedResponse(response: JoinMatchResponse): ClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: "active",
    matchVersion: response.matchVersion,
    side: response.side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.eventTail ?? response.playerView.publicEvents,
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false },
    ...(response.playerView.winner ? { winner: response.playerView.winner } : {})
  };
}

async function bootstrap(session: SessionInfo): Promise<ClientPayload | null> {
  const response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/bootstrap?side=${session.side}`, {
    headers: { authorization: `Bearer ${session.sessionToken}` },
    cache: "no-store"
  });
  if (!response.ok) return null;
  return (await response.json()) as ClientPayload;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${SERVER_HTTP}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return (await response.json()) as T;
}

function persistSession(session: SessionInfo) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(SESSION_KEY);
}

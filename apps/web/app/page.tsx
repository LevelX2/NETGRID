"use client";

import {
  Activity,
  Bot,
  Cable,
  Check,
  Clipboard,
  CopyPlus,
  Download,
  Eye,
  Image,
  Keyboard,
  Layers3,
  Link2,
  ListFilter,
  PanelRightOpen,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  X,
  ZoomIn
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeckPublicMetadata, LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard, Winner } from "@netrunner/shared";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETRUNNER_SERVER_URL ?? "http://127.0.0.1:8787";
const SESSION_KEY = "netrunner-mvp-0-3-session";
const DECK_STORAGE_KEY = "netrunner-v0-6-local-decks";
const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_004_snapshot_v0_6";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_004_snapshot_v0_6";

type MatchStatus = "waiting_for_runner" | "waiting_for_corp" | "active" | "finished";
type GameMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai" | "ai_vs_ai";
type AiDifficulty = "easy" | "normal" | "hard";
type CardDisplayMode = "placeholder" | "text-card" | "compact";

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

type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

type EditableDeck = {
  deckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

type DeckTemplate = {
  templateId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  editableCopyAllowed: boolean;
  cards: DeckCardEntry[];
};

type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
};

type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  rulesBaselineId: string;
  immutable: boolean;
  cards: DeckCardEntry[];
  validation: DeckValidationResult;
  publicMetadata: DeckPublicMetadata;
  deckHash: string;
};

type DeckSnapshotsResponse = {
  snapshots: DeckSnapshot[];
};

type DeckTemplatesResponse = {
  templates: DeckTemplate[];
};

type DeckValidationResponse = {
  validation: DeckValidationResult;
  snapshot: DeckSnapshot | null;
  error?: { message: string };
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
  const [allCatalogCards, setAllCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [deckSnapshots, setDeckSnapshots] = useState<DeckSnapshot[]>([]);
  const [deckTemplates, setDeckTemplates] = useState<DeckTemplate[]>([]);
  const [runnerDeckSource, setRunnerDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [corpDeckSource, setCorpDeckSource] = useState<"snapshot" | "local">("snapshot");
  const [selectedRunnerSnapshotId, setSelectedRunnerSnapshotId] = useState(DEFAULT_RUNNER_SNAPSHOT_ID);
  const [selectedCorpSnapshotId, setSelectedCorpSnapshotId] = useState(DEFAULT_CORP_SNAPSHOT_ID);
  const [runnerLocalSnapshot, setRunnerLocalSnapshot] = useState<DeckSnapshot | null>(null);
  const [corpLocalSnapshot, setCorpLocalSnapshot] = useState<DeckSnapshot | null>(null);
  const [localDecks, setLocalDecks] = useState<EditableDeck[]>([]);
  const [localDecksLoaded, setLocalDecksLoaded] = useState(false);
  const [selectedLocalDeckId, setSelectedLocalDeckId] = useState<string | null>(null);
  const [deckValidation, setDeckValidation] = useState<DeckValidationResult | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] = useState<DeckSnapshot | null>(null);
  const [deckImportText, setDeckImportText] = useState("");
  const [deckExportText, setDeckExportText] = useState("");
  const [addCardId, setAddCardId] = useState("");
  const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>("placeholder");
  const [focusedCard, setFocusedCard] = useState<VisibleCard | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
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
    const storedDecks = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (storedDecks) {
      try {
        const parsed = JSON.parse(storedDecks) as EditableDeck[];
        setLocalDecks(parsed);
        setSelectedLocalDeckId(parsed[0]?.deckId ?? null);
      } catch {
        window.localStorage.removeItem(DECK_STORAGE_KEY);
      }
    }
    setLocalDecksLoaded(true);
  }, []);

  useEffect(() => {
    if (!localDecksLoaded) return;
    window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(localDecks));
  }, [localDecks, localDecksLoaded]);

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

  useEffect(() => {
    void fetch("/api/cards/catalog", { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => setAllCatalogCards(data.cards ?? []))
      .catch(() => setAllCatalogCards([]));
    void fetch("/api/decks/snapshots", { cache: "no-store" })
      .then((response) => response.json() as Promise<DeckSnapshotsResponse>)
      .then((data) => {
        setDeckSnapshots(data.snapshots ?? []);
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_RUNNER_SNAPSHOT_ID)) setSelectedRunnerSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "runner")?.deckSnapshotId ?? "");
        if (!data.snapshots?.some((snapshot) => snapshot.deckSnapshotId === DEFAULT_CORP_SNAPSHOT_ID)) setSelectedCorpSnapshotId(data.snapshots?.find((snapshot) => snapshot.side === "corp")?.deckSnapshotId ?? "");
      })
      .catch(() => setDeckSnapshots([]));
    void fetch("/api/decks/templates", { cache: "no-store" })
      .then((response) => response.json() as Promise<DeckTemplatesResponse>)
      .then((data) => setDeckTemplates(data.templates ?? []))
      .catch(() => setDeckTemplates([]));
  }, []);

  const activeView = payload?.playerView;
  const latestEventId = payload?.eventTail.at(-1)?.eventId;
  const canReconnect = Boolean(session?.reconnectToken);
  const runnerSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "runner");
  const corpSnapshots = deckSnapshots.filter((snapshot) => snapshot.side === "corp");
  const selectedRunnerSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedRunnerSnapshotId) ?? runnerSnapshots[0] ?? null;
  const selectedCorpSnapshot = deckSnapshots.find((snapshot) => snapshot.deckSnapshotId === selectedCorpSnapshotId) ?? corpSnapshots[0] ?? null;
  const effectiveRunnerSnapshot = runnerDeckSource === "local" ? runnerLocalSnapshot : selectedRunnerSnapshot;
  const effectiveCorpSnapshot = corpDeckSource === "local" ? corpLocalSnapshot : selectedCorpSnapshot;
  const selectedLocalDeck = localDecks.find((deck) => deck.deckId === selectedLocalDeckId) ?? null;
  const playableCatalogCards = allCatalogCards.filter((card) => card.statuses.playable && card.statuses.deck_legal && (!selectedLocalDeck || card.side === selectedLocalDeck.side) && card.type !== "identity");
  const previewCard = focusedCard ?? activeView?.run?.encounteredIce ?? activeView?.own.gripOrHq.find((card) => card.known) ?? activeView?.own.rig?.find((card) => card.known) ?? null;

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
      corpDifficulty,
      ...matchDeckPayload()
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
      ...matchDeckPayload(),
      agendaPointsToWin: effectiveCorpSnapshot?.validation.agendaPoints ?? 7,
      maxActions: 120
    });
    setSimulation(result.summary);
    setNotice("Simulation abgeschlossen.");
  };

  function matchDeckPayload() {
    return {
      ...(runnerDeckSource === "local" && runnerLocalSnapshot ? { runnerDeckSnapshot: runnerLocalSnapshot } : { runnerDeckSnapshotId: selectedRunnerSnapshotId }),
      ...(corpDeckSource === "local" && corpLocalSnapshot ? { corpDeckSnapshot: corpLocalSnapshot } : { corpDeckSnapshotId: selectedCorpSnapshotId })
    };
  }

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

  const createDeckFromTemplate = (templateId: string) => {
    const template = deckTemplates.find((candidate) => candidate.templateId === templateId);
    if (!template) return;
    const now = new Date().toISOString();
    const deck: EditableDeck = {
      deckId: `local_${template.sourceDeckId}_${crypto.randomUUID().slice(0, 8)}`,
      deckVersion: "0.6.0-local",
      name: `${template.name} Kopie`,
      side: template.side,
      identityCardId: template.identityCardId,
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: template.cards.map((entry) => ({ ...entry })),
      createdAt: now,
      updatedAt: now
    };
    setLocalDecks((current) => [...current, deck]);
    setSelectedLocalDeckId(deck.deckId);
    clearDeckValidation();
  };

  const updateSelectedDeck = (nextDeck: EditableDeck) => {
    setLocalDecks((current) => current.map((deck) => (deck.deckId === nextDeck.deckId ? { ...nextDeck, updatedAt: new Date().toISOString() } : deck)));
    clearDeckValidation();
  };

  const updateDeckCardQuantity = (cardId: string, quantity: number) => {
    if (!selectedLocalDeck) return;
    updateSelectedDeck({
      ...selectedLocalDeck,
      cards: selectedLocalDeck.cards
        .map((entry) => (entry.cardId === cardId ? { ...entry, quantity: Math.max(0, Math.floor(quantity)) } : entry))
        .filter((entry) => entry.quantity > 0)
    });
  };

  const addCardToDeck = () => {
    if (!selectedLocalDeck || !addCardId) return;
    const existing = selectedLocalDeck.cards.find((entry) => entry.cardId === addCardId);
    updateSelectedDeck({
      ...selectedLocalDeck,
      cards: existing
        ? selectedLocalDeck.cards.map((entry) => (entry.cardId === addCardId ? { ...entry, quantity: entry.quantity + 1 } : entry))
        : [...selectedLocalDeck.cards, { cardId: addCardId, quantity: 1 }]
    });
  };

  const duplicateSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    const now = new Date().toISOString();
    const copy = {
      ...selectedLocalDeck,
      deckId: `${selectedLocalDeck.deckId}_copy_${crypto.randomUUID().slice(0, 6)}`,
      name: `${selectedLocalDeck.name} Kopie`,
      createdAt: now,
      updatedAt: now
    };
    setLocalDecks((current) => [...current, copy]);
    setSelectedLocalDeckId(copy.deckId);
    clearDeckValidation();
  };

  const deleteSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    setLocalDecks((current) => {
      const next = current.filter((deck) => deck.deckId !== selectedLocalDeck.deckId);
      setSelectedLocalDeckId(next[0]?.deckId ?? null);
      return next;
    });
    clearDeckValidation();
  };

  const validateSelectedDeck = async () => {
    if (!selectedLocalDeck) return;
    const result = await fetch("/api/decks/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck: selectedLocalDeck })
    }).then((response) => response.json() as Promise<DeckValidationResponse>);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setDeckValidation(result.validation);
    setValidatedSnapshot(result.snapshot);
    setNotice(result.validation.ok ? "Deck validiert." : "Deck braucht noch Korrekturen.");
  };

  const useValidatedDeckForMatch = () => {
    if (!validatedSnapshot) return;
    if (validatedSnapshot.side === "runner") {
      setRunnerLocalSnapshot(validatedSnapshot);
      setRunnerDeckSource("local");
    } else {
      setCorpLocalSnapshot(validatedSnapshot);
      setCorpDeckSource("local");
    }
    setNotice("Deck-Snapshot für Match Setup gesetzt.");
  };

  const exportSelectedDeck = () => {
    if (!selectedLocalDeck) return;
    setDeckExportText(`${JSON.stringify({ schemaVersion: "editable-deck-v0.6", deck: selectedLocalDeck }, null, 2)}\n`);
  };

  const importLocalDeck = () => {
    let parsed: { deck?: EditableDeck };
    try {
      parsed = JSON.parse(deckImportText) as { deck?: EditableDeck };
    } catch {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    if (!parsed.deck || (parsed.deck.side !== "runner" && parsed.deck.side !== "corp")) {
      setNotice("Deck-Import konnte nicht gelesen werden.");
      return;
    }
    const now = new Date().toISOString();
    const imported = {
      ...parsed.deck,
      deckId: parsed.deck.deckId || `local_import_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: parsed.deck.createdAt || now,
      updatedAt: now
    };
    setLocalDecks((current) => [...current.filter((deck) => deck.deckId !== imported.deckId), imported]);
    setSelectedLocalDeckId(imported.deckId);
    clearDeckValidation();
    setNotice("Deck importiert.");
  };

  function clearDeckValidation() {
    setDeckValidation(null);
    setValidatedSnapshot(null);
  }

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
          <Brand subtitle="V0.7 UI · private Matches" />
          <ConnectionBadge text={statusText} state={connection} />
        </header>
        <div className="setup v07Entry">
          <section className="entryHero">
            <div>
              <p className="eyebrow">Clean Board</p>
              <h2>Private Netrunner-Konsole</h2>
              <p className="meta">Design C als Hauptstruktur, Run-Fokus aus Design D und Diagnose nur im Drawer.</p>
            </div>
            <PreflightBar />
          </section>
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
                <label>
                  Runner-Deck
                  <select
                    value={runnerDeckSource === "local" && runnerLocalSnapshot ? "local" : selectedRunnerSnapshotId}
                    onChange={(event) => {
                      if (event.target.value === "local") setRunnerDeckSource("local");
                      else {
                        setRunnerDeckSource("snapshot");
                        setSelectedRunnerSnapshotId(event.target.value);
                      }
                    }}
                  >
                    {runnerSnapshots.map((snapshot) => (
                      <option value={snapshot.deckSnapshotId} key={snapshot.deckSnapshotId}>
                        {snapshot.name}
                      </option>
                    ))}
                    {runnerLocalSnapshot ? <option value="local">Lokaler Snapshot · {runnerLocalSnapshot.name}</option> : null}
                  </select>
                </label>
                <label>
                  Corp-Deck
                  <select
                    value={corpDeckSource === "local" && corpLocalSnapshot ? "local" : selectedCorpSnapshotId}
                    onChange={(event) => {
                      if (event.target.value === "local") setCorpDeckSource("local");
                      else {
                        setCorpDeckSource("snapshot");
                        setSelectedCorpSnapshotId(event.target.value);
                      }
                    }}
                  >
                    {corpSnapshots.map((snapshot) => (
                      <option value={snapshot.deckSnapshotId} key={snapshot.deckSnapshotId}>
                        {snapshot.name}
                      </option>
                    ))}
                    {corpLocalSnapshot ? <option value="local">Lokaler Snapshot · {corpLocalSnapshot.name}</option> : null}
                  </select>
                </label>
                <DeckMetadataLine runner={effectiveRunnerSnapshot?.publicMetadata} corp={effectiveCorpSnapshot?.publicMetadata} />
                <CardDisplaySettings mode={cardDisplayMode} onChange={setCardDisplayMode} />
                <BoardPreview displayMode={cardDisplayMode} />
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
          <DeckEditorPanel
            templates={deckTemplates}
            localDecks={localDecks}
            selectedDeck={selectedLocalDeck}
            validation={deckValidation}
            validatedSnapshot={validatedSnapshot}
            playableCards={playableCatalogCards}
            addCardId={addCardId}
            importText={deckImportText}
            exportText={deckExportText}
            onCreateFromTemplate={createDeckFromTemplate}
            onSelectDeck={setSelectedLocalDeckId}
            onUpdateDeck={updateSelectedDeck}
            onUpdateQuantity={updateDeckCardQuantity}
            onAddCardId={setAddCardId}
            onAddCard={addCardToDeck}
            onDuplicate={duplicateSelectedDeck}
            onDelete={deleteSelectedDeck}
            onValidate={validateSelectedDeck}
            onUseForMatch={useValidatedDeckForMatch}
            onExport={exportSelectedDeck}
            onImportText={setDeckImportText}
            onImport={importLocalDeck}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <Brand subtitle={`V0.7 · ${session.side === "runner" ? "Runner" : "Corp"}`} />
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
        <span>State {activeView.stateVersion}</span>
        <span>{notice}</span>
      </div>

      <div className="main">
        <aside className="column panel sidePanel">
          <PlayerPanel view={activeView} title={session.side === "runner" ? "Runner" : "Corp"} />
          <LegalActionsPanel actions={payload.legalActions} disabled={Boolean(payload.winner) || connection !== "online"} onAction={submitAction} />
          <UndoPanel pendingUndo={payload.pendingUndo} latestEventId={latestEventId} connection={connection} onRequest={requestUndo} onResolve={resolveUndo} />
        </aside>

        <section className="board boardPanel">
          <BoardHeader view={activeView} />
          <RunTimeline view={activeView} />
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
                <div className="lane">{server.ice.map((card) => <CardView key={card.instanceId} card={card} compact displayMode={cardDisplayMode} onFocus={setFocusedCard} />)}</div>
                <div className="laneLabel">Root</div>
                <div className="lane">{server.root.map((card) => <CardView key={card.instanceId} card={card} compact displayMode={cardDisplayMode} onFocus={setFocusedCard} />)}</div>
              </article>
            ))}
          </div>
          <section className="section panel boardSection">
            <h2>{session.side === "runner" ? "Grip" : "HQ"}</h2>
            <div className="cards">{activeView.own.gripOrHq.map((card) => <CardView key={card.instanceId} card={card} displayMode={cardDisplayMode} onFocus={setFocusedCard} />)}</div>
          </section>
          {activeView.own.rig ? (
            <section className="section panel boardSection">
              <h2>Rig</h2>
              <div className="cards">{activeView.own.rig.map((card) => <CardView key={card.instanceId} card={card} displayMode={cardDisplayMode} onFocus={setFocusedCard} />)}</div>
            </section>
          ) : null}
        </section>

        <aside className="log panel rightRail">
          <section className="section">
            <CardDisplaySettings mode={cardDisplayMode} onChange={setCardDisplayMode} compact />
          </section>
          <CardPreviewPanel card={previewCard} displayMode={cardDisplayMode} />
          <section className="section">
            <h2>Gegenseite</h2>
            <div className="stats">
              <Stat label="Credits" value={activeView.opponent.credits} />
              <Stat label="Clicks" value={activeView.opponent.clicks} />
              <Stat label="Agenda" value={activeView.opponent.agendaPoints} />
            </div>
            {activeView.deckMetadata ? (
              <div className="deckMini">
                <span>{activeView.deckMetadata.opponent.deckName}</span>
                <small>{activeView.deckMetadata.opponent.deckHash}</small>
              </div>
            ) : null}
            <p className="meta statusLine">{payload.opponentStatus.connected ? "Verbunden" : "Offline"} · {activeView.timingPoint}</p>
          </section>
          <EventLogPanel events={payload.eventTail} />
          <section className="section">
            <button className="button wide" onClick={() => setDiagnosticsOpen((current) => !current)}>
              <PanelRightOpen size={15} />
              Diagnostics
            </button>
          </section>
          <DiagnosticsDrawer open={diagnosticsOpen} payload={payload} connection={connection} />
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

function PreflightBar() {
  const checks = [
    { icon: <Shield size={15} />, label: "Hidden-Info safe" },
    { icon: <Activity size={15} />, label: "Replay ready" },
    { icon: <Layers3 size={15} />, label: "Decks validiert" }
  ];
  return (
    <div className="preflightBar">
      {checks.map((check) => (
        <span key={check.label}>
          {check.icon}
          {check.label}
        </span>
      ))}
    </div>
  );
}

function CardDisplaySettings({ mode, onChange, compact = false }: { mode: CardDisplayMode; onChange(value: CardDisplayMode): void; compact?: boolean }) {
  return (
    <div className={`cardDisplaySettings ${compact ? "compact" : ""}`}>
      <div>
        <span className="settingsTitle">Card Display</span>
        {!compact ? <span className="meta">Lokale Anzeigeoption, kein Match-State</span> : null}
      </div>
      <div className="segmented" role="group" aria-label="Card Display Mode">
        <button className={mode === "placeholder" ? "active" : ""} onClick={() => onChange("placeholder")} type="button" title="Platzhalterkarten">
          <Image size={15} />
          {!compact ? "Bild" : null}
        </button>
        <button className={mode === "text-card" ? "active" : ""} onClick={() => onChange("text-card")} type="button" title="Text-Fallback">
          <Keyboard size={15} />
          {!compact ? "Text" : null}
        </button>
        <button className={mode === "compact" ? "active" : ""} onClick={() => onChange("compact")} type="button" title="Kompakte Karten">
          <ZoomIn size={15} />
          {!compact ? "Kompakt" : null}
        </button>
      </div>
    </div>
  );
}

function BoardPreview({ displayMode }: { displayMode: CardDisplayMode }) {
  const previewCards: VisibleCard[] = [
    { instanceId: "preview-runner", known: true, title: "Demo Program", type: "program", subtypes: ["Icebreaker"], strength: 2 },
    { instanceId: "preview-corp", known: true, title: "Demo ICE", type: "ice", subtypes: ["Barrier"], strength: 3 },
    { instanceId: "preview-hidden", known: false }
  ];
  return (
    <div className="boardPreview" aria-label="Board Preview">
      {previewCards.map((card) => (
        <CardView key={card.instanceId} card={card} displayMode={displayMode} compact />
      ))}
    </div>
  );
}

function BoardHeader({ view }: { view: PlayerView }) {
  return (
    <div className={`boardHeader ${view.side}`}>
      <div>
        <p className="eyebrow">{view.side === "runner" ? "Runner View" : "Corp View"}</p>
        <h2>{view.activeSide === view.side ? "Dein Fenster" : "Gegenseite aktiv"}</h2>
      </div>
      <div className="zoneCounts">
        <span>{view.side === "runner" ? "Stack" : "R&D"} {view.own.stackOrRdCount}</span>
        <span>{view.side === "runner" ? "Grip" : "HQ"} {view.own.gripOrHq.length}</span>
        <span>{view.side === "runner" ? "Heap" : "Archives"} {view.own.heapOrArchives.length}</span>
        <span>Gegnerhand {view.opponent.handCount}</span>
      </div>
    </div>
  );
}

function RunTimeline({ view }: { view: PlayerView }) {
  const phase = view.run?.phase;
  const steps = ["target", "approach_ice", "encounter_ice", "break", "access", "complete"] as const;
  const labels: Record<(typeof steps)[number], string> = {
    target: "Ziel",
    approach_ice: "Approach",
    encounter_ice: "Encounter",
    break: "Break",
    access: "Access",
    complete: "Ergebnis"
  };
  return (
    <div className={`runTimeline ${view.run ? "active" : ""}`}>
      <div className="runTimelineHead">
        <Shield size={18} />
        <span>{view.run ? `Run auf ${view.run.attackedServerId}` : "Kein aktiver Run"}</span>
      </div>
      <div className="runSteps">
        {steps.map((step) => (
          <span className={phase === step || (!phase && step === "target") ? "current" : ""} key={step}>
            {labels[step]}
          </span>
        ))}
      </div>
      {view.run?.encounteredIce ? (
        <div className="encounterFocus">
          <span>Encounter</span>
          <strong>{view.run.encounteredIce.known ? view.run.encounteredIce.title : "Verdecktes ICE"}</strong>
        </div>
      ) : null}
    </div>
  );
}

function LegalActionsPanel({ actions, disabled, onAction }: { actions: LegalAction[]; disabled: boolean; onAction(action: LegalAction): void }) {
  const grouped = actions.reduce<Record<string, LegalAction[]>>((acc, action) => {
    const group = action.type.replaceAll("_", " ");
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});
  return (
    <section className="section">
      <h2>LegalActions</h2>
      <div className="actions">
        {Object.entries(grouped).map(([group, groupActions]) => (
          <div className="actionGroup" key={group}>
            <span>{group}</span>
            {groupActions.map((action) => (
              <button className="button actionButton primary" key={action.actionId} onClick={() => onAction(action)} disabled={disabled}>
                <Play size={15} />
                {action.label}
              </button>
            ))}
          </div>
        ))}
        {actions.length === 0 ? <p className="meta">Keine Aktion im aktuellen Fenster.</p> : null}
      </div>
    </section>
  );
}

function UndoPanel({
  pendingUndo,
  latestEventId,
  connection,
  onRequest,
  onResolve
}: {
  pendingUndo: ClientPayload["pendingUndo"] | undefined;
  latestEventId: string | undefined;
  connection: "offline" | "connecting" | "online";
  onRequest(): void;
  onResolve(accepted: boolean): void;
}) {
  return (
    <section className="section">
      <h2>Undo</h2>
      {pendingUndo?.needsResponse ? (
        <div className="undoBox">
          <p className="meta">{pendingUndo.requestedBy === "runner" ? "Runner" : "Corp"} fragt Undo an.</p>
          <div className="splitButtons">
            <button className="button primary" onClick={() => onResolve(true)}>
              <Check size={15} />
              OK
            </button>
            <button className="button" onClick={() => onResolve(false)}>
              <X size={15} />
              Nein
            </button>
          </div>
        </div>
      ) : (
        <button className="button wide" onClick={onRequest} disabled={!latestEventId || connection !== "online"}>
          <RotateCcw size={15} />
          Undo
        </button>
      )}
    </section>
  );
}

function CardPreviewPanel({ card, displayMode }: { card: VisibleCard | null; displayMode: CardDisplayMode }) {
  return (
    <section className="section cardPreviewPanel">
      <div className="sectionTitleLine">
        <h2>Preview</h2>
        <Eye size={16} />
      </div>
      {card ? (
        <>
          <CardView card={card} displayMode={displayMode} preview />
          <p className="meta">
            {card.known ? [card.type, card.subtypes?.join(" / "), card.strength !== undefined ? `Stärke ${card.strength}` : ""].filter(Boolean).join(" · ") : "Redacted"}
          </p>
        </>
      ) : (
        <p className="meta">Fokussiere eine bekannte Karte.</p>
      )}
    </section>
  );
}

function EventLogPanel({ events }: { events: PublicGameEvent[] }) {
  return (
    <section className="section">
      <h2>EventLog</h2>
      <div className="events">
        {events
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
  );
}

function DiagnosticsDrawer({ open, payload, connection }: { open: boolean; payload: ClientPayload; connection: "offline" | "connecting" | "online" }) {
  if (!open) return null;
  const hash = payload.finalStateHash ?? payload.eventTail.at(-1)?.stateHashAfter ?? payload.playerView.publicEvents.at(-1)?.stateHashAfter ?? "pending";
  return (
    <section className="section diagnosticsDrawer">
      <h2>Diagnostics</h2>
      <dl>
        <div>
          <dt>Connection</dt>
          <dd>{connection}</dd>
        </div>
        <div>
          <dt>StateVersion</dt>
          <dd>{payload.playerView.stateVersion}</dd>
        </div>
        <div>
          <dt>MatchVersion</dt>
          <dd>{payload.matchVersion}</dd>
        </div>
        <div>
          <dt>StateHash</dt>
          <dd>{hash}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>side-filtered</dd>
        </div>
      </dl>
    </section>
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

function DeckMetadataLine({ runner, corp }: { runner: DeckPublicMetadata | undefined; corp: DeckPublicMetadata | undefined }) {
  if (!runner && !corp) return null;
  return (
    <div className="deckMetadataLine">
      {runner ? (
        <span>
          Runner: {runner.deckName} · {runner.deckHash}
        </span>
      ) : null}
      {corp ? (
        <span>
          Corp: {corp.deckName} · {corp.deckHash}
        </span>
      ) : null}
    </div>
  );
}

function DeckEditorPanel({
  templates,
  localDecks,
  selectedDeck,
  validation,
  validatedSnapshot,
  playableCards,
  addCardId,
  importText,
  exportText,
  onCreateFromTemplate,
  onSelectDeck,
  onUpdateDeck,
  onUpdateQuantity,
  onAddCardId,
  onAddCard,
  onDuplicate,
  onDelete,
  onValidate,
  onUseForMatch,
  onExport,
  onImportText,
  onImport
}: {
  templates: DeckTemplate[];
  localDecks: EditableDeck[];
  selectedDeck: EditableDeck | null;
  validation: DeckValidationResult | null;
  validatedSnapshot: DeckSnapshot | null;
  playableCards: CatalogCardSummary[];
  addCardId: string;
  importText: string;
  exportText: string;
  onCreateFromTemplate(templateId: string): void;
  onSelectDeck(deckId: string): void;
  onUpdateDeck(deck: EditableDeck): void;
  onUpdateQuantity(cardId: string, quantity: number): void;
  onAddCardId(cardId: string): void;
  onAddCard(): void;
  onDuplicate(): void;
  onDelete(): void;
  onValidate(): void;
  onUseForMatch(): void;
  onExport(): void;
  onImportText(value: string): void;
  onImport(): void;
}) {
  const totalCards = selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const cardTitle = (cardId: string) => playableCards.find((card) => card.catalogCardId === cardId)?.title ?? cardId;
  return (
    <section className="deckPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>Decks</h2>
          <p className="meta">
            {localDecks.length} lokal · {templates.length} Templates
          </p>
        </div>
        <Save size={18} />
      </div>
      <div className="deckTemplateRow">
        {templates.map((template) => (
          <button className={`button ${template.side === "corp" ? "corp" : ""}`} key={template.templateId} onClick={() => onCreateFromTemplate(template.templateId)}>
            <CopyPlus size={15} />
            {template.name}
          </button>
        ))}
      </div>
      <div className="deckWorkspace">
        <div className="deckEditor">
          <label>
            Lokales Deck
            <select value={selectedDeck?.deckId ?? ""} onChange={(event) => onSelectDeck(event.target.value)} disabled={localDecks.length === 0}>
              <option value="">Kein lokales Deck</option>
              {localDecks.map((deck) => (
                <option value={deck.deckId} key={deck.deckId}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
          {selectedDeck ? (
            <>
              <div className="deckFormGrid">
                <label>
                  Name
                  <input value={selectedDeck.name} onChange={(event) => onUpdateDeck({ ...selectedDeck, name: event.target.value })} />
                </label>
                <label>
                  Seite
                  <input value={selectedDeck.side} readOnly />
                </label>
                <label>
                  Karten
                  <input value={totalCards} readOnly />
                </label>
                <label>
                  Notiz
                  <input value={selectedDeck.notes ?? ""} onChange={(event) => onUpdateDeck({ ...selectedDeck, notes: event.target.value })} />
                </label>
              </div>
              <div className="deckCardList">
                {selectedDeck.cards.map((entry) => (
                  <div className="deckCardRow" key={entry.cardId}>
                    <span>{cardTitle(entry.cardId)}</span>
                    <input type="number" min={0} max={9} value={entry.quantity} onChange={(event) => onUpdateQuantity(entry.cardId, Number(event.target.value))} />
                  </div>
                ))}
              </div>
              <div className="deckAddRow">
                <select value={addCardId} onChange={(event) => onAddCardId(event.target.value)}>
                  <option value="">Karte hinzufügen</option>
                  {playableCards.map((card) => (
                    <option value={card.catalogCardId} key={card.catalogCardId}>
                      {card.title}
                    </option>
                  ))}
                </select>
                <button className="button" onClick={onAddCard} disabled={!addCardId}>
                  <Plus size={15} />
                  Hinzufügen
                </button>
              </div>
              <div className="deckActions">
                <button className="button primary" onClick={onValidate}>
                  <Check size={15} />
                  Validieren
                </button>
                <button className="button" onClick={onUseForMatch} disabled={!validatedSnapshot}>
                  <Play size={15} />
                  Für Match
                </button>
                <button className="button" onClick={onExport}>
                  <Download size={15} />
                  Export
                </button>
                <button className="button" onClick={onDuplicate}>
                  <CopyPlus size={15} />
                  Duplizieren
                </button>
                <button className="button" onClick={onDelete}>
                  <Trash2 size={15} />
                  Löschen
                </button>
              </div>
              <DeckValidationSummary validation={validation} snapshot={validatedSnapshot} />
              {exportText ? <textarea className="deckTextArea" value={exportText} readOnly /> : null}
            </>
          ) : (
            <p className="meta deckEmpty">Erstelle eine Kopie aus einem Template oder importiere ein lokales Deck.</p>
          )}
        </div>
        <div className="deckImportBox">
          <h3>Import</h3>
          <textarea className="deckTextArea" value={importText} onChange={(event) => onImportText(event.target.value)} placeholder='{"schemaVersion":"editable-deck-v0.6","deck":...}' />
          <button className="button wide" onClick={onImport} disabled={!importText.trim()}>
            <Upload size={15} />
            Importieren
          </button>
        </div>
      </div>
    </section>
  );
}

function DeckValidationSummary({ validation, snapshot }: { validation: DeckValidationResult | null; snapshot: DeckSnapshot | null }) {
  if (!validation) return null;
  return (
    <div className={`deckValidation ${validation.ok ? "ok" : "bad"}`}>
      <strong>{validation.ok ? "Validiert" : "Nicht valide"}</strong>
      <span>
        {validation.totalCards} Karten{validation.agendaPoints !== null ? ` · ${validation.agendaPoints} Agenda Points` : ""}
      </span>
      {snapshot ? <small>{snapshot.deckHash}</small> : null}
      {[...validation.errors, ...validation.warnings].map((message) => (
        <small key={message}>{message}</small>
      ))}
    </div>
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
      {view.deckMetadata ? (
        <div className="deckMini">
          <span>{view.deckMetadata.own.deckName}</span>
          <small>{view.deckMetadata.own.deckHash}</small>
        </div>
      ) : null}
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

function CardView({
  card,
  compact = false,
  preview = false,
  displayMode,
  onFocus
}: {
  card: VisibleCard;
  compact?: boolean;
  preview?: boolean;
  displayMode: CardDisplayMode;
  onFocus?(card: VisibleCard): void;
}) {
  const typeClass = card.known && card.type ? ` ${card.type}` : "";
  const isCompact = compact || displayMode === "compact";
  const modeClass = displayMode === "text-card" ? " textCard" : displayMode === "compact" ? " compactCard" : " placeholderCard";
  return (
    <button
      type="button"
      className={`card${card.known ? typeClass : " hidden"}${modeClass}${preview ? " preview" : ""}`}
      onClick={() => onFocus?.(card)}
      aria-label={card.known ? `Karte ${card.title}` : "Verdeckte Karte"}
    >
      <span className="cardArt" aria-hidden="true" />
      <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>
      {!isCompact ? <span className="cardMeta">{card.known ? [card.type, card.subtypes?.join(" / ")].filter(Boolean).join(" · ") : "Redacted"}</span> : null}
      {card.known && card.advancementCounters ? <span className="cardMeta">Adv: {card.advancementCounters}</span> : null}
      {card.known && card.strength !== undefined ? <span className="cardMeta">Stärke {card.strength}</span> : null}
    </button>
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

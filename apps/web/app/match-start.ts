import type { ApiMatchStatus, ApiPlayerClockSnapshot } from "@netgrid/shared";
import readinessData from "../../../data/ai/card-set-ai-readiness-v1.json";

export type PlayMode = "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
export type HumanSideSelection = "runner" | "corp" | "random";
export type HumanAiSideSelection = "runner" | "corp" | "random";
export type TechnicalMatchMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai";
export type MatchFormatSelection = "rules_match" | "two_game_side_swap";
export const MATCH_CARD_POOL_OPTIONS = ["originalset", "originalset_classic", "originalset_proteus", "originalset_classic_proteus"] as const;
export type MatchCardPoolSelection = (typeof MATCH_CARD_POOL_OPTIONS)[number];
export type AiDeckPolicySelection = "selected" | "fixed" | "seeded_random" | "same_as_participant_a";

export function aiDeckReadinessLabel(
  policy: AiDeckPolicySelection,
  cardPool: MatchCardPoolSelection
): { title: string; detail: string; ready: boolean } {
  const includesProteus = cardPool === "originalset_proteus" || cardPool === "originalset_classic_proteus";
  const usesDefaultPool = policy === "fixed" || policy === "seeded_random";
  if (!includesProteus) {
    return {
      title: usesDefaultPool ? "Standardpool freigegeben" : "Auswahlmodus freigegeben",
      detail: usesDefaultPool ? "Nur für den gewählten Kartenpool qualifizierte KI-Decks" : "Das gewählte Deck muss KI-unterstützte Karten enthalten",
      ready: true
    };
  }
  const stage = usesDefaultPool ? "default_pool_ready" : "selected_ai_playtest_ready";
  const ready = readinessData.sets.find((entry) => entry.setId === "proteus")?.stages[stage].ready === true;
  return {
    title: usesDefaultPool ? `Protheus-KI: Standardpool ${ready ? "freigegeben" : "gesperrt"}` : `Protheus-KI: Selected/Pilot ${ready ? "freigegeben" : "gesperrt"}`,
    detail: usesDefaultPool ? "Vier qualifizierte Pilotdecks · Fixed und Seeded Random" : "Explizit gewählte KI-Decks · side-sicherer Playtest-Stand",
    ready
  };
}

export type DerivedMatchStart = {
  requestedPlayMode: PlayMode;
  technicalMode?: TechnicalMatchMode;
  hostSide: HumanSideSelection;
  hasAiOpponent: boolean;
  isSimulation: boolean;
  createRequest:
    | { mode: "human_vs_human"; hostSide: HumanSideSelection }
    | { playMode: "human_vs_ai"; humanSide: HumanAiSideSelection; hostSide: HumanSideSelection }
    | { simulation: "ai_vs_ai"; hostSide: "runner" };
};

export function deriveMatchStart(input: {
  playMode: PlayMode;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
}): DerivedMatchStart {
  if (input.playMode === "ai_vs_ai") {
    return {
      requestedPlayMode: "ai_vs_ai",
      hostSide: "runner",
      hasAiOpponent: true,
      isSimulation: true,
      createRequest: { simulation: "ai_vs_ai", hostSide: "runner" }
    };
  }

  if (input.playMode === "human_vs_ai") {
    const technicalMode =
      input.humanAiSideSelection === "runner" ? "human_runner_vs_corp_ai" : input.humanAiSideSelection === "corp" ? "human_corp_vs_runner_ai" : undefined;
    return {
      requestedPlayMode: "human_vs_ai",
      ...(technicalMode ? { technicalMode } : {}),
      hostSide: input.humanAiSideSelection,
      hasAiOpponent: true,
      isSimulation: false,
      createRequest: { playMode: "human_vs_ai", humanSide: input.humanAiSideSelection, hostSide: input.humanAiSideSelection }
    };
  }

  return {
    requestedPlayMode: "human_vs_human",
    technicalMode: "human_vs_human",
    hostSide: input.humanSideSelection,
    hasAiOpponent: false,
    isSimulation: false,
    createRequest: { mode: "human_vs_human", hostSide: input.humanSideSelection }
  };
}

export function playModeLabel(mode: PlayMode): string {
  if (mode === "human_vs_human") return "Mensch gegen Mensch · privater Link";
  if (mode === "human_vs_ai") return "Mensch gegen KI";
  return "KI gegen KI · Simulation";
}

export function playModeCardLabel(mode: PlayMode): { title: string; description: string } {
  if (mode === "human_vs_human") return { title: "Privates Duell", description: "Zwei Menschen per Link" };
  if (mode === "human_vs_ai") return { title: "Gegen KI", description: "Schnelles Spiel gegen eine KI-Seite" };
  return { title: "Simulation", description: "KI gegen KI zum Beobachten und Testen" };
}

export function matchFormatCardLabel(format: MatchFormatSelection): { title: string; description: string } {
  if (format === "two_game_side_swap") return { title: "Matchserie", description: "Zwei Spiele mit Seitenwechsel" };
  return { title: "Regelmatch", description: "7 Agendapunkte, ein Spiel" };
}

export function matchCardPoolCardLabel(cardPool: MatchCardPoolSelection): { title: string; description: string } {
  if (cardPool === "originalset_classic") return { title: "Originalset & Classic", description: "Classic wird als Zusatzset zugelassen" };
  if (cardPool === "originalset_proteus") return { title: "Originalset & Protheus", description: "Protheus wird als Zusatzset zugelassen" };
  if (cardPool === "originalset_classic_proteus") return { title: "Originalset & Classic & Protheus", description: "Beide Zusatzsets werden zugelassen" };
  return { title: "Nur Originalset", description: "Zusatzsets werden nicht zugelassen" };
}

export function matchCardPoolSummaryLabel(cardPool: MatchCardPoolSelection | undefined): string {
  if (cardPool === "originalset_classic") return "Kartenpool: Originalset & Classic";
  if (cardPool === "originalset_proteus") return "Kartenpool: Originalset & Protheus";
  if (cardPool === "originalset_classic_proteus") return "Kartenpool: Originalset & Classic & Protheus";
  return "Kartenpool: nur Originalset";
}

export function parseJoinLinkInput(input: string): { matchId: string; joinToken: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, "http://netgrid.local");
    const matchId = url.searchParams.get("matchId")?.trim();
    const joinToken = url.searchParams.get("joinToken")?.trim();
    if (!matchId || !joinToken) return null;
    return { matchId, joinToken };
  } catch {
    return null;
  }
}

export function matchStartSummary(input: {
  playMode: PlayMode;
  matchFormat: MatchFormatSelection;
  matchCardPool?: MatchCardPoolSelection;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
  aiDeckPolicy?: AiDeckPolicySelection;
  testSetupMode?: boolean;
}): string[] {
  const playMode = playModeCardLabel(input.playMode).title;
  const format = input.matchFormat === "two_game_side_swap" ? "Matchserie mit Seitenwechsel" : "Regelmatch bis 7 Agendapunkte";
  const cardPool = matchCardPoolSummaryLabel(input.matchCardPool);
  const side =
    input.playMode === "human_vs_human"
      ? input.humanSideSelection === "random"
        ? "Seite wird ausgelost"
        : `Du startest als ${input.humanSideSelection === "runner" ? "Runner" : "Korp"}`
      : input.playMode === "human_vs_ai"
        ? input.humanAiSideSelection === "random"
          ? "Deine Seite wird ausgelost"
          : `Du spielst ${input.humanAiSideSelection === "runner" ? "Runner" : "Korp"}`
        : "KI gegen KI";
  const deckPolicy =
    input.playMode === "human_vs_human"
      ? input.testSetupMode
        ? "Testkonstellation mit beiden Deckpaaren"
        : "Teilnehmer B wählt Decks beim Beitritt"
      : input.playMode === "human_vs_ai"
        ? input.aiDeckPolicy === "fixed"
          ? "KI-Decks: Standard"
          : input.aiDeckPolicy === "seeded_random"
            ? "KI-Decks: deterministisch zufällig"
            : input.aiDeckPolicy === "same_as_participant_a"
              ? "KI-Decks: wie Teilnehmer A"
              : "KI-Decks: ausgewählt"
        : input.aiDeckPolicy === "seeded_random"
          ? "Simulationsdecks: deterministisch zufällig"
          : input.aiDeckPolicy === "fixed"
            ? "Simulationsdecks: Standard"
            : input.aiDeckPolicy === "same_as_participant_a"
              ? "Simulationsdecks: wie erste Auswahl"
              : "Simulationsdecks: ausgewählt";
  return [playMode, side, format, cardPool, deckPolicy];
}

export function matchStartLobbyBlocksSetup(status: ApiMatchStatus | undefined): boolean {
  return (
    status === "pending" ||
    status === "waiting_for_runner" ||
    status === "waiting_for_corp" ||
    status === "waiting_for_joiner_decks" ||
    status === "ready_check" ||
    status === "countdown"
  );
}

export function matchStartPlayerClockLabel(snapshot: ApiPlayerClockSnapshot | undefined): string {
  if (!snapshot || snapshot.mode === "none") return "Ohne Spielerzeit";
  const minutes = snapshot.startingTimeMs ? Math.round(snapshot.startingTimeMs / 60_000) : null;
  const graceSeconds = snapshot.gracePeriodMs !== undefined ? Math.round(snapshot.gracePeriodMs / 1000) : null;
  if (minutes && graceSeconds !== null) return `Spielerzeit ${minutes} Min · ${graceSeconds} s Kulanz`;
  if (minutes) return `Spielerzeit ${minutes} Min`;
  return "Spielerzeit aktiv";
}

export function sideSelectionLabel(selection: HumanSideSelection): string {
  if (selection === "random") return "Auslosen";
  return selection === "runner" ? "Ich spiele Runner" : "Ich spiele Korp";
}

export function humanAiSideLabel(selection: HumanAiSideSelection): string {
  if (selection === "random") return "Auslosen";
  return selection === "runner" ? "Runner" : "Korp";
}

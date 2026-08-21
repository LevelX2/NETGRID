export const GAMEBOOK_LOCALES = ["de", "en", "fr"] as const;

export type GamebookLocale = (typeof GAMEBOOK_LOCALES)[number];

export const DEFAULT_GAMEBOOK_LOCALE: GamebookLocale = "en";

export function isGamebookLocale(value: unknown): value is GamebookLocale {
  return (
    typeof value === "string" &&
    GAMEBOOK_LOCALES.includes(value as GamebookLocale)
  );
}

export function normalizeGamebookLocale(value: unknown): GamebookLocale {
  return isGamebookLocale(value) ? value : DEFAULT_GAMEBOOK_LOCALE;
}

export function gamebookDownloadFilename(
  matchId: string,
  locale: GamebookLocale,
): string {
  return `netgrid-gamebook-${locale}-${matchId}.md`;
}

export type GamebookSide = "runner" | "corp";

export type GamebookMessages = {
  title: string;
  participantsHeading: string;
  setupHeading: string;
  finalResultHeading: string;
  openingHand: string;
  firstOpeningHand: string;
  newOpeningHand: string;
  handAtTurnStart: string;
  winnerField: string;
  finalScoreField: string;
  endedByField: string;
  unknownCard: string;
  unknownAgenda: string;
  unknownServer: string;
  newRemote: string;
  remoteArea: string;
  side(side: GamebookSide): string;
  actorPrefix(side: GamebookSide, isTurnSide: boolean): string;
  mulligan(side: GamebookSide): string;
  keepsOpeningHand(side: GamebookSide): string;
  turnHeading(side: GamebookSide, turn: number): string;
  actionLabel(start: number, end?: number): string;
  credits(runner: number, corp: number): string;
  finalScore(runner: number, corp: number): string;
  winner(side: GamebookSide | "draw", displayName?: string): string;
  resultReason(reason: string): string;
  runAction(server: string): string;
  installAction(title: string): string;
  playAction(title: string): string;
  rezAction(title: string): string;
  unknownAction(eventType: string): string;
  draws(actor: string, cards: readonly string[]): string;
  installs(
    actor: string,
    title: string,
    server?: string,
    position?: string,
  ): string;
  plays(actor: string, title: string, effects?: string): string;
  startsRun(actor: string, server: string): string;
  accesses(actor: string, title: string): string;
  endsTurn(actor: string): string;
  advances(actor: string, count: number, title: string): string;
  scores(actor: string, title: string): string;
  unknownEvent(actor: string, eventType: string): string;
  icePosition(index: number): string;
  gainsCredits(side: GamebookSide, credits: number): string;
};

const DE_GAMEBOOK_MESSAGES: GamebookMessages = {
  title: "Spielprotokoll",
  participantsHeading: "Beteiligte",
  setupHeading: "Spielvorbereitung",
  finalResultHeading: "Endergebnis",
  openingHand: "Starthand",
  firstOpeningHand: "erste Starthand",
  newOpeningHand: "neue Starthand",
  handAtTurnStart: "Hand zu Zugbeginn",
  winnerField: "Gewinner",
  finalScoreField: "Endstand",
  endedByField: "Beendet durch",
  unknownCard: "eine Karte",
  unknownAgenda: "eine Agenda",
  unknownServer: "einen Server",
  newRemote: "einem neuen Remote",
  remoteArea: "im Remote-Bereich",
  side: (side) => (side === "corp" ? "Korp" : "Runner"),
  actorPrefix: (side, isTurnSide) =>
    isTurnSide ? "" : `${side === "corp" ? "Korp" : "Runner"} `,
  mulligan: (side) =>
    `Der ${side === "corp" ? "Korp" : "Runner"} nimmt einen Mulligan.`,
  keepsOpeningHand: (side) =>
    `Der ${side === "corp" ? "Korp" : "Runner"} behält die Starthand.`,
  turnHeading: (side, turn) =>
    `${side === "corp" ? "Korp" : "Runner"} – Zug ${turn}`,
  actionLabel: (start, end) =>
    end !== undefined && end > start
      ? `Aktion ${start} und ${end}`
      : `Aktion ${start}`,
  credits: (runner, corp) => `**Credits:** Runner ${runner} · Korp ${corp}`,
  finalScore: (runner, corp) =>
    `Runner ${runner} Agendapunkte · Korp ${corp} Agendapunkte`,
  winner: (side, displayName) =>
    side === "draw"
      ? "Unentschieden"
      : `${displayName ?? ""} als ${side === "corp" ? "Korp" : "Runner"}`.trim(),
  resultReason: (reason) => {
    if (reason === "agenda_points") return "Agenda-Ziel";
    if (reason === "bad_publicity_7") return "7 Bad Publicity";
    if (reason === "corp_deck_empty") return "Korp-Deck leer";
    if (reason === "flatline") return "Flatline";
    if (reason === "forfeit") return "Aufgabe";
    if (reason === "time_expired") return "abgelaufene Spielerzeit";
    return "Unentschieden";
  },
  runAction: (server) => `Run auf ${server}`,
  installAction: (title) => `${title} installieren`,
  playAction: (title) => `${title} spielen`,
  rezAction: (title) => `${title} rezz(en)`,
  unknownAction: (eventType) => `Spielereignis ${eventType}`,
  draws: (actor, cards) =>
    cards.length > 0
      ? `${actor}zieht ${cards.join(", ")}.`
      : `${actor}zieht eine Karte.`,
  installs: (actor, title, server, position) =>
    `${actor}installiert ${title}${server ? ` in ${server}` : ""}${position ? `, ${position}` : ""}.`,
  plays: (actor, title, effects) =>
    `${actor}spielt ${title}.${effects ? ` ${effects}` : ""}`,
  startsRun: (actor, server) => `${actor}startet einen Run auf ${server}.`,
  accesses: (actor, title) => `${actor}greift auf ${title} zu.`,
  endsTurn: (actor) => `${actor}beendet den Zug.`,
  advances: (actor, count, title) =>
    `${actor}platziert ${count} Fortschrittsmarker auf ${title}.`,
  scores: (actor, title) => `${actor}erzielt ${title}.`,
  unknownEvent: (actor, eventType) =>
    `${actor}führt das Spielereignis ${eventType} aus.`,
  icePosition: (index) => `Position ${index} vor dem Server`,
  gainsCredits: (side, credits) =>
    `Effekt: ${side === "corp" ? "Korp" : "Runner"} erhält ${credits} Credits.`,
};

const EN_GAMEBOOK_MESSAGES: GamebookMessages = {
  title: "Gamebook",
  participantsHeading: "Participants",
  setupHeading: "Game setup",
  finalResultHeading: "Final result",
  openingHand: "opening hand",
  firstOpeningHand: "first opening hand",
  newOpeningHand: "new opening hand",
  handAtTurnStart: "Hand at start of turn",
  winnerField: "Winner",
  finalScoreField: "Final score",
  endedByField: "Ended by",
  unknownCard: "a card",
  unknownAgenda: "an agenda",
  unknownServer: "a server",
  newRemote: "a new remote",
  remoteArea: "in the remote root",
  side: (side) => (side === "corp" ? "Corp" : "Runner"),
  actorPrefix: (side, isTurnSide) =>
    isTurnSide ? "" : `${side === "corp" ? "Corp" : "Runner"} `,
  mulligan: (side) =>
    `${side === "corp" ? "Corp" : "Runner"} takes a mulligan.`,
  keepsOpeningHand: (side) =>
    `${side === "corp" ? "Corp" : "Runner"} keeps the opening hand.`,
  turnHeading: (side, turn) =>
    `${side === "corp" ? "Corp" : "Runner"} – Turn ${turn}`,
  actionLabel: (start, end) =>
    end !== undefined && end > start
      ? `Actions ${start} and ${end}`
      : `Action ${start}`,
  credits: (runner, corp) => `**Credits:** Runner ${runner} · Corp ${corp}`,
  finalScore: (runner, corp) =>
    `Runner ${runner} agenda points · Corp ${corp} agenda points`,
  winner: (side, displayName) =>
    side === "draw"
      ? "Draw"
      : `${displayName ?? ""} as ${side === "corp" ? "Corp" : "Runner"}`.trim(),
  resultReason: (reason) => {
    if (reason === "agenda_points") return "agenda-point target";
    if (reason === "bad_publicity_7") return "7 bad publicity";
    if (reason === "corp_deck_empty") return "empty Corp deck";
    if (reason === "flatline") return "flatline";
    if (reason === "forfeit") return "forfeit";
    if (reason === "time_expired") return "player time expired";
    return "draw";
  },
  runAction: (server) => `Run on ${server}`,
  installAction: (title) => `Install ${title}`,
  playAction: (title) => `Play ${title}`,
  rezAction: (title) => `Rez ${title}`,
  unknownAction: (eventType) => `Game event ${eventType}`,
  draws: (actor, cards) =>
    cards.length > 0
      ? `${actor}draws ${cards.join(", ")}.`
      : `${actor}draws a card.`,
  installs: (actor, title, server, position) =>
    `${actor}installs ${title}${server ? ` in ${server}` : ""}${position ? `, ${position}` : ""}.`,
  plays: (actor, title, effects) =>
    `${actor}plays ${title}.${effects ? ` ${effects}` : ""}`,
  startsRun: (actor, server) => `${actor}starts a run on ${server}.`,
  accesses: (actor, title) => `${actor}accesses ${title}.`,
  endsTurn: (actor) => `${actor}ends the turn.`,
  advances: (actor, count, title) =>
    `${actor}places ${count} advancement counter${count === 1 ? "" : "s"} on ${title}.`,
  scores: (actor, title) => `${actor}scores ${title}.`,
  unknownEvent: (actor, eventType) =>
    `${actor}resolves game event ${eventType}.`,
  icePosition: (index) => `position ${index} protecting the server`,
  gainsCredits: (side, credits) =>
    `Effect: ${side === "corp" ? "Corp" : "Runner"} gains ${credits} credit${credits === 1 ? "" : "s"}.`,
};

const FR_GAMEBOOK_MESSAGES: GamebookMessages = {
  title: "Livre de jeu",
  participantsHeading: "Participants",
  setupHeading: "Préparation de la partie",
  finalResultHeading: "Résultat final",
  openingHand: "main de départ",
  firstOpeningHand: "première main de départ",
  newOpeningHand: "nouvelle main de départ",
  handAtTurnStart: "Main au début du tour",
  winnerField: "Vainqueur",
  finalScoreField: "Score final",
  endedByField: "Fin de partie",
  unknownCard: "une carte",
  unknownAgenda: "un projet",
  unknownServer: "un serveur",
  newRemote: "un nouveau serveur distant",
  remoteArea: "dans la racine du serveur distant",
  side: (side) => (side === "corp" ? "Corp" : "Runner"),
  actorPrefix: (side, isTurnSide) =>
    isTurnSide ? "" : `${side === "corp" ? "La Corp" : "Le Runner"} `,
  mulligan: (side) =>
    `${side === "corp" ? "La Corp" : "Le Runner"} prend un mulligan.`,
  keepsOpeningHand: (side) =>
    `${side === "corp" ? "La Corp" : "Le Runner"} conserve sa main de départ.`,
  turnHeading: (side, turn) =>
    `${side === "corp" ? "Corp" : "Runner"} – Tour ${turn}`,
  actionLabel: (start, end) =>
    end !== undefined && end > start
      ? `Actions ${start} et ${end}`
      : `Action ${start}`,
  credits: (runner, corp) => `**Crédits :** Runner ${runner} · Corp ${corp}`,
  finalScore: (runner, corp) =>
    `Runner ${runner} points de projet · Corp ${corp} points de projet`,
  winner: (side, displayName) =>
    side === "draw"
      ? "Égalité"
      : `${displayName ?? ""} en tant que ${side === "corp" ? "Corp" : "Runner"}`.trim(),
  resultReason: (reason) => {
    if (reason === "agenda_points") return "objectif de points de projet";
    if (reason === "bad_publicity_7") return "7 points de mauvaise publicité";
    if (reason === "corp_deck_empty") return "paquet de la Corp vide";
    if (reason === "flatline") return "flatline";
    if (reason === "forfeit") return "abandon";
    if (reason === "time_expired") return "temps de jeu écoulé";
    return "égalité";
  },
  runAction: (server) => `Piratage de ${server}`,
  installAction: (title) => `Installer ${title}`,
  playAction: (title) => `Jouer ${title}`,
  rezAction: (title) => `Activer ${title}`,
  unknownAction: (eventType) => `Événement de jeu ${eventType}`,
  draws: (actor, cards) =>
    cards.length > 0
      ? `${actor}pioche ${cards.join(", ")}.`
      : `${actor}pioche une carte.`,
  installs: (actor, title, server, position) =>
    `${actor}installe ${title}${server ? ` dans ${server}` : ""}${position ? `, ${position}` : ""}.`,
  plays: (actor, title, effects) =>
    `${actor}joue ${title}.${effects ? ` ${effects}` : ""}`,
  startsRun: (actor, server) => `${actor}lance un piratage de ${server}.`,
  accesses: (actor, title) => `${actor}accède à ${title}.`,
  endsTurn: (actor) => `${actor}termine le tour.`,
  advances: (actor, count, title) =>
    `${actor}place ${count} pion${count === 1 ? "" : "s"} d'avancement sur ${title}.`,
  scores: (actor, title) => `${actor}valide ${title}.`,
  unknownEvent: (actor, eventType) =>
    `${actor}résout l'événement de jeu ${eventType}.`,
  icePosition: (index) => `position ${index} devant le serveur`,
  gainsCredits: (side, credits) =>
    `Effet : ${side === "corp" ? "La Corp" : "Le Runner"} gagne ${credits} crédit${credits === 1 ? "" : "s"}.`,
};

export function gamebookMessages(locale: GamebookLocale): GamebookMessages {
  if (locale === "de") return DE_GAMEBOOK_MESSAGES;
  if (locale === "fr") return FR_GAMEBOOK_MESSAGES;
  return EN_GAMEBOOK_MESSAGES;
}

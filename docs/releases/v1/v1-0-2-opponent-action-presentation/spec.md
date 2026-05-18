# Opponent Action Presentation Spec

Status: frozen_for_implementation
Stand: 2026-05-04
Phase: V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz

## Zweck

Diese Spezifikation beschreibt die Präsentationsschicht für gegnerische Aktionen. Sie macht bestehende side-sichere Events live wahrnehmbar, ohne Regeln, Engine-State, Replay oder StateHash zu verändern.

## Grundsätze

- Die Engine bleibt alleinige Regelautorität.
- UI, Audio und Highlights sind lokale Präsentation.
- Cues werden aus side-sicheren Events und PlayerViews abgeleitet.
- Verdeckte gegnerische Karten bleiben anonym.
- Reconnect und Reload spielen alte Ereignisse nicht akustisch nach.
- Human-vs-Human wird durch lokale Cue-Wiedergabe nicht blockiert.
- Human-vs-KI wird im Standard sichtbar getaktet statt unsichtbar vorgespult.

## Datenmodell

```ts
type OpponentActionCue = {
  cueId: string;
  eventId: string;
  viewerSide: "runner" | "corp";
  actor?: "runner" | "corp";
  actorLabel: string;
  opponent: boolean;
  source: "human" | "ai" | "system";
  actionType: string;
  title: string;
  description?: string;
  visibility: "public" | "side" | "redacted" | "system";
  importance: "normal" | "important" | "critical";
  highlight?: BoardHighlight;
  sound?: ActionSoundKind;
  requiresLocalAttention: boolean;
  aiExplanation?: string;
};

type BoardHighlight =
  | { kind: "server"; serverId?: string; serverLabel?: string; lane?: "ice" | "root" | "central" }
  | { kind: "card"; cardInstanceId?: string; cardDefinitionId?: string; title?: string }
  | { kind: "zone"; side: "runner" | "corp"; zone: "hq" | "rd" | "archives" | "grip" | "stack" | "heap" | "rig" | "scoreArea" }
  | { kind: "run"; serverId?: string; serverLabel?: string; phase?: string }
  | { kind: "economy"; side: "runner" | "corp" }
  | { kind: "decision"; side: "runner" | "corp" };

type ActionSoundKind =
  | "turn"
  | "draw"
  | "credit"
  | "install_hidden"
  | "install_known"
  | "play"
  | "rez"
  | "run"
  | "access"
  | "agenda"
  | "trash"
  | "tag_or_damage"
  | "choice"
  | "game_end";
```

`OpponentActionCue` ist kein Shared- oder Engine-Vertrag. Es soll im Web-Code liegen, z. B. in `apps/web/app/action-cues.ts`.

## Eingaben

Die Cue-Ableitung darf verwenden:

- `PublicGameEvent[]`
- `formatChronicleEvent(event, viewerSide, context)`
- aktuelle `PlayerView`
- lokale UI-Einstellungen, z. B. Audio an/aus, Geschwindigkeit, `lastPresentedEventId`
- side-sicher nachgeladene CardView-Details für bereits sichtbare Karten

Die Cue-Ableitung darf nicht verwenden:

- `GameState`
- `GameEvent.privatePayload`
- `cardInstances`
- vollständige Decklisten
- Session-Tokens oder Invite-Tokens
- lokale Dateipfade zu verdeckten Bildern
- private Debugdaten gegnerischer Seite

## Ableitungsfunktion

Empfohlene Signatur:

```ts
type CueDerivationInput = {
  viewerSide: "runner" | "corp";
  playerView: PlayerView;
  events: PublicGameEvent[];
  lastPresentedEventId?: string;
  includeOwnActions?: boolean;
};

function deriveOpponentActionCues(input: CueDerivationInput): OpponentActionCue[];
```

Regeln:

- Events werden nach `stateVersionAfter`, danach stabil nach Event-Reihenfolge sortiert.
- Ohne `includeOwnActions` erzeugen nur gegnerische Actors und relevante System-/Decision-Events Cues.
- `cueId` ist stabil: `${viewerSide}:${eventId}` plus Discriminator, falls ein Event mehrere Cues erzeugt.
- `title`, `description`, `visibility` und `importance` kommen primär aus `ChronicleItem`.
- `source` ist `ai`, wenn `aiExplanation` oder `aiReasonCode` vorhanden ist; sonst `human` bei Actor und `system` ohne Actor.
- `aiExplanation` darf angezeigt werden; `aiReasonCode` bleibt Debug-/Testdatum.
- Fallback für unbekannte Events: neutraler System-Cue ohne technische IDs.

## Sichtbarkeit

### Redacted

Ein Cue ist `redacted`, wenn das zugrunde liegende Chronicle-Item redacted ist oder das Event `redactedKind` enthält. Dann gilt:

- kein `cardTitle`
- kein `cardDefinitionId`
- kein privater `cardInstanceId`
- keine Bild-URL
- keine Card-Detailzeilen
- keine unterscheidbaren verdeckten Bildzustände
- Highlight nur abstrakt, z. B. Remote-Root, ICE-Lane oder Zone

### Sichtbare Karten

`BoardHighlight.kind = "card"` ist nur erlaubt, wenn die Karte in der aktuellen `PlayerView` für den Viewer sichtbar oder durch das Event bewusst public geworden ist. Bei sichtbaren Karten darf die UI `cardInstanceId`, `cardDefinitionId` und `title` nutzen, soweit sie bereits in PlayerView oder PublicEvent vorhanden sind.

### Server und Zonen

Server-/Zonen-Highlights sind erlaubt, wenn sie keine verdeckte Kartenidentität offenlegen:

- `serverId`: R&D, HQ, Archives oder existierender Remote.
- `serverLabel`: side-sicherer Anzeigename.
- `zoneLabel`: abstrakter Bereich wie ICE, Root, Rig, ScoreArea.
- `runPhase`: bestehende Run-Phase aus PublicPayload oder PlayerView.

## Mapping

| actionType | Cue-Kategorie | Highlight | Sound | Sichtbarkeit |
|---|---|---|---|---|
| `mandatory_draw` | Turn/Draw | Corp HQ/R&D-Zählbereich | `draw` | keine Titel |
| `draw_card` | Draw | Actor-Hand-/Deck-Zählbereich | `draw` | keine Titel |
| `gain_credit` | Economy | Credit-Anzeige Actor | `credit` | public |
| `install_card` Corp verdeckt | Hidden Install | Server/Remote/ICE-Lane abstrakt | `install_hidden` | redacted |
| `install_card` Runner oder sichtbar | Install | sichtbare Karte oder Rig/Zone | `install_known` | sichtbar nach PlayerView |
| `play_event` | Play | Runner/Heap oder sichtbare Karte | `play` | sichtbarer Titel erlaubt |
| `play_operation` | Play | Corp/Archives oder sichtbare Karte | `play` | sichtbarer Titel erlaubt |
| `advance_card` | Hidden Board | Server abstrakt | `install_hidden` | redacted |
| `score_agenda` | Agenda | Corp ScoreArea | `agenda` | public |
| `steal_agenda` | Agenda | Runner ScoreArea | `agenda` | public |
| `start_run` | Run | Zielserver/RunTimeline | `run` | public |
| `rez_ice` | Rez/Run | gerezzte sichtbare Karte oder RunTimeline | `rez` | public |
| `decline_rez` | Run | RunTimeline | `run` | public |
| `pump_breaker` | Run | sichtbarer Breaker/RunTimeline | `run` | visible |
| `break_subroutine` | Run | RunTimeline/ICE | `run` | public |
| `continue_run` | Run | RunTimeline | `run` | public |
| `access_card` | Access | Server/Access-Panel | `access` | nur bewusst sichtbare Titel |
| `trash_accessed_card` | Trash | Heap/Archives oder sichtbare Karte | `trash` | public wenn Titel sichtbar |
| `trash_resource` | Danger/Trash | Runner Rig Resource | `trash` | public |
| `remove_tag` | Danger | Runner Tag-Anzeige | `tag_or_damage` | public |
| `end_turn` | Turn | Actor-Bereich | `turn` | public |
| `game_created` | System | kein Board-Fokus | kein Sound oder `turn` | system |
| unbekannt | System | optional abstrakt | kein Sound | keine technischen IDs |

## Lokale Cue-Queue

Die Queue lebt nur im Browser.

Zustände:

- `idle`
- `playing`
- `paused_for_local_attention`
- `skipped`

Regeln:

- Nur Events nach dem lokal bekannten `lastPresentedEventId` erzeugen neue Wiedergabe.
- Reconnect- oder Bootstrap-Events befüllen Chronicle, aber nicht automatisch die Audio-/Overlay-Wiedergabe.
- Cues werden nacheinander abgespielt.
- Der Spieler kann überspringen oder auf schnellen Modus stellen.
- Skip wirkt nur lokal.
- Bei `pendingChoice` für den Viewer oder verfügbaren `legalActions` für die aktive Viewer-Seite pausiert die Queue und erzeugt einen Decision-Highlight-Cue.

## KI-Pacing

```ts
type AiPacingMode = "fast" | "paced" | "manual";
```

Server-Regeln:

- `runAiStep(record)` führt höchstens eine KI-Aktion aus.
- `runAiUntilNextHuman(record)` bleibt für `fast`, KI-vs-KI und Tests erhalten.
- `maybeRunAiAfterTransition(record, mode)` wählt zwischen keinem Schritt, einem Schritt oder Fast-Loop.
- Human-vs-KI startet standardmäßig mit `paced`.
- KI-vs-KI und technische Simulationen bleiben standardmäßig `fast`.
- `manual` führt nur nach lokaler Bestätigung einen Schritt aus.

Advance-AI-Kommando:

```ts
type AdvanceAiRequest = {
  matchId: string;
  side: "runner" | "corp";
  sessionToken: string;
  knownStateVersion?: number;
  knownMatchVersion?: number;
  mode?: "single_step" | "until_human";
};
```

Akzeptanzregeln:

- Match muss aktiv sein.
- Aktive Side muss eine KI sein.
- Anfragende Session muss ein Mensch in diesem Match sein.
- `single_step` führt höchstens eine KI-Aktion aus.
- `until_human` ist nur bei `fast` oder expliziter Debug/Test-Nutzung erlaubt.
- Stale Version erzeugt side-sicheren Resync, keine heimliche Transition.
- KI nutzt nur `PlayerView`, `PublicGameEvent`-Tail, `LegalActions` und freigegebene AI-Metadaten.
- Jede Action läuft durch `applyAction`.

Side-Payload:

```ts
type AiTurnPresentationState = {
  activeAiSide?: "runner" | "corp";
  canAdvanceAi: boolean;
  pacingMode: AiPacingMode;
};
```

## UI-Bausteine

Empfohlene Bausteine:

- `deriveOpponentActionCues` in `apps/web/app/action-cues.ts`
- `ActionCueQueue`
- `OpponentActionOverlay`
- `BoardHighlightLayer`
- `AiPacingControls`
- `ActionSoundController`

Darstellungsregeln:

- Overlay ist kompakt und verschwindet automatisch.
- Board-Highlight dauert kurz und ist ruhig.
- Chronicle bleibt Detailhistorie.
- Decision-Highlight markiert LegalActions/ChoicePanel.
- UI-Texte sind Deutsch mit Du-Perspektive.
- In-app Erklärtexte dürfen keine technischen IDs, Reason-Codes oder StateHashes als Haupttext anzeigen.

## Audio

Audio folgt dem S01-Grundsatz:

- Opt-in.
- Lokal synthetisiert.
- Lautstärke lokal regelbar.
- Kein Server-State.
- Kein Engine-State.
- Kein Replay- oder StateHash-Einfluss.
- Keine externen Audiodateien.
- Keine alten Reconnect-Events automatisch abspielen.

Sound-Mapping nutzt `ActionSoundKind`. Wenn kein sicheres Mapping möglich ist, bleibt der Cue stumm.

## Browser-Smokes

Mindestens zu prüfen:

- Human-vs-KI: Corp-Pflichtdraw und weitere KI-Schritte erscheinen einzeln als Cues; Runner-Turn stoppt korrekt.
- Human-vs-Human: Aktion der zweiten Session erzeugt in der ersten Session einen Gegner-Cue, ohne die zweite Session zu blockieren.
- Reconnect: altes Eventlog ist sichtbar, aber es entsteht kein Tonsturm.
- Hidden-Info: verdeckte Corp-Installation bleibt in Cue, Overlay, Highlight, Audio und DOM-Daten anonym.

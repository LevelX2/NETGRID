# V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz

Status: detailed_plan
Stand: 2026-05-04

## Zweck

V1.0.2 soll gegnerische Spielaktionen nicht nur nachträglich im Chronicle-Protokoll zeigen, sondern live wahrnehmbar machen. Das gilt für Human-vs-KI und Human-vs-Human gleichermaßen:

- Wenn die Corp-KI den ersten Zug beginnt, soll der Runner die einzelnen Corp-Schritte nacheinander sehen.
- Wenn ein menschlicher Gegner handelt, soll die lokale Seite ebenfalls klar erkennen, was gerade passiert ist.
- Die Darstellung soll visuell und akustisch unterstützen, ohne neue Regelautorität zu erzeugen.

Die Phase ist bewusst eine Präsentations- und Orchestrierungsphase. Sie erweitert keine Karten, keine offiziellen Mechaniken und keine Engine-Regeln.

## Ausgangslage

Der Server kann KI-Aktionen automatisch ausführen, wenn die aktive Seite als KI modelliert ist. Aktuell läuft `runAiUntilNextHuman` mehrere KI-Aktionen hintereinander, bis wieder eine menschliche Seite aktiv ist oder ein Limit erreicht wird. Dadurch entsteht besonders bei Runner-vs-Corp-KI folgendes Produktproblem:

- Die Corp startet regeltypisch.
- Die KI erledigt ihren Startzug teilweise oder vollständig sofort.
- Der Runner landet danach in seiner Phase und muss im Chronicle-Protokoll rekonstruieren, was passiert ist.

Für Human-vs-Human besteht dieselbe Wahrnehmungslücke in abgeschwächter Form: Einzelaktionen des Gegners erscheinen zwar im Log, aber nicht als live geführte Board-Aktion mit Fokus, Ton und kurzer Bedeutung.

Bereits vorhanden und wiederverwendbar:

- side-sichere `PublicGameEvent`-Payloads,
- `ChronicleItem`-Formatierung in `apps/web/app/chronicle.ts`,
- KI-Reason-Codes und side-sichere deutsche KI-Erklärungen,
- Web-Audio-Grundsatz aus S01: opt-in, lokal synthetisiert, nicht Teil von Engine, Replay oder StateHash,
- WebSocket-Updates mit `state_update`, `legal_actions`, `event_log_update` und `match_finished`.

## Produktentscheidung

V1.0.2 heißt fachlich nicht "KI-Schrittanzeige", sondern "Gegner-Aktionsdarstellung".

Die KI ist der wichtigste erste Fall, weil ihre Aktionen bisher automatisch gebündelt werden. Die Darstellungsschicht soll aber allgemein auf gegnerischen Events beruhen:

- Human-vs-KI: KI-Aktionen werden schrittweise oder getaktet ausgeführt und als Cue angezeigt.
- Human-vs-Human: Aktionen des anderen Menschen erzeugen dieselben Cues, ohne den Gegenspieler durch lokale Bestätigung zu blockieren.
- KI-vs-KI: bleibt standardmäßig schnelle Simulation; optional kann dieselbe Cue-Schicht später als Beobachtermodus genutzt werden.

## Zielbild

Der lokale Spieler sieht gegnerische Aktionen als kurze Aktionssequenz:

1. Board-Fokus springt auf das relevante Ziel, z. B. R&D, HQ, Remote, Rig oder installierte Karte.
2. Der Zielbereich blinkt oder pulsiert kurz.
3. Ein kompakter Aktionshinweis erscheint, z. B. "Die Corp-KI hat eine verdeckte Karte in Remote 1 installiert."
4. Wenn die Aktion eine bekannte Karte betrifft, kann die CardView kurz hervorgehoben oder im Preview-Panel fokussiert werden.
5. Ein optionaler Sound markiert die Aktionsart, z. B. Draw, Install, Play, Rez, Score, Trash, Run oder Choice.
6. Bei KI-Aktionen erscheint zusätzlich eine kurze side-sichere Begründung, sofern vorhanden.
7. Wenn danach eine Entscheidung des lokalen Spielers möglich oder erforderlich ist, wird die Aktionsdarstellung angehalten und der Choice-/LegalActions-Bereich sichtbar hervorgehoben.

## Nicht-Ziele

Nicht Teil von V1.0.2:

- neue Karten oder neue Kartenmechaniken,
- Prevention, Avoid, Interrupt, Replacement oder Priority-Pass als neue Engine-Mechaniken,
- LLM-gestützte Regelentscheidungen,
- Audio-Dateien, offizielle Sounds oder externe Assets,
- Änderung von Replay-, StateHash- oder Engine-Determinismus,
- öffentliche Spectator-, Ranking-, Matchmaking- oder Plattformfunktionen,
- vollständige Tutorial- oder Coaching-Schicht.

## Kernmodell

### OpponentActionCue

Die Web-UI erhält eine reine Präsentationsableitung aus side-sicheren Events.

Empfohlenes Modell:

```ts
type OpponentActionCue = {
  cueId: string;
  eventId: string;
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
  | { kind: "card"; cardInstanceId?: string; cardDefinitionId?: string }
  | { kind: "zone"; side: "runner" | "corp"; zone: "hq" | "rd" | "archives" | "grip" | "stack" | "heap" | "rig" | "scoreArea" }
  | { kind: "run"; serverId?: string; phase?: string };

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

Diese Struktur ist kein Engine-Objekt. Sie wird aus `PublicGameEvent`, `ChronicleItem`, aktueller `PlayerView` und lokalen UI-Einstellungen abgeleitet.

### Cue Queue

Die UI führt eine lokale Queue für neue gegnerische Events:

- Nur Events nach dem letzten bereits präsentierten Event erzeugen Cues.
- Eigene Aktionen erzeugen standardmäßig keinen großen Gegner-Cue, können aber kleine lokale Feedbacks bekommen.
- Reconnect oder Reload darf nicht alle alten Events akustisch abspielen.
- Mehrere schnelle Gegneraktionen werden geordnet nacheinander abgespielt.
- Der Spieler kann die Queue überspringen oder in eine schnellere Darstellung wechseln.

### KI-Pacing

Für Human-vs-KI braucht der Server zusätzlich eine Orchestrierungsschicht:

```ts
type AiPacingMode = "fast" | "paced" | "manual";
```

- `fast`: bisheriges Verhalten, KI läuft bis zum nächsten Menschen oder Limit. Geeignet für KI-vs-KI und Tests.
- `paced`: KI führt eine Aktion aus, die UI zeigt sie, danach wird nach kurzer Verzögerung automatisch die nächste KI-Aktion angefordert.
- `manual`: KI führt genau eine Aktion pro Bestätigung aus. Geeignet für Lernmodus, Debugging und Nachvollziehbarkeit.

Default-Empfehlung:

- Human-vs-KI: `paced`.
- Human-vs-Human: keine KI-Pacing-Logik, aber Gegner-Cues aktiv.
- KI-vs-KI: `fast`.

## Server-Anpassungen

### KI-Loop aufteilen

`runAiUntilNextHuman(record)` sollte nicht mehr der einzige Pfad sein. Empfohlen:

- `runAiStep(record)` führt maximal eine KI-Aktion aus.
- `runAiUntilNextHuman(record)` bleibt für `fast`, Simulation und Tests erhalten.
- `maybeRunAiAfterTransition(record, mode)` entscheidet anhand von Matchmodus und `AiPacingMode`, ob kein Schritt, ein Schritt oder der bisherige Fast-Loop läuft.

Für Human-vs-KI im `paced`- oder `manual`-Modus soll ein Match nicht unsichtbar bis zum menschlichen Zug vorgespult werden. Nach Matchstart kann die UI erkennen: "Gegner-KI ist am Zug" und den ersten Schritt anfordern.

### Advance-AI-Kommando

Die Multiplayer-Schicht braucht ein side-authentifiziertes Kommando, z. B. WebSocket `advance_ai` oder REST `POST /api/matches/:id/ai/advance`.

Eingabe:

- `matchId`,
- lokale `side`,
- `sessionToken`,
- bekannte `stateVersion` oder `matchVersion`,
- optional `mode: "single_step" | "until_human"`.

Regeln:

- Nur erlaubt, wenn das Match aktiv ist.
- Nur erlaubt, wenn die aktive Seite eine KI ist.
- Die anfragende Session muss ein Mensch in diesem Match sein.
- `single_step` führt höchstens eine KI-Aktion aus.
- Jede KI-Aktion läuft weiter durch `applyAction`.
- KI-Entscheidung, Reason-Code und Explanation werden wie bisher side-sicher in das PublicEvent übernommen.
- Bei stale Version wird nicht heimlich weitergespielt, sondern ein side-sicherer Resync geliefert.

### Payload-Erweiterung

SidePayloads sollten side-sicher anzeigen können:

```ts
type AiTurnPresentationState = {
  activeAiSide?: "runner" | "corp";
  canAdvanceAi: boolean;
  pacingMode: AiPacingMode;
};
```

Diese Daten enthalten keine verdeckten Karteninformationen und beeinflussen keinen StateHash.

## Web-UI-Anpassungen

### Neue Bausteine

Empfohlene Komponenten:

- `OpponentActionOverlay`: kompakter Live-Hinweis über dem Board oder nahe dem betroffenen Bereich.
- `ActionCueQueue`: verwaltet neue Cues, Wiedergabestatus, Weiter/Überspringen und automatische Verzögerungen.
- `BoardHighlightLayer`: markiert Server, Zonen, Run-Phase oder bekannte Karten.
- `ActionSoundController`: spielt opt-in synthetische Sounds pro Cue.
- `AiPacingControls`: Umschaltung zwischen langsam, Einzelschritt und schnell für Human-vs-KI.

### Darstellung

Beispiele:

- Pflichtdraw: "Die Corp-KI hat ihre Pflichtkarte gezogen." Highlight: HQ/R&D-Zählbereich. Sound: `draw`.
- Verdeckte Installation: "Die Corp hat eine verdeckte Karte in Remote 1 installiert." Highlight: Remote Root oder ICE-Lane. Sound: `install_hidden`.
- ICE rezzen: "Die Corp hat Gate ICE gerezzt. Der Encounter beginnt." Highlight: ICE-Karte und RunTimeline. Sound: `rez`.
- Operation spielen: "Die Corp-KI hat eine Operation gespielt und Credits erhalten." Highlight: HQ/Archives oder Credit-Anzeige. Sound: `play` plus Economy-Akzent.
- Agenda score: "Die Corp hat eine Agenda gescored und 2 Agenda-Punkte erhalten." Highlight: Score-Area. Sound: `agenda`.
- Runner-Intervention: "Du bist gefragt." Highlight: LegalActions/ChoicePanel. Sound: `choice`.

### Board-Fokus

Die Cue-Ableitung sollte vorhandene `publicPayload`-Felder nutzen:

- `actionType`,
- `actor`,
- `serverId` oder `serverLabel`,
- `zoneLabel`,
- `runPhase`,
- `title`, falls side-sicher sichtbar,
- `redactedKind`,
- `aiExplanation`.

Falls Events relevante Fokusdaten heute nicht side-sicher enthalten, darf V1.0.2 kleine PublicPayload-Ergänzungen einführen, z. B. `serverId`, `zoneLabel` oder abstrakte `highlightKind`. Verdeckte Kartentitel oder private Instance-IDs bleiben verboten.

## Audio-Konzept

Audio bleibt wie S01:

- Opt-in.
- Lokale Lautstärke.
- Web-Audio-Synthese, keine externen Audiodateien.
- Keine Engine-, Server-State-, Replay- oder StateHash-Wirkung.
- Kein automatisches Nachspielen alter Events nach Reconnect.

Sound-Familien:

| Sound | Einsatz |
| --- | --- |
| `draw` | Karte ziehen, Pflichtdraw |
| `credit` | Credit nehmen oder Economy-Effekt |
| `install_hidden` | verdeckte Corp-Installation |
| `install_known` | bekannte offene Installation |
| `play` | Event oder Operation spielen |
| `rez` | Rez einer Corp-Karte |
| `run` | Run-Start oder Run-Fortschritt |
| `access` | Access/Breach-Schritt |
| `agenda` | Score oder Steal |
| `trash` | Trash-Ereignis |
| `tag_or_damage` | Tag, Damage, gefährliche Events |
| `choice` | lokale Entscheidung oder Interventionsfenster |
| `game_end` | bestehende S01-Endtöne |

## Interventions- und Choice-Verhalten

V1.0.2 erfindet keine neuen Interventionsfenster. Es nutzt nur das, was die Engine bereits anbietet:

- `pendingChoice` für die lokale Seite,
- `legalActions` für die lokale Seite,
- aktive menschliche Seite nach einer gegnerischen Aktion,
- bestehende Run-/Access-/Trace-/Jack-out-Fenster.

Wenn nach einem gegnerischen Cue lokale `LegalActions` oder eine `pendingChoice` vorliegen, stoppt die Cue-Queue und markiert:

- "Du bist dran",
- "Entscheidung erforderlich",
- "Du kannst reagieren",
- oder "Weiter mit Deiner Aktion".

Für zukünftige Prevention/Avoid/Interrupt/Replacement-Gates sollte später ein echtes Priority-/Pass-Modell in der Engine entstehen. V1.0.2 bereitet die UI dafür vor, setzt es aber nicht um.

## Human-vs-Human-Verhalten

Bei Human-vs-Human darf lokale Bestätigung den entfernten Gegenspieler nicht blockieren. Deshalb gilt:

- Gegneraktionen erzeugen lokale Cues.
- Wenn der Gegner mehrere Aktionen schnell ausführt, werden Cues geordnet in der lokalen Queue gezeigt.
- Die Queue kann übersprungen werden, ohne das Match zu beeinflussen.
- Echte Entscheidungen blockieren weiterhin nur dort, wo die Engine eine menschliche LegalAction oder Choice verlangt.

## Human-vs-KI-Verhalten

Bei Human-vs-KI soll die KI nicht mehr unsichtbar bis zum menschlichen Zug durchlaufen.

Default-Ablauf `paced`:

1. Match startet.
2. Wenn die KI aktive Seite ist, zeigt die UI "Corp-KI ist am Zug".
3. UI fordert einen KI-Schritt an.
4. Server führt genau eine KI-LegalAction über `applyAction` aus.
5. UI erhält Event, StateUpdate und LegalActions.
6. Cue wird visuell und akustisch abgespielt.
7. Wenn weiter die KI aktiv ist, folgt nach kurzer Verzögerung der nächste Schritt.
8. Wenn der Mensch aktiv ist oder eine lokale Choice vorliegt, stoppt die KI-Orchestrierung.

Manual-Ablauf:

- Schritt 7 passiert nur nach Button "Weiter".

Fast-Ablauf:

- Für Debug/Test kann der bisherige Bulk-Lauf weiter angeboten werden, aber nicht als Standard für Human-vs-KI.

## Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V102-MUST-001 | Gegnerische PublicEvents erzeugen side-sichere Live-Cues außerhalb des Chronicle-Protokolls. |
| V102-MUST-002 | Human-vs-KI führt im beobachtbaren Modus nicht automatisch den gesamten KI-Zug bis zum Menschen aus. |
| V102-MUST-003 | Ein KI-Schritt wird ausschließlich aus aktuellen LegalActions gewählt und durch `applyAction` validiert. |
| V102-MUST-004 | KI-Cues zeigen Reason-Code nicht roh, aber dürfen die side-sichere deutsche `aiExplanation` anzeigen. |
| V102-MUST-005 | Verdeckte Corp-Installationen bleiben verdeckt und nennen keine Titel, IDs oder unterscheidbaren Bilddaten. |
| V102-MUST-006 | Audio ist opt-in, lokal synthetisiert und beeinflusst Engine, Replay, StateHash und Server-State nicht. |
| V102-MUST-007 | Reconnect/Reload spielt alte Events nicht automatisch neu als Tonfolge ab. |
| V102-MUST-008 | Wenn nach einer gegnerischen Aktion lokale LegalActions oder Choices verfügbar sind, stoppt die KI-/Cue-Automatik und hebt diese Entscheidung hervor. |
| V102-MUST-009 | Human-vs-Human nutzt dieselbe Cue-Ableitung für Gegneraktionen, ohne den Gegner durch lokale Bestätigung zu blockieren. |
| V102-MUST-010 | Visibility-, Replay-, StateHash-, stale-action- und illegal-action-Verträge bleiben grün. |

## Umsetzungsschritte

### Schritt 1: Requirements Freeze

Erstellen:

- `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/spec.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/test-matrix.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements-review.md`

Schärfen:

- exakte Cue-Felder,
- erlaubte PublicPayload-Ergänzungen,
- KI-Pacing-Modi,
- Audio-Mapping,
- Reconnect-Verhalten,
- Visibility-Grenzen.

### Schritt 2: Cue-Ableitung und Tests

Dateibereich:

- `apps/web/app/chronicle.ts`
- neue Web-Hilfsdatei, z. B. `apps/web/app/action-cues.ts`
- Tests in `apps/web/app/chronicle.test.ts` oder neuem `action-cues.test.ts`

Aufgabe:

- Aus PublicEvents stabile `OpponentActionCue`s ableiten.
- Existing Chronicle-Textlogik wiederverwenden.
- Highlight- und Sound-Klassifikation testen.
- Redaction-Fälle testen.

### Schritt 3: Server-KI-Pacing

Dateibereich:

- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- ggf. Shared-Typen für Payloadfelder

Aufgabe:

- `runAiStep` extrahieren.
- `AiPacingMode` in Match-/Payload-Schicht modellieren.
- Advance-AI-Kommando einführen.
- Human-vs-KI default auf `paced` stellen.
- AI-vs-AI/Simulation auf `fast` belassen.

### Schritt 4: UI-Overlay, Queue und Steuerung

Dateibereich:

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

Aufgabe:

- Cue-Queue einbauen.
- Overlay und Board-Highlight darstellen.
- KI-Pacing-Controls im Match-Toolbar- oder Action-Bereich anbieten.
- Bei `pendingChoice`/lokalen LegalActions die Queue pausieren.

### Schritt 5: Audio

Dateibereich:

- vorhandene Web-Audio-Logik aus S01 weiterverwenden oder in kleinen lokalen Helper auslagern.
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

Aufgabe:

- Sound-Mapping pro Cue.
- Opt-in und Lautstärke beibehalten.
- Keine Sounds für alte Reconnect-Events.

### Schritt 6: Browser-Smokes und Final Review

Erstellen:

- `docs/releases/v1/v1-0-2-opponent-action-presentation/implementation-review.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/final-review.md`

Smokes:

- Runner-vs-Corp-KI: Start, Corp-Pflichtdraw sichtbar, weitere Corp-Schritte sichtbar, Runner-Turn stoppt korrekt.
- Human-vs-Human: Gegneraktion aus zweiter Session erzeugt lokale Cue.
- Reconnect: altes Eventlog sichtbar, aber kein Tonsturm.
- Hidden-Info: verdeckte Installation bleibt verdeckt.

## Testmatrix

| ID | Art | Test |
| --- | --- | --- |
| V102-T001 | Unit/Web | Cue-Mapping für `mandatory_draw`, `draw_card`, `gain_credit`, `end_turn`. |
| V102-T002 | Unit/Web | Verdeckte Corp-Installation erzeugt redacted Cue ohne Titel, Card-ID oder Bild-URL. |
| V102-T003 | Unit/Web | Rez, Score, Steal und Trash erzeugen passende Highlight- und Sound-Klassen. |
| V102-T004 | Unit/Web | KI-Erklärung erscheint als deutscher Erklärungstext, Reason-Code bleibt Debug-/Testdaten und wird nicht als Haupttext angezeigt. |
| V102-T005 | Server | `runAiStep` führt höchstens eine KI-Aktion aus. |
| V102-T006 | Server | Human-vs-KI im `paced`/`manual`-Modus läuft nicht bei Matchstart vollständig bis zum Menschen durch. |
| V102-T007 | Server | Advance-AI wird bei nicht aktiver KI, falscher Session oder stale Version side-sicher abgelehnt. |
| V102-T008 | Server/Visibility | AI-Step-Payloads enthalten keine `cardInstances`, privaten Decklisten, Tokens oder verdeckten gegnerischen Titel. |
| V102-T009 | Multiplayer | Human-vs-Human-Gegneraktion erzeugt Eventlog-Update und lokale Cue-Ableitung. |
| V102-T010 | Web | Cue-Queue spielt neue Events geordnet, überspringt alte Reconnect-Events und pausiert bei lokaler Choice. |
| V102-T011 | Web/Audio | Audio ist opt-in; deaktiviert wird kein Sound erzeugt. |
| V102-T012 | Regression | `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` bleiben grün. |

## Risiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| Präsentation leakt verdeckte Informationen | Cue-Ableitung ausschließlich aus side-sicheren PublicEvents und PlayerView; Redaction-Tests. |
| KI-Pacing verändert deterministische Spielresultate | KI-Actions bleiben identische LegalActions über `applyAction`; Pacing ist Match-Orchestrierung, nicht Engine-State. |
| Human-vs-Human wird durch lokale Cues träge | Cues nur lokal; Gegner wird nicht blockiert; Queue kann übersprungen werden. |
| Reconnect erzeugt störende Tonfolgen | letzte präsentierte Event-ID lokal speichern; nur neue Events vertonen. |
| UI überfrachtet das Board | Overlay kompakt halten; Chronicle bleibt Detailhistorie; Highlight kurz und ruhig. |

## Done-Kriterien

V1.0.2 ist done, wenn:

- Human-vs-KI die gegnerischen KI-Aktionen schrittweise oder getaktet sichtbar macht.
- Human-vs-Human gegnerische Aktionen mit derselben Cue-Schicht darstellt.
- Board-Highlights und kurze Overlays die Aktion ohne Log-Suche verständlich machen.
- Opt-in-Audio pro Aktionsfamilie funktioniert.
- Lokale Choices und LegalActions klar als "Du bist gefragt" hervorgehoben werden.
- Hidden-Info-Verträge für verdeckte Installationen, HQ/R&D, Stack/Grip, Reconnect und Fehler grün bleiben.
- KI weiterhin nur aus LegalActions, PlayerView und side-sicheren Events entscheidet.
- Replay und StateHash unverändert deterministisch bleiben.
- Browser-Smokes für Human-vs-KI, Human-vs-Human und Reconnect bestanden sind.

## Freigabeempfehlung

V1.0.2 ist als nächster Zwischenrelease sinnvoll, bevor weitere Karten- oder Mechanikbreite begonnen wird. Der Release verbessert die Spielbarkeit und Verständlichkeit der bestehenden Engine, ohne den Kartenpool oder die Regeloberfläche zu erweitern.

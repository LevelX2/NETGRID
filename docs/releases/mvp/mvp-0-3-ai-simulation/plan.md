# MVP 0.3 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze  
Stand: 2026-05-03  
Empfohlener Phasenname: `MVP 0.3 AI and simulation requirements`

## 1. Kurzentscheidung

MVP 0.3 ist die KI- und Simulationsphase.

V0.3 erweitert die Anwendung nicht durch neue Karten, breiten Kartenpool oder komplexe neue Regeln. V0.3 macht beide Seiten steuerbar durch KI, verbessert die bestehende Corp-KI, ergänzt eine Runner-KI, führt KI-vs-KI-Simulationen ein und baut einen Erklär- und Testmodus, der spätere Karten- und Regel-Erweiterungen absichert.

Kernformel:

> Gleiche Engine, gleicher Demo-Kartenpool, neue Controller-Schicht: Human, KI und Simulation reichen nur LegalActions ein; KI-vs-KI liefert reproduzierbare Regressionen.

## 2. Ziel

Ein Nutzer soll lokal oder privat folgende Modi starten können:

- Human Runner gegen Corp-KI.
- Human Corp gegen Runner-KI.
- KI gegen KI als automatische Simulation.

Die KI darf keine Regeln auslegen und keine verdeckten Informationen lesen. Sie erhält nur:

- eigene `PlayerView`,
- eigene `LegalActions`,
- side-gefilterte Events,
- explizit erlaubte Metadaten wie Seed, Difficulty und optional Simulationskontext.

V0.3 ist erfolgreich, wenn beide KI-Seiten über viele Seeds ausschließlich legale Actions wählen, keine Hidden-Info-Grenzen verletzen, deterministisch replaybare Partien erzeugen und Entscheidungserklärungen liefern, die keine privaten Daten verraten.

## 3. Ausgangslage

Vorhanden aus MVP 0.1:

- deterministische Engine mit `createGame`, `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `checkWinConditions`, `replayEvents`, `hashState`,
- feste Demo-Decks und 13 `playable_mvp` Karten,
- einfache Corp-KI im Paket `@netgrid/ai`,
- AI-Input-Sicherheitsprüfung für Corp,
- 100-Step-Smoke-Test mit Corp-KI und Runner-Fallback,
- Replay/StateHash und Visibility-Basistests.

Vorhanden aus MVP 0.2:

- privater Match-Server,
- Human-vs-Human über WebSocket,
- serverseitige Action-Pipeline mit StateVersion, Idempotency und per-Match-Lock,
- side-gefilterte Payloads,
- Reconnect und Undo,
- Next.js-UI mit Host/Join und Actions für beide Seiten.

Wichtige Entwicklungslehren:

- FullState im Browser war ein hohes Risiko und wurde entfernt. V0.3 darf dieses Risiko nicht durch AI-Debug oder Simulationen zurückbringen.
- Browser-Client darf weiter keine Engine-, Server- oder GameState-Imports erhalten.
- Side-Filter und Payload-Hygiene sind Gates, nicht Komfort.
- JSON-Storage reicht für den privaten Stand, ist aber kein stabiles Langfristziel.
- Die aktuelle Corp-KI ist absichtlich nur eine Prioritätsliste; Difficulty wird typisiert, aber noch nicht substanziell genutzt.

## 4. Nicht-Ziele

V0.3 baut nicht:

- neue Pflichtkarten,
- breiten Kartenpool,
- offizielle Kartendatenbank-Integration,
- Deckbuilder,
- freie Deckvalidierung,
- LLM-KI,
- KI mit FullState oder verdeckter Information,
- öffentliche Plattformfunktionen,
- Matchmaking,
- Accounts,
- Chat,
- Zuschaueransicht,
- vollständige Smartphone-Optimierung,
- vollständige offiziellen Timing-/Priority-/Replacement-/Prevention-Systeme.

Ein LLM darf frühestens in einer späteren Version als strategischer Berater geprüft werden. Es darf auch dann nur eine `actionId` aus LegalActions zurückgeben und keine Regeln auslegen.

## 5. V0.3-Scope

### 5.1 Must

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V03-MUST-001 | Seitenunabhängiger AI-Input-Contract | AI-Input unterstützt Runner und Corp ohne FullState und ohne gegnerische verdeckte Daten. |
| V03-MUST-002 | Controller-Abstraktion | Human-, AI- und Replay-Controller reichen einheitlich `PlayerActions` aus aktuellen `LegalActions` ein. |
| V03-MUST-003 | Runner-KI | Runner-KI kann in Demo-Partien legale Economy-, Install-, Run-, Break-, Access-, Steal-, Trash- und End-Turn-Entscheidungen treffen. |
| V03-MUST-004 | Corp-KI v2 | Corp-KI nutzt bessere Prioritäten für Economy, ICE, Remote-Aufbau, Rez, Advance und Score. |
| V03-MUST-005 | KI-vs-KI-Harness | Simulationen laufen deterministisch über mehrere Seeds bis Winner oder definiertes Action-/Turn-Limit. |
| V03-MUST-006 | LegalAction-Zwang | Jede KI-Entscheidung wird gegen die aktuelle LegalAction-Liste geprüft; ungültige Entscheidung nutzt deterministischen Fallback. |
| V03-MUST-007 | AI-Visibility | Tests belegen, dass AI-Inputs, Erklärungen, Logs und Fehler keine verdeckten Daten enthalten. |
| V03-MUST-008 | Replay/StateHash | Mindestens eine KI-vs-KI-Partie ist aus EventLog replaybar und reproduziert finalen StateHash. |
| V03-MUST-009 | Erklärmodus | Jede AI-Entscheidung enthält Reason-Code und sichtbasierte Kurzbegründung ohne Hidden-Info-Leak. |
| V03-MUST-010 | UI-Modus für Human vs KI beidseitig | Nutzer kann mindestens Human Runner vs Corp-KI und Human Corp vs Runner-KI lokal/private starten. |

### 5.2 Should

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V03-SHOULD-001 | Difficulty `easy` und `normal` unterscheidbar | Easy macht einfache Prioritätsentscheidungen; Normal nutzt Board-Bewertung und Risikoregeln. |
| V03-SHOULD-002 | Hard als begrenzter Lookahead | Hard nutzt nur erlaubte Informationen und maximal kurze Such-/Simulationsfenster. |
| V03-SHOULD-003 | Simulationsbericht | Harness erzeugt Summary mit Seed, Winner, Turns, Actions, finalem StateHash und Failure-Repro-Daten. |
| V03-SHOULD-004 | Soak-Konfiguration | Kleiner CI-Lauf und längerer lokaler/nightly Lauf sind getrennt konfigurierbar. |
| V03-SHOULD-005 | Debug-Ansicht | Entwickler kann KI-Entscheidungen und Reason-Codes ansehen, ohne FullState im Spielerclient. |

### 5.3 Could

| ID | Idee | Bedingung |
|---|---|---|
| V03-COULD-001 | Hotseat Human/KI-Mix | Nur wenn es die Controller-Schicht nicht verkompliziert. |
| V03-COULD-002 | AI-vs-AI Replay-Export | Nur sichtgefiltert oder als lokales Debug-Bundle mit klarer Abgrenzung. |
| V03-COULD-003 | Tuning-Datei für Heuristiken | Nur versioniert, deterministisch und ohne geheimen Zustand. |

## 6. Architektur

### 6.1 Controller-Modell

V0.3 führt eine explizite Controller-Schicht ein.

```ts
type PlayerController =
  | { type: "human_remote"; side: Side; sessionId: string }
  | { type: "human_local"; side: Side }
  | { type: "ai"; side: Side; profile: AiProfile }
  | { type: "replay"; side: Side };
```

Die Engine kennt Controller nicht als Regelquelle. Controller sind nur Eingabequellen für `PlayerAction`.

Pflicht:

- Controller fragen aktuelle `LegalActions` ab.
- Controller wählen eine Action oder liefern einen Fehler.
- Server oder lokaler Orchestrator baut daraus `PlayerAction`.
- `applyAction` validiert wie bisher vollständig neu.

### 6.2 AI-Input-Contract

Der aktuelle `AiDecisionInput` ist auf Corp beschränkt. V0.3 erweitert ihn side-neutral.

```ts
type AiDecisionInput = {
  side: Side
  playerView: PlayerView
  eventTail: PublicGameEvent[]
  legalActions: LegalAction[]
  difficulty: "easy" | "normal" | "hard"
  seed: string
  decisionId: string
  actionNumber: number
  profileId: string
}
```

Verboten im AI-Input:

- `GameState`,
- `cardInstances`,
- vollständige Deck-, Stack- oder R&D-Reihenfolge,
- gegnerische Hand/HQ,
- unrezzed Kartentitel der Gegenseite,
- Tokens,
- Sessiondaten,
- private WebSocket-/Storage-Strukturen,
- private EventPayloads der Gegenseite.

### 6.3 AI-Decision

```ts
type AiDecision = {
  actionId: string
  reasonCode: string
  explanation: string
  confidence?: number
  consideredActionIds: string[]
  fallbackUsed: boolean
}
```

Die Erklärung darf nur sichtbare Informationen nennen. Beispiel:

- erlaubt: "Runner hat genug Credits und ein Run auf R&D ist legal."
- verboten: "R&D oberste Karte ist Simple Agenda", solange diese Karte für Runner nicht sichtbar ist.

### 6.4 Determinismus

KI-Entscheidungen müssen für denselben AI-Input deterministisch sein.

Regeln:

- Keine ungeführte Nutzung von aktueller Uhrzeit.
- Keine nicht deterministische Zufallsquelle.
- Zufall nur über Seed und Entscheidungscounter.
- Tie-Breaking stabil über ActionId, ActionType oder expliziten Seed.
- Simulationen protokollieren Seed, AI-Profil, Difficulty, Action-Sequenz und finalen StateHash.

## 7. Runner-KI

### 7.1 Zielverhalten

Die Runner-KI soll die Demo-Decks sinnvoll, aber nicht perfekt spielen.

Prioritäten:

1. Pflicht-/Access-Entscheidungen ausführen: Agenda stehlen, sinnvollen Trash wählen, Access fortsetzen.
2. Während Encounter passende Breaker installieren nicht möglich, aber vorhandene Breaker nutzen.
3. Subroutinen brechen, wenn passender Breaker installiert ist, Stärke reicht oder per Pump erreichbar ist.
4. Economy spielen oder Credits nehmen, wenn Credits knapp sind.
5. Breaker installieren, wenn im Grip und bezahlbar.
6. Run auf offene oder schwach geschützte Server starten.
7. R&D/HQ pressure bevorzugen, wenn Remote unklar ist.
8. End Turn, wenn keine sinnvolle Action mehr übrig ist.

### 7.2 Easy

Easy darf schwächer spielen:

- nimmt häufiger Credits,
- installiert verfügbare Breaker ohne tiefere Planung,
- läuft gelegentlich auf R&D/HQ,
- vermeidet komplexe Sequenzen,
- nutzt einfachen Fallback.

### 7.3 Normal

Normal soll nachvollziehbar spielen:

- installiert fehlende Breaker nach erwarteten ICE-Typen,
- achtet auf Credits vor Runs,
- läuft auf ungeschützte Remotes,
- stiehlt Agendas immer, wenn legal,
- trasht Assets, wenn Credits ausreichend und Boardzustand es erlaubt,
- bricht ETR-Subroutinen, wenn möglich.

### 7.4 Hard

Hard ist für V0.3 nur ein `Should`.

Erlaubt:

- kurze Lookahead-Bewertung über aktuelle LegalActions,
- Simulation mit öffentlichem oder eigenem sichtbaren Zustand,
- konservative Risikoabschätzung bei unbekannten ICE.

Nicht erlaubt:

- Zugriff auf Corp-HQ,
- Zugriff auf unrezzed ICE-Titel,
- Zugriff auf R&D-Reihenfolge,
- direkte Nutzung des FullState.

## 8. Corp-KI v2

### 8.1 Zielverhalten

Die Corp-KI soll gegenüber der MVP-0.1-Prioritätsliste besser scoren und verteidigen.

Prioritäten:

1. Mandatory Draw ausführen.
2. Agenda scoren, wenn legal und sicher.
3. Encounter-Rez-Choice treffen, wenn ICE bezahlbar und relevant ist.
4. Economy-Operation spielen, wenn Credits niedrig sind.
5. Agenda in Remote installieren, wenn Remote leer oder sinnvoll ist.
6. Agenda advancen, wenn installiert und Credits/Clicks reichen.
7. ICE vor R&D oder Scoring Remote installieren.
8. Economy Asset installieren oder rezzen.
9. Credits nehmen.
10. End Turn.

### 8.2 Scoring-Remote-Heuristik

V0.3 muss keine perfekte Strategie bauen, aber eine minimale Remote-Logik:

- Agenda bevorzugt in Remote installieren.
- ICE vor Remote installieren, wenn möglich.
- Advance vor Score, wenn Voraussetzung fehlt.
- Score bevorzugen, sobald legal.
- R&D-Schutz nicht vollständig vernachlässigen.

### 8.3 Rez-Heuristik

Corp rezzt ICE:

- wenn Runner begegnet,
- wenn Credits reichen,
- wenn ICE eine ETR-Subroutine hat oder Runner sichtbar wahrscheinlich nicht brechen kann,
- auf Easy ggf. simpler: erstes bezahlbares ICE rezzen.

## 9. Simulation

### 9.1 KI-vs-KI-Harness

Der Simulation-Harness führt Partien ohne Browser aus.

Eingaben:

- Seed oder Seed-Liste,
- AI-Profil Runner,
- AI-Profil Corp,
- Difficulty je Seite,
- `agendaPointsToWin`,
- maximale Actions,
- maximale Turns,
- optional Stop-on-first-failure.

Ausgaben:

- Winner oder `turn_limit_reached`,
- Anzahl Turns,
- Anzahl Actions,
- finaler StateHash,
- EventLog-Länge,
- Seeds,
- AI-Profile,
- reproduzierbare Action-Sequenz,
- Fehlerklassifikation bei Abbruch.

### 9.2 CI- und Nightly-Profil

Empfehlung:

| Profil | Umfang | Zweck |
|---|---:|---|
| `ai:smoke` | 5 Seeds | schneller Gate-Test |
| `ai:scenario` | feste Golden Seeds | reproduzierbare Kernpartien |
| `ai:soak` | 50 bis 100 Seeds | lokale/nightly Robustheit |

Ein CI-Gate muss schnell bleiben. Lange Soak-Läufe sollen reproduzierbar, aber nicht für jede kleine Änderung zwingend sein.

### 9.3 Fehlerdaten

Bei jedem Simulationsfehler müssen gespeichert oder ausgegeben werden:

- Seed,
- AI-Profile,
- Difficulty,
- StateVersion,
- letzte legale Actions,
- gewählte ActionId,
- Reason-Code,
- EventId,
- finaler oder letzter StateHash,
- minimale Repro-Sequenz.

## 10. Erklärmodus

Der Erklärmodus ist kein LLM. Er ist strukturierte, deterministische Begründung.

Beispiele für Reason-Codes:

| Code | Bedeutung |
|---|---|
| `runner.steal_agenda` | Runner stiehlt eine aktuell zugreifbare Agenda. |
| `runner.break_etr` | Runner bricht eine ETR-Subroutine mit passendem Breaker. |
| `runner.install_breaker` | Runner installiert fehlenden oder nützlichen Breaker. |
| `runner.economy_low_credits` | Runner baut Credits auf. |
| `runner.run_open_server` | Runner läuft auf offenen Server. |
| `corp.mandatory_draw` | Corp führt Pflichtdraw aus. |
| `corp.score_available_agenda` | Corp scored legale Agenda. |
| `corp.rez_defensive_ice` | Corp rezzt ICE zur Verteidigung. |
| `corp.advance_scoring_remote` | Corp advanced Agenda im Remote. |
| `fallback.first_legal_action` | Fallback wegen leerer oder ungültiger Bewertung. |

Visibility-Regel:

Reason-Codes und Erklärungen dürfen keine privaten gegnerischen Kartentitel, CardInstanceIds, Token oder private Choices enthalten.

## 11. UI und Produktfluss

V0.3 nutzt die bestehende Next.js-Oberfläche weiter und ergänzt Modi.

Mindestfluss:

1. Nutzer wählt Modus:
   - Runner gegen Corp-KI,
   - Corp gegen Runner-KI,
   - KI gegen KI Simulation.
2. Nutzer wählt Difficulty pro KI-Seite.
3. App erstellt Match mit AI-Controller für passende Seite.
4. Human-Seite bedient weiterhin LegalActions.
5. AI-Seite handelt automatisch nach Server-/Controller-Orchestrierung.
6. EventLog zeigt öffentliche Ereignisse und optional AI-Reason-Codes.
7. KI-vs-KI-Modus zeigt Fortschritt, Winner und StateHash.

Wichtig:

- Die UI darf keine Regelentscheidungen nachbauen.
- Die UI darf keine Engine im Browser importieren.
- AI-Debugdaten müssen side-sicher bleiben.

## 12. Tests

### 12.1 Unit-Tests

| Bereich | Tests |
|---|---|
| AI-Input | Runner und Corp Input enthalten keinen FullState und keine gegnerischen Hidden Infos. |
| Decision | Jede KI wählt nur vorhandene ActionIds. |
| Determinismus | Gleicher Input erzeugt gleiche Entscheidung. |
| Fallback | Leere/ungültige Bewertung nutzt deterministischen Fallback. |
| Explanation | Explanation enthält keine verbotenen Felder oder Titel. |
| Difficulty | Easy und Normal unterscheiden sich bei passenden Fixture-Situationen. |

### 12.2 Engine-/Scenario-Tests

| Szenario | Erwartung |
|---|---|
| Runner-KI stiehlt R&D-Agenda | Access und Steal werden korrekt gewählt. |
| Runner-KI bricht Barrier | Pump/Break wird gewählt, wenn bezahlbar und passend. |
| Runner-KI endet Turn sauber | Kein Endlosloop bei fehlenden sinnvollen Actions. |
| Corp-KI scored Agenda | Install/Advance/Score-Pfad funktioniert. |
| Corp-KI rezzt ICE | Rez-Choice wird legal und side-sicher getroffen. |
| KI-vs-KI Replay | finaler StateHash ist reproduzierbar. |

### 12.3 Integration-Tests

| Bereich | Erwartung |
|---|---|
| Human Runner vs Corp-KI | Server/Orchestrator verarbeitet AI-Actions durch dieselbe Pipeline. |
| Human Corp vs Runner-KI | Runner-KI funktioniert gegen Human-Corp-UI. |
| KI-vs-KI Service | Match läuft ohne Browser bis Winner oder Limit. |
| Multiplayer-Kompatibilität | Human-vs-Human bleibt unverändert grün. |

### 12.4 Visibility-Tests

Pflichtfälle:

- Corp-KI-Input enthält keine Runner-Grip- oder Stack-Titel.
- Runner-KI-Input enthält keine Corp-HQ-, R&D-Reihenfolge oder unrezzed ICE-Titel.
- KI-Erklärungen enthalten keine privaten gegnerischen Daten.
- Simulationslogs enthalten keinen FullState, außer ein explizites lokales Debug-Bundle wird getrennt und nicht als Client-/Standardlog geführt.
- AI-Fehler enthalten keine CardInstanceIds verdeckter Karten.

### 12.5 Soak-Tests

Mindestempfehlung:

- `ai:smoke`: 5 Seeds, schneller Standardtest.
- `ai:soak`: 50 Seeds lokal oder nightly.
- Action-Limit pro Partie, z. B. 250 Actions.
- Kein Invariant-Fehler.
- Kein illegaler AI-Submit.
- Kein Replay-StateHash-Fehler in Golden-Partien.

## 13. Arbeitspakete

### V0.3-A Requirements und Baseline

Ergebnisse:

- `docs/releases/mvp/mvp-0-3-ai-simulation/requirements.md`
- `docs/derived/AI_CONTROLLER_SPEC.md`
- `docs/derived/AI_SIMULATION_TEST_MATRIX.md`
- `docs/releases/mvp/mvp-0-3-ai-simulation/requirements-review.md`
- `data/rules/rules-baseline-0.3.json`
- AI-/Simulation-Szenario-Fixtures
- `tests/specs/ai-simulation-acceptance-tests.todo.md`

Gate:

- alle Must-Anforderungen testbar,
- keine Kartenpool-Erweiterung,
- AI-Visibility-Regeln vollständig beschrieben,
- `ready_for_implementation: true` erst nach Review.

### V0.3-B Controller- und AI-Input-Modell

Ergebnisse:

- side-neutraler AI-Input,
- Controller-Typen,
- einheitlicher Orchestrator für Human/AI/Replay,
- Verbot von FullState in AI-Standardpfaden.

Gate:

- Tests für AI-Input beider Seiten bestehen.

### V0.3-C Runner-KI

Ergebnisse:

- Runner-Decision-Funktion,
- Economy-/Install-/Run-/Access-/Break-Heuristiken,
- deterministic fallback,
- Reason-Codes.

Gate:

- Runner-KI wählt in Fixtures nur legale Actions und kann eine einfache Agenda stehlen.

### V0.3-D Corp-KI v2

Ergebnisse:

- bestehende Corp-KI refaktoriert,
- Difficulty berücksichtigt,
- Scoring-Remote- und Rez-Heuristik,
- Reason-Codes.

Gate:

- Corp-KI kann in Szenarien installieren, advancen, scoren und bei Encounter legal rezzen.

### V0.3-E Simulation-Harness

Ergebnisse:

- AI-vs-AI Runner,
- Seed-Liste,
- Action-/Turn-Limits,
- Ergebnisbericht,
- Replay/StateHash-Golden-Partie.

Gate:

- Smoke-Seeds laufen ohne IllegalAction, Invariant-Fehler oder nicht reproduzierbaren StateHash.

### V0.3-F UI-Modi

Ergebnisse:

- Moduswahl für Human-vs-KI in beide Richtungen,
- KI-vs-KI Demoansicht,
- Difficulty-Auswahl,
- Reason-Code-Anzeige ohne Leaks.

Gate:

- UI nutzt weiterhin nur PlayerView, LegalActions und side-sichere Events.

### V0.3-G Hardening und Final Review

Ergebnisse:

- `docs/releases/mvp/mvp-0-3-ai-simulation/final-review.md`,
- aktualisierte Wissensbasis,
- aktualisierter Status,
- finale Checks.

Gate:

- `MVP_0.3_done: true` nur bei grünem AI-, Simulation-, Visibility-, Replay-, Typecheck-, Test- und Build-Gate.

## 14. Akzeptanzkriterien

MVP 0.3 gilt als abgeschlossen, wenn:

- Human Runner vs Corp-KI weiter spielbar ist.
- Human Corp vs Runner-KI spielbar ist.
- KI-vs-KI-Simulationen deterministisch laufen.
- Runner-KI und Corp-KI wählen ausschließlich LegalActions.
- Ungültige KI-Entscheidungen werden abgefangen und deterministisch ersetzt.
- AI-Inputs enthalten keine FullState- oder Hidden-Info-Daten.
- AI-Erklärungen enthalten keine Hidden-Info-Daten.
- Mindestens eine KI-vs-KI-Partie replayt mit identischem finalem StateHash.
- Simulationen haben Action-/Turn-Limits und reproduzierbare Fehlerdaten.
- Bestehende MVP-0.1- und MVP-0.2-Gates bleiben grün.
- Kartenpool bleibt unverändert.
- Bekannte Einschränkungen und offene Entscheidungen sind dokumentiert.

## 15. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| KI erhält FullState | Hidden-Info- und Fairnessbruch | AI-Input-Builder allowlisten, Tests mit forbidden fields. |
| Simulation nutzt nicht deterministischen Zufall | Replay bricht | Seed-/Counter-Zwang und deterministische Tie-Breaks. |
| Runner-KI läuft in Endlosschleifen | Tests hängen, schlechte Spielbarkeit | Action-/Turn-Limits, Fallback, Progress-Heuristik. |
| Erklärungen leaken verdeckte Karten | Hidden-Info-Bruch | Explanation-Visibility-Tests und nur Reason-Codes aus sichtbaren Fakten. |
| UI baut Regeln nach | Divergenz zur Engine | LegalActions bleiben einzige Buttonquelle. |
| Hard-Difficulty wird zu groß | Scope-Verlust | Hard als Should, kein FullState, begrenzter Lookahead. |
| KI-vs-KI verdeckt Engine-Bugs durch Fallback | Falsche Stabilität | Fallback markieren und auswerten, nicht still akzeptieren. |

## 16. Offene Entscheidungen

| ID | Frage | Empfehlung |
|---|---|---|
| V03-O-001 | Wie viele Seeds im CI? | 5 schnelle Smoke-Seeds, längere Soak-Läufe separat. |
| V03-O-002 | Hard-Difficulty im MVP? | Als Should, nicht als Gate, wenn Normal solide ist. |
| V03-O-003 | AI-Debugdaten im Browser? | Nur side-sichere Reason-Codes, kein FullState. |
| V03-O-004 | Simulation als CLI oder Servermodus? | Beides vorbereitbar; zuerst Paket-/Test-Harness, danach UI. |
| V03-O-005 | JSON-Storage vor V0.3 ersetzen? | Nicht blockierend für AI/Simulation, außer private Dauerpartien werden Ziel. |

## 17. Empfohlener Requirements-Prompt

```text
Create or continue a persistent goal named "MVP 0.3 AI and simulation requirements".

Read:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/releases/mvp/roadmaps/post-mvp-0-2-roadmap.md
- docs/releases/mvp/mvp-0-3-ai-simulation/plan.md
- docs/releases/mvp/mvp-0-2-private-multiplayer/final-review.md
- docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
- docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/02_spezifikationen/Kartenimplementierungsleitfaden.md
- docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md
- packages/ai/src/index.ts
- packages/ai/src/index.test.ts

Task:
Derive executable MVP 0.3 requirements for the AI and simulation phase. Do not implement code.

Create or update:
- docs/releases/mvp/mvp-0-3-ai-simulation/requirements.md
- docs/derived/AI_CONTROLLER_SPEC.md
- docs/derived/AI_SIMULATION_TEST_MATRIX.md
- docs/releases/mvp/mvp-0-3-ai-simulation/requirements-review.md
- data/rules/rules-baseline-0.3.json
- data/scenarios/ai-runner-steals-rd-agenda.json
- data/scenarios/ai-corp-scores-remote-agenda.json
- data/scenarios/ai-vs-ai-smoke-replay.json
- tests/specs/ai-simulation-acceptance-tests.todo.md

Rules:
- No card pool expansion in MVP 0.3.
- AI may only use PlayerView, side-filtered events, LegalActions and explicit allowed metadata.
- AI must never receive full GameState, hidden opponent cards, tokens, sessions or storage internals.
- Every Must requirement must map to tests.
- Every AI explanation must have visibility rules.

Final response:
- files created or updated,
- main requirements,
- assumptions,
- risks,
- ready_for_implementation: true | false.
```

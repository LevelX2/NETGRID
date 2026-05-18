# MVP 0.9 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.9 stronger AI requirements`

## 1. Kurzentscheidung

MVP 0.9 ist die KI-Qualitätsphase nach V0.8.

Die Phase erweitert nicht primär den Kartenpool und baut keine neue Haupt-UI. Sie macht die vorhandene KI aus V0.3/V0.4 und die erwarteten Deck-/Kartenfundamente aus V0.6/V0.8 spürbar nützlicher: zum Spielen, Testen, Lernen, Balancing und Regressionsfinden.

Kernformel:

> Die KI wird besser durch sichtbasierte Heuristiken, Rollenmodelle, Risikobewertung, Difficulty-Stufen, kurze erlaubte Lookaheads und robuste Simulationen. Sie wird nicht besser durch FullState, versteckte Gegnerinformationen oder ein LLM als Regelakteur.

## 2. Scope-Entscheidung

V0.9 baut auf diesen vorherigen Phasen auf:

- V0.3: side-neutraler AI-Input, Runner-KI, Corp-KI v2, KI-vs-KI-Harness, Reason-Codes.
- V0.5: Katalog- und Statusmodell, ohne automatische Spielbarkeit.
- V0.6: Deckmodell, validierte Deck-Snapshots, Deck-Metadaten und Matchstart-Revalidierung.
- V0.7: Anzeige von KI-Erklärungen und Diagnoseflächen, ohne FullState im Browser.
- V0.8: größerer kuratierter spielbarer Karten-/Mechanik-Slice mit KI-Smokes je spielbarer Karte und minimalen Kartenrollen-Tags als Anschluss für V0.9.

V0.9 ist erst sinnvoll, wenn V0.8 mindestens einen stabilen spielbaren Slice mit validierten Runner- und Corp-Deck-Snapshots liefert. Wenn V0.8 verschoben oder verkleinert wird, muss V0.9 den verfügbaren Karten-/Deck-Scope übernehmen und darf ihn nicht selbst erweitern.

## 3. Nicht-Ziele

V0.9 baut nicht:

- neuen Kartenpool als Hauptziel,
- neue Regelmechaniken als Hauptziel,
- UI-Neugestaltung oder neues Designsystem,
- Kartentextparser oder automatische Regelumsetzung,
- KI mit `GameState`, `cardInstances` oder FullState,
- Zugriff auf verdeckte gegnerische Hand-, Deck-, R&D-, Stack-, HQ- oder Grip-Informationen,
- Zugriff auf unrezzed Corp-Kartentitel für Runner,
- Zugriff auf Runner-Grip-/Stack-Titel für Corp,
- LLM-KI als Regelakteur,
- freien Deckbuilder, öffentliches Matchmaking, Rankings oder Plattformfunktionen,
- strategische Beratung, die Actions außerhalb aktueller `LegalActions` vorschlägt.

Ein LLM darf in V0.9 höchstens als später separat freigegebene Text- oder Lernhilfe außerhalb der Regelentscheidung diskutiert werden. Es darf keine `PlayerAction` erzeugen, keine Regeln auslegen und keine versteckten Daten erhalten.

## 4. Zielbild

### 4.1 Bessere Runner-KI

Die Runner-KI soll aus sichtbaren Informationen nachvollziehbarere Pläne bilden:

- Economy- und Setup-Fenster erkennen.
- Breaker-/Rig-Abdeckung anhand eigener sichtbarer Karten und installierter Programme bewerten.
- Runs nach Serverwert, Risiko, Kosten und sichtbarer Boardlage auswählen.
- Encounter-Entscheidungen verbessern: pumpen, brechen, weiterlaufen oder abbrechen, soweit legal.
- Access-Entscheidungen verbessern: Agenda stehlen, Assets/Upgrades trashen oder ablehnen.
- Tags, niedrige Credits, wenige Klicks und gefährliche Boardzustände sichtbar berücksichtigen.
- Gegen unterschiedliche Corp-Deckrollen konservativer oder aggressiver spielen, aber nur aus erlaubten Deckrollen und sichtbarer Beobachtung.
- Lern-Erklärungen liefern, die sagen, welche sichtbaren Faktoren die Entscheidung geprägt haben.

Beispiele:

- Easy läuft häufiger auf zentrale Server und nimmt öfter Credits.
- Normal baut zuerst notwendige Breaker/Hardware auf und wählt Runs mit brauchbarem Kosten-/Risiko-Verhältnis.
- Hard nutzt sichtbare Rollenprofile, beobachtete ICE-Typen, Serverentwicklung und kurze öffentliche Lookaheads, bleibt aber ohne gegnerische Hidden Info.

### 4.2 Bessere Corp-KI

Die Corp-KI soll glaubwürdiger auf Score-, Economy- und Verteidigungspläne spielen:

- Scoring-Fenster erkennen und priorisieren.
- Agendas, Assets, Upgrades und ICE anhand eigener sichtbarer Hand/HQ und Boardlage unterscheiden.
- Remote-Aufbau, zentrale Verteidigung und Economy ausbalancieren.
- Rez-Entscheidungen anhand eigener sichtbarer Karten, Credits, Runner-Rig, Runner-Credits, Serverziel und sichtbarer Gefahr verbessern.
- Tags und Tag-Punishment nur nutzen, wenn LegalActions und sichtbare Taglage es hergeben.
- Gegen Runner-Deckrollen und beobachtetes Rig die Serverpriorität anpassen, ohne Runner-Hand oder Stack zu kennen.
- Erklärungen liefern, warum eine Agenda gescored, ICE gerezzt, Remote aufgebaut oder Economy genommen wurde.

Beispiele:

- Easy nimmt solide Basisaktionen und scored, wenn legal.
- Normal baut einen plausiblen Scoring-Remote und verteidigt R&D/HQ nicht blind.
- Hard wägt Scorefenster, Runner-Credits, bekannte Breaker und sichtbare Serverstruktur stärker.

### 4.3 Tracebare Anforderungen

Für den späteren Requirements-Freeze braucht V0.9 stabile IDs mit Akzeptanzkriterien. Diese Tabelle ist die Planungsfassung und soll im Freeze in `docs/releases/mvp/mvp-0-9-ai-difficulty/requirements.md` überführt werden.

Must:

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V09-MUST-001 | Requirements Freeze | `MVP_0.9_REQUIREMENTS.md` definiert Scope, Nicht-Ziele, Messgrößen, Sicherheitsgates und Testabdeckung. |
| V09-MUST-002 | Unveränderter AI-Input-Contract | KI-Entscheidungen nutzen nur `PlayerView`, `LegalActions`, side-gefilterte Events, Difficulty, Seed/Decision-Metadaten und erlaubte Rollenprojektionen. |
| V09-MUST-003 | LegalActions-only | Jede KI-Entscheidung referenziert eine aktuelle LegalAction; `applyAction` validiert Seite, ActionId, StateVersion, Timing, Kosten, Ziele und Choices erneut. |
| V09-MUST-004 | Kein Hidden-State-Einfluss | Gleiche `PlayerView`, gleiche `LegalActions`, gleiche side-gefilterte Events und gleiche erlaubte Rollenprojektion erzeugen dieselbe Entscheidung, auch wenn verdeckte gegnerische Karten oder Deckreihenfolgen unterschiedlich sind. |
| V09-MUST-005 | Kartenrollenmanifest | Kartenrollen sind versioniert, manuell gepflegt, decklegalitätsgebunden und nicht aus Kartentext geparst. |
| V09-MUST-006 | Deckrollenprofile | Deckrollen werden deterministisch aus validierten Snapshots und Kartenrollen abgeleitet; Gegnerprofile enthalten nur öffentliche oder beobachtete Fakten. |
| V09-MUST-007 | ObservedFacts-Modell | Aus side-gefilterten Events gelernte Fakten sind replaybar rekonstruierbar, side-sicher und können keine private Deckliste erzeugen. |
| V09-MUST-008 | AI Controller Lifecycle | Server-Autoplay startet, pausiert, stoppt und resynchronisiert deterministisch bei Match-Lock, Reconnect, Undo, Winner, stale State oder Action-Limit. |
| V09-MUST-009 | Messbare Qualitätsmetriken | Fallbackquote, Timeoutquote, illegale Actions, Progress, Reason-Code-Abdeckung, Rollenabdeckung, Replay-Stabilität und Coverage-Heatmap werden pro Simulation ausgewiesen. |
| V09-MUST-010 | Runner-KI-Verbesserung | Runner-Szenarien zeigen bessere Setup-, Run-, Encounter-, Access-, Tag- und Economy-Entscheidungen gegen eine eingefrorene Baseline oder definierte Erwartungsfälle. |
| V09-MUST-011 | Corp-KI-Verbesserung | Corp-Szenarien zeigen bessere Score-, Remote-, ICE-, Rez-, Economy- und Tag-Entscheidungen gegen eine eingefrorene Baseline oder definierte Erwartungsfälle. |
| V09-MUST-012 | Reason-Code- und Erklärungssicherheit | Jede Entscheidung hat stabilen Reason-Code, sichtbare Evidenz, Fallback-/Timeout-Markierung und keine verdeckten Kartendaten. |
| V09-MUST-013 | Soak- und Regressionstests | Mehrere Seeds, Decks, Matchups und Difficulties laufen ohne IllegalAction, StateHash-Drift, Endlosschleife oder Hidden-Info-Leak. |
| V09-MUST-014 | Tuning-Change-Control | Gewichte, Profile, Golden Summaries und Holdout-Seeds sind versioniert; Änderungen brauchen Review-Regel und dokumentierten Akzeptanzgrund. |
| V09-MUST-015 | Multiplayer-Kompatibilität | Human-vs-KI, KI-vs-Human, KI-vs-KI und Human-vs-Human bleiben serverautoritativ, side-sicher und replaybar. |

Should:

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V09-SHOULD-001 | Hard-Difficulty | Hard nutzt bessere Gewichtung und begrenzte Lookaheads, aber denselben Informationsvertrag wie Easy/Normal. |
| V09-SHOULD-002 | Baseline-Vergleich | V0.9-Summaries vergleichen Entscheidungen und Metriken gegen eingefrorene V0.8- oder V0.4-Baseline-KI. |
| V09-SHOULD-003 | Coverage-Heatmap | Simulationen zeigen Rollen-, Kartenrollen-, Actiontyp- und Reason-Code-Abdeckung nach Matchup und Difficulty. |
| V09-SHOULD-004 | Holdout-Seeds | Ein Teil der Seeds wird nicht für Tuning verwendet und dient als Überanpassungscheck. |
| V09-SHOULD-005 | Lernhinweise | UI-taugliche Lernhinweise werden nur aus sichtbarer Evidenz erzeugt und können getrennt von Debugdaten angezeigt werden. |
| V09-SHOULD-006 | Progress-Metriken | Simulationen messen Score-Fortschritt, Agenda-Punkte, erfolgreiche Runs, erzielte Scores, Action-Nutzen und Wiederholungsmuster. |

Could:

| ID | Idee | Bedingung |
|---|---|---|
| V09-COULD-001 | Tutorial-Difficulty | Nur wenn V0.7-Anzeigeflächen und Erklärungssicherheit stehen. |
| V09-COULD-002 | Lokales privates Debug-Bundle | Nur als explizit privates Entwicklerartefakt, nie als Clientpayload, Replay-Export oder Standardlog. |
| V09-COULD-003 | Erweiterter Decision-A/B-Test | Nur mit side-sicheren Inputs und ohne neue Regel- oder Kartenpoolarbeit. |
| V09-COULD-004 | Automatischer Tuning-Report | Nur wenn Gewichtungsänderungen weiterhin reviewpflichtig und deterministisch bleiben. |

## 5. KI-Architektur

### 5.1 Grundprinzip

Die KI ist ein Controller, keine Regelautorität.

Erlaubter Input:

- `side`,
- `PlayerView`,
- aktuelle `LegalActions`,
- side-gefilterte Events,
- `AiDifficulty`,
- Seed, `decisionId`, `actionNumber`, `profileId`,
- erlaubte Kartenrollen,
- erlaubte Deckrollen,
- sichtbare und öffentliche Metadaten.

Verbotener Input:

- `GameState`,
- `cardInstances`,
- private Event-Payloads der Gegenseite,
- verdeckte gegnerische Kartenidentitäten,
- gegnerische Deckliste, sofern nicht ausdrücklich öffentlich,
- eigene oder gegnerische Deckreihenfolge,
- Session-, Token-, Storage-, Reconnect-, Undo- oder WebSocket-Interna.

Die KI erzeugt keine neuen Actions. Sie bewertet ausschließlich aktuelle `LegalActions`. Die gewählte `actionId` läuft weiter durch denselben `applyAction`-Pfad wie menschliche Aktionen.

### 5.2 Schichtenmodell

Empfohlenes V0.9-Schichtenmodell:

| Schicht | Aufgabe | Verbot |
|---|---|---|
| AI Input Builder | Baut side-sicheren Input aus `PlayerView`, `LegalActions`, Events und erlaubten Rollen. | Kein FullState-Feld, keine privaten Payloads. |
| Role Registry | Liefert Karten- und Deckrollen aus versionierten Artefakten. | Kein Kartentextparser, keine Laufzeitinterpretation. |
| Feature Extractor | Extrahiert sichtbare Merkmale wie Credits, Klicks, Tags, Servercounts, sichtbare ICE, Rig-Abdeckung. | Keine verdeckten Titel oder IDs. |
| Action Scorers | Bewerten LegalActions nach Heuristikfamilien. | Keine Action-Erzeugung. |
| Risk Scoring | Schätzt Risiko auf sichtbarer Basis und öffentlichen/erlaubten Rollen. | Keine verdeckte Gegnerinformation. |
| Difficulty Profile | Steuert Gewichtung, Tiefe, Tie-Breaking und Fallback-Strenge. | Keine Difficulty mit unfairer Information. |
| Explanation Builder | Erzeugt Reason-Code, Kurzbegründung und sichtbare Evidenz. | Keine privaten Kartentitel, IDs, Tokens oder Decklisten. |
| Safety Guard | Prüft ActionId, Timeout, Determinismus, Reason-Code-Sicherheit und Fallback. | Kein stiller illegaler Submit. |

### 5.3 Heuristikfamilien

V0.9 sollte separate Scorer statt einer langen Prioritätsliste einführen.

Runner-Scorer:

- `runner.access_resolution`: Steal/Trash/Decline während Access.
- `runner.encounter_solution`: Pump/Break/Continue während Encounter.
- `runner.economy`: Credits, Economy-Events, sichtbarer Creditbedarf.
- `runner.setup`: Programme, Hardware, Memory, Rig-Rollen.
- `runner.run_selection`: Serverziel, Kosten, sichtbares Risiko, erwarteter Nutzen.
- `runner.tag_management`: Tags entfernen oder akzeptieren.
- `runner.pressure`: R&D/HQ/Remote-Druck anhand sichtbarer Boardlage.
- `runner.end_turn`: sauberer Abschluss ohne Endlosschleife.

Corp-Scorer:

- `corp.mandatory`: Pflichtfenster.
- `corp.score_window`: Score verfügbare Agenda.
- `corp.remote_plan`: Agenda/Asset/Upgrade in Remote installieren oder fortsetzen.
- `corp.ice_plan`: ICE-Installation vor Remote, R&D, HQ oder Archives.
- `corp.rez_window`: Rez/Decline anhand sichtbarer Runlage.
- `corp.economy`: Operation, Asset, Credit nehmen, Draw.
- `corp.tag_plan`: Tag-ICE und Tag-Punishment nur bei legaler und sichtbarer Lage.
- `corp.central_defense`: R&D/HQ-Schutz nach sichtbarem Druck.
- `corp.end_turn`: sauberer Abschluss ohne sinnlose Klicks.

Jeder Scorer gibt zurück:

- Score,
- Reason-Code-Kandidat,
- sichtbare Evidenz,
- Confidence,
- optionale Warnung, falls Bewertung schwach oder Rolle unbekannt ist.

### 5.4 Rollenbewertung

Rollen sind manuell gepflegte Metadaten, nicht aus Kartentext abgeleitet.

Beispiele für Kartenrollen:

- Runner: `economy`, `draw`, `breaker_fracter`, `breaker_decoder`, `breaker_killer`, `run_event`, `setup_hardware`, `tag_clear`, `pressure`, `trash_support`.
- Corp: `agenda_2pt`, `agenda_3pt`, `economy_operation`, `draw_operation`, `economy_asset`, `barrier_ice`, `code_gate_ice`, `sentry_ice`, `etr_ice`, `taxing_ice`, `tag_ice`, `tag_punishment`, `upgrade`, `asset_trash_target`.

Beispiele für Deckrollen:

- Runner: `setup_runner`, `pressure_runner`, `breaker_suite_complete`, `economy_dense`, `draw_dense`, `tag_resilient`.
- Corp: `glacier`, `scoring_remote`, `taxing_ice`, `tag_pressure`, `operation_economy`, `asset_economy`, `central_defense`.

Rollen dienen nur der Bewertung von LegalActions und sichtbaren Karten. Sie ersetzen keine Engine-Mechaniken.

### 5.5 Risk Scoring

Risk Scoring bewertet sichtbare Unsicherheit, ohne sie mit verstecktem Wissen aufzulösen.

Runner-Risiken:

- Anzahl unrezzed ICE auf Zielserver.
- bekannte rezzed ICE und ihre sichtbaren Subtypen/Stärken.
- eigene Credits, Klicks und installierte Breaker.
- sichtbare Tags und Corp-Credits.
- öffentlich bekannte oder erlaubte Corp-Deckrolle, zum Beispiel `taxing_ice` oder `tag_pressure`.
- beobachtete, bereits gerezzte oder öffentlich bekannte Karten aus Events.

Corp-Risiken:

- Runner-Credits, Klicks, Tags.
- sichtbare Runner-Rig-Rollen und Breaker-Abdeckung.
- eigene Credits und sichtbare HQ-Karten aus Corp-PlayerView.
- Serverstatus, Advancement Counter, rezzed/unrezzed eigene Karten in eigener Sicht.
- öffentlich erlaubte Runner-Deckrolle, zum Beispiel `pressure_runner`.

Risk Scores müssen deterministisch und erklärbar sein. Eine Runner-Erklärung darf bei einem unrezzed ICE nicht dessen Titel nennen, auch wenn die Corp-KI ihn kennen würde.

### 5.6 Difficulty-Stufen

V0.9 sollte Difficulty nicht durch unfairen Informationszugriff abbilden.

| Difficulty | Verhalten | Begrenzung |
|---|---|---|
| `easy` | einfache Prioritäten, konservative Economy, weniger Rollengewicht, gelegentlich suboptimale deterministische Tie-Breaks. | Keine Simulation, keine unfairen Daten. |
| `normal` | rollenbewusste Heuristiken, Risk Scoring, bessere Run-/Score-/Rez-/Trash-Entscheidungen. | Nur sichtbarer Zustand und erlaubte Rollen. |
| `hard` | gleiche Daten wie Normal, aber bessere Gewichtung, kurze Lookaheads, mehr Scorer-Kombinationen und weniger Fallbacks. | Kein FullState, kein Gegnerdeck, keine verdeckten IDs. |

Optional später:

- `tutorial`: bevorzugt erklärbare und lehrreiche Entscheidungen, auch wenn sie nicht maximal stark sind.
- `soak`: deterministische Stabilitäts-KI für Regressionen, optimiert auf breite Action-Abdeckung.

### 5.7 Begrenzte Simulationen und Lookaheads

V0.9 braucht zwei getrennte Simulationsbegriffe.

Erstens: Test- und Soak-Simulationen. Der Orchestrator darf echte Games ausführen, weil er ohnehin server-/testseitig den autoritativen Zustand besitzt. Die AI-Decision-Funktion erhält dabei trotzdem nur `PlayerView`, `LegalActions`, side-gefilterte Events und erlaubte Rollen. Das ist der primäre Regressionspfad.

Zweitens: Entscheidungssimulationen. Diese dürfen im AI-Paket nicht den echten FullState klonen und nicht `applyAction` auf verdecktem Zustand ausführen. Erlaubt sind:

- scoringbasierte kurze Lookaheads über aktuelle LegalActions,
- sichtbare Feature-Projektionen aus `PlayerView`,
- öffentliche oder eigene Rollenprofile,
- deterministische Erwartungswerte für unbekannte ICE/Server nur als generische Risikoannahme,
- maximal kleine Tiefe, zum Beispiel aktuelle Action plus nächstes sichtbares Fenster, wenn ohne FullState möglich.

Wenn eine spätere Implementierung eine enginebasierte Rollout-Idee prüft, braucht sie ein eigenes Gate: kein Hidden-Info-Transfer in AI-Input, kein Live-Entscheidungszugriff auf FullState, keine Erklärung aus verborgenen Rollout-Fakten.

### 5.8 AI Controller Lifecycle

V0.9 muss nicht nur eine bessere `chooseAiAction`-Funktion planen, sondern den gesamten Lebenszyklus einer KI-Entscheidung im Server-/Simulation-Kontext absichern.

Lifecycle:

1. Der Orchestrator prüft Matchstatus, Winner, aktive Seite, Controller-Typ, Match-Lock, Pending Undo und Reconnect-/Pause-Zustand.
2. Der Orchestrator baut den aktuellen side-sicheren AI-Input aus der autoritativen State-Quelle, ohne FullState an die Decision-Funktion weiterzugeben.
3. Die KI entscheidet innerhalb des Zeitbudgets deterministisch über eine aktuelle LegalAction.
4. Der Safety Guard prüft, ob `actionId`, `stateVersion`, Side, DecisionId und IdempotencyKey zur aktuellen Sicht passen.
5. Der Server reicht die Action durch dieselbe Pipeline wie Human-Actions ein.
6. `applyAction` validiert erneut und erzeugt Event, StateHash und side-gefilterte Payloads.
7. Der Orchestrator stoppt oder setzt fort, abhängig von Winner, Human-Turn, AI-Turn, Action-Limit, Fehler, Undo, Reconnect oder Lock.

Stop-/Pause-Regeln:

- Stop bei Winner, fehlenden LegalActions, Action-Limit, Turn-Limit, Timeout-Spike, Invariant-Fehler oder wiederholtem Fallback ohne Fortschritt.
- Pause bei Pending Undo, Match-Lock durch laufende Human-Action, Reconnect-Bootstrap oder explizitem Match-Pause-Status.
- Resync bei stale StateVersion, ersetzter Session, Reconnect oder abgelehnter Action.
- Kein zweiter KI-Submit darf für dieselbe Side, StateVersion und DecisionId parallel laufen.

Idempotenz:

- Jede KI-Entscheidung erhält deterministische `decisionId` und `idempotencyKey`.
- Doppelte Entscheidungen für dieselbe StateVersion liefern denselben Action-Versuch oder werden verworfen.
- Eine stale KI-Entscheidung darf nicht nachträglich auf einen neueren State angewendet werden.
- Undo nach KI-Actions nutzt dieselben Hidden-Info-Barrieren wie Human-Actions.

### 5.9 ObservedFacts-Modell

Observed Facts sind Fakten, die eine KI aus erlaubten side-gefilterten Events und der eigenen PlayerView lernen darf. Sie sind kein Ersatz für Hidden Info und keine private Deckliste.

Erlaubte ObservedFacts:

- öffentlich gerezzte oder installierte bekannte Karten,
- öffentlich gesehene Access-/Trash-/Score-/Steal-Ereignisse,
- sichtbare Tags, Credits, Clicks, Agenda Points und Zone Counts,
- beobachtete Serverziele, Runs, Rez-Entscheidungen und öffentlich bekannte Subroutinen,
- eigene Hand/HQ-/Grip-Informationen aus eigener PlayerView,
- öffentlich erlaubte Deckrollen oder Match-Metadaten.

Verboten:

- Rekonstruktion gegnerischer privater Decklisten,
- Ableitung verdeckter R&D-/Stack-Reihenfolge,
- Speicherung unrezzed Kartentitel aus der falschen Perspektive,
- private Payloads aus Events,
- Debug- oder Storage-Felder.

Regeln:

- ObservedFacts werden deterministisch aus EventLog-Tail und PlayerView rekonstruiert.
- Replay derselben side-gefilterten Eventsequenz erzeugt dieselben ObservedFacts.
- ObservedFacts enthalten Sichtbarkeitsklasse, Quelle, StateVersion und Side.
- Wenn ein Fact durch Undo ungültig wird, muss er side-sicher entfernt oder als `undone` markiert werden.
- ObservedFacts dürfen aggregieren, zum Beispiel "Corp hat bereits zwei Barrier-ICE gerezzt", aber nicht "das Deck enthält noch Karte X".

## 6. Datenmodell für Kartenrollen und Deckrollen

### 6.1 Kartenrollenmanifest

V0.9 sollte ein versioniertes Rollenmanifest planen, zum Beispiel:

- `data/ai/card-role-manifest-0.9.json`

V0.8 kann bereits `data/ai/card-role-tags-0.8.json` mit minimalen Rollen wie `economy`, `breaker_fracter`, `taxing_ice` oder `tag_punishment` liefern. V0.9 übernimmt diese Tags nicht blind, sondern validiert und erweitert sie in ein eigenes Rollenmanifest.

Empfohlene Felder pro Karte:

| Feld | Bedeutung |
|---|---|
| `cardId` | Engine-/Katalog-ID der Karte. |
| `side` | Runner oder Corp. |
| `roles` | Stabile Rollen-Tags. |
| `mechanicTags` | Manuell gepflegte Mechanik-Tags aus Manifest/Resolvermodell. |
| `visibilityClass` | `public_when_installed`, `hidden_until_rezzed`, `own_hand_only`, `access_only` usw. |
| `aiUseCases` | Grobe Einsatzmotive, zum Beispiel `setup`, `score`, `tax`, `pressure`. |
| `riskFlags` | `hidden_info`, `randomness`, `undo_barrier`, `access`, `damage`, `trace` usw. |
| `weights` | Kleine side-/difficulty-spezifische Gewichtungen. |
| `testCoverage` | Referenz auf Unit-, Szenario-, Visibility- und KI-Smoke-Spuren. |

Regeln:

- Rollen werden manuell aus Manifest, Resolver und Review abgeleitet.
- Kartentext ist Anzeigeinformation und darf nicht als Regelparser genutzt werden.
- Import-only, blocked oder nicht decklegale Karten dürfen keine aktive KI-Rolle im Matchstart erhalten.
- Rollen für verdeckte gegnerische Karten dürfen nicht in AI-Input landen.

### 6.2 Deckrollenprofil

V0.9 sollte Deckrollen aus validierten Snapshots und Kartenrollen ableiten, zum Beispiel:

- `data/ai/deck-role-profiles-0.9.json`

Empfohlene Felder:

| Feld | Bedeutung |
|---|---|
| `deckSnapshotId` | Immutable Snapshot aus V0.6/V0.8. |
| `deckHash` | Snapshot-Hash. |
| `side` | Runner oder Corp. |
| `publicMetadata` | Nur erlaubte Felder aus V0.6. |
| `ownAiProfile` | Rollenaggregat für die KI, wenn sie dieses Deck selbst spielt. |
| `publicOpponentProfile` | Nur öffentliche oder bewusst freigegebene Rollen, falls erlaubt. |
| `roleCounts` | Aggregierte Rollenanzahl, keine Kartenreihenfolge. |
| `gamePlanTags` | `setup`, `pressure`, `glacier`, `tag_pressure` usw. |
| `confidence` | Wie vollständig die Rollenpflege für dieses Deck ist. |

Wichtig:

- Die KI darf keine gegnerische private Deckliste erhalten.
- Eigene Deckrollen dürfen den Spielplan unterstützen, aber keine Deckreihenfolge oder verdeckte Ziehinformation liefern.
- Gegnerische Deckrollen sind nur erlaubt, wenn sie aus öffentlicher Metadata, öffentlich freigegebenem Profil oder sichtbarer Beobachtung stammen.
- Decknamen oder Hashes dürfen nicht heimlich als Lookup für private Rollenprofile missbraucht werden.

## 7. Umgang mit unterschiedlichen Decks aus V0.6/V0.8

V0.9 muss unterschiedliche validierte Decks unterstützen, ohne Deckvalidierung oder Matchstart neu zu erfinden.

Pflichtregeln:

- Matchstart bleibt serverseitig revalidiert.
- KI erhält Deckinformationen nur als erlaubte Rollen-/Metadatenprojektion.
- Deck-Snapshots bleiben immutable.
- Simulationen berichten Deck-Snapshot-IDs, Deckhashes, RulesBaseline, Kartenpoolversion und Seed.
- Ein unbekanntes oder unvollständig gepflegtes Deck nutzt deterministische Fallback-Rollen.

Empfohlenes Verhalten:

- V0.6-Legacy-Demo-Decks bekommen Basisrollen aus den bestehenden Demo-Karten.
- V0.8-Decks bekommen feinere Rollen aus dem V0.8-Rollenmanifest.
- Bei gemischten Decks blockiert die KI nicht den Matchstart, solange das Deck legal ist; sie markiert aber `role_profile_incomplete` und nutzt konservative Heuristiken.
- KI-vs-KI-Soaks laufen über mehrere Matchups: V0.6-Legacy gegen V0.6-Legacy, V0.8 gegen V0.8 und ausgewählte Cross-Matchups, falls decklegal.

## 8. Verbesserte Reason-Codes und Lern-Erklärungen

V0.9 soll Reason-Codes stabiler, feiner und lernbarer machen.

### 8.1 Reason-Code-Struktur

Empfohlenes Schema:

```txt
<side>.<context>.<intent>
```

Beispiele:

- `runner.access.steal_agenda`
- `runner.access.trash_high_value_visible_asset`
- `runner.encounter.break_etr`
- `runner.run.attack_open_remote`
- `runner.run.pressure_rd`
- `runner.setup.install_missing_breaker_role`
- `runner.economy.low_credit_recovery`
- `runner.tags.remove_tag_before_punishment`
- `corp.mandatory.draw`
- `corp.score.score_now`
- `corp.remote.install_agenda_plan`
- `corp.ice.protect_scoring_remote`
- `corp.rez.stop_run`
- `corp.rez.tax_runner`
- `corp.economy.play_operation`
- `corp.tags.punish_visible_tag`
- `fallback.timeout_first_legal`
- `fallback.role_profile_missing`

### 8.2 Erklärungstypen

Jede Entscheidung sollte strukturiert erklären:

- `reasonCode`,
- kurze deutsche Erklärung,
- sichtbare Evidenz, zum Beispiel Credits, Klicks, Tags, sichtbarer Server, legaler Action-Typ,
- Confidence,
- ob Fallback genutzt wurde,
- optional `learningHint`, wenn die UI in V0.7/V0.9 dies anzeigen kann.

Erklärungen dürfen nur sichtbare Informationen verwenden.

Erlaubt:

- "Der Runner hat 6 Credits, einen Fracter installiert und ein Run auf R&D ist legal."
- "Die Corp kann diese Agenda jetzt scoren."
- "Das ICE ist gerezzt und die ETR-Subroutine kann mit einem sichtbaren Breaker gebrochen werden."

Verboten:

- "Die oberste R&D-Karte ist eine Agenda."
- "Das unrezzed ICE ist Simple Tag ICE." aus Runner-Sicht.
- "Der Runner hat kein Kill-Programm in der Grip."
- "Das Gegnerdeck enthält genau diese Kartenliste." sofern nicht öffentlich freigegeben.

### 8.3 Lernnutzen

V0.9-Erklärungen sollen nicht nur Debugtexte sein.

Sie sollen Spielern helfen zu verstehen:

- warum ein Run lohnend oder riskant war,
- warum die Corp jetzt scored statt weiter aufzubauen,
- warum ein ICE gerezzt oder nicht gerezzt wurde,
- warum Tags entfernt oder ignoriert wurden,
- warum ein Fallback passiert ist,
- warum die KI eine konservative statt aggressive Linie wählt.

## 9. Simulation/Soak-Konzept

### 9.1 Ziele

Simulationen sollen:

- illegale KI-Entscheidungen finden,
- Endlosschleifen finden,
- StateHash-Drift finden,
- Visibility-Leaks in AI-Inputs, Decisions, Summaries und Debugdaten finden,
- schlechte Rollenprofile sichtbar machen,
- neue V0.8-Karten in realistischeren Actionsequenzen bewegen,
- Regressionen über Decks, Seeds und Difficulty-Stufen absichern.

### 9.2 Profile

Empfohlene Laufprofile:

| Profil | Umfang | Zweck |
|---|---:|---|
| `ai:v09-smoke` | 5 bis 10 Seeds, 1 bis 2 Matchups | schneller Gate-Test. |
| `ai:v09-regression` | 20 bis 40 Seeds, alle freigegebenen Standardmatchups | Pull-/Commit-naher Regressionslauf. |
| `ai:v09-soak` | 100 bis 300 Seeds, mehrere Difficulties und Decks | lokaler oder geplanter Langlauf. |
| `ai:v09-stress` | hohe Actionlimits, harte Timeoutprüfung | nur manuell/lokal bei KI-Änderungen. |

### 9.3 Matchup-Matrix

Mindestens:

- Runner V0.6 Demo vs Corp V0.6 Demo.
- Runner V0.8 Starter vs Corp V0.8 Starter.
- Runner V0.8 Pressure vs Corp V0.8 Scoring, falls vorhanden.
- Runner V0.8 Setup vs Corp V0.8 Tax/Tag, falls vorhanden.
- Easy vs Normal, Normal vs Normal, Hard vs Normal, Hard vs Hard.

Jede Summary enthält:

- Seed,
- Matchup,
- Deck-Snapshot-IDs,
- Deckhashes,
- RulesBaseline,
- Difficulty je Seite,
- AI-Profil-IDs,
- Actionzahl,
- Turnzahl,
- Winner oder Limit,
- finaler StateHash,
- Replay-Ergebnis,
- Reason-Code-Verteilung,
- Fallback-Anzahl,
- Timeout-/Loop-/Illegal-Action-Fehler.

### 9.4 Failure-Repro

Bei Fehlern müssen ausgegeben werden:

- Seed,
- Matchup,
- Side,
- StateVersion,
- TimingPoint,
- ActionNumber,
- LegalAction-Typen und ActionIds,
- gewählte ActionId,
- Reason-Code,
- Fallback-Status,
- letzter StateHash,
- gekürzte side-sichere Event-Tail,
- Klassifikation: `illegal_action`, `stale_action`, `timeout`, `loop_limit`, `statehash_drift`, `visibility_leak`, `invariant_failed`.

Kein Repro-Output darf FullState oder private Gegnerdaten enthalten.

### 9.5 Qualitätsmetriken

"Sichtbar bessere KI" wird in V0.9 nicht nur als Gefühl bewertet. Der Requirements-Freeze soll konkrete Grenzwerte festlegen.

Pflichtmetriken:

| Metrik | Bedeutung | Zielrichtung |
|---|---|---|
| `illegalActionCount` | KI wählt oder submitttet illegale Action. | Muss 0 sein. |
| `fallbackRate` | Anteil der Entscheidungen mit Fallback. | Niedrig, sinkend gegen Baseline. |
| `timeoutRate` | Anteil der Entscheidungen mit Timeout-Fallback. | Muss unter hartem Grenzwert liegen. |
| `staleDecisionCount` | Entscheidungen, die nach Statewechsel verworfen wurden. | 0 oder sauber resynchronisiert. |
| `loopAbortCount` | Abbrüche durch Action-/Turnlimit ohne sinnvollen Fortschritt. | Muss gegen Baseline sinken. |
| `replayOkRate` | Anteil replaybarer Simulationen mit passendem StateHash. | Muss 100 Prozent für Golden-Seeds sein. |
| `reasonCodeCoverage` | Anteil der Entscheidungen mit spezifischem Nicht-Fallback-Code. | Soll steigen. |
| `cardRoleCoverage` | Anteil der Kartenrollen, die in Simulationen sichtbar vorkommen oder entschieden werden. | Soll ausreichend breit sein. |
| `actionTypeCoverage` | Anteil relevanter Actiontypen, die in Simulationsmatrix vorkommen. | Soll Hauptpfade abdecken. |
| `progressScore` | Metrik aus Agenda-Punkten, Scores, Steals, erfolgreichen Runs und sinnvollen Board-Aktionen. | Soll keine Stagnation zeigen. |

Baseline-Vergleich:

- V0.9 soll gegen eine eingefrorene V0.8- oder, falls V0.8 noch klein bleibt, V0.4-Baseline-KI verglichen werden.
- Nicht jede Entscheidung muss "besser" sein; akzeptiert wird eine Änderung, wenn definierte Szenarien besser oder gleich sicher sind und keine Sicherheitsmetrik schlechter wird.
- Eine bewusst schwächere Easy-Decision darf von Normal/Hard abweichen, muss aber legal, deterministisch und erklärbar bleiben.

### 9.6 Coverage-Heatmap

V0.9 soll messen, ob Simulationen den neuen Karten-/Deckraum tatsächlich bewegen.

Heatmap-Dimensionen:

- Karte oder Kartenrolle,
- Actiontyp,
- Reason-Code,
- Side,
- Difficulty,
- Deck-Snapshot,
- Matchup,
- Seed-Gruppe,
- Sichtbarkeitsklasse.

Pflichtnutzen:

- neue V0.8-Kartenrollen erscheinen in mindestens einem KI-Smoke oder werden als nicht erreicht dokumentiert,
- wichtige Actiontypen wie Run, Rez, Break, Access, Score, Trash, Draw, Economy und Tag-Handling werden sichtbar abgedeckt,
- häufig ungenutzte Kartenrollen erzeugen Tuning- oder Deckbau-Fragen statt stiller Akzeptanz.

### 9.7 Tuning-Change-Control

KI-Gewichte und Profile sind Produktverhalten und müssen versioniert werden.

Regeln:

- Jedes Profil und jede Gewichtungsdatei hat Versions-ID, Änderungsgrund und Datum.
- Golden Summaries werden nur aktualisiert, wenn die Änderung bewusst akzeptiert ist.
- Holdout-Seeds werden nicht für normales Tuning genutzt und dienen als Überanpassungscheck.
- Eine Änderung gilt nicht als besser, wenn sie nur die Tuning-Seeds verbessert und Holdout-Seeds verschlechtert.
- Requirements Review dokumentiert Baseline, neue Summary, Metrikdiffs, akzeptierte Verschlechterungen und offene Tuning-Risiken.
- Randomisierte oder manuell nachgebesserte Tuningläufe dürfen keine nicht deterministischen Profile erzeugen.

## 10. Teststrategie

### 10.1 Unit-Tests

Pflicht:

- Kartenrollenmanifest validiert Schema, Side, Rollen, Risk Flags und Testreferenzen.
- Deckrollenprofile werden deterministisch aus Snapshots und Rollenmanifest erzeugt.
- Feature Extractor nutzt nur `PlayerView`, `LegalActions`, Events und Rollenprojektionen.
- Jeder Scorer ist deterministisch.
- Difficulty-Stufen erzeugen in Fixtures unterscheidbare Entscheidungen.
- Tie-Breaking ist stabil.
- Fallbacks werden markiert und erklärt.
- Reason-Codes erfüllen Schema und erlaubte Werte.
- ObservedFacts werden deterministisch aus side-gefilterten Events rekonstruiert.
- AI Controller Lifecycle verhindert doppelte, stale oder parallele KI-Submits für dieselbe StateVersion.
- Qualitätsmetriken und Coverage-Heatmap werden aus Simulationssummaries deterministisch erzeugt.
- Tuningprofile und Golden Summaries haben versionierte IDs und prüfbare Änderungsgründe.

### 10.2 Scenario-Tests

Pflicht:

- Runner wählt sinnvolle Access-Entscheidung.
- Runner bricht sichtbare ETR, wenn bezahlbar und passend.
- Runner installiert fehlende Breakerrolle, wenn sichtbar sinnvoll.
- Runner entfernt Tag, wenn Tag-Punishment sichtbar droht und legal ist.
- Corp scored legal verfügbare Agenda.
- Corp baut Scoring-Remote statt sinnlos zentral zu stapeln, wenn sichtbar passend.
- Corp rezzt ICE in Run-Fenster mit sichtbarer Begründung.
- Corp nutzt Tag-Punishment nur bei sichtbarem Tag und LegalAction.
- KI beendet Zug und bleibt nicht in Setup-/Economy-Schleife.

### 10.3 AI-Visibility-Tests

Pflicht:

- Runner-KI-Input enthält keine Corp-HQ-Titel, keine R&D-Reihenfolge, keine unrezzed ICE-Titel.
- Corp-KI-Input enthält keine Runner-Grip-/Stack-Titel.
- Rollenprojektionen enthalten keine private gegnerische Deckliste.
- Reason-Codes und Explanations enthalten keine verdeckten Kartentitel, DefinitionIds, InstanceIds oder Token.
- Simulation Summaries enthalten keine FullState-Felder, keine `cardInstances`, keine private Payloads.
- Debug- oder Repro-Bundles sind side-sicher oder ausdrücklich lokal privat markiert und nicht Clientpayload.
- Hidden-State-Invarianztest: zwei autoritative States mit gleicher PlayerView, gleichen LegalActions, gleicher side-gefilterter Event-Tail und gleicher erlaubter Rollenprojektion, aber unterschiedlichen verdeckten gegnerischen Karten oder Deckreihenfolgen, müssen dieselbe KI-Entscheidung erzeugen.
- ObservedFacts dürfen aus denselben side-gefilterten Events identisch rekonstruiert werden, dürfen aber keine privaten Decklisten oder verdeckten Reihenfolgen enthalten.

### 10.4 Replay/StateHash-Tests

Pflicht:

- Gleicher Seed, gleiche Deck-Snapshots, gleiche AI-Profile und gleiche Difficulty erzeugen gleiche Actionsequenz und finalen StateHash.
- Replay der AI-vs-AI-Golden-Partien reproduziert finalen StateHash.
- Unterschiedliche Seeds erzeugen deterministisch andere, aber replaybare Sequenzen.
- Role-Profile-Änderungen ändern erwartbar Golden-Summaries und werden versioniert.
- AI-Entscheidungen nutzen keine Uhrzeit, keine nicht deterministische Sortierung und keine externe Randomquelle.

### 10.5 Illegal-Action-Tests

Pflicht:

- Scorer, die eine nicht vorhandene Action bevorzugen, landen im Fallback.
- Manipulierte ActionIds werden vor Submit abgefangen oder durch `applyAction` abgelehnt.
- Stale StateVersion bleibt abgelehnt.
- Wrong-side Actions bleiben abgelehnt.
- Fallbacks submitten nur aktuelle LegalActions.
- Keine KI kann mit Rollenmodell Kosten, Timing, Ziele oder Choices umgehen.

### 10.6 Soak-Tests

Pflicht:

- Mehrere Seeds über alle freigegebenen V0.9-Matchups laufen ohne IllegalAction.
- Actionlimit verhindert Hänger.
- Turnlimit verhindert Endlosspiele.
- Timeout/Fallback wird gezählt und ist unter definiertem Grenzwert.
- Replay/StateHash bleibt für Golden-Seeds stabil.
- Failure-Repro ist ausreichend, um ein Problem lokal nachzustellen.
- Coverage-Heatmap zeigt Rollen-, Kartenrollen-, Actiontyp- und Reason-Code-Abdeckung.
- Holdout-Seeds werden separat ausgewertet und dürfen keine verdeckten Regressionen zeigen.

### 10.7 Regressionstests

Pflicht:

- bestehende V0.1- bis V0.8-Gates bleiben grün,
- bestehende Engine-, Server-, Catalog-, Deck-, UI-, Multiplayer- und Visibility-Tests bleiben grün,
- V0.3/V0.4 AI-Szenarien bleiben entweder unverändert grün oder werden bewusst als neue V0.9-Golden-Summaries versioniert.

### 10.8 Multiplayer-Kompatibilitätstests

Pflicht:

- Human-vs-KI in beide Richtungen läuft weiter über Server-Action-Pipeline.
- KI-Entscheidungen in einem privaten Match erzeugen nur side-gefilterte Payloads.
- Reconnect während AI-Autoplay zeigt keinen FullState und keine privaten KI-Daten.
- Undo-Barrieren bleiben mit KI-Actions korrekt.
- KI-Reason-Codes in Multiplayer-Views sind side-sicher.
- Human-vs-Human bleibt von KI-Rollenprofilen unbeeinflusst.
- Match-Lock verhindert parallele KI- und Human-Transitions.
- Pending Undo pausiert Autoplay.
- Reconnect-Bootstrap triggert keine doppelte KI-Action.
- Stale KI-Decision wird verworfen und side-sicher resynchronisiert.

### 10.9 Baseline- und Tuning-Tests

Pflicht:

- V0.9-KI wird gegen eingefrorene Baseline-Summaries verglichen.
- Golden-Summary-Änderungen sind reviewpflichtig und dokumentieren Metrikdiffs.
- Holdout-Seeds bleiben außerhalb des Tuning-Sets.
- Eine Tuningänderung darf Sicherheitsmetriken nicht verschlechtern.
- Reason-Code- und Coverage-Heatmap-Veränderungen werden sichtbar gemacht.

## 11. Kritische Härtungen

### 11.1 Hidden Info

- AI-Input Builder arbeitet mit Allowlist.
- Rollenprojektionen sind side-gefiltert.
- Gegnerische private Decklisten bleiben privat.
- Explanations werden mit Leak-Scanner geprüft.
- Keine verdeckten IDs in Debug, Repro, Logs oder UI.
- Hidden-State-Invarianztests ergänzen Feldscanner und beweisen, dass verdeckte Karten nicht indirekt in Entscheidungen eingehen.
- ObservedFacts haben eine explizite Sichtbarkeitsklasse und dürfen aus Undo oder Reconnect keine privaten Fakten behalten.

### 11.2 Determinismus

- Stable Sorts für LegalActions, Rollen, Scores und Tie-Breaks.
- Seed und `decisionId` werden explizit genutzt, falls deterministic tie variation nötig ist.
- Keine Uhrzeit, keine Math.random-Nutzung, keine nicht deterministische Objektiteration ohne Normalisierung.
- Scores werden auf feste Präzision normalisiert, falls Fließkommazahlen genutzt werden.

### 11.3 Timeouts

- Pro AI-Entscheidung ein hartes Zeitbudget.
- Pro Scorer ein weiches Budget.
- Bei Budgetüberschreitung: `fallback.timeout_first_legal` oder bester bis dahin geprüfter legaler Kandidat.
- Timeout wird in Summary und Explanation markiert.
- Keine blockierenden externen Calls in der Decision-Funktion.

### 11.4 Fallbacks

- Fallback ist deterministisch.
- Fallback ist sichtbar als Fallback markiert.
- Fallback wählt nur aktuelle LegalActions.
- Fallback darf keine verdeckte Information verwenden.
- Häufige Fallbacks sind Testwarnung und Tuning-Signal.

### 11.5 Keine Endlosschleifen

- Simulationen haben Actionlimit und Turnlimit.
- KI erhält Progress-Metriken aus sichtbaren Events.
- Wiederholte gleiche Reason-Codes ohne Fortschritt werden erkannt.
- End-Turn muss bei niedrigem Nutzen und ohne sinnvolle Actions stärker werden.

### 11.6 Lifecycle-Härtung

- Autoplay startet nur bei aktiver KI-Seite, aktivem Match und freiem Match-Lock.
- Autoplay stoppt bei Winner, Human-Turn, Pending Undo, Reconnect-Pause, Actionlimit oder Fehler.
- Doppelte DecisionIds für dieselbe StateVersion werden idempotent behandelt oder verworfen.
- Stale Decisions werden nie auf neuen State übertragen.
- Undo und Reconnect ändern keine Decision-Historie so, dass Replay und StateHash brechen.

### 11.7 Keine unfairen Informationen

- Difficulty erhöht Qualität, nicht Wissenszugriff.
- Hard kennt nicht mehr private Daten als Easy.
- Rollenprofile dürfen keine privaten Gegnerdecklisten verstecken.
- Observed Facts werden aus side-gefilterten Events abgeleitet.
- Soak-Harness darf FullState für Engine-Ausführung besitzen, aber nicht in AI-Decision-Input oder Standardsummary geben.

### 11.8 Tuning-Härtung

- Profil- und Gewichtungsänderungen sind versioniert.
- Golden-Summary-Updates sind Reviewentscheidungen, nicht automatische Testanpassung.
- Holdout-Seeds schützen gegen Überanpassung.
- Akzeptierte Verschlechterungen brauchen expliziten Grund, zum Beispiel bessere Sicherheit oder bessere Lernbarkeit.
- Coverage-Lücken erzeugen offene Punkte statt stiller Freigabe.

## 12. Performance und Debugging

### 12.1 Performance

V0.9 soll schnell genug bleiben, um in Server-Autoplay und Simulationen nutzbar zu sein.

Empfehlungen:

- Rollenprofile beim Matchstart vorberechnen.
- Feature Extraction pro Entscheidung einmal ausführen.
- Scorer rein und günstig halten.
- Nur Top-N-LegalActions tiefer bewerten.
- Hard-Lookahead begrenzen.
- Simulationen in Profilen staffeln.
- Keine Katalog-/Deck-Vollscans pro Entscheidung.

Budget-Vorschlag:

- Easy: unter 5 ms pro Entscheidung im typischen lokalen Test.
- Normal: unter 15 ms.
- Hard: unter 50 ms mit strengem Timeout.
- Soak: Summary-orientiert, keine schweren UI-/Debugdaten standardmäßig.

### 12.2 Debugging

Debugdaten sollen helfen, ohne zu leaken.

Empfohlene Debugstruktur:

- `decisionId`,
- Side,
- StateVersion,
- TimingPoint,
- Difficulty,
- sichtbare Feature Summary,
- Top-Scorer-Ergebnisse,
- gewählte ActionId,
- Reason-Code,
- Fallback-/Timeout-Status,
- redaktierte Event-Tail,
- finaler `stateHashAfter` nach `applyAction`.

Nicht in Standarddebug:

- FullState,
- `cardInstances`,
- gegnerische private Karten,
- Tokens,
- private EventPayloads,
- komplette gegnerische Decklisten.

Ein lokales privates Entwickler-Debug-Bundle mit FullState wäre eine separate spätere Entscheidung und darf nie Clientpayload, Standardlog, Replay-Export oder Multiplayer-Payload werden.

## 13. Vorgeschlagene Artefakte

Historisch vorgeschlagene Dokumentationsartefakte:

- `docs/releases/mvp/mvp-0-9-ai-difficulty/requirements.md`
- AI strategy spec
- AI role model spec
- AI risk scoring spec
- AI explanations spec
- AI controller lifecycle spec
- AI observed facts spec
- AI tuning and golden summary
- AI simulation test matrix
- `docs/releases/mvp/mvp-0-9-ai-difficulty/requirements-review.md`

Falls diese Einzelartefakte später wieder benötigt werden, gehören sie nach heutiger Zielstruktur je nach Funktion unter `docs/architecture/ai/`, `docs/reviews/ai/` oder `docs/releases/ai/`, nicht mehr unter `docs/derived/`.

Daten:

- `data/ai/card-role-manifest-0.9.json`
- `data/ai/deck-role-profiles-0.9.json`
- `data/ai/ai-profiles-0.9.json`
- `data/scenarios/v09-*.json`

Tests:

- `tests/specs/ai-0.9-acceptance-tests.todo.md`

Optionale Auswertungsartefakte:

- `data/ai/ai-golden-summaries-0.9.json`
- `data/ai/ai-holdout-seeds-0.9.json`
- `data/ai/ai-coverage-heatmap-0.9.json`
- `data/ai/ai-tuning-changelog-0.9.md`

Mögliche spätere Codebereiche:

- `packages/ai/src/roles`
- `packages/ai/src/features`
- `packages/ai/src/scorers`
- `packages/ai/src/risk`
- `packages/ai/src/explanations`
- `packages/ai/src/simulation`
- `packages/ai/src/lifecycle`
- `packages/ai/src/observed-facts`
- `packages/ai/src/metrics`

Diese Codebereiche sind nur Implementierungsideen für spätere Phasen. Dieser Plan schreibt keine Implementierung vor.

## 14. Teilphasen

### V0.9-A Requirements und Sicherheitsmodell

Ergebnisse:

- Requirements,
- Must-/Should-/Could-IDs mit Akzeptanzkriterien,
- Qualitätsmetriken und Zielgrenzwerte,
- AI-Input-Allowlist,
- Role-Projection-Regeln,
- Nicht-Ziele,
- Testmatrix.

Gate:

- Jede Must-Anforderung ist testbar.
- Keine KI-Datenquelle braucht FullState.
- "Sichtbar besser" ist über Metriken, Szenarien oder Baseline-Vergleich prüfbar.

### V0.9-B Rollenmanifest und Deckrollenprofile

Ergebnisse:

- Kartenrollenmanifest,
- Deckrollenprofile,
- Validierungsschema,
- Fallback für unbekannte Rollen.

Gate:

- Rollenprofile sind deterministisch, versioniert und side-sicher.

### V0.9-C Controller Lifecycle und ObservedFacts

Ergebnisse:

- Autoplay-Lifecycle,
- DecisionId-/Idempotency-Regeln,
- Pause-/Stop-/Resync-Regeln,
- ObservedFacts-Modell,
- Hidden-State-Invarianztests.

Gate:

- Keine doppelte oder stale KI-Action kann auf den falschen State angewendet werden.
- ObservedFacts sind replaybar, side-sicher und enthalten keine privaten Decklisten.

### V0.9-D Scorer-Architektur und Difficulty

Ergebnisse:

- Runner-/Corp-Scorer-Gruppen,
- Difficulty-Gewichte,
- stabile Tie-Breaks,
- Fallback- und Timeout-Regeln.

Gate:

- KI wählt in Unit-Fixtures nur LegalActions und Difficulty ist unterscheidbar.

### V0.9-E Runner-KI-Verbesserungen

Ergebnisse:

- bessere Setup-, Run-, Encounter-, Access-, Tag- und Economy-Entscheidungen.

Gate:

- Runner-Szenarien zeigen sichtbare Qualitätsverbesserung ohne Visibility-Leak.

### V0.9-F Corp-KI-Verbesserungen

Ergebnisse:

- bessere Score-, Remote-, ICE-, Rez-, Economy- und Tag-Entscheidungen.

Gate:

- Corp-Szenarien zeigen sichtbare Qualitätsverbesserung ohne Visibility-Leak.

### V0.9-G Erklärungen und Lernmodus

Ergebnisse:

- Reason-Code-Taxonomie,
- Explanation Builder,
- Lernhinweise,
- Leak-Scanner.

Gate:

- Explanations sind deterministisch, deutsch, kurz und side-sicher.

### V0.9-H Soak, Regression und Hardening

Ergebnisse:

- Seed-/Matchup-Matrix,
- Golden-Summaries,
- Coverage-Heatmap,
- Holdout-Seeds,
- Tuning-Changelog,
- Repro-Ausgaben,
- Final Review.

Gate:

- Soak läuft ohne IllegalAction, StateHash-Drift, Visibility-Leak, Timeout-Spike oder Endlosschleife.
- Golden-Summary-Änderungen sind reviewt und Holdout-Seeds zeigen keine Überanpassung.

## 15. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| KI-Rollen leaken Gegnerdeck | Fairnessbruch | Gegnerprofile nur öffentlich/observed; private Rollenprojektionen side-filtern. |
| Hard-Difficulty nutzt heimlich FullState | Hidden-Info-Bruch | gleicher Input-Contract für alle Difficulties, Tests mit Forbidden Fields. |
| Rollen werden zum Regelparser | Engine-Divergenz | Rollen nur Bewertung, `applyAction` bleibt Autorität. |
| Simulationen werden zu langsam | Tests und Autoplay leiden | Profile, Budgets, Top-N, kurze Lookaheads. |
| Erklärungen verraten verborgene Fakten | Hidden-Info-Bruch | Explanation-Builder mit sichtbarer Evidenz und Leak-Tests. |
| Fallback verdeckt schlechte KI | scheinbar grüne Tests | Fallbackquote als Metrik und Grenzwert. |
| Endlosloops in KI-vs-KI | hängende Tests | Action-/Turnlimits, Progress-Erkennung, End-Turn-Scorer. |
| V0.9 zieht V0.8-Kartenarbeit nach | Scope Creep | V0.9 arbeitet nur mit freigegebenen spielbaren Decks. |
| Multiplayer-Payloads bekommen KI-Debugdaten | Leaks im privaten Match | Debugdaten side-filtern und nicht standardmäßig broadcasten. |
| ObservedFacts rekonstruieren private Decklisten | Fairnessbruch | nur side-gefilterte Events, Aggregationsgrenzen und Hidden-State-Invarianztests. |
| KI-Autoplay erzeugt doppelte Actions | State-Drift oder falsche Transitions | DecisionId, Match-Lock, Idempotency und stale-Decision-Verwerfung. |
| Tuning überpasst auf bekannte Seeds | bessere Tests, schlechtere Praxis | Holdout-Seeds, Baseline-Vergleich und Reviewpflicht für Golden-Summary-Updates. |
| Coverage bleibt oberflächlich | neue Kartenrollen werden nie genutzt | Heatmap für Kartenrollen, Actiontypen, Reason-Codes und Matchups. |

## 16. Offene Entscheidungen

| ID | Entscheidung | Empfehlung |
|---|---|---|
| V09-O-001 | Exakte V0.8-Deckbasis | Nach V0.8-Finalgate anhand validierter Snapshots festlegen. |
| V09-O-002 | Rollenmanifest-Ort | `data/ai/` als versionierte Projektartefakte einführen. |
| V09-O-003 | Own Deck Profile | Eigene Rollenprofile erlauben, aber ohne Deckreihenfolge; Gegnerprofile nur öffentlich/observed. |
| V09-O-004 | Difficulty-Gate | Easy/Normal als Must, Hard als Should, falls Lookahead stabil bleibt. |
| V09-O-005 | Soak-Umfang | CI klein halten, längere Soaks lokal oder geplant ausführen. |
| V09-O-006 | Tutorial-Erklärungen | Nur aufnehmen, wenn V0.7-Anzeigeflächen bereit und side-sicher sind. |
| V09-O-007 | Enginebasierter Lookahead | In V0.9 nur erlauben, wenn kein FullState in Decision-Input wandert; sonst verschieben. |
| V09-O-008 | Metrik-Grenzwerte | Im Requirements-Freeze konkrete Grenzwerte für Fallback, Timeout, Progress, Coverage und Replay festlegen. |
| V09-O-009 | Baseline-KI | Einfrieren, ob V0.8-KI oder V0.4-KI als Vergleichsbasis dient. |
| V09-O-010 | ObservedFacts-Speicherung | Empfehlung: aus EventLog rekonstruieren, nicht als private neue Wahrheitsquelle persistieren. |
| V09-O-011 | Holdout-Seed-Liste | Im Requirements-Freeze als versioniertes Artefakt festlegen und nicht für Tuning verwenden. |

## 17. Done-Kriterien

V0.9 ist fertig, wenn:

- Requirements mit stabilen Must-/Should-/Could-IDs und Akzeptanzkriterien eingefroren sind,
- Requirements und Sicherheitsmodell eingefroren sind,
- Kartenrollen und Deckrollen versioniert, validiert und side-sicher sind,
- ObservedFacts deterministisch, replaybar und side-sicher rekonstruiert werden,
- AI Controller Lifecycle Autoplay, Pause, Stop, Resync, Undo, Reconnect, Lock und stale Decisions korrekt behandelt,
- Runner-KI sichtbar bessere Setup-, Run-, Encounter-, Access-, Tag- und Economy-Entscheidungen trifft,
- Corp-KI sichtbar bessere Score-, Remote-, ICE-, Rez-, Economy- und Tag-Entscheidungen trifft,
- Easy und Normal unterscheidbar sind,
- Hard entweder sicher umgesetzt oder bewusst als späteres Gate dokumentiert ist,
- alle KI-Entscheidungen aus aktuellen `LegalActions` stammen,
- jede KI-Action weiterhin durch `applyAction` validiert wird,
- AI-Inputs, Reason-Codes, Explanations, Simulation Summaries, Debugdaten und Multiplayer-Payloads keine Hidden Info leaken,
- Hidden-State-Invarianztests beweisen, dass verdeckte gegnerische Karten und Deckreihenfolgen Entscheidungen nicht beeinflussen, wenn die sichtbare Projektion gleich ist,
- KI-Entscheidungen deterministisch und replaybar bleiben,
- Replay/StateHash-Golden-Partien stabil sind,
- Soak-Läufe über mehrere Seeds, Decks, Matchups und Difficulties ohne IllegalAction, Endlosschleife oder StateHash-Drift laufen,
- Fallbacks, Timeouts und Role-Profile-Lücken gemessen und unter Grenzwert sind,
- Baseline-Vergleich, Holdout-Seeds und Golden-Summary-Change-Control dokumentiert sind,
- Coverage-Heatmap für Kartenrollen, Actiontypen, Reason-Codes, Matchups und Difficulties vorliegt,
- Human-vs-KI, KI-vs-Human, KI-vs-KI und Human-vs-Human weiter kompatibel sind,
- bestehende V0.1- bis V0.8-Gates grün bleiben,
- bekannte Risiken, offene Entscheidungen und nicht umgesetzte KI-Ideen dokumentiert sind,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.

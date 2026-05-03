# Mechanik-Komplettierungsplan

Status: detaillierte Planungsfassung; V0.94/V0.95-Detailpläne liegen vor
Stand: 2026-05-03
Arbeitsbasis:

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `docs/derived/MVP_0.4_DETAILED_PLAN.md`
- `docs/derived/MVP_0.8_DETAILED_PLAN.md`
- `docs/derived/PLAYABLE_CARD_SLICE_0.8_SPEC.md`
- `docs/derived/RULE_MECHANICS_0.8_SPEC.md`
- `docs/derived/DEVIATION_REGISTRY.md`
- `docs/derived/OPEN_QUESTIONS.md`
- `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`

## 1. Kurzentscheidung

Nach V0.9 ist die spielbare Engine stabil genug, um die noch fehlenden Regelmechaniken geplant und in kleinen Gates nachzuziehen. V0.91 ist ein getrenntes Kartenbild-Asset-Gate und darf nicht mit Mechanikarbeit vermischt werden.

Empfohlene Kernstrategie:

1. Zuerst den Status konsolidieren und ein versioniertes Mechanik-Inventar anlegen.
2. Danach das Engine-Fundament für allgemeine Fähigkeiten, Timing, Kosten, Choices, Modifikatoren und Events härten.
3. Anschließend Mechaniken nach Abhängigkeitsnutzen und Risiko einzeln freigeben.
4. Jede Mechanik bekommt eigene Anforderungen, Szenarien, Visibility-, Replay-/StateHash-, KI- und Multiplayer-Gates.
5. Keine Karte wird durch Katalog, Import oder Deckeditor spielbar. Spielbarkeit bleibt an Manifest, Resolver und Tests gebunden.

Der Plan zielt nicht auf eine vollständige offizielle Plattform. Er beschreibt, wie möglichst alle bekannten Regelmechaniken irgendwann abgebildet oder bewusst als nicht relevant, blocked oder post-V1.x eingeordnet werden.

## 2. Abgleich mit bestehender Planung

| Bestehender Stand | Abgleich | Konsequenz |
|---|---|---|
| V0.4 plante Safe Card Batch, Upgrades, Tags und Damage als Teilgate. | Safe Batch, Upgrades, Tags, `remove_tag` und Tag-Punishment sind umgesetzt. Damage blieb bewusst draußen. | Damage ist der wichtigste offene Mechanikblock mit bestehender Vorplanung. |
| V0.8 plante einen lokalen/fiktiven Starter-Slice und verschob Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement. | V0.8 ist umgesetzt, die Deferred-Liste bleibt gültig. | Diese Liste ist der Kern des Mechanik-Backlogs. |
| V0.9 stärkte KI ohne neue Karten oder Regeln. | KI bleibt LegalActions-/PlayerView-only und kann als Regression für neue Mechaniken dienen. | Jede neue Mechanik braucht KI-Smokes und side-sichere Reason-Codes. |
| V0.91 ist ein Asset-Gate. | `MVP_0.91_REQUIREMENTS.md` enthält bereits eine private lokale O:NR-Bildentscheidung mit `ready_for_implementation: true`, während `CODEX_STATUS.md` noch ältere Blockerstellen mit `ready_for_implementation: false` enthält. | Vor dem nächsten Gate Statusdateien konsolidieren. Mechanikarbeit bleibt davon fachlich unabhängig. |
| `DEVIATION_REGISTRY.md` führt Mulligan, Timingfenster, Paid Abilities, Trace, Damage, Viren, Hosting, Prevention/Replacement, Jack-out, Multiaccess und Archives als Abweichungen. | Einige frühe Abweichungen sind teilweise überholt, etwa Tags. Andere sind weiterhin offen. | Eine neue Mechanik-Coverage-Datei sollte alte Deviations nicht nur kopieren, sondern auf den aktuellen V0.8/V0.9-Stand normalisieren. |

## 3. Aktuell gut abgebildete Mechanikgruppen

Die folgenden Bereiche gelten als vorhandene Basis und sollen regressionsgeschützt bleiben:

- deterministisches Setup mit Seed, RandomCounter, RandomDrawRecords, EventLog und StateHash,
- serverautoritative `LegalActions`/`PlayerActions` und `applyAction`-Revalidierung,
- side-gefilterte PlayerViews, PublicEvents, WebSocket-, Reconnect-, Undo- und KI-Payloads,
- Grundaktionen für Credits, Draw, Install, Play Event/Operation, Advance, Score, Run, Rez, Breaker Pump/Break, Access, Steal, Trash und End Turn,
- Kartenarten `identity`, `event`, `program`, `hardware`, `agenda`, `operation`, `asset`, `upgrade`, `ice`,
- Runner-Rig mit Programmen und Hardware,
- ICE-Subroutinen für `end_the_run`, Corp-Credits, Runner-Creditverlust und Tag-Erhalt,
- einfache Runs, Encounter, Breaker nach ICE-Subtype, Single-Access, Score/Steal und Asset-/Upgrade-Trash,
- Tags, `remove_tag` und einfache Tag-Punishment-Karten,
- Deckmodell, Deckvalidierung, Snapshot-/Hash-Prüfung, Match-Setup und KI-Profile.

## 4. Gewichtungsmodell

Mechaniken werden mit zwei Achsen bewertet:

| Gewicht | Bedeutung |
|---|---|
| P0 | Fundament oder Gate-Blocker. Ohne diesen Schritt entstehen bei späteren Mechaniken Regel-, Visibility- oder StateHash-Schulden. |
| P1 | Hoher Spielwert oder viele Karten werden dadurch erst sinnvoll spielbar. Sollte vor einem breiteren V1.x-Kartenpool kommen. |
| P2 | Breite Kartenabdeckung, aber nicht zwingend für private stabile V1.0-Partien. |
| P3 | Spezialmechaniken oder seltene Kartentypen. Nach stabiler Kernplattform sinnvoll. |
| P4 | Außerhalb des privaten Produktziels oder nur nach expliziter neuer Scope-Entscheidung. |

Risiko wird separat bewertet:

| Risiko | Bedeutung |
|---|---|
| niedrig | öffentliche Information, wenig neue Timingpunkte, keine versteckten Zonen. |
| mittel | neue Choices, neue Zonenbeziehungen oder neue UI-/KI-Rollen. |
| hoch | verdeckte Information, Randomness, Undo-Barrieren, komplexes Timing oder Replacement/Prevention. |

## 5. Priorisierte Mechanik-Matrix

| Rang | Mechanikgruppe | Gewicht | Risiko | Warum diese Position? | Bestehender Anschluss |
|---:|---|---|---|---|---|
| 0 | Status- und Inventar-Konsolidierung | P0 | niedrig | Verhindert Widersprüche zwischen Roadmap, Status, Requirements und Deviations. | V0.91-Statusinkonsistenz, V0.8-Deferred-Liste. |
| 1 | Allgemeines Timing-, Ability- und Effect-Fundament | P0 | hoch | Fast alle späteren Mechaniken brauchen saubere Kosten, Choices, Trigger, Modifikatoren und Eventreihenfolge. | `TimingPointId`, Breaker-/Rez-Aktionen, einfache Resolver. |
| 2 | Setup- und Spielende-Normalisierung | P1 | mittel | Mulligan, 7-Punkte-Ziel, Flatline-/Deckout-Handling und Startfähigkeiten machen Partien näher an echte Spiele. | `agendaPointsToWin`, Identity-Setup, deterministic draw. |
| 3 | Damage und Flatline | P1 | hoch | Viele Corp-Karten und Sentry-Rollen hängen daran; starke Hidden-Info- und Undo-Relevanz. | V0.4 Damage-Teilgate bereits geplant. |
| 4 | Resources und Tag-Interaktion | P1 | mittel | Runner-Board wird vollständig; Tags gewinnen mehr Bedeutung. | Runner-Rig, Tags, `remove_tag`. |
| 5 | Trace, Link und Bidding | P1 | hoch | Zentrale Corp/Runner-Interaktion mit Choices und geheimen/öffentlichen Ausgaben. | Tags, Credits, ChoiceRequest/WebSocket-Grundlagen. |
| 6 | Run-, Jack-out-, Breach- und Multiaccess-Ausbau | P1 | hoch | Der Run ist das Herzstück; Multiaccess und Jack-out entsperren viele Karten. | RunState, Single-Access, Random HQ Access. |
| 7 | Identitätsfähigkeiten und dauerhafte Effekte | P1 | hoch | Echte Decks brauchen aktive Identities; passive Effekte testen das Ability-Fundament. | Identity-Karten und Deckvalidierung existieren. |
| 8 | Such-, Reveal-, Expose-, Arrange- und Shuffle-Effekte | P2 | hoch | Viele Karten manipulieren versteckte Zonen oder Reihenfolgen. | RandomDrawRecords und Visibility-Gates. |
| 9 | Hosting, Hosted Cards, Viren und Purge | P2 | hoch | Großer Kartenblock, neue Objektbeziehungen und Counter. | CardInstanceRef, Counter-Konzept noch auszubauen. |
| 10 | Zusätzliche Counter-Familien und Ressourcenmodelle | P2 | mittel | Recurring Credits, Power Counter, Bad Publicity, Agenda Counter, Core-Damage-Counter, Charge, Mark und Dividends. | Credits, Tags, Advancement Counters. |
| 11 | Prevention, Avoid, Interrupts und Replacement | P2 | sehr hoch | Regeltechnisch zentral für breite Abdeckung, aber als frühes Gate zu gefährlich. | Muss auf Ability-/Effect-Fundament aufbauen. |
| 12 | Vollere Deckbuilding-Regeln | P2 | mittel | Factions, Influence, Mindestgrößen, Agenda-Dichte, Rotation/Banlisten. | Deckeditor, Formatprofile, Snapshots. |
| 13 | Spezialfälle: Extra Cards, Set Aside, Remove from Game, Ownership/Control-Wechsel | P3 | hoch | Wichtig für spezielle Karten, aber nicht Kern privat spielbarer Partien. | ZoneRef und CardInstance-Owner/Controller vorhanden. |
| 14 | Öffentliche Plattformmechaniken | P4 | hoch | Matchmaking, Rankings, Accounts und Turnierbetrieb sind Produktfeatures, keine Engine-Mechaniken. | Bleiben außerhalb dieses Plans. |

## 6. Empfohlene mehrstufige Umsetzung

### M0 - Status- und Mechanik-Inventar

Ziel:

Den aktuellen Mechanikstand eindeutig machen, bevor neue Requirements entstehen.

Planungsaufgaben:

- `CODEX_STATUS.md`, Roadmap und V0.91-Requirements auf einen konsistenten Asset-Gate-Stand bringen.
- Neues Artefakt `docs/derived/MECHANICS_COVERAGE_MATRIX.md` planen.
- Optionales Datenartefakt `data/rules/mechanics-coverage-0.92.json` planen.
- Alte Deviations aus `DEVIATION_REGISTRY.md` gegen V0.4/V0.8/V0.9 markieren: `resolved`, `partial`, `open`, `superseded`.
- Jede Mechanik mit Quelle, Status, Risiko, Abhängigkeiten, benötigten Tests und möglichen Beispielkarten erfassen.

Gate:

- Es gibt genau eine aktuelle Liste offener Mechanikgruppen.
- V0.91-Assetstatus widerspricht nicht mehr dem Codex-Status.
- Keine Mechanik ist nur in alten MVP-0.1-Deviations versteckt.

### M1 - Timing-, Ability- und Effect-Fundament

Ziel:

Ein kleines allgemeines Regelgerüst schaffen, damit neue Mechaniken nicht jeweils eigene Sonderlogik bauen.

Umfang:

- `EffectDefinition`/Resolver-Kontrakt mit Kosten, Zielen, Choices und deterministischer Reihenfolge.
- Allgemeine `trigger_ability`- oder ability-spezifische LegalActions.
- Paid-Ability-Fenster nur für freigegebene Timingpunkte, nicht vollständige CR-Priorität auf einmal.
- Statische und bedingte Modifikatoren als deklarierte, testbare Engine-Hooks.
- Eventklassifikation: public, private_to_side, hidden_info_barrier, replay_only.
- Kostenquellen vorbereiten: Credit Pool, optional später Hosted Credits und Recurring Credits.
- ChoiceRequest-Modell so erweitern, dass Trace/Bidding/Mulligan/Prevention später nicht jeweils ein eigenes Protokoll brauchen.

Nicht-Ziel:

- Keine vollständige offizielle Timing-Priorität in einem Schritt.
- Keine Freitextinterpretation von Kartentexten.

Gate:

- Bestehende Breaker-, Rez-, Run- und Access-Aktionen bleiben unverändert spielbar.
- Jeder neue Effect erzeugt canonical Event, StateHash und side-gefilterte Payloads.
- AI kann unbekannte Ability-Rollen ignorieren oder safe fallbacken.

### M2 - Setup und Spielende normalisieren

Ziel:

Die alten MVP-Abweichungen bei Setup und Spielende reduzieren.

Umfang:

- Mulligan als deterministischer Choice-Schritt nach initialem Draw.
- 7-Punkte-Sieg als Standard für neue Formate; Legacy-Demo-Decks dürfen per Baseline 6 behalten.
- Runner-Deckout und Flatline-Endzustände vorbereiten.
- Start-of-game-Identity-Fähigkeiten als streng getesteter Sonderfall.
- Archives/facedown-Grundmodell reviewen, bevor neue Archives-Karten spielbar werden.

Gate:

- Replay reproduziert Mulligan-Entscheidungen und Start-Hashes.
- PlayerViews leaken keine Starthände oder Deckreihenfolgen.
- Deck-Snapshots unterscheiden Legacy- und Standard-Siegwert sichtbar.

### M3 - Damage und Flatline

Ziel:

Damage als erstes hohes Hidden-Info-Gate einführen.

Umfang:

- Gemeinsamer Effect `do_damage` mit `amount`, `damageType` und Quelle.
- Minimal zuerst `net`/`meat` funktional gleich; `core` erst wenn Core-Damage-Counter und Handlimit sauber modelliert sind.
- Zufälliger Trash aus Runner-Grip über Seed/RandomCounter/RandomDrawRecords.
- Damage mit leerer oder zu kleiner Grip definieren.
- Runner-Heap/PublicEvents so filtern, dass die Auswahl nicht mehr preisgibt als die resultierende sichtbare Bewegung.
- Flatline als Win Condition.
- Undo nach Damage immer blockieren.

Gate:

- Damage-Szenario mit finalem StateHash.
- Leaktests für RunnerView, CorpView, PublicEvents, WebSocket, Reconnect, Undo, Errors, Logs und KI-Input.
- AI bewertet Damage-Risiko nur aus sichtbaren Informationen.

### M4 - Resources und Tag-Interaktion

Ziel:

Runner-Resources als dauerhafte Boardkarten einführen und Tags mechanisch wertvoller machen.

Umfang:

- `RunnerRig.resources`.
- Install-, Sichtbarkeits-, Trash- und Persistenzregeln für Resources.
- Einfache Ressource ohne Trigger als Safe Card.
- Tag-basiertes Resource-Trash als getrenntes Subgate.
- Resource-spezifische Modifikatoren erst nach M1-Fundament.

Gate:

- Resources sind öffentlich sichtbar, aber keine gegnerischen Hand-/Deckdaten leaken.
- Corp darf Resource-Trash nur legal aus `LegalActions` ausführen.
- KI vermeidet endlose Tag-Remove-/Resource-Trash-Schleifen.

### M5 - Trace, Link und Bidding

Ziel:

Trace als interaktive Choice-Sequenz abbilden.

Umfang:

- Runner-Link-Wert auf Identity/Board.
- Trace-State mit initiierender Quelle, Base Strength, Corp-Bid, Runner-Bid, Ergebnis und Kosten.
- ChoiceRequests für Ausgaben, mit serverseitiger Revalidierung.
- Keine geheimen FullState-Daten in ChoicePayloads.
- Bidding-Generalisation für spätere nicht-Trace-Bids.

Gate:

- Trace-Replay ist deterministisch.
- Beide Seiten sehen nur zulässige Bid-/Ergebnisinformationen.
- Stale Choice und falsche Side werden abgelehnt.
- KI-Trace-Profile nutzen Credits und sichtbare Bedrohung, nicht verdeckte Karten.

### M6 - Run, Jack-out, Breach und Multiaccess

Ziel:

Den Run-Pfad näher an echte Partien bringen.

Umfang:

- Jack-out an legalen Timingpunkten.
- Breach-Objekt als eigener Zustand statt nur `accessedCardId`.
- Multiaccess für R&D, HQ, Archives und Remote nach klarer Reihenfolge.
- Access-Queue mit `accessed`, `skipped`, `trashed`, `stolen`, `declined`.
- Additional Access, Access-Prohibition und Access-Replacement nur als spätere Subgates.
- Archives facedown/offen sauber side-gefiltert.

Gate:

- Multiaccess-Szenarien für R&D, HQ und Archives.
- Undo-Barriere nach jeder relevanten neuen Information.
- PublicEvents nennen Kartentitel nur nach legalem Reveal/Access/Trash/Steal.
- UI zeigt mehrere Access-Schritte nur aus Engine-Zustand, nicht aus eigener Regelableitung.

### M7 - Identitätsfähigkeiten und dauerhafte Effekte

Ziel:

Identities als echte Karten mit Setup-, passiven und ausgelösten Fähigkeiten nutzbar machen.

Umfang:

- Identity-Ability-Klassen: setup, start-of-turn, first-time-per-turn, passive modifier, conditional trigger.
- Aktivitätsregeln und einmalige pro Turn/Run/Encounter Marker.
- Deckvalidierung mit Faction/Influence erst als optionaler Folgepfad.
- Keine Identität darf FullState oder gegnerische Hidden Info für Triggerauslösung brauchen.

Gate:

- Mindestens eine Runner- und eine Corp-Identity mit einfacher, sichtbarer Fähigkeit.
- StateHash enthält Triggerzähler deterministisch.
- KI-Reason-Codes erklären nur sichtbare Trigger.

### M8 - Search, Reveal, Expose, Arrange, Shuffle und Swap

Ziel:

Verdeckte Zonen gezielt manipulieren, ohne Visibility zu brechen.

Umfang:

- Suchaktionen mit side-spezifischer Ergebniswahl.
- Reveal/Expose als explicit public information event.
- Arrange/Rearrange mit privater Reihenfolge nur für berechtigte Seite.
- Shuffle als deterministischer RandomDrawRecord.
- Swap/Move zwischen Zonen mit Owner/Controller-Invarianten.

Gate:

- Keine Such- oder Arrange-Choice leakt andere Kandidaten an die falsche Seite.
- Replay nutzt keine neuen Zufallswerte außerhalb der Records.
- UI zeigt private Listen nur dem berechtigten Spieler.

### M9 - Hosting, Viren, Purge und Counter-Familien

Ziel:

Objektbeziehungen und Counter so erweitern, dass Virus- und Hosting-Karten möglich werden.

Umfang:

- `hostedOn`, `hostedCards`, hosted counters und hosted credits.
- Virus Counter, Power Counter, Agenda Counter und generische Counter-API.
- Purge-Virus-Counter als Corp Basic Action.
- Regeln für Trash/Move eines Hosts und seiner hosted Objects.
- Counter-Sichtbarkeit je Host und Kartenstatus.

Gate:

- Host-Trash bewegt hosted Cards deterministisch und sichtbar korrekt.
- Purge wirkt nur auf Virus Counter und ist als Basic Action sauber legalisiert.
- KI kann Virus-/Hostingkarten fallback-sicher behandeln.

### M10 - Recurring Credits, Bad Publicity, Charge, Mark, Dividends und Spezialressourcen

Ziel:

Weitere offizielle Counter-/Token-Familien in einem einheitlichen Modell aufnehmen.

Umfang:

- Recurring Credits mit Refresh-Zeitpunkt und zweckgebundener Nutzung.
- Bad Publicity als Corp-Counter mit Runner-Credit während Runs.
- Charge, Mark und Dividends nur nach konkreter Kartenkandidatenentscheidung.
- Agenda Counter und Power Counter als generische Karten-Counter.

Gate:

- Kostenrevalidierung kennt zweckgebundene Credits.
- Public/Private-Status jedes Counters ist spezifiziert.
- StateHash ändert sich bei Refresh und Verbrauch deterministisch.

### M11 - Prevention, Avoid, Interrupts und Replacement

Ziel:

Die komplexe Ereignisveränderung erst nach stabilen Effekten, Choices und Hidden-Info-Barrieren einführen.

Umfang:

- Event-Pipeline mit `would`, `prevent`, `avoid`, `replace`, `then resolve`.
- Deterministische Reihenfolge bei mehreren anwendbaren Effekten.
- Interrupt-Timing als eigener miniaturisierter Priority-Pfad.
- Prevention für Damage als erster Kandidat.
- Replacement für Access/Trash/Steal erst später.

Gate:

- Kein Effekt darf stillschweigend ein Event verändern.
- Jede Prevention/Replacement-Entscheidung ist im EventLog und Replay nachvollziehbar.
- Hidden-Info-Entscheidungen werden nur der berechtigten Seite angeboten.
- Unresolved Replacement-Mehrdeutigkeit ist ein Blocker, kein Fallback.

### M12 - Deckbuilding und Formatregeln vertiefen

Ziel:

Decks näher an echte Formate bringen, ohne öffentliche Plattformfunktionen zu bauen.

Umfang:

- Faction und Influence.
- Mindestdeckgröße und Agenda-Dichte.
- Maximal drei Kopien per Name plus explizite Ausnahmen.
- Formatprofile, Rotation und Banliste als lokale versionierte Daten.
- Private Import-/Export-Validierung.

Gate:

- Deckvalidierung bleibt deterministisch und serverseitig beim Matchstart revalidiert.
- Gegner sieht nur erlaubte Metadaten, keine Deckliste.
- Kein Formatprofil aktiviert Karten ohne Mechanik-Gate.

### M13 - Spezialmechaniken und Vollständigkeitsabschluss

Ziel:

Restmechaniken inventarisieren und entweder implementieren, stubben oder bewusst aus Scope nehmen.

Umfang:

- Extra Cards und Set Aside.
- Remove from Game.
- Ownership/Control-Wechsel.
- Typänderungen und Karten-zu-Counter-Effekte.
- Regions und Unique-Sonderregeln.
- Simultaneous Effects und Modal Abilities, falls nicht schon in M1/M11 ausreichend abgedeckt.

Gate:

- `MECHANICS_COVERAGE_MATRIX` hat keinen Status `unknown`.
- Jede bekannte Mechanik ist `implemented`, `simplified`, `deferred`, `blocked` oder `not_product_scope`.
- Jede `simplified`-Mechanik hat Removal Condition.

## 7. Empfohlene Versionierung

Die Mechanikphasen können als eigene V0.92+ Planung laufen oder nach V1.0 in V1.x-Microgates übergehen. Wichtig ist die Gate-Reihenfolge, nicht die konkrete Versionsnummer.

| Vorgeschlagenes Label | Phase | Empfehlung |
|---|---|---|
| V0.92 | M0 und M1 Requirements | Zuerst planen, kein Code. |
| V0.93 | M1 Implementation und M2 Requirements | Fundament grün bekommen. |
| V0.94 | M3 Damage | Erstes hohes Hidden-Info-Gate. |
| V0.95 | M4 Resources | Runner-Board vervollständigen. |
| V0.96 | M5 Trace/Link | Interaktive Corp/Runner-Choices. |
| V0.97 | M6 Run/Breach/Multiaccess | Run-Pfad deutlich vertiefen. |
| V0.98 | M7 Identity und M8 Manipulation | Echte Identities und Hidden-Zone-Tools. |
| V0.99 | M9/M10 Counter/Hosting/Virus | Breiter Kartenpool-Anschluss. |
| V1.0 oder V1.1 | M11/M12 Kernabschluss | Private stabile Plattform oder direkter Mechanikabschluss, je nach Produktentscheidung. |
| V1.x | M13 Restmechaniken | Vollständigkeits- und Spezialkartenphase. |

Wenn V1.0 schnell als private stabile Plattform erreicht werden soll, sollten vor V1.0 nur P0/P1-Mechaniken umgesetzt werden. P2/P3 kann danach in V1.x folgen.

## 8. Standard-Artefakte je Mechanik-Gate

Für jedes Gate `Mx` sollten vor Implementierung entstehen:

- `docs/derived/MECHANIC_Mx_REQUIREMENTS.md`
- `docs/derived/MECHANIC_Mx_SPEC.md`
- `docs/derived/MECHANIC_Mx_TEST_MATRIX.md`
- `docs/derived/MECHANIC_Mx_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-Mx.json`
- `data/deviations/rule-deviations-Mx.json`
- `data/manifests/card-implementation-manifest-Mx.json`
- `data/scenarios/mx-*.json`
- `tests/specs/mechanic-mx-acceptance-tests.todo.md`

Nach Implementierung:

- `docs/derived/MECHANIC_Mx_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MECHANIC_Mx_FINAL_REVIEW.md`
- aktualisierte Mechanik-Coverage-Matrix,
- aktualisierter Codex-Status,
- Wissensbasis-Update nur für wiederverwendbares Entscheidungs- und Statuswissen.

## 9. Test- und Gate-Pflichten

Jede Mechanik muss diese Gates bestehen:

- Unit-Tests für Kosten, Timing, Side, Ziele, Choices, illegale Actions und Invarianten.
- Szenario mindestens für Normalfall, illegalen Fall und Hidden-Info-Fall.
- Visibility-Leaktests für PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Errors, Logs, KI-Inputs und UI-Diagnostics.
- Replay-/StateHash-Test mit Seed, RandomCounter, RandomDrawRecords, RulesBaseline und Deck-Snapshot.
- KI-Smoke mit LegalActions-only und side-sicheren Reason-Codes.
- Multiplayer-Smoke mit stale action, idempotency, reconnect und Undo-Barrieren.
- Performance-Budget für `getLegalActions`, `applyAction`, `getPlayerView`, `hashState` und KI-Decision.
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`.

## 10. Mechanik-Coverage-Zielzustand

Am Ende der Mechanik-Komplettierung soll es eine maschinenlesbare Coverage geben, die mindestens diese Kategorien kennt:

| Kategorie | Beispiele | Zielstatus |
|---|---|---|
| Core Game | Setup, Mulligan, Turns, Clicks, Credits, Score, Win/Loss | implemented oder begründet simplified. |
| Card Types | Agenda, Asset, ICE, Identity, Operation, Upgrade, Event, Hardware, Program, Resource | implemented. |
| Runs | Approach, Encounter, Jack-out, Breach, Access, Multiaccess, Archives | implemented oder Teilgates dokumentiert. |
| Abilities | Paid, Triggered, Static, Conditional, Play, Subroutine, Modal | mindestens enginefähig für freigegebene Karten. |
| Hidden Info | Draw, Access, Search, Reveal, Expose, Random discard | tested with leak gates. |
| Damage/Tags/Trace | Damage, Flatline, Tags, Link, Trace, Bidding | implemented for common cases. |
| Object Relations | Hosting, hosted counters, ownership/control, set aside, remove from game | P2/P3 nach Kartenbedarf. |
| Event Modification | Prevention, Avoid, Interrupt, Replacement | implemented only after M11 gate. |
| Counter Families | Advancement, Virus, Power, Agenda, Bad Publicity, Recurring Credits, Core Damage, Charge, Mark, Dividends | implemented as needed, otherwise explicitly deferred. |
| Deckbuilding | Identity, faction, influence, min deck, agenda density, copies, formats | private local format profiles. |

Die wichtigste Abschlussregel: Es darf keine Karte `playable` oder `deck_legal` sein, deren benötigte Mechanik nicht in dieser Matrix mindestens `implemented` oder explizit `implemented_simplified` mit akzeptierter Abweichung ist.

## 11. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Zu viele Mechaniken gleichzeitig | Fehler sind nicht isolierbar. | Ein Gate pro Mechanikfamilie, kleine Testkarten. |
| Effect-Fundament wird übersprungen | Viele Sonderpfade, später schwer wartbar. | M1 vor Damage/Trace/Prevention. |
| Damage leakt Grip-Information | Fairnessbruch. | RandomDrawRecords, private payload audit, Undo-Barriere. |
| Multiaccess leakt R&D/HQ-Reihenfolge | Fairnessbruch. | Access-Queue, side-sichere Events, DOM-Leaktest. |
| Trace/Bidding erzeugt Race Conditions | Multiplayer-Divergenz. | ChoiceRequest mit StateVersion, Side, Idempotency. |
| Replacement/Prevention wird zu früh groß | Regelpipeline kollabiert. | Erst Damage-Prevention als enges Subgate. |
| KI nutzt FullState für neue Mechanik | Projektprinzip verletzt. | AI-Input-Contract-Tests je Mechanik. |
| Deckeditor schaltet mechanisch blockierte Karten frei | Ungedeckte Regeln im Match. | Matchstart revalidiert Mechanik-Coverage und Manifeststatus. |
| V0.91 Assets vermischen sich mit Match-State | Hidden-Info- oder StateHash-Problem. | Bilder bleiben reine lokale Anzeige-Artefakte. |

## 12. Nächster konkreter Planungsschritt

Aktueller Anschluss nach V0.93:

- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`

Der nächste empfohlene Gate-Schritt ist V0.94 Requirements Freeze für Damage/Flatline. V0.95 Resources folgt danach, sofern die Reihenfolge nicht ausdrücklich geändert wird.

Empfohlener nächster reiner Planungsprompt:

```text
Erstelle den Requirements-Freeze für M0/M1: Mechanik-Inventar und allgemeines Timing-/Ability-/Effect-Fundament. Nicht implementieren.

Lies:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/derived/MECHANICS_COMPLETION_PLAN.md
- docs/derived/DEVIATION_REGISTRY.md
- docs/derived/MVP_0.8_FINAL_REVIEW.md
- docs/derived/MVP_0.9_FINAL_REVIEW.md
- docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf

Erstelle:
- docs/derived/MECHANICS_COVERAGE_MATRIX.md
- docs/derived/MECHANIC_M1_REQUIREMENTS.md
- docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md
- docs/derived/MECHANIC_M1_TEST_MATRIX.md
- docs/derived/MECHANIC_M1_REQUIREMENTS_REVIEW.md

Regeln:
- Keine Engine-, UI-, Server-, KI- oder Testimplementierung.
- Mechanik-Coverage muss alte Deviations gegen den aktuellen V0.9-Stand normalisieren.
- Jede spätere Mechanik muss Abhängigkeiten, Risiko, Visibility-Gates und Testpflichten bekommen.
- Kein Kartentextparser und keine automatische Spielbarkeit durch Import.
```

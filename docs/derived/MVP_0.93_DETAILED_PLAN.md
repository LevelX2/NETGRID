# MVP 0.93 Detailed Plan - M1-Umsetzung und M2-Requirements

Status: detaillierte Planungsfassung, keine aktuelle Implementierung
Stand: 2026-05-03

## 1. Kurzentscheidung

V0.93 ist das technische Fundament-Gate nach V0.92. Es implementiert das allgemeine Timing-, Ability-, Effect-, Choice- und Eventklassifikationsmodell aus M1, ohne bereits Damage, Trace, Resources, Mulligan oder Multiaccess als neue Spielmechaniken freizuschalten.

Parallel dazu friert V0.93 die Requirements für M2 ein: Setup- und Spielende-Normalisierung. Die eigentliche M2-Implementierung folgt erst in einem späteren Gate.

## 2. Voraussetzungen

V0.93 startet nur, wenn:

- V0.92-Requirements und M1-Spezifikation abgeschlossen sind,
- `MECHANICS_COVERAGE_MATRIX.md` den aktuellen Mechanikstand normalisiert,
- alte V0.91-Assetänderungen entweder sauber abgeschlossen oder bewusst aus dem Mechanikbranch ausgeklammert sind,
- bestehende Tests vor Beginn reproduzierbar laufen oder bekannte Fremdfehler dokumentiert sind,
- der Zielbranch keine unbeabsichtigten Änderungen enthält.

## 3. Ziele

V0.93 soll:

- Effect-, Ability-, Timing- und Choice-Typen in Shared/Engine einführen,
- bestehende Resolver schrittweise hinter einen allgemeinen Effect-Vertrag bringen,
- bestehende Aktionen und UI-Payloads kompatibel halten,
- zentrale Eventklassifikation und Hidden-Info-Barrieren vorbereiten,
- PlayerViews, PublicEvents, WebSocket, Reconnect, Undo und AI-Input für neue optionale Choice-/Ability-Felder side-sicher machen,
- M2-Requirements für Mulligan, Siegwert, Deckout/Flatline-Vorbereitung, Identity-Setup und Archives-Modell erstellen.

## 4. Nicht-Ziele

V0.93 implementiert nicht:

- Damage oder Flatline-Ausführung,
- Trace oder Bidding,
- Runner-Resources,
- Mulligan im echten Matchablauf,
- Jack-out, Breach-Queue oder Multiaccess,
- Identitätsfähigkeiten als aktive Kartenmechanik,
- Prevention, Avoid, Interrupt oder Replacement,
- neue spielbare Karten,
- Deckbuilder-, Account-, Matchmaking- oder Plattformfunktionen.

## 5. Architekturstrategie

### 5.1 Kompatible Migration statt Big Bang

Die aktuelle Engine besitzt viele direkt verdrahtete Aktionen und Resolver. V0.93 soll diese nicht in einem riskanten Komplettumbau ersetzen. Stattdessen:

1. Neue Typen und optionale Felder hinzufügen.
2. Einen kleinen Effect-Command-Executor einführen.
3. Bestehende Resolver über Adapter an den Executor anbinden.
4. Breaker-, Rez-, Run- und Access-Verhalten regressionssicher halten.
5. Erst nach grünen Regressionen einzelne direkte Mutationspfade reduzieren.

Wichtig: Die Rules Engine bleibt die einzige Regelautorität. UI, Server, KI und menschliche Spieler reichen weiterhin nur `PlayerActions` ein, die aus `LegalActions` hervorgehen.

### 5.2 Shared Types

V0.93 sollte neue Typen additiv einführen. Bestehende Felder bleiben erhalten, damit UI und Tests nicht unnötig brechen.

Empfohlene Typgruppen:

| Typgruppe | Zweck |
|---|---|
| `EffectDefinition` | Deklarierter Ursprung eines Effekts mit Quelle, Timing, Kosten, Zielen, Choices und Steps. |
| `EffectStep` oder `EffectCommand` | Kleine deterministische Befehle, die State ändern dürfen. |
| `EffectContext` | Side, Quelle, Timingpunkt, StateVersion, RNG-Kontext und Zielauflösung. |
| `AbilityDefinition` erweitert | Paid, triggered, static, setup und spätere interrupt/replacement Kategorien. |
| `TimingWindowDefinition` | Erlaubte Fenster je Ability, begrenzt auf freigegebene Timingpunkte. |
| `CostRequirement` | Credits, Clicks, Tags, Counters, spätere Hosted/Recurring Credits. |
| `TargetRequirement` | Server, Karte, Zone, Subroutine oder Side mit Sichtbarkeitsprüfung. |
| `ChoiceRequest` | Serverseitige Auswahl, Side, Optionen, Min/Max, Source, StateVersion. |
| `PendingChoice` | Aktueller Choice-Zustand in `GameState`, side-gefiltert in `PlayerView`. |
| `EventVisibilityClass` | `public`, `private_to_side`, `hidden_info_barrier`, `replay_only`. |
| `ModifierDefinition` | Passive oder bedingte Modifikatoren für spätere Handlimit-, Link-, Strength- oder Cost-Effekte. |

Empfehlung:

- `GameState.pendingChoice` optional einführen.
- `PlayerView.pendingChoice` optional als gefilterte Sicht einführen.
- `LegalAction` optional um `targetRequirements`, `choiceRequirements`, `abilityRef` und `effectRef` erweitern.
- `PlayerAction.selectedChoices` weiterverwenden, aber in `applyAction` gegen `ChoiceRequest` validieren.

### 5.3 Engine-Dateistruktur

Der Umbau sollte klein beginnen. Empfehlenswerte Struktur:

| Datei | Rolle |
|---|---|
| `packages/engine/src/index.ts` | Orchestrierung und public API bleiben hier. |
| `packages/engine/src/effects.ts` | Effect Commands, Executor, Kosten- und Zielanwendung. |
| `packages/engine/src/abilities.ts` | Ability Registry und LegalAction-Erzeugung für Ability-basierte Effekte. |
| `packages/engine/src/choices.ts` | PendingChoice-Erzeugung, Sichtfilter, Revalidierung. |
| `packages/engine/src/event-visibility.ts` | zentrale Klassifikation und Payload-Filter, falls die Logik zu groß für `index.ts` wird. |

Wenn der erste Umsetzungsthread feststellt, dass die Extraktion zu viel Risiko erzeugt, darf er mit internen Hilfsfunktionen in `index.ts` starten und erst nach grünen Tests auslagern.

### 5.4 Effect Commands

V0.93 braucht nur Commands, die bestehendes Verhalten abdecken oder M1 absichern.

Empfohlener Startumfang:

- Credits gewinnen oder ausgeben.
- Karte ziehen.
- Karte installieren.
- Event oder Operation resolven.
- Karte rezzed setzen.
- Agenda advancen und scoren.
- Run starten, fortsetzen und beenden.
- ICE-Subroutine auflösen.
- Breaker Strength ändern.
- Subroutine brechen.
- Karte accessen, stehlen, trashen oder Trash ablehnen.
- Tag geben oder entfernen.
- Event mit Visibility-Klasse erzeugen.
- PendingChoice setzen oder abschließen.

Noch nicht in V0.93:

- zufälliger Grip-Trash,
- Trace-Bids,
- Multiaccess-Queue,
- Replacement/Prevention-Ketten,
- Hosting-Beziehungen,
- neue Counterfamilien außer bestehenden Advancement-/Tag-/Memory-/Strength-Werten.

### 5.5 Ability-Strategie

V0.93 sollte die vorhandenen Breaker-Fähigkeiten als Pilot nutzen:

- Pump und Break werden intern als Ability-Definitionen modelliert.
- Die daraus erzeugten LegalActions können weiterhin `pump_breaker` und `break_subroutine` heißen.
- Action IDs bleiben aus Side, Action Type, Source und Payload deterministisch ableitbar.
- Kosten und Ziele werden nicht nur beim LegalAction-Bau, sondern erneut in `applyAction` geprüft.

Generische `trigger_ability`-Actions sollten erst dann sichtbar eingesetzt werden, wenn eine Fähigkeit nicht sinnvoll über bestehende Action Types ausdrückbar ist. Der Typ kann vorbereitet werden, aber V0.93 sollte keine UI-Migration erzwingen.

### 5.6 Timing-Strategie

V0.93 definiert nur freigegebene Timingfenster:

- Corp Action Main.
- Runner Action Main.
- Run Approach ICE.
- Run Encounter ICE.
- Access Resolve Card.
- Game Checkpoint.

Bezahlte Fähigkeiten werden nur in den Fenstern angeboten, die ihre Ability-Definition explizit erlaubt. Keine Seite erhält allgemeine Priorität, wenn kein konkreter LegalAction-Eintrag existiert.

### 5.7 Choice-Strategie

ChoiceRequest wird als technische Grundlage eingeführt, ohne neue sichtbare Mechanik zu aktivieren.

Pflichtverhalten:

- `pendingChoice` blockiert alle Aktionen, die nicht zur Choice passen.
- Falsche Side, falsche `choiceId`, falsche `stateVersion`, ungültige Optionen und zu viele/zu wenige Optionen werden abgelehnt.
- PlayerViews zeigen nur Choices der berechtigten Side.
- PublicEvents nennen keine versteckten Optionen.
- Replay erhält die vollständige private Entscheidung.
- Undo nach Hidden-Info-Choice wird blockiert.

Teststrategie:

- Unit-Tests dürfen synthetische Choice-Zustände direkt erzeugen.
- Keine neue spielbare Karte nur zum Testen von Choices einführen.
- Server- und AI-Smokes prüfen nur, dass optionale Choice-Felder nicht leaken und nicht crashen.

### 5.8 Event- und Hidden-Info-Strategie

V0.93 soll Eventklassifikation zentralisieren, ohne das Eventlog unnötig umzuschreiben.

Pflichtregeln:

- `public` darf in PublicEvents erscheinen.
- `private_to_side` wird nur der berechtigten Side gezeigt.
- `hidden_info_barrier` blockiert Undo und erzeugt nur zulässige öffentliche Zusammenfassung.
- `replay_only` bleibt aus PlayerViews und PublicEvents heraus.
- Server, WebSocket, Reconnect, AI und Fehlertexte verwenden dieselbe Filterlogik oder dieselben Datenverträge.

Bestehende private Replay-Payloads dürfen erhalten bleiben, solange öffentliche Payloads side-sicher bleiben.

## 6. Umsetzungsschritte

### Phase 0 - Preflight

- V0.92-Artefakte lesen und Gate-Status prüfen.
- Arbeitsbranch anlegen oder bestätigen.
- Dirty Worktree dokumentieren und fremde Änderungen nicht anfassen.
- Baseline-Tests ausführen oder bekannte Fremdfehler notieren.

Gate:

- Der Umsetzungsthread weiß, welche Dateien ihm gehören.
- Keine V0.91-Assetarbeit wird versehentlich mitcommitted.

### Phase 1 - Shared Contracts

- Neue Shared Types additiv ergänzen.
- Baseline-/Manifestdaten nur aktualisieren, wenn vorhandene Projektkonventionen das verlangen.
- Alte Types nicht entfernen.
- Serialization-Kompatibilität für PlayerView, PublicEvent und Replay prüfen.

Gate:

- Typecheck zeigt keine neuen Brüche.
- Bestehende JSON-/Scenario-Artefakte bleiben lesbar.

### Phase 2 - Choice-Grundlage

- `GameState.pendingChoice` und gefilterte `PlayerView.pendingChoice` einführen.
- `applyAction` um Choice-Revalidierung erweitern.
- Helper für Choice-Actions, Choice-Abschluss und Choice-Abbruch ergänzen.
- Unit-Tests für Side, StateVersion, Optionengrenzen und Stale Choice schreiben.

Gate:

- Ohne `pendingChoice` verhalten sich bestehende Spiele unverändert.
- Mit `pendingChoice` gibt es keine Side- oder Payload-Leaks.

### Phase 3 - Effect Executor

- Effect Command Union und Executor einführen.
- Kleine Commands zuerst: Credits, Draw, Tags, Strength, Break, Run-Status, Eventklassifikation.
- Bestehende Mutation bleibt dort, wo der Command noch nicht sauber passt.
- Eventausgabe und StateHash nach jedem migrierten Pfad prüfen.

Gate:

- Bestehende Kernaktionen bestehen als Regression.
- Kein Command kann verdeckte Daten direkt in öffentliche Payloads schreiben.

### Phase 4 - Ability Registry

- Breaker Pump und Break als Pilot-Ability registrieren.
- LegalAction-Erzeugung weiterhin kompatibel halten.
- Kosten, Timing und Ziele in Generator und `applyAction` doppelt validieren.
- Optional einfache passive Modifier-Struktur vorbereiten, aber keine neue Karte damit aktivieren.

Gate:

- Pump/Break-Szenarien sind unverändert spielbar.
- Illegale Breaker-Ziele und falsche Timingpunkte werden abgelehnt.

### Phase 5 - Resolver-Adapter

- Runner-Events, Corp-Operations und rezzed Root-Fähigkeiten adapterfähig machen.
- ICE-Subroutinen schrittweise als Commands ausdrücken.
- Keine semantische Erweiterung: dieselben Karten tun nach außen dasselbe wie vorher.

Gate:

- Play Event/Operation, Tag-Punishment, Rez, Access, Steal und Trash bleiben grün.
- AI-Profile wählen keine illegalen neuen Ability-Aktionen.

### Phase 6 - Eventklassifikation und Undo-Barrieren

- Sichtbarkeitsklassen in Events oder Effect Results führen.
- Bestehende Hidden-Info-Pfade, insbesondere HQ Access und Random Draw, an die Klassifikation anbinden.
- Undo-Barrieren aus Klassifikation statt aus verstreuter Sonderlogik ableiten, sofern risikoarm.

Gate:

- Visibility-Vertrag bleibt erfüllt.
- Multiplayer-Reconnect und Undo-Preview zeigen keine neuen Details.

### Phase 7 - M2-Requirements erstellen

Neue Requirements- und Testartefakte für Setup/Game-End:

- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_REQUIREMENTS.md`
- `docs/derived/MVP_0.93_TEST_MATRIX.md`
- `docs/derived/MVP_0.93_REQUIREMENTS_REVIEW.md`

M2-Scope:

- Mulligan als deterministischer Choice-Schritt nach initialem Draw.
- 7-Punkte-Sieg als Standard für neue Formate, Legacy-Demo-Decks dürfen weiter 6 nutzen, wenn Baseline und Tests das dokumentieren.
- Runner-Deckout als vorbereitete Win Condition.
- Flatline-Endzustand als Vorbereitung für Damage.
- Start-of-game-Identity-Fähigkeiten als streng begrenzte Setup-Kategorie.
- Archives/facedown-Modell reviewen, bevor Archives-Karten oder Multiaccess erweitert werden.

Gate:

- M2 wird nur spezifiziert, nicht implementiert.
- V0.94-Damage kann später auf einem klaren Game-End-Vertrag aufsetzen.

### Phase 8 - Final Review

- `docs/derived/MVP_0.93_IMPLEMENTATION_REVIEW.md` erstellen.
- `docs/derived/MVP_0.93_FINAL_REVIEW.md` erstellen.
- Status- und Wissensbasis nur mit belastbaren, abgeschlossenen Erkenntnissen aktualisieren.
- Alle Gates aus V0.92-Testmatrix abhaken oder Blocker dokumentieren.

## 7. Testplan

Mindestlauf für V0.93:

- Typecheck.
- Engine-Unit-Tests.
- Engine-Szenarien mit bestehenden StateHashes.
- Visibility-Vertrag.
- Replay deterministisch.
- Stale Action und illegal Action Tests.
- Choice-spezifische Unit-Tests.
- Server-/Multiplayer-Smokes für PlayerView, PublicEvents, WebSocket, Reconnect und Undo.
- AI-Smokes für alle Profile gegen neue LegalAction-Felder.
- Build nur, wenn UI-/Shared-Type-Änderungen die Web-App berühren.

StateHash-Regel:

- Rebaselines sind nur erlaubt, wenn die Event- oder Stateform bewusst und dokumentiert geändert wurde.
- Rebaselines dürfen nie Hidden-Info-Leaks maskieren.
- Wo möglich, bestehende StateHashes erhalten.

## 8. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Zu großer Engine-Umbau bricht bestehende Partien. | Additive Typen, Adapterpfad, Breaker-Pilot, kleine Phasen. |
| UI bricht durch neue Action Types. | Bestehende Action Types sichtbar beibehalten, generische Ability intern vorbereiten. |
| ChoiceRequest leakt Optionen oder verdeckte Karten. | Side-gefilterte PlayerView, zentrale Choice-Serializer, negative Tests. |
| Eventklassifikation verändert Replay/StateHash unkontrolliert. | Rebaselines nur mit Review; alte Szenarien zuerst schützen. |
| M2 rutscht in Implementierung. | V0.93-M2 nur Requirements, kein Mulligan-Code. |
| AI nutzt neue Felder falsch. | Unknown-Ability-Fallback und LegalActions-only-Smokes. |

## 9. Definition of Done

V0.93 ist fertig, wenn:

- M1-Shared- und Engine-Verträge implementiert sind,
- bestehende Spielmechaniken unverändert oder dokumentiert rebaselined funktionieren,
- Choices generisch validierbar und side-sicher sichtbar sind,
- Ability-basierte Pilotpfade doppelt revalidiert werden,
- Eventklassifikation Hidden-Info-Barrieren vorbereitet,
- alle Tests aus der V0.92-Matrix bestehen oder Blocker explizit dokumentiert sind,
- M2-Requirements vollständig genug für das nächste Gate sind,
- keine Mechanik aus V0.94+ versehentlich spielbar wurde.

# MVP 0.93 Requirements

Status: eingefroren und umgesetzt
Stand: 2026-05-03

## Ziel

V0.93 setzt das in V0.92 eingefrorene M1-Fundament für Effects, Abilities, Timing, Choices und Eventklassifikation um. Die Phase bleibt additiv: bestehende öffentliche Action Types, UI-Payloads und Spielerabläufe bleiben kompatibel. M2 wird nur als Requirements-Scope für Setup und Spielende dokumentiert.

## M1 Must Requirements

| ID | Anforderung | Abdeckung |
|---|---|---|
| M093-M1-SHARED-001 | Shared muss additive Typen für `EffectDefinition`, `EffectCommand`, `AbilityRef`, `CostRequirement`, `ChoiceRequest`, `PendingChoice`, `ChoiceRequirement` und `EventVisibilityClass` bereitstellen. | Typecheck Shared/Engine/Server/AI |
| M093-M1-EFFECT-001 | Die Engine muss einen deterministischen Effect-Command-Executor für Credits, Draw, Tags, Breaker Strength, Subroutine-Break und PendingChoice-Grundoperationen bereitstellen. | Engine Unit Tests |
| M093-M1-EFFECT-002 | Der Executor darf keine öffentlichen Events direkt mit verdeckten Daten schreiben; Event-Emission bleibt in V0.93 nur vorbereitet. | Engine Unit Tests, Review |
| M093-M1-ABILITY-001 | Breaker Pump/Break müssen intern Ability-Metadaten (`abilityRef`, `effectRef`, Targets) tragen. | Engine Unit Tests |
| M093-M1-ACTION-001 | Öffentliche Action Types für Breaker bleiben `pump_breaker` und `break_subroutine`; generische `trigger_ability` wird nicht sichtbar freigeschaltet. | Engine Regression |
| M093-M1-CHOICE-001 | `pendingChoice` muss additiv in `GameState` und side-gefiltert in `PlayerView` verfügbar sein. | Engine/Server Tests |
| M093-M1-CHOICE-002 | `applyAction` muss Choice-Side, `choiceId`, `stateVersion`, Optionsmenge und Auswahlanzahl revalidieren. | Engine Unit Tests |
| M093-M1-VISIBILITY-001 | PublicEvents müssen eine zentrale `visibilityClass` tragen können. Hidden-Info-Barrieren werden über diese Klassifikation erkannt. | Engine/Server Tests |
| M093-M1-REPLAY-001 | Replay und StateHash müssen mit den neuen optionalen State-/Eventschema-Feldern deterministisch bleiben. | Engine Replay Tests |
| M093-M1-MP-001 | Bootstrap, WebSocket und Reconnect müssen `pendingChoice` side-sicher serialisieren. | Server Tests |
| M093-M1-AI-001 | AI-Input bleibt LegalActions-/PlayerView-only und darf neue Choice-/Ability-Felder nicht als FullState-Ersatz nutzen. | AI Tests |
| M093-M1-NOSCOPE-001 | V0.93 darf keine Damage-, Trace-, Resource-, Mulligan-, Multiaccess-, Identity-Ability- oder Prevention-Mechanik spielbar machen. | Testmatrix, Review |

## M2 Requirements Only

| ID | Anforderung | Status |
|---|---|---|
| M093-M2-SETUP-001 | Setup muss als deterministische Sequenz spezifiziert werden: Identitäten, Decks, Shuffle, Initial Draw, Mulligan-Choice, Startseite, Startwerte. | Spezifiziert |
| M093-M2-MULLIGAN-001 | Mulligan wird als `PendingChoice`-basierter Schritt spezifiziert, aber nicht implementiert. | Spezifiziert, nicht spielbar |
| M093-M2-WIN-001 | 7 Punkte werden als neuer Standard für neue Formate dokumentiert; Legacy-Demo-Zielwerte bleiben baseline-gebunden. | Spezifiziert |
| M093-M2-DECKOUT-001 | Runner-Deckout wird als vorbereitete Game-End-Regel aufgenommen, ohne neue Damage- oder Draw-Zwangsmechanik zu aktivieren. | Spezifiziert |
| M093-M2-FLATLINE-001 | Flatline wird als zukünftiger Game-End-Zustand vorbereitet, aber Damage bleibt gesperrt. | Spezifiziert |
| M093-M2-IDENTITY-001 | Start-of-game-Identity-Fähigkeiten werden als Setup-Kategorie beschrieben, aber nicht spielbar gemacht. | Spezifiziert |
| M093-M2-ARCHIVES-001 | Archives/facedown wird vor Archives-Access und Multiaccess fachlich reviewt. | Spezifiziert |

## Gate Requirement

| ID | Anforderung |
|---|---|
| M093-GATE-001 | V0.93 ist erst abgeschlossen, wenn M1 implementiert, M2 nur spezifiziert, Reviews erstellt, Tests ausgeführt und offene Grenzen dokumentiert sind. |

## V0.91 Asset-Entscheidung

Private lokale Kartenscans und lokale Kartenbilder sind für dieses private lokale Projekt nur als Anzeige-Artefakte erlaubt. Sie bleiben außerhalb von Engine, KI, GameState, Replay, StateHash, PublicEvents und Logs. Öffentliche Distribution, offizielle Logos, standalone Card Frames, Card Backs und externe Kartendatenbank-Abhängigkeiten bleiben ausgeschlossen.

## Nicht-Ziele

- Keine neue spielbare Karte.
- Keine V0.94+-Mechanik.
- Kein Mulligan im Matchablauf.
- Keine Trace-, Damage-, Resource-, Prevention-, Identity-Ability- oder Multiaccess-Freischaltung.
- Keine öffentlichen Plattformfunktionen.

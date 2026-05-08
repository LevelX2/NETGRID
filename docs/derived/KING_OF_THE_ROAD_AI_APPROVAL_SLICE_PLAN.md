# King of the Road AI Approval Slice Plan

Stand: 2026-05-08
Status: geplant, nicht requirements-gefroren

## Ziel

Dieser Slice beschreibt die kleinste saubere Freigabe, um das lokale Runner-Deck `King of the Road` als Runner-KI-Deck nutzbar zu machen.

Das Ziel ist nicht, alle privaten O:NR-Karten pauschal fuer die KI freizugeben. Freigegeben wird nur ein konkreter validierter Runner-Snapshot, nachdem jede enthaltene Karte `ai_supported` ist und die Runner-KI den Deckplan ohne Hidden-Info-Zugriff, illegale Aktionen oder Haenger spielen kann.

## Ausgangslage

Lokale Deckbibliothek:

- Deck: `King of the Road`
- Deck-ID: `local_runner_adb10896`
- Seite: Runner
- Formatprofil: `local-demo-v0.8`
- Aktueller Validierungsstand: gueltig fuer menschlichen Matchstart
- Aktueller Snapshot beim Validieren: `local_runner_adb10896_snapshot_v0_6`

Aktuelle Blocker:

- Alle Karten im Deck sind `human_playable` und `deck_legal`.
- Keine Karte im Deck ist derzeit `ai_supported`.
- Keine Karte im Deck hat derzeit AI-Hints in `data/ai/ai-card-hints-1.3.1.json`.
- Ein KI-Teilnehmer benoetigt aktuell ein vollstaendig KI-sicheres Runner-/Korp-Deckpaar. Fuer den Korp-Slot soll in diesem Slice der bestehende KI-sichere Standardsnapshot `demo_corp_008_snapshot_v0_8` verwendet werden; das lokale Korp-Deck `Neues Korp-Deck` ist nicht Teil dieses Runner-KI-Slices.

## Quellenbasis

- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/CARD_DATA_PIPELINE_1_3_1_SPEC.md`
- `docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md`
- `docs/derived/V1_4_1_PLAN_BASED_RUNNER_AI_DETAILED_PLAN.md`
- `data/ai/ai-card-hints-1.3.1.json`
- `data/ai/ai-deck-pool-1.0.1.json`
- lokale Datei-Deckbibliothek unter `%APPDATA%\NetGrid\Decks`

## Deck-Audit

| Karte | Menge | Typ | Aktueller Status | Slice-Bedarf |
| --- | ---: | --- | --- | --- |
| Black Dahlia | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Cyfermaster | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Loony Goon | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Raffles | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Raptor | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Shaka | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Tinweasel | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Wild Card | 1 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Wizard's Book | 2 | program | human-only | AI-Hint, Rig-/Breaker-Bewertung, Szenario |
| Bodyweight Synthetic Blood | 2 | event | human-only | AI-Hint, Economy-/Recovery-Bewertung, Szenario |
| Jack 'n' Joe | 2 | event | human-only | AI-Hint, Draw-/Setup-Bewertung, Szenario |
| Livewire's Contacts | 2 | event | human-only | AI-Hint, Economy-/Setup-Bewertung, Szenario |
| Score! | 2 | event | human-only | AI-Hint, Run-/Pressure-Bewertung, Szenario |
| WuTech Mem Chip | 1 | hardware | human-only | AI-Hint, Memory-/Rig-Bewertung, Szenario |

## Scope

1. **Preflight**
   - Lokales Deck aus der Datei-Deckbibliothek lesen.
   - Deck validieren und Snapshot deterministisch erzeugen.
   - Kartenliste gegen Runtime-Katalog, Card-Support-Manifest und AI-Hints pruefen.
   - Blockerliste erzeugen: fehlende AI-Hints, fehlende Szenarien, fehlender `ai_supported` Status.

2. **AI-Hints fuer Deckkarten**
   - Fuer jede Deckkarte einen AI-Hint mit `roles`, `planRoles`, `requiredMechanics`, `valueHints`, `riskTags` und `fallbackPolicy`-naher Einordnung ergaenzen.
   - Programm-Karten auf Runner-Rig, Breakerrolle, MU, Installationswert und Run-Pressure mappen.
   - Event-Karten auf Economy, Draw, Setup, Run-Pressure oder Recovery mappen.
   - WuTech Mem Chip auf Memory-/Rig-Aufbau mappen.

3. **Kartenstatus-Freigabe**
   - `ai_supported` erst setzen, wenn AI-Hints, SzenarioRefs und KI-Smokes vorhanden sind.
   - Statusketten validieren: `ai_supported` setzt `human_playable` voraus.
   - AI-Hints duerfen keine Karte allein freigeben.

4. **Runner-KI-Szenarien**
   - `build_rig`: KI installiert sinnvolle Programme und Memory-Unterstuetzung.
   - `recover_economy`: KI spielt Economy-Events statt schlechter Runs.
   - `draw_for_answers`: KI zieht oder spielt Draw, wenn Rig fehlt.
   - `pressure_rnd` oder `safe_probe_run`: KI startet nur vertretbare Runs aus LegalActions.
   - Negativfixture: KI laeuft nicht sinnlos in sichtbare sichere End-the-Run-Lagen.

5. **DecisionDebug- und Hidden-Info-Gate**
   - DecisionDebug nennt sichtbare Gruende und Unsicherheit, aber keine verdeckten Korp-Karten.
   - Runner-KI nutzt nur Runner-PlayerView, LegalActions, side-gefilterte PublicEvents, eigene AI-Hints und erlaubte Public Metadata.
   - Hidden-State-Invariance fuer gleiche sichtbare Projektionen pruefen.

6. **Snapshot- und Deckpool-Entscheidung**
   - Einen versionierten Snapshot fuer `King of the Road` erzeugen, z. B. `king_of_the_road_runner_ai_snapshot_v1`.
   - Fuer explizit gewaehlte Runner-KI-Decks reicht ein validierter Snapshot mit vollstaendig `ai_supported` Karten.
   - Fuer deterministisch zufaellige Runner-KI-Auswahl muss der Snapshot zusaetzlich in `data/ai/ai-deck-pool-1.0.1.json` oder einem Nachfolgeartefakt stehen.
   - Korp-Paarung fuer den KI-Teilnehmer bleibt `demo_corp_008_snapshot_v0_8`, bis ein eigener Korp-KI-Deckslice geplant wird.

## Nicht-Ziele

- Keine Freigabe des lokalen Korp-Decks `Neues Korp-Deck`.
- Keine pauschale Freigabe aller O:NR-v1-Karten.
- Keine neuen Mechaniken.
- Kein Belief State, keine FullState-Simulation und kein Selfplay-Tuning.
- Kein Kartentextparser.
- Keine offiziellen Assets, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhaengigkeiten.
- Keine Public-Plattformfunktionen.

## Erwartete Umsetzungsartefakte

- AI-Hints-Erweiterung fuer die 14 eindeutigen Deckkarten.
- Card-Support-/Pipeline-Statusaenderung fuer genau diese Karten, sofern Gates bestanden sind.
- Versionierter Runner-Snapshot fuer `King of the Road`.
- Runner-KI-Smoke-/Szenariodaten fuer Rig-Aufbau, Economy, Draw, Run-Pressure und Negativlauf.
- Testabdeckung in `packages/ai`, `packages/catalog`, `packages/decks` und `apps/server`.
- Implementation Review, z. B. `docs/derived/KING_OF_THE_ROAD_AI_APPROVAL_IMPLEMENTATION_REVIEW.md`.
- Optional: Final Review, wenn der Slice als eigenes Gate abgeschlossen wird.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| KOTR-AI-T001 | Deckvalidierung | `King of the Road` validiert als Runner-Snapshot. |
| KOTR-AI-T002 | Statusketten | Jede Deckkarte ist `human_playable`; `ai_supported` nur mit AI-Hint und SzenarioRef. |
| KOTR-AI-T003 | AI-Hints | Jede Deckkarte hat Rollen, Planrollen, Mechaniken, ValueHints und RiskTags. |
| KOTR-AI-T004 | Runner-KI Build Rig | KI bevorzugt sinnvollen Rig-Aufbau, wenn Programme/Memory verfuegbar sind. |
| KOTR-AI-T005 | Runner-KI Economy/Draw | KI nutzt Economy-/Draw-Events in passenden Low-Credit-/Low-Setup-Lagen. |
| KOTR-AI-T006 | Runner-KI Run Pressure | KI startet nur LegalAction-basierte vertretbare Runs. |
| KOTR-AI-T007 | Negativlauf | KI vermeidet definierte schlechte Runs in sichtbare sichere Stopper. |
| KOTR-AI-T008 | Hidden Info | Kein verdeckter Korp-Titel in KI-Input, DecisionDebug, Logs, WebSocket oder Fehlern. |
| KOTR-AI-T009 | Matchstart | Human-Korp-vs-Runner-KI startet mit King-of-the-Road-Snapshot und Standardsnapshot fuer Korp-Paarung. |
| KOTR-AI-T010 | Regression | Bestehende Standard-KI-Decks und seeded-random Auswahl bleiben gruen. |

## Gate-Kriterien

Der Slice ist abgeschlossen, wenn:

- alle 14 eindeutigen Deckkarten `ai_supported` sind,
- alle 14 Karten AI-Hints mit SzenarioRefs haben,
- ein versionierter `King of the Road` Runner-Snapshot existiert,
- Human-Korp-vs-Runner-KI mit diesem Runner-Snapshot startet,
- Runner-KI-Smokes fuer Rig, Economy, Draw und Run-Pressure bestehen,
- Hidden-Info-, DecisionDebug-, Replay-/StateHash- und Matchstart-Regressionen gruen sind,
- die Freigabe dokumentiert ist.

## Umsetzungsempfehlung

Den Slice nicht als schnelle Datenumstellung durchfuehren. Zuerst nur den Preflight und die Requirements einfrieren. Danach in einem getrennten Umsetzungsschritt AI-Hints, Status, Snapshot und Tests gemeinsam aendern. Wenn eine Karte im Deck keine stabile strategische KI-Bewertung bekommt, bleibt der ganze Deck-Snapshot nicht KI-freigegeben oder die Karte wird in einem separaten menschlichen Deck belassen.


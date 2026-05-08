# V1.4.2 to V1.6.0 Implementation Handoff

Stand: 2026-05-08
Status: bereit für spätere Folgeumsetzung

## Zweck

Dieses Handoff fasst die Planung für die nächsten vier Release-Schritte nach V1.4.1 zusammen. Es ist der empfohlene Einstiegspunkt für spätere Umsetzungsthreads.

## Reihenfolge

1. V1.4.2 Belief State und Gegner-Modell.
2. V1.4.3 Simulation, Selfplay und Exploit-Regression.
3. V1.5.0 Private Replay, Analyse und Lernhilfe.
4. V1.6.0 Tutorial und Regelhilfe.

Die Reihenfolge ist hart:

- V1.4.2 darf erst nach grünem V1.4.1-Final-Gate starten.
- V1.4.3 darf erst nach grünem V1.4.2-Final-Gate starten.
- V1.5.0 darf erst nach grünem V1.4.3-Final-Gate starten.
- V1.6.0 darf erst nach grünem V1.5.0-Final-Gate starten.

## Verbindliche Artefakte

### Gemeinsame Prüfung

- `docs/derived/V1_4_2_TO_V1_6_0_PLANNING_REVIEW.md`

### V1.4.2

- `docs/derived/V1_4_2_BELIEF_STATE_OPPONENT_MODEL_DETAILED_PLAN.md`
- `docs/derived/V1_4_2_REQUIREMENTS.md`
- `docs/derived/BELIEF_STATE_OPPONENT_MODEL_1_4_2_SPEC.md`
- `docs/derived/V1_4_2_TEST_MATRIX.md`
- `docs/derived/V1_4_2_REQUIREMENTS_REVIEW.md`

### V1.4.3

- `docs/derived/V1_4_3_SIMULATION_SELFPLAY_EXPLOIT_REGRESSION_DETAILED_PLAN.md`
- `docs/derived/V1_4_3_REQUIREMENTS.md`
- `docs/derived/SIMULATION_SELFPLAY_EXPLOIT_REGRESSION_1_4_3_SPEC.md`
- `docs/derived/V1_4_3_TEST_MATRIX.md`
- `docs/derived/V1_4_3_REQUIREMENTS_REVIEW.md`

### V1.5.0

- `docs/derived/V1_5_0_PRIVATE_REPLAY_ANALYSIS_LEARNING_DETAILED_PLAN.md`
- `docs/derived/V1_5_0_REQUIREMENTS.md`
- `docs/derived/PRIVATE_REPLAY_ANALYSIS_LEARNING_1_5_0_SPEC.md`
- `docs/derived/V1_5_0_TEST_MATRIX.md`
- `docs/derived/V1_5_0_REQUIREMENTS_REVIEW.md`

### V1.6.0

- `docs/derived/V1_6_0_TUTORIAL_RULE_HELP_DETAILED_PLAN.md`
- `docs/derived/V1_6_0_REQUIREMENTS.md`
- `docs/derived/TUTORIAL_RULE_HELP_1_6_0_SPEC.md`
- `docs/derived/V1_6_0_TEST_MATRIX.md`
- `docs/derived/V1_6_0_REQUIREMENTS_REVIEW.md`

## Wichtigste Entscheidungen

- Die vier Releases werden nicht als ein großes Implementierungsbundle umgesetzt.
- V1.5.x und V1.6.x werden für die nächste Umsetzung als V1.5.0 und V1.6.0 konkretisiert.
- `rnd_access_freshness` wird in V1.4.2 aufgenommen.
- Deck-Legal AI Approval Batch B-G bleibt außerhalb dieser vier Releases.
- Keine neuen Karten, Mechaniken, offiziellen Assets oder Public-Plattformfunktionen werden durch diese Planungen automatisch freigegeben.

## Harte Dauer-Gates

- Rules Engine bleibt einzige Regelautorität.
- KI, UI und Server reichen nur LegalActions-abgeleitete PlayerActions ein.
- `applyAction` revalidiert weiterhin vollständig.
- Hidden Info bleibt aus PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect, Undo-Previews, Logs, Fehlern, DOM und Exporten draußen.
- Replay, StateHash, Seed, RandomCounter und RandomDrawRecords bleiben deterministisch.
- KI darf mehr planen, simulieren oder erklären, aber nicht mehr wissen.
- LLM/API-Pfade dürfen keine Live-Regelakteure oder Action-Erzeuger sein.

## Umsetzungskern V1.4.2

1. Belief-State-Modell definieren.
2. Eventklassifikation und Invalidation bauen.
3. Corp- und Runner-Gegner-Modelle ergänzen.
4. `rnd_access_freshness` umsetzen.
5. DecisionDebug erweitern.
6. Undo/Reconnect/Reconstruction testen.
7. Hidden-State-Invariance beweisen.

## Umsetzungskern V1.4.3

1. Simulations-State-Isolation sichern.
2. hypothetische Welten aus Belief State erzeugen.
3. Benchmark-Profile und Holdout-Seeds versionieren.
4. KI-vs-KI-League lokal ausführen.
5. Exploit-Fixtures erzeugen.
6. Soak-/Benchmark-Reports erstellen.
7. Tuning nur mit Holdout-Gate akzeptieren.

## Umsetzungskern V1.5.0

1. Replay-Index und Metadaten redigiert laden.
2. Timeline mit StateHash-Prüfung anzeigen.
3. Runner-/Corp-/Local-Analysis-Perspektiven trennen.
4. DecisionDebug side-sicher im Replay kontextualisieren.
5. Export ohne Tokens, Sessions, Pfade und unzulässige Hidden Info.
6. Exploit-Kandidaten als Review-Vorschlag exportieren.

## Umsetzungskern V1.6.0

1. Tutorial-Szenarioformat definieren.
2. Kernlektionen anlegen.
3. LegalAction-basierte Hinweise rendern.
4. Regelhilfe-Glossar verwenden.
5. Tutorial-Replays StateHash-prüfen.
6. KI-Sparring ohne Hidden-Info-Vorteil.

## Ready-Status

| Release | ready_for_implementation | Bemerkung |
| --- | --- | --- |
| V1.4.2 | true_after_V1.4.1 | V1.4.1 ist laut Status bereits grün. |
| V1.4.3 | true_after_V1.4.2 | braucht Belief State. |
| V1.5.0 | true_after_V1.4.3 | braucht stabile Reports/Replays. |
| V1.6.0 | true_after_V1.5.0 | braucht private Replay-Grundlage. |

## Kopierbarer Folgeprompt

```text
Setze V1.4.2 Belief State und Gegner-Modell um. Beginne keine V1.4.3-, V1.5.0- oder V1.6.0-Arbeit.

Repository: C:\Projekte\Netrunner

Arbeite wiki-first und gemäß AGENTS.md. Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- docs/codex/CODEX_STATUS.md
- docs/derived/V1_4_2_TO_V1_6_0_IMPLEMENTATION_HANDOFF.md
- docs/derived/V1_4_2_BELIEF_STATE_OPPONENT_MODEL_DETAILED_PLAN.md
- docs/derived/V1_4_2_REQUIREMENTS.md
- docs/derived/BELIEF_STATE_OPPONENT_MODEL_1_4_2_SPEC.md
- docs/derived/V1_4_2_TEST_MATRIX.md
- docs/derived/V1_4_2_REQUIREMENTS_REVIEW.md

Implementiere nur V1.4.2:
- fairen Belief State aus PlayerView, LegalActions, side-gefilterten Events und Replay-Historie.
- Eventklassifikation und Hypothesen-Invalidation.
- Corp- und Runner-Gegner-Modelle.
- R&D access freshness ohne Hidden-Info-Zugriff.
- DecisionDebug mit Fakten, Hypothesen und Unsicherheit.
- Undo-/Reconnect-Rekonstruktion.

Nicht erweitern:
- keine Simulation oder Selfplay.
- keine Replay-Browser-UI.
- keine Tutorialfunktion.
- keine neuen Karten, Mechaniken oder KI-Deckfreigaben.
- kein Kartentextparser.
- kein FullState- oder Hidden-State-Zugriff.
- keine offiziellen Assets oder Public-Plattformfunktionen.

Pflichtgates:
- Hidden-Info-Invariance.
- Replay/StateHash-Isolation.
- Undo/Reconnect-Memory-Rekonstruktion.
- R&D freshness Negativ- und Invalidation-Fixtures.
- No-Scope-Regression.
```

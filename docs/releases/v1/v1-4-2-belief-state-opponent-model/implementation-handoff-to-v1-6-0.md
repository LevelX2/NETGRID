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

- `docs/releases/v1/v1-4-2-belief-state-opponent-model/planning-review-to-v1-6-0.md`

### V1.4.2

- `docs/releases/v1/v1-4-2-belief-state-opponent-model/plan.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/requirements.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/spec.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/test-matrix.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/requirements-review.md`

### V1.4.3

- `docs/releases/v1/v1-4-3-simulation-selfplay-exploit-regression/plan.md`
- `docs/releases/v1/v1-4-3-simulation-selfplay-exploit-regression/requirements.md`
- `docs/releases/v1/v1-4-3-simulation-selfplay-exploit-regression/spec.md`
- `docs/releases/v1/v1-4-3-simulation-selfplay-exploit-regression/test-matrix.md`
- `docs/releases/v1/v1-4-3-simulation-selfplay-exploit-regression/requirements-review.md`

### V1.5.0

- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/plan.md`
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/requirements.md`
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/spec.md`
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/test-matrix.md`
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/requirements-review.md`

### V1.6.0

- `docs/releases/v1/v1-6-0-tutorial-rule-help/plan.md`
- `docs/releases/v1/v1-6-0-tutorial-rule-help/requirements.md`
- `docs/releases/v1/v1-6-0-tutorial-rule-help/spec.md`
- `docs/releases/v1/v1-6-0-tutorial-rule-help/test-matrix.md`
- `docs/releases/v1/v1-6-0-tutorial-rule-help/requirements-review.md`

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

Repository: C:\Projekte\NETGRID

Arbeite wiki-first und gemäß AGENTS.md. Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/implementation-handoff-to-v1-6-0.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/plan.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/requirements.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/spec.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/test-matrix.md
- docs/releases/v1/v1-4-2-belief-state-opponent-model/requirements-review.md

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

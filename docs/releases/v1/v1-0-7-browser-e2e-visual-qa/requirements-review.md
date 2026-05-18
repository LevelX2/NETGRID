# V1.0.7 Requirements Review - Browser-E2E und Visual QA

Stand: 2026-05-06
Status: reviewed

## Ergebnis

V1.0.7 ist als Browser-E2E- und Visual-QA-Release sinnvoll, konsistent und umsetzungsbereit vorbereitet.

Der Release ist bewusst kein Feature-Release. Er führt einen reproduzierbaren Browser-Gate für bestehende private V1.x-Flows ein und schließt damit die Lücke aus den bisherigen dokumentierten, aber überwiegend manuellen Browser-Smokes. Besonders wichtig ist der in V1.0.6 offen gebliebene schmale Viewport-Smoke.

## Geprüfte Artefakte

- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/plan.md`
- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/requirements.md`
- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/browser-e2e-visual-qa-spec.md`
- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/test-matrix.md`
- bisherige Smoke-Grundlagen:
  - `docs/releases/v1/v1-0-4-private-match-lifecycle/two-tab-smoke.md`
  - `docs/releases/v1/v1-0-5-action-board-ux/browser-playtest-smoke.md`
  - `docs/releases/v1/v1-0-6-ui-resource-clarity/browser-playtest-smoke.md`
  - `docs/releases/v1/v1-0-6-ui-resource-clarity/final-review.md`

## Konsistenzprüfung

| Bereich | Ergebnis | Begründung |
| --- | --- | --- |
| Scope | pass | V1.0.7 bleibt Qualitätsinfrastruktur und erweitert keine Karten, Regeln, Assets, Replay-/StateHash-Verträge oder Plattformfunktionen. |
| Reihenfolge | pass | Nach V1.0.4 bis V1.0.6 ist ein Browser-Gate folgerichtig, bevor weitere Storage-, Internet-, Karten- oder Mechanikbreite begonnen wird. |
| Testbarkeit | pass | Alle Must-Anforderungen haben eine Testspur in `V1_0_7_TEST_MATRIX.md`. |
| Hidden Info | pass | DOM-, Storage-, Payload-, Tooltip-, Bildpfad- und CSS-nahe Leak-Risiken sind explizit aufgenommen. |
| Viewports | pass | Desktop, Tablet und schmaler Viewport sind als Mindestmatrix festgelegt. |
| Werkzeugentscheidung | pass | Playwright ist empfohlen, aber ein gleichwertiger Automationspfad bleibt erlaubt, falls die Umsetzung technisch blockiert. |
| Aktuelle UI-Anpassungen | pass | Direkte Server-Run-Actions, breakergebundene Kontextaktionen und Stärke-Bonusmarke sind als QA-Ziele eingeordnet, nicht als neuer V1.0.7-Featureumfang. |

## Offene Designentscheidungen

Keine blockierenden Produktentscheidungen bleiben offen.

Die folgenden technischen Details dürfen in der Umsetzung entschieden werden:

- exakter Scriptname, z. B. `e2e` oder `test:e2e`,
- genaue Ordnerstruktur unter `tests/e2e`,
- ob Server/Web durch Playwright-Webserver-Konfiguration, eigene Harness-Skripte oder bestehende lokale Prozesse gestartet werden,
- konkrete technische Form der Runtime-Isolation,
- ob Screenshots nur bei Fehlern oder zusätzlich pro Flow erzeugt werden.

Diese Entscheidungen verändern den Produktumfang nicht und müssen im Implementation Review dokumentiert werden.

## Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| E2E-Flows werden durch Timer/Countdown/KI-Pacing fragil. | mittel | feste Seeds, kleine Flows, klare Wartebedingungen, getrennte Tests. |
| Testlauf verschmutzt lokale Runtime-Daten. | hoch | Must-Anforderung für isolierte Testlaufdaten. |
| Visual-QA wird zu spröde. | mittel | V1.0.7 nutzt Screenshots/Traces und Layout-Assertions, aber noch keine harten pixelgenauen Goldens. |
| Hidden-Info-Leaks entstehen nur in DOM-Attributen oder Bildpfaden. | hoch | explizite DOM-/Storage-/Payload-/Bildpfad-Leak-Scans. |
| V1.0.5 hat keine eigenen Finalartefakte. | niedrig | V1.0.7 prüft den aktuellen Workspace-Zustand und die vorhandenen V1.0.5/V1.0.6-Smokes; das ersetzt kein historisches V1.0.5-Finalreview, blockiert aber den Qualitätsrelease nicht. |

## Gate

`V1_0_7_requirements_freeze_done: true`

`ready_for_V1_0_7_implementation: true`

## Empfohlener nächster Umsetzungsprompt

```txt
Setze V1.0.7 Browser-E2E und Visual QA um.

Lies zuerst:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/plan.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/requirements.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/browser-e2e-visual-qa-spec.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/test-matrix.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/requirements-review.md
- docs/releases/v1/v1-0-4-private-match-lifecycle/two-tab-smoke.md
- docs/releases/v1/v1-0-5-action-board-ux/browser-playtest-smoke.md
- docs/releases/v1/v1-0-6-ui-resource-clarity/browser-playtest-smoke.md

Aufgabe:
Implementiere den reproduzierbaren Browser-E2E-/Visual-QA-Gate für V1.0.7. Nutze Playwright oder einen gleichwertigen Browser-Automationspfad. Keine neuen Karten, Mechaniken, offiziellen Assets, Replay-/StateHash-Änderungen oder Plattformfeatures. Behalte Testdaten isoliert und dokumentiere Gate-Befehl, Viewports, Screenshots/Traces, Leak-Scans und Restpunkte in Implementation Review und Final Review.
```

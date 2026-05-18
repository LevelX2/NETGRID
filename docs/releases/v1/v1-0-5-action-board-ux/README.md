# V1.0.5 Action Board UX

Status: migrated-requirements-family
Moved: 2026-05-18

## Zweck

Diese Familie bündelt die V1.0.5-Artefakte für Action Board UX und Board-Klarheit. Der Scope ist reine Präsentation: verständlichere Spieloberfläche, RunTimeline, Runner-Rig, zentrale Server, deutsche UI-Begriffe, side-sichere Rez-/Unrez-Darstellung, kontextuelle LegalActions, Gegneraktions-Cues und wiederholbare Browser-Smokes.

V1.0.5 erweitert keine Engine-Regeln, keinen Kartenpool, keine offiziellen Mechaniken, keine Replay-/StateHash-Verträge und keine öffentlichen Plattformfunktionen.

## Artefakte

| Datei | Rolle |
| --- | --- |
| `plan.md` | kanonischer Detailplan für Action Board UX und Board-Klarheit |
| `requirements.md` | eingefrorene Anforderungen und projektinternes UI-Glossar |
| `action-board-ux-spec.md` | Spezifikation für aktive Spieloberfläche, Cues, Audio, Action Panel und KI-Takt |
| `board-run-ui-spec.md` | Spezifikation für RunTimeline, Runner-Rig, zentrale Server, Counts, Archive-Sichtbarkeit und ICE-Ausrichtung |
| `test-matrix.md` | Testmatrix für UI-, Visibility-, Replay-/StateHash- und Browser-Smoke-Spuren |
| `requirements-review.md` | Requirements Review und Implementierungsfreigabe |
| `browser-playtest-smoke.md` | wiederholbarer manueller Browser-/Playtest-Smoke |

## Historische Grenze

Für V1.0.5 liegen keine eigenen formalen `implementation-review.md`- oder `final-review.md`-Artefakte vor. Spätere V1.0.6-Reviews dokumentieren, dass die nötige V1.0.5-UI-Basis im Workspace vorhanden war; das ersetzt aber kein rückwirkendes V1.0.5-Finalreview. Diese Lücke bleibt bewusst dokumentiert und wird in diesem Cleanup nicht künstlich nachgebaut.

## Nicht Enthalten

`V1.0.5K` ist ein separates Karten-Nachrelease und bleibt vorerst unter `docs/derived/`, bis der Karten-Nachrelease-Strang einen eigenen Linkaudit bekommt.

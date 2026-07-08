# Current-State-Docs-Cleanup Inventarreview 2026-07-08

Status: `first-wave-ready`
Datum: 2026-07-08
Primärer Agent: `release-implementation-agent`

## Zweck

Dieses Review fasst das maschinenlesbare Inventar `current-state-docs-cleanup-inventory-2026-07-08.json` zusammen und definiert die erste konservative Löschwelle.

## Scope

Geprüft wurden ausschließlich JSON-Dateien direkt unter `docs/reviews/ai/`.

Nicht geprüft oder nicht gelöscht in dieser Welle:

- Markdown-Reviewdateien;
- Release-, Architektur-, Source-, Data-, Scenario-, Manifest- und Runbook-Artefakte;
- referenzierte AI-Review-JSONs;
- Dateien mit Gate-, Final-, Readiness-, Cutover-, Contract-, Policy-, Removal-, Decision-, Requirements-, Spec-, Testmatrix- oder StateHash-Marker im Namen.

## Scanmethode

Referenzen wurden über relevante Projekttextdateien gesucht:

- Markdown, JSON, TypeScript, TSX, JavaScript, MJS, CJS, YAML, YML und TXT;
- Matchschlüssel: relativer Slash-Pfad, relativer Backslash-Pfad und Dateiname;
- AI-Review-JSONs selbst wurden als Referenzquelle ausgeschlossen, damit Rohdaten einander nicht gegenseitig konservieren.

## Ergebnis

| Klasse | Dateien | Größe |
| --- | ---: | ---: |
| `delete` | 13 | ca. 162,96 MB |
| `keep` | 73 | ca. 11,89 MB |
| `needs-review` | 234 | ca. 59,56 MB |
| `rollup-then-delete` | 39 | ca. 5,41 MB |

Die erste Löschwelle entfernt nur `delete`.

## Erste Löschwelle

Diese Dateien sind unreferenzierte große generierte AI-JSON-Evidence ohne geschützten Namensmarker:

| Größe | Datei |
| ---: | --- |
| 84,29 MB | `docs/reviews/ai/corp-scoring-remote-iterations-after-hq-relief-strategy-panel-15-2026-07-07.json` |
| 16,70 MB | `docs/reviews/ai/ai-selfplay-trace-mining-ad-summary.json` |
| 14,39 MB | `docs/reviews/ai/corp-scoring-remote-iterations-strategy-suite-smoke-10-2026-07-07.json` |
| 8,48 MB | `docs/reviews/ai/ai-selfplay-trace-mining-ab-summary.json` |
| 6,41 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-018-zero-effect-central-guard-2026-07-06.json` |
| 6,34 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-039-central-protection-quality-r2-2026-07-06.json` |
| 5,16 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-010-zero-effect-central-guard-2026-07-06.json` |
| 4,76 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-001-candidate16-reference-2026-07-06.json` |
| 4,71 MB | `docs/reviews/ai/ai-selfplay-trace-mining-c.json` |
| 4,12 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-011-same-turn-closeout-diagnostic-2026-07-06.json` |
| 3,16 MB | `docs/reviews/ai/ai-selfplay-trace-mining-d.json` |
| 2,88 MB | `docs/reviews/ai/ai-selfplay-trace-mining-run.json` |
| 1,57 MB | `docs/reviews/ai/corp-scoring-remote-iterations-seed-009-central-protection-quality-r2-2026-07-06.json` |

## Begründung

Die Dateien sind historisches Rohmaterial aus Benchmark-, Selfplay-, Trace- oder Seed-Diagnosearbeiten. Sie sind nicht die führende aktuelle Dokumentation, nicht aus Projekttexten referenziert und nicht als Gate-, Contract-, Final- oder Policy-Artefakt erkennbar. Der aktuelle fachliche Stand wird in `current-state-docs-rollup-2026-07-08.md`, aktuellen Statusseiten, Release-/Architekturartefakten und Git-Historie gehalten.

## Removal Condition

Sollte nach der Löschwelle eine Referenz oder ein Scriptpfad auf eine entfernte Datei sichtbar werden, wird die Referenz auf das Rollup oder auf ein aktuelles Data-/Review-Artefakt umgebogen. Falls der entfernte Rohdump wider Erwarten wieder benötigt wird, ist er über Git-Historie wiederherstellbar.

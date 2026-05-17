# Docs Derived Release Rollup: S01

Status: proposal
Stand: 2026-05-17
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Ziel

Dieses Rollup schlägt eine spätere Verdichtung der abgeschlossenen S01-Artefakte unter `docs/derived/` vor. Es behandelt nur die Familie `S01_*` und verschiebt, löscht oder ändert keine bestehenden S01-Dateien.

S01 bleibt als Sonderphase für Spielende, Ergebnisfenster, Spielziel-Auswahl, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Audio getrennt von V1.x- und V2-Roadmaps.

## S01-Familie

| Datei | Rolle | Vorschlag | Begründung |
| --- | --- | --- | --- |
| `docs/derived/S01_REQUIREMENTS_REVIEW.md` | Requirements Review, Implementierungsfreigabe | `keep-evidence` | Führender Gate-Nachweis mit `ready_for_implementation: true`, Scope-Abgrenzung und Vorgaben-Check. |
| `docs/derived/S01_REQUIREMENTS.md` | Requirements Freeze | `keep-evidence` | Verbindlicher S01-Vertrag mit Must-Anforderungen, Testspur und Scope-Grenzen. Ohne separates Final-Review-Artefakt bleibt diese Datei ein zentraler Audit-Anker. |
| `docs/derived/S01_TEST_MATRIX.md` | Testmatrix | `keep-evidence` | Verbindet S01-MUST-Anforderungen mit Result-, UI-, Audio-, Matchserie-, Visibility- und Regressionstests. |
| `docs/derived/S01_MATCH_SERIES_SPEC.md` | Spezifikation, implementierter Serienvertrag | `keep-evidence` | Enthält den aktuellen privaten Serienvertrag, Seitenwechsel, `series-next`, Matchpunktwertung und Sicherheitsgrenzen. |
| `docs/derived/S01_RESULT_MODAL_SPEC.md` | UI-/Result-Spezifikation | `condense-candidate-after-rollup` | Der Kernvertrag kann in einem Rollup verdichtet werden; bis zu einer Linkmigration bleibt die Datei als präziser Anzeige- und Datenregel-Nachweis erhalten. |
| `docs/derived/S01_AUDIO_SPEC.md` | Audio-Spezifikation | `condense-candidate-after-rollup` | Kleiner Präsentationsvertrag mit Opt-in, Reconnect- und Asset-Regeln; geeignet für spätere Verdichtung, aber nicht für sofortige Entfernung. |
| `docs/derived/S01_DETAILED_PLAN.md` | Detailplan / Vorplanung | `archive-candidate-after-condense` | Historische Planungsfassung vor Requirements-Freeze. Nach Requirements, Requirements Review und Specs nicht mehr führend, aber weiterhin nützlich als Ursprungsspur. |

## Verdichteter S01-Index

Führend bleiben:

- Gate und Freigabe: `docs/derived/S01_REQUIREMENTS_REVIEW.md`
- Requirements Freeze: `docs/derived/S01_REQUIREMENTS.md`
- Testnachweis: `docs/derived/S01_TEST_MATRIX.md`
- Private Matchserie: `docs/derived/S01_MATCH_SERIES_SPEC.md`
- Ergebnisfenster: `docs/derived/S01_RESULT_MODAL_SPEC.md`
- Audio: `docs/derived/S01_AUDIO_SPEC.md`
- Historische Planung: `docs/derived/S01_DETAILED_PLAN.md`

Kurzstand:

- Die Engine bleibt Regelautorität für das Einzelspielende.
- Der Server veröffentlicht nur side-sichere `GameResultSummary`-Daten.
- Ergebnisfenster, Hintergrundgrafik und Audio sind reine UI-Präsentation.
- Die private Zwei-Spiel-Serie ist eine Hülle über getrennte Einzelspiele und verändert Replay oder StateHash nicht.
- Ergebnis-, Reconnect-, Serien- und UI-Payloads dürfen keine FullState-Daten, `cardInstances`, Tokens, privaten Decklisten oder verdeckten Kartendaten enthalten.
- Audio ist opt-in, lokal, reconnect-sicher und nutzt keine offiziellen oder externen Audiodateien.
- S01 führt keine neuen Karten, Regelmechaniken, öffentlichen Plattformfunktionen, offiziellen Assets oder Roadmap-Promotionen ein.

## Linkbruchrisiken vor Moves

Aktuelle direkte S01-Pfadlinks liegen mindestens in:

| Datei | Referenztyp | Risiko |
| --- | --- | --- |
| `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` | direkter Statusanker für `docs/derived/S01_*` sowie direkte Links auf Requirements und Match-Series-Spec | Hoch, weil die Wissensbasis als Einstieg und führender Statusanker dient. |
| `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md` | Logeintrag mit `docs/derived/S01_*.md` | Mittel, weil der Log historische Abschluss- und Umsetzungsspuren absichert. |
| `docs/codex/CODEX_STATUS_CHRONICLE.md` | direkte Liste aller sieben S01-Artefakte | Mittel, weil Statushistorie die ursprünglichen Pfade nennt. |
| `docs/derived/S01_DETAILED_PLAN.md` | direkte Links auf Requirements, Specs, Testmatrix und Requirements Review | Mittel, weil der Detailplan den geplanten Artefakt-Satz intern referenziert. |
| `docs/derived/V1_0_2_REQUIREMENTS.md` | direkte Quelle auf `S01_REQUIREMENTS.md` | Mittel, weil V1.0.2 Audio-/Präsentationsscope auf S01 aufbaut. |
| `docs/derived/V1_0_2_REQUIREMENTS_REVIEW.md` | direkte Quelle auf `S01_REQUIREMENTS.md` | Mittel, weil der Review die S01-Basis für Folgeaudio referenziert. |
| `docs/derived/MECHANICS_COMPLETION_PLAN.md` | direkte Quelle auf `S01_REQUIREMENTS.md` | Niedrig bis mittel, weil es kein S01-Gate ist, aber bei einem Move aktualisiert werden müsste. |
| `docs/derived/DOCS_INVENTORY_LIFECYCLE_INDEX_2026_05_17.md` | direkter Lifecycle-Hinweis auf `docs/derived/S01_*` und dieses Activity-Paket | Niedrig, aber für spätere Dokumentationshygiene relevant. |
| `docs/activities/done/act-2026-05-17-docs-derived-release-rollups.md` | Folgepaket-Hinweis auf `docs/derived/S01_*.md` | Niedrig, nach Abschluss nur Activity-Audit. |

Lose Textreferenzen auf `S01` stehen außerdem in Bestandsaufnahme, Statusseiten, Produktvision, Mechanikmatrix und späteren V1.0.x-Kontexten. Diese wären durch einen Dateimove nicht direkt gebrochen, sollten bei einer späteren Umstrukturierung aber über Suchmuster sichtbar bleiben.

Empfohlene Suchmuster vor einem späteren Move:

```powershell
rg -n "docs/derived/S01_|S01_[A-Z_]+\\.md|S01 |Sonderphase 01" .
```

## Vorgeschlagene Zielstruktur für spätere Konventionsentscheidung

In diesem Paket bleibt `docs/derived/` kanonisch. Falls das Projekt später eine dauerhafte `docs/releases/`-Struktur freigibt, wäre die kleinste S01-Zielstruktur:

```text
docs/releases/special/s01/
  README.md
  requirements-review.md
  requirements.md
  test-matrix.md
  match-series-spec.md
  result-modal-spec.md
  audio-spec.md
  detailed-plan.md
```

Mapping:

| Heute | Späterer Zielpfad |
| --- | --- |
| `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_S01.md` | `docs/releases/special/s01/README.md` |
| `docs/derived/S01_REQUIREMENTS_REVIEW.md` | `docs/releases/special/s01/requirements-review.md` |
| `docs/derived/S01_REQUIREMENTS.md` | `docs/releases/special/s01/requirements.md` |
| `docs/derived/S01_TEST_MATRIX.md` | `docs/releases/special/s01/test-matrix.md` |
| `docs/derived/S01_MATCH_SERIES_SPEC.md` | `docs/releases/special/s01/match-series-spec.md` |
| `docs/derived/S01_RESULT_MODAL_SPEC.md` | `docs/releases/special/s01/result-modal-spec.md` |
| `docs/derived/S01_AUDIO_SPEC.md` | `docs/releases/special/s01/audio-spec.md` |
| `docs/derived/S01_DETAILED_PLAN.md` | `docs/releases/special/s01/detailed-plan.md` |

## Move-Voraussetzungen

Ein späterer Move darf erst erfolgen, wenn diese Bedingungen erfüllt sind:

- `docs/releases/` ist als dauerhafte Zielstruktur projektweit akzeptiert.
- Alle harten S01-Pfadlinks sind aktualisiert oder bewusst durch Redirect-Stubs abgesichert.
- Requirements Review, Requirements, Testmatrix und Match-Series-Spec bleiben als Audit-Trail eindeutig auffindbar.
- Result-Modal- und Audio-Spezifikation bleiben bis zur abgeschlossenen Linkmigration lesbar.
- Der Detailplan wird höchstens archiviert, nicht gelöscht.
- Kein V1.x-, V2-, Backend-0.5- oder sonstiges Releaseartefakt wird im selben Paket bewegt.
- Abschlusscheck: `rg -n "docs/derived/S01_|S01_[A-Z_]+\\.md|S01 |Sonderphase 01" .`
- Abschlusscheck: `git diff --check`

## Entscheidung für dieses Paket

`decision-no-move`: Die bestehenden S01-Pfade bleiben vorerst kanonisch. Dieses Rollup dokumentiert nur Klassifikation, Audit-Trail, Linkbruchrisiken und Voraussetzungen für eine spätere gezielte Umstrukturierung.

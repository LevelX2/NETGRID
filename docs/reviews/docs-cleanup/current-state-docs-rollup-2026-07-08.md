# Current-State-Dokumentationsrollup 2026-07-08

Status: `current-rollup`
Datum: 2026-07-08
Primärer Agent: `release-implementation-agent`

## Zweck

Dieses Rollup hält den aktuellen Dokumentationszustand und die Cleanup-Folgerung fest. Es ist kein vollständiger Projektstatus und ersetzt keine Release-Final-Reviews, sondern bündelt die für den Dokumentationscleanup relevante Entscheidungslage.

## Führende Quellen für aktuellen Projektstand

- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- aktuelle Releaseartefakte unter `docs/releases/v1/`
- aktuelle Architekturverträge unter `docs/architecture/`
- aktive Runbooks unter `docs/runbooks/`
- aktuelle Data-/Manifest-/Scenario-/Report-Artefakte unter `data/`

Historische Einzelreviews, alte Benchmarks und Prozessberichte sind keine primäre Einstiegsschicht mehr.

## Dokumentationsbefund

Der aktuelle Arbeitsbaum enthält eine sehr große Menge an Review- und Update-Artefakten:

| Bereich | Dateien | Größe |
| --- | ---: | ---: |
| `docs/reviews/` | 1082 | ca. 245,60 MB |
| `docs/releases/` | 753 | ca. 3,77 MB |
| `docs/architecture/` | 228 | ca. 2,77 MB |
| `docs/activities/` | 409 | ca. 1,94 MB |
| `KI-Wissen-NETGRID/` | wenige führende Wissensseiten | unter 1 MB |

Die Größe und Unübersichtlichkeit des Problems sitzt fast vollständig in `docs/reviews/ai/`:

| Klasse | Dateien | Größe |
| --- | ---: | ---: |
| AI-Review-JSON | 359 | ca. 239,82 MB |
| AI-Review-Markdown | 651 | ca. 5,10 MB |
| heuristische Runtime-/Benchmark-Evidence | 242 | ca. 222,92 MB |
| heuristische Summary-/Decision-Dateien | 242 | ca. 3,92 MB |

Die wichtigsten Cleanup-Kandidaten sind große JSON-Rohartefakte wie Seed-Diagnosen, Benchmark-Suites, Selfplay-/Trace-Mining-Dumps, Candidate-Reports und Iterationssummaries. Sie sind als historische Arbeitsprodukte nützlich gewesen, aber nicht als dauerhafte tägliche Projektdokumentation.

## Aktueller AI-/Review-Ist-Stand für den Cleanup

Der führende fachliche Stand ist nicht die Summe alter Einzelreports, sondern der verdichtete Projektstatus:

- AI Runtime Zero Legacy ist abgeschlossen; der normale AI-Livepfad läuft über die Semantic Runtime und bleibt LegalActions-only.
- Planbasierte Corp- und Runner-KI sind als AI-Level-2-Modelle umgesetzt und final geprüft.
- Aktuelle Runner-/Corp-Plan-Nacharbeiten laufen über kleine gezielte Fix- und Reviewartefakte, nicht über alte breite Benchmark-Rohdaten.
- Alte Legacy-, Shadow-, Generated-Facts-, Selfplay- und Candidate-Serien sind nur noch relevant, wenn sie heute als konkrete Regression, Removal Condition oder Gate-Evidence referenziert werden.
- Große Rohdaten sind nicht notwendig, wenn aktuelle Summaries, Tests, Data-Reports oder Rollups den Zustand belegen.

## Retention-Folgerung

Für den aktuellen Arbeitskontext gilt:

- Behalten werden aktuelle Entscheidungen, Architekturverträge, Runbooks, Release-Gates, Specs, Testmatrizen, Final Reviews und maschinenlesbare aktive Data-Artefakte.
- Verdichtet werden historische Review-Serien und Update-Folgen.
- Entfernt werden unreferenzierte große JSON-Rohartefakte ohne aktuellen Gate-, Test-, Script- oder Statusnutzen.
- Gesondert geprüft werden alle Dateien, die aus Statusseiten, Skripten, Tests oder aktuellen Release-/Architekturartefakten referenziert werden.

## Erste Löschwelle

Die erste sichere Löschwelle soll auf `docs/reviews/ai/*.json` begrenzt bleiben und nur Dateien entfernen, die alle Bedingungen erfüllen:

1. Datei liegt unter `docs/reviews/ai/`.
2. Datei ist JSON-Rohartefakt.
3. Datei ist nicht aus `docs/`, `KI-Wissen-NETGRID/`, `scripts/`, `packages/`, `apps/`, `data/`, `package.json` oder Konfigurationsdateien referenziert.
4. Dateiname deutet nicht auf aktuelle Policy, Final Review, Gate, Contract, Readiness, Cutover oder Removal Condition.
5. Datei ist im Cleanup-Inventar als `delete` klassifiziert.

## Restpunkte

- `docs/codex/CODEX_STATUS.md` ist selbst ein starker Verdichtungskandidat, bleibt aber in diesem Paket nur dann berührt, wenn Referenzen auf entfernte Dateien angepasst werden müssen.
- Alte Markdown-Reviewserien werden nach der JSON-Welle gesondert geprüft.
- `docs/activities/done/` sollte in einem späteren Paket nach Rollup-Regel ausgedünnt werden.

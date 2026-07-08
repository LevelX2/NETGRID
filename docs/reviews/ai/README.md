# AI-Reviews und Benchmarks

`docs/reviews/ai/` enthält historische und aktuelle KI-bezogene Audits, Diagnoseberichte, Benchmark-Nachweise und Beobachtungen. Der Ordner ist nicht mehr als vollständiger Lesepfad zu verwenden. Führend sind aktuelle Status-, Rollup-, Architektur-, Release- und Data-Artefakte.

## Aktueller Einstieg

- Aktueller Projektstatus: `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- Current-State-Cleanup-Rollup: `docs/reviews/docs-cleanup/current-state-docs-rollup-2026-07-08.md`
- Retention-Entscheidung: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`
- Konsolidierte Roadmap: `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`

## Aktive Root-Kommandos

- `corepack pnpm check:ai`: kompakter Basislauf für stabile read-only AI-Gates.
- `corepack pnpm check:ai:full`: Basislauf plus Full-Derived-Facts-Scan.
- `corepack pnpm build:ai`: kompakter Alias zum Neubauen der compiled AI-Hints.
- Direkte Spezialskripte unter `scripts/check-ai-*.mjs` bleiben nur dann relevant, wenn ein aktueller Review, Test oder Gate sie ausdrücklich nutzt.

## Führender aktueller AI-Stand

- AI Runtime Zero Legacy ist abgeschlossen; der normale AI-Livepfad läuft über die Semantic Runtime und bleibt LegalActions-only.
- Planbasierte Corp- und Runner-KI sind als AI-Level-2-Modelle umgesetzt und final geprüft.
- Aktuelle Runner-/Corp-Plan-Nacharbeiten werden über kleine gezielte Artefakte, Tests und aktuelle Data-Reports geführt.
- Alte Shadow-, Generated-Facts-, Selfplay-, Candidate-, Seed- und Benchmark-Serien sind historische Arbeitsprodukte. Sie sind nur noch führend, wenn sie aktuell referenziert oder als konkrete Regression, Gate-Evidence oder Removal Condition gebraucht werden.

## Retention-Regel für diesen Ordner

Behalten:

- aktuelle Final Reviews, Gate-Evidence, Readiness-/Cutover-/Policy-/Contract-Dokumente;
- Dateien, die von Statusseiten, Architekturverträgen, Tests, Scripts, Package-Commands oder aktuellen Releaseartefakten referenziert werden;
- kleine verdichtete Reviews, deren Inhalt noch nicht in aktuelle Rollups oder Statusseiten übernommen wurde.

Verdichten und danach entfernen:

- historische Update-Serien;
- abgeschlossene Prozessberichte ohne aktuellen Gate-Wert;
- alte Diagnoseketten, deren Ergebnis bereits in Tests, Status oder Rollups übernommen wurde.

Nach Referenzprüfung entfernen:

- unreferenzierte große JSON-Traces, Benchmarks, Candidate-/Seed-/Snapshot-/Optimizer-/Selfplay-Dumps;
- generierte Reports, die keine aktuelle Script-, Test-, Gate- oder Statusfunktion mehr haben.

Bei Unsicherheit wird eine Datei als `needs-review` inventarisiert und bleibt stehen.

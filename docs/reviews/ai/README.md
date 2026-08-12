# AI-Reviews und Benchmarks

Stand: 2026-08-12

`docs/reviews/ai/` enthält ausschließlich KI-bezogene Review- und Gate-Evidence, die aktuell noch benötigt wird. Historische Serien sind kein eigener Lesepfad.

## Aktueller Einstieg

- Projektstatus: `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- AI-Architektur und Dokumenthierarchie: `docs/architecture/ai/README.md`
- Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`
- Konsolidierte Roadmap: `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`

## Retention

Behalten werden nur Review-Artefakte mit einer heutigen Funktion, insbesondere:

- aktuelle Final Reviews, Gate-, Readiness-, Contract- oder Removal-Condition-Evidence;
- Dateien, die von aktuellen Architekturverträgen, Statusseiten, Tests, Scripts oder Gates benötigt werden;
- kleine Reviews mit noch nicht anderweitig verdichtetem aktuellem Erkenntniswert.

Nach Referenzprüfung werden entfernt:

- historische Update-, Remediation- und Zwischenstandsserien ohne aktuellen Gate-Wert;
- alte Selfplay-, Candidate-, Seed-, Snapshot-, Optimizer-, Replay- und Benchmark-Dumps;
- generierte JSON/CSV/Markdown-Reports ohne aktuellen Consumer;
- Prozess- und Diagnoseketten, deren Ergebnis bereits in Code, Tests, Architektur oder aktuellem Status enthalten ist.

Git-Historie ersetzt die vorsorgliche Aufbewahrung alter Review-Evidence im Arbeitsbaum. Bei unklarer aktueller Gate-/Contract-Funktion wird die Datei vor Löschung einzeln geprüft.

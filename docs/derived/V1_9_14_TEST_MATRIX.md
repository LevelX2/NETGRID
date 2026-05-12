# V1.9.14 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 25 Zielkarten in Runtime-Definitionsliste | offen |
| LegalAction Revalidation | Trace-Bids, Tags, Resource-Aktionen, Kosten, Timing | offen |
| Visibility | Trace-/Tag-/Resource-Payloads side-sicher | offen |
| Replay/StateHash | Trace, Tags und Resource-Aktionen nach Replay identisch | offen |
| Scenario Pack | `data/scenarios/v1914-trace-tag-resource-smoke.json` | offen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.14.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.14.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1914.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1914-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | offen |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | offen |

## Ziel-Smokes

- Trace-Fenster erzwingen legale Bid-/Pass-Entscheidungen.
- Tag-Vermeidung und tagbedingte Resource-Trash-Pfade bleiben side-sicher.
- Resource-Aktionen validieren Kosten und installierte Ziele.
- Hidden-Zone-, Damage- und Counter-Ueberlappungen nutzen nur bestehende sichere Pfade.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

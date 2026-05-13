# V1.9.14 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 25 Zielkarten in Runtime-Definitionsliste | abgeschlossen: 25/25 finale Definitionen |
| LegalAction Revalidation | Trace-Bids, Tags, Resource-Aktionen, Kosten, Timing | abgeschlossen: Trace-ICE, Link, Resource-Trash und Power Grid Overload |
| Visibility | Trace-/Tag-/Resource-Payloads side-sicher | abgeschlossen: side-sichere PlayerView-/Scenario-Gates |
| Replay/StateHash | Trace, Tags und Resource-Aktionen nach Replay identisch | abgeschlossen: Engine-/Scenario-Gate dokumentiert |
| Scenario Pack | `data/scenarios/v1914-trace-tag-resource-smoke.json` | abgeschlossen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.14.json` | abgeschlossen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.14.json` | abgeschlossen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1914.json` | abgeschlossen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1914-smokes.json` | abgeschlossen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | abgeschlossen: V1.9.14 |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | abgeschlossen: alle gruen; Build mit bekannter Turbopack-NFT-Warnung |

## Ziel-Smokes

- Trace-Fenster erzwingen legale Bid-/Pass-Entscheidungen.
- Tag-Vermeidung und tagbedingte Resource-Trash-Pfade bleiben side-sicher.
- Resource-Aktionen validieren Kosten und installierte Ziele.
- Hidden-Zone-, Damage- und Counter-Ueberlappungen nutzen nur bestehende sichere Pfade.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

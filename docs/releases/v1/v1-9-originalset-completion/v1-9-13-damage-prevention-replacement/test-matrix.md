# V1.9.13 Test Matrix

Stand: 2026-05-13
Status: final

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | pass |
| Runtime Definitions | Alle 17 Zielkarten in Runtime-Definitionsliste | pass |
| LegalAction Revalidation | Prevent, Avoid, Pass/Accept, Damage-Choice-Fenster | pass |
| Visibility | Hidden-Zone- und Damage-Payloads side-sicher | pass |
| Replay/StateHash | Damage-Prevention nach Replay identisch | pass |
| Scenario Pack | `data/scenarios/v1913-damage-prevention-replacement-smoke.json` | pass |
| Manifest | `data/manifests/card-implementation-manifest-1.9.13.json` | pass |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.13.json` | pass |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1913.json` | pass |
| AI Smokes | `data/scenarios/ai-deck-legal-v1913-smokes.json` | pass |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version `V1.9.13` | pass |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | pass |

## Ziel-Smokes

- Runner waehlt eine legale Prevention-/Avoid-Option oder passt kontrolliert.
- Damage wird nach Prevention korrekt reduziert oder ersetzt.
- Random-Trash bleibt side-sicher und replaybar.
- Corp-ICE-Damage-Subroutinen erzeugen nur erlaubte oeffentliche Payloads.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

# V1.9.13 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 17 Zielkarten in Engine-Definitionsliste | offen |
| LegalAction Revalidation | Prevent, Avoid, Pass/Accept, Counter-Kosten, Damage | offen |
| Visibility | Hidden-Zone- und Damage-Payloads side-sicher | offen |
| Replay/StateHash | Damage, Prevention, Avoid und Random-Trash nach Replay identisch | offen |
| Scenario Pack | `data/scenarios/v1913-damage-prevention-replacement-smoke.json` | offen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.13.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.13.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1913.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1913-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | offen |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | offen |

## Ziel-Smokes

- Runner waehlt eine legale Prevention-/Avoid-Option oder passt kontrolliert.
- Damage wird nach Prevention korrekt reduziert oder ersetzt.
- Random-Trash bleibt side-sicher und replaybar.
- Corp-ICE-Damage-Subroutinen erzeugen nur erlaubte oeffentliche Payloads.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

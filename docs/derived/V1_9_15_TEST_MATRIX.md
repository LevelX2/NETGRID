# V1.9.15 Test Matrix

Stand: 2026-05-13
Status: final

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | erledigt |
| Runtime Definitions | Alle 14 Zielkarten in Runtime-Definitionsliste | erledigt: 14/14 release-promotet |
| LegalAction Revalidation | Run-Start, Access, Multiaccess, Ambush, Kosten, Timing | erledigt: Runner-Event-Run-Start, installierte Helper, Priority-Wreck-Multiaccess, Cerberus-/Mastiff-Trace-Fenster und New-Blood-Run-Historie per Engine-Smoke |
| Visibility | Access-/Hidden-Zone-/Ambush-Payloads side-sicher | erledigt: Priority-Wreck und installierte Helper leaken keine zukünftigen Queue-Karten; Trace-Bid-Choice bleibt corp-privat |
| Replay/StateHash | Run- und Access-Queue nach Replay identisch | erledigt: Priority-Wreck-R&D-Multiaccess replayt StateHash-stabil |
| Scenario Pack | `data/scenarios/v1915-run-access-multiaccess-smoke.json` | erledigt |
| Manifest | `data/manifests/card-implementation-manifest-1.9.15.json` | erledigt |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.15.json` | erledigt |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1915.json` | erledigt: 14/14 `ai_supported` |
| AI Smokes | `data/scenarios/ai-deck-legal-v1915-smokes.json` | erledigt |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | erledigt: Catalog-Promotion und Webclient `V1.9.15` |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | erledigt: catalog 30, engine 227, ai 84, web 76, server 72, typecheck, test, lint und build gruen; Build mit bekannter Turbopack-NFT-Warnung |
| Display Texts | Finale display-only Texte ohne WIP-Praefix | erledigt: aus lokal bestaetigten Matrix-Regelkernen abgeleitet, nicht regelautoritativ |

## Ziel-Smokes

- Runner-Events koennen legale Runs starten und Access-Folgen ausloesen.
- Multiaccess bleibt deterministisch und side-sicher.
- Ambush-/ICE-Folgen werden nur im legalen Encounter-/Access-Kontext ausgeloest.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

## Release-Smokes 2026-05-13

- `onr_v1_098_lucidrine-booster-drug`, `onr_v1_105_priority-wreck`, `onr_v1_111_social-engineering` und `onr_v1_112_stumble-through-wilderspace` starten Runs nur ueber `play_event`-LegalActions mit legalem Serverziel.
- `onr_v1_020_dupre`, `onr_v1_024_expert-schedule-analyzer`, `onr_v1_041_microtech-ai-interface`, `onr_v1_043_mystery-box`, `onr_v1_062_shredder-uplink-protocol`, `onr_v1_065_smarteye` und `onr_v1_142_record-reconstructor` sind ueber Install-, Run-, Breach-, Counter- und Hidden-Zone-Barrier-Pfade abgedeckt.
- `onr_v1_105_priority-wreck` erzeugt eine deterministische R&D-Multiaccess-Queue, leakt vor dem Access keine spaeteren Queue-Titel und replayt StateHash-stabil.
- `onr_v1_227_cerberus` und `onr_v1_255_mastiff` oeffnen das bestehende side-sichere Trace-Bid-Fenster im Encounter.
- `onr_v1_294_new-blood` ist erst nach sichtbarem Runner-Run-Versuch im letzten Zug legal.

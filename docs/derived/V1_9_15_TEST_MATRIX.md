# V1.9.15 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 14 Zielkarten in Runtime-Definitionsliste | teilweise: 14/14 WIP-Definitionen, nicht promotet |
| LegalAction Revalidation | Run-Start, Access, Multiaccess, Ambush, Kosten, Timing | teilweise: Runner-Event-Run-Start, Priority-Wreck-Multiaccess, Cerberus-/Mastiff-Trace-Fenster und New-Blood-Run-Historie per Engine-Smoke |
| Visibility | Access-/Hidden-Zone-/Ambush-Payloads side-sicher | teilweise: Priority-Wreck-R&D-Multiaccess leakt keine zukünftigen Queue-Karten; Trace-Bid-Choice bleibt corp-privat |
| Replay/StateHash | Run- und Access-Queue nach Replay identisch | teilweise: Priority-Wreck-R&D-Multiaccess replayt StateHash-stabil |
| Scenario Pack | `data/scenarios/v1915-run-access-multiaccess-smoke.json` | WIP: `data/scenarios/v1915-run-access-multiaccess-wip-smoke.json` |
| Manifest | `data/manifests/card-implementation-manifest-1.9.15.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.15.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1915.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1915-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | teilweise: 14er-WIP-Zielmenge mit No-Promotion-Guard |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | teilweise: engine gruen mit 226 Tests; catalog/typecheck aus Vorlauf gruen, nach neuem WIP erneut ausstehend |

## Ziel-Smokes

- Runner-Events koennen legale Runs starten und Access-Folgen ausloesen.
- Multiaccess bleibt deterministisch und side-sicher.
- Ambush-/ICE-Folgen werden nur im legalen Encounter-/Access-Kontext ausgeloest.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.

## WIP-Smokes 2026-05-13

- `onr_v1_098_lucidrine-booster-drug`, `onr_v1_105_priority-wreck`, `onr_v1_111_social-engineering` und `onr_v1_112_stumble-through-wilderspace` starten Runs nur ueber `play_event`-LegalActions mit legalem Serverziel.
- `onr_v1_105_priority-wreck` erzeugt eine deterministische R&D-Multiaccess-Queue, leakt vor dem Access keine spaeteren Queue-Titel und replayt StateHash-stabil.
- `onr_v1_227_cerberus` und `onr_v1_255_mastiff` oeffnen das bestehende side-sichere Trace-Bid-Fenster im Encounter.
- `onr_v1_294_new-blood` ist erst nach sichtbarem Runner-Run-Versuch im letzten Zug legal.

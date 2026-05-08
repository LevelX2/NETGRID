# MVP 0.8 Implementation Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_hardening: true`

V0.8 wurde als lokaler spielbarer Starterset-Slice umgesetzt. Der neue Kartenpool bleibt lokal/fiktiv, nutzt keine offiziellen Assets und erweitert die Engine nur über explizite Resolver.

## Umgesetzt

- 14 neue lokale V0.8-Karten in Shared-Daten, Katalogsnapshot, Demo-Kartenartefakt und Card-Manifest.
- V0.8-Demo-Decks, Formatprofil, Decktemplates, immutable Deck-Snapshots, Deck-Validation-Manifest und Rule-Baseline 0.8.
- Explizite Runner-Event-, Corp-Operation- und Corp-Root-Rez-Resolver in der Engine.
- V0.8-Baseline-Auswahl für Engine, Server-Matchstart, Multiplayer und AI-Simulationen.
- V0.8-Katalog- und Deck-API-Anbindung in der Web-App.
- Default-Matchsetup auf die validierten V0.8-Starter-Snapshots.
- Unit-, Szenario-, Visibility-, Replay/StateHash-, Deck-, Server- und AI-Smoke-Abdeckung.

## Gate-Prüfung

| Gate | Ergebnis |
|---|---|
| Jede neue spielbare Karte hat Manifest und Resolver | pass |
| Jede neue spielbare Karte ist Unit- und Szenario-abgedeckt | pass |
| V0.8-Deck-Snapshots validieren und bleiben reproduzierbar | pass |
| Import-only oder blocked Karten bleiben nicht matchstartfähig | pass |
| Public Deck Metadata enthält keine Decklisten | pass |
| PlayerViews, API-Payloads und AI-Inputs bleiben Hidden-Info-sicher | pass |
| Replay/StateHash bleibt deterministisch | pass |
| KI nutzt V0.8 nur über LegalActions und PlayerViews | pass |
| Bestehende V0.1-V0.7-Regressionssuite bleibt grün | pass |

## Checks

- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass, 20 Tests.
- `corepack pnpm --filter @netgrid/server test`: pass, 12 Tests.
- `corepack pnpm --filter @netgrid/ai test`: pass, 11 Tests.
- `corepack pnpm --filter @netgrid/decks test`: pass, 7 Tests.
- `corepack pnpm --filter @netgrid/catalog test`: pass, 6 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 19 Tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## Lokale Smokes

- V0.8 Matchstart-Smoke: pass, Standardmatch nutzt Baseline `0.8.0`, Runner-Snapshot `demo_runner_008_snapshot_v0_8` und Corp-Snapshot `demo_corp_008_snapshot_v0_8`.
- V0.8 Deck-/Katalog-Smoke: pass, V0.8-Snapshots validieren und `v08_burst_credit_event` ist im Katalog abrufbar.
- V0.8 AI-Smoke: pass, drei Seeds mit `demo_runner_008` und `demo_corp_008`, replaybar und mit Reason-Codes.
- Performance-Smoke: pass, 500 LegalAction/View-Probes in 3,31 ms und 80 Apply-Schritte in 71,01 ms.

## Annahmen und Grenzen

- Die V0.8-Karten sind lokale Originale und keine offiziellen Kartenapproximationen.
- Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement bleiben außerhalb von V0.8.
- V0.8 verbessert nicht die KI-Qualität jenseits der nötigen Starterdeck-Smokes; die eigentliche KI-Qualitätsphase bleibt V0.9.
- V0.7 UI bleibt die Oberfläche; V0.8 ergänzt Daten, Decks und spielbare Engine-Fähigkeiten.

## Nächster Schritt

V0.8 Final Review, Statuspflege, Wissenspflege und grüner lokaler Commit.

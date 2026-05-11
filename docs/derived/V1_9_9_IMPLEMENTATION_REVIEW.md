# V1.9.9 Implementation Review – Upgrade-Mechanik-Sprint

## Ergebnis

V1.9.9 ist im Runtime-Katalog, in der Engine, in KI-Hints, Smoke-Artefakten und Regressionstests umgesetzt. Der Scope bleibt auf die vier freigegebenen Upgrades begrenzt.

## Implementierte Karten

1. `onr_v1_349_aardvark`
   - Resolverfamilie: `server_icebreaker_worm_use_then_breach_failover`
   - Engine: Worm-Aktionen werden auf rezzed Aardvark-Forts blockiert; unrezzed Aardvark öffnet eine Corp-Rez-Choice und trasht bei Rez den genutzten Worm.
2. `onr_v1_351_bizarre-encryption-scheme`
   - Resolverfamilie: `corp_access_delay_and_return_to_server_then_start_turn_score`
   - Engine: BES-Access setzt einen Run-Marker; spätere Agenda-Scoring-Aktionen auf diesem Run werden verzögert und bei Runner-Turn-Start abgearbeitet, wenn die Agenda noch im Fort liegt.
3. `onr_v1_352_chester-mix`
   - Resolverfamilie: `ice_install_cost_mod_server`
   - Engine: rezzed Chester Mix reduziert ICE-Installkosten auf dem eigenen Fort um 1 mit Untergrenze 0.
4. `onr_v1_353_chimera`
   - Resolverfamilie: `accessed_card_ambush_daemon_trash`
   - Engine: Chimera-Access öffnet eine Runner-Choice über installierte Daemons; ohne Daemon bleibt der Effekt No-Op.

## KI-Pfad

1. `data/ai/ai-card-hints-deck-legal-v199.json` ergänzt die vier Karten als `ai_supported`.
2. Corp- und Runner-Planquellen laden die V1.9.9-Hints.
3. Aardvark- und Chimera-Choices laufen über `resolve_choice` und vorhandenes side-sicheres AI-Choice-Handling.

## Runtime-Katalog und UI-Pfad

1. `packages/catalog/src/index.ts` führt `ONR_V1_9_9_RELEASE_CARD_IDS`, V1.9.9-Manifest-, Text- und Numeric-Overrides.
2. Der Catalog- und Web-API-Pfad liefern die vier Karten als `human_playable`, `deck_legal`, `format_legal` und `ai_supported`.
3. Die Webclient-Statusanzeige wurde auf `V1.9.9` angehoben.

## Daten und Artefakte

1. `data/manifests/card-implementation-manifest-1.9.9.json`
2. `data/rules/mechanics-coverage-1.9.9.json`
3. `data/scenarios/v199-card-release-smoke.json`
4. `data/scenarios/ai-deck-legal-v199-smokes.json`
5. `data/manifests/deck-legal-ai-approval-v199-manifest.json`

## Checks

1. `corepack pnpm --filter @netgrid/engine test` – grün.
2. `corepack pnpm --filter @netgrid/ai test` – grün.
3. `corepack pnpm --filter @netgrid/catalog test` – grün.
4. `corepack pnpm --filter @netgrid/web test` – grün.
5. `corepack pnpm --filter @netgrid/server test` – grün.

Weitere Workspace-Gates stehen im Final Review und sind grün.

# V1.9.1 Implementation Review - Mechanikpaket J

Stand: 2026-05-10  
Status: implemented

## Scope

V1.9.1 wurde als gate-konformer Kernrelease umgesetzt. Der eingefrorene 3-Karten-Kernkorb aus dem V1.9.0-Deferred-Überhang ist vollständig implementiert und freigegeben.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_013_cockroach`
  - `onr_v1_034_incubator`
  - `onr_v1_030_grubb`
- Engine-Erweiterung:
  - Cockroach-Counteraufbau auf erfolgreichen HQ-Runs und deterministic random HQ-discard ab Schwelle `>=2`.
  - Incubator-Counteraufbau auf erfolgreichen Runs, Start-of-turn Multiroll und hidden-info-sicherer Choice-Transform-Pfad.
  - Erweiterung des deterministic die resolvers auf versionierte Namespaces (`vXXX.die.*`) für replay-/statehash-stabile Würfelpfade.
  - Grubb remainder-of-run Strength-Bonus mit sauberem Run-Lifecycle-Reset.
  - Purge-Integration für Cockroach-/Incubator-Virus-Counter über bestehendes `purge_virus_counters`-Gate.
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_9_1_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 3 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.9.1`
  - Text-/Numeric-Overrides für V1.9.1-Kernkarten
  - keine automatische Erweiterung von `ai_supported`
- Testabdeckung:
  - neuer V1.9.1-Engine-Testblock für V191-T003 bis V191-T010
  - aktualisierte Katalogtests für Runtime-Gate/No-Scope (V191-T011)
  - serverseitiger Matchstart-Gate-Test für V1.9.1-Release-Sicht
  - aktualisierte Root-Visibility-Contracts passend zur aktuellen Tooltip-/Serverboard-Helferstruktur
- Webclient-Release-Status:
  - sichtbare Webclient-Versionsnummer auf `V1.9.1` angehoben (`apps/web/app/page.tsx`)

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.9.1.json`
- `data/scenarios/v191-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.9.1.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/release-assignment-preflight.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/requirements-review.md`

## No-Scope-Bestätigung

- Keine V2.x-Funktionen
- Kein zusätzlicher Kartenunlock über den 3er-Kern hinaus
- Kein automatisches `ai_supported`-Upgrade
- Keine Public-Plattformfeatures

## Technischer Hinweis zur Worktree-Baseline

Für den isolierten Worktree wurden bestehende Snapshot-/Pool-Dateien (`data/decks/deck-snapshots-0.8.json`, `data/ai/ai-deck-pool-1.0.1.json`) auf den aktuellen Projektstand synchronisiert, damit serverseitige V1.9.1-Gate-Tests stabil auf derselben lokalen Datenbasis laufen. Der V1.9.1-Kernscope bleibt dadurch unverändert.

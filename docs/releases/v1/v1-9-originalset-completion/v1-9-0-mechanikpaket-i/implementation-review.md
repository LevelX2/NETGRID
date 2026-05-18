# V1.9.0 Implementation Review - Mechanikpaket I

Stand: 2026-05-10  
Status: implemented

## Scope

V1.9.0 wurde als gate-konformer Kernrelease umgesetzt. Der eingefrorene 5-Karten-Kernkorb ist vollstaendig freigegeben, die drei Deferred-Karten aus V1.8.1 bleiben unveraendert ausserhalb des Kernscopes.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_005_bartmoss-memorial-icebreaker`
  - `onr_v1_007_blink`
  - `onr_v1_115_terrorist-reprisal`
- Neue Corp-Karten:
  - `onr_v1_223_banpei`
  - `onr_v1_275_vacuum-link`
- Engine-Erweiterung:
  - zentraler deterministic die resolver `rollDeterministicDie` mit `v190.die.*`-RandomRecord-Prefix
  - encountergebundene Nutzungstracker fuer Bartmoss und Blink
  - Blink-Resolver mit deterministic break-or-net-damage und once-per-subroutine-per-encounter gate
  - Bartmoss post-encounter die trigger mit trash-on-one
  - Corp-Last-Turn-Tracking fuer `black_ops`-Scores und Terrorist-Reprisal-LegalAction-Gate
  - deterministic random HQ-discard bis zu 5 Karten ohne Duplikate
  - konkreter Banpei-Resolver fuer `trash program` plus unveraendertes `end the run`
  - Vacuum-Link deterministic rewind auf rezzte ICE mit erstes-ICE-Fallback und Jack-out-Fenster
  - Ambush-on-access foundation hook im Access-Pfad (Harness-gestuetzt, ohne Zusatz-Unlock)
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_9_0_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.9.0`
  - Text-/Numeric-Overrides fuer V1.9.0-Kernkarten
  - keine automatische Erweiterung von `ai_supported`
- Testabdeckung:
  - neuer V1.9.0-Engine-Testblock fuer V190-T003 bis V190-T011
  - aktualisierte Katalogtests fuer Runtime-Gate/No-Scope (V190-T012)
  - serverseitiger Matchstart-Gate-Test fuer V1.9.0-Release-Sicht
- Webclient-Release-Status:
  - sichtbare Webclient-Versionsnummer auf `V1.9.0` angehoben (`apps/web/app/page.tsx`)

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.9.0.json`
- `data/scenarios/v190-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.9.0.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/release-assignment-preflight.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements-review.md`

## Deferred in V1.9.0

- `onr_v1_013_cockroach` -> deferred (bewusst ausserhalb des 5er-Kernkorbs)
- `onr_v1_034_incubator` -> deferred (bewusst ausserhalb des 5er-Kernkorbs)
- `onr_v1_030_grubb` -> deferred (bewusst ausserhalb des 5er-Kernkorbs)

## No-Scope-Bestaetigung

- Keine V2.x-Funktionen
- Kein zusaetzlicher Kartenunlock ueber den 5er-Kern hinaus
- Kein automatisches `ai_supported`-Upgrade
- Keine Public-Plattformfeatures

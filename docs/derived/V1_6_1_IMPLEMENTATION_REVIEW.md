# V1.6.1 Implementation Review - Mechanikpaket A

Stand: 2026-05-09  
Status: implemented

## Scope

V1.6.1 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 111-Kartenplans wurden 6 freigabefähige Karten mit echter Runtime-Damage-Prevention und Core-Damage-ICE-Erweiterung implementiert. Der restliche Planungskorb ist explizit deferred dokumentiert.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_023_evil-twin`
  - `onr_v1_028_force-shield`
  - `onr_v1_125_dermatech-bodyplating`
- Neue Corp-ICE:
  - `onr_v1_229_code-corpse`
  - `onr_v1_231_cortical-scrub`
  - `onr_v1_254_liche`
- Engine-Erweiterung:
  - Runtime-Damage-Prevention-Kandidaten aus installierten Runner-Karten
  - turn-basierte Prevention-Usage pro Karteninstanz (`runnerTurnFlags.damagePreventionUsage`)
  - Reset der Prevention-Usage zu Turnbeginn
  - Label-Redaction-Grenze: Runtime-Kartenname erlaubt, Test-Harness-Label bleibt generisch
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_6_1_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 6 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.6.1`

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.6.1.json`
- `data/scenarios/v161-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.6.1.json`
- `docs/derived/V1_6_1_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_6_1_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_A_1_6_1_SPEC.md`
- `docs/derived/V1_6_1_TEST_MATRIX.md`
- `docs/derived/V1_6_1_REQUIREMENTS_REVIEW.md`

## Verifikation

- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass (nur bekannte nicht-blockierende Turbopack-NFT-Warnung)

## No-Scope-Bestätigung

- Keine Public-Plattformfeatures
- Keine automatische AI-Freigabe
- Keine neue Runtime-Replacement-Karte
- Kein Kartentextparser als Laufzeitautorität

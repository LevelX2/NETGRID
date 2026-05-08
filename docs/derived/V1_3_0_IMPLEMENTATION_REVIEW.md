# V1.3.0 Implementation Review

Datum: 2026-05-08

## Ergebnis

V1.3.0 Format und Deckbuilding Foundation ist umgesetzt. Der Release fuehrt das versionierte private lokale Formatprofil `netgrid_private_local_v1` in Version `1.3.0` ein und erweitert die vorhandene Deckvalidierung restriktiv um Formatprofil-Version, Card-Pool-Version, Side-/Identity-Regeln, Kopienlimit, Agenda-Mindestpunkte, Faction-/Influence-Regeln, sichere Fehlercodes und Legacy-Revalidierungsstatus.

Formatprofile koennen Karten weiterhin nur sperren, nicht freigeben. `format_legal` ist als getrennter Katalogstatus sichtbar, setzt aber `deck_legal` voraus. `deck_legal` setzt im Runtime-Modell `human_playable` voraus. Die V1.2.3-Karten bleiben human-only und werden nicht `ai_supported`.

## Umgesetzte Artefakte

- `data/decks/deck-format-profiles-1.3.0.json`
- `data/decks/deck-snapshots-0.8.json` mit `demo_runner_130_snapshot_v1_3_0` und `demo_corp_130_snapshot_v1_3_0`
- `data/manifests/deck-validation-manifest-1.3.0.json`
- `data/scenarios/v130-format-deckbuilding-smoke.json`
- `packages/decks/src/index.ts`
- `packages/catalog/src/index.ts`
- `apps/server/src/deck-setup.ts`
- `apps/web/app/api/decks/deck-data.ts`
- `apps/web/app/api/decks/library-store.ts`
- `apps/web/app/page.tsx`
- V1.3.0-Abdeckung in Deck-, Catalog-, AI-, Server-, Web-, Phase-Artifact- und Playwright-E2E-Tests

## Testabdeckung

- Deckvalidierung: gueltige V1.3.0-Snapshots, Hash-Stabilitaet, Public-Metadata ohne Deckliste, Formatversion/Card-Pool-Version, Copy-Limit, nicht decklegale Karten, Influence-Limit und Legacy-Decks mit `needs_revalidation`.
- Server: Matchstart revalidiert V1.3.0-Snapshots und blockiert manipulierte Snapshots sowie AI-selected human-only V1.3.0-Decks.
- AI: KI-Deckpool bleibt auf `ai_supported`-Karten beschraenkt; V1.2.3/V1.3.0 human-only Karten bleiben aus dem KI-Pool.
- Web/API: Deckvalidierung waehlt das Profil aus dem Deck statt eines festen Defaults; unbekannte Profile liefern sichere Fehler.
- E2E: legaler und illegaler V1.3.0-Deckvalidierungspfad ueber `/api/decks/validate` ohne Decklist-/Token-/Hidden-Info-Leak.

## Verifikation

- `corepack pnpm lint`: bestanden
- `corepack pnpm typecheck`: bestanden
- `corepack pnpm test`: bestanden
- `corepack pnpm build`: bestanden, mit bekannter nicht-blockierender Turbopack-NFT-Warnung in `apps/web/next.config.ts`
- `corepack pnpm e2e`: bestanden, 8/8 Playwright-Tests

## Scope-Grenzen

Nicht eingefuehrt wurden Public-Plattformfunktionen, Accounts, Matchmaking, Rankings, Turniere, offizielle Assets, offizielle Format-/Turnierlegalitaet, ein Kartentextparser oder neue Kartenfreigaben.

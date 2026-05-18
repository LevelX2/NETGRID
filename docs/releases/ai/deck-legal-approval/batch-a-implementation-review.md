# Deck-Legal AI Approval Batch A Implementation Review

Datum: 2026-05-08

## Ergebnis

Batch A `Runner Rig Low Risk` ist umgesetzt und lokal gezielt verifiziert. Genau acht bereits decklegale Runner-Rig-Karten sind jetzt `ai_supported`.

Freigegeben:

- `onr_v1_014_codecracker` - Codecracker
- `onr_v1_015_codeslinger` - Codeslinger
- `onr_v1_021_dwarf` - Dwarf
- `onr_v1_039_krash` - Krash
- `onr_v1_066_snowball` - Snowball
- `onr_v1_074_worm` - Worm
- `onr_v1_144_tycho-mem-chip` - Tycho Mem Chip
- `onr_v1_146_zetatech-mem-chip` - Zetatech Mem Chip

Alle acht Karten sind im Runtime-Katalog `human_playable`, `deck_legal`, `format_legal` und nach Gate-Prüfung `ai_supported`. Keine Batch-B- bis Batch-G-Karte wurde freigegeben.

## Artefakte

- AI-Hints: `data/ai/ai-card-hints-deck-legal-batch-a.json`
- Manifest: `data/manifests/deck-legal-ai-approval-batch-a-manifest.json`
- Szenarien: `data/scenarios/ai-runner-rig-low-risk-batch-a-smokes.json`

Die Batch-A-Karten wurden aus `data/ai/ai-card-hints-runtime-supplement.json` herausgenommen, damit jede aktive AI-Hint-Quelle pro freigegebener Batch-A-Karte eindeutig bleibt. Das Supplemental-Artefakt bleibt für noch nicht KI-abgenommene decklegale Restkarten zuständig.

## Runner-KI-Verhalten

Abgedeckt sind:

- Rig-Aufbau mit zusätzlichen Breakerrollen.
- Memory-Hardware bei MU-Druck.
- Credit- und MU-sichere Installation.
- `safe_probe_run` mit sichtbaren Breakerrollen.
- Negativfall gegen sichtbaren Stopper: kein schlechter Run, wenn ein sinnvoller Rig-Aufbau sichtbar legal ist.

Die Runner-Planbewertung wurde eng gehärtet: Build-Rig-Installationen werden bei der Aktionsauswahl nach sichtbaren Rollen, MU-Druck und Credit-Reserve priorisiert. Der Planer bleibt weiterhin an PlayerView, LegalActions und AI-supported Rollen gebunden.

## Tests

Gezielte Checks:

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/ai test -- index.test.ts`
- `corepack pnpm --filter @netgrid/web test -- catalog-data.test.ts`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm --filter @netgrid/decks test`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

Pflicht-Gates:

- `corepack pnpm lint`: bestanden
- `corepack pnpm typecheck`: bestanden
- `corepack pnpm test`: bestanden
- `corepack pnpm build`: bestanden

Der Build meldete nur die bekannte nicht-blockierende Turbopack-NFT-Warnung aus dem bestehenden Kartenkatalog-Importpfad.

## Grenzen

Nicht Teil von Batch A:

- keine Batch-B- bis Batch-G-Karten freigeben
- keine nicht deckbau-erlaubten Karten freigeben
- keine pauschale O:NR-KI-Freigabe
- kein lokales Korp-Deck freigeben
- keine neuen Mechaniken
- kein Kartentextparser
- kein Belief State
- keine FullState-Simulation
- keine offiziellen Assets
- keine Public-Plattformfunktionen

## Bekannte Restpunkte

Keine Batch-A-Karte wurde zurückgestellt. Die nächsten Freigaben bleiben eigene Gates, beginnend mit Batch B nur nach separater Prüfung von Run-/Multiaccess-/Reset-Events.

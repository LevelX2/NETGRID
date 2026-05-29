# Proteus Human-vs-Human Decklegal Approval

Status: done

Datum: 2026-05-29

## Anlass

Nach PRO020 sind 154/154 Proteus-Karten konkret implementiert, registriert und im Coverage-Harness ohne Drift. Damit ist die Human-vs-Human-Freigabe fachlich nicht mehr an fehlende AI-Hints gekoppelt.

## Umsetzung

- Alle 154 Proteus-Karten in `data/manifests/proteus-card-support.json` sind `deck_legal` und `format_legal`.
- Alle 154 Proteus-Karten bleiben `ai_supported = false`.
- Das private Profil `netgrid_private_local_proteus_playtest_v1` verlangt jetzt `human_playable`, `deck_legal` und `format_legal`.
- Die Proteus-Playtest-Snapshots dokumentieren Human-vs-Human-Decklegalität und AI-Ausschluss.
- Catalog-, Deck-, Engine- und Server-Regressionen sichern die Trennung zwischen Human-vs-Human-Legalität und AI-Support.

## Nachweis

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/decks test`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"`
- `corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "Proteus"`

## Grenze

Diese Freigabe ist keine AI-Freigabe. Protheus bleibt für AI-Decks geschlossen, bis separate AI-Hints, SzenarioRefs, side-sichere AIInput-Prüfung und AI-Smokes vorliegen.

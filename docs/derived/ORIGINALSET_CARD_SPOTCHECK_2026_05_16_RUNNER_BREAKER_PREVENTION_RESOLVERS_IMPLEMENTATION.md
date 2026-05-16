# Originalset Card Spotcheck 2026-05-16 Runner Breaker/Prevention Resolvers

Job: `spotcheck-2026-05-16-runner-breaker-prevention-resolvers`

Status: `done`

## Karten

- `onr_v1_047_pile-driver` - Pile Driver
- `onr_v1_127_full-body-conversion` - Full Body Conversion

## Umsetzung

`Pile Driver` hat jetzt einen eigenen Multi-Wall-Break-Vertrag: eine LegalAction kann bis zu vier ungebrochene Wall-Subroutinen derselben encountered ICE brechen. `applyAction` revalidiert Breaker-Quelle, ICE, Encounter, Wall-Subtype, Zielindizes, Stärke, Zusatzkosten und den exakten Stealth-Verlust von 3.

`Full Body Conversion` wurde vom generischen `prevent 1 meat once per turn`-Profil gelöst. Die Karte verhindert Meat Damage vollständig, öffnet aber ein Korp-gesteuertes Event-Modification-Fenster, in dem die Korp 0 bis zur Schadenshöhe Credits zahlen kann; jeder gezahlte Credit lässt genau 1 Meat Damage durch.

Shared- und Katalogtext wurden an den lokalen Kartentext angepasst. PublicPayloads enthalten Quelle, Beträge und Ergebnis, aber keine privaten Grip-, Stack-, HQ- oder RD-Details.

## Tests

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` - grün, 470 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 2 Dateien / 48 Tests.
- `corepack pnpm typecheck` - grün.

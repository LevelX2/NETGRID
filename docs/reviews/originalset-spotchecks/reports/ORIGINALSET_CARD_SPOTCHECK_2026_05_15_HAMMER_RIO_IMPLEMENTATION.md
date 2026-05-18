# Originalset-Spotcheck 2026-05-15 Hammer/Rio Implementation

## Umfang

Umgesetzt wurde der sequenzielle Job `spotcheck-2026-05-15-hammer-rio` mit zehn bereits decklegalen Originalset-Karten:

- `onr_v1_031_hammer`
- `onr_v1_100_misc-for-sale`
- `onr_v1_103_organ-donor`
- `onr_v1_104_playful-ai`
- `onr_v1_142_record-reconstructor`
- `onr_v1_247_haunting-inquisition`
- `onr_v1_276_viral-15`
- `onr_v1_298_planning-consultants`
- `onr_v1_339_schlaghund`
- `onr_v1_367_rio-de-janeiro-city-grid`

## Umsetzung

- `Playful AI` nutzt jetzt einen echten `playful_ai_dice_loop` mit Runner-Choice und `RandomDrawRecords` statt einer einmaligen Event-Probe.
- `Schlaghund` nutzt jetzt den spielbaren Tag-vs-Wurf-Vertrag: Bei `Runner-Tags >= Wurf` werden 10 Meat Damage ausgelöst und Schlaghund wird getrasht; bei Fehlschlag bleibt es beim öffentlichen Wurf-/Tag-Ergebnis.
- `Rio de Janeiro City Grid` triggert automatisch nach dem Passieren gerezzter ICE im eigenen Fort, würfelt deterministisch und beendet bei Wurf 1 den Run.
- `Hammer` revalidiert die offene Stealth-Verteilungschoice beim Resolve zusätzlich gegen eindeutige Optionen, aktuell installierte Stealth-Quellen und verfügbare `recurring_credit`-Counter.
- Die bestehenden Resolver für `misc.for-sale`, `Organ Donor`, `Record Reconstructor`, `Haunting Inquisition`, `Viral 15` und `Planning Consultants` wurden gegen die bestehenden Engine-/Hidden-Info-/Replay-Pfade bestätigt.
- Die Web-Chronik beschreibt nun `Schlaghund` und `Rio de Janeiro City Grid` spezifisch statt nur generische Würfelpayloads.

## Geänderte Dateien

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-hammer-rio.md`

## Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle Checks waren grün.

## Restpunkte

Keine offenen Blocker für diesen Job. Weitere noch detailliertere Edge-Case-Smokes für die bestätigten Bestandsresolver können später als reine Regressionserweiterung ergänzt werden, sind aber nicht blockernd für diese Spotcheck-Runde.

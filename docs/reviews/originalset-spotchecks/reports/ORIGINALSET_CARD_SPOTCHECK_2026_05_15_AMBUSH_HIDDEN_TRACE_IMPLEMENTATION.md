# Originalset-Spotcheck 2026-05-15 Ambush/Hidden/Trace Implementation

Quelle: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-ambush-hidden-trace.md`

Status: `done`

## Ergebnis

Der Lauf hat die ursprünglichen Teilfixes und die vier nachgezogenen Vollresolver umgesetzt und grün getestet. Der Gesamtjob ist erledigt.

## Umgesetzte Teilfixes

| Karte | Umsetzung |
|---|---|
| Setup! | Access-Schaden auf 2 Net Damage korrigiert; Archives-Zugriff no-op; R&D-Reveal-Payload ergänzt. |
| Virus Test Site | Schaden skaliert mit `max(1, advancementCounters * 2)`; Archives-Zugriff no-op; R&D-Reveal-Payload ergänzt. |
| Information Laundering | Rezzed Asset-Aktion skaliert mit Advancement-Countern, trasht die Quelle und publiziert Counter-/Credit-/Selftrash-Felder. |
| Edited Shipping Manifests | Access-Replacement-Draw wird als `corpDrawnCount` redigiert veröffentlicht; Zugriff bleibt ersetzt. |
| Fragmentation Storm | Erfolgreicher Folge-`continue_run` publiziert getrashte installierte Programmdefinition, Typ und Anzahl. |
| Skälderviken SA Beta Test Site | Rez-LegalAction und Chronik machen die öffentliche Black-ICE-Kostenreduktion samt Quelle sichtbar. |
| Self-Modifying Code | Run-/Encounter-Resolver mit Source-Trash, privater Stack-Programmauswahl, öffentlichem Reveal, Installkosten, MU-Folgechoice, Install und Shuffle ergänzt. |
| Fait Accompli | Fortgebundene Power-Counter nach erfolgreichem Remote-Run erhöhen die Agenda-Difficulty nur in diesem Fort. |
| Emergency Self-Construct | Flatline-Replacement und Meat-Damage-Prevention mit side-sicherem Payload, Gripverlust-Zählung, Core-Damage-Removal, Handgröße -1 und 3-Aktionen-Schuld ergänzt. |
| Crystal Palace Station Grid | Power-Counter wirken servergebunden auf Agenda-Difficulty nur im eigenen Fort. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` grün, 479 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` grün, 17 Testdateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` grün, 2 Testdateien / 48 Tests.
- `corepack pnpm typecheck` grün.

## Geänderte Dateien

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-ambush-hidden-trace.md`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

# Originalset-Spotcheck 2026-05-15 Tagged/Wall/Breaker

Job: `spotcheck-2026-05-15-tagged-wall-breaker`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Runner-Breaker-, tagged Operation- und ICE-/Wall-Pfade wurden gegen LegalAction-/`applyAction`-Revalidation, Hidden-until-rez, Damage-Redaction und Replay/StateHash nachgehärtet.

Commit-Status: `done`. Der lokale Commit wurde nach Worktree-Gitdir-Entsperrung erfolgreich erstellt.

## Umgesetzte Härtungen

- `Codecracker` bricht `Filter` mit 0-Credit-Break im aktiven Encounter und erhält keine Break-Aktion gegen Wall-ICE.
- `Filter` bleibt vor Rez in Runner-Server-Views verdeckt; 0-Credit-Rez verändert die Korp-Credits nicht.
- `Netwatch Credit Voucher` bleibt auf dem aktuell führenden Engine-/Shared-Vertrag `gain 1 credit`; der abweichende Snapshot-Hinweis `gain 4` wurde als Konflikt dokumentiert und nicht still übernommen.
- `Netwatch Credit Voucher` und `Scorched Earth` sind tagged-only und werden gegen Tag-Drift beim `applyAction` abgesichert.
- `Data Wall`, `Data Wall 2.0` und `Rock Is Strong` behalten getrennte Rez-/Stärke-Werte und hidden-until-rez.
- `Wall of Ice` bleibt bei zwei Net-Damage-Subroutinen plus ETR replay-stabil und redigiert private Grip-Inhalte.

## Kartenstatus

| Karte | Card ID | Status | Notiz |
|---|---|---|---|
| Codecracker | `onr_v1_014_codecracker` | completed | 0-Credit-Code-Gate-Break und Wall-Negativfall geprüft. |
| Filter | `onr_v1_244_filter` | completed | Hidden-until-rez, 0-Rez und Codecracker-Break geprüft. |
| Netwatch Credit Voucher | `onr_v1_293_netwatch-credit-voucher` | completed | Tagged-only, Tag-Drift und aktueller `gain 1`-Vertrag dokumentiert. |
| Laser Wire | `onr_v1_253_laser-wire` | completed | Bestehender Damage/ETR-Wall-Pfad bleibt durch Wall-/Damage-Regressionen abgedeckt. |
| Rock Is Strong | `onr_v1_265_rock-is-strong` | completed | Rez-Kosten 6, Stärke 5 und Hidden-until-rez geprüft. |
| Scorched Earth | `onr_v1_302_scorched-earth` | completed | Tagged-only Meat-Damage, Redaction und Replay geprüft. |
| Data Wall 2.0 | `onr_v1_238_data-wall-2-0` | completed | Rez-Kosten 2, Stärke 1 und Source-Trennung geprüft. |
| Wall of Ice | `onr_v1_278_wall-of-ice` | completed | Mehrfach-Net-Damage und Run-Ende replay-stabil geprüft. |
| Reinforced Wall | `onr_v1_263_reinforced-wall` | completed | Bestehender Doppel-ETR-Pfad bleibt durch V1.1.2K-Regressionen abgedeckt. |
| Data Wall | `onr_v1_237_data-wall` | completed | Rez-Kosten 1, Stärke 0 und Source-Trennung geprüft. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test -- --runInBand "Originalset Spotcheck 2026-05-15 Tagged/Wall/Breaker hardening"`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün.

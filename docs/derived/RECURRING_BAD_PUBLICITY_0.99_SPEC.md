# Recurring Credits/Bad Publicity 0.99 Specification

Status: Spezifikation für V0.99d
Stand: 2026-05-04

## Regelbasis

- CR 1.10.4 trennt Credits auf Karten vom Credit Pool; sie können nur nach Kartentext ausgegeben werden.
- CR 1.10.5 legt Recurring Credits auf eine aktive Karte und refresht sie am Beginn des passenden Zuges vor Start-of-Turn-Fähigkeiten; sie akkumulieren nicht über den angezeigten Wert.
- CR 10.6 legt Bad Publicity als Corp-Counter fest. Der Runner erhält beim Run-Start einen Bad-Publicity-Fund, und ungenutzte Bad-Publicity-Credits werden nach dem Run zurückgegeben.

## Recurring Credits

| Aspekt | V0.99d-Regel |
|---|---|
| Karte | `v099_recurring_chip` ist lokale Runner-Hardware mit `recurringCredits: 1`. |
| Install | Beim Installieren wird `counters.recurring_credit` auf 1 gesetzt. |
| Refresh | Zu Beginn des Runner-Zugs werden Recurring-Credit-Counter auf ihren Karten-Maximalwert gesetzt. |
| Akkumulation | Mehr als der Karten-Maximalwert ist nicht möglich. |
| Ausgabe | In V0.99 nur für Runner-Programminstallkosten. |

## Bad Publicity

| Aspekt | V0.99d-Regel |
|---|---|
| Karte | `v099_bad_publicity_operation` ist lokale Corp-Operation und gibt der Corp 1 Bad Publicity. |
| Counter-Ort | `corp.badPublicity` bleibt Side-State. |
| Run-Start | `run.badPublicityCredits` wird auf den aktuellen Corp-Bad-Publicity-Wert gesetzt. |
| Ausgabe | In V0.99 nur für Runner-Kosten während eines Runs, insbesondere Pump/Break-Harness-Kosten. |
| Run-Ende | Der temporäre Fund verschwindet mit `run`. |
| Späte Änderungen | Änderungen an `corp.badPublicity` nach Run-Start ändern den aktuellen Run-Fund nicht. |

## Visibility

- Recurring Credits auf offener Runner-Hardware sind sichtbar.
- Bad Publicity ist öffentliche Corp-Information.
- Der temporäre Run-Fund darf als Zahl in `PlayerView.run.badPublicityCredits` sichtbar sein.
- Keine dieser Mechaniken darf Hidden-Zone-Karten oder private Auswahloptionen offenlegen.

## Tests

- V099-T012 Recurring Install/Refresh.
- V099-T013 Recurring Spend Revalidation.
- V099-T014 Bad Publicity Operation.
- V099-T015 Bad Publicity Run Fund.
- V099-T016 Bad Publicity Replay/StateHash.
- V099-T017 No Scope.

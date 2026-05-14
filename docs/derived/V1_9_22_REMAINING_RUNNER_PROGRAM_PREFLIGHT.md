# V1.9.22 Remaining Runner Program Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-/Nutzerklaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach den install-only-Schnitten fuer acht nicht-Breaker-Programme und dem `Shield`-Resolver bleiben fuenf Runner-Programm-Zielkarten ohne engen Runtime-Resolver: `Flak`, `Hammer`, `Japanese Water Torture`, `Reflector` und `Zetatech Software Installer`.

## Kartenbefund

| Karte | Lokaler Regelkern | Blockierender Vertrag |
| --- | --- | --- |
| `Flak` | Icebreaker, Installkosten 4, MU 1, Staerke 2; bricht AP-Subroutinen fuer 0 und pumpt +1 Staerke fuer 1. | AP-Subroutine-Taxonomie, Encounter-Breaker-Action und Kosten-/Staerke-Revalidation. |
| `Hammer` | Icebreaker/noisy, Installkosten 2, MU 1, Staerke 2; bricht Wall-Subroutinen fuer 0, pumpt +1 Staerke fuer 1 und verbraucht Stealth-Card-Ressourcen beim Brechen. Errata: Noisy-Karten duerfen auch ohne Stealth-Karten genutzt werden. | Wall-Subroutine-Taxonomie, Stealth-Ressourcenverlust wenn Stealth-Karten vorhanden sind, Kostenprojektion und Replay-Payload. |
| `Japanese Water Torture` | Icebreaker, Installkosten 7, MU 1, Staerke 2; bricht Wall-Subroutinen fuer 0 und hat variable +X-Staerke mit zukuenftiger Aktionsschuld. | Variable Zahlung, Future-Action-Debt, Turn-/Action-Filter und StateHash-Rekonstruktion. |
| `Reflector` | Icebreaker, Installkosten 2, MU 1, Staerke 4; bricht Stun-, Hellbolt- oder Knockout-Subroutinen fuer 0. | Stun-/Hellbolt-/Knockout-Subroutine-Taxonomie und Break-LegalAction-Projektion. |
| `Zetatech Software Installer` | Programm, MU 1; zwei recurring restricted credits fuer Programminstallationen inkl. Overlying. Errata: 2 Credits kommen aus der Bank und werden bei Nutzung zu Beginn des naechsten Runner-Zugs aus der Bank ersetzt. | Installkosten-Bestaetigung, restricted Programminstallations-Credits, Overlay-Installationsvertrag. |

## Entscheidung

Kein Runtime-Code in diesem Preflight. Die vier Breaker duerfen nicht als reine install-only Programme freigeschaltet werden, solange ihre Break-/Pump-Aktionen nicht gleichzeitig side-sicher und applyAction-validiert projiziert werden. `Zetatech Software Installer` bleibt wegen `installCost: null` und Overlay-Vertrag fachlich blockiert, aber sein Recurring-/Refresh-Vertrag ist durch Errata 1.70 vorbereitet.

## Zusaetzliche Klaerung

`Newsgroup Filter` gehoert nicht mehr zu den offenen Restkarten ohne bekannten Faehigkeitsvertrag. Die Nutzerklaerung vom 2026-05-14 bestaetigt Installkosten 5, MU 2 und `[A]: Gain 2 Credits`. Der spaetere Code-Schnitt bleibt trotzdem aus diesem Preflight heraus, weil hier keine Runtime-Umsetzung erfolgt.

## Removal Condition

Der naechste Runner-Programm-Code-Schnitt kann beginnen, sobald fuer genau eine Karte feststeht:

1. welche LegalActions durch die Karte erzeugt oder veraendert werden,
2. wie `applyAction` Kosten, Staerke, Subroutine-Typen oder Overlay erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Effekt rekonstruiert.

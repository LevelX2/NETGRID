# V1.9.22 Remaining Runner Program Preflight

Stand: 2026-05-14
Status: WIP-Preflight, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach den install-only-Schnitten fuer acht nicht-Breaker-Programme und dem `Shield`-Resolver bleiben fuenf Runner-Programm-Zielkarten ohne engen Runtime-Resolver: `Flak`, `Hammer`, `Japanese Water Torture`, `Reflector` und `Zetatech Software Installer`.

## Kartenbefund

| Karte | Lokaler Regelkern | Blockierender Vertrag |
| --- | --- | --- |
| `Flak` | Icebreaker, Installkosten 4, MU 1, Staerke 2; bricht AP-Subroutinen fuer 0 und pumpt +1 Staerke fuer 1. | AP-Subroutine-Taxonomie, Encounter-Breaker-Action und Kosten-/Staerke-Revalidation. |
| `Hammer` | Icebreaker/noisy, Installkosten 2, MU 1, Staerke 2; bricht Wall-Subroutinen fuer 0, pumpt +1 Staerke fuer 1 und verbraucht Stealth-Card-Ressourcen beim Brechen. | Wall-Subroutine-Taxonomie, Stealth-Ressourcenverlust, Kostenprojektion und Replay-Payload. |
| `Japanese Water Torture` | Icebreaker, Installkosten 7, MU 1, Staerke 2; bricht Wall-Subroutinen fuer 0 und hat variable +X-Staerke mit zukuenftiger Aktionsschuld. | Variable Zahlung, Future-Action-Debt, Turn-/Action-Filter und StateHash-Rekonstruktion. |
| `Reflector` | Icebreaker, Installkosten 2, MU 1, Staerke 4; bricht Stun-, Hellbolt- oder Knockout-Subroutinen fuer 0. | Stun-/Hellbolt-/Knockout-Subroutine-Taxonomie und Break-LegalAction-Projektion. |
| `Zetatech Software Installer` | Programm, MU 1; zwei recurring restricted credits fuer Programminstallationen inkl. Overlying. | Installkosten-Bestaetigung, restricted Programminstallations-Credits, Overlay-Installationsvertrag. |

## Entscheidung

Kein Runtime-Code in diesem Preflight. Die vier Breaker duerfen nicht als reine install-only Programme freigeschaltet werden, solange ihre Break-/Pump-Aktionen nicht gleichzeitig side-sicher und applyAction-validiert projiziert werden. `Zetatech Software Installer` bleibt wegen `installCost: null` und Overlay-Vertrag fachlich blockiert.

## Removal Condition

Der naechste Runner-Programm-Code-Schnitt kann beginnen, sobald fuer genau eine Karte feststeht:

1. welche LegalActions durch die Karte erzeugt oder veraendert werden,
2. wie `applyAction` Kosten, Staerke, Subroutine-Typen oder Overlay erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Effekt rekonstruiert.

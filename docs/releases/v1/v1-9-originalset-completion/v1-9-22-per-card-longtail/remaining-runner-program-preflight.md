# V1.9.22 Remaining Runner Program Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-/Nutzerklaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach den install-only-, Shield-, Breaker-, Hammer-Choice-, Zetatech-Recurring- und Zetatech-Overwrite-Schnitten bleiben keine Runner-Programm-Zielkarten mehr ohne engen Runtime-WIP. Offen sind weiterhin finale Promotion-Folgepunkte.

## Kartenbefund

| Karte | Lokaler Regelkern | Noch offene Umsetzung |
| --- | --- | --- |
| `Flak` | Icebreaker, Installkosten 4, MU 1, Staerke 2; `1: Break AP subroutine`; `1: +1 Strength`; AP-Subroutine = Subroutine auf AP-ICE; Standard-Breaker-Vertrag bestaetigt. | Runtime-LegalActions, `applyAction`, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Hammer` | Icebreaker/Noisy, Installkosten 2, MU 1, Staerke 2; `1: Break Wall subroutine`; `1: +1 Strength`; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl falls mehrere Quellen verfuegbar sind; Noisy-Karten duerfen auch ohne Stealth-Karten genutzt werden. | Runtime-LegalActions, `applyAction`, Noisy-Stealth-Loss-Choice falls erforderlich, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Japanese Water Torture` | Icebreaker, Installkosten 7, MU 1, Staerke 2; `0: Break Wall subroutine`; `X: +X strength, and forgo your next X actions`; Wall-Subroutine = Subroutine auf Wall-ICE; Aktionsschuld bleibt ueber Zugwechsel bis bezahlt; Standard-Breaker-Vertrag bestaetigt. | Runtime-LegalActions, `applyAction`, Future-Action-Debt-State, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Reflector` | Program/Icebreaker, Installkosten 2, MU 1, Staerke 4; `0: Break stun, hellbolt or knockout subroutine`; Zielkategorien nach benanntem Effekt/Text; Standard-Breaker-Vertrag bestaetigt. | Runtime-LegalActions, `applyAction`, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Zetatech Software Installer` | Programm, Installkosten 0, MU 1; zwei recurring restricted credits fuer Programminstallationen. Errata: 2 Credits kommen aus der Bank und werden bei Nutzung zu Beginn des naechsten Runner-Zugs aus der Bank ersetzt. | Restricted Programminstallations-Credits, Refresh und Overwrite per Trash-vor-Install sind als WIP umgesetzt; kein Host- oder MU-freier Overlay-Pfad. |

## Entscheidung

Kein weiterer Runtime-Code in diesem Preflight. Nach Nutzerentscheidung vom 2026-05-14 sind die Subroutine-Taxonomie, der Standard-Breaker-Vertrag, die `Japanese Water Torture`-Aktionsschuld, der `Hammer`-Noisy-Stealth-Verlust und die `Zetatech Software Installer`-Recurring-/Overwrite-Pfade inzwischen als enge nicht-promotende Runtime-WIPs umgesetzt. Offen bleibt fuer Runner-Programme finale Catalog-/AI-/Release-Promotion.

## Breaker-Vertrag

- `Wall subroutine`: jede Subroutine auf einem ICE mit Subtype `Wall`.
- `AP subroutine`: jede Subroutine auf einem ICE mit Subtype `AP`.
- `stun`, `hellbolt`, `knockout`: gezielt markierte Subroutine-Kategorien nach benanntem Effekt/Text.
- Icebreaker duerfen nur installiert und waehrend eines Encounters mit dem aktuellen gerezzten ICE genutzt werden.
- Breaker-Staerke muss mindestens aktueller ICE-Staerke entsprechen, bevor eine passende Subroutine gebrochen werden darf.
- Der Runner waehlt einzelne passende, noch ungebrochene Subroutinen; Kosten werden sofort bezahlt; gebrochene Subroutinen werden beim Resolve uebersprungen.
- `Japanese Water Torture` erzeugt mit `X: +X strength` echte Aktionsschuld: Der Runner verliert seine naechsten X normalen Aktionen, auch ueber Zugwechsel hinweg, bis die Schuld abgetragen ist.

## Zusaetzliche Klaerung

`Newsgroup Filter` gehoert nicht mehr zu den offenen Restkarten ohne bekannten Faehigkeitsvertrag. Die Nutzerklaerung vom 2026-05-14 bestaetigt Installkosten 5, MU 2 und `[A]: Gain 2 Credits`. Der spaetere Code-Schnitt bleibt trotzdem aus diesem Preflight heraus, weil hier keine Runtime-Umsetzung erfolgt.

## Removal Condition

Der naechste Runner-Programm-Code-Schnitt kann fuer `Flak`, `Japanese Water Torture` oder `Reflector` beginnen. Dabei muss fuer genau eine Karte umgesetzt und getestet werden:

1. welche LegalActions durch die Karte erzeugt oder veraendert werden,
2. wie `applyAction` Kosten, Staerke, Subroutine-Typen oder Overwrite erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Effekt rekonstruiert.

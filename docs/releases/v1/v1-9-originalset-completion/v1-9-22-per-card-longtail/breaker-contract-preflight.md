# V1.9.22 Breaker Contract Preflight

Stand: 2026-05-14
Status: fachlicher Breaker-Vertrag durch Nutzerentscheidung geschlossen, keine Runtime-, Catalog-, AI- oder Release-Promotion

## Zweck

Dieser Preflight schliesst den fachlichen Vertrag fuer die verbleibenden V1.9.22-Breaker `Flak`, `Hammer`, `Japanese Water Torture` und `Reflector` so weit, dass ein enger technischer Runtime-Schnitt planbar ist.

## Nutzerentscheidungen

### Subroutine-Taxonomie

- `Wall subroutine`: jede Subroutine auf einem ICE mit Subtype `Wall`.
- `AP subroutine`: jede Subroutine auf einem ICE mit Subtype `AP`.
- `stun`, `hellbolt`, `knockout`: gezielt markierte Subroutine-Kategorien nach benanntem Effekt/Text.

### Standard-Breaker-Vertrag

- Der Icebreaker muss installiert sein.
- Die Breaker-Faehigkeit darf nur waehrend eines Encounters mit dem aktuellen gerezzten ICE genutzt werden.
- Die Breaker-Staerke muss mindestens der aktuellen ICE-Staerke entsprechen, bevor eine Subroutine gebrochen werden darf.
- Der Runner waehlt eine passende, noch ungebrochene Subroutine.
- Kosten werden sofort gezahlt.
- `applyAction` revalidiert Seite, `actionId`, `stateVersion`, Encounter, installierte Quelle, Breaker-Staerke, ICE-Staerke, Subroutine-Kategorie, Subroutine-Index und Kosten.
- Gebrochene Subroutinen werden beim Resolve uebersprungen.
- PublicPayloads duerfen nur oeffentliche ICE-/Subroutine-Positionen, Kosten, Breaker-Quelle und gebrochene Subroutine-Indizes enthalten; keine verdeckten Kartendaten.
- Replay/StateHash muss die gleiche Break-Sequenz deterministisch rekonstruieren.

### Japanese Water Torture

`X: +X strength, and forgo your next X actions` erzeugt echte Aktionsschuld:

- Der Runner verliert seine naechsten X normalen Aktionen.
- Die Schuld bleibt ueber Zugwechsel hinweg bestehen, bis sie vollstaendig abgetragen ist.
- Die Schuld wird beim naechsten Runner-Aktionsfenster vor frei waehlbaren normalen Aktionen abgebaut.
- Bonus-Runs oder Effekte ausserhalb normaler Aktionen bezahlen diese Schuld nicht, ausser ein spaeterer Vertrag fuer genau diesen Effekt etwas anderes sagt.

### Hammer / Noisy

`Whenever you break a wall subroutine with Hammer, lose a total of [2] from stealth cards` wird lokal so ausgelegt:

- Der Verlust triggert nur, wenn Hammer tatsaechlich eine Wall-Subroutine bricht.
- Der Runner verliert insgesamt bis zu 2 von Stealth-Karten.
- Wenn weniger als 2 auf Stealth-Karten verfuegbar ist, verliert der Runner alles Verfuegbare.
- Wenn mehr als 2 verteilt verfuegbar ist, waehlt der Runner, wie viel von welcher Stealth-Karte verloren wird.
- Wenn keine Stealth-Karte oder keine Stealth-Ressource verfuegbar ist, wird trotzdem gebrochen; es wird nichts verloren.

## Kartenvertrag

| Karte | Geschlossener fachlicher Vertrag | Noch technische Umsetzung |
| --- | --- | --- |
| `Flak` | Install 4, MU 1, Staerke 2; `1: Break AP subroutine`; `1: +1 Strength`; AP-Subroutine ueber ICE-Subtype `AP`; Standard-Breaker-Vertrag. | Runtime-LegalActions, `applyAction`, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Hammer` | Install 2, MU 1, Staerke 2; `1: Break Wall subroutine`; `1: +1 Strength`; Wall-Subroutine ueber ICE-Subtype `Wall`; Standard-Breaker-Vertrag; Noisy braucht keine Stealth-Karte im Spiel; beim Hammer-Break verliert der Runner insgesamt bis zu 2 von Stealth-Karten, Verteilung nach Runner-Wahl. | Runtime-LegalActions, Noisy-Stealth-Loss-Choice falls erforderlich, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Japanese Water Torture` | Install 7, MU 1, Staerke 2; `0: Break Wall subroutine`; `X: +X strength` plus echte naechste-X-Aktionsschuld ueber Zugwechsel; Standard-Breaker-Vertrag. | Runtime-LegalActions, Future-Action-Debt-State, PublicPayload, Replay/StateHash, AI-Fallback. |
| `Reflector` | Install 2, MU 1, Staerke 4; `0: Break stun, hellbolt or knockout subroutine`; Zielkategorien nach benanntem Subroutine-Effekt/Text; Standard-Breaker-Vertrag. | Runtime-LegalActions, Kategorie-Markierung, PublicPayload, Replay/StateHash, AI-Fallback. |

## Implementierungshinweis

Der kleinste saubere Code-Schnitt ist `Flak`, weil er keine zusaetzliche dauerhafte Sonderstate-Schuld und keine Noisy-/Stealth-Folge braucht. `Reflector` ist aehnlich klein, sofern die Subroutine-Kategorie-Markierung fuer `stun`, `hellbolt` und `knockout` direkt an vorhandene Subroutine-Definitionen gehaengt werden kann. `Hammer` ist fachlich geschlossen, braucht aber bei vorhandenen Stealth-Ressourcen eine zusaetzliche Runner-Verteilungsentscheidung. `Japanese Water Torture` sollte nach dem einfachen Breaker-Pfad folgen, weil der Future-Action-Debt-State ein eigener Persistenz- und Replayfall ist.

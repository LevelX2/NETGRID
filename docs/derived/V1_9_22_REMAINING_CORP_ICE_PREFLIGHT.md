# V1.9.22 Remaining Corp ICE Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach `Zombie` bleiben vier Corp-ICE-Zielkarten ohne engen Runtime-Resolver: `Haunting Inquisition`, `Tutor`, `Viral 15` und `Virizz`. Alle vier haben lokale Kosten-/Staerke-/Effektkerne, aber ihre Effekte greifen in run-weite oder zukuenftige Timingfenster ein.

## Kartenbefund

| Karte | Lokaler Regelkern | Blockierender Vertrag |
| --- | --- | --- |
| `Haunting Inquisition` | Code Gate, Rez 8, Staerke 6; Run-/Action-Lock fuer die naechsten sechs tatsaechlich genommenen Runner-Aktionen plus End the run. Errata: mehrere Effekte laufen parallel; Bonus-Runs ausserhalb einer Aktion werden nicht verboten. | Action-Zaehler ueber tatsaechlich genommene Aktionen, LegalAction-Filter, Zaehlerverbrauch und PublicPayload. |
| `Tutor` | Code Gate, Rez 4, Staerke 5; fuer den Rest des Runs erhalten spaeter encountered ICE eine zusaetzliche End-the-run-Subroutine. Errata: Tutor modifiziert sich nicht selbst, ausser es wird spaeter erneut encountered. | Run-weite Modifier-Struktur, Subroutine-Indexierung, Breakbarkeit und Replay-Rekonstruktion. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Timing nach Passing, Jack-out-Choice, Runner-private Programmauswahl, Mehrfachtrigger und Trash-Visibility. |
| `Virizz` | Sentry, Rez 2, Staerke 4; fuer den Rest des Runs kostet das Brechen jeder ICE-Subroutine 1 Credit extra. | Break-Kostenmodifikation in LegalActions, Interaktion mit Breaker-, Recurring- und Stealth-Credits. |

## Kleinste Kandidaten

`Tutor` und `Virizz` bleiben die kleinsten fachlichen Kandidaten, weil beide als run-weite Modifier modellierbar waeren, ohne verdeckte Kartenwahl zu oeffnen. Errata 1.70 macht `Tutor` enger, weil der Modifier nicht fuer das aktuelle Tutor-Encounter gilt. Trotzdem brauchen beide einen expliziten Engine-Vertrag, bevor Code geschrieben wird:

- `Tutor`: zusaetzliche End-the-run-Subroutine muss als deterministischer, breakbarer Zusatz an spaeteren Encounter-LegalActions erscheinen.
- `Virizz`: Zusatzkosten muessen bereits in den `break_subroutine`-LegalActions sichtbar und in `applyAction` erneut validiert werden.

## Entscheidung

Kein Runtime-Code in diesem Preflight. Eine statische ICE-Definition ohne die run-weite Folge waere fachlich unvollstaendig; ein stiller run-weiter Modifier ohne LegalAction-/applyAction-Abdeckung waere Engine-riskant. Die vier ICE bleiben daher im No-Playable-Runtime-Guard, aber die Errata-Hinweise sind als spaetere Implementierungsgrundlage dokumentiert.

## Removal Condition

Der naechste ICE-Code-Schnitt kann beginnen, sobald fuer genau eine Karte ein enger Vertrag festliegt:

1. Welche LegalActions durch den run-weiten Effekt geaendert oder ergaenzt werden,
2. wie `applyAction` die Zusatzkosten oder Zusatzsubroutinen erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Modifier rekonstruiert.

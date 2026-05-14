# V1.9.22 Remaining Corp ICE Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach `Tutor` bleiben zwei Corp-ICE-Zielkarten ohne engen Runtime-Resolver: `Haunting Inquisition` und `Viral 15`. Beide haben lokale Kosten-/Staerke-/Effektkerne, aber ihre Effekte greifen in run-weite oder zukuenftige Timingfenster ein.

## Kartenbefund

| Karte | Lokaler Regelkern | Blockierender Vertrag |
| --- | --- | --- |
| `Haunting Inquisition` | Code Gate, Rez 8, Staerke 6; Run-/Action-Lock fuer die naechsten sechs tatsaechlich genommenen Runner-Aktionen plus End the run. Errata: mehrere Effekte laufen parallel; Bonus-Runs ausserhalb einer Aktion werden nicht verboten. | Action-Zaehler ueber tatsaechlich genommene Aktionen, LegalAction-Filter, Zaehlerverbrauch und PublicPayload. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Timing nach Passing, Jack-out-Choice, Runner-private Programmauswahl, Mehrfachtrigger und Trash-Visibility. |

## Kleinste Kandidaten

`Haunting Inquisition` und `Viral 15` bleiben die offenen ICE-Kandidaten. Beide brauchen wegen Action-Lock bzw. Jack-out-/Program-trash-Timing einen expliziten Engine-Vertrag, bevor Code geschrieben wird.

## Entscheidung

Kein Runtime-Code in diesem Preflight. Eine statische ICE-Definition ohne die run-weite Folge waere fachlich unvollstaendig; ein stiller run-weiter Modifier ohne LegalAction-/applyAction-Abdeckung waere Engine-riskant. Die zwei ICE bleiben daher im No-Playable-Runtime-Guard, aber die Errata-Hinweise sind als spaetere Implementierungsgrundlage dokumentiert.

## Removal Condition

Der naechste ICE-Code-Schnitt kann beginnen, sobald fuer genau eine Karte ein enger Vertrag festliegt:

1. Welche LegalActions durch den run-weiten Effekt geaendert oder ergaenzt werden,
2. wie `applyAction` die Zusatzkosten oder Zusatzsubroutinen erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Modifier rekonstruiert.

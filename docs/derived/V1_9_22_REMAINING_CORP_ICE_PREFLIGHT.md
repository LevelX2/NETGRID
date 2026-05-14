# V1.9.22 Remaining Corp ICE Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach dem Haunting-Inquisition-WIP bleibt eine Corp-ICE-Zielkarte ohne engen Runtime-Resolver: `Viral 15`. Die Karte hat lokale Kosten-/Staerke-/Effektkerne, greift aber in run-weite Timingfenster ein.

## Kartenbefund

| Karte | Lokaler Regelkern | Blockierender Vertrag |
| --- | --- | --- |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Timing nach Passing, Jack-out-Choice, Runner-private Programmauswahl, Mehrfachtrigger und Trash-Visibility. |

## Kleinste Kandidaten

`Viral 15` bleibt der offene ICE-Kandidat. Der Pfad braucht wegen Jack-out-/Program-trash-Timing einen expliziten Engine-Vertrag, bevor Code geschrieben wird.

## Entscheidung

Der fruehere Haunting-Action-Lock-Befund ist durch den nicht-promotenden Runtime-WIP vom 2026-05-14 17:35 CEST aufgeloest. `Viral 15` bleibt im No-Playable-Runtime-Guard; die Errata-Hinweise sind als spaetere Implementierungsgrundlage dokumentiert.

## Removal Condition

Der naechste ICE-Code-Schnitt kann beginnen, sobald fuer genau eine Karte ein enger Vertrag festliegt:

1. Welche LegalActions durch den run-weiten Effekt geaendert oder ergaenzt werden,
2. wie `applyAction` die Zusatzkosten oder Zusatzsubroutinen erneut validiert,
3. welche PublicPayload-Felder den Effekt side-sicher nachweisen,
4. welcher Replay-/StateHash-Smoke den Modifier rekonstruiert.

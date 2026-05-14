# V1.9.22 Remaining Corp Longtail Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach `Tutor` bleiben vier Corp-Longtail-Zielkarten ohne engen Runtime-Resolver. Alle vier haben lokale Kartenfakten, aber nicht alle Fakten reichen bereits fuer einen side-sicheren, replay-stabilen LegalAction-/applyAction-Vertrag.

## Kartenbefund

| Karte | Lokaler Regelkern | Offener Implementierungsvertrag |
| --- | --- | --- |
| `Data Fort Reclamation` | On score: 10 temporaere Credits, bis zu 4 HQ-Karten auswaehlen, neues Data Fort erstellen, Karten nacheinander installieren und ggf. rezzen, Restcredits zurueckgeben. Errata: zusaetzliche Credits aus dem Korp-Pool duerfen genutzt werden; es werden keine Aktionen gewonnen. | Private HQ-Choice, Install-Reihenfolge, Server-/Root-/ICE-Ziele je Karte, optionale Rez-Fenster und temporaerer Credit-Pool plus zusaetzlicher Korp-Credit-Zahlpfad. |
| `Security Purge` | On score: Top 3 R&D revealn; ICE installieren und rezzen; Rest trashen. Errata: weniger als drei R&D-Karten ist erlaubt; Effekt soweit moeglich. "At no cost" meint gedruckte Rez-Kosten, nicht zusaetzliche Kosten. | Serverzielwahl je ICE, Reihenfolge, zusaetzliche Kosten und side-sichere Reveal-Payloads. Teilmengen-Optionalitaet ist nicht mehr fuehrende Annahme. |
| `Haunting Inquisition` | Code Gate, Rez 8, Staerke 6; Run-/Action-Lock fuer die naechsten sechs tatsaechlich genommenen Runner-Aktionen plus End the run. Errata: mehrere Effekte laufen parallel; Bonus-Runs ausserhalb einer Aktion werden nicht verboten. | Action-Zaehler, LegalAction-Filter fuer tatsaechliche Aktionen, Persistenz ueber Zugwechsel und PublicEvent-Text. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Timingfenster nach Passing, Jack-out-Choice, Runner-private Programmauswahl, Trash-Visibility und Mehrfachtrigger. |

## Entscheidung

Keiner dieser Restpfade wird in diesem Vorbereitungsschnitt als Runtime-Code umgesetzt. Errata 1.70 reduziert mehrere fachliche Luecken, ersetzt aber nicht die spaetere Engine-Modellierung fuer Choices, Payloads und Replay/StateHash. Der bestehende No-Playable-Runtime-Guard fuer die vier Karten bleibt korrekt.

## Naechste konkrete Entfernung

Der naechste Code-Schnitt sollte genau eine dieser Karten freigeben, sobald ihr offener Vertrag geschlossen ist. Nach Errata 1.70 bleibt `Security Purge` ein kleiner Kandidat, wenn Serverziel/Reihenfolge festgelegt sind.

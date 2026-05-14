# V1.9.22 Remaining Corp Longtail Preflight

Stand: 2026-05-14
Status: WIP-Preflight mit Errata-1.70-Klaerung, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach dem Haunting-Inquisition-WIP bleiben zwei Corp-Longtail-Zielkarten ohne engen Runtime-Resolver. Beide haben lokale Kartenfakten, aber nicht alle Fakten reichen bereits fuer einen side-sicheren, replay-stabilen LegalAction-/applyAction-Vertrag.

## Kartenbefund

| Karte | Lokaler Regelkern | Offener Implementierungsvertrag |
| --- | --- | --- |
| `Data Fort Reclamation` | On score: 10 temporaere Credits, bis zu 4 HQ-Karten auswaehlen, neues Data Fort erstellen, Karten nacheinander installieren und ggf. rezzen, Restcredits zurueckgeben. Errata: zusaetzliche Credits aus dem Korp-Pool duerfen genutzt werden; es werden keine Aktionen gewonnen. | Private HQ-Choice, Install-Reihenfolge, Server-/Root-/ICE-Ziele je Karte, optionale Rez-Fenster und temporaerer Credit-Pool plus zusaetzlicher Korp-Credit-Zahlpfad. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Timingfenster nach Passing, Jack-out-Choice, Runner-private Programmauswahl, Trash-Visibility und Mehrfachtrigger. |

## Entscheidung

`Security Purge` und `Haunting Inquisition` sind inzwischen als nicht-promotende Runtime-WIPs umgesetzt. Errata 1.70 reduziert mehrere fachliche Luecken, ersetzt aber fuer die verbleibenden Karten nicht die spaetere Engine-Modellierung fuer Choices, Payloads und Replay/StateHash. Der bestehende No-Playable-Runtime-Guard bleibt fuer `Data Fort Reclamation` und `Viral 15` korrekt.

## Naechste konkrete Entfernung

Der naechste Code-Schnitt sollte genau eine dieser Karten freigeben, sobald ihr offener Vertrag geschlossen ist. Nach Errata 1.70 bleibt `Security Purge` ein kleiner Kandidat, wenn Serverziel/Reihenfolge festgelegt sind.

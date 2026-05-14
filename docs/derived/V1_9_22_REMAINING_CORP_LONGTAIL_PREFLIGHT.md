# V1.9.22 Remaining Corp Longtail Preflight

Stand: 2026-05-14
Status: Historischer WIP-Preflight mit Errata-1.70-Klaerung; Runtime-WIPs umgesetzt, keine Catalog-/AI-Promotion

## Ziel

Nach dem Haunting-Inquisition-WIP waren noch zwei Corp-Longtail-Zielkarten ohne engen Runtime-Resolver offen. Dieser historische Befund ist durch die spaeteren `Data Fort Reclamation`- und `Viral 15`-WIP-Schnitte teilweise ueberholt; offen bleiben Follow-up- und Promotion-Gates.

## Kartenbefund

| Karte | Lokaler Regelkern | Offener Implementierungsvertrag |
| --- | --- | --- |
| `Data Fort Reclamation` | On score: 10 temporaere Credits, bis zu 4 HQ-Karten auswaehlen, neues Data Fort erstellen, Karten nacheinander installieren und ggf. rezzen, Restcredits zurueckgeben. Errata: zusaetzliche Credits aus dem Korp-Pool duerfen genutzt werden; es werden keine Aktionen gewonnen. | Erster Runtime-WIP deckt private HQ-Choice, neues Data Fort und Install-Reihenfolge ab. Offen bleiben optionale Rez-Fenster und temporaerer Credit-Pool plus zusaetzlicher Korp-Credit-Zahlpfad. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. Errata: Runner waehlt die zu trashenden Programme. | Runtime-WIP deckt Jack-out-Tax, Passing-Trigger, Runner-private Programmauswahl, Trash-Visibility und Replay/StateHash ab. Offen bleiben nur finale AI-/Catalog-/Release-Promotion-Gates. |

## Entscheidung

`Security Purge`, `Haunting Inquisition`, `Data Fort Reclamation` und `Viral 15` sind inzwischen als nicht-promotende Runtime-WIPs umgesetzt. Der bestehende No-Release-Promotion-Guard bleibt fuer alle V1.9.22-Zielkarten korrekt; der alte No-Playable-Runtime-Guard fuer `Viral 15` ist ueberholt.

## Naechste konkrete Entfernung

Der naechste Code-Schnitt sollte `Data Fort Reclamation` optionales Rezzen/temporaere Credit-Ausgaben oder `Zetatech Software Installer` Overlay-Vertrag adressieren. Danach bleiben finale AI-/Catalog-/Webclient-/Review-Gates.

# V1.9.22 Remaining Corp Longtail Preflight

Stand: 2026-05-13
Status: WIP-Preflight, keine Runtime-/Catalog-/AI-Promotion

## Ziel

Nach `Edgerunner, Inc., Temps` bleiben sechs Corp-Longtail-Zielkarten ohne engen Runtime-Resolver. Alle sechs haben lokale Kartenfakten, aber nicht alle Fakten reichen bereits fuer einen side-sicheren, replay-stabilen LegalAction-/applyAction-Vertrag.

## Kartenbefund

| Karte | Lokaler Regelkern | Offener Implementierungsvertrag |
| --- | --- | --- |
| `Data Fort Reclamation` | On score: 9 temporaere Credits, bis zu 4 HQ-Karten auswaehlen, neues Data Fort erstellen, Karten nacheinander installieren und ggf. rezzen, Restcredits zurueckgeben. | Private HQ-Choice, Install-Reihenfolge, Server-/Root-/ICE-Ziele je Karte, optionale Rez-Fenster und temporaerer Credit-Pool. |
| `Security Purge` | On score: Top 3 R&D revealn; beliebige ICE kostenlos installieren und rezzen; Rest trashen. | Optionalitaet von "any ice", Serverzielwahl je ICE, Reihenfolge, kostenlose Rez-Schritte und side-sichere Reveal-Payloads. |
| `Haunting Inquisition` | Code Gate, Rez 8, Staerke 6; Run-/Action-Lock fuer die naechsten sechs Runner-Aktionen plus End the run. | Exakte Bedeutung des sechs-Aktionen-Locks, Persistenz ueber Zugwechsel, LegalAction-Filter und PublicEvent-Text. |
| `Tutor` | Code Gate, Rez 4, Staerke 5; fuer den Rest des Runs erhalten alle encountered ICE eine zusaetzliche End-the-run-Subroutine. | Run-weite Modifier-Struktur fuer spaetere Encounter, Subroutine-Indexierung, Break-/Replay-Stabilitaet. |
| `Viral 15` | Sentry, Rez 5, Staerke 3; run-weite Jack-out-Steuer und Program-trash nach dem Passieren jeder gerezzten ICE, ausser Runner jackt out. | Timingfenster nach Passing, Jack-out-Choice, Programmauswahl, Trash-Visibility und Mehrfachtrigger. |
| `Virizz` | Sentry, Rez 2, Staerke 4; fuer den Rest des Runs kostet das Brechen jeder ICE-Subroutine 1 Credit extra. | Run-weite Break-Cost-Modifikation, Kostenanzeige in LegalActions, Interaktion mit Breaker-/Recurring-/Stealth-Credits. |

## Entscheidung

Keiner dieser Restpfade soll als schneller automatischer Resolver umgesetzt werden, solange seine offenen Vertragsfelder nicht lokal bestaetigt oder als bewusst enger WIP-Vertrag dokumentiert sind. Der bestehende No-Playable-Runtime-Guard fuer die sechs Karten bleibt korrekt.

## Naechste konkrete Entfernung

Der naechste Code-Schnitt sollte genau eine dieser Karten freigeben, sobald ihr offener Vertrag geschlossen ist. Die kleinste fachlich saubere Kandidatin bleibt `Security Purge`, wenn die ICE-Auswahl und Serverzielwahl bestaetigt werden.

# V1.9.5 bis V1.9.8 Deferred-Register

Datum: 2026-05-11

## Legende

- P0: blockiert V2.x-Unlock.
- P1: wichtig für vollständigen Releaseabschluss.
- P2: Qualitäts-/Abdeckungs-/Komfortpunkt.

## Deferred-Fälle

| Release | Priorität | Besitzer | Punkt | Status | Nächste Aktion |
| --- | --- | --- | --- | --- | --- |
| V1.9.5 | P1 | release-implementation-agent | Data Darts und weitere Asset-/Node-/Modifier-Karten aus dem V1.9.5-Longtail | Deferred | Kartenliste finalisieren und je Karte Engine-Resolver planen |
| V1.9.5 | P2 | test-quality-agent | Mehrfach-Modifier- und Asset-Szenarien | Deferred | Szenariomatrix für gleichzeitige statische Effekte ergänzen |
| V1.9.6 | P1 | release-implementation-agent | Dupre | Deferred | Mechanik präzisieren, LegalActions und Tests ergänzen |
| V1.9.6 | P1 | release-implementation-agent | Virus-/Counter-/Purge-Familien außerhalb Data Raven | Deferred | Counter-Familien clustern und Resolver-Hooks erweitern |
| V1.9.6 | P2 | test-quality-agent | Multi-Counter-/PublicEvent-Szenarien | Deferred | Redaction- und Replay-Szenarien ergänzen |
| V1.9.7 | P1 | release-implementation-agent | Daemon-/Hosting-/Uninstall-/Destroy-Longtail | Deferred | Host-/Hosted-Regelmatrix auflösen |
| V1.9.7 | P2 | small-adjustments-agent | Komfort-UX für spätere Hosting-Choices | Deferred | Erst nach Engine-Semantik entscheiden |
| V1.9.8 | P0 | release-planning-agent | Vollständige L1B per-card resolver longtail Leerung | Offen | V1.9.8-Completion/V1.9.8B planen, bevor V2.x beginnt |
| V1.9.8 | P0 | release-implementation-agent | Restliche V1.9.8-Kartenresolver außerhalb Dogcatcher/Dropp | Deferred | Karte-für-Karte Resolver und Tests ergänzen |
| V1.9.8 | P1 | card-enablement-ai-knowledge-agent | Erweiterung side-safe positional AI memory auf weitere öffentliche Positionsfälle | Deferred | Nur öffentlich ableitbare Fälle aufnehmen |
| V1.9.8 | P1 | test-quality-agent | Vollständige V2-Unlock-Gate-Matrix | Deferred | Nach Longtail-Leerung Root, Typecheck, Visibility, Replay, AI-Safety und Contract erneut prüfen |

## Gate-Folge

V2.x bleibt blockiert, bis alle P0-Punkte erledigt und erneut grün verifiziert sind.

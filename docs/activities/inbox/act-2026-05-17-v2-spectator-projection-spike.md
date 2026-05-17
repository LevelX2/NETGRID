---
activityId: act-2026-05-17-v2-spectator-projection-spike
status: inbox
kind: architecture
area: shared
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.4
blockedBy: []
resultArtifacts: []
checks: []
---

# Spectator-Projektion vor Featurebau klären

## Ziel

Für V2.4 soll vorab geklärt werden, wie eine eigene Zuschauerprojektion aussehen müsste, ohne PlayerViews, Replay-Projektionen oder PublicEvents zu vermischen.

## Kontext und Quellen

- V2.4 Roadmap: Private Spectator Links, delayed public view nur nach eigenem Gate, Zuschauerrollen getrennt von PlayerViews, kein Live-Hidden-Leak, Spectator-Reconnect.
- Bestehende Architektur trennt Engine-Events, ServerEventRecords und PublicGameEvents bereits stärker.
- Spectator ist ein besonders hohes Hidden-Info-Risiko.

## Scope

- Bestehende View-/Event-/Replay-Projektionen auf Spectator-Tauglichkeit prüfen.
- Minimale Sichtklassen für Zuschauer skizzieren: private Zuschauerlinks, delayed public view, keine Live-Hidden-Zones.
- Delay-Puffer und Reconnect als eigene Risiken erfassen.
- Testschnitt für Spectator-Payload-Leakscan vorschlagen.
- Folgepakete für konkrete Projection-Builder oder Tests anlegen, falls der Schnitt klar genug ist.

## Nicht im Scope

- Keine Spectator-UI.
- Keine Spectator-Links.
- Kein Public Spectator.
- Keine Änderung an PlayerView, StateHash, Replay oder KI-Input.

## Akzeptanzkriterien

- [ ] Es ist dokumentiert, welche Projektion ein Zuschauer bekäme und welche Daten ausgeschlossen bleiben.
- [ ] Replay- und Spectator-Projektionen sind begrifflich getrennt.
- [ ] Delay, Consent, Linkschutz und Reconnect sind als offene Gatepunkte benannt.
- [ ] Mindestens ein testbarer Folge-Schnitt ist definiert oder als blockiert markiert.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Bei Unsicherheit keinen Featurebau starten; dieses Paket ist eine Architekturvorbereitung.

## Ergebnisnotiz

Noch offen.

# V1.9.20 Global Modifier And Special State Spec

Status: planned
Stand: 2026-05-13

## Modell

V1.9.20 bündelt Karten, deren Wirkung nicht nur eine einzelne Aktion auflöst, sondern Zustand und Berechnungsschichten beeinflusst:

- Handlimit/MU/Action-Economy: deterministische Ableitung aus Basiswert plus sichtbaren Quellen.
- Globale statische Modifier: server-, ICE-, Kosten-, Stärke- oder Score-bezogene Quellen mit stabiler Layer-Reihenfolge.
- Persistente Sonderzustände: sichtbare oder side-sichere Statusmarker mit Quelle, Ablauf und PublicEvent-Kontext.

## Engine-Regel

Modifier werden nicht aus Kartentext geparst. Jede Zielkarte erhält einen eng typisierten Resolver oder eine eng typisierte Helper-Familie. LegalActions zeigen nur erlaubte Aktionen aus dem aktuellen PlayerView-Kontext; `applyAction` revalidiert Quelle, Side, Timing, Ziel, Kosten und Status erneut.

## Sichtbarkeit

Öffentliche Quellen dürfen in PublicEvents und PlayerViews benannt werden. Verdeckte Zonen werden nur abstrakt oder nach bereits legalem Reveal/Access projiziert. Keine Modifier-Berechnung darf Hand, R&D, HQ, Stack oder Archives-Inhalte leaken.

## Replay

Alle neuen Statusänderungen müssen vollständig im GameState und in Public/Private Events abbildbar sein. Zufall bleibt außerhalb dieses Releases und wird erst in V1.9.21 erweitert.

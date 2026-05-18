# Mechanikpaket E 1.7.1 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.7.1 implementiert einen freigabefähigen Kern mit 5 Karten und drei Blöcken:

1. Hidden-Zone-Search/Reorder/Shuffle (runner stack)
2. Access-/Breach-Erweiterungen (HQ-Run mit deterministischem Access-Replacement)
3. Run-Flow-Erweiterung mit serverbezogenem Multiaccess-Bonus auf HQ

## Nicht-Scope

- Keine Trace-/Tag-/ActionEconomy-Breite aus V1.7.2.
- Keine Agenda-/Scored-Static-Breite aus V1.8.0.
- Keine Counter-/Virus-/Purge-Breite aus V1.8.1.
- Kein deterministischer Würfelzufall aus V1.9.0.

## Kartenvertrag V1.7.1

- `onr_v1_114_temple-microcode-outlet`
  - Event-Resolver: Search im Runner-Stack nach Programm, Karte auf die Hand, anschließend deterministisches Shuffle.
  - Hidden-Zone-Barrier in Eventlog/Payload.
- `onr_v1_106_private-ldl-access`
  - Event-Resolver: HQ-Run; erfolgreicher Run ersetzt HQ-Access durch R&D-Access.
- `onr_v1_118_weather-to-finance-pipe`
  - Event-Resolver: HQ-Run; erfolgreicher Run ersetzt Access durch Corp-Credit-Loss (`-4`).
- `onr_v1_084_edited-shipping-manifests`
  - Event-Resolver: HQ-Run; erfolgreicher Run ersetzt Access durch `Corp -1`, `Runner +1 Tag`, `Corp zieht 1`.
- `onr_v1_129_hq-interface`
  - Hardware-Static: bei HQ-Breach `+1` Access pro installierter Instanz.

## Engine-Vertrag

- RunState erlaubt deterministische Access-Replacement-Marker (Access-Server-Override, Erfolgsersatz ohne Access).
- Breach-Queue respektiert Server-Override ohne Leak: Run-Angriffsziel bleibt erhalten, Access-Ziel wird explizit abgeleitet.
- HQ-Multiaccess wird über installierte Runner-Hardware berechnet und nur auf HQ angewandt.
- Hidden-Zone-Search-Choices bleiben LegalAction-basiert, replaybar und statehash-stabil.

## Deferred-Hinweis

Der Planungskorb für V1.7.1 enthält 48 Karten. Der freigabefähige Kernrelease setzt 5 Karten um; 43 Karten bleiben in V1.7.1 deferred dokumentiert, weil zusätzliche Mechanikbreite oder Folge-Gates erforderlich sind.

# V1.9.14 Trace/Tag/Resource Spec

Stand: 2026-05-13
Status: draft-implementing

## Trace und Link

- Trace-Fenster werden als eng typisierte Pending-Choice-Fenster modelliert.
- NETGRID nutzt verbindlich die moderne offene Trace-Sequenz: Die Korp wählt zuerst ein sichtbares Gebot, danach wählt der Runner sein Gebot mit Kenntnis von Basis-Trace, Korp-Gebot, aktueller Trace-Stärke und eigenem Link.
- Der Kernvertrag lautet `traceStrength = baseTraceStrength + corpBid` und `runnerStrength = runnerLink + runnerBid + temporaryLinkBoosts`; ein Trace ist nur erfolgreich, wenn `traceStrength > runnerStrength`.
- Corp- und Runner-Bids muessen ueber LegalActions laufen und Creditkosten in `applyAction` erneut validieren.
- Base-Link, sichtbare Modifier und Trace-Ergebnis duerfen keine verdeckten Karteninformationen enthalten.
- ICE-Subroutinen mit Trace duerfen nur nach erfolgreicher Rez-/Encounter-Validierung ausloesen.
- Oeffentlich sichtbare Korp-Gebote sind ein erlaubter Trace-Schritt und kein Hidden-Info-Leak; Runner-PendingChoices und private Choice-Rohdaten bleiben ausschliesslich fuer den Runner sichtbar.
- Signpost und The Springboard nutzen moderne post-bid Trace-Link-Choices im offenen Runner-Link-Fenster; sie erzeugen kein verdecktes oder simultanes Reveal-Fenster.

## Tags

- Tag-Vermeidung und Tag-Entfernung sind eigene Choices oder Aktionen, keine freien Text-/Triggerpfade.
- Tagbedingte Resource-Trash- oder Damage-Folgen muessen Runner-PlayerView und Corp-PlayerView getrennt redigieren.
- PublicEvents nennen nur oeffentliche Tag-/Resource-Ergebnisse, keine verdeckten Handkarten oder privaten Choice-Kandidaten.

## Resources

- Runner-Resource-Aktionen pruefen installierte Zone, Controller, Kosten, Timingpunkt und einmalige Choice-Ziele.
- Corp-Resource-Trash bleibt auf legal getaggte Runner-Zustaende und sichtbare installierte Ressourcen beschraenkt.
- AI-Hints muessen Resource-Wert, Tag-Risiko und No-Action-Fallback nennen.

## Ueberlappungen

- Hidden-Zone-Pfade verwenden nur V1.9.11-Mechaniken.
- Counter-/Purge-Pfade verwenden nur V1.9.12-Mechaniken.
- Damage-/Prevention-Pfade verwenden nur V1.9.13-Mechaniken.

## Replay und StateHash

- Alle Trace-, Tag- und Resource-Entscheidungen muessen deterministisch replaybar sein.
- Randomisierte Folgen duerfen nur ueber Seed, RandomCounter und RandomDrawRecords laufen.
- Stale Action, falsche Side, falscher Timingpunkt und illegale Kosten muessen abgelehnt werden.

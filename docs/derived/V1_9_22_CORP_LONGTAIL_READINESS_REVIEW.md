# V1.9.22 Corp Longtail Readiness Review

Stand: 2026-05-13 18:14 CEST
Status: WIP-Readiness, keine Runtime- oder Release-Promotion

## Befund

Die 14 Corp-Longtail-Zielkarten des V1.9.22-Slices sind im Scope und im Catalog-WIP-Guard enthalten:

- Corporate Retreat
- Corporate War
- Data Fort Reclamation
- Marine Arcology
- Political Overthrow
- Security Purge
- Haunting Inquisition
- Tutor
- Viral 15
- Virizz
- Zombie
- Edgerunner, Inc., Temps
- Off-Site Backups
- Planning Consultants

Die V1.9.10-bis-V1.9.xx-Funktionsmatrix beschreibt fuer diese Karten nur die grobe Typoberflaeche: Agenda installieren/avancieren/scoren/stehlen, ICE installieren/rezzen/Encounter-Subroutinen oder Corp-Operation mit Soforteffekt. Das reicht fuer Scope- und No-Promotion-Guards, aber noch nicht fuer konkrete Runtime-Resolver.

Das historische V1.0.5K-Rueckstellregister liefert fuer zwei Karten engere, aber unvollstaendige Hinweise:

- Corporate War: On-score bedingter Credit-Gewinn/-Verlust.
- Political Overthrow: Scored-agenda Action: Gain Credits.

Fuer beide fehlen im Automations-Worktree noch die benoetigten Zahlen, Bedingungen, Kosten und Timingdetails. Eine Umsetzung ohne diese Werte wuerde Engine-Regeln erfinden.

## Entscheidung für den nächsten Umsetzungsschnitt

Corp-Longtailkarten bleiben bis zu einem vollstaendig lokal bestaetigten Resolververtrag aus `playable_mvp`, Release-Promotion und AI-Promotion heraus. Der bestehende Engine-Guard gegen `playable_mvp` ist korrekt.

Der naechste sichere Code-Schnitt fuer diese Gruppe ist erst moeglich, wenn mindestens eine Karte folgende lokale Informationen hat:

- bei Agendas: Advancement Requirement, Agenda Points, On-score-/Scored-Ability-Bedingung, Kosten und genaue Credit-/Counter-/Zonewirkung,
- bei ICE: Kosten, Staerke, Subtypen, Subroutinen und etwaige Ziel-/Trash-/Damage-/Trace-Wirkung,
- bei Operations: Kosten, Zielauswahl, Timingbedingung, Zonebewegung und PublicEvent-/Visibility-Vertrag.

## Removal Condition

Der Corp-Longtail-Schnitt kann in Code gehen, sobald fuer mindestens eine Corp-Zielkarte ein vollstaendiger lokaler Resolververtrag vorliegt:

- konkrete Zahlenwerte,
- LegalAction-Timing und Side,
- Ziel- und Choice-Validierung,
- Kosten-/Zusatzkostenvertrag,
- Zonebewegungen,
- PublicEvent-/PlayerView-Redaction,
- Replay-/StateHash-Erwartung,
- AI-Fallback-Verhalten.

## Gate-Auswirkung

V1.9.22 bleibt `implementing`. Dieser Review ist kein neuer fachlicher P0-Blocker, sondern eine Schutzmarke gegen erfundene Corp-Agenda-, ICE- oder Operationswirkungen.

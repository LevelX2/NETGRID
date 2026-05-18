# V1.9.15 Run/Access/Multiaccess Spec

Stand: 2026-05-13
Status: draft-implementing

## Run Flow

- Run-Start und Run-Locks bleiben LegalAction-basiert.
- Run-Ziele, Timingpunkte und Kosten muessen in `applyAction` erneut validiert werden.
- Run-Effekte duerfen keine verdeckten Server-, HQ-, R&D- oder Archives-Daten in PublicEvents oder falsche PlayerViews schreiben.

## Access und Multiaccess

- Zusatzaccess und Ersatzaccess werden als deterministische Access-Queue modelliert.
- Steal-/Trash-/Pass-Choices bleiben side-sicher und zielgebunden.
- Access-Reihenfolge, Queue-Fortschritt und StateHash muessen replaystabil bleiben.

## Ambush und ICE-Ueberlappungen

- Corp-ICE-Folgen nutzen bestehende Encounter-, Trace-, Damage-, Hidden-Zone- und Counter-Vertraege.
- Ambush-on-access darf nur aus legalem Access-Kontext entstehen und muss side-sichere Payloads erzeugen.
- Randomisierte Folgen duerfen nur ueber Seed, RandomCounter und RandomDrawRecords laufen.

## KI

- Runner-KI bekommt Run-Plan-Knoten mit legalem Abort/Fallback.
- Corp-KI bewertet Ambush, Trace-ICE und Damage-Risiko nur aus sichtbaren Board- und PlayerView-Daten.
- DecisionDebug darf keine private Zone, Payload- oder FullState-Daten enthalten.

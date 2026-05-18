# V1.9.12 Counter/Virus/Recurring Spec

Stand: 2026-05-12
Status: draft-implementing

## Engine-Vertrag

- Counter liegen ausschliesslich auf CardInstances oder bereits eingefuehrten strukturierten Feldern wie `poxCountersByServer`.
- Virus-Counter sind purgefaehig; `recurring_credit`, `power`, `agenda`, `mark` und `dividend` sind nicht purgefaehig.
- Recurring-Counter werden bei Installation initialisiert und bei Runner-Start-of-turn auf den Kartenwert gesetzt, nicht addiert.
- Kostenzahlung aus Recurring-Pools erfolgt nur ueber LegalActions mit erneutem `applyAction`-Check.
- Scored-Agenda-Counter-Aktionen benoetigen `cardId`, `agendaAbility`, erwarteten Counter-Typ, erwartete Menge und erwarteten Effekt.

## Sichtbarkeit

- Counter auf oeffentlich installierten Runner-Karten und gescorten Agendas sind oeffentlich.
- Counter auf verdeckten Korp-Karten bleiben in Runner-Views redigiert, solange keine erlaubte Reveal-/Access-Situation besteht.
- Hidden-Zone-Aktionen duerfen public nur abstrakte Angaben wie Anzahl, Zone, Counter-Typ und Effektart tragen.

## Determinismus

- Counter- und Recurring-Aenderungen muessen replaybar sein.
- Zufall ist in V1.9.12 nur erlaubt, wenn ein bestehender deterministischer RandomDrawRecord-Pfad genutzt wird.
- StateHash muss sich bei gleichem Eventlog exakt rekonstruieren lassen.

## WIP-Interpretation

Der erste Implementierungsschnitt darf Runtime-Definitionen und vorhandene Counter-/Recurring-Hooks aktivieren. Finale `human_playable`, `deck_legal` und `ai_supported`-Freigabe bleibt bis Manifest, AI-Hints, Smokes und Final Review offen.


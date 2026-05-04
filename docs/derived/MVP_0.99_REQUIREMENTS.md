# MVP 0.99 Requirements - Hosting, Viren, Purge und Counter-Familien

Status: Requirements Freeze
Stand: 2026-05-04

## Scope

V0.99 bündelt M9 und M10, wird aber intern strikt in Subgates umgesetzt:

- V0.99a: generische Counter-Basis für Karten- und Corp-Counter.
- V0.99b: Hosting und Hosted Objects als enge lokale Harness-Mechanik.
- V0.99c: Virus-Counter und Corp-Basic-Action Purge.
- V0.99d: Recurring Credits und Bad Publicity.
- V0.99e: Charge, Mark, Dividend und weitere Spezialcounter nur bei konkretem Kartenbedarf.

Regelreferenz: CR v26.03, insbesondere 1.9 Counter und Tokens, 1.10.4 Credits on Cards, 1.10.5 Recurring Credits, 1.13 Hosting, 5.2.6 Corp Basic Actions, 10.1.2 Purge Virus Counters und 10.6 Bad Publicity. Die Referenz wird nur für diesen Scope genutzt und erweitert nicht automatisch M11+.

## Ziele

- Counter werden als deterministische, validierte Engine-Daten geführt und bleiben in PlayerViews nur für offene Karten sichtbar.
- Hosting bildet eine direkte Host-Beziehung ab, ohne transitive Hosting-, Ownership- oder Control-Regeln zu öffnen.
- Virus-Counter können auf Karten liegen und Purge entfernt ausschließlich Virus-Counter über eine Corp-LegalAction.
- Recurring Credits refreshen am dokumentierten Turn-Start und werden in V0.99 eng für freigegebene Runner-Installkosten genutzt.
- Bad Publicity liegt auf der Corp, erzeugt während eines Runs einen Runner-Fund und wird nach dem Run deterministisch verworfen.
- Alle neuen Karten bleiben lokale/fiktive `playable_mvp` Harness-Karten mit Manifest, Tests und Szenarien.

## Nicht-Ziele

- Keine Prevention, Avoid, Interrupts oder Replacement.
- Keine vollständige Hosting-Regelmaschine für alle offiziellen Karten.
- Keine Hosted-Programme mit eigenem server- oder zoneübergreifendem Control-Wechsel.
- Keine Set-Aside-, Remove-from-Game-, Ownership- oder Control-Wechsel.
- Keine vollständigen Deckbuilding-, Format-, Influence- oder Faction-Regeln.
- Keine automatische Spielbarkeit durch Import, Katalog oder Deckeditor.
- Keine offiziellen Artworks, Card Frames, Logos, Card Backs oder externe Kartendatenbank-Abhängigkeiten.

## Must Requirements

| ID | Requirement |
|---|---|
| M099A-SHARED-001 | Shared Types enthalten additive Counter-, Hosting-, Recurring- und Bad-Publicity-Verträge, ohne V0.98-Verträge zu brechen. |
| M099A-COUNTER-001 | Karten-Counter werden als nicht-negative Integer pro Karte validiert und statehash-sicher gespeichert. |
| M099A-COUNTER-002 | Corp-Counter, insbesondere Bad Publicity, bleiben auf Side-State und werden nicht als Hidden-Zone-Daten modelliert. |
| M099A-VISIBILITY-001 | Counter auf offenen eigenen oder öffentlichen Karten sind sichtbar; Counter auf gegnerischen verdeckten Karten leaken keine Kartendaten. |
| M099A-REPLAY-001 | Counter-Änderungen replayen deterministisch mit identischem StateHash und ohne nicht aufgezeichnete Randomness. |
| M099B-HOSTING-001 | Hosted Objects speichern genau eine direkte `hostedOn`-Beziehung zu einer existierenden Host-Karte. |
| M099B-HOSTING-002 | Hosting darf keine Selbst- oder Zyklusbeziehung erzeugen und ist nicht transitiv. |
| M099B-HOSTING-003 | V0.99-Hosting wird nur über eine lokale Runner-Resource-Harness-Karte ausgelöst. |
| M099B-HOSTING-004 | Hosting-Auswahl nutzt `PendingChoice`/`LegalActions` und revalidiert Side, StateVersion und Optionsmenge. |
| M099B-HOSTING-005 | Hosted-Programme bleiben Runner-kontrolliert, offen im Runner-Rig und beeinflussen keine Ownership-/Control-Regeln. |
| M099B-HOSTING-006 | Wird der Host getrasht, werden V0.99-Hosted-Programme deterministisch mit in den Heap bewegt. |
| M099B-HOSTING-007 | PublicEvents nennen Host/Hosted nur für offene Karten und leaken keine Hidden-Zone-Kandidaten. |
| M099C-VIRUS-001 | Eine lokale Virus-Programm-Harness-Karte kann Virus-Counter tragen. |
| M099C-VIRUS-002 | Purge ist nur als Corp-Basic-Action im Corp-Main-Window legal, kostet 3 Clicks und braucht vorhandene Virus-Counter. |
| M099C-VIRUS-003 | Purge entfernt alle Virus-Counter auf Karten und keine anderen Counter. |
| M099C-VIRUS-004 | Purge revalidiert in `applyAction` Clicks, Timing, Side, StateVersion und vorhandene Virus-Counter. |
| M099C-VIRUS-005 | Purge erzeugt ein public Event ohne Hidden-Info-Leak. |
| M099C-VIRUS-006 | Virus/Purge replayt deterministisch und verändert keine RandomDrawRecords. |
| M099D-RECURRING-001 | Recurring Credits liegen als Counter auf offenen Karten und refreshen zu Beginn des passenden Zuges auf den gedruckten Maximalwert. |
| M099D-RECURRING-002 | Recurring Credits akkumulieren nicht über den Maximalwert. |
| M099D-RECURRING-003 | V0.99 nutzt Recurring Credits eng für Runner-Programminstallkosten und revalidiert Pool plus Recurring-Zahlung. |
| M099D-RECURRING-004 | Recurring-Credit-Nutzung ist in Events und Views nur als offene, nicht-hidden Information sichtbar. |
| M099D-BADPUB-001 | Bad-Publicity-Counter liegen auf der Corp und werden über eine lokale Corp-Operation-Harness-Karte erhöht. |
| M099D-BADPUB-002 | Beim Run-Start erhält der Runner einen temporären Bad-Publicity-Fund in Höhe der zu diesem Zeitpunkt vorhandenen Corp-Bad-Publicity. |
| M099D-BADPUB-003 | Bad-Publicity-Credits werden in V0.99 eng für Runner-Run-Kosten genutzt und nach Run-Ende verworfen. |
| M099D-BADPUB-004 | Bad-Publicity-Änderungen nach Run-Start verändern den aktuellen Run-Fund nicht. |
| M099-CARD-001 | Jede neue spielbare V0.99-Karte braucht Manifest, Resolver/Ability, Unit-Test, Szenario, Visibility-Test, Replay/StateHash-Test, AI-Smoke und Multiplayer-Smoke. |
| M099-DECK-001 | V0.99-Demo-Decks und Matchstart-Gates machen nur manifestierte V0.99-Harness-Karten spielbar. |
| M099-NOSCOPE-001 | M11+ Mechaniken, Prevention, Avoid, Interrupt, Replacement, Set Aside, Remove from Game und Ownership-/Control-Wechsel bleiben unspielbar. |
| M099-GATE-001 | V0.99 darf erst final abgeschlossen werden, wenn Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build grün sind oder Blocker dokumentiert und akzeptiert wurden. |

## Entscheidungen

- V0.99a bis V0.99d werden nacheinander umgesetzt; bei rotem Gate wird nicht weitergearbeitet.
- V0.99e wird nur umgesetzt, wenn eine konkrete Karte im V0.99-Scope einen Spezialcounter braucht.
- Bad Publicity wird nicht für Trace-Bids verwendet, solange keine V0.99-Karte diesen Scope ausdrücklich braucht.
- Hosting ist eine direkte Beziehung auf offenen Runner-Rig-Karten; verdeckte Hosted-Karten bleiben außerhalb von V0.99.
- Private lokale Kartenbilder bleiben reine Anzeige-Artefakte und beeinflussen Engine, KI, Replay, StateHash, Decklegalität und Match-State nicht.

## Gate

`MVP_0.99_requirements_freeze_done: true`

`ready_for_MVP_0.99a_implementation: true`

# Classic Rule Decisions

Status: `active`

Diese Datei hält lokale Regelentscheidungen für die vollständige Classic-Implementierung fest. Sie dient als Entscheidungsschicht für Fälle, in denen `data/cards/classic-cards.json` eindeutig genug für eine lokale Umsetzung ist, aber bestehende Engine-Mechaniken noch generisch geschnitten werden müssen.

## Führende Quellen

1. `data/cards/classic-cards.json`
2. `data/manifests/classic-card-support.json`
3. Globale NETGRID-Prinzipien aus `AGENTS.md`
4. Bestehende Engine-, Deck-, Format-, AI- und Visibility-Verträge im Workspace

## Globale Entscheidungen

- Classic ist ein optionales Zusatzset und wird nur zusammen mit dem Originalset gespielt.
- Classic-Karten können im Catalog sichtbar sein, ohne dadurch automatisch engine-, deck-, format- oder AI-freigegeben zu sein.
- Human-playable Classic-Karten müssen LegalActions-only bedienbar sein; UI- oder AI-Pfade dürfen keine freien Ziele oder Kosten konstruieren.
- AI-supported Classic-Karten benötigen side-sichere Hints und Smoke-/Scenario-Referenzen; die AI darf nur LegalActions wählen.
- Random-Effekte nutzen ausschließlich die bestehende deterministische Randomness-Schicht mit Seed, Counter und Records.
- Hidden-Info-Effekte werden über redigierte Views und private Choice-/Look-Payloads umgesetzt; PublicEvents enthalten keine verdeckten Kartennamen oder Ordnungsinformationen.

## Karten- und Mechanikentscheidungen

| Bereich | Entscheidung |
| --- | --- |
| Double Operations/Preps | Eine Double-Karte verbraucht zwei aufeinanderfolgende Aktionen in diesem Zug. Wenn keine zweite Aktion verfügbar ist, ist die Play-Action nicht legal. Die Kosten werden als generischer Action-Cost modelliert, nicht als UI-Sonderfall. |
| Noisy Icebreaker | Sobald ein noisy Icebreaker während eines Runs tatsächlich eine Subroutine bricht oder eine noisy-gebundene Break-Fähigkeit nutzt, wird der Run als `usedNoisyIcebreaker` markiert. Sleepy-ICE-Rez-Rabatte und Library-Search-Bedingungen lesen nur diesen Run-State. |
| Sleepy ICE Rez Discount | Baskerville, Bolter Swarm, Deadeye und Imperial Guard reduzieren ihre Rez-Kosten um 5, wenn der aktuelle Run bereits noisy Icebreaker-Nutzung hatte. Kosten werden nicht unter 0 reduziert. |
| Deflector ICE | Run-Zielwechsel ersetzt das aktuelle Run-Ziel und positioniert den Runner auf dem äußersten rezzed ICE des Ziel-Forts. Gibt es dort kein rezzed ICE, wird auf den Zustand "letztes ICE des Ziel-Forts passiert" normalisiert. Der Wechsel wird replay-/statehash-relevant als Engine-State gespeichert. |
| Install Restrictions | Dumpster, Trapdoor, Glacier und Self-Destruct prüfen Install-Restrictions in LegalActions und erneut in `applyAction`. Illegal installierte Kopien sind in Version 0 nicht migrationsrelevant. |
| Glacier Agenda Point Cost | Rezzing Glacier kostet zusätzlich 1 Agenda-Punkt. Die Rez-Action ist nur legal, wenn die Corp diesen Punkt bezahlen kann. |
| Start-of-run ICE Move | Glacier darf zu Beginn eines Runs per bezahlter Fähigkeit bewegt werden. Unrezzed Glacier wird dabei für die Aktion offengelegt, ohne verdeckte andere Informationen zu leaken. |
| Puzzle delayed trash | Jede ausgelöste Puzzle-Subroutine setzt einen end-of-turn Trash-Marker auf Puzzle; mehrere Marker führen nur zu einem Trash-Versuch. |
| Score Counter Abilities | Data Fort Remapping erhält beim Scoren genau einen Remap-Counter. Die Counter-Ability ist eine Corp-LegalAction während eines aktiven Runs und entfernt den Counter beim Bezahlen. |
| Virus Counter Prevention | Superserum entfernt beim Scoren alle Corp-seitigen Virus-Counter und erzeugt zwei Prevention-Charges gegen die nächsten Virus-Counter, die der Runner der Corp geben würde. |
| Theorem Proof Access Replacement | Runner scored Theorem Proof beim Access nicht. Stattdessen kann Runner Theorem Proof als 2-MU-Programm installieren. Als Programm erhält es eine Runner-Action `Score Theorem Proof`; wenn es auf anderem Weg Play verlässt, wird es aus dem Spiel entfernt. |
| Access Ambushes | Self-Destruct und Shock Treatment erzeugen beim Access side-sichere Choice-/Resolution-Aktionen. Nicht gewählte oder nicht erfüllte Ambush-Bedingungen leaken keine zusätzlichen verdeckten Fort-Details. |
| Strategic Planning Group | "Whenever you draw one or more cards" wird als Draw-Replacement umgesetzt: eine zusätzliche Karte ziehen, dann eine der gezogenen Karten unter R&D legen. Die Choice zeigt nur der Corp die betroffenen Karten. |
| Search/Reorder/Reveal | Tutor-, Look- und Reveal-Effekte nutzen bestehende Hidden-Zone-Tools oder neue generische Helper mit privaten Choices und öffentlichen Count-/Reveal-Events. |
| Unpreventable Damage | Do the 'Drine und Spinal Tap verwenden einen Damage-Pfad, der Prevention-Effekte ausdrücklich nicht anbietet. |
| Recurring/Restricted Credits | Little Black Box, Spinal Tap und Zetatech Portastation verwenden generische restricted recurring credits mit start-of-turn refill. |
| Deck-Hardware-Unicity | Hardware mit Subtype `deck` ist gegenseitig exklusiv. Beim Installieren eines neuen Decks wird das ältere Deck getrasht. |
| Hidden Resources | Executive File Clerk und Sandbox Dig werden wie bestehende Hidden-Resources face-down installiert und face-up getrasht. Ihre Aktivierungen geben nur dem Runner private Look-Informationen. |
| Trace Auto-success | Crash Space ersetzt Runner-Trace-Verhalten: alle Trace-Versuche sind automatisch erfolgreich und geben zusätzlich einen Tag. Dies erzeugt keine neuen Corp-Entscheidungen außerhalb bestehender Trace-LegalActions. |
| Action Debt | Vintage Camaro modelliert "Forgo your next action" als Runner-Action-Debt, die die nächste verfügbare Runner-Aktion verbraucht oder reduziert, bevor normale Aktionen genutzt werden. |
| Corporate Shuffle | Die Double-Operation zieht zuerst bis zu fünf Karten aus R&D, erzeugt öffentliche Draw-Counts und startet danach eine private HQ-Choice. Die gewählte HQ-Karte wird verdeckt in R&D gemischt; PublicEvents enthalten weder CardInstanceId noch Kartentitel. |
| Reclamation Project | Die Double-Operation verwendet den generischen Archives-to-HQ-Choice-Pfad mit ICE-Filter und Multi-Select. Die nach HQ genommenen ICE-Karten werden Runner-seitig als Definitionen/Titel offengelegt, weil der Kartentext die Auswahl aus Archives zeigt. |
| Finders Keepers | Die drei Würfel werden direkt über deterministische `v1921.die.*`-RandomRecords geworfen. Der öffentliche Payload enthält nur Wurfergebnisse, Summe und Counterstand, keine verdeckten Zoneninformationen. |
| Brain Drain | Die gedruckte Würfelprobe wird als generische `random_damage`-Subroutine modelliert. Der Wurf läuft über die deterministische Randomness-Schicht; bei einer 1 wird normal verhinderbarer Core-Damage in Höhe von 3 ausgelöst. |
| Psychic Friend | Die gedruckte Dauer "until end of turn" wird in Version 0 als `current_run`-Pump modelliert, weil die bestehende Icebreaker-Dauerabstraktion Encounter- und Run-Dauer kennt. Das vermeidet einen breiten Turn-Duration-Pump-Umbau für eine isolierte Classic-Karte. |
| MS-todon | Die erste erfolgreiche Sentry-Break-Nutzung pro Run speichert einen generischen Breaker-Usage-Marker im Run-State, entfernt ohne Choice alle verfügbaren Bits von installierten Stealth-Quellen und gibt dem Runner genau einen Tag. PublicPayload enthält nur Summen und Definitionen, keine Stealth-Quell-IDs. |
| Rent-I-Con | Break-Nutzung markiert den Breaker generisch im Run-State; der Run-End-Cleanup prüft Installation und Special erneut und trasht die Quelle über den bestehenden Programm-Trash-Pfad. |
| Schematics Search Engine | HQ-Access exposed alle installierten Korp-Karten über öffentliche Definitionen, Titel und Serverlabels. Der Effekt dreht oder rezzt die Karten nicht und veröffentlicht keine CardInstanceIds. |
| Superglue | Das "just broken all subroutines" Timing nutzt das vorhandene Post-Pass-Fenster für vollständig gebrochenes ICE. Die Fähigkeit tappt die Quelle, derezzt das Ziel und beendet den Run nicht. |

## Paketstatus

| Paket | Status | Bemerkung |
| --- | --- | --- |
| CLASSIC-00 | completed | Prozess, Inventar und lokale Regelentscheidungen sind angelegt. |
| CLASSIC-01 | completed | Classic-Fallback, leere Registry-Foundation und Drift-Guard sind angelegt. |
| CLASSIC-02 | completed | Additive Kartenpool-/Format-/Matchstart-Auswahl für Originalset, Originalset+Classic, Originalset+Protheus und Originalset+Classic+Protheus ist umgesetzt und serverseitig revalidiert. |
| CLASSIC-03 | completed | Corporate Shuffle, Reclamation Project, Finders Keepers, Meat Upgrade, Networking und Panzer Run sind implementiert, getestet und AI-/Scenario-referenziert. |
| CLASSIC-04 | completed | Early Worm, Matador, MS-todon, Psychic Friend, Rent-I-Con, Schematics Search Engine und Superglue sind implementiert, getestet und AI-/Scenario-referenziert. |
| CLASSIC-05 | completed | Baskerville, Bolter Swarm, Brain Drain, Deadeye, Imperial Guard und Puzzle sind implementiert, getestet und AI-/Scenario-referenziert. |
| CLASSIC-06 | completed | Dumpster, Entrapment, Glacier, Trapdoor und Vortex sind implementiert, getestet und AI-/Scenario-referenziert. |
| CLASSIC-07 | pending | Classic Agendas. |
| CLASSIC-08 | pending | Corp Assets/Upgrades/Ambush. |
| CLASSIC-09 | pending | Runner Events/Resources/Hardware und Badtimes. |
| CLASSIC-10 | pending | AI und Deckspielbarkeit. |
| CLASSIC-11 | pending | Final Completion Gate, lokaler main-Merge und Cleanup. |

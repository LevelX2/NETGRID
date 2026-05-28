# Proteus CardImplementation Detailplan

Stand: 2026-05-28

Dieser Plan ist der führende Zuschnitt für die weitere Proteus-CardImplementation-Arbeit. Er bündelt die Restarbeit ab `PRO010` bewusst in größere Mechanikfamilien, damit ein Umsetzungspaket mehrere fachlich nahe Karten und die dafür ohnehin nötigen generischen Engine-Bausteine zusammen liefert.

## Ausgangslage

- Proteus-Gesamtbasis: 154 Karten in `data/cards/proteus-cards.json`.
- Aktueller Stand nach `PRO014`: 129 konkrete Proteus-CardImplementation-Dateien.
- Fehlende konkrete CardImplementation-Dateien: 25.
- Führende Zählweise bleibt Datei plus Registry plus Manifest-Driftprüfung.
- Keine Proteus-Karte wird durch diesen Plan `deck_legal`, `format_legal` oder `ai_supported`.

## Verbindliche Paket-Gates

Jedes Umsetzungspaket muss vor Abschluss nachweisen:

- Eine konkrete Datei je Karte unter `packages/engine/src/card-implementations/proteus/`.
- Registrierung in `packages/engine/src/card-implementations/registry.ts`.
- Manifest-Status passend zur tatsächlichen Registry, ohne fremde `resolverRef`-Zuordnung.
- LegalAction-Ableitung vor PlayerAction-Einreichung.
- `applyAction`-Revalidierung für Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Keine Hidden-Info-Leaks in PlayerViews, PublicEvents, KI-Inputs, WebSocket-/Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern.
- Deterministisches Replay und stabiler StateHash.
- Zufall nur über Seed, RandomCounter und RandomDrawRecords.
- Tests für positive Nutzung, illegale Nutzung, Hidden-Info-Redaction und Replay/StateHash, soweit die Karte Zufall, verdeckte Information oder neue Engine-Fenster berührt.

## Zuschnittsprinzipien

- Pakete sollen im Regelfall 5 bis 13 Karten enthalten, wenn die Karten eine gemeinsame Mechanikfamilie teilen.
- Ein Paket darf kleine generische Engine-Erweiterungen enthalten, wenn sie für mehrere Karten oder für die Kartenfamilie unmittelbar sinnvoll sind.
- Nicht jede fehlende Condition oder jeder einzelne Helper ist ein Grund für ein separates Vorpaket.
- Innerhalb eines Pakets darf der Umsetzung-Agent nach Startprüfung eng nachziehen: Wenn eine Karte doch einen deutlich anderen Vertrag braucht, wird genau diese Karte dokumentiert zurückgestellt, nicht das ganze Paket aufgegeben.
- Proteus-ID-Sonderlogik im Runtime-Code bleibt verboten; neue Bausteine müssen generisch sein.

## Pakete

| ID | Ziel | Karten / Artefakte | Vorlauf und Kernarbeit | Abschlussnachweis |
| --- | --- | --- | --- | --- |
| PRO001 | Manifest-/Registry-Reconciliation | `data/manifests/proteus-card-support.json`, Registry, alle vorhandenen Proteus-Dateien | Erledigt: falsch zugeordnete `implemented=true`-Einträge korrigieren; vorhandene Dateien als implementiert markieren; Guard ergänzen, der Card-ID, `resolverRef` und Registry konsistent prüft. | Manifest und Registry stimmen; Drift-Test schlägt bei falscher Zuordnung fehl. |
| PRO002 | Board- und Status-Hygiene | Proteus-Activities in `docs/activities/` | Erledigt: `done/status: superseded` klar von abgeschlossenen Implementierungen trennen; blockierte Detail-Activities mit PRO-Referenzen versehen; keine Superseded-Datei als Implementierungsnachweis zählen. | Proteus-Statusbericht zählt Dateien, nicht Ordnerpositionen; offene Pakete sind auffindbar. |
| PRO003 | Paketstandard und Verify-Harness | Activity-Template, Proteus-Coverage-Script, Testvorgaben | Erledigt: einheitliche Done-Kriterien und Coverage-Auswertung für fehlende Dateien, falsche Manifestzuordnung und nicht registrierte Dateien. | Ein Testlauf weist Zielabdeckung, Restliste und Drift aus. |
| PRO004 | Simple Icebreaker Core | `Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball` | Erledigt und mit PRO004-1 gehärtet: vorhandene `icebreakerAbilities` und Pump-/Break-Matcher wiederverwenden; Multi-Break generisch abgesichert. | Sechs CardImplementation-Dateien, Break-/Pump-/Multi-Break-Tests. |
| PRO005 | Simple Runner Economy/Draw Events | `Cruising for Netwatch`, `Stakeout` | Erledigt: bestehende Gain-/Draw-Event-Pfade nutzen. | Zwei Dateien, Event-Resolution deterministisch und ohne Hidden-Leak. |
| PRO006 | Simple Corp ICE Resolver | `Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank` | Erledigt und mit PRO006-1 gehärtet: printed brain damage, unmittelbares `trash_program`, `end_the_run_unless_runner_pays`, ICE-`on_rez`-Credit-Gain. | Vier Dateien, Subroutine-, Rez-Gain-, PublicPayload-, Replay-/StateHash- und Mapping-Tests. |
| PRO007 | Corp Operation Economy/Trace/History | `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole` | Erledigt: Corp-Operation-`on_play`, Runner-History-Conditions, Trace-Margin-Tags, Trace-Zusatzkosten und last-turn-resource-Zielauswahl als generische Operation-/Trace-Bausteine. | Fünf Dateien; Kosten-, Condition-, Trace-, Target- und PublicPayload-Tests; Harness 154/67/87 ohne Drift. |
| PRO008 | Runner Event Run/Economy/Followup Suite | `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals`, `Runner Sensei`, `All-Hands`, `Rush Hour`, `Decoy Signal`, `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance`, `Weefle Initiation` | Erledigt und mit PRO008-1 gehärtet: Runner-Event-Run-Flags, History, Trace-Rewards, Access-/Run-Replacement, Derez-/Trash-/Rez-Followups und temporäre Event-Boni als generische Bausteine umgesetzt; Trace-Avoid-Rewards zählen nur konkret genutzte Abilities, Remote Detonator nutzt Descriptor-`tagAmount`. | Dreizehn Dateien; Event-Run-Lifecycle-, Followup-, History-, Hidden-Info- und Replay-Gates; Harness 154/80/74 ohne Drift. |
| PRO009 | Runner Icebreaker Choice/Modifier Suite | `Black Widow`, `Fubar`, `Morphing Tool`, `Bulldozer`, `Lockjaw`, `Personal Touch, The`, `Eurocorpse (TM) Spin Chip` | Erledigt: Install-/Choice-State für Breaker-Ziele/Subtypes, rungebundene Breaker-Folgeeffekte, Supportprogramme, permanente Strength-Counter und hostgebundene Zahlungsbits als generische Bausteine umgesetzt. PRO009-1 härtet `Fubar` auf einmalige Encounter-Subtype-Wahl, `Bulldozer` auf exakt nächste ICE-Begegnung und `Lockjaw` auf Tap/Untap zum Runner-Zugbeginn. PRO009-2 härtet ausschließlich die UI-/PlayerView-Oberfläche für selectedSubtype-Labels, redigierte Black-Widow-Zielzusammenfassungen, Hosting-Labels und Power-Counter-Displays. | Sieben Dateien; Choice-Revalidierung, host-/source-bound Modifier, Run-Ende-Cleanup, Tap-/Untap-State, Breaker-Regressionen und UI-State-Redaction; Harness 154/87/67 ohne Drift bis PRO009, nach PRO010 weiterhin 154/97/57 ohne Drift. |
| PRO010 | Corp ICE Trace/Conditional/Lifecycle Suite | `Chihuahua`, `Coyote`, `Iceberg`, `Washed-Up Solo Construct`, `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers`, `Twisty Passages` | Erledigt: preventable Net-Damage als Trace-Erfolg, Runner-pay-or-trash-program, Coyote-Future-ICE-Strength-Cancel, bezahlte Encounter-ETR-Subroutine und Korp-Post-Pass-ICE-zurück-nach-HQ-Fenster generisch umgesetzt. PRO010-1 härtet die gemeinsame Post-Pass-Priorität von LegalAction-Generierung und `applyAction`: zuerst `corpPostPassIceReturnToHq`, danach `postPassCancellableFutureIceStrength`, danach `postPassPayOrEndRun`. | Zehn Dateien; Encounter-, Trace-, Zahlungs-, Lifecycle-, PublicPayload- und Replay-/StateHash-Tests; PRO010-1 ergänzt eine Rasmin-Bridger-Kombinationsregression; Harness 154/97/57 ohne Drift. |
| PRO011 | Hidden Resource Economy/Access Suite | `Chiba Bank Account`, `Liberated Savings Account`, `Swiss Bank Account`, `Airport Locker`, `HQ Mole`, `R&D Mole`, `Simulacrum`, `Time to Collect` | Erledigt und mit PRO011-1 gehärtet: acht verdeckte Runner-Resources als konkrete CardImplementation-Dateien umgesetzt; Bankkarten nutzen ein generisches Kosten-/Penalty-Support-Fenster statt `during_run`, HQ/R&D Mole nutzen ein Access-Start-Fenster vor Queue-Aufbau, und `Time to Collect` prüft echte Korp-Zugphasen. Die alten Phase-4b/4c-Scope-Blocker bleiben nur Statusreferenzen ohne doppelte Zählung. | Acht Dateien; Hidden-Info-Redaction, Tap-/Kosten-Revalidierung, Cost-/Penalty-Support, Access-Start-Queue-Härtung, Encounter-Search-/Pass-Fenster, Trash-Prevention und Harness 154/105/49 ohne Drift. |
| PRO012 | Hidden Resource Prevention/Sabotage Suite | `Bolt-Hole`, `Expendable Family Member`, `Back Door to Netwatch`, `Get Ready to Rumble`, `Wired Switchboard`, `Credit Subversion`, `Death from Above`, `Mercenary Subcontract` | Erledigt und mit PRO012-1 gehärtet: Hidden-Resource-Tap-/Reveal-Kosten für Damage-/Tag-Prevention, Trace-Post-Bid-Link, Trace-Erfolg-Cancel, Post-Meat-Damage-HQ-Random-Discard, Successful-Run-vor-Access-Followups und Current-Access-Trash generisch umgesetzt. PRO012-1 härtet Mercenary-Resolve-Revalidierung und dokumentiert das sequenzielle Current-Access-Modell über `run.accessedCardId`. Die alten Phase-4d/4e-Scope-Blocker bleiben nur Statusreferenzen ohne doppelte Zählung. | Acht Dateien; Hidden-Info-Redaction, Tap-/Kosten-/Timing-Revalidierung, RandomDrawRecords, PublicPayload, Replay-/StateHash-Tests und Harness 154/113/41 ohne Drift. |
| PRO013 | Agenda/Steal/Overadvance Suite | `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich`, `World Domination`, `Blackmail`, `Pirate Broadcast`, `Promises, Promises` | Erledigt und mit PRO013-1 gehärtet: Score-/Steal-Fenster, current-access Self-Steal-Cost, Agenda-Access-Ambush, fixe und einmalige Agenda-Punktmodifikatoren, Overadvance-Start-of-Turn-Credits, Runner-Agenda-Event-Gewinne und deterministische Mehrfach-Run-Sequenzen mit Action-Debt generisch umgesetzt. PRO013-1 erzwingt offene Pirate-Broadcast-Folgeruns als einzige Runner-Aktion, revalidiert den Sequenzstatus beim Run-Start und ergänzt eine fokussierte Agenda-Behavior-Suite. Die alten Phase-6a/6e-Scope-Blocker bleiben nur Statusreferenzen ohne doppelte Zählung. | Acht Dateien; Score-/Steal-/Access-Replacement-, Agenda-Point- und Action-Debt-Gates; Harness 154/121/33 ohne Drift. |
| PRO014 | Corp Asset/Upgrade Utility Suite | `Department of Misinformation`, `Government Contract`, `LDL Traffic Analyzers`, `Panic Button`, `Cybertech Think Tank`, `Raymond Ellison`, `Siren`, `Syd Meyer Superstores` | Erledigt und mit PRO014-1 gehärtet: acht konkrete Asset-/Upgrade-Dateien, Registry- und Manifest-Promotion, HQ-/Remote-Installbindung, advancement-counter-basierte temporäre Corp-Credit-Pools für Install/Rez, Trace und Run, Corp-Run-/Trace-Aktivierungsfenster, Start-of-run-Redirect und eigenes rezzed ICE als Corp-Ziel. PRO014-1 entfernt automatische optionale Nutzungen und freie Runner-Redirect-Wahl: Siren, Department, Cybertech und Government Contract laufen über explizite LegalAction-/Choice-/Kosten-Revalidierung. | Acht Dateien; PRO014-Verhaltenstests für alle acht Karten; Harness 154/129/25 ohne Drift. |
| PRO015 | Bad-Publicity Run/Replacement Suite | `Frame-Up`, `Live News Feed`, `Subliminal Corruption`, `Identity Donor`, `Senatorial Field Trip` | Bad-Publicity-Run-/History-Effekte, Bad-Publicity-Replacement und Choice-Fenster auf Basis des vorhandenen Bad-Publicity-7+-Gates. | Fünf Dateien; Loss-Gate bleibt einzige Game-End-Autorität; Choices legalactionbasiert. |
| PRO016 | Random/Dice/Encounter Suite | `Forward's Legacy`, `Roadblock`, `Executive Boot Camp`, `Lisa Blight` | Random-/Dice-Konvention, Encounter-Random-Pass/Derez, Random-Discard-Kosten, rungebundene temporäre Credits und Subroutine-Copy-Ziele. | Vier Dateien; RandomDrawRecords, RandomCounter, Replay und Hidden-Info-Gates. |
| PRO017 | Action Economy/Action Debt Suite | `Lucidrine™ Drip Feed`, `AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox` | Zusätzliche, restricted und forfeit Actions; Agenda-Damage-Replacement; forced Random-Actions mit Hidden-Grip-Reveal und Action-Debt-Vertrag. | Sechs Dateien; Action-Ledger, forced-action-Revalidierung, Replay und PublicPayload-Redaction. |
| PRO018 | Hidden-Zone Search/Install Tutor Suite | `Hijack`, `Test Spin` | Grip-/Stack-Search, Installationschoice, temporäre Install-Credits, verpflichtender Run-Followup und deterministisches Zurückmischen/Penalty. | Zwei Dateien; Hidden-Zone-Auswahl runnerprivat, Search-/Shuffle-/Penalty-Tests. |
| PRO019 | Rule-Contract Baseline Utilities | `Emergency Rig`, `Ice and Data Special Report`, `Obfuscated Fortress`, `Pavit Bharat`, `Simon Francisco`, `Herman Revista`, `Marcel DeSoleil`, `Rent-to-Own Contract` | Die noch offenen Regel-/Vertragskarten gemeinsam entscheiden und umsetzen: unbegrenztes X, Kostenzeile `3 (0)`, Run-Payment-Source, Hidden-HQ-to-Fort-Install und Central-Access-Reihenfolge. | Acht Dateien oder dokumentierte Einzel-Rückstellungen mit konkreter Regelentscheidung; keine stillen Annahmen. |
| PRO020 | Finaler Proteus-Abschluss | Alle Proteus-Karten, Manifest, Registry, Coverage, Activities | Restliste muss leer sein; Board- und Statusartefakte auf den finalen Datei-/Registry-Stand bringen. | 154 konkrete Dateien, 154 Registry-Einträge, Manifest ohne Drift, vollständiger Verify-Lauf grün. |

## Empfohlene Reihenfolge

1. PRO007 bis PRO010 zuerst: sichtbare Operation-, Runner-Event-, Icebreaker- und ICE-Familien liefern viel Abdeckung und bauen wiederverwendbare Kernbausteine.
2. PRO011 und PRO012 danach: Hidden-Resource-Arbeit in zwei größere, aber fachlich saubere Pakete bündeln.
3. PRO013 bis PRO017: Agenda, Corp-Utility, Bad-Publicity, Random und Action-Economy als größere Mechanikfamilien schließen.
4. PRO018 und PRO019 zuletzt vor dem Abschluss: Hidden-Zone-Tutor und die regelvertraglichen Sonderfälle.
5. PRO020 erst, wenn der Verify-Harness keine fehlenden CardImplementation-Dateien mehr ausweist.

## Umsetzungshinweis für Activities

Aus jedem PRO-Paket sollte höchstens eine konkrete `docs/activities/inbox/act-...md` erzeugt werden. Der Umsetzung-Agent soll das gesamte Paket starten, vor Codeänderungen die Zielkarten und vorhandenen Bausteine prüfen und dann möglichst vollständig umsetzen. Teilrückstellungen sind erlaubt, aber nur mit genauer Begründung pro Karte und ohne die restlichen Karten unnötig zu blockieren.

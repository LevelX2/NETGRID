# Proteus CardImplementation Detailplan

Stand: 2026-05-26

Dieser Plan ersetzt keine bestehende Runtime-Freigabe. Er schneidet die fehlenden Proteus-CardImplementation-Arbeiten in nummerierte, nachvollziehbare Pakete `PRO001` bis `PRO040`. Die Nummern sind Planungsnummern; konkrete `docs/activities/`-Dateien können daraus einzeln erzeugt werden.

## Ausgangslage

- Proteus-Datenbasis: 154 Karten in `data/cards/proteus-cards.json`.
- Konkrete Proteus-CardImplementation-Dateien: 50.
- Fehlende konkrete CardImplementation-Dateien: 104.
- Ursache der Lücke: Viele große Phase-Activities sind in `done/` als `superseded` abgelegt, während die tatsächlichen Detail-Activities in `in-progress/` wegen fehlender generischer Engine-Verträge blockiert sind. Zusätzlich driftet `data/manifests/proteus-card-support.json` gegen Registry und CardImplementation-Dateien.
- Gate: Keine Proteus-Karte wird durch Planung allein decklegal, formatlegal oder KI-unterstützt.

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

## Detailpakete

| ID | Ziel | Karten / Artefakte | Vorlauf und Kernarbeit | Abschlussnachweis |
| --- | --- | --- | --- | --- |
| PRO001 | Manifest-/Registry-Reconciliation | `data/manifests/proteus-card-support.json`, Registry, alle vorhandenen Proteus-Dateien | Falsch zugeordnete `implemented=true`-Einträge korrigieren; vorhandene Dateien als implementiert markieren; Guard ergänzen, der Card-ID, `resolverRef` und Registry konsistent prüft. | Manifest und Registry stimmen für alle 154 Karten; Drift-Test schlägt bei falscher Zuordnung fehl. |
| PRO002 | Board- und Status-Hygiene | Proteus-Activities in `docs/activities/` | `done/status: superseded` klar von abgeschlossenen Implementierungen trennen; blockierte Detail-Activities mit neuen PRO-Referenzen versehen; keine Superseded-Datei als Implementierungsnachweis zählen. | Proteus-Statusbericht zählt Dateien, nicht Ordnerpositionen; offene Pakete sind eindeutig auffindbar. |
| PRO003 | Paketstandard und Verify-Harness | Activity-Template, Proteus-Coverage-Script, Testvorgaben | Einheitliche Done-Kriterien für Proteus-CardImplementation-Pakete festlegen; Coverage-Auswertung um fehlende Dateien, falsche Manifestzuordnung und nicht registrierte Dateien erweitern. | Ein Befehl oder Testlauf weist 154/154 Zielabdeckung und aktuelle Restliste aus. |
| PRO004 | Simple Icebreaker Core | `Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball` | Vorhandene `icebreakerAbilities` und Pump-/Break-Matcher wiederverwenden; keine neuen Install-Choice- oder Folgeeffekte. | Sechs CardImplementation-Dateien, Break-/Pump-Tests gegen passende und unpassende ICE-Subtypen. |
| PRO005 | Simple Runner Economy/Draw Events | `Cruising for Netwatch`, `Stakeout` | Bestehende Gain-/Draw-Event-Pfade nutzen; illegale Timing- und Kostenfälle testen. | Zwei Dateien, Event-Resolution deterministisch und ohne Hidden-Leak. |
| PRO006 | Simple Corp ICE Resolver | `Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank` | Vorab prüfen: `Brain Wash` braucht nur printed brain damage; `Colonel Failure` braucht vorhandenen unmittelbaren `trash_program`-Subroutinepfad; `Misleading Access Menus` und `Snowbank` brauchen `end_the_run_unless_runner_pays` plus generischen ICE-`on_rez`-Credit-Gain. Nur vorhandene oder sehr kleine wiederverwendbare Printed-Subroutine-/Lifecycle-Bausteine nutzen; Karten mit Trace-, Future-Modifier- oder Pay-or-trash-Programmlogik bleiben draußen. | Vier Dateien nur bei erfülltem `trash_program`-/`on_rez`-Gate; sonst sauberer Teilabschluss oder Blocker. Subroutine-, Rez-Gain-, PublicPayload-, Replay-/StateHash- und Manifest-/Registry-Harness-Tests. |
| PRO007 | Simple Corp Operation Economy | `Credit Consolidation` | Als isoliertes Operationspaket aus Phase 6c lösen; keine Trace-History-Abhängigkeit. | Eine Datei, Kosten-/Timing-/Credit-Tests. |
| PRO008 | Hidden Prevention Quick Slice | `Bolt-Hole`, `Expendable Family Member` | Prüfen, ob Phase-4a-Reveal-and-trash und bestehende Event-Modification-Familien reichen; nur promoten, wenn kein neues Hidden-Reaktionsfenster nötig ist. | Zwei Dateien oder dokumentierter Rückfall in PRO023; Redaction-Tests verpflichtend. |
| PRO009 | Phase-1e Easy Fort-Utility Split | `Herman Revista`, `Marcel DeSoleil` | Aus dem Pavit-/Simon-Blocker lösen, sofern beide ohne Hidden-HQ-Install und ohne Access-Queue-Änderung funktionieren. | Zwei Dateien oder explizite Re-Blockierung mit genauer Vertragslücke. |
| PRO010 | Rent-to-Own Isolation | `Rent-to-Own Contract` | Vom `Emergency Rig`-Blocker trennen; Implementierung nur, wenn kein gemeinsamer unbegrenzter X-Counter-Vertrag benötigt wird. | Eine Datei; `Emergency Rig` bleibt blockiert bis PRO037. |
| PRO011 | Install-Choice Icebreaker | `Black Widow`, `Fubar`, `Morphing Tool` | Generischen source-bound Install-/Choice-State für Breaker-Ziel oder Breaker-Subtype-Auswahl schaffen. | Drei Dateien; Choice-Revalidierung und Replay für gespeicherte Auswahl. |
| PRO012 | Breaker-Folgeeffekt und Support | `Bulldozer`, `Lockjaw` | Rungebundenen Folgeeffekt für nächstes Sentry nach vollständig gebrochener Wall prüfen; Lockjaw als Supportprogramm getrennt modellieren. | Zwei Dateien; Folgeeffekt endet korrekt am Run-Ende. |
| PRO013 | Icebreaker Modifier Hardware | `Personal Touch, The`, `Eurocorpse (TM) Spin Chip` | Zielgebundenen permanenten Strength-Counter und hosted-program-gebundene Zahlungsbits implementieren. | Zwei Dateien; Modifier ist source-bound und host-bound. |
| PRO014 | Runner Economy History/Trace Rewards | `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals`, `Runner Sensei` | Runner-Trash-History, Next-Agenda-Access-Reward und Base-Link-Trace-Auswahlfenster mit Source-Reward generisch ergänzen. | Vier Dateien; History und Reward werden nur einmal und nur im richtigen Fenster verbraucht. |
| PRO015 | Run-Event Flag Basics | `All-Hands`, `Rush Hour`, `Decoy Signal` | Event-run-bound Flags für Noisy-Verbot, Access-Count/Access-Unterdrückung und Expose-vor-Rez einführen oder wiederverwenden. | Drei Dateien; Flags sind rungebunden und öffentlich korrekt redigiert. |
| PRO016 | Run-Event Destruction/Followup | `Demolition Run`, `Remote Detonator`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance`, `Weefle Initiation` | Derez-/Trash-/Corp-Rez-Reward- und Data-Fort-History-Followups für erfolgreiche Runs modellieren. | Sechs Dateien; Followups entstehen aus LegalActions und werden in `applyAction` erneut validiert. |
| PRO017 | Post-Pass ICE Lifecycle | `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers`, `Twisty Passages` | Generische Post-Pass- und ICE-Lifecycle-Fenster für Phase 3d schließen. | Sechs Dateien; Pass-/Derez-/Reposition-Tests decken Reihenfolge ab. |
| PRO018 | Hidden Bank Cost/Penalty Window | `Chiba Bank Account`, `Liberated Savings Account`, `Swiss Bank Account` | Hidden-Resource-Cost-/Penalty-Support-Fenster mit Revalidierung der ursprünglichen Zahlung einführen. | Drei Dateien; versteckte Quellen bleiben runnerprivat, PublicEvents zeigen nur erlaubte Reveal-Daten. |
| PRO019 | Hidden Economy Singletons | `Airport Locker` | Isolierte Hidden-Economy-Semantik prüfen und nur ohne Bank-Sondervertrag promoten. | Eine Datei oder klare Übergabe an PRO018/PRO023. |
| PRO020 | Hidden Access/Mole Window | `HQ Mole`, `R&D Mole`, `Simulacrum` | Runnerprivates Hidden-Resource-Access-Start-Fenster vor Access-Queue-Aufbau; `Simulacrum` separat gegen Encounter-/AP-Pass-Fenster prüfen. | Drei Dateien; Access-Count wird nicht öffentlich aus verdeckten Quellen geleakt. |
| PRO021 | Hidden Successful-Run Sabotage | `Credit Subversion`, `Death from Above` | Verdecktes Successful-Run-vor-Access-Fenster mit `trash_source`-Reveal und Reihenfolge vor HQ-/Remote-Breach definieren. | Zwei Dateien; Reveal, Kosten und Ziel werden in LegalAction und `applyAction` konsistent validiert. |
| PRO022 | Hidden Current-Access Sabotage | `Mercenary Subcontract` | Hidden-Resource-Access-Decision-Fenster für eine oder mehrere aktuell accessete Karten schaffen. | Eine Datei; Auswahl ist auf aktuelle Access-Karten begrenzt. |
| PRO023 | Hidden Advanced Prevention | `Back Door to Netwatch`, `Get Ready to Rumble`, `Time to Collect`, `Wired Switchboard` | Trace-Erfolg-Cancel, Post-Meat-Damage-Reaktion, Resource-Trash-Prevention und `trash_source`-Kosten im Post-Bid-Link-Fenster ergänzen. | Vier Dateien; Hidden-Info-, Timing- und Random-Discard-Tests. |
| PRO024 | Agenda Scoring/Steal Baseline | `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich`, `World Domination` | Source-bound Successful-Damage-Handsize, Self-Steal-Cost, Marked-Accounts-Steal-/Score-Semantik, Overadvance-Start-of-Turn-Credits und feste Zusatzpunkte sauber modellieren. | Fünf Dateien; Steal-/Score-Fenster und Agenda-Punkte deterministisch. |
| PRO025 | Corp ICE Trace/Conditional Resolver | `Chihuahua`, `Coyote`, `Iceberg`, `Washed-Up Solo Construct` | Preventable Net damage als Trace-Erfolg, Future-ICE-Strength-Erhöhung mit Runner-Zahlungsfenster, Variable-/Conditional-ICE-Details und Pay-or-trash-Programm-Fenster ergänzen. | Vier Dateien; Trace-Marge, Prevention und Zahlungsfenster getestet. |
| PRO026 | Corp Operation Trace/History | `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole` | Runner-History-Conditions, Trace-Erfolg nach Trace-Marge, Trace-Zusatzkostenmodell und Auswahl zuletzt installierter Resources ergänzen. | Vier Dateien; History ist turngebunden und redigiert. |
| PRO027 | Corp Asset/Upgrade Utility A | `Department of Misinformation`, `Government Contract`, `LDL Traffic Analyzers`, `Panic Button` | Expose-Verhinderung, advancement-counter-basierte Damage-Boosts, temporäre Credits und Corp-Trash eigener rezzed ICE modellieren. | Vier Dateien; Aktivierungen sind kosten- und zielvalidiert. |
| PRO028 | Corp Asset/Upgrade Utility B | `Cybertech Think Tank`, `Raymond Ellison`, `Siren`, `Syd Meyer Superstores` | HQ-/Fort-Install- und Run-Kontextbedingungen, Start-of-run-Redirects und fortbezogene Utility-Fenster ergänzen. | Vier Dateien; Redirect/Install-Fenster erzeugen keine Hidden-Zonen-Leaks. |
| PRO029 | Runner Agenda/Overadvance Events | `Blackmail`, `Pirate Broadcast`, `Promises, Promises` | Successful-run access replacement, Mehrfach-Run-Sequenz über Data Forts mit Abschlussauswertung und Next-Agenda-Access-Modifier ergänzen. | Drei Dateien; Action-Debt und Zusatzpunkte sind deterministisch. |
| PRO030 | Bad-Publicity Run/History | `Frame-Up`, `Live News Feed`, `Subliminal Corruption` | Bad-Publicity-7+-Gate wiederverwenden; run-/historygebundene Bad-Publicity-Effekte sauber begrenzen. | Drei Dateien; Loss-Gate bleibt einzige Game-End-Autorität. |
| PRO031 | Bad-Publicity Replacement/Choice | `Identity Donor`, `Senatorial Field Trip` | Replacement- und Choice-Fenster für Bad-Publicity-Folgen definieren. | Zwei Dateien; Choices sind legalactionbasiert und wiederholungsfest. |
| PRO032 | Random Foundation | `Forward's Legacy` | Isolierbaren Random/Dice-Effekt umsetzen; dabei endgültige RandomDrawRecords-Konvention für Proteus dokumentieren. | Eine Datei; RandomCounter und Replay stimmen. |
| PRO033 | Random Encounter/Cost/Subroutine | `Roadblock`, `Executive Boot Camp`, `Lisa Blight` | Encounter-Entry-Random-Pass-/Derez, Random-Discard-Kosten, rungebundene temporäre Credits und Subroutine-Copy-Zielmodell ergänzen. | Drei Dateien; keine direkte Zufallsquelle außerhalb Engine-RNG. |
| PRO034 | Action Economy Singletons | `Lucidrine™ Drip Feed` | Action-Debt-Vertrag klein schneiden; isoliert umsetzen, falls keine zusätzlichen/restricted Corp-Actions nötig sind. | Eine Datei oder Blocker-Übergabe an PRO035. |
| PRO035 | Corp Action Economy/Replacement | `AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox` | Zusätzliche/restricted/forfeit Actions, Agenda-Damage-Replacement nach Runner-Prevention und forced Random-Actions mit Hidden-Grip-Reveal modellieren. | Fünf Dateien; Action-Debt und Zwangsaktionen sind replaystabil. |
| PRO036 | Hidden-Zone Search/Install Tutor | `Hijack`, `Test Spin` | Grip-Installationschoice mit temporären Install-Credits, Search-Install, verpflichtenden Run-Followup und deterministisches Zurückmischen/Penalty ergänzen. | Zwei Dateien; Hidden-Zone-Auswahl nur runnerprivat sichtbar. |
| PRO037 | Rule-Blocked Preflight Decisions | `Emergency Rig`, `Ice and Data Special Report` | Regelentscheidung zur positiven, unbegrenzten `X`-Counter-Auswahl ohne Kosten-/Wertbezug treffen; außerdem Kostenentscheidung für `Ice and Data Special Report` mit lokaler Kostenzeile `Cost: 3 (0)` dokumentieren. Erst danach implementieren. | Dokumentierte Entscheidungen plus zwei Dateien oder dauerhaft blockierter Kartenstatus. |
| PRO038 | Obfuscated Fortress Spend-Cap | `Obfuscated Fortress` | Run-Payment-Source-Vertrag festlegen: normale Credits, Bad-Publicity-Credits, temporäre Run-Credits, Hosted-/Recurring-Credits und Stealth-Bits. | Vertrag plus eine Datei; Spend-Cap wird bei jeder Zahlung revalidiert. |
| PRO039 | Hidden Fort/Access Rule Contracts | `Pavit Bharat`, `Simon Francisco` | Hidden-HQ-to-Fort-Installationsvertrag und Central-Access-Reihenfolge-/Queue-Vertrag definieren. | Zwei Dateien; Count-/Positionsredaction und Access-Reihenfolge sind getestet. |
| PRO040 | Finaler Proteus-Abschluss | Alle 154 Proteus-Karten, Manifest, Registry, Coverage, Activities | Restliste muss leer sein; `human_playable` nur für tatsächlich implementierte Karten; `deck_legal`, `format_legal`, `ai_supported` bleiben ohne eigenes Gate false. | 154 konkrete Dateien, 154 Registry-Einträge, Manifest ohne Drift, vollständiger Verify-Lauf grün. |

## Empfohlene Reihenfolge

1. Zuerst PRO001 bis PRO003, weil sonst Fortschritt falsch gezählt wird.
2. Danach PRO004 bis PRO010 als risikoarme Karten- und Statusbereinigung. Diese Pakete liefern schnell belastbare Dateiabdeckung und entkoppeln einfache Karten aus blockierten Sammel-Slices.
3. Danach Mechanikfamilien mit enger Wiederverwendung: PRO011 bis PRO017, anschließend PRO018 bis PRO023.
4. Danach größere Corp-/Agenda-/Event-Familien: PRO024 bis PRO031.
5. Danach Random, Action Economy und Hidden-Zone Search: PRO032 bis PRO036.
6. Regel- und Scope-Blocker zuletzt: PRO037 bis PRO039.
7. PRO040 erst ausführen, wenn alle vorigen Pakete abgeschlossen oder bewusst dauerhaft blockiert dokumentiert sind.

## Umsetzungshinweis für Activities

Aus jedem PRO-Paket sollte höchstens eine konkrete `docs/activities/inbox/act-...md` erzeugt werden. Wenn ein Paket beim Ausarbeiten mehr als vier neue generische Engine-Fenster oder mehr als sechs Karten enthält, wird es vor der Umsetzung weiter geteilt. Die PRO-Nummer bleibt dabei als Referenz erhalten, zum Beispiel `PRO016a` und `PRO016b`, ohne die führende Planung umzunummerieren.

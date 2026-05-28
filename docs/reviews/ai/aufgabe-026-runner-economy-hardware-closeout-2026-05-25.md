# Aufgabe 026 - Runner Economy / Resource / Hardware Closeout

## Kurzfazit

Aufgabe 026 schließt Batch 12 als read-only Generated-Facts-/Compiled-Index-Erweiterung ab. Der Batch `batch_12_runner_economy_resource_hardware_longtail` umfasst 18 eingeschlossene Runner-Karten aus Economy, Resource, Hardware, Hand-size, Search und Recovery. Es gibt 0 Hard Errors, 0 echte semantische Konflikte und 0 verbleibende nicht normalisierte Differenzen.

Readiness: `ready_read_only_split_subbatches`.

Es wurde keine Strategie-, Planner-, Engine-, Legalitäts-, Profil- oder Runtime-Compiled-Index-Wirkung eingeführt. `data/ai/ai-card-hints-active.json` bleibt unverändert.

## Bezug zu Aufgabe 022/023/024/025

Aufgabe 022 bis 024 haben Corp Tag/Punish-Facts und Terminalfenster-Diagnose vorbereitet. Aufgabe 025 hat die verbleibenden Unknown-Skips als Multi-Payoff-Metrikartefakt normalisiert und keinen Strategy-Fix gerechtfertigt. Aufgabe 026 wechselt bewusst zurück in den read-only Datenpfad: bessere mechanische Runner-Economy-/Setup-Facts, aber noch keine Consumer- oder Strategieänderung.

## Warum dieser Batch

Runner-Setup hängt stark an Credits, Draw, Search, Recovery, Hand-size und installierbaren Resources/Hardware. Der Batch bündelt Karten, deren Mechanik aus `CardImplementation` ableitbar ist, ohne Boardstate, Hidden Zones oder LegalActions vorwegzunehmen.

## Geprüfte Kandidaten

Geprüft wurden 35 Kandidaten. Eingeschlossen wurden 18 Karten:

- `Newsgroup Filter`
- `Forgotten Backup Chip`
- `Gideon's Pawnshop`
- `If You Want It Done Right . . .`
- `Jack 'n' Joe`
- `Livewire's Contacts`
- `Mantis, Fixer-at-Large`
- `Organ Donor`
- `Score!`
- `Temple Microcode Outlet`
- `Microtech Backup Drive`
- `Militech MRAM Chip`
- `MRAM Chip`
- `Broker`
- `Loan from Chiba`
- `The Shell Traders`
- `The Short Circuit`
- `Short-Term Contract`

Ausgeschlossen wurden 17 Kandidaten mit Grund, darunter bereits durch Aufgabe 021/Batch 10 geschlossene Survival-Karten (`Bodyweight Synthetic Blood`, `Nasuko Cycle`, `Fall Guy`, `Crash Everett, Inventive Fixer`), Proteus/out-of-scope Karten (`All-Hands`, `Streetware Distributor`) und nicht aktive bzw. fachlich unpassende Kandidaten (`Enterprise, Inc., Shields`, `R&D Interface`, `HQ Interface`, `Inside Job`, `Access through Alpha`, `Time to Collect`, `Credit Subversion`, `Liberated Savings Account`, `Rogue AI`).

## Fokusprüfungen

`Short-Term Contract` ist als `finite_economy_pool` plus `action_economy` normalisiert. Der 12-Credit-Pool und das Entfernen der Credits bleiben Boardstate; es wird keine wiederholbare/endlose Economy abgeleitet.

`Loan from Chiba` erzeugt Economy nur zusammen mit `delayed_penalty` und `requires_start_of_turn`. Die Start-of-turn-Creditverluste und Pay-or-lose-game-Downside bleiben sichtbar und werden nicht zu reiner Economy geglättet.

`MRAM Chip` und `Militech MRAM Chip` sind Hand-size-Hardware. Beide erzeugen `hand_size_modifier`, aber keinen Memory-Fact. Memory und Hand-size bleiben getrennt.

Hand-size-Facts erzeugen keine aktuelle Hand-Safety und keine Hidden-Hand-Information. Search/Recovery-Facts enthalten nur Zone/Target-Klasse, keine konkrete Hidden-Zone-Kartenidentität.

## Derived-Facts-Erweiterungen

Der Pilot wurde von 177 auf 193 Karten erweitert. Neu oder bestätigt wurden im Batch 45 Facts:

- Runner Economy: 10
- Hand-size: 2
- Search/Recovery: 9
- finite Economy-Pools: 2
- Debt/Downside: 1

Preview-Adds: 34. Diese sind read-only Generated-Facts-Vorschau gegen den aktiven Monolithen, keine aktive Hintmigration.

## Normalisierung

37 Differenzen wurden normalisiert. Dominierende Regeln:

- `runner_search_recovery_normalization`
- `hidden_zone_context_normalization`
- `runner_action_economy_normalization`
- `runner_finite_pool_economy_normalization`
- `runner_loan_debt_normalization`
- `runner_hand_size_normalization`
- `runner_install_discount_context_normalization`
- `runner_economy_strategy_overlay_split`

Kontextinfos:

- Payment: 3
- Action: 1
- Memory: 2
- Hand-size: 2
- Hidden-zone: 8
- Delayed-penalty: 1

Die verbleibenden Descriptor-Followups sind Vergleichs-/Overlay-Gaps, keine Hard Errors. Sie markieren vor allem, dass der aktive Monolith strategische Rollen und Overlay-Felder enthält, die bewusst nicht mechanisch generiert werden.

## Consumer-Readiness

Consumer-Readiness: `ready_for_runner_economy_setup_diagnostic_design`.

Die mechanischen Facts reichen für einen späteren Diagnose-Consumer, der sichtbare/legale Runner Economy, finite/debt/downside Economy, Search/Recovery, Hand-size und Setup-Kontext messen kann. Es gibt noch keinen aktiven Runtime-Consumer.

## Bewusst nicht geändert

- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Änderung an `aiSupportStatus`
- keine Engine-Regeländerung
- keine neue Legalität
- keine Strategie-/Planner-Score-Änderung
- keine Runtime-Nutzung des Compiled Index
- keine Runtime-Nutzung modularer Overlays
- keine Profilumschaltung
- keine neuen Decks
- keine Holdout-Optimierung
- keine Performanceinterpretation

## Nächster Schritt

Empfohlen ist **Aufgabe 027 - Runner Economy / Setup Consumer Diagnostic Slice**. Der Datenpfad ist sauber genug, um ohne Strategieänderung zu messen, ob Runner Economy sichtbar/legal ist, genommen oder übersprungen wird, und ob finite/debt/downside Economy sowie Memory-/Hand-size-Bottlenecks echte Setup-Probleme erklären.

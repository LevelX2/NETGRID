# Runner Economy Rig Focus Evidence 2026-07-07

## Match

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: read-only über Node 24 `node:sqlite` / `DatabaseSync`
- Match: `match_6e8f03d9b28d5898`
- Modus: `human_corp_vs_runner_ai`
- KI-Seite: Runner
- Status: `finished`
- Gewinner: Korp
- Endgrund: `agenda_points`
- Seed: `match-mra70dsz-17whlim`
- End-StateVersion: `177`
- StateHash: `fnv1a:6b707543`
- Zeitfenster: erstellt `2026-07-07T16:55:35.997Z`, aktualisiert `2026-07-07T17:06:12.712Z`
- Umfang: 178 Events, 178 StateSnapshots, 106 AI-Decision-Traces, Detailed Trace Mode

## Side-Safety-Grenze

Die Befunde verwenden PublicEvents, PlayerView-nahe Snapshots, LegalActions und redigierte AI-Decision-Traces. Später aufgedeckte Korp-Karten werden nur als Folgebeobachtung beschrieben und nicht als damalige Entscheidungsgrundlage vorausgesetzt.

## Spielverlauf in Kürze

- Die Runner-KI startet sinnvoll: erster Run auf R&D, danach `The Short Circuit` installieren und `Codecracker` suchen.
- `Codecracker` wird bei Event 25 installiert und ermöglicht spätere R&D-Runs durch `Quandary`.
- Danach verliert die KI den Fokus: Sie sucht mit `The Short Circuit` weitere Programme, installiert sie spät oder gar nicht und discards wichtige Karten.
- Die Korp scored früh `Marine Arcology` und später erneut; am Ende gewinnt sie durch `Project Babylon` plus Overadvance-Bonus.

## Fehlergruppe 1: Broker-/Bank-Economy wird nicht als Plan erkannt

### Evidence

`Broker` liegt bereits in der Starthand:

- StateVersion 0, Runner Grip: `Force Shield`, `Vewy Vewy Quiet`, `The Short Circuit`, `Broker`, `Rigged Investments`.

`Broker` wird nie installiert und landet im Heap:

- StateVersion 58: neuer Runner-Heap-Eintrag `onr_v1_154_broker`.

Trace-Alternativen zeigen die Ursache. In mehreren Entscheidungen wird `Broker installieren` massiv bestraft:

- Decision 16 / StateVersion 32: `Broker installieren` hat `runner_bank_install_commitment=-1600`, Reason enthält `bankCommitmentActive:false|bankSource:onr_v1_154_broker`.
- Decision 18 / StateVersion 36: erneut `Broker installieren` mit demselben Defer-Muster.
- Decision 19 / StateVersion 37 und Decision 21 / StateVersion 39: `Broker installieren` bleibt negativ, obwohl Economybedarf sichtbar ist.
- Decision 26 / StateVersion 52: `Broker installieren` bleibt weiter negativ und verliert gegen weitere Suche.

### Bewertung

Die Runtime erwartet einen plausiblen sofortigen Follow-up-Load. Das passt für Bankkarten zu eng. Nach Nutzererfahrung ist `Broker` ökonomisch besonders stark, wenn er drei bis fünfmal geladen und dann bei echtem Bedarf ausgezahlt wird. Einmal laden und sofort auszahlen ist schwach; gar nicht installieren und discarden ist deutlich schlechter.

### Akzeptanzkriterium

Eine sichtbare installierbare Bank-/Broker-Economy-Karte darf bei ausreichender Click-/Credit-Lage nicht als `install_deferred` hart abgewertet werden, nur weil der erste Load nicht im selben Zug garantiert ist. Nach Installation soll die KI mehrere Loads bevorzugen, bis ein sinnvoller Bankzielbereich erreicht ist, und Cashout nur bei Fundingbedarf, kritischer Reserve oder hinreichend großem Bankwert wählen.

## Fehlergruppe 2: Verwertbare Karten werden zu leicht discarded

### Evidence

Neue Runner-Heap-Einträge:

- StateVersion 36: `Rigged Investments`
- StateVersion 43: `Vewy Vewy Quiet`
- StateVersion 58: `Broker`
- StateVersion 70: `Force Shield` und `Dwarf`

Besonders auffällig:

- `Rigged Investments` war in der Starthand und wird nach einem gescheiterten Remote-Run discarded.
- `Broker` war in der Starthand, wurde nie genutzt und dann discarded.
- `Dwarf` wurde zuvor über `The Short Circuit` gesucht und danach trotzdem discarded.

### Nutzervertrag

Karten sollen grundsätzlich verwertet werden, nicht einfach abgeworfen. Discard ist plausibel, wenn eine Karte nutzlos, klar redundant, durch Kontext tote Tech oder eine doppelte nicht stackende Karte ist. Nicht plausibel ist das Abwerfen von einzelner Economy-Engine, gerade gesuchter Coverage oder nicht redundanter Rig-Komponente.

### Akzeptanzkriterium

Runner-Discard muss Karten mindestens in diese Klassen einteilen:

- `plan_anchor`: Karte erfüllt einen aktiven Plan oder wurde gerade gesucht.
- `worth_using`: Karte ist nicht redundant und legal oder absehbar verwertbar.
- `economy_engine`: wiederholbare oder dauerhafte Economy.
- `coverage_answer`: sichtbare Breaker-/Coverage-Antwort.
- `redundant_duplicate`: zweite Kopie ohne relevanten Stack-/Mehrwert.
- `dead_context`: sichtbarer Kontext macht die Karte aktuell wertlos.

`plan_anchor`, `economy_engine` und `coverage_answer` sollen nur bei hartem Zwang oder stärkerer Schutzkarte discarded werden.

## Fehlergruppe 3: Coverage-Suche ersetzt Installation

### Evidence

Nach `The Short Circuit`:

- Event 13: `Codecracker` wird gesucht.
- Event 39: `Pile Driver` wird gesucht.
- Event 41: `Raptor` wird gesucht.
- Event 54: `Loony Goon` wird gesucht.
- Event 64: `Dwarf` wird gesucht.
- Event 68: `Black Dahlia` wird gesucht.

Aber:

- StateVersion 40: Rig enthält nur `Codecracker` und `The Short Circuit`; `Pile Driver` liegt in der Hand, `Rigged Investments` ist bereits im Heap.
- StateVersion 80: Hand enthält `Pile Driver`, `Raptor`, `Loony Goon`, `Black Dahlia`; Rig enthält immer noch nur `Codecracker` als Programm.
- StateVersion 120: `Pile Driver` ist erst spät installiert; `Raptor` und `Black Dahlia` bleiben in der Hand.

Trace-Beispiele:

- Decision 21 / StateVersion 39: weitere `The Short Circuit`-Suche gewinnt gegen `Pile Driver installieren`.
- Decision 26 / StateVersion 52: weitere Suche gewinnt gegen `Pile Driver installieren` und `Raptor installieren`.

### Bewertung

Die bestehende Short-Circuit-Härtung adressiert bereits einen Teil dieses Musters. Dieses Match zeigt zusätzlich, dass Handentwicklung und Discard den nächsten Schritt noch stärker absichern müssen: sichtbare Handantworten müssen eingebaut oder finanziert werden, bevor weitere Programmkarten gesucht werden.

### Akzeptanzkriterium

Wenn eine sichtbare, nicht redundante Coverage-Antwort in der Grip liegt, sollen weitere Suchaktionen deutlich zurücktreten. Der nächste sinnvolle Schritt ist je nach Zustand Installation, Funding für Installation oder Run auf das Ziel, das die Coverage freischaltet.

## Fehlergruppe 4: Remote-Contest startet zu früh und wird später aufgegeben

### Evidence

- Decision 16 / StateVersion 32: Runner wählt `Run auf Remote 1`.
- Score-Komponente enthält bereits `runner_run_target_semantic_guidance` mit `recommendation:gain_credits_first`.
- Danach rezzt die Korp `Cortical Scrub`; der Run endet.
- Unmittelbare Folge: `Rigged Investments` wird bei StateVersion 36 discarded.

Später:

- Strategy-Detailsections zeigen `runner.remote_contest` und `runner.remote_trash` als `blocked: below_productive_score_threshold,missing_strategy_anchor`.
- Statt Remote-Rückbindung laufen wiederholt R&D-Runs oder Credit-Klicks.

### Bewertung

Der erste Remote-Run ist nicht rein zufällig, aber zu früh: Die KI ignoriert die eigene Empfehlung, erst Funding/Coverage zu verbessern. Nach dem Blocker entsteht kein stabiler Plan, der zu Remote 1 zurückführt.

### Akzeptanzkriterium

Remote-Contest darf bei sichtbarer Scoregefahr stark werden. Wenn der Remote-Pfad noch nicht sinnvoll erreichbar ist, soll die KI ein konkretes Coverage-/Funding-Subziel wählen und danach zum Remote zurückführen. Sie soll nicht ungebunden in zentrale Opportunitätsruns oder allgemeine Suche kippen.

## Fehlergruppe 5: R&D-Repeat ohne hinreichenden Payoff

### Evidence

Spätere R&D-Runs sind mechanisch sauber:

- Decisions 68-74, 78-84, 88-95 und 98-105 laufen über `Codecracker`: pumpen, brechen, ICE passieren, accessen.
- Der RunnerRunPlan ist dabei aktiv und führt die Run-Sequenz konsistent.

Aber der Payoff wird schwach:

- Event 159 und 169: R&D access zeigt `BBS Whispering Campaign`.
- Decisions 95 und 105: Runner declined Trash, weil Reserve geschützt wird.
- Danach wird dieselbe bekannte R&D-Topkarte erneut angelaufen, ohne Multiaccess oder Trash-Plan.

### Bewertung

Der neue RunnerRunPlan löst hier nicht das strategische Problem. Er führt den einmal begonnenen Run konsistent aus. Die falsche Entscheidung liegt vor Runstart: bekannter R&D-Low-Payoff soll nicht wiederholt als starker Druck gelten, wenn kein Multiaccess, Trash-Intent oder frisch invalidierte Topkarte vorliegt.

### Akzeptanzkriterium

Bekannte R&D-Topkarte ohne Agenda und ohne aktuelle Trash-/Multiaccess-Absicht senkt Repeat-R&D deutlich. R&D bleibt positiv, wenn die Topkarte fresh/invalidiert ist, eine Agenda vermutet werden kann, Multiaccess installiert/verfügbar ist oder ein Trash-Plan existiert.

## Fehlergruppe 6: RunnerRunPlan selbst wirkt im Match grundsätzlich stabil

### Evidence

Bei den R&D-Runs nach Installation von `Codecracker`:

- Pump/Break/Continue/Access-Sequenz ist konsistent.
- Keine `debugSelectionMatchesApplied`-Mismatches.
- `fallbackUsed = false`, `timeoutUsed = false` in allen 106 Traces.

### Bewertung

Kein primärer Engine- oder RunPlan-Fortsetzungsbug. Die zu implementierenden Änderungen sitzen in Strategiewahl, Plananker, Economy-/Discard-Bewertung und Runstart-Payoff.

## Nicht freigabereif aus diesem Spiel

- Eine konkrete `B-Wise`-/Multiaccess-Karte war in den sichtbaren Entscheidungen nicht als legale oder gezogene Option belegt. Der generische Vertrag bleibt: ohne Multiaccess soll wiederholtes R&D auf bekannte Low-Payoff-Topkarte nicht dominant sein.

## Geplante Anpassungen

1. Broker-/Bank-Plan als mehrzügigen Economy-Plan stärken.
2. Discard-Bewertung um Nutzwert-/Redundanz-/Planankerklassen erweitern.
3. Coverage-Suche nach sichtbarer Handantwort stärker in Install/Funding überführen.
4. Remote-Contest bei Scorefenster und Funding-/Coverage-Rückbindung stärken.
5. R&D-Repeat auf bekannte No-Payoff-Topkarten abwerten.
6. Fokussierte Regressionen für Broker, Discard, Coverage/Install und Run-Payoff ergänzen.

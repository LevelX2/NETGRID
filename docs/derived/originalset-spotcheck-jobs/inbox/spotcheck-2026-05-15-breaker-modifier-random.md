---
jobId: spotcheck-2026-05-15-breaker-modifier-random
status: ready_for_implementation
createdAt: 2026-05-15T08:24:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_007_blink
    title: Blink
  - cardId: onr_v1_030_grubb
    title: Grubb
  - cardId: onr_v1_034_incubator
    title: Incubator
  - cardId: onr_v1_051_rabbit
    title: Rabbit
  - cardId: onr_v1_087_forgotten-backup-chip
    title: Forgotten Backup Chip
  - cardId: onr_v1_112_stumble-through-wilderspace
    title: Stumble through Wilderspace
  - cardId: onr_v1_122_artemis-2020
    title: Artemis 2020
  - cardId: onr_v1_194_corporate-downsizing
    title: Corporate Downsizing
  - cardId: onr_v1_217_strike-force-kali
    title: Strike Force Kali
  - cardId: onr_v1_219_superior-net-barriers
    title: Superior Net Barriers
  - cardId: onr_v1_271_tko-2-0
    title: TKO 2.0
  - cardId: onr_v1_280_zombie
    title: Zombie
  - cardId: onr_v1_313_city-surveillance
    title: City Surveillance
  - cardId: onr_v1_343_south-african-mining-corp
    title: South African Mining Corp
  - cardId: onr_v1_360_jerusalem-city-grid
    title: Jerusalem City Grid
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-breaker-modifier-random

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 95 Card IDs wurden aus Register, JSON-Register und vorhandenen Jobberichten tabu gesetzt. Dazu zählen die erledigten Runden 2026-05-14-A/B und 2026-05-15 bis `netwatch-spinn`, die als `done` markierte `contacts-datapool`-Dublette in `in_progress/` und der aktive Inbox-Job `spotcheck-2026-05-15-ambush-hidden-trace.md`.
- Auswahlbegründung: Aus 267 nicht tabu gesetzten decklegalen Originalset-Karten wurde ein komplexer Pool von 109 Karten mit Engine-/Chronik-/Timing-/Choice-/Hidden-Info- oder StateHash-Relevanz gebildet. Daraus wurden zufällig 15 Karten gezogen. Die Stichprobe deckt deterministischen Zufall, Breaker- und Subroutine-Timing, Virus-/Counter-Choices, Hidden-Zone-Reveal/Search, runbasierte Events, scored-agenda-Aktionen, globale Modifier, Damage und servergebundene Region-/Asset-Effekte ab.
- Geprüfte Fachartefakte: `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/shared/src/index.ts`, `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, `data/manifests/card-implementation-manifest-1.9.0.json`, `data/manifests/card-implementation-manifest-1.9.1.json`, `data/manifests/card-implementation-manifest-1.9.3.json`, `data/manifests/card-implementation-manifest-1.9.4.json`, `data/manifests/card-implementation-manifest-1.9.11.json`, `data/manifests/card-implementation-manifest-1.9.15.json`, `data/manifests/card-implementation-manifest-1.9.20.json`, `data/manifests/card-implementation-manifest-1.9.22.json`, `data/manifests/deck-legal-ai-approval-*.json`, `data/ai/ai-card-hints-deck-legal-*.json`, `data/scenarios/v19*.json`, `data/scenarios/ai-deck-legal-*.json`, `data/rules/v1922-local-card-facts.json` und die V1.9.x Planungs-/Review-Artefakte unter `docs/derived/`.

## Kartenbefunde

### onr_v1_007_blink - Blink

Bewertung:
- Engine: Blink nutzt `resolveBlinkBreakSubroutineAction` mit deterministischem Würfel, Subroutine-Index, Encounter-Grenze und Net-Damage-Branch. Die LegalAction-Projektion verhindert Wiederholung derselben Subroutine im Encounter.
- Chronik: Payload enthält `blinkDieRoll`, Erfolg/Schaden und Damage-Summary. Die Würfelbranchs sind nachvollziehbar, aber die bestehende Abdeckung ist eher Engine-fokussiert.
- Tests: Es gibt Tests für deterministischen Würfel, Break-/Damage-Branches, Wiederholungsverbot und Replay/StateHash. Es fehlt ein enger Test für manipulierte Subroutine-Indizes, falsches ICE-Ziel und Damage-Redaction gegen konkrete Grip-Inhalte.
- Hidden-Info/Replay/StateHash: Net Damage darf nur Anzahl und Typ publizieren. RandomDrawRecords sind vorhanden; Griffkarten dürfen weder im EventLog noch in PlayerViews/AI-Inputs auftauchen.
- Fehlende Härtungen: Negative `applyAction`-Fälle für stale/wrong-side/manipulierten `subroutineIndex`, Payload-Redaction bei Damage und zweites ICE im selben Run.

Notwendige Umsetzung:
- [ ] Einen Blink-Fokusblock ergänzen, der eine legale Break-Aktion zwischenspeichert und wrong-side sowie stale `stateVersion` gegen diese Aktion prüft.
- [ ] Manipulierte PlayerAction mit fremdem `iceId` oder ungültigem `subroutineIndex` gegen `applyAction` ablehnen.
- [ ] Damage-Branch mit kontrollierter Runner-Grip prüfen: PublicPayload, PlayerViews, Replay und AI-Input dürfen keine getroffenen Karten offenlegen.
- [ ] Re-Encounter-Test ergänzen: dieselbe Subroutine darf in neuem Encounter wieder Ziel sein, im selben Encounter nicht.

Akzeptanzkriterien:
- [ ] Blink bricht bei 4-6 genau die Ziel-Subroutine und verursacht bei 1-3 exakt entsprechend Net Damage.
- [ ] Falsche Seite, stale State und manipuliertes Ziel scheitern ohne State-Mutation.
- [ ] PublicPayload enthält Würfel und Summary, aber keine privaten Grip-IDs.
- [ ] Replay endet mit identischem StateHash.

### onr_v1_030_grubb - Grubb

Bewertung:
- Engine: Pump-Aktionen erhöhen bei Grubb den `run.remainderStrengthBonusByBreaker` statt nur den Instanzmodifier. Der Bonus wirkt für den Rest des Runs und wird mit dem Run-State beendet.
- Chronik: Payload markiert `runRemainderStrengthBonusApplied` und `runRemainderStrengthBonusAfter`. Die Herkunft ist sichtbar, aber Subroutine-Break-Payloads sollten den durch den Runbonus erreichten Strength-Wert stärker belegen.
- Tests: Remainder-Bonus und Reset im nächsten Run sind vorhanden. Es fehlen explizite wrong-side/stale-Negativfälle für Pump/Break, sowie ein Test, dass der Bonus nicht auf andere Breaker oder Runs überläuft.
- Hidden-Info/Replay/StateHash: Keine verdeckten Karten. Risiko liegt in runlokalem State und deterministischer LegalAction-Projektion.
- Fehlende Härtungen: Cross-breaker-Isolation, Run-Ende-Cleanup, Payload/PlayerView für Stärke.

Notwendige Umsetzung:
- [ ] Test mit Grubb plus zweitem Breaker ergänzen: Pump-Bonus darf nur Grubb betreffen.
- [ ] Nach erfolgreichem und fehlgeschlagenem Run prüfen, dass `remainderStrengthBonusByBreaker` entfernt ist.
- [ ] Wrong-side/stale für Grubb-Pump und Grubb-Break ergänzen.
- [ ] PublicPayload oder Chroniktest um erreichte Breaker-Stärke und Run-Bonus-Quelle erweitern.

Akzeptanzkriterien:
- [ ] Grubb-Bonus gilt nur im aktuellen Run und nur für die konkrete Grubb-Instanz.
- [ ] Zweiter Run startet ohne Bonus.
- [ ] Break-LegalActions berücksichtigen den Bonus, werden aber in `applyAction` erneut validiert.
- [ ] Chronik und Replay sind ohne Hidden-Info stabil.

### onr_v1_034_incubator - Incubator

Bewertung:
- Engine: Erfolgreiche Runs legen Virus-Counter auf Incubator; Start-of-turn rollt deterministisch je Counter und öffnet bei 6 eine Runner-Choice zum Transformieren sichtbarer Virus-Counter.
- Chronik: Die Choice ist `hidden_info_barrier`; der öffentliche Payload nennt nur `incubator_transform`. Für Umsetzung/Debugging fehlen teils Counterquelle, Anzahl der ausstehenden Transforms und Zieltyp-Summary.
- Tests: Deterministische Start-of-turn-Rolls, private Choice, Corp-View-Redaction, Countererhöhung und Replay sind vorhanden. Nicht abgedeckt sind Mehrfach-6, Auswahl gegen nicht mehr vorhandene Ziele und Corp-Purge-Interaktion.
- Hidden-Info/Replay/StateHash: Choice-Optionen können private Runner-Installationen berühren; Corp darf keine Optionen sehen. RandomDrawRecords müssen stabil bleiben.
- Fehlende Härtungen: Multi-transform-Queue, stale Choice, Zielentfernung vor Choice, Purge vor Transform.

Notwendige Umsetzung:
- [ ] Test mit mehreren Incubate-Countern erzwingen, der zwei pending transforms nacheinander abarbeitet.
- [ ] Stale-/Wrong-Side-Choice gegen `v191_incubator_transform_*` prüfen.
- [ ] Zielentfernung oder Virus-Purge vor Choice-Auflösung simulieren und erwartete Ablehnung/No-op festlegen.
- [ ] PublicPayload um `pendingTransformsBefore/After`, Zieltyp (`card`/`pox`) und Counter-Delta ohne private Titel härten.

Akzeptanzkriterien:
- [ ] Jeder erfolgreiche Run legt genau einen Counter auf jede installierte Incubator-Instanz.
- [ ] Mehrere erfolgreiche Würfe erzeugen deterministisch mehrere Transform-Auflösungen.
- [ ] Corp sieht keine privaten Choice-Optionen.
- [ ] Replay-StateHash bleibt über Roll- und Choice-Sequenz stabil.

### onr_v1_051_rabbit - Rabbit

Bewertung:
- Engine: V1.9.22 führt Rabbit derzeit als installierbares Programm mit gegatetem Ability-Vertrag. `v1922-local-card-facts.json` nennt als eigentlichen Effekt eine Reduktion des Trace-Limits auf Corp-ICE um 1.
- Chronik: Install-Payload ist vorhanden, aber keine Trace-Modifikator-Chronik. Dadurch kann die Karte decklegal wirken, ohne ihren eigentlichen Effekt nachweisbar auszuüben.
- Tests: V1.9.22 deckt Install, wrong-side, stale, Sichtbarkeit und Replay für install-only-Programme ab. Ein Trace-Limit-Test mit Corp-ICE fehlt.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Ziel, aber Trace-Bid-Fenster und LegalAction-Kosten müssen aus sichtbarem installierten Rabbit deterministisch projiziert werden.
- Fehlende Härtungen: Eigentliche Rabbit-Trace-Modifikation, ICE-Trace-Filter, PlayerView/AI-Hint-Beleg.

Notwendige Umsetzung:
- [ ] Prüfen, ob Rabbit bewusst install-only bleiben soll; bei decklegalem Vollstatus den Trace-Limit-Modifier implementieren.
- [ ] Trace-ICE-Test ergänzen: mit installiertem Rabbit sinkt das Corp-Bid-/Trace-Limit um 1; ohne Rabbit bleibt es unverändert.
- [ ] Negativtest: nicht-ICE-Trace, deinstallierter Rabbit und Runner-seitige Trace-Quellen dürfen nicht beeinflusst werden.
- [ ] PublicPayload/DecisionDebug um sichtbare Modifierquelle und finalen Trace-Limit-Wert ergänzen.

Akzeptanzkriterien:
- [ ] Rabbit wirkt nur installiert und nur gegen Corp-ICE-Tracequellen.
- [ ] Trace-LegalActions und `applyAction` revalidieren den reduzierten Maximalwert.
- [ ] KI-Input nennt nur sichtbare installierte Quelle, keine verdeckten Corp-Karten.
- [ ] Replay-StateHash ist stabil.

### onr_v1_087_forgotten-backup-chip - Forgotten Backup Chip

Bewertung:
- Engine: Event startet eine private Stack-Search nach Programmen und nutzt Hidden-Zone-Barriere, deterministischen Shuffle und Choice-Auflösung.
- Chronik: Search-Payload ist redigiert; bestehende Tests prüfen `hiddenZoneAction: "search_stack"`. Die Event-spezifische Quelle könnte im PublicPayload klarer sein.
- Tests: V1.9.11 prüft private PendingChoice, Corp-View-Redaction, Zieltransfer und Replay. Fehlend sind kurzer/leer programmfreier Stack, Kosten-/Trashpfad der Eventkarte und stale/wrong-side gegen die offene Choice.
- Hidden-Info/Replay/StateHash: Sehr hohe Hidden-Zone-Relevanz. Die öffentliche Chronik darf nur Suchart, Zielzone und ggf. Reveal der gewählten Definition zeigen, keine übrigen Stack-Optionen.
- Fehlende Härtungen: Kein-Programm-Fall, manipulated choice option, Eventkarte in Heap, AI-Input-Leakscan.

Notwendige Umsetzung:
- [ ] Test ergänzen, dass ohne Programm im Stack keine LegalAction angeboten wird und `applyAction` diesen Zustand erneut validiert.
- [ ] Manipulierte Choice mit nicht angebotener Karten-ID und stale `choiceId` ablehnen.
- [ ] PublicPayload auf Quellkarte, `hiddenZoneBarrier`, Zielzone und fehlende Option-Leaks prüfen.
- [ ] Replay/StateHash für kurzen Stack und Normalfall absichern.

Akzeptanzkriterien:
- [ ] Runner sieht Suchoptionen, Corp sieht keine PendingChoice.
- [ ] Gewählte Programmkarte bewegt sich in die Grip; Stack wird deterministisch gemischt.
- [ ] Eventkarte landet korrekt im Heap.
- [ ] Keine nicht gewählten Stack-Karten erscheinen in PublicEvents, Replays oder AI-Inputs.

### onr_v1_112_stumble-through-wilderspace - Stumble through Wilderspace

Bewertung:
- Engine: Der Event startet aktuell einen `traceAwareRun`, aber der sichtbare Resolver tut primär `startRun`; konkrete Trace-/Access-Folge ist nur über generische V1.9.15-Familie abgesichert.
- Chronik: PublicPayload enthält `serverId` und `traceAwareRun`, aber keinen tatsächlichen Trace-/Bid-/Access-Vertrag.
- Tests: V1.9.15 prüft LegalAction-only StartRun und AccessCount. Ein fokussierter Stumble-Test mit Trace-Bid-Fenster, erfolgreichem Run, Access und Replay fehlt.
- Hidden-Info/Replay/StateHash: Trace ist öffentlich; Access aus HQ/R&D/Archives bleibt hidden-info-sensibel. Der Event darf keine zukünftige Access-Queue oder verdeckte Karten leaken.
- Fehlende Härtungen: Trace-Auslösung oder bewusster No-Trace-Vertrag, serverbezogene Negative, Access-Queue-Redaction.

Notwendige Umsetzung:
- [ ] Lokalen Kartenvertrag prüfen: falls Stumble tatsächlich einen Trace enthalten muss, Resolver und Tests für Trace-Start/Bids/Ergebnis ergänzen.
- [ ] Falls `traceAwareRun` nur Marker ist, Katalog-/AI-Text präzisieren und Test festhalten, dass kein Trace erwartet wird.
- [ ] Fokussierten Run-Test mit successful R&D/HQ-Access, Access-Queue-Redaction und Replay ergänzen.
- [ ] Wrong-side/stale für Event-LegalAction und manipulierten `serverId` prüfen.

Akzeptanzkriterien:
- [ ] Der Event startet nur legale Serverruns und revalidiert das Ziel in `applyAction`.
- [ ] Trace-Verhalten ist entweder vollständig umgesetzt oder ausdrücklich als nicht vorhandener Vertrag getestet.
- [ ] Access-Payload zeigt nur aktuell zugängliche Karten, keine Queue-Zukunft.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_122_artemis-2020 - Artemis 2020

Bewertung:
- Engine: V1.9.22 deckt Artemis als Runner-Hardware/Deck-Installoberfläche ab; lokale Fakten nennen +2 MU, recurring Icebreaker-Credits und Deck-Einzigartigkeit.
- Chronik: Install ist sichtbar und replay-stabil; Recurring-Credit-Nutzung und Deck-Replacement sind nicht Artemis-spezifisch im vorhandenen Fokus belegt.
- Tests: Der generische Hardware-Installtest enthält Artemis; ein späterer Bodyweight-Data-Creche-Test verwendet Artemis als altes Deck. Es fehlt ein Artemis-Fokustest für +2 MU, Recurring-Credits, Start-of-turn-Refresh und Credit-Spend-Filter.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone, aber Kostenprojektion während Runs darf nur sichtbare installierte Hardware und erlaubte Icebreaker-Nutzung berücksichtigen.
- Fehlende Härtungen: Artemis-spezifische MU-/Recurring-/Uniqueness-Abdeckung.

Notwendige Umsetzung:
- [ ] Test ergänzen: Artemis-Installation erhöht MU um 2 und ersetzt/verbietet ein zweites Deck nach dem lokalen Deck-Einzigartigkeitsvertrag.
- [ ] Run-Test mit Icebreaker-Pump/Break: Artemis-Recurring-Credits dürfen nur für zulässige Icebreaker-Nutzung ausgegeben werden.
- [ ] Start-of-turn-Refresh und Replay/StateHash für verbrauchte Recurring-Credits prüfen.
- [ ] PublicPayload um `memoryLimitAfter`, `recurringCreditsAfter` und ggf. `replacedDeckDefinitionId` prüfen.

Akzeptanzkriterien:
- [ ] Artemis gewährt +2 MU und korrekte Recurring-Credits.
- [ ] Credits können nicht für Install, Events, Nicht-Icebreaker oder außerhalb Run ausgegeben werden.
- [ ] Deck-Einzigartigkeit ist LegalAction- und `applyAction`-sicher.
- [ ] Chronik bleibt öffentlich verständlich und replay-stabil.

### onr_v1_194_corporate-downsizing - Corporate Downsizing

Bewertung:
- Engine: Scored Agenda bietet eine Korp-Aktion zum Reveal der R&D-Spitze; `resolveV1911CorporateDownsizing` revalidiert Side, ScoreArea und Definition.
- Chronik: `revealCorpRdTop` setzt Hidden-Zone-Barriere und öffentliche Definition. Existing Test prüft, dass RunnerView keine Instanz-ID enthält.
- Tests: Reveal-Funktion ist abgedeckt. Fehlend sind leerer R&D, stale/wrong-side für die Agenda-Aktion, mehrere gescorte Kopien und StateHash nach wiederholtem Reveal ohne Zonenänderung.
- Hidden-Info/Replay/StateHash: Reveal der obersten R&D-Karte ist öffentlich erlaubt; darunterliegende Karten und Instanz-IDs müssen geheim bleiben.
- Fehlende Härtungen: Leerer R&D No-LegalAction, Kopien/Sourcebindung, AI-Input-Leakscan.

Notwendige Umsetzung:
- [ ] Test: Bei leerem R&D wird keine LegalAction projiziert und manipulierte Aktion scheitert.
- [ ] Wrong-side/stale für die konkrete Agenda-Aktion ergänzen.
- [ ] Zwei gescorte Corporate-Downsizing-Kopien testen: ausgewählte Quelle muss in Payload/Chronik stimmen.
- [ ] PublicPayload, RunnerView und AI-Input auf genau eine `publicRevealDefinitionId` und keine Instanz-/R&D-Restdaten prüfen.

Akzeptanzkriterien:
- [ ] Nur gescorte Corporate Downsizing kann die Aktion nutzen.
- [ ] R&D-Spitze wird öffentlich als Definition gezeigt, ohne weitere R&D-Informationen.
- [ ] Mehrere Quellen bleiben source-bound.
- [ ] Replay-StateHash ist stabil.

### onr_v1_217_strike-force-kali - Strike Force Kali

Bewertung:
- Engine: Scored Agenda gibt bei getaggtem Runner eine Korp-Aktion für 2 Meat Damage. LegalAction-Projektion prüft Tags; `applyAction` läuft über AgendaAbility-Pfad und Damage-Auflösung.
- Chronik: Damage-Summary ist vorhanden, aber der bestehende Test prüft primär Grip-Längenänderung und LegalAction-Entfall ohne Tag.
- Tests: Tagged-only und Damage grob abgedeckt. Fehlend sind wrong-side/stale, Tag-Drift zwischen Projektion und Anwendung, Damage-Redaction und Replay.
- Hidden-Info/Replay/StateHash: Meat Damage trasht zufällige Gripkarten. PublicPayload darf keine getroffenen Karten zeigen.
- Fehlende Härtungen: Revalidation bei verlorenem Tag, Prevention-/Replacement-Kompatibilität, Payload.

Notwendige Umsetzung:
- [ ] LegalAction bei getaggtem Runner erfassen, Runner-Tags danach auf 0 setzen und `applyAction` muss scheitern.
- [ ] Wrong-side/stale gegen die Agenda-Aktion ergänzen.
- [ ] Damage-Branch mit kontrollierter Grip prüfen: PublicPayload, PlayerViews und AI-Input ohne private Karten.
- [ ] Replay/StateHash mit festem Seed ergänzen; optional Damage-Prevention-Fenster gegen bestehende Prevention-Resolver testen.

Akzeptanzkriterien:
- [ ] Ohne aktuellen Tag ist keine Aktion legal und keine manipulierte Aktion ausführbar.
- [ ] Mit Tag entstehen exakt 2 Meat Damage.
- [ ] Damage-Redaction bleibt in Chronik, Replay und PlayerViews dicht.
- [ ] Replay-StateHash ist stabil.

### onr_v1_219_superior-net-barriers - Superior Net Barriers

Bewertung:
- Engine: `iceStrengthBonusFor` gibt scored Superior Net Barriers allen Wall-ICE +1 Stärke. Der V1.9.5-Test prüft einen Wall-of-Static-Fall.
- Chronik: Der Modifier ist in PlayerView-Stärke sichtbar, aber Rez-/Encounter-Payloads nennen die Quelle nicht ausdrücklich.
- Tests: Ein positiver Wall-Fall existiert. Fehlend sind Nicht-Wall-Negativfall, mehrere Superior-Kopien, Steal-vs-Score-Abgrenzung und RunnerView vor Score.
- Hidden-Info/Replay/StateHash: Agenda ist bis Score/Access verdeckt. Der Modifier darf erst aus ScoreArea wirken und keine unrevealed Agenda in PlayerView oder Kostenprojektion leaken.
- Fehlende Härtungen: Source-Attribution, Scope gegen nicht gescorte/gestohlene Kopien, Stackbarkeit.

Notwendige Umsetzung:
- [ ] Tests für Wall, Nicht-Wall und mehrere gescorte Superior-Net-Barriers-Kopien ergänzen.
- [ ] Testen, dass installierte, ungescorte oder gestohlene Kopien keinen Korp-Bonus geben.
- [ ] PlayerViews vor und nach Score prüfen: vor Score keine Agenda-Identität; nach Score öffentliche Modifierquelle.
- [ ] Chronik/Encounter-Payload um Modifierquelle oder einen fokussierten Strength-Projection-Test ergänzen.

Akzeptanzkriterien:
- [ ] Nur Korp-scoreArea-Kopien geben Wall-ICE +1 Stärke.
- [ ] Nicht-Wall-ICE bleiben unverändert.
- [ ] Mehrere Kopien verhalten sich nach festgelegtem Stack-Vertrag.
- [ ] Keine verdeckte Agenda-Information leakt vor Score/Access.

### onr_v1_271_tko-2-0 - TKO 2.0

Bewertung:
- Engine: ICE hat eine Forgo-next-action-Subroutine plus End-the-run. Der V1.9.3-Test prüft ungebrochenen Continue-Run und Klickverlust.
- Chronik: Aktueller Test belegt State-Outcome, aber nicht die Payload-Felder für Action-Schuld und Subroutine-Index.
- Tests: Ein positiver unbroken-Fall existiert. Fehlend sind Break-Index-Stabilität, wrong-side/stale für Break/Continue, Runner-Klicks bei 0 und Replay.
- Hidden-Info/Replay/StateHash: ICE ist bis Rez verdeckt. Nach Rez sind Subroutinen öffentlich; Action-Schuld muss deterministisch und run-/turn-sicher aufgelöst werden.
- Fehlende Härtungen: Action-Debt-Cleanup, indexstabile Subroutinen, Payload/StateHash.

Notwendige Umsetzung:
- [ ] Fokus-Test mit passendem Breaker ergänzen: Subroutine 0 brechen verhindert Action-Schuld, Subroutine 1 kann separat brechbar bleiben.
- [ ] Unbroken-Test mit Runner bei 0 Klicks: keine negative Klickzahl, aber klarer Payload.
- [ ] Wrong-side/stale für `continue_run` und `break_subroutine` prüfen.
- [ ] Replay/StateHash und PublicPayload auf `forgoNextAction`/Subroutine-Index ergänzen.

Akzeptanzkriterien:
- [ ] Ungebrochene erste Subroutine kostet genau die nächste Runner-Aktion oder setzt keine negative Klickzahl.
- [ ] End-the-run beendet den Run nur, wenn ungebrochen.
- [ ] Gebrochene Subroutine erzeugt keine Action-Schuld.
- [ ] Rez-Visibility und Replay bleiben stabil.

### onr_v1_280_zombie - Zombie

Bewertung:
- Engine: Zombie hat zwei Core-Damage-Subroutinen und End-the-run. V1.9.22 enthält Zombie als per-card Longtail-ICE, zudem wird es in Flak-/Reflector-Tests als AP-Ziel benutzt.
- Chronik: Core-Damage-Payload muss Amount, CoreDamageAfter und Handlimit-Auswirkung zeigen, ohne Gripkarten zu leaken.
- Tests: Zombie erscheint in V1.9.22-Smokes und Breaker-Tests. Ein enger Zombie-Test für zwei ungebrochene Core-Damage-Subroutinen plus ETR, Redaction, Flatline und Replay fehlt.
- Hidden-Info/Replay/StateHash: Core Damage kann Flatline/Handlimit beeinflussen und ggf. zufälliges Trashen auslösen. Öffentliche Events dürfen keine Handinhalte zeigen.
- Fehlende Härtungen: Doppel-Core-Damage-Sequenz, Break einzelner Subroutinen, Flatline-Grenzfall.

Notwendige Umsetzung:
- [ ] Test mit ungebrochenem Zombie: zwei Core Damage nacheinander, danach End-the-run.
- [ ] Test mit Break nur einer Core-Damage-Subroutine und ungebrochener zweiter Subroutine.
- [ ] Flatline-/Handlimit-Grenzfall mit PublicPayload-Redaction und Replay ergänzen.
- [ ] Wrong-side/stale für `continue_run` oder passende Break-Aktion ergänzen.

Akzeptanzkriterien:
- [ ] Jede Core-Damage-Subroutine verursacht genau 1 Core Damage.
- [ ] Gebrochene Subroutinen werden nicht aufgelöst.
- [ ] PublicPayload nennt Damage-Summary und Handlimit/CoreDamageAfter, aber keine privaten Karten.
- [ ] Replay-StateHash ist stabil.

### onr_v1_313_city-surveillance - City Surveillance

Bewertung:
- Engine: Katalog und Manifest deklarieren City Surveillance als rezzed Asset mit globaler Tag-/Run-Surveillance-Modifier-Fläche. Im sichtbaren Engine-Code ist kein kartenkonkreter `v1920AssetAbility`-Pfad für diese Karte erkennbar; V1.9.20-Tests fokussieren andere Action-Assets.
- Chronik: Install/Rez/Trash-on-access sind generisch sichtbar. Der konkrete Modifier-Vertrag ist im Payload nicht nachgewiesen.
- Tests: V1.9.20-Smokes/AI-Hints decken die Karte auf Releaseebene ab. Es fehlt ein Einzeltest, der die tatsächliche globale Wirkung der Karte beweist.
- Hidden-Info/Replay/StateHash: Rezzed Asset ist öffentlich; Modifier darf nicht aus unrezzed Root leaken. Run-/Tag-Fenster müssen side-sicher bleiben.
- Fehlende Härtungen: Effektvollständigkeit, rezzed-only, Modifier-Attribution.

Notwendige Umsetzung:
- [ ] Lokalen finalen Effektvertrag für City Surveillance gegen aktuelle Runtime prüfen.
- [ ] Falls nur Install/Rez vorhanden ist, Resolver für die deklarierte Tag-/Run-Surveillance-Wirkung ergänzen oder Katalog-/AI-Vertrag herabstufen.
- [ ] Tests: unrezzed kein Effekt, rezzed Effekt, Trash entfernt Effekt, wrong-side/stale für relevante LegalActions.
- [ ] PublicPayload/PlayerView/AI-Input um sichtbare Modifierquelle prüfen.

Akzeptanzkriterien:
- [ ] City Surveillance hat eine nachweisbare, kartenkonkrete Wirkung oder ist nicht irreführend als vollwirksam beschrieben.
- [ ] Wirkung gilt nur aus rezzed öffentlicher Quelle.
- [ ] Trash/Unrez entfernt die Wirkung sofort.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_343_south-african-mining-corp - South African Mining Corp

Bewertung:
- Engine: Manifest beschreibt Economy-, Handlimit-/Action-Economy- und Global-Modifier-Flächen. Die generischen V1.9.20 Action-Asset-Tests prüfen andere Karten; South African Mining Corp ist nicht direkt als Action-Asset im sichtbaren Pfad belegt.
- Chronik: Generisches Install/Rez reicht für Decklegalität nicht als Effektvollständigkeitsnachweis; Credit-/Handlimit-/Action-Effekte brauchen eigene Payloads.
- Tests: Release- und AI-Smokes enthalten die Karte. Einzeltests für Credit-Effekt, Handlimit/Action-Modifikation, rezzed-only und Trash-Cleanup fehlen.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone, aber Korp-HQ und R&D dürfen in Economy-/Draw-/Action-Payloads nicht indirekt leaken.
- Fehlende Härtungen: Effektkonkretisierung, Modifier-Lifecycle, PublicPayload.

Notwendige Umsetzung:
- [ ] Finalen lokalen Effektvertrag bestimmen: welche Economy-/Handlimit-/Action-Wirkung diese Karte konkret hat.
- [ ] Resolver oder Katalogstatus anpassen, falls die aktuelle Runtime nur generische Oberfläche liefert.
- [ ] Tests für rezzed-only, Trash-Cleanup, wrong-side/stale und Replay ergänzen.
- [ ] Chronikpayload um Quelle, Delta und Endwerte (`corpCreditsAfter`, `corpClicksAfter` oder Handlimit) erweitern.

Akzeptanzkriterien:
- [ ] Die Karte bewirkt exakt den dokumentierten Effekt und nicht nur Install/Rez.
- [ ] Modifier wirken nicht aus HQ, Archives, R&D oder unrezzed Remote.
- [ ] PublicPayload enthält nur öffentliche Endwerte und keine Hand-/Deckinhalte.
- [ ] Replay-StateHash ist stabil.

### onr_v1_360_jerusalem-city-grid - Jerusalem City Grid

Bewertung:
- Engine: Katalog/Manifest deklarieren rezzed servergebundene Region-/Global-Modifier-Flächen. Im sichtbaren Code ist kein spezifischer Jerusalem-City-Grid-Modifier wie bei New Galveston oder Washington erkennbar.
- Chronik: Region-Install/Rez kann generisch funktionieren, aber die servergebundene Wirkung und Region-Ersetzung müssen für diese Karte nachweisbar sein.
- Tests: V1.9.20-Smokes/AI-Hints enthalten die Karte, aber keine spezifische Wirkung. Fehlend sind Region-Uniqueness, eigener Server vs. anderer Server und Trash-Cleanup.
- Hidden-Info/Replay/StateHash: Root/Upgrade ist bis Rez verdeckt; ein Kosten-/Stärke-/Runmodifier darf Runner vor Rez keine Identität verraten.
- Fehlende Härtungen: Effektvollständigkeit, Serverbindung, Region-Replacement, No-Leak-Kostenprojektion.

Notwendige Umsetzung:
- [ ] Lokalen Effektvertrag finalisieren und gegen aktuelle Runtime prüfen.
- [ ] Falls fehlend, servergebundenen Modifier-Resolver implementieren oder Katalog-/AI-Vertrag herabstufen.
- [ ] Tests: zweite Region ersetzt erste, Modifier wirkt nur im eigenen Server, anderer Server unverändert, Trash entfernt Wirkung.
- [ ] PlayerView/Chronik prüfen: vor Rez anonym, nach Rez Quelle und Serverbindung öffentlich.

Akzeptanzkriterien:
- [ ] Jerusalem City Grid ist als Region eindeutig und servergebunden.
- [ ] Modifier wirkt nur aus rezzed Root des betroffenen Servers.
- [ ] Vor Rez leakt keine Kartenidentität über Kosten- oder Stärkeprojektion.
- [ ] Replay-StateHash ist stabil.

## Gesamtplan

1. Zuerst Effektvollständigkeit klären: `Rabbit`, `City Surveillance`, `South African Mining Corp` und `Jerusalem City Grid` dürfen nicht nur decklegale Oberflächen bleiben, wenn Manifest/Katalog echte Modifier versprechen.
2. Danach deterministische Zufalls-/Choice-Pfade härten: `Blink` und `Incubator` mit wrong-side/stale, Manipulationsfällen, Redaction und Replay.
3. Hidden-Zone-Pfade absichern: `Forgotten Backup Chip` und `Corporate Downsizing` mit Kein-Ziel-Fällen, Sourcebindung, Choice-/Reveal-Redaction und AI-Input-Leakscan.
4. Run-/Breaker-/ICE-Timing prüfen: `Grubb`, `Stumble through Wilderspace`, `TKO 2.0` und `Zombie` mit Subroutine-Indizes, Run-Cleanup, Access/Trace-Vertrag, Damage-Redaction und StateHash.
5. Scored-/global Modifier und Damage abrunden: `Strike Force Kali`, `Superior Net Barriers` und `Artemis 2020` mit Revalidation, Modifier-Lifecycle, Recurring-Credit-Filter und PublicPayload.
6. Abschließend alle 15 Karten gegen Katalogstatus, Manifest, AI-Hints, Szenarien, Chronik und Replay/StateHash synchron prüfen, ohne Karten neu zu promoten.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

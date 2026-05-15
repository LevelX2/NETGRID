---
jobId: spotcheck-2026-05-15-agenda-run-recurring
status: done
createdAt: 2026-05-15T16:11:04+01:00
startedAt: 2026-05-15T22:39:47.4185822+02:00
completedAt: 2026-05-15T22:59:36.5734906+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_189_artificial-security-directors
    title: Artificial Security Directors
  - cardId: onr_v1_182_submarine-uplink
    title: Submarine Uplink
  - cardId: onr_v1_202_genetics-visionary-acquisition
    title: Genetics-Visionary Acquisition
  - cardId: onr_v1_305_team-restructuring
    title: Team Restructuring
  - cardId: onr_v1_303_silver-lining-recovery-protocol
    title: Silver Lining Recovery Protocol
  - cardId: onr_v1_062_shredder-uplink-protocol
    title: Shredder Uplink Protocol
  - cardId: onr_v1_124_corolla-speed-chip
    title: Corolla Speed Chip
  - cardId: onr_v1_043_mystery-box
    title: Mystery Box
  - cardId: onr_v1_045_newsgroup-filter
    title: Newsgroup Filter
  - cardId: onr_v1_300_project-consultants
    title: Project Consultants
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-agenda-run-recurring

## Auswahlprüfung

- Deduplizierung erfolgte gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle Markdown-Jobberichte unter `docs/derived/originalset-spotcheck-jobs/inbox`, `in_progress`, `done` und `blocked`.
- Gefundene Tabu-Menge: 190 vollständige `onr_v1_*` Card IDs. Keine der zehn ausgewählten Karten kam in Register oder Queue vor.
- Kandidatenbasis: lokale Deck-Legal-/AI-Approval-Manifeste und Kartenimplementierungsmanifeste; 361 decklegale IDs, 173 nicht-tabue Kandidaten, 65 hochkomplexe Kandidaten nach Timing-/Choice-/Hidden-Info-/Replay-/PublicPayload-Signal.
- Auswahlfokus: Agenda-Difficulty/Overadvance, gescorte Agenda-Reveal-Aktionen, Corp-Operationen mit Counter-/Advancement-Payload, Run-/Access-Helfer, Trace/Base-Link, Recurring-Credits und installierte Programm-Aktionen.

## Kartenbefunde

### onr_v1_189_artificial-security-directors - Artificial Security Directors

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

V1.9.19 führt die Karte als `human_playable` und `ai_supported` mit `scored_agenda_static_active_resolver`, `hidden_zone_search_reveal_reorder_resolver` und `agenda_difficulty_overadvance_resolver`. Der bestehende Engine-Test deckt Overadvance, Bonus-Agenda-Counter, öffentliche Payload und Replay/StateHash ab, aber primär im Kombipfad mit Roving Submarine. Kritisch bleibt, dass die Difficulty-Reduktion für Black-Ops-Agendas nicht als isolierter Negativ-/Positivfall mit fremden Agenda-Subtypen nachgetestet ist. Der Reveal-Pfad darf vor der aktiven gescorten Agenda-Aktion keine R&D-Topkarte in Runner-Views, PublicEvents oder KI-Inputs projizieren.

Notwendige Umsetzung

- Ergänze einen fokussierten Nachtest, der eine Black-Ops-Agenda und eine Nicht-Black-Ops-Agenda mit Artificial Security Directors im Scorebereich gegenüberstellt.
- Prüfe `LegalActions` und `applyAction` für die gescorte R&D-Reveal-Aktion auf Side, `actionId`, `stateVersion`, Timingpunkt und installierte/gescorte Quelle.
- Härte die Chronik so, dass Difficulty-Modifier, Overadvance und Reveal-Ursprung öffentlich nachvollziehbar sind, ohne unrevealte R&D-Daten vorab zu nennen.

Akzeptanzkriterien

- Black-Ops-Difficulty wird genau einmal reduziert; andere Subtypen bleiben unverändert.
- Runner-View und KI-Input enthalten vor der Reveal-Aktion keinen Titel der R&D-Topkarte.
- Replay über Score plus optionale Reveal-Aktion endet mit identischem `StateHash`.

### onr_v1_182_submarine-uplink - Submarine Uplink

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Die Karte kombiniert Ressource, Base Link, +1 Link, Trace-Fenster und den Zwang, nach dem aktuellen Encounter auszujacken. Manifeste markieren `trace_link_bid_window_resolver` und `typed_counter_virus_purge_resolver`; die sichtbaren Tests weisen sie bisher vor allem in Release-/AI-Smokes und Sammelguards nach. Das Risiko liegt in Timing und Zustandskopplung: Base-Link darf nur im Trace gegen den Runner wirken, nur ein Base-Link-Provider darf je Traceversuch gelten, und der Jack-out-Zwang muss encountergebunden statt runweit unscharf landen.

Notwendige Umsetzung

- Ergänze einen Engine-Nachtest für Base Link 4, +1 Link und die "nur ein Base-Link"-Regel in einem Trace-Bidding-Fenster.
- Prüfe, dass die Nutzung während eines Encounters einen Pending-/Run-Flag setzt, der nach Encounter-Ende deterministisch zum Jack-out führt.
- Ergänze Wrong-Side-/Stale-Revalidation für die Aktivierung und eine Chronik, die Link-Bid, Quelle und erzwungenen Jack-out ohne private Hand-/Stackdaten beschreibt.

Akzeptanzkriterien

- Die Aktion erscheint nur für den Runner, nur während eines Runs und nur in einem gültigen Trace-/Encounter-Kontext.
- Mehrere Base-Link-Quellen können nicht kumulativ denselben Traceversuch verzerren.
- Replay von Trace, Encounter-Ende und erzwungenem Jack-out ist StateHash-stabil.

### onr_v1_202_genetics-visionary-acquisition - Genetics-Visionary Acquisition

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Diese Agenda ist das Gegenstück zu Artificial Security Directors: sie reduziert Research-Agenda-Difficulty und bietet ebenfalls gescorte Agenda-/Hidden-Zone-Berührung. Bestehende Tests decken Score, R&D-Reveal ohne Vorab-Leak und Systematic-Layoffs-Choice mit dieser Agenda ab. Offen ist ein enger Nachtest, der die Research-Reduktion gegen Nicht-Research-Agendas und gegen mehrere gleichzeitige Difficulty-Modifier abgrenzt.

Notwendige Umsetzung

- Ergänze einen isolierten Research-/Nicht-Research-Difficulty-Test mit Genetics-Visionary Acquisition im Scorebereich.
- Prüfe Modifier-Reihenfolge und Mindest-Difficulty, falls servergebundene Modifier oder Overadvance parallel aktiv sind.
- Sichere die gescorte R&D-Reveal-Aktion mit PublicPayload- und PlayerView-Leak-Assertions ab.

Akzeptanzkriterien

- Research-Agendas erhalten exakt die erwartete Difficulty-Reduktion; andere Subtypen nicht.
- PublicPayload nennt erst nach der Reveal-Auflösung `cardDefinitionId` und Titel.
- Score-, Reveal- und Choice-Folgen replayen mit identischem `StateHash`.

### onr_v1_305_team-restructuring - Team Restructuring

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Team Restructuring nutzt den V1.9.19-Corp-Operation-Counterpfad und legt Power-Counter auf eine geeignete Agenda. Der sichtbare Test `v1919-operation-paths` deckt Falsified-Transactions Expert, Project Consultants und Systematic Layoffs konkreter ab, aber Team Restructuring selbst erscheint vor allem in Manifest-, Release-Smoke- und Sammelguard-Spuren. Damit fehlt ein enger Karten-ID-Nachtest für Zielwahl, Countertyp, LegalAction-Projektion und applyAction-Revalidation.

Notwendige Umsetzung

- Ergänze einen fokussierten Play-Operation-Test für Team Restructuring mit genau einer und mit mehreren geeigneten Agenden.
- Falls mehrere Ziele möglich sind, muss eine side-sichere Choice entstehen; falls nur ein Ziel möglich ist, muss das Ziel deterministisch und öffentlich nachvollziehbar gewählt werden.
- Prüfe Wrong-Side, stale `stateVersion`, fehlendes Ziel und nicht passende Zieltypen.

Akzeptanzkriterien

- Team Restructuring legt genau einen Power-Counter auf ein legales Agenda-Ziel.
- Keine Corp-HQ- oder R&D-Details landen in PublicPayload, Runner-View oder Fehlertexten.
- Choice-Auflösung und direkter Einziel-Pfad sind replay-/StateHash-stabil.

### onr_v1_303_silver-lining-recovery-protocol - Silver Lining Recovery Protocol

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Der implementierte Operation-Resolver gewinnt 3 Credits und schreibt `v1919OperationAbility`, `gainedCredits` und `corpCreditsAfter` in die Payload. Die Karte ist fachlich einfacher als die Agenda-/Choice-Karten, aber sie sitzt im gleichen Operation-Dispatcher wie Counter- und Forfeit-Pfade. Der Nachtest sollte sicherstellen, dass der Credit-Gain nicht versehentlich durch Agenda-Difficulty-/Counter-Zielzustände beeinflusst wird und dass Chronik und PublicPayload vollständig, aber nicht privat sind.

Notwendige Umsetzung

- Ergänze einen Karten-ID-spezifischen Test für Play-Operation, Creditbetrag, Click-/Kostenverbrauch und PublicPayload.
- Prüfe, dass kein Ziel und keine Choice für diese Karte projiziert wird.
- Ergänze eine Replay/StateHash-Assertion über den gesamten Play-Operation-Event.

Akzeptanzkriterien

- Korp gewinnt exakt 3 Credits, unabhängig von installierten/scored Agendas.
- Die LegalAction bleibt ziel- und choicefrei; applyAction validiert Side und `stateVersion`.
- PublicPayload enthält nur öffentliche Credit-/Ability-Felder.

### onr_v1_062_shredder-uplink-protocol - Shredder Uplink Protocol

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Shredder Uplink Protocol ist V1.9.15 decklegal und wird in einem Sammeltest zusammen mit anderen installierten Run-/Access-Helfern installiert. Das Risiko liegt weniger in Installation/MU als in Access-Queue und Ersatz-/Zusatzaccess: die Karte darf nur LegalActions erzeugen, die aus dem aktuellen Run-/Breach-Zustand stammen, und darf keine R&D-/HQ-/Archives-Information in Previews leaken.

Notwendige Umsetzung

- Ergänze einen fokussierten Run/Breach-Test, der Shredder Uplink Protocol als Quelle des Access-Effekts eindeutig identifiziert.
- Prüfe applyAction-Revalidation bei beendetem Run, verändertem Access-Queue-Zustand und stale `stateVersion`.
- Ergänze PublicPayload-/PlayerView-Assertions für Access-Reihenfolge, Steal/Trash/Pass-Choices und Hidden-Zone-Barriere.

Akzeptanzkriterien

- Der Effekt kann nur während eines gültigen Runs und nur aus installierter Quelle genutzt werden.
- Queue-Änderungen sind öffentlich chronikfähig, ohne unrevealte Karten vor Access zu benennen.
- Replay von Runstart, Breach, Access-Effekt und Folgechoice ist StateHash-stabil.

### onr_v1_124_corolla-speed-chip - Corolla Speed Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

V1.9.22 führt Corolla Speed Chip als Runner-Hardware decklegal; lokale Fakten nennen 1 recurring restricted credit für Killer-Nutzung während Runs. Die bestehenden V1.9.22-Hardwaretests prüfen Installation, Wrong-Side-/Stale-Revalidation, PublicPayload und Replay für alle Hardwarekarten, aber die konkrete recurring-restricted Killer-Zahlung ist in den sichtbaren Tests für ZZ22 Speed Chip ausgeprägt, nicht für Corolla Speed Chip.

Notwendige Umsetzung

- Ergänze einen Karten-ID-spezifischen Test, der Corolla Speed Chip mit 1 recurring_credit lädt, beim Killer-Einsatz während eines Runs ausgibt und zu Runner-Turn-Start auffüllt.
- Prüfe Negativfälle: Nicht-Killer, Nutzung außerhalb eines Runs, unzureichender Counter und Mehrfachnutzung vor Refresh.
- Chronik muss Counter-Ausgabe und Refresh öffentlich zeigen, ohne Hand-/Stackdetails oder private ICE-Kontextdaten zu leaken.

Akzeptanzkriterien

- Genau 1 recurring_credit wird geladen, ausgegeben und deterministisch refreshed.
- Der Credit kann nur für Killer-Nutzung während Runs verwendet werden.
- Counterverbrauch, Refresh und abgelehnte Nutzung bleiben replay-/StateHash-stabil.

### onr_v1_043_mystery-box - Mystery Box

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Mystery Box zeigt die obersten fünf Stackkarten der Korp, trashte sich bei Programmfund und installiert eines der Programme kostenfrei; danach wird der Stack gemischt und die Fähigkeit ist nur einmal pro Run nutzbar. Der vorhandene Sammeltest für V1.9.15 installiert die Karte und prüft Hidden-Zone-Barriere im Access-Kontext, aber ein enger Mystery-Box-Test für Stack-Reveal, Programmauswahl, Self-Trash, Free-Install, Shuffle, Once-per-run und PublicPayload fehlt als hochrelevante Hidden-Info-/RandomCounter-/Choice-Härtung.

Notwendige Umsetzung

- Ergänze einen fokussierten Test mit fünf bekannten Stackkarten, mindestens zwei Programmen und einer Runner-Choice für das zu installierende Programm.
- Prüfe No-Program-Fall, Once-per-run-Sperre, Nutzung außerhalb eines Runs, Self-Trash und kostenfreie Installation inklusive MU.
- Shuffle muss über Seed/RandomCounter/RandomDrawRecords laufen; PublicPayload darf nur revealed Karten und Auswahlfolge enthalten, keine restliche Stackordnung.

Akzeptanzkriterien

- Nur die fünf revealed Stackkarten werden öffentlich; unrevealte Stackkarten bleiben privat.
- Programmwahl, Trash von Mystery Box, Free-Install und Shuffle sind LegalAction-/Choice-basiert und applyAction-revalidiert.
- Replay mit identischem Seed erzeugt identische RandomDrawRecords und denselben `StateHash`.

### onr_v1_045_newsgroup-filter - Newsgroup Filter

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Newsgroup Filter ist V1.9.22 als Runner-Programm mit Installkosten 5, MU 2 und installierter Aktion `[A]: Gain 2 Credits` umgesetzt. Der bestehende Test deckt Installation, Wrong-Side, stale `stateVersion`, Credit-Gain, PublicPayload und Replay/StateHash ab. Der Spotcheck sollte nachhärten, dass die Aktion nur im Runner-Main-Action-Fenster erscheint, nach Trash/Deinstallation verschwindet und nicht durch falsche Payload-Werte manipuliert werden kann.

Notwendige Umsetzung

- Ergänze Negativtests für falsches Timing, nicht installierte Quelle, getrashte Quelle und manipuliertes `gainCreditsAmount`.
- Prüfe, dass `LegalActions` die Aktion nur aus der installierten Programminstanz und mit genau `gainCreditsAmount: 2` erzeugen.
- Ergänze Chronikprüfung für Action-Kosten, Credit-Gain und sichtbare Quelle.

Akzeptanzkriterien

- Die Aktion erscheint nur für den Runner, nur bei installierter Quelle und nur im gültigen Hauptaktionsfenster.
- applyAction verwirft falsche Side, stale Version, manipulierten Betrag und nicht mehr installierte Quelle.
- PublicPayload bleibt frei von Grip-/HQ-/R&D-/CardInstances-Daten und replayt stabil.

### onr_v1_300_project-consultants - Project Consultants

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Project Consultants legt einen Advancement-Counter auf eine installierte Agenda und ist im V1.9.19-Operationstest bereits konkret enthalten. Offen bleibt eine Härtung für Zielauswahl und Revalidation: der aktuelle Resolver nimmt ein vorhandenes `v1919InstalledAgendaTarget`; bei mehreren installierten Agenden muss klar sein, ob die Engine deterministisch wählt oder eine Choice öffnen soll. Außerdem muss ein zwischen LegalAction und applyAction verändertes Ziel sauber abgelehnt werden.

Notwendige Umsetzung

- Ergänze einen Mehrziel-Test mit zwei installierten Agenden und dokumentiere/implementiere die gewünschte Zielstrategie.
- Ergänze stale-/target-gone-Revalidation: Agenda getrasht, gescored oder aus Server verschoben zwischen Projektion und applyAction.
- Prüfe PublicPayload auf Ziel-ID, Definition-ID, hinzugefügte Counter und Counterstand nach Auflösung.

Akzeptanzkriterien

- Genau eine legale installierte Agenda erhält genau einen Advancement-Counter.
- Mehrzielverhalten ist LegalAction-/Choice-basiert oder deterministisch dokumentiert und getestet.
- Zieländerungen zwischen Projektion und Ausführung führen zu sauberem Fehler ohne Hidden-Info-Leak.

## Gesamtplan

1. Zuerst V1.9.19-Operationen und Agendas härten: Artificial Security Directors, Genetics-Visionary Acquisition, Project Consultants, Silver Lining Recovery Protocol und Team Restructuring teilen sich Difficulty-/Counter-/Operation-Infrastruktur.
2. Danach V1.9.15-Run-/Access-Helfer isolieren: Mystery Box und Shredder Uplink Protocol brauchen enge Run-, Hidden-Zone-, Choice- und Queue-Tests jenseits der Sammelabdeckung.
3. Anschließend Runner-Rig-Sonderfälle nachziehen: Submarine Uplink für Trace/Base-Link/Jack-out und Corolla Speed Chip für restricted recurring Killer-Credits.
4. Newsgroup Filter zuletzt als Regression-Härtung nutzen, weil bereits gute Positivabdeckung existiert und vor allem Manipulations-/Timing-Negativfälle fehlen.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm test`
- Fokus-Grep nach den zehn IDs in `packages/engine/src/index.test.ts`, um Sammeltests nicht mit fokussierten Karten-ID-Nachtests zu verwechseln.
- Leak-Scan der neuen PublicPayload-/PlayerView-Assertions gegen `grip`, `hq`, `rd`, `stack`, `cardInstances`, `privatePayload` und unrevealte Kartentitel.
- Replay/StateHash-Assertions für mindestens: Agenda-Score plus Reveal, Operation mit Ziel/Counter, Mystery-Box-Stack-Shuffle, Submarine-Uplink-Trace/Jack-out und Corolla-Speed-Chip-Refresh.

## Umsetzungsergebnis

Status: `done`.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AGENDA_RUN_RECURRING_IMPLEMENTATION.md`

Umgesetzt:

- `Corolla Speed Chip` hat jetzt einen echten 1-Recurring-Credit-Vertrag fuer Killer-Nutzung waehrend Runs plus Start-of-turn-Refresh.
- `Mystery Box` nutzt eine LegalAction-basierte Run-Faehigkeit mit oeffentlichem Top-5-Stack-Reveal, Runner-Choice, kostenfreier Programminstallation, Self-Trash, Once-per-run-Sperre und deterministischem Shuffle.
- `Shredder Uplink Protocol` schreibt den Access-Bonus mit Quellen-ID ins PublicPayload, ohne Folgeaccess-Karten vorzeitig offenzulegen.
- V1.9.19-Operationen/Agendas (`Project Consultants`, `Team Restructuring`, `Silver Lining Recovery Protocol`, `Artificial Security Directors`, `Genetics-Visionary Acquisition`) haben fokussierte Ziel-, Revalidation-, PublicPayload- und Replay-Nachtests.
- `Submarine Uplink` und `Newsgroup Filter` haben fokussierte Trace-/Timing-/Source-Negativtests.

Checks:

- `corepack pnpm --filter @netgrid/engine test` - gruen
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - gruen
- `corepack pnpm --filter @netgrid/catalog test` - gruen
- `corepack pnpm typecheck` - gruen

Queue-Hinweis: Die kanonische Done-Kopie liegt unter `docs/derived/originalset-spotcheck-jobs/done/`.

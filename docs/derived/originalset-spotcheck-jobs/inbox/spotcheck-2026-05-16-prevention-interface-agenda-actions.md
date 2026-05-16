---
jobId: spotcheck-2026-05-16-prevention-interface-agenda-actions
status: ready_for_implementation
createdAt: 2026-05-16T06:13:12+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_135_nasuko-cycle
    title: Nasuko Cycle
  - cardId: onr_v1_139_r-and-d-interface
    title: R&D Interface
  - cardId: onr_v1_161_fall-guy
    title: Fall Guy
  - cardId: onr_v1_164_hells-run
    title: Hell's Run
  - cardId: onr_v1_170_nomad-allies
    title: Nomad Allies
  - cardId: onr_v1_175_ronin-around
    title: Ronin Around
  - cardId: onr_v1_203_hostile-takeover
    title: Hostile Takeover
  - cardId: onr_v1_210_political-overthrow
    title: Political Overthrow
  - cardId: onr_v1_331_nevinyrral
    title: Nevinyrral
  - cardId: onr_v1_338_rustbelt-hq-branch
    title: Rustbelt HQ Branch
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-prevention-interface-agenda-actions

## Auswahlprüfung

Dieser Job enthält genau zehn zufällig aus der komplexeren Restmenge ausgewählte, bereits decklegale Originalset-Karten. Vor der Auswahl wurden `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` nach `onr_v1_*`-IDs durchsucht. Alle dort vorkommenden IDs wurden ausgeschlossen.

Die Auswahl bevorzugt Karten mit Engine-, Timing-, Choice-, Hidden-Info-, Replay- oder PublicPayload-Risiko. Quellen für den Decklegal-Status waren die jeweiligen Kartenmanifest- und Deck-Legal-AI-Approval-Artefakte: V1.9.11, V1.9.13, V1.9.14, V1.9.20, V1.9.22 sowie das Legacy-Open64-Approval für Hostile Takeover.

## Kartenbefunde

### onr_v1_135_nasuko-cycle - Nasuko Cycle

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Nasuko Cycle ist im Shared-Katalog als installierte Runner-Hardware mit einmal-pro-Zug Prevention für 1 Net- oder Meat-Damage modelliert. Das V1.9.13-Manifest führt die Karte als `human_playable` und `ai_supported` über `event_modification_prevention_avoid_resolver` und `damage_event_prevention_resolver`. Die bestehende Engine-Abdeckung installiert die V1.9.13-Präventionskarten gesammelt, prüft aber den konkreten Nasuko-Resolver nicht einzeln. Kritisch sind Source-Priorität, Turn-Limit und der Unterschied zwischen Net- und Meat-Damage, weil mehrere ähnliche Quellen gleichzeitig legal sein können.

Notwendige Umsetzung

Einen fokussierten Nasuko-Cycle-Prevention-Smoke ergänzen: Installation per LegalAction, Net-Damage- und Meat-Damage-Fenster, exakt eine Prevention pro Runner-Zug, Pass-Option, Wrong-Side/Stale-Rejection und Source-Entfernung zwischen Choice-Erzeugung und Resolve.

Akzeptanzkriterien

- Nasuko Cycle verhindert pro Runner-Zug maximal 1 passenden Schaden.
- Nach genutzter Prevention bietet derselbe Source im selben Zug keine zweite Prevention mehr an.
- PublicPayload nennt nur Source-ID, Definition, Damage-Typ, preventedAmount und verbleibende öffentliche Zustände, ohne Grip-/Stack-/PrivatePayload-Leak.
- Replay aus dem Choice-Resolve liefert identischen StateHash.

### onr_v1_139_r-and-d-interface - R&D Interface

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

R&D Interface ist decklegal, aber der aktuelle Shared-Katalog beschreibt sie als Net-Damage-Prevention-Hardware. Lokale Errata- und Mechaniknotizen führen R&D Interface dagegen als kumulativen R&D-Multiaccess-Modifikator; zusätzlich existieren lokale Scan-/Mapping-Hinweise, die diese Karte als besonders konfliktanfällig markieren. Der aktuelle V1.9.13-Status wirkt deshalb wahrscheinlich fachlich falsch, obwohl die Karte technisch spielbar ist.

Notwendige Umsetzung

Regelvertrag klären und korrigieren: R&D Interface aus dem generischen Damage-Prevention-Pfad herauslösen, als R&D-Multiaccess-Hardware modellieren und mehrere installierte Kopien kumulativ berücksichtigen. Access-Queue, Breach/PublicPayload, AI-Hint und Manifest müssen auf Multiaccess statt Prevention zeigen.

Akzeptanzkriterien

- Eine installierte R&D Interface erhöht die Zahl der bei erfolgreichem R&D-Access zugänglichen R&D-Karten, ohne in R&D installierte Karten mitzuzählen.
- Mehrere Kopien kumulieren deterministisch.
- Runner sieht nur legal zugängliche Access-Choices; Korp- und PublicPayload leaken keine nicht erreichten R&D-Karten.
- Kein Damage-Prevention-LegalAction-Pfad bleibt für R&D Interface übrig.
- Replay/StateHash bleibt für eine erfolgreiche R&D-Run-Sequenz mit Zusatzaccess stabil.

### onr_v1_161_fall-guy - Fall Guy

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Fall Guy ist als installierte Resource mit einmal-pro-Zug Prevention für 1 Net- oder Meat-Damage modelliert. Die vorhandene Abdeckung prüft den generischen V1.9.13-Install-Pfad, aber keine Fall-Guy-spezifische Source-Revalidation. Da Fall Guy eine Resource ist, muss außerdem der Tag-Resource-Trash-Pfad sauber mit offenen Prevention-Choices zusammenspielen.

Notwendige Umsetzung

Fokussierte Tests ergänzen: Fall Guy installiert, Corp startet Damage-Fenster, Runner wählt Prevention, danach erneuter Damage im selben Zug ohne zweite Fall-Guy-Option. Zusätzlich eine Drift-Probe, bei der Fall Guy nach Choice-Erzeugung getrasht oder durch Tag-Resource-Interaktion entfernt wird.

Akzeptanzkriterien

- Fall Guy kann als Resource nur aus dem installierten Rig heraus verhindern.
- Entfernte oder getrashte Source kann keine offene Prevention-Choice mehr resolven.
- PublicPayload bleibt source-bound und gibt keine Hidden-Zone-Inhalte preis.
- Replay/StateHash deckt Apply- und Pass-Pfad ab.

### onr_v1_164_hells-run - Hell's Run

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Hell's Run ist decklegal über V1.9.14, aber der Shared-Katalogtext ist nur generisch: "Installed resource for run-risk and tag-risk planning." Die lokale Errata-Spur nennt einen wiederkehrenden Bit für Link-Erhöhung und Refresh zum nächsten Runner-Zug. Damit fehlt wahrscheinlich der eigentliche Engine-Vertrag: Counter-/Recurring-Credit-Zustand, Payment-Filter auf Link-Erhöhung und Start-of-turn-Refresh.

Notwendige Umsetzung

Hell's Run als installierte Resource mit genau 1 restricted Bit/Recurring-Credit für Link-Erhöhung modellieren. Der Credit darf nur im Trace-Link-Bid-Fenster für Runner-Link-Erhöhung ausgegeben werden und refreshed am nächsten Runner-Zugstart. KI-Hint und Szenario müssen von generischer Resource auf Trace-Link-Support wechseln.

Akzeptanzkriterien

- Installation legt genau einen öffentlichen Counter oder äquivalenten restricted recurring credit an.
- Zahlung ist nur für Runner-Link-Erhöhung in Trace-Fenstern legal, nicht für Install, Run, Trash oder andere Kosten.
- Verbrauch und Refresh sind chronikfähig, side-sicher und replay-stabil.
- Wrong-Side/Stale-ApplyAction lehnt den Payment-Pfad ab.

### onr_v1_170_nomad-allies - Nomad Allies

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Nomad Allies teilt den generischen V1.9.13-Präventionsvertrag mit Fall Guy und Nasuko Cycle: installierte Runner-Resource, einmal pro Zug 1 Net- oder Meat-Damage verhindern. Die Karte ist decklegal und AI-supported, aber die aktuelle Abdeckung beweist vor allem die Kategorie, nicht die einzelne Source. Bei mehreren gleichartigen Prevention-Quellen braucht die Engine deterministische Choice-Reihenfolge und Source-ID-stabile Payloads.

Notwendige Umsetzung

Nomad-Allies-spezifischen Multi-Source-Test ergänzen: Nomad Allies plus Fall Guy/Nasuko im Rig, Damage-Fenster erzeugt eindeutige Source-Optionen, eine ausgewählte Source verbraucht nur ihr eigenes Turn-Limit, und die übrigen Quellen bleiben bei späterem passenden Schaden legal.

Akzeptanzkriterien

- Choice-Optionen sind eindeutig und source-stabil.
- Nur die gewählte Nomad-Allies-Instanz verbraucht ihr Turn-Limit.
- Mehrere Kopien oder ähnliche Quellen erzeugen deterministische, replay-stabile Reihenfolge.
- PublicPayload enthält keine privaten Hand-/Stack-/Deckdaten.

### onr_v1_175_ronin-around - Ronin Around

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Ronin Around ist als installierter Hidden-Zone-Helfer für Top-2-Stack-Reorder freigeschaltet. Die vorhandene V1.9.11-Abdeckung prüft, dass die Runner-Choice nicht in der Korp-PlayerView erscheint. Die lokale Errata-Spur verweist jedoch darauf, dass Ronin Around nur installierte Karten exposen kann und keinen Draw auslöst; der aktuelle Shared-Katalog beschreibt stattdessen Stack-Top-2-Reorder. Das ist eine relevante Vertragsdrift oder mindestens ein Dokumentations-/Resolver-Konflikt.

Notwendige Umsetzung

Regelvertrag für Ronin Around gegen die aktuelle lokale Arbeitsgrundlage klären. Falls Top-2-Reorder weiterhin der bestätigte lokale Vertrag ist, muss ein Bericht die Errata-Abweichung explizit begründen. Falls die Errata führt, den Resolver auf installierte-card Expose/Look-Funktion umstellen und Stack-Reorder entfernen.

Akzeptanzkriterien

- Der finale Resolver passt zum dokumentierten lokalen Kartenfakt und nicht nur zum alten V1.9.11-Kategorietext.
- Bei Hidden-Zone-Nutzung sieht nur der Runner private Optionen; die Korp-View bleibt ohne Choice.
- Kurzer Stack, gemischte Zonen und Source-Removal sind revalidiert.
- PublicPayload nutzt Hidden-Zone-Barrierefelder statt Kartentitel nicht öffentlicher Karten.
- Replay/StateHash deckt mindestens Apply- und Pass-/No-op-Fall ab.

### onr_v1_203_hostile-takeover - Hostile Takeover

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Hostile Takeover hat einen engen on-score Credit-Resolver mit Gain 5 und deterministischem Replay-Test. Die lokale Konfliktentscheidung vom 2026-05-13 bestätigt Gain 5. Der vorhandene Test prüft Score, Credit-Gain, Agenda-Punkte, PublicPayload ohne `corp_`-Instanzleak und StateHash. Offen bleibt eine ApplyAction-Härtung gegen Score-Drift und die explizite Absicherung, dass alte lokale Galerie-Hinweise mit Gain 6 nicht wieder in Shared/Katalog/AI zurückdriften.

Notwendige Umsetzung

Einen Hostile-Takeover-Guard ergänzen, der Shared-Definition, Konfliktentscheidung und Runtime-Resolver auf Gain 5 zusammenbindet. Zusätzlich Score-Revalidation für Wrong-Side/Stale/zu wenig Advancement und PublicPayload-Leakscan im Hostile-spezifischen Pfad.

Akzeptanzkriterien

- Score ist erst ab exakt ausreichenden Advancements legal.
- On-score gibt exakt 5 Credits, niemals 6.
- Wrong-Side/Stale-ApplyAction lehnt den Score ab.
- PublicPayload bleibt ohne Instanzpräfixe, HQ/R&D-Details oder private Payloads.
- Replay/StateHash bleibt auf dem on-score Pfad stabil.

### onr_v1_210_political-overthrow - Political Overthrow

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Political Overthrow ist V1.9.22-decklegal und hat bereits einen fokussierten Test: gescorte Agenda, `[A]: Gain 3`, Wrong-Side/Stale-Rejection, Kostenabzug, PublicPayload-Leakscan und Replay/StateHash. Der lokale Wertkonflikt wurde auf Gain 3 entschieden. Als 6-Punkte-Agenda mit wiederholbarer scored-agenda action ist sie trotzdem besonders regressionssensibel, weil Action-Kosten, ScoreArea-Quelle und AI-Priorisierung zusammenpassen müssen.

Notwendige Umsetzung

Die bestehende Abdeckung um Mehrkopien- und Removed/ScoreArea-Drift-Härtung ergänzen. AI-Hint soll die Fähigkeit nur bei gescorter eigener Agenda und sinnvoller Creditlage bewerten, nicht aus HQ/Remote/Archives.

Akzeptanzkriterien

- Nur eine in der Korp-ScoreArea liegende Political Overthrow erzeugt die Gain-3-Aktion.
- Mehrere gescorte Kopien erzeugen eindeutige Source-Aktionen.
- Entfernte oder manipulierte SourceCardId scheitert in `applyAction`.
- Chronik und PublicPayload enthalten gainedCredits 3, action cost 1 und sourceDefinitionId.
- Replay/StateHash bleibt bei Mehrkopien stabil.

### onr_v1_331_nevinyrral - Nevinyrral

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Nevinyrral ist V1.9.20-decklegal und nutzt den rezzed action-economy asset path. Der bestehende Test prüft Remote Facility, Nevinyrral und Pacifica gemeinsam: rezzed Asset, LegalAction `gain_actions`, source-bound PublicPayload, Runner-View ohne HQ/R&D-Leak und Replay/StateHash. Die Shared-Definition erwähnt außerdem eine harte Sonderbedingung: Wenn Nevinyrral rezzed das Spiel verlässt, verliert die Korp. Dieser Leave-play-Loss-Pfad ist in der sichtbaren Abdeckung nicht als Nevinyrral-spezifischer Resolver belegt.

Notwendige Umsetzung

Den Nevinyrral-Vertrag aufteilen: action-gain-Pfad behalten und einen eigenen leave-play-while-rezzed-Loss-Resolver ergänzen oder, falls bewusst nicht im Scope, im Manifest/Shared-Text entfernen bzw. als unsupported markieren. Tests für Runner-Trash-on-access, Korp-Trash/Server-Cleanup und unrezzed-leaves-play-NoLoss ergänzen.

Akzeptanzkriterien

- Rezzed Nevinyrral gibt über LegalAction genau den erwarteten Action-Gain und bleibt source-bound.
- Wenn die Karte rezzed das Spiel verlässt, wird der korrekte Spielausgang gesetzt und öffentlich chronikfähig.
- Unrezzed oder nicht installierte Nevinyrral löst keinen Loss aus.
- PublicPayload leakt keine HQ/R&D-Inhalte.
- Replay/StateHash deckt action-gain und leave-play-Loss ab.

### onr_v1_338_rustbelt-hq-branch - Rustbelt HQ Branch

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Rustbelt HQ Branch ist V1.9.20-decklegal und wird als rezzed Asset mit HQ-Handsize- und Economy-Modifier-Oberflächen geführt. Die lokale Errata-Spur sagt, dass die Handgröße bei Trash sofort reduziert wird, aber keine Discards bis zum Ende des Korp-Zugs erfolgen. Der aktuelle Sammeltest für V1.9.20-Assets umfasst Rustbelt im WIP-/Release-Manifest, aber die sichtbare action-economy-Abdeckung fokussiert Remote Facility, Nevinyrral und Pacifica; Rustbelt braucht einen eigenen Handlimit-Lifecycle-Test.

Notwendige Umsetzung

Rustbelt-HQ-Branch-Resolver gezielt härten: rezzed Handlimit-Erhöhung, sofortiger Rückbau beim Trash/Leave-play, keine Sofort-Discards, discard erst am passenden Korp-Ende. Dazu PublicPayload für Modifier-Start/-Ende und AI-Hint für Handlimit-Value.

Akzeptanzkriterien

- Rezzed Rustbelt erhöht die effektive Korp-Handgröße nur solange die Source aktiv ist.
- Beim Trash sinkt die Handgröße sofort, aber die Korp muss erst im nächsten relevanten Discard-Fenster abwerfen.
- Mehrere Handlimit-Modifier schichten deterministisch.
- Runner-View zeigt nur öffentliche Board-/Modifier-Information, keine HQ-Inhalte.
- Replay/StateHash bleibt über Rez, Trash und End-of-turn-Discard stabil.

## Gesamtplan

1. Zuerst die zwei Vertragsdrift-Karten klären und korrigieren: R&D Interface und Ronin Around.
2. Danach Hell's Run als echten Trace-Link-Recurring-Payment-Pfad statt generischer Resource-Oberfläche härten.
3. Anschließend die vier Prevention-Quellen Nasuko Cycle, Fall Guy, Nomad Allies und den R&D-Interface-Entfernungstest in fokussierte Source-/Choice-Smokes aufteilen.
4. Zum Schluss die Korp-Agenda-/Asset-Pfade Hostile Takeover, Political Overthrow, Nevinyrral und Rustbelt HQ Branch mit Source-Drift, PublicPayload und Replay/StateHash absichern.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test -- --runInBand`
- `pnpm --filter @netgrid/catalog test -- --runInBand`
- `pnpm --filter @netgrid/ai test -- --runInBand`
- Szenario-/Manifest-Check für V1.9.11, V1.9.13, V1.9.14, V1.9.20 und V1.9.22 nach den geänderten Kartenverträgen.
- Leakscan auf `publicPayload`, `PlayerView`, Reconnect- und AI-Input-Pfade für R&D/HQ/Stack/Grip-Inhalte.

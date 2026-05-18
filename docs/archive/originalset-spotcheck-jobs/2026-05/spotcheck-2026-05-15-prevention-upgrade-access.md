---
jobId: spotcheck-2026-05-15-prevention-upgrade-access
status: done
createdAt: 2026-05-15T14:12:14+01:00
startedAt: 2026-05-15T21:37:11.8402021+02:00
completedAt: 2026-05-15T21:47:45+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_093_if-you-want-it-done-right
    title: If You Want It Done Right...
  - cardId: onr_v1_121_armored-fridge
    title: Armored Fridge
  - cardId: onr_v1_229_code-corpse
    title: Code Corpse
  - cardId: onr_v1_269_shotgun-wire
    title: Shotgun Wire
  - cardId: onr_v1_299_power-grid-overload
    title: Power Grid Overload
  - cardId: onr_v1_342_solo-squad
    title: Solo Squad
  - cardId: onr_v1_351_bizarre-encryption-scheme
    title: Bizarre Encryption Scheme
  - cardId: onr_v1_359_jenny-jett
    title: Jenny Jett
  - cardId: onr_v1_363_olivia-salazar
    title: Olivia Salazar
  - cardId: onr_v1_373_twenty-four-hour-surveillance
    title: Twenty-Four-Hour Surveillance
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-prevention-upgrade-access

## Auswahlprüfung

Der Lauf hat die Queue-Ordner `inbox`, `in_progress`, `done` und `blocked` sowie `docs/reviews/originalset-spotchecks/register.md` und `data/reports/originalset-card-spotcheck-register.json` als Tabuquellen gelesen. Dabei wurden 170 tabuierte O:NR-v1-Card-IDs erkannt.

Als Auswahlbasis dienten decklegale und AI-supported Originalset-Karten aus den Deck-Legal-AI-Approval-Manifesten und zugehörigen Card-Implementation-Manifesten. Aus 360 Kandidaten blieben 192 nicht-tabuisierte Karten übrig; 71 davon erfüllten die Komplexitätsschwelle für Timing-, Choice-, Hidden-Info-, Replay-, Damage-, Tag-, Run-/Access- oder Server-/Agenda-Relevanz. Die folgenden zehn Karten wurden zufällig aus diesem high-complexity-Pool gezogen und anschließend fachlich gegen Engine-, Chronik-, Visibility- und Testanforderungen bewertet.

Die Auswahl enthält keine Card ID, die in den gelesenen Register- oder Queuequellen vorkam.

## Kartenbefunde

### onr_v1_093_if-you-want-it-done-right - If You Want It Done Right...

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Die Karte ist als V1.9.22-Runner-Event mit privatem Stack-Top-5-Choice, Wahl einer Karte in die Grip und Reorder der übrigen Topkarten releasepromotet. Der Kernpfad ist besonders hidden-info-sensibel: LegalActions dürfen nur dem Runner die Kartenidentitäten und Reihenfolgeauswahl zeigen, während PublicEvents und Gegner-PlayerViews nur Anzahl, Quelle und neutrale Zonenbewegung sehen dürfen. `applyAction` muss Side, stateVersion, actionId, Playkosten, Stacktiefe, gewählte Karte und Restreihenfolge erneut validieren. Chronik darf keine Namen der nicht öffentlich bekannten Stackkarten ausgeben. Replay/StateHash müssen durch stabile Choice-Order und deterministische Zone-Moves unverändert bleiben.

Notwendige Umsetzung

- Nachtest des bestehenden privaten Choice-Pfads mit kurzer Stacktiefe 0 bis 4, voller Stacktiefe 5+ und stale Choice nach zwischenzeitlicher Stackänderung.
- PublicPayload-Härtung: keine nicht gewählte oder gewählte Stackkarte im Corp-View, WebSocket, Reconnect, Undo-Preview oder PublicEvent.
- Chronik-Härtung mit neutralem Text wie "Runner wählt 1 Karte aus den obersten Karten des Stapels".

Akzeptanzkriterien

- Wrong-side, stale stateVersion, ungültige Karten-ID und ungültige Restreihenfolge werden in `applyAction` abgelehnt.
- Runner-View enthält nur während des Choice-Fensters die privaten Stackkarten; Corp-View enthält keine Titel.
- Replay nach identischem Seed produziert identischen StateHash und identische verdeckte/public Payload-Grenzen.

### onr_v1_121_armored-fridge - Armored Fridge

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Armored Fridge ist ein Runner-Hardware-Prevention-Fall mit Ablative Counters und Meat-Damage-Prevention. Der kritische Vertrag ist nicht die Installation allein, sondern die Schadensersatz-/Prevention-Interaktion: Counter müssen öffentlich/stabil auf der installierten Hardware liegen, Prevention darf nur im passenden Meat-Damage-Fenster angeboten werden, und beim letzten entfernten Counter muss das automatische Trashen der Quelle side-sicher erfolgen. `applyAction` muss Timingfenster, Counteranzahl, Schadensart und Source-Instanz prüfen. Chronik sollte Counterentfernung und verhindertem Schaden ohne private Schadensdetails protokollieren.

Notwendige Umsetzung

- Nachtest für Installation mit exakt sieben Countern, mehrfaches Prevent 1 Meat Damage, letzter Counter trasht Armored Fridge.
- Edge Cases: 0 Counter, Nicht-Meat-Damage, mehrere gleichzeitige Prevention-Quellen, Flatline-Vermeidung durch letzten Counter.
- PublicPayload prüfen: Counteranzahl und Trash sind öffentlich, Grip-/Damage-Auswahl bleibt privat.

Akzeptanzkriterien

- Prevention-LegalAction erscheint nur bei Meat Damage und installierter Quelle mit Counter.
- Stale oder falsche Source-Instanz wird abgelehnt, insbesondere nach Trash/Reinstall.
- StateHash bleibt stabil, wenn dieselbe Damage-Sequenz mit demselben Seed erneut gespielt wird.

### onr_v1_229_code-corpse - Code Corpse

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Code Corpse ist ein Corp-ICE/Sentry/AP/Black-Ice-Kernfall mit Core-Damage- und End-the-run-Druck. Die Engine muss die Subroutinen als encountergebundene, brechbare ICE-Subroutinen modellieren und Core Damage inklusive Flatline-Folge über den zentralen Damage-Pfad abwickeln. LegalActions entstehen für Rez, Encounter, Subroutine-Breaks und ungebrochene Subroutine-Auflösung; `applyAction` muss ICE-Position, rezzed/encountered Status, Side, Timing und Break-Ziel erneut validieren. Chronik darf installierte unrezzed ICE vor Rez nicht leaken, nach Rez aber Subroutine-Auslösung sauber benennen.

Notwendige Umsetzung

- Subroutine-Smoke mit ungebrochenem Core Damage plus End-the-run und separatem gebrochenem Pfad.
- Revalidierung gegen falsche ICE-Position, unrezzed ICE, bereits gebrochene Subroutine und stale encounter.
- Damage-Payload-Härtung: private Hand-/Damage-Details bleiben beim Runner.

Akzeptanzkriterien

- Corp kann nur korrekt installierte ICE rezzen; Runner kann nur legal ausgewählte Subroutinen im Encounter brechen.
- Core Damage nutzt den zentralen Damage/Flatline-Vertrag und erzeugt keine Hidden-Info-Leaks.
- Replay/StateHash deckt mindestens einen ungebrochenen und einen gebrochenen Encounter ab.

### onr_v1_269_shotgun-wire - Shotgun Wire

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Shotgun Wire ist eine ältere decklegale Wall-ICE mit Damage- und ETR-Subroutinen. Sie wirkt zunächst simpel, bleibt aber regressionsträchtig, weil Net-Damage-Zufallsdiscard, Encounter-Timing, Breakability und ETR-Stop zusammenfallen. Die Engine muss die Subroutine-Reihenfolge stabil halten, die Damage-Zufallsauswahl über RandomDrawRecords abbilden und das Run-Ende nur bei ungebrochener ETR-Subroutine auslösen. Chronik und PublicPayload dürfen Damage-Anzahl und Run-Ende zeigen, aber keine getrashten Grip-Karten für die Corp offenlegen.

Notwendige Umsetzung

- Nachtest für ungebrochene Damage+ETR-Auflösung, nur Damage gebrochen, nur ETR gebrochen und beide gebrochen.
- Short-grip/Flatline-Fall mit redigierter öffentlicher Chronik.
- RandomDrawRecords-Assertion für Net-Damage-Trash aus Grip.

Akzeptanzkriterien

- Subroutine-Index und Break-Zustand bleiben über Pump-/Break-Aktionen stabil.
- PublicEvents zeigen keine zufällig getrashte Grip-Kartenidentität.
- Replay mit gleichem Seed produziert identischen Trash und StateHash.

### onr_v1_299_power-grid-overload - Power Grid Overload

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Power Grid Overload ist eine Corp-Operation mit Tag-Bedingung und Hardware-Trash-Ziel. Der zentrale Risikopunkt ist die LegalAction-Projektion: Die Corp darf nur dann Hardware-Ziele sehen, wenn der Runner tatsächlich tagged ist, und darf nur öffentlich installierte Runner-Hardware als Ziel wählen. `applyAction` muss Tagstatus, Side, Kosten, Zieltyp, installierte Zone und stateVersion erneut prüfen. Chronik kann Zielkarte öffentlich benennen, weil installierte Hardware öffentlich ist; verdeckte Runner-Zonen dürfen nicht einbezogen werden.

Notwendige Umsetzung

- Nachtest für tagged Runner mit mehreren Hardware-Zielen und untagged Runner ohne LegalAction.
- Stale-Ziel nach Runner-Hardware-Trash/Reinstall abweisen.
- AI-Hint/Plan prüfen: Corp nutzt die Karte nur bei sichtbarem Tag und sinnvollem Hardware-Ziel.

Akzeptanzkriterien

- Keine LegalAction, wenn Runner untagged ist oder keine installierte Hardware hat.
- Falscher Kartentyp, falsche Zone oder falsche Side wird in `applyAction` abgelehnt.
- PublicPayload enthält nur bereits öffentliche Zielkarte und neutrale Operation-Auflösung.

### onr_v1_342_solo-squad - Solo Squad

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Solo Squad ist ein rezzed Corp-Asset mit aktiver Meat-Damage-Fähigkeit und Tag-Bedingung. Die Karte kreuzt Asset-Rez, Runner-Tagstatus, Paid-/Action-Fenster, Damage-Vertrag und Trash-on-access. LegalActions müssen nur der Corp angeboten werden, wenn die Quelle rezzed/installed ist, die Kosten bezahlt werden können, das Timing passt und der Runner tagged ist. `applyAction` muss Quelle, Status, Timing, Kosten und Tagstatus erneut validieren. Chronik darf Meat-Damage-Anzahl und Quelle nennen, aber keine zufällig beschädigten Handkarten.

Notwendige Umsetzung

- Nachtest mit tagged und untagged Runner, unrezzed/rezzed Quelle, bezahlter Aktivierung und Access-Trash.
- Damage-Prevention-Interaktion gegen Armored-Fridge-artige Quellen mit korrekter Fensterreihenfolge.
- Replay/StateHash für Damage-Resolver inklusive RandomDrawRecords.

Akzeptanzkriterien

- Solo-Squad-Fähigkeit erscheint nur bei rezzed Quelle und tagged Runner.
- Damage und mögliche Flatline laufen ausschließlich über den zentralen Damage-Pfad.
- Corp- und Public-Views leaken keine Runner-Handkarten.

### onr_v1_351_bizarre-encryption-scheme - Bizarre Encryption Scheme

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Bizarre Encryption Scheme ist eine servergebundene Access-Replacement-Karte: Runner scored auf dem betroffenen Run keine Agenda aus dem Fort, die Agenda geht zurück in den Fort und kann später am Runner-Start getriggert werden, sofern sie nicht vorher gescored wurde. Das ist timing- und zonenintensiv. Die Engine muss den Access nur für diesen Run markieren, die konkrete Agenda-Instanz sauber verfolgen und Start-of-turn-Auflösung abbrechen, wenn die Agenda nicht mehr in gültigem Zustand liegt. PublicPayload darf nur öffentlich bekannte Zugriffe offenlegen; bei zurückgelegten verdeckten Agenden muss die öffentliche Chronik redigiert bleiben.

Notwendige Umsetzung

- Nachtest für Agenda-Access im BES-Server, mehrere Agenden im selben Run, Folgezug-Score und Abbruch, wenn die Corp/Runner sie vorher scored.
- Revalidierung gegen falschen Server, nicht aktive/rezzed Quelle, Archives/HQ/R&D-Access und stale Agenda-Instanz.
- Chronik-Härtung für "Agenda zurück in den Fort" ohne verdeckte Kartennamen, soweit die Agenda nicht öffentlich wurde.

Akzeptanzkriterien

- Effekt gilt nur für den Run, in dem Bizarre Encryption Scheme accessed wurde.
- Start-of-turn-Auflösung nutzt stabile Pending-State-Daten und ist replay-/StateHash-stabil.
- Hidden-Info-Grenzen bleiben in PlayerView, PublicEvent, Reconnect und Undo-Preview intakt.

### onr_v1_359_jenny-jett - Jenny Jett

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Jenny Jett ist als generisches Upgrade/Root-Server-Resolverprofil decklegal, mit Fokus auf install/rez, servergebundene Wirkung und Runner-Trash-Value. Der Spotcheck sollte prüfen, ob die aktuelle Implementierung nur generische Upgrade-Oberfläche bietet oder ob ein kartenindividueller Effekt vollständig abgebildet ist. Kritisch sind Serverbindung, Rez-Status, Access-Trash-Kosten, Root-Position und das Verhindern von Effekten außerhalb des Servers. Chronik muss Rez/Trash öffentlich zeigen, darf aber verdeckte Serverinhalte durch Nachbarschaftseffekte nicht leaken.

Notwendige Umsetzung

- Nachtest für Installation in Remote Root, Rez, Access-Trash und Serverbindung.
- Falls Jenny Jett einen spezifischen Text-/Timingeffekt hat, Resolver gegen lokale bestätigte Textbasis prüfen und fehlenden Per-card-Pfad ergänzen.
- Reconnect/Undo-Preview prüfen: Upgrade-Existenz nach Rez öffentlich, unrezzed Root weiterhin verdeckt.

Akzeptanzkriterien

- LegalActions werden nur für gültige Root-/Remote-Serverpositionen und gültige Kosten angeboten.
- `applyAction` lehnt falsche Server, falsche Source-Instanz und stale Access-Ziele ab.
- Keine verdeckten Root- oder Serverkarten leaken vor Rez/Access.

### onr_v1_363_olivia-salazar - Olivia Salazar

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Olivia Salazar ist ein Corp-Upgrade mit Agenda-Steal-Kosten bzw. Agenda-Difficulty-Bezug im Server. Der empfindliche Punkt ist die Kopplung an Access/Steal-Fenster: Die Runner-Kostenentscheidung darf nur beim Stehlen einer Agenda im geschützten Server entstehen, muss öffentliche Runner-Agenda-Kosten korrekt abbilden und darf keine Agenden außerhalb des aktuellen Access-Fensters beeinflussen. `applyAction` muss Serverbindung, rezzed Quelle, Agenda-Instanz, Runner-Agenda-Punkte/Kosten und stateVersion prüfen. Chronik darf öffentliche Removed-from-game-/Forfeit-Kosten nennen, aber keine verdeckten Agenda-Infos außerhalb des Zugriffes.

Notwendige Umsetzung

- Nachtest für Agenda-Steal im Olivia-Server, Agenda-Steal in anderem Server und fehlende Runner-Agenda als Kostenblocker.
- Multiaccess-Fall: Kostenfenster pro Agenda klar trennen und stale Agenda nach Zonenwechsel ablehnen.
- PublicPayload/Replay-Härtung für Agenda-Kosten, Score-/Steal-Fenster und StateHash.

Akzeptanzkriterien

- Olivia erzeugt nur im eigenen Server und nur bei rezzed Quelle eine Kosten-/Steal-Modifikation.
- Runner kann Kosten nicht mit falscher Agenda, falscher Zone oder stale Choice bezahlen.
- Chronik und PlayerViews zeigen nur rechtmäßig öffentliche Agenda- und Kosteninformationen.

### onr_v1_373_twenty-four-hour-surveillance - Twenty-Four-Hour Surveillance

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Twenty-Four-Hour Surveillance ist ein Corp-Upgrade mit servergebundenem Run-Start-Tax und Runner-Zahlung über allgemeine Credits bzw. Run-/Stealth-Recurring-Credits. Die Engine muss Run-Start-Fenster, Serverbindung, rezzed Quelle, Zahlungsquellen und Credit-Zweckbindung trennen. LegalActions dürfen nur zahlbare Kosten anbieten; `applyAction` muss Credit-Quelle, Restkosten, Timing, Runner-Side und stateVersion erneut validieren. Chronik sollte die Zahlungssumme und genutzte öffentliche Quelle beschreiben, aber keine verdeckten Runner-Hand-/Stackinformationen berühren.

Notwendige Umsetzung

- Nachtest für Run auf geschützten und ungeschützten Server, genug/zu wenig Credits, Stealth-Recurring-Zahlung und normale Credit-Zahlung.
- Stale Payment Choice nach Creditänderung oder Run-Abbruch ablehnen.
- AI-Hint prüfen: Runner bewertet Tax korrekt, Corp berücksichtigt Server-Defense-Wert.

Akzeptanzkriterien

- Tax triggert nur bei Run-Start auf dem Server mit rezzed Twenty-Four-Hour Surveillance.
- Zweckgebundene Stealth-/Run-Credits werden nur legal für diese Kosten genutzt und korrekt refreshed/verbraucht.
- Replay/StateHash bleibt mit identischer Zahlungswahl stabil.

## Gesamtplan

1. Queue-Job als Umsetzungshandoff an `release-implementation-agent` übernehmen.
2. Für jede Karte zuerst vorhandene Tests lokalisieren und entscheiden, ob Härtung als Ergänzung bestehender Szenarios oder als neue fokussierte Regression besser passt.
3. Engine-Änderungen nur dort vornehmen, wo der Nachtest einen echten Vertragsbruch zeigt; reine Retain-Fälle mit zusätzlichem Regressionstest dokumentieren.
4. Nach jeder Kartenfamilie Hidden-Info-Grenzen prüfen: PlayerView, PublicEvent, Reconnect, Undo-Preview, AI-Input und Chronik.
5. Erst nach grünem Engine-/Catalog-/AI-relevanten Check Register und Jobstatus in einem separaten Umsetzungsjob aktualisieren.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- Fokus-Grep nach den zehn Card IDs in `packages/engine/src/index.test.ts`, damit bestehende Smokes nicht dupliziert, sondern gezielt gehärtet werden.
- Manuelle Redaction-Prüfung für Stack-/Grip-/Agenda-/Server-Hidden-Info in PublicEvents und PlayerViews.

## Umsetzungsergebnis

Status: `done`

Detailbericht: `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_PREVENTION_UPGRADE_ACCESS_IMPLEMENTATION.md`

Umgesetzt:

- `onr_v1_121_armored-fridge` installiert jetzt mit sieben öffentlichen Countern, verhindert pro Meat-Damage-Fenster genau 1 Meat Damage durch Counterverbrauch und trasht sich beim letzten Counter automatisch. PublicPayload enthält Countertyp, entfernte Menge, Restmenge und Auto-Trash-Status, aber keine Grip-Identitäten.
- `onr_v1_342_solo-squad` bietet die Meat-Damage-Fähigkeit nur noch bei getaggtem Runner an und revalidiert den Tagstatus in `applyAction`.
- Die übrigen Karten des Pakets wurden gegen vorhandene Regressionen geprüft und im Register als abgedeckt dokumentiert: privater Stack-Choice (`If You Want It Done Right...`), ICE-Damage/ETR (`Code Corpse`, `Shotgun Wire`), tagged Hardware-Trash (`Power Grid Overload`), Access-Replacement (`Bizarre Encryption Scheme`), Root-/Upgrade-Pfade (`Jenny Jett`, `Olivia Salazar`, `Twenty-Four-Hour Surveillance`).

Geänderte Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_PREVENTION_UPGRADE_ACCESS_IMPLEMENTATION.md`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`

Checks:

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Commit: wird mit diesem Jobstatus als `Implement Originalset spotcheck job spotcheck-2026-05-15-prevention-upgrade-access` erstellt.


---
jobId: spotcheck-2026-05-15-virus-link-archives
status: done
createdAt: 2026-05-15T10:18:00+01:00
startedAt: 2026-05-15T16:47:29.6092039+02:00
blockedAt: 2026-05-15T17:05:01.5901869+02:00
completedAt: 2026-05-16T16:16:30.095Z
completedReason: Follow-up spotcheck-2026-05-16-runner-breaker-prevention-resolvers completed Pile Driver and Full Body Conversion resolver contracts.
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_013_cockroach
    title: Cockroach
  - cardId: onr_v1_047_pile-driver
    title: Pile Driver
  - cardId: onr_v1_056_replicator
    title: Replicator
  - cardId: onr_v1_057_scatter-shot
    title: Scatter Shot
  - cardId: onr_v1_127_full-body-conversion
    title: Full Body Conversion
  - cardId: onr_v1_148_access-through-alpha
    title: Access through Alpha
  - cardId: onr_v1_198_detroit-police-contract
    title: Detroit Police Contract
  - cardId: onr_v1_296_off-site-backups
    title: Off-Site Backups
  - cardId: onr_v1_307_urban-renewal
    title: Urban Renewal
  - cardId: onr_v1_366_red-herrings
    title: Red Herrings
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-virus-link-archives

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`, alle Markdown-Dateien unter `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/archive/originalset-spotcheck-jobs/2026-05/` und `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 130 Card IDs wurden über Register und sichtbare Jobberichte tabu gesetzt. Darunter liegen die erledigten 2026-05-14-Runden, die 2026-05-15-Implementierungsjobs bis `immunity-cinderella`, der blockierte `ambush-hidden-trace`-Job sowie die aktuell sichtbaren Inbox-/In-progress-Jobs `breaker-modifier-random`, `hidden-access-trace`, `immunity-cinderella` und deren Dubletten.
- Auswahlbegründung: Aus 244 nicht tabu gesetzten Karten im aktuellen `ONR_V1_RUNTIME_RELEASE_CARD_IDS`-Pool wurden 160 komplexere Karten mit Engine-, Timing-, Choice-, Hidden-Info-, Replay- oder StateHash-Relevanz erkannt. Daraus wurden zufällig genau zehn Karten gezogen. Die Stichprobe deckt Virus-Counter und deterministische HQ-Zufallsdiscards, Trace-/Link-Fenster, eingeschränkte Recurring-Credits, Meat-Damage-Prevention, scored-agenda Counteraktionen, private Archives-Choices, tagged-only Damage und servergebundene Agenda-Steal-Kosten ab.
- Fachartefakte der Analyse: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, passende `data/manifests/card-implementation-manifest-*.json`, `data/manifests/deck-legal-ai-approval-*.json`, `data/ai/ai-card-hints-deck-legal-*.json`, `data/scenarios/v19*.json`, `data/rules/mechanics-coverage-*.json`, `data/rules/v1922-local-card-facts.json`, `data/rules/v1922-resolver-contracts.json` und die V1.9.x Review-/Matrix-Artefakte unter `docs/derived/`.

## Kartenbefunde

### onr_v1_013_cockroach - Cockroach

Bewertung:
- Engine: `cockroachRandomHqDiscardActive` schaltet ab zwei installierten Cockroach-Virus-Countern die Korp-Discard-Auswahl auf deterministischen Random-Discard aus HQ um. Erfolgreiche HQ-Runs legen Counter; Purge entfernt Cockroach-/Incubator-Counter über das bestehende Virus-Gate.
- Chronik: Discard-Payload nutzt `hiddenZoneBarrier`, `hiddenZoneAction: "discard_phase"` und `randomizedByCockroach`, nennt aber keine Quelle/Counterhöhe. Die Zufallsquelle ist in `RandomDrawRecords` sichtbar, nicht direkt in einer für Spieler gut lesbaren Chronikzusammenfassung.
- Tests: Es gibt Positivtests für Counteraufbau, randomisierten HQ-Discard, Purge und Replay/StateHash. Fehlend sind Wrong-Side-/Stale-Revalidation für die Discard-Choice, Counter-Drift unter die Schwelle zwischen Projektion und Auflösung, mehrere Cockroach-Instanzen sowie Leakscans gegen ausgewählte HQ-Karten.
- Hidden-Info/Replay/StateHash: Sehr hohe Hidden-Info-Relevanz, weil HQ-Discards verdeckte Korp-Handkarten betreffen. Die zufällig verworfene Karte darf nur zonengerecht sichtbar werden, nicht über Choice-Optionen, PublicPayload, KI-Input oder Replay-Voransicht.
- Fehlende Härtungen: Source-/Counterpayload, Schwellen-Revalidation, Multi-Instanz-Summe, negative Choice-Fälle.

Notwendige Umsetzung:
- [ ] Fokustest ergänzen: LegalAction/Choice vor Discard speichern, dann Cockroach-Counter auf unter 2 setzen; `applyAction` muss die alte manuelle/randomisierte Auflösung ablehnen oder deterministisch nach aktuellem Zustand korrekt neu bewerten.
- [ ] Wrong-side und stale `stateVersion` für die offene Korp-Discard-Choice prüfen.
- [ ] Test mit zwei installierten Cockroach-Kopien, deren Counter zusammen die Schwelle erreichen; Purge muss beide Quellen leeren.
- [ ] Chronik/PublicPayload um `randomizedByCockroachSourceCount` oder `cockroachCounterTotal` ohne HQ-Kartenleak erweitern oder mindestens per Test auf vorhandenen Source-Nachweis prüfen.

Akzeptanzkriterien:
- [ ] Ab mindestens zwei Cockroach-Countern werden Korp-HQ-Discards deterministisch zufällig aufgelöst.
- [ ] Unterhalb der Schwelle bleibt normale Korp-Discard-Auswahl legal.
- [ ] Keine HQ-Karten-IDs oder Titel leaken vor der zonengerechten Auflösung.
- [ ] Replay mit gleichem Seed endet mit identischem StateHash und identischen RandomDrawRecords.

### onr_v1_047_pile-driver - Pile Driver

Bewertung:
- Engine: Shared Runtime modelliert Pile Driver als Stealth/Fracter-Breaker mit Recurring-Credit-Oberfläche; Tests nutzen die Karte vor allem als installiertes Programm und als Ziel für Fragmentation-Storm-Programtrash. Der lokale Kartentext nennt eine Vier-Wall-Subroutine-Breakfähigkeit und 3 Stealth-Verlust bei Nutzung.
- Chronik: Programtrash durch Fragmentation Storm publiziert Definition, Kartentyp und Damage-Summary. Ein Pile-Driver-eigener Break-/Stealth-Verlust-Payload ist nicht nachgewiesen.
- Tests: Vorhanden sind Install-/Fragmentation-Storm-Interaktionen, inklusive Payload und Replay. Es fehlt ein Pile-Driver-Fokustest für Wall-Break, bis zu vier Subroutinen, Stealth-Verlustverteilung, Recurring-Credit-Filter, wrong-side/stale und Manipulation der Zielsubroutinen.
- Hidden-Info/Replay/StateHash: Keine verdeckten Karten im Breakpfad, aber Stealth-Quellen und Subroutine-Indizes müssen LegalAction-basiert und StateHash-stabil sein.
- Fehlende Härtungen: Effektvollständigkeit gegenüber lokalem Text, Stealth-Kostenwahl, Subroutine-Ziel-Revalidation, Payload.

Notwendige Umsetzung:
- [ ] Lokalen Vertrag prüfen: Pile Driver muss Wall-Subroutinen in einem Bündel von bis zu vier brechen und dabei 3 Stealth verlieren; falls Runtime bewusst reduziert ist, Katalog-/AI-Vertrag sichtbar herabstufen.
- [ ] LegalAction für Wall-Break mit mehreren Subroutine-Indizes ergänzen oder vorhandene Break-Aktionen fokussiert auf Pile Driver erweitern.
- [ ] `applyAction` muss ICE-Typ, Encounter, Breaker-Stärke, Subroutine-Indizes, verfügbare Stealth-Quellen und StateVersion erneut validieren.
- [ ] Tests für genau vier Ziele, weniger als vier Ziele, Nicht-Wall, fehlende Stealth-Quellen, wrong-side/stale und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] Pile Driver kann nur Wall-Subroutinen legal brechen.
- [ ] Stealth-Verlust ist exakt 3 und wird bei mehreren Quellen deterministisch oder runner-privat gewählt.
- [ ] Manipulierte Subroutine- oder ICE-Ziele scheitern ohne State-Mutation.
- [ ] PublicPayload benennt Break-Anzahl, Quelle und Stealth-Delta ohne private Daten.

### onr_v1_056_replicator - Replicator

Bewertung:
- Engine: Replicator ist als installierbares Programm in der Trace-/Link-Releasefamilie freigegeben. Shared Text ist generisch ("trace subroutine pressure and legal trace bids"), während der lokale Kartentext `0: Break ice subroutine that traces. 1: +1 strength.` beschreibt.
- Chronik: Trace-Fenster und Link-Choices sind public/side-sicher, aber ein kartenkonkreter Replicator-Break-Payload ist nicht sichtbar.
- Tests: AI-/Szenario-Smokes decken Trace-Link-Tools; Engine-Tests prüfen tracebasierte Bidding-Fenster. Ein Replicator-Einzeltest für "break trace subroutine", Pump, Nicht-Trace-Negativfall, wrong-side/stale und Replay fehlt.
- Hidden-Info/Replay/StateHash: Trace-Bids sind öffentlich, aber Break-LegalActions müssen nur gerezzte öffentliche ICE/Subroutinen sehen. Keine Hidden-Zone, aber Timing und Revalidation sind kritisch.
- Fehlende Härtungen: Eigentliche Breakfähigkeit, Trace-Subroutine-Filter, Pump-/Strength-Payload, AI-Hint-Schärfe.

Notwendige Umsetzung:
- [ ] Replicator-Vertrag gegen lokalen Text finalisieren und Runtime so prüfen, dass er nicht nur als generisches Trace-Link-Tool installiert wird.
- [ ] Break-LegalAction für tracehaltige Subroutinen ergänzen oder vorhandene Breaker-Definition konkretisieren.
- [ ] Tests für tracehaltige Subroutine, nicht tracehaltige Subroutine, falsches ICE, falschen Encounter, wrong-side/stale und Replay ergänzen.
- [ ] PublicPayload/Chronik um `brokenTraceSubroutine`, `breakerStrengthAfter` und source-bound Definition ergänzen oder per Test absichern.

Akzeptanzkriterien:
- [ ] Replicator bricht nur Subroutinen mit Trace-Inhalt.
- [ ] Pump und Break werden in LegalActions projiziert und in `applyAction` erneut validiert.
- [ ] Nicht-Trace-Subroutinen bleiben unbrechbar durch Replicator.
- [ ] Replay-StateHash und Chronik bleiben stabil.

### onr_v1_057_scatter-shot - Scatter Shot

Bewertung:
- Engine: V1.9.22 führt Scatter Shot ausdrücklich als install-only Programm-WIP; die eigentliche restricted recurring-credit Fähigkeit für Upgrade-Trashkosten bleibt gegatet.
- Chronik: Install-Payload ist public und replay-stabil. Es gibt keine Nutzungschronik für Upgrade-Trash-Credits oder Refresh.
- Tests: Gemeinsamer Install-only-Test deckt Install, wrong-side/stale, Memory, PublicPayload und Replay. Fehlend sind Payment-Filter, Upgrade-only-Trashfenster, Credit-Verbrauch, Start-of-turn-Refresh, Nicht-Upgrade-Negativfall und Access-Trash-Integration.
- Hidden-Info/Replay/StateHash: Upgrade-Trash geschieht im Access-Fenster; vor Rez/Access darf Scatter Shot keine verdeckte Root-Identität leaken. Restricted Credits müssen nur bei offenem Upgrade-Trashkostenfenster erscheinen.
- Fehlende Härtungen: Vollresolver für recurring restricted Credits, Upgrade-Target-Filter, Refresh-Timing, KI-Hint-Abgleich.

Notwendige Umsetzung:
- [ ] Scatter Shot von install-only auf vollständigen restricted-credit-Vertrag heben oder Katalog-/AI-Hint dauerhaft als install-only markieren.
- [ ] Payment-Modell ergänzen: 2 recurring Credits nur für Trashkosten von Upgrades, nicht Assets, Agendas, Operationen, Installkosten oder Breaker-Nutzung.
- [ ] Start-of-run/turn? Vertrag aus `v1922-local-card-facts.json` übernehmen: genutzte Credits werden zu Beginn des nächsten Runner-Zugs aus der Bank ersetzt.
- [ ] Tests für Upgrade-Trash, Asset-Negativfall, unrezzed/hidden Root ohne Identity-Leak, Refresh und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] Scatter Shot zeigt restricted Credits erst in legalen Upgrade-Trash-Zahlungsfenstern.
- [ ] Verbrauch und Refresh sind öffentlich nachvollziehbar und source-bound.
- [ ] Keine verdeckten Root-Karten leaken über Kostenprojektion.
- [ ] Replay-StateHash bleibt nach Access, Trash und Refresh stabil.

### onr_v1_127_full-body-conversion - Full Body Conversion

Bewertung:
- Engine: `RUNTIME_DAMAGE_PREVENTION_PROFILES` enthält Full Body Conversion mit `maxPerTurn: 1` für Meat Damage. Shared Runtime-Text sagt ebenfalls "once each turn, prevent 1 meat damage", während der lokale Importtext "prevents all meat damage" plus Corp-Pay-Bypass beschreibt.
- Chronik: Bestehende Prevention-Events sind side-sicher, aber Full Body Conversion hat keinen fokussierten Payload-/Cancel-Beleg.
- Tests: V1.9.13 installiert die Prevention-Karten gesammelt und testet Green-Knight-Net-Damage-Prevention. Ein Full-Body-spezifischer Meat-Damage-Test mit Corp-Zahlungsfenster, Multi-Damage, wrong-side/stale, Damage-Redaction und Replay fehlt.
- Hidden-Info/Replay/StateHash: Meat Damage kann Gripkarten trashen und Flatline auslösen. Prevention darf nur Damage-Summary und Quelle publizieren, nie getroffene Gripkarten.
- Fehlende Härtungen: Potenzielle Effekt-Drift zwischen lokalem Text und Runtime, Corp-Pay-Bypass, Turnlimit vs. "all meat damage".

Notwendige Umsetzung:
- [ ] Führenden Vertrag entscheiden: aktueller Runtime-Stub `prevent 1 meat once per turn` oder lokaler Text `prevent all meat damage, Corp kann pro Credit Schaden durchlassen`.
- [ ] Falls lokaler Text gilt, Prevention-Profil und Event-Modification-Fenster auf variablen Corp-Pay-Bypass erweitern.
- [ ] Tests für 1/5 Meat Damage, Corp mit/ohne Credits, multiple Meat-Damage-Events im selben Zug, wrong-side/stale und Replay ergänzen.
- [ ] PublicPayload-Leakscan gegen Grip-/Heap-Private-Daten und Flatline-Branch ergänzen.

Akzeptanzkriterien:
- [ ] Engine, Shared-Text, Katalog und AI-Hint beschreiben denselben Meat-Damage-Vertrag.
- [ ] Damage-Prevention und möglicher Corp-Bypass sind LegalAction-/Choice-basiert und revalidiert.
- [ ] Keine privaten Gripkarten erscheinen in PublicEvents, PlayerViews, KI-Inputs oder Replay-Payloads.
- [ ] Replay-StateHash bleibt für Prevention- und No-Prevention-Branches stabil.

### onr_v1_148_access-through-alpha - Access through Alpha

Bewertung:
- Engine: Access through Alpha ist als Resource mit `baseLink: 1` installiert und wird in side-sicheren Tracefenstern berücksichtigt. Der lokale Text beschreibt `1: Base link 9` und "use only one base link card for each trace attempt".
- Chronik: Trace-Payload zeigt `runnerLink`; die konkrete Base-Link-Quelle und die Entscheidung zwischen mehreren Base-Link-Karten wird nicht fokussiert.
- Tests: Vorhanden ist ein kombinierter Test mit Baedeker's Net Map plus Access through Alpha in Fragmentation-Storm-Trace. Es fehlt ein Einzeltest für `base link 9`, Kosten 1, Auswahl genau einer Base-Link-Quelle, wrong-side/stale und Multi-Link-Konflikte.
- Hidden-Info/Replay/StateHash: Linkquellen sind öffentliche installierte Runner-Karten. Risiko liegt in Trace-Bid-Projektion, Kostenrevalidation und KI-Bewertung.
- Fehlende Härtungen: Wert-/Kosten-Drift, One-base-link-Regel, Source-Attribution im Tracefenster.

Notwendige Umsetzung:
- [ ] Lokalen Vertrag prüfen: `baseLink: 1` in Runtime widerspricht dem lokalen Kartentext `Base link 9` mit Kosten 1.
- [ ] Trace-Bid-Fenster um Source-Choice oder deterministische beste Base-Link-Auswahl erweitern, wenn mehrere Base-Link-Karten installiert sind.
- [ ] `applyAction` muss gewählte Base-Link-Quelle, Kosten, installierten Zustand, Side und StateVersion erneut validieren.
- [ ] Tests für Access through Alpha allein, mit Baedeker's Net Map, ohne Credits, falsche Quelle, wrong-side/stale und Replay ergänzen.

Akzeptanzkriterien:
- [ ] Tracefenster nutzt exakt den finalen Access-through-Alpha-Linkwert und die finalen Kosten.
- [ ] Pro Traceversuch wirkt nur eine Base-Link-Karte.
- [ ] Korp sieht keine Runner-private Choice, falls die Auswahl runnerseitig ist; öffentliche Endwerte bleiben nachvollziehbar.
- [ ] AI-Hint und Runtime-Linkwert sind synchron.

### onr_v1_198_detroit-police-contract - Detroit Police Contract

Bewertung:
- Engine: Beim Scoren werden 4 Power-Counter gesetzt; die scored-agenda Aktion entfernt genau 1 Counter und gewinnt genau 1 Credit. `applyAction` revalidiert Side, ScoreArea, Definition, Countermenge und Gainbetrag.
- Chronik: Payload enthält `spentPowerCounters`, `gainedCredits` und `remainingPowerCounters`, aber der Score-Payload muss ebenfalls klar `powerCountersAdded: 4` nachweisen.
- Tests: Positivpfad für Score und eine Counteraktion vorhanden. Fehlend sind wrong-side/stale für die Agendaaktion, Manipulation von Counter-/Gainpayload, 0-Counter-No-LegalAction, mehrere gescorte Kopien und Replay/StateHash für Score plus Counterausgabe.
- Hidden-Info/Replay/StateHash: Keine verdeckten Karten nach Score, aber source-bound Counterzustand und StateVersion sind kritisch.
- Fehlende Härtungen: Negative Revalidation, Kopien-Isolation, Replay-Fokus, Payload-Qualität.

Notwendige Umsetzung:
- [ ] LegalAction für Detroit Police Contract speichern und wrong-side sowie stale `stateVersion` gegen genau diese Aktion testen.
- [ ] Manipulierte Payloads mit `removePowerCounterAmount != 1`, `gainCreditsAmount != 1` und falscher `cardId` müssen scheitern.
- [ ] Zwei gescorte Kopien testen: Nur die gewählte Kopie verliert einen Counter.
- [ ] Replay/StateHash für Score plus wiederholte Counteraktion und No-LegalAction bei 0 Countern ergänzen.

Akzeptanzkriterien:
- [ ] Score legt exakt 4 Power-Counter auf die gescorte Kopie.
- [ ] Jede Aktion entfernt exakt 1 Counter und gibt exakt 1 Credit.
- [ ] Keine Aktion ist legal oder ausführbar, wenn keine Counter mehr vorhanden sind.
- [ ] Chronik nennt Source, Delta und Restcounter replay-stabil.

### onr_v1_296_off-site-backups - Off-Site Backups

Bewertung:
- Engine: Off-Site Backups öffnet eine Korp-private Archives-to-HQ-Choice, schließt die gerade gespielte Operation als Ziel aus, bewegt genau eine Archives-Karte nach HQ und setzt sie facedown. Wrong-side/stale und Replay sind bereits getestet.
- Chronik: PublicPayload nutzt Hidden-Zone-Barriere und Count-Felder; konkrete Archive-Optionen bleiben privat. Das ist im Grundpfad solide.
- Tests: Vorhanden sind faceup/facedown Archives, Choice-Sichtbarkeit, wrong-side/stale, Payload-Leakscan und Replay. Fehlend sind leeres Archives/only-source-Card, manipulierte Choice auf nicht angebotene Karte, mehrere Off-Site-Kopien, Archives-Faceup-Erhaltung für nicht gewählte Karten und AI-Input-Leakscan.
- Hidden-Info/Replay/StateHash: Sehr hohe Hidden-Zone-Relevanz. Faceup-Archive-Karten sind öffentlich, facedown bleiben privat; HQ-Rückführung darf keine Titel der gewählten facedown Karte publizieren.
- Fehlende Härtungen: No-target-Revalidation, manipulated option, Sourcebindung bei Kopien, KI-Leakscan.

Notwendige Umsetzung:
- [ ] Test ergänzen: Archives enthält nur die gerade gespielte Off-Site Backups oder ist leer; keine LegalAction bzw. `applyAction`-Fehler ohne State-Mutation.
- [ ] Manipulierte Choice mit Karte aus HQ/R&D oder nicht angebotener Archives-Karte ablehnen.
- [ ] Zwei Off-Site-Backups-Kopien testen: Choice muss zur gespielten Source gehören, die gespielte Kopie darf nicht selbst gewählt werden.
- [ ] PlayerViews und AI-Input auf facedown-Archives-Redaction nach der Bewegung prüfen.

Akzeptanzkriterien:
- [ ] Genau eine legale Archives-Karte bewegt nach HQ.
- [ ] Die gewählte Karte wird in HQ verdeckt und ohne Public-Titelpayload abgelegt, wenn sie facedown war.
- [ ] Manipulierte oder stale Choices scheitern ohne State-Mutation.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_307_urban-renewal - Urban Renewal

Bewertung:
- Engine: Operation ist tagged-only (`runner.tags > 0`), kostet 6 und verursacht 5 Meat Damage über `resolveDamageOperation`. Bestehende Tests prüfen generische tagged Damage-Operationen und ältere Batch-Smokes.
- Chronik: DamageOperation-Payload sollte Damage-Art, Amount, RunnerTags, Damage-Summary und Quelle zeigen. Ein Urban-Renewal-eigener Redaction-/Replay-Test ist nicht sichtbar.
- Tests: Es gibt Tabellen-/Smoke-Abdeckung für Urban Renewal und tagged-only Operationen. Fehlend sind No-tag `applyAction`-Revalidation nach Tag-Drift, wrong-side/stale, Kostenmanipulation, Prevention-Interaktion, Flatline-Branch und PublicPayload-Leakscan gegen Gripkarten.
- Hidden-Info/Replay/StateHash: Meat Damage trasht zufällige Gripkarten und kann flatlinen. PublicEvents, Replay und KI-Input dürfen keine getroffenen Karten offenlegen.
- Fehlende Härtungen: Fokus auf Urban-Renewal-Quelle, Damage-Redaction, Tag-Drift, Replay/StateHash.

Notwendige Umsetzung:
- [ ] LegalAction bei getaggtem Runner erfassen, Runner-Tags vor `applyAction` auf 0 setzen und erwarteten Fehler testen.
- [ ] Wrong-side/stale und manipulierte Kosten-/Payload-Fälle ergänzen.
- [ ] Meat-Damage-Test mit kontrollierter Grip: PublicPayload, PlayerViews, Replay und AI-Input dürfen keine konkreten getrashten Karten zeigen.
- [ ] Prevention-/Flatline-Branch mit Full-Body-/Armored-Fridge-ähnlichen Karten und festem Seed prüfen.

Akzeptanzkriterien:
- [ ] Urban Renewal ist nur bei aktuell getaggtem Runner legal und ausführbar.
- [ ] Es entstehen exakt 5 Meat Damage, abzüglich legaler Prevention.
- [ ] Damage- und Flatline-Payloads bleiben hidden-info-sicher.
- [ ] Replay-StateHash ist stabil.

### onr_v1_366_red-herrings - Red Herrings

Bewertung:
- Engine: `redHerringsCardIdForCurrentAccess` findet rezzed Red Herrings im aktuell angegriffenen bzw. gebreachtem Server und erhöht Agenda-Steal-Kosten um 5. Bei zu wenig Runner-Credits wird nur "nicht stehlen" angeboten.
- Chronik: Steal-Payload enthält `v1918UpgradeAbility`, `redHerringsCardId` und `stealAdditionalCost`. Das ist source-bound, aber Blocked-by-cost und Trash-during-run-Sonderfall brauchen stärkere Abdeckung.
- Tests: Positivtest für servergebundene Tax, Kostenabzug, Payload und Replay vorhanden. Fehlend sind anderer Server, unrezzed Red Herrings, Runner mit 4 Credits, Red Herrings während desselben Runs getrasht aber Tax bleibt laut Text bestehen, Multiaccess/Breach, wrong-side/stale und Kostenmanipulation.
- Hidden-Info/Replay/StateHash: Red Herrings ist vor Rez verdeckt. Steal-LegalActions dürfen vor Rez keine Identität verraten und nach Rez nur im betroffenen Server wirken.
- Fehlende Härtungen: Text-Sonderfall "even on the run during which Runner trashes Red Herrings", Access-Queue/Multiaccess, no-leak vor Rez.

Notwendige Umsetzung:
- [ ] Tests für unrezzed Red Herrings, falschen Server und Runner mit weniger als 5 Credits ergänzen.
- [ ] Sonderfall testen/implementieren: Wenn Runner Red Herrings während dieses Runs trasht, muss die Steal-Tax für spätere Agenda-Accesses dieses Runs erhalten bleiben, falls der lokale Text führend ist.
- [ ] Multiaccess/Breach-Test: Tax gilt für Agenden aus demselben Fort, nicht für zentrale Server oder andere Remotes.
- [ ] Wrong-side/stale für `steal_agenda` sowie manipulierte `stealAdditionalCost` und `redHerringsCardId` prüfen.

Akzeptanzkriterien:
- [ ] Nur rezzed bzw. runweit markiertes Red Herrings im betroffenen Fort erhöht Steal-Kosten um exakt 5.
- [ ] Unrezzed oder anderer Server erzeugt keine Kostenprojektion und keinen Identitätsleak.
- [ ] Zu wenig Credits bietet keine illegale Steal-Aktion.
- [ ] Replay-StateHash bleibt für normalen Steal, Tax-Block und Trash-during-run stabil.

## Gesamtplan

1. Zuerst Effekt-Drift klären: Full Body Conversion, Access through Alpha, Replicator, Pile Driver und Scatter Shot gegen lokale Kartentexte/Facts synchronisieren; bei bewussten Stub-Verträgen Katalog/AI-Hints sichtbar begrenzen.
2. Danach Hidden-Info-Pfade härten: Cockroach-HQ-Discard, Off-Site Backups-Archives-Choice, Urban-Renewal-Meat-Damage und Red-Herrings-Accessfenster mit PlayerView-, PublicPayload-, Replay- und AI-Input-Leakscans.
3. Revalidation ergänzen: wrong-side, stale StateVersion, manipulierte `cardId`/Kosten/Ziele/Choices und State-Drift zwischen LegalAction-Projektion und `applyAction`.
4. Sourcebindung und Kopienfälle prüfen: Cockroach-Counter-Summe, Detroit-Police-Kopien, Off-Site-Backups-Quelle, Red-Herrings-Serverbindung und Base-Link-Auswahl bei mehreren Quellen.
5. Abschließend Manifest-, Szenario-, AI-Hint- und Katalogstatus nur dort nachziehen, wo der geprüfte Effektvertrag tatsächlich geändert oder präzisiert wurde; keine neue Karte promoten.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsergebnis

Finaler Status: `done`

Abschluss 2026-05-16:
- Der Folgejob `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` hat die beiden Removal-Conditions `Pile Driver` und `Full Body Conversion` umgesetzt und grün geprüft.
- Der ursprüngliche Sammeljob ist damit fachlich abgeschlossen.

Umgesetzte sichere Teilfixes:

- `Cockroach`: fokussierte Multi-Copy-/Counter-Schwellen- und Choice-Revalidation mit öffentlichem `cockroachCounterTotal` ohne HQ-Leak.
- `Replicator`: Shared-Vertrag auf echten Trace-Subroutine-Breaker mit Pump korrigiert; Engine-Test schützt Trace-only-Break, Nicht-Trace-Negativfall und stale Action.
- `Scatter Shot`: V1.9.22 von install-only auf restricted Upgrade-Trash-Recurring-Credits gehoben, inklusive Asset-Negativfall, Runner-Zugstart-Refresh und public-payload-sicherem Verbrauch.
- `Access through Alpha`: Base-Link-Wert auf 9 korrigiert und Trace-Link-Berechnung auf genau eine Base-Link-Quelle begrenzt.
- `Detroit Police Contract`, `Off-Site Backups` und `Urban Renewal`: Revalidation-/No-target-/Tag-Drift-Fälle ergänzt.
- `Red Herrings`: runweiter Tax-Marker ergänzt, damit die Agenda-Steal-Tax auch nach Trash von Red Herrings im selben Run erhalten bleibt.

Nachträglich erledigte Removal-Conditions:

- `Pile Driver`: Folgejob umgesetzt mit Multi-Wall-Break bis zu vier Subroutinen und exakt 3 Stealth-Verlust.
- `Full Body Conversion`: Folgejob umgesetzt mit vollständiger Meat-Damage-Prevention und Korp-Bypass-Zahlung.

Geänderte Dateien:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/catalog/src/index.test.ts`
- `data/ai/ai-card-hints-deck-legal-v1914.json`
- `data/ai/ai-card-hints-deck-legal-v1916.json`
- `data/ai/ai-card-hints-deck-legal-v1922.json`
- `data/manifests/card-implementation-manifest-1.9.14.json`
- `data/manifests/card-implementation-manifest-1.9.16.json`
- `data/manifests/card-implementation-manifest-1.9.22.json`
- `data/scenarios/v1922-per-card-longtail-release-smoke.json`
- `data/scenarios/v1922-per-card-longtail-wip-smoke.json`
- `data/rules/mechanics-coverage-1.9.22.json`
- `data/rules/v1922-local-card-facts.json`
- `data/rules/v1922-resolver-contracts.json`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_VIRUS_LINK_ARCHIVES_IMPLEMENTATION.md`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`
- `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-virus-link-archives.md`

Checks:

- `corepack pnpm --filter @netgrid/engine test` - grün, 378 Tests
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 127 Tests
- `corepack pnpm --filter @netgrid/catalog test` - grün, 44 Tests
- `corepack pnpm typecheck` - grün

Removal Condition:

- Erfüllt durch `spotcheck-2026-05-16-runner-breaker-prevention-resolvers`.

---
jobId: spotcheck-2026-05-15-hidden-access-trace
status: ready_for_implementation
createdAt: 2026-05-15T09:17:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_088_fortress-respecification
    title: Fortress Respecification
  - cardId: onr_v1_092_ice-and-datas-guide-to-the-net
    title: Ice and Data's Guide to the Net
  - cardId: onr_v1_106_private-ldl-access
    title: Private LDL Access
  - cardId: onr_v1_129_hq-interface
    title: HQ Interface
  - cardId: onr_v1_173_restrictive-net-zoning
    title: Restrictive Net Zoning
  - cardId: onr_v1_211_polymer-breakthrough
    title: Polymer Breakthrough
  - cardId: onr_v1_213_private-cybernet-police
    title: Private Cybernet Police
  - cardId: onr_v1_235_data-naga
    title: Data Naga
  - cardId: onr_v1_275_vacuum-link
    title: Vacuum Link
  - cardId: onr_v1_334_pacifica-regional-ai
    title: Pacifica Regional AI
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-hidden-access-trace

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 120 eindeutige Card IDs aus Registerdateien und vorhandenen Jobberichten wurden tabu gesetzt. Dazu zählen die erledigten Runden 2026-05-14-A/B, die 2026-05-15-Runden bis `netwatch-spinn`, der blockierte `ambush-hidden-trace`-Job, die aktive `contacts-datapool`-Datei in `in_progress/` sowie die aktuellen Inbox-Reservierungen `breaker-modifier-random` und `immunity-cinderella`.
- Auswahlbegründung: Aus 254 nicht tabu gesetzten decklegalen Originalset-Runtime-Karten blieb ein komplexer Pool von 119 Karten mit Engine-/Chronik-/Timing-/Choice-/Hidden-Info-/Replay-Relevanz. Diese zehn Karten wurden als neue Stichprobe mit Fokus auf Hidden-Zone-Reveal/Expose, Access-Umleitung, HQ-Multiaccess, servergebundene Installkosten, Start-of-turn-Effekte, Trace-Aktionsfenster, Program-Trash-Subroutinen, deterministischen Zufall und Action-Economy ausgewählt.
- Geprüfte Fachartefakte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, `data/manifests/card-implementation-manifest-1.7.1.json`, `data/manifests/card-implementation-manifest-1.8.1.json`, `data/manifests/card-implementation-manifest-1.9.0.json`, `data/manifests/card-implementation-manifest-1.9.2.json`, `data/manifests/card-implementation-manifest-1.9.3.json`, `data/manifests/card-implementation-manifest-1.9.11.json`, `data/manifests/card-implementation-manifest-1.9.20.json`, passende `deck-legal-ai-approval-*.json`, `ai-card-hints-deck-legal-*.json`, Release-Smokes und V1.9.x Review-/Matrix-Artefakte.

## Kartenbefunde

### onr_v1_088_fortress-respecification - Fortress Respecification

Bewertung:
- Engine: Der Event nutzt `onr_v1911_runner_event_expose_unrezzed_server_card`, verlangt einen Server und exposed die erste unrezzed installierte Korp-Karte aus Root oder ICE. `canPlayForServer` prüft nur, ob ein Expose-Ziel existiert; `applyAction` läuft erneut über `exposeCorpCardInServer`.
- Chronik: PublicPayload enthält `publicRevealKind: "expose"` und `publicRevealDefinitionId`, aber `exposeCorpCardInServer` selbst schreibt keinen `hiddenZoneBarrier`; dieser wird erst danach durch den Eventresolver ergänzt. Serverlabel und Quellenkontext sind im Test sichtbar, aber nicht als enger Regressionsvertrag für Root-vs-ICE fixiert.
- Tests: Ein positiver V1.9.11-Test exposed eine unrezzed Remote-Root-Karte ohne offene Choice. Es fehlen wrong-side/stale, manipulierter Server, leere Server, mehrere unrezzed Ziele, ICE-vs-Root-Reihenfolge und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Expose darf genau eine unrezzed installierte Karte offenlegen. Andere Root- oder ICE-Karten im Server, HQ, R&D und Archives dürfen nicht als Optionen oder Payload-Felder erscheinen.
- Fehlende Härtungen: Expose-Zielreihenfolge, Server-Revalidation, PublicPayload-Leakscan und Replay.

Notwendige Umsetzung:
- [ ] Fokustest ergänzen: eine LegalAction für `remote_1` speichern und wrong-side sowie stale `stateVersion` gegen genau diese Aktion prüfen.
- [ ] Manipulierte PlayerAction mit anderem `serverId`, `new_remote` oder einem inzwischen leeren Server muss in `applyAction` scheitern.
- [ ] Test mit Root und ICE im selben Server festlegen: welche unrezzed Karte wird exposed, und die Reihenfolge bleibt deterministisch.
- [ ] PublicPayload gegen `cardInstances`, `hq`, `rd`, `privatePayload` und nicht exposed Definitionen scannen.
- [ ] Replay/StateHash für Expose aus Remote-Root und Expose aus ICE ergänzen.

Akzeptanzkriterien:
- [ ] Fortress Respecification exposed genau eine installierte unrezzed Korp-Karte im gewählten Server.
- [ ] Falsche Seite, stale State und manipulierte Serverziele mutieren keinen State.
- [ ] PublicEvents, PlayerViews, Replay und AI-Input enthalten keine weiteren verdeckten Korp-Karten.
- [ ] Replay endet mit identischem StateHash.

### onr_v1_092_ice-and-datas-guide-to-the-net - Ice and Data's Guide to the Net

Bewertung:
- Engine: Der Event nutzt `onr_v1911_runner_event_reveal_stack_top`, ist nur spielbar, wenn der Stack nicht leer ist, und setzt `publicRevealDefinitionId` für die oberste Stack-Karte.
- Chronik: Der Resolver setzt `hiddenZoneAction: "v1911_reveal_stack_top"` und `publicRevealKind: "reveal"`. Die öffentliche Chronik ist knapp, aber ein expliziter Leakscan für darunterliegende Stackkarten fehlt.
- Tests: V1.9.11-Smokes und AI-Smokes listen die Karte; ein kartenkonkreter Positiv-/Negativtest für leeren Stack, manipulierte Aktion und Replay ist nicht erkennbar.
- Hidden-Info/Replay/StateHash: Der Reveal ist absichtlich öffentlich, aber nur für die Stackspitze. Die Reihenfolge und Identität der übrigen Stackkarten bleiben privat; keine Corp-Choice darf entstehen.
- Fehlende Härtungen: Leerer Stack, Stale/Wrong-Side, darunterliegende Karten, AI-Input-Sichtbarkeit.

Notwendige Umsetzung:
- [ ] Test ergänzen: mit Stackspitze A und darunterliegender Karte B wird nur A als `publicRevealDefinitionId` publiziert.
- [ ] Leerer Stack: keine LegalAction; manipulierte `play_event`-Aktion scheitert in `applyAction`.
- [ ] Wrong-side/stale gegen gespeicherte LegalAction ergänzen.
- [ ] PlayerView- und AI-Input-Leakscan sicherstellen, dass B nicht sichtbar wird.
- [ ] Replay/StateHash für Reveal ohne Zonenänderung ergänzen.

Akzeptanzkriterien:
- [ ] Genau die oberste Stackkarte wird öffentlich revealed.
- [ ] Keine darunterliegende Stackkarte erscheint in PublicPayload, Corp-View oder AI-Input.
- [ ] Leerer Stack und stale/wrong-side werden abgewiesen.
- [ ] Reveal ohne Zonenänderung replayt statehash-stabil.

### onr_v1_106_private-ldl-access - Private LDL Access

Bewertung:
- Engine: Der Event startet ausschließlich einen HQ-Run, ersetzt bei Erfolg aber den Access-Server auf R&D (`accessServerOverride: "rd"`). `canPlayForServer` begrenzt LegalActions auf HQ.
- Chronik: Start-Event enthält `hiddenZoneBarrier` und `accessServerOverride: "rd"`. Der bestehende Test prüft, dass HQ unverändert bleibt und R&D accessed wird.
- Tests: Positivpfad vorhanden. Fehlend sind wrong-side/stale, manipulierter `serverId`, erfolgloser Run ohne R&D-Access, R&D-Leerfall, AccessQueue-Redaction und Replay.
- Hidden-Info/Replay/StateHash: Besonders kritisch ist, dass der HQ-Run keine HQ-Informationen leakt, obwohl die Access-Auflösung auf R&D springt. R&D darf nur die tatsächlich accessbare Karte zeigen.
- Fehlende Härtungen: Ziel-Revalidation, Failed-run-Branch, AccessQueue-/Payload-Leakscan.

Notwendige Umsetzung:
- [ ] Gespeicherte Private-LDL-LegalAction mit wrong-side und stale `stateVersion` testen.
- [ ] Manipulierte Aktion mit `serverId: "rd"`, `archives` oder `remote_1` muss scheitern.
- [ ] Run-Ende vor erfolgreichem HQ-Run testen: kein R&D-Access und kein HQ-Leak.
- [ ] R&D-Leerfall und mehrere R&D-Zugriffe mit `accessServerOverride` prüfen.
- [ ] Replay/StateHash und PublicPayload-Leakscan gegen HQ-Inhalte ergänzen.

Akzeptanzkriterien:
- [ ] Legal ist nur ein HQ-Run; erfolgreicher HQ-Run accessed genau R&D.
- [ ] HQ-Karten bleiben ungeöffnet und werden nicht in PublicPayload/Replay/AI-Input genannt.
- [ ] Manipulierte Serverziele, stale State und falsche Seite werden abgewiesen.
- [ ] Replay endet mit identischem StateHash.

### onr_v1_129_hq-interface - HQ Interface

Bewertung:
- Engine: `runnerHqAccessBonus` addiert pro installierter HQ Interface Hardware einen zusätzlichen HQ-Access. Der V1.7.1-Test installiert eine Kopie und sieht eine HQ-Breach-Queue mit zwei Einträgen.
- Chronik: Der Access-Bonus ist über Breach-Queue und AccessCount indirekt sichtbar, aber der Payload nennt die installierte Quelle nicht ausdrücklich.
- Tests: Positivtest mit zwei HQ-Karten vorhanden. Fehlend sind mehrere HQ Interfaces, HQ mit weniger Karten als Bonus, R&D/Archives-Negativfall, Trash-Cleanup der Hardware und Replay.
- Hidden-Info/Replay/StateHash: HQ-Access ist hidden-info-sensibel. Mehrfachzugriffe dürfen nur zufällig/deterministisch über den bestehenden HQ-Access-Queue-Pfad laufen und keine nicht gezogenen HQ-Karten verraten.
- Fehlende Härtungen: Bonus-Stacking, kurze HQ, Hardware-Entfernung, PublicPayload-Attribution.

Notwendige Umsetzung:
- [ ] Test mit zwei installierten HQ Interfaces ergänzen: Bonus stackt nach festgelegtem Vertrag und wird auf verfügbare HQ-Karten begrenzt.
- [ ] Test für erfolgreiche Runs auf R&D/Archives: HQ Interface darf dort keinen Bonus geben.
- [ ] Trash-Cleanup testen: getrashte HQ Interface erhöht künftige HQ-Access-Anzahl nicht mehr.
- [ ] PublicPayload/Chronik so prüfen oder erweitern, dass Bonusquelle und effektive Accesszahl nachvollziehbar sind, ohne HQ-IDs zu leaken.
- [ ] Replay/StateHash für HQ-Multiaccess mit festem Seed ergänzen.

Akzeptanzkriterien:
- [ ] Pro installierter HQ Interface wird nur bei HQ-Breach der definierte Bonus addiert.
- [ ] Kurze HQs werden ohne Fehler und ohne Phantom-Access verarbeitet.
- [ ] Nicht ausgewählte HQ-Karten bleiben vor Runner, PublicEvents und AI-Input verborgen.
- [ ] Replay-StateHash ist stabil.

### onr_v1_173_restrictive-net-zoning - Restrictive Net Zoning

Bewertung:
- Engine: Installation erzeugt serverdistinkte LegalActions; `applyInstallCard` verlangt einen gültigen `selectedServerId` und speichert ihn auf der installierten Resource. `corpIceInstallAdditionalCost` addiert danach +1 auf ICE-Installkosten dieses Servers.
- Chronik: Der bestehende Test prüft serverdistinkte Action IDs und kombinierte Kosten mit Pox. Die Install-Chronik sollte den gewählten Server und die Tax-Quelle eindeutig ausweisen.
- Tests: Positivpfad mit `rd` und Pox existiert. Fehlend sind manipulierter Server nach Projektion, Resource-Trash-Cleanup, mehrere Restrictive-Kopien, anderer Server, `new_remote` und Replay.
- Hidden-Info/Replay/StateHash: Serverwahl ist öffentlich, aber Corp-Installoptionen dürfen keine verdeckten Runner-Handdaten oder unzulässige Korp-Serverdetails leaken.
- Fehlende Härtungen: Sourcebindung, Cleanup, Stackbarkeit und Payload-Attribution.

Notwendige Umsetzung:
- [ ] Install-LegalAction für Server A speichern, anschließend PlayerAction auf Server B/`new_remote` manipulieren und `applyAction` muss scheitern.
- [ ] Tests für anderen Server und getrashte Resource ergänzen: Tax gilt nur für gespeicherten Server und nur solange die Resource installiert ist.
- [ ] Zwei installierte Restrictive-Net-Zoning-Kopien auf gleichem und verschiedenem Server testen; Stack-Vertrag explizit sichern.
- [ ] PublicPayload bei Runner-Installation und Corp-ICE-Installation um `selectedServerId`, Taxquellen und `iceInstallAdditionalCost` prüfen.
- [ ] Replay/StateHash für Install plus nachfolgende Corp-ICE-Installation ergänzen.

Akzeptanzkriterien:
- [ ] `applyAction` revalidiert Serverwahl, Side, Kosten und StateVersion.
- [ ] Tax wirkt nur auf den gewählten Server und nur von installierten Quellen.
- [ ] Mehrere Kopien verhalten sich nach dokumentiertem Stack-Vertrag.
- [ ] Chronik ist source-bound und replay-stabil.

### onr_v1_211_polymer-breakthrough - Polymer Breakthrough

Bewertung:
- Engine: `applyCorpStartOfTurnEffects` zählt gescorte Polymer Breakthroughs und gibt der Korp zu Zugstart je 1 Credit. Der vorhandene Kombitest prüft eine Kopie und dass der Mandatory Draw nicht erneut zählt.
- Chronik: Der Creditgewinn läuft als Start-of-turn-Effekt; es ist nicht klar abgesichert, ob der EventLog-Payload Quelle, Anzahl der Kopien und Creditdelta explizit genug enthält.
- Tests: Ein Positivpfad in einem Kombitest mit AI CFO und Data Naga existiert. Fehlend sind zwei Kopien, Runner-Steal-Abgrenzung, Score-vs-installed-Abgrenzung, Replay und PublicPayload-Leakscan.
- Hidden-Info/Replay/StateHash: Gescorete Agenda ist öffentlich. Risiko liegt weniger in Hidden-Info als in doppelten Triggern und nicht nachvollziehbarer Start-of-turn-Chronik.
- Fehlende Härtungen: Mehrfachkopien, Nicht-Corp-ScoreArea, Triggerzeitpunkt, Replay.

Notwendige Umsetzung:
- [ ] Test mit zwei gescorten Polymer Breakthroughs ergänzen: Corp erhält exakt 2 Credits am Corp-Zugstart.
- [ ] Testen, dass gestohlene, installierte oder in HQ/R&D liegende Kopien keinen Credit geben und keine Identität leaken.
- [ ] Trigger nur beim Übergang in den Corp-Zug prüfen, nicht bei Mandatory Draw oder anderen Timingpunkten.
- [ ] PublicPayload/Chronik um Quelle/Kopienzahl/Creditdelta prüfen oder härten.
- [ ] Replay/StateHash für Start-of-turn-Effekt ergänzen.

Akzeptanzkriterien:
- [ ] Nur Korp-ScoreArea-Kopien zählen.
- [ ] Creditgewinn entspricht exakt der Anzahl gescorter Kopien.
- [ ] Keine verdeckten Agenda-Zonen werden durch PlayerViews, PublicEvents oder AI-Input offengelegt.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_213_private-cybernet-police - Private Cybernet Police

Bewertung:
- Engine: Scored-Agenda-LegalAction startet `private_cybernet_police` mit Trace 5. `applyAction` revalidiert Side, ScoreArea, Definition und Trace-Stärke; die lokale Konfliktentscheidung bestätigt Trace 5.
- Chronik: Trace-Start- und Bid-Payloads sind öffentlich und enthalten Base Trace, Bids, Link und Ergebnis. Bestehender Test prüft Trace 5 und Tag-Ergebnis nach Erfolg.
- Tests: Kombitest deckt Netwatch und Private Cybernet Police positiv ab; wrong-side/stale ist nur für Netwatch im selben Test explizit. Fehlend sind Private-Police-spezifische wrong-side/stale, mehrere Kopien, manipulierte Trace-Stärke, Runner-Steal-Abgrenzung und Replay.
- Hidden-Info/Replay/StateHash: Trace ist öffentlich; Hidden-Risiko entsteht nur durch falsche ScoreArea-Zuordnung oder wenn eine verdeckte Agendaidentität vor Score in KI-/Publicdaten auftaucht.
- Fehlende Härtungen: Sourcebindung und Manipulationsfälle direkt für Private Cybernet Police.

Notwendige Umsetzung:
- [ ] Private-Cybernet-Police-LegalAction speichern und wrong-side sowie stale direkt gegen diese Aktion prüfen.
- [ ] Manipuliertes `traceStrength: 7` oder falsches `agendaAbility` muss in `applyAction` scheitern.
- [ ] Zwei gescorte Kopien testen: gewählte Quelle bleibt source-bound, Trace-ID und Payload stimmen zur Quelle.
- [ ] Runner-Steal oder installierte/unscored Kopie darf keine Corp-Trace-Aktion erzeugen.
- [ ] Replay/StateHash für vollständige Trace-Sequenz ergänzen.

Akzeptanzkriterien:
- [ ] Private Cybernet Police startet exakt Trace 5.
- [ ] Trace-Erfolg gibt exakt 1 Tag; Misserfolg gibt keinen Tag.
- [ ] Falsche Side, stale State, falsche Quelle und manipulierte Trace-Stärke werden abgewiesen.
- [ ] Replay und PublicPayload bleiben ohne verdeckte Agenda-Leaks.

### onr_v1_235_data-naga - Data Naga

Bewertung:
- Engine: Die ungebrochene Subroutine nutzt den generischen `trash_installed_program`-Pfad und hängt End-the-run an. Zielwahl erfolgt deterministisch über `pickRunnerProgramForUninstall`.
- Chronik: Der Trash-Payload nennt `trashedCardDefinitionId`, `trashedCardType: "program"` und `trashedCount`. Der Kombitest prüft nur, dass ein installiertes Programm im Heap landet.
- Tests: Positivpfad vorhanden. Fehlend sind keine installierten Programme, mehrere Programme und Zielalgorithmus, gebrochene Trash-Subroutine, End-the-run-Kopplung, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: Installierte Programme sind sichtbar; keine Grip-/Stackdaten dürfen in Payloads auftauchen. End-the-run darf nur aus ungebrochener, korrekt aufgelöster Subroutine folgen.
- Fehlende Härtungen: Ziel-Determinismus, Break-/No-target-Branch, Payload/Replay.

Notwendige Umsetzung:
- [ ] Test mit mehreren installierten Programmen ergänzen und Zielauswahl deterministisch festlegen.
- [ ] Test ohne installierte Programme: Trash bleibt No-op, End-the-run-Verhalten wird explizit nach Subroutinevertrag gesichert.
- [ ] Test mit gebrochener Trash-Subroutine: kein Program-Trash; End-the-run nur wenn eigene ETR-Subroutine ungebrochen auflöst.
- [ ] Wrong-side/stale für Break/Continue um die Data-Naga-Subroutinen ergänzen.
- [ ] PublicPayload-Leakscan und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] Data Naga trasht genau ein installiertes Runner-Programm nach dokumentiertem Zielalgorithmus oder tut bei fehlendem Ziel stabil nichts.
- [ ] Gebrochene Subroutinen lösen keine Effekte aus.
- [ ] PublicPayload nennt nur sichtbare installierte Programmdefinitionen, keine Hidden-Zone-Daten.
- [ ] Replay-StateHash ist stabil.

### onr_v1_275_vacuum-link - Vacuum Link

Bewertung:
- Engine: `resolveVacuumLinkRewindSubroutine` würfelt deterministisch; bei 1-3 rewound der Run auf entsprechend viele rezzed ICE zurück oder auf outermost ICE, setzt wieder das Jack-out-Fenster und resetet Breaker-Stärke. Bei 4-6 kein Rewind.
- Chronik: Payload enthält `vacuumLinkDieRoll`, `vacuumLinkRewindApplied`, Ziel-ICE-ID und Zielindex. Der vorhandene Test erzwingt einen 2/3-Fall und prüft Jack-out/Continue.
- Tests: Positivpfad für Rewind vorhanden. Fehlend sind No-rewind 4-6, nur ein ICE/erstes ICE, unrezzed ICE überspringen, Breaker-Strength-Cleanup, wrong-side/stale und Replay/StateHash.
- Hidden-Info/Replay/StateHash: ICE-Identitäten sind nach Rez öffentlich; der Zufall muss ausschließlich über Seed/RandomDrawRecords laufen. Unrezzed ICE dürfen durch Rewind-Logik nicht unzulässig revealed werden.
- Fehlende Härtungen: Branchabdeckung, unrezziertes ICE im Pfad, Payload-Leakscan und Replay.

Notwendige Umsetzung:
- [ ] Deterministische Seeds für No-rewind 4-6 und Rewind 1/2/3 ergänzen.
- [ ] Test mit unrezzed ICE zwischen Ziel und aktueller Position: Rewind zählt nur rezzed ICE und leakt keine unrezzed Definition.
- [ ] First-ICE/Single-ICE-Edge prüfen: Rewind endet stabil am äußeren ICE und öffnet korrektes Jack-out-Fenster.
- [ ] Breaker-Strength und Encounter-State nach Rewind/Cleanup prüfen.
- [ ] Wrong-side/stale für die auslösende Continue-Aktion und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] Würfel 1-3 rewound deterministisch, Würfel 4-6 nicht.
- [ ] Ziel-ICE-Berechnung berücksichtigt nur rezzed ICE und leakt keine unrezzed Karten.
- [ ] Jack-out/Continue-LegalActions und Breaker-State sind nach Rewind korrekt.
- [ ] RandomDrawRecords und Replay-StateHash sind stabil.

### onr_v1_334_pacifica-regional-ai - Pacifica Regional AI

Bewertung:
- Engine: Die Karte gehört zu `V1920_ACTION_ASSET_IDS`; eine rezzed installierte Quelle erzeugt eine Korp-LegalAction mit `v1920AssetAbility: "gain_actions"`, kostet 1 Click und gewährt 2 Clicks, netto also +1 Click. `applyAction` revalidiert Side, rezzed Root-Status, Definition und `gainedActions === 2`.
- Chronik: Payload enthält `gainedActions` und `corpClicksAfter`; Test prüft groben PublicPayload-Leakscan.
- Tests: Sammeltest für Remote Facility, Nevinyrral und Pacifica Regional AI existiert. Fehlend sind Pacifica-spezifische wrong-side/stale, unrezzed/trashed Quelle, mehrfaches Nutzen im selben Zug, Click-Grenzen und Replay.
- Hidden-Info/Replay/StateHash: Rezzed Asset ist öffentlich. Risiko liegt in Action-Economy-Schleifen, Sourcebindung und Payload-Drift.
- Fehlende Härtungen: Per-card Nutzungslimit oder bewusstes mehrfaches Nutzen, StateVersion, Source-Cleanup.

Notwendige Umsetzung:
- [ ] Pacifica-spezifischen Test ergänzen, der wrong-side/stale gegen gespeicherte LegalAction prüft.
- [ ] Manipulierte Aktion mit unrezzed, getrashter oder fremder Asset-Quelle muss scheitern.
- [ ] Mehrfachnutzung im selben Zug prüfen und Vertrag festlegen: erlaubt mit je 1 Click Kosten oder begrenzt; Tests entsprechend sichern.
- [ ] Test mit 0 Clicks vor Aktion: keine LegalAction und keine manipulierbare Ausführung.
- [ ] Replay/StateHash und PublicPayload-Leakscan beibehalten bzw. auf Pacifica isolieren.

Akzeptanzkriterien:
- [ ] Nur rezzed installierte Pacifica Regional AI kann die Action-Economy-Aktion ausführen.
- [ ] Aktion kostet 1 Click, gibt exakt 2 Clicks und ist source-bound.
- [ ] Wrong-side, stale State, unrezzed/trashed Quelle und manipuliertes `gainedActions` werden abgewiesen.
- [ ] Replay-StateHash bleibt stabil.

## Gesamtplan

1. Deduplizierung vor Umsetzung erneut prüfen; falls ein paralleler Job eine dieser zehn Card IDs inzwischen reserviert hat, diesen Job blocken oder zurückstellen.
2. Zuerst Hidden-Zone- und Access-Leaks absichern: Fortress Respecification, Ice and Data's Guide to the Net, Private LDL Access und HQ Interface.
3. Danach source-bound Revalidation und Cleanup für persistente Modifier umsetzen: Restrictive Net Zoning, Polymer Breakthrough und Pacifica Regional AI.
4. Anschließend Trace-, Subroutine- und Zufallspfade härten: Private Cybernet Police, Data Naga und Vacuum Link.
5. Für alle Karten fokussierte Tests auf wrong-side, stale `stateVersion`, manipulierte Payloads, Sourcebindung, PublicPayload-Redaction und Replay/StateHash ergänzen.
6. Katalog-, Manifest-, AI- und Szenarioartefakte nur ändern, wenn ein Effektvertrag tatsächlich korrigiert oder ein testrelevanter Statusbeleg ergänzt wird; keine neue Karte promoten.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

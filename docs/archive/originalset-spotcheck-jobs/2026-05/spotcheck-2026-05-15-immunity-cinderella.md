---
jobId: spotcheck-2026-05-15-immunity-cinderella
status: done
createdAt: 2026-05-15T08:17:33+01:00
startedAt: 2026-05-15T09:47:56+02:00
completedAt: 2026-05-15T10:08:54+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_160_diplomatic-immunity
    title: Diplomatic Immunity
  - cardId: onr_v1_188_ai-chief-financial-officer
    title: AI Chief Financial Officer
  - cardId: onr_v1_196_corporate-war
    title: Corporate War
  - cardId: onr_v1_209_political-coup
    title: Political Coup
  - cardId: onr_v1_222_ball-and-chain
    title: Ball and Chain
  - cardId: onr_v1_228_cinderella
    title: Cinderella
  - cardId: onr_v1_248_homewrecker
    title: Homewrecker
  - cardId: onr_v1_292_management-shake-up
    title: Management Shake-Up
  - cardId: onr_v1_315_corprunners-shattered-remains
    title: Corprunner's Shattered Remains
  - cardId: onr_v1_371_tokyo-chiba-infighting
    title: Tokyo-Chiba Infighting
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-immunity-cinderella

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`, alle Markdown-Dateien unter `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/archive/originalset-spotcheck-jobs/2026-05/` und `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 110 Card IDs wurden als tabu erkannt. Dazu zählen die erledigten Runden 2026-05-14-A/B, die sechs erledigten Runden vom 2026-05-15, die sichtbare `contacts-datapool`-Dublette in `in_progress/` sowie die vorhandenen Inbox-Jobs `ambush-hidden-trace` und `breaker-modifier-random`.
- Auswahlbegründung: Aus 264 nicht tabu gesetzten, bereits decklegalen und AI-supported O:NR-v1-Karten wurde ein komplexer Pool von 90 Karten mit Engine-, Chronik-, Timing-, Choice-, Hidden-Info-, Replay- oder StateHash-Relevanz gebildet. Daraus wurden zufällig diese zehn Karten gezogen. Die Stichprobe deckt Damage-Prevention, Hidden-Zone-Shuffle, On-score-Economy, scored-agenda Counteraktionen, runweite ICE-Flags, Trace/Damage-ICE, Operation-Counterzielwahl, Access-Ambush-Hardwaretrash und servergebundene Regionseffekte ab.
- Geprüfte Fachartefakte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, `data/manifests/card-implementation-manifest-1.6.3.json`, `data/manifests/card-implementation-manifest-1.8.1.json`, `data/manifests/card-implementation-manifest-1.9.2.json`, `data/manifests/card-implementation-manifest-1.9.14.json`, `data/manifests/card-implementation-manifest-1.9.19.json`, `data/manifests/card-implementation-manifest-1.9.20.json`, `data/manifests/card-implementation-manifest-1.9.22.json`, passende `deck-legal-ai-approval-*.json`, `ai-card-hints-deck-legal-*.json`, Release-Smokes und V1.9.x Review-/Matrix-Artefakte.

## Kartenbefunde

### onr_v1_160_diplomatic-immunity - Diplomatic Immunity

Bewertung:
- Engine: Die Karte ist decklegal, aber die Runtime-Definition beschreibt nur eine installierbare Resource mit "prevention and global agenda-cost modifier surfaces"; in `RUNTIME_DAMAGE_PREVENTION_PROFILES` ist kein Profil fuer `onr_v1_160_diplomatic-immunity` vorhanden. Damit verhindert sie aktuell kein Meat Damage und kann ihren eigentlichen Effekt nicht nachweisbar ausueben.
- Chronik: Install/Resource-Chronik ist erwartbar, aber es gibt keinen kartenkonkreten Prevention- oder Agenda-Punkt-Cancel-Payload.
- Tests: Die Karte erscheint in V1.9.20-Deck/AI-Smokes, aber es gibt keinen fokussierten Engine-Test fuer Meat-Damage-Prevention, Corp-Agenda-Punkt-Cancel, wrong-side/stale oder Replay.
- Hidden-Info/Replay/StateHash: Damage-Prevention beruehrt Grip-/Flatline-Pfade. PublicEvents duerfen nur Damage-Summary, Preventionquelle und Endwerte zeigen, keine getroffenen Karten oder private Handinhalte.
- Fehlende Haertungen: Effektvollstaendigkeit, Corp-Cancel-Window, Decklegalitaet vs. display-only-Drift, Replay/StateHash.

Notwendige Umsetzung:
- [ ] Finalen lokalen Effektvertrag festhalten: installiert verhindert Diplomatic Immunity Meat Damage; die Korp kann den Effekt fuer den aktuellen Schaden/Zug durch Zahlung von 1 Agenda-Punkt nach dem festgelegten Timing canceln.
- [ ] `RUNTIME_DAMAGE_PREVENTION_PROFILES` oder einen kartenkonkreten Prevention-/Cancel-Resolver so erweitern, dass Meat Damage nur aus installierter, aktiver Resource verhindert wird.
- [ ] Corp-Cancel als LegalAction/Choice modellieren und in `applyAction` side, stateVersion, Agenda-Punktkosten, aktuelle Damage-Window-ID und Source erneut validieren.
- [ ] Tests fuer installierte vs. nicht installierte Karte, Corp kann/kann nicht canceln, wrong-side, stale, Damage-Redaction und Replay/StateHash ergaenzen.

Akzeptanzkriterien:
- [ ] Ohne Corp-Cancel wird Meat Damage vollstaendig verhindert, Net/Core Damage bleiben unveraendert.
- [ ] Corp-Cancel kostet exakt 1 Agenda-Punkt und gilt nur im aktuellen Prevention-Fenster.
- [ ] Keine privaten Gripkarten erscheinen in PublicPayload, PlayerViews, Replay oder AI-Input.
- [ ] Replay endet mit identischem StateHash.

### onr_v1_188_ai-chief-financial-officer - AI Chief Financial Officer

Bewertung:
- Engine: `resolveAiChiefFinancialOfficer` leert HQ und Archives, mischt diese Karten zusammen mit R&D deterministisch in R&D und zieht danach bis zu 5 Karten. `applyAction` revalidiert Corp-Seite, ScoreArea und Definition.
- Chronik: Payload setzt `hiddenZoneBarrier`, `hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd"`, `shuffledCardsCount` und `drawnCardsCount`. Das ist side-sicher, aber der bestehende Test prueft kaum Revalidation und keinen kurzen R&D/HQ-Fall.
- Tests: Es gibt einen Kombitest fuer Polymer, AI CFO und Data Naga. Es fehlen wrong-side/stale, mehrere gescorte Kopien, leerer HQ/Archives/R&D-Edge und ein Replay/StateHash-Fokus direkt fuer AI CFO.
- Hidden-Info/Replay/StateHash: Sehr hohe Hidden-Zone-Relevanz. Die Zufallsreihenfolge muss ausschliesslich ueber Seed/RandomDrawRecords laufen; PublicPayload darf keine HQ-, Archives- oder R&D-CardIds enthalten.
- Fehlende Haertungen: Sourcebindung bei mehreren Kopien, kurze Decks, manipulierter `drawCardsAmount`, Payload-Leakscan.

Notwendige Umsetzung:
- [ ] Einen AI-CFO-Fokustest ergaenzen, der eine LegalAction speichert und wrong-side sowie stale State gegen exakt diese Aktion prueft.
- [ ] Zwei gescorte AI-CFO-Kopien testen: ausgewaehlte Source muss im Payload stimmen, beide duerfen keine verdeckten Zoneninhalte leaken.
- [ ] Edge-Test fuer leere HQ/Archives und weniger als 5 Karten in R&D ergaenzen.
- [ ] Manipulierten `drawCardsAmount` gegen `applyAction` pruefen oder hart auf 5 revalidieren.

Akzeptanzkriterien:
- [ ] HQ und Archives sind danach leer; R&D wurde deterministisch gemischt; die Korp zieht maximal 5 Karten.
- [ ] PublicPayload nennt nur Count- und Sourceinformationen, keine privaten CardIds/Titel.
- [ ] Wrong-side, stale und manipulierte Payloads scheitern ohne State-Mutation.
- [ ] Replay-StateHash ist stabil.

### onr_v1_196_corporate-war - Corporate War

Bewertung:
- Engine: `scoreAgenda` implementiert den On-score-Schwellenresolver: bei mindestens 12 Korp-Credits Gain 12, sonst Credits auf 0. Der V1.9.22-Test deckt beide Branches, wrong-side, stale, PublicPayload und Replay fuer den Erfolgsbranch ab.
- Chronik: Payload enthaelt Schwelle, Credits vorher/nachher und Branch. Das ist gut lesbar und public-safe.
- Tests: Der Miss-Branch prueft State und Payload, aber kein Replay/StateHash. Ein Grenzwerttest exakt 12 Credits fehlt.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Effekt, aber Score-Action muss keine installierten/verdeckten Serverdetails leaken.
- Fehlende Haertungen: Exakt-12-Grenze, Miss-Branch-Replay, Steal-Abgrenzung.

Notwendige Umsetzung:
- [ ] Test fuer exakt 12 Credits vor Score ergaenzen: Schwelle gilt als erreicht und danach 24 Credits.
- [ ] Miss-Branch mit Replay/StateHash absichern.
- [ ] Testen, dass Runner-Steal von Corporate War keinen On-score-Creditresolver ausloest.
- [ ] PublicPayload-Leakscan fuer beide Branches gegen `hq`, `rd`, `cardInstances`, `privatePayload`.

Akzeptanzkriterien:
- [ ] Score bei 12 oder mehr Credits gewinnt exakt 12 Credits.
- [ ] Score unter 12 Credits setzt Korp-Credits exakt auf 0.
- [ ] Steal loest keinen Corp-On-score-Effekt aus.
- [ ] Beide Branches replayen statehash-stabil.

### onr_v1_209_political-coup - Political Coup

Bewertung:
- Engine: Beim Scoren setzt `scoreAgenda` 12 Power-Counter; die scored-agenda Aktion entfernt 3 Counter und gewinnt 3 Credits. Der Test bestaetigt Counter und Creditgewinn.
- Chronik: Payloads nennen `powerCountersAdded`, `agendaAbility: "political_coup"`, `spentPowerCounters`, `gainedCredits` und Restcounter.
- Tests: Positivpfad vorhanden. Fehlend sind wrong-side/stale fuer die scored-agenda Aktion, Leer-Counter-No-LegalAction, mehrere gescorte Kopien und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Keine verdeckten Karten. Risiko liegt in Sourcebindung, Counter-Revalidation und StateVersion.
- Fehlende Haertungen: Revalidation gegen manipulierte `cardId`, Counter-Drift, Kopien.

Notwendige Umsetzung:
- [ ] Political-Coup-Fokustest mit gespeicherter LegalAction fuer wrong-side und stale ergaenzen.
- [ ] Manipulierte Aktion mit anderer gescorter Agenda-ID und mit auf 0 gesetzten Countern muss scheitern.
- [ ] Zwei gescorte Political-Coup-Kopien testen; nur die gewaehlte Quelle verliert Counter.
- [ ] Replay/StateHash fuer Score plus eine Counteraktion ergaenzen.

Akzeptanzkriterien:
- [ ] Score setzt exakt 12 Power-Counter.
- [ ] Jede Aktion entfernt exakt 3 Counter und gewinnt exakt 3 Credits.
- [ ] Keine Aktion ist legal, wenn weniger als 3 Counter vorhanden sind.
- [ ] Sourcebindung, wrong-side/stale und Replay sind stabil.

### onr_v1_222_ball-and-chain - Ball and Chain

Bewertung:
- Engine: Die Subroutine setzt `run.encounterTaxForFutureIce = 1`; spaetere Encounter verlangen den Zusatzcredit oder beenden den Run. Der V1.8.1-Test prueft den Basisflag innerhalb eines Sammeltests.
- Chronik: Der konkrete Tax-Entscheid und die Quelle sollten im Continue-/Encounter-Payload nachvollziehbar sein; der vorhandene Sammeltest prueft vor allem State.
- Tests: Positivpfad ist vorhanden. Fehlend sind Runner mit 0 Credits, Break der Tax-Subroutine, Cleanup nach Run-Ende, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: ICE ist nach Rez oeffentlich; der Tax darf nur im aktuellen Run wirken und nicht in Folge-Runs ueberlaufen.
- Fehlende Haertungen: Run-Cleanup, Zahlungs-/ETR-Branch, Payload und StateHash.

Notwendige Umsetzung:
- [ ] Test mit gebrochener Ball-and-Chain-Subroutine ergaenzen: kein Future-Encounter-Tax.
- [ ] Test mit Runner ohne Credits am naechsten ICE: Run endet deterministisch und Payload nennt Taxquelle.
- [ ] Nach erfolgreichem und erfolglosem Run pruefen, dass `encounterTaxForFutureIce` entfernt ist.
- [ ] Wrong-side/stale fuer relevante `continue_run`-/Break-Aktionen und Replay/StateHash ergaenzen.

Akzeptanzkriterien:
- [ ] Ungebrochene Subroutine setzt genau 1 Credit Future-Encounter-Tax.
- [ ] Gebrochene Subroutine setzt keinen Tax.
- [ ] Tax wirkt nur im aktuellen Run und wird sauber entfernt.
- [ ] Chronik und Replay sind source-bound und statehash-stabil.

### onr_v1_228_cinderella - Cinderella

Bewertung:
- Engine: Die Runtime-Definition weicht vom bestaetigten lokalen Mechaniktext ab. Shared Runtime sagt aktuell Trace 6, bei Erfolg 1 Tag, danach 1 Meat Damage. Lokale Quellen/Manifest beschreiben Trace -> End the run, Hardware trash und 2 Meat Damage, unpreventable. Damit ist ein hoher Effektvollstaendigkeits- und Katalog-/AI-Drift-Befund offen.
- Chronik: Vorhandene V1.9.14-Trace-Tests pruefen nur Trace-Bid-Fenster und Tag-Success. Hardware-Trash, End-the-run und unpreventable Damage erscheinen nicht im Payload.
- Tests: Sammeltest fuer Trace-ICE vorhanden, aber kein kartenkonkreter Cinderella-Test fuer Success-Folge, Hardware-Ziel, Damage-Prevention-Bypass, Break-Index und Replay.
- Hidden-Info/Replay/StateHash: Hardwareziel ist oeffentlich sichtbar; Damage darf keine Gripinhalte leaken. Unpreventable Damage muss Prevention-Fenster bewusst ueberspringen oder als Konflikt sauber markiert werden.
- Fehlende Haertungen: Effektkorrektur, Hardware-Choice/Targeting, unpreventable Flag, Payload/Replay.

Notwendige Umsetzung:
- [ ] Runtime-Definition, Manifest und AI-Hint auf den bestaetigten Cinderella-Vertrag abgleichen: Trace 6; bei Erfolg End the run, trash eine installierte Hardware und 2 Meat Damage, nicht verhinderbar.
- [ ] LegalAction-/Choice-Pfad fuer Hardwaretrash festlegen: automatisch sichtbar bestes Ziel oder Runner/Korp-Choice; Entscheidung dokumentieren und revalidieren.
- [ ] Damage-Aufloesung mit `cannotBePrevented`/aehnlichem Flag so haerten, dass normale Prevention-Kandidaten nicht angeboten werden.
- [ ] Tests fuer Trace-Erfolg, Trace-Miss, keine Hardware, vorhandene Hardware, Prevention-Bypass, wrong-side/stale und Replay/StateHash ergaenzen.

Akzeptanzkriterien:
- [ ] Cinderella gibt bei Trace-Erfolg keinen Tag, sondern loest exakt die korrigierte Erfolgsfolge aus.
- [ ] Hardwaretrash betrifft nur installierte Runner-Hardware und ist in `applyAction` revalidiert.
- [ ] Unpreventable Meat Damage oeffnet kein normales Prevention-Fenster.
- [ ] PublicPayload nennt Trace-Ergebnis, Hardware-Definition, Damage-Summary und Run-Ende ohne private Handkarten.

### onr_v1_248_homewrecker - Homewrecker

Bewertung:
- Engine: Auch Homewrecker driftet sichtbar. Runtime sagt Trace 5, bei Erfolg 1 Tag, 2 Meat Damage und End the run. Lokale Quellen/Mechanikmatrix beschreiben Trace -> End the run, Hardware trash und 2 Meat Damage, nicht verhinderbar. Der Tag-Effekt ist daher wahrscheinlich falsch; Hardwaretrash fehlt.
- Chronik: Sammeltest prueft Trace-Bid-Fenster; Hardwaretrash, unpreventable Damage und source-bound ETR werden nicht fokussiert.
- Tests: Es fehlt ein Homewrecker-Einzeltest fuer Erfolgsfolge, Miss-Branch, Break einzelner Subroutinen, Hardware-Ziel, Prevention-Bypass und Replay.
- Hidden-Info/Replay/StateHash: Wie Cinderella, zusaetzlich muss End-the-run nur bei ungebrochener/erfolgreicher Kette eintreten.
- Fehlende Haertungen: Effektkorrektur, Tag-Entfernung aus Resolver, Hardwaretrash, Prevention-Bypass, Payload.

Notwendige Umsetzung:
- [ ] Runtime-Definition auf lokalen Vertrag korrigieren: Trace 5; bei Erfolg End the run, trash eine installierte Hardware und 2 Meat Damage, nicht verhinderbar.
- [ ] Bestehenden Tag-Success-Effekt entfernen, falls lokale Quellen keinen Tag bestaetigen.
- [ ] Hardwaretrash-Zielpfad und No-Hardware-Branch implementieren oder bestaetigen.
- [ ] Tests analog Cinderella ergaenzen, zusaetzlich mit End-the-run-Assertions fuer Erfolg/Miss/Break.

Akzeptanzkriterien:
- [ ] Homewrecker erzeugt bei Trace-Erfolg die korrigierte Hardwaretrash-/Damage-/ETR-Folge.
- [ ] Bei Trace-Miss treten Hardwaretrash, Damage und ETR nicht ein.
- [ ] Damage ist nicht verhinderbar und leakt keine Gripdaten.
- [ ] Replay-StateHash ist fuer beide Branches stabil.

### onr_v1_292_management-shake-up - Management Shake-Up

Bewertung:
- Engine: `V1919_MANAGEMENT_SHAKE_UP_ID` nutzt denselben `resolveV1919CounterOperation`-Pfad wie Falsified-Transactions Expert und fuegt offenbar nur einem automatisch gewaehlten Agenda-Ziel Power-Counter hinzu. Der angezeigte Kartentext aus dem Zufallspool beschreibt jedoch drei Advancement-Counter auf beliebige Kombinationen installierter advancebarer Karten; Shared Runtime ist nur generisch.
- Chronik: Payload fuer V1.9.19-Counteroperationen ist vorhanden, aber die Karte nennt nicht verstaendlich eine Drei-Counter-Verteilung oder Advancement-Counter.
- Tests: V1.9.19-Smoke nennt Management Shake-Up, aber kein fokussierter Test prueft Anzahl 3, Zielkombinationen, advancebare Karten, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: Zielkarten sind installierte oeffentliche/Corp-Root-Karten; fuer unrezzed Remote-Ziele darf die Auswahl keine unzulaessigen Informationen an Runner leaken.
- Fehlende Haertungen: Effektvertrag gegen lokale Quellen, Choice fuer bis zu drei Counter, Revalidation von advancebaren Zielen.

Notwendige Umsetzung:
- [ ] Lokalen Vertrag pruefen und festlegen, ob Management Shake-Up wirklich drei Advancement-Counter verteilt oder absichtlich als Power-Counter-Surrogat implementiert ist.
- [ ] Bei echtem Vertrag einen Choice-Resolver fuer drei Advancement-Counter auf advancebare installierte Karten implementieren; Zieloptionen side-sicher projizieren.
- [ ] `applyAction` muss jedes Ziel, Counteranzahl, Duplikate, Side, Kosten und StateVersion erneut validieren.
- [ ] Tests fuer ein Ziel mit drei Countern, mehrere Ziele, nicht advancebare Ziele, unrezzed/hidden Root-Redaction, wrong-side/stale und Replay ergaenzen.

Akzeptanzkriterien:
- [ ] Effekt und Katalog-/AI-Vertrag stimmen ueberein.
- [ ] Es werden exakt drei Advancement-Counter nach legaler Zielwahl platziert.
- [ ] Runner erhaelt keine verdeckten Root-/HQ-/R&D-Informationen.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_315_corprunners-shattered-remains - Corprunner's Shattered Remains

Bewertung:
- Engine: V1.9.19 hat einen Access-Ambush-Pfad, der installierte Runner-Hardware trasht. Der Test prueft eine Hardware und PublicPayload-Action.
- Chronik: Payload enthaelt `hiddenZoneAction: "v1919_access_ambush_trash_installed"` und Ambush-ID, aber Counteranzahl, Zieldefinition und Access-Ort sind nicht eng belegt.
- Tests: Positivpfad vorhanden. Fehlend sind Advancement-Counter-Skalierung, keine Hardware, mehrere Hardwareziele, Archives-Ausnahme/Access-Ort, wrong-side/stale, Runner-View-Redaction und Replay.
- Hidden-Info/Replay/StateHash: Runner-Hardware ist oeffentlich sichtbar; Ambush aus R&D/Archives/Remote darf nur zulaessige Access-Informationen zeigen. R&D-Access darf Definition offenbaren, aber keine R&D-Restdaten.
- Fehlende Haertungen: X-pro-Counter-Regel, Zielauswahl oder deterministischer Zielalgorithmus, Archives-/R&D-Sonderfaelle, Replay.

Notwendige Umsetzung:
- [ ] Lokalen Textvertrag gegen Runtime pruefen: Trash eine Hardware je Advancement-Counter, inklusive Null-Counter- und No-Hardware-Verhalten.
- [ ] Test mit 0/1/2 Advancement-Countern und mehreren Hardwarekarten ergaenzen; Zielreihenfolge oder Choice explizit festlegen.
- [ ] Access aus Remote, R&D und Archives testen; Archives-Ausnahme falls laut Vertrag relevant.
- [ ] PublicPayload um Zieldefinitionen/Anzahl ohne private Zonenleaks haerten; wrong-side/stale und Replay/StateHash ergaenzen.

Akzeptanzkriterien:
- [ ] Anzahl getrashter Hardware entspricht exakt dem finalen Countervertrag.
- [ ] Keine Hardware fuehrt zu stabilem No-op ohne Fehler.
- [ ] Access-Ort-Regeln werden eingehalten und leaken keine R&D-/Archives-Restdaten.
- [ ] Replay-StateHash ist stabil.

### onr_v1_371_tokyo-chiba-infighting - Tokyo-Chiba Infighting

Bewertung:
- Engine: `tokyoChibaUnsuccessfulRunBonus` gibt bei erfolglosem Run auf das angegriffene Fort 2 Credits, wenn dort ein rezzed Tokyo-Chiba in Root liegt. Region-Installregeln trashen aeltere Regionen. Das entspricht Shared-Text, waehrend alte V1.6.3-Anforderungen noch 1 Credit nannten.
- Chronik: Der Creditbonus wird in `finishRun` addiert; es ist nicht sichtbar, ob der letzte EventPayload die Quelle und den Creditdelta ausweist.
- Tests: V1.6.3-Test deckt Rez-on-install, Region-Replacement und einen erfolglosen Run ab. Fehlend sind anderer Server, erfolgreicher Run, Trash-Cleanup, multiple Regions nach Replacement, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: Region ist vor Rez verdeckt; Run-Pfad und Runner-AI duerfen vor Rez keinen Bonus/Identitaet ableiten. Nach Rez ist Quelle oeffentlich.
- Fehlende Haertungen: Payload-Quelle, 1-vs-2-Credit-Dokumentationsdrift, Serverbindung, Replay.

Notwendige Umsetzung:
- [ ] Wissens-/Testdrift klaeren: V1.6.3-Requirement nennt 1 Credit, aktuelle Runtime und Kartentext geben 2 Credits. Fuehrende Entscheidung im Testnamen/Kommentar oder Review festhalten.
- [ ] Tests fuer erfolglosen Run auf eigenem Server, erfolgreichen Run auf eigenem Server und erfolglosen Run auf anderem Server ergaenzen.
- [ ] Trash/Replacement-Cleanup testen: getrashter Tokyo-Chiba darf keinen Bonus mehr geben.
- [ ] PublicPayload fuer Run-Ende um Quelle, ServerId und `corpCreditsGained` haerten; Replay/StateHash ergaenzen.

Akzeptanzkriterien:
- [ ] Nur rezzed Tokyo-Chiba im angegriffenen Server gibt nach erfolglosem Run exakt 2 Credits.
- [ ] Erfolgreiche Runs und andere Server geben keinen Bonus.
- [ ] Region-Replacement entfernt die alte Quelle vollstaendig.
- [ ] Vor Rez leakt keine Identitaet; nach Rez ist Chronikquelle oeffentlich und replay-stabil.

## Gesamtplan

1. Zuerst harte Effekt-Drift korrigieren: Diplomatic Immunity, Cinderella, Homewrecker und Management Shake-Up gegen lokale Kartenvertraege abgleichen und Engine/Katalog/AI-Hints synchronisieren.
2. Danach Einzeltest-Haertung fuer bereits solide Pfade ergaenzen: AI Chief Financial Officer, Corporate War, Political Coup, Ball and Chain, Corprunner's Shattered Remains und Tokyo-Chiba Infighting.
3. Fuer alle zehn Karten wrong-side, stale StateVersion, manipulierte Payloads, Side/Sourcebindung und Kosten-/Ziel-Revalidation pruefen.
4. Hidden-Info- und PublicPayload-Checks fokussieren: AI CFO, Diplomatic Immunity, Cinderella/Homewrecker Damage, Management-Shake-Up-Zieloptionen, Shattered-Remains-Access und Tokyo-Chiba-Rezgrenze.
5. Nach Umsetzung Manifest-, Katalog-, AI-Hint- und Szenarioartefakte nur dort anfassen, wo der Effektvertrag tatsaechlich korrigiert wurde; keine neue Karte promoten.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsabschluss 2026-05-15

Status: `done`.

Umgesetzt:
- `Diplomatic Immunity` verhindert installiertes Meat Damage über ein kartenkonkretes Runtime-Prevention-Profil; die Korp kann das Prevention-Fenster per Agenda-Punkt-Forfeit canceln. `cannotBePrevented` wird von Event-Modification-, Replacement- und Damage-Prevention-Kandidaten respektiert.
- `AI Chief Financial Officer` ist source-bound, zieht hart maximal 5 Karten und publiziert nur Count-/Source-Metadaten.
- `Corporate War` und `Political Coup` sind in Grenzwert, Sourcebindung, PublicPayload und Replay nachgetestet; Political Coup publiziert die Power-Counter-Kosten.
- `Ball and Chain` schreibt Future-Encounter-Tax, Zahlung/Nichtzahlung und Run-Ende in den `rez_ice`-/`continue_run`-Payload.
- `Cinderella` und `Homewrecker` wurden auf den lokalen Vertrag korrigiert: Trace-Erfolg beendet den Run, trasht eine installierte Runner-Hardware, verursacht 2 nicht verhinderbares Meat Damage und erzeugt keinen Tag.
- `Management Shake-Up` platziert drei Advancement-Counter deterministisch auf advancebaren installierten Korp-Karten und publiziert nur Count-Metadaten.
- `Corprunner's Shattered Remains` skaliert den Hardwaretrash mit Advancement-Countern.
- `Tokyo-Chiba Infighting` publiziert den servergebundenen Creditbonus beim erfolglosen Run-Ende.

Geänderte Dateien dieses Jobs:
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `data/ai/ai-card-hints-deck-legal-v1914.json`
- `data/ai/ai-card-hints-deck-legal-v1919.json`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `data/manifests/card-implementation-manifest-1.9.14.json`
- `data/manifests/card-implementation-manifest-1.9.19.json`
- `data/manifests/card-implementation-manifest-1.9.20.json`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_IMMUNITY_CINDERELLA_IMPLEMENTATION.md`
- `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-immunity-cinderella.md`
- `docs/derived/originalset-spotcheck-jobs/in_progress/spotcheck-2026-05-15-immunity-cinderella.md`
- `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-immunity-cinderella.md`

Tests:
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Restpunkte: Keine fachlichen Restpunkte aus diesem Job. Der lokale Commit konnte in diesem Lauf nicht erstellt werden, weil Git wiederholt `C:/Projekte/NETGRID/.git/index.lock` nicht anlegen konnte (`Permission denied`) und zusätzlich ein separater ACME/V1.9.5-Dirty-State im Arbeitsbaum liegt, der nicht zu dieser Runde gehört.

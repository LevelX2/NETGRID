# V1.7.1 bis V1.8.1 Detailplanung (Mechanikpakete E bis H)

Stand: 2026-05-09
Status: detailgeplant (nur Planung, keine Implementierung)

## Ziel und Rahmen

Diese Planung beschreibt die nächsten vier Releases `V1.7.1`, `V1.7.2`, `V1.8.0` und `V1.8.1` so, dass danach je Release ein requirements-getriebener Implementierungsstart möglich ist.

Verbindliche Leitlinien:

- Engine-Korrektheit, Hidden-Info-Schutz, Replay/StateHash-Determinismus und LegalAction-only bleiben harte Gates.
- Keine Engine-/UI-/Server-Implementierung in diesem Dokument.
- Keine Scope-Verschiebung zu V2.x-Produktfeatures.
- Deck-Legal-AI-Approval Batch B-G bleibt separater Gate-Strang.
- Release-Schnitt bleibt `freigabefähig` vs `deferred`, nicht „alles aus Matrix sofort freigeben“.
- Jeder Releaseabschluss enthält als Pflichtpunkt das Anheben der im Webclient sichtbaren Versionsnummer auf den Zielrelease-Stand inkl. Nachweis im Final Review.

## Verwendete Quellen

Pflichtquellen und relevante Planungs-/Matrixartefakte:

- `AGENTS.md`, `AGENTS.local.md`
- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/releases/v1/v1-6-1-mechanikpaket-a/plan-to-v1-7-0.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/onr-v1-effect-logic-priority.local.md`
- `docs/derived/DECK_LEGAL_AI_APPROVAL_BATCH_PLAN.md`

## 1) Ist-Stand nach V1.7.0

### 1.1 Abgeschlossene Grundlage

- `V1.7.0` ist final grün und setzt Unique-Constraint, Daemon-Hosting, Recurring-/Start-of-turn-Resolver und Stealth/Noisy-Wirkung als Kernsubset um.
- Sequenz `V1.6.1 -> V1.7.0` wurde bereits mehrfach als Kernrelease-Modell umgesetzt (geplanter Kartenkorb groß, freigabefähiger Kern klein, Rest deferred).
- Nächster Roadmap-Block ist verbindlich `V1.7.1 -> V1.7.2 -> V1.8.0 -> V1.8.1`.

### 1.2 Matrixbefund für die nächsten vier Releases

| Release | Geplanter Kartenkorb | Mit späterer Pflichtabhängigkeit | Karten mit offenem Mechanikhinweis (`geprüft`) | Kernkandidaten ohne spätere Pflichtabhängigkeit und ohne offenen Mechanikhinweis |
| --- | ---: | ---: | ---: | ---: |
| V1.7.1 | 48 | 10 | 2 | 37 |
| V1.7.2 | 28 | 2 | 2 | 25 |
| V1.8.0 | 13 | 7 | 0 | 6 |
| V1.8.1 | 15 | 2 | 1 | 12 |
| Summe | 104 | 21 | 5 | 80 |

Bewertung:

- Die Sequenz ist umsetzbar, aber nicht als „104 Karten in einem Durchlauf“.
- Umsetzbar ist sie als strikte Vierer-Gatefolge mit Preflight-Schnitt je Release (`freigabefähig`/`deferred`).

### 1.3 Kritische Querabhängigkeiten

1. `V1.7.1`: 10 Karten hängen zusätzlich an späteren Effekten (`V1.7.2`, `V1.8.0`, `V1.8.1`, `V1.9.0`).
2. `V1.7.2`: 2 Karten hängen zusätzlich an `V1.8.1`-Counterlogik.
3. `V1.8.0`: 7 von 13 Karten brauchen zusätzlich `V1.8.1`-Counterlogik.
4. `V1.8.1`: 2 Karten brauchen zusätzlich `V1.9.0` deterministischen Würfelzufall.
5. Offene Mechanikhinweise (`geprüft: konkrete Mechanik fehlt`) in dieser Viererlinie: `Data Naga`, `Dupré`, `Data Raven`, `TKO 2.0`, `Grubb`.

## 2) Abhängigkeits- und Reihenfolgelogik über alle vier Releases

### 2.1 Technische Abhängigkeiten

1. `V1.7.1` muss zuerst kommen, weil Search/Reveal/Run/Access die Basis für die nächsten Interaktionsfamilien liefert.
2. `V1.7.2` folgt darauf, da Trace/Tag/Resource-/ActionEconomy-Fenster neue Choice- und Kostenpfade auf dem bereits erweiterten Run-/Access-Unterbau stabilisieren.
3. `V1.8.0` folgt danach als Agenda-/Scored-Static-Schritt, weil Scoring-/Steal-Logik auf stabilen Access-/Trace-/Tag-Grundverträgen aufsetzt.
4. `V1.8.1` schließt Counter-/Virus-/Purge-Trigger und löst damit dokumentierte Blocker aus `V1.8.0` auf.

### 2.2 Fachliche Abhängigkeiten (Kartenhebel)

- `V1.7.1` ist mit 48 Karten der größte Hebel im Viererblock.
- `V1.7.2` konsolidiert häufige Trace-/Tag-/Resource-Interaktionen, die in vielen Deckmustern wiederkehren.
- `V1.8.0` ist klein (13), aber stark gekoppelt: mehr als die Hälfte benötigt zusätzlich Counter-Mechanik.
- `V1.8.1` ist der technische Schließer für Counter-/Virus-/Purge; ohne diesen Schritt bleibt `V1.8.0` absichtlich teildeferred.

### 2.3 Testseitige Abhängigkeiten

- Jede Stufe erweitert dieselben Pflichtgates: Unit, Szenario, Visibility, Replay/StateHash, KI-Smokes.
- Kein Release darf neue Testtypen als Ersatz einführen; es gilt Gate-Erweiterung auf bestehendem Qualitätsmodell.
- Release-Preflight bleibt verpflichtend, damit Karten mit späteren Pflichtmechaniken nicht implizit vorgezogen werden.

## 3) Detailplanung pro Release

## V1.7.1 - Mechanikpaket E

### Zielbild

Search/Reveal-/Hidden-Zone-Operationen, Access-/Breach-Erweiterungen und Run-Locks als breiten Hebel stabilisieren und einen kontrollierten Kern aus dem 48er-Korb freigeben.

### Scope

- `L2_Access_Breach_und_Multiaccess_Erweiterungen`
- `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`
- `L2_Run_Flow_Erweiterungen_und_RunLocks`

### Nicht-Scope

- Keine Trace-/Tag-/ActionEconomy-Breite aus `V1.7.2`
- Keine Agenda-/Scored-Static-Breite aus `V1.8.0`
- Keine Counter-/Virus-/Purge-Breite aus `V1.8.1`
- Kein deterministischer Würfelzufall aus `V1.9.0`

### Karten- und Abhängigkeitsbefund

- Kartenmenge: 48 (Runner 40, Corp 8)
- Haupteffekte im Korb:
  - Hidden-Zone Search/Reveal/Reorder/Shuffle: 32
  - Run-Flow-/RunLock-Erweiterungen: 20
  - Access/Breach/Multiaccess-Erweiterungen: 17
- Spätere Pflichtabhängigkeiten bei 10 Karten:
  - zu `V1.7.2` (Trace/Link): `Signpost`, `Stumble through Wilderspace`, `The Springboard`
  - zu `V1.8.0` (Agenda/Scored): `Artificial Security Directors`, `Genetics-Visionary Acquisition`
  - zu `V1.8.1` (Counter): `Dupré`, `I Spy`, `Deal with Militech`, `Hunt Club BBS`
  - zu `V1.9.0` (Würfel): `Hunter`
- Offene Mechanikhinweise: `Data Naga`, `Dupré`

### Umsetzbarkeitsentscheidung

- Umsetzbar als Release: ja.
- Umsetzbar als voller 48er-Unlock: nein.
- Erwarteter Kernkorridor: bis zu 37 Karten, Rest bewusst deferred.

### Teststrategie

- Unit: Search/Reorder/Shuffle-Verträge, Access-Reihenfolge, Run-Lock-Transitions.
- Szenario: mindestens ein kombinierter Search->Run->Access-Fall und ein Deadlock-Negativfall.
- Visibility: keine Leaks in PlayerView/PublicEvents/WebSocket/Reconnect/Undo/DecisionDebug.
- Replay/StateHash: deterministische Access-Reihenfolge und identische Run-Lock-Auflösung.
- KI-Smokes: Search-/Run-Planung nur aus erlaubter Projektion.

### Gate-Kriterien

- Hidden-Zone-Operationen und Access-Erweiterungen sind side-sicher und replaybar.
- Run-Locks erzeugen keine Illegal-Action- oder Deadlockpfade.
- Deferred-Liste ist vollständig dokumentiert.

### Hauptrisiken + Gegenmaßnahmen

- Risiko: Hidden-Zone-Search leakt verdeckte Reihenfolgeinformationen.
  - Gegenmaßnahme: eigener Visibility-/Reconnect-/Undo-Regressionblock.
- Risiko: Run-Locks erzeugen festhängende Zustände.
  - Gegenmaßnahme: verpflichtender Deadlock-Negativtest plus deterministische Exit-Regeln.
- Risiko: Mischkarten mit späteren Counter/Agenda/Würfel-Effekten werden versehentlich freigegeben.
  - Gegenmaßnahme: harter `freigabefähig_in_v171`-Filter im Preflight.

### Ready-for-Implementation-Checkliste V1.7.1

- [ ] V1.7.1-Requirements führen nur die drei Scope-Effektfamilien als Must.
- [ ] Alle 48 Karten sind in `freigabefähig` vs `deferred` geschnitten.
- [ ] Die 10 Folgehänger-Karten sind einzeln mit Zielrelease dokumentiert.
- [ ] `Data Naga` und `Dupré` sind vor Freeze als `ready` oder `deferred` entschieden.
- [ ] Testmatrix deckt Unit/Szenario/Visibility/Replay/KI getrennt ab.
- [ ] Releaseabschluss enthält den Pflichtschritt „Webclient-Versionsnummer auf V1.7.1 anheben“ inklusive Final-Review-Nachweis.

## V1.7.2 - Mechanikpaket F

### Zielbild

Trace/Tag/Resource-Interaktionen und Handsize-/ActionEconomy-Modifier konsolidieren, ohne Counterlogik aus V1.8.1 vorwegzunehmen.

### Scope

- `L2_Handsize_und_ActionEconomy_Modifier`
- `L2_Resource_Tag_Interactions`
- `L2_Tag_Bedingungen_Remove_Avoid`
- `L2_Trace_Link_Bidding_und_BaseLink_Windowing`

### Nicht-Scope

- Keine Counter-/Virus-/Purge-Breite aus `V1.8.1`
- Keine Agenda-/Scored-Static-Breite aus `V1.8.0`
- Kein Würfel-/Ambush-/Sonderresolver-Scope aus `V1.9.0`

### Karten- und Abhängigkeitsbefund

- Kartenmenge: 28 (Corp 15, Runner 13)
- Haupteffekte im Korb:
  - Trace/Link/Bidding/BaseLink: 13
  - Resource-Tag-Interaktionen: 9
  - Tag-Bedingungen/Remove/Avoid: 8
  - Handsize/ActionEconomy: 1
- Spätere Pflichtabhängigkeit bei 2 Karten: `Data Raven`, `Pocket Virtual Reality` (Counter zu `V1.8.1`)
- Offene Mechanikhinweise: `Data Raven`, `TKO 2.0`

### Umsetzbarkeitsentscheidung

- Umsetzbar als Release: ja.
- Umsetzbar als voller 28er-Unlock: nein.
- Erwarteter Kernkorridor: bis zu 25 Karten, Rest deferred.

### Teststrategie

- Unit: Trace-Fenster, Bidding-Reihenfolge, Tag-Remove/Avoid, ActionEconomy-Modifier.
- Szenario: mindestens ein Tag-Punish- und ein Tag-Remove-Pfad mit Negativfall.
- Visibility: keine Leaks bei Trace-Choices, Tag-Zustand und Resource-Trash-Pfaden.
- Replay/StateHash: deterministische Bid- und Tag-Folge.
- KI-Smokes: Trace-/Tag-Entscheidung je Difficulty nachvollziehbar, LegalAction-only.

### Gate-Kriterien

- Trace/Tag/Resource-Fenster sind in Multiplayer, Undo und Replay stabil.
- Action-/Handsize-Modifier greifen deterministisch und ohne Kostenartefakte.
- Counter-gekoppelte Karten sind sauber deferred.

### Hauptrisiken + Gegenmaßnahmen

- Risiko: Trace-/Tag-Fenster brechen Undo-Barrieren oder verursachen stale-Pfade.
  - Gegenmaßnahme: dedizierte Undo-/stale-action-Regressionssuite.
- Risiko: Counter-Abhängigkeiten werden mitimplementiert.
  - Gegenmaßnahme: explizite No-Scope-Checks auf `L2_Counter_System_und_Virus_Purge_Trigger`.
- Risiko: `TKO 2.0` bleibt mechanisch unterdefiniert.
  - Gegenmaßnahme: vor Freeze resolvernahe Entscheidungsnotiz `ready` oder `deferred`.

### Ready-for-Implementation-Checkliste V1.7.2

- [ ] V1.7.2-Requirements grenzen Counter strikt aus.
- [ ] 28er-Korb ist in `freigabefähig`/`deferred` geschnitten.
- [ ] `Data Raven` und `Pocket Virtual Reality` sind als Counter-abhängig deferred oder mit Scope-Alternative begründet.
- [ ] `TKO 2.0` hat vor Freeze eine klare Implementierbarkeitsentscheidung.
- [ ] Trace-/Tag-/Resource- und Handsize-/ActionEconomy-Gates sind einzeln testbar spezifiziert.
- [ ] Releaseabschluss enthält den Pflichtschritt „Webclient-Versionsnummer auf V1.7.2 anheben“ inklusive Final-Review-Nachweis.

## V1.8.0 - Mechanikpaket G

### Zielbild

Agenda-Difficulty und Scored-Agenda-Statics als eigener kleiner, klarer Gate-Release, ohne Counter-Scope vorwegzunehmen.

### Scope

- `L2_Agenda_Difficulty_und_Overadvance_Details`
- `L3_Scored_Agenda_Active_Static_Overadvance`

### Nicht-Scope

- Keine Counter-/Virus-/Purge-Mechanik aus `V1.8.1`
- Kein Ambush-/Würfel-/Rest-Sonderresolver-Scope aus `V1.9.0`

### Karten- und Abhängigkeitsbefund

- Kartenmenge: 13 (Corp 8, Runner 5)
- Haupteffekte im Korb:
  - Agenda-Difficulty/Overadvance: 13
  - Scored-Agenda-Active-Static: 13
- 7 Karten haben zusätzliche Counter-Abhängigkeit zu `V1.8.1`:
  - `Fait Accompli`
  - `Falsified-Transactions Expert`
  - `Management Shake-Up`
  - `Project Consultants`
  - `Silver lining Recovery Protocol`
  - `Systematic Layoffs`
  - `Team Restructuring`

### Umsetzbarkeitsentscheidung

- Umsetzbar als Release: ja.
- Umsetzbar als voller 13er-Unlock: nein.
- Erwarteter Kernkorridor: bis zu 6 Karten, Rest gezielt nach `V1.8.1` verschieben.

### Teststrategie

- Unit: Agenda-Difficulty, Overadvance-Zählung, aktive/statische Score-Effekte.
- Szenario: Scoring- und Steal-Fälle mit variabler Difficulty und Overadvance.
- Visibility: keine Leaks aus gescorten Agenda-Statikpfaden.
- Replay/StateHash: deterministische Scoring-/Steal-Auflösung.
- KI-Smokes: Scoringplan nutzt nur freigegebene Agendaresolver.

### Gate-Kriterien

- Siegbedingungen bleiben trotz Agenda-Statik unverändert korrekt.
- Overadvance-/Scored-Agenda-Fälle sind replaybar und side-sicher.
- Counter-gekoppelte Karten sind bewusst deferred dokumentiert.

### Hauptrisiken + Gegenmaßnahmen

- Risiko: starke Kopplung an Countermechanik verwässert den Release-Scope.
  - Gegenmaßnahme: harter 6er-Kernkorb ohne Counter-Abhängigkeit.
- Risiko: falsche Interaktion mit bestehenden Scoringfenstern.
  - Gegenmaßnahme: explizite Regression gegen bestehende Agenda-Siegpfade.

### Ready-for-Implementation-Checkliste V1.8.0

- [ ] V1.8.0-Requirements führen nur Agenda-/Scored-Static-Familien als Must.
- [ ] 13er-Korb ist mit klarer 6/7-Schnittentscheidung dokumentiert.
- [ ] Alle 7 Counter-abhängigen Karten sind mit Verweis auf V1.8.1 deferred.
- [ ] Testmatrix enthält explizite Scoring-/Steal-/Overadvance-Regressionen.
- [ ] Releaseabschluss enthält den Pflichtschritt „Webclient-Versionsnummer auf V1.8.0 anheben“ inklusive Final-Review-Nachweis.

## V1.8.1 - Mechanikpaket H

### Zielbild

Counter-System und Virus-/Purge-Trigger als Schließer für die bisher deferred Counter-gebundenen Karten.

### Scope

- `L2_Counter_System_und_Virus_Purge_Trigger`

### Nicht-Scope

- Kein deterministischer Würfelzufall aus `V1.9.0`
- Kein Ambush-/Rest-Sonderresolver-Scope aus `V1.9.0`

### Karten- und Abhängigkeitsbefund

- Kartenmenge: 15 (Runner 8, Corp 7)
- Haupteffekt: Counter/Virus/Purge bei allen 15 Karten
- 2 Karten haben zusätzliche Würfelabhängigkeit zu `V1.9.0`: `Cockroach`, `Incubator`
- Offener Mechanikhinweis: `Grubb`

### Umsetzbarkeitsentscheidung

- Umsetzbar als Release: ja.
- Umsetzbar als voller 15er-Unlock: nein.
- Erwarteter Kernkorridor: bis zu 12 Karten, Rest nach V1.9.0 deferred.

### Teststrategie

- Unit: Counter-Inkrement/Verbrauch, Purge-Reihenfolge, Trigger-Determinismus.
- Szenario: Virus-Aufbau vs Purge, Mehrtrigger-Reihenfolge und Grenzfälle.
- Visibility: keine verdeckten Counterzustände in fremder Perspektive.
- Replay/StateHash: stabile Triggerreihenfolge und Purge-Folgen.
- KI-Smokes: Purge-/Counter-Entscheidungen nur aus sichtbarem Zustand.

### Gate-Kriterien

- Counter-/Purge-Ketten sind deterministisch, side-sicher und replaybar.
- `V1.8.0`-deferred Counterkarten können gezielt nachgezogen werden.
- Würfelabhängige Karten bleiben bis `V1.9.0` deferred.

### Hauptrisiken + Gegenmaßnahmen

- Risiko: Triggerreihenfolge driftet zwischen Runtime, Replay und KI-Smokes.
  - Gegenmaßnahme: feste Priorisierung + statehash-gespiegelte Triggerprotokolle.
- Risiko: `Grubb` bleibt mechanisch unklar.
  - Gegenmaßnahme: vor Freeze `ready`/`deferred`-Entscheidung mit Resolverbegründung.

### Ready-for-Implementation-Checkliste V1.8.1

- [ ] V1.8.1-Requirements halten Würfelmechanik strikt out-of-scope.
- [ ] 15er-Korb ist in `freigabefähig`/`deferred` geschnitten.
- [ ] `Cockroach` und `Incubator` sind bis V1.9.0 deferred.
- [ ] `Grubb` ist vor Freeze als `ready` oder `deferred` dokumentiert.
- [ ] Trigger-Reihenfolge, Replay und Visibility haben eigene Pflichtgates.
- [ ] Releaseabschluss enthält den Pflichtschritt „Webclient-Versionsnummer auf V1.8.1 anheben“ inklusive Final-Review-Nachweis.

## 4) Abhängigkeitsmatrix (Mechanik -> Zielrelease -> Vorbedingungen -> Risiko -> Pflichttests)

| Mechanikbaustein | Zielrelease | Vorbedingungen | Hauptrisiko | Pflichttests |
| --- | --- | --- | --- | --- |
| L2_Access_Breach_und_Multiaccess_Erweiterungen | V1.7.1 | V0.97-Basis + V1.7.0-Kern stabil | Access-Reihenfolge driftet | Access-Queue-Unit + Replay/StateHash-Szenario |
| L2_HiddenZone_Search_Reveal_Reorder_Shuffle | V1.7.1 | V0.98-Hidden-Zone-Foundation | Hidden-Info-Leak | Visibility-/Reconnect-/Undo-Regression |
| L2_Run_Flow_Erweiterungen_und_RunLocks | V1.7.1 | Run-Lifecycle + Choice-Framework | Deadlocks/illegale Aktionen | Run-Lock-Negativtests + Determinismus |
| L2_Trace_Link_Bidding_und_BaseLink_Windowing | V1.7.2 | V0.96-Basis + V1.7.1-Stabilität | Bid-/Choice-Reihenfolge unstabil | Trace-Window-Unit + Replay |
| L2_Tag_Bedingungen_Remove_Avoid | V1.7.2 | V0.95/0.96-Tag-Basis | Undo-/Visibility-Bruch bei Tag-Änderung | Tag-Transitions + Visibility |
| L2_Resource_Tag_Interactions | V1.7.2 | Resource-/Tag-Basis + Trace-Fenster | illegale Tag-Punish-Pfade | LegalAction-Negativtests + Szenario |
| L2_Handsize_und_ActionEconomy_Modifier | V1.7.2 | Discard/Handlimit-Basis V1.1.1 | Kosten-/Klickdrift | Turn-Boundary- und Cost-Recompute-Tests |
| L2_Agenda_Difficulty_und_Overadvance_Details | V1.8.0 | Setup/Game-End/Score-Basis | Siegbedingungsdrift | Scoring-/Steal-/Overadvance-Szenarien |
| L3_Scored_Agenda_Active_Static_Overadvance | V1.8.0 | Agenda-Difficulty-Baustein | nichtdeterministische Statikfolgen | StateHash-Regression + Visibility |
| L2_Counter_System_und_Virus_Purge_Trigger | V1.8.1 | V0.99-Counterbasis + V1.8.0-Agenda-Stabilität | Triggerketten unstabil | Triggerreihenfolge-Unit + Purge-Szenarien |

## 5) Konsistenzprüfung gegen Doppelplanung und Scope-Drift

Durchgängige Regeln:

1. Ein Effektbaustein hat genau ein erstes Zielrelease.
2. Karten mit blockierenden Folgeeffekten werden nicht implizit vorgezogen.
3. `V1.7.1` bis `V1.8.1` enthalten keine `V1.9.0`-Implementierung als Muss.
4. KI-Freigaben bleiben kartenweise und getrennt vom Human-Playable-Unlock.
5. V2.x bleibt gesperrt bis nach grünem `V1.9.0`-Gate.

Pflicht-Preflight je Release:

- `release_assignment_validation`: jede Karte im Korb ist `freigabefähig` oder `deferred`.
- `effect_mapping_sanity`: jede Scope-Effektfamilie ist real zugeordnet.
- `open_mechanic_resolution`: `geprüft`-Karten sind vor Freeze entschieden.

## 6) Umsetzungsreihenfolge mit Meilensteinen

1. M0 - Globaler Vierer-Preflight
   - Matrix-/Status-Sync, Kartenkorbzahlen bestätigen, offene Mechanikhinweise vorbereiten.
2. M1 - V1.7.1 Requirements Freeze
   - Search/Run/Access-Scope fixieren, 48er-Korb schneiden.
3. M2 - V1.7.1 Umsetzung + Final Gate
   - Hidden-Zone-/Run-Lock-/Access-Kern grün.
4. M3 - V1.7.2 Requirements Freeze
   - Trace/Tag/Resource-/ActionEconomy-Scope fixieren, 28er-Korb schneiden.
5. M4 - V1.7.2 Umsetzung + Final Gate
   - Trace-/Tag-Fenster deterministisch und side-sicher grün.
6. M5 - V1.8.0 Requirements Freeze
   - Agenda-/Scored-Static-Scope fixieren, 13er-Korb inkl. Counter-Deferred schneiden.
7. M6 - V1.8.0 Umsetzung + Final Gate
   - Agenda-Difficulty/Overadvance-Kern stabil grün.
8. M7 - V1.8.1 Requirements Freeze
   - Counter-/Virus-/Purge-Scope fixieren, 15er-Korb inkl. Würfel-Deferred schneiden.
9. M8 - V1.8.1 Umsetzung + Final Gate
   - Counter-Trigger-Schließer grün, V1.9.0-Rest sauber getrennt.

## 7) Warum diese Reihenfolge umsetzbar ist

- Sie folgt exakt der verbindlichen Roadmap und hält V2.x gesperrt.
- Sie reduziert technisches Risiko durch klare Mechanikpakete statt Mischreleases.
- Sie macht Abhängigkeiten transparent: 24 von 104 Karten brauchen Deferred- oder Klarstellungsentscheidungen.
- Sie bleibt konsistent mit der bereits erfolgreichen Kernrelease-Strategie aus V1.6.1 bis V1.7.0.

## 8) Gesamt-Ready-for-Implementation (Viererblock)

- [ ] Für alle vier Releases liegen je Requirements, Spec, Testmatrix und Requirements-Review vor.
- [ ] Jeder Kartenkorb (`48/28/13/15`) ist in `freigabefähig` vs `deferred` geschnitten.
- [ ] Alle `geprüft`-Karten (`Data Naga`, `Dupré`, `Data Raven`, `TKO 2.0`, `Grubb`) sind vor Freeze entschieden.
- [ ] Alle Folgehänger (`V1.7.2`-, `V1.8.0`-, `V1.8.1`-, `V1.9.0`-Links) sind je Karte dokumentiert.
- [ ] Unit/Szenario/Visibility/Replay-StateHash/KI-Smoke-Gates sind je Release explizit und getrennt.
- [ ] Deck-Legal-AI-Approval Batch B-G bleibt als separater Gate-Track dokumentiert.
- [ ] Je Release ist der Abschluss-Schritt „Webclient-Versionsnummer anheben + Final-Review-Nachweis“ verpflichtend eingeplant.

# V1.9.9 Detailed Plan – Upgrade-Mechanik-Sprint 349–353

## 1) Zielbild für den 1.9.9-Sprint

1. Der Sprint macht die noch nicht spielbaren Upgrades `onr_v1_349_aardvark`, `onr_v1_351_bizarre-encryption-scheme`, `onr_v1_352_chester-mix` und `onr_v1_353_chimera` für Menschen und KI spielbar.
2. Die vier Karten dürfen weder als reine Datenkorrektur noch als temporärer Stub abgearbeitet werden; jede Karte braucht einen lauffähigen Resolverpfad mit LegalAction/PlayerAction-Validierung und KI-Entscheidungsmodell, wo nötig.
3. Der Sprint liefert eine belastbare Freigabebasis für den Start von 1.9.10/Next-Release ohne Scope-Ausdehnung.

## 2) Scope für 1.9.9

1. In-Scope
1. Engine-Hooks, die die vier Kartenmechaniken sauber tragen: Run-Wurm-Interception, Agenda-Delay auf Access, Server-Installkosten-Reduktion, Daemon-Trash auf Zugriff.
2. In-Scope
1. Resolver-Spezifikationen und Implementierungstemplates pro Karte inkl. Edge-Cases.
3. In-Scope
1. KI-Entscheidungslogik für die neuen Entscheidungspfade.
4. In-Scope
1. Manifest- und Katalog-Statusanpassungen inkl. `implemented`, `playable`, `deck_legal`, `resolverFamily`.
2. Out-of-Scope
1. Weitere Kartenmechaniken außerhalb dieser vier Upgrade-IDs.
2. Neue Engine-Architektur, neue RNG-Schicht oder Full-State-KI.
3. Produktfeatures außerhalb des 1.9.x-Laufwerks.

## 3) Pflicht-Regeln vor Projektstart

1. Scope Freeze liegt vor und gilt im Sprint: Keine zusätzliche Karte wird ohne explizite neue Scope-Entscheidung freigegeben.
2. Karten werden erst umgesetzt, wenn ihre Regeltexte in einer Regelinterpretation eindeutig auf einen auslösbaren Trigger verdichtet sind.
3. Für jede Karte wird mindestens ein deterministischer Human-Fall, ein Edge-Fall und ein KI-Fall in `docs/derived/V1_9_9_TEST_MATRIX.md` vorgesehen.
4. Kein 1.9.9-Artefakt darf auf nicht vorhandene oder nicht deterministische Triggerpfade verweisen.
5. `V1_9_9` kann nur finalisiert werden, wenn die Webclient-Version sichtbar aktualisiert ist und die Release-Abschlussdoku erstellt ist.

## 4) Kartenfokus mit Regelinterpretation

### 4.1 `onr_v1_349_aardvark`

1. Effekttext: „Runner cannot use worms during runs on this fort. If Runner uses a worm during a run on this fort before Aardvark is rezzed, you may rez Aardvark to trash that worm, and any bits spent using that worm on the current piece of ice are lost to no effect. Runner may then use further icebreakers to break the ice.“
2. Triggerzeitpunkt:
1. Auf dem aktiven Runserver.
2. Beim Einsatz eines Worms auf einem ICE in diesem Runsegment vor erfolgreichem vollständigen Break.
3. Entscheidungspunkt: Corp kann Aardvark rezzzen.
4. Ergebnis:
1. Der genutzte Worm wird getrashi’d.
2. Für den aktuellen ICE-Interaktionsabschnitt gelten die geworfenen Bits als verloren.
3. Der Run geht mit anderem Icebreaker weiter.
5. Interaktion: optionaler Corp-Trigger, nur bei aktiver Aardvark-Aufsicht.

### 4.2 `onr_v1_351_bizarre-encryption-scheme`

1. Effekttext: „Runner does not score any agenda or agendas on a run during which Bizarre Encryption Scheme is accessed; return that agenda to the fort instead. Runner scores the agenda at the start of his or her next turn, if neither you nor Runner has scored it by then. This does not affect any further runs.“
2. Triggerzeitpunkt:
1. Access auf eine Agenda auf dem betroffenen Server.
2. Intercept vor sofortigem Agenda-Scoring.
3. Agenda wird zurück auf den Server gelegt.
4. Verzögerte Scoring-Prüfung zu Beginn des nächsten Corp-Turns.
5. Guard: Agenda darf nicht noch einmal in diesem Zug unzulässig gescored werden.

### 4.3 `onr_v1_352_chester-mix`

1. Effekttext: „Cost to install ice on this fort is reduced by 1.“
2. Triggerzeitpunkt:
1. Installieren auf Serverebene.
2. nur für ICE-Installationsaktionen.
3. Ergebnis:
1. Kostenreduktion um 1 (unter Berücksichtigung globaler Cost-Minimum- oder Stackingregeln).

### 4.4 `onr_v1_353_chimera`

1. Effekttext: „When Runner accesses Chimera, trash a daemon.“
2. Triggerzeitpunkt:
1. Access auf Chimera.
2. Ergebnis:
1. genau ein installiertes Daemon-Programm wird auf Runnerseite getrashi’d.
2. bei keinem installierten Daemon: sauberer No-Op.

## 5) Gemeinsame Resolver-Templates

1. Event-Hooks:
1. `run_server_worm_attempt`
2. `server_access_agenda`
3. `server_install_ice`
4. `card_accessed`
2. Resolution-Contract:
1. Trigger -> Resolve -> Optional Decision (wo nötig) -> Result.
2. Alle Resolver müssen Revert-/Undo-Fähigkeit in der aktuellen Enginelogik respektieren.
3. Bei jedem Resolverpfad `stateVersion` und `actionId` stabil halten.

3. Sichtbarkeit:
1. Keine verdeckte Gegnerinformation in Human-UI, PlayerViews, PublicEvents, Reconnect, UndoPreview, Replay.
2. Nur legal abgeleitete Facts oder deterministische Delayed-Marker dürfen in KI-Eingaben erscheinen.

## 6) KI-Pfad für 1.9.9

1. Gemeinsamer AI-Plan:
1. Aardvark: Decision Node `rez_aardvark_after_worm_used` mit Kosten-, Tempo- und Sicherheitssignal.
2. Chimera: Choice Node `choose_daemon_to_trash` mit Priorisierung vorhandener Daemon-Kandidaten.
3. BES, Chester Mix: keine zusätzliche Corp-Choice, aber Score-Impact in Decision-Input aufnehmen.
4. BES-Guard: Markierung des verzögerten Scorings im State-View als deterministisch gültiger Zustand.
2. KI-Output-Kritierien:
1. Keine Entscheidungen ohne Zielzustand.
2. Bei mehreren Kandidaten deterministische Reihenfolge nach festen Regeln (z. B. Priorität, Kosten, Schutzwirkung).
3. Keine inferierten Hidden Facts über nicht sichtbare Karten.

## 7) Daten- und Auslieferungspflicht

1. Für die vier Karten müssen folgende Artefakte vor dem Implementation-Start feststehen:
1. `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
2. `data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json`
3. `data/manifests/card-implementation-manifest-1.9.9.json` (neues Releasemanifest)
4. `data/rules/mechanics-coverage-1.9.9.json` (oder passendes Coverage-Zielobjekt)
5. `data/scenarios/v199-card-release-smoke.json` (oder nächstpassender Szenariopfad)

2. `resolverFamily` pro Karte muss im selben Durchlauf festgelegt werden:
1. `server_icebreaker_worm_use_then_breach_failover` für Aardvark.
2. `corp_access_delay_and_return_to_server_then_start_turn_score` für BES.
3. `ice_install_cost_mod_server` für Chester Mix.
4. `accessed_card_ambush_daemon_trash` für Chimera.

3. Kein Artefakt darf „temporary planned“ bleiben. Jede Pflichtdatei braucht finalen Reviewpunkt.

## 8) Risiko- und Gegenmaßnahmenregister

1. Risiko: Resolver-Crossfire mit existierenden Run/Access-Ereignissen.
2. Gegenmaßnahme: Preflight-Event-Ordnungsdiagramm und Sequenztests mit `run -> encounter -> access -> score` Reihenfolge.
3. Risiko: Aardvark triggert mehrfach im selben Run und zerstört den aktuellen ICE-Fortschritt.
4. Gegenmaßnahme: Markierung „einmalig je Run-Segment“ im Resolver.
5. Risiko: BES-Delay wird durch andere Score-Pfade doppelt ausgelöst.
6. Gegenmaßnahme: eindeutiger BES-Delay-Flag und Guard „if not already scored by either side“.
7. Risiko: Daemon-Auswahl nicht deterministisch.
8. Gegenmaßnahme: feste Determinismussortierung und explicit seedbasierte Tie-Break-Logik.
9. Risiko: Chester-Mix wird außerhalb Serverkontext angewandt.
10. Gegenmaßnahme: klarer Scopefilter `installed_to_server && card_type == ICE && fort_is_chester_server`.

## 9) Rollback- und Übergabepfade

1. Bei Regression vor Sprintabschluss wird 1.9.9 zurück auf 1.9.8-Stand gesetzt.
2. Bereits laufende Tests werden weitergeführt; fehlerhafte Tickets werden mit `deferred` markiert.
3. Konflikte über Entscheidungspfade werden im Risiko-Register ergänzt statt als stille Hotfixes in Resolvern.
4. Sprint bleibt blockiert, bis die vier Karten konsistent als `playable` und `deck_legal` stehen.

## 10) Auslieferungsreihenfolge

1. `V1_9_9_PRE_FLIGHT_CHECKLIST` – Scope, Hooks, Rule-Freeze.
2. `V1_9_9_RESOLVER_SPEC` – Aardvark, BES, Chester Mix, Chimera.
3. `V1_9_9_AI_PLAN` – Entscheidungspfade mit Determinismuskriterien.
4. Implementierung der vier Resolver.
5. `V1_9_9_TEST_MATRIX` – Human + KI Edge Cases.
6. Datensätze finalisieren und Webclient-Version auf `V1.9.9`.
7. Requirements Review + Final Preparation Review.

## 11) Go/No-Go

1. Go, wenn alle vier Karten nach Implementierung die Statuswerte `implemented`, `playable`, `deck_legal` tragen.
2. Go, wenn `offene_familien=0` für den 1.9.9-Kernbereich und kein `not_implemented_catalog_only` in den vier Zielkarten mehr existiert.
3. Go, wenn Sichtbarkeits-/Replay-/StateHash-Locks keine neuen Leaks für diese Resolver zeigen.

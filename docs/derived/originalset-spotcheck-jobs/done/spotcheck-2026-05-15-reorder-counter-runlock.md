---
startedAt: 2026-05-15T18:46:59.1203208+02:00
jobId: spotcheck-2026-05-15-reorder-counter-runlock
status: done
createdAt: 2026-05-15T11:15:00+01:00
completedAt: 2026-05-15T18:55:29+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_272_too-many-doors
    title: Too Many Doors
  - cardId: onr_v1_312_chicago-branch
    title: Chicago Branch
  - cardId: onr_v1_242_fatal-attractor
    title: Fatal Attractor
  - cardId: onr_v1_032_i-spy
    title: I Spy
  - cardId: onr_v1_268_shock-r
    title: Shock.r
  - cardId: onr_v1_233_d-arc-knight
    title: D'Arc Knight
  - cardId: onr_v1_195_corporate-retreat
    title: Corporate Retreat
  - cardId: onr_v1_254_liche
    title: Liche
  - cardId: onr_v1_262_razor-wire
    title: Razor Wire
  - cardId: onr_v1_347_vapor-ops
    title: Vapor Ops
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-reorder-counter-runlock

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Lock-/Kontextprüfung: Workspace `C:\Projekte\NETGRID`, Branch `main`, Remote `origin`. Der vorhandene Generator-Lock war `released`; dieser Lauf setzte einen neuen aktiven Generator-Lock. Keine Konfliktmarker in den relevanten Queue-/Registerpfaden gefunden.
- Deduplizierung: 150 eindeutige Card IDs aus Registerdateien und vorhandenen Queue-Berichten wurden tabu gesetzt. Die zehn ausgewählten Card IDs kamen in keiner der gelesenen Deduplizierungsquellen vor.
- Auswahlbegründung: Aus 211 nicht tabu gesetzten decklegalen und AI-supported Originalset-Karten blieb ein komplex gewichteter Pool von 74 Karten mit Engine-/Chronik-/Timing-/Choice-/Hidden-Info-/Replay-Relevanz. Die finale Zehnergruppe wurde zufällig aus diesem Pool gezogen und wegen R&D-Reorder, Counter-/Agenda-Schnittstellen, Run-Lock-Folgezuständen, Program-Trash, Damage/Flatline, Score-Aktion und PublicPayload-Härtung beibehalten.
- Geprüfte Fachartefakte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `data/manifests/card-implementation-manifest-1.1.2k.json`, `data/manifests/card-implementation-manifest-1.6.1.json`, `data/manifests/card-implementation-manifest-1.6.3.json`, `data/manifests/card-implementation-manifest-1.8.1.json`, `data/manifests/card-implementation-manifest-1.9.11.json`, `data/manifests/card-implementation-manifest-1.9.12.json`, `data/manifests/card-implementation-manifest-1.9.19.json`, `data/manifests/card-implementation-manifest-1.9.22.json`, passende `deck-legal-ai-approval-*.json`, `ai-card-hints-deck-legal-*.json` und Release-Smokes.

## Kartenbefunde

### onr_v1_272_too-many-doors - Too Many Doors

Bewertung:
- Engine: Die ICE-Subroutine öffnet eine Korp-private `select_cards`-Choice für die oberen zwei R&D-Karten. `resolveCorpRdArrangeChoice` revalidiert Choice-Quelle, ICE-Definition, aktuellen Encounter, Auswahlmenge und Kartenmenge.
- Chronik: `hiddenZoneBarrier`, `hiddenZoneAction: "v1911_corp_reorder_rd_top2"` und `arrangedCount` sind gesetzt. Card IDs und Titel der R&D-Karten dürfen nur in der Korp-Choice erscheinen, nicht in PublicPayload, Runner-View oder KI-Input.
- Tests: Ein V1.9.11-Test deckt privaten R&D-Reorder und Replay-Stabilität ab. Es fehlen enger gefasste Manipulationsfälle für falsche Choice-Seite, doppelte Auswahl, fremde Karten-ID, veränderten Encounter und R&D mit weniger als zwei Karten.
- Hidden-Info/Replay/StateHash: Höchstes Risiko ist, dass Choice-Optionen oder Reorder-Details in PublicEvents, Runner-Reconnect, Undo-Preview oder AI-Input geraten. Replay muss die private Reihenfolge deterministisch wiederherstellen, ohne sie öffentlich zu serialisieren.
- Fehlende Härtungen: Choice-Payload-Leakscan, invalid-choice Revalidation, kurze R&D, gebrochene Subroutine und Encounter-Drift.

Notwendige Umsetzung:
- [ ] Test ergänzen: Subroutine gebrochen -> keine PendingChoice, keine R&D-Reorder-Payload, keine R&D-Mutation.
- [ ] Test ergänzen: R&D mit 0/1 Karte -> keine legale Reorder-Auflösung oder definierter No-op ohne Hidden-Info-Leak.
- [ ] Manipulierte Choice mit Runner-Seite, doppelter Karte, fremder R&D-Karte und falschem `choiceId` muss in `applyAction` scheitern.
- [ ] Encounter-Drift testen: Choice wird geöffnet, Encounter/Run wird verändert oder beendet, anschließende Choice-Auflösung muss scheitern.
- [ ] PublicEvent-, PlayerView-, Reconnect-, Undo- und AI-Input-Leakscan gegen die beiden privaten R&D-Definitionen ergänzen.

Akzeptanzkriterien:
- [ ] Nur die Korp sieht und ordnet die oberen zwei R&D-Karten.
- [ ] Runner, PublicEvents, Reconnect, Undo-Preview und KI-Input enthalten keine R&D-Definitionen aus der Choice.
- [ ] Falsche Seite, stale State, falsche Choice und Encounter-Drift mutieren keinen State.
- [ ] Replay endet mit identischem StateHash und deterministischer R&D-Reihenfolge.

### onr_v1_312_chicago-branch - Chicago Branch

Bewertung:
- Engine: Die Karte läuft über generische Asset-/Node-Fähigkeiten plus Counter-/Agenda-Difficulty-Schnitt. Laut Manifest ist sie rezzed, counterfähig, overadvance-relevant und AI-supported.
- Chronik: Counter-Zustand ist öffentlicher Board-State, aber die Chronik muss klar trennen zwischen Counter-Aufladung, Ausgabe und Agenda-Difficulty-Wirkung. Quelle, Counterart und verbleibende Counter müssen payloadfähig sein.
- Tests: V1.9.19-Smokes decken Chicago Branch im Asset-/Agenda-Support-Cluster ab. Es fehlen kartenkonkrete Tests für unrezzed/trashed Quelle, Counter-Divergenz, manipulierte Counterbeträge, mehrfaches Aktivieren und Runner-Trash-Cleanup.
- Hidden-Info/Replay/StateHash: Rezzed Asset und Counter sind öffentlich. Risiko liegt in falscher Sourcebindung, hidden Remote-Root-Leaks vor Rez und Counter-Mutation außerhalb legaler Korp-Aktionen.
- Fehlende Härtungen: Rezzed-only-Guard, Counter-Revalidation, Cleanup nach Trash, PublicPayload-Attribution und Replay.

Notwendige Umsetzung:
- [ ] Korp-LegalAction nur für rezzed installierte Chicago Branch erzeugen; unrezzed, getrashte und remote-fremde Instanzen testen.
- [ ] `applyAction` mit manipuliertem `cardId`, Counterbetrag und Ability-Typ gegen gespeicherte LegalAction abweisen.
- [ ] Counter-Aufladung und Counter-Ausgabe getrennt testen, inklusive verbleibendem Counterstand.
- [ ] Runner-Trash-Cleanup testen: Nach Trash keine Chicago-Branch-Aktion, kein Agenda-Difficulty-/Counter-Effekt.
- [ ] PublicPayload/Chronik mit `sourceDefinitionId`, `spentCounters`, `remainingCounters` und Replay/StateHash prüfen.

Akzeptanzkriterien:
- [ ] Chicago Branch erzeugt nur als rezzed installierte Quelle legale Korp-Aktionen.
- [ ] Counterbeträge und Ability-Typ werden in `applyAction` erneut validiert.
- [ ] Unrezzed/trashed Quellen und manipulierte Card IDs scheitern ohne State-Mutation.
- [ ] PublicPayload ist source-bound und replay-/StateHash-stabil.

### onr_v1_242_fatal-attractor - Fatal Attractor

Bewertung:
- Engine: Die Subroutine setzt einen Next-Encounter-Zustand. Beim nächsten ICE während desselben Runs verursacht die Engine 3 Net Damage, wenn nicht alle Subroutinen des nächsten ICE gebrochen wurden.
- Chronik: Der eigentliche Damage passiert nicht beim Fatal-Attractor-Encounter, sondern beim Folge-Encounter. Chronik und Payload müssen Ursache, Folge-ICE und Schaden eindeutig verbinden, ohne verdeckte ICE-Informationen vorzeitig offenzulegen.
- Tests: Ein V1.8.1-Test deckt den positiven Run-Modifier-Pfad ab. Es fehlen Edge Cases für Run-Ende vor nächstem Encounter, gebrochene Fatal-Attractor-Subroutine, vollständig gebrochenes Folge-ICE, mehrere gesetzte Next-Encounter-Effekte und Damage-Prevention.
- Hidden-Info/Replay/StateHash: Das Folge-ICE darf erst nach normalem Rez-/Encounter-Prozess öffentlich werden. Damage-Zufall beim Grip-Trash muss deterministisch über bestehende Damage-/RandomDrawRecords laufen.
- Fehlende Härtungen: Lifetime des Next-Encounter-Flags, Vollbruch-Bedingung, Prevention-Fenster, Doppeltrigger-Vermeidung und Replay.

Notwendige Umsetzung:
- [ ] Test ergänzen: Fatal-Attractor-Subroutine gebrochen -> kein Next-Encounter-Flag, kein späterer Damage.
- [ ] Test ergänzen: Run endet vor weiterem ICE -> Flag wird bereinigt und triggert nicht in späterem Run.
- [ ] Folge-ICE vollständig gebrochen -> kein Damage; teilweise oder gar nicht gebrochen -> exakt 3 Net Damage.
- [ ] Mehrere Next-Encounter-Modifier im Run testen oder explizit Stack-/Overwrite-Vertrag sichern.
- [ ] Chronikpayload mit Quelle `onr_v1_242_fatal-attractor`, Folge-ICE nur wenn öffentlich, DamageSummary und Replay/StateHash prüfen.

Akzeptanzkriterien:
- [ ] Der Effekt gilt nur für den nächsten ICE-Encounter im selben Run.
- [ ] Vollständig gebrochenes Folge-ICE verhindert den Fatal-Attractor-Damage.
- [ ] Kein verdecktes ICE oder Grip-Detail wird vorzeitig öffentlich.
- [ ] Damage, Prevention und Replay sind statehash-stabil.

### onr_v1_032_i-spy - I Spy

Bewertung:
- Engine: Die Karte ist ein Runner-Programm mit Hidden-Zone-Tool; laut Manifest installiert sie normal und nutzt einen side-sicheren Reveal-Pfad für die oberste Stack-Karte.
- Chronik: Der Reveal ist absichtlich öffentlich, aber nur für genau die Stackspitze. Die Chronik muss darunterliegende Stackkarten, Stacklänge jenseits erlaubter Counts und zukünftige Reihenfolge privat halten.
- Tests: V1.9.12-Smokes nennen I Spy im Hidden-Zone-/Counter-Cluster. Es fehlen kartenkonkrete Tests für leeren Stack, installierte Quelle erforderlich, falsche Seite, stale State und wiederholte Aktivierung.
- Hidden-Info/Replay/StateHash: Die oberste Stackkarte kann öffentlich revealed werden; alle weiteren Stackkarten bleiben hidden. Da der Reveal keine Zone verschiebt, ist Replay besonders empfindlich gegenüber unnötiger State-Mutation.
- Fehlende Härtungen: Install-source-Revalidation, Empty-stack-Branch, darunterliegende Karten im Leakscan, No-op-Mutation und Replay.

Notwendige Umsetzung:
- [ ] Test: I Spy nicht installiert oder getrasht -> keine Reveal-LegalAction und manipulierte Aktion scheitert.
- [ ] Test: Leerer Stack -> keine LegalAction oder definierter No-op ohne PublicReveal.
- [ ] Test: Stack mit A oben und B darunter -> nur A erscheint in PublicPayload; B bleibt aus Runner/Coprival-Views und KI-Input draußen.
- [ ] Wrong-side/stale und manipuliertes `sourceCardId` gegen gespeicherte LegalAction ergänzen.
- [ ] Replay/StateHash prüfen, inklusive unveränderter Stack-Reihenfolge.

Akzeptanzkriterien:
- [ ] I Spy revealed genau die oberste Stackkarte und keine weitere Stackinformation.
- [ ] Quelle, Seite, StateVersion und Stack-Verfügbarkeit werden in `applyAction` revalidiert.
- [ ] Reveal ohne Zone-Move erzeugt keine unnötige State-Drift.
- [ ] PublicPayload und Replay bleiben hidden-info-sicher.

### onr_v1_268_shock-r - Shock.r

Bewertung:
- Engine: Die Subroutine setzt für den nächsten ICE-Encounter einen No-Break- und Jack-out-Lock. Das Timing ist rungebunden und muss nach dem Folge-Encounter sicher bereinigt werden.
- Chronik: PublicPayload muss klar zeigen, dass ein nächster-Encounter-Lock gesetzt wurde, ohne das nächste ICE vor Rez/Encounter zu verraten.
- Tests: V1.8.1- und AI-Smokes decken den Grundpfad ab. Es fehlen enge Tests für gebrochene Shock.r-Subroutine, Run-Ende vor Folge-Encounter, mehrere ICE, Jack-out-Fenster, Breaker-LegalAction-Unterdrückung und Replay.
- Hidden-Info/Replay/StateHash: Lockzustände dürfen keine unbekannten ICE-Definitionen offenlegen. Die LegalAction-Projektion für den nächsten Encounter darf keine Break-Aktionen anbieten und muss nach dem Encounter wieder normal werden.
- Fehlende Härtungen: Flag-Lifetime, Breaker-/Jack-out-Projektion, Cleanup und Payload-Leakscan.

Notwendige Umsetzung:
- [ ] Test: Shock.r-Subroutine gebrochen -> keine Folge-Flags, normale Break-/Jack-out-Aktionen beim nächsten ICE.
- [ ] Test: Shock.r ungebrochen -> nächster ICE bietet keine Break-Aktionen und kein Jack-out vor Encounter-Ende.
- [ ] Test: Nach dem Folge-Encounter sind Break- und Jack-out-Regeln wieder normal.
- [ ] Run-Ende vor Folge-Encounter räumt Flags auf und triggert nicht im nächsten Run.
- [ ] PublicPayload-Leakscan und Replay/StateHash für Lock-Setzen und Cleanup ergänzen.

Akzeptanzkriterien:
- [ ] No-Break- und Jack-out-Lock gelten exakt für den nächsten ICE-Encounter im selben Run.
- [ ] Gebrochene Subroutine setzt keinen Lock.
- [ ] Keine verdeckte nächste ICE-Definition gelangt in PublicEvents, PlayerViews oder KI-Input.
- [ ] Cleanup und Replay sind statehash-stabil.

### onr_v1_233_d-arc-knight - D'Arc Knight

Bewertung:
- Engine: Das ICE hat zwei Subroutinen: installierter Program-Trash und End-the-run. Program-Trash nutzt den generischen sichtbaren Installed-Program-Pfad.
- Chronik: Trash-Payload muss Definition, Zonewechsel und Count des getrashten installierten Programms nennen. End-the-run muss getrennt von der Trash-Subroutine nachvollziehbar bleiben.
- Tests: V1.6.3-Smokes decken deterministischen Program-Trash für das Cluster ab. Es fehlen kartenkonkrete Tests für keine Programme, mehrere Programme, gebrochene erste/zweite Subroutine, falsches Break-Target und Replay.
- Hidden-Info/Replay/StateHash: Installierte Programme sind öffentlich; Grip/Stack/Heap dürfen aber nicht als Zielpool erscheinen. Zielalgorithmus muss deterministic bleiben.
- Fehlende Härtungen: Zielauswahlvertrag, No-target-Branch, Subroutine-Index-Revalidation, getrennte Break-Fälle und PublicPayload.

Notwendige Umsetzung:
- [ ] Test mit mehreren installierten Programmen: deterministisches Ziel oder explizite Choice nach bestehendem Vertrag sichern.
- [ ] Test ohne installiertes Programm: Trash-Subroutine ist stabiler No-op, ETR-Subroutine bleibt unabhängig.
- [ ] Erste Subroutine gebrochen, zweite ungebrochen -> kein Program-Trash, Run endet.
- [ ] Erste ungebrochen, zweite gebrochen -> Program-Trash, Run geht weiter.
- [ ] Wrong-side/stale/falscher Subroutine-Index und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] D'Arc Knight trasht höchstens ein installiertes Runner-Programm nach dokumentiertem Zielvertrag.
- [ ] Gebrochene Subroutinen lösen ihre Effekte nicht aus.
- [ ] Hidden-Zonen des Runners erscheinen nie als Zielpool oder PublicPayload.
- [ ] Subroutine-Auflösung und Replay sind statehash-stabil.

### onr_v1_195_corporate-retreat - Corporate Retreat

Bewertung:
- Engine: Gescorte Agenda-Aktion für die Korp: Gain 2 Credits, solange seit dem Scoring kein anderer Corp-Install oder Rez den Effekt abschaltet. `applyAction` prüft Seite, ScoreArea, Definition, Verfügbarkeit und Gain-Betrag.
- Chronik: Payload enthält Creditgewinn und Korp-Creditstand. Der Abschaltgrund durch Install/Rez muss auditierbar bleiben, damit eine fehlende LegalAction nachvollziehbar ist.
- Tests: V1.9.22-Test deckt Nutzung bis Install/Rez, wrong-side/stale und Replay/StateHash laut Smoke ab. Noch wertvoll sind kartenkonkrete negative Manipulationsfälle für falsche Agenda, falschen Gain-Betrag und ScoreArea-Drift.
- Hidden-Info/Replay/StateHash: ScoreArea ist öffentlich. Risiko liegt in persistentem Sonderzustand: Wann genau endet die Verfügbarkeit, wie wird sie im Replay rekonstruiert, und wie werden Install/Rez-Ereignisse chronikalisch gebunden?
- Fehlende Härtungen: Falsche Quelle, manipulierter Gain, Runner-Steal-Abgrenzung, mehrfaches Nutzen vor Abschaltung und chronikalischer Abschaltbeleg.

Notwendige Umsetzung:
- [ ] Test ergänzen: manipuliertes `gainCreditsAmount` ungleich 2 scheitert.
- [ ] Test ergänzen: Runner-gestohlene, installierte oder ungescorte Corporate Retreat erzeugt keine Korp-Aktion.
- [ ] Mehrfachnutzung vor Install/Rez prüfen und Vertrag festlegen: erlaubt solange verfügbar oder einmalig; Tests entsprechend sichern.
- [ ] Install und Rez als Abschalt-Ereignisse mit source-bound Chronik prüfen.
- [ ] Replay/StateHash für Score -> Aktion -> Install/Rez -> keine Aktion sichern.

Akzeptanzkriterien:
- [ ] Nur gescorte Korp-Kopie erzeugt die Corporate-Retreat-Aktion.
- [ ] Aktion gewinnt exakt 2 Credits und validiert den Betrag in `applyAction`.
- [ ] Install oder Rez beendet die Verfügbarkeit deterministisch.
- [ ] Chronik und Replay erklären Nutzbarkeit und Abschaltung ohne Hidden-Info-Leak.

### onr_v1_254_liche - Liche

Bewertung:
- Engine: Das ICE hat drei einzelne Core-Damage-Subroutinen plus End-the-run. Jede ungebrochene Damage-Subroutine muss separat auflösen und Flatline-/Prevention-Pfade respektieren.
- Chronik: DamageSummary muss core-damage-spezifisch sein und drei einzelne Quellen oder eine korrekt aggregierte Payload abbilden. End-the-run darf nicht verschwimmen mit Flatline/Schadensauflösung.
- Tests: V1.6.1-Smokes prüfen Core-Damage-ICE grundsätzlich. Es fehlen kartenkonkrete Tests für teilweise gebrochene Damage-Subroutinen, Prevention pro Damage-Ereignis, Flatline nach erstem/zweitem/drittem Damage und Replay.
- Hidden-Info/Replay/StateHash: Core Damage reduziert Handlimit und kann Flatline verursachen. Grip-Trash/Hand-Refresh-Folgen dürfen nur über DamageSummary und redigierte Counts öffentlich werden.
- Fehlende Härtungen: Subroutineweise Damage-Auflösung, Prevention-Fenster, Flatline-Abbruch, ETR nach Damage und Redaction.

Notwendige Umsetzung:
- [ ] Testmatrix für 0/1/2/3 gebrochene Core-Damage-Subroutinen ergänzen.
- [ ] Prevention-/Avoid-Fenster pro Core-Damage-Ereignis prüfen, inklusive Pass/Accept-Revalidation.
- [ ] Flatline nach früher Damage-Subroutine beendet weitere ICE-Effekte sauber.
- [ ] ETR-Subroutine separat brechen/auflösen und von Damage-Resultaten trennen.
- [ ] DamageSummary-Redaction, PublicPayload-Leakscan und Replay/StateHash ergänzen.

Akzeptanzkriterien:
- [ ] Jede Liche-Damage-Subroutine verursacht genau 1 Core Damage, wenn sie ungebrochen auflöst.
- [ ] Prevention, Flatline und ETR halten die korrekten Timinggrenzen ein.
- [ ] Hidden-Grip-Details bleiben aus PublicEvents, PlayerViews und KI-Input heraus.
- [ ] Replay-StateHash bleibt bei allen Break-Kombinationen stabil.

### onr_v1_262_razor-wire - Razor Wire

Bewertung:
- Engine: Das ICE verursacht 2 Net Damage und hat eine End-the-run-Komponente. Als frühe decklegale Wall-Karte ist sie besonders gut für Regressionen gegen die heutige Damage-/ETR-Engine geeignet.
- Chronik: Damage und ETR müssen getrennt nachvollziehbar sein. Der PublicPayload darf nur Schadensart, Menge, Quelle und redigierte Trash-Zusammenfassung enthalten.
- Tests: Legacy-/V1.1.2k-Smokes decken die Karte grundsätzlich ab. Es fehlen aktuelle fokussierte Tests mit heutigen Damage-Prevention-, Replay-, PublicPayload- und Side/Stale-Konventionen.
- Hidden-Info/Replay/StateHash: Net Damage kann zufällige Gripkarten trashen; diese Karten dürfen nur dem Runner bekannt sein, PublicEvents und Korp-View bekommen Counts/Definitionen nur nach öffentlichem Regelvertrag.
- Fehlende Härtungen: Damage-Redaction, Prevention-Integration, getrennte Subroutine-Breaks, No-hand-/Flatline-Branch und Replay.

Notwendige Umsetzung:
- [ ] Test: Net-Damage-Subroutine gebrochen, ETR ungebrochen -> kein Damage, Run endet.
- [ ] Test: Damage ungebrochen, ETR gebrochen -> 2 Net Damage, Run geht weiter.
- [ ] Test: Runner hat 0/1 Karte in Grip -> Flatline-/Damage-Ergebnis korrekt und redigiert.
- [ ] Damage-Prevention mit installierter Quelle in Kombination prüfen.
- [ ] PublicPayload-Leakscan und Replay/StateHash mit festem Seed ergänzen.

Akzeptanzkriterien:
- [ ] Razor Wire löst Damage und ETR subroutinegenau aus.
- [ ] Net-Damage-Trash ist zufalls-/seedgebunden und redigiert.
- [ ] Flatline und Prevention respektieren Timing und StateVersion.
- [ ] Replay-StateHash bleibt stabil.

### onr_v1_347_vapor-ops - Vapor Ops

Bewertung:
- Engine: Rezzed Asset mit Economy-, Counter- und Overadvance-Schnitt. Laut Manifest sind Counter sichtbar und die Karte läuft über generische Asset-/Node-Resolver plus Agenda-Difficulty-/Overadvance-Familie.
- Chronik: Creditgain, Counter-Veränderung und mögliche Overadvance-Bezüge müssen sauber source-bound sein. Als rezzed Asset ist der Counterstand öffentlich; vor Rez darf die Root-Definition nicht leaken.
- Tests: V1.9.19-Smokes decken Vapor Ops im Asset-/Agenda-Support-Cluster ab. Es fehlen isolierte Tests für rezzed-only, Counterbetrag, Selftrash/Trash-Cleanup falls relevant, mehrfaches Auslösen, falsche Quelle und Replay.
- Hidden-Info/Replay/StateHash: Rezzed Status ist die Sichtbarkeitsgrenze. LegalActions dürfen erst nach Rez erscheinen; PublicPayload darf keine unrezzed Root-Identität aus früheren Projektionen verraten.
- Fehlende Härtungen: Rezzed-only-Actionprojektion, Counter-/Credit-Revalidation, Cleanup nach Trash, PublicPayload-Attribution und AI-Input-Leakscan.

Notwendige Umsetzung:
- [ ] Test: unrezzed Vapor Ops in Remote erzeugt keine spezifische Korp-Asset-Aktion und leakt nicht in Runner-/AI-View.
- [ ] Test: rezzed Vapor Ops erzeugt die erwartete Economy-/Counter-Aktion mit source-bound Payload.
- [ ] Manipulierte `cardId`, Counteranzahl oder Creditgain-Betrag muss in `applyAction` scheitern.
- [ ] Trash-Cleanup und mehrfaches Auslösen im selben Zug nach dokumentiertem Vertrag prüfen.
- [ ] PublicPayload-, AI-Input- und Replay/StateHash-Prüfung ergänzen.

Akzeptanzkriterien:
- [ ] Vapor Ops ist vor Rez hidden und nach Rez als öffentliche Quelle korrekt aktiv.
- [ ] Counter- und Creditwerte werden in `applyAction` erneut validiert.
- [ ] Getrashte oder manipulierte Quellen erzeugen keine Wirkung.
- [ ] Chronik, AI-Input und Replay bleiben source-bound und hidden-info-sicher.

## Gesamtplan

1. Vor Umsetzung Queue und Register erneut lesen; bei paralleler Reservierung einer der zehn Card IDs diesen Job zurückstellen oder splitten.
2. Zuerst Hidden-Zone- und Choice-Härtung umsetzen: Too Many Doors und I Spy, inklusive PublicPayload-/PlayerView-/AI-Leakscan.
3. Danach Run-Folgezustände absichern: Fatal Attractor und Shock.r mit Flag-Lifetime, Folge-Encounter, Cleanup und Replay.
4. Anschließend Subroutine-/Damage-Härtung für D'Arc Knight, Liche und Razor Wire ergänzen, inklusive Break-Kombinationen und Damage-Redaction.
5. Zum Schluss rezzed/scored Sourcebindung und Counter-/Economy-Schnitt härten: Chicago Branch, Corporate Retreat und Vapor Ops.
6. Keine neue Karte promoten. Manifest-/AI-/Szenarioartefakte nur ändern, wenn Tests oder Effektverträge tatsächlich aktualisiert werden müssen.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsergebnis

Status: `done`

Umgesetzt:
- `Too Many Doors`: kurze R&D mit 0/1 Karte läuft jetzt als stabiler No-op mit `hiddenZoneBarrier`/`arrangedCount` weiter statt den Run durch einen Engine-Fehler zu blockieren.
- `Chicago Branch` und `Vapor Ops`: V1.9.19-Counter-Aktionen schreiben `sourceDefinitionId` in den öffentlichen Payload; die Quelle bleibt rezzed-only und replayfähig.
- Fokussierte Engine-Regressionen ergänzen Hidden-Zone-Leakscans, Choice-Revalidation, Broken-Subroutine- und Short-R&D-Fälle, I-Spy-Top-Stack-Reveal, Fatal-Attractor-/Shock.r-Flag-Lifetime, D'Arc-Knight-/Razor-Wire-/Liche-Subroutinegrenzen sowie Corporate-Retreat-ScoreArea-Drift.

Geänderte Artefakte:
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_REORDER_COUNTER_RUNLOCK_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Checks:
- `corepack pnpm --filter @netgrid/engine test` - grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün
- `corepack pnpm --filter @netgrid/catalog test` - grün
- `corepack pnpm typecheck` - grün

Commit: lokal abgeschlossen.

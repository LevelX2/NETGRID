# AI Replay Latest Corp Play Evidence 2026-06-24

Status: RCP-2 evidence

## Match

- Match-ID: `match_7eb5afffa3245650`
- Quelle: lokale Runtime-SQLite `data/runtime/multiplayer/netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- KI-Seite: Korp
- Status: `finished`
- Ergebnis: Korp gewinnt per `flatline`
- Zeitraum: erstellt `2026-06-24T20:04:03.851Z`, aktualisiert `2026-06-24T20:18:37.157Z`
- Umfang: 97 Events, 41 Korp-AI-Decision-Traces, final `stateVersion=96`
- Decks: Runner `Stealth Interface Starter`, Korp `Manhunt Pressure Bureau`

Die spätere Partie `match_ab44ac886c5dbf49` war zum Analysezeitpunkt noch `active` und wurde deshalb nicht als letztes abgeschlossenes Spiel gewertet.

## Methodik

Ausgewertet wurden `matches`, `events`, `state_snapshots` und `ai_decision_traces` read-only. Die Bewertung nutzt nur die damalige Korp-sichere Sicht: Korp-PlayerView, LegalActions, side-safe PublicEvents und Korp-DecisionDebug. Spätere Ereignisse werden nur als Folge bewertet, nicht als damalige Hidden-Info-Entscheidungsgrundlage.

## Spielverlauf Kurzfassung

1. Korp hält die Starthand, zieht verpflichtend, installiert zuerst ICE auf HQ, dann `BBS Whispering Campaign` in Remote 1, rezzt BBS und nimmt einmal fälschlich nur einen Basic-Credit.
2. Runner baut `Newsgroup Filter` auf und läuft früh R&D/HQ. Korp rezzt R&D/HQ-ICE und blockt diese Runs.
3. Korp nutzt BBS mehrfach für Economy, installiert später `City Surveillance` offen in Remote 2 und rezzt es. Runner trashte diese Karte später.
4. Runner installiert `The Short Circuit`, sucht `Cyfermaster™`, baut danach den passenden Breaker auf und läuft wieder R&D.
5. Korp spielt erst sehr spät `Chance Observation`, gewinnt den Trace, Runner hat danach 1 Tag.
6. Korp spielt direkt anschließend `Urban Renewal` und gewinnt per Flatline. In diesem letzten Fenster war `Urban Renewal` klar besser als `Closed Accounts` oder `The Short Circuit` zu trashen.

## Zugweise Bewertung der Korp-Entscheidungen

| Decision | StateVersion | Aktion                                     | Relevante Alternativen                                                     | Bewertung                                                                                                      |
| -------- | -----------: | ------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1        |            1 | Corp-Mulligan keep                         | nur Setup-Choice                                                           | ok                                                                                                             |
| 2        |            2 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 3        |            3 | Data Wall vor HQ                           | Data Wall vor R&D gleich bewertet, BBS, Basic-Credit, Corporate War remote | vertretbar, aber tie-breaker ignoriert R&D-Defaultdruck; kein harter Fehler                                    |
| 4        |            4 | BBS installieren                           | Basic-Credit, Draw, Corporate War remote                                   | ok: Economy-Asset aufbauen                                                                                     |
| 5        |            5 | BBS rezzen                                 | Basic-Credit, Draw, Corporate War remote                                   | ok                                                                                                             |
| 6        |            6 | Basic-`gain_credit`                        | `BBS Whispering Campaign: 2 Credits nehmen`                                | Fehler: +1 Basic-Credit schlägt +2 Card-Economy wegen Low-Credit-Bonus                                         |
| 7        |            7 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 8        |           14 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 9        |           15 | Filter vor R&D installieren                | BBS-Ability, `Chance Observation`, Basic-Credit, Corporate War remote      | vertretbar als Reaktion auf R&D-Run; Chance-Taglinie beginnt aber schon sichtbar                               |
| 10       |           16 | BBS-Ability                                | `Chance Observation`, Basic-Credit                                         | ok, aber `Chance Observation` bleibt nur knapp darunter                                                        |
| 11       |           17 | BBS-Ability                                | `Chance Observation`, Basic-Credit                                         | ok                                                                                                             |
| 12       |           18 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 13       |           22 | Filter rezzen                              | Decline rez                                                                | ok                                                                                                             |
| 14       |           25 | Data Wall rezzen                           | Decline rez                                                                | ok                                                                                                             |
| 15       |           28 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 16       |           29 | City Surveillance in Remote 2 installieren | BBS-Ability, `Chance Observation`, Basic-Credit, Corporate War remote      | Fehler/Schwachpunkt: ungeschützte Remote-Asset-Linie verdrängt aktiven Tag-Enabler und wird später getrasht    |
| 17       |           30 | City Surveillance rezzen                   | BBS-Ability, `Chance Observation`, Basic-Credit                            | Fehler/Schwachpunkt: Rez wird wie Defense/Tempo behandelt, obwohl ungeschütztes Asset sofort contestbar bleibt |
| 18       |           31 | BBS-Ability                                | `Chance Observation`, Basic-Credit                                         | ok                                                                                                             |
| 19       |           32 | BBS-Ability                                | `Chance Observation`, Basic-Credit                                         | ok                                                                                                             |
| 20       |           33 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 21       |           46 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 22       |           47 | Data Wall vor HQ installieren              | BBS-Ability, `Chance Observation`, Draw, Basic-Credit                      | nachvollziehbar nach HQ-Multiaccess; kein harter Fehler                                                        |
| 23       |           48 | BBS-Ability                                | `Chance Observation`, Draw, Basic-Credit                                   | ok                                                                                                             |
| 24       |           49 | BBS-Ability                                | `Chance Observation`, Draw, Basic-Credit                                   | ok                                                                                                             |
| 25       |           50 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 26       |           58 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 27       |           59 | Vacuum Link vor R&D installieren           | BBS-Ability, `Chance Observation`, Basic-Credit                            | vertretbar nach R&D-Druck, aber Chance-Taglinie weiter verzögert                                               |
| 28       |           60 | BBS-Ability                                | `Chance Observation`, Draw, Basic-Credit                                   | ok                                                                                                             |
| 29       |           61 | BBS-Ability                                | `Chance Observation`, Draw, Basic-Credit                                   | ok                                                                                                             |
| 30       |           62 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 31       |           69 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 32       |           70 | Basic-`gain_credit`                        | Draw                                                                       | ok: keine bessere LegalAction im Trace                                                                         |
| 33       |           71 | Basic-`gain_credit`                        | Draw                                                                       | ok                                                                                                             |
| 34       |           72 | Basic-`gain_credit`                        | Draw                                                                       | ok                                                                                                             |
| 35       |           73 | End turn                                   | keine relevante LegalAction                                                | ok                                                                                                             |
| 36       |           78 | Vacuum Link rezzen                         | Decline rez                                                                | ok                                                                                                             |
| 37       |           90 | Mandatory draw                             | Pflichtaktion                                                              | ok                                                                                                             |
| 38       |           91 | Banpei vor HQ installieren                 | Banpei vor R&D, `Chance Observation`, Basic-Credit                         | Schwach: bei 3 Klicks und sichtbarem Payoff wäre Tag-Enabler vor weiterem ICE plausibler                       |
| 39       |           92 | `Chance Observation` spielen               | Basic-Credit, Draw                                                         | sehr spät, aber jetzt korrekt                                                                                  |
| 40       |           93 | Trace-Bid-Choice                           | Choice-Auflösung                                                           | ok als Choice-Handling; gesonderte Trace-Bid-Qualität hier nicht vertieft                                      |
| 41       |           95 | `Urban Renewal` spielen                    | zweites Urban Renewal, `Closed Accounts`, `The Short Circuit` trashen      | korrekt: unmittelbare Flatline-Payoff-Aktion ist besser als Resource-Trash                                     |

## Fehlergruppen

### F1: Aktivierte Korp-Economy-Aktion verliert gegen Basic-Credit

Beispiel: `Decision 6`, `sv6`. Die Korp wählt `corp.gain_credit` mit Score `6375`; `BBS Whispering Campaign: 2 Credits nehmen` liegt nur bei `6200`.

Warum schlecht: Beide Aktionen kosten einen Klick und sind legal. Die sichtbare BBS-Aktion gibt 2 Credits, Basic-`gain_credit` nur 1 Credit. Der Low-Credit-Bonus wird nur auf Basic-`gain_credit` addiert, nicht auf die stärkere Card-Economy-Aktion.

Schicht: Semantic Runtime Score-Komponenten und Scope-Klassifikation.

Erwartete künftige Behandlung:

- Aktivierte Korp-Kartenaktionen mit sichtbarem Credit-Gain werden als `basic_economy_draw` oder als `corp_action_economy` bewertet.
- Wenn eine LegalAction side-safe einen höheren Credit-Gain als Basic-`gain_credit` zeigt und keine dringendere Score-/Kill-/Trash-Aktion legal ist, muss sie Basic-`gain_credit` schlagen.
- Debug soll einen eigenen Score-Key wie `corp_card_action_economy_gain` zeigen.

Akzeptanzkriterium: In einer Korp-Hauptphase mit Basic-`gain_credit` und einer sichtbaren aktivierten +2-Credit-Kartenaktion wählt die KI die Kartenaktion; ohne Credit-Gain bleibt eine opake Ability nicht automatisch Economy.

### F2: Tag-Enabler mit sichtbarem Payoff wird nicht als Planlinie genutzt

Beispiele:

- `Decision 9`, `sv15`: `Chance Observation` legal, aber hinter R&D-ICE, BBS und generischen Aktionen.
- `Decision 16`, `sv29`: `Chance Observation` legal, aber hinter ungeschütztem `City Surveillance`.
- `Decision 38`, `sv91`: `Chance Observation` legal, aber hinter weiterem HQ-ICE.
- Erst `Decision 39`, `sv92`: `Chance Observation` wird gespielt.

Warum schlecht: `Chance Observation` ist in den Hints korrekt als `tag_source`, `trace.source`, `corp.tag_trace_punish` und `strategicRole: enabler` markiert. Die Runtime-Scoring-Komponenten nutzen diesen Enabler jedoch nicht ausreichend, obwohl Korp wiederholt tagabhängige Payoffs hält oder sichtbar in der eigenen Korp-Zone hat (`Closed Accounts`, später `Urban Renewal`). Das Trace-Feld selbst zeigt `own_hand_future_play_plan_model:not_modelled`.

Schicht: Semantic Runtime und Ontologie-Consumer, nicht primär Hintdaten.

Erwartete künftige Behandlung:

- Tag-Source-Operationen erhalten einen side-safe Enabler-Bonus, wenn ein eigener tagabhängiger Payoff sichtbar verfügbar ist oder mit absehbarem Funding erreichbar wird.
- Trace-Tag-Quellen berücksichtigen erwartete Erfolgswahrscheinlichkeit aus sichtbaren Credits/Link und dürfen bei niedriger Erfolgswahrscheinlichkeit unter Economy/Defense bleiben.
- Der Bonus muss unter Score-/Flatline-Payoffs, sicheren Scores und zwingender Run-Defense bleiben.

Akzeptanzkriterium: In einer Korp-Hauptphase mit legalem `Chance Observation`, sichtbarem tagabhängigem Payoff und mindestens plausibler Trace-Erfolgschance schlägt der Tag-Enabler generische Economy und ungeschütztes Remote-Asset-Setup; ohne sichtbaren Payoff bleibt er nur moderat.

### F3: Ungeschütztes Remote-Asset-Setup verdrängt robustere Tag-/Payoff-Linie

Beispiele:

- `Decision 16`, `sv29`: Installation von `City Surveillance` in Remote 2.
- `Decision 17`, `sv30`: Rez von `City Surveillance`.
- Runner trashte `City Surveillance` später in Events `54-56`.

Warum schlecht: `City Surveillance` ist ein persistenter Tag-Enabler, aber als ungeschütztes Remote-Asset angreifbar. Im Replay wird die Karte ohne Remote-ICE aufgebaut und geht verloren. Die KI bewertet das Rezzing im Trace über `corp.rez_defense`/`simple_rez`, obwohl die Karte kein ICE ist und die Remote-Verwundbarkeit nicht als Setup-Risiko sichtbar in den Score eingeht.

Schicht: Semantic Runtime Remote-/Rez-Kontext und Planrollen-Verbrauch.

Erwartete künftige Behandlung:

- Persistente Tag-Enabler-Assets ohne Schutz sollen gegen sofortige Operation-Tag-Quellen, Economy oder Schutzaufbau abgewogen werden.
- Rezzed Remote-Root ohne Schutz und mit Runner-Credits/Remote-Pressure bekommt einen Verwundbarkeitsabschlag.
- `simple_rez` darf Asset-Rez nicht blind als Defense zählen.

Akzeptanzkriterium: Eine ungeschützte Remote-Root-Tagquelle wird nicht höher bewertet als eine sofort spielbare Tag-Operation mit Payoff-Kontext, wenn Runner das Remote realistisch contesten kann.

### F4: Resource-Trash-Vorwurf im konkreten Match nur teilweise belegt

`The Short Circuit` wurde bei `sv64` installiert und bei `sv65-66` sofort genutzt, um `Cyfermaster™` zu suchen. Korp konnte Resources aber erst trashen, nachdem Runner tatsächlich getaggt war. In den gespeicherten LegalAction-Alternativen taucht `trash_resource` erst in `Decision 41`, `sv95`, auf. In genau diesem Fenster war `Urban Renewal` eine direkte Flatline und deshalb fachlich besser.

Schicht: keine falsche LegalAction-Entscheidung in diesem Match. Möglicher Follow-up: Wenn ein Runner getaggt ist, kein unmittelbarer Kill/Score legal ist und ein sichtbares Such-/Tag-Defense-/Trace-Defense-Resource-Ziel liegt, soll `trash_resource` deutlich über generischer Economy/Draw liegen.

Akzeptanzkriterium für späteren Scope: `trash_resource` gegen sichtbare zentrale Resource-Engines wird in Tag-Fenstern bevorzugt, solange kein direkter Kill/Score-Payoff legal ist.

### F5: `Schlaghund` war in diesem Replay nicht verfügbar

In den 41 gespeicherten Korp-Decision-Traces erscheint keine LegalAction und keine ActionAlternative mit `Schlaghund`. Der frühere Nutzerverdacht ist für dieses konkrete Match daher nicht als Spielfehler belegbar.

Schicht: keine Anpassung aus diesem Match. Bestehende Tests decken Schlaghund-Tag-Punish bereits ab; erst ein Replay mit legalem, aber nicht genutztem Schlaghund-Fenster wäre ein neuer Fixscope.

## Hint-/Semantikbefund

- `Chance Observation`-Hints sind fachlich richtig: `tag_source`, `trace`, `requires_trace_success`, `lineSupport: corp.tag_trace_punish`, `strategicRole: enabler`.
- `Closed Accounts` und `Urban Renewal` sind als `tag_punish_payoff` beziehungsweise Damage-Payoff korrekt markiert.
- `City Surveillance` ist korrekt als persistenter Tag-Enabler markiert, aber die Runtime behandelt den Rez-/Remote-Kontext zu grob.
- `BBS Whispering Campaign` ist runtime-seitig korrekt als +2-Credit-Action umgesetzt. Der Fehler liegt nicht in der Engine, sondern im Semantic-Scoring der aktivierten Economy-Action.

## Umsetzungsempfehlung

1. Generische Korp-Action-Economy-Komponente ergänzen: aktivierte/triggered Korp-Kartenaktionen mit sichtbarem Credit-Gain erhalten einen Credit-Gain-Wert und übernehmen Low-Credit-/Reserve-Kontext.
2. Generische Tag-Enabler-Komponente ergänzen: `corp_tag_source_visible_payoff_pressure` für legale Tag-/Trace-Quellen mit sichtbarem Payoff und plausibler Success-Erwartung.
3. Ungeschützte Remote-Tag-Asset-Linie abwerten: persistente Tag-Enabler-Assets in ungeschützten Remotes bekommen einen Verwundbarkeitsabschlag, wenn eine sofortige Tag-Operation oder bessere Schutz-/Payoff-Aktion legal ist.
4. Tests mit positiven und negativen Gegenproben ergänzen:
   - +2 Card-Economy schlägt Basic-`gain_credit`.
   - Opake Ability ohne Credit-Gain schlägt Basic-`gain_credit` nicht.
   - `Chance Observation` mit sichtbarem Payoff schlägt ungeschütztes Remote-Asset-Setup.
   - Tag-Source ohne sichtbaren Payoff wird nicht blind über Defense/Economy gehoben.

## Nicht-Ziele für diese Runde

- Kein Engine-Fix aus diesem Match ableitbar.
- Kein Hidden-Info-Zugriff.
- Keine Schlaghund-Sonderregel ohne Replay-Evidence.
- Keine Änderung an Trace-Bid-Choice-Policy aus diesem Spiel; der gewinnende Trace am Ende war ausreichend für den Payoff.

# Match `b763978b57e73191`: Runner-Playtest-Auswertung

## Grundlage

Ausgewertet wurde ausschließlich die aktuelle Maintenance-Analyse-API:
`GET /api/storage/maintenance/analysis/matches/match_b763978b57e73191/bundle`
und der zugehörige Decision-Endpunkt. Das abgeschlossene Match endet bei
`matchVersion 230` / `StateVersion 229` (`fnv1a:b98e61d8`), enthält 124
Runner-Entscheidungen, 124 Detailed Traces, keine Fallbacks und keine
Timeouts. Der Vergleich von Trace und angewendeter Action stimmt durchgehend.

Die Runner-Züge wurden vollständig abgedeckt: 1 (D1), 2 (D2–D8), 4
(D9–D18), 6 (D19–D24), 8 (D25–D29), 10 (D30–D43), 12 (D44–D56), 14
(D57–D65), 16 (D66–D71), 18 (D72–D76), 20 (D77–D85), 22 (D86–D101), 24
(D102–D106), 26 (D107–D114) und 28 (D115–D124).

## Relevante Run-Evidence

| Decision / State | Credits / Actions | Plan, Zweck und Action | Zielwissen, Kosten und Why-not |
| --- | --- | --- | --- |
| D35 / 64 (Zug 10) | 2 / 3, kostenfreie Bonus-Run-Capacity 1 | Root/Leaf `plan:runner.convert_run_window:run%3A64`, Capability `continue_engine_restricted_run_sequence`, Zweck „Convert run window run:64“, gewählt: All-Nighter-Bonusrun Archives | Legale Bonusziele: HQ -40 (`gain_credits_first`, unbekannt), R&D -1040 (bekannter niedriger Wert), Archives +160 (`run_if_free`, unbekannt), Remote 1 -660 (bekannt, kein Payoff), Remote 2 +160 (`run_if_free`, unbekannt). Alle Wege waren erreichbar und ohne sichtbare Ice-Hazard; ein konkreter Agenda-, Trash- oder Informationsgewinn für Archives war nicht belegt. Die Alternative R&D verlor wegen bekannter niedriger Karte, HQ wegen Kreditbedarf, Remote 1 wegen bekannten fehlenden Payoffs; Remote 2 war nur gleich schwach unbekannt. Es gab keine Decline-LegalAction; nur `end_turn` hätte die Restactions aufgegeben. |
| D37 / 67 (Zug 10) | 2 / 3 | Root/Leaf `runner.contest_remote:remote%3Aremote_2`, gewählt: regulärer Run auf Remote 2 | Nach Corp-Install war Remote 2 noch unbekannt; der erste Contest war daher plausibel. D40 / State 71 enthielt beim Zugriff auf `Shock Treatment` (Root `root:0`) bei 2 Credits ausschließlich `runner.decline_trash`; Trash Cost 5 war korrekt nicht finanzierbar. |
| D44 / 81 (Zug 12) | 3 / 4 | `runner.contest_remote:remote%3Aremote_2`, Signal `runner_direct_run_converts_now:remote_2`, gewählt: Run auf Remote 2 | Vorheriger Zugriff kannte weiterhin Shock Treatment in `remote_2/root:0`; es gab keine Serveränderung. Dennoch wurde ein Corp-Hand-Discard ohne `serverId` als globale Positions-Invalidierung behandelt. Dadurch fehlten dem Runplan der bekannte Trash Cost 5 und der bereits abgelehnte Zugriff; D47 / State 85 musste bei 3 Credits erneut nur trash ablehnen. Bestätigter Fehler. |
| D79 / 148 (Zug 20) | 3 / 2 | `runner.contest_remote:remote%3Aremote_2`, erneut Remote-Contest | Gleicher stale Contest-Trigger; keine neue bekannte Agenda, keine installierte Änderung und keine tragfähige Trashreserve. Kein isolierter Zufall, sondern derselbe Verlust der Positionserinnerung. |
| D86 / 164 (Zug 22) | 3 / 4 | `runner.contest_remote:remote%3Aremote_2`, erneut Remote-Contest | Wie D79: bekannte Root-Information wurde nicht mehr an den bestehenden Access-Payoff geliefert; die aus Engine-Quotes berechnete 5-Credit-Trashreserve konnte deshalb nicht sperren. |
| D107 / 197 (Zug 26) | 3 / 4 | `runner.contest_remote:remote%3Aremote_2`, erneut Remote-Contest | Wie D79/D86: keine neue aktuelle Payoff-Evidence. Gemeinsame Ursache ist die überbreite Invalidierung, nicht Shock Treatment selbst. |
| D58 / 103 bis D63 / 113 (Zug 14) | D58: 3 / 3; D63: 3 / 2 | D58 `runner.contest_remote` auf Remote 1; Event 110 löst Baskervilles erste Subroutine und Trace, Event 112 setzt nach erfolgreichem Trace den Counter | Event 110 verursachte korrekt 2 Net Damage. Event 113 löste jedoch nach dem Trace die bereits aufgelöste erste Subroutine nochmals mit weiteren 2 Net Damage aus. Das war kein Counter-Schaden; der Counter wurde erst in Event 112 erzeugt und D63 bot korrekt seine Entfernung gegen 1 Action + 3 Credits an. |

## Ursachen und Korrekturen

| Beobachtung | Tatsächliche Decision / State | Ergebnis | Root Cause und Schicht | Korrektur |
| --- | --- | --- | --- | --- |
| All-Nighter läuft kostenfrei auf Archives | D35 / 64 | bestätigt | Die frühere zielgenaue Restricted-Run-Rangfolge funktioniert: Ziele hatten unterschiedliche Scores. Es fehlte jedoch die Engine-Modellierung eines freiwilligen Verzichts, obwohl `followupRunOnEnd: optional` gilt. `runner.convert_run_window` musste deshalb einen nur schwach positiven `run_if_free`-Run wählen. | Engine erzeugt nun eine generische Decline-LegalAction für optionale Bonus-Run-Fenster; sie erhält Restactions. Der bestehende RunTarget-/Access-Payoff-Owner lässt nur Optionen mit gegenwärtigem, realisierbarem Grenznutzen zu. Owner bleibt `runner.convert_run_window`. |
| Wiederholte Remote-2-Runs gegen nicht trashbares Shock Treatment | D44 / 81, D79 / 148, D86 / 164, D107 / 197 | bestätigt | `belief-state` invalidierte bei jedem serverlosen Corp-Discard alle bekannten Positionen. Der unsichtbare Hand-Discard zwischen D40 und D44 löschte fälschlich `remote_2/root:0`; vorhandene Engine-Quote-/Known-Remote-Payoff-Logik bekam daher keine bekannte Karte. | Ein serverloser Discard invalidiert nur HQ-Positionswissen. Installierte Remote-Positionen bleiben bis zu einer ihnen zuordenbaren Änderung bekannt; vorhandene Kostenquote-/Payoff-Bewertung entscheidet weiter über Trashbarkeit und Contest. |
| Baskerville verursache „zu früh“ 2 Net Damage | Events 110 und 113, States 109–113 | bestätigt | Die erste gedruckte Subroutine verursacht sofort korrekt 2 Net Damage. Nach dem folgenden Trace kehrte die Encounter-Fortsetzung zurück, ohne diese bereits resolvte Damage-Subroutine als erledigt zu markieren, und führte sie erneut aus. | Die generische Printed-Damage-Auflösung markiert die Subroutine nun sofort nach erfolgreichem Schaden als resolved. Dadurch kann jede nachfolgende suspendierende Subroutine, etwa ein Trace, sie nicht wiederholen. Counter, Anzeige und Entfernung bleiben unverändert korrekt. |
| „Diese Aktion ist nicht legal“ bei ungefähr Version 67 / State 66 | State 66–67, D35–D37 | unklar / nicht reproduzierbar | Der API-Trace zeigt dort: D35 Bonusrun, D36 Run-Fortsetzung, State 66 Corp-Decline-Rez, D37 Runner-Run Remote 2. Keine stale Action-ID/-Version, keine ApplyAction-Ablehnung, kein Fallback oder Timeout. | Keine Änderung ohne Matchbeleg. |

## Regression-Checkpoints und Verifikation

- Der aus D35 abgeleitete Checkpoint lässt `runner.convert_run_window` die
  neue Decline-LegalAction wählen, wenn Archives nur `run_if_free` und das
  bekannte Remote nicht trashbar ist. Plan-Owner, Executor und Capability
  bleiben dabei erhalten.
- Engine-Tests sichern die optionale Window-Form: nur markierte Bonus-Runs
  plus Decline; Decline löscht ausschließlich die Pending-Capacity und keine
  Action. Bestehende Rangfolgetests sichern frisches R&D vor leerem Archives
  sowie wählbares wertvolles Archives.
- Der aus D44 abgeleitete Belief-Checkpoint hält die bekannte
  `onr_classic_023_shock-treatment`-Root in Remote 2 über genau den
  unverbundenen, verdeckten Corp-Discard hinweg. Servergebundene Änderungen
  invalidieren sie weiterhin über den bestehenden Pfad.
- Der Baskerville-Regressionstest sichert, dass eine unmittelbar aufgelöste
  Damage-Subroutine vor einer möglichen späteren Encounter-Fortsetzung als
  resolved markiert ist.
- Fokussiert grün: 35 AI-Tests (Restricted-Run-Contract und Belief-State),
  die gesamte Engine-Suite (214 Dateien, 1.892 Tests), beide Paket-Typechecks,
  `check:ai`, `check:engine-source-structure` und `git diff --check`.

Die Korrekturen führen weder eine Karte-spezifische Regel noch eine zweite
Serverbewertung ein. Sie verwenden weiterhin die Engine-LegalActions und
Engine-Kostenquotes; unbekannte Ziele bleiben unabhängig von exakt bekannten
Pfaden bewertbar.

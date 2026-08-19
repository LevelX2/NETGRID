# KI-Selbstspielzyklus 003 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; ein generisches Finding mit zwei gekoppelten
Ursachen behoben und im identischen Replay verifiziert

## Reproduktionsvertrag

- Auswahlseed: `f2ed3237144d48778a6aaa69c14b6ddf`
- Spielseed: `selfplay-003-ea49c37c2f354872a7076d853d695814`
- Auswahlmenge: 24 kuratierte Runner- und 23 kuratierte Corp-Standarddecks
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace
- Runner: `standard_standard_runner_mp48400s_1.0.0`, 45 Karten,
  `fnv1a:f89c68b9`, Run til End
- Corp: `standard_standard_corp_chrome_rush_bureau_1.0.0`, 64 Karten,
  `fnv1a:2ebf0f5c`, Chrome Rush Bureau

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad mit manueller
Einzelschrittsteuerung, jeweils einer frischen isolierten SQLite-Datenbank und
der lokalen read-only Maintenance-Analyse-API. Die Standardports und die
Main-Datenbank blieben unberührt.

| Stand                                         | Ergebnis wie im Programm             | Grund                               | Aktionen | finaler StateHash |
| --------------------------------------------- | ------------------------------------ | ----------------------------------- | -------: | ----------------- |
| Ausgangslauf `match_ddac385459428c34`         | Corp 10 – Runner 4; Agendapunkte 7:4 | Corp erreicht sieben Agendapunkte   |      280 | `fnv1a:00312830`  |
| erster Kontrolllauf `match_7086b0128fda7eeb`  | Corp 10 – Runner 1; Agendapunkte 7:1 | Corp erreicht sieben Agendapunkte   |      160 | `fnv1a:f3cc55fc`  |
| finaler Kontrolllauf `match_d1466637af6d0a60` | Runner 10 – Corp 4; Agendapunkte 7:4 | Runner erreicht sieben Agendapunkte |      322 | `fnv1a:888d6be7`  |

Der erste Kontrolllauf war bewusst noch kein Zyklusabschluss. Er zeigte,
dass Funding und Breaker-Installation nun stattfanden, der gebundene
Remote-Parent danach aber noch nicht wieder aufgenommen wurde. Erst der
zweite Kontrolllauf schließt den vollständigen Fehlerpfad.

## Vollständiger Decision-Denominator

Alle 762 gespeicherten Entscheidungen der drei Läufe wurden aus den
persistierten Detailkontexten klassifiziert. LegalAction-Mitgliedschaft,
Engine-Apply, Debug-/Apply-Übereinstimmung und deterministische
StateHash-Fortschreibung sind in allen drei Läufen vollständig. Es gab keine
Fallbacks, Timeouts, Apply-Abweichungen oder Maintenance-Warnungen.

Ausgangslauf, 280 von 280:

- `plausibel`: 149;
- `Finding`: 1, D57; D62–D63 belegen die vorhandenen Folgeschritte;
- `trace-limitiert`: 130 normalisierte TurnPlanner-Audits, überwiegend
  Enginefenster und Corp-Entscheidungen; der Plan-First-Detailtrace ist dort
  weiterhin vorhanden.

Erster Kontrolllauf, 160 von 160:

- `plausibel`: 80;
- `Finding`: 1, D59;
- `trace-limitiert`: 79.

Finaler Kontrolllauf, 322 von 322:

- `plausibel`: 174;
- `prüfbedürftig`: 3, D149, D172 und D191;
- `Finding`: 0;
- `trace-limitiert`: 145 weitere Entscheidungen.

Die drei prüfbedürftigen Corp-Schritte legen zusätzliche Wall-/Code-Gate-ICE
vor R&D. Die öffentlich installierten kostenlosen passenden Breaker machen
diese Schichten später wirkungslos; die Corp lehnt ihre Rezzes folgerichtig
ab. Ob schon die Installationsallokation einen generisch messbaren Fehler
darstellt, ist noch nicht ausreichend belegt und wird deshalb nur in der
Indizienmatrix verdichtet.

## Bestätigtes Finding

### Dringende Remote verliert ihre finanzierbare Coverage-Fortsetzung

Im Ausgangslauf installiert die Corp D50 Tycho Extension in Remote 1 und
advanced sie D51 einmal. Der Runner probt die Remote D54, deckt D55 Quandary
auf und kennt danach den fehlenden Code-Gate-Breaker exakt. Vor D57 besitzt er
vier Credits, drei Klicks und Wizard’s Book mit Installationskosten fünf in
der Hand. Die vollständige legale Linie ist damit:

1. einen Basic Credit nehmen;
2. Wizard’s Book installieren;
3. Remote 1 erneut angreifen und die bekannte Quandary kostenlos brechen.

Stattdessen wählt D57 einen gewöhnlichen HQ-Run. D62 nimmt später denselben
Basic Credit und D63 installiert Wizard’s Book mit dem letzten Klick. Diese
beiden historischen LegalActions beweisen die bessere Linie, ohne zukünftige
Action-IDs zu erfinden. Die Corp vollendet D66–D69 Tycho Extension für vier
Punkte; bei einem Endstand von 7:4 ist dieser Verlust unmittelbar
spielentscheidend.

Die erste Ursache lag in der Coverage-Projektion. Sie erkannte die
Same-Turn-Linie nur, wenn die Installationsaktion des Breakers schon vor dem
Funding legal war. Bei vier Credits veröffentlichte die Engine die fünf
Credits teure Installation korrekterweise noch nicht. Der generische Fix darf
für eine bekannte eigene Handkarte CardSpec-Installationskosten, einen Klick
und freie Speicherkapazität projizieren, speichert aber keine zukünftige
Action-ID. Nach dem Credit muss die Engine die konkrete Installationsaktion
neu veröffentlichen; andernfalls scheitert die Linie fail-closed.

Im ersten Kontrolllauf wählt D57 daraufhin korrekt den Credit und D58 die
Installation. D59 läuft jedoch auf R&D statt auf die Remote. Ursache war die
allgemeine Credit-Reserve: Sie blockierte die Rückkehr zum P2-Remote-Parent,
obwohl der bekannte Pfad garantiert, vollständig gerezzt, gefahrenfrei und
kostenlos passierbar war. Der zweite generische Fix erlaubt das Aufbrauchen
der Reserve bis null nur für einen solchen exakt belegten Score-Threat-Pfad.
Unbekannte ICE, Funding-Gaps, konditionale Effekte, sichtbare Gefahren oder
Trace-Risiken schließen die Ausnahme aus.

Im finalen Replay lautet die Folge D57 Credit, D58 Wizard’s Book installieren,
D59 Remote 1 angreifen, D60 Subroutine brechen, D61–D63 fortsetzen und
accessen, D64 Tycho Extension stehlen. Der Root bleibt bei D57–D64
`runner.contest_remote`; nur D57–D58 delegieren an den vorhandenen Leaf
`runner.rig_and_coverage`. Action-ID, Executor und Choice-Autorität bleiben
jeweils an der aktuellen LegalAction gebunden.

Regressionstest:
`keeps an urgent remote as root while funding a not-yet-legal breaker install`
in `packages/ai/src/runtime/plan-first-live-runtime.test.ts`.

## Analyse des finalen Gewinners

Der Runner gewinnt nicht zufällig durch einen einzelnen Zugriff, sondern
durch zwei kohärente Muster:

- D54–D64 schließt die behobene Remote-Linie und stiehlt Tycho Extension für
  vier Agendapunkte.
- Danach konzentriert er sich auf R&D: 17 der insgesamt 20 gestarteten Runs
  gehen auf R&D, einer auf HQ und zwei auf die dringende Remote.
- Die wiederholten R&D-Runs liefern bei D225 und D289 je einen Punkt durch
  Project Babylon und bei D322 den letzten Punkt durch Executive Extraction.
- Wizard’s Book und Worm decken die tatsächlich gezogenen Code Gates und
  Walls passend und überwiegend ohne Breakkosten ab. Economy-Schritte halten
  die späteren Runs und Kartenentwicklung finanzierbar.
- Alle Run-, Encounter-, Break-, Continue-, Access- und Steal-Fenster sind
  legal und owner-konsistent. Kein EndTurn verbraucht noch normale Klicks.

Die Winner-Analyse enthält keinen weiteren klaren Fehler. Die häufigen
R&D-Runs haben messbaren Agendaertrag und werden durch Corp-Zieh- und
Installationsereignisse regelmäßig wieder informationsfrisch.

## Warum Corp im finalen Replay verlor

Die Corp scoret Hostile Takeover, Corporate Downsizing und später Project
Babylon für zusammen vier Punkte. Sie verliert dagegen sieben Punkte:

- vier Punkte durch die nun korrekt contestete Tycho Extension in Remote 1;
- drei Punkte aus R&D durch zwei Project Babylon und Executive Extraction.

Die Niederlage ist überwiegend ein Deck-/Rig-Matchup mit einem möglichen
veränderbaren Defense-Muster:

- Chrome Rush Bureau stellt in diesem Match fast ausschließlich Walls und
  Code Gates. Wizard’s Book und Worm sind dafür ein nahezu perfektes
  Gegenstück; am Ende kann der Runner alle vier R&D-Schichten passieren.
- Corp reagiert auf den sichtbaren R&D-Druck und installiert D149 Sleeper,
  D172 Data Wall 2.0 und D191 Wall of Static zusätzlich zum frühen Filter.
  Die drei neuen ICE erzeugen gegen das sichtbare Rig später keinen
  Access-Stop; selbst bei ausreichenden Credits lehnt die Corp ihre Rezzes als
  unproduktiven Ressourcentausch ab.
- Diese Decline-Rez-Entscheidungen sind für sich plausibel. Prüfbedürftig ist
  die vorgelagerte Allokation von drei zusätzlichen, bereits passend
  abgedeckten ICE nach R&D. Ein sicher besseres legales Installationsziel oder
  eine schnellere Score-Linie ist für die drei historischen Zustände noch
  nicht belegt.
- Die Corp wandelt ihre tatsächlich erreichbaren Scorefenster sauber um. Die
  finale Project-Babylon-Linie D304–D308 scoret trotz Runner-Matchpoint im
  selben Zug und ist kein Fehler.

Gesamturteil: Der ursprüngliche Runner-Fehler ist vollständig behoben und
ändert den Sieger. Der finale Corp-Verlust lässt sich durch das ungünstige
ICE-/Breaker-Matchup, wiederholten erfolgreichen R&D-Druck und die gestohlene
Vier-Punkte-Agenda erklären. Die R&D-Allokation verdichtet einen bestehenden
Verdacht, trägt aber noch keinen weiteren Fix.

## Verifikation und Dokumentationsprüfung

- Der neue Drei-Schritt-Ownership-Test und zwei angrenzende Coverage-Tests
  bestehen.
- Der vollständige identische Replaylauf endet regulär und enthält 322
  persistierte Detailentscheidungen ohne Fallback, Timeout, Apply- oder
  LegalAction-Abweichung.
- Der AI-Typecheck erreicht ausschließlich sechs vorbestehende
  Baselinefehler: zwei `possibly undefined`-Diagnosen außerhalb der
  geänderten Pfade und vier fehlende CardSpec-Migrationsreports. Keine
  Diagnose betrifft den Zyklusfix.
- Die Architekturdokumentation beschreibt nun ausdrücklich die enge
  CardSpec-Projektion einer aktuell nur unbezahlbaren bekannten
  Handinstallation, die zwingende Rematerialisierung und die fortbestehende
  Parentbindung.

Die zyklusübergreifende Verdichtung liegt in
[der KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).

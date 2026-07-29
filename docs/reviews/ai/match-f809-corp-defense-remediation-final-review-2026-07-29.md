# Match f809 – Abschlussreview der Corp-Verteidigung

Stand: 2026-07-29

Status: abgeschlossen

## Ergebnis

Das jüngste nicht abgeschlossene KI-Spiel
`match_f8096c690c233533` wurde vollständig geprüft. Der Nenner ist
geschlossen:

- 46 erwartete Corp-KI-Entscheidungen;
- 46 gespeicherte Decision-Traces;
- 0 fehlende, doppelte oder verwaiste Entscheidungen;
- 0 Abweichungen zwischen ausgeführtem Action-Type und Trace.

Klare Fehler lagen bei D10, D13 bis D15, D30, D34 und D45. D45 ist kein
pauschaler „ICE muss immer installiert werden“-Fall: Bei drei Credits und
einem verbleibenden Klick erreichen `installieren → im nächsten Corp-Zug
ansparen` und `ansparen → im nächsten Corp-Zug installieren` denselben
frühesten Rez-Zeitpunkt. Die erste Route verbraucht den Installationsklick
früher und erzeugt während des dazwischenliegenden Runner-Zugs zusätzlich
einen begrenzten Bluff- und Abschreckungswert. Genau auf diesen endlichen,
druckgebundenen Fall ist die neue Staging-Regel beschränkt.

Alle Installations-, Staging-, Bluff- und Rez-Hilfe-Entscheidungen gehören
weiterhin ausschließlich `corp.defend_servers`. `corp.economy` darf nur den
exakt bezifferten Finanzierungsbedarf dieses Defense-Parents bedienen.
Handmanagement darf ein bereits bewertetes Defense-Paket bei einer
Behalten-Auswahl erhalten, besitzt aber keine eigene ICE-Policy und keine
Installations- oder Rez-Aktion.

## Bewertung jeder einzelnen KI-Entscheidung

Die Bewertung verwendet nur den jeweiligen LegalAction-Zustand, die
side-sichere PlayerView, den bis dahin sichtbaren Verlauf und den
gespeicherten Decision-Trace. Spätere Spielergebnisse werden nicht
rückwirkend als Wissen der KI behandelt.

| D | SV | Ausgeführte Corp-Aktion | Bewertung | Begründung |
| ---: | ---: | --- | --- | --- |
| 1 | 1 | Korp-Starthand auflösen | Zwang / korrekt | Engine-Choice ohne strategische Alternative; Trace und Aktion stimmen überein. |
| 2 | 2 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn, keine freie KI-Abwägung. |
| 3 | 3 | 1 Credit nehmen | Vertretbar | Frühe Liquidität hält mehrere Handkarten offen; Agenda-Installation oder `Efficiency Experts` waren möglich, aber kein klar dominierender Sofortpfad. |
| 4 | 4 | `Walking Wall` auf HQ installieren | Vertretbar | Erste zentrale Schutzschicht bei noch nicht eindeutigem HQ/R&D-Vorrang. Dass R&D später offen blieb, macht diesen einzelnen Opening-Schritt nicht rückwirkend falsch. |
| 5 | 5 | `Efficiency Experts` spielen | Gut | Konkrete Economy-Konvertierung ist besser als ein einzelner Basic Credit und finanziert spätere ICE-/Score-Routen. |
| 6 | 6 | Zug beenden | Zwang / korrekt | Aktionskapazität war ausgeschöpft. |
| 7 | 13 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 8 | 14 | 1 Credit nehmen | Vertretbar | Bereitet die unmittelbar folgende `Credit Consolidation`-Schwelle vor. |
| 9 | 15 | `Credit Consolidation` spielen | Gut | Garantierte Economy-Konvertierung mit höherem Ertrag als ein Basic Credit. |
| 10 | 16 | 1 Credit nehmen | Fehler, behoben | Letzter Klick, R&D nach erfolgreichem Zugriff offen und ein finanzierbarer ICE-Pfad vorhanden. Installation unter `corp.defend_servers` ist konkreter Fortschritt und erreicht Rez-Bereitschaft ohne Verzögerung. |
| 11 | 17 | Zug beenden | Zwang nach Fehlentscheidung | Das Ende selbst war legal und mangels Klicks erzwungen; der relevante Fehler liegt in D10. |
| 12 | 24 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 13 | 25 | 1 Credit nehmen | Fehler, behoben | Wiederholter sichtbarer R&D-Druck und ein ausführbares Paket aus ICE plus legaler Rez-Hilfe waren vorhanden. Der Defense-Plan besaß zuvor keinen revalidierbaren Parent für diese Folge. |
| 14 | 26 | 1 Credit nehmen | Fehlerfolge, behoben | Gleiche Ursache wie D13: Die KI wiederholte Economy, weil die Defense-Sequenz nicht materialisiert werden konnte. |
| 15 | 27 | 1 Credit nehmen | Fehlerfolge, behoben | Dritter Wiederholungsfall derselben fehlenden Installations-/Rez-Hilfe-Route; kein eigenständiger neuer Fehlermechanismus. |
| 16 | 28 | Zug beenden | Zwang nach Fehlerfolge | Nach Verbrauch aller Klicks korrekt; D13 bis D15 sind die zu behebenden Entscheidungen. |
| 17 | 33 | `Walking Wall` im HQ-Run rezzen | Gut | Reale Run-Defense im passenden Rezfenster; LegalAction, Ziel und Kosten waren aktuell. |
| 18 | 38 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 19 | 39 | ICE auf neuem Remote installieren | Vertretbar | Legt eine konkrete Scoring-Remote-Verteidigung an; zu diesem Zeitpunkt kein Beleg, dass eine zentrale Route eindeutig dominierte. |
| 20 | 40 | `Project Venice` in `remote_1` installieren | Gut | Nutzt den vorbereiteten Remote für eine konkrete Agenda-Scoreline. |
| 21 | 41 | `Project Venice` voranbringen | Gut | Konsequente Fortsetzung des begonnenen, sichtbaren Scoreprojekts. |
| 22 | 42 | Zug beenden | Zwang / korrekt | Keine verbleibende Aktionskapazität. |
| 23 | 50 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 24 | 51 | `Project Venice` voranbringen | Gut | Konkrete Score-Konvertierung bleibt gegenüber Hintergrundentwicklung vorrangig. |
| 25 | 52 | `Project Venice` voranbringen | Gut | Erreicht die Score-Schwelle ohne erkennbaren besseren Zwischenzug. |
| 26 | 53 | `Project Venice` voranbringen | Gut | Letzter erforderlicher Fortschritt der gebundenen Scoreline. |
| 27 | 54 | `Project Venice` scoren | Gut | Garantierte Agenda-Konvertierung; kein Grund zum Aufschub. |
| 28 | 55 | Zug beenden | Zwang / korrekt | Aktionskapazität ausgeschöpft. |
| 29 | 61 | verdeckte Credit-/Guess-Choice auflösen | Ursache unklar | Die gespeicherte side-sichere Evidence zeigt weder den intern gewählten verdeckten Wert noch eine vergleichbare Gebots-/Guess-Nutzenrechnung. Eine belastbare Qualitätsbewertung wäre Spekulation. |
| 30 | 66 | HQ-Behalten-Zahlung auflösen | Fehler, behoben | Die alte Auswahl bewertete Karten einzeln, behielt zwei teure ICE und verwarf Rez-Hilfen. Ein Set aus `Credit Blocks` und `Rent-to-Own Contract` war unter dem sichtbaren R&D-Druck das ausführbare Defense-Paket. |
| 31 | 68 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 32 | 69 | 1 Credit nehmen | Vertretbar | Baut die konkrete Liquidität für die offene R&D-Verteidigung auf. |
| 33 | 70 | 1 Credit nehmen | Vertretbar | Zweiter notwendiger Finanzierungsschritt; noch keine klar bessere sofort finanzierte Installation. |
| 34 | 71 | 1 Credit nehmen | Fehler, behoben | Mit dem letzten Klick war R&D-ICE nun finanzierbar. Ein weiterer Credit verschob nur den bereits erreichbaren Defense-Fortschritt. |
| 35 | 72 | Zug beenden | Zwang nach Fehlentscheidung | Das Zugende war erzwungen; D34 war die relevante Abzweigung. |
| 36 | 80 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 37 | 81 | `Project Zurich` in `remote_1` installieren | Prüfbedürftig, nicht behoben | Die Route ist aggressiv und die Agenda wurde später gestohlen. Der spätere Verlust beweist jedoch nicht, dass Installation im damaligen sichtbaren Zustand falsch war; es fehlt eine belastbare Gegenrechnung von Contest-Kosten, Score-Horizont und Remote-Schutz. |
| 38 | 82 | `Project Zurich` voranbringen | Bedingt vertretbar | Nach D37 ist das Advancement eine kohärente Fortsetzung. Seine Qualität hängt von der noch offenen Bewertung der ursprünglichen Installation ab. |
| 39 | 83 | `Project Zurich` voranbringen | Bedingt vertretbar | Gleiche Einordnung wie D38; kein separater klarer Implementierungsfehler belegt. |
| 40 | 84 | Zug beenden | Zwang / korrekt | Aktionskapazität ausgeschöpft. |
| 41 | 89 | `Bug Zapper` rezzen | Vertretbar | Reale Defense im aktuellen Run-/Rezkontext; kein Beleg für eine dominierende Decline-Route. |
| 42 | 97 | Pflichtkarte ziehen | Zwang / korrekt | Obligatorischer Zugbeginn. |
| 43 | 98 | 1 Credit nehmen | Gut | Von einem Credit auf zwei; exakte Vorbereitung des späteren R&D-Rez-Horizonts. |
| 44 | 99 | 1 Credit nehmen | Gut | Von zwei auf drei; erreicht die Schwelle, an der Installation jetzt und Ansparen später denselben Rez-Zeitpunkt wie umgekehrte Reihenfolge haben. |
| 45 | 100 | 1 Credit nehmen | Fehler, behoben | Letzter Klick bei drei Credits und akut offenem R&D. Dosiertes Staging verbraucht Installation und Klick jetzt, hält denselben frühesten Rez-Zeitpunkt und erzeugt einen endlichen Bluffwert im Runner-Zug. |
| 46 | 101 | Zug beenden | Zwang nach Fehlentscheidung | Das Ende war mangels Klicks korrekt; D45 war die relevante falsche Abzweigung. |

## Behobene Ursachen

### 1. Variable ICE-Rez-Auswahl wurde gegen den falschen Modus validiert

Die Aktualitätsprüfung verlangte bei variablen ICE teilweise die teurere
Alternativkonfiguration, obwohl die Engine-Projektion eine andere gültige
Basis- oder Modusauswahl gewählt hatte. Die Prüfung vergleicht jetzt die
tatsächlich projizierte Auswahl mit der aktuellen LegalAction-Quote.

### 2. Eine gestagte Route hatte noch keine aktuell bezahlte Rez-Auswahl

Bei einer absichtlich noch unterfinanzierten Installation ist
`selectedRezCosts` erwartungsgemäß leer. Die Route wurde deshalb verworfen,
obwohl die Engine bereits eine günstigste später schützende
`minimumSatisfyingRezCosts`-Konfiguration kannte. Nur
`staged_central_defense` darf diese Zukunftskonfiguration zur
Aktualitätsprüfung nutzen; bestehende direkte Installationsrouten behalten
ihren strengeren Vertrag.

### 3. Installieren und Rez-Hilfe hatten keinen gemeinsamen Defense-Parent

Rez-Hilfe-Operationen wurden vor der Installation mangels Ziel ausgeschlossen.
Der Defense-Plan darf nun eine mögliche Hilfe als Folge markieren, installiert
zuerst und revalidiert danach vollständig LegalAction, Ziel, Timing, Kosten,
Liability, Zentraldruck und Score-Reserve. Ohne aktuellen Beleg entsteht keine
Folgeaktion.

### 4. HQ-Behalten bewertete Einzelkarten statt ausführbarer Sets

Die Zahlungsauswahl enumeriert die erlaubten Behalten-Sets und addiert nur
unter akutem sichtbarem Zentraldruck eine side-sichere, begrenzte
Defense-Paketquote. Bereits geschützte Centrals oder fehlender Druck ergeben
keinen Bonus. Die umgekehrte Choice-Semantik
„ausgewählt = gegen Zahlung behalten“ ist im Checkpoint-Runner korrekt
abgebildet.

## Bewusst offene, nicht eindeutig behebbare Punkte

1. **D29 – verdeckte Gebots-/Guess-Qualität:** Für eine sichere Beurteilung
   fehlt eine nicht-leakende Trace-Evidence über Policy, erlaubten Wertebereich
   und Nutzenklasse. Rohwerte dürfen wegen Hidden Info nicht öffentlich
   persistiert werden.
2. **D37 – Risiko der `Project Zurich`-Installation:** Ein einzelner späterer
   Steal genügt nicht als Kausalbeleg. Erforderlich wäre eine kleine
   Szenariomatrix mit sichtbaren Contest-Kosten, Runner-Credits,
   Remote-ICE-Pfad und Score-Horizont.
3. **Observability verdeckter Choices:** Eine künftige Verbesserung sollte
   side-sichere Kategorien wie `minimum`, `balanced`, `maximum` sowie
   anonymisierte Nutzenabstände persistieren, nicht die verdeckten Werte
   selbst. Das ist ein eigener Trace-Vertrag und wurde hier nicht nebenbei
   verändert.

## Verifikation

- fünf historische Zielcheckpoints zunächst unverändert rot ausschließlich
  mit `behavior_regression`, danach unverändert grün;
- F809-Ziel- und Gegenproben: 10/10 grün;
- kombinierte vorher betroffene Baselines: 49/49 grün;
- vollständige AI-Suite: 518/518 Testdateien und 4.248/4.248 Tests grün;
- `@netgrid/ai`-Typecheck grün;
- Deck-Hint-Consumer-Audit für
  `Proteus Korp - Variable ICE Gauntlet`: Status `ok`, 30 unterschiedliche
  und 45 Karten, 0 Ausschlüsse, 0 Blocker, 0 Warnungen;
- Audit-Checkpoint D10 wählt legal
  `Credit Blocks` auf R&D und besteht seine Behavior-Erwartung;
- Server-Health vor dem abschließenden Audit grün; keine Server-, Port- oder
  Datenbankmutation aus dem Worktree;
- `git diff --check` grün.

## Führende Artefakte

- Prozess:
  `docs/architecture/ai/ai-match-f809-rd-defense-remediation-process-2026-07-29.md`
- historische rote Evidence:
  `docs/reviews/ai/match-f809-corp-defense-red-evidence-2026-07-29.md`
- fünf gespeicherte Checkpoints:
  `data/scenarios/ai-decision-checkpoints/cp-f809-01-rd-funded-last-click-d10.json`
  bis
  `data/scenarios/ai-decision-checkpoints/cp-f809-05-rd-staged-bluff-last-click-d45.json`
- Regressionen:
  `packages/ai/src/evaluation/decision-checkpoints/match-f809-corp-defense-decision-checkpoints.test.ts`


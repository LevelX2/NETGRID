# Match A36A9664: Vollständiger Entscheidungs-Audit der Corp-KI

Stand: 2026-07-30

Match: `match_a36a9664458303fc`

Modus: `human_runner_vs_corp_ai`

Ergebnis: Runner-Sieg durch 7 Agendapunkte, StateVersion 287

## Analyseabdeckung

Die Analyse umfasst alle 124 gespeicherten Corp-KI-Entscheidungen. Jede
Entscheidung wurde gegen die damaligen LegalActions, die private
Corp-PlayerView, den Plan-first-Debugtrace und die Folgeereignisse geprüft.
Die Hand des menschlichen Spielers wurde nicht benötigt.

- Erstellt: `2026-07-30T17:32:43.520Z`
- Beendet: `2026-07-30T19:07:38.615Z`
- Seed: `match-ms7sk6it-p5hms1`
- Endzustand: Corp 5, Runner 7 Agendapunkte
- Erwartete Entscheidungen: 124
- Gefundene Traces: 124
- Eindeutig zugeordnete Entscheidungen: 124
- Fehlende, verwaiste, doppelte oder versionsfalsch zugeordnete Traces: 0
- Events/Snapshots: 288/288
- StateHash: `fnv1a:fa842e74`
- Ergebnis: vollständige und konsistente Evidence-Kette

Das geprüfte Corp-Deck enthält keine Karte namens „Resurgent Development“.
Seine Agendas heißen `Corporate Downsizing` und `Corporate War`. Die
Beobachtung eines ungenügend geschützten Agenda-Remotes ist trotzdem richtig:
Sie betrifft in diesem Match zuerst `Corporate War` und danach
`Corporate Downsizing`.

## Gesamturteil

Der Eindruck „nach hinten hin wieder sehr passiv“ ist richtig. Das Spiel zeigt
aber nicht einen einzigen Passivitätsfehler, sondern fünf getrennte
Planungsdefekte:

1. Der Vapor-Ops-Plan legt die Agenda absichtlich in denselben Remote wie
   Vapor Ops. Die Installation ersetzt und trasht dadurch das Asset, bevor
   dessen drei Advancement Counter übertragen werden können. Der Test
   schreibt diese unmögliche Linie derzeit sogar positiv fest.
2. Der Scoring-Plan behandelt „ICE vorhanden“ beziehungsweise eine
   augenblicklich günstige Zugriffsprojektion zu leicht als ausreichenden
   Schutz. Sichtbare Breaker und die für spätere Züge benötigte Rez-Reserve
   werden nicht zuverlässig in die gesamte Agenda-Linie gebunden.
3. Zusätzliches ICE gilt häufig als unproduktiv, wenn es die exakt
   prognostizierte aktuelle Zugriffsquote nicht sofort verbessert. Das ist für
   mehrzügige Agenda-Pläne zu kurzsichtig.
4. Kann die zentrale Verteidigung den Bedarf nicht exakt bestimmen, wird das
   Ergebnis im Fallback faktisch zu „weiteres Zentral-ICE vertagen“. Bei fünf
   Runner-Punkten führte genau das zum tödlichen R&D-Zugriff.
5. Zugabschluss und Handüberlauf können produktive Aktionen verdrängen:
   einmal endete die Corp mit zwei ungenutzten normalen Aktionen; später
   spielte sie Overtime Incentives nur als teure Handgrößenbereinigung.

Die Kartendaten und Deck-Hinweise sind nicht die Ursache. Der verpflichtende
Consumer-Audit erfasste alle 45 Karten und alle 16 eindeutigen
Kartendefinitionen ohne Blocker oder Warnung. Die Fehler liegen in
Planmodulen, LegalAction-Projektion und Planarbitration.

## Zentrale Befunde und Ursachen

### 1. Vapor Ops wird durch den eigenen Plan zerstört

Die konkrete Sequenz:

- D48 installiert Vapor Ops in `remote_1`.
- D49, D59 und D60 legen insgesamt drei Advancement Counter darauf.
- Die drei Counter bleiben bis Zug 31 ungenutzt.
- D101 installiert Corporate War in genau denselben Remote.
- Die LegalAction weist ausdrücklich
  `rootReplacement: "asset_to_agenda"` aus.
- Die Engine ersetzt das Root-Asset regelkonform und trasht Vapor Ops.
- D102 bis D105 verwenden anschließend Systematic Layoffs plus normales
  Advancen, um Corporate War ohne Vapor Ops zu scoren.

Das ist kein zufälliger Ausführungsfehler. In
`corp-counter-bank-score-plan.ts` verlangt
`counterBankAgendaInstallProjects`, dass die Agenda auf demselben Server wie
die Counter Bank installiert wird. Der zugehörige Unit-Test erwartet genau
diese Auswahl. Der spätere Handoff-Schritt setzt dagegen voraus, dass Agenda
und Bank gleichzeitig installiert sind. Bei einem Root-Asset und einer
Agenda ist diese Zustandsannahme unmöglich.

Die korrekte generische Linie wäre gewesen:

1. Vapor Ops in seinem Remote behalten,
2. Corporate War in einen anderen oder neuen Remote installieren,
3. Vapor Ops rezzen,
4. die drei Counter mit der Kartenfähigkeit auf die Agenda übertragen,
5. die Agenda scoren.

Auf D101 waren dafür 15 Credits, drei Aktionen, eine vollständig geladene
Counter Bank und Corporate War auf HQ vorhanden. Die falsche Linie war also
nicht alternativlos.

**Klare Fehlerursache:** Der Counter-Bank-Plan ignoriert
`rootReplacement` und bindet Quelle und Ziel fälschlich an denselben
Root-Slot.

**Erforderliche Änderung:** Quelle und Ziel müssen getrennte konkrete
Installationsobjekte sein. Eine Agenda-Installation, die die gebundene Bank
ersetzen würde, darf für den Handoff-Plan nicht angeboten werden. Der
bestehende Positivtest muss in einen Negativtest für Same-Root-Replacement
und einen Positivtest für Cross-Remote-Handoff umgebaut werden.

### 2. Die erste Corporate War wurde sichtbar unsicher installiert

D23 installierte Wall of Static in einem neuen Remote, D24 legte Corporate
War dahinter. Die Corp konnte zu diesem Zeitpunkt Rent-I-Con, The Shell
Traders und einen beiseitegelegten Cloak sowie vier Runner-Credits sehen.
Der Runner startete den Run, die Corp rezzte Wall of Static, Rent-I-Con brach
die Subroutine, und Corporate War wurde gestohlen.

Ein früher Rush hinter nur einem ICE kann grundsätzlich sinnvoll sein. Hier
war er aber keine vernünftige Blindwette: Der konkrete sichtbare Breaker
konnte das einzige ICE überwinden. Erst D29 legte ein zweites ICE vor den
Remote – nach dem Diebstahl. Die Aussage „nie ein zweites ICE“ ist für diesen
Remote daher nicht wörtlich richtig; richtig ist, dass es für den ersten
Scoringversuch zu spät kam.

**Klare Fehlerursache:** Mindestens ein Zulassungspfad behandelte den Remote
als geschützt beziehungsweise die Projektlinie als vertretbar, obwohl die
sichtbare Runner-Ausstattung das einzige ICE konkret beantworten konnte. Der
ältere taktische Pfad verwendet dafür teilweise schon `ice.length > 0`; im
Plan-first-Pfad konnte die genaue Schutzprojektion die Agenda-Installation
ebenfalls nicht wirksam sperren.

**Erforderliche Änderung:** Ein Agenda-Projekt darf „ein ICE“ nicht mit
„nutzbarer Schutz“ gleichsetzen. Für die geplante Laufzeit müssen sichtbare
Breaker, Runner-Zahlungsmittel, Rez-Kosten und die erwartete
Schutzentwicklung gemeinsam bewertet werden.

### 3. Die zweite Agenda hatte eine finanzierte zweite Schicht, die nicht gerezzt wurde

D42 installierte Corporate Downsizing in denselben Remote. Zu diesem
Zeitpunkt lagen dort die gerezzte Wall of Static und die ungerezzte Data
Wall. Nach D44 besaß die Corp noch zwei Credits. Das anschließende Advance
ließ einen Credit übrig; der exakte Engine-Rez-Preis von Data Wall betrug
ebenfalls einen Credit. Beim Runner-Angriff auf D46 lehnte die KI das Rezzen
dennoch mit
`corp_rez_rejected_by_exact_window_assessment:corp_ice_rez_resource_exchange_unknown`
ab. Corporate Downsizing wurde gestohlen.

Das ist nicht in erster Linie ein ICE-Anzahlfehler. Die zweite Schicht war
vorhanden und exakt bezahlbar. Die bekannte Vorher-/Nachher-Bewertung zeigte
zudem, dass das Rezzen dem Runner einen zusätzlichen Credit auf seinem besten
Zugriffspfad abverlangt. Weil die Zugriffs-Wahrscheinlichkeit dabei gleich
blieb und die Engine im Mehr-ICE-Kontext keinen vollständigen
Einzel-Resource-Exchange-Quote ausgab, wertete der Defense-Plan diese sichere
Steuerwirkung trotzdem nicht als produktive Rez-Route.

**Klare Fehlerursache:** Der Rez-Teil des Defense-Plans erkennt eine
engine-berechnete positive Zugriffspfad-Steuerwirkung nicht, wenn die
Zugriffs-Wahrscheinlichkeit unverändert bleibt und der engere
Resource-Exchange-Quote unvollständig ist.

**Erforderliche Änderung:** Im exakten Rez-Fenster darf der Defense-Plan eine
bezahlte ICE-Aktivierung als produktiv erkennen, wenn das angegriffene
Agenda-Remote, die aktuell erreichte ICE-Instanz und eine positive Differenz
der bekannten Runner-Restcredits eindeutig gebunden sind. Unvollständige
Quotes, andere ICE-Positionen und leere Remotes bleiben ausgeschlossen.

### 4. Zusätzliches ICE wird ohne sofortigen exakten Effekt zu häufig verworfen

In den Traces wurden weitere ICE-Installationen regelmäßig mit

- `corp_ice_install_has_no_engine_certified_access_probability_reduction`
  oder
- `corp_additional_central_ice_deferred_without_exact_route:{hq|rd}`

als nicht produktiv ausgeschlossen.

Die Defense-Disposition verlangt damit oft eine sofort nachweisbare
Verbesserung der gegenwärtigen Zugriffsquote. Das reicht für einen
mehrzügigen Scoring-Plan nicht: Eine heute noch ausreichende Schicht kann
nach Runner-Entwicklung oder bei fehlender Rez-Reserve im nächsten Zug
unzureichend sein. Ein zusätzliches ungerezztes ICE kann außerdem gestuften
Schutz, Steuerwirkung oder Bluffwert besitzen, ohne die heutige Quote bereits
exakt zu senken.

**Klare Fehlerursache:** Der kurzfristige Exact-Route-Nachweis dominiert den
Defense-Horizont des Agenda-Plans. Bei vermeintlich bereits geschützten
Servern werden weitere Schichten deshalb nicht als vorbereitende
Planaktionen zugelassen.

**Erforderliche Änderung:** Der Defense-Plan muss für gebundene
Agenda-Projekte ein planklassenabhängiges Zielband liefern, nicht eine
globale Drei-ICE-Regel. Ein Rush darf bei bewusst akzeptiertem Risiko mit
weniger Schutz arbeiten; ein langsamer, mehrzügiger Plan muss dagegen
zusätzliche finanzierbare Schichten einplanen können.

### 5. Terminale R&D-Gefahr wird bei unvollständiger Evidence vertagt

Nach D106 stand es 5:5. In den Zügen 33 bis 37 nahm die Corp überwiegend
Credits beziehungsweise finanzierte Accounts Receivable. Nach D120 besaß sie
neun Credits und mehrere ICE auf HQ, darunter Data Wall, Wall of Static und
Snowbank. Auf D122 war ein weiteres R&D-ICE legal, wurde aber mit
`corp_additional_central_ice_deferred_without_exact_route:rd` ausgeschlossen.
Die KI nahm stattdessen einen Credit und beendete den Zug. Der Runner lief
sofort auf R&D, bezahlte die eine bestehende Steuerschicht, griff auf
Corporate Downsizing zu und gewann.

Die zentrale Defense-Adaption kann bei unvollständigen Required Facts
`unknown` liefern. Der nachfolgende Fallback vertagt zusätzliches
Zentral-ICE, sobald HQ und R&D nominell schon jeweils mindestens eine
ICE-Schicht haben. Ausgerechnet bei terminaler Gefahr wird fehlende
Bewertungssicherheit so wie ein Entwarnungssignal behandelt.

**Klare Fehlerursache:** `unknown` fällt im zusätzlichen
Zentralverteidigungspfad zu einem expliziten „nicht produktiv/vertagen“
herunter. Bei fünf Runner-Punkten hätte die mögliche 2+-Punkte-Agenda in R&D
den Terminalstatus bestimmen müssen.

**Erforderliche Änderung:** Unvollständige Evidence darf bei terminaler
Zentralgefahr nicht zum sicheren Ausschluss einer legalen Defense-Aktion
führen. Der Defense-Plan braucht einen konservativen, aber planinternen
Fallback, der Agendapunkt-Risiko, vorhandene Schichten, bezahlbare
ICE-Alternativen und verbleibende Aktionen abwägt.

### 6. Corporate War wurde mit falschem Routenbudget vorbereitet

Corporate War belohnt zwölf verbleibende Corp-Credits beim Scoren; andernfalls
verliert die Corp alle Credits. Die KI nahm in Zug 27 und 29 insgesamt sechs
Basis-Credits und wartete bis Zug 31. Dann kostete Systematic Layoffs fünf
Credits und das normale Advancement einen weiteren Credit. Die Corp scorete
mit neun verbleibenden Credits und verlor sie vollständig.

Das Scoren unter zwölf Credits war in der konkreten Endspiellage nicht
automatisch falsch: Der Runner stand bereits bei fünf Punkten, und Corporate
War brachte die Corp ebenfalls auf fünf. Der Fehler liegt in den zwei
passiven Vorbereitungszügen und im falschen Budget. Der Reservewert rechnete
sinngemäß mit zwölf Credits plus drei normalen Advancement-Kosten, nicht mit
den vollen Kosten der tatsächlich gewählten Beschleunigungsroute.

**Klare Fehlerursache:** Die Mindestreserve wird nicht aus der am Ende
ausgewählten vollständigen Route berechnet. Gleichzeitig wurde die bereits
geladene Vapor-Ops-Route wegen Befund 1 nicht nutzbar.

**Erforderliche Änderung:** Der Zugplaner muss das Budget der konkreten
Kandidatenroute einschließlich Operations-, Installations-, Advance-, Rez-
und Fähigkeitskosten berechnen. Eine Notfallwertung darf Corporate War
weiterhin unterhalb des Schwellenwerts scoren; sie muss dann ausdrücklich
den verhinderten Spielverlust gegen den Economy-Verlust abwägen.

### 7. Zwei normale Aktionen wurden ohne Nutzen aufgegeben

D10 nahm in Zug 3 einen Credit. D11 beendete danach den Zug mit zwei
verbleibenden normalen Corp-Aktionen und löste sogar noch einen Abwurf aus.
Weitere Basis-Credits und Draw waren legal.

Der Turn-Completion-Plan darf den Zug beenden, wenn alle anderen Aktionen als
`explicitly_nonproductive` gelten. Der Basis-Credit wird schon dann so
klassifiziert, wenn der sichtbare Liquiditätszielwert erreicht ist. Dadurch
kann der Abschlussplan normale Aktionskapazität als entbehrlich behandeln.
Der Debugtrace bezeichnete die aufgegebenen normalen Aktionen sogar als
`forgo_restricted_capacity`.

**Klare Fehlerursache:** „Aktuelles Liquiditätsziel erfüllt“ macht einen
kostenlosen Basis-Credit nicht negativ genug, um zwei normale Aktionen
vollständig aufzugeben. Außerdem unterscheidet die Abschlussbegründung
normale und wirklich eingeschränkte Aktionskapazität nicht zuverlässig.

**Erforderliche Änderung:** Frühes Zugende mit normalen, legal nutzbaren
Aktionen benötigt einen außergewöhnlichen, regel- oder planbegründeten
Nachweis. Ein gesättigter Economy-Plan darf den Credit abwerten, aber nicht
ohne bessere Verwendung zum ersatzlosen Verlust normaler Aktionen führen.

### 8. Overtime Incentives wurde als teure Abwurfvermeidung missbraucht

D75 spielte Overtime Incentives bei fünf Credits, drei Aktionen, sechs Karten
auf HQ und ohne Agenda auf HQ. Die Operation kostete vier Credits und gab
netto eine zusätzliche Aktion. Danach zog die KI eine Karte und nahm drei
Credits. Ohne Operation hätte sie ziehen, zwei Credits nehmen und am Ende
drei Credits mehr besitzen können.

Die Handüberlauf-Konversion akzeptiert derzeit grundsätzlich eine Operation,
wenn sie eine Handkarte verbraucht und die Handgröße senkt. Sie verlangt bei
einer Action-Capacity-Karte aber keinen gebundenen Bedarf für die zusätzlich
gewonnenen Aktionen. Damit umgeht der Handmanagement-Plan die bereits
vorhandene, strengere Action-Capacity-Routenplanung.

**Klare Fehlerursache:** Das generische Overflow-Prädikat bewertet
Kartenverbrauch, aber nicht, ob die besondere Ressource der Operation in
einer konkreten Folgelinie verwendet wird.

**Erforderliche Änderung:** Action-Capacity-Operationen dürfen nur dann als
Handüberlauf-Konversion dienen, wenn ein zuständiges Planmodul die
zusätzlichen Aktionen an eine konkrete ausführbare Restzuglinie bindet, etwa
zum Schließen einer exakt festgestellten Scoring-Aktionslücke. Dafür ist
keine Sonderregel nach Kartenname nötig.

## Bewertung jeder einzelnen KI-Entscheidung

Legende:

- **Korrekt/vertretbar:** lokal sinnvoll oder unter den sichtbaren
  Informationen gut begründbar.
- **Erzwungen:** Pflichtschritt, Einzelauswahl oder Zugende ohne verbleibende
  Aktion. Das rehabilitiert keinen zuvor schlechten Gesamtplan.
- **Fehlerfolge:** Die Aktion ist innerhalb einer bereits falsch gewählten
  Linie nachvollziehbar, aber Teil ihres Schadens.
- **Struktureller Fehler:** Trace, Zustand und Alternativen belegen eine
  fehlerhafte Planungs- oder Bewertungsursache.
- **Prüffall:** Nicht sicher falsch, aber für ein belastbares Urteil fehlt
  noch eine engere Reproduktion oder Engine-Evidence.

| ID   | Zustand | Zug | Gewählte Aktion                                  | Urteil und Begründung                                                                                                                                                             |
| ---- | ------: | --: | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1   |     SV1 |   1 | Starthand behalten                               | **Korrekt/vertretbar.** Frühe Zentralverteidigung, Economy und Scoring-Material ergaben eine spielbare Hand.                                                                      |
| D2   |     SV2 |   1 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D3   |     SV3 |   1 | Data Wall vor HQ installieren                    | **Korrekt/vertretbar.** Günstige frühe HQ-Schicht.                                                                                                                                |
| D4   |     SV4 |   1 | Misleading Access Menus vor R&D installieren     | **Korrekt/vertretbar.** Beide Zentralserver waren nach Zug 1 abgedeckt.                                                                                                           |
| D5   |     SV5 |   1 | Karte ziehen                                     | **Korrekt/vertretbar.** Freier Handplatz und noch eine Aktion.                                                                                                                    |
| D6   |     SV6 |   1 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D7   |    SV10 |   2 | Misleading Access Menus rezzen                   | **Korrekt/vertretbar.** Direkte R&D-Steuer im Run.                                                                                                                                |
| D8   |    SV15 |   2 | Data Wall rezzen                                 | **Korrekt/vertretbar.** Direkte HQ-Verteidigung.                                                                                                                                  |
| D9   |    SV18 |   3 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D10  |    SV19 |   3 | 1 Credit                                         | **Korrekt/vertretbar.** Isoliert eine sichere Aktion.                                                                                                                             |
| D11  |    SV20 |   3 | Zug mit zwei Aktionen beenden                    | **Struktureller Fehler.** Zwei normale Aktionen wurden ohne kompensierenden Nutzen aufgegeben.                                                                                    |
| D12  |    SV21 |   3 | Vapor Ops abwerfen                               | **Korrekt/vertretbar.** Früher Handüberlauf; Scoring- und Defense-Material konnte höher priorisiert werden.                                                                       |
| D13  |    SV30 |   5 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D14  |    SV31 |   5 | Efficiency Experts spielen                       | **Korrekt/vertretbar.** Effiziente frühe Finanzierung.                                                                                                                            |
| D15  |    SV32 |   5 | Corporate Downsizing installieren                | **Korrekt/vertretbar.** Beginn einer schnellen, in diesem Fenster ausführbaren Scoring-Linie.                                                                                     |
| D16  |    SV33 |   5 | Management Shake-Up spielen                      | **Korrekt/vertretbar.** Stellte die benötigte Zusatzkapazität für den Zug her.                                                                                                    |
| D17  |    SV34 |   5 | Advancement-Ziele wählen                         | **Erzwungen/korrekt.** Die Wahl setzte die begonnene Scoring-Linie um.                                                                                                            |
| D18  |    SV35 |   5 | Corporate Downsizing scoren                      | **Korrekt/vertretbar.** Erfolgreicher Abschluss der gebundenen Linie.                                                                                                             |
| D19  |    SV36 |   5 | HQ-Agenda für Reveal-Effekt wählen               | **Korrekt/vertretbar.** Legale konkrete Zielwahl des Score-Effekts.                                                                                                               |
| D20  |    SV37 |   5 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D21  |    SV47 |   7 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D22  |    SV48 |   7 | Annual Reviews spielen                           | **Korrekt/vertretbar.** Schuf Informationen und Material für die Restplanung.                                                                                                     |
| D23  |    SV49 |   7 | Wall of Static in neuem Remote installieren      | **Fehlerfolge.** Ein Remote-Projekt war plausibel, aber das sichtbare Rent-I-Con beantwortete diese Einzelschicht.                                                                |
| D24  |    SV50 |   7 | Corporate War hinter Wall of Static installieren | **Struktureller Fehler.** Sichtbar überwindbarer Einzelschutz wurde als ausreichender Rush zugelassen.                                                                            |
| D25  |    SV51 |   7 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D26  |    SV55 |   8 | Wall of Static rezzen                            | **Korrekt/vertretbar.** Innerhalb des angegriffenen Remotes war die Steuerwirkung besser als kampfloses Aufgeben.                                                                 |
| D27  |    SV63 |   9 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D28  |    SV64 |   9 | Karte ziehen                                     | **Korrekt/vertretbar.** Suche nach neuem Score- und Entwicklungs­material.                                                                                                        |
| D29  |    SV65 |   9 | Data Wall vor Remote 1 installieren              | **Korrekt/vertretbar.** Zweite Schicht war sinnvoll, kam aber für die gestohlene Corporate War zu spät.                                                                           |
| D30  |    SV66 |   9 | 1 Credit                                         | **Korrekt/vertretbar.** Finanzierte künftige Entwicklung.                                                                                                                         |
| D31  |    SV67 |   9 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D32  |    SV75 |  11 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D33  |    SV76 |  11 | Karte ziehen                                     | **Korrekt/vertretbar.** Weiterhin vertretbare Materialsuche.                                                                                                                      |
| D34  |    SV77 |  11 | Chicago Branch in Remote 1 installieren          | **Korrekt/vertretbar.** Boardentwicklung und Handkonversion; der Root konkurrierte nicht mit einer aktuellen Agenda.                                                              |
| D35  |    SV78 |  11 | 1 Credit                                         | **Korrekt/vertretbar.** Letzte Finanzierungsaktion.                                                                                                                               |
| D36  |    SV79 |  11 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D37  |    SV86 |  12 | Data Wall nicht rezzen                           | **Prüffall.** Der Runner hatte sichtbare Werkzeuge; der Trace lieferte für die Mehrschichtroute keine belastbare Austauschquote.                                                  |
| D38  |    SV88 |  12 | Root-Karte nicht rezzen                          | **Korrekt/vertretbar.** Kein exakt gebundener Nutzen im aktuellen Run-Fenster.                                                                                                    |
| D39  |    SV89 |  12 | Weitere Rez-Option ablehnen                      | **Prüffall.** Ergebnis kann ökonomisch richtig sein, die Begründung blieb aber mehrschichtig unvollständig.                                                                       |
| D40  |    SV93 |  12 | Weitere Root-Rez-Option ablehnen                 | **Korrekt/vertretbar.** Kein nachgewiesener unmittelbarer Verteidigungsgewinn.                                                                                                    |
| D41  |    SV97 |  13 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D42  |    SV98 |  13 | Corporate Downsizing in Remote 1 installieren    | **Struktureller Fehler.** Die Mehrzuglinie besaß keine abgesicherte Rez-Reserve für die zweite ICE-Schicht.                                                                       |
| D43  |    SV99 |  13 | Corporate Downsizing advancen                    | **Struktureller Fehler.** Verbrauchte Schutzbudget ohne tragfähige Reaktion auf den erwartbaren Run.                                                                              |
| D44  |   SV100 |  13 | Corporate Downsizing advancen                    | **Struktureller Fehler.** Zweiter Advance vertiefte dieselbe unfinanzierte Linie.                                                                                                 |
| D45  |   SV101 |  13 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D46  |   SV106 |  14 | Data Wall nicht rezzen                           | **Fehlerfolge.** Bei nur einem Corp-Credit war der Verzicht nachvollziehbar; der Scoring-Plan hatte diesen Zustand selbst erzeugt.                                                |
| D47  |   SV114 |  15 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D48  |   SV115 |  15 | Vapor Ops in Remote 1 installieren               | **Korrekt/vertretbar.** Sinnvoller Beginn eines Counter-Bank-Projekts.                                                                                                            |
| D49  |   SV116 |  15 | Vapor Ops advancen                               | **Korrekt/vertretbar.** Erster gebundener Counter-Aufbau.                                                                                                                         |
| D50  |   SV117 |  15 | Karte ziehen                                     | **Korrekt/vertretbar.** Suche nach Agenda und Route.                                                                                                                              |
| D51  |   SV118 |  15 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D52  |   SV119 |  15 | Management Shake-Up abwerfen                     | **Korrekt/vertretbar.** Handüberlauf; aktuell keine gebundene Action-Capacity-Lücke.                                                                                              |
| D53  |   SV125 |  16 | Vapor Ops nicht rezzen                           | **Korrekt/vertretbar.** Noch kein ausführbarer Counter-Handoff.                                                                                                                   |
| D54  |   SV127 |  16 | Vapor Ops erneut nicht rezzen                    | **Korrekt/vertretbar.** Kein aktueller Nutzen.                                                                                                                                    |
| D55  |   SV128 |  16 | Root-Rez-Option ablehnen                         | **Korrekt/vertretbar.** Bank sollte nicht ohne Zielroute aktiviert werden.                                                                                                        |
| D56  |   SV132 |  16 | Weitere Root-Rez-Option ablehnen                 | **Korrekt/vertretbar.** Gleicher Run, keine neue Handoff-Lage.                                                                                                                    |
| D57  |   SV136 |  17 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D58  |   SV137 |  17 | Efficiency Experts spielen                       | **Korrekt/vertretbar.** Finanzierte Bankaufbau und Folgezüge.                                                                                                                     |
| D59  |   SV138 |  17 | Vapor Ops advancen                               | **Korrekt/vertretbar.** Zweiter Counter.                                                                                                                                          |
| D60  |   SV139 |  17 | Vapor Ops advancen                               | **Korrekt/vertretbar.** Bank war nun vollständig geladen.                                                                                                                         |
| D61  |   SV140 |  17 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D62  |   SV146 |  19 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D63  |   SV147 |  19 | Efficiency Experts spielen                       | **Korrekt/vertretbar.** Noch vertretbare Finanzierung bei bevorstehendem Scoringbedarf.                                                                                           |
| D64  |   SV148 |  19 | Karte ziehen                                     | **Korrekt/vertretbar.** Agenda-/Routensuche nach geschafftem Handplatz.                                                                                                           |
| D65  |   SV149 |  19 | 1 Credit                                         | **Korrekt/vertretbar.** Letzte Aktion und noch keine Agenda-Route.                                                                                                                |
| D66  |   SV150 |  19 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D67  |   SV151 |  19 | Systematic Layoffs abwerfen                      | **Korrekt/vertretbar.** Ohne Agenda auf HQ aktuell keine gebundene Beschleunigungsroute.                                                                                          |
| D68  |   SV160 |  21 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D69  |   SV161 |  21 | Misleading Access Menus vor HQ installieren      | **Korrekt/vertretbar.** Zusätzliche Zentralsteuer und Handkonversion.                                                                                                             |
| D70  |   SV162 |  21 | Karte ziehen                                     | **Korrekt/vertretbar.** Suche nach Score-Material.                                                                                                                                |
| D71  |   SV163 |  21 | 1 Credit                                         | **Korrekt/vertretbar.** Letzte Aktion.                                                                                                                                            |
| D72  |   SV164 |  21 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D73  |   SV165 |  21 | Chicago Branch abwerfen                          | **Korrekt/vertretbar.** Redundante Root-Entwicklung war schwächer als Bank, ICE und Economy.                                                                                      |
| D74  |   SV173 |  23 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D75  |   SV174 |  23 | Overtime Incentives spielen                      | **Struktureller Fehler.** Vier Credits nur zur Handentlastung; keine gebundene Verwendung der Zusatzaktion.                                                                       |
| D76  |   SV175 |  23 | Karte ziehen                                     | **Fehlerfolge.** Informationsgewinn war sinnvoll, aber die vorausgehende Kapazitätsoperation war unnötig.                                                                         |
| D77  |   SV176 |  23 | 1 Credit                                         | **Fehlerfolge.** Bestandteil der ökonomisch schlechteren Overtime-Linie.                                                                                                          |
| D78  |   SV177 |  23 | 1 Credit                                         | **Fehlerfolge.** Ohne Overtime hätte dieselbe Kernlinie mehr Credits behalten.                                                                                                    |
| D79  |   SV178 |  23 | 1 Credit                                         | **Fehlerfolge.** Verwendete die erkaufte Aktion ohne besonderen Mehrwert.                                                                                                         |
| D80  |   SV179 |  23 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D81  |   SV180 |  23 | Karte abwerfen                                   | **Korrekt/vertretbar.** Cleanup war nach der gewählten Linie regelnotwendig; kein Agenda-Abwurffehler belegt.                                                                     |
| D82  |   SV188 |  25 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D83  |   SV189 |  25 | 1 Credit                                         | **Korrekt/vertretbar.** Finanzierte die konkrete Accounts-Receivable-Linie.                                                                                                       |
| D84  |   SV190 |  25 | Accounts Receivable spielen                      | **Korrekt/vertretbar.** Bei niedrigerem Kreditstand effizient.                                                                                                                    |
| D85  |   SV191 |  25 | Karte ziehen                                     | **Korrekt/vertretbar.** Informationsschritt nach Handkonversion.                                                                                                                  |
| D86  |   SV192 |  25 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D87  |   SV193 |  25 | Zweite Vapor Ops abwerfen                        | **Korrekt/vertretbar.** Eine Bank war bereits vollständig geladen; die zweite Kopie war redundant.                                                                                |
| D88  |   SV202 |  27 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D89  |   SV203 |  27 | 1 Credit                                         | **Struktureller Fehler.** Geladene Bank und Corporate-War-Perspektive wurden nicht zu einer Route verbunden.                                                                      |
| D90  |   SV204 |  27 | 1 Credit                                         | **Struktureller Fehler.** Zweite passive Vorbereitung ohne korrektes Routenbudget.                                                                                                |
| D91  |   SV205 |  27 | 1 Credit                                         | **Struktureller Fehler.** Dritte Aktion ohne Board- oder Scorefortschritt.                                                                                                        |
| D92  |   SV206 |  27 | Zug beenden                                      | **Fehlerfolge.** Der Zugplan hatte keine Counter-Bank-Nutzung erzeugt.                                                                                                            |
| D93  |   SV207 |  27 | Karte abwerfen                                   | **Korrekt/vertretbar.** Kein klarer Agenda-Abwurffehler; der Schaden lag im ausgebliebenen Plan.                                                                                  |
| D94  |   SV217 |  29 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D95  |   SV218 |  29 | 1 Credit                                         | **Struktureller Fehler.** Weiteres Warten trotz geladener Bank.                                                                                                                   |
| D96  |   SV219 |  29 | 1 Credit                                         | **Struktureller Fehler.** Reserve wurde nicht aus einer konkreten Route berechnet.                                                                                                |
| D97  |   SV220 |  29 | 1 Credit                                         | **Struktureller Fehler.** Sechste passive Kreditaktion über zwei Züge.                                                                                                            |
| D98  |   SV221 |  29 | Zug beenden                                      | **Fehlerfolge.** Noch immer kein Agenda-/Bank-Handoff.                                                                                                                            |
| D99  |   SV222 |  29 | Karte abwerfen                                   | **Korrekt/vertretbar.** Kein kausaler Agenda-Abwurffehler belegt.                                                                                                                 |
| D100 |   SV230 |  31 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D101 |   SV231 |  31 | Corporate War über Vapor Ops installieren        | **Struktureller Fehler.** `rootReplacement` zerstörte die gebundene Counter Bank.                                                                                                 |
| D102 |   SV232 |  31 | Systematic Layoffs spielen                       | **Fehlerfolge.** Legal und beschleunigend, aber gegenüber dem möglichen Cross-Remote-Handoff klar unterlegen.                                                                     |
| D103 |   SV233 |  31 | Advancement-Ziel wählen                          | **Erzwungen/Fehlerfolge.** Innerhalb der falschen Layoffs-Linie war Corporate War das richtige Ziel.                                                                              |
| D104 |   SV234 |  31 | Corporate War advancen                           | **Fehlerfolge.** Vervollständigte die falsche und zu teure Route.                                                                                                                 |
| D105 |   SV235 |  31 | Corporate War scoren                             | **Fehlerfolge mit Notfallnutzen.** Verhinderte bei 5 Runner-Punkten ein unmittelbares Agenda-Verlustfenster, löste aber wegen des schlechten Routenbudgets den Creditverlust aus. |
| D106 |   SV236 |  31 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D107 |   SV248 |  33 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D108 |   SV249 |  33 | Karte ziehen                                     | **Korrekt/vertretbar.** Suche nach weiterer Agenda oder Entwicklung.                                                                                                              |
| D109 |   SV250 |  33 | 1 Credit                                         | **Korrekt/vertretbar.** Aufbau nach dem Corporate-War-Creditverlust.                                                                                                              |
| D110 |   SV251 |  33 | 1 Credit                                         | **Korrekt/vertretbar.** Weiterer notwendiger Wiederaufbau.                                                                                                                        |
| D111 |   SV252 |  33 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D112 |   SV253 |  33 | Karte abwerfen                                   | **Korrekt/vertretbar.** Kein belegter Agenda-Abwurf.                                                                                                                              |
| D113 |   SV262 |  35 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D114 |   SV263 |  35 | 1 Credit                                         | **Korrekt/vertretbar.** Accounts Receivable benötigte Finanzierung.                                                                                                               |
| D115 |   SV264 |  35 | 1 Credit                                         | **Korrekt/vertretbar.** Zweiter Schritt zum konkreten Operationsbudget.                                                                                                           |
| D116 |   SV265 |  35 | 1 Credit                                         | **Korrekt/vertretbar.** Erreichte das benötigte Kostenfenster.                                                                                                                    |
| D117 |   SV266 |  35 | Zug beenden                                      | **Erzwungen.**                                                                                                                                                                    |
| D118 |   SV267 |  35 | Karte abwerfen                                   | **Korrekt/vertretbar.** Handcleanup; kein eindeutiger strategischer Fehlabwurf.                                                                                                   |
| D119 |   SV276 |  37 | Pflichtkarte ziehen                              | **Erzwungen.**                                                                                                                                                                    |
| D120 |   SV277 |  37 | Accounts Receivable spielen                      | **Korrekt/vertretbar.** Nettogewinn und Handkonversion waren in dieser Economy-Lage sinnvoll.                                                                                     |
| D121 |   SV278 |  37 | Karte ziehen                                     | **Korrekt/vertretbar.** Bei 5:5 nachvollziehbare Agenda-/Antwortsuche.                                                                                                            |
| D122 |   SV279 |  37 | 1 Credit statt R&D-ICE                           | **Struktureller Fehler.** Terminale R&D-Gefahr wurde wegen `unknown/deferred_without_exact_route` nicht verteidigt.                                                               |
| D123 |   SV280 |  37 | Zug beenden                                      | **Fehlerfolge.** Keine Aktion blieb, aber die letzte Aktion hatte die tödliche Defense-Alternative verworfen.                                                                     |
| D124 |   SV281 |  37 | Karte abwerfen                                   | **Prüffall.** Für den unmittelbar folgenden Spielverlust nicht kausal; eine eigenständige Qualitätsaussage benötigt einen isolierten Cleanup-Checkpoint.                          |

## Einordnung der Abwurflogik

In diesem Match wurde kein klarer Agenda-Abwurffehler gefunden. Der frühe
Vapor-Ops-Abwurf und der spätere Abwurf der redundanten zweiten Kopie sind
vertretbar. Die weiteren Cleanup-Entscheidungen waren lokal überwiegend
plausibel oder für den Spielausgang nicht kausal. Die harten Fehler lagen in
Scoring-, Defense- und Action-Capacity-Plänen.

Das bedeutet nicht, dass die Abwurflogik allgemein fehlerfrei ist. Der letzte
Abwurf D124 ist wegen des direkt anschließenden Spielendes als isolierter
Prüffall offen, rechtfertigt aber keine neue globale Sonderregel.

## Test- und Architekturblindstellen

1. Der bestehende Counter-Bank-Test schreibt die falsche
   Same-Remote-Agenda-Installation positiv fest.
2. Es fehlt ein Test, der eine Bank-Route bei
   `rootReplacement: "asset_to_agenda"` zwingend verwirft.
3. Es fehlt ein positiver Cross-Remote-Handoff-Test mit installierter Bank,
   Agenda in einem anderen Remote und anschließendem Transfer.
4. Die Agenda-Defense-Tests trennen nominelles ICE, bezahlbar rezzbares ICE
   und gegen sichtbare Werkzeuge wirksames ICE nicht ausreichend.
5. Der zentrale Defense-Fallback ist für terminale R&D-/HQ-Gefahr bei
   unvollständigen Facts nicht ausreichend abgesichert.
6. Dem Overflow-Test fehlt die Gegenprobe, dass eine
   Action-Capacity-Operation ohne konkrete Aktionslücke nicht als bloße
   Handkonversion verwendet werden darf.
7. Dem Turn-Completion-Test fehlt die Gegenprobe „normale Aktionen plus
   legaler Basis-Credit dürfen nicht allein wegen erfülltem Liquiditätsziel
   verfallen“.

## Empfohlene Umsetzungspakete

### P1 – Vapor-Ops-/Counter-Bank-Route korrigieren

- Same-Root-Replacement aus dem Handoff-Plan ausschließen.
- Quelle und Agenda als getrennte konkrete IDs/Server binden.
- Cross-Remote-Transfer planen und nach informationsändernden Aktionen neu
  bewerten.
- Bestehenden falschen Test ersetzen und roten Match-Checkpoint ergänzen.

### P1 – Agenda-Schutz und Rez-Reserve als gemeinsame Planverpflichtung

- Sichtbare Breaker, Runner-Credits und tatsächliche Rez-Finanzierbarkeit in
  die Agenda-Zulassung aufnehmen.
- Mehrzügige Agenda-Pläne mit einem Defense-Zielband und gebundener Reserve
  versehen.
- Advance-Schritte an der Reservegrenze als Replan-Grenze behandeln.
- Keine globale Pflicht „immer drei ICE“ einführen.

### P1 – Terminale Zentralverteidigung bei `unknown`

- Spielbeendende Agenda-Punkt-Gefahr explizit an den Defense-Plan geben.
- `unknown` nicht mehr automatisch in
  `additional_central_ice_deferred_without_exact_route` umwandeln.
- Bezahlbare ICE-Alternativen im Plan vergleichen und einen konservativen
  Terminal-Fallback testen.

### P1 – Routenbudget für bedingte Score-Effekte

- Die Creditreserve aus der tatsächlich gewählten Gesamtroute berechnen.
- Vapor Ops, Beschleunigungsoperationen, normale Advances, Installations- und
  Rez-Kosten gemeinsam berücksichtigen.
- Den legitimen Notfallfall „Corporate War unter zwölf scoren, um nicht
  sofort zu verlieren“ erhalten.

### P2 – Normale Aktionen nicht ersatzlos verfallen lassen

- Turn Completion bei verbleibenden normalen Aktionen enger zulassen.
- `forgo_restricted_capacity` nur für tatsächlich eingeschränkte Kapazität
  verwenden.
- Gesättigte Basis-Credits abwerten, aber nicht pauschal als Grund für ein
  frühes Zugende behandeln.

### P2 – Action-Capacity-Karten aus bloßer Overflow-Konversion herausnehmen

- Eine zusätzliche Aktion an einen konkreten Planbedarf binden.
- Overtime Incentives weiterhin für echte Fast-Advance-/Score-Lücken
  erlauben.
- Generisch nach Funktionssignal und Route lösen, nicht nach Kartennamen.

## Noch nicht freigabereife Verallgemeinerungen

- **„Vor jede mehrzügige Agenda zwingend drei ICE“:** zu apodiktisch. Rush,
  sichtbare Runner-Werkzeuge, Kosten und Scoringhorizont müssen den
  Zielschutz bestimmen.
- **„Corporate War niemals unter zwölf Credits scoren“:** im Endspiel falsch,
  wenn der Score einen unmittelbaren Spielverlust verhindert.
- **„Bei `unknown` immer ICE installieren“:** ebenfalls zu grob. Die
  konservative Reaktion gehört in den Defense-Plan und muss Kosten,
  Terminalrisiko und konkrete Alternativen vergleichen.
- **„Bei voller Hand trotzdem immer ziehen“:** kann richtig sein, braucht aber
  eine bewertete Handkonversion und eine Neuplanung nach der
  Informationsgrenze.
- **D124 als Cleanup-Regression:** für diesen Spielausgang nicht hinreichend
  kausal belegt.

## Reproduzierbarkeit und Freigabestatus

Der historische Match ist vollständig belegt, aber noch nicht als
eigenständiger roter Decision-Checkpoint aufgenommen. Vor einer
Implementierung sollten die oben genannten Auslöser als kleine, voneinander
getrennte Checkpoints reproduziert werden. Dadurch bleibt sichtbar, welche
Korrektur welchen Fehler behebt und ob sie Rush-, Bluff- oder
Notfallentscheidungen unbeabsichtigt verdrängt.

Diese Datei ist eine Analyse, keine Umsetzungsfreigabe. Es wurden keine
KI-, Engine-, Kartenhint- oder Teständerungen vorgenommen.

# Runner-Planowner: Aufgaben und Grenzen

Status: **aktuelle fachliche Verträge mit ausdrücklich offenen Fähigkeiten**  
Stand: 2026-10-07

Die [Ownerkarte](README.md#planowner-und-implementierungen) verbindet jede
registrierte Modul-ID mit ihrer Implementierung. Diese Seite definiert die
fachlichen Eingaben, Ziele, Bedarfe und Grenzen; der
[gemeinsame Planvertrag](planning-architecture.md) definiert Lifecycle und
Ausführungsbindung. Listen möglicher Phasen erläutern die Fachaufgabe, sie
sind weder zusätzliche TypeScript-Methoden noch eine Vollabnahme jeder Route.

**Ist und offene Reichweite:** `runner.opening_strategy` ist eine nicht registrierte
Modulidee. Die übrigen unten als produktiv gekennzeichneten Owner existieren;
ihre Route muss im aktuellen Zustand durch LegalActions und Quotes belegbar
sein. Registrierung allein zertifiziert keine vollständige Spielstärke.
Offene Domainfähigkeiten und ihre Abnahmegrenzen stehen in der
[Capability-Review](hidden-node-capability-review.md) und im
[aktuellen Arbeitsboard](../../activities/README.md).

## 1. `runner.opening_strategy`

**Klasse:** `bounded_sequence`
**Rolle:** Opening-/Setup-Vordergrund
**Status:** offene Modulidee; nicht als eigener Owner registriert.

Zweck:

- erste strategische Linie aktivieren;
- notwendige Basis-Coverage, Economy oder Engine priorisieren;
- nach erfolgreichem Opening in normale Kampagnen übergeben.

Die Mulligan-Entscheidung selbst gehört nicht in dieses normale Planmodul.
Sie wird durch einen einmaligen, deckstrategischen Opening-Resolver mit
eigenen LegalActions und Abschlussbedingungen getroffen. Dessen Ergebnis fließt in die normale Portfolio-Discovery ein. Ein eigener
Opening-Plan ist nicht implementiert.

Der Plan endet, sobald:

- die deckstrategisch notwendige Startfähigkeit vorhanden ist;
- eine dringende Response übernimmt;
- oder die Opening-Phase ausdrücklich abgebrochen wird.

## 2. `runner.pressure_central`

Ein endlicher Run-Creditpool begründet keinen Zusatznutzen, wenn dieselbe
aktuelle Route ohne Karte erreichbar ist und danach ebenso viele allgemeine
Credits übrig bleiben. Die gemeinsame Nutzenprüfung vergleicht die gebundenen
Runquotes; noch unbekanntes ICE behält seine ausdrücklich unsichere
Finanzierungswirkung. Nachträglicher Eigenschaden ist ein Preis und niemals
ein positiver Karteneffekt. Central, Remote und Coverage verwenden denselben
Nachweis. Native Paarung-552-Zustände sichern drei kostenlose Gegenrouten
sowie zwei erhaltene echte Finanzierungsrouten ab.

Ein Kartenrun mit zusätzlichem gedrucktem ICE-Rezpreis besitzt nur dann diesen
Zusatznutzen, wenn auf seinem tatsächlichen Zielpfad noch ungerezztes ICE liegt.
Bereits gerezzte ICE werden während desselben Runs nicht erneut bezahlt.
Central, Remote und Coverage verwenden dafür denselben planlokalen
Funktionsnachweis; bei gleichzeitig zugelassenem gleichwertigem Basisrun
rechtfertigt dieser wirkungslose Aufpreis keinen Kartenverbrauch oder
zusätzlichen Run-Klick. Andere echte Bypass-, Mehrfachzugriffs- und
Informationswirkungen behalten ihren eigenen Nachweis.

Die gemeinsame Runquote trennt mögliche Trace-Effekte von der nach bezahlter
Abwehr verbleibenden Gefahr. Garantierte Break-, Link- oder Cancel-Kosten
bleiben im vollständigen Pfadbudget; die ursprünglichen Gefahrenrecords
bleiben als Diagnose erhalten. Der aggregierte Gefahrenabzug und erwartete
Tags enthalten nur unvermeidbare Restwirkungen. Bereits vollständig
finanzierte Abwehr darf die Central-/Remote-Konversion nicht zusätzlich als
unabgewendete Gefahr entwerten. Bei mehreren Traces bleiben der verbrauchte
Pool und eine anschließend unbezahlbare Wirkung getrennt sichtbar. Native
Paarung-519-Kontrollen sichern Finanzierung, fehlende Coverage, gebundene
Planroute und tatsächlichen AI→Engine-Zugriff mit identischem Replayhash ab.

Das Pfadbudget führt neben den während des Runs verfügbaren Credits die
allgemein verfügbaren `traceEligibleCredits` als eigenes Teilkonto. Temporäre
Run-Credits und Bad-Publicity-Run-Credits dürfen Breaker und zulässige
Run-Kosten finanzieren, aber keine Trace-Gebote oder allgemeinen Link- und
Cancel-Aktivierungskosten. Echte allgemeine Einnahmen erhöhen beide Konten;
Run-Zahlungen verbrauchen zuerst das beschränkte Geld. Trace-Zahlungen
belasten das allgemeine Teilkonto unmittelbar. Mehrere Trace-Subroutinen und
aufeinanderfolgende ICE konsumieren denselben Ledger. Dedizierte, von der
Engine projizierte Trace-Pools bleiben zusätzlich verwendbar.

Eine abgeschlossene Pfadquote liefert diesen Ledger im
`creditBudgetAfterPath`; Nachlauf- und Zugriffsbudgets übernehmen daraus das
verbleibende allgemeine Geld. Sie rekonstruieren es nicht aus einer pauschalen
Ausgabenreihenfolge. Ein fehlender Ledger für einen abgeschlossenen Pfad oder
ein ungültiges explizites Teilkonto scheitert sichtbar. Ein einzelner
numerischer Budgetwert bezeichnet ausdrücklich nur allgemeine Credits.

Im aktiven Run übernehmen Encounter-, Pump-, Restpfad-, Fortgebühren- und
Informationsgrenzen-Quotes den aktuellen Engine-Pool
`runnerRunTemporaryCredits.remaining` zusammen mit den Bad-Publicity-Credits.
Der Runstart darf eine bezahlte Route nicht mit neun temporären Credits
zulassen, die der spätere Break-Owner als null behandelt. Jede Zahlung wird
aus den tatsächlichen aktuellen LegalActions und dem verbleibenden Pool
erneut gebunden. Trace-Zahlungen und der für Trash reservierte allgemeine
Creditbedarf behalten ihr eigenes Teilkonto; der vorhandene Run-Root und
Executor bleiben erhalten. Paarung 552 R4/G2/D183 und G5/D87 sichern die
vorher aufgegebenen bezahlbaren Breaks, G21/D454 den bereits korrekten
Gegenfall.

Bei der Übergabe eines bezahlten Encounters an die verbleibende Pfadquote
enthält `credits` das Restgeld einschließlich Run-Pools und
`traceEligibleCredits` ausschließlich das allgemeine Restgeld. Dies gilt auch
für Pump-/Vollbreak-Alternativen, optionale Schadensvermeidung und
ETR-Zahlungen. Der zweite Encounter darf Run-Geld nicht erneut als
Trace-Budget erhalten.
Die Umrechnung erfolgt ausschließlich über
`runnerRunPathCreditBudgetAfterEncounter`: Sie entfernt das getrennte
Encounter-Feld, addiert den verbleibenden Run-Pool zum Pfadgesamtbudget und
erhält das allgemeine Teilkonto. Ein unkonvertiertes `runOnlyCredits`-Feld
ist im Pfadvertrag typseitig ausgeschlossen und scheitert auch zur Laufzeit
mit einer strukturierten Diagnose. Das gilt insbesondere nach einem
tatsächlichen Break und nach der vollständigen aktuellen Zwangsbreak-Gruppe.

Eine bekannte ICE mit gemeinsam bezahlbaren Subroutinen darf als vollständige
Break-Gruppe gequotet werden. ETR- und Schadensanteile derselben Gruppe
verbrauchen den Breakerpreis und zweckgebundene Credits nur einmal. Der
Pfaddienst vergleicht die bisherige Teilbreak-Route mit der vollständigen
Gruppenroute; unabhängige ICE, zusätzliche Kosten je Subroutine, Stärke,
Breakverbote und zeitlich begrenzte Mittel bleiben getrennt gebunden. Diese
Quote eröffnet keine LegalAction: Der vorhandene Run-Window-Owner führt nur
die aktuell legal gebundene Fortsetzung aus. Native Engine-Prüfungen sichern
den gemeinsamen Preis, echte Zugriffskonversion und deterministisches Replay.

Die gewöhnliche Run-Startquote finanziert positiven bekannten Hirnschaden-
Schutz gemeinsam mit allen unabhängigen ETR-Breaks. Die aktuelle
Encounter-Abwehr priorisiert diesen Schutz bereits; eine vorgeschaltete
Schadens-Handpuffer-Normalisierung darf deshalb keine nur scheinbar bezahlbare
Vollroute erzeugen. Fehlende Credits bleiben eine konkrete Finanzierungslücke.
Exakt null Schaden verursacht keine zusätzlichen Schutzkosten. Der bestehende,
öffentlich belegte terminale Remote-Contest behält seine getrennte
Nicht-Flatline-Schadenszulassung, ohne unabhängige ETR-Sperren zu beseitigen.
Die nativen Checkpoints aus Paarung 515 sichern gewöhnliche Finanzierung,
finanzierten Gegenfall, Nullschaden und tatsächliche AI→Engine-Fortsetzung ab.

Der aktuelle Payoff wird pro Runaktion am tatsächlichen `accessServerId`
bewertet. Ein Zugang über Archives mit anschließendem HQ-Zugriff übernimmt
nicht den bekannten Nullnutzen eines normalen Archives-Runs. Auch innerhalb
derselben Zielservergruppe bleiben beide Action-Routen getrennt zulässig
beziehungsweise ausgeschlossen (SP-509).

Die bekannten Central-/Remote-Access-Payoffs veröffentlichen Zielidentitäten
und das allgemeine Trash-Creditbudget als `RunnerAccessFacts`. Die Runbewertung
transportiert diese Fakten vollständig bis zum gebundenen Access-Commitment;
begrenzte Evidence-Listen sind ausschließlich Erklärung. Ein Budget von `0`
ist ein bekannter kostenloser beziehungsweise durch zweckgebundene Mittel
gedeckter Zugriff. `unknown` und `not_applicable` bleiben davon getrennt.
Ein unbekanntes Zugriffsziel bindet keine Trash-Reserve; ein konkretes
Trash-Commitment verlangt dagegen bekannte Ziele und ein endliches,
nichtnegatives Budget. Fehlende notwendige Fakten scheitern mit strukturierter
Plan-Diagnose, ohne Rekonstruktion aus Texten oder Ersatzbudget. Neue Fakten
erweitern weder den side-sicheren Wissensstand noch die Action-Autorität.

**Klasse:** `strategic_campaign`
**Rolle:** Vordergrund, zeitweise präemptierbar
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Parameter:

- Ziel `hq`, `rd`, `archives` oder eine typisierte Multi-Server-Sequenz;
- Druckmodus `probe`, `sustained`, `engine_growth` oder `closeout`;
- deckstrategische Linie;
- relevante Access-Engine;
- bekannte Zugriffshistorie und Sättigung;
- Serverpfad und Finanzierungsbedarf.

Das Modul kennt aus der eigenen Deckstrategie und den eigenen
DeckCapabilities, welche R&D-Druck-, Multiaccess-, Search- und
Pfadwerkzeuge grundsätzlich vorhanden sind. Es darf daraus gezielte Draw-,
Search-, Funding- oder Installations-Steps ableiten, statt nur aktuell
angebotene Runs zu bewerten.

Reine Virus- oder Bad-Publicity-Kampagnen sind nicht automatisch Modi dieses
Moduls. Für den aktuellen Domainvertrag gilt:

- serverbezogener Virusfortschritt kann planinterner Enginezustand sein;
- Archives- und Multi-Server-Sequenzen gehören in dieses Modul, wenn ihr
  Hauptzweck Zugriff oder Druck ist;
- Bad-Publicity- oder alternative Loss-Condition-Linien benötigen vor
  produktiver Freigabe einen eigenen Domainvertrag oder einen ausdrücklich
  definierten Modus;
- fehlende Abdeckung wird als `missing_module_coverage` diagnostiziert und
  nicht durch einen generischen Grund- oder Supportplan kaschiert.

Eine Bezahlaktion zum Aufheben der Runsperre ist nur dann produktiv gebunden,
wenn die aktuelle Central-Route erreichbar, positiv und frei von ihren
eigenen Action-Ausschlüssen ist. Ein durch Recurring Economy zurückgestellter
Folgerun darf deshalb keinen ausführbaren Release-Head behaupten. Die
Runtime übernimmt den konkreten Ausschluss vom Central-Owner, statt die
Runsperre ungeprüft zu lösen oder die LegalAction ownerlos zu lassen.

Der Defense-Owner veröffentlicht die LegalAction-IDs seines aktuell
ausführbaren produktiven Heads aus derselben Phasen- und Quoteprüfung wie
Discovery. Die generische Handentwicklung darf diese Aktionen nicht wegen
eines zusätzlichen Draw-Effekts als global unproduktiv klassifizieren. Das
gilt auch bei bereits vollem Handpuffer und einer von der Engine erlaubten
Zahlung mit zweckgebundenen Credits. Spätere Defense-Phasen, ungültige
Fundingbindungen und bloßes Aufgeben von Aktionen erhalten dadurch keine
produktive Zuständigkeit; bestätigte schadensbehaftete Draws bleiben
ausgeschlossen.

Mögliche Phasen:

```text
assess_target
fund_access
find_or_install_access_tool
open_path
probe
compound_access
exploit_known_payoff
closeout
recover_and_resume
```

Planinterner Fortschritt:

- neuer oder tieferer Zugriff;
- neue relevante Information;
- Agenda- oder Trash-Konversion;
- Aufbau einer Multiaccess-/Highlighter-Engine;
- Verringerung der Siegdistanz;
- Senkung realer Zugangskosten.

Eine HQ- und eine R&D-Instanz dürfen gleichzeitig Kandidaten sein. Nur eine
ist Executor. Ein Zielwechsel verlangt Planarbitration, nicht bloß eine andere
Run-Action.

Eine Vorbereitung mit Payoff beim nächsten Agenda-Zugriff benötigt einen
echten anschließenden Zugriff desselben Parents. Ein ersetzender
Informationsrun erfüllt diese Bedingung nicht. Central und Remote prüfen
vor der Vorbereitung deren eigene Klick- und Creditkosten sowie den danach
verbleibenden gequoteten Pfad, die unbekannte-ICE-Reserve und den Handpuffer.
Ein vor dem Spend zugelassener Run allein belegt keine konvertierbare Folge.
Die Folgequote verwendet auch die bestehende Funding-Admission des ausführenden
Owners einschließlich geschützter Nachlaufreserve. `run_now` ersetzt diese
Prüfung nicht. Central und Remote bewahren auch den globalen Handpuffer nach dem
Kartenverbrauch. Die konkrete bestehende Run-Action wird nach Klick-, Credit-
und Kartenverbrauch neu gequotet; dazu zählt die eigene Handkartenanforderung
eines Run-Events. Die Vorbereitung erbt die Admission, Priorität und Bewertung
des bereits ausführbaren Parents. Ein bekannter reiner Trash-Zugriff trägt
keinen Agenda-Bonus.

Ein öffentlich ausgespielter, noch nicht verbrauchter Agenda-Zugriffsbonus
verfällt am Runner-Zugende. Die Run-Owner lesen diesen Zustand aus kanonischem
Karteneffekt und den Engine-Ereignissen zu Spiel, Verbrauch und TurnSerial.
Ein bereits zugelassener echter Agenda-Zugriff erhält für diese Gelegenheit
P3; Finanzierung, Sicherheit und stärkere unmittelbare Bedrohungen bleiben
maßgeblich. Ersetzende Informationsläufe verbrauchen diesen Bonus nicht und
erhalten diese Priorität nicht. So verdrängt gewöhnlicher Ausbau den
vorbereiteten letzten Zugriff nicht.
Die Prüfung erzeugt keine zukünftigen Actions; der Owner materialisiert die
Folge nach der Zustandsänderung erneut aus den LegalActions.

Ein verpflichtender Ersatz des Zugriffs durch eigenen Creditverbrauch gegen
Corp-Credits erhält ausschließlich seinen tatsächlichen Denial-Payoff. Die
Runprojektion bindet diese geschlossene Funktion an die gedruckte Make-Run-
Capability und ihre generierten CardSpec-Effekte. Die sichtbare Obergrenze
des Entzugs berücksichtigt beide Creditpools nach bekannten Pfadkosten;
weitere Corp-Rezzes können sie vermindern. Bei null Entzug besteht kein
Zugriffswert. Verdeckte HQ-Karten, Multiaccess und ein möglicher Agenda-Steal
begründen für diese Ersatzroute keinen Matchpoint-Bonus. Die normale HQ-
Action behält ihre eigenständige Bewertung und denselben Central-Owner.

Der zusätzliche Wert einer HQ-Erfolgsfenster-Vorbereitung gehört zur konkret
zugelassenen Runroute des Central-Signals. Ein auf Finanzierung verschobener
Basisrun darf weder seinen Vorbereitungswert noch seine Begründung an einen
anderen Kartenrun auf demselben Server weitergeben. Kartenruns behalten ihren
eigenen gequoteten Payoff; zulässige Basisruns können weiterhin die vorbereitete
ICE-Entfernung begründen.

Eine so zugelassene, vollständig finanzierte HQ-Erfolgsfenster-Vorbereitung
besitzt den konkreten Runzweck `access`. Der Ein-Credit-Budgetdeckel einer
reinen Informationsprobe darf ihren bereits quotierten Pfad und die
Folgezahlung nicht erneut ausschließen. Unbekannte, verschobene oder fremde
Runrouten erhalten diesen Zweck nicht.

Bei festem Creditentzug begrenzt zusätzlich die kanonische Effektmenge den
Payoff; eigene Credits werden dafür nicht ausgegeben. Verlangt die gebundene
Ersatzwirkung ein nichtleeres Corp-Konto, bleibt bei bereits leerem Konto der
normale Zugriff erhalten. Ein unbedingter Entzug ersetzt ihn auch dann. Beide
Fälle teilen dieselbe Central-Projektion; fehlende oder widersprüchliche
Effektmengen scheitern sichtbar, statt einen Zugriffswert zu erfinden.

Die terminale Finanzierung eines vollständig bekannten Remote-Pfads zertifiziert
die gesamte gebundene Route erneut mit deren garantiertem liquiden Budget und
verbleibendem Run-Klick. Eine am ersten unbezahlbaren ICE oder an dessen erster
unbezahlbarer Subroutine endende Quote liefert nur eine Untergrenze. Das Erreichen
dieser Untergrenze macht eine Fundingfolge nicht `covered_guaranteed`; der
Consumer muss mit dem tatsächlichen Folgenbudget garantierten Zugriff ohne
weitere Finanzierungslücke nachweisen. Die vorhandene Handreserveprüfung bleibt
zusätzlich verbindlich. Diese Ressourcenprüfung erzeugt keine LegalAction und
keine zusätzliche Entscheidungsautorität.

Ein vor der Finanzierung als nicht bestreitbar bewerteter Zugriff sperrt diese
prospektive Prüfung nicht: `accessPayoffContestable: false` kann allein aus der
aktuellen Liquiditätslücke folgen. Erst die vollständige Quote nach der realen
Auszahlung entscheidet über den Zugang. Unbekanntes ICE, unvermeidbare sichtbare
Gefahren, fehlender aktueller Payoff, fehlender Run-Klick und eine nicht gedeckte
Gesamtroute bleiben Ausschlussgründe. Der Bank-Executor bindet weiterhin den
aktuellen Remote-Parent und dessen konkreten Bedarf, statt den Lauf selbst zu
autorisieren.

Ein Zentralzugriff am Runner-Matchpoint darf ohne aktuelle Remote-Scorebedrohung
das vorhandene Runbudget verbrauchen. Die allgemeine gewünschte Auffüllreserve
ist dann keine zusätzliche Restguthabenpflicht; der Sicherheitsfloor, reale
Pfadkosten und die Reserve für unbekanntes ICE bleiben verbindlich. Eine
vorhandene Remote-Bedrohung behält ihre Reserve.

Die Reserveverbrauchs-Fakten vergleichen dafür den tatsächlichen marginalen
liquiden Abfluss. Ein Zentralrun, dessen bekannter Pfad die aktuelle Bank
unverändert lässt, verbrennt keine Remote-Reserve allein deshalb, weil die
Startbank unter einem zukünftigen Auffüllziel liegt. Empfehlung und Score
konsumieren dieselbe korrigierte Tatsache. Reale Bankausgaben, Coverage-,
Schadens-, Handpuffer- und Prerun-Reserven bleiben verbindlich; unbekannte ICE
erhalten dadurch keine Zugriffsgarantie.

Ein bekannter Trace-Effekt, der den Zugriff verhindert, ist bei unbezahlbarer
Basisstärke und ohne bezahlbare Break- oder Abbruchantwort kein bedingt
erreichbarer Zugriff. Die gemeinsame Runquote weist diesen Pfad als
`no_access` aus; der vorhandene Run-Owner erhält den Finanzierungsbedarf.
Ist die Basisabwehr bezahlbar und nur ein zusätzliches Corp-Gebot unsicher,
bleibt die bedingte Route erhalten. Reine Tag- oder Schadensfolgen werden
dadurch nicht zu Zugriffssperren.

Ist eine aktuelle Basis-Run-Action nach exakter Runbewertung zwar legal, aber
erst nach einem gebundenen Funding- oder Vorbereitungsschritt sinnvoll,
bleibt sie eine ausdrücklich dispositionierte Alternative von
`runner.pressure_central`. Economy besitzt nur den vorbereitenden Step und
darf den Run weder ownerlos lassen noch selbst Server oder Run-Action wählen.

Eine aktuell legale, kostenlose Fähigkeit, die bereits angesammelten
Multi-Central-Druck in eine persistente gegnerische Aktionsreduktion
umwandelt, bleibt eine Route dieses Central-Plans. Sie bindet sich zuerst an
die residente Central-Instanz; ohne residente Instanz verwendet sie die nach
aktueller Priorität, Grenzwert und stabiler Serverordnung bestimmte
Central-Instanz. Weil die Wirkung ohne Klick- oder Creditverbrauch jetzt
konvertierbar ist und bis zum nächsten gegnerischen Purgefenster an Wert
verlieren kann, wird die Route als P3-Konvertierungsfenster bewertet. Daraus
entsteht weder ein kartenbezogener Parallelplan noch eine neue Server- oder
Runautorität.

### Vertikale Implementierung des Zentraldrucks

Die Informationsroute bewertet ein öffentlich beobachtetes kostenloses
Run-Ende im laufenden Zug: Folgt auf den Basisrun ausschließlich kostenloses
ICE-Rezzen und ein von der Engine bestätigtes End-the-Run-Fenster ohne
Zugriff, rechtfertigt unveränderter Aufbau keine erneute identische Probe.
`run-analysis/runner-free-stop-observation.ts` liefert das öffentliche
Endereignis für Zielserver und Zug; `central-probe-outcome.ts` entscheidet
dessen Zulassung im Central-Owner.
Ein installierter Informations- oder Multiaccess-Bonus macht ein weiterhin
unbekanntes Zugriffsziel nicht zu einem belegten Payoff und öffnet diese
unveränderte, kostenlos gestoppte Probe nicht erneut.
Aktuell garantierter Zugriff, Kartenruns und geänderte Board-/Effektzustände
bleiben eigenständig bewertete Routen. Ein neuer Zug
öffnet eine neue Beobachtung; Kartenidentitäten oder verborgene ICE-Quotes
werden aus der Historie nicht rekonstruiert. Das Eingabe-DTO bewahrt dafür
die öffentlichen Engine-Felder `result`, `encounterContinue` und
`encounterWillEndRun`. Fehlende Outcome-Facts beweisen kein Run-Ende.
Ein öffentliches `decline_rez` ohne aufgelösten Effekt beendet diese
Beobachtung nicht. Auch reine Finanzierung durch ein Ereignis erhält sie,
wenn die öffentlichen Engine-Effekte ausschließlich Runner-Credits vergeben
oder Credits auf einer eigenen Karte einlagern beziehungsweise abheben. Andere Counter-Veränderungen
werden dadurch nicht als Finanzierung freigegeben.
Gemischte oder nicht quotierte Ereignisse eröffnen die Bewertung erneut.

Der Remote-Owner verwendet dieselbe Beobachtung für einen wiederholten
Basisrun mit bezahlbarem Trashziel und weiterhin nur bedingtem Probe-Zugriff.
`remote-contest-admission.ts` lehnt diese einzelne Runvariante ab, ohne ihren
bekannten Trashwert oder die Engine-Pfadquote zu verändern. Scorebedrohungen,
terminale Contests und garantierter Zugriff bleiben separat zugelassen.
Eine bezahlte Verteidigung belegt keine kostenlose Wiederholung: Der erneute
Run kann die Corp weiter Credits kosten und wird regulär bewertet.

Post-Break-ICE-Trash wird als Vorbereitung einer bereits zugelassenen
Central-Instanz behandelt. `post-break-trash-preparation.ts` vergleicht die
verbleibenden Zugriffe im aktuellen Zug mit Installation und exakt reservierten
Trash-Credits. Die erste Route setzt ein einzelnes bekanntes, gerezztes ICE mit
vollständig brechbaren End-the-Run-Subroutinen voraus. Verdeckte, bedingte oder
nur teilweise mitigierte Pfade begründen diese Vorbereitung nicht. Quelle,
ICE-Ziel, Server, Kosten und Beobachtungs-StateVersion bleiben am Parent
gebunden; Installation und Run werden nach jeder Engine-Änderung neu bewertet.
Priorität und Grenzwert des bestehenden Central-Owners bleiben erhalten.
Nach der Installation übersteht die gebundene Entfernung auch eine notwendige
Unterbrechung durch Handbuffer- oder Sicherheitsaktionen. Der Central-Owner
prüft die weiterhin installierte Quelle, dasselbe ICE-Ziel sowie den aktuell
vollständig finanzierten Pfad erneut; er verlangt keine zweite Amortisierung
der bereits ausgeführten Installation. Eine vorübergehend blockierte
Runroute behält ihr Ziel, erhält dadurch aber weder höhere Priorität noch
eine Ausführungsfreigabe. Fehlende Quelle, geändertes Ziel oder fehlendes
Budget verwerfen die Bindung.

`runner.convert_run_window` übernimmt diese Bindung. Im echten Post-Pass-Fenster
verifiziert er die kanonische CardSpec-Fähigkeit, das aktuelle gerezzte Ziel und
die tatsächlich angebotenen Kosten gegen den reservierten Betrag. Erst dann
vollendet der Step die vorbereitete Entfernung vor dem weiteren Zugriff.
Aus der Vorabquote werden keine zukünftigen LegalActions erzeugt.

`packages/ai/src/runner/central-pressure/` bündelt den Owner:

- `central-pressure-signals.ts`: Ziel- und Routenvergleich, Zugriffskadenz,
  Vorbereitung, angesammelte Druckkonversion und ausdrückliche Disposition;
- `central-pressure-development.ts`: Aufbau einer konkreten Access-Engine;
- `central-pressure-funding.ts`: exakt gebundene Finanzierung dieser Vorbereitung;
- `central-pressure-plan-module.ts`: Discovery, Assessment, Materialisierung
  und Fortschrittsbeleg der residenten Central-Instanz.

Die Runtime liefert aktuelle Runbewertungen, Coverage- und Safety-Fakten,
Vorbereitungsrouten und den residenten Parent. Finanzierung und Reserveprüfung
nutzen gemeinsam mit Remote die Dienste in
`run-analysis/runner-plan-run-funding.ts`; aktuelle Route, Risk-Quote und
Access-Commitment kommen aus `runner-plan-run-route-facts.ts`. Sabotage- und
Bypassvorbereitung sowie ihre exakten Choices teilen
`runner-run-preparation.ts` und `runner-run-preparation-choice-binding.ts`.
Diese Dienste wählen keinen Executor. Die gemeinsame Herkunft eines laufenden
Runs ist in `plans/runner-run-origin-contract.ts` typisiert. Kein Central-Modul
importiert die Live-Runtime oder eine Planregistry zurück.

## 3. `runner.contest_remote`

**Klasse:** `bounded_sequence` oder bei wiederkehrendem Ziel
`strategic_campaign`
**Rolle:** Vordergrund; bei unmittelbarer Score-Threat P2
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Mögliche Phasen:

```text
classify_remote
assess_score_threat
fund_access
obtain_path_answer
run_remote
resolve_access
recontest_or_complete
```

Der Plan muss unterscheiden:

- akute Siegagenda;
- wirtschaftlich wertvolles Asset;
- leeres oder bekannt wertloses Remote;
- Ambush-/Damage-Risiko;
- deckstrategisch begründeten wiederholten Remote-Druck.

Ein unbekanntes avanciertes Root darf vor einem bereits bezahlbaren Basisrun
eine exakt gebundene Einzelkarten-Aufdeckung erhalten. Der Remote-Owner prüft
die aktuellen Aufdeckkosten, mindestens einen verbleibenden Run-Click sowie
Pfadkosten und native Runreserve gemeinsam. Ein allgemeiner Wunsch nach
weiterer Liquidität sperrt diesen Schritt nicht, wenn der vorhandene
Run-Konversionsnachweis die konkrete Route bereits freigibt und nach der
Aufdeckung deren Geld- und Aktionsbedarf gedeckt bleibt. Ein offener
Fundingbedarf, ein
bekanntes oder bereits exakt aufgedecktes Root und der letzte Click erzeugen
diese Vorbereitung nicht. Der konkrete Informationsschritt bleibt bei
`runner.contest_remote`; weitere Sabotage- und Bypassrouten behalten ihre
eigenen Nachweise.

Quelle, Action, side-sichere Root-Instanz, Position und StateVersion werden
vor der Aufdeckung gebunden. Die anschließende Engine-Choice übernimmt nur
das eine passende aktuelle Optionsfeld; sie wählt weder ein anderes Fort
noch eine neue Strategie. Fehlende oder widersprüchliche Bindung scheitert
geschlossen. Nach der privaten Beobachtung wird der mögliche Run regulär
neu bewertet, ohne die bisherige Run-Action über die Informationsgrenze zu
fixieren. Paarung 493/R1/G7/D44 und native Engine-Gegenfälle sichern diesen
Übergang; Paarung554/R4/G14/D49 ergänzt den nativen Fall unterhalb der
allgemeinen Economy-Zielreserve. Allgemeine ICE-Offenlegung aus SP-358
bleibt eine eigene Frage.

Ein allgemeiner Matchpoint-Fokus wird vor den konkret bewerteten Remote-Routen
zusammengeführt. Er darf deren aktuelle Finanzierungs- oder Coverage-Bindung,
Zugriffsvertrag und Risikoquote nicht überschreiben. Ein bereits berechneter
Bank-Support bleibt damit am selben Remote-Parent und Bedarf gebunden; eine
fehlende bezahlbare Route wird durch den Bedrohungsfokus nicht ausführbar.

Jede unmittelbar ausführbare Run-Variante prüft ihre eigene Vorabreserve.
Die Bereitschaft einer Bypass-Variante desselben Servers zertifiziert weder
den normalen Run noch dessen unbekannte Encounters. Ein blockierter
Variantenvertrag erhält eine ausdrückliche Ablehnung; der ausführbare
Geschwisterpfad bleibt beim selben Remote-Parent.

Coverage-Unterstützung gehört zur exakt bewerteten Run-Action. Eine auf demselben
Server bereits ausführbare Bypass-Variante übernimmt nicht den Breakerbedarf
des normalen Runs, auch bei einer terminalen Scorebedrohung. Die bestehende
Reconciliation entfernt die überholte Parentbindung und erhält unabhängig
sinnvolle Rig-Projekte. Paarung 524 G6 D158 prüft den gesamten Originalpräfix,
den Remote-Executor und die echte Engine-Anwendung der bereiten Eventroute.

Ersetzt eine aktuell ausführbare gezielte ICE-Entfernung die blockierte
Runroute, entfernt ihr Remote-Signal den bisherigen `supportNeedId` bereits
bei der Routenbildung. Der ersetzte Coverage-Bedarf darf nicht zugleich eine
Child-Bindung verlangen, während der Parent seinen eigenen Vorbereitungsschritt
ausführt und keine offene Need mehr veröffentlicht. Die bestehende
Coverage-Reconciliation erhält unabhängig weiterhin sinnvolle Breakersuchen;
vor dem Routenwechsel bleibt eine tatsächlich benötigte Child-Bindung erhalten.
Die gespeicherten Entscheidungen D159/D160 aus Paarung 425 prüfen beide Seiten
dieses Übergangs mit den historischen LegalActions und Runtime-Checkpoints.

Die Runpfad-Projektion trennt einen nicht tödlichen Handpufferverstoß von
unmittelbarer beziehungsweise Cleanup-Flatline. Ein bekannter Zugriff bleibt
bei überlebbarem Schaden grundsätzlich abfangbar; der bestehende
Contest-Owner entscheidet weiterhin, ob sein terminales Letztchancenfenster
den normalen Handpuffer überstimmen darf. Die Schadensprojektion summiert dazu
alle bekannten Folgequellen einschließlich Zugriffsschaden auch nach einer
ersten Reservewarnung weiter. Eine Reservewarnung allein darf weder
`accessPayoffContestable` noch die bekannte Überlebbarkeit auf `false` setzen.
Es entsteht keine zusätzliche Runwahl oder Ausnahme im Choice-Resolver.
Die Letztchancen-Ausnahme betrifft ausschließlich den normalen Schadenspuffer.
Eine zusätzlich bekannte ETR-Sperre ohne passende Coverage oder eine offene
Finanzierungslücke bleibt auch bei diesem terminalen Contest verbindlich.
Die Finanzierung umfasst neben Event- und ICE-Kosten auch die anschließende
Agendaübernahme aus frei verfügbaren Credits. Die Engine liefert hierfür
eine an Fort und StateVersion gebundene öffentliche Mindestquote, auch bei
unbekanntem Root; sie enthält ausschließlich öffentliche aktive oder für den
laufenden Zugriff persistierte Steal-Modifikatoren. Null wird ausdrücklich
gequotet. Eine bekannte Agenda benötigt ihre vollständige, zusätzlich an ihre
Instanz gebundene Quote. Die AI-DTO erhält beide Verträge; fehlende, veraltete
oder widersprüchliche Quotes zertifizieren keinen bezahlbaren Agenda-Contest.
Historische Ablehnungen ersetzen keine aktuelle Kostenquote. Der Fehlbetrag
geht an den bestehenden Funding-Owner und sperrt auch eine gezielte
Bypass-Vorbereitung für dieselbe Agenda. Bekannte Trash-Ziele und gequotete
Access-Replacements behalten ihre eigenen Zugriffsverträge.

Bei aus der side-sicheren Central-Memory identifizierten Agendas ergänzt die
kanonische Engine-Definitionsquote die aktuelle öffentliche Fortquote um die
Eigenkosten der Agenda. Mehrere bekannte Kandidaten reservieren den höchsten
Einzelpreis; eine bloße Typbeobachtung erfindet keine Kartenidentität. Der
bestehende Central-Parent behält ein solches Ziel, wenn seine exakt gebundene
Finanzierungsroute garantiert gedeckt ist, auch wenn der aktuell noch
unfinanzierte Zugriff lokal keinen positiven Wert besitzt.

Ein dringender Score-Contest finanziert die echte Pfad- und Zugriffslücke bis
zum nichtnegativen Restbudget. Der allgemeine Liquiditätsboden vergrößert
diesen Fehlbetrag nicht; ausdrücklich gebundene Reserven und unbekannte
Folgerisiken gelten weiterhin. Eine gequotete Zahlung-oder-ETR-Subroutine wird
mit genau dieser Subroutine an die Engine-Breakerquote gebunden, damit eine
billigere oder kostenlose Brechung in derselben Pfadberechnung erhalten bleibt.

Die Quote zertifiziert `blockedOnlyByDamage` erst nach Prüfung aller bekannten
Folge-Encounters. Der allgemeine Grund `harmful_unbroken_run_effect` genügt
nicht: Eine Break-/Jack-out-Sperre ist kein bloßer Handpufferverstoß, und eine
frühe Schadensquelle darf eine spätere ETR- oder Zahlungssperre nicht verdecken.

Bestätigt dieselbe kumulative Schadensprüfung dagegen, dass der gesamte
bekannte Schaden innerhalb des aktuellen Handpuffers liegt, führt die gemeinsame
Runbewertung diesen Nachweis mit der vollständigen Pfadquote zusammen. Eine
ausschließlich zur Schadensvermeidung verlangte, unbezahlbare Brechung ist dann
keine Zugriffssperre. Unabhängige ETR-, Kosten- und unbekannte Folgerisiken bleiben
erhalten; der vorhandene Run-Owner entscheidet über die resultierende Route.

Interne Vergleichsrechnungen für einen Quell-Break dürfen die rekursive Suche
nach optionalen Folgeeffekt-Breaks begrenzen. Direkt gequotete, notwendige
Subroutine-Breaks an der Folgeschicht bleiben dabei zulässig. Andernfalls würde
eine vorhandene Breaker-Abdeckung allein durch die Vergleichsmethode verloren
gehen und ein Finanzierungs- oder Zugriffsplan zur unnötigen Breakersuche werden.

Ein Remote mit genau einem bekannten, gerezzten Damage-Ambush konsumiert
bereits vor dem Runstart dieselbe quellgebundene Abbruchbewertung wie das
Run-Window. Der Remote-Owner sperrt dafür seine Run- und Vorbereitungsvarianten
mit expliziter Evidence; ein bereits laufender Run behält seinen gebundenen
Parent und die bestehende Jack-out-Entscheidung. Unbekannte, ungerezzte oder
gemischte Roots erfüllen diese spezifische Abbruchbedingung nicht.
Targeted-ICEtrash und Bypass prüfen diese Bedingung bereits vor dem Binden
einer Vorbereitung. Ein gesperrter Zielserver darf keinen unmaterialisierbaren
Vorbereitungs-Parent erzeugen; andere zulässige Zielserver behalten ihre Routen.
Die Access-Effektprojektion wählt die zur sichtbaren Rez-Lage aktive installierte
Card-Spec-Variante einschließlich des Engine-Defaults für Agenda und rezzbare
Karten. Eine inaktive erste Variante darf spätere aktive Varianten nicht
verdecken; unbekannter Rez-Zustand oder mehrere gleichzeitig aktive, nicht
gemeinsam projizierbare Varianten werden ausdrücklich als unbekannt ausgewiesen.
Ein weiterhin gültiges `declined_trash_memory_active` erhält beim Remote-Owner
eine explizit nicht produktive Bewertung für jede aktuelle Run-Variante, auch
wenn Pfad und Trashzahlung inzwischen rechnerisch bezahlbar sind. Das bloße
Weglassen eines nicht zugelassenen Contests ersetzt diese Action-Zuordnung
nicht; andere produktive Zielserver behalten ihre eigenen ausführbaren Heads.

`draw_for_answer` ist nur zulässig, wenn:

- eine konkrete fehlende Antwort benannt ist;
- ein Draw diese Antwort plausibel liefern kann;
- Handüberlauf und verbleibende Folgeaktionen den Plan nicht entwerten.

### Vertikale Implementierung des Remote-Contests

Auch ein als terminal eingestufter Remote-Contest darf eine explizit
blockierte Vorabreserve für unbekanntes ICE nicht übergehen. Seine Dringlichkeit
ersetzt keinen ausführbaren Zugriffspfad. Ein finanzierbarer Bedarf bleibt am
Remote-Parent; nach Auszahlung werden Kosten und Reserve erneut geprüft.
Identische unterfinanzierte Wiederholungen erhalten dadurch keine neue
Zulassung, während eine inzwischen finanzierte Route weiterhin zulässig ist.

Die gemeinsame Funding-Admission übernimmt auch die Creditlücke der
Vorabreserve. Eine gequotete bekannte Pfadkostenlücke allein genügt bei
unbekanntem ICE nicht; eine blockierte Vorabreserve ist keine direkte
Konversion, auch nicht bei terminaler Dringlichkeit. Die kleine
Letztchancenfinanzierung des bekannten Pfads setzt vollständig bekanntes ICE
voraus. Bei einem dringlichen Remote darf der Bank-Owner stattdessen eine
endliche Folge verschiedener aktuell angebotener Bankauszahlungen an denselben
Bedarf binden. Der Run-Owner quotiert deren garantiertes Nettobudget mit der
unveränderten Risikopolicy und reserviert den Run-Klick. Nur eine danach
zugelassene vollständige Route rechtfertigt den ersten Bank-Step; unbekanntes
ICE bleibt bedingter Zugriff. Nach jeder Auszahlung werden Bedarf, Quelle,
Klickbudget und Reserve neu geprüft. Dieselbe endliche Bankquelle wird nicht
mehrfach als Auszahlung gezählt.

`packages/ai/src/runner/remote-contest/` enthält:

- `remote-contest-signals.ts`: Bedrohungs- und Zielbewertung, Vorbereitung,
  Runvarianten, Proberouten und Wiederaufnahme des gebundenen Parents;
- `remote-contest-admission.ts`: unmittelbare Pflicht, Letztchancenfenster,
  nicht tödlicher Handpuffer und konkret verbleibende Gefahrenfinanzierung;
- `remote-contest-plan-module.ts`: Discovery, Assessment, Routen und Priorität.

Central und Remote konsumieren dieselben Run-, Funding-, Vorbereitungs- und
Choice-Dienste unter `run-analysis/`. Diese Finanzierung konsumiert die
Remote-Zulassung aus `remote-contest-admission.ts`; sie erhält dadurch keine
eigene Ausnahmestrategie. Die Runtime liefert Coverage, sichtbare Runbewertungen
und den aktiven Parent. Das Run-Window führt den begonnenen Run weiter aus und
konsumiert dabei denselben Remote-Vertrag. Der Remote-Owner importiert keine
Registry, Live-Runtime oder Central-Implementierung zurück.

## 4. `runner.rig_and_coverage`

Ein belegter Coverage-Blocker vor einem Remote mit verdecktem oder bekanntem
Agendamaterial erhält bereits vor Matchpoint ein konkretes P4-Projekt,
sofern eine eigene Antwort bekannt ist und installiertes gerezztes ICE
eine aktuelle Engine-Quote besitzt. Der Coverage-Bedarf bindet den
`runner.contest_remote`-Parent, Run und `parentNeedId`; der Root behält
seinen offenen Bedarf während Suche, Finanzierung und Installation.
Damit konkurriert eine frühe gezielte Suche mit der aktiven Strategie,
statt als ungebundener allgemeiner Rig-Aufbau liegenzubleiben. Verdecktes
Material wird dadurch nicht zur bekannten Agenda oder zum P2-Nachweis.
Leere Remotes und ausschließlich unbekannter Schutz erhalten diesen
Projektanspruch nicht. D49/D59 aus Match e553 prüfen frühen Bedarf,
delegierte Suche und die negativen Gegenfälle.

Der vertikale Owner liegt in `packages/ai/src/runner/rig-coverage/`.
Die Dateien trennen Lückenbildung (`coverage-signals.ts`), Breaker-Aufrüstung,
Kosten-Recovery, Search-/Install-/Funding-Unterstützung, Actionzuordnung,
Dispositionen und exakte Fortsetzungsbindungen (`coverage-bindings.ts`).
`coverage-plan-module.ts` besitzt die Planphasen und Materialisierung.
Suchbedarf und Upgrade-Ökonomie liegen ebenfalls in diesem Verzeichnis.

Ein zusammengesetzter Karteneffekt mit positivem Draw-Anteil darf auch bei
genau einer Karte den vorhandenen `draw_for_answer`-Bedarf bedienen. Der
bekannte Stack muss weiterhin eine passende Antwort enthalten, die aktuelle
native Aktion muss vorhanden sein und die bestehende Draw-Tax-Prüfung bleibt
wirksam. Der Creditanteil erzeugt keinen zweiten Economy-Executor. Die
Originalentscheidung und eine echte Engine-Anwendung prüfen Plananschluss,
Klick-, Credit- und Kartenänderung; bei leerem Stack entsteht kein Coverage-Draw.

Eine notwendige MU-Ersatzinstallation bleibt auch mit angehängten
Recurring-Credit-Zahlungsvarianten ausführbar. Ob ein direkter
Installationsgeschwisterpfad besteht, wird ausschließlich an der vorhandenen
nativen `install_card`-Aktion und deren `runnerProgramTrashBeforeInstall`
festgestellt. Ein Action-ID-Suffix ist kein Beleg für freie MU. Coverage,
Quellinstanz und die anschließende exakte Programmopfer-Choice behalten
denselben Executor; eine tatsächlich direkte Installation wird weiterhin
ohne Opfer ausgeführt.

Kosten-Recovery vergleicht installiertes Rig, sichtbare Handantwort und
bekannte Stack-Alternative unter demselben finanzierten Pfadbudget. Die
aktuelle Run-Finanzierung bleibt davon getrennt: Eine bei Geldmangel größere
garantierte Trace-/Breakreserve ist keine Betriebskostenersparnis einer
neuen Installation. Zulassung verlangt niedrigere vollständige
Installations- plus Pfadkosten als die so gequotete bestehende Abdeckung.
Gleiche Kosten erzeugen keinen Effizienzbedarf, auch bei kostenloser Kopie.

Eine begrenzte Programmsuche in der eigenen Stack-Spitze
verwendet den generierten CardSpec-Zieltyp, die Anzahl betrachteter Karten
und die Kosten je übernommener Karte. Sie ist kein R&D-Informationswerkzeug
und garantiert keinen Treffer im gesamten Stack. Coverage und Entwicklung
binden vor der Aktivierung ein konkretes Ziel; aktive Suche verlangt bezahlbare
Übernahme und freie Handkapazität. Die Engine übergibt Karteninstanz und
Kartendefinition der Quelle strukturiert an die nachfolgende Choice. Deren
Resolver übernimmt ausschließlich das gebundene Ziel, falls es unter den
tatsächlichen Optionen liegt, ansonsten die erlaubte leere Auswahl. Er
entwickelt dort keine neue Suchstrategie und übernimmt keine weiteren Programme.

Die maximale Optionszahl allein macht eine begrenzte Spitzensuche nicht zur
Mehrkartensuche. Die Coverage-Fortsetzung trennt beide Verträge anhand der
vorher gebundenen kanonischen Quellfunktion. Auch bei einer abweichenden
aktuellen Choice-Quelle prüft anschließend derselbe exakte Einzelzielresolver
die ursprüngliche Bindung und scheitert bei Quellenverlust sichtbar.

Die Materialisierung verwendet nur die Actionmenge der aktuellen
Beschaffungsphase: direkte Suchaktionen in `search_answer`, Installationen
des Suchwerkzeugs in `setup_search_engine` und Ziehaktionen in
`draw_for_answer`. Ein höher bewerteter Zieheffekt darf nicht als Suchroute
ausgeführt werden. Discovery und Assessment verwenden dieselbe Zulassung;
die anschließende exakte Suchzielbindung bleibt unverändert verpflichtend.
Auch die Actionzuordnung verwendet diese Phasenregel. Konkurrierende
Ziehevents bleiben für die Handentwicklung verfügbar, solange Coverage
Suche oder Suchwerkzeug-Aufbau materialisiert. Sie werden nicht zugleich
von Coverage beansprucht und dort ohne ausführbaren Head ausgeschlossen.

Die Lückenbildung bindet Installationen an die tatsächlich ausgewählte
Handantwort. Ist für einen Bedarf keine Handantwort ausgewählt, bleibt
`installActionIds` ausdrücklich leer. Insbesondere darf eine benötigte
Effizienzverbesserung keine beliebige zweite Kopie des vorhandenen Breakers
als Antwort beanspruchen. Damit verwenden Phasenwahl und Disposition dieselbe
Quellenbindung; spätere Ausschlüsse können keinen zuvor gesperrten Ziehpfad
zur ausführbaren Route machen. Suche und Draw bleiben beim bestehenden
Coverage-Owner und werden nach neuer Information erneut gebunden.

Eine verpflichtende Draw-Replacement-Choice erhält den Handzweck ihres exakt
gebundenen `draw_for_answer`-Executors. Der Coverage-Owner schützt die einzige
sichtbare installierbare Antwort auf dessen benötigte Breaker-Rolle, solange
das installierte Rig diese Rolle tatsächlich noch nicht abdeckt. Konfigurierbare
Handantworten verwenden ihre kanonischen möglichen Modi; installierte Programme
verwenden ausschließlich ihre aktuelle Coverage. Der vorhandene Discard-Vertrag
vergleicht die übrigen tatsächlich gezogenen Optionen. Quelle, Origin, Executor,
StateVersion und Optionsbindung bleiben beim bestehenden fail-closed Resolver.
Paarung 524 G18 D33 belegt Antworterhalt, G35 D124 den unveränderten Duplikatabwurf.

Die Handentwicklung übernimmt eine Coverage-Zuordnung nur für die typisierte
`handAnswerDefinitionId` oder eine tatsächlich gebundene Installationsaction
derselben Definition. Rollenübereinstimmung allein überträgt keine Ownership
auf eine andere Handantwort. Die ausgewählte Definition bleibt auch während
der Installationsfinanzierung gebunden; definitionsgleiche weitere Kopien
behalten die bestehende ausdrückliche Zurückstellung.

Eine unbezahlbare Antwort auf der Hand sperrt keinen bereits exakt gebundenen
günstigeren Stack-Suchweg. `coverage-search-alternatives.ts` prüft bekannte
Such- und Installationskosten, freie Handkapazität, bekannte eigene
Stack-Verfügbarkeit und freie MU. Nur die vollständig finanzierte Beschaffung
erhält die Suchphase und Action-Ownership; eine direkt bezahlbare Handantwort
und eine bereits zertifizierte Konversion im selben Zug behalten Vorrang.
Die gestufte Suche verspricht keinen sofortigen Run. Nach der gebundenen
Such-Choice wird die tatsächliche Installation neu materialisiert.

Ein Zahlungsfenster erhält die exakt ausgewählte Coverage-Aktion auch in
`draw_for_answer`. Der bisherige Executor muss die Originalaktion in
`drawForAnswerActionIds` führen; Phase und benötigte Breaker-Rolle bleiben
unverändert. Für `install_answer` gelten entsprechend die Install-IDs,
für `search_answer` zusätzlich die konkrete Suchziel- und Versionsbindung.
Fehlende oder abweichende Bindungen scheitern mit `invalid_support_graph`;
die Zahlungsunterstützung erzeugt weder einen neuen Bedarf noch ein Suchziel.
Nach der exakt gebundenen Kostenfortsetzung einer Suche erhält der bisherige
Coverage-Executor auch seine aktive Portfolio-Zuordnung zurück. Dafür wird
die vorhandene Executor-Auswahl mit dem erhaltenen Plan verwendet; ihr Root
muss dem ursprünglichen Zahlungs-Origin entsprechen. Ein zwischenzeitlicher
Economy-Executor darf nicht die folgenden Quellen-, Ziel- oder Speicher-Choices
besitzen. Das vorab gebundene Suchziel und seine akzeptablen Speicheropfer
bleiben erhalten; abweichende Root- oder Suchversionsbindungen scheitern.
Während der Zahlungsunterstützung bleibt auch die ursprüngliche Parentkette
der Coverage-Aktion erhalten. Eine allgemeine Neuentdeckung derselben
Coverage-Instanz darf deren Remote-Parent nicht entfernen. Jede Kante wird
gegen die bisherige Bindung, beide residenten Elterninstanzen und den weiterhin
offenen Supportbedarf geprüft. Fehlende Eltern oder geschlossene Bedarfe werden
nicht rekonstruiert; sie scheitern mit `invalid_support_graph`.

`coverage-services.ts` benennt sieben Dienste: aktuelles Remote-Material,
bekannten verzögerten ICE-Abgang, direkte Run-Verwertbarkeit, Run-Funding,
materiellen Zentraldruck, dessen Kadenz und die gemeinsame Funding-Suche.
Diese Parentbewertungen werden aus der Live-Komposition eingespeist;
Coverage entscheidet daraus über seine eigene Vorbereitung. Der Owner importiert
weder die Live-Runtime noch die Core-/Tactical-Registry. Gemeinsame Funding-,
Rollen-, Quellen- und Run-Payoff-Fakten liegen außerhalb der Registries.
Die Live-Runtime koordiniert weiterhin Ausschlüsse zwischen mehreren Ownern.

**Klasse:** `development_project` oder dringender `bounded_sequence`
**Rolle:** Vordergrund/Background je Dringlichkeit
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- Wall-, Code-Gate-, Sentry- und Spezial-Coverage;
- Universal- und probabilistische Coverage;
- MU-/Slot-Konflikte;
- Suche, Draw, Recovery und Installation;
- Bezahlbarkeit des anschließenden Runpfads;
- deckstrategischer Rig-first- oder Minimal-Rig-Modus.

Die Deck-Fähigkeitsmatrix trennt mögliche
Deck-/Handantworten von der tatsächlich installierten Abdeckung. Bei einem
kanonischen Break-Matcher mit gewähltem Untertyp zählt nur der öffentlich
sichtbare aktuelle Modus jeder installierten Instanz. Noch nicht gewählte
Modi und weitere Handkopien erzeugen keine aktive Abdeckung; unterschiedliche
installierte Kopien dürfen ihre jeweils gewählten Rollen gemeinsam abdecken.
Diese Fakten schließen erfüllte Setup-Bedarfe vor weiterer Suche oder Draw.

Die MU-Opferbewertung unterscheidet feste Breakerfunktionen anhand der
kanonischen Break-Fähigkeiten. Das gemeinsame gedruckte Merkmal `icebreaker`
macht eine Wall- und eine Code-Gate-Antwort nicht gegenseitig redundant.
Diese Einordnung wirkt vor der Installationswahl und Opferbindung; ein bereits
ausgewählter `PlanExecutionOrigin` wird im folgenden Choice-Fenster weiterhin
unverändert ausgeführt.

Die Opferbewertung bindet jede Kandidateninstanz an das tatsächliche eigene
Rig und bewertet alle Programme, die beim rekursiven Engine-Trash mit ihrem
Host verloren gehen. Redundanz und einzigartige Coverage werden gegen das
nach diesem gesamten Verlust verbleibende Rig geprüft; zwei gemeinsam
verlorene Kopien decken danach keinen Bedarf. Dieselben sichtbaren
Hostverlust-Fakten verwendet die Shell-Traders-Ersatzbewertung. Die
freisetzbare MU bleibt dagegen die von der aktuellen Engine-Choice gequotete
MU der auswählbaren Wurzel. Gedruckte MU von auf einem Daemon gehosteten
Kindern wird nicht als zusätzliche Opferkapazität erfunden. Andere kanonische
Hostmechaniken behalten ihren tatsächlichen MU-Vertrag. Fehlende oder
zyklische eigene Hostbindungen scheitern mit strukturierter Diagnose.
Choice-ID, StateVersion, Planinstanz, Executor und ursprünglicher Step
bleiben bei der reinen Optionsauflösung unverändert.

Deckinventar und Handantworten übernehmen die ICE-Kategorien aus dem
kanonischen Breakerprofil. Bedingte Zusatzeffekte im Regeltext erweitern diese
Abdeckung nicht: Ein Folgeeffekt nach einer vollständig gebrochenen Wall ist
keine allgemeine Sentry-Antwort. Für die Beschaffung eines konfigurierbaren
Breakers gelten seine kanonischen `coverageCandidates`; die installierte
Instanz deckt weiterhin nur ihren tatsächlich gewählten Modus ab.

Bei einer Installationsaction mit bereits festgelegtem `selectedSubtype`
zählt für den Coverage-Step genau diese Variante. Der Owner prüft den Modus
bereits beim Aufbau der Installationswerte und übernimmt ihn in die
sichtbare Runpfadprojektion. Materialisierung und Actionzuordnung verwenden
dieselbe Rollenprüfung. Mögliche Modi der Kartendefinition dürfen keinen
abweichenden aktuellen Installationsmodus als erfüllte Antwort ausweisen.
Eine erst später zulässige Moduswahl bleibt eine eigene gebundene Vorbereitung.
Die Handentwicklung verwendet dieselbe Prüfung bei der Übergabe an den
Coverage-Owner. Andere legale Installationsmodi bleiben beim zuständigen
Entwicklungsplan klassifiziert. Dessen ausführbare Alternativen nehmen keine
bereits dem Coverage-Owner zugeordneten Varianten wieder auf.

Mögliche Phasen:

```text
identify_required_coverage
locate_answer
fund_answer
resolve_mu
install_answer
validate_run_path
```

Das Modul darf nicht bei jeder spielbaren Programminstallation wachsen. Es
arbeitet auf eine konkrete Coverage- oder Rig-Fähigkeit hin.

Die diagnostisch sortierte Liste fehlender ICE-Abdeckung bestimmt keine
Suchpriorität. Bei der Ableitung des Rollenbedarfs stehen Wall, Code Gate und
Sentry vor ergänzenden AP-/Trace-Merkmalen. Ein bekannter Sentry mit dem
Untertyp `killer` benötigt dadurch eine Sentry-Antwort; das alphabetisch frühere
`ap` darf keinen unerfüllbaren Suchbedarf erzeugen. Rein spezielle AP-, Trace-
und unbekannte ICE behalten ihren spezifischen beziehungsweise universellen
Bedarf. Suche und Optionsbindung folgen weiterhin exakt dem gewählten
Coverage-Plan, Step und Executor.

Eine exakt gebundene Upgrade-/Kosten-Recovery-Route bleibt an ihre gewählte
Karteninstanz gebunden. Fehlt ihre tatsächliche sichtbare Antwort, liefert
der Signalproducer eine ausdrücklich leere `installActionIds`-Liste.
Eine ausgelassene Liste würde sonst beliebige rollenkompatible Installationen
in die Phasenwahl aufnehmen, obwohl sie den gebundenen Bedarf nicht erfüllen.
Dispositionen und Materialisierung bestimmen so dieselbe Beschaffungsphase;
eine spätere Duplikat-Zurückstellung darf die zuvor ausgeschlossene Drawroute
nicht wieder zur ausführbaren Route machen. Weitere Handkopien derselben
Definition, die nur diesem Bedarf zugeordnet sind, erhalten eine ausdrückliche
Zurückstellung beim Coverage-Owner; sie erzeugen weder einen zweiten generischen
Entwicklungsplan noch eine Lücke in der LegalAction-Klassifikation. Der
Entwicklungsproducer übernimmt diese Zuordnung nur für die durch
`handAnswerDefinitionId` oder eine konkrete Installationsaction gebundene
Definition und ihre weiteren Kopien. Eine ausdrücklich leere Antwortliste
oder die Antwort einer anderen Definition übernimmt keine nur
rollenkompatible Handkarte; deren eigenständiger Entwicklungsbedarf bleibt
beim Entwicklungs-Owner. Lehnt ein
exakt gebundener Zentraldruck- oder Remote-Parent seinen aktuellen Payoff mit einem Wert
kleiner oder gleich null ab, bleibt auch seine Installation ausdrücklich
zurückgestellt. Eine andere positive oder unabhängige Coverage-Bindung
derselben Action bleibt davon unberührt. Diese Dispositionen ändern weder
die gewählte Kopie noch Action-ID, Parent-/Need-Bindung oder Executor.

Bei vollständig bekannter, bereits abgedeckter, aber zu teurer ICE-Kette
vergleicht die Kosten-Recovery alle Breaker-Rollen gegen die Kosten des
gesamten Pfads. Die erste ICE-Rolle darf die Suche nicht auf diese Rolle
verengen. Aktuell legal installierbare Handantworten stehen wie bisher vor
Such- und Draw-Routen; innerhalb dieser Klassen entscheidet die gesamte
Installations- und Pfadkostensumme. Noch unbezahlbare bekannte Handantworten
dürfen weiterhin ihren bestehenden Installations-Finanzierungsbedarf erzeugen;
bei gleicher Antwort und gleichen Kosten bleibt die kanonische Rollenreihenfolge
stabil. Der gewählte Rollenbedarf, die konkrete
Installation und der anschließende Run bleiben an denselben Parent gebunden.

Hat diese Kosten-Recovery oder ein Upgrade bereits eine konkrete Antwort
gewählt, bleibt deren Handverfügbarkeit maßgeblich. Eine allgemeine
rollenpassende Handkarte darf eine noch im Stack liegende bessere Antwort
nicht als `answerInHand` ersetzen. Die Beschaffungsphase behält damit das
gewählte Ziel; eine weitere Kopie des bereits teuren Breakers wird nicht
zur Installationsantwort dieses Recovery-Bedarfs.

Ein konkreter Remote-Parent darf außerdem eine sichtbare Handinstallation als
Kosten-Vorbereitung binden, auch wenn seine ICE-Kette noch unbekannte Teile
enthält. Der Coverage-Owner vergleicht dafür den bekannten Pfad mit dem
aktuellen und dem ergänzten Rig einschließlich sichtbarer zusätzlicher
Break-Gebühren. Die Installation muss legal, ohne Programmopfer und mit freier
MU ausführbar sein. Ihre Kosten müssen sich bereits auf dem bekannten Pfad
dieses einen Runs ausgleichen; Installations- und Run-Klick sowie die gesamte
bekannte Creditquote müssen im aktuellen Zug verfügbar bleiben. Ein bekannter
nicht finanzierter Zugriff oder ein fehlender positiver Remote-Payoff lässt
diese Vorbereitung nicht zu.

Die Quote garantiert nur die Einsparung am bekannten Pfad. Unbekannte ICE und
spätere Rez-Entscheidungen bleiben ausdrücklich bedingt. Nach der Installation
bewertet der bestehende Remote-Parent Pfad, Zugriff und Reserven mit dem neuen
Rig erneut; eine Reserve aus dem alten Rig darf eine konkret gebundene,
kostenneutrale Vorbereitung nicht als beliebige überlappende Installation
verwerfen. Direkte terminale Runs auf vollständig bekannten, bereits
bezahlbaren Pfaden behalten ihre bestehende Priorität.

Eine heute zu teure bekannte ICE-Kette darf die Prüfung einer günstigeren
Handinstallation nicht bereits durch ihren ungeförderten Payoff sperren.
Der Coverage-Owner quotiert Installation, freie MU, verbleibende Aktionen,
ganzen Runpfad und aktuelle Engine-Stealkosten gemeinsam neu. Nur eine
finanzierte, positiv bewertete Konversion erhält die vorhandene
`sameTurnRunConversion`-Bindung. Der Remote-Owner darf diese günstigere
Vorbereitung gegenüber einer noch zu finanzierenden Eventroute desselben
Servers wählen; eine bereits unmittelbar ausführbare Route behält Vorrang.
Unbekanntes ICE zertifiziert diesen zusätzlichen Konversionsnachweis nicht.
Die bestehende kostenneutrale Vorbereitung am bekannten Teil eines bedingten
Pfads bleibt getrennt erhalten. Nach der Installation werden echte
LegalActions, Zugriffskosten und Risiko erneut bewertet.

Eine lokale Economy-Zurückstellung von Mehrzweck-Hardware gilt nur für ihren
Einkommenszweck. Eine bereits exakt gebundene Coverage- oder MU-Vorbereitung
derselben Installation bleibt beim Coverage-Owner ausführbar. Andere,
ungebundene Kopien bleiben zurückgestellt; echte globale Sicherheits- und
Installationsausschlüsse werden dadurch nicht entfernt.

Der gemeinsame Fact-Service `RunnerRigDemandProjection` bildet dafür
ausschließlich vorhandene planlokale Bedarfe ab. Jeder Demand trägt Owner,
Ursprung, Parent-/Need-Bindung, Horizont, Garantiegrad, Bedarfsart und
side-sichere Providerzustände. Nur `required_simultaneously` und
`preferred_simultaneously` eines konkreten Plans dürfen allgemeinen
MU-Ausbau begründen; `doctrine_option`, Handfülle oder ein nur irgendwann
möglicher Draw dürfen das nicht. Die Projektion wird je `stateVersion` und
side-sicherem Planning-Fingerprint neu aufgebaut, scheitert bei fehlenden
MU-/Providerquotes fail-closed und besitzt weder Plan-, Action-, Executor-
noch Discard-Autorität.

Mehrere alternative Coverage-Needs dürfen dieselbe wiederverwendbare
Breakerbelegung über einen expliziten `memoryReuseKey` teilen. Ihre einzelnen
Parent-/Need-Bindungen bleiben erhalten; innerhalb eines simultanen Sets zählt
diese Belegung nur einmal. Der Fact-Service verlangt dafür identische
Capability- und Provider-/MU-Fakten und scheitert bei Widerspruch fail-closed.
Ohne explizite Wiederverwendung bleiben Bedarfe unabhängig; unterschiedliche
Programminstanzen und additive Supportpools werden nicht zusammengelegt.

Ein installierter Speicherprovider ist bereits in der aktuellen Kapazität
enthalten und kein zusätzlicher Ausbau. Bei exklusiver Deck-Hardware zählt
für einen MU-Bedarf ausschließlich der Zuwachs nach Abzug des ersetzten
installierten Decks. Eine identische Ersetzung oder ein anderes Deck mit
derselben Kapazität kann daher keinen weiteren Speicherbedarf erfüllen.

Sichtbare additive Programme mit `conditional_support` dürfen ihren echten
MU-Verbrauch in den bevorzugten simultanen Meilenstein eines bereits
vorhandenen required-/preferred-Coverage-Parents einbringen. Sie erzeugen
selbst keinen Capacity-Parent. Der daraus abgeleitete MU-Ausbau bleibt beim
Coverage-Owner und wird vor der Memory-Projektion aus demselben gebundenen
Demand-Set berechnet. So kann ein künftiger Breaker zusammen mit bereits
sichtbaren kompatiblen Run-Credit-Programmen eine frühe MU-Vorbereitung
begründen, ohne aus allgemeiner Programmdichte ein Zielrig zu erfinden.

Nach erfüllter Breaker-Abdeckung liefert zusätzlich der bestehende
Handentwicklungs-Owner einen begrenzten nächsten Support-Meilenstein aus
`hand-development/strategic-support-development.ts`. Ein vorhandener
pumpfähiger Breaker, sichtbare bezahlbare Handprogramme und ein nicht akut
bedrohtes Entwicklungsfenster sind Voraussetzung. Höchstens zwei Programme,
je eines pro Funktionsart (bedingte Counter-Stärkesenkung, passive
Stärkesenkung, kompatible erneuerbare Breakercredits), bilden einen
`preferred_simultaneously`-Bedarf. Ein schon belegter Virusplatz, drei
gleichartige passive Stärkesenkungen beziehungsweise bereits sechs
erneuerbare Breakercredits begrenzen spekulativen weiteren Ausbau.

Die Projektion erhält diesen konkret zugelassenen Entwicklungsbedarf auch
ohne offene Coverage-Lücke. Eine Kapazitätsvorbereitung gehört dann zum
Handentwicklungs-Owner, nicht zu einem erfundenen Coverage-Plan. Speicher wird
nur angeboten, wenn der nächste sichtbare Meilenstein den freien Platz
überschreitet. Speicherinstallation, Folgeprogramme und Creditreserve müssen
zusammen finanzierbar sein; jeder Speicherprovider wird mit seiner eigenen
aktuellen LegalAction geprüft. Handfülle allein erzeugt weiterhin keinen
Speicherbedarf. Nach jeder echten Installation wird neu bewertet; es werden
keine zukünftigen Action-IDs festgeschrieben.

Die kumulative Installationsbewertung konsumiert einen solchen bevorzugten
Supportbedarf für genau die gebundene Handkarteninstanz auch nach dem
Speicherausbau. Ein zugelassener endlicher Entwicklungsmeilenstein bleibt
mittlerer Bedarf; er darf nicht durch eine reine Dublettenprüfung wieder
verloren gehen. Ungebundene weitere Kopien, fehlende kompatible Verbraucher,
Reservegrenzen und akute Abschlussfenster erzeugen dadurch keinen neuen
Investitionsbedarf. Die Auswahl bleibt beim bestehenden Recurring-Owner.

Ein Basic Draw für eine im eigenen Deck side-sicher bekannte Antwort wird als
exakte Route dieses Coverage-Plans gebunden. Eine volle Hand ist dabei keine
harte Sperre: Der Plan darf den sichtbaren Cleanup-Trade-off bewerten, wenn die
fehlende Rolle konkret benannt ist und die Antwort nachweislich noch im Stack
liegt. Er darf dafür jedoch keinen lediglich allgemein legalen Draw anhand des
semantischen Typs übernehmen; die konkrete `actionId` muss vom Coverage-Support
gebunden sein.

Eine exakt gebundene Antwort im eigenen sichtbaren Heap bleibt unabhängig
von verbleibenden Stack-Antworten eine Recovery-Route. Eine Suchaktion darf
nicht zugleich als passende Heap-Rückholung und als Suche ohne Deckantwort
klassifiziert werden. Der Coverage-Support trennt diese Mengen vor der
Speicher- und Opferbindung; deren tatsächliche Ablehnungen bleiben wirksam.

Liegt die Antwort unter anderen sichtbaren Heap-Karten, darf derselbe
Coverage-Owner eine begrenzte Top-Heap-Vorbereitung an seinen Remote-Parent
binden. Voraussetzung sind eine kanonisch wiederholbare Rückholfähigkeit ohne
Limit oder zusätzliche Bedingung, die exakte aktuelle Top-Karte, freie MU und
ein vollständig bekannter, finanzierter ICE-Pfad. Die Quote reserviert alle
Rückhol-, Installations- und Run-Klicks sowie ihre Credits; eingeschränkte
Creditpools bezahlen ausschließlich den passenden Runpfad. Jede Folgeaktion
wird aus den nächsten LegalActions neu materialisiert. Die erste Rückholung
ist ausdrücklich eine Vorbereitung und wird nicht als bereits erhaltene
Coverage-Antwort ausgegeben.

Ein Coverage-Bedarf darf höchstens einen Draw pro Runner-Zug ausführen. Das
gilt sowohl für den allgemeinen Rig-first-/Setup-Anker als auch für einen
nicht terminalen konkreten Runbedarf. Der Draw ist eine private
Beobachtungsgrenze; weitere Klicks desselben Zugs müssen nach der Neuplanung
anderen produktiven Plänen, einer exakt gebundenen Suche, Finanzierung oder
Installation offenstehen. Eine akute, als P2 belegte terminale
Coverage-Unterbrechung wird von dieser Draw-Kadenz nicht abgeschwächt.

Eine Runner-main-Fähigkeit, welche die aktive Coverage eines bereits
installierten flexiblen Breakers umstellt, gehört ebenfalls ausschließlich
`runner.rig_and_coverage`. Die sichtbare Runpfadquote muss Quellinstanz,
Definition, Ziel-Coverage sowie Klick- und Creditkosten der Vorbereitung
liefern. Das Modul bindet daraus die exakte aktuelle `LegalAction` als
Kindplan des zuständigen Zentraldruck- oder Remote-Contest-Plans. Ohne einen
solchen konkreten Runbedarf wird die Umstellung ausdrücklich als unproduktiv
klassifiziert; sie darf weder ownerlos bleiben noch vorsorglich auf Verdacht
ausgeführt werden.

Die Zulassung einer solchen Vorbereitung verwendet auch die
Informationsprobe-Regel ihres Run-Parents. Eine Mode-Umstellung darf keinen
Runbedarf vortäuschen, dessen bekannte Pfadkosten nach der Vorbereitung die
zugelassene Informationsprobe weiterhin ausschließen. Terminale oder
nachweislich anders verwertbare Runlinien behalten ihre vorhandenen Ausnahmen.

Die terminale Zentralchance bei unerreichbarer Remote-Scorebedrohung verwendet
für Parent und Coverage-Kind denselben Zulassungsnachweis aus
`runner-run-purpose.ts`. Überschreibt der Parent damit die gewöhnliche
Creditreserve-Empfehlung, muss er weiterhin jede in der Quote enthaltene
Subtypvorbereitung exakt binden und vor dem Run ausführen. Die Ausnahme hebt
weder bekannte Zugriffssperren noch eine blockierte Runreserve auf.

Der Vergleich sichtbarer Breaker-Modusvarianten erhält bei gleicher
Zugänglichkeit zuerst bezahlbare Antworten auf bekannte ICE-Gefahren.
Eine teure Gefahrenvermeidung darf nicht als Ersparnis verschwinden, nur weil
eine kostenpflichtige Umstellung sie unbezahlbar macht. Erst danach vergleicht
die Pfadquote die verbleibenden Kosten. Die konkrete Run- und Risikowahl bleibt
beim gebundenen Planowner.

Eine vorbereitende Modusänderung darf für keinen Runzweck eine aktuell
blockierte Runreserve umgehen; Umstellungskosten sind dabei eingerechnet.
Eine Scorebedrohung allein erlaubt keine unfinanzierte Vorbereitung, die eine
bereits nutzbare andere Route wieder schließt. Die vorhandenen exakt gebundenen
terminalen Ausnahmen bleiben beim gemeinsamen Run-Finanzierungsdienst.
Eine allgemeine Economy-Untergrenze entzieht einem bereits zugelassenen
Access-Parent hingegen nicht seine nötige Modusvorbereitung.

Bei einer noch nicht installierten konfigurierbaren Breakerkarte berücksichtigt
derselbe Coverage-Owner die typisierten `coverageCandidates` des kanonischen
Hints. Sie sind mögliche zukünftige Modi und keine gleichzeitig aktive
Rig-Abdeckung. Der konkrete Installationspfad bleibt an Quelle, LegalAction,
Rolle und Parent gebunden; die Engine-basierte Pfadprüfung wahrt Moduskosten
und die Bindung einer einmaligen Moduswahl. Feste Deckdoktrin-Rollen dürfen
diesen nachgewiesenen Installationspfad nicht erneut verwerfen.

Eine Coverage-Suche mehrerer Stackkarten in die Hand bleibt im privaten
Suchfenster unter ihrem ursprünglichen Root und Coverage-Executor.
`coverage-multi-search-choice.ts` prüft die gewählte Quellenaction,
StateVersion, Bedarfsbindung und aktuellen Engine-Optionen. Der Owner wählt
zuerst die exakt gebundene Antwort. Für weitere Karten bewertet er die bereits
gewählten Handkopien mit; derselbe beantwortete Suchbedarf erhält keinen
weiteren Antwortbonus. Die Projektion installiert keine Karte und erzeugt
weder Credits noch freie MU. Erforderliche Kopien bleiben zulässig. Der
Payload-Resolver konsumiert ausschließlich die fertige, versionsgebundene
Auswahl. Der gespeicherte Zustand 471/R3/G5/D135 und Gegenfälle sichern
Quellbindung, unveränderte Action/Ownership und exakte Optionszahlen.

## 5. `runner.develop_board_and_hand`

Kartenname und Definition-ID dienen der Identität und Bindung, nicht als
Funktionswörter für die Handentwicklung. Der Funktionstext konsumiert
Regeltext, Kartentyp/Subtypen und die erzeugten semantischen Signale. So wird
eine Expose-Karte mit „Search“ im Namen nicht zur Suchmaschine und eine
einmalige Zahlungsquelle mit „Bank“ im Namen nicht zur manuellen Sparbank.

Eine zugriffsgetriggerte globale Expose-Quelle erhält ihren aktuellen
Informationsbedarf aus tatsächlich unbekannten installierten Corp-Karten,
einschließlich Root-Karten. Sind alle relevanten Ziele bekannt, darf ein
positiver Installationsfit diesen fehlenden Bedarf nicht wieder erzeugen.
Die Investition garantiert keinen späteren HQ-Erfolg. Andere
Informationsfähigkeiten behalten ihre eigenen Ziel- und Consumerverträge.

Derez während der Encounter-Auflösung ist bekannte Zugriff-Unterstützung,
kein `unknown` und kein Einkommen. Die Rollen- und persistente
Funktionsprojektion erhalten diesen Fakt. Eine ungebundene generische
Installation entsteht daraus nicht: Der ganze Break-/Derez-/gegnerische
Re-Rez-/Folgerun-Investitionsconsumer aus SP-307 bleibt eine gesonderte offene
Frage. Ein Run-Ereignis mit optionalem späterem Derez bleibt ein Run-Ereignis.

Zielpräferenzen und Vermeidungshinweise eines Hint-Targetprofils ordnen
Kandidaten innerhalb einer gebundenen Fähigkeit. Sie erzeugen keine
Kartenrolle oder funktionale Coverage: Eine Präferenz für das Entfernen
gegnerischer Wirtschaft ist insbesondere kein eigenes Einkommen. Die
Handentwicklung projiziert diese Beschreibungen deshalb nicht in ihren
Funktionstext. Die ausdrücklich erzeugte Planrolle
`protect_virus_counters` liefert weiterhin Virus-Unterstützung für
Zugriffspläne; sie wird nicht aus einer Zielpräferenz abgeleitet. Der native
531/R1/G5/D27-Checkpoint und reale Einkommens-, Informations- und
Virus-Schutzkarten sichern diese Grenze samt fehlender Installationsbank ab.

Die Suchkadenz verwendet ausschließlich ein tatsächlich abgeschlossenes
`resolve_choice`-Ereignis des aktuellen Runner-Zuges. Die Aktivierung eines
Suchwerkzeugs mit noch offener Choice ist kein Suchabschluss; frühere Züge
sperren keine neue strategisch gebundene Suche. Eine noch bekannte Programmkarte
in der Hand begrenzt weitere allgemeine Suchen desselben Zuges, beweist aber
keine konkrete Coverage-Antwort. Diese Kadenz und `answerInHand` behalten
getrennte Diagnosegründe; konkrete Coverage-Bedarfe und die exakte Quellen-/
Ziel-/Optionsbindung bleiben bei ihren bisherigen Ownern.

Die strategische Programmsuche zählt bekannte eigene Instanzen in Grip, Rig,
Heap, Score Area, Set-aside und Removed genau einmal. Set-aside ist kein
verfügbarer Stackbestand. Ein fehlendes Ziel eröffnet keinen Suchplan.
Eine vorgebundene Stack-Suche bewahrt Quelle, Ziel und Executor durch die
separate Quellwahl, eventuelle Zahlung und anschließende Kartenwahl. Die
Quellwahl setzt die Continuation-StateVersion fort; der Payloadresolver darf
kein anderes Ziel erfinden (SP-504/SP-505).

Vor der Quellenaction prüft derselbe Development-Owner jedes strategische
Programmziel gegen genau diese aktuelle LegalAction. Bei direkter Installation
reserviert er Quellenkosten und den kanonischen Zielpreis gemeinsam; kostenlose
Installation bleibt kostenlos. Aktuell bekannte MU müssen das Ziel aufnehmen
können. Development besitzt dafür keine Programmopfer-Continuation und darf
deshalb bei fehlendem MU keinen Opferplan voraussetzen. Eine Suche in die Grip
hat dagegen keinen unmittelbaren Installationspreis oder MU-Verbrauch. Jede
Quelle bindet ihr eigenes ausführbares Ziel; reguläre Installation einer
Suchressource ist noch keine ausgeführte Suche. Fehlende oder widersprüchliche
Kosten-/MU-Fakten scheitern sichtbar, statt nach der Quellenzahlung ein anderes
Ziel zu wählen. Eine aktuell legale Installation einer Suchquelle darf der
Development-Owner für einen konkreten späteren Suchzweck vorbereiten. Dieser
Installationsstep bindet ausschließlich seine aktuellen Installationsactions
und erzeugt noch kein `programSearchCommitment` für ein ungeöffnetes Suchfenster.
Die nativen Producerzustände 506/G2/D63, G9/D153 und G35/D132
belegen die Quellen-, Kosten- und Speichergrenzen; echte Enginekontrollen
erhalten vollständig bezahlte, kostenlose und gestufte Suchpfade.

Eine Zahlung für das Trash einer vollständig gebrochenen, gerade passierten
ICE ist kein Einkommen. Die typisierte `ice_trash`-Wirkung mit Ziel
`trash_fully_broken_passed_ice` und Timing `encounter_resolution` erhält die
Rolle `access_payoff` und persistente `access_support`-Coverage. Sie begründet
keinen allgemeinen Economy- oder Setup-Bedarf, auch nicht bei hohen Credits
oder strategischem Installationsfit. Die produktive Vorbereitung bleibt beim
vorhandenen, exakt gebundenen Zentraldruck-Parent mit finanzierter aktueller
Run-/Break-/Trash-Folge. Paarung 475/R13/G1/D47 belegt den früheren falschen
Economy-Zweck; native Eingabe, generierter Hint und echte Engine-Folge sichern
die Korrektur und ihre Zulassungsgrenzen.

Einmalige Suchereignisse werden auch anhand ihres aktuellen kanonischen
`effectKind` für Stack- oder Heap-Suche erkannt. Ohne exakt gebundenen
Zielplan erhält die Aktion die bestehende ausdrückliche Zurückstellung;
produktive Coverage- und Entwicklungs-Recovery behalten ihre Zielbindung.
Zusätzliche Kartenhinweise sind für diese bereits bekannte Aktionssemantik
keine Voraussetzung.

Der Owner ist unter `packages/ai/src/runner/hand-development/` gebündelt:
`hand-development-evaluation.ts` und die persistente Installationsbewertung
liefern den Kartenwert; `development-discovery.ts` erzeugt zugelassene
Kartenpläne und ihre Funding-Needs aus typisierten aktuellen Fakten der
anderen Owner. `development-signals.ts` liefert Draw-, Such- und
Entwicklungssignale. `development-plan-module.ts` besitzt Discovery,
Assessment und Materialisierung der registrierten Planinstanzen.

`development-search-targets.ts`, `development-restricted-sequence.ts` und
`development-choice-bindings.ts` bündeln Zielwahl, begrenzte Installfolgen und
die unveränderte Bindung durch Engine-Zahlungs-/Choice-Fenster. Zwei explizite
Installations-Prüfdienste und der gemeinsame Keep-Scorer liefern Bewertungen;
sie wählen keine neue Action. `development-funding.ts` benutzt die geteilten
exakten Funding-Routen in `runtime/runner-exact-funding-routes.ts`. Die
Runtime komponiert die Owner-Fakten und führt weiterhin die gemeinsame
Zugplanung aus; sie enthält keine zweite Handentwicklungs-Discovery.

Die Admission in `development-discovery.ts` schützt die vorhandene
Mindesthandreserve auch vor einer optionalen Installation, deren echte
LegalAction-Kosten die restlichen Aktionen verbrauchen. Maßgeblich ist das
projizierte `netHandDelta` einschließlich unmittelbar gebundener Draw-Effekte.
Der geschützte Bestand ist höchstens die aktuell vorhandene Hand; eine
bereits zu kleine Hand wird nicht als ausreichende Reserve ausgegeben.
Installationen mit erhaltener Reserve oder verbleibender Folgeaktion behalten
ihre bisherige Prüfung. Spezial-Owner und der gemeinsame Scheduler bleiben
für ihre eigenen Routen verantwortlich.

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.
Ein pauschaler `play_best_hand_card`-Owner existiert nicht.

Der Deckpaar-Beleg für eine wirtschaftlich bessere Breaker-Variante stammt
aus `ownDeckSnapshot.cards`. `quantityKnownInDeck` beschreibt dagegen den
verbleibenden Stackbestand und dient der aktuellen Verfügbarkeit. Beide
Kopien in der Hand oder eine letzte installierte Kopie löschen deshalb keine
ursprüngliche Deckpaarung. Ohne eigenen Runner-Snapshot bleibt die Paarung
mit `own_deck_snapshot_unavailable` ausdrücklich unbelegt; Vorteile,
Strategieausrichtung, primäre Coverage, MU und Reserve bleiben eigenständige
Zulassungsbedingungen im bestehenden Entwicklungs-Owner.

Erfolgsrun-Counter mit Stärkesenkung auf vollständig gebrochener ICE werden
mechanisch als Rig-Unterstützung klassifiziert. Ihre Installation erhält über
`successful-run-counter-development.ts` den konkreten Zweck
`prepare_successful_run_strength_counters`; ein bloßes `unknown:setup` ist
kein Ersatz. Die vorbereitete erste Kopie darf auch am letzten Klick einen
P5-Aufbauplan erhalten. Ihr begrenzter Optionswert setzt einen installierten
pumpfähigen Verbraucher und bekannte positive oder noch unbekannte ICE
voraus. Er ist keine sofortige Runverbilligung und garantiert weder
Erfolgsrun, vollständigen Break, Countererhalt noch einen gegnerischen Purge.
Vollständig bekannte Nullstärke, Tags, Matchpoint, kurze Deckreste und
sichtbare Remote-Fristen schließen diesen Vorratszweck aus. Direkte
Installationslegalität, MU und tatsächliche Kosten bleiben verbindlich.

Eine vorhandene `rig_first`- oder `economy_setup_before_pressure`-Ausrichtung
liefert bis zu 15 zusätzliche Optionspunkte innerhalb dieses Aufbauzwecks.
Sie erzeugt weder Legalität noch Consumer oder Bedarf. Zusätzliche Kopien und
Installkosten mindern den Optionswert. Die bestehende Zugplanung entscheidet
weiterhin zwischen diesem Aufbau und dringenderen Spielzügen. Regressionen
beginnen mit der echten Karte in der Hand, prüfen produktive Auswahl,
Plan/Route/Executor und die aufeinanderfolgende Speicher-/Virusinstallation
ohne Runtime-Reset.

Verantwortung:

- eine strategisch nützliche Karte spielbar machen;
- ein Deck- oder Board-Engine-Stück entwickeln;
- sinnvollen Draw, Search, Install oder Eventeinsatz koordinieren;
- generische Karten ohne eigenen Spezialplan verwertbar machen.

Ein Host mit erneuerbaren, nur für seinen gehosteten Breaker verwendbaren
Credits erhält seinen Entwicklungszweck aus
`hand-development/hosted-breaker-development.ts`. Der Vergleich bindet eine
konkrete kompatible Handkarte und die aktuelle legale Installationsaktion.
Ein zweiter Breaker derselben Definition ist bei positivem Zusatznutzen
zulässig; bloße Bezahlbarkeit oder eine Deckkopie genügt weiterhin nicht.
Die gespeicherten D54/D120-Zustände aus `match_26a1db342966ffbe` bleiben
negative Kontrollen für einen nicht rentablen Hostaufbau.

Die Bewertung vergleicht die liquiden Kosten vollständig bekannter zentraler
ICE-Pfade mit und ohne Hosting. Vorhandene erneuerbare Pools werden in beiden
Alternativen aufgefüllt; nur die zusätzliche Ersparnis zählt. Der bedingte
Horizont beträgt höchstens fünf Runnerzüge, begrenzt durch beide Deckreste.
Installcredits und zusätzliche Installklicks werden abgezogen. Ein beim ersten
Breaker tatsächlich vermiedener MU erhält 0,5 Creditäquivalente Optionswert,
bei konkretem zusätzlichem Handprogramm und Speicherengpass 1,5. Das ist eine
begrenzte Policy, keine garantierte Runfolge oder heutiges Guthaben.
Positive Investitionen beanspruchen P4 mit höchstens 300 Punkten; Tags,
sichtbare Agenda-/Advancementfristen, Matchpoint, fehlende Folgeklicks und
ungenügende Runreserve schließen sie aus. Fehlende bekannte Pfade oder
Nullersparnis werden nicht durch einen allgemeinen Kartenbonus ersetzt.

Bei schon installiertem Breaker bleibt die alte Kopie zunächst erhalten.
Ihre spätere Entfernung wird weder vorausgesetzt noch als bereits freie MU
verbucht. Die aktuelle Folgeinstallation bindet ausschließlich die von der
Engine angebotene Hostroute. Ein bereits produktiver gleichartiger Host oder
ein verfügbarer leerer kompatibler Host verhindert weitere redundante
Hostkäufe. Coverage berücksichtigt bei der planinternen Wahl einer vorhandenen
Hostroute den gebundenen Kreditvorrat; dringende Coverage bleibt höher
priorisiert als der Hardwareaufbau.

Die öffentliche `hostOnCardId` bleibt in der positiven AI-DTO-Allowlist erhalten.
Die Regression prüft die wiederholte DTO-Projektion sowie frühe und spätere
Installationsfolgen mit echten Engine-Aktionen, einschließlich vollständig
belegter normaler MU. Die bekannte Pfadbewertung berücksichtigt bei gleichen
mechanischen Breakkosten die für die konkrete Breakerinstanz verfügbaren
Credits vor dem stabilen Instanz-ID-Tiebreak. Budgetfreie Kostenanfragen
vergleichen weiterhin ausschließlich mechanische Kosten.

Auch die negative Ersatzbewertung eines exklusiven Decks ist verbindlich:
`already_satisfied` verwirft die Installation als Duplikat, selbst wenn ein
allgemeines Teilprofil vermeintlich zusätzliche Speicher- oder Kreditkapazität
meldet. Eine identische Neuinstallation ersetzt diese Kapazität; sie addiert sie
nicht. Die realen G1D123/G4D230-Zustände der Paarung 456 sichern die Ablehnung
beim Entwicklungsowner. Ein durch dieselbe Ersatzbewertung bestätigtes
`positive_upgrade` bleibt zugelassen.

Die allgemeine Handentwicklung und konkrete Supportpläne verwenden dieselbe
side-sichere Handrotationsbewertung. Ein generischer Draw bei voller Hand setzt
eine bekannte Karte mit niedrigem aktuellen Haltewert voraus, etwa eine als
redundant, derzeit unnötig oder schwach und auf absehbare Zeit unbezahlbar
klassifizierte Karte. Strategisch starke oder akut benötigte Karten werden
nicht allein wegen ihrer Kosten zu Rotationszielen. Ein konkreter
Coverage-Kindplan kann unabhängig davon einen bewusst bewerteten
Cleanup-Tausch eingehen; Owner, Parent-Need und Draw-Action bleiben dabei exakt
gebunden. Der tatsächliche Draw ist eine private Beobachtungsgrenze und führt
danach zur Neuplanung statt zu einer vorweggenommenen Folgekarte.

Besteht die volle Hand vollständig aus solchen bekannten Rotationszielen und
enthält keine geschützte Karte, darf die Handentwicklung vor einer optionalen
Economy-Reserve auf P5 wechseln. Voraussetzung sind bereits gedeckter
Mindestkreditboden, Entwicklungsreserve und Notfallreserve. Eine gemischte
oder strategisch brauchbare Hand und eine offene dieser Finanzierungsgrenzen
behalten die bisherige Priorität; ein leerer Stack erzeugt keinen Draw.
Dieser Nachweis erhöht ausschließlich die Priorität der gebundenen
Handrotation und gibt keinen allgemeinen Draw-Bonus.

Ein sofortiges Draw-Ereignis erhält keinen zusätzlichen allgemeinen
Kartenentwicklungsplan allein aufgrund seiner Draw-/Search-Rolle, wenn sein
gequoteter Netto-Handzuwachs die freie Handkapazität übersteigt. Die gemeinsame
Action-Economy-Projektion berücksichtigt dabei bereits den Verbrauch der
Ereigniskarte und die tatsächlichen Kosten. Ein abstraktes Setup-Ziel belegt
keinen Nutzen erzwungener Abwürfe. Konkrete Antwortsuche und Handrettung bleiben
bei ihren gebundenen Coverage-/Defense-Ownern zulässig; deren Actions werden
durch eine generische `no_current_need`-Bewertung nicht ausgeschlossen.
Die gespeicherten D26/D29-Zustände aus `match_cd4828fc5a7c0c7f` sichern diese
Trennung: begründeter erster Sentry-Draw mit Cleanup-Trade-off gegenüber einem
ungebundenen zweiten Fünferdraw bei acht Handkarten und einem Restklick.

Zusätzliche Kartensichtung durch die Engine-Draw-Projektion ist kein weiterer
Handzuwachs. `projectedGrossDrawCount`,
`projectedPostDrawDispositionCount` und `projectedNetHandDelta` bleiben getrennt:
Draw Taxes verwenden den Bruttowert, Handkapazität den Nettowert. Die konkrete
private Auswahl bleibt unter dem ursprünglichen Executor und dessen gebundener
`trash_lowest_visible_drawn_card`-Policy. Sie bewertet erst die tatsächlich
aufgedeckten eigenen Optionen; eine unbekannte Stack-Reihenfolge wird nicht
vorweggenommen.

Der Review zum zusätzlichen Filterwert (2026-09-13) führt bewusst keinen
allgemeinen Draw-Bonus ein. Owner für allgemeine Rotation ist die
Handentwicklung; eine konkrete Breaker-Suche bleibt beim Coverage-Parent.
Die Zahl zusätzlich gesichteter Karten allein quantifiziert weder die
Verbesserung der Handqualität noch den Trefferwert eines konkreten Bedarfs.
Generische Heap-Rückholung bei überfüllter Hand prüft außerdem die
schrittweise Cleanup-Auswahl desselben Retention-Dienstes. Nach jedem
projizierten Abwurf werden Duplikate und Kartenwerte neu bewertet;
Main-Action-Ausführungsboni gelten dabei nicht. Eine anschließend wieder
abgeworfene Zielkarte rechtfertigt keine generische Recovery. Die Projektion
erzeugt keine zukünftige LegalAction oder Choice-Bindung.
Ein späterer Filterwert benötigt daher einen belegten planlokalen
Draw-vs.-Alternativen-Fall und eine side-sichere Bedarfs-/Qualitätsverteilung
an der privaten Beobachtungsgrenze. Er darf keine garantierte Folgekarte,
zusätzliche Netto-Handkapazität oder geringere Draw Taxes behaupten.

Die fokussierte Engine-Simulation
`simulation/crash-everett-draw-plan-continuation.test.ts` sichert hierfür
vergleichbare Zustände mit und ohne Filter bei 0, 2, 5 und 6 Handkarten:
Ein bestehender Central-Plan behält seinen Vorrang. Ergänzend prüfen die
beiden Choice-Folgen die unveränderte Action-/Executor-Bindung ohne und mit
zwei Draw Taxes. Economy- und Tax-Projektionstests sichern getrennte Brutto-
und Nettowerte. Das ist begrenzte Entscheidungsevidence, kein Nachweis einer
allgemeinen Spielstärkeverbesserung; produktives Verhalten bleibt unverändert.

Eine bereits überfüllte Hand sperrt weiterhin generischen Draw. Eine an eine
sichtbare terminale Remote-Bedrohung gebundene Coverage-Suche darf dagegen
auch dann eine legale Basiskarte ziehen, wenn eine passende Antwort im eigenen
Stack verbleibt. Das Handlimit darf diesen bereits begründeten P2-Bedarf nicht
in zweckloses Credit-Sammeln umwandeln. Weder der gegnerische verdeckte Root
noch die Reihenfolge des eigenen Stacks werden dafür vorausgesetzt.

Required- und preferred-gebundene Rigkarten sind keine generischen
Rotationsziele. Handdruck verändert ihren Installationswert nur als begrenzter
Gegenfaktualvergleich: Eine bereits legal installierbare Karte kann früher
entwickelt werden, wenn dadurch der Verlust gebundenen Rigmaterials vermieden
wird und keine geringer bewertete ungeschützte Cleanup-Alternative sichtbar
ist. Dieser Vergleich erzeugt selbst weder Bedarf noch Legalität.

Eingeschränkte wiederkehrende Run-Credits werden nur aus dem kanonischen
Kartenmechanikvertrag bewertet und an einen konkreten kompatiblen Coverage-
Parent gebunden. Killer-Credits verlangen einen belegten Killer;
Non-noisy-Credits schließen noisy Provider aus. Die Supportkarte bleibt bei
`runner.develop_board_and_hand`, der Coverage-Bedarf bei
`runner.rig_and_coverage`; `sourceNeedId` erhält die Parentbindung. Eine
abstrakte spätere Run-Option genügt nicht und es entsteht kein zusätzlicher
Run-, Economy- oder Choice-Owner.

Passives Einkommen nach erfolgreichen Runs wird aus
`successful_run_end_credit_resource` in einen wiederholbaren, bedingten
Economy-Effekt übersetzt. Die persistente Bewertung erkennt den vorhandenen
`successful_run_followup_engine` mit Credit-Ausgabe. Der Owner vergleicht
Installationskosten einschließlich Installationsklick mit einem begrenzten
Ertrag: verbleibende bezahlbare Runs dieses Zuges plus höchstens ein Run je
Folgezug, insgesamt höchstens drei Züge und begrenzt durch beide Deckreste.
Ein aktuell legaler, erreichbarer HQ-/R&D-Run mit vorhandener Reserve-Quote
muss nach der Installation weiter finanzierbar sein. Unbekannte ICE bleibt
als Unsicherheit sichtbar; der bedingte Ertrag ist niemals verfügbares Geld.
Tags, Score-/Matchpoint-Dringlichkeit, zu kurzer Horizont, weniger als zwei
aktuell finanzierbare Runs und bereits ausreichende Liquidität verhindern
die Aufwertung. Ein positiver Überschuss wird innerhalb der bestehenden
Handentwicklung mit höchstens 300 Bewertungspunkten (100 je bedingtem
Netto-Credit) und P4 statt allgemeinem Aufbauwert eingebracht. Diese
Kalibrierung ist eine begrenzte Policy-Projektion, keine Erfolgsgarantie oder
Installationspflicht; P1–P3 und die gemeinsame Zugplanung bleiben maßgeblich.
Eine zurückgestellte, aktuell gequotete Investition erhält keinen allgemeinen
Handentwicklungsplan als Ersatz. Damit kann eine späte oder taktisch
unbegründete Installation nicht über den alten pauschalen Aufbauwert wieder
zugelassen werden. Bereits separat begründete Spezial-Owner bleiben erhalten.
Die passive Quelle benötigt keine zusätzliche Aktivierungsreserve, wohl aber
die bestehende Mindestreserve und die konkrete Run-Reserve.

Memory-Support wird aus einem positiven kanonischen MU-Bonus oder der
eigentlichen Kartenregel erkannt. Aggregierte Planning-Annotationen wie eine
Target-Präferenz mit dem Wort `memory` dürfen eine Eventkarte nicht zu
Memory-Hardware umklassifizieren.

Alle eigenen Handkarten werden bei der Planerkennung klassifiziert:

```text
1. Beitrag zu einem bereits vorhandenen Plan
2. eigenständige kartenbezogene Planinstanz
3. derzeit nicht sinnvoll entwickelbar
```

Eine Karte der ersten Gruppe wird als Route oder Beitrag des vorhandenen
Plans behandelt. Eine Economy-Karte kann beispielsweise den Funding-Step
eines R&D-Plans erfüllen; eine Multiaccess-Hardware kann unmittelbar zum
R&D-Plan gehören.

Für eine Karte der zweiten Gruppe erzeugt das gemeinsame Modul eine eigene,
an die konkrete Karteninstanz gebundene Planinstanz, aber nur wenn mindestens
ein Admission-Kriterium erfüllt ist:

- mehrere vorbereitende oder konvertierende Steps;
- persistenter Engine- oder Boardzustand;
- relevantes Verfallsfenster;
- eigene geschützte Fortsetzung;
- nachhaltige Transformation von Board oder Strategie;
- kein bestehender Domainplan kann den Zweck als Route oder `PlanNeed`
  aufnehmen.

```text
runner.develop_board_and_hand:<cardInstanceId>
```

Damit entstehen nicht für jede Karte neue Plantypen. Es entstehen mehrere
Instanzen desselben Moduls nur für fachlich persistenzwürdige Vorhaben.
Einfache One-shot-Karten bleiben planlokale Routen oder kurzlebige
Opportunity-Proposals. Damit wird der alte globale Kartenwettbewerb nicht als
globaler Wettbewerb vieler Kleinstpläne reproduziert.

Der Zweck einer kartenbezogenen Instanz darf die eigenständige sinnvolle
Nutzung der Karte selbst sein. Sie muss nicht künstlich einem bereits
existierenden strategischen Plan zugerechnet werden. Der Modulzustand
beschreibt mindestens:

- Zielkarteninstanz und Kartensemantik;
- erwarteten eigenständigen oder unterstützenden Nutzen;
- Kosten, benötigte Slots und Ressourcen;
- notwendige Vorbereitungs- und Folgeaktionen;
- Timing und Verfallsfenster;
- Completion- und Abandonment-Bedingung.

Beispiel:

```text
Eine spezielle Karte wie Delta passt in keinen vorhandenen Domainplan
→ eigene kartenbezogene Planinstanz
→ Funding oder Setup als Steps
→ Karte spielen/installieren
→ erwarteten Effekt konvertieren
→ Plan completed
```

Das Modul priorisiert zugelassene Instanzen auf Planebene. Wo mehrere
One-shot-Karten denselben Domain-Step erfüllen, entscheidet dagegen die
planlokale Routenauswahl. Dadurch bleiben persistenzwürdige Wechselgründe
sichtbar, ohne jede Handkarte künstlich zum strategischen Vorhaben zu machen.

Eine Karte darf mehreren bestehenden Plänen helfen. Eine zusätzliche
eigenständige Instanz wird aber nur erzeugt, wenn sie darüber hinaus einen
eigenen belastbaren Entwicklungszweck besitzt. So entstehen keine
wertgleichen Duplikatpläne für dieselbe Nutzung.

Die dritte Gruppe bleibt diagnostiziert, aber nicht ausführbar. Sie kann nach
neuen Credits, Slots, Boardzuständen oder Strategiebedingungen später eine
Planinstanz erhalten.

Nicht zulässig bleiben:

- Karte spielen, nur weil sie legal und roh positiv bewertet ist;
- turn-limitierte Vorbereitung ohne Commitment;
- Installation ohne absehbaren Nutzen oder mit kritischem Ressourcenbruch;
- Draw bei voller Hand ohne Überlaufbehandlung.

`play_best_hand_card` entfällt als pauschaler strategischer Fallback. Seine
berechtigten Funktionen werden entweder durch Domainrouten oder durch
Admission-geprüfte kartenbezogene Planinstanzen ersetzt.

### Passive Stärkeinvestition

`hand-development/passive-strength-investment.ts` bewertet eine reine passive
ICE-Stärkereduktion als eigenständigen Entwicklungszweck. Die Engine projiziert
die zusätzliche Installation ausschließlich auf bekannte gerezzte ICE. Der
bestehende Runpfad vergleicht danach die tatsächlichen liquiden Kosten mit und
ohne Installation einschließlich kompatibler Creditpools. Er verwendet für
Begegnungen `encounterStrength` aus der Engine-Quote; bereits installierte
Stärkemodifikatoren werden nicht erneut addiert.

Die Alternative ohne Installation erhält das aktuelle Cashbudget, die
Installationsalternative das Budget nach den Installkosten. Die geschützte
Liquiditätsreserve muss nach dem günstigeren projizierten Run erhalten bleiben;
Bruttokosten des alten Pfads sind dafür kein Ersatz. Regressionen prüfen sowohl
einen gespeicherten echten Entscheidungszustand als auch die Budgetgrenze mit
kompatiblen Programmkrediten und den unmittelbar zu knappen Gegenfall.

Der unmittelbare P4-Investitionsvergleich verlangt weiterhin eine aktuell
finanzierte HQ-/R&D-Route und mindestens zwei Credits Überschuss aus dem
aktuellen und einem bedingten künftigen Run, nach Installcredits und einem
Creditäquivalent je Installklick. Sein Wert bleibt auf 300 begrenzt.

Daneben bewertet `hand-development/passive-strength-development.ts` denselben
Installationszweck über höchstens drei künftige Runnerzüge, begrenzt durch
beide Deckreste. Ein Run im Installationszug ist dafür keine Voraussetzung.
Bekannte zentrale ICE-Pfade werden mit und ohne zusätzliche Reduktion gegen
denselben bedingten Verbraucher und erneuerte Creditpools verglichen. Ein
bereits installierter Breaker begründet bei positivem Nettoertrag einen auf
200 begrenzten P4-Wert. Ein kompatibler Handbreaker erhält einen
Readiness-Abschlag auf 0,75; ein nur im eigenen Deck verbleibender Breaker
zusätzlich die Ziehwahrscheinlichkeit über den begrenzten Horizont, ohne
Kenntnis der Reihenfolge. Solche Vorbereitungen bleiben P5. Installkosten und
MU des noch fehlenden Verbrauchers werden reserviert; ein Host ist dafür
keine Voraussetzung. Die beste einzelne Pfad-/Verbraucheralternative zählt,
nicht die Summe wechselseitig alternativer Einsparungen.

Ohne bekannte zentrale ICE wird nur ein begrenzter P5-Optionswert bewertet:
120 Punkte mal Readiness, geteilt durch die Anzahl gleichartiger installierter
Quellen plus eins, abzüglich zehn Punkten je Installcredit/-klick, maximal
80 Punkte. Zusätzliche freie Liquidität in Höhe der Installkosten muss dabei
erhalten bleiben. Das ist eine generische Entwicklungspolicy und keine
Behauptung konkreter Einsparungen an verdeckten Karten oder ein Deckbonus.
Auf bekannten Pfaden belegte Nullersparnis erhält keinen Ersatz-Optionswert.

Beide Bewertungen verlangen einen legalen Install ohne Programmopfer, freie
MU und erhaltene Reserven. Tags, sichtbare Scorefristen und Matchpoint
begrenzen die langfristige Investition. Zukünftige Ersparnis ist niemals
heutiges Geld. Erneuernde eingeschränkte Creditpools behalten auch bei null
aktuellen Credits ihre öffentlichen Kapazitäts-, Verwendungs- und
Refresh-Metadaten in der Engine-PlayerView. So werden verbrauchte Quellen
im Zukunftsvergleich nicht als dauerhaft verschwunden behandelt.

Die Handbewertung übernimmt einen positiven typisierten Nachweis additiver
Kapazität in die funktionale Rolle. Eine frühere pauschale
`duplicate_or_low_value`-Einstufung darf diesen Nachweis nicht nachträglich
verwerfen. Echte Redundanz, negative Ersatzbewertung, MU-Druck und Reserven
bleiben wirksam. Der Test mit zwei gleichzeitig installierten Clowns verwendet
verschiedene Karteninstanzen und prüft die echte Planwahl; eine weitere
Kopie wird mit und ohne vorherigen Speicheraufbau geprüft.

Planinstanz, Step, Route und Aktionsauswahl bleiben bei den bestehenden
Ownern. Es entsteht weder ein starres Zielrig noch eine zweite Strategiesteuerung.
Die Kernfunktionen des Clown-Decks sind Krash als Coverage, Clown als passive
Kostensenkung, Spin Chip als optionaler Host, Cloak/Vewy als kompatible
erneuerbare Finanzierung sowie Cybermodem als Speicher-/Credit-Unterstützung.
Streetware stellt Aufbauwirtschaft bereit. Die jeweiligen Owner werden mit
kanonischen Karten und Engine-Aktionen geprüft; Krash bleibt ohne Host
installierbar. Ein eigener Installationsbonus für dieses Deck ist nicht aktiv.

`hand-development/run-strength-stock.ts` bewertet einen durch die kanonische
Mechanik belegten, selbstverbrauchenden Run-Stärkeboost außerdem als Vorrat.
Ein sofortiger Run oder eine gebundene Zielroute ist dafür nicht erforderlich.
Ein installierter zugriffsfähiger Breaker mit bezahltem Pumpen, freie MU,
eine direkte legale Installation ohne Programmopfer und erhaltene
Liquiditätsreserven begründen einen begrenzten P5-Entwicklungszweck.
Der Optionswert beträgt höchstens 80 Punkte: 30 je zusätzlicher Stärke,
abzüglich zehn je Installcredit und Installklick. Das ist keine Behauptung
einer bestimmten Ersparnis an verdeckter ICE und kein deckspezifischer Bonus.

Tags, sichtbare Agenda-/Scorefristen und ein zu kurzer Deckhorizont sperren
diese Vorratsentwicklung. Eine bereits installierte Run-Stärkequelle genügt;
weitere spekulative Kopien belegen keinen zusätzlichen Vorratsbedarf. Nach
Verbrauch wird der Bedarf neu beurteilt. Höher priorisierte Coverage, Abwehr
und Zugriffe bleiben beim jeweiligen Owner. Die spätere Aktivierung bleibt
bei `runner.convert_run_window`; die Vorratsbewertung bindet weder eine
zukünftige Action-ID noch einen garantierten Folgerun und verändert dessen
Zulässigkeit oder Finanzierungsquote nicht.

Die Real-Engine-Regression prüft tatsächliche Plan-, Step- und Routenwahl mit
letztem Klick, direkte Engine-Anwendung, die genannten Gegenfälle und die
spätere Aktivierung mit normalen Pumpaktionen als Alternative. Gegen bereits
ohne Pumpen brechbare ICE bleibt der Vorrat in der geprüften Folge erhalten.

## 6. `runner.economy`

Der vertikale Owner liegt in `packages/ai/src/runner/economy/`.
`economy-signals.ts` bildet endliche Zugliquidität und die durch bestehende
Verbindlichkeiten angepasste Reserve. `installed-card-liquidation.ts` bindet
die aktuelle Choice und bewertet Erhalt gegen Liquidation;
`economy-plan-module.ts` prüft den noch materiellen Parent, revalidiert den
Funding-Vertrag und materialisiert ausschließlich passende Kandidaten.
Die Signalbildung erhält die gemeinsame Funding-Suche als einen Dienst.
Bedarfe anderer Pläne entstehen weiterhin bei deren fachlicher Koordination.
Geteilte Funding-Kriterien liegen in `plans/runner-funding-candidates.ts`,
Entwicklungszulassung und begrenzte Funding-Meilensteine in
`plans/runner-development-contracts.ts`; beide sind unabhängig von der Registry.

**Klasse:** je Instanz `bounded_sequence`, `recurring_cycle` oder
`development_project`
**Rolle:** Support, Vordergrund oder Background
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Interne Modi:

```text
fund_parent_need
restore_liquid_floor
build_finite_reserve
develop_economy_engine
load_bank
cash_out_bank
maintain_run_budget
```

Das Modul unterscheidet:

- konkreten Finanzierungsbedarf eines Parentplans;
- allgemeine Sicherheits- oder Runreserve;
- eigenständige langfristige Economy-Engine;
- Bankaufbau mit Cadence;
- Auszahlung zu einem konkreten Konversionszweck;
- Basic Credit als endliche Reserve-, Parent-Funding- oder eng typisierte
  befristete P6-Zugkapazitätsroute während des Übergangs.

Die Schwelle „genug Geld“ ist kontextabhängig. Sie berücksichtigt:

- nächste Planroute;
- Survival- und Trace-Reserve;
- erwartete Run- und Breakkosten;
- mögliche alternative Kartenentwicklung;
- Deckphase und Bankkonversion.

Mehr Geld wird bei vorhandener Reserve nicht automatisch wertlos. Es verliert
aber gegenüber konkret ausführbaren strategischen Plänen an Priorität.

Die exakte Funding-Suche vergleicht bei vollständig gleichen finanziellen
Routen zusätzlich den vom Runner-Owner gequoteten, innerhalb des Handlimits
behaltenen Handgewinn. `runtime/runner-funding-hand-quote.ts` verwendet dafür
nur aktuelle LegalActions, garantierte unmittelbare allgemeine Credits und
bekannte Hand-/Stackmengen ohne zusätzliche Risiken oder Ressourcentausch.
Unvergleichbare Nebenfolgen bleiben ausdrücklich diagnostiziert. Die bestehende
Routenauswahl konsumiert diese Quote vor ihrer Ergebnisbegrenzung; Cash-Ertrag,
Klickbedarf, Zuverlässigkeit, Horizont und gleiche Vorabkosten behalten Vorrang.
Basic Credit bleibt für zusammengesetzte Routen verfügbar. Ein echtes
Draw-Einkommensereignis kann so denselben Parentbedarf finanzieren und dabei
zusätzliche Handkarten erhalten; ein gesonderter Kartenbonus entsteht nicht.

Ein günstiges positives Deckverhältnis bei Matchpunkt darf produktive
Restliquidität nicht selbst ausschließen. `economy-signals.ts` bildet ihre
endlichen P6-Routen zunächst unabhängig von der Wartebedingung. Erst wenn dabei
keine solche Route besteht, darf der vorhandene Deckdruck-Wartepfad zusätzlich
den vollständigen Ablehnungsnachweis aller übrigen freiwilligen Aktionen
verlangen. Ein regelbewiesener terminaler Sieg bei bereits leerem Corp-R&D
bleibt beim priorisierten Owner `runner.secure_terminal_win`.

Run-Funding entsteht nur aus einer echten, berechneten Lücke des gebundenen
Runplans. Der Bedarf ist das Maximum aus dem noch offenen Route-Gap und der
Unterschreitung des nach dem Run zu schützenden Credit-Floors; ein künstliches
Mindest-Gap ist unzulässig. Ist das Ziel bereits direkt positiv konvertierbar,
entsteht kein Funding-Step. Existiert ein anderes direkt ausführbares,
positiv bewertetes Runziel mit materiellem Zugriffsnutzen, gibt ein nicht
dringlicher Funding-Step diesem Run den Vorrang. Die gemeinsame Zulassung
prüft für effektiven Archiveszugriff dieselben vorhandenen sichtbaren Agenda-
und qualifizierten Hidden-Payoff-Fakten wie der Central-Owner. Ein materiell
abgelehnter Archives-Run darf weder Basic- noch Bankfinanzierung sperren.
Maßgeblich ist das effektive Zugriffsziel, damit ein physischer Archives-Run
mit Zugriff auf HQ seine echte Konkurrenzwirkung behält. Nur eine belegte akute Score-Bedrohung darf diese
Alternativsperre überstimmen.

Eine direkt konvertierbare Geschwisterroute auf demselben Server blockiert
Funding auch bei akuter Score-Bedrohung: Finanziert wird nicht die teurere
Variante, wenn dieselbe Serverkonversion bereits exakt ausführbar ist. Der
akute Floor-Override gilt nur für die konkrete Terminalroute. Er erlaubt
eine positive, direkt ausführbare Route mit nichtnegativem Restguthaben unter
dem normalen Credit-Floor, beseitigt aber weder ein reales Route-Gap noch
negative Credits nach dem Run. Diese Fälle bleiben echte Fundingbedarfe.

Ein Bank-Cashout wie Broker ist ebenfalls kein allgemein positiver
Economy-Step. Er wird an eine konkrete, planfähige Kartenentwicklung mit
echtem Credit-Gap gebunden und muss dieses Gap mit verbleibendem
Same-Turn-Konversionsfenster vollständig schließen. Nach Cashout und
Entwicklung muss der erforderliche Handpuffer erhalten bleiben. Eine
Unterschreitung ist nur mit einem expliziten, an dieselbe Zielkarteninstanz
gebundenen akuten Survival- oder Coverage-Nachweis zulässig. Fehlt eine
solche konvertierbare Zielroute, bleibt der Cashout nicht produktiv; die
Runtime darf ihn nicht mit allgemeinem „später nützlich“-Wert rechtfertigen.

Ein angebotener Bank-Cashout darf auch einen derzeit unbezahlbaren terminalen
Remote-Pfad finanzieren. Die negative ungeförderte Runbewertung ist dafür
kein Ausschluss: Der Run-Owner muss mit dem garantierten Nettobudget den
vollständigen bekannten Pfad, die Reserven und den verbleibenden Run-Klick
belegen. Ein Kostenpräfix bis zur ersten unbezahlbaren Subroutine genügt nicht.
Die Bank bindet ihre Auszahlung an genau den offenen Bedarf des Remote-Parents
und übernimmt dessen Materialwert. Sie bleibt alleiniger Action-Executor;
der allgemeine Economy-Plan beansprucht diesen Bedarf dann nicht zusätzlich.
Mehrere ausreichende Banken ergeben genau einen Provider, bestimmt im
Bank-Owner nach Klickkosten, Auszahlung und stabiler Instanzreihenfolge.
Ein fremdes Darlehen darf die bereits belegte Bankroute nicht aus deren
Finanzierungssuche verdrängen.

Eine an einen Run gebundene Darlehensroute darf eine zertifizierte reine
Creditlücke schließen. Der noch unfinanzierte Parent muss dafür nicht bereits
`reachable` sein. Bei einer exakt dringlichen Score-Bedrohung ist auch seine
durch `blocked_unpayable` negative aktuelle Bewertung kein Ausschluss der
Finanzierung. Der garantierte Nettoertrag muss nach dem gesamten bekannten
Run die vollständige Ausstiegsreserve erhalten; der Konversionsklick bleibt
reserviert. Fehlende Coverage, andere Pfadsperren, unzureichende Reserve und
ungebundene oder spekulative Darlehensverwendung bleiben ausgeschlossen.
Ein an der ersten unbezahlbaren Subroutine abgebrochener Pfad ist dabei nur
ein bekannter Kostenpräfix. Die Finanzierungszulassung prüft denselben
Action-/Server-Parent erneut mit dem garantierten Nettobudget und dem
Handverbrauch der Finanzierungsaktion. Nur dessen vollständiger erreichbarer
Pfad darf die Ausstiegsreserve belegen; die aktuelle LegalAction und ihre
StateVersion bleiben die Ausführungsautorität.
Die Handkosten zählen auch Installationen aus dem von der Engine gebundenen
Grip-/HQ-Bereich; eine Installation aus einem anderen Bereich verbraucht
keine Handkarte. Der finanzierte Zustand muss außerdem die bestehende
Direktkonversions- beziehungsweise Terminalzulassung und die gemeinsame
Remote-Schadensreserve erfüllen. Ein nach Finanzierung nicht mehr materieller
oder wegen Handmangels blockierter Parent rechtfertigt kein Darlehen, selbst
wenn die volle Rückzahlungsreserve vorhanden wäre.
Die prospektive Einzelquote wird durch
`quoteRunnerRunAfterGuaranteedFunding` beim Run-Owner erzeugt. Funding- und
Bank-Owner konsumieren diese Quote; sie rufen weder eine zweite Runbewertung
noch eine eigene Actionauswahl auf.

Jede Finanzierung für einen aktuellen Run berücksichtigt den Handverbrauch
aller Finanzierungsaktionen, ihren belegten Netto-Handgewinn und bekannten
Selbstschaden. Auch eine reine Creditfolge darf den bestehenden Handpuffer
nicht aus der gemeinsamen Aktionsrechnung ausklammern.
Der Handpuffer stammt aus der Reservequote genau dieses Run-Parents. Fehlt
die Quote, bleibt die Finanzierung unbewiesen. Sinkt der Puffer darunter,
reserviert die Finanzierungssuche die mit der aktuellen Engine-Projektion
belegten Basisdraws einschließlich Klickkosten, Stack-Kapazität und sichtbarer
Draw Taxes. Finanzierung, Pufferreparatur und der bereits reservierte Run-Klick
müssen zusammen in denselben Zug passen. Ein nach Zufallsschaden noch benötigter
Grip-Verbrauch einer späteren Finanzierungsaktion ist nicht garantiert.
Die Ressourcenprüfung erzeugt keine zukünftigen Kartenidentitäten oder
LegalActions. Das tatsächliche Nachziehen bleibt beim bestehenden Hand-Owner;
jede Folgeentscheidung wird aus dem aktuellen Zustand neu geprüft.

## 7. `runner.defense_and_recovery`

Die Engine-Choice `v121.replacement.damage` kann eine ausdrücklich angebotene
Rettung aus der eigenen bekannten Grip enthalten. Der Defense-Owner bindet
sie vor der Payloadauflösung an exakte Quelle, Option, StateVersion und
LegalAction. Der Resolver validiert ausschließlich diese Bindung. Eine
unbekannte oder widersprüchliche Ersatzwirkung scheitert sichtbar; sie wird
nicht aus dem technischen Optionsnamen abgeleitet (SP-508).

Dieselbe Grip-Bindung umfasst eine von der Engine angebotene reaktive
Meat-Schadensersetzung mit Bad-Publicity-Konversion während des Corpzugs,
auch wenn der aktuelle Schaden noch nicht tödlich wäre. Die side-sichere
DTO-Projektion erhält deren semantischen Optionstyp; der Defense-Owner
verifiziert die eigene Quellinstanz und die kanonischen Präventions- und
Konversionshints, bevor er `replace_damage_from_grip` materialisiert.
Der Resolver übernimmt nur diese aktuelle Bindung. Eine angebotene kostenlose
vollständige Ersatzwirkung benötigt keinen geratenen Schadenswert aus einem
technischen Choice-Namen. Unbekannte Ersatzwirkungen bleiben fail-closed.

Der vertikale Owner liegt in `packages/ai/src/runner/defense-recovery/`.
`defense-signals.ts` bündelt Schutzinstallationen, Handpuffer, Tag-Clear-
Funding und Reaktionsreserve. `defense-plan-module.ts` besitzt Phasenwahl,
Funding-Revalidierung, Priorität und Materialisierung;
`runner-discard-choice-plan.ts` bindet die Pflichtauswahl an die aktuelle
Action und Choice. `defense-dispositions.ts` priorisiert verfügbare
Schutzinstallationen gegenüber Statusbereinigung. Die Live-Runtime reicht
Funding-Suche und sofortige Run-Verwertbarkeit als zwei benannte Dienste
ein und koordiniert weiterhin die Ausschlüsse zwischen verschiedenen Plänen.
Gemeinsam benötigte Handpuffer-Fakten werden aus demselben Owner geliefert.

Ein eigener positiver persistenter Gefahrencounter hält den Defense-Parent
auch bei fehlender Bank offen (SP-335). Die kanonischen, aus
`runnerCounterEffects.removeCost` erzeugten Hints liefern eine typisierte
`counterRemoval`-Kostenquote; die KI liest keine technischen Target-Strings.
Fehlende oder widersprüchliche Quotes scheitern mit strukturierter Diagnose.
Der vorhandene Funding-Dienst bindet nur aktuelle LegalActions an diesen
Bedarf, einschließlich eines letzten Finanzierungsklicks für den folgenden
eigenen Zug. Aktive Tagentfernung und erforderlicher Handpuffer behalten
Vorrang. Discover, Assess und Materialisierung revalidieren Counter, Kosten,
Bank, StateVersion und Action-IDs. Die Entfernung selbst wird erst ausgeführt,
wenn ihre echte Engine-LegalAction vorhanden ist.

Kann der getaggte Runner vor bekanntem kritischem Schaden nicht alle Tags im
aktuellen Zug entfernen, erhält der Defense-Owner zuerst den erreichbaren
Überlebenspuffer. Er quotiert die vollständige Tagentfernung mit den wirklich
verbleibenden Klicks. Teilweise Tagentfernung darf den Puffer weder durch
Selbstschadensfinanzierung noch durch verbrauchte Draw-Klicks unterschreiten.
`requiredEndTurnHandBuffer` bindet die Finanzierungssuche an den Puffer nach
jedem tatsächlichen Zahlungsschritt. Während dieser Handpufferphase weist
Defense die legale Tagentfernung ausdrücklich als zurückgestellt aus. Ein
vollständig bezahlbarer Tag-Clear bleibt ein eigener zulässiger Gegenfall;
ein Puffer oberhalb der Maxhand wird nicht als Schutz zum Zugende behauptet.

Öffentlicher Zugriffsschaden bindet seine Quelle über die tatsächlich
aufgedeckte `cardDefinitionId` des `access_card`-Ereignisses und dessen
ausdrückliches `damageResolved`. Der Runner-Actor macht den so aufgelösten
Schaden einer bekannten Corp-Karte nicht zu Selbstschaden. Eine aufgedeckte
Karte ohne Schadensauflösung oder eine Karten-ID in einer anderen Action
begründet diese Quellenbindung nicht. Vollständig verhinderter Schaden zählt
als Versuch, nicht als erlittenes Ereignis; Defense und Run-Owner konsumieren
denselben korrigierten Fact.

Liegt ein gebundener Handpufferschritt hinter einer früheren Defense-Phase,
klassifiziert Defense seine derzeit nicht materialisierte Action ausdrücklich
als zurückgestellt. Der Handbedarf bleibt erhalten und wird nach der früheren
Phase erneut geprüft. Eine unabhängig produktiv gebundene Action desselben
IDs bleibt bei ihrem anderen Owner ausführbar; bestehende Unknown-Bewertungen
werden durch diese Phasendisposition nicht ersetzt.
Eine Mehrzweck-Action, die auch zum aktuell materialisierten Defense-Schritt
gehört, erhält keine Zurückstellung für ihren späteren Handpufferzweck. Die
Ausnahme folgt den tatsächlichen Kandidaten derselben Phase und nicht dem
Karten- oder Actionnamen.

Ist der gewöhnliche Basisdraw die einzige aktuelle Handpufferroute und würde
seine bereits sichtbare Steuer einen Tag erzeugen, darf Defense zuerst eine
passende Reaktionsreserve finanzieren. Die vorhandene Funding-Suche muss die
vollständige Finanzierung noch im selben Zug garantieren und einen Klick für
den Draw übrig lassen. Der Bedarf bleibt beim Defense-Parent und wird nach
jedem Schritt neu geprüft. Verdeckte Steuerquellen, nur bedingte Finanzierung,
andere unmittelbar nutzbare Handpufferrouten oder fehlende Folgekapazität
erzeugen diesen Vorbereitungsnachweis nicht. Die tatsächliche Steuerzahlung
erfolgt weiter ausschließlich über die spätere Engine-Choice. Der sichtbare
Quellenfact zählt ausschließlich bekannte gerezzte installierte Rootkarten.
Virtuelle Rootkarten in Archives sind entsorgt; ein erhaltenes Rezzustandsfeld
aktiviert dort keine Drawsteuer. Dieser Zonenfilter gilt auch für zusammengesetzte
Draw-Actions ohne eigenen Basisdraw-Steuerpayload. Der Scheduler darf einen
falschen Quellenfact nicht durch Aufheben der Unsafe-Disposition kaschieren.

Eine bei bestätigter oder kritischer Schadensgefahr tatsächlich taggefährliche
Draw-Action gehört auch dann nicht zur aktuellen Defense-Route, wenn sie zuerst
Tags entfernt. Die Zulassung jeder Defense-Phase respektiert dieselbe aktuelle
Unsafe-Menge. Eine solche Mehrzweck-Action darf die Finanzierung einer sicheren
Basis-Tagentfernung nicht als scheinbar bereits vorhandene Tag-Clear-Route
unterdrücken. Die Ausnahme für eine nur später zurückgestellte Handpufferwirkung
bleibt auf aktuell sichere Mehrzweck-Actions begrenzt; echte Draw-Tax-Gefahr wird
weder durch den Scheduler noch durch die aktuelle Phasenbindung aufgehoben.

Ein Run-Reservequote mit gedeckten Credits und fehlendem Handpuffer wird als
Handbedarf ausgewiesen. Für eine konkrete erreichbare Agenda-,
Score-Threat- oder Informationsroute übernimmt der Defense-Owner den gequoteten Puffer, wenn
die nötigen Draws und der Run noch in denselben Zug passen. Nur für diese
gebundene Vorbereitung darf der temporäre Puffer über dem Cleanup-Handlimit
liegen. Fehlende Stack-Karten, Folgeaktionen oder Run-Credits lassen diese
Vorbereitung nicht entstehen; zusätzliche Credits ersetzen keinen Handbedarf.

**Klasse:** `urgent_response`, `bounded_sequence` oder
`development_project`
**Rolle:** Urgent Response/Vordergrund
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Das Modul besitzt eine gemeinsame Threat-Priorisierung für:

- unmittelbare Flatline-Gefahr;
- Meat-, Net- und Core-Damage-Risiko;
- Tags und sichtbare Tag-Punish-Ketten;
- zu kleinen Handpuffer;
- relevante hostile Status-, Counter- oder Viruszustände, soweit die
  Rules Engine hierfür Runner-Aktionen anbietet;
- notwendige Damage-Prävention oder Recovery.

Der Installationsbedarf einer typgebundenen Prävention wird nur aus passenden
öffentlich belegten Schadensarten gebildet. Der allgemeine Handpuffer bleibt
gegen sämtliche belegten Schadensquellen aktiv; eine reine Net-/Core-Gefahr
erzeugt jedoch keinen Meat-Präventionsparent. Die kanonischen strukturierten
Hints liefern den Präventionsumfang, der bestehende Schadens-Fact-Service
filtert bekannte Quellen und öffentliche Schadensereignisse vor der
Bedarfsbildung. Untypisierte Textsignale begründen keinen typgebundenen
Präventionsnutzen. Universelle Flatline- und Runprävention behalten ihren
allgemeinen Umfang; unbekannte Präventionshints scheitern sichtbar.

Die gebundene Runner-Discard-Choice erhält ihre Keep-Wertung aus demselben
Owner. Liegt fehlende Breaker-Abdeckung nachweislich nur im eigenen Stack,
erkennt die Wertung deren Suchzugang über die exakte Kartenbindung in
`ownDeckCapabilities.runner.searchAccess.tools`. Alte Rollenlabels und die
momentane Aktivierbarkeit im verpflichtenden Discard-Fenster sind dafür keine
Voraussetzung. Ohne passende Breaker-Suchfähigkeit oder bei bereits verfügbarer
Abdeckung entsteht dieser Keep-Bedarf nicht.

Mögliche Phasen:

```text
assess_threats
prevent_terminal_damage
break_punish_chain
clear_tags
remove_hostile_state
restore_hand_buffer
install_prevention
return_to_preempted_plan
```

Prioritätsregeln:

1. unmittelbar terminale Gefahr verhindern;
2. eine sichtbare gegnerische Punish-Kette unterbrechen;
3. unvermeidbaren Damage durch ausreichenden Puffer überleben;
4. Tags oder hostile Zustände kosteneffizient entfernen;
5. Prävention für eine belastbar erwartete Gefahr aufbauen.

Das Modul darf auch entscheiden, nichts zu tun und dormant zu bleiben, wenn
kein materieller Threat vorliegt. „Tag vorhanden“ oder „Damage-Karte im
gegnerischen Deck möglich“ reicht nicht automatisch.

Die genaue Ordnung zwischen Tag-Clear, hostile-State-Entfernung,
Handkarten-Draw und Präventionsinstallation bleibt modulinterne
Verfeinerung.

Aktuelle Tagentfernung behält den von der Engine gelieferten Modus und Betrag
in beiden LegalAction-Projektionen des KI-DTO. Fehlende, nicht ganzzahlige oder
widersprüchliche Mengen scheitern mit einer strukturierten Semantikdiagnose.
Der Defense-Owner bewertet nur die tatsächlich vorhandenen entfernten Tags:
Eine Zwei-Tag-Quote zählt bei einem vorhandenen Tag einmal, bei zwei Tags
zweimal. Eine aktuell legale vollständige Bereinigung erfüllt auch den
gesamten Bereinigungshorizont; die Finanzierungsprüfung nur wiederholter
Basisaktionen darf sie nicht als unvollständig einstufen. Bestätigte
schadensgefährliche Drawsteuer bleibt ein Ausschlussgrund. Historische
Checkpoints mit damals verlorenen Mengen werden nicht still repariert;
gezielt rekonstruierte Gegenmodelle bleiben als solche bezeichnet.

Wenn eine notwendige Prävention oder Recovery nicht auf der Hand liegt, darf
das Modul planintern Draw-, Search-, Funding- und Installations-Steps
erzeugen. „Abwehr“ bezeichnet damit das Ziel, nicht nur eine aktuell
verfügbare Abwehraktion.

## 8. `runner.convert_run_window`

Engine-gequotete Counter-Zugriffsersetzungen behalten `counterSide`,
`counterType` und `counterDelta` in der positiven LegalAction-DTO-Projektion.
Die daraus erkannte Semantik `runner.access_replacement_counter` gehört zur
Run-Window-Klassifikation und zum entsprechenden Turn-Planner-Ownervertrag.
Diese Zuordnung erzeugt weder eine neue Action noch einen Aktivierungsbonus:
Solange die endliche Counter-/Purge-/Folgewirkung gegenüber dem vollständigen
verlorenen Zugriff nicht bewertet ist, weist die vorhandene lokale Assessment-
Diagnose die Ersetzung ausdrücklich als nicht zugelassen aus. Der normale
Zugriff behält seine unabhängig gebundene Route.

Nach dem planselektierten Aufdecken übernimmt dieser Run-Owner die unmittelbare
Engine-Continuation „Ansehen beenden“. Die KI-Eingabe erhält die skalaren
Engine-Fakten `approachIceExposeViewDecision` und `approachIceExposeJackOut`.
Der Owner prüft ausgewählte Aufdeckerinnerung, lückenlosen letzten Ereignis-
Übergang, Root, Run, Server, Quelle, ICE und aktuelle StateVersion. Ohne diese
Bindung scheitert das Fenster strukturiert. Bestehende Safety- und Reserve-
Abbruchgründe haben Vorrang vor der Fortsetzung. Die Continuation zertifiziert
keine erfundene Rez- oder Encounterquote; neue LegalActions bleiben die
Autorität für den folgenden Encounter.

Eine während des Runs angebotene Stack-Programmsuche mit normaler Installation
gehört zum gebundenen Run-Owner. Bei einer aktuellen reinen ETR-Coveragelücke
quotiert `run-window-program-search.ts` die kanonischen eigenen Stackantworten,
den Source-Trash, tatsächlich freigemachte MU sowie Installations-, Encounter-
und Restpfadkosten einschließlich zweckgebundener Credits. Eine Antwort wird
nur zugelassen, wenn sie die Lücke schließt und den aktuellen Runreservevertrag
erhält. Gehostete Quellen und notwendige weitere Opfer werden nicht als freie
MU behauptet. Fehlende Coverage-/Kostenfakten bleiben explizite Ausschlüsse.

Der gewählte Runstep bindet die konkrete Suchaction, Quelle, Zieldefinition,
Run-ID, Server und StateVersion. Die unmittelbare Engine-Suchchoice erhält
denselben Root und Executor; ihr Resolver übernimmt ausschließlich das vorher
gebundene Ziel aus den tatsächlichen privaten Optionen. Eine andere Quelle,
Version, Route oder unpassende Installationsquote scheitert fail-closed. Die
Suchchoice bildet die Informationsgrenze; Pump-, Break- und weitere Runactions
werden anschließend aus neuen LegalActions materialisiert.

Die bekannte Pfadquote erhält bereits bezahlte einzelne Subroutine-Breaks mit
ICE- und Subroutine-ID. Nachgelagerte Schadens- und Handreserveprüfungen
rechnen diese Wirkungen nicht erneut an. Unbezahlte Subroutinen derselben
ICE bleiben wirksam; ein Teilbruch bescheinigt keinen vollständigen Bruch.

Eine aktuell unbezahlbare bekannte Route wird zusätzlich mit genau der
fehlenden Finanzierung gequotet. Entfernt diese finanzierte Folge den Schaden
durch tatsächliche bezahlbare Breaks, veröffentlicht die aktuelle Route
einen Finanzierungsbedarf statt eines Handpufferbedarfs. Die hypothetische
Finanzierung macht den aktuellen Run nicht ausführbar; unvermeidbarer Schaden
und unabhängige Handreserven bleiben erhalten.

Die Konsequenzprüfung des aktuellen Encounters verwendet ausdrücklich noch
ungebrochene Subroutinen. Auch ein kostenloser legaler Break wurde vor seiner
Engine-Ausführung noch nicht durchgeführt. Eine notwendige aktuelle
Schadensmitigation bleibt deshalb unter dem vorhandenen Run-Owner ausführbar,
wenn der spätere Zugriffspfad blockiert ist. Die Breakauswahl prüft weiterhin
konkrete Ziele, Zahlung und die wirklich benötigte Überlebensreserve.

Bei direktem Schaden vor einer späteren Break-Sperre quotiert der Pfaddienst
beide Fortsetzungen: vollständige Mitigation mit gemeinsam bezahlter
Encounter-Stärke sowie Zugang mit ausdrücklich verbleibendem Schaden.
Aufgeschobener Schaden darf weder aus der Kostenquote noch aus dem
Handbudget verschwinden. Die Finanzierung verwendet den vollständigen Pfad
mit ihrem garantierten Budget; ein tragbarer günstigerer Schadenspfad bleibt
ohne unnötiges Darlehen zulässig.

Erzeugt erst eine ungebrochene äußere Subroutine eine innere Zugriffssperre,
bleibt die fehlende Breaker-Abdeckung an dieser Quell-ICE gebunden. Der
Pfaddienst vergleicht die bekannte Fortsetzung mit und ohne Wirkung auch dann,
wenn der Quellbreaker fehlt. Eine unabhängig unüberwindbare innere ICE behält
ihren eigenen Bedarf; ohne betroffene Folge-ICE entsteht kein künstlicher
Coveragebedarf. Ein vorhandener, aber unbezahlbarer Quellbreaker bleibt eine
Finanzierungslücke.

Die Engine projiziert bereits aktivierte Encounter-Gebühren öffentlich als
`run.encounterTaxForFutureIce`. Restpfad-, Pump-, Break- und Risikoprüfungen
erhalten diesen Wert auch durch die KI-Eingabeprojektion. Diese verwirft
negative, nichtganzzahlige oder nichtendliche Gebühren sichtbar. Die Prüfungen
übernehmen diesen Fakt und bezahlen ihn vor jedem verbleibenden bekannten
Encounter aus allgemeinen beziehungsweise Run-Credits. Der Eintritt zum
aktuellen Encounter ist bereits bezahlt; unbekannte oder umgangene ICE
erhalten dadurch keine erfundene Encounter-Quote. Zusätzliche noch
ungebrochene Gebührenquellen werden weiterhin in ihrer Pfadreihenfolge
addiert. Eine bloß vergessene Gebühr darf keine neue Reserveverschlechterung
und keinen sofortigen Run-Abbruch vortäuschen.

Die Informations-Neubewertung des laufenden Encounters konsumiert die
exakten offenen Subroutine-IDs der aktuellen Engine-Continue-Action. Die volle
Kartenquote beschreibt weiterhin das ICE; bereits gebrochene oder aufgelöste
Subroutinen dürfen aber nicht erneut als Restkosten, Schaden oder Pfadsperre
zählen. Die übrigen ICE behalten ihre vollständigen Quotes. Fehlende oder
widersprüchliche IDs scheitern am bestehenden Rules-Contract fail-closed.
Während eines Zahlungs-/Choice-Unterfensters ohne Encounter-Continue bleibt
der gebundene Parent bis zur erneuten Engine-Fortsetzung erhalten.

Im unmittelbar gebundenen Expose-Betrachtungsfenster konsumiert derselbe
Run-Owner die aktuelle Engine-Rezquote und feste Post-Rez-Runquote von
`run.approachedIce`. Ist das bekannte ICE jetzt finanzierbar und sein nicht
bezahlbar brechbarer Schaden tödlich, erhält der angebotene kostenlose
Jackout Vorrang vor `finish`. Root, Run-Executor und Zustandsbindung bleiben
erhalten. Nicht finanzierbares Rez, verkraftbarer Schaden, vorhandene
Prävention und ein finanzierter installierter Breaker erzeugen diesen
Abbruchgrund nicht. Sichtbarer Support für Rez während des Runs bleibt ein
mögliches Rez-Potenzial. Eine notwendige fehlende oder veraltete feste Quote
scheitert strukturiert; variable Rezentscheidungen bleiben beim bestehenden
Variablen-/Risikovertrag und werden hier nicht geraten.

### Vertikale Implementierung

[`runWindowModule`](../../../packages/ai/src/runner/run-window/run-window-plan-module.ts)
ist der Einstieg in `runner/run-window/`. `run-window-discovery.ts` bildet
die aktuellen Fenster aus dem gebundenen Runursprung und den bewerteten Actions.
`run-window-assessment.ts` besitzt Zulässigkeit, Risiko-Revalidierung,
Encounter- und Accessbewertung sowie die exakte Phasenroute.
`run-window-dispositions.ts` veröffentlicht planlokale Ausschlüsse unter
Erhalt bereits ausführbarer Remote-Routen.

`run-window-origin.ts` erhält Root, Parent, Zugriffsreserve und
Informationsgrenzen. Die Dateien `run-window-*-continuation.ts` sowie
`run-window-selected-origin.ts` und `run-window-choice-binding.ts` binden
Runstart, Zahlungen, Breakerfolgen, Trace, Vacuum Link und die zugehörigen
Choices an die ausgewählte Action und StateVersion. Der Owner konsumiert
eng typisierte Dienste aus `run-window-services.ts`; er importiert keinen
Runtime-Dispatcher und keine Planregistry zurück.

Die Vacuum-Link-Fortsetzung erhält auch die bereits vom Runstart-Owner
zertifizierten obligatorischen Runstart-Choices. Deren Ereignisse liegen nach
der ausgewählten Runstartaktion und höchstens am gespeicherten
`continuedThroughStateVersion`. Der fortgesetzte Run behält dieselbe Root,
denselben Executor, Lease, Server und die lückenlose StateVersion-Kette.
Eine beliebige spätere Choice, ein fremder Actor/Server oder ein fehlendes
Runstart-Zertifikat wird dadurch nicht als Runfortsetzung zugelassen.

Der Adapter `runner-access-trash-impact.ts` bindet die gemeinsame fachliche
Trashbewertung unter `access/` an die angebotene Action und deren Kostenquote.
Runpfad-Analyse und Fakten bleiben geteilte Dienste. Die Wahl des ursprünglichen
Central-/Remote-Ziels bleibt beim jeweiligen Root-Owner; Prioritäten,
Entscheidungsregeln und die 25 registrierten Module bleiben unverändert.

Ein Run mit unbekanntem verbleibendem ICE bindet die beim Start akzeptierte
side-sichere Risiko- und Reservequote an seine Root-Planinstanz. Das gebundene
`runner.convert_run_window`-Leaf quotiert denselben Vertrag an jedem
Jack-out-Fenster mit dem verbleibenden ICE, aktuellem Credit- und Handpuffer
sowie dem aktuell sichtbaren Corp-Rez-Potenzial neu. Erst eine materielle
Verschlechterung gegenüber dem akzeptierten Startvertrag begründet eine
Jack-out-Präferenz; ein unveränderter Grenzfall erzeugt weder einen neuen Plan
noch eine zweite Entscheidungsautorität.

Auch das Encounterbudget einer Informationsprobe konsumiert diese aktuelle
Reservequote. Die akzeptierte Startquote bleibt der Vergleichsmaßstab für
Risikoänderungen; ihr ursprünglicher Creditbetrag ist keine dauerhafte Sperre.
Sinkt die gequotete Reserve nach neu aufgedecktem ICE oder ausgegebenen
Corp-Rez-Credits, darf derselbe Parent den bezahlbaren bekannten Restpfad
fortsetzen. Sichtbare Rez-Unterstützung bleibt in der aktuellen Quote erhalten.
Fehlt deren erforderliche Risikobasis, bleibt die bestehende strukturierte
Fail-closed-Bewertung des Run-Owners zuständig.

Die Restpfadquote verwendet die Engine-gequotete Stärke nach dem aktuellen
Encounter. Bei einem bereits öffentlich aufgelösten Zufallsbreaker bleibt
der beobachtete Würfelwert dabei unverändert; die signierte aktuelle
Stärkeanpassung wird auf die quotierte Encounter-Grenzstärke bezogen. Auch
ein zusätzlich finanzierter, fortgeltender Pump erhält diese Konsistenz.
Eine widersprüchliche eingehende öffentliche Stärke scheitert sichtbar,
statt durch einen Ersatzwert repariert zu werden (SP-596).
Vor Ausgaben gegen ausschließlich verbleibende ETR-Subroutinen
prüft derselbe Owner außerdem den vollständigen Pump-/Breakpreis gegen den
gebundenen Fortsetzungsvertrag. Erhält der danach verbleibende bekannte Pfad
die akzeptierte Reserve nicht mehr, lässt der Owner die reine ETR auflösen,
statt zunächst zu bezahlen und im folgenden unveränderten Fenster abzubrechen.
Bereits gebrochene Subroutinen werden nicht erneut bezahlt. Die Zahlung führt
zweckgebundene Pools und über den Encounter hinaus gültige Stärke fort.
Bei mehreren finanzierbaren Antworten gegen reine ETR bewertet derselbe
Run-Window-Owner den vollständigen aktuellen Pump-/Breakpreis und einen
vollständig bekannten reinen ETR-Restpfad. Die gemeinsame Pfadquote erhält
zweckgebundene Pools und gültige Pumpstärke. Die Rangfolge bevorzugt danach
verbleibende liquide Credits und bei gleichem Cashverbrauch die geringeren
gesamten Nominalkosten. Ein einzelner billiger Pump zertifiziert keine
günstigere vollständige Folge. Unbekannte innere ICE, gemischte Wirkungen,
konditionale Folgen oder die Liquidation einer Zahlungsquelle liefern keine
gleichwertige reine ETR-Kostenrangfolge.
Bei gleichen vollständigen Cash- und Nominalkosten berücksichtigt die Quote
anschließend neu entstehende Quellentrashpflichten am Runende. Die Engine
kennzeichnet diese Konsequenz am tatsächlichen Break und projiziert bereits
benutzte öffentliche Quellen durch PlayerView und DTO. Pumpen allein zählt
nicht als Verbrauch; eine gebundene Quelle bleibt innerhalb desselben Runs
nutzbar. Der bekannte Restpfad zählt dieselbe Quelle nur einmal. Eine exakt
angebotene Pay-or-ETR-Fortsetzung kann bei gleichem Preis den Verbrauch
vermeiden; geschlossene, gemischte oder unvollständig gebundene Zahlungen
erhalten diesen Vergleich nicht. Der Runner-Zugplaner erhält den begrenzten
Nachkommawert des Owners ohne Rundung, damit die aktuelle Auswahl dieselbe
Kostenrangfolge konsumiert. Eine günstigere notwendige Coverage bleibt vor
dem bloßen Erhalt einer Quelle priorisiert.
Für gemischte aktuelle Encounter darf derselbe Owner ebenfalls vollständig
finanzierbare Breakerrouten vergleichen, wenn die gewöhnliche Zulassung und
die neu gequotete Reserve desselben Run-Roots erhalten bleiben. Der lokale
Zahlungsdienst quotiert alle noch offenen Subroutinen gemeinsam: zuerst
verbleibende liquide Credits, dann gesamte Nominalkosten und bei Gleichstand
neu gebundene Quellentrashpflichten. Ein billiger erster Pump ersetzt diesen
Nachweis nicht. Stärke, die weitere ICE beeinflusst, braucht weiterhin die
vollständige Restpfadbewertung; konditionale Folgen, spätere Klickverluste,
Stealthverluste und die Liquidation einer Zahlungsquelle liefern keinen
gleichwertigen lokalen Vergleich. Ein unfinanzierbarer vollständiger Break
verdrängt keinen notwendigen Teilbreak zum Schadens-/Programmschutz oder zum
Erhalt eines späteren Ausstiegs. Native Zustände aus Paarung 512 und ihre
wirklich angewandten Engine-Folgen sichern diese Grenze in
`meta-512-pairing-causes.test.ts`.

Öffentlich bereits aufgelöste Brechsperren werden im gemeinsamen
`currentRunPathContext` an die konkrete ICE-Instanz gebunden. Die aktuelle
Sperre gilt nur im laufenden Encounter; die vorgemerkte Sperre gilt für den
nächsten tatsächlichen Encounter, auch nach einem Auto-Pass. Die Pfadquote
darf dort keine Breaker-Zahlung oder Schadens-/Programmschutz durch einen
verbotenen Break erfinden. Unbekannte beziehungsweise ungerezzte ICE und eine
mögliche zufällige Auto-Passage zertifizieren keinen Encounter-Verbrauch.
Die vorgemerkte Sperre bindet daher die möglichen nächsten Instanzen bis zum
ersten öffentlich gesicherten Encounter. Eine bekannte harmlose gesperrte ICE
sperrt nicht zusätzlich die danach folgende ICE. Der bestehende Run-Owner entscheidet
weiterhin über die legale Fortsetzung beziehungsweise den Ausstieg.

Noch nicht aufgelöste Folgewirkungen erhalten ihre Encounter-Dauer aus dem
Engine-Subroutinentyp. Die gemeinsame Pfadquote setzt sie erst nach dem
Quellencounter ein und verbraucht eine Next-Encounter-Wirkung nach dem
nächsten tatsächlich gequoteten Encounter. Unbekannte ICE und eine mögliche
zufällige Auto-Passage zertifizieren diesen Verbrauch nicht. Runweite
Stärke-, Breakkosten- und Encountersteuern bleiben danach erhalten.
Die aktuelle Restwirkungsbewertung konsumiert dieselbe Pfadquote statt eine
zweite globale ICE-Projektion. Ihr Pflichtbedarf umfasst ausschließlich die
noch offenen Subroutinen-IDs der aktuellen Engine-Continuation; bereits
gebrochene oder aufgelöste Wirkungen werden nicht erneut als Breakpflicht
verwendet. Fehlende oder widersprüchliche Bindungen scheitern strukturiert.

Harte ETR mit einem erst am Zugende wirksamen Selbsttrash zählt in der
Pumpzulassung und der aktuellen Zahlungsquote ebenfalls als Zugriffsbarriere.
Der Run-Owner darf eine bloße allgemeine Zugreserve zurückstellen, wenn die
vollständige Pump-/Breakzahlung den aktuell neu gequoteten, gebundenen
Runvertrag erhält. Unbezahlbare Pflichtbreaks, verschlechterte unbekannte
ICE-Reserven und fehlende Rootbindung behalten ihre Sperren. Eine anfängliche
Probe benötigt dafür keine nachträglich erfundene Vollpfadzusage.

Die Zulassung von Run-Ereignissen quotiert Route und Handreserve mit der
bereits vorhandenen Projektion nach dem Verbrauch der Startkarte. Credit-
und Klickkosten stammen weiterhin aus der aktuellen LegalAction; dieselbe
projizierte Handgröße gilt für bekannte Schadensfolgen und unbekannte
ICE-Risiken. Ein Basisrun verbraucht keine Ereigniskarte. Der erwartete
Kartenverbrauch darf im Folgefenster keine neue Handpuffer-Verschlechterung
vortäuschen. Bewusst zugelassene Informationsproben behalten ihren ausdrücklich
knappen Startvertrag; echte zusätzliche Schäden oder neue Gefahren bleiben
Gründe für die bestehende Abbruchbewertung. Central-/Remote-Owner, Run-Leaf
und ihre Action-/Step-Bindungen bleiben unverändert.

Die Run-Action-Projektion erhält auch positive Selbsttags aus der konkret
gebundenen Successful-Run-Fähigkeit. Der bestehende Ziel-Owner bewertet diese
mit seiner Run-Risikokomponente; ein Kartenkontext darf den Tag weder verlieren
noch auf einen unabhängigen Basisrun übertragen. Dieses Risikosignal ist keine
garantierte Ressourcenverlustquote und ersetzt keine gesonderte Vorbereitung
gegen den Tag.

Die gemeinsame bekannte Pfadquote enthält auch die kanonischen Passgebühren
bekannter gerezzter Root-Karten. Jede verbleibende Passage zählt, einschließlich
unbekannter und für die Encounter-Projektion umgangener ICE. Gebühren werden
nach dem jeweiligen Encounter aus allgemeinen beziehungsweise Run-Credits
bezahlt; Breaker-Pools finanzieren sie nicht. Die Reihenfolge bleibt gegenüber
Creditverlusten erhalten. Rekursive Suffixvergleiche übernehmen die noch
unbezahlte Passage ihres Quell-Encounter genau einmal. Im aktuellen
Fort-Pass-Fenster zieht das Budget die bereits fällige Gebühr ab; die
Restpfadquote berechnet anschließend nur die zukünftigen Passagen.

Ein exakt auf null gequoteter direkter Schaden erzeugt auch in der
langfristigen Pfadprojektion keinen zusätzlichen Breakbedarf. Nur sein
Schadensmarker entfällt; unabhängige Run-Effekte und vollständige
Break-Verpflichtungen bleiben wirksam. Positive oder unbekannte Schadensmengen
behalten ihre bisherige Bewertung.

Die Restpfadprüfung vor einem freiwilligen Run-Abbruch unterscheidet eine
reine Schadensmarkierung von einer tatsächlichen Zugangssperre. Zertifiziert
der gemeinsame Pfad alle unabhängigen Barrieren als überwindbar, prüft der
bestehende Damage-Owner den kumulativen Schaden mit dem verbleibenden Budget
nach den notwendigen Breaks und dem bestätigten Handboden. Überlebbarer
Schaden darf dann nicht nach einem zulässigen Runstart denselben unveränderten
Pfad als unpassierbar erklären. Echte Letalität, fehlende Handreserve und
unabhängige unüberwindbare ICE bleiben Abbruchgründe.

Dieselbe Zusammenführung von Pfad- und Schadensbudget gilt bei der Zulassung
eines aktuellen Breaks. Ein bezahlbarer ETR-Break darf nicht als zwecklos
entfallen, weil allein der sichere Schaden des inneren Pfads keine
vollständige Breakquote besitzt. Die Prüfung reserviert zunächst die
aktuellen Pflicht-Breaks und alle Folgekosten. Danach bewertet sie verbleibende
aktuelle und spätere Schadenssubroutinen gemeinsam mit dem bestätigten
Handboden. Sie verwendet den bestehenden Damage-Owner und denselben
Pfadbefund wie die Zielbewertung; Plan-, Executor- und Actionbindung bleiben
beim laufenden Run.

Hat der gebundene terminale `runner.contest_remote` mit `score_threat` und
Run-Risikovertrag die nicht tödliche Unterschreitung der Handreserve bereits
akzeptiert, übergibt der Run-Window-Owner diesen Handboden ausdrücklich auch
an die Break- und Pump-Restpfadprüfung. Der gemeinsame Bewertungsdienst
entscheidet diese Ausnahme nicht selbst. Er prüft weiterhin den kumulativen
Schaden nach Zahlung gegen die tatsächlich verbleibende Hand; Letalität und
unabhängige Zugangssperren werden dadurch nicht freigegeben. Die
Alternativendiagnose verwendet dasselbe gebundene Budget.

Diese Prüfung gilt bereits vor den vorbereitenden Pumps. Nach vollständigen
Pump- und Breakkosten werden verbleibender aktueller Schaden und innere
Schadensquellen gemeinsam bewertet. Die Pumpquote reserviert außerdem alle
aktuellen Pflichtsubroutinen, einschließlich unabhängig notwendiger
Run-Locks. Deren Notwendigkeit stammt aus demselben Run-Remainder-Dienst wie
die spätere Breakentscheidung; es entsteht weder eine erfundene LegalAction
noch ein eigener Chooser. Eine tragbare Schadensfolge allein macht keinen
zusätzlichen Pflichtbreak erforderlich.

Nach dem Aufdecken des letzten unbekannten ICE verwendet auch die
Informationsgrenzenprüfung diese Zusammenführung. Ein vollständig bekannter,
finanzierter Pfad mit tragbarem Schaden kann damit vom Informationszweck zu
Zugriff wechseln. Die bestehenden Anforderungen an Payoff, unbekanntes ICE,
unvermeidbare Gefahren und gebundene Reserven gelten weiter.

**Klasse:** `urgent_response` oder gebundener Kindplan
**Rolle:** Urgent Response
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- freiwillige Run-Fortsetzung und Jack-out;
- Breaker-Pump und Subroutine-Break im aktuellen Encounter;
- Successful-Run-Trigger;
- Access-Modifikationen;
- Multiaccess-Aktivierungen;
- Credit-, Trash- oder Folge-Run-Payoffs;
- Ziel- und Choice-Auflösung innerhalb des begonnenen Runplans.

Beim Deaktivieren eines gerade passierten
ICE gegen Runende muss das sichtbare Ziel einen positiven erneuten Rezpreis
haben, damit diese Option einen Rez-Verweigerungswert erhält. Ein kostenlos
erneut aktivierbares ICE begründet keinen solchen Bonus zulasten des Zugriffs.
Die Bewertung erfolgt im bestehenden Run-Window-Owner.

Die Nutzenprüfung für Pump, Break und verbleibende Run-Effekte verwendet
denselben aktuellen Zielnachweis. Ausschließlich auf das nächste Encounter
wirkende Locks oder Breakverbote besitzen am innersten ICE ohne Redirect
oder Rewind keinen Nutzen. Dafür werden bereits die vorbereitenden Pumps
abgelehnt. Aktueller Schaden und bestehende Full-Break-Pflichten bleiben
wirksam; ein tatsächlich folgendes ICE bleibt ein gültiges Effektziel.

Bereits beim Runstart verwendet die bestätigte Schadensreserve die Handgröße nach dem
Verbrauch der konkreten Run-Karte. Die Risikostufe und der verbleibende
Handpuffer dürfen dabei nicht aus unterschiedlichen Handgrößen stammen.

Die aktuelle Kostenprojektion für Pump und Break trennt liquide Credits von
den tatsächlich verwendbaren sichtbaren Run-/Breaker-Pools. Sie verwendet
dieselbe zweckgebundene Zahlungsprojektion wie die Encounterbewertung;
separate Bankaktivierungen erzeugen dabei kein vorweggenommenes Guthaben.
Die Restzugplanung erhält nur den liquiden Zahlungsanteil als Cash-Bedarf.
Action-ID, Ziel, Kosten der Engine und Run-Owner bleiben unverändert. Nach
der Aktion endet die Projektion an der Engine-Fortsetzungsgrenze, sodass
ein verbrauchter Pool nicht erneut aus dem alten Zustand ausgegeben wird.
Auch ein kostenloser Subtypewechsel im Encounter prüft seinen anschließenden
Break gegen das aktuelle Runbudget einschließlich verfügbarer
Bad-Publicity-Credits und passend gebundener Breaker-Pools. Nur Bargeld zu
prüfen würde eine vom Run-Owner bereits finanzierte Route wieder sperren.

Auch ein Pump zur optionalen Schadensminderung muss nach allen nötigen
Pump-Schritten mindestens einen verbleibenden Break finanzieren. Der
Run-Window verwendet dazu die effektive Breaker-Quote und die zusätzlichen
Breakgebühren des aktuellen ICE. Eine gedruckte Fähigkeitszusammenfassung
oder ein Ersatzpreis ist kein Kostennachweis.

Besteht die aktuelle Restmenge ausschließlich aus Trace-Subroutinen, vergleicht
die Pump-Zulassung die vollständige Breakfolge mit der bestehenden sichtbaren
Trace-Abwehrquote. Eine gegen die gesamte sichtbare Corp-Zahlungskapazität
sichere, günstigere Zahlung darf nicht durch vorbereitende Pumps entwertet
werden. Der Vergleich verlangt eine aktuelle Trace-Supportquote und erhält
Full-Break-Pflichten, Stärke über mehrere Encounters, Break-Folgeeffekte sowie
beschränkte Zahlungspools und verbrauchbare Trace-Quellen. Er ändert nur die
Zulassung beim bestehenden Run-Window-Owner; die konkrete Trace-Choice bleibt
an ihre spätere Engine-Action gebunden.

Alle Quotes des aktiven Restpfads übernehmen die aktuelle Runner-private
`runnerTraceSupportQuote` aus der Engine über `currentRunPathContext`.
Das gilt auch ohne Encounter-Gebühr und für die Neuprüfung der beim Runstart
zugelassenen Creditreserve. Eine bezahlbare Trace-Abwehr darf beim Wechsel
vom Runstart zum Run-Window nicht aus der Kostenquote verschwinden.
Encounter-Gebühren und bereits bezahlte ICE bleiben daneben erhalten;
verbrauchte Trace-Quellen und gesunkene Credits werden aus dem aktuellen
Sichtzustand erneut bewertet. Root, Executor und spätere Trace-Choices
behalten ihre bestehenden Owner und exakten Engine-Bindungen.

Die Engine kennzeichnet bei installierten Runner-Programmen eine vom aktuellen
Wert abweichende Stärke nach dem Encounter mit `strengthAfterEncounter`.
Fehlt dieses Feld, bleibt die Stärke unverändert. Der Wert entfernt nur den
beim Encounter-Ende zurückgesetzten Anteil; Run-, Zug-, Host- und Counter-Boni
bleiben erhalten. Das DTO bewahrt diesen Fakt. Projektionen des inneren Pfads
und der nächsten Encounters verwenden ihn, während aktuelle LegalActions
weiter mit der aktuellen Stärke arbeiten. Ein optionaler Break reserviert
außerdem die aktuell legal gequoteten, noch nötigen Breaks desselben ICE und
den inneren Pfad aus denselben Zahlungspools. Eine bereits gezahlte oder
gebrochene Subroutine wird dabei nicht erneut angesetzt. Auch am innersten ICE
ohne weiteren Pfad müssen sämtliche verbleibenden Pflicht-Breaks gemeinsam
finanziert sein. Die Bezahlbarkeit nur eines weiteren Breaks erlaubt keine
optionale Schadensabwehr, die eine zweite verbleibende ETR-Sperre offenließe.

Beim gebundenen Run gilt dieselbe Prüfung auch für die Reserve vor unbekanntem
inneren ICE. Der Run-Window quotiert einen freiwilligen direkten Netz- oder
Fleischschaden-Break gemeinsam mit sämtlichen aktuellen ETR-Pflichtbreaks aus
den angebotenen Engine-Actions und denselben Zahlungspools. Nur wenn jede
vollständig zertifizierte Zahlungsroute danach den bestehenden Risikovertrag
zum Abbruch zwingt, wird die freiwillige Ausgabe ausgeschlossen. Die konkrete
Breakwahl bleibt beim bisherigen Owner; verdeckte ICE-Kosten werden nicht
angenommen. Aktuelle Schadensmitigation, gebundener Handpuffer, Hirnschaden,
Full-Break-Pflichten und unabhängige Folgeeffekte behalten ihre Abwehrpriorität.
Der native Checkpoint `cp-meta-500-r2-g22-d397` sichert Pflichtbreak,
Runreserve, Owner und Route sowie die finanzierten Gegenfälle ab.

Die Pump-Zulassung projiziert zusätzlich die bereits im aktuellen Angebot
finanzierten, aber noch nicht ausgeführten Pumps über diese Grenze. Ihre
Gültigkeitsdauer stammt aus dem kanonischen Engine-Breaker-Quote: Nur Run-
und Zug-Pumps erhöhen auch die Stärke im inneren Pfad. Encounter-Pumps
verfallen dort, ebenso bereits bestehende Encounter-Boni. Der zukünftige
Zahlungspfad verwendet diese projizierte Stärke und das um Pump und Break
verminderte Budget zusammen; andernfalls würde er fortbestehende Stärke ein
zweites Mal berechnen. Ein uneindeutiger Quote-Horizont scheitert sichtbar
mit `runner_projected_pump_horizon_unresolved`.

Öffentlich aufgelöster Corp-Schaden wird nach seiner Quelle zugeordnet.
Der Runner als Actor einer `continue_run`-Action macht die darin aufgelösten
Corp-ICE-Subroutinen nicht zu Runner-Selbstschaden. Erst ein tatsächlicher
Schadensfakt bestätigt die Gefahr; eine Corp-Quelle oder ein reines Run-Ende
allein genügen nicht. Die bestehenden Defense- und Run-Owner verwenden die
korrigierte Schadenshistorie für ihren Handpuffer.

Eine von der Engine markierte Zahlungsfortsetzung gehört dagegen zur bereits
gewählten Pumpaktion. Ihr eigener Continuation-Owner prüft die gespeicherte
Actionbindung; die Pump-Zulassung verlangt in diesem unterbrochenen Fenster
keine neue Encounter-Restquote.

Eine bereits zugelassene Fähigkeit für zusätzliche Breakerstärke bis zum
Run-Ende bleibt auch in einer zielerhaltenden Deflektor-Bruchroute enthalten.
`run-window-strength-preparation.ts` beziffert beim Run-Window-Owner die im
aktuellen Encounter nachweislich ersetzten Pumpkosten anhand aktueller
Stärke, kanonischer Verstärkung und legaler Zahlungsquotes. Verschiedene
Pumpgrößen ohne gemeinsame Sequenzquote begründen keine solche Ersparnis.
Die Bewertung bleibt unter der Priorität eines unmittelbar möglichen
Pflicht-Breaks; sie ist kein Deckbonus und begründet keine neue Zulassung.
Die Planübergabe erhält explizite Actionbewertungen auch bei einem gebundenen
Informationszugriff. Der exakte Checkpoint `cp-meta-467-r1-g2-d257` sichert
Aktivierung, Owner, Route und unveränderte StateVersion ab.

Das Modul besitzt kein unabhängiges langfristiges Ziel. Es gehört logisch zum
auslösenden Run-/Contest-Plan und kehrt anschließend dorthin zurück.

Auch nach einer Informations-Neuquote ohne bezahlbaren vollständigen Zugriff
bleibt die Abwehr aktueller sichtbarer Schäden beim Run-Window. Der Verlust
des Accesspfads darf eine bezahlbare Pump-/Teilbruchfolge zur Vermeidung von
Flatline oder gebundenem Handpufferverlust nicht ausschließen. Dafür werden
nur die aktuellen, über Engine-IDs gebundenen ungebrochenen Subroutinen
bewertet. Bereits gebrochener Schaden begründet keine weiteren Ausgaben;
fehlende Restbindungen scheitern strukturiert statt Schaden zu erfinden.

Der gemeinsame Konsequenzfakt in `runtime/current-encounter-damage.ts`
verwendet die bestehende sichtbare Schadensprojektion auch für die lokale
Pump-Zulassung. Mehrere Schadenssubroutinen teilen sich denselben Handpuffer
und dieselbe Prävention. Die bloße Einzelprüfung jeder Subroutine darf eine
kumulative Flatline nicht als überlebbar einstufen. Das Prädikat für rein
nicht tödliches Continue prüft die Letalitätsgrenze; zusätzliche bestätigte
oder im Run gebundene Handreserven bleiben beim Run-Owner.

Bedingter Schaden im nächsten Encounter wird gemeinsam mit der vollständig
bezahlbaren Folgelösung bewertet. Wählt die bekannte Pfadprojektion den
vollständigen Break des nächsten ICE, darf die Encounter-Auflösung nicht
zusätzlich den teureren Break der Quelle erzwingen. Unbekannte Ziele,
fehlende Engine-Quotes, aktive Break-Verbote und unfinanzierbare oder
bedingte Folgerouten liefern keine solche Zusage.
Im Ziel-Encounter liefert die Engine auf der aktuellen `continue_run`-Action
`encounterFullBreakDamage`: den noch drohenden Schaden bei unvollständigem
Break, beziehungsweise null nach Erfüllung oder ohne aktive Verpflichtung.
Der DTO erhält diese öffentliche Regeltatsache und die exakten verbleibenden
Subroutine-IDs. Der vorhandene Run-Owner berücksichtigt dadurch auch einen
sonst wirkungslosen letzten Break als notwendige Schadensvermeidung; bereits
gebrochene Subroutinen werden nicht erneut budgetiert. Action-Version,
Planinstanz, Executor und Route bleiben weiterhin bindend.

Der Run-Window bewertet außerdem vollständig finanzierte Teilabwehr gegen
aktuell gequoteten direkten Schaden und Programmtrash. Der gemeinsame Dienst
`runtime/runner-encounter-mitigation.ts` bindet verbleibende Engine-Subroutine-IDs,
Breaker, aktuelle Action und StateVersion. Er quotiert sämtliche nötigen Pumps,
zusätzliche Breakgebühren und wirksame Breakmengen mit den bestehenden
Breaker-/Zahlungsdiensten. Pump-Zulassung, Breakziel und Plan-Evidence verwenden
dieselbe Bewertung; nach jedem Engine-Schritt werden Restmenge und tatsächlich
verfügbare Pools neu geprüft. Ein verlorener Zugriffspfad oder fehlender
Remote-Ertrag verwirft diese aktuelle Schadensabwehr nicht.

Die Bewertung vergleicht verbleibende Flatline-Gefahr, Hirnschaden,
Programmverluste und Handschaden. Präventionspools werden in Effektfolge
einmalig verbraucht; Programmverluste sind auf die tatsächlich installierten
Programme begrenzt. Zwei von drei Trash-Subroutinen zu brechen rettet daher
bei nur einem installierten Programm noch nichts. Gleich wirksame Folgen
bevorzugen geringere Kosten. Bereits gebrochene oder exakt wirkungslose
Subroutinen rechtfertigen keine weiteren Ausgaben. Full-Break-Pflichten bleiben
vollständig zu finanzieren. Unaufgelöste Zufalls-/Selbsttrash- und weitere
Breaker-Nebenkosten werden nicht als garantierte Teilabwehr zertifiziert und
bleiben bei ihren bestehenden Risiko-/Zahlungsverträgen. Die Trace-Evidence
nennt Gesamtkosten, Ziele, verhinderte und verbleibende Verluste.

Auch der vorgelagerte Immediate-Safety-Breakguard konsumiert diese exakte
finanzierte Teilabwehr. Eine unabhängige Trace-Subroutine darf den gequoteten
Schadens- oder Programm-Break nicht verwerfen, nachdem derselbe Owner dessen
Pumps zugelassen hat. Andere Breakziele behalten die bestehenden Safety- und
Pfadprüfungen. Der echte Checkpoint `cp-meta-475-r14-g19-d354-mitigation`
prüft die Schadens-Breakroute unter unverändertem Root, Executor und
StateVersion; ein separater Engine-Fall belegt vollständige Zahlung, erhaltene
Hand und Programme sowie deterministisches Replay. Dieser Mechanikfall ist
kein Replay des historischen Matches und keine Zusage eines Gesamtsiegs.

Der fokussierte Nachweis liegt in
`evaluation/decision-checkpoints/match-d0f6-partial-break.test.ts`:
Die side-sicheren Maintenance-Checkpoints D77/D156 wählten auf dem aktuellen
Ausgangsstand `12f5e5e66` jeweils `continue_run`. Mit der Teilabwehr wählen sie
den Pump im bestehenden Owner. Separat konstruierte regelgleiche Engine-Fälle
prüfen die vollständigen KI-Folgen: vier Pumps und zwei Breaks für sechs Credits
verhindern zwei Hirnschäden; sechs Pumps und zwei Breaks für acht Credits lassen
bei drei Trash-Subroutinen zwei Programme überleben, auch bei ungünstigem
legalem Corp-Ziel. Beide Runs enden anschließend. Engine-Replay und StateHash
stimmen überein. Diese Mechanikfälle sind kein Replay des historischen Matches.

Auch die allgemeine Zugriffspfadprüfung nach einem Break verwendet diese
Engine-Restliste. Sie zieht nur das aktuelle Breakziel von den noch offenen
Subroutinen ab; bereits gebrochene ETR- oder Zahlungssubroutinen erzeugen weder
einen weiteren Breakbedarf noch zusätzliche Restkosten. Eine fehlende oder
widersprüchliche Restliste scheitert sichtbar am vorhandenen Faktenvertrag.
Bereits gebundene Zahlungsfortsetzungen eröffnen diese strategische Prüfung
nicht erneut: Ihr Zahlungsfenster bietet keine normale Encounter-Continue-
Action. Der bestehende Cost-Continuation-Owner validiert weiterhin Original-
Action, Fenster, Root und Executor vor der Ausführung.

Im aktuellen Fort-Pass-Fenster unterscheiden sich die beiden angebotenen
`continue_run`-Actions fachlich: `decision:pay` erhält den Run, `decision:end_run`
beendet ihn. Der DTO erhält dazu `fortRunWindowAbility`, Entscheidung und
Zahlbetrag; interne IDs oder Definitionen des möglicherweise unrezzten
passierten ICE werden dafür nicht zusätzlich durchgereicht. Der bestehende
Run-Owner bindet die exakte Phase an aktuelle Action-Version, Server,
Bewegungsposition und übereinstimmende Kosten. Vor einer bezahlten Fortsetzung
bewertet er den verbleibenden sichtbaren Breakerpfad und die Schadensreserve
nach dieser Gebühr. Seine vorhandenen Sicherheitsabbrüche gelten auch für
die angebotene Fort-Exit-Action. Bad-Publicity-/temporäre Run-Credits und
gebundene Zahlungshilfen bleiben von zweckgebundenen Breaker-Pools getrennt;
eine quotierte Zahlungshilfe muss weiterhin im echten Engine-Fenster ausgeführt
werden. Die Engine revalidiert beim Anwenden das tatsächliche passierte ICE.
Es entstehen weder ein zweiter Chooser noch ein allgemeiner Zahlungsbonus.

Bei einem bedingten Encounter-ETR darf der freie Run-Abbruch nur gegenüber
einer tatsächlich zugelassenen bezahlten Fortsetzung zurückgestellt werden.
Eine bloß vorhandene LegalAction genügt nicht: Wenn der bestehende
Run-Window-Owner ihren Restpfad oder ihre Reserve ablehnt, bleibt der eigene
legale Abbruch als expliziter Run-Step ausführbar.

Die bekannte Remote-Vorprojektion und die aktuelle Access-Konversion nutzen
dieselbe kanonische Trash-Impact-Bewertung. Die Vorprojektion erhält die
aktuelle Economy-Reserve; endliche Kreditpools, tatsächlich vorhandene
transferierbare Advancement-Counter und kanonische Schadens-/Tag-Effekte
bleiben getrennte Wertquellen. Ein leerer bereits gerezzter Kreditpool erzeugt
kein weiteres Einkommen. Bei einer bekannten ungerezzten Quelle zählt eine
kanonisch belegte `on_rez`-Initialisierung separat als zukünftiger Poolwert,
abzüglich der kanonischen Rezkosten. Dafür müssen Initialisierung, Menge und
Ziel `source` belegt sein; fehlender Rezzustand erzeugt keinen Zukunftspool.
Fehlende kanonische Kartendaten scheitern strukturiert.

Die bekannte Zugriffsbewertung trennt einen aktuell aktiven Effekt von einem
möglichen Effekt nach einer späteren Rezaktivierung. Vor einem angebotenen
Basisrun und am letzten Abbruchfenster darf sie bei einem tatsächlich
beobachteten ungerezzten Asset oder Upgrade die kanonische Rezvariante mit
dem öffentlichen Basiskreditpreis als Risiko bewerten. Eine zusätzliche
optionale Effektzahlung wird erst aus dem verbleibenden Corp-Pool bewertet.
Das ist kein zukünftiges LegalAction- oder Kostenquote-Zertifikat; die
Engine revalidiert jede tatsächliche Rezaktivierung. Aktuelle Effektconsumer
erhalten weiterhin ausschließlich die im jetzigen Rezzustand aktive Variante.

Ein bekannter Nicht-Agenda-Trash-Ertrag rechtfertigt dabei keinen Zugriff,
der eine gesamte vorhandene Breaker-Abdeckung zerstören kann. Der gemeinsame
Effektproducer leitet die bedrohten Klassen aus den tatsächlich installierten
kanonischen Breakern und der legalen Effektzielmenge ab. Zwei unabhängige
Provider gegen einen einzelnen Programmtrash sind kein vollständiger
Coverageverlust. Unbeobachtete Root-Identitäten werden nicht geraten; eine
echte Rootersetzung invalidiert weiterhin das Positionsgedächtnis. Auswahl
und Ablehnung bleiben beim bestehenden Remote-Owner, nicht beim Choiceresolver.

Die reine Trash-Bewertung liegt unter `access/`; der Runtime-Adapter bindet
sie an die tatsächlich angebotene Trash-Action und deren zweckgebundene
Credit-Quote. Wiederkehrende Draw-Tag-Effekte werden über die kanonische
Capability `runner_draw_tax_tag` als Schadens-/Tag-Gefahr erkannt. Dadurch
kann deren Beseitigung einen vorübergehenden Reservefehlbetrag rechtfertigen,
ohne den Reservebedarf zu senken. Die Liquiditätskosten erfassen nur die durch
die neue Ausgabe zusätzlich entstehende Reservelücke; ein bereits vorher
bestehender Fehlbetrag gilt für beide Alternativen und wird nicht nochmals
als Kosten des Trash-Schritts berechnet. Economy- und Parentreserven bleiben
unverändert gebunden. Nach dem
Run bleibt der endliche Auffüllbedarf beim Economy-Owner verfügbar; eine
stärkere aktuelle Run-Gelegenheit kann weiterhin vorgehen.
Bei abgelehntem Access-Trash bezeichnet die Reservebegründung ausschließlich
das durch diese Zahlung zusätzlich entstehende Reservedefizit. Eine bereits
zu niedrige Bank macht eine kostenlose Aktion nicht unbezahlbar. Ohne
zusätzliches Defizit bleibt die aktuelle Nutzenbewertung als Ablehnungsgrund
sichtbar. Die Bewertung selbst wird dadurch nicht verändert. Paarung 522,
G5 D123, und native kostenlose sowie kostenpflichtige Gegenfälle sichern
diese Trennung ab.

Trash-Impact ist ausschließlich an eine vorhandene `trash_accessed_card`-
LegalAction gebunden. `decline_trash` bei einem Agenda-Steal ist keine
Trash-Alternative und erhält keinen daraus abgeleiteten Verzichtswert.

Ein fehlender Steal-/Trash-Ertrag allein rechtfertigt keinen Abbruch nach dem
letzten ICE: Eine aus der eigenen sichtbaren CardSpec belegte Belohnung am
Ende eines erfolgreichen Runs bleibt ein eigenständiger Ertrag. Die aktuelle
Fortsetzungsprüfung berücksichtigt diesen nur bei kostenloser Fortsetzung,
vollständig bekannten Root-Karten und ohne projizierte Zugriffsgefahr; sie
hebt weder Pfad- noch Risikosperren auf.

Jede aktuell legale Run-/Access-/Jack-out-/Pump-/Break-Action erhält eine
planlokale `RunnerRunWindowActionAssessment`. Nur
`admissible === true` darf materialisiert werden. Eine fehlende Assessment
ist kein implizites Allow, sondern `Default-Deny`. Access-Fenster können auch
ohne noch vorhandenen `playerView.run`-Snapshot planbezogen aufgelöst werden,
wenn LegalAction, Fenstersemantik und auslösender Planursprung vollständig
gebunden sind.

Bei optionaler Restricted-Run-Kapazität ohne aktiven Run ist eine lokale
Reserve-/Wertablehnung dieses Moduls keine globale Action-Sperre, wenn
`runner.contest_remote` dieselbe exakte Start-Run-Action bereits als
`executable` zertifiziert hat. Die Routen-, Kosten- und Schadensprüfung bleibt
beim Remote-Owner; dessen Planinstanz und Executor bleiben erhalten. Andere
Actions, nicht ausführbare Remote-Routen und aktive Run-Fortsetzungen erhalten
dadurch keine Freigabe. Das Run-Window materialisiert weiterhin nur seine
eigenen ausdrücklich zugelassenen Actions.

Aktuelle, für den Actor sichtbare Zustände flexibler Breaker gehören zur
Runpfad-Evidence. Ein gewählter ICE-Typ muss deshalb durch den AI-DTO bis zur
planlokalen Encounterbewertung erhalten bleiben; private oder gegnerisch
verdeckte Auswahlwerte dürfen daraus nicht abgeleitet werden.

Eine Engine-Choice, die erst nach mehreren Run-, Rez- oder Pass-Ereignissen
entsteht, bleibt nur dann beim ursprünglichen Runplan, wenn die Ereigniskette
vom gespeicherten Planstand bis zur aktuellen StateVersion vollständig,
lückenlos und typgeprüft ist. Eine feste maximale Anzahl von
Zwischenschritten ist kein fachlicher Herkunftsnachweis. Zusätzliche
Ereignistypen, Lücken oder ein abweichendes Quell-ICE invalidieren die
Fortsetzung weiterhin fail-closed.

## 9. `runner.expose_information`

Ein Event-Run mit vorgezogener ICE-Aufdeckung erhält sein statisches Merkmal
`eventApproachIceExposeBeforeRez` durch den produktiven LegalAction-DTO bis zur
Runquote. Die generische CardSpec-Übersetzung erhält den Aufdeckeffekt; der
gemeinsame Run-Nutzenvergleich verlangt dafür eine tatsächlich unbekannte,
unrezzte ICE am Ziel. Bekannte ICE und leere Forts erzeugen keinen solchen
Zusatznutzen. Die Remote-Vorbereitung klassifiziert ausschließlich Aktionen
vor einem Run und weist die aktuelle Aufdeckfolge keinem konkurrierenden
Vorbereitungsplan zu.

Die Betrachtungsfortsetzung bindet dieselbe Engine-Quelle und ausgewählte
Aufdeckerinnerung: entweder eine installierte Quelle oder die bekannte eigene
Eventkarte im Heap bei aktivem Event-Aufdeckmerkmal. Run, Ziel, Parent,
Ereignisfolge und StateVersion bleiben exakt gebunden. Diese Quellvarianten
ändern die Zuständigkeit des bestehenden Informations- und Runfenster-Owners
nicht.

Der Hint-Compiler erhält außerdem den typisierten, periodischen
Bad-Publicity-Wurf eines Virus als dynamische und zufallsabhängige Wirkung.
Das ist kein garantierter Ertrag und kein Aufbau- oder Siegplan. Fehlt nach
dieser Datenkorrektur weiterhin eine Entwicklungsrolle samt begrenztem
Parentbedarf für den späteren HQ-Ertrag, bleibt diese Strategieanbindung
ausdrücklich offen.

**Klasse:** `bounded_sequence`
**Rolle:** enger Informations-Child des aktiven Runplans
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Das Modul entscheidet im Approach-ICE-Fenster ausschließlich zwischen dem
exakten Smarteye-Aufdecken und dem exakten Verzicht. Es übernimmt weder die
Serverwahl noch die Runentscheidung: Root und Parent bleiben der bereits
gewählte Pressure-/Contest- beziehungsweise Run-Window-Plan.

Die Strategie lautet:

- unbekanntes, unrezztes ICE genau einmal aufdecken;
- eine bereits bekannte oder durch dieses Modul früher aufgedeckte exakte
  ICE-Instanz nicht erneut aufdecken;
- die Erinnerung nur aus einer tatsächlich planselektierten privaten
  LegalAction aufbauen und erst ab einer späteren `stateVersion` verwenden;
- die Erinnerung an Server und Karteninstanz binden, damit verdeckte
  Identitäten nicht über andere Server hinweg geraten;
- bei fehlendem exakten Runursprung, uneindeutigem Fenster oder unvollständiger
  Bindung fail-closed abbrechen.

Die lückenlose Ereigniskette eines aktuellen Turn-Plan-Lease darf zwischen
Run-Fortsetzung und Approach-ICE-Fenster auch Corp-Root-Rez-Ereignisse im
angegriffenen Server enthalten. Diese ändern den Runursprung nicht. Actor,
Root-Platzierung, Server und alle StateVersion-Übergänge bleiben exakt
geprüft; ein fremder Server oder eine Lücke zertifiziert diese Fortsetzung
nicht. Die native Regression aus Paarung 489, Spiel 27, D112 erhält den
HQ-Pressure-Root und dessen Run-Window-Parent über zwei solche Ereignisse.

Das plan-eigene Informationsgedächtnis ist privilegierter lokaler
KI-Zustand. Es erweitert weder PlayerViews noch PublicEvents und darf nicht
als allgemeine Hidden-Info-Quelle verwendet werden. Im TurnPlanner wird der
Informationswert in der vorhandenen Flexibilitätsdimension bewertet; eine
neue globale Bewertungsautorität entsteht nicht.

### Vertikale Implementierung der Informationsentscheidung

[`createRunnerExposeInformationModule`](../../../packages/ai/src/runner/expose-information/expose-information-plan-module.ts)
ist der Einstieg in `runner/expose-information/`. Der Owner bündelt:

- `expose-information-signals.ts`: den konkreten Approach-ICE-Entscheid,
  die Revalidierung des Runursprungs und die proaktiven Informationsfenster.
- `expose-information-plan-module.ts`: Discovery als Run-Child beziehungsweise
  eigener Informationsplan, P3-Assessment und aktuelle Action-/Quellenbindung.
- `expose-information-dispositions.ts`: den begründeten Verzicht auf wiederholte
  Information beziehungsweise die Ablehnung des Verzichts bei unbekanntem ICE.
- `expose-information-memory.ts`: Erinnerung ausschließlich an eine tatsächlich
  ausgewählte, aktuelle Aufdeckaction dieses Owners.
- `expose-information-types.ts`: Signale, Planstatus und Erinnerungsdatensatz.
- `expose-installed-card-choice.ts`: die vorhandene Positions-/Historienbewertung
  und die Auswahl angebotener Optionswerte beim Aufdecken installierter Karten.

Der Owner erhält side-sicheren Input, aktuelle Kandidaten und das vorherige
Planportfolio. Er benötigt keinen injizierten Runtime-Dienst. Run-Root,
Parent, Executor, Quelle, ICE und StateVersion werden wie bisher exakt
gebunden. Proaktive Signale berücksichtigen unbekannte installierte Karten,
passende Informationswerkzeuge und bereits vorhandene Duplikate.

Die Live-Runtime ruft die Signalbildung, Dispositionen und den Erinnerungsschreiber
auf. Der zentrale Choice-Einstieg delegiert an die bestehende Ownerfunktion.
Das gemeinsame Portfolio persistiert und validiert das Erinnerungsschema;
fachliches Schreiben und Lesen der Erinnerung liegen beim Informationsowner.
Die taktischen Planstandards kommen aus `runner-tactical-module-support.ts`.
Die Extraktion verändert keine Bewertung, keine Optionsauswahl und keine
Informationsberechtigung. Ihr Nutzen liegt darin, dieselbe fachliche
Entscheidung von der Aufnahme der Fakten bis zum späteren Wiedererkennen
einer aufgedeckten Instanz an einer Stelle verfolgen zu können.

## 10. Kein Runner-Fallbackplan

Der Runner-Scheduler erzeugt keinen „do something“-Plan. Economy,
Handpuffer oder anderer generischer Support handeln nur mit eigener positiver
Admission, endlichem Ziel und Abschlussbedingung. Ein Probe-Run benötigt
einen ausführbaren Pressure-/Informationsplan mit Target, Risiko und
erwarteter Konversion. Fehlt eine solche Planroute, wird die Lücke sichtbar
fail-closed behandelt.

Nach einer Informationsgrenze quotiert der bestehende Run-Parent den
verbleibenden sichtbaren Pfad erneut. Neben der deterministischen
Breaker-Abdeckung berücksichtigt er dieselbe kanonische
Random-Break-/Damage-Risikobewertung wie Run-Start und Abbruchprüfung.
Die bedingte Zufallsbruchroute wird als Erfolgszweig im gemeinsamen sichtbaren
Pfadprüfer gequotet. Dieselben Engine-Quotes prüfen Stärke, Subroutinen,
Zahlungen und alle bekannten Folge-Encounters; bloß vorhandene Subroutinen
sind kein Coverage-Nachweis. Die Quote markiert tatsächlich verwendete
Zufallsbreaks ausdrücklich als bedingt. Der Risk-Owner prüft anschließend
Handpuffer und Fehlschaden; ein Score-Threat hebt keine physische Sperre auf.

Ein ausreichend gepufferter probabilistischer Pfad darf deshalb nach dem
letzten unbekannten ICE zu Zugriff konvertieren; fehlende sichere Coverage
allein beweist keine unerreichbare Route. Die Diagnose kennzeichnet diese
bedingte Erreichbarkeit ausdrücklich. Aktueller Handpuffer, Funding,
unvermeidbare Gefahren und konkrete Engine-LegalActions bleiben bindend;
eine tödliche oder bereits verbrauchte Break-Option wird dadurch nicht
freigegeben. Parent, Executor und Action-ID bleiben beim aktuellen Runplan.
Die Zweckänderung zu Zugriff erzwingt allein keinen Break: Die konkrete
Engine-Fortsetzung muss den Run beenden oder eine andere separat bewertete
Gefahr muss den Break verlangen. Ein Break gegen ausschließlich auf das
nächste Encounter wirkende Subroutinen besitzt am innersten ICE keinen
Zweck, sofern dessen Quote keine Umleitung oder Rückversetzung enthält.
Diese Zielprüfung gehört zur Encounter-Action-Admission und bleibt von der
Wahl eines bestimmten Breakers unabhängig.

Dasselbe Modul lehnt einen Break ab, wenn die aktuelle Engine-LegalAction
`breakSubroutinePurpose: zero_damage_no_secondary_effect` zertifiziert.
Die Engine prüft dafür die tatsächlich abgeleitete Nullschadensmenge aller
gebrochenen Subroutinen sowie aktive Vollbruch-Schadenspflichten, eigene
Vollbruch-Payoffs und Spezial-/Erfolgseffekte der Breakerfähigkeit. Ein
gemischter Break mit wirksamer ETR, positive oder unbekannte Schadensmengen
und eigenständige Vollbruchwirkungen erhalten dieses Zertifikat nicht.
Legalität, Quelle, Subroutinen und StateVersion bleiben unverändert gebunden;
ein bestehendes Run-Commitment überstimmt die fehlende Wirkung nicht.
Die ausschließlich schädliche Pflicht, den benutzten Breaker nach Runende
zu trashen, begründet dabei keinen eigenständigen Nutzen eines Nullschadens-
Breaks. Die Engine klassifiziert diese mechanische Effektart generisch;
positive Erfolgs-/Counter-/Folgebreakeffekte und aktive Vollbruchpflichten
bleiben ausgeschlossen. Paarung530 G33/D190 reproduziert den ursprünglichen
Null-Core-Break mit allen 189 Präfixhashes und neun Checkpointbindungen.
Das aktuelle Engine-Zertifikat erhält dort die legale ETR-Breakauswahl beim
bisherigen Run-Executor; eine direkte ursprüngliche Fortsetzung spart gegenüber
Nullbreak plus ungebrochenem ETR einen Credit und erhält die Breakerinstanz.
Die allgemeine Safety-Einordnung berücksichtigt ebenfalls die aktuelle
Engine-Schadensmenge: ausdrücklich null direkter Schaden ist keine
unmittelbare Gefahr, auch bei Core-Schaden. Positive und unbekannte Mengen
bleiben Gefahren; eigenständige Vollbruchpflichten und Breakerwirkungen
bleiben beim bestehenden Encounter-Owner. Ein wirkungsloser Schadensbreak
darf dadurch keinen bezahlbaren ETR-Break ausschließen.

Die konkrete Break-Zulassung und die Pump-Vorbereitung verwenden denselben
kumulativen Schadens-/Handreservennachweis. Ein Break positiver aktueller
Schadenssubroutinen darf diese Reserve auch schützen, wenn der spätere
Zugriffspfad nicht mehr bezahlbar ist. Das entlastet weder einen alleinigen
Folge-ICE-Lock noch einen Schadensbreak oberhalb der gebundenen Reserve.

Bei einem nachweislich nicht mehr konvertierbaren bekannten Run darf derselbe
Encounter-Owner zusätzlich bezahlbaren aktuellen Core-Schaden begrenzen,
auch wenn der gebundene Handboden bereits eingehalten wird. Dazu quotiert er
die erforderlichen Pump-Schritte und bezahlbaren Schadensbreaks gemeinsam,
vergleicht die tatsächlich verbleibenden Verluste bis zum ETR und wählt bei
gleicher Wirkung die günstigere Folge. Eine unbezahlbare Vorbereitung wird
nicht begonnen. Eine finanzierte Zugriffsroute, unbekannte Zahlungsalternativen
und eigenständige Vollbruchpflichten erhalten diese Ausnahme nicht. Reale
Engine-Folgen aus dem D161-Kontext von `match_28287bd1967ac166` prüfen volle,
teilweise und unbezahlbare Mitigation sowie den finanzierten Gegenfall.

Die öffentliche exakte `pendingAutoPassIceId`-Bindung bleibt durch die AI-DTO
erhalten. Access- und Pump-Restpfade verwenden die gemeinsame verbleibende
ICE-Projektion und quotieren diese bereits gebundene Auto-Pass-Schicht nicht
erneut. Eine fehlende Bindung oder eine andere ICE entfernt keine innere
Schicht. D102 desselben Matches und die entsprechenden Gegenfälle prüfen
den Übergang beim bestehenden Run-Owner.

Blockiert die zunächst günstigere aktuelle ETR-Antwort den bekannten
Restpfad durch kumulierten Schaden, quotiert derselbe Pump-Owner zusätzlich
den vollständigen aktuellen Bruch. Nur ein vollständig bezahlbarer
Pump-/Breakpreis mit danach überlebbarem bekannten Restpfad macht diese
Vorbereitung zulässig. Unbekannte innere ICE oder ein nicht bezahlbarer
Vollbruch zertifizieren keine solche Alternative.

Die bekannte Pfadquote unterscheidet einen nicht bezahlbaren Quell-Break von
fehlender Breaker-Abdeckung. Würde ein Zukunftseffekt den sonst passierbaren
bekannten Restpfad sperren, bleibt die exakte unbezahlte Breakquote als
Finanzierungsbedarf erhalten. Sie darf nicht verworfen und dadurch die
Folgeschicht fälschlich als physisch unbrechbar eingeordnet werden.
Auch die nachgelagerte kumulative Schadensprüfung erhält diese Einordnung:
Ein aktuell nicht finanzierter, strukturell gequoteter Pfad bleibt
`blocked_unpayable`, selbst wenn sein ungeblockter Schaden tödlich wäre.
Der Run bleibt gesperrt; daraus entsteht jedoch kein Bedarf für einen
zweiten gleichwertigen Breaker. Tatsächlich fehlende Abdeckung und ein
unabhängiger Handpuffermangel behalten ihre eigenen Blocker.
Eine zusätzliche Encounter-Gebühr bleibt dagegen ein Creditbedarf. Macht sie
den Restpfad mit dem aktuellen Budget unbezahlbar, entsteht daraus keine
physische Zugangssperre und keine Pflicht, ihre Quelle teurer zu brechen.
Die Pfadquote erhält die günstigere zulässige Zahlung für die Finanzierung.

Der bestehende Run-Risiko-Owner bewertet vor dem Start und in jedem gebundenen
Fortsetzungsfenster das aktuelle Programm-Investment neu. Bei unbekanntem ICE
und aktiver Rez-Möglichkeit beträgt dessen zusätzlicher Creditpuffer höchstens
die aktuellen Corp-Credits und höchstens die Summe der sichtbaren
Installationskosten der eigenen Programme. Maßgeblich ist das Maximum aus
diesem Wert und dem bestehenden Risikopuffer; beide werden nicht addiert.
Ein Informations-Probe darf einen Fehlbetrag dieses Investmentpuffers nicht
übergehen. Ebenso wenig darf seine begrenzte Credit-Ausnahme einen
bereits gequoteten fehlenden Handpuffer freigeben. Bei gedeckten Run-Credits
übergibt die aktuelle erreichbare Route den noch im selben Zug herstellbaren
Puffer an Defense; nach dem Draw wird neu quotiert. Die nativen Zustände
506/G21/D105, G31/D104 und G32/D59 beginnen sonst mit Hand drei vor einer
unbekannten ICE. Tatsächliche Engine-Gegenfolgen zeigen unmittelbares
Überleben mit mindestens vier Handkarten vor dem später aufgedeckten Net4;
der reparierte G21-Owner wählt Bargain with Viacox für sieben Handkarten,
G31 und G32 den Basisdraw für vier. Die Identität der
verdeckten ICE ist kein KI-Input und ein anderer ganzer Spielgewinn wird nicht
behauptet. Fehlende Programmkosten belegen keinen sicheren Pfad. Die explizite
Ausnahme für Matchpoint-Zugriffe mit stabiler universeller Coverage bleibt.
Die Reserve ist eine Risikopolicy, keine Vorhersage der verdeckten ICE-Identität,
keine garantierte Breakquote und kein Nachweis, dass verlorene Karten erneut
verfügbar wären. Historisch sichere Zugriffe ersetzen die aktuelle Prüfung
nicht. D96 des Matches e553 startet mit drei Credits und fünf Credits sichtbarem
Programm-Investment bei 17 Corp-Credits nun eine Funding-Aktion für die
Remote-Coverage statt des ursprünglichen R&D-Runs. Leeres Rig, fehlende
Rez-Liquidität und ein Pfad ohne unbekanntes ICE erzeugen keinen solchen
Zusatzpuffer. Verschlechterte Reserven bleiben beim bestehenden Run-Executor
und führen am legalen Abbruchfenster zur Neubewertung des Jack-out.
Die vorab gebundene Reserve für unbekanntes ICE gilt auch vor dessen
Informationsgrenze: Bekannter Schaden darf den reservierten Handpuffer nicht
verbrauchen; seine Vermeidung darf nur aus Credits außerhalb derselben
Reserve finanziert werden. Im laufenden Informations-Encounter schützt der
bestehende Schadens-Break-Owner diesen Handpuffer auch dann, wenn der Schaden
allein noch nicht tödlich wäre. Eine bereits gequotete einmalige Zahlungsquelle
wird im exakten Kostenfenster verwendet, wenn sie die nach der Zahlung fehlende
Creditreserve für den weiterhin unbekannten Restpfad vollständig finanziert.
Plan, Quelle, ursprüngliche Action und Engine-Fenster bleiben dabei gebunden.
Ein durch Zahlungsunterstützung unterbrochenes Encounter ist keine neue
Entscheidung über ungeblockten Schaden. Während die Engine ausschließlich
die markierte Kostenfortsetzung und ihre Zahlungshilfen anbietet, verlangt
die Schadensbewertung keine dort nicht angebotene Encounter-Continue-Quote;
der bestehende Continuation-Owner validiert und erhält die ursprüngliche
Action-, Plan- und Step-Bindung. Im regulären Encounter bleiben fehlende
Restquoten ein strukturierter Fehler.

Das gilt bereits im reinen Finanzierungsfenster vor der ursprünglichen
Kostenfortsetzung. Side, Timingpunkt, StateVersion, Zahlungsfenster und
ursprüngliche Action bleiben gebunden. Bei kombinierten Subroutinen ist
`traceStarted` der kanonische Startfakt: Derselbe Event kann wegen eines
vorangehenden Schadenseffekts `effectKind: damage` tragen. Der bestehende
Run-Owner erhält dennoch die exakte Trace-Choice und ihre Finanzierung;
Run-/Serverbindung und lückenlose Ereigniskette bleiben erforderlich.
Paarung 529/G19/D205–207 prüft Gebot sieben, die einmalige Swiss-Zahlung
und das exakt fortgesetzte Gebot nativ. Der ursprüngliche Abbruch erhält
dadurch keinen nachträglich erfundenen Endstand.

Das Informationsbudget darf ebenso einen bereits zugelassenen bezahlbaren
Break gegen die unmittelbare Zerstörung eines installierten Programms nicht
sperren. Der bestehende Run-Executor bindet diese Schutzroute an die exakten
verbleibenden Subroutinen der Engine-Continue-Action. Bereits gebrochene
Programmzerstörung begründet keine weitere Ausgabe gegen bloßes End-the-run;
fehlende oder widersprüchliche Restquoten scheitern strukturiert.

Eine Same-Turn-Zugriffsvorbereitung erbt den vollständigen bereits zugelassenen
Central-Run-Vertrag, insbesondere Zugriffszweck und Risikoreserve. Wechselt
ein gebundener Restzug nach der Vorbereitung zum Run, darf eine neu entdeckte
weitere Vorbereitung diese Fakten nicht aus dem residenten Owner entfernen.
Die Fortsetzungsvalidierung bleibt unverändert streng.

Eine spätere Vacuum-Link-Choice darf ebenso aus einer exakt gebundenen
Run-Executor-Phase hervorgehen, deren Root ein übergeordneter Restricted-Run-
Plan ist. Der bestehende Continuation-Owner prüft Commitment, Source-Plan,
Phase, Node, Lease, Parent und die lückenlose Run-/Rez-Ereigniskette. Die
letzte freiwillige Entscheidung muss dabei nicht unmittelbar vor dem
auslösenden Subroutinenfenster liegen; verpflichtende Engine-Fenster eröffnen
keinen neuen strategischen Owner.

Die Herkunftskette beginnt am Zustand der zuletzt ausgeführten Lease-Aktion,
nicht am späteren Beobachtungszustand des Portfolios. Der bestehende Owner
prüft weiterhin Commitment, Source-Plan, Phase, Node, Lease-Zustand, aktuelle
Run-ID, Quellkarte und vollständigen Choicevertrag. Native verpflichtende
Corp-Decline-Fenster dürfen in dieser lückenlosen Run-Kette ohne eigenes
Serverfeld vorkommen; sie ändern keinen Run. Jedes vorhandene Serverfeld muss
zum behaltenen Run passen. Lücken, fremde Aktionen oder widersprüchliche
Lease-Bindungen eröffnen keine Fortsetzung.

Die Zufallsbruchquote addiert zum Fehlschaden den direkten Schaden aller
noch offenen Encounter-Subroutinen. Maßgeblich sind die exakten
`encounterSubroutineIds` der Engine-Continue-Action, die das AI-DTO erhält.
Bereits gebrochene oder aufgelöste Subroutinen werden nicht erneut gezählt;
eine fehlende oder widersprüchliche Restquote scheitert strukturiert.
`unbrokenEncounterDamageLikely` beschreibt diese gesamte Restmenge, nicht
nur den gewählten Break-Target.

Die Engine begrenzt den unmittelbar gequoteten Kartenbezug eines
Runner-Draw-Events auf den aktuellen Stackbestand und erhält ausdrücklich
auch eine Nullquote. Die Action-Economy-Projektion trennt diesen tatsächlichen
Bezug vom Verbrauch der Eventkarte. `runner.develop_board_and_hand` erzeugt
für ein Draw-Event mit Nullbezug keinen Entwicklungsbedarf.

Generische Heap-Recovery bewertet die nach der Aktion tatsächlich behaltene
Hand mit dem bestehenden Discard-Vertrag. Bei vollem Handlimit muss das Ziel
die schwächste behaltene Karte strikt verbessern; eine bloß gleichwertige
Rücknahme eröffnet keinen Entwicklungsplan. Gespielte Recovery-Events werden
vor dieser Projektion aus der Hand entfernt.

Der endliche P6-Restkapazitätsvertrag von `runner.economy` lässt nach
erreichter Reserve weiterhin exakt gequotete, kostenfreie Kreditaktionen
installierter Werkzeuge zu. Sie dürfen außer dem Klick weder Handkarten noch
weitere Ressourcen verbrauchen. Die vorhandene Funding-Auswahl vergleicht
ihren Ertrag mit der Basisaktion; der Quellenname schließt stärkere Routen
nicht aus. Höhere Parent-Needs, Zuggrenze und Abschlussbedingung bleiben
bindend.

Auch die allgemeine Reservefinanzierung erhält den bereits erreichten
Handboden des vorhandenen Defense-Owners. Economy reicht ihn an die
exakte Funding-Suche weiter; unmittelbare Cash-Aktionen des
Hand-Development-Owners prüfen denselben Netto-Handverbrauch. Liegt die
Hand schon unter diesem Boden, dürfen handneutrale Kreditaktionen weiter
handeln. Zusätzliche Handkarten oberhalb des Bodens bleiben konvertierbar;
es entsteht weder ein Kartenname-Verbot noch ein neuer Safety-Owner.

## 11. `runner.credit_bank` und `runner.recurring_economy`

Für kanonisch einfache manuell geladene Gesamtauszahlungsbanken leitet
`runner.credit_bank` den verbleibenden Aufbau aus dem aktuellen
`desiredCreditReserve`-Ausgabenbudget ab. Eine feste Zahl an Ladungen oder
ein zwölf Credits großer Pflichtvorrat existiert für diesen Pfad nicht.
Die Rechnung in `plans/credit-bank-investment.ts` berücksichtigt eigene liquide
Credits, den Vorrat aller eigenen Bankinstanzen und den verbleibenden
Lade-/Auszahlungsaufwand gegenüber aktuell angebotenem Einkommen. Das Ziel
wird nach jeder Aktion und jedem Zugwechsel neu geprüft; gespeichertes Geld
bleibt bis zur tatsächlich legalen Auszahlung gebunden.

Eine bloß unterschrittene Wunschreserve löst bei diesen Banken keine
Auszahlung mehr aus. Konkrete, weiterhin exakt zugelassene Run- und
Development-Finanzierung, ein unterschrittener Liquiditätsboden oder eine
durch öffentliche Tags und Corpcredits gefährdete Ressourcenbank können
auch kleine Auszahlungen rechtfertigen. Ein bereits ausreichender Vorrat
wird gehalten und nicht weiter aufgeladen. Das Ausgabenbudget gilt auch vor
einer weiteren Bankinstallation: Decken liquide
Credits und bereits gespeichertes Bankguthaben das Ziel, wird eine zusätzliche
manuelle Bank mit ausdrücklich begründetem Hold abgewiesen. Ein realer
Restbedarf kann eine weitere Instanz weiterhin zulassen; es gibt kein
pauschales Kopienlimit. Native und budgetabhängige Gegenproben liegen in
`meta-541-bank-budget.test.ts` und `runner-credit-bank-source-cadence.test.ts`.
Die Regelautorität über das
gemeinsame Einmal-pro-Zug-Limit liegt weiterhin bei den Engine-LegalActions;
der bestehende quellgebundene Cadence-Nachweis bleibt erhalten. Automatische
Lifecycle-Banken werden getrennt bewertet: Der Bank-Owner vergleicht die durch genau
eine aktuelle Ladung zusätzlich erreichbaren Auszahlungen mit dem aktuell
angebotenen Einkommen. Bereits wartende Credits zählen nicht noch einmal als
Ladeertrag. Der bedingte Horizont beträgt höchstens drei kommende eigene Züge,
verkürzt durch den öffentlichen Corp-Deckrest; das aktuelle Ausgabenbudget
begrenzt den nutzbaren Betrag zusätzlich. Höhe und Anzahl der möglichen
Ladungen folgen aus Ladebetrag, Auszahlungsrate, Warteschlange und Bedarf,
nicht aus einem festen Guthaben- oder Ladungsziel. Eine fehlende exakte
Quell-/Fähigkeitsbindung oder ungültige Projektion erhält eine begründete
Ablehnung. Künftige Auszahlungen sind keine heutigen Zahlungscredits.
Native Queue-, Leerbank- und Marginalwertgegenfälle liegen in
`meta553-streetware-payout-horizon.native.test.ts` und
`credit-bank-investment.test.ts`. Native Routen,
Quellbindung, mehrzügiger Aufbau, größere bedingte Budgets und rechtzeitiger
Cashout sind in `runner-credit-bank-source-cadence.test.ts` geprüft.

**Status:** separate registrierte Core-Owner innerhalb der Economy-Domäne.
`credit_bank` besitzt Laden und Auszahlung einer konkreten Bank, einschließlich
endlichem Ziel, Reserve und Cadence. `recurring_economy` bewertet die aktuelle
wiederkehrende Einkommensquelle. `runnerContext` verdrahtet beide Owner;
Finanzierung eines fremden Ziels bleibt an dessen Bedarf gebunden.
Die Beschreibung von Economy als gemeinsamer Fachaufgabe in
Abschnitt 6 hebt diese tatsächlichen Modulidentitäten nicht auf.

### Vertikale Implementierung der Bank

Allgemeine wiederkehrende Breaker-Credits tragen im kanonischen Factsproducer
den Qualifier `using_icebreaker_during_run`. Sie dürfen auch noisy Breaker
finanzieren; non-noisy- und Killer-Pools behalten ihre Einschränkungen.
Development und Rigprojektion verlangen einen wirklichen installierten oder
gebundenen Folge-Breaker. Ein positiver Economyhint allein erzeugt keinen
ausführbaren parentlosen Installationsbedarf. Gehostete Breaker-Pools bleiben
im separaten Hostinvestment, Event-only-Pools außerhalb der Breakerfacts.
Der Datenvertrag bescheinigt weder sichere Core-Amortisierung noch einen
vollständigen Leaveplayhorizont. Kanonische Qualifier, Parentgegenfälle und
der reale noisy Break mit allgemeinen Bits sind fokussiert geprüft.

Die produktive Bankentscheidung liegt unter `packages/ai/src/runner/credit-bank/`:

| Quelle                                                                                                                 | Verantwortung                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [credit-bank-types.ts](../../../packages/ai/src/runner/credit-bank/credit-bank-types.ts)                               | Bankinstanz, Phase, aktuelle Action-IDs, abgelehnte Alternativen und privater Modulzustand                                  |
| [credit-bank-signals.ts](../../../packages/ai/src/runner/credit-bank/credit-bank-signals.ts)                           | Installieren, Laden, Auszahlen oder Halten; instanzgebundene Cadence, endliches Bankziel und Prüfung konkreter Finanzierung |
| [credit-bank-plan-module.ts](../../../packages/ai/src/runner/credit-bank/credit-bank-plan-module.ts)                   | Discovery, Assessment, exakte Phasenrouten und Fortsetzung nach der Installation                                            |
| [credit-bank-dispositions.ts](../../../packages/ai/src/runner/credit-bank/credit-bank-dispositions.ts)                 | Begründete Ablehnung konkreter Bankalternativen; aktive Actions anderer Economy-Owner bleiben erhalten                      |
| [credit-bank-prospective-planning.ts](../../../packages/ai/src/runner/credit-bank/credit-bank-prospective-planning.ts) | Side-sichere CardSpec-Projektion von Installation, Aufbau und Auszahlung; keine zukünftigen LegalAction-IDs                 |

Die Core-Registry registriert `createRunnerCreditBankModule`. Die Live-Runtime
ruft Signalerzeugung und Disposition auf und aggregiert deren Action-IDs für
die übrigen Owner. Sie entscheidet keine Bankphase. Der Owner importiert weder
die Core-Registry noch die zentrale Runtime oder deren Composition-Factories.
Diese Grenze wird durch `runner/vertical-owner-boundaries.test.ts` und das
allgemeine Importzyklus-Gate geschützt.

Eine Bankinstallation auf der letzten Aktion darf die bereits vom
Defense-Owner gelieferte Mindesthandreserve nicht durch den Verbrauch ihrer
Handkarte unterschreiten. Der Bank-Owner hält die Quelle dann mit
`runner_credit_bank_last_action_install_hand_floor` zurück und dispositioniert
ihre echten Installations-IDs. Eine Installation, die die Reserve erhält,
bleibt auch ohne selben Turn verfügbaren Ladeklick zugelassen. Der Schutz
betrifft die Installations-Admission; bestehende Lade-, Auszahlungs- und
gebundene Finanzierungsrouten behalten ihre jeweiligen Verträge.

### Benannte gemeinsame Dienste

`RunnerCreditBankServices` erhält acht Funktionen, die im selben
`runnerContext` an aktuellen Input, Kandidaten und Economy-Facts gebunden werden:

- `hasExactRunUrgency`: belegte Dringlichkeit des konkreten Runziels;
- `requiredPostRunReserve`: notwendige Reserve nach diesem Run;
- `terminalVisibleHazardFundingGap`: konkrete Finanzierungslücke eines
  terminalen Remote-Contests;
- `isDirectlyMandatoryRun`: bereits direkt konvertierbare Pflichtlinie;
- `terminalKnownPathFundingGap`: Lücke eines vollständig bekannten
  terminalen Pfads;
- `quoteRunAfterCashout`: vollständige Runquote nach einer garantierten
  Auszahlung;
- `quoteRunAfterCashoutRoute`: dieselbe Runquote nach einer endlichen Folge
  verschiedener garantierter Bankauszahlungen;
- `developmentFundingRoute`: aktuelle Action-IDs einer vollständig
  finanzierbaren Same-Turn-Kartenentwicklung.

Die Implementierungen dieser bereits geteilten Run-/Development-Funktionen
stehen weiterhin in der
[Live-Runtime](../../../packages/ai/src/runtime/plan-first-live-runtime.ts).
Die Schnittstelle überträgt Fakten und Routen; sie trifft keine Bankentscheidung.
Run-Admission, Development-Cashout-Admission, kanonische Kartenfunktionen,
`CreditDemand` und `searchFundingRoutes` bleiben explizit importierte Dienste.
Die unveränderten Runner-Defaults für Proposal, Assessment und vorhandenen
Domainkontext liegen in
[runner-plan-module-support.ts](../../../packages/ai/src/plans/runner-plan-module-support.ts).
Dieser Helfer besitzt keine bankabhängigen Schwellen, Phasen oder Routen.

### Bindungen und Grenzen

Installationssignale binden die sichtbare Karteninstanz und aktuelle Action-IDs.
Laden und Auszahlen verlangen zusätzlich die passende `planOwnerBinding`-Route.
Die Installationsfortsetzung bleibt an Bankziel und Capability gebunden;
nach Engine-Anwendung werden die aktuellen Kandidaten erneut materialisiert.
Eine prognostizierte spätere Fähigkeit ist keine bereits legale Action.
Die statische Ladeprojektion unterscheidet eine tatsächlich unbegrenzte
Fähigkeit von `once_per_turn_per_source`. Das Fehlen eines mechanischen Limits
verhindert keine Installation und erzeugt kein erfundenes Limit. Unterstützt
sind ausschließlich die vollständig geprüften Kosten und der einzelne
`add_hosted_credits`-Effekt auf der Quelle; unbekannte Kombinationen bleiben
ohne Projektion. Die strategische Ladetaktung bleibt Entscheidung des Bank-Owners.
Finanzierungsentscheidungen verwenden die bestehenden exakten Demand- und
Route-Suchen; der Schnitt ergänzt keine neue Parentkante im Scheduler.

Eine prospektiv vollständig finanzierbare Runroute ist noch kein aktuell
offener Bedarf des Run-Owners. Nach dessen konkreter Routenaufnahme prüft
`credit-bank-funding-revalidation.ts` StateVersion, exakte Parentinstanz,
`supportNeedId` und positiven materiellen Wert erneut. Wechselt der Parent
beispielsweise zu vorbereitender ICE-Entfernung und veröffentlicht keinen
Run-Funding-Bedarf mehr, hält die Bank ihren Vorrat und weist ihre zuvor
vorgesehene Auszahlung mit konkreter Ursachenangabe zurück. Auch der
komponierte Run-Funding-Bedarf wird dann nicht mehr veröffentlicht. Erst nach
der Engine-Anwendung entsteht gegebenenfalls ein neuer, vollständig geprüfter
Bedarf. Der strenge Assessment-Validator und der vorbereitende Remote-Owner
bleiben unverändert. Der native Zustand 475/R5/G4/D325 und die positive
Bank-Remote-Gegenprobe sichern diese Grenze.

Für den heutigen Bankpfad existiert kein eigener strategischer Choice-Resolver.
Die gebundene generische Ausführung bleibt zuständig. CardSpec-Installchoices
mit `requires_engine_quote` behalten ihre bisherige Projektionsgrenze; daraus
folgt keine neue Choice-Unterstützung durch das Verschieben der Dateien.

Der vorhandene `runtime/runner-bank-investment-context.ts` gehört zur separat
verdrahteten Economy-Commitment-/Score-Oberfläche und ist nicht der Produzent
der hier beschriebenen Plan-first-Bankphasen. Seine Composition-Pass-throughs
werden durch diesen Schnitt weder zur Autorität erhoben noch bereinigt.

### Bewertung und Anwendung auf weitere Owner

Der Schnitt entfernt rund 660 Zeilen Banklogik aus der zentralen Runtime und
bündelt den Plan mit seinen Signalen und Fortsetzungen. Die fachlichen
Schwellen und Prioritäten bleiben unverändert. Die vorhandenen Cadence-,
Prospective- und Finanzierungsregressionen prüfen weiterhin denselben Pfad.
Ein Strukturgewinn ist damit erreichbar, ohne zuerst den Scheduler oder alle
Owner umzubauen; ein Laufzeit- oder Spielstärkegewinn wird nicht behauptet.

Der wesentliche Aufwand liegt in der Abgrenzung wirklich geteilter Fakten und
der Prüfung der Bindungen. Fünf explizite Fact-/Routendienste sind hier
überschaubar. Für weitere Owner empfiehlt sich derselbe Schnitt einzeln,
wenn ihre fachlichen Entscheidungen ähnlich abgrenzbar sind. Wächst die
Abhängigkeitsschnittstelle dagegen mit jeder internen Hilfsfunktion, müssen
zuerst die gemeinsamen Fachverantwortlichkeiten geklärt werden. Eine große
Callback-Sammlung würde die Verteilung nur verstecken.

Das Muster ist für weitere überschaubare Owner sinnvoll. Es ist keine Abnahme
einer vollständigen Migration aller Owner. Eine allgemeine Modul-Framework-API,
ein Umbau aller Modulzustände oder die Bereinigung der übrigen Runtime-
Compositions ist dafür keine Voraussetzung.

### Vertikale Implementierung der wiederkehrenden Economy

`runner.recurring_economy` liegt unter
`packages/ai/src/runner/recurring-economy/`. Einstieg ist
[createRunnerRecurringEconomyModule](../../../packages/ai/src/runner/recurring-economy/recurring-economy-plan-module.ts).
`recurring-economy-signals.ts` besitzt die Installations-/Halteentscheidung,
sichtbare Auszahlungshistorie und Bindung geeigneter wiederkehrender
Breaker-Credits an Deckdoktrin und installierte Breaker. Die bereits vorhandene
Investitions- und Runhorizontbewertung liegt daneben in
`recurring-economy-investment.ts`; Zustand und Signale in
`recurring-economy-types.ts`.

`recurring-economy-run-deferral.ts` entscheidet aus den aktuellen Signalen,
ob ein aktives Investment Runs bis zur Auszahlung zurückstellt. Der Run-Owner
wendet diese Zurückstellung auf seine eigenen aktuellen Routen an. Halten
übernimmt keine unabhängigen Draw-, Entwicklungs- oder Economy-Actions.
`recurring-economy-dispositions.ts` weist unproduktive Installationsalternativen
zurück; bereits aktive Installationsrouten, exakte Coverage-Zwecke und zuvor
dispositionierte Actions bleiben geschützt.

Der endliche Investitionshorizont berücksichtigt zusätzlich die aktuell
gequotete Vorbereitung eines Run-Owners: Eine bezahlte Run-Sperre kann alle
`start_run`-Actions entfernen, obwohl ihre native Freigabe samt finanziertem
Folgerun bereits bereitsteht. `runnerContext` erzeugt diese bestehenden
Run-Lock-Routen vor den Economy-Signalen und übergibt sie als typisierte
Fakten. Der Economy-Owner validiert Action-ID, Seite, Zustand, Fähigkeit,
Finanzierung und Parentbindung. Eine behauptete bereite Route mit fehlender
oder veralteter Bindung scheitert strukturiert; blockierte Routen begründen
keinen verfügbaren Run.

Ein finanzierter vorbereiteter Run beendet das Halten nach tatsächlich
realisierten Einnahmen von Installationskosten plus zwei weiteren Auszahlungen.
Ein terminaler vorbereiteter Pfad oder erreichbarer Run bei gegnerischem
Matchpoint darf früher vorgehen. Die statische Priorität der Vorbereitung ist
kein erfundener Runertrag: Der sichtbare Run-Payoff stammt weiterhin nur aus
aktuellen Runbewertungen. Unrealisierte Investments, Finanzierungslücken,
fehlende Folgeklicks und blockierte bekannte Pfade bleiben geschützt. Die
Economy hebt ausschließlich ihre eigene Zurückstellung auf; Run-Admission,
Actionausschlüsse, Planwahl und Engine-Ausführung behalten ihre Owner.

Als einzige Rückfrage wird die exakte Dringlichkeit eines Runziels an denselben
aktuellen Entscheidungsinput gebunden übergeben. Kanonische Kartenprofile,
Rollen, nichtnegative LegalAction-Kosten und gemeinsame Planstandards bleiben
explizite Dienste. Es gibt keinen Rückimport zur zentralen Runtime und keinen
eigenen strategischen Choice-Resolver. Die Runtime verdrahtet Signale und
Dispositionen; der Scheduler besitzt weiter Auswahl und Planlebenszyklus.

Der Schnitt ist kleiner als bei der Bank: Die Fachentscheidung benötigt nur
einen Hostdienst und lässt sich mit den vorhandenen Investment-, Run- und
Coverage-Regressionen prüfen. Schwellen, Prioritäten und bisherige Grenzen
der historischen Quellenzuordnung bleiben unverändert. Der Nutzen liegt in
lokal nachvollziehbarer Einkommensplanung, nicht in zusätzlicher Spielstärke.

## 12. `runner.resource_lifecycle`

**Status:** registrierter Core-Owner. Er besitzt instanzgebundenes Halten,
Verlassen und verpflichtende Folgezustände einer eigenen Ressource, etwa
eine Engine-gequotete End-of-turn-Zahlung. Erwerb und anfängliche Finanzierung
bleiben beim jeweiligen Entwicklungs-/Economy-Parent. Eine Folgewirkung
berechtigt den Choice-Resolver nicht zur unabhängigen Ressourcenwahl.

Die positive AI-DTO-Allowlist erhält die Engine-Felder
`cardImplementationLifecycleAction`,
`cardImplementationLifecycleLeavePlayPaymentAmount` und
`cardImplementationLifecycleLeavePlayPaymentStatus` auch bei wiederholter
Projektion. Die Capability-, Quellen-, Action- und StateVersion-Bindung bleibt
unverändert. Der Owner entscheidet weiterhin anhand der tatsächlich gequoteten
Zahlbarkeit und des sichtbaren Restzughorizonts über Halten oder Verlassen;
fehlende Quotes werden nicht aus dem Kartennamen ergänzt. Ein ursprünglicher
Entscheidungszustand mit wiederhergestellten, im historischen Engine-Angebot
belegten DTO-Feldern prüft die Plan-/Step-/Routenbindung bei ausreichendem und
unmittelbar zu knappem Budget sowie beim wirtschaftlich zu kurzen Horizont.

### Vertikale Implementierung des Ressourcenlebenszyklus

Der produktive Einstieg ist
[`createRunnerResourceLifecycleModule`](../../../packages/ai/src/runner/resource-lifecycle/resource-lifecycle-plan-module.ts).
Im Verzeichnis `packages/ai/src/runner/resource-lifecycle/` liegen:

- `resource-lifecycle-signals.ts`: Quellen- und Versionsprüfung der LegalAction,
  konsistente Engine-Zahlungsquotes, sichtbarer Wirtschaftlichkeitshorizont,
  Halten/Verlassen und Behandlung freiwilligen Selbsttrashs.
- `resource-lifecycle-types.ts`: Signal, Planstatus und der schmale Vertrag
  für eine gemeinsame Finanzierungssuche.
- `resource-lifecycle-funding-needs.ts`: Projektion des belegten Zahlungsbedarfs
  auf die konkrete Ressourceninstanz und ihren Elternplan.
- `resource-lifecycle-plan-module.ts`: Discovery, Assessment, genaue
  Parent-/Need-Revalidierung und quellengebundene Materialisierung.
- `resource-lifecycle-dispositions.ts`: begründete Ablehnung der aktuell
  nicht produktiven Leave-play-Actions einer gehaltenen Ressource.

Freiwilliger Selbsttrash bindet die kanonische Capability, Quelleninstanz,
StateVersion und den tatsächlichen Aktionspreis. Ein vollständiges reines
Lebenszyklusprofil liefert Startzug-Einkommen, Leave-play-Verlust und eine
etwaige automatische Trace-Erfolgs-/Tag-Haftung. Ohne aktuell sichtbare,
gerezzte installierte Trace-Quelle bleibt das Einkommen erhalten; öffentliche
Archives-Abwürfe sind keine installierten Trace-Quellen. Bei einer solchen
Haftung bietet der Owner ihre Entfernung als P5-Route an, wenn nach dem Trash
noch ein aktuell legaler Run-Klick und nach dem exakten Kreditverlust ein
Startzuggewinn als Geldreserve verbleiben. Diese begrenzte Reserve ist eine
Owner-Bewertung, kein garantierter zukünftiger Run- oder Trace-Erfolg. Fehlt
die Folgekapazität, hält der Owner die Ressource mit konkreter Begründung.
Unvollständige Quellen-, Capability- oder Kostenbindungen bleiben unbekannt.
Die ausführbare Fähigkeit braucht zusätzlich ihre kanonische
`runner.resource_lifecycle`-Plan-Zuständigkeit; ein Lebenszyklussignal ersetzt
diese Bindung nicht.

Die Signalbildung erhält **einen injizierten Dienst** für die bestehende exakte
Finanzierungssuche. Der Owner liefert Bedarf, Elternplan-ID, Zielbetrag,
Priorität, Frist, verfügbare Klicks und Belege. Zurück kommen Route-Action-IDs
und eine Bewertung mit StateVersion, Deckung, Zuverlässigkeit, Horizont und
Restlücke. Nur eine vollständig garantierte Route im aktuellen Zug begründet
den unterstützbaren Zahlungsbedarf. Der gemeinsame Economy-Owner führt die
Finanzierungsactions aus; das Ressourcenmodul entscheidet über das spätere
Verlassen der Ressource.

Die bereits bestehende gemeinsame Validierung und ihre Datentypen stehen in
[`runner-funding-contracts.ts`](../../../packages/ai/src/plans/runner-funding-contracts.ts).
Dadurch benötigen Ressourcen- und Economy-Owner keinen gegenseitigen Import.
Kanonische Kartenfakten und `planInstanceIdForProposal` bleiben gemeinsame
Fakten beziehungsweise Identitätsfunktionen. Live-Runtime und Core-Registry
verdrahten den Owner und konsumieren seine Ergebnisse. Die Regelautorität
und das Erstellen gültiger Actions bleiben bei der Engine.

Der Schnitt erhält Priorität P5, die vorhandenen Phasen, Bewertungsformeln
und Actionbindungen. Er ist eine begrenzte Strukturmaßnahme: Änderungen an
Ressourcenfolgekosten betreffen nun einen zusammenhängenden Owner, ohne eine
zweite Finanzierungssuche oder neue Abstraktionsschicht einzuführen.
Owner-Grenztests sowie Tests gegen vertauschte Elternpläne, veraltete
Finanzierungsquotes und fehlende Routen sichern diese Trennung ab.

## 13. `runner.shell_traders_pipeline`

In der Runner-Hauptphase benötigt bezahlte Coverage-Beschleunigung einen
vollständigen aktuell finanzierten Zugriffsnachweis aus
`shell-traders-access.ts`. Er bindet Quelle, vorbereitete Karten, Server,
StateVersion und aktuellen Run. Die begrenzte Kombination vorbereiteter
Breaker berücksichtigt sämtliche verbleibenden Counterkosten, zulässige
Speicherverdrängung, den bekannten Engine-gequoteten ICE-Pfad und den
Run-Klick. Unbekannter Schutz, bedingte Pfade und fehlende Quotes bleiben
ausdrücklich unbekannt; sie erhalten keinen sicheren Rettungsclaim.

Eine engere Entwicklungsalternative braucht keinen sicheren Zugriffsclaim:
Hat Coverage eine aktuelle P4-Handinstallation zugelassen, darf Shell den
letzten Counter eines eigenen sichtbaren definitiongleichen Programms
entfernen. Die native Quote muss liquide bezahlbar sein, den Installklick
sparen und ohne Rigopfer in den freien Speicher passen. Quelle, Ziel,
Handalternative, Kosten und StateVersion bleiben exakt gebunden. Shell
meldet nur diese dominierten direkten Installationen über seine bestehenden
Dispositionen; die TurnPlanner-Zuständigkeit umfasst dafür `install.card`.
Dringende P2-Bedarfe, Coverage-Upgrades, redundante Programme und unbekannte
Zugriffswege erben daraus keinen Rettungsnachweis. Paarung 529/G9/D424
prüft diese Substitution und die endliche spätere Zugriff-/Scoregegenlinie.

Ein einzelner dringender Coverage-Bedarf vererbt P2 erst mit diesem
vollständigen Nachweis. Nicht finanzierbare bezahlte Beschleunigung bleibt
beim Shell-Owner zurückgestellt; reguläre Vorbereitung erhält weiterhin
ihren Entwicklungswert. Die Abnahme umfasst aktuell liquide Finanzierung,
keine neue mehrzügige Funding-Suche oder zukünftige Action-Queue. Nach jedem
realen Schritt wird neu gequotet. Encounter- und verpflichtende
Installationsfenster behalten ihre bestehenden Verträge. D147 aus Match
e553 sowie finanzierte, unterfinanzierte und unbekannte Gegenfälle prüfen
diese Grenze; eine nachträglich garantierte Rettung des Matches ist nicht
belegt.

**Status:** registrierter Core-Owner. Ein Pipeline-Signal bindet die konkrete
Quelle, das vorbereitete Programm-/Hardwareziel und die Phase
`prepare`, `progress` oder `hold`. Discovery hält diese Identität resident;
Assessment und Materialisierung verlangen die aktuelle passende Route.
Fortschritt darf kein wertvolleres Rig opfern; eine nicht gebundene Karte
wird nicht als Ersatz installiert.

Die vertikale Implementierung liegt in `runner/shell-traders/`, mit
[`createRunnerShellTradersPipelineModule`](../../../packages/ai/src/runner/shell-traders/shell-traders-plan-module.ts)
als Einstieg. Signalbildung, Rig-Ersatzbewertung, Zielwert, Start-of-turn-Choice,
Planstatus und Dispositionen liegen beim Owner. Die Registry registriert nur
die Factory; Runtime und Choice-Einstieg konsumieren die Ownerfunktionen.
Coverage-Anforderungen und Rollenabgleich kommen aus dem gemeinsam verwendeten
`plans/runner-coverage-contracts.ts`. Prioritäten, Zielidentitäten und
Wirtschaftlichkeitsformeln bleiben unverändert. Damit lässt sich die gesamte
Installationspipeline verfolgen, ohne ihre Regeln über Registry und Runtime
verteilt zu bearbeiten; ein zusätzlicher Runtime-Dienst ist nicht nötig.

Die verpflichtende Installationszielwahl besitzt den Step
`resolve_destination` desselben Pipeline-Owners. Die Engine quotiert je
Option `delayedInstallRequiresProgramTrash`; der KI-Input erhält diesen
Fakt unverändert. Der Plan bevorzugt Ziele ohne Programmverdrängung und bei
gleicher Verdrängung das Rig, um freie Hostkapazität zu erhalten. Quelle,
vorbereitete Zielinstanz, Choice, Action und StateVersion bleiben exakt
gebunden. Der Payload-Resolver führt ausschließlich diese residente Auswahl
aus; fehlende Quotes oder Bindungen scheitern sichtbar. Eine notwendige
anschließende MU-Auswahl verbleibt bei der bestehenden Programmersatzlogik.

## 14. `runner.score_installed_agenda` und `runner.secure_terminal_win`

Bedingte direkte Runner-Agendapunkte erhalten zusätzlich zur strukturierten
Wirkung eine private Engine-Quote für den aktuellen Zustand, die konkrete
Quellinstanz und Capability. Die Engine entscheidet die Black-Ops-Bedingung
aus den realen Turnflags. Quote null eröffnet keinen Punkteplan; Quote eins
erreicht je nach Siegschwelle den bestehenden Development- oder Terminal-Owner.
Fehlende, veraltete oder fremd gebundene Quotes scheitern sichtbar (SP-512).

**Status:** registrierte Core- beziehungsweise Tactical-Owner.
`score_installed_agenda` besitzt die legale Score-Konversion einer eigenen
installierten Agenda. `secure_terminal_win` besitzt die aktuell belegte
terminale Route mit validiertem Prioritätsanspruch. Beide verlangen genaue
Quellen-/Ziel-/Kostenbindung; ein Terminalsignal übernimmt keine fremde
Run- oder Entwicklungsentscheidung. Der Systemowner `runner.complete_turn`
folgt ausschließlich dem [EndTurn-Vertrag](planning-architecture.md#17-endturn-vertrag).

### Vertikale Implementierung der installierten Agenda-Konversion

[`createRunnerInstalledAgendaScoreModule`](../../../packages/ai/src/runner/installed-agenda/installed-agenda-plan-module.ts)
ist der Einstieg im Verzeichnis `runner/installed-agenda/`. Die Signaldatei
besitzt die Engine-markierte Score-Konversion, die erforderliche sichtbare
Quellkarte, deren Punkte und die Prüfung der Siegschwelle. Typen und Planstatus
liegen daneben. Das Planmodul bindet Discovery, P3 beziehungsweise P1 bei
terminaler Konversion, Assessment und Materialisierung an diese Action-IDs.

Die Live-Runtime injiziert nur die vorhandene Suche nach der sichtbaren eigenen
Karteninstanz. Fehlende Quelle, unbekannte Karte oder fehlende Punktangabe
behalten ihre strukturierten Fehler. Die Core-Registry registriert die Factory;
ein Rückimport vom Owner in Registry oder Live-Runtime ist nicht erforderlich.
Damit kann eine Änderung an dieser Score-Konversion lokal verfolgt werden,
ohne die Regeln für allgemeine Runner-Siege oder Run-Scoring zu übernehmen.

### Vertikale Implementierung der unmittelbaren Siegkonversion

[`createRunnerTerminalWinModule`](../../../packages/ai/src/runner/terminal-win/terminal-win-plan-module.ts)
registriert `runner.secure_terminal_win`. Im Verzeichnis `runner/terminal-win/`
liegen Signalbildung, Signal-/Zustandstypen und Planmodul zusammen. Die
Signalbildung erkennt dieselben zwei aktuellen Nachweise: das sichtbar leere
gegnerische Deck mit möglichem EndTurn und die legale sofortige Konversion
bis zur Agenda-Siegschwelle. Der Plan besitzt P1, die genaue Route und die
EndTurn-Begründung für den erzwungenen Pflichtzug. Ein Karteneffekt-EndTurn
wird dadurch weiterhin nicht zum normalen EndTurn umgedeutet.

Der Owner braucht keinen injizierten Runtime-Dienst. Der gemeinsame Fakt
[`runnerImmediateAgendaPointGain`](../../../packages/ai/src/actions/runner-agenda-point-effect.ts)
wird auch von der nichtterminalen Entwicklung konsumiert. Die unveränderten
taktischen Proposal-/Assessment-Defaults einschließlich Domainprüfung liegen
in [`runner-tactical-module-support.ts`](../../../packages/ai/src/plans/runner-tactical-module-support.ts).
Die Live-Runtime verbindet diese Ergebnisse mit den übrigen Plänen; sie
enthält die terminale Entscheidungsformel nicht mehr. Das erleichtert spätere
Änderungen an unmittelbaren Siegkonversionen, ohne einen zweiten Scheduler
oder eine neue Regelautorität einzuführen.

Die Engine kennzeichnet auch einen freiwilligen Zusatzrun nach erfolgreichem
Run mit `optionalBonusRun`. Der bestehende Run-Window-Owner verlangt dafür
einen aktuellen Zugriffsnutzen und darf den Bonus ausdrücklich ablehnen.
Verpflichtende Mehrserverfolgen erhalten diese Kennzeichnung nicht.

Eine vom Central-Owner exakt zugelassene optionale Runroute behält ihre
Zuständigkeit auch dann, wenn die lokale Run-Window-Nutzenprüfung sie ablehnt.
Die Disposition prüft dieselbe Action-ID, Erreichbarkeit, positiven Nutzen,
fehlende Routenausschlüsse und die Ausführungsphase; eine Vorbereitung oder
bloß gleichnamiger Server genügt nicht. Vollständig bekannte agendalose
Archives erzeugen dadurch keinen neuen Runzweck.

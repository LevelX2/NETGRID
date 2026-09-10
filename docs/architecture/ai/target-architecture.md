# KI-Zielbild: Schichten und Autoritäten

Status: **führende Begründung und Autoritätsgrenzen der aktuellen Architektur**  
Stand: 2026-09-10

## Zweck

NETGRID soll fachlich nachvollziehbare, zusammenhängende Vorhaben ausführen.
Dafür besitzt jede Entscheidung genau einen Planowner. Hints, Doctrine und
Quotes liefern Wissen; Scheduler und TurnPlanner koordinieren die Vorhaben.
Diese Trennung erlaubt fachliche Verbesserungen, ohne eine zweite Regelengine
oder einen nachgelagerten Action-Chooser aufzubauen.

Der Plan-first-Kern ist produktiv. Diese Seite begründet seine Schichten;
sie ist weder Migrationsplan noch Behauptung vollständiger Spielfähigkeit.
Die [Architekturkarte](README.md) ordnet aktuelle Symbole und Detailverträge zu.
Der [Implementierungsstand](planning-architecture.md#2-implementierungsstand-und-offene-grenzen)
trennt aktive Verträge von offenen Fähigkeiten.

## Schichten und Entscheidungsautorität

| Schicht                           | Eigene Aufgabe                                                                   | Grenze                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Engine / CardSpec                 | Regeldefinition, LegalActions, Kosten-/Wirkungsquotes und Ausführung             | Die Engine bleibt einzige Regelautorität; CardSpec ist kartenspezifische Autorenquelle |
| Hints / Action-Semantik           | Wiederverwendbare Kartenfunktionen und genaue Bedeutung eines aktuellen Angebots | Keine neue Legalität, kein strategischer Action-Gewinner                               |
| Doctrine / Strategic Intent       | Gemeinsam ausführbare Deckrollen und stabiler Strategieanker                     | Berät die Planbildung; erteilt keine Action-Autorität                                  |
| Fachlicher Planowner              | Ziel, Bedarf, Phasen, Routen, Risiken und Fortschritt seines Vorhabens           | Kein zweiter Owner für dieselbe fachliche Entscheidung                                 |
| Scheduler / TurnPlanner           | Validierte Pflichten, kohärente Restzuglinien, Root-/Leaf-Auswahl                | Verwendet fachliche Beiträge; rekonstruiert keine Kartenregeln                         |
| Commitment / gebundene Ausführung | Aktuellen Step, Invocation und Folge-Choices revalidieren                        | Resolver vervollständigen ausschließlich die bereits gebundene Entscheidung            |
| Observability                     | Entscheidungen und Grenzen erklären                                              | Diagnose verändert weder Bewertung noch Auswahl                                        |

Die Engine revalidiert jede eingereichte Action. Es handelt ausschließlich
der aktuelle Step eines gewählten Plans; ein frei bewerteter Action-Kandidat
darf den Plan nicht nachträglich ersetzen. Pflichtfenster und regelgenerierte
Fortsetzungen erhalten ihre genau gebundene Herkunft.

## Warum mehrere Planungshorizonte?

Deckstrategie beschreibt Möglichkeiten des Decks. Strategic Intent hält die
aktuelle Ausrichtung stabil. Eine residente Planinstanz verfolgt ein Vorhaben
über mehrere Entscheidungen oder Züge. Der TurnPlanner vergleicht, was im
belastbar projizierbaren Restzug gemeinsam ausführbar ist. Nur der nächste
Step wird gegen die aktuellen LegalActions gebunden.

So kann ein Score-Parent Schutz an Defense und dessen konkrete Finanzierung
an Economy delegieren, ohne Agenda-, Server- oder Ressourcenauswahl an einen
unzuständigen Resolver zu verlieren. Ziele bleiben resident, auch wenn eine
aktuelle Route blockiert ist. Die genauen Beziehungen definiert der
[gemeinsame Planvertrag](planning-architecture.md); die
[Ownerverträge](README.md#planowner-und-implementierungen) definieren die Fachaufgaben.

Ein Zugplan endet an einer echten Informationsgrenze. Er behauptet keine
konkrete Zukunft hinter unbekanntem Draw, Reveal oder gegnerischer Reaktion.
Erwarteter Fortschritt erhält eine gültige Bindung; materielle Abweichung
verlangt Revalidierung. Die maßgeblichen Details stehen im
[Zug-/Kampagnenvertrag](turn-campaign-planner.md).

## Generische Fachlogik statt Kartenlisten

Wiederverwendbare Fähigkeiten werden über Hints, Ability-Semantik,
TargetProfiles und Engine-Quotes erkannt. Instanz- und Definitions-IDs binden
konkrete Quellen, Ziele, Lifecycle und Replay; sie ersetzen keine generische
Funktionserkennung und keinen strategischen Nachweis.

Eine Deckdoktrin erfordert gemeinsam ausführbare Rollen. Ein einzelner
Beschleuniger oder Payoff begründet noch keine vollständige Strategie.
Eine individuelle mehrstufige Fähigkeit kann ein eigenes Modul benötigen,
wenn ihr Lebenszyklus und Fortschritt das Admission-Gate erfüllen.
Die [Strategiereferenz](strategy-signals-guide.md) beschreibt Signale und
Komposition; der [Hint-Vertrag](hint-architecture.md) beschreibt deren Quelle.

## Sicherheitsgrenzen

Die KI verarbeitet nur erlaubte `PlayerView`, side-gefilterte `PublicEvents`,
aktuelle `LegalActions` und ausdrücklich zugelassene eigene Metadaten. Der
vollständige gegnerische Hidden-State ist kein KI-Input. Zustandsabhängige
Kosten und Wirkungen müssen vollständig an Quelle, Ziel und `stateVersion`
gebunden sein. Unknown bleibt sichtbar und zertifiziert keine unbewiesene
Wirkung; unabhängige bekannte Routen behalten ihre Aussagekraft.

Planneridentität, Ranking und Cache beruhen auf side-sicheren Fingerprints.
Zufall wird nur innerhalb ausdrücklich zertifizierter Auswahlverträge durch
die Engine seed- und replaygebunden ausgeführt. Replay und StateHash bleiben
Engineverträge. Fehlerhafte aktuelle Bindungen scheitern sichtbar fail-closed.

Die private Betreiberanzeige darf die vollständige Hand der aktiven KI und
ihre Planung zeigen, niemals die Hand des menschlichen Spielers. Daraus folgt
keine Ausnahme für KI-Inputs, normale Netzwerkpayloads, öffentliche Replays,
Logs oder Clientfehler. Datenklassen und Diagnosepersistenz definiert der
[Trace-Vertrag](decision-trace-contract.md).

## Weiterentwicklung und Dokumentationspflege

Verbesserungen bleiben beim engsten zuständigen Owner. Eine Kerneländerung
benötigt eine gemeinsame Lifecycle-, Ressourcen-, Commitment-, Safety- oder
Diagnoseanforderung mehrerer fachlich verschiedener Module. Der
[Änderungskompass](change-compass.md) führt durch diese Prüfung.

Eine Verfeinerung ist erst als Fähigkeit abgenommen, wenn ihr ausführbarer
Pfad und Gegenfall belegt sind. Registrierung, Architekturkonformität und
technische Tests sind keine pauschale Spielstärkenzusage. Aktuelle Grenzen
stehen im Planvertrag und den Fachquellen; abgeschlossene Umsetzung und
historische Messstände bleiben in Git.

Für alle Architekturänderungen gilt der
[gemeinsame Pflegevertrag](README.md#pflegevertrag): eine maßgebliche Definition
je Regel, Prüfung ihrer Verweise und keine mehrfach ausgeschriebenen
Parallelverträge.

# NETGRID KI-Zielbild – Metaebene v6

Status: **führendes allgemeines KI-Konzept**  
Stand: 2026-08-02

## 1. Zweck und Verhältnis zu den Detailverträgen

Dieses Dokument beschreibt die allgemeine Entscheidungsarchitektur der
NETGRID-KI. Es ersetzt die vor dem Plan-first-Cutover entstandene Metaebene
v5. Die detaillierte Planarchitektur bleibt in
`ai-plan-layer-target-state-wip.md` führend; der implementierte Zug- und
Kampagnenvertrag ist zusätzlich in
`ai-turn-and-campaign-planner-concept-2026-07-29.md` und dessen Final Review
belegt.

Dieses allgemeine Zielbild bildet einen verbindlichen Dreierverbund mit:

- `ai-plan-layer-target-state-wip.md` als detailliertem Plan- und
  Ausführungsvertrag;
- `ai-program-logic-change-compass.md` als vollständig zu lesender
  Agenten-Handlungsanweisung.

Bei jeder inhaltlichen Änderung an einem der drei Dokumente werden mögliche
Auswirkungen auf die beiden anderen geprüft. Betroffene Begriffe, Haltung,
Autoritätsgrenzen, Ownership- oder Abnahmeregeln werden synchron angepasst;
andernfalls wird ausdrücklich festgestellt, dass die beiden anderen
Dokumente unverändert gültig bleiben. Das allgemeine Zielbild darf daher
weder dem detaillierten Planvertrag noch dem Agenten-Kompass stillschweigend
widersprechen.

Das Ziel ist keine KI aus immer mehr Sonderregeln. Fachwissen wird an der
engsten wiederverwendbaren Stelle modelliert und von genau einem Planowner
verwendet. Nur dieser Plan entscheidet; Hints, Doctrine, Sensoren, Quotes und
Resolver liefern Fakten oder vervollständigen eine bereits getroffene Wahl.

## 2. Aktuelle Entscheidungskette

```text
Engine-Regeln und CardImplementation
→ aktive strukturierte Karten-Hints und Funktionseffekte
→ semantisch verstandene LegalActions
→ DeckDoctrine und Strategic Intent
→ aktuelle Goal-/Threat-Signale
→ residente Planinstanzen und typisierte Parent-/Need-Beziehungen
→ Planning Heads der relevanten Planmodule
→ begrenzter Restzugvergleich im side-spezifischen TurnPlanner
→ TurnPlanCommitment und Execution Lease
→ autoritative Rematerialisierung genau des aktuellen Steps
→ PlayerAction oder eng zertifizierte Engine-Randomauswahl
→ erneute Validierung und Ausführung durch die Engine
```

Die Engine bleibt einzige Regelautorität. Die KI erzeugt keine LegalAction,
ändert keine Legalität und darf keine nicht angebotene Ersatzaktion
ausführen.

## 3. Semantik: von der Karte zur konkreten Action

### 3.1 Funktion statt Kartenliste

Die aktive Hint-Quelle beschreibt wiederverwendbare Funktionen wie Economy,
Suche, Breaker-Coverage, Advancement, Run-Tax, Damage, Tag-Punish oder
Counter-Banken. Produktive KI-Entscheidungen sollen diese Funktionen über die
konkrete Ability und LegalAction konsumieren, nicht über zentrale Karten-ID-
oder Namenslisten.

Konkrete Karten- und Instanz-IDs bleiben zulässig und notwendig für:

- die Bindung einer bereits ausgewählten Quelle oder Karteninstanz;
- Lifecycle- und Kampagnenidentität;
- Ziele, Server, Choices und Replay-Determinismus;
- eine tatsächlich individuelle Kartenmechanik mit eigenem Planmodul.

Sie dürfen nicht als Ersatz für eine generische Funktionsklassifikation oder
als versteckter globaler Strategiebonus dienen.

### 3.2 ActionSemanticCandidate

Eine angebotene LegalAction wird read-only mit Quelle, Ability, Kosten,
Timing, Zielen, Choices, Funktionseffekten und sichtbarem Boardkontext
verbunden. Passive Karteninformation bleibt von der aktuell ausgeführten
Ability getrennt. Mehrdeutige Ability-Bindung, fehlende Ziele oder veraltete
Quotes scheitern fail-closed.

Basisaktionen wie Draw, Credit, Run, Advance, Score, Rez und EndTurn besitzen
eigene regelnah definierte Semantik; sie werden nicht aus Karten-Hints
erraten.

## 4. DeckDoctrine und Strategie

DeckDoctrine analysiert das eigene Deck als Komposition, nicht als Sammlung
einzelner Schlagworte. Sie aggregiert:

- Taktiksignale;
- echte Strategieanker und deren Rollen;
- Dichte, Redundanz und gegenseitige Ergänzung der Komponenten;
- notwendige Quellen, Ziele, Payoffs, Economy und Abschlussfähigkeit;
- fehlende, latente, sichtbare und bereits aktive Rollen.

Eine Strategie wird nur primär, wenn ihre benötigten Komponenten gemeinsam
ausführbar im Deck vorhanden sind. Ein einzelner Beschleuniger, Payoff oder
Recyclinganker erzeugt keine vollständige Fast-Advance-, Damage-,
Recycling- oder ähnliche Doktrin. Ankerlose oder unvollständige Decks
erhalten neutrale Seitenprioritäten statt einer erfundenen Strategie.

DeckDoctrine beschreibt Tendenzen und Optionen. Sie wählt keine Action. Stark
deck- oder kartenabhängige Sequenzen gehören in ein admission-geprüftes
Planmodul, während die Doctrine nur die generisch ableitbare strategische
Unterstützung liefert.

## 5. Fünf Planungsebenen

### 5.1 Deckstrategie

Langfristige Möglichkeiten und bevorzugte Spielweise aus der eigenen
Deckkomposition. Sie verändert sich nicht durch normale Aktionsschwankungen.

### 5.2 Strategic Intent

Stabiler aktueller Strategieanker für die Spielsituation. P1- bis P3-Pläne
dürfen ihn mit belastbarer akuter Evidence übergehen. P4-/P5-Kampagnen
benötigen Intent-Fit oder ein aktuelles taktisches Signal. Ein Override
mutiert den Intent nicht automatisch.

### 5.3 Residente Kampagne oder Planinstanz

Mehrzügige Vorhaben wie Agenda-Score, Remote-Ausbau, Zentraldruck,
Breaker-/Rig-Aufbau, Punish oder Economy-Lifecycle. Sie besitzen Identität,
Meilensteine, Fortschritt, Abbruchbedingungen und Fortsetzungswert und dürfen
über Zug- und Gegnerwechsel resident bleiben.

### 5.4 Zugplan

Der TurnPlanner vergleicht begrenzt mehrere kohärente Restzuglinien. Ein
Zugplan kann den gesamten restlichen Zug, mehrere deterministische Phasen
oder nur bis zur nächsten Informationsgrenze reichen. Zusätzliche Aktionen
aus Operations oder Fähigkeiten werden als Action Capacity mit ihren
konkreten Folgeschritten mitgeplant.

### 5.5 Aktueller Step

Nur der aktuelle Step handelt. Er bindet exakt Planinstanz, Route,
LegalAction, Quelle, Ziel, Choices, Kostenquote und `stateVersion`. Zukünftige
Steps besitzen semantische Invocations, aber keine vorweggenommenen
Action-IDs.

## 6. Der Scheduler als alleiniger Dirigent

Planmodule melden Planning Heads aus ihrer fachlichen Sicht. Sie dürfen ihre
Dringlichkeit, erwartete Wirkung, Risiken, Ressourcenbedarfe und
Fortsetzungswerte beschreiben, sich aber nicht selbst zum Executor ernennen.

Der side-spezifische Scheduler:

1. aktualisiert das side-sichere Weltmodell;
2. reconciliiert residente Instanzen und typisierte Signale;
3. validiert P1- bis P3-Pflichten;
4. sammelt aktuelle Planning Heads;
5. projiziert nur unterstützte Restzugfolgen;
6. gruppiert äquivalente Linien und entfernt klar dominierte Varianten;
7. vergleicht Pflichtabdeckung, Risiko, Gegenwartsnutzen und
   Kampagnenfortsetzung;
8. wählt genau eine Linie und einen Leaf-Executor;
9. rematerialisiert nur deren aktuellen Step gegen aktuelle LegalActions.

P1 bis P3 sind harte validierte Pflichten, keine frei verrechenbaren
Scoreboni. Innerhalb zulässiger Linien nutzt der Planner ein versioniertes
Bewertungsregister für terminalen Ausgang, Agendafortschritt, Defense,
Economy, Handqualität, Flexibilität, Kontinuität und Risiko. Technische IDs
sind nur der letzte stabile Tiebreak.

Zufall ist nur für einen zertifizierten planlokalen Nahgleichstand oder eine
ausdrücklich zugelassene Rush-Neigung erlaubt. Klare Dominanz, verletzte
Pflichten oder unvollständige Bindung schließen Randomisierung aus. Die
Engine führt die atomare Auswahl seed- und replaygebunden aus.

## 7. Commitment, Grenzen und Neuplanung

Ein gewählter Zugplan erhält ein `TurnPlanCommitment`. Eine Execution Lease
autorisiert genau den aktuellen Node. Nach der Action wird nicht automatisch
alles neu gewählt; Erwartung und tatsächliches Ergebnis werden klassifiziert.

Ohne materielle Änderung wird die geplante Linie fortgesetzt. Neuplanung ist
erforderlich bei:

- Draw, Suche oder anderer privater neuer Information;
- öffentlichem Zufall mit offenem Ergebnis;
- gegnerischer Reaktion oder urgentem Interrupt;
- Engine-Fortsetzung, die eine neue Entscheidung verlangt;
- materieller Kosten-, Ziel-, Choice- oder Wirkungsabweichung;
- nicht mehr legalem beziehungsweise mehrdeutigem aktuellen Step;
- erreichtem Meilenstein, Zugwechsel oder Runtime-Neustart.

Nach einem Runtime-Neustart wird kein altes Zugcommitment blind fortgesetzt.
Das residente Portfolio wird wiederhergestellt und aus dem aktuellen Zustand
neu geplant.

Eine unsichere Aktion beendet die konkrete Vorplanung an dieser Boundary.
Wenn Ziehen die beste erste Aktion ist, wird bis zum Draw geplant; danach
entsteht mit der bekannten Karte ein neuer Restzugplan. Hinter einer solchen
Grenze werden keine konkreten Recourse-Actions vorgetäuscht.

## 8. Mehrzügige Kampagnen

Der Endwert des aktuellen Zuges reicht für Agenda-, Rig-, Economy- oder
Punish-Kampagnen nicht aus. Deshalb liefern Kampagnen vor und nach einer
Linie gebundene Meilensteinquotes. Typisierte Value Claims verhindern, dass
derselbe Nutzen zugleich vom Parent, Defense-Child und Economy-Support
doppelt gezählt wird.

Eine Agenda-Kampagne kann beispielsweise folgende Phasen besitzen:

```text
Scorefenster oder Rush zulassen
→ passenden Remote wählen oder vorbereiten
→ Defense-Bedarf an corp.defend_servers delegieren
→ Agenda installieren
→ advancen oder Counter übertragen
→ nach Gegneroutcome requoten
→ scoren oder mit sichtbarem Abbruchgrund aufgeben
```

Der Kampagnenwert rechtfertigt keine gefährliche Gegenwartsaktion. Sichtbare
akute Pflichten und der tatsächliche Schutz-/Zugriffspfad bleiben vorrangig.

## 9. Ownership und Parent-/Need-Beziehungen

| Entscheidung | Fachlicher Owner |
| --- | --- |
| Agenda, Score-Remote, Install/Advance/Score, Rush-Risiko | `corp.score_agenda` |
| globale ICE-Allokation, ICE-Installation, Schutzwirkung, Rez | `corp.defend_servers` |
| Finanzierung eines exakten fremden Bedarfs | `corp.economy` oder `runner.economy` als gebundener Support |
| Handüberlauf und Discard | Hand-/Agenda-Management ohne Übernahme fremder Zielwahl |
| Runner-Runziel und Runfortsetzung | zuständiger Runner-Run-/Contestplan |
| Payload einer bereits gewählten Choice | Resolver ohne neue Domainentscheidung |

Ein Parent formuliert einen typisierten Bedarf; der Child- oder Supportplan
behält die fachliche Entscheidung in seinem Bereich. So darf ein Scoreplan
Schutz anfordern, aber weder ICE-Ziel noch Rezentscheidung selbst wählen.
Umgekehrt darf Defense keine Agenda installieren.

## 10. Ressourcen, Action Capacity und Handinventar

Credits, Aktionen, Handplätze, Counter, Reserven und eingeschränkte
Ressourcen werden einem konkreten Zweck zugeordnet. Funding- und
Action-Capacity-Routen besitzen Garantiegrad, Horizont und Parentbindung.
Kontingente Zufallsgewinne dürfen eine Variante ermöglichen, aber keinen
garantierten Pfad vortäuschen.

Draw ist nie neutral. Er braucht Informations-, Setup-, Defense- oder
Scorezweck und einen realistischen Horizont. Ein Defense-Draw auf der letzten
Aktion ist unproduktiv, wenn vor dem Runnerzug kein Schutzschritt mehr
materialisierbar ist. Handmanagement darf einen Überlauf lösen, aber nicht
unter diesem Vorwand die Serverwahl für ICE oder die Zielwahl anderer Pläne
übernehmen.

## 11. Defense, ICE und Scoring als Beispiel der generischen Richtung

Unrezztes ICE ist nicht automatisch schlecht. Eine zweite oder dritte
Schicht kann Handraum schaffen, Bluffwert besitzen, einen Score-Remote
vorbereiten oder eine spätere Rez-Investition sichern. Der Defense-Plan muss
sie jedoch global gegen andere Server, bereits unrealisierte Schichten,
Runner-Rig, exakte Kosten, Schutzwirkung, Scorebedarf und Liquidität
vergleichen.

Es gibt weder eine Pflicht zum sofortigen Rezzen noch ein hartes
Schichtverbot. Ebenso darf die KI nicht blind vierte oder fünfte Schichten
stapeln, während frühere Schichten unfinanzierbar und wirkungslos bleiben.
Bekannte exakte Schutzrouten bleiben nutzbar, auch wenn ein anderer
Teilpfad unbekannt ist. Der unbekannte Pfad selbst bleibt fail-closed.

Rush, sicherer Aufbau und kombinierte Linie – etwa Agenda plus Remote-ICE
plus Central-ICE – konkurrieren als vollständige Varianten. Ungeschützte
Zentralen sind nicht apodiktisch verboten, solange keine konkrete P1-/P2-
Pflicht verletzt wird.

## 12. Known/Unknown, Sicherheit und Determinismus

- Es werden ausschließlich `PlayerView`, erlaubte PublicEvents,
  LegalActions und ausdrücklich zugelassene eigene Deckdaten konsumiert.
- Unknown ist weder null noch ein pauschales Verbot. Es blockiert nur die
  unbewiesene Behauptung und löscht keine unabhängige bekannte Route.
- Aktuelle Kosten und zustandsabhängige Wirkungen stammen aus vollständigen,
  instanz-, ziel- und `stateVersion`-gebundenen Engine-Quotes.
- Die Planneridentität verwendet einen side-sicheren Fingerprint, nicht den
  vollständigen `GameState`-Hash.
- Replay, RNG und StateHash bleiben Engineverträge.
- Ein Abdeckungsfehler wird sichtbar; es gibt keinen beliebigen
  „nimm die erste LegalAction“-Verhaltensfallback.

## 13. Observability

Der produktive Debugvertrag zeigt Planportfolio, Planning Heads, Varianten,
Pflichtabdeckung, Bewertungen, Boundaries, Commitment, Lease, aktuellen Step,
Why-not-Evidence und Kampagnenstatus.

Die private Betreiber-Buganzeige ist ausdrücklich kein side-sicherer
Spielerkanal. Sie darf und soll die vollständige Hand der jeweils aktiven KI
und deren komplette Zugplanung anzeigen. Die Hand des menschlichen Spielers
bleibt ausgeschlossen. Diese Ausnahme gilt nicht für PlayerViews,
PublicEvents, normale WebSocket-/Reconnect-Payloads, öffentliche Replays,
Logs oder Clientfehler.

## 14. Current State und verbleibende Entwicklung

Plan-first, getrennte Corp-/Runner-Scheduler, TurnPlanner,
TurnPlanCommitment, Execution Lease, Kampagnenpersistenz, typisierte
Informationsgrenzen, Restart-Replanung und private Zugplan-Diagnostik sind
produktiv umgesetzt.

Weitere Arbeit ist überwiegend Modul- und Play-Strength-Arbeit:

- mehr generische, Engine-zertifizierte Effekt- und Encounterquotes;
- bessere, weiterhin kompositionsabhängige DeckDoctrine;
- vollständigere planinterne Linien für spezielle, aber wiederverwendbare
  Economy-, Lifecycle-, Punish- und Setupmechaniken;
- qualitative Baselines für Scoring-Aktivität, Deckout, Passivität und
  langfristige Konversion;
- weitere echte Revalidierungs-Evidence-Produzenten ohne neue Autorität.

Der gemeinsame Kernel wird nur erweitert, wenn mehrere fachlich verschiedene
Planmodule dieselbe Lebenszyklus-, Ressourcen-, Commitment-, Sicherheits-
oder Diagnostikfähigkeit benötigen. Karten- oder deckbezogene Detaillogik
bleibt im zuständigen Planmodul.

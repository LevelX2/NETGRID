# Corp-Planowner: Aufgaben und Grenzen

Status: **aktuelle fachliche Verträge mit ausdrücklich offenen Fähigkeiten**  
Stand: 2026-09-10

Die [Ownerkarte](README.md#planowner-und-implementierungen) verbindet jede
registrierte Modul-ID mit ihrer Implementierung. Diese Seite definiert die
fachlichen Eingaben, Ziele, Bedarfe und Grenzen; der
[gemeinsame Planvertrag](planning-architecture.md) definiert Lifecycle und
Ausführungsbindung. Listen möglicher Phasen erläutern die Fachaufgabe, sie
sind weder zusätzliche TypeScript-Methoden noch eine Vollabnahme jeder Route.

**Ist und offene Reichweite:** `corp.opening_and_board_foundation` ist eine nicht registrierte
Modulidee. Die übrigen unten als produktiv gekennzeichneten Owner existieren;
ihre Route muss im aktuellen Zustand durch LegalActions und Quotes belegbar
sein. Registrierung allein zertifiziert keine vollständige Spielstärke.
Offene Domainfähigkeiten und ihre Abnahmegrenzen stehen in der
[Capability-Review](hidden-node-capability-review.md) und im
[aktuellen Arbeitsboard](../../activities/README.md).

## 1. `corp.opening_and_board_foundation`

**Klasse:** `bounded_sequence`
**Rolle:** Opening-/Setup-Vordergrund
**Status:** offene Modulidee; nicht als eigener Owner registriert.

Verantwortung:

- erste Zentralserver-Schutzbedarfe als typisierte Needs an
  `corp.defend_servers`;
- deckstrategisch erforderliches Remote oder Economy-Fundament;
- Rezreserve als Funding-Support für den exakten Defense-Need;
- Übergabe in Score-, Economy-, Punish- oder Glacier-Kampagne.

Der Plan darf nicht pauschal jedes Central mit einem ICE versehen. Er folgt
Deckstrategie, Hand, Agendaexposition und erwarteter früher Run-Gefahr.

## 2. `corp.score_agenda`

Der Score-Owner veröffentlicht die aktuelle Install-/Advance-Zulassung als
typisiertes `routeAssessment`. Schutzreife, unbekannte Schutzbewertung und
zurückgestellte letzte Installationsklicks werden daraus gelesen; Evidence
erklärt denselben Zustand. Funding-, Rush- und Parent-Dominanzübergänge
aktualisieren den fachlichen Zustand ausdrücklich. Ein exakter Same-Turn-
Konversionspfad trägt zusätzlich `sameTurnConversionProof: engine_quoted_path`
aus dem bestehenden Engine-gequoteten Pfad. Projektvergleich und
Zusammenführung lesen diesen Nachweis und die gebundenen Routenfakten,
niemals Evidence-Präfixe oder die Gleichheit von Erklärungstexten.

Das Fehlen einer Agenda in HQ erzeugt keinen generischen Score-Parent und
keinen Auftrag, nach unbekanntem Agendamaterial zu ziehen. Der Score-Owner
beginnt mit einer konkret verfügbaren Agenda oder einer aktuell gequoteten
Punktkonversion. Bis dahin dürfen vorhandenes Handpotenzial, Economy und
Defense aufgebaut werden; der normale Mandatory Draw liefert neue Karten.
Ein optionaler Draw benötigt einen unabhängig begründeten Bedarf, etwa die
Suche nach fehlender wirksamer ICE. Eine bekannte bedrohte Agenda in R&D wäre
ein konkreter Informations-/Defense-Fall und darf nur aus dafür tatsächlich
verfügbaren side-sicheren Fakten begründet werden. Weder allgemeine
Agendadichte noch eine leere Agenda-Hand ersetzen diesen Nachweis.

Für eine installierte Agenda unterscheidet der Scoreowner die vollständigen
Kosten der aktuellen Konversion von der bis zum nächsten Corp-Zug nötigen
Reserve. Eine Engine-Quote mit `creditsRequiredBeforeNextCorpTurn: 0` bedeutet
nicht, dass der nächste Advance ohne Finanzierung ausführbar wäre. Passen die
gequoteten Advances, der Score und die fehlenden Basiscredit-Aktionen gemeinsam
in den aktuellen Zug, veröffentlicht derselbe Parent den aktuellen Geldbedarf
und `sameTurnCloseout`. `corp.economy` führt den gebundenen Funding-Schritt aus;
ein terminaler Abschluss erhält P1. Ohne aktuelle Quote, ausreichende Klicks
oder exakte Basiscredit-Route entsteht dieser Nachweis nicht. Die Reserve für
den nächsten Zug bleibt ein eigener, unveränderter Horizont.

Eine vollständig gequotete leere Kostenliste zertifiziert null Klicks und
Credits. Ein nur mit Klickkosten ausgewiesener Advance kostet null Credits;
beide Fälle bleiben reguläre Scorefortentwicklung. Ein Engine-Payload-Feld,
das denselben bereits normalisierten Creditbetrag wiederholt, ist keine
zusätzliche Zahlung; abweichende Beträge oder andere Kostenarten bleiben
sichtbar und prüfpflichtig.

**Klasse:** `bounded_sequence` oder `strategic_campaign`
**Rolle:** Vordergrund, Closeout P1
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Interne Modi:

```text
fast_advance
rush
remote_score
overadvance
counter_transfer
same_turn_closeout
```

Mögliche Phasen:

```text
select_agenda
select_score_path
fund_score_path
prepare_or_select_remote
install_agenda
generate_action_capacity
place_advancement
protect_window
score_agenda
closeout_or_repeat
```

Der Plan berechnet die vollständige Konversionsroute und reserviert:

- Agendaquelle;
- Zielserver;
- Credits;
- Klicks oder Action Capacity;
- Advancement-Counter;
- benötigte Schutz-/Rezreserve.

Auch eine aktuell legale, regelbasierte Ressourcenumwandlung, die unmittelbar
Agendapunkte erzeugt, gehört als `convert_agenda`-Step diesem Owner. Ihr
Vertrag stammt vollständig aus derselben LegalAction: Quellregel, positive
Punktwirkung, aktive Verpflichtung, Credits, Klicks und StateVersion müssen
exakt gebunden sein. Der Plan darf weder Kartentext noch historische Kosten
rekonstruieren; ein unvollständiger Quote blockiert den Step fail-closed.

Installieren, Advancen und Scoren sind Phasen derselben exakten
`corp.score_agenda`-Instanz. Eine aktuell legale Advance-Action ist deshalb
kein unbekannter Score-Schutz und kein unabhängiger Entwicklungskandidat,
sondern die Fortentwicklung des gebundenen Agenda-Parents. Sie behält dessen
exakte Planinstanz, Agenda-Instanz, Ziel, aktuell revalidierte
Prioritätsklasse P1 bis P4 und Evidence. Ein von ihr angeforderter Defense-
oder Economy-Support bindet seinerseits exakt diese Score-Planinstanz als
`parentInstanceId`.

Die Kosten des aktuellen Advance-Steps stammen aus der konkreten
Engine-LegalAction beziehungsweise einem exakt an StateVersion,
Agenda-Instanz und Action gebundenen Engine-Quote. Die vollständigen
Restkosten bis zum Scoren stammen aus einer Engine-zertifizierten
Advancement-/Score-Projektion. Gedruckte Standardkosten,
Kartendefinitions-Fallbacks oder aus dem Kartentext rekonstruierte Summen sind
nicht autoritativ.

Fehlt ausnahmsweise der Quote für den aktuellen LegalAction-Step, ist dies
eine sichtbare Engine-/Projektionslücke und blockiert genau diesen Step
fail-closed; der Score-Parent bleibt resident. Fehlt nur eine belastbare Quote
für spätere, noch nicht materialisierte Steps, darf der Plan weder
Same-Turn-Ausführbarkeit noch ein geschütztes vollständiges Commitment
behaupten. Ein aktuell vollständig gequoteter Advance-Step bleibt aber eine
reguläre Fortentwicklung des Score-Plans, sofern sein eigener Planfortschritt
und Ressourcenvertrag positiv sind. Die unvollständige Zukunftsprojektion
darf ihn nicht als „unbekannten, nicht ausführbaren Score-Schutz“
umklassifizieren.

Ist ein Advance-Step bereits fälschlich `executable_now`, aber nicht exakt
materialisierbar, gilt der harte Vertragsfehler aus dem [Ausführungsvertrag](planning-architecture.md#261-fail-closed-statt-ersatz-replanning). Ist der
Parent dagegen schon in Discovery oder Assessment sauber als blockiert
klassifiziert, darf ein anderer regulär ausführbarer Plan entscheiden. Das
ist normale Planwahl und kein Action-Fallback.

Ein nach sichtbarem Zustand erzwungener Same-Turn-Score ist ein Commitment.
Einzelne Economy- oder
ICE-Aktionen dürfen ihn nicht aufbrechen.

## 3. `corp.establish_scoring_remote`

**Klasse:** `development_project`
**Rolle:** Background, zeitweise Vordergrund
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Der Plan folgt `RemoteDoctrineProfile` und besitzt:

```text
harden_to_protection_target
fund_rez_path
payload_ready
leased_to_score_project
assessment_unknown
```

Der deduplizierte Parent `strategic-score-remote` wird nach dem Opening bei
zugelassener Scoreline- oder Mixed-Purpose-Doctrine in jeder relevanten
StateVersion erneut signalisiert. `dependency: none`, `protectionTarget:
none`, Cadence 0 und reine Fast-Advance-, Asset- oder Ambush-Profile erzeugen
kein residentes Vorbauprojekt. `buildTiming` unterscheidet `prebuild`,
`payload_first` und `on_demand`; eine On-Demand-Scoreline von
`corp.score_agenda` bleibt unabhängig davon möglich.

Das Projekt besitzt stabile Zielbindung und `targetBindingRevision`, aber
keine Karten-, ICE-, Rez-, Agenda- oder Assetaktion. Es veröffentlicht genau
einen state-gebundenen Need: entweder
`improve_remote_protection_path` für `corp.defend_servers` oder den exakt
ermittelten Credit-Gap für `corp.economy`. Jede freiwillige P6-Hauptaktion,
die diesem Parent zugerechnet wird, verbraucht dieselbe Doctrine-Cadence;
gegnerzugseitige Rez-Responses und höherpriorisierte Score-Schritte zählen
nicht dazu. Ob ein solcher P6-Schritt den Zug erhält, entscheidet allein der
TurnPlanner aus vollständigen Restzuglinien und Prioritäten.

Die Rückbindung eines neu angelegten Remotes und der Cadence-Verbrauch
beobachten die ausgeführte `turnPlanExecutionLease`, den zugehörigen
Commitment-Knoten, den Remote-Parent und das unmittelbar erfolgreiche
side-sichere Engine-Event. Bei einer ICE-Installation müssen der tatsächliche
Event-Server und die dort sichtbare eigene ICE-Instanz zur gebundenen
Supportaktion passen. `selectedActionOrigin` ist ein Choice-Vertrag und
belegt gewöhnliche Corp-Installationsaktionen nicht.

Ein an `corp.score_agenda` verleastes Remote verliert seinen eigenen
Lifecycle-Need nicht. `feasible` bezeichnet ausschließlich einen aktuell
ausführbaren eigenen Remote-Step; es ist keine Zulassungsbedingung für den
Support, der einen blockierten Score-Consumer erst ausführbar macht. Ein
Score-Consumer mit exakt gebundener Agenda-Instanz, Zielserver und
Schutzanforderung darf daher einen `remote-hardening`-Need aktivieren, obwohl
sein eigener Agenda-Step noch nicht ausführbar ist. Lease und Need werden aus
Agenda-Instanz, Zielserver, `targetBindingRevision` und Schutzanforderung
gebildet. Zugschlüssel, aktuelle Credits und verbleibende Klicks sind keine
fachliche Identität und dürfen allein weder Rebinding noch einen neuen Need
auslösen.

Für `corp.score_agenda` und `corp.establish_scoring_remote` gilt an der
TurnPlanner-Coverage-Grenze ein kleiner Liveness-Vertrag. Ein aktiver,
blockierter Root benötigt genau einen aktuellen Fortschrittsbeleg: eigenen
ausführbaren Head, exakt gebundenen Support-Head, typisierte externe Waiting
Condition mit Deadline, Replan/Retarget oder Abandon. Ein P6-Economy-Head
deckt einen fehlenden P4-/P5-Provider nicht ab. `continue` ohne Linie oder
Waiting Condition und ein Provider ohne ausführbaren aktuellen Head sind
strukturelle Coverage-Fehler; die fachliche Runtime löst solche Zustände über
Replan, Retarget, Warten oder Abandon und nicht über einen allgemeinen Crash-
oder Credit-Fallback.

Die Machbarkeit eines Scoreprojekts zertifiziert noch keinen ausführbaren
Provider seiner ausgewählten Linie. Lehnt die globale Defense-Allokation
diesen konkreten Support ab, markiert der Progress-Root-Produzent die Linie
mit `selected_line_without_executable_provider` und einem expliziten
Replan-Beleg. Ein anderer Need desselben Agenda-Parents ersetzt die fehlende
Bindung nicht. Aktuelle eigene und exakt gebundene Support-Heads bleiben
unverändert ausführbar; die Coverage-Prüfung wird nicht abgeschwächt.

Die Agenda-Linienbildung trennt Rush und Blockerauflösung. `pure_rush` und
`combined_rush` benötigen einen exakten Agenda-Head. `safe_setup` darf gerade
ohne Agenda-Head entstehen, bindet dann aber Score-Parent, Need,
`corp.defend_servers`-Provider, aktuelle LegalAction und einen
Engine-/Assessment-gequoteten monotonen Schutzfortschritt. Die
ICE-/Serverauswahl bleibt vollständig bei `corp.defend_servers`; Remote und
Score wählen keine konkrete ICE-Karte.

Eine `combined_rush`-Linie darf Schutz nur aus aktuell gebundenen,
finanzierten Defense-Projektionen übernehmen. Gestagte Installation allein
belegt keinen finanzierten Schutz. Der zentrale Teil benötigt ebenfalls
eine konkrete Allokation von `corp.defend_servers`. Die gemeinsame Linie
verbraucht jede Handkarte höchstens einmal und muss Installation, gequotete
Rez-Kosten und verbleibende Score-Reserve zusammen finanzieren können.
Ohne diesen Beleg wird die kombinierte Linie mit einer Diagnose verworfen;
die eigenständigen Score- und gebundenen Vorbereitungsrouten bleiben separat
bewertet.

Die Remote-Reife verwendet den Engine-zertifizierten geordneten Runpfad und
trennt aktuell finanzierbare von nur gestagten Rez-Teilmengen. Allgemeine,
Breaker-, Stealth-, Hosted- und weitere eingeschränkte Runner-Credits bleiben
getrennte Größen. Blockierung, unvermeidbarer Schaden, Tags, Program-Trash,
Action-Tax und Break-Verhinderung erfüllen ausschließlich ihre versionierten
Schutzbandverträge; sie werden nicht still in Credits umgerechnet. Effekte
auf die nächste Begegnung zählen nur, wenn im geordneten Pfad tatsächlich ein
weiteres ICE folgt. Unvollständige Einzelpfade löschen keine unabhängig
bekannten Teilmengen; ohne mindestens einen bekannten Pfad lautet der Status
`assessment_unknown`.

Bei `new_remote` darf nur eine exakt an Parent und Need gebundene
Defense-Route genau eine aktuelle ICE-Install-`LegalAction` verwenden. Die
Engine liefert dafür neben Installations- und Post-Install-Rez-Quote auch die
vollständige effektive Post-Install-Runquote. Nach Ausführung bindet das
Projekt die tatsächlich entstandene Remote-ID und erhöht die Binding
Revision. Generische Defense darf weiterhin kein ungebundenes neues Remote
erfinden. Ein bestehendes Remote wird für eine sichtbare Agenda nur aus einer
aktuell legalen Engine-Zieloption als aufnahmefähig abgeleitet, nicht aus
`root.length`.

Sobald der vollständig gestagte Pfad das Schutzband erreicht, wird kein
weiteres ICE installiert. `corp.economy` finanziert dann den exakten
Rezbedarf. Die allgemeine qualitative Grenze von drei Credits bleibt
erhalten; nur der exakt gebundene Remote-Parent darf einen größeren Gap in
seinem Doctrine-`targetRecoveryTurns`-Horizont verfolgen. Eine bekannte
zentrale Rez-Reserve darf dabei weder für Installation noch Finanzierung
verbraucht werden.

Bei einer konkreten Scoreline beendet der Remote-Parent seinen eigenen Need,
wechselt nach `leased_to_score_project` und veröffentlicht keinen zweiten
Schutzauftrag. `corp.score_agenda` erzeugt seinen eigenen Need und prüft das
Remote erneut gegen Agenda-Wert, Scoredeadline und sein exaktes Schutzziel.
Nach Abschluss bleibt dieselbe Projektidentität zur Wiederverwendung oder
erneuten Härtung resident.

Fortschritt wird über effektiven Schutz und Nutzbarkeit gemessen, nicht über
ICE-Anzahl allein.

Ein vorbereitetes Zielremote bleibt über Economy-, Draw-, Punish- und
Central-Responses erhalten. Remote-Optionswert, Defense-Wert, Fundingwert und
Scorewert werden getrennt zugerechnet.

## 4. `corp.defend_servers`

Aktuelle Passgebühren gehören als Rez-Response diesem Owner. Die Engine
bindet den Root-Rez an Action, StateVersion, Run und Server und liefert die
verbleibenden ICE-Passagen sowie tatsächlich verfügbare Runner-Run-Credits.
Defense darf damit einen bezahlbaren Durchlauf, einen erzwungenen Abbruch
oder einen wirtschaftlich sinnvollen Gebührentausch bewerten. Die spätere
Access-Rez-Heuristik gilt nicht für vor dem ICE-Pass fällige Gebühren.

Für X-Trace-ICE validiert Defense die vollständige aktuelle Rez-Aktion
einschließlich X, Cap, zusätzlicher Kosten, Stärke und Trace-Wert. Eine eigene
`trace_access_block`-Route verwendet ausschließlich die Engine-Quote für
einen bei Corp-Gebot 0 garantierten Run-Abbruch und die sichtbare Breaker-
Antwort. Sie bezeichnet den Trace nicht als bedingungslose ETR-Subroutine.
Die bestehende Score-Reserve bleibt bindend; unter gleich wirksamen Routen
entscheidet der geringere Rez-Aufwand. Die erste Ausbaustufe zertifiziert nur
`modern_open` mit vollständig bekanntem installiertem Runner-Support, einer
einzelnen Run-Ende-/Runsperre-Trace-Subroutine und ohne unbekannte
Encounter-, Post-Bid- oder Cancel-Pfade. Andere Fälle erhalten keine Garantie.
Für einen tatsächlich begonnenen Trace mit fester Wirkung kann die Engine
auch das wirkungsgleiche Mindestgebot 0 zertifizieren. Die Choice-Auflösung
verwendet dann die vorhandene, exakt gebundene Nulloption; sie bewertet keine
neue Strategie und gibt keine zusätzlichen Credits ohne Wirkung aus.

**Klasse:** `development_project` mit internem Urgent-Response-Modus
**Rolle:** Background/Vordergrund/Urgent Response
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

`corp.defend_servers` ist genau ein globaler Verteidigungsplan im
Corp-Portfolio. HQ, R&D, Archives und Remotes erzeugen keine konkurrierenden
Root-Pläne. Sie liefern eine interne, nach jeder Aktion neu berechnete
Bedarfsliste. Der Plan entscheidet aus dieser Liste gemeinsam:

- welcher Server als Nächstes Schutz benötigt;
- welches verfügbare ICE für welchen Server den höchsten Grenznutzen hat;
- ob Installation, Finanzierung, Ziehen nach Schutz oder Rezzen der nächste
  Step ist;
- welche Schutzlücke bewusst vorerst offenbleibt;
- wie ICE, Credits und Klicks über mehrere Server verteilt werden.

Damit wird nicht zuerst ein Serverplan ausgewählt und danach das beste ICE
gesucht. Der fachliche Auswahlgegenstand ist das Paar aus
`Schutzressource × Zielserver` innerhalb desselben Plans. Nach jeder
Installation oder Zustandsänderung wird das gesamte Serverportfolio neu
bewertet.

Das frühere ICE-Platzierungsmodul ist im Zielzustand ausschließlich ein
Sensor-/Facts-Modul. Es ist keine Entscheidungsinstanz und besitzt keine
Installations-Ownership. Es darf nur fachliche Facts für konkrete Paare
`ICE × Server` liefern, etwa Regelzulässigkeit, Subtypen, Rig-Eignung,
serverspezifische Synergien und positionsabhängige Fit-Beiträge. Kosten sind
nur dann Facts, wenn sie als Engine-zertifizierte, an StateVersion,
Karteninstanz, Zielserver und konkrete LegalAction gebundene Quotes
vorliegen. Das Modul liefert keine `recommendation`, kein `veto`, kein
`hold`, keine eigene Platzierungs-`policy` und keinen numerischen
Entscheidungsbonus. Die globale Auswahl, das bewusste Zurückhalten und die
Opportunitätskostenentscheidung liegen ausschließlich bei
`corp.defend_servers`.

Tote oder nur aus einer bestimmten Position abgeleitete ICE-Werte sind
weiche Fit-Werte. Sie dürfen ein Paar weder allein empfehlen noch
ausschließen und keine Allokationsentscheidung vorwegnehmen. Harte
Ausschlüsse stammen ausschließlich aus Engine-Legalität oder vollständig
belegten Planverträgen. Fehlende Fachfacts bleiben sichtbar; sie werden nicht
durch pauschale Empfehlungen oder Vetos ersetzt.

Die Bewertung darf dabei nicht bei einem isoliert besten Sofortpaar stehen
bleiben. Der Plan betrachtet eine Zielallokation über den gesamten sichtbaren
ICE-Bestand: bereits installiertes ICE, ICE auf HQ, bezahlbare Rez-Kosten,
Installationskosten und die Option, ein ICE bewusst zurückzuhalten. Dadurch
wird auch die Opportunitätskostenfrage sichtbar: Ein universell gutes ICE
darf nicht auf einem wenig wichtigen Server verbraucht werden, wenn nur dieses
ICE eine kritische Lücke an einem anderen Server schließen kann. Aus der
besten erreichbaren Zielallokation wird anschließend genau der nächste
ausführbare Delta-Step materialisiert; danach erfolgt eine Neubewertung.
Auch der Plan selbst wird mit dem Wert dieser globalen Zielallokation
bewertet, nicht mit dem höchsten isolierten Serverbedarf. Sonst könnte die
korrekt berechnete Verteilung im Scheduler gegen einen schwächeren Draw- oder
Economy-Plan verlieren, obwohl ihr gemeinsamer Schutzgewinn höher ist.

Die Zielallokation vergleicht dabei nicht nur absolute Exposition, sondern
auch den Grenznutzen der nächsten Schicht. Solange keine Zentrale terminal
bedroht ist, erhält eine HQ- oder R&D-Zentrale mit positiver Agendaexposition
und noch keinem installierten ICE ihre erste wirksame Schicht, bevor die
andere agendaexponierte Zentrale eine weitere Schicht erhält. Terminale Gefahr
behält Vorrang; eine agenda-freie Zentrale erzeugt aus dieser Regel keinen
künstlichen Bedarf. Die Regel ist vollständig symmetrisch und begründet weder
eine feste HQ-Priorität noch ein dauerhaftes „Core Remote“.

Die Materialisierung bindet dabei genau eine ICE-Instanz an genau einen
Zielserver. Alle anderen aktuell legalen ICE-Server-Kombinationen, die nicht
Teil eines eigenen weiterhin echten Defense-Steps sind, werden vom globalen
`corp.defend_servers`-Modul mit ihrem konkreten Allokationsgrund
dispositioniert. Weder „ICE-Installation“ als Actionfamilie noch eine
allgemeine Defense-Rolle deckt diese Geschwistervarianten ab.
Auch ein HQ-Overflow macht Handmanagement nicht zum ICE-Owner:
`corp.hand_and_agenda_management` darf ICE weder als Discard-Konversion
installieren noch die Serverwahl treffen. Es meldet nur den Overflow-Bedarf;
jede ICE-Installation bleibt eine Route von `corp.defend_servers`.

Auch ein bekannter Zielserverkonflikt eines Upgrades bleibt unter Handdruck
verbindlich. Agenda-Schwierigkeitsrabatte erhalten auf Zentralen bereits im
gemeinsamen Platzierungsvertrag `defer`; eine negative Bewertung allein
genügt nicht. Der bestehende Defense-Consumer dispositioniert diese exakte
Installation, bevor Handmanagement sie als Overflow-Konversion beanspruchen
kann. Vorbereitete oder aktive Score-Remotes bleiben nach ihren bisherigen
Wert- und Ressourcenverträgen bewertbar.

Dasselbe Ownership-Prinzip schützt eine bereits für einen exakten
`corp.score_agenda`-Parent vorbereitete Remote: Ist die Agenda-Installation
nur wegen des letzten Klicks auf den nächsten Corpzug verschoben, darf
HQ-Overflow dort kein fremdes Asset oder Upgrade als Handkonversion
installieren. Die betroffene LegalAction wird durch
`corp.hand_and_agenda_management` ausdrücklich dispositioniert; andere
aktuelle Overflow-Konversionen bleiben wählbar. Handdruck darf einen
gebundenen Score-Server nicht stillschweigend umwidmen oder dessen Rootslot
belegen.

Ziehen nach ICE ist damit kein allgemeiner Handkarten-Fallback. Der Plan
unterscheidet mindestens drei Zustände: eine ausführbare produktive
ICE-Route, eine echte Effektlücke und eine reine Finanzierungslücke. Nur die
belegte Effektlücke darf den zielgerichteten Step `draw_for_ice`
materialisieren. Liegt bereits ein ICE oder eine Installation vor, die den
geforderten Schutzeffekt nach Rezzen erreichen würde, aber den exakten
Funding-/Reservevertrag verfehlt, ist das `funding_only`: Der Parent fordert
Economy-Support an; weiterer gezielter Draw ist unzulässig. Unbekannte oder
unvollständige Quotes werden nicht als Effektlücke umgedeutet.

Ein typisierter Schutzbedarf eines Score- oder Remoteplans erzeugt eine
explizite Parent-Kind-Delegation. Nur die konkret gebundene
Defense-Supportroute erbt `parentInstanceId` und Prioritätsklasse des
Parents. Der allgemeine Defense-Plan und seine übrigen Serverbedarfe werden
nicht pauschal hochgestuft. Die vererbte Klasse gilt nur, wenn mindestens
eine aktuell sichtbare ICE-Server-Kombination den Bedarf nach dem
Effekt-/Funding-Vertrag tatsächlich erfüllt oder messbar in Richtung des
Schutzziels fortschreibt. Ein unbrauchbares ICE für ein leeres Zielremote
darf nicht unter dem Etikett „Score-Support“ eine sachfremde HQ-Installation
priorisieren. Nicht erfüllbarer Support bleibt als Blocker des Parents
sichtbar; andere Serverbedarfe behalten ihre eigene Dringlichkeit. Auswahl,
Evidence und Assessment müssen aus derselben ausgewählten Prioritätsklasse
und Parentbindung stammen; ein planfremder Action-Score darf diese Delegation
nicht nachträglich verändern.

Bei der erstmaligen Anlage eines Remotes ist die konkrete aktuelle
`LegalAction` die Autorität für die Bindung an das Ziel `new_remote`; ihr
Post-Install-Quote bindet zusätzlich die von der Engine projizierte spätere
Remote-ID. Der normalisierte semantische Zielkontext darf diese beiden
unterschiedlichen Lebenszyklus-Identitäten nicht als zweite Autorität
nochmals gleichsetzen. Eine vollständig gebundene ICE-Installation vor einem
neuen Remote bleibt daher Support des exakten Score-Parents, auch wenn der
semantische Kontext bereits die projizierte Remote-ID trägt. Nach Anwendung
der Aktion wird ausschließlich gegen die entstandene echte Remote-ID
revalidiert.

Ein solcher ausführbarer erster Score-Schutz-Step darf nicht dauerhaft durch
immer weitere Schichten auf einer nichtterminal bedrohten Zentrale verdrängt
werden. Bei materieller Gefahr genügt dafür bereits vorhandene
Central-Abdeckung; bei akutem Druck bleibt die Central-Härtung bis zu drei
installierten Schichten vorrangig. Ab der vierten möglichen Schicht erhält
der exakt gebundene Score-Support den nächsten Delta-Step. Terminale
Zentralgefahr bleibt davon unberührt. Diese Ordnung begrenzt weder die spätere
Gesamttiefe eines Centrals noch weist sie einem Remote dauerhaft eine Rolle
zu; sie verhindert nur, dass ein bereits mehrfach geschützter Central die
erste Ausführung eines konkreten Win-Condition-Parents unbegrenzt aushungert.

Kann eine bereits installierte Agenda mit den aktuell sichtbaren Credits und
Klicks in demselben Corpzug vollständig weiteradvancet und gescort werden und
würde ihr Diebstahl dem Runner den Matchpunkt geben, veröffentlicht
`corp.score_agenda` den vorhandenen `preventsTerminalSteal`-Claim. Damit bleibt
Advance/Score beim bestehenden Score-Owner und konkurriert als belegter P2-Pfad
gegen terminale Defense. Ein spekulativer Defense-Draw darf diese exakte
Same-Turn-Fortsetzung nicht durch den Verbrauch eines zwingenden Klicks
zerstören. Das ist weder eine Kartenregel noch ein Resolver-Override: Agenda,
Server, aktuelle `LegalAction` und Folgephase werden weiterhin ausschließlich
vom residenten Scoreplan materialisiert.

Die Zielallokation ist keine reine Eins-zu-eins-Zuordnung von ICE zu Servern.
Ein wichtiger Server darf mehrere ICE erhalten. Produktivität entsteht aber
nicht durch die Anzahl von ICE, „Schutzschichten“ oder einen pauschalen
Contestability- beziehungsweise Scorebonus. Der Parent formuliert einen
prüfbaren Schutzeffekt, etwa eine maximal zulässige exakte
Zugriffswahrscheinlichkeit unter dem sichtbaren Runner-Rig. Jede mögliche
Installation wird gegen Vorher/Nachher dieses Effekts und gegen den
vollständigen Funding-/Reservevertrag projiziert. Eine Route ist nur
produktiv, wenn sie das Schutzziel erfüllt oder nachweisbar in dessen Richtung
fortschreibt; ein zweites ICE ohne zusätzlichen Effekt ist kein Fortschritt.

Der Schutzeffekt ist dabei nicht auf eine binäre oder unveränderte unmittelbare
Zugriffs-Erfolgswahrscheinlichkeit verengt. Ein zusätzliches ICE schreibt den
Schutz auch dann nachweisbar fort, wenn seine Engine-zertifizierte Begegnung
zusätzliche Breaker-Credits bindet oder seine bekannte Funktion Stop,
Tax-/Damage-Druck beziehungsweise Encounter-Störung erzeugt. Das gilt
unabhängig davon, ob bereits dasselbe ICE oder derselbe Rollenbegriff am Server
liegt. Bereits installierte unrezzte ICE sind alternative Rez- und
Encounter-Routen; ihre gesamten Rez-Kosten werden einer neuen Installation
nur dann als gemeinsame Finanzierungspflicht zugerechnet, wenn der konkrete
Schutzvertrag tatsächlich das gemeinsame Rezzen verlangt.

Auch die eng begrenzte Reifezertifizierung einer bereits zweischichtigen
Remote ist kein Layerbonus. Neben vollständigen Engine-Post-Rez- und
Kostenquotes muss `corp.score_agenda` den vollständigen sichtbaren Runnerpfad
durch genau die finanzierbaren Schichten projizieren. Erreicht der Runner den
Zugriff und behält dabei den überwiegenden Teil seiner allgemeinen Liquidität,
zertifizieren zwei billig brechbare Stop-Subroutinen keine reife Score-Remote.
Zulässig bleibt das Zertifikat bei einem blockierten Pfad, einer materiellen
Liquiditätsbindung oder unvermeidbarem Damage-, Tag- oder Aktionsdruck. Damit
bleibt die Schutzentscheidung beim Score-Parent und wird weder durch reine
ICE-Anzahl noch durch gedruckte Kartenwerte ersetzt.

Die Vorfinanzierungsregel bleibt symmetrisch und begrenzt: Wenn die erste
Schutzschicht eines langfristigen Scoreprojekts unter den makrostrategischen
Sicherungen bereits vor vollständiger Rez-/Score-Finanzierung gelegt werden
darf, darf eine vorhandene Ein-Schicht-Remote unter denselben Sicherungen auch
mit genau der zweiten, zur üblichen Remote-Reife fehlenden Schicht fortgeführt
werden. Sie darf deshalb nicht zugunsten einer neuen leeren Schwester-Remote
verworfen werden. Diese Regel rechtfertigt keine dritte oder weitere Schicht
ohne neuen exakten Bedarf und weist keinem Remote dauerhaft eine feste Rolle
zu; nach Ende oder Änderung des Projekts kann jedes legal geeignete Remote
erneut für Agenda, Asset oder einen anderen Root-Inhalt bewertet werden.

Die Allokationswertung berücksichtigt mindestens:

- strategischen Serverwert sowie sichtbare, erwartete und jüngst beobachtete
  Angriffshäufigkeit;
- für HQ die der Corp bekannte Anzahl und Punktesumme der Agendas, die
  gesamte HQ-Größe sowie wichtige trashbare Nicht-Agenda-Karten, deren
  Verlust den aktuellen Corp-Plan materiell schwächen würde;
- für HQ und R&D getrennt die aktuell sichtbare Multiaccess-Tiefe sowie
  Karten-, Counter-, Virus-, Run-Event- und andere Sondereffekte, die Zugriff,
  Zugriffsqualität oder Folgewirkung gerade für diesen Server verändern;
- Agendaexposition, Matchpoint und das exakt gebundene Scoring-Remote;
- den exakten Vorher-/Nachher-Effekt auf den geforderten Schutzvertrag;
- ICE-Eignung gegen das sichtbare Runner-Rig und serverspezifische Synergien;
- Engine-zertifizierte Installations-, aktuelle Rez- und Post-Install-Rez-
  Quotes einschließlich vollständiger gemeinsamer Reserve;
- Knappheit und alternative Einsatzorte desselben ICE;
- den Wert des bewussten Zurückhaltens statt einer sofortigen Installation.

Diese Facts wirken serverspezifisch und lexikografisch innerhalb der
Planverträge; sie werden nicht zu einem pauschalen numerischen
„HQ-gegen-R&D-Bonus“ geglättet. Eine hohe Agenda- oder Verlustexposition in HQ
ist starke HQ-Evidence, aber kein absolutes Gebot, ungeachtet der aktuellen
Runnerlinie sofort HQ-ICE zu installieren.

Das residuale Corp-Deckinventar folgt dem sichtbaren Kartenbesitzer, nicht
dem Controller einer Zone: Runner-eigene Bonuspunktkarten im Runner-Scorebereich
werden nicht vom Corp-Snapshot abgezogen. Corp-eigene Karten im öffentlichen
Runner-Rig oder Runner-Scorebereich werden dagegen genau einmal berücksichtigt.
Unbekannte Karten, doppelte Instanzen und eine nicht aufgehende R&D-Restmenge
bleiben Gründe für eine unbekannte Inventarbewertung.

Zeigt die side-sichere Runhistorie eine belastbare Konzentration auf R&D und
liegen keine terminale HQ-Gefahr, kein höherklassiger Score-Parent und keine
andere harte HQ-Evidence vor, darf `corp.defend_servers` HQ bewusst ohne
zusätzliches ICE lassen. Das gilt bei bereits vorhandener erster HQ-Schicht
auch mit nicht leerer HQ-Agendaexposition, wenn die Alternativen fachlich nahe
beieinanderliegen. Eine vollständig offene agendaexponierte Zentrale darf der
Hold-Fall dagegen nicht zugunsten einer weiteren nichtterminalen Schicht auf
der anderen Zentrale übergehen.
Dieser Bluff-/Hold-Fall installiert weder ein nach exakter Projektion
wirkungsloses ICE auf R&D noch erfindet er eine No-op-Action. Der
Defense-Plan dispositioniert seine aktuell unterlegenen
Installationsvarianten, bleibt resident und bietet für diese Entscheidung
keinen ausführbaren Defense-Step an. Dadurch konkurriert eine andere reguläre
Planaktion und das ICE bleibt in HQ.

Ein wirkungsloses R&D-ICE wird also nicht installiert, um
R&D-Aufmerksamkeit vorzutäuschen. Umgekehrt darf der Hold-Fall niemals einen
nach P1 bis P4 lexikografisch höherrangigen exakten Score-Schutzbedarf, eine
terminale HQ-Zugriffsgefahr, ein laufendes Commitment oder eine klar bessere
Schutzprojektion überstimmen. Nur wenn mehrere verbleibende
`ICE × Server`-Alternativen nach allen harten Verträgen und der fachlichen
Allokationswertung nahezu gleichwertig sind, darf die im [Routenvertrag](planning-architecture.md#262-stabile-tie-breaks-und-kontrollierte-variation)
definierte Engine-Randomisierung ihre Reihenfolge variieren.

Gedruckte `rezCost`-Werte, Layerzählung oder feste numerische Scoreboni dürfen
Engine-Quotes und Effektprojektion nicht ersetzen. Fehlen für ein sichtbares
ICE belastbare Eigenschaften oder ist ein erforderlicher Quote unbekannt,
unvollständig, veraltet oder nicht exakt an Karteninstanz, Server,
StateVersion und Action gebunden, bleibt der betroffene Defense-Step
diagnostisch blockiert und schlägt fail-closed fehl. Die Lücke wird in Engine,
Planmodul oder Kartenwissen geschlossen, nicht durch einen Ersatzwert,
Targeted Draw, Basic Credit oder Action-Fallback kaschiert.

Liefert die Engine für dieselbe ICE-Instanz mehrere aktuelle LegalActions,
etwa reguläres Rezzen und eine Olivia-artige Discount-Variante, bleiben diese
Actions getrennte Route Heads. Jedes Receipt bindet mindestens Quelle,
Server, StateVersion, Basiskosten, tatsächlich bezahlten Betrag,
Reduktions-/Aufschlagsquellen und gegebenenfalls das temporäre Derez. Eine
gemeinsame Karteninstanz ist kein Grund, Action-Identitäten oder Quotes
zusammenzuführen. Ein unvollständiges Receipt bleibt
`assessment_unknown`.

Verantwortung:

- dynamische HQ- und R&D-Schutzböden;
- Schutz des Zielremotes;
- ICE-Installations- und Rezreserve;
- Rez-Entscheidungen im aktuellen Run;
- Glacier-/Tax-Fortschritt;
- Reaktion auf sichtbare Runner-Rig- und Economy-Änderungen.

Interne Bedarfe und Steps:

- `rez_current_ice`;
- `raise_hq_floor`;
- `raise_rd_floor`;
- `harden_target_remote`;
- `restore_rez_reserve`.

`restore_rez_reserve` ist kein eigener Plan und keine dauerhafte pauschale
„Zentralreserve“. Es ist ausschließlich ein interner, endlicher
Ressourcenbedarf von `corp.defend_servers`. Score- und Remote-Parents können
ihn mit exaktem `parentInstanceId` und geerbter Prioritätsklasse anfordern,
delegieren damit aber die Verteidigungsreserve an `corp.defend_servers` und
besitzen keine parallele Reserve-Ownership. Die Höhe entsteht ausschließlich
aus den vollständigen Engine-Quotes der konkret betrachteten
Install-/Rez-Fortsetzung. `corp.economy` kann diesen typisierten
Defense-Parent-Need finanzieren, besitzt aber weder die Defense-Priorität noch
die ICE-/Serverauswahl. Ein Reserve-Service darf Facts und Konflikte
projizieren, aber keinen Executor wählen und keine Credit-, Draw-, ICE- oder
EndTurn-Action besitzen.

Ein Legacy-Helfer wie `corpCentralRezReserveNeeds`, der Reserve aus
`source.rezCost`, Kartendefinitionen oder allgemeinen Central-Floors ableitet,
hat im Zielzustand keine eigene Architekturrolle. Er wird entweder in den
quotierten Need des globalen Defense-Plans überführt oder entfernt. Ein
unvollständiger Quote erzeugt keinen geschätzten Reservewert; der betroffene
Need bleibt sichtbar blockiert.

Eine Rez-Entscheidung ist ein fenstergebundener Urgent-Response-Modus
desselben Verteidigungsplans. Solange dieses Fenster offen ist, beschränkt es
die ausführbaren Defense-Steps auf passende Rez-Aktionen. Es erzeugt keinen
zweiten, gegen HQ-, R&D- oder Remote-Schutz konkurrierenden Verteidigungsplan.
Der Verteidigungsplan darf einen Scoring- oder Remoteplan präemptieren, aber
deren Zustand nicht vergessen.

Dasselbe `corp.defend_servers` besitzt die Aktivierung und den Pass im
bezahlten Encounter-Fenster. Die Engine bestimmt die Entscheidungsseite durch
ihre exklusiven LegalActions; die KI ergänzt keinen eigenen Prioritätswechsel.
Die aktuelle ETR-Ergänzung wird über `currentEncounterDefenseQuotes` an
Action-ID, Quell-ICE, Server, StateVersion und Kosten gebunden. Eine schon
offene harte ETR verhindert redundantes Bezahlen. Der Owner berücksichtigt
eine nicht bezahlbare sichtbare Breakroute oder einen mindestens gleichwertigen
sichtbaren Ressourcenverlust; einen billigeren Break lässt er passieren.
Unvollständige Austauschquoten begründen keine erfundene Stop- oder Taxwirkung.
Ein fehlender beziehungsweise falsch gebundener Quote scheitert strukturiert.
Der Pass ist eine ausdrückliche Engine-Action desselben Plans, kein Fallback.

`decline_rez` wird nur dann als unproduktiv zurückgewiesen, wenn derselbe
Defense-Modus eine exakte, aktuell produktive Rez-Action als Route
materialisiert. Gibt es keine solche Rez-Route, ist Decline die regelkonforme
fenstergebundene Entscheidung und darf nicht durch eine bloße
Rez-Kartenfamilie oder einen allgemeinen Defensebedarf verdrängt werden.

Eine vollständige Enginequote mit ausschließlich zukünftigen
Encounter-Effekten begründet am innersten ICE keinen aktuellen Rez-Nutzen.
Der qualitative Rez-Consumer prüft diesen fehlenden Folgezustand, bevor
allgemeine Tax-/Disruption-Signale die Route freigeben. Zusätzliche sofortige
Wirkungen und quotierte bezahlte Encounter-Abwehr bleiben eigenständig
bewertbar; eine noch vorhandene innere ICE-Schicht bleibt ein mögliches Ziel.

Konditionale Rez-Supportkarten benötigen einen kartenspezifischen
Folgevertrag. Chester Mix darf nur gerezzt werden, wenn bereits vor dem Rezzen
genau eine produktive ICE-Installation am selben Fort feststeht, der Discount
tatsächlich Kosten spart und die globale Placement-/Rezreserve-Bewertung
positiv bleibt. Rez und Installation bilden eine `locked_sequence`. Nach dem
State-Wechsel wird die neue LegalAction über gebundene ICE-Instanz und Fort
erneut exakt materialisiert; verschwindet diese Fortsetzung, entsteht
`commitment_invalidated` statt einer anderen ICE- oder Serverroute.

Gemeinsame Hint-Begriffe rechtfertigen keine gemeinsame Rez-Heuristik.
Dr. Dreff wird nur im letzten relevanten Begegnungsfenster desselben Forts
produktiv, wenn sichtbares HQ-ICE unter seinem eigenen Halb-Rez-Kostenvertrag
bezahlbar ist. Jenny Jett besitzt einen getrennten Vertrag: aktueller Run am
eigenen Fort sowie Finanzierung ihrer Rez-Kosten und der aktuellen
fortabhängigen ICE-Installationskosten. Dr.-Dreff-Kostenregeln dürfen nicht
auf Jenny übertragen werden; weitere Karten derselben groben Effektfamilie
benötigen ebenfalls ein eigenes Modell.

Die nachfolgende Dr.-Dreff-Choice bleibt an `corp.defend_servers` gebunden.
Die Engine liefert zu jedem angebotenen HQ-ICE die effektiven
Subroutinentypen seines temporären Encounters und kennzeichnet zusätzliche
mechanische Effektfamilien. Die AI-DTO erhält diese privaten Choice-Facts.
Der Defense-Owner verwirft ausschließlich Optionen ohne aktuelle Wirkung:
Leere oder reine Zukunfts-Subroutinen ohne zusätzliche Mechanik können nach
dem letzten ICE nichts mehr bewirken. Sind alle Optionen so eingeordnet,
bindet der Owner die legale `decline`-Option. Gemischter sofortiger Schaden,
ETR und zusätzliche Mechaniken bleiben bewertbar. Fehlende Facts scheitern
strukturiert; der Payload-Resolver vervollständigt nur die gewählte Option.

Öffentlich aufgelöste Breaksperren werden getrennt als
`nextEncounterNoBreakSubroutines` und `noBreakSubroutinesActive` von der Engine
in die PlayerView und AI-DTO projiziert. Die gemeinsame sichtbare
Schadensbewertung darf beim exakt betroffenen nächsten beziehungsweise
aktuellen ICE keinen verbotenen Break als Schadensvermeidung anrechnen.
Der bestehende `runner.convert_run_window`-Owner bindet bei tödlichem Schaden
die vorhandene Jack-out-Action. Eine noch nicht verbrauchte nächste Sperre
wird weder auf das aktuelle ICE noch auf ein Engine-zertifiziertes Auto-Pass
übertragen; echte Schadensprävention bleibt unabhängig wirksam.

#### Ownership zwischen Score, Remote und Defense

| Verantwortung                                                                                             | fachlicher Owner                              |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Agendaquelle, Install/Advance/Score und Scoredeadline                                                     | `corp.score_agenda`                           |
| langfristige Nutzbarkeit und Wiederverwendung eines Remotes                                               | `corp.establish_scoring_remote`               |
| globale ICE-Allokation, ICE-Installation, Schutzbewertung, Rez-Entscheidung und allgemeine Central-Floors | `corp.defend_servers`                         |
| konkrete Härtung für einen Score- oder Remote-Parent                                                      | typisierter Defense-Supportbedarf des Parents |
| einmalige Opening-Basis ohne bestehendes Zielprojekt                                                      | `corp.opening_and_board_foundation`           |

Eine ICE-Installation kann mehreren Plänen nutzen, besitzt aber immer
`corp.defend_servers` als ausführenden fachlichen Owner. Score-, Remote- und
Opening-Pläne veröffentlichen dafür typisierte Schutzbedarfe; sie
installieren ICE nicht selbst. Mehrplannutzen bleibt ein weicher
Allokationsbeitrag innerhalb des globalen Verteidigungsplans und kein
separates Ownership- oder Override-Recht.

## 5. `corp.respond_to_virus_pressure`

**Klasse:** `urgent_response` oder `bounded_sequence`
**Rolle:** Vordergrund/Urgent Response
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- sichtbare Virusbedrohung und erwartete nächste Konversion bewerten;
- Regelkosten und Opportunity Cost eines Purges bestimmen;
- eingeschränkte oder aufgegebene Action Capacity korrekt reservieren;
- Purge gegen Score, Remote-Härtung, Economy und Terminalpfade vergleichen;
- nach Wirkung zum vorherigen Root-Foreground zurückkehren.

Der Purge folgt der aktuellen Engine-LegalAction samt Action-Debt-Quote.
Das Modul erzeugt keine eigene Purge-Legalität. Die Nutzenbewertung trennt
Counter-Zahl von Effekt: Ein einzelner Pipe-Counter verursacht bereits
wiederkehrenden Aktionsverlust. Dessen Beseitigung wird gegen die Purge-Kosten
über einen begrenzten Horizont von höchstens vier verbleibenden Corp-Zügen
bewertet; die bekannte Pflichtziehrate begrenzt den Horizont zusätzlich.
Ein positiver dauerhafter Aktionsverlust wird dem bestehenden Virus-Owner als
kritischer Druck gemeldet. Sofortige Score-Konversion und eine zu kurze
Restlaufzeit bleiben Gegenargumente, ohne den Counter als wirkungslos zu
klassifizieren.

## 6. `corp.economy`

Die Liquidation einer Engine-gequoteten Counter-Bank respektiert den aktuell
revalidierten Score-Decoy-Claim auf genau derselben verdeckten Instanz und
demselben Server. Ein aufgestellter Bluff wird nicht allein wegen fehlender
Remote-Sicherheit sofort aufgedeckt und ausgezahlt. Bereits aufgedeckte Banken
und echte Agenda-Handoffs behalten ihre jeweiligen Score-Routen. Die Ambush-
Signale werden einmal erzeugt und den betroffenen Ownern gemeinsam übergeben.

**Klasse:** `bounded_sequence`, `recurring_cycle` oder
`development_project`
**Rolle:** Support/Vordergrund/Background
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Interne Modi:

```text
fund_parent_need
fund_rez_reserve
fund_score_route
fund_punish_route
develop_finite_economy
drain_finite_economy
activate_persistent_economy
build_bank
cash_out_bank
```

`fund_rez_reserve` ist ausschließlich Economy-Support für einen exakten,
Engine-gequoteten Defense-/Score-/Remote-Parent-Need. Der Modus erzeugt weder
eine allgemeine Central-Reserve noch eigene Defense-Ownership.

Die Suche nach fehlender zentraler ICE prüft auch die exakt erreichbare
Basic-Credit-Finanzierung bereits installierter ICE. Eine aktuelle vollständige
Rez-Quote und bekannte wirksame Schutzprojektion unterscheiden fehlende
Liquidität von fehlender ICE. Reichen die verbleibenden legalen Credit-Aktionen
für den Schutz, erzeugt Defense keinen spekulativen ICE-Suchbedarf; abgelaufene
Quotes oder unzureichende Mittel unterdrücken die Suche nicht.

Das Modul kennt:

- verbleibende Nutzungen und Amortisation;
- Installations- und Rez-Kosten;
- Zugcadence;
- Credits bis zur konkreten Score-, Rez- oder Punish-Konversion;
- alternative sinnvolle Boardentwicklung;
- Risiko eines wertlosen Economy-Remotes.

Eine begrenzte Economy-Quelle darf als eigenes
`develop_finite_economy`-Projekt beginnen, wenn der vollständige, begrenzte
Payback nach Installations-, Rez- und Aktionskosten strikt positiv ist. Ein
kleiner sicherer Nettovorteil wird nicht durch eine zusätzliche pauschale
Mindestmarge verworfen; Score-Reserve, Remote-Belegung und höher priorisierte
Parent-Needs bleiben dennoch bindende Gegenargumente. BBS Whispering Campaign
ist dafür ein Referenzfall und bleibt vollständig im Owner `corp.economy`.

Eine Economy-Installation darf ihren späteren Rez nicht mit den erst danach
verfügbaren Auszahlungen finanzieren. Die aktuelle Liquidität muss den
bekannten Aufbau einschließlich Rez decken. Die Schutzbewertung bleibt beim
Defense-Owner: Ein aktuell nicht angreifbarer Remote erlaubt den begrenzten
Mehrzugshorizont, andernfalls zählt bei klickpflichtigen Guthaben nur die
aktuelle Auszahlungskapazität. Ein letzter Teilbetrag zählt als eigene
Auszahlung; die Summe darf den verbleibenden Pool nie überschreiten.

Bei einer aktuell legalen, kostenlosen Entnahme aus einem sichtbaren
Credit-Pool liefert der Economy-Owner zusätzlich den risikobegrenzten
Restkampagnenwert nach Aktionskosten. Plan-Assessment und Step vergleichen
diesen Wert statt nur den nächsten Bruttobetrag. Jede ausgeführte Entnahme
bleibt an die aktuelle Engine-Action gebunden und wird danach neu bewertet.
Die Projektion reserviert keine künftigen Klicks und erzwingt kein vollständiges
Leeren; andere Ziele dürfen die Folge unterbrechen. Eine rentable Installation
ist damit zugelassen, gewinnt aber nicht automatisch gegen einen konkreten
Defense-Suchbedarf, Scoring oder andere Defense-Maßnahmen.

Wiederholte Nutzung ist zulässig, solange sie das Fundingziel real
voranbringt. Nach erreichter Zielreserve muss das Modul dem finanzierten
strategischen Plan die Ausführung überlassen.

Ein persistenter Fundingbedarf dedupliziert nach Parent-Planinstanz,
Parent-Need, absolutem `targetCredits` und fachlicher Demand-Revision. Seine
Zielhöhe stammt aus der gebundenen Score-, Remote-, Defense-, Operation- oder
Reserveanforderung und bleibt bei unverändertem Consumer und Boardzustand
zugübergreifend stabil. Insbesondere ist `currentCredits + remainingClicks`
keine strategische Zielbasis; ein erreichtes Ziel wird nicht allein wegen
gestiegener Credits wieder eröffnet.

Basic Credit darf als Parentfortschritt nur gelten, wenn der exakt gebundene
Need danach kleiner ist. Eine fachlich ungebundene Restkapazitätsverwertung
bleibt als eigener, niedrigster, zugbegrenzter P6-Modus zulässig. Sie erzeugt
keinen mehrzügigen Economy-Parent, setzt kein erreichtes Ziel zurück,
behauptet keinen Fortschritt für Score, Remote oder Defense und darf keinen
blockierten Vordergrundplan oder fehlenden Provider verdecken.

## 7. `corp.punish_campaign`

**Klasse:** `strategic_campaign` oder `development_project`
**Rolle:** dormant/Background/Vordergrund
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- aus Deckstrategie ableiten, welche Tag-, Trace-, Credit-Denial- und
  Damage-Linien belastbar getragen werden;
- benötigte Komponenten und Reihenfolge verwalten;
- gegnerische Triggerbedingungen beobachten;
- Credits und Handkartenquellen reservieren;
- zwischen bloßem Druck, wirtschaftlicher Bestrafung und Lethal unterscheiden;
- auf ein ausführbares Punish-Fenster warten.

Beispielzustand:

```text
strategy: tag_and_bag
tag_source: Chance Observation
damage_sources: Urban Renewal + Scorched Earth
required_credits: 11
required_clicks: 3
trigger: runner_attempted_run_last_turn
runner_grip: 5
projected_damage: 9
viability: dormant
```

Der Plan darf über mehrere Züge bestehen, während Scoring oder Economy den
Vordergrund übernimmt.

Der Normalzustand dieser Kampagne ist ein lauerndes `watch_window`, kein aktiv
abzuarbeitender Komponentenaufbau. Fehlende Damage-, Tag- oder
Trace-Komponenten sind beobachtete Kampagnenfakten, aber noch keine offenen
Action-Needs. Insbesondere erzeugt die Kampagne keinen wiederholten
Targeted-Basic-Draw. Sie wird bei relevanten Änderungen an eigener Hand,
öffentlichem Runnerzustand, Triggern, Credits oder Klicks neu bewertet und
übernimmt erst dann den Vordergrund, wenn eine ausreichend vollständige Route
das Opportunity-Gate erreicht.

Die ausgewählte Route ist variabel. Sie verwendet nur so viele aktuell
vorhandene Komponenten, wie nach Runner-Handzahl und sichtbarer Prävention
notwendig sind. Vier sicher wirksame Damage sind bei drei Runner-Handkarten
lethal; bei vier Handkarten sind exakt vier Damage noch keine Flatline. Ein
zusätzlicher Damage-Step darf daher weder pauschal verlangt noch unnötig
ausgeführt werden.

Der erste produktive Stand muss nicht jede Punish-Kartenfamilie optimal
beherrschen. Abnahmeziel ist ein repräsentativer vertikaler Slice, der
Opportunity-Root, variable Route, Engine-Quote, Parent-Support,
Schedulerübergabe und Requote-Continuation vollständig durchläuft. Noch nicht
unterstützte Capabilities bleiben explizit unknown und fail-closed. Weitere
Karten, Reaktionszweige und Bewertungsbedingungen werden iterativ über
konkrete Spielsituationen und Szenarioverträge innerhalb des Moduls ergänzt,
ohne den gemeinsamen Planmodul- oder Schedulervertrag zu verändern.

Tag-Druck, Credit-Denial und Damage bleiben zunächst Modi dieser gemeinsamen
Kampagne. Das Modul priorisiert seine internen Linien selbst. Eine spätere
Trennung ist nur nötig, wenn Spiel-Evidence zeigt, dass ihre Lebenszyklen und
Fortschrittsbegriffe nicht mehr sinnvoll gemeinsam modellierbar sind.

## 8. `corp.execute_punish_sequence`

**Klasse:** `bounded_sequence`
**Rolle:** P1-/P3-Vordergrund; Kind von `corp.punish_campaign`
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Mögliche Phasen:

```text
validate_trigger
apply_tag_or_trace
win_or_price_trace
apply_credit_denial
apply_damage
confirm_lethal_or_complete
```

Vor Beginn wird die ganze Route geprüft:

- Kosten und Klicks;
- Trace-Garantie oder erwartete Gebote;
- Tagbedingung;
- Runner-Handpuffer;
- Damage-Summe und Prävention;
- legale Reihenfolge.

Ein Funding-Step wird nur geöffnet, wenn sein Klick und die gesamte
verbleibende Route noch in dasselbe gültige Punish-Fenster passen. Ein
langfristig fehlender Credit oder eine fehlende Karte rechtfertigt für sich
noch keine aktive Verfolgung der lauernden Kampagne.

Eine planfremde Aktion wie Closed Accounts darf eine weiterhin lethal
Drei-Aktionen-Flatline-Sequenz nicht aufbrechen.

## 9. `corp.ambush_and_bluff`

**Klasse:** `development_project` oder `bounded_sequence`
**Rolle:** Background/Vordergrund
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- deckstrategisch getragene Ambush-/Bluff-Remotes;
- Contestability statt pauschaler Überhärtung;
- Kosten-/Damage-/Trash-Payoff;
- Wiederverwendung oder Aufgabe nach Expose/Access;
- Abgrenzung zu echtem Scoring-Remote.

Ein unbekanntes Remote allein erzeugt keinen Bluffplan. Das eigene Deck und
die konkrete Hand müssen die Linie tragen.

Auch eine Ambush-Rolle, ein Hint oder eine legale Installation allein erzeugt
keine Planinstanz. Discovery verlangt einen expliziten aktuellen CorpIntent,
der `corp.ambush_bluff` trägt, sowie die konkrete Vorausplanung von
Karteninstanz, Zielserver und Sequenz. Ist eine Ambush-Installationsaktion
sichtbar, aber der erforderliche Intent-/Signalvertrag fehlt, schlägt die
Runtime als fehlende Planmodulabdeckung fail-closed fehl; sie erfindet weder
einen Rollenplan noch eine generische Entwicklung.

Jede ausführbare Ambush-Instanz bindet die konkrete sichtbare
Karteninstanz und die aktuellen `actionIds`. Owner und Materializer prüfen
bei vorhandenen IDs ausschließlich diese Route; eine zweite Kopie derselben
Definition am selben Server ist ein eigener Plan und keine austauschbare
Geschwisteraktion. Install-, Advance- und Trigger-Phasen behalten dieselbe
Instanzidentität. Nach jedem State-Wechsel werden nur die dann legalen
Action-IDs neu entdeckt; eine fehlende kartenspezifische Phasensemantik darf
nicht durch Definition-, Server- oder Rollenfallbacks ersetzt werden.

Die access-zonenbezogene Vorbereitung ergänzt den bestehenden Ambush-Owner:
Eine eigene Asset-Quelle mit kostenlosem Self-Shuffle beim Rez und
R&D-Zugriffseffekt darf als exakt gebundene Install-/Rez-Folge auftreten.
Installation kostet weiterhin einen Klick. Die Planung behauptet keinen
Schaden am Remote. Ein verdeckter Köder darf für bestehendes ICE oder neben
einer finanzierbaren Drei-Advance-Agenda bis zu zwei Gegnerzügen liegen
bleiben; der gespeicherte Ablaufzeitpunkt wird bei erneuter Discovery nicht
verlängert. Bei knappem Deckrest wird früher zurückgemischt, bei einem Run
auf das Remote erst nach dem ICE-Abschnitt. Exponierte Identitäten tragen
keinen unbekannten Bluff. Score reserviert seine Server weiterhin selbst;
die Ambush-Vorbereitung darf sie nicht belegen. Zwei parallele Köder sind
nur mit der konkreten Agenda zulässig, ansonsten höchstens einer.

Das ist eine begrenzte Vorbereitung, keine nachgewiesene gegnerische
Lernreaktion und keine automatische Agenda-Installationsstrategie. Priorität
und Fortsetzung bleiben beim vorhandenen Scheduler und Planportfolio.

Bei bereits leerem R&D trägt eine aktuell legale kostenlose Install-/Rez-
Rückmischung einen zustandsgebundenen `irreversible_threat`-Nachweis (P2).
Der vorhandene Ambush-Parent und sein Setup-Schritt behandeln die drohende
Pflichtzieh-Niederlage damit vor gewöhnlicher Score-Finanzierung. Der Nachweis
bindet aktuelle StateVersion, Quellinstanz und LegalAction und entfällt nach
dem Auffüllen. Das ist kein allgemeiner Kartenbonus oder garantierter Sieg:
Zusätzliche spätere Zieheffekte und neue Runnerzugriffe bleiben gesonderte
Risiken. Der Setup-Bedarf hat hier die Frist `current_turn`.

Die Remote-Auswahl konsumiert einen typisierten, von `corp.defend_servers`
bewerteten Bluff-Defense-Bedarf statt der bloßen ICE-Anzahl. Eine einzelne
optionale ICE-Schicht besitzt einen aktuellen Kosten-/Effektnachweis,
unterscheidet bezahlbaren Zugriff von sichtbarem Stop und berücksichtigt eine
separat gequotete bezahlte Encounter-Fähigkeit. Ein vorhandener Score-Reserve-
Bedarf bleibt erhalten. Eine noch fehlende Finanzierung ist auf höchstens
drei Credits begrenzt; Economy bindet diesen Bedarf an den Ambush-Parent und
seine aktuelle Phase. Die Installation beginnt nicht vor Erfüllung dieses
Budgets. Im Run revalidiert allein Defense ICE-Rez und Encounter-Ausgaben;
ein Stop zählt nicht als tatsächlich gezahlte Breakkosten.

Runs auf andere Server lösen einen noch verdeckt zu haltenden Köder nicht
auf. Ein bereits angefangener Agenda-Fortschritt darf den verbleibenden
Drei-Advance-Horizont tragen. Am Ende des ICE-Pfads bleibt das kostenlose
Zurückmischen eine eigene aktuelle Ambush-Aktion. `decline_rez` schließt ein
Engine-Fenster und ist eine `engine_continuation`-Grenze der Zugprojektion:
Der Planer darf danach keine weitere Aktion desselben alten Rez-Fensters
einplanen. Die tatsächliche Folgesituation wird neu beobachtet.

Eine bezahlbare Ambush-Installation unterdrückt einen Score-Finanzierungsbedarf
nur bei konkurrierender Bindung derselben Agenda-Instanz. Ein unabhängiger
Köder darf den Funding-Provider einer anderen Agenda nicht vor dem
Prioritätsvergleich aus der Discovery entfernen. Nach erfülltem exaktem
Finanzierungsziel darf die unabhängige Vorbereitung gegenüber bloßer
Restklick-Wirtschaft gewinnen.

Bezahlte Zugriffseffekte gehören ebenfalls diesem Owner. Die Engine kann für
eine ausschließlich auf installierte Runner-Icebreaker wirkende Counterfolge
bescheinigen, dass aktuell kein Ziel existiert. Diese negative Bescheinigung
steht nur in der Corp-Choice. Dieselbe Choice bindet ihre bereits im privaten
Prompt benannte Quelle über die vorhandenen Felder `sourceCardInstanceId`
und `sourceCardDefinitionId`. Der Plan konsumiert diese Bindung für jede
Zugriffszone. Die allgemeine R&D-Run-Ansicht bleibt unverändert verdeckt.
`false` behauptet weder Nutzen noch Optimalität.
Ambush lehnt eine so belegte wirkungslose Zahlung ab und bindet die Auswahl
an Quelle, Choice, StateVersion, Kosten, Bescheinigung und LegalAction. Andere
bezahlte Zugriffseffekte behalten ihre bisherige Aktivierung. Die Bewertung
ihres längerfristigen Nutzens bleibt eine gesonderte offene Aufgabe.
Der Window-Resolver besitzt keine eigene Zahlungsstrategie und darf nur die
exakte Auswahl des aktuellen Ambush-Executors vervollständigen. Fehlende oder
veraltete Bindungen scheitern fail-closed. Die menschliche Zahlung bleibt
regellegal; Engine-Ausführung und Zielprüfung bleiben unverändert maßgeblich.

## 10. `corp.hand_and_agenda_management`

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- Agenda-Flood und HQ-Exposition;
- sinnvollen Draw, Refresh, Recovery und Discard;
- Agenda in eine Scoreline überführen;
- überzählige Karten im Cleanup zweckgebunden priorisieren;
- Deckout-Risiko und notwendige R&D-Erholung.

Der bestehende Zielgebietsvergleich bewertet einen eigenen kostenlosen
Archives-Zugriffseffekt als Nutzen des Abwerfens. Diese Anpassung gilt nur
für das Ziel Archives; eine R&D-Rückführung bleibt separat bewertet. Cleanup
verwendet dieselbe Disposition, behält konkrete Parent-Bindungen und den
Schutz vor entscheidender Agenda-Exposition aber bei. Weder Installation noch
garantierter Zugriffsschaden werden aus einer Ambush-Rolle abgeleitet.

Das Modul darf Hidden-Info nur aus der eigenen HQ/R&D und öffentlichen
Ereignissen verwenden.

Die Scoreline misst den Deckrest nicht nur in Karten, sondern in vollständig
verbleibenden Corp-Drawfenstern. Maßgeblich ist die von der Engine öffentlich
bereitgestellte Zahl verpflichtender Karten pro Fenster. Im letzten noch
erreichbaren Matchpointfenster darf der gebundene Scoreplan die konkrete
Agenda-Install-/Advance-Linie gegenüber seiner gewöhnlichen vollständigen
Schutzreserve priorisieren; Agenda, Zielserver und Action bleiben an derselben
Planinstanz gebunden. Hat dieses belegte letzte Draw-Zeitfenster die
Installation zugelassen, bleibt dieselbe Frist bei jeder anschließenden
Advance-/Score-Phase des residenten Projekts erhalten, solange die gebundene
Linie noch vor dem fehlgeschlagenen Pflicht-Draw schließen kann. Eine
gewöhnliche erneute Schutzbedarfsprüfung darf das bereits zugelassene Projekt
nicht nach dem ersten Schritt in garantiertes Deckout-Abwarten überführen.

Ein bereits zertifiziertes Deckout-Scorefenster bleibt auch gegenüber der
gewöhnlichen Mindestzahl an ICE nahe dem gegnerischen Matchpoint gültig.
Dies gilt für das letzte Matchpointfenster, die gebundene Agenda-Rückführung
und den bestehenden Agenda-Flood-Deckoutpfad. Außerhalb dieser Fenster bleibt
die normale Remote-Reifeprüfung bestehen; die Prioritätswahl erfolgt weiter
im Scheduler aus den zugelassenen Planrouten.

Der aktuelle Agenda-Flood-Deckoutdruck gilt gleichermaßen für Installation
und Fortschritt bereits installierter Agenden. Ausreichender Remote-Schutz
hebt diese Frist nicht auf: Sonst verdrängt jedes neue Installationsprojekt
mit P3 die geschützte Advance-Fortsetzung mit P4, obwohl letztere den
früheren Abschluss ermöglicht. Die vorhandenen Feasibility- und
Prioritätsverträge bleiben die Entscheidungsautorität.

Für die Agenda-Installation im letzten Drawfenster veröffentlicht der
Score-Owner einen P2-Überlebensnachweis, wenn die konkrete Agenda den Sieg
erreicht und die aktuelle, an Karte, Server und StateVersion gebundene
Engine-Horizontquote den Abschluss spätestens im nächsten Corp-Zug bestätigt.
Eine allgemeine Frist oder bloß genügend verbleibende Agendapunkte reicht
dafür nicht. So verbraucht eine konkurrierende Rez-Finanzierung nicht die
für diese letzte Linie zwingend benötigten Klicks. Die folgenden Advance-
Phasen behalten ihren bestehenden Fristvertrag und werden aus dem neuen
Zustand erneut bewertet; der Installationsnachweis wird nicht blind vererbt.

Ungewöhnliche Midgame-Utility-, Action-Engine- oder Boardtransformationskarten
werden zuerst bestehenden Domainplänen als Route oder Admission-geprüfte
kartenbezogene Instanz zugeordnet. Ein breiter
`corp.safe_generic_development`-Plan ist kein akzeptierter Dauerauffang. Falls
diese Zuordnung wiederholt scheitert, wird daraus anhand konkreter
Spielevidence ein enger Corp-Entwicklungsdomainvertrag geschnitten.

## 11. Kein Corp-Fallbackplan

Wie beim Runner wird weder ein freier globaler Actionsieger noch ein
generischer Ersatzplan verwendet. `corp.economy` handelt nur für eine endliche
Reserve, einen konkreten Parent-Fundingbedarf oder eine vollständig
entwickelte Economy-Engine. `corp.hand_and_agenda_management` handelt nur für
einen belegten Draw-, Refresh-, Agenda- oder Overflow-Zweck.

`raise_visible_floor` benötigt Defense-Evidence; allgemeine Boardentwicklung
benötigt ein Domainmodul. Fehlt die Planabdeckung, wird dies nicht durch
Credit, Draw oder Boardentwicklung verdeckt.

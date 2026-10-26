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

Das Deckstrategieprofil übernimmt `score.fast_advance_support` aus den
aktuellen kanonischen Kartenhints in den Scorebeschleunigungswert sowie die
Supportnachweise für Fast Advance, Scoreplan und Advancement-Fenster. Ein
vorhandener Countertransfer oder eine Counterplatzierung darf nicht allein
wegen älterer Signalnamen als fehlende Unterstützung erscheinen. Diese
statische Kapazität ist keine aktuelle Aktionszulassung: Verbraucher,
Counterquelle, Kosten und Frist prüft weiterhin der konkrete Score-Owner.

Die Schutzbewertung für den nächsten Runnerzug berücksichtigt neben liquiden
Credits die öffentlich gespeicherten, dann auszahlbaren Credits. Die Engine
ermittelt aus kanonischen Fähigkeiten den maximalen garantierten Ertrag in
den vor dem Run verfügbaren Aktionen: Eine Auszahlung ersetzt einen
Basiseinkommensklick, jede Quelle wird höchstens einmal genutzt. Verdeckte
Handkarten, zukünftige Ladungen und während eines laufenden Runs nicht
ausführbare Auszahlungen gehören nicht zu diesem Budget. Schutzquote,
finanzierte Installationsroute, Zentralreserve und Reifezertifikat verwenden
denselben Zukunftshorizont; ein laufender Run behält sein aktuelles Budget.

HQ-Agendaexposition macht die Installation dringlich, reserviert jedoch nicht
alle späteren Advances als harte Aktionen dieses Zuges. Nur die tatsächliche
Abschlussfrist `last_draw_window` oder `current_turn_only` bindet diese gesamte
Aktionsfolge sofort. Der konkrete Schutzparent darf deshalb erst wirksame ICE
installieren, während Credits für den mehrzügigen Score weiter reserviert
bleiben. Echte Abschlussfristen werden dadurch nicht verschoben.

Der Score-Owner veröffentlicht die aktuelle Install-/Advance-Zulassung als
typisiertes `routeAssessment`. Schutzreife, unbekannte Schutzbewertung und
zurückgestellte letzte Installationsklicks werden daraus gelesen; Evidence
erklärt denselben Zustand. Funding-, Rush- und Parent-Dominanzübergänge
aktualisieren den fachlichen Zustand ausdrücklich. Ein exakter Same-Turn-
Konversionspfad trägt zusätzlich `sameTurnConversionProof: engine_quoted_path`
aus dem bestehenden Engine-gequoteten Pfad. Projektvergleich und
Zusammenführung lesen diesen Nachweis und die gebundenen Routenfakten,
niemals Evidence-Präfixe oder die Gleichheit von Erklärungstexten.

Die Konversionssuche darf eine reine, unbedingte Advancement-Aktivierung mit
positiven Aktionskosten und ausschließlich festen Aktions-/Creditkosten
mehrfach verwenden, wenn die Engine ihre Wiederholbarkeit ausdrücklich
projiziert. Eine notwendige Rez-Vorbereitung wird einmal bezahlt; jede
Aktivierung verbraucht erneut ihre vollständigen Kosten. Bei unrezztem
installiertem Support gilt dieselbe enge mechanische Prüfung aus der
kanonischen Engine-Projektion; Fähigkeiten mit Limits sind ausgeschlossen.
Operationen und nicht ausdrücklich wiederholbare Fähigkeiten bleiben
einmalige Ressourcen. Der Pool bereits verfügbarer Quellen erfasst auch die
Quellinstanz der nativen LegalAction. Dieselbe Handoperation darf nicht
zusätzlich als prospektive Operation erzeugt werden, wenn ihr natives
Capability kein separates `sourceCardId` trägt. Echte weitere Kartenkopien
behalten ihre eigenen Quellen; ausdrücklich wiederholbare installierte
Aktivierungen behalten ihre Wiederholbarkeit. Paarung 544, Runde 4, G11 D60
belegt die doppelt geplante Systematic-Layoffs-Kopie und die dadurch unmögliche
Retreat-Konversion; native und echte Engine-Gegenfälle sichern Quellenzahl,
knappe Finanzierung und den bereits installierten Scoreverbraucher.
Ziel, Root, Executor, StateVersion und jede folgende
Choice werden vor jedem nativen Schritt erneut gebunden. Der Nachweis aus
Paarung 492, Diagnose-Runde 2, G26 D299 umfasst zwei Aktivierungen auf derselben
Agenda; ein Root-Austausch darf die dafür nötige Supportkarte nicht zerstören.

Wenn dieselbe aktuelle Beschleunigungsaktion mehrere gequotete Agenden
bedienen kann, veröffentlicht die Score-Discovery alle an diese Aktion
gebundenen Agenda-/Server-Parents. Sie wählt nicht vor der fachlichen
Zusammenführung nur einen Zielparent und verliert dadurch die übrigen
Konversionsanfänge. Die bestehende Zusammenführung und Ressourcenprüfung
vergleichen anschließend die vollständigen Parents; jede Ausführung bindet
weiter genau eine aktuelle LegalAction und ihre Choices. Aktionsklassifikation
und Materialisierung erhalten damit dieselben gequoteten Konversionsfakten.

Nach der Asseterhaltungsprüfung verdrängt eine vollständig gequotete,
ausführbare Konversion einer HQ-Agenda in einem vorbereiteten Remote auch
die entsprechende Konversionsvariante in einem neu zu eröffnenden Remote.
Diese bereits für direkte Installationen geltende Zielbindung wird damit
auch vor einem gemeinsamen Beschleunigungsschritt erhalten. Andere
Zielagenden bleiben verfügbar; ein zur Asseterhaltung benötigter neuer
Remote wird nicht verdrängt.

Vor dem Erhalt einer vorbereiteten Agenda-/Remotebindung vergleicht der
Score-Owner bereits zugelassene terminale HQ-Agendas für denselben Remote.
Eine mit aktueller Engine-Horizontquote früher abschließbare Agenda verdrängt
die langsamere Vorbereitung nur bei höchstens gleichen Installations- und
Scorekosten, ohne zusätzliche Steal-Punkte oder höheres Zugriffsrisiko und
mit vollständiger Score-/Defense-Finanzierung. Defense-Punktkosten dürfen
den terminalen Score nicht aufheben. Bei unquantifiziertem Schutz gilt der
Vergleich ausschließlich für dieselbe vollständig gerezzte Topologie,
nichtterminale gegnerische Steals und bereits zugelassene, bezahlbare Routen;
er zertifiziert den Schutz nicht nachträglich. Unterschiedliche Remotes,
blockierte Routen, nichtterminale Ziele und installierte Agendas erhalten
dadurch keine neue Zulassung. Die verdrängte Vorbereitung veröffentlicht
`corp_shorter_terminal_score_route_dominates` und beansprucht keine weitere
Score-Finanzierung. Plan-, Step-, Route- und Zugbindungsprüfung bleiben beim
bestehenden Score-Owner und Scheduler.

Die gleichzügige Scorekonversion verwendet für sichtbare Bonuspunktagendas
unter dem bestehenden `corp.score_agenda`-Parent eine reine Enginequote des
Punktwerts nach den geplanten Advances. Engineeffekt und Quote teilen die
Bonusberechnung; effektive sichtbare Schwierigkeit und Counterziel bleiben
explizit gebunden. Der kleinste siegbringende Counterstand darf auch mehrere
Bonusschwellen umfassen. Quote und Pfad sind keine neue Legalitätsautorität:
Klicks, Credits, Quelle und aktueller erster Advance müssen vollständig
finanziert und an die echte LegalAction gebunden sein.

Eine solche belegte terminale Folge darf beim Zusammenführen desselben
Agendaprojekts nicht durch dessen nichtterminalen Basisscore verdrängt werden.
Der Score-Owner klassifiziert den verdrängten Sofortscore ausdrücklich.
Ein bereits siegbringender Sofortscore behält den kürzeren Abschluss; ein
nichtterminaler Zusatzpunkt rechtfertigt im selben Projekt keine zusätzlichen
Kosten vor dem direkten Score. Unterschiedliche Agendas behalten außerhalb
terminaler Siege ihren Punktvergleich. Fehlende Definitionen oder ungültige
Enginequotes brechen mit strukturierter Ursache ab. Paarung 556 R1 G31 D430
belegt bei fünf Punkten Babylon mit drei Countern und zwei verfügbaren
Klicks/Credits: zwei Advances und Score ergeben sieben Punkte; der frühere
Sofortscore ergab nur sechs.

Innerhalb bereits zugelassener terminaler Scoreprojekte bewertet der
Score-Owner den Sieg mit einheitlichem Punktnutzen. Überzählige Agendapunkte
und Strategieunterstützung für Züge nach dem Spielende erhöhen diesen Wert
nicht. Verbleibende Advance-Aktionen, Credits, gebundener Fortschritt und die
aktuelle Expositionsbewertung bleiben wirksam. Die Regel ändert weder
Zulassung, Prioritätsklasse noch Schutz- oder Finanzierungsnachweise. Vor
dem Matchpoint behalten Agendapunkte und spätere Strategieunterstützung
ihren Wert. Der native Nachweis aus Paarung 553, Diagnose-Runde 3, G22 D424
vergleicht bei sechs Punkten dieselbe Remote mit einer Drei- und einer
Fünf-Advance-Siegesagenda; die langsamere Route darf keinen Zusatznutzen aus
ihren überzähligen Punkten ziehen. Derselbe Score-Owner veröffentlicht diesen
Punktnutzen und die verbleibende Aktions-/Creditbelastung auch in seiner
Agenda-Zuglinie; die autoritative Restzugsuche darf die Kosten nicht wieder
verlieren. Eine gespeicherte bereits gewählte Parentbindung wird dadurch
nicht nachträglich als sicher dominiert behauptet.

Eine Matchpointagenda darf auch auf dem letzten Klick installiert werden,
wenn die aktuelle, exakt an Agenda und Zielserver gebundene Engine-Quote den
Abschluss im nächsten Corp-Zug bestätigt und der Defense-Owner bereits
finanzierten Schutz unter Erhalt der vollständigen Score-Creditreserve
zertifiziert. Der gequotete Agendapunktestand nach der Defense muss zusammen
mit dem Score weiterhin zum Sieg reichen. Fehlende oder veraltete Quotes,
unzureichende nächste Action Capacity, fehlende Finanzierung und ein durch
Rez-Punktkosten verlorener Matchpoint öffnen diese Zulassung nicht. Das ist
eine reguläre Fortentwicklung desselben Score-Parents; der nächste Zustand
wird nach Installation und Gegnerzug erneut validiert. Regression:
Paarung 475, Kontrollrunde 2, G20 D355.

Innerhalb derselben Prioritätsklasse bewertet der Score-Owner einen aktuell
ausführbaren Abschluss höher als bloßes Advancement unter Expositionsdruck.
Die Bedrohung einer zweiten Agenda rechtfertigt keine Verteilung der letzten
Klicks, durch die beide Abschlüsse ausfallen. Terminale Verlustvermeidung und
terminaler eigener Score behalten ihre gesonderten Prioritätsklassen; die
aktuelle Ressourcen- und Routenzulassung wird weiterhin vor jeder Aktion
revalidiert.

Auch bei einer beschleunigten Konversion stammen die verbleibenden
Advancement-Klicks und Score-Credits aus den Engine-gequoteten Folgeschritten.
Ein bereits nachgewiesener Abschluss macht diese Folgekosten nicht null.
Die Bewertung verwendet denselben Horizont nach der ersten Aktion wie bei
einem normalen Advance; ein vorgeschalteter Economy-Schritt behält seinen
vollständigen danach zu finanzierenden Scorebedarf.

Bei einer Agenda aus HQ stammt die benötigte Advancement-Zahl aus der
aktuellen Engine-Installationsquote für genau diese Agenda und diesen
Zielserver. Der sichtbare HQ-Wert enthält keinen lokalen Regionsrabatt.
Konversionssuche und direkte Scoreline-Prüfung lesen dieselbe Quote; fehlt
ihre Karten-, Server- oder StateVersion-Bindung, scheitert der Pfad mit einer
strukturierten Diagnose. Ein unvollständiger Folgeturn-Horizont entwertet
nicht die separat gequotete Schwierigkeit.

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

Eine bereits gefüllte Counterbank darf einen vollständig finanzierten Score
im aktuellen Corp-Zug auch dann bedienen, wenn ihr Remote im nächsten
Runner-Zug erreichbar wäre. Die Schutzprüfung bleibt Voraussetzung für den
Aufbau der Bank; sie darf den unmittelbar ausführbaren Verbrauch nicht
verwerfen. Eine installierte, mit derselben Bank abschließbare Agenda hat
Vorrang vor einer weiteren Installation, die dieselben Counter beansprucht.
Ausgenommen ist ein neuer sofortiger Spielsieg, wenn die vorhandenen Ziele
nicht terminal sind. Alle passenden installierten Ziele werden mit ihrer
konkreten Karten- und Serverbindung dem Score-Owner angeboten; seine normale
Priorisierung wählt den Abschluss. Vollständig avancierte Agenden beanspruchen
keine Bankcounter (Regressionen: Paarung 461, Runde 5, G10 D139 und G40 D203).

Ein installierter Counterbank-Scoreverbraucher steht im Root eines anderen
Remote-Servers. Sichtbare Agenden in Zentralzonen, insbesondere in Archives,
sind keine installierten Transfer- oder Scoreziele. Die Root-Darstellung einer
Zentralzone ersetzt diesen Nachweis nicht (Paarung 482, Runde 1, G20 D378).

Der Aufbau einer Counterbank bewahrt bereits finanzierte zentrale
Verteidigungsreserven. Der Score-Owner vergleicht dafür die exakten aktuellen
Advance-Kosten mit den vorhandenen Defense-Facts für Schutz und terminale
Tax-/Schadenswirkung. Ein zukünftiges Investment darf einen gerade durch
Counterauszahlung erreichten Rezbedarf nicht sofort wieder öffnen. Der
Defense-Owner darf die aktuelle Auszahlung weiterhin anfordern; vollständige
aktuelle Agenda-Konversionen behalten ihre eigene Zulassung und Priorität.
Damit entsteht weder eine feste Counterzahl noch ein eigener Chooser
(Regression: Paarung 547, Runde 1, G5 D315–320; positive Aufbau- und
Konversionsköpfe G1 D265/D275).

Jede gewählte Advancement-Verteilung trägt vor der Operation ihre vollständige
Ziel-/Mengenbindung aus dem gewählten Scorepfad. Das gilt auch für zwei Counter
auf nur eine Agenda. Die folgende Choice gleicht ausschließlich diese Verteilung
mit den aktuellen Optionen ab; sie darf keinen Counter auf eine andere fast
fertige Agenda umleiten. Fehlt die Verteilung im Parent oder in seiner
Continuation, scheitert der Pfad mit `window_origin_missing` (Paarung 547,
Runde 1, G12 D175/D176).

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

Die Klassifizierung eines normalen Advances prüft Konversionspfade mit
denselben aktuellen Funding-Kandidaten wie die Score-Discovery. Ersetzt eine
vollständig gequotete Konversion mit Economy-Präfix diesen Advance, bleibt
er unter dem Score-Owner ausdrücklich bis zum gebundenen ersten Schritt
zurückgestellt. Eine Prüfung ohne Funding-Eingaben darf die bereits
nachgewiesene Linie nicht verlieren und dadurch eine ownerlose LegalAction
erzeugen (Regression: Paarung 425, D196).

Auch eine Next-Turn-Fortsetzung ohne bisherige `actionIds` bindet bei der
terminalen Agenda-Schutzprüfung die aktuell validierte Advance-Action.
Verbraucht dieser Advance die letzte erforderliche Rezreserve, bleibt er
unter `corp.score_agenda` ausdrücklich zurückgestellt. Ein bereits vollständig
finanzierter Schutz mit Funding-Gap null macht den Advance nicht ownerlos;
nur der verfügbare Überschuss darf Fortschritt finanzieren (Paarung 458, D304).

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

Bei gleichwertigen, bereits im aktuellen Zug vollständig ausführbaren
Scorepfaden vergleicht der Konversionsdienst die vollständigen Creditkosten
vor der Schrittzahl. Ein kürzerer Beschleunigungspfad darf keinen günstigeren
finanzierten Abschluss allein wegen seiner geringeren Schrittzahl verdrängen.
Bei gleichen Creditkosten bleibt die kürzere Folge vorrangig; unnötige
Action-Capacity-Quellen werden dadurch nicht verbraucht. Passt der normale
Pfad nicht in den aktuellen Klickhorizont, bleibt eine legal finanzierte
Beschleunigung regulär möglich. Paarung 489, Spiel 10, D129 belegt zwei
gequotete normale Advances statt einer zehn Credits teuren Beschleunigung
unter demselben Agenda-Parent.

Auch eine aktuell legale, regelbasierte Ressourcenumwandlung, die unmittelbar
Agendapunkte erzeugt, gehört als `convert_agenda`-Step diesem Owner. Ihr
Vertrag stammt vollständig aus derselben LegalAction: Quellregel, positive
Punktwirkung, aktive Verpflichtung, Credits, Klicks und StateVersion müssen
exakt gebunden sein. Der Plan darf weder Kartentext noch historische Kosten
rekonstruieren; ein unvollständiger Quote blockiert den Step fail-closed.
Auch diese Konversion veröffentlicht `sameTurnConversionProof`, den exakten
Credit-/Klickaufwand und den verbleibenden Credithorizont aus derselben
LegalAction. Dadurch durchläuft eine nichtterminale Verpflichtungsrückzahlung
die vorhandene gemeinsame Score-/Defense-Admission. Fehlt ein Credit zur
Schutzreserve, finanziert ein noch verfügbarer Basiscredit unter demselben
Score-Parent zuerst diese Lücke. Eine terminale Konversion bleibt P1.
Paarung 522 belegt die zuvor fehlende Quotebindung; native Kontrollen sichern
Ablehnung unterhalb, Admission genau an der Reservegrenze, die gebundene
Fundingfolge und den terminalen Punktgewinn ab.

Installieren, Advancen und Scoren sind Phasen derselben exakten
`corp.score_agenda`-Instanz. Eine aktuell legale Advance-Action ist deshalb
kein unbekannter Score-Schutz und kein unabhängiger Entwicklungskandidat,
sondern die Fortentwicklung des gebundenen Agenda-Parents. Sie behält dessen
exakte Planinstanz, Agenda-Instanz, Ziel, aktuell revalidierte
Prioritätsklasse P1 bis P4 und Evidence. Ein von ihr angeforderter Defense-
oder Economy-Support bindet seinerseits exakt diese Score-Planinstanz als
`parentInstanceId`.

Die exklusive Restzug-Obligation `urgent-exact-score-owner` setzt zusätzlich
einen aktuell pflichtzahlungssicheren Score-Head voraus. Derselbe vorab
geprüfte Headbestand bestimmt sowohl das dringende Prioritätsband als auch
den exklusiven Owner-Anspruch. Ein Advance, der die verpflichtende
Endzahlungsreserve verbrauchen würde, darf nicht den noch ausführbaren
Economy-Support seines Score-Parents verdrängen. Finanzierte exakte
Score-Heads behalten ihren Vorrang. Paarung 536, Originalseed-Nachspiel
G27/D424, belegt diese Gegenbedingung zu SP-003.

Die Zugplanung materialisiert bei installierten Agenden den aktuell legalen,
exakt gebundenen Advance- oder Score-Step als `score_continuation`. Eine
unbekannte Folgeaktion wird dabei nicht vorweggenommen. Ein veröffentlichter
Finanzierungsbedarf sperrt den direkten Agenda-Head bereits beim Produzenten;
derselbe Head darf nicht als generische Route erneut zugelassen werden.
Der Produzent liefert dazu `currentHeadPrerequisiteDisposition` als `ready`,
`awaits_published_funding` oder `no_exact_head`. Die Materialisierung
konsumiert dieses typisierte Feld; diagnostische Evidence-Texte sind keine
Zulassungsbedingung.
Der gebundene Economy-Support bleibt ausführbar. Der ausdrücklich gequotete
Scope `exact_install_only` bleibt eine eigenständige Installationszulassung.

Die bekannte Score-Schutzprojektion durchläuft auch gerezzte ICE ohne eigene
ETR-Subroutine. Eine erzeugte Break-Sperre gilt für den nächsten tatsächlichen
gerezzten Encounter; ungerezzte ICE verbraucht sie nicht. Die Alternative,
die Quellsubroutine zu brechen, bezahlt deren vollständige Strength- und
Breakkosten zusammen mit vorhandenen ETR-Breaks. Ein hoher Creditstand allein
zertifiziert keinen Zugriff durch eine ungebrochene Sperre.

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

Der Score-Owner darf eine aktuelle Archives→HQ-Aktion als
`recover_score_support` voranstellen, wenn die Engine für genau diese Action
und StateVersion eine eigene bekannte Archives-Operation mit unbedingter
Advancement-Verteilung und vollständigen Klick-/Creditkosten quotiert.
Die gesamte Rückholung→Installation→Beschleunigung→Score-Folge muss mit den
vorhandenen Ressourcen im selben Zug das Spiel gewinnen. Ein fehlendes oder
veraltetes Quote eröffnet diese Route nicht; der DTO-Eingang weist beschädigte
Bindings sichtbar zurück. Nichtterminale Rückholprojekte sowie kombinierte
Kapazitäts- und Finanzierungsvorbereitungen sind damit nicht nachgewiesen.

Der Score-Parent bindet vor dem Ausspielen die konkrete Archives-Karte. Der
bestehende Choice-Pfad vervollständigt ausschließlich dieses Ziel bei identischem
Root, Executor, Quellaktion und unmittelbar folgender Engine-StateVersion mit
exakt demselben Optionssatz. Er darf weder die Karte neu bewerten noch auf eine
andere Rückholung ausweichen. Die Regression aus Paarung 422, Runde 12, Spiel 16,
D327 belegt diese terminale Vorbereitung; das getrennte Handmanagement-Verbot
einer nutzlosen Rückholschleife zum angeblichen HQ-Abbau bleibt erhalten.

Eine vollständig Engine-gequotete Same-Turn-Konversion der einzigen
HQ-Agenda darf am gegnerischen Matchpoint auch in einer neuen Remote den
Terminal-Steal-Verhinderungsnachweis tragen, wenn keine weitere Agenda
installiert ist. Dann entfernt der vollständige Score die Exposition vor
dem Runnerfenster. Bei einer installierten Geschwisteragenda bleibt die
neue Remote von diesem Claim ausgeschlossen, damit sie deren gebundene
Fortsetzung nicht unterbricht. Ein bloßer Installationsschritt ohne
vollständigen Scorepfad begründet diesen Nachweis nicht.

Die Notfallinstallation zusätzlicher HQ-Agenden bei nahendem Deckout setzt
voraus, dass keine bereits installierte Gewinnagenda eine aktuell von der
Engine bestätigte Fortsetzung bis zum nächsten Corp-Zug besitzt, deren
Creditreserve jetzt vorhanden oder mit den verbleibenden legalen
Basis-Creditaktionen erreichbar ist. In diesem Fall konkurriert die bestehende
Score-Fortsetzung mit ihrer eigenen Economy-Unterstützung. Neue Installationen
erhalten keine pauschale Notfallfreigabe für unfinanzierte weitere Scorepfade.
Eine veraltete, unvollständige oder nicht finanzierbare Fortsetzung sperrt
die Notfallentwicklung nicht; ein überlebender Remote wird dadurch nicht
als garantiert behauptet.

Diese Zulassungsgrenze gilt ebenfalls für die Last-Draw-Installation einer
neuen Gewinnagenda. Deren P2-Notfallclaim darf eine vorhandene finanzierbare
terminale Fortsetzung nicht verdrängen. Paarung 493, Durchlauf 3, G37 D374
belegt die fehlende Bindung: Die vollständig aktuelle Fortsetzungsquote der
installierten Agenda benötigt einen erreichbaren Vorhaltecredit; die neue
ungeschützte Remote darf daraus keinen vorrangigen Überlebenspfad erhalten.
Die normale Schutzprüfung anderer Installationen und die Revalidierung jedes
Funding-/Advance-Schritts bleiben bestehen.
Der Installationsquote selbst bestätigt nur den Klickhorizont. Der Score-Owner
prüft vor dem Last-Draw-Überlebensclaim zusätzlich den vollständigen
Advancement-Creditbedarf einschließlich jeder erforderlichen Basiscreditaktion
gegen aktuelle Restaktionen und die Engine-bestätigten garantierten Aktionen
des nächsten Corp-Zugs. Eine aktuell exakt legale Basiscreditaktion ist dafür
erforderlich, sobald Liquidität fehlt. Zusätzliche Finanzierung darf nicht
dieselben Klicks nochmals verwenden, die schon für Advances reserviert sind.
Paarung 493, Durchlauf 4, G11 D370 belegt den Gegenfall: Mit einem Credit und
zusammen sechs Aktionen sind Installation, fünf Advances und vier nötige
Creditaktionen unerreichbar. Die vorhandene dreifache Advancement-Linie kann
mit zwei Finanzierungsklicks in demselben Horizont erreichbar sein. Der Claim
bescheinigt keine Unangreifbarkeit; jede echte Folgeaktion bleibt neu gebunden.
Der vollständig zertifizierte installierte Pfad veröffentlicht im letzten
Drawfenster denselben typisierten Überlebensclaim auch vor einem nötigen
Basis-Creditpräfix. Er verlangt eine terminale Agenda und eine jetzt
erreichbare Vorhaltefinanzierung. So behält der bestehende Parent seine
Dringlichkeit bereits vor dem ersten bezahlbaren Advance. Außerhalb dieser
Frist entsteht daraus kein P2-Claim.

Dieselbe Grenze gilt für eine bereits installierte Agenda, deren vollständige
Konversion einschließlich nötiger Basis-Creditaktionen noch im aktuellen Zug
Engine-gequotet möglich ist. Dafür ist kein unmittelbarer Spielsieg nötig:
Der vorhandene Score-Parent und sein gebundener Funding-Step bleiben vor
pauschalen Notfallinstallationen erhalten. Ein bloßer Next-Turn-Pfad einer
nicht terminalen Agenda reicht für diese zusätzliche Zulassungsgrenze nicht.

Nach der exakten Installation bleibt derselbe Nachweis erhalten, wenn die
Agenda nun im gebundenen Zielserver liegt und weder eine weitere HQ-Agenda
noch eine installierte Geschwisteragenda exponiert ist. Der Wechsel aus HQ
in die Remote ist kein Verlust der Scoring-Dringlichkeit. Jeder weitere
Advance-/Consultants-/Score-Schritt benötigt weiterhin den aktuellen
vollständigen Engine-Pfad; eine leere HQ allein genügt nicht.

Vor einem nichtterminalen Same-Turn-Score berücksichtigt der Score-Owner
verpflichtende Folgedraws. Für den aktuellen Score einer solchen Agenda
konsumiert `score-mandatory-draw-horizon.ts` die genaue Engine-Quote aus
derselben StateVersion. Fehlende, veraltete oder widersprüchliche Pflichtfacts
scheitern mit `missing_action_semantics`. Übersteigt die gequotete Untergrenze
das eigene R&D, bleibt der Score im bestehenden Parent mit
`corp_score_mandatory_draw_exceeds_deck` blockiert. Direkte Scoreprojekte,
Same-Turn-Konversion und Next-Turn-Fortsetzung beachten dieselbe Grenze.
Ein tatsächlicher sofortiger Sieg oder eine exakt vorhandene kostenlose
Scorefolge zum Sieg bleibt zulässig. Zusätzliche Draws und gegnerische
Folgeaktionen sind damit nicht als harmlos bewiesen.

Vor einem nichtterminalen Same-Turn-Score berücksichtigt der Score-Owner bedingte
Creditwirkungen aus dem kanonischen strukturierten Scoreprofil. Ist die Agenda
bereits kostenlos scorebar und ihre Bonusschwelle mit den verbleibenden,
exakt gequoteten Basiscredit-Aktionen erreichbar, bindet derselbe Parent
zuerst Economy-Support bis zur Schwelle. Jeder Schritt wird neu geprüft;
der Score folgt weiterhin im selben Corp-Zug. Terminale Scores und aktuell
unerreichbare Schwellen warten nicht auf diesen Bonus. Die Umsetzung liegt
in `score-conditional-credit-funding.ts`; es entsteht kein eigener Chooser.

Bei genau einem verbleibenden Klick darf ein Basiscredit keine Defense-Reserve
vortäuschen, wenn der einzige aktuelle kostenlose Same-Turn-Score diesen
Credit anschließend vollständig löscht und die Bonusschwelle auch nach dem
Credit unerreicht bleibt. Der Score-Owner liefert diesen Variantenvergleich
an die bestehende Defense-Finanzierung; deren sonstige Routen und Priorität
bleiben erhalten. Ein aktuelles kostenloses Einkommen oder ein weiterer
kostenloser Score verhindern diesen engen Dominanznachweis. Nach dem Score
wird die Reserve aus dem neuen Zustand regulär aufgebaut.

Der Nachweis umfasst auch genau zwei verbleibende Klicks, wenn selbst beide
Basiscredits die Schwelle nicht erreichen und nach dem ersten Credit nur noch
ein Klick ohne andere mögliche Konversion bleibt. Dafür müssen Handkarten
kanonisch als passive ICE oder nicht in einem Klick scorebare Agenden belegt
sein. Weitere installierte Agenden, aktive Score-Area-Fähigkeiten, latentes
Rez-/Aktivierungseinkommen und unbekannte mechanische Formen sperren diesen
erweiterten Nachweis. Bereits erfolgte einfache Score-Auszahlungen und reine
ICE-Installationsrabatte erzeugen keine neue Liquidität. Drei oder mehr Klicks
werden daraus nicht extrapoliert. Die Regression aus Paarung 422, Runde 11,
D157 hält beide Creditklicks nach dem Score; der Engine-Variantenvergleich
belegt zwei statt einen Credit bei gleicher Agenda und gleichem Klickverbrauch.
Reine Archives→HQ-Rückholung und reine Advancement-Verteilung auf dem letzten
Klick eröffnen unter denselben Grenzen keine liquide Finanzierung: weitere
installierte Agenden und Advancement-Trigger sind bereits ausgeschlossen.
Die wiederholte Situation in Runde 11, D340, belegt diese beiden Handangebote.

Für eine noch auszuführende gewöhnliche Install-/Advancement-/Score-Folge
publiziert Score die vollständigen aktuellen Klick- und Creditkosten aus
seinem Engine-gequoteten Pfad. Bleibt genau ein freier Creditklick übrig und
würde dessen Ertrag auch nach Finanzierung der ganzen Konversion unter die
Bonusschwelle fallen, erfolgt dieser Klick nach dem Score. Der Nachweis gilt
nur ohne Fundingpräfix, zusätzliche Klickerzeugung, Off-Target-Advancement,
weitere installierte Agenden oder aktive Einkommenseffekte auf dem Board.
Eine zusätzliche freie Aktion, unzureichende Finanzierung, eine erreichbare
Bonusschwelle oder veraltete Kosten verhindern diesen Variantenvergleich.

Ein bereits gerezzter reiner Advancement-Support bleibt im prospektiven
Scorepfad verfügbar, wenn die neue HQ-Agenda noch kein installiertes legales
Aktivierungsziel bietet. Dieselbe enge kanonische Prüfung auf unbedingte feste
Kosten und Wiederholbarkeit gilt für beide Rez-Zustände. Ein ungerezzter
Support benötigt seine exakte aktuelle Engine-Rezaction; ein gerezzter bezahlt
keinen zweiten Rez. Sobald die Agenda installiert ist, wird jede echte
Aktivierung ausschließlich aus den aktuellen LegalActions materialisiert.
Ein bereits vorhandenes natives Capability wird nicht doppelt projiziert.
Die native Gegenprobe schließt zwei Scorefolgen über eine echte Zuggrenze ab.
Die virtuelle `Archives.root`-Projektion enthält entsorgte Karten und zählt
niemals als installierte Support- oder Counterquelle, auch wenn deren sichtbare
Rezmarkierung erhalten ist. Tatsächlich installiertes Archives-ICE bleibt eine
installierte Quelle. Der native Root-Austausch und G1 D171 aus Diagnose-Runde 4
der Paarung 492 sichern diese Zonengrenze und den weiterhin legalen Babylon-
Advance ab.

Vor der Admission prüft Score nach der Zusammenführung seiner Projekte den
vollständigen Engine-gequoteten Same-Turn-Credithorizont gegen die bereits
finanzierten Zentral-Schutzclaims von `corp.defend_servers`. Ein exaktes
Fundingpräfix zählt mit seinem einmaligen Bruttozufluss und seinen Kosten;
ein späterer Score-Ertrag bezahlt keine vorherigen Schritte. Eine
nichtterminale Folge, die die Schutzreserve nach ihrem sicheren unbedingten
Score-Zufluss unterschreitet, bleibt mit typisierter Begründung blockiert und
fordert keinen scheinbar ausführbaren Economy-Support an. Ein direktes
Geschwisterprojekt darf diese Ablehnung nicht ersetzen. Terminaler eigener
Score bleibt P1; die vergleichende Schutzpriorität bleibt beim Defenseowner.
Paarung 492 R3 G2 D102–106 belegt den bezahlbaren Acht-Credit-Pfad, der eine
finanzierte Fünf-Credit-Reserve verbraucht und deshalb nach der ersten
Aktivierung korrekt durch P2-Finanzierung unterbrochen wird. Der Score-Owner
weist ihn bereits vor der Installation zurück. Eine native Kontrolle mit
dreizehn Credits beendet beide gebundenen Aktivierungen und hält fünf Credits.

Dieselbe Admission konsumiert auch die bestehenden Defense-Facts für aktuell
finanzierte terminale Zentral-ICE mit Tax-, Schadens- oder Disruptionwirkung.
Ein sicherer Run-Stopp ist dafür keine Voraussetzung. Score übergibt den
vollständigen liquiden Endhorizont nach sicherer Auszahlung und die aus HQ
entfernte Agenda; zukünftige Finanzierungsklicks begründen diesen Claim nicht.
Terminaler eigener Score und die vorhandene Bewertung einer unmittelbar
verhinderten terminalen Agenda-Entwendung behalten ihre Verträge. Paarung 493
R5 G32 D190 belegt zwei Overtime-Zahlungen und drei Advances für insgesamt
elf Credits bei zwölf Credits Bank: Die verbleibende Bank von eins verliert
die bereits bezahlbare Fünf-Credit-R&D-Abwehr. Mit sechzehn Credits bleibt
derselbe exakte Beschleunigungskopf zugelassen.

Besitzt eine vollständig aktuell bezahlbare Scorefolge mit festen Kosten noch
freie aktuelle Aktionen, kann derselbe Score-Owner die fehlende gemeinsame
Finanzierung von Score und bereits finanziertem Defense-Claim anfordern.
Ein aktueller, exakt gebundener nativer Basiscredit liefert je eine Aktion
und einen Credit; alle nötigen Fundingaktionen müssen zusammen mit der
vollständigen Scorefolge in den aktuellen Zug passen. Economy führt diesen
Support unter demselben Score-Parent aus. Der vollständige Credit- und
Aktionshorizont wird vor der Admission neu gebunden; nach jedem Schritt
revalidiert Score mit den aktuellen LegalActions. Fehlende oder veraltete
Basisactions und unzureichende freie Aktionen lassen die Folge blockiert.
Bereits finanzierte Folgen und terminaler eigener Score behalten ihr Verhalten.
Paarung 493 R6 G8 D86 belegt sechs Credits, drei Aktionen, zwei verbleibende
Coup-Advances und fünf Credits Schutzreserve: Gain→Advance→Advance→Score passt
vollständig und erhält fünf Credits. Ein weiterer Remote-Ausbau würde dieses
vorhandene Abschlussfenster dagegen verlieren.

Eine vollständig aktuell finanzierte Scorefolge mit festen Kosten kann die liquide
Rezreserve vor dem nächsten Runner-Fenster wiederherstellen. Der Score-Owner
weist dies in `score-reserve-restoration.ts` mit seiner aktuellen vollständigen
Engine-Kostenquote und einer kanonischen unbedingten Score-Auszahlung nach.
Defense stellt dann nur die zusätzliche Finanzierung des aktuellen
Rezreservebedarfs zurück. Die Auszahlung zählt nicht als Geld für die noch
offenen Scorekosten. Jeder reale Schritt revalidiert Kosten, LegalAction und
Reserve; fehlende Klicks, Fundingbedarf, abgelaufene Quotes, bedingte Erträge,
spätere Aktivierungserträge und aktuelle Runfenster tragen diesen Nachweis
nicht. Auch notwendige Support-Rezs und wiederholte feste Zahlungen zählen
vollständig; zusätzliche Klickerzeugung und Fundingpräfixe erzeugen hier
keinen Ersatz für die feste Kostenquote. Der historische Fall Paarung 455 G3 D414/D459 benötigt zwei Credits
und drei Klicks und stellt mit dem Score fünf Credits für eine Reserve von
vier wieder her. Er ändert weder Planprioritäten noch Rez-Ownership.
Nach Installation publiziert derselbe Score-Owner die vollständigen Kosten
aller verbleibenden Advances plus Score aus der an Agenda, Server und Zustand
gebundenen `scoreContinuationQuote`. Deren geringerer Vorhaltebedarf für den
nächsten Corp-Zug ist keine aktuelle Konversionsquote. Der Nachweis bleibt
damit auch in der Advance- und Score-Phase verfügbar.

Dasselbe aktuelle Reihenfolgenurteil gilt für einen einzigen kostenlosen
Score, dessen kanonischer Effekt ausschließlich einen eigenen Creditpool
erzeugt und eine sonst kostenfreie Auszahlung pro Klick von mehr als einem
Credit eröffnet. Ein Basiscredit vor diesem Score verliert eine bessere
Finanzierung desselben Klicks. Der Score-Owner stellt deshalb nur diese
dominierte Basiscredit-Vorbereitung zurück. Pool und spätere Auszahlung sind
keine aktuelle Liquidität; nach dem Score muss der Economy-Owner die echte
neue LegalAction erneut quotieren. Bedingte Scoreeffekte, mehrere freie Scores,
andere Auszahlungskosten und ein laufender Run tragen diesen Nachweis nicht.

Beim Variantenvergleich zweier vollständig finanzierter, nichtterminaler
Same-Turn-Scores derselben Agenda prüft der Score-Owner auch den Verlust eines
installierten Wirtschaftsmittels. Stimmen Klicks, Credits, Fortschritt,
Quellenverbrauch und Counterbindungen exakt überein, dominiert die Variante
ohne Ersetzung eines Assets mit aktuell Engine-belegter positiver Poolauszahlung.
Sie bleibt auch gegenüber der sonst bevorzugten vorbereiteten Remotevariante
zugelassen. Der Economy-Owner liefert nur seine bestehenden Auszahlungsfakten;
`score-asset-preservation.ts` entscheidet den Variantenvergleich. Daraus folgt
keine Lockerung regulärer Schutzanforderungen über ein Runnerfenster und keine
vermutete Auszahlung ungeresster oder nicht ausführbarer Assets.

Bei einer übervollen reinen Agendahand umfasst die bestehende riskante
Entlastungsroute auch eine aktuelle legale Asset-zu-Agenda-Ersetzung in einem
vorhandenen Fort, wenn die einzige dortige Assetquelle eine Engine-gequotete
Counterbank mit exakt null Countern ist. Die normale Scorehorizont- und
Finanzierungsprüfung bleibt erhalten; der Defense-Owner liefert weiterhin die
aktuelle Zugriffsquote für den Variantenvergleich. Eine gefüllte Bank, eine
fehlende oder veraltete Quellen-/Serverquote und eine gewöhnliche Hand öffnen
diese Ausnahme nicht. Andere Assets erhalten keine pauschale Ersetzungsfreigabe.
Die nativen Zustände aus Paarung 554, Runde 1, G10 D301, G11 D230 und G15 D180
belegen, dass derselbe Agenda-Score sonst im nackten neuen Remote zugelassen,
im vorhandenen Fort jedoch vor dem Risiko-/Kostenvergleich ausgeschlossen wurde.
Die Ausnahme verspricht keinen sicheren Score über den Runnerzug.

### Vertikale Implementierung der Agendaentscheidung

`packages/ai/src/corp/score/` bündelt den Owner:

- `score-discovery.ts`: direkte Scorevorhaben, Variantenvergleich und
  Wiederaufnahme einer konkreten residenten Agenda-/Serverbindung;
- `score-project-signals.ts`: Install-/Advance-/Konversionspfade, Scorehorizont,
  Deckout-Konversion, Finanzierungsvorbereitung und explizite Dispositionen;
- `score-protection-needs.ts`: gewünschter Schutz, verbleibende Scorekosten,
  eigene Reserven und Prüfung des gequoteten Schutzstatus;
- `score-plan-module.ts`: Discovery, Assessment, Steps und aktuelle Routen;
- `corp-score-funding.ts`, `corp-score-priority.ts` und
  `corp-score-defense-continuity.ts`: Funding-Meilensteine, Priorität und
  konkrete Agenda-/Remote-Kontinuität;
- `corp-counter-bank-score-plan.ts`: Engine-gequotete Counterbank-Scorefolgen;
- `corp-agenda-turn-planning.ts`: Agenda-Zuglinien und Kampagnenquotes für den
  gemeinsamen TurnPlanner, einschließlich gebundener Support-Provider;
- `score-milestone-boundary.ts`: Revalidierung noch offener Advance-/Scorearbeit
  nach einem aktuell materialisierten Install- oder Advance-Head;
- `score-choice-continuation.ts` und `score-choice-binding.ts`: Bindung und
  Vervollständigung der ausgewählten Advancement-/Agenda-/Folge-Choices.

Die Runtime entdeckt zuerst direkte Scorevorhaben, gibt deren Reserven an
Ambush und reicht die entdeckten Ambush-Fakten zur Score-Reconciliation zurück.
Anschließend komponiert sie die verbleibenden Defense-, Economy- und Handbedarfe.
Es entsteht kein zweiter Planvergleich außerhalb des Schedulers/TurnPlanners.

Die aktuelle Restzugsuche projiziert bei Installationen und Advances Kosten,
aber noch keine vollständige Boardänderung samt folgenden Score-LegalActions.
Ein exakter Score-Head endet deshalb an einer expliziten Projektionsgrenze,
bevor ein fremder Plan die verbleibenden Klicks gebunden übernehmen kann.
Ein prognostizierter Meilenstein wie `agenda_advanced` ist nach der bloßen
Installation noch nicht erreicht. Der Folgezustand wird regulär neu entdeckt
und bewertet; Prioritätsklassen, Schutz- und Fundingzulassung bleiben beim
bestehenden Owner. Das ist keine zusätzliche Sperre für mehrzügige Scores und
kein Nachweis, dass jede Nebenaktion einen Scorezug kostet. Eine zukünftige
vollständige semantische Scoreprojektion kann diese Grenze ersetzen, wenn sie
Boardfortschritt, Kosten und Meilensteinerfüllung gemeinsam nachweist.

`corp/defense/corp-score-protection-routes.ts` und
`corp/defense/corp-defense-layer-certification.ts` bleiben Schutzdienste außerhalb
des Score-Owners. Sie bewerten konkrete Defense-Routen; Score liefert seine
Agenda, Deadline und Schutzziele. Die vorhandene Scoreline-Vorprojektion bleibt
ein ausdrücklich konsumierter Dienst. Gemeinsame sichtbare Agenda- und exakte
Kostenfakten liegen in `runtime/visible-agenda-facts.ts` beziehungsweise
`runtime/exact-action-cost-facts.ts`. Kein Score-Modul importiert eine Registry,
die Live-Runtime oder den allgemeinen Choice-Dispatcher zurück.

Ein bereits begonnener Score-Remote erhält bei einer bekannten, ausschließlich
finanzierungsblockierten Schutzroute keine zusätzliche reine Abschreckungsschicht
zulasten dieser Finanzierung. Die erste begrenzte Vorbereitung und ein konkret
wirksamer zusätzlicher Stopper bleiben zulässig (Regression: Match 41df, D13).

Die Schutzprojektion berücksichtigt öffentliche Shell-Vorbereitungen einschließlich
Engine-geprüfter freier Host-Kapazität und Stärkeänderung. Für die kommende
Runner-Phase liefert die Engine `runnerNextTurnCreditClicks`: Basisklicks abzüglich
bestehender Aktionsschuld und eines reservierten Run-Klicks. Optionale Einkommen,
zusätzliche Aktionen und unbekannte Handkarten sind nicht Teil dieses Basishorizonts.
Scorebedarf und seine Installationsprojektion verwenden denselben Horizont; laufende
Runs behalten ihr aktuelles Budget. Die Reifeprüfung mehrerer ICE berücksichtigt
dieselben vorbereiteten Breaker. Kombinierte ETR-Subroutinen müssen vollständig an
die Breaker-Kostenrechnung weitergereicht werden. Fehlende Host-Fakten bleiben
explizit unbekannt (Regressionen: Match 41df D89, Afreet/Cyfermaster/Puzzle).

Die öffentliche Vorbereitung umfasst außerdem einen bekannten Breaker im Heap,
wenn eine bereits aktive, unbegrenzte Top-Heap-Rückholung seine Rückholung und
die normale Installation vor dem reservierten Run ermöglicht. Jede darüberliegende
Heap-Karte verbraucht die tatsächlichen Rückholkosten und Klicks. Installation
und Rückholung bezahlen ausschließlich allgemeine Credits; nur übrig bleibende
Vorbereitungsklicks erzeugen Einkommen. Freier Speicher oder eine Engine-geprüfte
Host-Variante muss vorliegen. Die kanonische Host-Projektion grenzt öffentlich
erkennbare Nicht-Host-Kartentypen vor der Identitätsprüfung ab; eine verdeckte
Ressource macht das übrige öffentliche Rig nicht unbekannt. Unbekannte mögliche
Programm-/Hardware-Hosts bleiben unbekannt (SP-655). Der neu installierte Breaker erhält keinen aus dem
Heap übernommenen oder am verpassten Zugbeginn aufgefüllten Kreditpool.

`runtime/corp-public-heap-breaker-preparation.ts` liefert diese öffentlichen Fakten
für die bestehende Defense-Reifeprüfung, Scoreline-Schutzprojektion und die
gemeinsame finanzierte Schutzbewertung einschließlich Installationsprojektionen.
Jede unabhängige Recovery-Route übergibt ihre absoluten Restcredits; das
Basiseinkommen wird dafür nicht erneut addiert. Der ausdrücklich typisierte
Horizont `next_runner_turn` füllt passende vorhandene Pools einmal bis zur
Kapazität auf. Live- und Folgeruns derselben Runner-Phase behalten `current`. Die
KI-Input-Normalisierung bewahrt dazu die von der Engine veröffentlichten
Runner-Heap-Karten ausschließlich im Corp-Input; gegnerische Corp-Ablagen
werden dadurch nicht in den Runner-Input aufgenommen. Der Dienst erzeugt
keine zukünftigen LegalActions und entscheidet keinen Runner-Zug. Verdeckte
Handkarten und spätere Ziehergebnisse bleiben unbekannt. Unvollständige
öffentliche Heap-, Speicher- oder Klickfakten scheitern sichtbar. Frühere Zugriffe
sperren weiterhin keine nachweislich aktuell geschützte Reprotection; korrigiert
wird die aktuelle Schutzrechnung (SP-654, Paarung 555/R4 G4 D595 und G17 D455).

Notfall-Installationen behalten ihre ausdrückliche Fristzulassung, erhalten dadurch
aber keinen Schutzbonus. Der Score-Owner vergleicht die an Parent, Server und
StateVersion gebundene finanzierte Zugriffschance und die danach verbleibenden
Runner-Credits. Reine ICE-Anzahl und Rez-Anzahl liefern keinen Konversionsbonus.
Eine exakt qualifizierte Notfallinstallation gegen erzwungenen Agendaabwurf
aus einer ausschließlich mit Agenden überfüllten HQ bleibt auch im leeren
bestehenden Remote nach einem vorherigen Zugriff zugelassen. Die erneute
Zugriffserinnerung darf diesen riskanten Versuch nicht gegenüber der bereits
zulässigen nackten Neuinstallation sperren. Beide Ziele behalten ihre aktuelle
Expositionsquote; die gewöhnliche Reprotektionspflicht außerhalb dieses engen
Abwurffalls sowie Scorekosten, Verteidigungsreserven und Sofortsiege bleiben
unverändert. Zwei native Folgeinputs aus Paarung 544 belegen die notwendige
Kontinuität über den gegnerischen Zug; ein Einzelrestore verbraucht diese Grenze.
Ein möglicher terminaler Steal erhöht das Gewicht der Exposition. Unbekannte oder
veraltete Quotes bleiben unbekannt und tragen eine konservative Risikogrenze;
sie werden weder als sicher noch pauschal als 50-Prozent-Chance behandelt.
Die Zuglinien übernehmen dieselbe Exposition einschließlich des höheren Gewichts
eines terminalen Steals. Funding-/Defense-Setup exponiert die Agenda noch nicht
und erhält diesen Aufschlag nicht. Gleiche Zugriffschancen dürfen beim Vergleich
gehaltener Agenden nicht die unmittelbare Verlustfolge unterschlagen (Regression:
Pairing 432, D464; Coup und Security Net bei sechs Corp-/vier Runnerpunkten).

Der vorsorgliche Agenda-Flood-Pfad bei höchstens sechs R&D-Karten ersetzt keine
Schutzzulassung, solange die aktuelle zentrale Defense-Quote für HQ keinen
erwarteten Agendaverlust ausweist. Gehaltene Agenden wechseln dann nur über die
regulären Schutz- und Fundingbedingungen in einen Remote. Ein tatsächliches
Last-Draw-Fenster, ein sofort schließender Score und die Fortsetzung bereits
installierter Agenden behalten ihre eigenen Fristverträge. Regression:
Paarung 473, Kontrollrunde 2, G3 D355, fünf HQ-Agenden bei null Credits.

Bei einer installierten Agenda, deren Steal den Runner gewinnen lässt, stellt
`corp.score_agenda` gewöhnlichen Advance-Fortschritt hinter einen konkret
finanzierbaren Schutzweg zurück. Ein im aktuellen Zug schließender Score bleibt
vorrangig. Der typisierte `terminalDefense`-Bedarf trägt P2, Agenda-/Serverbindung,
StateVersion und den bestehenden `score-protection`-Need. Eine Next-Turn-
Fortsetzungsquote hebt diesen Bedarf nicht auf. P2 gilt für eine konkrete
Schutzinstallation oder eine gequotete Rezreserve. Wenn die vorhandenen aktiven
Schichten bereits ohne weitere Rezcredits schützen, bleibt gewöhnlicher
Scorefortschritt in seiner normalen Prioritätsklasse. Die bloße Existenz von
`terminalDefense` hebt einen solchen Remote nicht über einen anderen terminalen
Schutzbedarf. Regression: Paarung 473, G13 D531,
geschützte Superior Net Barriers gegenüber einem fehlenden HQ-Rezcredit.

`corp.defend_servers` vergleicht mit dem bestehenden exakten ICE-Subset-Solver
vorhandene Schichten, eine aktuell legale ICE-Installation und eine aktuell
legale, sofort aktive Post-Pass-Schutzinstallation. Mechanische Wahrscheinlichkeit
und sofortige Aktivierung kommen aus der Engine, Kosten aus LegalActions und
Rez-Quotes. Die Suchgrenze ist ausdrücklich eine Installation plus finanzierbare
Basiscredit-Vorbereitung innerhalb der verbleibenden Klicks; nach jeder Aktion
wird neu bewertet. Unbekannte Ziehkarten, mehrere hypothetische Installationen,
Regionersatz und nicht gequotete Mechaniken sind keine zertifizierten Routen.
Öffentliches, unbedingtes und unbegrenzt wiederholbares Runner-Krediteinkommen
wird bei der Vorbereitung berücksichtigt; verdeckte Events bleiben unbekannt.
Die reife Remote-Zertifizierung und das Scorefenster verwenden für den nächsten
Runnerzug denselben typisierten Pfadledger. Nur die explizite Engine-Quote
`start_of_runner_turn/refill_to_capacity_if_used` hebt einen installierten
öffentlichen Pool auf seine Kapazität an; voller Pool und Auffüllung werden
nicht addiert. Zweckbindung, Stealth-Quelle und Breaker-Hosting bleiben erhalten.
Im aktuellen Runnerfenster gilt ausschließlich der aktuelle Betrag.
Beschränkte Breaker-Credits finanzieren weder die vorbereitete Installation
noch allgemeine Zahlungen. Fehlende oder ungültige Auffüllquoten scheitern
sichtbar. Paarung 555 R2 G5 D276/D282 belegt den entscheidenden Credit.

Ziel ist die kleinste belegte Zugriffswahrscheinlichkeit pro Run; bei Gleichstand
entscheiden Agenda-Punktkosten, gesamte Creditkosten und Installationsklicks.
Auch Teilabsicherung ist produktiv. `corp.economy` finanziert den vom Scoreparent
veröffentlichten Credit-Meilenstein. Advances dürfen nur Überschuss verbrauchen;
wenn ein zusätzlicher Basiscredit Advance und Rezreserve gemeinsam ermöglicht,
steht diese Finanzierung zuerst. Die Zugplanung übernimmt denselben Parent/Need
und validiert nach Installation neu. Während eines terminalen Runs erhält die
gewählte finanzierte ICE-Kombination Vorrang vor Score-Credits und redundanten
Rezzes. Das gilt auch, wenn beide bekannten Linien Zugriff zulassen und die
gewählte Kombination dem Runner weniger Restcredits lässt: Ein schwächerer
äußerer Rez darf deren innere Rez-Kosten nicht verbrauchen. Dieser Vergleich
belegt Teilabsicherung, keine sichere Run-Sperre; unbekannte Folgeeffekte
werden nicht als zusätzliche Zugriffshinderung gewertet.
Der Restcredit-Vergleich bezieht sich auf den bekannten Zustand vor dem Rez,
damit auch die gerade angebotene ICE der gewählten Teilabsicherung ihre
Priorität erhält. Eine aktuell enginegequotete günstigere Rez-Variante derselben
ICE erhält diese Bindung, solange sie weder mehr Credits noch mehr Agendapunkte
als die gewählte Subset-Quote kostet und die weiteren ausgewählten Rezzes
finanzierbar bleiben. Die Gleichheit der einzelnen Creditkosten ist dafür
keine Voraussetzung. Paarung 474, G1 D140 aus Kontrolllauf 5 belegt beide
aktuellen Varianten und die exakte Eincredit-Action mit unverändertem
Defense-Owner, Executor, Step und StateVersion.
Finanzierbare Teilabsicherung terminaler Server bleibt außerdem beim
Vergleich mit Rezzes auf anderen Servern reservierbar.

Die gemeinsame Schutzbewertung benötigt keine noch unbekannte Zufallsstärke
für einen öffentlichen Breaker, dessen Engine-Abdeckungsquote auf jedem
aktuell bekannten aktiven ICE keine anwendbare Breakfähigkeit ausweist.
Die vollständige Rig bleibt im Creditledger; nur der irrelevante Breaker
entfällt in der Break-/Stärkefolge. Andere Run-Effekte, passende Sentries,
unbekannte ICE und ungebundene effektive Quotes behalten ihre Unknown-Grenze.
Derselbe Nachweis gilt für einzelne Subroutinen und öffentlich vorbereitete
Breaker. Die Defense-Zielwahl für freie Rez vor Score sowie deren exakte
Score-/Choice-Executorbindung bleiben unverändert. Paarung 558, R3 G8 D122
und G9 D391, belegt den vorherigen Abbruch; native Direct-/DTO-Kontrollen
führen Score und kostenlose Rez durch echte Engine-Aktionen aus.

Die historische Gegenprobe `match_52de6345f1e39802` hat bei D34 sechs Credits und
drei Klicks, eine 0/4 avancierte Main-Office Relocation und den Runner bei vier
Agendapunkten. Rio de Janeiro City Grid kostet einschließlich sofortigem Rez
einen Credit und einen Klick. Rio, ein Basiscredit und ein Advance lassen fünf
Credits für Data Wall 2.0 und Wall of Static; die Agenda endet bei 1/4. Beide ICE
allein sind durch den sichtbaren Dwarf für insgesamt zwei Credits brechbar.
Rio ergänzt je passiertem gerezzten ICE eine Runstopp-Chance von 1/6: zwei
Schichten geben 11/36 Abbruchchance pro vollständigem Runversuch. Bei D35 genügt
Rio plus Basiscredit; bei D36 finanziert Rio nur noch eine Schicht, wobei die
billigere gleich wirksame Data Wall erhalten wird. Dies verbessert die belegte
Abwehrchance, beweist aber weder das Überleben wiederholter Runs noch einen Sieg.
Die genaue Entscheidung ist durch den actor-sicheren D34-Checkpoint und
`match-52de-terminal-defense.test.ts` prüfbar; Engine-Runstopp und Replay bleiben
in `agenda-global-random.test.ts` abgesichert.

Ein bereits im eigenen Zug
vollständig schließender Score hat kein dazwischenliegendes Runner-Fenster.
Nicht bevorzugte, aber zugelassene Agenda-Zuglinien behalten ihre eigene Quote
im Restzugvergleich. Nur eine autorisierte Opening-Randomisierung bindet die
Familie vorab; eine andere Setup-Präferenz darf dieselbe Install-Action nicht
mit einem generischen Einzelwert wieder einführen.

Die Zugriffsrechnung behandelt auch reinen Trace-Net-Schaden konservativ wie
direkten Schaden: Er garantiert keinen verhinderten Zugriff. Das ist kein
Flatline-Nachweis und behauptet keine vollständige Simulation aller Run-Folgen.
In den historischen D176/D210-Zuständen sind beide Score-Remotes erreichbar;
Remote 2 bleibt wegen der höheren Durchbruchkosten der bessere Notfallversuch.
D210 lässt dem Runner dort 23 statt 25 Credits. Diese Regression verlangt
keinen willkürlichen Serverwechsel und behauptet keinen alternativen Matchsieg.

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

Die sofortige Ausführbarkeit einer solchen Defense-Installation erzeugt
keine auslaufende P3-Gelegenheit. `immediateInstallSupport` hält den aktuellen
Routenkopf ausführbar, erhöht aber bei einem gewöhnlichen Remote-Parent
nicht dessen P6-Klasse. Konkreter Score-Support und materielle, akute oder
terminale Central-Abwehr behalten ihre eigenen Prioritätsverträge.

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

Eine reine Agenda-Linie liefert keinen inkrementellen Schutzwert und keinen
Value-Claim von `corp.defend_servers`. Vorhandener Schutz geht bereits in
die Engine-gequotete Zugriffsexposition ein. Zusätzliche Schutzbeiträge sind
nur bei einer tatsächlich gebundenen Defense-Provider-Linie zulässig; ein
Agenda-Head oder bloße Agenda-Präsenz ersetzt diesen Nachweis nicht.

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

Eine unbekannte globale Central-Allokation löscht keine unabhängig bekannten
lokalen Reserven. Defense prüft eigene Agenda-Bedrohung und aktuelle,
vollständig gebundene installierte Rez-Quotes beider Zentralen weiterhin.
Zusätzliche ICE und Upgrade-Platzierungen dürfen weder bereits finanzierte
noch durch die verbleibenden exakten Basiscredits erreichbare Reserven
verbrauchen. Der Defense-Owner dispositioniert eine solche Upgrade-Route
auch vor einer sonst möglichen HQ-Overflow-Konversion. Unbekannte, veraltete
oder mit unbelegten Zusatzkosten belastete Quotes begründen keine Reserve.

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

### Vertikale Implementierung des Scoring-Remotes

Unter `packages/ai/src/corp/scoring-remote/` liegen:

- `scoring-remote-discovery.ts`: Zusammenstellung von Belegung, Doctrine und
  aktueller Reifequote aus sichtbaren Serverfakten;
- `scoring-remote-signals.ts`: Zielbindung, Cadence, Wiederverwendung, Score-Lease
  und exakt gebundener Ausbau- oder Finanzierungsbedarf;
- `scoring-remote-types.ts`: Projekt-, Belegungs- und Consumer-Verträge;
- `scoring-remote-plan-module.ts`: Discovery, Assessment und Support-Step.

Das verfügbare Rez-Budget kommt aus
`corp/defense/corp-defense-remote-rez-budget.ts`; globale Central-Allokation bleibt
außerhalb dieses Owners. Die bestehende Reifebewertung unter
`runtime/corp-remote-maturity-assessment.ts` bleibt ein gemeinsamer gequoteter
Projektionsdienst. Das Remote-Modul besitzt weiterhin keine eigene ICE-,
Agenda- oder Assetaktion. Sein Step fordert den gebundenen Provider an.

## 4. `corp.defend_servers`

Der aktuelle Run-Response darf mobile ICE aus einem leeren Remote-Fort zum
angegriffenen Fort bewegen, wenn dort eine bekannte Agenda den Runner gewinnen
ließe. Für HQ zählen dabei ausschließlich die eigenen bekannten Handkarten.
Eine ungerezzte Quelle benötigt eine vollständige bezahlbare Engine-Projektion
von Bewegung und anschließendem festen Rez einschließlich Agenda-Punkt-Kosten.
`mobile-ice-run-defense.ts` konsumiert die aktuelle
Engine-Quote `corpMobileIceMoveQuoteJson`: Action, Quelle, beide Forts,
StateVersion, Zahlung und vollständige öffentliche ICE-Pfade bleiben gebunden.
Der bisherige Pfad muss erreichbar sein; der neue Pfad muss anhand des
sichtbaren Runner-Rigs und seiner tatsächlich verfügbaren Run-Zahlungsmittel
an einer unbezahlbaren ETR scheitern. Der Pfadprüfer darf dabei am belegten
Stop enden, ohne inneres ICE nochmals zu durchlaufen. Root, Executor, Step und
Route gehören weiterhin `corp.defend_servers`, ebenso der später separat
revalidierte Rez-Schritt. Unbekannte oder weitere ungerezzte Zielschichten,
unvollständige Quotes, nichtterminale Allokation und ein belegter
weiterhin bezahlbarer Zugriff eröffnen diese enge Route nicht. Eine Rootkarte
im Herkunftsfort sperrt sie ebenfalls; allgemeine Umverteilung mit Aufgabe
anderer Schutzbedarfe bleibt offen. Regressionen: Paarung 475/R13/G2/D375 und
Originalseed-Kontrolle G26/D446 auf `2254ba250`.

### Vertikale Implementierung

[`defenseModule`](../../../packages/ai/src/corp/defense/defense-plan-module.ts)
ist der Einstieg in `corp/defense/`. Der Owner bündelt globale Central-Allokation,
Schutzrouten, Planphasen, Assessment, Dispositionen und exakte Validierung.
`defense-discovery.ts` bildet residente Defense-Fakten, Schutzunterstützung für
Score und die aktuellen Defense-Needs in derselben Reihenfolge wie die bisherige
Runtime. `defense-memory.ts` bindet Draw-Versuche und HQ-Halteentscheidungen.
`defense-run-response.ts` besitzt aktuelle Rez- und Encounterbewertungen;
Choice-Signale, Fortsetzungen und Payload-Bindungen liegen ebenfalls hier.

Die aktuelle Installationsroute bindet neben Credits auch obligatorische
Rez-Punktkosten an die vollständige Engine-Quote, die ausgewählten ICE und
den bekannten eigenen Punktestand. Ein positiver Punktpreis ist zulässig,
wenn die ganze gewählte Route ihn bezahlt und der projizierte Restpunktestand
exakt stimmt. Fehlende, veraltete oder widersprüchliche Quotes und
unfinanzierte Punktkosten sperren die Route. Ein leerer ausgewählter Rezsatz
bei bloßer Vorbereitung wird nicht als bereits bezahlter Rez ausgegeben.
Paarung 525 G2 D268 belegt den zuvor verworfenen finanzierten Glacier-RD-Pfad
mit zwei Punkten; die reale spätere Rez verbraucht genau einen Punkt.

Für den an einen Agenda-Score gebundenen kostenlosen ICE-Rez bestimmt
`scored-agenda-free-rez-defense-target.ts` das installierte Ziel vor dem
Score. Bei mehreren Zielservern steht ihre aktuelle erwartete
Agendapunkt-Exposition vor der ersparten normalen Rez-Zahlung. HQ/R&D
konsumieren die bestehenden zentralen Defense-Fakten; eigene übrige
Agenden und der öffentliche Runnerpfad liefern den Remote-/Archivesbedarf.
Die gerade gescorete Agenda zählt nicht mehr als zu schützende Rootkarte.
Fehlende erforderliche Expositions- oder Pfadfakten scheitern strukturiert.
Bei Zielen auf demselben Server bleibt der normale Rezpreis das Auswahlkriterium.
Diese Zielbindung ist keine Zusage eines optimalen zukünftigen Runstopps:
weitere Runner-Vorbereitung und der Grenznutzen verschiedener ICE desselben
Forts werden dadurch nicht als bewiesen ausgegeben. Score behält seine
ausgewählte Action, Planinstanz und seinen Executor; die folgende Choice
löst ausschließlich die exakt gebundene Source-, Ziel-, Varianten- und
StateVersion-Option auf. Paarung 521 G9 D343/D344 belegt R&D-Triggerman
statt der teureren HQ-Wall; G14 D137/D138 kontrolliert die einzige verfügbare
Remote-Wall und die bestehenden Tests variable Rezoptionen.

Score, Remote und Ambush liefern weiterhin ihre typisierten Projekte und Bedarfe.
Die Live-Runtime komponiert diese Schritte; sie importiert den Owner, der keine
Runtime-Dispatcher oder Planregistries zurückimportiert. Geteilte Defense- und
Funding-Vertragstypen bleiben unter `plans/`, reine Engine-Quote-/Pfadprojektionen
bleiben wiederverwendbare Dienste. Die 25 registrierten Module, Prioritäten und
Entscheidungsregeln bleiben unverändert.

Vor einer ausgewählten ICE-Installation kann Defense eine kostenlose Root-Rez
als exakt gebundene Kostenvorbereitung ausführen. Die Engine veröffentlicht
dafür `CorpRootRezIceInstallCostQuote` nur für reine, öffentliche
Installationskostenmodifikatoren ohne weitere Lifecycle-Funktion. Die Quote
vergleicht aktuelle und nach Rez geltende Kosten jeder HQ-ICE-Karte an den
regelkonformen bestehenden Installationszielen. Ihr Vertrag v2 trennt den
Root-Fort der Quelle (`sourceServerId`) vom tatsächlichen Installationsfort
jedes Kosteneintrags (`targetServerId`). Die Engine-Kostenauswertung entscheidet,
ob ein Modifikator nur im eigenen Fort oder global wirkt. Die Quote bleibt
Corp-privat und bindet Quelle, Rez-Action und StateVersion.
Die Positivliste in `input-dto.ts` übernimmt
`rootRezIceInstallCostQuoteJson` in beide actor-sicheren LegalAction-Listen.
Der Nachweis umfasst die Engine-Aktion durch diesen DTO-Pfad und die
anschließende Planwahl; ein direkt ergänzter Testinput allein genügt nicht.
`corp-ice-install-cost-support.ts` ergänzt nur den bereits ausgewählten
Installationspfad. Serverallokation, Plan, Schritt und Prioritätsklasse bleiben
führend; ein Rabatt für eine andere Installation begründet keinen Wechsel.
Nach der Rez werden Installation und Kosten regulär neu ermittelt. Fehlende,
veraltete oder widersprüchliche Quotes erlauben keine Kostenvorbereitung.

Aktuelle Passgebühren gehören als Rez-Response diesem Owner. Die Engine
bindet den Root-Rez an Action, StateVersion, Run und Server und liefert die
verbleibenden ICE-Passagen sowie tatsächlich verfügbare Runner-Run-Credits.
Defense darf damit einen bezahlbaren Durchlauf, einen erzwungenen Abbruch
oder einen wirtschaftlich sinnvollen Gebührentausch bewerten. Die spätere
Access-Rez-Heuristik gilt nicht für vor dem ICE-Pass fällige Gebühren.

Eine kostenlose reine Root-Rez kann im aktuellen Approach eine zuvor
unbezahlbare ICE-Rez finanzieren. Die Engine bindet
`CorpRootRezDiscountedIceQuote` an Root-Action, Quelle, ICE, Fort, Run und
StateVersion und verwendet die normale Discount-Kostenquote auf einem
unveränderten Zustandsklon. Der bestehende Defense-Owner lässt diese
Vorbereitung für einen aktuell Engine-gequoteten harten Stop ohne sichtbare
Breakerantwort zu. Er erfindet weder eine spätere LegalAction noch einen
permanenten Rezz: Die befristete ICE-Rez wird nach der tatsächlichen
Root-Zustandsänderung einschließlich Reserven neu bewertet. Andere Forts,
verbrauchte Quellen, Zusatzkosten, variable ICE und unprojizierte
Root-Lifecycle-Effekte begründen diese Vorbereitung nicht.

Für feste und variable Trace-ICE validiert Defense die vollständige aktuelle
Rez-Aktion; bei X zusätzlich Cap, Zusatzkosten, Stärke und Trace-Wert. Eine eigene
`trace_access_block`-Route verwendet ausschließlich die Engine-Quote für
einen bei Corp-Gebot 0 garantierten Run-Abbruch und die sichtbare Breaker-
Antwort. Sie bezeichnet den Trace nicht als bedingungslose ETR-Subroutine.
Die bestehende Score-Reserve bleibt bindend; unter gleich wirksamen Routen
entscheidet der geringere Rez-Aufwand. Die aktuelle Quote zertifiziert nur
`modern_open` mit vollständig bekanntem installiertem Runner-Support, einer
einzelnen Run-Ende-/Runsperre- oder Run-Ende/Hardwaretrash/Schadens-Trace-Subroutine und ohne unbekannte
Encounter-, Post-Bid- oder Cancel-Pfade. Andere Fälle erhalten keine Garantie.
Feste Rez-Quotes tragen keinen erfundenen X-Wert. Die Engine berechnet den
Trace mit dem effektiv projizierten Kartentext und der gesamten öffentlich
belegten Runner-Antwortkapazität. Die Corp-seitige Quote bleibt aus der
Runner-View ausgeschlossen; Gleichstand ist keine Corp-Erfolgsgarantie.
Für einen tatsächlich begonnenen Trace mit fester Wirkung kann die Engine
auch das wirkungsgleiche Mindestgebot 0 zertifizieren. Die Choice-Auflösung
verwendet dann die vorhandene, exakt gebundene Nulloption; sie bewertet keine
neue Strategie und gibt keine zusätzlichen Credits ohne Wirkung aus.

Beim Mindestgebot eines bereits begonnenen Traces stammen Basisstärke und
Gleichstandsregel aus dem aktiven Engine-Profil. `modern_open` rechnet die
öffentlich gebundene gedruckte Trace-Stärke bereits ein; Blind-Profile haben
keine gedruckte Basisstärke. Fehlende offene Basisdaten ergeben
`unknown_trace_context` und keine erfundene Erfolgsgarantie. Gebotsgrenze,
Folgekostenreserve und die aktuelle Choice-/Executor-Bindung bleiben erhalten.
Der native Zustand Paarung 474 G40 D250 belegt Trace 3 gegen höchstens
Runner-Stärke 4: Corp-Gebot 2 garantiert den nativen Run-Abbruch. Gebot 0
garantiert ihn nicht. Ein besserer vollständiger Matchausgang ist damit
nicht nachgewiesen.

Rez ist grundsätzlich eine einmalige Investition in wiederkehrenden Druck.
Die erzwungene Rez-/Trash-Choice gehört ebenfalls zu `corp.defend_servers`.
Der Owner bindet die aktuelle Engine-Option an ICE, Action und StateVersion.
Ein bereits zertifizierter Stop ohne dieses ICE darf eine veröffentlichte
Score-Fortsetzungsreserve vor einer redundanten bezahlten Rez schützen.
Unbekannte Protektion zertifiziert keine Redundanz. Der Resolver übernimmt
nur die Option des aktuellen Defense-Executors; fehlende Bindungen scheitern
geschlossen. Paarung 475, Kontrolllauf 11, G37 D224 belegt den Reserveverlust
durch Puzzle trotz bereits gerezzter Imperial Guard vor dem terminalen Lab-Score.

Ein positiver, exakt belegter Breakpreis darf auch unter dem Rezpreis liegen;
der erste Run muss den Rez nicht allein amortisieren. Nur temporäre
Rez-Aktionen behalten den bisherigen Vergleich für einen einzelnen Run.
Bei mehreren bereits zugelassenen Rez-Routen für dieselbe ICE im selben
Server vergleicht der Defense-Owner nach gleicher Schutzwirkung und gleicher
Zugriffswahrscheinlichkeit auch die bezahlte Wirkungsdauer. Eine ausdrücklich
nach dem Run derezzende Route wird für den aktuellen Run plus die öffentlich
verbleibenden Runneraktionen bewertet; ein dauerhafter Rez bleibt eine
einmalige Zahlung. Dieser begrenzte Investitionshorizont behauptet keine
zukünftigen Runs. Die erste Zahlungsfähigkeit und alle Score-Reserven bleiben
Zulassungsvoraussetzungen. Ein kostenloser temporärer Rez sowie ein bezahlter
temporärer Rez im letzten aktuellen Run behalten ihren Kostenvorteil.
Native Gegenfälle und echte wiederholte Engine-Runs aus Paarung 512 liegen in
`meta-512-pairing-causes.test.ts`.
Öffentlich belegter Schaden, Tags, Tax, Disruption oder eine bedingte
Stop-Wirkung können unabhängig von einer vollständigen Zugriffswahrscheinlichkeit
eine `qualitative_encounter_defense`-Route begründen. Die Engine-Quote muss
an das aktuell angegriffene ICE, den Server und die StateVersion gebunden
sein. Zukunftseffekte ohne verbleibendes Ziel und unbezahlbare Aktivierungen
begründen keinen aktuellen Nutzen.

Ein sofortiger, Engine-zertifizierter positiver Creditgewinn kann außerdem
eine `costless_immediate_credit_gain`-Route begründen, wenn die angebotene
Rez-Action weder Credits, Klicks noch Agendapunkte kostet. Die vollständige
Post-Rez-Quote bindet Quelle, Definition, aktuellen Approach-Server,
StateVersion und Ausgangsbank; ihre Endbank muss dem exakten Gewinn
entsprechen. Debt-Interception ist bereits enthalten. Fehlende, veraltete
oder widersprüchliche Werte und kostenpflichtige Aktionen liefern diese
Route nicht. Die Route bleibt beim alleinigen Rez-Owner
`corp.defend_servers`, beansprucht nur Fortschritt und behauptet keinen ETR.
Score-Reserven berücksichtigen den genau belegten Gewinn; die erneute
Prüfung residenter Routen bindet auch dessen Höhe. Paarung 526, G11 D63 und
G24 D20 belegen drei tatsächlich ausgezahlte Credits ohne Rez-Zahlung.
G15 D87 bleibt als Minotaur ohne äußeres aktives Gate ein Decline-Gegenfall.

Die Route wird erst nach `assessCorpExactIceRezAgainstScoreReserves`
zugelassen: veröffentlichte Score-Fortsetzungen, andere bedrohte Agenden und
notwendige weitere ICE im laufenden Run behalten ihre konkreten Reserven.
Für eine bereits ausgelöste, exakt gebundene bezahlte Umleitungs-Choice
bewertet ebenfalls `corp.defend_servers` den aktuellen Zugriff. Eine spätere
Score-Creditreserve darf einen vollständig bezahlbaren Ausweg vor aktuellem
Matchpoint-Zugriff nicht verhindern, wenn der Zielfort nach eigenen aktuellen
Agendafakten sicher keine Agenda enthält und keine weitere ICE-Fortsetzung
besitzt. Ohne diesen begrenzten Nachweis bleibt die Reserve bindend; die
Choice-Auflösung übernimmt nur das gewählte, stategebundene Ziel. Paarung 475,
Kontrolllauf 7, G39 D318 belegt zwei vorhandene Credits für zwei Credits
Umleitung von Theorem bei vier Runnerpunkten auf den agendafreien Remote.
Umleitungsziele werden am tatsächlich betretenen äußersten bereits gerezzten
ICE bewertet; ungerezzt darüberliegende ICE sind keine Encounter-Protektion.
Ein exakt belegter unmittelbarer Stop darf die statische Agendaexposition des
Zielforts verdrängen. Eine bezahlte Umleitung wird ausgeschlossen, wenn eine
einzige bekannte kostenlose, aktuell nicht brechbare Zielsubroutine zwingend
zum Ausgangsfort zurückführt. Die Ressourcenprüfung verwendet Engine-Breaker-
Quotes und eine optimistische obere Creditgrenze; unbekannte Rig-Effekte,
bezahlte Rückumleitungen, mehrere Rückziele oder andere Encounter-Effekte
liefern keinen solchen Nachweis. Die Entscheidung bleibt bei
`corp.defend_servers`; der Choice-Resolver übernimmt nur ihre gebundene Option.
Paarung 475, Kontrolllauf 8, G6 D147 und G10 D359 belegen die wiederholte
kostenpflichtige Rückkehr ohne Abwehrgewinn. Ein Gesamtmatchsieg folgt aus der
lokalen Vermeidung dieser Zahlungen nicht.
Quotierte Encounter-Aktivierungskosten werden zusätzlich zum Rez reserviert;
eine bereits im Bluffbedarf enthaltene Aktivierung wird nicht doppelt gezählt.
Eine unbekannte Zugriffsprojektion ist weder eine erfundene Stop-Garantie noch
allein ein Grund, bekannt wirksames ICE ungerezzt zu lassen. Tags werden
nicht als garantierter Creditverlust ausgewiesen.

Die Schutzprojektion nutzt `encounterStrength` aus der Engine-Runquote für
öffentliche installierte ICE-Stärkemodifikatoren wie Clown. Die normale
`effectiveStrength` bleibt der aktuelle Wert außerhalb beziehungsweise
innerhalb der tatsächlichen Begegnung. Ohne passende Begegnungsquote bleibt
die exakte Schutzbewertung unbekannt. Der Rezvergleich übernimmt die exakt
gebundene Post-Rez-Quote; X-Stärke erhält je LegalAction eine eigene
`effectivePostRezActionRunQuotes`-Projektion. Andere nicht modellierte
Run-Effekte werden dadurch nicht pauschal als bekannt behandelt.

Regressionen decken die 25 im Clown-Playtest aufgefallenen ICE ab: Bolter
Swarm, Brain Drain, Deadeye, Brain Wash, Bug Zapper, Death Yo-Yo, Digiconda,
Dog Pile, Marionette, Mastermind, Roadblock, Scaffolding, Banpei, Bolter
Cluster, D'Arc Knight, Data Darts, Data Raven, Hunter, Ice Pick Willie,
Jack Attack, Neural Blade, Pocket Virtual Reality, Vacuum Link, Viral 15 und
Virizz. Sie prüfen aktuelle Defense-Routen gegen Krash und zwei Clowns,
keine pauschale Behauptung einer garantierten Run-Verhinderung. Die
Originalentscheidungen von `match_cefc05480ed5b497` bei State 96, 110 und 173
wählen mit dem korrigierten Owner Pocket Virtual Reality statt `decline_rez`.

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
Handentlastung allein rechtfertigt keine weitere Central-Schicht, wenn die
finanzierte aktuelle Route Zugriff bereits verhindert. Bei mindestens zwei
noch ungerezzten Alternativen darf reine Agenda-Handentlastung ohne aktuelle
Run-/Multiaccess-Evidence oder akute/terminale Gefahr keine weiteren
Staging-Kosten erzeugen. Produktiver Score-Support und belegter Central-Schutz
bleiben eigene Defense-Routen.

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

Für denselben zugelassenen Draw-Bedarf vergleicht Defense die aktuellen
Ziehrouten nach Karten pro Aktion, Ziehzahl, Kosten und Netto-Handzuwachs.
Eine zusätzlich Credits liefernde Operation bleibt dabei dem exakt gebundenen
Defense-Plan zugeordnet; ein fehlender Economy-Bedarf darf diese Route nicht
sperren. Die Handplatzprüfung verwendet die gemeinsame Action-Projektion
einschließlich der verbrauchten ausgespielten Karte. Brutto-Ziehzahl und
Deckout-Horizont bleiben getrennte Grenzen. Weder diese Zuordnung noch der
Routenvergleich erzeugen einen zusätzlichen Ziehbedarf oder überstimmen einen
terminalen Score.

Terminale Rez-Reservebedarfe werden aus den aktuellen typisierten
Bedrohungsfakten beider Zentralen entdeckt. Weder ein Abstand von mehr als
einem Agendapunkt zum Runner-Sieg noch die nominelle Auswahl der anderen
Zentrale darf einen exakt gequoteten Bedarf unsichtbar machen. Ein bereits
installierter Schutzpfad bleibt über den bestehenden Defense-Parent und dessen
Economy-Kind finanzierbar. Eine als Kapazitätskonversion zugelassene
ICE-Installation mit belegtem `no_progress` unterdrückt diesen Support nicht;
eine tatsächlich produktive Installation derselben oder einer höheren
Prioritätsklasse behält ihren Vorrang. Kosten, Zustandsversion und Ziel-ICE
werden an der bestehenden Funding-Grenze erneut gebunden und geprüft.

Ein solcher Funding-Need braucht einen aktuell legalen Finanzierungskopf
oder eine exakt gebundene Restricted-Credit-Vorbereitung. Verbleibende Klicks
allein reichen nicht: Eine verpflichtende Choice kann alle Credit-Aktionen
auch innerhalb von `corp_action.main` aussetzen. Der Defense-Factproducer
erzeugt dann keinen leeren Economy-Need; die normale Choice-Ownership bleibt
erhalten und der Economy-Validator behält seine strenge Bindungsprüfung.

Auch eine zugelassene vorbereitende ICE-Installation kann noch eine konkrete
Rezfinanzierungslücke tragen. Schließt ein aktuell legaler, sofortiger und
allgemein verwendbarer Zufluss diese ganze Lücke, und passen Finanzierung plus
Installation in die verbleibenden Klicks, bindet Defense diesen Kopf vor der
Installation an denselben Need. Economy führt den gebundenen Schritt unter dem
Defense-Parent aus; anschließend werden Installation und Rezreserve neu
quotiert. Das verhindert, dass die Installation die Zahlungsschwelle ihrer
eigenen verfügbaren Finanzierung unterschreitet. Bereits finanzierte Routen
bleiben sofort ausführbar. Ohne vollständig belegten aktuellen Präfix bleibt
die bisherige Staging-Bewertung bestehen; andere wirksame Routen derselben oder
einer höheren Priorität behalten ihren Vorrang. Die Zugplanung verwendet
dieselbe Parentbindung und darf keinen nicht mehr bezahlbaren Zufluss hinter
der Installation als Konversion verbuchen.

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

Die Defense-Zuglinie transportiert die Bindung ihres aktuell ausführbaren
Providerknotens ausdrücklich als `supportBinding`: Parent-Planinstanz und
Need müssen beim Zulassen einer aktuellen Route sowie bei ihrer späteren
Spezialisierung exakt mit dieser Route übereinstimmen. Ein servergebundener
Step verlangt außerdem dieselbe aktuelle Zielserver-ID. Die gemeinsam
verwendete globale Defense-Portfolio-ID erlaubt keine Übernahme einer
sachfremden Linie unter einem anderen Score-Parent. Ein vorgeschalteter
Economy-Provider trägt seine eigene exakte Defense-/Funding-Bindung; eine
unabhängige globale Defense-Linie bleibt unabhängig. Nicht passende Linien
werden nicht in diese Route aufgenommen und behalten nur ihre tatsächlich
zulässige eigene Autorität.

Eine eigenständige dringliche Defense-Route behält dabei auch ihre eigene
Prioritätsklasse. Die identische Draw-Action darf beispielsweise nicht die
niedrigere Klasse eines fremden Remote-Score-Supports erben und deshalb
hinter einen Wirtschaftsaufbau verschoben werden. Andere aktuelle
Wirtschaftsheads bleiben mit ihrem eigenen Quell-Owner zugelassen; ihre
Admission ist von der Auswahl gegenüber der dringlichen Route zu trennen.

Auch begrenztes Score-Protection-Staging erhält die bereits bekannte
Central-Rezreserve. Die Defense-Zulassung und die Prüfung eines ausführbaren
vorbereiteten Score-Parents konsumieren dieselbe aktuelle Zentralallokation
und den bestehenden Reservevertrag. Installationskosten und verbleibende
Click-Finanzierung dürfen ein bereits erreichbares Rezbudget nicht verlieren.
Die native Gegenprobe Paarung 493/R1/G24/D96 verwirft so den Remote-Sleeper
bei sechs Credits vor dem gequoteten Sieben-Credit-HQ-Rez. Bei ausreichender
Bank oder bereits gerezztem HQ-ICE bleibt derselbe delegierte Score-Step
zugelassen; der Score-Owner trifft keine eigene ICE-Auswahl.

Jede generische native Defense-Zuglinie trägt die Prioritätsklasse ihres
exakten Signals. Ein Remote-Supportbedarf darf weder eine terminale
Central-Linie auf P6 absenken noch gewöhnlichen Remote-Aufbau durch eine
fremde P2-Linie hochstufen. Ein dringlicher Rez-Bedarf ohne aktuellen
ausführbaren Kopf verdrängt keine ausführbare Installation derselben
Schutzklasse. Gibt es für die bevorzugte Zentrale keine ausführbare exakte
Route, darf Defense eine unabhängig Engine-zertifizierte, vollständig
finanzierte terminale Schließung der anderen Zentrale ausführen, sofern sie
die Ressourcenreserven erhält. Diese Route bleibt autonom gebunden. Ist
die allokierte Route ausführbar, behält sie ihren Vorrang; Teilfortschritt,
unbekannte Bewertung oder fehlende Finanzierung ersetzen den Nachweis nicht.

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
Die konservative Corp-Zugriffsprojektion behandelt einen vollständig geprüften
Pfad mit ausschließlich ungebrochenem direktem Schaden weiterhin als
erreichbar. Ein vom Runner-Pfaddienst verlangter Schadens-Break ist kein
Nachweis einer tatsächlichen Zugriffssperre. Das gilt für die finanzierte
Remote-Reife ebenso wie für den begrenzten Score-Rush; dessen Staging-Pfad
darf die abgelehnte Schutzbescheinigung nicht erneut zulassen. Unabhängige
ETR-, Zahlungs- und Folgesperren bleiben wirksam. Ein eigener belegter
sofortiger Score bleibt bei seinem bisherigen Owner (SP-651, Paarung 555).

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

Ein jüngster öffentlicher Zugriff sperrt die erneute Agendaallokation nur,
solange keine aktuelle Schutz-Neuquote denselben Score-Parent und Server
zertifiziert. Für ein reifes Projekt über mehrere Züge müssen sowohl dessen
stategebundene bekannte Schutzbasis mit null Zugriffswahrscheinlichkeit als
auch das aktuelle Engine-Zweischichtzertifikat vorliegen. Zwei unterschiedliche
bekannte ICE, reale Rez-/Agendapunktkosten und die vollständige Creditreserve
bleiben bindend. Die normale Same-Turn-Klickreserve wird dadurch nicht
abgeschwächt. Projekterkennung und Schwesterprojektverdrängung konsumieren
diesen selben Nachweis; veraltete, falsch gebundene, ungeschützte oder
unfinanzierte Projekte bleiben gesperrt. Paarung 512 G23 D400–401 sichert die
erneute Allokation nach dem tatsächlichen Pflichtziehen ohne erneutes Laden
des residenten Portfolios; der bestehende ungeschützte Reprotection-Gegenfall
bleibt erhalten.

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

Aktivierte Runcredits dürfen eine aktuelle Rezlücke finanzieren, auch wenn
die unbezahlbare Rezaktion noch nicht in `LegalActions` enthalten ist.
`corp.defend_servers` verwendet dafür ausschließlich den vollständigen,
aktuellen Engine-Quote der gerade angegriffenen, ungerezzten installierten
ICE. Instanz, Server und StateVersion müssen übereinstimmen; variable oder
zusätzliche Agendapunktkosten begründen keinen behaupteten Finanzierungsweg.
Nach der tatsächlichen Finanzierungsaktion wird die Rezaktion aus den neuen
`LegalActions` gewählt. HQ-Verlust und ungenutzte, am Runende verfallende
Credits bleiben Kosten dieses Weges.

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

`corp-server-protection-reserve.ts` verbindet konkrete Schutzwege mit dem
Agendarisiko ihres Servers. HQ verwendet die eigene bekannte Hand und die
aktuelle Accessquote; R&D verwendet die eigene Deckzusammensetzung abzüglich
bekannter Karten außerhalb von R&D, niemals die verdeckte Reihenfolge.
Ein Reserveanspruch benötigt eine vollständig quotierte ICE-Teilmenge, die
den sichtbaren Runner-Zugriff stoppt. Bereits gerezzter Schutz benötigt keine
erneute Zahlung; brechbares, unbekanntes oder veraltet quotiertes ICE begründet
keine behauptete Schutzgarantie. Sichtbare Basiscredit-Vorbereitung des Runners
wird im jeweiligen Zeithorizont berücksichtigt.

Vor der Zulassung einer produktiven aktuellen ICE-Rezroute vergleicht derselbe
Defense-Owner deren vermiedenen bedingten Agendapunktverlust mit finanzierbaren
Schutzwegen anderer Server. Ein aktuell möglicher spielentscheidender Zugriff
hat bei belegtem Runstopp Vorrang. Für sonstige Konflikte zählen terminale
Folgebedrohungen zuerst, danach der erwartete Agendapunktverlust bei Zugriff.
Es wird keine Wahrscheinlichkeit für die Wahl des nächsten Runnerziels erfunden.
Ein verbleibender Run teilt dieselben Credits zwischen alternativen Zielen;
mehrere mögliche Runs reservieren die teuersten unterschiedlichen Wege bis
zur Zahl der verbleibenden Runmöglichkeiten. Unfinanzierbare Portfolios erzeugen
keinen unerreichbaren Mindestpuffer. Scorefortsetzung, andere Agendaremotes und
innere ICE des aktuellen Runs bleiben in derselben Ressourcenprüfung;
derselbe Server wird dabei nicht doppelt reserviert.

Ein exakter aktueller `accessBlock` oder `traceAccessBlock` setzt die
Zugriffswahrscheinlichkeit nach der Rezroute im Verlustvergleich auf null.
Eine abstrakte Serverquote darf diesen konkreten Runstopp nicht überschreiben.
Die Vorherquote bleibt maßgeblich: War der Zugriff bereits blockiert,
entsteht kein zusätzlicher vermiedener Verlust. Ohne exakten Stopp bleiben
die quotierten Vorher-/Nachherwahrscheinlichkeiten und die konkurrierenden
zertifizierten Schutzansprüche erhalten.

Auch ein inneres ICE im bereits laufenden Run begründet nur dann eine
Stopping-Rezreserve, wenn seine exakte Zahlung beim Verzicht auf den aktuellen
Rez bereits finanzierbar wäre. Ein zehn Credits teures inneres ICE bei vier
oder sieben verfügbaren Credits blockiert keine unabhängig produktive aktuelle
Abwehr. Sobald diese innere Fortsetzung finanzierbar ist, bleibt ihre volle
Quote im selben Reservevergleich erhalten.

Nach dem letzten Runnerklick entfällt die Reserve für spätere normale Runs.
`run.followupRunOpportunity` erhält öffentlich bekannte Zusatzruns; einen
erfolgsabhängigen Zusatzrun verhindert ein belegter Stopp des aktuellen Runs.
Öffentliche Ereignissequenzen bleiben über `pendingSequenceRunCount` auch nach
einem erfolglosen Run im Horizont.
Eine fehlende Vergleichsgrundlage blockiert die konkurrierende Allokation
sichtbar. Sie entwertet keine unabhängige exakte aktuelle Abwehr, wenn kein
zertifizierter konkurrierender Anspruch existiert oder alle solchen Ansprüche
nach Zahlung finanziert bleiben. `rezReserveAssessment` hält Entscheidung,
Beträge, betroffene Server und unbekannte Vergleichsgrundlagen fest.

Scorevorbereitung, Remote-Rezbudget und verzögerte Economy-Entwicklung
konsumieren die zentralen Schutzansprüche desselben Owners. Eine aus HQ
installierte Agenda wird aus dessen künftiger Exposition entfernt. Bei der
Scorevorbereitung konkurriert die konkret zu schützende Agenda mit dem
Zentralrisiko; eine geringere Zentralbedrohung verdrängt ihren Schutz nicht. Sofortiges
Scoring und bereits vorher zugelassene positive Sofortkonversionen behalten
ihre eigenen Verträge. Die Reserve wird aus jedem neuen Zustand berechnet;
sie ist kein persistierter pauschaler Creditboden. `own.installRezOnlyCredits`
weist den bereits im Creditbestand enthaltenen, zum Zugende verfallenden
Installations-/Rez-Anteil aus. Er finanziert keine Reserve für den nächsten
Runnerzug; eine aktuelle gebundene Zahlung darf ihn weiterhin verbrauchen.
Der actor-sichere D7-
Checkpoint `match-52de-defense-reserve.test.ts` prüft HQ-Erhalt, letzten Klick,
Zusatzruns, ausreichendes Budget, Matchpoint, unbekannte Quotes und Determinismus.

Davon getrennt bleibt die Wirksamkeit reiner bezahlter Rez-Tax bei einem
terminalen Zugriff prüfpflichtig. In Match 52de/D38 zertifiziert die Engine
3 Corp-Credits für Wall of Static und 1 Runner-Credit zum Brechen mit Dwarf.
Der Runner besitzt 6 Credits und greift auf die spielentscheidende Agenda zu.
Die lokale Route bleibt als `exact_resource_exchange` produktiv; mangels
Folgerun greift keine serverübergreifende Reserve. Ein exakt quotierter
Ressourcentausch belegt hier keinen verhinderten Steal. Der offene
Bewertungsauftrag gehört zu `corp.defend_servers`, nicht zu den Spielregeln;
ein anderes einzelnes Rez ist noch kein Nachweis einer rettenden Gesamtlinie.

Eine Rez-Entscheidung ist ein fenstergebundener Urgent-Response-Modus
desselben Verteidigungsplans. Solange dieses Fenster offen ist, beschränkt es
die ausführbaren Defense-Steps auf passende Rez-Aktionen. Es erzeugt keinen
zweiten, gegen HQ-, R&D- oder Remote-Schutz konkurrierenden Verteidigungsplan.
Der Verteidigungsplan darf einen Scoring- oder Remoteplan präemptieren, aber
deren Zustand nicht vergessen.

Auch eine erzwungene ICE-Rez-oder-Trash-Choice gehört ausschließlich
`corp.defend_servers`. Bei variablen Rezoptionen projiziert die Engine jede
bereits kanonische bezahlbare Variante durch ihren echten Rezpfad auf einem
privaten Zustandsklon. `forcedIceRezQuote` bindet Choice, Option, ICE, Server
und StateVersion an sämtliche Zahlungen und die tatsächlichen Subtypen,
Stärke und Subroutinen. Diese Fakten erscheinen ausschließlich in der
Corp-Choice und werden durch die positive DTO-Allowlist übernommen.
Eine fehlende oder veraltete Variantenquote scheitert fail-closed.

Defense vergleicht die vollständig quotierten Varianten. Zusätzliche Zahlung
benötigt bekannten marginalen Zugriffsschutz oder zusätzliche bekannte
Zugriffskosten und erhält veröffentlichte Score-Reserven. Bei unbekanntem
Schutzgewinn begründet die vollständig bekannte Mindestzahlung nur den Erhalt
der ICE; sie bescheinigt keinen Run-Stopp. Ein schon bekannter redundanter
Stopp kann weiterhin Trash zugunsten der Score-Fortsetzung begründen. Der
Choice-Resolver übernimmt ausschließlich die genaue Optionsbindung des
aktuellen Defense-Executors und bewertet keine Variante neu.

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

Der endliche einzelne ICE-Stärkepuls gehört ebenfalls diesem Defenseowner.
Die private aktuelle Enginequote bindet Vorbereitung beziehungsweise
Aktivierung an Quelle, Ziel, Action-ID, StateVersion, Zahlungen, Quellentrash
und Zugende. Der Owner vergleicht die tatsächliche sichtbare Breakroute vor
und nach dem Puls gegen bekannte aktuelle Agendaexposition. Allgemeine
Strengthhints oder eine billige Rootrez allein geben die Route nicht frei.
Der vollständige Consumer ist auf das gerade angegriffene innerste ICE
begrenzt; zusätzliche verbleibende ICE, unbekannte Austauschkosten oder
Wirkungen erzeugen eine ausdrückliche unvollständige Quote. Fehlende oder
veraltete Bindungen scheitern strukturiert. Reale Enginekontrollen belegen
zwei verhinderte unmittelbare terminale Zugriffslinien, keinen garantierten
alternativen Gesamtsieger und keine vollständige Folgerunprojektion.

`decline_rez` wird nur dann als unproduktiv zurückgewiesen, wenn derselbe
Defense-Modus eine exakte, aktuell produktive Rez-Action als Route
materialisiert. Gibt es keine solche Rez-Route, ist Decline die regelkonforme
fenstergebundene Entscheidung und darf nicht durch eine bloße
Rez-Kartenfamilie oder einen allgemeinen Defensebedarf verdrängt werden.

Für eine vollständige aktuelle Post-Rez-Enginequote stammen die qualitativen
Begegnungswirkungen ausschließlich aus ihren Subroutinen. Gedruckte Mechaniken,
Kartentext und allgemeine Hints dürfen fehlende aktuelle Wirkungen nicht
ergänzen. Eine leere Subroutinenliste zertifiziert insbesondere null aktuelle
Subroutinen; das positionsabhängige Trace-Potenzial allein rechtfertigt kein
Rez. Separat quotierte konditionale Encounter-Abwehr bleibt bewertbar.

Eine vollständige Enginequote mit ausschließlich zukünftigen
Encounter-Effekten begründet am innersten ICE keinen aktuellen Rez-Nutzen.
Der qualitative Rez-Consumer prüft diesen fehlenden Folgezustand, bevor
allgemeine Tax-/Disruption-Signale die Route freigeben. Zusätzliche sofortige
Wirkungen und quotierte bezahlte Encounter-Abwehr bleiben eigenständig
bewertbar; eine noch vorhandene innere ICE-Schicht bleibt ein mögliches Ziel.

Auch die qualitative ICE-Installation, die Handentlastung durch Schutzaufbau
und das delegierte Score-Protection-Staging konsumieren diese Positionsgrenze.
Die aktuelle vollständige Post-Install-Enginequote bindet Quelle, Ziel und
StateVersion; ohne nachfolgende ICE begründen reine Folgeeffekte keinen
Schutzfortschritt. Fehlende oder widersprüchliche Quotes bleiben unbekannt
und geben keine qualitative Route frei. Äußere Folge-ICE, sofortiger Schaden
und gesondert quotierte bezahlte ETR-Wirkung bleiben bewertbar. Die gemeinsame
Effektklassifikation liegt beim vorhandenen Defense-Fact-Service; Installation,
Rez und Choice-Continuation erzeugen dafür keine eigene Klassifikation.

Bei `alternate_subtype` bindet die Post-Install-Enginevorschau die ausdrücklich
quotierte Basisvariante ohne Aufpreis: deren kanonische Subtypen, Stärke und
Subroutinen werden gemeinsam projiziert. Die bezahlte alternative Variante
wird dadurch weder gewählt noch als zusätzliche Abdeckung behauptet. Eine
bereits installierte ICE braucht für variable Rezentscheidungen weiterhin ihre
aktuelle gebundene Action. Ungebundene X-Stärke und bezahlte Subroutinen bleiben
unvollständig. Die reale Regression vergleicht Vorschau, Defense-Planroute und
den tatsächlich angewandten Basisrez sowie die unveränderte Eingabestruktur.

Die Klassifikation schließt `set_run_break_subroutine_cost_modifier` ein:
Der Effekt verändert erst nach seiner Ausführung spätere Breakzahlungen.
Ein reiner solcher Effekt ohne verbleibendes inneres ICE begründet keinen
Rez; ein äußerer Einsatz und gemischte unmittelbare Wirkungen bleiben erhalten.

Beim aktuellen Run trennt `corp.defend_servers` den physischen ICE-Eintritt
vom öffentlichen Zugriffsziel. Die Engine projiziert `accessServerOverride`
in beide PlayerViews; der AI-DTO validiert und erhält den existierenden
Server. Nach Breach gilt deren `serverId`, vorher der Override; dessen
fachliche Abwesenheit bedeutet Zugriff auf den angegriffenen Server.
Aktuelle Agendagefahr, marginaler Rez-Nutzen und konkurrierende Rezreserven
verwenden diesen Zugriff, während ICE-Kosten, Topologie und spätere
Protectionclaims am physischen Fort bleiben. Der native Archives→HQ-Fall
belegt die aktuelle Keeper-Abwehr, keinen alternativen ganzen Sieger.

Für mögliche spätere andere Eintrittspfade liefert der kanonische Factsproducer
nur öffentlich installierte, wiederverwendbare unbedingte Runner-Main-Fähigkeiten
mit genau einem Aktionspreis und einem festen öffentlichen `make_run`-Effekt.
Abweichender HQ-/R&D-Zugriff benötigt aktuelle Accessquotes und vollständig
gebundenes eigenes Inventar; fehlende Fakten bleiben unknown. Der Fact
beschreibt eine Möglichkeit, keine Zielwahrscheinlichkeit. Der bestehende
globale Defenseowner lässt sie zur exakten Install-/Fundingprüfung zu;
er garantiert weder ihre Auswahl noch eine vollständig bessere Allokation.

Qualitative ICE-Installationsfreigaben für zentrale Deckung, HQ-Kapazität,
projektgebundenes Staging und Score-Schutz verwenden denselben aktuellen,
instanz-, fort- und versionsgebundenen Engine-Subroutinenstand. Gedrucktes
Potenzial darf keine fehlende aktuelle Wirkung ergänzen. Explizit projizierte
bezahlte End-the-run-Potenziale bleiben für die vorhandene Fundingprüfung
erhalten. Auch die erste zentrale Schicht benötigt einen gegenwärtigen
Schutzeffekt; ein leerer Platz allein erzeugt diesen nicht. Daraus entsteht
kein Verbot einer konkret modellierten späteren Kombination: Eine weitere
äußere Installation benötigt ihren eigenen belegten Projekt- und Wirkungsvertrag.

Aktionsbasierter ICE-Rez-Support darf eine nach vollständiger aktueller,
an ICE-Instanz, Definition, Fort und StateVersion gebundener Engine-Projektion
wirkungslose Zielschicht nicht als direkte Verteidigung aktivieren. Leere
Subroutinen ohne konditionale Begegnungswirkung, bezahlte Begegnungsabwehr
oder positives Rezz-Einkommen rechtfertigen weder temporäre Entsorgung noch
Ratenschuld. Gedrucktes künftiges Potenzial und bloße Stärke ersetzen den
aktuellen Effekt nicht. Unvollständige beziehungsweise Choice-abhängige
Projektionen sind kein Beleg für Wirkungslosigkeit. Ein spekulativer Nutzen
an anderen ICE-Schichten wird damit nicht als bewiesener Schutzeffekt gewertet.
Der globale Defense-Owner dispositioniert dieselbe exakt gebundene Operation
auch ohne aktuelle eigene Route. Sein bestehender Dispositionsvertrag gilt
vor der Handentwicklung; HQ-Overflow darf die abgelehnte wirkungslose Zielwahl
nicht als Handkonversion erneut öffnen. Nützliche Rezz-Effekte behalten ihre
eigenständigen aktuellen Zweckprüfungen.

Konditionale Rez-Supportkarten benötigen einen kartenspezifischen
Folgevertrag. Chester Mix darf nur gerezzt werden, wenn bereits vor dem Rezzen
genau eine produktive ICE-Installation am selben Fort feststeht, der Discount
tatsächlich Kosten spart und die globale Placement-/Rezreserve-Bewertung
positiv bleibt. Rez und Installation bilden eine `locked_sequence`. Nach dem
State-Wechsel wird die neue LegalAction über gebundene ICE-Instanz und Fort
erneut exakt materialisiert; verschwindet diese Fortsetzung, entsteht
`commitment_invalidated` statt einer anderen ICE- oder Serverroute.

Reine persistente ICE-Unterstützung benötigt nach ihrer eigenen Zahlung
weiterhin finanzierte passende ICE. Bereits gerezzte Ziele verursachen keinen
zusätzlichen Rezbedarf; ungerezzte Ziele benötigen vollständige aktuelle,
an Instanz und Server gebundene Engine-Kostenquotes. Die vom Zielprofil
geforderte Mindestzahl muss gemeinsam finanzierbar bleiben. Fehlende oder
veraltete Quotes und zusätzliche ungequotete Kosten begründen keinen
produktiven Support. Das gilt für den allgemeinen persistenten Pfad ebenso
wie für strukturierte ICE-Zielprofile und Fort-Stärke-Unterstützung.
Eigenständige Upgrade-Wirkungen behalten ihre getrennten Owner-Assessments.

Ein passives globales ICE-Support-Asset kann denselben strukturierten
Defensebedarf bereits für seine Installation in einem neuen oder vorhandenen
Remote mit freiem Asset-/Agenda-Slot nutzen.
Die Engine liefert dafür die an Quelle, Ziel und aktuellen Zustand gebundene
Post-Install-Rez-Kostenquote. Zulassung verlangt passende vorhandene ICE,
gemeinsame Finanzierung von Installation, Support-Rez und erforderlichen
Ziel-Rezs sowie den Erhalt des Scorebudgets. Globale Wirkung wird nicht auf
den Quellfort beschränkt. Ein vorhandener Quellfort benötigt zusätzlich
mindestens ein nach Install- und Support-Rez-Zahlung weiterhin finanzierbares
ICE. Bietet dieselbe Quelle eine solche geschützte Route ohne höhere Credit-
oder Klickkosten, wird ihre ungeschützte neue Remote-Route nicht zugelassen.
Die Prüfung vergleicht aktuelle Engine-Quotes; sie vergibt keinen Kartenbonus
und behauptet keinen garantierten Run-Schutz. Die Defense-ID bindet das
konkrete Installationsziel, damit die Signalzusammenführung keine Serverrouten
vermischt. Belegte Asset-/Agenda-Slots werden nicht projiziert oder ersetzt.
Fehlende, veraltete oder unfinanzierte Quotes
und fehlende Ziel-ICE erzeugen keine Installationsroute. Im Folgezustand
materialisiert derselbe Defense-Owner die tatsächliche neue Rez-LegalAction
erneut; die Vorbereitung behauptet weder ein ausgeführtes Rez noch sicheren
Run-Schutz. `corp-structured-ice-support.ts` liefert beiden Phasen dieselben
Ziel- und Fundingfakten ohne Rückimport in die Discovery.

Gemeinsame Hint-Begriffe rechtfertigen keine gemeinsame Rez-Heuristik.
Dr. Dreff wird nur im letzten relevanten Begegnungsfenster desselben Forts
produktiv, wenn sichtbares HQ-ICE unter seinem eigenen Halb-Rez-Kostenvertrag
bezahlbar ist. Jenny Jett besitzt einen getrennten Vertrag: aktueller Run am
eigenen Fort sowie Finanzierung ihrer Rez-Kosten und der aktuellen
fortabhängigen ICE-Installationskosten. Dr.-Dreff-Kostenregeln dürfen nicht
auf Jenny übertragen werden; weitere Karten derselben groben Effektfamilie
benötigen ebenfalls ein eigenes Modell.

Die nachfolgende Dr.-Dreff-Choice bleibt an `corp.defend_servers` gebunden.
Bei einer exponierten eigenen Agenda im angegriffenen Fort oder HQ und
mehreren vollständig quotierten produktiven Optionen vergleicht derselbe
Owner die aktuelle sichtbare Runner-Breakantwort. Die
Engine liefert dafür eine Corp-private Quote mit Karteninstanz, Fort, Run
und StateVersion; sie berücksichtigt das installierte sichtbare Rig und
aktuell verwendbare Run-Credits. Eine Option außerhalb dieser finanzierten
Breakantwort steht vor einer bereits bezahlbar brechbaren Option. Innerhalb
derselben Wirkungsklasse bleibt die bestehende Reihenfolge nach Halb-Rezkosten
erhalten. Fehlt eine erforderliche Quote oder passt ihre Bindung nicht, scheitert
dieser Vergleich sichtbar.

Neben reinen Run-Ende-Subroutinen umfasst der Vergleich einzelne feste
Run-Ende- oder Tag-Traces ohne zusätzliche Encountermechaniken. Die Engine
trennt deren Wirkung ausdrücklich. Nur im offenen Traceprofil kann sie einen
Run-Ende-Trace bei Corp-Gebot null gegen das vollständige sichtbare
Runner-Link-/Zahlungsmaximum und die tatsächliche Breakantwort als sicheren
Stopp ausweisen. Ein Tag-Trace ist kein Run-Ende; eine brechbare Tag-Option
ersetzt diesen aktuellen Agenda-Schutz nicht. Blind-Profile, unbekannte
öffentliche Supportantworten, andere Schäden und zusätzliche Mechaniken
erhalten keine solche Garantie und behalten die qualitative Auswahl.
Die Quote behauptet
keine Abwehr aller möglichen Sonderfähigkeiten des Runners. Zusätzliche
Kosten vor dem Encounter und nicht vollständig quotierte Folgen tragen
keinen Break-Dominanznachweis. `corp-dreff-visible-budget.test.ts` prüft die
Engine-Choice durch den KI-DTO, Budgetgrenzen, Run-Credits, Bindungsfehler,
Sichtbarkeit und Replay. Die Kontrollfälle halten außerdem die bestehende
risikobegrenzte BBS-Bewertung und Score-Konversion vor zusätzlichem Einkommen
fest; ein pauschaler neuer Economy- oder Score-Bonus folgt daraus nicht.

Positionsabhängige Stärke und Subroutinen gehören bereits zur vollständigen
aktuellen Engine-Projektion. Der `relativeIce`-Deskriptor ist deshalb keine
zusätzliche, außerhalb dieser Quote wirksame Encountermechanik. Eine leere
temporäre Begegnung ohne sonstige Wirkung erhält keine produktive Zulassung.
Die nativen Kontrollzustände und ihre Budget-, Profil-, Bindungs- und
Decline-Gegenproben liegen in `meta498-temporary-encounter-defense.test.ts`.
Eine vollständig gequotete kostenlose Vollbreakantwort liefert weder
Zugriffsschutz noch aktuelle Runnerkosten. Solche Optionen werden vor dem
Kostenvergleich ausgeschlossen, auch bei nur einem ICE-Angebot oder einem
Fort ohne Agenda. Bleibt keine Option mit aktuellem Nutzen, bindet derselbe
Owner ausdrücklich die vorhandene Decline-Option. Fehlende oder veraltete
Quotes bleiben ein Bindungsfehler; unmodellierte zusätzliche Wirkungen werden
nicht als kostenlos brechbar behandelt.

Programmzerstörungs-Choices aus ICE-Subroutinen gehören ebenfalls zu
`corp.defend_servers`. `program-trash-signal.ts` bindet das Ziel vor der
TurnPlanner-Routenwahl an Action, Choice, Run und StateVersion. Der
Payload-Resolver liest nur diese Bindung; die einzelne Resolve-Action macht
die fachliche Zielwahl nicht zu einer automatischen Engine-Fensterentscheidung.

`program-trash-coverage.ts` vergleicht pro bereits gerezztem, bekanntem ICE
die vorhandene sichtbare Runner-Antwort vor und nach Entfernung jedes legalen
Programmziels. Es verwendet den bestehenden Run-Pfaddienst mit Engine-Quotes,
dem aktuellen Runner-Creditbestand, sichtbaren Breaker-Creditpools und den
Root-Modifikatoren des jeweiligen Forts. Neu unbezahlbare Antworten stehen
vor bloß verteuerten Antworten; bei gleicher Wirkung entscheiden wie bisher
Breaker-Rolle, Counter, Installationskosten und Speicherbedarf, zuletzt die
Options-ID. Redundante und universelle Breaker bleiben im Vergleich enthalten.

Bereits vorher blockierte ICE erzeugen keinen zusätzlichen Abdeckungsverlust.
Unbekannte oder ungerezzte ICE und ausdrücklich bedingte Sonderpfade tragen
keinen solchen Nachweis. Fehlende oder widersprüchliche Quotes für bekannte,
gerezzte ICE scheitern strukturiert. Dies ist ein Vergleich einzelner aktueller
ICE-Antworten, keine Garantie für den gesamten Run oder künftige Runnerzüge;
verdeckte Runnerkarten werden nicht einbezogen. Die Engine-Fälle in
`corp-program-trash-coverage.test.ts` prüfen Zielwirkung, Ersatzbreaker,
Grenzen, Defense-Ownership, Choice-Bindung und deterministisches Replay.

Hardwarezerstörung nach einem erfolgreichen ICE-Trace bleibt auch nach dem
Run-Ende bei `corp.defend_servers`. `trace-hardware-trash-choice-facts.ts`
prüft den nativen Trace-Ursprung, den expliziten aktuellen Rezstatus, das
öffentliche Runner-Bid-Event und den vollständigen legalen Hardware-Zielsatz.
Weiterhin gerezztes Quell-ICE benötigt seine aktuelle `effectiveRunQuote`;
bereits durch Olivia derezztes Quell-ICE benötigt die vollständige aktuelle,
an Quelle, Fort und StateVersion gebundene Post-Rez-Engine-Quote. Eine
hypothetische Post-Rez-Projektion ersetzt keine fehlende aktuelle Runquote.
Fehlender Rezstatus, falsche Quelle oder unvollständige Effektdaten scheitern
strukturiert. Die drei realen Quellforts und tatsächlichen Engine-Folgen in
`meta-510-agenda-and-trace.test.ts` ergänzen den Derez-Gegenfall.
`trace-hardware-trash-signal.ts` bewertet nur bekannte installierte Hardware
nach öffentlichen Countern und Installationskosten; die Options-ID entscheidet
Gleichstände. Der gewählte Defense-Step bindet Action, Choice, Ziel, Trace und
StateVersion. Der Payload-Resolver übernimmt ausschließlich dieses Ziel und
scheitert bei veralteten oder beschädigten Bindungen. Auch ein einziges
verbleibendes Ziel behält diese Domain-Ownership. Der unveränderte native
Checkpoint und die Gegenproben in `meta-474-trace-hardware-trash.test.ts`
prüfen diesen Pfad einschließlich Run-Ende, Derezzing und Zielbindung.

Auch das anschließende ICE-Lifecycle-Fenster gehört diesem Owner. Die Engine
liefert in jeder Post-Pass-LegalAction das exakte boolesche Fact
`postPassIceTrashedUnlessReturned`. Temporäres Encounter-ICE würde bei
Bezahlen oder Liegenlassen durch das Encounter-Cleanup getrasht; die kostenlose
HQ-Rückkehr erhält dagegen die Karte. Die Bewertung in
`corp/defense/post-pass-ice-lifecycle.ts` unterscheidet diesen Fall von
dauerhaft installiertem Schutz. Fehlt das Fact, scheitert die Bewertung
strukturiert statt normalen Installationsschutz anzunehmen. Die bestehende
StateVersion-, Quell- und Serverbindung des Defense-Plans bleibt erforderlich.

Die Engine liefert zu jedem angebotenen HQ-ICE die effektiven
Subroutinentypen seines temporären Encounters und kennzeichnet zusätzliche
mechanische Effektfamilien. Die AI-DTO erhält diese privaten Choice-Facts.
Installations- und Rez-Lifecycle-Hooks zählen bei dieser weder installierten
noch gerezzten ICE nicht als zusätzliche Begegnungswirkung. Insbesondere
macht Coyotes Rez-Einkommen seine reine Folgestärke-Subroutine hier nicht
produktiv; der Defense-Owner erhält dafür keinen künstlichen Nutzen.
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

Der vertikale Owner liegt in `packages/ai/src/corp/virus-pressure/`:
`virus-pressure-signals.ts` bildet den sichtbaren Druck,
`corp-purge-impact.ts` bewertet aktive Counter, wiederkehrenden Aktionsverlust
und Purge-Kosten, `virus-pressure-plan-module.ts` verantwortet Entdeckung,
Bewertung und Materialisierung. Die Live-Runtime ruft die Signalbildung auf;
die Registry registriert die Factory. Gemeinsame taktische Planstandards liegen
in `plans/corp-tactical-module-support.ts`. Sichtbare zentrale Druck- und
Pflichtzieh-Fakten bleiben gemeinsam nutzbare Eingaben der Purge-Bewertung.

Counter unter ihrer aktiven Wirkungsschwelle erhöhen weder den sichtbaren
Druck noch den materiellen Purge-Wert. Crumble benötigt wie Garbage,
Highlighter und Cascade mindestens zwei Counter; ein einzelner Vienna-Counter
ist bereits aktiv. Insbesondere darf Crumble mit einem Counter neben Vienna
mit einem Counter keine positive Purge-Zulassung erzeugen.

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

Die Implementierung liegt unter `packages/ai/src/corp/economy/`.
`economy-discovery.ts` komponiert die aktuellen endlichen Needs und bindet
ihre Funding-Routen; `economy-signals.ts` besitzt Investitionen, Auszahlungen,
Operationen und die Übernahme konkreter Parent-Bedarfe.
`economy-plan-module.ts` validiert diese Needs und führt Discovery,
Assessment und Materialisierung aus. `economy-routes.ts` bindet aktuelle
Actions, Kosten und Auszahlungen; Asset-Payback und installierte Erträge
liegen ebenfalls im Owner. Typen stehen in `economy-types.ts`.

Eine vollständig Engine-gequotete unmittelbare Auszahlung mit bekannten
Agenda-Punktkosten behält ihren vorhandenen Economy-Owner. Die nachfolgende
Restzugsuche projiziert diesen Preis gegen den eigenen aktuellen und bereits
verbrauchten Punktestand, statt ihn als unbekannte Zusatzkosten zu verwerfen
oder zu übergehen. Pflichtzahlungen behalten ihren Credit-Schutz. Andere
ungeklärte Zusatzkosten erhalten dadurch keine Freigabe; die nächste reale
LegalAction wird nach dem Schritt weiterhin neu angefordert.

Score-Reserve und Defense-Funding bleiben fremde Fachverträge in
`corp/score/corp-score-funding.ts`, `plans/corp-defense-funding-contract.ts`
und `corp/defense/corp-defense-funding-facts.ts`. Economy erhält aktuelle
Parent-/Need-/Provider-Bindungen und bestimmt daraus seine Finanzierungsroute;
es bewertet weder eigene Agenda-Ziele noch globale ICE-Allokation.

Ein bereits zugelassener Defense-Finanzierungsparent darf seinen aktuellen
Basic-Credit-Schritt durch die kostenlose Vorbereitung einer besseren
Auszahlung ersetzen. Dafür muss eine aktuell legale Rez-Action ohne Credit-,
Klick- oder weitere Kosten exakt an eine installierte ungeresste Quelle und
einen zugelassenen `finite_pool`-Campaign gebunden sein. Der kanonische
On-Rez-Pool erlaubt danach im selben Zug eine sonst kostenlose Auszahlung
pro Klick von mehr als einem Credit. Der erste Betrag darf die Quelle nicht
leeren. Verzögertes Startzugeinkommen, bezahlter Rez, fehlender Restklick,
bereits finanzierter Bedarf und andere Funding-Parents tragen diesen engen
Nachweis nicht.

Die Vorbereitung bleibt beim bestehenden Defense-Parent und dessen Need;
sie wird ausdrücklich nicht als schon erhaltenes liquides Einkommen
ausgegeben. Nach dem echten Engine-Rez wird der nun aktuelle Auszahlungskopf
neu quotiert. Eine wichtigere sofortige Installation behält ihren Vorrang.
Paarung 552 R4/G26/D26 rekonstruiert den exakten Originalzustand über 25
Engine-Aktionen: Rez plus Auszahlung liefert bei demselben Restklick sieben
statt sechs Credits. Der vollständige korrigierte Chooser-Prefix installiert
zuerst die Neural Blade und führt danach kostenlosen Rez und Auszahlung unter
dem unveränderten Defense-Finanzierungsparent aus; Replayhash und Endbank
stimmen.

Eine bereits installierte, aktionsweise geladene Creditbank besitzt einen
getrennten aktuellen Restzugvertrag. Die Engine bindet Rez beziehungsweise
Laden, Quellinstanz, kanonische Fähigkeiten, StateVersion, Kosten und die
vollständige Lade-/Auszahlungsfolge an eine aktuelle Quote. Nur zwei oder drei
normale Restklicks und ein strikt höherer liquider Endbestand als bei direkter
Auszahlung plus Basic-Credits beziehungsweise ausschließlich Basic-Credits
begründen diesen Pfad. Es entstehen keine zukünftigen LegalAction-IDs.
Economy materialisiert stets nur den aktuellen Head und revalidiert nach jeder
Transition. Ein Mehrzug-Scorebedarf oder die exakte Rezreserve bereits
installierter ICE kann die Folge als Support übernehmen; eine noch nötige
ICE-Installation darf dadurch nicht ihren letzten Klick verlieren. Andere
aktuelle Einkommensquellen und ein bereits direkt finanzierbarer Score
behalten ihre Finanzierung. Eine aktuelle vollständige Auszahlung aus
sichtbaren Bits braucht kein endliches On-rez-Poolprofil. Laden ohne quotierte
aktuelle Liquiditätskonversion bleibt außerhalb des nachfolgend begrenzten
Investitionsvertrags als unbekannte spätere Entwicklung sichtbar.
Engine- und Chooser-Regressionen liegen in
`hosted-credit-bank-cycle-quote.test.ts` und
`meta-472-hosted-bank-cycle.test.ts` (SP-456, G30/D242).
Die direkte Entnahme bewahrt den nativen Auszahlungsmodus `all_available`
durch Signal und Materialisierung, sofern der exakt quotierte Gesamtbetrag
mit den aktuell sichtbaren Bits übereinstimmt. Sie benötigt keinen fremden
Funding-Parent und bleibt ein eigenes P4-Auszahlungsprojekt. Die Regression
R6 G1/D200 prüft die vollständige Plan-, Step- und Routenwahl für 15 Credits
beim letzten Klick sowie die Ablehnung eines widersprüchlichen Bankbestands.
Feste Teilentnahmen behalten ihren Modus `fixed`.

Bereits gerezzte, kanonisch einfache Lade-/Gesamtauszahlungsbanken besitzen
zusätzlich einen bedarfsgebundenen Investitionspfad in
`corp/economy/hosted-credit-bank-investment.ts`. Der bestehende Economy-Owner
leitet das endliche Ziel aus aktuellen Kosten, vollständigen Engine-Quotes
für Installation mit späterem Rez, eigener Schutzreserve und veröffentlichten
Funding-Bedarfen ab. Die weitere Ladezahl ergibt sich daraus neu nach jeder
Aktion; Guthaben anderer eigener Banken zählt einmal zum Aufbauziel, niemals
als aktuelle Liquidität. Die Rechnung vergleicht den verbleibenden Aufbau
einschließlich Auszahlung mit aktuell angebotenen Einkommensalternativen.
Gedruckte Kartenpreise ersetzen keine fehlenden zukünftigen Kostenquotes.

Ein letzter Ladeklick darf nur über die Zuggrenze wirken, wenn der bestehende
side-sichere Schutzdienst den Bankserver als aktuell nicht erreichbar bewertet
und der eigene Pflichtdrawhorizont die Fortsetzung zulässt. Ungeschützte oder
unbekannte Quellen benötigen eine Auszahlung noch im aktuellen Zug. Ein
konkreter aktueller Finanzierungsbedarf, eine unterschrittene Schutzreserve,
erreichtes Auszahlungsbudget oder Deckende beenden weiteren Aufbau. Die
laufenden Score-/Defense-Finanzierungsrouten und ihre Parent-/Need-Bindungen
bleiben maßgeblich. Der Owner materialisiert allein die aktuelle native
Ladeaktion, gebunden an Quelle, Fähigkeit, sichtbaren Bestand und StateVersion;
der spätere Gegnerzug ist keine garantierte Ressourcenkonversion. Die
Regressionsdatei `hosted-credit-bank-investment.test.ts` prüft Halten, Aufbau
über den Zugwechsel, rechtzeitige Auszahlung, fehlende Quotes und die
vollständige Plan-/Step-/Routenwahl.

Eine vollständig gebundene Ladeaktion ohne aktuell zugelassenen Investitions-
oder Fundingpfad erhält eine ausdrückliche Ablehnung von `corp.economy`, auch
wenn die Engine eine mögliche Restzugfolge quotiert. Die Quote belegt deren
Regelausführbarkeit, nicht den wirtschaftlichen Bedarf. Unbekannte oder
widersprüchliche Bindungen bleiben unbekannt und scheitern am Coverage-Gate.
Die vier nativen Abbruchzustände der Diagnosepaarung 541 sind in
`meta-541-bank-budget.test.ts` gegen erneute fehlende Ownership geschützt.

Ein erreichtes kurzfristiges Budget schließt eine profitablere, vollständig
Engine-gequotete Restzugfolge nicht aus (SP-611). Bei einer bereits aktiven
Bank und sonst ungebundener Kapazität darf Economy neben direkter Auszahlung
oder Basic-Credits die aktuelle Lade-/Auszahlungsquote als eigenes gebundenes Projekt
anbieten. Der bestehende Scheduler und TurnPlanner vergleichen beide Routen;
ausgeführt wird weiterhin nur der aktuelle native Head. Der Zustand aus
Paarung 541, G4/D441, bindet so die weitere Ladung: zwei Aktionen liefern
sechs statt drei Credits Auszahlung und einem Basic-Credit.
Auch eine leere aktive Bank darf diese Alternative anbieten: Paarung 542,
Diagnoserunde G2/D421, liefert mit zwei Restaktionen drei statt zwei Credits.
Eine bestehende bedarfsgebundene Investition bleibt als Alternative erhalten;
die Restzugfolge muss ihr aktuelles Liquiditätsziel vollständig erreichen.
Die Auszahlung des begonnenen Restzugzyklus bleibt beim nächsten nativen
Head zugelassen, auch wenn die Liquidität das kurzfristige Ziel bereits
erreicht hatte. Dafür müssen vorheriger Economy-Executor, unmittelbar
folgende StateVersion, unveränderte Liquidität, letzte Restaktion,
derselbe Bankvorrat und die aktuelle garantierte Auszahlung exakt zur
vorherigen Ladequote passen. Das ist ein zusätzliches Economy-Angebot;
aktuelle höherrangige Score- und Defense-Pläne behalten ihre Priorität.

Offene Parent-Finanzierung, aktuelle Score-/Defense-Fortsetzungen,
andere aktuelle Einkommen, ein Operationsschwellenschritt und Deckende
schließen diese zusätzliche Restzugroute aus. Defense prüft außerdem, ob
eine frühe Auszahlung eine Installation im aktuellen Zug ermöglicht. Seine
bestehenden Installations- und Stagingdienste erhalten dafür ausschließlich
das exakt quotierte Zahlungsbudget nach der Auszahlung beziehungsweise dem
aktuellen Basic-Credit einer leeren Bank; PlayerView,
Geometrie, LegalActions und Kostenquotes bleiben unverändert an den
beobachteten Zustand gebunden. Fehlende Quotes bleiben ausdrücklich unknown
und geben keine freie Restzugkapazität frei. Die nativen Gegenproben in
`meta-542-department-restturn.test.ts` bewahren Crystal-Wall- und
Shock.r-Installation, Corporate-Coup-Vorbereitung und den finanzierten
terminalen Tycho-Score. Eine mögliche zusätzliche Rezroute für mehrzügigen
Bankschutz bleibt davon getrennt mit ihrem eigenen Creditbedarf zu bewerten.

Ein abstrakter `improve_remote_protection_path`-Need sperrt die Restzugbank
nicht allein (SP-612). Der Defense-Owner prüft vorhandene Installationsköpfe
mit ihrem exakten Remote-/Score-Parent und dem quotierten frühen Geldgewinn.
Fehlende ICE in HQ oder bekannte wirkungslose beziehungsweise reservewidrige
Installationen sind kein aktuelles Schutzfenster. Ein echter gebundener
Staging-Head bleibt geschützt. Für einen angebotenen, exakt gebundenen
`new_remote`-Head kann der reine Budgetdienst die ganze Fortsetzung noch
nicht beurteilen: Er meldet ausdrücklich unknown und gibt die Klicks nicht
frei. Credit-Needs des Remotes und andere benötigte Finanzierung bleiben
ebenfalls gesperrt. Die fünf nativen Zustände aus Paarung 542 werden in
`meta-543-department-remote-window.test.ts` samt positiven Remote-Gegenfällen
geprüft; sie liefern keine zusätzliche Ausführungsautorität außerhalb von
Scheduler und TurnPlanner.

Ein verbrauchter optionaler Defense-Suchversuch reserviert keine weitere
Restaktion für sich (SP-613). Sein aktueller, exakt zuggebundener Receipt mit
null verbleibenden Versuchen, null Wert, ohne Actionkopf und früherer
Ausführungs-StateVersion bleibt im Defense-Portfolio als Cadence-Gedächtnis
erhalten. Economy konsumiert ihn nicht als offenes Schutzfenster. Ein noch
ausführbarer Versuch und jeder andere oder unvollständig gebundene
Defense-Bedarf behalten das Veto. Die native Folge Paarung 543 R1 G34/D275–276
prüft den echten Draw und die anschließende Freigabe der Bankkapazität.

Die Verwertung eines eigenen rezzten ICE für Credits benötigt zusätzlich die
Freigabe `corp/defense/corp-ice-liquidation.ts`. Der begrenzte Nachweis erlaubt
eine einzelne statische Schicht, wenn der verbleibende bekannte Pfad den
Runner einschließlich öffentlich vorbereiteter Breaker und Engine-gequotetem
Einkommen des nächsten Zuges weiter vollständig blockiert. Letzte Schichten,
fehlende Quotes und dynamische oder Lifecycle-ICE erhalten keine Freigabe;
für diese Fälle ist eine vollständige Engine-Projektion nach Entfernung nötig.
Economy nutzt den Verkauf ausschließlich für einen gebundenen Parent-Need,
nicht als freie Auszahlung. Eine Fundingroute darf höchstens einen solchen
Verkauf enthalten; danach wird der reale neue Zustand erneut bewertet.
`ice-liquidation-real-engine.test.ts` belegt vier Credits aus einer redundanten
Schicht, erhaltenen Restschutz und das Verbot, beide Schichten in derselben
Fundingroute zu verbrauchen. Dieser Slice behauptet keine allgemeine optimale
ICE-Liquidation oder ein Nachspielen der menschlichen Corp-Entscheidungen.
Die öffentliche Engine-Quote `runnerNextTurnCreditClicks` bleibt im KI-DTO
mit ihrem exakten Wert erhalten; ungültige Werte scheitern sichtbar.
Die Liquidation einer Engine-gequoteten Counter-Bank respektiert den aktuell
revalidierten Score-Decoy-Claim auf genau derselben verdeckten Instanz und
demselben Server. Ein aufgestellter Bluff wird nicht allein wegen fehlender
Remote-Sicherheit sofort aufgedeckt und ausgezahlt. Bereits aufgedeckte Banken
und echte Agenda-Handoffs behalten ihre jeweiligen Score-Routen. Die Ambush-
Signale werden einmal erzeugt und den betroffenen Ownern gemeinsam übergeben.

Die Score-Finanzierung übernimmt die Counter-Freigabe aus
`corp/score/score-counter-bank-funding.ts`. Ein sicherer Bankvorrat bleibt auch
zwischen zwei Advance-Actions eine Score-Investition; ein konkurrierender
gewöhnlicher Liquiditätsbedarf darf ihn nicht auszahlen und danach erneut
aufbauen. Eine höher priorisierte aktuelle Konversion darf eine fremde
Investition freigeben, aber dieselben Counter niemals zugleich als Transfer-
und Creditquelle beanspruchen. Unsichere, nicht anderweitig gebundene Banken
behalten ihre Liquidationsroute.

Der residente Ambush-Owner beendet neue Advancement- und Support-Investitionen,
wenn die Karte dem Runner exakt bekannt ist und die kanonische Access-Projektion
`not_applicable` meldet. Bereits investierte Counter begründen keinen neuen
Bluffwert. Echte Access-Effekte, aktuelle Trigger und Recycling bleiben nach
ihren eigenen Quotes verfügbar; der bloße Rez-Zustand verwirft keine Schadensfalle.

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

Die Implementierung liegt unter `packages/ai/src/corp/punish/`:
`punish-signals.ts` bewertet aktuelle Engine-Quotes und beobachtete
Gelegenheiten; `punish-preparation.ts` bündelt die vorhandene Vorbereitung.
`punish-campaign-plan-module.ts` besitzt Discovery, Assessment und
Materialisierung des Roots. Typen und Routenkriterien werden innerhalb der
Familie mit dem Ausführungs-Owner geteilt. Gemeinsame side-sichere Karten-,
Ziel- und Kostenfakten liegen in `runtime/visible-action-facts.ts`.

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

Die persistente Asset-Vorbereitung konsumiert die bestehenden Score-Remote-
Reservierungen aus `corpReservedScoreServerIds`. Installation und Rez dürfen
keinen Asset-Root vorbereiten, dessen Slot bereits für die Agenda-Installation
reserviert ist. Andere Remotes, kompatible Upgrades und aktuell quotierte
Punish-Konversionen bleiben davon unberührt. Die Sperre entsteht im
Punish-Signal-Owner; die Action-Disposition nennt den Reservierungskonflikt.

Der Normalzustand dieser Kampagne ist ein lauerndes `watch_window`, kein aktiv
abzuarbeitender Komponentenaufbau. Fehlende Damage-, Tag- oder
Trace-Komponenten sind beobachtete Kampagnenfakten, aber noch keine offenen
Action-Needs. Insbesondere erzeugt die Kampagne keinen wiederholten
Targeted-Basic-Draw. Sie wird bei relevanten Änderungen an eigener Hand,
öffentlichem Runnerzustand, Triggern, Credits oder Klicks neu bewertet und
übernimmt erst dann den Vordergrund, wenn eine ausreichend vollständige Route
das Opportunity-Gate erreicht.

Trace-Tag-Routen entdecken neben Operationen in HQ auch kanonisch deklarierte
Corp-Main-Aktivierungen gescorter Agendas. Die Engine zertifiziert dafür die
Score-Zone, exakte Capability, aktuellen LegalAction-Head und Kosten; sie
verwendet denselben side-sicheren Trace-/Präventionsvertrag wie für Operationen.
Eine Agenda in HQ ist keine aktivierbare Quelle. Verdeckte Runnerreaktionen
bleiben unbekannt und werden nicht durch den Quelltypwechsel aufgewertet.

Auch getaggtenabhängiger Meat-Schaden aus einer gescorten Agenda gehört in
diese Quote-Anfragen. Die kanonische aktivierte Corp-Main-Fähigkeit liefert
die Capability-Identität; die Engine prüft Score-Zone, Tagbedingung, Kosten,
Schaden und aktuellen LegalAction-Head. Der Payoff darf einzeln oder neben
einer Schadensoperation laufen. Nach einer Aktivierung wird die wiederverwendbare
Quelle im neuen Zustand erneut gequotet; dieselbe Quelle wird nicht doppelt
in einer vorausberechneten Route gebucht. Ein Profil- oder Legalitätsnachweis
allein ersetzt diesen produktiven Übergang zur Punish-Route nicht.

Dieselbe Schadensroute entdeckt gerezzte Assets und Upgrades in tatsächlich
installierten Roots. Virtuelle Archives-Roots sind keine installierten Quellen.
Die Engine zertifiziert Root-Zone und Servermitgliedschaft, Rez-Zustand,
kanonische Corp-Main-Capability, Tagbedingung und aktuelle LegalAction. Dieser
Slice unterstützt feste Klick-/Creditkosten und nicht limitierte Aktivierungen;
verbrauchende oder anderweitig limitierte Fähigkeiten bleiben fail-closed.
Auch hier wird eine wiederverwendbare Quelle nach jeder Aktion neu gequotet.

Die Vorbereitung erkennt Trace-Support an den tatsächlich erzeugten typisierten
`trace_credit`-Effekten. `scope: trace` unterstützt sichtbare eigene Trace-Quellen
unabhängig vom Installationsserver; `scope: fort` benötigt eine Trace-Quelle
im gebundenen Fort. Ohne sichtbare Quelle bleibt die Vorbereitung unproduktiv.
Eine globale Counter-Pool-Karte erreicht damit den bestehenden vorbereitenden
Punish-Root und seinen materialisierten Step, aber weder liquide Credits noch eine
garantierte spätere Trace- oder Lethal-Quote. Score-Slot-Reservierungen und
Finanzierungsgrenzen bleiben Teil derselben Zulassungsprüfung.

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

`corp/punish/punish-sequence-plan-module.ts` besitzt den ausführenden
Kindplan. `punish-plan-support.ts` bindet aktuelle Head-Kandidaten und
beobachtungsabhängige Fortsetzungen; `punish-route-quote-input.ts` erzeugt
begrenzte Quote-Anfragen und `punish-trace-binding.ts` bindet das bereits
gequotete Gebot an die aktuelle private Engine-Choice. Der Root bleibt
`corp.punish_campaign`; Funding-Need, Execution-Need und Plan-IDs ändern sich
durch diese Quellcodestruktur nicht.

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

Für die Trace-Komponente prüft die Engine-Quote sämtliche aktuell legalen
Corp-Gebote aufsteigend. Die gedruckte Trace-Stärke begrenzt im offenen
Profil die Zahlung nicht; ein teureres, aber gegen die sichtbare maximale
Runner-Antwort garantiert erfolgreiches Gebot erhält seine exakten Kosten.
Ohne eine solche finanzierbare Garantie bleibt die reaktive Route getrennt
ausgewiesen. Profilgrenzen stammen ausschließlich aus den Engine-Optionen.

Ein Funding-Step wird nur geöffnet, wenn sein Klick und die gesamte
verbleibende Route noch in dasselbe gültige Punish-Fenster passen. Ein
langfristig fehlender Credit oder eine fehlende Karte rechtfertigt für sich
noch keine aktive Verfolgung der lauernden Kampagne.

Eine planfremde Aktion wie Closed Accounts darf eine weiterhin lethal
Drei-Aktionen-Flatline-Sequenz nicht aufbrechen.

## 9. `corp.ambush_and_bluff`

Im letzten Root-Rez-Fenster vergleicht der residente Ambush-Owner die
strukturierten installierten Zugriffseffekte vor und nach einem kostenlosen
Rez. Ein vollständig bekannter höherer Zugriffsnutzen bindet die aktuelle
Rez-Aktion an denselben Trigger-Step. Advancement-Counter sind keine
pauschale Voraussetzung: Setup! benötigt keine; Virus Test Site benötigt
einen tatsächlichen Mehrwert gegenüber seinem ungerezzten Effekt. Unbekannte
Projektionen, andere angegriffene Server und unveränderter Nutzen öffnen
diese Route nicht. Auch die Root-Rez-Bewertung liest die Aktivierungsbedingung
aus CardSpec statt sie aus einem allgemeinen Damage-Hint abzuleiten.

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

Ein vorbereiteter installierter Access-Effekt kann den Rez seiner Quelle
benötigen. Am exakt erreichten Quellserver bindet der residente Ambush-Owner
die aktuelle Root-Rezaktion auch bei positiven Creditkosten als Trigger.
Er prüft den bekannten zusätzlichen Effekt nach Rez mit dem verbleibenden
Creditbudget; spätere Access-Zahlungen und gebundene Score-Reserven müssen
gemeinsam finanzierbar bleiben. Vorherige ICE-Fenster, fremde Zielserver,
fehlende Wirkung und unbekannte Kosten begründen diese Route nicht.
Installation und Advancement allein belegen daher noch keine wirksame
Verwendung einer rezpflichtigen Falle wie Experimental AI.

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
an Quelle, Choice, StateVersion, Kosten, Bescheinigung und LegalAction.
Zusätzlich prüft `access-target-expiry.ts` einen begrenzten Zielhorizont:
Bei der letzten Zugriffskarte eines erfolgreichen Runs kann eine ausschließlich
auf installierte Icebreaker wirkende Stärkesenkung keinen späteren Encounter
erreichen, wenn alle öffentlich bekannten Ziele bereits für den Runend-Trash
gebunden sind. CardSpec-Wirkung, Zugriffszonen, tatsächliche Zahlungskosten,
Run-ID und vollständige Zielinstanzmenge gehören zur typisierten Bindung.
Der Resolver revalidiert diese Fakten; Änderungen scheitern fail-closed.
Die nativen G3/D108- und G4/D180-Präfixe aus Paarung530 belegen identisches
Runner-/Breaker-Cleanup mit drei erhaltenen Corpcredits. G1/D296 mit weiterem
Access, G26/D95 mit überlebendem Breaker und G31/D405 mit persistentem
Runnercounter erhalten die Zahlung. Andere bezahlte Zugriffseffekte behalten
ihre bisherige Aktivierung. Die Bewertung ihres längerfristigen Nutzens bleibt
eine gesonderte offene Aufgabe.
Der Window-Resolver besitzt keine eigene Zahlungsstrategie und darf nur die
exakte Auswahl des aktuellen Ambush-Executors vervollständigen. Fehlende oder
veraltete Bindungen scheitern fail-closed. Die menschliche Zahlung bleibt
regellegal; Engine-Ausführung und Zielprüfung bleiben unverändert maßgeblich.

### Vertikale Implementierung von Ambush und Bluff

Öffentliche Programm- und Hardware-Trash-Choices eines installierten
Zugriffseffekts gehören ebenfalls dem Ambush-Owner. Er prüft Quellkarte,
tatsächlich angegriffenen Server, aktive CardSpec-Wirkung, den konkreten
Zieltyp, sichtbare Zielkarten und die vollständige LegalAction-Choice.
Er priorisiert sichtbare Icebreaker, Counter und Installations-/Speicherwert
und bindet Zieltyp sowie vorgeschriebene Anzahl geordnet an den aktuellen
Executor. Die Choice-Auflösung übernimmt ausschließlich diese Auswahl;
falsche Quelle, fremder Zieltyp, fehlende Ziele oder veraltete Bindung
scheitern fail-closed. Hardware-Trash-Operations bleiben beim bisherigen Owner.

Der Owner liegt unter `packages/ai/src/corp/ambush/`:

- `ambush-plan-module.ts`: Parent, Setup-Step, Priorität, Needs und aktuelle Routen;
- `corp-ambush-plan-signals.ts`: Intent- und Quellenbindung, Köder, Fortsetzung und Disposition;
- `corp-access-zone-preparation.ts`: begrenzte Install-/Halte-/Rückmischfolge und Zugriffszonenwert;
- `corp-access-payment-choice.ts`: Bewertung und Bindung bezahlter Zugriffseffekte;
- `corp-access-installed-trash-choice.ts`: Bewertung und typisierte Bindung öffentlicher Programm-/Hardware-Trash-Ziele beim Zugriff;
- `ambush-choice-binding.ts`: exakte Vervollständigung der gewählten Payment-/Bounce-/Trash-Choice.

Defense liefert weiterhin den typisierten Bluff-Schutzbedarf; Economy erfüllt
seine Finanzierung. Die Runtime komponiert diese Fakten und delegiert Choices
an den ausgewählten Ambush-Executor. Gemeinsame Choice-Typen und strukturierte
Bindungsfehler liegen in `runtime/plan-bound-choice-contract.ts`. Der Owner
importiert weder die Tactical-Registry noch den allgemeinen Choice-Dispatcher.

## 10. `corp.hand_and_agenda_management`

Eine freie R&D-Spitzensortierung bleibt auch bei `minSelections` gleich
Optionenzahl eine echte Reihenfolgeentscheidung. Die Engine kennzeichnet
`selectionOrdering: ordered` und bindet die eigene Quelle. Der Hand-Owner
bindet die vollständige sichtbare Permutation und die aktuelle vollständige
R&D-Zugriffsquote. Ohne bereits gebundenen eigenen Draw stellt er Nichtagenden
vor Agenden, dann kleinere vor größere Punktwerte; bei gleicher Exposition
ordnet der vorhandene Handhaltewert. Das verbessert den nächsten Zugriffspräfix
und behauptet keinen optimalen mehrzügigen Deckplan. Der Resolver übernimmt
nur die vorher gebundene Permutation; ein generischer Mengenresolver darf
mehrere geordnete Optionen nicht als erzwungen übernehmen (SP-513).

Der Owner liegt unter `packages/ai/src/corp/hand-management/`.
`hand-development-signals.ts` komponiert Kartenentwicklung und den endlichen
Overflow-Parent; `hand-overflow.ts` revalidiert dessen konkrete Konversionen.
Der endliche Konversionsrest zählt ausschließlich ausgewählte Schritte
dieses Owners. Handverkleinerung oder Klickverbrauch durch Score/Economy
begrenzen das aktuelle Angebot, verbrauchen aber keinen Overflow-Schritt.
Der letzte eigene Auswahlbeleg bleibt über Nebenaktionen erhalten, bis eine
neue eigene Auswahl ihn ersetzt. So bleibt auch ein zwischenzeitlich nur im
Hintergrund gehaltener Overflow-Plan konsistent.
`hand-draw-arbitration.ts` vergleicht Handentlastung und Draw, während
`hand-choice-bindings.ts` Discard, Draw-Filter, Shuffle und Archives-Recovery
an ihre exakte Engine-Choice bindet. Inventarfakten und Zielgebietsdisposition
liegen ebenfalls hier; `hand-management-plan-module.ts` führt die Planroute.

Score liefert seine Serverreservierung und Setup-Bindung über
`runtime/corp-scoreline/score-hand-support.ts`. Die Runtime reicht außerdem
einen eng typisierten Defense-Prüfdienst ein, damit Handentwicklung keine
bereits von Defense bewertete Upgrade-Platzierung übernimmt. Hand besitzt
dadurch weder eine zweite ICE-/Serverbewertung noch den Scorehorizont.

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.

Verantwortung:

- Agenda-Flood und HQ-Exposition;
- sinnvollen Draw, Refresh, Recovery und Discard;
- Agenda in eine Scoreline überführen;
- überzählige Karten im Cleanup zweckgebunden priorisieren;
- Deckout-Risiko und notwendige R&D-Erholung.

Eine eigene Matchpoint-Agenda erhält keinen unbedingten Halteschutz über
einen bereits ausgeschöpften Klickhorizont. Bei einer optionalen Rückmischung
nach dem Score vergleicht Defense die native nächste Zugriffswahrscheinlichkeit
auf genau diese für den Runner terminale HQ-Agenda mit ihrer Exposition nach
dem Shuffle. Die Bewertung berücksichtigt Runner-Vorbereitungseinkommen,
finanzierbaren Schutz, vollständiges eigenes Inventar und aktuelle
Engine-Accessquotes; sie behauptet keine unbekannte R&D-Reihenfolge.
Nur bei belegter geringerer Zielexposition darf Handmanagement den
Matchpoint-Haltebonus entfernen. Aktuelle Planbindungen bleiben geschützt;
fehlende oder veraltete Quotes begründen keine solche Freigabe. Der Score-Owner
bindet die daraus gewählte Kartenmenge vor dem Score an seine Continuation.
Der Choice-Resolver übernimmt weiterhin ausschließlich diese exakte Bindung.

`hand-draw-horizon.ts` bindet eine unmittelbar verfügbare, garantierte
Engine-Zonenänderung als `preserve_draw_horizon`, wenn weniger als drei Karten
in R&D verbleiben und die exakte Aktion diesen Horizont auf mindestens drei
Karten wiederherstellt. Quelle, Action und StateVersion bleiben gebunden;
unaufgelöste Ziel-/Choice-Anforderungen und unbekannte Nettoquoten liefern
keinen solchen Nachweis. Der Hand-Owner führt diese Erholung mit P2 aus und
revalidiert danach. Die Handkapazität richtet sich nach der tatsächlichen
Nettoänderung; ein Refresh kann trotz Ziehen die Hand verkleinern. Auch die
allgemeine Draw-Zulassung erhält das Vorzeichen der R&D-Nettoänderung:
Wiederauffüllen ist negative Deckkonsumption, kein Draw mit Nullverbrauch.

`hand-start-draw.ts` entscheidet optionale Scored-Agenda-Startdraws vor der
Payload-Auflösung als exakte Handplan-Choice. `corpStartDrawQuote` stammt aus
derselben Engine-Zusammenfassung wie der folgende Pflichtdraw: Pflichtkarte,
verpflichtende Agenden, Skivviss und bereits zugesagte optionale Karten zählen
gemeinsam. Source und StateVersion bleiben durch die Actor-DTO erhalten;
fehlende oder ungültige Daten erlauben keine Ersatzschätzung.
Ein Zusatzdraw benötigt freien Handplatz nach allen bereits feststehenden
Draws und lässt mindestens zweimal die aktuell quotierte Pflichtdrawrate
in R&D. Das ist eine konservative Reserve bei unverändertem Pflichtdrawdruck,
keine Zusage gegen künftige Mill-Effekte. Bedarf besteht bei höchstens zwei
Handkarten nach den feststehenden Draws oder bei einem vom Score-Owner
benannten leeren, bereits finanzierten Remote mit Engine-quotierter
Run-Reibung und fehlender Agenda in HQ/aktiven Remotes. Agenda-Karten in
Archives verhindern diese Suche nicht. Die konkrete Installation und
Risikoprüfung erfolgt erst nach Beobachtung der gezogenen Karte.

Regionsvergleiche verwenden die Funktionssignale sowohl der neuen als auch
der installierten Karte. So kann Handüberlauf keinen vermeintlichen
Mehrwert aus einer unvollständigen Beschreibung der alten Region ableiten.
Der bestehende Placement-Vertrag bleibt zuständig; nachweislich produktive
Regionswechsel sind weiterhin zulässig (SP-383).

Ein auf eine Agendenkategorie beschränkter Same-Fort-Rabatt benötigt eine
bekannte passende Agenda im Zielfort. Ein vorbereiteter, ICE-geschützter
Remote darf stattdessen eine passende bekannte HQ-Agenda binden, wenn ihre
exakte aktuelle native Root-Installation in genau diesen Fort angeboten
wird. Source, Karte, Fort und StateVersion müssen übereinstimmen. ICE allein,
eine unbekannte Karte oder eine unpassende Kategorie liefert diesen Nutzen
nicht. Gemeinsamer Placement-Vertrag, Installation und Regionsvergleich
verwenden dieselbe Zulässigkeit; unbeschränkte Rabatte behalten ihren
bisherigen Prepared-Remote-Vertrag (SP-595).

Der bestehende Zielgebietsvergleich bewertet einen eigenen kostenlosen
Archives-Zugriffseffekt als Nutzen des Abwerfens. Diese Anpassung gilt nur
für das Ziel Archives; eine R&D-Rückführung bleibt separat bewertet. Cleanup
verwendet dieselbe Disposition, behält konkrete Parent-Bindungen und den
Schutz vor entscheidender Agenda-Exposition aber bei. Weder Installation noch
garantierter Zugriffsschaden werden aus einer Ambush-Rolle abgeleitet.

Bei unmittelbar offenen Archives bewertet der bestehende Discard-Plan die
bekannten Agendapunkte aus eigenen Archives zusammen mit Runnerpunkten und
dem gesamten neuen Discard-Batch. Eine dadurch sofort siegentscheidende
Exposition hat Vorrang vor einer Nichtagenda-Retention; der Schutz konkreter
Planbindungen bleibt für nichtterminale Abwürfe erhalten. Unbekannte
Agendapunkte in diesem erreichbaren Zielgebiet scheitern fail-closed. Die
bereits ausgewählte Handplaninstanz bindet weiter genau dieselbe
Engine-Choice, Action und StateVersion; der Payload-Resolver bewertet nicht
erneut und öffentliche Archives-Spiegel ersetzen die eigene Zonenprojektion
nicht.

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
Bestätigt diese Neubewertung erneut ein machbares letztes Matchpointfenster,
veröffentlicht auch die Advance-Phase `lastDrawScoreSurvival`. Nur den
Fristtext zu erhalten, würde die erforderliche P2-Priorität gegenüber
gewöhnlicher Rez-Finanzierung verlieren.

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

Ein aktueller Same-Turn-Score darf den exakt legalen Rez einer eigenen
installierten Advancement-Quelle als ersten Schritt binden. Die eng begrenzte
Projektion in `corp-installed-advancement-preparation.ts` akzeptiert nur eine
kanonische, bedingungslose Corp-Main-Fähigkeit mit genau einem festen Klick-,
einem festen Creditpreis und einer einzelnen Counterplatzierung auf ein
installiertes Ziel. Rezpreis und aktuelle Source-/Server-/StateVersion-Bindung
stammen aus der LegalAction; die vollständige Folge muss gemeinsam finanziert
sein. Nach Rez wird die wirkliche Aktivierungsaction neu von der Engine
angefordert und im bestehenden Score-Parent bewertet. Eine zukünftige Action-ID
wird nicht erfunden. Der Regressionstest aus 461 R9 G5 D207 belegt den zuvor
fehlenden Rezschritt vor dem sofortigen Gewinn.

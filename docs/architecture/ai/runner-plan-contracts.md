# Runner-Planowner: Aufgaben und Grenzen

Status: **aktuelle fachliche Verträge mit ausdrücklich offenen Fähigkeiten**  
Stand: 2026-09-10

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

Ein Zentralzugriff am Runner-Matchpoint darf ohne aktuelle Remote-Scorebedrohung
das vorhandene Runbudget verbrauchen. Die allgemeine gewünschte Auffüllreserve
ist dann keine zusätzliche Restguthabenpflicht; der Sicherheitsfloor, reale
Pfadkosten und die Reserve für unbekanntes ICE bleiben verbindlich. Eine
vorhandene Remote-Bedrohung behält ihre Reserve.

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

`draw_for_answer` ist nur zulässig, wenn:

- eine konkrete fehlende Antwort benannt ist;
- ein Draw diese Antwort plausibel liefern kann;
- Handüberlauf und verbleibende Folgeaktionen den Plan nicht entwerten.

## 4. `runner.rig_and_coverage`

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

Eine exakt gebundene Upgrade-/Kosten-Recovery-Route bleibt an ihre gewählte
Karteninstanz gebunden. Weitere Handkopien derselben Definition, die nur
diesem Bedarf zugeordnet sind, erhalten eine ausdrückliche Zurückstellung
beim Coverage-Owner; sie erzeugen weder einen zweiten generischen
Entwicklungsplan noch eine Lücke in der LegalAction-Klassifikation. Lehnt ein
exakt gebundener Zentraldruck-Parent seinen aktuellen Payoff mit einem Wert
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

Sichtbare additive Programme mit `conditional_support` dürfen ihren echten
MU-Verbrauch in den bevorzugten simultanen Meilenstein eines bereits
vorhandenen required-/preferred-Coverage-Parents einbringen. Sie erzeugen
selbst keinen Capacity-Parent. Der daraus abgeleitete MU-Ausbau bleibt beim
Coverage-Owner und wird vor der Memory-Projektion aus demselben gebundenen
Demand-Set berechnet. So kann ein künftiger Breaker zusammen mit bereits
sichtbaren kompatiblen Run-Credit-Programmen eine frühe MU-Vorbereitung
begründen, ohne aus allgemeiner Programmdichte ein Zielrig zu erfinden.

Ein Basic Draw für eine im eigenen Deck side-sicher bekannte Antwort wird als
exakte Route dieses Coverage-Plans gebunden. Eine volle Hand ist dabei keine
harte Sperre: Der Plan darf den sichtbaren Cleanup-Trade-off bewerten, wenn die
fehlende Rolle konkret benannt ist und die Antwort nachweislich noch im Stack
liegt. Er darf dafür jedoch keinen lediglich allgemein legalen Draw anhand des
semantischen Typs übernehmen; die konkrete `actionId` muss vom Coverage-Support
gebunden sein.

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

Der Vergleich sichtbarer Breaker-Modusvarianten erhält bei gleicher
Zugänglichkeit zuerst bezahlbare Antworten auf bekannte ICE-Gefahren.
Eine teure Gefahrenvermeidung darf nicht als Ersparnis verschwinden, nur weil
eine kostenpflichtige Umstellung sie unbezahlbar macht. Erst danach vergleicht
die Pfadquote die verbleibenden Kosten. Die konkrete Run- und Risikowahl bleibt
beim gebundenen Planowner.

Bei einer noch nicht installierten konfigurierbaren Breakerkarte berücksichtigt
derselbe Coverage-Owner die typisierten `coverageCandidates` des kanonischen
Hints. Sie sind mögliche zukünftige Modi und keine gleichzeitig aktive
Rig-Abdeckung. Der konkrete Installationspfad bleibt an Quelle, LegalAction,
Rolle und Parent gebunden; die Engine-basierte Pfadprüfung wahrt Moduskosten
und die Bindung einer einmaligen Moduswahl. Feste Deckdoktrin-Rollen dürfen
diesen nachgewiesenen Installationspfad nicht erneut verwerfen.

## 5. `runner.develop_board_and_hand`

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** registrierter produktiver Owner; Fähigkeitsgrenzen siehe Einstieg.
Ein pauschaler `play_best_hand_card`-Owner existiert nicht.

Verantwortung:

- eine strategisch nützliche Karte spielbar machen;
- ein Deck- oder Board-Engine-Stück entwickeln;
- sinnvollen Draw, Search, Install oder Eventeinsatz koordinieren;
- generische Karten ohne eigenen Spezialplan verwertbar machen.

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

## 6. `runner.economy`

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

Run-Funding entsteht nur aus einer echten, berechneten Lücke des gebundenen
Runplans. Der Bedarf ist das Maximum aus dem noch offenen Route-Gap und der
Unterschreitung des nach dem Run zu schützenden Credit-Floors; ein künstliches
Mindest-Gap ist unzulässig. Ist das Ziel bereits direkt positiv konvertierbar,
entsteht kein Funding-Step. Existiert ein anderes direkt ausführbares,
positiv bewertetes Runziel, gibt ein nicht dringlicher Funding-Step diesem
Run den Vorrang. Nur eine belegte akute Score-Bedrohung darf diese
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

## 7. `runner.defense_and_recovery`

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

Wenn eine notwendige Prävention oder Recovery nicht auf der Hand liegt, darf
das Modul planintern Draw-, Search-, Funding- und Installations-Steps
erzeugen. „Abwehr“ bezeichnet damit das Ziel, nicht nur eine aktuell
verfügbare Abwehraktion.

## 8. `runner.convert_run_window`

Ein Run mit unbekanntem verbleibendem ICE bindet die beim Start akzeptierte
side-sichere Risiko- und Reservequote an seine Root-Planinstanz. Das gebundene
`runner.convert_run_window`-Leaf quotiert denselben Vertrag an jedem
Jack-out-Fenster mit dem verbleibenden ICE, aktuellem Credit- und Handpuffer
sowie dem aktuell sichtbaren Corp-Rez-Potenzial neu. Erst eine materielle
Verschlechterung gegenüber dem akzeptierten Startvertrag begründet eine
Jack-out-Präferenz; ein unveränderter Grenzfall erzeugt weder einen neuen Plan
noch eine zweite Entscheidungsautorität.

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

Das Modul besitzt kein unabhängiges langfristiges Ziel. Es gehört logisch zum
auslösenden Run-/Contest-Plan und kehrt anschließend dorthin zurück.

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

Die bekannte Remote-Vorprojektion und die aktuelle Access-Konversion nutzen
dieselbe kanonische Trash-Impact-Bewertung. Die Vorprojektion erhält die
aktuelle Economy-Reserve; endliche Kreditpools, tatsächlich vorhandene
transferierbare Advancement-Counter und kanonische Schadens-/Tag-Effekte
bleiben getrennte Wertquellen. Ein leerer Kreditpool erzeugt kein weiteres
Einkommen. Fehlende kanonische Kartendaten scheitern strukturiert.

Die reine Trash-Bewertung liegt unter `access/`; der Runtime-Adapter bindet
sie an die tatsächlich angebotene Trash-Action und deren zweckgebundene
Credit-Quote. Wiederkehrende Draw-Tag-Effekte werden über die kanonische
Capability `runner_draw_tax_tag` als Schadens-/Tag-Gefahr erkannt. Dadurch
kann deren Beseitigung einen vorübergehenden Reservefehlbetrag rechtfertigen,
ohne den Reservebedarf oder dessen Liquiditätskosten zu senken. Nach dem
Run bleibt der endliche Auffüllbedarf beim Economy-Owner verfügbar; eine
stärkere aktuelle Run-Gelegenheit kann weiterhin vorgehen.
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

Das plan-eigene Informationsgedächtnis ist privilegierter lokaler
KI-Zustand. Es erweitert weder PlayerViews noch PublicEvents und darf nicht
als allgemeine Hidden-Info-Quelle verwendet werden. Im TurnPlanner wird der
Informationswert in der vorhandenen Flexibilitätsdimension bewertet; eine
neue globale Bewertungsautorität entsteht nicht.

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

Die vorab gebundene Reserve für unbekanntes ICE gilt auch vor dessen
Informationsgrenze: Bekannter Schaden darf den reservierten Handpuffer nicht
verbrauchen; seine Vermeidung darf nur aus Credits außerhalb derselben
Reserve finanziert werden. Im laufenden Informations-Encounter schützt der
bestehende Schadens-Break-Owner diesen Handpuffer auch dann, wenn der Schaden
allein noch nicht tödlich wäre. Eine bereits gequotete einmalige Zahlungsquelle
wird im exakten Kostenfenster verwendet, wenn sie die nach der Zahlung fehlende
Creditreserve für den weiterhin unbekannten Restpfad vollständig finanziert.
Plan, Quelle, ursprüngliche Action und Engine-Fenster bleiben dabei gebunden.

Das Informationsbudget darf ebenso einen bereits zugelassenen bezahlbaren
Break gegen die unmittelbare Zerstörung eines installierten Programms nicht
sperren. Der bestehende Run-Executor bindet diese Schutzroute an die exakten
verbleibenden Subroutinen der Engine-Continue-Action. Bereits gebrochene
Programmzerstörung begründet keine weitere Ausgabe gegen bloßes End-the-run;
fehlende oder widersprüchliche Restquoten scheitern strukturiert.

Eine spätere Vacuum-Link-Choice darf ebenso aus einer exakt gebundenen
Run-Executor-Phase hervorgehen, deren Root ein übergeordneter Restricted-Run-
Plan ist. Der bestehende Continuation-Owner prüft Commitment, Source-Plan,
Phase, Node, Lease, Parent und die lückenlose Run-/Rez-Ereigniskette. Die
letzte freiwillige Entscheidung muss dabei nicht unmittelbar vor dem
auslösenden Subroutinenfenster liegen; verpflichtende Engine-Fenster eröffnen
keinen neuen strategischen Owner.

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

## 11. `runner.credit_bank` und `runner.recurring_economy`

**Status:** separate registrierte Core-Owner innerhalb der Economy-Domäne.
`credit_bank` besitzt Laden und Auszahlung einer konkreten Bank, einschließlich
endlichem Ziel, Reserve und Cadence. `recurring_economy` bewertet die aktuelle
wiederkehrende Einkommensquelle. Beide konsumieren ihre typisierten Signale
aus `runnerContext`; Finanzierung eines fremden Ziels bleibt an dessen Bedarf
gebunden. Die Beschreibung von Economy als gemeinsamer Fachaufgabe in
Abschnitt 6 hebt diese tatsächlichen Modulidentitäten nicht auf.

## 12. `runner.resource_lifecycle`

**Status:** registrierter Core-Owner. Er besitzt instanzgebundenes Halten,
Verlassen und verpflichtende Folgezustände einer eigenen Ressource, etwa
eine Engine-gequotete End-of-turn-Zahlung. Erwerb und anfängliche Finanzierung
bleiben beim jeweiligen Entwicklungs-/Economy-Parent. Eine Folgewirkung
berechtigt den Choice-Resolver nicht zur unabhängigen Ressourcenwahl.

## 13. `runner.shell_traders_pipeline`

**Status:** registrierter Core-Owner. Ein Pipeline-Signal bindet die konkrete
Quelle, das vorbereitete Programm-/Hardwareziel und die Phase
`prepare`, `progress` oder `hold`. Discovery hält diese Identität resident;
Assessment und Materialisierung verlangen die aktuelle passende Route.
Fortschritt darf kein wertvolleres Rig opfern; eine nicht gebundene Karte
wird nicht als Ersatz installiert.

## 14. `runner.score_installed_agenda` und `runner.secure_terminal_win`

**Status:** registrierte Core- beziehungsweise Tactical-Owner.
`score_installed_agenda` besitzt die legale Score-Konversion einer eigenen
installierten Agenda. `secure_terminal_win` besitzt die aktuell belegte
terminale Route mit validiertem Prioritätsanspruch. Beide verlangen genaue
Quellen-/Ziel-/Kostenbindung; ein Terminalsignal übernimmt keine fremde
Run- oder Entwicklungsentscheidung. Der Systemowner `runner.complete_turn`
folgt ausschließlich dem [EndTurn-Vertrag](planning-architecture.md#17-endturn-vertrag).

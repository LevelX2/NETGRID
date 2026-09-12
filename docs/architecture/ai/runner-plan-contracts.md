# Runner-Planowner: Aufgaben und Grenzen

Status: **aktuelle fachliche Verträge mit ausdrücklich offenen Fähigkeiten**  
Stand: 2026-09-11

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

### Vertikale Implementierung des Zentraldrucks

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

Ein Remote mit genau einem bekannten, gerezzten Damage-Ambush konsumiert
bereits vor dem Runstart dieselbe quellgebundene Abbruchbewertung wie das
Run-Window. Der Remote-Owner sperrt dafür seine Run- und Vorbereitungsvarianten
mit expliziter Evidence; ein bereits laufender Run behält seinen gebundenen
Parent und die bestehende Jack-out-Entscheidung. Unbekannte, ungerezzte oder
gemischte Roots erfüllen diese spezifische Abbruchbedingung nicht.
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

Der vertikale Owner liegt in `packages/ai/src/runner/rig-coverage/`.
Die Dateien trennen Lückenbildung (`coverage-signals.ts`), Breaker-Aufrüstung,
Kosten-Recovery, Search-/Install-/Funding-Unterstützung, Actionzuordnung,
Dispositionen und exakte Fortsetzungsbindungen (`coverage-bindings.ts`).
`coverage-plan-module.ts` besitzt die Planphasen und Materialisierung.
Suchbedarf und Upgrade-Ökonomie liegen ebenfalls in diesem Verzeichnis.

Ein Zahlungsfenster erhält die exakt ausgewählte Coverage-Aktion auch in
`draw_for_answer`. Der bisherige Executor muss die Originalaktion in
`drawForAnswerActionIds` führen; Phase und benötigte Breaker-Rolle bleiben
unverändert. Für `install_answer` gelten entsprechend die Install-IDs,
für `search_answer` zusätzlich die konkrete Suchziel- und Versionsbindung.
Fehlende oder abweichende Bindungen scheitern mit `invalid_support_graph`;
die Zahlungsunterstützung erzeugt weder einen neuen Bedarf noch ein Suchziel.

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

Eine exakt gebundene Antwort im eigenen sichtbaren Heap bleibt unabhängig
von verbleibenden Stack-Antworten eine Recovery-Route. Eine Suchaktion darf
nicht zugleich als passende Heap-Rückholung und als Suche ohne Deckantwort
klassifiziert werden. Der Coverage-Support trennt diese Mengen vor der
Speicher- und Opferbindung; deren tatsächliche Ablehnungen bleiben wirksam.

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

Die aktuelle Kostenprojektion für Pump und Break trennt liquide Credits von
den tatsächlich verwendbaren sichtbaren Run-/Breaker-Pools. Sie verwendet
dieselbe zweckgebundene Zahlungsprojektion wie die Encounterbewertung;
separate Bankaktivierungen erzeugen dabei kein vorweggenommenes Guthaben.
Die Restzugplanung erhält nur den liquiden Zahlungsanteil als Cash-Bedarf.
Action-ID, Ziel, Kosten der Engine und Run-Owner bleiben unverändert. Nach
der Aktion endet die Projektion an der Engine-Fortsetzungsgrenze, sodass
ein verbrauchter Pool nicht erneut aus dem alten Zustand ausgegeben wird.

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
bleiben getrennte Wertquellen. Ein leerer bereits gerezzter Kreditpool erzeugt
kein weiteres Einkommen. Bei einer bekannten ungerezzten Quelle zählt eine
kanonisch belegte `on_rez`-Initialisierung separat als zukünftiger Poolwert,
abzüglich der kanonischen Rezkosten. Dafür müssen Initialisierung, Menge und
Ziel `source` belegt sein; fehlender Rezzustand erzeugt keinen Zukunftspool.
Fehlende kanonische Kartendaten scheitern strukturiert.

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
wiederkehrende Einkommensquelle. `runnerContext` verdrahtet beide Owner;
Finanzierung eines fremden Ziels bleibt an dessen Bedarf gebunden.
Die Beschreibung von Economy als gemeinsamer Fachaufgabe in
Abschnitt 6 hebt diese tatsächlichen Modulidentitäten nicht auf.

### Vertikale Implementierung der Bank

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

### Benannte gemeinsame Dienste

`RunnerCreditBankServices` erhält fünf Funktionen, die im selben
`runnerContext` an aktuellen Input, Kandidaten und Economy-Facts gebunden werden:

- `hasExactRunUrgency`: belegte Dringlichkeit des konkreten Runziels;
- `requiredPostRunReserve`: notwendige Reserve nach diesem Run;
- `terminalVisibleHazardFundingGap`: konkrete Finanzierungslücke eines
  terminalen Remote-Contests;
- `isDirectlyMandatoryRun`: bereits direkt konvertierbare Pflichtlinie;
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
Finanzierungsentscheidungen verwenden die bestehenden exakten Demand- und
Route-Suchen; der Schnitt ergänzt keine neue Parentkante im Scheduler.

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

## 14. `runner.score_installed_agenda` und `runner.secure_terminal_win`

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

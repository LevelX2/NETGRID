# KI-Programmlogik – Änderungskompass

Status: **verbindliches Agenten-Konzentrat**  
Stand: 2026-08-02

## Zweck

Dieses kurze Dokument ist vor jeder Änderung an produktiver
KI-Programmlogik vollständig zu lesen. Es verdichtet Haltung, Autoritätskette
und Pflichtentscheidungen aus zwei führenden Gesamtkonzepten:

1. Allgemeines KI-Zielbild:
   `ki-zielbild-metaebene-2026-08-02-v6.md`
2. Detailliertes Planebenen-Zielkonzept:
   `ai-plan-layer-target-state-wip.md`

Bei Unklarheit oder einer Änderung am gemeinsamen Rahmen sind die betroffenen
Abschnitte beider Gesamtdokumente selbst zu lesen. Dieses Konzentrat ersetzt
sie nicht.

## Gemeinsamer Pflegevertrag

Dieses Dokument bildet mit folgenden beiden Gesamtdokumenten einen
verbindlichen Dreierverbund:

- `ki-zielbild-metaebene-2026-08-02-v6.md`;
- `ai-plan-layer-target-state-wip.md`.

Bei jeder inhaltlichen Änderung an einem der drei Dokumente muss geprüft
werden, ob Begriffe, Haltung, Autoritätskette, Ownership, Planvertrag,
Leitplanken oder Pflichtnachweise in den beiden anderen Dokumenten ebenfalls
angepasst werden müssen. Eine Änderung gilt erst dann als dokumentarisch
abgeschlossen, wenn entweder alle betroffenen Stellen synchronisiert sind
oder ausdrücklich festgestellt wurde, dass die beiden anderen Dokumente
inhaltlich unverändert gültig bleiben.

Das allgemeine Zielbild erklärt das **Warum und die Gesamtarchitektur**, das
Planebenen-Konzept den **detaillierten Plan- und Ausführungsvertrag**, dieser
Kompass die **verbindliche Handlungsanweisung für Agenten**. Keines der drei
Dokumente darf stillschweigend eine abweichende Entscheidungsautorität
einführen.

## Die Haltung

1. **Engine-Korrektheit zuerst.** Die Engine erzeugt LegalActions und bleibt
   einzige Regelautorität. Die KI bewertet und bindet nur aktuelle legale
   Angebote.
2. **Nur Pläne handeln.** Eine Action besitzt außerhalb einer gewählten
   Planinstanz, ihres Steps und ihrer Route keine Handlungsautorität.
3. **Genau ein fachlicher Owner.** Bestehende Owner werden erweitert. Es
   entsteht kein zweiter Chooser, Override, Resolverplan oder versteckter
   Fallback.
4. **Generische Funktion vor Kartenname.** Wiederverwendbare Fähigkeiten
   werden über Hints, Action-/Ability-Semantik, TargetProfiles und
   Engine-Quotes erkannt. Karten-IDs binden konkrete Instanzen; sie ersetzen
   keine Funktions- oder Strategiebewertung.
5. **Doctrine berät, sie kommandiert nicht.** DeckDoctrine wird aus einer
   ausführbaren Rollenkomposition abgeleitet und beeinflusst Intent,
   Planbildung und Linienwerte. Sie wählt keine Action.
6. **Zugkohärenz vor lokalem Aktionswert.** Der TurnPlanner vergleicht
   vollständige unterstützte Restzuglinien. Planmodule liefern Beiträge und
   behalten ihre Domainlogik.
7. **Unsicherheit bleibt sichtbar.** Unknown ist weder null noch ein
   pauschales Verbot. Es blockiert nur die unbewiesene Behauptung und darf
   keine unabhängige bekannte Route löschen.
8. **Kein Fix durch Verdeckung.** Fehlende Planabdeckung, unvollständige
   Quotes und mehrdeutige Bindung scheitern fail-closed. Ein grüner Einzeltest
   rechtfertigt keinen Architekturbruch.

## Autoritätskette

```text
Engine/CardImplementation
→ strukturierte Hints und Funktionseffekte
→ ActionSemanticCandidate
→ DeckDoctrine / Strategic Intent / aktuelle Signale
→ residente Planinstanz und Parent-/Need-Beziehungen
→ Planning Head
→ TurnPlanner-Linienvergleich
→ TurnPlanCommitment und Execution Lease
→ aktuelle Step-Rematerialisierung
→ gebundene LegalAction oder zertifizierter Engine-RNG-Command
→ applyAction-Validierung
```

Keine Zwischenstufe darf eine Entscheidung der nächsten autoritativen Stufe
vorwegnehmen.

## Pflichtfragen vor dem ersten Codepatch

1. Welche fachliche Entscheidung soll sich konkret ändern?
2. Welcher bestehende Plan besitzt diese Entscheidung?
3. Ist der Fehler eine falsche Fact-/Quote-Basis, Planwahl, planinterne Route,
   Zuglinienbewertung, Engine-Fortsetzung oder nur Choice-Payload?
4. Welche residente Planinstanz, welcher Step, welche Route und welcher
   `PlanExecutionOrigin` müssen erhalten bleiben?
5. Welche LegalAction und welche aktuelle `stateVersion` autorisieren die
   Ausführung?
6. Ist die benötigte Information side-sicher und Engine-zertifiziert?
7. Wo endet sichere Projektion an Draw, Zufall, Gegnerreaktion oder
   Engine-Fortsetzung?
8. Welche Parent-/Need-/Supportbindung verhindert Doppelzählung und
   Zielverlust?
9. Welche parallele Entscheidungsautorität würde die naheliegende lokale
   Abkürzung versehentlich erzeugen?
10. Welcher Test beweist Ergebnis **und** unveränderte Ownership?

Kann eine Frage nicht belastbar beantwortet werden, beginnt noch keine
Verhaltensimplementierung.

## Schnelle Schichtzuordnung

| Änderungsbedarf | Richtige Schicht |
| --- | --- |
| Regel, Legalität, Kosten oder zustandsabhängige Wirkung | Engine / vollständiger Engine-Quote |
| Wiederverwendbare Kartenfunktion | aktive Hint- und Action-/Ability-Semantik |
| Deckweite Tendenz und Komponentenstruktur | DeckDoctrine / Strategic Intent |
| Aktuelles Ziel, Quelle, Server, Ressource oder Sequenz | zuständiges Planmodul |
| Vergleich mehrerer kohärenter Restzuglinien | TurnPlanner-Policy und registrierte Dimensionen |
| Payload einer bereits gewählten Action | enger Choice-Resolver |
| Darstellung und Erklärung | Observability ohne Bewertungswirkung |

Eine Fähigkeit gehört nur dann in den gemeinsamen Kernel, wenn mehrere
fachlich verschiedene Planmodule dieselbe Lebenszyklus-, Ressourcen-,
Commitment-, Sicherheits- oder Diagnostikfähigkeit benötigen. Sonst bleibt
sie im Planowner.

## Zentrale Ownership-Beispiele

- `corp.score_agenda`: Agenda, Zielremote, Install/Advance/Score,
  Scoredeadline und Rush-Risiko.
- `corp.defend_servers`: globale ICE-Allokation, jede ICE-Installation,
  Schutzbewertung und Rezentscheidung.
- `corp.establish_scoring_remote`: langfristige Remote-Nutzbarkeit, ohne
  ICE- oder Agendaentscheidungen zu übernehmen.
- `corp.economy` / `runner.economy`: eigene Economy-Ziele und exakt gebundene
  Finanzierung fremder Parent-Bedarfe.
- Hand-/Agenda-Management: Handkapazität und Discard, ohne Server-, ICE- oder
  Scoreziel selbst zu wählen.
- Choice-Resolver: ausschließlich gebundene Optionswerte, niemals Plan,
  Executor, Action-ID, Server, Quelle oder Strategie.

## Zug- und Kampagnenregeln

- Der TurnPlanner plant so weit, wie die Projektion belastbar ist: den ganzen
  Restzug, mehrere deterministische Phasen oder nur bis zur nächsten echten
  Informationsgrenze.
- Draw, Suche, öffentlicher Zufall, gegnerische Reaktion und relevante
  Engine-Fortsetzung beenden die konkrete Vorplanung. Danach wird mit dem
  beobachteten Zustand neu geplant.
- Ohne materielle Änderung wird ein gültiges Commitment fortgesetzt. Normale
  Action-Schwankungen sind kein Replan-Grund.
- Zusatzaktionen werden nur zusammen mit ihren konkreten Folgeschritten als
  Action-Capacity-Route bewertet.
- Mehrzügige Kampagnen besitzen Meilensteine, Fortschritt, Requote- und
  Abbruchbedingungen. Ihr Fortsetzungswert darf akute Gegenwartsgefahr nicht
  überstimmen und nicht durch Parent und Child doppelt gezählt werden.
- Nach Runtime-Neustart wird das Portfolio wiederhergestellt, das alte
  Zugcommitment verworfen und aus dem aktuellen Zustand neu geplant.

## Bewertungsregeln

- P1 bis P3 sind validierte lexikografische Pflichten, keine verrechenbaren
  Bonuszahlen.
- Zulässige P4- bis P6-Linien werden über das versionierte Register für
  terminalen Ausgang, Agendafortschritt, Defense, Economy, Handqualität,
  Flexibilität, Kontinuität und Risiko verglichen.
- Äquivalente Linien werden gruppiert; klar dominierte Linien werden entfernt.
- Technische IDs sind nur stabiler letzter Tiebreak.
- Zufall ist nur bei zertifiziertem planlokalem Nahgleichstand oder
  ausdrücklich zugelassener Rush-Neigung erlaubt und wird durch die Engine
  replaybar ausgeführt.

## Besondere Leitplanken aus den jüngsten Spielanalysen

- Ein unbekannter ICE-/Encounter-Teilpfad löscht keine unabhängig bekannte
  exakte Rez- oder Schutzroute.
- Draw erhält nur Wert, wenn vor der relevanten Deadline ein konkreter
  Folgeaktionshorizont materialisierbar ist.
- Unrezztes ICE kann Staffelung, Bluff, Handentlastung und Vorbereitung sein.
  Es gibt weder Sofort-Rez-Pflicht noch blindes Layer-Stapeln; Defense bewertet
  globale Opportunitätskosten.
- Ein Scoreplan darf Schutz an Defense delegieren. Defense darf deshalb weder
  Agenda noch Zielremote oder Scoreentscheidung übernehmen.
- Strategiekomponenten müssen gemeinsam ausführbar sein. Ein Einzelanker
  erzeugt keine vollständige Deckdoktrin.

## No-Go-Muster

- Kartenname oder Definition-ID als globale Strategieabfrage;
- neuer Bonus im globalen Rohscore, der einen fehlenden Plan ersetzt;
- Resolver wählt Server, Karte, Quelle, Ressourceneinsatz oder Strategie;
- Handmanagement installiert „irgendwo“ ICE oder Agenda zur bloßen
  Handentlastung;
- Unknown wird als null, sicherer Effekt oder Routenausschöpfung behandelt;
- zukünftige Action-ID wird vor einer Boundary festgeschrieben;
- beliebiger First-LegalAction-Fallback;
- Test erwartet nur die Action, aber nicht Plan, Step, Route und Executor.

## Pflichtnachweis vor Abschluss

- realistischer `PlayerView` und echte oder exakt nachgebildete LegalActions;
- zuständiger Plan, Step, Route, Executor und Parent-/Need-Bindung belegt;
- aktuelle Action-/Choice-/Target-/StateVersion-Bindung belegt;
- keine zweite Entscheidungsautorität und kein Hidden-Info-Leak;
- Known-/Unknown- und Boundary-Gegenfall geprüft;
- relevante Decision Checkpoints beziehungsweise Match-Repros;
- während Diagnose und iterativer Umsetzung zunächst der kleinste fokussierte
  Test, der Fehlpfad und Ownership belegt;
- AI-Typecheck und aktive AI-Struktur-/Hint-Gates bei Änderungen an
  Typoberflächen, Paketgrenzen, gemeinsamen Verträgen, Hints oder der geprüften
  Struktur, ansonsten gesammelt am nächsten bewussten Integrationscheckpoint;
- vollständige AI-Shards nur bei breiter Wirkung, am vereinbarten
  Phasen-/Release-/`Endfinale`-Checkpoint oder auf ausdrücklichen
  Nutzerwunsch.

## Debug-Grenze

Die private Betreiber-Buganzeige darf die vollständige Hand der aktiven KI
und ihre gesamte Zugplanung zeigen, niemals die Hand des menschlichen
Spielers. Diese privilegierte Darstellung ist kein KI-Input und keine
Ausnahme für PlayerViews, PublicEvents, normale Netzwerkpayloads, öffentliche
Replays, Logs oder Clientfehler.

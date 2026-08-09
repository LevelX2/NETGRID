# Zentrale CardSpec: Worktree-Umsetzungsprozess

- Datum: 09.08.2026
- Status: **in Umsetzung; CS00 bis CS03 abgeschlossen, CS04 ausstehend**
- Zielbranch: `codex/card-spec-registry-migration`
- Ziel-Worktree: `C:\Projekte\NETGRID_CARD_SPEC_REGISTRY_MIGRATION`
- Integrationsbranch: lokaler `main`
- Remote-Aktion: keine

## 1. Quelle und Vorgabe

Dieser Prozess konkretisiert:

- [`central-card-specification-and-registry-target-state-2026-08-09.md`](central-card-specification-and-registry-target-state-2026-08-09.md);
- die unabhängige Architekturprüfung vom 09.08.2026;
- die aktuellen Engine-, KI-, Package-, Replay-, Hidden-Info- und
  Version-0-Grundsätze aus `AGENTS.md`;
- den aktuellen Plan-first- und TurnPlanner-Stand aus
  `docs/codex/CODEX_STATUS.md`.

Die Architekturprüfung wird in diesem Prozess als verbindliche Schärfung des
Entwurfs behandelt. Insbesondere gilt:

1. `engine` ist die einzige mechanische Kartenwahrheit.
2. `planningAnnotations` enthalten ausschließlich nicht mechanisch
   ableitbare Interpretation.
3. Jede planungs- oder Action-adressierbare Capability erhält eine stabile
   semantische Identität.
4. Eine `ProspectiveCapabilityView` wird aus CardSpec und generischen
   Primitiven abgeleitet und nicht separat gepflegt.
5. Projektionsaussagen bleiben konservativ und niemals
   LegalAction-autorisierend.
6. Der Kartenfingerprint wird nicht mit dem vollständigen Rules-/Engine-
   Kontext gleichgesetzt.
7. Die Zentralisierung darf nicht von einer vollständigen vorherigen
   Longtail-Normalisierung abhängen.
8. Der erste produktive Schnitt muss einen heterogenen Mechanik-Stresstest
   bestehen.

## 2. Zielprüfung

Die Vorgabe ist für eine automatische, sequenzielle Umsetzung ausreichend
präzise. Es fehlt kein zwingender fachlicher Nutzerentscheid.

Noch zu ermittelnde Tatsachen werden als frühe Auditpakete geführt und nicht
vom ausführenden Agenten still angenommen:

- vollständiges Inventar aller heutigen `CardImplementationDefinition`-
  Capability-Familien;
- Serialisierbarkeits- und Longtail-Inventar;
- vollständige Consumer- und Direktimportmatrix;
- Auswahl der zusätzlichen Karten des Mechanik-Stresstests;
- aktuelle Startzeit-, Heap-, Bundle- und Behavior-Baseline;
- genaue Trennung zwischen statisch kompilierbarer Capability und notwendiger
  Engine-Quote je Longtail-Familie.

Falls eines dieser Audits einen echten Widerspruch zur Zielarchitektur zeigt,
stoppt der Prozess nach dem Audit mit einem strukturierten Blocker. Er darf
nicht durch einen Legacy-Fallback, ein zweites Datenmodell oder einen
per-card KI-Sonderfall fortgesetzt werden.

## 3. Gesamtziel

NETGRID besitzt am Ende eine versionierte, strikt serialisierbare `CardSpec`
je Regelidentität als einzige kartenspezifische Autorenquelle. Aus ihr werden
deterministisch und typisiert Engine-, Public-, Katalog-, Planning- und
Editor-Sichten erzeugt.

Der Endzustand umfasst:

- ein reines TypeScript-Paket `@netgrid/cards`, das nur von
  `@netgrid/shared` abhängt;
- 620 kanonische CardSpecs mit unveränderten Regelidentitäten;
- getrennte `PrintingSpec`- und `SetSpec`-Verträge;
- stabile `capabilityKey`s für alle planungs- oder Action-adressierbaren
  Capability-Knoten;
- keine produktive Arrayindex-Identität für aktivierte Kartenfähigkeiten;
- eine abgeleitete statische `ProspectiveCapabilityView`;
- eine side-sichere zustandsbezogene KI-Projektion;
- exaktes Rebinding nach echter Zustandsänderung über Instanz,
  Capability-Identität und `stateVersion` auf eine aktuelle LegalAction;
- Broker-Install-, Build-, Hold- und Cash-out-Planung im bestehenden Owner
  `runner.credit_bank`;
- keine parallelen produktiven Card-JSON-, Supportmanifest-, AI-Hint-,
  Shared-CardDefinition- oder CardImplementation-Autorenquellen;
- keine Engine-Abhängigkeit auf KI, Server, Browser, Dateisystem oder
  Datenbank;
- aktualisierte aktuelle Architektur- und Wissensdokumentation;
- vollständige lokale Integration nach `main` und verifizierter Cleanup des
  Arbeits-Worktrees und Arbeitsbranches.

## 4. Annahmen

- `main` bleibt der lokale Integrationsbranch.
- Das Projekt ist Version 0; interne Daten, alte lokale Replays und Fixtures
  benötigen keinen Kompatibilitätsadapter.
- Bestehende `cardDefinitionId`s bleiben erhalten, solange keine tatsächlich
  neue Regelidentität entsteht.
- `printingId` ist zunächst zugleich der abgeleitete Assetschlüssel.
- Ein eigener `assetKey` entsteht nur bei einem nachgewiesenen Fall, in dem
  Asset- und Printingidentität auseinanderfallen.
- SQLite bleibt außerhalb dieses Prozesses.
- Der Prozess verwendet keine Standardports und startet keinen Server oder
  Webclient aus dem Worktree, solange kein isolierter Browsertest zwingend
  erforderlich wird.
- Die bestehenden generischen Engine-Primitive werden weiterverwendet. Neue
  Mechanik entsteht generisch, nicht per-card.
- Nicht sicher statisch auswertbare Longtails dürfen in der Prospective View
  `requires_engine_quote` oder `unknown` liefern.

## 5. Nicht-Ziele

- keine vollständige Zug- oder Spielkopiensimulation;
- keine zweite Rules Engine in Cards oder AI;
- keine zukünftigen LegalActions oder Action-IDs in CardSpecs oder Plänen;
- keine globale Erhöhung von Broker- oder Economy-Gewichten;
- kein neuer Broker-Sondercontroller;
- keine Choice-Resolver-Strategielogik;
- keine SQLite-Card-Registry oder DB-Autorität;
- kein Karteneditor in diesem Prozess;
- keine Artwork-Neugestaltung und keine unnötige Bildvariantenfunktion;
- kein Push, Pull Request oder Remote-Merge;
- keine dauerhafte Dual-Read-, Dual-Write- oder Legacy-Fallback-Schicht;
- keine pauschale Longtail-Normalisierung ohne Bedarf der Migration oder der
  Prospective View.

## 6. Verbindliche Architekturentscheidungen

### 6.1 Eine mechanische Wahrheit

Die Zielstruktur lautet sinngemäß:

```ts
type CardSpec = {
  identity: CardIdentitySpec;
  text: CanonicalCardTextSpec;
  rules: CardRulesSpec;
  engine: CardMechanicalSpec;
  planningAnnotations?: CardPlanningAnnotations;
  printings: readonly PrintingSpec[];
  publication: CardPublicationSpec;
};
```

`engine` enthält die mechanische Wahrheit einschließlich Timing, Kosten,
Conditions, Limits, Targets, Effekten, Installationsbindungen,
Lifecycle-Folgen und sonstigen deklarativen Mechaniken.

`planningAnnotations` dürfen ausschließlich Informationen enthalten, die
nicht mechanisch aus `engine` ableitbar sind, zum Beispiel:

- Taktiksignal;
- Strategy Support;
- strategische Rolle;
- Target-Präferenz;
- Value-/Risk-Interpretation;
- bewusste Planowner-Zuordnung.

Folgende Felder dürfen dort nicht nochmals gepflegt werden:

- Kosten;
- Timing;
- Mengen;
- Limits;
- mechanische Conditions;
- mechanische Targets;
- direkte oder verzögerte Zustandsänderungen;
- aktuelle Legalität.

Ein Guard muss mechanische Felder in PlanningAnnotations verbieten.

### 6.2 Strikt serialisierbare CardSpecs

Das finale CardSpec-Objekt besteht ausschließlich aus Plain Objects, Arrays,
Strings, Zahlen, Booleans und `null`, soweit das Schema `null` ausdrücklich
vorsieht.

Unzulässig sind:

- Funktionen und Closures;
- Klasseninstanzen;
- `Map`, `Set`, `Date`, RegExp und Symbole;
- runtime- oder umgebungsabhängige Berechnung;
- nicht endliche Zahlen;
- zyklische Referenzen;
- uneindeutige `undefined`-Eigenschaften im finalen Objekt.

Pure Helper dürfen verwendet werden, wenn ihr Ergebnis diese Regeln erfüllt.
Serialisierungsroundtrip, Canonical Serialization und Deep-Freeze werden
getestet.

### 6.3 Capability-Identität

Jeder planungs- oder Action-adressierbare mechanische Knoten erhält einen
innerhalb der CardSpec stabilen `capabilityKey`.

Für normale aktivierte Fähigkeiten darf ein spezialisierter `abilityKey` als
typisierter Alias verwendet werden. Die kanonische quellenweite Identität
lautet:

```text
<cardDefinitionId>:<capabilityKey>
```

Diese Identität kann als `sourceAbilityId` in einer
`CanonicalLegalActionInvocation` transportiert werden. Sie ersetzt nicht:

- das `capabilityId` einer Plan-Step-Anforderung;
- die `actionId` einer aktuellen LegalAction;
- die `sourceCardInstanceId` einer konkreten Karteninstanz.

Passive Knoten benötigen nur dann einen Key, wenn Planung, Action-Bindung,
Choice-Bindung, Quote oder Diagnostik sie individuell adressieren muss.

### 6.4 Prospective Capability View

Der statische Compiler erzeugt aus einer CardSpec mindestens:

- den Quellenzustand, in dem eine Capability existiert;
- den Übergang, durch den dieser Zustand entsteht (`install`, `play`, `rez`,
  `score` oder anderer deklarierter Übergang);
- direkte deterministische Übergangsfolgen;
- initialisierte Kartenwerte und gebundene Installationschoices;
- entstehende Verpflichtungen und Lifecycle-Liabilities;
- Kosten-, Timing-, Condition-, Limit-, Target- und Effect-Deskriptoren;
- die stabile Capability-Identität;
- die statische Unsicherheitsklasse.

Die zustandsbezogene AI-Projektion verwendet ausschließlich side-sichere
Inputs und klassifiziert konservativ:

- `available_by_spec`;
- `feasible_in_projection`;
- `blocked`;
- `requires_engine_quote`;
- `unknown`.

`feasible_in_projection` ist keine Legalitätsgarantie. Nur eine aktuelle
LegalAction oder eine exakt definierte Engine-Quote kann aktuelle Legalität
beweisen.

### 6.5 Fingerprints

Getrennt abzuleiten sind mindestens:

- `cardRulesFingerprint`;
- `textFingerprint`;
- `printingFingerprint`;
- `planningAnnotationsFingerprint`;
- `publicationFingerprint`.

Replay- und Planungskontext verwenden zusätzlich den übergreifenden
Rules-/Engine-Kontext, insbesondere Engine-Schema,
Card-Implementation-/Primitive-Version, Card-Pool und relevante
Action-Semantic-/Planner-Versionen.

Eine Textkorrektur darf allein keinen Regel- oder Replaybruch erzeugen. Eine
Änderung der generischen Primitive-Ausführung muss dagegen auch bei
unveränderter CardSpec im Rules-Kontext sichtbar werden.

### 6.6 Publication statt manueller Supportwahrheit

Die CardSpec darf redaktionelle Zustände wie `active`, `experimental` oder
`disabled` enthalten. Tatsächlicher Engine- und AI-Support sowie Testcoverage
werden aus Registry, Verträgen und Tests abgeleitet. Sie werden nicht als
manuelle parallele Statuswahrheit gespeichert.

### 6.7 Paket- und Exportgrenzen

Zielabhängigkeiten:

```text
@netgrid/shared
       ↑
@netgrid/cards
  ├─ /public
  ├─ /engine
  ├─ /planning
  └─ /editor
       ↑
engine / catalog / ai / server-side web adapters
```

`@netgrid/cards` hängt nur von Shared ab. Die Engine importiert ausschließlich
den Engine-Subpath. AI importiert Planning- und erlaubte Public-/Engine-
Deskriptoren, nicht Runtime-Interna. Der normale Browser darf nur
`@netgrid/cards/public` oder einen öffentlichen API-DTO-Pfad sehen.

Exportmaps allein genügen nicht. Package- und Source-Structure-Guards müssen
verbotene Vollsicht- und Subpath-Imports nachweisen.

## 7. Controller-Invarianten

1. Die Rules Engine bleibt einzige Regelautorität.
2. `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timing, Kosten,
   Ziele und Choices.
3. Die AI reicht ausschließlich aktuelle LegalActions ein.
4. Future Plan Steps tragen keine `actionId`.
5. Nach jedem echten Übergang wird die nächste Action anhand von
   `sourceCardInstanceId`, kanonischer Capability-Identität und aktuellem
   `stateVersion` neu materialisiert.
6. Eine fehlende oder mehrdeutige Bindung scheitert fail-closed.
7. `runner.credit_bank` bleibt Owner von Broker Install, Build, Hold und
   Cash-out. `runner.economy` darf nur gebundene Finanzierungsbedarfe bedienen
   und übernimmt Broker nicht.
8. `runner.resource_lifecycle` bleibt Owner echter Lifecycle-Liabilities wie
   Loan from Chiba nach der Installation.
9. Choice-Resolver vervollständigen nur die Payload einer bereits gewählten
   LegalAction.
10. Kein Karten-, Server-, Target-, Resource- oder Strategy-Chooser entsteht
    außerhalb des zuständigen Plans.
11. PlayerView, PublicEvents, normale Logs, öffentliche Replays und Browser-
    DTOs bleiben side-sicher.
12. Registry- und Generatorreihenfolge sind deterministisch.
13. Jeder produktive Kartenbestand besitzt zu jedem Zeitpunkt genau eine
    Autorenquelle.
14. Temporär neue und alte Registries dürfen nur disjunkte Kartenmengen
    enthalten und niemals aufeinander zurückfallen.

## 8. Automatische Fehlerbehandlung

Der Controller darf selbstständig:

- fokussierte Tests erweitern und wiederholen;
- TypeScript-, Format-, Import-, Schema- und Testfehler innerhalb des aktiven
  Pakets ursachenbezogen korrigieren;
- eine Testfixture auf den neuen, ausdrücklich beschlossenen Vertrag
  aktualisieren;
- `main` defensiv in den Arbeitsbranch integrieren;
- kompatible Konflikte unter Erhalt beider Intentionen lösen;
- temporäre lokale Auditdateien unter `data/local/` erzeugen.

Der Controller darf nicht:

- ein rotes Gate überspringen;
- einen Fallback oder Dual-Read ergänzen;
- unbekannte Mechanik als statisch sicher klassifizieren;
- AI-Werte nur zur Verbesserung einer Baseline verändern;
- fremde Änderungen verwerfen;
- Tests abschwächen, löschen oder umklassifizieren, um den Umbau grün zu
  bekommen;
- `git reset --hard`, erzwungenen Worktree-Cleanup oder `git branch -D`
  verwenden;
- Standardserver oder Standardports aus dem Worktree starten;
- pushen oder einen Pull Request erstellen.

## 9. Sicherheitsblocker

Der Prozess stoppt mit Blockerreport und konkreter Removal Condition, wenn:

- die CardSpec nur durch Engine-Runtimefunktionen oder Closures vollständig
  ausdrückbar wäre;
- eine neue Abhängigkeit Engine → AI/DB/Server/Browser erforderlich würde;
- ein migrierter Kartenpfad nur durch Legacy-Fallback lauffähig wäre;
- Hidden-Info-, Replay-, StateHash-, stale-action- oder Illegal-action-Gates
  nicht ursachenbezogen geschlossen werden können;
- Capability-Identität oder Rebinding mehrdeutig bleibt;
- ein Longtail weder statisch als `unknown`/`requires_engine_quote` noch über
  eine bestehende generische Engine-Quote korrekt abgrenzbar ist;
- die erforderlichen Quellartefakte nicht im Base-Commit des Worktrees
  vorhanden sind;
- Worktree-, Branch- oder Zielpfad einem fremden Prozess gehören;
- der finale Merge fremde uncommittete Änderungen überschreiben würde.

## 10. Prozesszustandsmaschine

```text
prepared
→ preflight
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_sync
→ main_merged
→ worktree_removed
→ branch_removed
→ complete
```

Fehlerzustände:

```text
package_failed → package_active
safety_blocked → blocker_reported
merge_conflict → resolving → final_verifying
cleanup_failed → cleanup_diagnosis → worktree_removed
```

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Der Paketstatus wird
in diesem Dokument aktualisiert und mit dem jeweiligen Paket committed.

## 11. Paketübersicht

| Paket | Titel                                                  | Status    |
| ----- | ------------------------------------------------------ | --------- |
| CS00  | Worktree-Preflight, Architekturfreeze und Baselines    | completed |
| CS01  | Capability-, Longtail- und Consumer-Inventar           | completed |
| CS02  | Paket-, Schema- und Serialisierbarkeitsfundament       | completed |
| CS03  | Registry, Projektionen, Importindex und Fingerprints   | completed |
| CS04  | Stabile Capability-Identität und Engine-Rebinding      | pending   |
| CS05  | Prospective-Capability-Compiler                        | pending   |
| CS06  | Heterogener produktiver Mechanik-Stresstest            | pending   |
| CS07  | Testset-Migration und Migrationsautomatisierung        | pending   |
| CS08  | Classic-Migration                                      | pending   |
| CS09  | Proteus-Migration                                      | pending   |
| CS10  | Originalset-v1-Migration                               | pending   |
| CS11  | Consumer-, Altquellen-, Printing- und Asset-Cleanup    | pending   |
| CS12  | Side-sichere AI-Projektion und Broker-Zugplanung       | pending   |
| CS13  | Gesamtevidence, aktuelle Dokumentation und Integration | pending   |

## 12. Paketdetails

### CS00 – Worktree-Preflight, Architekturfreeze und Baselines

Ziel:

Den ausführbaren Ausgangspunkt sichern und die geprüfte Zielarchitektur als
verbindliche Umsetzungsbaseline festschreiben.

Eingangsvoraussetzungen:

- Prozess- und Architekturartefakt liegen im ausgewählten Base-Commit;
- `main`, Zielbranch und Ziel-Worktree sind eindeutig;
- fremde Worktrees und Änderungen sind klassifiziert.

Konkrete Arbeit:

- Pflichtwissen und lokale Anweisungen vollständig lesen;
- `git status`, `git worktree list --porcelain`, Branch- und Zielpfadstatus
  prüfen;
- Worktree und Branch anlegen;
- unabhängige Reviewkorrekturen in das Architekturpapier einarbeiten;
- dort `engine` als mechanische Wahrheit, `planningAnnotations`,
  `capabilityKey`, Prospective View, konservative Statusklassen,
  Fingerprintgrenze, Serialisierbarkeit, Publication und Stresstest
  verbindlich festlegen;
- Bestandszahlen für Karten, Manifeste, Hints, Implementierungen und direkte
  Consumer reproduzieren;
- Startzeit-, statischen Heap-, Browserbundle- und ungefähren per-match
  Heapstand mit dem bestehenden System messen und unter `data/local/`
  festhalten;
- aktuelle kompatible AI Behavior Baseline und ihren Git-Stand bestimmen.

Kernartefakte:

- aktualisiertes Architekturpapier;
- lokaler Baselinebericht;
- aktualisierter Paketstatus.

Checks:

- alle lokalen Dokumentlinks;
- Prettier für geänderte Markdowndateien;
- `git diff --check`.

Done-Gate:

- Architekturentscheidungen sind nicht mehr als offene Alternativen
  formuliert;
- Baselines und Quellzahlen sind reproduzierbar;
- keine Umsetzung wurde vor dem Architekturfreeze begonnen.

Commit:

`docs(architecture): freeze central card specification target`

Ergebnis vom 09.08.2026:

- Base-Commit `a0172b214320be51deca6eba46cdc29dc4e58391`, Branch und Worktree
  wurden eindeutig verifiziert; Prozess- und Architekturquelle sind seit
  `dc7cde76c71bed12d536ca2f09e3e9c0aaed8e94` versioniert.
- Die unabhängigen Reviewkorrekturen sind im Architekturpapier verbindlich
  eingefroren; keine Architekturentscheidung bleibt als offene Alternative.
- Der reproduzierbare lokale Bericht liegt unter
  `data/local/card-spec-registry-migration-cs00/baseline-report-2026-08-09.md`.
  Das Verzeichnis ist absichtlich ignoriert und wird nicht committed.
- Bestandsstand: 620 Card-JSON-Einträge, 620 Manifesteinträge, 618 aktive
  Hints, 583 eindeutige CardImplementations sowie reproduzierte direkte
  Consumer-Fan-outs. Die vollständige Klassifikation bleibt wie vorgesehen
  CS01.
- Drei isolierte Runtime-Messungen, ein erfolgreicher Next-Production-Build
  und ein Standardlauf der AI Behavior Baseline v1 wurden am Base-Stand
  erfasst.
- Die verbindlichen CS06-/CS13-Regressionsbudgets sind eingefroren: maximal
  25 Prozent für Importstartzeit und statischen Heap, 10 Prozent für
  Browser-gzip und Retained-Match-Proxy sowie höchstens 4 KiB isolierter
  CardSpec-/Registry-Heap je Match bei strikt geteilter Vollregistry.
- Die AI Behavior Baseline ist als Ausgangsevidence rot: 10 IllegalActions,
  10 klassifizierte Runtimefehler und zwei Action-Limit-Spiele. Das ist ein
  explizites CS12-Vergleichs- und Hard-Gate-Risiko, kein in CS00 kaschierter
  Verhaltensfix.
- Keine Karten-, Engine- oder KI-Implementierung wurde begonnen. Breite
  Workspace-, Engine- und AI-Tests blieben entsprechend der Paketregeln den
  benannten Integrationspunkten vorbehalten.

### CS01 – Capability-, Longtail- und Consumer-Inventar

Ziel:

Den vollständigen Migrationsraum beweisen, bevor Verträge verschoben werden.

Konkrete Arbeit:

- alle Top-level-Familien von `CardImplementationDefinition` inventarisieren;
- je Familie Anzahl, Runtime-Owner, planungsadressierbare Knoten,
  Serialisierbarkeit und Prospective-Klasse erfassen;
- Funktions-, Closure-, Map-, Set-, Date-, zyklische und umgebungsabhängige
  Inhalte scannen;
- alle direkten Consumer von CardDefinitions, CardImplementation-Registry,
  Card JSON, Supportmanifesten und aktiven Hints klassifizieren;
- jede heutige AI-Hint-Familie als mechanisch ableitbar oder echte
  PlanningAnnotation einordnen;
- 8 bis 12 Stresstestkarten auswählen.

Pflichtkarten im Stresstest:

- Broker;
- Loan from Chiba;
- Black Widow;
- Morphing Tool;
- Sneak Preview.

Zusätzliche Pflichtfamilien:

- passive Modifier-Karte;
- Corp-Rez- oder Variable-Rez-Karte;
- Access-/Ambush-Karte;
- Scored-Agenda-Capability;
- Successful-Run- oder Run-Window-Folge.

Kernartefakte:

- `docs/reviews/architecture/card-spec-capability-consumer-inventory-2026-08-09.md`;
- maschinenlesbarer Audit unter `data/local/`;
- kleine dauerhafte Audit-/Guard-Skripte nur, wenn sie auch nach der Migration
  einen aktuellen Vertrag schützen.

Checks:

- reproduzierbarer Inventarlauf;
- alle 620 Karten genau einer Migrationsklasse zugeordnet;
- alle produktiven Direktconsumer klassifiziert;
- `git diff --check`.

Done-Gate:

- keine Capability- oder Consumer-Familie ist unentdeckt oder
  uninventarisiert; die bewusst inventarisierte Prospective-Klasse `unknown`
  bleibt zulässig;
- jede Longtail-Familie ist als statisch kompilierbar,
  `requires_engine_quote` oder `unknown` klassifiziert;
- Stresstestmatrix deckt die Pflichtfamilien ab.

Commit:

`docs(architecture): inventory card capabilities and consumers`

Ergebnis vom 09.08.2026:

- Das vollständige Inventar ist unter
  [`card-spec-capability-consumer-inventory-2026-08-09.md`](../reviews/architecture/card-spec-capability-consumer-inventory-2026-08-09.md)
  versioniert. Die reproduzierbare maschinenlesbare Evidence und ihr lokaler
  Audit liegen absichtlich ignoriert unter
  `data/local/card-spec-registry-migration-cs01/`.
- Alle 620 Karten sind disjunkt zugeordnet: 583
  `implementation_backed_declarative`, eine
  `definition_only_no_engine_behavior_required` und 36
  `definition_only_test_fixture`. Die zwei Catalog-Previews sind die einzigen
  Karten ohne aktiven Hint und bewusst als Publication-/Registry-Exklusion
  disponiert.
- Alle 48 Top-level-Capability-Familien sind gezählt, ihrem Runtime-Owner und
  einer Prospective-Klasse zugewiesen. 16 sind `statically_compilable`, 31
  `requires_engine_quote`; `regionBaseline` ist als vollständig inventarisierte
  Klasse `unknown` ohne produktiven Owner fail-closed blockiert.
- Der finale 583er-Registrygraph ist plain JSON, 186.575 UTF-8-Bytes groß und
  besteht den Deep-Equality-Roundtrip. Verbotene Runtimewerte,
  Fremdprototypen, Zyklen und umgebungsabhängige finale Werte wurden nicht
  gefunden.
- Produktive Direktconsumer sind vollständig klassifiziert: 105
  CardDefinition-Consumer, 87 ausschließlich engine-interne
  CardImplementation-Registry-Consumer und 66 aktive Hint-Consumer plus ein
  separater Autorloader sowie die vier Raw-Card- und eine Manifestfläche.
- Alle 32 aktiven Hintfelder und zwei heute inaktiven Vertragsfelder besitzen
  eine Ziel-Disposition. Gemischte Felder werden nur über geschlossene,
  feld-/wert-/präfixbasierte Mappingtabellen aufgespalten; unbekannte Keys und
  Werte scheitern fail-closed.
- Die heterogene Zehner-Stressmatrix deckt Broker, Loan from Chiba, Black
  Widow, Morphing Tool, Sneak Preview sowie passive Modifier, Variable Rez,
  Access/Ambush, Scored Agenda und Run Window ab. Mit Roving Submarine wird
  zugleich das `regionBaseline`-Unknown-Gate bewusst belastet.
- Keine Vertrags-, Registry-, Karten-, Engine- oder KI-Implementierung wurde
  begonnen; CS02 blieb unberührt.

### CS02 – Paket-, Schema- und Serialisierbarkeitsfundament

Ziel:

`@netgrid/cards` als zyklenfreie, reine und validierbare Vertragsgrenze
einführen.

Konkrete Arbeit:

- Workspace-Paket `packages/cards` anlegen;
- CardSpec-, mechanische Teil-, PlanningAnnotation-, Printing-, Set-,
  Publication- und Capability-Key-Verträge definieren;
- rein deklarative Ability-/Modifier-Verträge an die zyklenfreie Grenze
  verschieben oder dort neu exportieren;
- Engine-Runtimeausführung in Engine belassen;
- Serialisierbarkeitsassertion, Canonical Serializer und Deep-Freeze
  implementieren;
- mechanische Felder in PlanningAnnotations strukturell und durch Tests
  verbieten;
- Package-Boundaries auf Cards erweitern.

Checks:

- `@netgrid/cards`-Typecheck und fokussierte Tests;
- Shared- und Engine-Typecheck;
- Package-Boundary- und Cycle-Gates;
- Serialisierungsroundtrip für repräsentative Vertragsfixtures;
- `git diff --check`.

Done-Gate:

- Cards hängt ausschließlich von Shared ab;
- finale CardSpec-Objekte können keine Funktionen oder Runtimeobjekte
  enthalten;
- Engine importiert keine AI-, DB-, Server-, Browser- oder Filesystemschicht;
- PlanningAnnotations können Mechanik nicht überschreiben.

Commit:

`feat(cards): establish serializable card specification contracts`

Ergebnis:

- `@netgrid/cards` ist als zyklenfreie, browser- und runtimefreie
  Vertragsschicht angelegt. Das Root exportiert ausschließlich den
  CardSpec-Autorenvertrag und seine Guards; Engine erhält die deklarative
  mechanische Vocabulary ausschließlich über den kontrollierten Subpath
  `@netgrid/cards/engine`.
- Der geschlossene CardSpec-Vertrag trennt Identität, kanonischen Text,
  Regelprovenienz, Mechanik, PlanningAnnotations, Printings und rein
  redaktionelle Publication. Kosten und Stärke besitzen je genau eine
  kanonische Mechanikrepräsentation; Faction und capabilityKey-gebundene
  Aktionstexte gehen beim späteren Cutover nicht verloren.
- Die 47 owner-geklärten Capabilityfamilien sind als positive kanonische
  Feldliste erfasst. Das ownerlose `regionBaseline` bleibt ausschließlich im
  gekennzeichneten Legacyvertrag und scheitert in CardSpec fail-closed.
- Capability- und Ability-Keys verwenden eine gemeinsame geschlossene
  ASCII-Domäne. Adressierbare Knoten, Aliasgleichheit, Eindeutigkeit sowie
  Planning-/Textreferenzen auf bestehende Engine-Capabilities werden
  strukturell geprüft.
- Strikte Serialisierbarkeit, kanonische Serialisierung und atomarer
  Deep-Freeze lehnen unter anderem Funktionen, `undefined`, nichtendliche
  Zahlen, `-0`, Sonderobjekte, Accessors, Symbol-/verdeckte Eigenschaften,
  sparse Arrays, Expandos und Zyklen pfadgenau ab.
- Der Package-Boundary-Check scannt den aktuellen Dateibaum einschließlich
  ungetrackter Dateien AST-basiert, prüft exakte Subpaths und Manifestzyklen.
  Ein zusätzlicher Cards-Source-Guard erzwingt Shared-only, Quellreinheit und
  Zyklenfreiheit; die Engine-Purity-Regel blockiert AI-, Server-, DB-, FS- und
  Browserabhängigkeiten.
- Fokussierte Cards-Vertrags-, Negativ-, Serialisierungs-, Freeze- und
  Referenztests sowie Cards-/Shared-/Engine-Typechecks, Boundary-/Cycle-
  Selftests, Engine-Strukturgates und Test-Discovery sind grün. Registry,
  Projektionen, Importindex, Fingerprints und Karteninstanzen wurden nicht
  begonnen; CS03 blieb unberührt.

### CS03 – Registry, Projektionen, Importindex und Fingerprints

Ziel:

Aus CardSpecs eine deterministische, immutable Registry mit schmalen Sichten
erzeugen.

Konkrete Arbeit:

- deterministischen buildseitigen Importindex-Generator erstellen;
- keine Runtime-Dateisystemerkennung verwenden;
- Registry mit Lookup nach CardDefinition, Printing und Capability aufbauen;
- den in CS02 ausschließlich für deklarative Engine-Verträge angelegten
  `/engine`-Subpath um die Registry-/Engineprojektion ergänzen und `/public`,
  `/planning` und `/editor` als kontrollierte Subpath-Exports definieren;
- Public-Projektion als explizite Allowlist implementieren;
- Abschnittsfingerprints und Registry-Aggregathashes erzeugen;
- Rules-/Planning-Kontext um Card-Registry- und Primitivekontext ergänzen,
  ohne Text-/Bildänderungen als Regelbruch zu behandeln;
- Driftguard für generierten Importindex ergänzen.

Checks:

- doppelte Definition-, Printing-, Set- oder Capability-IDs scheitern;
- zweimalige Generierung ist bytegleich;
- Registry ist tief immutable;
- Public-Projektion enthält keine Engine- oder Planning-Interna;
- Fingerprinttests unterscheiden Regel, Text, Printing, Annotation und
  Publication korrekt;
- Browser-Importguard verhindert Vollsicht;
- `git diff --check`.

Done-Gate:

- eine CardSpec wird genau einmal geladen;
- Projektionen sind Ableitungen und keine gespeicherten Parallelquellen;
- Engine-/Rules-Kontext erkennt Änderungen generischer Primitive unabhängig
  von der CardSpec.

Commit:

`feat(cards): add deterministic registry projections and fingerprints`

Ergebnis am 09.08.2026:

- Ein dateibaumbasierter Generator erzeugt den sortierten statischen
  CardSpec-/SetSpec-Importindex. Der Driftcheck, AST-gebundene Exportprüfung
  und Incoming-Edge-Guard verhindern manuelle Listen, Direktimporte und einen
  zweiten produktiven Ladepfad. Bis zur Migration in CS06 bleibt der
  Produktionsindex bewusst leer.
- Die Registry validiert globale Definition-, Printing-, Set- und
  Capability-Identitäten atomar, friert die einzige Objektinstanz tief ein und
  hält Maps privat. Definition-, Printing-, Set- und Capability-Lookups sowie
  sortierte Engine-, Planning-, Editor- und PublicDTO-Sichten sind daraus
  abgeleitet und gecacht.
- `/public` ist eine browserreine Typoberfläche ohne Vollregistry-
  Reachability. Der browsergesperrte `/server`-Subpath stellt ausschließlich
  gebundene PublicDTO-Read-APIs bereit; Root bleibt zyklenfreie
  Authoringoberfläche und `/engine`, `/planning` sowie `/editor` bleiben auf
  ihre jeweilige Sicht begrenzt.
- Regel-, Text-, Printing-, Planning- und Publication-Fingerprints sowie
  Registry-Aggregate sind getrennt. Matchkontexte binden ausschließlich den
  gewählten Cardpool, seine Regelfingerprints und caller-owned Engine-,
  Primitive-, Action- und Planversionen; globale Registryänderungen und reine
  Text-/Bild-/Publication-Änderungen invalidieren keinen laufenden
  Regelkontext.
- PlanningRulesContext und StateHash konsumieren den Registry-/Primitive-
  Kontext. Textquellen- und Textsnapshotmetadaten bleiben außerhalb des
  mechanischen Hashes. Die leere Match-ID-Grenze wird in CS06 beim produktiven
  CardSpec-Cutover durch die aufgelösten Format-IDs ersetzt.
- Fokussierte Cards-, Planning- und StateHash-Tests, Cards-/Shared-/Engine-/AI-
  Typechecks, Generator-, Boundary-, Source-/Cycle-, Browser- und
  Test-Discovery-Gates sind grün.

### CS04 – Stabile Capability-Identität und Engine-Rebinding

Ziel:

Arrayindex-Identität durch stabile semantische Capability-Bindung ersetzen.

Konkrete Arbeit:

- Capability-Key-Vertrag für alle im Inventar als adressierbar markierten
  Familien umsetzen;
- aktivierte Fähigkeiten über Key statt Arrayposition materialisieren und
  revalidieren;
- LegalAction-/AbilityRef-/Payload-Semantik side-sicher ergänzen;
- `cardImplementationAbilityIndex` für migrierte Karten entfernen;
- hybride Migrationsgrenze so gestalten, dass alte Karten indexbasiert und
  migrierte Karten keybasiert sind, niemals dieselbe Karte über beide Pfade;
- Canonical Invocation und Rematerialisierung auf die kanonische
  Capability-Identität binden;
- stale, fehlende und mehrdeutige Keys fail-closed behandeln.

Checks:

- Key-Stabilität bei Arrayumsortierung;
- aktuelle LegalAction bleibt über `actionId` und `stateVersion` autoritativ;
- stale-action-, illegal-action- und falsche-Source-Tests;
- Rebinding ändert weder Actiontyp noch Executor oder Planowner;
- PublicContext-/Hidden-Info-Golden-Tests;
- Replay-/StateHash-Wiederholung;
- Engine-, Shared- und AI-Typecheck;
- `git diff --check`.

Done-Gate:

- jede migrierte planungsadressierbare Capability besitzt einen stabilen Key;
- keine migrierte Karte verwendet Arrayposition als fachliche Identität;
- fehlende Bindung erzeugt keine ähnliche Ersatzaktion.

Commit:

`feat(engine): bind card capabilities by stable semantic key`

### CS05 – Prospective-Capability-Compiler

Ziel:

Eine rein abgeleitete statische Sicht auf Fähigkeiten nach geplanten
Zustandsübergängen schaffen.

Konkrete Arbeit:

- `compileProspectiveCapabilities(CardSpec)` implementieren;
- Übergänge, direkte Folgen, initialisierte Werte, Installationschoices,
  Liabilities und Capability-Deskriptoren erzeugen;
- Unsicherheitsklassen anhand des CS01-Inventars zuweisen;
- keine GameState-, PlayerView-, LegalAction- oder AI-Planabhängigkeit im
  statischen Compiler zulassen;
- unvollständig bekannte Longtails konservativ klassifizieren;
- Ergebnis nach Card- und relevanten Fingerprints cachen, ohne Matchkopien.

Checks:

- Broker: `store_credits` und `withdraw_credits`, gemeinsames Turnlimit,
  initial blockierter Cash-out;
- Loan from Chiba: Installgewinn plus Turn- und Leave-Play-Liabilities;
- Black Widow: route-definierende ICE-Bindung;
- Morphing Tool: initialer Subtyp und spätere Change-Capability;
- Sneak Preview: Hidden-Zone-/Choice-Grenze ohne erfundene konkrete Karte;
- Tests für jede weitere Stresstestfamilie;
- Compiler ist deterministisch, serialisierbar und side-unabhängig;
- `git diff --check`.

Done-Gate:

- die View enthält keine manuell duplizierte Mechanik;
- sie behauptet keine aktuelle Legalität;
- jede nicht sicher kompilierbare Familie liefert eine explizite konservative
  Klassifikation.

Commit:

`feat(cards): compile prospective card capabilities`

### CS06 – Heterogener produktiver Mechanik-Stresstest

Ziel:

Die Zielarchitektur an 8 bis 12 realen, heterogenen Karten produktiv und ohne
Fallback beweisen.

Konkrete Arbeit:

- vollständige CardSpecs für die CS01-Stresskarten anlegen;
- jeweilige alte Card-, Manifest-, Hint-, Shared-Definition- und
  CardImplementation-Autoreneinträge im selben Paket entfernen;
- temporäre Hybridkomposition für zwei disjunkte Mengen einführen:
  migrierte CardSpecs und nicht migrierte Legacykarten;
- Überschneidung und fehlende Autorität hart verbieten;
- Engine-, Katalog-, Deck-, AI- und Webconsumer der migrierten Karten auf die
  neue Registry umstellen;
- mechanische Hintanteile aus der CardSpec ableiten und nur echte
  PlanningAnnotations übernehmen.

Checks:

- exakt eine produktive Autorität je Stresskarte;
- CardDefinition-, Engine-, LegalAction-, Katalog-, Deck- und Hintparität;
- repräsentative Mechaniktests aller Pflichtfamilien;
- Registry-, Projection-, Capability- und Fingerprinttests;
- Replay-, StateHash-, stale-action-, illegal-action- und Hidden-Info-Tests;
- Startzeit-, Heap- und Bundlevergleich gegen CS00;
- `git diff --check`.

Done-Gate:

- alle Stresskarten laufen ausschließlich aus CardSpecs;
- kein Consumer kann für diese Karten auf Legacy zurückfallen;
- keine Stresstestfamilie erzwingt eine zweite mechanische Quelle;
- Performancebudgets sind eingehalten oder eine ursachenbezogene Optimierung
  ist im Paket abgeschlossen.

Commit:

`feat(cards): cut over heterogeneous card specification slice`

### CS07 – Testset-Migration und Migrationsautomatisierung

Ziel:

Den ersten vollständigen Set-Cutover durchführen und den wiederholbaren
Migrationsweg härten.

Konkrete Arbeit:

- deterministisches, temporäres Migrationstool für die heutigen Quellen
  erstellen;
- erzeugte CardSpecs formatieren, typisieren und fachlich prüfen;
- alle verbleibenden Testsetkarten migrieren;
- alte Testset-Card-, Manifest-, Hint-, Shared- und Implementation-Quellen
  entfernen;
- Set- und Printingdaten konsolidieren;
- Paritätsreport erzeugen;
- Migrationstool so begrenzen, dass es niemals Runtimequelle wird.

Checks:

- 38/38 Testsetkarten in CardSpecs;
- null Testsetkarten in alten produktiven Quellen;
- vollständige Testset-Engine-/Katalog-/Deck-/AI-Parität;
- fokussierte Package- und Mechaniktests;
- Import-, One-Authority- und Generatorguards;
- `git diff --check`.

Done-Gate:

- das Testset besitzt genau eine Quelle;
- der Migrationsweg ist reproduzierbar;
- der Generator produziert keine unreviewten semantischen Annahmen.

Commit:

`feat(cards): migrate test set to canonical specifications`

### CS08 – Classic-Migration

Ziel:

Classic vollständig auf CardSpecs umstellen.

Konkrete Arbeit:

- 54 Classic-Karten migrieren;
- bestehende generische Primitive erhalten;
- PlanningAnnotations aus Hints von mechanischen Daten trennen;
- alte Classic-Quellen vollständig entfernen;
- Coverage und Release-Support aus Registry und Tests ableiten.

Checks:

- 54/54 Classic-CardSpecs;
- null Classickarten in alten produktiven Quellen;
- Classic-Per-card-, Mechanik-, Katalog-, Deck- und AI-Tests;
- Replay-/StateHash-/Hidden-Info-Smokes;
- Package- und Source-Structure-Gates;
- `git diff --check`.

Done-Gate:

- Classic ist source-parallelitätsfrei und technisch unverändert spielbar;
- die bisherige 54/54-Coverage bleibt nachweisbar, aber nicht manuell
  dupliziert.

Commit:

`feat(cards): migrate classic set to canonical specifications`

### CS09 – Proteus-Migration

Ziel:

Proteus vollständig migrieren und die komplexen Install-/Breaker-/Search-
Familien absichern.

Konkrete Arbeit:

- 154 Proteus-Karten migrieren;
- Proteus-Printings und Setdaten konsolidieren;
- alte Proteus-Quellen entfernen;
- Black-Widow-, Morphing-Tool- und weitere komplexe Familien aus dem
  Stresstest als Setparität bestätigen;
- Proteus-AI-Readiness-Ableitungen auf die neue Registry umstellen.

Checks:

- 154/154 Proteus-CardSpecs;
- null Proteuskarten in alten produktiven Quellen;
- Proteus-Engine-, Per-card-, AI-, Katalog- und Decktests;
- `check:proteus-ai-readiness`;
- Pilotdeck- und Familien-Szenario-Smokes;
- Replay-/StateHash-/Hidden-Info-Gates;
- `git diff --check`.

Done-Gate:

- Proteus bleibt 154/154 technisch spielbar und ai-supported;
- keine Readiness- oder Supportwahrheit wird manuell doppelt geführt.

Commit:

`feat(cards): migrate proteus set to canonical specifications`

### CS10 – Originalset-v1-Migration

Ziel:

Den größten Kartenbestand vollständig auf CardSpecs umstellen.

Konkrete Arbeit:

- 374 Originalset-v1-Karten migrieren;
- alle Longtail-Klassen gemäß CS01 übernehmen, ohne sie unnötig neu zu
  erfinden;
- Broker, Loan from Chiba und Sneak Preview als vollständige Setparität
  bestätigen;
- alte Originalset-Card-, Manifest-, Hint-, Shared- und Implementation-
  Autoreneinträge entfernen;
- Migrationsreports und verbleibende konservative Quote-/Unknown-Klassen
  dokumentieren.

Checks:

- 374/374 Originalset-v1-CardSpecs;
- null Originalset-v1-Karten in alten produktiven Quellen;
- fokussierte Tests je Mechanikfamilie und betroffene Per-card-Tests;
- Engine-, AI-, Katalog-, Shared- und Deck-Typechecks;
- Replay-/StateHash-/Hidden-Info-Smokes;
- One-Authority- und Vollständigkeitsguard;
- `git diff --check`.

Done-Gate:

- alle 620 Karten besitzen kanonische CardSpecs;
- keine produktive Karte benötigt einen alten Autorenpfad;
- Longtail-Ungewissheit ist explizit, nicht durch Fallback verdeckt.

Commit:

`feat(cards): migrate original set to canonical specifications`

### CS11 – Consumer-, Altquellen-, Printing- und Asset-Cleanup

Ziel:

Den Übergang beenden und die alte Architektur vollständig entfernen.

Konkrete Arbeit:

- temporäre Hybridkomposition entfernen;
- produktive `data/cards/*-cards.json`,
  `data/manifests/*-card-support.json` und
  `data/ai/ai-card-hints-active.json` entfernen;
- kartenspezifische Definitionen und Registrydaten aus Shared entfernen;
- alte CardImplementation-Subregistries, Coverage-Source-Listen und das
  temporäre Migrationstool entfernen, soweit nicht generische Runtime-
  Primitive betroffen sind;
- alle verbliebenen Consumer auf passende Cards-Projektionen umstellen;
- Katalog, Decks, Server, Web-API, Bilder, Skripte und Tests bereinigen;
- Standardbildpfad aus `printingId` ableiten;
- vorhandene Assets verlustfrei zuordnen oder kontrolliert umbenennen;
- direkte Vollsichtimporte im Browser verbieten.

Checks:

- Quellscan findet keine alte produktive Autorenquelle;
- 620 eindeutige CardSpecs und vollständige Printingzuordnung;
- alle aktiven Bilder auflösbar;
- Public-Projektion und Browserbundle ohne Engine-/Planning-Inhalte;
- Katalog-, Deck-, Web-API-, Asset- und Package-Boundary-Tests;
- Cycle- und Source-Structure-Gates;
- `git diff --check`.

Done-Gate:

- der Übergangspfad und alle Removal Conditions sind geschlossen;
- es existiert nur noch eine produktive Kartenautorität;
- generische Engine-Primitivimplementierungen bleiben klar von
  kartenspezifischen Specs getrennt.

Commit:

`refactor(cards): remove legacy card authoring sources`

### CS12 – Side-sichere AI-Projektion und Broker-Zugplanung

Ziel:

Die neue statische Capability-Schicht im bestehenden TurnPlanner verwenden
und Broker Install plus Build korrekt vorausplanen.

Eingangsvoraussetzungen:

- verpflichtenden KI-Architektur-Preflight vollständig lesen;
- `packages/ai/AGENTS.md`, AI Logic Change Compass, AI README und relevante
  Ownerabschnitte des Plan-Layer-Zielbilds vollständig auswerten;
- `runner.credit_bank` als Owner und `runner.economy` als gebundenen
  Funding-Support bestätigen.

Konkrete Arbeit:

- statische Prospective View mit side-sicherem sichtbarem Zustand
  projizieren;
- nur `available_by_spec`, `feasible_in_projection`, `blocked`,
  `requires_engine_quote` und `unknown` verwenden;
- Installationskosten, verbleibende Action Capacity, Installationschoices,
  direkte Folgen, Capability-Kosten und gemeinsame Limits in die projizierte
  Restzuglinie einbeziehen;
- zukünftige Invocation ohne `actionId`, aber mit Definition und
  Capability-Identität erzeugen;
- nach Installation exakte aktuelle Broker-Action rematerialisieren;
- `runner.credit_bank` so erweitern, dass ein noch auf der Hand befindlicher
  Broker eine Installphase und bei verbleibender Aktion eine Buildphase im
  selben TurnPlan besitzen kann;
- bestehende Build-, Hold- und Cash-out-Logik erhalten;
- keine globale Brokergewichtserhöhung und keinen Universal-Installplan
  einführen;
- Loan-from-Chiba-Liability beim Owner `runner.resource_lifecycle`
  gegenprüfen;
- alte text-/namenbasierte Bankerkennung dort entfernen, wo CardSpec-
  Semantik sie vollständig ersetzt.

Checks:

- erster Runnerzug kann Broker installieren und mit 3 Credits laden, sofern
  Kosten, Action Capacity und konkurrierende Prioritäten dies tragen;
- Broker-Install ohne verbleibende Buildaktion bleibt als mehrphasiger Plan
  resident statt eine unmögliche Aktion zu erfinden;
- Cash-out bei 0 Hosted Credits ist `blocked`;
- Load und Cash-out respektieren das gemeinsame Once-per-turn-Limit;
- zwei Brokerinstanzen bleiben getrennt gebunden;
- ein konkreter höherprioritärer P1/P2-Bedarf darf den Brokerplan korrekt
  schlagen;
- Basic +1 schlägt Install-plus-Build nicht aufgrund fehlender
  Post-Install-Semantik;
- `sourceCardInstanceId`, Capability-Key, `PlanExecutionOrigin`, Planowner,
  Executor und aktuelle Action bleiben exakt;
- Choice-Resolver ändert keine Strategie oder Action;
- fokussierte Plan-, Commitment-, Rematerialization-, Economy-, Credit-Bank-
  und Ownership-Tests;
- AI-, Engine- und Shared-Typecheck;
- kompatibler AI Behavior Baseline Candidate gegen CS00;
- hard gates: null IllegalActions, Replayfehler, Action-Limits, Fallbacks,
  Timeouts, Runtimefehler, Hidden-Info-Marker und No-Legal-Action-Fehler;
- `git diff --check`.

Done-Gate:

- Broker wird über denselben `runner.credit_bank`-Owner prospektiv geplant;
- die Ursache „Post-Install-Capability war vor Installation nicht
  planungsmaterialisierbar“ ist strukturell geschlossen;
- keine zweite Entscheidungs- oder Regelautorität ist entstanden;
- Behavior-Evidence zeigt keine harten Regressionen.

Commit:

`feat(ai): plan prospective card capabilities through existing owners`

### CS13 – Gesamtevidence, aktuelle Dokumentation und Integration

Ziel:

Den Gesamtumbau verifizieren, dokumentieren, lokal integrieren und vollständig
aufräumen.

Konkrete Arbeit:

- aktuelle Architektur-, AI-, Engine-, Card-Registry-, Wissens- und
  Statusdokumentation auf den neuen Stand bringen;
- alte Current-State-Dokumente aktualisieren oder eindeutig als ersetzt
  markieren;
- Abschlussreview mit Quellzahlen, Fingerprints, Performance, Baseline,
  bekannten `unknown`-/Quote-Familien und Removal-Condition-Nachweis erstellen;
- alle fokussierten Paketchecks vor dem breiten Gate sicherstellen;
- aktuelles `main` defensiv in den Arbeitsbranch integrieren;
- Konflikte unter Erhalt beider fachlicher Intentionen lösen;
- breite Gates auf dem finalen kombinierten Stand ausführen;
- lokal nach `main` mergen;
- Main erneut prüfen;
- Worktree und gemergten Arbeitsbranch entfernen und doppelt verifizieren.

Finale Checks mit mindestens 600 Sekunden äußerem Zeitfenster:

```text
corepack pnpm typecheck
corepack pnpm test:contracts
corepack pnpm --filter @netgrid/shared test
corepack pnpm --filter @netgrid/cards test
corepack pnpm --filter @netgrid/engine test
corepack pnpm test:ai:shards
corepack pnpm check:package-boundaries
corepack pnpm check:ai-source-structure
corepack pnpm check:card-asset-retention
corepack pnpm check:proteus-ai-readiness
corepack pnpm build
corepack pnpm exec prettier --check <alle geänderten Dateien>
git diff --check
```

Zusätzlich:

- finaler kompatibler AI Behavior Baseline Vergleich;
- reproduzierbarer 620-Card-One-Authority-Scan;
- Registry-/Importindex-Determinismus;
- Browser-/Public-Projektion-Golden-Test;
- Replay-/StateHash-/stale-/illegal-/Hidden-Info-Gesamtgate;
- Startzeit-, Heap- und Bundlevergleich gegen CS00.

Done-Gate:

- alle Pakete CS00 bis CS13 sind grün und committed;
- 620/620 Karten stammen aus CardSpecs;
- alle alten produktiven Autorenquellen und Übergangspfade sind entfernt;
- Prospective Capability View und Brokerplanung besitzen Owner-, Binding- und
  Behavior-Evidence;
- der Arbeitsbranch ist lokal nach `main` integriert;
- Hauptworkspace ist sauber;
- Ziel-Worktree fehlt sowohl in `git worktree list --porcelain` als auch im
  Dateisystem;
- der gemergte Arbeitsbranch wurde mit `git branch -d` entfernt;
- kein Push oder PR wurde ausgeführt.

Commit:

`docs(architecture): finalize central card specification migration`

## 13. Verifikationsregeln

### Paketnah

- Nur die kleinsten relevanten Tests während eines aktiven Pakets ausführen.
- Typoberflächenänderungen verlangen Typechecks aller direkt betroffenen
  Pakete.
- Packagegrenzen- oder gemeinsame Vertragsänderungen verlangen die
  entsprechenden Structure- und Boundary-Gates.
- Jede migrierte Mechanikfamilie erhält mindestens einen positiven und einen
  fail-closed Test.
- Jede migrierte spielbare Karte behält ihre bestehende Per-card- oder
  Mechanikabdeckung.

### Breite Gates

- Vollständige Engine- und AI-Läufe nur an den benannten Integrationspunkten
  und am Ende.
- Vollständige AI-Gates verwenden die drei festen Shards mit je einem Worker.
- Ein laufender Test wird über seine Session-ID weiterverfolgt und nicht nach
  dem ersten Yield neu gestartet.
- Ein rotes breites Gate wird ursachenbezogen analysiert. Unabhängige
  Baselinefehler werden getrennt ausgewiesen, nicht still in Scope gezogen.

### Behavior Baseline

- Baseline und Candidate müssen identische Slots, Seeds, Deckfingerprints und
  Actionlimits verwenden.
- Winrate allein belegt keine Verbesserung.
- Plan Conversion, No-progress-Repeats, dominierte Planwahlen und relevante
  Broker-Traces sind Verhaltensevidence.
- IllegalActions, Replayfehler, Action-Limit, Fallbacks, Timeouts,
  Runtimefehler, Hidden-Info und No-Legal-Action bleiben harte Null-Gates.

## 14. Worktree-, Git- und Integrationsregeln

1. Vor Anlage Zielpfad absolut auflösen.
2. Nicht anlegen, wenn Pfad oder Branch fremd belegt sind.
3. Worktree aus lokalem `main` auf
   `codex/card-spec-registry-migration` anlegen.
4. Ausschließlich im Arbeits-Worktree implementieren.
5. Hauptworkspace nur für Statusprüfung und finalen Merge verwenden.
6. Nach jedem Paket Checks, Ergebnisnotiz, `git diff --check`, selektives
   Staging und genau ein Paketcommit.
7. Keine fremden oder nicht paketzugehörigen Dateien stagen.
8. Vor dem finalen Merge aktuelles `main` in den Arbeitsbranch integrieren,
   wenn es fortgeschritten ist.
9. Nach Konfliktlösung relevante Tests wiederholen.
10. Arbeitsbranch bevorzugt per Fast-forward nach `main` integrieren.
11. Nach Main-Merge `git status --short` und `git diff --check` prüfen.
12. Worktree nur bei sauberem Status mit exakt geprüftem Pfad entfernen.
13. Entfernung in Gitliste und Dateisystem verifizieren.
14. Erst danach den vollständig gemergten Branch mit `git branch -d`
    löschen.
15. Kein `--force`, kein `-D`, kein `reset --hard`.
16. Goal erst nach Merge, Mainprüfung und verifiziertem Cleanup abschließen.

## 15. Vollständiger Controller-Prompt

```text
/Goal Arbeite den Prozess „Zentrale CardSpec: Worktree-Umsetzungsprozess“
vollständig und strikt sequenziell von CS00 bis CS13 ab, merge den
abgeschlossenen Arbeitsbranch lokal nach main und entferne danach den sauberen
Arbeits-Worktree sowie den vollständig gemergten Arbeitsbranch mit doppelter
Verifikation.

Projekt: C:\Projekte\NETGRID
Prozessartefakt:
C:\Projekte\NETGRID\docs\architecture\central-card-specification-worktree-implementation-process-2026-08-09.md
Architekturquelle:
C:\Projekte\NETGRID\docs\architecture\central-card-specification-and-registry-target-state-2026-08-09.md
Arbeitsbranch: codex/card-spec-registry-migration
Arbeits-Worktree: C:\Projekte\NETGRID_CARD_SPEC_REGISTRY_MIGRATION
Integrationsbranch: lokaler main

Lies zuerst vollständig AGENTS.md, AGENTS.local.md, die vier verpflichtenden
KI-Wissens-Einstiegsseiten, agents/release-implementation-agent.md, das
Prozessartefakt und die Architekturquelle. Bei jedem AI-Codepatch lies vor dem
ersten Patch zusätzlich vollständig packages/ai/AGENTS.md,
docs/architecture/ai/ai-program-logic-change-compass.md,
docs/architecture/ai/README.md und die für den Owner relevanten Abschnitte aus
docs/architecture/ai/ai-plan-layer-target-state-wip.md.

Prüfe vor dem Worktree-Start, dass Prozessartefakt und Architekturquelle im
gewählten Base-Commit enthalten sind. Wenn nicht, stoppe mit
source_artifact_not_committed und nenne genau die Removal Condition. Prüfe
Branch, Worktree, Hauptworkspace und fremde Änderungen defensiv. Überschreibe
oder entferne keine fremden Änderungen oder Worktrees.

Arbeite ausschließlich im angegebenen Worktree und immer nur am aktuellen
Paket. Aktualisiere den Paketstatus im Prozessartefakt. Führe die paketnahen
Checks aus, dokumentiere Ergebnis und ausgelassene breite Checks, führe git
diff --check aus, stage nur Paketdateien und committe jedes vollständig grüne
Paket mit einer klaren Paketmessage. Überspringe kein Done-Gate und erweitere
den Scope nicht still.

Behandle die CardSpec als einzige mechanische Kartenwahrheit. Leite
planungsrelevante Mechanik aus engine ab. PlanningAnnotations dürfen nur nicht
mechanisch ableitbare Interpretation enthalten. Verwende stabile
capabilityKeys für alle planungs- oder Action-adressierbaren Capability-Knoten.
Erzeuge keine zukünftigen LegalActions. Binde nach echten Zustandsänderungen
immer auf die exakte aktuelle LegalAction über Instanz,
Capability-Identität und stateVersion neu.

Erhalte Rules-Engine-Autorität, LegalAction-Revalidierung, Hidden Info,
Replay, StateHash, seedbasierten Zufall und Planownership. Broker bleibt beim
Owner runner.credit_bank. runner.economy ist nur gebundener Funding-Support.
Choice-Resolver wählen keine Karte, Fähigkeit, Strategie oder Route.

Führe während der Migration genau eine produktive Autorität je Karte. Neue
und alte Registry dürfen nur disjunkte Kartenmengen enthalten. Ein Fallback,
Dual-Read, Dual-Write, stiller Ersatzwert oder per-card KI-Shortcut ist nicht
zulässig. Longtails, die nicht sicher statisch auswertbar sind, werden
requires_engine_quote oder unknown; sie blockieren die Zentralisierung nicht,
dürfen aber nicht als sicher ausgegeben werden.

Stelle keine Zwischenfragen, solange das Prozessartefakt eine konservative
automatische Fortsetzung erlaubt. Bei einem Sicherheitsblocker stoppe, schreibe
einen strukturierten Blockerreport mit Ursache, betroffenem Paket und konkreter
Removal Condition und verändere keine nachgelagerte Schicht als Workaround.

Nach CS13 integriere gegebenenfalls aktuelles main defensiv in den
Arbeitsbranch, wiederhole die finalen Gates und merge bevorzugt per
Fast-forward lokal nach main. Prüfe main. Löse anschließend den exakten
Worktree-Pfad erneut auf, prüfe seinen sauberen Status, entferne ihn ohne
--force, verifiziere das Fehlen in git worktree list --porcelain und im
Dateisystem und lösche erst danach den gemergten Branch mit git branch -d.
Kein Push und kein Pull Request. Markiere das Goal erst complete, wenn Merge,
Mainprüfung, Worktree-Entfernung, beide Entfernungskontrollen und
Branch-Cleanup erfolgreich sind.
```

## 16. Abschlusskriterien

Der Prozess ist nur abgeschlossen, wenn:

- alle 14 Pakete ihr Done-Gate erfüllt haben;
- jedes Paket separat committed ist;
- die CardSpec die einzige mechanische kartenspezifische Autorenquelle ist;
- alle 620 Karten und ihre Printings vollständig erfasst sind;
- alle adressierbaren Capabilities stabile semantische Keys besitzen;
- Prospective View und side-sichere Projektion konservativ und fail-closed
  arbeiten;
- Broker über `runner.credit_bank` installier- und build-planbar ist;
- alte Card-, Manifest-, Hint-, Shared- und CardImplementation-
  Autorenquellen entfernt sind;
- SQLite nicht Teil der Spiel- oder Planungsruntime geworden ist;
- Package-, Type-, Test-, Replay-, StateHash-, Hidden-Info-, Behavior-, Asset-
  und Build-Gates grün sind;
- der lokale Main-Merge abgeschlossen ist;
- Worktree und Arbeitsbranch nachweislich entfernt sind;
- keine Remote-Aktion ausgeführt wurde.

# NETGRID KI-Roadmap

## Umsetzung der neuen semantischen KI-Spieler

Arbeitsfassung v1 - 2026-06-02

**Leitentscheidung:** Die laufende Arbeit an Taktiksignalen, Strategieankern und TargetDefinitions für alle aktiven Runner-/Corp-Karten wird als früher Foundation-Block priorisiert. Der neue KI-Spieler wird erst danach produktiv angebunden, wenn LegalActions semantisch verstanden werden können.

**Quellenbasis:** NETGRID KI-Zielbild - Metaebene v5; NETGRID Guide V2: Taktiksignale und Strategieanker; aktive Runner-/Corp-Kartenlisten des Originalsets; Proteus-Kartenliste als späterer Erweiterungsscope.

# 1. Zusammenfassung

Die neue KI sollte nicht als organische Erweiterung der alten KI-Planlogik umgesetzt werden. Der alte Pfad bleibt zunächst lauffähig, dient als Fallback, Vergleichssystem und Regressionsquelle, wird aber nicht zum Fundament der neuen Architektur. Das neue System folgt einer semantischen Kette: Kartendefinition, kanonische Kartensemantik, Taktiksignale, Strategieanker mit Rolle, DeckDoctrine, taktische Zwischenziele, semantisch verstandene LegalActions und erst dann die Auswahl einer LegalAction.

Da die aktuelle Arbeit bereits flächenhaft aktive Runner- und Corp-Karten mit Taktiksignalen, Strategieankern und TargetDefinitions versorgt, wird diese Arbeit in der Roadmap nach vorne gezogen. Sie ist nicht Vorarbeit am Rand, sondern die Grundlage der neuen KI. Gleichzeitig darf sie noch keine Runtime-Entscheidung verändern. Erst wenn die Action-Semantik-Bruecke steht, kann die Karten- und Decksemantik sinnvoll auf konkrete Entscheidungen wirken.

**Kurzform:** Zuerst Semantikdaten sauber und prüfbar machen. Dann LegalActions semantisch projizieren. Dann DeckDoctrine v2 und taktische Ziele aufbauen. Dann erst den neuen KI-Spieler produktiv einsetzen.

# 2. Grundkette und Leitplanken

Die Roadmap orientiert sich an dieser Zielkette:

```text
CardImplementation / Kartendefinition
→ kanonische Kartensemantik
→ Taktiksignale
→ Strategieanker mit Rolle
→ DeckDoctrine / Deckstrategieprofil
→ taktische Zwischenziele im aktuellen Spielzustand
→ semantisch verstandene LegalActions
→ Auswahl einer LegalAction
```

Die wichtigsten Leitplanken für die Umsetzung sind:

- Die Engine bleibt Regelautoritaet. Die KI erzeugt keine Legalität und bewertet nur legal angebotene Aktionen.

- Taktiksignale sind Funktionsbausteine, keine Strategien und keine Aktionen.

- Strategieanker entstehen nur bei echten Anker-, Payoff-, Engine-, Enabler-, Schlüssel- oder Win-Condition-Karten.

- Normale Supportkarten wie Economy, Draw, generische Suche oder einfache Utility dürfen keine Strategieanker erzeugen.

- TargetProfiles bewerten nur legale Zieloptionen und dürfen keine Hidden Information nutzen.

- DeckDoctrine darf aus bloßen Taktiksignalen keine Strategie erfinden. Ankerlose Decks erhalten NeutralDoctrine.

- Vor dem produktiven Cutover müssen LegalActions source-, ability-, target-, cost- und timing-relevant side-safe in die KI projizierbar sein.

# 3. Roadmap-Übersicht

Die Roadmap ist bewusst so sortiert, dass die laufende Karten-Semantikarbeit früh abgeschlossen und abgesichert wird. Der neue KI-Spieler entsteht danach als separater semantischer Pfad.

| **Step** | **Name**                           | **Primaerer Zweck**                                             | **Runtime-Wirkung** |
|----------|------------------------------------|-----------------------------------------------------------------|---------------------|
| 0        | Architekturtrennung                | Legacy stabil halten, neuen semantic/-Pfad vorbereiten          | Nein                |
| 1        | Semantik-Schema und Taxonomie      | Begriffe, Typen und Datenformate festlegen                      | Nein                |
| 2        | Karten-Semantik flächenhaft        | Aktive Karten mit Signalen, Ankern, TargetDefinitions versorgen | Nein                |
| 3        | Signal- und Ankerregeln härten     | Wildwuchs vermeiden, Support von Strategie trennen              | Nein                |
| 4        | TargetDefinitions / TargetProfiles | Zielwahl modellieren, side-safe und ohne Hidden Info            | Nein                |
| 5        | Reports und Invariant-Checks       | Coverage, Qualität und Nicht-Wirkung prüfen                     | Nein                |
| 6        | Action-Semantik-Bruecke            | LegalActions in semantische Kandidaten übersetzen               | Read-only           |
| 7        | Basic-Action-Semantik              | Credit, Draw, Run, Rez, Advance, Score etc. semantisch fassen   | Read-only           |
| 8        | DeckDoctrine v2                    | Deckstrategien, Lücken, Vollständigkeit diagnostisch erkennen   | Diagnostisch        |
| 9        | Taktische Zwischenziele            | Boardstate und Doctrine in kurzfristige Ziele übersetzen        | Shadow/diagnostisch |
| 10       | Semantisches Entscheidungsmodul    | Actions gegen Ziele ranken und auswählen                        | Zunächst Shadow     |
| 11       | Shadow Mode                        | Neue KI gegen Legacy vergleichen                                | Nein                |
| 12       | Bereichsweiser Cutover             | Neue KI stufenweise aktivieren                                  | Ja, kontrolliert    |
| 13       | Legacy Freeze/Removal              | Alte Planlogik einfrieren oder entfernen                        | Ja, später          |
| 14       | Proteus-Ausbau                     | Nach Originalset-Stabilitaet erweitern                          | Später              |

# Step 0. Architekturtrennung und Legacy-Stabilisierung

**Ziel:** Der alte KI-Pfad bleibt lauffähig, wird aber nicht mehr als Zielarchitektur erweitert.

## Beschreibung

Dieser Schritt schafft den organisatorischen und technischen Schnitt zwischen alter KI und neuer semantischer KI. Die alten Runner- und Corp-Entscheidungsbloecke bleiben für laufende Partien, Tests und Vergleichsauswertungen erhalten. Neue Semantikarbeit wird jedoch nicht mehr in diese alten Entscheidungsmonolithen eingebaut.

Der neue Pfad sollte im Code sichtbar getrennt werden, zum Beispiel unter packages/ai/src/semantic/. Der bestehende Pfad kann unter legacy/ liegen oder zumindest klar als Legacy markiert werden. Ziel ist kein sofortiges Löschen, sondern eine saubere Grenze: Legacy für Stabilitaet, semantic für Zielmodell.

Diese Trennung verhindert, dass neue Taktiksignale und Strategieanker unkontrolliert in alte PlanWeights oder alte Rollenlogik einsickern. Genau das wäre der Kompromisspfad, der später schwer zu entwirren ist.

```text
packages/ai/src/legacy/
  runner-plans.ts
  corp-plans.ts
  deck-doctrine-legacy.ts

packages/ai/src/semantic/
  taxonomy/
  cards/
  targets/
  actions/
  doctrine/
  goals/
  decision/
  reports/
```

## Ergebnisse

- Semantic-Verzeichnisstruktur ist angelegt.

- Alte KI-Module sind als Legacy markiert oder logisch gekapselt.

- Neue Semantikdaten werden nicht produktiv vom Legacy-Entscheider konsumiert.

- Feature-Flag- oder Selector-Konzept für späteren Parallelbetrieb ist vorbereitet.

## Abnahmekriterien

- Bestehende Partien und Tests laufen unverändert.

- Keine Runtime-Entscheidung aendert sich durch die neue Struktur.

- Neue Dateien importieren keine alten PlanWeights als Zielmodell.

- Legacy bleibt Fallback und Vergleichspfad.

## Hinweise / Risiken

- Dieser Schritt sollte klein gehalten werden. Er ist ein Sicherheitszaun, kein Rebuild.

- Wichtig ist die semantische Entscheidung: Der alte Planer wird nicht zum Fundament der neuen KI.

# Step 1. Semantik-Schema und Taxonomie definieren

**Ziel:** Die kontrollierten Begriffe und Datenstrukturen für Taktiksignale, Strategieanker, Rollen, TargetDefinitions und Risiken werden festgelegt.

## Beschreibung

Bevor weitere Karten annotiert werden, braucht die Semantik ein stabiles Schema. Dieses Schema beschreibt, welche Informationen pro Karte und pro Fähigkeit erfasst werden. Es trennt funktionale Taktiksignale von Strategieankern, TargetDefinitions, Constraints, Risiken und Evidenz.

Ein Taktiksignal beantwortet, wofür die KI eine Karte funktional nutzen kann. Ein Strategieanker beantwortet, welche größere Decklinie die Karte direkt trägt, belegt oder wesentlich ermöglicht. Eine TargetDefinition beschreibt, welche Zielwahl die Karte braucht. Diese Felder dürfen nicht vermischt werden.

Das Schema sollte von Anfang an Ability-nahe gedacht werden. Karten mit mehreren Fähigkeiten dürfen nicht nur ein grobes Kartenprofil haben, wenn später eine konkrete LegalAction auf eine bestimmte Fähigkeit zeigt. Deshalb sollte das Profil entweder fähigkeitsbezogene Eintraege enthalten oder später eindeutig auf Ability-IDs abbildbar sein.

```ts
type CardSemanticProfile = {
  cardId: string;
  side: "runner" | "corp";
  tacticSignals: TacticSignal[];
  strategySupport?: StrategySupportPair[];
  targetDefinitions?: TargetDefinition[];
  riskTags?: RiskTag[];
  constraints?: SemanticConstraint[];
  evidence: SemanticEvidence[];
};

type StrategySupportPair = {
  strategyId: StrategyId;
  role: StrategyRole;
  confidence: "low" | "medium" | "high";
  evidence: string;
};
```

## Ergebnisse

- Schema für CardSemanticProfile.

- Katalog für TacticSignal-Namen und Prefix-Konventionen.

- Katalog für StrategyId und StrategyRole.

- Schema für TargetDefinition / TargetProfile.

- Schema für RiskTags, Constraints und Evidence.

## Abnahmekriterien

- Taktiksignale, Strategieanker und TargetDefinitions sind separate Felder.

- Strategieanker können nur mit strategyId, role, confidence und evidence angelegt werden.

- TargetDefinitions sind als Zielwahlhilfe modelliert, nicht als Legalitätserzeugung.

- Das Schema erlaubt Karten ohne Strategieanker, aber nicht ohne geprüfte Semantik oder no_signal_reason.

## Hinweise / Risiken

- Zu frühe Namensfreiheit führt zu Signal-Wildwuchs. Der Katalog muss an dieser Stelle streng sein.

- Generische Signale können als Kompatibilitaet existieren, dürfen aber die praezise Funktion nicht ersetzen.

# Step 2. Aktive Runner-/Corp-Karten flächenhaft semantisch versorgen

**Ziel:** Alle aktiven Karten werden mit Taktiksignalen, optionalen Strategieankern und TargetDefinitions/TargetProfiles abgedeckt.

## Beschreibung

Dieser Schritt ist wegen des aktuellen Arbeitsstands vorzuziehen. Wenn aktive Runner- und Corp-Karten ohnehin gerade durchgegangen werden, sollte diese Arbeit als zentrale Foundation-Phase behandelt werden. Sie erzeugt die Datenbasis, auf der DeckDoctrine, taktische Ziele und später die neue Action-Auswahl stehen.

Der Scope sollte zuerst das aktive Originalset umfassen. Proteus sollte als späterer Erweiterungsblock geplant werden, weil es zusaetzliche Random-, Bad-Publicity-, Virus-, Ambush- und variabel zahlende Effekte einbringt. Die Semantikstruktur muss Proteus später tragen können, aber die erste Stabilitaet sollte am Originalset erreicht werden.

Pro Karte wird anhand von CardImplementation, Kartentext und strukturierter Wirkung geprüft, welche Funktion sie für die KI hat. Nicht jede Karte bekommt einen Strategieanker. Eine einfache Economy-Karte bleibt Economy. Ein normaler Breaker liefert Coverage. Eine echte Multiaccess-, Kill-, Search-Engine- oder Scoring-Payoff-Karte kann dagegen Strategieanker tragen.

Beispiele: Livewire's Contacts liefert Economy und bleibt support-only. Jack 'n' Joe liefert Draw und bleibt support-only. R&D Interface liefert R&D-Multiaccess und kann runner.rnd_pressure als payoff_anchor tragen. Scorched Earth liefert Meat-Damage-Payoff gegen tagged Runner und kann corp.damage_kill als payoff_anchor oder win_condition tragen.

Bei Karten mit Zielwahl wird nicht nur ein Taktiksignal gesetzt. Es wird auch festgehalten, welche Zielwahl die KI später treffen muss. Beispiel: Self-Modifying Code braucht Programm-Auswahl; Forged Activation Orders braucht ICE-Auswahl; Power Grid Overload braucht Hardware-Zielwahl mit Cybernetics-Ausnahme.

## Ergebnisse

- CardSemanticProfile für jede aktive Runner- und Corp-Karte im Scope.

- tacticSignals oder expliziter no_signal_reason je Karte.

- strategySupportPairs nur für echte Anker-/Payoff-/Engine-/Enabler-/Win-Condition-Karten.

- TargetDefinitions für Karten mit relevanter Ziel-, Modus- oder Auswahlentscheidung.

- RiskTags für relevante Drawbacks wie self_tag, brain_damage_self_inflicted, action_loss oder random_economy.

## Abnahmekriterien

- Keine aktive Karte bleibt ungeprüft.

- Keine Karte bekommt ein rein beschreibendes Subtyp-Signal als Ersatz für Funktion.

- Supportkarten erzeugen keine Strategy IDs.

- TargetDefinitions sind side-safe und verweisen auf legale Zieloptionen, nicht auf verstecktes Wissen.

- Die neue Semantik hat weiterhin keine Runtime-Wirkung.

## Hinweise / Risiken

- Dieser Schritt ist arbeitsintensiv, aber strategisch der wichtigste. Fehler hier vererben sich in Doctrine und Entscheidung.

- Bei unklaren Karten besser deferred markieren als eine falsche Strategie-ID setzen.

# Step 3. Taktiksignal-Katalog und Strategieanker-Regeln härten

**Ziel:** Die Vergabe von Signalen und Strategieankern wird gegen Wildwuchs, falsche Abstraktion und Scheinaussagen abgesichert.

## Beschreibung

Nach den ersten Kartenklassen entstehen erfahrungsgemaess neue Signale. Dieser Schritt verhindert, dass jedes Sonderverhalten zu einem einmaligen Signal wird. Ein Taktiksignal darf nur existieren, wenn es eine wiederverwendbare funktionale Aussage trägt.

Subtypen, Typen und Kartennamen sind keine Taktiksignale. Ein Chip ist nicht deshalb ein KI-Signal, weil er Chip heisst. Cybernetics ist für Targeting und Schutzlogik wichtig, aber nicht automatisch ein Setup-Signal. Vehicle ist ebenfalls Kartendaten- oder Constraint-Information, nicht automatisch Taktik.

Strategieanker werden noch strenger behandelt. Eine Karte bekommt nur dann einen Strategieanker, wenn sie eine größere Decklinie direkt trägt, wesentlich ermöglicht oder abschliesst. Einmalige Supporteffekte bleiben support-only, ausser sie liefern einen starken direkten Payoff wie HQ-/R&D-Multiaccess, Score-Closeout oder Kill-Payoff.

Zulaessig als Taktiksignal:

economy.burst_credit

setup.program_search

access.rnd_multiaccess

run.bypass_first_ice

defense.meat_damage_prevention

ice.trash_rezzed

Nicht zulaessig als reines Signal:

hardware.chip

setup.vehicle

setup.cybernetics

runner.prep

name_based_signal

## Ergebnisse

- Signal-Katalog mit Definitionen, Prefix-Regeln und Beispielen.

- Liste verbotener oder deprecated Signale.

- Strategieanker-Regelset für Payoff, Engine, Enabler, Defensive Tool, Emergency Tool, Win Condition.

- Konfliktregeln für alte roles/planRoles gegen neue Semantik.

## Abnahmekriterien

- Jedes neue Signal ist wiederverwendbar und funktional begründet.

- Kein neues Signal beschreibt nur Typ, Subtyp, Name oder Thema.

- Strategieanker sind mit Kartentext/Wirkung begründet, nicht mit Kartenfamilie.

- Confidence wird gesetzt, wenn die Zuordnung nicht eindeutig high ist.

- Support-only bleibt support-only.

## Hinweise / Risiken

- Generische Signale wie economy.generic oder setup.search können für Aggregation bleiben, aber die taktische Bewertung sollte an praeziseren Signalen haengen.

- Neue Strategy IDs sollten nur nach expliziter Entscheidung eingeführt werden.

# Step 4. TargetDefinitions und TargetProfiles modellieren

**Ziel:** Karten mit Zielwahl erhalten eine side-safe Beschreibung, wie legale Zieloptionen später bewertet werden sollen.

## Beschreibung

TargetDefinitions sind ein eigener Foundation-Block und sollten wegen der aktuellen Arbeit ebenfalls früh behandelt werden. Sie beschreiben nicht, ob eine Aktion legal ist. Sie beschreiben, welche Zielwahl relevant ist, sobald die Engine konkrete legale Zieloptionen anbietet.

Ein TargetProfile darf keine Hidden Information voraussetzen. Wenn ein ICE unbekannt ist, darf die KI nicht wissen, ob es ein starkes Sentry ist. Sie darf aber sichtbare Eigenschaften, bekannte Karten, eigene private Karten, legale Optionen und Boardstate-Kontext verwenden.

TargetDefinitions sind besonders wichtig für Such-, Installations-, Sabotage-, Expose-, ICE-Control-, Scoring- und Hardware-Trash-Effekte. Ohne sie kann die KI zwar wissen, dass eine Karte ein starkes Taktiksignal hat, aber sie weiss nicht, welches konkrete Ziel sinnvoll ist.

```ts
type TargetDefinition = {
  targetDefinitionId: string;
  targetKind: "card" | "server" | "ice" | "program" | "hardware" | "subroutine" | "mode";
  legalOptionSource: "legal_action_targets" | "choice_options";
  hiddenInfoPolicy: "visible_only" | "known_to_actor" | "own_private_allowed";
  preferences: TargetPreference[];
  fallback: "lowest_risk" | "first_legal" | "defer";
};
```

## Ergebnisse

- TargetDefinition-Schema.

- TargetProfiles für relevante Karten/Fähigkeiten.

- Hidden-Info-Policy pro Zielprofil.

- Fallback-Logik für unklare Zielwahl.

- Report für Karten mit Zielbedarf, aber fehlendem TargetProfile.

## Abnahmekriterien

- TargetProfiles erzeugen keine Legalität.

- TargetProfiles bewerten nur Optionen, die Engine/LegalAction bereits anbietet.

- Keine verdeckte Gegnerinformation wird zur Zielbewertung verwendet.

- Bei Karten mit mehreren Fähigkeiten ist klar, welches TargetProfile zu welcher Fähigkeit gehoert.

- Subtypen wie Cybernetics bleiben für Targeting erkennbar, werden aber nicht als Taktiksignal missbraucht.

## Hinweise / Risiken

- TargetProfiles werden erst voll wirksam, wenn die Action-Semantik-Bruecke konkrete Zieloptionen side-safe transportiert.

- Bis dahin sind sie wertvolle Daten, aber noch keine produktive Entscheidungslogik.

# Step 5. Semantik-Reports und Invariant-Checks bauen

**Ziel:** Die neue Semantik wird messbar, auditierbar und gegen falsche Runtime-Wirkung abgesichert.

## Beschreibung

Ohne Reports ist die Semantikarbeit schwer zu kontrollieren. Dieser Schritt baut die Qualitätssicherung für Kartenabdeckung, Signalkatalog, Strategieanker, TargetProfiles und Hidden-Info-Sicherheit. Die Reports sollen nicht nur Fehler finden, sondern auch den Arbeitsstand sichtbar machen.

Ein guter Report zeigt Scope, Out-of-Scope, Inventarcounts, geprüfte aktive Karten, geprüfte inaktive Karten, Count-Abweichungen, neue/geänderte/entfernte Signale, Strategieanker, StrategySupportPairs, TargetProfile-Status, Deferred Items, Verifikation, Risiken und Folgeempfehlungen.

Invariant-Checks sind die harten Regeln. Sie verhindern, dass Supportsignale zu Strategien werden, dass verbotene Subtyp-Signale wieder auftauchen, dass neue Semantik Runtime-Wirkung bekommt oder dass TargetProfiles Hidden Information verwenden.

Beispiel-Checks:

check:ai-semantic-coverage

check:ai-tactic-signal-catalog

check:ai-strategy-anchors

check:ai-target-profiles

check:ai-semantic-no-runtime-effect

## Ergebnisse

- semantic-card-coverage-report.

- tactic-signal-catalog-report.

- strategy-anchor-report.

- target-profile-coverage-report.

- deferred-items-report.

- hidden-info-risk-report.

- Invariant-Checks im CI- oder lokalen Checkpfad.

## Abnahmekriterien

- Jede aktive Karte im Scope ist abgedeckt oder explizit deferred.

- Jedes verwendete Signal ist katalogisiert.

- Keine verbotenen Subtyp-only-Signale werden verwendet.

- Keine StrategySupportPairs ohne role/confidence/evidence.

- Keine neuen Strategy IDs ohne ausdrueckliche Entscheidung.

- Keine Planner-/ActionScore-/PlanWeight-/Engine-/Legalitätswirkung entsteht.

- TargetProfiles bleiben side-safe.

## Hinweise / Risiken

- Dieser Schritt sollte parallel zur Kartenarbeit entstehen, nicht erst danach. Sonst wird die Nacharbeit zu teuer.

- Reports sollten zwischen Repo-Wahrheit, Spoiler-Text und Prompt-Wahrnehmung unterscheiden können.

# Step 6. Action-Semantik-Bruecke bauen

**Ziel:** LegalActions werden read-only in semantisch verstandene Aktionskandidaten übersetzt.

## Beschreibung

Die Action-Semantik-Bruecke ist der Punkt, an dem Karten- und Decksemantik handlungsfaehig wird. Die KI wählt am Ende keine abstrakte Strategie und kein Taktiksignal, sondern eine konkrete LegalAction. Deshalb muss jede angebotene LegalAction semantisch verstanden werden.

Die Projektion erzeugt keine Legalität. Sie liest nur, was die Engine bereits als legal anbietet, und verbindet diese Action mit Quelle, Fähigkeit, Kosten, Timing, Zielinformationen, Boardstate-Kontext und Kartensemantik. Erst dadurch kann die KI später sagen: Diese konkrete Action hilft gegen dieses taktische Ziel.

Für kartenbasierte Actions muss die Quellkarte side-safe auflösbar sein. Bei Karten mit mehreren Fähigkeiten muss die konkrete Ability identifizierbar sein. Für Zielaktionen müssen konkrete Zieloptionen oder ausgewählte Ziele sichtbar sein. Ohne diese Informationen bleibt TargetProfile-Logik theoretisch.

type ActionSemanticCandidate = {

actionId: string;

actionType: ActionType;

sourceKind: "card" | "basic_action" | "game_rule";

sourceCardId?: string;

abilityId?: string;

tacticSignals: TacticSignal[];

strategySupport: StrategySupportPair[];

targetProfiles: TargetDefinition[];

costProfile: ActionCostProfile;

timingProfile: TimingProfile;

targetContext?: TargetContext;

boardContext: BoardContextSummary;

hardGates: ActionGateResult[];

};

## Ergebnisse

- projectLegalActionToSemanticCandidate().

- projectCardActionSemantics().

- projectChoiceActionSemantics().

- targetContext-Projektion.

- costProfile- und timingProfile-Projektion.

- Action-Semantics-Report für LegalAction-Coverage.

## Abnahmekriterien

- Alle LegalActions können mindestens mit neutraler Semantik projiziert werden.

- Kartenaktionen loesen sourceCardId und abilityId korrekt auf, soweit side-safe verfuegbar.

- TargetProfiles erhalten konkrete legale Zieloptionen oder werden als nicht handlungsfaehig markiert.

- Kosten, Timing und Boardstate-Kontext sind verfuegbar.

- Die Projektion trifft noch keine Entscheidung und erzeugt keine Legalität.

## Hinweise / Risiken

- Ein Cutover ohne diese Bruecke wuerde bedeuten, dass die KI zwar Karten besser versteht, aber konkrete Actions weiterhin unsauber interpretiert.

- Dieser Step ist der wichtigste technische Gate vor echter Runtime-Wirkung.

# Step 7. Basic-Action-Semantik ergänzen

**Ziel:** Allgemeine Aktionen ohne Karte erhalten eine kleine kontrollierte Semantik.

## Beschreibung

Nicht jede LegalAction kommt aus einer Karte. Credit nehmen, Karte ziehen, Tag entfernen, Run starten, Run fortsetzen, Jack out, ICE rezzen, Agenda advancen oder Agenda scoren sind allgemeine oder regelbasierte Aktionen. Sie brauchen eigene Semantik, weil sie in vielen Spielsituationen zentrale taktische Optionen sind.

Diese Semantik darf nicht aus Karten-Hints geraten werden. Sie ist engine- und regelnah. Ein Credit ist Basic Economy. Karte ziehen ist Basic Setup/Draw. Tag entfernen ist Survival/Tag-Clear. Agenda scoren ist Score-Closeout. Diese Bedeutungen müssen für das spätere Entscheidungsmodul genauso sichtbar sein wie Kartensignale.

Basic-Action-Semantik ist auch wichtig für NeutralDoctrine. Ein ankerloses Deck muss trotzdem solide Grundentscheidungen treffen können: Geld nehmen, Karten ziehen, offene Risiken reduzieren, sichere Optionen nutzen.

Credit nehmen → basic.economy

Karte ziehen → basic.draw

Tag entfernen → defense.tag_clear

Run starten → run.start

Run fortsetzen → run.continue

Jack out → run.abort

ICE rezzen → corp.ice_activation

Agenda advancen → corp.score_progress

Agenda scoren → corp.score_closeout

## Ergebnisse

- Katalog für BasicAction-Semantik.

- Mapping von ActionType zu Basissignalen.

- Kosten-/Timing-/Boardstate-Kontext für BasicActions.

- Fallback-Semantik für unbekannte oder rein systemische Actions.

## Abnahmekriterien

- Alle nicht-kartenbasierten Kernaktionen erhalten Semantik.

- BasicAction-Semantik ist unabhängig von Karten-Hints.

- NeutralDoctrine kann mit BasicActions sinnvoll arbeiten.

- BasicAction-Semantik erzeugt keine Strategieanker.

- Keine Hidden-Info-Abhängigkeit.

## Hinweise / Risiken

- BasicActions sollten klein und kontrolliert bleiben. Sie sind kein Ersatz für Karten- oder Decksemantik.

- Sie sind aber unverzichtbar, damit die KI auch ohne starke Kartenoptionen handlungsfaehig bleibt.

# Step 8. DeckDoctrine v2 diagnostisch bauen

**Ziel:** Aus Kartenprofilen wird ein Deckstrategieprofil mit Vollständigkeit, Lücken, Rollenstatus und NeutralDoctrine.

## Beschreibung

DeckDoctrine v2 betrachtet nicht einzelne Karten isoliert, sondern das gesamte Deck. Sie aggregiert Taktiksignale, Strategieanker, Rollen innerhalb der Strategieanker, Deckzusammensetzung, Lücken und Schwachstellen.

Der zentrale Unterschied zur alten Doctrine: Keine Strategie ohne echte Strategieanker. Ein Deck mit Economy, Draw, einfachen Breakern und Utility ist nicht automatisch R&D-Druck, HQ-Druck, Rig-Builder oder Glacier. Es ist ankerlos oder neutral, bis echte Anker eine Decklinie belegen.

DeckDoctrine v2 muss nicht nur sagen, ob eine Strategie vorhanden ist. Sie muss sagen, wie vollständig und belastbar sie ist. Eine Tag/Punish-Linie mit Tagquellen, aber ohne Payoff ist nicht spielbar. Ein Damage/Kill-Payoff ohne passende Bedingungen ist unvollständig. R&D-Multiaccess ohne Economy/Coverage ist ein Anker mit Supportlücken.

type DoctrineStatus =

| "unavailable"

| "empty_snapshot"

| "anchorless"

| "partial"

| "complete";

type StrategyCompleteness =

| "absent"

| "hinted"

| "incomplete"

| "playable"

| "strong";

type RoleStatus =

| "absent_from_deck"

| "present_in_deck_unseen"

| "visible_or_installable"

| "active"

| "unknown_snapshot";

## Ergebnisse

- buildDeckDoctrineV2().

- StrategyProfile mit Weight, Completeness, Confidence und Evidence.

- RoleStatusProfile.

- NeutralDoctrine für anchorless/empty/unavailable.

- Doctrine-Diagnostics-Report.

- Fixture-Decks für bekannte Archetypen und absichtlich ankerlose Decks.

## Abnahmekriterien

- Keine Fallback-Archetypen wie automatisch rig_builder oder glacier.

- Ankerlose Decks erzeugen NeutralDoctrine.

- Fehlende Rollen werden als Lücken gemeldet, nicht durch Supportsignale ersetzt.

- RoleStatus unterscheidet absent_from_deck von present_in_deck_unseen.

- DeckDoctrine v2 bleibt zunächst diagnostisch ohne Runtime-Wirkung.

## Hinweise / Risiken

- Der wichtigste Fehler, den dieser Schritt verhindern muss: Die KI sucht nach Payoffs, die im Deck gar nicht existieren.

- Doctrine ist Gewichtung und Kontext, kein Autopilot.

# Step 9. Taktische Zwischenziele modellieren

**Ziel:** DeckDoctrine, NeutralDoctrine und Boardstate werden in kurzfristige Handlungsabsichten übersetzt.

## Beschreibung

Taktische Zwischenziele sind die Bruecke zwischen langfristigem Deckcharakter und konkreten LegalActions. Sie beantworten, was die KI jetzt vorbereiten oder erreichen soll. Sie sind noch keine Aktion, sondern ein Zielzustand oder eine kurzfristige Absicht.

Ein Runner kann zum Beispiel Economy stabilisieren, fehlende Breaker-Coverage reparieren, eine Schlüsselkarte suchen, einen gefaehrlichen Remote contesten, Tags entfernen oder einen sicheren Central-Run nehmen. Eine Corp kann Economy stabilisieren, HQ/R&D schuetzen, ein Remote vorbereiten, Scorefenster nutzen, ICE rezzen oder ein sichtbares Punish-Fenster ausnutzen.

Taktische Ziele müssen Boardstate über Strategie stellen können. Ein R&D-orientiertes Deck muss trotzdem einen Remote contesten, wenn die Corp kurz vor dem Sieg steht. Eine Tag/Punish-Corp darf Punish nur priorisieren, wenn die sichtbare Grundlage vorhanden ist.

type TacticalGoal = {

goalId: string;

side: Side;

priority: number;

source: "neutral_doctrine" | "deck_doctrine" | "boardstate" | "threat";

requiredSignals: TacticSignal[];

blockers: TacticalGoalBlocker[];

evidence: string[];

};

## Ergebnisse

- Runner-neutral goals.

- Corp-neutral goals.

- StrategyGoal-to-TacticalGoal-Mapping.

- Boardstate-/Threat-basierte Ziele.

- Goal-Priority- und Goal-Blocker-Modell.

- Debug-Ausgabe für erzeugte Ziele.

## Abnahmekriterien

- Jedes Ziel hat Quelle, Prioritaet, Evidence und Blocker.

- NeutralDoctrine erzeugt sichere Grundziele bei ankerlosen Decks.

- DeckDoctrine gewichtet Ziele, diktiert sie aber nicht.

- Boardstate kann Strategiegewicht überstimmen.

- Ziele bleiben unabhängig von konkreten LegalActions formulierbar.

## Hinweise / Risiken

- Zu viele Spezialziele führen später zu einem neuen Monolithen. Zielgruppen sollten breit bleiben: Setup/Coverage, Economy, Run/Access, Remote, Survival, Corp-Scoreline, ICE-Portfolio, Tag/Punish, Target-Auswahl.

# Step 10. Semantisches Entscheidungsmodul bauen

**Ziel:** Die neue KI bewertet semantische LegalAction-Kandidaten gegen taktische Ziele und wählt eine konkrete LegalAction.

## Beschreibung

Dieser Schritt ist der eigentliche neue KI-Spieler. Er sollte nicht auf den alten RunnerPlanKind- und CorpPlanKind-Strukturen aufbauen. Stattdessen nimmt er TacticalGoals, ActionSemanticCandidates, Boardstate, BeliefState, Reachability, Kosten, Timing und Risiken und erstellt ein Ranking legaler Aktionen.

Die Entscheidungskette lautet: PlayerView lesen, LegalActions semantisch projizieren, DeckDoctrine v2 laden, Boardstate/BeliefState/Reachability erzeugen, TacticalGoals bilden, harte Gates anwenden, Actions gegen Ziele scoren, beste Action wählen, Debug/WhyNot ausgeben.

Harte Gates bleiben vor jedem Score. Eine Action kann strategisch passend wirken, aber trotzdem ausgeschlossen sein, wenn Access nicht erreichbar ist, Kosten nicht tragbar sind, das Timing falsch ist, Zielinformationen fehlen oder die Aktion Hidden-Info-Annahmen benoetigen wuerde.

chooseSemanticAiAction(input)

→ buildActionSemanticCandidates(input.legalActions)

→ buildDeckDoctrineV2(deckSnapshot)

→ buildTacticalGoals(boardstate, doctrine, beliefState)

→ applyHardGates(candidates, goals)

→ scoreActionAgainstGoals(candidates, goals)

→ rankCandidates()

→ return selected LegalAction + decision trace

## Ergebnisse

- chooseSemanticAiAction().

- HardGate-System.

- Action-vs-Goal-Scoring.

- Ranking und Tie-Breaker.

- DecisionTrace.

- WhyNot-Ausgabe für abgelehnte Alternativen.

- Public-Debug-Scrubber.

## Abnahmekriterien

- Die KI gibt nur ActionIds aus, die aus LegalActions stammen.

- Keine Hidden-Info-Abhängigkeit.

- Reachability und Kosten werden vor strategischer Gewichtung geprüft.

- Taktiksignale werden über wenige Consumer-Gruppen bewertet, nicht als hunderte Spezialregeln.

- Die Entscheidung ist über TacticalGoal, Candidate, Gates und Score erklaerbar.

- Zunächst keine produktive Ausfuehrung, sondern Shadow Mode.

## Hinweise / Risiken

- Dieser Step sollte erst beginnen, wenn die Action-Semantik-Bruecke belastbar ist.

- Sonst entsteht wieder ein altes Heuristiksystem mit neuem Vokabular.

# Step 11. Shadow Mode gegen Legacy-KI

**Ziel:** Der neue KI-Spieler entscheidet parallel, die alte KI führt aber weiterhin aus.

## Beschreibung

Shadow Mode ist der Sicherheitsraum für die neue KI. Bei jedem Entscheidungspunkt werden Legacy-Entscheidung und Semantic-Entscheidung berechnet. Ausgeführt wird zunächst weiter die Legacy-Entscheidung. Die neue Entscheidung wird nur protokolliert und ausgewertet.

Der Vergleich soll nicht beweisen, dass die neue KI identisch spielt. Abweichungen sind erwuenscht, wenn sie besser begründet sind. Entscheidend ist, dass die neue KI keine illegalen, hidden-info-basierten, offensichtlich toten oder unerreichbaren Entscheidungen bevorzugt.

Shadow-Auswertung sollte Szenarien und echte Simulationsspiele abdecken: Setup, Economy, Breaker-Coverage, sichere Runs, Remote-Contest, Corp-Scoring, Tag/Punish, Damage/Kill und komplexe Zielwahl.

legacyDecision = chooseLegacyAiAction(input)

semanticDecision = chooseSemanticAiAction(input)

actualDecision = legacyDecision

writeComparisonReport(legacyDecision, semanticDecision)

## Ergebnisse

- semantic-vs-legacy-report.

- Scenario-Diff-Report.

- DecisionTrace-Fixtures.

- Known-Bad-Decision-Liste.

- Metriken für Legalität, Hidden Info, Reachability, Zielerfuellung und Erklaerbarkeit.

## Abnahmekriterien

- 0 illegale Semantic-Entscheidungen.

- 0 Hidden-Info-Verstoesse.

- Deterministische Ausgabe bei gleichem Seed/State.

- Gute Erklaerbarkeit der wichtigsten Abweichungen.

- Bekannte Smoke-Szenarien bestehen.

- Fehlerhafte semantische Entscheidungen werden kategorisiert und reproduzierbar gemacht.

## Hinweise / Risiken

- Legacy darf im Shadow Mode nicht als Wahrheit behandelt werden. Es ist Vergleichspunkt, nicht Ziel.

- Ein begründeter Unterschied zugunsten der neuen KI ist ein positives Signal.

# Step 12. Bereichsweiser Cutover

**Ziel:** Die neue KI übernimmt produktive Entscheidungen stufenweise und per Feature Flag.

## Beschreibung

Der produktive Wechsel sollte nicht als Big Bang erfolgen. Die neue KI übernimmt zuerst Bereiche mit geringem Risiko und hoher semantischer Klarheit, danach komplexere Bereiche wie Runs, Remote-Contest, Corp-Scoring, Tag/Punish und Damage/Kill.

Jeder Bereich bekommt einen Feature Flag und klare Rückfallmöglichkeit auf Legacy. Wenn ein Bereich regressiert, wird nicht die gesamte neue KI abgeschaltet, sondern nur der betroffene Capability-Schnitt.

Eine sinnvolle Reihenfolge ist: BasicActions, Runner Setup, Corp Setup, sichere Runs und tote Runs vermeiden, HQ/R&D-Schutz, Remote-Contest, Remote-Scoring, Tag/Punish/Damage/Kill, komplexe TargetProfiles, vollständiger semantischer KI-Spieler.

semanticAi.basic

semanticAi.runnerSetup

semanticAi.corpSetup

semanticAi.runnerRuns

semanticAi.corpScoring

semanticAi.punish

semanticAi.targetProfiles

semanticAi.full

## Ergebnisse

- Feature-Flag-Matrix.

- Bereichsspezifische Acceptance-Szenarien.

- Rollback-Mechanismus auf Legacy.

- Cutover-Report je Capability.

- Produktive Debug-Ausgabe für Entscheidungen.

## Abnahmekriterien

- Jeder aktivierte Bereich hat grünen Shadow-Report.

- Rollback auf Legacy funktioniert.

- Keine bekannten Legalitäts- oder Hidden-Info-Probleme.

- Neue KI ist im aktivierten Bereich mindestens stabiler oder besser erklaerbar als Legacy.

- Feature Flags sind dokumentiert.

## Hinweise / Risiken

- Zu früher Full-Cutover erhoeht Fehlersuche und Rückbaukosten.

- Der beste erste produktive Bereich ist Basic/Setup, nicht Tag/Punish oder komplexe Runs.

# Step 13. Legacy einfrieren, migrieren oder entfernen

**Ziel:** Nach erfolgreichem Cutover wird die alte KI-Logik nicht weiter gepflegt oder schrittweise entfernt.

## Beschreibung

Sobald der neue Pfad stabile Bereiche produktiv übernimmt, sollte der Legacy-Pfad eingefroren werden. Das bedeutet: keine neuen Features, keine neuen Strategien, keine neuen Semantikdaten in alte PlanScorer. Nur noch Bugfixes, solange der Pfad als Fallback gebraucht wird.

Später kann Legacy aus der Runtime entfernt werden. Einige Teile können als Fixtures, Vergleichsdaten oder Regressionsszenarien erhalten bleiben. Alte roles/planRoles und PlanWeights sollten nicht mehr fachliche Wahrheit sein.

Die Entfernung sollte erst passieren, wenn der neue semantische Pfad alle relevanten Bereiche abdeckt und Shadow-/Regressionsergebnisse stabil sind. Vorher bleibt Legacy ein praktisches Sicherheitsnetz.

## Ergebnisse

- Legacy-Freeze-Entscheidung.

- Liste ersetzter Legacy-Funktionen.

- Liste noch benoetigter Legacy-Fixtures.

- Migration oder Löschung alter roles/planRoles.

- Runtime-Selector ohne Legacy-Abhängigkeit.

## Abnahmekriterien

- Keine neuen Features landen im Legacy-Pfad.

- Alte PlanWeights werden nicht mehr für neue Semantik verwendet.

- Alle produktiven Capabilities haben semantische Nachfolger.

- Regressionen sind durch neue Tests oder Fixtures abgedeckt.

- Entfernung ist reversibel dokumentiert oder sicher abgeschlossen.

## Hinweise / Risiken

- Nicht zu früh löschen. Aber auch nicht dauerhaft mitschleppen, sobald der neue Pfad trägt.

- Das Ziel ist kein hybrides Dauer-System, sondern ein klarer semantischer KI-Spieler.

# Step 14. Proteus-Ausbau nach Originalset-Stabilitaet

**Ziel:** Proteus wird erst nach stabiler Originalset-Semantik und Action-Bruecke systematisch geöffnet.

## Beschreibung

Proteus erweitert den Kartenraum deutlich und bringt viele Effekte mit, die für die KI anspruchsvoll sind: Randomisierung, Bad Publicity, Ambush/Virus-Interaktionen, variable Rez- oder Zusatzkosten, temporäre Aktionen, komplexe Run-Modifikationen und neue Targeting-Fragen.

Deshalb sollte Proteus nicht der erste Stabilitaetsmassstab sein. Die Semantikstruktur muss Proteus tragen können, aber die Produktiv-KI sollte zuerst am Originalset stabil werden. Danach können Proteus-Kartenklassen in kontrollierten Review-Batches integriert werden.

Der richtige Einstieg für Proteus ist nicht sofort vollständige Runtime-Wirkung, sondern dieselbe Kette wie beim Originalset: Semantikprofile, Signal-Katalog-Erweiterungen, TargetDefinitions, Reports, Action-Semantik, Doctrine-Diagnostik, Shadow Mode und erst danach Cutover.

## Ergebnisse

- Proteus-Scope-Plan.

- Proteus-Signal-Erweiterungsreport.

- Proteus-TargetProfile-Gap-Report.

- Proteus-spezifische RiskTags und Constraints.

- Shadow-Szenarien für Random-, Virus-, Bad-Publicity- und Ambush-Karten.

## Abnahmekriterien

- Originalset-Semantik und Action-Bruecke sind stabil.

- Proteus-Karten erzeugen keine unkontrollierten neuen Signal-Familien.

- Komplexe Effekte werden deferred, wenn Action-Semantik oder TargetProfiles fehlen.

- Keine Proteus-Runtime-Wirkung ohne eigene Checks und Shadow-Auswertung.

## Hinweise / Risiken

- Proteus ist ein Erweiterungsscope, kein Shortcut zur neuen KI.

- Wenn Proteus zu früh produktiv wird, entstehen wahrscheinlich viele Spezialfaelle im Entscheidungsmodul.

# 4. Gates vor produktiver KI-Wirkung

Vor dem produktiven Einsatz des neuen semantischen KI-Spielers sollten folgende Gates erfuellt sein. Diese Liste ist absichtlich streng, weil sie verhindert, dass die neue Semantik zu früh in alte oder halbfertige Entscheidungslogik einsickert.

| **Gate** | **Name**                | **Bedingung**                                                                                                  |
|----------|-------------------------|----------------------------------------------------------------------------------------------------------------|
| **G1**   | Semantik-Coverage       | Aktive Karten im Scope sind mit tacticSignals oder no_signal_reason abgedeckt.                                 |
| **G2**   | Signal-Katalog          | Alle verwendeten Taktiksignale sind katalogisiert und funktional definiert.                                    |
| **G3**   | Strategieanker-Qualität | StrategySupportPairs existieren nur bei echten Ankern und enthalten strategyId, role, confidence und evidence. |
| **G4**   | Target-Sicherheit       | TargetProfiles sind side-safe, hidden-info-frei und erzeugen keine Legalität.                                  |
| **G5**   | Keine Runtime-Wirkung   | Semantikdaten verändern vor dem Cutover keine produktive Entscheidung.                                         |
| **G6**   | Action-Semantik         | LegalActions können mit Quelle, Ability, Kosten, Timing, Zielkontext und Semantik projiziert werden.           |
| **G7**   | DeckDoctrine v2         | Ankerlose, partielle und vollständige Strategien werden diagnostisch unterschieden.                            |
| **G8**   | Hard Gates              | Legalität, Kosten, Timing, Sichtbarkeit, Reachability und Boardstate können vor Scoring blocken.               |
| **G9**   | Shadow Mode             | Neue Entscheidungen werden parallel verglichen, ohne ausgeführt zu werden.                                     |
| **G10**  | Rollback                | Jede produktive Aktivierung ist per Feature Flag auf Legacy rückstellbar.                                      |

# 5. Empfohlene nächste Umsetzungsschnitte

Die Roadmap laesst sich in konkrete Arbeitsbloecke schneiden. Für den aktuellen Stand sind die ersten drei Schnitte entscheidend.

## Schnitt A - Semantic Foundation 1

Dieser Schnitt umfasst Schema, Taxonomie und erste Kartenklassen. Er sollte unmittelbar an die laufende Annotation aktiver Karten anschliessen. Ziel ist nicht, besser zu spielen, sondern eine saubere, prüfbare Datengrundlage zu erzeugen.

- CardSemanticProfile-Schema finalisieren.

- TacticSignal- und StrategyRole-Katalog initialisieren.

- Aktive Runner-Hardware, Runner-Preps oder eine andere klar abgegrenzte Kartenklasse fertig annotieren.

- TargetDefinition-Schema und erste TargetProfiles für Such-/ICE-/Hardware-Zielwahl definieren.

- Coverage- und Invariant-Checks für diesen Scope bauen.

## Schnitt B - Semantic Coverage Originalset

Dieser Schnitt rollt die Semantik auf alle aktiven Originalset-Karten aus. Das Ergebnis ist ein vollständiger semantischer Kartenbestand ohne Runtime-Wirkung.

- Alle aktiven Runner-Karten abdecken.

- Alle aktiven Corp-Karten abdecken.

- StrategySupportPairs nur für echte Anker setzen.

- TargetProfile-Gaps sichtbar machen und priorisieren.

- Deferred Items dokumentieren statt unsichere Signale zu erzwingen.

## Schnitt C - Action Semantics Read-only

Dieser Schnitt verbindet LegalActions read-only mit der neuen Semantik. Er ist das technische Gate vor jeder echten KI-Wirkung.

- ActionSemanticCandidate bauen.

- BasicAction-Semantik ergänzen.

- SourceCardId und AbilityId für kartenbasierte Actions auflösen.

- TargetContext für konkrete legale Zieloptionen erzeugen.

- Action-Semantics-Report für Teststates und Fixtures erstellen.

# 6. Was explizit nicht passieren sollte

- Neue Strategiegewichte direkt in alte Runner-/Corp-PlanScorer einbauen.

- Alte roles oder planRoles als neue Wahrheit übernehmen.

- Taktiksignale automatisch zu Strategieankern hochstufen.

- DeckDoctrine v2 produktiv schalten, bevor LegalActions semantisch verstanden werden.

- TargetProfiles als eigene Entscheidungslogik behandeln.

- Proteus produktiv öffnen, bevor Originalset-Semantik und Action-Bruecke stabil sind.

- Ein neues Spezialregel-Monolithen bauen, in dem jedes Taktiksignal einzeln gescored wird.

# 7. Glossar

| **Begriff**                          | **Definition**                                                                                                                |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Taktiksignal**                     | Kontrollierter Funktionsbegriff, der beschreibt, wofür die KI eine Karte oder Action taktisch nutzen kann.                    |
| **Strategieanker**                   | Hinweis, dass eine Karte eine größere Decklinie direkt trägt, belegt, wesentlich ermöglicht oder abschliesst.                 |
| **StrategySupportPair**              | Paar aus strategyId und Rolle, ergänzt um Confidence und Evidence.                                                            |
| **TargetDefinition / TargetProfile** | Beschreibung, wie die KI unter legal angebotenen Zieloptionen sinnvoll wählen soll.                                           |
| **DeckDoctrine v2**                  | Diagnostisches Deckstrategieprofil mit Strategie-Vollständigkeit, Rollenstatus, Lücken und NeutralDoctrine.                   |
| **NeutralDoctrine**                  | Seiten-Grundprioritaeten für ankerlose oder unklare Decks, keine erfundene Strategie.                                         |
| **ActionSemanticCandidate**          | Read-only Projektion einer bereits legalen Engine-Action in eine semantisch auswertbare Form.                                 |
| **Taktisches Zwischenziel**          | Kurzfristige Handlungsabsicht aus Boardstate, Doctrine und NeutralDoctrine.                                                   |
| **Hard Gate**                        | Nicht verhandelbare Blockade vor Scoring, z.B. Legalität, Kosten, Timing, Sichtbarkeit, Reachability oder Hidden-Info-Schutz. |
| **Shadow Mode**                      | Parallelbetrieb, in dem die neue KI entscheidet und protokolliert, aber die Legacy-KI weiter ausführt.                        |

# 8. Kernaussage

Die laufende Versorgung aktiver Karten mit Taktiksignalen, Strategieankern und TargetDefinitions sollte priorisiert werden. Sie ist die richtige frühe Foundation-Phase. Entscheidend ist, sie streng read-only und prüfbar zu halten, bis die Action-Semantik-Bruecke steht.

Die eigentliche neue KI sollte danach separat entstehen: nicht als Erweiterung der alten Planlogik, sondern als semantisches Entscheidungsmodul, das taktische Ziele gegen semantisch verstandene LegalActions bewertet. Erst Shadow Mode, dann bereichsweiser Cutover, dann Legacy-Freeze oder Entfernung.

# AI-Hints: Quelle und Runtime-Vertrag

Status: **aktueller generierter CardSpec-Vertrag**  
Stand: 2026-10-22

## Autorenquelle und Datenpfad

Die kartenspezifische Autorenwahrheit liegt in CardSpec. Maßgeblich ist die
[zentrale CardSpec-Architektur](../central-card-specification-and-registry-target-state-2026-08-09.md).
Hints projizieren daraus wiederverwendbare Funktionen und Planungsmetadaten;
sie sind weder zweite manuelle Kartenwahrheit noch Regel- oder Action-Autorität.

| Schritt                          | Aktuelle Quelle                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CardSpec zu Hint transformieren  | `deriveCardSpecAiHint` in [card-spec-ai-hint-compiler.ts](../../../packages/ai/src/card-spec-ai-hint-compiler.ts)                                                                                    |
| Artefakt bauen und serialisieren | [card-spec-ai-hint-artifact-builder.ts](../../../scripts/lib/card-spec-ai-hint-artifact-builder.ts)                                                                                                  |
| Generieren / auf Drift prüfen    | [generate-card-spec-ai-hints.mts](../../../scripts/generate-card-spec-ai-hints.mts)                                                                                                                  |
| Generiertes Bündel               | [card-spec-ai-hints-generated.json](../../../data/ai/card-spec-ai-hints-generated.json)                                                                                                              |
| Runtime-Datenpaket               | [@netgrid/runtime-data](../../../packages/runtime-data/package.json), Export `./card-spec-ai-hints`                                                                                                  |
| Validieren und konsumieren       | [catalog-ai-hint-authority.ts](../../../packages/ai/src/catalog-ai-hint-authority.ts), [generated-ai-hint-artifact-validation.ts](../../../packages/ai/src/generated-ai-hint-artifact-validation.ts) |
| AI-Fassade                       | [ai-hints.ts](../../../packages/ai/src/ai-hints.ts): `AI_HINTS_BY_CARD`, `createAiHintsByCard`                                                                                                       |

## Pflege und Grenzen

Mechanische oder annotierte Fakten werden an ihrer Autorenquelle geändert,
anschließend wird das Bündel erzeugt. Generierte Hintdatensätze werden nicht
von Hand korrigiert. Schema-/Compilerstand und Quellenfingerprints werden
beim Laden validiert; ein fehlerhaftes Artefakt verlangt einen Ursachenfix.

Aktuelle Befehle aus [package.json](../../../package.json):

- `corepack pnpm generate:card-spec-ai-hints`: Artefakt schreiben.
- `corepack pnpm check:card-spec-ai-hints`: Reproduzierbarkeit / Drift prüfen.
- `corepack pnpm check:ai-hint-metadata-contracts`: Metadatenvertrag prüfen.

Runtime-Quellen werden nach fachlichem Zweck organisiert, nicht nach
historischen Release-, Batch-, Draft- oder Approval-Schnitten. Alte Snapshots
begründen keine Aufbewahrungspflicht. Es gibt keine zusätzliche normative
Runtime-Quelle `ai-card-hints-active.json` und keine Pflicht zur Erhaltung des
entfernten Snapshots `ai-card-hints-1.3.1.json`.

Hint- und Doctrine-Daten unterstützen den zuständigen Planowner. Die aktuelle
Ability-, Kosten-, Ziel- und LegalAction-Bindung bleibt Aufgabe der Semantik
und der Engine; ein Hint allein zertifiziert keinen ausführbaren Step.

`trash_fully_broken_passed_ice` projiziert ICE-Entfernung nach vollständigem
Break, die Zahlung des aktuellen Rezpreises und den Selbsttrash des Programms.
Die Installationskosten bleiben davon getrennt. Kosten, Ziel und Timing müssen
dem typisierten Vertrag entsprechen; abweichende Formen scheitern sichtbar.
Der feste Zielbezug `that_ice` erzeugt kein Auswahlprofil und keine zusätzliche
Strategieannotation. Die reale Entfernung bleibt an die aktuelle Engine-Quote
und den bestehenden begrenzten Central-Pressure-Parent gebunden.

`private_look` wird aus derselben typisierten Ability sowohl auf Kartenebene
als auch in der exakten Capability projiziert. Zone, Kartenzahl und Timing
bleiben gebunden; eine als Kosten geopferte Quelle ist endlich, eine dauerhaft
nutzbare Quelle wiederholbar. Der Action-Semantik-Join übernimmt nur die
gebundene Capability. Ungebundene HQ-/R&D-Information fällt damit unter den
bestehenden `runner.pressure_central`-Owner und dessen explizite Ablehnung
ohne Vor-Run-Step. Die korrekte Projektion belegt noch keinen strategisch
sinnvollen bezahlten Informationsschritt; dieser benötigt weiterhin eine
side-sichere Neuquote des anschließenden Zugriffs.

## Typisierte Recovery- und Spielkosten

`search_trash_to_grip` projiziert die kanonische Auswahl einer beliebigen
passenden Heap-Karte als `card_recovery` und `search`, mit dem ursprünglichen
Filter `program` oder `any_card`. Die Deckdiagnostik zählt beide Formen der
Heap-Rückgewinnung; der engere Top-Heap-Consumer erkennt weiterhin nur
`move_top_trash_to_grip`. Stack-Suche begründet keine Recovery. Diese Fakten
verändern weder Legalität noch die plan-, quellen- und versionsgebundene
Zielauswahl; unbekannte Effektformen scheitern sichtbar.

`hq_access_expose_all_installed_corp_cards` beschreibt einen HQ-Zugriff als
Auslöser für das Aufdecken installierter Corp-Karten. Daraus entstehen
`expose_info` und die entsprechenden Expose-Funktionssignale. Weder ein
vollständiger Blick in die HQ-Hand noch `hq_info` oder `access.hq_full_reveal`
gehören zu dieser Wirkung. Echte `private_look`-Fähigkeiten behalten ihre
eigene typisierte Zone und Informationsmenge.

Direktes `lifecycle.on_score.gain_credits` erzeugt aus der mechanischen Quelle
eine endliche Creditgutschrift mit `when_scored`-Timing und `score.credit_gain`.
Ein Agenda-Scoringeffekt beziehungsweise eine eigene Ability schließt die
Klassifizierung `no_ability_agenda` aus. Die kanonischen Corp-Facts erfassen
denselben unbedingten liquiden Ertrag auch für den bestehenden
Score-/Defense-Reservehorizont. Diese Gutschrift bezahlt keine vorangehenden
Advances. Bedingte Schwellen, Counterbanken und andere zusammengesetzte
Scoreeffekte begründen diesen Nachweis nicht; Nebenrisiken bleiben separat.

Tagprävention übernimmt Verbrauch und Zahlung getrennt aus
`tagPreventionSources.cost`. Nur `trash_source` und
`credit_and_trash_source` kennzeichnen die Quelle als endlich und erzeugen
die entsprechende Verbrauchsmechanik. Reine Credits, Tappen und der Verzicht
auf eine spätere Aktion opfern die Quelle nicht. Ein Creditmechanik-Fakt
entsteht nur bei tatsächlich positiven Creditkosten. Die Regression prüft
alle realen Quellen, das generierte Artefakt und den Verbrauchsconsumer der
Handentwicklung; ein korrekter Hint allein belegt weiterhin keinen
dominanten Installationsplan.

`corp_archives_to_hq` beschreibt grundsätzlich Archives-Recovery. Die
ICE-Spezialisierung entsteht nur aus `filter.cardType: "ice"`, Offenlegung
nur aus `revealToRunner: true` und Double-Kosten nur aus den ausdrücklich
gebundenen zusätzlichen Spielaktionen. Off-Site Backups bleibt deshalb eine
private Recovery beliebiger Karten mit einer Aktion; Reclamation Project
behält seine ICE-Auswahl, Offenlegung und zwei Aktionen.

Das statische `costProfile.clicks` für Events und Operations enthält die
normale Spielaktion plus die mechanischen `additionalClicks` der
`on_play`-Ability beziehungsweise `corpUtility.playCost`. Die abschließende
Projektion der gedruckten Creditkosten darf zusätzliche Aktionen nicht
überschreiben. Subtypname und konkrete Karten-ID ersetzen diese Bindung nicht.
Die reale Compiler-/Artefaktregression prüft alle aktuellen Double-Spielkarten
und unabhängige Utility-Felder; die produktive Score-Recovery-Gegenprobe prüft
weiterhin Plan-, Action-, StateVersion- und Choice-Ownership.

## Zugriffstags und positionsabhängige Traces

Direktes `accessEffects.effects.add_tags` erzeugt eine Tagquelle mit
`on_access`-Timing auch ohne eingebetteten Trace oder Schaden. Der Compiler
behält Zugriffszonen, optionale Zahlung und Sichtbarkeit in der nativen
Engine-Semantik; die Funktionserkennung zertifiziert keine LegalAction.

`relativeIce.dynamicTraceSubroutines` projiziert öffentliche Trace-Tagquellen
mit dynamischer Subroutinenzahl. Der Hint setzt diese Zahl weder auf null noch
auf eine feste positive Anzahl: Nur die aktuelle Engine-Quote zählt die
gerezzten äußeren ICE. Der Tagbetrag je erfolgreichem Trace bleibt exakt
gebunden. Die echten generierten Hints erreichen Deckprofil und
Tag-Punish-Consumer; alleinstehendes Hunting Pack behält null Subroutinen.
Unbekannte Sichtbarkeit, Wirkung oder ungültige Beträge scheitern sichtbar.

## Handreset und Draw

Der zusammengesetzte Effekt `shuffle_grip_trash_and_stack_then_draw` erzeugt
die mechanischen Funktionen `setup.draw` und `zone.shuffle`. Damit zählt die
Deckstrategie seine Kopien als Draw-Funktion. Die Projektion macht daraus
keinen additiven Kartengewinn und keine gezielte Heap-Recovery; der bestehende
Compound-Capability-Vertrag und seine Informationsgrenze bleiben erhalten.

## Universelle Coverage und Stärkehilfe

`breaker.matches.kind === "any"` beschreibt universelle mechanische Coverage.
Es begründet keine Notfall-Markierung. `emergencyCoverage` wird bei solchen
Breakern aus einem bei Nutzung erzwungenen Runende abgeleitet; die zusätzliche
Nebenwirkung `ends_run_after_use` bleibt sichtbar. Zufall, Selbsttrash und
wirtschaftliche Tragfähigkeit werden getrennt bewertet. Krash liefert deshalb
reguläre universelle Coverage, Dropp dagegen keine normale Access-Coverage.

Eine positive ICE-Stärkereduktion einer Runnerkarte, ein kanonischer
Run-Stärkeboost oder ein ICE-schwächender Virus erzeugt die Supportrolle
`icebreaker_support`. Der jeweilige Sofort-, Run- oder Folge-Run-Horizont bleibt
im mechanischen Vertrag erhalten. Die Engine-Doktrin verbindet Support mit
Breakern und kompatibler erneuernder Economy. Eine erkannte Rolle allein
begründet noch keine Installation: Der Entwicklungsowner benötigt einen
zustandsgebundenen marginalen Nutzen. Regressionen prüfen sowohl die echten
generierten Hints im Standarddeck als auch Admission und tatsächlich gewählte
LegalAction. Selbst vorgegebene Rollen testen nur ihren jeweiligen Consumer.

## Runner-Counter und Ausstiegssperren

`runnerCounterEffects` erzeugt persistente Schadensfunktionen und die
Mechanik `run_start_counter_damage` ausschließlich bei einem typisierten
`runStart.kind: "damage"`. Start-of-turn-Tags, Creditverlust und reine
Counterentfernung sind keine Schadensquellen. Der Countervertrag besitzt
keine Run-Ende-Wirkung; `defense.corp_run_end_counter` stammt weiterhin aus
einer tatsächlichen scored-agenda-Wirkung. Beträge, Timing und Entfernung
bleiben getrennte mechanische Facts für die bestehenden Plan-Consumer.

`printedSubroutines.run_duration_cannot_jack_out` projiziert einen
`run_lock` für den Runpfad im Encounter und die Funktionen
`corp_ice.jack_out_lock`/`run.lock`. Die Taktikprojektion bewahrt die
mechanisch belegten Sperrfunktionen. Eine Ausstiegssperre beendet den Run
nicht selbst und ersetzt keine Tracewirkung. Reale Kartenprofile und native
Engine-Checkpoints prüfen die Projektion, den bestehenden Defense-/Window-
Owner, LegalAction-Bindung und deterministisches Replay.

## Corp-Ökonomie mit begrenztem Pool und eigenem Schutzverlust

`gain_temporary_corp_run_credits` beschreibt ausschließlich den endlichen,
öffentlichen Corp-Pool für Kosten im aktuellen Run und dessen Entfernung am
Runende. Er erzeugt keine frei verfügbare dauerhafte Liquidität.
`trash_own_rezzed_ice_for_credits` projiziert sowohl den festen Creditgewinn
als auch den Verlust der gewählten eigenen gerezzten ICE. Der Economy-Owner
benötigt weiterhin eine aktuelle Engine-Quote und bewertet den Schutzverlust;
die mechanische Funktion allein erzwingt weder Installation noch Verkauf.

Der typisierte Ability-Preis `corp_random_discard_hq` wird als zufälliger
eigener HQ-Verlust mit dem Timing der Ability projiziert, auch in deren
Capability-Semantik. Er ist keine gegnerische Abwurfpressure. Ungültige
Beträge, Empfänger, Ziele, Sichtbarkeit oder Pool-Dauer scheitern sichtbar.
Reale generierte Profile und native Engine-Prüfungen verbinden Producer,
bestehenden Funding-/Liquidation-Owner und tatsächliche LegalActions.

## Exakt gebundene variable Aktionskosten

`actions/action-cost-timing.ts` behandelt einen vollständig gebundenen
`printed_play_cost`-X-Vertrag als dieselbe bereits normalisierte Credit-Zahlung.
Gewähltes X, Unter-/Obergrenze, Credits je Einheit und Gesamtzahlung müssen
konsistent sein; diese Metadaten sind dann keine ungeklärten Zusatzkosten.
Offene oder widersprüchliche Variablen und nicht monetäre Kosten bleiben
ausdrücklich erhalten. Der fachliche Owner bewertet weiterhin Ziel, Dauer,
Reserve und Nutzen; die Kostenprojektion trifft keine Kartenentscheidung.

# AI-Hints: Quelle und Runtime-Vertrag

Status: **aktueller generierter CardSpec-Vertrag**  
Stand: 2026-10-02

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

## Typisierte Recovery- und Spielkosten

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

## Exakt gebundene variable Aktionskosten

`actions/action-cost-timing.ts` behandelt einen vollständig gebundenen
`printed_play_cost`-X-Vertrag als dieselbe bereits normalisierte Credit-Zahlung.
Gewähltes X, Unter-/Obergrenze, Credits je Einheit und Gesamtzahlung müssen
konsistent sein; diese Metadaten sind dann keine ungeklärten Zusatzkosten.
Offene oder widersprüchliche Variablen und nicht monetäre Kosten bleiben
ausdrücklich erhalten. Der fachliche Owner bewertet weiterhin Ziel, Dauer,
Reserve und Nutzen; die Kostenprojektion trifft keine Kartenentscheidung.

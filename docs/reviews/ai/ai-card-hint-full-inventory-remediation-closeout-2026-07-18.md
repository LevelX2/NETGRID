# KI-Kartenhint-Vollbestandsremediation – Abschlussreview vom 18.07.2026

Status: `complete`

## Ergebnis

Der vollständige Bestand von 618 aktiven Kartenhints ist kartenweise geprüft,
fachlich bereinigt und gegen seine produktiven Consumer verifiziert. Es bleibt
keine offene Maßnahmenklasse aus dem Ausgangsaudit: konkrete
Falschsemantiken, fehlender strukturierter Signaltransport, nicht geklärte
Taktiksignalverträge, wirkungslose Value-/Pair-Metadaten, Target-Profile-Gaps,
unreviewte Hints und sachfremde Testfixtures sind geschlossen.

Die Nutzerregel für nicht konsumierte Metadaten wurde durchgängig angewandt:
Wenn die Information den Kartenzweck trägt, besitzt sie jetzt strukturierte
Semantik oder einen produktiven Consumer. Redundante oder nicht
entscheidungsrelevante Angaben wurden entfernt beziehungsweise ausdrücklich
Evidence-only klassifiziert.

## Maßnahmenbilanz

| Fläche                | Ergebnis                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Konkrete Kartenfehler | 17 produktive Karten kartentextgetreu korrigiert                                                                             |
| Rohe Taktiksignale    | 28 Karten geprüft; 27 strukturiert transportiert, eine redundante Signalfamilie entfernt                                     |
| Signalkatalog         | 671 Signale, 294 coverage-pflichtige Verträge, 0 offene Pflichtverträge                                                      |
| Value-Metadaten       | 733 redundante Zuweisungen entfernt; 102 Remote-Werte auf `remoteRootValue` migriert; 203 typisierte Runtimewerte verbleiben |
| Strategy-Paare        | 125 runtimewirksam, 116 ausdrücklich Evidence-only                                                                           |
| Mechanics/Szenarien   | 46 `memory`-Mechaniken runtimewirksam; 1.776 weitere Mechanics und 628 Szenarioreferenzen Evidence-only                      |
| Qualitätsstatus       | 618 von 618 Hints reviewed; 0 `needsHumanReview`, 0 Quality-Fehler, 0 Quality-Warnungen                                      |
| Zielprofile           | 36 Kartenprofile ergänzt; 0 Target-Profile-Gaps                                                                              |
| Rollenontologie       | 19 Aliasfelder normalisiert; 92 Singleton-Rollen und 49 Singleton-Planrollen ausdrücklich als sinntragend klassifiziert      |
| Testset               | 10 sachfremde Planrollen entfernt oder auf tatsächliche Funktion korrigiert                                                  |

## Fachlich wichtige Consumerentscheidungen

- Microtech Backup Drive wird über `program_trash_prevention` als
  Programmschutz erkannt; sein Zweck wurde nicht durch Metadatenabbau
  verloren.
- Private LDL bleibt nach der Rollen-Normalisierung ein HQ-Run mit
  R&D-Zugriffsersatz. Der Run-Consumer erkennt dafür den strukturierten
  `access_replacement` im `successful_run`-Timing, ohne allgemeine
  HQ-/R&D-Druckrollen als Laufnachweis zu überdehnen.
- Corp-Remoteentscheidungen lesen ausschließlich den typisierten
  `remoteRootValue`; der ungesicherte generische `Object.values(valueHints)`-
  Pfad ist entfernt.
- Taktiksignale, deren produktive Bedeutung bereits vollständig über Effects,
  BreakerProfile, TargetProfile oder LegalActions läuft, sind zentral als
  Read-only-Semantik klassifiziert statt mit doppelten Laufzeitwirkungen
  versehen.

## Verifikation

- `corepack pnpm test:ai:shards`: 382 Testdateien und 2.723 Tests grün
  (`916 + 992 + 815`).
- `corepack pnpm check:ai:full`: grün; 618 aktive Hints, 599 durch den
  Action-Signalkatalog abgedeckt, 0 Deferred- und 0 Target-Profile-Fälle.
- Metadaten-, Normalisierungs-, Compiler-, Inspector-, Derived-Facts- und
  Source-Structure-Gates: grün.
- `corepack pnpm typecheck`: alle sieben Workspace-Projekte grün.
- `corepack pnpm build`: Shared, Catalog, Engine, Decks, AI, Server und
  Next.js-Webbuild grün.
- Engine-Public-Entry-Smoke: grün; der während eines Zwischenstands sichtbare
  zyklische Modulstartfehler ist im final synchronisierten `main` behoben.
- `git diff --check`: grün.

## AI Behavior Baseline v1

Der standardisierte Vergleich verwendet sechs feste Deck-Slots, zehn feste
Seeds, 480 Aktionen und `current_candidate` auf beiden Seiten. Die 60 Spiele
mit 12.201 Entscheidungen sind gegen die Referenz `637c62a09` formal
vergleichbar.

- keine illegalen Aktionen, Replayfehler, Fallbacks, Timeouts,
  Runtimefehler, Hidden-Info-Funde oder `no_legal_action_failure`;
- alle Traces redaction-safe;
- Aktionslimit-Spiele: `3 -> 2`;
- Advanced-Remote-Contest-Skip-Rate: `-0,043`;
- Plan-Konversionsrate: `-0,002`;
- strategische No-Progress-Wiederholungen je 100 Entscheidungen: `-0,037`;
- durchschnittliche Aktionen: `-0,967`.

Das Hard Gate bleibt wegen Net-Damage Seed 09 und Hybrid Seed 02 rot. Beide
Spiele besitzen gegenüber der Referenz identische Aktionszahl, Zugzahl und
StateHash und sind deshalb nicht durch den Hint-Diff entstanden. Hybrid Seed
07 endet im Kandidaten regulär nach 451 Aktionen. Der Selfplay-Vergleich lief
bewusst auf dem letzten lauffähigen Referenz-Head plus Hint-Paketen; spätere
Engine-Architekturcommits wurden getrennt durch Typecheck, Build und Tests
abgesichert.

## Paket- und Git-Nachweis

1. `2e4666a3b` – Audit- und Prozessbaseline
2. `5693493b2` – konkrete Kartenhint-Korrekturen
3. `73b501614` – strukturierter Signaltransport
4. `7681656c0` – Taktiksignal-Consumerverträge
5. `d673b62fb` – Metadaten-Ontologie
6. `b6e7f7f3c` – Qualitäts-, Target- und Fixture-Backlog
7. `b668e339a` – Gesamtverifikation und Wissenspflege

Der Arbeitsbranch wurde per Fast-Forward in den lokalen `main` integriert.
Main-Sauberkeitsprüfung, hashgleiche Übernahme der lokalen Baseline-Evidence
sowie die verifizierte Entfernung beider temporären Worktrees und Branches
sind abgeschlossen.

## Restrisiken

- Die zwei bekannten Aktionslimit-Schleifen bleiben als eigener KI-
  Verhaltensbacklog offen; ihre Behebung gehört nicht zur Hint-Semantik.
- Kleine Baseline-Deltas ohne kalibrierte Schwelle bleiben
  Beobachtungsevidence und sind weder Stärke- noch Regressionsbeweis.
- Evidence-only-Metadaten dürfen künftig nicht still in Runtimeannahmen
  umgedeutet werden; die neuen Vertragsgates sichern diese Grenze.

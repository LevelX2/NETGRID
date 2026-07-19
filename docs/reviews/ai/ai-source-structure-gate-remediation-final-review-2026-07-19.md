# AI-Source-Structure-Gate-Remediation – Final Review 2026-07-19

Status: `complete`

## Ergebnis

Das allgemeine AI-Source-Structure-Gate besitzt wieder eine grüne
Null-Baseline. Die neun auf dem Ausgangsstand reproduzierten
Dateigrößenverstöße sind entfernt. Laufzeit- und Typimportgraph bleiben
zyklenfrei; der produktive Runtime-Root bleibt unverändert bei 289 Dateien.

Die Remediation ändert keine Engine-Regel, LegalAction, Scoringzahl,
Prioritätsreihenfolge, Choice-Auswahl, PlayerView, PublicEvent, Hidden-Info-
Grenze, Replay-, StateHash- oder Randomness-Semantik. Sie teilt bestehende
Produktions- und Testverantwortungen entlang bereits vorhandener
Fachfamilien.

## Ausgangs- und Endstand

| Kennzahl                        | Ausgang | Endstand |
| ------------------------------- | ------: | -------: |
| Dateigrößenverstöße             |       9 |        0 |
| produktive AI-Dateien           |     677 |      677 |
| Laufzeitimportzyklen            |       0 |        0 |
| Typimportzyklen                 |       0 |        0 |
| produktive Runtime-Root-Dateien |     289 |      289 |

Die vier zuerst bekannten Verstöße waren auf dem älteren Integrationsstand
reproduzierbar. Der Preflight auf aktuellem `main` fand zusätzlich fünf
spätere Treffer. ASSG führte deshalb alle neun Dateien als feste Removal List,
statt nur die veraltete Viererzahl zu behandeln.

## Fachliche Schnitte

- Der 4.262-zeilige Cutover-Test ist in Boundary-, Corp-, Runner-Plan- und
  Runner-Safety-Vertragsfamilien mit gemeinsamem engem Test-Support geteilt.
- `semantic-choice-ranking.ts` ist eine 9-zeilige Fassade. Mapping-
  Orchestration, initiale Overrides, Policies und Corp-Urgency liegen bei den
  Ownern unter `runtime/choice-ranking/`.
- Die Scoring-Window-Projektion sank von 1.619 auf 1.188 Zeilen; sichtbare
  Runner-Pressure-, Credit-, Breaker- und Pfadbewertung liegt in einem
  447-zeiligen Owner.
- Scoreline-Components sanken von 1.022 auf 525 Zeilen, der Corp-Score-
  Orchestrator von 838 auf 491 Zeilen. Active-Remote und Action-Familien sind
  als 504- beziehungsweise 390-zeilige Owner getrennt; die frühere
  3.827-zeilige Testsuite ist auf drei Vertragsfamilien verteilt.
- Board-Triage sank von 810 auf 363 Zeilen; Action-Alignment liegt in einem
  462-zeiligen Owner. Der 1.469-zeilige Scoreline-Test ist in Central-,
  Remote-Funding- und Clock-Verträge geteilt.

## Ratchet- und Boundary-Vertrag

Kein auf `main` vorhandener Grenzwert wurde zur Remediation angehoben. Der
frühere 4.261-Zeilen-Cutover-Cap und die Caps der übrigen monolithischen
Dateien wurden durch kleinere, endstandgenaue Teilcaps ersetzt. Neue Owner und
Tests besitzen explizite Caps; für die neun Ausgangstreffer bleibt keine
Allowlist zurück.

Der erste ASSG-6-Fulllauf erkannte, dass der neue gemeinsame Cutover-Test-
Support `evaluateRunnerRunTargets` außerhalb des Run-Target-Owners referenzierte.
Die Abhängigkeit wurde in die beiden tatsächlichen `.test.ts`-Consumer
verlegt. Das Gate und seine Allowed-Owner-Liste blieben unverändert. Damit
belegt der Fund zusätzlich, dass die Boundary fail-closed wirksam ist.

Nach diesem Abschluss ist ein rotes `check:ai-source-structure` kein
akzeptierter Vorzustand für weitere AI-Integrationen. Ein unabhängiger Treffer
muss vor Merge behoben werden; ein Paket mit rotem Strukturteil darf nicht als
vollständig grün bezeichnet werden.

## Verifikation

Der vollständige Abschlusslauf nach dem letzten Boundary-Fix ist grün:

- `corepack pnpm check:ai`
- `corepack pnpm check:ai:full`
- `corepack pnpm check:ai-source-structure`
- `corepack pnpm check:ai-source-structure:selftest`
- `corepack pnpm check:package-boundaries` mit 1.886 geprüften Dateien
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- AI-Shard 1: 136 Dateien, 993 Tests
- AI-Shard 2: 135 Dateien, 978 Tests
- AI-Shard 3: 135 Dateien, 822 Tests
- Gesamt: 406 AI-Testdateien, 2.793 Tests
- `git diff --check`

`check:ai` und `check:ai:full` melden außerdem 618 aktive Hints, 599
abgedeckte Actions, null zurückgestellte Einträge, null Target-Profile-Gaps
und null harte Hint-Metadatenfehler.

Der während der Umsetzung weitergelaufene lokale `main`-Stand `7d986f9a2`
wurde vor diesem vollständigen Lauf konfliktfrei in den Arbeitsbranch
integriert. Der verifizierte Arbeitsbranch wurde anschließend per
Fast-Forward lokal nach `main` übernommen; Remote-Push oder Pull Request waren
nicht Teil des Auftrags.

## Führende Artefakte

- Prozess und Paketnachweis:
  `docs/architecture/ai/ai-source-structure-gate-remediation-plan-2026-07-19.md`
- Aktueller AI-Architekturstand: `docs/architecture/ai/README.md`
- Ausführbares Gate: `scripts/check-ai-source-structure.mjs`
- Current State:
  `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`

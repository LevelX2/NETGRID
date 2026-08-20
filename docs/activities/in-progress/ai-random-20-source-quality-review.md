# AI-Random-20-Source-Qualitätsprüfung

Status: aktiv (`AI-R01`)

## Quelle/Vorgabe

Nutzerauftrag vom 20.08.2026: Aus dem vollständigen Katalog produktiver KI-Source-Dateien 20 Dateien zufällig auswählen, jede Datei präzise auf Qualität prüfen und belastbare Anpassungen direkt in einem isolierten Worktree umsetzen.

## Zielprüfung

Der Auftrag ist für die automatische Abarbeitung ausreichend präzise. Die Stichprobe wird einmalig ohne Zurücklegen gezogen und danach nicht verändert. Ein Paket darf mit dem Ergebnis „kein Änderungsbedarf“ enden, muss diesen Befund aber mit Aufrufern, Tests und Architekturvertrag belegen.

## Gesamtziel

Zwanzig zufällig ausgewählte produktive KI-Dateien sequenziell auf Korrektheit, Plan-first-Ownership, Hidden-Info-Sicherheit, Geradlinigkeit, Struktur, Größe, Testbarkeit und Optimierungspotenzial prüfen; nur ursachenorientierte und belastbare Verbesserungen implementieren; jedes Einzelpaket verifizieren und committen; den fertigen Branch lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

## Annahmen

- Katalogbasis sind 650 produktive Nicht-Test-Dateien unter `packages/ai/src` einschließlich `simulation/` plus 7 direkte produktive `@netgrid/ai`-Integrationen außerhalb des Pakets.
- Ausgeschlossen sind `*.test.*`, `*.spec.*`, Test-Fixtures und `test-support`.
- Die alphabetische Katalognummer ist stabil für den Startstand `4ff18aa46f28e43f432b7b1e520710b1ebbed04a`.
- Zufallsauswahl erfolgt kryptografisch ohne Zurücklegen; die unten fixierte Reihenfolge ist verbindlich.
- Reine Stilpräferenzen rechtfertigen keine Änderung. Refactorings müssen Verantwortung, Lesbarkeit, Testbarkeit oder Architekturgrenzen messbar verbessern.

## Nicht-Ziele

- Keine allgemeine KI-Spielstärke-Initiative und keine neuen Kartenmechaniken.
- Keine zweite Entscheidungsautorität, kein Fallback und keine Legacy-Kompatibilität.
- Keine Änderungen an Engine-Regeln, LegalAction-Erzeugung oder Hidden-Info-Verträgen ohne einen konkret nachgewiesenen Fehler in der Stichprobe.
- Keine Server- oder Browserstarts aus dem Worktree.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität; KI reicht ausschließlich aktuelle `LegalActions` ein.
- Produktive KI bleibt Plan-first; genau ein fachlicher Owner je Entscheidung.
- Choice-Auflösung vervollständigt nur die Payload der exakt gebundenen Action.
- Nur side-sichere `PlayerView`, `PublicEvents`, `LegalActions` und freigegebene Metadaten dürfen einfließen.
- Determinismus, Replay, StateHash und Engine-RNG-Vertrag bleiben erhalten.
- Fehlerbehebung erfolgt an der erzeugenden Schicht und bleibt fail-closed.

## Automatische Fehlerbehandlung

- Zuerst engsten reproduzierenden Test beziehungsweise statische Referenzprüfung verwenden.
- Rote Tests ursachenbezogen analysieren; keine Abschwächung korrekter Invarianten.
- Unabhängige Baselinefehler separat dokumentieren und nicht in den Paketscope ziehen.
- Kein Paketwechsel vor erfülltem Done-Gate.

## Sicherheitsblocker

Gestoppt wird bei nicht auflösbarem Ownership-Konflikt, möglichem Hidden-Info-Leak ohne side-sicheren Fix, unklarer Engine-/AI-Autorität, fremden relevanten Änderungen im Zielpfad oder nicht sicher isolierbarem Testbetrieb. Ein Blockerbericht muss Ursache und Removal Condition nennen.

## State Machine

`vorbereitet -> AI-R01 -> ... -> AI-R20 -> Konsolidierung -> Final-Gates -> Main-Merge -> Cleanup -> abgeschlossen`

Genau ein Paket ist aktiv. `geprüft` bedeutet Analyse abgeschlossen; `angepasst` bedeutet Code/Test geändert; `committed` ist das Paket-Done-Gate.

## Paketfolge

| Paket | Katalog | Datei | Status |
| --- | ---: | --- | --- |
| AI-R01 | 141 | `packages/ai/src/plans/corp-defense-domain-signals.ts` | aktiv |
| AI-R02 | 106 | `packages/ai/src/evaluation/doctrine-goal-coverage.ts` | ausstehend |
| AI-R03 | 627 | `packages/ai/src/simulation/side-safe-input.ts` | ausstehend |
| AI-R04 | 185 | `packages/ai/src/plans/turn-completion-plan-module.ts` | ausstehend |
| AI-R05 | 261 | `packages/ai/src/runtime/corp-installed-economy-credit.ts` | ausstehend |
| AI-R06 | 629 | `packages/ai/src/simulation/simulation-action-source-definition.ts` | ausstehend |
| AI-R07 | 206 | `packages/ai/src/runner-canonical-hint-semantics.ts` | ausstehend |
| AI-R08 | 98 | `packages/ai/src/evaluation/decision-checkpoints/checkpoint-runner.ts` | ausstehend |
| AI-R09 | 163 | `packages/ai/src/plans/plan-resolution-failure.ts` | ausstehend |
| AI-R10 | 207 | `packages/ai/src/runner-damage-threat-assessment.ts` | ausstehend |
| AI-R11 | 609 | `packages/ai/src/simulation/runner-pressure-metrics.ts` | ausstehend |
| AI-R12 | 76 | `packages/ai/src/decision/semantic-shadow-decision.ts` | ausstehend |
| AI-R13 | 189 | `packages/ai/src/plans/turn-remainder-search.ts` | ausstehend |
| AI-R14 | 476 | `packages/ai/src/runtime/shell-traders-plan-signals.ts` | ausstehend |
| AI-R15 | 435 | `packages/ai/src/runtime/semantic-runtime-corp-board-score-composition.ts` | ausstehend |
| AI-R16 | 73 | `packages/ai/src/decision/semantic-decision-frame.ts` | ausstehend |
| AI-R17 | 227 | `packages/ai/src/runtime/ai-facade-foundation-context.ts` | ausstehend |
| AI-R18 | 581 | `packages/ai/src/simulation/random-legal-decision.ts` | ausstehend |
| AI-R19 | 644 | `packages/ai/src/simulation/tag-punish-ontology-diagnostics.ts` | ausstehend |
| AI-R20 | 516 | `packages/ai/src/simulation/belief-simulation-world.ts` | ausstehend |

## Paketdetails

Für jedes Paket gelten dieselben Schritte: Datei vollständig lesen; Import-/Aufrufer-/Testgraph und Git-Historie prüfen; Architektur-Owner bestimmen; konkrete Findings nach Schweregrad dokumentieren; bei belastbarem Befund minimal anpassen und Regressionstest ergänzen oder präzisieren; fokussierten Check sowie `git diff --check` ausführen; nur Paketänderungen committen; Status und Ergebnis in diesem Artefakt aktualisieren.

Done-Gate je Paket: Reviewbefund mit Fundstellen, begründete Änderungsentscheidung, passender fokussierter Check, sauberer Diff und eigener Commit.

Commit-Schema: `review(ai): complete AI-Rnn <kurztitel>` beziehungsweise bei Codefix ein präzises `refactor(ai):` oder `fix(ai):` mit Paketkennung im Body.

## Verifikationsregeln

- Pro Paket zunächst engster relevanter Vitest-/Typecheck-/Strukturcheck.
- Bei Typoberflächen oder Paketgrenzen: `corepack pnpm --filter @netgrid/ai typecheck`.
- Bei gemeinsamen AI-Verträgen oder Struktur: einschlägige `check:ai*`-Gates.
- Finaler bewusster Integrationscheckpoint: `corepack pnpm test:ai:shards`, AI-Typecheck, einschlägige Strukturchecks und `git diff --check`.
- Äußeres Zeitfenster fokussierter AI-Tests mindestens 180 Sekunden, vollständiger Gates mindestens 600 Sekunden.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_RANDOM_20_SOURCE_REVIEW`
- Branch: `codex/ai-random-20-source-review`
- Basis: lokaler `main` bei `4ff18aa46f28e43f432b7b1e520710b1ebbed04a`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket einzeln committen; keine fremden Änderungen anfassen.
- Vor Final-Merge aktuelles `main` in den Arbeitsbranch integrieren und relevante Gates erneut ausführen.
- Nach erfolgreichem Merge Worktree ohne `--force` entfernen, Entfernung doppelt prüfen und gemergten Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Random-20-Source-Qualitätsprüfung vollständig und sequenziell von AI-R01 bis AI-R20 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden AI-Architekturverträge und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Prüfe, verifiziere und committe jedes Paket. Bei Sicherheitsblocker stoppe mit Ursachenbericht und Removal Condition. Markiere das Goal erst nach Main-Prüfung, verifiziertem Worktree-Cleanup und Branch-Löschung als complete.`

## Ergebnisse

Wird paketweise ergänzt.

## Abschlusskriterien

- Alle 20 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Finale AI-Gates sind grün oder unabhängige Baselineabweichungen eindeutig getrennt.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.

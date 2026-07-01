# Operations Semantic Review v2 Automation Process

Status: active
Stand: 2026-07-01

## Quelle / Vorgabe

- Nutzerauftrag vom 2026-07-01: `operations_semantic_review_v2.md` direkt mit `paketprozess-worktree-goal` umsetzen.
- Eingangsreview: `docs/reviews/ai/operations-semantic-review-v2-input-2026-07-01.md`.
- Fachleitfaden: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`.
- Ausgangsdaten: `data/ai/ai-card-hints-active.json`, `data/ai/tactic-signals-v1.json`, `data/cards/*-cards.json`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Scope: 38 aktive Corp-Operations aus Classic, Originalset V1 und Proteus.
- Endzustand: Operations-Hints folgen der konservativen Review-v2-Entscheidung.
- Nicht-Ziele: keine produktive Einführung von `corp.action_tempo`, `corp.overadvance_value` oder `corp.deck_recycle_engine`; keine Engine-, LegalAction-, Planner-, UI- oder Hidden-Info-Ausweitung.
- Sicherheitsgrenze: neue Semantik bleibt read-only Hint-Metadaten.
- Verifikation: JSON-Parsing, Ontologie-/Hint-Checks, gezielte Operations-v2-Invariant-Checks, `git diff --check`.

## Gesamtziel

Alle 38 Corp-Operations erhalten eine fachlich nach Review v2 geprüfte AI-Semantik: präzise Taktiksignale, bestätigte `strategySupportPairs` nur für echte Strategieanker, candidate/deferred-Hinweise für noch nicht beschlossene Strategy IDs und textgenaue Conditions/Risiken/Target-Hinweise.

## Annahmen

- Die CSV aus dem Nutzertext liegt lokal nicht vor; die Markdown-Quelle ist vollständig genug und wird als führender Input verwendet.
- Bestehende untracked Review-Dateien im Hauptworkspace gehören zu vorherigen Berichten und bleiben unberührt.
- Neue Taktiksignale dürfen katalogisiert werden, wenn sie im Review v2 und Guide V3 explizit begründet sind.
- Candidate/deferred-Strategy-Entscheidungen werden nicht als produktive `strategySupportPairs` modelliert, sondern in einem Review-/Follow-up-Artefakt dokumentiert.

## Nicht-Ziele

- Keine neue produktive Strategy ID für Corp-Tempo, Overadvance oder Deck-Recycle.
- Keine Änderung an Rules Engine, CardImplementation, LegalActions, `applyAction`, Replay oder StateHash.
- Keine neue Planner-Gewichtung oder Runtime-Cutover-Änderung.
- Keine Hidden-Info-Projektion aus HQ, R&D, Runner-Hand, verdeckten installierten Karten oder privaten Target-Choices.

## Controller-Invarianten

- Support-only Operations bekommen keine `lineSupport`, keine `strategicRole` und keine `strategySupportPairs`.
- `strategySupportPairs.role` verwendet nur validierbare Hauptrollen; konkrete Review-v2-Rollen stehen in `roleDetail`.
- Extra-Action-Operations bleiben ohne bestätigte StrategySupportPairs, solange `corp.action_tempo` nicht taxonomisch beschlossen ist.
- Overadvance bleibt candidate/deferred, solange `corp.overadvance_value` nicht taxonomisch beschlossen ist.
- Corporate Shuffle bleibt support-only und darf nicht unter `corp.deck_recycle_engine` gehängt werden.
- Target-/Constraint-Hinweise werden nicht als Taktiksignale missbraucht, außer das Signal beschreibt explizit die taktische Zielwirkung wie `target.runner_hardware_trash`.

## Automatische Fehlerbehandlung

- Bei fehlendem Signal im Katalog: Signal mit Guide-V3-konformer Beschreibung ergänzen oder als candidate im Report belassen, wenn die Definition unklar ist.
- Bei Ontologiefehlern: erst Hintform reparieren, danach erneut prüfen.
- Bei fachlichem Widerspruch zwischen aktivem Hint und Review v2: Review v2 ist führend, sofern es mit Guide V3 vereinbar ist.
- Bei Engine-/Regelunsicherheit: nicht implementieren, sondern als `manualNotes`, `riskTags` oder Abschlussreport-Follow-up markieren.

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn:

- eine vorgeschlagene Änderung Engine- oder LegalAction-Verhalten ändern müsste;
- ein TargetProfile verdeckte Informationen außerhalb der zulässigen Seite nutzen würde;
- eine neue Strategy ID produktiv nötig wäre, obwohl sie nicht beschlossen ist;
- JSON-/Ontologie-Checks nach enger Reparatur weiterhin rot bleiben.

## State Machine

```text
preflight
-> package_1_process_artifacts
-> package_2_taxonomy
-> package_3_operation_hints
-> package_4_verification_report
-> integration_preflight
-> merged_to_main
```

## Paketfolge

1. OPS-V2-01 Prozess- und Quellenartefakte
2. OPS-V2-02 Taktiksignal-/Condition-/Risk-Katalog
3. OPS-V2-03 Operations-Hints nach Review v2
4. OPS-V2-04 Invariant-Checks und Abschlussreport

## Paketdetails

### OPS-V2-01 Prozess- und Quellenartefakte

Ziel: Review-v2-Quelle und Prozessvertrag versionieren.

Arbeit:

- Eingangsreview nach `docs/reviews/ai/operations-semantic-review-v2-input-2026-07-01.md` übernehmen.
- Dieses Prozessartefakt anlegen.
- Worktree-/Branch-Regeln dokumentieren.

Checks:

- `git diff --check`

Done-Gate:

- Quelle und Prozessartefakt sind versioniert und ohne Whitespace-Fehler.

Commit:

`docs(ai): add operations semantic review v2 process`

### OPS-V2-02 Taktiksignal-/Condition-/Risk-Katalog

Ziel: Alle in Review v2 benötigten präzisen Signale katalogisieren.

Arbeit:

- `data/ai/tactic-signals-v1.json` um fehlende, fachlich bestätigte Signale ergänzen.
- Keine Strategy-ID-Katalogisierung für candidate/deferred-Anker.
- Signalnotizen klar als read-only Hint-Metadaten kennzeichnen.

Checks:

- JSON parsebar.
- Katalog enthält alle für OPS-V2 verwendeten Signale.
- `git diff --check`

Done-Gate:

- Kein verwendetes bestätigtes Operations-v2-Signal bleibt unkatalogisiert.

Commit:

`data(ai): catalog operations semantic review v2 signals`

### OPS-V2-03 Operations-Hints nach Review v2

Ziel: `data/ai/ai-card-hints-active.json` für alle 38 Operations aktualisieren.

Arbeit:

- Taktiksignale nach Review v2 setzen.
- Bestätigte `strategySupportPairs` ergänzen.
- Support-only und candidate/deferred-Karten ohne produktive StrategySupportPairs lassen.
- Candidate/deferred-Hinweise in `manualNotes` und Abschlussreport dokumentieren.
- Quality-Metadaten auf Review v2 aktualisieren.

Checks:

- JSON parsebar.
- Alle 38 Operations sind abgedeckt.
- `strategySupportPairs.role` validierbar.
- `git diff --check`

Done-Gate:

- Aktive Operations-Hints entsprechen Review v2 ohne produktive candidate/deferred-Anker.

Commit:

`data(ai): apply operations semantic review v2 hints`

### OPS-V2-04 Invariant-Checks und Abschlussreport

Ziel: Fachregeln maschinenlesbar absichern und Umsetzungsreport erzeugen.

Arbeit:

- Expliziten Check für OPS-V2-Invarianten hinzufügen.
- Markdown-/JSON-Abschlussreport mit Status vorher/nachher und Follow-ups erzeugen.
- Relevante AI-/Hint-Checks ausführen.

Checks:

- Neuer OPS-V2-Check grün.
- Bestehender Hint-/Ontologiecheck grün oder dokumentiert nicht verfügbar.
- `git diff --check`

Done-Gate:

- Abschlussreport und Check belegen die Umsetzung.

Commit:

`test(ai): verify operations semantic review v2 invariants`

## Verifikationsregeln

Minimal:

```text
node <ops-v2-check>
git diff --check
```

Zusätzlich, wenn verfügbar:

```text
pnpm --filter @netgrid/ai test -- hint-ontology
pnpm --filter @netgrid/ai test -- ai-hint
```

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_OPERATIONS_SEMANTIC_REVIEW_V2`
- Branch: `codex/operations-semantic-review-v2`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` verwenden.
- Ein Paket pro Commit.
- Kein Push und kein Pull Request.
- Bestehende untracked Review-Dateien im Hauptworkspace bleiben unverändert.

## Controller-Prompt-Kern

```text
/Goal Arbeite Operations Semantic Review v2 vollständig und sequenziell von OPS-V2-01 bis OPS-V2-04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die Wiki-Pflichtseiten, den Card-Enablement-Agenten und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_OPERATIONS_SEMANTIC_REVIEW_V2 auf Branch codex/operations-semantic-review-v2.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle vier Pakete committed.
- Operations-Hints und Signalkatalog sind JSON-parsebar.
- Neuer Operations-v2-Invariant-Check grün.
- Abschlussreport vorhanden.
- Arbeitsbranch lokal nach `main` gemerged.
- Worktree entfernt.
- Goal als complete markiert.

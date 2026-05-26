# Aufgabe 012 - Batch-3 RemoteRole/Future-run-ICE Dry-Run

## Kurzfazit

Aufgabe 012 erstellt den read-only Dry-Run für Batch 3 `batch_3_remote_role_future_run_ice`. Der Batch umfasst `Tutor`, `Virizz`, `Viral 15`, `Crystal Palace Station Grid` und `Red Herrings`.

Der Dry-Run ist technisch konfliktfrei:

- Hard Errors: 0
- Konflikte: 0
- Preview-Adds: 0
- bestätigte Generated Facts: 15

Batch 3 ist aber noch nicht rollup-ready. Der Status ist `needs_diff_review`, weil Future-run-ICE bewusst Runpath-/Descriptor-Kontext braucht und die Remote-Upgrades noch RemoteRole-/Remote-Protection-Shape-Differenzen haben. Das ist kein Runtime-Fehler, sondern die erwartete Folgearbeit für Aufgabe 013.

`data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle. Es gibt keine Runtime-, Planner-, Consumer-, Engine- oder Strategie-Wirkung.

## Batch-3-Scope

Enthaltene Karten:

| Karte                       | Scope                            | Ergebnis                             |
| --------------------------- | -------------------------------- | ------------------------------------ |
| Tutor                       | Future-run/Future-remaining-ICE  | `needs_future_run_descriptor_review` |
| Virizz                      | Future-run Run-Tax               | `needs_future_run_descriptor_review` |
| Viral 15                    | Future-run Program-Trash/Run-Tax | `needs_future_run_descriptor_review` |
| Crystal Palace Station Grid | RemoteRole `run_tax`             | `needs_diff_review`                  |
| Red Herrings                | RemoteRole `agenda_steal_tax`    | `needs_diff_review`                  |

Nicht im Scope:

- Scored-agenda effects
- Tag/Punish operation facts
- BreakerProfile
- TargetProfiles
- Trash-credit
- aktive Rollen/Planrollen
- `aiSupportStatus`
- `lineSupport`, `quality`, `manualNotes`, `strategicNotes`

## Dry-Run-Befund

- Batch-Karten: 5
- bestätigte Generated Facts: 15
- Preview-Adds: 0
- Shape-Differences: 6
- RemoteRole-Differences: 4
- FutureRun-Differences: 3
- BoardContext-Hinweise: 15
- RunpathContext-Hinweise: 10
- ActiveStateContext-Hinweise: 3

Die Warnings sind Vergleichssignale:

- `runpath_context_required` für Future-run ICE
- `future_run_shape_difference` für Virizz/Viral-15-Runpath-Facts
- `remote_role_shape_difference` für RemoteRole-/Access-Tax-Formen
- `descriptor_context_required` für grobe Future-run-Descriptoren und bewusst strategische Remote-Protection
- `monolith_only_mechanical_fact` für aktive Remote-Protection-Felder, die nicht generated werden

## Guardrails

Crystal Palace Station Grid:

- bleibt mechanisch `run_tax`
- wird nicht Economy
- wird nicht Counter
- wird nicht Agenda-Steal-Tax
- Remote protection bleibt kontextuell/strategisch

Red Herrings:

- bleibt mechanisch `remoteRole.kind = agenda_steal_tax`
- `effect:run_tax` ist nur die aktive Kostenform im Access-/Agenda-Steal-Kontext
- wird nicht als generischer Remote-Run-Tax behandelt

Future-run ICE:

- Generated Facts beschreiben statische Subroutine-/Run-Folgefunktion.
- Sie erzeugen keine aktuelle Run-Legalität, Break-Legalität, Trash-Legalität oder Self-ETR-Safety.
- Für `Tutor`, `Virizz` und `Viral 15` bleibt Runpath-Kontext zwingend.

## Board-/Runpath-/LegalAction-Kontext

RemoteRole:

- Beschreibt statische Kartenfunktion.
- Aktive Wirkung hängt von Boardstate ab:
  - rezzed
  - activeWhile
  - same server / fort
  - server context
- RemoteRole erzeugt keine Install-/Rez-/Advance-/Score-Legalität.
- `effectiveRunQuote` bleibt führend.

Future-run ICE:

- Relevanz hängt ab von:
  - laufendem Run
  - Encounter-State
  - ungebrochenen Subroutinen
  - verbleibendem ICE
  - späterem Encounter
  - Jack-out-/Runpath-Optionen
  - aktuellen Kosten-/Breakzuständen
- Generated Future-run Facts bleiben Basic-Facts, keine Runtime-Wertung.

## Bewertung

Der Batch ist tragfähig als gemeinsamer read-only Dry-Run, aber noch nicht migrationsreif. Die Remote-Upgrades sind ein stabilerer Teilbereich; die Future-run-ICE-Karten sind bewusst riskanter und sollten in Aufgabe 013 diff-/normalisiert werden.

Empfehlung:

- Aufgabe 013 als Batch-3 Diff-/Normalization-Review.
- Dabei Remote-Upgrades (`Crystal Palace Station Grid`, `Red Herrings`) separat von Future-run ICE (`Tutor`, `Virizz`, `Viral 15`) klassifizieren.
- Wenn die Future-run-Diffs zu breit bleiben, Batch 3 danach in `remote_upgrades_only` und `future_run_ice` aufsplitten.

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.

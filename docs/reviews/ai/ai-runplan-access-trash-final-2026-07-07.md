# AI RunPlan Access Trash Final 2026-07-07

## Ergebnis

Der beobachtete Runner-Fehler aus `match_13f99872809e6a66` ist generisch in der RunnerRunPlan-Access-Policy behoben. Die KI nutzt weiter nur LegalActions und side-safe PlayerView-/Debug-Kontext; Engine, Replay, StateHash, Randomness und Kartendaten bleiben unveraendert.

## Umgesetzt

- `decline_low_value` ist keine harte Access-Trash-Uebersteuerung mehr. Wenn `trash_accessed_card` semantisch besser bewertet ist als `decline_trash`, gewinnt die Trash-Entscheidung.
- RunPlans mit `revalidation.status:invalid` fallen im Access-Fenster auf die aktuelle semantische Score-Auswahl zurueck und markieren diesen Fallback in der Evidence.
- Generische oder unbekannte Central-Run-Ziele starten mit `trash_if_value_positive`; `decline_low_value` wird nur noch fuer `known_low_value`-Ziele erzeugt.
- Die Access-Evidence zeigt Policy, Reserve, Score-Fallback und Score-Yield sichtbar an.

## Regressionen

- Kostenloser/relevanter Ambush-Trash kann `decline_low_value` ueberstimmen.
- Echte Low-Value-Trash-Faelle koennen weiter abgelehnt werden, wenn `decline_trash` semantisch gleich gut oder besser ist.
- Invalidierte RunPlans erzwingen weder `must_trash_target` noch `decline_low_value`, sondern nutzen Score-Auswahl.
- RunPlan-Start erzeugt fuer unbekannte Central-Ziele `trash_if_value_positive` und fuer bekannte Low-Value-Ziele `decline_low_value`.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/runner-run-plan-access-policy.test.ts src/runtime/runner-run-plan-memory.test.ts --maxWorkers=1 --testTimeout=30000`: 2 Dateien, 16 Tests gruen.
- `corepack pnpm --filter @netgrid/ai typecheck`: gruen.
- `git diff --check main...HEAD`: gruen.
- `corepack pnpm --filter @netgrid/ai test`: nach 424 Sekunden vom Tool-Timeout abgebrochen, ohne ausgegebenen Testfehler. Die dadurch haengenden Worktree-Vitest-Prozesse wurden gezielt beendet; Server/Webclient-Prozesse im Hauptworkspace wurden nicht angefasst.

## Grenzen

- Keine Kartennamen-Sonderregel fuer `Setup!`.
- Keine Aenderung an LegalAction-Erzeugung, Access-Ambush-Aufloesung oder Trash-Kosten.
- Die generelle Debug-WhyNot-Spezialisierung fuer forced RunPlan-Auswahlen bleibt ein moeglicher spaeterer Hygiene-Follow-up; der konkrete Access-Fallback/Yield ist jetzt in der Choice-Evidence sichtbar.

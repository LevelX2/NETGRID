---
activityId: act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: runner AI / run UX
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/input-dto.ts
  - packages/ai/src/index.test.ts
  - packages/engine/src/index.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "fully broken|breaker pump"
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|strength is the missing"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "Codecracker zero-cost Filter|qualifies breaker encounter labels"
  - git diff --check
---

# Runner-KI: unnötiges Krash-Pumpen und Breaker-Chronik korrigieren

## Ziel

Die Runner-KI soll im Encounter keine unnötigen Icebreaker-Pumps ausführen, wenn ein Breaker bereits stark genug ist oder keine relevante ungebrochene Subroutine mehr offen ist. Die Chronik soll Pump- und Break-Aktionen außerdem action-spezifisch und in nachvollziehbarer Reihenfolge darstellen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-17 mit Screenshot: Korp hatte `Filter` als Stärke-0-Code-Gate vor R&D; Runner-KI hatte `Krash` installiert und 5 Credits. Beim Run zeigte die Chronik u. a. `Die Runner-KI hat mit Krash eine Subroutine gebrochen`, danach `Die Runner-KI hat Krash gepumpt` und anschließend `Die Runner-KI hat ungebrochene Subroutinen ausgelöst`.
- Zweiter Nutzer-Screenshot vom nächsten Runner-Zug: Die Runner-KI macht erneut einen Run auf R&D gegen `Filter`. Die Chronik zeigt `Die Runner-KI hat mit Krash eine Subroutine gebrochen`, danach trotzdem `Die Runner-KI hat ungebrochene Subroutinen ausgelöst`. In diesem Beispiel steht nicht der Pump im Vordergrund, sondern dass ein erfolgreicher Krash-Break die `Filter`-ETR-Subroutine offenbar nicht zuverlässig als erledigt erscheinen lässt oder die Chronik diese Sequenz irreführend darstellt.
- Ähnliche Pump-Nachricht wurde laut Nutzer auch bei einem Run auf HQ beobachtet; daher Verdacht auf strukturelles Runner-KI-/Chronikproblem statt Einzelfall.
- Spotcheck Datenstand:
  - `packages/shared/src/index.ts`: `onr_v1_039_krash` hat Stärke 0, Break-Kosten 2, Pump-Kosten 2 und ist ein universeller Icebreaker.
  - `packages/shared/src/index.ts`: `onr_v1_244_filter` ist ein Stärke-0-Code-Gate mit `End the run`.
  - Für `Filter` Stärke 0 müsste `Krash` direkt für 2 Credits brechen können; ein Pump ist dafür nicht nötig.
- Code-Indiz:
  - `packages/ai/src/index.ts::pumpCanLeadToBreak` prüft aktuell nur, ob der Breaker das encountered ICE grundsätzlich brechen kann. Der Helper berücksichtigt nicht aktuellen Breaker-Strength, ICE-Strength, noch offene ungebrochene Subroutinen, vorhandene `break_subroutine`-LegalActions oder ob `continue_run` nach erledigtem Encounter höher bewertet werden sollte.
  - `apps/web/app/chronicle.ts` hat getrennte Titel für `pump_breaker` und `break_subroutine`, die Detailbeschreibung im Screenshot zeigt aber bei beiden Aktionen denselben generischen Effekttext (`2 credits: Break ice subroutine. 2 credits: +1 strength.`). Das wirkt wie fehlende action-spezifische Chronikbeschreibung.

## Scope

- Reproduzierbaren Testfall für Runner-KI mit `Krash` gegen `Filter` Stärke 0 anlegen oder bestehenden AI-/Engine-Test erweitern.
- Sicherstellen, dass die Runner-KI in diesem Fall direkt `break_subroutine` wählt und keinen vorherigen oder nachträglichen `pump_breaker` ausführt.
- Sicherstellen, dass ein erfolgreicher `Krash`-Break gegen `Filter` dessen einzige ETR-Subroutine tatsächlich als gebrochen behandelt; danach darf kein Event für ungebrochene `Filter`-Subroutinen mehr entstehen.
- Runner-KI-Pumpbewertung verbessern:
  - Pump nur hoch bewerten, wenn dadurch eine noch relevante ungebrochene Subroutine legal/effizient gebrochen werden kann.
  - Pump nach bereits gebrochener relevanter Subroutine oder bei ausreichender Breaker-Stärke gegenüber `continue_run` deutlich abwerten.
  - Direkte Break-Actions gegenüber unnötigem Pump bevorzugen.
- Prüfen, ob die Engine nach vollständigem Break weiterhin `pump_breaker` anbietet. Falls ja, entscheiden und dokumentieren, ob das legal bleiben darf; die KI darf es dann trotzdem nicht ohne Nutzen wählen.
- Chronikdarstellung für Breaker-Actions prüfen:
  - `pump_breaker` soll als Pump mit Stärke-/Kostenbezug erscheinen.
  - `break_subroutine` soll als Break mit Subroutine-/Kostenbezug erscheinen.
  - Nicht bei beiden Aktionen pauschal den kompletten kombinierten Breaker-Regeltext als Effektbeschreibung anzeigen.
- Chronik-Reihenfolge bzw. Sortierung im rechten Log prüfen, damit Break, Pump und ungebrochene Subroutine für den Nutzer nachvollziehbar bleiben.
- Prüfen, ob die angezeigte Abfolge durch newest-first-Sortierung, Event-Reihenfolge oder eine tatsächlich falsche Engine-Auflösung entsteht; den Befund entsprechend mit Tests absichern.

## Nicht im Scope

- Keine Änderung an Krash- oder Filter-Kartendaten, sofern die oben genannten Werte bestätigt bleiben.
- Keine generelle Neuentwicklung der Runner-KI.
- Keine Änderung an Engine-Regelautorität, LegalAction-Vertrag, Replay oder StateHash außer wenn eine tatsächlich illegale Action-Projektion gefunden wird.
- Keine Hidden-Info-Erweiterung: Runner-KI darf weiterhin nur PlayerView, LegalActions und side-sichere PublicEvents nutzen.
- Kein UI-Redesign der gesamten Chronik.

## Akzeptanzkriterien

- [x] Ein Test reproduziert `Krash` gegen Stärke-0-`Filter` und belegt: kein unnötiger `pump_breaker`, direkter Break oder korrektes Weiterlaufen.
- [x] Ein Test belegt: Nach `Krash`-Break der einzigen `Filter`-Subroutine wird keine ungebrochene `Filter`-Subroutine mehr ausgelöst.
- [x] Runner-KI bewertet `pump_breaker` nicht mehr allein deshalb hoch, weil der Breaker das ICE grundsätzlich brechen könnte.
- [x] Nach vollständig gebrochener relevanter Subroutine wählt die Runner-KI nicht noch einen Pump, wenn kein weiterer Break-Nutzen besteht.
- [x] Bei noch zu schwachem Breaker und relevanter ungebrochener Subroutine bleibt sinnvolles Pumpen möglich.
- [x] Chroniktests decken getrennte Beschreibungen für `pump_breaker` und `break_subroutine` ab.
- [x] Die Chronik zeigt keine irreführende Abfolge, in der ein Pump nach einem erfolgreichen Break als notwendiger Teil desselben Breaks erscheint.
- [x] Die Chronik zeigt keine Sequenz, in der dieselbe einzige `Filter`-Subroutine erst als gebrochen und danach als ungebrochen ausgelöst erscheint.
- [x] Bestehende Runner-AI-, Engine- und Web-Chronik-Regressionen bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`; bei reinem Chronikbefund kann danach ein kleines `small-adjustments-agent`-Folgepaket entstehen.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts` (`pumpCanLeadToBreak`, Runner-Action-Scoring für `pump_breaker`, `break_subroutine`, `continue_run`).
  - `packages/ai/src/index.test.ts` für AI-Regressionen.
  - `packages/engine/src/index.ts` und `packages/engine/src/index.test.ts` für LegalAction-/Encounter-Regression, falls die gebrochene Subroutine trotzdem als ungebrochen auflöst.
  - `apps/web/app/chronicle.ts` und `apps/web/app/chronicle.test.ts` für action-spezifische Breaker-Chronik.
- Für den Testfall möglichst die echten Runtime-IDs `onr_v1_039_krash` und `onr_v1_244_filter` verwenden.
- Falls das Log im UI bewusst newest-first sortiert ist, soll das in der Darstellung trotzdem eindeutig bleiben; das Problem ist dann mindestens die missverständliche Aktionsbeschreibung.

## Ergebnisnotiz

Erledigt. Die Runner-KI bevorzugt bei `Krash` gegen Stärke-0-`Filter` den direkten Break und unterdrückt unnötiges Pumpen, wenn der Breaker bereits stark genug ist, eine direkte Break-Action legal ist oder das Encounter laut sicherer Public-/LegalAction-Nutzlast keine ungebrochenen Subroutinen mehr hat. Sinnvolles Pumpen bleibt möglich, wenn gerade die fehlende Stärke den Break verhindert.

Die AI-DTO-Allowlist trägt die sicheren Encounter-Felder `unbrokenSubroutineCount` und `encounterWillEndRun`. Die Engine ergänzt öffentliche Pump-Kontextdaten für Chronikdarstellung, und die Web-Chronik unterscheidet Pump, Break und vollständig passierte ICE-Encounter klar. Verifiziert mit fokussierten Web-, AI- und Engine-Tests, Typechecks für AI/Engine/Web sowie `git diff --check`.

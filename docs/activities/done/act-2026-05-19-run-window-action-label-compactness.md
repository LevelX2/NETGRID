---
activityId: act-2026-05-19-run-window-action-label-compactness
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-paid-icebreaker-action-cost-labels
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "Run window"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
---

# Run-Fenster: Lange Aktionslabels kompakter darstellen

## Ziel

Lange Aktions- und Hinweistexte im Run-Fenster sollen besser gekürzt, strukturiert oder responsiv dargestellt werden, damit sie in typischen Breiten nicht unnötig dreizeilig werden. Die Texte müssen verständlich bleiben, aber in den gezeigten Fällen sollte eine ein- bis zweizeilige Darstellung erreichbar sein.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19 mit Screenshots:
  - Im Run-Fenster laufen mehrere Buttons unnötig auf drei Zeilen.
  - Beispiele:
    - `Self-Modifying Code trashen: Programm suchen`
    - `2 Credits - Stärke +1 (Krash) gegen Fire Wall (ICE 1)`
    - `Subroutinen auslösen (Run endet) an ICE 1`
    - Hinweistext `Eisbrecher möglich: 2 Credits - Stärke +1 (Krash) gegen Fire Wall (ICE 1)`
  - Der Nutzer weist darauf hin, dass je nach Text bessere Lösungen möglich sind und die Beispiele nicht zwingend dreizeilig sein müssten.
- Verwandtes erledigtes Paket:
  - `act-2026-05-17-paid-icebreaker-action-cost-labels`: Kostenpräfixe wurden absichtlich sichtbar gemacht. Dieses Follow-up soll die Lesbarkeit verbessern, ohne die Kosteninformation wieder zu verstecken.
- Wahrscheinliche aktuelle Quellen:
  - `apps/web/app/action-board-ui.ts`: `runWindowActionButtonLabel`, `runAwareActionButtonLabel`.
  - `apps/web/app/page.tsx`: Run-Hinweise wie `runBreakerActionHint` und `runHiddenContextActionHint`.
  - `apps/web/app/globals.css`: Button-/Run-Fenster-Textumbruch.

## Scope

- Konkrete Run-Window-Labels aus den Screenshots prüfen und kompakter formulieren, ohne Regelinhalt zu verlieren.
- Für Buttontexte eine klare Kurzform entwickeln, z. B.:
  - `SMC trashen: Programm suchen` oder `Self-Modifying Code: Programm suchen`, wenn der Kontext/Tooltip den vollen Text enthält.
  - `2 Credits - Krash +1 Stärke` statt `2 Credits - Stärke +1 (Krash) gegen Fire Wall (ICE 1)`, wenn das aktive ICE im Run-Fenster bereits sichtbar ist.
  - `Subroutinen auslösen (Run endet)` ohne zusätzliches `an ICE 1`, wenn das Ziel im Run-Fenster eindeutig ist.
- Redundante Zielangaben entfernen, wenn der Run-Kontext das aktive ICE bereits im Panel zeigt.
- Längere Detailinformationen in Tooltip, `aria-label` oder Sekundärzeile verschieben, wenn sie für Accessibility oder Regelnachvollzug wichtig bleiben.
- CSS-/Layout prüfen:
  - stabile Buttonhöhe oder kontrollierter zweizeiliger Umbruch,
  - keine harten 3-Zeilen-Layouts bei normalen Desktopbreiten,
  - keine Überlappung mit Icons, Kostenbadges oder Panelgrenzen,
  - Mobile darf weiter umbrechen, soll aber nicht unnötig jedes Wort einzeln brechen.
- Die Hinweiszeile `Eisbrecher möglich: ...` separat prüfen; sie kann stärker verdichtet werden als ausführbare Buttons, weil die Buttons selbst direkt darunter stehen.
- Fokussierte Web-/Helper-Tests oder Screenshot-/DOM-Prüfung für die betroffenen Labelbeispiele ergänzen.

## Nicht im Scope

- Keine Änderung an LegalAction-Regeln, Kosten, Run-Phasen, Breaker-Stärke oder Subroutine-Auflösung.
- Keine Entfernung der Kosteninformation aus ausführbaren Aktionen.
- Kein vollständiges Redesign des Run-Fensters.
- Keine allgemeine Umbenennung aller Kartenfähigkeiten außerhalb der langen Run-Window-Aktionen.
- Keine Hidden-Info-Erweiterung; Kurzlabels und Tooltips dürfen nur Informationen verwenden, die der jeweilige Spieler rechtmäßig sieht.

## Akzeptanzkriterien

- [ ] Die Screenshot-Beispiele sind reproduziert oder per Unit-/Render-Fixture modelliert.
- [ ] `Self-Modifying Code`-Run-Window-Action bleibt eindeutig, wird aber nicht unnötig dreizeilig.
- [ ] Krash-Pump-/Breaker-Labels zeigen Kosten und Effekt kompakt; redundante aktive-ICE-Zielangaben werden vermieden, wenn der Kontext sie bereits zeigt.
- [ ] `Subroutinen auslösen (Run endet)` wird im Run-Fenster nicht durch unnötiges Ziel-Suffix verlängert.
- [ ] Hinweistexte wie `Eisbrecher möglich: ...` sind kurz genug, um die Buttons nicht optisch zu überfrachten.
- [ ] Vollständige Bedeutung bleibt über Tooltip, `aria-label`, Chronik oder Detailtext nachvollziehbar.
- [ ] Desktop- und schmale Viewports zeigen keine überlappenden oder abgeschnittenen Buttontexte.
- [ ] Web-Tests oder dokumentierte Browser-/Screenshot-Prüfung decken die betroffenen Beispiele ab.

## Umsetzungshinweise

- Primär im Label-Layer ansetzen, nicht an Engine-Labels:
  - `runWindowActionButtonLabel(view, action)`
  - `runAwareActionButtonLabel(view, action)`
  - `runBreakerActionHint(view, actions)`
  - ggf. `runHiddenContextActionHint(view, contextualActions)`
- Für Run-Window-Kontext kann das aktive ICE als Panelkontext gelten. Deshalb kann ein Button kürzer sein als derselbe Button in einer zentralen Aktionsliste.
- Tests sollten nicht nur exakte Kürzungen prüfen, sondern auch sicherstellen, dass Kosten, Kartenname und Haupteffekt erhalten bleiben.
- Wenn CSS angepasst wird, gezielt die Run-Window-/Action-Button-Klassen ändern und keine globalen Button-Umbrüche verschlechtern.

## Ergebnisnotiz

Erledigt: Run-Window-Buttons verwenden für die beobachteten langen Fälle kompaktere Kontextlabels. `Self-Modifying Code` wird im Run-Fenster als `SMC: Programm suchen` angezeigt; der volle Ursprungstext bleibt über Tooltip und `aria-label` erreichbar. Breaker-Aktionen gegen das aktive ICE entfernen das redundante Ziel-Suffix und behalten Kosten, Breakername und Haupteffekt. `Subroutinen auslösen (Run endet)` wird im Run-Fenster ohne zusätzliches `an ICE 1` angezeigt. Die Eisbrecher-Hinweiszeile nutzt dieselben kompakten Run-Window-Labels.

CSS: Run-Action-Labels behalten normalen Wortumbruch statt `anywhere`, damit lange Begriffe nicht unnötig in Einzelteile brechen.

Checks: fokussierte und vollständige `action-board-ui`-Webtests sowie Web-Typecheck bestanden. `git diff --check` wird vor dem Paketcommit ausgeführt. Eine getrennte Breach-Progress-Änderung in denselben Dateien wurde nicht diesem Paket zugeordnet und bleibt unstaged.

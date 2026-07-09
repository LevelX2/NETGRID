# Project Venice Action Timing Prozess

Status: aktiv

Quelle/Vorgabe: Playtest-Fund vom 2026-07-09. Project Venice wurde mit sieben Advancement Countern gescored. NETGRID zeigte nur einen generischen Mark-Counter und gab die durch Project Venice erzeugte Extra-Aktion nicht im aktuellen Corp-Zug. Die Regelprüfung ergab: ONR Errata v1.70, Abschnitt "Gaining Actions", sagt, dass eine durch einen Effekt gewonnene Extra-Aktion sofort gewonnen wird.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Gesamtziel, betroffene Module, fachliche Quelle, Abnahme und Worktree-Modell sind bestimmbar.

## Gesamtziel

Project Venice speichert den Overadvance-Wert sichtbar als Project-Venice-spezifischen Score-Area-Badge und gibt die dadurch erzeugten Corp-Extra-Aktionen regelkonform sofort beim Scoren sowie erneut in späteren Corp-Zügen.

## Annahmen

- Project Venice Difficulty ist 4. Sieben Advancement Counter bedeuten drei Overadvance Counter und damit eine Extra-Aktion pro Corp-Zug.
- "Gain an action during each of your turns" ist nicht gleichbedeutend mit "at the start of each of your turns"; Project Zurich bleibt unverändert Start-of-turn-Credit.
- Die sofortige Aktion wird nur beim Corp-Score im eigenen Corp-Zug angewandt. Spätere Züge bleiben über den gespeicherten Counterwert modelliert.
- Die vorhandenen ungetrackten Review-Dateien im Hauptworkspace sind fremde Artefakte und bleiben unberührt.

## Nicht-Ziele

- Keine Neumodellierung aller alten "extra action per turn"-Karten.
- Keine Änderung an Project Zurich.
- Kein Redesign der Score-Area.
- Keine Remote-Integration, kein Push, kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- UI zeigt nur PlayerView/Events, keine direkte Regelberechnung.
- PublicPayloads enthalten keine verdeckten Kartendaten.
- StateHash und deterministisches Replay bleiben stabil für denselben Event-Input.

## Automatische Fehlerbehandlung

Bei roten fokussierten Tests wird eng am betroffenen Paket debuggt. Wenn ein Konflikt eine abweichende Regelinterpretation erzwingt, wird ohne Scope-Erweiterung gestoppt und ein Blocker dokumentiert.

## Sicherheitsblocker

- Hidden-Info-Leak in PlayerView, PublicEvents oder UI-Payloads.
- Nicht deterministische Aktionserzeugung.
- Breite Refactorings in Engine oder UI außerhalb der Project-Venice-Kante.
- Merge-Konflikt, der zwei inkompatible Regelverträge definiert.

## State Machine

1. `prepared`: Worktree und Prozessartefakt existieren.
2. `engine-fixed`: Score-Timing und Engine-Tests sind grün.
3. `ui-fixed`: Badge-Darstellung und UI-Tests sind grün.
4. `integrated`: Arbeitsbranch ist lokal nach `main` gemerged und Worktree entfernt.

## Paketfolge

### PV-1 Prozessartefakt

Ziel: Scope, Regeln, Paketfolge und Checks versionieren.

Kernartefakte:
- `docs/architecture/card-rules/project-venice-action-timing-process-2026-07-09.md`

Checks:
- `git diff --check`

Done-Gate:
- Prozessartefakt ist committed.

Commit-Message:
- `docs: add project venice action timing process`

### PV-2 Engine-Timing

Ziel: Project Venice gibt die berechneten Extra-Aktionen beim Scoren sofort und in künftigen Corp-Zügen.

Kernartefakte:
- `packages/engine/src/game/corp/scored-agenda/overadvance-score-effects.ts`
- `packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts`

Checks:
- Fokussierter Vitest für Project Venice
- `git diff --check`

Done-Gate:
- Test deckt sofortige aktuelle Aktion und künftigen Turn-Bonus ab.
- Bestehender Project-Zurich-Vertrag bleibt unberührt.

Commit-Message:
- `fix(engine): grant project venice actions immediately`

### PV-3 Score-Area-Badge

Ziel: Project Venice nutzt keinen generischen Mark-Counter-Badge, sondern einen verständlichen, tiefer positionierten Badge für den gespeicherten Aktionswert.

Kernartefakte:
- `packages/engine/src/game/view/card-view.ts`
- `apps/web/features/cards/CardBadges.tsx`
- `apps/web/app/globals.css`
- relevante UI-Tests, falls vorhanden

Checks:
- Fokussierte Web-/Engine-Tests für CardView oder Badge-Rendering
- `git diff --check`

Done-Gate:
- Badge zeigt Project-Venice-spezifisch den Aktionswert, z. B. `+1 Aktion/Zug`.
- Badge-Position verdeckt nicht die oberen Zahlen und orientiert sich an Corporate Retreat.

Commit-Message:
- `fix(web): label project venice action counter`

### PV-4 Finale Integration

Ziel: Finale Checks, lokaler Merge nach `main`, Worktree entfernen.

Checks:
- relevante fokussierte Engine- und Web-Tests
- `git diff --check`
- `git status --short`

Done-Gate:
- Arbeitsbranch ist sauber.
- Branch ist lokal nach `main` gemerged.
- Hauptworkspace zeigt nur vorher bekannte fremde ungetrackte Artefakte.

Commit-Message:
- kein zusätzlicher Commit, sofern PV-2/PV-3 vollständig sind.

## Verifikationsregeln

Fokussierte Tests haben Vorrang vor breiten Läufen. Ein breiter Lauf wird nur ergänzt, wenn die Änderung unerwartet zentrale Contracts berührt.

## Worktree-, Git- und Integrationsregeln

Arbeitsbranch: `codex/project-venice-action-timing`

Worktree: `C:\Projekte\NETGRID_PROJECT_VENICE_ACTION_TIMING`

Der Hauptworkspace `C:\Projekte\NETGRID` bleibt bis zum finalen Merge unberührt. Nach jedem Paket werden nur paketbezogene Änderungen gestaged und committed.

## Controller-Prompt-Kern

/Goal Arbeite Project Venice Action Timing vollständig und sequenziell von PV-1 bis PV-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, relevante Bereichs-AGENTS und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_PROJECT_VENICE_ACTION_TIMING` auf Branch `codex/project-venice-action-timing`. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern mit Blocker-Report.

## Abschlusskriterien

- Project Venice mit sieben Advancement Countern gewährt sofort eine zusätzliche Corp-Aktion im Score-Zug.
- Der gespeicherte Wert gewährt in späteren Corp-Zügen weiterhin die passende Extra-Aktion.
- Score-Area zeigt einen Project-Venice-spezifischen Badge statt generic Mark-Counter.
- Alle paketbezogenen Checks sind dokumentiert und grün oder klar begründet.
- Arbeitsbranch ist lokal in `main` integriert.

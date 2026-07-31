---
activityId: act-2026-07-31-rez-window-cue-semantics
status: in_progress
kind: implementation
area: engine-web-ui
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt:
branch: codex/rez-window-cue-semantics
releaseTarget: current-main
blockedBy: []
resultArtifacts: []
checks: []
---

# Rezfenster-Pässe semantisch und ohne störende Doppelanzeige darstellen

## Quelle und Ausgangslage

Im Live-Spiel `match_4d7bd0eba9138d83` wurden während eines Runs auf R&D nach einem ICE-Rez scheinbar widersprüchliche und beim nächsten ICE zweimal erscheinende „Nicht rezzen“-Fenster beobachtet. Die Ereignisse 307 bis 309 belegen zwei verschiedene, regelkonforme Zeitpunkte: Movement-Root-Rezpass, ICE-Rez und anschließender Abschluss des Approach-Rezfensters. Die Rules Engine führt keine Aktion doppelt aus; die Gegneranzeige stellt verschiedene technische Passaktionen jedoch gleichartig und zu prominent dar.

## Zielprüfung

Der Endzustand ist ausreichend präzise: Die Engine-Zeitpunkte und ihre deterministische Fortsetzung bleiben unverändert, Passarten erhalten eindeutige Semantik, rein technische Passereignisse erzeugen kein großes Gegner-Aktionsfenster, ein echter Verzicht auf das Rezen eines ungerezzten ICE bleibt sichtbar, und Chronik sowie privilegierte KI-Debuganzeige behalten jede Entscheidung.

## Gesamtziel

Die Rezfenster-Darstellung soll den tatsächlichen Regelablauf korrekt und ruhig vermitteln, ohne zwei Entscheidungsautoritäten, Karten-Sonderfälle oder Änderungen am Run-Verhalten einzuführen.

## Annahmen

- Das große Gegner-Aktionsfenster ist eine Präsentationsfläche, keine vollständige Ereignis- oder KI-Auditspur.
- Chronik und KI-Debuganzeige bleiben die vollständigen Kontrollflächen für alle ausgeführten KI-Schritte.
- Ein Pass ohne sichtbare Boardwirkung darf in der Gegneranzeige entfallen, solange der nächste Zustand und die vollständigen Auditspuren erhalten bleiben.

## Nicht-Ziele

- Keine Änderung der Anzahl oder Reihenfolge regelkonformer Rez- und Paid-Ability-Zeitpunkte.
- Keine Änderung an Corp-KI-Planwahl, Bewertung oder Choice-Auflösung.
- Keine kartenbezogene Sonderbehandlung.
- Keine Änderung der laufenden Hauptinstanz, Standardports oder Runtime-Datenbank.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- `decline_rez` bleibt eine LegalAction und wird weiter vollständig validiert, angewendet, protokolliert und replayt.
- Die UI entscheidet nicht, ob ein Rezfenster existiert; sie entscheidet nur, ob das bereits verbuchte Ereignis ein großes Gegnerfenster benötigt.
- Der tatsächliche ICE-Rezverzicht darf nicht mit einem Root-/Fort-/Approach-Fortsetzungspass verwechselt werden.

## Automatische Fehlerbehandlung

- Ein roter Paketcheck blockiert das nächste Paket.
- Semantisch unklare Passzustände werden nicht anhand von Kartennamen oder benachbarten Ereignissen erraten; stattdessen wird die LegalAction-Payload explizit gemacht.
- Konflikte mit neuerem `main` werden nach Erhalt beider Intentionen aufgelöst und erneut getestet.

## Sicherheitsblocker

- Ein erforderlicher Umbau des Run-Regelablaufs wäre außerhalb des freigegebenen Scopes und stoppt den Prozess.
- Ein Filter, der tatsächliche ICE-Rezverzichte oder andere sichtbare Gegneraktionen verschluckt, besteht das Done-Gate nicht.

## State Machine

`movement_rez_window` → optionaler technischer Root-Rezpass → `approach_ice` → optionaler ICE-Rez → expliziter Approach-Fortsetzungspass → `encounter_ice`. Nur ein Pass, der ein weiterhin ungerezztes angegangenes ICE bewusst passieren lässt, bleibt als großes Gegnerereignis sichtbar.

## Paketfolge

1. **P1 – Semantikvertrag:** Approach-Fortsetzung nach bereits gerezztem ICE explizit in Label und Payload kennzeichnen; Engine-Tests sichern Identität und unveränderte Fortsetzung.
2. **P2 – Präsentationsfilter:** Technische Root-/Fort-/Approach-Pässe aus der Gegnerfenster-Ableitung ausschließen; Chronik und KI-Debug bleiben unverändert.
3. **P3 – Regression und Abschluss:** Zusammengesetzte Run-Sequenz, relevante Webtests, Typprüfung und Dokumentation abschließen.

## Paketdetails

### P1 – Semantikvertrag

- Eingang: bestehender `buildCorpApproachActions`- und `decline_rez`-Vertrag.
- Arbeit: generisches Payload-Merkmal für die Fortsetzung bei bereits gerezztem angegangenem ICE; eindeutiges deutsches Label; keine Änderung des Executors.
- Kernartefakte: Engine-Run-Rezfenster und fokussierte Tests.
- Done-Gate: tatsächlicher ICE-Rezverzicht bleibt unmarkiert und sichtbar unterscheidbar; Post-Rez-Fortsetzung ist explizit; Engine-Tests und `git diff --check` grün.
- Commit: `fix(engine): distinguish approach rez continuation passes`

### P2 – Präsentationsfilter

- Eingang: P1 abgeschlossen.
- Arbeit: ausschließlich technische Passereignisse vor der Gegnerfenster-Erzeugung herausfiltern; Debug/Chronik nicht filtern.
- Kernartefakte: `apps/web/app/action-cues.ts` und Tests.
- Done-Gate: Root-, Fort- und Post-Rez-Approach-Pass erzeugen kein Gegnerfenster; echter ICE-Rezverzicht weiterhin schon; Webtests und `git diff --check` grün.
- Commit: `fix(web): suppress technical rez pass action cues`

### P3 – Regression und Abschluss

- Eingang: P1 und P2 abgeschlossen.
- Arbeit: zusammengesetzte Regression prüfen, Activity-Ergebnis und Checks dokumentieren.
- Kernartefakte: Engine-/Webtests und dieses Prozessartefakt.
- Done-Gate: fokussierte Tests, Paket-Typechecks und Diff-Gate grün; keine unerklärten Änderungen.
- Commit: `docs(activity): close rez window cue semantics fix`

## Verifikationsregeln

- Pro Paket fokussierte Vitest-Dateien ausführen.
- Nach Codepaketen die betroffenen Paket-Typechecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Final mindestens Engine-Run-Rezfenster-Tests, Web-Action-Cue-Tests, Engine-/Web-Typecheck und relevante Build-/Test-Discovery-Prüfung ausführen.

## Worktree-, Git- und Integrationsregeln

- Arbeitsort: `C:\Projekte\NETGRID_REZ_WINDOW_CUE_SEMANTICS`.
- Branch: `codex/rez-window-cue-semantics`.
- Hauptworkspace ausschließlich für finalen lokalen Fast-Forward-Merge nutzen.
- Kein Push und kein Pull Request.
- Nach erfolgreichem Merge Worktree entfernen, Entfernung doppelt prüfen und Branch mit `git branch -d` löschen.

## Controller-Prompt-Kern

`/Goal Arbeite den Rezfenster-Cue-Semantikprozess vollständig und sequenziell von P1 bis P3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies AGENTS.md, die paketbezogenen AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree, immer nur am aktuellen Paket, führe Paketchecks und git diff --check aus und committe jedes abgeschlossene Paket. Erhalte Rules-Engine-Zeitpunkte, vollständige Chronik und KI-Debugspur. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree und gemergten Branch verifiziert entfernen und das Goal erst dann abschließen.`

## Abschlusskriterien

- [ ] P1 bis P3 jeweils verifiziert und committed.
- [ ] Technische Rez-Pässe erzeugen kein großes Gegnerfenster.
- [ ] Tatsächlicher ICE-Rezverzicht bleibt sichtbar.
- [ ] Chronik, KI-Debug, Replay und Run-Fortsetzung bleiben vollständig.
- [ ] Arbeitsbranch ist lokal in `main` integriert.
- [ ] Arbeits-Worktree und gemergter Branch sind nachweislich entfernt.

## Ergebnisnotiz

Noch offen.

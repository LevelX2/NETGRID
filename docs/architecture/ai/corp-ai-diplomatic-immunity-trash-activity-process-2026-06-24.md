# Korp-KI Diplomatic Immunity Trash Activity Prozess

## Status

`in_progress` seit 2026-06-24.

## Quelle/Vorgabe

- Nutzerauftrag vom 2026-06-24: `activities-abarbeiten` mit Hilfe von `paketprozess-worktree-goal`, direkt in diesem Chat.
- Activity-Paket: `docs/activities/inbox/act-2026-06-24-corp-ai-trash-diplomatic-immunity-before-meat-damage.md`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: offene passende Activity aus `docs/activities/inbox/` sequenziell im eigenen Worktree umsetzen.
- Erwarteter Endzustand: Paket ist abgeschlossen, verifiziert, committed und lokal nach `main` integrierbar.
- Relevante Artefakte: AI-Entscheidungslogik, AI-Tests, Activity-Board.
- Sicherheitsgrenzen: keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung, keine Engine-, Replay- oder StateHash-Vertragsänderung.

Bekannte Einschränkung: Der Hauptworkspace `C:\Projekte\NETGRID` enthält vor Prozessstart fremde Webclient-Änderungen. Der finale Merge nach `main` darf nur erfolgen, wenn diese Änderungen den Merge nicht unsicher machen.

## Gesamtziel

Die Korp-KI soll bei einem getaggten Runner mit sichtbarer globaler Meat-Damage-Prävention durch `Diplomatic Immunity` eine legale Resource-Trash-Aktion gegenüber generischer Economy priorisieren, solange die Korp keinen Agenda-Punkt zum Canceln hat und ein side-sicherer Damage-Plan plausibel ist.

## Annahmen

- `Diplomatic Immunity` ist als sichtbare installierte Runner-Resource side-sicher bewertbar.
- Die KI darf ausschließlich vorhandene Engine-`LegalActions` auswählen.
- Falls generische Funktionssignale fehlen, ist ein enger, kartenspezifisch abgesicherter Einstieg zulässig, solange die Activity die spätere generische Erweiterung nicht blockiert.

## Nicht-Ziele

- Keine Änderung von Kartentexten, Engine-Regeln, Damage-Resolvern oder Agenda-Punkt-Zahlung.
- Keine Erweiterung von PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Logs oder Traces um verdeckte Informationen.
- Kein breiter Umbau der KI-Strategie für alle Tag-, Damage- oder Resource-Trash-Fälle.
- Kein Push, keine Pull Request-Erstellung und keine Remote-Integration.

## Controller-Invarianten

- Genau ein Activity-Paket ist aktiv.
- Das Paket wird vor Codeänderungen von `inbox/` nach `in-progress/` verschoben.
- Nach Abschluss wird das Paket nach `done/` verschoben und mit Ergebnisnotiz, Checks und Result-Artefakten aktualisiert.
- Jeder abgeschlossene Schritt wird lokal committed.
- Fremde Änderungen im Hauptworkspace bleiben unberührt.

## Automatische Fehlerbehandlung

- Bei roten fokussierten Tests wird eng im Paket-Scope debuggt.
- Bei unklarer LegalAction- oder Hidden-Info-Grenze wird gestoppt und das Paket als blockiert dokumentiert.
- Bei finalem Merge-Blocker durch fremde Hauptworkspace-Änderungen bleibt der Arbeitsbranch committed und der Blocker wird im Abschluss benannt.

## Sicherheitsblocker

Stoppe ohne Workaround, wenn eine Umsetzung erfordern würde:

- neue Aktionen außerhalb von Engine-`LegalActions` zu erzeugen,
- verdeckte Runner- oder Korp-Informationen in AI-Inputs oder öffentliche Oberflächen zu projizieren,
- Replay-, StateHash-, Randomness- oder `applyAction`-Verträge zu ändern,
- fremde Hauptworkspace-Änderungen zu überschreiben oder zu committen.

## State Machine

1. `process_prepared`: Prozessartefakt und `/Goal` sind dokumentiert.
2. `package_claimed`: Activity liegt in `in-progress/`, Frontmatter ist aktualisiert.
3. `implementation_done`: Code und Tests erfüllen den Scope.
4. `package_done`: Activity liegt in `done/`, Checks und Ergebnis sind dokumentiert.
5. `branch_committed`: Paketcommit liegt auf dem Arbeitsbranch.
6. `integrated_or_blocked`: Branch ist lokal nach `main` integriert oder der sichere Integrationsblocker ist dokumentiert.

## Paketfolge

### Paket 1: `act-2026-06-24-corp-ai-trash-diplomatic-immunity-before-meat-damage`

Ziel: Korp-KI priorisiert legale Resource-Trash-Aktionen gegen `Diplomatic Immunity` im getaggten Meat-Damage-Kontext.

Eingangsvoraussetzungen:

- Worktree `C:\Projekte\NETGRID_activity_diplomatic_immunity_ai`.
- Branch `codex/activity-diplomatic-immunity-ai`.
- Activity-Paket liegt in `docs/activities/inbox/`.

Konkrete Arbeit:

- AI-Scoring für Korp-Resource-Trash-Aktionen prüfen.
- Sichtbare globale Damage-Prävention durch `Diplomatic Immunity` im side-sicheren Kontext erkennen.
- Score so anheben, dass Trash vor einfacher Economy gewählt wird, wenn die LegalAction vorhanden ist.
- Fokussierte Regression ergänzen.
- Activity abschließen.

Kernartefakte:

- AI-Quellcode unter `packages/ai/src/`.
- Fokussierte AI-Tests.
- Activity-Datei unter `docs/activities/done/`.

Checks:

- Paketbezogene Vitest-Tests.
- `git diff --check`.

Done-Gate:

- Der Regressionstest bildet den Screenshot-Fall sinngemäß ab.
- Keine Hidden-Info-, LegalAction-, Engine-, Replay- oder StateHash-Grenze wurde erweitert.
- Paket ist committed.

Commit-Message-Vorschlag:

`Prioritize Corp trash of Diplomatic Immunity`

## Verifikationsregeln

- Fokussierte Tests haben Vorrang vor breiten Suite-Läufen.
- Wenn ein breiter Check aus Zeit- oder bestehendem Baseline-Grund nicht läuft, wird das begründet.
- Vor jedem Commit wird `git diff --check` ausgeführt.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_activity_diplomatic_immunity_ai`.
- Arbeitsbranch: `codex/activity-diplomatic-immunity-ai`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen lokalen Merge.
- `main` ist lokaler Integrationsbranch.
- Pushes und PRs sind ausgeschlossen.
- Der finale Merge nach `main` wird nur versucht, wenn der Hauptworkspace sicher integrierbar ist.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Korp-KI Diplomatic Immunity Trash Activity Prozess vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main, sofern der Hauptworkspace sauber und sicher integrierbar ist.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Startseiten, die Skill-Regeln und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_activity_diplomatic_immunity_ai auf Branch codex/activity-diplomatic-immunity-ai.
Nutze den Hauptworkspace C:\Projekte\NETGRID nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe und aktualisiere Paketartefakte.
Führe paketbezogene Checks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren. Wenn fremde Hauptworkspace-Änderungen den Merge unsicher machen, dokumentiere den Integrationsblocker und lasse den Arbeitsbranch committed stehen.
```

## Abschlusskriterien

- Paket 1 ist in `done/` abgeschlossen und committed.
- Arbeitsbranch ist sauber.
- Finaler Merge nach `main` ist erfolgt oder wegen klar benanntem fremdem Workspace-Blocker bewusst nicht erfolgt.
- Offene Risiken und nicht ausgeführte Checks sind im Abschluss sichtbar.

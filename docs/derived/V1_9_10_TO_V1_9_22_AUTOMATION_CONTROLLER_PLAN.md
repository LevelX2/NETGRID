# V1.9.10 bis V1.9.22 Automation Controller Plan

Status: Planungs- und Machbarkeitsartefakt, fuer Expeditionsmodus aktualisiert
Stand: 2026-05-12
Primärer Agent: release-planning-agent

## Ziel

Dieses Artefakt bewertet, ob eine stündliche Codex-Automation die V1.9.10-bis-V1.9.22-Releasekette sequenziell planen, umsetzen, verifizieren, committen, pushen und danach den nächsten Release-Schritt beginnen kann.

Ergebnis: Das Konstrukt ist grundsätzlich automatisierbar, aber nur als Release-Controller mit explizitem State, Lock, Git-Gate, Done-Gate und Fehlerstopp. Nach Nutzerentscheidung vom 2026-05-12 darf der Controller im Expeditionsmodus unvollständige WIP-Stände committen und pushen; ein Releaseabschluss und der Sprung zum nächsten Release bleiben aber gate-pflichtig. Eine einfache Schleife nach dem Muster "wenn etwas fertig wirkt, als fertig markieren und weiter" wäre für NETGRID zu riskant.

## Nicht-Ziele

- Dieses Artefakt ist nicht selbst die Automation; die aktive Automation verweist auf Cursor und Prompt.
- Codeimplementierung erfolgt erst in den Automationsläufen entlang des Cursors.
- WIP-Commit und WIP-Push sind im Expeditionsmodus erlaubt, aber kein Merge nach `main`.
- Keine Releases werden durch das Planungsartefakt als fertig markiert.
- Keine V2.x-Funktionen werden vorbereitet oder entsperrt.

## Geeignete Automationsform

Für die spätere Umsetzung passt eine Codex-Cron-Automation, die ungefähr stündlich gegen den NETGRID-Workspace läuft. Ein Thread-Heartbeat ist ungeeignet, weil die Aufgabe nicht nur eine kurze Fortsetzung dieses Chats ist, sondern wiederholt Projektzustand, Git, Tests und Release-Artefakte prüfen muss.

Empfohlene Ausführungsform:

- Dedizierter Branch: `codex/v1-9-originalset-completion`.
- Ein Automation-Job, nicht ein Job pro Release.
- Pro Lauf maximal ein aktiver Release-Schritt aus dem Cursor; WIP-Checkpoint mit Commit/Push ist erlaubt.
- Kein automatischer Merge nach `main`.
- Pull Request oder Merge erst nach separater Nutzerfreigabe.

## Controller-State

Die Automation braucht einen versionierten Cursor und einen unversionierten Laufzeit-Lock.

Empfohlener versionierter Cursor:

`docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`

Mindestinhalt:

- aktueller Zielrelease, z. B. `V1.9.10`
- Phase: `planned`, `implementing`, `verifying`, `done_pending_commit`, `committed_pending_push`, `pushed_pending_next`, `blocked`, `complete`
- letzter grüner Testlauf mit Zeitstempel
- letzter Commit-Hash, falls vorhanden
- nächster erlaubter Release
- Blocker mit Removal Condition
- WIP-Commit- und Push-Status fuer unvollstaendige Zwischenstaende

Empfohlener unversionierter Lock:

`%LOCALAPPDATA%\NETGRID\automation\v1_9_originalset_completion.lock`

Der Lock muss außerhalb versionierter Artefakte bleiben. Er verhindert, dass zwei Stundenläufe dieselbe Releasearbeit parallel anfassen. Der fruehere Pfad `.codex/runtime/v1_9_originalset_completion.lock` ist nicht mehr verbindlich, weil der lokale Automationsmodus diese Repo-Flaeche per ACL schuetzt.

## State Machine

| Zustand | Erlaubte Aktion | Nächster Zustand |
| --- | --- | --- |
| `planned` | Release-spezifische Detailplanung/Requirements/Testmatrix erstellen | `implementing` |
| `implementing` | Genau den aktuellen Release umsetzen | `verifying` |
| `verifying` | Pflichtchecks, Artefakte und Final Review prüfen | `done_pending_commit` oder `blocked` |
| `done_pending_commit` | Diff-Gate prüfen und aktuellen Release committen | `committed_pending_push` |
| `committed_pending_push` | Commit pushen | `pushed_pending_next` |
| `pushed_pending_next` | Cursor auf nächsten Release setzen, Detailplanung beginnen | `planned` oder `complete` |
| `blocked` | Keine Umsetzung, kein Commit, kein Push | bleibt `blocked`, bis Removal Condition erfüllt ist |
| `complete` | Keine Folgearbeit | bleibt `complete` |

Wichtig: Die Automation darf niemals einen Zustand überspringen.

Im Expeditionsmodus darf ein Lauf zusätzlich aus `planned`, `implementing` oder `verifying` heraus einen WIP-Commit und WIP-Push erzeugen. Das ändert den Release nicht auf `done` und setzt den Cursor nicht weiter.

## Done-Gate je Release

Ein Release gilt erst als fertig, wenn alle folgenden Bedingungen erfüllt sind:

- passender Final Review existiert, z. B. `docs/derived/V1_9_10_FINAL_REVIEW.md`
- Release-spezifisches Implementation Review existiert
- Requirements, Spec und Testmatrix existieren oder sind im Releaseplan begründet entbehrlich
- Webclient-Version ist bei Karten-/Feature-Releases auf den Zielstand aktualisiert
- Release-Manifest ist aktualisiert
- Mechanics-Coverage ist aktualisiert, sofern Mechaniken betroffen sind
- Szenario- oder Smoke-Artefakte sind aktualisiert
- AI-Hints und AI-Smokes sind für alle `ai_supported` Karten aktualisiert
- `corepack pnpm --filter @netgrid/engine test` grün
- `corepack pnpm --filter @netgrid/ai test` grün
- `corepack pnpm --filter @netgrid/catalog test` grün
- `corepack pnpm --filter @netgrid/web test` grün
- `corepack pnpm --filter @netgrid/server test` grün
- `corepack pnpm typecheck` grün
- `corepack pnpm test` grün
- `corepack pnpm lint` grün
- `corepack pnpm build` grün oder mit dokumentierter bekannter nicht-blockierender Warnung
- keine unklassifizierten offenen Änderungen
- keine nicht versionierbaren lokalen Daten, Caches, DBs oder Secrets im Diff

## Commit-Gate

Committen ist nur erlaubt, wenn:

- der State `done_pending_commit` ist
- der aktuelle Release im Cursor exakt dem Final Review entspricht
- alle Done-Gates erfüllt sind
- `git status` nur Dateien zeigt, die zu diesem Release gehören
- keine fremden Nutzeränderungen im Diff liegen
- keine Dateien unter lokalen Runtime-/Cache-/Secret-Pfaden betroffen sind
- Commit-Message dem Muster folgt: `V1.9.xx: <kurzer Release-Titel>`

Wenn der Diff fremde Änderungen enthält, muss die Automation stoppen und einen Blocker dokumentieren. Sie darf nicht versuchen, fremde Änderungen zu revertieren oder mitzunehmen.

Ausnahme fuer Expeditionsmodus: WIP-Commits sind vor dem Completion-Gate erlaubt, wenn sie auf dem dedizierten Branch bleiben, den aktuellen Release betreffen und als `WIP V1.9.xx: ...` gekennzeichnet sind. WIP-Commits dürfen den Release nicht als abgeschlossen markieren.

## Push-Gate

Pushen ist nur erlaubt, wenn:

- der State `committed_pending_push` ist
- der letzte Commit von der Automation erzeugt wurde
- der Branch der dedizierte Completion-Branch ist
- der lokale Branch nicht hinter dem Remote liegt
- der Push ohne Force möglich ist

Force Push ist ausgeschlossen. Push nach `main` ist ausgeschlossen.

Ausnahme fuer Expeditionsmodus: WIP-Pushes sind erlaubt, sobald ein WIP-Commit erzeugt wurde und der Branch der dedizierte Completion-Branch ist. Push nach `main` und Force Push bleiben ausgeschlossen.

## Nächster-Release-Gate

Der nächste Release darf erst begonnen werden, wenn:

- der aktuelle Release mit Abschlusscommit gepusht ist
- der Cursor den Commit-Hash und den Push-Erfolg dokumentiert
- der nächste Release exakt der Reihenfolge aus `docs/derived/V1_9_10_TO_V1_9_XX_IMPLEMENTATION_HANDOFF.md` entspricht
- keine offenen Änderungen im Worktree verbleiben

Die Reihenfolge ist hart:

1. V1.9.10 Status-, Manifest- und Katalog-Konsolidierung
2. V1.9.11 Hidden-Zone Search, Reveal, Reorder und Shuffle
3. V1.9.12 Counter, Virus, Purge und Recurring Pools
4. V1.9.13 Damage, Prevention, Avoid und Replacement Longtail
5. V1.9.14 Trace, Link, Tags und Resource-Tag-Interaktionen
6. V1.9.15 Run Flow, Access, Multiaccess und Ambush on Access
7. V1.9.16 Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy
8. V1.9.17 Generische Asset/Node-Fähigkeiten
9. V1.9.18 Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten
10. V1.9.19 Agenda Difficulty, Scored Agenda Abilities und Overadvance
11. V1.9.20 Globale Modifier, Handgröße, Action Economy und persistente Sonderzustände
12. V1.9.21 Deterministischer Zufall und Würfelkarten
13. V1.9.22 Per-card Resolver Longtail und Originalset Completion Gate

## Startbewertung gegen aktuellen Workspace

Vor Initialisierung müsste die Automation stoppen.

Nach Initialisierung im Expeditionsmodus gilt:

- Der Branch `codex/v1-9-originalset-completion` ist der Arbeitszweig.
- `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md` ist der Cursor.
- `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_PROMPT.md` ist der Controller-Prompt.
- Der erste Release ist V1.9.10 in Phase `planned`.
- WIP-Commits und WIP-Pushes sind erlaubt.
- Releaseabschluss und Cursor-Fortschritt bleiben gate-pflichtig.

Diese Startbewertung spricht fuer Automatisierbarkeit mit aktivem Checkpoint-Verhalten statt fuer einen unkontrollierten Dauerlauf.

## Initialisierung vor dem ersten echten Lauf

Vor dem Anlegen der Automation sollten manuell oder durch einen einmaligen Setup-Schritt erledigt werden:

- dedizierten Branch `codex/v1-9-originalset-completion` erstellen
- offene Planungsartefakte bewusst committen oder aus dem Automation-Scope halten
- `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md` mit Zielrelease `V1.9.10` und Phase `planned` anlegen
- Lock-Verzeichnis als lokal ignorierte Runtime-Fläche festlegen
- Automation-Prompt auf genau diese State Machine beschränken
- erster Automationslauf im Expeditionsmodus mit WIP-Commit/WIP-Push, aber ohne Releaseabschluss ohne Gate

## Automation-Prompt-Kern

Der spätere Automation-Prompt sollte nicht allgemein "arbeite weiter" sagen. Er muss den Controller explizit binden:

1. Lies AGENTS, AGENTS.local, release-implementation-agent und die V1.9.10-bis-V1.9.22-Artefakte.
2. Prüfe den Lock. Wenn aktiv, stoppe ohne Änderungen.
3. Lies den Automation-State-Cursor.
4. Prüfe Branch, Git-Status und Remote-Status.
5. Arbeite ausschließlich am aktuellen Release aus dem Cursor.
6. Sichere Fortschritt per WIP-Commit/WIP-Push, wenn versionierbare Aenderungen entstanden sind.
7. Wenn der Release fertig ist, prüfe Done-Gate, Diff-Gate, Commit-Gate und Push-Gate.
8. Wenn Abschlusscommit und Push erfolgreich sind, setze den Cursor auf den nächsten Release.
9. Beginne den nächsten Release nur mit Detailplanung/Requirements, wenn der aktuelle Release abgeschlossen ist.
10. Bei jedem harten Fehler: stoppe, dokumentiere Blocker und pushe hoechstens den dokumentierten WIP-Stand.

## Problemstellen

| Problem | Risiko | Gegenmaßnahme |
| --- | --- | --- |
| Lauf überschneidet sich mit vorherigem Lauf | Doppelarbeit, kaputter Git-Status | unversionierter Lock mit Zeitstempel und Stale-Lock-Regel |
| Release dauert länger als eine Stunde | zweiter Job greift parallel ein | Lock stoppt neuen Lauf |
| Dirty Worktree durch Nutzeränderungen | falscher Commit | Diff-Gate und Blocker statt Commit |
| Final Review existiert, Tests aber nicht grün | falsches Done-Signal | Done-Gate verlangt Testnachweise |
| Automation pusht auf falschen Branch | Integrationsrisiko | Branch-Gate, kein Push nach `main` |
| Späterer Release wird vorgezogen | Sequenzbruch | Cursor plus Handoff-Reihenfolge als harte Quelle |
| Hidden-Info-Regression bleibt unentdeckt | Projektkernbruch | Visibility-/Replay-/AI-Safety-Pflichtgates |
| AI hängt in neuen Choice-Fenstern | stündlicher Job kann festlaufen | Timeout, AI-Fallback und blockierender Test |
| Große Releases überfordern einen Lauf | halbfertiger Zustand | State bleibt `implementing`; nächster Lauf setzt denselben Release fort |

## Empfehlung

Automatisierbar: ja, im aktivierten Expeditionsmodus mit State-Cursor, Lock, WIP-Checkpoints und gate-pflichtigem Releaseabschluss.

Nicht empfehlenswert:

- direkt auf `main`
- ohne Lock
- ohne Cursor
- ohne Done-Gate
- ohne Branch-Gate
- ohne menschliche Sichtung der späteren Integration nach `main`

Empfohlener nächster Schritt:

1. Cursor und Controller-Prompt versionieren.
2. Stündliche Codex-Cron-Automation auf den NETGRID-Workspace legen.
3. Abends die WIP-/Release-Commits, Pushes, Blocker und Abschlussreviews prüfen.

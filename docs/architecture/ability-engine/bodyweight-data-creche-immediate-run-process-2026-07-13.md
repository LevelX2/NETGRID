# Bodyweight Data Crèche: unmittelbares Bonus-Run-Fenster 2026-07-13

## Status

`implementation_complete_pending_local_integration`

## /Goal

Bodyweight Data Crèche erhält einen vollständigen, deterministischen Timing-Vertrag: Nach jedem erfolgreichen Run, solange die Once-per-turn-Fähigkeit noch nicht tatsächlich verwendet wurde, öffnet sich unmittelbar ein optionales Bonus-Run-Fenster. In diesem Fenster darf der Runner ausschließlich einen legalen Bonus-Run ohne Aktion starten oder ausdrücklich ablehnen. Eine Ablehnung schließt nur dieses konkrete Timingfenster und verbraucht die Fähigkeit nicht; ein späterer erfolgreicher Run im selben Zug darf sie erneut anbieten. Erst der tatsächliche Start des Bonus-Runs verbraucht die Fähigkeit für diesen Zug. Der Vertrag wird in einem eigenen Worktree umgesetzt, durch fokussierte Engine-, UI- und KI-Prüfungen abgesichert, paketweise committet, lokal nach `main` integriert und anschließend mit verifiziertem Worktree- und Branch-Cleanup abgeschlossen.

## Quellen und betroffene Verträge

- `docs/source/Netrunner Errata 1.70.md`
- `packages/engine/src/card-implementations/onr-v1/runner/hardware/bodyweight-data-creche.ts`
- `packages/engine/src/game/run/successful-run-interventions.ts`
- `packages/engine/src/game/run/start-run-action-execution.ts`
- `packages/engine/src/game/turn/runner-main-actions.ts`
- `packages/engine/src/index-tests/originalset/per-card-followups.test.ts`
- `packages/ai/src/actions/run-action-projection.ts`
- `apps/web/app/action-board-ui.ts`

Der maßgebliche Kartentext lautet sinngemäß: Einmal pro Zug darf der Runner direkt nach einem erfolgreichen Run einen weiteren Run beginnen, ohne dafür eine Aktion auszugeben.

## Präzisierter Regelvertrag

1. Ein erfolgreicher Run öffnet das optionale Fenster nur, wenn Bodyweight Data Crèche installiert und die Fähigkeit in diesem Zug noch nicht verwendet ist.
2. Das Fenster ist unmittelbar. Solange es offen ist, sind keine normalen Runner-Aktionen wie Karte ziehen, Credit nehmen, installieren, normale Runs oder Zugende legal.
3. Der Runner darf im Fenster genau zwischen den zu diesem Zeitpunkt legalen Bonus-Runs und einer ausdrücklichen Ablehnung wählen.
4. Eine Ablehnung schließt die aktuell angebotene Instanz, setzt aber nicht `successfulRunExtraRunUsedThisTurn`.
5. Nach einer Ablehnung darf ein späterer erfolgreicher Run im selben Zug ein neues Fenster öffnen.
6. Der tatsächliche Start eines Bodyweight-Bonus-Runs schließt das Fenster und setzt `successfulRunExtraRunUsedThisTurn`.
7. Nach tatsächlicher Verwendung darf im selben Zug kein weiteres Bodyweight-Fenster entstehen.
8. Zu Beginn des nächsten Runner-Zugs werden Pending- und Used-Status wie bisher zurückgesetzt.
9. Run-Sperren, Zusatzkosten, Serverlegalität, Klickfreiheit, State-Version, Seite und Action-ID bleiben vollständig durch `LegalActions` und `applyAction` revalidiert.

## Zustandsautomat

```text
UNUSED_IDLE
  | erfolgreicher Run
  v
IMMEDIATE_OFFER
  | Ablehnung                    | legalen Bonus-Run starten
  v                              v
UNUSED_IDLE                   USED_FOR_TURN
  | späterer erfolgreicher Run    | weitere erfolgreiche Runs
  v                              v
IMMEDIATE_OFFER              USED_FOR_TURN
```

Controller-Invarianten:

- `successfulRunExtraRunPending=true` bedeutet ein exklusives unmittelbares Entscheidungsfenster.
- `successfulRunExtraRunUsedThisTurn=true` bedeutet, dass der Bodyweight-Bonus-Run tatsächlich begonnen hat, nicht bloß, dass er angeboten wurde.
- `bonusRunPending` darf für Bodyweight nicht über eine andere Runner-Aktion hinweg bestehen bleiben.
- Der Client und die KI erhalten keine Sonderautorität; beide handeln ausschließlich aus den erzeugten `LegalActions`.

## Annahmen und Nicht-Ziele

- Die vorhandenen `start_run`-Aktionen mit `bonusRunNoClick` und `bonusRunSource` bleiben der kanonische Startpfad. Dadurch bleiben Run-Kosten, Sperren, Serverauswahl, KI-Projektion und Replay-Verhalten erhalten.
- Das explizite Ablehnen wird als engine-validierte LegalAction modelliert.
- Der generische All-Nighter-Bonus-Run wird nicht semantisch verändert.
- Es gibt keine Migration für alte lokale States oder Replays; NETGRID ist eine Version-0-Umgebung.
- Es erfolgt kein Release-Versionssprung und kein Remote-Push.
- Gleichzeitige fremde Sequenzen werden nicht breit neu entworfen. Falls ein belegter Konflikt mit einer bestehenden Pflichtsequenz auftritt, wird er im Umsetzungspaket durch einen deterministischen Vorrang oder als konkreter Folgebefund behandelt.

## Paketsteuerung

Es ist immer genau ein Paket aktiv. Ein Paket gilt erst als abgeschlossen, wenn seine Akzeptanzkriterien erfüllt, die relevanten Prüfungen grün, `git diff --check` sauber und der Paketstand committet ist.

### BDC-01 – Prozess- und Regelvertrag

Status: `complete`

Ziel:

- Diesen Prozess, den Zustandsautomaten, die Paketgrenzen und die Abschlussbedingungen verbindlich festhalten.

Akzeptanzkriterien:

- `/Goal`, Regelvertrag, Invarianten, Nicht-Ziele und Paketfolge sind dokumentiert.
- Der Arbeitsstand liegt ausschließlich im dedizierten Worktree `C:\Projekte\NETGRID_BODYWEIGHT_DATA_CRECHE_TIMING` auf `codex/bodyweight-data-creche-timing`.
- `git diff --check` ist sauber.

Commit:

- `docs: define Bodyweight immediate-run process`

### BDC-02 – Engine-Regressionsschutz und Timingkorrektur

Status: `complete`

Ziel:

- Den Fehler zuerst mit fokussierten Regressionen belegen und anschließend den Engine-Vertrag grün implementieren.

Akzeptanzkriterien:

- Nach erfolgreichem Run sind nur legale Bodyweight-Bonus-Runs und die Ablehnung verfügbar.
- Normale Aktionen, normale Runs und Zugende sind während des Fensters nicht legal.
- Ablehnung schließt Pending, lässt Used unverbraucht und erlaubt nach einem späteren erfolgreichen Run ein neues Angebot.
- Der tatsächliche Bonus-Run-Start setzt Used und verhindert ein weiteres Angebot im selben Zug.
- Ein Bonus-Run bleibt auch ohne verbleibenden Klick legal; Run-Sperren und Zusatzkosten bleiben wirksam.
- Forged-, Wrong-side- und stale-state-Aktionen werden durch den normalen Engine-Vertrag abgewiesen.
- Betroffene fokussierte Engine-Tests und der Engine-Typecheck sind grün.
- `git diff --check` ist sauber.

Commit:

- `fix(engine): enforce Bodyweight immediate run window`

### BDC-03 – UI-/KI-Verbrauchervertrag

Status: `complete`

Ziel:

- Belegen, dass UI und KI das exklusive Fenster ausschließlich über `LegalActions` korrekt konsumieren.

Akzeptanzkriterien:

- Die UI stellt Bodyweight-Bonus-Runs weiterhin als primäre, klickfreie Run-Entscheidungen dar und kann die Ablehnung sichtbar anbieten.
- Die KI kann Bonus-Runs weiterhin mit ihrer Run-Projektion bewerten und erhält während des Fensters keine normale Zwischenaktion.
- Nur tatsächlich fehlende Consumer-Logik wird geändert; andernfalls genügt fokussierter Regressionsschutz.
- Relevante UI-/KI-Tests und Typechecks sind grün.
- `git diff --check` ist sauber.

Commit:

- `test: harden Bodyweight run-window consumers`

### BDC-04 – Abschluss, Wissenspflege und Integration

Status: `active`

Ziel:

- Gesamtstand verifizieren, den Prozess auf abgeschlossen setzen, lokal integrieren und vollständig aufräumen.

Akzeptanzkriterien:

- Fokussierte Engine-, UI- und KI-Checks sowie `git diff --check` sind grün.
- Belastbare neue Regel- und Implementierungskenntnisse sind im passenden aktuellen Wissensartefakt dokumentiert.
- Der Prozessstatus lautet `complete` und alle Pakete sind abgeschlossen.
- Aktuelles lokales `main` ist in den Arbeitsbranch integriert und geprüft.
- Der Arbeitsbranch ist per Fast-forward in lokales `main` integriert und `main` danach geprüft.
- Der Worktree fehlt sowohl in `git worktree list` als auch im Dateisystem.
- Der gemergte Arbeitsbranch ist lokal mit `git branch -d` gelöscht.

Commit:

- `docs: close Bodyweight timing correction`

## Umsetzungs- und Verifikationsnachweis

- BDC-01 `3ee7d7081`: Prozess, Regelvertrag und Zustandsautomat festgelegt.
- BDC-02 `5d9448151`: Angebot und Verwendung getrennt, unmittelbares LegalAction-Fenster eingeführt, Ablehnung und erneute Auslösung umgesetzt sowie Start-Run-Revalidation gehärtet.
- BDC-03 `4304b4a64`: Ablehnung in der UI neben den Bonus-Runs sichtbar gemacht und klickfreie Bonus-Runs in der KI-Projektion als `bonus_run` klassifiziert.
- Engine: fünf fokussierte Testdateien mit 60 Tests grün; Engine-Typecheck grün.
- Web: `action-board-ui.test.ts` mit 101 Tests grün; Web-Typecheck einschließlich Next-Typegen grün.
- KI: `run-action-projection.test.ts` mit 11 Tests grün; KI-Typecheck grün.
- `git diff --check` ist sauber.
- Lokale Integration, Main-Nachprüfung und Cleanup werden erst nach dem finalen Main-Abgleich als abgeschlossen markiert.

## Fehler- und Sicherheitsbehandlung

- Bei einem roten Check bleibt das aktuelle Paket aktiv; Ursache und Korrektur werden im selben Paket bearbeitet.
- Hidden-Info-, Replay-, StateHash-, LegalAction- oder Determinismusregressionen sind Integrationsblocker.
- Ein nicht fast-forward-fähiger Integrationsstand wird nicht erzwungen; stattdessen wird `main` defensiv in den Arbeitsbranch integriert und erneut geprüft.
- Fremde Worktrees, Branches und unbeteiligte Änderungen werden nicht verändert.

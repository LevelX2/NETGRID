# Testfehler-Reparaturprozess

Status: in Arbeit

## Quelle

Vollständiger Testbefund vom 2026-08-19: Fehler in Katalog, Engine, KI, Server und Web; `check:test-discovery` und die Contract-Spezifikationen sind grün.

## Gesamtziel

Alle aktuell reproduzierbaren Testfehler ursachenorientiert beheben, ohne Regelautorität, Hidden-Info-Grenzen, deterministisches Replay oder StateHash abzuschwächen. Die Umsetzung erfolgt sequenziell in einem isolierten Worktree; jedes Paket wird getestet und committed. Anschließend wird der Arbeitsbranch lokal nach `main` integriert und vollständig bereinigt.

## Annahmen und Nicht-Ziele

- Testwerte werden nur geändert, wenn der aktuelle Engine-/CardSpec-Vertrag fachlich korrekt ist; andernfalls wird die erzeugende Schicht korrigiert.
- Historische Checkpoint-Fixtures werden nur nach erfolgreicher Reproduktion ihres kanonischen Engine-Zustands aktualisiert.
- Kein Redesign, keine neue KI-Entscheidungsautorität und keine Kompatibilitätsadapter.

## Controller-Invarianten

- Rules Engine bleibt alleinige Regelautorität.
- KI ergänzt nur die Payload einer gebundenen `LegalAction` und erhält ihren bestehenden Plan-/Continuation-Owner.
- Öffentliche Projektionen bleiben side-sicher.
- Replay, StateHash und Zufall bleiben deterministisch.

## Paketfolge

### TFR-01: Reproduzierbare Ursachenkarte und CardSpec-/Engine-Verträge

Ziel: Katalog-, Kartenformat-, Public-Event-, Run-/Access- und PlayerView-Abweichungen an der erzeugenden CardSpec- oder Engine-Schicht klären und korrigieren.

Done-Gate: betroffene Engine- und Katalogtests grün; keine Teständerung ohne fachliche Gegenprüfung.

Commit: `fix(engine): align card and public projection contracts`

### TFR-02: KI-Checkpoint- und Plan-Owner-Konsistenz

Ziel: StateHash-/Identity-Drift der Checkpoint-Fixtures und die daraus folgenden Plan-first-Regressionen am verantwortlichen Engine- oder Checkpoint-Pfad korrigieren.

Done-Gate: betroffene Checkpoints reproduzierbar, deterministisch und mit unverändertem Plan-/Continuation-Owner grün.

Commit: `fix(ai): restore checkpoint and plan ownership consistency`

### TFR-03: Server- und Account-Verträge

Ziel: Standarddeck-Guide-Status, Account-Export-Schutz, KI-Undo und Forged-Activation-Orders am erzeugenden Service-/Datenvertrag korrigieren.

Done-Gate: die vier betroffenen Server-Testdateien grün.

Commit: `fix(server): restore account and AI service contracts`

### TFR-04: Web-Projektionen und Chronik

Ziel: Öffentliche Kartenmetadaten, Plan-Debugvertrag und auf den korrigierten Payload gestützte Cues/Chronik schließen.

Done-Gate: betroffene Web-Testdateien grün, ohne verdeckte Daten offenzulegen.

Commit: `fix(web): restore public card and chronicle projections`

### TFR-05: Integrationsgate und Abschluss

Ziel: alle Paketfehler gegen die vollständigen Gates validieren und den Arbeitsbranch sauber nach `main` integrieren.

Done-Gate: `pnpm test`, `pnpm test:ai:shards`, `git diff --check`; lokaler Merge, Worktree- und Branch-Cleanup verifiziert.

## Automatische Fehlerbehandlung

Ein fehlendes Datenfeld, eine Hash-Divergenz oder eine ungebundene KI-Entscheidung wird nicht durch Fallback verborgen. Der betroffene Pfad scheitert sichtbar; Ursache und Removal Condition werden im aktiven Paket dokumentiert.

## Arbeitsvertrag

Arbeitsworktree: `C:\Projekte\NETGRID_test-failure-repair-20260819`

Arbeitsbranch: `codex/test-failure-repair-20260819`

`/Goal Arbeite den Testfehler-Reparaturprozess vollständig und sequenziell von TFR-01 bis TFR-05 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die Wissensbasis, diese Activity und die für betroffene Pakete geltenden Anweisungen. Arbeite ausschließlich im genannten Worktree. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe es. Bei einem Sicherheitsblocker stoppe mit einem Blocker-Report samt Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, den sauberen Arbeitsworktree entfernen, dessen Entfernung in Git und im Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und Goal erst dann als complete markieren.`

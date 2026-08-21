# Testfehler-Reparaturprozess

Status: Bereit zur lokalen Integration – 2026-08-21

## Quelle

Neuer vollständiger Testlauf vom 2026-08-20. Frühere Reparaturen werden nicht als aktueller Befund vorausgesetzt; nur frisch reproduzierte Fehler gehören in diesen Lauf.

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

### TFR-01: Frische Fehlerreproduktion und Ursachenkarte

Ziel: Den vollständigen aktuellen Testbestand sowie die festen AI-Shards reproduzierbar ausführen, Fehler nach verantwortlicher Schicht bündeln und jeden Befund als Quellfehler, gültige Vertragsänderung oder Testinfrastrukturproblem klassifizieren.

Done-Gate: vollständige Fehlerliste mit Reproduktionsbefehl, betroffenen Dateien und Ursachenhypothese; kein ungeprüfter Altbefund.

Commit: `docs(activities): refresh test failure repair evidence`

### TFR-02: Ursachenorientierte Reparaturpakete

Ziel: Jeden frisch reproduzierten Fehlercluster sequenziell an seiner erzeugenden Schicht beheben. Paketgrenzen werden erst aus der Ursachenkarte bestimmt.

Done-Gate: je Cluster fokussierte Regression grün, `git diff --check` grün und eigener Commit.

Commit: pro Cluster fachlich präzise (`fix(...)` oder `test(...)`).

Erledigte Cluster:

- AI-Planfortsetzung und Checkpoint-Verträge: `e9604abf7`, `cc2550729`.
- Öffentliche Web-Projektionen, lokalisierte UI-Verträge und Katalogtext: `b3825673c`.
- Server-Undo, kuratierte Deck-Snapshots und Forged-Activation-Orders-Vertrag: `c6d5a64d5`.

### TFR-03: Integrationsgate und Abschluss

Ziel: alle Paketfehler gegen die vollständigen Gates validieren und den Arbeitsbranch sauber nach `main` integrieren.

Done-Gate: der zuvor fehlerhafte breite Testlauf und `corepack pnpm test:ai:shards` grün, passende Typechecks grün, `git diff --check` grün; lokaler Merge, Worktree- und Branch-Cleanup verifiziert.

Nachweis vor Main-Abgleich:

- `corepack pnpm test:ai:shards`: 519 Dateien, 4.502 Tests grün.
- `corepack pnpm test`: vollständig grün; darunter AI 4.502, Web 837, Server 233 Tests sowie Discovery und Root-Spezifikationen.
- `git diff --check`: grün.

Finaler Nachweis nach wiederholtem Main-Abgleich:

- `main` wurde zuletzt konfliktfrei bis `3ecc3b2dd` eingebunden; der dabei
  sichtbar gewordene Archives-Routenfehler ist mit `05829b742` an der
  erzeugenden Routenbindung behoben.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm test:ai:shards`: 526 Dateien, 4.522 Tests grün.
- `corepack pnpm test`: vollständig grün; darunter Shared 13, Cards 122,
  Catalog 25, Engine 1.988, Decks 25, Card Images 62, AI 4.522, Web 837,
  Server 233 und Root-/Discovery 8 Tests.
- `git diff --check`: grün.

## Automatische Fehlerbehandlung

Ein fehlendes Datenfeld, eine Hash-Divergenz oder eine ungebundene KI-Entscheidung wird nicht durch Fallback verborgen. Der betroffene Pfad scheitert sichtbar; Ursache und Removal Condition werden im aktiven Paket dokumentiert.

## Arbeitsvertrag

Arbeitsworktree: `C:\Projekte\NETGRID-worktrees\test-failure-repair-20260820`

Arbeitsbranch: `codex/test-failure-repair-20260820`

`/Goal Arbeite den Testfehler-Reparaturprozess vollständig und sequenziell von TFR-01 bis TFR-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die Wissensbasis, diese Activity und die für betroffene Pakete geltenden Anweisungen. Arbeite ausschließlich im genannten Worktree. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange die Ursachenkarte eine konservative Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe es. Bei einem Sicherheitsblocker stoppe mit einem Blocker-Report samt Removal Condition. Nach Abschluss: die fehlerauslösenden breiten Tests und direkt betroffene Checks erneut ausführen, lokal nach main mergen, main prüfen, den sauberen Arbeitsworktree entfernen, dessen Entfernung in Git und im Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und Goal erst dann als complete markieren.`

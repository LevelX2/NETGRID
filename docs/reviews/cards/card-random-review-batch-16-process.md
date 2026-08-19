# CardSpec-Zufallsreview Batch 16 – Abschlussprozess

Status: in Bearbeitung
Quelle: Nutzerbericht „NETGRID – CardSpec-Zufallsreview Batch 16: Abschluss-Findings“  
Ausgangsbranch: `main` auf `183d827a0`

## Zielprüfung

Der Abschlussbericht wird gegen den aktuellen CardSpec, die Originalquelle, die bestehenden Effective-Subtype-Verträge und die produktiven Engine-Consumer geprüft. Flak bleibt ohne bestätigten Befund unverändert. Bei Superior Net Barriers wird der bestätigte Regelbruch an der generischen Board-Subtype-Grenze behoben; es entsteht keine Karten-ID-Sonderbehandlung.

## Gesamtziel

`/Goal` Batch 16 als Abschluss der Zufallsreviews vollständig prüfen, den bestätigten Effective-Subtype-Fehler von Superior Net Barriers ursachenorientiert korrigieren, Text und Planning-Semantik quellentreu bereinigen, fokussiert verifizieren und den sauberen Arbeitsbranch lokal nach `main` integrieren.

## Annahmen und Nicht-Ziele

- Rezzed Alternate-Subtype-ICE verwenden ihren aktuell gewählten Subtyp; unrezzed ICE verwenden ihren gedruckten Subtyp.
- CardSpec-Annotationen erzeugen weder Legalität noch eine zweite Entscheidungsautorität.
- Der vorhandene Score- und Choice-Vertrag bleibt Owner der Score- und Reveal-Entscheidung.
- Keine neuen Karten-Sonderresolver, Fallbacks oder Kompatibilitätsadapter.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Board-Selektoren für Subtypen verwenden den gemeinsamen Effective-Subtype-Vertrag.
- Choice-Revalidierung prüft denselben aktuellen Zustand wie die ursprüngliche Candidate-Erzeugung.
- Hidden-Info-Redaktion, deterministisches Replay und StateHash bleiben unverändert.

## State Machine

`disposition -> effective_subtype_fix -> cardspec_cleanup -> verification -> main_integration -> cleanup -> complete`

Genau ein Paket ist aktiv. Jedes Paket endet mit fokussierter Prüfung, `git diff --check` und eigenem Commit.

## Paketfolge

### B16-01 – Disposition und Prozess

- Bericht gegen aktuellen Stand, Quelle, Engine-Verträge und Compiler prüfen.
- Flak als unverändert und Superior Net Barriers als bestätigten Fix dokumentieren.
- Commit: `docs(cards): plan batch 16 final review fixes`

### B16-02 – Effective-Subtype-Regel und Regressionstests

- Einen generischen instance-aware Modifier-Matcher ergänzen.
- Strength-Modifier und Score-Reveal-Economy auf aktuelle Subtypen umstellen.
- Rezzed Alternate-Subtype-ICE sowie unrezzed Printed-Subtype-ICE fokussiert testen.
- Commit: `fix(engine): honor effective ice subtypes for wall effects`

### B16-03 – CardSpec-Text und Planning

- `gain [1]` quellentreu normalisieren.
- Statische Economy-Wertung entfernen; typisierten Score-Effekt und capability-nahe Reveal-Präferenz als Owner erhalten.
- Generierte Hints aktualisieren und fokussiert prüfen.
- Commit: `fix(cards): align superior net barriers semantics`

### B16-04 – Abschluss und Integration

- Fokussierte Engine-, CardSpec- und Hint-Gates sowie betroffene Typechecks ausführen.
- Tatsächliche Disposition und Evidence dokumentieren.
- Branch defensiv mit `main` abgleichen, lokal integrieren, Worktree und Branch verifiziert entfernen.
- Commit: `docs(cards): record batch 16 verification`

## Verifikationsregeln

- Iterativ nur die betroffenen Engine- und CardSpec-Pfade prüfen.
- Gemeinsame Typoberflächen erhalten die betroffenen Paket-Typechecks.
- Kein vollständiger Workspace-, AI-Shard- oder E2E-Lauf ohne breitere Wirkung.
- Abschluss mindestens: fokussierte Engine-Regressionen, CardSpec-/Hint-Gates, `@netgrid/engine`- und `@netgrid/cards`-Typecheck sowie `git diff --check`.

## Worktree und Integration

- Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_16`
- Branch: `codex/card-random-batch-16`
- Hauptworkspace bleibt bis zur lokalen Integration unverändert.
- Vor Merge wird weitergelaufenes `main` defensiv integriert.
- Nach erfolgreichem Merge werden Worktree und Branch ohne Force entfernt und doppelt verifiziert.

## Abschlusskriterien

- Beide Abschlusskarten besitzen eine belegte Disposition.
- Der bestätigte Subtype-Fehler ist generisch und ohne Karten-ID-Sonderfall behoben.
- Text und Planning-Artefakt entsprechen Quelle und typisiertem Mechanikvertrag.
- Relevante Checks sind grün oder unabhängige Baseline-Blocker exakt dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert; Worktree und Branch sind verifiziert entfernt.

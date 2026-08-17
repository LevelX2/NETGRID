# CardSpec-Zufallsreview Batch 15 – Umsetzungsprozess

Status: in Bearbeitung
Quelle: Nutzerbericht „NETGRID – CardSpec-Zufallsreview Batch 15: Findings“, Stand 2026-08-17  
Ausgangsbranch: `main` auf `69ec609e9`

## Zielprüfung

Der Bericht wurde auf einem älteren Commit erstellt und wird deshalb nicht ungeprüft übernommen. Jeder Punkt wird gegen den aktuellen CardSpec, die Originalquelle, vorhandene generische Projektionen und den produktiven Hint-Compiler geprüft. Bereits generisch korrekt abgeleitete Semantik erhält keine redundante Handannotation; nicht entschiedene Regelinterpretationen werden nicht als stiller Runtime-Umbau umgesetzt.

## Gesamtziel

`/Goal` Batch 15 vollständig und sequenziell prüfen, alle auf dem aktuellen Stand bestätigten Text-, Projektions-, Rollen-, Risiko-, Strategie- und TargetProfile-Fehler ursachenorientiert korrigieren, fokussiert verifizieren und den sauberen Arbeitsbranch lokal nach `main` integrieren.

## Annahmen und Nicht-Ziele

- Der Bericht bestätigt keinen neuen Runtimefehler. Submarine Uplinks Verhältnis zwischen erzwungenem Jack-out und einem generischen Run-Ende bleibt ohne belastbare Projektentscheidung eine Vertragsklärung.
- CardSpec-Annotationen bleiben deklarativ und erzeugen weder Legalität noch eine zweite Entscheidungsautorität.
- Actor-private Information darf der zuständige Plan verwenden, wird aber nicht öffentlich projiziert.
- Neue Katalogbegriffe entstehen nur bei produktivem, wiederverwendbarem Consumerbedarf.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- TargetProfiles beschreiben nur echte Ziel-, Modus-, Mengen- oder Optionswahlen; fest gebundene Ziele erhalten kein künstliches Profil.
- Strategieanker bleiben echten Engines, Enablern, Payoffs, Schlüsselkarten oder Win Conditions vorbehalten.
- Choice-Resolver vervollständigen nur die Payload einer bereits gewählten und gebundenen Action.

## State Machine

`disposition -> canonical_text -> public_projection -> target_semantics -> roles_risks_strategy -> verification -> main_integration -> cleanup -> complete`

Genau ein Paket ist aktiv. Jedes Paket endet mit fokussierter Prüfung, `git diff --check` und eigenem Commit.

## Paketfolge

### B15-01 – Disposition und Prozess

- Bericht gegen aktuellen Stand, Quellen, Katalog und Compiler prüfen.
- Bestätigte, bereits generisch abgedeckte, zurückzustellende und abzulehnende Punkte trennen.
- Commit: `docs(cards): plan batch 15 review fixes`

### B15-02 – Kanonischer Kartentext

- Bestätigte Quellnotationen und Wortlautkorrekturen ohne Mechanikänderung übernehmen.
- Commit: `fix(cards): normalize batch 15 canonical text`

### B15-03 – Öffentliche Charakteristikprojektion

- Fehlende öffentliche Charakteristika nur dort ergänzen, wo Runtime-Modifier und Projektion getrennte Verträge sind.
- Doppelzählung durch fokussierte Tests ausschließen.
- Commit: `fix(cards): complete batch 15 public characteristics`

### B15-04 – Ziel-, Mengen- und actor-private Semantik

- Echte Einzel-, Mehrziel-, Mengen- und Modusentscheidungen mit vorhandenen typisierten Profilen präzisieren.
- Profile bei fest gebundenen Zielen entfernen; eigene Information zulassen, ohne sie zu leaken.
- Commit: `fix(cards): align batch 15 target semantics`

### B15-05 – Rollen, Risiken und Strategieanker

- Falsche Server-, Economy-, Damage-, Trace- und Strategiezuordnungen korrigieren.
- Bereits generisch abgedeckte Mechanik nicht manuell duplizieren.
- Commit: `fix(cards): refine batch 15 planning semantics`

### B15-06 – Abschluss und Integration

- Fokussierte Karten- und Hint-Tests, betroffene Typechecks und generierte-Hints-Gate ausführen.
- Tatsächliche Disposition und Evidence dokumentieren.
- Branch defensiv mit `main` abgleichen, lokal integrieren, Worktree und Branch verifiziert entfernen.
- Commit: `docs(cards): record batch 15 verification`

## Verifikationsregeln

- Iterativ nur fokussierte CardSpec-, Projektions- und Hint-Tests.
- Bei Typoberflächen oder gemeinsamen Katalogen: betroffene Paket-Typechecks und Struktur-/Hint-Gates.
- Kein vollständiger Workspace-, AI-Shard- oder E2E-Lauf ohne breitere Wirkung.
- Abschluss mindestens: fokussierte Tests, `@netgrid/cards`-Typecheck, relevante AI-Hint-Tests/Gates und `git diff --check`.

## Worktree und Integration

- Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_15`
- Branch: `codex/card-random-batch-15`
- Hauptworkspace bleibt bis zur lokalen Integration unverändert.
- Vor Merge wird weitergelaufenes `main` defensiv integriert.
- Nach erfolgreichem Merge werden Worktree und Branch ohne Force entfernt und doppelt verifiziert.

## Abschlusskriterien

- Alle 33 Findings besitzen eine belegte Disposition.
- Bestätigte Korrekturen sind im bestehenden CardSpec-/Compilervertrag umgesetzt.
- Zurückgestellte oder abgelehnte Punkte sind begründet.
- Relevante Checks sind grün oder unabhängige Baseline-Blocker sind exakt dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert; Worktree und Branch sind verifiziert entfernt.

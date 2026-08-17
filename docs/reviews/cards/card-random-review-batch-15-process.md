# CardSpec-Zufallsreview Batch 15 – Umsetzungsprozess

Status: umgesetzt und verifiziert; lokale Integration ausstehend
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

## Tatsächliche Disposition

### Umgesetzt

- **Submarine Uplink:** Offizielle Errata als Regelquelle ergänzt. Der bestehende Vertrag „Run nach dem aktuellen Encounter beenden“ bleibt bewusst erhalten; er ist kein Jack-out. Der Hint-Compiler projiziert den sicheren Verlust des restlichen Runpfads und Accesses.
- **Top Runners’ Conference:** `[2]` quellentreu normalisiert; das Ende der Economyquelle beim ersten Run wird generisch als Risiko projiziert.
- **Homing Missile:** X-Wahl capability-nah an Runner-Coverage, Tracewert, Serverrelevanz und Corp-Reserve gebunden.
- **Core Command: Jettison Ice:** echte Wahl eines sichtbaren gerezzten ICE mit Board-, Runpfad- und Reservenbewertung ergänzt.
- **Management Shake-Up / Systematic Layoffs:** Mehrziel- und Mengenverteilung an `corp.score_agenda` gebunden; Score-, Overadvance-, Ambush- und Reservenwert werden gemeinsam bewertet.
- **Corprunner’s Shattered Remains:** sichtbare Hardwareauswahl capability-nah nach Plan- und Schutzwert bewertet.
- **Zetatech Software Installer:** `[2]` und `overwriting` korrigiert; als Programminstallations-/Rig-Support statt allgemeiner Economy klassifiziert; actor-private Gripauswahl zugelassen.
- **Bioweapons Engineering:** der dauerhafte globale Damage-Amplifier ist nun konsistent formaler Anchor für `corp.damage_kill`.
- **Corolla Speed Chip / Parraline 5750 / Sunburst Cranial Interface:** breite Economy-Handannotation entfernt beziehungsweise durch Rig-Support ersetzt; die typisierten Restricted-Credit-Ziele bleiben alleinige Budgetautorität.
- **Nevinyrral:** wiederkehrende Corp-Aktionskapazität und die sofortige Lose-game-Liability werden generisch projiziert und redaktionell als hohes Risiko geführt.
- **Back Door to Rivals:** Trace-Bid-Support statt Economy-Recovery.
- **Glacier:** Corp-private Fort- und ICE-Information ist für die eigene Wahl zulässig; die bereits generische Agendapunkt-Rezkosten-Risikoabbildung bleibt erhalten.
- **Mystery Box:** probabilistische Top-five-Programminstallation capability-nah gebunden; Recovery- und direkter Breaker-Anchor entfernt, Whiff-Risiko ergänzt.
- **Political Coup / Grubb / Vapor Ops / Codecracker / Blink / Dogcatcher:** bestätigte Credit- und Aktionsnotationen quellentreu korrigiert.
- **Vapor Ops:** Counterquelle, Ziel und Menge an den Scoreplan gebunden.
- **Sunburst Cranial Interface / Omnitech “Spinal Tap” Cybermodem:** fehlende öffentliche MU-, Handgrößen- und Recurring-Credit-Charakteristika ergänzt, ohne Runtime-Doppelzählung.
- **Jack Attack:** falsche Scoring-Remote-Rolle durch serverunabhängige Defense ersetzt; Trace-/Tag-/Run-Lock-Vertrag bleibt führend.
- **Galatea:** einzelnes flexibles ETR von Glacier-Anchor zu Defense-/Glacier-Support zurückgestuft; Moduswahl nutzt sichtbare Runner-Coverage.
- **Death from Above:** falsche Corp-Schutzrichtung und künstliches TargetProfile entfernt; Remote-Root-Wipe als Successful-run-Access-Replacement generisch projiziert, nur `runner.remote_trash` bleibt Anchor.
- **Bulldozer:** Stealthverlust und kostenloser Break auf der nächsten Sentry werden aus dem Breakervertrag in Risiko, Signale und Runpfad-Effekt projiziert.
- **Power Grid Overload:** X und sichtbare Hardwareteilmenge capability-nah gekoppelt; Cybernetics-Ausschluss, Wert und Reserve fließen in dieselbe Entscheidung ein.
- **Demolition Run:** künstliche R&D-Bindung entfernt; Any-server-ICE-Sabotage und Access-Replacement sind führend.
- **Blink:** falsche Safe-Probe-Rolle entfernt; Zufallsfehlschlag und Net-Damage-Risiko generisch ergänzt. Gleichzeitig wurde der generische Fehler behoben, universelle Breaker automatisch als Self-Trash zu klassifizieren.
- **Dogcatcher:** Remote-Bindung entfernt; die mechanische Subtype-Coverage bleibt serverunabhängig.

### Bereits generisch korrekt, daher ohne redundante CardSpec-Handannotation

- **Shotgun Wire / Laser Wire:** der Compiler projiziert den konkreten Net-Damage-Typ sowie ETR bereits getrennt.
- **Zombie:** beide Brain-/Core-Damage-Subroutinen werden als getrennte Damageereignisse mit dauerhafter Damage-Semantik projiziert.
- **Cerberus:** Initial-Net-Damage, Trace, persistenter Counterdruck, Run-start-Net-Damage und ETR sind bereits einzeln typisiert und projiziert.
- **Restricted Credits allgemein:** erlaubte Zahlungsziele von Zetatech, Corolla, Parraline, Sunburst und Spinal Tap stammen weiterhin aus dem mechanischen Restricted-Credit-Vertrag, nicht aus freien Economy-Taktiksignalen.

### Bewusst nicht umgesetzt

- **Submarine Uplink als forced jack out:** abgelehnt. Die offizielle Errata ersetzt genau diesen ursprünglichen Wortlaut durch „ends your run after the current encounter“. Eine Umstellung auf Jack-out würde den aktuellen Regelstand verschlechtern und falsche Interaktionen mit `cannot_jack_out` erzeugen.
- **Neue kartenindividuelle Damage-/Economy-Taxonomien:** nicht angelegt, wenn die vorhandene mechanische Projektion den exakten Typ, Betrag, Zeitpunkt und Zahlungszweck bereits liefert.

## Verification Evidence

- `@netgrid/ai` fokussierter Generic-Typed-Translator-Test: **37/37 bestanden**.
- `@netgrid/cards` Registry-, Planning-, Validation- und Compatibility-Projections: **88/88 bestanden**.
- `@netgrid/cards` Typecheck: **bestanden**.
- `check:card-spec-ai-hints`: **bestanden**, generiertes Artefakt aktuell.
- `check:ai-hint-metadata-contracts`: **bestanden**, 0 Hard Errors.
- `git diff --check`: **bestanden**.
- `@netgrid/ai` Typecheck: **unabhängige bekannte Baselinefehler**, keine Batch-15-Regression: optionale `modifier.appliesToRunner`-Typstelle sowie vier im Repository fehlende historische `*-card-spec-migration-report.json`-Imports der Golden-Tests.

## Paketcommits

1. `b80bdd421` – `docs(cards): plan batch 15 review fixes`
2. `d9c3e3113` – `fix(cards): normalize batch 15 canonical text`
3. `46c1cf73f` – `fix(cards): complete batch 15 public characteristics`
4. `2bdaa0f38` – `fix(cards): align batch 15 target semantics`
5. `ff95deac8` – `fix(cards): refine batch 15 planning semantics`

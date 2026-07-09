# Runner Survival Defense Process

Status: in_progress

Quelle/Vorgabe: Analyse von `match_881a9288088533a3` und Nutzerfreigabe vom 2026-07-09.

## Gesamtziel

Die Runner-KI soll nach side-sicher sichtbarem Damage-Druck nicht dauerhaft in einen Anti-Damage-Modus fallen, aber bei akuter Flatline-Gefahr einen verbindlichen Survival-Defense-Plan über normale Central-Pressure-Pläne stellen.

## Annahmen

- Es wird nur aus Runner-PlayerView, PublicEvents, EventTail, LegalActions und bestehenden side-sicheren Semantikdaten bewertet.
- Damage-Druck wird dynamisch bewertet und klingt über nicht bestätigte Runner-Züge ab.
- Draw ist nur eine mögliche Survival-Aktion; Installation, Prevention, Recovery, Economy oder Expose können ebenfalls Planfortschritt sein.

## Nicht-Ziele

- Keine Engine-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.
- Keine kartenspezifische Sonderregel für `Setup!` oder `Razor Wire`.
- Keine pauschale Vorgabe, immer auf fünf Handkarten zu ziehen.
- Keine Änderung an Corp-KI oder Decklisten.

## Paketfolge

### Paket 1: Prozessartefakt

- Ziel, Grenzen, Worktree und Gates festhalten.
- Check: `git diff --check`.
- Commit: `docs(ai): plan runner survival defense process`.

### Paket 2: Damage-Threat-Assessment und Survival-Plan

- Zentralen side-sicheren Damage-Threat-Baustein bauen.
- `runner.survival_defense` als TacticalPlan ergänzen oder den bestehenden Handbuffer-Plan fachlich erweitern.
- Threat-Level: `none`, `suspected`, `confirmed`, `critical`.
- Decay: ohne neue Damage-Bestätigung fällt Druck stufenweise zurück.

### Paket 3: Arbitration und Regressionen

- Survival-Plan darf bei `critical` normale Pressure-Pläne brechen.
- Riskante Runs in unrezzed/unknown/damage-relevante Ziele werden unterdrückt, außer Closeout/Notfall-Ausnahme greift.
- Tests für das analysierte Muster und Nicht-Überreaktion ergänzen.

### Paket 4: Review, Checks und Integration

- Fokussierte Vitests laufen lassen.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- `git diff --check`.
- Paketcommits nach `main` lokal integrieren und Worktree entfernen, wenn sauber.

## Sicherheitsblocker

Stoppen, wenn die Lösung verdeckte Corp-Hand, Corp-R&D-Stack oder nicht side-sichere Kartenidentität bräuchte.

## Abschlusskriterien

- Bei leerer Runner-Hand, confirmed Damage und riskantem unrezzed/unknown Run-Ziel gewinnt Survival-Defense gegen normalen Central Run.
- Bei früher, sicherer R&D-Gelegenheit ohne Damage-Historie bleibt Pressure möglich.
- Nach Damage-Decay blockiert der Plan normales Spiel nicht dauerhaft.

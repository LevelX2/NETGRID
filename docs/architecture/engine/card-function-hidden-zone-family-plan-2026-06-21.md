# Card Function Hidden-Zone Family Plan - 2026-06-21

## Status

Folgeprozess geplant. Keine Code-Umsetzung in diesem Rest-Families-Prozess.

## Anlass

Der Card-Function-Abstraction-Review nach den Scored-Agenda-, Run-Start-Tax- und Counter-Prevention-Slices steht bei 199 Known-Findings. Die verbleibenden Hidden-Zone-Treffer bilden keine kleine reine Namensbereinigung, sondern berühren Hidden-Info-Barrieren, Choice-Projektion, PublicPayload-Verträge, Replay und UI-Auswertung.

Deshalb bleibt die Umsetzung außerhalb des aktuellen Prozesses. Der nächste Prozess soll mit eigenem Worktree, eigener Review-Baseline und Hidden-Info-Gates laufen.

## Kandidaten

| Karte | Aktueller Funktionsname | Zielabstraktion | Hauptbereich |
| --- | --- | --- | --- |
| Fortress Respecification | `fortress_respecification_ice_reorder` | `ice_reorder_hidden_zone_effect` | Runner Prep, Hidden-Zone Arrange |
| Social Engineering | `social_engineering_secret_guess_run` | `secret_guess_run_effect` | Runner Prep, Hidden-Zone Nonsearch/Run |
| New Blood | `new_blood_conceal_reorder_installed_ice` | `conceal_reorder_installed_ice` | Corp Operation, Hidden-Zone Arrange |
| Shell Traders | `shell_traders_delayed_install` | `delayed_install_sequence` | Runner Resource, delayed install sequence |

## Trennung vom aktuellen Prozess

Diese Familie ist nicht mit den bereits umgesetzten einfachen Card-Function-Familien gleichzusetzen:

- Scored-Agenda, Run-Start-Tax und Counter-Prevention hatten klar sichtbare öffentliche oder vollständig deterministische Runtime-Payloads.
- Hidden-Zone-Pfade entscheiden, welche Seite welche Kartenidentität, Reihenfolge, Auswahl und Zielinformation sehen darf.
- Ein rein mechanischer Rename kann unbeabsichtigt private Choice-Details, PublicPayload-Felder oder UI-Erkennungspfade verändern.

## Zielzustand

Der Folgeprozess soll Kartennamen aus funktionalen Hidden-Zone-Kinds, Runtime-Helpern und Payload-Markern entfernen, ohne die Side-Sichtbarkeit zu verändern.

Verbindliche Zielregeln:

- CardDefinitionIds und Kartentitel bleiben in CardImplementation-, Registry-, Test- und Katalogkontexten erlaubt.
- PublicPayloads dürfen keine zusätzliche verdeckte Kartenidentität, Reihenfolge oder Wahloption enthalten.
- Private Choice-Payloads bleiben auf die jeweils berechtigte Seite begrenzt.
- Replay und StateHash bleiben deterministisch.
- UI-Kompatibilität wird bewusst geprüft, bevor Legacy-Payloadfelder entfernt werden.

## Empfohlene Paketfolge

### HZ1 - Readiness Audit

- Review-Findings für Fortress Respecification, Social Engineering, New Blood und Shell Traders aus JSON extrahieren.
- Alle betroffenen Handler, Resolver, PublicContext- und Web-Consumer erfassen.
- Bestehende Hidden-Info- und Replay-Tests den vier Familien zuordnen.
- Done-Gate: Matrix aus Codepfad, Payloadfeld, Sichtbarkeit, Testschutz und Zielabstraktion.

### HZ2 - Fortress Respecification / New Blood Arrange-Familie

- Gemeinsame Arrange-Abstraktion für Ice-Reorder- und Conceal-Reorder-Effekte definieren.
- `hiddenZoneAction`- und Choice-Source-Felder nur nach Sichtbarkeitsprüfung neutralisieren.
- Tests: `game/hidden-zone/arrange-choice-handlers.test.ts`, relevante Hidden-Info- und Replay-Tests.

### HZ3 - Social Engineering Secret-Guess-Familie

- Secret-Guess-Run-Effect als generische Run-/Choice-Familie modellieren.
- Sicherstellen, dass geratenes Secret, tatsächliche verdeckte Information und öffentlich sichtbare Auswertung getrennt bleiben.
- Tests: `game/hidden-zone/nonsearch-choice-handlers.test.ts`, Hidden-Info-Tests, PublicPayload-Golden-Tests.

### HZ4 - Shell Traders Delayed-Install-Familie

- Delayed-Install-Sequenz neutralisieren und prüfen, ob bestehende `shell_traders`-Marker UI- oder Replay-Kompatibilität tragen.
- PublicPayload- und PendingChoice-Verträge vor Feldentfernung dokumentieren.
- Tests: Resource-/Install-Sequenz-Tests, Replay, UI-Verbraucher falls betroffen.

### HZ5 - Guard Kalibrierung

- `scripts/check-card-name-leakage-in-runtime.mjs` nur nach bestätigter Umsetzung je Familie aktualisieren.
- Guard-Bericht neu schreiben und Restfindings nach `allowed_catalog_reference`, `test_only_card_name`, `mechanics_constant_controls_behavior_by_card_id` und echten Folgefamilien trennen.

## Blocker und Abbruchkriterien

Stoppen, wenn:

- ein Rename die Sichtbarkeit einer Choice oder eines PublicEvents verändert;
- ein Web-Consumer weiter ein Legacy-Feld zwingend braucht und kein Kompatibilitätsplan existiert;
- Replay oder StateHash von verdeckter Reihenfolge oder privaten Choices abhängig wird;
- eine Familie mehr als eine Hidden-Zone-Unterdomäne gleichzeitig umbaut.

## Empfohlene Startchecks

- `corepack pnpm check:card-function-abstraction`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/hidden-zone/arrange-choice-handlers.test.ts src/game/hidden-zone/nonsearch-choice-handlers.test.ts`
- Hidden-Info-/Replay-Tests nach Readiness-Matrix, nicht pauschal blind.

## Ergebnis

Die Hidden-Zone-Familie ist als separater, risikogerechter Folgeprozess geschnitten. Der aktuelle Rest-Families-Prozess darf mit Guard-Kalibrierung und finaler Integration fortgesetzt werden, ohne Hidden-Zone-Codepfade anzufassen.

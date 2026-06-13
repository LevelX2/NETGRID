# AI-ADV-WITNESS-1 Advancement Witness Classifier Prozess

Status: in Umsetzung

Quelle/Vorgabe: GitHub-Rückmeldung zum abgeschlossenen `AI-ADV-NET-1` Net-Value Comparator. Der nächste Qualitätsgewinn soll nicht über weitere Gewichtsanpassungen entstehen, sondern über präzisere Advancement-Zielklassen und robuste Witnesses.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Der primäre Scope ist die Stabilisierung der Zielklassifizierung im bestehenden Comparator. Die Umsetzung bleibt kompakt und nutzt die vorhandenen Pfade in `packages/ai/src/index.ts`, `packages/ai/src/legacy/corp-plans.ts` und `packages/ai/src/index.test.ts`.

## Gesamtziel

Advancement-Ziele werden nicht mehr nur grob über Kartentyp und Textregex bewertet. Stattdessen liefert ein kleiner Classifier pro Ziel `targetClass`, `witness`, `baseValue`, `windowValue`, `weakTargetPenalty` und Evidence. Ambush-, Cashout-, Bank-, Transfer- und Overadvance-Ziele sollen unterscheidbar sein, damit der Net-Value Comparator seine Entscheidungen fachlich sauberer begründen kann.

## Annahmen

- Bestehende Net-Value-Formel bleibt erhalten und wird nur mit besseren Zielsignalen gefüttert.
- Der Scope bleibt auf bereits AI-supported / im Testkontext verfügbare Originalset-Ziele begrenzt.
- Proteus-Beispiele bleiben Folgearbeit, solange sie nicht im aktuellen AI-Testkontext gebraucht werden.
- Keine Engine-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.

## Nicht-Ziele

- Keine generische Profilierung aller Advancement-Operationen (`AI-ADV-DISTRIBUTION-1`).
- Keine vollständige Sequenzsuche für mehrzügige Scorefenster (`AI-ADV-SEQUENCE-1`).
- Keine Extraktion in ein neues Modul (`AI-ADV-MODULE-1`).
- Kein GitHub-Push und kein Pull Request.

## Controller-Invarianten

- KI bewertet ausschließlich vorhandene `LegalActions`.
- Keine neuen legalen Aktionen oder Engine-Regeln entstehen im AI-Pfad.
- Debug-Evidence bleibt side-safe und darf keine privaten Kartendaten leaken.
- Bestehende Basic-Advance-Dominanz und Net-Value-Regressionen bleiben grün.

## Automatische Fehlerbehandlung

- Bei unklarer Zielklasse wird konservativ `unknown_advanceable` oder `low_value_decoy` genutzt.
- Bei mehrdeutigen Textmustern gewinnt die spezifischere Klasse vor generischer Cashout-/Bank-Erkennung.
- Rote Tests werden im aktuellen Paket eng debuggt; keine Scope-Erweiterung auf Distribution oder Modul-Extraktion.

## Sicherheitsblocker

- Änderung müsste auf versteckte Runner-Informationen zugreifen.
- Änderung würde Engine-Regeln oder LegalAction-Erzeugung verändern.
- Debug-Evidence würde private Kartendaten aus HQ/R&D/Archives offenlegen.

## State Machine

`process_planned -> classifier_implemented -> regression_tests -> integration_preflight -> merged_main -> complete`

## Paketfolge

1. `AI-ADV-WITNESS-1A`: Prozessartefakt und Scope sichern.
2. `AI-ADV-WITNESS-1B`: Zielklassen und Witness-Classifier in Runtime und Legacy einbauen.
3. `AI-ADV-WITNESS-1C`: Regressionen für Overadvance, Cashout, Ambush und Transfer-/Bank-Fälle ergänzen.
4. `AI-ADV-WITNESS-1D`: Finale Verifikation, Main-Integration und Worktree-Aufräumen.

## Paketdetails

### AI-ADV-WITNESS-1A Prozessartefakt

Ziel: Scope, Invarianten, Nicht-Ziele und Paketfolge versionieren.

Kernartefakt:

- `docs/architecture/ai/ai-advancement-witness-classifier-process-2026-06-13.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozessartefakt ist versioniert.

Commit:

- `docs: plan advancement witness classifier`

### AI-ADV-WITNESS-1B Classifier

Ziel: Zielklassifizierung im vorhandenen Comparator präzisieren.

Arbeit:

- `targetClass` in beide Assessment-Typen aufnehmen.
- Ambush-Witnesses von Overadvance trennen.
- Cashout-Erkennung für `Gain [n]` und `per advancement counter` robuster machen.
- `Vapor Ops` als `counter_transfer_source` markieren, wenn ein anderes sichtbares wertvolles Ziel existiert, sonst als schwache Bank/Cashout-Quelle.
- Evidence um `advancement_target_class:*` ergänzen.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/legacy/corp-plans.ts`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Typecheck grün.
- Vorhandene Advancement-Regressionen bleiben grün.

Commit:

- `fix(ai): classify advancement target witnesses`

### AI-ADV-WITNESS-1C Regressionen

Ziel: Die in der Rückmeldung genannten Zielklassen testbar absichern.

Akzeptanzfälle:

- `Project Babylon` -> `agenda_overadvance_threshold`.
- `Information Laundering` -> `counter_cashout_credit`.
- `Vapor Ops` ohne wertvolles Ziel -> schwache Bank/Cashout-Quelle.
- `Vapor Ops` mit sichtbarem wertvollem Ziel -> `counter_transfer_source` / `transfer_destination_visible`.
- `Vacant Soulkiller` -> `access_brain_damage_ambush`.
- `Virus Test Site` -> `access_net_damage_ambush`.
- `Experimental AI` -> `access_program_trash_ambush`.
- `Corprunner's Shattered Remains` -> `access_hardware_trash_ambush`.

Kernartefakt:

- `packages/ai/src/index.test.ts`

Checks:

- Fokussierter Vitest-Lauf für Advancement-Witness-Tests.
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:

- Alle neuen und bestehenden `@netgrid/ai`-Tests grün.

Commit:

- `test(ai): cover advancement witness classes`

### AI-ADV-WITNESS-1D Integration

Ziel: Arbeitsbranch sauber nach lokalem `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:

- Arbeitsbranch ist sauber.
- Lokaler `main` enthält die Paketcommits.
- Worktree ist entfernt.

## Verifikationsregeln

Vor Merge müssen Typecheck, vollständige AI-Tests, Formatcheck und `git diff --check` grün sein. Fokussierte Tests dürfen während der Umsetzung verwendet werden.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ADV_WITNESS_CLASSIFIER`
- Branch: `codex/ai-adv-witness-classifier`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge verwenden.

## Controller-Prompt-Kern

`/Goal Arbeite den AI-ADV-WITNESS-1 Advancement Witness Classifier vollständig und sequenziell von AI-ADV-WITNESS-1A bis AI-ADV-WITNESS-1D ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ADV_WITNESS_CLASSIFIER auf Branch codex/ai-adv-witness-classifier. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe ohne Rückfrage und schreibe einen Blocker-Report mit Removal Condition. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- Zielklassen sind in Runtime- und Legacy-Pfad verfügbar.
- Ambush, Cashout, Transfer/Bank und Overadvance werden nicht mehr als derselbe Witness behandelt.
- Regressionen decken die wichtigsten Originalset-Ziele ab.
- Lokaler `main` enthält die abgeschlossene Arbeit.

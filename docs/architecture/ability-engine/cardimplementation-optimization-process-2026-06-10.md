# CardImplementation Optimization Process 2026-06-10

Status: in Umsetzung

## Quelle/Vorgabe

Ausgangspunkt ist der Nutzerauftrag vom 2026-06-10 zur Verarbeitung der zuvor erkannten Optimierungsblöcke für `packages/engine/src/card-implementations/**`. Der Prozess folgt dem Skill `paketprozess-worktree-goal` und wird direkt in diesem Chat umgesetzt.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung.

- Gesamtziel: wiederkehrende CardImplementation-Muster wartbarer machen, ohne Engine-Regeln oder öffentliche Verträge zu ändern.
- Sequenz: Audit und Prozessfixierung, danach kleine typisierte Helper, danach nur risikoarme Longtail-Reduktionen.
- In Scope: Engine-CardImplementation-Definitionen, lokale Helper in `packages/engine/src/card-implementations/**`, fokussierte Tests und Architekturartefakt.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine `applyAction`-Änderung, keine Replay-/StateHash-/Randomness-Änderung, keine Hidden-Info-Ausweitung.
- Abnahme: Typecheck und fokussierte Engine-Tests bleiben grün; `git diff --check` ist je Paket grün; jedes abgeschlossene Paket bekommt einen Commit.

## Gesamtziel

Die CardImplementation-Schicht soll gleiche Mechanismen konsistenter ausdrücken: Karten mit identischem Definition-Muster nutzen kleine, typisierte Definition-Helper oder dokumentierte Pattern-Entscheidungen. Kartenbenannte `kind`-Longtails werden klassifiziert; nur eindeutig risikoarme Fälle werden in diesem Prozess in Code reduziert.

## Annahmen

- Reine Definition-Helper dürfen Objektliteral-Duplikation ersetzen, solange sie dieselben Felder erzeugen.
- Helper erzeugen keine neue Runtime-Logik und keine neuen Semantik-Claims.
- Longtails mit Hidden-Zone-, Replacement-, Randomness-, Debt-, Lose-Game-, Agenda-Score- oder Run-Replacement-Auswirkung werden nicht beiläufig umgebaut.
- Wenn eine fachlich sinnvolle Abstraktion einen neuen Runtime-Kind oder neue Choice-/Payload-Logik verlangt, wird sie dokumentiert statt im selben Paket erzwungen.

## Nicht-Ziele

- Keine breite Factory für formale Kategorien wie "Runner Prep", "Corp Operation", "Ambush", "Virus" oder "Agenda".
- Keine Änderung an Kartentexten, Kartendaten, Manifesten oder Decklegalität.
- Keine KI-Aktivierung und keine produktive Action-Auswahl-Änderung.
- Keine UI-, Server- oder Storage-Änderung.
- Kein Push und keine Pull-Request-Erstellung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- `main` wird nur für den finalen lokalen Merge genutzt.
- Paketcommits enthalten nur zum Paket gehörige Änderungen.

## Automatische Fehlerbehandlung

- Bei TypeScript- oder Testfehlern wird eng im aktuellen Paket debuggt.
- Bei fachlichem Risiko wird ein Blocker oder Follow-up dokumentiert, nicht still ein größerer Resolver gebaut.
- Bei Mergekonflikten werden beide fachlichen Intentionen gelesen und, wenn kompatibel, zusammengeführt.

## Sicherheitsblocker

- Änderung an `applyAction`, Engine-Legalitätsvalidierung oder LegalAction-Schema.
- Änderung an Hidden-Info-Redaction, PublicEvent-/WebSocket-Payloads oder Reconnect-Payloads.
- Änderung an Randomness, StateHash oder Replay-Rekonstruktion.
- Neue kartenbenannte `kind`s ohne dokumentierten Sonderfallgrund.
- Refaktor, der bestehende Tests nur durch Anpassung der Erwartung statt durch Verhaltenserhalt grün macht.

## State Machine

`preflight` -> `package_1_audit` -> `package_2_definition_helpers` -> `package_3_longtail_reduction` -> `final_verify` -> `merge_main` -> `complete`

## Paketfolge

### Paket 1: Longtail- und Pattern-Audit

Ziel: konkrete Codebasis gegen die Optimierungsblöcke prüfen und das Umsetzungsscope fixieren.

Konkrete Arbeit:

- kartenbenannte und einzelmechanische `kind`s in `definition-types.ts` und CardImplementation-Dateien inventarisieren;
- vorhandene wiederverwendbare Helper/Definition-Muster identifizieren;
- entscheiden, welche Blöcke in diesem Prozess Code-Scope sind und welche Follow-up bleiben;
- Review-/Audit-Artefakt unter `docs/architecture/ability-engine/` schreiben.

Kernartefakte:

- `docs/architecture/ability-engine/cardimplementation-longtail-audit-2026-06-10.md`

Checks:

- `git diff --check`

Done-Gate:

- Audit klassifiziert mindestens: Basic Icebreaker, printed ICE subroutines, Trace->Tag, recurring/hosted credits, credit banks, Search/Install, Trash Replacement, Move/Uninstall, Successful-Run-Followups und Agenda-Longtails.
- Code-Scope und Follow-ups sind getrennt.

Commit-Message:

`docs(engine): audit cardimplementation optimization blocks`

### Paket 2: Risikoarme Definition-Helper

Ziel: wiederkehrende Objektliteral-Muster über kleine Helper ausdrücken, ohne Runtime-Verhalten zu ändern.

Konkrete Arbeit:

- lokale Helper für Basis-Icebreaker und gedruckte ICE-Subroutine-Fragmente einführen, falls noch nicht vorhanden;
- ausgewählte identische Karten auf diese Helper migrieren;
- fokussierte Tests/Typecheck ausführen.

Kernartefakte:

- `packages/engine/src/card-implementations/**`

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- fokussierte Engine-Tests für die migrierten Karten, sofern sinnvoll selektierbar
- `git diff --check`

Done-Gate:

- Migrierte Karten erzeugen dieselben Definition-Daten.
- Keine Runtime-Dateien außerhalb der CardImplementation-Definitionsebene werden geändert, außer ein bestehender Typ verlangt reine Export-/Import-Anpassungen.

Commit-Message:

`refactor(engine): add low-risk cardimplementation helpers`

### Paket 3: Longtail-Reduktion ohne Vertragsänderung

Ziel: einfache kartenbenannte oder unnötig spezielle Definitionen reduzieren, aber nur dort, wo bestehende Runtime-Felder bereits generisch genug sind.

Konkrete Arbeit:

- Trace->Tag-Helper oder einfache on-play-Utility-Helper einführen, wenn bestehende `CardEffect`-Strukturen genügen;
- Longtails wie Microtech, Move/Uninstall, Successful-Run-Followups oder Agenda-Score nur dokumentieren, falls sie neue Runtime-Kinds oder Choice-/Payload-Logik bräuchten;
- Audit mit Ergebnisstatus aktualisieren.

Kernartefakte:

- `packages/engine/src/card-implementations/**`
- `docs/architecture/ability-engine/cardimplementation-longtail-audit-2026-06-10.md`

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- fokussierte Engine-Tests für betroffene Karten
- `git diff --check`

Done-Gate:

- Keine neue Regelwirkung.
- Keine Hidden-Info-, LegalAction-, Replay-, StateHash- oder Randomness-Änderung.
- Nicht umgesetzte sinnvolle Blöcke sind als Follow-up mit Removal Condition dokumentiert.

Commit-Message:

`refactor(engine): reduce simple cardimplementation longtails`

## Verifikationsregeln

Je Paket mindestens:

- `git diff --check`

Für Codepakete zusätzlich:

- `corepack pnpm --filter @netgrid/engine typecheck`
- fokussierte Vitest-Läufe, soweit die betroffenen Karten testseitig sinnvoll adressierbar sind

Final zusätzlich:

- `corepack pnpm --filter @netgrid/engine test`
- `git status --short`

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CARDIMPLEMENTATION_OPTIMIZATION`
- Arbeitsbranch: `codex/cardimplementation-optimization`
- Integrationsbranch: `main`
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge benutzt.
- Nach jedem Paket werden nur paketzugehörige Änderungen gestaged und committed.
- Nach Abschluss wird der Arbeitsbranch lokal nach `main` gemerged; danach wird der Arbeits-Worktree entfernt.

## Controller-Prompt-Kern

`/Goal Arbeite den CardImplementation Optimization Process 2026-06-10 vollständig und sequenziell von Paket 1 bis Paket 3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die Pflicht-Wissensseiten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARDIMPLEMENTATION_OPTIMIZATION auf Branch codex/cardimplementation-optimization. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe, schreibe einen Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Prozessartefakt und Audit existieren.
- Alle abgeschlossenen Codeänderungen sind paketweise committed.
- Finaler Engine-Testlauf wurde ausgeführt oder ein Blocker dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree wurde entfernt.

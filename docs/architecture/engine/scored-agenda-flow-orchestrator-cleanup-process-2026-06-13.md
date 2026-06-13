# Scored Agenda Flow Orchestrator Cleanup Process

Status: completed

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-13 auf Basis des Prüfbefunds zu Commit `39c6d6cf070e12e46180c98523775228e8b5e8e6`.

## Zielprüfung

Die Vorgabe ist für direkte automatische Abarbeitung ausreichend präzise. Gesamtziel, Paketfolge, In-Scope-Dateibereiche, Nicht-Ziele, Akzeptanzkriterien und Verifikationsrichtung sind bestimmt. Kleine Implementierungsdetails werden konservativ aus dem bestehenden Engine-Code und den vorhandenen Registry-/Surface-Verträgen abgeleitet.

## Gesamtziel

`scored-agenda-flow.ts` wird weiter zum Orchestrator reduziert. Score-Time-Starts und direkte Score-Effekte laufen über Registry- oder Fachmodule, Choice-Resolution läuft über eine eigene Flow-Choice-Registry, `SequenceResolution` wird in den bestehenden Scored-Agenda-Sequenzen breiter als zentrale Payload-Patch-Grenze genutzt, und `SurfacePolicy` wird an weiteren echten Sichtgrenzen sichtbar angebunden.

## Annahmen

- Der Arbeitsbranch ist `codex/engine-scored-agenda-flow-orchestrator-cleanup`.
- Der Worktree ist `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_FLOW_ORCHESTRATOR_CLEANUP`.
- `main` bleibt der lokale Integrationsbranch.
- Bestehendes Gameplay-Verhalten bleibt erhalten; Struktur wird verändert, nicht Kartenwirkung erweitert.
- Keine neue KI-Wirkung, keine LegalAction-Erzeugung außerhalb der Engine und keine Pavit-Bharat-Produktivfreischaltung.

## Nicht-Ziele

- Kein Run-/Encounter-Special-Window-Framework.
- Kein generischer On-Rez-Sequencer für Pavit Bharat.
- Keine produktive KI-/Semantik-/Planner-Änderung.
- Keine breiten Rename-Wellen kartennaher Module ohne zweite echte Wiederverwendung.
- Keine großen Review- oder AI-Report-Artefakte.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Sequenzmodule resolven und validieren nur bereits erzeugte `LegalActions`.
- Öffentliche, opponent- und replayfähige Payloads dürfen keine Hidden-Card-Listen oder actor-private Labels enthalten.
- Stale Choices, falsche Seite, falsches Timing und illegal gewordene Ziele bleiben blockiert.
- Determinismus, Replay- und StateHash-Verträge werden nicht aufgeweicht.

## Automatische Fehlerbehandlung

Bei roten Tests wird eng am verursachenden Paket debuggt. Es wird kein Folgepaket begonnen, solange das Done-Gate des aktuellen Pakets nicht erfüllt ist. Fachliche Sicherheitsblocker werden dokumentiert und stoppen den Prozess ohne Workaround.

## Paketfolge

- P0: Prozessartefakt und Worktree-Basis.
- P1: `ScoredAgendaScoreTimeResolver` um `mode` erweitern und Tests aktualisieren.
- P2: Subtype-Reveal-Economy vollständig an Score-Time-Registry anschließen.
- P3: Corporate Downsizing an Score-Time-Registry anschließen.
- P4: Security Net Optimization in ein Modul verschieben und registrieren.
- P5: `gain_credits_on_score` und `add_counters_on_score` als generische direkte Score-Effekte auslagern.
- P6: Project Babylon, Project Venice und Project Zurich Overadvance in ein Overadvance-Modul verschieben.
- P7: `handleScoredAgendaFlowChoice` auf eine Flow-Choice-Resolver-Registry umstellen.
- P8: `SequenceResolution` bei Data Fort Reclamation, Security Purge, Priority Requisition und Ice Transmutation breiter einsetzen.
- P9: `SurfacePolicy` in ChoiceView und Replay/PublicEvent-Grenzen erweitern.
- P10: Contract-Matrix auf Score-Time- und Flow-Choice-Resolver ausdehnen; finaler Testblock.

## Verifikationsregeln

Je Paket mindestens:

- zielgerichtete Engine-Tests für betroffene Dateien,
- `git diff --check`,
- Paketcommit mit klarer Message.

Final:

- `corepack pnpm --filter @netgrid/engine typecheck`
- gezielte Engine-Testmatrix für Scored-Agenda, View und Replay-Grenzen
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

## Abschlusskriterien

- `scored-agenda-flow.ts` enthält keine verbleibenden direkten Score-Time-Fallback-Branches für die bearbeiteten Mechaniken.
- Direkt resolvbare Score-Effekte liegen in Fachmodulen oder registrierten Resolvern.
- Flow-Choice-Resolution läuft über eine Registry.
- `SurfacePolicy` ist an echten öffentlichen/opponent/replayfähigen Sichtgrenzen sichtbar.
- Alle Paket- und Finalchecks sind grün oder bekannte, nicht verursachte Warnungen sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` integriert und der Prozess-Worktree entfernt.

## Abschlussstand

P0 bis P10 sind umgesetzt. Im finalen Testblock wurde ein verursachter TypeScript-Fehler durch den fehlenden `ServerId`-Import in `scored-agenda-flow.ts` behoben. Danach waren Engine-Typecheck, die gezielte Scored-Agenda-/View-/Replay-Testmatrix, Formatcheck und `git diff --check` grün. `check:ai` meldete keine Fehler; die bestehenden AI-Warnungen bleiben unverändert außerhalb dieses Engine-Refactor-Scopes.

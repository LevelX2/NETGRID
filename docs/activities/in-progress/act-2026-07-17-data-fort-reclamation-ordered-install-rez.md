---
activityId: act-2026-07-17-data-fort-reclamation-ordered-install-rez
status: in_progress
kind: implementation
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
branch: codex/data-fort-reclamation-sequence
worktree: C:\\Projekte\\NETGRID-worktrees\\data-fort-reclamation-sequence
releaseTarget: Current State
blockedBy: []
---

# Data Fort Reclamation: geordnete Einzelkarten-Install-/Rez-Sequenz

## Status

`in_progress`

## Quelle / Vorgabe

Der Spieltest hat bestätigt, dass `Data Fort Reclamation` derzeit alle
gewählten Karten installiert und normale optionale Rezzes erst anschließend
in einer Sammelauswahl abfragt. Der Kartentext fordert dagegen: Karten einzeln
installieren und jede beim Installieren optional rezzen.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise genug. Kartentext,
aktuelle Runtime-Grenze, vorhandener Choice-Dialog und die wesentlichen
Sicherheitsinvarianten sind bestimmt.

## Gesamtziel

`Data Fort Reclamation` lässt die Korp bis zu vier HQ-Karten in verbindlicher
Auswahlreihenfolge wählen, erstellt bei nicht leerer Auswahl ein neues Data
Fort und löst jede Karte in dieser Reihenfolge vollständig auf: installieren,
Pflicht-Rez-on-install falls erforderlich, ansonsten individuelles optionales
Rez-Fenster, dann die nächste Karte. Der separate 10-Credit-Effektpool gilt
nur innerhalb dieser Folge und ungenutzte Credits werden am Ende zurückgegeben.

## Annahmen

- Die Klickreihenfolge im bestehenden Kartenwahlfenster ist die
  Installationsreihenfolge; die UI zeigt dafür Badges `1` bis `4`.
- Das individuelle Rez-Fenster ist eine Korp-private, aus `LegalActions`
  abgeleitete Entscheidung mit klaren Optionen für Rez und Überspringen.
- Der Effectpool wird nicht als allgemeiner Korp-Creditpool sichtbar oder
  außerhalb der Sequenz nutzbar.
- Keine neue Kartenfreischaltung, Deck-/Formatregel oder KI-Strategie wird
  eingeführt. Die KI muss die neuen legalen Einzelentscheidungen weiterhin
  sicher bedienen können.

## Nicht-Ziele

- Kein allgemeiner Umbau aller Install-/Rez-Folgen.
- Kein Redesign des Kartenwahlfensters.
- Keine Änderung des Kartenpools oder der Kartengrafik.
- Keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität; UI und KI reichen nur
  `PlayerActions` aus `LegalActions` ein.
- Jeder Folgeschritt validiert Side, Choice-ID, `stateVersion`, gescorte
  Agenda, aktuelle Karte, Fortkapazität und Zahlung erneut.
- HQ-Identitäten und verbleibende private Auswahl bleiben in PlayerView,
  PublicEvents, WebSocket-Payloads, Replays und Fehlermeldungen verborgen.
- Jeder erfolgreiche Schritt ist deterministisch und StateHash-/Replay-stabil.
- Regionen und sonstige Pflicht-Rez-on-install-Effekte werden im jeweiligen
  Kartenschritt vor dem Fortschreiten der Sequenz behandelt.
- Die Folge verbraucht keine zusätzlichen Aktionen.

## Automatische Fehlerbehandlung

- Eine ungültige oder stale Choice wird ohne Teilmutation abgelehnt.
- Kann eine ausgewählte Karte beim statischen Vorabcheck nicht regelkonform
  in das neue Fort passen, wird die ursprüngliche Auswahl abgelehnt.
- Kann eine Karte nicht optional gerezzt werden, entfällt nur ihr Rez-Fenster;
  die Installationsfolge läuft regelkonform weiter.
- Ein Sicherheits-, Hidden-Info- oder Replay-Fehler stoppt den Prozess mit
  dokumentierter Removal Condition.

## State Machine

```text
select_hq_cards
  -> return_unused_credits -> complete                 (leere Auswahl)
  -> create_remote -> install_card[index]
  -> required_rez_on_install / optional_rez_decision
  -> install_card[index + 1] | return_unused_credits
  -> complete
```

## Paketfolge

### DFR-01 – Prozessgrundlage und Arbeitsumgebung

- Ziel: Prozessartefakt, Worktree, Branch und Abnahmekriterien verbindlich
  festhalten.
- Kernartefakt: diese Activity.
- Done-Gate: sauberer Worktree auf `codex/data-fort-reclamation-sequence`;
  vollständige Paket- und Prüfdefinition.
- Commit: `docs(process): define Data Fort Reclamation sequence packages`

### DFR-02 – Engine-Sequenz und Regelvertrag

- Ziel: Sammel-Rez durch persistente Einzelkarten-Install-/Rez-Folge ersetzen.
- Kernartefakte:
  - `packages/engine/src/game/corp/scored-agenda/hq-to-new-remote-install-rez-sequence.ts`
  - zugehörige Ability-Definitionen und State-/Choice-Verträge nur soweit
    erforderlich
  - Engine-Tests für Reihenfolge, Pflicht-/Optional-Rez, Kosten, Stale/Side,
    Hidden Info und Replay/StateHash
- Done-Gate: jede Karte durchläuft Install und gegebenenfalls ihr eigenes
  Rez-Fenster; der alte Batch-Rez-Pfad ist für diese Agenda entfernt.
- Commit: `fix(engine): sequence Data Fort Reclamation installs and rezzes`

### DFR-03 – Auswahlreihenfolge und Spieloberfläche

- Ziel: Die vorhandene private Kartenwahl zeigt für Data Fort Reclamation die
  verbindliche Auswahlreihenfolge `1` bis `4`; einzelne Rez-Entscheidungen
  sind verständlich und zeigen den verbleibenden Effektpool.
- Kernartefakte:
  - `apps/web/features/actions/CardChoicePanel.tsx`
  - `apps/web/app/action-board-ui.ts`
  - passende Web-Tests
- Done-Gate: Kein UI-Vertrag bestimmt Regeln; die UI stellt lediglich die
  Engine-Choice sichtbar, zugänglich und in richtiger Reihenfolge dar.
- Commit: `feat(web): show ordered Data Fort Reclamation sequence`

### DFR-04 – Regeltext, Regression und Abschlussdokumentation

- Ziel: Der sichtbare technische Regeltext beschreibt keine überholte
  Deferred-Implementierung; Regressionen und die erkannte MVP-Grenze sind
  aktualisiert dokumentiert.
- Kernartefakte:
  - `packages/shared/src/card-definitions.ts`
  - betroffene Engine-/Web-Regressionstests
  - dieses Activity-Ergebnis
- Done-Gate: Kartentext, Runtime und Tests stimmen überein; alle relevanten
  Prüfungen sind dokumentiert.
- Commit: `docs(cards): align Data Fort Reclamation rule contract`

## Verifikationsregeln

- Je Paket: passende fokussierte Vitest-Checks, `git diff --check` und nur
  paketbezogenes Staging.
- Vor Integration: Engine- und Web-spezifische Regressionen, `pnpm typecheck`
  sowie passende AI-Choice-Tests, falls die Choice-Struktur beeinflusst wird.
- Finale: Worktree sauber, `main` in Arbeitsbranch integriert, finale Checks
  grün, Fast-Forward nach `main`, `main` sauber, Worktree und Branch entfernt
  und doppelt verifiziert.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/data-fort-reclamation-sequence`
- Arbeitsworktree: `C:\\Projekte\\NETGRID-worktrees\\data-fort-reclamation-sequence`
- Hauptworkspace: `C:\\Projekte\\NETGRID`, ausschließlich für den finalen
  lokalen Merge nach `main`.
- Jeder Paketabschluss erhält genau einen eigenen Commit.
- Push, Pull Request und sonstige Remote-Integration sind ausgeschlossen.

## Controller-Prompt-Kern

```text
/Goal Arbeite Data Fort Reclamation: geordnete Einzelkarten-Install-/Rez-Sequenz
vollständig und sequenziell von DFR-01 bis DFR-04 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die Wissensbasis und diese Activity.
Arbeite ausschließlich im Worktree C:\\Projekte\\NETGRID-worktrees\\data-fort-reclamation-sequence
auf Branch codex/data-fort-reclamation-sequence. Nutze den Hauptworkspace nur
für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess
konservativ fortsetzbar ist. Arbeite immer nur am aktuellen Paket, führe die
Paketchecks aus und committe jeden Abschluss. Bei einem Sicherheitsblocker:
stoppe, dokumentiere ihn samt Removal Condition und merge nicht. Nach dem
letzten Paket: final prüfen, lokal nach main mergen, main prüfen, Worktree und
Branch verifiziert entfernen und Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle vier Pakete sind committed und ihre Done-Gates erfüllt.
- Data Fort Reclamation löst die gewählten Karten einzeln und regelgerecht
  auf; die Auswahlreihenfolge ist sichtbar.
- Engine-Korrektheit, Hidden-Info, Replay/StateHash und UI-Darstellung sind
  geprüft.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Arbeitsworktree und gemergter Branch sind entfernt und die Entfernung wurde
  in Git und im Dateisystem verifiziert.

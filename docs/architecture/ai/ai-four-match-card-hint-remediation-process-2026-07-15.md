# KI-Kartenhint-Remediation aus vier gespeicherten Spielen (2026-07-15)

Status: In Umsetzung; P0 bis P3 abgeschlossen, P4 aktiv

## Quelle und Zielprüfung

Quelle sind die vier zuletzt abgeschlossenen lokalen Spiele mit detaillierten
KI-Traces:

- `match_dfe6223d817c646d`;
- `match_e6761d8fcdbd7996`;
- `match_f450485d3e5be1ab`;
- `match_10311b60ca1364f6`.

Die side-sichere Analyse umfasste 54 Karten mit ausgewählten kartenbezogenen
KI-Aktionen und zwölf weitere sichtbare, aber nicht ausgewählte KI-Karten. Der
Nutzer hat die Umsetzung der fünf eindeutigen Hint-Korrekturen, der
Homogenitätsnormalisierung sowie gezielter Consumer-Regressionen freigegeben.

## Gesamtziel und `/Goal`

`/Goal`: Die freigegebenen Kartenhint- und Consumer-Deltas aus den vier
gespeicherten Spielen sequenziell im eigenen Worktree absichern, eindeutige
Kartensemantikfehler korrigieren, nur auf aktuellem Code reproduzierbar rote
Verhaltensdeltas generisch beheben, alle Hint-Artefakte aktualisieren, die
unveränderten Verträge und Gegenproben grün verifizieren, dokumentieren, lokal
nach `main` integrieren und Worktree sowie Arbeitsbranch verifiziert entfernen.

- Arbeitsbranch: `codex/ai-four-match-hint-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_FOUR_MATCH_HINT_REMEDIATION`
- Ausgangs-`main`: `d0b9e341264cf786941c611e4eb4bc7d971ba2bd`
- Hauptworkspace: nur für den finalen lokalen Merge
- Push oder Pull Request: nicht Teil dieses Prozesses

## Freigegebener Scope

### Eindeutige Hint-Korrekturen

1. `Disgruntled Ice Technician`: Run-plus-Derez statt ICE-Trash und keine
   feste R&D-Rolle.
2. `Militech MRAM Chip`: Handgrößenunterstützung statt Memory- oder
   Remote-Upgrade-Rolle.
3. `Mantis, Fixer-at-Large`: Kartensuche ohne künstliches Draw-Signal.
4. `Score!`: reine Burst-Economy ohne Run- oder R&D-Druckrolle.
5. `Corporate Downsizing`: HQ-Agenda-Reveal/-Shuffle statt R&D-Top-Reveal und
   zentrale Stabilisierung statt unspezifischem R&D-Schutz.

### Homogenitätsnormalisierung

- `Cloak` und `Vewy Vewy Quiet`: einheitliche Einschränkung und präzise
  Semantik für wiederkehrende Credits auf nicht-noisy Icebreakern.

### Reproduktionspflichtige Consumer-Kandidaten

- `Inside Job`: Bypass muss in der Run-Pfadquote vor ICE-Kosten wirken.
- `Clown`, `Pattel's Virus` und `Lockjaw`: Breakkosten-Support darf nur über
  belegbaren marginalen Nutzen wirken; keine pauschale Installationspriorität.
- `Core Command: Jettison Ice`: nur bei einem spielgleichen roten Beleg eine
  spezifische Zielwertkorrektur.
- `Disgruntled Ice Technician`: nur bei einer aktuellen roten historischen
  Entscheidung zusätzlich zur Hint-Korrektur das Laufzeitverhalten ändern.

## Annahmen und Nicht-Ziele

- Die Kartentexte und aktiven CardImplementations sind die fachliche Wahrheit.
- Hint-Korrekturen dürfen keine LegalActions erzeugen oder Engine-Regeln
  ersetzen.
- Ein semantisch falscher Hint wird mit einem expliziten Hint-Vertrag
  abgesichert, auch wenn die konkrete historische Entscheidung zufällig gut
  ausging.
- Historische Consumer-Funde werden nur geändert, wenn ein spielgleicher
  Checkpoint auf unverändertem aktuellem Code als `behavior_regression` rot
  ist. Bereits grüne oder nicht eindeutig falsche Entscheidungen werden als
  Nicht-Fix dokumentiert.
- Es gibt keine Kartenname-, Match-ID-, Seed- oder Deck-Sonderwertung.
- Es gibt keinen breiten Scoring-Refactor, keine neue Runtime und keine
  Änderung an Kartentext, Engine-Legalität oder Hidden-Info-Grenzen.
- Clown, Pattel's Virus oder Lockjaw werden nicht allein wegen thematischer
  Synergie erzwungen; Kosten, MU, aktuelle Coverage und erwartete Einsparung
  bleiben entscheidend.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- KI und Tests konsumieren nur side-sichere PlayerViews, öffentliche
  Event-Präfixe und ausdrücklich erlaubte Metadaten.
- Kartentext schlägt Name, Cluster und historisches Rollenlabel.
- Draw, Suche, Memory, Handgröße, Run-Struktur und Run-Payoff bleiben getrennt.
- Supportkarten erhalten keinen Strategieanker ohne belegte Decklinienrolle.
- Taktiksignale erzeugen keine Legalität.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket wird separat committed.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration oder
  Redaction-Fehler gelten nicht als bestätigte KI-Regression.
- Ist ein historischer Consumer-Fund bereits grün, wird kein künstlicher Fix
  und keine abgeschwächte Erwartung eingeführt.
- Ein fehlendes kanonisches Signal wird nur erweitert, wenn bestehende
  Signalnamen die Kartenwirkung nicht korrekt ausdrücken können.
- Neue Gate-Fehler, Hidden-Info-Bedarf oder fehlende LegalActions blockieren
  das betroffene Paket ohne KI-Workaround.

## State Machine

`preflight -> process_committed -> red_contracts -> hints_fixed -> consumers_audited -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis und isolierter Worktree

- Ziel: Scope, `/Goal`, Invarianten, Branch und Worktree versionieren.
- Checks: `git diff --check`, sauberer Paketcommit.
- Done-Gate: Prozessartefakt ist committed und basiert auf dem dokumentierten
  Ausgangsstand.
- Commit: `docs(ai): plan four-match card hint remediation`

### P1 – Rote Hint-Verträge und spielgleiche Consumer-Reproduktion

- Ziel: Eindeutige Semantikfehler durch fokussierte Hint-Assertions vor dem
  Fix rot sichern und Consumer-Kandidaten gegen vorhandene historische
  Checkpoints oder spielgleiche Captures prüfen.
- Arbeit:
  - explizite Erwartungen für die fünf Hint-Korrekturen und Cloak/Vewy;
  - vorhandene DFE6-, F450-/10311- und E676-Fixtures wiederverwenden, wenn sie
    die Zielentscheidung exakt enthalten;
  - rote Consumer-Ziele und grüne Gegenproben getrennt ausweisen;
  - bereits grüne oder nicht beweisbare Consumer-Funde dokumentieren.
- Done-Gate: Hint-Zielverträge sind fachlich rot; jeder Consumer-Kandidat ist
  als rote `behavior_regression` oder begründeter Nicht-Fix klassifiziert.
- Commit: `test(ai): capture four-match hint regressions`

### P2 – Hint-Korrekturen und Homogenität

- Ziel: Die fünf falschen Hints sowie Cloak/Vewy textgenau und kanonisch
  korrigieren.
- Arbeit: aktive Hint-Quelle, abgeleitete/kompilierte Artefakte, Signal- oder
  Invariantkatalog nur bei tatsächlichem Bedarf sowie fokussierte Tests.
- Checks: neue Hint-Verträge, Hint-Inspector, `corepack pnpm check:ai`,
  `git diff --check`.
- Done-Gate: unveränderte Zielverträge sind grün; keine neue Strategy-ID oder
  Legalitätswirkung entsteht.
- Commit: `fix(ai): correct four-match card hint semantics`

### P3 – Reproduzierbare Consumer-Deltas

- Ziel: Ausschließlich weiterhin rote spielgleiche Consumer-Funde generisch
  beheben.
- Gegenverträge: Bypass, Breaker-Support und ICE-Entfernung bleiben
  situationsabhängig; keine pauschale Kartenpriorität.
- Checks: betroffene Decision-Checkpoints, angrenzende Unit-Tests,
  `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: rote Zieltests sind unverändert grün und Gegenproben bleiben grün;
  für Nicht-Fixes gibt es keine Produktionsänderung.
- Commit: `fix(ai): consume precise card support semantics`

### P4 – Verifikation, Review und Wissenspflege

- Ziel: fokussierte und breite KI-Prüfungen sowie dauerhafte Dokumentation
  abschließen.
- Pflichtchecks: alle Match-Checkpoints, neue Semantiktests,
  `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm check:ai`,
  `corepack pnpm --filter @netgrid/ai test`, `git diff --check`.
- Artefakte: Evidence-/Final-Review unter `docs/reviews/ai/`, AI-README und
  Monatslog bei dauerhaftem Vertrag.
- Done-Gate: Checks, Warnungen, Grenzen und Nicht-Fixes sind dokumentiert;
  Worktree ist sauber.
- Commit: `docs(ai): close four-match card hint remediation`

### P5 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, final verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: lokales `main` enthält alle Paketcommits; Status und
  Diff-Hygiene sind sauber; Worktree-Pfad und Arbeitsbranch existieren nicht
  mehr.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_FOUR_MATCH_HINT_REMEDIATION` auf Branch
`codex/ai-four-match-hint-remediation`. Arbeite immer nur am aktuellen Paket,
stelle eindeutige Hint-Verträge und jeden beweisbaren historischen
Verhaltensfund vor dem Produktionsfix rot, ändere die Erwartungen danach nicht
und committe jedes abgeschlossene Paket separat. Nutze den Hauptworkspace erst
für den finalen Merge.

## Abschlusskriterien

- Die fünf eindeutigen Hint-Fehler und Cloak/Vewy sind textgenau abgesichert.
- Reproduzierbar rote Consumer-Funde sind generisch behoben; bereits grüne oder
  nicht belegte Funde bleiben unverändert und sind dokumentiert.
- Keine Hidden-Info-, LegalAction-, Replay- oder Determinismusgrenze wird
  abgeschwächt.
- Aktive Hint-Artefakte und Kataloge bleiben konsistent.
- Pflichtchecks bestehen auf Arbeitsbranch und nach dem Main-Merge.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.

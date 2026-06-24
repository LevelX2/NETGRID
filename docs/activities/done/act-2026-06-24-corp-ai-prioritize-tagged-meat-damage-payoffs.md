---
activityId: act-2026-06-24-corp-ai-prioritize-tagged-meat-damage-payoffs
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-24
startedAt: 2026-06-24
completedAt: 2026-06-24
branch: codex/activity-tagged-meat-damage-payoffs
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - packages/ai/src/tag-punish-ontology-consumer.ts
  - docs/architecture/ai/corp-ai-tagged-meat-damage-payoff-process-2026-06-24.md
checks:
  - corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "Schlaghund tagged meat damage"
  - corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "Schlaghund tagged meat damage|prioritizes trashing Diplomatic Immunity|uses tag punishment operations|skips tag punishment operations"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Korp-KI priorisiert getaggte Meat-Damage-Payoffs

## Ziel

Die Korp-KI soll bei stark getaggtem Runner und legalen, sichtbaren Meat-Damage- oder Tag-Punish-Payoffs nicht in generische ICE-Installation oder einfache Economy ausweichen, wenn eine Damage-/Kill-Sequenz plausibel ist. Sichtbare Runner-Prävention wie `Full Body Conversion` und `Dermatech Bodyplating` muss dabei differenziert bewertet werden statt den Payoff pauschal auf Economy-Niveau fallen zu lassen.

## Kontext und Quellen

- Playtest-Beobachtung vom 2026-06-24: Runner hat 7 Tags. Die Korp hat mehrere Aktionen, zwei installierte `Schlaghund`-Karten und laut Board/HQ weitere Damage-Payoff-Möglichkeiten, installiert aber `Fetch 4.0.1` vor Archives beziehungsweise nimmt danach Credits, statt die getaggte Damage-Linie zu nutzen.
- Sichtbarer Runner-Schutz im Screenshot: zwei `Full Body Conversion` im Rig sowie `Dermatech Bodyplating`; `Diplomatic Immunity` ist nicht mehr aktiv. Der Nutzer vermutet, dass bezahlbare Einzelprävention die Bewertung zu stark drückt, obwohl mehrere `Schlaghund`-Aktivierungen oder andere Damage-Payoffs möglich sind.
- KI-Bewertung aus `C:/Users/Lui/.codex/attachments/30965401-043a-4de7-a82a-421a12857c47/pasted-text.txt`: ausgewählt wird `install_card`/`basic_install` mit Score `7390`. `1 Credit nehmen` und beide `Schlaghund: Wuerfel gegen Tags werfen` liegen bei Score `6125` und erhalten dieselben Score-Zeilen `Action-Typ-Priorität`, `Credit-Bedarf`, `Akteur-private Action`, `Credit-Kosten`. In `semanticActionRanking` erscheinen die `Schlaghund`-Zeilen sogar als `1 Credit nehmen · Credits / Karten ziehen`.
- Vorarbeit: `docs/activities/done/act-2026-06-24-corp-ai-trash-diplomatic-immunity-before-meat-damage.md` hat den vorgelagerten Trash von globaler Meat-Damage-Prävention behandelt. Dieses Paket ist ein Follow-up für die anschließende Payoff-Ausführung, nachdem globale Prävention entfernt ist.

## Scope

- Reproduktion oder fokussierter Test für eine Korp-Entscheidung mit:
  - Runner hat mehrere sichtbare Tags,
  - Korp hat mehrere Aktionen,
  - Korp hat mindestens eine legale `Schlaghund`-Aktivierung oder eine andere legale eigene Damage-/Tag-Punish-Aktion,
  - Runner hat sichtbare Einzel-Meat-Damage-Prävention oder bezahlbare Präventionshardware.
- Prüfen, ob `Schlaghund`-LegalActions in der Semantic Runtime korrekt als Tag-/Damage-Payoff und nicht als generische Economy bewertet und angezeigt werden.
- Die Korp-Bewertung soll erwarteten Net-Damage, Kill-Potential, Präventionskosten und wiederholbare Aktivierungen innerhalb des Zuges berücksichtigen, soweit dies side-safe aus öffentlichen Runner-Zonen und eigener Korp-Information ableitbar ist.
- Die Debug-/Display-Projektion soll nachvollziehbare Score-Komponenten für Tag-Punish, Meat-Damage-Payoff, Präventionsdruck und Kill-Sequenz zeigen.

## Nicht im Scope

- Keine Änderung an Kartentexten, Engine-Regeln, LegalAction-Erzeugung oder `applyAction`.
- Keine neue Damage-Regel, keine Änderung an `Full Body Conversion`, `Dermatech Bodyplating`, `Schlaghund` oder `Scorched Earth` selbst, außer die Analyse zeigt einen separaten Kartenimplementierungsfehler; dann ein eigenes Folgepaket anlegen.
- Keine Nutzung verdeckter Runner-Informationen und keine Erweiterung von PlayerViews, PublicEvents, Reconnect-Payloads, Logs oder KI-Inputs um verdeckte Daten.
- Keine pauschale Hochgewichtung aller Damage-Aktionen unabhängig von Tags, Credits, Prävention und Legalität.

## Akzeptanzkriterien

- [ ] Ein fokussierter KI-Test reproduziert den gemeldeten Zustand oder einen minimalen äquivalenten Zustand: stark getaggter Runner, legale `Schlaghund`-/Damage-Payoff-Aktion, sichtbare Einzelprävention, alternative einfache Economy oder ICE-Installation.
- [ ] In diesem Zustand wird eine plausible legale Damage-/Tag-Punish-Aktion gegenüber `gain_credit` und generischem ICE-Install bevorzugt, wenn erwarteter Net-Damage, Präventionsdruck oder Kill-Sequenz positiv ist.
- [ ] Wenn sichtbare Prävention den aktuellen Damage-Payoff tatsächlich vollständig neutralisiert oder die Korp die relevanten Kosten nicht tragen kann, darf die KI Economy oder Setup wählen; die Debug-Ausgabe muss dann den Präventions-/Kosten-Grund sichtbar machen.
- [ ] `Schlaghund`-Aktionen werden semantisch nicht mehr als `1 Credit nehmen`/`Credits / Karten ziehen` angezeigt, sofern die LegalAction eindeutig einer Kartenaktivierung mit Tag-/Damage-Payoff entspricht.
- [ ] Die Änderung erzeugt keine neuen LegalActions und ändert keine Engine-, Replay-, StateHash-, Randomness- oder Hidden-Info-Verträge.
- [ ] Regressionen decken mindestens die gemeldete Priorisierung und eine Gegenprobe mit zu starker sichtbarer Prävention oder fehlenden Tags ab.

## Umsetzungshinweise

- Relevante Suchbegriffe: `Schlaghund`, `tag_punish`, `damage_kill`, `meat_damage`, `damage_prevention`, `Full Body Conversion`, `Dermatech Bodyplating`, `semanticRuntimeScopeForAction`, `ActionSemanticCandidate`, `chooseCorpAction`.
- Zuerst klären, warum `Schlaghund` im Export dieselben Score-Komponenten wie `gain_credit` erhält und in `semanticActionRanking` als Credit-Aktion erscheint.
- Die Bewertung sollte nicht nur den Einzelklick betrachten, sondern bei mehreren verbleibenden Korp-Aktionen eine einfache Sequenzchance berücksichtigen: wiederholbarer Damage-Payoff kann auch dann gut sein, wenn die erste Prävention nur Schutz oder Credits aufzehrt.
- Falls die Analyse zeigt, dass die Display-Projektion falsch ist, die Entscheidung intern aber korrekt bewertet wird, den UI-/Debug-Fix getrennt und eng halten oder ein separates `small-adjustments-agent`-Paket anlegen.

## Ergebnisnotiz

Umgesetzt. Die Semantic Runtime erkennt kartenbasierte Korp-`gain_credit`-LegalActions mit Tag-Punish-/Damage-Hints jetzt als `corp_tag_punish`, bevor der generische `economy.gain_credit`-Candidate den Scope auf Economy herunterstuft. Dadurch wird `Schlaghund` nicht mehr wie ein normaler Credit-Klick behandelt, sondern als legaler Tag-/Meat-Damage-Payoff mit eigener Score-Komponente bewertet.

Die neue Score-Komponente `corp_tagged_meat_damage_payoff_pressure` berücksichtigt side-safe sichtbare Informationen: Runner-Tags, sichtbare Quellkarte/Hints, raw Meat Damage, Schlaghund-Wahrscheinlichkeit aus sichtbarer Tagzahl, Runner-Handcount, Korp-Credits, sichtbare `Full Body Conversion` und `Dermatech Bodyplating` sowie Präventionsdruck bei mehreren verbleibenden Korp-Aktionen. Sie erzeugt keine LegalActions und ändert keine Engine-, Replay-, StateHash-, Randomness- oder Hidden-Info-Verträge.

Regressionen ergänzt:

- Getaggter Runner mit 7 Tags, sichtbarer `Full Body Conversion`, `Dermatech Bodyplating`, legalem `Schlaghund`, Basic-Credit und `Fetch 4.0.1`-ICE-Install wählt `Schlaghund` als `corp.semantic.corp_tag_punish`.
- Gegenprobe ohne Runner-Tags promotet `Schlaghund` nicht über den Basic-Credit.

Checks:

- `corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "Schlaghund tagged meat damage"`: bestanden.
- `corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "Schlaghund tagged meat damage|prioritizes trashing Diplomatic Immunity|uses tag punishment operations|skips tag punishment operations"`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.

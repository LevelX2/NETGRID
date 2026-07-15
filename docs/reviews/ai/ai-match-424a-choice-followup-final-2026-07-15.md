# Match 424A – Choice- und Discard-Follow-up final (2026-07-15)

Status: fachlich und technisch verifiziert; lokal integriert und bereinigt

## Ergebnis

Die erneute vollständige Entscheidungsprüfung von
`match_424abdd1c7ac054d` hat drei zuvor nicht geschlossene Runner-
Fehlentscheidungen dauerhaft reproduzierbar gemacht und generisch behoben:

- D51 / StateVersion 91 nutzt Force Shield gegen 2 vermeidbaren Schaden statt
  `pass`.
- D118 / StateVersion 216 nutzt eine der zwei legalen Force-Shield-Quellen
  gegen 1 vermeidbaren Schaden statt `pass`.
- D93 / StateVersion 162 behält Forged Activation Orders und Inside Job. Die
  KI verwirft nun eine Junkyard-Kopie, die redundante SeeYa-Handkopie und
  einen der zwei WuTech Mem Chips.

Die aktiven und kompilierten Hints waren für Force Shield, SeeYa, Forged
Activation Orders, Inside Job, WuTech und Junkyard bereits korrekt. Es wurden
keine Hint-Artefakte geändert. Die Fehler lagen ausschließlich in den
Runtime-Consumern.

## Red-vor-Fix-Nachweis

Die drei Checkpoints wurden mit dem offiziellen SQLite-Capture-Pfad aus dem
damaligen Runner-Zustand erfasst. Nach einem obligatorischen Strict-Versuch
wurde wegen bereits bekannter früher Warmup-Abweichungen `rebase` verwendet.
Schema, StateHash, Runtime-Memory und Redaction blieben gültig.

Auf unverändertem Produktionscode ergab der gemeinsame Lauf:

```text
Test Files  1 failed | 2 passed (3)
Tests       3 failed | 40 passed (43)
```

Alle drei Zieltests scheiterten ausschließlich mit
`behavior_regression: Behavior expectation failed for runner.resolve_choice`.
Die Expectations wurden danach nicht verändert. Die vollständige Evidence
liegt in
`docs/reviews/ai/ai-match-424a-choice-followup-red-evidence-2026-07-15.md`.

## Produktionsänderungen

### Schadensverhinderungs-Choice

`packages/ai/src/runtime/damage-prevention-choice-option.ts` konsumiert den
bereits strukturierten Engine-Choice
`v120.event_modification.prevent`. Es erzeugt keine Action und erkennt weder
Match noch Karte per Definition-ID.

- Bei akutem Schadensdruck – die angebotene Präventionsmenge erreicht den
  aktuellen Handpuffer – wird die erste von der Engine priorisierte legale
  Präventionsquelle gewählt.
- Außerhalb akuten Drucks wird nur eine Quelle automatisch verwendet, deren
  sichtbare Quellkarte über die vorhandene Rollenontologie als
  `damage_prevention` oder `rig_defense` beschrieben ist.
- Run-Pools, bestehende Runtime-Präventionsprofile, permanente Prävention und
  der Test-Harness bleiben als strukturierte Routinequellen erkennbar.
- Fehlt eine Präventionsquelle, bleibt `pass` bestehen. Eine nicht als
  Routineabwehr beschriebene einmalige Quelle wird bei sicherem Handpuffer
  ebenfalls aufbewahrt.

Damit nutzen D51 und D118 Force Shield, ohne die zuvor zu breite Regel „jede
legale Quelle immer verbrauchen“ einzuführen.

### Discard-Redundanz und sichtbare Pfadwerkzeuge

`packages/ai/src/runtime/runner-role-classification.ts` klassifiziert die
bestehenden Rollen `hidden_zone_tool` und `expose_helper` als nichtadditive
Runner-Utility. Eine SeeYa-Handkopie wird dadurch abgewertet, wenn SeeYa
bereits installiert ist.

`packages/ai/src/runtime/discard-keep-score.ts` nutzt zusätzlich die bereits
vorhandenen strukturierten Hint-Effekte:

- `ice_trash` schützt ein einzigartiges Werkzeug nur, wenn der aktuell
  sichtbare Zielpfad ICE enthält;
- `future_encounter_effect` mit `bypass_first_ice` schützt unter derselben
  Bedingung einen einzigartigen Bypass;
- ohne sichtbar ge-ICE-ten Pfad entsteht kein pauschaler Bonus;
- Mehrfachkopien und bereits installierte nichtadditive Utility bleiben durch
  die vorhandenen Duplicate-Malusse abwertbar.

Der historische D93-Zustand führt deshalb deterministisch zu Junkyard, SeeYa
und WuTech als Discards, während Forged Activation Orders und Inside Job als
einzigartige aktuelle Pfadoptionen erhalten bleiben.

## Gegenproben

- Schadensfenster ohne legale Präventionsquelle: `pass`.
- Sicheres Schadensfenster mit nicht als Routineabwehr beschriebener
  einmaliger Quelle: `pass`.
- Akuter Schadensdruck: legale Prävention bleibt zulässig.
- Einzigartige MU-Unterstützung bleibt besser als neutrale Duplikate.
- Installierte Expose-Utility macht die gleiche Handkopie entbehrlich.
- Inside Job und Forged Activation Orders erhalten nur bei sichtbar ge-ICE-tem
  Pfad den neuen Keep-Bonus.
- Alle zuvor vorhandenen zwölf Match-424A-Endgame-Checkpoints bleiben grün.

## Verifikation

Finaler Arbeitsbranch-Stand:

- fokussierte Match-, Choice-, Discard-, Hint- und Handentwicklungs-Tests:
  grün;
- `corepack pnpm --filter @netgrid/ai typecheck`: grün;
- `corepack pnpm check:ai`: grün, alle fünf Gates ohne Fehler;
- vollständige `@netgrid/ai`-Suite in drei offiziellen Shards:
  333/333 Testdateien und 2264/2264 Tests grün;
- `git diff --check`: grün.

Die von `check:ai` ausgegebenen bestehenden Descriptor- und Hint-Warnungen
sind unverändert nicht blockierend; es kam kein neuer Gate-Fehler hinzu.

## Grenzen

- Es wurden keine zusätzlichen Matches, Selfplays oder Behavior-Baselines
  gestartet.
- Es gibt keine Aussage, dass die drei neuen Einzelentscheidungen allein das
  historische Spielergebnis gedreht hätten.
- Engine-Legalität, PlayerViews, Kartentexte, Replay, StateHash, Zufall,
  Hidden-Info-Grenzen und Kartenpool wurden nicht verändert.
- Die KI kann nur Kosten unterscheiden, die im Choice-/Rollenvertrag sichtbar
  sind. Nicht als Routineabwehr klassifizierte Quellen werden bei sicherem
  Handpuffer deshalb konservativ aufbewahrt.

## Lokale Integration

Der Arbeitsbranch wurde bis Commit `020d0bb9a` per Fast-Forward nach `main`
integriert. Anschließend liefen die 88 fokussierten Tests und der AI-Typecheck
auf `main` erneut grün. Worktree, Git-Worktree-Registrierung und Arbeitsbranch
sind entfernt und ihr Fehlen ist verifiziert. Es erfolgte kein Push und kein
Pull Request.

## Führende Artefakte

- Prozess:
  `docs/architecture/ai/ai-match-424a-choice-followup-process-2026-07-15.md`
- Rote Evidence:
  `docs/reviews/ai/ai-match-424a-choice-followup-red-evidence-2026-07-15.md`
- Final Review:
  `docs/reviews/ai/ai-match-424a-choice-followup-final-2026-07-15.md`
- Checkpoints:
  `data/scenarios/ai-decision-checkpoints/cp-424a-08-force-shield-damage-prevention.json`,
  `cp-424a-09-discard-path-tools.json` und
  `cp-424a-10-force-shield-damage-prevention.json`

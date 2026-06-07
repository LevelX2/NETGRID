# AI-MU-Install-Action-Surface-Audit

Datum: 2026-06-07

## Ergebnis

Die Runner-KI sieht die MU-Verdrängung beim Folge-Choice-Pfad bereits ausreichend side-sicher, aber nicht als explizite Kosteninformation bei der initialen `install_card`-Bewertung.

Konkreter Stand:

- `LegalAction` für den Sonderpfad trägt `type: "install_card"`, die normale Installationskostenstruktur und im Payload nur `runnerProgramTrashBeforeInstall: true` plus `cardId`.
- `PlayerView` enthält side-sicher `own.memoryUsed`, `own.memoryLimit`, Handkarten mit `memoryCost` und die installierte Rig mit sichtbaren Programmen samt `memoryCost`, Countern und Rollenhinweisen.
- `pendingChoice` für `runner_program_trash_before_install` enthält side-sicher `source`, `kind: "select_cards"`, `minSelections`, `maxSelections` und auswählbare Optionen. Die KI nutzt daraus bereits Quelle, MU-Bedarf und sichtbare Trash-Kandidaten.
- `RunnerHandDevelopmentEvaluation` wertet volle MU als `missing_mu`, aber nur wenn keine passende LegalAction existiert. Sobald die Engine eine `install_card`-Action mit Programmtrash anbietet, wird die Karte als `legal_now` geführt und die spätere Opferkosten-Nuance fehlt.
- `TacticalPlans` kennt `resolve_missing_mu` für blockierte Breaker-Installationen, aber keine separate "legal durch Programmtrash, kostet aber ein Rig-Opfer"-Evidence.

Damit ist die Regelautorität korrekt bei der Engine und die Follow-up-Choice sicher. Die Bewertungslaecke liegt in der initialen AI-Nutzenrechnung: Ein Pflicht-Trash-Install kann wie eine normale legale Installation wirken, obwohl die Auswahl danach ein wichtiges Programm kosten kann.

## Codebefunde

`packages/engine/src/game/turn/runner-program-trash-install-actions.ts` baut den Sonderpfad als LegalAction:

- `type: "install_card"`
- Label: `<Titel> mit Programmtrash installieren`
- `source`: installierte Handkarte
- Payload: `{ cardId, runnerProgramTrashBeforeInstall: true }`

`packages/shared/src/index.ts` macht die relevanten Daten side-sicher verfuegbar:

- `LegalAction.payload?: Record<string, string | number | boolean>`
- `VisibleCard.memoryCost`
- `VisibleCard.memoryLimitBonus`
- `PlayerView.own.memoryUsed`
- `PlayerView.own.memoryLimit`
- `PlayerView.own.gripOrHq`
- `PlayerView.own.rig`
- `VisibleChoiceRequest.options` mit optionalem `card`

`packages/ai/src/index.ts` behandelt `runner_program_trash_before_install` im Choice-Pfad bereits gesondert:

- Quelle aus `choice.source.split(":")[1]`
- `requiredMemoryToFree = memoryUsed + sourceMemoryCost - memoryLimit`
- Kandidaten aus `pendingChoice.options` und sichtbarer Rig
- Schutz fuer einzige sichtbare Icebreaker-Rollen
- Evidence: `choice_source:runner_program_trash_before_install`, `memory_required:*`, `trash_candidates:*`, `protected_icebreakers:*`

`packages/ai/src/runner-hand-development.ts` hat bereits `memoryCost` und `memoryAvailable`, aber kein Feld fuer `requiresProgramTrash`, `requiredMemoryToFree`, `sacrificePenalty` oder `bestSacrificeCandidate`.

`packages/ai/src/tactical-plans.ts` erzeugt `resolve_missing_mu` nur fuer den Fall, dass ein in-Hand-Breaker nicht installierbar ist und `memoryAvailable <= 0`. Wenn `install_card` wegen Programmtrash legal ist, greift dieser Blocker nicht.

## Fehlende side-sichere Felder

Die Daten reichen aus, um die Verdrängung AI-intern aus `PlayerView` und `LegalAction` zu berechnen. Trotzdem fehlen explizite, einheitliche Felder in der semantischen Action-/Plan-Oberflaeche:

- `memoryUsed`
- `memoryLimit`
- `memoryAvailable`
- `sourceMemoryCost`
- `muAfterInstall`
- `requiresProgramTrash`
- `requiredMemoryToFree`
- `trashCandidateCount`
- `trashCandidateMemoryTotal`
- `hasProtectedOnlySacrificeCandidates`
- `bestSacrificePenalty`
- `bestSacrificeCategory`
- `programTrashChoiceSource`

Diese Felder sollten nicht aus FullState kommen. Sie koennen side-sicher aus `PlayerView.own`, der eigenen Handkarte, der eigenen Rig und dem vorhandenen `LegalAction.payload.runnerProgramTrashBeforeInstall` abgeleitet werden.

## Empfehlung

Kurzfristig sollte keine Engine-Regeländerung erfolgen. Die Engine stellt die Legalitaet und den Choice-Pfad bereits korrekt bereit.

Fuer Paket `act-2026-06-07-ai-program-sacrifice-evaluation` sollte eine AI-interne `ProgramSacrificeEvaluation` eingefuehrt werden, die sowohl im Folge-Choice als auch bei der initialen Bewertung des `runnerProgramTrashBeforeInstall`-Installationspfads nutzbar ist. Die initiale Bewertung soll den Installationsnutzen um `bestSacrificePenalty` beziehungsweise um ein "kein akzeptables Opfer"-Signal senken.

Fuer Paket `act-2026-06-07-ai-mu-pressure-memory-support` sollte aus denselben side-sicheren Daten eine enge `RunnerMuPressureAssessment` entstehen. Sie sollte Memory-Support und Creditbase nur dann aufwerten, wenn volle oder fast volle MU plus nuetzliche Programme in Hand beziehungsweise ein aktueller Pflicht-Trash-Install vorliegt.

`ActionSemanticCandidate` und TacticalPlans sollten danach eine schmale MU-/Displacement-Evidence bekommen. Empfehlung:

- `ActionSemanticCandidate.evidence` um redigierte Fakten wie `runner_program_trash_before_install`, `memory_available:*`, `required_memory_to_free:*` und `trash_candidate_count:*` ergaenzen.
- Keine neue Strategy-ID einfuehren.
- TacticalPlans nur um bestehende Memory-/Install-Semantik herum erweitern, etwa `resolve_missing_mu`/`install_memory_support`, statt einen parallelen Legalitaetsmechanismus zu bauen.

## Folgepakete

- `docs/activities/inbox/act-2026-06-07-ai-program-sacrifice-evaluation.md`: bewertet konkrete Opferkosten und wendet den Malus auf Pflicht-Trash-Installationen an.
- `docs/activities/inbox/act-2026-06-07-ai-mu-pressure-memory-support.md`: priorisiert Memory-Support und Economy unter echter MU-Pressure.
- `docs/activities/inbox/act-2026-06-07-ai-mu-sacrifice-regression-debug.md`: prueft die Debug-/Regression-Sicht nach der Opferbewertung.

## Abschluss

Das Action-Surface ist fuer die Folge-Choice ausreichend. Fuer die initiale Installationsentscheidung fehlt keine versteckte Information, sondern eine side-sichere AI-Zwischenauswertung und redigierte Evidence, die Pflicht-Trash-Installationen von normalen Installationen trennt.

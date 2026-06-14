---
activityId: act-2026-06-14-runner-ai-non-additive-resource-install-devaluation
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-14
startedAt: 2026-06-14
completedAt: 2026-06-14
branch: codex/activity-run-20260614-150645
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-hand-development.ts
  - packages/ai/src/runner-hand-development.test.ts
  - packages/ai/src/index.ts
  - packages/ai/src/legacy/runner-plans.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-hand-development.test.ts src/tactical-plans.test.ts -t "persistent|duplicate|Junkyard|search resource|hand development"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-hand-development.test.ts src/tactical-plans.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
---

# Runner-KI: nicht-additive Ressourceninstallationen abwerten

## Ziel

Die Runner-KI soll gleichartige oder funktional gleichwertige persistente Ressourcen nicht mehrfach gleichzeitig installieren, wenn die zweite Kopie keinen additiven Nutzen erzeugt. Solche Karten sollen eher auf der Hand bleiben, weil die Handkarten als Damage-/Flatline-Puffer relevant sind und eine unnötige Installation Credits, Aktionen und Grip reduziert. Nach Verlust oder Trash der ersten Kopie darf die KI eine Ersatzkopie wieder installieren.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-14: Der Runner spielt wiederholt gleichartige Ressourcen aus, obwohl mehrere installierte Kopien keinen additiven Vorteil bringen. Genannt wurden u. a. BBS-/Recovery-/Suchressourcen wie `Junkyard BBS` sowie eine vom Nutzer als "Zeiss" bezeichnete Rückhol-/Suchkarte, die im Trace noch konkret zu identifizieren ist.
- Fachliche Einordnung: Nicht ausgespielte Runner-Karten haben Eigenwert, weil Grip gegen Damage hilft. Eine zweite nicht-additive Ressource verbraucht trotzdem Installkosten, Aktion und eine Handkarte.
- Vorarbeit:
  - `docs/architecture/ai/runner-hand-development-creditbase-contract-2026-06-07.md`
  - `docs/activities/done/act-2026-06-07-runner-hand-development-evaluation.md`
  - `docs/activities/done/act-2026-06-08-ai-planstep-recovery-target-fit.md`
- Relevante Codeanker:
  - `packages/ai/src/runner-hand-development.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/runner-economy-posture.ts`
  - `data/ai/ai-card-hints-active.json`
  - `data/ai/ai-card-hints-compiled.json`

## Scope

- Bestehende `RunnerPersistentInstallEvaluation` für persistente Runner-Karten schärfen.
- Eine wiederverwendbare Funktionsklasse für nicht-additive, action-gated Utility-Ressourcen modellieren, z. B. Such-/Recovery-Ressourcen mit Rollen oder Effekten wie:
  - `trash_recovery`
  - `stack_search`
  - `program_search`
  - `utility_resource`
  - `hidden_zone_tool`
  - `setup.recovery`
  - `setup.stack_filter`
- Wenn bereits eine Ressource derselben nicht-additiven Funktionsfamilie installiert ist, soll eine weitere Kopie ohne konkreten neuen Planbedarf als niedriger Grenznutzen gelten:
  - `capabilityDelta` eher `backup_only` oder `none`
  - `duplicateRole` eher `redundant_duplicate`
  - `finalInstallFit` negativ oder mindestens nicht planfähig
  - Evidence z. B. `non_additive_utility_duplicate`, `action_gated_utility_already_installed`, `why_duplicate_install_deferred:low_marginal_utility`
- Den Handpuffer-Malus für redundante/nicht-additive Installationen allgemeiner anwenden, nicht nur bei riskanten Breakern oder sichtbarem Damage-Kontext.
- TacticalPlan- und Semantic-Runtime-Mapping prüfen, damit `runner.develop_hand_card` keine zweite nicht-additive Utility-Ressource bevorzugt, wenn Credit/Draw/Economy/Setup-Alternativen plausibel sind.
- Additive Kopien weiterhin erlauben, wenn sie tatsächlich zusätzlichen Nutzen erzeugen, z. B. Memory, echte Counter-/Recurring-Kapazität, Multiaccess, bezahlte parallele Bankkapazität, Damage-Prevention mit akutem Bedarf oder eine explizite Ersatz-/Notfalllage.
- Den vom Nutzer als "Zeiss" bezeichneten konkreten Kartenfall über Karte, Trace oder sichtbare Aktion identifizieren und in mindestens einem Test oder einer Ergebnisnotiz referenzieren.
- Fokussierte Regressionen ergänzen für:
  - zweite identische `Junkyard BBS` oder vergleichbare Recovery-Ressource wird gegenüber sinnvoller Alternative zurückgestellt;
  - zweite funktional ähnliche Suchressource wird nicht nur wegen `build_rig`/`utility_resource` installiert;
  - Ersatzinstallation wird erlaubt, wenn die erste Kopie nicht mehr installiert ist;
  - additive Kontrollkarte bleibt erlaubt oder wird nur mit Diminishing Returns bewertet;
  - finale Aktion stammt weiterhin aus `input.legalActions`.

## Nicht im Scope

- Keine Engine-Änderung.
- Keine Änderung an `LegalActions`, `applyAction`, Replay, StateHash oder Zufallspfaden.
- Keine neue Kartenfreigabe und keine Änderung am Kartenpool.
- Keine Hidden-Info-Ausweitung; die Bewertung darf nur eigene Runner-PlayerView, eigene Hand-/Rig-Informationen, LegalActions, AI-Hints und side-sichere öffentliche Informationen verwenden.
- Keine harte Pauschalsperre für alle Duplikate. Additive und akut benötigte Kopien bleiben zulässig.
- Keine UI-Änderung.

## Akzeptanzkriterien

- [x] Nicht-additive Such-/Recovery-/Utility-Ressourcen werden als Funktionsfamilie erkannt, nicht nur als exakte Definition.
- [x] Eine zweite installierbare Kopie ohne neuen Funktionsgewinn erzeugt `redundant_duplicate` oder eine gleichwertige negative Bewertung.
- [x] Handpufferverlust durch unnötige Installation wird in Evidence und Score sichtbar, auch ohne expliziten Blink-/Damage-Sonderfall.
- [x] `runner.develop_hand_card` und Semantic Runtime wählen eine solche zweite Kopie nicht über Credit/Draw/Economy/Setup-Alternativen, solange kein Override greift.
- [x] Ersatzinstallation nach Verlust/Trash der ersten Kopie bleibt möglich.
- [x] Additive Ressourcen oder akut nützliche Backup-/Survival-Kopien werden nicht fälschlich blockiert.
- [x] Debug/Evidence bleibt redigiert und enthält keine gegnerische Hidden-Info, keine Deckreihenfolge und keine privaten Snapshot-/Instanzlisten außerhalb eigener sichtbarer Karten.
- [x] Fokussierte AI-Tests und `@netgrid/ai` Typecheck sind grün.

## Umsetzungshinweise

- Wahrscheinlicher erster Hebel ist `persistentFunctionalProfileForCard` in `packages/ai/src/runner-hand-development.ts`: Dort sollten Such-/Recovery-/Utility-Funktionsfamilien feiner getrennt und für Stackability bewertet werden.
- `looksRepeatUseful` ist aktuell zu freundlich für Begriffe wie `recurring`, `counter`, `memory`, `bank`, `hand size`; diese Ausnahmen nicht auf generische Such-/Recovery-Ressourcen ausweiten.
- `rolesForCardId` in `packages/ai/src/index.ts` mischt `planRoles` in Aktionsrollen. Deshalb können Karten mit `planRoles: ["build_rig", ...]` Rohpunkte bekommen, obwohl die zweite Kopie keinen neuen Funktionswert hat. Die Grenznutzenbewertung muss diesen generischen Rollenbonus überstimmen können.
- `usefulLegalRunnerHandDevelopment` in `packages/ai/src/tactical-plans.ts` filtert bereits `redundant_duplicate` und `finalInstallFit <= 0`. Ziel ist daher nicht ein komplett neuer Planpfad, sondern bessere Klassifikation und stärkere negative Bewertung vor dem Plan-Mapping.
- Für Regressionen möglichst kleine Fixtures verwenden und die konkreten Nutzerbeispiele mit mindestens einem bekannten Originalset-Anker absichern, z. B. `Junkyard BBS`, `Aujourd'Oui`, `N.E.T.O.`, `Ronin Around` oder `The Short Circuit`.

## Ergebnisnotiz

Umgesetzt. `RunnerPersistentInstallEvaluation` erkennt jetzt nicht-additive, action-gated Utility-Familien für persistente Runner-Ressourcen über AI-Hint-Rollen und strukturierte Hint-Signale wie `program_search`, `stack_search`, `trash_recovery`, `setup.stack_filter` und `setup.recovery`. Bereits installierte Ressourcen derselben breiten Such-/Recovery-Familie machen weitere Kopien zu `backup_only`/`redundant_duplicate`, erzeugen negative `finalInstallFit`-Scores und liefern redigierte Evidence wie `non_additive_utility_duplicate`, `action_gated_utility_already_installed` und `why_duplicate_install_deferred:low_marginal_utility`.

Der Handpuffer-Malus greift für solche redundanten Utility-Installationen auch ohne Blink-/Damage-Sonderlage, sodass Grip-Erhalt als Damage-/Flatline-Puffer in Score und Evidence sichtbar wird. Die vorhandene TacticalPlan-Filterung für `runner.develop_hand_card` bleibt der Plan-Gate-Hebel; durch die stärkere negative Bewertung wird die zweite Kopie vor dem Mapping herausgefiltert. Zusätzlich wurde die ältere Low-Value-Duplicate-Erkennung in Runtime und Legacy von der `Junkyard BBS`-Sonderregel auf Such-/Recovery-Rollen verallgemeinert.

Regressionen decken zweite `Junkyard BBS`, funktional ähnliche Suchressourcen (`Aujourd'Oui` installiert, `The Short Circuit` auf der Hand), Ersatzinstallation nach Verlust der ersten Kopie sowie die bestehende additive Damage-Prevention-Kontrolle ab. Der Nutzerhinweis "Zeiss" wurde im aktuellen Datenstand als wahrscheinlich verwandt mit `Zetatech Software Installer`/Zetatech-Karten geprüft; die beobachteten nicht-additiven Such-/Recovery-Ressourcen sind im aktiven Pool vor allem `Junkyard BBS`, `Aujourd'Oui`, `N.E.T.O.`, `Ronin Around` und `The Short Circuit`. `Zetatech Software Installer` ist ein Program-/Recurring-Credit-Fall und wurde nicht in die nicht-additive Ressourcenfamilie eingeordnet.

# Upgrade Install Placement Guardrails Prozess 2026-07-05

## Status

`upgrade_audit_and_contract`

## Quelle/Vorgabe

Nutzerbeobachtung vom 2026-07-05:

- Die Corporation-KI installiert Upgrades auf Zielservern, auf denen ihre Effekte keinen sinnvollen Nutzen haben.
- Beispiel: `Washington, D.C., City Grid` wird in HQ oder R&D installiert, obwohl sein Agenda-Difficulty-Discount nur in einem scoring-faehigen Fort sinnvoll ist.
- Die vorhandenen Taktiksignale sollen nicht nur als Kartendokumentation existieren, sondern als Runtime-Verbraucher die Upgrade-Positionierung steuern.
- Absolut unsinnige Kombinationen sollen einen Sperrmodus oder eine harte Depriorisierung erhalten.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Die Corp-KI bewertet Upgrade-Installationen nach Zielserver-Fit und vermeidet sinnlose Central-/Remote-Kombinationen.
- Scope: AI-Hint-Auswertung, Corp Runtime-Scoring für `install_card` mit `placement: "root"`, fokussierte Tests, Prozess-/Evidence-/Review-Artefakte.
- Nicht-Ziele: keine Änderung an Engine-Regeln, `LegalActions`, PlayerViews, Replay/StateHash, Kartenregeln oder Kartenpool.
- Abnahme: Regressionen zeigen, dass signalbasierte Remote-Scoring-Upgrades nicht auf HQ/R&D bevorzugt werden, Central-Defense-Upgrades nicht in beliebige Remotes wandern und Support-only-Upgrades ohne Board-Payoff nicht als generischer Scoreline-Plan behandelt werden.

## Gesamtziel

Die Corp Semantic Runtime soll für Upgrade-Installationen einen expliziten Zielserver-Fit berechnen:

- Remote-Scoring-Upgrades erhalten nur auf einem vorhandenen oder plausibel vorbereiteten Scoring-Remote einen starken positiven Wert.
- Central-spezifische Upgrades werden nur auf passenden Central-Servern belohnt.
- Remote-Tax-, Ambush-, Rez- und ICE-Support-Upgrades werden an Serverzustand, erwartete Runs und vorhandene Ziele gebunden.
- Upgrades mit klar inkompatiblem Zielserver erhalten einen harten Malus, der normale positive Install-Noise überstimmt.
- Wenn LegalActions fachlich Unsinn erlauben, bleibt die Engine unverändert; die KI filtert oder deeskaliert diese Optionen in der Bewertung.

## Annahmen

- `LegalActions` können strategisch schlechte, aber regellegale Installationen enthalten.
- Die v2-Upgrade-Hints beschreiben bereits die relevante Kartensemantik, sind aber bisher kein ausreichender Runtime-Verbraucher.
- Für diese Umsetzung reicht ein signalbasierter Fit-Verbraucher; Kartennamen-Sonderregeln sind nur für Tests und Dokumentation zulässig.
- Eine harte Sperre im AI-Sinn bedeutet Score-Komponente mit so starkem negativen Wert, dass die Aktion nur bei fehlender sinnvoller Alternative gewählt werden kann. Die Rules Engine bleibt die einzige echte Regel-Sperre.
- Alle Bewertungen nutzen nur side-safe Corp-KI-Daten: Corp PlayerView, side-gefilterte PublicEvents, LegalActions und erlaubte Card-/Hint-Metadaten.

## Nicht-Ziele

- Keine Engine-Validierung neuer illegaler Kombinationen.
- Kein Umbau der Upgrade-Hints selbst, außer ein Audit zeigt einen klaren Hint-Fehler.
- Kein neuer Planner und keine Hidden-Info-Nutzung.
- Keine generelle Verhinderung von Upgrades in Central-Servern; nur inkompatible Effekte werden bestraft.
- Kein Push oder Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt Regelautorität.
- Die KI wählt ausschließlich vorhandene `LegalActions`.
- `applyAction` bleibt unverändert für Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices zuständig.
- Bewertungsgründe dürfen keine verdeckten Runner-Daten enthalten.
- Signalgruppen müssen Gegenbeispiele erhalten, damit legitime Central-Upgrades und legitime Remote-Support-Upgrades nicht pauschal abgewertet werden.

## Automatische Fehlerbehandlung

- Bei roten Tests wird im aktiven Paket debuggt.
- Wenn eine Zielserver-Inkompatibilität nicht aus vorhandenen Hints ableitbar ist, wird sie als Review-Gap dokumentiert und nicht kartennamebasiert versteckt gefixt.
- Wenn eine harte Depriorisierung legitime Central- oder Remote-Nutzung blockiert, wird die Regel enger gegated.
- Wenn der finale Merge fremde uncommitted Änderungen überschreiben würde, wird gestoppt und ein Blocker-Report geschrieben.

## Sicherheitsblocker

- Hidden-Info-Leak in AI-Input, Debug-Gründen, Tests oder Reports.
- Änderung an Engine-Regeln statt AI-Bewertung.
- Pauschaler Central-Malus für Upgrades ohne Signalprüfung.
- Pauschaler Remote-Malus für Upgrades ohne Signalprüfung.
- Finaler Merge überschreibt fremde lokale Änderungen.

## State Machine

`preflight` -> `upgrade_audit_and_contract` -> `runtime_upgrade_placement_consumer` -> `focused_regressions` -> `final_review_and_integration` -> `complete`

## Paketfolge

### Paket 1: Upgrade-Audit und Placement-Kontrakt

Ziel: Alle Corp-Upgrades aus dem v2-Review in Platzierungsklassen einordnen und die Runtime-Regeln festlegen.

Arbeit:

- Prozessartefakt anlegen.
- Evidence-/Audit-Report für die 45 geprüften Corp-Upgrades anlegen.
- Signalgruppen definieren: Remote-Scoring, Central-Defense, Remote-Tax/Ambush, Rez-/ICE-Support, Low-Value/Support-only.
- Klare Inkompatibilitäten dokumentieren, insbesondere agenda-difficulty-discount auf HQ/R&D.

Kernartefakte:

- `docs/architecture/ai/upgrade-install-placement-guardrails-process-2026-07-05.md`
- `docs/reviews/ai/upgrade-install-placement-guardrails-evidence-2026-07-05.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozess- und Evidence-Artefakt existieren und sind committed.

Commit:

- `docs(ai): plan upgrade install placement guardrails`

### Paket 2: Runtime-Verbraucher für Upgrade-Zielserver-Fit

Ziel: `install_card`-Root-Aktionen für Upgrades erhalten eine explizite Zielserver-Fit-Komponente.

Arbeit:

- Einen fokussierten Runtime-Helper für Upgrade-Placement-Fit ergänzen.
- Taktiksignale und Rollen aus bestehenden Card-Hints konsumieren.
- Inkompatible Zielserver hart bestrafen.
- Passende Zielserver belohnen, aber nur mit Board-Payoff.
- Die Komponente in `semanticRuntimeCorpScoreComponents` einhängen.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
- neuer Helper unter `packages/ai/src/runtime/`, falls die bestehende Datei sonst zu groß würde
- angrenzende Type-/Composition-Dateien nur bei Bedarf

Checks:

- fokussierte Runtime-Tests
- `git diff --check`

Commit:

- `fix(ai): score corp upgrade install placement fit`

### Paket 3: Regressionen und Gegenbeispiele

Ziel: Die beobachteten Fehlplatzierungen und legitime Gegenfälle absichern.

Arbeit:

- Test: Washington/agenda-difficulty-discount wird auf HQ/R&D hart abgewertet.
- Test: agenda-difficulty-discount erhält auf vorbereitetem Scoring-Remote positiven Fit.
- Test: Central-spezifisches Upgrade wird nicht durch Remote-only-Regeln gebrochen.
- Test: Support-only/Low-Value-Upgrade ohne Board-Payoff verliert gegen bessere Entwicklung.
- Test: allgemeines Root-Install-Scoring behandelt Rollenrauschen nicht als Scoreline-Anker.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-score.test.ts`
- ggf. neuer fokussierter Test für den Helper

Checks:

- fokussierte Vitests
- `git diff --check`

Commit:

- `test(ai): cover corp upgrade placement guardrails`

### Paket 4: Final Review, Checks und lokale Integration

Ziel: Verifizieren, dokumentieren und lokal nach `main` integrieren.

Arbeit:

- Final-Review unter `docs/reviews/ai/` schreiben.
- Fokussierte Regressionen und AI-Typecheck ausführen.
- `git diff --check` ausführen.
- Arbeitsbranch lokal nach `main` mergen, sofern keine fremden uncommitted Änderungen überschrieben würden.
- Worktree nach erfolgreichem Merge entfernen.

Checks:

- fokussierte Vitests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `docs(ai): review upgrade install placement guardrails`

## Verifikationsregeln

- Tests prüfen Component-Keys und relative Aktionswertung, nicht nur absolute Scores.
- Inkompatibilitäts-Malusse müssen stärker sein als generische positive Install- oder Strategie-Fit-Komponenten.
- Remote-Scoring-Upgrades dürfen nur mit Remote-Payoff belohnt werden.
- Central-spezifische Upgrades behalten legitime Central-Verwendung.
- Hints bleiben Metadaten; der neue Verbraucher ist Runtime-Code, kein Engine-Regelersatz.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_UPGRADE_PLACEMENT`
- Arbeitsbranch: `codex/ai-upgrade-placement-guardrails`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` nutzen.
- Jeder Paketabschluss erhält einen Commit.
- Fremde Änderungen werden nicht reverted oder überschrieben.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite die NETGRID-Corp-KI Upgrade-Install-Placement-Guardrails sequenziell im Worktree C:\Projekte\NETGRID_AI_UPGRADE_PLACEMENT auf Branch codex/ai-upgrade-placement-guardrails ab. Prüfe die 45 Corp-Upgrades aus dem v2-Review nach sinnvoller Zielserver-Positionierung, dokumentiere Placement-Klassen und Inkompatibilitäten, implementiere einen signalbasierten Runtime-Verbraucher für Upgrade-Zielserver-Fit, ergänze Regressionen für Washington/agenda-difficulty-discount, Central-Gegenbeispiele und Support-only-Fälle, führe relevante Checks aus, committe jedes Paket und merge den abgeschlossenen Arbeitsbranch lokal nach main, sofern keine fremden uncommitted Änderungen überschrieben würden.`

## Abschlusskriterien

- Alle v2-Corp-Upgrades sind in Placement-Klassen geprüft oder ein Review-Gap ist dokumentiert.
- Ein Runtime-Verbraucher bewertet Upgrade-Zielserver-Fit signalbasiert.
- Sinnlose Kombinationen wie agenda-difficulty-discount auf HQ/R&D erhalten eine harte Depriorisierung.
- Fokussierte Regressionen und Typecheck sind gelaufen.
- Arbeitsbranch ist lokal nach `main` integriert oder ein echter Merge-Blocker ist dokumentiert.

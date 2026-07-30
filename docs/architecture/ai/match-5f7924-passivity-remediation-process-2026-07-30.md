# Match 5F7924: Paketprozess zur Passivitätskorrektur

Status: verifiziert, Integration ausstehend

Quelle:

- `docs/reviews/ai/match-5f7924-complete-old-ai-passivity-analysis-2026-07-30.md`
- Nutzerfreigabe vom 2026-07-30 für die dort beschriebenen Punkte 1 bis 7

## Gesamtziel

`/Goal Arbeite die sieben freigegebenen Maßnahmen aus Match
match_5f7924e4893ba855 vollständig und sequenziell ab. Beweise die auf
aktuellem Code fortbestehenden Fehler zuerst durch side-sichere historische
Decision-Checkpoints und Gegenproben, behebe nur reproduzierbare Ursachen
generisch, verifiziere fokussiert und breit, merge den fertigen Branch lokal
nach main und entferne Worktree und Arbeitsbranch nachweislich.`

Arbeitsbranch:
`codex/ai-match-5f7924-passivity-remediation`

Worktree:
`C:\Projekte\NETGRID_AI_MATCH_5F7924_PASSIVITY`

## Zielprüfung

Der Auftrag ist für eine direkte Umsetzung präzise genug:

- Match, Entscheidungen und Ursachen sind vollständig analysiert.
- Die sieben Maßnahmen sind freigegeben.
- Akzeptanzkriterien folgen aus den historischen Zuständen, bestehenden
  Decision-Checkpoint-Verträgen und den Engine-/AI-Gates.
- D107/D108 sind kein „immer rezzen“-Ziel, sondern verlangen eine
  entscheidbare Mehrschichtquote.

## Invarianten

- Rules Engine und LegalActions bleiben einzige Regel- und Aktionsautorität.
- AI-Code erhält nur Corp-PlayerView, LegalActions und erlaubte Metadaten.
- Neue Quotes werden in der Engine erzeugt und über PlayerView/LegalAction
  transportiert; die KI rekonstruiert keine verborgenen Vollzustände.
- Score-, Defense-, Economy- und Handmanagement-Pläne behalten ihre
  Zuständigkeit. Der Turn Planner orchestriert nur gebundene Phasen.
- ICE-Installation und Rezzen bleiben qualitativ und situationsabhängig.
  Es entstehen weder Always-Install- noch Always-Rez-Regeln.
- Ein Draw ist eine Informationsgrenze: Danach wird neu geplant.
- Standardports 3100/8787 und die Standard-SQLite werden im Worktree nicht
  gestartet oder verändert.
- Genau ein Paket ist aktiv. Jeder abgeschlossene Schritt wird separat
  verifiziert und committed.

## Nicht-Ziele

- Keine kartennamenspezifischen KI-Sonderregeln.
- Keine allgemeine Kreditobergrenze.
- Keine Neubewertung sämtlicher Corp-Deckstrategien.
- Kein Beweis, dass D107/D108 zwingend rezzen müssen.
- Kein Push und kein Pull Request.
- Keine Migration historischer Runtime-Daten.

## Automatische Fehlerbehandlung

- Ein historischer Checkpoint gilt nur bei `behavior_regression` als rot.
- Bereits grüne historische Fälle werden dokumentiert, aber nicht erneut
  „repariert“.
- Fixture-, Engine-Legalitäts- oder Runtime-Drift wird vor einem
  Verhaltensfix separat bereinigt.
- Rote Tests bleiben bis zur generischen Korrektur unverändert.
- Bei breiten Regressionen wird der engste verursachende Vertrag korrigiert;
  keine pauschale Erwartungsabschwächung.

## Sicherheitsblocker

Der Prozess stoppt ohne Workaround, wenn:

- eine Lösung Hidden Information benötigen würde;
- eine notwendige Aktion nicht legal erzeugt werden kann;
- Engine-, Replay-, StateHash- oder Side-Safety-Tests regressieren;
- `main` nicht ohne Verlust fremder Änderungen integrierbar ist;
- der Worktree nicht sauber entfernt werden kann.

## State Machine

`PREPARED -> RED_EVIDENCE -> ECONOMY_AND_DRAW -> FUTURE_ENCOUNTER ->
MULTI_ICE -> HINT_CONTRACTS -> VERIFIED -> MERGED -> CLEANED`

Nur der jeweils nächste Zustand darf betreten werden.

Aktueller Zustand: `VERIFIED`

- P0 abgeschlossen mit Commit `31751964b`.
- P1: acht Zieltests reproduzieren `behavior_regression`; der
  Dr.-Dreff-Gegenfall auf dem falschen Server sowie die sieben bestehenden
  frühen Match-Checkpoints bleiben grün.
- D88 besitzt nur noch eine Corp-Aktion. Der fachliche Zielvertrag ist deshalb
  ein kontrollierter Score-Material-Ersatzdraw mit anschließendem Cleanup,
  nicht die unmögliche Zweischrittfolge Installation plus Draw.
- P2: Die sichtbare Liquiditätsnachfrage ersetzt das selbst erneuernde
  Klick-zu-Credit-Ziel. Der Defense-Plan darf bei realem HQ-Überlauf eine
  gebundene ICE-Installation als Handplatzfreigabe für den anschließenden
  Score-Material-Draw ausgeben; der Draw bleibt eine geplante
  Informationsgrenze. Bereits brechbares Steuer-/Stör-ICE bleibt dabei als
  begrenzte Score-Schutz-Stufe zulässig, ohne eine Rez- oder
  Installationspflicht zu erzeugen.
- P2 abgeschlossen mit Commit `32035d080`.
- P3 abgeschlossen mit Commit `c3f1dcc9f`: Die actor-private Fort-Run-Quote
  deckt nun sowohl eine dauerhafte HQ-ICE-Installation als auch eine temporäre
  HQ-ICE-Begegnung mit dem günstigsten aktuell zahlbaren Folgekostenwert ab.
- P4: Die Ressourcen-Austauschquote bindet sich an das exakt aktuell
  angegangene ICE. Weitere ICE-Schichten werden nach jeder Begegnung aus dem
  dann gültigen Zustand neu bewertet, statt die gesamte Route vorab zu
  behaupten.
- P4 abgeschlossen mit Commit `a102450b0`.
- P5: Corporate Coup weist den tatsächlich konsumierten Vertrag
  `economy.temporary_resource_bank` aus. Dr. Dreffs redundante, nicht
  konsumierte Top-Level-`hiddenInfoPolicy` ist entfernt; die konkrete
  Zielprofil-Policy bleibt erhalten. Deck-Hint-Consumer-Audit, Metadaten-,
  Qualitäts- und Doctrine-Gate sind ohne Befund grün.
- P6: Die eng begrenzte Score-Defense-Kontinuität, endliche
  Liquiditätsnachfrage, Kapazitätsfreigabe mit Draw-Grenze und exakten
  Rez-Quotes sind gemeinsam abgenommen. Die vollständige AI-Suite ist mit
  534/4.360, Engine mit 210/1.824 und Shared mit 1/16 grün. Alle relevanten
  Typechecks, Struktur-, Boundary-, Hint-, Format- und Diff-Gates sind grün.
- Abschlussreview:
  `docs/reviews/ai/match-5f7924-passivity-remediation-final-review-2026-07-30.md`.

## Paketfolge

### P0 – Prozess und Preflight

Ziel:

- Worktree, Branch, Invarianten und Paketfolge fixieren.

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate:

- Prozessartefakt committed, Worktree sauber.

Commit:

- `docs(ai): define match 5f7924 remediation process`

### P1 – Historische rote Evidence und Gegenproben

Ziel:

- Repräsentative spätere Agenda-, Economy-/Handplatz-, Dr.-Dreff- und
  Multi-ICE-Zustände als side-sichere Decision-Checkpoints erfassen.

Arbeit:

- Spätere Netwatch-, Data-Fort-, Hostile-Takeover- und Corporate-Coup-Lagen
  capturen.
- Economy-Sättigung und Handplatz-zu-Draw getrennt belegen.
- D64/D65 als Future-Encounter-Rez-Fall erfassen.
- D107/D108 nur auf fehlende Quote/Evidence prüfen; keine Rez-Pflicht
  behaupten.
- Positive Gegenproben für knappe Finanzierung, nicht vertretbare
  Handkonversion, falschen Server und isoliertes ICE ergänzen.

Checks:

- Fixture-Validierung
- fokussierte Decision-Checkpoint-Tests vor jedem Fix

Done-Gate:

- Fortbestehende Fehler sind als `behavior_regression` rot.
- Gegenproben sind grün.
- Red-Evidence ist separat committed.

Commit:

- `test(ai): capture match 5f7924 passivity regressions`

### P2 – Economy-Sättigung und Handplatz-zu-Draw

Ziel:

- Selbst erneuernde Kreditziele beenden und eine begrenzte
  Handkonversion-vor-Draw-Phase ermöglichen.

Arbeit:

- Exakte offene Finanzierungs-/Reservebedarfe in Economy-Assessments
  verwenden.
- Basic Credit und Economy-Operationen bei gedecktem Bedarf abwerten.
- Operationen dürfen weiterhin als Handkonversion vor relevantem Draw
  dienen.
- Turn-Planner-Phase
  `capacity_release -> scheduled_information_boundary` einführen.
- Die Konversionsaktion muss vom Eigentümerplan als wenigstens vertretbar
  zertifiziert sein.

Checks:

- P1-Economy-/Draw-Checkpoints
- bestehende Economy-, Corp-Plan- und Turn-Planner-Tests
- `@netgrid/ai` Typecheck

Done-Gate:

- Historische rote Fälle grün, Gegenproben unverändert grün.

Commit:

- `fix(ai): bound corp liquidity and plan capacity release`

### P3 – Generischer Future-Encounter-Rez-Support

Ziel:

- Dr.-Dreff-artigen zusätzlichen Fort-Encounter als Engine-zertifizierte
  Defense-Evidence anbieten.

Arbeit:

- Engine-/PlayerView-/LegalAction-Vertrag für aktuellen
  Pre-Success-Rez-Support definieren.
- Kosten, Fortbindung, vorhandenes ICE und zusätzlichen Encounter exakt
  abbilden.
- Defense-Plan konsumiert den Vertrag ohne Kartenname.

Checks:

- Engine-Unit-Tests
- D64/D65 und falscher-Server-Gegenprobe
- Side-Safety-/AI-Typecheck

Done-Gate:

- Relevanter HQ-Rez wird produktiv erwogen; fremder Server bleibt
  ausgeschlossen.

Commit:

- `fix(engine-ai): quote future encounter rez support`

### P4 – Mehrschichtige ICE-Rez-Austauschquote

Ziel:

- Das aktuell angegangene ICE auch in einem Server mit mehreren Schichten
  entscheidbar machen.

Arbeit:

- Aktuelle Runposition und angegangenes ICE statt
  `server.ice.length === 1` als Gültigkeitsgrenze nutzen.
- Sichtbare Breaker, Run-Credits und bereits verbrauchte/verbleibende
  Ressourcen in der aktuellen Quote berücksichtigen.
- Nach jedem Encounter über neue LegalActions neu bewerten.
- Defense-Plan darf je nach Quote rezzen oder bewusst ablehnen.

Checks:

- Engine-Unit-Tests für isoliertes und mehrschichtiges ICE
- D107/D108 als Evidence-/Entscheidbarkeitsfall
- positive und negative Breaker-/Funding-Gegenproben

Done-Gate:

- Kein `resource_exchange_unknown` allein wegen mehrerer ICE.
- Keine Always-Rez-Regression.

Commit:

- `fix(engine-ai): assess approached ice in layered servers`

### P5 – Corporate-Coup- und Dr.-Dreff-Hint-Verträge

Ziel:

- Beide blockierenden Deck-Audit-Befunde beseitigen.

Arbeit:

- Corporate-Coup-Hint an `up_to_amount_if_available` angleichen.
- Dr.-Dreff-`hiddenInfoPolicy` entweder mit echtem Consumer-Vertrag
  verbinden oder als ungenutztes Feld entfernen.
- Abgeleitete Hint-/Inspector-Artefakte regenerieren.

Checks:

- fokussierte Hint-/Consumer-Tests
- verpflichtender Deck-Hint-Consumer-Audit
- AI-Hint-/Ontology-Gates

Done-Gate:

- Der Deck-Audit meldet für beide Karten keinen blockierenden Befund.

Commit:

- `fix(ai-data): align coup and dreff hint contracts`

### P6 – Breite Verifikation und Abschlussdokumentation

Ziel:

- Alle sieben Maßnahmen gemeinsam abnehmen.

Arbeit:

- Finalreview und Evidence aktualisieren.
- Dauerhafte Plan-/Quote-Verträge in Wissensbasis und Monatslog
  zurückführen.

Checks:

- alle neuen Decision-Checkpoints
- angrenzende Engine-/AI-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- vollständige `@netgrid/ai`-Suite
- relevante Engine-Suite
- Deck-Hint-Consumer-Audit
- `git diff --check`

Done-Gate:

- Alle Pflichtchecks grün oder ein enger, dokumentierter Blocker.

Commit:

- `docs(ai): close match 5f7924 passivity remediation`

### P7 – Integration und Cleanup

Ziel:

- Arbeitsbranch lokal nach `main` integrieren und Arbeitsressourcen
  nachweislich entfernen.

Arbeit:

- aktuelles `main` in den Branch integrieren, falls nötig;
- finale relevante Checks wiederholen;
- bevorzugt Fast-Forward-Merge nach `main`;
- Main-Zustand prüfen;
- sauberen Worktree entfernen und doppelt verifizieren;
- gemergten Branch mit `git branch -d` löschen.

Done-Gate:

- `main` enthält alle Paketcommits und ist sauber;
- Worktree fehlt in Git-Liste und Dateisystem;
- Arbeitsbranch ist gelöscht.

## Abschlusskriterien

- Alle auf aktuellem Code reproduzierbaren freigegebenen Fehler sind durch
  unveränderte historische Checkpoints abgedeckt und grün.
- Nicht reproduzierbare historische Funde wurden nicht unnötig neu
  implementiert.
- Economy- und Draw-Entscheidungen beruhen auf konkretem Bedarf und
  planmodulzertifizierter Handkonversion.
- Future-Encounter- und Multi-ICE-Rez-Entscheidungen besitzen
  Engine-zertifizierte Evidence.
- Beide Deck-Audit-Blocker sind beseitigt.
- Finalreview, Wissenslog, Merge und Cleanup sind abgeschlossen.

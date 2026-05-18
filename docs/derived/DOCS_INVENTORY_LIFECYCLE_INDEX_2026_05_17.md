# docs-Inventar und Lebenszyklus-Index 2026-05-17

## Zweck

Dieses Inventar ordnet den getrackten Bestand unter `docs/` nach Pfadgruppe, Dokumenttyp, Themenbezug und empfohlener Lebenszyklus-Kategorie ein. Es ist eine Arbeitsgrundlage für spätere Verdichtung, Archivierung, Linkprüfung und Git-Hygiene; es verschiebt, löscht oder entversioniert selbst keine Dateien.

## Stichtagsbasis

- Erhebung: 2026-05-17 im Worktree `C:\Projekte\NETGRID_PARALLEL\worker-5`.
- Primärbefehl: `git ls-files -- docs`; Bestandszählung vor Anlegen dieses Inventar-Artefakts und vor dem Activity-Move nach `done`.
- Getrackte Dateien unter `docs/`: 948.
- Davon unter `docs/derived/`: 749.
- Ungetrackte Dateien unter `docs/`: keine.
- Dateitypen: 902 Markdown, 32 PNG, 5 TXT, 3 `.gitkeep`, 3 PDF, 2 JSON, 1 SVG.

Der Paketkontext nannte noch 819 getrackte `docs/`-Dateien und 712 unter `docs/derived/`. Die Differenz ist kein Fehler dieses Inventars, sondern ein neuer Stichtagsbefund im parallelen Worktree.

## Lebenszyklus-Kategorien

| Kategorie | Bedeutung |
| --- | --- |
| `keep-active` | Aktive Steuerungs-, Status-, Index- oder Arbeitsdokumente; sie bleiben direkt gepflegt. |
| `keep-source` | Quellennahe oder unveränderte Ausgangsdokumente; sie bleiben als Belege erhalten. |
| `keep-evidence` | Review-, Test-, Audit-, Gate- oder Nachweisdokumente; sie bleiben bis zu einem verlinkten Rollup erhalten. |
| `condense` | Inhaltlich wertvoll, aber in Menge oder Detailgrad rollup-fähig; erst verdichten, dann über Retention entscheiden. |
| `archive` | Historisch relevant, nicht mehr führend; behalten oder in klar gekennzeichnete Archivstruktur überführen. |
| `git-remove-after-condense` | Kandidat für spätere Entversionierung oder Entfernung aus Git, aber erst nach Rollup, Linkprüfung und expliziter Entscheidung. |
| `do-not-version` | Laufzeitdaten, Caches, Secrets oder generierte lokale Artefakte; aktuell im getrackten `docs/`-Bestand nicht festgestellt. |
| `needs-decision` | Fachliche oder rechtliche Entscheidung nötig, bevor Lifecycle oder Zielort festgelegt werden kann. |

## Pfadgruppen-Inventar

| Pfadgruppe | Anzahl | Dateityp(en) | Release-/Themenbezug | Vermuteter Dokumenttyp | Lebenszyklus | Führender Nachfolger oder Rollup-Kandidat |
| --- | ---: | --- | --- | --- | --- | --- |
| `docs/README.md` | 1 | Markdown | Dokumentationsstruktur | Einstieg und Ordnerindex | `keep-active` | Bleibt Einstieg; dieses Inventar ergänzt die Lifecycle-Sicht. |
| `docs/source/` | 11 | Markdown, TXT, PDF | Primärquellen, Spoiler, Regelreferenz, Testdeck | Quellenbestand | `keep-source` | Bleibt führende Quelle für Roh-/Quellmaterial; Index in `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`. |
| Root-Quellkopien: `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `docs/NETGRID_MVP_0.2_Plan.md`, `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` | 3 | Markdown, PDF | frühe MVP- und Regelquellen | Doppelte Root-/Source-Dateien | `git-remove-after-condense` | Hashgleich zu `docs/source/*`; Entfernung nur nach Linkprüfung und Git-Policy-Entscheidung. Bestehender Bezug: erledigtes Paket `act-2026-05-17-docs-root-source-duplicates-cleanup`. |
| Weitere Root-Altdateien: `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`, `docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md` | 2 | Markdown | frühe Codex-/Testkonzeptphase | historischer Steuerungs-/Testbestand | `archive` | Bei späterem Archivschnitt gegen `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` und moderne Testmatrizen abgleichen. |
| `docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/` | 15 | Markdown | frühe MVP-0.1/0.2-Spezifikation, Tests, Betrieb, Planung | historisches Dokumentenpaket | `archive` | Historischer Paket-Rollup oder Archivindex; keine fachliche Führungsrolle gegenüber aktueller Wissensbasis und `docs/derived/`. |
| `docs/codex/CODEX_STATUS.md` | 1 | Markdown | aktueller Projektstatus, Chronik, Gates | Status- und Steuerungsdokument | `keep-active`, zusätzlich `condense` | Bleibt aktiv, ist aber rollup-/chronikreif. Bestehender Folgehinweis: `act-2026-05-17-docs-codex-status-chronicle-split`. |
| `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` | 1 | Markdown | frühe Codex-Ausführung | Runbook | `archive` | Historische Referenz; bei Runbook-Neuschnitt nur noch gezielt verlinken. |
| `docs/codex/GOAL_HISTORY.md` | 1 | Markdown | Ziel-/Arbeitsverlauf | Arbeitschronik | `condense` | Kandidat für Status-/Chroniksplit gemeinsam mit `CODEX_STATUS.md`. |
| `docs/KI-Player/` | 1 | Markdown | KI-Releaseplanung | KI-Briefing | `archive` oder `needs-decision` | Gegen aktuelle AI- und Doctrine-Artefakte in `docs/derived/AI_*.md` abgleichen. |
| `docs/activities/README.md` und `docs/activities/templates/` | 2 | Markdown | Activity-Board-Prozess | Prozess- und Templatebestand | `keep-active` | Bleibt führend für Boardmodell, Claim, Retention und Inbox-Vereinfachung. |
| `docs/activities/inbox/` | 18 getrackte Dateien | Markdown, `.gitkeep` | offene Arbeitspakete | Arbeitsboard | `keep-active` für aktive Auswahl; optional untracked vor Claim | Die Inbox darf laut Boardregel bewusst untracked bleiben. Aktueller Stichtag: keine ungetrackten Inbox-Dateien, aber das Modell bleibt gewollt und ist kein Befund. |
| `docs/activities/in-progress/` | 6 | Markdown | beanspruchte Pakete | Arbeitsboard-Claims | `keep-active` bis Abschluss oder Blocker | Nach Abschluss nach `docs/activities/done/`; keine Dauerartefakte hier verstecken. |
| `docs/activities/done/` | 102 | Markdown, `.gitkeep` | abgeschlossene Einzelpakete | Ergebnisnachweise | `keep-evidence`, später `condense` | Periodische Monats-/Themenrollups; nur danach Retention-Entscheidung. |
| `docs/derived/README.md` | 1 | Markdown | abgeleitete Artefakte | Ordnerbeschreibung | `keep-active` | Bleibt kurze Ordnerregel; dieses Inventar ergänzt die Retention-Sicht. |
| `docs/releases/mvp/` mit ehemaligen MVP-0.x-Derived-Dateien und frühen MVP-Spezifikationen | ca. 155 | Markdown | MVP 0.1 bis 0.99, Roadmaps, M1/M2, Mechanikgrundlagen | Pläne, Requirements, Specs, Testmatrizen, Reviews | `keep-evidence`, zusätzlich `condense` | MVP-0.x ist seit 2026-05-18 nach `docs/releases/mvp/` migriert; kanonischer Einstieg ist `docs/releases/mvp/README.md`. |
| `docs/releases/v1/` mit ehemaligen `docs/derived/V1_0_*` bis `V1_9_*` | mehrere Dutzend | Markdown | Stabilisierung, UX, Storage, Hardening, Setup, Archives, Mechanics-AI-Baseline, Event/Replacement, Special Zones, Format, Card Data Pipeline, KI, Belief, Simulation, Replay, Tutorial, Mechanikpakete, Originalset-Completion | Releasepläne, Requirements, Specs, Reviews, Smokes, Automationsartefakte | `keep-evidence`, teilweise `condense` | V1.0 bis V1.9.22 ist seit 2026-05-18 nach `docs/releases/v1/` migriert; kanonischer Einstieg ist `docs/releases/v1/README.md`. |
| `docs/releases/v2/` mit ehemaligen V2-Derived-Dateien | mehrere Verträge und Reviews | Markdown | Auth, Datenschutz, Cloud-Decks, Public Lobby, Chat, Moderation, Replay, Observability | Plattform- und Datenschutzverträge | `keep-active` | V2.x ist seit 2026-05-18 nach `docs/releases/v2/` migriert; kanonischer Einstieg ist `docs/releases/v2/README.md`, Gate-Rollup `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md`. |
| `docs/derived/PROTEUS_*` | 8 | Markdown | Proteus-Import und Mechanikplanung | Importberichte, Verträge, Coverage-Analysen | `keep-active` oder `keep-evidence` | Proteus-Coverage-/Mechanikrollup nach Entscheidung über variable ICE, Hidden Resources, Bad Publicity und Counter-Verträge. |
| `docs/derived/AI_*` und KI-bezogene Reports | ca. 20 | Markdown | AI-Hints, Doctrine, Benchmarks, DecisionDebug, Visible Run | Analyse- und Reviewberichte | `keep-evidence`, aktuelle Diagnosepfade `keep-active` | AI-Rollen-/Benchmark-Rollup; keine Hidden-Info- oder Live-KI-Vertragsänderung aus diesem Inventar. |
| `docs/releases/special/s01/` | 8 | Markdown | Spielende, Ergebnisfenster, Matchserie, Audio | Release-Index plus Sonderphasenartefakte | `keep-evidence`, später gezielt `condense` | Am 2026-05-18 aus sieben `docs/derived/S01_*`-Artefakten plus Rollup migriert; kanonischer Einstieg ist `docs/releases/special/s01/README.md`. |
| `docs/derived/BACKEND_0_5_*` | mehrere Dateien | Markdown | private Storage-Maintenance | Backend-/Ops-Zwischenrelease | `keep-evidence`, teilweise `condense` | Bestehender Bezug: `act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan` ist erledigt; Rollup als führender Backend-0.5-Nachweis möglich. |
| `docs/reviews/originalset-spotchecks/` | 42 | Markdown | Originalset-Spotchecks | Register, Rollup und Detailberichte | `keep-active` für Register/Rollup, `keep-evidence` für Detailberichte | Am 2026-05-18 aus `docs/derived/ORIGINALSET_CARD_SPOTCHECK_*` migriert; kanonischer Einstieg ist `docs/reviews/originalset-spotchecks/README.md`. |
| `docs/archive/originalset-spotcheck-jobs/2026-05/` | 39 | Markdown | Originalset-Spotchecks | abgeschlossene Einzeljob-Nachweise | `archive`, später optional `git-remove-after-condense` | Bestehender Bezug: `act-2026-05-17-docs-spotcheck-evidence-rollup`; die Jobs sind nach Rollup und Linkcheck archiviert und bleiben für Commit-/Arbeitsnachweise auffindbar. |
| `docs/derived/*_IMPLEMENTATION_REVIEW.md`, `*_FINAL_REVIEW.md`, `*_TEST_MATRIX.md`, `*_REQUIREMENTS.md`, `*_SPEC.md` | viele | Markdown | releaseübergreifend | formale Dauerartefakte | `keep-evidence` | Nicht pauschal archivieren; je Releasekette nur nach führendem Rollup und Linkprüfung verdichten. |
| `docs/ui-designsets/` | 35 | Markdown, PNG, SVG | UI-/Branding-Exploration, Logo-Referenzen | Design-Exploration und Bildbelege | `keep-evidence`, teilweise `needs-decision` | Bestehender Folgehinweis: `act-2026-05-17-docs-designsets-curation`. Asset-/Rechtsgate bleibt vor öffentlicher Nutzung maßgeblich. |

## Doppelte Root-/Source-Dateien

Die drei Root-Dateien `NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `NETGRID_MVP_0.2_Plan.md` und `Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` sind hashgleich zu ihren Gegenstücken unter `docs/source/`. Sie sind deshalb keine inhaltliche Quelle zweiter Ordnung, sondern Duplikate mit Link- und Historienrisiko.

Empfehlung: `docs/source/*` bleibt führend. Root-Duplikate erst nach Linkprüfung, Rollup- oder Git-Policy-Entscheidung entfernen oder archivieren; dieses Inventar nimmt keine Entfernung vor.

## Ungetrackte Activity-Inbox

Das Boardmodell aus `docs/activities/README.md` erlaubt ausdrücklich, dass `docs/activities/inbox/` bewusst untracked bleibt, solange Pakete lose Vorschläge sind. Diese Vereinfachung ist ein beabsichtigter Konflikt- und Git-Hygiene-Mechanismus, kein Qualitätsproblem.

Stichtagsbefund in diesem Worktree: `git ls-files --others --exclude-standard -- docs` meldet keine ungetrackten `docs/`-Dateien. Das Inventar dokumentiert trotzdem die erlaubte ungetrackte Inbox, damit spätere Checks sie nicht als Verstoß behandeln.

## Verdichtungs- und Archivierungsfolge

1. `docs/codex/CODEX_STATUS.md` und `docs/codex/GOAL_HISTORY.md` chronologisch und thematisch trennen, bevor weitere Statusblöcke wachsen.
2. `docs/activities/done/` monatlich oder thematisch rollupen; Einzelpakete erst danach auf Retention prüfen.
3. `docs/derived/` zuerst entlang bestehender Releaseketten verdichten: Proteus und AI bleiben offen. MVP-0.x ist seit 2026-05-18 nach `docs/releases/mvp/` migriert; V2-Plattformverträge sind seit 2026-05-18 nach `docs/releases/v2/` migriert.
4. Root-/Source-Duplikate erst nach Linkprüfung behandeln.
5. `docs/ui-designsets/` nur nach Asset-/Rechts- und Produktentscheid kuratieren; Bilddateien nicht pauschal entfernen.

## Benannte Folgepakete

Bestehende Pakete decken die wichtigsten Folgeschritte bereits ab:

- `act-2026-05-17-docs-codex-status-chronicle-split`
- `act-2026-05-17-docs-derived-automation-archive`
- `act-2026-05-17-docs-derived-s01-rollup-proposal`
- `act-2026-05-17-docs-derived-v1-0-small-release-rollup-proposal`
- `act-2026-05-17-docs-designsets-curation`
- `act-2026-05-17-docs-git-policy-sources-artifacts`

Neu sichtbar, aber noch nicht als Paket angelegt:

- `docs-derived-v1-9-originalset-rollup`: führenden Rollup für V1.9.10 bis V1.9.22 nach Abschluss der Kette schneiden.
- `docs-derived-v2-contract-index`: erledigt durch Migration nach `docs/releases/v2/` mit `README.md` und Gate-Inventar.
- `docs-activities-done-retention-rollup-2026-05`: erledigte Activity-Pakete des Monats Mai 2026 in einen Retention-Rollup überführen.

Diese Folgepakete sind Empfehlungen aus dem Inventar. Sie verändern keine Engine-, Hidden-Info-, LegalAction-, Replay- oder StateHash-Verträge.

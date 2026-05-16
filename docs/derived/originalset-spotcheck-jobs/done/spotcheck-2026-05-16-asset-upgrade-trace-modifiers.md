---
jobId: spotcheck-2026-05-16-asset-upgrade-trace-modifiers
status: done
createdAt: 2026-05-16T10:59:00+01:00
startedAt: 2026-05-16T12:56:00+02:00
completedAt: 2026-05-16T18:18:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_308_acme-savings-and-loan
    title: ACME Savings and Loan
  - cardId: onr_v1_329_investment-firm
    title: Investment Firm
  - cardId: onr_v1_324_fortress-architects
    title: Fortress Architects
  - cardId: onr_v1_319_disinfectant-inc
    title: Disinfectant, Inc.
  - cardId: onr_v1_364_omni-kismet-ph-d
    title: Omni Kismet, Ph.D.
  - cardId: onr_v1_370_tesseract-fort-construction
    title: Tesseract Fort Construction
  - cardId: onr_v1_011_cloak
    title: Cloak
  - cardId: onr_v1_205_main-office-relocation
    title: Main-Office Relocation
  - cardId: onr_v1_150_access-to-kiribati
    title: Access to Kiribati
  - cardId: onr_v1_212_priority-requisition
    title: Priority Requisition
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-asset-upgrade-trace-modifiers

## Auswahlprüfung

Geprüfte Deduplizierungsquellen: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` sowie alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/inbox/`, `in_progress/`, `done/` und `blocked/`.

Die zehn ausgewählten Card IDs kamen in diesen Quellen nicht vor. Die Auswahl wurde aus dem versionierten Runtime-Release-Gate `packages/catalog/src/catalog-gates.ts` abgeleitet; alle zehn Karten sind dort Teil der decklegalen Runtime-Releasekarten. Der lokale private Katalog unter `data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json` war wegen eines `@@`-Fragments nicht als JSON nutzbar, ist aber keine primäre Queue-/Register-Dedupe-Quelle dieses Generatorlaufs.

Auswahlfokus: komplexe, bereits decklegale Originalset-Karten mit hohem Risiko in persistenten Zuständen, Payment-/Counter-Pools, Trace-/Link-Fenstern, servergebundenen Modifiern, PublicPayload, Chronik und Replay/StateHash.

## Kartenbefunde

### onr_v1_308_acme-savings-and-loan - ACME Savings and Loan

Bewertung: Engine
: Sehr komplexer Asset-Pfad mit Agenda-Punkt-Rezkosten, On-Rez-Creditgain, Self-Trash, persistentem End-of-turn-Tax, Lose-the-game-Branch und separater 12-Credit-Entfernungsaktion. Besonders riskant sind Source-Bindung nach Self-Trash, mehrfaches Rezzen, Zahlung aus falscher Seite und Action-Window-Drift.

Bewertung: Chronik
: Die Chronik muss die Agenda-Punkt-Kosten, den 12-Credit-Gain, den Self-Trash, die aktive Dauerlast, End-of-turn-Zahlung bzw. Verlust und die spätere Entfernung als getrennte, quellgebundene Einträge zeigen.

Bewertung: Tests
: Bestehende Tests decken ACME-Funktionen an, aber ein Spotcheck sollte die vollständige Lebensdauer inklusive Self-Trash-Quelle, mehrfacher Kopien, Removal-Aktion und Lose-the-game-Fall fokussiert nachziehen.

Bewertung: Hidden-Info/Replay/StateHash
: Keine verdeckten Kartendaten nötig. Replay-Risiko liegt in persistenten Markern nach dem Self-Trash und in deterministischer End-of-turn-Auflösung.

Bewertung: Fehlende Härtungen
: Revalidierung für Agenda-Punkt-Kosten, removed source, falsche Seite, stale `stateVersion`, doppelte Removal-Aktion, Creditmangel am End-of-turn und Payload ohne private State-Snapshots.

Notwendige Umsetzung
: Ergänze fokussierte Engine-/Chroniktests und ggf. fehlende Guards für ACME-Lifecycle, Self-Trash-Persistence und Removal.

Akzeptanzkriterien
: `applyAction` lehnt wrong-side/stale/removed-source ab; PublicPayload enthält nur öffentliche Quellen, Beträge und Marker; Replay/StateHash bleibt über Rez, Tax, Removal und Lose-the-game identisch.

### onr_v1_329_investment-firm - Investment Firm

Bewertung: Engine
: Rezzed Transaction Asset mit Stored-/Recurring-Credit-Oberfläche und Start-of-turn-Refresh. Risiko liegt in Counter-Akkumulation, falscher Refresh-Reihenfolge, mehrfachen Kopien und Zahlung aus nicht erlaubten Pools.

Bewertung: Chronik
: Creditpool-Erzeugung, Verbrauch und Refresh müssen sichtbar genug sein, ohne interne Poolstrukturen oder nicht öffentliche Zahlungsoptionen offenzulegen.

Bewertung: Tests
: V1.9.17 erwähnt Recurring-Asset-Refresh, aber der Einzelpfad sollte source-bound, copy-bound und turn-bound geprüft werden.

Bewertung: Hidden-Info/Replay/StateHash
: Der Pool ist öffentlich auf dem gerezzten Asset; Replay-Risiko entsteht durch Start-of-turn-Autorefresh und mehrere parallele Quellen.

Bewertung: Fehlende Härtungen
: Tests für zwei Investment-Firm-Kopien, verbrauchte vs. unverbrauchte Credits, Run-/Rez-/Install-Zahlungsfenster und Removed-source-Zahlungsversuche.

Notwendige Umsetzung
: Lege einen fokussierten Payment-Pool-Test an und härte die Source-Auswahl, falls Credits aus falschen Assets kombiniert werden können.

Akzeptanzkriterien
: Nur legale Investment-Firm-Pools erscheinen in LegalActions; Verbrauch und Refresh sind source-genau; Chronik und Replay bleiben stabil.

### onr_v1_324_fortress-architects - Fortress Architects

Bewertung: Engine
: Rezzed Asset mit globalem ICE-Install-/Server-Building-Modifier. Riskant sind globale Modifier-Layer, Mehrkopien, Rez-/Trash-Lebensdauer und Auswirkungen auf verschiedene Serverzonen.

Bewertung: Chronik
: Jede Kostenmodifikation sollte Quelle, Ziel und effektiven Betrag zeigen, ohne Installationsentscheidungen der Korp-Hand zu leaken.

Bewertung: Tests
: V1.9.20 nennt Fortress Architects als ersten rezzed globalen ICE-Rez-Kostenmodifier. Ein Spotcheck sollte Zusätzliches prüfen: Mehrkopien, Trash-Cleanup und Interaction mit anderen Kostenmodifikatoren.

Bewertung: Hidden-Info/Replay/StateHash
: Ziel- und Kostenpayload darf keine ungespielten Handkarten offenlegen. StateHash-Risiko liegt im globalen Modifier-Cache nach Trash oder Reconnect.

Bewertung: Fehlende Härtungen
: Removed-source-Cleanup, Modifier-Layer-Reihenfolge, Kostenuntergrenzen, remote vs. central server und PublicPayload für modifizierte Kosten.

Notwendige Umsetzung
: Ergänze Kostenmodifier-Smokes für Install-/Rezfenster, mehrere öffentliche Quellen und Cleanup nach Trash.

Akzeptanzkriterien
: LegalActions zeigen nur aktuell gültige öffentliche Modifikatoren; `applyAction` berechnet Kosten neu; Replay/StateHash ist bei gleicher Aktionsfolge identisch.

### onr_v1_319_disinfectant-inc - Disinfectant, Inc.

Bewertung: Engine
: Asset mit Virus-/Counter-/Purge-/Prevention-Oberflächen. Hauptrisiko ist Zielwahl auf sichtbare Virus-Counter, Counter-Type-Revalidation und Interaktion mit globalem Purge.

Bewertung: Chronik
: Counter-Entfernung muss Quelle, Ziel, Countertyp und Anzahl öffentlich nachvollziehbar machen, aber keine verdeckten Karten oder privaten Zonen berühren.

Bewertung: Tests
: V1.9.17 nennt Disinfectant als sichtbaren Virus-Counter-Zielpfad. Ein Spotcheck sollte Grenzfälle mit leeren Countern, falschem Countertyp, mehreren Virusquellen und Purge-Race prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Ziele sind nur öffentliche installierte Karten oder öffentliche ICE-/Asset-Zustände. Replay-Risiko liegt in Counter-Reihenfolge und gleichzeitigen Counter-Entfernungen.

Bewertung: Fehlende Härtungen
: Wrong-side/stale, Ziel ohne Virus-Counter, Ziel nach Zone-Move, Countertyp-Mismatch und Payload-Leakscan.

Notwendige Umsetzung
: Ergänze Revalidation- und PublicPayload-Tests für Disinfectant-Zielwahl.

Akzeptanzkriterien
: Nur sichtbare Virus-Counter-Ziele sind legal; `applyAction` validiert Ziel und Countertyp erneut; Chronik nennt keine privaten Kartendetails.

### onr_v1_364_omni-kismet-ph-d - Omni Kismet, Ph.D.

Bewertung: Engine
: Rezzed Server-Upgrade mit Tag-Condition-Surfaces. Risiken: Serverbindung, getaggter Runner als Bedingung, Timing von Tag-Verlust zwischen LegalAction und `applyAction`, Trash/Unrez-Cleanup.

Bewertung: Chronik
: Tag-bedingte Effekte müssen den öffentlichen Tag-Status und die Upgrade-Quelle nennen; keine privaten Runner-Handdaten dürfen in Payloads landen.

Bewertung: Tests
: V1.9.18 deckt Tag-Condition-Credit-Pfade generisch ab. Der Einzelspotcheck sollte Omni-spezifische Serverbindung, no-tag-Noop und Tag-Drift prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Tagstatus ist öffentlich; Replay-Risiko liegt bei einmaligen oder servergebundenen Markern im Run-/Access-Kontext.

Bewertung: Fehlende Härtungen
: Tagverlust zwischen Auswahl und Ausführung, falscher Server, getrashte Quelle, unrezzed Quelle, stale state und Payload ohne private Runner-Zonen.

Notwendige Umsetzung
: Ergänze Omni-spezifische Wrong-server-/Tag-drift-/Source-state-Tests.

Akzeptanzkriterien
: LegalActions erscheinen nur bei gerezzter Quelle im passenden Serverkontext; `applyAction` prüft Tagbedingung und Source-Zone neu; Replay bleibt stabil.

### onr_v1_370_tesseract-fort-construction - Tesseract Fort Construction

Bewertung: Engine
: Rezzed Server-Upgrade für servergebundene Root-Effekte. Das Hauptrisiko ist unscharfer Scope: Effekte dürfen nur den installierten Server betreffen und nach Trash nicht weiterwirken.

Bewertung: Chronik
: Servergebundene Modifikatoren müssen Server-ID, Quelle und Anlass nennen, aber keine unrezzed Root- oder ICE-Definitionen anderer Server preisgeben.

Bewertung: Tests
: V1.9.18 deckt generische Root-/Serverfähigkeiten ab. Der Spotcheck sollte Server-Isolation und Cleanup genauer prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Scope-Fehler könnten indirekt Serverinhalte verraten. Replay-Risiko liegt in stabiler Server-ID-Zuordnung nach Install/Trash/Reinstall.

Bewertung: Fehlende Härtungen
: Fremdserver-Negativfall, getrashte Quelle, mehrere Tesseract-Kopien, Reinstall auf anderem Server und Reconnect-Payload.

Notwendige Umsetzung
: Ergänze isolierte Server-Scope-Tests und einen Reconnect-/Replay-Leakscan.

Akzeptanzkriterien
: Effekte wirken nur auf den Hostserver; nach Trash/Reinstall ist kein alter Scope aktiv; PlayerViews enthalten keine fremden Root-Details.

### onr_v1_011_cloak - Cloak

Bewertung: Engine
: Runner-Programm mit drei recurring Credits für Icebreaker-Nutzung während Runs, aber nicht für noisy Icebreaker. Kritisch sind Payment-Filter, Run-Timing, Noisy-Subtype-Erkennung, Refresh und mehrere Cloaks.

Bewertung: Chronik
: Verbrauch und Refresh der Credits müssen als Cloak-Quelle sichtbar werden; die Chronik darf nicht suggerieren, dass beliebige Kosten bezahlt wurden.

Bewertung: Tests
: V1.7.0 und spätere Tests prüfen Stealth/Noisy. Ein Spotcheck sollte mehrere Cloak-Kopien, non-run-Fenster, noisy vs. non-noisy, Breaker-Pump und Breaker-Break getrennt absichern.

Bewertung: Hidden-Info/Replay/StateHash
: Keine Hidden-Zone nötig. StateHash-Risiko entsteht durch temporäre PaymentOptions und Refresh über Turnwechsel.

Bewertung: Fehlende Härtungen
: Falsches Zahlungsfenster, Noisy-Icebreaker-Negativfall, Zahlung für Nicht-Icebreaker-Kosten, stale spend und entferntes Programm.

Notwendige Umsetzung
: Ergänze Payment-Source-Tests für erlaubte und verbotene Cloak-Zahlungen inklusive Refresh.

Akzeptanzkriterien
: LegalActions bieten Cloak-Credits nur für legale nicht-noisy Icebreaker-Kosten im Run an; `applyAction` validiert Filter und Source erneut; Replay/StateHash bleibt stabil.

### onr_v1_205_main-office-relocation - Main-Office Relocation

Bewertung: Engine
: Scored Agenda mit Handlimit- und globalen HQ-Modifier-Oberflächen. Kritisch sind öffentliche ScoreArea-Quelle, Recompute statt Cache, Mehrkopien und Runner-Steal vs. Corp-Score.

Bewertung: Chronik
: Scoring, aktiver Handlimit-Modifier und dessen Auswirkungen am Discard-/Handlimit-Zeitpunkt müssen nachvollziehbar sein.

Bewertung: Tests
: V1.9.20 nennt Main-Office als ersten scored-Agenda-Handlimitmodifier. Der Einzelspotcheck sollte Score/Steal-Unterscheidung, mehrere Quellen und Discard-Phase prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Handlimit wirkt auf private HQ-Handgröße, darf aber keine HQ-Inhalte leaken. Replay-Risiko liegt in automatischen Discard-Choices und öffentlicher Handgrößenprojektion.

Bewertung: Fehlende Härtungen
: Runner-steals-Main-Office-Negativfall, mehrere Corp-Kopien, Agenda verlässt ScoreArea, Handlimit-Recompute nach Reconnect, Discard-Choice-StateVersion.

Notwendige Umsetzung
: Ergänze Handlimit-/ScoreArea-Tests mit Payload-Leakscan.

Akzeptanzkriterien
: Modifier wirkt nur aus öffentlicher Corp-ScoreArea; Discard-LegalActions bleiben private Choices; PublicPayload zeigt Counts/Quelle, keine HQ-Karten.

### onr_v1_150_access-to-kiribati - Access to Kiribati

Bewertung: Engine
: Runner-Resource mit Base-Link für Trace-Interaktionen. Kritisch sind genau eine Base-Link-Quelle, Link-/Trace-Bid-Projektion, mehrere Link-Ressourcen und Tag-/Trace-Fenster nach Install/Trash.

Bewertung: Chronik
: Trace-Bids müssen den effektiven Linkwert und die öffentliche Quelle so zeigen, dass kein privater Runner-Rig-State über das Sichtbare hinaus leakt.

Bewertung: Tests
: V1.9.16 deckt Base-Link/Trace ab; der Spotcheck sollte Mehrquellen-Priorität, Trash-Cleanup und Bid-Limit-Revalidation prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Installierte Resource ist öffentlich; Trace-Entscheidungen und Bids sind öffentlich nach Abgabe. Replay-Risiko liegt in Linkwert-Recompute und Bid-Grenzen.

Bewertung: Fehlende Härtungen
: Mehrere Base-Link-Ressourcen, getrashte Quelle, stale Trace-Bid, falscher Runner, Trace ohne aktives Fenster und Reconnect-Projektion.

Notwendige Umsetzung
: Ergänze Trace-Fenster-Tests für Base-Link-Recompute und Source-Cleanup.

Akzeptanzkriterien
: Effektiver Link wird aus aktuellen sichtbaren Quellen berechnet; `applyAction` lehnt stale/falsche Trace-Bids ab; Replay/StateHash bleibt stabil.

### onr_v1_212_priority-requisition - Priority Requisition

Bewertung: Engine
: Agenda-On-Score-Fähigkeit zum kostenlosen Rezzen eines installierten ICE. Kritisch sind private Korp-Zielwahl, nur installierte unrezzed ICE, kein Rez-Kostenabzug, öffentliche Rez-Auflösung und keine Wahl bei fehlendem Ziel.

Bewertung: Chronik
: Scoring und Free-Rez müssen getrennt nachvollziehbar sein; die Zielwahl darf vor Ausführung keine unrezzed ICE-Definition an den Runner leaken.

Bewertung: Tests
: V1.6.2 deckt Free-Rez. Ein Spotcheck sollte mehrere unrezzed ICE, leere Zielmenge, Ziel-Zone-Drift, Already-rezzed-Negativfall und PublicPayload nach Rez prüfen.

Bewertung: Hidden-Info/Replay/StateHash
: Vor Rez ist die ICE-Identität hidden; die Corp-Choice muss privat sein, die spätere Rez-Auflösung öffentlich. StateHash-Risiko liegt in Choice-Revalidation und Kosten-Noop.

Bewertung: Fehlende Härtungen
: Private Choice Payload, wrong-side/stale, Ziel bereits gerezzt, Ziel nicht installiert, fehlende ICE-Ziele, Rez-Kosten bleiben unverändert, Replay mit gleicher Choice.

Notwendige Umsetzung
: Ergänze On-score-Free-Rez-Härtung für private Choice, Target-Revalidation und Kosten-Noop.

Akzeptanzkriterien
: Runner-View sieht vor Auswahl keine Zieldefinition; `applyAction` prüft Zielstatus erneut; Rez ist kostenlos, öffentlich und replay-/StateHash-stabil.

## Gesamtplan

1. Erst die zehn Karten als fokussierte Regressionseinheit ohne Registeränderung bearbeiten.
2. Pro Karte mindestens einen positiven Pfad und zwei Negativ-/Revalidation-Pfade ergänzen.
3. Für alle Karten PublicPayload-/PlayerView-Leakscan an die neuen oder vorhandenen Tests koppeln.
4. Chroniktests dort ergänzen, wo Kosten, Counter, Link, Persistenz oder On-score-Auflösung bislang nur implizit sichtbar sind.
5. Nach grünen Checks den Umsetzungsbericht in `done/` verschieben und danach erst Register/JSON in einem separaten Umsetzungslauf aktualisieren.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- Gezielt: `packages/engine/src/index.test.ts` für ACME, Cloak, Priority Requisition, Base-Link/Trace und V1.9.17/V1.9.18/V1.9.20 Modifier-Smokes.
- Leakscan: PublicPayload, PlayerView, Reconnect-Payload und Chronicle-Einträge dürfen keine privaten HQ-/R&D-/Grip-/Stack- oder unrezzed ICE-Definitionen vor öffentlicher Auflösung enthalten.

## Umsetzung 2026-05-16

Der Job wurde fachlich umgesetzt und geprüft, bleibt aber wegen der bekannten lokalen `.git`-ACL-Sperre auf `commit_pending`.

Umgesetzte Punkte:

- Priority Requisition öffnet nun eine private Korp-Choice für Free-Rez statt automatisch das teuerste ICE zu rezzen.
- Priority-Requisition-Choice revalidiert ScoreArea-Source, Zielstatus und already-rezzed-/Zone-Drift.
- Omni Kismet, Ph.D. und Disinfectant, Inc. wurden mit Tag-/Counter-Drift-Regressionen nachgehärtet.
- Access to Kiribati wurde im Trace-Fenster als aktuelle Base-Link-Quelle geprüft.
- Bestehende ACME-, Investment-Firm-, Fortress-Architects-, Cloak-, Main-Office- und Tesseract-Regressionen bleiben in der vollen Engine-Suite grün.
- Detailbericht, Register, JSON-Register und Wissenslog aktualisiert.

Grüne Checks:

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Commit-Status:

- Lokaler Commit wurde nach Worktree-Gitdir-Entsperrung erfolgreich erstellt.

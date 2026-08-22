# Kartenbild-Runtime-Performance

Status: in Umsetzung
Quelle: Nutzerauftrag vom 2026-08-22 auf Basis der Kartenbild-Performanceanalyse

## Zielprüfung

Die Vorgabe ist für eine automatische, sequenzielle Umsetzung ausreichend
präzise. Der aktuelle Managed Store besitzt bereits passende WebP-Derivate;
der verbleibende Schwerpunkt liegt auf wiederholter Dateiarbeit, dem
Browser-Cache-Vertrag und einer belastbaren Firefox-orientierten Messung.

## Gesamtziel

Persönliche Kartenbilder werden beim ersten Zugriff fail-closed aus dem
inhaltsadressierten Store aufgelöst und danach innerhalb desselben
Webprozesses ohne erneutes Parsen unveränderter Bindungs- und Asset-Manifeste
und ohne erneutes Hashen unveränderter Blobs bedient. Wiederholte
Browseranzeigen verwenden eine an den aktuellen Collection-Inhalt gebundene
URL und dürfen deshalb immutable aus dem privaten Browsercache kommen.

## Annahmen

- Die Collection-Revision ändert sich bei jeder Binding-Änderung.
- Asset- und Blobdateien bleiben inhaltsadressiert; nachträgliche lokale
  Änderungen werden über Dateifingerprints erkannt und erneut geprüft.
- Import und Runtime können in unterschiedlichen Prozessen laufen. Cache-
  Invalidierung darf sich deshalb nicht nur auf prozesslokale Write-Hooks
  verlassen.
- Firefox ist der führende lokale Browser für die Abschlussmessung.

## Nicht-Ziele

- keine Engine-, KI-, Replay-, StateHash- oder Decklegalitätsänderung;
- keine Änderung an privaten Bildrechten oder Asset-Gates;
- keine neue Remote-Laufzeitquelle, kein Service Worker und kein IndexedDB;
- keine pauschale Virtualisierung oder ein Redesign des Deckeditors ohne
  verbleibenden Messbefund;
- keine erneute Normalisierung des vorhandenen Bildbestands.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Absolute lokale Pfade erscheinen nie in Browserantworten oder sicheren
  Nutzerfehlern.
- Ein Cachetreffer darf nur für einen unveränderten Dateifingerprint gelten.
- Geänderte oder beschädigte Manifeste und Blobs werden erneut validiert und
  fail-closed abgelehnt.
- Verdeckte Karten erhalten weiterhin keine Frontbild-URL und keine
  identifizierenden Ladeattribute.
- Der Hauptworkspace wird ausschließlich für den finalen lokalen Merge
  verwendet.

## Automatische Fehlerbehandlung

- Ein roter Paketcheck wird im aktuellen Paket ursachenbezogen behoben.
- Unabhängige Baselinefehler werden getrennt dokumentiert und nicht in den
  Scope gezogen.
- Eine Änderung des Collection- oder Blobfingerprints verwirft nur den
  betroffenen Cacheeintrag und erzwingt erneute Validierung.
- Follow-ups erweitern kein laufendes Paket stillschweigend.

## Sicherheitsblocker

Gestoppt wird bei einem nicht auflösbaren Konflikt zwischen Performance und
Fail-closed-Integrität, bei einem möglichen Hidden-Info-Leak oder wenn der
Zielpfad des Worktrees beziehungsweise der lokale Integrationsbranch nicht
mehr eindeutig ist. Ein Blockerbericht benennt Ursache und Removal Condition.

## State Machine

`prepared -> runtime_index -> browser_cache -> measured -> verified -> merged -> cleaned`

Nur ein erfolgreiches Done-Gate erlaubt den Übergang in den nächsten Zustand.

## Paketfolge

1. `PERF00` – Prozessvertrag
2. `PERF01` – Prozesslokaler Runtime-Index
3. `PERF02` – Revisionsgebundener Browser-Cache
4. `PERF03` – Firefox-orientierte Evidence und Abschluss

## Paketdetails

### PERF00 – Prozessvertrag

- Ziel: Scope, Invarianten, Gates und Git-Ablauf verbindlich festhalten.
- Eingang: sauberer Hauptworkspace, freier Zielbranch und freier Zielpfad.
- Arbeit: dieses Prozessartefakt und den `/Goal`-Vertrag erstellen.
- Kernartefakt: diese Datei.
- Checks: Dokumentprüfung und `git diff --check`.
- Done-Gate: vollständiger Vertrag liegt committed im Arbeitsbranch.
- Commit: `docs(card-images): plan runtime performance process`

### PERF01 – Prozesslokaler Runtime-Index

- Ziel: unveränderte Collections, Asset-Manifeste und bereits geprüfte Blobs
  ohne wiederholtes vollständiges Lesen beziehungsweise Hashen auflösen.
- Eingang: `PERF00` abgeschlossen.
- Arbeit: pro Store-Root gekapselten Runtime-Cache mit Dateifingerprints,
  gezielter Invalidierung und fail-closed Revalidierung implementieren.
- Kernartefakte: `packages/card-images/src/runtime.ts`, Store-Hilfen und
  fokussierte Runtime-/Store-Tests.
- Checks: direkte Kartenbild-Runtime-Tests, Paket-Typecheck,
  `git diff --check`.
- Done-Gate: wiederholter Lookup nutzt Cache; Binding-, Manifest- und
  Blobänderungen invalidieren sicher; Fehler bleiben fail-closed.
- Commit: `perf(card-images): cache validated runtime lookups`

### PERF02 – Revisionsgebundener Browser-Cache

- Ziel: persönliche Bilder nur unter einer zur aktuellen Collection-Revision
  passenden URL immutable ausliefern.
- Eingang: `PERF01` abgeschlossen.
- Arbeit: serverseitigen Revisionvertrag, clientseitige URL-Bindung und
  sichere Behandlung veralteter Revisionen ergänzen. Generierte und
  lokalisierte Bildpfade behalten ihre bestehenden Verträge.
- Kernartefakte: Kartenbild-API, zentrale `CardImage`-Schicht und fokussierte
  Webtests.
- Checks: Lookup-, Route-, Client- und Hidden-Info-nahe Bildtests,
  Web-Typecheck, `git diff --check`.
- Done-Gate: passende persönliche Revision liefert immutable; fehlende oder
  veraltete Revision wird nicht unter einer falschen immutable URL gecacht;
  Hidden Cards bleiben requestfrei.
- Commit: `perf(web): version personal card image cache`

### PERF03 – Firefox-orientierte Evidence und Abschluss

- Ziel: Wirkung mit einem reproduzierbaren, eng begrenzten Messpfad prüfen und
  nur unmittelbar belegte angrenzende Härtung vornehmen.
- Eingang: `PERF02` abgeschlossen.
- Arbeit: Cold-/Warm-Lookup, Antwortvertrag und relevante Bildmengen messen;
  führende Kartenbildarchitektur auf den aktuellen Derivat- und Cache-Stand
  bringen. Virtualisierung bleibt Follow-up, sofern kein klarer Restbefund
  ihre sofortige Umsetzung verlangt.
- Kernartefakte: fokussierter Benchmark/Test und aktuelle
  Kartenbildarchitektur.
- Checks: direkt änderungsnahe Tests und Typechecks, `git diff --check`.
- Done-Gate: reproduzierbare Vorher-/Nachher-Evidence und aktueller Vertrag
  liegen committed vor.
- Commit: `docs(card-images): record runtime performance evidence`

## Verifikationsregeln

Nach jedem Paket laufen ausschließlich direkte Tests der geänderten Dateien,
unmittelbar betroffener Aufrufer und berührter Verträge. Paket-Typechecks
laufen bei geänderten Typoberflächen. Ein vollständiger Workspace-, Build-
oder E2E-Lauf ist für diesen lokalen Slice nicht automatisch erforderlich.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_CARD_IMAGE_RUNTIME_PERFORMANCE`
- Branch: `codex/card-image-runtime-performance`
- Integration: lokaler `main`, bevorzugt Fast-Forward
- Jedes abgeschlossene Paket erhält genau einen eigenen Commit.
- Vor dem Merge wird aktuelles `main` bei Bedarf in den Arbeitsbranch
  integriert und direkt änderungsnah erneut geprüft.
- Nach erfolgreichem Merge werden Worktree und gemergter Branch entfernt und
  in Git sowie im Dateisystem verifiziert.
- Kein Push und kein Pull Request ohne gesonderten Nutzerauftrag.

## Controller-Prompt-Kern

`/Goal Arbeite den Prozess „Kartenbild-Runtime-Performance“ vollständig und
sequenziell von PERF00 bis PERF03 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die
paketspezifischen AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich
im Worktree C:\Projekte\NETGRID_CARD_IMAGE_RUNTIME_PERFORMANCE auf Branch
codex/card-image-runtime-performance. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe die Paketchecks
aus, committe jedes abgeschlossene Paket und stoppe bei einem
Sicherheitsblocker fail-closed. Nach Abschluss: direkt änderungsnah final
verifizieren, lokal nach main mergen, main prüfen, den sauberen Worktree und
den gemergten Arbeitsbranch entfernen und die Entfernung verifizieren.`

## Abschlusskriterien

- `PERF00` bis `PERF03` sind jeweils geprüft und committed.
- Wiederholte Runtime-Lookups vermeiden nachweislich redundantes Parsing und
  Hashing, ohne Dateiveränderungen zu übersehen.
- Persönliche Bildantworten besitzen nur bei passender Collection-Revision
  einen immutable Cache-Vertrag.
- Direkte Kartenbild- und Webtests sowie betroffene Typechecks sind grün.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree und gemergter Branch sind verifiziert entfernt.

---
activityId: act-2026-05-17-docs-git-policy-sources-artifacts
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/activities/done/act-2026-05-17-docs-git-policy-sources-artifacts.md
checks:
  - git diff --check
---

# Git-Policy für docs-Quellen und Artefakte dokumentieren

## Ziel

Für `docs/` soll eine klare Git-Policy entstehen: welche Quellen, PDFs, Bilder, Screenshots, Smoke-Artefakte, ZIPs und lokalen Daten versioniert werden dürfen und welche bewusst lokal oder ignoriert bleiben.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/source/PrivateScans/` ist ignoriert und enthält lokal 70 PDFs plus 1 ZIP mit ca. 1,7 GiB.
  - `docs/derived/artifacts/` enthält kleine Smoke-JSON/PNG-Evidence-Dateien.
  - `docs/ui-designsets/` enthält PNG-/SVG-Designartefakte mit ca. 38 MiB.
- `.gitignore` enthält bereits Regeln für `docs/source/PrivateScans/`, Playwright-Reports und lokale Card-Image-Artefakte.
- Projektregel: private Secrets, lokale Datenbanken und lokale Runtime-Konfigurationen gehören nicht in versionierte Dateien.

## Scope

- Bestehende Ignore-Regeln und aktuelle docs-Binärartefakte inventarisieren.
- Versionierungsregeln formulieren für:
  - Rohquellen als Text,
  - kleine referenzierte PDFs,
  - private Scans und ZIPs,
  - Screenshots und Playwright-Traces,
  - Smoke-Evidence unter `docs/derived/artifacts/`,
  - UI-/Branding-Designassets,
  - lokale Runtime-Daten, Logs, Caches und Secrets.
- Ergebnis als kurzes Policy-Artefakt oder README-Ergänzung vorschlagen.

## Nicht im Scope

- Keine Änderung an der untracked Activity-Inbox-Regel.
- Keine Aufnahme privater Scans in Git.
- Keine rechtliche Bewertung als endgültige Lizenzfreigabe.
- Keine Löschung bestehender Binärdateien ohne separates Cleanup-Paket.

## Akzeptanzkriterien

- [x] Die Policy unterscheidet `keep-source`, `keep-evidence`, `do-not-version` und `needs-decision`.
- [x] `docs/source/PrivateScans/` bleibt klar `do-not-version`.
- [x] Smoke-Artefakte haben eine Größen- und Evidenzregel.
- [x] UI-/Designassets haben eine Kuratierungsregel.
- [x] Rechtlich heikle Assets werden nicht versehentlich als public-distribution-fähig beschrieben.

## Umsetzungshinweise

- Policy soll pragmatisch und kurz bleiben.
- Bei juristischer Unsicherheit `needs-decision` statt Freigabe setzen.

## Inventur 2026-05-17

Bestehende Ignore-Regeln:

- `.gitignore` hält lokale Umgebungen, Caches, Build-/Testausgaben, Runtime-Daten, SQLite-Dateien, Logs und Secrets aus Git heraus.
- Für `docs/` ist `docs/source/PrivateScans/` explizit ignoriert.
- Playwright-Reports und Testausgaben sind über `playwright-report/` und `test-results/` ignoriert.
- Lokale Card-Image-Artefakte unter `data/local-assets/` sind grundsätzlich ignoriert; nur kuratierte generierte Contact-Sheets/Samples bleiben möglich.

Versionierte docs-Binärartefakte:

- Regel-/Referenz-PDFs: `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`, `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`, `docs/source/Netrunner_Errata_v1.70.pdf`.
- Kleine Smoke-Evidence: `docs/derived/artifacts/v1_5_0_replay_smoke.png`, `docs/derived/artifacts/v1_6_0_tutorial_smoke.png`.
- UI-/Branding-Designassets: PNG-/SVG-Dateien unter `docs/ui-designsets/`.

Private Scanbestände aus `docs/source/PrivateScans/` werden nicht aufgenommen und bleiben lokal.

## Kurze Git-Policy für docs-Quellen und Artefakte

### `keep-source`

- Versioniert werden textbasierte, projektrelevante Quellen unter `docs/source/`, wenn sie als Arbeits- oder Entscheidungsgrundlage dienen und keine privaten Rohscans, Secrets oder lokalen Runtime-Daten enthalten.
- Kleine, stabil referenzierte PDF-Quellen dürfen versioniert bleiben, wenn sie bereits Teil der Projektgrundlage sind oder eine dokumentierte Review-/Regelreferenz bilden.
- Abgeleitete Dauerartefakte wie Requirements, Specs, Reviews, Testmatrizen und Runbooks bleiben als Markdown oder maschinenlesbare Projektdateien versioniert.

### `keep-evidence`

- Kleine Evidence-Dateien unter `docs/derived/artifacts/` dürfen versioniert werden, wenn sie ein Review, Gate oder eine konkrete Regression nachvollziehbar belegen.
- Smoke-Screenshots und JSON-Evidence sollen nur kuratiert versioniert werden: klein, gezielt referenziert, reproduzierbar benannt und ohne Hidden-Info-, Secret-, Token-, lokale Pfad- oder private Datenleaks.
- Playwright-Traces, vollständige Reports, Massenscreenshots und temporäre Testausgaben bleiben außerhalb von Git; aus ihnen wird nur die knappe, notwendige Evidence übernommen.

### `do-not-version`

- `docs/source/PrivateScans/` ist dauerhaft `do-not-version`; private PDFs, ZIPs und Rohscan-Sammlungen bleiben lokal und werden nicht nachträglich in Git aufgenommen.
- Lokale Runtime-Daten, SQLite-Dateien, Logs, Caches, Build-Artefakte, Testausgaben, temporäre Reports, `.env*` außer `.env.example`, Secrets und maschinenlokale Konfigurationen gehören nicht in versionierte docs-Dateien.
- ZIPs, große ungeprüfte Binärsammlungen, private Belege, Rohdaten-Exporte und automatisch erzeugte Massenausgaben werden nicht versioniert, auch wenn sie für eine lokale Analyse nützlich waren.

### `needs-decision`

- UI-/Branding-Designassets unter `docs/ui-designsets/` bleiben nur kuratiert versioniert: Entwürfe, Auswahlstände und kleine Referenzbilder sind zulässig, aber neue Serien, Variantenmengen oder große Bildpakete brauchen eine explizite Ablageentscheidung.
- Rechtlich heikle Assets, fremde Artworks, Logos, Card Frames, Card Backs, externe Kartendatenbank-Inhalte und distributable Asset-Pakete sind nicht durch diese Policy freigegeben. Sie bleiben `needs-decision` bis ein separates Asset-/Rechts-Gate sie bewertet.
- Große PDFs, Archive, Videos, Traces oder Bilderserien mit dauerhafter Relevanz brauchen vor Versionierung eine konkrete Entscheidung zu Quelle, Größe, Zweck, Redaction und Ersatz durch kleinere Evidence.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17.

- Die Activity selbst dokumentiert die kurze Git-Policy, weil der Worker-Auftrag nur diese Datei zur Bearbeitung freigegeben hat.
- `docs/source/PrivateScans/` bleibt eindeutig `do-not-version`; es wurden keine privaten Scans aufgenommen, gelöscht oder rechtlich freigegeben.
- Bestehende Ignore-Regeln und versionierte docs-Binärartefakte wurden als Bestandsinventur zusammengefasst.
- Die Kategorien `keep-source`, `keep-evidence`, `do-not-version` und `needs-decision` definieren den künftigen Umgang mit Quellen, Smoke-Evidence, UI-/Designassets und lokalen Artefakten.

Checks:

- `git diff --check`: grün.

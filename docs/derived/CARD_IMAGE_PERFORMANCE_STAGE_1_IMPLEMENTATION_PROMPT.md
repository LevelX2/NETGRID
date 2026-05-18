# Prompt: Card Image Performance Stage 1

Nutze diesen Prompt für einen Umsetzungsthread.

```text
Arbeite im NETGRID-Projekt C:\Projekte\NETGRID.

Goal: Setze Stufe 1 der Kartenbild-Performance- und Architektur-Härtung vollständig um. Am Ende sollen Bildroute, Cache-Verhalten, serverseitige Bildpfad-Lookups und die wichtigsten UI-Bildladepunkte so gehärtet sein, dass bekannte Kartenbilder beim Wiederanzeigen deutlich weniger unnötige Lade-/Parse-Kosten verursachen, ohne Hidden-Info- oder Asset-Gate-Regeln zu verletzen.

Pflichtkontext:
1. Lies AGENTS.md und AGENTS.local.md falls vorhanden.
2. Gib die aktive Agentenvorgabe aus: release-implementation-agent.
3. Lies die NETGRID-Wissensbasis-Einstiegsdateien.
4. Lies diese Artefakte:
   - docs/derived/CARD_IMAGE_PERFORMANCE_ARCHITECTURE_REQUIREMENTS.md
   - docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md
   - docs/derived/CARD_IMAGE_DISPLAY_0.91_SPEC.md
   - docs/releases/v1/v1-0-6-ui-resource-clarity/resource-card-display-spec.md
   - docs/releases/v1/v1-0-7-browser-e2e-visual-qa/test-matrix.md

Scope:
- Implementiere nur Stufe 1 aus CARD_IMAGE_PERFORMANCE_ARCHITECTURE_REQUIREMENTS.md.
- Prüfe und härte apps/web/app/api/card-images/[cardId]/route.ts.
- Führe einen zentralen serverseitigen cardId-zu-Bildpfad-Lookup ein oder bereite ihn so vor, dass der lokale Snapshot nicht pro Bildrequest neu geparst werden muss.
- Setze sinnvolle Cache-Header:
  - versionierte generierte Bilder dürfen lange privat und immutable gecacht werden,
  - lokale O:NR-Frontbilder ohne URL-Version nutzen private begrenzte Cache-Zeit plus ETag und Last-Modified.
- Führe keine neuen externen oder offiziellen Assets ein.
- Die zwei selbst generierten NETGRID-Rückseiten sind als generische eigene Platzhalter erlaubt; andere Card Backs bleiben ausgeschlossen.
- Hidden Cards dürfen keine Frontbild-URL, keine Asset-ID, keinen Titel, keinen Alttext mit Identität, keine unterscheidbaren data-* Attribute, keine kartenspezifische CSS-Klasse und keinen unterscheidbaren Lade- oder Fehlerzustand bekommen.
- Prüfe die vorhandenen UI-Bildladepunkte in apps/web/app/page.tsx und verwandten Webdateien. Reduziere direkte, verstreute Bildentscheidungen, wenn ein kleiner CardImage-Helper oder eine kleine CardImage-Komponente sinnvoll ist.
- Nutze loading=\"lazy\" und decoding=\"async\" für Listen-/nicht-prioritäre Bilder, sofern fachlich passend.
- Tooltip-Bilder im Bildmodus sollen erst gemountet werden, wenn der Tooltip sichtbar ist oder ein klarer Hover-Intent vorliegt.

Out of Scope:
- keine Thumbnail-Dateigenerierung,
- keine WebP-/PNG-Derivatpipeline,
- kein Deckeditor-Redesign,
- keine Listenvirtualisierung,
- kein Service Worker oder IndexedDB,
- keine Engine-, KI-, Replay-, StateHash- oder Kartenlogikänderungen,
- keine neue öffentliche Asset-Freigabe.

Architekturanforderung:
- Wenn die bestehende Bildlogik zu stark verteilt ist, baue den kleinsten sinnvollen zentralen Weg ein, statt an jeder Stelle weitere Sonderlogik zu ergänzen.
- Bevorzuge eine schmale CardImage-/CardImageService-Vorstufe, die URL, Cache-Modus, Alttext und Fallback zentral entscheidet.
- Match-Payloads, PlayerViews, LegalActions, PublicEvents, KI-Inputs, Replays und StateHash bleiben frei von Bilddaten.

Tests und Messung:
- Ergänze oder aktualisiere Webtests für:
  - Cache-Header der Bildroute,
  - ETag/Last-Modified oder passende immutable-Header,
  - keine Bildroute/kein src/kein alt/title/data-Leak für Hidden Cards,
  - erlaubte selbst generierte Rückseiten bleiben generisch.
- Dokumentiere eine kurze Messnotiz im Umsetzungsbericht: erste Anzeige, erneute Anzeige, Tooltip-Fall und mindestens ein Deckeditor/Katalog-Pfad. Wenn keine Browsermessung automatisierbar ist, dokumentiere die geprüften Request-/Header-Eigenschaften.

Pflichtchecks:
- corepack pnpm --filter @netgrid/web test
- corepack pnpm typecheck
- falls andere Pakete geändert werden, deren relevante Tests ebenfalls
- git diff --check

Dokumentation:
- Erstelle docs/derived/CARD_IMAGE_PERFORMANCE_STAGE_1_IMPLEMENTATION_REVIEW.md mit:
  - umgesetztem Scope,
  - Architekturentscheidung,
  - geänderten Dateien,
  - Cache-Vertrag,
  - Hidden-Info-/Asset-Gate-Nachweis,
  - Messnotiz,
  - Checks,
  - offenen Punkten für Stufe 2.

Abschluss:
- Committe alle zusammengehörigen Änderungen lokal auf main.
- Kein Push.
```

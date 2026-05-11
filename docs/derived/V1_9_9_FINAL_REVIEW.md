# V1.9.9 Final Review – Upgrade-Mechanik-Sprint

## Gate-Ergebnis

Status: `passed`.

Die vier geplanten V1.9.9-Upgrades sind implementiert, im Runtime-Katalog freigegeben, getestet und als maschinenlesbare Release-Artefakte dokumentiert. Die Webclient-Version ist auf `V1.9.9` angehoben.

## Erfüllte Abnahmepunkte

1. Human-Spielbarkeit
   - Aardvark, Bizarre Encryption Scheme, Chester Mix und Chimera sind Runtime-Karten mit `playable_mvp`.
   - Der Catalog-Promotionspfad führt V1.9.9 als eigenes Runtime-Release mit Manifest `card-implementation-manifest-v1.9.9`.
   - Alle neuen Entscheidungen laufen über LegalActions und `applyAction`.
2. KI-Spielbarkeit
   - V1.9.9-Hints sind als `ai_supported` ergänzt.
   - Aardvark- und Chimera-Choice-Pfade werden über side-sichere AI-Inputs beantwortet.
3. Determinismus
   - Aardvark-Choice-Replay reproduziert denselben StateHash.
   - BES-Delay verwendet deterministische State-Marker.
4. Hidden-Info-Schutz
   - Neue Choices enthalten keine verdeckten Gegnerzonen.
   - AI-Tests prüfen side-sichere Inputs für die neuen Choice-Pfade.
5. Scope
   - Keine zusätzliche Karte außerhalb der vier V1.9.9-Upgrades wurde freigegeben.
   - Bestehende AI-Freigaben V1.9.5 bis V1.9.8 bleiben unverändert erhalten.

## Ausgeführte Checks

1. `corepack pnpm --filter @netgrid/engine test`
   - Ergebnis: grün, 200 Tests.
2. `corepack pnpm --filter @netgrid/ai test`
   - Ergebnis: grün, 83 Tests.
3. `corepack pnpm --filter @netgrid/catalog test`
   - Ergebnis: grün, 24 Tests.
4. `corepack pnpm --filter @netgrid/web test`
   - Ergebnis: grün, 71 Tests.
5. `corepack pnpm --filter @netgrid/server test`
   - Ergebnis: grün, 72 Tests.
6. `corepack pnpm typecheck`
   - Ergebnis: grün.
7. `corepack pnpm test`
   - Ergebnis: grün, inklusive Root-Spezifikationen.
8. `corepack pnpm lint`
   - Ergebnis: grün.
9. `corepack pnpm build`
   - Ergebnis: grün. Bekannte nicht-blockierende Turbopack-NFT-Warnung im Web-Build bleibt bestehen.

## Resthinweise

1. `apps/web/app/page.tsx` enthält neben der V1.9.9-Versionsanhebung weiterhin UI-/Tooltip-Änderungen aus einem vorherigen Arbeitsstrang; diese wurden nicht zurückgesetzt.
2. Der Web-Build meldet weiterhin die bekannte Turbopack-NFT-Warnung zum Catalog-Importpfad; sie blockiert den Build nicht.

## Empfehlung

V1.9.9 ist lokal releasebereit.

# Overwatch Nexus - Audit de stabilisation

## Scope
- Surface auditée: frontend Next.js (`overwatch-nexus-web`)
- Objectif: fiabilité recommandations, UX mobile-first, robustesse data, performance perçue

## Problèmes identifiés
- Chargement initial sans gestion d'erreur explicite (risque d'écran vide en cas de réseau KO)
- Moteur de recommandation trop simpliste (counter-only), sans pondération map/rôle/winrate
- Données de winrates non intégrées dans le frontend
- UX incomplète pour exploitation tactique (pas de vue détaillée héros, pas de section map dédiée)
- Faible robustesse des fetchs (pas de timeout applicatif ni cache mémoire local)

## Corrections appliquées
- Ajout d'un état d'erreur de chargement + fallback UI clair
- Ajout d'un état de chargement explicite "synchronisation des données"
- Refactor moteur (`src/lib/engine.ts`):
  - pondération counters
  - pondération par filtre de rôle
  - pondération par mode de map (gamemodes)
  - intégration winrates dans le score final
  - ajout d'un score de confiance
  - extension des résultats top/bottom + picks map
- Refactor data layer (`src/lib/api.ts`):
  - timeout fetch (AbortController)
  - cache mémoire local pour éviter appels redondants
  - ingestion winrates via `public/data/live_winrates.json`
- Refactor UI (`src/app/page.tsx`):
  - filtre de rôle opérationnel
  - section "Recommandations par map"
  - section "Fiche détaillée" (score, confiance, winrate, raisons)
  - meilleures grilles responsive (mobile/tablette/desktop)
- Extension composant carte (`src/components/HeroCard.tsx`):
  - affichage confiance + winrate
  - mode compact

## Vérifications
- `npm run lint`: passe (warnings non bloquants sur balises `<img>`)
- `npm run build`: passe en production

## Limites restantes
- Source Blizzard officielle: intégration live directe non triviale (site dynamique/propriétaire)
- Le frontend consomme actuellement un snapshot local de winrates (`public/data/live_winrates.json`)

## Recommandations suivantes
- Mettre en place un job serveur (cron) qui scrape/normalise les stats Blizzard officielles et publie un JSON versionné
- Introduire `next/image` + configuration domains pour optimiser LCP
- Ajouter tests unitaires sur scoring (`engine.ts`) et tests E2E pour les flows clés

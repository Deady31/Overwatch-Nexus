# Deployment instructions - Overwatch Nexus Web

## 1) Installation
Depuis `overwatch-nexus-web`:

```bash
npm install
```

## 2) Développement local
```bash
npm run dev
```

Puis ouvrir `http://localhost:3000` (ou le port alternatif affiché par Next.js).

## 3) Build production
```bash
npm run build
npm run start
```

## 4) Variables et données
- Winrates frontend: `public/data/live_winrates.json`
- API heroes/maps: `https://overfast-api.tekrop.fr`

## 5) Génération screenshots portfolio
Serveur local lancé, puis:

```bash
node capture-portfolio.mjs
```

Sortie: `portfolio-assets/`

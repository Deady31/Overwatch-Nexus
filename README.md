# Overwatch Dashboard

Ce projet contient deux applications :

- `overwatch-nexus-web` : frontend Next.js (port `3000`)
- `app.py` : dashboard Streamlit (port `8501`)

## Prerequis

- Node.js 20+
- Python 3.10+

## Installation

Depuis la racine du projet :

```bash
npm run install:web
npm run install:py
```

## Lancement

### Frontend web (Next.js)

Depuis la racine :

```bash
npm run dev
```

Ou directement :

```bash
cd overwatch-nexus-web
npm run dev
```

### Dashboard Streamlit

Depuis la racine :

```bash
npm run dev:app
```

Puis ouvrir [http://localhost:8501](http://localhost:8501)

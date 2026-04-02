# Frases

A personal quote collection app built on Cloudflare's edge infrastructure. Save quotes you find on the internet, tag them, and browse them through a clean web interface.

## Stack

- **Backend** — [Cloudflare Workers](https://workers.cloudflare.com/) (TypeScript)
- **Database** — [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge)
- **Frontend** — Vanilla HTML/CSS/JS, no build step required

## Project structure

```
frases-backend/
├── src/
│   └── index.ts        # Worker: REST API
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js          # Fetch-based API client + UI
├── schema.sql          # D1 table definition
├── wrangler.toml       # Cloudflare config
└── package.json
```

## API

Base URL: `https://frases-backend.<your-subdomain>.workers.dev`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/frases` | List all quotes |
| `GET` | `/frases?q=text` | Search by content |
| `GET` | `/frases?etiqueta=tag` | Filter by tag |
| `GET` | `/frases/:id` | Get a single quote |
| `POST` | `/frases` | Create a quote |
| `PUT` | `/frases/:id` | Update a quote |
| `DELETE` | `/frases/:id` | Delete a quote |

**Quote object:**
```json
{
  "id": 1,
  "texto": "The only way to do great work is to love what you do.",
  "etiquetas": "motivation,work",
  "creado_en": "2024-03-15 10:30:00"
}
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Cloudflare account](https://cloudflare.com) (free tier works)
- Wrangler authenticated: `npx wrangler login`

### Setup

```bash
# Install dependencies
npm install

# Create the D1 database
npm run db:create
# Copy the database_id from the output and paste it into wrangler.toml

# Apply the schema
npm run db:migrate

# Start local dev server
npm run dev
```

The worker runs at `http://localhost:8787` and the frontend can be opened directly from `frontend/index.html`.

### Deploy

```bash
# Deploy the worker to Cloudflare
npm run deploy

# Update the production URL in frontend/app.js, then deploy the frontend
# to Cloudflare Pages or any static host
```

## Frontend

The frontend auto-detects the environment: it points to `localhost:8787` when running locally and switches to the production Worker URL otherwise — no build step or environment files needed.

Features:
- List, create, edit, and delete quotes
- Search by text and filter by tag
- Keyboard shortcut: `Ctrl+Enter` to save from the modal
